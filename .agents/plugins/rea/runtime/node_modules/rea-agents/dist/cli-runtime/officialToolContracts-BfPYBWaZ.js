import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PROCESS_PROVIDER, artifactGraphDigest, artifactIdForContent, artifactIntegrityPolicySchema, artifactManifestId, canonicalJson, compareUnicodeCodePoints, createEvidence, decompileDirectoryInputSchema, digestCanonicalValue, digestProcessCommitment, digestSchema, dylibResolutionInputSchema, functionDossierSchema, hasStableNativeSymbol, init_artifactIdentity, init_artifactIntegrityPolicy, init_canonicalDigest, init_comparisonSemantics, init_decompileDirectory, init_digests, init_dylibResolution, init_evidence, init_evidenceValidation, init_hopperValues, init_localPath, init_nativeInstruction, init_nativeSymbol, init_nativeValueTrace, init_processCaptureParsing, init_processEvidenceProvider, init_processScenario, init_unicodeCodePointOrder, localPathStringSchema, nativeInstructionInputSchema, nativeSymbolOrigin, nativeValueTraceInputSchema, occurrenceIdForLocation, parseProcessCapture, readEvidence, readEvidencePayload } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { analysisSearchInput, init_analysisSearchContract } from "./analysisView-DxQriOKj.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_jsonValue, init_result, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { dimensionResult, functionComparisonResultSchema, init_functionComparisonResults, init_functionComparisonSchemas, overallStatus, summarize, unresolvedDimension } from "./evidenceBundle-DojUFdme.js";
import { init_machoTargetSelection, init_nativeAddress, init_objcSwiftMetadata, machoTargetSelectionSchema, nativeAddressInputSchema, nativeDispatchMetadataInputSchema, sameMachoTargetSelection } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { FUNCTION_COMPARISON_PROVIDER, analysisDetailSchema, appleAssetCatalogInputSchema, artifactOutputSchemas, bytePatternFields, init_analysisDetail, init_appleAssetCatalog, init_bytePattern, init_comparisonEvidenceIdentity, init_keyedArchive, init_nativeDataType, init_nativeFunctionAnnotations, init_toolEffects, init_toolOutputSchemaGroups, init_toolOutputSchemaPrimitives, keyedArchiveInputSchema, nativeDataTypeInputSchema, nativeFunctionAnnotationsInputSchema, officialOutputSchemas, requireOutputSchema, toolContractMetadata, validateBytePattern } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { assessFunctionCallCoverage, commentProjection, compareProcessCaptureEvidence, functionMatch, identityProjection, init_functionCallCoverage, init_functionComparisonNormalization, init_processComparisonEvidence, nameAndSwiftProjection, normalizeCfg, referencedStringProjection, sorted, swiftLiteralSitesConflict } from "./processComparisonEvidence-Cc08QYCJ.js";
import { init_nativeProcedureInput, nativeProcedureInputSchema } from "./nativeProcedureInput-CePpTxN6.js";
import { z } from "zod";
import { diffLines } from "diff";

//#region dist/contracts/artifactToolContracts.js
var artifactInventoryInputSchema, artifactInspectionInputSchema, artifactExtractionInputSchema, artifactExtractionExecutionSchema, exampleInputSchema$1, examples, artifact, ARTIFACT_TOOL_CONTRACTS, ARTIFACT_ANALYSIS_OPERATIONS;
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
		exampleInputSchema$1 = z.record(z.string(), jsonValueSchema);
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
					input: exampleInputSchema$1.parse(examples[name] ?? {})
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
//#region dist/contracts/unknownContractExamples.js
var UNKNOWN_CONTRACT_EXAMPLES;
function init_unknownContractExamples() {
	return (init_unknownContractExamples = __esmMin((() => {
		UNKNOWN_CONTRACT_EXAMPLES = {
			list_unknowns: {
				offset: 0,
				limit: 50
			},
			record_unknown: {
				question: "Does this branch require an unavailable external service?",
				severity: "medium",
				domain: "protocol",
				required_authority: "controlled-replay",
				required_confidence: "observed",
				required_environment: null,
				recommended_probes: [{
					operation: "capture_process_scenario",
					rationale: "Replay branch."
				}],
				relationships: []
			},
			update_unknown: {
				unknown_id: `unk_${"0".repeat(64)}`,
				expected_revision: 1,
				status: "investigating",
				severity: "medium",
				supporting_evidence_ids: [],
				contradicting_evidence_ids: [],
				required_authority: "controlled-replay",
				required_confidence: "observed",
				required_environment: null,
				recommended_probes: [],
				relationships: [],
				resolution: null
			},
			verify_unknown_resolution: { unknown_id: `unk_${"0".repeat(64)}` }
		};
	})))();
}

//#endregion
//#region dist/contracts/artifactComparisonExample.js
var inventory, provider, ARTIFACT_COMPARISON_EXAMPLE;
function init_artifactComparisonExample() {
	return (init_artifactComparisonExample = __esmMin((() => {
		init_artifactIdentity();
		init_evidence();
		init_jsonValue();
		inventory = (digit) => {
			const sha = digit.repeat(64);
			const artifactId = artifactIdForContent(sha);
			const nodes = [{
				artifact_id: artifactId,
				format: "file",
				sha256: sha,
				size: 1,
				media_type: null,
				architecture: null,
				content_state: "materialized",
				limitations: []
			}];
			const occurrences = [{
				occurrence_id: occurrenceIdForLocation({
					rootArtifactId: artifactId,
					logicalPath: ".",
					entryKind: "file"
				}),
				artifact_id: artifactId,
				parent_occurrence_id: null,
				logical_path: ".",
				entry_kind: "file",
				artifact_kind: "resource",
				artifact_format: "file",
				declared_size: 1,
				compressed_size: null,
				executable: false,
				encrypted: false,
				hash_status: "verified",
				source_location: null,
				limitations: []
			}];
			const edges = [];
			const integrityContradictions = [];
			const graphSha256 = artifactGraphDigest({
				nodes,
				occurrences,
				edges,
				contradictions: integrityContradictions
			});
			return jsonValueSchema.parse({
				manifest: {
					manifest_id: artifactManifestId(artifactId, graphSha256),
					root_artifact_id: artifactId,
					root_sha256: sha,
					root_format: "file",
					graph_sha256: graphSha256,
					node_count: nodes.length,
					occurrence_count: occurrences.length,
					edge_count: edges.length
				},
				nodes,
				occurrences,
				edges,
				provenance: [],
				integrity_contradictions: integrityContradictions,
				coverage: {
					scope: "root",
					status: "complete"
				},
				limitations: []
			});
		};
		provider = {
			id: "rea-artifact",
			name: "REA artifact graph",
			version: "1"
		};
		ARTIFACT_COMPARISON_EXAMPLE = {
			left: createEvidence({
				path: "fixture-left",
				sha256: "0".repeat(64),
				format: "file"
			}, provider, {
				operation: "inventory_artifact",
				parameters: {},
				result: inventory("0"),
				confidence: "observed",
				authority: "shipped-artifact"
			}),
			right: createEvidence({
				path: "fixture-right",
				sha256: "1".repeat(64),
				format: "file"
			}, provider, {
				operation: "inventory_artifact",
				parameters: {},
				result: inventory("1"),
				confidence: "observed",
				authority: "shipped-artifact"
			})
		};
	})))();
}

//#endregion
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
//#region dist/contracts/functionComparisonExample.js
var dossier, observe, FUNCTION_COMPARISON_EXAMPLE;
function init_functionComparisonExample() {
	return (init_functionComparisonExample = __esmMin((() => {
		init_enhancedInputs();
		init_evidence();
		init_jsonValue();
		dossier = (text) => jsonValueSchema.parse({
			procedure: {
				address: "0x1000",
				name: "main",
				symbol: {
					primary: true,
					dynamic: false,
					external: false,
					type: "function",
					source: "imported"
				},
				classification: null,
				body: {
					available: false,
					reason: "The fixture omits function-body extent observations."
				},
				signature: "int main(void)",
				locals: []
			},
			pseudocode: text,
			assembly: ["ret"],
			comments: [],
			callers: [],
			callees: [],
			incoming_references: [],
			outgoing_references: [],
			referenced_strings: [],
			referenced_names: [],
			basic_blocks: [{
				start: "0x1000",
				end: "0x1001",
				successors: []
			}],
			native_api: null,
			native_value_flow: null,
			facet_availability: {
				pseudocode: { available: true },
				assembly: { available: true },
				comments: { available: true },
				callers: { available: true },
				callees: { available: true },
				references: { available: true },
				strings_names: { available: true },
				cfg: { available: true }
			},
			limitations: ["The fixture omits native API and value-flow observations."]
		});
		observe = (digit, text) => createEvidence({
			path: `/tmp/function-${digit}`,
			sha256: digit.repeat(64),
			format: "mach-o"
		}, {
			id: "rea-workflow",
			name: "REA composed investigation workflow",
			version: "1"
		}, {
			operation: "analyze_function",
			parameters: enhancedInputSchemas.analyze_function.parse({ procedure: "main" }),
			result: dossier(text),
			confidence: "derived",
			authority: "shipped-artifact",
			relationshipCoverage: { status: "complete" }
		});
		FUNCTION_COMPARISON_EXAMPLE = {
			left: observe("0", "return 0;"),
			right: observe("1", "return 1;")
		};
	})))();
}

