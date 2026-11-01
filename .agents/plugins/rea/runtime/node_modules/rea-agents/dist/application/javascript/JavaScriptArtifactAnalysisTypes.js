/** Applicable processing of inventoried files; native bytes remain metadata-only. */
export const javascriptArtifactAnalysisScopes = {
    javascript: {
        operation: "analyze-javascript-source",
        authority: "ast-static-analysis",
    },
    "package-json": {
        operation: "parse-package-json",
        authority: "artifact-bytes",
    },
    json: { operation: "parse-json-module", authority: "artifact-bytes" },
    html: {
        operation: "parse-html-script-references",
        authority: "artifact-bytes",
    },
    "source-map": {
        operation: "parse-local-source-map",
        authority: "artifact-bytes",
    },
    "native-addon": null,
};
/**
 * A JavaScript source selected for analysis whose worker produced no facts.
 * The analysis failure carries the reason; the null parse status alone reads
 * as "nothing there" instead of "not analyzed".
 */
export const isSkippedJavaScriptAnalysis = (entry) => entry.file.kind === "javascript" &&
    entry.file.text.included &&
    entry.javascript === null &&
    entry.analysis_failure !== undefined;
