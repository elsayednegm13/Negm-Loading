import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { createEvidence, init_evidence } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";

//#region dist/application/javascript/JavaScriptApplicationWorkflowEvidence.js
var createApplicationFeatureTraceEvidence, createJavaScriptSemanticTraceEvidence, createApplicationVersionComparisonEvidence, createSourceToBundleComparisonEvidence, createJavaScriptExportShapeComparisonEvidence;
function init_JavaScriptApplicationWorkflowEvidence() {
	return (init_JavaScriptApplicationWorkflowEvidence = __esmMin((() => {
		init_evidence();
		init_investigationProviders();
		createApplicationFeatureTraceEvidence = (parameters, result) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.application-feature-trace",
			operation: "trace_application_feature",
			parameters,
			result,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: result.limitations,
			evidenceLinks: result.evidence_links
		});
		createJavaScriptSemanticTraceEvidence = (parameters, result) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.javascript-semantic-trace",
			operation: "trace_javascript_semantics",
			parameters,
			result,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: result.limitations,
			evidenceLinks: result.evidence_links
		});
		createApplicationVersionComparisonEvidence = (parameters, result) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.application-version-comparison",
			operation: "compare_application_versions",
			parameters,
			result,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: result.limitations,
			evidenceLinks: result.evidence_links
		});
		createSourceToBundleComparisonEvidence = (parameters, result) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.source-to-bundle-comparison",
			operation: "compare_source_to_bundle",
			parameters,
			result,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: result.limitations,
			evidenceLinks: result.evidence_links
		});
		createJavaScriptExportShapeComparisonEvidence = (parameters, result) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.javascript-export-shape-comparison",
			operation: "compare_javascript_export_shapes",
			parameters,
			result,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: result.limitations,
			evidenceLinks: result.evidence_links
		});
	})))();
}

//#endregion
export { createApplicationFeatureTraceEvidence, createApplicationVersionComparisonEvidence, createJavaScriptExportShapeComparisonEvidence, createJavaScriptSemanticTraceEvidence, createSourceToBundleComparisonEvidence, init_JavaScriptApplicationWorkflowEvidence };