import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, digestCanonicalValue, digestSchema, hasCompleteInventoryCoverage, init_artifactInventoryEvidence, init_canonicalDigest, init_digests, init_nativeConvention, init_unicodeCodePointOrder, nativeRuntimeConvention, prefixedDigestSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { bridgeCandidateCoverageSchema, init_bridgeCandidateProjection, init_mobileApplicationGraphProjection, projectCartesianCandidates, projectedBridgeCandidateSchema, projectedComponentSchema, projectedFileComponents, projectedInventoryEntries, projectionCoverage, projectionEvidenceIdSchema, unavailableComponentSchema } from "./bridgeCandidateProjection-CnT1LS_C.js";
import { z } from "zod";

//#region dist/domain/harmony/harmonyApplication.js
var HARMONY_ROOT_FORMATS, harmonyApplicationProjectionResultSchema, projectHarmonyInventory, harmonyRootFormat, packagingModel, classify, isResourcePath, runtimeFamilies, bridgeCandidates, napiBasis;
function init_harmonyApplication() {
	return (init_harmonyApplication = __esmMin((() => {
		init_bridgeCandidateProjection();
		init_analysisErrorCore();
		init_artifactInventoryEvidence();
		init_digests();
		init_canonicalDigest();
		init_nativeConvention();
		init_mobileApplicationGraphProjection();
		init_unicodeCodePointOrder();
		init_result();
		HARMONY_ROOT_FORMATS = [
			"hap",
			"hsp",
			"app-pack"
		];
		harmonyApplicationProjectionResultSchema = z.strictObject({
			projection_id: prefixedDigestSchema("hmp"),
			root_sha256: digestSchema,
			root_format: z.enum(HARMONY_ROOT_FORMATS),
			source_evidence_ids: z.array(projectionEvidenceIdSchema).min(1),
			packaging_model: z.enum([
				"stage",
				"fa",
				"unknown"
			]),
			components: z.strictObject({
				manifests: z.array(projectedComponentSchema),
				bytecode: z.array(projectedComponentSchema),
				resources: z.array(projectedComponentSchema),
				native_libraries: z.array(projectedComponentSchema),
				javascript: z.array(projectedComponentSchema),
				signing: z.array(projectedComponentSchema)
			}),
			unavailable_components: z.array(unavailableComponentSchema),
			app_pack_children: z.array(z.union([projectedComponentSchema, unavailableComponentSchema])),
			runtime_families: z.array(z.enum([
				"ark",
				"native",
				"javascript",
				"react-native",
				"flutter",
				"unity"
			])),
			bridge_candidates: z.array(projectedBridgeCandidateSchema(["managed-and-native-content", "napi-library-convention"])),
			bridge_candidate_coverage: bridgeCandidateCoverageSchema,
			coverage: z.strictObject({
				status: z.enum(["complete-within-inventory", "partial"]),
				inventory_complete: z.boolean()
			}),
			limitations: z.array(z.string())
		});
		projectHarmonyInventory = (source) => {
			const { evidence, inventory } = source;
			const rootFormatResult = harmonyRootFormat(inventory.manifest.root_format);
			if (!rootFormatResult.ok) return rootFormatResult;
			const rootFormat = rootFormatResult.value;
			const { entries, limitations: unresolved } = projectedInventoryEntries(inventory);
			const all = projectedFileComponents(entries);
			const unavailable = entries.flatMap(({ unavailable }) => unavailable === undefined ? [] : [unavailable]);
			const fileEntries = entries.filter(({ kind }) => kind === "file" || kind === "slice");
			const children = [];
			if (rootFormat === "app-pack") {
				for (const entry of fileEntries) {
					if (!/\.(?:hap|hsp)$/iu.test(entry.path)) continue;
					const child = entry.component ?? entry.unavailable;
					if (child !== undefined) children.push(child);
				}
			}
			const classified = classify(all);
			const bridgeProjection = bridgeCandidates(classified.bytecode, classified.native_libraries);
			const limitations = [
				...unresolved,
				...inventory.limitations,
				...!hasCompleteInventoryCoverage(inventory, "container-entries") ? ["Source inventory coverage is partial; absence is unknown."] : [],
				...unavailable.length > 0 ? ["Some inventoried occurrences have no authenticated content identity. Their paths and limitations are retained in unavailable_components; component and runtime absence is unknown."] : [],
				"Manifest, module, resource, and signing semantics require a dedicated HarmonyOS provider; this projection reports exact inventory paths and hashes only.",
				"The packaging model is a path-presence heuristic: a Stage model is claimed only from module.json and a FA model only from config.json; both can coexist with unusual layouts.",
				"Runtime families are inferred from inventory formats and paths; filename suffixes do not establish valid Ark bytecode.",
				"The signing component lists META-INF certificate-entry suffixes only; signatures applied by the packaging tool live in the ZIP signing block rather than archive entries, so an empty signing list does not mean the package is unsigned.",
				"Bridge candidates are path-based hypotheses, not decoded N-API declarations or observed runtime calls.",
				...rootFormat === "app-pack" ? ["App Pack child packages are listed by inventory path only; their contents are not recursively inventoried by this projection.", "The app-pack root classification is a verified-ZIP-magic plus .app suffix rule; the projection does not require pack.info or child packages before reporting the root format."] : [],
				"HarmonyOS .har shared libraries are not identified by this projection; the .har suffix also names HTTP Archive JSON, so that classification requires verified ZIP bytes.",
				...bridgeProjection.coverage.status === "partial" ? [`Bridge candidate pairs exceeded the projection safety budget; ${bridgeProjection.coverage.omitted_candidates} hypotheses are omitted. Component arrays still include every component from the supplied inventory pages.`] : []
			];
			const withoutId = {
				root_sha256: inventory.manifest.root_sha256,
				root_format: rootFormat,
				source_evidence_ids: evidence.map(({ evidence_id: id }) => id).sort(compareUnicodeCodePoints),
				packaging_model: packagingModel(fileEntries.filter(({ path }) => !isResourcePath(path))),
				components: classified,
				unavailable_components: unavailable,
				app_pack_children: children,
				runtime_families: runtimeFamilies(all, classified),
				bridge_candidates: bridgeProjection.candidates,
				bridge_candidate_coverage: bridgeProjection.coverage,
				coverage: projectionCoverage(inventory, bridgeProjection.coverage.status === "complete" && unavailable.length === 0),
				limitations
			};
			return ok(harmonyApplicationProjectionResultSchema.parse({
				...withoutId,
				projection_id: `hmp_${digestCanonicalValue(withoutId, "HarmonyOS application projection")}`
			}));
		};
		harmonyRootFormat = (format) => {
			const root = HARMONY_ROOT_FORMATS.find((candidate) => candidate === format);
			if (root === undefined) return err(new AnalysisInputError("project_harmony_application_graph", {}, [{
				path: [
					"inventory_evidence",
					0,
					"normalized_result",
					"manifest",
					"root_format"
				],
				reason: "invalid_value",
				message: `HarmonyOS application projection requires HAP, HSP, or App Pack inventory Evidence (got ${format})`
			}]));
			return ok(root);
		};
		packagingModel = (manifests) => {
			const stage = manifests.some(({ path }) => /(?:^|\/)module\.json$/iu.test(path));
			const fa = manifests.some(({ path }) => /(?:^|\/)config\.json$/iu.test(path));
			if (stage) return "stage";
			if (fa) return "fa";
			return "unknown";
		};
		classify = (all) => ({
			manifests: all.filter(({ path }) => /(?:^|\/)(?:module\.json|config\.json|pack\.info)$/iu.test(path) && !isResourcePath(path)),
			bytecode: all.filter(({ path }) => /\.(?:abc|pa)$/iu.test(path)),
			resources: all.filter(({ path }) => isResourcePath(path)),
			native_libraries: all.filter(({ path, format }) => format === "elf" || /(?:^|\/)libs\/[^/]+\/[^/]+\.so$/iu.test(path)),
			javascript: all.filter(({ path, format }) => format === "javascript-bundle" || /\.(?:m?js|cjs)$/iu.test(path)),
			signing: all.filter(({ path }) => /^META-INF\/[^/]+\.(?:p7b|sig|cer|crt|pem|provision|rsa|dsa|ec)$/iu.test(path))
		});
		isResourcePath = (path) => /(?:^|\/)resources\.index$/iu.test(path) || /^(?:resources\/|assets\/[^/]+\/resources\/)/iu.test(path);
		runtimeFamilies = (all, components) => {
			const families = new Set();
			if (components.bytecode.length > 0) families.add("ark");
			if (all.some(({ format }) => format === "elf")) families.add("native");
			if (components.javascript.length > 0) families.add("javascript");
			for (const { path } of all) {
				const convention = nativeRuntimeConvention(path);
				if (convention !== null) families.add(convention);
			}
			return [...families].sort(compareUnicodeCodePoints);
		};
		bridgeCandidates = (managed, native) => {
			return projectCartesianCandidates({
				groups: [{
					left: managed,
					right: native
				}],
				createCandidate: (managed_path, target) => ({
					managed_path,
					native_path: target.path,
					basis: napiBasis(target.path)
				})
			});
		};
		napiBasis = (path) => /(?:^|\/)libs\/[^/]+\/lib[^/]+\.so$/iu.test(path) ? "napi-library-convention" : "managed-and-native-content";
	})))();
}

//#endregion
export { harmonyApplicationProjectionResultSchema, init_harmonyApplication, projectHarmonyInventory };