//#endregion
//#region dist/domain/process/processCaptureExample.js
var normalization, scenario, comparisonContract, EMPTY_PROCESS_CAPTURE_EXAMPLE;
function init_processCaptureExample() {
	return (init_processCaptureExample = __esmMin((() => {
		init_processScenario();
		normalization = {
			paths: true,
			pids: true,
			ports: true,
			time_bucket_ms: 10,
			patterns: []
		};
		scenario = { executable_sha256: "0".repeat(64) };
		comparisonContract = {};
		EMPTY_PROCESS_CAPTURE_EXAMPLE = {
			manifest: {
				rea_version: "1.1.0",
				provider_version: "3",
				platform: "fixture",
				architecture: "fixture",
				pty_backend: "node-pty",
				started_at: "2026-01-01T00:00:00.000Z",
				completed_at: "2026-01-01T00:00:00.001Z",
				scenario,
				comparison_contract: comparisonContract,
				full_scenario_sha256: digestProcessCommitment(scenario),
				comparison_contract_sha256: digestProcessCommitment(comparisonContract),
				selected_executable_sha256: "0".repeat(64),
				executable_sha256: "0".repeat(64),
				executable_identity: {
					state: "path_metadata_unchanged",
					reason: null
				},
				normalization_sha256: digestProcessCommitment(normalization)
			},
			normalization,
			frames: [],
			rendered_frames: [],
			interaction_events: [],
			exit: {
				code: 0,
				signal: null,
				reason: "exited"
			},
			settlement: {
				state: "quiesced",
				elapsed_ms: 50,
				cleanup_outcome: "not_required"
			},
			process_samples: [],
			filesystem_checkpoints: [{
				name: "before",
				at_ms: 0,
				files: [],
				effects: [],
				truncated: false
			}, {
				name: "after_settlement",
				at_ms: 50,
				files: [],
				effects: [],
				truncated: false
			}],
			event_journal: [],
			files_before: [],
			files_after: [],
			filesystem_effects: [],
			truncated: false,
			truncation_details: {
				raw_terminal: {
					budget_bytes: 1e6,
					observed_bytes: 0,
					retained_bytes: 0,
					observed_frames: 0,
					retained_frames: 0
				},
				rendered_terminal: {
					budget_bytes: 1e6,
					observed_bytes: 0,
					retained_bytes: 0,
					observed_frames: 0,
					retained_frames: 0
				},
				filesystem_before: {
					files_limit: 1e4,
					depth_limit: 16,
					enumeration_truncated: false,
					enumeration_reasons: [],
					enumeration_omissions: [],
					hash_budget_bytes: 1e7,
					hashed_bytes: 0,
					hash_omissions: []
				},
				filesystem_after: {
					files_limit: 1e4,
					depth_limit: 16,
					enumeration_truncated: false,
					enumeration_reasons: [],
					enumeration_omissions: [],
					hash_budget_bytes: 1e7,
					hashed_bytes: 0,
					hash_omissions: []
				},
				process: {
					sample_limit: 1e3,
					sampling_partial: false,
					retained_samples: 0,
					sample_limit_reached: false,
					sampling_failures: 0,
					first_sampling_failure: null,
					coverage: "sampled"
				}
			},
			limitations: [],
			residual_unknowns: [],
			cleanup: {
				owned_process_group: "verified",
				temporary_root: "removed"
			}
		};
	})))();
}

//#endregion
//#region dist/domain/functionDossierEvidence.js
var parseFunctionEvidence;
function init_functionDossierEvidence() {
	return (init_functionDossierEvidence = __esmMin((() => {
		init_analysisErrorCore();
		init_evidenceValidation();
		init_result();
		init_unicodeCodePointOrder();
		init_hopperValues();
		init_functionCallCoverage();
		parseFunctionEvidence = (input, selection) => {
			const parsed = readEvidence(input);
			if (!parsed.ok) return parsed;
			const evidence = parsed.value;
			const invalidSelection = (message, expected) => err(new AnalysisInputError(selection.operation, { userMessage: message }, [{
				path: selection.path,
				reason: "invalid_value",
				message,
				...expected === undefined ? {} : { expected }
			}]));
			if (evidence.operation !== "analyze_function" || evidence.predicate_type !== "rea.analysis") {
				const location = selection.path.map(String).join(".");
				const subject = location === "" ? "supplied Evidence" : selection.path.length === 1 ? `${location} Evidence` : `Evidence at ${location}`;
				return invalidSelection(`Function analysis requires analyze_function Evidence with the rea.analysis predicate; the ${subject} has operation ${evidence.operation} and predicate ${evidence.predicate_type}.`, {
					operation: "analyze_function",
					predicate_type: "rea.analysis"
				});
			}
			if (evidence.subject === null) return invalidSelection("Function analysis requires artifact-bound Evidence");
			const dossier = readEvidencePayload(functionDossierSchema, evidence.normalized_result);
			if (!dossier.ok) return dossier;
			const callCoverage = assessFunctionCallCoverage(evidence.relationship_coverage, dossier.value);
			return ok({
				evidence,
				subject: evidence.subject,
				dossier: dossier.value,
				limitations: [...new Set([...evidence.limitations, ...dossier.value.limitations])].sort((left, right) => compareUnicodeCodePoints(left, right)),
				callCoverageBlockers: callCoverage.blockers,
				unresolvedCallCaveats: callCoverage.unresolvedCallCaveats,
				callCoverageDiagnostics: callCoverage.diagnostics
			});
		};
	})))();
}

//#endregion
//#region dist/domain/native/functionCoordinateContext.js
var functionCoordinateContextSchema, createFunctionCoordinateContext, functionCoordinateContextsEqual;
function init_functionCoordinateContext() {
	return (init_functionCoordinateContext = __esmMin((() => {
		init_canonicalDigest();
		init_digests();
		init_machoTargetSelection();
		functionCoordinateContextSchema = z.strictObject({
			kind: z.literal("native-function-coordinate-context-v1"),
			selected_image: machoTargetSelectionSchema.nullable(),
			mapping_sha256: digestSchema
		});
		createFunctionCoordinateContext = (mapping, selectedImage = null) => functionCoordinateContextSchema.parse({
			kind: "native-function-coordinate-context-v1",
			selected_image: selectedImage,
			mapping_sha256: digestCanonicalValue(mapping, "Native function coordinate mapping")
		});
		functionCoordinateContextsEqual = (left, right) => {
			if (left === null || right === null || left.provider.id !== right.provider.id || left.provider.name !== right.provider.name || left.provider.version !== right.provider.version) return false;
			const leftContext = functionCoordinateContextSchema.safeParse(left.parameters.function_coordinate_context);
			const rightContext = functionCoordinateContextSchema.safeParse(right.parameters.function_coordinate_context);
			return leftContext.success && rightContext.success && leftContext.data.mapping_sha256 === rightContext.data.mapping_sha256 && (leftContext.data.selected_image === null ? rightContext.data.selected_image === null : sameMachoTargetSelection(leftContext.data.selected_image, rightContext.data.selected_image ?? undefined));
		};
	})))();
}

