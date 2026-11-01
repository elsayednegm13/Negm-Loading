export class XmlPlistTextDecodeError extends TypeError {
    reason;
    declaredEncoding;
    constructor(reason, message, declaredEncoding, options) {
        super(message, options);
        this.reason = reason;
        this.declaredEncoding = declaredEncoding;
        this.name = "XmlPlistTextDecodeError";
    }
}
/** Decode BOM-aware XML plist text and verify any declaration against its bytes. */
export const decodeXmlPlistText = (bytes) => {
    if ((bytes[0] === 0xff &&
        bytes[1] === 0xfe &&
        bytes[2] === 0 &&
        bytes[3] === 0) ||
        (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0xfe && bytes[3] === 0xff))
        throw new XmlPlistTextDecodeError("unsupported-encoding", "Unsupported XML encoding: UTF-32. Supported encodings are UTF-8 and BOM-marked UTF-16 in either byte order.", "UTF-32");
    const encoding = bytes[0] === 0xff && bytes[1] === 0xfe
        ? "utf-16le"
        : bytes[0] === 0xfe && bytes[1] === 0xff
            ? "utf-16be"
            : "utf-8";
    // An ASCII declaration can identify an unsupported legacy encoding before
    // its body is incorrectly subjected to UTF-8 validation.
    const prolog = encoding === "utf-8" ? asciiXmlDeclaration(bytes) : undefined;
    const declaration = prolog === undefined ? undefined : declaredEncoding(prolog);
    if (prolog !== undefined)
        verifyEncodingDeclaration(declaration, encoding);
    let text;
    try {
        text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
    }
    catch (cause) {
        throw new XmlPlistTextDecodeError("invalid-bytes", "XML text bytes are invalid for the detected encoding", undefined, { cause });
    }
    if (prolog === undefined)
        verifyEncodingDeclaration(declaredEncoding(text), encoding);
    return text;
};
const declaredEncoding = (text) => /^<\?xml\s[^?]*\bencoding\s*=\s*["']([^"']+)["']/u.exec(text)?.[1];
/** Only a complete ASCII XML declaration is interpretable before body decoding. */
const asciiXmlDeclaration = (bytes) => {
    const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
    if (bytes[start] !== 0x3c ||
        bytes[start + 1] !== 0x3f ||
        bytes[start + 2] !== 0x78 ||
        bytes[start + 3] !== 0x6d ||
        bytes[start + 4] !== 0x6c)
        return undefined;
    for (let index = start + 5; index < bytes.length; index += 1) {
        if (bytes[index] > 0x7f)
            return undefined;
        if (bytes[index] === 0x3f && bytes[index + 1] === 0x3e)
            return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(start, index + 2));
    }
    return undefined;
};
const verifyEncodingDeclaration = (declaration, encoding) => {
    const declared = declaration?.toLowerCase();
    if (declared !== undefined &&
        !["utf-8", "utf-16", "utf-16le", "utf-16be"].includes(declared))
        throw new XmlPlistTextDecodeError("unsupported-encoding", `Unsupported XML encoding declaration: ${declaration}. Supported encodings are UTF-8 and BOM-marked UTF-16 in either byte order.`, declaration);
    if (declared !== undefined &&
        declared !== encoding &&
        !(encoding !== "utf-8" && declared === "utf-16"))
        throw new XmlPlistTextDecodeError("encoding-mismatch", "XML encoding declaration disagrees with its bytes", declaration);
};
