import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisInputError, init_analysisErrorCore } from "./jsonLines-Gf10X4s1.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { ArtifactReaderFailure, OwnedFileHandle, init_ArtifactReader, init_OwnedFileHandle } from "./ArtifactReader-PV1DaSaC.js";
import { assertArtifactReadActive, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { init_readArtifactFileChunks, readArtifactFileChunks } from "./readArtifactFileChunks-C0neyJLE.js";
import { ArtifactPathRegistry, destinationCaseCollision, init_ArtifactPaths, init_StreamBytes, normalizeArtifactPath, streamChunkToBuffer } from "./ArtifactPaths-BSpMttuG.js";
import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, join, sep } from "node:path";
import { access, chmod, lstat, mkdir, open, readdir, realpath, rmdir, unlink } from "node:fs/promises";
import { constants } from "node:fs";

//#region dist/artifacts/SafeOutputTreeAdmission.js
var SafeOutputTreeDestinationRefusal, outputDirectoryAdmissionRefusal;
function init_SafeOutputTreeAdmission() {
	return (init_SafeOutputTreeAdmission = __esmMin((() => {
		init_analysisErrorCore();
		init_ArtifactReader();
		SafeOutputTreeDestinationRefusal = class extends ArtifactReaderFailure {
			constructor(message, options) {
				super("path", message, options);
				this.name = "SafeOutputTreeDestinationRefusal";
			}
		};
		outputDirectoryAdmissionRefusal = (operation, field, cause) => {
			if (!(cause instanceof ArtifactReaderFailure) || cause.cleanup !== undefined) return cause;
			const refusal = cause instanceof SafeOutputTreeDestinationRefusal ? cause : cause.cause instanceof SafeOutputTreeDestinationRefusal ? cause.cause : undefined;
			return refusal === undefined ? cause : new AnalysisInputError(operation, {
				cause,
				userMessage: refusal.message
			}, [{
				path: [field],
				reason: "invalid_value",
				message: refusal.message
			}]);
		};
	})))();
}