//#endregion
//#region dist/domain/functionReferenceCompatibility.js
var ReferenceFlow, groupRows, referenceFactsCompatible;
function init_functionReferenceCompatibility() {
	return (init_functionReferenceCompatibility = __esmMin((() => {
		ReferenceFlow = class {
			edges = [];
			node() {
				this.edges.push([]);
				return this.edges.length - 1;
			}
			connect(from, to, capacity) {
				const forward = this.edges[from];
				const reverse = this.edges[to];
				if (forward === undefined || reverse === undefined) throw new Error("Reference flow endpoint was not allocated.");
				forward.push({
					to,
					reverse: reverse.length,
					remaining: capacity
				});
				reverse.push({
					to: from,
					reverse: forward.length - 1,
					remaining: 0
				});
			}
			covers(source, sink, required) {
				let delivered = 0;
				while (delivered < required) {
					const levels = Array(this.edges.length).fill(-1);
					const queue = [source];
					levels[source] = 0;
					for (let index = 0; index < queue.length; index++) {
						const node = queue[index];
						if (node === undefined) break;
						for (const edge of this.edges[node] ?? []) {
							if (edge.remaining <= 0 || levels[edge.to] !== -1) continue;
							levels[edge.to] = (levels[node] ?? -1) + 1;
							queue.push(edge.to);
						}
					}
					if (levels[sink] === -1) return false;
					const next = Array(this.edges.length).fill(0);
					let amount;
					while (delivered < required && (amount = this.augment(source, sink, required - delivered, levels, next)) > 0) delivered += amount;
				}
				return true;
			}
			augment(source, sink, capacity, levels, next) {
				const nodes = [source];
				const path = [];
				const capacities = [capacity];
				while (nodes.length > 0) {
					const node = nodes[nodes.length - 1];
					if (node === undefined) break;
					if (node === sink) {
						const amount = capacities[capacities.length - 1] ?? 0;
						for (const edge of path) {
							edge.remaining -= amount;
							const reverse = this.edges[edge.to]?.[edge.reverse];
							if (reverse === undefined) throw new Error("Reference flow reverse edge was not allocated.");
							reverse.remaining += amount;
						}
						return amount;
					}
					const adjacent = this.edges[node] ?? [];
					let edge = adjacent[next[node] ?? 0];
					while (edge !== undefined && (edge.remaining <= 0 || levels[edge.to] !== (levels[node] ?? -1) + 1)) {
						next[node] = (next[node] ?? 0) + 1;
						edge = adjacent[next[node] ?? 0];
					}
					if (edge === undefined) {
						levels[node] = -1;
						nodes.pop();
						path.pop();
						capacities.pop();
						continue;
					}
					path.push(edge);
					nodes.push(edge.to);
					capacities.push(Math.min(capacities[capacities.length - 1] ?? 0, edge.remaining));
				}
				return 0;
			}
		};
		groupRows = (rows) => {
			const groups = new Map();
			for (const row of rows) {
				const key = JSON.stringify([
					row.direction,
					row.source,
					row.target,
					row.kind
				]);
				const previous = groups.get(key);
				if (previous !== undefined) previous.count += 1;
				else groups.set(key, {
					...row,
					mask: (row.source === null ? 0 : 1) | (row.target === null ? 0 : 2) | (row.kind === null ? 0 : 4),
					count: 1
				});
			}
			return groups;
		};
		referenceFactsCompatible = (left, right) => {
			if (left.length !== right.length) return false;
			if (left.length === 0) return true;
			const leftGroups = groupRows(left);
			const rightGroups = groupRows(right);
			if (leftGroups.size === rightGroups.size && [...leftGroups].every(([key, group]) => rightGroups.get(key)?.count === group.count)) return true;
			if ([...leftGroups.values(), ...rightGroups.values()].every(({ mask }) => mask === 7)) return false;
			let required = left.length;
			for (const [key, group] of leftGroups) {
				if (group.mask !== 7) continue;
				const other = rightGroups.get(key);
				if (other === undefined) continue;
				const cancelled = Math.min(group.count, other.count);
				group.count -= cancelled;
				other.count -= cancelled;
				required -= cancelled;
				if (group.count === 0) leftGroups.delete(key);
				if (other.count === 0) rightGroups.delete(key);
			}
			const leftMasks = new Set([...leftGroups.values()].map(({ mask }) => mask));
			const rightMasks = new Set([...rightGroups.values()].map(({ mask }) => mask));
			const flow = new ReferenceFlow();
			const source = flow.node();
			const sink = flow.node();
			const buckets = new Map();
			const bucket = (group, leftMask, rightMask) => {
				const intersection = leftMask & rightMask;
				const key = JSON.stringify([
					group.direction,
					leftMask,
					rightMask,
					intersection & 1 ? group.source : null,
					intersection & 2 ? group.target : null,
					intersection & 4 ? group.kind : null
				]);
				const existing = buckets.get(key);
				if (existing !== undefined) return existing;
				const node = flow.node();
				buckets.set(key, node);
				return node;
			};
			for (const group of leftGroups.values()) {
				const node = flow.node();
				flow.connect(source, node, group.count);
				for (const mask of rightMasks) flow.connect(node, bucket(group, group.mask, mask), group.count);
			}
			for (const group of rightGroups.values()) {
				const node = flow.node();
				flow.connect(node, sink, group.count);
				for (const mask of leftMasks) flow.connect(bucket(group, mask, group.mask), node, group.count);
			}
			return flow.covers(source, sink, required);
		};
	})))();
}

//#endregion
//#region dist/domain/functionRelationshipComparison.js
var ambiguousProcedureNames, endpoint, project, endpointKey, constraints, compareFunctionRelationships, compareRelationshipFacts;
function init_functionRelationshipComparison() {
	return (init_functionRelationshipComparison = __esmMin((() => {
		init_functionCoordinateContext();
		init_comparisonSemantics();
		init_functionComparisonNormalization();
		init_nativeSymbol();
		init_functionReferenceCompatibility();
		init_nativeAddress();
		ambiguousProcedureNames = (snapshots) => {
			const ambiguous = new Set();
			for (const snapshot of snapshots) {
				const entries = new Map();
				const observe = (procedure) => {
					if (procedure === null) return;
					const address = nativeAddressInputSchema.safeParse(procedure.address);
					if (!address.success) {
						ambiguous.add(procedure.name);
						return;
					}
					const previous = entries.get(procedure.name);
					if (previous !== undefined && previous !== address.data) ambiguous.add(procedure.name);
					entries.set(procedure.name, address.data);
				};
				observe(snapshot.dossier.procedure);
				for (const procedure of [...snapshot.dossier.callers, ...snapshot.dossier.callees]) observe(procedure);
				for (const edge of snapshot.dossier.incoming_references) {
					observe(edge.source_procedure);
					observe(edge.target_procedure);
				}
				for (const edge of snapshot.dossier.outgoing_references) {
					observe(edge.source_procedure);
					observe(edge.target_procedure);
				}
			}
			return ambiguous;
		};
		endpoint = (procedure, address, coordinateContext, ambiguousNames) => {
			if (coordinateContext === "common") {
				const parsed = nativeAddressInputSchema.safeParse(address);
				if (parsed.success) return {
					kind: "address",
					address: parsed.data
				};
				return {
					kind: "unknown",
					reason: "unparsed_address",
					reported_address: address,
					reported_name: procedure?.name ?? null
				};
			}
			if (coordinateContext === "unknown") return {
				kind: "unknown",
				reason: "coordinate_context",
				reported_address: address,
				reported_name: procedure?.name ?? null
			};
			if (procedure === null || !hasStableNativeSymbol(procedure.name, procedure.symbol)) return {
				kind: "unknown",
				reason: procedure === null || procedure.name.length === 0 ? "missing_name" : nativeSymbolOrigin(procedure.symbol) === "generated" ? "generated_name" : "symbol_origin",
				reported_address: address,
				reported_name: procedure?.name ?? null
			};
			return {
				kind: "name",
				name: procedure.name,
				ambiguous: ambiguousNames.has(procedure.name)
			};
		};
		project = (snapshot, coordinateContext, ambiguousNames, dimension) => {
			const facts = [];
			if (dimension === "calls") {
				for (const [direction, procedures] of [["in", snapshot.dossier.callers], ["out", snapshot.dossier.callees]]) for (const procedure of procedures) facts.push({
					direction,
					source: null,
					target: endpoint(procedure, procedure.address, coordinateContext, ambiguousNames),
					kind: null
				});
				return facts;
			}
			const collect = (references, direction) => {
				for (const edge of references) {
					let kind = null;
					if (edge.kind.available) {
						const { available: _available, provenance: _provenance, ...known } = edge.kind;
						kind = known;
					}
					facts.push({
						direction,
						source: endpoint(edge.source_procedure, edge.source_address, coordinateContext, ambiguousNames),
						target: endpoint(edge.target_procedure, edge.target_address, coordinateContext, ambiguousNames),
						kind
					});
				}
			};
			collect(snapshot.dossier.incoming_references, "in");
			collect(snapshot.dossier.outgoing_references, "out");
			return facts;
		};
		endpointKey = (value) => {
			if (value === null || value.kind === "unknown") return null;
			return canonicalJson(value.kind === "address" ? { address: value.address } : { name: value.name });
		};
		constraints = (facts) => facts.map((fact) => ({
			direction: fact.direction,
			source: endpointKey(fact.source),
			target: endpointKey(fact.target),
			kind: fact.kind === null ? null : canonicalJson(fact.kind)
		}));
		compareFunctionRelationships = (left, right) => {
			const sameArtifact = left.subject.digest.sha256 === right.subject.digest.sha256;
			const coordinateContext = !sameArtifact ? "cross-artifact" : left.subject.format === right.subject.format && left.subject.architecture !== null && left.subject.architecture === right.subject.architecture && functionCoordinateContextsEqual(left.evidence.analysis_profile, right.evidence.analysis_profile) ? "common" : "unknown";
			const ambiguousNames = ambiguousProcedureNames([left, right]);
			const compare = (dimension) => compareRelationshipFacts(project(left, coordinateContext, ambiguousNames, dimension), project(right, coordinateContext, ambiguousNames, dimension), dimension, coordinateContext);
			return {
				calls: compare("calls"),
				references: compare("references")
			};
		};
		compareRelationshipFacts = (leftFacts, rightFacts, dimension, coordinateContext) => {
			let unknownIdentity = false;
			let ambiguousIdentity = false;
			let unknownKinds = false;
			for (const facts of [leftFacts, rightFacts]) {
				for (const fact of facts) {
					unknownKinds ||= dimension === "references" && fact.kind === null;
					for (const value of [fact.source, fact.target]) {
						unknownIdentity ||= value !== null && value.kind === "unknown";
						ambiguousIdentity ||= value !== null && value.kind === "name" && value.ambiguous;
					}
				}
			}
			const limitations = [];
			if (unknownIdentity && coordinateContext !== "unknown") limitations.push(coordinateContext === "common" ? "Relationship endpoint coordinates could not be parsed, so their identity remains unknown." : "Unnamed relationship endpoints, generated symbols and unknown symbol origins have no stable identity outside a common executable coordinate context.");
			if (coordinateContext === "unknown" && (unknownIdentity || ambiguousIdentity)) limitations.push("A common executable coordinate context is not established: artifact format, known architecture and provider coordinate commitments must agree.");
			if (ambiguousIdentity) limitations.push("A relationship name cannot establish a unique comparable procedure entry, so matching names do not establish equal endpoints.");
			if (unknownKinds) limitations.push("At least one provider did not expose reference kinds, so compatible endpoints do not prove equal edge semantics.");
			const context = {
				leftCount: leftFacts.length,
				rightCount: rightFacts.length,
				limitations
			};
			if (!referenceFactsCompatible(constraints(leftFacts), constraints(rightFacts))) return {
				...context,
				status: "changed",
				left: sorted(leftFacts),
				right: sorted(rightFacts),
				limitations: ["Known relationship facts cannot be paired without contradicting an endpoint or reference kind.", ...limitations]
			};
			if (unknownIdentity || ambiguousIdentity || unknownKinds) return {
				...context,
				status: "unknown"
			};
			return {
				...context,
				status: "unchanged",
				left: sorted(leftFacts),
				right: sorted(rightFacts)
			};
		};
	})))();
}

