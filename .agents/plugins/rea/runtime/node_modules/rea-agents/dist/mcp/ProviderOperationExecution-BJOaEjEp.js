import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError, s as AnalysisOutputError } from "./analysisErrorCore-Cl6H9zyu.js";
import { i as jsonValueSchema, l as freezeJsonSnapshot, m as isImmutableJsonSnapshot, n as init_jsonValue, p as init_immutableJson } from "./jsonValue-CvnZ7JX6.js";
import { n as analysisOperationInputErrorFromIssues, r as init_inputIssueProjection } from "./inputIssueProjection-CwCDEdil.js";
import { n as init_analysisObservation, t as createAnalysisExecutionEvidence } from "./analysisObservation-Pmwgohm9.js";
import { z } from "zod";

//#region dist/application/ProviderOperationExecution.js
var executeProviderOperation, completeProviderEvidence, keepIncompleteObservation;
function init_ProviderOperationExecution() {
	return (init_ProviderOperationExecution = __esmMin((() => {
		init_analysisErrorCore();
		init_immutableJson();
		init_jsonValue();
		init_inputIssueProjection();
		init_result();
		init_analysisObservation();
		executeProviderOperation = async (operation, input, options, schema, provider, confidence) => {
			if (options?.signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
			const request = schema.safeParse({
				operation,
				input
			});
			if (!request.success) return err(analysisOperationInputErrorFromIssues(operation, request.error.issues, input, request.error));
			const executed = await provider.execute(request.data, options);
			if (!executed.ok) return executed;
			const evidence = createAnalysisExecutionEvidence(operation, request.data.input, executed.value, confidence);
			return completeProviderEvidence(evidence, options?.signal);
		};
		completeProviderEvidence = (evidence, signal, capturedOutput) => {
			if (signal?.aborted) return err(new AnalysisCancelledError(evidence.operation, {
				cause: signal.reason,
				partialObservation: evidence,
				...capturedOutput === undefined ? {} : { capturedOutput }
			}));
			return ok(evidence);
		};
		keepIncompleteObservation = (error, operation, reason) => {
			const seen = new Set();
			const judged = new Map();
			let current = error;
			while (current !== undefined && !seen.has(current)) {
				seen.add(current);
				const partial = current.partialObservation;
				if (partial !== undefined && !isImmutableJsonSnapshot(partial) && typeof partial === "object") {
					let snapshot = judged.get(partial);
					if (!judged.has(partial)) {
						const parsed = jsonValueSchema.safeParse(partial);
						snapshot = parsed.success ? freezeJsonSnapshot(parsed.data) : undefined;
						judged.set(partial, snapshot);
					}
					if (snapshot === undefined) {
						current.partialObservation = undefined;
						current.retainSecondaryFailure(new AnalysisOutputError(operation, reason));
					} else current.partialObservation = snapshot;
				}
				current = current.cleanupPrimary;
			}
			return error;
		};
	})))();
}

//#endregion
export { keepIncompleteObservation as i, executeProviderOperation as n, init_ProviderOperationExecution as r, completeProviderEvidence as t };