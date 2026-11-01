import { adbRequestSchema, } from "../../domain/adb/adbDeviceAnalysis.js";
import { executeProviderOperation } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution, and Evidence composition for ADB. */
export class AdbDeviceAnalysisService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Run one caller-selected ADB request and retain device provenance inline. */
    async execute(operation, input, options) {
        return executeProviderOperation(operation, input, options, adbRequestSchema, this.provider, "observed");
    }
}