//#endregion
//#region dist/domain/functionComparisonDimensions.js
var compareDimensions, facetLimitations, compareText, compareComments, compareStringsAndNames, stringsAndNamesResult, compareReferencedStrings, compareRepeatedStringRows, groupStringsByContent, sameMultiset, groupStringsByOffset, swiftLiteralCoverage, compareReferences, compareIdentity, compareCalls, compareCfg, compareValues;
function init_functionComparisonDimensions() {
	return (init_functionComparisonDimensions = __esmMin((() => {
		init_nativeSymbol();
		init_comparisonSemantics();
		init_functionRelationshipComparison();
		init_functionComparisonNormalization();
		init_functionComparisonResults();
		compareDimensions = (left, right, context) => {
			const relationships = compareFunctionRelationships(left, right);
			return [
				compareIdentity(left, right, context),
				compareText("pseudocode", left.dossier.pseudocode, right.dossier.pseudocode, context),
				compareText("assembly", left.dossier.assembly.join("\n"), right.dossier.assembly.join("\n"), context),
				compareComments(left, right, context),
				compareCalls(left, right, relationships.calls, context),
				compareReferences(relationships.references, context),
				compareStringsAndNames(left, right, context),
				compareCfg(left, right, context)
			].map((result) => {
				const limitations = [...facetLimitations(left, result.dimension).map((reason) => `Left: ${reason}`), ...facetLimitations(right, result.dimension).map((reason) => `Right: ${reason}`)];
				return limitations.length === 0 ? result : unresolvedDimension({
					dimension: result.dimension,
					links: context.links,
					leftCount: null,
					rightCount: null,
					limitations: [...result.limitations, ...limitations]
				});
			});
		};
		facetLimitations = (snapshot, dimension) => {
			const { dossier } = snapshot;
			const fields = {
				identity: [],
				pseudocode: [["pseudocode", dossier.pseudocode.length]],
				assembly: [["assembly", dossier.assembly.length]],
				comments: [["comments", dossier.comments.length]],
				calls: [["callers", dossier.callers.length], ["callees", dossier.callees.length]],
				references: [["references", dossier.incoming_references.length + dossier.outgoing_references.length]],
				strings_names: [["strings_names", dossier.referenced_strings.length + dossier.referenced_names.length]],
				cfg: [["cfg", dossier.basic_blocks.length]]
			};
			return fields[dimension].flatMap(([field, count]) => {
				const availability = dossier.facet_availability?.[field];
				if (availability?.available === false) return [`${field}: ${availability.reason}`];
				return availability === undefined && count === 0 ? [`${field}: Provider did not declare coverage for this empty facet.`] : [];
			});
		};
		compareText = (dimension, left, right, context) => {
			const limitations = ["Exact provider text is compared without address or generated-name normalization; layout-only differences do not establish a behavior change.", ...dimension === "assembly" ? ["Assembly is opaque provider text; relocation normalization is unavailable."] : []];
			if (context.providersDiffer) return unresolvedDimension({
				dimension,
				links: context.links,
				leftCount: [...left].length,
				rightCount: [...right].length,
				limitations: [...limitations, "Exact text comparison requires one provider identity."]
			});
			const changes = diffLines(left, right, {
				timeout: 100,
				maxEditLength: 1e4
			});
			if (changes === undefined) return unresolvedDimension({
				dimension,
				links: context.links,
				leftCount: [...left].length,
				rightCount: [...right].length,
				limitations: [...limitations, "Bounded line diff exceeded its time or edit-distance limit."]
			});
			const delta = changes.reduce((summary, change) => ({
				added_lines: summary.added_lines + (change.added ? change.count ?? 0 : 0),
				removed_lines: summary.removed_lines + (change.removed ? change.count ?? 0 : 0),
				hunks: summary.hunks + (change.added || change.removed ? 1 : 0)
			}), {
				added_lines: 0,
				removed_lines: 0,
				hunks: 0
			});
			return dimensionResult({
				dimension,
				status: delta.hunks === 0 ? "unchanged" : "changed",
				left,
				right,
				...context,
				leftCount: [...left].length,
				rightCount: [...right].length,
				textDelta: delta,
				limitations
			});
		};
		compareComments = (left, right, context) => {
			const leftValues = commentProjection(left);
			const rightValues = commentProjection(right);
			if (leftValues === null || rightValues === null) return unresolvedDimension({
				dimension: "comments",
				links: context.links,
				leftCount: left.dossier.comments.length,
				rightCount: right.dossier.comments.length,
				limitations: ["Comment locations could not be normalized relative to the function."]
			});
			return compareValues("comments", leftValues, rightValues, context);
		};
		compareStringsAndNames = (left, right, context) => {
			const complete = swiftLiteralCoverage(left) === swiftLiteralCoverage(right) && swiftLiteralCoverage(left) !== "partial";
			const leftStrings = referencedStringProjection(left);
			const rightStrings = referencedStringProjection(right);
			const stringFacts = compareReferencedStrings(leftStrings, rightStrings);
			const leftNamesAndLiterals = nameAndSwiftProjection(left, complete);
			const rightNamesAndLiterals = nameAndSwiftProjection(right, complete);
			if (stringFacts.changed) return stringsAndNamesResult({
				leftStrings,
				rightStrings,
				leftNamesAndLiterals,
				rightNamesAndLiterals,
				context,
				status: "changed",
				limitations: [
					...stringFacts.limitations,
					...leftNamesAndLiterals === null || rightNamesAndLiterals === null ? ["Reference source locations could not be normalized to function offsets."] : [],
					...complete ? [] : ["Swift String literal coverage differs or is partial; complete coverage does not establish a differing literal."]
				]
			});
			if (leftNamesAndLiterals === null || rightNamesAndLiterals === null) return unresolvedDimension({
				dimension: "strings_names",
				links: context.links,
				leftCount: null,
				rightCount: null,
				limitations: ["Reference source locations could not be normalized to function offsets."]
			});
			const compared = compareValues("strings_names", leftNamesAndLiterals, rightNamesAndLiterals, context);
			if (compared.status === "changed") return stringsAndNamesResult({
				leftStrings,
				rightStrings,
				leftNamesAndLiterals,
				rightNamesAndLiterals,
				context,
				status: "changed",
				limitations: stringFacts.limitations
			});
			if (swiftLiteralSitesConflict(left, right)) {
				const leftAll = nameAndSwiftProjection(left);
				const rightAll = nameAndSwiftProjection(right);
				if (leftAll !== null && rightAll !== null) {
					const literalComparison = compareValues("strings_names", leftAll, rightAll, context);
					if (literalComparison.status === "changed") return stringsAndNamesResult({
						leftStrings,
						rightStrings,
						leftNamesAndLiterals: leftAll,
						rightNamesAndLiterals: rightAll,
						context,
						status: "changed",
						limitations: stringFacts.limitations
					});
				}
			}
			const limitations = [...stringFacts.limitations, ...complete ? [] : ["Swift String literal coverage differs or is partial; complete coverage does not establish a differing literal."]];
			if (limitations.length === 0) return stringsAndNamesResult({
				leftStrings,
				rightStrings,
				leftNamesAndLiterals,
				rightNamesAndLiterals,
				context,
				status: "unchanged"
			});
			return unresolvedDimension({
				dimension: "strings_names",
				links: context.links,
				leftCount: null,
				rightCount: null,
				limitations
			});
		};
		stringsAndNamesResult = ({ leftStrings, rightStrings, leftNamesAndLiterals, rightNamesAndLiterals, context, status, limitations = [] }) => dimensionResult({
			dimension: "strings_names",
			status,
			left: {
				referenced_strings: leftStrings,
				names_and_literals: leftNamesAndLiterals
			},
			right: {
				referenced_strings: rightStrings,
				names_and_literals: rightNamesAndLiterals
			},
			...context,
			leftCount: leftStrings.length + (leftNamesAndLiterals?.length ?? 0),
			rightCount: rightStrings.length + (rightNamesAndLiterals?.length ?? 0),
			textDelta: null,
			limitations
		});
		compareReferencedStrings = (left, right) => {
			const leftGroups = groupStringsByOffset(left);
			const rightGroups = groupStringsByOffset(right);
			const leftUnlocated = leftGroups.get(null) !== undefined;
			const rightUnlocated = rightGroups.get(null) !== undefined;
			const limitations = new Set([...left, ...right].flatMap(({ decoding_reason }) => decoding_reason === null ? [] : [`Referenced string decoding unavailable: ${decoding_reason}`]));
			let changed = false;
			for (const offset of new Set([...leftGroups.keys(), ...rightGroups.keys()])) {
				const leftRows = leftGroups.get(offset);
				const rightRows = rightGroups.get(offset);
				if (offset === null) {
					limitations.add("Referenced string source location could not be normalized.");
					continue;
				}
				if (leftRows === undefined || rightRows === undefined) {
					if (leftUnlocated || rightUnlocated) limitations.add(`Referenced string membership at source offset ${offset} is ambiguous because another source location is unavailable.`);
					else changed = true;
					continue;
				}
				if (leftRows.length !== 1 || rightRows.length !== 1) {
					const repeated = compareRepeatedStringRows(leftRows, rightRows);
					if (repeated !== null) {
						changed ||= repeated.changed;
						for (const limitation of repeated.limitations) limitations.add(limitation);
						continue;
					}
					limitations.add(`Multiple referenced strings at source offset ${offset} cannot be paired without ambiguity.`);
					continue;
				}
				const leftRow = leftRows[0];
				const rightRow = rightRows[0];
				if (leftRow === undefined || rightRow === undefined) continue;
				if (leftRow.content !== null && rightRow.content !== null && leftRow.content !== rightRow.content) changed = true;
				if (leftRow.metadata !== null && rightRow.metadata !== null && (leftRow.metadata.encoding !== rightRow.metadata.encoding || leftRow.metadata.termination !== rightRow.metadata.termination || leftRow.metadata.byte_length !== rightRow.metadata.byte_length)) changed = true;
				if (leftRow.metadata === null !== (rightRow.metadata === null)) limitations.add(`Typed string metadata is unavailable at source offset ${offset}.`);
				if (leftRow.content === null || rightRow.content === null) {
					if (leftRow.content !== null || rightRow.content !== null) limitations.add(`Referenced string content is unavailable on one side at source offset ${offset}.`);
				}
			}
			return {
				changed,
				limitations: [...limitations]
			};
		};
		compareRepeatedStringRows = (left, right) => {
			if (left.some(({ content }) => content === null) || right.some(({ content }) => content === null)) return null;
			const leftByContent = groupStringsByContent(left);
			const rightByContent = groupStringsByContent(right);
			let changed = !sameMultiset(left.flatMap(({ content }) => content === null ? [] : [content]), right.flatMap(({ content }) => content === null ? [] : [content]));
			const limitations = new Set();
			for (const content of new Set([...leftByContent.keys(), ...rightByContent.keys()])) {
				const leftRows = leftByContent.get(content) ?? [];
				const rightRows = rightByContent.get(content) ?? [];
				if (leftRows.length !== rightRows.length) continue;
				const leftMetadata = leftRows.map(({ metadata }) => metadata);
				const rightMetadata = rightRows.map(({ metadata }) => metadata);
				if (leftMetadata.every((metadata) => metadata === null) && rightMetadata.every((metadata) => metadata === null)) continue;
				if (leftMetadata.some((metadata) => metadata === null) || rightMetadata.some((metadata) => metadata === null)) {
					limitations.add("Typed string metadata is unavailable for repeated content at a source offset.");
					continue;
				}
				changed ||= !sameMultiset(leftMetadata.map((metadata) => JSON.stringify(metadata)), rightMetadata.map((metadata) => JSON.stringify(metadata)));
			}
			return {
				changed,
				limitations: [...limitations]
			};
		};
		groupStringsByContent = (strings) => {
			const groups = new Map();
			for (const string of strings) {
				if (string.content === null) continue;
				const rows = groups.get(string.content);
				if (rows === undefined) groups.set(string.content, [string]);
				else rows.push(string);
			}
			return groups;
		};
		sameMultiset = (left, right) => {
			const leftValues = [...left].sort();
			const rightValues = [...right].sort();
			return leftValues.length === rightValues.length && leftValues.every((value, index) => value === rightValues[index]);
		};
		groupStringsByOffset = (strings) => {
			const groups = new Map();
			for (const string of strings) {
				const rows = groups.get(string.source_offset);
				if (rows === undefined) groups.set(string.source_offset, [string]);
				else rows.push(string);
			}
			return groups;
		};
		swiftLiteralCoverage = (snapshot) => (snapshot.dossier.swift_string_literal_omissions ?? []).length > 0 ? "partial" : snapshot.dossier.swift_string_literals === undefined ? "absent" : "complete";
		compareReferences = (compared, context) => {
			if (compared.status === "unknown") return unresolvedDimension({
				dimension: "references",
				links: context.links,
				leftCount: compared.leftCount,
				rightCount: compared.rightCount,
				limitations: compared.limitations
			});
			return dimensionResult({
				dimension: "references",
				...compared,
				...context,
				textDelta: null
			});
		};
		compareIdentity = (left, right, context) => {
			if (!hasStableNativeSymbol(left.dossier.procedure.name, left.dossier.procedure.symbol) || !hasStableNativeSymbol(right.dossier.procedure.name, right.dossier.procedure.symbol)) return unresolvedDimension({
				dimension: "identity",
				links: context.links,
				leftCount: null,
				rightCount: null,
				limitations: ["Empty names, generated symbols and unknown symbol origins do not establish cross-version identity."]
			});
			return compareValues("identity", identityProjection(left), identityProjection(right), context);
		};
		compareCalls = (left, right, comparison, context) => {
			const coverageLimitations = [...left.callCoverageBlockers.map((reason) => `Left: ${reason}`), ...right.callCoverageBlockers.map((reason) => `Right: ${reason}`)];
			const coverageDiagnostics = [...left.callCoverageDiagnostics.map((reason) => `Left: ${reason}`), ...right.callCoverageDiagnostics.map((reason) => `Right: ${reason}`)];
			if (coverageLimitations.length > 0) return unresolvedDimension({
				dimension: "calls",
				links: context.links,
				leftCount: comparison.leftCount,
				rightCount: comparison.rightCount,
				limitations: [...coverageLimitations, ...coverageDiagnostics]
			});
			if (comparison.status === "unknown") return unresolvedDimension({
				dimension: "calls",
				links: context.links,
				leftCount: comparison.leftCount,
				rightCount: comparison.rightCount,
				limitations: [...comparison.limitations, ...coverageDiagnostics]
			});
			return dimensionResult({
				dimension: "calls",
				...comparison,
				...context,
				textDelta: null,
				limitations: [...comparison.limitations, ...coverageDiagnostics]
			});
		};
		compareCfg = (left, right, context) => {
			const leftBlocks = left.dossier.basic_blocks;
			const rightBlocks = right.dossier.basic_blocks;
			const leftGraph = normalizeCfg(leftBlocks);
			const rightGraph = normalizeCfg(rightBlocks);
			if (leftGraph === null || rightGraph === null) return unresolvedDimension({
				dimension: "cfg",
				links: context.links,
				leftCount: leftBlocks.length,
				rightCount: rightBlocks.length,
				limitations: ["CFG addresses could not be normalized to local block indices."]
			});
			return compareValues("cfg", leftGraph, rightGraph, context);
		};
		compareValues = (dimension, left, right, context, limitations = []) => {
			const leftJson = canonicalJson(left, "Function comparison");
			const rightJson = canonicalJson(right, "Function comparison");
			return dimensionResult({
				dimension,
				status: leftJson === rightJson ? "unchanged" : "changed",
				left,
				right,
				...context,
				leftCount: Array.isArray(left) ? left.length : null,
				rightCount: Array.isArray(right) ? right.length : null,
				textDelta: null,
				limitations
			});
		};
	})))();
}

