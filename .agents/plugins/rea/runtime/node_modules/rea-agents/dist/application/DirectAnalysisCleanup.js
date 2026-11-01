import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err } from "../domain/result.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
/** Await one-shot cleanup and retain either the outcome or both failures. */
export const withSessionCleanup = async (session, operation, onCleanupFailure) => {
    let value;
    try {
        value = await operation();
    }
    catch (cause) {
        const closed = await session.close();
        if (!closed.ok)
            throw new AggregateError([cause, closed.error], "Analysis and provider cleanup both failed", { cause });
        throw cause;
    }
    const closed = await session.close();
    return closed.ok ? value : onCleanupFailure(value, closed.error);
};
/** Project typed one-shot outcomes only after execution and cleanup settle. */
export const directAnalysisCleanupFailure = (result, error) => {
    const cleanup = projectAnalysisError(error);
    if (!result.ok) {
        const primary = projectAnalysisError(result.error);
        return {
            error: "Analysis failed",
            ...primary,
            code: "cleanup_incomplete",
            retryable: false,
            remediation: cleanup.remediation,
            details: {
                resources: error.cleanupResources.slice(),
                ...primary.details,
                cleanup: "incomplete",
                execution_failure: primary.details?.execution_failure ?? primary.code,
                cleanup_error: cleanup,
            },
        };
    }
    return {
        error: "Analysis failed",
        ...cleanup,
        code: "cleanup_incomplete",
        retryable: false,
        details: {
            ...cleanup.details,
            cleanup: "incomplete",
            partial_observation: result.value,
        },
    };
};
/** Preserve managed observations or the original typed failure in diagnostics. */
export const managedAnalysisCleanupFailure = (result, error) => {
    if (!result.ok)
        return err(analysisErrorWithCleanupFailure(result.error, error));
    const cleanup = projectAnalysisError(error);
    return err(new ProviderAdapterError(error instanceof ProviderAdapterError ? error.providerId : "rea", "close_binary", {
        cause: error,
        remediationAction: cleanup.remediation.action,
        cleanup: { reason: cleanup.message, resources: error.cleanupResources },
        diagnostics: {
            cleanup_error: cleanup,
            partial_observation: jsonValueSchema.parse(result.value),
        },
    }));
};
