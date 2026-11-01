/** Exact path-name rules used to select APK v1 signing metadata. */
export const APK_V1_META_INF_PREFIX = "META-INF/";
export const APK_V1_MANIFEST_PATH = `${APK_V1_META_INF_PREFIX}MANIFEST.MF`;
const META_INF_PREFIX_BYTES = Uint8Array.from([...APK_V1_META_INF_PREFIX].map((character) => character.charCodeAt(0)));
const BLOCK_SUFFIXES = [".RSA", ".DSA", ".EC"];
export const isV1SignatureFileName = (name) => name.endsWith(".SF");
export const isV1SignatureBlockName = (name) => BLOCK_SUFFIXES.some((suffix) => name.endsWith(suffix));
export const v1SignatureFileNameForBlock = (block) => `${block.slice(0, block.lastIndexOf("."))}.SF`;
export const isV1SignatureMetadataName = (name) => name.startsWith(APK_V1_META_INF_PREFIX) &&
    (name === APK_V1_MANIFEST_PATH ||
        isV1SignatureFileName(name) ||
        isV1SignatureBlockName(name));
/** Test the raw central-directory name before decoding noncandidate ZIP paths. */
export const startsWithV1MetaInfPrefix = (bytes, start, length) => {
    if (length < META_INF_PREFIX_BYTES.length)
        return false;
    for (let index = 0; index < META_INF_PREFIX_BYTES.length; index += 1)
        if (bytes[start + index] !== META_INF_PREFIX_BYTES[index])
            return false;
    return true;
};
