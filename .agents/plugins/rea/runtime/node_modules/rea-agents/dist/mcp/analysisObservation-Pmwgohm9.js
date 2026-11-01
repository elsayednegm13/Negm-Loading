import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { c as init_evidence, t as createEvidence } from "./evidence-CctoaA7x.js";

//#region dist/domain/analysisObservation.js
var createAnalysisExecutionEvidence;
function init_analysisObservation() {
	return (init_analysisObservation = __esmMin((() => {
		init_evidence();
		createAnalysisExecutionEvidence = (operation, input, execution, confidence, options) => createEvidence(execution.subject === undefined ? undefined : execution.subject ?? undefined, execution.provider, {
			operation,
			parameters: input,
			result: execution.result,
			rawResult: execution.rawResult,
			limitations: execution.limitations,
			...execution.analysisProfile === undefined ? {} : { analysisProfile: execution.analysisProfile },
			...execution.relationshipCoverage === undefined ? {} : { relationshipCoverage: execution.relationshipCoverage },
			locations: execution.locations,
			evidenceLinks: execution.sourceEvidence?.map(({ evidence_id }) => evidence_id) ?? [],
			confidence
		}, options);
	})))();
}

//#endregion
export { init_analysisObservation as n, createAnalysisExecutionEvidence as t };