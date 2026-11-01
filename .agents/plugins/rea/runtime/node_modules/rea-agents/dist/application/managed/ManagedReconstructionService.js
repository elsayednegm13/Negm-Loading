import { createEvidence } from "../../domain/evidence.js";
import { executeManagedReconstructionImport, managedReconstructionImportRequestSchema, resolveManagedReconstructionImport, } from "../../domain/managed/managedReconstruction.js";
import { err, ok } from "../../domain/result.js";
import { MANAGED_WORKFLOW_PROVIDER } from "../../domain/investigationProviders.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
const OPERATION = "import_managed_reconstruction";
/** Validate the request envelope and authenticate its managed Evidence source once. */
export const resolveManagedReconstructionEvidenceInput = (rawInput) => {
    const parsed = managedReconstructionImportRequestSchema.safeParse(rawInput);
    if (!parsed.success)
        return err(analysisInputErrorFromIssues(OPERATION, parsed.error.issues, rawInput, {
            cause: parsed.error,
        }));
    return resolveManagedReconstructionImport(parsed.data);
};
/** Execute from the source facts returned by the resolver. */
export const importManagedReconstructionEvidenceResolved = (resolved) => {
    const result = executeManagedReconstructionImport(resolved);
    return ok(createManagedReconstructionEvidence(resolved.request, result));
};
/** Validate the raw request envelope, then authenticate and import its source. */
export const importManagedReconstructionEvidence = (rawInput) => {
    const resolved = resolveManagedReconstructionEvidenceInput(rawInput);
    if (!resolved.ok)
        return resolved;
    return importManagedReconstructionEvidenceResolved(resolved.value);
};
const createManagedReconstructionEvidence = (input, result) => createEvidence({
    path: result.static_observation.artifact_path,
    sha256: result.static_observation.artifact_sha256,
    format: "pe",
}, MANAGED_WORKFLOW_PROVIDER, {
    predicateType: "rea.managed-reconstruction-import",
    operation: OPERATION,
    parameters: {
        static_members_evidence_id: result.static_observation.evidence_id,
        decompiler: result.decompiler,
        method_locks: input.methods.map(({ token, signature_sha256, normalized_il_sha256 }) => ({
            token,
            signature_sha256,
            normalized_il_sha256,
        })),
        notes: input.notes,
    },
    result,
    rawResult: null,
    confidence: "inferred",
    authority: "analyst-inference",
    environment: null,
    limitations: result.limitations,
    locations: [
        {
            kind: "artifact-path",
            path: result.static_observation.artifact_path,
        },
    ],
    evidenceLinks: result.evidence_links,
});
