import { constants } from "node:fs";
import { lstat, open, opendir, realpath, } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { Readable } from "node:stream";
import { ArtifactReaderFailure, sameArtifactSourceIdentity, } from "./ArtifactReader.js";
import { hostExecutableMarking } from "./hostExecutableMarking.js";
import { OwnedDirectoryHandle } from "../filesystem/OwnedDirectoryHandle.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { readArtifactFileChunks } from "./readArtifactFileChunks.js";
import { withOwnedFileHandle, RegularFileCleanupFailure, RegularFileCancelled, } from "../filesystem/OwnedRegularFile.js";
import { RegularFileOperationCancelled } from "../filesystem/RegularFile.js";
import { ArtifactFileCancelled, ArtifactFileCleanupFailure, } from "./ArtifactFileOperation.js";
import { AnalysisCleanupLease } from "./AnalysisCleanupLease.js";
import { decodeDirectoryEntryName } from "../filesystem/decodeDirectoryEntryName.js";
/** Exhausted an examined-entry budget; unrelated I/O and cleanup failures stay distinct. */
export class DirectoryArtifactTraversalLimit extends ArtifactReaderFailure {
    examinedEntries;
    maximumEntries;
    constructor(examinedEntries, maximumEntries) {
        super("limit", "Directory traversal reached its examined-entry budget", {
            boundary: "capacity",
        });
        this.examinedEntries = examinedEntries;
        this.maximumEntries = maximumEntries;
    }
}
/**
 * The selected root could not be admitted or opened. The consumer that owns
 * the caller's selection classifies it; `cause` retains the host failure.
 */
export class DirectoryArtifactRootFailure extends ArtifactReaderFailure {
}
/**
 * A selected child entry could not be opened because the host denied read
 * access. The consumer that owns the caller's selection classifies it;
 * `systemCode` and `entryPath` retain what the host actually reported so the
 * classification never has to be re-derived from message text.
 */
