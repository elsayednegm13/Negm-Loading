import { lstat, stat } from "node:fs/promises";
import { sameRegularFileState, RegularFileChangedError, RegularFileOperationCancelled, assertRegularFileActive, } from "../filesystem/RegularFile.js";
import { RegularFileCleanupFailure, RegularFileCancelled, regularFileCancellation, withOwnedRegularFile, OwnedRegularFileOperationFailure, } from "../filesystem/OwnedRegularFile.js";
import { readBoundedFileBytes } from "../process/BoundedFileBytes.js";
import { AnalysisCleanupLeaseGroup, AnalysisCleanupLease, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
/** A scope handoff preserves the same descriptor outcome and exact retry capability. */
export class RetainedRegularFileCleanupFailure extends RegularFileCleanupFailure {
    cleanupOwner;
    cleanupLease;
    constructor(failure) {
        super(failure);
        this.cleanupLease =
            failure instanceof RetainedRegularFileCleanupFailure
                ? failure.cleanupLease
                : new AnalysisCleanupLease(() => failure.owner.close(), [failure.path]);
        this.cleanupOwner =
            failure instanceof RetainedRegularFileCleanupFailure
                ? failure.cleanupOwner
                : { kind: "lease", resource: failure.path, lease: this.cleanupLease };
    }
}
/** Bind only explicit cleanup capabilities, never resource labels or opaque causes. */
export const bindRegularFileCleanup = (cause, error) => {
    const leases = cause instanceof RetainedRegularFileCleanupFailure
        ? [cause.cleanupLease]
        : cause instanceof ArtifactReaderFailure
            ? cause.cleanupLeases
            : undefined;
    if (leases !== undefined)
        new AnalysisCleanupLeaseGroup(error, leases);
};
/** Preserves a physical descriptor-read cause until its owner has finalized. */
export class RegularFileReadFailure extends OwnedRegularFileOperationFailure {
    _tag = "RegularFileReadFailure";
    constructor(operationCause) {
        super(operationCause);
        this.name = this._tag;
    }
}
export class InvalidUtf8FileError extends TypeError {
    path;
    _tag = "InvalidUtf8FileError";
    constructor(path, cause) {
        super(`File is not valid UTF-8: ${path}`, { cause });
        this.path = path;
        this.name = this._tag;
    }
}
/** Retry a failed close through its retained owner and report any remaining cleanup. */
export const retryRegularFileCleanup = async (failure, resources, signal) => {
    const outcome = failure.outcome.kind === "failed" &&
        failure.operationFailure === undefined &&
        failure.outcome.cause instanceof RegularFileOperationCancelled &&
        !(signal?.aborted === true && failure.outcome.cause === signal.reason)
        ? { kind: "failed", cause: failure.outcome.cause.reason }
        : failure.outcome;
    const retained = failure instanceof RetainedRegularFileCleanupFailure
        ? failure
        : new RetainedRegularFileCleanupFailure(failure);
    const released = await resources.release(retained.cleanupOwner);
    if (released.kind === "released")
        return { outcome };
    return {
        outcome,
        cleanupLease: released.lease,
        failure: retained,
        cleanup: {
            reason: `${failureMessage(failure.cleanupCause)}; retry: ${failureMessage(released.cause)}`,
            resources: [failure.path],
        },
    };
};
/** Retry every explicit nested operation owner; close rejection values grant no authority. */
export const retryRegularFileCleanupFailures = async (failure, resources) => {
    const failures = [];
    const cleanupLeases = new Set();
    const observations = [];
    let current = failure;
    let primary;
    for (;;) {
        const retried = await retryRegularFileCleanup(current, resources);
        if (retried.cleanupLease !== undefined)
            cleanupLeases.add(retried.cleanupLease);
        failures.push(retried.failure ?? current);
        if (retried.cleanup !== undefined)
            observations.push(retried.cleanup);
        primary =
            retried.outcome.kind === "failed"
                ? retried.outcome.cause
                : current.cleanupCause;
        const nested = current.operationFailure === undefined &&
            current.outcome.kind === "failed"
            ? current.outcome.cause
            : undefined;
        if (!(nested instanceof RegularFileCleanupFailure))
            break;
        current = nested;
    }
    return {
        primary,
        failures,
        cleanupLeases: [...cleanupLeases],
        ...(observations.length === 0
            ? {}
            : {
                cleanup: {
                    reason: observations.map(({ reason }) => reason).join("; "),
                    resources: observations.flatMap(({ resources }) => resources),
                },
            }),
    };
};
const failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Admit one regular-file handle, retaining completion through close and cleanup retry. */
export const withRegularFileCompletion = async (path, read, options = {}) => {
    const { signal, resources } = options;
    let admitted;
    const operation = async () => {
        try {
            const value = await withOwnedRegularFile(path, {
                ...(signal === undefined ? {} : { signal }),
                symlinks: options.symlinks ?? "follow",
            }, async ({ handle, initial: stats }) => {
                admitted = handle;
                assertRegularFileActive(signal);
                const value = await read(handle, stats);
                assertRegularFileActive(signal);
                const [opened, currentPath] = await Promise.all([
                    handle.stat(),
                    options.symlinks === "reject" ? lstat(path) : stat(path),
                ]);
                if (!sameRegularFileState(stats, opened) ||
                    !sameRegularFileState(stats, currentPath))
                    throw new RegularFileChangedError(path);
                assertRegularFileActive(signal);
                return value;
            });
            return { value };
        }
        catch (cause) {
            // Caller reasons are opaque, including objects shaped like file failures.
            // They do not transfer ownership of any descriptor to this operation.
            if (signal?.aborted === true && cause === signal.reason)
                throw cause;
            if (cause instanceof RegularFileReadFailure)
                throw cause;
            if (cause instanceof RegularFileCancelled &&
                cause.owner.handle !== admitted)
                throw cause;
            if (cause instanceof RegularFileCleanupFailure) {
                if (resources === undefined)
                    throw new RetainedRegularFileCleanupFailure(cause);
                const retry = await retryRegularFileCleanup(cause, resources, signal);
                if (retry.failure !== undefined)
                    throw retry.failure;
                if (retry.outcome.kind === "failed") {
                    if (cause.operationFailure === undefined &&
                        signal?.aborted === true &&
                        retry.outcome.cause === signal.reason)
                        throw signal.reason;
                    const cancellation = cause.operationFailure === undefined
                        ? (regularFileCancellation(retry.outcome.cause) ??
                            regularFileCancellation(cause))
                        : undefined;
                    if (cancellation !== undefined) {
                        if (options.cancellationFailure !== undefined)
                            throw options.cancellationFailure(cancellation.reason);
                        throw cancellation.reason;
                    }
                    if (cause.operationFailure !== undefined &&
                        options.cancellationFailure !== undefined)
                        throw cause.operationFailure;
                    throw retry.outcome.cause;
                }
                return {
                    value: retry.outcome.value,
                    cancellation: regularFileCancellation(cause),
                };
            }
            if (cause instanceof RegularFileCancelled)
                return {
                    value: cause.outcome.value,
                    cancellation: { reason: cause.reason },
                };
            const cancellation = regularFileCancellation(cause);
            if (cancellation !== undefined) {
                if (options.cancellationFailure !== undefined)
                    throw options.cancellationFailure(cancellation.reason);
                throw cancellation.reason;
            }
            if (options.cancellationFailure !== undefined)
                throw new RegularFileReadFailure(cause);
            throw cause;
        }
    };
    const completion = await (resources === undefined
        ? operation()
        : resources.run(operation));
    // Include successful cleanup retries and scope finalization in cancellation.
    return completion.cancellation !== undefined || signal?.aborted !== true
        ? completion
        : { ...completion, cancellation: { reason: signal.reason } };
};
/** Read consumers without completion facts retain their existing cancellation contract. */
export const withRegularFile = async (path, read, options = {}) => {
    const completion = await withRegularFileCompletion(path, read, options);
    const cancellation = completion.cancellation ??
        (options.signal?.aborted === true
            ? { reason: options.signal.reason }
            : undefined);
    if (cancellation !== undefined) {
        const { reason } = cancellation;
        if (options.cancellationFailure !== undefined)
            throw options.cancellationFailure(reason);
        throw reason;
    }
    return completion.value;
};
/** Admit a regular file without waiting for a pipe, then read its verified handle. */
export const readRegularFile = (path, options = {}) => readRegularFileContent(path, (bytes) => bytes, options);
/** Read valid UTF-8 without replacing source bytes or stripping an initial BOM. */
export const readRegularFileText = (path, options = {}) => readRegularFileContent(path, (bytes) => decodeFileText(path, bytes), options);
/** Retain the read owner's verified file state together with its decoded text. */
export const readRegularFileTextSnapshot = (path, options = {}) => readRegularFileContent(path, (bytes, state) => ({
    text: decodeFileText(path, bytes),
    state,
}), options);
const decodeFileText = (path, bytes) => {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch (cause) {
        if (!(cause instanceof TypeError))
            throw cause;
        throw new InvalidUtf8FileError(path, cause);
    }
};
const readRegularFileContent = (path, decode, options) => {
    const operation = withRegularFile(path, async (handle, stats) => {
        try {
            options.admit?.(stats);
            const bytes = await readBoundedFileBytes(handle, stats.size, {
                ...(options.signal === undefined ? {} : { signal: options.signal }),
                cancellationFailure: (reason) => new RegularFileOperationCancelled(reason),
                operationFailure: (cause) => new RegularFileReadFailure(cause),
            });
            if (bytes === undefined || bytes.length !== stats.size)
                throw new RegularFileChangedError(path);
            return decode(bytes, stats);
        }
        catch (cause) {
            if (options.cancellationFailure !== undefined &&
                !(cause instanceof RegularFileOperationCancelled) &&
                !(cause instanceof RegularFileReadFailure))
                throw new RegularFileReadFailure(cause);
            throw cause;
        }
    }, options);
    if (options.cancellationFailure !== undefined)
        return operation;
    return operation.catch((cause) => {
        if (cause instanceof RegularFileReadFailure)
            throw cause.operationCause;
        throw cause;
    });
};
