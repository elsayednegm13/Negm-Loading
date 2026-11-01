import { StringDecoder } from "node:string_decoder";
import { err, ok } from "../domain/result.js";
/**
 * Read LF/CRLF control frames without retaining an oversized line. Limits apply
 * to decoded UTF-8 content, excluding the delimiter. Oversize is reported once
 * as soon as it is known; rejected content is drained before the next frame.
 * The caller owns failure classification and whether to continue reading.
 * The supplied iterator owns the input stream's early-return cleanup policy.
 */
export async function* readBoundedControlLines(chunks, maxBytes) {
    const decoder = new StringDecoder("utf8");
    let pending = "";
    let pendingBytes = 0;
    let oversized = false;
    const append = (fragment) => {
        if (oversized || fragment.length === 0)
            return false;
        const bytes = pendingBytes + Buffer.byteLength(fragment);
        // A final CR might be half of a split CRLF. Admit it provisionally, then
        // count it as content if another character or EOF follows instead of LF.
        if (bytes > maxBytes + (fragment.endsWith("\r") ? 1 : 0)) {
            oversized = true;
            pending = "";
            pendingBytes = 0;
            return true;
        }
        pending += fragment;
        pendingBytes = bytes;
        return false;
    };
    const finish = (delimiter) => {
        const line = delimiter === "lf" && pending.endsWith("\r")
            ? pending.slice(0, -1)
            : pending;
        const result = oversized || Buffer.byteLength(line) > maxBytes
            ? err({ _tag: "ControlLineLimitExceeded" })
            : ok(line);
        pending = "";
        pendingBytes = 0;
        oversized = false;
        return result;
    };
    function* consume(decoded) {
        let start = 0;
        for (;;) {
            const newline = decoded.indexOf("\n", start);
            if (newline < 0) {
                if (append(decoded.slice(start)))
                    yield err({ _tag: "ControlLineLimitExceeded" });
                return;
            }
            if (append(decoded.slice(start, newline)))
                yield err({ _tag: "ControlLineLimitExceeded" });
            if (!oversized)
                yield finish("lf");
            else {
                pending = "";
                pendingBytes = 0;
                oversized = false;
            }
            start = newline + 1;
        }
    }
    for await (const chunk of chunks) {
        // Bound decoding expansion as well as retained line content. A malformed
        // source byte can expand to a three-byte UTF-8 replacement character.
        for (let offset = 0; offset < chunk.byteLength; offset += maxBytes + 1)
            yield* consume(decoder.write(chunk.subarray(offset, offset + maxBytes + 1)));
    }
    yield* consume(decoder.end());
    if (!oversized && pending.length > 0)
        yield finish("eof");
}