//#endregion
//#region dist/artifacts/SafeOutputTreeCreationFailure.js
var SafeOutputTreeCreationFailure, errorMessage;
function init_SafeOutputTreeCreationFailure() {
	return (init_SafeOutputTreeCreationFailure = __esmMin((() => {
		init_ArtifactReader();
		SafeOutputTreeCreationFailure = class extends ArtifactReaderFailure {
			tree;
			constructor(cause, tree) {
				const primary = cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("io", errorMessage(cause), { cause });
				super(primary.reason, primary.message, {
					cause: primary,
					cancellation: primary.cancellation,
					...primary.cleanup === undefined ? {} : { cleanup: primary.cleanup },
					...primary.partialObservation === undefined ? {} : { partialObservation: primary.partialObservation }
				}, primary.details);
				this.name = "SafeOutputTreeCreationFailure";
				this.tree = tree;
			}
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/artifacts/SafeOutputTreeIdentity.js
var assertExactTreeEntries, readDirectoryIdentity, assertPathIdentity, assertHandleIdentity, readFileIdentity, assertFilePathIdentity, isAbsent, replacedDirectory, isNotFound;
function init_SafeOutputTreeIdentity() {
	return (init_SafeOutputTreeIdentity = __esmMin((() => {
		init_ArtifactReader();
		assertExactTreeEntries = async (root, directories, files) => {
			const expected = new Map();
			expected.set(root, new Set());
			for (const directory of directories.keys()) expected.set(directory, new Set());
			for (const path of directories.keys()) expected.get(dirname(path))?.add(basename(path));
			for (const path of files.keys()) expected.get(dirname(path))?.add(basename(path));
			for (const [directory, names] of expected) {
				const entries = await readdir(directory);
				const remaining = new Map();
				for (const name of names) {
					const key = name.normalize("NFC");
					remaining.set(key, (remaining.get(key) ?? 0) + 1);
				}
				let unexpected = entries.length !== names.size;
				for (const entry of entries) {
					const key = entry.normalize("NFC");
					const count = remaining.get(key) ?? 0;
					if (count === 0) unexpected = true;
					else remaining.set(key, count - 1);
				}
				if (unexpected) throw new ArtifactReaderFailure("path", `Unowned or missing output entries: ${directory}`);
			}
			for (const [path, identity] of files) await assertFilePathIdentity(path, identity);
		};
		readDirectoryIdentity = async (path) => {
			const metadata = await lstat(path, { bigint: true });
			if (!metadata.isDirectory()) throw new ArtifactReaderFailure("path", `Output destination must be a directory: ${path}`);
			return {
				dev: metadata.dev,
				ino: metadata.ino
			};
		};
		assertPathIdentity = async (path, expected) => {
			const metadata = await lstat(path, { bigint: true });
			if (!metadata.isDirectory() || metadata.dev !== expected.dev || metadata.ino !== expected.ino) throw replacedDirectory(path);
		};
		assertHandleIdentity = async (handle, expected, path) => {
			const metadata = await handle.stat({ bigint: true });
			if (!metadata.isDirectory() || metadata.dev !== expected.dev || metadata.ino !== expected.ino) throw replacedDirectory(path);
		};
		readFileIdentity = async (handle, path) => {
			const metadata = await handle.stat({ bigint: true });
			if (!metadata.isFile()) throw new ArtifactReaderFailure("path", `Extraction file identity changed: ${path}`);
			return {
				dev: metadata.dev,
				ino: metadata.ino
			};
		};
		assertFilePathIdentity = async (path, expected) => {
			const metadata = await lstat(path, { bigint: true });
			if (!metadata.isFile() || metadata.dev !== expected.dev || metadata.ino !== expected.ino) throw new ArtifactReaderFailure("path", `Extraction file identity changed: ${path}`);
		};
		isAbsent = async (path) => lstat(path).then(() => false, (cause) => {
			if (isNotFound(cause)) return true;
			throw cause;
		});
		replacedDirectory = (path) => new ArtifactReaderFailure("path", `Extraction directory identity changed: ${path}`);
		isNotFound = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
//#region dist/artifacts/SafeOutputTreeReadback.js
var hashOutputFile;
function init_SafeOutputTreeReadback() {
	return (init_SafeOutputTreeReadback = __esmMin((() => {
		init_readArtifactFileChunks();
		init_ArtifactFileOperation();
		init_StreamBytes();
		init_ArtifactReader();
		init_SafeOutputTreeIdentity();
		hashOutputFile = async (owner, path, identity, options) => {
			assertArtifactReadActive(options.signal);
			const admittedIdentity = await readFileIdentity(owner.handle, path);
			await assertFilePathIdentity(path, identity);
			if (admittedIdentity.dev !== identity.dev || admittedIdentity.ino !== identity.ino) throw new ArtifactReaderFailure("path", `Extraction file identity changed: ${path}`);
			const hash = createHash("sha256");
			let bytes = 0;
			for await (const raw of readArtifactFileChunks(owner.handle, options)) {
				const chunk = streamChunkToBuffer(raw);
				bytes += chunk.length;
				if (bytes > options.maximum) throw new ArtifactReaderFailure("integrity", "Readback exceeded the bytes written");
				hash.update(chunk);
			}
			await assertFilePathIdentity(path, identity);
			assertArtifactReadActive(options.signal);
			return {
				sha256: hash.digest("hex"),
				bytes
			};
		};
	})))();
}

//#endregion
//#region dist/artifacts/SafeOutputTreeCleanup.js
var removeOwnedTree, removeFiles, requireEmpty;
function init_SafeOutputTreeCleanup() {
	return (init_SafeOutputTreeCleanup = __esmMin((() => {
		init_ArtifactReader();
		init_SafeOutputTreeIdentity();
		removeOwnedTree = async (input) => {
			const { outputRoot, rootIdentity, directories, files } = input;
			const filesByDirectory = new Map();
			for (const entry of files) {
				const directory = dirname(entry[0]);
				const group = filesByDirectory.get(directory) ?? [];
				group.push(entry);
				filesByDirectory.set(directory, group);
			}
			const postorder = [...directories].sort(([left], [right]) => right.slice(outputRoot.length).split(sep).length - left.slice(outputRoot.length).split(sep).length);
			for (const [path, identity] of postorder) {
				await removeFiles(path, identity, filesByDirectory.get(path) ?? [], files);
				const parentPath = dirname(path);
				const parentIdentity = parentPath === outputRoot ? rootIdentity : directories.get(parentPath);
				if (parentIdentity === undefined) throw replacedDirectory(parentPath);
				await assertPathIdentity(parentPath, parentIdentity);
				await assertPathIdentity(path, identity);
				await requireEmpty(path);
				await rmdir(path);
				directories.delete(path);
			}
			await removeFiles(outputRoot, rootIdentity, filesByDirectory.get(outputRoot) ?? [], files);
			await assertPathIdentity(outputRoot, rootIdentity);
			await requireEmpty(outputRoot);
			if (!input.preserveRoot) await rmdir(outputRoot);
		};
		removeFiles = async (directory, identity, filesInDirectory, retainedFiles) => {
			for (const [path, fileIdentity] of filesInDirectory) {
				await assertPathIdentity(directory, identity);
				await assertFilePathIdentity(path, fileIdentity);
				await unlink(path);
				retainedFiles.delete(path);
			}
		};
		requireEmpty = async (directory) => {
			if ((await readdir(directory)).length > 0) throw new ArtifactReaderFailure("path", `Unowned entries remain in extraction directory: ${directory}`);
		};
	})))();
}

//#endregion
//#region dist/artifacts/SafeOutputTree.js
var SafeOutputTree, isRejected, writeAll, normalizeDestinationPath, abortIfNeeded, isCancellationFailure, isAlreadyExists, throwIfDestinationCaseCollision;
function init_SafeOutputTree() {
	return (init_SafeOutputTree = __esmMin((() => {
		init_OwnedFileHandle();
		init_StreamBytes();
		init_ArtifactPaths();
		init_callerPath();
		init_ArtifactReader();
		init_SafeOutputTreeAdmission();
		init_SafeOutputTreeCreationFailure();
		init_SafeOutputTreeReadback();
		init_SafeOutputTreeCleanup();
		init_SafeOutputTreeIdentity();
		SafeOutputTree = class SafeOutputTree {
			platform;
			selectedRoot;
			#registry = new ArtifactPathRegistry();
			#outputRoot;
			#rootIdentity;
			#nestedDirectories = new Map();
			#unknownDirectories = new Set();
			#ownedFiles = new Map();
			/** Exclusive files awaiting identity admission; admitted identity and handles have separate owners. */
			#pendingFiles = new Map();
			#openHandles = new Set();
			#published = false;
			#createdRoot = true;
			#cleanup = { status: "not-required" };
			constructor(outputRoot, platform, selectedRoot) {
				this.platform = platform;
				this.selectedRoot = selectedRoot;
				this.#outputRoot = outputRoot;
			}
			/**
			* Exclusively create the destination, or explicitly admit a caller-owned empty
			* directory. Admission never grants authority to remove that existing root.
			*
			* Windows inherits ACLs: mode bits do not establish owner-only access there.
			* Directory `fchmod`/`fsync` are skipped on Windows because those operations
			* have no equivalent on the directory descriptor.
			*/
			static async create(outputRoot, platform = process.platform, options = {}) {
				const { requested, canonicalOutput } = await this.#resolveDestination(outputRoot);
				let created = true;
				await mkdir(canonicalOutput, { mode: 448 }).catch((cause) => {
					if (!isAlreadyExists(cause)) throw cause;
					if (options.acceptExistingEmpty) {
						created = false;
						return;
					}
					throw new SafeOutputTreeDestinationRefusal("Extraction output root already exists", { cause });
				});
				const tree = new SafeOutputTree(canonicalOutput, platform, requested);
				tree.#createdRoot = created;
				try {
					const rootIdentity = await readDirectoryIdentity(canonicalOutput).catch((cause) => {
						if (!created && cause instanceof ArtifactReaderFailure && cause.reason === "path") throw new SafeOutputTreeDestinationRefusal(cause.message, { cause });
						throw cause;
					});
					tree.#rootIdentity = rootIdentity;
					if (!created && (await readdir(canonicalOutput)).length > 0) throw new SafeOutputTreeDestinationRefusal("Output directory is not empty");
					if (created) await tree.#secureCreatedDirectory(canonicalOutput, rootIdentity);
					await assertPathIdentity(canonicalOutput, rootIdentity);
					return tree;
				} catch (cause) {
					throw new SafeOutputTreeCreationFailure(cause, tree);
				}
			}
			/** Read-only early admission; create() still rechecks and acquires exclusively. */
			static async checkDestination(outputRoot) {
				const { canonicalOutput } = await this.#resolveDestination(outputRoot);
				const existing = await lstat(canonicalOutput).catch((cause) => {
					if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
					if (cause instanceof Error && "code" in cause && [
						"ENOTDIR",
						"EACCES",
						"EPERM"
					].includes(String(cause.code))) throw new SafeOutputTreeDestinationRefusal("Extraction output path is unavailable", { cause });
					throw cause;
				});
				if (existing !== undefined) throw new SafeOutputTreeDestinationRefusal("Extraction output root already exists");
				await access(dirname(canonicalOutput), constants.W_OK | constants.X_OK).catch((cause) => {
					if (cause instanceof Error && "code" in cause && [
						"EACCES",
						"EPERM",
						"ENOENT",
						"ENOTDIR"
					].includes(String(cause.code))) throw new SafeOutputTreeDestinationRefusal("Extraction output parent is not writable", { cause });
					throw cause;
				});
			}
			static async #resolveDestination(outputRoot) {
				if (!isAbsolute(outputRoot)) throw new SafeOutputTreeDestinationRefusal("Extraction output root must be absolute");
				const requested = absoluteCallerPath(outputRoot);
				const name = basename(requested);
				if (name === "." || name === "..") throw new SafeOutputTreeDestinationRefusal("Invalid extraction output root");
				const parent = await realpath(dirname(requested)).catch((cause) => {
					if (cause instanceof Error && "code" in cause && [
						"ENOENT",
						"ENOTDIR",
						"EACCES",
						"EPERM"
					].includes(String(cause.code))) throw new SafeOutputTreeDestinationRefusal("Extraction output parent is unavailable", { cause });
					throw new ArtifactReaderFailure("unavailable", "Extraction output parent is unavailable", { cause });
				});
				const canonicalOutput = join(parent, name);
				return {
					requested,
					canonicalOutput
				};
			}
			get outputRoot() {
				return this.#outputRoot;
			}
			/** The output was durably committed, even if descriptor cleanup later failed. */
			get published() {
				return this.#published;
			}
			get cleanup() {
				return structuredClone(this.#cleanup);
			}
			/** Stream one regular file with exact byte and digest verification. */
			async write(relativePath, source, expected, signal) {
				try {
					this.#assertWritable();
					if (!Number.isSafeInteger(expected.bytes) || expected.bytes < 0) throw new ArtifactReaderFailure("format", `Invalid expected extraction size for ${relativePath}`);
					const path = normalizeDestinationPath(relativePath, this.platform);
					this.#registry.add(path, "file");
					const lineage = await this.#prepareParent(path);
					const parent = lineage.at(-1);
					if (parent === undefined) throw replacedDirectory(this.#outputRoot);
					const fileName = path.slice(path.lastIndexOf("/") + 1);
					const destination = join(parent.path, fileName);
					const handle = await open(destination, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 384).catch(async (cause) => {
						if (isAlreadyExists(cause)) await throwIfDestinationCaseCollision(parent.path, path, cause);
						throw new ArtifactReaderFailure("path", `Could not exclusively create extraction path: ${path}`, { cause });
					});
					const ownedHandle = this.#trackHandle(handle);
					this.#pendingFiles.set(destination, ownedHandle);
					const fileIdentity = await readFileIdentity(ownedHandle.handle, destination);
					await assertFilePathIdentity(destination, fileIdentity);
					this.#ownedFiles.set(destination, fileIdentity);
					this.#pendingFiles.delete(destination);
					if (this.platform !== "win32") {
						await ownedHandle.handle.chmod(384);
						if (((await ownedHandle.handle.stat()).mode & 511) !== 384) throw new ArtifactReaderFailure("path", "Could not establish private output file permissions");
					}
					const hash = createHash("sha256");
					let bytes = 0;
					await this.#assertLineage(lineage);
					for await (const raw of source) {
						abortIfNeeded(signal);
						const chunk = streamChunkToBuffer(raw);
						if (chunk.length > expected.bytes - bytes) throw new ArtifactReaderFailure("integrity", `Extracted content exceeds the inventoried size: ${path}`);
						bytes += chunk.length;
						hash.update(chunk);
						await writeAll(ownedHandle.handle, chunk);
					}
					if (bytes !== expected.bytes) throw new ArtifactReaderFailure("integrity", `Extracted content size disagrees with inventory: ${path}`);
					const sha256 = hash.digest("hex");
					if (sha256 !== expected.sha256) throw new ArtifactReaderFailure("integrity", `Extracted content disagrees with inventory: ${path}`);
					await this.#assertLineage(lineage);
					await assertFilePathIdentity(destination, fileIdentity);
					await ownedHandle.handle.sync();
					await this.#closeHandle(ownedHandle);
					const readbackHandle = this.#trackHandle(await open(destination, constants.O_RDONLY | constants.O_NOFOLLOW));
					const readback = await hashOutputFile(readbackHandle, destination, fileIdentity, {
						maximum: bytes,
						signal
					});
					await this.#closeHandle(readbackHandle);
					await this.#assertLineage(lineage);
					await assertFilePathIdentity(destination, fileIdentity);
					if (readback.sha256 !== sha256 || readback.bytes !== bytes) throw new ArtifactReaderFailure("integrity", `Durable readback verification failed: ${path}`);
					return {
						relativePath: path,
						sha256,
						bytesWritten: bytes
					};
				} catch (cause) {
					try {
						source.destroy();
					} catch {}
					throw cause;
				}
			}
			/** Sync files' containing directories from children to root, then publish the root in its parent. */
			async commit(signal) {
				this.#assertWritable();
				abortIfNeeded(signal);
				await this.#assertOwnedDirectories();
				await this.#assertExactEntries();
				abortIfNeeded(signal);
				if (this.platform === "win32") {
					this.#published = true;
					return;
				}
				const parent = this.#trackHandle(await open(dirname(this.#outputRoot), constants.O_RDONLY | constants.O_DIRECTORY));
				const handles = [parent];
				let sync = { kind: "synced" };
				try {
					const directories = [...this.#nestedDirectories].reverse();
					directories.push([this.#outputRoot, this.#requireRootIdentity()]);
					for (const [path, identity] of directories) {
						abortIfNeeded(signal);
						const directory = this.#trackHandle(await open(path, constants.O_RDONLY | constants.O_DIRECTORY));
						handles.push(directory);
						await assertHandleIdentity(directory.handle, identity, path);
						await directory.handle.sync();
						abortIfNeeded(signal);
						await this.#closeHandle(directory);
						handles.pop();
					}
					await parent.handle.sync();
					abortIfNeeded(signal);
					await this.#assertExactEntries();
					abortIfNeeded(signal);
					this.#published = true;
				} catch (cause) {
					sync = {
						kind: "failed",
						cause
					};
				}
				const closeResults = await Promise.allSettled(handles.map((handle) => this.#closeHandle(handle)));
				const closeFailures = closeResults.filter(isRejected).map(({ reason }) => reason);
				if (closeFailures.length > 0) {
					const closeFailure = new AggregateError(closeFailures, "Extraction output directory handles could not be closed");
					const cleanup = ArtifactReaderFailure.cleanupObservation(closeFailure, this.#outputRoot);
					if (sync.kind === "failed") {
						const primary = isCancellationFailure(sync.cause) ? sync.cause : new ArtifactReaderFailure("path", "Could not durably sync extraction output", { cause: sync.cause });
						throw ArtifactReaderFailure.withCleanup(primary, cleanup);
					}
					throw ArtifactReaderFailure.withCleanup(closeFailure, cleanup);
				}
				if (sync.kind === "failed") {
					if (isCancellationFailure(sync.cause)) throw sync.cause;
					throw new ArtifactReaderFailure("path", "Could not durably sync extraction output", { cause: sync.cause });
				}
			}
			/** Remove only this operation's unsealed tree and verify absence. */
			async rollback() {
				if (this.#published) {
					await this.closeHandles();
					return structuredClone(this.#cleanup);
				}
				if (this.#cleanup.status === "complete") return structuredClone(this.#cleanup);
				this.#cleanup = {
					status: "incomplete",
					residualPaths: [basename(this.#outputRoot)]
				};
				let removalFailure;
				try {
					await this.#admitPendingFiles();
					await this.closeHandles();
					await this.#assertOwnedDirectories();
					await removeOwnedTree({
						outputRoot: this.#outputRoot,
						rootIdentity: this.#requireRootIdentity(),
						directories: this.#nestedDirectories,
						files: this.#ownedFiles,
						preserveRoot: !this.#createdRoot
					});
					if (!this.#createdRoot) await assertPathIdentity(this.#outputRoot, this.#requireRootIdentity());
				} catch (cause) {
					removalFailure = cause;
				}
				const complete = removalFailure === undefined && (!this.#createdRoot || await isAbsent(this.#outputRoot));
				this.#cleanup = complete ? {
					status: "complete",
					residualPaths: []
				} : {
					status: "incomplete",
					residualPaths: [basename(this.#outputRoot)]
				};
				if (!complete) throw new ArtifactReaderFailure("integrity", `Extraction output cleanup could not be verified${removalFailure === undefined ? "" : `: ${removalFailure instanceof Error ? removalFailure.message : String(removalFailure)}`}`, {
					cause: removalFailure,
					cleanup: {
						reason: removalFailure instanceof Error ? removalFailure.message : "Extraction output root remains after rollback",
						resources: [this.#outputRoot]
					}
				});
				return structuredClone(this.#cleanup);
			}
			async #secureCreatedDirectory(path, identity) {
				if (this.platform === "win32") return;
				const stagingHandle = this.#trackHandle(await open(path, constants.O_RDONLY | constants.O_DIRECTORY).catch(async (cause) => {
					if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EACCES") throw cause;
					await assertPathIdentity(path, identity);
					await chmod(path, 448);
					await assertPathIdentity(path, identity);
					return open(path, constants.O_RDONLY | constants.O_DIRECTORY);
				}));
				let setup = { kind: "ready" };
				try {
					await assertHandleIdentity(stagingHandle.handle, identity, path);
					await stagingHandle.handle.chmod(448);
					if (((await stagingHandle.handle.stat()).mode & 511) !== 448) throw new ArtifactReaderFailure("path", "Could not establish owner access to output directory");
				} catch (cause) {
					setup = {
						kind: "failed",
						cause
					};
				}
				try {
					await this.#closeHandle(stagingHandle);
				} catch (closeCause) {
					if (setup.kind === "failed") throw ArtifactReaderFailure.withCleanup(setup.cause, ArtifactReaderFailure.cleanupObservation(closeCause, path));
					throw closeCause;
				}
				if (setup.kind === "failed") throw setup.cause;
			}
			async #prepareParent(relativePath) {
				const parts = relativePath.split("/");
				if (parts.pop() === undefined) throw new ArtifactReaderFailure("path", "Invalid extraction path");
				let current = this.#outputRoot;
				let logicalParent = "";
				const lineage = [{
					path: this.#outputRoot,
					identity: this.#requireRootIdentity()
				}];
				if (parts.length === 0) await assertPathIdentity(this.#outputRoot, this.#requireRootIdentity());
				for (const part of parts) {
					const parent = lineage.at(-1);
					if (parent === undefined) throw replacedDirectory(this.#outputRoot);
					const logicalPath = logicalParent.length === 0 ? part : `${logicalParent}/${part}`;
					current = join(current, part);
					await assertPathIdentity(parent.path, parent.identity);
					const creation = await mkdir(current, { mode: 448 }).then(() => ({ kind: "created" }), (cause) => {
						if (!isAlreadyExists(cause)) throw cause;
						return {
							kind: "existing",
							cause
						};
					});
					if (creation.kind === "existing") {
						await throwIfDestinationCaseCollision(parent.path, logicalPath, creation.cause);
						const identity = this.#nestedDirectories.get(current);
						if (identity === undefined) throw replacedDirectory(current);
						await assertPathIdentity(current, identity);
					} else {
						const identity = await readDirectoryIdentity(current).catch((cause) => {
							this.#unknownDirectories.add(current);
							throw cause;
						});
						this.#nestedDirectories.set(current, identity);
						await this.#secureCreatedDirectory(current, identity);
					}
					await assertPathIdentity(parent.path, parent.identity);
					const identity = this.#nestedDirectories.get(current);
					if (identity === undefined) throw replacedDirectory(current);
					await assertPathIdentity(current, identity);
					lineage.push({
						path: current,
						identity
					});
					logicalParent = logicalPath;
				}
				return lineage;
			}
			async #assertLineage(lineage) {
				for (const { path, identity } of lineage) await assertPathIdentity(path, identity);
			}
			async #assertOwnedDirectories() {
				const rootIdentity = this.#requireRootIdentity();
				await assertPathIdentity(this.#outputRoot, rootIdentity);
				await assertPathIdentity(this.selectedRoot, rootIdentity);
				for (const [path, identity] of this.#nestedDirectories) await assertPathIdentity(path, identity);
				if (this.#unknownDirectories.size > 0) throw new ArtifactReaderFailure("path", `Extraction directory ownership is unknown: ${[...this.#unknownDirectories].join(", ")}`);
			}
			async #assertExactEntries() {
				await assertExactTreeEntries(this.#outputRoot, this.#nestedDirectories, this.#ownedFiles);
				await this.#assertOwnedDirectories();
			}
			#requireRootIdentity() {
				if (this.#rootIdentity === undefined) throw new ArtifactReaderFailure("path", `Extraction output root identity is unknown: ${this.#outputRoot}`);
				return this.#rootIdentity;
			}
			#assertWritable() {
				if (this.#published) throw new ArtifactReaderFailure("integrity", "Extraction tree is already committed");
				if (this.#cleanup.status !== "not-required") throw new ArtifactReaderFailure("integrity", "Extraction tree cleanup has already started");
			}
			#trackHandle(handle) {
				const owner = new OwnedFileHandle(handle);
				this.#openHandles.add(owner);
				return owner;
			}
			async #closeHandle(owner) {
				await owner.close();
				this.#openHandles.delete(owner);
			}
			/** Release descriptors without deleting an inspectable partial output tree. */
			async closeHandles() {
				const failures = [];
				for (const owner of this.#openHandles) {
					try {
						await this.#closeHandle(owner);
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length > 0) throw new AggregateError(failures, "Output tree handles remain open");
			}
			async #admitPendingFiles() {
				for (const [path, owner] of this.#pendingFiles) {
					let identity = this.#ownedFiles.get(path);
					if (identity === undefined) {
						identity = await readFileIdentity(owner.handle, path);
						await assertFilePathIdentity(path, identity);
						this.#ownedFiles.set(path, identity);
					}
					this.#pendingFiles.delete(path);
				}
			}
		};
		isRejected = (result) => result.status === "rejected";
		writeAll = async (handle, chunk) => {
			let offset = 0;
			while (offset < chunk.length) {
				const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset);
				if (bytesWritten === 0) throw new ArtifactReaderFailure("unavailable", "Extraction output stopped accepting bytes");
				offset += bytesWritten;
			}
		};
		normalizeDestinationPath = (relativePath, platform) => {
			const path = normalizeArtifactPath(relativePath);
			if (platform === "win32" && path.includes("\\")) throw new ArtifactReaderFailure("path", `Windows destination cannot materialize artifact path: ${JSON.stringify(path)}; backslashes denote path separators.`);
			if (platform === "win32" && path.includes(":")) throw new ArtifactReaderFailure("path", `Windows destination cannot materialize artifact path as a regular file: ${path}; ':' denotes alternate data stream syntax.`);
			if (platform === "win32" && /[\u0001-\u001f]/u.test(path)) throw new ArtifactReaderFailure("path", `Windows destination cannot materialize artifact path: ${JSON.stringify(path)}; Windows names cannot contain U+0001-U+001F.`);
			return path;
		};
		abortIfNeeded = (signal) => {
			if (signal?.aborted === true) throw new ArtifactReaderFailure("cancelled", "Artifact extraction cancelled", { cause: signal.reason });
		};
		isCancellationFailure = (cause) => cause instanceof ArtifactReaderFailure && cause.reason === "cancelled";
		isAlreadyExists = (cause) => cause instanceof Error && "code" in cause && cause.code === "EEXIST";
		throwIfDestinationCaseCollision = async (parentDirectory, logicalPath, cause) => {
			const names = await readdir(parentDirectory).catch(() => undefined);
			if (names === undefined) return;
			const failure = destinationCaseCollision(logicalPath, names, cause === undefined ? undefined : { cause });
			if (failure !== undefined) throw failure;
		};
	})))();
}

//#endregion
export { SafeOutputTree, SafeOutputTreeCreationFailure, SafeOutputTreeDestinationRefusal, init_SafeOutputTree, init_SafeOutputTreeAdmission, init_SafeOutputTreeCreationFailure, outputDirectoryAdmissionRefusal };