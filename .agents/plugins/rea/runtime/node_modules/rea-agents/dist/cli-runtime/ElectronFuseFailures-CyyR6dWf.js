import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ELECTRON_FUSE_SENTINEL, electronFuseName, electronFuseState, init_dylibResolution, init_electronFuses, init_localPath, isPathWithinRoot, machoImageSlices } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, AnalysisUnsupportedTargetError, fixedAllowanceOptions, init_analysisErrorBase, init_analysisErrorCore, init_fixedAllowanceRemediation } from "./jsonLines-Gf10X4s1.js";
import { ProviderAdapterError, init_providerAdapterError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, NonRegularFileReadError, RegularFileChangedError, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile, regularFileCancellation, sameRegularFileState } from "./ArtifactReader-PV1DaSaC.js";
import { ArtifactFileCleanupFailure, artifactFileCancellationCause, artifactFileCompletion, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation, withArtifactRegularFile } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { decodePeMachine, init_elfFixedHeader, init_peMachine, readElfFixedHeader } from "./peMachine-BoMBJgsB.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { hasMachoMagic, init_MachoLoadCommandReader, readMachoImage } from "./MachoLoadCommandReader-BwJFJimz.js";
import { ZodError } from "zod";
import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, sep } from "node:path";
import { lstat, readlink } from "node:fs/promises";

