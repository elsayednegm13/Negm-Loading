import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_toolEffects, r as toolContractMetadata } from "./toolEffects-DfSM1OGQ.js";
import { i as localPathStringSchema, n as init_localPath } from "./localPath-BCKW5wEI.js";
import { i as jsonValueSchema, n as init_jsonValue } from "./jsonValue-CvnZ7JX6.js";
import { Ct as init_keyedArchive, Go as artifactIntegrityPolicySchema, Ko as init_artifactIntegrityPolicy, Ln as init_toolOutputSchemaPrimitives, _t as appleAssetCatalogInputSchema, a as init_toolOutputSchemaGroups, jn as init_analysisDetail, kn as analysisDetailSchema, t as artifactOutputSchemas, wt as keyedArchiveInputSchema, yt as init_appleAssetCatalog, zn as requireOutputSchema } from "./toolOutputSchemaGroups-BS_G8lPZ.js";
import { c as dylibResolutionInputSchema, u as init_dylibResolution } from "./electronFuses-BJ5gsDwd.js";
import { z } from "zod";

//#region dist/contracts/artifactToolContracts.js
var artifactInventoryInputSchema, artifactInspectionInputSchema, artifactExtractionInputSchema, artifactExtractionExecutionSchema, exampleInputSchema, examples, artifact, ARTIFACT_TOOL_CONTRACTS, ARTIFACT_ANALYSIS_OPERATIONS;
function init_artifactToolContracts() {
	return (init_artifactToolContracts = __esmMin((() => {
		init_toolOutputSchemaGroups();
		init_artifactIntegrityPolicy();
		init_jsonValue();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_appleAssetCatalog();
		init_dylibResolution();
		init_keyedArchive();
		init_localPath();
		init_analysisDetail();
		artifactInventoryInputSchema = z.strictObject({ integrity_policy: artifactIntegrityPolicySchema });
		artifactInspectionInputSchema = artifactInventoryInputSchema.extend({ detail: analysisDetailSchema.unwrap().optional().describe("Omitted or complete returns the complete inspection Evidence. summary retains that complete Evidence in this session and returns its inspect_analysis_view summary; use normalized_result.parent_evidence_id for inventory views.") });
		artifactExtractionInputSchema = z.strictObject({ integrity_policy: artifactIntegrityPolicySchema });
		artifactExtractionExecutionSchema = artifactExtractionInputSchema.extend({ output_root: localPathStringSchema });
		exampleInputSchema = z.record(z.string(), jsonValueSchema);
		examples = {
			inspect_artifact: { detail: "summary" },
			extract_artifact: {},
			decode_interface_builder: {},
			inspect_asset_catalog: {
				offset: 0,
				limit: 1e3
			},
			inspect_keyed_archive: { path: "Contents/Resources/Model.plist" },
			trace_dylib_resolution: {
				roots: ["Contents/MacOS/App"],
				architecture: "arm64"
			}
		};
		artifact = (name, description, inputSchema) => {
			const outputSchema = requireOutputSchema(artifactOutputSchemas, name);
			return {
				name,
				...toolContractMetadata(name),
				description,
				kind: "artifact-provider",
				requiresActiveTarget: true,
				inputSchema,
				outputSchema,
				examples: [{
					title: `Example ${name.replaceAll("_", " ")} request`,
					input: exampleInputSchema.parse(examples[name] ?? {})
				}]
			};
		};
		ARTIFACT_TOOL_CONTRACTS = [
			artifact("inspect_artifact", "Inspect an active archive or application package, including Node.js SEA carriers, in one call. By default returns the complete content-addressed artifact graph once, as the typed nested inventory Evidence, with root and integrity observations, integrity contradictions, hypotheses, unexplored branches, limitations, and next probes inline. For PCK and large containers prefer detail summary: it retains the complete inspection and returns its derived summary view; read exact paths, batch occurrence/content IDs and selected fields with inspect_analysis_view using parent_evidence_id. This changes delivery, not inventory coverage. Read-only DMG mounting is used automatically on supported macOS hosts. Integrity mismatches fail by default; record-and-continue keeps mismatches explicitly untrusted. It does not extract files; use extract_artifact to materialize regular contents of supported formats. DMG extraction is unavailable; use a caller-managed read-only mount on macOS to access its files.", artifactInspectionInputSchema),
			artifact("extract_artifact", "Extract regular files (including Node.js SEA scripts and assets) exposed by a supported active archive reader into a fresh temporary directory chosen by REA. A nested archive exposed as a file is copied as a file; inspect and extract it separately to unpack its contents. The result includes its location. DMG extraction is unavailable; use a caller-managed read-only mount on macOS to access its files. Rejects traversal and symlink escapes, never overwrites, and verifies cleanup. Integrity mismatches fail by default; record-and-continue extracts the observed bytes and returns each mismatch as an explicitly untrusted integrity contradiction.", artifactExtractionInputSchema),
			artifact("decode_interface_builder", "Decode compiled storyboard and nib archives inside the active Apple app bundle, including keyed property lists and NIBArchive object tables, into a bounded object, hierarchy, and connection graph. This is static archive parsing; unrecognized archive classes and unresolved code handlers remain explicit unknowns. A full app graph is often several megabytes; detail summary retains it and returns documents with node, edge and coverage counts, then page rows, optionally one document's, with inspect_analysis_view kind interface-builder.", z.strictObject({
				max_documents: z.int().min(1).max(64).default(64),
				max_objects: z.int().min(1).max(2e4).default(2e4),
				max_connections: z.int().min(1).max(4e4).default(4e4),
				detail: analysisDetailSchema.unwrap().optional().describe("Omitted or complete returns the complete decoded graph Evidence. summary retains that complete Evidence in this session and returns its inspect_analysis_view summary; use normalized_result.parent_evidence_id for interface-builder pages.")
			})),
			artifact("inspect_keyed_archive", "Inspect one Foundation NSKeyedArchiver plist in the active app bundle as original object-table nodes, class descriptors, named roots, and UID edges. Preserves shared and cyclic references without instantiating classes. The path is relative to the bundle; root selection and object pagination preserve original identities.", keyedArchiveInputSchema),
			artifact("inspect_asset_catalog", "Inspect compiled Assets.car metadata in an active Apple app bundle. Returns stable paginated catalog and rendition records with raw assetutil metadata and catalog digests; rendition bytes are not extracted.", appleAssetCatalogInputSchema),
			artifact("trace_dylib_resolution", "Trace how dyld would resolve each Mach-O dylib load for the active Mach-O, or for every executable in the active .app bundle (the main app, XPC services, extensions, login items, helpers). Expands @executable_path, @loader_path, and @rpath through each process's LC_RPATH stack in dependents-first load order, and reports every candidate path with its outcome, the resolved image and digest, weak, re-export, upward, and lazy-load flags, including LC_LAZY_LOAD_DYLIB_INFO linkedit payloads, and derived findings such as unresolved required loads or absent earlier @rpath candidates. Pure header parsing: nothing is executed, and absolute or system paths outside the analyzed root stay undetermined. Select roots or one architecture to narrow large bundles.", dylibResolutionInputSchema)
		];
		ARTIFACT_ANALYSIS_OPERATIONS = ["inventory_artifact", ...ARTIFACT_TOOL_CONTRACTS.map(({ name }) => name)];
	})))();
}

//#endregion
export { init_artifactToolContracts as a, artifactInventoryInputSchema as i, ARTIFACT_TOOL_CONTRACTS as n, artifactExtractionExecutionSchema as r, ARTIFACT_ANALYSIS_OPERATIONS as t };