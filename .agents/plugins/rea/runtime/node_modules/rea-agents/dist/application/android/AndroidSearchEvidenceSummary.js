import { createEvidence } from "../../domain/evidence.js";
import { ok } from "../../domain/result.js";
/**
 * Retain the complete search Evidence — full raw provider calls included —
 * in the session record, then deliver a bounded summary Evidence inline.
 * Callers without a retaining session receive complete source Evidence inline.
 * Both copies preserve examined inventory ranges separately from matching rows.
 */
export const summarizeRetainedAndroidSearch = (evidence, summary, recordEvidence) => {
    if (recordEvidence === undefined)
        return ok(evidence);
    const recorded = recordEvidence(evidence);
    if (!recorded.ok)
        return recorded;
    const subject = evidence.subject;
    return ok(createEvidence(subject === null
        ? undefined
        : {
            path: subject.local_path,
            sha256: subject.digest.sha256,
            format: subject.format,
            ...(subject.architecture === null
                ? {}
                : { architecture: subject.architecture }),
        }, evidence.provider, {
        operation: evidence.operation,
        parameters: evidence.parameters,
        result: evidence.normalized_result,
        rawResult: { ...summary, complete_evidence_id: evidence.evidence_id },
        confidence: evidence.confidence,
        limitations: evidence.limitations,
        locations: evidence.locations,
        evidenceLinks: [evidence.evidence_id],
    }));
};
