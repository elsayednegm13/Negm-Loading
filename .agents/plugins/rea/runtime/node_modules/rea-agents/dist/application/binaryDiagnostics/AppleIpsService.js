import { isAbsolute } from "node:path";
import { AnalysisCancelledError, AnalysisInputError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { createEvidence } from "../../domain/evidence.js";
import { appleIpsSchema, appleIpsReportIntegerTextBytes, inspectAppleIpsInputSchema, } from "../../domain/native/appleIps.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
const OPERATION = "inspect_apple_ips";
/** Shared caller validation, output parsing and Evidence provenance for CLI/MCP. */
export class AppleIpsService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    close() {
        return this.provider.close?.() ?? Promise.resolve();
    }
    async inspect(rawInput, options) {
        if (options?.signal?.aborted)
            return err(new AnalysisCancelledError(OPERATION, { cause: options.signal.reason }));
        const input = inspectAppleIpsInputSchema.safeParse(rawInput);
        if (!input.success)
            return err(analysisInputErrorFromIssues(OPERATION, input.error.issues, rawInput, {
                cause: input.error,
            }));
        if (!isAbsolute(input.data.path))
            return err(new AnalysisInputError(OPERATION, undefined, [
                {
                    path: ["path"],
                    reason: "invalid_format",
                    message: "Expected an absolute filesystem path on this host.",
                },
            ]));
        const result = await this.provider.inspect(input.data, options);
        if (!result.ok)
            return result;
        const report = appleIpsSchema.safeParse(result.value);
        if (!report.success ||
            report.data.artifact.path !== input.data.path ||
            !validReport(report.data, input.data))
            return err(new AnalysisOutputError(OPERATION, "Apple IPS provider returned malformed output or changed artifact identity."));
        const value = report.data;
        return completeProviderEvidence(createEvidence({
            path: value.artifact.path,
            format: "file",
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
const validReport = (report, input) => {
    if (report.artifact.bytes > input.max_file_bytes ||
        report.coverage.threads > input.max_threads ||
        report.coverage.frames > input.max_frames ||
        report.coverage.images > input.max_images ||
        report.coverage.registers > input.max_registers ||
        report.coverage.threads !== report.threads.length ||
        report.coverage.images !== report.images.length)
        return false;
    const faultingThread = report.faulting_thread;
    const mismatches = report.coverage.type_mismatches;
    if (faultingThread !== null &&
        (report.threads[faultingThread]?.index !== faultingThread ||
            mismatches.some(({ path }) => path === `body.threads[${String(faultingThread)}]`)) &&
        !mismatches.some(({ path }) => path === "body.faultingThread"))
        return false;
    let frames = 0;
    let registers = 0;
    for (const thread of report.threads) {
        frames += thread.frames.length;
        registers += thread.registers.length;
    }
    return (frames === report.coverage.frames &&
        registers === report.coverage.registers &&
        appleIpsReportIntegerTextBytes(report) <= input.max_integer_text_bytes &&
        (report.coverage.status === "complete") ===
            (report.coverage.type_mismatches.length === 0));
};
