import { z } from "zod";
const contentTextSchema = z.object({
    response: z.object({
        content: z.object({
            text: z.unknown().optional(),
            encoding: z.unknown().optional(),
        }),
    }),
});
/** Strict, and keeping a leading byte-order mark, so callers see the recorded text unchanged. */
const strictUtf8 = () => new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
/** Base64 characters that decode to just over `limitBytes`, so a cut prefix still fills it. */
export const base64PrefixChars = (limitBytes) => Math.ceil((limitBytes + 4) / 3) * 4;
/** Decode retained base64 as strict UTF-8, only as far as `limitBytes`; bytes that are not UTF-8 stay base64. */
export const decodeRetainedBase64 = (encoded, limitBytes) => {
    const prefixChars = base64PrefixChars(limitBytes);
    const cut = encoded.length > prefixChars;
    const prefix = cut ? encoded.slice(0, prefixChars) : encoded;
    const flags = cut ? { bodyCut: true } : {};
    try {
        // A cut prefix may end inside a character; streaming leaves that tail undecoded.
        const text = strictUtf8().decode(Buffer.from(prefix, "base64"), {
            stream: cut,
        });
        return { bodyText: text, ...flags };
    }
    catch {
        // Binary or non-UTF-8 bytes: keep them exactly, as base64, instead of inventing replacement characters.
        return { bodyText: prefix, bodyEncoding: "base64", ...flags };
    }
};
/** Read producer-decoded text or supported HAR base64; unknown encoding declarations stay opaque. Base64 beyond `limitBytes` is decoded only that far. */
export const readRecordedResponseBody = (record, limitBytes) => {
    const content = contentTextSchema.safeParse(record.reported);
    if (!content.success)
        return { bodyText: null };
    const { text, encoding } = content.data.response.content;
    if (typeof text !== "string")
        return { bodyText: null };
    if (encoding === undefined) {
        // A hidden content property could have been the encoding declaration;
        // omission after redaction does not establish producer-decoded text.
        const hiddenNames = record.redactions.some((redaction) => "scope" in redaction && redaction.pointer === "/response/content");
        return { bodyText: hiddenNames ? null : text };
    }
    if (encoding !== "base64")
        return { bodyText: null };
    const binary = record.binary_fields.find((field) => field.pointer === "/response/content/text" && field.state === "retained");
    if (binary === undefined || binary.content_base64 === null)
        return { bodyText: null };
    return decodeRetainedBase64(binary.content_base64, limitBytes);
};
/** Prove decoded emptiness with a bounded prefix, preserving encoding and cut uncertainty. */
export const recordedResponseBodyIsEmpty = (record) => {
    const body = readRecordedResponseBody(record, 0);
    return (body.bodyText === "" &&
        body.bodyEncoding === undefined &&
        body.bodyCut !== true);
};
