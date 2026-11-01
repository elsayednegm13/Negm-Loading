import { analysisProfileSchema, } from "../../domain/analysisProfile.js";
import { AnalysisCancelledError, AnalysisUnsupportedTargetError, } from "../../domain/analysisErrorCore.js";
import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { jsonObjectSchema } from "../../domain/jsonValue.js";
import { err, ok } from "../../domain/result.js";
import { ProviderAdapterError } from "../../domain/providerAdapterError.js";
/** Resolve and validate one provider profile without starting its client. */
export const evaluateAnalysisProviderCandidate = async (candidate, status, target, options = {}) => {
    const { signal } = options;
    if (signalIsAborted(signal))
        return err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }));
    let resolved;
    try {
        resolved = await candidate.resolveAnalysisProfile(target, options);
    }
    catch (cause) {
        resolved = err(cause instanceof AnalysisError
            ? cause
            : new ProviderAdapterError(status.provider.id, "resolve_analysis_profile", {
                cause,
                diagnostics: { reason: "Provider profile resolution threw" },
            }));
    }
    if (!resolved.ok && resolved.error instanceof AnalysisCancelledError)
        return err(resolved.error);
    if (!resolved.ok) {
        const error = resolved.error;
        const rejection = error instanceof AnalysisUnsupportedTargetError
            ? {
                candidate,
                status: {
                    ...status,
                    targetSupport: {
                        status: "unsupported",
                        code: "target_format_unsupported",
                        reason: error.reason,
                        diagnostics: { path: error.path, error_tag: error._tag },
                    },
                },
            }
            : rejectedProfile(candidate, status, error.message, {
                error_tag: error._tag,
            });
        return ok({ ...rejection, profileError: error });
    }
    if (signalIsAborted(signal))
        return err(new AnalysisCancelledError("open_binary", { cause: signal?.reason }));
    try {
        if (resolved.value.profile === null)
            return ok(rejectedProfile(candidate, status, "Provider version or analysis profile could not be resolved"));
        const profile = analysisProfileSchema.parse(resolved.value.profile);
        const identity = candidate.identity();
        if (profile.provider.id !== identity.id ||
            profile.provider.name !== identity.name ||
            (identity.version !== null &&
                profile.provider.version !== identity.version))
            return ok(rejectedProfile(candidate, status, "Resolved analysis profile has mismatched provider identity"));
        return ok({
            candidate,
            status,
            profile,
            ...(resolved.value.createClient === undefined
                ? {}
                : { createClient: resolved.value.createClient }),
        });
    }
    catch (cause) {
        void cause;
        return ok(rejectedProfile(candidate, status, "Provider returned an invalid analysis profile"));
    }
};
const signalIsAborted = (signal) => signal?.aborted === true;
const rejectedProfile = (candidate, status, reason, diagnostics = {}) => ({
    candidate,
    status: {
        ...status,
        availability: {
            status: "unavailable",
            code: "version_unresolved",
            reason,
            diagnostics: jsonObjectSchema.parse({
                ...status.availability.diagnostics,
                ...diagnostics,
            }),
        },
    },
});
