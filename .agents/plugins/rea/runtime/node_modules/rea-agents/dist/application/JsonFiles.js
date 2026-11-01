import { link, lstat, mkdtemp, open, realpath, rename, } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { EvidenceFileError, } from "../domain/evidenceErrors.js";
import { AnalysisCancelledError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { err, ok } from "../domain/result.js";
import { JsonInputPhysicalReadFailure, JsonInputCancellationFailure, readJsonInputFile, readJsonObjectFile, } from "./JsonInputFile.js";
import { NonRegularFileReadError } from "../filesystem/RegularFile.js";
import { RegularFileCleanupFailure, regularFileCancellation, } from "../filesystem/OwnedRegularFile.js";
import { bindRegularFileCleanup } from "./RegularFileRead.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { bindArtifactFileCleanup } from "../artifacts/ArtifactFileOperation.js";
import { AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { OwnedStagedOutput } from "../filesystem/OwnedStagedOutput.js";
import { absoluteCallerPath } from "../filesystem/callerPath.js";
/** Read JSON data without changing the caller's existing data-only contract. */
export const readJsonFile = async (path, signal, resources, operation = "read_evidence_file") => {
    const read = await readJsonFileWithSource(path, signal, resources, operation);
    return read.ok ? ok(read.value.data) : read;
};
/** Read data and the absolute selected path at the same owning regular-file boundary. */
export const readJsonFileWithSource = (path, signal, resources, operation = "read_evidence_file") => readJsonFileInput(path, async (selected) => {
    const read = await readJsonInputFile(selected, operation, signal, resources);
    return read.ok ? ok({ data: read.value, path: selected }) : read;
}, signal, operation);
/** Read selected JSON members through the same regular-file error boundary. */
export const readJsonObjectMembersFile = (path, scans, signal, resources, operation = "read_evidence_file") => readJsonFileInput(path, (selected) => readJsonObjectFile(selected, operation, scans, signal, resources), signal, operation);
const readJsonFileInput = async (path, read, signal, operation = "read_evidence_file") => {
    const requestedPath = absoluteCallerPath(path);
    try {
        return decodedJsonFileResult(await read(requestedPath), requestedPath);
    }
    catch (cause) {
        // Caller reasons are opaque, including instances of lifecycle failure types.
        if (signal?.aborted === true && cause === signal.reason)
            return err(new AnalysisCancelledError(operation, { cause }));
        if (cause instanceof RegularFileCleanupFailure)
            return err(jsonFileCleanupError(cause, requestedPath, operation, signal));
        if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
            const primary = cause.reason === "cancelled"
                ? new AnalysisCancelledError(operation, {
                    cause: cause.cancellation === undefined
                        ? cause.cause
                        : cause.cancellation.reason,
                    partialObservation: cause.partialObservation,
                })
                : undefined;
            const error = new EvidenceFileError("read", "io", {
                cause,
                path: requestedPath,
                cleanup: cause.cleanup,
                partialObservation: cause.partialObservation,
                cleanupPrimary: primary,
                ...(primary === undefined
                    ? {}
                    : { diagnostics: { primary_error: projectAnalysisError(primary) } }),
            });
            bindRegularFileCleanup(cause, error);
            return err(error);
        }
        return err(jsonFileReadFailure(cause, requestedPath, operation, signal));
    }
};
/** Parsing owns its typed refusal even when final descriptor cleanup fails. */
const decodedJsonFileResult = (decoded, path) => {
    if (decoded.ok)
        return decoded;
    if (decoded.error instanceof AnalysisResourceConstraintError)
        return err(decoded.error);
    return err(new EvidenceFileError("read", "invalid-json", {
        cause: decoded.error.cause ??
            new SyntaxError(decoded.error.issues[0]?.message ?? decoded.error.message),
        path,
        ...(decoded.error.userMessage === undefined
            ? {}
            : { userMessage: decoded.error.userMessage }),
        contentIssues: decoded.error.issues,
    }));
};
const jsonFileReadFailure = (cause, path, operation, signal) => {
    if (cause instanceof AnalysisResourceConstraintError)
        return cause;
    if (cause instanceof JsonInputCancellationFailure)
        return new AnalysisCancelledError(operation, { cause: cause.reason });
    if (cause instanceof JsonInputPhysicalReadFailure)
        return new EvidenceFileError("read", "io", {
            cause: cause.physicalCause,
            path,
        });
    if (isJsonReadCancellation(cause, signal))
        return new AnalysisCancelledError(operation, { cause: signal?.reason });
    return new EvidenceFileError("read", cause instanceof NonRegularFileReadError
        ? "not-file"
        : fileAccessFailureReason(cause), { cause, path });
};
/** Translate the physical outcome once, binding the resulting Result to its owner. */
const jsonFileCleanupError = (failure, path, operation, signal) => {
    const cleanup = new EvidenceFileError("read", "io", {
        cause: failure,
        path,
        cleanup: {
            reason: failure.cleanupCause instanceof Error
                ? failure.cleanupCause.message
                : String(failure.cleanupCause),
            resources: [failure.path],
        },
    });
    bindRegularFileCleanup(failure, cleanup);
    const cancellation = regularFileCancellation(failure);
    let primary;
    if (failure.outcome.kind === "failed") {
        primary =
            cancellation === undefined
                ? jsonFileReadFailure(failure.outcome.cause, path, operation, signal)
                : new AnalysisCancelledError(operation, { cause: cancellation.reason });
    }
    else {
        const decoded = decodedJsonFileResult(failure.outcome.value, path);
        if (!decoded.ok)
            primary = decoded.error;
        else if (cancellation !== undefined)
            primary = new AnalysisCancelledError(operation, {
                cause: cancellation.reason,
            });
    }
    if (primary === undefined)
        return cleanup;
    return new EvidenceFileError("read", "io", {
        path,
        cause: new AggregateError([primary, cleanup], "JSON read and cleanup failures", { cause: primary }),
        cleanupPrimary: primary,
        cleanup: cleanup.cleanup,
        diagnostics: { primary_error: projectAnalysisError(primary) },
    }).bindCleanupDependencies([primary, cleanup]);
};
const isJsonReadCancellation = (cause, signal) => {
    if (signal?.aborted !== true)
        return false;
    if (cause === signal.reason)
        return true;
    return (cause instanceof Error &&
        cause.name === "AbortError" &&
        "code" in cause &&
        cause.code === "ABORT_ERR" &&
        cause.cause === signal.reason);
};
/** Atomically write text to the caller-supplied path. */
export const writeTextFile = async (encoded, path, overwrite, resources) => writeTextParts([encoded], path, overwrite, resources);
export function writeTextParts(parts, path, overwrite, resources, cancellation) {
    return resources
        .run(() => writeTextPartsOwned(parts, path, overwrite, resources, cancellation))
        .catch((cause) => {
        const cleanup = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined
            ? cause.cleanup
            : undefined;
        const error = new EvidenceFileError("write", "io", {
            cause,
            path: absoluteCallerPath(path),
            ...(cleanup === undefined ? {} : { cleanup }),
        });
        // A failed admission retry names its exact retained leases.
        bindArtifactFileCleanup(cause, error);
        return err(error);
    });
}
const writeTextPartsOwned = async (parts, path, overwrite, resources, cancellation) => {
    const requestedPath = absoluteCallerPath(path);
    try {
        assertWriteActive(cancellation);
        if (process.platform !== "win32" && requestedPath.endsWith("/"))
            return err(new EvidenceFileError("write", "not-file", { path: requestedPath }));
        const canonicalParent = await realpath(dirname(requestedPath));
        const destination = resolve(canonicalParent, basename(requestedPath));
        const existing = await lstat(destination).catch((cause) => {
            if (fileErrorCode(cause) === "ENOENT")
                return undefined;
            throw cause;
        });
        if (existing !== undefined) {
            if (!overwrite)
                return err(new EvidenceFileError("write", "exists", { path: requestedPath }));
            if (!existing.isFile() || existing.isSymbolicLink())
                return err(new EvidenceFileError("write", "not-file", { path: requestedPath }));
        }
        assertWriteActive(cancellation);
        const bytes = await publishFile(destination, parts, overwrite, resources, cancellation);
        return ok({ path: requestedPath, bytes });
    }
    catch (cause) {
        if (cause instanceof StagedOutputCleanupFailure) {
            const cleanup = {
                reason: failureMessage(cause.cleanupCause),
                resources: [cause.owner.directory],
            };
            if (cause.outcome.ok)
                return stagedCleanupFailure(new EvidenceFileError("write", "io", {
                    cause,
                    path: requestedPath,
                    cleanup,
                    published: { ...cause.outcome.value, path: requestedPath },
                }), cause.lease);
            if (cause.outcome.error instanceof AnalysisCancelledError)
                return stagedCleanupFailure(new AnalysisCancelledError(cause.outcome.error.operation, {
                    cause: cause.outcome.error.cause,
                    cleanupPrimary: cause.outcome.error,
                    cleanup,
                }), cause.lease);
            return stagedCleanupFailure(new EvidenceFileError("write", fileAccessFailureReason(cause.outcome.error), {
                cause,
                path: requestedPath,
                cleanup,
            }), cause.lease);
        }
        if (cancellation?.signal.aborted === true &&
            cause instanceof AnalysisCancelledError &&
            cause.operation === cancellation.operation)
            return err(cause);
        if (!overwrite && fileErrorCode(cause) === "EEXIST")
            return err(new EvidenceFileError("write", "exists", {
                cause,
                path: requestedPath,
            }));
        return err(new EvidenceFileError("write", fileAccessFailureReason(cause), {
            cause,
            path: requestedPath,
        }));
    }
};
/** The retained staging lease clears this error only when a retry confirms release. */
const stagedCleanupFailure = (error, lease) => {
    new AnalysisCleanupLeaseGroup(error, [lease]);
    return err(error);
};
/** A missing path or parent is a selection error, not a permission failure. */
const fileAccessFailureReason = (cause) => {
    const code = fileErrorCode(cause);
    if (code === "ENAMETOOLONG")
        return "path-limit";
    return code === "ENOENT" || code === "ENOTDIR" ? "missing" : "io";
};
const publishFile = async (destination, parts, overwrite, resources, cancellation) => {
    const { owner, staged, file } = await acquireStagedFile(dirname(destination), resources, cancellation);
    let outcome;
    try {
        let written;
        try {
            const bytes = await writeStagedParts(file, parts, cancellation);
            assertWriteActive(cancellation);
            await file.sync();
            written = ok(bytes);
        }
        catch (cause) {
            written = err(cause);
        }
        try {
            await owner.closeFile();
        }
        catch (cause) {
            if (written.ok)
                written = err(cause);
        }
        if (!written.ok)
            throw written.error;
        // Once submitted, atomic publication can win a later cancellation race.
        assertWriteActive(cancellation);
        await owner.assertReadyForPublication(staged);
        assertWriteActive(cancellation);
        if (overwrite) {
            await rename(staged, destination);
            owner.recordPublishedRename();
        }
        // A hard link publishes complete bytes atomically and cannot replace an existing name.
        else
            await link(staged, destination);
        outcome = ok({ path: destination, bytes: written.value });
    }
    catch (cause) {
        outcome = err(cause);
    }
    // One cleanup phase owns both the open descriptor (if any) and its staging directory.
    const released = await resources.release({
        kind: "staged-output",
        resource: owner.directory,
        output: owner,
    });
    if (released.kind === "failed")
        throw new StagedOutputCleanupFailure(outcome, released.cause, owner, released.lease);
    if (!outcome.ok)
        throw outcome.error;
    return outcome.value.bytes;
};
/** Keep staging on the destination filesystem without imposing a shorter path ceiling. */
const acquireStagedFile = async (destinationParent, resources, cancellation) => {
    const destinationDevice = (await lstat(destinationParent)).dev;
    let parent = destinationParent;
    for (;;) {
        assertWriteActive(cancellation);
        let failure;
        let directory;
        try {
            directory = await mkdtemp(resolve(parent, ".rea-write-"));
        }
        catch (cause) {
            if (fileErrorCode(cause) !== "ENAMETOOLONG")
                throw cause;
            failure = cause;
        }
        if (directory !== undefined) {
            const owner = await OwnedStagedOutput.create(directory);
            const staged = resolve(directory, "content");
            try {
                const file = await open(staged, "wx", 0o600);
                owner.setFile(new OwnedFileHandle(file));
                return { owner, staged, file };
            }
            catch (cause) {
                const released = await resources.release({
                    kind: "staged-output",
                    resource: owner.directory,
                    output: owner,
                });
                if (released.kind === "failed")
                    throw new StagedOutputCleanupFailure(err(cause), released.cause, owner, released.lease);
                if (fileErrorCode(cause) !== "ENAMETOOLONG")
                    throw cause;
                failure = cause;
            }
        }
        const ancestor = dirname(parent);
        if (ancestor === parent)
            throw failure;
        const metadata = await lstat(ancestor);
        if (metadata.dev !== destinationDevice)
            throw failure;
        parent = ancestor;
    }
};
class StagedOutputCleanupFailure extends Error {
    outcome;
    cleanupCause;
    owner;
    lease;
    constructor(outcome, cleanupCause, owner, lease) {
        super("Staged output cleanup failed", {
            cause: outcome.ok ? cleanupCause : outcome.error,
        });
        this.outcome = outcome;
        this.cleanupCause = cleanupCause;
        this.owner = owner;
        this.lease = lease;
    }
}
const failureMessage = (cause) => cause instanceof Error ? cause.message || cause.name : String(cause);
const writeStagedParts = async (file, parts, cancellation) => {
    assertWriteActive(cancellation);
    const iterator = parts[Symbol.iterator]();
    let exhausted = false;
    let bytes = 0;
    try {
        for (;;) {
            assertWriteActive(cancellation);
            const part = iterator.next();
            if (part.done)
                exhausted = true;
            assertWriteActive(cancellation);
            if (part.done)
                return bytes;
            await file.writeFile(part.value, { encoding: "utf8" });
            bytes += Buffer.byteLength(part.value, "utf8");
        }
    }
    finally {
        if (!exhausted)
            iterator.return?.();
    }
};
const assertWriteActive = (cancellation) => {
    if (cancellation?.signal.aborted === true)
        throw new AnalysisCancelledError(cancellation.operation, {
            cause: cancellation.signal.reason,
        });
};
const fileErrorCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause
    ? cause.code
    : undefined;
