import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_analysisErrorBase, t as AnalysisError } from "./analysisErrorBase-BNnZv0cP.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { r as init_AnalysisCleanupLease, t as AnalysisCleanupLease } from "./AnalysisCleanupLease-Cqxpxr67.js";
import { constants } from "node:fs";
import { constants as constants$1 } from "node:os";
import { lstat, open, stat } from "node:fs/promises";

//#region dist/artifacts/ArtifactReader.js
var sameArtifactSourceIdentity, copyArtifactEntry, sameArtifactEntry, sameDeclaredIntegrity, sameFormatMetadata, ArtifactReaderFailure, combineCleanup, errorMessage, artifactPrimaryCleanupLeases;
function init_ArtifactReader() {
	return (init_ArtifactReader = __esmMin((() => {
		init_analysisErrorBase();
		sameArtifactSourceIdentity = (expected, observed) => expected !== undefined && observed.dev === expected.device && observed.ino === expected.inode && observed.size === expected.size && observed.mode === expected.mode && observed.mtimeNs === expected.mtimeNs && observed.ctimeNs === expected.ctimeNs;
		copyArtifactEntry = (entry) => ({
			...entry,
			limitations: [...entry.limitations],
			declaredIntegrity: entry.declaredIntegrity === null ? null : { ...entry.declaredIntegrity },
			...entry.formatMetadata === undefined ? {} : { formatMetadata: { ...entry.formatMetadata } },
			...entry.sourceIdentity === undefined ? {} : { sourceIdentity: { ...entry.sourceIdentity } }
		});
		sameArtifactEntry = (entry, produced) => entry.path === produced.path && entry.sourcePath === produced.sourcePath && entry.kind === produced.kind && entry.declaredSize === produced.declaredSize && entry.compressedSize === produced.compressedSize && entry.executable === produced.executable && entry.encrypted === produced.encrypted && entry.byteOffset === produced.byteOffset && sameDeclaredIntegrity(entry.declaredIntegrity, produced.declaredIntegrity) && sameFormatMetadata(entry.formatMetadata, produced.formatMetadata) && entry.unpacked === produced.unpacked && entry.adapterKey === produced.adapterKey && entry.limitations.length === produced.limitations.length && entry.limitations.every((limitation, index) => limitation === produced.limitations[index]) && entry.sourceIdentity?.device === produced.sourceIdentity?.device && entry.sourceIdentity?.inode === produced.sourceIdentity?.inode && entry.sourceIdentity?.size === produced.sourceIdentity?.size && entry.sourceIdentity?.mode === produced.sourceIdentity?.mode && entry.sourceIdentity?.mtimeNs === produced.sourceIdentity?.mtimeNs && entry.sourceIdentity?.ctimeNs === produced.sourceIdentity?.ctimeNs;
		sameDeclaredIntegrity = (left, right) => left === right || left !== null && left !== undefined && right !== null && right !== undefined && left.algorithm === right.algorithm && left.digest === right.digest;
		sameFormatMetadata = (left, right) => left === right || left !== undefined && right !== undefined && Object.keys(left).length === Object.keys(right).length && Object.entries(left).every(([key, value]) => Object.hasOwn(right, key) && Reflect.get(right, key) === value);
		ArtifactReaderFailure = class ArtifactReaderFailure extends Error {
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
				this.cancellation = reason === "cancelled" ? options?.cancellation ?? { reason: options?.cause } : undefined;
				this.cleanup = options?.cleanup;
				this.cleanupLeases = options?.cleanupLeases ?? (this.cleanup === undefined ? [] : undefined);
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
				const primary = cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("io", errorMessage(cause), {
					cause,
					...cause instanceof AnalysisError ? {
						partialObservation: cause.partialObservation,
						...cause.cleanupIncomplete ? { cleanup: ArtifactReaderFailure.cleanupObservation(cause, []) } : {}
					} : {}
				});
				const mergedObservation = partialObservation ?? primary.partialObservation;
				return new ArtifactReaderFailure(primary.reason, primary.message, {
					cause: primary,
					cancellation: primary.cancellation,
					cleanup: combineCleanup(primary.cleanup, cleanup),
					cleanupLeases: cleanupLeases ?? (cleanup === primary.cleanup ? primary.cleanupLeases : undefined),
					...primary.boundary === undefined ? {} : { boundary: primary.boundary },
					...primary.admission === undefined ? {} : { admission: primary.admission },
					...mergedObservation === undefined ? {} : { partialObservation: mergedObservation }
				}, primary.details);
			}
			/** Give otherwise opaque cleanup failures a concrete owned resource. */
			static cleanupObservation(cause, resource) {
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return cause.cleanup;
				if (cause instanceof AnalysisError && cause.cleanupIncomplete) return {
					reason: cause.cleanup?.reason ?? cause.message,
					resources: [...cause.cleanupResources]
				};
				return {
					reason: errorMessage(cause),
					resources: typeof resource === "string" ? [resource] : [...resource]
				};
			}
		};
		combineCleanup = (primary, cleanup) => primary === undefined || primary === cleanup ? cleanup : {
			reason: `${primary.reason}; ${cleanup.reason}`,
			resources: [...new Set([...primary.resources, ...cleanup.resources])]
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		artifactPrimaryCleanupLeases = (cause) => cause instanceof ArtifactReaderFailure ? cause.cleanupLeases : cause instanceof AnalysisError && cause.cleanupIncomplete ? undefined : [];
	})))();
}

