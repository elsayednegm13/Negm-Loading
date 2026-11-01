import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY, DECOMPILE_DIRECTORY_INDEX_NAME, DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES, DECOMPILE_DIRECTORY_JOURNAL_NAME, addressCoordinate, compareUnicodeCodePoints, createEvidence, decompileDirectoryIndexSchema, decompileDirectoryManifestSchema, decompileJournalHeaderSchema, decompileJournalLineSchema, digestSchema, functionDossierSchema, init_addressCoordinate, init_binaryTargetTypes, init_decompileDirectory, init_digests, init_evidence, init_hopperValues, init_jsonValueByteLength, init_localPath, init_nativeApiBoundary, init_nativeCallReference, init_nativeInstruction, init_nativeValueTrace, init_procedureInfo, init_unicodeCodePointOrder, isDecompileFunctionRelativePath, isMachOFormat, isPathWithinRoot, jsonValueByteLength, nativeApiInspectionResultSchema, nativeCallClassificationSchema, nativeCallTargetsSchema, nativeValueTraceInputSchema, nativeValueTraceSchema, parseContainingProcedureResolution, parseDocuments, parseFunctionDossier, parseListCount, parseRelatedAddresses, parseSegments, procedureInfoSchema, projectBinaryOverview, referenceKindSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, AnalysisTimeoutError, err, init_analysisErrorBase, init_analysisErrorCore, init_jsonSerialization, init_jsonValue, init_result, jsonParts, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { OwnedFileHandle, init_OwnedFileHandle } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { OwnedStagedOutput, init_OwnedStagedOutput } from "./OwnedStagedOutput-FV1aUtCU.js";
import { MAX_DISPATCH_METADATA_RECORDS, addressedValueSchema, classifySwiftSymbol, init_interfaceBuilderGraph, init_machoTargetSelection, init_nativeAddress, init_nativeInventory, init_nativeInvestigationGraph, init_objcClassSymbol, init_objcSwiftMetadata, init_swiftSymbolClassification, inspectNativeDispatchMetadata, interfaceBuilderAnalysisSchema, isSwiftMangledSymbolName, joinInterfaceBuilderDispatch, machoTargetSelectionMatchesArchitecture, machoTargetSelectionMatchesFormat, nativeAddressCoordinateInputSchema, nativeDispatchMetadataResultSchema, nativeInventoryRowsSchemas, nativeInvestigationGraphSchema, nativeInvestigationTraceSchema, objcClassSymbol, profileMachoTargetSelection, sameMachoTargetSelection, traceNativeInvestigationGraph } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { createAnalysisExecutionEvidence, init_analysisObservation } from "./analysisObservation-CSd7FVZY.js";
import { hashStableFile, init_StableFileHash, stableFileHashCause } from "./StableFileHash-DxZbYqOI.js";
import { acquireOwnedLease, init_OwnedLease } from "./OwnedLease-Dd2rekJa.js";
import { enhancedInputSchemas, init_enhancedInputs } from "./officialToolContracts-BfPYBWaZ.js";
import { init_nativeProcedureInput, nativeProcedureInputSchema } from "./nativeProcedureInput-CePpTxN6.js";
import { init_ProcedureAddressResolution, init_SourceLimitations, init_XrefsAddressResolution, renderSourceLimitations, resolveProcedureAddress, resolveXrefsName } from "./DirectAnalysis-xZW5Zvty.js";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { chmod, link, lstat, mkdir, mkdtemp, open, realpath, rename, rmdir, unlink } from "node:fs/promises";
import { constants } from "node:fs";

//#region dist/application/CallRelationshipTraversal.js
var CALL_RELATIONSHIP_TRAVERSALS;
function init_CallRelationshipTraversal() {
	return (init_CallRelationshipTraversal = __esmMin((() => {
		CALL_RELATIONSHIP_TRAVERSALS = {
			forward: {
				operation: "procedure_callees",
				relation: "callees"
			},
			backward: {
				operation: "procedure_callers",
				relation: "callers"
			}
		};
	})))();
}