//#region dist/electron/ElectronFusePath.js
var FRAMEWORK_NAME, BINARY_NAME, MAX_SYMLINK_HOPS, ElectronFusePathFailure, resolveElectronFuseTarget, resolveFrameworkSymlink, resolveBundleBinary, resolveDirectorySuffix, resolveKnownBinary, resolveInside, requireFrameworkRoot, requireRealDirectories, requireFile, pathWalkFailure, frameworkRootOf, relativeInside, appendPath, isMissing, symlinkTargetSegments;
function init_ElectronFusePath() {
	return (init_ElectronFusePath = __esmMin((() => {
		init_ArtifactFileOperation();
		init_localPath();
		FRAMEWORK_NAME = "Electron Framework.framework";
		BINARY_NAME = "Electron Framework";
		MAX_SYMLINK_HOPS = 32;
		ElectronFusePathFailure = class extends Error {
			reason;
			constructor(reason, message) {
				super(message);
				this.reason = reason;
				this.name = "ElectronFusePathFailure";
			}
		};
		resolveElectronFuseTarget = async (selectedPath, signal) => {
			assertArtifactReadActive(signal);
			const metadata = await lstat(selectedPath, { bigint: true });
			let file;
			if (metadata.isSymbolicLink()) file = await resolveFrameworkSymlink(selectedPath, signal);
			else if (metadata.isFile()) file = frameworkRootOf(selectedPath) === null ? {
				path: selectedPath,
				metadata,
				nodes: []
			} : await resolveFrameworkSymlink(selectedPath, signal);
			else if (metadata.isDirectory()) {
				file = await resolveBundleBinary(selectedPath, signal);
				file = {
					...file,
					nodes: [{
						path: selectedPath,
						metadata
					}, ...file.nodes]
				};
			} else throw new ElectronFusePathFailure("invalid_format", `Expected a regular file or Electron app bundle: ${selectedPath}`);
			return {
				selectedPath,
				file
			};
		};
		resolveFrameworkSymlink = async (selectedPath, signal) => {
			const root = frameworkRootOf(selectedPath);
			if (root === null) throw new ElectronFusePathFailure("invalid_format", `Expected a regular file without a symlink: ${selectedPath}`);
			const nodes = await requireFrameworkRoot(root, selectedPath);
			const relativePath = relativeInside(root, selectedPath);
			if (relativePath === null) throw new ElectronFusePathFailure("invalid_value", `Framework symlink escapes ${FRAMEWORK_NAME}: ${selectedPath}`);
			return requireFile(await resolveInside(root, relativePath, signal), selectedPath, nodes);
		};
		resolveBundleBinary = async (selectedPath, signal) => {
			const directory = await resolveDirectorySuffix(selectedPath, signal);
			const name = basename(directory.path);
			let file;
			if (name === FRAMEWORK_NAME) file = await resolveKnownBinary(directory.path, selectedPath, signal);
			else if (name.endsWith(".app")) file = await resolveKnownBinary(appendPath(directory.path, "Contents", "Frameworks", FRAMEWORK_NAME), selectedPath, signal);
			else throw new ElectronFusePathFailure("invalid_format", `Expected an Electron .app bundle, ${FRAMEWORK_NAME} directory, or executable file: ${selectedPath}`);
			return {
				...file,
				nodes: [...directory.nodes, ...file.nodes]
			};
		};
		resolveDirectorySuffix = async (selectedPath, signal) => {
			let path = selectedPath;
			const pending = [];
			const nodes = [];
			while (true) {
				assertArtifactReadActive(signal);
				const name = basename(path);
				if (name !== "") while (path.endsWith(sep)) path = path.slice(0, -1);
				if (name === "." || name === "..") {
					pending.push(name);
					path = dirname(path);
					continue;
				}
				const component = pending.pop();
				if (component === undefined) return {
					path,
					nodes
				};
				if (component === ".") continue;
				const metadata = await lstat(path, { bigint: true });
				if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new ElectronFusePathFailure("invalid_value", `A bundle path ending in '..' requires a real directory before each parent segment: ${selectedPath}`);
				nodes.push({
					path,
					metadata
				});
				path = dirname(path);
			}
		};
		resolveKnownBinary = async (root, bundle, signal) => {
			const nodes = await requireFrameworkRoot(root, bundle);
			for (const candidate of [
				BINARY_NAME,
				`Versions/Current/${BINARY_NAME}`,
				`Versions/A/${BINARY_NAME}`
			]) {
				const selected = await resolveInside(root, candidate, signal);
				if (selected.kind === "file") return requireFile(selected, bundle, nodes);
				if (selected.kind !== "absent") throw pathWalkFailure(selected.kind, bundle);
			}
			throw new ElectronFusePathFailure("invalid_value", `Electron Framework binary was not found inside ${bundle}.`);
		};
		resolveInside = async (root, relativePath, signal) => {
			const pending = relativePath.split("/").filter((segment) => segment !== "");
			const resolved = [];
			const nodes = [];
			let fileMetadata;
			let hops = 0;
			let last;
			while (pending.length > 0) {
				assertArtifactReadActive(signal);
				const segment = pending.shift() ?? "";
				if (segment === ".") continue;
				if (segment === "..") {
					if (resolved.length === 0) return { kind: "escapes" };
					resolved.pop();
					last = "directory";
					continue;
				}
				const absolute = appendPath(root, ...resolved, segment);
				if (!isPathWithinRoot(root, absolute)) return { kind: "escapes" };
				let metadata;
				try {
					metadata = await lstat(absolute, { bigint: true });
				} catch (cause) {
					if (isMissing(cause)) return { kind: "absent" };
					throw cause;
				}
				if (metadata.isSymbolicLink()) {
					nodes.push({
						path: absolute,
						metadata
					});
					hops += 1;
					if (hops > MAX_SYMLINK_HOPS) return { kind: "loop" };
					const target = await readlink(absolute);
					const absoluteTarget = isAbsolute(target);
					const relativeTarget = absoluteTarget ? relativeInside(root, target) : target;
					if (relativeTarget === null) return { kind: "escapes" };
					if (absoluteTarget) resolved.length = 0;
					pending.unshift(...symlinkTargetSegments(relativeTarget));
					continue;
				}
				if (metadata.isDirectory()) {
					nodes.push({
						path: absolute,
						metadata
					});
					resolved.push(segment);
					last = "directory";
					continue;
				}
				if (!metadata.isFile() || pending.length > 0) return { kind: "not-file" };
				resolved.push(segment);
				fileMetadata = metadata;
				last = "file";
			}
			if (last !== "file" || fileMetadata === undefined) return { kind: "not-file" };
			const path = appendPath(root, ...resolved);
			return isPathWithinRoot(root, path) ? {
				kind: "file",
				path,
				metadata: fileMetadata,
				nodes
			} : { kind: "escapes" };
		};
		requireFrameworkRoot = async (root, selectedPath) => {
			const frameworks = dirname(root);
			const contents = dirname(frameworks);
			const app = dirname(contents);
			if (basename(frameworks) === "Frameworks" && basename(contents) === "Contents" && basename(app).endsWith(".app")) return requireRealDirectories(dirname(app), [
				basename(app),
				"Contents",
				"Frameworks",
				FRAMEWORK_NAME
			], selectedPath);
			else return requireRealDirectories(dirname(root), [basename(root)], selectedPath);
		};
		requireRealDirectories = async (anchor, segments, selectedPath) => {
			let current = anchor;
			const nodes = [];
			for (const segment of segments) {
				current = appendPath(current, segment);
				let metadata;
				try {
					metadata = await lstat(current, { bigint: true });
				} catch (cause) {
					if (isMissing(cause)) throw new ElectronFusePathFailure("invalid_value", `Electron Framework binary was not found inside ${selectedPath}.`);
					throw cause;
				}
				nodes.push({
					path: current,
					metadata
				});
				if (metadata.isSymbolicLink()) throw pathWalkFailure("escapes", selectedPath);
				if (!metadata.isDirectory()) throw pathWalkFailure("not-file", selectedPath);
			}
			return nodes;
		};
		requireFile = (walk, selectedPath, nodes) => {
			if (walk.kind === "file") return {
				path: walk.path,
				metadata: walk.metadata,
				nodes: [...nodes, ...walk.nodes]
			};
			if (walk.kind === "absent") throw new ElectronFusePathFailure("invalid_value", `Electron Framework symlink target was not found: ${selectedPath}`);
			throw pathWalkFailure(walk.kind, selectedPath);
		};
		pathWalkFailure = (kind, path) => new ElectronFusePathFailure("invalid_value", kind === "escapes" ? `Framework symlink escapes ${FRAMEWORK_NAME}: ${path}` : kind === "loop" ? `Framework symlink hop limit exceeded: ${path}` : `Electron Framework path is not a regular file: ${path}`);
		frameworkRootOf = (path) => {
			let current = dirname(path);
			while (basename(current) !== FRAMEWORK_NAME) {
				const parent = dirname(current);
				if (parent === current) return null;
				current = parent;
			}
			return current;
		};
		relativeInside = (root, path) => {
			const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
			if (!path.startsWith(prefix)) return null;
			const value = path.slice(prefix.length);
			return value === "" ? null : value.split(sep).join("/");
		};
		appendPath = (parent, ...segments) => `${parent}${parent.endsWith(sep) ? "" : sep}${segments.join(sep)}`;
		isMissing = (cause) => cause instanceof Error && "code" in cause && ["ENOENT", "ENOTDIR"].includes(String(cause.code));
		symlinkTargetSegments = (target) => target.split(process.platform === "win32" ? /[\\/]/u : "/").filter((part) => part !== "");
	})))();
}