//#endregion
//#region dist/domain/functionComparison.js
var compareFunctions;
function init_functionComparison() {
	return (init_functionComparison = __esmMin((() => {
		init_comparisonSemantics();
		init_unicodeCodePointOrder();
		init_functionComparisonNormalization();
		init_functionComparisonSchemas();
		init_functionComparisonResults();
		init_functionComparisonDimensions();
		compareFunctions = (left, right) => {
			const links = [left.evidence.evidence_id, right.evidence.evidence_id];
			const providersDiffer = canonicalJson(left.evidence.provider, "Function comparison") !== canonicalJson(right.evidence.provider, "Function comparison");
			const dimensions = compareDimensions(left, right, {
				links,
				providersDiffer
			});
			const match = functionMatch(left, right);
			const changes = dimensions.filter(({ status }) => status !== "unchanged");
			return functionComparisonResultSchema.parse({
				status: overallStatus(dimensions, match.status),
				function_match: match,
				left_subject_sha256: left.subject.digest.sha256,
				right_subject_sha256: right.subject.digest.sha256,
				summary: summarize(dimensions),
				dimensions,
				changes,
				limitations: [...new Set([
					...left.limitations.map((item) => `Left: ${item}`),
					...right.limitations.map((item) => `Right: ${item}`),
					...providersDiffer ? ["Provider-specific pseudocode and assembly representations were not equated."] : []
				])].sort((a, b) => compareUnicodeCodePoints(a, b))
			});
		};
	})))();
}

