import { AnalysisInputError } from "./analysisErrorCore.js";
import { readEvidence, readEvidencePayload } from "./evidenceValidation.js";
import { err, ok } from "./result.js";
import { compareUnicodeCodePoints } from "./unicodeCodePointOrder.js";
import { functionDossierSchema } from "./hopperValues.js";
import { assessFunctionCallCoverage } from "./functionCallCoverage.js";
/** Parse one complete analyze_function Evidence record for comparison workflows. */
export const parseFunctionEvidence = (input, selection) => {
    const parsed = readEvidence(input);
    if (!parsed.ok)
        return parsed;
    const evidence = parsed.value;
    const invalidSelection = (message, expected) => err(new AnalysisInputError(selection.operation, { userMessage: message }, [
        {
            path: selection.path,
            reason: "invalid_value",
            message,
            ...(expected === undefined ? {} : { expected }),
        },
    ]));
    if (evidence.operation !== "analyze_function" ||
        evidence.predicate_type !== "rea.analysis") {
        const location = selection.path.map(String).join(".");
        const subject = location === ""
            ? "supplied Evidence"
            : selection.path.length === 1
                ? `${location} Evidence`
                : `Evidence at ${location}`;
        return invalidSelection(`Function analysis requires analyze_function Evidence with the rea.analysis predicate; the ${subject} has operation ${evidence.operation} and predicate ${evidence.predicate_type}.`, { operation: "analyze_function", predicate_type: "rea.analysis" });
    }
    if (evidence.subject === null)
        return invalidSelection("Function analysis requires artifact-bound Evidence");
    const dossier = readEvidencePayload(functionDossierSchema, evidence.normalized_result);
    if (!dossier.ok)
        return dossier;
    const callCoverage = assessFunctionCallCoverage(evidence.relationship_coverage, dossier.value);
    return ok({
        evidence,
        subject: evidence.subject,
        dossier: dossier.value,
        limitations: [
            ...new Set([...evidence.limitations, ...dossier.value.limitations]),
        ].sort((left, right) => compareUnicodeCodePoints(left, right)),
        callCoverageBlockers: callCoverage.blockers,
        unresolvedCallCaveats: callCoverage.unresolvedCallCaveats,
        callCoverageDiagnostics: callCoverage.diagnostics,
    });
};
