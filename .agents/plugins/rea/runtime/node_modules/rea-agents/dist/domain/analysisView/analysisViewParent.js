import { analysisInputErrorFromIssues } from "../inputIssueProjection.js";
import { err, ok } from "../result.js";
import { ownedJsonValueSchema } from "../jsonValue.js";
import { canBorrowParsedJsonSnapshot, freezeOwnedJsonTreeSnapshot, isImmutableJsonSnapshot, } from "../immutableJson.js";
/** One owning schema reuses validated immutable facts for their retained lifetime. */
export const createAnalysisViewResultReader = (parser) => {
    const checked = new WeakMap();
    return (parent) => {
        const source = parent.normalizedResult;
        const reusable = parent.sealedResult === true &&
            typeof source === "object" &&
            source !== null &&
            isImmutableJsonSnapshot(source);
        const known = reusable ? checked.get(source) : undefined;
        if (known !== undefined)
            return ok(known);
        const parsed = parseAnalysisViewResult(parser, parent);
        if (!parsed.ok || !reusable)
            return parsed;
        if (canBorrowParsedJsonSnapshot(source, parsed.value)) {
            checked.set(source, source);
            return ok(source);
        }
        const normalized = ownedJsonValueSchema.safeParse(parsed.value);
        if (!normalized.success)
            return parsed;
        freezeOwnedJsonTreeSnapshot(normalized.data);
        checked.set(source, parsed.value);
        return parsed;
    };
};
/** Parse a parent's result with its owning parser; issues point into the view source. */
export const parseAnalysisViewResult = (parser, parent) => {
    const parsed = parser.safeParse(parent.normalizedResult);
    if (parsed.success)
        return ok(parsed.data);
    return err(analysisViewResultInputError(parent.normalizedResult, parsed.error));
};
/** Locate schema failures inside the retained result, including throwing parsers. */
export const analysisViewResultInputError = (input, cause) => analysisInputErrorFromIssues("inspect_analysis_view", cause.issues.map((issue) => ({
    ...issue,
    path: ["source", "normalized_result", ...issue.path],
})), { source: { normalized_result: input } }, { cause });