//#endregion
//#region dist/contracts/investigationExamples.js
var left, right, comparison, FUNCTION_COMPARISON_EVIDENCE, capture, captureEvidence, PROCESS_CAPTURE_REFERENCE, PROCESS_CAPTURE_RECONSTRUCTION, PROCESS_COMPARISON_EVIDENCE, INVESTIGATION_EXAMPLES;
function init_investigationExamples() {
	return (init_investigationExamples = __esmMin((() => {
		init_evidence();
		init_comparisonEvidenceIdentity();
		init_processComparisonEvidence();
		init_processEvidenceProvider();
		init_processCaptureParsing();
		init_functionComparisonExample();
		init_processCaptureExample();
		init_functionDossierEvidence();
		init_functionComparison();
		left = parseFunctionEvidence(FUNCTION_COMPARISON_EXAMPLE.left, {
			operation: "compare_functions",
			path: ["left"]
		});
		if (!left.ok) throw left.error;
		right = parseFunctionEvidence(FUNCTION_COMPARISON_EXAMPLE.right, {
			operation: "compare_functions",
			path: ["right"]
		});
		if (!right.ok) throw right.error;
		comparison = compareFunctions(left.value, right.value);
		FUNCTION_COMPARISON_EVIDENCE = createEvidence(undefined, FUNCTION_COMPARISON_PROVIDER, {
			predicateType: "rea.function-comparison",
			operation: "compare_functions",
			parameters: {
				left_evidence_id: left.value.evidence.evidence_id,
				right_evidence_id: right.value.evidence.evidence_id
			},
			result: comparison,
			confidence: "derived",
			authority: "analyst-inference",
			limitations: comparison.limitations,
			evidenceLinks: [left.value.evidence.evidence_id, right.value.evidence.evidence_id]
		});
		capture = parseProcessCapture(EMPTY_PROCESS_CAPTURE_EXAMPLE);
		captureEvidence = (scenario) => createEvidence(undefined, PROCESS_PROVIDER, {
			predicateType: "rea.process-capture",
			operation: "capture_process_scenario",
			parameters: { scenario },
			result: capture,
			confidence: "observed",
			authority: "controlled-replay",
			environment: {
				id: "fixture-linux",
				platform: "linux",
				architecture: "x86_64",
				isolation: "container"
			}
		});
		PROCESS_CAPTURE_REFERENCE = captureEvidence("reference");
		PROCESS_CAPTURE_RECONSTRUCTION = captureEvidence("reconstruction");
		PROCESS_COMPARISON_EVIDENCE = compareProcessCaptureEvidence({
			record: PROCESS_CAPTURE_REFERENCE,
			capture
		}, {
			record: PROCESS_CAPTURE_RECONSTRUCTION,
			capture
		}).evidence;
		INVESTIGATION_EXAMPLES = {
			compare_process_captures: { input: {
				left: PROCESS_CAPTURE_REFERENCE,
				right: PROCESS_CAPTURE_RECONSTRUCTION
			} },
			find_changed_behavior: { comparisons: [FUNCTION_COMPARISON_EVIDENCE] },
			build_call_path: {
				functions: [FUNCTION_COMPARISON_EXAMPLE.left],
				start: { address: "0x1000" },
				goal: { address: "0x1000" }
			},
			correlate_static_and_runtime: {
				static_comparisons: [FUNCTION_COMPARISON_EVIDENCE],
				runtime_comparisons: [PROCESS_COMPARISON_EVIDENCE],
				mappings: [{
					static: {
						comparison_evidence_id: FUNCTION_COMPARISON_EVIDENCE.evidence_id,
						selector: {
							kind: "function",
							dimension: "pseudocode"
						}
					},
					runtime: {
						comparison_evidence_id: PROCESS_COMPARISON_EVIDENCE.evidence_id,
						dimension: "terminal"
					},
					side_alignment: "left_to_left",
					hypothesis: {
						statement: "Static implementation changed without terminal change.",
						expected_pattern: "static_only"
					}
				}]
			},
			verify_reconstruction: { specification: {
				name: "Terminal compatibility",
				claims: [{
					kind: "behavioral",
					claim_id: "terminal-output",
					title: "Terminal output remains equivalent",
					comparison_evidence_id: PROCESS_COMPARISON_EVIDENCE.evidence_id,
					dimension: "terminal"
				}]
			} }
		};
	})))();
}

//#endregion
//#region dist/contracts/toolContractExamples.js
var TOOL_EXAMPLE_OVERRIDES;
function init_toolContractExamples() {
	return (init_toolContractExamples = __esmMin((() => {
		init_unknownContractExamples();
		init_artifactComparisonExample();
		init_functionComparisonExample();
		init_investigationExamples();
		TOOL_EXAMPLE_OVERRIDES = {
			...UNKNOWN_CONTRACT_EXAMPLES,
			...INVESTIGATION_EXAMPLES,
			inspect_byte_entropy: { path: "/artifacts/firmware.bin" },
			goto_address: { address: "0x1000" },
			procedure_address: { procedure: "main" },
			procedure_assembly: { procedure: "main" },
			procedure_callees: { procedure: "main" },
			procedure_callers: { procedure: "main" },
			procedure_info: { procedure: "main" },
			trace_native_values: { procedure: "0x1000" },
			inspect_native_data_type: { type: "/MyStruct" },
			inspect_native_instruction: { address: "0x1000" },
			resolve_native_call_targets: { address: "0x1000" },
			read_function_instructions: { procedure: "main" },
			read_bytes: {
				address: "0x1000",
				length: 16
			},
			search_bytes: { pattern: "48 8B ?? ?? 89" },
			address_to_file_offset: { address: "0x1000" },
			procedure_references: { procedure: "main" },
			procedure_pseudo_code: { procedure: "main" },
			resolve_containing_procedure: { address: "0x1000" },
			search_procedures: { pattern: "main" },
			search_strings: { pattern: "authorization failed" },
			set_address_name: {
				address: "0x1000",
				name: "entry"
			},
			set_addresses_names: { names: { "0x1000": "entry" } },
			set_bookmark: { address: "0x1000" },
			set_comment: {
				address: "0x1000",
				comment: "validated entry point"
			},
			set_inline_comment: {
				address: "0x1000",
				comment: "calls parser"
			},
			unset_bookmark: { address: "0x1000" },
			get_call_graph: { address: "0x1000" },
			find_xrefs_to_name: { name: "malloc" },
			analyze_function: { procedure: "main" },
			annotate_native_function: {
				procedure: "0x10100",
				name: "entry",
				comment: "Analyst observation"
			},
			analyze_swift_types: {
				category: "classes",
				pattern: "Account"
			},
			inspect_native_api: { procedure: "main" },
			trace_feature: { query: "license" },
			trace_call_path: {
				start: "0x1000",
				goal: "0x1100"
			},
			trace_native_ui_action: { action: "buildTapped:" },
			decompile_all: { output_directory: "/tmp/decompile-out" },
			open_binary: { path: "/tmp/fixture" },
			open_bundle_resources: { path: "/tmp/Fixture.app" },
			export_evidence_bundle: { path: "/tmp/evidence.json" },
			get_evidence_bundle: {
				detail: "summary",
				filters: {
					operation: "analyze_function",
					procedure_address: "0x1000"
				}
			},
			inspect_address_context: { address: "0x1000" },
			import_evidence_bundle: { path: "/tmp/evidence.json" },
			capture_process_scenario: {
				executable: "/usr/bin/true",
				working_directory: "/tmp",
				timeout_ms: 3e4,
				finalization_ms: 1500
			},
			compare_process_captures: {
				left: PROCESS_CAPTURE_REFERENCE,
				right: PROCESS_CAPTURE_RECONSTRUCTION
			},
			compare_artifacts: {
				left: ARTIFACT_COMPARISON_EXAMPLE.left,
				right: ARTIFACT_COMPARISON_EXAMPLE.right
			},
			match_native_functions: {
				left: {
					kind: "retained-evidence",
					evidence_id: `ev_${"1".repeat(64)}`
				},
				right: {
					kind: "retained-evidence",
					evidence_id: `ev_${"2".repeat(64)}`
				}
			},
			compare_functions: {
				left: FUNCTION_COMPARISON_EXAMPLE.left,
				right: FUNCTION_COMPARISON_EXAMPLE.right
			},
			compare_bundles: {
				left_bundle_path: "/tmp/left-evidence.json",
				right_bundle_path: "/tmp/right-evidence.json"
			},
			inspect_with_objdump: {
				path: "/tmp/program",
				operation: "disassemble"
			},
			execute_rizin_command: {
				path: "/tmp/program",
				command: "iI"
			},
			list_frida_devices: {},
			list_frida_processes: { device_id: "local" },
			start_frida_session: {
				mode: "attach",
				device_id: "local",
				pid: 1234
			},
			load_frida_script: {
				session_id: "00000000-0000-4000-8000-000000000001",
				source_kind: "inline",
				source: "send(Process.id);"
			},
			resume_frida_session: { session_id: "00000000-0000-4000-8000-000000000001" },
			unload_frida_script: {
				session_id: "00000000-0000-4000-8000-000000000001",
				script_id: "00000000-0000-4000-8000-000000000002"
			},
			frida_session_status: { session_id: "00000000-0000-4000-8000-000000000001" },
			close_frida_session: { session_id: "00000000-0000-4000-8000-000000000001" },
			instrument_with_frida: {
				mode: "attach",
				device_id: "local",
				pid: 1234,
				source_kind: "inline",
				source: "send(Process.id);",
				duration_ms: 1e3
			}
		};
	})))();
}

