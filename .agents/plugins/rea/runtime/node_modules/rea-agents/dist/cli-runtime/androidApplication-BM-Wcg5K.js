import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, digestCanonicalValue, digestSchema, hasCompleteInventoryCoverage, init_apkV1MetadataName, init_artifactInventoryEvidence, init_canonicalDigest, init_digests, init_nativeConvention, init_unicodeCodePointOrder, isV1SignatureMetadataName, nativeRuntimeConvention, prefixedDigestSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { bridgeCandidateCoverageSchema, init_bridgeCandidateProjection, init_mobileApplicationGraphProjection, projectCartesianCandidates, projectedBridgeCandidateSchema, projectedComponentSchema, projectedFileComponents, projectedInventoryEntries, projectionCoverage, projectionEvidenceIdSchema, unavailableComponentSchema } from "./bridgeCandidateProjection-CnT1LS_C.js";
import { z } from "zod";

//#region dist/domain/android/androidApplication.js
var androidApplicationProjectionResultSchema, projectAndroidInventory, classify, runtimeFamilies, bridgeCandidates, bridgeBasis;
function init_androidApplication() {
	return (init_androidApplication = __esmMin((() => {
		init_bridgeCandidateProjection();
		init_analysisErrorCore();
		init_artifactInventoryEvidence();
		init_digests();
		init_canonicalDigest();
		init_nativeConvention();
		init_mobileApplicationGraphProjection();
		init_unicodeCodePointOrder();
		init_result();
		init_apkV1MetadataName();
		androidApplicationProjectionResultSchema = z.strictObject({
			projection_id: prefixedDigestSchema("adp"),
			root_sha256: digestSchema,
			root_format: z.literal("apk"),
			source_evidence_ids: z.array(projectionEvidenceIdSchema).min(1),
			components: z.strictObject({
				manifests: z.array(projectedComponentSchema),
				resources: z.array(projectedComponentSchema),
				dex: z.array(projectedComponentSchema),
				jvm_classes: z.array(projectedComponentSchema),
				native_libraries: z.array(projectedComponentSchema),
				javascript: z.array(projectedComponentSchema),
				signing: z.array(projectedComponentSchema)
			}),
			unavailable_components: z.array(unavailableComponentSchema),
			runtime_families: z.array(z.enum([
				"dalvik-art",
				"java-kotlin",
				"native",
				"javascript",
				"react-native",
				"flutter",
				"unity"
			])),
			bridge_candidates: z.array(projectedBridgeCandidateSchema([
				"managed-and-native-content",
				"jni-library-convention",
				"react-native-convention",
				"flutter-convention",
				"unity-convention"
			])),
			bridge_candidate_coverage: bridgeCandidateCoverageSchema,
			coverage: z.strictObject({
				status: z.enum(["complete-within-inventory", "partial"]),
				inventory_complete: z.boolean()
			}),
			limitations: z.array(z.string())
		});
		projectAndroidInventory = (source) => {
			const { evidence, inventory } = source;
			if (inventory.manifest.root_format !== "apk") return err(new AnalysisInputError("project_android_application_graph", {}, [{
				path: [
					"inventory_evidence",
					0,
					"normalized_result",
					"manifest",
					"root_format"
				],
				reason: "invalid_value",
				message: `Android application projection requires APK inventory Evidence; the inventory root format is ${inventory.manifest.root_format}. APK is chosen for a ZIP archive whose name ends in .apk.`
			}]));
			const { entries, limitations: unresolved } = projectedInventoryEntries(inventory);
			const all = projectedFileComponents(entries);
			const unavailable = entries.flatMap(({ unavailable }) => unavailable === undefined ? [] : [unavailable]);
			const classified = classify(all);
			const bridgeProjection = bridgeCandidates([...classified.dex, ...classified.jvm_classes], classified.native_libraries);
			const components = classified;
			const limitations = [
				...unresolved,
				...inventory.limitations,
				...!hasCompleteInventoryCoverage(inventory, "container-entries") ? ["Source inventory coverage is partial; absence is unknown."] : [],
				"Manifest, resource, signing, and bytecode semantics require a dedicated Android provider; this projection reports exact inventory paths and hashes only.",
				"Runtime families are inferred from inventory formats and paths; filename suffixes do not establish valid DEX or JVM class bytes.",
				"Bridge candidates are path-based hypotheses, not decoded JNI declarations or observed runtime calls.",
				"A bridge basis is inferred from the native path and is repeated for every managed component.",
				"ZIP inventory cannot see the APK Signing Block, so an empty signing array does not mean the APK is unsigned.",
				...entries.some(({ path, kind }) => path === "AndroidManifest.xml" && (kind === "file" || kind === "slice")) ? [] : ["No root AndroidManifest.xml occurrence was observed. The APK family comes from the .apk suffix of a ZIP archive, so these bytes may not be an APK."],
				...bridgeProjection.coverage.status === "partial" ? [`Bridge candidate pairs exceeded the projection safety budget; ${bridgeProjection.coverage.omitted_candidates} hypotheses are omitted. Component arrays still include every component from the supplied inventory pages.`] : [],
				...unavailable.length > 0 ? ["Some inventoried occurrences have no authenticated content identity. Their paths and limitations are retained in unavailable_components; component absence is unknown."] : []
			];
			const withoutId = {
				root_sha256: inventory.manifest.root_sha256,
				root_format: "apk",
				source_evidence_ids: evidence.map(({ evidence_id: id }) => id).sort(compareUnicodeCodePoints),
				components,
				unavailable_components: unavailable,
				runtime_families: runtimeFamilies(all, classified),
				bridge_candidates: bridgeProjection.candidates,
				bridge_candidate_coverage: bridgeProjection.coverage,
				coverage: projectionCoverage(inventory, bridgeProjection.coverage.status === "complete" && unavailable.length === 0),
				limitations
			};
			return ok(androidApplicationProjectionResultSchema.parse({
				...withoutId,
				projection_id: `adp_${digestCanonicalValue(withoutId, "Android application projection")}`
			}));
		};
		classify = (all) => ({
			manifests: all.filter(({ path }) => /(?:^|\/)AndroidManifest\.xml$/u.test(path)),
			resources: all.filter(({ path }) => /(?:^|\/)resources\.arsc$/u.test(path)),
			dex: all.filter(({ path }) => /(?:^|\/)[^/]+\.dex$/iu.test(path)),
			jvm_classes: all.filter(({ path }) => /(?:^|\/)[^/]+\.class$/iu.test(path)),
			native_libraries: all.filter(({ path, format }) => format === "elf" || /(?:^|\/)lib\/[^/]+\/[^/]+\.so$/iu.test(path)),
			javascript: all.filter(({ format }) => format === "javascript-bundle"),
			signing: all.filter(({ path }) => isV1SignatureMetadataName(path))
		});
		runtimeFamilies = (all, components) => {
			const families = new Set();
			if (components.dex.length > 0) families.add("dalvik-art");
			if (components.jvm_classes.length > 0) families.add("java-kotlin");
			if (all.some(({ format }) => format === "elf")) families.add("native");
			if (all.some(({ format }) => format === "javascript-bundle")) families.add("javascript");
			for (const { path } of components.native_libraries) {
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
					basis: bridgeBasis(target.path)
				})
			});
		};
		bridgeBasis = (path) => {
			const convention = nativeRuntimeConvention(path);
			if (convention === "react-native") return "react-native-convention";
			if (convention === "flutter") return "flutter-convention";
			if (convention === "unity") return "unity-convention";
			if (/(?:^|\/)lib\/[^/]+\/lib[^/]+\.so$/iu.test(path)) return "jni-library-convention";
			return "managed-and-native-content";
		};
	})))();
}

//#endregion
export { androidApplicationProjectionResultSchema, init_androidApplication, projectAndroidInventory };