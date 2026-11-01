import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { MAX_INSPECT_PE_DIRECTORY_ENTRIES, MAX_INSPECT_PE_FILE_BYTES, ZIP_NON_ENTRY_LIMITATION, artifactContradictionId, artifactEdgeId, artifactGraphDigest, artifactIdForContent, artifactInventoryResultSchema, artifactManifestId, compareUnicodeCodePoints, digestCanonicalValue, hasZipSignature, init_artifactGraph, init_artifactIdentity, init_canonicalDigest, init_javascriptArtifactFiles, init_jsonValueByteLength, init_machoCpuIdentity, init_peResources, init_unicodeCodePointOrder, init_zipPackageFormat, isJavaScriptSourcePath, isZipPackageFormat, jsonValueByteLength, locateTrailingZipArchive, logicalPathNfc, machoArchitectureFamily, machoCpuSubtypeBase, occurrenceIdForLocation, zipPackageFormatForPath, zipRootPackageFormat } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { artifactIntegrityDetails, artifactIntegrityPair, err, init_artifactIntegrity, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { ArtifactReaderFailure, NonRegularFileReadError, OwnedFileHandle, RegularFileAdmissionFailure, RegularFileChangedError, RegularFileOperationCancelled, copyArtifactEntry, init_ArtifactReader, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, openRegularFile, regularFileCancellation, sameArtifactEntry, sameRegularFileState } from "./ArtifactReader-PV1DaSaC.js";
import { assertArtifactReadActive, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { init_elfFixedHeader, readElfFixedHeader } from "./peMachine-BoMBJgsB.js";
import { ExecFileOutputCancelledError, execFileOutput, execFileOutputFailure, init_ExecFileOutput } from "./ExecFileOutput-OgYrEogw.js";
import { ARTIFACT_CLASSIFICATION_PREFIX_BYTES, DirectoryArtifactEntryAccessDenied, DirectoryArtifactReader, abortIfNeeded, createArtifactClassificationProbe, decodeMarshalUtf8, elfNoteAlignment, elfNoteLayout, hasPeResourceName, hashReadable, hostExecutableMarking, init_ArtifactClassificationProbe, init_ArtifactHash, init_DirectoryArtifactReader, init_PeResourceLayout, init_PeResourceParser, init_elfNoteLayout, init_hostExecutableMarking, init_marshalUtf8, parsePeResources, readPeResourceLayout } from "./elfNoteLayout-BKHYz-Fs.js";
import { init_readArtifactFileChunks, init_readFileHandleChunks, readArtifactFileChunks, readFileHandleChunks } from "./readArtifactFileChunks-C0neyJLE.js";
import { ArtifactPathRegistry, annotateEnglishUnicodeCaseCollisions, hasDestinationPath, init_ArtifactPaths, init_StreamBytes, normalizeArtifactPath, streamChunkToBuffer } from "./ArtifactPaths-BSpMttuG.js";
import { admitAsarHeader, asarHeaderAdmissionFailure, init_AsarHeader } from "./AsarHeader-C-8M8Vix.js";
import { hasBinaryPlistSignature, hasXmlPlistSignature, init_appleArchiveFormat } from "./appleArchiveFormat-B-JoSBSY.js";
import { classifyFatContainerIdentity, init_machoContainer, readFatContainerHeader, readMachoHeaderPrefixFacts } from "./machoLoadCommands-CChRRK2_.js";
import { GODOT_PCK_MAGIC, claimsExecutableHeader, hasGodotPckHeader, init_binaryTarget, init_dosMz, init_godotPckFormat, observeMzWindowsHeader, parseMzHeaderEvidence } from "./godotPckFormat-BQCRCg8e.js";
import { init_MachoLoadCommandReader, readMachoImage } from "./MachoLoadCommandReader-BwJFJimz.js";
import { ZipArtifactReader, artifactExpansionBudgetBytes, init_ZipArtifactReader, init_artifactExpansionBudget } from "./ZipArtifactReader-CuoDflLN.js";
import { XcrunCommandRunner, init_CommandRunner, init_lipo, parseLipoOutputResult } from "./lipo-DHDi7Wk6.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { setImmediate } from "node:timers/promises";
import { lstat, mkdtemp, open, realpath, rm } from "node:fs/promises";
import { finished, pipeline } from "node:stream/promises";
import { constants, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { createInflate } from "node:zlib";
import { Readable, Transform, pipeline as pipeline$1 } from "node:stream";
import { parse } from "plist";
import { getRawHeader, uncache } from "@electron/asar";

//#region dist/artifacts/AsarFailure.js
var asarCancellationFailure, assertAsarReadActive, asarFailure, isFilesystemFailure;
function init_AsarFailure() {
	return (init_AsarFailure = __esmMin((() => {
		init_ArtifactReader();
		asarCancellationFailure = (reason) => new ArtifactReaderFailure("cancelled", "ASAR operation cancelled", { cause: reason });
		assertAsarReadActive = (signal) => {
			if (signal?.aborted === true) throw asarCancellationFailure(signal.reason);
		};
		asarFailure = (path, operation, cause) => {
			if (cause instanceof ArtifactReaderFailure) return cause;
			if (isFilesystemFailure(cause)) return new ArtifactReaderFailure("io", `Could not ${operation} ASAR at ${path}: ${cause.message}`, { cause });
			return new ArtifactReaderFailure("format", `Malformed ASAR during ${operation}: ${path}`, { cause });
		};
		isFilesystemFailure = (cause) => cause instanceof Error && "errno" in cause && typeof cause.errno === "number" && "syscall" in cause && typeof cause.syscall === "string";
	})))();
}

//#endregion
//#region dist/artifacts/AsarEntryStream.js
var closeAsarHandle, readValidatedAsarEntry;
function init_AsarEntryStream() {
	return (init_AsarEntryStream = __esmMin((() => {
		init_ArtifactReader();
		init_AsarFailure();
		closeAsarHandle = async (close, signal) => {
			await close();
			assertAsarReadActive(signal);
		};
		readValidatedAsarEntry = (source, expectedBytes, entryPath, archivePath, signal) => {
			const expectedExtent = expectedBytes === undefined ? undefined : BigInt(expectedBytes);
			const completionFailure = () => {
				const coverage = source.readCoverage();
				if (coverage.kind !== "complete") return new ArtifactReaderFailure("integrity", `ASAR entry read coverage is incomplete: ${entryPath}`);
				if (expectedExtent !== undefined && coverage.bytes !== expectedExtent) return new ArtifactReaderFailure("integrity", `ASAR entry size disagrees with its header: ${entryPath}`);
				if (signal?.aborted) return asarCancellationFailure(signal.reason);
				return undefined;
			};
			const output = Readable.from((async function* () {
				const iterator = source[Symbol.asyncIterator]();
				try {
					while (true) {
						const next = await iterator.next();
						if (next.done) break;
						const chunk = next.value;
						if (!Buffer.isBuffer(chunk) && !(chunk instanceof Uint8Array)) throw new ArtifactReaderFailure("format", `ASAR entry did not return bytes: ${entryPath}`);
						const coverage = source.readCoverage();
						if (expectedExtent !== undefined && coverage.bytes > expectedExtent) throw new ArtifactReaderFailure("integrity", `ASAR entry exceeded its declared size: ${entryPath}`);
						if (coverage.kind === "complete" && signal?.aborted) {
							const failure = completionFailure();
							if (failure !== undefined) throw failure;
						}
						yield chunk;
					}
					const failure = completionFailure();
					if (failure !== undefined) throw failure;
				} catch (cause) {
					throw asarFailure(archivePath, `read ${entryPath}`, cause);
				} finally {
					try {
						await iterator.return?.();
					} catch {}
					if (!source.destroyed) source.destroy();
				}
			})());
			const onSourceError = (cause) => {
				const completedCancellation = cause instanceof ArtifactReaderFailure && cause.reason === "cancelled" && source.readCoverage().kind === "complete" ? completionFailure() : undefined;
				output.destroy(completedCancellation ?? asarFailure(archivePath, `read ${entryPath}`, cause));
			};
			source.on("error", onSourceError);
			source.once("close", () => source.removeListener("error", onSourceError));
			const onAbort = () => {
				if (source.readCoverage().kind === "complete" && !output.destroyed && (source.errored === null || source.errored instanceof ArtifactReaderFailure && source.errored.reason === "cancelled")) {
					const failure = completionFailure();
					if (failure !== undefined) output.destroy(failure);
				}
			};
			signal?.addEventListener("abort", onAbort, { once: true });
			output.once("close", () => {
				signal?.removeEventListener("abort", onAbort);
				if (!source.destroyed) source.destroy();
			});
			if (signal?.aborted) onAbort();
			return output;
		};
	})))();
}

//#endregion
//#region dist/artifacts/AsarListing.js
function* ownChildren(files) {
	for (const name in files) if (Object.hasOwn(files, name)) yield [name, files[name]];
}
var MAX_LISTING_BYTES, nodeSchema, readAsarListing;
function init_AsarListing() {
	return (init_AsarListing = __esmMin((() => {
		init_ArtifactReader();
		init_AsarFailure();
		init_unicodeCodePointOrder();
		MAX_LISTING_BYTES = 64 * 1024 * 1024;
		nodeSchema = z.looseObject({
			files: z.custom((value) => value !== null && typeof value === "object" && !Array.isArray(value)).optional(),
			link: z.string().optional(),
			size: z.number().nonnegative().safe().optional(),
			offset: z.string().optional(),
			unpacked: z.boolean().optional(),
			executable: z.boolean().optional(),
			integrity: z.looseObject({
				algorithm: z.string(),
				hash: z.string()
			}).optional()
		});
		readAsarListing = async (header, signal) => {
			const root = nodeSchema.parse(header);
			if (root.files === undefined) throw new ArtifactReaderFailure("format", "ASAR root has no files table");
			const entries = [];
			const pending = [{
				parent: "",
				children: ownChildren(root.files)
			}];
			let retainedBytes = 0;
			let examined = 0;
			while (pending.length > 0) {
				if (examined++ % 128 === 0) {
					await setImmediate();
					assertAsarReadActive(signal);
				}
				const frame = pending.at(-1);
				if (frame === undefined) break;
				const next = frame.children.next();
				if (next.done) {
					pending.pop();
					continue;
				}
				const [name, raw] = next.value;
				if (name.length === 0 || name === "." || name === ".." || name.includes("/") || name.includes("\0") || process.platform === "win32" && name.includes("\\")) throw new ArtifactReaderFailure("path", "ASAR header has an unsafe path component");
				const units = frame.parent.length + name.length + (frame.parent.length === 0 ? 0 : 1);
				retainedBytes += units * 2 + 256;
				if (retainedBytes > MAX_LISTING_BYTES) throw new ArtifactReaderFailure("limit", "ASAR expanded listing exceeds its 64 MiB representation budget");
				const path = frame.parent.length === 0 ? name : `${frame.parent}/${name}`;
				const metadata = nodeSchema.parse(raw);
				if (metadata.files === undefined && metadata.link === undefined && metadata.size === undefined) throw new ArtifactReaderFailure("format", "ASAR entry has no directory, link or file metadata");
				entries.push({
					path,
					metadata
				});
				if (metadata.files !== undefined) pending.push({
					parent: path,
					children: ownChildren(metadata.files)
				});
			}
			return entries.sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
		};
	})))();
}

//#endregion
//#region dist/artifacts/AsarArtifactReader.js
var AsarArtifactReader, defaultRemoveSnapshot, asarUnpackedEntryFailure, isAsarFileMetadata, parseArchiveOffset, waitForOperation, isMissingFile;
function init_AsarArtifactReader() {
	return (init_AsarArtifactReader = __esmMin((() => {
		init_artifactIntegrity();
		init_ArtifactReader();
		init_AsarEntryStream();
		init_AsarHeader();
		init_OwnedFileHandle();
		init_readArtifactFileChunks();
		init_AsarFailure();
		init_AsarListing();
		AsarArtifactReader = class {
			path;
			options;
			format = "asar";
			#archiveSize;
			#headerSize;
			#entries = new Map();
			#ownedHandles = new Map();
			#snapshot;
			#snapshotRoot;
			#snapshotOperation = Promise.resolve();
			constructor(path, options = {}) {
				this.path = path;
				this.options = options;
			}
			async *entries(signal) {
				let paths;
				try {
					await this.prepareContainer(undefined, signal);
					paths = await this.#withSnapshotOperation(async () => {
						const snapshotPath = this.#snapshotPath();
						this.#resetArchiveState();
						this.#entries.clear();
						const admitted = await this.#admitHeader(snapshotPath, signal);
						this.#archiveSize = admitted.archiveBytes;
						this.#headerSize = admitted.headerBytes;
						assertAsarReadActive(signal);
						const ordered = await readAsarListing(getRawHeader(snapshotPath).header, signal);
						const archiveMetadata = await lstat(snapshotPath);
						if (!archiveMetadata.isFile() || archiveMetadata.isSymbolicLink()) throw new ArtifactReaderFailure("format", "ASAR container is not a regular file");
						this.#archiveSize = archiveMetadata.size;
						return ordered;
					}, signal);
				} catch (cause) {
					throw asarFailure(this.path, "inventory", cause);
				}
				for (const { metadata, path } of paths) {
					assertAsarReadActive(signal);
					const providerPath = path.split("/").join(sep);
					const kind = metadata.files !== undefined ? "directory" : metadata.link !== undefined ? "symlink" : "file";
					const entry = {
						path,
						kind,
						declaredSize: metadata.size ?? null,
						compressedSize: null,
						executable: metadata.executable === true,
						encrypted: false,
						byteOffset: null,
						declaredIntegrity: metadata.integrity !== undefined && metadata.integrity.algorithm === "SHA256" && /^[a-f0-9]{64}$/u.test(metadata.integrity.hash) ? {
							algorithm: "sha256",
							digest: metadata.integrity.hash
						} : null,
						unpacked: "unpacked" in metadata && metadata.unpacked === true,
						limitations: kind === "symlink" ? ["ASAR symlink target was not followed or disclosed."] : [],
						adapterKey: providerPath
					};
					if (kind === "file" && isAsarFileMetadata(metadata)) this.#entries.set(providerPath, {
						metadata,
						entry: copyArtifactEntry(entry)
					});
					yield entry;
				}
			}
			async #admitHeader(snapshotPath, signal) {
				const headerHandle = await this.#openOwned(snapshotPath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
				let admission;
				try {
					admission = {
						ok: true,
						value: await admitAsarHeader(headerHandle, signal, this.options.headerAdmission)
					};
				} catch (cause) {
					admission = {
						ok: false,
						cause
					};
				}
				try {
					await this.#closeOwnedHandle(headerHandle);
				} catch (cleanupCause) {
					if (!admission.ok) throw ArtifactReaderFailure.withCleanup(admission.cause, ArtifactReaderFailure.cleanupObservation(cleanupCause, snapshotPath));
					throw cleanupCause;
				}
				if (!admission.ok) throw admission.cause;
				return admission.value;
			}
			async open(entry, signal) {
				return this.#withSnapshotOperation(() => this.#openEntry(entry, signal), signal);
			}
			async #openEntry(entry, signal) {
				assertAsarReadActive(signal);
				const state = this.#entries.get(entry.adapterKey);
				if (state === undefined && entry.kind !== "file") throw new ArtifactReaderFailure("format", "ASAR entry is not a regular file");
				if (state === undefined) throw new ArtifactReaderFailure("integrity", `ASAR entry was not produced by this reader: ${entry.path}`);
				if (!sameArtifactEntry(entry, state.entry)) throw new ArtifactReaderFailure("integrity", `ASAR entry metadata changed since inventory: ${state.entry.path}`);
				if (state.entry.unpacked) return this.#openUnpackedStream(state.entry, signal);
				return this.#openPackedStream(state, signal);
			}
			async #openPackedStream(state, signal) {
				const { metadata, entry: producedEntry } = state;
				const archiveSize = this.#archiveSize;
				const headerSize = this.#headerSize;
				const offset = metadata.offset === undefined ? undefined : parseArchiveOffset(metadata.offset);
				const start = offset === undefined || headerSize === undefined ? undefined : 8 + headerSize + offset;
				if (archiveSize === undefined || start === undefined || !Number.isSafeInteger(start) || metadata.size < 0 || !Number.isSafeInteger(metadata.size) || start > archiveSize || metadata.size > archiveSize - start) throw new ArtifactReaderFailure("format", `ASAR entry range is outside its container: ${producedEntry.path}`);
				const snapshotPath = this.#snapshotPath();
				let handle;
				try {
					const openedHandle = await this.#openOwned(snapshotPath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					handle = openedHandle;
					const observed = await openedHandle.stat();
					assertAsarReadActive(signal);
					if (!observed.isFile() || observed.size !== archiveSize) throw new ArtifactReaderFailure("integrity", `ASAR container changed before read: ${producedEntry.path}`);
					if (metadata.size === 0) {
						handle = undefined;
						await closeAsarHandle(() => this.#closeOwnedHandle(openedHandle), signal);
						return Readable.from([]);
					}
					const source = this.#ownedReadStream(openedHandle, {
						start,
						end: start + metadata.size - 1,
						signal
					});
					handle = undefined;
					const output = readValidatedAsarEntry(source, metadata.size, producedEntry.path, this.path, signal);
					this.#setOwnedOutput(openedHandle, output);
					return output;
				} catch (cause) {
					const failure = asarFailure(this.path, `read ${producedEntry.path}`, cause);
					if (handle !== undefined) {
						try {
							await this.#closeOwnedHandle(handle);
						} catch (cleanupCause) {
							throw ArtifactReaderFailure.withCleanup(failure, ArtifactReaderFailure.cleanupObservation(cleanupCause, snapshotPath));
						}
					}
					throw failure;
				}
			}
			/** Capture once per reader lifetime; bind all interpretation to these exact bytes. */
			async prepareContainer(expectedSha256, signal) {
				await this.#withSnapshotOperation(async () => {
					assertAsarReadActive(signal);
					if (this.#snapshot === undefined && this.#snapshotRoot !== undefined) await this.#closeSnapshot();
					if (this.#snapshot === undefined) await this.#captureSnapshot(signal);
					if (expectedSha256 !== undefined && this.#snapshot?.sha256 !== expectedSha256) throw new ArtifactReaderFailure("integrity", `ASAR container changed before interpretation: ${this.path}`);
				}, signal);
			}
			/** Read the same captured container that supplies headers and packed members. */
			async openContainer(signal) {
				await this.prepareContainer(undefined, signal);
				return this.#withSnapshotOperation(async () => {
					assertAsarReadActive(signal);
					const snapshotPath = this.#snapshotPath();
					const handle = await this.#openOwned(snapshotPath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					return this.#ownedReadStream(handle, { signal });
				}, signal);
			}
			async close() {
				await this.#withSnapshotOperation(() => this.#closeSnapshot());
			}
			async #captureSnapshot(signal) {
				let inputHandle;
				try {
					this.#snapshotRoot = await mkdtemp(join(tmpdir(), "rea-asar-snapshot-"));
					const snapshotPath = join(this.#snapshotRoot, "container.asar");
					const hash = createHash("sha256");
					inputHandle = await this.#openOwned(this.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					const source = this.#ownedReadStream(inputHandle, {
						signal,
						releaseOnClose: false
					});
					const digesting = new Transform({ transform(chunk, _encoding, callback) {
						hash.update(chunk);
						callback(null, chunk);
					} });
					await pipeline(source, digesting, createWriteStream(snapshotPath, {
						flags: "wx",
						mode: 384
					}));
					const completedInput = inputHandle;
					inputHandle = undefined;
					await this.#closeOwnedHandle(completedInput);
					assertAsarReadActive(signal);
					this.#snapshot = {
						path: snapshotPath,
						sha256: hash.digest("hex")
					};
				} catch (cause) {
					let failure = asarFailure(this.path, "snapshot", cause);
					if (inputHandle !== undefined) {
						const failedInput = inputHandle;
						inputHandle = undefined;
						try {
							await this.#closeOwnedHandle(failedInput);
						} catch (cleanupCause) {
							failure = ArtifactReaderFailure.withCleanup(failure, ArtifactReaderFailure.cleanupObservation(cleanupCause, this.path));
						}
					}
					try {
						if (this.#ownedHandles.size === 0) await this.#closeSnapshot();
					} catch (cleanupCause) {
						throw ArtifactReaderFailure.withCleanup(failure, ArtifactReaderFailure.cleanupObservation(cleanupCause, this.#snapshotRoot ?? this.path));
					}
					throw failure;
				}
			}
			async #closeSnapshot() {
				await this.#closeOwnedHandles();
				const root = this.#snapshotRoot;
				if (root !== undefined) {
					try {
						await (this.options.removeSnapshot ?? defaultRemoveSnapshot)(root);
						if (this.#snapshotRoot === root) this.#snapshotRoot = undefined;
					} catch (cause) {
						throw ArtifactReaderFailure.withCleanup(cause, {
							reason: `Could not remove ASAR snapshot: ${root}`,
							resources: [root]
						});
					}
				}
				if (root === undefined || this.#snapshotRoot === undefined) {
					if (this.#snapshot !== undefined) uncache(this.#snapshot.path);
					this.#snapshot = undefined;
					this.#resetArchiveState();
					this.#entries.clear();
				}
			}
			async #withSnapshotOperation(operation, signal) {
				const previous = this.#snapshotOperation;
				let release;
				this.#snapshotOperation = new Promise((resolve) => {
					release = resolve;
				});
				try {
					await waitForOperation(previous, signal);
				} catch (cause) {
					void previous.then(release, release);
					throw cause;
				}
				try {
					assertAsarReadActive(signal);
					return await operation();
				} finally {
					release();
				}
			}
			#snapshotPath() {
				if (this.#snapshot === undefined) throw new ArtifactReaderFailure("integrity", "ASAR snapshot is not available");
				return this.#snapshot.path;
			}
			provenance() {
				return [];
			}
			async #openUnpackedStream(entry, signal) {
				const unpackedRoot = `${this.path}.unpacked`;
				let handle;
				try {
					const rootMetadata = await lstat(unpackedRoot);
					if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) throw new ArtifactReaderFailure("path", "ASAR unpacked companion is not a regular directory");
					const canonicalRoot = await realpath(unpackedRoot);
					const candidate = join(unpackedRoot, entry.adapterKey);
					const canonical = await realpath(candidate);
					const relativePath = relative(canonicalRoot, canonical);
					if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) throw new ArtifactReaderFailure("path", `ASAR unpacked entry escaped its companion directory: ${entry.path}`);
					const pathMetadata = await lstat(candidate);
					if (!pathMetadata.isFile() || pathMetadata.isSymbolicLink()) throw new ArtifactReaderFailure("path", `ASAR unpacked entry is not a regular file: ${entry.path}`);
					handle = await (this.options.openUnpackedFile ?? open)(canonical, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					const openedHandle = handle;
					this.#adoptHandle(openedHandle, canonical);
					const openedMetadata = await openedHandle.stat();
					if (!openedMetadata.isFile() || openedMetadata.dev !== pathMetadata.dev || openedMetadata.ino !== pathMetadata.ino) {
						throw new ArtifactReaderFailure("integrity", `ASAR unpacked entry changed before read: ${entry.path}`, {}, artifactIntegrityDetails(entry.path, entry.declaredIntegrity, null, true));
					}
					assertAsarReadActive(signal);
					const source = this.#ownedReadStream(openedHandle, {
						start: 0,
						signal
					});
					handle = undefined;
					const output = readValidatedAsarEntry(source, undefined, entry.path, this.path, signal);
					this.#setOwnedOutput(openedHandle, output);
					return output;
				} catch (cause) {
					let failure = asarUnpackedEntryFailure(this.path, entry, cause);
					if (handle !== undefined && this.#ownedHandles.has(handle)) {
						try {
							await this.#closeOwnedHandle(handle);
						} catch (cleanupCause) {
							failure = ArtifactReaderFailure.withCleanup(failure, ArtifactReaderFailure.cleanupObservation(cleanupCause, this.#ownedHandles.get(handle)?.path ?? entry.path));
						}
					}
					throw failure;
				}
			}
			async #closeOwnedHandle(handle) {
				const owned = this.#ownedHandles.get(handle);
				if (owned === undefined) return;
				owned.output?.destroy();
				owned.source?.destroy();
				try {
					await owned.owner.close();
				} catch (cause) {
					throw ArtifactReaderFailure.withCleanup(cause, ArtifactReaderFailure.cleanupObservation(cause, owned.path));
				}
				this.#ownedHandles.delete(handle);
			}
			async #closeOwnedHandles() {
				let failure;
				for (const [handle, owned] of this.#ownedHandles) {
					try {
						await this.#closeOwnedHandle(handle);
					} catch (cause) {
						failure = ArtifactReaderFailure.withCleanup(failure ?? cause, ArtifactReaderFailure.cleanupObservation(cause, owned.path));
					}
				}
				if (failure !== undefined) throw failure;
			}
			async #openOwned(path, flags) {
				const handle = await (this.options.openFile ?? open)(path, flags);
				this.#adoptHandle(handle, path);
				return handle;
			}
			#adoptHandle(handle, path) {
				this.#ownedHandles.set(handle, {
					path,
					owner: new OwnedFileHandle(handle)
				});
			}
			#ownedReadStream(handle, options) {
				const { releaseOnClose, ...readOptions } = options;
				const source = readArtifactFileChunks(handle, readOptions);
				const owned = this.#ownedHandles.get(handle);
				if (owned === undefined) throw new ArtifactReaderFailure("integrity", "ASAR handle has no owner");
				owned.source = source;
				owned.output = source;
				if (releaseOnClose !== false) source.once("close", () => {
					void this.#closeOwnedHandle(handle).catch(() => undefined);
				});
				return source;
			}
			#setOwnedOutput(handle, output) {
				const owned = this.#ownedHandles.get(handle);
				if (owned !== undefined) owned.output = output;
			}
			#resetArchiveState() {
				this.#archiveSize = undefined;
				this.#headerSize = undefined;
			}
		};
		defaultRemoveSnapshot = (path) => rm(path, {
			recursive: true,
			force: true
		});
		asarUnpackedEntryFailure = (archivePath, entry, cause) => {
			if (cause instanceof ArtifactReaderFailure) return cause;
			if (entry.unpacked && isMissingFile(cause)) return new ArtifactReaderFailure("unavailable", `ASAR unpacked entry bytes are unavailable: ${entry.path}`, { cause }, artifactIntegrityDetails(entry.path, entry.declaredIntegrity, null, true));
			return asarFailure(archivePath, `read ${entry.path}`, cause);
		};
		isAsarFileMetadata = (metadata) => typeof metadata.size === "number" && metadata.files === undefined && metadata.link === undefined;
		parseArchiveOffset = (value) => {
			if (!/^(?:0|[1-9][0-9]*)$/u.test(value)) return undefined;
			const offset = Number(value);
			return Number.isSafeInteger(offset) ? offset : undefined;
		};
		waitForOperation = async (operation, signal) => {
			if (signal === undefined) return operation;
			assertAsarReadActive(signal);
			await new Promise((resolve, reject) => {
				const removeAbortListener = () => signal.removeEventListener("abort", onAbort);
				const onAbort = () => {
					removeAbortListener();
					reject(asarCancellationFailure(signal.reason));
				};
				signal.addEventListener("abort", onAbort, { once: true });
				operation.then(() => {
					removeAbortListener();
					resolve();
				}, (cause) => {
					removeAbortListener();
					reject(cause);
				});
			});
		};
		isMissingFile = (cause) => typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
