import { createHash } from "node:crypto";
import { MANAGED_STATIC_PROVIDER } from "../domain/investigationProviders.js";
import { classifyBinaryTargetFilesystemFailure } from "../application/BinaryTargetResolver.js";
import { RegularFileCleanupFailure, regularFileCancellation, } from "../filesystem/OwnedRegularFile.js";
import { bindRegularFileCleanup, withRegularFileCompletion, } from "../application/RegularFileRead.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { fixedAllowanceOptions } from "../domain/fixedAllowanceRemediation.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { RegularFileChangedError } from "../filesystem/RegularFile.js";
import { readBoundedFileBytes } from "../process/BoundedFileBytes.js";
// Managed static inspection retains the complete PE snapshot in memory.
export const MAX_MANAGED_SNAPSHOT_BYTES = 128 * 1024 * 1024;
/** Admit one observed source digest before any parser or cache consumes its bytes. */
export const verifyManagedSourceIdentity = (target, observed, operation) => observed.sha256 === target.sha256
    ? ok(null)
    : err(new AnalysisArtifactChangedError(operation, target.path, `Managed artifact digest changed after open: expected ${target.sha256}, observed ${observed.sha256} at ${target.path}`, {
        diagnostics: {
            expected_sha256: target.sha256,
            observed_sha256: observed.sha256,
            observed_bytes: observed.byteLength,
        },
    }));
const managedSnapshotCapacityError = (operation) => new AnalysisResourceConstraintError(operation, "memory", "Managed static inspection requires an eagerly retained PE snapshot within its input byte budget.", { max_snapshot_bytes: MAX_MANAGED_SNAPSHOT_BYTES }, fixedAllowanceOptions("The managed PE snapshot allowance", "parser"));
export const readManagedSnapshot = async (path, operation, options = {}) => {
    return readManagedFile(path, operation, async (handle, metadata) => {
        const signal = options.signal;
        if (metadata.size > MAX_MANAGED_SNAPSHOT_BYTES)
            throw managedSnapshotCapacityError(operation);
        const bytes = await readBoundedFileBytes(handle, MAX_MANAGED_SNAPSHOT_BYTES, { signal });
        if (bytes === undefined)
            throw managedSnapshotCapacityError(operation);
        signal?.throwIfAborted();
        return {
            byteLength: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            bytes,
        };
    }, options);
};
export const hashManagedSource = async (path, operation, options = {}) => readManagedFile(path, operation, async (handle, metadata) => {
    const signal = options.signal;
    if (metadata.size > MAX_MANAGED_SNAPSHOT_BYTES)
        throw managedSnapshotCapacityError(operation);
    const digest = createHash("sha256");
    let byteLength = 0;
    const chunk = Buffer.allocUnsafe(64 * 1024);
    for (;;) {
        signal?.throwIfAborted();
        const { bytesRead } = await handle.read(chunk, 0, Math.min(chunk.length, MAX_MANAGED_SNAPSHOT_BYTES - byteLength + 1), null);
        signal?.throwIfAborted();
        if (bytesRead === 0)
            break;
        if (bytesRead > MAX_MANAGED_SNAPSHOT_BYTES - byteLength)
            throw managedSnapshotCapacityError(operation);
        byteLength += bytesRead;
        digest.update(chunk.subarray(0, bytesRead));
    }
    return { byteLength, sha256: digest.digest("hex") };
}, options);
const readManagedFile = (path, operation, read, options) => withRegularFileCompletion(path, read, options)
    .then(({ value, cancellation }) => {
    if (cancellation !== undefined)
        throw new AnalysisCancelledError(operation, {
            cause: cancellation.reason,
            partialObservation: {
                kind: "file-snapshot-hash",
                path,
                bytes: value.byteLength,
                sha256: value.sha256,
            },
        });
    return value;
})
    .catch((cause) => {
    throw normalizeManagedReadFailure(cause, path, operation, options.signal);
});
/** Keep cleanup ownership and the original typed read failure at this boundary. */
const normalizeManagedReadFailure = (cause, fallbackPath, operation, signal) => {
    // An exact caller reason is opaque, even if it resembles a cleanup record.
    if (signal?.aborted === true && cause === signal.reason)
        return normalizeReadFailure(cause, fallbackPath, operation, signal);
    const cleanupError = managedCleanupError(cause, fallbackPath, operation, signal);
    if (cleanupError !== undefined)
        return cleanupError;
    return normalizeReadFailure(cause, fallbackPath, operation, signal);
};
/** Project cleanup failures owned by managed file reads or their shared scope. */
export const managedCleanupError = (cause, fallbackPath, operation, signal) => {
    if (cause instanceof RegularFileCleanupFailure) {
        const cancellation = regularFileCancellation(cause);
        const cleanup = new ProviderCleanupError(MANAGED_STATIC_PROVIDER.id, [cause.path], { reason: "A managed input file handle could not be closed" }, { cause, operation });
        bindRegularFileCleanup(cause, cleanup);
        const failure = cause.outcome.kind === "failed"
            ? normalizeReadFailure(cause.outcome.cause, cause.path, operation, signal)
            : cancellation === undefined
                ? undefined
                : new AnalysisCancelledError(operation, {
                    cause: cancellation.reason,
                });
        // This boundary produces only these snapshot facts. The descriptor owner
        // confirms completion independently of a failed final close.
        if (cause.outcome.kind === "completed") {
            const observed = cause.outcome.value;
            const observation = {
                kind: "file-snapshot-hash",
                path: cause.path,
                bytes: observed.byteLength,
                sha256: observed.sha256,
            };
            cleanup.retainPartialObservation(observation);
            if (failure instanceof AnalysisError)
                failure.retainPartialObservation(observation);
        }
        return failure instanceof AnalysisError
            ? analysisErrorWithCleanupFailure(failure, cleanup, operation).bindCleanupDependencies([failure, cleanup])
            : cleanup;
    }
    if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
        const error = new ProviderCleanupError(MANAGED_STATIC_PROVIDER.id, cause.cleanup.resources.length > 0
            ? cause.cleanup.resources
            : [fallbackPath], { reason: cause.cleanup.reason }, { cause, operation, partialObservation: cause.partialObservation });
        bindRegularFileCleanup(cause, error);
        if (cause.reason === "cancelled") {
            const cancelled = new AnalysisCancelledError(operation, {
                cause: cause.cancellation === undefined
                    ? cause.cause
                    : cause.cancellation.reason,
                partialObservation: cause.partialObservation,
            });
            return analysisErrorWithCleanupFailure(cancelled, error, operation).bindCleanupDependencies([cancelled, error]);
        }
        return error;
    }
    return undefined;
};
const normalizeReadFailure = (cause, path, operation, signal) => {
    if (signal?.aborted === true && cause === signal.reason)
        return new AnalysisCancelledError(operation, { cause });
    if (cause instanceof RegularFileChangedError)
        return new AnalysisArtifactChangedError(operation, path, cause.message, {
            cause,
        });
    if (cause instanceof AnalysisError)
        return cause;
    return (classifyBinaryTargetFilesystemFailure(path, cause) ??
        (signal?.aborted === true
            ? new AnalysisCancelledError(operation, { cause })
            : cause));
};
