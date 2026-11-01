import { artifactComparisonResultSchema, } from "./artifactComparison.js";
import { EvidenceIntegrityError } from "./evidenceErrors.js";
import { readEvidencePayload } from "./evidenceValidation.js";
import { functionComparisonResultSchema, } from "./functionComparisonSchemas.js";
import { processCaptureComparisonSchema, } from "./process/processComparison.js";
import { err, ok } from "./result.js";
export function readComparisonResult(evidence, operation) {
    if (operation === "compare_process_captures") {
        const parsed = readEvidencePayload(processCaptureComparisonSchema, evidence.normalized_result);
        if (!parsed.ok)
            return parsed;
        return ok({ operation, evidence, result: parsed.value });
    }
    if (operation === "compare_functions") {
        const parsed = readEvidencePayload(functionComparisonResultSchema, evidence.normalized_result);
        if (!parsed.ok)
            return parsed;
        const links = validateFindingLinks(evidence, parsed.value.dimensions.flatMap(({ evidence_links }) => evidence_links));
        if (!links.ok)
            return links;
        return ok({ operation, evidence, result: parsed.value });
    }
    const parsed = readEvidencePayload(artifactComparisonResultSchema, evidence.normalized_result);
    if (!parsed.ok)
        return parsed;
    const links = validateFindingLinks(evidence, parsed.value.changes.flatMap(({ evidence_links }) => evidence_links));
    if (!links.ok)
        return links;
    return ok({ operation, evidence, result: parsed.value });
}
const validateFindingLinks = (evidence, nestedLinks) => {
    const closure = new Set(evidence.evidence_links);
    return nestedLinks.some((id) => !closure.has(id))
        ? err(new EvidenceIntegrityError("Comparison finding cites Evidence outside its top-level closure"))
        : ok(undefined);
};
