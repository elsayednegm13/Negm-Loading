import { createEvidence, } from "./evidence.js";
/** Commit identical facts on success and when retaining a completed observation after cancellation. */
export const createAnalysisExecutionEvidence = (operation, input, execution, confidence, options) => createEvidence(execution.subject === undefined
    ? undefined
    : (execution.subject ?? undefined), execution.provider, {
    operation,
    parameters: input,
    result: execution.result,
    rawResult: execution.rawResult,
    limitations: execution.limitations,
    ...(execution.analysisProfile === undefined
        ? {}
        : { analysisProfile: execution.analysisProfile }),
    ...(execution.relationshipCoverage === undefined
        ? {}
        : { relationshipCoverage: execution.relationshipCoverage }),
    locations: execution.locations,
    evidenceLinks: execution.sourceEvidence?.map(({ evidence_id }) => evidence_id) ?? [],
    confidence,
}, options);
