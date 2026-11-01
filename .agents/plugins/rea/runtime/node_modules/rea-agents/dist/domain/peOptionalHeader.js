import { err, ok } from "./result.js";
/** Decode structural declarations without admitting a machine, file extent, or directory address. */
export const readPeOptionalHeaderStructure = (bytes) => {
    if (bytes.byteLength < 2)
        return err({
            kind: "malformed",
            reason: "truncated-magic",
            message: "truncated PE optional header",
        });
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = view.getUint16(0, true);
    if (magic !== 0x10b && magic !== 0x20b)
        return err({
            kind: "unsupported",
            reason: "unsupported-magic",
            message: "Only PE32 and PE32+ image optional headers are supported",
        });
    const bits = magic === 0x20b ? 64 : 32;
    const directoryOffset = bits === 64 ? 112 : 96;
    if (bytes.byteLength < directoryOffset)
        return err({
            kind: "malformed",
            reason: "truncated-fixed-fields",
            message: "truncated PE optional header",
        });
    const directoryCount = view.getUint32(directoryOffset - 4, true);
    if (directoryCount > Math.floor((bytes.byteLength - directoryOffset) / 8))
        return err({
            kind: "malformed",
            reason: "truncated-directory-table",
            message: "truncated PE data-directory table",
        });
    const dataDirectories = Array.from({ length: directoryCount }, (_, index) => {
        const offset = directoryOffset + index * 8;
        return {
            address: view.getUint32(offset, true),
            size: view.getUint32(offset + 4, true),
            offset,
        };
    });
    return ok({
        magic,
        bits,
        format: bits === 64 ? "pe32-plus" : "pe32",
        sizeOfHeaders: view.getUint32(60, true),
        directoryOffset,
        directoryCount,
        dataDirectories,
    });
};
