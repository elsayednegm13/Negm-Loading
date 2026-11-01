/** NUL terminators and source bounds are validated by the owning format reader. */
export const decodeMachoName = (bytes) => {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch {
        return { bytes_base64: bytes.toString("base64") };
    }
};
