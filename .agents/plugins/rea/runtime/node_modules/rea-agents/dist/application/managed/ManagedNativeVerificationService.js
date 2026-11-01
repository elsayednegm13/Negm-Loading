import { createEvidence } from "../../domain/evidence.js";
import { ok } from "../../domain/result.js";
import { managedNativeVerificationHasUnknowns, verifyManagedNativeVerificationSource, } from "../../domain/managed/managedNativeVerification.js";
import { readManagedNativeVerificationSource, } from "../../domain/managed/managedNativeVerificationSource.js";
import { MANAGED_WORKFLOW_PROVIDER } from "../../domain/investigationProviders.js";
const OPERATION = "verify_managed_native_boundaries";
/** Resolve untrusted source Evidence, then execute over the trusted parsed source. */
export const executeManagedNativeBoundaries = (rawInput) => {
    const source = readManagedNativeVerificationSource(rawInput);
    if (!source.ok)
        return source;
    const result = verifyManagedNativeVerificationSource(source.value);
    const evidence = createManagedNativeVerificationEvidence(source.value, result);
    return ok({
        evidence,
        summary: result.summary,
        hasUnknowns: managedNativeVerificationHasUnknowns(result),
        sourceEvidence: [
            source.value.managedEvidence,
            ...source.value.nativeObservations.map(({ evidence: observation }) => observation),
        ],
    });
};
/** Return only derived Evidence for callers that do not need source observations. */
export const verifyManagedNativeBoundariesEvidence = (rawInput) => {
    const execution = executeManagedNativeBoundaries(rawInput);
    return execution.ok ? ok(execution.value.evidence) : execution;
};
const createManagedNativeVerificationEvidence = (source, result) => createEvidence(undefined, MANAGED_WORKFLOW_PROVIDER, {
    predicateType: "rea.managed-native-verification",
    operation: OPERATION,
    parameters: {
        managed_boundaries_evidence_id: source.managedEvidence.evidence_id,
        native_evidence_ids: source.nativeObservations.map(({ evidence }) => evidence.evidence_id),
    },
    result,
    rawResult: null,
    confidence: "inferred",
    authority: "analyst-inference",
    environment: null,
    limitations: result.limitations,
    evidenceLinks: result.evidence_links,
});
