import { AnalysisInputError, } from "../analysisErrorCore.js";
export const INSPECT_ANALYSIS_VIEW_OPERATION = "inspect_analysis_view";
/** Construct a typed input failure for one selected-view constraint. */
export const analysisViewInputError = (issues) => new AnalysisInputError(INSPECT_ANALYSIS_VIEW_OPERATION, undefined, issues);