//#endregion
//#region dist/filesystem/OwnedFileHandle.js
var OwnedFileHandle;
function init_OwnedFileHandle() {
	return (init_OwnedFileHandle = __esmMin((() => {
		OwnedFileHandle = class {
			handle;
			#state = { kind: "open" };
			constructor(handle) {
				this.handle = handle;
			}
			/** Close the owned handle, retaining an unconfirmed close as a sticky failure. */
			close() {
				if (this.#state.kind === "closed") return Promise.resolve();
				if (this.#state.kind === "closing") return this.#state.attempt;
				if (this.#state.kind === "failed") return Promise.reject(this.#state.cause);
				if (this.handle.fd < 0) {
					const cause = new Error("File handle was invalidated before this owner confirmed its close");
					this.#state = {
						kind: "failed",
						cause
					};
					return Promise.reject(cause);
				}
				const attempt = Promise.resolve().then(() => this.#attemptClose());
				this.#state = {
					kind: "closing",
					attempt
				};
				return attempt;
			}
			async #attemptClose() {
				try {
					await this.handle.close();
					this.#state = { kind: "closed" };
				} catch (cause) {
					this.#state = this.handle.fd < 0 ? {
						kind: "failed",
						cause
					} : { kind: "open" };
					throw cause;
				}
			}
		};
	})))();
}

