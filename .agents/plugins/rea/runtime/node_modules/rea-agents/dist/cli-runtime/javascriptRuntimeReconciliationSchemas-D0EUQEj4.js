import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, digestSchema, evidenceSchema, init_artifactIdentity, init_digests, init_evidence, init_javascriptApplicationGraph, init_javascriptRuntimeObservation, init_unicodeCodePointOrder, init_urlComponents, javascriptApplicationGraphSchema, javascriptRuntimeUnresolvedLocationSchema, logicalPathEscapesRoot, prefixedDigestSchema, urlDeclaresQueryOrFragment } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { z } from "zod";

//#region dist/domain/javascript/javascriptRuntimeReconciliationSchemas.js
function normalizeRuntimeMappings(mappings) {
	return [...new Map(mappings.map((mapping) => [runtimeMappingKey(mapping), mapping])).values()].sort((left, right) => compareUnicodeCodePoints(runtimeMappingKey(left), runtimeMappingKey(right)));
}
function runtimeMappingKey(mapping) {
	return mapping.kind === "file-root" ? `file-root\0${mapping.root}\0${mapping.artifact_prefix}` : `url-prefix\0${mapping.prefix}\0${mapping.artifact_prefix}`;
}
var evidenceIdSchema, nodeIdSchema, boundedTextSchema, safePrefixSchema, runtimeFileMappingSchema, runtimeUrlMappingSchema, normalizeRuntimeUrlPrefix, runtimeLocationMappingSchema, staticLayerSchema, reconcileJavaScriptRuntimeInputSchema, layerSummarySchema, captureSummarySchema, reconciliationReasonSchema, reconciliationItemShape, reconciliationItemSchema, staticLoadStateSchema, javascriptRuntimeReconciliationResultSchema;
function init_javascriptRuntimeReconciliationSchemas() {
	return (init_javascriptRuntimeReconciliationSchemas = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_artifactIdentity();
		init_evidence();
		init_javascriptRuntimeObservation();
		init_javascriptApplicationGraph();
		init_digests();
		init_urlComponents();
		evidenceIdSchema = prefixedDigestSchema("ev");
		nodeIdSchema = prefixedDigestSchema("jag_node");
		boundedTextSchema = z.string().min(1);
		safePrefixSchema = z.string().refine((value) => value === "" || !logicalPathEscapesRoot(value) && value.split("/").every((part) => ![
			"",
			".",
			".."
		].includes(part)), "Artifact prefix must be empty or a safe relative POSIX path");
		runtimeFileMappingSchema = z.strictObject({
			kind: z.literal("file-root"),
			root: z.string().min(1),
			artifact_prefix: safePrefixSchema.default("")
		});
		runtimeUrlMappingSchema = z.strictObject({
			kind: z.literal("url-prefix"),
			prefix: z.string().min(1).refine((value) => normalizeRuntimeUrlPrefix(value) !== null, "Runtime URL prefix must be HTTP(S) without credentials, query, or fragment").overwrite((value) => normalizeRuntimeUrlPrefix(value) ?? value),
			artifact_prefix: safePrefixSchema.default("")
		});
		normalizeRuntimeUrlPrefix = (value) => {
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return null;
			}
			if (!["http:", "https:"].includes(url.protocol) || url.username !== "" || url.password !== "" || urlDeclaresQueryOrFragment(url)) return null;
			if (!url.pathname.endsWith("/")) url.pathname += "/";
			return url.href;
		};
		runtimeLocationMappingSchema = z.discriminatedUnion("kind", [runtimeFileMappingSchema, runtimeUrlMappingSchema]);
		staticLayerSchema = z.strictObject({
			role: z.enum([
				"application",
				"cache",
				"assets"
			]).default("application"),
			analysis: evidenceSchema,
			runtime_mappings: z.array(runtimeLocationMappingSchema).overwrite(normalizeRuntimeMappings).default([])
		});
		reconcileJavaScriptRuntimeInputSchema = z.strictObject({
			static_layers: z.array(staticLayerSchema).min(1),
			runtime_observations: z.array(evidenceSchema).min(1)
		}).superRefine((input, context) => {
			if (input.static_layers.filter(({ role }) => role === "application").length !== 1) context.addIssue({
				code: "custom",
				path: ["static_layers"],
				message: "Exactly one application static layer is required"
			});
			const staticIds = input.static_layers.map(({ analysis }) => analysis.evidence_id);
			if (new Set(staticIds).size !== staticIds.length) context.addIssue({
				code: "custom",
				path: ["static_layers"],
				message: "Static layer Evidence must be unique"
			});
			const runtimeIds = input.runtime_observations.map(({ evidence_id: id }) => id);
			if (new Set(runtimeIds).size !== runtimeIds.length) context.addIssue({
				code: "custom",
				path: ["runtime_observations"],
				message: "Runtime observation Evidence must be unique"
			});
		});
		layerSummarySchema = z.strictObject({
			layer_id: prefixedDigestSchema("jrl"),
			role: z.enum([
				"application",
				"cache",
				"assets"
			]),
			evidence_id: evidenceIdSchema,
			graph_id: prefixedDigestSchema("jag"),
			root_artifact_sha256: digestSchema,
			input_path: z.string().min(1),
			format: z.enum(["asar", "directory"]),
			runtime_mappings: z.array(runtimeLocationMappingSchema)
		});
		captureSummarySchema = z.strictObject({
			evidence_id: evidenceIdSchema,
			capture_sha256: digestSchema,
			kind: z.enum([
				"browser",
				"electron",
				"v8-inspector",
				"electron-active"
			]),
			target_node_id: nodeIdSchema,
			target_key: boundedTextSchema,
			target_location: z.string().min(1).or(javascriptRuntimeUnresolvedLocationSchema),
			frames: z.int().min(0),
			scripts: z.int().min(0),
			workers: z.int().min(0),
			scripts_complete_within_scope: z.boolean()
		});
		reconciliationReasonSchema = z.enum([
			"content-and-location-match",
			"unique-content-match",
			"unique-location-match",
			"ambiguous-static-candidates",
			"captured-content-disagrees-with-static-location",
			"no-static-content-match",
			"no-authorized-location-mapping",
			"runtime-location-unresolved",
			"runtime-frame-unattributed",
			"static-or-runtime-coverage-incomplete",
			"reconciliation-limit-reached"
		]);
		reconciliationItemShape = {
			reconciliation_id: prefixedDigestSchema("jrr_item"),
			entity_kind: z.enum([
				"target",
				"frame",
				"script",
				"worker"
			]),
			runtime_evidence_id: evidenceIdSchema,
			runtime_node_id: nodeIdSchema,
			basis: z.enum([
				"content-and-location",
				"content-sha256",
				"module-source-sha256",
				"artifact-path",
				"operator-file-mapping",
				"operator-url-mapping",
				"none"
			]),
			confidence: z.enum([
				"exact",
				"high",
				"medium",
				"low",
				"unknown"
			]),
			reason: reconciliationReasonSchema,
			candidate_static_count: z.int().min(0),
			candidate_static_nodes: z.array(z.strictObject({
				static_layer_id: prefixedDigestSchema("jrl"),
				static_node_id: nodeIdSchema
			}))
		};
		reconciliationItemSchema = z.union([z.strictObject({
			...reconciliationItemShape,
			static_layer_id: prefixedDigestSchema("jrl"),
			static_node_id: nodeIdSchema,
			status: z.literal("matched")
		}), z.strictObject({
			...reconciliationItemShape,
			static_layer_id: z.null(),
			static_node_id: z.null(),
			status: z.enum([
				"ambiguous",
				"unmatched",
				"unknown"
			])
		})]);
		staticLoadStateSchema = z.strictObject({
			static_layer_id: prefixedDigestSchema("jrl"),
			static_node_id: nodeIdSchema,
			kind: z.enum([
				"javascript-asset",
				"javascript-chunk",
				"javascript-module"
			]),
			status: z.enum([
				"loaded",
				"resident-in-loaded-asset",
				"not-observed-in-capture",
				"unknown"
			]),
			runtime_node_ids: z.array(nodeIdSchema),
			reason: z.enum([
				"runtime-script-correspondence",
				"containing-asset-was-loaded",
				"not-observed-in-bounded-capture",
				"layer-outside-runtime-scope",
				"static-or-runtime-coverage-incomplete",
				"ambiguous-runtime-candidate"
			])
		});
		javascriptRuntimeReconciliationResultSchema = z.strictObject({
			reconciliation_id: prefixedDigestSchema("jrr"),
			static_layers: z.array(layerSummarySchema).min(1),
			runtime_captures: z.array(captureSummarySchema).min(1),
			graph: javascriptApplicationGraphSchema,
			summary: z.strictObject({
				runtime_targets: z.int().min(0),
				runtime_frames: z.int().min(0),
				runtime_scripts: z.int().min(0),
				runtime_workers: z.int().min(0),
				matched: z.int().min(0),
				ambiguous: z.int().min(0),
				unmatched: z.int().min(0),
				unknown: z.int().min(0),
				static_loaded: z.int().min(0),
				static_resident: z.int().min(0),
				static_not_observed: z.int().min(0),
				static_unknown: z.int().min(0)
			}),
			reconciliations: z.array(reconciliationItemSchema),
			static_load_states: z.array(staticLoadStateSchema),
			source_map_authority: z.strictObject({
				used_for_primary_matching: z.literal(false),
				static_layer_count: z.int().min(0),
				runtime_script_declarations: z.int().min(0),
				limitation: boundedTextSchema
			}),
			coverage: z.strictObject({
				status: z.enum([
					"complete-within-inputs",
					"partial",
					"truncated"
				]),
				truncated: z.boolean(),
				omitted_runtime_entities: z.int().min(0),
				omitted_reconciliation_items: z.int().min(0),
				omitted_static_load_states: z.int().min(0),
				omitted_graph_items: z.int().min(0)
			}),
			evidence_links: z.array(evidenceIdSchema).min(2),
			limitations: z.array(boundedTextSchema)
		});
	})))();
}

//#endregion
export { init_javascriptRuntimeReconciliationSchemas, javascriptRuntimeReconciliationResultSchema, reconcileJavaScriptRuntimeInputSchema };