import { z } from "zod";
import { compareUnicodeCodePoints } from "./unicodeCodePointOrder.js";
/** Stable browser sections used by coverage and omission accounting. */
const browserSectionSchema = z.enum([
    "frames",
    "dom",
    "accessibility",
    "scripts",
    "script_sources",
    "resources",
    "network_requests",
    "network_initiators",
    "console_events",
    "console_text",
    "websocket_connections",
    "websocket_frames",
    "websocket_shapes",
    "json_body_shapes",
    "workers",
    "storage",
    "storage_keys",
    "metadata",
    "webmcp_tools",
    "screenshot",
    "source_maps",
    "timeline",
]);
/** Why an eligible browser observation was not retained. */
const browserExclusionReasonSchema = z.enum([
    "disallowed_origin",
    "unsupported_url",
    "unattributed_origin",
    "not_approved",
    "out_of_target_scope",
    "unattributed_target",
    // Accepted for previously retained captures; new producers use unattributed_target.
    "unknown_target_relationship",
    "provider_unavailable",
    "invalid_protocol_value",
    "resource_budget_exhausted",
]);
export const browserExclusionSchema = z.object({
    section: browserSectionSchema,
    reason: browserExclusionReasonSchema,
    count: z.int().min(0).nullable(),
});
const browserDroppedEventsSchema = z.object({
    scripts: z.int().min(0),
    network_requests: z.int().min(0),
    console_events: z.int().min(0),
    websocket_connections: z.int().min(0),
    websocket_frames: z.int().min(0),
    webmcp_tools: z.int().min(0),
    timeline_events: z.int().min(0),
    total: z.int().min(0),
});
const browserCompletenessConditionSchema = z.enum([
    "complete_within_window",
    "policy_filtered",
    "attach_limited",
    "truncated",
]);
/** Explicit, non-lossy coverage semantics for a bounded browser observation. */
export const browserCompletenessSchema = z.object({
    status: browserCompletenessConditionSchema,
    conditions: z.array(browserCompletenessConditionSchema).min(1).max(3),
    policy_filtered_sections: z.array(browserSectionSchema),
    attach_limited_sections: z.array(browserSectionSchema),
    truncated_sections: z.array(browserSectionSchema),
    unavailable_sections: z.array(browserSectionSchema),
    excluded: z.array(browserExclusionSchema),
    dropped_events: browserDroppedEventsSchema,
});
/** Build canonical completeness output from one adapter-owned capture ledger. */
export const classifyBrowserCompleteness = (input) => {
    const policyFiltered = input.policyFilteredSections.size > 0;
    const truncated = input.truncatedSections.size > 0 ||
        Object.values(input.droppedEvents).some((count) => count > 0);
    const attachLimited = input.attachLimitedSections.size > 0 || input.unavailableSections.size > 0;
    const status = truncated
        ? "truncated"
        : policyFiltered
            ? "policy_filtered"
            : attachLimited
                ? "attach_limited"
                : "complete_within_window";
    const conditions = [
        ...(attachLimited ? ["attach_limited"] : []),
        ...(policyFiltered ? ["policy_filtered"] : []),
        ...(truncated ? ["truncated"] : []),
    ];
    const droppedTotal = Object.values(input.droppedEvents).reduce((sum, count) => sum + count, 0);
    return browserCompletenessSchema.parse({
        status,
        conditions: conditions.length === 0 ? ["complete_within_window"] : conditions,
        policy_filtered_sections: sortedSections(input.policyFilteredSections),
        attach_limited_sections: sortedSections(input.attachLimitedSections),
        truncated_sections: sortedSections(input.truncatedSections),
        unavailable_sections: sortedSections(input.unavailableSections),
        excluded: canonicalExclusions(input.excluded),
        dropped_events: { ...input.droppedEvents, total: droppedTotal },
    });
};
const sortedSections = (sections) => [...sections].sort();
const canonicalExclusions = (exclusions) => [...exclusions].sort((left, right) => compareUnicodeCodePoints(left.section, right.section) ||
    compareUnicodeCodePoints(left.reason, right.reason));
