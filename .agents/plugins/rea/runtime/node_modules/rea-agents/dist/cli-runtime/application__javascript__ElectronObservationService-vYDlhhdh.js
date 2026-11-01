import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { createEvidence, electronPageInspectionSchema, electronTargetListSchema, init_electronObservation, init_evidence } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisOutputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { completeProviderEvidence, init_ProviderOperationExecution, keepIncompleteObservation } from "./ProviderOperationExecution-DPwgddOD.js";

//#region dist/application/javascript/ElectronEvidence.js
var createElectronEvidence, parameters;
function init_ElectronEvidence() {
	return (init_ElectronEvidence = __esmMin((() => {
		init_evidence();
		createElectronEvidence = (operation, input, result, provider) => createEvidence(undefined, provider, {
			predicateType: operation === "list_electron_targets" ? "rea.electron-target-list" : "rea.electron-page-inspection",
			operation,
			parameters: parameters(input),
			result,
			confidence: "observed",
			authority: "external-service",
			environment: {
				id: `${result.browser.product}@${result.browser.revision}`,
				platform: "unknown",
				architecture: "unknown",
				isolation: "none"
			},
			limitations: [...result.limitations, "Browser host platform and architecture were not observed."]
		});
		parameters = (input) => ({
			cdp_endpoint: input.cdp_endpoint,
			..."target_id" in input ? {
				target_id: input.target_id,
				observation_ms: input.observation_ms,
				include_script_sources: input.include_script_sources,
				...input.command_timeout_ms === undefined ? {} : { command_timeout_ms: input.command_timeout_ms }
			} : {}
		});
	})))();
}

//#endregion
//#region dist/application/javascript/ElectronObservationService.js
var listElectronTargets, inspectElectronPage, requireProvider;
function init_ElectronObservationService() {
	return (init_ElectronObservationService = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_ElectronEvidence();
		init_electronObservation();
		init_ProviderOperationExecution();
		listElectronTargets = async (provider, input, options = {}) => {
			const ready = requireProvider(provider, "list_electron_targets");
			if (!ready.ok) return ready;
			if (options.signal?.aborted) return err(new AnalysisCancelledError("list_electron_targets", { cause: options.signal.reason }));
			const result = await ready.value.listTargets(input, options);
			if (!result.ok) return result;
			const report = electronTargetListSchema.safeParse(result.value);
			if (!report.success) return err(new AnalysisOutputError("list_electron_targets", "Electron provider returned a malformed target list.", { cause: report.error }));
			return completeProviderEvidence(createElectronEvidence("list_electron_targets", input, report.data, ready.value.identity()), options.signal);
		};
		inspectElectronPage = async (provider, input, options = {}) => {
			const ready = requireProvider(provider, "inspect_electron_page");
			if (!ready.ok) return ready;
			if (options.signal?.aborted) return err(new AnalysisCancelledError("inspect_electron_page", { cause: options.signal.reason }));
			const result = await ready.value.inspectPage(input, options);
			if (!result.ok) {
				const partial = result.error.partialObservation;
				if (partial !== undefined && "kind" in partial && partial.kind === "electron-page-observation") {
					const report = electronPageInspectionSchema.safeParse(partial.inspection);
					if (report.success) {
						const inspection = {
							...report.data,
							limitations: [...report.data.limitations, partial.cleanup === "transport-closed" ? "REA closed its CDP transport; this does not imply target shutdown." : "CDP transport cleanup remains incomplete."]
						};
						result.error.partialObservation = createElectronEvidence("inspect_electron_page", input, inspection, ready.value.identity());
						return result;
					}
				}
				return err(keepIncompleteObservation(result.error, "inspect_electron_page", "Electron provider retained a non-JSON incomplete observation."));
			}
			const report = electronPageInspectionSchema.safeParse(result.value);
			if (!report.success) return err(new AnalysisOutputError("inspect_electron_page", "Electron provider returned a malformed page inspection.", { cause: report.error }));
			return completeProviderEvidence(createElectronEvidence("inspect_electron_page", input, report.data, ready.value.identity()), options.signal);
		};
		requireProvider = (provider, operation) => provider === undefined ? err(new AnalysisCapabilityUnavailableError("rea-cdp-electron", operation, "Electron observation provider is not configured")) : ok(provider);
	})))();
}

//#endregion
init_ElectronObservationService();
export { inspectElectronPage, listElectronTargets };