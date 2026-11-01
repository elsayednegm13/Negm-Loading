import { analysisViewInputError } from "./analysisViewErrors.js";
import { err, ok } from "../result.js";
import { pageViewCoverage } from "./analysisViewCoverage.js";
const viewError = (message) => analysisViewInputError([
    { path: ["view"], reason: "invalid_value", message },
]);
/** Slice text by UTF-16 code units without losing a partial Unicode character. */
export const analysisTextPage = (body, offset, limit, label = "Pseudocode") => {
    const start = Math.min(offset, body.length);
    const high = (n) => n >= 0xd800 && n <= 0xdbff;
    const low = (n) => n >= 0xdc00 && n <= 0xdfff;
    if (start > 0 &&
        start < body.length &&
        high(body.charCodeAt(start - 1)) &&
        low(body.charCodeAt(start)))
        return err(viewError(`${label} offset splits a UTF-16 surrogate pair.`));
    let end = Math.min(start + limit, body.length);
    if (end > start &&
        end < body.length &&
        high(body.charCodeAt(end - 1)) &&
        low(body.charCodeAt(end)))
        end--;
    if (end === start && start < body.length)
        return err(viewError(`Increase ${label.toLowerCase()} limit to include the next complete Unicode character.`));
    return ok({
        item: { text: body.slice(start, end), unit: "utf16-code-units" },
        coverage: pageViewCoverage(start, end - start, body.length),
    });
};
