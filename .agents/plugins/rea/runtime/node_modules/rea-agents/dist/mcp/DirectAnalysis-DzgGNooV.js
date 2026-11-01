import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError, o as AnalysisInputError } from "./analysisErrorCore-Cl6H9zyu.js";
import { C as AnalysisSnapshotMismatchError, D as init_evidenceErrors, n as projectAnalysisError, t as init_analysisErrorProjection, w as EvidenceFileError } from "./analysisErrorProjection-CbRgJX1L.js";
import { n as ArtifactResourceScope, r as init_ArtifactResourceScope } from "./ArtifactResourceScope-B-bNzT_G.js";
import { i as jsonValueSchema, n as init_jsonValue } from "./jsonValue-CvnZ7JX6.js";
import { c as init_evidence, h as withEvidenceCallerInputPath } from "./evidence-CctoaA7x.js";
import { n as init_logger, r as silentLogger } from "./logger-Brcs2SlV.js";
import { $a as requireAuthenticationHeadroom, Ga as init_EvidenceBundleFiles, Ja as writeEvidenceBundle, Ka as readEvidenceBundle, Qa as init_JsonAuthenticationHeadroom, Ua as init_AnalysisViewService, Wa as inspectAnalysisViewValidated, ao as workflowSnapshotRecord, co as dispatchQueuedInterrupts, eo as composedLimitationBudget, io as recordWorkflowUnknowns, lo as init_queuedInterrupts, no as executeComposedWorkflow, oo as init_WorkflowAnalysisProfile, qa as readImmutableEvidenceBundle, ro as init_WorkflowEvidence, so as workflowAnalysisProfile, to as createWorkflowEvidence } from "./createServer-CoLFsKLA.js";
import { G as compareBundles, Gl as createImmutableEvidenceBundle, Jl as init_evidenceBundle, K as init_bundleComparison, ms as readArtifactInspectionSources, ps as init_artifactInspection } from "./toolOutputSchemaGroups-BS_G8lPZ.js";
import { a as init_artifactToolContracts, t as ARTIFACT_ANALYSIS_OPERATIONS } from "./artifactToolContracts-JSJ7iYiL.js";
import { a as init_managedToolContracts, o as isManagedToolName } from "./dosCom-DJNHa1_S.js";
import { D as init_callerPath, E as absoluteCallerPath } from "./propertyListKeys-CXTE49rA.js";
import { S as snapshotMatchesTarget, a as init_BundleResourceSession, b as snapshotEvidenceForQuery, d as profilelessNativeDispatchProfile, g as init_analysisSnapshot, h as requiresNativeSourceAdmissionBeforeReplay, l as init_ProfilelessNativeWorkflowSnapshot, p as init_AnalysisSnapshotCache, r as BUNDLE_RESOURCE_OPERATIONS } from "./BundleResourceSession-Cc80orbz.js";
import { n as init_BinaryTargetResolver, t as classifyBinaryTargetFilesystemFailure } from "./BinaryTargetResolver-CB8weKn1.js";
import { O as init_investigationProviders, w as REA_WORKFLOW_PROVIDER } from "./investigationProviders-BEyOhcOM.js";
import { n as init_analysisObservation, t as createAnalysisExecutionEvidence } from "./analysisObservation-Pmwgohm9.js";
import { n as resolveXrefsAddress, t as init_XrefsAddressResolution } from "./XrefsAddressResolution-CeqYz6pY.js";
import { i as withSessionCleanup, n as init_DirectAnalysisCleanup, r as managedAnalysisCleanupFailure, t as directAnalysisCleanupFailure } from "./DirectAnalysisCleanup-D2DO7dIp.js";
import { r as init_ProviderOperationExecution, t as completeProviderEvidence } from "./ProviderOperationExecution-BJOaEjEp.js";
import { access, stat } from "node:fs/promises";

