import { createHash } from "node:crypto";
import { assertArtifactReadActive } from "../artifacts/ArtifactFileOperation.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { BinaryFormatFailure, BinaryResourceFailure, } from "../native/metadata/BinaryContainer.js";
export const GPU_OBJECT_BYTES = 128 * 1024 * 1024;
export const GPU_REPORT_BYTES = 16 * 1024 * 1024;
/** A retained-facts refusal aborts discovery; it is never downgraded to one opaque payload. */
export class GpuReportCapacityFailure extends BinaryResourceFailure {
    constructor() {
        super("structure", GPU_REPORT_BYTES, "GPU facts exceed the 16 MiB retained report budget");
    }
}
export const rejectGpu = (message) => {
    throw new BinaryFormatFailure("malformed", message);
};
export const gpuCount = (value) => {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
        rejectGpu("GPU range exceeds exact host offset precision");
    return Number(value);
};
export const checkGpuRange = (length, offset, size) => {
    if (!Number.isSafeInteger(offset) ||
        !Number.isSafeInteger(size) ||
        offset < 0 ||
        size < 0 ||
        offset > length ||
        size > length - offset)
        rejectGpu("GPU byte range is outside its containing object");
    if (size > GPU_OBJECT_BYTES)
        throw new BinaryResourceFailure("structure", GPU_OBJECT_BYTES, "GPU object exceeds the 128 MiB decoding budget");
};
export class GpuFileSource {
    file;
    size;
    signal;
    containerId = null;
    bytesRead = 0;
    constructor(file, size, signal) {
        this.file = file;
        this.size = size;
        this.signal = signal;
    }
    async read(offset, size) {
        checkGpuRange(this.size, offset, size);
        const bytes = Buffer.alloc(size);
        let position = 0;
        while (position < size) {
            assertArtifactReadActive(this.signal);
            const result = await this.file.read(bytes, position, size - position, offset + position);
            if (result.bytesRead === 0)
                throw new ArtifactReaderFailure("integrity", "GPU source was truncated during inspection");
            position += result.bytesRead;
            this.bytesRead += result.bytesRead;
        }
        return bytes;
    }
    async digest() {
        const hash = createHash("sha256");
        for (let position = 0; position < this.size;) {
            const bytes = await this.read(position, Math.min(1024 * 1024, this.size - position));
            hash.update(bytes);
            position += bytes.length;
        }
        return hash.digest("hex");
    }
}
export class GpuBufferSource {
    bytes;
    containerId;
    size;
    constructor(bytes, containerId) {
        this.bytes = bytes;
        this.containerId = containerId;
        this.size = bytes.length;
    }
    async read(offset, size) {
        checkGpuRange(this.size, offset, size);
        return this.bytes.subarray(offset, offset + size);
    }
}
export const readGpuNativeDirectory = async (source, steps) => {
    let next = steps.next();
    while (!next.done) {
        const { offset, size } = next.value;
        next = steps.next(await source.read(offset, size));
    }
    return next.value;
};
export const gpuSha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const nextGpuContainerOffset = async (source, start) => {
    let width = 64;
    for (let position = start; position < source.size;) {
        const bytes = await source.read(position, Math.min(width, source.size - position));
        const index = bytes.findIndex((byte) => byte !== 0);
        if (index >= 0)
            return position + index;
        position += bytes.length;
        width = 65536;
    }
    return source.size;
};
