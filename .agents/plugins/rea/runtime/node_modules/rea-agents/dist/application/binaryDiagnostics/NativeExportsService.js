import { AnalysisCancelledError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { createEvidence } from "../../domain/evidence.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { inspectNativeExportsInputSchema, nativeExportsSchema, } from "../../domain/native/nativeExports.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
const OPERATION = "inspect_native_exports";
/** Shared caller validation, output parsing and Evidence provenance for CLI/MCP. */
export class NativeExportsService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    close() {
        return this.provider.close?.() ?? Promise.resolve();
    }
    /** Read one explicitly selected PE or ELF image's export table. */
    async inspect(rawInput, options) {
        if (options?.signal?.aborted)
            return err(new AnalysisCancelledError(OPERATION, { cause: options.signal.reason }));
        const input = inspectNativeExportsInputSchema.safeParse(rawInput);
        if (!input.success)
            return err(analysisInputErrorFromIssues(OPERATION, input.error.issues, rawInput, {
                cause: input.error,
            }));
        const result = await this.provider.inspect(input.data, options);
        if (!result.ok)
            return result;
        const report = nativeExportsSchema.safeParse(result.value);
        if (!report.success ||
            report.data.artifact.path !== input.data.path ||
            report.data.artifact.bytes > input.data.max_file_bytes)
            return err(new AnalysisOutputError(OPERATION, "Native export reader returned malformed output or changed artifact identity."));
        const value = report.data;
        return completeProviderEvidence(createEvidence({
            path: value.artifact.path,
            format: value.format,
            sha256: value.artifact.sha256,
        }, this.provider.identity, {
            operation: OPERATION,
            parameters: input.data,
            result: value,
            confidence: "observed",
            limitations: value.limitations,
            locations: [{ kind: "artifact-path", path: value.artifact.path }],
        }), options?.signal);
    }
}
