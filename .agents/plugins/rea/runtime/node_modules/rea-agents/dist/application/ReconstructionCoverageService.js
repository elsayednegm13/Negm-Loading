import { z } from "zod";
import { reconstructionCoverageEvaluationInputSchema } from "../domain/reconstructionCoverageInput.js";
import { evaluateParsedReconstructionClosure, readReconstructionCoverageData, } from "../domain/reconstructionCoverage.js";
import { err } from "../domain/result.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
const OPERATION = "evaluate_reconstruction_coverage";
const requestEnvelopeSchema = reconstructionCoverageEvaluationInputSchema.extend({
    coverage: z.unknown(),
});
/** Evaluate inline reconstruction coverage against a named boundary. */
export const evaluateReconstructionCoverage = (rawInput, nowEpochMs = Date.now()) => {
    const parsed = requestEnvelopeSchema.safeParse(rawInput);
    if (!parsed.success)
        return err(analysisInputErrorFromIssues(OPERATION, parsed.error.issues, rawInput, {
            cause: parsed.error,
        }));
    const coverage = readReconstructionCoverageData(parsed.data.coverage, [
        "coverage",
    ]);
    if (!coverage.ok)
        return coverage;
    return evaluateParsedReconstructionClosure(coverage.value, parsed.data.boundary_id, nowEpochMs);
};
