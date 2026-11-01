import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_jsonValue, init_result, jsonValueSchema } from "./jsonLines-Gf10X4s1.js";
import { ProviderAdapterError, init_analysisErrorProjection, init_providerAdapterError, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";

//#region dist/application/DirectAnalysisCleanup.js
var withSessionCleanup, directAnalysisCleanupFailure, managedAnalysisCleanupFailure;
function init_DirectAnalysisCleanup() {
	return (init_DirectAnalysisCleanup = __esmMin((() => {
		init_analysisErrorProjection();
		init_jsonValue();
		init_providerAdapterError();
		init_result();
		init_analysisErrorCleanup();
		withSessionCleanup = async (session, operation, onCleanupFailure) => {
			let value;
			try {
				value = await operation();
			} catch (cause) {
				const closed = await session.close();
				if (!closed.ok) throw new AggregateError([cause, closed.error], "Analysis and provider cleanup both failed", { cause });
				throw cause;
			}
			const closed = await session.close();
			return closed.ok ? value : onCleanupFailure(value, closed.error);
		};
		directAnalysisCleanupFailure = (result, error) => {
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
						cleanup_error: cleanup
					}
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
					partial_observation: result.value
				}
			};
		};
		managedAnalysisCleanupFailure = (result, error) => {
			if (!result.ok) return err(analysisErrorWithCleanupFailure(result.error, error));
			const cleanup = projectAnalysisError(error);
			return err(new ProviderAdapterError(error instanceof ProviderAdapterError ? error.providerId : "rea", "close_binary", {
				cause: error,
				remediationAction: cleanup.remediation.action,
				cleanup: {
					reason: cleanup.message,
					resources: error.cleanupResources
				},
				diagnostics: {
					cleanup_error: cleanup,
					partial_observation: jsonValueSchema.parse(result.value)
				}
			}));
		};
	})))();
}

//#endregion
export { directAnalysisCleanupFailure, init_DirectAnalysisCleanup, managedAnalysisCleanupFailure, withSessionCleanup };