//#endregion
//#region dist/filesystem/RegularFile.js
var RegularFileOperationCancelled, assertRegularFileActive, NonRegularFileReadError, RegularFileAdmissionFailure, RegularFileChangedError, SELECTED_REGULAR_FILE_ERROR_CODES, isSelectedRegularFileError, openRegularFile, nonRegularOpenFailure, errnos, UNOPENABLE_FILE_TYPE_ERRNOS, isUnopenableFileTypeError, sameRegularFileState;
function init_RegularFile() {
	return (init_RegularFile = __esmMin((() => {
		init_OwnedFileHandle();
		RegularFileOperationCancelled = class extends Error {
			reason;
			_tag = "RegularFileOperationCancelled";
			constructor(reason) {
				super("Regular file operation cancelled", { cause: reason });
				this.reason = reason;
				this.name = this._tag;
			}
		};
		assertRegularFileActive = (signal) => {
			if (signal?.aborted === true) throw new RegularFileOperationCancelled(signal.reason);
		};
		NonRegularFileReadError = class extends Error {
			path;
			code;
			constructor(path, directory) {
				super(`Selected input must be a regular file: ${path}`);
				this.path = path;
				this.name = "NonRegularFileReadError";
				this.code = directory ? "EISDIR" : "ENOTFILE";
			}
		};
		RegularFileAdmissionFailure = class extends Error {
			path;
			cleanupCause;
			owner;
			cause;
			constructor(path, admissionCause, cleanupCause, owner) {
				super(`Selected input failed admission and its descriptor close failed: ${path}`);
				this.path = path;
				this.cleanupCause = cleanupCause;
				this.owner = owner;
				this.name = "RegularFileAdmissionFailure";
				this.cause = admissionCause;
			}
		};
		RegularFileChangedError = class extends Error {
			path;
			code = "ESTALE";
			constructor(path, options) {
				super(`Selected input changed while being read: ${path}`, options);
				this.path = path;
				this.name = "RegularFileChangedError";
			}
		};
		SELECTED_REGULAR_FILE_ERROR_CODES = new Set([
			"ENOENT",
			"ENOTDIR",
			"ELOOP",
			"ENAMETOOLONG",
			"EISDIR",
			"ENOTFILE",
			"ESTALE"
		]);
		isSelectedRegularFileError = (cause) => {
			if (!(cause instanceof Error)) return false;
			const code = Reflect.get(cause, "code");
			return typeof code === "string" && SELECTED_REGULAR_FILE_ERROR_CODES.has(code);
		};
		openRegularFile = async (path, options) => {
			assertRegularFileActive(options.signal);
			const handle = await open(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0) | (options.symlinks === "reject" ? constants.O_NOFOLLOW ?? 0 : 0)).catch(async (cause) => {
				const nonRegular = await nonRegularOpenFailure(path, options.symlinks, cause);
				if (nonRegular === undefined) throw cause;
				throw nonRegular;
			});
			const owner = new OwnedFileHandle(handle);
			try {
				assertRegularFileActive(options.signal);
				const metadata = await handle.stat();
				if (!metadata.isFile()) throw new NonRegularFileReadError(path, metadata.isDirectory());
				assertRegularFileActive(options.signal);
				if (options.symlinks === "reject" && (constants.O_NOFOLLOW ?? 0) === 0) {
					const named = await lstat(path);
					if (named.isSymbolicLink()) throw new NonRegularFileReadError(path, false);
					if (!sameRegularFileState(metadata, named)) throw new RegularFileChangedError(path);
					assertRegularFileActive(options.signal);
				}
				return {
					handle,
					initial: metadata
				};
			} catch (cause) {
				try {
					await owner.close();
				} catch (cleanupCause) {
					throw new RegularFileAdmissionFailure(path, cause, cleanupCause, owner);
				}
				throw cause;
			}
		};
		nonRegularOpenFailure = async (path, symlinks, cause) => {
			if (!isUnopenableFileTypeError(cause)) return undefined;
			const metadata = await (symlinks === "reject" ? lstat : stat)(path).catch(() => undefined);
			if (metadata === undefined || metadata.isFile()) return undefined;
			return new NonRegularFileReadError(path, metadata.isDirectory());
		};
		errnos = constants$1.errno;
		UNOPENABLE_FILE_TYPE_ERRNOS = new Set([
			errnos.ENXIO,
			errnos.EOPNOTSUPP,
			errnos.ENOTSUP
		].flatMap((errno) => errno === undefined ? [] : [-errno]));
		isUnopenableFileTypeError = (cause) => cause instanceof Error && "errno" in cause && typeof cause.errno === "number" && UNOPENABLE_FILE_TYPE_ERRNOS.has(cause.errno);
		sameRegularFileState = (expected, observed) => observed.isFile() && expected.dev === observed.dev && expected.ino === observed.ino && expected.size === observed.size && expected.mode === observed.mode && ("mtimeNs" in expected && "mtimeNs" in observed ? expected.mtimeNs === observed.mtimeNs && expected.ctimeNs === observed.ctimeNs : expected.mtimeMs === observed.mtimeMs && expected.ctimeMs === observed.ctimeMs);
	})))();
}

