import { requireAnalysisViewRetention, summarizeRetainedAnalysis, } from "../application/analysisView/AnalysisViewService.js";
import { ok } from "../domain/result.js";
/**
 * Summary delivery for the named operations: refuse it before analysis when
 * this server retains no Evidence, then return the retained summary view.
 */
export const retainedSummaryDelivery = (operations, options) => {
    const retention = {
        recordEvidence: options.recordEvidence,
        evidenceById: options.evidenceById,
    };
    const selected = (operation, parameters) => operations.has(operation) && parameters.detail === "summary";
    return {
        preflight: (operation, parameters) => selected(operation, parameters)
            ? requireAnalysisViewRetention(operation, retention)
            : ok(null),
        projectEvidence: (operation, parameters, evidence) => selected(operation, parameters)
            ? summarizeRetainedAnalysis(evidence, retention)
            : ok(evidence),
    };
};
/** Delivery detail selects a response shape; it never reaches tools or Evidence identity. */
export const withoutDeliveryDetail = (operations) => (operation, parameters) => {
    if (!operations.has(operation))
        return parameters;
    const { detail: _detail, ...selected } = parameters;
    return selected;
};
