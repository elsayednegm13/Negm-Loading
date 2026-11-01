import { resolveEvidenceInput } from "../EvidenceInputResolver.js";
import { uniqueSorted } from "../../domain/canonicalOrdering.js";
import { ok } from "../../domain/result.js";
/** Follow exact session references without exporting unrelated records or Unknowns. */
export const resolveInvestigationEvidenceClosure = (reader, seedIds) => {
    const lookup = reader.evidenceForAnalysis.bind(reader);
    const visited = new Set();
    const pending = [...seedIds];
    while (pending.length > 0) {
        const evidenceId = pending.pop();
        if (evidenceId === undefined || visited.has(evidenceId))
            continue;
        const evidence = resolveEvidenceInput({ kind: "retained-evidence", evidence_id: evidenceId }, lookup);
        if (!evidence.ok)
            return evidence;
        visited.add(evidenceId);
        pending.push(...evidence.value.evidence_links);
    }
    return ok(uniqueSorted([...visited]));
};
