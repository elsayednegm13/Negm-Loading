import { AnalysisOutputError } from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { err } from "../domain/result.js";
/** Shared MCP admission and failure preservation for unrestricted commands. */
export const runWithExternalMutationAdmission = async (session, operationName, signal, operation, evidenceOf, cleanupRecovery, retainedDetails) => {
    if (session === undefined) {
        const recovered = await cleanupRecovery?.(undefined);
        if (recovered !== undefined && !recovered.ok)
            return recovered;
        return operation();
    }
    const admitted = await session.withAdmittedExternalMutation(undefined, signal, operation, (value, cause) => value.ok
        ? new AnalysisOutputError(operationName, "The external command may have changed the bound artifact, but the active analysis session could not be retired.", {
            cause,
            ...(evidenceOf === undefined
                ? {}
                : { partialObservation: evidenceOf(value.value) }),
            ...(cause.cleanup === undefined
                ? {}
                : { cleanup: cause.cleanup }),
            ...(cause.capturedOutput === undefined
                ? {}
                : { capturedOutput: cause.capturedOutput }),
            ...(retainedDetails === undefined
                ? {}
                : { diagnostics: retainedDetails(value.value) }),
        })
        : value.error.retainSecondaryFailure(cause, {
            retirement_error: projectAnalysisError(cause),
        }), operationName, cleanupRecovery);
    return admitted.ok ? admitted.value : err(admitted.error);
};
/** Admit an owned close once, including when it is recovering its own blocker. */
export const runOwnedCleanupWithExternalMutationAdmission = async (session, operationName, signal, resourceId, cleanup) => {
    let completed;
    const cleanupOnce = async () => {
        completed ??= await cleanup();
        return completed;
    };
    const admitted = await runWithExternalMutationAdmission(session, operationName, signal, cleanupOnce, undefined, async (failure) => {
        if (failure === undefined ||
            !failure.cleanup?.resources.includes(resourceId))
            return failure === undefined
                ? { ok: true, value: null }
                : { ok: false, error: failure };
        const recovered = await cleanupOnce();
        return recovered.ok ? { ok: true, value: null } : recovered;
    });
    return admitted;
};
