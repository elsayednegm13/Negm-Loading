import { z } from "zod";
import { digestSchema } from "../digests.js";
/** One physical file occurrence, independent of its graph representations. */
export const javaScriptFileOccurrenceSchema = z.strictObject({
    container_sha256: digestSchema,
    path: z.string().min(1),
    sha256: digestSchema,
});
/** Whether an inventoried path has a source extension read by the analyzer. */
export const isJavaScriptSourcePath = (path) => /\.(?:cjs|cts|mjs|mts|js|jsx|ts|tsx)$/iu.test(path);
/** Producer text exclusions shared by full and incremental source projections. */
export const javaScriptArtifactTextExclusion = (file) => {
    if (file.text.included || file.text.reason === "not-applicable")
        return null;
    if (file.text.reason === "invalid-utf8" && file.kind !== "javascript")
        return null;
    return file.text.reason === "outside-analysis-scope"
        ? "Source was not analyzed because it is outside the caller-selected source_paths."
        : "Source bytes are not valid UTF-8; JavaScript semantics were not analyzed.";
};
/** Source availability shared by semantic consumers of parsed artifact facts. */
export const javaScriptSemanticSourceExclusion = (file, parseStatus) => {
    if (file.kind !== "javascript")
        return null;
    return (javaScriptArtifactTextExclusion(file) ??
        (parseStatus === "failed"
            ? "JavaScript syntax could not be parsed; JavaScript semantics were not analyzed."
            : null));
};
