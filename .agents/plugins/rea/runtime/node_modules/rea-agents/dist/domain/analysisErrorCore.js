import { AnalysisError, } from "./analysisErrorBase.js";
/** A readable supplied artifact lies outside this operation's supported target formats. */
export class AnalysisUnsupportedTargetError extends AnalysisError {
    operation;
    path;
    reason;
    _tag = "AnalysisUnsupportedTargetError";
    /** Refusal-specific recovery, when the producer knows an available workflow. */
    remediationAction;
    constructor(operation, path, reason, options) {
        super(`Unsupported target for ${operation} at ${path}: ${reason}`, options);
        this.operation = operation;
        this.path = path;
        this.reason = reason;
        this.remediationAction = options?.remediationAction;
    }
}
/** An analysis or transport resource failure, distinct from malformed input or unsupported coverage. */
export const ANALYSIS_RESOURCE_KINDS = [
    "memory",
    "cpu",
    "file-size",
    "transport",
    "capacity",
];
/** A measured resource constraint or bounded admission refusal. */
export class AnalysisResourceConstraintError extends AnalysisError {
    operation;
    resource;
    reason;
    reportedLimits;
    _tag = "AnalysisResourceConstraintError";
    remediationAction;
    /**
     * The fixed format, decoder, or capture allowance that refused the request.
     * Worker limits and host resources do not raise it, so recovery derives from
     * this allowance rather than from `resource`.
     */
    fixedAllowance;
    /**
     * Whether retrying the same request can succeed. A caller-selected bound is
     * deterministic for the same input, so it is not retryable even when its
     * resource kind would otherwise be treated as admission capacity.
     */
    retryable;
    constructor(operation, resource, reason, reportedLimits, options) {
        super(`Resource constraint during ${operation}: ${reason}`, options);
        this.operation = operation;
        this.resource = resource;
        this.reason = reason;
        this.reportedLimits = reportedLimits;
        this.remediationAction = options?.remediationAction;
        this.fixedAllowance = options?.fixedAllowance;
        this.retryable = options?.retryable;
    }
}
/** Carry one refusal's recovery to an error re-attributed or redacted elsewhere. */
export const resourceConstraintRecovery = (error, text = (value) => value) => error.fixedAllowance !== undefined
    ? {
        fixedAllowance: {
            name: text(error.fixedAllowance.name),
            kind: error.fixedAllowance.kind,
        },
        ...retryable(error),
    }
    : {
        ...(error.remediationAction === undefined
            ? {}
            : { remediationAction: text(error.remediationAction) }),
        ...retryable(error),
    };
const retryable = (error) => error.retryable === undefined ? {} : { retryable: error.retryable };
/** Provider-neutral invalid analysis input or output at an application boundary. */
export class AnalysisProtocolError extends AnalysisError {
    _tag = "AnalysisProtocolError";
}
/** Caller input failed provider-neutral application parsing. */
export class AnalysisInputError extends AnalysisError {
    operation;
    issues;
    _tag = "AnalysisInputError";
    userMessage;
    constructor(operation, options, issues = []) {
        super(`Invalid analysis input for ${operation}`, options);
        this.operation = operation;
        this.issues = issues;
        this.userMessage = options?.userMessage;
    }
}
/** Provider output failed provider-neutral application parsing. */
export class AnalysisOutputError extends AnalysisError {
    operation;
    reason;
    _tag = "AnalysisOutputError";
    userMessage;
    remediationAction;
    cleanupOnly;
    constructor(operation, reason, options) {
        super(`Invalid analysis output for ${operation}: ${reason}`, options);
        this.operation = operation;
        this.reason = reason;
        this.userMessage = options?.userMessage;
        this.remediationAction = options?.remediationAction;
        this.cleanupOnly = options?.cleanupOnly ?? false;
    }
}
/** Selected provider cannot execute a declared analysis operation. */
export class AnalysisCapabilityUnavailableError extends AnalysisError {
    providerId;
    operation;
    reason;
    _tag = "AnalysisCapabilityUnavailableError";
    userMessage;
    remediationAction;
    /** Incomplete cleanup must settle before the operation can be retried. */
    retryable;
    constructor(providerId, operation, reason, options) {
        super(`Provider ${providerId} cannot execute ${operation}: ${reason}`, options);
        this.providerId = providerId;
        this.operation = operation;
        this.reason = reason;
        this.userMessage = options?.userMessage;
        this.remediationAction = options?.remediationAction;
        this.retryable = options?.retryable === true && !this.cleanupIncomplete;
    }
}
/** Caller cancellation won before provider-neutral work completed. */
export class AnalysisCancelledError extends AnalysisError {
    operation;
    _tag = "AnalysisCancelledError";
    constructor(operation, options) {
        super(`Analysis operation was cancelled: ${operation}`, options);
        this.operation = operation;
    }
}
/** Provider-neutral operation exceeded its declared execution deadline. */
export class AnalysisTimeoutError extends AnalysisError {
    operation;
    timeoutMs;
    _tag = "AnalysisTimeoutError";
    userMessage;
    remediationAction;
    constructor(operation, timeoutMs, options) {
        super(`Analysis operation timed out after ${String(timeoutMs)}ms: ${operation}`, options);
        this.operation = operation;
        this.timeoutMs = timeoutMs;
        this.userMessage = options?.userMessage;
        this.remediationAction = options?.remediationAction;
    }
}
/** Host filesystem permissions denied the selected read; this is not malformed caller input. */
export class AnalysisAccessDeniedError extends AnalysisError {
    operation;
    path;
    systemCode;
    _tag = "AnalysisAccessDeniedError";
    constructor(operation, path, systemCode, options) {
        super(`Host filesystem read access denied (${systemCode}) for ${path} during ${operation}`, options);
        this.operation = operation;
        this.path = path;
        this.systemCode = systemCode;
    }
}
/** Selected artifact acquisition observed a change, so no stable identity can be reported. */
export class AnalysisArtifactChangedError extends AnalysisError {
    operation;
    path;
    reason;
    _tag = "AnalysisArtifactChangedError";
    constructor(operation, path, reason, options) {
        super(`Selected artifact changed during acquisition: ${reason}`, options);
        this.operation = operation;
        this.path = path;
        this.reason = reason;
    }
}
