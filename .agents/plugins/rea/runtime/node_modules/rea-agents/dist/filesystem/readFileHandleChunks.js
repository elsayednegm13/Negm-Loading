import { Readable } from "node:stream";
/** Cancellation observed by the descriptor read, retaining the caller's exact reason. */
export class FileReadCancelled extends Error {
    reason;
    constructor(reason) {
        super("File read cancelled", { cause: reason });
        this.reason = reason;
        this.name = "FileReadCancelled";
    }
}
/** Stream positional reads while leaving descriptor cleanup to its owner. */
export const readFileHandleChunks = (handle, options = {}) => {
    const start = fileOffset(options.start ?? 0);
    const unlimited = options.end === undefined || options.end === Infinity;
    const end = unlimited ? undefined : fileOffset(options.end);
    if (start === undefined ||
        (!unlimited && end === undefined) ||
        (end !== undefined && end < start))
        throw new RangeError("Invalid file read range");
    let readPending = false;
    let totalBytes = 0n;
    let coverage;
    const cancellationFailure = () => options.cancellationFailure?.(options.signal?.reason) ??
        new FileReadCancelled(options.signal?.reason);
    const assertActive = () => {
        if (options.signal?.aborted)
            throw cancellationFailure();
    };
    const source = Readable.from((async function* () {
        let position = start;
        while (end === undefined || position <= end) {
            assertActive();
            const remaining = end === undefined ? undefined : end - position + 1n;
            const chunk = Buffer.allocUnsafe(remaining === undefined || remaining > 64n * 1024n
                ? 64 * 1024
                : Number(remaining));
            readPending = true;
            let bytesRead;
            try {
                ({ bytesRead } = await handle.read(chunk, 0, chunk.length, position));
            }
            finally {
                readPending = false;
            }
            totalBytes += BigInt(bytesRead);
            if (bytesRead === 0)
                coverage = Object.freeze({
                    kind: "complete",
                    bytes: totalBytes,
                    boundary: "eof",
                });
            else if (end !== undefined && position + BigInt(bytesRead) > end)
                coverage = Object.freeze({
                    kind: "complete",
                    bytes: totalBytes,
                    boundary: "range",
                });
            assertActive();
            if (bytesRead === 0)
                return;
            position += BigInt(bytesRead);
            yield chunk.subarray(0, bytesRead);
        }
    })(), {
        objectMode: false,
    });
    const onAbort = () => {
        // A native descriptor read cannot be interrupted. Its rejection remains
        // primary; a fulfilled read observes cancellation before yielding bytes.
        if (!readPending && !source.destroyed)
            source.destroy(cancellationFailure());
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });
    source.once("close", () => options.signal?.removeEventListener("abort", onAbort));
    if (options.signal?.aborted)
        onAbort();
    return Object.assign(source, {
        readCoverage: () => coverage ?? Object.freeze({ kind: "incomplete", bytes: totalBytes }),
    });
};
const fileOffset = (value) => {
    if (typeof value === "bigint")
        return value >= 0n ? value : undefined;
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : undefined;
};
