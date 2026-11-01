import { z } from "zod";
import { uniqueSorted } from "../domain/canonicalOrdering.js";
import { parseProcessCaptureEvidence } from "../application/process/ProcessEvidence.js";
import { addressedValueSchema } from "../domain/native/nativeInventory.js";
import { currentMcpRequestSignal } from "./EvidenceMcpServerCore.js";
import { parseArtifactInventoryEvidence } from "../domain/artifactInventoryEvidence.js";
import { EvidenceIntegrityError } from "../domain/evidenceErrors.js";
const documentListSchema = z.array(z.string().min(1));
const procedureInventorySchema = z.array(addressedValueSchema.pick({ address: true, value: true }));
const providerStatusSchema = z.object({
    analysis_provider_candidates: z.array(z.object({ provider: z.object({ id: z.string().min(1) }) })),
});
/** Build live completion over the active provider and session ledger. */
export const createPromptCompletionSource = (analysis, session) => ({
    async complete(kind, value, context) {
        const candidates = await completionCandidates(kind, analysis, session, context);
        const prefix = normalize(value);
        const nonEmpty = candidates.filter((candidate) => candidate.length > 0);
        return uniqueSorted(nonEmpty).filter((candidate) => normalize(candidate).startsWith(prefix));
    },
});
const completionCandidates = async (kind, analysis, session, context) => {
    switch (kind) {
        case "document":
            return documentCandidates(analysis, session);
        case "procedure":
            return procedureCandidates(analysis, session, context?.arguments?.document);
        case "provider":
            return providerCandidates(session);
        case "evidence":
        case "capture":
        case "manifest":
        case "occurrence":
            return evidenceCandidates(kind, session);
        case "unknown":
            return unknownCandidates(session);
    }
};
const documentCandidates = async (analysis, session) => {
    const result = await completionInventoryLookup(analysis, session, "list_documents", {});
    if (result === undefined)
        return [];
    if (!result.ok)
        return [];
    const parsed = documentListSchema.safeParse(result.value.result);
    return parsed.success ? parsed.data : [];
};
const procedureCandidates = async (analysis, session, document) => {
    const addresses = new Set();
    // null records proven ambiguity; later rows cannot restore uniqueness.
    const addressByName = new Map();
    const input = document === undefined || document.length === 0 ? {} : { document };
    const result = await completionInventoryLookup(analysis, session, "list_procedures", input);
    if (result === undefined)
        return [];
    if (result.ok) {
        const parsed = procedureInventorySchema.safeParse(result.value.result);
        if (parsed.success)
            for (const { address, value: name } of parsed.data) {
                addresses.add(address);
                if (name.length === 0)
                    continue;
                const previous = addressByName.get(name);
                addressByName.set(name, previous === undefined || previous === address ? address : null);
            }
    }
    const candidates = [...addresses];
    for (const [name, address] of addressByName)
        if (address !== null)
            candidates.push(name);
    return candidates;
};
const completionInventoryLookup = async (analysis, session, operation, parameters) => {
    const signal = currentMcpRequestSignal();
    const options = signal === undefined ? {} : { signal };
    const result = session === undefined
        ? await analysis.execute(operation, parameters, options)
        : await session.executeIfProviderReady(operation, parameters, options);
    return signal?.aborted === true ? undefined : result;
};
const providerCandidates = async (session) => {
    if (session === undefined)
        return [];
    const signal = currentMcpRequestSignal();
    const parsed = providerStatusSchema.safeParse(await session.status(signal === undefined ? {} : { signal }));
    if (!parsed.success)
        return [];
    const candidates = parsed.data.analysis_provider_candidates.map(({ provider }) => provider.id);
    return ["auto", ...candidates];
};
const evidenceCandidates = (kind, session) => {
    if (session === undefined)
        return [];
    const candidates = [];
    for (const evidence of session.immutableEvidenceBundle().records)
        candidates.push(...evidenceValues(kind, evidence));
    return candidates;
};
const evidenceValues = (kind, evidence) => {
    if (kind === "evidence")
        return [evidence.evidence_id];
    if (kind === "capture")
        return isProcessCaptureEvidence(evidence) ? [evidence.evidence_id] : [];
    if (evidence.operation === "inventory_artifact" ||
        evidence.operation === "inspect_artifact")
        return artifactInventoryValues(kind, evidence);
    return [];
};
const artifactInventoryValues = (kind, evidence) => {
    try {
        const { inventory } = parseArtifactInventoryEvidence(evidence);
        return kind === "manifest"
            ? [inventory.manifest.manifest_id]
            : inventory.occurrences.map(({ occurrence_id: id }) => id);
    }
    catch (cause) {
        if (cause instanceof EvidenceIntegrityError)
            return [];
        throw cause;
    }
};
const isProcessCaptureEvidence = (evidence) => {
    const parsed = parseProcessCaptureEvidence(evidence);
    if (parsed.ok)
        return true;
    switch (parsed.error.kind) {
        case "wrong-workflow":
        case "unsupported-provider":
            return false;
        case "invalid-evidence":
        case "invalid-capture":
            return false;
    }
};
const unknownCandidates = (session) => session === undefined
    ? []
    : session
        .listUnknowns()
        .filter(({ status }) => status !== "resolved")
        .map(({ unknown_id: id }) => id);
const normalize = (value) => value.normalize("NFKC").toLowerCase();
