import { AnalysisInputError } from "../domain/analysisErrorCore.js";
/** Bounded format or applicability failure retained as managed coverage. */
export class ManagedReaderFailure extends Error {
    issue;
    metadataHeader;
    constructor(issue, options) {
        super(issue.detail, options);
        this.issue = issue;
        this.metadataHeader = options?.metadataHeader ?? null;
    }
}
/** A resource or unsupported layout leaves metadata unknown, not malformed. */
export const managedMetadataFailureStatus = (issue) => issue.code === "resource-limit" || issue.code === "unsupported-metadata"
    ? "partial"
    : "malformed";
/** Malformed selected metadata is input failure for every inspection workflow. */
export const managedInspectionInputFailure = (operation, path, cause, inputField = "path") => cause instanceof ManagedReaderFailure &&
    managedMetadataFailureStatus(cause.issue) === "malformed"
    ? new AnalysisInputError(operation, { cause }, [
        {
            path: [inputField],
            reason: "invalid_format",
            message: `Selected artifact ${path}: ${cause.issue.detail}`,
        },
    ])
    : undefined;
/** Construct a typed managed parse failure at an exact byte location. */
export const managedFailure = (code, scope, detail, offset = null) => new ManagedReaderFailure({ code, scope, offset, detail });
/** Retain one malformed item's location while allowing independent items to be read. */
export const readManagedValue = (operation, issues) => {
    try {
        return operation();
    }
    catch (cause) {
        if (!(cause instanceof ManagedReaderFailure) ||
            managedMetadataFailureStatus(cause.issue) === "partial")
            throw cause;
        issues.push(cause.issue);
        return undefined;
    }
};
/** Preserve issue order while collapsing the same malformed producer fact across facets. */
export const uniqueManagedParseIssues = (issues) => [
    ...new Map(issues.map((issue) => [JSON.stringify(issue), issue])).values(),
];
/**
 * Append issue lists one issue at a time. Spreading a list into `push` passes
 * one argument per issue, which overflows the stack on large malformed inputs.
 */
export const appendManagedParseIssues = (issues, ...found) => {
    for (const list of found)
        for (const issue of list)
            issues.push(issue);
};
