import { AnalysisCapabilityUnavailableError } from "./analysisErrorCore.js";
/** Convert a provider's host configuration failure into actionable refusal evidence. */
export const providerConfigurationRefusal = (providerId, operation, failure) => {
    const remediation = failure.diagnostics?.remediation;
    const reason = typeof remediation === "string"
        ? `${failure.message}. ${remediation}.`
        : `${failure.message}.`;
    return new AnalysisCapabilityUnavailableError(providerId, operation, reason, {
        cause: failure,
        userMessage: reason,
        diagnostics: failure.diagnostics,
    });
};
