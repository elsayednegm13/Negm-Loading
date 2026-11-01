import { analysisProfilesEqual } from "../../domain/analysisProfile.js";
import { evidenceBundleForTarget } from "../../domain/evidenceBundle.js";
import { EvidenceFileError, EvidenceIntegrityError, AnalysisSnapshotMismatchError, } from "../../domain/evidenceErrors.js";
import { err, ok } from "../../domain/result.js";
import { AnalysisSnapshotCache } from "./AnalysisSnapshotCache.js";
import { InvestigationRecords } from "../investigation/InvestigationRecords.js";
import { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import { ArtifactReaderFailure } from "../../artifacts/ArtifactReader.js";
import { bindRegularFileCleanup } from "../RegularFileRead.js";
import { writeAnalysisSnapshot as writeSnapshotFile, readAnalysisSnapshot as readSnapshotFile, } from "./AnalysisSnapshotFiles.js";
import { ProviderCleanupError } from "../../domain/providerCleanupError.js";
import { workflowAnalysisProfile } from "../WorkflowAnalysisProfile.js";
import { hasOnlyProfilelessNativeDispatchEntries, isProfilelessNativeDispatchSnapshot, } from "./ProfilelessNativeWorkflowSnapshot.js";
const SNAPSHOT_MUTATION_RECOVERY = "Export session observations through export_evidence_bundle if needed. Close the active target without saving a snapshot, then reopen it before importing or saving a snapshot.";
/** Own binary snapshots and coordinate the composed investigation records. */
export class BinarySessionRecords {
    #records;
    fileResources = new ArtifactResourceScope();
    resourceScope = {
        retain: (owner, resource) => this.fileResources.retain({
            kind: "lease",
            resource,
            lease: { release: () => owner.close() },
        }),
        run: (operation) => this.fileResources.run(operation),
    };
    get hasPendingFileResources() {
        return this.fileResources.hasPending;
    }
    #snapshot = new AnalysisSnapshotCache();
    #snapshotInvalidated = false;
    #snapshotListeners = new Set();
    constructor(records = new InvestigationRecords()) {
        this.#records = records;
    }
    /** Observe changes to the mutable current analysis snapshot resource. */
    onAnalysisSnapshotChanged(listener) {
        this.#snapshotListeners.add(listener);
        return () => this.#snapshotListeners.delete(listener);
    }
    recordEvidence(evidence) {
        const recorded = this.#records.recordEvidence(evidence);
        if (recorded.ok && recorded.value === "added")
            this.#emitSnapshotChanged();
        return recorded;
    }
    hasEvidence(evidenceId) {
        return this.#records.hasEvidence(evidenceId);
    }
    evidenceById(evidenceId) {
        return this.#records.evidenceById(evidenceId);
    }
    /** Borrow immutable investigation Evidence without copying a complete graph. */
    evidenceForAnalysis(evidenceId) {
        return this.#records.evidenceForAnalysis(evidenceId);
    }
    exportEvidenceBundle() {
        return this.#records.exportEvidenceBundle();
    }
    /** Borrow the record owner's immutable bundle for read-only workflows. */
    immutableEvidenceBundle() {
        return this.#records.immutableEvidenceBundle();
    }
    /** Read one snapshot while retaining failed descriptors under this session. */
    readAnalysisSnapshot(path, signal) {
        return readSnapshotFile(path, signal, this.fileResources);
    }
    /** Persist one provider-neutral snapshot under this session's resource owner. */
    writeAnalysisSnapshot(snapshot, path, overwrite) {
        return writeSnapshotFile(snapshot, path, overwrite, this.fileResources);
    }
    /** Retry retained target reads and snapshot files at the owning session shutdown. */
    async closeFileResources() {
        try {
            await this.fileResources.retryCleanup();
            return ok(null);
        }
        catch (cause) {
            const observation = ArtifactReaderFailure.cleanupObservation(cause, "analysis session files");
            const error = new ProviderCleanupError("rea", observation.resources, { reason: observation.reason }, { cause, operation: "close_binary" });
            bindRegularFileCleanup(cause, error);
            return err(error);
        }
    }
    importEvidenceBundle(bundle) {
        const imported = this.#records.mergeEvidenceBundle(bundle);
        if (!imported.ok)
            return imported;
        this.#snapshot.refreshEvidenceMetadata(imported.value.replacements);
        if (imported.value.changed)
            this.#emitSnapshotChanged();
        return ok(imported.value.recordsAdded);
    }
    exportAnalysisSnapshot() {
        const active = this.activeAnalysisBinding();
        if (this.#snapshotInvalidated)
            return err(new EvidenceIntegrityError("Analysis snapshots are unavailable because analysis metadata may have changed", {
                userMessage: `Analysis snapshots are unavailable because analysis metadata may have changed. ${SNAPSHOT_MUTATION_RECOVERY}`,
            }));
        const target = active?.target;
        const profile = active?.profile ?? active?.profilelessWorkflowProfile ?? undefined;
        if (target !== undefined && profile === undefined)
            return err(new EvidenceIntegrityError("Analysis snapshots require a concrete provider analysis profile"));
        if (active?.profile === null &&
            (target === undefined ||
                profile === undefined ||
                !this.#snapshot.matches(target, profile) ||
                this.#snapshot.entries().length !== 0 ||
                !hasOnlyProfilelessNativeDispatchEntries(this.#snapshot.workflowEntries(), profile)))
            return err(new EvidenceIntegrityError("Profileless native snapshots may contain only current dispatch workflow observations"));
        return this.#snapshot.export(target, profile, target === undefined
            ? this.#records.exportEvidenceBundle()
            : evidenceBundleForTarget(this.#records.exportEvidenceBundle(), target.sha256));
    }
    importAnalysisSnapshot(snapshot) {
        const active = this.activeAnalysisBinding();
        if (active !== undefined && this.#snapshotInvalidated)
            return err(new EvidenceIntegrityError("Analysis snapshots cannot be imported because analysis metadata may have changed", {
                userMessage: `Analysis snapshots cannot be imported because analysis metadata may have changed. ${SNAPSHOT_MUTATION_RECOVERY}`,
            }));
        const profile = active?.profile ?? active?.profilelessWorkflowProfile;
        if (active?.profile === null &&
            (profile === undefined ||
                !isProfilelessNativeDispatchSnapshot(snapshot, active.target, profile)))
            return err(new AnalysisSnapshotMismatchError("Analysis snapshot profile_mismatch: the snapshot is not bound to the active native dispatch reader"));
        const imported = this.#snapshot.import(snapshot, active === undefined
            ? undefined
            : profile === undefined
                ? undefined
                : { target: active.target, profile }, (bundle) => {
            const imported = this.#records.mergeEvidenceBundle(bundle);
            if (!imported.ok)
                return imported;
            this.#snapshot.refreshEvidenceMetadata(imported.value.replacements);
            return ok(imported.value.recordsAdded);
        });
        if (imported.ok)
            this.#emitSnapshotChanged();
        return imported;
    }
    matchesSnapshot(target, profile) {
        return this.#snapshot.matches(target, profile ?? undefined);
    }
    selectSnapshot(target, profile) {
        this.#snapshot.select(target, profile);
        this.#emitSnapshotChanged();
    }
    lookupSnapshot(target, profile, operation, parameters) {
        if (this.#snapshotInvalidated)
            return undefined;
        return this.#snapshot.lookup(target, profile, operation, parameters);
    }
    recordSnapshot(input) {
        if (this.#snapshotInvalidated)
            return;
        this.#snapshot.record(input);
        this.#emitSnapshotChanged();
    }
    /** Retain one derived workflow result alongside its provider cache entries. */
    recordWorkflowSnapshot(input) {
        const active = this.activeAnalysisBinding();
        if (active === undefined)
            return err(new EvidenceIntegrityError("Workflow snapshot entries require an active concrete provider profile"));
        if (this.#snapshotInvalidated)
            return ok(null);
        const profile = active.profile ?? active.profilelessWorkflowProfile;
        if (profile === undefined ||
            !analysisProfilesEqual(profile, input.bindingProfile) ||
            !analysisProfilesEqual(input.execution.analysisProfile, workflowAnalysisProfile(profile, input.operation)) ||
            (active.profile === null &&
                input.operation !== "inspect_native_dispatch_metadata"))
            return err(new EvidenceIntegrityError("Workflow snapshot entry does not match the active reader profile"));
        try {
            this.#snapshot.recordWorkflow({
                target: active.target,
                profile,
                ...input,
            });
            this.#emitSnapshotChanged();
            return ok(null);
        }
        catch (cause) {
            return err(new EvidenceIntegrityError(cause instanceof Error
                ? cause.message
                : "Workflow snapshot entry validation failed", { cause }));
        }
    }
    invalidateSnapshot() {
        this.#snapshot.clear();
        this.#snapshotInvalidated = true;
        this.#emitSnapshotChanged();
    }
    resetSnapshotInvalidation() {
        if (!this.#snapshotInvalidated)
            return;
        this.#snapshot.clear();
        this.#snapshotInvalidated = false;
        this.#emitSnapshotChanged();
    }
    clearSnapshot() {
        this.#snapshot.clear();
        this.#emitSnapshotChanged();
    }
    clearSessionRecords() {
        this.#records.clear();
        this.#snapshot.clear();
        this.#snapshotInvalidated = false;
        this.#emitSnapshotChanged();
    }
    #emitSnapshotChanged() {
        for (const listener of this.#snapshotListeners) {
            try {
                const notification = listener();
                if (notification !== undefined)
                    void notification.catch((cause) => {
                        // best-effort cleanup: async observer notifications must not reject unhandled.
                        void cause;
                    });
            }
            catch (cause) {
                // External resource observers are best-effort; one callback must not
                // make a committed evidence mutation appear to fail.
                void cause;
            }
        }
    }
    recordUnknown(input) {
        const target = this.activeAnalysisBinding()?.target;
        const recorded = this.#records.recordUnknown(input, target);
        if (recorded.ok)
            this.#emitSnapshotChanged();
        return recorded;
    }
    recordEvidenceWithUnknown(evidence, input) {
        const recorded = this.#records.recordEvidenceWithUnknown(evidence, input);
        if (recorded.ok)
            this.#emitSnapshotChanged();
        return recorded;
    }
    updateUnknown(input) {
        const target = this.activeAnalysisBinding()?.target;
        const updated = this.#records.updateUnknown(input, target);
        if (updated.ok)
            this.#emitSnapshotChanged();
        return updated;
    }
    listUnknowns(filters = {}) {
        return this.#records.listUnknowns(filters);
    }
    listUnknownsPage(query = {}) {
        return this.#records.listUnknownsPage(query);
    }
    verifyUnknownResolution(unknownId) {
        return this.#records.verifyUnknownResolution(unknownId);
    }
}
