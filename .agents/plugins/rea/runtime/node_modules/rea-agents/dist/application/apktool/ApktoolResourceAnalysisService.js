import { apktoolRequestSchema, } from "../../domain/apktool/apktoolResourceAnalysis.js";
import { executeProviderOperation } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution, and Evidence composition for Apktool. */
export class ApktoolResourceAnalysisService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Run one caller-selected Apktool request and retain target identity inline. */
    async execute(operation, input, options) {
        return executeProviderOperation(operation, input, options, apktoolRequestSchema, this.provider, "observed");
    }
}
