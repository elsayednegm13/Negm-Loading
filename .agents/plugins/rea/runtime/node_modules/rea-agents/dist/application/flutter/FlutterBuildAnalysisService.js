import { flutterRequestSchema, } from "../../domain/flutter/flutterBuildAnalysis.js";
import { executeProviderOperation } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution, and Evidence composition for Flutter. */
export class FlutterBuildAnalysisService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Run one caller-selected Flutter request and retain target identity inline. */
    execute(operation, input, options) {
        return executeProviderOperation(operation, input, options, flutterRequestSchema, this.provider, "observed");
    }
}
