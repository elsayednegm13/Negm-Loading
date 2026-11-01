import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { b as init_providerAdapterError, n as projectAnalysisError, r as projectAnalysisErrorWithoutCapturedOutput, t as init_analysisErrorProjection, y as ProviderAdapterError } from "./analysisErrorProjection-CbRgJX1L.js";

//#region dist/domain/analysisErrorCleanup.js
var analysisErrorWithCleanupFailure;
function init_analysisErrorCleanup() {
	return (init_analysisErrorCleanup = __esmMin((() => {
		init_providerAdapterError();
		init_analysisErrorProjection();
		analysisErrorWithCleanupFailure = (primary, cleanup, operation = "close_binary") => {
			const projected = projectAnalysisError(cleanup);
			return new ProviderAdapterError(cleanup instanceof ProviderAdapterError ? cleanup.providerId : "rea", operation, {
				cleanupPrimary: primary,
				cause: new AggregateError([primary, cleanup], "Analysis failed and cleanup remains incomplete.", { cause: primary }),
				userMessage: projectAnalysisError(primary).message,
				remediationAction: projected.remediation.action,
				...primary.capturedOutput === undefined ? {} : { capturedOutput: primary.capturedOutput },
				...primary.partialObservation === undefined ? {} : { partialObservation: primary.partialObservation },
				cleanup: {
					reason: cleanup.cleanup?.reason ?? projected.message,
					resources: [...new Set([...primary.cleanupIncomplete ? primary.cleanupResources : [], ...cleanup.cleanupResources])]
				},
				diagnostics: {
					primary_error: primary.capturedOutput === undefined ? projectAnalysisError(primary) : projectAnalysisErrorWithoutCapturedOutput(primary),
					cleanup_error: projected
				}
			});
		};
	})))();
}

//#endregion
export { init_analysisErrorCleanup as n, analysisErrorWithCleanupFailure as t };