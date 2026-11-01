import { setImmediate } from "node:timers/promises";
import { AnalysisInputError } from "../domain/analysisErrorCore.js";
import { freezeOwnedJsonSnapshotSteps } from "../domain/immutableJson.js";
import { jsonValueValidationSteps, } from "../domain/jsonValue.js";
import { err, ok } from "../domain/result.js";
const finish = async (steps, signal) => {
    let completed = false;
    try {
        for (;;) {
            signal?.throwIfAborted();
            const step = steps.next();
            if (step.done) {
                completed = true;
                return step.value;
            }
            await setImmediate(undefined, signal === undefined ? {} : { signal });
        }
    }
    finally {
        // An abandoned validation/sealing traversal must release its provisional state.
        if (!completed)
            steps.return(undefined);
    }
};
/** Seal exclusively owned parser output so later schemas can share authenticated JSON subtrees. */
export const sealOwnedJsonInput = async (value, operation, signal) => {
    const issue = await finish(jsonValueValidationSteps(value), signal);
    if (issue !== undefined)
        return err(new AnalysisInputError(operation, { userMessage: issue }, [
            {
                path: [],
                reason: "invalid_value",
                expected: "bounded JSON-safe input",
                message: issue,
            },
        ]));
    // The completed validator above established the JsonValue contract without a copy.
    return ok(await finish(freezeOwnedJsonSnapshotSteps(value), signal));
};
