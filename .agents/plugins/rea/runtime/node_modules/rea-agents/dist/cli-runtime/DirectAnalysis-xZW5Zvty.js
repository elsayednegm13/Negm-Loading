import { __esmMin, __exportAll } from "./rolldown-runtime-DXoylpqc.js";
import { analysisProfileSchema, committedProviderSchema, compareUnicodeCodePoints, createEvidence, init_analysisProfile, init_evidence, init_jsonStringByteLength, init_unicodeCodePointOrder, jsonStringByteLength, withEvidenceCallerInputPath } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisInputError, AnalysisOutputError, AnalysisSnapshotMismatchError, EvidenceFileError, err, init_analysisErrorCore, init_evidenceErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { UnknownRegistryError, init_analysisErrorProjection, init_unknownRegistryError, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { dispatchQueuedInterrupts, init_queuedInterrupts } from "./AnalysisViewService-Bw-pzZ6V.js";
import { createImmutableEvidenceBundle, init_evidenceBundle, init_residualUnknown, recordUnknownInputSchema } from "./evidenceBundle-DojUFdme.js";
import { REA_WORKFLOW_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { addressedValueSchema, init_nativeInventory } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { classifyBinaryTargetFilesystemFailure, init_BinaryTargetResolver } from "./BinaryTargetResolver-QAa-W3Vx.js";
import { deliverAnalysisEvidence, init_EvidenceBundleCommands } from "./EvidenceBundleCommands-4CXG0wTt.js";
import { createAnalysisExecutionEvidence, init_analysisObservation } from "./analysisObservation-CSd7FVZY.js";
import { completeProviderEvidence, init_ProviderOperationExecution } from "./ProviderOperationExecution-DPwgddOD.js";
import { init_logger, silentLogger } from "./logger-CYsWF45U.js";
import { init_managedToolContracts, isManagedToolName } from "./managedToolContracts-depS6hrC.js";
import { ARTIFACT_ANALYSIS_OPERATIONS, init_artifactToolContracts } from "./officialToolContracts-BfPYBWaZ.js";
import { BUNDLE_RESOURCE_OPERATIONS, init_AnalysisSnapshotCache, init_BundleResourceSession, init_ProfilelessNativeWorkflowSnapshot, init_WorkflowAnalysisProfile, init_analysisSnapshot, profilelessNativeDispatchProfile, requiresNativeSourceAdmissionBeforeReplay, snapshotEvidenceForQuery, snapshotMatchesTarget, workflowAnalysisProfile } from "./BundleResourceSession-D4z66_mc.js";
import { directAnalysisCleanupFailure, init_DirectAnalysisCleanup, managedAnalysisCleanupFailure, withSessionCleanup } from "./DirectAnalysisCleanup-W8e1kyLr.js";
import { access, stat } from "node:fs/promises";

//#region dist/application/investigation/WorkflowUnknown.js
var workflowUnknownInput;
function init_WorkflowUnknown() {
	return (init_WorkflowUnknown = __esmMin((() => {
		init_residualUnknown();
		init_result();
		init_unknownRegistryError();
		workflowUnknownInput = (evidenceId, input) => {
			const question = recordUnknownInputSchema.shape.question.safeParse(input.question);
			if (!question.success) return err(new UnknownRegistryError("invalid-transition", { cause: question.error }));
			return ok({
				...input,
				question: `${question.data} (Evidence ${evidenceId})`,
				supporting_evidence_ids: [evidenceId],
				contradicting_evidence_ids: []
			});
		};
	})))();
}

//#endregion
//#region dist/application/SourceLimitations.js
var sourceLimitationKey, renderSourceLimitations;
function init_SourceLimitations() {
	return (init_SourceLimitations = __esmMin((() => {
		init_unicodeCodePointOrder();
		sourceLimitationKey = ({ provider, operation, limitation }) => JSON.stringify([
			provider.id,
			provider.name,
			provider.version,
			operation,
			limitation
		]);
		renderSourceLimitations = (limitations) => {
			const groups = new Map();
			for (const { provider, operation, limitation } of limitations) {
				const key = JSON.stringify([
					provider.id,
					provider.name,
					provider.version,
					limitation
				]);
				const group = groups.get(key) ?? {
					provider,
					limitation,
					operations: new Set()
				};
				group.operations.add(operation);
				groups.set(key, group);
			}
			return [...groups.values()].map(({ provider, limitation, operations }) => {
				const version = provider.version === null ? "" : ` ${provider.version}`;
				const operationList = [...operations].sort(compareUnicodeCodePoints);
				return `${provider.name} (${provider.id}${version}) ${operationList.join(", ")}: ${limitation}`;
			}).sort(compareUnicodeCodePoints);
		};
	})))();
}

//#endregion
//#region dist/application/WorkflowEvidence.js
var DECOMPILE_ALL_LIMITATIONS, composedLimitationBudget, executeComposedWorkflow, createWorkflowEvidence, batchProcedureLocations, workflowSnapshotRecord, recordWorkflowUnknowns;
function init_WorkflowEvidence() {
	return (init_WorkflowEvidence = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_jsonStringByteLength();
		init_investigationProviders();
		init_WorkflowAnalysisProfile();
		init_result();
		init_analysisProfile();
		init_evidence();
		init_unknownRegistryError();
		init_WorkflowUnknown();
		init_SourceLimitations();
		DECOMPILE_ALL_LIMITATIONS = {
			perItemOperations: new Set(["procedure_info", "procedure_pseudo_code"]),
			maxDistinct: 8,
			retainedIn: "each function's record in decompile-index.json keeps the caveats of the observations it used"
		};
		composedLimitationBudget = (operation) => operation === "decompile_all" ? DECOMPILE_ALL_LIMITATIONS : undefined;
		executeComposedWorkflow = async (analysis, execute, budget) => {
			const limitations = new Map();
			const evidenceLinks = new Set();
			const perItemGroups = new Set();
			let perItemBytes = 0;
			let omittedObservations = 0;
			let cachePolicy;
			const result = await execute({
				resourceScope: analysis.resourceScope,
				execute: async (operation, parameters, options) => {
					const execution = await analysis.execute(operation, parameters, options);
					if (execution.ok && execution.value.evidenceId !== undefined) evidenceLinks.add(execution.value.evidenceId);
					if (execution.ok && execution.value.cachePolicy === "live") cachePolicy = "live";
					if (execution.ok) for (const limitation of execution.value.limitations) {
						const fact = {
							provider: execution.value.provider,
							operation,
							limitation
						};
						if (budget?.perItemOperations.has(operation) === true) {
							const maxBytes = budget.maxBytes ?? 8e3;
							const bytes = jsonStringByteLength(limitation, maxBytes);
							if (bytes > maxBytes) {
								omittedObservations += 1;
								continue;
							}
							const group = JSON.stringify([
								fact.provider.id,
								fact.provider.name,
								fact.provider.version,
								limitation
							]);
							if (!perItemGroups.has(group)) {
								if (perItemGroups.size >= budget.maxDistinct || perItemBytes + bytes > maxBytes) {
									omittedObservations += 1;
									continue;
								}
								perItemGroups.add(group);
								perItemBytes += bytes;
							}
						}
						limitations.set(sourceLimitationKey(fact), fact);
					}
					return execution;
				}
			});
			if (!result.ok) return result;
			return ok({
				result: result.value,
				limitations: [...renderSourceLimitations([...limitations.values()]), ...omittedObservations === 0 ? [] : [`${omittedObservations} per-item provider limitation observation${omittedObservations === 1 ? " was" : "s were"} omitted from this answer; ${budget?.retainedIn}.`]],
				...cachePolicy === undefined ? {} : { cachePolicy },
				...evidenceLinks.size === 0 ? {} : { evidenceLinks: [...evidenceLinks].sort(compareUnicodeCodePoints) }
			});
		};
		createWorkflowEvidence = (input) => createEvidence(input.target, REA_WORKFLOW_PROVIDER, {
			operation: input.operation,
			parameters: input.parameters,
			result: input.result,
			...input.upstreamProfile === undefined ? {} : { analysisProfile: workflowAnalysisProfile(input.upstreamProfile, input.operation) },
			confidence: "derived",
			...input.upstreamEvidenceLinks === undefined ? {} : { evidenceLinks: input.upstreamEvidenceLinks },
			limitations: ["Derived by an REA composed workflow.", ...input.upstreamLimitations],
			...input.operation === "batch_decompile" ? { locations: batchProcedureLocations(input.result) } : {}
		});
		batchProcedureLocations = (result) => {
			if (result === null || typeof result !== "object" || Array.isArray(result) || !Array.isArray(result.items)) return [];
			const addresses = new Set();
			for (const item of result.items) {
				if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
				const procedure = item.procedure;
				if (procedure !== null && typeof procedure === "object" && !Array.isArray(procedure) && procedure.status === "resolved" && typeof procedure.address === "string") addresses.add(procedure.address);
			}
			return [...addresses].map((address) => ({
				kind: "address",
				address
			}));
		};
		workflowSnapshotRecord = (evidence, operation, bindingProfile, cachePolicy) => {
			if (evidence.analysis_profile === null || bindingProfile === undefined || cachePolicy === "live") return undefined;
			return {
				operation,
				bindingProfile,
				parameters: evidence.parameters,
				execution: {
					result: evidence.normalized_result,
					rawResult: evidence.raw_result,
					provider: committedProviderSchema.parse(evidence.provider),
					analysisProfile: analysisProfileSchema.parse(evidence.analysis_profile),
					limitations: evidence.limitations,
					locations: evidence.locations,
					subject: evidence.subject === null ? null : {
						path: evidence.subject.local_path,
						sha256: evidence.subject.digest.sha256,
						format: evidence.subject.format,
						...evidence.subject.architecture === null ? {} : { architecture: evidence.subject.architecture }
					}
				}
			};
		};
		recordWorkflowUnknowns = ({ name, result, evidenceId, recordUnknown }) => {
			if (![
				"trace_feature",
				"trace_call_path",
				"inspect_native_api"
			].includes(name) || recordUnknown === undefined || typeof result !== "object" || result === null || Array.isArray(result) || !Array.isArray(result.residual_unknowns)) return {
				ok: true,
				value: null
			};
			for (const question of result.residual_unknowns) {
				if (typeof question !== "string") continue;
				const input = workflowUnknownInput(evidenceId, {
					question,
					severity: "medium",
					domain: name === "inspect_native_api" ? "native-api" : "control-flow",
					required_authority: "shipped-artifact",
					required_confidence: "observed",
					required_environment: null,
					recommended_probes: [{
						operation: name,
						rationale: name === "inspect_native_api" ? "Confirm the unsupported boundary with a capable provider or ABI probe." : "Continue with a focused query or another available provider."
					}],
					relationships: []
				});
				if (!input.ok) return input;
				const recorded = recordUnknown(input.value);
				if (!recorded.ok && !(recorded.error instanceof UnknownRegistryError && recorded.error.reason === "already-exists")) return recorded;
			}
			return {
				ok: true,
				value: null
			};
		};
	})))();
}

