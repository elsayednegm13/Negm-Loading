import { getHeapStatistics } from "node:v8";
import { MAX_JSON_DEPTH } from "../domain/jsonValue.js";
/** Transport and host facts stay distinct from the agent-editable policy registry. */
export const analysisSettingsConstraints = (delivery) => [
    {
        control: "REA_MCP_MAX_RESPONSE_BYTES",
        authority: "operator",
        value: delivery.maximumResponseBytes,
        unit: "bytes",
        observation: "known",
        recovery: "Change the launch environment and restart REA with a matching client receive buffer. Prefer retained Evidence, paging or export for completed results.",
    },
    {
        control: "mcp.client_deadline",
        authority: "external",
        value: null,
        unit: "ms",
        observation: "unknown",
        recovery: "The MCP host owns its tool-call deadline. REA cannot observe or raise it. Allow execution, cleanup and delivery headroom.",
    },
    {
        control: "mcp.client_receive_buffer",
        authority: "external",
        value: null,
        unit: "bytes",
        observation: "unknown",
        recovery: "The MCP host owns its receive buffer; raising a REA output budget alone does not raise it.",
    },
    {
        control: "node.parent_heap",
        authority: "operator",
        value: getHeapStatistics().heap_size_limit,
        unit: "bytes",
        observation: "known",
        recovery: "This is the current process heap ceiling, not available memory. On Node, change --max-old-space-size at launch and restart REA. Worker heap settings do not raise it.",
    },
    {
        control: "json.maximum_depth",
        authority: "fixed",
        value: MAX_JSON_DEPTH,
        unit: "levels",
        observation: "known",
        recovery: "REA's JSON representation has this fixed nesting policy. This release has no runtime override; increasing byte or worker budgets does not change it.",
    },
];
