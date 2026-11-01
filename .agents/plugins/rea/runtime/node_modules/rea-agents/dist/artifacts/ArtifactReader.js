import { AnalysisError } from "../domain/analysisErrorBase.js";
/** Compare captured filesystem identity and mutable metadata at a read boundary. */
export const sameArtifactSourceIdentity = (expected, observed) => expected !== undefined &&
    observed.dev === expected.device &&
    observed.ino === expected.inode &&
    observed.size === expected.size &&
    observed.mode === expected.mode &&
    observed.mtimeNs === expected.mtimeNs &&
    observed.ctimeNs === expected.ctimeNs;
/** Snapshot mutable entry metadata before the producer later validates open(). */
export const copyArtifactEntry = (entry) => ({
    ...entry,
    limitations: [...entry.limitations],
    declaredIntegrity: entry.declaredIntegrity === null ? null : { ...entry.declaredIntegrity },
    ...(entry.formatMetadata === undefined
        ? {}
        : { formatMetadata: { ...entry.formatMetadata } }),
    ...(entry.sourceIdentity === undefined
        ? {}
        : { sourceIdentity: { ...entry.sourceIdentity } }),
});
/** Compare every portable and adapter-owned fact supplied with an entry. */
export const sameArtifactEntry = (entry, produced) => entry.path === produced.path &&
    entry.sourcePath === produced.sourcePath &&
    entry.kind === produced.kind &&
    entry.declaredSize === produced.declaredSize &&
    entry.compressedSize === produced.compressedSize &&
    entry.executable === produced.executable &&
    entry.encrypted === produced.encrypted &&
    entry.byteOffset === produced.byteOffset &&
    sameDeclaredIntegrity(entry.declaredIntegrity, produced.declaredIntegrity) &&
    sameFormatMetadata(entry.formatMetadata, produced.formatMetadata) &&
    entry.unpacked === produced.unpacked &&
    entry.adapterKey === produced.adapterKey &&
    entry.limitations.length === produced.limitations.length &&
    entry.limitations.every((limitation, index) => limitation === produced.limitations[index]) &&
    entry.sourceIdentity?.device === produced.sourceIdentity?.device &&
    entry.sourceIdentity?.inode === produced.sourceIdentity?.inode &&
    entry.sourceIdentity?.size === produced.sourceIdentity?.size &&
    entry.sourceIdentity?.mode === produced.sourceIdentity?.mode &&
    entry.sourceIdentity?.mtimeNs === produced.sourceIdentity?.mtimeNs &&
    entry.sourceIdentity?.ctimeNs === produced.sourceIdentity?.ctimeNs;
const sameDeclaredIntegrity = (left, right) => left === right ||
    (left !== null &&
        left !== undefined &&
        right !== null &&
        right !== undefined &&
        left.algorithm === right.algorithm &&
        left.digest === right.digest);
/** Format metadata contracts contain only primitive source fields. */
const sameFormatMetadata = (left, right) => left === right ||
    (left !== undefined &&
        right !== undefined &&
        Object.keys(left).length === Object.keys(right).length &&
        Object.entries(left).every(([key, value]) => Object.hasOwn(right, key) && Reflect.get(right, key) === value));
/** Typed adapter failure translated at provider boundary. */
export class ArtifactReaderFailure extends Error {
    reason;
    details;
    cancellation;
    cleanup;
    cleanupLeases;
    partialObservation;
    /** The constrained bound for a `limit` reason, when the reader knows it. */
    boundary;
    /** Named admission for a limit whose public recovery is owned by the producer. */
    admission;
    constructor(reason, message, options, details) {
        super(message, options);
        this.reason = reason;
        this.details = details;
        this.name = "ArtifactReaderFailure";
        this.cancellation =
            reason === "cancelled"
                ? (options?.cancellation ?? { reason: options?.cause })
                : undefined;
        this.cleanup = options?.cleanup;
        this.cleanupLeases =
            options?.cleanupLeases ?? (this.cleanup === undefined ? [] : undefined);
        this.partialObservation = options?.partialObservation;
        this.boundary = options?.boundary;
        this.admission = options?.admission;
    }
    /** Retain completed facts when a later artifact step fails. */
    retainPartialObservation(observation) {
        this.partialObservation ??= observation;
        return this;
    }
    /** Preserve the primary failure and observation. Supplied leases must cover all merged cleanup. */
    static withCleanup(cause, cleanup, partialObservation, cleanupLeases) {
        const primary = cause instanceof ArtifactReaderFailure
            ? cause
            : new ArtifactReaderFailure("io", errorMessage(cause), {
                cause,
                ...(cause instanceof AnalysisError
                    ? {
                        partialObservation: cause.partialObservation,
                        ...(cause.cleanupIncomplete
                            ? {
                                cleanup: ArtifactReaderFailure.cleanupObservation(cause, []),
                            }
                            : {}),
                    }
                    : {}),
            });
        const mergedObservation = partialObservation ?? primary.partialObservation;
        return new ArtifactReaderFailure(primary.reason, primary.message, {
            cause: primary,
            cancellation: primary.cancellation,
            cleanup: combineCleanup(primary.cleanup, cleanup),
            cleanupLeases: cleanupLeases ??
                (cleanup === primary.cleanup ? primary.cleanupLeases : undefined),
            // The constrained bound survives cleanup wrapping, or a file-size
            // refusal would be reported as a memory constraint once a close fails.
            ...(primary.boundary === undefined
                ? {}
                : { boundary: primary.boundary }),
            ...(primary.admission === undefined
                ? {}
                : { admission: primary.admission }),
            ...(mergedObservation === undefined
                ? {}
                : { partialObservation: mergedObservation }),
        }, primary.details);
    }
    /** Give otherwise opaque cleanup failures a concrete owned resource. */
    static cleanupObservation(cause, resource) {
        if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined)
            return cause.cleanup;
        if (cause instanceof AnalysisError && cause.cleanupIncomplete)
            return {
                reason: cause.cleanup?.reason ?? cause.message,
                resources: [...cause.cleanupResources],
            };
        return {
            reason: errorMessage(cause),
            resources: typeof resource === "string" ? [resource] : [...resource],
        };
    }
}
const combineCleanup = (primary, cleanup) => primary === undefined || primary === cleanup
    ? cleanup
    : {
        reason: `${primary.reason}; ${cleanup.reason}`,
        resources: [...new Set([...primary.resources, ...cleanup.resources])],
    };
const errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Read explicit source authority; unrelated domain cleanup remains unresolved. */
export const artifactPrimaryCleanupLeases = (cause) => cause instanceof ArtifactReaderFailure
    ? cause.cleanupLeases
    : cause instanceof AnalysisError && cause.cleanupIncomplete
        ? undefined
        : [];