//#region dist/artifacts/inventory/ArtifactGraphConstruction.js
var indexDestinationOccurrencesByPath, createOccurrence, noteUnreadContainerSuffix, containerSuffixFamily, materializeDirectoryNodes, createRootNode, createArtifactNode, rootOccurrenceFor, rekeyOccurrences, createArtifactEdges, resolveOccurrenceParents, classifyArtifactPath, classifyArtifactContent, artifactRoleForFormat, classifyArtifactBytes, classifyFatArtifact, relationFor, depth;
function init_ArtifactGraphConstruction() {
	return (init_ArtifactGraphConstruction = __esmMin((() => {
		init_godotPckFormat();
		init_AsarHeader();
		init_ArtifactPaths();
		init_unicodeCodePointOrder();
		init_javascriptArtifactFiles();
		init_canonicalDigest();
		init_appleArchiveFormat();
		init_artifactIdentity();
		init_zipPackageFormat();
		init_dosMz();
		init_machoContainer();
		indexDestinationOccurrencesByPath = (occurrences) => {
			const byPath = new Map();
			for (const occurrence of occurrences) {
				if (!hasDestinationPath(occurrence.entry_kind)) continue;
				const matches = byPath.get(occurrence.logical_path);
				if (matches === undefined) byPath.set(occurrence.logical_path, [occurrence]);
				else matches.push(occurrence);
			}
			return byPath;
		};
		createOccurrence = (entry, path, parent, duplicateOrdinal = 0) => {
			const role = entry.kind === "metadata" ? {
				kind: "package-metadata",
				format: "unknown"
			} : entry.kind === "directory" ? {
				kind: path.toLowerCase().endsWith(".framework") ? "framework" : "container",
				format: "directory"
			} : containerSuffixFamily(path) === undefined ? classifyArtifactPath(path) : {
				kind: "unknown",
				format: "unknown"
			};
			return {
				occurrence_id: `occ_${digestCanonicalValue(duplicateOrdinal === 0 ? {
					path,
					kind: entry.kind
				} : {
					path,
					kind: entry.kind,
					duplicate_ordinal: duplicateOrdinal
				}, "Artifact")}`,
				artifact_id: null,
				parent_occurrence_id: parent,
				logical_path: path,
				...entry.sourcePath !== undefined || entry.path !== logicalPathNfc(entry.path) ? { source_path: entry.sourcePath ?? entry.path } : {},
				entry_kind: entry.kind,
				artifact_kind: role.kind,
				artifact_format: role.format,
				declared_size: entry.declaredSize,
				compressed_size: entry.compressedSize,
				executable: entry.executable,
				encrypted: entry.encrypted,
				...entry.unpacked ? { unpacked: true } : {},
				hash_status: entry.encrypted ? "unavailable" : "not-hashed",
				source_location: entry.encrypted || entry.byteOffset === null || entry.declaredSize === null ? null : {
					offset: entry.byteOffset,
					length: entry.declaredSize
				},
				limitations: [...entry.limitations],
				...entry.declaredIntegrity === null ? {} : { declared_integrity: { ...entry.declaredIntegrity } },
				...entry.formatMetadata === undefined ? {} : { format_metadata: { ...entry.formatMetadata } }
			};
		};
		noteUnreadContainerSuffix = (occurrence) => {
			if (occurrence.entry_kind === "directory") return;
			const family = containerSuffixFamily(occurrence.logical_path);
			if (family === undefined) return;
			occurrence.limitations.push(`The path suffix suggests ${family.toUpperCase()}, but these bytes were not read, so the container family is unknown.`);
		};
		containerSuffixFamily = (path) => {
			const lower = path.toLowerCase();
			return lower.endsWith(".asar") ? "asar" : zipPackageFormatForPath(lower);
		};
		materializeDirectoryNodes = (occurrences, nodes) => {
			const directories = occurrences.filter(({ entry_kind: kind, hash_status }) => kind === "directory" && hash_status !== "unavailable").sort((left, right) => depth(right.logical_path) - depth(left.logical_path));
			const childrenByParent = new Map();
			for (const occurrence of occurrences) {
				if (occurrence.parent_occurrence_id === null) continue;
				const children = childrenByParent.get(occurrence.parent_occurrence_id);
				if (children === undefined) childrenByParent.set(occurrence.parent_occurrence_id, [occurrence]);
				else children.push(occurrence);
			}
			for (const directory of directories) {
				const children = (childrenByParent.get(directory.occurrence_id) ?? []).map(({ logical_path, artifact_id, entry_kind }) => ({
					name: logical_path.slice(directory.logical_path.length + 1),
					artifact_id,
					entry_kind
				})).sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
				const node = createArtifactNode({
					sha256: digestCanonicalValue({
						kind: "directory",
						children
					}, "Artifact"),
					size: 0,
					format: "directory",
					contentState: "virtual"
				});
				nodes.set(node.artifact_id, node);
				directory.artifact_id = node.artifact_id;
				directory.hash_status = "verified";
			}
		};
		createRootNode = (input) => createArtifactNode({
			sha256: input.digest?.sha256 ?? digestCanonicalValue({
				kind: "directory-root",
				children: input.occurrences.map(({ logical_path, artifact_id }) => ({
					logical_path,
					artifact_id
				})).sort((left, right) => compareUnicodeCodePoints(left.logical_path, right.logical_path))
			}, "Artifact"),
			size: input.digest?.bytes ?? 0,
			format: input.digest === null ? "directory" : classifyArtifactBytes(input.digest, input.digest.bytes),
			contentState: "materialized"
		});
		createArtifactNode = (input) => ({
			artifact_id: artifactIdForContent(input.sha256),
			format: input.format,
			sha256: input.sha256,
			size: input.size,
			media_type: null,
			architecture: null,
			content_state: input.contentState,
			limitations: []
		});
		rootOccurrenceFor = (node, metadata) => ({
			occurrence_id: occurrenceIdForLocation({
				rootArtifactId: node.artifact_id,
				logicalPath: ".",
				entryKind: metadata.format === "directory" ? "directory" : "file"
			}),
			artifact_id: node.artifact_id,
			parent_occurrence_id: null,
			logical_path: ".",
			entry_kind: metadata.format === "directory" ? "directory" : "file",
			artifact_kind: metadata.format === "directory" || isZipPackageFormat(metadata.format) || [
				"asar",
				"godot-pck",
				"dmg",
				"pkg",
				"pyinstaller",
				"node-sea"
			].includes(metadata.format) ? "container" : artifactRoleForFormat(metadata.path, metadata.format).kind,
			artifact_format: metadata.format,
			declared_size: metadata.size,
			compressed_size: null,
			executable: metadata.executable,
			encrypted: metadata.formatMetadata?.kind === "godot-pck" && metadata.formatMetadata.directory_status === "encrypted",
			hash_status: "verified",
			source_location: null,
			...metadata.formatMetadata === undefined ? {} : { format_metadata: metadata.formatMetadata },
			limitations: []
		});
		rekeyOccurrences = (rootArtifactId, occurrences) => {
			const replacements = new Map();
			const ordinalByPath = new Map();
			for (const occurrence of occurrences) {
				const ordinal = ordinalByPath.get(occurrence.logical_path) ?? 0;
				ordinalByPath.set(occurrence.logical_path, ordinal + 1);
				replacements.set(occurrence.occurrence_id, occurrenceIdForLocation({
					rootArtifactId,
					logicalPath: occurrence.logical_path,
					entryKind: occurrence.entry_kind,
					...ordinal === 0 ? {} : { duplicateOrdinal: ordinal }
				}));
			}
			for (const occurrence of occurrences) {
				occurrence.occurrence_id = replacements.get(occurrence.occurrence_id) ?? occurrence.occurrence_id;
				if (occurrence.parent_occurrence_id !== null) occurrence.parent_occurrence_id = replacements.get(occurrence.parent_occurrence_id) ?? occurrence.parent_occurrence_id;
			}
		};
		createArtifactEdges = (rootArtifactId, occurrences, producer) => {
			const byId = new Map(occurrences.map((item) => [item.occurrence_id, item]));
			const byPath = indexDestinationOccurrencesByPath(occurrences);
			const edges = [];
			const limitations = [];
			for (const occurrence of occurrences) {
				const isSourceMap = occurrence.artifact_kind === "source-map";
				const sourcePath = isSourceMap ? occurrence.logical_path.slice(0, -".map".length) : undefined;
				const sourceCandidates = sourcePath === undefined ? [] : byPath.get(sourcePath) ?? [];
				const mappedSource = sourceCandidates.length === 1 && sourceCandidates[0]?.entry_kind === "file" && sourceCandidates[0].artifact_id !== null ? sourceCandidates[0] : undefined;
				if (sourcePath !== undefined) {
					const unknownMapping = sourceCandidates.length > 1 ? {
						occurrence: `Source-map target is unknown because multiple occurrences share ${JSON.stringify(sourcePath)}.`,
						coverage: `Source-map relationships are unknown because multiple occurrences share ${JSON.stringify(sourcePath)}.`
					} : sourceCandidates.length === 1 && sourceCandidates[0]?.entry_kind === "file" && mappedSource === undefined ? {
						occurrence: `Source-map target identity is unknown because the matching occurrence at ${JSON.stringify(sourcePath)} has no content identity.`,
						coverage: `Source-map relationships are unknown because the matching occurrence at ${JSON.stringify(sourcePath)} has no content identity.`
					} : undefined;
					if (unknownMapping !== undefined) {
						occurrence.limitations.push(unknownMapping.occurrence);
						limitations.push(unknownMapping.coverage);
					}
				}
				if (occurrence.parent_occurrence_id === null || occurrence.artifact_id === null) continue;
				const parentArtifactId = mappedSource?.artifact_id ?? byId.get(occurrence.parent_occurrence_id)?.artifact_id ?? rootArtifactId;
				const semantic = {
					parent_artifact_id: parentArtifactId,
					relation: occurrence.entry_kind === "slice" ? "slice-of" : occurrence.format_metadata?.kind === "pyinstaller-entry" && occurrence.format_metadata.bytecode_header === "derived" ? "derived-from" : isSourceMap ? mappedSource === undefined ? "contains" : "maps-source" : relationFor(occurrence.logical_path),
					occurrence_id: occurrence.occurrence_id
				};
				edges.push({
					edge_id: artifactEdgeId(semantic, occurrence),
					...semantic,
					producer: occurrence.entry_kind === "slice" ? producer ?? null : null,
					ordinal: edges.length
				});
			}
			return {
				edges,
				limitations
			};
		};
		resolveOccurrenceParents = (occurrences, byPath, expandedContainerIds) => {
			const root = { children: new Map() };
			for (const matches of byPath.values()) {
				const parents = matches.filter((occurrence) => occurrence.entry_kind === "directory" || expandedContainerIds.has(occurrence.occurrence_id));
				if (parents.length === 0) continue;
				if (parents.length > 1) {
					for (const parent of parents) if (parent.entry_kind === "directory") {
						parent.artifact_id = null;
						parent.hash_status = "unavailable";
						parent.limitations.push("This directory occurrence cannot be materialized because multiple directory entries share its logical path.");
					}
				}
				const path = matches[0]?.logical_path;
				if (path === undefined) continue;
				let branch = root;
				for (const segment of path.split("/")) {
					let child = branch.children.get(segment);
					if (child === undefined) {
						child = { children: new Map() };
						branch.children.set(segment, child);
					}
					branch = child;
				}
				branch.occurrences = parents;
			}
			const limitations = new Set();
			const unknownParentOccurrences = new Set();
			for (const occurrence of occurrences) {
				if (occurrence.entry_kind === "metadata") continue;
				const path = occurrence.logical_path;
				let branch = root;
				let parent;
				let ambiguousParentPath;
				let prefix = "";
				for (let start = 0;;) {
					const slash = path.indexOf("/", start);
					if (slash < 0) break;
					const segment = path.slice(start, slash);
					const child = branch.children.get(segment);
					if (child === undefined) break;
					branch = child;
					prefix = prefix.length === 0 ? segment : `${prefix}/${segment}`;
					const candidates = branch.occurrences ?? [];
					if (candidates.length === 1) {
						parent = candidates[0];
						ambiguousParentPath = undefined;
					} else if (candidates.length > 1) {
						parent = undefined;
						ambiguousParentPath = prefix;
					}
					start = slash + 1;
				}
				occurrence.parent_occurrence_id = parent?.occurrence_id ?? null;
				if (ambiguousParentPath !== undefined) {
					const limitation = `The parent occurrence for ${JSON.stringify(path)} is unknown because multiple observed directory or container occurrences share ${JSON.stringify(ambiguousParentPath)}.`;
					occurrence.limitations.push(limitation);
					limitations.add(limitation);
					unknownParentOccurrences.add(occurrence);
				}
			}
			return {
				limitations: [...limitations].sort(compareUnicodeCodePoints),
				unknownParentOccurrences
			};
		};
		classifyArtifactPath = (path) => {
			const lower = path.toLowerCase();
			if (lower.endsWith(".map")) return {
				kind: "source-map",
				format: "source-map"
			};
			if (isJavaScriptSourcePath(path)) return {
				kind: "javascript",
				format: "javascript-bundle"
			};
			if (/\.framework(?:\/|$)/u.test(lower)) return {
				kind: "framework",
				format: "file"
			};
			if (/\.(?:node|dylib|so)$/u.test(lower)) return {
				kind: lower.endsWith(".node") ? "native-addon" : "dynamic-library",
				format: "file"
			};
			if (lower.endsWith(".plist")) return {
				kind: "plist",
				format: "plist"
			};
			if (lower.endsWith(".entitlements")) return {
				kind: "entitlements",
				format: "entitlements"
			};
			return {
				kind: "resource",
				format: "file"
			};
		};
		classifyArtifactContent = (path, evidence, fileSize = evidence.prefix.length) => {
			const { prefix, asarHeader } = evidence;
			const contentFormat = classifyArtifactBytes(evidence, fileSize);
			const byPath = classifyArtifactPath(path);
			let role;
			if (contentFormat === "plist" && !hasBinaryPlistSignature(prefix) && ([
				"javascript",
				"source-map",
				"entitlements"
			].includes(byPath.kind) || path.toLowerCase().endsWith(".asar"))) role = byPath;
			else if (contentFormat === "file" && path.toLowerCase().endsWith(".asar") && asarHeader.state !== "rejected") {
				if (asarHeader.state === "limit") throw asarHeaderAdmissionFailure(asarHeader.admission);
				if (asarHeader.state === "matched") role = {
					kind: "container",
					format: "asar"
				};
				else role = artifactRoleForFormat(path, contentFormat);
			} else role = artifactRoleForFormat(path, contentFormat);
			return {
				...role,
				contentFormat
			};
		};
		artifactRoleForFormat = (path, format) => {
			const byPath = classifyArtifactPath(path);
			if (format === "file" || format === byPath.format) return byPath;
			if (format === "unknown") return {
				kind: "unknown",
				format
			};
			if (format === "zip") return {
				kind: "container",
				format: zipPackageFormatForPath(path) ?? format
			};
			if (format === "plist") return {
				kind: "plist",
				format
			};
			if (format === "godot-pck") return {
				kind: "container",
				format
			};
			return {
				kind: ["native-addon", "dynamic-library"].includes(byPath.kind) ? byPath.kind : "executable",
				format
			};
		};
		classifyArtifactBytes = (evidence, fileSize = evidence.prefix.length) => {
			const { prefix, mzWindowsHeaderSignature } = evidence;
			if (hasZipSignature(prefix)) return "zip";
			if (hasGodotPckHeader(prefix)) return "godot-pck";
			if (hasBinaryPlistSignature(prefix)) return "plist";
			if (hasXmlPlistSignature(prefix)) return "plist";
			const fatFormat = classifyFatArtifact(evidence, fileSize);
			if (fatFormat !== null) return fatFormat;
			if (prefix.length >= 4) {
				const magic = prefix.readUInt32BE(0);
				if ([
					4277009102,
					4277009103,
					3472551422,
					3489328638
				].includes(magic)) return "mach-o";
				if (prefix.subarray(0, 4).equals(Buffer.from([
					127,
					69,
					76,
					70
				]))) return "elf";
			}
			if (prefix.length >= 2 && prefix[0] === 77 && prefix[1] === 90) {
				if (!Number.isSafeInteger(fileSize) || fileSize < prefix.length || prefix.length < Math.min(fileSize, 64)) return "unknown";
				const mzEvidence = parseMzHeaderEvidence(prefix, fileSize, mzWindowsHeaderSignature);
				const { windowsHeader } = mzEvidence;
				if (windowsHeader.state === "signature-needed") return "unknown";
				if (windowsHeader.state === "candidate") return "unknown";
				if (windowsHeader.state === "declared") {
					const windowsOffset = windowsHeader.offset;
					if (windowsHeader.signature === "PE" && windowsOffset >= 64 && (windowsOffset <= prefix.length - 4 || mzWindowsHeaderSignature?.offset === windowsOffset && mzWindowsHeaderSignature.bytes.length >= 4)) return "pe";
					return "unknown";
				}
				if (mzEvidence.dos.ok) return "dos-mz";
				return "unknown";
			}
			return "file";
		};
		classifyFatArtifact = (evidence, fileSize) => {
			const { prefix, fatSliceHeaders } = evidence;
			const fatHeader = fatSliceHeaders?.header ?? readFatContainerHeader(prefix, fileSize);
			if (fatHeader.state === "needs-data" || fatHeader.state === "malformed") return "unknown";
			if (fatHeader.state === "not-fat") return null;
			const identity = classifyFatContainerIdentity(fatHeader, (offset) => {
				if (fatSliceHeaders?.sliceHeadersByOffset.has(offset) === true) return fatSliceHeaders.sliceHeadersByOffset.get(offset)?.magic;
				const slice = fatHeader.slices.find((candidate) => candidate.offset === offset);
				if (slice === undefined || offset >= prefix.length) return undefined;
				const available = Math.max(0, Math.min(slice.size, prefix.length - offset, 12));
				return readMachoHeaderPrefixFacts(prefix.subarray(offset, offset + available)).magic;
			});
			return identity.state === "mach-o" ? "mach-o-universal" : "unknown";
		};
		relationFor = (path) => path.toLowerCase().includes(".framework/") ? "embeds" : "contains";
		depth = (path) => path.split("/").length;
	})))();
}

