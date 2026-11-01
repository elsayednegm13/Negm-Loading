import { lstat, mkdtemp, open, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OwnedFileHandle } from "../../filesystem/OwnedFileHandle.js";
import { openRegularFile, RegularFileAdmissionFailure, sameRegularFileState, } from "../../filesystem/RegularFile.js";
import { ArtifactReaderFailure } from "../ArtifactReader.js";
import { ArtifactResourceScope, } from "../ArtifactResourceScope.js";
import { abortIfNeeded } from "../ArtifactHash.js";
import { readArtifactFileChunks } from "../readArtifactFileChunks.js";
import { pyInstallerMemberStream, readPyInstallerMemberPrefix, } from "./PyInstallerMemberStream.js";
import { artifactFileAdmissionFailure } from "../ArtifactFileAdmission.js";
import { reconstructedPycHeader, isHeaderlessPythonCode, } from "./PythonBytecode.js";
// Each outer-compressed image retains one inode and its identity until close.
// This is a per-reader filesystem capacity budget, independent of byte budgets.
const MAX_PRIVATE_PYZ_IMAGES = 128;
/** The reader's operation scope drains work before retiring these private files. */
export class PyInstallerPyzStore {
    #root;
    #serial = 0;
    #owners = new Map();
    #cleanup = new ArtifactResourceScope();
    #images = new Map();
    reserveImages(count) {
        if (count > MAX_PRIVATE_PYZ_IMAGES)
            throw new ArtifactReaderFailure("limit", "PyInstaller compressed PYZ images exceed the 128-file private storage budget", { boundary: "capacity" });
    }
    async bytecodeHeader(handle, archiveStart, entry, magic, signal) {
        const unchanged = { header: undefined, limitation: undefined };
        if (magic === undefined)
            return unchanged;
        if (entry.typeCode === "s")
            return { header: reconstructedPycHeader(magic), limitation: undefined };
        if (entry.typeCode !== "m" && entry.typeCode !== "M")
            return unchanged;
        const prefix = await readPyInstallerMemberPrefix(async (active) => (await this.memberSource({
            kind: "carchive",
            archiveStart,
            source: entry,
            header: undefined,
        }, handle, active)).source, {
            sourceBytes: entry.compressedSize,
            compressed: entry.compressionFlag === 1,
            expectedBytes: entry.uncompressedSize,
            maxBytes: entry.uncompressedSize,
            signal: signal ?? new AbortController().signal,
        }, 4);
        return isHeaderlessPythonCode(prefix)
            ? { header: reconstructedPycHeader(magic), limitation: undefined }
            : {
                header: undefined,
                limitation: "CArchive module is not identified as headerless marshal code; its original bytes are preserved without reconstructing a Python bytecode header.",
            };
    }
    async spool(handle, archiveStart, entry, signal) {
        abortIfNeeded(signal);
        if (entry.compressedSize === 0)
            throw new ArtifactReaderFailure("format", "Compressed PYZ image has no zlib bytes");
        this.#root ??= await mkdtemp(join(tmpdir(), "rea-pyz-"));
        const path = join(this.#root, String(this.#serial++));
        const writer = await open(path, "wx", 0o600);
        this.#retain(path, new OwnedFileHandle(writer));
        abortIfNeeded(signal);
        const source = readArtifactFileChunks(handle, {
            start: archiveStart + entry.offset,
            end: archiveStart + entry.offset + entry.compressedSize - 1,
            signal,
        });
        const stream = pyInstallerMemberStream(source, {
            sourceBytes: entry.compressedSize,
            compressed: true,
            header: undefined,
            expectedBytes: entry.uncompressedSize,
            maxBytes: entry.uncompressedSize,
            signal: signal ?? new AbortController().signal,
        });
        const copied = this.#writeImage(writer, stream.output, signal);
        const outcomes = await Promise.allSettled([stream.completion, copied]);
        // A failed native write can retire the upstream stream. Preserve that I/O
        // failure instead of replacing it with a secondary premature-close error.
        const copy = outcomes[1];
        if (copy?.status === "rejected")
            throw copy.reason;
        const decoded = outcomes[0];
        if (decoded?.status === "rejected")
            throw decoded.reason;
        await this.release(writer);
        abortIfNeeded(signal);
        const { handle: opened, initial } = await this.#admit(path, signal);
        this.#images.set(opened, { path, initial });
        return { handle: opened, start: 0 };
    }
    async release(handle) {
        const owner = this.#owners.get(handle);
        if (owner === undefined)
            return;
        const outcome = await this.#cleanup.release(owner);
        if (outcome.kind === "failed")
            throw outcome.cause;
        this.#owners.delete(handle);
    }
    async memberSource(read, root, signal) {
        let handle = read.kind === "carchive" ? root : read.handle;
        if (handle === undefined)
            throw new ArtifactReaderFailure("unavailable", "PyInstaller archive is closed");
        const image = read.kind === "pyz" ? this.#images.get(handle) : undefined;
        let verify;
        let close;
        if (image !== undefined) {
            ({ handle } = await this.#admit(image.path, signal));
            const opened = handle;
            verify = () => this.#verifyImage(opened, image);
            close = async (primary) => {
                try {
                    await this.release(opened);
                }
                catch (cause) {
                    throw ArtifactReaderFailure.withCleanup(primary ?? cause, ArtifactReaderFailure.cleanupObservation(cause, image.path));
                }
            };
            await verify();
        }
        abortIfNeeded(signal);
        const start = read.kind === "carchive"
            ? read.archiveStart + read.source.offset
            : read.offset;
        const length = read.kind === "carchive" ? read.source.compressedSize : read.length;
        const source = length === 0
            ? Readable.from([])
            : readArtifactFileChunks(handle, {
                start,
                end: start + length - 1,
                signal,
            });
        source.on("error", () => undefined);
        return {
            source,
            ...(verify === undefined ? {} : { verify }),
            ...(close === undefined ? {} : { close }),
        };
    }
    async close() {
        await this.#cleanup.close();
        this.#owners.clear();
        if (this.#root !== undefined) {
            try {
                await rm(this.#root, { recursive: true, force: true });
            }
            catch (cause) {
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
                signal,
            });
            this.#retain(path, new OwnedFileHandle(source.handle));
            return source;
        }
        catch (cause) {
            if (cause instanceof RegularFileAdmissionFailure)
                this.#retain(path, cause.owner);
            throw artifactFileAdmissionFailure(path, "PyInstaller", cause);
        }
    }
    #retain(path, handle) {
        const owner = { kind: "file-handle", resource: path, handle };
        this.#owners.set(handle.handle, owner);
        this.#cleanup.retain(owner);
    }
    async #writeImage(handle, source, signal) {
        let position = 0;
        for await (const chunk of source) {
            // Stop writing after cancellation; drain only already-produced bytes so
            // the descriptor source can report its in-flight I/O outcome truthfully.
            if (signal?.aborted)
                continue;
            let offset = 0;
            try {
                while (offset < chunk.length) {
                    const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset, position);
                    if (bytesWritten === 0)
                        throw new ArtifactReaderFailure("io", "Private PYZ write made no progress");
                    offset += bytesWritten;
                    position += bytesWritten;
                    if (signal?.aborted)
                        break;
                }
            }
            catch (cause) {
                const failure = cause instanceof ArtifactReaderFailure
                    ? cause
                    : new ArtifactReaderFailure("io", "Private PYZ image could not be written", { cause });
                source.destroy(failure);
                throw failure;
            }
        }
        abortIfNeeded(signal);
    }
    async #verifyImage(handle, image) {
        const states = await Promise.all([handle.stat(), lstat(image.path)]);
        if (states.some((state) => !sameRegularFileState(image.initial, state)))
            throw new ArtifactReaderFailure("integrity", "Private PYZ image changed after parsing");
    }
}
