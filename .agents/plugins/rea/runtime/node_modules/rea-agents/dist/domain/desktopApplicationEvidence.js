import { createEvidence, } from "./evidence.js";
/** One Evidence interpretation for complete and interrupted directory observations. */
export const createDesktopApplicationEvidence = (input, report, provider) => createEvidence({
    path: report.root.path,
    format: "directory",
    sha256: report.root.snapshot_sha256,
}, provider, {
    operation: "inspect_desktop_application",
    parameters: input,
    result: report,
    rawResult: null,
    confidence: "observed",
    limitations: report.limitations,
    locations: [{ kind: "artifact-path", path: input.path }],
});