//#endregion
//#region dist/artifacts/GodotPckLocation.js
var readPckBytes, locateGodotPck;
function init_GodotPckLocation() {
	return (init_GodotPckLocation = __esmMin((() => {
		init_godotPckFormat();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		readPckBytes = async (handle, position, length, end, signal) => {
			if (!Number.isSafeInteger(position) || !Number.isSafeInteger(length) || length < 0 || position < 0 || length > end - position) throw new ArtifactReaderFailure("format", "Godot PCK read exceeds its source range");
			const buffer = Buffer.alloc(length);
			let consumed = 0;
			while (consumed < length) {
				assertArtifactReadActive(signal);
				const { bytesRead } = await handle.read(buffer, consumed, length - consumed, position + consumed);
				assertArtifactReadActive(signal);
				if (bytesRead === 0) throw new ArtifactReaderFailure("format", "Godot PCK source is truncated");
				consumed += bytesRead;
			}
			return buffer;
		};
		locateGodotPck = async (handle, size, signal, prefix) => {
			assertArtifactReadActive(signal);
			if (!Number.isSafeInteger(size) || size < 4) return undefined;
			const magic = prefix !== undefined && prefix.length >= 4 ? Buffer.from(prefix.buffer, prefix.byteOffset, 4) : await readPckBytes(handle, 0, 4, size, signal);
			if (magic.readUInt32LE(0) === 1129333831) return {
				start: 0,
				end: size,
				embedded: false
			};
			if (size < 12) return undefined;
			const trailer = await readPckBytes(handle, size - 12, 12, size, signal);
			if (trailer.readUInt32LE(8) !== 1129333831) return undefined;
			const end = size - 12;
			const bytes = trailer.readBigUInt64LE(0);
			if (bytes < 4n || bytes > BigInt(end)) return undefined;
			const start = end - Number(bytes);
			if ((await readPckBytes(handle, start, 4, end, signal)).readUInt32LE(0) !== 1129333831) return undefined;
			return {
				start,
				end,
				embedded: true
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyInstallerFailure.js
var pyInstallerFailure;
function init_PyInstallerFailure() {
	return (init_PyInstallerFailure = __esmMin((() => {
		pyInstallerFailure = (reason, message) => ({
			reason,
			message
		});
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyInstallerBytes.js
var readPyInstallerBytes;
function init_PyInstallerBytes() {
	return (init_PyInstallerBytes = __esmMin((() => {
		init_result();
		init_ArtifactReader();
		init_ArtifactHash();
		init_PyInstallerFailure();
		readPyInstallerBytes = async (handle, input) => {
			abortIfNeeded(input.signal);
			if (!Number.isSafeInteger(input.position) || !Number.isSafeInteger(input.length) || input.position < 0 || input.length < 0 || !Number.isSafeInteger(input.position + input.length)) return err(pyInstallerFailure("format", `${input.label} has an invalid source range`));
			const bytes = Buffer.alloc(input.length);
			let offset = 0;
			while (offset < bytes.length) {
				abortIfNeeded(input.signal);
				let count;
				try {
					const read = await handle.read(bytes, offset, bytes.length - offset, input.position + offset);
					count = read.bytesRead;
				} catch (cause) {
					throw new ArtifactReaderFailure("io", `${input.label} could not be read`, { cause });
				}
				abortIfNeeded(input.signal);
				if (count === 0) return err(pyInstallerFailure("format", `${input.label} is truncated`));
				offset += count;
			}
			return ok(bytes);
		};
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/CArchiveLayout.js
var PYINSTALLER_COOKIE_MAGIC, PYINSTALLER_COOKIE_V21_BYTES, PYINSTALLER_COOKIE_V20_BYTES, PYINSTALLER_COOKIE_SEARCH_BYTES, MAX_TOC_BYTES, MAX_TOC_ENTRIES, TOC_HEADER_BYTES, isCArchiveDeclaration, containsPyInstallerArchive, findPyInstallerCookie, readCArchiveToc, parseCArchiveToc, parseCookieAt, parseCookie, libraryName, tocName, safeSum, validateCArchiveMembers;
function init_CArchiveLayout() {
	return (init_CArchiveLayout = __esmMin((() => {
		init_PyInstallerBytes();
		init_result();
		init_PyInstallerFailure();
		PYINSTALLER_COOKIE_MAGIC = Buffer.from("MEI\f\v\n\v");
		PYINSTALLER_COOKIE_V21_BYTES = 88;
		PYINSTALLER_COOKIE_V20_BYTES = 24;
		PYINSTALLER_COOKIE_SEARCH_BYTES = 16 * 1024 * 1024;
		MAX_TOC_BYTES = 32 * 1024 * 1024;
		MAX_TOC_ENTRIES = 1e5;
		TOC_HEADER_BYTES = 18;
		isCArchiveDeclaration = (entry) => entry.typeCode === "o" || entry.typeCode === "d";
		containsPyInstallerArchive = async (handle, fileSize, signal) => {
			const found = await findPyInstallerCookie(handle, fileSize, signal);
			return found?.ok === true;
		};
		findPyInstallerCookie = async (handle, fileSize, signal) => {
			if (!Number.isSafeInteger(fileSize) || fileSize < 24) return undefined;
			const tailSize = Math.min(fileSize, PYINSTALLER_COOKIE_SEARCH_BYTES);
			const read = await readPyInstallerBytes(handle, {
				position: fileSize - tailSize,
				length: tailSize,
				label: "CArchive tail",
				signal
			});
			if (!read.ok) return read;
			const observed = read.value;
			let failure;
			let from = observed.length;
			while (from >= PYINSTALLER_COOKIE_MAGIC.length) {
				const relative = observed.subarray(0, from).lastIndexOf(PYINSTALLER_COOKIE_MAGIC);
				if (relative < 0) break;
				const cookieOffset = fileSize - tailSize + relative;
				const parsed = parseCookieAt(observed, relative, cookieOffset, fileSize);
				if (parsed.ok) return parsed;
				failure = parsed.error;
				from = relative;
			}
			return failure === undefined ? undefined : err(failure);
		};
		readCArchiveToc = async (handle, cookie, signal) => {
			if (cookie.tocLength > MAX_TOC_BYTES) return err(pyInstallerFailure("limit", "CArchive table of contents exceeds its bound"));
			const position = cookie.archiveStart + cookie.tocOffset;
			const read = await readPyInstallerBytes(handle, {
				position,
				length: cookie.tocLength,
				label: "CArchive table of contents",
				signal
			});
			if (!read.ok) return read;
			const parsed = parseCArchiveToc(read.value);
			if (!parsed.ok) return parsed;
			const valid = validateCArchiveMembers(parsed.value, cookie.tocOffset);
			return valid.ok ? parsed : valid;
		};
		parseCArchiveToc = (bytes) => {
			const entries = [];
			let offset = 0;
			const malformedEntry = (message) => err(pyInstallerFailure("format", `CArchive table index ${String(entries.length)} at TOC offset ${String(offset)}: ${message}`));
			while (offset < bytes.length) {
				if (entries.length >= MAX_TOC_ENTRIES) return err(pyInstallerFailure("limit", "CArchive table of contents exceeds its entry bound"));
				if (offset + TOC_HEADER_BYTES > bytes.length) return malformedEntry("CArchive table of contents entry is truncated");
				const entryLength = bytes.readUInt32BE(offset);
				if (entryLength < TOC_HEADER_BYTES || offset + entryLength > bytes.length) return malformedEntry("CArchive table of contents entry extends outside the table");
				const nameBytes = bytes.subarray(offset + TOC_HEADER_BYTES, offset + entryLength);
				const name = tocName(nameBytes);
				if (!name.ok) return malformedEntry(name.error.message);
				const compressionFlag = bytes[offset + 16] ?? 0;
				if (compressionFlag !== 0 && compressionFlag !== 1) return malformedEntry(`CArchive compression flag ${String(compressionFlag)} is not stored or zlib`);
				const typeCode = bytes[offset + 17] ?? 0;
				if (typeCode < 32 || typeCode > 126) return malformedEntry("CArchive type code is not a printable character");
				entries.push({
					index: entries.length,
					tocRecordOffset: offset,
					tocRecordLength: entryLength,
					name: name.value,
					typeCode: String.fromCharCode(typeCode),
					offset: bytes.readUInt32BE(offset + 4),
					compressedSize: bytes.readUInt32BE(offset + 8),
					uncompressedSize: bytes.readUInt32BE(offset + 12),
					compressionFlag
				});
				offset += entryLength;
			}
			return ok(entries);
		};
		parseCookieAt = (tail, relative, cookieOffset, fileSize) => {
			const modern = parseCookie(tail, relative, cookieOffset, fileSize, "2.1");
			if (modern.ok) return modern;
			const legacy = parseCookie(tail, relative, cookieOffset, fileSize, "2.0");
			return legacy.ok ? legacy : modern;
		};
		parseCookie = (tail, relative, cookieOffset, fileSize, layout) => {
			const cookieBytes = layout === "2.1" ? 88 : 24;
			if (relative + cookieBytes > tail.length) return err(pyInstallerFailure("format", "CArchive cookie extends past the end of the file"));
			const view = tail.subarray(relative, relative + cookieBytes);
			const packageLength = view.readUInt32BE(8);
			const tocOffset = view.readUInt32BE(12);
			const tocLength = view.readUInt32BE(16);
			const pythonVersion = view.readUInt32BE(20);
			if (!safeSum(tocOffset, tocLength, cookieBytes) || packageLength !== tocOffset + tocLength + cookieBytes) return err(pyInstallerFailure("format", "CArchive cookie does not describe a table of contents inside the package"));
			const archiveStart = cookieOffset + cookieBytes - packageLength;
			if (archiveStart < 0 || archiveStart + packageLength > fileSize) return err(pyInstallerFailure("format", "CArchive cookie range is outside the file"));
			const library = layout === "2.1" ? libraryName(view.subarray(24, 88)) : ok(null);
			if (!library.ok) return library;
			return ok({
				layout,
				archiveStart,
				packageLength,
				tocOffset,
				tocLength,
				pythonVersion,
				pythonLibrary: library.value,
				cookieOffset
			});
		};
		libraryName = (bytes) => {
			const end = bytes.indexOf(0);
			const text = end < 0 ? bytes : bytes.subarray(0, end);
			if (end >= 0 && bytes.subarray(end).some((byte) => byte !== 0)) return err(pyInstallerFailure("format", "CArchive Python library name is not NUL-padded"));
			if (text.length === 0) return ok(null);
			try {
				return ok(new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(text));
			} catch {
				return err(pyInstallerFailure("format", "CArchive Python library name is not valid UTF-8"));
			}
		};
		tocName = (bytes) => {
			const end = bytes.indexOf(0);
			const text = end < 0 ? bytes : bytes.subarray(0, end);
			if (text.length === 0) return err(pyInstallerFailure("format", "CArchive entry name is empty"));
			try {
				return ok(new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(text));
			} catch {
				return err(pyInstallerFailure("format", "CArchive entry name is not valid UTF-8"));
			}
		};
		safeSum = (left, middle, right) => Number.isSafeInteger(left) && Number.isSafeInteger(middle) && Number.isSafeInteger(right) && left >= 0 && middle >= 0 && right >= 0 && left + middle + right <= Number.MAX_SAFE_INTEGER;
		validateCArchiveMembers = (entries, tocOffset) => {
			for (const entry of entries) {
				if (isCArchiveDeclaration(entry)) {
					if (entry.compressedSize !== 0 || entry.uncompressedSize !== 0 || entry.compressionFlag !== 0) return err(pyInstallerFailure("integrity", `CArchive declaration at table index ${String(entry.index)} has local payload or compression`));
				}
				if (entry.compressionFlag === 0 && entry.compressedSize !== entry.uncompressedSize) return err(pyInstallerFailure("integrity", `Stored CArchive member size disagrees with its table entry at table index ${String(entry.index)}`));
				if (entry.offset > tocOffset) return err(pyInstallerFailure("format", `CArchive member offset is outside the archive at table index ${String(entry.index)}`));
			}
			const ranges = entries.filter((entry) => entry.compressedSize > 0).map((entry) => ({
				index: entry.index,
				start: entry.offset,
				end: entry.offset + entry.compressedSize
			})).sort((left, right) => left.start - right.start);
			let occupied = 0;
			for (const range of ranges) {
				if (!Number.isSafeInteger(range.end) || range.end > tocOffset || range.start < occupied) return err(pyInstallerFailure("integrity", `CArchive member extends outside the archive or overlaps another member at table index ${String(range.index)}`));
				occupied = range.end;
			}
			return ok(null);
		};
	})))();
}

//#endregion
//#region dist/artifacts/nodeSea/NodeSeaBlob.js
var NODE_SEA_MAGIC, NODE_SEA_MAX_BLOB_BYTES, FLAG_DISABLE_EXPERIMENTAL_SEA_WARNING, FLAG_USE_SNAPSHOT, FLAG_USE_CODE_CACHE, FLAG_INCLUDE_ASSETS, FLAG_INCLUDE_EXEC_ARGV, KNOWN_FLAGS, MAX_ASSET_COUNT, MAX_ASSET_NAME_BYTES, MAX_EXEC_ARGV, MAX_EXEC_ARGV_TEXT_BYTES, NO_OVERRIDE, NODE_SEA_BAD_MAGIC, NODE_SEA_TRUNCATED, NODE_SEA_UNKNOWN_FLAGS, NODE_SEA_UNKNOWN_EXTENSION, NODE_SEA_TRAILING_BYTES, NODE_SEA_DUPLICATE_BLOB, NODE_SEA_ELF_DESCRIPTOR_TRUNCATED, NODE_SEA_ELF_TABLE_TRUNCATED, NODE_SEA_MACHO_COMMANDS_TRUNCATED, NODE_SEA_MACHO_SEGMENT_TRUNCATED, NODE_SEA_FUSE_ABSENT, NODE_SEA_FUSE_UNSET, NODE_SEA_FUSE_CONFLICT, NODE_SEA_EMPTY_CODE_PATH, NODE_SEA_INVALID_UTF8, NODE_SEA_ASSET_COUNT, NODE_SEA_ASSET_NAME_BYTES, NODE_SEA_EXEC_ARGV_COUNT, NODE_SEA_EXEC_ARGV_TEXT, NODE_SEA_BLOB_TOO_LARGE, nodeSeaAssetCollision, FUSE_PREFIX, limitFailure$1, formatFailure$3, decodeNodeSeaBlob, observeNodeSeaFuseMatches, extensionName, BlobCursor;
function init_NodeSeaBlob() {
	return (init_NodeSeaBlob = __esmMin((() => {
		init_ArtifactFileOperation();
		init_ArtifactReader();
		NODE_SEA_MAGIC = 21223968;
		NODE_SEA_MAX_BLOB_BYTES = 256 * 1024 * 1024;
		FLAG_DISABLE_EXPERIMENTAL_SEA_WARNING = 1 << 0;
		FLAG_USE_SNAPSHOT = 1 << 1;
		FLAG_USE_CODE_CACHE = 1 << 2;
		FLAG_INCLUDE_ASSETS = 1 << 3;
		FLAG_INCLUDE_EXEC_ARGV = 1 << 4;
		KNOWN_FLAGS = FLAG_DISABLE_EXPERIMENTAL_SEA_WARNING | FLAG_USE_SNAPSHOT | FLAG_USE_CODE_CACHE | FLAG_INCLUDE_ASSETS | FLAG_INCLUDE_EXEC_ARGV;
		MAX_ASSET_COUNT = 1e5;
		MAX_ASSET_NAME_BYTES = 8 * 1024 * 1024;
		MAX_EXEC_ARGV = 4096;
		MAX_EXEC_ARGV_TEXT_BYTES = 1024 * 1024;
		NO_OVERRIDE = "This release has no runtime override.";
		NODE_SEA_BAD_MAGIC = "Node SEA blob magic is not 0x143da20";
		NODE_SEA_TRUNCATED = "Node SEA blob is truncated";
		NODE_SEA_UNKNOWN_FLAGS = "Node SEA blob flags contain unknown bits";
		NODE_SEA_UNKNOWN_EXTENSION = "Node SEA exec argv extension is unknown";
		NODE_SEA_TRAILING_BYTES = "Node SEA blob has trailing bytes";
		NODE_SEA_DUPLICATE_BLOB = "Node SEA blob is declared more than once";
		NODE_SEA_ELF_DESCRIPTOR_TRUNCATED = "Node SEA ELF note descriptor is truncated";
		NODE_SEA_ELF_TABLE_TRUNCATED = "Node SEA ELF note table is truncated";
		NODE_SEA_MACHO_COMMANDS_TRUNCATED = "Node SEA Mach-O load commands are truncated";
		NODE_SEA_MACHO_SEGMENT_TRUNCATED = "Node SEA Mach-O segment table is truncated";
		NODE_SEA_FUSE_ABSENT = "Node SEA blob is present but no NODE_SEA_FUSE sentinel was observed";
		NODE_SEA_FUSE_UNSET = "Node SEA blob is present but the NODE_SEA_FUSE sentinel is unset";
		NODE_SEA_FUSE_CONFLICT = "Node SEA fuse sentinels disagree";
		NODE_SEA_EMPTY_CODE_PATH = "Node SEA code path is empty";
		NODE_SEA_INVALID_UTF8 = "Node SEA string is not valid UTF-8";
		NODE_SEA_ASSET_COUNT = `Node SEA asset count exceeds the ${String(MAX_ASSET_COUNT)}-asset bound. ${NO_OVERRIDE}`;
		NODE_SEA_ASSET_NAME_BYTES = `Node SEA asset names exceed the ${String(MAX_ASSET_NAME_BYTES)}-byte name budget. ${NO_OVERRIDE}`;
		NODE_SEA_EXEC_ARGV_COUNT = `Node SEA exec argv count exceeds the ${String(MAX_EXEC_ARGV)}-argument bound. ${NO_OVERRIDE}`;
		NODE_SEA_EXEC_ARGV_TEXT = `Node SEA exec argv text exceeds the ${String(MAX_EXEC_ARGV_TEXT_BYTES)}-byte bound. ${NO_OVERRIDE}`;
		NODE_SEA_BLOB_TOO_LARGE = `Node SEA blob exceeds the ${String(NODE_SEA_MAX_BLOB_BYTES)}-byte in-memory bound`;
		nodeSeaAssetCollision = (name) => `Node SEA asset name collides: ${name}`;
		FUSE_PREFIX = "NODE_SEA_FUSE_";
		limitFailure$1 = (message, boundary) => new ArtifactReaderFailure("limit", message, { boundary });
		formatFailure$3 = (message, cause) => new ArtifactReaderFailure("format", message, cause === undefined ? undefined : { cause });
		decodeNodeSeaBlob = async (bytes, signal) => {
			assertArtifactReadActive(signal);
			const cursor = new BlobCursor(bytes);
			if (cursor.remaining < 4) throw formatFailure$3(NODE_SEA_TRUNCATED);
			const magic = cursor.u32();
			if (magic !== 21223968) throw formatFailure$3(NODE_SEA_BAD_MAGIC);
			if (cursor.remaining < 5) throw formatFailure$3(NODE_SEA_TRUNCATED);
			const flags = cursor.u32();
			if ((flags & ~KNOWN_FLAGS) !== 0) throw formatFailure$3(NODE_SEA_UNKNOWN_FLAGS);
			const execArgvExtension = extensionName(cursor.u8());
			const codePath = cursor.text(false, NODE_SEA_EMPTY_CODE_PATH);
			const useSnapshot = (flags & FLAG_USE_SNAPSHOT) !== 0;
			const body = cursor.byteRange();
			const useCodeCache = (flags & FLAG_USE_CODE_CACHE) !== 0;
			const codeCache = useCodeCache ? cursor.byteRange() : null;
			const includeAssets = (flags & FLAG_INCLUDE_ASSETS) !== 0;
			const assets = includeAssets ? await cursor.assets(signal) : [];
			const includeExecArgv = (flags & FLAG_INCLUDE_EXEC_ARGV) !== 0;
			const execArgv = includeExecArgv ? await cursor.execArgv(signal) : [];
			if (await cursor.hasNonZeroTail(signal)) throw formatFailure$3(NODE_SEA_TRAILING_BYTES);
			return {
				magic: NODE_SEA_MAGIC,
				flags,
				disableExperimentalSeaWarning: (flags & FLAG_DISABLE_EXPERIMENTAL_SEA_WARNING) !== 0,
				useSnapshot,
				useCodeCache,
				includeAssets,
				includeExecArgv,
				execArgvExtension,
				codePath,
				mainScript: useSnapshot ? null : body,
				snapshot: useSnapshot ? body : null,
				codeCache,
				assets,
				execArgv
			};
		};
		observeNodeSeaFuseMatches = (matches) => {
			const unique = [...new Set(matches)];
			if (unique.length === 0) return {
				fuseState: "absent",
				fuseSentinel: null,
				fuseContradiction: NODE_SEA_FUSE_ABSENT
			};
			const hashes = new Set(unique.map((item) => item.slice(FUSE_PREFIX.length, FUSE_PREFIX.length + 32)));
			const digits = new Set(unique.map((item) => item.at(-1)));
			if (hashes.size !== 1 || digits.size !== 1) return {
				fuseState: "conflicting",
				fuseSentinel: null,
				fuseContradiction: NODE_SEA_FUSE_CONFLICT
			};
			const sentinel = unique[0];
			if (sentinel === undefined) throw formatFailure$3(NODE_SEA_FUSE_CONFLICT);
			if (digits.has("1")) return {
				fuseState: "set",
				fuseSentinel: sentinel,
				fuseContradiction: null
			};
			return {
				fuseState: "unset",
				fuseSentinel: sentinel,
				fuseContradiction: NODE_SEA_FUSE_UNSET
			};
		};
		extensionName = (value) => {
			if (value === 0) return "none";
			if (value === 1) return "env";
			if (value === 2) return "cli";
			throw formatFailure$3(NODE_SEA_UNKNOWN_EXTENSION);
		};
		BlobCursor = class {
			bytes;
			#offset = 0;
			constructor(bytes) {
				this.bytes = bytes;
			}
			get remaining() {
				return this.bytes.length - this.#offset;
			}
			u32() {
				return this.#demand(4).readUInt32LE(0);
			}
			u8() {
				return this.#demand(1).readUInt8(0);
			}
			/** `charge` sees the raw byte length before decoding allocates a string. */
			text(allowEmpty, emptyMessage, charge) {
				const length = this.#size();
				charge?.(length);
				const raw = this.#demand(length);
				let text;
				try {
					text = new TextDecoder("utf-8", {
						fatal: true,
						ignoreBOM: true
					}).decode(raw);
				} catch (cause) {
					throw formatFailure$3(NODE_SEA_INVALID_UTF8, cause);
				}
				if (!allowEmpty && text.length === 0) throw formatFailure$3(emptyMessage);
				return text;
			}
			byteRange() {
				const length = this.#size();
				const offset = this.#offset;
				this.#offset += length;
				return {
					offset,
					length
				};
			}
			async assets(signal) {
				const count = this.#count(MAX_ASSET_COUNT, NODE_SEA_ASSET_COUNT);
				if (count * 16 > this.remaining) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const seen = new Set();
				const assets = [];
				let nameBytes = 0;
				const charge = (bytes) => {
					nameBytes += bytes;
					if (nameBytes > MAX_ASSET_NAME_BYTES) throw limitFailure$1(NODE_SEA_ASSET_NAME_BYTES, "memory");
				};
				for (let index = 0; index < count; index += 1) {
					if (index % 256 === 0) {
						await setImmediate();
						assertArtifactReadActive(signal);
					}
					const name = this.text(true, NODE_SEA_INVALID_UTF8, charge);
					if (seen.has(name)) throw formatFailure$3(nodeSeaAssetCollision(name));
					seen.add(name);
					assets.push({
						name,
						range: this.byteRange()
					});
				}
				return assets;
			}
			async execArgv(signal) {
				const count = this.#count(MAX_EXEC_ARGV, NODE_SEA_EXEC_ARGV_COUNT);
				if (count * 8 > this.remaining) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const values = [];
				let textBytes = 0;
				const charge = (bytes) => {
					textBytes += bytes;
					if (textBytes > MAX_EXEC_ARGV_TEXT_BYTES) throw limitFailure$1(NODE_SEA_EXEC_ARGV_TEXT, "memory");
				};
				for (let index = 0; index < count; index += 1) {
					if (index % 256 === 0) {
						await setImmediate();
						assertArtifactReadActive(signal);
					}
					values.push(this.text(true, NODE_SEA_INVALID_UTF8, charge));
				}
				return values;
			}
			async hasNonZeroTail(signal) {
				for (let start = this.#offset; start < this.bytes.length; start += 64 * 1024) {
					await setImmediate();
					assertArtifactReadActive(signal);
					const end = Math.min(start + 64 * 1024, this.bytes.length);
					for (let index = start; index < end; index += 1) if (this.bytes[index] !== 0) return true;
				}
				assertArtifactReadActive(signal);
				return false;
			}
			#size() {
				if (this.remaining < 8) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const value = this.#demand(8).readBigUInt64LE(0);
				if (value > BigInt(Number.MAX_SAFE_INTEGER) || value > BigInt(this.remaining)) throw formatFailure$3(NODE_SEA_TRUNCATED);
				return Number(value);
			}
			#count(limit, message) {
				if (this.remaining < 8) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const value = this.#demand(8).readBigUInt64LE(0);
				if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const count = Number(value);
				if (count > limit) throw limitFailure$1(message, "capacity");
				return count;
			}
			#demand(length) {
				if (length > this.remaining) throw formatFailure$3(NODE_SEA_TRUNCATED);
				const start = this.#offset;
				this.#offset += length;
				return this.bytes.subarray(start, this.#offset);
			}
		};
	})))();
}

//#endregion
//#region dist/artifacts/nodeSea/NodeSeaLocation.js
var LC_SEGMENT, LC_SEGMENT_64, PT_NOTE, SHT_NOTE, RT_RCDATA, RESOURCE_NAME, SEA_SECTION, MAX_COMMAND_BYTES, MAX_ELF_HEADERS, MAX_NOTE_NAME_BYTES, FUSE_LENGTH, PE_HEADER_PROBE_BYTES, THIN_MAGICS, FAT_MAGICS, formatFailure$2, limitFailure, locateNodeSea, readNodeSeaBlob, scanNodeSeaFuse, collapseRanges, locateFatMachO, locateThinMachO, locateElfNotes, readElfTables, scanElfNoteTable, failNoteTable, locatePeResources, digestRange, readExact, cString, readU16, readU32, readU64;
function init_NodeSeaLocation() {
	return (init_NodeSeaLocation = __esmMin((() => {
		init_PeResourceParser();
		init_PeResourceLayout();
		init_peResources();
		init_ArtifactHash();
		init_ArtifactReader();
		init_machoContainer();
		init_elfFixedHeader();
		init_elfNoteLayout();
		init_NodeSeaBlob();
		LC_SEGMENT = 1;
		LC_SEGMENT_64 = 25;
		PT_NOTE = 4;
		SHT_NOTE = 7;
		RT_RCDATA = 10;
		RESOURCE_NAME = "NODE_SEA_BLOB";
		SEA_SECTION = "__NODE_SEA_BLOB";
		MAX_COMMAND_BYTES = 8 * 1024 * 1024;
		MAX_ELF_HEADERS = 4096;
		MAX_NOTE_NAME_BYTES = 4096;
		FUSE_LENGTH = "NODE_SEA_FUSE_".length + 32 + 2;
		PE_HEADER_PROBE_BYTES = 64 * 1024;
		THIN_MAGICS = new Set([
			4277009102,
			4277009103,
			3472551422,
			3489328638
		]);
		FAT_MAGICS = new Set([
			3405691582,
			3405691583,
			3199925962,
			3216703178
		]);
		formatFailure$2 = (message) => new ArtifactReaderFailure("format", message);
		limitFailure = (message) => new ArtifactReaderFailure("limit", message, { boundary: "memory" });
		locateNodeSea = async (handle, fileSize, signal) => {
			if (!Number.isSafeInteger(fileSize) || fileSize < 4) return undefined;
			const carrier = {
				handle,
				fileSize,
				signal
			};
			const prefix = await readExact(carrier, 0, Math.min(fileSize, 64));
			if (prefix === undefined || prefix.length < 4) return undefined;
			const magic = prefix.readUInt32BE(0);
			if (THIN_MAGICS.has(magic) || FAT_MAGICS.has(magic)) {
				const ranges = THIN_MAGICS.has(magic) ? await locateThinMachO(carrier, 0, fileSize) : await locateFatMachO(carrier, prefix);
				return collapseRanges(carrier, "mach-o", ranges);
			}
			if (prefix.subarray(0, 4).equals(Buffer.from([
				127,
				69,
				76,
				70
			]))) return collapseRanges(carrier, "elf", await locateElfNotes(carrier, prefix));
			if (prefix[0] === 77 && prefix[1] === 90) return collapseRanges(carrier, "pe", await locatePeResources(carrier));
			return undefined;
		};
		readNodeSeaBlob = async (handle, location, fileSize, signal) => {
			if (location.blobLength > 268435456) throw limitFailure(NODE_SEA_BLOB_TOO_LARGE);
			const bytes = await readExact({
				handle,
				fileSize,
				signal
			}, location.blobOffset, location.blobLength);
			if (bytes === undefined) throw formatFailure$2(NODE_SEA_TRUNCATED);
			return bytes;
		};
		scanNodeSeaFuse = async (handle, fileSize, signal) => {
			const carrier = {
				handle,
				fileSize,
				signal
			};
			const matches = new Set();
			const overlap = FUSE_LENGTH - 1;
			let carry = Buffer.alloc(0);
			let position = 0;
			while (position < fileSize) {
				const length = Math.min(64 * 1024, fileSize - position);
				const chunk = await readExact(carrier, position, length);
				if (chunk === undefined) throw new ArtifactReaderFailure("integrity", "Node SEA carrier shrank during the fuse scan");
				const window = carry.length === 0 ? chunk : Buffer.concat([carry, chunk]);
				for (const match of window.toString("latin1").matchAll(/NODE_SEA_FUSE_[0-9a-f]{32}:[01]/gu)) if (match[0] !== undefined) {
					matches.add(match[0]);
					if (matches.size > 1) return observeNodeSeaFuseMatches([...matches]);
				}
				carry = window.subarray(Math.max(0, window.length - overlap));
				position += length;
			}
			return observeNodeSeaFuseMatches([...matches]);
		};
		collapseRanges = async (carrier, kind, ranges) => {
			const unique = [];
			const seen = new Set();
			for (const range of ranges) {
				const key = `${String(range.offset)}:${String(range.length)}`;
				if (seen.has(key)) continue;
				seen.add(key);
				unique.push(range);
			}
			const chosen = unique[0];
			if (chosen === undefined) return undefined;
			if (unique.length > 1) {
				const hashes = new Set();
				for (const range of unique) hashes.add(await digestRange(carrier, range.offset, range.length));
				if (hashes.size !== 1) throw formatFailure$2(NODE_SEA_DUPLICATE_BLOB);
			}
			return {
				carrier: kind,
				blobOffset: chosen.offset,
				blobLength: chosen.length
			};
		};
		locateFatMachO = async (carrier, prefix) => {
			let bytes = prefix;
			let header = readFatContainerHeader(bytes, carrier.fileSize);
			if (header.state === "needs-data") {
				const required = await readExact(carrier, 0, Math.min(carrier.fileSize, header.requiredBytes));
				if (required === undefined || required.length < header.requiredBytes) return [];
				bytes = required;
				header = readFatContainerHeader(bytes, carrier.fileSize);
			}
			if (header.state !== "parsed") {
				if (bytes.length >= 4 && THIN_MAGICS.has(bytes.readUInt32BE(0))) return locateThinMachO(carrier, 0, carrier.fileSize);
				return [];
			}
			const found = [];
			for (const [index, slice] of header.slices.entries()) {
				if (slice === undefined || header.rangeIssues[index] != null) continue;
				found.push(...await locateThinMachO(carrier, slice.offset, slice.size));
			}
			return found;
		};
		locateThinMachO = async (carrier, base, sliceSize) => {
			if (!Number.isSafeInteger(base) || !Number.isSafeInteger(sliceSize) || base < 0 || sliceSize < 32 || base > carrier.fileSize || sliceSize > carrier.fileSize - base) return [];
			const header = await readExact(carrier, base, 32);
			if (header === undefined || header.length < 28) return [];
			const magic = header.readUInt32BE(0);
			if (!THIN_MAGICS.has(magic)) return [];
			const little = magic === 3472551422 || magic === 3489328638;
			const wide = magic === 4277009103 || magic === 3489328638;
			const headerSize = wide ? 32 : 28;
			if (header.length < headerSize) return [];
			const ncmds = readU32(header, 16, little);
			const sizeofcmds = readU32(header, 20, little);
			if (sizeofcmds > MAX_COMMAND_BYTES || headerSize > sliceSize || sizeofcmds > sliceSize - headerSize) return [];
			const commands = await readExact(carrier, base + headerSize, sizeofcmds);
			if (commands === undefined) return [];
			const found = [];
			let offset = 0;
			let seen = 0;
			while (offset + 8 <= commands.length && seen < ncmds) {
				abortIfNeeded(carrier.signal);
				const cmd = readU32(commands, offset, little);
				const cmdsize = readU32(commands, offset + 4, little);
				if (cmdsize < 8 || offset + cmdsize > commands.length) {
					if (found.length > 0) throw formatFailure$2(NODE_SEA_MACHO_COMMANDS_TRUNCATED);
					return found;
				}
				if (cmd === LC_SEGMENT || cmd === LC_SEGMENT_64) {
					const segment64 = cmd === LC_SEGMENT_64;
					const segmentHeader = segment64 ? 72 : 56;
					const sectionSize = segment64 ? 80 : 68;
					const name = cString(commands, offset + 8, 16);
					if ((name === "NODE_SEA" || name === "__NODE_SEA") && cmdsize >= segmentHeader) {
						const nsects = readU32(commands, offset + (segment64 ? 64 : 48), little);
						const table = offset + segmentHeader;
						if (nsects > Math.floor((cmdsize - segmentHeader) / sectionSize) || table + nsects * sectionSize > offset + cmdsize) throw formatFailure$2(NODE_SEA_MACHO_SEGMENT_TRUNCATED);
						for (let index = 0; index < nsects; index += 1) {
							const section = table + index * sectionSize;
							if (cString(commands, section, 16) !== SEA_SECTION) continue;
							const length = segment64 ? readU64(commands, section + 40, little) : readU32(commands, section + 36, little);
							const fileOffset = readU32(commands, section + (segment64 ? 48 : 40), little);
							if (length === undefined) throw limitFailure(NODE_SEA_BLOB_TOO_LARGE);
							if (length > 268435456) throw limitFailure(NODE_SEA_BLOB_TOO_LARGE);
							if (fileOffset > sliceSize || length > sliceSize - fileOffset) throw formatFailure$2(NODE_SEA_TRUNCATED);
							found.push({
								offset: base + fileOffset,
								length
							});
						}
					}
				}
				offset += cmdsize;
				seen += 1;
			}
			if (found.length > 0 && (seen !== ncmds || offset !== commands.length)) throw formatFailure$2(NODE_SEA_MACHO_COMMANDS_TRUNCATED);
			return found;
		};
		locateElfNotes = async (carrier, prefix) => {
			const header = readElfFixedHeader(prefix, carrier.fileSize);
			if (!header.ok) return [];
			const little = header.value.byteOrder === "little";
			const elf64 = header.value.elfClass === 64;
			const fields = await readExact(carrier, 0, Math.min(carrier.fileSize, header.value.headerSize));
			if (fields === undefined) return [];
			const phoff = elf64 ? readU64(fields, 32, little) : readU32(fields, 28, little);
			const shoff = elf64 ? readU64(fields, 40, little) : readU32(fields, 32, little);
			const phentsize = readU16(fields, elf64 ? 54 : 42, little);
			const phnum = readU16(fields, elf64 ? 56 : 44, little);
			const shentsize = readU16(fields, elf64 ? 58 : 46, little);
			const shnum = readU16(fields, elf64 ? 60 : 48, little);
			const minimumProgram = elf64 ? 56 : 32;
			const minimumSection = elf64 ? 64 : 40;
			const found = [];
			let opaque = false;
			const programs = await readElfTables(carrier, {
				offset: phoff,
				count: phnum,
				entrySize: phentsize,
				minimumEntry: minimumProgram
			});
			if (programs === undefined) opaque = phnum > 0;
			else for (const entry of programs) {
				if (readU32(entry, 0, little) !== PT_NOTE) continue;
				const note = elf64 ? {
					offset: readU64(entry, 8, little),
					length: readU64(entry, 32, little),
					align: readU64(entry, 48, little)
				} : {
					offset: readU32(entry, 4, little),
					length: readU32(entry, 16, little),
					align: readU32(entry, 28, little)
				};
				const scanned = await scanElfNoteTable(carrier, note, little, found.length > 0);
				if (scanned === undefined) opaque = true;
				else found.push(...scanned);
			}
			if (programs !== undefined && phnum > 0) {
				if (found.length > 0 && opaque) throw formatFailure$2(NODE_SEA_ELF_TABLE_TRUNCATED);
				return found;
			}
			const sections = await readElfTables(carrier, {
				offset: shoff,
				count: shnum,
				entrySize: shentsize,
				minimumEntry: minimumSection
			});
			if (sections === undefined) opaque = opaque || shnum > 0;
			else for (const entry of sections) {
				if (readU32(entry, 4, little) !== SHT_NOTE) continue;
				const note = elf64 ? {
					offset: readU64(entry, 24, little),
					length: readU64(entry, 32, little),
					align: readU64(entry, 48, little)
				} : {
					offset: readU32(entry, 16, little),
					length: readU32(entry, 20, little),
					align: readU32(entry, 32, little)
				};
				const scanned = await scanElfNoteTable(carrier, note, little, found.length > 0);
				if (scanned === undefined) opaque = true;
				else found.push(...scanned);
			}
			if (found.length > 0 && opaque) throw formatFailure$2(NODE_SEA_ELF_TABLE_TRUNCATED);
			return found;
		};
		readElfTables = async (carrier, table) => {
			if (table.count === 0) return [];
			if (table.offset === undefined || table.count > MAX_ELF_HEADERS || table.entrySize < table.minimumEntry || table.entrySize > 1024 || table.offset > carrier.fileSize) return undefined;
			const entries = [];
			for (let index = 0; index < table.count; index += 1) {
				if (index % 128 === 0) abortIfNeeded(carrier.signal);
				const offset = table.offset + index * table.entrySize;
				if (offset > carrier.fileSize || table.entrySize > carrier.fileSize - offset) return undefined;
				const entry = await readExact(carrier, offset, table.entrySize);
				if (entry === undefined) return undefined;
				entries.push(entry);
			}
			return entries;
		};
		scanElfNoteTable = async (carrier, note, little, alreadyFound) => {
			if (note.offset === undefined || note.length === undefined || note.offset > carrier.fileSize || note.length > carrier.fileSize - note.offset) return undefined;
			const alignment = elfNoteAlignment(note.align === 8 ? 8 : 4);
			const found = [];
			let cursor = 0;
			while (cursor + 12 <= note.length) {
				abortIfNeeded(carrier.signal);
				const header = await readExact(carrier, note.offset + cursor, 12);
				if (header === undefined) return failNoteTable(alreadyFound || found.length > 0);
				const namesz = readU32(header, 0, little);
				const descsz = readU32(header, 4, little);
				if (namesz > MAX_NOTE_NAME_BYTES) return failNoteTable(alreadyFound || found.length > 0);
				if (cursor > note.length - 12 || namesz > note.length - cursor - 12) return failNoteTable(alreadyFound || found.length > 0);
				let layout;
				try {
					layout = elfNoteLayout(namesz, descsz, alignment);
				} catch {
					return failNoteTable(alreadyFound || found.length > 0);
				}
				if (!Number.isSafeInteger(layout.descriptor) || !Number.isSafeInteger(layout.next) || layout.next < 12) return failNoteTable(alreadyFound || found.length > 0);
				const name = await readExact(carrier, note.offset + cursor + 12, namesz);
				if (name === undefined) return failNoteTable(alreadyFound || found.length > 0);
				const owner = cString(name, 0, name.length);
				const descriptorFits = layout.descriptor <= note.length - cursor && descsz <= note.length - cursor - layout.descriptor;
				if (owner === RESOURCE_NAME) {
					if (!descriptorFits) throw formatFailure$2(NODE_SEA_ELF_DESCRIPTOR_TRUNCATED);
					if (descsz > 268435456) throw limitFailure(NODE_SEA_BLOB_TOO_LARGE);
					const blobOffset = note.offset + cursor + layout.descriptor;
					if (blobOffset > carrier.fileSize || descsz > carrier.fileSize - blobOffset) throw formatFailure$2(NODE_SEA_ELF_DESCRIPTOR_TRUNCATED);
					found.push({
						offset: blobOffset,
						length: descsz
					});
				}
				if (layout.next > note.length - cursor) return failNoteTable(alreadyFound || found.length > 0 || owner === RESOURCE_NAME);
				cursor += layout.next;
			}
			return found;
		};
		failNoteTable = (confirmed) => {
			if (confirmed) throw formatFailure$2(NODE_SEA_ELF_TABLE_TRUNCATED);
			return undefined;
		};
		locatePeResources = async (carrier) => {
			const headers = await readExact(carrier, 0, Math.min(carrier.fileSize, PE_HEADER_PROBE_BYTES));
			if (headers === undefined || !await hasPeResourceName(headers, carrier.fileSize, (offset, length) => readExact(carrier, offset, length), RT_RCDATA, RESOURCE_NAME, 65536)) return [];
			if (carrier.fileSize > 536870912) {
				throw limitFailure("Node SEA PE inspection exceeds the 512 MiB PE parser input ceiling");
			}
			const bytes = await readExact(carrier, 0, carrier.fileSize);
			if (bytes === undefined) throw formatFailure$2(NODE_SEA_TRUNCATED);
			try {
				readPeResourceLayout(bytes);
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure && cause.reason === "format") return [];
				throw cause;
			}
			const resources = await parsePeResources(bytes, {
				path: "<admitted SEA carrier>",
				sha256: createHash("sha256").update(bytes).digest("hex"),
				bytes: bytes.length
			}, {
				path: "/admitted-sea-carrier",
				max_file_bytes: MAX_INSPECT_PE_FILE_BYTES,
				max_entries: MAX_INSPECT_PE_DIRECTORY_ENTRIES
			}, carrier.signal);
			return resources.resources.flatMap((resource) => {
				if (resource.type.kind !== "id" || resource.type.id !== RT_RCDATA || resource.name.kind !== "name" || resource.name.name !== RESOURCE_NAME) return [];
				const range = resource.payload.location;
				if (range.bytes > 268435456) throw limitFailure(NODE_SEA_BLOB_TOO_LARGE);
				return [{
					offset: range.offset,
					length: range.bytes
				}];
			});
		};
		digestRange = async (carrier, offset, length) => {
			const hash = createHash("sha256");
			let remaining = length;
			let position = offset;
			while (remaining > 0) {
				const chunkLength = Math.min(64 * 1024, remaining);
				const chunk = await readExact(carrier, position, chunkLength);
				if (chunk === undefined) throw formatFailure$2(NODE_SEA_TRUNCATED);
				hash.update(chunk);
				position += chunkLength;
				remaining -= chunkLength;
			}
			return hash.digest("hex");
		};
		readExact = async (carrier, offset, length) => {
			abortIfNeeded(carrier.signal);
			if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > carrier.fileSize || length > carrier.fileSize - offset) return undefined;
			if (length === 0) return Buffer.alloc(0);
			const bytes = Buffer.alloc(length);
			let filled = 0;
			while (filled < length) {
				abortIfNeeded(carrier.signal);
				const read = await carrier.handle.read(bytes, filled, length - filled, offset + filled);
				abortIfNeeded(carrier.signal);
				if (read.bytesRead === 0) return undefined;
				filled += read.bytesRead;
			}
			return bytes;
		};
		cString = (bytes, offset, length) => {
			let end = offset;
			const limit = Math.min(bytes.length, offset + length);
			while (end < limit && bytes[end] !== 0) end += 1;
			return bytes.toString("latin1", offset, end);
		};
		readU16 = (bytes, offset, little) => little ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
		readU32 = (bytes, offset, little) => little ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
		readU64 = (bytes, offset, little) => {
			if (offset < 0 || offset > bytes.length - 8) return undefined;
			const value = little ? bytes.readBigUInt64LE(offset) : bytes.readBigUInt64BE(offset);
			if (value > BigInt(Number.MAX_SAFE_INTEGER)) return undefined;
			return Number(value);
		};
	})))();
}

//#endregion
//#region dist/artifacts/inventory/hashStableRootArtifact.js
var openRootArtifact, hashStableRootArtifact, hashStableRootArtifactHandle;
function init_hashStableRootArtifact() {
	return (init_hashStableRootArtifact = __esmMin((() => {
		init_OwnedRegularFile();
		init_readArtifactFileChunks();
		init_OwnedFileHandle();
		init_ArtifactReader();
		init_RegularFile();
		init_ArtifactHash();
		openRootArtifact = async (path, resourceScope, signal) => {
			try {
				const source = await openRegularFile(path, {
					symlinks: "reject",
					signal
				});
				return {
					...source,
					owner: new OwnedFileHandle(source.handle)
				};
			} catch (cause) {
				const primary = cause instanceof RegularFileAdmissionFailure ? cause.cause : cause;
				const cancellation = regularFileCancellation(primary);
				const failure = cancellation !== undefined ? new ArtifactReaderFailure("cancelled", "Artifact admission cancelled", { cause: cancellation.reason }) : primary instanceof NonRegularFileReadError ? new ArtifactReaderFailure("format", `Artifact root is not a regular file: ${path}`, { cause: primary }) : primary;
				if (cause instanceof RegularFileAdmissionFailure) {
					const resource = `root artifact descriptor for ${path}`;
					const cleanup = await resourceScope.release({
						kind: "file-handle",
						resource,
						handle: cause.owner
					});
					if (cleanup.kind === "failed") throw resourceScope.cleanupFailure({
						kind: "failed",
						cause: failure
					}, [cleanup]);
				}
				throw failure;
			}
		};
		hashStableRootArtifact = async (path, resourceScope, signal) => {
			const { handle, initial, owner } = await openRootArtifact(path, resourceScope, signal);
			let outcome;
			try {
				outcome = {
					kind: "completed",
					value: await hashStableRootArtifactHandle(path, handle, initial, signal)
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
			}
			const resource = `root artifact descriptor for ${path}`;
			const cleanup = await resourceScope.release({
				kind: "file-handle",
				resource,
				handle: owner
			});
			if (cleanup.kind === "failed") throw resourceScope.cleanupFailure(outcome, [cleanup]);
			if (outcome.kind === "failed") throw outcome.cause;
			return outcome.value;
		};
		hashStableRootArtifactHandle = async (path, handle, initial, signal) => {
			const digest = await hashReadable(readArtifactFileChunks(handle, {
				start: 0,
				end: initial.size,
				signal
			}), signal);
			abortIfNeeded(signal);
			const [opened, currentPath] = await Promise.all([handle.stat(), lstat(path)]);
			if (!sameRegularFileState(initial, opened) || !sameRegularFileState(initial, currentPath) || digest.bytes !== initial.size) throw new ArtifactReaderFailure("integrity", `Root artifact changed during inventory: ${path}`);
			abortIfNeeded(signal);
			return digest;
		};
	})))();
}

//#endregion
//#region dist/artifacts/inventory/classify.js
var classifyAndHashRootForInventory, classifyRootFormat, readRootFatSliceHeaders, readRootMzWindowsHeaderSignature, hasKolyTrailer;
function init_classify() {
	return (init_classify = __esmMin((() => {
		init_GodotPckLocation();
		init_RegularFile();
		init_CArchiveLayout();
		init_NodeSeaBlob();
		init_NodeSeaLocation();
		init_ArtifactGraphConstruction();
		init_ArtifactHash();
		init_binaryTarget();
		init_ArtifactClassificationProbe();
		init_zipPackageFormat();
		init_ArtifactReader();
		init_hashStableRootArtifact();
		init_machoContainer();
		init_dosMz();
		classifyAndHashRootForInventory = async (path, directory, expectedMetadata, options) => {
			if (directory) return {
				format: "directory",
				digest: null,
				rootSource: undefined
			};
			const source = await openRootArtifact(path, options.resourceScope, options.signal);
			const { handle, initial } = source;
			const owner = {
				kind: "file-handle",
				handle: source.owner,
				resource: `root artifact descriptor for ${path}`
			};
			let outcome;
			try {
				if (!sameRegularFileState(expectedMetadata, initial)) throw new ArtifactReaderFailure("integrity", `Root artifact changed before inventory: ${path}`);
				const format = await classifyRootFormat(path, handle, options.signal, options.asarHeaderAdmission);
				const digest = await hashStableRootArtifactHandle(path, handle, initial, options.signal);
				const retainSource = isZipPackageFormat(format) || format === "mach-o-universal" || format === "godot-pck" || format === "pyinstaller" || format === "node-sea";
				outcome = {
					kind: "completed",
					value: {
						format,
						digest,
						rootSource: retainSource ? source : undefined
					}
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
			}
			if (outcome.kind === "failed" || outcome.value.rootSource === undefined) {
				const cleanupAttempt = await options.resourceScope.release(owner);
				if (cleanupAttempt.kind === "failed") throw options.resourceScope.cleanupFailure(outcome, [cleanupAttempt]);
			}
			if (outcome.kind === "failed") throw outcome.cause;
			return outcome.value;
		};
		classifyRootFormat = async (path, handle, signal, asarHeaderAdmission) => {
			const probe = createArtifactClassificationProbe(asarHeaderAdmission);
			const chunk = Buffer.alloc(64 * 1024);
			while (probe.length < probe.limit) {
				abortIfNeeded(signal);
				const read = await handle.read(chunk, 0, Math.min(chunk.length, probe.limit - probe.length), probe.length);
				abortIfNeeded(signal);
				if (read.bytesRead === 0) break;
				probe.write(chunk.subarray(0, read.bytesRead));
			}
			const archiveBytes = (await handle.stat()).size;
			const evidence = probe.finish(archiveBytes);
			abortIfNeeded(signal);
			const lower = path.toLowerCase();
			if (hasZipSignature(evidence.prefix)) return zipRootPackageFormat(lower);
			if (lower.endsWith(".pkg") && evidence.prefix.subarray(0, 4).equals(Buffer.from("xar!"))) return "pkg";
			if (lower.endsWith(".dmg") && await hasKolyTrailer(handle, archiveBytes, signal)) return "dmg";
			if (await locateGodotPck(handle, archiveBytes, signal, evidence.prefix)) return "godot-pck";
			const fatEvidence = await readRootFatSliceHeaders(handle, evidence, signal);
			const mzWindowsHeaderSignature = await readRootMzWindowsHeaderSignature(handle, fatEvidence, archiveBytes, signal);
			const classificationEvidence = mzWindowsHeaderSignature === undefined ? fatEvidence : {
				...fatEvidence,
				mzWindowsHeaderSignature
			};
			const format = classifyArtifactContent(path, classificationEvidence, archiveBytes).format;
			if ((format === "file" || format === "unknown") && !claimsExecutableHeader(evidence.prefix, archiveBytes) && await locateTrailingZipArchive(archiveBytes, async (position, length) => {
				abortIfNeeded(signal);
				const bytes = Buffer.alloc(length);
				const read = await handle.read(bytes, 0, length, position);
				abortIfNeeded(signal);
				return bytes.subarray(0, read.bytesRead);
			}) !== undefined) return zipRootPackageFormat(lower);
			if ([
				"elf",
				"pe",
				"mach-o",
				"mach-o-universal"
			].includes(format)) {
				const sea = await locateNodeSea(handle, archiveBytes, signal);
				abortIfNeeded(signal);
				if (sea !== undefined) {
					await decodeNodeSeaBlob(await readNodeSeaBlob(handle, sea, archiveBytes, signal), signal);
					return "node-sea";
				}
				const packaged = await containsPyInstallerArchive(handle, archiveBytes, signal);
				abortIfNeeded(signal);
				if (packaged) return "pyinstaller";
			}
			return format;
		};
		readRootFatSliceHeaders = async (handle, evidence, signal) => {
			const existing = evidence.fatSliceHeaders;
			if (existing === undefined) return evidence;
			const { header } = existing;
			const sliceHeadersByOffset = new Map(existing.sliceHeadersByOffset);
			for (let index = 0; index < header.slices.length; index += 1) {
				const slice = header.slices[index];
				const observed = slice === undefined ? undefined : sliceHeadersByOffset.get(slice.offset);
				if (slice === undefined || header.rangeIssues[index] !== null || slice.size < 4 || observed !== undefined && observed.magic !== null) continue;
				const headerLength = Math.min(12, slice.size);
				const thinHeader = Buffer.alloc(headerLength);
				let bytesRead = 0;
				while (bytesRead < thinHeader.length) {
					abortIfNeeded(signal);
					const read = await handle.read(thinHeader, bytesRead, thinHeader.length - bytesRead, slice.offset + bytesRead);
					abortIfNeeded(signal);
					if (read.bytesRead === 0) break;
					bytesRead += read.bytesRead;
				}
				sliceHeadersByOffset.set(slice.offset, readMachoHeaderPrefixFacts(thinHeader.subarray(0, bytesRead)));
			}
			return {
				...evidence,
				fatSliceHeaders: {
					header,
					sliceHeadersByOffset
				}
			};
		};
		readRootMzWindowsHeaderSignature = async (handle, evidence, fileSize, signal) => {
			const observation = observeMzWindowsHeader(evidence.prefix, fileSize);
			if (observation.state !== "signature-needed") return evidence.mzWindowsHeaderSignature;
			const { offset } = observation;
			if (!Number.isSafeInteger(offset) || offset < 0 || offset >= fileSize) return evidence.mzWindowsHeaderSignature;
			const window = Buffer.alloc(4);
			const existing = evidence.mzWindowsHeaderSignature?.offset === offset ? evidence.mzWindowsHeaderSignature.bytes : undefined;
			const inline = offset < evidence.prefix.length ? evidence.prefix.subarray(offset, Math.min(offset + 4, evidence.prefix.length)) : undefined;
			const known = existing !== undefined && (inline === undefined || existing.length > inline.length) ? existing : inline;
			known?.copy(window);
			let available = known?.length ?? 0;
			const requiredLength = () => available >= 2 && window[0] === 80 && window[1] === 69 ? 4 : 2;
			while (available < requiredLength() && offset + available < fileSize) {
				abortIfNeeded(signal);
				const length = Math.min(requiredLength() - available, fileSize - offset - available);
				const chunk = Buffer.alloc(length);
				const read = await handle.read(chunk, 0, length, offset + available);
				abortIfNeeded(signal);
				if (read.bytesRead === 0) break;
				chunk.copy(window, available, 0, read.bytesRead);
				available += read.bytesRead;
			}
			if (available === 0) return undefined;
			return {
				offset,
				bytes: window.subarray(0, available)
			};
		};
		hasKolyTrailer = async (handle, size, signal) => {
			if (size < 512) return false;
			const trailer = Buffer.alloc(4);
			let bytes = 0;
			while (bytes < trailer.length) {
				abortIfNeeded(signal);
				const read = await handle.read(trailer, bytes, trailer.length - bytes, size - 512 + bytes);
				abortIfNeeded(signal);
				if (read.bytesRead === 0) return false;
				bytes += read.bytesRead;
			}
			return trailer.equals(Buffer.from("koly"));
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactFileAdmission.js
var artifactFileAdmissionFailure;
function init_ArtifactFileAdmission() {
	return (init_ArtifactFileAdmission = __esmMin((() => {
		init_RegularFile();
		init_ArtifactReader();
		artifactFileAdmissionFailure = (path, diagnosticLabel, cause) => {
			if (cause instanceof ArtifactReaderFailure) return cause;
			if (cause instanceof RegularFileOperationCancelled) return new ArtifactReaderFailure("cancelled", `${diagnosticLabel} admission cancelled`, { cause: cause.reason });
			if (cause instanceof RegularFileAdmissionFailure) return ArtifactReaderFailure.withCleanup(artifactFileAdmissionFailure(path, diagnosticLabel, cause.cause), ArtifactReaderFailure.cleanupObservation(cause.cleanupCause, path));
			if (cause instanceof RegularFileChangedError) return new ArtifactReaderFailure("integrity", `${diagnosticLabel} source changed during admission: ${path}`, { cause });
			if (cause instanceof NonRegularFileReadError) return new ArtifactReaderFailure("format", `${diagnosticLabel} source is not a regular file: ${path}`, { cause });
			return new ArtifactReaderFailure("io", cause instanceof Error ? cause.message : `Cannot admit ${diagnosticLabel} source: ${path}`, { cause });
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactFileSource.js
var ArtifactFileSource;
function init_ArtifactFileSource() {
	return (init_ArtifactFileSource = __esmMin((() => {
		init_artifactIntegrity();
		init_OwnedFileHandle();
		init_readFileHandleChunks();
		init_RegularFile();
		init_ArtifactFileOperation();
		init_ArtifactFileAdmission();
		init_ArtifactHash();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		ArtifactFileSource = class {
			path;
			diagnosticLabel;
			admitted;
			#scope = new ArtifactResourceScope();
			#owner;
			#opening;
			#boundSha256;
			constructor(path, diagnosticLabel, admitted) {
				this.path = path;
				this.diagnosticLabel = diagnosticLabel;
				this.admitted = admitted;
				this.#scope.addCloseHook(async () => {
					if (this.#owner !== undefined) {
						await this.#owner.close();
						this.#owner = undefined;
					}
					this.#opening = undefined;
					this.#boundSha256 = undefined;
				});
			}
			/** Verify the admitted descriptor; the selected pathname is not reinterpreted. */
			read(signal) {
				return this.#scope.run(() => this.#verify(signal));
			}
			/** Verify both the descriptor and the file currently at the caller-selected path. */
			readSelectedPath(signal) {
				return this.#scope.run(() => this.#verifySelectedPath(signal));
			}
			/** Bind verified bytes to the inventory's expected whole-carrier identity. */
			bindSha256(expectedSha256, signal) {
				return this.#scope.run(() => this.#bind(expectedSha256, signal, () => this.#verify(signal)));
			}
			/** Bind carrier bytes while the selected pathname continues to name the same source. */
			bindSelectedPathSha256(expectedSha256, signal) {
				return this.#scope.run(() => this.#bind(expectedSha256, signal, () => this.#verifySelectedPath(signal), () => this.#verifySelectedPath()));
			}
			/** Join admitted operations before closing; failed descriptor ownership stays retained. */
			close() {
				return this.#scope.close();
			}
			async #bind(expectedSha256, signal, verify, verifyCompletion = verify) {
				const { handle } = await verify();
				const observed = this.#boundSha256 ?? (await hashReadable(readFileHandleChunks(handle, {
					signal,
					cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", `${this.diagnosticLabel} verification cancelled`, { cause: reason })
				}), signal)).sha256;
				await verifyCompletion();
				assertArtifactReadActive(signal);
				if (observed !== expectedSha256) throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} carrier changed after inventory`, undefined, artifactIntegrityDetails(".", {
					algorithm: "sha256",
					digest: expectedSha256
				}, observed, false));
				this.#boundSha256 = observed;
			}
			async #verify(signal) {
				assertArtifactReadActive(signal);
				this.#opening ??= this.#admit(signal);
				const source = await this.#opening;
				const observed = await source.handle.stat();
				if (!sameRegularFileState(source.initial, observed)) throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} source identity changed: ${this.path}`);
				assertArtifactReadActive(signal);
				return source;
			}
			async #verifySelectedPath(signal) {
				assertArtifactReadActive(signal);
				this.#opening ??= this.#admit(signal);
				const source = await this.#opening;
				const [observed, selected] = await Promise.all([source.handle.stat(), lstat(this.path)]);
				if (!sameRegularFileState(source.initial, observed) || !sameRegularFileState(source.initial, selected)) throw new ArtifactReaderFailure("integrity", `${this.diagnosticLabel} source identity changed: ${this.path}`);
				assertArtifactReadActive(signal);
				return source;
			}
			async #admit(signal) {
				try {
					if (this.admitted !== undefined) return {
						handle: this.admitted.handle,
						initial: this.admitted.initial
					};
					const source = await openRegularFile(this.path, {
						symlinks: "reject",
						signal
					});
					this.#owner = new OwnedFileHandle(source.handle);
					return source;
				} catch (cause) {
					if (cause instanceof RegularFileAdmissionFailure) this.#owner = cause.owner;
					throw artifactFileAdmissionFailure(this.path, this.diagnosticLabel, cause);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/artifacts/GodotPckArtifactReader.js
var PACK_DIR_ENCRYPTED, PACK_REL_FILEBASE, PACK_SPARSE_BUNDLE, PACK_FILE_ENCRYPTED, MINIMUM_ENTRY_BYTES, DIRECTORY_CHUNK_BYTES, MAX_DIRECTORY_METADATA_BYTES, UTF8, GodotPckArtifactReader, readGodotPckHeader, pckMemberPath, PckCursor, toSafeOffset, formatFailure$1, metadataLimit;
function init_GodotPckArtifactReader() {
	return (init_GodotPckArtifactReader = __esmMin((() => {
		init_artifactExpansionBudget();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		init_GodotPckLocation();
		init_jsonValueByteLength();
		init_readFileHandleChunks();
		init_ArtifactFileSource();
		PACK_DIR_ENCRYPTED = 1;
		PACK_REL_FILEBASE = 2;
		PACK_SPARSE_BUNDLE = 4;
		PACK_FILE_ENCRYPTED = 1;
		MINIMUM_ENTRY_BYTES = 40;
		DIRECTORY_CHUNK_BYTES = 64 * 1024;
		MAX_DIRECTORY_METADATA_BYTES = 64 * 1024 * 1024;
		UTF8 = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
		GodotPckArtifactReader = class {
			format = "godot-pck";
			#scope = new ArtifactResourceScope();
			#entries = new Map();
			#streams = new Set();
			#source;
			#prepared;
			#header;
			#closing = false;
			constructor(path, admitted) {
				this.#source = new ArtifactFileSource(path, "Godot PCK", admitted);
			}
			formatMetadata() {
				return this.#header === undefined ? undefined : { ...this.#header };
			}
			async prepareContainer(expectedSha256, signal) {
				await this.#scope.run(async () => {
					this.#assertOpen(signal);
					await this.#source.bindSha256(expectedSha256, signal);
				});
			}
			async *entries(signal, options) {
				await this.#scope.run(async () => {
					this.#assertOpen(signal);
					this.#prepared ??= this.#prepare(signal);
					await this.#prepared;
					await this.#source.read(signal);
				});
				if (this.#header?.directory_status !== "available") {
					options?.onCoverage?.({
						status: "unknown",
						limitations: [this.#header?.directory_status === "encrypted" ? "Godot PCK directory is encrypted; member identities and contents remain unknown." : "Godot PCK sparse-bundle member bytes are external and were not traversed."]
					});
					return;
				}
				let index = 0;
				for (const entry of this.#entries.values()) {
					if (index++ % 256 === 0) await setImmediate();
					this.#assertOpen(signal);
					yield copyArtifactEntry(entry);
				}
			}
			async open(entry, signal) {
				return this.#scope.run(async () => {
					this.#assertOpen(signal);
					const stored = this.#entries.get(entry.adapterKey);
					if (stored === undefined || !sameArtifactEntry(entry, stored)) throw new ArtifactReaderFailure("integrity", "Godot PCK entry does not match its owning inventory");
					if (stored.encrypted) throw new ArtifactReaderFailure("unavailable", `Encrypted Godot PCK member is unsupported: ${stored.path}`);
					const { handle } = await this.#source.read(signal);
					this.#assertOpen(signal);
					if (stored.byteOffset === null || stored.declaredSize === null) throw formatFailure$1("member has no physical byte range");
					const source = stored.declaredSize === 0 ? Readable.from([]) : readFileHandleChunks(handle, {
						start: stored.byteOffset,
						end: stored.byteOffset + stored.declaredSize - 1,
						signal,
						cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", "Godot PCK read cancelled", { cause: reason })
					});
					const output = this.#memberStream(stored, signal);
					output.on("error", () => undefined);
					this.#streams.add(output);
					void this.#scope.run(() => new Promise((resolve) => {
						pipeline$1(source, output, () => {
							this.#streams.delete(output);
							resolve();
						});
					})).catch((cause) => output.destroy(cause instanceof Error ? cause : new Error("Godot PCK stream ownership failed", { cause })));
					return output;
				});
			}
			async close() {
				this.#closing = true;
				for (const stream of this.#streams) stream.destroy(new ArtifactReaderFailure("unavailable", "Godot PCK reader closed"));
				await this.#scope.close();
				await this.#source.close();
				this.#entries.clear();
			}
			provenance() {
				return [];
			}
			#assertOpen(signal) {
				assertArtifactReadActive(signal);
				if (this.#closing) throw new ArtifactReaderFailure("unavailable", "Godot PCK reader is closed");
			}
			async #prepare(signal) {
				const { handle, initial } = await this.#source.read(signal);
				const header = await readGodotPckHeader(handle, initial.size, signal);
				this.#header = header;
				if (header.directory_status !== "available") return;
				const cursor = new PckCursor(handle, header.directory_start + 4, header.pack_end, signal);
				let retainedBytes = 0;
				let declaredPlaintextBytes = 0n;
				const expansionBudget = BigInt(artifactExpansionBudgetBytes(header.pack_end - header.pack_start));
				for (let index = 0; index < header.declared_file_count; index++) {
					if (index % 256 === 0) await setImmediate();
					assertArtifactReadActive(signal);
					const pathBytes = await cursor.uint32();
					if (pathBytes * 18 > MAX_DIRECTORY_METADATA_BYTES - retainedBytes) throw metadataLimit();
					const rawPath = await cursor.bytes(pathBytes);
					const offset = await cursor.uint64();
					const size = await cursor.uint64();
					const md5 = (await cursor.bytes(16)).toString("hex");
					const flags = await cursor.uint32();
					if ((flags & ~PACK_FILE_ENCRYPTED) !== 0) throw new ArtifactReaderFailure("unavailable", `Godot patch or unknown member flags are unsupported: 0x${flags.toString(16)}`);
					const sourcePath = pckMemberPath(rawPath);
					const start = toSafeOffset(offset, header.file_base, header.pack_end, sourcePath);
					if (size > BigInt(header.pack_end - start)) throw formatFailure$1(`member exceeds the pack: ${sourcePath}`);
					if ((flags & PACK_FILE_ENCRYPTED) === 0) {
						declaredPlaintextBytes += size;
						if (declaredPlaintextBytes > expansionBudget) throw new ArtifactReaderFailure("limit", `Godot PCK readable entries declare ${String(declaredPlaintextBytes)} plaintext bytes, exceeding this pack's ${String(expansionBudget)}-byte expansion budget`);
					}
					const metadata = {
						path: sourcePath.startsWith("res://") ? sourcePath.slice(6) : sourcePath,
						sourcePath,
						kind: "file",
						declaredSize: Number(size),
						compressedSize: null,
						executable: false,
						encrypted: (flags & PACK_FILE_ENCRYPTED) !== 0,
						byteOffset: start,
						declaredIntegrity: /^0{32}$/u.test(md5) ? null : {
							algorithm: "md5",
							digest: md5
						},
						unpacked: false,
						limitations: /^0{32}$/u.test(md5) ? ["Godot PCK declares an all-zero MD5; source integrity is unknown."] : [],
						adapterKey: `godot-pck-entry:${String(index)}`,
						formatMetadata: {
							kind: "godot-pck-entry",
							index,
							source_path: sourcePath,
							declared_offset: Number(offset),
							flags,
							md5_status: /^0{32}$/u.test(md5) ? "all-zero" : "declared"
						}
					};
					retainedBytes += jsonValueByteLength(metadata, MAX_DIRECTORY_METADATA_BYTES - retainedBytes);
					if (retainedBytes > MAX_DIRECTORY_METADATA_BYTES) throw metadataLimit();
					this.#entries.set(metadata.adapterKey, metadata);
				}
				await this.#source.read(signal);
			}
			#memberStream(entry, signal) {
				let bytes = 0;
				const check = async () => {
					if (bytes !== entry.declaredSize) throw formatFailure$1(`member ended early: ${entry.path}`);
					await this.#source.read(signal);
				};
				return new Transform({
					transform(chunk, _encoding, callback) {
						bytes += chunk.length;
						callback(null, chunk);
					},
					flush(callback) {
						void check().then(() => callback(), (cause) => callback(cause instanceof Error ? cause : new Error("Godot PCK read failed", { cause })));
					}
				});
			}
		};
		readGodotPckHeader = async (handle, size, signal) => {
			const location = await locateGodotPck(handle, size, signal);
			if (location === undefined) throw formatFailure$1("no standalone header or executable trailer");
			const { start, end, embedded } = location;
			const fixed = await readPckBytes(handle, start, 40, end, signal);
			const version = fixed.readUInt32LE(4);
			if (![
				2,
				3,
				4
			].includes(version)) throw new ArtifactReaderFailure("unavailable", `Godot PCK format ${String(version)} is unsupported; plain formats 2, 3 and 4 are supported`);
			const flags = fixed.readUInt32LE(20);
			if ((flags & ~(PACK_DIR_ENCRYPTED | PACK_REL_FILEBASE | PACK_SPARSE_BUNDLE)) !== 0) throw new ArtifactReaderFailure("unavailable", `Godot PCK declares unknown pack flags 0x${flags.toString(16)}`);
			const fileBase = toSafeOffset(fixed.readBigUInt64LE(24), version >= 3 || (flags & PACK_REL_FILEBASE) !== 0 ? start : 0, end, "file base");
			const directory = version >= 3 ? toSafeOffset(fixed.readBigUInt64LE(32), start, end, "directory") : start + 96;
			const count = (await readPckBytes(handle, directory, 4, end, signal)).readUInt32LE(0);
			const status = (flags & PACK_DIR_ENCRYPTED) !== 0 ? "encrypted" : (flags & PACK_SPARSE_BUNDLE) !== 0 ? "sparse-bundle" : "available";
			if (status === "available" && count * MINIMUM_ENTRY_BYTES > end - directory - 4) throw formatFailure$1("declared member count cannot fit in the directory");
			return {
				kind: "godot-pck",
				format_version: version,
				engine_major: fixed.readUInt32LE(8),
				engine_minor: fixed.readUInt32LE(12),
				engine_patch: fixed.readUInt32LE(16),
				pack_start: start,
				pack_end: end,
				embedded,
				pack_flags: flags,
				file_base: fileBase,
				directory_start: directory,
				declared_file_count: count,
				directory_status: status
			};
		};
		pckMemberPath = (raw) => {
			let end = raw.length;
			while (end > 0 && raw[end - 1] === 0) end--;
			let path;
			try {
				path = UTF8.decode(raw.subarray(0, end));
			} catch (cause) {
				throw new ArtifactReaderFailure("format", "Godot PCK path is not valid UTF-8", { cause });
			}
			if (path.length === 0 || path === "res://" || path.includes("\0")) throw formatFailure$1("empty or NUL-containing member path");
			return path;
		};
		PckCursor = class {
			handle;
			position;
			end;
			signal;
			#buffer = Buffer.alloc(0);
			#bufferStart = 0;
			constructor(handle, position, end, signal) {
				this.handle = handle;
				this.position = position;
				this.end = end;
				this.signal = signal;
			}
			async bytes(length) {
				if (length > this.end - this.position) throw formatFailure$1("directory entry exceeds the pack");
				if (length > MAX_DIRECTORY_METADATA_BYTES / 18) throw metadataLimit();
				if (length > DIRECTORY_CHUNK_BYTES) {
					const value = await readPckBytes(this.handle, this.position, length, this.end, this.signal);
					this.position += length;
					return value;
				}
				const offset = this.position - this.#bufferStart;
				if (offset < 0 || offset + length > this.#buffer.length) {
					this.#buffer = await readPckBytes(this.handle, this.position, Math.min(DIRECTORY_CHUNK_BYTES, this.end - this.position), this.end, this.signal);
					this.#bufferStart = this.position;
				}
				const start = this.position - this.#bufferStart;
				this.position += length;
				return this.#buffer.subarray(start, start + length);
			}
			async uint32() {
				return (await this.bytes(4)).readUInt32LE(0);
			}
			async uint64() {
				return (await this.bytes(8)).readBigUInt64LE(0);
			}
		};
		toSafeOffset = (offset, base, end, subject) => {
			if (base > end || offset > BigInt(end - base)) throw formatFailure$1(`${subject} offset exceeds the pack`);
			return base + Number(offset);
		};
		formatFailure$1 = (detail) => new ArtifactReaderFailure("format", `Godot PCK is malformed: ${detail}`);
		metadataLimit = () => new ArtifactReaderFailure("limit", "Godot PCK directory exceeds the 64 MiB encoded metadata budget", { boundary: "memory" });
	})))();
}

//#endregion
//#region dist/artifacts/MachOSliceArtifactReader.js
var MachOSliceArtifactReader, readStructuralSlices, lipoMatchesSlice, lipoSubtypeMatches, ARM_SUBTYPES, lipoNameMatches;
function init_MachOSliceArtifactReader() {
	return (init_MachOSliceArtifactReader = __esmMin((() => {
		init_ArtifactFileOperation();
		init_CommandRunner();
		init_lipo();
		init_machoCpuIdentity();
		init_MachoLoadCommandReader();
		init_ArtifactReader();
		init_StreamBytes();
		init_readArtifactFileChunks();
		init_ArtifactFileSource();
		MachOSliceArtifactReader = class {
			path;
			runner;
			format = "file";
			#command;
			#source;
			#entries = new Map();
			#pendingCommands = new Set();
			#closed = false;
			#closePromise;
			constructor(path, environment, runner = new XcrunCommandRunner(environment), source) {
				this.path = path;
				this.runner = runner;
				this.#source = new ArtifactFileSource(path, "Universal Mach-O", source);
			}
			async *entries(signal) {
				this.#entries.clear();
				const source = await this.#ensureSource();
				await this.#source.readSelectedPath();
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Universal Mach-O reader is closed");
				const command = this.runner.run("lipo", ["-detailed_info", this.path], signal === undefined ? {} : { signal });
				this.#pendingCommands.add(command);
				let captured;
				try {
					captured = await command;
				} finally {
					this.#pendingCommands.delete(command);
				}
				if (!captured.ok) throw new ArtifactReaderFailure(captured.error.reason === "cancelled" ? "cancelled" : "unavailable", captured.error.detail === null ? "lipo could not enumerate universal Mach-O slices" : `lipo could not enumerate universal Mach-O slices: ${captured.error.detail}`, {
					cause: captured.error,
					...captured.error.cleanupFailure === null && captured.error.cleanupResources.length === 0 ? {} : { cleanup: {
						reason: captured.error.cleanupFailure ?? "Native command cleanup remains unverified",
						resources: [...captured.error.cleanupResources]
					} }
				});
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Universal Mach-O reader closed during slice discovery");
				this.#command = {
					tool: captured.value.tool,
					arguments: ["-detailed_info", "$ARTIFACT"],
					tool_version: captured.value.toolVersion,
					executable_sha256: captured.value.executableSha256,
					exit_code: captured.value.exitCode,
					effects: ["read"]
				};
				await this.#source.readSelectedPath();
				const fileSize = source.initial.size;
				const parsed = parseLipoOutputResult(captured.value.stdout, this.path);
				if (!parsed.ok) throw new ArtifactReaderFailure("format", `lipo did not produce readable architecture records: ${parsed.error.message}`, { cause: parsed.error });
				const lipo = parsed.value;
				const { architectures } = lipo;
				const structural = await readStructuralSlices(source.handle, fileSize);
				await this.#source.readSelectedPath();
				if (structural.status === "malformed") throw new ArtifactReaderFailure("integrity", `Mach-O structural slice index is malformed: ${structural.reason}`);
				if (structural.status === "unsupported" && architectures.some(({ file_offset, size }) => file_offset === null || size === null)) throw new ArtifactReaderFailure("unavailable", `Mach-O structural slice index is unsupported: ${structural.reason}`);
				const hiddenArchitectures = architectures.filter(({ hidden }) => hidden);
				const visibleArchitectures = architectures.filter(({ hidden }) => !hidden);
				if (lipo.hiddenArchitectureCount !== null && lipo.hiddenArchitectureCount !== hiddenArchitectures.length) throw new ArtifactReaderFailure("integrity", "lipo hidden architecture count disagrees with its architecture rows");
				if (lipo.declaredArchitectureCount !== null && lipo.declaredArchitectureCount !== visibleArchitectures.length) throw new ArtifactReaderFailure("integrity", "lipo declared architecture count disagrees with its visible rows");
				if ((hiddenArchitectures.length > 0 || (lipo.hiddenArchitectureCount ?? 0) > 0) && structural.status !== "parsed") throw new ArtifactReaderFailure("unavailable", "Apple hidden ARM64 slice could not be verified against the FAT table");
				const slices = structural.status === "parsed" ? structural.slices : null;
				const hiddenSlices = structural.status === "parsed" ? structural.hiddenSlices ?? [] : [];
				const matchingSlices = new Map();
				if (slices !== null) {
					if (slices.length !== visibleArchitectures.length || hiddenSlices.length !== hiddenArchitectures.length || hiddenArchitectures.length > 0 && (lipo.declaredArchitectureCount === null || lipo.hiddenArchitectureCount === null) || lipo.declaredArchitectureCount !== null && lipo.declaredArchitectureCount !== slices.length || lipo.hiddenArchitectureCount !== null && lipo.hiddenArchitectureCount !== hiddenSlices.length) throw new ArtifactReaderFailure("integrity", "lipo declared and hidden architecture counts disagree with the Mach-O FAT table");
					for (const [reportedRows, observedRows] of [[visibleArchitectures, slices], [hiddenArchitectures, hiddenSlices]]) {
						const unmatched = [...observedRows];
						for (const reported of reportedRows) {
							const match = unmatched.findIndex((observed) => lipoMatchesSlice(reported, observed, observedRows.length === 1));
							if (match < 0) throw new ArtifactReaderFailure("integrity", `lipo slice metadata disagrees with the Mach-O FAT table: ${reported.name} (cputype=${reported.cpu_type ?? "unknown"}, cpusubtype=${reported.cpu_subtype ?? "unknown"}, offset=${reported.file_offset ?? "unknown"}, size=${reported.size ?? "unknown"}, alignment=${reported.alignment ?? "unknown"})`);
							const [observed] = unmatched.splice(match, 1);
							if (observed !== undefined) matchingSlices.set(reported, observed);
						}
					}
				}
				for (const architecture of architectures) {
					const structuralSlice = matchingSlices.get(architecture);
					const offset = architecture.file_offset ?? structuralSlice?.slice_offset;
					const sliceSize = architecture.size ?? structuralSlice?.slice_size;
					if (offset === undefined || sliceSize === undefined) throw new ArtifactReaderFailure("integrity", "lipo omitted a universal slice byte range");
					if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(sliceSize) || offset < 0 || sliceSize <= 0 || !Number.isSafeInteger(offset + sliceSize) || offset + sliceSize > fileSize) throw new ArtifactReaderFailure("integrity", `lipo reported an out-of-bounds Mach-O slice: ${architecture.name}`);
					const entry = {
						path: `slices/${architecture.name}`,
						kind: "slice",
						declaredSize: sliceSize,
						compressedSize: null,
						executable: true,
						encrypted: false,
						byteOffset: offset,
						declaredIntegrity: null,
						unpacked: false,
						limitations: [
							...structural.status === "not-mach-o" ? ["Structural Mach-O facts were unavailable; slice range is based on lipo output."] : structural.status === "unsupported" ? [`Structural Mach-O facts were unsupported (${structural.reason}); slice range is based on lipo output.`] : [],
							...architecture.file_offset === null || architecture.size === null ? ["Slice range was derived from structural Mach-O facts because lipo omitted it."] : [],
							...architecture.cpu_type !== null && architecture.cpu_type_code === null ? [`lipo CPU type is retained as unnormalized source text: ${architecture.cpu_type}`] : [],
							...architecture.cpu_subtype !== null && architecture.cpu_subtype_code === null ? [`lipo CPU subtype is retained as unnormalized source text: ${architecture.cpu_subtype}${architecture.capabilities === null ? "" : `; capabilities ${architecture.capabilities}`}`] : []
						],
						adapterKey: `${String(offset)}:${String(sliceSize)}`
					};
					this.#entries.set(entry.adapterKey, copyArtifactEntry(entry));
					yield entry;
				}
			}
			async open(entry, signal) {
				if (signal?.aborted === true) return Promise.reject(new ArtifactReaderFailure("cancelled", "Mach-O slice read cancelled", { cause: signal.reason }));
				const produced = this.#entries.get(entry.adapterKey);
				if (produced === undefined || !sameArtifactEntry(entry, produced)) throw new ArtifactReaderFailure("integrity", "Mach-O slice entry metadata does not match this reader's inventory");
				const offset = produced.byteOffset;
				const size = produced.declaredSize;
				if (offset === null || size === null || !Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size <= 0) throw new ArtifactReaderFailure("integrity", "Invalid Mach-O slice byte range");
				const source = await this.#ensureSource();
				await this.#source.readSelectedPath();
				if (!Number.isSafeInteger(offset + size) || offset + size > source.initial.size) throw new ArtifactReaderFailure("integrity", `Mach-O slice range is outside the artifact: ${entry.path}`);
				const sourceStream = readArtifactFileChunks(source.handle, {
					start: offset,
					end: offset + size - 1,
					...signal === undefined ? {} : { signal }
				});
				const verifySource = () => this.#source.readSelectedPath();
				let validatingSource = false;
				const completionFailure = () => {
					const coverage = sourceStream.readCoverage();
					if (coverage.kind !== "complete") return new ArtifactReaderFailure("integrity", `Mach-O slice read coverage is incomplete: ${entry.path}`);
					if (coverage.bytes !== BigInt(size)) return new ArtifactReaderFailure("integrity", `Mach-O slice size disagrees with lipo metadata: ${entry.path}`);
					if (signal?.aborted) return new ArtifactReaderFailure("cancelled", "Mach-O slice read cancelled", { cause: signal.reason });
					return undefined;
				};
				const output = Readable.from((async function* () {
					try {
						for await (const raw of sourceStream) {
							const chunk = streamChunkToBuffer(raw);
							if (sourceStream.readCoverage().kind === "complete" && signal?.aborted) {
								const failure = completionFailure();
								if (failure !== undefined) throw failure;
							}
							yield chunk;
						}
					} catch (cause) {
						if (cause instanceof ArtifactReaderFailure) throw cause;
						throw new ArtifactReaderFailure("integrity", `Could not read Mach-O slice range: ${entry.path}`, { cause });
					}
					validatingSource = true;
					const failure = completionFailure();
					if (failure !== undefined) throw failure;
					try {
						await verifySource();
						assertArtifactReadActive(signal);
					} finally {
						validatingSource = false;
					}
				})());
				const onSourceError = (cause) => {
					const completedCancellation = cause instanceof ArtifactReaderFailure && cause.reason === "cancelled" && sourceStream.readCoverage().kind === "complete" && !validatingSource ? completionFailure() : undefined;
					output.destroy(completedCancellation ?? (cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("integrity", `Could not read Mach-O slice range: ${entry.path}`, { cause })));
				};
				sourceStream.on("error", onSourceError);
				sourceStream.once("close", () => sourceStream.removeListener("error", onSourceError));
				const onAbort = () => {
					if (sourceStream.readCoverage().kind === "complete" && (sourceStream.errored === null || sourceStream.errored instanceof ArtifactReaderFailure && sourceStream.errored.reason === "cancelled") && !validatingSource && !output.destroyed) {
						const failure = completionFailure();
						if (failure !== undefined) output.destroy(failure);
					}
				};
				signal?.addEventListener("abort", onAbort, { once: true });
				output.once("close", () => {
					signal?.removeEventListener("abort", onAbort);
					if (!sourceStream.destroyed) sourceStream.destroy();
				});
				if (signal?.aborted) onAbort();
				return output;
			}
			provenance() {
				return this.#command === undefined ? [] : [structuredClone(this.#command)];
			}
			async close() {
				this.#closed = true;
				this.#closePromise ??= this.#releaseResources().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
			async #releaseResources() {
				await Promise.allSettled(this.#pendingCommands);
				let cleanup;
				try {
					const failures = await this.runner.retryCleanup?.() ?? [];
					if (failures.length > 0) cleanup = {
						reason: failures.map(({ reason, resources }) => `${resources.join(", ")}: ${reason}`).join("; "),
						resources: [...new Set(failures.flatMap(({ resources }) => resources))]
					};
				} catch (cause) {
					cleanup = ArtifactReaderFailure.cleanupObservation(cause, "native-command-process-cleanup");
				}
				try {
					await this.#source.close();
				} catch (cause) {
					if (cleanup === undefined) throw cause;
					throw ArtifactReaderFailure.withCleanup(cause, cleanup);
				}
				if (cleanup !== undefined) throw new ArtifactReaderFailure("unavailable", "Native command process cleanup remains incomplete", { cleanup });
			}
			async #ensureSource() {
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Universal Mach-O reader is closed");
				const source = await this.#source.read();
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Universal Mach-O reader closed during source acquisition");
				return source;
			}
		};
		readStructuralSlices = async (file, size) => {
			const readAt = async (offset, length) => {
				const bytes = Buffer.alloc(length);
				const { bytesRead } = await file.read(bytes, 0, length, offset);
				return bytes.subarray(0, bytesRead);
			};
			return readMachoImage(readAt, size);
		};
		lipoMatchesSlice = (reported, observed, structurallyUnique) => {
			const observedCpuType = observed.fat_cpu_type ?? observed.cpu_type;
			const observedCpuSubtype = observed.fat_cpu_subtype ?? observed.cpu_subtype;
			const hasPhysicalIdentity = reported.file_offset !== null || reported.size !== null || reported.cpu_type_code !== null || reported.cpu_subtype_code !== null;
			return (hasPhysicalIdentity || structurallyUnique) && lipoNameMatches(reported.name, observed) && (reported.file_offset === null || reported.file_offset === observed.slice_offset) && (reported.size === null || reported.size === observed.slice_size) && (reported.cpu_type_code === null || reported.cpu_type_code === observedCpuType) && lipoSubtypeMatches(reported, observedCpuSubtype) && (reported.alignment === null || observed.fat_alignment_exponent === null || reported.alignment === 2 ** observed.fat_alignment_exponent);
		};
		lipoSubtypeMatches = (reported, observedCpuSubtype) => {
			if (reported.cpu_subtype_code !== null) return reported.cpu_subtype_code === observedCpuSubtype;
			return reported.cpu_subtype_base === null || reported.cpu_subtype_base === machoCpuSubtypeBase(observedCpuSubtype);
		};
		ARM_SUBTYPES = {
			armv4t: 5,
			armv5: 7,
			xscale: 8,
			armv6: 6,
			armv7: 9,
			armv7f: 10,
			armv7s: 11,
			armv7k: 12,
			armv6m: 14,
			armv7m: 15,
			armv7em: 16,
			"armv8m.main": 17,
			"armv8m.base": 18,
			"armv8.1m.main": 19
		};
		lipoNameMatches = (reported, observed) => {
			if (reported === observed.architecture) return true;
			if (observed.cpu_type === 12 && observed.architecture === "arm") return ARM_SUBTYPES[reported] === machoCpuSubtypeBase(observed.fat_cpu_subtype ?? observed.cpu_subtype);
			if (reported === machoArchitectureFamily(observed.architecture)) return true;
			return machoArchitectureFamily(observed.architecture) === "arm64e" && /^arm64e\.[A-Za-z0-9_]+$/u.test(reported);
		};
	})))();
}

//#endregion
//#region dist/artifacts/NativeDmgOwnership.js
var systemEntitySchema, attachOutputSchema, infoOutputSchema, parseNativeDmgInfo, parseNativeDmgAttachOutput, resolveNativeDmgOwnership, ownershipFromAttachOutput, topLevelDevices, isBelowRoot;
function init_NativeDmgOwnership() {
	return (init_NativeDmgOwnership = __esmMin((() => {
		systemEntitySchema = z.object({
			"dev-entry": z.string().startsWith("/dev/"),
			"mount-point": z.string().optional()
		});
		attachOutputSchema = z.object({ "system-entities": z.array(systemEntitySchema) });
		infoOutputSchema = z.object({ images: z.array(z.object({ "system-entities": z.array(systemEntitySchema) })) });
		parseNativeDmgInfo = (stdout) => infoOutputSchema.parse(parse(stdout));
		parseNativeDmgAttachOutput = (stdout) => attachOutputSchema.parse(parse(stdout));
		resolveNativeDmgOwnership = (input) => {
			const rootedImages = input.info.images.filter((image) => image["system-entities"].some(({ "mount-point": mountPoint }) => mountPoint !== undefined && isBelowRoot(input.mountRoot, mountPoint)));
			if (rootedImages.length > 1) return {
				status: "unknown",
				reason: "multiple hdiutil image groups report mounts beneath the owned root"
			};
			const rootedImage = rootedImages[0];
			if (rootedImage !== undefined) {
				const hasOutsideMount = rootedImage["system-entities"].some(({ "mount-point": mountPoint }) => mountPoint !== undefined && !isBelowRoot(input.mountRoot, mountPoint));
				const groupDevices = rootedImage["system-entities"].map(({ "dev-entry": device }) => device);
				const devices = topLevelDevices(groupDevices);
				const overlapsBaseline = groupDevices.some((device) => input.baselineDevices.has(device));
				if (hasOutsideMount || overlapsBaseline || devices.length === 0) return {
					status: "unknown",
					reason: hasOutsideMount ? "the image group contains a mount outside the owned root" : overlapsBaseline ? "the image group includes a device present before attachment" : "the owned mount group contains no detachable device"
				};
				return {
					status: "owned",
					devices,
					source: "info"
				};
			}
			if (input.attachOutputReturned) {
				const attachOwnership = ownershipFromAttachOutput(input.attachOutput, input.mountRoot, input.baselineDevices);
				if (attachOwnership.status === "owned") {
					return attachOwnership;
				}
				if (attachOwnership.status === "unknown") return attachOwnership;
			}
			const newlyListedDevice = input.info.images.some((image) => image["system-entities"].some(({ "dev-entry": device }) => !input.baselineDevices.has(device)));
			if (newlyListedDevice) return {
				status: "unknown",
				reason: "hdiutil lists devices absent from the pre-attach baseline, but none is tied uniquely to the owned root; ownership is unknown"
			};
			return { status: "none" };
		};
		ownershipFromAttachOutput = (output, mountRoot, baselineDevices) => {
			if (output === undefined) return {
				status: "unknown",
				reason: "hdiutil attach succeeded but its ownership facts were malformed"
			};
			const entities = output["system-entities"];
			const hasRootMount = entities.some(({ "mount-point": mountPoint }) => mountPoint !== undefined && isBelowRoot(mountRoot, mountPoint));
			const hasOutsideMount = entities.some(({ "mount-point": mountPoint }) => mountPoint !== undefined && !isBelowRoot(mountRoot, mountPoint));
			const devices = entities.map(({ "dev-entry": device }) => device);
			const uniqueDevices = topLevelDevices(devices);
			const overlapsBaseline = devices.some((device) => baselineDevices.has(device));
			if (hasRootMount) {
				if (hasOutsideMount || overlapsBaseline || uniqueDevices.length === 0) return {
					status: "unknown",
					reason: hasOutsideMount ? "the attach result includes a mount outside the owned root" : overlapsBaseline ? "the attach result includes a device present before attachment" : "the attach result's owned mount has no detachable device"
				};
				return {
					status: "owned",
					devices: uniqueDevices,
					source: "attach"
				};
			}
			if (devices.length === 0) return {
				status: "unknown",
				reason: "hdiutil attach succeeded without reporting device ownership facts"
			};
			if (devices.some((device) => !baselineDevices.has(device))) return {
				status: "unknown",
				reason: "the attach result reports new devices without a mount beneath the owned root"
			};
			return { status: "none" };
		};
		topLevelDevices = (devices) => {
			const unique = [...new Set(devices)];
			return unique.filter((device) => !unique.some((parent) => /^\/dev\/disk\d+$/u.test(parent) && device.startsWith(`${parent}s`) && /^\d+$/u.test(device.slice(parent.length + 1))));
		};
		isBelowRoot = (root, path) => {
			const child = relative(root, resolve(path));
			return child !== "" && child !== "." && child !== ".." && !child.startsWith(`..${sep}`);
		};
	})))();
}

//#endregion
//#region dist/artifacts/NativeDmgArtifactReader.js
var HDIUTIL_COMMAND_TIMEOUT_MS, VERIFY_SETTLE_DELAYS_MS, DETACH_SETTLE_DELAYS_MS, delay, NativeDmgCommandFailure, createSystemHost, NativeDmgArtifactReader, failureMessage, processNotStarted, runChecked, describeCommandFailure, processExitCode, processOutput, classifyCommandFailure, classifyVerifyFailure, verifyFailureReason, verifyFailureDiagnostic, INVALID_CHECKSUM_LINE, UNRECOGNIZED_IMAGE_LINE, untranslatedVerifyFailure, outputLines, command;
function init_NativeDmgArtifactReader() {
	return (init_NativeDmgArtifactReader = __esmMin((() => {
		init_OwnedRegularFile();
		init_ArtifactReader();
		init_DirectoryArtifactReader();
		init_RegularFile();
		init_OwnedFileHandle();
		init_ExecFileOutput();
		init_NativeDmgOwnership();
		HDIUTIL_COMMAND_TIMEOUT_MS = 12e4;
		VERIFY_SETTLE_DELAYS_MS = [250, 500];
		DETACH_SETTLE_DELAYS_MS = [
			250,
			500,
			1e3
		];
		delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
		NativeDmgCommandFailure = class extends ArtifactReaderFailure {
			stdout;
			processNotStarted;
			verifyDiagnostic;
			unrecognizedImage;
			exitCode;
			constructor(failure, message, stdout, options) {
				super(failure.reason, message, options === undefined ? undefined : {
					...options.cause === undefined ? {} : { cause: options.cause },
					...options.cancellation === undefined ? {} : { cancellation: options.cancellation }
				});
				this.stdout = stdout;
				this.processNotStarted = options?.processNotStarted ?? false;
				this.verifyDiagnostic = failure.verifyDiagnostic;
				this.unrecognizedImage = failure.unrecognizedImage ?? false;
				this.exitCode = options?.exitCode ?? null;
			}
		};
		createSystemHost = (environment) => ({
			delay,
			async run(arguments_, signal, options) {
				try {
					const { stdout, stderr } = await execFileOutput("/usr/bin/hdiutil", [...arguments_], {
						env: environment,
						stopSignal: "SIGTERM",
						...options === undefined ? {} : { timeout: options.timeoutMs },
						...signal === undefined ? {} : { signal }
					});
					return {
						stdout,
						stderr,
						exitCode: 0
					};
				} catch (cause) {
					const output = execFileOutputFailure(cause);
					if (cause instanceof ExecFileOutputCancelledError) throw new NativeDmgCommandFailure({ reason: "cancelled" }, "DMG operation cancelled", output?.stdout ?? "", {
						cause,
						cancellation: { reason: cause.cause }
					});
					const exitCode = typeof output?.code === "number" ? output.code : processExitCode(cause);
					if (exitCode !== undefined) return {
						stdout: output?.stdout ?? processOutput(cause, "stdout"),
						stderr: output?.stderr ?? processOutput(cause, "stderr"),
						exitCode,
						cause
					};
					throw new NativeDmgCommandFailure(classifyCommandFailure(cause, arguments_[0]), `hdiutil ${arguments_[0] ?? "operation"} failed: ${describeCommandFailure(cause, arguments_)}`, output?.stdout ?? "", {
						cause,
						processNotStarted: processNotStarted(cause)
					});
				}
			}
		});
		NativeDmgArtifactReader = class {
			path;
			format = "file";
			host;
			#provenance = [];
			#initialization;
			#directory;
			#devices = [];
			#inventoryConfirmedDevices = new Set();
			#mountRoot;
			#baselineDevices = new Set();
			#attachOutput;
			#attachOutputReturned = false;
			#attachMayHaveMounted = false;
			#ownershipUncertainty;
			#closed = false;
			#closePromise;
			#activeDirectoryOperations = new Set();
			#verificationProbeHandle;
			constructor(path, environment, host) {
				this.path = path;
				if (process.platform !== "darwin" && host === undefined) throw new ArtifactReaderFailure("unavailable", "Native DMG traversal is available only on macOS");
				this.host = host ?? createSystemHost(environment);
			}
			async *entries(signal, options) {
				await this.#ensureAttached(signal);
				const directory = this.#directory;
				if (directory === undefined) throw new ArtifactReaderFailure("unavailable", "DMG is not attached");
				const prefix = basename(this.path);
				const entries = directory.entries(signal, { onOmission: (omission) => options?.onOmission?.({
					...omission,
					path: `${prefix}/${omission.path}`
				}) })[Symbol.asyncIterator]();
				try {
					for (;;) {
						if (this.#closed) return;
						const next = await this.#trackDirectoryOperation(() => entries.next());
						if (this.#closed) return;
						if (next.done) return;
						yield {
							...next.value,
							path: `${prefix}/${next.value.path}`
						};
					}
				} finally {
					await entries.return?.();
				}
			}
			async open(entry, signal) {
				await this.#ensureAttached(signal);
				const directory = this.#directory;
				if (directory === undefined) throw new ArtifactReaderFailure("unavailable", "DMG is not attached");
				return this.#trackDirectoryOperation(() => directory.open(entry, signal));
			}
			provenance() {
				return structuredClone(this.#provenance);
			}
			close() {
				this.#closed = true;
				this.#closePromise ??= this.#closeOwnedResources().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
			async #closeOwnedResources() {
				await this.#initialization?.catch(() => undefined);
				await Promise.allSettled(this.#activeDirectoryOperations);
				await this.#closeVerificationProbeHandle();
				await this.#closeMountedDirectory();
				let detachFailure = await this.#detachOwnedDevices();
				if (this.#devices.length === 0 && this.#mountRoot !== undefined && !this.#attachMayHaveMounted) await rm(this.#mountRoot, {
					recursive: true,
					force: true
				}).then(() => {
					this.#mountRoot = undefined;
					this.#directory = undefined;
				}, (cause) => {
					detachFailure ??= cause;
				});
				if (this.#attachMayHaveMounted) {
					detachFailure ??= new Error(this.#ownershipUncertainty ?? "hdiutil attachment ownership remains unknown");
				}
				if (detachFailure !== undefined) throw new ArtifactReaderFailure("unavailable", `DMG detach or mount-root cleanup failed for ${JSON.stringify(this.path)}: ${failureMessage(detachFailure)}`, {
					cause: detachFailure,
					cleanup: {
						reason: failureMessage(detachFailure),
						resources: [
							...this.#devices.map((device) => `DMG device ${device}`),
							...this.#attachMayHaveMounted ? [`DMG attachment ownership unknown at mount root ${this.#mountRoot ?? this.path}`] : [],
							...this.#mountRoot === undefined ? [] : [`DMG mount root ${this.#mountRoot}`]
						]
					}
				});
			}
			async #closeVerificationProbeHandle() {
				const owner = this.#verificationProbeHandle;
				if (owner === undefined) return;
				try {
					await owner.close();
					this.#verificationProbeHandle = undefined;
				} catch (cause) {
					throw ArtifactReaderFailure.withCleanup(cause, ArtifactReaderFailure.cleanupObservation(cause, `DMG verification target descriptor ${this.path}`));
				}
			}
			async #detachOwnedDevices() {
				let detachFailure = await this.#reconcileAttachState();
				let remainingDevices = [];
				for (const device of [...this.#devices].reverse()) {
					const failure = await this.#detach(device);
					if (failure !== undefined) {
						remainingDevices.push(device);
						detachFailure ??= failure;
					}
				}
				for (const delayMs of DETACH_SETTLE_DELAYS_MS) {
					if (remainingDevices.length === 0) break;
					await (this.host.delay ?? delay)(delayMs);
					const stillAttached = [];
					for (const device of remainingDevices) {
						if (!await this.#isAttached(device)) continue;
						const failure = await this.#detach(device);
						if (failure !== undefined) {
							stillAttached.push(device);
							detachFailure = failure;
						}
					}
					remainingDevices = stillAttached;
				}
				if (remainingDevices.length === 0) detachFailure = undefined;
				this.#devices = remainingDevices.reverse();
				return detachFailure;
			}
			async #closeMountedDirectory() {
				if (this.#directory !== undefined) {
					try {
						await this.#directory.close();
						this.#directory = undefined;
					} catch (cause) {
						const mountRoot = this.#mountRoot ?? this.path;
						throw ArtifactReaderFailure.withCleanup(cause, {
							reason: `DMG mounted directory remains owned: ${failureMessage(cause)}`,
							resources: [
								`DMG mounted directory at ${mountRoot}`,
								`DMG mount root ${mountRoot}`,
								...this.#devices.map((device) => `DMG device ${device}`)
							]
						});
					}
				}
			}
			/** Detach one device; return the failure only while it remains attached. */
			async #detach(device) {
				try {
					await runChecked(this.host, ["detach", device], undefined, { timeoutMs: HDIUTIL_COMMAND_TIMEOUT_MS });
					this.#provenance.push(command(["detach", device], ["mount"]));
					return undefined;
				} catch (cause) {
					return await this.#isAttached(device) ? cause : undefined;
				}
			}
			async #reconcileAttachState() {
				if (!this.#attachMayHaveMounted) return undefined;
				try {
					await this.#resolveAttachOwnership();
					return undefined;
				} catch (cause) {
					this.#ownershipUncertainty = failureMessage(cause);
					return cause;
				}
			}
			/** Treat unknown hdiutil state as attached during cleanup. */
			async #isAttached(device) {
				try {
					const parsed = await this.#readInfo();
					const isListed = parsed.images.some((image) => image["system-entities"].some((entity) => entity["dev-entry"] === device));
					if (isListed) {
						this.#inventoryConfirmedDevices.add(device);
						return true;
					}
					return !this.#inventoryConfirmedDevices.has(device);
				} catch {
					return true;
				}
			}
			async #ensureAttached(signal) {
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "DMG reader is closed");
				this.#initialization ??= this.#attach(signal);
				await this.#initialization;
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "DMG reader is closed");
			}
			async #trackDirectoryOperation(operation) {
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "DMG reader is closed");
				const running = Promise.resolve().then(operation);
				this.#activeDirectoryOperations.add(running);
				try {
					return await running;
				} finally {
					this.#activeDirectoryOperations.delete(running);
				}
			}
			async #attach(signal) {
				await this.#verify(signal);
				const baseline = await this.#readInfo();
				this.#baselineDevices = new Set(baseline.images.flatMap((image) => image["system-entities"].map(({ "dev-entry": device }) => device)));
				const mountRoot = await realpath(await mkdtemp(join(tmpdir(), "rea-dmg-")));
				this.#mountRoot = mountRoot;
				const arguments_ = [
					"attach",
					"-readonly",
					"-nobrowse",
					"-plist",
					"-mountroot",
					mountRoot,
					this.path
				];
				try {
					this.#attachMayHaveMounted = true;
					const attached = await runChecked(this.host, arguments_, signal, { timeoutMs: HDIUTIL_COMMAND_TIMEOUT_MS });
					this.#provenance.push(command(arguments_, ["read", "mount"]));
					this.#attachOutputReturned = true;
					let parsed;
					try {
						parsed = parseNativeDmgAttachOutput(attached.stdout);
					} catch (cause) {
						throw new ArtifactReaderFailure("format", "hdiutil returned a malformed attachment plist", { cause });
					}
					if (parsed["system-entities"].length === 0) throw new ArtifactReaderFailure("format", "hdiutil returned no attached devices");
					this.#attachOutput = parsed;
					const ownership = await this.#resolveAttachOwnership();
					if (ownership !== "owned") throw new ArtifactReaderFailure(ownership === "unknown" ? "unavailable" : "path", ownership === "unknown" ? `DMG attachment ownership is uncertain: ${this.#ownershipUncertainty ?? "no unique mount under the owned root"}` : "hdiutil did not mount a new image beneath the owned root");
					this.#directory = new DirectoryArtifactReader(mountRoot);
				} catch (cause) {
					if (cause instanceof NativeDmgCommandFailure) this.#provenance.push(command(arguments_, ["read", "mount"], cause.exitCode));
					if (cause instanceof NativeDmgCommandFailure && cause.stdout !== "") {
						try {
							this.#attachOutput = parseNativeDmgAttachOutput(cause.stdout);
							this.#attachOutputReturned = true;
						} catch {}
					}
					if (cause instanceof NativeDmgCommandFailure && cause.processNotStarted) {
						this.#attachMayHaveMounted = false;
						this.#ownershipUncertainty = undefined;
					}
					throw cause;
				}
			}
			async #verify(signal) {
				const arguments_ = ["verify", this.path];
				const deadline = performance.now() + HDIUTIL_COMMAND_TIMEOUT_MS;
				for (let attempt = 0;; attempt += 1) {
					this.#throwIfVerificationCancelled(signal);
					try {
						await runChecked(this.host, arguments_, signal, { timeoutMs: Math.max(1, Math.ceil(deadline - performance.now())) });
						this.#provenance.push(command(arguments_, ["read"]));
						return;
					} catch (cause) {
						if (!(cause instanceof NativeDmgCommandFailure)) throw cause;
						this.#provenance.push(command(arguments_, ["read"], cause.exitCode));
						if (cause.unrecognizedImage) {
							const unreadable = await this.#isUnreadableTarget(signal, cause);
							this.#throwIfVerificationCancelled(signal);
							if (unreadable) throw new NativeDmgCommandFailure({ reason: "io" }, cause.message, cause.stdout, {
								cause: cause.cause,
								...cause.exitCode === null ? {} : { exitCode: cause.exitCode }
							});
						}
						const delayMs = VERIFY_SETTLE_DELAYS_MS[attempt];
						if (cause.verifyDiagnostic !== "Resource temporarily unavailable" && !cause.unrecognizedImage || delayMs === undefined || deadline - performance.now() <= delayMs) throw cause;
						await (this.host.delay ?? delay)(delayMs);
						if (performance.now() >= deadline) throw cause;
					}
				}
			}
			async #readInfo() {
				const info = await runChecked(this.host, ["info", "-plist"], undefined, { timeoutMs: HDIUTIL_COMMAND_TIMEOUT_MS });
				try {
					return parseNativeDmgInfo(info.stdout);
				} catch (cause) {
					throw new ArtifactReaderFailure("format", "hdiutil info -plist returned malformed image inventory", { cause });
				}
			}
			async #resolveAttachOwnership() {
				const mountRoot = this.#mountRoot;
				if (mountRoot === undefined) throw new Error("DMG mount root is unavailable for ownership discovery");
				const ownership = resolveNativeDmgOwnership({
					info: await this.#readInfo(),
					...this.#attachOutput === undefined ? {} : { attachOutput: this.#attachOutput },
					attachOutputReturned: this.#attachOutputReturned,
					mountRoot,
					baselineDevices: this.#baselineDevices
				});
				if (ownership.status === "owned") {
					this.#devices = [...ownership.devices];
					if (ownership.source === "info") for (const device of ownership.devices) this.#inventoryConfirmedDevices.add(device);
					this.#attachMayHaveMounted = false;
					this.#ownershipUncertainty = undefined;
					return "owned";
				}
				if (ownership.status === "unknown") {
					this.#ownershipUncertainty = ownership.reason;
					return "unknown";
				}
				this.#attachMayHaveMounted = false;
				this.#ownershipUncertainty = undefined;
				this.#devices = [];
				return "none";
			}
			#cancelledVerification(cause) {
				return new NativeDmgCommandFailure({ reason: "cancelled" }, "DMG operation cancelled", "", { cause });
			}
			#throwIfVerificationCancelled(signal) {
				if (signal?.aborted === true) throw this.#cancelledVerification(signal.reason);
			}
			async #isUnreadableTarget(signal, primaryFailure) {
				let handle;
				try {
					({handle} = await openRegularFile(this.path, {
						symlinks: "follow",
						...signal === undefined ? {} : { signal }
					}));
				} catch (cause) {
					if (cause instanceof RegularFileAdmissionFailure) {
						this.#verificationProbeHandle = cause.owner;
						const cancellation = regularFileCancellation(cause.cause);
						const failure = cancellation === undefined ? primaryFailure : this.#cancelledVerification(cancellation.reason);
						throw ArtifactReaderFailure.withCleanup(failure, ArtifactReaderFailure.cleanupObservation(cause.cleanupCause, `DMG verification target descriptor ${this.path}`));
					}
					const cancellation = regularFileCancellation(cause);
					if (cancellation !== undefined) throw this.#cancelledVerification(cancellation.reason);
					if (cause instanceof NonRegularFileReadError) return false;
					return classifyCommandFailure(cause, undefined).reason === "io";
				}
				const owner = new OwnedFileHandle(handle);
				this.#verificationProbeHandle = owner;
				try {
					await owner.close();
					this.#verificationProbeHandle = undefined;
				} catch (cause) {
					throw ArtifactReaderFailure.withCleanup(signal?.aborted === true ? this.#cancelledVerification(signal.reason) : primaryFailure, ArtifactReaderFailure.cleanupObservation(cause, `DMG verification target descriptor ${this.path}`));
				}
				if (signal?.aborted === true) throw this.#cancelledVerification(signal.reason);
				return false;
			}
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		processNotStarted = (cause) => {
			if (!(cause instanceof Error)) return false;
			const syscall = Reflect.get(cause, "syscall");
			const code = Reflect.get(cause, "code");
			const errno = Reflect.get(cause, "errno");
			return typeof syscall === "string" && syscall.startsWith("spawn ") && (typeof code === "string" || typeof code === "number" || typeof errno === "number");
		};
		runChecked = async (host, arguments_, signal, options) => {
			let result;
			try {
				result = await host.run(arguments_, signal, options);
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure) throw cause;
				if (cause instanceof ExecFileOutputCancelledError) throw new NativeDmgCommandFailure({ reason: "cancelled" }, "DMG operation cancelled", execFileOutputFailure(cause)?.stdout ?? "", {
					cause,
					cancellation: { reason: cause.cause }
				});
				const output = execFileOutputFailure(cause);
				throw new NativeDmgCommandFailure(classifyCommandFailure(cause, arguments_[0]), `hdiutil ${arguments_[0] ?? "operation"} failed: ${describeCommandFailure(cause, arguments_)}`, output?.stdout ?? "", {
					cause,
					processNotStarted: processNotStarted(cause)
				});
			}
			if (result.exitCode !== 0) {
				const failure = {
					command: "/usr/bin/hdiutil",
					exitCode: result.exitCode,
					...result.cause === undefined ? {} : { code: processExitCode(result.cause) },
					stdout: result.stdout,
					...result.stderr === undefined ? {} : { stderr: result.stderr }
				};
				const classification = classifyCommandFailure(failure, arguments_[0]);
				const details = describeCommandFailure(failure, arguments_);
				const unknownVerifyFailure = arguments_[0] === "verify" && classification.reason === "unavailable";
				throw new NativeDmgCommandFailure(classification, unknownVerifyFailure ? `hdiutil verify failed; captured diagnostics do not establish the failure cause: ${details}` : `hdiutil ${arguments_[0] ?? "operation"} failed: ${details}`, result.stdout, {
					cause: result.cause ?? failure,
					exitCode: result.exitCode
				});
			}
			return {
				stdout: result.stdout,
				exitCode: 0
			};
		};
		describeCommandFailure = (cause, arguments_) => {
			const fields = {
				command: "/usr/bin/hdiutil",
				arguments: [...arguments_]
			};
			if (typeof cause === "object" && cause !== null) {
				for (const key of [
					"code",
					"exitCode",
					"errno",
					"syscall",
					"signal",
					"stdout",
					"stderr"
				]) {
					const value = Reflect.get(cause, key);
					if (typeof value === "string" || typeof value === "number") fields[key] = value;
				}
				const code = Reflect.get(cause, "code");
				if (typeof code === "number") fields.exitCode = code;
			}
			if (cause instanceof ArtifactReaderFailure) fields.message = cause.message;
			else if (cause instanceof Error) fields.message = cause.message;
			return JSON.stringify(fields);
		};
		processExitCode = (cause) => {
			if (typeof cause !== "object" || cause === null) return undefined;
			const exitCode = Reflect.get(cause, "exitCode");
			if (typeof exitCode === "number") return exitCode;
			const code = Reflect.get(cause, "code");
			return typeof code === "number" ? code : undefined;
		};
		processOutput = (cause, field) => {
			if (typeof cause !== "object" || cause === null) return "";
			const value = Reflect.get(cause, field);
			return typeof value === "string" ? value : "";
		};
		classifyCommandFailure = (cause, operation) => {
			if (typeof cause !== "object" || cause === null) return { reason: "unavailable" };
			const code = Reflect.get(cause, "code");
			const exitCode = Reflect.get(cause, "exitCode");
			if (typeof code === "number" || typeof exitCode === "number") {
				if (operation !== "verify") return { reason: "unavailable" };
				return classifyVerifyFailure(processOutput(cause, "stdout"), processOutput(cause, "stderr"));
			}
			if (code === "ENOENT") {
				const syscall = Reflect.get(cause, "syscall");
				return { reason: typeof syscall === "string" && syscall.startsWith("spawn") ? "unavailable" : "io" };
			}
			if (code === "EACCES" || code === "EPERM" || code === "EIO" || code === "ENOTDIR" || code === "EISDIR" || code === "ENODEV" || code === "EROFS" || code === "EMFILE" || code === "ENFILE") return { reason: "io" };
			return { reason: "unavailable" };
		};
		classifyVerifyFailure = (stdout, stderr) => {
			const diagnostic = verifyFailureDiagnostic(stdout, stderr);
			const reason = verifyFailureReason(diagnostic);
			const untranslated = reason === undefined ? untranslatedVerifyFailure(stdout, stderr) : undefined;
			return {
				...untranslated,
				reason: reason ?? untranslated?.reason ?? "unavailable",
				...diagnostic === undefined ? {} : { verifyDiagnostic: diagnostic }
			};
		};
		verifyFailureReason = (diagnostic) => {
			switch (diagnostic) {
				case "image not recognized":
				case "image not recognised": return "format";
				case "invalid checksum":
				case "image data corrupted": return "integrity";
				case "No such file or directory":
				case "Permission denied":
				case "Input/output error": return "io";
				case "Resource temporarily unavailable": return "unavailable";
				default: return undefined;
			}
		};
		verifyFailureDiagnostic = (stdout, stderr) => {
			const prefix = "hdiutil: verify failed - ";
			return outputLines(stdout, stderr).find((line) => line.startsWith(prefix))?.slice(prefix.length);
		};
		INVALID_CHECKSUM_LINE = /^hdiutil: verify: checksum of ".*" is INVALID$/u;
		UNRECOGNIZED_IMAGE_LINE = /^hdiutil: verify: unable to recognize ".*" as a disk image\./u;
		untranslatedVerifyFailure = (stdout, stderr) => {
			const lines = outputLines(stdout, stderr);
			if (lines.some((line) => INVALID_CHECKSUM_LINE.test(line))) return { reason: "integrity" };
			if (lines.some((line) => UNRECOGNIZED_IMAGE_LINE.test(line))) return {
				reason: "unavailable",
				unrecognizedImage: true
			};
			return undefined;
		};
		outputLines = (stdout, stderr) => `${stdout}\n${stderr}`.split(/\r?\n/u).map((line) => line.trim());
		command = (arguments_, effects, exitCode = 0) => ({
			tool: "/usr/bin/hdiutil",
			arguments: [...arguments_],
			tool_version: null,
			executable_sha256: null,
			exit_code: exitCode,
			effects
		});
	})))();
}

//#endregion
//#region dist/artifacts/NodeSeaArtifactReader.js
function* seaMembers(decoded) {
	const registry = new ArtifactPathRegistry();
	const claimed = new Set();
	const reserve = (path) => {
		if (claimed.has(path)) throw new ArtifactReaderFailure("path", `Node SEA entry path collides: ${path}`);
		registry.add(path, "file");
		claimed.add(path);
		return path;
	};
	const mappedPath = (raw, fallback) => {
		try {
			const normalized = normalizeArtifactPath(raw);
			if (normalized !== "__node_sea__" && !normalized.startsWith("__node_sea__/")) return reserve(normalized);
		} catch (cause) {
			if (!(cause instanceof ArtifactReaderFailure) || cause.reason !== "path") throw cause;
		}
		return reserve(fallback);
	};
	if (decoded.mainScript !== null) yield {
		path: mappedPath(decoded.codePath, MAIN_FALLBACK_PATH),
		sourcePath: decoded.codePath,
		role: "main-script",
		range: decoded.mainScript
	};
	if (decoded.snapshot !== null) yield {
		path: reserve(SNAPSHOT_PATH),
		sourcePath: SNAPSHOT_PATH,
		role: "snapshot",
		range: decoded.snapshot
	};
	if (decoded.codeCache !== null) yield {
		path: reserve(CODE_CACHE_PATH),
		sourcePath: CODE_CACHE_PATH,
		role: "code-cache",
		range: decoded.codeCache
	};
	for (const [ordinal, asset] of decoded.assets.entries()) yield {
		path: mappedPath(asset.name, `${ASSET_FALLBACK_PREFIX}${String(ordinal)}`),
		sourcePath: asset.name,
		role: "asset",
		range: asset.range
	};
}
var SNAPSHOT_PATH, CODE_CACHE_PATH, MAIN_FALLBACK_PATH, ASSET_FALLBACK_PREFIX, NodeSeaArtifactReader, formatFailure;
function init_NodeSeaArtifactReader() {
	return (init_NodeSeaArtifactReader = __esmMin((() => {
		init_artifactExpansionBudget();
		init_ArtifactPaths();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		init_NodeSeaBlob();
		init_NodeSeaLocation();
		init_readFileHandleChunks();
		init_ArtifactFileSource();
		SNAPSHOT_PATH = "__node_sea__/snapshot";
		CODE_CACHE_PATH = "__node_sea__/code-cache";
		MAIN_FALLBACK_PATH = "__node_sea__/main.cjs";
		ASSET_FALLBACK_PREFIX = "__node_sea__/assets/";
		NodeSeaArtifactReader = class {
			format = "node-sea";
			#scope = new ArtifactResourceScope();
			#entries = new Map();
			#streams = new Set();
			#source;
			#prepared;
			#header;
			#closing = false;
			constructor(path, admitted) {
				this.#source = new ArtifactFileSource(path, "Node SEA", admitted);
			}
			formatMetadata() {
				if (this.#header === undefined) return undefined;
				return {
					...this.#header,
					exec_argv: [...this.#header.exec_argv]
				};
			}
			async prepareContainer(expectedSha256, signal) {
				await this.#scope.run(async () => {
					this.#assertOpen(signal);
					await this.#source.bindSha256(expectedSha256, signal);
				});
			}
			async *entries(signal, options) {
				await this.#scope.run(async () => {
					this.#assertOpen(signal);
					this.#prepared ??= this.#prepare(signal);
					await this.#prepared;
					await this.#source.read(signal);
				});
				const contradiction = this.#header?.fuse_contradiction;
				if (contradiction !== null && contradiction !== undefined) options?.onCoverage?.({
					status: "complete",
					limitations: [contradiction]
				});
				let index = 0;
				for (const entry of this.#entries.values()) {
					if (index % 256 === 0) await setImmediate();
					index += 1;
					this.#assertOpen(signal);
					yield copyArtifactEntry(entry);
				}
			}
			async open(entry, signal) {
				return this.#scope.run(async () => {
					this.#assertOpen(signal);
					const stored = this.#entries.get(entry.adapterKey);
					if (stored === undefined || !sameArtifactEntry(entry, stored)) throw new ArtifactReaderFailure("integrity", "Node SEA entry does not match its owning inventory");
					const { handle } = await this.#source.read(signal);
					this.#assertOpen(signal);
					if (stored.byteOffset === null || stored.declaredSize === null) throw formatFailure("member has no physical byte range");
					const source = stored.declaredSize === 0 ? Readable.from([]) : readFileHandleChunks(handle, {
						start: stored.byteOffset,
						end: stored.byteOffset + stored.declaredSize - 1,
						signal,
						cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", "Node SEA read cancelled", { cause: reason })
					});
					const output = this.#memberStream(stored, signal);
					output.on("error", () => undefined);
					this.#streams.add(output);
					void this.#scope.run(() => new Promise((resolve) => {
						pipeline$1(source, output, () => {
							this.#streams.delete(output);
							resolve();
						});
					})).catch((cause) => output.destroy(cause instanceof Error ? cause : new Error("Node SEA stream ownership failed", { cause })));
					return output;
				});
			}
			async close() {
				this.#closing = true;
				for (const stream of this.#streams) stream.destroy(new ArtifactReaderFailure("unavailable", "Node SEA reader closed"));
				await this.#scope.close();
				await this.#source.close();
				this.#entries.clear();
			}
			provenance() {
				return [];
			}
			#assertOpen(signal) {
				assertArtifactReadActive(signal);
				if (this.#closing) throw new ArtifactReaderFailure("unavailable", "Node SEA reader is closed");
			}
			async #prepare(signal) {
				const { handle, initial } = await this.#source.read(signal);
				const location = await locateNodeSea(handle, initial.size, signal);
				if (location === undefined) throw formatFailure("blob was not found");
				if (location.blobLength > 268435456) throw new ArtifactReaderFailure("limit", NODE_SEA_BLOB_TOO_LARGE, { boundary: "memory" });
				const decoded = await decodeNodeSeaBlob(await readNodeSeaBlob(handle, location, initial.size, signal), signal);
				const fuse = await scanNodeSeaFuse(handle, initial.size, signal);
				let declaredBytes = 0n;
				const expansionBudget = BigInt(artifactExpansionBudgetBytes(location.blobLength));
				let index = 0;
				for (const member of seaMembers(decoded)) {
					if (index % 256 === 0) await setImmediate();
					this.#assertOpen(signal);
					declaredBytes += BigInt(member.range.length);
					if (declaredBytes > expansionBudget) throw new ArtifactReaderFailure("limit", `Node SEA readable entries declare ${String(declaredBytes)} bytes, exceeding this blob's ${String(expansionBudget)}-byte expansion budget`, { boundary: "memory" });
					const start = location.blobOffset + member.range.offset;
					if (start > initial.size || member.range.length > initial.size - start) throw formatFailure(`member exceeds the carrier: ${member.path}`);
					const entry = {
						path: member.path,
						kind: "file",
						declaredSize: member.range.length,
						compressedSize: null,
						executable: false,
						encrypted: false,
						byteOffset: start,
						declaredIntegrity: null,
						unpacked: false,
						limitations: [],
						adapterKey: `node-sea:${String(index)}`,
						formatMetadata: {
							kind: "node-sea-entry",
							role: member.role,
							source_path: member.sourcePath,
							index
						},
						sourcePath: member.sourcePath
					};
					this.#entries.set(entry.adapterKey, entry);
					index += 1;
				}
				this.#header = {
					kind: "node-sea",
					magic: decoded.magic,
					flags: decoded.flags,
					disable_experimental_sea_warning: decoded.disableExperimentalSeaWarning,
					use_snapshot: decoded.useSnapshot,
					use_code_cache: decoded.useCodeCache,
					include_assets: decoded.includeAssets,
					include_exec_argv: decoded.includeExecArgv,
					exec_argv_extension: decoded.execArgvExtension,
					exec_argv: [...decoded.execArgv],
					code_path: decoded.codePath,
					carrier: location.carrier,
					blob_offset: location.blobOffset,
					blob_length: location.blobLength,
					fuse_state: fuse.fuseState,
					fuse_sentinel: fuse.fuseSentinel,
					fuse_contradiction: fuse.fuseContradiction
				};
				await this.#source.read(signal);
			}
			#memberStream(entry, signal) {
				let bytes = 0;
				const check = async () => {
					if (bytes !== entry.declaredSize) throw formatFailure(`member ended early: ${entry.path}`);
					await this.#source.read(signal);
				};
				return new Transform({
					transform(chunk, _encoding, callback) {
						bytes += chunk.length;
						callback(null, chunk);
					},
					flush(callback) {
						void check().then(() => callback(), (cause) => callback(cause instanceof Error ? cause : new Error("Node SEA read failed", { cause })));
					}
				});
			}
		};
		formatFailure = (detail) => new ArtifactReaderFailure("format", `Node SEA blob is malformed: ${detail}`);
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PythonBytecode.js
var PYTHON_BYTECODE_MAGICS, RECONSTRUCTED_PYTHON_HEADER_LIMITATION, pythonVersionForMagic, reconstructedPycHeader, isHeaderlessPythonCode;
function init_PythonBytecode() {
	return (init_PythonBytecode = __esmMin((() => {
		PYTHON_BYTECODE_MAGICS = {
			"420d0d0a": "3.7",
			"550d0d0a": "3.8",
			"610d0d0a": "3.9",
			"6f0d0d0a": "3.10",
			a70d0d0a: "3.11",
			cb0d0d0a: "3.12",
			f30d0d0a: "3.13",
			"2b0e0d0a": "3.14"
		};
		RECONSTRUCTED_PYTHON_HEADER_LIMITATION = "Python bytecode header was reconstructed from the archive Python magic; this digest covers the derived file.";
		pythonVersionForMagic = (magic) => PYTHON_BYTECODE_MAGICS[magic.toString("hex")];
		reconstructedPycHeader = (magic) => {
			const header = Buffer.alloc(16);
			magic.copy(header, 0, 0, 4);
			return header;
		};
		isHeaderlessPythonCode = (prefix) => prefix.length === 4 && !(prefix[2] === 13 && prefix[3] === 10) && (prefix[0] === 99 || prefix[0] === 227);
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyInstallerMetadata.js
var pythonVersion, cookieMetadata, scriptPythonMagic, entryMetadata, cArchiveEntryMetadata, dependencyMetadata, pyzEntryEncrypted, pyzEntryMetadata;
function init_PyInstallerMetadata() {
	return (init_PyInstallerMetadata = __esmMin((() => {
		init_PythonBytecode();
		pythonVersion = (value) => value >= 100 ? {
			major: Math.floor(value / 100),
			minor: value % 100
		} : value >= 20 ? {
			major: Math.floor(value / 10),
			minor: value % 10
		} : undefined;
		cookieMetadata = (cookie, entries, encryptionMarker) => {
			const version = pythonVersion(cookie.pythonVersion);
			return {
				kind: "pyinstaller",
				layout_version: cookie.layout,
				archive_start: cookie.archiveStart,
				archive_size: cookie.packageLength,
				cookie_offset: cookie.cookieOffset,
				toc_offset: cookie.tocOffset,
				toc_size: cookie.tocLength,
				entry_count: entries.length,
				runtime_option_count: entries.filter((entry) => entry.typeCode === "o").length,
				external_dependency_count: entries.filter((entry) => entry.typeCode === "d").length,
				python_version_raw: cookie.pythonVersion,
				python_major: version?.major ?? null,
				python_minor: version?.minor ?? null,
				python_library: cookie.pythonLibrary,
				encryption_marker_present: encryptionMarker
			};
		};
		scriptPythonMagic = (cookie, archives) => {
			const version = pythonVersion(cookie.pythonVersion);
			if (version === undefined) return undefined;
			let selected;
			for (const archive of archives) {
				const magic = archive.pythonMagic;
				if (pythonVersionForMagic(magic) !== `${String(version.major)}.${String(version.minor)}` || selected !== undefined && !selected.equals(magic)) return undefined;
				selected = magic;
			}
			return selected;
		};
		entryMetadata = (source, bytecode, header) => ({
			kind: "pyinstaller-entry",
			...source,
			bytecode_header: bytecode ? header === undefined ? "unknown" : "derived" : "not-bytecode",
			bytecode_magic: header?.subarray(0, 4).toString("hex") ?? null,
			pyz_status: "not-pyz",
			directory_record_offset: null,
			directory_record_size: null,
			pyz_sha256: null,
			pyz_python_magic: null,
			pyz_python_version: null,
			pyz_entry_count: null,
			encryption_source: null
		});
		cArchiveEntryMetadata = (entry, header, archive, encryptionMarker = false) => ({
			...entryMetadata({
				container: "carchive",
				container_name: null,
				index: entry.index,
				source_name: entry.name,
				type_code: entry.typeCode,
				relative_offset: entry.offset,
				compression_flag: entry.compressionFlag === 1 ? 1 : 0
			}, [
				"s",
				"m",
				"M"
			].includes(entry.typeCode), header),
			...entry.typeCode === "d" ? dependencyMetadata(entry.name) : {},
			pyz_status: archive?.kind === "entries" ? "decoded" : archive === undefined ? "not-pyz" : "opaque",
			directory_record_offset: entry.tocRecordOffset,
			directory_record_size: entry.tocRecordLength,
			pyz_sha256: archive?.sha256 ?? null,
			pyz_python_magic: archive?.pythonMagic.toString("hex") ?? null,
			pyz_python_version: archive === undefined ? null : pythonVersionForMagic(archive.pythonMagic) ?? null,
			pyz_entry_count: archive?.kind === "entries" ? archive.entries.length : null,
			encryption_source: archive !== undefined && encryptionMarker ? "carchive-marker" : null
		});
		dependencyMetadata = (source) => {
			const colon = source.indexOf(":");
			const valid = colon > 0 && colon < source.length - 1;
			return {
				dependency_status: valid ? "unresolved" : "invalid-reference",
				dependency_archive: valid ? source.slice(0, colon) : null,
				dependency_member: valid ? source.slice(colon + 1) : null
			};
		};
		pyzEntryEncrypted = (entry, encryptionMarker) => encryptionMarker && entry.length > 0;
		pyzEntryMetadata = (container, entry, header, encryptionMarker) => ({
			...entryMetadata({
				container: "pyz",
				container_name: container.name,
				index: entry.index,
				source_name: entry.name,
				type_code: entry.typeCode,
				relative_offset: entry.offset,
				compression_flag: entry.compressionFlag
			}, entry.typeCode === 0 || entry.typeCode === 1, header),
			encryption_source: pyzEntryEncrypted(entry, encryptionMarker) ? "carchive-marker" : null
		});
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyInstallerMemberStream.js
var readPyInstallerMemberPrefix, pyInstallerMemberStream, asError;
function init_PyInstallerMemberStream() {
	return (init_PyInstallerMemberStream = __esmMin((() => {
		init_ArtifactReader();
		init_ArtifactHash();
		readPyInstallerMemberPrefix = async (openSource, options, length) => {
			const stopped = new AbortController();
			const prefixComplete = new Error("PyInstaller member prefix observed");
			const signal = AbortSignal.any([options.signal, stopped.signal]);
			const source = await openSource(signal);
			const stream = pyInstallerMemberStream(source, {
				...options,
				header: undefined,
				signal
			});
			const prefix = Buffer.alloc(length);
			let copied = 0;
			stream.output.on("data", (chunk) => {
				copied += chunk.copy(prefix, copied, 0, length - copied);
				if (copied === length) stopped.abort(prefixComplete);
			});
			try {
				await stream.completion;
			} catch (cause) {
				if (!(cause instanceof ArtifactReaderFailure) || cause.reason !== "cancelled" || cause.cause !== prefixComplete) throw cause;
			}
			abortIfNeeded(options.signal);
			return prefix.subarray(0, copied);
		};
		pyInstallerMemberStream = (source, options) => {
			let bytes = 0;
			let headerSent = false;
			let completing = false;
			let failure;
			const prependHeader = () => {
				if (!headerSent && options.header !== undefined) output.push(options.header);
				headerSent = true;
			};
			const output = new Transform({
				transform(chunk, _encoding, callback) {
					try {
						abortIfNeeded(options.signal);
						bytes += chunk.length;
						if (bytes > options.maxBytes) throw new ArtifactReaderFailure("limit", "PyInstaller member exceeds its plaintext budget");
						options.charge?.(chunk.length);
						prependHeader();
						callback(null, chunk);
					} catch (cause) {
						callback(asError(cause));
					}
				},
				flush(callback) {
					completing = true;
					void (async () => {
						abortIfNeeded(options.signal);
						if (inflate !== undefined && inflate.bytesWritten !== options.sourceBytes) throw new ArtifactReaderFailure("integrity", "Compressed PyInstaller member did not consume its complete declared source span");
						if (options.expectedBytes !== undefined && bytes !== options.expectedBytes) throw new ArtifactReaderFailure("integrity", "PyInstaller member size disagrees with its declaration or previous observation");
						await options.complete?.(bytes);
						abortIfNeeded(options.signal);
						prependHeader();
					})().then(() => {
						completing = false;
						try {
							abortIfNeeded(options.signal);
						} catch (cause) {
							callback(asError(cause));
							return;
						}
						callback();
					}, (cause) => {
						completing = false;
						callback(asError(cause));
					});
				}
			});
			output.on("error", () => undefined);
			const onAbort = () => {
				if (completing) return;
				if (!source.readableEnded && !source.destroyed) return;
				output.destroy(new ArtifactReaderFailure("cancelled", "PyInstaller member read cancelled", { cause: options.signal.reason }));
			};
			options.signal.addEventListener("abort", onAbort, { once: true });
			const onSourceFailure = (cause) => {
				failure ??= cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("io", "PyInstaller member source could not be read", { cause });
				output.destroy(failure);
			};
			source.on("error", onSourceFailure);
			const inflate = options.compressed ? createInflate() : undefined;
			inflate?.on("error", (cause) => {
				failure ??= cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("format", "Compressed PyInstaller member is not a complete zlib stream", { cause });
				output.destroy(failure);
			});
			const completion = (inflate === undefined ? pipeline(source, output) : pipeline(source, inflate, output)).catch((cause) => {
				throw failure ?? cause;
			}).finally(() => {
				options.signal.removeEventListener("abort", onAbort);
				source.removeListener("error", onSourceFailure);
			});
			void completion.catch(() => undefined);
			if (options.signal.aborted) onAbort();
			return {
				output,
				completion
			};
		};
		asError = (cause) => cause instanceof Error ? cause : new ArtifactReaderFailure("format", "PyInstaller member read failed", { cause });
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyInstallerPyzStore.js
var MAX_PRIVATE_PYZ_IMAGES, PyInstallerPyzStore;
function init_PyInstallerPyzStore() {
	return (init_PyInstallerPyzStore = __esmMin((() => {
		init_OwnedFileHandle();
		init_RegularFile();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_ArtifactHash();
		init_readArtifactFileChunks();
		init_PyInstallerMemberStream();
		init_ArtifactFileAdmission();
		init_PythonBytecode();
		MAX_PRIVATE_PYZ_IMAGES = 128;
		PyInstallerPyzStore = class {
			#root;
			#serial = 0;
			#owners = new Map();
			#cleanup = new ArtifactResourceScope();
			#images = new Map();
			reserveImages(count) {
				if (count > MAX_PRIVATE_PYZ_IMAGES) throw new ArtifactReaderFailure("limit", "PyInstaller compressed PYZ images exceed the 128-file private storage budget", { boundary: "capacity" });
			}
			async bytecodeHeader(handle, archiveStart, entry, magic, signal) {
				const unchanged = {
					header: undefined,
					limitation: undefined
				};
				if (magic === undefined) return unchanged;
				if (entry.typeCode === "s") return {
					header: reconstructedPycHeader(magic),
					limitation: undefined
				};
				if (entry.typeCode !== "m" && entry.typeCode !== "M") return unchanged;
				const prefix = await readPyInstallerMemberPrefix(async (active) => (await this.memberSource({
					kind: "carchive",
					archiveStart,
					source: entry,
					header: undefined
				}, handle, active)).source, {
					sourceBytes: entry.compressedSize,
					compressed: entry.compressionFlag === 1,
					expectedBytes: entry.uncompressedSize,
					maxBytes: entry.uncompressedSize,
					signal: signal ?? new AbortController().signal
				}, 4);
				return isHeaderlessPythonCode(prefix) ? {
					header: reconstructedPycHeader(magic),
					limitation: undefined
				} : {
					header: undefined,
					limitation: "CArchive module is not identified as headerless marshal code; its original bytes are preserved without reconstructing a Python bytecode header."
				};
			}
			async spool(handle, archiveStart, entry, signal) {
				abortIfNeeded(signal);
				if (entry.compressedSize === 0) throw new ArtifactReaderFailure("format", "Compressed PYZ image has no zlib bytes");
				this.#root ??= await mkdtemp(join(tmpdir(), "rea-pyz-"));
				const path = join(this.#root, String(this.#serial++));
				const writer = await open(path, "wx", 384);
				this.#retain(path, new OwnedFileHandle(writer));
				abortIfNeeded(signal);
				const source = readArtifactFileChunks(handle, {
					start: archiveStart + entry.offset,
					end: archiveStart + entry.offset + entry.compressedSize - 1,
					signal
				});
				const stream = pyInstallerMemberStream(source, {
					sourceBytes: entry.compressedSize,
					compressed: true,
					header: undefined,
					expectedBytes: entry.uncompressedSize,
					maxBytes: entry.uncompressedSize,
					signal: signal ?? new AbortController().signal
				});
				const copied = this.#writeImage(writer, stream.output, signal);
				const outcomes = await Promise.allSettled([stream.completion, copied]);
				const copy = outcomes[1];
				if (copy?.status === "rejected") throw copy.reason;
				const decoded = outcomes[0];
				if (decoded?.status === "rejected") throw decoded.reason;
				await this.release(writer);
				abortIfNeeded(signal);
				const { handle: opened, initial } = await this.#admit(path, signal);
				this.#images.set(opened, {
					path,
					initial
				});
				return {
					handle: opened,
					start: 0
				};
			}
			async release(handle) {
				const owner = this.#owners.get(handle);
				if (owner === undefined) return;
				const outcome = await this.#cleanup.release(owner);
				if (outcome.kind === "failed") throw outcome.cause;
				this.#owners.delete(handle);
			}
			async memberSource(read, root, signal) {
				let handle = read.kind === "carchive" ? root : read.handle;
				if (handle === undefined) throw new ArtifactReaderFailure("unavailable", "PyInstaller archive is closed");
				const image = read.kind === "pyz" ? this.#images.get(handle) : undefined;
				let verify;
				let close;
				if (image !== undefined) {
					({handle} = await this.#admit(image.path, signal));
					const opened = handle;
					verify = () => this.#verifyImage(opened, image);
					close = async (primary) => {
						try {
							await this.release(opened);
						} catch (cause) {
							throw ArtifactReaderFailure.withCleanup(primary ?? cause, ArtifactReaderFailure.cleanupObservation(cause, image.path));
						}
					};
					await verify();
				}
				abortIfNeeded(signal);
				const start = read.kind === "carchive" ? read.archiveStart + read.source.offset : read.offset;
				const length = read.kind === "carchive" ? read.source.compressedSize : read.length;
				const source = length === 0 ? Readable.from([]) : readArtifactFileChunks(handle, {
					start,
					end: start + length - 1,
					signal
				});
				source.on("error", () => undefined);
				return {
					source,
					...verify === undefined ? {} : { verify },
					...close === undefined ? {} : { close }
				};
			}
			async close() {
				await this.#cleanup.close();
				this.#owners.clear();
				if (this.#root !== undefined) {
					try {
						await rm(this.#root, {
							recursive: true,
							force: true
						});
					} catch (cause) {
						throw ArtifactReaderFailure.withCleanup(cause, ArtifactReaderFailure.cleanupObservation(cause, this.#root));
					}
					this.#root = undefined;
				}
				this.#images.clear();
			}
			async #admit(path, signal) {
				try {
					const source = await openRegularFile(path, {
						symlinks: "reject",
						signal
					});
					this.#retain(path, new OwnedFileHandle(source.handle));
					return source;
				} catch (cause) {
					if (cause instanceof RegularFileAdmissionFailure) this.#retain(path, cause.owner);
					throw artifactFileAdmissionFailure(path, "PyInstaller", cause);
				}
			}
			#retain(path, handle) {
				const owner = {
					kind: "file-handle",
					resource: path,
					handle
				};
				this.#owners.set(handle.handle, owner);
				this.#cleanup.retain(owner);
			}
			async #writeImage(handle, source, signal) {
				let position = 0;
				for await (const chunk of source) {
					if (signal?.aborted) continue;
					let offset = 0;
					try {
						while (offset < chunk.length) {
							const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset, position);
							if (bytesWritten === 0) throw new ArtifactReaderFailure("io", "Private PYZ write made no progress");
							offset += bytesWritten;
							position += bytesWritten;
							if (signal?.aborted) break;
						}
					} catch (cause) {
						const failure = cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("io", "Private PYZ image could not be written", { cause });
						source.destroy(failure);
						throw failure;
					}
				}
				abortIfNeeded(signal);
			}
			async #verifyImage(handle, image) {
				const states = await Promise.all([handle.stat(), lstat(image.path)]);
				if (states.some((state) => !sameRegularFileState(image.initial, state))) throw new ArtifactReaderFailure("integrity", "Private PYZ image changed after parsing");
			}
		};
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/CArchiveMembers.js
var CRYPTO_KEY_NAME, hasEncryptionMarker, projectStoredMember, projectPyzContainer, projectPyzMember, canonicalMemberPath, sourceByteOffset, pyzMemberPath, projectEntry, sealMember;
function init_CArchiveMembers() {
	return (init_CArchiveMembers = __esmMin((() => {
		init_ArtifactReader();
		init_CArchiveLayout();
		init_PythonBytecode();
		init_PyInstallerMetadata();
		CRYPTO_KEY_NAME = "pyimod00_crypto_key";
		hasEncryptionMarker = (entries) => entries.some((entry) => entry.name === CRYPTO_KEY_NAME && (entry.typeCode === "m" || entry.typeCode === "M") && entry.uncompressedSize > 0);
		projectStoredMember = (entry, archiveStart, bytecode, pathDialect) => {
			if (isCArchiveDeclaration(entry)) return {
				entry: projectEntry({
					path: `__pyinstaller__/${entry.typeCode === "o" ? "runtime-options" : "dependencies"}/${String(entry.index)}`,
					kind: "metadata",
					declaredSize: entry.uncompressedSize,
					compressedSize: entry.compressedSize,
					byteOffset: null,
					limitations: entry.typeCode === "d" ? ["Multipackage dependency bytes belong to another executable and remain unresolved."] : [],
					adapterKey: `carchive:${String(entry.index)}:${entry.name}`,
					formatMetadata: cArchiveEntryMetadata(entry)
				}),
				read: undefined
			};
			const { header } = bytecode;
			const path = canonicalMemberPath(entry.name, pathDialect);
			const symlink = entry.typeCode === "n";
			const limitations = [];
			if (symlink) limitations.push("PyInstaller symlink target was not read.");
			if (header !== undefined) limitations.push(RECONSTRUCTED_PYTHON_HEADER_LIMITATION);
			if (bytecode.limitation !== undefined) limitations.push(bytecode.limitation);
			const declaredSize = entry.uncompressedSize;
			return {
				entry: projectEntry({
					path,
					kind: symlink ? "symlink" : "file",
					declaredSize,
					compressedSize: entry.compressedSize,
					executable: entry.typeCode === "b",
					byteOffset: sourceByteOffset(entry, archiveStart),
					limitations,
					adapterKey: `carchive:${String(entry.index)}:${entry.name}`,
					formatMetadata: cArchiveEntryMetadata(entry, header)
				}),
				read: {
					kind: "carchive",
					archiveStart,
					source: entry,
					header
				}
			};
		};
		projectPyzContainer = (entry, archiveStart, image, encrypted, pathDialect) => {
			const { archive } = image;
			const path = canonicalMemberPath(entry.name, pathDialect);
			const byteOffset = sourceByteOffset(entry, archiveStart);
			const limitations = [];
			if (archive.kind === "opaque") return {
				entry: projectEntry({
					path,
					declaredSize: entry.uncompressedSize,
					compressedSize: entry.compressedSize,
					byteOffset,
					encrypted: false,
					limitations: [
						...limitations,
						archive.limitation,
						...encrypted ? ["PYZ entries are encrypted and were not decoded."] : []
					],
					adapterKey: `carchive:${String(entry.index)}:${entry.name}`,
					formatMetadata: cArchiveEntryMetadata(entry, undefined, archive, encrypted)
				}),
				read: entry.compressionFlag === 1 ? {
					kind: "pyz",
					handle: image.handle,
					offset: image.start,
					length: entry.uncompressedSize,
					compressed: false,
					uncompressedSize: entry.uncompressedSize,
					header: undefined
				} : {
					kind: "carchive",
					archiveStart,
					source: entry,
					header: undefined
				}
			};
			return {
				entry: projectEntry({
					path,
					kind: "directory",
					declaredSize: entry.uncompressedSize,
					compressedSize: entry.compressedSize,
					byteOffset,
					limitations: [
						...limitations,
						`PyInstaller PYZ sha256 ${archive.sha256}.`,
						...encrypted ? ["PYZ entries are encrypted and were not decoded."] : []
					],
					adapterKey: `carchive:${String(entry.index)}:${entry.name}`,
					formatMetadata: cArchiveEntryMetadata(entry, undefined, archive, encrypted)
				}),
				read: undefined
			};
		};
		projectPyzMember = (container, item, encryptionMarker, pythonMagic, pathDialect, range) => {
			const path = pyzMemberPath(canonicalMemberPath(container.name, pathDialect), item, pathDialect);
			const encrypted = pyzEntryEncrypted(item, encryptionMarker);
			if (item.namespace) return {
				entry: projectEntry({
					path,
					kind: "metadata",
					declaredSize: 0,
					compressedSize: item.length,
					encrypted,
					byteOffset: null,
					limitations: ["Namespace package has no importable bytecode; its declared payload is not materialized.", ...encrypted ? ["PYZ namespace payload is declared encrypted and is not materialized."] : []],
					adapterKey: `pyz:${String(container.index)}:${String(item.index)}:${path}`,
					formatMetadata: pyzEntryMetadata(container, item, undefined, encryptionMarker)
				}),
				read: undefined
			};
			const header = !encrypted && pythonMagic !== undefined && (item.typeCode === 0 || item.typeCode === 1) ? reconstructedPycHeader(pythonMagic) : undefined;
			const limitations = [];
			if (encrypted) limitations.push("PYZ entry is encrypted and was not decoded.");
			if (header !== undefined) limitations.push(RECONSTRUCTED_PYTHON_HEADER_LIMITATION);
			limitations.push("PYZ tables declare compressed lengths; the uncompressed size is unknown until decoding.");
			return {
				entry: projectEntry({
					path,
					declaredSize: null,
					compressedSize: item.length,
					byteOffset: null,
					encrypted,
					limitations,
					adapterKey: `pyz:${String(container.index)}:${String(item.index)}:${path}`,
					formatMetadata: pyzEntryMetadata(container, item, header, encryptionMarker)
				}),
				read: range === undefined ? undefined : {
					kind: "pyz",
					...range,
					compressed: true,
					uncompressedSize: undefined,
					header
				}
			};
		};
		canonicalMemberPath = (storedName, pathDialect) => pathDialect === "windows" ? storedName.replaceAll("\\", "/") : storedName;
		sourceByteOffset = (entry, archiveStart) => entry.compressionFlag === 0 ? archiveStart + entry.offset : null;
		pyzMemberPath = (container, item, pathDialect) => {
			if (item.typeCode === 2) return `${container}/${canonicalMemberPath(item.name, pathDialect)}`;
			const dotted = item.name.replaceAll(".", "/");
			if (item.namespace) return `${container}/${dotted}`;
			if (item.package) return `${container}/${dotted}/__init__.pyc`;
			return `${container}/${dotted}.pyc`;
		};
		projectEntry = (input) => ({
			path: input.path,
			sourcePath: input.formatMetadata.source_name,
			kind: input.kind ?? "file",
			declaredSize: input.declaredSize,
			compressedSize: input.compressedSize,
			executable: input.executable === true,
			encrypted: input.encrypted === true,
			byteOffset: input.byteOffset,
			declaredIntegrity: null,
			unpacked: false,
			limitations: input.limitations,
			adapterKey: input.adapterKey,
			formatMetadata: input.formatMetadata
		});
		sealMember = (member) => ({
			...member,
			entry: copyArtifactEntry(member.entry)
		});
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/MarshalSubset.js
var MAX_DEPTH, MAX_NODES, MAX_SEQUENCE, MAX_STRING_BYTES, FLAG_REF, readMarshalSubset, readObject, storeScalar, readSequence, readReference, readShortAscii, readCountedAscii, readAsciiBytes, readUtf8, readByteString, readLong, readBytes, readByte, readInt32, readUint16;
function init_MarshalSubset() {
	return (init_MarshalSubset = __esmMin((() => {
		init_result();
		init_marshalUtf8();
		init_PyInstallerFailure();
		MAX_DEPTH = 16;
		MAX_NODES = 1e5;
		MAX_SEQUENCE = 1e5;
		MAX_STRING_BYTES = 65536;
		FLAG_REF = 128;
		readMarshalSubset = (bytes) => {
			const cursor = {
				bytes,
				offset: 0,
				refs: [],
				depth: 0,
				nodes: 0
			};
			const value = readObject(cursor);
			if (!value.ok) return value;
			if (cursor.offset !== bytes.length) return err(pyInstallerFailure("format", "PYZ marshal value did not consume its table of contents"));
			return value;
		};
		readObject = (cursor) => {
			if (cursor.depth > MAX_DEPTH || cursor.nodes >= MAX_NODES) return err(pyInstallerFailure("limit", "PYZ marshal value exceeds the depth or object bound"));
			cursor.nodes += 1;
			const code = readByte(cursor);
			if (!code.ok) return code;
			const flag = (code.value & FLAG_REF) !== 0;
			const type = code.value & ~FLAG_REF;
			if (type === 114) return readReference(cursor);
			if (type === 105) return storeScalar(cursor, flag, readInt32(cursor));
			if (type === 108) return storeScalar(cursor, flag, readLong(cursor));
			if (type === 122 || type === 90) return storeScalar(cursor, flag, readShortAscii(cursor));
			if (type === 97 || type === 65) return storeScalar(cursor, flag, readCountedAscii(cursor));
			if (type === 116 || type === 117) return storeScalar(cursor, flag, readUtf8(cursor));
			if (type === 115) return storeScalar(cursor, flag, readByteString(cursor));
			if (type === 40) return readSequence(cursor, flag, readInt32(cursor));
			if (type === 41) return readSequence(cursor, flag, readByte(cursor));
			if (type === 91) return readSequence(cursor, flag, readInt32(cursor));
			return err(pyInstallerFailure("format", "PYZ marshal value uses a type outside the supported subset"));
		};
		storeScalar = (cursor, flag, value) => {
			if (!value.ok) return value;
			if (flag) cursor.refs.push(value.value);
			return value;
		};
		readSequence = (cursor, flag, count) => {
			if (!count.ok) return count;
			if (count.value < 0) return err(pyInstallerFailure("format", "PYZ marshal sequence has a negative count"));
			if (count.value > MAX_SEQUENCE) return err(pyInstallerFailure("limit", "PYZ marshal sequence exceeds the supported count"));
			const slot = flag ? cursor.refs.length : undefined;
			if (slot !== undefined) cursor.refs.push(undefined);
			const items = [];
			cursor.depth += 1;
			for (let index = 0; index < count.value; index += 1) {
				const item = readObject(cursor);
				if (!item.ok) return item;
				items.push(item.value);
			}
			cursor.depth -= 1;
			if (slot !== undefined) cursor.refs[slot] = items;
			return ok(items);
		};
		readReference = (cursor) => {
			const index = readInt32(cursor);
			if (!index.ok) return index;
			const value = cursor.refs[index.value];
			if (value === undefined) return err(pyInstallerFailure("format", "PYZ marshal reference does not point at a completed value"));
			return ok(value);
		};
		readShortAscii = (cursor) => {
			const length = readByte(cursor);
			if (!length.ok) return length;
			return readAsciiBytes(cursor, length.value);
		};
		readCountedAscii = (cursor) => {
			const length = readInt32(cursor);
			if (!length.ok) return length;
			return readAsciiBytes(cursor, length.value);
		};
		readAsciiBytes = (cursor, length) => {
			const bytes = readBytes(cursor, length);
			if (!bytes.ok) return bytes;
			if (bytes.value.some((byte) => byte > 127)) return err(pyInstallerFailure("format", "PYZ marshal ASCII string contains a non-ASCII byte"));
			return ok(bytes.value.toString("ascii"));
		};
		readUtf8 = (cursor) => {
			const length = readInt32(cursor);
			if (!length.ok) return length;
			const bytes = readBytes(cursor, length.value);
			if (!bytes.ok) return bytes;
			const value = decodeMarshalUtf8(bytes.value);
			if (!value.ok) return err(pyInstallerFailure("format", "PYZ marshal string is not valid UTF-8"));
			return ok(value.value.text);
		};
		readByteString = (cursor) => {
			const length = readInt32(cursor);
			if (!length.ok) return length;
			const bytes = readBytes(cursor, length.value);
			if (!bytes.ok) return bytes;
			return ok(bytes.value);
		};
		readLong = (cursor) => {
			const digits = readInt32(cursor);
			if (!digits.ok) return digits;
			const count = Math.abs(digits.value);
			if (count > 8) return err(pyInstallerFailure("limit", "PYZ marshal integer exceeds the safe range"));
			let magnitude = 0n;
			let mostSignificantDigit = 0;
			for (let index = 0; index < count; index += 1) {
				const digit = readUint16(cursor);
				if (!digit.ok) return digit;
				if (digit.value > 32767) return err(pyInstallerFailure("format", "PYZ marshal long digit is out of range"));
				mostSignificantDigit = digit.value;
				magnitude += BigInt(digit.value) << BigInt(15 * index);
			}
			if (count > 0 && mostSignificantDigit === 0) return err(pyInstallerFailure("format", "PYZ marshal long is not normalized"));
			if (magnitude > BigInt(Number.MAX_SAFE_INTEGER)) return err(pyInstallerFailure("limit", "PYZ marshal integer exceeds the safe range"));
			const signed = digits.value < 0 ? -Number(magnitude) : Number(magnitude);
			return ok(signed);
		};
		readBytes = (cursor, length) => {
			if (length < 0) return err(pyInstallerFailure("format", "PYZ marshal string has a negative length"));
			if (!Number.isSafeInteger(length) || length > MAX_STRING_BYTES) return err(pyInstallerFailure("limit", "PYZ marshal string exceeds the supported length"));
			const end = cursor.offset + length;
			if (end > cursor.bytes.length) return err(pyInstallerFailure("format", "PYZ marshal value is truncated"));
			const bytes = cursor.bytes.subarray(cursor.offset, end);
			cursor.offset = end;
			return ok(bytes);
		};
		readByte = (cursor) => {
			if (cursor.offset >= cursor.bytes.length) return err(pyInstallerFailure("format", "PYZ marshal value is truncated"));
			const value = cursor.bytes[cursor.offset] ?? 0;
			cursor.offset += 1;
			return ok(value);
		};
		readInt32 = (cursor) => {
			if (cursor.offset + 4 > cursor.bytes.length) return err(pyInstallerFailure("format", "PYZ marshal value is truncated"));
			const value = cursor.bytes.readInt32LE(cursor.offset);
			cursor.offset += 4;
			return ok(value);
		};
		readUint16 = (cursor) => {
			if (cursor.offset + 2 > cursor.bytes.length) return err(pyInstallerFailure("format", "PYZ marshal value is truncated"));
			const value = cursor.bytes.readUInt16LE(cursor.offset);
			cursor.offset += 2;
			return ok(value);
		};
	})))();
}

//#endregion
//#region dist/artifacts/pyinstaller/PyzArchive.js
var PYZ_MAGIC, PYZ_HEADER_BYTES, MAX_PYZ_TABLE_BYTES, readPyzArchive, parsePyzParts, pyzEntries, onePyzEntry;
function init_PyzArchive() {
	return (init_PyzArchive = __esmMin((() => {
		init_ArtifactHash();
		init_readArtifactFileChunks();
		init_PyInstallerBytes();
		init_result();
		init_MarshalSubset();
		init_PyInstallerFailure();
		init_PythonBytecode();
		PYZ_MAGIC = Buffer.from("PYZ\0");
		PYZ_HEADER_BYTES = 12;
		MAX_PYZ_TABLE_BYTES = 16 * 1024 * 1024;
		readPyzArchive = async (handle, start, size, signal) => {
			if (size < PYZ_HEADER_BYTES) return err(pyInstallerFailure("format", "PYZ archive magic does not match"));
			const headerRead = await readPyInstallerBytes(handle, {
				position: start,
				length: PYZ_HEADER_BYTES,
				label: "PYZ header",
				signal
			});
			if (!headerRead.ok) return headerRead;
			const header = headerRead.value;
			const tocOffset = header.length === PYZ_HEADER_BYTES ? header.readUInt32BE(8) : size;
			const validOffset = tocOffset >= PYZ_HEADER_BYTES && tocOffset <= size;
			const knownMagic = pythonVersionForMagic(header.subarray(4, 8)) !== undefined;
			const tableSize = validOffset && knownMagic ? size - tocOffset : 0;
			if (tableSize > 16777216) return err(pyInstallerFailure("limit", "PYZ table exceeds the 16 MiB in-memory table budget"));
			const read = await readPyInstallerBytes(handle, {
				position: start + tocOffset,
				length: tableSize,
				label: "PYZ table",
				signal
			});
			if (!read.ok) return read;
			const table = read.value;
			const digest = await hashReadable(readArtifactFileChunks(handle, {
				start,
				end: start + size - 1,
				...signal === undefined ? {} : { signal }
			}), signal);
			if (digest.bytes !== size) return err(pyInstallerFailure("format", "PYZ image extends outside the file"));
			return parsePyzParts(header, table, size, digest.sha256);
		};
		parsePyzParts = (header, table, size, sha256) => {
			if (header.length < PYZ_HEADER_BYTES || !header.subarray(0, 4).equals(PYZ_MAGIC)) return err(pyInstallerFailure("format", "PYZ archive magic does not match"));
			const pythonMagic = Buffer.from(header.subarray(4, 8));
			const pythonVersion = pythonVersionForMagic(pythonMagic);
			if (pythonVersion === undefined) return ok({
				kind: "opaque",
				pythonMagic,
				sha256,
				limitation: `PYZ Python magic ${pythonMagic.toString("hex")} is not in the supported set; the member was left opaque.`
			});
			const tocOffset = header.readUInt32BE(8);
			if (tocOffset < PYZ_HEADER_BYTES || tocOffset > size) return err(pyInstallerFailure("format", "PYZ table of contents is outside the archive"));
			const marshalled = readMarshalSubset(table);
			if (!marshalled.ok) {
				if (marshalled.error.reason !== "format") return marshalled;
				return ok({
					kind: "opaque",
					pythonMagic,
					sha256,
					limitation: `PYZ table of contents could not be parsed (${marshalled.error.message}); the member was left opaque.`
				});
			}
			const entries = pyzEntries(marshalled.value, tocOffset, table.length);
			if (!entries.ok) return entries.error.reason === "format" ? ok({
				kind: "opaque",
				pythonMagic,
				sha256,
				limitation: `${entries.error.message}; the member was left opaque.`
			}) : entries;
			return ok({
				kind: "entries",
				pythonMagic,
				pythonVersion,
				sha256,
				entries: entries.value
			});
		};
		pyzEntries = (value, payloadEnd, tableBytes) => {
			if (!Array.isArray(value)) return err(pyInstallerFailure("format", "PYZ table of contents is not a list"));
			const entries = [];
			let nameBytes = 0;
			for (const item of value) {
				const entry = onePyzEntry(item, payloadEnd, entries.length);
				if (!entry.ok) return entry;
				nameBytes += Buffer.byteLength(entry.value.name, "utf8");
				if (nameBytes > tableBytes) return err(pyInstallerFailure("limit", `PYZ table entry names expand past the ${String(tableBytes)}-byte table that stores them`));
				entries.push(entry.value);
			}
			return ok(entries);
		};
		onePyzEntry = (item, payloadEnd, index) => {
			if (!Array.isArray(item) || item.length !== 2) return err(pyInstallerFailure("format", "PYZ table entry is not a name and position pair"));
			const [name, position] = item;
			if (typeof name !== "string" || !Array.isArray(position) || position.length !== 3) return err(pyInstallerFailure("format", "PYZ table entry is not a name, type, offset, and length"));
			const [typeCode, offset, length] = position;
			if (!Number.isSafeInteger(typeCode) || !Number.isSafeInteger(offset) || !Number.isSafeInteger(length)) return err(pyInstallerFailure("format", "PYZ table entry positions are not integers"));
			if (typeCode < 0 || typeCode > 3) return err(pyInstallerFailure("format", `PYZ table entry type ${String(typeCode)} is not a known module, package, data, or namespace code`));
			if (typeCode !== 3 && length === 0) return err(pyInstallerFailure("format", `PYZ entry at table index ${String(index)} has no compressed bytes`));
			if (length < 0 || offset < 0 || offset > payloadEnd || length > payloadEnd - offset || length > 0 && offset < PYZ_HEADER_BYTES) return err(pyInstallerFailure("integrity", `PYZ entry at table index ${String(index)} extends outside the archive payload region`));
			return ok({
				index,
				name,
				typeCode,
				offset,
				length,
				compressionFlag: length === 0 ? 0 : 1,
				package: typeCode === 1 || typeCode === 3,
				namespace: typeCode === 3
			});
		};
	})))();
}

//#endregion
//#region dist/artifacts/PyInstallerArtifactReader.js
var MAX_PARSED_FACT_BYTES, MAX_RETAINED_ENTRY_BYTES, RECORD_OWNERSHIP_RESERVATION, PATH_COMPONENT_RESERVATION, carrierPathDialect, PyInstallerArtifactReader, failure;
function init_PyInstallerArtifactReader() {
	return (init_PyInstallerArtifactReader = __esmMin((() => {
		init_jsonValueByteLength();
		init_ArtifactPaths();
		init_PyInstallerMetadata();
		init_artifactExpansionBudget();
		init_ArtifactReader();
		init_ArtifactHash();
		init_ArtifactFileSource();
		init_ArtifactResourceScope();
		init_dosMz();
		init_machoContainer();
		init_ArtifactClassificationProbe();
		init_PyInstallerPyzStore();
		init_PyInstallerMemberStream();
		init_CArchiveLayout();
		init_CArchiveMembers();
		init_PyzArchive();
		init_PyInstallerBytes();
		MAX_PARSED_FACT_BYTES = 32 * 1024 * 1024;
		MAX_RETAINED_ENTRY_BYTES = 64 * 1024 * 1024;
		RECORD_OWNERSHIP_RESERVATION = 256;
		PATH_COMPONENT_RESERVATION = 1024;
		carrierPathDialect = async (handle, fileSize, signal) => {
			const prefixRead = await readPyInstallerBytes(handle, {
				position: 0,
				length: Math.min(fileSize, ARTIFACT_CLASSIFICATION_PREFIX_BYTES),
				label: "carrier header",
				signal
			});
			if (!prefixRead.ok) return "unknown";
			const prefix = prefixRead.value;
			let windowsHeader = parseMzHeaderEvidence(prefix, fileSize).windowsHeader;
			if (windowsHeader.state === "signature-needed") {
				const signatureRead = await readPyInstallerBytes(handle, {
					position: windowsHeader.offset,
					length: 4,
					label: "PE signature",
					signal
				});
				if (!signatureRead.ok) return "unknown";
				windowsHeader = parseMzHeaderEvidence(prefix, fileSize, {
					offset: windowsHeader.offset,
					bytes: signatureRead.value
				}).windowsHeader;
			}
			if (windowsHeader.state === "declared") return windowsHeader.signature === "PE" ? "windows" : "unknown";
			if (prefix.subarray(0, 4).equals(Buffer.from([
				127,
				69,
				76,
				70
			]))) return "posix";
			const thinMachO = readMachoHeaderPrefixFacts(prefix);
			if (thinMachO.identity !== null) return "posix";
			if (readFatContainerHeader(prefix, fileSize).state === "parsed") return "posix";
			return "unknown";
		};
		PyInstallerArtifactReader = class {
			format = "pyinstaller";
			#source;
			#closed = false;
			#scope = new ArtifactResourceScope();
			#cleanup = new ArtifactResourceScope();
			#lifecycle = new AbortController();
			#loaded;
			#budget = 0;
			#charged = 0;
			#parsedFactBytes = 0;
			#retainedEntryBytes = 0;
			#metadata;
			#pyzStore = new PyInstallerPyzStore();
			#members = new Map();
			#openedPyzSizes = new Map();
			constructor(path, source) {
				this.#source = new ArtifactFileSource(path, "PyInstaller", source);
				this.#cleanup.retain({
					kind: "lease",
					resource: "PyInstaller private PYZ images",
					lease: { release: () => this.#pyzStore.close() }
				});
				this.#cleanup.retain({
					kind: "lease",
					resource: path,
					lease: { release: () => this.#source.close() }
				});
			}
			formatMetadata() {
				return this.#metadata === undefined ? undefined : { ...this.#metadata };
			}
			async prepareContainer(expectedSha256, signal) {
				const active = this.#signal(signal);
				await this.#scope.run(async () => {
					await this.#openHandle(active);
					await this.#source.bindSelectedPathSha256(expectedSha256, active);
				});
			}
			async *entries(signal, options) {
				const active = this.#signal(signal);
				const loaded = await this.#scope.run(async () => {
					const value = await this.#load(active);
					await this.#source.readSelectedPath();
					this.#members.clear();
					return value;
				});
				options?.onCoverage?.(loaded.traversal);
				for (const member of loaded.members) {
					abortIfNeeded(active);
					const sealed = sealMember(member);
					this.#members.set(sealed.entry.adapterKey, sealed);
					yield sealed.entry;
				}
			}
			async open(entry, signal) {
				const active = this.#signal(signal);
				return this.#scope.run(async () => {
					const stored = this.#members.get(entry.adapterKey);
					if (stored === undefined || !sameArtifactEntry(entry, stored.entry)) throw new ArtifactReaderFailure("integrity", `PyInstaller entry was not produced by this reader: ${entry.path}`);
					if (entry.kind !== "file") throw new ArtifactReaderFailure("format", `PyInstaller entry is not a regular file: ${entry.path}`);
					if (entry.encrypted) throw new ArtifactReaderFailure("unavailable", `PYZ entry is encrypted and was not decoded: ${entry.path}`);
					const read = stored.read;
					if (read === undefined) throw new ArtifactReaderFailure("format", `PyInstaller entry has no readable bytes: ${entry.path}`);
					const { handle } = await this.#source.readSelectedPath();
					const knownSize = read.kind === "pyz" ? read.uncompressedSize ?? this.#openedPyzSizes.get(entry.adapterKey) : undefined;
					if (read.kind === "pyz" && knownSize === undefined) this.#charge(read.header?.length ?? 0);
					const parts = await this.#pyzStore.memberSource(read, handle, active);
					if (active.aborted) {
						parts.source.destroy();
						await finished(parts.source, { cleanup: true }).catch(() => undefined);
						abortIfNeeded(active);
					}
					let closeAttempt;
					const closeSource = (primary) => closeAttempt ??= parts.close?.(primary);
					const stream = pyInstallerMemberStream(parts.source, {
						sourceBytes: read.kind === "carchive" ? read.source.compressedSize : read.length,
						compressed: read.kind === "pyz" ? read.compressed : read.source.compressionFlag === 1,
						header: read.header,
						expectedBytes: read.kind === "carchive" ? read.source.uncompressedSize : knownSize,
						maxBytes: read.kind === "carchive" ? read.source.uncompressedSize : knownSize ?? this.#budget - this.#charged,
						signal: active,
						...read.kind === "pyz" && knownSize === undefined ? { charge: (bytes) => this.#charge(bytes) } : {},
						complete: async (bytes) => {
							try {
								await parts.verify?.();
								await this.#source.readSelectedPath();
								abortIfNeeded(active);
							} catch (cause) {
								await closeSource(cause);
								throw cause;
							}
							await closeSource();
							abortIfNeeded(active);
							if (read.kind === "pyz" && knownSize === undefined) this.#openedPyzSizes.set(entry.adapterKey, bytes);
						}
					});
					void this.#scope.run(async () => {
						let primary;
						try {
							await stream.completion;
						} catch (cause) {
							primary = cause;
						}
						await closeSource(primary);
						if (primary !== undefined) throw primary;
					}).catch((cause) => stream.output.destroy(cause instanceof Error ? cause : new Error("PyInstaller stream failed", { cause })));
					return stream.output;
				});
			}
			provenance() {
				return [];
			}
			async close() {
				this.#closed = true;
				const closing = new ArtifactReaderFailure("unavailable", "PyInstaller reader closed");
				this.#lifecycle.abort(closing);
				await this.#scope.close();
				await this.#cleanup.close();
				this.#closed = true;
				this.#loaded = undefined;
				this.#members.clear();
				this.#openedPyzSizes.clear();
			}
			#signal(signal) {
				abortIfNeeded(signal);
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "PyInstaller archive is closed");
				return signal === undefined ? this.#lifecycle.signal : AbortSignal.any([signal, this.#lifecycle.signal]);
			}
			async #load(signal) {
				this.#loaded ??= this.#parse(signal);
				return this.#loaded;
			}
			async #parse(signal) {
				await this.#openHandle(signal);
				const { handle, initial } = await this.#source.readSelectedPath();
				const size = initial.size;
				const pathDialect = await carrierPathDialect(handle, size, signal);
				const cookie = await this.#cookie(handle, size, signal);
				this.#budget = artifactExpansionBudgetBytes(cookie.packageLength);
				const toc = await this.#toc(handle, cookie, signal);
				for (const entry of toc) {
					this.#charge(entry.uncompressedSize);
					this.#reserveMetadata({ ...entry }, false);
				}
				const images = await this.#pyzImages(handle, cookie, toc, signal);
				const magic = scriptPythonMagic(cookie, [...images.values()].map((image) => image.archive));
				const encrypted = hasEncryptionMarker(toc);
				const members = await this.#project(toc, cookie, images, magic, encrypted, pathDialect, signal);
				for (const member of members) if (member.read?.kind === "carchive") this.#charge(member.read.header?.length ?? 0);
				await this.#source.readSelectedPath();
				this.#metadata = cookieMetadata(cookie, toc, encrypted);
				let opaqueImages = 0;
				for (const image of images.values()) if (image.archive.kind === "opaque") opaqueImages++;
				return {
					members,
					traversal: {
						status: opaqueImages === 0 ? "complete" : "unknown",
						limitations: opaqueImages === 0 ? [] : [`${String(opaqueImages)} PYZ archives remain opaque; module traversal is unknown. See opaque PYZ occurrences for source magic and per-archive limitations.`]
					}
				};
			}
			async #openHandle(signal) {
				abortIfNeeded(signal);
				if (this.#closed) throw new ArtifactReaderFailure("unavailable", "PyInstaller archive is closed");
				let handle;
				try {
					({handle} = await this.#source.read(this.#lifecycle.signal));
				} catch (cause) {
					if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled" && signal?.aborted) throw new ArtifactReaderFailure("cancelled", cause.message, {
						cause: signal.reason,
						cleanup: cause.cleanup,
						cleanupLeases: cause.cleanupLeases
					});
					throw cause;
				}
				abortIfNeeded(signal);
				return handle;
			}
			async #cookie(handle, size, signal) {
				const found = await findPyInstallerCookie(handle, size, signal);
				if (found === undefined) throw new ArtifactReaderFailure("format", "PyInstaller CArchive cookie was not found");
				if (!found.ok) throw failure(found.error);
				return found.value;
			}
			async #toc(handle, cookie, signal) {
				const toc = await readCArchiveToc(handle, cookie, signal);
				if (!toc.ok) throw failure(toc.error);
				return toc.value;
			}
			async #pyzImages(handle, cookie, toc, signal) {
				const images = new Map();
				this.#pyzStore.reserveImages(toc.reduce((count, entry) => count + (entry.typeCode === "z" && entry.compressionFlag === 1 ? 1 : 0), 0));
				for (const entry of toc) {
					if (entry.typeCode !== "z") continue;
					abortIfNeeded(signal);
					const spooled = entry.compressionFlag === 0 ? undefined : await this.#pyzStore.spool(handle, cookie.archiveStart, entry, signal);
					const source = spooled ?? {
						handle,
						start: cookie.archiveStart + entry.offset
					};
					const parsed = await readPyzArchive(source.handle, source.start, entry.uncompressedSize, signal);
					if (!parsed.ok) throw failure(parsed.error);
					if (parsed.value.kind === "entries") for (const item of parsed.value.entries) this.#reserveMetadata({
						...item,
						container: entry.name
					}, false);
					if (spooled !== undefined) await this.#pyzStore.release(spooled.handle);
					images.set(entry, {
						archive: parsed.value,
						handle: source.handle,
						start: source.start
					});
				}
				return images;
			}
			async #project(toc, cookie, images, magic, encrypted, pathDialect, signal) {
				const handle = await this.#openHandle(signal);
				const members = [];
				const append = (member) => {
					this.#reservePathComponents(member.entry.path);
					const entry = {
						...member.entry,
						path: normalizeArtifactPath(member.entry.path)
					};
					this.#reserveMetadata({
						path: entry.path,
						source_path: entry.sourcePath ?? null,
						adapter_key: entry.adapterKey,
						format_metadata: entry.formatMetadata ?? null,
						limitations: [...entry.limitations]
					}, true);
					members.push({
						...member,
						entry
					});
				};
				for (const entry of toc) {
					if (members.length % 256 === 0) await setImmediate();
					abortIfNeeded(signal);
					const image = entry.typeCode === "z" ? images.get(entry) : undefined;
					if (image === undefined) {
						const bytecode = await this.#pyzStore.bytecodeHeader(handle, cookie.archiveStart, entry, magic, signal);
						append(projectStoredMember(entry, cookie.archiveStart, bytecode, pathDialect));
						continue;
					}
					append(projectPyzContainer(entry, cookie.archiveStart, image, encrypted, pathDialect));
					if (image.archive.kind !== "entries") continue;
					for (const item of image.archive.entries) {
						if (members.length % 256 === 0) await setImmediate();
						abortIfNeeded(signal);
						append(projectPyzMember(entry, item, encrypted, image.archive.pythonMagic, pathDialect, item.namespace || encrypted ? undefined : {
							handle: image.handle,
							offset: image.start + item.offset,
							length: item.length
						}));
					}
				}
				return members;
			}
			#reservePathComponents(path) {
				const remaining = MAX_RETAINED_ENTRY_BYTES - this.#retainedEntryBytes;
				const componentCost = PATH_COMPONENT_RESERVATION + 6 * jsonValueByteLength(path);
				let reservation = componentCost;
				for (let index = 0; index < path.length && reservation <= remaining; index++) if (path.charCodeAt(index) === 47) reservation += componentCost;
				if (reservation > remaining) throw new ArtifactReaderFailure("limit", "PyInstaller paths exceed their retained namespace budget", { boundary: "memory" });
				this.#retainedEntryBytes += reservation;
			}
			#reserveMetadata(value, projected) {
				const used = projected ? this.#retainedEntryBytes : this.#parsedFactBytes;
				const limit = projected ? MAX_RETAINED_ENTRY_BYTES : MAX_PARSED_FACT_BYTES;
				const remaining = limit - used - RECORD_OWNERSHIP_RESERVATION;
				const bytes = remaining < 0 ? 0 : jsonValueByteLength(value, remaining);
				if (remaining < 0 || bytes > remaining) throw new ArtifactReaderFailure("limit", "PyInstaller directory facts exceed their retained metadata budget", { boundary: "memory" });
				if (projected) this.#retainedEntryBytes += bytes + RECORD_OWNERSHIP_RESERVATION;
				else this.#parsedFactBytes += bytes + RECORD_OWNERSHIP_RESERVATION;
			}
			#charge(bytes) {
				if (!Number.isSafeInteger(bytes) || bytes < 0 || this.#charged + bytes > this.#budget) throw new ArtifactReaderFailure("limit", `PyInstaller members declare ${String(this.#charged + Math.max(0, bytes))} uncompressed bytes, exceeding the decompression budget`);
				this.#charged += bytes;
			}
		};
		failure = (error) => new ArtifactReaderFailure(error.reason, error.message);
	})))();
}

