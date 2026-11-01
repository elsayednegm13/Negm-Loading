import { recordDerivedEvidence } from "../recordDerivedEvidence.js";
import { workflowUnknownInput } from "../../application/investigation/WorkflowUnknown.js";
import { uniqueSorted } from "../../domain/canonicalOrdering.js";
export const isIncomplete = (status) => status === "unknown" || status === "truncated";
export const comparisonClosure = (comparisons) => uniqueSorted(comparisons.flatMap((evidence) => [
    evidence.evidence_id,
    ...evidence.evidence_links,
]));
export const recordWorkflowEvidence = (...[session, evidence, unresolved, input]) => {
    if (!unresolved) {
        return recordDerivedEvidence(session, evidence, undefined);
    }
    const unknown = workflowUnknownInput(evidence.evidence_id, {
        question: input.question,
        severity: "high",
        domain: input.domain,
        required_authority: input.requiredAuthority,
        required_confidence: input.requiredConfidence,
        required_environment: null,
        recommended_probes: [...input.probes],
        relationships: [],
    });
    return unknown.ok
        ? recordDerivedEvidence(session, evidence, unknown.value)
        : unknown;
};
