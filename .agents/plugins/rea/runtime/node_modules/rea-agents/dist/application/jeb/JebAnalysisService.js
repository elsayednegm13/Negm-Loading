import { jebRequestSchema, } from "../../domain/jeb/jebAnalysis.js";
import { executeProviderOperation } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution and Evidence composition for JEB. */
export class JebAnalysisService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Run one caller-selected JEB request and retain engine provenance inline. */
    async execute(operation, input, options) {
        return executeProviderOperation(operation, input, options, jebRequestSchema, this.provider, operation === "decompile_jeb_item" ? "derived" : "observed");
    }
}
