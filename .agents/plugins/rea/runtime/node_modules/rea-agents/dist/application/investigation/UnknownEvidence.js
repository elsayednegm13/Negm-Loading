import { createEvidence } from "../../domain/evidence.js";
/** Provider identity for analyst-authored residual-unknown mutations. */
const UNKNOWN_REGISTRY_PROVIDER = {
    id: "rea-unknown-registry",
    name: "REA residual unknown registry",
    version: "1",
};
/** Create immutable evidence for one approved residual-unknown mutation. */
export const unknownMutationEvidence = (target, mutation) => createEvidence(target, UNKNOWN_REGISTRY_PROVIDER, {
    predicateType: "rea.residual-unknown-mutation",
    operation: mutation.operation,
    parameters: { ...mutation.input },
    result: mutation.operation === "record_unknown"
        ? {
            action: "record",
            question: mutation.input.question,
            required_authority: mutation.input.required_authority,
            required_confidence: mutation.input.required_confidence,
        }
        : { action: "update", status: mutation.input.status },
    confidence: "derived",
    authority: "analyst-inference",
    evidenceLinks: unknownEvidenceLinks(mutation.input),
    limitations: [
        "Registry mutation evidence records analyst intent, not proof of the answer.",
    ],
});
/** Deduplicate evidence links carried by an unknown mutation. */
const unknownEvidenceLinks = (input) => [
    ...new Set([
        ...input.supporting_evidence_ids,
        ...input.contradicting_evidence_ids,
        ...("resolution" in input && input.resolution !== null
            ? input.resolution.evidence_ids
            : []),
    ]),
];
