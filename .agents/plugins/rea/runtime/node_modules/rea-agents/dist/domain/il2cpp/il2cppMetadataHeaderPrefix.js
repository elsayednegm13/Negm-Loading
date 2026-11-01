import { IL2CPP_METADATA_MAGIC } from "./il2cppMetadata.js";
/** Parse the shared magic/version prefix once, retaining incomplete identity explicitly. */
export const observeIl2cppMetadataHeaderPrefix = (bytes) => {
    if (bytes.byteLength < 4)
        return {
            kind: "unavailable-magic",
            magic: null,
            rawVersion: null,
            version: null,
        };
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = view.getUint32(0, true);
    if (magic !== IL2CPP_METADATA_MAGIC)
        return {
            kind: "other-magic",
            magic,
            rawVersion: null,
            version: null,
        };
    if (bytes.byteLength < 8)
        return {
            kind: "il2cpp",
            magic: IL2CPP_METADATA_MAGIC,
            rawVersion: null,
            version: null,
        };
    return {
        kind: "il2cpp",
        magic: IL2CPP_METADATA_MAGIC,
        rawVersion: view.getUint32(4, true),
        version: view.getInt32(4, true),
    };
};
