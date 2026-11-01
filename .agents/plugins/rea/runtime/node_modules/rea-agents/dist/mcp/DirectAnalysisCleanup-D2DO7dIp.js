import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, t as err } from "./result-Dbqc_peo.js";
import { b as init_providerAdapterError, n as projectAnalysisError, t as init_analysisErrorProjection, y as ProviderAdapterError } from "./analysisErrorProjection-CbRgJX1L.js";
import { i as jsonValueSchema, n as init_jsonValue } from "./jsonValue-CvnZ7JX6.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-DuTTn95O.js";

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
export { withSessionCleanup as i, init_DirectAnalysisCleanup as n, managedAnalysisCleanupFailure as r, directAnalysisCleanupFailure as t };