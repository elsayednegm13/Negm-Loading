import { AnalysisError, } from "./analysisErrorBase.js";
/** A provider adapter failed outside its more precise typed variants. */
export class ProviderAdapterError extends AnalysisError {
    providerId;
    operation;
    _tag = "ProviderAdapterError";
    userMessage;
    remediationAction;
    constructor(providerId, operation, options = {}) {
        super(`Provider ${providerId} adapter failed during ${operation}`, options);
        this.providerId = providerId;
        this.operation = operation;
        this.userMessage = options.userMessage;
        this.remediationAction = options.remediationAction;
    }
}
