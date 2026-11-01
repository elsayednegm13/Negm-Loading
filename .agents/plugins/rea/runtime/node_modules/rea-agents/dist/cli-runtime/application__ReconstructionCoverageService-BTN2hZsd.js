import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { analysisInputErrorFromIssues, init_inputIssueProjection } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_result } from "./jsonLines-Gf10X4s1.js";
import { evaluateParsedReconstructionClosure, init_reconstructionCoverage, init_reconstructionCoverageInput, readReconstructionCoverageData, reconstructionCoverageEvaluationInputSchema } from "./reconstructionCoverageInput-DGsKzzkh.js";
import { z } from "zod";

//#region dist/application/ReconstructionCoverageService.js
var OPERATION, requestEnvelopeSchema, evaluateReconstructionCoverage;
function init_ReconstructionCoverageService() {
	return (init_ReconstructionCoverageService = __esmMin((() => {
		init_reconstructionCoverageInput();
		init_reconstructionCoverage();
		init_result();
		init_inputIssueProjection();
		OPERATION = "evaluate_reconstruction_coverage";
		requestEnvelopeSchema = reconstructionCoverageEvaluationInputSchema.extend({ coverage: z.unknown() });
		evaluateReconstructionCoverage = (rawInput, nowEpochMs = Date.now()) => {
			const parsed = requestEnvelopeSchema.safeParse(rawInput);
			if (!parsed.success) return err(analysisInputErrorFromIssues(OPERATION, parsed.error.issues, rawInput, { cause: parsed.error }));
			const coverage = readReconstructionCoverageData(parsed.data.coverage, ["coverage"]);
			if (!coverage.ok) return coverage;
			return evaluateParsedReconstructionClosure(coverage.value, parsed.data.boundary_id, nowEpochMs);
		};
	})))();
}

//#endregion
init_ReconstructionCoverageService();
export { evaluateReconstructionCoverage };