//#endregion
//#region dist/application/ProcedureAddressResolution.js
var resolveProcedureAddress;
function init_ProcedureAddressResolution() {
	return (init_ProcedureAddressResolution = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		resolveProcedureAddress = async (call, procedure, signal) => {
			const result = await call("procedure_address", { procedure }, signal);
			if (!result.ok) return result;
			return typeof result.value === "string" && result.value.length > 0 ? ok(result.value) : err(new AnalysisOutputError("procedure_address", "provider returned no canonical procedure address"));
		};
	})))();
}

//#endregion
//#region dist/application/XrefsAddressResolution.js
var resolveXrefsAddress, resolveXrefsName;
function init_XrefsAddressResolution() {
	return (init_XrefsAddressResolution = __esmMin((() => {
		init_nativeInventory();
		init_analysisErrorCore();
		init_result();
		init_ProcedureAddressResolution();
		resolveXrefsAddress = async (analysis, selector, signal) => {
			if (selector.length === 0 || /^[0-9a-f]+$/iu.test(selector) || /^0x/iu.test(selector) || /:0x/iu.test(selector)) return ok(selector);
			const named = await resolveXrefsName(analysis, selector, signal);
			if (!named.ok) return named;
			return named.value !== null ? ok(named.value) : err(new AnalysisInputError("xrefs", undefined, [{
				path: ["address"],
				reason: "invalid_value",
				message: `Unknown analyzed symbol name ${JSON.stringify(selector)}. Use an exact analyzed name or a hexadecimal address.`
			}]));
		};
		resolveXrefsName = async (analysis, selector, signal, operation = "xrefs") => {
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			const inventory = await analysis.execute("list_names", {}, signal === undefined ? {} : { signal });
			if (!inventory.ok) {
				if (operation === "xrefs" && inventory.error instanceof AnalysisCapabilityUnavailableError && inventory.error.operation === "list_names" && !inventory.error.cleanupIncomplete) return resolveProcedureAddress(async (operation, parameters, signal) => {
					const result = await analysis.execute(operation, parameters, signal === undefined ? {} : { signal });
					return result.ok ? ok(result.value.result) : result;
				}, selector, signal);
				return inventory;
			}
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			if (!Array.isArray(inventory.value.result)) return err(new AnalysisOutputError("list_names", "Expected a symbol inventory array"));
			const addresses = new Set();
			for (const [index, item] of inventory.value.result.entries()) {
				const parsed = addressedValueSchema.safeParse(item);
				if (!parsed.success || parsed.data.address.length === 0) return err(new AnalysisOutputError("list_names", `Invalid symbol inventory entry at index ${index}`));
				if (parsed.data.value === selector) addresses.add(parsed.data.address);
			}
			const [address] = addresses;
			if (addresses.size <= 1) return ok(address ?? null);
			return err(new AnalysisInputError(operation, undefined, [{
				path: [operation === "xrefs" ? "address" : "name"],
				reason: "invalid_value",
				message: `Analyzed symbol name ${JSON.stringify(selector)} is ambiguous at ${[...addresses].sort().join(", ")}. Select an exact address.`
			}]));
		};
	})))();
}

