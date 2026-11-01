import { z } from "zod";
import { AnalysisInputError } from "../analysisErrorCore.js";
import { EvidenceIntegrityError } from "../evidenceErrors.js";
import { analysisInputErrorFromIssues } from "../inputIssueProjection.js";
import { readEvidence, readEvidencePayload } from "../evidenceValidation.js";
import { err, ok } from "../result.js";
import { functionDossierSchema } from "../hopperValues.js";
import { inspectMachoSchema } from "../native/nativeInspection.js";
import { managedNativeBoundaryInspectionSchema, } from "./managedArtifact.js";
import { readManagedInspectionEvidence } from "./managedInspectionEvidence.js";
const OPERATION = "verify_managed_native_boundaries";
const MANAGED_OPERATION = "inspect_managed_native_boundaries";
const requestFrameSchema = z.strictObject({
    managed_boundaries: z.unknown(),
    native_observations: z.array(z.unknown()).min(1),
});
const inputFailure = (path, message) => new AnalysisInputError(OPERATION, { userMessage: message }, [
    { path, reason: "invalid_value", message },
]);
const readNativeObservation = (raw) => {
    const read = readEvidence(raw);
    if (!read.ok)
        return read;
    const evidence = read.value;
    if (evidence.operation === "inspect_macho") {
        const payload = readEvidencePayload(inspectMachoSchema, evidence.normalized_result);
        if (!payload.ok)
            return payload;
        return ok({
            evidence,
            supported: true,
            symbols: payload.value.exports.items.map((symbol) => ({
                evidence_id: evidence.evidence_id,
                operation: evidence.operation,
                name: symbol.name,
                address: symbol.address,
                module_name: evidence.subject?.name ?? null,
                module_path: evidence.subject?.local_path ?? null,
                source: "macho-export",
            })),
        });
    }
    if (evidence.operation === "analyze_function") {
        const payload = readEvidencePayload(functionDossierSchema, evidence.normalized_result);
        if (!payload.ok)
            return payload;
        return ok({
            evidence,
            supported: true,
            symbols: [
                {
                    evidence_id: evidence.evidence_id,
                    operation: evidence.operation,
                    name: payload.value.procedure.name,
                    address: payload.value.procedure.address,
                    module_name: evidence.subject?.name ?? null,
                    module_path: evidence.subject?.local_path ?? null,
                    source: "function-dossier",
                },
            ],
        });
    }
    return ok({ evidence, supported: false, symbols: [] });
};
/** Authenticate and parse source Evidence once, retaining it for session recording. */
export const readManagedNativeVerificationSource = (rawInput) => {
    const frame = requestFrameSchema.safeParse(rawInput);
    if (!frame.success)
        return err(analysisInputErrorFromIssues(OPERATION, frame.error.issues, rawInput, {
            cause: frame.error,
        }));
    const managed = readManagedInspectionEvidence(frame.data.managed_boundaries, MANAGED_OPERATION, managedNativeBoundaryInspectionSchema, { operation: OPERATION, path: ["managed_boundaries"] });
    if (!managed.ok)
        return managed;
    const nativeObservations = [];
    const ids = new Set([managed.value.evidence.evidence_id]);
    for (const [index, raw] of frame.data.native_observations.entries()) {
        const native = readNativeObservation(raw);
        if (!native.ok)
            return native;
        const id = native.value.evidence.evidence_id;
        if (ids.has(id))
            return err(inputFailure(["native_observations", index], id === managed.value.evidence.evidence_id
                ? "Native observation Evidence must be distinct from managed boundary Evidence"
                : "Native observation Evidence IDs must be unique"));
        ids.add(id);
        nativeObservations.push(native.value);
    }
    return ok({
        managedEvidence: managed.value.evidence,
        managed: managed.value.result,
        nativeObservations,
    });
};
