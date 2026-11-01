import { AnalysisInputError } from "../analysisErrorCore.js";
import { projectInputIssues } from "../inputIssueProjection.js";
import { safeParseEvidence } from "../evidenceValidation.js";
const OPERATION = "reconcile_javascript_runtime";
/** Parse one caller-owned source value and prefix failures with its request path. */
export const parseInputAtPath = (schema, input, path) => {
    const parsed = schema.safeParse(input);
    if (!parsed.success)
        throw inputErrorAtPath(parsed.error.issues, input, path, parsed.error);
    return parsed.data;
};
/** Authenticate Evidence while preserving the reconciliation input contract. */
export const authenticateRuntimeEvidence = (input, path) => {
    const parsed = safeParseEvidence(input);
    if (parsed.ok)
        return parsed.value;
    throw inputErrorAtPath(parsed.error.issues, input, path, parsed.error);
};
/** Represent one cross-field caller constraint as a standard input issue. */
export const invalidInput = (path, message) => new AnalysisInputError(OPERATION, undefined, [
    { path: [...path], reason: "invalid_value", message },
]);
/** Verify authenticated Evidence against one supported producer contract. */
export const assertEvidenceIdentity = (evidence, expected, path) => {
    if (evidence.operation !== expected.operation ||
        evidence.predicate_type !== expected.predicate ||
        evidence.provider.id !== expected.providerId ||
        evidence.provider.name !== expected.providerName ||
        evidence.provider.version !== expected.providerVersion ||
        evidence.authority !== expected.authority ||
        evidence.confidence !== expected.confidence)
        throw invalidInput(path, `Evidence does not match the supported ${expected.operation} contract`);
};
const inputErrorAtPath = (issues, input, path, cause) => new AnalysisInputError(OPERATION, { cause }, projectInputIssues(issues, input).map((issue) => ({
    ...issue,
    path: [...path, ...issue.path],
})));
