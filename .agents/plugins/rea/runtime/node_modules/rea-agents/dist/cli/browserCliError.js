import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
/** Project a browser operation failure consistently across CLI command groups. */
export const browserCliError = (error) => ({
    error: "Browser observation failed",
    ...projectAnalysisError(error),
});
