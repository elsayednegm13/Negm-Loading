import { lstat, stat } from "node:fs/promises";
import { assertRegularFileActive, RegularFileChangedError, sameRegularFileState, } from "./RegularFile.js";
/** Resource refusal carries the observed extent before allocating file bytes. */
export class RegularFileCapacityError extends Error {
    path;
    maximumBytes;
    observedBytes;
    _tag = "RegularFileCapacityError";
    constructor(path, maximumBytes, observedBytes) {
        super(`Selected file must be at most ${maximumBytes} bytes: ${path}`);
        this.path = path;
        this.maximumBytes = maximumBytes;
        this.observedBytes = observedBytes;
        this.name = this._tag;
    }
}
/** Read an admitted descriptor completely, checking its extent and selected name. */
export const readStableFileBytes = async (file, path, maximumBytes, options) => {
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0)
        throw new RangeError("Maximum file bytes must be a nonnegative safe integer");
    assertRegularFileActive(options.signal);
    const before = await file.stat({ bigint: true });
    if (before.size > BigInt(maximumBytes))
        throw new RegularFileCapacityError(path, maximumBytes, before.size);
    const bytes = await readExtent(file, path, Number(before.size), options.signal);
    assertRegularFileActive(options.signal);
    const extra = Buffer.alloc(1);
    if ((await file.read(extra, 0, 1, bytes.length)).bytesRead !== 0)
        throw new RegularFileChangedError(path);
    await assertStableIdentity(file, path, before, options);
    return bytes;
};
/** Read only the requested prefix, retaining the validated full file extent. */
export const readStableFilePrefix = async (file, path, maximumBytes, options) => {
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0)
        throw new RangeError("Maximum prefix bytes must be a nonnegative safe integer");
    assertRegularFileActive(options.signal);
    const before = await file.stat({ bigint: true });
    const length = Number(before.size < BigInt(maximumBytes) ? before.size : BigInt(maximumBytes));
    const bytes = await readExtent(file, path, length, options.signal);
    await assertStableIdentity(file, path, before, options);
    return { bytes, size: before.size };
};
const readExtent = async (file, path, length, signal) => {
    assertRegularFileActive(signal);
    const bytes = Buffer.alloc(length);
    let offset = 0;
    while (offset < bytes.length) {
        assertRegularFileActive(signal);
        const read = await file.read({
            buffer: bytes,
            offset,
            length: bytes.length - offset,
            position: offset,
        });
        if (read.bytesRead === 0)
            throw new RegularFileChangedError(path);
        offset += read.bytesRead;
    }
    assertRegularFileActive(signal);
    return bytes;
};
const assertStableIdentity = async (file, path, before, options) => {
    assertRegularFileActive(options.signal);
    const named = async () => {
        try {
            return await (options.symlinks === "follow" ? stat : lstat)(path, {
                bigint: true,
            });
        }
        catch (cause) {
            if (cause instanceof Error &&
                "code" in cause &&
                (cause.code === "ENOENT" ||
                    cause.code === "ENOTDIR" ||
                    cause.code === "ELOOP"))
                throw new RegularFileChangedError(path, { cause });
            throw cause;
        }
    };
    if (!sameRegularFileState(before, await file.stat({ bigint: true })) ||
        !sameRegularFileState(before, await named()))
        throw new RegularFileChangedError(path);
    assertRegularFileActive(options.signal);
};
