import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { AnalysisError, } from "../domain/analysisErrorBase.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { dispatchQueuedInterrupts } from "../process/queuedInterrupts.js";
/** Finish a one-shot CLI operation while retaining primary results through close. */
export const finishAnalysisCommand = async (run, service, providerId, canonicalOperation, signal, fallbackResource) => {
    let result;
    let cleanup;
    try {
        result = await run();
    }
    catch (cause) {
        result = {
            ok: false,
            error: cause instanceof AnalysisError
                ? cause
                : new ProviderAdapterError(providerId, canonicalOperation, { cause }),
        };
    }
    try {
        // Resource owners may resolve their retained errors during close. This
        // adapter cannot infer resolution of a producer's earlier cleanup failure.
        await service.close();
    }
    catch (cause) {
        if (cause instanceof AnalysisError)
            cleanup = cause;
        else {
            const observation = cause instanceof ArtifactReaderFailure
                ? ArtifactReaderFailure.cleanupObservation(cause, fallbackResource ?? `${canonicalOperation} resources`)
                : {
                    reason: cause instanceof Error ? cause.message : String(cause),
                    resources: [],
                };
            cleanup = new ProviderCleanupError(providerId, observation.resources, { reason: observation.reason }, { cause, operation: canonicalOperation });
        }
    }
    await dispatchQueuedInterrupts();
    if (result.ok && signal.aborted)
        result = {
            ok: false,
            error: new AnalysisCancelledError(canonicalOperation, {
                cause: signal.reason,
                partialObservation: result.value,
            }),
        };
    if (cleanup !== undefined) {
        if (result.ok)
            cleanup.retainPartialObservation(result.value);
        result = {
            ok: false,
            error: result.ok
                ? cleanup
                : analysisErrorWithCleanupFailure(result.error, cleanup, canonicalOperation).bindCleanupDependencies([result.error, cleanup]),
        };
    }
    return result.ok ? result.value : projectAnalysisError(result.error);
};
