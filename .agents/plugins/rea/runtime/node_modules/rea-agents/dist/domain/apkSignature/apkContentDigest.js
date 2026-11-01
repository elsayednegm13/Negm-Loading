const CHUNK_SIZE = 1024 * 1024;
const EOCD_CD_OFFSET_FIELD = 16;
const u32le = (value) => {
    const out = new Uint8Array(4);
    new DataView(out.buffer).setUint32(0, value, true);
    return out;
};
export const computeApkContentDigest = (bytes, layout, createHash) => {
    const { tail, blockStart, algorithm } = layout;
    const { centralDirectoryOffset, centralDirectorySize, eocdOffset } = tail;
    if (blockStart < 0 ||
        blockStart > centralDirectoryOffset ||
        centralDirectoryOffset + centralDirectorySize !== eocdOffset ||
        eocdOffset + 22 > bytes.length)
        return null;
    // A true copy: on a Node Buffer `.slice()` is a view over a possibly pooled
    // ArrayBuffer, so rewriting through it would corrupt the caller's bytes. The
    // DataView must also honour the copy's own byteOffset.
    const eocd = Uint8Array.from(bytes.subarray(eocdOffset));
    new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength).setUint32(EOCD_CD_OFFSET_FIELD, blockStart, true);
    const sections = [
        bytes.subarray(0, blockStart),
        bytes.subarray(centralDirectoryOffset, eocdOffset),
        eocd,
    ];
    const chunkDigests = [];
    for (const section of sections)
        for (let offset = 0; offset < section.length; offset += CHUNK_SIZE) {
            const chunk = section.subarray(offset, Math.min(offset + CHUNK_SIZE, section.length));
            const hash = createHash(algorithm);
            hash.update(Uint8Array.of(0xa5));
            hash.update(u32le(chunk.length));
            hash.update(chunk);
            chunkDigests.push(hash.digest());
        }
    const top = createHash(algorithm);
    top.update(Uint8Array.of(0x5a));
    top.update(u32le(chunkDigests.length));
    for (const digest of chunkDigests)
        top.update(digest);
    return top.digest();
};
