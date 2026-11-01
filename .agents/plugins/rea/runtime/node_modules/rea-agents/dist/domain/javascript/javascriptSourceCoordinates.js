import { z } from "zod";
/** Compare parser coordinates by line, then UTF-16 column. */
export const compareJavaScriptSourcePoints = (left, right) => left.line - right.line || left.column - right.column;
/** Include equal endpoints without implying runtime reachability. */
export const javascriptSourceRangeContains = (outer, inner) => compareJavaScriptSourcePoints(outer.start, inner.start) <= 0 &&
    compareJavaScriptSourcePoints(outer.end, inner.end) >= 0;
/** Exact artifact-local coordinate key; callers supply the artifact identity. */
export const javascriptSourceRangeKey = (range) => `${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`;
const sourcePointSchema = z.strictObject({
    line: z.number().int().min(1),
    column: z.number().int().min(0),
});
/** JavaScript source coordinates use one-based lines and zero-based columns. */
export const javascriptSourceRangeSchema = z
    .strictObject({ start: sourcePointSchema, end: sourcePointSchema })
    .superRefine((range, context) => {
    if (compareJavaScriptSourcePoints(range.end, range.start) < 0)
        context.addIssue({
            code: "custom",
            path: ["end"],
            message: "Source range end must not precede its start",
        });
})
    .describe("One-based lines, zero-based UTF-16 columns; start inclusive, end exclusive.");
