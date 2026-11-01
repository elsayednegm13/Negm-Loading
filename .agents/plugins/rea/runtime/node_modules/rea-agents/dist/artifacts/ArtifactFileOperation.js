import { RegularFileOperationCancelled, } from "../filesystem/RegularFile.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { withOwnedFileHandle, withOwnedRegularFile, RegularFileCancelled, RegularFileCleanupFailure, } from "../filesystem/OwnedRegularFile.js";
import { ArtifactReaderFailure, artifactPrimaryCleanupLeases, } from "./ArtifactReader.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "./AnalysisCleanupLease.js";
/** Artifact projection plus the exact descriptor owner and physical operation outcome. */
export class ArtifactFileCleanupFailure extends ArtifactReaderFailure {
    cleanupLease;
    cleanupLeases;
    fileCleanupFailure;
    constructor(fileCleanupFailure, cleanupLease) {
        const outcome = fileCleanupFailure.outcome;
        if (fileCleanupFailure.operationFailure === undefined &&
            outcome.kind === "failed" &&
            outcome.cause instanceof RegularFileOperationCancelled)
            fileCleanupFailure = new RegularFileCleanupFailure({
                ...fileCleanupFailure,
                outcome: {
                    kind: "failed",
                    cause: artifactOperationCause(outcome.cause),
                },
            });
        const completionCancellation = fileCleanupFailure.completionCancellation;
        const primary = fileCleanupFailure.outcome.kind === "failed"
            ? fileCleanupFailure.outcome.cause
            : completionCancellation === undefined
                ? fileCleanupFailure.cleanupCause
                : new ArtifactReaderFailure("cancelled", "Artifact read cancelled during close", {
                    cause: completionCancellation.reason,
                });
        const projected = ArtifactReaderFailure.withCleanup(fileCleanupFailure.operationFailure !== undefined &&
            fileCleanupFailure.outcome.kind === "failed" &&
            Object.is(primary, fileCleanupFailure.operationFailure.operationCause)
            ? new ArtifactReaderFailure("io", primary instanceof Error ? primary.message : String(primary), { cause: primary })
            : primary, ArtifactReaderFailure.cleanupObservation(fileCleanupFailure.cleanupCause, fileCleanupFailure.path));
        super(projected.reason, projected.message, {
            cause: fileCleanupFailure,
            cleanup: projected.cleanup,
            partialObservation: projected.partialObservation,
            cancellation: projected.cancellation,
            ...(projected.boundary === undefined
                ? {}
                : { boundary: projected.boundary }),
        }, projected.details);
        this.cleanupLease = cleanupLease;
        this.fileCleanupFailure = fileCleanupFailure;
        const inherited = fileCleanupFailure.operationFailure === undefined &&
            fileCleanupFailure.outcome.kind === "failed"
            ? artifactPrimaryCleanupLeases(fileCleanupFailure.outcome.cause)
            : [];
        this.cleanupLeases =
            inherited === undefined
                ? undefined
                : [...new Set([cleanupLease, ...inherited])];
    }
}
/** Return only known path-resolution errnos; permissions and I/O remain distinct. */
export const artifactSelectedPathErrno = (cause) => {
    if (!(cause instanceof Error) || !("code" in cause))
        return undefined;
    switch (String(cause.code)) {
        case "ENOENT":
            return "ENOENT";
        case "ENOTDIR":
            return "ENOTDIR";
        case "ELOOP":
            return "ELOOP";
        case "ENAMETOOLONG":
            return "ENAMETOOLONG";
        default:
            return undefined;
    }
};
/** Normalize the physical primary failure without replacing its exact cleanup owner. */
export const mapArtifactFileFailure = (cause, classify) => {
    if (!(cause instanceof ArtifactFileCleanupFailure))
        return classify(cause);
    const physical = cause.fileCleanupFailure;
    if (physical.outcome.kind !== "failed")
        return cause;
    const primary = physical.operationFailure === undefined &&
        physical.outcome.cause instanceof ArtifactFileCleanupFailure
        ? mapArtifactFileFailure(physical.outcome.cause, classify)
        : classify(physical.outcome.cause);
    if (Object.is(primary, physical.outcome.cause))
        return cause;
    return new ArtifactFileCleanupFailure(new RegularFileCleanupFailure({
        ...physical,
        outcome: { kind: "failed", cause: primary },
    }), cause.cleanupLease);
};
/** Preserve physical origin while inspecting only explicit nested operation owners. */
export const artifactFilePrimaryFacts = (cause) => {
    while (cause instanceof ArtifactFileCleanupFailure) {
        const physical = cause.fileCleanupFailure;
        if (physical.outcome.kind !== "failed")
            break;
        cause = physical.outcome.cause;
        if (physical.operationFailure !== undefined)
            return {
                cause,
                origin: Object.is(cause, physical.operationFailure.operationCause)
                    ? "opaque-operation"
                    : "owned-or-classified",
            };
    }
    return { cause, origin: "owned-or-classified" };
};
/** Cancellation after confirmed close retains the completed physical operation. */
export class ArtifactFileCancelled extends ArtifactReaderFailure {
    fileCancellation;
    constructor(fileCancellation) {
        super("cancelled", "Artifact read cancelled", {
            cause: fileCancellation.reason,
        });
        this.fileCancellation = fileCancellation;
    }
}
/** Completion facts recorded by the file owner, independent of later caller state. */
export const artifactFileCompletion = (cause) => {
    if (cause instanceof ArtifactFileCancelled)
        return {
            ...cause.fileCancellation.outcome,
            cancellation: { reason: cause.fileCancellation.reason },
        };
    if (cause instanceof ArtifactFileCleanupFailure &&
        cause.fileCleanupFailure.outcome.kind === "completed")
        return {
            ...cause.fileCleanupFailure.outcome,
            cancellation: cause.fileCleanupFailure.completionCancellation,
        };
    return undefined;
};
/** Bind a translated failure to its exact descriptor leases, including failed retries. */
export const bindArtifactFileCleanup = (cause, error) => {
    const leases = cause instanceof ArtifactReaderFailure ? cause.cleanupLeases : undefined;
    if (leases !== undefined)
        new AnalysisCleanupLeaseGroup(error, leases);
};
/** Interpret this owner's typed cancellation, preserving an undefined reason. */
export const artifactFileCancellationCause = (cause) => {
    return cause.cancellation === undefined
        ? cause.cause
        : cause.cancellation.reason;
};
/** Report cancellation at the read stage that actually observed the caller signal. */
export const assertArtifactReadActive = (signal) => {
    if (signal?.aborted)
        throw new ArtifactReaderFailure("cancelled", "Artifact read cancelled", {
            cause: signal.reason,
        });
};
/** Admit a regular file without blocking on pipes, retaining failed admission closes. */
export const withArtifactRegularFile = async (path, resources, signal, operation, symlinks = "reject") => {
    let cleanupLease;
    assertArtifactReadActive(signal);
    try {
        const value = await withOwnedRegularFile(path, {
            symlinks,
            ...(signal === undefined ? {} : { signal }),
            retainFailedClose: (owner) => {
                cleanupLease = new AnalysisCleanupLease(() => owner.close(), [path]);
                resources.retain({
                    kind: "lease",
                    resource: path,
                    lease: cleanupLease,
                });
            },
        }, async (source) => {
            assertArtifactReadActive(signal);
            return await operation(source);
        });
        return value;
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure &&
            cleanupLease !== undefined)
            throw new ArtifactFileCleanupFailure(cause, cleanupLease);
        if (cause instanceof RegularFileCancelled)
            throw new ArtifactFileCancelled(cause);
        throw artifactOperationCause(cause);
    }
};
/** Keep admission, operation outcome, final close and failed-owner transfer together. */
export const withArtifactFileHandle = async (path, file, resources, signal, operation) => {
    const owner = new OwnedFileHandle(file);
    const cleanupLease = new AnalysisCleanupLease(() => owner.close(), [path]);
    try {
        return await withOwnedFileHandle(path, owner, {
            ...(signal === undefined ? {} : { signal }),
            retainFailedClose: () => resources?.retain({
                kind: "lease",
                resource: path,
                lease: cleanupLease,
            }),
        }, operation);
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure)
            throw new ArtifactFileCleanupFailure(cause, cleanupLease);
        if (cause instanceof RegularFileCancelled)
            throw new ArtifactFileCancelled(cause);
        throw artifactOperationCause(cause);
    }
};
const artifactOperationCause = (cause) => cause instanceof RegularFileOperationCancelled
    ? new ArtifactReaderFailure("cancelled", "Artifact file operation cancelled", { cause: cause.reason })
    : cause;
