import { basename, join } from "node:path";
import { realpath } from "node:fs/promises";
import { AnalysisArtifactChangedError, AnalysisCancelledError, } from "../domain/analysisErrorCore.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { err, ok } from "../domain/result.js";
import { PrivateRuntimeRoot } from "../process/PrivateRuntimeRoot.js";
import { prepareProcessOwnershipInspection } from "../process/ProcessOwnershipObservation.js";
import { copyAndHash, runKunaCommand, } from "./KunaCommand.js";
import { KUNA_PROVIDER_ID } from "./KunaRelease.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
/** Own the digest-checked target copy and every command that can still use it. */
export class KunaTargetCommands {
    target;
    lifetime;
    #resources = new ArtifactResourceScope();
    #retained = [];
    #roots = [];
    #workspace;
    #closeAttempt;
    #closing = false;
    constructor(target, lifetime) {
        this.target = target;
        this.lifetime = lifetime;
    }
    run(request) {
        if (this.#closing || request.signal.aborted) {
            request.releaseRun?.();
            return Promise.resolve(err(new AnalysisCancelledError(request.operation)));
        }
        return this.#run(request);
    }
    /** Establish the immutable input before waiting for a foreground run slot. */
    prepare() {
        if (this.#closing || this.lifetime.signal.aborted)
            return Promise.resolve(err(new AnalysisCancelledError("kuna:workspace")));
        return this.#admit("kuna:workspace", () => this.#ensureWorkspace().then((workspace) => workspace.ok ? ok(null) : workspace));
    }
    async #run(request) {
        const { releaseRun, ...options } = request;
        let retained = false;
        try {
            return await this.#admit(request.operation, async () => {
                const workspace = await this.#ensureWorkspace();
                if (!workspace.ok)
                    return workspace;
                let failedHashClose;
                const outcome = await runKunaCommand({
                    ...options,
                    arguments: request.arguments(workspace.value.input),
                    workspace: workspace.value.root.path,
                    timeoutMs: request.deadline.ms,
                    launcher: this.lifetime.launcher,
                    retainFailedFileClose: (owner, resource) => {
                        const lease = new AnalysisCleanupLease(() => owner.close(), [resource]);
                        this.#resources.retain({ kind: "lease", resource, lease });
                        failedHashClose = { owner, lease };
                    },
                });
                if (outcome.kind === "retained") {
                    const process = new AnalysisCleanupLease(async () => {
                        const stopped = await outcome.owner?.stop();
                        if (stopped === undefined || stopped.status === "incomplete")
                            throw new Error("Kuna process stop remains unproven");
                        releaseRun?.();
                    }, outcome.processResources);
                    new AnalysisCleanupLeaseGroup(outcome.error, [
                        process,
                        workspace.value.cleanup,
                    ]);
                    this.#retained.push({ error: outcome.error, process });
                    retained = true;
                    return err(outcome.error);
                }
                const fileFailure = outcome.kind === "failed" ? outcome.fileCleanupFailure : undefined;
                if (outcome.kind === "ok")
                    return ok({ ...outcome.snapshot, input: workspace.value.input });
                if (fileFailure !== undefined &&
                    fileFailure.owner === failedHashClose?.owner)
                    failedHashClose.lease.bindCleanupError(outcome.error);
                return err(outcome.error);
            });
        }
        finally {
            if (!retained)
                releaseRun?.();
        }
    }
    /** Called after the session signal aborts; failures keep their retry owners. */
    close() {
        this.#closing = true;
        this.#closeAttempt ??= this.#closeCommands().finally(() => {
            this.#closeAttempt = undefined;
        });
        return this.#closeAttempt;
    }
    async #closeCommands() {
        const failures = [];
        try {
            await this.#resources.close();
        }
        catch (cause) {
            const observation = ArtifactReaderFailure.cleanupObservation(cause, "Kuna command file descriptor");
            failures.push(new ProviderCleanupError(KUNA_PROVIDER_ID, observation.resources, { reason: observation.reason }, { cause }));
        }
        for (const retained of [...this.#retained]) {
            try {
                await retained.process.release();
                this.#retained.splice(this.#retained.indexOf(retained), 1);
            }
            catch {
                // The exact process lease remains available for the next retry.
            }
        }
        failures.push(...this.#retained.map(({ error }) => error));
        const workspace = await this.#workspace;
        if (this.#retained.length === 0) {
            if (workspace?.ok === true) {
                this.#roots.push(workspace.value);
                this.#workspace = undefined;
            }
            for (const owned of [...this.#roots])
                try {
                    await owned.cleanup.release();
                    this.#roots.splice(this.#roots.indexOf(owned), 1);
                }
                catch (cause) {
                    const failure = new ProviderCleanupError(KUNA_PROVIDER_ID, [owned.root.path], { reason: cause instanceof Error ? cause.message : String(cause) }, { cause });
                    owned.cleanup.bindCleanupError(failure);
                    failures.push(failure);
                }
        }
        return failures.length === 0
            ? ok(null)
            : err(new ProviderCleanupError(KUNA_PROVIDER_ID, failures.flatMap((failure) => failure.cleanupResources), {
                reason: failures
                    .map((failure) => String(failure.diagnostics?.["reason"] ?? failure.message))
                    .join("; "),
            }, {
                cause: new AggregateError(failures, "Kuna command cleanup remains incomplete"),
            }).bindCleanupDependencies(failures));
    }
    async #admit(operation, work) {
        try {
            return await this.#resources.run(work);
        }
        catch (cause) {
            if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined)
                return err(new ProviderCleanupError(KUNA_PROVIDER_ID, cause.cleanup.resources, { reason: cause.cleanup.reason }, { cause, operation }));
            if (this.#closing && cause instanceof ArtifactReaderFailure)
                return err(new AnalysisCancelledError(operation, { cause }));
            throw cause;
        }
    }
    async #ensureWorkspace() {
        const pending = (this.#workspace ??= this.#createWorkspace());
        const result = await pending;
        if (this.#workspace === pending &&
            !result.ok &&
            !result.error.cleanupIncomplete)
            this.#workspace = undefined;
        return result;
    }
    async #createWorkspace() {
        let owned;
        try {
            const root = await PrivateRuntimeRoot.create({ prefix: "rea-kuna-" });
            owned = {
                root,
                cleanup: new AnalysisCleanupLease(() => root.close(), [root.path]),
            };
            const input = join(root.path, basename(this.target.path));
            const digest = await copyAndHash(this.target.path, input, this.lifetime.signal);
            if (digest !== this.target.sha256)
                return await this.#workspaceFailure(new AnalysisArtifactChangedError("kuna:workspace", this.target.path, "the target no longer matches the digest selected for analysis"), owned);
            await prepareProcessOwnershipInspection(this.lifetime.signal);
            return ok({ ...owned, input: await realpath(input) });
        }
        catch (cause) {
            const primary = new ProviderAdapterError(KUNA_PROVIDER_ID, "kuna:workspace", {
                cause,
                userMessage: `Kuna workspace failed: ${cause instanceof Error ? cause.message : String(cause)}`,
            });
            return this.#workspaceFailure(primary, owned);
        }
    }
    /** Rollback and the original outcome share the exact root cleanup lease. */
    async #workspaceFailure(primary, owned) {
        if (owned === undefined)
            return err(primary);
        try {
            await owned.cleanup.release();
            return err(primary);
        }
        catch (cause) {
            this.#roots.push(owned);
            const cleanup = new ProviderCleanupError(KUNA_PROVIDER_ID, [owned.root.path], { reason: cause instanceof Error ? cause.message : String(cause) }, { cause, operation: "kuna:workspace" });
            owned.cleanup.bindCleanupError(cleanup);
            return err(analysisErrorWithCleanupFailure(primary, cleanup, "kuna:workspace").bindCleanupDependencies([primary, cleanup]));
        }
    }
}
