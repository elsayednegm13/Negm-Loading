import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_jsonValue, r as jsonObjectSchema } from "./jsonValue-CvnZ7JX6.js";
import { d as init_browserDeadline, g as webRuntimeCommandTimeoutSchema, r as DEFAULT_CDP_COMMAND_TIMEOUT_MS, t as CDP_CLEANUP_GRACE_MS } from "./browserDeadline-YXJtM4nx.js";
import { a as browserAllowedOriginsSchema, l as init_browserObservation, o as browserEndpointSchema } from "./webContentArtifact-uGXrWU6X.js";
import { z } from "zod";

//#region dist/domain/webRuntime.js
var SCRIPT_ID, RESOURCE_LINE, RESOURCE_COLUMN, START_LINE, START_COLUMN, webRuntimeScopeSchema, webRuntimeSourceSchema, webRuntimeLocationSchema, webRuntimeTargetSchema, WEB_RUNTIME_LIMITS;
function init_webRuntime() {
	return (init_webRuntime = __esmMin((() => {
		init_browserObservation();
		init_browserDeadline();
		init_jsonValue();
		SCRIPT_ID = "CDP session script ID; empty for a position a request initiator reported, which has no session-script association for joining captured source or resource_start.";
		RESOURCE_LINE = "Zero-based line in the resource named by url, as reported by CDP: the script file for an external script (including a module-import initiator), or the HTML document for an inline script or parser markup.";
		RESOURCE_COLUMN = "Zero-based UTF-16 column on that line of the resource named by url, as reported by CDP.";
		START_LINE = "Zero-based line where the script text starts in its enclosing resource (the HTML document for an inline script).";
		START_COLUMN = "Zero-based UTF-16 column where the script text starts on that line of its enclosing resource.";
		webRuntimeScopeSchema = z.strictObject({
			cdp_endpoint: browserEndpointSchema,
			allowed_origins: browserAllowedOriginsSchema,
			target_id: z.string().min(1),
			command_timeout_ms: webRuntimeCommandTimeoutSchema
		});
		webRuntimeSourceSchema = z.object({
			script_id: z.string().min(1),
			url: z.string(),
			execution_context_id: z.int().nullable(),
			reported_execution_context: jsonObjectSchema.nullable(),
			reported_script_context_aux_data: jsonObjectSchema.nullable(),
			frame_id: z.string().nullable(),
			producer_hash: z.string().nullable(),
			source_map_url: z.string().nullable(),
			has_source_url: z.boolean().nullable(),
			language: z.string().nullable(),
			resource_start: z.object({
				line_number: z.int().min(0).describe(START_LINE),
				column_number: z.int().min(0).describe(START_COLUMN)
			}).nullable(),
			source: z.discriminatedUnion("state", [z.object({
				state: z.literal("captured"),
				text: z.string(),
				sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				utf8_bytes: z.int().min(0),
				utf16_units: z.int().min(0)
			}), z.object({
				state: z.enum(["unavailable", "excluded"]),
				reason: z.string().min(1)
			})])
		});
		webRuntimeLocationSchema = z.object({
			script_id: z.string().describe(SCRIPT_ID),
			url: z.string().nullable(),
			line_number: z.int().min(0).describe(RESOURCE_LINE),
			column_number: z.int().min(0).nullable().describe(RESOURCE_COLUMN),
			function_name: z.string().nullable(),
			source_association: z.enum(["script_id", "unknown"])
		});
		webRuntimeTargetSchema = z.object({
			target_id: z.string().min(1),
			origin: z.string().min(1),
			initial_url: z.string(),
			frame_id: z.string().min(1),
			loader_id: z.string().nullable()
		});
		WEB_RUNTIME_LIMITS = {
			protocolBytes: 64 * 1024 * 1024,
			retainedEventBytes: 8 * 1024 * 1024,
			sourceBytes: 32 * 1024 * 1024,
			commandTimeoutMs: DEFAULT_CDP_COMMAND_TIMEOUT_MS,
			cleanupTimeoutMs: CDP_CLEANUP_GRACE_MS
		};
	})))();
}

//#endregion
export { webRuntimeSourceSchema as a, webRuntimeScopeSchema as i, init_webRuntime as n, webRuntimeTargetSchema as o, webRuntimeLocationSchema as r, WEB_RUNTIME_LIMITS as t };