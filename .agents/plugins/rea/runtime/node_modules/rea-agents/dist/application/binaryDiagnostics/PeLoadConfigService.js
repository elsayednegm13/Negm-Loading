import { isAbsolute } from "node:path";
import { AnalysisCancelledError, AnalysisInputError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { createEvidence } from "../../domain/evidence.js";
import { inspectPeLoadConfigInputSchema, peLoadConfigSchema, } from "../../domain/native/peLoadConfig.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { peSubjectArchitecture } from "../../domain/peMachine.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
const OPERATION = "inspect_pe_load_config";
/** Shared caller validation, output parsing and Evidence provenance for CLI/MCP. */
export class PeLoadConfigService {
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
        const input = inspectPeLoadConfigInputSchema.safeParse(rawInput);
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
        const report = peLoadConfigSchema.safeParse(result.value);
        if (!report.success ||
            report.data.artifact.path !== input.data.path ||
            !validReport(report.data, input.data))
            return err(new AnalysisOutputError(OPERATION, "PE TLS/load-config provider returned malformed output or changed artifact identity."));
        const value = report.data;
        const architecture = peSubjectArchitecture(value.machine, value.format);
        const locations = [
            { kind: "artifact-path", path: value.artifact.path },
            ...fileRange(value.tls?.directory ?? null),
            ...fileRange(value.load_config?.directory ?? null),
            ...structureRange(value.load_config),
            ...(value.tls?.callback_array_locations ?? []).map(({ offset, bytes }) => ({
                kind: "file-offset-range",
                start: offset,
                end: offset + bytes,
            })),
        ];
        return completeProviderEvidence(createEvidence({
            path: value.artifact.path,
            format: "pe",
            sha256: value.artifact.sha256,
            ...(architecture === undefined ? {} : { architecture }),
        }, this.provider.identity, {
            operation: OPERATION,
            parameters: input.data,
            result: value,
            confidence: "observed",
            limitations: value.limitations,
            locations,
        }), options?.signal);
    }
}
const fileRange = (directory) => directory === null
    ? []
    : [
        {
            kind: "file-offset-range",
            start: directory.file_offset,
            end: directory.file_offset + directory.size,
        },
    ];
/** The checked `Size` span, when it differs from the declared directory range. */
const structureRange = (loadConfig) => loadConfig === null ||
    loadConfig.structure_location.bytes === loadConfig.directory.size
    ? []
    : [
        {
            kind: "file-offset-range",
            start: loadConfig.structure_location.offset,
            end: loadConfig.structure_location.offset +
                loadConfig.structure_location.bytes,
        },
    ];
const validReport = (report, input) => {
    if (report.artifact.bytes > input.max_file_bytes ||
        report.examined_callbacks !== (report.tls?.callbacks.length ?? 0) ||
        report.examined_callbacks > input.max_callbacks ||
        report.bits !== (report.format === "pe32" ? 32 : 64))
        return false;
    const ranges = [
        ...fileRange(report.tls?.directory ?? null),
        ...fileRange(report.load_config?.directory ?? null),
    ];
    const structure = report.load_config?.structure_location;
    return ((structure === undefined ||
        (structure.offset === report.load_config?.directory.file_offset &&
            structure.bytes === report.load_config.size &&
            structure.offset <= report.artifact.bytes - structure.bytes)) &&
        ranges.every(({ start, end }) => start <= end && end <= report.artifact.bytes) &&
        (report.tls?.callback_array_locations ?? []).every(({ offset, bytes }) => offset <= report.artifact.bytes - bytes) &&
        (report.tls?.callbacks ?? []).every(({ file_offset }) => file_offset === null || file_offset < report.artifact.bytes));
};
