import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ArtifactReaderFailure, OwnedRegularFileOperationFailure, RegularFileCancelled, RegularFileChangedError, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile, regularFileCancellation, sameRegularFileState, withOwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DNoM_zCF.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { lstat, stat } from "node:fs/promises";

//#region dist/application/RegularFileRead.js
var RetainedRegularFileCleanupFailure, bindRegularFileCleanup, RegularFileReadFailure, InvalidUtf8FileError, retryRegularFileCleanup, retryRegularFileCleanupFailures, failureMessage, withRegularFileCompletion, withRegularFile, readRegularFile, readRegularFileText, readRegularFileTextSnapshot, decodeFileText, readRegularFileContent;
function init_RegularFileRead() {
	return (init_RegularFileRead = __esmMin((() => {
		init_RegularFile();
		init_OwnedRegularFile();
		init_BoundedFileBytes();
		init_AnalysisCleanupLease();
		init_ArtifactReader();
		RetainedRegularFileCleanupFailure = class RetainedRegularFileCleanupFailure extends RegularFileCleanupFailure {
			cleanupOwner;
			cleanupLease;
			constructor(failure) {
				super(failure);
				this.cleanupLease = failure instanceof RetainedRegularFileCleanupFailure ? failure.cleanupLease : new AnalysisCleanupLease(() => failure.owner.close(), [failure.path]);
				this.cleanupOwner = failure instanceof RetainedRegularFileCleanupFailure ? failure.cleanupOwner : {
					kind: "lease",
					resource: failure.path,
					lease: this.cleanupLease
				};
			}
		};
		bindRegularFileCleanup = (cause, error) => {
			const leases = cause instanceof RetainedRegularFileCleanupFailure ? [cause.cleanupLease] : cause instanceof ArtifactReaderFailure ? cause.cleanupLeases : undefined;
			if (leases !== undefined) new AnalysisCleanupLeaseGroup(error, leases);
		};
		RegularFileReadFailure = class extends OwnedRegularFileOperationFailure {
			_tag = "RegularFileReadFailure";
			constructor(operationCause) {
				super(operationCause);
				this.name = this._tag;
			}
		};
		InvalidUtf8FileError = class extends TypeError {
			path;
			_tag = "InvalidUtf8FileError";
			constructor(path, cause) {
				super(`File is not valid UTF-8: ${path}`, { cause });
				this.path = path;
				this.name = this._tag;
			}
		};
		retryRegularFileCleanup = async (failure, resources, signal) => {
			const outcome = failure.outcome.kind === "failed" && failure.operationFailure === undefined && failure.outcome.cause instanceof RegularFileOperationCancelled && !(signal?.aborted === true && failure.outcome.cause === signal.reason) ? {
				kind: "failed",
				cause: failure.outcome.cause.reason
			} : failure.outcome;
			const retained = failure instanceof RetainedRegularFileCleanupFailure ? failure : new RetainedRegularFileCleanupFailure(failure);
			const released = await resources.release(retained.cleanupOwner);
			if (released.kind === "released") return { outcome };
			return {
				outcome,
				cleanupLease: released.lease,
				failure: retained,
				cleanup: {
					reason: `${failureMessage(failure.cleanupCause)}; retry: ${failureMessage(released.cause)}`,
					resources: [failure.path]
				}
			};
		};
		retryRegularFileCleanupFailures = async (failure, resources) => {
			const failures = [];
			const cleanupLeases = new Set();
			const observations = [];
			let current = failure;
			let primary;
			for (;;) {
				const retried = await retryRegularFileCleanup(current, resources);
				if (retried.cleanupLease !== undefined) cleanupLeases.add(retried.cleanupLease);
				failures.push(retried.failure ?? current);
				if (retried.cleanup !== undefined) observations.push(retried.cleanup);
				primary = retried.outcome.kind === "failed" ? retried.outcome.cause : current.cleanupCause;
				const nested = current.operationFailure === undefined && current.outcome.kind === "failed" ? current.outcome.cause : undefined;
				if (!(nested instanceof RegularFileCleanupFailure)) break;
				current = nested;
			}
			return {
				primary,
				failures,
				cleanupLeases: [...cleanupLeases],
				...observations.length === 0 ? {} : { cleanup: {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: observations.flatMap(({ resources }) => resources)
				} }
			};
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		withRegularFileCompletion = async (path, read, options = {}) => {
			const { signal, resources } = options;
			let admitted;
			const operation = async () => {
				try {
					const value = await withOwnedRegularFile(path, {
						...signal === undefined ? {} : { signal },
						symlinks: options.symlinks ?? "follow"
					}, async ({ handle, initial: stats }) => {
						admitted = handle;
						assertRegularFileActive(signal);
						const value = await read(handle, stats);
						assertRegularFileActive(signal);
						const [opened, currentPath] = await Promise.all([handle.stat(), options.symlinks === "reject" ? lstat(path) : stat(path)]);
						if (!sameRegularFileState(stats, opened) || !sameRegularFileState(stats, currentPath)) throw new RegularFileChangedError(path);
						assertRegularFileActive(signal);
						return value;
					});
					return { value };
				} catch (cause) {
					if (signal?.aborted === true && cause === signal.reason) throw cause;
					if (cause instanceof RegularFileReadFailure) throw cause;
					if (cause instanceof RegularFileCancelled && cause.owner.handle !== admitted) throw cause;
					if (cause instanceof RegularFileCleanupFailure) {
						if (resources === undefined) throw new RetainedRegularFileCleanupFailure(cause);
						const retry = await retryRegularFileCleanup(cause, resources, signal);
						if (retry.failure !== undefined) throw retry.failure;
						if (retry.outcome.kind === "failed") {
							if (cause.operationFailure === undefined && signal?.aborted === true && retry.outcome.cause === signal.reason) throw signal.reason;
							const cancellation = cause.operationFailure === undefined ? regularFileCancellation(retry.outcome.cause) ?? regularFileCancellation(cause) : undefined;
							if (cancellation !== undefined) {
								if (options.cancellationFailure !== undefined) throw options.cancellationFailure(cancellation.reason);
								throw cancellation.reason;
							}
							if (cause.operationFailure !== undefined && options.cancellationFailure !== undefined) throw cause.operationFailure;
							throw retry.outcome.cause;
						}
						return {
							value: retry.outcome.value,
							cancellation: regularFileCancellation(cause)
						};
					}
					if (cause instanceof RegularFileCancelled) return {
						value: cause.outcome.value,
						cancellation: { reason: cause.reason }
					};
					const cancellation = regularFileCancellation(cause);
					if (cancellation !== undefined) {
						if (options.cancellationFailure !== undefined) throw options.cancellationFailure(cancellation.reason);
						throw cancellation.reason;
					}
					if (options.cancellationFailure !== undefined) throw new RegularFileReadFailure(cause);
					throw cause;
				}
			};
			const completion = await (resources === undefined ? operation() : resources.run(operation));
			return completion.cancellation !== undefined || signal?.aborted !== true ? completion : {
				...completion,
				cancellation: { reason: signal.reason }
			};
		};
		withRegularFile = async (path, read, options = {}) => {
			const completion = await withRegularFileCompletion(path, read, options);
			const cancellation = completion.cancellation ?? (options.signal?.aborted === true ? { reason: options.signal.reason } : undefined);
			if (cancellation !== undefined) {
				const { reason } = cancellation;
				if (options.cancellationFailure !== undefined) throw options.cancellationFailure(reason);
				throw reason;
			}
			return completion.value;
		};
		readRegularFile = (path, options = {}) => readRegularFileContent(path, (bytes) => bytes, options);
		readRegularFileText = (path, options = {}) => readRegularFileContent(path, (bytes) => decodeFileText(path, bytes), options);
		readRegularFileTextSnapshot = (path, options = {}) => readRegularFileContent(path, (bytes, state) => ({
			text: decodeFileText(path, bytes),
			state
		}), options);
		decodeFileText = (path, bytes) => {
			try {
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes);
			} catch (cause) {
				if (!(cause instanceof TypeError)) throw cause;
				throw new InvalidUtf8FileError(path, cause);
			}
		};
		readRegularFileContent = (path, decode, options) => {
			const operation = withRegularFile(path, async (handle, stats) => {
				try {
					options.admit?.(stats);
					const bytes = await readBoundedFileBytes(handle, stats.size, {
						...options.signal === undefined ? {} : { signal: options.signal },
						cancellationFailure: (reason) => new RegularFileOperationCancelled(reason),
						operationFailure: (cause) => new RegularFileReadFailure(cause)
					});
					if (bytes === undefined || bytes.length !== stats.size) throw new RegularFileChangedError(path);
					return decode(bytes, stats);
				} catch (cause) {
					if (options.cancellationFailure !== undefined && !(cause instanceof RegularFileOperationCancelled) && !(cause instanceof RegularFileReadFailure)) throw new RegularFileReadFailure(cause);
					throw cause;
				}
			}, options);
			if (options.cancellationFailure !== undefined) return operation;
			return operation.catch((cause) => {
				if (cause instanceof RegularFileReadFailure) throw cause.operationCause;
				throw cause;
			});
		};
	})))();
}

//#endregion
export { InvalidUtf8FileError, RegularFileReadFailure, RetainedRegularFileCleanupFailure, bindRegularFileCleanup, init_RegularFileRead, readRegularFile, readRegularFileText, readRegularFileTextSnapshot, retryRegularFileCleanup, retryRegularFileCleanupFailures, withRegularFile, withRegularFileCompletion };