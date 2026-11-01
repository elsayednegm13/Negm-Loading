import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
/** Caller-facing rejection for one decompile-directory argument. */
export const decompileInputError = (path, message) => new AnalysisInputError("decompile_all", { userMessage: message }, [
    { path: [path], reason: "invalid_value", message },
]);
