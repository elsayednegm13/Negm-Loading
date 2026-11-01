import { z } from "zod";
import { webRuntimeCommandTimeoutSchema } from "../browserDeadline.js";
import { browserCompletenessSchema } from "../browserCompleteness.js";
import { browserEndpointSchema } from "../browserObservation.js";
import { browserVersionSchema } from "../browserObservationSchemas.js";
import { cdpDomNodeSchema, cdpScriptSourceSchema, cdpScriptMetadataSchema, } from "../cdpObservationSchemas.js";
import { prefixedDigestSchema } from "../digests.js";
const approvedElectronInput = {
    cdp_endpoint: browserEndpointSchema,
};
/** Input for listing local file:// page targets from an explicit Electron CDP endpoint. */
export const listElectronTargetsInputSchema = z.strictObject({
    ...approvedElectronInput,
});
/** Input for passive structural inspection of one Electron file page. */
const inspectElectronPageFacts = {
    ...approvedElectronInput,
    target_id: z.string().trim().min(1),
    observation_ms: z.int().min(0).default(100),
    command_timeout_ms: webRuntimeCommandTimeoutSchema,
};
export const inspectElectronPageInputSchema = z.union([
    z.strictObject({
        ...inspectElectronPageFacts,
        include_script_sources: z.literal(false).default(false),
    }),
    z.strictObject({
        ...inspectElectronPageFacts,
        include_script_sources: z.literal(true),
    }),
]);
const electronTargetSchema = z.object({
    target_id: z.string(),
    type: z.string(),
    title: z.string(),
    file_path: z.string(),
    attached: z
        .boolean()
        .nullable()
        .describe("Discovery-reported debugger attachment state; null means unknown"),
});
/** Complete local file target inventory from one Electron CDP endpoint. */
export const electronTargetListSchema = z.object({
    browser: browserVersionSchema,
    targets: z.array(electronTargetSchema),
    excluded: z.object({
        unsupported_url: z.int().min(0),
        non_page: z.int().min(0),
    }),
    limitations: z.array(z.string()),
});
const electronScriptFrameClaimsSchema = z.object({
    script_event_frame_id: z.string().exactOptional(),
    execution_context_frame_id: z.string().exactOptional(),
});
/** Provider-neutral passive Electron file-page structure and script inventory. */
export const electronPageInspectionSchema = z.object({
    browser: browserVersionSchema,
    target: electronTargetSchema,
    capture_window: z.object({
        started_at: z.iso.datetime(),
        ended_at: z.iso.datetime(),
        observation_ms: z.int().min(0),
    }),
    completeness: browserCompletenessSchema,
    frames: z.array(z.object({
        frame_id: z.string(),
        parent_frame_id: z.string().nullable(),
        file_path: z.string(),
    })),
    dom: z.object({
        total_nodes: z.int().min(0),
        nodes: z.array(cdpDomNodeSchema),
    }),
    scripts: z.object({
        total: z.int().min(0),
        items: z.array(z.object({
            script_key: prefixedDigestSchema("electron_script"),
            frame_id: z.string().nullable().default(null),
            frame_scope: z.enum(["authorized", "unknown"]).exactOptional(),
            frame_claims: electronScriptFrameClaimsSchema.exactOptional(),
            file_path: z.string(),
            has_source_url: z.boolean().nullable().exactOptional(),
            reported_url: z.string().exactOptional(),
            ...cdpScriptMetadataSchema.shape,
            source: cdpScriptSourceSchema,
        })),
    }),
    resources: z.array(z.object({
        resource_key: prefixedDigestSchema("electron_resource"),
        file_path: z.string(),
        type: z.string(),
        mime_type: z.string(),
        content_size: z.number().min(0).nullable(),
    })),
    workers: z
        .array(z.object({
        target_id: z.string().min(1),
        type: z.string().min(1),
        file_path: z.string(),
        attached: z.boolean(),
        opener_target_id: z.string().min(1).nullable(),
        parent_frame_id: z.string().min(1).nullable(),
    }))
        .default([]),
    limitations: z.array(z.string()),
});