//#endregion
//#region dist/application/DirectAnalysis.js
var DirectAnalysis_exports = /* @__PURE__ */ __exportAll({
	runDirectAnalysis: () => runDirectAnalysis,
	runManagedProviderExecution: () => runManagedProviderExecution,
	runProviderAnalysis: () => runProviderAnalysis
});
var NATIVE_INSPECTION_OPERATIONS, ARTIFACT_ANALYSIS_OPERATION_SET, runDirectAnalysis, runProviderAnalysis, runManagedProviderExecution, runManagedProviderAnalysis, runAnalysis, executeAnalysisTool, withProcessCancellation, prepareSnapshot, inspectBundleResourceInput, allowsSnapshotReplay, analysisProfileForRoute, nativeDispatchBindingProfile, providerIdentityForRoute, analysisProfileForEvidence, isWorkflowEvidenceTool, fileExists, cliError;
function init_DirectAnalysis() {
	return (init_DirectAnalysis = __esmMin((() => {
		init_queuedInterrupts();
		init_logger();
		init_evidence();
		init_evidenceBundle();
		init_artifactToolContracts();
		init_managedToolContracts();
		init_evidenceErrors();
		init_analysisErrorProjection();
		init_callerPath();
		init_AnalysisSnapshotCache();
		init_BinaryTargetResolver();
		init_analysisSnapshot();
		init_ProfilelessNativeWorkflowSnapshot();
		init_result();
		init_analysisObservation();
		init_investigationProviders();
		init_WorkflowAnalysisProfile();
		init_WorkflowEvidence();
		init_XrefsAddressResolution();
		init_analysisErrorCore();
		init_EvidenceBundleCommands();
		init_DirectAnalysisCleanup();
		init_ProviderOperationExecution();
		init_BundleResourceSession();
		NATIVE_INSPECTION_OPERATIONS = new Set([
			"inspect_macho",
			"inspect_signature",
			"list_architectures",
			"inspect_plist",
			"demangle_swift"
		]);
		ARTIFACT_ANALYSIS_OPERATION_SET = new Set(ARTIFACT_ANALYSIS_OPERATIONS);
		runDirectAnalysis = async (dependencies, path, tool, arguments_, options = {}) => withProcessCancellation(options.signal, (signal) => runAnalysis(dependencies, path, tool, arguments_, {
			logger: options.logger ?? silentLogger,
			snapshotPath: options.snapshotPath,
			signal,
			...options.formatHint === undefined ? {} : { formatHint: options.formatHint },
			...options.architecture === undefined ? {} : { architecture: options.architecture },
			...options.entryPoint === undefined ? {} : { entryPoint: options.entryPoint },
			...options.providerId === undefined ? {} : { providerId: options.providerId }
		}));
		runProviderAnalysis = async (dependencies, ...[path, tool, arguments_, logger = silentLogger, signal, delivery]) => {
			if (delivery !== undefined && tool !== "inspect_managed_members") return cliError(new AnalysisInputError(tool, undefined, [{
				path: ["delivery"],
				reason: "invalid_value",
				message: "Evidence delivery options are only supported by inspect_managed_members"
			}]));
			if (delivery?.detail === "summary" && delivery.evidenceBundlePath === undefined) return cliError(new AnalysisInputError(tool, undefined, [{
				path: ["evidence_bundle"],
				reason: "missing_argument",
				message: "summary detail requires --evidence-bundle so complete Evidence remains available to later CLI commands"
			}]));
			return withProcessCancellation(signal, async (operationSignal) => {
				const evidenceParameters = {
					...arguments_,
					input_path: path
				};
				if (isManagedToolName(tool)) {
					const original = await runManagedProviderAnalysis(dependencies, path, tool, arguments_, evidenceParameters, operationSignal);
					await dispatchQueuedInterrupts();
					if (!original.ok) return cliError(original.error);
					const evidence = withEvidenceCallerInputPath(original.value, path);
					if (operationSignal.aborted) return cliError(new AnalysisCancelledError(tool, {
						cause: operationSignal.reason,
						partialObservation: evidence
					}));
					const result = delivery?.evidenceBundlePath === undefined ? ok(evidence) : await deliverAnalysisEvidence(evidence, delivery.evidenceBundlePath, delivery.detail, operationSignal);
					return result.ok ? result.value : cliError(result.error);
				}
				return runAnalysis(dependencies, path, tool, arguments_, {
					logger,
					snapshotPath: undefined,
					signal: operationSignal,
					evidenceParameters,
					...ARTIFACT_ANALYSIS_OPERATION_SET.has(tool) ? { createSession: dependencies.createArtifactBinarySession } : NATIVE_INSPECTION_OPERATIONS.has(tool) ? { createSession: dependencies.createNativeBinarySession } : {}
				});
			});
		};
		runManagedProviderExecution = async (dependencies, path, tool, signal, parameters = {}) => withProcessCancellation(signal, async (operationSignal) => {
			const session = await dependencies.createManagedBinarySession();
			return withSessionCleanup(session, async () => {
				const opened = await session.open(path, { signal: operationSignal });
				if (!opened.ok) return opened;
				return await session.execute(tool, parameters, { signal: operationSignal });
			}, managedAnalysisCleanupFailure);
		});
		runManagedProviderAnalysis = async (dependencies, path, tool, arguments_, evidenceParameters, signal) => {
			const execution = await runManagedProviderExecution(dependencies, path, tool, signal, arguments_);
			if (!execution.ok) return execution;
			const value = execution.value;
			return ok(createAnalysisExecutionEvidence(tool, evidenceParameters, value, "observed", { immutable: true }));
		};
		runAnalysis = async (dependencies, path, tool, arguments_, options) => {
			const { logger, signal, snapshotPath } = options;
			const evidenceParameters = options.evidenceParameters ?? arguments_;
			let session;
			if (options.createSession !== undefined) {
				session = await options.createSession();
			} else {
				const config = dependencies.readConfiguration();
				if (!config.ok) return cliError(config.error);
				session = await (tool === "inspect_native_dispatch_metadata" && snapshotPath === undefined ? dependencies.createNativeDispatchBinarySession : dependencies.createBinarySession)(config.value, logger);
			}
			let publishedSnapshot;
			const execute = async () => {
				let isDirectory = false;
				if (BUNDLE_RESOURCE_OPERATIONS.has(tool)) {
					const inspected = await inspectBundleResourceInput(path);
					if (!inspected.ok) return err(inspected.error);
					isDirectory = inspected.value;
				}
				if (BUNDLE_RESOURCE_OPERATIONS.has(tool) && isDirectory) {
					const opened = await session.openBundleResources(path, { signal });
					if (!opened.ok) return err(opened.error);
					const execution = await session.execute(tool, arguments_, { signal });
					if (!execution.ok) return err(execution.error);
					return ok(withEvidenceCallerInputPath(createAnalysisExecutionEvidence(tool, evidenceParameters, execution.value, "observed"), path));
				}
				const prepared = await prepareSnapshot({
					session,
					path,
					snapshotPath,
					signal,
					...options.formatHint === undefined ? {} : { formatHint: options.formatHint },
					...options.architecture === undefined ? {} : { architecture: options.architecture },
					...options.entryPoint === undefined ? {} : { entryPoint: options.entryPoint }
				});
				if (!prepared.ok) return err(prepared.error);
				const { snapshot } = prepared.value;
				let resolvedTarget;
				if (snapshot !== undefined && prepared.value.target !== undefined) {
					const preview = await session.previewTarget(prepared.value.target, {
						signal,
						snapshot,
						...options.formatHint === undefined ? {} : { formatHint: options.formatHint },
						...options.architecture === undefined ? {} : { architecture: options.architecture },
						...options.entryPoint === undefined ? {} : { entryPoint: options.entryPoint },
						...options.providerId === undefined ? {} : { providerId: options.providerId }
					});
					if (!preview.ok) return err(preview.error);
					resolvedTarget = preview.value;
					const route = preview.value.route;
					const bindingProfile = route.profile ?? nativeDispatchBindingProfile(route, tool);
					const evidenceProfile = analysisProfileForRoute(route, tool);
					if (bindingProfile !== undefined && evidenceProfile !== undefined && !requiresNativeSourceAdmissionBeforeReplay(route.binding?.identity.id) && allowsSnapshotReplay(route, tool)) {
						const cached = snapshotEvidenceForQuery(snapshot, {
							target: preview.value.target,
							bindingProfile,
							operation: tool,
							parameters: arguments_,
							provider: isWorkflowEvidenceTool(tool) ? REA_WORKFLOW_PROVIDER : providerIdentityForRoute(route, tool),
							evidenceProfile
						});
						if (cached !== undefined) return ok(withEvidenceCallerInputPath(cached, path));
					}
				}
				const openOptions = {
					signal,
					...options.formatHint === undefined ? {} : { formatHint: options.formatHint },
					...options.architecture === undefined ? {} : { architecture: options.architecture },
					...options.entryPoint === undefined ? {} : { entryPoint: options.entryPoint },
					...snapshot === undefined ? {} : { snapshot },
					...options.providerId === undefined ? {} : { providerId: options.providerId }
				};
				const opened = resolvedTarget === undefined ? await session.open(path, openOptions) : await session.openResolvedTarget(resolvedTarget, openOptions);
				if (!opened.ok) return err(opened.error);
				const evidenceProfile = analysisProfileForEvidence(session, tool);
				const executed = await executeAnalysisTool({
					session,
					openedTarget: opened.value,
					tool,
					arguments: arguments_,
					evidenceParameters,
					signal,
					evidenceProfile
				});
				if (!executed.ok) return executed;
				const { cachePolicy } = executed.value;
				const evidence = withEvidenceCallerInputPath(executed.value.evidence, path);
				const recorded = session.importEvidenceBundle(createImmutableEvidenceBundle([evidence]));
				if (!recorded.ok) return err(recorded.error.retainPartialObservation(evidence));
				if (isWorkflowEvidenceTool(tool)) {
					const unknowns = recordWorkflowUnknowns({
						name: tool,
						result: evidence.normalized_result,
						evidenceId: evidence.evidence_id,
						recordUnknown: (unknown) => session.recordUnknown(unknown)
					});
					if (!unknowns.ok) return err(unknowns.error.retainPartialObservation(evidence));
				}
				if (isWorkflowEvidenceTool(tool) && tool !== "trace_native_ui_action" && snapshotPath !== undefined && session.allowsSnapshotReplay(tool)) {
					const workflowRecord = workflowSnapshotRecord(evidence, tool, evidenceProfile, cachePolicy);
					if (workflowRecord !== undefined) {
						const recorded = session.recordWorkflowSnapshot(workflowRecord);
						if (!recorded.ok) return err(recorded.error.retainPartialObservation(evidence));
					}
				}
				if (tool !== "trace_native_ui_action" && tool !== "decompile_all" && snapshotPath !== undefined) {
					const snapshot = session.exportAnalysisSnapshot();
					if (!snapshot.ok) return err(snapshot.error.retainPartialObservation(evidence));
					const written = await session.writeAnalysisSnapshot(snapshot.value, snapshotPath, true);
					if (written.ok) publishedSnapshot = written.value;
					else {
						if (written.error instanceof EvidenceFileError) publishedSnapshot = written.error.published;
						const recovered = written.error instanceof EvidenceFileError && written.error.published !== undefined && (await session.closeFileResources()).ok;
						if (!recovered) return err(written.error.retainPartialObservation(evidence));
					}
				}
				return ok(evidence);
			};
			const outcome = await withSessionCleanup(session, async () => ({ result: await execute() }), (value, cleanupError) => ({
				...value,
				cleanupError
			}));
			await dispatchQueuedInterrupts();
			const result = outcome.result.ok ? completeProviderEvidence(outcome.result.value, signal) : outcome.result;
			if (!result.ok && publishedSnapshot !== undefined) result.error.retainDiagnostics({ analysis_snapshot: { ...publishedSnapshot } });
			if (outcome.cleanupError !== undefined) {
				if (result.ok && publishedSnapshot !== undefined) outcome.cleanupError.retainDiagnostics({ analysis_snapshot: { ...publishedSnapshot } });
				return directAnalysisCleanupFailure(result, outcome.cleanupError);
			}
			return result.ok ? result.value : cliError(result.error);
		};
		executeAnalysisTool = async (input) => {
			const { session, tool, signal, evidenceProfile } = input;
			if (tool === "analyze_function") {
				const { executeFunctionAnalysisEvidence } = await import("./application__FunctionAnalysisEvidence-CCrDjpI9.js");
				const result = await executeFunctionAnalysisEvidence(session, input.arguments, input.openedTarget, { signal });
				return result.ok ? ok({ evidence: result.value }) : result;
			}
			if (tool === "binary_overview" || tool === "inspect_native_api" || tool === "inspect_native_dispatch_metadata" || tool === "trace_feature" || tool === "trace_native_values" || tool === "trace_native_ui_action" || tool === "decompile_all") {
				const { EnhancedTools } = await import("./application__EnhancedTools-B3leQcFv.js");
				const result = await executeComposedWorkflow(session, (observed) => new EnhancedTools(observed).execute(tool, input.arguments, signal), composedLimitationBudget(tool));
				if (!result.ok) return result;
				const evidence = createWorkflowEvidence({
					target: input.openedTarget,
					operation: tool,
					parameters: input.evidenceParameters,
					result: result.value.result,
					upstreamProfile: evidenceProfile,
					upstreamLimitations: result.value.limitations,
					...result.value.evidenceLinks === undefined ? {} : { upstreamEvidenceLinks: result.value.evidenceLinks }
				});
				return ok({
					evidence,
					...result.value.cachePolicy === undefined ? {} : { cachePolicy: result.value.cachePolicy }
				});
			}
			let result = await session.execute(tool, input.arguments, { signal });
			if (tool === "xrefs" && typeof input.arguments.address === "string" && !result.ok && result.error instanceof AnalysisInputError && !result.error.cleanupIncomplete && result.error.issues.length > 0 && result.error.issues.every(({ path, reason }) => path.length === 1 && path[0] === "address" && reason === "invalid_format")) {
				const address = await resolveXrefsAddress(session, input.arguments.address, signal);
				if (!address.ok) return address;
				if (address.value !== input.arguments.address) result = await session.execute(tool, {
					...input.arguments,
					address: address.value
				}, { signal });
			}
			if (!result.ok) return result;
			const evidence = createAnalysisExecutionEvidence(tool, input.evidenceParameters, {
				...result.value,
				subject: result.value.subject === undefined ? input.openedTarget : result.value.subject
			}, "observed");
			return ok({ evidence });
		};
		withProcessCancellation = async (suppliedSignal, operation) => {
			if (suppliedSignal !== undefined) return operation(suppliedSignal);
			const controller = new AbortController();
			const cancel = () => controller.abort();
			process.on("SIGINT", cancel);
			process.on("SIGTERM", cancel);
			try {
				return await operation(controller.signal);
			} finally {
				process.off("SIGINT", cancel);
				process.off("SIGTERM", cancel);
			}
		};
		prepareSnapshot = async (options) => {
			const { path, snapshotPath, session } = options;
			if (snapshotPath === undefined || !await fileExists(snapshotPath)) return ok({});
			const loaded = await session.readAnalysisSnapshot(snapshotPath, options.signal);
			if (!loaded.ok) return loaded;
			const target = await session.resolveTarget(path, {
				signal: options.signal,
				...options.formatHint === undefined ? {} : { formatHint: options.formatHint },
				...options.architecture === undefined ? {} : { architecture: options.architecture },
				...options.entryPoint === undefined ? {} : { entryPoint: options.entryPoint }
			});
			if (!target.ok) return target;
			if (!snapshotMatchesTarget(loaded.value.target, target.value)) return err(new AnalysisSnapshotMismatchError("Analysis snapshot target does not match the requested binary"));
			return ok({
				snapshot: loaded.value,
				target: target.value
			});
		};
		inspectBundleResourceInput = async (path) => {
			const callerPath = absoluteCallerPath(path);
			try {
				return ok((await stat(callerPath)).isDirectory());
			} catch (cause) {
				const failure = classifyBinaryTargetFilesystemFailure(callerPath, cause);
				if (failure !== undefined) return err(failure);
				throw cause;
			}
		};
		allowsSnapshotReplay = (route, tool) => {
			if (tool === "trace_native_ui_action" || tool === "decompile_all") return false;
			const descriptor = route.capabilities?.get(tool);
			return descriptor === undefined ? ![...route.capabilities?.values() ?? []].some(({ cachePolicy }) => cachePolicy === "live") : descriptor.cachePolicy !== "live";
		};
		analysisProfileForRoute = (route, tool) => {
			const profile = route.profile;
			const nativeDispatchProfile = profile === null || profile === undefined ? nativeDispatchBindingProfile(route, tool) : undefined;
			if (profile === null || profile === undefined) {
				if (nativeDispatchProfile === undefined) return undefined;
				return isWorkflowEvidenceTool(tool) ? workflowAnalysisProfile(nativeDispatchProfile, tool) : nativeDispatchProfile;
			}
			if (isWorkflowEvidenceTool(tool)) return workflowAnalysisProfile(profile, tool);
			const provider = providerIdentityForRoute(route, tool);
			return provider.id === profile.provider.id ? profile : undefined;
		};
		nativeDispatchBindingProfile = (route, operation) => {
			if (operation !== "inspect_native_dispatch_metadata") return undefined;
			return profilelessNativeDispatchProfile(route);
		};
		providerIdentityForRoute = (route, operation) => route.capabilities?.get(operation)?.provider ?? route.identity;
		analysisProfileForEvidence = (session, tool) => {
			if (!isWorkflowEvidenceTool(tool)) return session.analysisProfile(tool);
			return session.analysisProfile() ?? session.analysisProfile(tool);
		};
		isWorkflowEvidenceTool = (tool) => tool === "binary_overview" || tool === "inspect_native_api" || tool === "inspect_native_dispatch_metadata" || tool === "trace_feature" || tool === "trace_native_values" || tool === "trace_native_ui_action" || tool === "decompile_all";
		fileExists = async (path) => {
			try {
				await access(path);
				return true;
			} catch (cause) {
				if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT") return false;
				throw cause;
			}
		};
		cliError = (error) => ({
			error: "Analysis failed",
			...projectAnalysisError(error)
		});
	})))();
}

//#endregion
export { DirectAnalysis_exports, init_DirectAnalysis, init_ProcedureAddressResolution, init_SourceLimitations, init_XrefsAddressResolution, renderSourceLimitations, resolveProcedureAddress, resolveXrefsName };