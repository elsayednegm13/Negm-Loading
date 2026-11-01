import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
/** Run against the source's explicit owner, admitting session-scoped work. */
export const withAdmittedAnalysis = (source) => source.kind === "session"
    ? (operationName, signal, operation) => source.session.withAdmittedAnalysis(operationName, signal, operation)
    : async (operationName, signal, operation) => signal?.aborted === true
        ? err(new AnalysisCancelledError(operationName, {
            cause: signal.reason,
        }))
        : ok(await operation(source.analysis));
