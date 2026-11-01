import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { analysisInputErrorFromIssues, createEvidence, init_evidence, init_hopperValues, init_inputIssueProjection, parseFunctionDossier } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, err, init_analysisErrorCore, init_result } from "./jsonLines-Gf10X4s1.js";
import { completeProviderEvidence, init_ProviderOperationExecution } from "./ProviderOperationExecution-DPwgddOD.js";
import { init_nativeProcedureInput, nativeProcedureInputSchema } from "./nativeProcedureInput-CePpTxN6.js";

//#region dist/application/FunctionAnalysisEvidence.js
var executeFunctionAnalysisEvidence;
function init_FunctionAnalysisEvidence() {
	return (init_FunctionAnalysisEvidence = __esmMin((() => {
		init_nativeProcedureInput();
		init_evidence();
		init_hopperValues();
		init_result();
		init_inputIssueProjection();
		init_analysisErrorCore();
		init_ProviderOperationExecution();
		executeFunctionAnalysisEvidence = async (analysis, parameters, target, options) => {
			if (options?.signal?.aborted) return err(new AnalysisCancelledError("analyze_function", { cause: options.signal.reason }));
			const input = nativeProcedureInputSchema.safeParse(parameters);
			if (!input.success) return err(analysisInputErrorFromIssues("analyze_function", input.error.issues, parameters, { cause: input.error }));
			const arguments_ = input.data;
			const execution = await analysis.execute("analyze_function", arguments_, options);
			if (!execution.ok) return execution;
			const dossier = parseFunctionDossier(execution.value.result);
			if (!dossier.ok) return dossier;
			const observation = execution.value;
			return completeProviderEvidence(createEvidence(observation.subject === undefined ? target : observation.subject ?? undefined, observation.provider, {
				operation: "analyze_function",
				parameters: arguments_,
				result: dossier.value,
				rawResult: observation.rawResult,
				limitations: observation.limitations,
				locations: observation.locations,
				...observation.relationshipCoverage === undefined ? {} : { relationshipCoverage: observation.relationshipCoverage },
				...observation.analysisProfile === undefined ? {} : { analysisProfile: observation.analysisProfile }
			}), options?.signal);
		};
	})))();
}

//#endregion
init_FunctionAnalysisEvidence();
export { executeFunctionAnalysisEvidence };