//#endregion
//#region dist/filesystem/OwnedRegularFile.js
var OwnedRegularFileOperationFailure, RegularFileCancelled, RegularFileCleanupFailure, regularFileCancellation, withOwnedRegularFile, withOwnedFileHandle, retainOwner;
function init_OwnedRegularFile() {
	return (init_OwnedRegularFile = __esmMin((() => {
		init_OwnedFileHandle();
		init_RegularFile();
		OwnedRegularFileOperationFailure = class extends Error {
			operationCause;
			_tag = "OwnedRegularFileOperationFailure";
			constructor(operationCause) {
				super("Owned regular-file operation failed", { cause: operationCause });
				this.operationCause = operationCause;
				this.name = this._tag;
			}
		};
		RegularFileCancelled = class extends Error {
			path;
			owner;
			_tag = "RegularFileCancelled";
			outcome;
			reason;
			constructor(path, owner, completion) {
				super(`Regular file operation cancelled after closing ${path}`, { cause: completion.reason });
				this.path = path;
				this.owner = owner;
				this.name = this._tag;
				this.outcome = completion.outcome;
				this.reason = completion.reason;
			}
		};
		RegularFileCleanupFailure = class extends Error {
			path;
			owner;
			outcome;
			cleanupCause;
			retention;
			completionCancellation;
			operationFailure;
			constructor(facts) {
				const { path, owner, outcome, cleanupCause, retention = { kind: "not_requested" }, completionCancellation, operationFailure } = facts;
				super(`Regular file cleanup failed for ${path}`, { cause: new AggregateError([
					...outcome.kind === "failed" ? [outcome.cause] : [],
					cleanupCause,
					...retention.kind === "callback_threw" ? [retention.cause] : []
				], "File operation and cleanup failures") });
				this.name = "RegularFileCleanupFailure";
				this.path = path;
				this.owner = owner;
				this.outcome = outcome;
				this.cleanupCause = cleanupCause;
				this.retention = retention;
				this.completionCancellation = completionCancellation;
				this.operationFailure = operationFailure;
			}
		};
		regularFileCancellation = (cause) => {
			if (cause instanceof RegularFileCleanupFailure && cause.operationFailure !== undefined) return cause.outcome.kind === "completed" ? cause.completionCancellation : undefined;
			const primary = cause instanceof RegularFileCleanupFailure && cause.outcome.kind === "failed" ? cause.outcome.cause : cause;
			if (primary instanceof RegularFileOperationCancelled || primary instanceof RegularFileCancelled) return { reason: primary.reason };
			return cause instanceof RegularFileCleanupFailure && cause.outcome.kind === "completed" ? cause.completionCancellation : undefined;
		};
		withOwnedRegularFile = async (path, options, operation) => {
			const source = await openRegularFile(path, {
				symlinks: options.symlinks ?? "follow",
				signal: options.signal
			}).catch((cause) => {
				if (!(cause instanceof RegularFileAdmissionFailure)) throw cause;
				const retention = retainOwner(options.retainFailedClose, cause.owner);
				throw new RegularFileCleanupFailure({
					path,
					owner: cause.owner,
					outcome: {
						kind: "failed",
						cause: cause.cause
					},
					cleanupCause: cause.cleanupCause,
					retention
				});
			});
			return withOwnedFileHandle(path, new OwnedFileHandle(source.handle), options, () => operation(source));
		};
		withOwnedFileHandle = async (path, owner, options, operation) => {
			const handle = owner.handle;
			let outcome;
			try {
				assertRegularFileActive(options.signal);
				outcome = {
					kind: "completed",
					value: await operation(handle)
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
			}
			try {
				await owner.close();
			} catch (cleanupCause) {
				const operationFailure = outcome.kind === "failed" && outcome.cause instanceof OwnedRegularFileOperationFailure ? outcome.cause : undefined;
				const retainedOutcome = operationFailure === undefined ? outcome : {
					kind: "failed",
					cause: operationFailure.operationCause
				};
				const completionCancellation = outcome.kind === "completed" && options.signal?.aborted === true ? { reason: options.signal.reason } : undefined;
				throw new RegularFileCleanupFailure({
					path,
					owner,
					outcome: retainedOutcome,
					cleanupCause,
					retention: retainOwner(options.retainFailedClose, owner),
					completionCancellation,
					operationFailure
				});
			}
			if (outcome.kind === "failed") throw outcome.cause;
			if (options.signal?.aborted === true) throw new RegularFileCancelled(path, owner, {
				outcome,
				reason: options.signal.reason
			});
			return outcome.value;
		};
		retainOwner = (retain, owner) => {
			if (retain === undefined) return { kind: "not_requested" };
			try {
				retain(owner);
				return { kind: "callback_returned" };
			} catch (cause) {
				return {
					kind: "callback_threw",
					cause
				};
			}
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactResourceScope.js
var ArtifactResourceRetryFailure, ArtifactResourceScope, cleanup;
function init_ArtifactResourceScope() {
	return (init_ArtifactResourceScope = __esmMin((() => {
		init_result();
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		ArtifactResourceRetryFailure = class extends ArtifactReaderFailure {
			failedOwners;
			cleanupLeases;
			constructor(failures, message, options) {
				super("unavailable", message, options);
				this.failedOwners = failures.map(({ owner }) => owner);
				this.cleanupLeases = [...new Set(failures.map(({ lease }) => lease))];
			}
		};
		ArtifactResourceScope = class {
			#pending = new Set();
			#leases = new WeakMap();
			#active = new Set();
			#draining;
			#closeInFlight;
			#closeHooks = [];
			#closed = false;
			get hasPending() {
				return this.#pending.size > 0;
			}
			/** Labels come from the exact retained owners, never from diagnostic text. */
			get cleanupResources() {
				return [...new Set([...this.#pending].flatMap((owner) => {
					const lease = this.#lease(owner);
					return lease.released ? [] : lease.cleanupResources ?? [owner.resource];
				}))];
			}
			/** Admit a resource operation while the scope remains open. */
			async run(operation) {
				while (true) {
					if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
					if (this.#draining !== undefined) await this.#draining;
					if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
					if (this.#pending.size > 0) {
						await this.retryCleanup();
						continue;
					}
					const running = Promise.resolve().then(operation);
					this.#active.add(running);
					try {
						return await running;
					} finally {
						this.#active.delete(running);
					}
				}
			}
			/** Attempt cleanup now and retain the same owner if it fails. */
			async release(owner) {
				try {
					await this.#lease(owner).release();
					this.#pending.delete(owner);
					return { kind: "released" };
				} catch (cause) {
					this.#pending.add(owner);
					this.#observeCleanupFailure(owner, cause);
					return {
						kind: "failed",
						cause,
						owner,
						lease: this.#lease(owner)
					};
				}
			}
			/** Compose initial cleanup authority without confusing it with an independent primary. */
			cleanupFailure(outcome, failures, partialObservation) {
				const observations = failures.map(({ cause, owner }) => ArtifactReaderFailure.cleanupObservation(cause, owner.resource));
				const primary = outcome.kind === "failed" ? outcome.cause : failures[0].cause;
				const inherited = outcome.kind === "failed" ? artifactPrimaryCleanupLeases(primary) : [];
				return ArtifactReaderFailure.withCleanup(primary, {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: [...new Set(observations.flatMap(({ resources }) => resources))]
				}, partialObservation, inherited === undefined ? undefined : [...new Set([...inherited, ...failures.map(({ lease }) => lease)])]);
			}
			/** Adopt an owner after another boundary's cleanup attempt failed. */
			retain(owner) {
				this.#pending.add(owner);
			}
			/** Retry retained owners without closing resource admission. */
			retryCleanup() {
				if (this.#draining !== undefined) return this.#draining;
				this.#draining = this.#drainAndRetry().finally(() => {
					this.#draining = undefined;
				});
				return this.#draining;
			}
			/**
			* Run after retained owners are released. Hooks stay registered so a later
			* close retries them, and a failing hook does not skip the ones after it.
			* Concurrent closes share one in-flight attempt.
			*/
			addCloseHook(hook) {
				this.#closeHooks.push(hook);
			}
			/** Stop admission, wait for active operations, and retry every retained owner. */
			close() {
				this.#closed = true;
				if (this.#closeInFlight !== undefined) return this.#closeInFlight;
				const attempt = this.#finishClose();
				let published;
				published = attempt.finally(() => {
					if (this.#closeInFlight === published) this.#closeInFlight = undefined;
				});
				this.#closeInFlight = published;
				return published;
			}
			/** Every registered hook runs. One failure is returned unchanged; several are aggregated. */
			async #runCloseHooks() {
				const failures = [];
				for (const hook of this.#closeHooks) {
					try {
						await hook();
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length === 0) return ok(undefined);
				if (failures.length === 1) return err(failures[0]);
				return err(new AggregateError(failures, failures.map((cause) => cause instanceof Error ? cause.message : String(cause)).join("; ")));
			}
			async #finishClose() {
				const cleanup = await this.retryCleanup().then(() => ok(undefined), (cause) => err(cause));
				const hooks = await this.#runCloseHooks();
				if (!cleanup.ok && !hooks.ok) throw this.#composeCloseFailures(cleanup.error, hooks.error);
				if (!hooks.ok) throw hooks.error;
				if (!cleanup.ok) throw cleanup.error;
			}
			/**
			* Report both outstanding owners. The pending set and the close hook stay
			* registered, so the next close retries each failed path.
			*/
			#composeCloseFailures(cleanup, hookFailure) {
				const retained = ArtifactReaderFailure.cleanupObservation(cleanup, "retained artifact cleanup");
				const hook = ArtifactReaderFailure.cleanupObservation(hookFailure, "close hook");
				const resources = [...new Set([...retained.resources, ...hook.resources])];
				const options = {
					cause: new AggregateError([cleanup, hookFailure], "Retained cleanup and a close hook both failed"),
					cleanup: {
						reason: `${retained.reason}; ${hook.reason}`,
						resources
					}
				};
				const message = `Artifact cleanup remains incomplete: ${resources.join(", ")}`;
				if (cleanup instanceof ArtifactResourceRetryFailure) return new ArtifactResourceRetryFailure(cleanup.failedOwners.map((owner) => ({
					owner,
					lease: this.#lease(owner)
				})), message, options);
				return new ArtifactReaderFailure("unavailable", message, options);
			}
			async #drainAndRetry() {
				while (this.#active.size > 0) await Promise.allSettled(this.#active);
				const failures = [];
				for (const owner of this.#pending) {
					try {
						await this.#lease(owner).release();
						this.#pending.delete(owner);
					} catch (cause) {
						this.#observeCleanupFailure(owner, cause);
						failures.push({
							owner,
							cause
						});
					}
				}
				if (failures.length === 0) return;
				const observations = failures.map(({ owner, cause }) => ArtifactReaderFailure.cleanupObservation(cause, owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease ? owner.lease.cleanupResources ?? owner.resource : owner.resource));
				const resources = [...new Set(observations.flatMap(({ resources }) => resources))];
				throw new ArtifactResourceRetryFailure(failures.map(({ owner }) => ({
					owner,
					lease: this.#lease(owner)
				})), `Artifact cleanup remains incomplete: ${resources.join(", ")}`, {
					cause: new AggregateError(failures.map(({ cause }) => cause), "One or more artifact resources remain owned"),
					cleanup: {
						reason: observations.map(({ reason }) => reason).join("; "),
						resources
					}
				});
			}
			/** This boundary owns the latest parsed child cleanup facts for a composite owner. */
			#observeCleanupFailure(owner, cause) {
				const retained = this.#leases.get(owner);
				if (retained !== undefined) retained.resources = [...ArtifactReaderFailure.cleanupObservation(cause, owner.resource).resources];
			}
			#lease(owner) {
				if (owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease) return owner.lease;
				const previous = this.#leases.get(owner);
				if (previous !== undefined) return previous.lease;
				const retained = {
					resources: [owner.resource],
					lease: new AnalysisCleanupLease(() => cleanup(owner), { get cleanupResources() {
						return retained.resources;
					} })
				};
				this.#leases.set(owner, retained);
				return retained.lease;
			}
		};
		cleanup = async (owner) => {
			switch (owner.kind) {
				case "lease":
					await owner.lease.release();
					return;
				case "javascript-source-analysis":
					await owner.analysis.close();
					return;
				case "reader":
					await owner.reader.close();
					return;
				case "file-handle":
				case "directory-handle":
					await owner.handle.close();
					return;
				case "output-tree":
					await owner.tree.rollback();
					return;
				case "staged-output":
					await owner.output.close();
					return;
				case "private-runtime-root": await owner.root.close();
			}
		};
	})))();
}

//#endregion
export { artifactPrimaryCleanupLeases as C, sameArtifactSourceIdentity as D, sameArtifactEntry as E, ArtifactReaderFailure as S, init_ArtifactReader as T, isSelectedRegularFileError as _, RegularFileCancelled as a, OwnedFileHandle as b, regularFileCancellation as c, NonRegularFileReadError as d, RegularFileAdmissionFailure as f, init_RegularFile as g, assertRegularFileActive as h, OwnedRegularFileOperationFailure as i, withOwnedFileHandle as l, RegularFileOperationCancelled as m, ArtifactResourceScope as n, RegularFileCleanupFailure as o, RegularFileChangedError as p, init_ArtifactResourceScope as r, init_OwnedRegularFile as s, ArtifactResourceRetryFailure as t, withOwnedRegularFile as u, openRegularFile as v, copyArtifactEntry as w, init_OwnedFileHandle as x, sameRegularFileState as y };