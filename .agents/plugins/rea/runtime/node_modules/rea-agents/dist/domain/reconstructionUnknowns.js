import { uniqueSorted } from "./canonicalOrdering.js";
import { compareUnicodeCodePoints, compositeKey, } from "./unicodeCodePointOrder.js";
/** Select the latest revision of each residual unknown. */
export const reconstructionUnknownHeads = (revisions) => {
    const heads = new Map();
    for (const item of revisions) {
        const current = heads.get(item.unknown_id);
        if (current === undefined || current.revision < item.revision)
            heads.set(item.unknown_id, item);
    }
    return heads;
};
/** Overall claims include every scoped dimension; individual claims keep their scope. */
export const reconstructionClaimUnknowns = (heads, comparisonId, sourceIds, dimensions) => {
    const appliesToClaim = (item) => {
        const scope = item.comparison_conclusion_scope;
        return (scope === undefined ||
            (scope.comparison_evidence_id === comparisonId &&
                (dimensions === undefined ||
                    dimensions.includes("overall") ||
                    scope.dimensions.some((dimension) => dimensions.includes(dimension)))));
    };
    const evidenceIds = new Set([comparisonId, ...sourceIds]);
    const relevantIds = new Set([...heads.values()]
        .filter((item) => item.status !== "resolved" &&
        appliesToClaim(item) &&
        [
            ...item.supporting_evidence_ids,
            ...item.contradicting_evidence_ids,
        ].some((id) => evidenceIds.has(id)))
        .map(({ unknown_id: id }) => id));
    const pending = [...relevantIds];
    while (pending.length > 0) {
        const currentId = pending.pop();
        if (currentId === undefined)
            continue;
        const current = heads.get(currentId);
        if (current === undefined)
            continue;
        for (const relationship of current.relationships) {
            if (relationship.type === "related-to")
                continue;
            const dependency = heads.get(relationship.unknown_id);
            if (dependency === undefined ||
                dependency.status === "resolved" ||
                relevantIds.has(dependency.unknown_id))
                continue;
            relevantIds.add(dependency.unknown_id);
            pending.push(dependency.unknown_id);
        }
    }
    return [...relevantIds]
        .flatMap((id) => {
        const unknown = heads.get(id);
        return unknown === undefined ? [] : [unknown];
    })
        .sort((left, right) => compareUnicodeCodePoints(left.unknown_id, right.unknown_id));
};
/** Aggregate deterministic probes for unresolved claims. */
export const reconstructionProbes = (results, heads) => {
    const output = new Map();
    for (const result of results.filter(({ status }) => status === "unknown")) {
        const unknowns = result.unknown_ids.flatMap((id) => {
            const item = heads.get(id);
            return item === undefined ? [] : [item];
        });
        const probes = unknowns.flatMap(({ recommended_probes: items }) => items);
        const candidates = probes.length > 0 ? probes : [defaultProbe(result.kind)];
        for (const probe of candidates) {
            const key = compositeKey([probe.operation, probe.rationale]);
            const current = output.get(key) ?? {
                ...probe,
                claim_ids: [],
                unknown_ids: [],
            };
            current.claim_ids = uniqueSorted([...current.claim_ids, result.claim_id]);
            current.unknown_ids = uniqueSorted([
                ...current.unknown_ids,
                ...result.unknown_ids,
            ]);
            output.set(key, current);
        }
    }
    const sorted = [...output.values()].sort((left, right) => compareUnicodeCodePoints(compositeKey([left.operation, left.rationale]), compositeKey([right.operation, right.rationale])));
    return sorted;
};
const defaultProbe = (kind) => kind === "behavioral"
    ? {
        operation: "capture_process_scenario",
        rationale: "Repeat both scenarios under one controlled environment.",
    }
    : kind === "structural-function"
        ? {
            operation: "analyze_function",
            rationale: "Capture complete function dossiers under equal limits.",
        }
        : {
            operation: "inspect_artifact",
            rationale: "Capture complete artifact inventories under equal limits.",
        };