//#endregion
//#region dist/domain/symbolAnalysis.js
var LEGACY_OBJC_CLASS_PREFIX, OBJC_PROTOCOL_MARKER, selectObjcClassCandidates, projectObjcClassCandidates, discoverObjcProtocols, isSwiftSymbolName, categorizeSwiftTypes, swiftAliasesByAddress, uniqueByName, uniqueByAddressAndName, coalesceBoundClassAliases, classNameFromImport, classNameFromDisplayName, toObjcClassEntry, toJsonEntry;
function init_symbolAnalysis() {
	return (init_symbolAnalysis = __esmMin((() => {
		init_objcClassSymbol();
		init_swiftSymbolClassification();
		LEGACY_OBJC_CLASS_PREFIX = "l_OBJC_CLASS_";
		OBJC_PROTOCOL_MARKER = "OBJC_PROTOCOL_$_";
		selectObjcClassCandidates = (names, pattern) => uniqueByAddressAndName(names.filter(({ name, objc_class_label }) => objcClassSymbol(name)?.metaclass === false || objc_class_label === "hopper_legacy_class_object" || name.startsWith(LEGACY_OBJC_CLASS_PREFIX) && name.length > LEGACY_OBJC_CLASS_PREFIX.length && !/^l_OBJC_CLASS_NAME_(?:\.\d+)?$/u.test(name)).filter(({ name }) => pattern.length === 0 || name.includes(pattern)));
		projectObjcClassCandidates = (candidates, bindingScan) => {
			const classes = coalesceBoundClassAliases(candidates, bindingScan.bindings);
			return {
				count: classes.length,
				classes: classes.map(toObjcClassEntry),
				identity_coverage: {
					status: bindingScan.coverage.status,
					reason: bindingScan.coverage.reason
				}
			};
		};
		discoverObjcProtocols = (names) => {
			const protocols = uniqueByName(names.filter(({ name }) => name.includes(OBJC_PROTOCOL_MARKER) || classifySwiftSymbol(name)?.protocolIdentity === true));
			return {
				count: protocols.length,
				protocols: protocols.map(toJsonEntry)
			};
		};
		isSwiftSymbolName = (name) => isSwiftMangledSymbolName(name) || classifySwiftSymbol(name) !== undefined;
		categorizeSwiftTypes = (procedures, filter = {}, symbols = []) => {
			const groups = Object.fromEntries([
				"classes",
				"structs",
				"enums",
				"protocols",
				"extensions",
				"other"
			].map((category) => [category, []]));
			const aliases = swiftAliasesByAddress(symbols);
			const pattern = filter.pattern;
			const seen = new Set();
			const unclassifiedNames = new Set();
			const unclassified = [];
			for (const entry of procedures) {
				if (seen.has(entry.name)) continue;
				const mangledNames = [...new Set([...isSwiftSymbolName(entry.name) ? [entry.name] : [], ...aliases.get(entry.address) ?? []])];
				if (mangledNames.length === 0) continue;
				if (pattern !== undefined && ![entry.name, ...mangledNames].some((name) => name.includes(pattern))) continue;
				const kinds = new Set();
				for (const name of mangledNames) {
					const decoded = classifySwiftSymbol(name)?.category;
					if (decoded !== undefined && decoded !== null) kinds.add(decoded);
				}
				const category = kinds.size === 1 ? [...kinds][0] ?? null : null;
				const item = {
					address: entry.address,
					name: entry.name,
					mangled_names: mangledNames
				};
				if (category === null && !unclassifiedNames.has(entry.name)) {
					unclassifiedNames.add(entry.name);
					unclassified.push({
						...item,
						reason: kinds.size > 1 ? "conflicting_categories" : "category_not_decoded"
					});
				}
				const bucket = category ?? "other";
				if (filter.category === undefined || filter.category === bucket) {
					seen.add(entry.name);
					groups[bucket]?.push(item);
				}
			}
			const categories = Object.fromEntries(Object.entries(groups).map(([category, items]) => [category, {
				count: items.length,
				items
			}]));
			return {
				total: Object.values(groups).reduce((sum, items) => sum + items.length, 0),
				categories,
				unclassified,
				limitations: ["Identification uses Swift mangled procedure names or same-address symbol aliases. Demangled names without retained Swift manglings cannot be identified. Counts deduplicate procedure names, not source declarations.", ...unclassified.length === 0 ? [] : ["Some Swift categories could not be established from the retained manglings. Unclassified observations remain inline regardless of the category filter."]]
			};
		};
		swiftAliasesByAddress = (symbols) => {
			const aliases = new Map();
			for (const { address, name } of symbols) {
				if (!isSwiftSymbolName(name)) continue;
				const existing = aliases.get(address);
				if (existing === undefined) aliases.set(address, [name]);
				else existing.push(name);
			}
			return aliases;
		};
		uniqueByName = (entries) => {
			const seen = new Set();
			return entries.filter(({ name }) => {
				if (seen.has(name)) return false;
				seen.add(name);
				return true;
			});
		};
		uniqueByAddressAndName = (entries) => {
			const seen = new Set();
			return entries.filter(({ address, name }) => {
				const key = JSON.stringify([address, name]);
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		};
		coalesceBoundClassAliases = (candidates, bindings) => {
			const bindingsByAddress = new Map(bindings.map((binding) => [binding.requested_address, binding]));
			const bindingKey = (binding) => JSON.stringify([
				binding.symbol,
				binding.binding_source,
				binding.library_ordinal,
				binding.library,
				binding.weak,
				binding.addend
			]);
			const groupedBindings = new Map();
			for (const binding of bindings) {
				const key = bindingKey(binding);
				const existing = groupedBindings.get(key);
				if (existing === undefined) groupedBindings.set(key, [binding]);
				else existing.push(binding);
			}
			const groupedCandidates = new Map();
			const ordered = [];
			for (const candidate of candidates) {
				const binding = bindingsByAddress.get(candidate.address);
				if (binding === undefined) {
					ordered.push(candidate);
					continue;
				}
				const key = bindingKey(binding);
				let group = groupedCandidates.get(key);
				if (group === undefined) {
					group = [];
					groupedCandidates.set(key, group);
					ordered.push({ group: key });
				}
				group.push(candidate);
			}
			const output = [];
			for (const entry of ordered) {
				if ("group" in entry) {
					const key = entry.group;
					const facts = groupedBindings.get(key) ?? [];
					const group = groupedCandidates.get(key) ?? [];
					const identity = facts[0];
					const canonicalName = identity === undefined ? undefined : classNameFromImport(identity.symbol);
					const representative = (canonicalName === undefined ? undefined : group.find(({ name }) => classNameFromDisplayName(name) === canonicalName)) ?? group[0];
					if (representative === undefined || identity === undefined) continue;
					output.push({
						...representative,
						binding_identity: {
							symbol: identity.symbol,
							binding_source: identity.binding_source,
							library_ordinal: identity.library_ordinal,
							library: identity.library,
							weak: identity.weak,
							addend: identity.addend,
							slot_addresses: [...new Set(facts.map(({ requested_address }) => requested_address))]
						}
					});
				} else {
					const candidate = entry;
					output.push(candidate);
				}
			}
			return output;
		};
		classNameFromImport = (symbol) => {
			const facts = objcClassSymbol(symbol);
			return facts?.metaclass === false ? facts.symbol : undefined;
		};
		classNameFromDisplayName = classNameFromImport;
		toObjcClassEntry = (entry) => ({
			address: entry.address,
			name: entry.name,
			...entry.binding_identity === undefined ? {} : { binding_identity: {
				symbol: entry.binding_identity.symbol,
				binding_source: entry.binding_identity.binding_source,
				library_ordinal: entry.binding_identity.library_ordinal,
				library: entry.binding_identity.library,
				weak: entry.binding_identity.weak,
				addend: entry.binding_identity.addend,
				slot_addresses: [...entry.binding_identity.slot_addresses]
			} }
		});
		toJsonEntry = ({ address, name }) => ({
			address,
			name
		});
	})))();
}

//#endregion
//#region dist/application/native/NativeDispatchMetadataInspection.js
var dispatchNameInventorySchema, NATIVE_DISPATCH_METADATA_SOURCES, inspectNativeDispatch;
function init_NativeDispatchMetadataInspection() {
	return (init_NativeDispatchMetadataInspection = __esmMin((() => {
		init_nativeInventory();
		init_objcSwiftMetadata();
		init_analysisErrorCore();
		init_jsonValue();
		init_result();
		dispatchNameInventorySchema = nativeInventoryRowsSchemas.names.element.strict().array();
		NATIVE_DISPATCH_METADATA_SOURCES = {
			binary: "inspect_native_dispatch_metadata",
			symbols: "list_names"
		};
		inspectNativeDispatch = async (analysis, maxRecords, options = {}) => {
			const { signal, objcClassImportAddresses, objcClassImportAddressesComplete, maxInputBytes } = options;
			const input = {
				max_records: maxRecords,
				...maxInputBytes === undefined ? {} : { max_input_bytes: maxInputBytes },
				...objcClassImportAddresses === undefined ? {} : {
					objc_class_import_addresses: [...objcClassImportAddresses],
					objc_class_import_addresses_complete: objcClassImportAddressesComplete ?? true
				}
			};
			const binaryMetadata = await analysis.execute(NATIVE_DISPATCH_METADATA_SOURCES.binary, input, signal === undefined ? {} : { signal });
			if (binaryMetadata.ok) return ok(jsonValueSchema.parse(nativeDispatchMetadataResultSchema.parse(binaryMetadata.value.result)));
			if (binaryMetadata.error._tag !== "AnalysisCapabilityUnavailableError") return err(binaryMetadata.error);
			const execution = await analysis.execute(NATIVE_DISPATCH_METADATA_SOURCES.symbols, {}, signal === undefined ? {} : { signal });
			if (!execution.ok) return err(execution.error);
			const names = dispatchNameInventorySchema.safeParse(execution.value.result);
			if (!names.success) return err(new AnalysisOutputError(NATIVE_DISPATCH_METADATA_SOURCES.symbols, "provider returned an invalid inventory"));
			const result = inspectNativeDispatchMetadata(names.data.map((entry) => ({
				address: entry.address,
				name: entry.value
			})), maxRecords);
			if (objcClassImportAddresses !== undefined) {
				result.objc_class_import_bindings = [];
				result.objc_class_import_binding_coverage = {
					facet: "objc_class_import_bindings",
					status: "unsupported",
					reason: "Native Mach-O pointer binding inspection is unavailable.",
					examined: 0,
					decoded: 0
				};
			}
			return ok(jsonValueSchema.parse(nativeDispatchMetadataResultSchema.parse({
				target_sha256: execution.value.subject?.sha256 ?? null,
				target_architecture: execution.value.subject?.architecture ?? null,
				provider: execution.value.provider,
				analysis_profile_digest: execution.value.analysisProfile?.digest ?? null,
				result
			})));
		};
	})))();
}

//#endregion
//#region dist/application/native/NativeValueTrace.js
var NODE_PAYLOAD_BYTES, traceNativeValues;
function init_NativeValueTrace() {
	return (init_NativeValueTrace = __esmMin((() => {
		init_hopperValues();
		init_nativeInstruction();
		init_nativeValueTrace();
		init_evidence();
		init_analysisErrorCore();
		init_result();
		init_jsonSerialization();
		init_SourceLimitations();
		NODE_PAYLOAD_BYTES = 8 * 1024 * 1024;
		traceNativeValues = async (analysis, parameters, signal) => {
			const input = nativeValueTraceInputSchema.parse(parameters);
			const nodes = [];
			const edges = [];
			const procedures = [];
			const unknowns = [];
			const sourceLimitations = [];
			const callBindings = [];
			const pending = [{
				procedure: input.procedure,
				depth: 0
			}];
			const attempted = new Set();
			const visited = new Set();
			let targetSha256;
			let truncated = false;
			let decompilations = 0;
			let callSites = 0;
			let bytes = 0;
			let nodeBudgetReached = false;
			const retainNode = (value) => {
				if (nodeBudgetReached) return false;
				if (nodes.length >= input.max_nodes) {
					truncated = true;
					nodeBudgetReached = true;
					return false;
				}
				let size = 0;
				for (const part of jsonParts(value)) {
					size += Buffer.byteLength(part);
					if (size > NODE_PAYLOAD_BYTES - bytes) {
						truncated = true;
						nodeBudgetReached = true;
						return false;
					}
				}
				bytes += size;
				nodes.push(value);
				return true;
			};
			while (pending.length > 0) {
				if (signal?.aborted) return err(new AnalysisCancelledError("trace_native_values", { cause: signal.reason }));
				const next = pending.shift();
				if (next === undefined || attempted.has(next.procedure) || visited.has(next.procedure)) continue;
				if (decompilations >= input.max_functions) {
					truncated = true;
					unknowns.push({
						procedure: next.procedure,
						address: null,
						reason: "decompilation budget reached"
					});
					break;
				}
				attempted.add(next.procedure);
				const execution = await analysis.execute("analyze_function", { procedure: next.procedure }, {
					...signal === undefined ? {} : { signal },
					...next.depth > 0 ? { selectorOrigin: "provider" } : {}
				});
				decompilations++;
				if (!execution.ok) {
					if (next.depth === 0 || execution.error._tag === "AnalysisCancelledError") return err(execution.error);
					unknowns.push({
						procedure: next.procedure,
						address: null,
						reason: execution.error.message
					});
					continue;
				}
				const parsed = functionDossierSchema.safeParse(execution.value.result);
				if (!parsed.success || execution.value.subject == null) return err(new AnalysisOutputError("trace_native_values", "Function dossier lacks validated facts or artifact identity"));
				const dossier = parsed.data;
				const address = dossier.procedure.address;
				if (visited.has(address)) continue;
				visited.add(next.procedure);
				visited.add(address);
				targetSha256 ??= execution.value.subject.sha256;
				if (execution.value.subject.sha256 !== targetSha256) return err(new AnalysisOutputError("trace_native_values", "Cross-function target digest mismatch"));
				const evidence = createEvidence(execution.value.subject, execution.value.provider, {
					operation: "analyze_function",
					parameters: { procedure: next.procedure },
					result: execution.value.result,
					rawResult: execution.value.rawResult,
					limitations: execution.value.limitations,
					locations: execution.value.locations,
					...execution.value.analysisProfile === undefined ? {} : { analysisProfile: execution.value.analysisProfile }
				});
				const evidenceId = evidence.evidence_id;
				procedures.push({
					address,
					depth: next.depth,
					evidence_id: evidenceId,
					provider: execution.value.provider.id,
					analysis_profile_digest: execution.value.analysisProfile?.digest ?? null
				});
				const flow = dossier.native_value_flow;
				if (flow === null || !flow.available) {
					unknowns.push({
						procedure: address,
						address: null,
						reason: flow?.reason ?? "Provider has no native def-use model"
					});
					continue;
				}
				if (flow.truncated) {
					truncated = true;
					unknowns.push({
						procedure: address,
						address: null,
						reason: "Provider p-code was truncated"
					});
				}
				const ids = new Set();
				const operationIds = new Set(flow.operations.map(({ id }) => id));
				const parameterIds = new Map();
				const qualified = (id) => `${address}/${id}`;
				for (const operation of flow.operations) {
					if (operation.block_membership === "detached" || operation.block_membership === "unavailable" && operation.is_dead) continue;
					const node = {
						id: qualified(operation.id),
						procedure: address,
						evidence_id: evidenceId,
						operation,
						kind: "operation",
						parameter: null
					};
					if (!retainNode(node)) break;
					ids.add(operation.id);
				}
				for (const parameter of flow.parameters) {
					const parameterId = `parameter:${parameter.ordinal}`;
					let localId = parameterId;
					for (let suffix = 1; operationIds.has(localId); suffix++) localId = `${parameterId}#${suffix}`;
					const id = qualified(localId);
					if (!retainNode({
						id,
						procedure: address,
						evidence_id: evidenceId,
						kind: "parameter",
						operation: null,
						parameter
					})) break;
					parameterIds.set(parameter.ordinal, id);
				}
				for (const use of flow.parameter_uses) {
					const source = parameterIds.get(use.ordinal);
					if (!ids.has(use.use) || source === undefined) continue;
					if (edges.length >= input.max_edges) {
						truncated = true;
						break;
					}
					edges.push({
						source,
						target: qualified(use.use),
						input_index: use.input_index,
						kind: "parameter-use",
						status: "derived",
						evidence_id: evidenceId
					});
				}
				for (const edge of flow.def_use) {
					if (!ids.has(edge.definition) || !ids.has(edge.use)) continue;
					if (edges.length >= input.max_edges) {
						truncated = true;
						break;
					}
					edges.push({
						source: qualified(edge.definition),
						target: qualified(edge.use),
						input_index: edge.input_index,
						kind: "def-use",
						status: "derived",
						evidence_id: evidenceId
					});
				}
				for (const operation of flow.operations) {
					if (!ids.has(operation.id) || !["CALL", "CALLIND"].includes(operation.opcode)) continue;
					if (callSites >= input.max_call_sites) {
						truncated = true;
						unknowns.push({
							procedure: address,
							address: operation.address,
							reason: "Call-site resolution budget reached"
						});
						break;
					}
					callSites++;
					const resolved = await analysis.execute("resolve_native_call_targets", { address: operation.address }, signal === undefined ? {} : { signal });
					if (!resolved.ok) {
						if (resolved.error._tag === "AnalysisCancelledError") return err(resolved.error);
						unknowns.push({
							procedure: address,
							address: operation.address,
							reason: resolved.error.message
						});
						continue;
					}
					const targets = nativeCallTargetsSchema.safeParse(resolved.value.result);
					if (!targets.success) return err(new AnalysisOutputError("resolve_native_call_targets", "Invalid static call resolution"));
					sourceLimitations.push(...targets.data.limitations.map((limitation) => ({
						provider: resolved.value.provider,
						operation: "resolve_native_call_targets",
						limitation
					})));
					if (targets.data.targets.length === 0) unknowns.push({
						procedure: address,
						address: operation.address,
						reason: `Call target ${targets.data.status}`
					});
					for (const target of targets.data.targets) {
						if (edges.length >= input.max_edges) {
							truncated = true;
							break;
						}
						const destination = target.procedure ?? target.address;
						edges.push({
							source: qualified(operation.id),
							target: destination,
							input_index: null,
							kind: "call",
							status: target.status,
							evidence_id: evidenceId
						});
						if (target.status !== "candidate") callBindings.push({
							caller: address,
							callee: destination,
							call: qualified(operation.id),
							argument_count: Math.max(0, operation.inputs.length - 1),
							output: operation.output !== null,
							evidence_id: evidenceId
						});
						if (next.depth < input.max_depth && target.status !== "candidate") pending.push({
							procedure: destination,
							depth: next.depth + 1
						});
						else if (!visited.has(destination)) {
							truncated = true;
							unknowns.push({
								procedure: address,
								address: operation.address,
								reason: target.status === "candidate" ? "Ambiguous call candidates were not traversed" : "Call depth budget reached"
							});
						}
					}
				}
				if (truncated && (nodeBudgetReached || nodes.length >= input.max_nodes || edges.length >= input.max_edges || bytes >= NODE_PAYLOAD_BYTES)) break;
			}
			if (targetSha256 === undefined) return err(new AnalysisOutputError("trace_native_values", "No seed function could be analyzed"));
			const parametersByProcedure = new Map();
			const returnsByProcedure = new Map();
			for (const node of nodes) {
				if (node.kind === "parameter") {
					const parameters = parametersByProcedure.get(node.procedure) ?? [];
					parameters.push(node);
					parametersByProcedure.set(node.procedure, parameters);
				} else if (node.operation?.opcode === "RETURN" && node.operation.inputs.length > 1) {
					const returns = returnsByProcedure.get(node.procedure) ?? [];
					returns.push(node);
					returnsByProcedure.set(node.procedure, returns);
				}
			}
			for (const binding of callBindings) {
				const parameters = parametersByProcedure.get(binding.callee) ?? [];
				if (parameters.length === 0) unknowns.push({
					procedure: binding.caller,
					address: null,
					reason: `Parameter bindings for ${binding.callee} are unavailable or omitted`
				});
				for (const node of parameters) {
					const ordinal = node.parameter?.ordinal;
					if (ordinal === undefined || ordinal >= binding.argument_count) {
						unknowns.push({
							procedure: binding.caller,
							address: null,
							reason: `Argument ${ordinal ?? "unknown"} for ${binding.callee} was not recovered`
						});
						continue;
					}
					if (edges.length >= input.max_edges) {
						truncated = true;
						break;
					}
					edges.push({
						source: binding.call,
						target: node.id,
						input_index: ordinal + 1,
						kind: "argument-binding",
						status: "derived",
						evidence_id: binding.evidence_id
					});
				}
				if (binding.output) for (const node of returnsByProcedure.get(binding.callee) ?? []) {
					if (edges.length >= input.max_edges) {
						truncated = true;
						break;
					}
					edges.push({
						source: node.id,
						target: binding.call,
						input_index: 1,
						kind: "return-binding",
						status: "derived",
						evidence_id: node.evidence_id
					});
				}
			}
			const page = nodes.slice(input.offset, input.offset + input.limit);
			const pageIds = new Set(page.map(({ id }) => id));
			const result = nativeValueTraceSchema.parse({
				seed: input.procedure,
				target_sha256: targetSha256,
				nodes: page,
				edges: edges.filter(({ source }) => pageIds.has(source)),
				procedures,
				unknowns,
				total_nodes: nodes.length,
				total_edges: edges.length,
				decompilations,
				next_offset: input.offset + page.length < nodes.length ? input.offset + page.length : null,
				truncated: truncated || page.length !== nodes.length,
				limitations: [
					"Static decompiler def-use graphs cover recovered block members; when membership is unavailable they exclude operations marked dead. Logical CALL argument positions bind to recovered HighParam ordinals and RETURN values bind to recovered CALL outputs; these are decompiler-derived dependencies, not original source or runtime observations. Missing parameters, variadic arguments and alias dependencies remain unknown.",
					"LOAD and STORE are memory operations; object fields, persistent state and RNG semantics are not inferred from names or pseudocode.",
					"Traversal caps depth, decompilations, call-site resolutions, nodes, edges and node payloads (8388608 bytes, 8 MiB). This release has no runtime override for the 8388608-byte node-payload allowance. Complete serialized output is bounded to 33554432 bytes (32 MiB) and that output allowance has no runtime override. Pagination reruns analysis and returns edges whose source is on the node page; endpoints outside the page retain stable identities.",
					...renderSourceLimitations(sourceLimitations)
				]
			});
			if (Buffer.byteLength(JSON.stringify(result)) > 32 * 1024 * 1024) return err(new AnalysisOutputError("trace_native_values", "Graph output exceeds 33554432 bytes (32 MiB). This release has no runtime override. Lower max_nodes, max_edges, or the page limit."));
			if (signal?.aborted) return err(new AnalysisCancelledError("trace_native_values", { cause: signal.reason }));
			return ok(result);
		};
	})))();
}

//#endregion
//#region dist/application/native/NativeCallRoutes.js
var NATIVE_CALL_ROUTE_SOURCES, limitationsFrom, referencesSchema, observedCallRoutes, readNativeCallRoutes;
function init_NativeCallRoutes() {
	return (init_NativeCallRoutes = __esmMin((() => {
		init_hopperValues();
		init_analysisErrorCore();
		init_result();
		init_nativeCallReference();
		NATIVE_CALL_ROUTE_SOURCES = {
			references: "procedure_references",
			callees: "procedure_callees"
		};
		limitationsFrom = (operation, provider, limitations) => limitations.map((limitation) => ({
			provider,
			operation,
			limitation
		}));
		referencesSchema = z.object({
			reference_kinds_available: z.boolean(),
			references: z.array(z.object({
				source_address: z.string(),
				target_address: z.string(),
				target_procedure: z.object({ address: z.string() }).nullable(),
				kind: referenceKindSchema,
				call: nativeCallClassificationSchema.exactOptional()
			})),
			unresolved_calls: z.array(z.object({
				address: z.string(),
				reason: z.string()
			}))
		});
		observedCallRoutes = (references, provider) => {
			const calls = references.filter(({ kind, call }) => kind.available ? kind.call : call !== undefined);
			const countBySite = new Map();
			for (const call of calls) {
				const targets = countBySite.get(call.source_address) ?? new Set();
				targets.add(call.target_address);
				countBySite.set(call.source_address, targets);
			}
			return calls.map((call) => ({
				provider,
				address: call.target_procedure?.address ?? call.target_address,
				site: call.source_address,
				...call.call === undefined ? {} : { callReference: {
					...call.call,
					source_address: call.source_address,
					target_address: call.target_address
				} },
				relation: !call.kind.available ? "provider_call" : call.kind.computed || call.kind.indirect ? "indirect_call" : "direct_call",
				resolution: !call.kind.available ? "observed" : (countBySite.get(call.source_address)?.size ?? 0) > 1 ? "ambiguous" : call.kind.computed || call.kind.indirect ? "resolved" : "observed"
			}));
		};
		readNativeCallRoutes = async (analysis, procedure, signal, selectorOrigin) => {
			const options = {
				...signal === undefined ? {} : { signal },
				...selectorOrigin === undefined ? {} : { selectorOrigin }
			};
			const execution = await analysis.execute(NATIVE_CALL_ROUTE_SOURCES.references, {
				procedure,
				direction: "outgoing"
			}, options);
			const routes = [];
			const unknowns = [];
			const limitations = [];
			const finish = (outcome) => ({
				routes,
				unknowns,
				limitations,
				outcome
			});
			if (execution.ok) {
				limitations.push(...limitationsFrom(NATIVE_CALL_ROUTE_SOURCES.references, execution.value.provider, execution.value.limitations));
				const parsed = referencesSchema.safeParse(execution.value.result);
				if (!parsed.success) return finish(err(new AnalysisOutputError(NATIVE_CALL_ROUTE_SOURCES.references, "Invalid typed call references")));
				unknowns.push(...parsed.data.unresolved_calls.map((call) => ({
					...call,
					provider: execution.value.provider
				})));
				const references = parsed.data.references;
				routes.push(...observedCallRoutes(references, execution.value.provider));
				if (references.every(({ kind }) => kind.available) && (parsed.data.reference_kinds_available || references.length > 0)) return finish(ok(undefined));
			} else if (execution.error._tag !== "AnalysisCapabilityUnavailableError") return finish(err(execution.error));
			const callees = await analysis.execute(NATIVE_CALL_ROUTE_SOURCES.callees, { procedure }, options);
			if (!callees.ok) return finish(err(callees.error));
			limitations.push(...limitationsFrom(NATIVE_CALL_ROUTE_SOURCES.callees, callees.value.provider, callees.value.limitations));
			const parsed = parseRelatedAddresses(callees.value.result, "callees");
			if (!parsed.ok) return finish(err(parsed.error));
			const targets = new Set(routes.map(({ address }) => address));
			for (const address of parsed.value) {
				if (targets.has(address)) continue;
				targets.add(address);
				routes.push({
					address,
					site: procedure,
					relation: "provider_call",
					resolution: "inferred",
					provider: callees.value.provider
				});
			}
			return finish(ok(undefined));
		};
	})))();
}

//#endregion
//#region dist/application/native/NativeUiActionTrace.js
var NATIVE_UI_ACTION_OPERATIONS, traceNativeUiAction, emptyGraph, boundUiGraph, resolveUiAction, expandNativeCalls, graphNodeDepths;
function init_NativeUiActionTrace() {
	return (init_NativeUiActionTrace = __esmMin((() => {
		init_interfaceBuilderGraph();
		init_nativeInvestigationGraph();
		init_objcSwiftMetadata();
		init_NativeDispatchMetadataInspection();
		init_jsonValue();
		init_NativeCallRoutes();
		init_SourceLimitations();
		init_result();
		init_analysisErrorCore();
		init_analysisErrorProjection();
		NATIVE_UI_ACTION_OPERATIONS = {
			interfaceBuilder: "decode_interface_builder",
			nativeSeed: "procedure_address"
		};
		traceNativeUiAction = async (analysis, input, signal) => {
			const [uiExecution, metadataExecution] = await Promise.all([analysis.execute(NATIVE_UI_ACTION_OPERATIONS.interfaceBuilder, {
				max_documents: 64,
				max_objects: input.max_nodes,
				max_connections: input.max_edges
			}, signal === undefined ? {} : { signal }), inspectNativeDispatch(analysis, 2e4, { signal })]);
			if (!uiExecution.ok && uiExecution.error._tag === "AnalysisCancelledError") return err(uiExecution.error);
			if (!metadataExecution.ok) return err(metadataExecution.error);
			const metadata = nativeDispatchMetadataResultSchema.parse(metadataExecution.value);
			const targetSha256 = metadata.target_sha256;
			if (targetSha256 === null) return err(new AnalysisOutputError("inspect_native_dispatch_metadata", "Dispatch metadata lacks target identity"));
			let graph = emptyGraph(targetSha256, metadata.provider);
			const coverage = [];
			if (uiExecution.ok) {
				const decoded = interfaceBuilderAnalysisSchema.safeParse(uiExecution.value.result);
				if (!decoded.success) return err(new AnalysisOutputError(NATIVE_UI_ACTION_OPERATIONS.interfaceBuilder, "artifact provider returned an invalid interface graph"));
				if (decoded.data.target_sha256 !== targetSha256) return err(new AnalysisOutputError(NATIVE_UI_ACTION_OPERATIONS.interfaceBuilder, "UI and native provider results refer to different target SHA-256 values"));
				graph = joinInterfaceBuilderDispatch(decoded.data.graph, metadata.result);
				const archiveDecode = decoded.data.graph.coverage.find((facet) => facet.facet === "archive_decode");
				const documentsFound = decoded.data.documents.length > 0;
				coverage.push({
					facet: "interface_builder_archives",
					status: archiveDecode?.status === "partial" || archiveDecode?.status === "complete" || archiveDecode?.status === "unsupported" ? archiveDecode.status : documentsFound ? "complete" : "unsupported",
					reason: archiveDecode?.reason ?? (documentsFound ? null : "no_compiled_interface_builder_archives_found"),
					examined: archiveDecode?.examined ?? decoded.data.documents.length,
					omitted: archiveDecode?.omitted ?? 0
				});
				const bounded = boundUiGraph(graph, input.max_nodes, input.max_edges);
				graph = bounded.graph;
				if (bounded.truncated) coverage.push({
					facet: "interface_builder_graph",
					status: "partial",
					reason: "native_trace_output_bounds_reached",
					examined: decoded.data.graph.nodes.length + decoded.data.graph.edges.length,
					omitted: bounded.omitted
				});
			} else {
				coverage.push({
					facet: "interface_builder_archives",
					status: "unsupported",
					reason: projectAnalysisError(uiExecution.error).message,
					examined: 0,
					omitted: 0
				});
			}
			let selected = resolveUiAction(graph, input.action);
			if (selected.nodeId === null && selected.candidates.length === 0) {
				const native = await analysis.execute(NATIVE_UI_ACTION_OPERATIONS.nativeSeed, { procedure: input.action }, signal === undefined ? {} : { signal });
				if (!native.ok && native.error._tag === "AnalysisCancelledError") return err(native.error);
				if (!native.ok && native.error._tag !== "AnalysisCapabilityUnavailableError") return err(native.error);
				if (native.ok) {
					const address = z.string().safeParse(native.value.result);
					if (!address.success || native.value.subject?.sha256 !== targetSha256) return err(new AnalysisOutputError(NATIVE_UI_ACTION_OPERATIONS.nativeSeed, "Native seed lacks a validated address or matching target identity"));
					const id = `native:function:${address.data}`;
					graph.nodes.push({
						id,
						kind: "function",
						name: input.action,
						location: {
							address: address.data,
							file_offset: null
						},
						attributes: { resolved_by: native.value.provider.id },
						evidence: [{
							kind: "reference",
							description: `Provider resolved the explicit native seed ${input.action}`,
							location: {
								address: address.data,
								file_offset: null
							},
							artifact_path: null,
							artifact_sha256: targetSha256
						}]
					});
					selected = {
						nodeId: id,
						candidates: [],
						reason: null
					};
				}
			}
			if (selected.nodeId === null) {
				coverage.push(...graph.coverage);
				const trace = {
					target_sha256: graph.target_sha256,
					provider: graph.provider,
					start: input.action,
					direction: "forward",
					nodes: selected.candidates,
					edges: [],
					unresolved: [],
					reached_depth: 0,
					truncated: graph.truncated,
					reason: selected.reason,
					coverage,
					limitations: ["The query did not identify one unique authored UI action or native function; no handler path was inferred."]
				};
				return ok(jsonValueSchema.parse(nativeInvestigationTraceSchema.parse(trace)));
			}
			const initial = traceNativeInvestigationGraph(graph, {
				start: selected.nodeId,
				direction: "forward",
				limits: {
					max_depth: input.max_depth,
					max_nodes: input.max_nodes,
					max_edges: input.max_edges
				}
			});
			const expanded = await expandNativeCalls({
				analysis,
				graph,
				initial,
				input,
				targetSha256,
				signal
			});
			if (expanded.error !== undefined) return err(expanded.error);
			coverage.push({
				facet: "static_native_calls",
				status: "partial",
				reason: "typed_direct_and_indirect_references_do_not_cover_all_runtime_dispatch; untyped_provider_callees_remain_inferred",
				examined: expanded.examined,
				omitted: expanded.omitted
			});
			coverage.push({
				facet: "cross_function_value_flow",
				status: "unsupported",
				reason: "call edges identify control-flow candidates but do not recover argument, return, or shared-memory value relationships",
				examined: 0,
				omitted: 0
			});
			const finalGraph = nativeInvestigationGraphSchema.parse({
				...graph,
				nodes: expanded.nodes,
				edges: expanded.edges,
				coverage: [...graph.coverage, ...coverage],
				truncated: graph.truncated || expanded.truncated
			});
			const trace = traceNativeInvestigationGraph(finalGraph, {
				start: selected.nodeId,
				direction: "forward",
				limits: {
					max_depth: input.max_depth,
					max_nodes: input.max_nodes,
					max_edges: input.max_edges
				}
			});
			return ok(jsonValueSchema.parse(nativeInvestigationTraceSchema.parse({
				...trace,
				truncated: trace.truncated || expanded.truncated || graph.truncated,
				reason: expanded.truncated && trace.reason === null ? "native_call_traversal_bound_reached" : graph.truncated && trace.reason === null ? "native_trace_output_bound_reached" : trace.reason,
				limitations: [...trace.limitations, ...renderSourceLimitations(expanded.limitations)]
			})));
		};
		emptyGraph = (targetSha256, provider) => nativeInvestigationGraphSchema.parse({
			target_sha256: targetSha256,
			provider: {
				id: provider.id,
				version: provider.version,
				tool_version: "rea-native-ui-trace/1"
			},
			nodes: [],
			edges: [],
			coverage: [],
			truncated: false
		});
		boundUiGraph = (graph, maxNodes, maxEdges) => {
			const nodes = graph.nodes.slice(0, maxNodes);
			const nodeIds = new Set(nodes.map(({ id }) => id));
			const eligibleEdges = graph.edges.filter((edge) => nodeIds.has(edge.from) && (edge.to === null || nodeIds.has(edge.to)));
			const edges = eligibleEdges.slice(0, maxEdges);
			const omitted = graph.nodes.length - nodes.length + graph.edges.length - edges.length;
			const truncated = omitted > 0;
			return {
				graph: nativeInvestigationGraphSchema.parse({
					...graph,
					nodes,
					edges,
					truncated: graph.truncated || truncated
				}),
				truncated,
				omitted
			};
		};
		resolveUiAction = (graph, query) => {
			const exactId = graph.nodes.find((node) => node.id === query);
			if (exactId?.kind === "action") return {
				nodeId: exactId.id,
				candidates: [],
				reason: null
			};
			const actions = graph.nodes.filter((node) => node.kind === "action" && (node.name === query || node.attributes.selector === query));
			if (actions.length === 1) return {
				nodeId: actions[0]?.id ?? null,
				candidates: [],
				reason: null
			};
			if (actions.length > 1) return {
				nodeId: null,
				candidates: actions,
				reason: "action_selector_matches_multiple_ui_connections"
			};
			const objectMatches = graph.nodes.filter((node) => [
				"control",
				"view",
				"view_controller",
				"scene"
			].includes(node.kind) && (node.id === query || node.attributes.interface_builder_object_id === query));
			const actionIds = new Set(graph.edges.flatMap((edge) => edge.resolution === "observed" && edge.relation === "target_action" && objectMatches.some(({ id }) => edge.from === id) && graph.nodes.some(({ id, kind }) => id === edge.to && kind === "action") ? [edge.to] : []));
			if (actionIds.size === 1) return {
				nodeId: [...actionIds][0] ?? null,
				candidates: [],
				reason: null
			};
			if (actionIds.size > 1) return {
				nodeId: null,
				candidates: graph.nodes.filter(({ id }) => actionIds.has(id)),
				reason: "interface_object_has_multiple_action_connections"
			};
			return {
				nodeId: null,
				candidates: [],
				reason: "ui_action_or_object_not_found"
			};
		};
		expandNativeCalls = async (input) => {
			const nodes = new Map(input.initial.nodes.map((node) => [node.id, node]));
			const edges = new Map([...input.initial.edges, ...input.initial.unresolved].map((edge) => [edge.id, edge]));
			const addressNames = new Map();
			const depthByNode = graphNodeDepths(input.initial.start, input.initial.nodes, input.initial.edges);
			for (const node of nodes.values()) {
				if (node.kind === "function" && node.location?.address !== null) addressNames.set(node.location?.address ?? "", node.name);
			}
			const queue = input.initial.nodes.flatMap((node) => node.kind === "function" && node.location?.address != null ? [{
				node,
				address: node.location.address,
				depth: depthByNode.get(node.id) ?? input.initial.reached_depth
			}] : []);
			const visited = new Set();
			let queueIndex = 0;
			let examined = 0;
			let omitted = 0;
			let truncated = false;
			const sourceLimitations = [];
			while (queueIndex < queue.length) {
				const current = queue[queueIndex++];
				if (current === undefined || visited.has(current.address)) continue;
				visited.add(current.address);
				if (current.depth >= input.input.max_depth) {
					truncated = true;
					omitted += 1;
					continue;
				}
				if (nodes.size >= input.input.max_nodes) {
					truncated = true;
					omitted += queue.length - queueIndex + 1;
					break;
				}
				const execution = await readNativeCallRoutes(input.analysis, current.address, input.signal, "provider");
				examined += 1;
				sourceLimitations.push(...execution.limitations);
				if (!execution.outcome.ok && execution.outcome.error._tag === "AnalysisCancelledError") return { error: execution.outcome.error };
				const unknowns = execution.unknowns;
				for (const [index, unknown] of unknowns.entries()) {
					if (edges.size >= input.input.max_edges) {
						truncated = true;
						omitted += unknowns.length - index;
						break;
					}
					const id = `unknown-dispatch:${current.address}:${unknown.address}`;
					edges.set(id, {
						id,
						from: current.node.id,
						to: null,
						relation: "indirect_call",
						resolution: "unresolved",
						reason: unknown.reason,
						evidence: [{
							kind: "reference",
							provider: unknown.provider,
							description: `${unknown.provider.name} reported an unresolved call: ${unknown.reason}`,
							location: {
								address: unknown.address,
								file_offset: null
							},
							artifact_path: null,
							artifact_sha256: input.targetSha256
						}],
						limitations: []
					});
				}
				for (const [index, route] of execution.routes.entries()) {
					const address = route.address;
					const targetId = `native:function:${address}`;
					const targetOmitted = !nodes.has(targetId) && nodes.size >= input.input.max_nodes;
					const edgeId = `${targetOmitted ? "unknown-node-bound" : "call"}:${current.address}:${route.site}:${address}:${route.relation}`;
					if (!edges.has(edgeId) && edges.size >= input.input.max_edges) {
						truncated = true;
						omitted += execution.routes.length - index;
						break;
					}
					const evidence = edges.get(edgeId)?.evidence ?? [];
					evidence.push({
						kind: "reference",
						provider: route.provider,
						description: `${route.provider.name} reported ${route.relation} from ${current.address} to ${address}`,
						location: {
							address: route.site,
							file_offset: null
						},
						...route.callReference === undefined ? {} : { call_reference: route.callReference },
						artifact_path: null,
						artifact_sha256: input.targetSha256
					});
					if (targetOmitted) {
						truncated = true;
						omitted += 1;
						edges.set(edgeId, {
							id: edgeId,
							from: current.node.id,
							to: null,
							relation: route.relation,
							resolution: "unresolved",
							reason: "native_trace_node_bound_reached",
							evidence,
							limitations: []
						});
						continue;
					}
					if (!nodes.has(targetId)) {
						const name = addressNames.get(address) ?? address;
						const node = {
							id: targetId,
							kind: "function",
							name,
							location: {
								address,
								file_offset: null
							},
							attributes: { resolved_by: route.provider.id },
							evidence
						};
						nodes.set(targetId, node);
						queue.push({
							node,
							address,
							depth: current.depth + 1
						});
					}
					edges.set(edgeId, {
						id: edgeId,
						from: current.node.id,
						to: targetId,
						relation: route.relation,
						resolution: route.resolution,
						evidence,
						limitations: ["A resolved static call edge does not establish runtime reachability."]
					});
				}
				if (!execution.outcome.ok) {
					if (edges.size >= input.input.max_edges) {
						truncated = true;
						omitted += 1;
						continue;
					}
					const id = `unknown-callees:${current.address}`;
					edges.set(id, {
						id,
						from: current.node.id,
						to: null,
						relation: "provider_call",
						resolution: "unresolved",
						reason: projectAnalysisError(execution.outcome.error).message,
						evidence: [],
						limitations: ["The provider could not complete callee enumeration."]
					});
				}
			}
			return {
				nodes: [...nodes.values()],
				edges: [...edges.values()],
				examined,
				omitted,
				truncated,
				limitations: sourceLimitations
			};
		};
		graphNodeDepths = (start, nodes, edges) => {
			const known = new Set(nodes.map(({ id }) => id));
			const depths = new Map([[start, 0]]);
			const queue = [start];
			for (let index = 0; index < queue.length; index += 1) {
				const current = queue[index];
				if (current === undefined) continue;
				const depth = depths.get(current) ?? 0;
				for (const edge of edges) {
					if (edge.resolution === "unresolved" || edge.from !== current || edge.to === null || !known.has(edge.to) || depths.has(edge.to)) continue;
					depths.set(edge.to, depth + 1);
					queue.push(edge.to);
				}
			}
			return depths;
		};
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/exportResources.js
var ExportResources, sameIdentity$1, isMissing;
function init_exportResources() {
	return (init_exportResources = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_ArtifactResourceScope();
		init_decompileDirectory();
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_result();
		init_OwnedFileHandle();
		init_OwnedStagedOutput();
		init_StableFileHash();
		ExportResources = class {
			root;
			identity;
			lease;
			scope;
			#files = new ArtifactResourceScope();
			#cleanup;
			#removeRoot = false;
			#journalIdentity;
			#rootRemoved = false;
			#retained = false;
			#functionsRemoved = false;
			#journalRemoved = false;
			#leaseReleased = false;
			#functionsIdentity;
			constructor(root, identity, lease, scope) {
				this.root = root;
				this.identity = identity;
				this.lease = lease;
				this.scope = scope;
				const resources = this;
				this.#cleanup = AnalysisCleanupLease.forCloseOwner({
					close: async () => {
						await this.#files.retryCleanup();
						if (this.#removeRoot && !this.#rootRemoved) await this.#removeCreatedRoot();
						await this.lease.release();
						this.#leaseReleased = true;
					},
					get cleanupResources() {
						return resources.cleanupResources;
					}
				}, root);
			}
			get cleanupResources() {
				return [
					...this.#files.cleanupResources,
					...this.#removeRoot && !this.#rootRemoved ? [this.root] : [],
					...this.#leaseReleased ? [] : [this.lease.socketPath ?? this.root]
				];
			}
			ownFunctionsDirectory(identity) {
				this.#functionsIdentity = identity;
			}
			ownFile(handle, path, journal = false) {
				const file = new OwnedFileHandle(handle);
				const owner = {
					kind: "lease",
					resource: path,
					lease: { release: async () => {
						if (journal && handle.fd >= 0) this.#journalIdentity = await handle.stat({ bigint: true }).catch(() => undefined);
						await file.close();
					} }
				};
				this.#files.retain(owner);
				return async () => (await this.#files.release(owner)).kind === "released";
			}
			/** Check existing output with bounded memory and the shared file identity owner. */
			async hashFile(path, signal) {
				try {
					const hash = await hashStableFile(path, {
						...signal === undefined ? {} : { signal },
						retainFailedClose: (handle) => this.#files.retain({
							kind: "file-handle",
							resource: path,
							handle
						})
					});
					return hash.sha256;
				} catch (cause) {
					throw stableFileHashCause(cause);
				}
			}
			/** Publish only a verified staged file; failed close or removal stays owned. */
			async publish(bytes, destination, mode) {
				const directory = await mkdtemp(join(this.root, ".decompile-stage-"));
				const staging = await OwnedStagedOutput.create(directory);
				const owner = {
					kind: "staged-output",
					resource: directory,
					output: staging
				};
				this.#files.retain(owner);
				try {
					const path = join(directory, "content");
					const handle = await open(path, "wx", 384);
					staging.setFile(new OwnedFileHandle(handle));
					await handle.writeFile(bytes);
					await handle.sync();
					await staging.closeFile();
					await staging.assertReadyForPublication(path);
					if (mode === "link") await link(path, destination);
					else {
						await rename(path, destination);
						staging.recordPublishedRename();
					}
				} finally {
					const released = await this.#files.release(owner);
					if (released.kind === "failed") throw released.cause;
				}
			}
			/** Keep the lease through all initialization cleanup, including any retry. */
			async failedInitialization(error) {
				this.#removeRoot = true;
				const closed = await this.close();
				return closed.ok ? err(error) : err(analysisErrorWithCleanupFailure(error, closed.error, "decompile_all").bindCleanupDependencies([closed.error]));
			}
			async close() {
				try {
					await this.#cleanup.release();
					return ok(undefined);
				} catch (cause) {
					const error = new AnalysisOutputError("decompile_all", "decompile export cleanup failed", {
						cause,
						cleanup: {
							reason: "Owned export resources could not be released.",
							resources: [this.root]
						}
					});
					error.bindCleanupResourceOwner(this.#cleanup);
					this.#cleanup.bindCleanupError(error);
					if (!this.#retained && this.scope !== undefined) {
						this.#retained = true;
						const cleanup = this.#cleanup;
						this.scope.retain({
							close: () => cleanup.release(),
							get cleanupResources() {
								return cleanup.cleanupResources;
							}
						}, this.root);
					}
					return err(error);
				}
			}
			async #removeCreatedRoot() {
				const root = await lstat(this.root, { bigint: true });
				if (!sameIdentity$1(root, this.identity) || !root.isDirectory() || root.isSymbolicLink()) throw new Error("Export directory identity changed during cleanup");
				if (!this.#journalRemoved) {
					const journal = join(this.root, DECOMPILE_DIRECTORY_JOURNAL_NAME);
					const stat = await lstat(journal, { bigint: true }).catch((cause) => {
						if (isMissing(cause)) return undefined;
						throw cause;
					});
					if (stat !== undefined) {
						if (this.#journalIdentity === undefined || !sameIdentity$1(stat, this.#journalIdentity)) throw new Error("Cannot establish ownership of the journal during cleanup");
						await unlink(journal);
					}
					this.#journalRemoved = true;
				}
				if (!this.#functionsRemoved) {
					const path = join(this.root, "functions");
					const stat = await lstat(path, { bigint: true }).catch((cause) => {
						if (isMissing(cause) && this.#functionsIdentity === undefined) return undefined;
						throw cause;
					});
					if (stat !== undefined) {
						if (this.#functionsIdentity === undefined || !sameIdentity$1(stat, this.#functionsIdentity)) throw new Error("Functions directory identity changed during cleanup");
						await rmdir(path);
					}
					this.#functionsRemoved = true;
				}
				await rmdir(this.root);
				this.#rootRemoved = true;
			}
		};
		sameIdentity$1 = (left, right) => left.dev === right.dev && left.ino === right.ino;
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/inputError.js
var decompileInputError;
function init_inputError() {
	return (init_inputError = __esmMin((() => {
		init_analysisErrorCore();
		decompileInputError = (path, message) => new AnalysisInputError("decompile_all", { userMessage: message }, [{
			path: [path],
			reason: "invalid_value",
			message
		}]);
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/selection.js
var validateDecompileBounds, selectProcedures, parseBound, matches, matchesName, matchesNamespace, matchesAddress, compareProcedures, compareProcedureAddresses;
function init_selection() {
	return (init_selection = __esmMin((() => {
		init_addressCoordinate();
		init_nativeAddress();
		init_result();
		init_unicodeCodePointOrder();
		init_inputError();
		validateDecompileBounds = (input) => {
			const start = parseBound(input.address_start, "address_start");
			if (!start.ok) return start;
			const end = parseBound(input.address_end, "address_end");
			if (!end.ok) return end;
			if (start.value !== null && end.value !== null && start.value.space !== end.value.space) return err(decompileInputError("address_end", "Address bounds must use the same address space."));
			if (start.value !== null && end.value !== null && end.value.offset < start.value.offset) return err(decompileInputError("address_end", "Address end is before address start."));
			return ok({
				start: start.value,
				end: end.value
			});
		};
		selectProcedures = (rows, input, bounds) => {
			const seen = new Set();
			const selected = new Map();
			let collapsedDuplicates = false;
			for (const row of rows) {
				if (seen.has(row.address)) collapsedDuplicates = true;
				seen.add(row.address);
				if (!selected.has(row.address) && matches(row, input, bounds)) selected.set(row.address, row);
			}
			const procedures = [...selected.values()].sort(compareProcedures);
			return {
				procedures,
				excluded: seen.size - procedures.length,
				collapsedDuplicates
			};
		};
		parseBound = (value, path) => {
			if (value === undefined) return ok(null);
			const coordinate = nativeAddressCoordinateInputSchema.safeParse(value);
			return !coordinate.success ? err(decompileInputError(path, "Address bounds must be 0xoffset or space:0xoffset.")) : ok(coordinate.data);
		};
		matches = (procedure, input, bounds) => matchesName(procedure.name, input.name) && matchesNamespace(procedure.name, input.namespace) && matchesAddress(procedure.address, bounds);
		matchesName = (name, filter) => filter === undefined || name !== null && name.includes(filter);
		matchesNamespace = (name, filter) => filter === undefined || name !== null && name.startsWith(filter);
		matchesAddress = (address, bounds) => {
			if (bounds.start === null && bounds.end === null) return true;
			const coordinate = addressCoordinate(address);
			if (coordinate === null) return false;
			if (bounds.start !== null && (coordinate.space !== bounds.start.space || coordinate.offset < bounds.start.offset)) return false;
			return bounds.end === null || coordinate.space === bounds.end.space && coordinate.offset <= bounds.end.offset;
		};
		compareProcedures = (left, right) => {
			const byAddress = compareProcedureAddresses(left.address, right.address);
			if (byAddress !== 0) return byAddress;
			const byName = compareUnicodeCodePoints(left.name ?? "", right.name ?? "");
			return byName === 0 ? compareUnicodeCodePoints(left.address, right.address) : byName;
		};
		compareProcedureAddresses = (left, right) => {
			const a = addressCoordinate(left);
			const b = addressCoordinate(right);
			if (a === null || b === null) {
				if (a === null && b === null) return compareUnicodeCodePoints(left, right);
				return a === null ? 1 : -1;
			}
			const space = compareUnicodeCodePoints(a.space ?? "", b.space ?? "");
			if (space !== 0) return space;
			if (a.offset < b.offset) return -1;
			if (a.offset > b.offset) return 1;
			return 0;
		};
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/exportTree.js
var classifyOutputPath, DecompileExport, openResumedJournal, commitFunctionFile, missingOrRejected, createPrivateDirectory, prepareFunctionsDirectory, seedJournal, NO_FOLLOW, JOURNAL_FLAGS, openJournal, readJournalBytes, readJournal, parseJournal, unknownIdentity, sameIdentity, incompatibleJournal, parseJson, portablePathKey, reservePath, allocateFunctionPath, sanitizeAddress, DECOMPILE_EXPORT_LEASE_DIRECTORY, acquireExportLease, exportLeaseFailure, exportLeaseMessage, hasFileIdentity, writeOwnedIndex, sha256, isFileHandle, isDirectoryStat, isSymlinkStat, isStat, nodeCode;
function init_exportTree() {
	return (init_exportTree = __esmMin((() => {
		init_decompileDirectory();
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_localPath();
		init_result();
		init_OwnedLease();
		init_exportResources();
		init_inputError();
		init_selection();
		classifyOutputPath = async (requested, resume) => {
			const stripped = requested.replace(/\/+$/u, "");
			const name = basename(stripped);
			if (stripped.length === 0 || name === "" || name === "." || name === "..") return err(decompileInputError("output_directory", "The output directory name is invalid."));
			const listed = await lstat(stripped).then((stat) => stat, (cause) => cause);
			if (!isDirectoryStat(listed)) {
				if (resume && nodeCode(listed) === "ENOENT") return err(decompileInputError("output_directory", "Resume requires an existing export directory. Omit resume to start a new export."));
				return missingOrRejected(stripped, listed);
			}
			if (!resume) return err(decompileInputError("output_directory", "Output directory already exists. Pass resume to continue an export that matches this target and analysis profile."));
			const root = await realpath(stripped).catch((cause) => cause);
			return typeof root === "string" ? ok({
				mode: "resume",
				root
			}) : err(decompileInputError("output_directory", "The output directory could not be resolved."));
		};
		DecompileExport = class DecompileExport {
			root;
			journal;
			records;
			written;
			paths;
			identity;
			resources;
			constructor(root, journal, records, written, paths, identity, resources) {
				this.root = root;
				this.journal = journal;
				this.records = records;
				this.written = written;
				this.paths = paths;
				this.identity = identity;
				this.resources = resources;
			}
			static open(input) {
				return input.placement.mode === "create" ? DecompileExport.#create(input.placement.root, input.identity, input.resourceScope) : DecompileExport.#resume(input.placement.root, input.identity, input.resourceScope);
			}
			/** The latest journal outcome for an address. */
			record(address) {
				return this.records.get(address);
			}
			/**
			* The last successful write for an address. A later failure, such as a
			* transient read error, does not erase the checksum that verifies the file.
			*/
			lastWritten(address) {
				return this.written.get(address);
			}
			/**
			* Stable relative path for an address. The first path the journal gave this
			* address wins, even when a later failure record names no path.
			*/
			pathFor(address) {
				const owned = this.paths.byAddress.get(address);
				if (owned !== undefined) return owned;
				const relativePath = allocateFunctionPath(address, this.paths.byPortablePath);
				reservePath(this.paths, relativePath, address);
				return relativePath;
			}
			async append(record) {
				const line = decompileJournalLineSchema.safeParse({
					kind: "function",
					...record
				});
				if (!line.success || line.data.kind !== "function") return err(new AnalysisOutputError("decompile_all", "decompile journal record is invalid"));
				const written = await this.journal.writeFile(`${JSON.stringify(line.data)}\n`).then(() => this.journal.sync()).then(() => true, () => false);
				if (!written) return err(new AnalysisOutputError("decompile_all", "decompile journal could not be updated"));
				const { kind: _kind, ...committed } = line.data;
				this.records.set(committed.address, committed);
				if (committed.status === "written") this.written.set(committed.address, committed);
				if (committed.relative_path !== undefined) reservePath(this.paths, committed.relative_path, committed.address);
				return ok(undefined);
			}
			async writeIndex(input) {
				const index = decompileDirectoryIndexSchema.safeParse({
					version: 1,
					target_sha256: this.identity.targetSha256,
					provider: this.identity.provider,
					analysis_profile_digest: this.identity.analysisProfileDigest,
					layout: this.identity.layout,
					layout_status: input.layoutStatus,
					limitations: [...input.limitations],
					functions: [...this.records.values()].sort((left, right) => compareProcedureAddresses(left.address, right.address))
				});
				if (!index.success) return err(new AnalysisOutputError("decompile_all", "decompile index could not be built"));
				return writeOwnedIndex(this.root, `${JSON.stringify(index.data, null, 2)}\n`, this.resources);
			}
			commitFunctionFile(relativePath, bytes) {
				return commitFunctionFile(this.root, relativePath, bytes, this.resources);
			}
			hashFile(relativePath, signal) {
				return this.resources.hashFile(join(this.root, relativePath), signal);
			}
			/** Failed cleanup retains the same files and lease for a later session retry. */
			close() {
				return this.resources.close();
			}
			static async #create(root, identity, scope) {
				const created = await createPrivateDirectory(root);
				if (!created.ok) return created;
				const lease = await acquireExportLease(root);
				if (!lease.ok) {
					lease.error.retainDiagnostics({ created_output_directory: root });
					return lease;
				}
				const resources = new ExportResources(root, lease.value.identity, lease.value.lease, scope);
				const functions = await prepareFunctionsDirectory(root, resources);
				if (!functions.ok) return resources.failedInitialization(functions.error);
				const opened = await seedJournal(root, identity, resources);
				if (!opened.ok) return resources.failedInitialization(opened.error);
				return ok(new DecompileExport(root, opened.value, new Map(), new Map(), {
					byPortablePath: new Map(),
					byAddress: new Map()
				}, identity, resources));
			}
			static async #resume(root, identity, scope) {
				const lease = await acquireExportLease(root);
				if (!lease.ok) return lease;
				const resources = new ExportResources(root, lease.value.identity, lease.value.lease, scope);
				const opened = await openResumedJournal(root, identity, resources);
				if (!opened.ok) {
					const closed = await resources.close();
					return closed.ok ? opened : err(analysisErrorWithCleanupFailure(opened.error, closed.error, "decompile_all").bindCleanupDependencies([closed.error]));
				}
				return ok(new DecompileExport(root, opened.value.handle, opened.value.journal.records, opened.value.journal.written, opened.value.journal.paths, identity, resources));
			}
		};
		openResumedJournal = async (root, identity, resources) => {
			const opened = await readJournal(root, identity, resources);
			if (!opened.ok) return opened;
			const functions = await prepareFunctionsDirectory(root, resources);
			if (!functions.ok) return functions;
			const handle = await openJournal(root, "a");
			if (!handle.ok) return handle;
			resources.ownFile(handle.value, join(root, DECOMPILE_DIRECTORY_JOURNAL_NAME), true);
			const repaired = opened.value.committedBytes === opened.value.journalBytes || await handle.value.truncate(opened.value.committedBytes).then(() => true, () => false);
			if (!repaired) {
				return err(decompileInputError("output_directory", "The decompile journal could not be repaired after an interrupted write."));
			}
			return ok({
				handle: handle.value,
				journal: opened.value
			});
		};
		commitFunctionFile = async (root, relativePath, bytes, resources) => {
			if (!isDecompileFunctionRelativePath(relativePath)) return { status: "io" };
			const finalPath = join(root, relativePath);
			if (!isPathWithinRoot(root, finalPath)) return { status: "io" };
			const digest = sha256(bytes);
			const linked = await resources.publish(bytes, finalPath, "link").then(() => true, (cause) => cause);
			if (linked === true) return {
				status: "written",
				sha256: digest
			};
			if (nodeCode(linked) !== "EEXIST") return { status: "io" };
			const existing = await resources.hashFile(finalPath).catch((cause) => cause);
			if (typeof existing !== "string") return { status: "io" };
			return existing === digest ? {
				status: "matched",
				sha256: digest
			} : { status: "conflict" };
		};
		missingOrRejected = async (stripped, listed) => {
			if (isSymlinkStat(listed)) return err(decompileInputError("output_directory", "The output directory must be a real directory, not a symlink."));
			if (isStat(listed)) return err(decompileInputError("output_directory", "The output path exists and is not a directory."));
			if (nodeCode(listed) !== "ENOENT") return err(decompileInputError("output_directory", "The output directory could not be inspected."));
			const parent = await realpath(dirname(stripped)).catch((cause) => cause);
			if (typeof parent !== "string") return err(decompileInputError("output_directory", "The output directory's parent does not exist."));
			return ok({
				mode: "create",
				root: join(parent, basename(stripped))
			});
		};
		createPrivateDirectory = async (root) => {
			const created = await mkdir(root, { mode: 448 }).catch((cause) => cause);
			if (created !== undefined) return err(nodeCode(created) === "EEXIST" ? decompileInputError("output_directory", "Output directory already exists. Pass resume to continue an export that matches this target and analysis profile.") : decompileInputError("output_directory", "The output directory could not be created."));
			const secured = await chmod(root, 448).catch((cause) => cause);
			if (secured === undefined) return ok(undefined);
			const removed = await rmdir(root).then(() => true, () => false);
			return err(decompileInputError("output_directory", removed ? "The output directory could not be secured." : "The output directory could not be secured, and the directory this call created could not be removed. Remove it before retrying."));
		};
		prepareFunctionsDirectory = async (root, resources) => {
			const directory = join(root, DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY);
			const created = await mkdir(directory, { mode: 448 }).catch((cause) => cause);
			if (created !== undefined && nodeCode(created) !== "EEXIST") return err(decompileInputError("output_directory", "The functions directory could not be created."));
			const stat = await lstat(directory, { bigint: true }).catch((cause) => cause);
			if (!isDirectoryStat(stat) || !hasFileIdentity(stat)) return err(decompileInputError("output_directory", "The functions directory is not a real directory."));
			resources.ownFunctionsDirectory(stat);
			const secured = await chmod(directory, 448).catch((cause) => cause);
			return secured === undefined ? ok(undefined) : err(decompileInputError("output_directory", "The functions directory could not be secured."));
		};
		seedJournal = async (root, identity, resources) => {
			const header = decompileJournalHeaderSchema.safeParse({
				kind: "header",
				version: 1,
				target_sha256: identity.targetSha256,
				provider: identity.provider,
				analysis_profile_digest: identity.analysisProfileDigest,
				layout: identity.layout
			});
			if (!header.success) return err(new AnalysisOutputError("decompile_all", "decompile journal header is invalid"));
			const opened = await openJournal(root, "wx");
			if (!opened.ok) return opened;
			resources.ownFile(opened.value, join(root, DECOMPILE_DIRECTORY_JOURNAL_NAME), true);
			const seeded = await opened.value.writeFile(`${JSON.stringify(header.data)}\n`).then(() => opened.value.sync()).then(() => chmod(join(root, DECOMPILE_DIRECTORY_JOURNAL_NAME), 384)).then(() => true, () => false);
			if (seeded) return opened;
			return err(decompileInputError("output_directory", "The decompile journal could not be created."));
		};
		NO_FOLLOW = constants.O_NOFOLLOW ?? 0;
		JOURNAL_FLAGS = {
			wx: constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NO_FOLLOW,
			a: constants.O_WRONLY | constants.O_APPEND | NO_FOLLOW
		};
		openJournal = async (root, flag) => {
			const handle = await open(join(root, DECOMPILE_DIRECTORY_JOURNAL_NAME), JOURNAL_FLAGS[flag], 384).catch((cause) => cause);
			return isFileHandle(handle) ? ok(handle) : err(decompileInputError("output_directory", "The decompile journal could not be opened."));
		};
		readJournalBytes = async (root, resources) => {
			const path = join(root, DECOMPILE_DIRECTORY_JOURNAL_NAME);
			const stat = await lstat(path).catch((cause) => cause);
			if (!isStat(stat)) return stat;
			if (!stat.isFile()) return new Error("journal is not a regular file");
			const handle = await open(path, constants.O_RDONLY | NO_FOLLOW).catch((cause) => cause);
			if (!isFileHandle(handle)) return handle;
			const close = resources.ownFile(handle, path);
			const bytes = await handle.readFile().catch((cause) => cause);
			return await close() ? bytes : new Error("decompile journal read handle could not be closed");
		};
		readJournal = async (root, identity, resources) => {
			const bytes = await readJournalBytes(root, resources);
			if (!(bytes instanceof Buffer)) return err(nodeCode(bytes) === "ENOENT" ? decompileInputError("output_directory", "Resume requires decompile-journal.jsonl in the output directory. An export stopped before its journal was written has no functions to keep; choose a new output directory, or remove this one if it is yours.") : decompileInputError("output_directory", "The decompile journal could not be read."));
			const parsed = parseJournal(bytes);
			if (!parsed.ok) return parsed;
			const unknown = unknownIdentity(parsed.value.header, identity);
			if (unknown !== undefined) return err(unknown);
			return sameIdentity(parsed.value.header, identity) ? ok({
				records: parsed.value.records,
				written: parsed.value.written,
				paths: parsed.value.paths,
				committedBytes: parsed.value.committedBytes,
				journalBytes: parsed.value.journalBytes
			}) : err(decompileInputError("output_directory", "The decompile journal does not match this target, provider, analysis profile, or layout."));
		};
		parseJournal = (bytes) => {
			const committedBytes = bytes.lastIndexOf(10) + 1;
			const lines = bytes.subarray(0, committedBytes).toString("utf8").split("\n");
			lines.pop();
			const header = decompileJournalHeaderSchema.safeParse(parseJson(lines[0]));
			if (!header.success) return err(incompatibleJournal());
			const records = new Map();
			const written = new Map();
			const paths = {
				byPortablePath: new Map(),
				byAddress: new Map()
			};
			for (const line of lines.slice(1)) {
				const parsed = decompileJournalLineSchema.safeParse(parseJson(line));
				if (!parsed.success || parsed.data.kind !== "function") return err(incompatibleJournal());
				const { kind: _kind, ...record } = parsed.data;
				const path = record.relative_path;
				if (path !== undefined) {
					const owner = paths.byPortablePath.get(portablePathKey(path));
					if (owner !== undefined && owner !== record.address) return err(incompatibleJournal());
					reservePath(paths, path, record.address);
				}
				records.set(record.address, record);
				if (record.status === "written") written.set(record.address, record);
			}
			return ok({
				header: header.data,
				records,
				written,
				paths,
				committedBytes,
				journalBytes: bytes.length
			});
		};
		unknownIdentity = (header, identity) => {
			if (header.target_sha256 === null || identity.targetSha256 === null) return decompileInputError("output_directory", "Resume requires an observed target SHA-256 for both the journal and this target.");
			if (header.analysis_profile_digest === null || identity.analysisProfileDigest === null) return decompileInputError("output_directory", "Resume requires an analysis profile digest for both the journal and this provider.");
			return undefined;
		};
		sameIdentity = (header, identity) => header.target_sha256 === identity.targetSha256 && header.analysis_profile_digest === identity.analysisProfileDigest && header.layout === identity.layout && header.provider.id === identity.provider.id && header.provider.name === identity.provider.name && header.provider.version === identity.provider.version;
		incompatibleJournal = () => decompileInputError("output_directory", "The decompile journal is not a compatible export.");
		parseJson = (line) => {
			if (line === undefined) return undefined;
			try {
				return JSON.parse(line);
			} catch {
				return undefined;
			}
		};
		portablePathKey = (path) => path.toLowerCase();
		reservePath = (paths, path, address) => {
			const key = portablePathKey(path);
			if (!paths.byPortablePath.has(key)) paths.byPortablePath.set(key, address);
			if (!paths.byAddress.has(address)) paths.byAddress.set(address, path);
		};
		allocateFunctionPath = (address, used) => {
			const base = sanitizeAddress(address);
			const directory = DECOMPILE_DIRECTORY_FUNCTIONS_DIRECTORY;
			const plain = `${directory}/${base}.c`;
			if (!used.has(portablePathKey(plain))) return plain;
			const suffix = createHash("sha256").update(address).digest("hex").slice(0, 8);
			let candidate = `${directory}/${base}-${suffix}.c`;
			let discriminator = 0;
			while (used.has(portablePathKey(candidate))) {
				discriminator += 1;
				candidate = `${directory}/${base}-${suffix}-${discriminator.toString(16)}.c`;
			}
			return candidate;
		};
		sanitizeAddress = (address) => {
			const cleaned = address.replace(/[^A-Za-z0-9._-]+/gu, "_").replace(/^\.+/u, "").slice(0, 120);
			return cleaned.length === 0 ? "function" : cleaned;
		};
		DECOMPILE_EXPORT_LEASE_DIRECTORY = join("/tmp", `rea-decompile-${(process.getuid?.() ?? 0).toString()}`);
		acquireExportLease = async (root) => {
			const stat = await lstat(root, { bigint: true }).catch((cause) => cause);
			if (!isDirectoryStat(stat) || !hasFileIdentity(stat)) return err(decompileInputError("output_directory", "The output directory could not be inspected."));
			try {
				const acquisition = await acquireOwnedLease({
					identity: {
						operation: "decompile_all",
						device: stat.dev.toString(),
						inode: stat.ino.toString()
					},
					runId: randomUUID(),
					directory: DECOMPILE_EXPORT_LEASE_DIRECTORY,
					failure: exportLeaseFailure
				});
				return acquisition.acquired ? ok({
					lease: acquisition.lease,
					identity: stat
				}) : err(new AnalysisResourceConstraintError("decompile_all", "capacity", `another decompile_all run (process ${acquisition.owner.processId.toString()}) is using this output directory`, { holder_process_id: acquisition.owner.processId }, {
					retryable: true,
					remediationAction: "Wait for the other decompile_all run on this output directory to finish, then retry with resume."
				}));
			} catch (cause) {
				return err(cause instanceof AnalysisError ? cause : new AnalysisOutputError("decompile_all", "output directory lease could not be acquired", { cause }));
			}
		};
		exportLeaseFailure = (failure, cause) => new AnalysisOutputError("decompile_all", "output directory lease could not be acquired", {
			...cause === undefined ? {} : { cause },
			userMessage: exportLeaseMessage(failure)
		});
		exportLeaseMessage = (failure) => {
			switch (failure.kind) {
				case "owner_unverified": return `Another process holds this output directory's lease but did not identify itself (${failure.reason}). Retry after it finishes.`;
				case "recovery_busy": return `Another run is recovering this output directory's lease at ${JSON.stringify(failure.path)}. Retry shortly. If no REA process is running, remove that directory.`;
				case "recovery_remove": return `REA could not remove its lease recovery directory at ${JSON.stringify(failure.path)}. Check its write access before retrying.`;
				case "unrecoverable": return "REA could not take this output directory's lease. Retry after other decompile_all runs finish.";
				case "directory_access_denied": return `REA could not access its lease directory at ${JSON.stringify(failure.directory)}. Restore owner-only permissions (0700) on a directory you own, then retry.`;
				case "directory_create":
				case "directory_not_private":
				case "directory_permissions":
				case "directory_inspect":
				case "recovery_create": return `REA could not use its private lease directory ${JSON.stringify(DECOMPILE_EXPORT_LEASE_DIRECTORY)}. Check that it is a directory owned by this user with permissions 0700.`;
			}
		};
		hasFileIdentity = (value) => typeof value === "object" && value !== null && "dev" in value && "ino" in value && typeof value.dev === "bigint" && typeof value.ino === "bigint";
		writeOwnedIndex = async (root, text, resources) => {
			try {
				await resources.publish(text, join(root, DECOMPILE_DIRECTORY_INDEX_NAME), "rename");
				return ok(undefined);
			} catch (cause) {
				return err(new AnalysisOutputError("decompile_all", "decompile index could not be written", { cause }));
			}
		};
		sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
		isFileHandle = (value) => typeof value === "object" && value !== null && "write" in value && "sync" in value && "close" in value;
		isDirectoryStat = (value) => isStat(value) && value.isDirectory() && !value.isSymbolicLink();
		isSymlinkStat = (value) => isStat(value) && value.isSymbolicLink();
		isStat = (value) => typeof value === "object" && value !== null && "isDirectory" in value && "isFile" in value && "isSymbolicLink" in value && typeof value.isDirectory === "function" && typeof value.isSymbolicLink === "function";
		nodeCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/functionFile.js
var functionFileText, bodyRecord, bodyLines, limitationLines, providerLine, headerValue;
function init_functionFile() {
	return (init_functionFile = __esmMin((() => {
		functionFileText = (input) => {
			const lines = [
				"// rea decompile_all",
				`// name: ${headerValue(input.procedure.name ?? "")}`,
				`// address: ${headerValue(input.procedure.address)}`,
				...bodyLines(input.body),
				`// provider: ${headerValue(providerLine(input.identity))}`,
				`// analysis_profile: ${input.identity.analysisProfileDigest ?? "unavailable"}`,
				...limitationLines(input.limitations),
				"// pseudocode: provider-specific; not original source"
			];
			return `${lines.join("\n")}\n\n${input.pseudocode}`;
		};
		bodyRecord = (body) => body.available ? {
			available: true,
			ranges: body.ranges.map((range) => ({
				start: range.start,
				end: range.end
			})),
			non_contiguous: body.non_contiguous
		} : {
			available: false,
			reason: body.reason
		};
		bodyLines = (body) => body.available ? [
			"// body: available",
			...body.ranges.map((range) => `// range: ${headerValue(range.start)}-${headerValue(range.end)} inclusive`),
			`// non_contiguous: ${body.non_contiguous ? "true" : "false"}`
		] : ["// body: unavailable", `// body_reason: ${headerValue(body.reason)}`];
		limitationLines = (limitations) => {
			const joined = limitations.map((limitation) => headerValue(limitation)).filter((limitation) => limitation.length > 0).join("; ");
			if (joined.length <= 4e3) return [`// limitations: ${joined.length === 0 ? "none" : joined}`];
			return [`// limitations: ${joined.slice(0, 4e3)}`, "// limitations_truncated: true; decompile-index.json keeps the complete list"];
		};
		providerLine = (identity) => `${identity.provider.name} ${identity.provider.version ?? "unknown"} (${identity.provider.id})`;
		headerValue = (value) => value.replace(/[\u0000-\u001f\u007f]/gu, " ").slice(0, 2e3);
	})))();
}

//#endregion
//#region dist/application/decompileDirectory/decompileAll.js
var DWARF_LAYOUT_UNAVAILABLE, BODY_UNAVAILABLE, TARGET_DIGEST_UNAVAILABLE, PROFILE_UNAVAILABLE, DUPLICATE_ADDRESSES, OUTPUT_IO_STREAK_LIMIT, unaddressedRows, decompileAll, attemptOrder, loadProcedures, identityFrom, publishSelected, attemptOne, publishOne, readBody, existingFile, PROFILE_CHANGED, TARGET_CHANGED, observationMismatch, sameAddress, failureReason, outputStoppedAccepting, recordFailure, fitInlineFailure, failureRecord, pseudocodeFailure, externalRecord, unavailableBody, retainedBody, exportLimitations, layoutStatus, manifestOf, executionOptions$1, cancelled, isAborted$2, nodeAbsent;
function init_decompileAll() {
	return (init_decompileAll = __esmMin((() => {
		init_decompileDirectory();
		init_jsonValueByteLength();
		init_digests();
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_analysisErrorProjection();
		init_procedureInfo();
		init_nativeInventory();
		init_addressCoordinate();
		init_result();
		init_exportTree();
		init_functionFile();
		init_selection();
		DWARF_LAYOUT_UNAVAILABLE = "Debug compilation-unit layout is unavailable. Files are named by canonical address.";
		BODY_UNAVAILABLE = "procedure_info is unavailable, so function body ranges are unknown.";
		TARGET_DIGEST_UNAVAILABLE = "Target SHA-256 was not observed, so this export cannot be resumed.";
		PROFILE_UNAVAILABLE = "The provider did not commit an analysis profile, so this export cannot be resumed.";
		DUPLICATE_ADDRESSES = "Duplicate procedure addresses were coalesced to the first matching inventory row.";
		OUTPUT_IO_STREAK_LIMIT = 5;
		unaddressedRows = (count) => `${count.toString()} inventory row(s) had no address and were not exported.`;
		decompileAll = async (analysis, input, signal) => {
			const bounds = validateDecompileBounds(input);
			if (!bounds.ok) return bounds;
			const placement = await classifyOutputPath(input.output_directory, input.resume);
			if (!placement.ok) return placement;
			if (isAborted$2(signal)) return err(cancelled(signal));
			const loaded = await loadProcedures(analysis, input.layout, signal);
			if (!loaded.ok) return loaded;
			if (isAborted$2(signal)) return err(cancelled(signal));
			const selection = selectProcedures(loaded.value.procedures, input, bounds.value);
			const opened = await DecompileExport.open({
				placement: placement.value,
				identity: loaded.value.identity,
				resourceScope: analysis.resourceScope
			});
			if (!opened.ok) return opened;
			const session = opened.value;
			const state = {
				attempted: 0,
				written: 0,
				failed: 0,
				external: 0,
				skipped: 0,
				failures: [],
				inlineFailureBytes: 2,
				recentFailures: [],
				bodyUnavailable: false,
				lastFailureCode: undefined,
				outputIoStreak: 0
			};
			let published;
			let indexed;
			let limitations = [];
			let closed;
			try {
				published = await publishSelected({
					analysis,
					session,
					procedures: attemptOrder(session, selection.procedures),
					identity: loaded.value.identity,
					signal,
					limit: input.limit,
					state
				});
				limitations = exportLimitations(input.layout, loaded.value.identity, selection.collapsedDuplicates, state.bodyUnavailable, loaded.value.unaddressed);
				indexed = await session.writeIndex({
					layoutStatus: layoutStatus(input.layout),
					limitations
				});
			} finally {
				closed = await session.close();
			}
			const callerStoppedPublish = !published.ok && published.error instanceof AnalysisCancelledError && isAborted$2(signal);
			const failures = [
				...!published.ok && !callerStoppedPublish ? [published.error] : [],
				...indexed.ok ? [] : [indexed.error],
				...closed.ok ? [] : [closed.error]
			];
			const primary = failures[0];
			if (primary !== undefined) {
				for (const failure of failures.slice(1)) primary.retainSecondaryFailure(failure);
				return !closed.ok && primary !== closed.error && closed.error.cleanupIncomplete ? err(analysisErrorWithCleanupFailure(primary, closed.error, "decompile_all").bindCleanupDependencies([closed.error])) : err(primary);
			}
			if (isAborted$2(signal)) return err(cancelled(signal));
			const manifest = decompileDirectoryManifestSchema.safeParse(manifestOf({
				root: session.root,
				input,
				identity: loaded.value.identity,
				selected: selection.procedures.length,
				excluded: selection.excluded,
				state,
				limitations
			}));
			return manifest.success ? ok(manifest.data) : err(new AnalysisOutputError("decompile_all", "decompile manifest could not be built"));
		};
		attemptOrder = (session, procedures) => {
			const failedBefore = (procedure) => session.record(procedure.address)?.status === "failed";
			return [...procedures.filter((procedure) => !failedBefore(procedure)), ...procedures.filter(failedBefore)];
		};
		loadProcedures = async (analysis, layout, signal) => {
			const observed = await analysis.execute("list_procedures", {}, executionOptions$1(signal));
			if (!observed.ok) return observed;
			const parsed = z.array(addressedValueSchema).safeParse(observed.value.result);
			if (!parsed.success) return err(new AnalysisOutputError("list_procedures", "provider returned an invalid procedure inventory"));
			const identity = identityFrom(observed.value, layout);
			if (!identity.ok) return identity;
			const addressed = parsed.data.filter((row) => row.address.length > 0);
			return ok({
				procedures: addressed.map((row) => ({
					address: row.address,
					name: row.value.length === 0 ? null : row.value
				})),
				identity: identity.value,
				unaddressed: parsed.data.length - addressed.length
			});
		};
		identityFrom = (execution, layout) => {
			const sha = execution.subject?.sha256 ?? null;
			if (sha !== null && !digestSchema.safeParse(sha).success) return err(new AnalysisOutputError("list_procedures", "provider returned a target digest that is not a SHA-256"));
			const profile = execution.analysisProfile?.digest ?? null;
			if (profile !== null && !digestSchema.safeParse(profile).success) return err(new AnalysisOutputError("list_procedures", "provider returned an analysis profile digest that is not a SHA-256"));
			const provider = execution.provider;
			if (provider.id.length === 0 || provider.name.length === 0) return err(new AnalysisOutputError("list_procedures", "provider identity is incomplete"));
			if (provider.version !== null && provider.version.length === 0) return err(new AnalysisOutputError("list_procedures", "provider identity is incomplete"));
			return ok({
				targetSha256: sha,
				provider: {
					id: provider.id,
					name: provider.name,
					version: provider.version
				},
				analysisProfileDigest: profile,
				layout
			});
		};
		publishSelected = async (input) => {
			let bodySupport = "unknown";
			for (const procedure of input.procedures) {
				if (isAborted$2(input.signal)) return err(cancelled(input.signal));
				const existing = await existingFile(input.session, procedure.address, input.signal);
				if (isAborted$2(input.signal)) return err(cancelled(input.signal));
				if (existing === "skip") {
					input.state.skipped += 1;
					input.state.outputIoStreak = 0;
					const written = input.session.lastWritten(procedure.address);
					if (written !== undefined && input.session.record(procedure.address) !== written) {
						const appended = await input.session.append(written);
						if (!appended.ok) return appended;
					}
					continue;
				}
				if (existing === "write" && input.session.record(procedure.address)?.status === "external") {
					input.state.skipped += 1;
					continue;
				}
				if (input.limit !== undefined && input.state.attempted >= input.limit) continue;
				input.state.attempted += 1;
				input.state.lastFailureCode = undefined;
				const outcome = await attemptOne(input, procedure, existing, bodySupport);
				bodySupport = outcome.bodySupport;
				if (!outcome.result.ok) return outcome.result;
				input.state.outputIoStreak = input.state.lastFailureCode === "output_io" ? input.state.outputIoStreak + 1 : 0;
				if (input.state.outputIoStreak >= 5) return err(outputStoppedAccepting(input.state));
			}
			return ok(undefined);
		};
		attemptOne = async (input, procedure, existing, bodySupport) => {
			if (existing === "conflict") {
				const reason = {
					code: "output_exists",
					message: "The function file already exists and does not match this export."
				};
				recordFailure(input.state, procedure, reason);
				const appended = await input.session.append(failureRecord(procedure, retainedBody(input.session, procedure.address), reason, { relativePath: input.session.pathFor(procedure.address) }));
				return {
					result: appended,
					bodySupport
				};
			}
			if (existing === "io") {
				const reason = {
					code: "output_io",
					message: "The existing function file could not be read."
				};
				recordFailure(input.state, procedure, reason);
				const appended = await input.session.append(failureRecord(procedure, retainedBody(input.session, procedure.address), reason, { relativePath: input.session.pathFor(procedure.address) }));
				return {
					result: appended,
					bodySupport
				};
			}
			return publishOne({
				...input,
				procedure,
				bodySupport
			});
		};
		publishOne = async (input) => {
			const body = await readBody(input.analysis, input.procedure.address, input.identity, input.signal, input.bodySupport);
			if (body.kind === "cancelled") return {
				result: err(body.error),
				bodySupport: input.bodySupport
			};
			if (body.kind === "unavailable") input.state.bodyUnavailable = true;
			const infoCaveats = body.kind === "body" ? body.limitations ?? [] : [];
			if (body.kind === "body" && body.external === true) {
				input.state.external += 1;
				return {
					result: await input.session.append(externalRecord(input.procedure, body.fact, infoCaveats)),
					bodySupport: body.support
				};
			}
			const decompiled = await input.analysis.execute("procedure_pseudo_code", { procedure: input.procedure.address }, executionOptions$1(input.signal));
			if (isAborted$2(input.signal)) return {
				result: err(cancelled(input.signal)),
				bodySupport: body.support
			};
			if (!decompiled.ok) {
				if (decompiled.error instanceof AnalysisCancelledError) return {
					result: decompiled,
					bodySupport: body.support
				};
				const reason = failureReason(decompiled.error);
				recordFailure(input.state, input.procedure, reason);
				return {
					result: await input.session.append(failureRecord(input.procedure, body.fact, reason, { limitations: infoCaveats })),
					bodySupport: body.support
				};
			}
			const mismatch = observationMismatch(input.identity, decompiled.value);
			if (mismatch !== undefined) {
				const reason = mismatch;
				recordFailure(input.state, input.procedure, reason);
				return {
					result: await input.session.append(failureRecord(input.procedure, body.fact, reason, { limitations: infoCaveats })),
					bodySupport: body.support
				};
			}
			const caveats = [...new Set([...infoCaveats, ...decompiled.value.limitations])];
			const pseudocode = decompiled.value.result;
			if (typeof pseudocode !== "string" || pseudocode.length === 0) {
				const reason = pseudocodeFailure(pseudocode);
				recordFailure(input.state, input.procedure, reason);
				return {
					result: await input.session.append(failureRecord(input.procedure, body.fact, reason, { limitations: caveats })),
					bodySupport: body.support
				};
			}
			const relativePath = input.session.pathFor(input.procedure.address);
			const bytes = Buffer.from(functionFileText({
				procedure: input.procedure,
				body: body.fact,
				identity: input.identity,
				limitations: caveats,
				pseudocode
			}), "utf8");
			const committed = await input.session.commitFunctionFile(relativePath, bytes);
			if (committed.status === "conflict" || committed.status === "io") {
				const reason = committed.status === "conflict" ? {
					code: "output_exists",
					message: "The function file already exists and does not match this export."
				} : {
					code: "output_io",
					message: "The function file could not be written."
				};
				recordFailure(input.state, input.procedure, reason);
				return {
					result: await input.session.append(failureRecord(input.procedure, body.fact, reason, {
						relativePath,
						limitations: caveats
					})),
					bodySupport: body.support
				};
			}
			const appended = await input.session.append({
				address: input.procedure.address,
				name: input.procedure.name,
				status: "written",
				relative_path: relativePath,
				sha256: committed.sha256,
				body: bodyRecord(body.fact),
				...caveats.length === 0 ? {} : { limitations: caveats }
			});
			if (!appended.ok) return {
				result: appended,
				bodySupport: body.support
			};
			input.state.written += committed.status === "written" ? 1 : 0;
			input.state.skipped += committed.status === "matched" ? 1 : 0;
			return {
				result: ok(undefined),
				bodySupport: body.support
			};
		};
		readBody = async (analysis, address, identity, signal, support) => {
			if (support === "unavailable") return {
				kind: "unavailable",
				fact: unavailableBody(BODY_UNAVAILABLE),
				support
			};
			const observed = await analysis.execute("procedure_info", { procedure: address }, executionOptions$1(signal));
			if (!observed.ok) {
				if (observed.error instanceof AnalysisCancelledError) return {
					kind: "cancelled",
					error: observed.error
				};
				if (observed.error instanceof AnalysisCapabilityUnavailableError) return {
					kind: "unavailable",
					fact: unavailableBody(BODY_UNAVAILABLE),
					support: "unavailable"
				};
				return {
					kind: "body",
					fact: unavailableBody(failureReason(observed.error).message),
					support
				};
			}
			const mismatch = observationMismatch(identity, observed.value);
			if (mismatch !== undefined) return {
				kind: "body",
				fact: unavailableBody(`procedure_info: ${mismatch.message}`),
				support
			};
			const parsed = procedureInfoSchema.safeParse(observed.value.result);
			if (!parsed.success) return {
				kind: "body",
				fact: unavailableBody("procedure_info returned an invalid body."),
				support,
				limitations: observed.value.limitations
			};
			if (!sameAddress(parsed.data.entrypoint, address)) return {
				kind: "body",
				fact: unavailableBody("procedure_info described a different entry point than this function."),
				support,
				limitations: observed.value.limitations
			};
			const external = parsed.data.classification?.external === true ? { external: true } : {};
			if (!parsed.data.body.available) return {
				kind: "body",
				fact: unavailableBody(parsed.data.body.reason),
				support,
				limitations: observed.value.limitations,
				...external
			};
			return {
				kind: "body",
				fact: {
					available: true,
					ranges: parsed.data.body.ranges,
					non_contiguous: parsed.data.body.non_contiguous
				},
				support,
				limitations: observed.value.limitations,
				...external
			};
		};
		existingFile = async (session, address, signal) => {
			const record = session.lastWritten(address);
			if (record === undefined || record.sha256 === undefined || record.relative_path === undefined) return "write";
			const digest = await session.hashFile(record.relative_path, signal).catch((cause) => cause);
			if (typeof digest === "string") return digest === record.sha256 ? "skip" : "conflict";
			return nodeAbsent(digest) ? "write" : "io";
		};
		PROFILE_CHANGED = {
			code: "profile_changed",
			message: "The decompiler observation does not match this export's provider or analysis profile."
		};
		TARGET_CHANGED = {
			code: "target_changed",
			message: "The decompiler observation names a different target than this export."
		};
		observationMismatch = (identity, execution) => {
			const provider = execution.provider;
			if (provider.id !== identity.provider.id || provider.name !== identity.provider.name || provider.version !== identity.provider.version) return PROFILE_CHANGED;
			if ((execution.analysisProfile?.digest ?? null) !== identity.analysisProfileDigest) return PROFILE_CHANGED;
			const target = execution.subject?.sha256;
			return target === undefined || target === identity.targetSha256 ? undefined : TARGET_CHANGED;
		};
		sameAddress = (left, right) => {
			const a = addressCoordinate(left);
			const b = addressCoordinate(right);
			return a === null || b === null ? left === right : a.space === b.space && a.offset === b.offset;
		};
		failureReason = (error) => {
			if (error instanceof AnalysisTimeoutError) return {
				code: "deadline",
				message: "The decompiler deadline elapsed."
			};
			const projected = projectAnalysisError(error);
			const message = projected.message.replace(/\s+/gu, " ").trim().slice(0, 300);
			return {
				code: projected.code.slice(0, 80),
				message: message.length === 0 ? projected.code : message
			};
		};
		outputStoppedAccepting = (state) => new AnalysisOutputError("decompile_all", "output directory stopped accepting function files", {
			userMessage: `Stopped after ${5 .toString()} function files in a row could not be written or read, for example because the disk is full or permissions changed. Files already written are kept and recorded in ${DECOMPILE_DIRECTORY_INDEX_NAME}. Fix the output directory, then resume.`,
			remediationAction: "Free space or restore write access in the output directory, then rerun with resume.",
			diagnostics: {
				attempted: state.attempted,
				written: state.written,
				failed: state.failed,
				external: state.external,
				skipped: state.skipped,
				consecutive_output_io: state.outputIoStreak,
				last_failures: state.recentFailures.map((failure) => ({ ...failure })),
				last_failures_omitted: Math.min(state.failed, 5) - state.recentFailures.length
			}
		});
		recordFailure = (state, procedure, reason) => {
			state.failed += 1;
			state.lastFailureCode = reason.code;
			const failure = {
				address: procedure.address,
				name: procedure.name,
				code: reason.code,
				message: reason.message
			};
			if (state.failures.length < 32) {
				const comma = state.failures.length === 0 ? 0 : 1;
				const fitted = fitInlineFailure(failure, DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES - state.inlineFailureBytes - comma);
				if (fitted !== undefined) {
					state.failures.push(fitted.row);
					state.inlineFailureBytes += comma + fitted.bytes;
				}
			}
			const recent = fitInlineFailure(failure, DECOMPILE_DIRECTORY_INLINE_FAILURE_BYTES - 2);
			if (recent === undefined) state.recentFailures.length = 0;
			else state.recentFailures.push(recent.row);
			while (state.recentFailures.length > 5 || jsonValueByteLength(state.recentFailures, 2048) > 2048) state.recentFailures.shift();
		};
		fitInlineFailure = (failure, budget) => {
			const bytes = jsonValueByteLength(failure, budget);
			if (bytes <= budget) return {
				row: failure,
				bytes
			};
			const { name: _name, ...withoutName } = failure;
			const compactBytes = jsonValueByteLength(withoutName, budget);
			return compactBytes <= budget ? {
				row: withoutName,
				bytes: compactBytes
			} : undefined;
		};
		failureRecord = (procedure, body, reason, options = {}) => ({
			address: procedure.address,
			name: procedure.name,
			status: "failed",
			body: bodyRecord(body),
			failure: reason,
			...options.relativePath === undefined ? {} : { relative_path: options.relativePath },
			...options.limitations === undefined || options.limitations.length === 0 ? {} : { limitations: [...options.limitations] }
		});
		pseudocodeFailure = (pseudocode) => {
			if (pseudocode === null) return {
				code: "no_pseudocode",
				message: "The provider returned null pseudocode for this function."
			};
			return typeof pseudocode === "string" ? {
				code: "empty_pseudocode",
				message: "The provider returned no pseudocode."
			} : {
				code: "invalid_pseudocode",
				message: "The provider returned pseudocode that is not text."
			};
		};
		externalRecord = (procedure, body, limitations) => ({
			address: procedure.address,
			name: procedure.name,
			status: "external",
			body: bodyRecord(body),
			...limitations.length === 0 ? {} : { limitations: [...limitations] }
		});
		unavailableBody = (reason) => ({
			available: false,
			reason: reason.length === 0 ? "unavailable" : reason
		});
		retainedBody = (session, address) => {
			return session.record(address)?.body ?? unavailableBody("not rewritten");
		};
		exportLimitations = (layout, identity, collapsedDuplicates, bodyUnavailable, unaddressed) => [
			...layout === "dwarf" ? [DWARF_LAYOUT_UNAVAILABLE] : [],
			...identity.targetSha256 === null ? [TARGET_DIGEST_UNAVAILABLE] : [],
			...identity.analysisProfileDigest === null ? [PROFILE_UNAVAILABLE] : [],
			...collapsedDuplicates ? [DUPLICATE_ADDRESSES] : [],
			...unaddressed > 0 ? [unaddressedRows(unaddressed)] : [],
			...bodyUnavailable ? [BODY_UNAVAILABLE] : []
		];
		layoutStatus = (layout) => layout === "dwarf" ? "debug_layout_unavailable" : "address";
		manifestOf = (input) => {
			const requested = input.state.written + input.state.failed + input.state.external;
			const shown = input.state.failures.slice(0, 32);
			return {
				output_directory: input.root,
				index_path: join(input.root, DECOMPILE_DIRECTORY_INDEX_NAME),
				layout: input.input.layout,
				layout_status: layoutStatus(input.input.layout),
				counts: {
					selected: input.selected,
					excluded: input.excluded,
					requested,
					written: input.state.written,
					failed: input.state.failed,
					external: input.state.external,
					skipped: input.state.skipped,
					remaining: input.selected - input.state.skipped - requested
				},
				failures: shown,
				failures_omitted: input.state.failed - shown.length,
				provider: input.identity.provider,
				analysis_profile_digest: input.identity.analysisProfileDigest,
				target_sha256: input.identity.targetSha256,
				limitations: [...input.limitations],
				resume: input.input.resume
			};
		};
		executionOptions$1 = (signal) => ({
			...signal === undefined ? {} : { signal },
			selectorOrigin: "provider"
		});
		cancelled = (signal) => new AnalysisCancelledError("decompile_all", { cause: signal?.reason });
		isAborted$2 = (signal) => signal?.aborted === true;
		nodeAbsent = (cause) => typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
//#region dist/application/EnhancedToolTypes.js
var invalidEnhancedInput;
function init_EnhancedToolTypes() {
	return (init_EnhancedToolTypes = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_enhancedInputs();
		invalidEnhancedInput = (name, cause) => Promise.resolve(err(new AnalysisInputError(name, { cause })));
	})))();
}

//#endregion
//#region dist/application/AnalysisDocument.js
var executionOptions, resolveAnalysisDocument, completeSelection;
function init_AnalysisDocument() {
	return (init_AnalysisDocument = __esmMin((() => {
		init_analysisObservation();
		init_analysisErrorCore();
		init_hopperValues();
		init_result();
		executionOptions = (signal) => signal === undefined ? undefined : { signal };
		resolveAnalysisDocument = async (analysis, document, signal) => {
			if (document !== undefined) return ok(document);
			if (signal?.aborted === true) return err(new AnalysisCancelledError("current_document", { cause: signal.reason }));
			const current = await analysis.execute("current_document", {}, executionOptions(signal));
			if (!current.ok) {
				if (!(current.error instanceof AnalysisCapabilityUnavailableError) || current.error.cleanupIncomplete) return current;
				if (signal?.aborted) return err(new AnalysisCancelledError("current_document", { cause: signal.reason }));
				const listed = await analysis.execute("list_documents", {}, executionOptions(signal));
				if (!listed.ok) return listed;
				const parsed = parseDocuments(listed.value.result);
				if (!parsed.ok) return err(new AnalysisOutputError("list_documents", "expected one document identity when resolving a headless provider", { cause: parsed.error }));
				if (parsed.value.length !== 1) return err(new AnalysisOutputError("list_documents", `expected exactly one document identity for a provider without current-document selection, received ${parsed.value.length}`));
				const [documentName] = parsed.value;
				if (documentName === undefined || documentName.length === 0) return err(new AnalysisOutputError("list_documents", "provider returned no document identity"));
				return completeSelection(documentName, "list_documents", listed.value, signal);
			}
			return typeof current.value.result === "string" && current.value.result.length > 0 ? completeSelection(current.value.result, "current_document", current.value, signal) : err(new AnalysisOutputError("current_document", "expected a nonempty document identity string"));
		};
		completeSelection = (document, operation, execution, signal) => {
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, {
				cause: signal.reason,
				partialObservation: createAnalysisExecutionEvidence(operation, {}, execution, "observed")
			}));
			return ok(document);
		};
	})))();
}

//#endregion
//#region dist/application/CallPathTracing.js
var traceCallPath, createTraceState, expandAddress, reconstructPath, recordEdge, projectTrace, compareAddress, sortedUniqueAddresses, isAborted$1;
function init_CallPathTracing() {
	return (init_CallPathTracing = __esmMin((() => {
		init_CallRelationshipTraversal();
		init_analysisErrorProjection();
		init_analysisErrorCore();
		init_hopperValues();
		init_result();
		init_ProcedureAddressResolution();
		traceCallPath = async (call, callRelationship, input, signal) => {
			const start = await resolveProcedureAddress(call, input.start, signal);
			if (!start.ok) return start;
			let goal;
			if (input.goal !== undefined) {
				const resolved = await resolveProcedureAddress(call, input.goal, signal);
				if (!resolved.ok) return resolved;
				goal = resolved.value;
			}
			const resolvedInput = {
				start: start.value,
				...goal === undefined ? {} : { goal },
				direction: input.direction
			};
			if (isAborted$1(signal)) return err(new AnalysisCancelledError("trace_call_path", { cause: signal?.reason }));
			const state = createTraceState(resolvedInput);
			while (state.queueIndex < state.queue.length && state.traversalPath.length === 0) {
				if (isAborted$1(signal)) return err(new AnalysisCancelledError("trace_call_path", { cause: signal?.reason }));
				const address = state.queue[state.queueIndex++];
				if (address === undefined) break;
				const current = state.visited.get(address);
				if (current === undefined) continue;
				const expanded = await expandAddress(callRelationship, {
					input: resolvedInput,
					state,
					address,
					current,
					...signal === undefined ? {} : { signal }
				});
				if (!expanded.ok) return expanded;
				if (expanded.value) break;
			}
			if (isAborted$1(signal)) return err(new AnalysisCancelledError("trace_call_path", { cause: signal?.reason }));
			return ok(projectTrace(resolvedInput, state));
		};
		createTraceState = (input) => ({
			visited: new Map([[input.start, {
				address: input.start,
				depth: 0,
				parent: undefined
			}]]),
			queue: [input.start],
			edges: new Map(),
			failures: [],
			residual: new Set(),
			limitations: new Set(),
			relationshipCoverage: new Map(),
			queueIndex: 0,
			traversalPath: input.goal === input.start ? [input.start] : []
		});
		expandAddress = async (call, expansion) => {
			const { input, state, address, current, signal } = expansion;
			const { relation, operation: tool } = CALL_RELATIONSHIP_TRAVERSALS[input.direction];
			const result = await call(tool, { procedure: address }, signal, "provider");
			if (!result.ok) {
				if (result.error._tag === "AnalysisCancelledError" || signal?.aborted === true) return result;
			}
			if (isAborted$1(signal)) return err(new AnalysisCancelledError("trace_call_path", { cause: signal?.reason }));
			if (!result.ok) {
				state.failures.push({
					address,
					error: projectAnalysisError(result.error)
				});
				state.residual.add(`Call relationships were unavailable for ${address}.`);
				return ok(false);
			}
			const related = parseRelatedAddresses(result.value.result, relation, tool);
			if (!related.ok) {
				state.failures.push({
					address,
					error: projectAnalysisError(related.error)
				});
				state.residual.add(`Call relationships were unreadable for ${address}.`);
				return ok(false);
			}
			for (const limitation of result.value.limitations) state.limitations.add(limitation);
			const coverage = result.value.relationshipCoverage ?? {
				status: "unknown",
				reason: "Provider did not report relationship coverage."
			};
			state.relationshipCoverage.set(address, coverage);
			for (const diagnostic of "diagnostics" in coverage && Array.isArray(coverage.diagnostics) ? coverage.diagnostics : []) state.limitations.add(diagnostic);
			if (coverage.status === "partial") for (const limitation of coverage.limitations) state.residual.add(`Call relationships for ${address} are limited: ${limitation}`);
			else if (coverage.status === "unknown") state.residual.add(`Call relationship coverage is unknown for ${address}: ${coverage.reason}`);
			for (const relatedAddress of sortedUniqueAddresses(related.value)) {
				recordEdge(input, state, {
					address,
					relatedAddress,
					discoveryDepth: current.depth + 1
				});
				if (state.visited.has(relatedAddress)) continue;
				const discovered = {
					address: relatedAddress,
					depth: current.depth + 1,
					parent: current
				};
				state.visited.set(relatedAddress, discovered);
				if (relatedAddress === input.goal) {
					state.traversalPath = reconstructPath(discovered);
					return ok(true);
				}
				state.queue.push(relatedAddress);
			}
			return ok(false);
		};
		reconstructPath = (goal) => {
			const path = [];
			for (let node = goal; node; node = node.parent) path.push(node.address);
			return path.reverse();
		};
		recordEdge = (input, state, edge) => {
			const sourceAddress = input.direction === "forward" ? edge.address : edge.relatedAddress;
			const targetAddress = input.direction === "forward" ? edge.relatedAddress : edge.address;
			const edgeKey = `${sourceAddress}\u0000${targetAddress}`;
			if (state.edges.has(edgeKey)) return;
			state.edges.set(edgeKey, {
				source_address: sourceAddress,
				target_address: targetAddress,
				discovery_depth: edge.discoveryDepth
			});
		};
		projectTrace = (input, state) => ({
			start: input.start,
			goal: input.goal ?? null,
			direction: input.direction,
			goal_status: input.goal === undefined ? "not_requested" : state.traversalPath.length > 0 ? "reached" : state.residual.size > 0 ? "unknown" : "not_reached",
			nodes: [...state.visited.entries()].map(([address, { depth }]) => ({
				address,
				depth
			})).sort((left, right) => left.depth - right.depth || compareAddress(left.address, right.address)),
			edges: [...state.edges.values()].sort((left, right) => left.discovery_depth - right.discovery_depth || compareAddress(left.source_address, right.source_address) || compareAddress(left.target_address, right.target_address)),
			traversal_path: state.traversalPath,
			failures: state.failures,
			traversal: { nodes_visited: state.visited.size },
			relationship_coverage: Object.fromEntries([...state.relationshipCoverage.entries()].sort(([left], [right]) => compareAddress(left, right))),
			truncated: state.residual.size > 0,
			residual_unknowns: [...state.residual],
			limitations: ["Direct provider call relationships may omit unresolved indirect calls.", ...state.limitations]
		});
		compareAddress = (left, right) => left < right ? -1 : left > right ? 1 : 0;
		sortedUniqueAddresses = (addresses) => [...new Set(addresses)].sort(compareAddress);
		isAborted$1 = (signal) => signal?.aborted === true;
	})))();
}

//#endregion
//#region dist/application/EnhancedLiteralTracing.js
var LITERAL_SEARCH_SOURCES, traceLiteralFeature, literalMatches, traceReferences;
function init_EnhancedLiteralTracing() {
	return (init_EnhancedLiteralTracing = __esmMin((() => {
		init_nativeInventory();
		init_analysisErrorCore();
		init_hopperValues();
		init_result();
		LITERAL_SEARCH_SOURCES = [["search_strings", "string"], ["search_procedures", "procedure"]];
		traceLiteralFeature = async (call, observe, input, signal) => {
			const searched = await literalMatches(call, input, LITERAL_SEARCH_SOURCES, signal);
			if (!searched.ok) return searched;
			const traced = await traceReferences(call, observe, {
				matches: searched.value.matches,
				...signal === undefined ? {} : { signal }
			});
			if (!traced.ok) return traced;
			return ok({
				query: input.query,
				search_mode: "literal",
				matches: searched.value.matches,
				references: traced.value.references,
				truncated: traced.value.residual.length > 0,
				residual_unknowns: traced.value.residual
			});
		};
		literalMatches = async (call, input, sources, signal) => {
			const matches = [];
			for (const [tool, type] of sources) {
				const result = await call(tool, {
					pattern: input.query,
					mode: "literal",
					case_sensitive: input.case_sensitive
				}, signal);
				if (!result.ok) return result;
				const items = (type === "string" ? nativeInventoryRowsSchemas.strings : nativeInventoryRowsSchemas.names).safeParse(result.value);
				if (!items.success) return err(new AnalysisOutputError(tool, "provider returned an invalid search result"));
				for (const item of items.data) {
					matches.push(type === "string" ? {
						...item,
						type: "string"
					} : {
						...item,
						type: "procedure"
					});
				}
			}
			return ok({ matches });
		};
		traceReferences = async (call, observe, request) => {
			const references = [];
			const residual = [];
			const tracedTargets = new Set();
			const containing = new Map();
			for (const match of request.matches) {
				if (tracedTargets.has(match.address)) continue;
				tracedTargets.add(match.address);
				const observed = await observe("xrefs", { address: match.address }, request.signal);
				if (!observed.ok) return observed;
				if (observed.value.referencesTruncated === true) residual.push(`References to ${match.address} were truncated by the provider; additional references may exist.`);
				const sources = observed.value.result;
				if (!Array.isArray(sources)) return err(new AnalysisOutputError("xrefs", "provider returned a non-array result"));
				for (const source of sources) {
					if (typeof source !== "string") return err(new AnalysisOutputError("xrefs", "provider returned a non-address value"));
					let containingProcedure = containing.get(source);
					if (containingProcedure === undefined) {
						const resolved = await call("resolve_containing_procedure", { address: source }, request.signal);
						if (!resolved.ok) return resolved;
						const parsed = parseContainingProcedureResolution(resolved.value);
						if (!parsed.ok) return parsed;
						containingProcedure = parsed.value;
						containing.set(source, containingProcedure);
					}
					references.push({
						target_address: match.address,
						source_address: source,
						containing_procedure: containingProcedure
					});
				}
			}
			return ok({
				references,
				residual
			});
		};
	})))();
}

//#endregion
//#region dist/application/native/NativeApiInspection.js
var unavailableBoundary, projectNativeApiInspection, availableResidualUnknowns;
function init_NativeApiInspection() {
	return (init_NativeApiInspection = __esmMin((() => {
		init_nativeApiBoundary();
		unavailableBoundary = () => ({
			available: false,
			reason: "The selected provider did not expose a structured native API boundary model.",
			residual_unknowns: ["What are the function's return and parameter boundary types?", "Does this function dispatch through a jump table with recoverable data addresses?"]
		});
		projectNativeApiInspection = (dossier) => {
			const boundary = dossier.native_api ?? unavailableBoundary();
			const unsupportedBranches = boundary.available ? [] : ["structured-boundary-types", "jump-table-data-mapping"];
			const residualUnknowns = boundary.available ? availableResidualUnknowns(boundary) : boundary.residual_unknowns;
			return nativeApiInspectionResultSchema.parse({
				procedure: {
					address: dossier.procedure.address,
					name: dossier.procedure.name
				},
				boundary,
				substeps: [
					{
						operation: "analyze_function",
						status: "completed",
						observations: [
							"provider function dossier",
							"provider pseudocode classification",
							"provider control-flow observations"
						]
					},
					{
						operation: "project_native_api_boundary",
						status: boundary.available ? "completed" : "unsupported",
						observations: boundary.available ? [
							"return and parameter boundary types",
							"confidence and inference evidence",
							"jump-table dispatch, data, and target addresses"
						] : [boundary.reason]
					},
					{
						operation: "preserve_residual_unknowns",
						status: "completed",
						observations: residualUnknowns.length === 0 ? ["no additional structured-boundary unknowns"] : residualUnknowns
					}
				],
				unsupported_branches: unsupportedBranches,
				residual_unknowns: residualUnknowns
			});
		};
		availableResidualUnknowns = (boundary) => {
			const unknowns = [];
			for (const table of boundary.jump_tables) {
				if (table.default_targets.length === 0) unknowns.push(`Which default or out-of-range path, if any, belongs to the dispatch at ${table.dispatch_address}?`);
				if (table.mappings.length === 0) unknowns.push(`Which case values and targets belong to the dispatch at ${table.dispatch_address}?`);
				if (table.data_sources.length === 0) unknowns.push(`What backing data address produced the jump table dispatched at ${table.dispatch_address}?`);
				if (table.data_sources.some(({ entry_count: count, entry_size_bytes: size }) => count === null || size === null)) unknowns.push(`What are the exact entry size and count for candidate jump-table data dispatched at ${table.dispatch_address}?`);
				if (table.mappings.some(({ case_value: value }) => value === null)) unknowns.push(`Which source-level case values correspond to every target dispatched at ${table.dispatch_address}?`);
			}
			for (const value of [boundary.return_type, ...boundary.parameters]) {
				if (value.confidence === "low") unknowns.push(`Can the inferred ${value.role} type ${value.data_type} be confirmed with imported metadata or an ABI probe?`);
			}
			return [...new Set(unknowns)];
		};
	})))();
}

//#endregion
//#region dist/application/EnhancedTools.js
var isAnalysisCancellation, permitsCapabilityFallback, EnhancedTools, isAborted;
function init_EnhancedTools() {
	return (init_EnhancedTools = __esmMin((() => {
		init_nativeProcedureInput();
		init_CallRelationshipTraversal();
		init_enhancedInputs();
		init_analysisErrorCore();
		init_analysisErrorProjection();
		init_hopperValues();
		init_result();
		init_symbolAnalysis();
		init_NativeDispatchMetadataInspection();
		init_NativeValueTrace();
		init_NativeUiActionTrace();
		init_decompileAll();
		init_jsonValue();
		init_nativeInventory();
		init_objcSwiftMetadata();
		init_binaryTargetTypes();
		init_unicodeCodePointOrder();
		init_machoTargetSelection();
		init_EnhancedToolTypes();
		init_AnalysisDocument();
		init_CallPathTracing();
		init_XrefsAddressResolution();
		init_ProcedureAddressResolution();
		init_EnhancedLiteralTracing();
		init_NativeApiInspection();
		isAnalysisCancellation = (error) => error._tag === "AnalysisCancelledError";
		permitsCapabilityFallback = (error) => error instanceof AnalysisCapabilityUnavailableError && !error.cleanupIncomplete;
		EnhancedTools = class {
			analysis;
			constructor(analysis) {
				this.analysis = analysis;
			}
			/** Parse an untrusted direct-call input once, then dispatch exhaustively. */
			execute(name, input, signal) {
				if (name === "trace_feature" || name === "trace_call_path") return this.#executeTracing(name, input, signal);
				if (name === "trace_native_values") {
					const parsed = enhancedInputSchemas.trace_native_values.safeParse(input);
					return parsed.success ? this.executeValidated({
						name,
						input: parsed.data
					}, signal) : invalidEnhancedInput(name, parsed.error);
				}
				if (name === "trace_native_ui_action") {
					const parsed = enhancedInputSchemas.trace_native_ui_action.safeParse(input);
					return parsed.success ? this.executeValidated({
						name,
						input: parsed.data
					}, signal) : invalidEnhancedInput(name, parsed.error);
				}
				if (name === "analyze_function" || name === "inspect_native_api") return this.#executeFunctionAnalysis(name, input, signal);
				switch (name) {
					case "inspect_native_dispatch_metadata": {
						const parsed = enhancedInputSchemas.inspect_native_dispatch_metadata.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "get_objc_classes": {
						const parsed = enhancedInputSchemas.get_objc_classes.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "get_objc_protocols": {
						const parsed = enhancedInputSchemas.get_objc_protocols.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "batch_decompile": {
						const parsed = enhancedInputSchemas.batch_decompile.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "decompile_all": {
						const parsed = enhancedInputSchemas.decompile_all.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "get_call_graph": {
						const parsed = enhancedInputSchemas.get_call_graph.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "analyze_swift_types": {
						const parsed = enhancedInputSchemas.analyze_swift_types.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "find_xrefs_to_name": {
						const parsed = enhancedInputSchemas.find_xrefs_to_name.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
					case "binary_overview": {
						const parsed = enhancedInputSchemas.binary_overview.safeParse(input);
						return parsed.success ? this.executeValidated({
							name,
							input: parsed.data
						}, signal) : invalidEnhancedInput(name, parsed.error);
					}
				}
			}
			/** Dispatch input already parsed by a trusted adapter boundary. */
			executeValidated(call, signal) {
				switch (call.name) {
					case "inspect_native_dispatch_metadata": return inspectNativeDispatch(this.analysis, call.input.max_records, {
						signal,
						objcClassImportAddresses: call.input.objc_class_import_addresses,
						objcClassImportAddressesComplete: call.input.objc_class_import_addresses_complete,
						maxInputBytes: call.input.max_input_bytes
					});
					case "get_objc_classes": return this.#objcClasses(call.input.pattern, signal);
					case "get_objc_protocols": return this.#objcProtocols(signal);
					case "batch_decompile": return this.#batchDecompile(call.input.addresses, signal);
					case "decompile_all": return decompileAll(this.analysis, call.input, signal);
					case "get_call_graph": return this.#callGraph(call.input, signal);
					case "analyze_swift_types": return this.#analyzeSwiftTypes(call.input, signal);
					case "find_xrefs_to_name": return this.#findXrefs(call.input.name, signal);
					case "binary_overview": return this.#binaryOverview(signal);
					case "analyze_function": return this.#analyzeFunction(call.input, signal);
					case "inspect_native_api": return this.#inspectNativeApi(call.input, signal);
					case "trace_feature": return traceLiteralFeature((name, arguments_, operationSignal) => this.#call(name, arguments_, operationSignal), (name, arguments_, operationSignal) => this.#observe(name, arguments_, operationSignal), call.input, signal);
					case "trace_call_path": return traceCallPath((name, arguments_, operationSignal, selectorOrigin) => this.#call(name, arguments_, operationSignal, selectorOrigin), (name, arguments_, operationSignal, selectorOrigin) => this.#observe(name, arguments_, operationSignal, selectorOrigin), call.input, signal);
					case "trace_native_values": return traceNativeValues(this.analysis, call.input, signal);
					case "trace_native_ui_action": {
						return traceNativeUiAction(this.analysis, call.input, signal);
					}
				}
			}
			#executeTracing(name, input, signal) {
				if (name === "trace_call_path") {
					const parsed = enhancedInputSchemas.trace_call_path.safeParse(input);
					if (!parsed.success) return invalidEnhancedInput(name, parsed.error);
					return this.executeValidated({
						name,
						input: parsed.data
					}, signal);
				}
				const parsed = enhancedInputSchemas.trace_feature.safeParse(input);
				if (!parsed.success) return invalidEnhancedInput(name, parsed.error);
				return this.executeValidated({
					name,
					input: parsed.data
				}, signal);
			}
			#executeFunctionAnalysis(name, input, signal) {
				const parsed = nativeProcedureInputSchema.safeParse(input);
				if (!parsed.success) return invalidEnhancedInput(name, parsed.error);
				return this.executeValidated({
					name,
					input: parsed.data
				}, signal);
			}
			async #analyzeFunction(input, signal) {
				const result = await this.#call("analyze_function", input, signal);
				return result.ok ? parseFunctionDossier(result.value) : result;
			}
			async #inspectNativeApi(input, signal) {
				const result = await this.#call("analyze_function", input, signal);
				if (!result.ok) return result;
				const parsed = parseFunctionDossier(result.value);
				if (!parsed.ok) return parsed;
				return ok(jsonValueSchema.parse(projectNativeApiInspection(parsed.value)));
			}
			async #objcClasses(pattern, signal) {
				const namesExecution = await this.#observe("list_names", {}, signal);
				if (!namesExecution.ok) return namesExecution;
				const names = this.#parseAddressed("list_names", namesExecution.value.result);
				if (!names.ok) return names;
				const candidates = selectObjcClassCandidates(names.value, pattern);
				if (candidates.length === 0) return ok(projectObjcClassCandidates(candidates, {
					bindings: [],
					coverage: {
						status: "not_applicable",
						reason: null
					}
				}));
				const addresses = [...new Set(candidates.map(({ address }) => address))];
				const scannedAddresses = addresses.slice(0, MAX_DISPATCH_METADATA_RECORDS);
				const bindingsExecution = await this.#observe("inspect_native_dispatch_metadata", {
					max_records: MAX_DISPATCH_METADATA_RECORDS,
					objc_class_import_addresses: scannedAddresses,
					objc_class_import_addresses_complete: addresses.length <= MAX_DISPATCH_METADATA_RECORDS
				}, signal);
				if (!bindingsExecution.ok) {
					if (!permitsCapabilityFallback(bindingsExecution.error)) return bindingsExecution;
					return ok(projectObjcClassCandidates(candidates, {
						bindings: [],
						coverage: {
							status: "unknown",
							reason: bindingsExecution.error.reason
						}
					}));
				}
				const native = nativeDispatchMetadataResultSchema.safeParse(bindingsExecution.value.result);
				const nameSubject = namesExecution.value.subject;
				const bindingSubject = bindingsExecution.value.subject;
				const namesSelection = profileMachoTargetSelection(namesExecution.value.analysisProfile);
				const nativeSelection = native.success ? native.data.result.target_selection : undefined;
				if (!native.success || nameSubject === null || nameSubject === undefined || bindingSubject === null || bindingSubject === undefined || nameSubject.sha256 !== bindingSubject.sha256 || nameSubject.architecture === undefined || bindingSubject.architecture === undefined || nameSubject.architecture !== bindingSubject.architecture || !isMachOFormat(nameSubject.format) || nameSubject.format !== bindingSubject.format || native.data.target_sha256 !== nameSubject.sha256 || native.data.target_architecture !== nameSubject.architecture || native.data.provider.id !== bindingsExecution.value.provider.id || namesExecution.value.analysisProfile?.provider.id !== namesExecution.value.provider.id || nativeSelection === undefined || !machoTargetSelectionMatchesArchitecture(nativeSelection, nameSubject.architecture) || !machoTargetSelectionMatchesFormat(nativeSelection, nameSubject.format) || !sameMachoTargetSelection(namesSelection, nativeSelection) || native.data.result.objc_class_import_bindings === undefined || native.data.result.objc_class_import_binding_coverage === undefined) return ok(projectObjcClassCandidates(candidates, {
					bindings: [],
					coverage: {
						status: "unknown",
						reason: "Native class-import facts did not prove matching artifact, architecture, and complete producer identity."
					}
				}));
				const coverage = native.data.result.objc_class_import_binding_coverage;
				const inventoryLimitations = namesExecution.value.limitations;
				const inventoryIncomplete = inventoryLimitations.length > 0;
				const coverageReason = [coverage.reason, ...inventoryLimitations.map((limitation) => `list_names: ${limitation}`)].filter((reason) => reason !== null).join("; ");
				return ok(projectObjcClassCandidates(candidates, {
					bindings: native.data.result.objc_class_import_bindings,
					coverage: {
						status: coverage.status === "not_requested" ? "unknown" : coverage.status === "complete" && inventoryIncomplete ? "partial" : coverage.status,
						reason: coverageReason.length === 0 ? null : coverageReason
					}
				}));
			}
			async #objcProtocols(signal) {
				const names = await this.#allAddressed("list_names", signal);
				return names.ok ? ok(discoverObjcProtocols(names.value)) : names;
			}
			async #batchDecompile(addresses, signal) {
				const resolutions = [];
				for (const address of addresses) {
					const result = await resolveProcedureAddress(this.#call.bind(this), address, signal);
					if (!result.ok && isAnalysisCancellation(result.error)) return result;
					resolutions.push({
						address,
						result
					});
				}
				const identities = await this.#batchIdentities(resolutions, signal);
				if (!identities.ok) return identities;
				const decompilations = await this.#batchPseudocode(identities.value, signal);
				if (!decompilations.ok) return decompilations;
				const items = decompilations.value;
				const succeeded = items.filter(({ status }) => status === "ok").length;
				return ok({
					items,
					total: items.length,
					succeeded,
					failed: items.length - succeeded
				});
			}
			async #batchIdentities(resolutions, signal) {
				const ready = [];
				for (const { address, result } of resolutions) {
					if (!result.ok) {
						ready.push({
							address,
							providerProcedure: address,
							procedure: {
								status: "unknown",
								error: projectAnalysisError(result.error)
							}
						});
						continue;
					}
					const identity = await this.#batchProcedureIdentity(result.value, signal);
					if (!identity.ok) return identity;
					ready.push({
						address,
						providerProcedure: result.value,
						procedure: identity.value
					});
				}
				return ok(ready);
			}
			async #batchPseudocode(ready, signal) {
				const items = [];
				for (const { address, procedure, providerProcedure } of ready) {
					const result = await this.#call("procedure_pseudo_code", { procedure: providerProcedure }, signal, procedure.status === "resolved" ? "provider" : undefined);
					if (!result.ok && isAnalysisCancellation(result.error)) return err(result.error);
					const item = !result.ok ? {
						address,
						procedure,
						status: "error",
						error: projectAnalysisError(result.error)
					} : typeof result.value !== "string" || result.value.length === 0 ? {
						address,
						procedure,
						status: "error",
						error: projectAnalysisError(new AnalysisOutputError("procedure_pseudo_code", "provider returned empty pseudocode"))
					} : {
						address,
						procedure,
						status: "ok",
						pseudocode: result.value
					};
					items.push(item);
				}
				return ok(items);
			}
			async #batchProcedureIdentity(address, signal) {
				const observed = await this.#call("address_name", { address }, signal);
				if (!observed.ok && isAnalysisCancellation(observed.error)) return err(observed.error);
				const named = observed.ok && (typeof observed.value === "string" || observed.value === null);
				return ok({
					status: "resolved",
					address,
					name: named ? observed.value : null,
					...named ? {} : { name_error: projectAnalysisError(observed.ok ? new AnalysisOutputError("address_name", "provider returned an invalid entry label") : observed.error) }
				});
			}
			async #callGraph(input, signal) {
				const { relation, operation: tool } = CALL_RELATIONSHIP_TRAVERSALS[input.direction];
				const limitations = new Set();
				const resolved = await this.#observe("procedure_address", { procedure: input.address }, signal);
				if (!resolved.ok) return resolved;
				for (const limitation of resolved.value.limitations) limitations.add(limitation);
				const startAddress = resolved.value.result;
				if (typeof startAddress !== "string" || startAddress.length === 0) return err(new AnalysisOutputError("procedure_address", "provider returned no canonical procedure address"));
				const discovered = new Set([startAddress]);
				const queue = [{
					address: startAddress,
					depth: 0
				}];
				let queueIndex = 0;
				const graph = {};
				while (queueIndex < queue.length) {
					const current = queue[queueIndex++];
					if (current === undefined) continue;
					const level = String(current.depth);
					graph[level] ??= [];
					const result = await this.#observe(tool, { procedure: current.address }, signal, "provider");
					if (!result.ok) {
						if (isAnalysisCancellation(result.error)) return result;
						graph[level].push({
							address: current.address,
							status: "error",
							error: projectAnalysisError(result.error)
						});
						continue;
					}
					const related = parseRelatedAddresses(result.value.result, relation);
					if (!related.ok) {
						graph[level].push({
							address: current.address,
							status: "error",
							error: projectAnalysisError(related.error)
						});
						continue;
					}
					for (const limitation of result.value.limitations) limitations.add(limitation);
					const reportedCoverage = result.value.relationshipCoverage;
					const coverage = reportedCoverage ?? {
						status: "unknown",
						reason: "Provider did not report relationship coverage."
					};
					const relationshipLimitations = reportedCoverage === undefined ? [...result.value.limitations, "Provider did not report relationship coverage."] : [...reportedCoverage.status === "partial" ? reportedCoverage.limitations : reportedCoverage.status === "unknown" ? [reportedCoverage.reason] : [], ..."diagnostics" in reportedCoverage ? reportedCoverage.diagnostics : []];
					const nodeLimitations = [...new Set(relationshipLimitations)].sort(compareUnicodeCodePoints);
					graph[level].push({
						address: current.address,
						status: "ok",
						calls: [...related.value],
						relationship_coverage: coverage,
						...nodeLimitations.length === 0 ? {} : { limitations: nodeLimitations }
					});
					for (const address of related.value) {
						if (!discovered.has(address)) {
							discovered.add(address);
							queue.push({
								address,
								depth: current.depth + 1
							});
						}
					}
				}
				return ok({
					graph,
					limitations: [...limitations].sort(compareUnicodeCodePoints)
				});
			}
			async #analyzeSwiftTypes(input, signal) {
				const procedures = await this.#allAddressed("list_procedures", signal);
				if (!procedures.ok) return procedures;
				const symbols = await this.#allAddressed("list_names", signal);
				if (!symbols.ok && !permitsCapabilityFallback(symbols.error)) return symbols;
				const result = categorizeSwiftTypes(procedures.value, input, symbols.ok ? symbols.value : []);
				return ok(symbols.ok ? result : {
					...result,
					symbol_inventory_error: projectAnalysisError(symbols.error),
					limitations: [...result.limitations, "The provider's symbol inventory is unavailable; demangled procedures could not be joined to their Swift aliases."]
				});
			}
			async #findXrefs(name, signal) {
				const resolved = await resolveXrefsName(this.analysis, name, signal, "find_xrefs_to_name");
				if (!resolved.ok) return resolved;
				if (resolved.value === null) return ok({
					status: "unresolved",
					name,
					reason: "name_not_found"
				});
				const xrefs = await this.#call("xrefs", { address: resolved.value }, signal);
				if (!xrefs.ok) return xrefs;
				if (!Array.isArray(xrefs.value) || xrefs.value.some((xref) => typeof xref !== "string")) return err(new AnalysisOutputError("xrefs", "provider returned an invalid address list"));
				return ok({
					status: "resolved",
					name,
					address: resolved.value,
					xrefs: xrefs.value
				});
			}
			async #binaryOverview(signal) {
				const direct = await this.#call("read_binary_inventory_summary", {}, signal);
				if (direct.ok || !permitsCapabilityFallback(direct.error)) return direct;
				const document = await resolveAnalysisDocument(this.analysis, undefined, signal);
				if (!document.ok) return document;
				const [segmentsResult, proceduresResult, stringsResult] = await Promise.all([
					this.#call("list_segments", {}, signal),
					this.#call("list_procedures", {}, signal),
					this.#call("list_strings", {}, signal)
				]);
				if (!segmentsResult.ok && !permitsCapabilityFallback(segmentsResult.error)) return segmentsResult;
				if (!proceduresResult.ok) return proceduresResult;
				if (!stringsResult.ok) return stringsResult;
				const segments = segmentsResult.ok ? parseSegments(segmentsResult.value) : undefined;
				if (segments !== undefined && !segments.ok) return segments;
				const procedureCount = parseListCount(proceduresResult.value, "procedures");
				if (!procedureCount.ok) return procedureCount;
				const stringCount = parseListCount(stringsResult.value, "strings");
				if (!stringCount.ok) return stringCount;
				return ok(projectBinaryOverview({
					document: document.value,
					...segments?.ok ? { segments: segments.value } : {},
					procedure_count: procedureCount.value,
					string_count: stringCount.value
				}));
			}
			async #allAddressed(tool, signal) {
				const result = await this.#call(tool, {}, signal);
				if (!result.ok) return result;
				return this.#parseAddressed(tool, result.value);
			}
			#parseAddressed(tool, value) {
				const parsed = z.array(addressedValueSchema).safeParse(value);
				return parsed.success ? ok(parsed.data.map(({ address, value: name, objc_class_label }) => ({
					address,
					name,
					...objc_class_label === undefined ? {} : { objc_class_label }
				}))) : err(new AnalysisOutputError(tool, "provider returned an invalid inventory"));
			}
			async #call(name, arguments_, signal, selectorOrigin) {
				const execution = await this.#observe(name, arguments_, signal, selectorOrigin);
				return execution.ok ? ok(execution.value.result) : execution;
			}
			async #observe(name, arguments_, signal, selectorOrigin) {
				if (isAborted(signal)) return err(new AnalysisCancelledError(name, { cause: signal?.reason }));
				const execution = await this.analysis.execute(name, arguments_, {
					...signal === undefined ? {} : { signal },
					...selectorOrigin === undefined ? {} : { selectorOrigin }
				});
				if (!execution.ok) return execution;
				if (isAborted(signal)) return err(new AnalysisCancelledError(name, { cause: signal?.reason }));
				return execution;
			}
		};
		isAborted = (signal) => signal?.aborted === true;
	})))();
}

//#endregion
init_EnhancedTools();
export { EnhancedTools };