//#endregion
//#region dist/artifacts/inventory/reader.js
var createReader, inventoryCoverage;
function init_reader() {
	return (init_reader = __esmMin((() => {
		init_AsarArtifactReader();
		init_DirectoryArtifactReader();
		init_GodotPckArtifactReader();
		init_MachOSliceArtifactReader();
		init_NativeDmgArtifactReader();
		init_NodeSeaArtifactReader();
		init_PyInstallerArtifactReader();
		init_ZipArtifactReader();
		init_zipPackageFormat();
		createReader = (path, format, environment, rootSource, asarHeaderAdmission) => {
			if (isZipPackageFormat(format)) return new ZipArtifactReader(path, format, undefined, rootSource);
			switch (format) {
				case "directory": return new DirectoryArtifactReader(path, "omit");
				case "asar": return new AsarArtifactReader(path, asarHeaderAdmission === undefined ? {} : { headerAdmission: asarHeaderAdmission });
				case "pyinstaller": return new PyInstallerArtifactReader(path, rootSource);
				case "node-sea": return new NodeSeaArtifactReader(path, rootSource);
				case "godot-pck": return new GodotPckArtifactReader(path, rootSource);
				case "mach-o-universal": return process.platform === "darwin" ? new MachOSliceArtifactReader(path, environment, undefined, rootSource) : undefined;
				case "dmg":
					if (process.platform !== "darwin") return undefined;
					return new NativeDmgArtifactReader(path, environment);
				default: return undefined;
			}
		};
		inventoryCoverage = (format, reader, traversal) => {
			if (reader !== undefined) return {
				coverage: {
					scope: "container-entries",
					status: traversal.status
				},
				limitations: [
					...isZipPackageFormat(reader.format) ? [ZIP_NON_ENTRY_LIMITATION] : [],
					...reader.format === "godot-pck" ? ["PCK inventory establishes packaged bytes and metadata; scenes, binary resources, GDScript bytecode and runtime signal behavior were not decoded."] : [],
					...reader.format === "node-sea" ? ["Node SEA inventory establishes the injected blob, flags, fuse sentinel, main script, optional code cache, snapshot, and assets. V8 snapshots and code cache are not deserialized, and the application is not executed."] : [],
					...traversal.limitations
				]
			};
			if (format === "dmg" || format === "pkg") return {
				coverage: {
					scope: "container-entries",
					status: "unknown"
				},
				limitations: [`${format.toUpperCase()} root hash is observed; child inventory requires a native macOS adapter.`]
			};
			if (format === "mach-o-universal") return {
				coverage: {
					scope: "container-entries",
					status: "unknown"
				},
				limitations: ["Universal Mach-O slices require the native macOS lipo adapter."]
			};
			if (isZipPackageFormat(format) || format === "directory" || format === "asar" || format === "godot-pck" || format === "node-sea") return {
				coverage: {
					scope: "container-entries",
					status: "unknown"
				},
				limitations: [`${format} child inventory reader is unavailable.`]
			};
			return {
				coverage: {
					scope: "root",
					status: "complete"
				},
				limitations: ["Inventory covers root bytes only; child container entries were not examined."]
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactTraversalObservation.js
var ArtifactTraversalObservation;
function init_ArtifactTraversalObservation() {
	return (init_ArtifactTraversalObservation = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_ArtifactPaths();
		ArtifactTraversalObservation = class {
			#limitations = new Set();
			#unknown = false;
			onCoverage = (coverage) => {
				this.#unknown ||= coverage.status === "unknown";
				for (const limitation of coverage.limitations) this.#limitations.add(limitation);
			};
			onOmission = (omission) => {
				const path = normalizeArtifactPath(omission.path);
				this.#unknown = true;
				this.#limitations.add(`Artifact traversal omitted ${omission.kind} at ${JSON.stringify(path)}.`);
			};
			snapshot() {
				return {
					status: this.#unknown ? "unknown" : "complete",
					limitations: [...this.#limitations].sort(compareUnicodeCodePoints)
				};
			}
		};
	})))();
}

//#endregion
//#region dist/artifacts/inventory/types.js
var STRICT_INTEGRITY_POLICY;
function init_types() {
	return (init_types = __esmMin((() => {
		STRICT_INTEGRITY_POLICY = { mode: "fail" };
	})))();
}

//#endregion
//#region dist/artifacts/inventory/scanReader.js
var UNAVAILABLE_UNPACKED_LIMITATION, emptyScan, scanReader, inventoryEntries, visitArtifactEntries, digestArtifactEntry, isExpandableAsar, isUnavailableUnpackedEntry;
function init_scanReader() {
	return (init_scanReader = __esmMin((() => {
		init_artifactIntegrity();
		init_ArtifactPaths();
		init_ArtifactReader();
		init_ArtifactTraversalObservation();
		init_DirectoryArtifactReader();
		init_AsarArtifactReader();
		init_ArtifactGraphConstruction();
		init_types();
		init_ArtifactHash();
		UNAVAILABLE_UNPACKED_LIMITATION = "ASAR unpacked companion bytes were unavailable; no content hash or child artifact was produced.";
		emptyScan = () => ({
			nodes: new Map(),
			occurrences: [],
			pendingContradictions: []
		});
		scanReader = async (reader, ownedReaders, signal, integrity = STRICT_INTEGRITY_POLICY, asarHeaderAdmission) => {
			const { nodes, occurrences, pendingContradictions } = emptyScan();
			if (reader === undefined) return {
				nodes,
				occurrences,
				pendingContradictions,
				caseCollisionLimitation: undefined,
				unknownParentOccurrences: new Set(),
				traversal: {
					status: "complete",
					limitations: []
				}
			};
			const context = {
				reader,
				signal,
				integrity,
				asarHeaderAdmission,
				nodes,
				occurrences,
				pendingContradictions,
				occurrenceCountByPath: new Map(),
				registry: new ArtifactPathRegistry(),
				expandedContainerIds: new Set(),
				ownedReaders,
				traversal: new ArtifactTraversalObservation()
			};
			await visitArtifactEntries(context, reader, "");
			const byPath = indexDestinationOccurrencesByPath(occurrences);
			const parentResolution = resolveOccurrenceParents(occurrences, byPath, context.expandedContainerIds);
			const structuralLimitations = [...parentResolution.limitations];
			context.traversal.onCoverage({
				status: structuralLimitations.length === 0 ? "complete" : "unknown",
				limitations: structuralLimitations
			});
			return {
				nodes,
				occurrences,
				pendingContradictions,
				caseCollisionLimitation: annotateEnglishUnicodeCaseCollisions(occurrences),
				unknownParentOccurrences: parentResolution.unknownParentOccurrences,
				traversal: context.traversal.snapshot()
			};
		};
		inventoryEntries = (context, reader, prefix) => reader.entries(context.signal, {
			onCoverage: context.traversal.onCoverage,
			onOmission: (omission) => context.traversal.onOmission({
				...omission,
				path: prefix.length === 0 ? omission.path : `${prefix}/${omission.path}`
			})
		})[Symbol.asyncIterator]();
		visitArtifactEntries = async (context, currentReader, prefix) => {
			const stack = [{
				reader: currentReader,
				prefix,
				containerId: null,
				iterator: inventoryEntries(context, currentReader, prefix)
			}];
			let failure;
			try {
				while (stack.length > 0) {
					const frame = stack.at(-1);
					if (frame === undefined) break;
					const next = await frame.iterator.next();
					if (next.done) {
						stack.pop();
						continue;
					}
					const entry = next.value;
					const logicalPath = normalizeArtifactPath(frame.prefix.length === 0 ? entry.path : `${frame.prefix}/${entry.path}`);
					const expandableAsar = isExpandableAsar(entry, logicalPath);
					if (frame.reader.format !== "pyinstaller") context.registry.add(logicalPath, expandableAsar ? "directory" : entry.kind);
					const duplicateOrdinal = context.occurrenceCountByPath.get(logicalPath) ?? 0;
					context.occurrenceCountByPath.set(logicalPath, duplicateOrdinal + 1);
					const occurrence = createOccurrence(entry, logicalPath, entry.kind === "metadata" ? frame.containerId : null, duplicateOrdinal);
					let digested;
					try {
						digested = await digestArtifactEntry(context, frame.reader, entry, logicalPath, occurrence);
					} catch (cause) {
						let limitation = UNAVAILABLE_UNPACKED_LIMITATION;
						if (cause instanceof DirectoryArtifactEntryAccessDenied) {
							abortIfNeeded(context.signal);
							limitation = cause.message;
							context.traversal.onCoverage({
								status: "unknown",
								limitations: [limitation]
							});
						} else if (!isUnavailableUnpackedEntry(cause, entry)) throw cause;
						occurrence.hash_status = "unavailable";
						occurrence.limitations.push(limitation);
					}
					if (digested === undefined) noteUnreadContainerSuffix(occurrence);
					else {
						context.nodes.set(digested.node.artifact_id, digested.node);
						occurrence.artifact_id = digested.node.artifact_id;
						const seaMainScript = entry.formatMetadata?.kind === "node-sea-entry" && entry.formatMetadata.role === "main-script";
						occurrence.artifact_kind = seaMainScript ? "javascript" : digested.classification.kind;
						occurrence.artifact_format = seaMainScript ? "javascript-bundle" : digested.classification.format;
						occurrence.hash_status = digested.mismatched ? "mismatched" : "verified";
						if (digested.mismatched) occurrence.limitations.push("Declared integrity metadata contradicts observed bytes.");
					}
					context.occurrences.push(occurrence);
					if (expandableAsar && digested !== undefined && digested.classification.format === "asar" && !digested.mismatched) {
						const nested = new AsarArtifactReader(entry.adapterKey, context.asarHeaderAdmission === undefined ? {} : { headerAdmission: context.asarHeaderAdmission });
						context.ownedReaders.push(nested);
						await nested.prepareContainer(digested.node.sha256, context.signal);
						context.expandedContainerIds.add(occurrence.occurrence_id);
						stack.push({
							reader: nested,
							prefix: logicalPath,
							containerId: occurrence.occurrence_id,
							iterator: inventoryEntries(context, nested, logicalPath)
						});
					}
				}
			} catch (cause) {
				failure = { cause };
			} finally {
				for (const { iterator, prefix, reader } of stack.reverse()) {
					try {
						await iterator.return?.();
					} catch (cause) {
						failure = { cause: ArtifactReaderFailure.withCleanup(failure === undefined ? cause : failure.cause, ArtifactReaderFailure.cleanupObservation(cause, `artifact traversal for ${prefix || reader.format}`)) };
					}
				}
			}
			if (failure !== undefined) throw failure.cause;
		};
		digestArtifactEntry = async (context, currentReader, entry, logicalPath, occurrence) => {
			if (entry.kind !== "file" && entry.kind !== "slice" || entry.encrypted) return undefined;
			const digest = await hashReadable(await currentReader.open(entry, context.signal), context.signal, entry.declaredIntegrity?.algorithm, context.asarHeaderAdmission);
			const claim = entry.declaredIntegrity;
			const observed = claim?.algorithm === "md5" ? digest.md5 : digest.sha256;
			if (claim !== null && observed === undefined) throw new ArtifactReaderFailure("integrity", "The selected integrity digest was not computed");
			const mismatched = claim !== null && claim.digest !== observed;
			if (mismatched && claim !== null && observed !== undefined) {
				if (context.integrity.mode === "fail") throw new ArtifactReaderFailure("integrity", `Artifact integrity metadata disagrees with content: ${logicalPath}`, undefined, artifactIntegrityDetails(logicalPath, claim, observed, entry.unpacked));
				context.pendingContradictions.push({
					occurrence,
					integrity: artifactIntegrityPair(claim, observed),
					entryKind: entry.kind,
					unpacked: entry.unpacked
				});
			}
			const classified = entry.kind === "slice" ? {
				kind: "universal-slice",
				format: "mach-o",
				contentFormat: classifyArtifactBytes(digest, digest.bytes)
			} : classifyArtifactContent(logicalPath, digest, digest.bytes);
			return {
				node: createArtifactNode({
					sha256: digest.sha256,
					size: digest.bytes,
					format: classified.contentFormat,
					contentState: "embedded"
				}),
				mismatched,
				classification: classified
			};
		};
		isExpandableAsar = (entry, logicalPath) => entry.kind === "file" && logicalPath.toLowerCase().endsWith(".asar") && isAbsolute(entry.adapterKey);
		isUnavailableUnpackedEntry = (cause, entry) => entry.unpacked && cause instanceof ArtifactReaderFailure && cause.reason === "unavailable";
	})))();
}

//#endregion
//#region dist/artifacts/inventory/scanCanonical.js
var scanCanonicalArtifactInventoryInScope, scanCanonicalArtifactInventoryForExtractionInScope, scanCanonical, cleanupInventoryOwners, buildInventorySnapshot, buildIntegrityContradictions, verifyRootDigest, sortNodes, sortOccurrences, sortEdges, buildManifest, buildLimitations;
function init_scanCanonical() {
	return (init_scanCanonical = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_AsarArtifactReader();
		init_zipPackageFormat();
		init_ArtifactReader();
		init_artifactGraph();
		init_ArtifactGraphConstruction();
		init_artifactIdentity();
		init_classify();
		init_hostExecutableMarking();
		init_hashStableRootArtifact();
		init_reader();
		init_scanReader();
		init_types();
		scanCanonicalArtifactInventoryInScope = async (path, options, readerFactory = createReader) => (await scanCanonical(path, options, readerFactory, "release")).snapshot;
		scanCanonicalArtifactInventoryForExtractionInScope = async (path, options) => scanCanonical(path, options, createReader, "transfer-zip");
		scanCanonical = async (path, options, readerFactory, rootDisposition) => {
			const integrity = options.integrity ?? STRICT_INTEGRITY_POLICY;
			const metadata = await lstat(path);
			const { format: rootFormat, digest: rootDigest, rootSource } = await classifyAndHashRootForInventory(path, metadata.isDirectory(), metadata, options);
			let reader;
			let readerCreationFailure;
			try {
				reader = readerFactory(path, rootFormat, options.environment ?? {}, rootSource, options.asarHeaderAdmission);
			} catch (cause) {
				readerCreationFailure = { cause };
			}
			const ownedReaders = reader === undefined ? [] : [reader];
			let outcome;
			try {
				if (readerCreationFailure !== undefined) throw readerCreationFailure.cause;
				if (reader instanceof AsarArtifactReader) await reader.prepareContainer(rootDigest?.sha256, options.signal);
				const { nodes, occurrences, pendingContradictions, caseCollisionLimitation, unknownParentOccurrences, traversal } = await scanReader(reader, ownedReaders, options.signal, integrity, options.asarHeaderAdmission);
				outcome = {
					kind: "completed",
					snapshot: await buildInventorySnapshot({
						path,
						metadata,
						rootFormat,
						rootDigest,
						rootSource,
						resourceScope: options.resourceScope,
						reader,
						signal: options.signal,
						nodes,
						occurrences,
						pendingContradictions,
						caseCollisionLimitation,
						unknownParentOccurrences,
						traversal
					})
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
				if (rootFormat === "dmg" && cause instanceof ArtifactReaderFailure && cause.reason === "unavailable" && cause.partialObservation === undefined && options.signal?.aborted !== true) {
					let retained;
					let rootFailure;
					try {
						retained = await buildInventorySnapshot({
							path,
							metadata,
							rootFormat,
							rootDigest,
							rootSource,
							resourceScope: options.resourceScope,
							reader,
							signal: options.signal,
							nodes: new Map(),
							occurrences: [],
							pendingContradictions: [],
							caseCollisionLimitation: undefined,
							unknownParentOccurrences: new Set(),
							traversal: {
								status: "unknown",
								limitations: [`DMG child traversal was unavailable: ${cause.message}`]
							}
						});
					} catch (failure) {
						rootFailure = failure;
					}
					outcome = {
						kind: "failed",
						cause: new ArtifactReaderFailure(cause.reason, rootFailure === undefined ? cause.message : `${cause.message}; root observations could not be revalidated: ${rootFailure instanceof Error ? rootFailure.message : String(rootFailure)}`, {
							cause: rootFailure === undefined ? cause : new AggregateError([cause, rootFailure], "DMG traversal and root revalidation failed", { cause }),
							cleanup: cause.cleanup,
							cleanupLeases: cause.cleanupLeases,
							...retained === undefined ? {} : { partialObservation: {
								kind: "artifact-inventory",
								inventory: retained
							} }
						}, cause.details)
					};
				}
			}
			const cleanup = await cleanupInventoryOwners({
				path,
				options,
				rootSource,
				ownedReaders,
				outcome,
				rootDisposition: rootDisposition === "transfer-zip" && outcome.kind === "completed" && rootSource !== undefined && isZipPackageFormat(rootFormat) ? "transfer" : "release"
			});
			if (cleanup.failure !== undefined) throw cleanup.failure;
			if (outcome.kind === "failed") throw outcome.cause;
			return {
				snapshot: outcome.snapshot,
				zipSource: cleanup.transferred
			};
		};
		cleanupInventoryOwners = async ({ path, options, rootSource, ownedReaders, outcome, rootDisposition }) => {
			let cleanupFailure;
			const readerOwners = [...ownedReaders].reverse().map((reader) => ({
				kind: "reader",
				reader,
				resource: `artifact reader for ${path}`
			}));
			const rootOwner = rootSource === undefined ? undefined : {
				kind: "file-handle",
				handle: rootSource.owner,
				resource: `root artifact descriptor for ${path}`
			};
			for (const owner of readerOwners) {
				const attempt = await options.resourceScope.release(owner);
				if (attempt.kind === "released") continue;
				cleanupFailure = options.resourceScope.cleanupFailure(cleanupFailure === undefined ? outcome : {
					kind: "failed",
					cause: cleanupFailure
				}, [attempt], outcome.kind === "completed" ? {
					kind: "artifact-inventory",
					inventory: outcome.snapshot
				} : undefined);
			}
			if (rootDisposition === "transfer" && cleanupFailure === undefined && rootSource !== undefined && rootOwner !== undefined) return {
				failure: undefined,
				transferred: {
					source: rootSource,
					owner: rootOwner
				}
			};
			if (rootOwner !== undefined) {
				const attempt = await options.resourceScope.release(rootOwner);
				if (attempt.kind === "failed") cleanupFailure = options.resourceScope.cleanupFailure(cleanupFailure === undefined ? outcome : {
					kind: "failed",
					cause: cleanupFailure
				}, [attempt], outcome.kind === "completed" ? {
					kind: "artifact-inventory",
					inventory: outcome.snapshot
				} : undefined);
			}
			return {
				failure: cleanupFailure,
				transferred: undefined
			};
		};
		buildInventorySnapshot = async (input) => {
			const { path, metadata, rootFormat, rootDigest, rootSource, reader, signal } = input;
			materializeDirectoryNodes(input.occurrences, input.nodes);
			const rootNode = createRootNode({
				digest: rootDigest,
				occurrences: input.occurrences
			});
			input.nodes.set(rootNode.artifact_id, rootNode);
			rekeyOccurrences(rootNode.artifact_id, input.occurrences);
			const rootOccurrence = rootOccurrenceFor(rootNode, {
				size: metadata.size,
				executable: hostExecutableMarking(path, metadata),
				format: rootFormat,
				path,
				formatMetadata: reader?.formatMetadata?.()
			});
			for (const occurrence of input.occurrences) if (occurrence.parent_occurrence_id === null && !input.unknownParentOccurrences.has(occurrence)) occurrence.parent_occurrence_id = rootOccurrence.occurrence_id;
			input.occurrences.unshift(rootOccurrence);
			const occurrenceById = new Map(input.occurrences.map((occurrence) => [occurrence.occurrence_id, occurrence]));
			const integrityContradictions = buildIntegrityContradictions(input.pendingContradictions, occurrenceById, rootNode);
			const edgeResult = createArtifactEdges(rootNode.artifact_id, input.occurrences, reader?.provenance()[0]);
			const { edges } = edgeResult;
			const orderedNodes = sortNodes([...input.nodes.values()]);
			const orderedOccurrences = sortOccurrences(input.occurrences);
			const orderedEdges = sortEdges(edges).map((edge, ordinal) => ({
				...edge,
				ordinal
			}));
			await verifyRootDigest(path, rootDigest, rootSource, input.resourceScope, signal);
			const graphSha256 = artifactGraphDigest({
				nodes: orderedNodes,
				occurrences: orderedOccurrences,
				edges: orderedEdges,
				contradictions: integrityContradictions
			});
			const manifest = buildManifest({
				rootNode,
				rootFormat,
				graphSha256,
				orderedNodes,
				orderedOccurrences,
				orderedEdges
			});
			const traversal = inventoryCoverage(rootFormat, reader, input.traversal);
			const coverage = edgeResult.limitations.length === 0 ? traversal.coverage : {
				...traversal.coverage,
				status: "unknown"
			};
			return {
				manifest,
				nodes: orderedNodes,
				occurrences: orderedOccurrences,
				edges: orderedEdges,
				provenance: reader?.provenance() ?? [],
				integrity_contradictions: integrityContradictions,
				coverage,
				limitations: buildLimitations([...traversal.limitations, ...edgeResult.limitations], integrityContradictions, input.caseCollisionLimitation)
			};
		};
		buildIntegrityContradictions = (pending, occurrenceById, rootNode) => pending.map((contradiction) => {
			const occurrence = contradiction.occurrence;
			const parent = occurrence.parent_occurrence_id === null ? undefined : occurrenceById.get(occurrence.parent_occurrence_id);
			const parentArtifactId = parent?.artifact_id ?? rootNode.artifact_id;
			return {
				contradiction_id: artifactContradictionId({
					rootArtifactId: rootNode.artifact_id,
					logicalPath: occurrence.logical_path,
					integrity: contradiction.integrity
				}),
				occurrence_id: occurrence.occurrence_id,
				parent_artifact_id: parentArtifactId,
				logical_path: occurrence.logical_path,
				...contradiction.integrity,
				entry_kind: contradiction.entryKind,
				unpacked: contradiction.unpacked,
				trust: "observed-untrusted",
				provenance: "container-integrity-metadata-versus-observed-bytes",
				limitations: ["Observed bytes contradict declared integrity metadata and cannot support equivalence."]
			};
		});
		verifyRootDigest = async (path, rootDigest, rootSource, resourceScope, signal) => {
			if (rootDigest === null) return;
			const verified = rootSource === undefined ? await hashStableRootArtifact(path, resourceScope, signal) : await hashStableRootArtifactHandle(path, rootSource.handle, rootSource.initial, signal);
			if (verified.sha256 !== rootDigest.sha256 || verified.bytes !== rootDigest.bytes) throw new ArtifactReaderFailure("integrity", "Root artifact changed during inventory");
		};
		sortNodes = (nodes) => nodes.sort((left, right) => compareUnicodeCodePoints(left.artifact_id, right.artifact_id));
		sortOccurrences = (occurrences) => occurrences.sort((left, right) => compareUnicodeCodePoints(left.logical_path, right.logical_path));
		sortEdges = (edges) => edges.sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id));
		buildManifest = ({ rootNode, rootFormat, graphSha256, orderedNodes, orderedOccurrences, orderedEdges }) => artifactInventoryResultSchema.shape.manifest.parse({
			manifest_id: artifactManifestId(rootNode.artifact_id, graphSha256),
			root_artifact_id: rootNode.artifact_id,
			root_sha256: rootNode.sha256,
			root_format: rootFormat,
			graph_sha256: graphSha256,
			node_count: orderedNodes.length,
			occurrence_count: orderedOccurrences.length,
			edge_count: orderedEdges.length
		});
		buildLimitations = (scopeLimitations, integrityContradictions, caseCollisionLimitation) => [
			...scopeLimitations,
			...caseCollisionLimitation === undefined ? [] : [caseCollisionLimitation],
			...integrityContradictions.length === 0 ? [] : [`${String(integrityContradictions.length)} integrity contradiction(s) were recorded; mismatched content is observed-untrusted.`]
		];
	})))();
}

//#endregion
export { ArtifactTraversalObservation, AsarArtifactReader, GodotPckArtifactReader, MachOSliceArtifactReader, NodeSeaArtifactReader, PyInstallerArtifactReader, containsPyInstallerArchive, init_ArtifactTraversalObservation, init_AsarArtifactReader, init_CArchiveLayout, init_GodotPckArtifactReader, init_GodotPckLocation, init_MachOSliceArtifactReader, init_NodeSeaArtifactReader, init_NodeSeaLocation, init_PyInstallerArtifactReader, init_scanCanonical, locateGodotPck, locateNodeSea, scanCanonicalArtifactInventoryForExtractionInScope, scanCanonicalArtifactInventoryInScope };