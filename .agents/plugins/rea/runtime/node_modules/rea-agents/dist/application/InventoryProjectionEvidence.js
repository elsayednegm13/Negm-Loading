import { createEvidence, } from "../domain/evidence.js";
import { readApplicationInventoryProjection } from "../domain/mobileApplicationGraphProjection.js";
import { ok } from "../domain/result.js";
/** Resolve source inventory once, then wrap its family projection in Evidence. */
export const projectInventoryEvidence = (options) => {
    const source = readApplicationInventoryProjection(options.rawInput, options.operation);
    if (!source.ok)
        return source;
    const projected = options.project(source.value);
    if (!projected.ok)
        return projected;
    const result = projected.value;
    const first = source.value.evidence[0];
    return ok({
        evidence: createEvidence(first?.subject === null || first?.subject === undefined
            ? undefined
            : {
                path: first.subject.local_path,
                sha256: result.root_sha256,
                format: options.subjectFormat(first),
            }, options.provider, {
            predicateType: options.predicateType,
            operation: options.operation,
            parameters: { inventory_evidence_ids: [...result.source_evidence_ids] },
            result,
            rawResult: null,
            confidence: "inferred",
            authority: "analyst-inference",
            environment: null,
            limitations: result.limitations,
            evidenceLinks: result.source_evidence_ids,
        }),
        sources: source.value.evidence,
    });
};
