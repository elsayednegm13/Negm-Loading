import { z } from "zod";
import { AnalysisCancelledError, AnalysisOutputError, } from "../domain/analysisErrorCore.js";
import { freezeJsonSnapshot, isImmutableJsonSnapshot, } from "../domain/immutableJson.js";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { analysisOperationInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { err, ok } from "../domain/result.js";
import { createAnalysisExecutionEvidence } from "../domain/analysisObservation.js";
/**
 * Shared CLI/MCP admission, execution, and Evidence composition for
 * single-request providers. The caller retains its operation vocabulary and
 * confidence; this normalizes cancellation, input validation, and Evidence
 * assembly once instead of per provider.
 */
export const executeProviderOperation = async (operation, input, options, schema, provider, confidence) => {
    if (options?.signal?.aborted)
        return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
    const request = schema.safeParse({ operation, input });
    if (!request.success)
        return err(analysisOperationInputErrorFromIssues(operation, request.error.issues, input, request.error));
    const executed = await provider.execute(request.data, options);
    if (!executed.ok)
        return executed;
    const evidence = createAnalysisExecutionEvidence(operation, request.data.input, executed.value, confidence);
    return completeProviderEvidence(evidence, options?.signal);
};
/** Classify completion after Evidence assembly, preserving facts on late abort. */
export const completeProviderEvidence = (evidence, signal, capturedOutput) => {
    if (signal?.aborted)
        return err(new AnalysisCancelledError(evidence.operation, {
            cause: signal.reason,
            partialObservation: evidence,
            ...(capturedOutput === undefined ? {} : { capturedOutput }),
        }));
    return ok(evidence);
};
/**
 * Retain an incomplete observation when projection can serialize it.
 * A JSON partial is replaced by one frozen snapshot, so a later mutation
 * cannot make projection throw and projection does not copy it again.
 * A partial that is not JSON is cleared from the returned error and from
 * every cleanup primary projection can select later. Each cleared error
 * records an output failure, leaving cancellation or timeout primary.
 */
export const keepIncompleteObservation = (error, operation, reason) => {
    const seen = new Set();
    // One source object can sit on a wrapper and its cleanup primary.
    const judged = new Map();
    let current = error;
    while (current !== undefined && !seen.has(current)) {
        seen.add(current);
        const partial = current.partialObservation;
        if (partial !== undefined &&
            !isImmutableJsonSnapshot(partial) &&
            typeof partial === "object") {
            // safeParse clones only after validation succeeds. Freeze that copy once.
            let snapshot = judged.get(partial);
            if (!judged.has(partial)) {
                const parsed = jsonValueSchema.safeParse(partial);
                snapshot = parsed.success
                    ? freezeJsonSnapshot(parsed.data)
                    : undefined;
                judged.set(partial, snapshot);
            }
            if (snapshot === undefined) {
                current.partialObservation = undefined;
                current.retainSecondaryFailure(new AnalysisOutputError(operation, reason));
            }
            else
                current.partialObservation = snapshot;
        }
        current = current.cleanupPrimary;
    }
    return error;
};
