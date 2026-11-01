import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ArtifactReaderFailure, NonRegularFileReadError, OwnedFileHandle, RegularFileAdmissionFailure, copyArtifactEntry, init_ArtifactReader, init_OwnedFileHandle, init_RegularFile, openRegularFile, sameArtifactEntry, sameRegularFileState } from "./ArtifactReader-PV1DaSaC.js";
import { assertArtifactReadActive, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { once } from "node:events";
import { PassThrough } from "node:stream";
import { ERR_AMBIGUOUS_ARCHIVE, ERR_BAD_FORMAT, ERR_CENTRAL_DIRECTORY_NOT_FOUND, ERR_ENCRYPTED_CENTRAL_DIRECTORY, ERR_ENTRY_DATA_OUT_OF_BOUNDS, ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND, ERR_EOCDR_NOT_FOUND, ERR_EXTRAFIELD_ZIP64_NOT_FOUND, ERR_INVALID_COMPRESSED_DATA, ERR_INVALID_CRC32, ERR_INVALID_UNCOMPRESSED_SIZE, ERR_LOCAL_FILE_HEADER_NOT_FOUND, ERR_OVERLAPPING_ENTRY, ERR_SPLIT_ZIP_FILE, ERR_UNSUPPORTED_COMPRESSION, ERR_UNSUPPORTED_ENCRYPTION, ERR_UNSUPPORTED_UINT64, Reader, ZipReader } from "@zip.js/zip.js";

//#region dist/domain/artifactExpansionBudget.js
var ARTIFACT_EXPANSION_RATIO, MINIMUM_ARTIFACT_EXPANDED_BYTES, artifactExpansionBudgetBytes;
function init_artifactExpansionBudget() {
	return (init_artifactExpansionBudget = __esmMin((() => {
		ARTIFACT_EXPANSION_RATIO = 500;
		MINIMUM_ARTIFACT_EXPANDED_BYTES = 256 * 1024 * 1024;
		artifactExpansionBudgetBytes = (archiveBytes) => Math.max(MINIMUM_ARTIFACT_EXPANDED_BYTES, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(archiveBytes) * 500));
	})))();
}