//#endregion
//#region dist/contracts/toolContractHelpers.js
var document, address, optionalAddress, procedure, exampleInputSchema, examplesFor;
function init_toolContractHelpers() {
	return (init_toolContractHelpers = __esmMin((() => {
		init_jsonValue();
		init_toolContractExamples();
		document = z.string().optional().describe("The active target's provider document name; use open_binary to switch targets");
		address = z.string().describe("A provider-normalized address; default memory uses 0x-prefixed hexadecimal");
		optionalAddress = address.optional();
		procedure = z.string().describe("The procedure name or address");
		exampleInputSchema = z.record(z.string(), jsonValueSchema);
		examplesFor = (name, inputSchema) => {
			const parsed = inputSchema.parse(TOOL_EXAMPLE_OVERRIDES[name] ?? {});
			return [{
				title: `Example ${name.replaceAll("_", " ")} request`,
				input: exampleInputSchema.parse(parsed)
			}];
		};
	})))();
}

//#endregion
//#region dist/contracts/functionInstructionContract.js
var functionInstructionInputSchema;
function init_functionInstructionContract() {
	return (init_functionInstructionContract = __esmMin((() => {
		functionInstructionInputSchema = z.object({
			procedure: z.string().describe("The procedure name or address"),
			document: z.string().optional().describe("The document name")
		});
	})))();
}