//#endregion
//#region dist/electron/ElectronFuseReader.js
var ELECTRON_FUSE_LIMITS, SENTINEL, FAT_MAGICS, ElectronFuseFormatFailure, ElectronFuseResourceFailure, readElectronFuseImage, electronFuseReadLimitation, readerFor, identifyContainer, identifyMacho, assertNonOverlappingSlices, scanSlices, absorbChunk, parseWire, readExact, isElf, isFat, identifyPe, isMissingPath;
function init_ElectronFuseReader() {
	return (init_ElectronFuseReader = __esmMin((() => {
		init_elfFixedHeader();
		init_peMachine();
		init_MachoLoadCommandReader();
		init_electronFuses();
		init_dylibResolution();
		init_RegularFile();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		ELECTRON_FUSE_LIMITS = {
			maximumFileBytes: 1024 * 1024 * 1024,
			chunkBytes: 256 * 1024,
			maximumSentinelsPerSlice: 32,
			maximumPeHeaderOffset: 1024 * 1024
		};
		SENTINEL = Buffer.from(ELECTRON_FUSE_SENTINEL, "ascii");
		FAT_MAGICS = new Set([
			3405691582,
			3405691583,
			3199925962,
			3216703178
		]);
		ElectronFuseFormatFailure = class extends Error {
			kind;
			constructor(kind, message) {
				super(message);
				this.kind = kind;
				this.name = "ElectronFuseFormatFailure";
			}
		};
		ElectronFuseResourceFailure = class extends Error {
			boundary;
			constructor(boundary, message) {
				super(message);
				this.boundary = boundary;
				this.name = "ElectronFuseResourceFailure";
			}
		};
		readElectronFuseImage = async (path, options) => {
			const signal = options?.signal;
			assertArtifactReadActive(signal);
			const selection = options?.selection;
			const recheckPath = async (candidate) => {
				assertArtifactReadActive(signal);
				try {
					const metadata = await lstat(candidate, { bigint: true });
					assertArtifactReadActive(signal);
					return metadata;
				} catch (cause) {
					if (selection !== undefined && isMissingPath(cause)) throw new RegularFileChangedError(path);
					throw cause;
				}
			};
			const assertPathNodes = async () => {
				if (selection === undefined) return;
				if (selection.path !== path) throw new RegularFileChangedError(path);
				for (const node of selection.nodes) {
					const current = await recheckPath(node.path);
					if (current.dev !== node.metadata.dev || current.ino !== node.metadata.ino || current.isDirectory() !== node.metadata.isDirectory() || current.isSymbolicLink() !== node.metadata.isSymbolicLink()) throw new RegularFileChangedError(path);
				}
			};
			await assertPathNodes();
			const before = await recheckPath(path);
			if (selection !== undefined && !sameRegularFileState(selection.metadata, before)) throw new RegularFileChangedError(path);
			if (!before.isFile() || before.isSymbolicLink()) throw new ElectronFuseFormatFailure("unsupported", `Expected a regular file without a symlink: ${path}`);
			if (before.size > BigInt(ELECTRON_FUSE_LIMITS.maximumFileBytes)) throw new ElectronFuseResourceFailure("file-size", `Selected artifact exceeds ${ELECTRON_FUSE_LIMITS.maximumFileBytes} bytes: ${path}`);
			const size = Number(before.size);
			const chunkBytes = options?.chunkBytes ?? ELECTRON_FUSE_LIMITS.chunkBytes;
			if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > ELECTRON_FUSE_LIMITS.chunkBytes) throw new TypeError(`chunkBytes must be an integer between 1 and ${ELECTRON_FUSE_LIMITS.chunkBytes}.`);
			return withArtifactRegularFile(path, options?.resources ?? new ArtifactResourceScope(), signal, async ({ handle: owned }) => {
				const opened = await owned.stat({ bigint: true });
				if (!sameRegularFileState(before, opened)) throw new RegularFileChangedError(path);
				await assertPathNodes();
				const readAt = readerFor(owned, size, path, signal);
				const container = await identifyContainer(readAt, size, path);
				const scanned = await scanSlices(owned, path, size, container.slices, chunkBytes, signal);
				const current = await recheckPath(path);
				if (!sameRegularFileState(before, current)) throw new RegularFileChangedError(path);
				await assertPathNodes();
				return {
					sha256: scanned.sha256,
					bytes: size,
					format: container.format,
					slices: scanned.slices
				};
			});
		};
		electronFuseReadLimitation = () => `The selected file is admitted as one regular file of at most 1 GiB. Sentinel search uses ${ELECTRON_FUSE_LIMITS.chunkBytes}-byte windows, and each slice keeps at most ${ELECTRON_FUSE_LIMITS.maximumSentinelsPerSlice} sentinels.`;
		readerFor = (handle, size, path, signal) => async (offset, length) => {
			assertArtifactReadActive(signal);
			if (length <= 0 || offset < 0 || offset >= size) return new Uint8Array();
			const bounded = Math.min(length, size - offset);
			const buffer = Buffer.alloc(bounded);
			const read = await handle.read(buffer, 0, bounded, offset);
			if (read.bytesRead !== bounded) throw new RegularFileChangedError(path);
			return buffer.subarray(0, read.bytesRead);
		};
		identifyContainer = async (readAt, size, path) => {
			const head = await readAt(0, Math.min(size, 8));
			if (hasMachoMagic(head)) return identifyMacho(readAt, size, head, path);
			if (isElf(head)) {
				const header = await readAt(0, 64);
				const parsed = readElfFixedHeader(Buffer.from(header), size);
				return {
					format: "elf",
					slices: [{
						index: 0,
						fileOffset: 0,
						size,
						architecture: parsed.ok ? parsed.value.architecture : null
					}]
				};
			}
			const pe = await identifyPe(readAt, size);
			if (pe !== undefined) return {
				format: "pe",
				slices: [{
					index: 0,
					fileOffset: 0,
					size,
					architecture: pe.architecture
				}]
			};
			throw new ElectronFuseFormatFailure("unsupported", `Selected artifact ${path} does not contain a Mach-O, ELF, or PE container.`);
		};
		identifyMacho = async (readAt, size, head, path) => {
			const facts = await readMachoImage(readAt, size);
			if (facts.status !== "parsed") {
				const reason = facts.status === "not-mach-o" ? `Selected artifact ${path} does not contain a Mach-O, ELF, or PE container.` : facts.reason;
				throw new ElectronFuseFormatFailure(facts.status === "malformed" ? "malformed" : "unsupported", reason);
			}
			const format = isFat(head) ? "mach-o-universal" : "mach-o";
			const slices = machoImageSlices(facts).map((slice, index) => ({
				index,
				fileOffset: slice.slice_offset,
				size: slice.slice_size,
				architecture: slice.architecture,
				...slice.hidden === undefined ? {} : { hidden: slice.hidden }
			}));
			assertNonOverlappingSlices(slices);
			return {
				format,
				slices
			};
		};
		assertNonOverlappingSlices = (ranges) => {
			const ordered = [...ranges].sort((left, right) => left.fileOffset - right.fileOffset);
			for (let index = 1; index < ordered.length; index += 1) {
				const previous = ordered[index - 1];
				const current = ordered[index];
				if (previous !== undefined && current !== undefined && current.fileOffset < previous.fileOffset + previous.size) throw new ElectronFuseFormatFailure("malformed", `Mach-O slices ${previous.index} and ${current.index} overlap.`);
			}
		};
		scanSlices = async (handle, path, size, ranges, chunkBytes, signal) => {
			const states = ranges.map((slice) => ({
				slice,
				carry: Buffer.alloc(0),
				hits: []
			}));
			const hash = createHash("sha256");
			const chunk = Buffer.allocUnsafe(chunkBytes);
			let position = 0;
			while (position < size) {
				assertArtifactReadActive(signal);
				const length = Math.min(chunkBytes, size - position);
				const read = await handle.read(chunk, 0, length, position);
				if (read.bytesRead !== length) throw new RegularFileChangedError(path);
				const piece = chunk.subarray(0, length);
				hash.update(piece);
				absorbChunk(states, piece, position);
				position += length;
			}
			if (position !== size) throw new RegularFileChangedError(path);
			const slices = [];
			for (const state of states) {
				const sentinels = [];
				for (const offset of state.hits) sentinels.push(await parseWire(handle, path, offset, state.slice.fileOffset + state.slice.size, signal));
				slices.push({
					index: state.slice.index,
					file_offset: state.slice.fileOffset,
					size: state.slice.size,
					architecture: state.slice.architecture,
					...state.slice.hidden === undefined ? {} : { hidden: state.slice.hidden },
					sentinel_count: sentinels.length,
					sentinels
				});
			}
			return {
				sha256: hash.digest("hex"),
				slices
			};
		};
		absorbChunk = (states, chunk, position) => {
			const chunkEnd = position + chunk.length;
			for (const state of states) {
				const start = Math.max(position, state.slice.fileOffset);
				const end = Math.min(chunkEnd, state.slice.fileOffset + state.slice.size);
				if (start >= end) continue;
				const piece = chunk.subarray(start - position, end - position);
				const carryLength = state.carry.length;
				const window = carryLength === 0 ? piece : Buffer.concat([state.carry, piece]);
				const windowFileStart = start - carryLength;
				let from = 0;
				while (from <= window.length - SENTINEL.length) {
					const found = window.indexOf(SENTINEL, from);
					if (found < 0) break;
					const sentinelOffset = windowFileStart + found;
					if (!state.hits.includes(sentinelOffset)) {
						if (state.hits.length >= ELECTRON_FUSE_LIMITS.maximumSentinelsPerSlice) throw new ElectronFuseResourceFailure("capacity", `Slice ${state.slice.index} contains more than ${ELECTRON_FUSE_LIMITS.maximumSentinelsPerSlice} Electron fuse sentinels.`);
						state.hits.push(sentinelOffset);
					}
					from = found + 1;
				}
				const tail = SENTINEL.length - 1;
				state.carry = window.length <= tail ? Buffer.from(window) : Buffer.from(window.subarray(window.length - tail));
			}
		};
		parseWire = async (handle, path, sentinelOffset, sliceEnd, signal) => {
			const wireStart = sentinelOffset + SENTINEL.length;
			const available = sliceEnd - wireStart;
			if (available < 1) return {
				sentinel_offset: sentinelOffset,
				wire_version: null,
				declared_length: null,
				fuses: [],
				complete: false
			};
			const header = await readExact(handle, path, wireStart, Math.min(available, 2), signal);
			const wireVersion = header[0];
			if (wireVersion === undefined || header.length < 2) return {
				sentinel_offset: sentinelOffset,
				wire_version: wireVersion ?? null,
				declared_length: null,
				fuses: [],
				complete: false
			};
			const declared = header[1] ?? 0;
			const fuseLength = Math.min(declared, available - 2);
			const fuseBytes = fuseLength === 0 ? Buffer.alloc(0) : await readExact(handle, path, wireStart + 2, fuseLength, signal);
			return {
				sentinel_offset: sentinelOffset,
				wire_version: wireVersion,
				declared_length: declared,
				fuses: [...fuseBytes].map((raw, index) => ({
					index,
					name: electronFuseName(wireVersion, index),
					state: electronFuseState(raw),
					raw_byte: raw
				})),
				complete: fuseBytes.length === declared
			};
		};
		readExact = async (handle, path, offset, length, signal) => {
			assertArtifactReadActive(signal);
			const buffer = Buffer.alloc(length);
			const read = await handle.read(buffer, 0, length, offset);
			if (read.bytesRead !== length) throw new RegularFileChangedError(path);
			return buffer;
		};
		isElf = (head) => head.length >= 4 && head[0] === 127 && head[1] === 69 && head[2] === 76 && head[3] === 70;
		isFat = (head) => {
			if (head.length < 4) return false;
			const magic = Buffer.from(head.buffer, head.byteOffset, 4).readUInt32BE(0);
			return FAT_MAGICS.has(magic);
		};
		identifyPe = async (readAt, size) => {
			if (size < 64) return undefined;
			const header = await readAt(0, 64);
			if (header.length < 64 || header[0] !== 77 || header[1] !== 90) return undefined;
			const offset = Buffer.from(header.buffer, header.byteOffset, header.byteLength).readUInt32LE(60);
			if (!Number.isSafeInteger(offset) || offset < 64 || offset > ELECTRON_FUSE_LIMITS.maximumPeHeaderOffset || offset > size - 4) return undefined;
			const bytes = Buffer.from(await readAt(offset, 24));
			if (bytes.length < 4 || bytes.readUInt32LE(0) !== 17744) return undefined;
			const machine = bytes.length === 24 ? decodePeMachine(bytes.readUInt16LE(4)) : undefined;
			return { architecture: machine?.nativeOsOverride === false ? machine.architecture : null };
		};
		isMissingPath = (cause) => cause instanceof Error && "code" in cause && ["ENOENT", "ENOTDIR"].includes(String(cause.code));
	})))();
}

