import { evidenceSchema } from "../domain/evidence.js";
/** The Evidence identifier of a complete Evidence record, or undefined. */
const evidenceRecordId = (value) => typeof value.evidence_id === "string" &&
    Object.hasOwn(value, "normalized_result") &&
    evidenceSchema.safeParse(value).success
    ? value.evidence_id
    : undefined;
/** Replace each embedded complete Evidence record with its exact retained reference. */
const referenceEmbeddedEvidence = (value) => {
    if (Array.isArray(value)) {
        const items = value.map(referenceEmbeddedEvidence);
        return {
            value: items.map((item) => item.value),
            embedsEvidence: items.some((item) => item.embedsEvidence),
        };
    }
    if (value === null || typeof value !== "object")
        return { value, embedsEvidence: false };
    const evidenceId = evidenceRecordId(value);
    if (evidenceId !== undefined)
        return {
            value: { kind: "retained-evidence", evidence_id: evidenceId },
            embedsEvidence: true,
        };
    const entries = Object.entries(value).map(([key, child]) => [key, referenceEmbeddedEvidence(child)]);
    return {
        value: Object.fromEntries(entries.map(([key, child]) => [key, child.value])),
        embedsEvidence: entries.some(([, child]) => child.embedsEvidence),
    };
};
/**
 * Examples advertised in a tool's input schema. Embedded complete Evidence is
 * shown as its exact same-session retained reference when the canonical input
 * schema accepts that form; an example that can only carry inline Evidence
 * stays in the canonical contract and its executable tests but leaves the
 * advertisement. Every advertised example is a distinct valid canonical input.
 */
export const advertisedInputExamples = (contract) => {
    const advertised = new Map();
    for (const { input } of contract.examples) {
        const projection = referenceEmbeddedEvidence(input);
        if (projection.embedsEvidence &&
            !contract.inputSchema.safeParse(projection.value).success)
            continue;
        advertised.set(JSON.stringify(projection.value), projection.value);
    }
    return [...advertised.values()];
};