//#endregion
//#region dist/contracts/hopperMemoryContracts.js
var HOPPER_MEMORY_TOOL_DEFINITIONS;
function init_hopperMemoryContracts() {
	return (init_hopperMemoryContracts = __esmMin((() => {
		init_toolContractHelpers();
		init_bytePattern();
		HOPPER_MEMORY_TOOL_DEFINITIONS = [
			{
				name: "search_bytes",
				description: "Find masked byte signatures in initialized analyzed memory. Hex byte pairs and ?? wildcards are supported; an optional equal-length hex mask selects bits. Bounds are inclusive. Matches are ordered by provider address and never span blocks. Coverage describes this page; reuse the same query with next_cursor to continue. Uninitialized blocks are listed separately. Ghidra only; Hopper is unavailable.",
				inputSchema: z.strictObject({
					...bytePatternFields,
					document,
					start: address.optional(),
					end: address.optional(),
					limit: z.int().min(1).max(1e3).default(100),
					cursor: z.string().min(1).optional()
				}).superRefine(validateBytePattern)
			},
			{
				name: "read_bytes",
				description: "Read analyzed bytes from one provider-normalized virtual address. The hexadecimal payload reports the exact returned length; incomplete reads remain explicit and unsupported provider APIs return typed capability unavailability.",
				inputSchema: z.object({
					address,
					length: z.int().min(1).default(256),
					document
				})
			},
			{
				name: "address_to_file_offset",
				description: "Map one provider-normalized virtual address to its original nonnegative file offset. Hopper verifies the original bytes against the selected executable digest and translates FAT image-relative offsets using the loaded header. Results preserve the provider coordinate, image base, and source path. Unmapped addresses fail explicitly; changed or unavailable sources return typed errors retaining native mapping facts as partial evidence.",
				inputSchema: z.object({
					address,
					document
				})
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/officialToolContracts.js
var hopperRegexDeadline, official, OFFICIAL_TOOL_CONTRACTS;
function init_officialToolContracts() {
	return (init_officialToolContracts = __esmMin((() => {
		init_analysisDetail();
		init_nativeFunctionAnnotations();
		init_toolOutputSchemaGroups();
		init_toolOutputSchemaPrimitives();
		init_toolContractHelpers();
		init_toolEffects();
		init_nativeDataType();
		init_nativeInstruction();
		init_functionInstructionContract();
		init_hopperMemoryContracts();
		init_analysisSearchContract();
		hopperRegexDeadline = "Hopper regex mode uses ECMAScript Unicode syntax in a cancellable worker. The matching deadline is REA_REGEX_MATCHING_DEADLINE_MS (a positive decimal integer of milliseconds from 1 to 2147483647, default 5000). Unset keeps the default. A deadline failure names the effective milliseconds, source (default or setting), the default, and the maximum, and leaves the API usable. The worker old-generation request is REA_REGEX_WORKER_HEAP_REQUEST_MIB (a decimal integer of mebibytes from 7 to 16384, default 128). Unset keeps the default. A positive Node --max-old-space-size, including NODE_OPTIONS, overrides that request and is not limited by the setting's floor or maximum. A heap failure names the effective request, its source (default or setting), the default, the floor, and the maximum.";
		official = (name, description, inputSchema) => {
			const strictInputSchema = inputSchema.strict();
			return {
				name,
				...toolContractMetadata(name),
				description,
				kind: "official-proxy",
				requiresActiveTarget: true,
				inputSchema: strictInputSchema,
				outputSchema: requireOutputSchema(officialOutputSchemas, name),
				examples: examplesFor(name, strictInputSchema)
			};
		};
		OFFICIAL_TOOL_CONTRACTS = [
			official("annotate_native_function", "Atomically update one function name and/or entry comments, read them back, and return a refreshed complete function dossier. Ghidra changes its ephemeral session analysis database only; original executable bytes remain unchanged. Empty comment text clears that comment. Edits remain available to subsequent MCP calls until close; CLI returns the updated dossier before discarding its session. Invalid edits roll back the entire operation. Windows P0 and providers without this capability are unsupported.", nativeFunctionAnnotationsInputSchema),
			official("inspect_native_load_image", "Verify the provider's loaded DOS MZ or explicitly selected COM image against its immutable target snapshot: complete original/modified source-byte digests, header/module file mappings and memory digests, relocations and external entry. Returns measured observations and independent checks with mismatch coordinates. COM verification includes its imposed entry register context and does not claim PSP/runtime coverage. Overlay and uninitialized coverage remain explicit; other formats return unsupported. Does not execute or modify the target.", z.strictObject({})),
			official("inspect_native_data_type", "Inspect one recovered type by exact database category path or defined typed data address. Returns observed size, alignment, packing, fields, bitfields, enum values, and child type identities; source-level authority and flexible-tail semantics remain unknown unless substantiated.", nativeDataTypeInputSchema),
			official("inspect_native_instruction", "Inspect one exact code or data address: decoded bytes, mnemonic, ordered operand tokens, flow, outgoing instruction references and typed incoming references where available. Incoming references preserve source, access kind, operand index and analysis provenance even at data addresses; they do not prove runtime access. Memory addressing decomposition is unavailable when the provider supplies only tokens. Data, interior instruction addresses and undecodable bytes are distinct outcomes.", nativeInstructionInputSchema),
			official("resolve_native_call_targets", "Resolve one explicit static call site using typed provider call references. Preserves ambiguous targets as candidates and unresolved computed calls as unknown; does not execute code or traverse a call graph.", nativeInstructionInputSchema),
			official("address_name", "Resolve the primary analyzed name at a code or data address. Headless providers require an explicit address; GUI providers may default to their current cursor. Null means the provider has no primary name at that address.", z.object({
				document,
				address: optionalAddress
			})),
			official("comment", "Read the regular analysis comment at an address, defaulting to the current cursor. This is read-only and returns null when no comment exists; use set_comment to persist a finding.", z.object({
				document,
				address: optionalAddress
			})),
			official("current_address", "Return Hopper's current cursor address for the selected document. Use only for interactive navigation state; prefer explicit addresses in reproducible investigations.", z.object({ document })),
			official("current_procedure", "Return the analyzed procedure containing Hopper's current cursor. This uses GUI cursor state and is not a procedure-name lookup.", z.object({ document })),
			official("current_document", "Return the document currently selected by REA's Hopper bridge.", z.object({})),
			official("goto_address", "Move Hopper's GUI cursor to a mapped address and return the observed cursor address. Interior coordinates snap to the containing analyzed object's start. Unmapped destinations fail without moving the cursor. This changes navigation state but not analysis data; use explicit-address tools for headless workflows.", z.object({
				address,
				document
			})),
			official("inline_comment", "Read the inline instruction comment at an address, defaulting to the current cursor. Returns null when absent; use set_inline_comment to write one.", z.object({
				document,
				address: optionalAddress
			})),
			official("list_bookmarks", "List every bookmark in the selected Hopper document as address and name pairs; unnamed bookmarks retain a null name. Use bookmarks as analyst-authored navigation aids; this does not discover code references.", z.object({ document })),
			official("list_documents", "List provider program or document identities. Hopper may expose several documents; a Ghidra headless session contains exactly its one imported Program.", z.object({})),
			official("list_names", "List every analyzed memory and external symbol as address/value pairs. Provider metadata distinguishes Ghidra primary, dynamic, external, type, and source facts when available. Select detail summary for counts and retained native-inventory pages; complete remains the default.", z.object({
				document,
				address: optionalAddress,
				detail: analysisDetailSchema
			})),
			official("list_procedures", "List every analyzed procedure as address/value pairs after provider analysis. Ghidra metadata distinguishes thunks and external functions; use returned addresses in later function operations. Select detail summary for counts and retained native-inventory pages; complete remains the default.", z.object({
				document,
				detail: analysisDetailSchema
			})),
			official("list_segments", "List segments or memory blocks using exclusive end addresses. Ghidra reports block permissions, address space, image base, initialization, and overlay facts; Hopper marks unavailable permissions explicitly.", z.object({ document })),
			official("list_strings", "List every provider-reported string object or candidate, or filter to one address, as address/value pairs with encoding, terminator status, and byte length when available. Hopper reads complete typed objects and retains its original display text as provider_value; long literals may span adjacent unterminated objects. Kuna scans mapped printable sequences of at least five characters, including unterminated fragments; references are not computed. Select detail summary for counts and retained native-inventory pages; complete remains the default.", z.object({
				document,
				address: optionalAddress,
				detail: analysisDetailSchema
			})),
			official("next_address", "Return the next analyzed object address after an explicit address or current cursor. This is a navigation primitive, not instruction-flow or CFG analysis.", z.object({
				document,
				address: optionalAddress
			})),
			official("prev_address", "Return the previous analyzed object start before an explicit address or current cursor. This is a navigation primitive and may fail at document boundaries; data objects and instructions remain distinct from control flow.", z.object({
				document,
				address: optionalAddress
			})),
			official("procedure_address", "Resolve an unambiguous procedure symbol name or provider-normalized address to its canonical entry address. External address spaces remain explicit.", z.object({
				procedure,
				document
			})),
			official("procedure_assembly", "Return assembly for one analyzed procedure identified by symbol or hexadecimal address. Use when pseudocode loses calling-convention or instruction-level detail; output is currently returned as one unpaginated string. Ghidra terminal-call assumptions that may cut the analyzed body are reported in Evidence limitations.", z.object({
				procedure,
				document
			})),
			official("procedure_callees", "Return the provider's resolved direct callees for one procedure identified by symbol or address. Unresolved indirect calls may be absent; use analyze_function and typed references to preserve available edge uncertainty. Ghidra terminal-call assumptions that may cut the analyzed body are reported in Evidence limitations.", z.object({
				procedure,
				document
			})),
			official("procedure_callers", "Return the provider's resolved direct callers for one procedure identified by symbol or address. Results reflect completed static analysis and may omit unresolved indirect references. Ghidra terminal-call assumptions that may cut the analyzed body are reported in Evidence limitations.", z.object({
				procedure,
				document
			})),
			official("procedure_info", "Return provider metadata for one procedure identified by symbol or address: entrypoint, signature, locals, size, block count, and complete inclusive body ranges when observed. Extents reflect the provider's analyzed body; Ghidra terminal-call assumptions that may cut it are reported in Evidence limitations. Hopper locals preserve observed names and signed stack displacements; source types remain unknown. Body byte count and enclosing span remain distinct; unavailable extent is explicit.", z.object({
				procedure,
				document
			})),
			official("read_function_instructions", "Return every raw instruction for one analyzed procedure. Instruction text and body extent are provider-specific. Ghidra terminal-call assumptions that may cut the analyzed body are reported in limitations.", functionInstructionInputSchema),
			...HOPPER_MEMORY_TOOL_DEFINITIONS.map(({ name, description, inputSchema }) => official(name, description, inputSchema)),
			official("procedure_references", "Return every raw incoming or outgoing reference edge for one procedure. Endpoint procedures are resolved only from provider containment. Ghidra preserves detailed reference flags. Hopper preserves native CallReference classifications and exact endpoints while leaving unavailable detailed flags explicit.", z.object({
				procedure,
				direction: z.enum(["incoming", "outgoing"]).default("outgoing"),
				document
			})),
			official("procedure_pseudo_code", "Decompile one analyzed procedure by symbol name or provider-normalized address. Ghidra also accepts file-offset:0x... selectors and falls back to a unique source-file mapping when a 0x-prefixed number resolves to no procedure; existing analysis addresses take precedence and ambiguous mappings fail explicitly. Returns provider-specific pseudocode, never original source or cross-provider text equivalence, and may return null; request procedure_assembly when instruction precision matters. Ghidra no-return assumptions may cut the analyzed body; Evidence limitations report observed terminal calls and available callee identities.", z.object({
				procedure,
				document
			})),
			official("resolve_containing_procedure", "Resolve an arbitrary address, including an interior instruction or exact external entry, to its provider-analyzed containing procedure. A negative result distinguishes outside segments from not in a procedure and is never guessed from nearby symbols.", z.object({
				address,
				document
			})),
			official("search_procedures", `Search every analyzed procedure name using literal matching by default or regex when requested. Results are deterministic and complete. ${hopperRegexDeadline} Select detail summary for counts and retained native-inventory pages; complete remains the default.`, z.object({
				...analysisSearchInput,
				detail: analysisDetailSchema
			})),
			official("search_strings", `Search every provider-reported string object or candidate using literal matching by default or regex when requested. Results are deterministic and complete over that provider inventory, not every text sequence in artifact bytes. Kuna scans mapped sequences of at least five characters, including unterminated fragments, without computing references. Ghidra may omit packed or undefined literals, including Rust strings; an empty result does not prove text is absent. If an address is known, read_bytes and xrefs inspect its bytes and references. Hopper retains typed byte decoding, native display, and explicit decoding unknowns. Adjacent long-literal fragments match independently. ${hopperRegexDeadline} Select detail summary for counts and retained native-inventory pages; complete remains the default.`, z.object({
				...analysisSearchInput,
				detail: analysisDetailSchema
			})),
			official("set_address_name", "Assign an analyst name to one mapped hexadecimal address and report whether the native edit succeeded and exact readback matched. Hopper rejects symbol names exceeding 1024 UTF-16 code units before mutation, and rejects names owned by another address; use set_addresses_names to explicitly move or swap labels among selected addresses. This mutates analysis metadata.", z.object({
				address,
				name: z.string(),
				document
			})),
			official("set_addresses_names", "Assign analyst names to multiple mapped addresses in one call and return per-address edit/readback success booleans. Hopper validates mapped destinations, native string representations, its 1024 UTF-16 code-unit symbol-name limit, and unique destinations/names before applying edits. Existing labels may move or swap only among explicitly selected addresses; unselected label owners remain unchanged. This mutates analysis metadata; verify failures individually.", z.object({
				names: z.record(z.string(), z.string()),
				document
			})),
			official("set_bookmark", "Create or update a bookmark at a mapped hexadecimal address and report readback success. Omit name to preserve an existing name or create an unnamed bookmark; an empty string clears the bookmark name. This mutates navigation metadata; bookmarks are analyst-authored navigation aids, not binary evidence.", z.object({
				address,
				name: z.string().optional(),
				document
			})),
			official("set_comment", "Write a regular analysis comment at a hexadecimal address and return whether readback matched. An empty comment clears it. This mutates the Hopper document; use comments to record evidence IDs or reasoning.", z.object({
				address,
				comment: z.string(),
				document
			})),
			official("set_inline_comment", "Write an inline instruction comment at a hexadecimal address and return whether readback matched. An empty comment clears it; Hopper may flatten newlines, producing false on exact readback. This mutates analysis metadata.", z.object({
				address,
				comment: z.string(),
				document
			})),
			official("unset_bookmark", "Remove the bookmark at a mapped hexadecimal address and return whether it is absent. Hopper also permits removing an existing legacy bookmark outside mapped memory. This mutates navigation metadata and does not alter binary bytes.", z.object({
				address,
				document
			})),
			official("xrefs", "Return analyzed references to a code or data address. Hopper may default to its current cursor; headless providers such as Ghidra require an explicit address. Use to connect strings, globals, selectors, and functions; bare addresses are untyped and indirect references may be incomplete. Use inspect_native_instruction at the target address for typed incoming references where supported.", z.object({
				document,
				address: optionalAddress
			}))
		];
	})))();
}

//#endregion
export { ARTIFACT_ANALYSIS_OPERATIONS, ARTIFACT_TOOL_CONTRACTS, OFFICIAL_TOOL_CONTRACTS, TOOL_EXAMPLE_OVERRIDES, artifactExtractionExecutionSchema, artifactInventoryInputSchema, createFunctionCoordinateContext, enhancedInputSchemas, examplesFor, init_artifactToolContracts, init_enhancedInputs, init_functionCoordinateContext, init_officialToolContracts, init_toolContractExamples, init_toolContractHelpers };