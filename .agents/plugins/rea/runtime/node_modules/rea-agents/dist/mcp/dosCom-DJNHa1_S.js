import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { n as init_toolEffects, r as toolContractMetadata } from "./toolEffects-DfSM1OGQ.js";
import { n as init_localPath, t as absoluteLocalPathStringSchema } from "./localPath-BCKW5wEI.js";
import { Ln as init_toolOutputSchemaPrimitives, a as init_toolOutputSchemaGroups, jn as init_analysisDetail, kn as analysisDetailSchema, o as managedOutputSchemas, zn as requireOutputSchema } from "./toolOutputSchemaGroups-BS_G8lPZ.js";
import { z } from "zod";

//#region dist/contracts/managed/managedToolContracts.js
var managedTargetInputSchema, managedArtifactInputSchema, managedMembersInputSchema, outputSchema, memberOutputSchema, nativeBoundaryOutputSchema, MANAGED_TOOL_CONTRACTS, isManagedToolName;
function init_managedToolContracts() {
	return (init_managedToolContracts = __esmMin((() => {
		init_toolOutputSchemaGroups();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_localPath();
		init_analysisDetail();
		managedTargetInputSchema = z.strictObject({ path: absoluteLocalPathStringSchema.describe("Explicit absolute managed PE/CLI path; omit to reuse the previously selected managed target").optional() });
		managedArtifactInputSchema = managedTargetInputSchema.extend({ detail: analysisDetailSchema });
		managedMembersInputSchema = managedArtifactInputSchema.extend({ type_names: z.array(z.string().min(1).describe("Exact declaring-type full_name: namespace-qualified for top-level types (System.Threading.Monitor); nested types report their bare name, so it selects every nested type of that name")).min(1).refine((names) => new Set(names).size === names.length, { message: "type_names must not repeat a name" }).meta({ uniqueItems: true }).describe("Inspect only the fields, methods, call edges, and field accesses declared by these exact type full names, and the user strings their method bodies load; omit to inspect every type. Unmatched names are reported in selection.unmatched_type_names.").optional() });
		outputSchema = requireOutputSchema(managedOutputSchemas, "inspect_managed_artifact");
		memberOutputSchema = requireOutputSchema(managedOutputSchemas, "inspect_managed_members");
		nativeBoundaryOutputSchema = requireOutputSchema(managedOutputSchemas, "inspect_managed_native_boundaries");
		MANAGED_TOOL_CONTRACTS = [
			{
				name: "inspect_managed_artifact",
				...toolContractMetadata("inspect_managed_artifact"),
				description: "Inspect an explicit PE/CLI path, or the selected managed target, without loading or executing target code. Omitted or complete detail returns complete metadata inventories with original coverage. Select detail: \"summary\" on the first call for complete identity, PE/CLI, classification with its evidence, module/MVID, assembly, frameworks, returned-collection counts, coverage/issues and limitations. It retains complete Evidence and returns a distinct linked inspect_analysis_view summary. Page original references/resources/attributes with view kind managed and normalized_result.parent_evidence_id. Counts cover producer-returned rows; partial, unavailable or malformed metadata remains explicit and tokens remain build-local.",
				kind: "managed-provider",
				inputSchema: managedArtifactInputSchema,
				outputSchema,
				examples: [{
					title: "Example inspect managed artifact request",
					input: { path: "/tmp/Example.dll" }
				}, {
					title: "Inspect identity and coverage without unrelated metadata inventories",
					input: {
						path: "/tmp/Example.dll",
						detail: "summary"
					}
				}]
			},
			{
				name: "inspect_managed_members",
				...toolContractMetadata("inspect_managed_members"),
				description: "Inspect PE/CLI metadata members, signatures, raw CIL hashes, decoded-instruction-tuple hashes, separately reported exception regions, call edges, field-access anchors, and the #US string literals that ldstr loads, without loading or executing target code. Select type_names to decode only the members of those exact declaring types and the literals their bodies load, which keeps large assemblies such as a base class library within the representation budget. Metadata tokens are reported as build-local coordinates bound to the artifact SHA-256 and MVID; the tuple hash does not resolve them or fully commit control flow. Omitted or complete detail returns every collection, including the assembly-wide member_refs and exported_types, which type_names does not narrow. Select detail: \"summary\" for identity, metadata status, selection with unmatched names, coverage/issues, limitations and per-collection counts; it retains complete Evidence and returns a linked inspect_analysis_view summary. Page original rows with view kind managed-members, normalized_result.parent_evidence_id and collection types/exported_types/fields/methods/member_refs/call_edges/field_accesses/user_strings.",
				kind: "managed-provider",
				inputSchema: managedMembersInputSchema,
				outputSchema: memberOutputSchema,
				examples: [
					{
						title: "Example inspect managed members request",
						input: {}
					},
					{
						title: "Example inspect selected managed types request",
						input: {
							path: "/tmp/mscorlib.dll",
							type_names: ["System.Threading.Monitor"]
						}
					},
					{
						title: "Summarize selected managed types and retain their members",
						input: {
							path: "/tmp/mscorlib.dll",
							type_names: ["System.Threading.Monitor"],
							detail: "summary"
						}
					}
				]
			},
			{
				name: "inspect_managed_native_boundaries",
				...toolContractMetadata("inspect_managed_native_boundaries"),
				description: "Inspect PE/CLI ModuleRef, ImplMap/PInvoke declarations, CLI native-header indicators, and non-IL method implementation flags without loading or executing target code. Results are managed declarations and degraded native-boundary observations, not verified native exports or addresses.",
				kind: "managed-provider",
				inputSchema: managedTargetInputSchema,
				outputSchema: nativeBoundaryOutputSchema,
				examples: [{
					title: "Example inspect managed/native boundary request",
					input: {}
				}]
			}
		];
		isManagedToolName = (name) => MANAGED_TOOL_CONTRACTS.some((contract) => contract.name === name);
	})))();
}

//#endregion
//#region dist/domain/dosCom.js
var executableFormatHintSchema, validateDosComLength;
function init_dosCom() {
	return (init_dosCom = __esmMin((() => {
		init_result();
		executableFormatHintSchema = z.enum([
			"dos-com",
			"raw-binary",
			"gamecube-dol"
		]);
		validateDosComLength = (length) => Number.isSafeInteger(length) && length >= 1 && length <= 65280 ? ok(null) : err("DOS COM requires 1..65280 file bytes (64 KiB segment minus the 256-byte PSP prefix)");
	})))();
}

//#endregion
export { init_managedToolContracts as a, managedTargetInputSchema as c, MANAGED_TOOL_CONTRACTS as i, init_dosCom as n, isManagedToolName as o, validateDosComLength as r, managedMembersInputSchema as s, executableFormatHintSchema as t };