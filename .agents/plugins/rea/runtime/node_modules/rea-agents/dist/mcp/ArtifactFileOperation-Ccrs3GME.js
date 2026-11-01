import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { C as artifactPrimaryCleanupLeases, S as ArtifactReaderFailure, T as init_ArtifactReader, a as RegularFileCancelled, b as OwnedFileHandle, g as init_RegularFile, l as withOwnedFileHandle, m as RegularFileOperationCancelled, o as RegularFileCleanupFailure, s as init_OwnedRegularFile, u as withOwnedRegularFile, x as init_OwnedFileHandle } from "./ArtifactResourceScope-B-bNzT_G.js";
import { n as AnalysisCleanupLeaseGroup, r as init_AnalysisCleanupLease, t as AnalysisCleanupLease } from "./AnalysisCleanupLease-Cqxpxr67.js";

//#region dist/artifacts/ArtifactFileOperation.js
var ArtifactFileCleanupFailure, artifactSelectedPathErrno, mapArtifactFileFailure, artifactFilePrimaryFacts, ArtifactFileCancelled, artifactFileCompletion, bindArtifactFileCleanup, artifactFileCancellationCause, assertArtifactReadActive, withArtifactRegularFile, withArtifactFileHandle, artifactOperationCause;
function init_ArtifactFileOperation() {
	return (init_ArtifactFileOperation = __esmMin((() => {
		init_RegularFile();
		init_OwnedFileHandle();
		init_OwnedRegularFile();
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		ArtifactFileCleanupFailure = class extends ArtifactReaderFailure {
			cleanupLease;
			cleanupLeases;
			fileCleanupFailure;
			constructor(fileCleanupFailure, cleanupLease) {
				const outcome = fileCleanupFailure.outcome;
				if (fileCleanupFailure.operationFailure === undefined && outcome.kind === "failed" && outcome.cause instanceof RegularFileOperationCancelled) fileCleanupFailure = new RegularFileCleanupFailure({
					...fileCleanupFailure,
					outcome: {
						kind: "failed",
						cause: artifactOperationCause(outcome.cause)
					}
				});
				const completionCancellation = fileCleanupFailure.completionCancellation;
				const primary = fileCleanupFailure.outcome.kind === "failed" ? fileCleanupFailure.outcome.cause : completionCancellation === undefined ? fileCleanupFailure.cleanupCause : new ArtifactReaderFailure("cancelled", "Artifact read cancelled during close", { cause: completionCancellation.reason });
				const projected = ArtifactReaderFailure.withCleanup(fileCleanupFailure.operationFailure !== undefined && fileCleanupFailure.outcome.kind === "failed" && Object.is(primary, fileCleanupFailure.operationFailure.operationCause) ? new ArtifactReaderFailure("io", primary instanceof Error ? primary.message : String(primary), { cause: primary }) : primary, ArtifactReaderFailure.cleanupObservation(fileCleanupFailure.cleanupCause, fileCleanupFailure.path));
				super(projected.reason, projected.message, {
					cause: fileCleanupFailure,
					cleanup: projected.cleanup,
					partialObservation: projected.partialObservation,
					cancellation: projected.cancellation,
					...projected.boundary === undefined ? {} : { boundary: projected.boundary }
				}, projected.details);
				this.cleanupLease = cleanupLease;
				this.fileCleanupFailure = fileCleanupFailure;
				const inherited = fileCleanupFailure.operationFailure === undefined && fileCleanupFailure.outcome.kind === "failed" ? artifactPrimaryCleanupLeases(fileCleanupFailure.outcome.cause) : [];
				this.cleanupLeases = inherited === undefined ? undefined : [...new Set([cleanupLease, ...inherited])];
			}
		};
		artifactSelectedPathErrno = (cause) => {
			if (!(cause instanceof Error) || !("code" in cause)) return undefined;
			switch (String(cause.code)) {
				case "ENOENT": return "ENOENT";
				case "ENOTDIR": return "ENOTDIR";
				case "ELOOP": return "ELOOP";
				case "ENAMETOOLONG": return "ENAMETOOLONG";
				default: return undefined;
			}
		};
		mapArtifactFileFailure = (cause, classify) => {
			if (!(cause instanceof ArtifactFileCleanupFailure)) return classify(cause);
			const physical = cause.fileCleanupFailure;
			if (physical.outcome.kind !== "failed") return cause;
			const primary = physical.operationFailure === undefined && physical.outcome.cause instanceof ArtifactFileCleanupFailure ? mapArtifactFileFailure(physical.outcome.cause, classify) : classify(physical.outcome.cause);
			if (Object.is(primary, physical.outcome.cause)) return cause;
			return new ArtifactFileCleanupFailure(new RegularFileCleanupFailure({
				...physical,
				outcome: {
					kind: "failed",
					cause: primary
				}
			}), cause.cleanupLease);
		};
		artifactFilePrimaryFacts = (cause) => {
			while (cause instanceof ArtifactFileCleanupFailure) {
				const physical = cause.fileCleanupFailure;
				if (physical.outcome.kind !== "failed") break;
				cause = physical.outcome.cause;
				if (physical.operationFailure !== undefined) return {
					cause,
					origin: Object.is(cause, physical.operationFailure.operationCause) ? "opaque-operation" : "owned-or-classified"
				};
			}
			return {
				cause,
				origin: "owned-or-classified"
			};
		};
		ArtifactFileCancelled = class extends ArtifactReaderFailure {
			fileCancellation;
			constructor(fileCancellation) {
				super("cancelled", "Artifact read cancelled", { cause: fileCancellation.reason });
				this.fileCancellation = fileCancellation;
			}
		};
		artifactFileCompletion = (cause) => {
			if (cause instanceof ArtifactFileCancelled) return {
				...cause.fileCancellation.outcome,
				cancellation: { reason: cause.fileCancellation.reason }
			};
			if (cause instanceof ArtifactFileCleanupFailure && cause.fileCleanupFailure.outcome.kind === "completed") return {
				...cause.fileCleanupFailure.outcome,
				cancellation: cause.fileCleanupFailure.completionCancellation
			};
			return undefined;
		};
		bindArtifactFileCleanup = (cause, error) => {
			const leases = cause instanceof ArtifactReaderFailure ? cause.cleanupLeases : undefined;
			if (leases !== undefined) new AnalysisCleanupLeaseGroup(error, leases);
		};
		artifactFileCancellationCause = (cause) => {
			return cause.cancellation === undefined ? cause.cause : cause.cancellation.reason;
		};
		assertArtifactReadActive = (signal) => {
			if (signal?.aborted) throw new ArtifactReaderFailure("cancelled", "Artifact read cancelled", { cause: signal.reason });
		};
		withArtifactRegularFile = async (path, resources, signal, operation, symlinks = "reject") => {
			let cleanupLease;
			assertArtifactReadActive(signal);
			try {
				const value = await withOwnedRegularFile(path, {
					symlinks,
					...signal === undefined ? {} : { signal },
					retainFailedClose: (owner) => {
						cleanupLease = new AnalysisCleanupLease(() => owner.close(), [path]);
						resources.retain({
							kind: "lease",
							resource: path,
							lease: cleanupLease
						});
					}
				}, async (source) => {
					assertArtifactReadActive(signal);
					return await operation(source);
				});
				return value;
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure && cleanupLease !== undefined) throw new ArtifactFileCleanupFailure(cause, cleanupLease);
				if (cause instanceof RegularFileCancelled) throw new ArtifactFileCancelled(cause);
				throw artifactOperationCause(cause);
			}
		};
		withArtifactFileHandle = async (path, file, resources, signal, operation) => {
			const owner = new OwnedFileHandle(file);
			const cleanupLease = new AnalysisCleanupLease(() => owner.close(), [path]);
			try {
				return await withOwnedFileHandle(path, owner, {
					...signal === undefined ? {} : { signal },
					retainFailedClose: () => resources?.retain({
						kind: "lease",
						resource: path,
						lease: cleanupLease
					})
				}, operation);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw new ArtifactFileCleanupFailure(cause, cleanupLease);
				if (cause instanceof RegularFileCancelled) throw new ArtifactFileCancelled(cause);
				throw artifactOperationCause(cause);
			}
		};
		artifactOperationCause = (cause) => cause instanceof RegularFileOperationCancelled ? new ArtifactReaderFailure("cancelled", "Artifact file operation cancelled", { cause: cause.reason }) : cause;
	})))();
}

//#endregion
export { artifactFilePrimaryFacts as a, bindArtifactFileCleanup as c, withArtifactFileHandle as d, withArtifactRegularFile as f, artifactFileCompletion as i, init_ArtifactFileOperation as l, ArtifactFileCleanupFailure as n, artifactSelectedPathErrno as o, artifactFileCancellationCause as r, assertArtifactReadActive as s, ArtifactFileCancelled as t, mapArtifactFileFailure as u };