//#endregion
//#region dist/electron/ElectronFuseFailures.js
var ELECTRON_FUSE_PROVIDER_IDENTITY, OPERATION, electronFuseFailure;
function init_ElectronFuseFailures() {
	return (init_ElectronFuseFailures = __esmMin((() => {
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_OwnedRegularFile();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_fixedAllowanceRemediation();
		init_providerAdapterError();
		init_RegularFile();
		init_ElectronFusePath();
		init_ElectronFuseReader();
		ELECTRON_FUSE_PROVIDER_IDENTITY = {
			id: "electron-fuses",
			name: "REA Electron fuse reader",
			version: "1"
		};
		OPERATION = "inspect_electron_fuses";
		electronFuseFailure = (cause, path, operation = OPERATION) => {
			if (cause instanceof AnalysisError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const cleanup = new ProviderCleanupError(ELECTRON_FUSE_PROVIDER_IDENTITY.id, cause.cleanup.resources, { reason: cause.cleanup.reason }, {
					operation,
					cause
				});
				bindArtifactFileCleanup(cause, cleanup);
				if (cause instanceof ArtifactFileCleanupFailure) {
					const outcome = cause.fileCleanupFailure.outcome;
					const cancellation = artifactFileCompletion(cause)?.cancellation;
					const primary = outcome.kind === "failed" ? electronFuseFailure(outcome.cause, path, operation) : cancellation === undefined ? undefined : new AnalysisCancelledError(operation, { cause: cancellation.reason });
					if (primary !== undefined) return analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
				}
				return cleanup;
			}
			if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return new AnalysisCancelledError(operation, { cause: artifactFileCancellationCause(cause) });
			const cancellation = regularFileCancellation(cause);
			if (cancellation !== undefined) return new AnalysisCancelledError(operation, { cause: cancellation.reason });
			if (cause instanceof ElectronFusePathFailure) return new AnalysisInputError(operation, { cause }, [{
				path: ["path"],
				reason: cause.reason,
				message: cause.message
			}]);
			if (cause instanceof ElectronFuseResourceFailure) return new AnalysisResourceConstraintError(operation, cause.boundary === "file-size" ? "file-size" : "capacity", cause.message, cause.boundary === "file-size" ? { maximum_input_bytes: 1024 * 1024 * 1024 } : { maximum_sentinels_per_slice: 32 }, {
				cause,
				...fixedAllowanceOptions(cause.boundary === "file-size" ? "the 1 GiB Electron fuse input allowance" : "The Electron fuse sentinel inventory", cause.boundary === "file-size" ? "input" : "count")
			});
			if (cause instanceof ElectronFuseFormatFailure) return cause.kind === "unsupported" ? new AnalysisUnsupportedTargetError(operation, path, cause.message, { cause }) : new AnalysisInputError(operation, { cause }, [{
				path: ["path"],
				reason: "invalid_format",
				message: `Selected artifact ${path}: ${cause.message}`
			}]);
			if (cause instanceof RegularFileChangedError) return new AnalysisArtifactChangedError(operation, path, cause.message, { cause });
			if (cause instanceof NonRegularFileReadError) return new AnalysisInputError(operation, { cause }, [{
				path: ["path"],
				reason: "invalid_format",
				message: cause.message
			}]);
			if (cause instanceof ZodError) return new AnalysisOutputError(operation, "Electron fuse reader produced a report outside its schema.", { cause });
			if (cause instanceof Error && "code" in cause) {
				if (cause.code === "EACCES" || cause.code === "EPERM") return new AnalysisAccessDeniedError(operation, path, cause.code, { cause });
				if ([
					"ENOENT",
					"ENOTDIR",
					"ELOOP",
					"ENAMETOOLONG"
				].includes(String(cause.code))) return new AnalysisInputError(operation, { cause }, [{
					path: ["path"],
					reason: "invalid_value",
					message: `Selected artifact could not be read (${String(cause.code)}): ${path}.`
				}]);
			}
			return new ProviderAdapterError(ELECTRON_FUSE_PROVIDER_IDENTITY.id, operation, {
				cause,
				diagnostics: {
					path,
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
	})))();
}

//#endregion
export { ELECTRON_FUSE_PROVIDER_IDENTITY, electronFuseFailure, electronFuseReadLimitation, init_ElectronFuseFailures, init_ElectronFusePath, init_ElectronFuseReader, readElectronFuseImage, resolveElectronFuseTarget };