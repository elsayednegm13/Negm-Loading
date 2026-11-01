import { managedTableRowCounts, } from "./ManagedMetadataInventory.js";
/** Shared artifact and token identity facts for successful managed PE projections. */
export const managedPeInspectionEnvelope = (target, byteLength, layout, module, issues) => ({
    artifact: {
        path: target.path,
        sha256: target.sha256,
        byte_length: byteLength,
        format: "pe",
    },
    module,
    metadata: {
        status: issues.length === 0 ? "complete" : "partial",
        version: layout.version,
        table_row_counts: managedTableRowCounts(layout),
    },
    identity_scope: {
        token_identity: "build-local",
        requires_artifact_sha256: target.sha256,
        requires_mvid: module?.mvid ?? null,
    },
});
