import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { R as init_objcSwiftMetadata, V as nativeDispatchMetadataInputSchema, _ as nativeValueTraceInputSchema, g as init_nativeValueTrace, o as decompileDirectoryInputSchema, u as init_decompileDirectory } from "./decompileDirectory-BYCrIBrk.js";
import { n as nativeProcedureInputSchema, t as init_nativeProcedureInput } from "./nativeProcedureInput-k8ruuY5t.js";
import { z } from "zod";

//#region dist/contracts/enhancedInputs.js
var traceLiteralInputSchema, DEFAULT_CALL_RELATIONSHIP_DIRECTION, callRelationshipDirectionSchema, enhancedInputSchemas;
function init_enhancedInputs() {
	return (init_enhancedInputs = __esmMin((() => {
		init_objcSwiftMetadata();
		init_nativeProcedureInput();
		init_decompileDirectory();
		init_nativeValueTrace();
		traceLiteralInputSchema = z.strictObject({
			query: z.string().min(1),
			case_sensitive: z.boolean().default(false)
		});
		DEFAULT_CALL_RELATIONSHIP_DIRECTION = "forward";
		callRelationshipDirectionSchema = z.enum(["forward", "backward"]).default(DEFAULT_CALL_RELATIONSHIP_DIRECTION);
		enhancedInputSchemas = {
			trace_native_values: nativeValueTraceInputSchema,
			inspect_native_dispatch_metadata: nativeDispatchMetadataInputSchema,
			get_objc_classes: z.strictObject({ pattern: z.string().default("") }),
			get_objc_protocols: z.strictObject({}),
			batch_decompile: z.strictObject({ addresses: z.array(z.string().describe("A provider-normalized procedure address")).default([]) }),
			decompile_all: decompileDirectoryInputSchema,
			get_call_graph: z.strictObject({
				address: z.string().describe("A procedure symbol or address to resolve to its canonical entry"),
				direction: callRelationshipDirectionSchema
			}),
			analyze_swift_types: z.strictObject({
				category: z.enum([
					"classes",
					"structs",
					"enums",
					"protocols",
					"extensions",
					"other"
				]).optional().describe("Limit categorized results to one Swift category; unresolved category observations remain in unclassified."),
				pattern: z.string().optional().describe("Case-sensitive literal filter applied to provider procedure names and their supporting Swift manglings.")
			}),
			find_xrefs_to_name: z.strictObject({ name: z.string() }),
			binary_overview: z.strictObject({}),
			analyze_function: nativeProcedureInputSchema,
			inspect_native_api: nativeProcedureInputSchema,
			trace_feature: traceLiteralInputSchema,
			trace_call_path: z.strictObject({
				start: z.string().describe("A starting procedure symbol or address"),
				goal: z.string().describe("An optional destination procedure symbol or address").optional(),
				direction: callRelationshipDirectionSchema
			}),
			trace_native_ui_action: z.strictObject({
				action: z.string().min(1).describe("A unique compiled UI action selector, interface object ID, native symbol or exact function address"),
				max_depth: z.int().min(0).max(32).default(8),
				max_nodes: z.int().min(1).max(2e3).default(250),
				max_edges: z.int().min(1).max(5e3).default(500)
			})
		};
	})))();
}

//#endregion
export { enhancedInputSchemas as n, init_enhancedInputs as r, DEFAULT_CALL_RELATIONSHIP_DIRECTION as t };