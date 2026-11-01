import { OwnedFileHandle } from "./OwnedFileHandle.js";
import { openRegularFile, RegularFileAdmissionFailure, assertRegularFileActive, RegularFileOperationCancelled, } from "./RegularFile.js";
/** Physical operation origin kept separate from caller-provided error values. */
export class OwnedRegularFileOperationFailure extends Error {
    operationCause;
    _tag = "OwnedRegularFileOperationFailure";
    constructor(operationCause) {
        super("Owned regular-file operation failed", { cause: operationCause });
        this.operationCause = operationCause;
        this.name = this._tag;
    }
}
/** Cancellation after confirmed close, retaining the completed physical read. */
export class RegularFileCancelled extends Error {
    path;
    owner;
    _tag = "RegularFileCancelled";
    outcome;
    reason;
    constructor(path, owner, completion) {
        super(`Regular file operation cancelled after closing ${path}`, {
            cause: completion.reason,
        });
        this.path = path;
        this.owner = owner;
        this.name = this._tag;
        this.outcome = completion.outcome;
        this.reason = completion.reason;
    }
}
export class RegularFileCleanupFailure extends Error {
    path;
    owner;
    outcome;
    cleanupCause;
    retention;
    completionCancellation;
    operationFailure;
    constructor(facts) {
        const { path, owner, outcome, cleanupCause, retention = { kind: "not_requested" }, completionCancellation, operationFailure, } = facts;
        super(`Regular file cleanup failed for ${path}`, {
            cause: new AggregateError([
                ...(outcome.kind === "failed" ? [outcome.cause] : []),
                cleanupCause,
                ...(retention.kind === "callback_threw" ? [retention.cause] : []),
            ], "File operation and cleanup failures"),
        });
        this.name = "RegularFileCleanupFailure";
        this.path = path;
        this.owner = owner;
        this.outcome = outcome;
        this.cleanupCause = cleanupCause;
        this.retention = retention;
        this.completionCancellation = completionCancellation;
        this.operationFailure = operationFailure;
    }
}
/** Read only cancellation facts recorded by the operation or its final close. */
export const regularFileCancellation = (cause) => {
    if (cause instanceof RegularFileCleanupFailure &&
        cause.operationFailure !== undefined)
        return cause.outcome.kind === "completed"
            ? cause.completionCancellation
            : undefined;
    const primary = cause instanceof RegularFileCleanupFailure &&
        cause.outcome.kind === "failed"
        ? cause.outcome.cause
        : cause;
    if (primary instanceof RegularFileOperationCancelled ||
        primary instanceof RegularFileCancelled)
        return { reason: primary.reason };
    return cause instanceof RegularFileCleanupFailure &&
        cause.outcome.kind === "completed"
        ? cause.completionCancellation
        : undefined;
};
/** Run an operation while one admitted descriptor and its cleanup owner stay together. */
export const withOwnedRegularFile = async (path, options, operation) => {
    const source = await openRegularFile(path, {
        symlinks: options.symlinks ?? "follow",
        signal: options.signal,
    }).catch((cause) => {
        if (!(cause instanceof RegularFileAdmissionFailure))
            throw cause;
        const retention = retainOwner(options.retainFailedClose, cause.owner);
        throw new RegularFileCleanupFailure({
            path,
            owner: cause.owner,
            outcome: { kind: "failed", cause: cause.cause },
            cleanupCause: cause.cleanupCause,
            retention,
        });
    });
    return withOwnedFileHandle(path, new OwnedFileHandle(source.handle), options, () => operation(source));
};
/** Own an already admitted descriptor through its operation and final close. */
export const withOwnedFileHandle = async (path, owner, options, operation) => {
    const handle = owner.handle;
    let outcome;
    try {
        assertRegularFileActive(options.signal);
        outcome = { kind: "completed", value: await operation(handle) };
    }
    catch (cause) {
        outcome = { kind: "failed", cause };
    }
    try {
        await owner.close();
    }
    catch (cleanupCause) {
        const operationFailure = outcome.kind === "failed" &&
            outcome.cause instanceof OwnedRegularFileOperationFailure
            ? outcome.cause
            : undefined;
        const retainedOutcome = operationFailure === undefined
            ? outcome
            : {
                kind: "failed",
                cause: operationFailure.operationCause,
            };
        const completionCancellation = outcome.kind === "completed" && options.signal?.aborted === true
            ? { reason: options.signal.reason }
            : undefined;
        // Retain the physical read outcome even if the caller cancelled during
        // close: consumers may need completed observations such as a file digest.
        throw new RegularFileCleanupFailure({
            path,
            owner,
            outcome: retainedOutcome,
            cleanupCause,
            retention: retainOwner(options.retainFailedClose, owner),
            completionCancellation,
            operationFailure,
        });
    }
    if (outcome.kind === "failed")
        throw outcome.cause;
    if (options.signal?.aborted === true)
        throw new RegularFileCancelled(path, owner, {
            outcome,
            reason: options.signal.reason,
        });
    return outcome.value;
};
const retainOwner = (retain, owner) => {
    if (retain === undefined)
        return { kind: "not_requested" };
    try {
        retain(owner);
        return { kind: "callback_returned" };
    }
    catch (cause) {
        return { kind: "callback_threw", cause };
    }
};
