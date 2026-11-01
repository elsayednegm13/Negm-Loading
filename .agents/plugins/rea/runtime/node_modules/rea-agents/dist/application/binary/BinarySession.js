import { randomUUID } from "node:crypto";
import { analysisProfilesEqual, } from "../../domain/analysisProfile.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { err, ok } from "../../domain/result.js";
import { createAnalysisExecutionEvidence } from "../../domain/analysisObservation.js";
import { OFFICIAL_TOOL_CONTRACTS } from "../../contracts/officialToolContracts.js";
import { ENHANCED_TOOL_CONTRACTS } from "../../contracts/enhancedToolContracts.js";
import { SessionProviderRouter, } from "./SessionProviderRouter.js";
import { InvestigationRecords } from "../investigation/InvestigationRecords.js";
import { recordEvidenceSources } from "../investigation/recordEvidenceSources.js";
import { BinarySessionRecords } from "./BinarySessionRecords.js";
import { binarySessionStatus } from "./BinarySessionStatus.js";
import { resolveSessionOpen, resolveSessionTarget, validateResolvedSessionTarget, } from "./BinarySessionOpen.js";
import { bindExecutionTarget, commitExecutionProfile, prepareSessionExecution, } from "./BinarySessionExecution.js";
import { closeAnalysisClient } from "../../providers/AnalysisClientCleanup.js";
import { analysisErrorWithCleanupFailure } from "../../domain/analysisErrorCleanup.js";
import { ProviderAdapterError } from "../../domain/providerAdapterError.js";
import { profilelessNativeDispatchProfile } from "./ProfilelessNativeWorkflowSnapshot.js";
import { AnalysisSnapshotMismatchError } from "../../domain/evidenceErrors.js";
import { parseBinaryTarget, } from "../BinaryTargetResolver.js";
import { resolveAppBundleResourceRoot, } from "../AppBundleExecutable.js";
import { BUNDLE_RESOURCE_OPERATIONS, } from "./BundleResourceSession.js";
const OFFICIAL_OPERATIONS = new Set(OFFICIAL_TOOL_CONTRACTS.map(({ name }) => name));
const ENHANCED_OPERATIONS = new Set(ENHANCED_TOOL_CONTRACTS.map(({ name }) => name));
const trackCleanupFailures = (signal, operation) => {
    let error;
    let cleanupFailure;
    let cancellation;
    const observed = new Set();
    return {
        get error() {
            return error;
        },
        onFailure: (failure) => {
            if (observed.has(failure) ||
                (failure.cleanupPrimary !== undefined &&
                    observed.has(failure.cleanupPrimary)))
                return;
            observed.add(failure);
            if (cleanupFailure === undefined) {
                if (isAborted(signal))
                    cancellation = new AnalysisCancelledError(operation, {
                        cause: signal?.reason,
                    });
                cleanupFailure = failure;
            }
            else {
                cleanupFailure = analysisErrorWithCleanupFailure(cleanupFailure, failure, operation);
            }
            error =
                cancellation === undefined
                    ? cleanupFailure
                    : analysisErrorWithCleanupFailure(cancellation, cleanupFailure, operation);
        },
    };
};
/** Provider metadata cannot confer authority to an uncommitted Evidence ID. */
const unrecordedExecution = (result) => {
    if (!result.ok || !("evidenceId" in result.value))
        return result;
    const observation = { ...result.value };
    delete observation.evidenceId;
    return ok(observation);
};
/**
 * Owns the single active target shared by CLI and MCP adapters.
 *
 * Target transitions are serialized because switching targets tears down the
 * active provider client. A failed switch recreates the previous target instead
 * of retaining a client whose resources were already shut down.
 */