//#region dist/application/EvidenceBundleCommands.js
var importEvidenceBundleCommand, exportEvidenceBundleCommand, deliverAnalysisEvidence, publishEvidenceDelivery, persistEvidenceBundleCommand, compareEvidenceBundlesCommand, projectWrite;
function init_EvidenceBundleCommands() {
	return (init_EvidenceBundleCommands = __esmMin((() => {
		init_artifactInspection();
		init_queuedInterrupts();
		init_callerPath();
		init_JsonAuthenticationHeadroom();
		init_evidenceErrors();
		init_analysisErrorCore();
		init_evidence();
		init_evidenceBundle();
		init_jsonValue();
		init_result();
		init_bundleComparison();
		init_ArtifactResourceScope();
		init_EvidenceBundleFiles();
		init_AnalysisViewService();
		importEvidenceBundleCommand = async (path) => {
			const loaded = await readEvidenceBundle(path, undefined, undefined, "import_evidence_bundle");
			if (!loaded.ok) return loaded;
			return ok({
				imported: loaded.value.records.length,
				unknowns_added: loaded.value.unknowns.length,
				total: loaded.value.records.length
			});
		};
		exportEvidenceBundleCommand = async (sourcePath, outputPath, overwrite) => {
			const loaded = await readImmutableEvidenceBundle(sourcePath, undefined, undefined, "export_evidence_bundle");
			if (!loaded.ok) return loaded;
			return projectWrite(loaded.value, await persistEvidenceBundleCommand(loaded.value, outputPath, overwrite));
		};
		deliverAnalysisEvidence = async (evidence, outputPath, detail = "complete", signal) => {
			const headroom = requireAuthenticationHeadroom(evidence, {
				operation: evidence.operation,
				path: absoluteCallerPath(outputPath),
				description: "Insufficient heap headroom to authenticate the complete parent Evidence"
			});
			if (!headroom.ok) return err(headroom.error.retainPartialObservation(evidence));
			const sourceEvidence = evidence.operation === "inspect_artifact" ? readArtifactInspectionSources(evidence.normalized_result) : ok([]);
			if (!sourceEvidence.ok) return err(sourceEvidence.error.retainPartialObservation(evidence));
			const bundle = createImmutableEvidenceBundle([...sourceEvidence.value, evidence]);
			const delivered = detail === "summary" ? inspectAnalysisViewValidated({
				source: {
					kind: "retained-evidence",
					evidence_id: evidence.evidence_id
				},
				view: { kind: "summary" }
			}, (id) => bundle.records.find((record) => record.evidence_id === id)) : ok(evidence);
			if (!delivered.ok) return delivered;
			const selected = detail === "summary" && evidence.caller_input_path !== undefined ? withEvidenceCallerInputPath(delivered.value, evidence.caller_input_path) : delivered.value;
			const published = await publishEvidenceDelivery({
				bundle,
				complete: evidence,
				delivered: selected,
				outputPath,
				operation: evidence.operation,
				signal
			});
			return published.ok ? ok(published.value.delivered) : published;
		};
		publishEvidenceDelivery = async (input) => {
			const { signal, operation } = input;
			const written = await persistEvidenceBundleCommand(input.bundle, input.outputPath, false, signal, operation);
			await dispatchQueuedInterrupts();
			if (!written.ok) {
				const original = written.error;
				const failure = original instanceof EvidenceFileError && original.reason === "exists" ? new EvidenceFileError(original.operation, original.reason, {
					cause: original,
					...original.path === undefined ? {} : { path: original.path },
					userMessage: "Evidence file already exists. Choose another output path.",
					cleanup: original.cleanup,
					diagnostics: original.diagnostics
				}).bindCleanupDependencies([original]) : original;
				return err(failure.retainPartialObservation(input.complete));
			}
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, {
				cause: signal.reason,
				partialObservation: input.delivered,
				diagnostics: { evidence_bundle: { ...written.value } }
			}));
			return ok({
				delivered: input.delivered,
				evidenceBundle: written.value
			});
		};
		persistEvidenceBundleCommand = async (bundle, outputPath, overwrite, signal, operation) => {
			const resources = new ArtifactResourceScope();
			const written = await writeEvidenceBundle(bundle, outputPath, overwrite, resources, signal, operation);
			if (written.ok) return written;
			await resources.close().catch(() => undefined);
			if (!written.error.cleanupIncomplete && written.error instanceof EvidenceFileError && written.error.published) {
				return ok(written.error.published);
			}
			return written;
		};
		compareEvidenceBundlesCommand = async (input) => {
			const [left, right] = await Promise.all([readImmutableEvidenceBundle(input.leftPath, undefined, undefined, "compare_bundles"), readImmutableEvidenceBundle(input.rightPath, undefined, undefined, "compare_bundles")]);
			if (!left.ok) return left;
			if (!right.ok) return right;
			try {
				return ok(jsonValueSchema.parse(compareBundles(left.value, right.value, input.recordPairs)));
			} catch (cause) {
				if (cause instanceof AnalysisInputError) return err(cause);
				throw cause;
			}
		};
		projectWrite = (bundle, written) => written.ok ? ok({
			path: written.value.path,
			bytes: written.value.bytes,
			records: bundle.records.length
		}) : err(written.error);
	})))();
}

//#endregion
//#region dist/application/DirectAnalysis.js
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
				const { executeFunctionAnalysisEvidence } = await import("./createServer-CoLFsKLA.js").then((n) => (n.yi(), n.vi));
				const result = await executeFunctionAnalysisEvidence(session, input.arguments, input.openedTarget, { signal });
				return result.ok ? ok({ evidence: result.value }) : result;
			}
			if (tool === "binary_overview" || tool === "inspect_native_api" || tool === "inspect_native_dispatch_metadata" || tool === "trace_feature" || tool === "trace_native_values" || tool === "trace_native_ui_action" || tool === "decompile_all") {
				const { EnhancedTools } = await import("./createServer-CoLFsKLA.js").then((n) => (n.xi(), n.bi));
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
init_DirectAnalysis();
export { runDirectAnalysis, runManagedProviderExecution, runProviderAnalysis };