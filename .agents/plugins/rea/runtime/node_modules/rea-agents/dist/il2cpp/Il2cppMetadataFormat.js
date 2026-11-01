/** Stable machine-readable reason for each rejected input. */
export const IL2CPP_METADATA_FAILURE_REASONS = {
    unsupported: ["unrecognized-magic", "unsupported-version"],
    corrupt: [
        "truncated-header",
        "unexpected-header-size",
        "section-out-of-bounds",
        "section-overlap",
        "record-size-mismatch",
        "type-index-width",
        "index-out-of-range",
        "nested-type-conflict",
        "declaring-type-mismatch",
        "image-range-overlap",
        "invalid-string",
    ],
};
/** Distinguish inputs outside decoder coverage from damaged metadata. */
export class Il2cppMetadataFormatFailure extends Error {
    reason;
    kind;
    constructor(reason, message, options) {
        super(`${reason}: ${message}`, options);
        this.reason = reason;
        this.name = "Il2cppMetadataFormatFailure";
        this.kind = IL2CPP_METADATA_FAILURE_REASONS.unsupported.includes(reason)
            ? "unsupported"
            : "corrupt";
    }
}
export const checkRange = (label, start, length, total) => {
    if (length === 0 && start >= -1 && start <= total)
        return;
    if (start < 0 || start + length > total)
        throw new Il2cppMetadataFormatFailure("index-out-of-range", `${label} range [${start}, ${start + length}) is outside the ${total} available entries`);
};
/** Read a serialized index; the all-ones value of narrow widths means -1. */
export const readIndex = (bytes, offset, width) => {
    if (width === 1) {
        const value = bytes.readUInt8(offset);
        return value === 0xff ? -1 : value;
    }
    if (width === 2) {
        const value = bytes.readUInt16LE(offset);
        return value === 0xffff ? -1 : value;
    }
    return bytes.readInt32LE(offset);
};