export class BinarySession extends BinarySessionRecords {
    #active;
    #externalMutationCleanupFailure;
    #pendingCleanup;
    #transition = Promise.resolve();
    #transitionGeneration = 0;
    #transitionPending = 0;
    /** Process shutdown has begun; later target acquisition must not outlive it. */
    #shutdownStarted = false;
    #calls = new Map();
    #promptCompletionControllers = new Set();
    #providerRouter;
    #bundleResourceFactory;
    #activeBundleResources;
    #pendingBundleResourceCleanup = [];
    #runtimeUnavailability = new Map();
    #availabilityListeners = new Set();
    constructor(providerRouter, records = new InvestigationRecords(), bundleResourceFactory) {
        super(records);
        this.#providerRouter = providerRouter;
        this.#bundleResourceFactory = bundleResourceFactory;
    }
    /** Open an app resource root without requiring CFBundleExecutable. */
    openBundleResources(path, options = {}) {
        return this.#serialize(async (admittedThrough) => {
            const refused = this.#targetAcquisitionRefused("open_bundle_resources");
            if (refused !== undefined)
                return refused;
            await this.#drainCalls(admittedThrough);
            if (isAborted(options.signal))
                return err(new AnalysisCancelledError("open_bundle_resources", {
                    cause: options.signal?.reason,
                }));
            if (this.#externalMutationCleanupFailure?.cleanupIncomplete === true)
                return err(this.#externalMutationCleanupFailure);
            if (this.#bundleResourceFactory === undefined)
                return err(new AnalysisCapabilityUnavailableError("bundle-resources", "open_bundle_resources", "No app resource reader is configured."));
            const resolved = await resolveAppBundleResourceRoot(path);
            if (!resolved.ok)
                return resolved;
            if (isAborted(options.signal))
                return err(new AnalysisCancelledError("open_bundle_resources", {
                    cause: options.signal?.reason,
                }));
            const pendingClosed = await this.#retryPendingCleanup();
            if (!pendingClosed.ok)
                return pendingClosed;
            const pendingResourcesClosed = await this.#retryPendingBundleResourceCleanup();
            if (!pendingResourcesClosed.ok)
                return pendingResourcesClosed;
            if (isAborted(options.signal))
                return err(new AnalysisCancelledError("open_bundle_resources", {
                    cause: options.signal?.reason,
                }));
            const runId = randomUUID();
            let bundleClient;
            try {
                bundleClient = await this.#bundleResourceFactory.createClient(resolved.value);
            }
            catch (cause) {
                return err(cause instanceof AnalysisError
                    ? cause
                    : new ProviderAdapterError("bundle-resources", "open_bundle_resources", { cause }));
            }
            const candidate = {
                root: resolved.value,
                client: bundleClient.client,
                capabilities: bundleClient.capabilities,
                runId,
            };
            const started = await candidate.client.execute("health", {}, options);
            if (!started.ok) {
                this.#pendingBundleResourceCleanup.push(candidate);
                const closed = await this.#retryPendingBundleResourceCleanup();
                return err(closed.ok
                    ? started.error
                    : analysisErrorWithCleanupFailure(started.error, closed.error, "open_bundle_resources"));
            }
            if (isAborted(options.signal)) {
                const cancelled = new AnalysisCancelledError("open_bundle_resources", {
                    cause: options.signal?.reason,
                });
                this.#pendingBundleResourceCleanup.push(candidate);
                const closed = await this.#retryPendingBundleResourceCleanup();
                return err(closed.ok
                    ? cancelled
                    : analysisErrorWithCleanupFailure(cancelled, closed.error, "open_bundle_resources"));
            }
            const cleanupFailures = trackCleanupFailures(options.signal, "open_bundle_resources");
            const closed = await this.#closeActive({}, false, cleanupFailures.onFailure);
            if (!closed.ok) {
                this.#pendingBundleResourceCleanup.push(candidate);
                const candidateClosed = await this.#retryPendingBundleResourceCleanup(undefined, cleanupFailures.onFailure);
                const primary = cleanupFailures.error ?? closed.error;
                return err(cleanupFailures.error ??
                    (candidateClosed.ok
                        ? primary
                        : analysisErrorWithCleanupFailure(primary, candidateClosed.error, "open_bundle_resources")));
            }
            if (isAborted(options.signal)) {
                const cancelled = new AnalysisCancelledError("open_bundle_resources", {
                    cause: options.signal?.reason,
                });
                this.#pendingBundleResourceCleanup.push(candidate);
                const candidateClosed = await this.#retryPendingBundleResourceCleanup(undefined, cleanupFailures.onFailure);
                return err(cleanupFailures.error ??
                    (candidateClosed.ok
                        ? cancelled
                        : analysisErrorWithCleanupFailure(cancelled, candidateClosed.error, "open_bundle_resources")));
            }
            this.#activeBundleResources = candidate;
            this.resetSnapshotInvalidation();
            return resolved;
        });
    }
    /**
     * Fast-path liveness gate (#1719): short-circuit only when the retained
     * client is genuinely alive. The probe reads the child's operation health
     * rather than the composite's unconditionally-ok `health`, so a dead child
     * falls through and a real client is started; an aborted caller leaves the
     * session untouched. Returns the fast-path result, or undefined to fall
     * through to the slow path.
     */
    async #tryRetainedFastPath(retained, target, options) {
        const live = await this.#retainedClientLive(retained.client, options);
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        if (!live)
            return undefined;
        if (options.snapshot !== undefined) {
            const imported = this.importAnalysisSnapshot(options.snapshot);
            if (!imported.ok)
                return imported;
        }
        return ok(target);
    }
    /** Identify the provider producing evidence for this session. */
    providerIdentity(operation) {
        const route = this.#currentRoute();
        let selected = route.binding?.identity ?? route.identity;
        if (operation !== undefined) {
            const exact = route.capabilities.get(operation)?.provider;
            if (exact !== undefined)
                selected = exact;
            else if (ENHANCED_OPERATIONS.has(operation)) {
                const providers = new Map();
                for (const descriptor of route.capabilities.values())
                    if (descriptor.available &&
                        OFFICIAL_OPERATIONS.has(descriptor.operation))
                        providers.set(descriptor.provider.id, descriptor.provider);
                if (providers.size === 1) {
                    const provider = providers.values().next().value;
                    if (provider !== undefined)
                        selected = provider;
                }
            }
        }
        return structuredClone(selected);
    }
    /** External live state cannot be replayed by a direct or composed CLI workflow. */
    allowsSnapshotReplay(operation) {
        if (operation === "decompile_all")
            return false;
        if (this.#activeBundleResources !== undefined)
            return false;
        const capabilities = this.#active?.route.capabilities;
        const descriptor = capabilities?.get(operation);
        if (descriptor !== undefined)
            return descriptor.cachePolicy !== "live";
        return ![...(capabilities?.values() ?? [])].some(({ cachePolicy }) => cachePolicy === "live");
    }
    invalidateSnapshotForExternalMutation() {
        this.invalidateSnapshot();
    }
    /** Return the selected immutable profile, optionally scoped to an operation. */
    analysisProfile(operation) {
        const profile = this.#active?.profile;
        if (profile === null || profile === undefined) {
            if (operation !== "inspect_native_dispatch_metadata")
                return undefined;
            return this.#active?.profilelessWorkflowProfile === undefined
                ? undefined
                : structuredClone(this.#active.profilelessWorkflowProfile);
        }
        if (operation !== undefined &&
            this.providerIdentity(operation).id !== profile.provider.id)
            return undefined;
        return structuredClone(profile);
    }
    /** Observe runtime provider-health changes that affect discovery metadata. */
    onAvailabilityChanged(listener) {
        this.#availabilityListeners.add(listener);
        return () => this.#availabilityListeners.delete(listener);
    }
    /** Resolve target identity under this session's file cleanup owner. */
    resolveTarget(path, options = {}) {
        return parseBinaryTarget(path, {
            ...options,
            resources: this.fileResources,
        });
    }
    /** Resolve a target and provider profile without creating a provider client. */
    previewTarget(target, options = {}) {
        if (isAborted(options.signal))
            return Promise.resolve(err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            })));
        return resolveSessionTarget({
            router: this.#providerRouter,
            current: this.#active,
            target,
            options,
            stagedSnapshotMatches: (target, profile) => this.matchesSnapshot(target, profile),
        }).then((resolved) => resolved.ok && isAborted(options.signal)
            ? err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }))
            : resolved);
    }
    /**
     * Open or switch targets after draining calls against the current target.
     * Returns the switch failure even if best-effort restoration also fails.
     */
    open(path, options = {}) {
        return this.#open((admitted) => resolveSessionOpen({
            resources: this.fileResources,
            router: this.#providerRouter,
            current: this.#active,
            path,
            options: admitted,
            stagedSnapshotMatches: (target, profile) => this.matchesSnapshot(target, profile),
        }), options);
    }
    /** Open a previewed target without repeating parsing or provider profile discovery. */
    openResolvedTarget(resolved, options = {}) {
        return this.#open(() => Promise.resolve(validateResolvedSessionTarget({
            ...resolved,
            current: this.#active,
            options,
            stagedSnapshotMatches: (target, profile) => this.matchesSnapshot(target, profile),
        })), options);
    }
    #open(resolve, options) {
        return this.#serialize(async (admittedThrough) => {
            const refused = this.#targetAcquisitionRefused("open_binary");
            if (refused !== undefined)
                return refused;
            const admitted = await this.#withLoadedSnapshot(options);
            if (!admitted.ok)
                return admitted;
            return this.#openWithinTransition(admittedThrough, () => resolve(admitted.value), admitted.value);
        });
    }
    /** Read the staged snapshot only after earlier lifecycle transitions have settled. */
    async #withLoadedSnapshot(options) {
        if (options.loadSnapshot === undefined)
            return ok(options);
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const loaded = await options.loadSnapshot();
        if (!loaded.ok)
            return loaded;
        const { loadSnapshot: _loaded, ...rest } = options;
        return ok({ ...rest, snapshot: loaded.value });
    }
    async #openWithinTransition(admittedThrough, resolve, options) {
        if (this.#externalMutationCleanupFailure?.cleanupIncomplete === true)
            return err(this.#externalMutationCleanupFailure);
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const resolved = await resolve();
        if (!resolved.ok)
            return resolved;
        const { target, route, sameTarget } = resolved.value;
        const { profile } = route;
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const activeProfile = this.#active?.profile;
        const sameProfile = activeProfile === null || activeProfile === undefined
            ? profile === null
            : profile !== null && analysisProfilesEqual(activeProfile, profile);
        await this.#drainCalls(admittedThrough);
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const pendingClosed = await this.#retryPendingCleanup();
        if (!pendingClosed.ok)
            return pendingClosed;
        const pendingResourcesClosed = await this.#retryPendingBundleResourceCleanup();
        if (!pendingResourcesClosed.ok)
            return pendingResourcesClosed;
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const retained = sameTarget && sameProfile ? this.#active : undefined;
        if (retained !== undefined) {
            const fastPath = await this.#tryRetainedFastPath(retained, target, options);
            if (fastPath !== undefined)
                return fastPath;
        }
        const previous = this.#active;
        this.#active = undefined;
        if (previous !== undefined) {
            const closed = await this.#retireClient(previous);
            if (!closed.ok) {
                // A failed open retires the provider cache, not the investigation.
                // Preserve Evidence and Unknown history for export and recovery.
                this.clearSnapshot();
                this.#clearRuntimeAvailability();
                if (isAborted(options.signal))
                    return err(analysisErrorWithCleanupFailure(new AnalysisCancelledError("open_binary", {
                        cause: options.signal?.reason,
                    }), closed.error, "open_binary").bindCleanupDependencies([closed.error]));
                return closed;
            }
        }
        if (isAborted(options.signal))
            return err(await this.#restoreAfterFailedOpen(previous, new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            })));
        const runId = randomUUID();
        const client = route.createClient(target, {
            runId,
        });
        const run = { client, route, runId };
        const started = await client.execute("health", {}, options);
        if (!started.ok) {
            return err(await this.#failedOpen(run, previous, started.error));
        }
        if (isAborted(options.signal)) {
            return err(await this.#failedOpen(run, previous, new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            })));
        }
        const cleanupFailures = trackCleanupFailures(options.signal, "open_binary");
        if (this.#activeBundleResources !== undefined) {
            this.#pendingBundleResourceCleanup.push(this.#activeBundleResources);
            this.#activeBundleResources = undefined;
            const retiredResources = await this.#retryPendingBundleResourceCleanup(undefined, cleanupFailures.onFailure);
            if (!retiredResources.ok) {
                const primary = cleanupFailures.error ?? retiredResources.error;
                const failed = await this.#failedOpen(run, previous, primary, cleanupFailures.onFailure);
                return err(cleanupFailures.error ?? failed);
            }
        }
        if (isAborted(options.signal)) {
            const cancelled = new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            });
            const failed = await this.#failedOpen(run, previous, cancelled, cleanupFailures.onFailure);
            return err(cleanupFailures.error ?? failed);
        }
        const profilelessWorkflowProfile = profile === null ? profilelessNativeDispatchProfile(route) : undefined;
        this.#active = {
            target,
            profile,
            ...(profilelessWorkflowProfile === undefined
                ? {}
                : { profilelessWorkflowProfile }),
            ...run,
            nativeSourceAdmitted: false,
        };
        this.#clearRuntimeAvailability();
        this.resetSnapshotInvalidation();
        if (options.snapshot === undefined) {
            if (profile === null)
                this.clearSnapshot();
            else
                this.selectSnapshot(target, profile);
        }
        if (options.snapshot !== undefined) {
            const imported = this.importAnalysisSnapshot(options.snapshot);
            if (!imported.ok) {
                this.#active = undefined;
                return err(await this.#failedOpen(run, previous, imported.error));
            }
        }
        return ok(target);
    }
    /** Serialize an external mutation and retire the potentially stale analysis. */
    withAdmittedExternalMutation(_path, signal, operation, retirementFailure, operationName = "execute_rizin_command", cleanupRecovery) {
        return this.#serialize(async (admittedThrough) => {
            if (this.#activeBundleResources !== undefined)
                return err(new AnalysisCapabilityUnavailableError("bundle-resources", operationName, "External mutation requires an active executable analysis target."));
            if (isAborted(signal))
                return err(new AnalysisCancelledError(operationName, { cause: signal?.reason }));
            await this.#drainCalls(admittedThrough);
            if (isAborted(signal))
                return err(new AnalysisCancelledError(operationName, { cause: signal?.reason }));
            if (this.#externalMutationCleanupFailure?.cleanupIncomplete === true) {
                if (cleanupRecovery === undefined)
                    return err(this.#externalMutationCleanupFailure);
                const recovered = await cleanupRecovery(this.#externalMutationCleanupFailure);
                if (!recovered.ok)
                    return recovered;
                if (this.#externalMutationCleanupFailure.cleanupIncomplete)
                    return err(this.#externalMutationCleanupFailure);
                this.#externalMutationCleanupFailure = undefined;
            }
            const pendingCleanup = await this.#retryPendingCleanup();
            if (!pendingCleanup.ok)
                return pendingCleanup;
            const activeAtDispatch = this.#active;
            if (activeAtDispatch?.route.binding?.identity.id === "ghidra")
                return err(new AnalysisOutputError(operationName, "Close the active Ghidra session explicitly before an external mutation; rebinding would discard its ephemeral analysis edits."));
            // A protocol reply does not prove that background writers have stopped.
            // Retire the old analysis and require an explicit fresh open rather than
            // silently binding a snapshot while an unrestricted command can still write.
            const retireTarget = activeAtDispatch !== undefined;
            this.invalidateSnapshot();
            const value = await operation();
            this.#externalMutationCleanupFailure =
                !value.ok && value.error.cleanupIncomplete ? value.error : undefined;
            if (!retireTarget)
                return ok(value);
            const retired = await this.#closeActive({}, false);
            if (!retired.ok)
                return err(retirementFailure(value, retired.error));
            return ok(value);
        });
    }
    /**
     * Reject target acquisition once process shutdown has begun.
     * Acquisition already inside its transition still finishes; the shutdown
     * close queued behind that transition retires it.
     */
    beginShutdown() {
        this.#shutdownStarted = true;
    }
    #targetAcquisitionRefused(operation) {
        if (!this.#shutdownStarted)
            return undefined;
        return err(new AnalysisCancelledError(operation));
    }
    /** Close the active target, if any. */
    close(options = {}) {
        return this.#serialize(async (admittedThrough) => {
            await this.#drainCalls(admittedThrough);
            return this.#closeActive(options);
        });
    }
    /** Drain earlier requests, save an immutable snapshot, and close under one lifecycle lock. */
    closeWithSnapshot(path, overwrite, options = {}) {
        return this.#serialize(async (admittedThrough) => {
            await this.#drainCalls(admittedThrough);
            const snapshot = this.exportAnalysisSnapshot();
            if (!snapshot.ok)
                return snapshot;
            const written = await this.writeAnalysisSnapshot(snapshot.value, path, overwrite);
            if (!written.ok)
                return written;
            const closed = await this.#closeActive(options);
            return closed.ok
                ? ok({
                    ...written.value,
                    primitive_entries: snapshot.value.entries.length,
                    workflow_entries: snapshot.value.workflow_entries.length,
                    evidence_records: snapshot.value.evidence_bundle.records.length,
                })
                : closed;
        });
    }
    async #closeActive(options, clearRecords = true, onCleanupFailure) {
        const previous = this.#active;
        const previousResources = this.#activeBundleResources;
        this.#active = undefined;
        this.#activeBundleResources = undefined;
        if (previousResources !== undefined)
            this.#pendingBundleResourceCleanup.push(previousResources);
        const closed = previous === undefined
            ? await this.#retryPendingCleanup(options.progress, options.retainProviderDocuments, onCleanupFailure)
            : await this.#retireClient(previous, {
                ...(options.progress === undefined
                    ? {}
                    : { progress: options.progress }),
                ...(options.retainProviderDocuments === true
                    ? { retainDocument: true }
                    : {}),
                ...(onCleanupFailure === undefined ? {} : { onCleanupFailure }),
            });
        if (clearRecords)
            this.clearSessionRecords();
        this.#clearRuntimeAvailability();
        const fileResources = await this.closeFileResources();
        if (!fileResources.ok)
            onCleanupFailure?.(fileResources.error);
        const candidateResources = await this.#providerRouter.closeOwnedResources();
        if (!candidateResources.ok)
            onCleanupFailure?.(candidateResources.error);
        const bundleClosed = await this.#retryPendingBundleResourceCleanup(options.progress, onCleanupFailure);
        const resourceFailures = [
            ...(bundleClosed.ok ? [] : [bundleClosed.error]),
            ...(fileResources.ok ? [] : [fileResources.error]),
            ...(candidateResources.ok ? [] : [candidateResources.error]),
        ];
        let resourceFailure = resourceFailures[0];
        for (const next of resourceFailures.slice(1))
            if (resourceFailure !== undefined) {
                const previous = resourceFailure;
                resourceFailure = analysisErrorWithCleanupFailure(previous, next, "close_binary");
                resourceFailure.bindCleanupDependencies([previous, next]);
            }
        if (!closed.ok && resourceFailure !== undefined) {
            const combined = analysisErrorWithCleanupFailure(closed.error, resourceFailure, "close_binary");
            combined.bindCleanupDependencies([closed.error, resourceFailure]);
            return err(combined);
        }
        if (!closed.ok)
            return closed;
        return resourceFailure === undefined ? ok(null) : err(resourceFailure);
    }
    async #retryPendingBundleResourceCleanup(progress, onCleanupFailure) {
        if (this.#pendingBundleResourceCleanup.length === 0)
            return ok(null);
        const pending = this.#pendingBundleResourceCleanup;
        const retained = [];
        let failure;
        for (const session of pending) {
            const closed = await closeAnalysisClient(session.client, "bundle-resources", {
                ...(progress === undefined ? {} : { progress }),
                ...(onCleanupFailure === undefined ? {} : { onCleanupFailure }),
            });
            if (!closed.ok) {
                retained.push(session);
                failure =
                    failure === undefined
                        ? closed.error
                        : analysisErrorWithCleanupFailure(failure, closed.error, "close_binary");
            }
        }
        this.#pendingBundleResourceCleanup = retained;
        return failure === undefined ? ok(null) : err(failure);
    }
    async #retireClient(run, options = {}) {
        this.#pendingCleanup = {
            run,
            retainDocument: options.retainDocument === true,
        };
        return this.#retryPendingCleanup(options.progress, undefined, options.onCleanupFailure);
    }
    async #retryPendingCleanup(progress, retainDocument, onCleanupFailure) {
        let pending = this.#pendingCleanup;
        if (pending === undefined)
            return ok(null);
        if (retainDocument !== undefined) {
            pending = { ...pending, retainDocument };
            this.#pendingCleanup = pending;
        }
        const closed = await closeAnalysisClient(pending.run.client, pending.run.route.identity.id, {
            ...(progress === undefined ? {} : { progress }),
            ...(pending.retainDocument ? { retainDocument: true } : {}),
            ...(onCleanupFailure === undefined ? {} : { onCleanupFailure }),
        });
        if (closed.ok)
            this.#pendingCleanup = undefined;
        return closed;
    }
    async #failedOpen(run, previous, primary, onCleanupFailure) {
        const closed = await this.#retireClient(run, onCleanupFailure === undefined ? {} : { onCleanupFailure });
        if (!closed.ok)
            return analysisErrorWithCleanupFailure(primary, closed.error, "open_binary");
        return this.#restoreAfterFailedOpen(previous, primary);
    }
    async #restoreAfterFailedOpen(previous, primary) {
        const restored = await this.#restore(previous);
        return restored.ok
            ? primary
            : analysisErrorWithCleanupFailure(primary, restored.error, "open_binary");
    }
    /** Describe the active binary session. */
    status(options = {}) {
        const resourceRun = this.#activeBundleResources;
        const run = this.#active ??
            resourceRun ??
            this.#pendingBundleResourceCleanup[0] ??
            this.#pendingCleanup?.run;
        const client = run?.client;
        return binarySessionStatus({
            ...options,
            target: this.#active?.target,
            ...(resourceRun === undefined
                ? {}
                : {
                    bundleResourceRoot: resourceRun.root,
                    resourceCapabilities: resourceRun.capabilities,
                }),
            route: this.#currentRoute(),
            router: this.#providerRouter,
            runtimeUnavailability: this.#runtimeUnavailability,
            runId: run?.runId,
            runtimeLineageSnapshots: client?.runtimeLineageSnapshots?.() ?? [],
            requestActivitySnapshots: client?.requestActivitySnapshots?.() ?? [],
            providerOperationHealth: client?.operationHealthSnapshot?.() ?? null,
            cleanupPending: this.#externalMutationCleanupFailure?.cleanupIncomplete === true ||
                this.#pendingCleanup !== undefined ||
                this.#pendingBundleResourceCleanup.length > 0 ||
                this.hasPendingFileResources ||
                this.#providerRouter.hasPendingOwnedResources(),
        });
    }
    /** Return the immutable artifact identity captured before its provider started. */
    activeTarget() {
        return this.#active === undefined
            ? undefined
            : structuredClone(this.#active.target);
    }
    activeBundleResourceRoot() {
        const root = this.#activeBundleResources?.root;
        return root === undefined ? undefined : structuredClone(root);
    }
    exportAnalysisSnapshot() {
        if (this.#activeBundleResources !== undefined)
            return err(new AnalysisSnapshotMismatchError("Analysis snapshots do not apply to a resource-only app session because it has no executable identity or replay binding."));
        return super.exportAnalysisSnapshot();
    }
    importAnalysisSnapshot(snapshot) {
        if (this.#activeBundleResources !== undefined)
            return err(new AnalysisSnapshotMismatchError("Analysis snapshots do not apply to a resource-only app session because it has no executable identity or replay binding."));
        return super.importAnalysisSnapshot(snapshot);
    }
    activeAnalysisBinding() {
        return this.#active;
    }
    /**
     * Invoke a provider operation against the active target.
     * Calls may overlap, but a pending target transition prevents new calls from
     * entering until the transition has settled.
     */
    execute(name, arguments_, options) {
        const generation = this.#transitionGeneration;
        const call = this.#execute(name, arguments_, options, this.#transition);
        this.#calls.set(call, generation);
        return call.finally(() => this.#calls.delete(call));
    }
    /** Run a prompt lookup only against an already connected provider child. */
    executeIfProviderReady(name, arguments_, options) {
        const active = this.#active;
        if (this.#transitionPending > 0 ||
            active === undefined ||
            active.client.executeIfReady === undefined)
            return Promise.resolve(undefined);
        const controller = new AbortController();
        this.#promptCompletionControllers.add(controller);
        const signal = options?.signal === undefined
            ? controller.signal
            : AbortSignal.any([controller.signal, options.signal]);
        const generation = this.#transitionGeneration;
        const call = active.client.executeIfReady(name, arguments_, {
            ...options,
            signal,
        });
        this.#calls.set(call, generation);
        return call.finally(() => {
            this.#calls.delete(call);
            this.#promptCompletionControllers.delete(controller);
        });
    }
    /** Admit one composed request until its result and session bookkeeping settle. */
    withAdmittedAnalysis(operationName, signal, operation) {
        const generation = this.#transitionGeneration;
        const transition = this.#transition;
        const call = (async () => {
            const admission = await this.#waitForTransition(operationName, signal, transition);
            if (!admission.ok)
                return admission;
            return ok(await operation({
                resourceScope: this.resourceScope,
                execute: (name, arguments_, options) => this.#execute(name, arguments_, options, Promise.resolve()),
            }));
        })();
        // Register synchronously before a lifecycle transition can snapshot calls.
        this.#calls.set(call, generation);
        return call.finally(() => this.#calls.delete(call));
    }
    async #execute(name, arguments_, options, transition) {
        const transitioned = await this.#waitForTransition(name, options?.signal, transition);
        if (!transitioned.ok)
            return transitioned;
        const resources = this.#activeBundleResources;
        if (resources !== undefined) {
            if (!BUNDLE_RESOURCE_OPERATIONS.has(name))
                return err(new AnalysisCapabilityUnavailableError("bundle-resources", name, "This operation requires an executable analysis target; the active session contains only app resource access."));
            const result = unrecordedExecution(await resources.client.execute(name, arguments_, options));
            if (!result.ok)
                return result;
            const execution = { ...result.value, subject: null };
            return ok(execution);
        }
        const prepared = prepareSessionExecution({
            active: this.#active,
            operation: name,
            parameters: arguments_,
            nativeSourceAdmitted: this.#active?.nativeSourceAdmitted === true,
            unboundOperationError: (operation, route) => this.#providerRouter.unboundOperationError(operation, route),
            lookupSnapshot: (target, profile, operation, parameters) => operation === "decode_interface_builder" ||
                operation === "inspect_asset_catalog" ||
                operation === "inspect_keyed_archive" ||
                operation === "trace_dylib_resolution"
                ? undefined
                : this.lookupSnapshot(target, profile, operation, parameters),
        });
        if (!prepared.ok)
            return prepared;
        const { active, capability, profile, cacheable, cached } = prepared.value;
        if (cached !== undefined)
            return ok(cached);
        // A failed reply cannot prove that a dispatched metadata write rolled back.
        // Stop replay before dispatch, including reads overlapping the write.
        if (capability.effects.mutatesArtifact)
            this.invalidateSnapshot();
        const call = active.client.execute(name, arguments_, options);
        const result = unrecordedExecution(await call);
        const profiled = bindExecutionTarget(commitExecutionProfile(name, result, profile), name, active.target);
        const execution = profiled.ok &&
            (name === "procedure_callers" || name === "procedure_callees") &&
            profiled.value.relationshipCoverage === undefined
            ? ok({
                ...profiled.value,
                relationshipCoverage: {
                    status: "unknown",
                    reason: "Provider did not report relationship coverage for this observation.",
                },
            })
            : profiled;
        // A successful Ghidra operation proves this client's native source snapshot
        // was admitted; a composite health response and parsed path do not.
        if (execution.ok &&
            capability.provider.id === "ghidra" &&
            this.#active === active)
            this.#active.nativeSourceAdmitted = true;
        this.#observeRuntimeAvailability(name, execution);
        if (execution.ok &&
            cacheable &&
            profile !== undefined &&
            name !== "decode_interface_builder" &&
            name !== "inspect_asset_catalog" &&
            name !== "inspect_keyed_archive" &&
            name !== "trace_dylib_resolution") {
            const evidence = createAnalysisExecutionEvidence(name, arguments_, {
                ...execution.value,
                analysisProfile: profile,
                subject: execution.value.subject === undefined
                    ? active.target
                    : execution.value.subject,
            }, "observed");
            const sourcesRecorded = recordEvidenceSources((source) => this.recordEvidence(source), execution.value.sourceEvidence ?? []);
            if (!sourcesRecorded.ok)
                return sourcesRecorded;
            const recorded = this.recordEvidence(evidence);
            if (!recorded.ok)
                return recorded;
            const retained = { ...execution.value, evidenceId: evidence.evidence_id };
            if (execution.value.cachePolicy !== "live")
                this.recordSnapshot({
                    target: active.target,
                    profile,
                    operation: name,
                    parameters: arguments_,
                    execution: retained,
                });
            return ok(retained);
        }
        return execution;
    }
    #observeRuntimeAvailability(operation, result) {
        if (result.ok) {
            if (this.#markRuntimeAvailable(operation))
                this.#emitAvailabilityChanged();
            return;
        }
        if (result.error._tag === "AnalysisCapabilityUnavailableError") {
            if (this.#markRuntimeUnavailable(operation, result.error.message))
                this.#emitAvailabilityChanged();
            return;
        }
        if ([
            "ProviderAdapterError",
            "HopperProcessError",
            "HopperStartError",
        ].includes(result.error._tag)) {
            const capabilities = this.#active?.route.capabilities;
            const providerId = capabilities?.get(operation)?.provider.id;
            let changed = false;
            for (const descriptor of capabilities?.values() ?? [])
                if (providerId !== undefined && descriptor.provider.id === providerId)
                    changed =
                        this.#markRuntimeUnavailable(descriptor.operation, `${result.error._tag}: ${result.error.message}`) || changed;
            if (changed)
                this.#emitAvailabilityChanged();
        }
    }
    #markRuntimeAvailable(operation) {
        return this.#runtimeUnavailability.delete(operation);
    }
    #markRuntimeUnavailable(operation, reason) {
        const current = this.#runtimeUnavailability.get(operation);
        if (current?.reason === reason)
            return false;
        this.#runtimeUnavailability.set(operation, { reason });
        return true;
    }
    #clearRuntimeAvailability() {
        if (this.#runtimeUnavailability.size === 0)
            return;
        this.#runtimeUnavailability.clear();
        this.#emitAvailabilityChanged();
    }
    #emitAvailabilityChanged() {
        for (const listener of this.#availabilityListeners) {
            try {
                const notification = listener();
                if (notification !== undefined) {
                    // best-effort cleanup: async observer notifications must not reject
                    // unhandled; state transitions and other listeners continue.
                    void notification.catch(() => undefined);
                }
            }
            catch (cause) {
                // External observers are best-effort notifications. Contain only the
                // callback failure so state transitions and other listeners continue.
                void cause;
            }
        }
    }
    #currentRoute() {
        return this.#active?.route ?? this.#providerRouter.initialRoute();
    }
    #serialize(operation) {
        for (const controller of this.#promptCompletionControllers)
            controller.abort();
        this.#transitionPending += 1;
        // Later calls wait for this transition and must not be included in its drain.
        const admittedThrough = this.#transitionGeneration++;
        const result = this.#transition.then(() => operation(admittedThrough), () => operation(admittedThrough));
        this.#transition = result.then(() => undefined, () => undefined);
        void result.then(() => {
            this.#transitionPending -= 1;
        }, () => {
            this.#transitionPending -= 1;
        });
        return result;
    }
    async #drainCalls(admittedThrough) {
        await Promise.allSettled([...this.#calls]
            .filter(([, generation]) => generation <= admittedThrough)
            .map(([call]) => call));
    }
    /**
     * Probe whether a retained provider client is still live.
     *
     * On production routes the client is a CompositeProvider whose `health`
     * answers unconditionally ok without touching a child, so `health` alone
     * cannot see a dead child. `operationHealthSnapshot` reaches the
     * instantiated children instead. Only the known-live states allow the
     * fast path: `exited`/`unreachable` are dead, `unknown` is never
     * evidence of health (it is what a recorded but uncharacterized failure
     * reports), and `not_started` is a startup that never completed — in the
     * Hopper timeout case the client holds retained resources that block the
     * next `start()` until `close()` retries cleanup, so treating it as live
     * would skip the retire path and hand the wedged client to subsequent
     * analysis. The gate fails closed: without a snapshot signal, fall back
     * to the `health` admission probe.
     */
    async #retainedClientLive(client, options) {
        if (client.reuseReadiness?.() === "blocked")
            return false;
        const snapshot = client.operationHealthSnapshot?.();
        if (snapshot !== undefined)
            return snapshot.state === "idle" || snapshot.state === "busy";
        try {
            return (await client.execute("health", {}, options)).ok;
        }
        catch {
            return false;
        }
    }
    async #restore(previous) {
        if (previous === undefined)
            return ok(null);
        const runId = randomUUID();
        const client = previous.route.createClient(previous.target, {
            runId,
        });
        const run = { client, route: previous.route, runId };
        const started = await client.execute("health", {});
        if (started.ok) {
            this.#active = {
                ...previous,
                ...run,
                nativeSourceAdmitted: false,
            };
            this.#clearRuntimeAvailability();
            return ok(null);
        }
        const closed = await this.#retireClient(run);
        return closed.ok
            ? ok(null)
            : err(analysisErrorWithCleanupFailure(started.error, closed.error, "open_binary"));
    }
    async #waitForTransition(operation, signal, transition) {
        if (signal?.aborted === true)
            return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
        if (signal === undefined) {
            await transition;
            return ok(undefined);
        }
        return new Promise((resolve) => {
            const onAbort = () => {
                resolve(err(new AnalysisCancelledError(operation, { cause: signal.reason })));
            };
            signal.addEventListener("abort", onAbort, { once: true });
            transition.then(() => {
                signal.removeEventListener("abort", onAbort);
                resolve(signal.aborted
                    ? err(new AnalysisCancelledError(operation, {
                        cause: signal.reason,
                    }))
                    : ok(undefined));
            }, () => {
                signal.removeEventListener("abort", onAbort);
                resolve(signal.aborted
                    ? err(new AnalysisCancelledError(operation, {
                        cause: signal.reason,
                    }))
                    : ok(undefined));
            });
        });
    }
}
const isAborted = (signal) => signal?.aborted === true;
