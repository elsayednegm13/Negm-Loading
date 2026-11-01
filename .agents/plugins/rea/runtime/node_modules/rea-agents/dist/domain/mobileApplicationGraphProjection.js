import { z } from "zod";
import { hasCompleteInventoryCoverage, parseArtifactInventoryEvidence, ArtifactInventoryCarrierError, } from "./artifactInventoryEvidence.js";
import { evidenceSchema } from "./evidence.js";
import { AnalysisInputError } from "./analysisErrorCore.js";
import { EvidenceIntegrityError } from "./evidenceErrors.js";
import { analysisInputErrorFromIssues } from "./inputIssueProjection.js";
import { err, ok } from "./result.js";
import { digestSchema, prefixedDigestSchema } from "./digests.js";
/** Evidence-scoped identifier schemas shared by application graph projections. */
export const projectionEvidenceIdSchema = prefixedDigestSchema("ev");
export const projectionPathSchema = z.string().min(1);
/** Inventory pages accepted by every application graph projection. */
export const applicationInventoryProjectionInputSchema = z.strictObject({
    inventory_evidence: z.array(evidenceSchema).min(1),
});
const applicationInventoryRequestSchema = applicationInventoryProjectionInputSchema.extend({
    inventory_evidence: z.array(z.unknown()).min(1),
});
/** Resolve the request and authenticate inventory pages once for all projections. */
export const readApplicationInventoryProjection = (input, operation) => {
    const frame = applicationInventoryRequestSchema.safeParse(input);
    if (!frame.success)
        return err(analysisInputErrorFromIssues(operation, frame.error.issues, input, {
            cause: frame.error,
        }));
    try {
        return ok(parseArtifactInventoryEvidence(frame.data.inventory_evidence));
    }
    catch (cause) {
        if (cause instanceof EvidenceIntegrityError)
            return err(cause);
        if (!(cause instanceof ArtifactInventoryCarrierError))
            throw cause;
        return err(new AnalysisInputError(operation, { cause, userMessage: cause.message }, [
            {
                path: [
                    "inventory_evidence",
                    ...(cause.index === undefined ? [] : [cause.index, "operation"]),
                ],
                reason: "invalid_value",
                message: cause.message,
            },
        ]));
    }
};
/** One authenticated inventory entry retained by application graph projections. */
export const projectedComponentSchema = z.strictObject({
    path: projectionPathSchema,
    artifact_id: prefixedDigestSchema("art"),
    sha256: digestSchema,
    format: z.string().min(1),
});
/** Inventoried paths whose content identity is unavailable, retained as unknown. */
export const unavailableComponentSchema = z.strictObject({
    path: projectionPathSchema,
    artifact_id: z.null(),
    sha256: z.null(),
    format: z.string().min(1),
    encrypted: z.boolean(),
    limitations: z.array(z.string()),
});
/** Path-pair hypotheses connecting managed content to a native library. */
export const projectedBridgeCandidateSchema = (basis) => z.strictObject({
    managed_path: projectionPathSchema,
    native_path: projectionPathSchema,
    basis: z.enum(basis),
});
/** Coverage status combining inventory completeness with a projection budget. */
export const projectionCoverage = (inventory, budgetComplete) => ({
    status: hasCompleteInventoryCoverage(inventory, "container-entries") &&
        budgetComplete
        ? "complete-within-inventory"
        : "partial",
    inventory_complete: inventory.complete,
});
/** Resolve available identities and report references outside the supplied pages. */
export const projectedInventoryEntries = (inventory) => {
    const nodes = new Map(inventory.nodes.map((node) => [node.artifact_id, node]));
    const limitations = [];
    const entries = inventory.occurrences
        .filter(({ logical_path }) => logical_path !== ".")
        .map((occurrence) => {
        const path = occurrence.logical_path;
        const kind = occurrence.entry_kind;
        if (occurrence.artifact_id === null)
            return {
                path,
                kind,
                component: undefined,
                unavailable: {
                    path,
                    artifact_id: null,
                    sha256: null,
                    format: occurrence.artifact_format,
                    encrypted: occurrence.encrypted,
                    limitations: occurrence.limitations,
                },
            };
        const node = nodes.get(occurrence.artifact_id);
        if (node === undefined) {
            limitations.push(`Inventory occurrence ${JSON.stringify(path)} references ${occurrence.artifact_id} (${occurrence.artifact_format}), whose node is outside the supplied pages. Its content SHA-256 and component classification remain unknown; the source Evidence retains the occurrence.`);
            return { path, kind, component: undefined, unavailable: undefined };
        }
        return {
            path,
            kind,
            component: {
                path,
                artifact_id: node.artifact_id,
                sha256: node.sha256,
                format: occurrence.artifact_format,
            },
            unavailable: undefined,
        };
    });
    return { entries, limitations };
};
/** Directory trees and links retain inventory identity but are not file components. */
export const projectedFileComponents = (entries) => entries.flatMap(({ kind, component }) => (kind === "file" || kind === "slice") && component !== undefined
    ? [component]
    : []);
