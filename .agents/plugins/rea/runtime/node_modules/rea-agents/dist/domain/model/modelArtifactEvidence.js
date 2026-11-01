import { createEvidence, } from "../evidence.js";
/** One Evidence interpretation for success and observations retained by file finalization failures. */
export const createModelArtifactEvidence = (report, provider, parameters) => {
    const source = report.artifact;
    return createEvidence(source.sha256 === null
        ? undefined
        : { path: source.path, sha256: source.sha256, format: "file" }, provider, {
        operation: "inspect_model_artifact",
        parameters: { path: parameters.path, hash: parameters.hash },
        result: report,
        confidence: "observed",
        subjectUnavailableReason: "Full-file identity is unknown in header-only mode; normalized_result.artifact records a scoped header SHA-256 and exact source path/extent.",
        locations: [
            { kind: "artifact-path", path: source.path },
            { kind: "file-offset-range", start: 0, end: source.header_length },
        ],
        limitations: report.limitations,
    });
};
/** Evidence for completed GGUF facts retained before final identity verification. */
export const createModelArtifactPartialEvidence = (partial, provider, parameters) => createEvidence(undefined, provider, {
    operation: "inspect_model_artifact",
    parameters: { path: parameters.path, hash: parameters.hash },
    result: partial,
    confidence: "observed",
    subjectUnavailableReason: "The interrupted read did not complete final file identity verification; digest and identity remain unknown.",
    // Each retained row already owns its exact source offset and length.
    locations: [{ kind: "artifact-path", path: partial.artifact.path }],
    limitations: partial.limitations,
});
