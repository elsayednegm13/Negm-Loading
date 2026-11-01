import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { withOwnedRegularFile, RegularFileCancelled, RegularFileCleanupFailure, } from "./OwnedRegularFile.js";
import { RegularFileChangedError, RegularFileOperationCancelled, assertRegularFileActive, sameRegularFileState, } from "./RegularFile.js";
const STABLE_FILE_PREFIX_BYTES = 2;
/** Physical hash admission/read failure with no outstanding descriptor cleanup. */
export class StableFileHashFailure extends Error {
    path;
    cause;
    _tag = "StableFileHashFailure";
    constructor(path, cause) {
        super(`Could not hash ${path}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
        this.path = path;
        this.cause = cause;
        this.name = this._tag;
    }
}
/** Read the producing boundary's physical failure without guessing from signal state. */
export const stableFileHashCause = (cause) => cause instanceof StableFileHashFailure ? cause.cause : cause;
/** Hash one regular file from its admitted descriptor and verify its path state. */
export const hashStableFile = async (path, options) => {
    return await readStableFile(path, options, false);
};
/** Hash a stable file and capture exactly its first two bytes from that read. */
export const observeStableFile = (path, options) => readStableFile(path, options, true);
async function readStableFile(path, options, includePrefix) {
    try {
        return await withOwnedRegularFile(path, options, async ({ handle, initial }) => {
            if (!Number.isSafeInteger(initial.size) || initial.size < 0)
                throw new RangeError(`Regular file size cannot be represented safely: ${path}`);
            const hash = createHash("sha256");
            const chunk = Buffer.allocUnsafe(64 * 1024);
            const prefix = Buffer.alloc(includePrefix ? Math.min(STABLE_FILE_PREFIX_BYTES, initial.size) : 0);
            let position = 0;
            while (position <= initial.size) {
                assertRegularFileActive(options.signal);
                const length = Math.min(chunk.length, initial.size - position + 1);
                if (length <= 0)
                    break;
                const read = await handle.read(chunk, 0, length, position);
                if (position + read.bytesRead > initial.size ||
                    (read.bytesRead === 0 && position < initial.size))
                    throw new RegularFileChangedError(path);
                assertRegularFileActive(options.signal);
                if (read.bytesRead === 0)
                    break;
                if (position < prefix.length) {
                    const prefixBytes = Math.min(read.bytesRead, prefix.length - position);
                    chunk.copy(prefix, position, 0, prefixBytes);
                }
                hash.update(chunk.subarray(0, read.bytesRead));
                position += read.bytesRead;
            }
            assertRegularFileActive(options.signal);
            const [opened, currentPath] = await Promise.all([
                handle.stat(),
                stat(path),
            ]);
            if (position !== initial.size ||
                !sameRegularFileState(initial, opened) ||
                !sameRegularFileState(initial, currentPath))
                throw new RegularFileChangedError(path);
            assertRegularFileActive(options.signal);
            const fingerprint = { sha256: hash.digest("hex"), bytes: position };
            return includePrefix ? { ...fingerprint, prefix } : fingerprint;
        });
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure ||
            cause instanceof RegularFileCancelled ||
            cause instanceof RegularFileOperationCancelled)
            throw cause;
        throw new StableFileHashFailure(path, cause);
    }
}