export class DirectoryArtifactEntryAccessDenied extends ArtifactReaderFailure {
    systemCode;
    entryPath;
    constructor(systemCode, entryPath, message, options) {
        super("io", message, options);
        this.systemCode = systemCode;
        this.entryPath = entryPath;
    }
}
/** Non-symlink-following directory reader. */
export class DirectoryArtifactReader {
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
        if (maximum !== undefined &&
            (!Number.isSafeInteger(maximum) || maximum < 0))
            throw new RangeError("Directory traversal maximumEntries must be a nonnegative safe integer");
        let examined = 0;
        const examine = () => {
            if (maximum !== undefined && examined >= maximum)
                throw new DirectoryArtifactTraversalLimit(examined, maximum);
            examined += 1;
        };
        const pending = [root];
        let unrepresentableNameCount = 0;
        let firstUnrepresentableNameHex;
        while (pending.length > 0) {
            abortIfNeeded(signal);
            const directory = pending.pop();
            if (directory === undefined)
                break;
            await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
            try {
                for await (const entry of this.#readDirectory(directory, pending, signal, options, examine, (rawHex) => {
                    unrepresentableNameCount += 1;
                    firstUnrepresentableNameHex ??= rawHex;
                }))
                    yield entry;
            }
            catch (cause) {
                if (this.unreadableDirectories !== "omit" ||
                    !(cause instanceof DirectoryArtifactEntryAccessDenied))
                    throw cause;
                abortIfNeeded(signal);
                options?.onOmission?.({
                    path: cause.entryPath,
                    kind: "directory-descendants",
                });
                options?.onCoverage?.({
                    status: "unknown",
                    limitations: [cause.message],
                });
                continue;
            }
            await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
        }
        if (unrepresentableNameCount > 0)
            options?.onCoverage?.({
                status: "unknown",
                examinedEntries: examined,
                limitations: [
                    `Directory contains ${String(unrepresentableNameCount)} entry name(s) that are not valid UTF-8; no filesystem operations were performed for them. First raw basename bytes: ${firstUnrepresentableNameHex ?? "unknown"}.`,
                ],
            });
    }
    /** Admission facts, shared with traversal; the selected root may be a symlink. */
    rootObservation() {
        return this.#resolveRoot();
    }
    async #resolveRoot() {
        return (this.#rootPromise ??= (async () => {
            const root = await realpath(this.#rootPath);
            const metadata = await lstat(root, { bigint: true });
            if (metadata.isSymbolicLink())
                throw new ArtifactReaderFailure("path", "Artifact root changed during traversal");
            if (!metadata.isDirectory())
                throw new DirectoryArtifactRootFailure("path", "Artifact root must be a directory");
            return Object.freeze({
                canonicalPath: root,
                identity: Object.freeze({ dev: metadata.dev, ino: metadata.ino }),
            });
        })().catch((cause) => {
            if (cause instanceof ArtifactReaderFailure)
                throw cause;
            throw directoryIoFailure("resolve artifact root", this.#rootPath, cause, DirectoryArtifactRootFailure);
        }));
    }
    async *#readDirectory(directory, pending, signal, options, examine, noteUnrepresentableName) {
        const admittedRoot = await this.#resolveRoot();
        const root = admittedRoot.canonicalPath;
        const handle = new OwnedDirectoryHandle(await opendir(directory, { encoding: "buffer" }).catch((cause) => {
            const code = hostErrorCode(cause);
            if (directory !== root && (code === "EACCES" || code === "EPERM"))
                throw new DirectoryArtifactEntryAccessDenied(code, relative(root, directory).split(sep).join("/"), directoryIoFailure("open directory", directory, cause).message, { cause });
            throw directoryIoFailure("open directory", directory, cause, directory === root
                ? DirectoryArtifactRootFailure
                : ArtifactReaderFailure);
        }));
        this.#directories.add(handle);
        const childDirectories = [];
        let traversal = {
            kind: "complete",
        };
        try {
            for (;;) {
                await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, admittedRoot.identity));
                const child = await handle.handle.read();
                if (child === null)
                    break;
                examine();
                abortIfNeeded(signal);
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
                    options?.onOmission?.({ path, kind: unsupportedEntryKind(metadata) });
                    continue;
                }
                yield entry;
                if (entry.kind === "directory") {
                    if (options?.descendInto?.(path) ?? true)
                        childDirectories.push(absolute);
                    else
                        options?.onOmission?.({ path, kind: "directory-descendants" });
                }
            }
        }
        catch (cause) {
            traversal = {
                kind: "failed",
                cause: cause instanceof ArtifactReaderFailure
                    ? cause
                    : directoryIoFailure("read directory", directory, cause),
            };
        }
        finally {
            await this.#finishDirectory(handle, directory, traversal);
        }
        if (traversal.kind === "failed")
            throw traversal.cause;
        childDirectories.reverse();
        pending.push(...childDirectories);
    }
    async #finishDirectory(handle, path, traversal) {
        try {
            await handle.close();
            this.#directories.delete(handle);
        }
        catch (cause) {
            const closeFailure = directoryIoFailure("close directory", path, cause);
            if (traversal.kind === "failed")
                throw ArtifactReaderFailure.withCleanup(traversal.cause, ArtifactReaderFailure.cleanupObservation(closeFailure, path));
            throw closeFailure;
        }
    }
    async #openFile(entry, signal) {
        abortIfNeeded(signal);
        if (entry.kind !== "file")
            throw new ArtifactReaderFailure("format", "Only regular files can be opened");
        const fileHandle = await open(entry.adapterKey, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK).catch((cause) => {
            throw entryOpenFailure(entry, cause);
        });
        const owner = new OwnedFileHandle(fileHandle);
        this.#files.set(owner, entry.adapterKey);
        try {
            const observed = await owner.handle
                .stat({ bigint: true })
                .catch((cause) => {
                throw directoryIoFailure("inspect opened entry", entry.adapterKey, cause);
            });
            if (!observed.isFile() ||
                !sameArtifactSourceIdentity(entry.sourceIdentity, observed)) {
                throw new ArtifactReaderFailure("integrity", `Directory entry changed before open: ${entry.path}`);
            }
            abortIfNeeded(signal);
            return owner;
        }
        catch (cause) {
            try {
                await this.#closeFile(owner);
            }
            catch (closeCause) {
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
                    outcome = { kind: "completed", value: await inspect(file) };
                }
                catch (cause) {
                    outcome = { kind: "failed", cause };
                }
                const [opened, named] = await Promise.all([
                    file.stat({ bigint: true }),
                    lstat(entry.adapterKey, { bigint: true }),
                ]);
                abortIfNeeded(signal);
                if (!opened.isFile() ||
                    !named.isFile() ||
                    !sameArtifactSourceIdentity(entry.sourceIdentity, opened) ||
                    !sameArtifactSourceIdentity(entry.sourceIdentity, named))
                    throw new ArtifactReaderFailure("integrity", `Directory entry changed during inspection: ${entry.path}`);
                if (outcome.kind === "failed")
                    throw outcome.cause;
                return outcome.value;
            });
            this.#files.delete(owner);
            return value;
        }
        catch (cause) {
            if (cause instanceof RegularFileCleanupFailure) {
                const lease = new AnalysisCleanupLease(() => this.#closeFile(owner), [entry.adapterKey]);
                this.#fileCleanup.set(owner, lease);
                throw new ArtifactFileCleanupFailure(cause, lease);
            }
            this.#files.delete(owner);
            if (cause instanceof RegularFileCancelled)
                throw new ArtifactFileCancelled(cause);
            if (cause instanceof RegularFileOperationCancelled)
                throw new ArtifactReaderFailure("cancelled", "Directory inspection cancelled", { cause: cause.reason });
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
                if (lease === undefined)
                    await this.#closeFile(owner);
                else
                    await lease.release();
            }
            catch (cause) {
                failures.push(directoryIoFailure("close opened entry", path, cause));
            }
        }
        for (const owner of this.#directories) {
            try {
                await owner.close();
                this.#directories.delete(owner);
            }
            catch (cause) {
                failures.push(directoryIoFailure("close directory", owner.handle.path, cause));
            }
        }
        if (failures.length > 0) {
            const reason = failures.map(failureMessage).join("; ");
            throw new ArtifactReaderFailure("io", `Directory artifact cleanup failed: ${reason}`, {
                cause: new AggregateError(failures),
                cleanup: {
                    reason,
                    resources: [
                        ...this.#files.values(),
                        ...[...this.#directories].map((owner) => owner.handle.path),
                    ],
                },
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
}
const unsupportedEntryKind = (metadata) => metadata.isFIFO()
    ? "fifo"
    : metadata.isSocket()
        ? "socket"
        : metadata.isBlockDevice()
            ? "block-device"
            : metadata.isCharacterDevice()
                ? "character-device"
                : "unsupported";
const artifactEntry = (path, absolute, metadata) => {
    const kind = metadata.isSymbolicLink()
        ? "symlink"
        : metadata.isDirectory()
            ? "directory"
            : metadata.isFile()
                ? "file"
                : undefined;
    if (kind === undefined)
        return undefined;
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
        limitations: kind === "symlink"
            ? ["Symlink target was not followed or disclosed."]
            : [],
        adapterKey: absolute,
        ...(kind === "file"
            ? {
                sourceIdentity: {
                    device: metadata.dev,
                    inode: metadata.ino,
                    size: metadata.size,
                    mode: metadata.mode,
                    mtimeNs: metadata.mtimeNs,
                    ctimeNs: metadata.ctimeNs,
                },
            }
            : {}),
    };
};
const safeArtifactSize = (size) => {
    if (size < 0n || size > BigInt(Number.MAX_SAFE_INTEGER))
        return null;
    return Number(size);
};
const directoryIoFailure = (operation, path, cause, Failure = ArtifactReaderFailure) => {
    if (cause instanceof ArtifactReaderFailure)
        return cause;
    const code = hostErrorCode(cause);
    const suffix = code === undefined ? "" : ` (${code})`;
    const detail = failureMessage(cause);
    return new Failure("io", `Could not ${operation} at ${path}${suffix}: ${detail}`, {
        cause,
    });
};
/** The host errno a lower-level failure reported, when it reported one. */
const hostErrorCode = (cause) => typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    typeof cause.code === "string"
    ? cause.code
    : undefined;
/**
 * Report a refused entry open as the host's read-access denial so the consumer
 * that owns the caller's selection can classify it without re-reading text.
 */
const entryOpenFailure = (entry, cause) => {
    const failure = directoryIoFailure("open entry", entry.adapterKey, cause);
    const code = hostErrorCode(cause);
    return code === "EACCES" || code === "EPERM"
        ? new DirectoryArtifactEntryAccessDenied(code, entry.path, failure.message, { cause })
        : failure;
};
const failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
const mapStableFileRead = async function* (handle, entry, signal) {
    let bytes = 0n;
    try {
        const expectedBytes = entry.sourceIdentity?.size;
        if (expectedBytes === undefined)
            throw new ArtifactReaderFailure("integrity", `Directory entry has no captured file state: ${entry.path}`);
        for await (const chunk of readArtifactFileChunks(handle, {
            // Include one extra byte so a growing file cannot make this read unbounded.
            end: expectedBytes,
            signal,
        })) {
            abortIfNeeded(signal);
            bytes += BigInt(chunk.length);
            yield chunk;
        }
        abortIfNeeded(signal);
        const [opened, current] = await Promise.all([
            handle.stat({ bigint: true }),
            lstat(entry.adapterKey, { bigint: true }),
        ]);
        abortIfNeeded(signal);
        if (!opened.isFile() ||
            !current.isFile() ||
            !sameArtifactSourceIdentity(entry.sourceIdentity, opened) ||
            !sameArtifactSourceIdentity(entry.sourceIdentity, current) ||
            bytes !== expectedBytes)
            throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`);
    }
    catch (cause) {
        if (cause instanceof Error &&
            "code" in cause &&
            ["ENOENT", "ENOTDIR", "ELOOP"].includes(String(cause.code)))
            throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`, { cause });
        if (!(cause instanceof ArtifactReaderFailure))
            throw directoryIoFailure("validate read entry", entry.adapterKey, cause);
        throw cause;
    }
};
const withDirectoryIoContext = async (operation, path, action) => {
    try {
        return await action();
    }
    catch (cause) {
        throw directoryIoFailure(operation, path, cause);
    }
};
const abortIfNeeded = (signal) => {
    if (signal?.aborted === true)
        throw new ArtifactReaderFailure("cancelled", "Artifact traversal cancelled", { cause: signal.reason });
};
const assertContainedDirectory = async (root, directory, rootIdentity) => {
    const canonical = await realpath(directory);
    const fromRoot = relative(root, canonical);
    const metadata = await lstat(directory);
    const currentRoot = await lstat(root, { bigint: true });
    if (rootIdentity === undefined ||
        currentRoot.dev !== rootIdentity.dev ||
        currentRoot.ino !== rootIdentity.ino ||
        metadata.isSymbolicLink() ||
        !metadata.isDirectory() ||
        fromRoot === ".." ||
        fromRoot.startsWith(`..${sep}`) ||
        isAbsolute(fromRoot))
        throw new ArtifactReaderFailure("path", "Directory traversal escaped or changed its artifact root");
};
