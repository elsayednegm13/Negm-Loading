import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { analysisSettingLimit, init_analysisSettingDefinitions } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisError, err, init_analysisErrorBase, init_jsonSerialization, init_result, jsonParts, ok } from "./jsonLines-Gf10X4s1.js";
import { ArtifactOperationError, init_artifactOperationError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, OwnedFileHandle, RegularFileCancelled, RegularFileCleanupFailure, RegularFileOperationCancelled, init_ArtifactReader, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, sameArtifactSourceIdentity, withOwnedFileHandle } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { ArtifactFileCancelled, ArtifactFileCleanupFailure, artifactFileCancellationCause, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { init_peOptionalHeader, readPeOptionalHeaderStructure } from "./peMachine-BoMBJgsB.js";
import { OwnedDirectoryHandle, init_OwnedDirectoryHandle } from "./OwnedDirectoryHandle-Cq1F1Ded.js";
import { init_readArtifactFileChunks, readArtifactFileChunks } from "./readArtifactFileChunks-C0neyJLE.js";
import { init_StreamBytes, streamChunkToBuffer } from "./ArtifactPaths-BSpMttuG.js";
import { createAsarHeaderSignatureProbe, init_AsarHeader } from "./AsarHeader-C-8M8Vix.js";
import { MAX_XML_PLIST_PROBE_BYTES, createXmlPlistSignatureProbe, init_appleArchiveFormat } from "./appleArchiveFormat-B-JoSBSY.js";
import { init_machoContainer, readFatContainerHeader, readFatContainerTable, readMachoHeaderPrefixFacts } from "./machoLoadCommands-CChRRK2_.js";
import { init_dosMz, observeMzWindowsHeader } from "./godotPckFormat-BQCRCg8e.js";
import { createHash } from "node:crypto";
import { extname, isAbsolute, join, relative, sep } from "node:path";
import { setImmediate } from "node:timers/promises";
import { lstat, open, opendir, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { Readable } from "node:stream";

//#region dist/artifacts/hostExecutableMarking.js
var windowsLaunchableExtensions, hostExecutableMarking;
function init_hostExecutableMarking() {
	return (init_hostExecutableMarking = __esmMin((() => {
		windowsLaunchableExtensions = new Set([
			".bat",
			".cmd",
			".com",
			".exe"
		]);
		hostExecutableMarking = (path, metadata, platform = process.platform) => platform === "win32" ? metadata.isFile() && windowsLaunchableExtensions.has(extname(path).toLowerCase()) : typeof metadata.mode === "bigint" ? (metadata.mode & 73n) !== 0n : (metadata.mode & 73) !== 0;
	})))();
}

//#endregion
//#region dist/filesystem/decodeDirectoryEntryName.js
var decodeDirectoryEntryName;
function init_decodeDirectoryEntryName() {
	return (init_decodeDirectoryEntryName = __esmMin((() => {
		decodeDirectoryEntryName = (raw) => {
			if (typeof raw === "string") return {
				kind: "decoded",
				name: raw
			};
			const name = raw.toString("utf8");
			return Buffer.from(name, "utf8").equals(raw) ? {
				kind: "decoded",
				name
			} : {
				kind: "unrepresentable",
				rawHex: raw.toString("hex")
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/DirectoryArtifactReader.js
var DirectoryArtifactTraversalLimit, DirectoryArtifactRootFailure, DirectoryArtifactEntryAccessDenied, DirectoryArtifactReader, unsupportedEntryKind, artifactEntry, safeArtifactSize, directoryIoFailure, hostErrorCode, entryOpenFailure, failureMessage, mapStableFileRead, withDirectoryIoContext, abortIfNeeded$1, assertContainedDirectory;
function init_DirectoryArtifactReader() {
	return (init_DirectoryArtifactReader = __esmMin((() => {
		init_ArtifactReader();
		init_hostExecutableMarking();
		init_OwnedDirectoryHandle();
		init_OwnedFileHandle();
		init_readArtifactFileChunks();
		init_OwnedRegularFile();
		init_RegularFile();
		init_ArtifactFileOperation();
		init_AnalysisCleanupLease();
		init_decodeDirectoryEntryName();
		DirectoryArtifactTraversalLimit = class extends ArtifactReaderFailure {
			examinedEntries;
			maximumEntries;
			constructor(examinedEntries, maximumEntries) {
				super("limit", "Directory traversal reached its examined-entry budget", { boundary: "capacity" });
				this.examinedEntries = examinedEntries;
				this.maximumEntries = maximumEntries;
			}
		};
		DirectoryArtifactRootFailure = class extends ArtifactReaderFailure {};
		DirectoryArtifactEntryAccessDenied = class extends ArtifactReaderFailure {
			systemCode;
			entryPath;
			constructor(systemCode, entryPath, message, options) {
				super("io", message, options);
				this.systemCode = systemCode;
				this.entryPath = entryPath;
			}
		};
		DirectoryArtifactReader = class {
			unreadableDirectories;
			format = "directory";
			#rootPromise;
			#rootPath;
			#directories = new Set();
			#files = new Map();
			#fileCleanup = new WeakMap();
			constructor(root, unreadableDirectories = "fail") {
				this.unreadableDirectories = unreadableDirectories;
				this.#rootPath = root;
			}
			/** Enumerate entries, optionally restricting descent while retaining directories. */
			async *entries(signal, selection) {
				const admittedRoot = await this.#resolveRoot();
				const root = admittedRoot.canonicalPath;
				const options = typeof selection === "function" ? { descendInto: selection } : selection;
				const maximum = options?.maximumEntries;
				if (maximum !== undefined && (!Number.isSafeInteger(maximum) || maximum < 0)) throw new RangeError("Directory traversal maximumEntries must be a nonnegative safe integer");
				let examined = 0;
				const examine = () => {
					if (maximum !== undefined && examined >= maximum) throw new DirectoryArtifactTraversalLimit(examined, maximum);
					examined += 1;
				};
				const pending = [root];
				let unrepresentableNameCount = 0;
				let firstUnrepresentableNameHex;
				while (pending.length > 0) {
					abortIfNeeded$1(signal);
					const directory = pending.pop();
					if (directory === undefined) break;
					await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
					try {
						for await (const entry of this.#readDirectory(directory, pending, signal, options, examine, (rawHex) => {
							unrepresentableNameCount += 1;
							firstUnrepresentableNameHex ??= rawHex;
						})) yield entry;
					} catch (cause) {
						if (this.unreadableDirectories !== "omit" || !(cause instanceof DirectoryArtifactEntryAccessDenied)) throw cause;
						abortIfNeeded$1(signal);
						options?.onOmission?.({
							path: cause.entryPath,
							kind: "directory-descendants"
						});
						options?.onCoverage?.({
							status: "unknown",
							limitations: [cause.message]
						});
						continue;
					}
					await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
				}
				if (unrepresentableNameCount > 0) options?.onCoverage?.({
					status: "unknown",
					examinedEntries: examined,
					limitations: [`Directory contains ${String(unrepresentableNameCount)} entry name(s) that are not valid UTF-8; no filesystem operations were performed for them. First raw basename bytes: ${firstUnrepresentableNameHex ?? "unknown"}.`]
				});
			}
			/** Admission facts, shared with traversal; the selected root may be a symlink. */
			rootObservation() {
				return this.#resolveRoot();
			}
			async #resolveRoot() {
				return this.#rootPromise ??= (async () => {
					const root = await realpath(this.#rootPath);
					const metadata = await lstat(root, { bigint: true });
					if (metadata.isSymbolicLink()) throw new ArtifactReaderFailure("path", "Artifact root changed during traversal");
					if (!metadata.isDirectory()) throw new DirectoryArtifactRootFailure("path", "Artifact root must be a directory");
					return Object.freeze({
						canonicalPath: root,
						identity: Object.freeze({
							dev: metadata.dev,
							ino: metadata.ino
						})
					});
				})().catch((cause) => {
					if (cause instanceof ArtifactReaderFailure) throw cause;
					throw directoryIoFailure("resolve artifact root", this.#rootPath, cause, DirectoryArtifactRootFailure);
				});
			}
			async *#readDirectory(directory, pending, signal, options, examine, noteUnrepresentableName) {
				const admittedRoot = await this.#resolveRoot();
				const root = admittedRoot.canonicalPath;
				const handle = new OwnedDirectoryHandle(await opendir(directory, { encoding: "buffer" }).catch((cause) => {
					const code = hostErrorCode(cause);
					if (directory !== root && (code === "EACCES" || code === "EPERM")) throw new DirectoryArtifactEntryAccessDenied(code, relative(root, directory).split(sep).join("/"), directoryIoFailure("open directory", directory, cause).message, { cause });
					throw directoryIoFailure("open directory", directory, cause, directory === root ? DirectoryArtifactRootFailure : ArtifactReaderFailure);
				}));
				this.#directories.add(handle);
				const childDirectories = [];
				let traversal = { kind: "complete" };
				try {
					for (;;) {
						await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
						const child = await handle.handle.read();
						if (child === null) break;
						examine();
						abortIfNeeded$1(signal);
						const decoded = decodeDirectoryEntryName(child.name);
						if (decoded.kind === "unrepresentable") {
							noteUnrepresentableName(decoded.rawHex);
							continue;
						}
						const absolute = join(directory, decoded.name);
						const metadata = await lstat(absolute, { bigint: true }).catch((cause) => {
							throw directoryIoFailure("inspect entry", absolute, cause);
						});
						const path = relative(root, absolute).split(sep).join("/");
						const entry = artifactEntry(path, absolute, metadata);
						if (entry === undefined) {
							options?.onOmission?.({
								path,
								kind: unsupportedEntryKind(metadata)
							});
							continue;
						}
						yield entry;
						if (entry.kind === "directory") {
							if (options?.descendInto?.(path) ?? true) childDirectories.push(absolute);
							else options?.onOmission?.({
								path,
								kind: "directory-descendants"
							});
						}
					}
				} catch (cause) {
					traversal = {
						kind: "failed",
						cause: cause instanceof ArtifactReaderFailure ? cause : directoryIoFailure("read directory", directory, cause)
					};
				} finally {
					await this.#finishDirectory(handle, directory, traversal);
				}
				if (traversal.kind === "failed") throw traversal.cause;
				childDirectories.reverse();
				pending.push(...childDirectories);
			}
			async #finishDirectory(handle, path, traversal) {
				try {
					await handle.close();
					this.#directories.delete(handle);
				} catch (cause) {
					const closeFailure = directoryIoFailure("close directory", path, cause);
					if (traversal.kind === "failed") throw ArtifactReaderFailure.withCleanup(traversal.cause, ArtifactReaderFailure.cleanupObservation(closeFailure, path));
					throw closeFailure;
				}
			}
			async #openFile(entry, signal) {
				abortIfNeeded$1(signal);
				if (entry.kind !== "file") throw new ArtifactReaderFailure("format", "Only regular files can be opened");
				const fileHandle = await open(entry.adapterKey, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK).catch((cause) => {
					throw entryOpenFailure(entry, cause);
				});
				const owner = new OwnedFileHandle(fileHandle);
				this.#files.set(owner, entry.adapterKey);
				try {
					const observed = await owner.handle.stat({ bigint: true }).catch((cause) => {
						throw directoryIoFailure("inspect opened entry", entry.adapterKey, cause);
					});
					if (!observed.isFile() || !sameArtifactSourceIdentity(entry.sourceIdentity, observed)) {
						throw new ArtifactReaderFailure("integrity", `Directory entry changed before open: ${entry.path}`);
					}
					abortIfNeeded$1(signal);
					return owner;
				} catch (cause) {
					try {
						await this.#closeFile(owner);
					} catch (closeCause) {
						throw ArtifactReaderFailure.withCleanup(cause, ArtifactReaderFailure.cleanupObservation(directoryIoFailure("close opened entry", entry.adapterKey, closeCause), entry.adapterKey));
					}
					throw cause;
				}
			}
			/** Borrow an admitted entry for bounded random reads; retain failed cleanup. */
			async inspectFile(entry, inspect, signal) {
				const owner = await this.#openFile(entry, signal);
				try {
					const value = await withOwnedFileHandle(entry.adapterKey, owner, signal === undefined ? {} : { signal }, async (file) => {
						let outcome;
						try {
							outcome = {
								kind: "completed",
								value: await inspect(file)
							};
						} catch (cause) {
							outcome = {
								kind: "failed",
								cause
							};
						}
						const [opened, named] = await Promise.all([file.stat({ bigint: true }), lstat(entry.adapterKey, { bigint: true })]);
						abortIfNeeded$1(signal);
						if (!opened.isFile() || !named.isFile() || !sameArtifactSourceIdentity(entry.sourceIdentity, opened) || !sameArtifactSourceIdentity(entry.sourceIdentity, named)) throw new ArtifactReaderFailure("integrity", `Directory entry changed during inspection: ${entry.path}`);
						if (outcome.kind === "failed") throw outcome.cause;
						return outcome.value;
					});
					this.#files.delete(owner);
					return value;
				} catch (cause) {
					if (cause instanceof RegularFileCleanupFailure) {
						const lease = new AnalysisCleanupLease(() => this.#closeFile(owner), [entry.adapterKey]);
						this.#fileCleanup.set(owner, lease);
						throw new ArtifactFileCleanupFailure(cause, lease);
					}
					this.#files.delete(owner);
					if (cause instanceof RegularFileCancelled) throw new ArtifactFileCancelled(cause);
					if (cause instanceof RegularFileOperationCancelled) throw new ArtifactReaderFailure("cancelled", "Directory inspection cancelled", { cause: cause.reason });
					throw directoryIoFailure("inspect entry", entry.adapterKey, cause);
				}
			}
			async open(entry, signal) {
				const owner = await this.#openFile(entry, signal);
				const source = Readable.from(mapStableFileRead(owner.handle, entry, signal), { objectMode: false });
				source.once("close", () => {
					void this.#closeFile(owner).catch(() => undefined);
				});
				return source;
			}
			async close() {
				const failures = [];
				for (const [owner, path] of this.#files) {
					try {
						const lease = this.#fileCleanup.get(owner);
						if (lease === undefined) await this.#closeFile(owner);
						else await lease.release();
					} catch (cause) {
						failures.push(directoryIoFailure("close opened entry", path, cause));
					}
				}
				for (const owner of this.#directories) {
					try {
						await owner.close();
						this.#directories.delete(owner);
					} catch (cause) {
						failures.push(directoryIoFailure("close directory", owner.handle.path, cause));
					}
				}
				if (failures.length > 0) {
					const reason = failures.map(failureMessage).join("; ");
					throw new ArtifactReaderFailure("io", `Directory artifact cleanup failed: ${reason}`, {
						cause: new AggregateError(failures),
						cleanup: {
							reason,
							resources: [...this.#files.values(), ...[...this.#directories].map((owner) => owner.handle.path)]
						}
					});
				}
			}
			async #closeFile(owner) {
				await owner.close();
				this.#files.delete(owner);
				this.#fileCleanup.delete(owner);
			}
			provenance() {
				return [];
			}
		};
		unsupportedEntryKind = (metadata) => metadata.isFIFO() ? "fifo" : metadata.isSocket() ? "socket" : metadata.isBlockDevice() ? "block-device" : metadata.isCharacterDevice() ? "character-device" : "unsupported";
		artifactEntry = (path, absolute, metadata) => {
			const kind = metadata.isSymbolicLink() ? "symlink" : metadata.isDirectory() ? "directory" : metadata.isFile() ? "file" : undefined;
			if (kind === undefined) return undefined;
			return {
				path,
				kind,
				declaredSize: kind === "file" ? safeArtifactSize(metadata.size) : null,
				compressedSize: null,
				executable: hostExecutableMarking(absolute, metadata),
				encrypted: false,
				byteOffset: null,
				declaredIntegrity: null,
				unpacked: false,
				limitations: kind === "symlink" ? ["Symlink target was not followed or disclosed."] : [],
				adapterKey: absolute,
				...kind === "file" ? { sourceIdentity: {
					device: metadata.dev,
					inode: metadata.ino,
					size: metadata.size,
					mode: metadata.mode,
					mtimeNs: metadata.mtimeNs,
					ctimeNs: metadata.ctimeNs
				} } : {}
			};
		};
		safeArtifactSize = (size) => {
			if (size < 0n || size > BigInt(Number.MAX_SAFE_INTEGER)) return null;
			return Number(size);
		};
		directoryIoFailure = (operation, path, cause, Failure = ArtifactReaderFailure) => {
			if (cause instanceof ArtifactReaderFailure) return cause;
			const code = hostErrorCode(cause);
			const suffix = code === undefined ? "" : ` (${code})`;
			const detail = failureMessage(cause);
			return new Failure("io", `Could not ${operation} at ${path}${suffix}: ${detail}`, { cause });
		};
		hostErrorCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
		entryOpenFailure = (entry, cause) => {
			const failure = directoryIoFailure("open entry", entry.adapterKey, cause);
			const code = hostErrorCode(cause);
			return code === "EACCES" || code === "EPERM" ? new DirectoryArtifactEntryAccessDenied(code, entry.path, failure.message, { cause }) : failure;
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		mapStableFileRead = async function* (handle, entry, signal) {
			let bytes = 0n;
			try {
				const expectedBytes = entry.sourceIdentity?.size;
				if (expectedBytes === undefined) throw new ArtifactReaderFailure("integrity", `Directory entry has no captured file state: ${entry.path}`);
				for await (const chunk of readArtifactFileChunks(handle, {
					end: expectedBytes,
					signal
				})) {
					abortIfNeeded$1(signal);
					bytes += BigInt(chunk.length);
					yield chunk;
				}
				abortIfNeeded$1(signal);
				const [opened, current] = await Promise.all([handle.stat({ bigint: true }), lstat(entry.adapterKey, { bigint: true })]);
				abortIfNeeded$1(signal);
				if (!opened.isFile() || !current.isFile() || !sameArtifactSourceIdentity(entry.sourceIdentity, opened) || !sameArtifactSourceIdentity(entry.sourceIdentity, current) || bytes !== expectedBytes) throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && [
					"ENOENT",
					"ENOTDIR",
					"ELOOP"
				].includes(String(cause.code))) throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`, { cause });
				if (!(cause instanceof ArtifactReaderFailure)) throw directoryIoFailure("validate read entry", entry.adapterKey, cause);
				throw cause;
			}
		};
		withDirectoryIoContext = async (operation, path, action) => {
			try {
				return await action();
			} catch (cause) {
				throw directoryIoFailure(operation, path, cause);
			}
		};
		abortIfNeeded$1 = (signal) => {
			if (signal?.aborted === true) throw new ArtifactReaderFailure("cancelled", "Artifact traversal cancelled", { cause: signal.reason });
		};
		assertContainedDirectory = async (root, directory, rootIdentity) => {
			const canonical = await realpath(directory);
			const fromRoot = relative(root, canonical);
			const metadata = await lstat(directory);
			const currentRoot = await lstat(root, { bigint: true });
			if (rootIdentity === undefined || currentRoot.dev !== rootIdentity.dev || currentRoot.ino !== rootIdentity.ino || metadata.isSymbolicLink() || !metadata.isDirectory() || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new ArtifactReaderFailure("path", "Directory traversal escaped or changed its artifact root");
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactClassificationProbe.js
var ARTIFACT_CLASSIFICATION_PREFIX_BYTES, observeFatSliceHeaders, finishClassificationEvidence, createArtifactClassificationProbe;
function init_ArtifactClassificationProbe() {
	return (init_ArtifactClassificationProbe = __esmMin((() => {
		init_AsarHeader();
		init_appleArchiveFormat();
		init_machoContainer();
		init_dosMz();
		ARTIFACT_CLASSIFICATION_PREFIX_BYTES = 8192;
		observeFatSliceHeaders = (input) => {
			const { table, observedHeaders, partialHeaders, streamOffset, bytes } = input;
			if (table?.state !== "parsed") return;
			for (const slice of table.slices) {
				if (observedHeaders.has(slice.offset) && !partialHeaders.has(slice.offset)) continue;
				const headerLength = Math.min(12, slice.size);
				const headerEnd = slice.offset + headerLength;
				if (!Number.isSafeInteger(headerEnd)) continue;
				const start = Math.max(slice.offset, streamOffset);
				const end = Math.min(headerEnd, streamOffset + bytes.length);
				if (start >= end) continue;
				let pending = partialHeaders.get(slice.offset);
				if (pending === undefined) {
					pending = {
						bytes: Buffer.alloc(12),
						count: 0
					};
					partialHeaders.set(slice.offset, pending);
				}
				Buffer.from(bytes.subarray(start - streamOffset, end - streamOffset)).copy(pending.bytes, start - slice.offset);
				pending.count += end - start;
				observedHeaders.set(slice.offset, readMachoHeaderPrefixFacts(pending.bytes.subarray(0, Math.min(pending.count, headerLength))));
				if (pending.count === headerLength) {
					partialHeaders.delete(slice.offset);
				}
			}
		};
		finishClassificationEvidence = (prefix, archiveBytes, finishAsar, sliceHeadersByOffset, mzWindowsHeaderSignature) => {
			const finalHeader = readFatContainerHeader(prefix, archiveBytes);
			if (finalHeader.state === "parsed") {
				for (let index = 0; index < finalHeader.slices.length; index += 1) {
					const slice = finalHeader.slices[index];
					if (slice === undefined || sliceHeadersByOffset.has(slice.offset)) continue;
					const available = Math.max(0, Math.min(slice.size, prefix.length - slice.offset));
					if (available === 0) continue;
					sliceHeadersByOffset.set(slice.offset, readMachoHeaderPrefixFacts(prefix.subarray(slice.offset, slice.offset + available)));
				}
			}
			const fatSliceHeaders = finalHeader.state === "parsed" ? {
				header: finalHeader,
				sliceHeadersByOffset
			} : undefined;
			return {
				prefix,
				asarHeader: finishAsar(archiveBytes),
				...fatSliceHeaders === undefined ? {} : { fatSliceHeaders },
				...mzWindowsHeaderSignature === undefined ? {} : { mzWindowsHeaderSignature }
			};
		};
		createArtifactClassificationProbe = (asarHeaderAdmission) => {
			const xml = createXmlPlistSignatureProbe();
			const asar = createAsarHeaderSignatureProbe(asarHeaderAdmission);
			const blocks = [];
			let retainedBytes = 0;
			let observedBytes = 0;
			let fatTable;
			const fatSliceHeadersByOffset = new Map();
			const partialFatHeaders = new Map();
			let mzWindowsHeaderSignature;
			let mzWindowsHeaderOffset;
			let mzHeaderChecked = false;
			const observeSignatureWindow = (offset, sourceOffset, sourceBytes) => {
				if (!Number.isSafeInteger(offset) || offset < 0) return;
				const start = Math.max(offset, sourceOffset);
				const end = Math.min(offset + 4, sourceOffset + sourceBytes.length);
				if (start >= end) return;
				const window = Buffer.alloc(4);
				const previous = mzWindowsHeaderSignature?.offset === offset ? mzWindowsHeaderSignature.bytes : undefined;
				previous?.copy(window);
				let observedLength = previous?.length ?? 0;
				if (start < end && start <= offset + observedLength) {
					Buffer.from(sourceBytes.subarray(start - sourceOffset, end - sourceOffset)).copy(window, start - offset);
					observedLength = Math.max(observedLength, end - offset);
				}
				if (observedLength === 0) return;
				mzWindowsHeaderSignature = {
					offset,
					bytes: window.subarray(0, observedLength)
				};
			};
			const retain = (bytes) => {
				let offset = 0;
				while (offset < bytes.length) {
					const blockOffset = retainedBytes % ARTIFACT_CLASSIFICATION_PREFIX_BYTES;
					if (blockOffset === 0) blocks.push(Buffer.allocUnsafe(ARTIFACT_CLASSIFICATION_PREFIX_BYTES));
					const count = Math.min(ARTIFACT_CLASSIFICATION_PREFIX_BYTES - blockOffset, bytes.length - offset);
					blocks[blocks.length - 1].set(bytes.subarray(offset, offset + count), blockOffset);
					retainedBytes += count;
					offset += count;
				}
			};
			const retainedPrefix = () => {
				const prefix = Buffer.allocUnsafe(retainedBytes);
				let copied = 0;
				for (const block of blocks) {
					const count = Math.min(block.length, retainedBytes - copied);
					prefix.set(block.subarray(0, count), copied);
					copied += count;
				}
				return prefix;
			};
			return {
				get length() {
					return observedBytes;
				},
				get limit() {
					if (observedBytes < 8192) return ARTIFACT_CLASSIFICATION_PREFIX_BYTES;
					return Math.max(ARTIFACT_CLASSIFICATION_PREFIX_BYTES, xml.state === "pending" ? MAX_XML_PLIST_PROBE_BYTES : 0, asar.observation.state === "pending" ? asar.limit : 0);
				},
				write(bytes) {
					const streamOffset = observedBytes;
					asar.write(bytes);
					let offset = 0;
					while (offset < bytes.length) {
						const limit = retainedBytes < 8192 ? ARTIFACT_CLASSIFICATION_PREFIX_BYTES : xml.state === "pending" ? MAX_XML_PLIST_PROBE_BYTES : retainedBytes;
						if (retainedBytes >= limit) break;
						const selected = bytes.subarray(offset, offset + Math.min(limit - retainedBytes, bytes.length - offset));
						retain(selected);
						xml.write(selected);
						offset += selected.length;
					}
					if ((fatTable === undefined || fatTable.state === "needs-data") && retainedBytes >= 8) fatTable = readFatContainerTable(retainedPrefix());
					observeFatSliceHeaders({
						table: fatTable,
						observedHeaders: fatSliceHeadersByOffset,
						partialHeaders: partialFatHeaders,
						streamOffset,
						bytes
					});
					if (!mzHeaderChecked && retainedBytes >= 64) {
						mzHeaderChecked = true;
						const prefix = retainedPrefix();
						if (prefix[0] === 77 && prefix[1] === 90) {
							const windowsHeader = observeMzWindowsHeader(prefix, Number.MAX_SAFE_INTEGER);
							if (windowsHeader.state === "signature-needed") {
								mzWindowsHeaderOffset = windowsHeader.offset;
								if (windowsHeader.offset < prefix.length) {
									const inline = prefix.subarray(windowsHeader.offset, Math.min(windowsHeader.offset + 4, prefix.length));
									mzWindowsHeaderSignature = {
										offset: windowsHeader.offset,
										bytes: inline
									};
								}
							}
						}
					}
					if (mzWindowsHeaderOffset !== undefined) observeSignatureWindow(mzWindowsHeaderOffset, streamOffset, bytes);
					observedBytes += bytes.length;
				},
				finish(archiveBytes) {
					return finishClassificationEvidence(retainedPrefix(), archiveBytes, (bytes) => asar.finish(bytes), fatSliceHeadersByOffset, mzWindowsHeaderSignature);
				}
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactHash.js
var abortIfNeeded, hashReadable;
function init_ArtifactHash() {
	return (init_ArtifactHash = __esmMin((() => {
		init_ArtifactReader();
		init_StreamBytes();
		init_ArtifactClassificationProbe();
		abortIfNeeded = (signal) => {
			if (signal?.aborted === true) throw new ArtifactReaderFailure("cancelled", "Artifact inventory cancelled", { cause: signal.reason });
		};
		hashReadable = async (stream, signal, integrityAlgorithm, asarHeaderAdmission) => {
			const hash = createHash("sha256");
			const md5 = integrityAlgorithm === "md5" ? createHash("md5") : undefined;
			const probe = createArtifactClassificationProbe(asarHeaderAdmission);
			let bytes = 0;
			for await (const raw of stream) {
				abortIfNeeded(signal);
				const chunk = streamChunkToBuffer(raw);
				bytes += chunk.length;
				hash.update(chunk);
				md5?.update(chunk);
				probe.write(chunk);
			}
			abortIfNeeded(signal);
			return {
				sha256: hash.digest("hex"),
				...md5 === undefined ? {} : { md5: md5.digest("hex") },
				bytes,
				...probe.finish(bytes)
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactOperationFailure.js
var translateArtifactFailure;
function init_ArtifactOperationFailure() {
	return (init_ArtifactOperationFailure = __esmMin((() => {
		init_analysisSettingDefinitions();
		init_analysisErrorBase();
		init_artifactOperationError();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		translateArtifactFailure = (operation, cause) => {
			if (cause instanceof ArtifactReaderFailure) {
				const error = new ArtifactOperationError(operation, cause.reason, cause.details, cause.message, {
					cause: cause.reason === "cancelled" ? artifactFileCancellationCause(cause) : cause,
					...cause.cleanup === undefined ? {} : { cleanup: cause.cleanup },
					...cause.partialObservation === undefined ? {} : { partialObservation: cause.partialObservation },
					...cause.admission === undefined ? {} : { admission: cause.admission },
					...cause.boundary === undefined ? {} : { boundary: cause.boundary }
				});
				if (cause.admission !== undefined) error.bindLimit({
					...analysisSettingLimit("asar.max_header_bytes", cause.admission.maximumBytes, cause.admission.source),
					...cause.admission.requiredBytes === undefined ? {} : { required_value: cause.admission.requiredBytes }
				});
				bindArtifactFileCleanup(cause, error);
				return error;
			}
			if (cause instanceof AnalysisError) return cause;
			return new ArtifactOperationError(operation, "io", undefined, undefined, { cause });
		};
	})))();
}

//#endregion
//#region dist/domain/python/marshalUtf8.js
var UTF8, spanPrefixEnd, decodeMarshalUtf8;
function init_marshalUtf8() {
	return (init_marshalUtf8 = __esmMin((() => {
		init_result();
		UTF8 = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
		spanPrefixEnd = (text, limit) => {
			const end = Math.min(text.length, limit);
			return end > 0 && end < text.length && text.charCodeAt(end - 1) >= 55296 && text.charCodeAt(end - 1) <= 56319 && text.charCodeAt(end) >= 56320 && text.charCodeAt(end) <= 57343 ? end - 1 : end;
		};
		decodeMarshalUtf8 = (bytes, maximumPrefixUnits = Infinity) => {
			if (maximumPrefixUnits !== Infinity && (!Number.isSafeInteger(maximumPrefixUnits) || maximumPrefixUnits < 0)) throw new RangeError("Marshal prefix limit must be a nonnegative safe integer.");
			const chunks = [];
			let start = 0;
			let prefixEnd = 0;
			let prefixOpen = true;
			const append = (text) => {
				if (text.length !== 0) chunks.push(text);
				if (!prefixOpen) return;
				const end = spanPrefixEnd(text, maximumPrefixUnits - prefixEnd);
				prefixEnd += end;
				prefixOpen = end === text.length && prefixEnd < maximumPrefixUnits;
			};
			try {
				for (let offset = bytes.indexOf(237); offset !== -1; offset = bytes.indexOf(237, offset + 1)) {
					const second = bytes[offset + 1];
					const third = bytes[offset + 2];
					if (second === undefined || second < 160 || second > 191 || third === undefined || third < 128 || third > 191) continue;
					append(UTF8.decode(bytes.subarray(start, offset)));
					append(String.fromCharCode(53248 | (second & 63) << 6 | third & 63));
					start = offset + 3;
					offset += 2;
				}
				if (start === 0) {
					const text = UTF8.decode(bytes);
					return ok({
						text,
						prefixEnd: spanPrefixEnd(text, maximumPrefixUnits)
					});
				}
				append(UTF8.decode(bytes.subarray(start)));
				return ok({
					text: chunks.join(""),
					prefixEnd
				});
			} catch (cause) {
				if (cause instanceof TypeError) return err({ kind: "invalid-marshal-utf8" });
				throw cause;
			}
		};
	})))();
}

//#endregion
//#region dist/native/pe/PeResourceLayout.js
var OPTIONAL_HEADER_FAILURES, peFailure, requirePeRange, requirePeExtent, virtualExtent, intersectsResource, readPeHeaders, readPeResourceLayout, hasPeResourceName;
function init_PeResourceLayout() {
	return (init_PeResourceLayout = __esmMin((() => {
		init_ArtifactReader();
		init_peOptionalHeader();
		OPTIONAL_HEADER_FAILURES = {
			"truncated-magic": "Truncated PE optional header.",
			"unsupported-magic": "Unsupported PE optional header magic.",
			"truncated-fixed-fields": "Truncated PE data directory count.",
			"truncated-directory-table": "PE directory count exceeds its optional header."
		};
		peFailure = (message) => {
			throw new ArtifactReaderFailure("format", message);
		};
		requirePeRange = (bytes, offset, length) => requirePeExtent(bytes.length, offset, length);
		requirePeExtent = (fileSize, offset, length) => {
			if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > fileSize - length) peFailure(`PE range ${String(offset)} + ${String(length)} leaves the artifact.`);
		};
		virtualExtent = (section) => section.virtualSize === 0 ? section.size : section.virtualSize;
		intersectsResource = (section, rva, size) => {
			const extent = virtualExtent(section);
			return extent > 0 && section.rva < rva + Math.max(size, 1) && rva < section.rva + extent;
		};
		readPeHeaders = (bytes, fileSize = bytes.length) => {
			requirePeRange(bytes, 0, 64);
			if (bytes.readUInt16LE(0) !== 23117) peFailure("Expected an MZ PE image.");
			const pe = bytes.readUInt32LE(60);
			requirePeRange(bytes, pe, 24);
			if (bytes.readUInt32LE(pe) !== 17744) peFailure("Expected a PE signature.");
			const sectionCount = bytes.readUInt16LE(pe + 6);
			const optionalSize = bytes.readUInt16LE(pe + 20);
			const optionalHeaderOffset = pe + 24;
			requirePeRange(bytes, optionalHeaderOffset, optionalSize);
			if (optionalSize < 64) peFailure("Truncated PE optional header.");
			const parsed = readPeOptionalHeaderStructure(bytes.subarray(optionalHeaderOffset, optionalHeaderOffset + optionalSize));
			if (!parsed.ok) return peFailure(OPTIONAL_HEADER_FAILURES[parsed.error.reason]);
			const { sizeOfHeaders: headerSize, format, directoryOffset, dataDirectories } = parsed.value;
			const table = optionalHeaderOffset + optionalSize;
			requirePeRange(bytes, table, sectionCount * 40);
			if (headerSize < table + sectionCount * 40 || headerSize > fileSize) peFailure("Invalid PE SizeOfHeaders.");
			return {
				machine: bytes.readUInt16LE(pe + 4),
				format,
				sectionCount,
				optionalHeaderOffset,
				directoryOffset,
				dataDirectories,
				headerSize,
				table
			};
		};
		readPeResourceLayout = (bytes, fileSize = bytes.length) => {
			const { machine, format, sectionCount, optionalHeaderOffset, directoryOffset, dataDirectories, headerSize, table } = readPeHeaders(bytes, fileSize);
			const sections = [];
			for (let index = 0; index < sectionCount; index++) {
				const at = table + index * 40;
				const section = {
					rva: bytes.readUInt32LE(at + 12),
					virtualSize: bytes.readUInt32LE(at + 8),
					offset: bytes.readUInt32LE(at + 20),
					size: bytes.readUInt32LE(at + 16)
				};
				if (section.rva + virtualExtent(section) > 4294967296) peFailure("PE section RVA range overflows.");
				if (section.size > 0) {
					requirePeExtent(fileSize, section.offset, section.size);
					if (section.offset < headerSize) peFailure("PE section raw bytes overlap headers.");
				}
				sections.push(section);
			}
			const backed = sections.filter(({ size }) => size > 0).sort((left, right) => left.offset - right.offset);
			for (let index = 1; index < backed.length; index++) {
				const previous = backed[index - 1];
				const current = backed[index];
				if (previous !== undefined && current !== undefined && current.offset < previous.offset + previous.size) peFailure("PE sections have overlapping raw file ranges.");
			}
			const map = (rva, size) => {
				if (rva + size > 4294967296) peFailure("Resource RVA range overflows.");
				const containing = sections.filter((section) => rva >= section.rva && rva - section.rva < virtualExtent(section));
				const candidates = size === 0 && containing.length === 0 ? sections.filter((section) => virtualExtent(section) > 0 && rva - section.rva === virtualExtent(section)) : containing;
				if (rva < headerSize) {
					if (sections.some((section) => intersectsResource(section, rva, size)) || size > headerSize - rva) peFailure("Ambiguous resource header RVA mapping.");
					requirePeExtent(fileSize, rva, size);
					return rva;
				}
				if (candidates.length !== 1) peFailure("Resource RVA has missing or overlapping section mappings.");
				const section = candidates[0];
				if (section === undefined) return peFailure("Missing resource section.");
				const within = rva - section.rva;
				if (size > virtualExtent(section) - within) peFailure("Resource range leaves its section's virtual size.");
				if (within > section.size || size > section.size - within) peFailure("Resource range is not entirely file-backed in one section.");
				if (sections.some((other) => other !== section && intersectsResource(other, rva, size))) peFailure("Resource interval intersects overlapping virtual sections.");
				const offset = section.offset + within;
				requirePeExtent(fileSize, offset, size);
				return offset;
			};
			const resource = dataDirectories[2];
			const directoryAt = optionalHeaderOffset + (resource?.offset ?? directoryOffset + 2 * 8);
			const rva = resource?.address ?? 0;
			const size = resource?.size ?? 0;
			if (rva === 0 !== (size === 0)) peFailure("Inconsistent PE resource directory RVA/size.");
			return {
				format,
				machine,
				directoryAt,
				rva,
				size,
				map
			};
		};
		hasPeResourceName = async (headers, fileSize, read, typeId, name, maxEntries) => {
			let layout;
			let root;
			try {
				layout = readPeResourceLayout(headers, fileSize);
				if (layout.size < 16) return false;
				root = layout.map(layout.rva, layout.size);
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure && cause.reason === "format") return false;
				throw cause;
			}
			const { size } = layout;
			const relative = (at, length) => at < 0 || at > size - length ? Promise.resolve(undefined) : read(root + at, length);
			let examined = 0;
			const directory = async (at) => {
				const header = await relative(at, 16);
				if (header === undefined) return undefined;
				const entries = header.readUInt16LE(12) + header.readUInt16LE(14);
				if (entries > maxEntries - examined) return undefined;
				examined += entries;
				return relative(at + 16, entries * 8);
			};
			const types = await directory(0);
			if (types === undefined) return false;
			const expected = Buffer.from(name, "utf16le");
			for (let at = 0; at < types.length; at += 8) {
				if (types.readUInt32LE(at) !== typeId) continue;
				const target = types.readUInt32LE(at + 4);
				if ((target & 2147483648) === 0) continue;
				const names = await directory(target & 2147483647);
				if (names === undefined) continue;
				for (let entry = 0; entry < names.length; entry += 8) {
					const encoded = names.readUInt32LE(entry);
					if ((encoded & 2147483648) === 0) continue;
					const nameAt = encoded & 2147483647;
					const length = await relative(nameAt, 2);
					if (length?.readUInt16LE(0) !== name.length) continue;
					const candidate = await relative(nameAt + 2, expected.length);
					if (candidate?.equals(expected)) return true;
				}
			}
			return false;
		};
	})))();
}

//#endregion
//#region dist/native/pe/PeResourceParser.js
var PE_RESOURCE_METADATA_BYTES, METADATA_BYTES, limit, jsonBytes, identityKey, parsePeResources, rejectOverlappingRanges, readIconGroups;
function init_PeResourceParser() {
	return (init_PeResourceParser = __esmMin((() => {
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_jsonSerialization();
		init_PeResourceLayout();
		PE_RESOURCE_METADATA_BYTES = 8 * 1024 * 1024;
		METADATA_BYTES = PE_RESOURCE_METADATA_BYTES;
		limit = (message, boundary) => {
			throw new ArtifactReaderFailure("limit", message, { boundary });
		};
		jsonBytes = (value, maximum) => {
			let size = 0;
			for (const part of jsonParts(value)) {
				size += Buffer.byteLength(part, "utf8");
				if (size > maximum) return size;
			}
			return size;
		};
		identityKey = (id) => id.kind === "id" ? `id:${String(id.id)}` : `name:${id.utf16le_hex}`;
		parsePeResources = async (bytes, artifact, input, signal) => {
			assertArtifactReadActive(signal);
			const layout = readPeResourceLayout(bytes);
			const directories = [];
			const resources = [];
			const occupied = [];
			const names = new Map();
			let examined = 0;
			let metadataBytes = 0;
			const ensureCapacity = (projectedBytes) => {
				if (metadataBytes + projectedBytes > METADATA_BYTES) limit("PE resource metadata exceeds the 8 MiB complete-result allocation budget.", "memory");
			};
			const accountBytes = (projectedBytes) => {
				ensureCapacity(projectedBytes);
				metadataBytes += projectedBytes;
			};
			const account = (value) => {
				accountBytes(jsonBytes(value, METADATA_BYTES - metadataBytes - 1) + 1);
			};
			const reserveDecodedName = (utf16Units) => {
				const projectedBytes = 10 * utf16Units + 256;
				ensureCapacity(projectedBytes);
			};
			const root = layout.size === 0 ? 0 : layout.map(layout.rva, layout.size);
			const relative = (at, length) => {
				if (at > layout.size - length || at < 0) peFailure("Resource directory offset leaves the declared resource interval.");
				requirePeRange(bytes, root + at, length);
				return root + at;
			};
			const recordRange = (offset, size, kind) => {
				const range = {
					offset,
					bytes: size
				};
				if (size > 0) occupied.push({
					...range,
					kind
				});
				return range;
			};
			const readIdentity = (encoded) => {
				if ((encoded & 2147483648) === 0) return {
					kind: "id",
					id: encoded
				};
				const at = encoded & 2147483647;
				const previous = names.get(at);
				if (previous !== undefined) return previous;
				if (at % 2 !== 0) peFailure("Unaligned PE resource name.");
				const start = relative(at, 2);
				const utf16Units = bytes.readUInt16LE(start);
				reserveDecodedName(utf16Units);
				const length = utf16Units * 2;
				relative(at, 2 + length);
				const raw = bytes.subarray(start + 2, start + 2 + length);
				const value = {
					kind: "name",
					name: raw.toString("utf16le"),
					utf16le_hex: raw.toString("hex"),
					location: recordRange(start, 2 + length, "name")
				};
				names.set(at, value);
				return value;
			};
			const visit = async (at, path, entryLocations, ancestors) => {
				if (ancestors.has(at)) peFailure("Cyclic PE resource directory.");
				const header = relative(at, 16);
				const named = bytes.readUInt16LE(header + 12);
				const ids = bytes.readUInt16LE(header + 14);
				const count = named + ids;
				if (count > input.max_entries - examined) limit("PE resource directory entry budget exceeded; no partial inventory was returned.", "capacity");
				examined += count;
				relative(at, 16 + 8 * count);
				const directory = {
					path,
					entry_locations: entryLocations,
					location: recordRange(header, 16 + 8 * count, "directory"),
					characteristics: bytes.readUInt32LE(header),
					timestamp: bytes.readUInt32LE(header + 4),
					major_version: bytes.readUInt16LE(header + 8),
					minor_version: bytes.readUInt16LE(header + 10),
					named_entries: named,
					id_entries: ids
				};
				account(directory);
				directories.push(directory);
				const keys = new Set();
				const nested = new Set([...ancestors, at]);
				for (let index = 0; index < count; index++) {
					if (index % 128 === 0) {
						await setImmediate();
						assertArtifactReadActive(signal);
					}
					const entry = header + 16 + index * 8;
					const encoded = bytes.readUInt32LE(entry);
					if ((encoded & 2147483648) !== 0 !== index < named) peFailure("Resource name/ID entry counts disagree with encoded identities.");
					const identity = readIdentity(encoded);
					const key = identityKey(identity);
					if (keys.has(key)) peFailure("Duplicate identity within a resource directory.");
					keys.add(key);
					const next = [...path, identity];
					const locations = [...entryLocations, {
						offset: entry,
						bytes: 8
					}];
					const target = bytes.readUInt32LE(entry + 4);
					const offset = target & 2147483647;
					if ((target & 2147483648) !== 0) {
						if (next.length >= 3) peFailure("Unsupported resource tree deeper than type/name/language.");
						await visit(offset, next, locations, nested);
					} else {
						if (next.length !== 3) peFailure("Unsupported resource leaf outside the type/name/language profile.");
						const data = relative(offset, 16);
						const rva = bytes.readUInt32LE(data);
						const size = bytes.readUInt32LE(data + 4);
						const payloadOffset = layout.map(rva, size);
						const [type, name, language] = next;
						if (type === undefined || name === undefined || language === undefined) return peFailure("Incomplete resource identity.");
						const resource = {
							index: resources.length,
							type,
							name,
							language,
							entry_locations: locations,
							data_entry_location: recordRange(data, 16, "data-entry"),
							code_page: bytes.readUInt32LE(data + 8),
							reserved: bytes.readUInt32LE(data + 12),
							payload: {
								rva,
								location: recordRange(payloadOffset, size, "payload"),
								sha256: "0".repeat(64)
							}
						};
						account(resource);
						resources.push(resource);
					}
				}
			};
			if (layout.size > 0) await visit(0, [], [], new Set());
			rejectOverlappingRanges(occupied);
			const hashes = new Map();
			for (const resource of resources) {
				const range = resource.payload.location;
				const key = `${String(range.offset)}:${String(range.bytes)}`;
				let digest = hashes.get(key);
				if (digest === undefined) {
					const hash = createHash("sha256");
					for (let offset = 0; offset < range.bytes; offset += 1048576) {
						await setImmediate();
						assertArtifactReadActive(signal);
						hash.update(bytes.subarray(range.offset + offset, range.offset + Math.min(range.bytes, offset + 1048576)));
					}
					digest = hash.digest("hex");
					hashes.set(key, digest);
				}
				resource.payload.sha256 = digest;
			}
			const iconGroups = readIconGroups(bytes, resources, account, ensureCapacity);
			const report = {
				artifact,
				format: layout.format,
				machine: layout.machine,
				directory: layout.size === 0 ? null : {
					rva: layout.rva,
					location: {
						offset: root,
						bytes: layout.size
					},
					data_directory_location: {
						offset: layout.directoryAt,
						bytes: 8
					}
				},
				directories,
				resources,
				icon_groups: iconGroups,
				coverage: {
					status: "complete",
					examined_entries: examined,
					resources: resources.length
				},
				limitations: [
					"Static PE32/PE32+ type/name/language resource inventory; payloads other than RT_GROUP_ICON remain opaque.",
					"Icon candidates are resource-table relationships. Language fallback, image decoding and actual shell/window loading are not observed.",
					"Exact shared byte ranges are retained; non-identical overlapping resource structures or payloads are rejected."
				]
			};
			assertArtifactReadActive(signal);
			if (jsonBytes(report, METADATA_BYTES) > METADATA_BYTES) limit("PE resource result exceeds the 8 MiB allocation budget.", "memory");
			return report;
		};
		rejectOverlappingRanges = (ranges) => {
			ranges.sort((left, right) => left.offset - right.offset || right.bytes - left.bytes);
			let previous;
			for (const current of ranges) {
				if (previous !== undefined && current.offset < previous.offset + previous.bytes && (current.offset !== previous.offset || current.bytes !== previous.bytes || current.kind !== previous.kind)) peFailure("Non-identical resource byte ranges overlap.");
				previous = current;
			}
		};
		readIconGroups = (bytes, resources, account, ensureCapacity) => {
			const imagesById = new Map();
			for (const resource of resources) {
				if (resource.type.kind !== "id" || resource.type.id !== 3 || resource.name.kind !== "id") continue;
				const candidates = imagesById.get(resource.name.id) ?? [];
				candidates.push(resource);
				imagesById.set(resource.name.id, candidates);
			}
			return resources.filter((resource) => resource.type.kind === "id" && resource.type.id === 14).map((group) => {
				const { offset, bytes: size } = group.payload.location;
				if (size < 6 || bytes.readUInt16LE(offset) !== 0 || bytes.readUInt16LE(offset + 2) !== 1) peFailure("Malformed RT_GROUP_ICON header.");
				const count = bytes.readUInt16LE(offset + 4);
				if (size !== 6 + count * 14) peFailure("RT_GROUP_ICON length does not match its image count.");
				const images = [];
				for (let index = 0; index < count; index++) {
					const at = offset + 6 + index * 14;
					const id = bytes.readUInt16LE(at + 12);
					const candidates = imagesById.get(id) ?? [];
					const exact = candidates.find((resource) => identityKey(resource.language) === identityKey(group.language));
					ensureCapacity(302 + candidates.length * 11);
					const declaredBytes = bytes.readUInt32LE(at + 8);
					const image = {
						location: {
							offset: at,
							bytes: 14
						},
						width: bytes[at] ?? 0,
						height: bytes[at + 1] ?? 0,
						color_count: bytes[at + 2] ?? 0,
						reserved: bytes[at + 3] ?? 0,
						planes: bytes.readUInt16LE(at + 4),
						bit_count: bytes.readUInt16LE(at + 6),
						declared_bytes: declaredBytes,
						resource_id: id,
						candidate_resource_indices: candidates.map(({ index }) => index),
						same_language_resource_index: exact?.index ?? null,
						size_matches: exact === undefined ? null : exact.payload.location.bytes === declaredBytes
					};
					account(image);
					images.push(image);
				}
				account({
					resource_index: group.index,
					images: []
				});
				return {
					resource_index: group.index,
					images
				};
			});
		};
	})))();
}

//#endregion
//#region dist/domain/native/elfNoteLayout.js
var elfNoteAlignment, elfNoteLayout;
function init_elfNoteLayout() {
	return (init_elfNoteLayout = __esmMin((() => {
		elfNoteAlignment = (declared) => declared === 8 || declared === 8n ? 8 : 4;
		elfNoteLayout = (namesz, descsz, alignment) => {
			const descriptor = Math.ceil((12 + namesz) / alignment) * alignment;
			return {
				descriptor,
				next: Math.ceil((descriptor + descsz) / alignment) * alignment
			};
		};
	})))();
}

//#endregion
export { ARTIFACT_CLASSIFICATION_PREFIX_BYTES, DirectoryArtifactEntryAccessDenied, DirectoryArtifactReader, DirectoryArtifactRootFailure, DirectoryArtifactTraversalLimit, PE_RESOURCE_METADATA_BYTES, abortIfNeeded, createArtifactClassificationProbe, decodeDirectoryEntryName, decodeMarshalUtf8, elfNoteAlignment, elfNoteLayout, hasPeResourceName, hashReadable, hostExecutableMarking, init_ArtifactClassificationProbe, init_ArtifactHash, init_ArtifactOperationFailure, init_DirectoryArtifactReader, init_PeResourceLayout, init_PeResourceParser, init_decodeDirectoryEntryName, init_elfNoteLayout, init_hostExecutableMarking, init_marshalUtf8, parsePeResources, readPeHeaders, readPeResourceLayout, translateArtifactFailure };