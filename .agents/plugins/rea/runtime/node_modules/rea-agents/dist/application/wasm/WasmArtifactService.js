import { createAnalysisExecutionEvidence } from "../../domain/analysisObservation.js";
import { AnalysisCancelledError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { inspectWasmArtifactInputSchema, wasmArtifactSchema, wasmArtifactMatchesSubject, DEFAULT_WASM_COMMAND_TIMEOUT_MS, } from "../../domain/wasm/wasmArtifact.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
const OPERATION = "inspect_wasm_artifact";
/** Shared artifact validation and typed inline Evidence for CLI/MCP. */
export class WasmArtifactService {
    provider;
    settings;
    constructor(provider, settings) {
        this.provider = provider;
        this.settings = settings;
    }
    /** Join provider cleanup during shutdown or an explicit retry. */
    close() {
        return this.provider.close();
    }
    /** Preserve exact selected artifact identity and validated upstream observations. */
    async inspect(rawInput, options) {
        if (options?.signal?.aborted)
            return err(new AnalysisCancelledError(OPERATION, {
                cause: options.signal.reason,
            }));
        const input = inspectWasmArtifactInputSchema.safeParse(rawInput);
        if (!input.success)
            return err(analysisInputErrorFromIssues(OPERATION, input.error.issues, rawInput, {
                cause: input.error,
            }));
        const timeout = input.data.command_timeout_ms ??
            this.settings?.().overrides["wasm.command_timeout_ms"] ??
            DEFAULT_WASM_COMMAND_TIMEOUT_MS;
        const inspected = await this.provider.inspect(input.data, {
            ...options,
            commandTimeoutMs: timeout,
        });
        if (!inspected.ok)
            return inspected;
        const execution = inspected.value;
        const report = wasmArtifactSchema.safeParse(execution.result);
        if (!report.success ||
            report.data.artifact.path !== input.data.path ||
            report.data.tool_profile.timeout_ms !== timeout ||
            !wasmArtifactMatchesSubject(report.data.artifact, execution.subject) ||
            JSON.stringify(report.data.glue.map((item) => item.artifact.path)) !==
                JSON.stringify(input.data.glue_paths) ||
            JSON.stringify(report.data.candidates.map((item) => item.path)) !==
                JSON.stringify([
                    ...new Set([input.data.path, ...input.data.candidate_paths]),
                ]))
            return err(new AnalysisOutputError(OPERATION, "WABT adapter returned malformed data or changed the selected artifact identity."));
        return completeProviderEvidence(createAnalysisExecutionEvidence(OPERATION, input.data, { ...execution, result: report.data }, "observed"), options?.signal);
    }
}