//#endregion
//#region dist/artifacts/ZipArtifactReader.js
async function* typedZipFailures(source) {
	try {
		yield* source;
	} catch (cause) {
		throw typedZipFailure(cause);
	}
}
var ZIP_UTF8_DECODER, NodeFileReader, ZipArtifactReader, projectZipEntry, legacyNameLimitations, decodeZipEntryText, CP437_HIGH_HALF, decodeCp437, zipEntryPath, decodeStrictZipUtf8, extractStream, ZIP_FAILURE_REASONS, typedZipFailure, toError;
function init_ZipArtifactReader() {
	return (init_ZipArtifactReader = __esmMin((() => {
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_artifactExpansionBudget();
		init_OwnedFileHandle();
		init_RegularFile();
		ZIP_UTF8_DECODER = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
		NodeFileReader = class extends Reader {
			path;
			maximumReadBytes;
			admitted;
			#handle;
			#owner;
			#initPromise;
			#ownsHandle;
			constructor(path, maximumReadBytes, admitted) {
				super(path);
				this.path = path;
				this.maximumReadBytes = maximumReadBytes;
				this.admitted = admitted;
				this.#ownsHandle = admitted === undefined;
			}
			init() {
				this.#initPromise ??= this.#initialize();
				return this.#initPromise;
			}
			async #initialize() {
				let source;
				try {
					source = this.admitted ?? await openRegularFile(this.path, { symlinks: "reject" });
					this.#handle = source.handle;
					if (this.#ownsHandle) this.#owner = new OwnedFileHandle(source.handle);
				} catch (cause) {
					if (cause instanceof RegularFileAdmissionFailure) {
						this.#owner = cause.owner;
						const primary = cause.cause instanceof NonRegularFileReadError ? new ArtifactReaderFailure("format", `ZIP source is not a regular file: ${this.path}`, { cause: cause.cause }) : cause.cause;
						throw ArtifactReaderFailure.withCleanup(primary, ArtifactReaderFailure.cleanupObservation(cause.cleanupCause, this.path));
					}
					if (cause instanceof NonRegularFileReadError) throw new ArtifactReaderFailure("format", `ZIP source is not a regular file: ${this.path}`, { cause });
					throw cause;
				}
				if (this.admitted !== undefined) {
					const metadata = await source.handle.stat();
					if (!sameRegularFileState(source.initial, metadata)) throw new ArtifactReaderFailure("integrity", `ZIP source identity changed before reading: ${this.path}`);
				}
				this.size = source.initial.size;
			}
			async readUint8Array(index, length) {
				const handle = this.#handle;
				if (handle === undefined) throw new Error("ZIP reader is not initialized");
				const readBytes = Math.min(length, this.size - index);
				if (readBytes < 0) throw new ArtifactReaderFailure("format", `ZIP archive is malformed: read at ${index} extends beyond the ${this.size}-byte archive`);
				if (this.maximumReadBytes !== undefined && readBytes > this.maximumReadBytes) throw new ArtifactReaderFailure("limit", `ZIP metadata read requires ${readBytes} bytes, exceeding the ${this.maximumReadBytes}-byte read budget`);
				const bytes = Buffer.alloc(readBytes);
				let offset = 0;
				while (offset < bytes.length) {
					const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, index + offset);
					if (bytesRead === 0) throw new ArtifactReaderFailure("integrity", `ZIP source ended before its admitted extent: ${this.path}`);
					offset += bytesRead;
				}
				return bytes;
			}
			async closeHandle() {
				if (!this.#ownsHandle) return;
				await this.#initPromise?.catch(() => undefined);
				if (this.#owner === undefined) return;
				await this.#owner.close();
				this.#owner = undefined;
				this.#handle = undefined;
			}
		};
		ZipArtifactReader = class {
			format;
			#source;
			#reader;
			#entries = new Map();
			/** Optionally bound each metadata read before allocating its backing buffer. */
			constructor(path, format, maximumMetadataReadBytes, admitted) {
				this.format = format;
				this.#source = new NodeFileReader(path, maximumMetadataReadBytes, admitted);
				this.#reader = new ZipReader(this.#source, {
					checkSignature: true,
					checkOverlappingEntry: true,
					filenameEncoding: "cp437",
					filenameValidation: "tolerant"
				});
			}
			async *entries(signal) {
				let index = 0;
				let declaredFileBytes = 0;
				for await (const entry of typedZipFailures(this.#reader.getEntriesGenerator({ decodeText: decodeZipEntryText }))) {
					assertArtifactReadActive(signal);
					const metadata = projectZipEntry(entry, index++);
					if (metadata === undefined) continue;
					if (metadata.kind === "file" && !metadata.encrypted && metadata.declaredSize !== null && Number.isSafeInteger(metadata.declaredSize) && metadata.declaredSize >= 0) {
						declaredFileBytes += metadata.declaredSize;
						const budget = artifactExpansionBudgetBytes(this.#source.size);
						if (declaredFileBytes > budget) throw new ArtifactReaderFailure("limit", `ZIP entries declare ${String(declaredFileBytes)} uncompressed bytes, exceeding this archive's ${String(budget)}-byte decompression budget (${String(MINIMUM_ARTIFACT_EXPANDED_BYTES)}-byte minimum, ${String(500)}x archive size); a small archive cannot expand this far`);
					}
					const stored = this.#entries.get(metadata.adapterKey);
					if (stored !== undefined && !sameArtifactEntry(metadata, stored.metadata)) throw new ArtifactReaderFailure("integrity", `ZIP member identity changed during enumeration: ${entry.filename}`);
					if (stored === undefined) this.#entries.set(metadata.adapterKey, {
						source: entry,
						metadata: copyArtifactEntry(metadata)
					});
					yield metadata;
				}
			}
			open(entry, signal) {
				assertArtifactReadActive(signal);
				const stored = this.#entries.get(entry.adapterKey);
				if (stored === undefined || !sameArtifactEntry(entry, stored.metadata)) return Promise.reject(new ArtifactReaderFailure("integrity", "ZIP entry metadata does not match this reader's inventory"));
				const source = stored.source;
				if (source.directory || source.symlink) return Promise.reject(new ArtifactReaderFailure("format", "ZIP entry is not a regular file"));
				if (source.encrypted) return Promise.reject(new ArtifactReaderFailure("unavailable", "Encrypted ZIP entry is unsupported"));
				return Promise.resolve(extractStream(source, signal));
			}
			async close() {
				await this.#reader.close().catch(() => undefined);
				await this.#source.closeHandle();
			}
			provenance() {
				return [];
			}
		};
		projectZipEntry = (entry, index) => {
			const kind = entry.symlink ? "symlink" : entry.directory ? "directory" : "file";
			const sourcePath = zipEntryPath(entry);
			const path = sourcePath.replace(/^(?:\.\/)+/u, "");
			if (kind === "directory" && (path === "" || path === ".")) return undefined;
			return {
				path,
				...path === sourcePath ? {} : { sourcePath },
				kind,
				declaredSize: kind === "directory" ? null : entry.uncompressedSize,
				compressedSize: kind === "directory" ? null : entry.compressedSize,
				executable: entry.executable,
				encrypted: entry.encrypted,
				byteOffset: null,
				declaredIntegrity: null,
				unpacked: false,
				limitations: [
					...kind === "symlink" ? ["Archive symlink target was not read."] : [],
					...path === sourcePath ? [] : [`ZIP member name ${JSON.stringify(sourcePath)} has a leading current-directory prefix omitted from its logical path.`],
					...legacyNameLimitations(entry)
				],
				adapterKey: `zip-entry:${index}`
			};
		};
		legacyNameLimitations = (entry) => {
			if (entry.filenameUTF8 || entry.extraFieldUnicodePath?.valid === true) return [];
			const bytes = entry.rawFilename;
			if (!bytes.some((byte) => byte >= 128)) return [];
			const hex = Buffer.from(bytes).toString("hex");
			return [`ZIP name uses CP437 fallback; source encoding unverified; raw hex: ${hex}.`];
		};
		decodeZipEntryText = (bytes, encoding, type) => {
			if (type !== "filename") return undefined;
			if (encoding === "utf-8") return decodeStrictZipUtf8(bytes, "ZIP filename is not valid UTF-8");
			return encoding === "cp437" ? decodeCp437(bytes) : undefined;
		};
		CP437_HIGH_HALF = "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\xA0";
		decodeCp437 = (bytes) => Array.from(bytes, (byte) => byte < 128 ? String.fromCharCode(byte) : CP437_HIGH_HALF.charAt(byte - 128)).join("");
		zipEntryPath = (entry) => {
			const field = entry.extraFieldUnicodePath;
			if (field?.valid !== true) return entry.filename;
			return decodeStrictZipUtf8(field.data.subarray(5), "ZIP Unicode Path extra field is not valid UTF-8");
		};
		decodeStrictZipUtf8 = (bytes, message) => {
			try {
				return ZIP_UTF8_DECODER.decode(bytes);
			} catch (cause) {
				throw new ArtifactReaderFailure("format", message, { cause });
			}
		};
		extractStream = (entry, signal) => {
			const output = new PassThrough();
			const controller = new AbortController();
			const onAbort = () => {
				controller.abort(signal?.reason);
				output.destroy(new ArtifactReaderFailure("cancelled", "ZIP operation cancelled", { cause: signal?.reason }));
			};
			signal?.addEventListener("abort", onAbort, { once: true });
			output.once("close", () => {
				signal?.removeEventListener("abort", onAbort);
				controller.abort();
			});
			const writable = new WritableStream({
				write: async (chunk) => {
					assertArtifactReadActive(signal);
					if (!output.write(Buffer.from(chunk))) await once(output, "drain", { signal: controller.signal });
				},
				close: () => {
					output.end();
				},
				abort: (reason) => {
					output.destroy(toError(typedZipFailure(reason)));
				}
			});
			void entry.getData(writable, {
				signal: controller.signal,
				checkSignature: true,
				checkOverlappingEntry: true,
				onprogress: () => assertArtifactReadActive(signal)
			}).catch((cause) => output.destroy(toError(typedZipFailure(cause))));
			return output;
		};
		ZIP_FAILURE_REASONS = new Map([...[
			ERR_AMBIGUOUS_ARCHIVE,
			ERR_BAD_FORMAT,
			ERR_CENTRAL_DIRECTORY_NOT_FOUND,
			ERR_ENTRY_DATA_OUT_OF_BOUNDS,
			ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND,
			ERR_EOCDR_NOT_FOUND,
			ERR_EXTRAFIELD_ZIP64_NOT_FOUND,
			ERR_INVALID_COMPRESSED_DATA,
			ERR_INVALID_CRC32,
			ERR_INVALID_UNCOMPRESSED_SIZE,
			ERR_LOCAL_FILE_HEADER_NOT_FOUND,
			ERR_OVERLAPPING_ENTRY,
			ERR_UNSUPPORTED_UINT64
		].map((message) => [message, "format"]), ...[
			ERR_ENCRYPTED_CENTRAL_DIRECTORY,
			ERR_SPLIT_ZIP_FILE,
			ERR_UNSUPPORTED_COMPRESSION,
			ERR_UNSUPPORTED_ENCRYPTION
		].map((message) => [message, "unavailable"])]);
		typedZipFailure = (cause) => {
			if (!(cause instanceof Error) || cause instanceof ArtifactReaderFailure) return cause;
			const reason = ZIP_FAILURE_REASONS.get(cause.message);
			if (reason === undefined) return cause;
			return new ArtifactReaderFailure(reason, reason === "format" ? `ZIP archive is malformed: ${cause.message}` : `ZIP archive uses an unsupported feature: ${cause.message}`, { cause });
		};
		toError = (cause) => cause instanceof Error ? cause : new Error("ZIP extraction failed");
	})))();
}

//#endregion
export { ZipArtifactReader, artifactExpansionBudgetBytes, init_ZipArtifactReader, init_artifactExpansionBudget };