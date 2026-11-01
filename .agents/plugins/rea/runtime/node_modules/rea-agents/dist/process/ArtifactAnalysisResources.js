import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactFileCleanupFailure, artifactFileCancellationCause, } from "../artifacts/ArtifactFileOperation.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { readStableArtifact } from "../artifacts/readStableArtifact.js";
import { AnalysisError, } from "../domain/analysisErrorBase.js";
import { AnalysisAccessDeniedError, AnalysisCancelledError, AnalysisArtifactChangedError, AnalysisInputError, AnalysisResourceConstraintError, AnalysisOutputError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { fixedAllowanceOptions, fixedProducerInputAllowance, } from "../domain/fixedAllowanceRemediation.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { err } from "../domain/result.js";
import { readLinuxResourceLimits, } from "./LinuxResourceLimits.js";
import { OwnedCommandFailure, ownedCommandResources } from "./OwnedCommand.js";
export const artifactCommandOutput = (snapshot) => ({
    stdout: snapshot.stdout.text,
    stderr: snapshot.stderr.text,
    truncated: snapshot.diagnosticTruncated ?? false,
    exit_code: snapshot.exitCode ?? null,
    signal: snapshot.signal ?? null,
});
/** Own admission, artifact descriptors, producer cleanup and private workspaces together. */
export class ArtifactAnalysisResources {
    providerId;
    operation;
    readArtifact;
    readKernelLimits;
    capacity;
    #artifacts;
    #pending = new Map();
    #tail = Promise.resolve();
    #busy = false;
    #closed = false;
    constructor(providerId, operation, readArtifact, readKernelLimits, capacity) {
        this.providerId = providerId;
        this.operation = operation;
        this.readArtifact = readArtifact;
        this.readKernelLimits = readKernelLimits;
        this.capacity = capacity;
        this.#artifacts = { scope: new ArtifactResourceScope(), operation };
    }
    run(work, signal, operation = this.operation) {
        if (this.#closed || signal?.aborted)
            return Promise.resolve(err(new AnalysisCancelledError(operation, {
                cause: signal?.aborted ? signal.reason : undefined,
            })));
        if (this.#busy)
            return Promise.resolve(err(new AnalysisResourceConstraintError(operation, "capacity", this.capacity.message, this.capacity.details)));
        this.#busy = true;
        const running = this.#tail
            .then(() => this.#artifacts.scope.run(() => {
            // Failed descriptor cleanup still belongs to the preceding request until
            // this scope has drained it and admits acquisition for the new request.
            this.#artifacts.operation = operation;
            if (signal?.aborted)
                return Promise.resolve(err(new AnalysisCancelledError(operation, { cause: signal.reason })));
            return work();
        }))
            .catch((cause) => err(this.#artifactFailure(cause)))
            .finally(() => {
            this.#busy = false;
        });
        this.#tail = running.then(() => undefined, () => undefined);
        return running;
    }
    read(path, maximumBytes, signal) {
        return this.readArtifact(path, maximumBytes, signal, undefined, this.#artifacts.scope);
    }
    /** Admit a selected input and classify its physical failure before later stages. */
    async readSelectedArtifact(input) {
        const operation = this.#artifacts.operation;
        try {
            return await this.read(input.path, input.maximumBytes, input.signal);
        }
        catch (cause) {
            throw this.#selectedArtifactFailure(cause, input, operation);
        }
    }
    #selectedArtifactFailure(cause, input, operation) {
        const { path, maximumBytes, allowanceName, observedOutput } = input;
        if (cause instanceof AnalysisError)
            return cause;
        if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined)
            return this.cleanupFailure(cause, (primary) => this.#selectedArtifactFailure(primary, input, operation), observedOutput, operation);
        if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled")
            return new AnalysisCancelledError(operation, {
                cause: artifactFileCancellationCause(cause),
                ...(observedOutput === undefined
                    ? {}
                    : { capturedOutput: observedOutput }),
            });
        const reason = cause instanceof Error ? cause.message : String(cause);
        if (cause instanceof ArtifactReaderFailure && cause.reason === "limit")
            return new AnalysisResourceConstraintError(operation, "file-size", reason, { input_bytes: maximumBytes }, {
                cause,
                ...fixedProducerInputAllowance(maximumBytes, allowanceName),
            });
        if (cause instanceof ArtifactReaderFailure && cause.reason === "integrity")
            return new AnalysisArtifactChangedError(operation, path, reason, {
                cause,
            });
        if (cause instanceof Error &&
            "code" in cause &&
            (cause.code === "EACCES" || cause.code === "EPERM"))
            return new AnalysisAccessDeniedError(operation, path, cause.code, {
                cause,
            });
        return new AnalysisInputError(operation, { cause }, [
            { path: ["path"], reason: "invalid_value", message: reason },
        ]);
    }
    readLimits(limits) {
        return this.readKernelLimits(limits, this.#artifacts.scope);
    }
    /** Finish bounded identity reads after output, independently of caller cancellation. */
    async readCommandAfterRun(command, limiter, capturedOutput, operation = this.operation) {
        const read = async (path) => {
            try {
                return await this.read(path, 64 * 1024 * 1024);
            }
            catch (cause) {
                throw this.integrityFailure(cause, path, capturedOutput, operation);
            }
        };
        const current = await read(command);
        const currentLimiter = await read(limiter.path);
        if (currentLimiter.sha256 !== limiter.sha256)
            throw new AnalysisArtifactChangedError(operation, limiter.path, "Configured resource limiter changed during analysis.", { capturedOutput });
        return current;
    }
    integrityFailure(cause, path, capturedOutput, operation = this.operation) {
        if (cause instanceof AnalysisError)
            return cause;
        if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined)
            return this.cleanupFailure(cause, (primary) => this.integrityFailure(primary, path, capturedOutput, operation), capturedOutput, operation);
        const detail = {
            cause,
            ...(capturedOutput === undefined ? {} : { capturedOutput }),
        };
        if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled")
            return new AnalysisCancelledError(operation, {
                ...detail,
                cause: artifactFileCancellationCause(cause),
            });
        const reason = cause instanceof Error ? cause.message : String(cause);
        if (cause instanceof ArtifactReaderFailure &&
            ["limit", "integrity", "path"].includes(cause.reason))
            return new AnalysisArtifactChangedError(operation, path, `Post-run identity verification failed for ${path}: ${reason}`, detail);
        return new ProviderAdapterError(this.providerId, operation, {
            ...detail,
            diagnostics: { stage: "integrity", resource_path: path, reason },
        });
    }
    retain(root, owner) {
        const retained = this.#pending.get(root);
        const resources = () => this.#resourcesFor(root);
        this.#pending.set(root, {
            owner: owner ?? retained?.owner,
            operation: retained?.operation ?? this.#artifacts.operation,
            lease: retained?.lease ??
                new AnalysisCleanupLease(() => this.#releaseRoot(root), {
                    get cleanupResources() {
                        return resources();
                    },
                }),
        });
    }
    get pendingPaths() {
        return [...this.#pending.keys()].map((root) => root.path);
    }
    #resourcesFor(root) {
        const retained = this.#pending.get(root);
        if (retained === undefined)
            return [];
        const ownership = retained.owner?.launch.ownership;
        return ownership === undefined
            ? [root.path]
            : ownedCommandResources(ownership, root.path);
    }
    get #pendingResources() {
        return [...this.#pending.keys()].flatMap((root) => this.#resourcesFor(root));
    }
    async release() {
        const failures = [];
        for (const [root, retained] of this.#pending) {
            try {
                await retained.lease.release();
            }
            catch (cause) {
                const diagnostics = cause instanceof ProviderCleanupError ? cause.diagnostics : undefined;
                const failure = new ProviderCleanupError(this.providerId, this.#resourcesFor(root), {
                    ...diagnostics,
                    reason: cause instanceof ProviderCleanupError
                        ? String(diagnostics?.reason ?? cause.message)
                        : String(cause),
                }, { operation: retained.operation, cause });
                new AnalysisCleanupLeaseGroup(failure, [retained.lease]);
                failures.push(failure);
            }
        }
        if (failures.length === 0)
            return;
        if (failures.length === 1)
            throw failures[0];
        throw new ProviderCleanupError(this.providerId, failures.flatMap((failure) => failure.cleanupResources), {
            reason: "One or more analysis runtime resources remain owned.",
            failures: failures.map(projectAnalysisError),
        }, {
            operation: failures[0]?.operation ?? this.#artifacts.operation,
            cause: new AggregateError(failures, "Analysis runtime cleanup remains incomplete"),
        }).bindCleanupDependencies(failures);
    }
    async #releaseRoot(root) {
        const retained = this.#pending.get(root);
        if (retained === undefined)
            return;
        if (retained.owner !== undefined) {
            const stopped = await retained.owner.stop();
            if (stopped.status === "incomplete") {
                const cleanup = stopped.cleanupResult;
                throw new ProviderCleanupError(this.providerId, this.#resourcesFor(root), {
                    reason: stopped.reason,
                    ...(cleanup?.failures === undefined
                        ? {}
                        : {
                            failures: cleanup.failures.map((failure) => ({ ...failure })),
                        }),
                    ...(cleanup?.unverified === undefined
                        ? {}
                        : {
                            unverified: cleanup.unverified.map((process) => ({
                                ...process,
                            })),
                        }),
                }, { operation: retained.operation });
            }
            this.#pending.set(root, { ...retained, owner: undefined });
        }
        if (this.#artifacts.scope.hasPending)
            throw new ProviderCleanupError(this.providerId, [root.path], {
                reason: "Artifact resources remain owned; the private runtime root is retained until their cleanup succeeds.",
            }, { operation: retained.operation });
        await root.close();
        this.#pending.delete(root);
    }
    cleanupFailure(cause, classifyPrimary, capturedOutput, operation = this.operation) {
        const observation = cause.cleanup;
        if (observation === undefined)
            return classifyPrimary(cause);
        const failure = new ProviderCleanupError(this.providerId, observation.resources, {
            reason: observation.reason,
            ...(capturedOutput === undefined
                ? {}
                : { captured_output: { ...capturedOutput } }),
        }, { operation, cause });
        let leases = cause.cleanupLeases;
        if (leases === undefined) {
            // An unreported capability cannot be recovered by observing an empty scope.
            // Retain the unresolved source failure and refuse replacement admission.
            const unresolved = new AnalysisCleanupLease(async () => {
                throw cause;
            }, observation.resources);
            this.#artifacts.scope.retain({
                kind: "lease",
                resource: observation.resources[0] ?? "Unresolved artifact cleanup",
                lease: unresolved,
            });
            leases = [unresolved];
        }
        new AnalysisCleanupLeaseGroup(failure, leases);
        let primary;
        if (cause instanceof ArtifactFileCleanupFailure) {
            const physical = cause.fileCleanupFailure;
            if (physical.outcome.kind === "failed")
                primary = classifyPrimary(physical.outcome.cause);
            else if (physical.completionCancellation !== undefined)
                primary = new AnalysisCancelledError(operation, {
                    cause: physical.completionCancellation.reason,
                    ...(capturedOutput === undefined ? {} : { capturedOutput }),
                    partialObservation: cause.partialObservation,
                });
        }
        else if (cause.reason === "cancelled") {
            primary = new AnalysisCancelledError(operation, {
                cause: artifactFileCancellationCause(cause),
                ...(capturedOutput === undefined ? {} : { capturedOutput }),
                partialObservation: cause.partialObservation,
            });
        }
        return primary === undefined
            ? failure
            : analysisErrorWithCleanupFailure(primary, failure, operation).bindCleanupDependencies([primary, failure]);
    }
    commandFailure(cause, limits, effectiveLimits, operation = this.operation) {
        const capturedOutput = cause.snapshot === null
            ? undefined
            : artifactCommandOutput(cause.snapshot);
        const detail = {
            cause,
            ...(capturedOutput === undefined ? {} : { capturedOutput }),
        };
        if (cause.reason === "cancelled")
            return new AnalysisCancelledError(operation, {
                ...detail,
                cause: cause.cancellation === undefined ? cause : cause.cancellation.reason,
            });
        if (cause.reason === "timeout")
            return new AnalysisTimeoutError(operation, limits.command_timeout_ms, {
                ...detail,
                userMessage: `The owned producer command reached its fixed ${String(limits.command_timeout_ms)} ms deadline. This is not a client-side timeout; extending only the MCP client's deadline does not change this budget.`,
                remediationAction: `REA's fixed producer command deadline is ${String(limits.command_timeout_ms)} ms and this release has no runtime override. Inspect any partial output and cleanup before retrying. Repeating the unchanged request reaches the same deadline.`,
            });
        if (cause.reason === "output-limit")
            return new AnalysisResourceConstraintError(operation, "memory", cause.message, { output_bytes: limits.output_bytes }, {
                ...detail,
                ...fixedAllowanceOptions(`The retained command-output allowance of ${String(limits.output_bytes)} bytes (this release has no runtime override)`, "capture"),
            });
        if (cause.reason === "process" &&
            (cause.snapshot?.signal === "SIGXFSZ" ||
                cause.snapshot?.signal === "SIGXCPU")) {
            const signal = cause.snapshot.signal;
            const reported = effectiveLimits === undefined
                ? "The effective inherited limit was not reported."
                : `The effective inherited limits are ${String(effectiveLimits.address_space_bytes)} bytes of address space, ${String(effectiveLimits.file_bytes)} bytes per file, and ${String(effectiveLimits.cpu_seconds)} CPU seconds.`;
            // A producer can raise SIGXCPU/SIGXFSZ without exhausting the retained
            // rlimit, so an unchanged retry is not a proven failure.
            return new AnalysisResourceConstraintError(operation, signal === "SIGXFSZ" ? "file-size" : "cpu", `Producer terminated with ${signal}; the signal's exact cause is not independently established.`, effectiveLimits === undefined ? null : { ...effectiveLimits }, {
                ...detail,
                retryable: true,
                remediationAction: `${reported} REA retains the tighter inherited limit. This release has no runtime override for that ceiling. A smaller artifact may finish inside the retained limit. The signal does not prove that ceiling was exhausted, so an unchanged retry may succeed or may fail the same way.`,
            });
        }
        return new AnalysisOutputError(operation, cause.message, detail);
    }
    async finish(result, observation, operation = this.operation, signal) {
        try {
            await this.release();
            if (result.ok && signal?.aborted)
                return err(new AnalysisCancelledError(operation, {
                    cause: signal.reason,
                    partialObservation: observation(result.value),
                }));
            return result;
        }
        catch (cause) {
            const partialObservation = result.ok
                ? observation(result.value)
                : result.error.partialObservation;
            const primary = !result.ok
                ? result.error
                : signal?.aborted
                    ? new AnalysisCancelledError(operation, {
                        cause: signal.reason,
                        partialObservation,
                    })
                    : undefined;
            const cleanup = cause instanceof AnalysisError
                ? cause
                : new ProviderCleanupError(this.providerId, this.#pendingResources, { reason: String(cause) }, { operation, cause });
            const failure = primary === undefined
                ? cleanup
                : analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
            if (partialObservation !== undefined)
                failure.retainPartialObservation(partialObservation);
            return err(failure);
        }
    }
    close() {
        this.#closed = true;
        const work = this.#tail.then(() => this.#closeResources());
        this.#tail = work.catch(() => undefined);
        return work;
    }
    async #closeResources() {
        let descriptorFailure;
        try {
            await this.#artifacts.scope.close();
        }
        catch (cause) {
            descriptorFailure = this.#artifactFailure(cause);
        }
        try {
            await this.release();
        }
        catch (cause) {
            if (descriptorFailure !== undefined && cause instanceof AnalysisError)
                throw analysisErrorWithCleanupFailure(descriptorFailure, cause, this.#artifacts.operation).bindCleanupDependencies([descriptorFailure, cause]);
            throw cause;
        }
        if (descriptorFailure !== undefined)
            throw descriptorFailure;
    }
    #artifactFailure(cause, operation = this.#artifacts.operation) {
        if (cause instanceof AnalysisError)
            return cause;
        if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined)
            return this.cleanupFailure(cause, (primary) => this.#artifactFailure(primary, operation), undefined, operation);
        if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled")
            return new AnalysisCancelledError(operation, {
                cause: artifactFileCancellationCause(cause),
            });
        return new ProviderAdapterError(this.providerId, operation, {
            cause,
            diagnostics: { stage: "artifact-resources", reason: String(cause) },
        });
    }
}
