import { isAbsolute } from "node:path";
import { AnalysisCancelledError, AnalysisInputError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { createEvidence } from "../../domain/evidence.js";
import { inspectElfNotesInputSchema, elfNotesSchema, } from "../../domain/native/elfNotes.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { BINARY_ARCHITECTURES } from "../../domain/binaryTargetTypes.js";
import { elfArchitecture } from "../../domain/elfFixedHeader.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
const OPERATION = "inspect_elf_notes";
/** Shared caller validation, output parsing and Evidence provenance for CLI/MCP. */
export class ElfNotesService {
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
        const input = inspectElfNotesInputSchema.safeParse(rawInput);
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
        const report = elfNotesSchema.safeParse(result.value);
        if (!report.success ||
            report.data.artifact.path !== input.data.path ||
            !validReport(report.data, input.data.max_entries, input.data.max_file_bytes))
            return err(new AnalysisOutputError(OPERATION, "ELF note provider returned malformed output or changed artifact identity."));
        const value = report.data;
        const architecture = BINARY_ARCHITECTURES.find((supported) => supported === elfArchitecture(value.machine));
        const locations = [
            { kind: "artifact-path", path: value.artifact.path },
            ...value.tables.map((table) => ({
                kind: "file-offset-range",
                start: table.location.offset,
                end: table.location.offset + table.location.bytes,
            })),
        ];
        return completeProviderEvidence(createEvidence({
            path: value.artifact.path,
            format: "elf",
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
const validReport = (report, maxEntries, maxBytes) => {
    const inside = ({ offset, bytes }) => offset <= report.artifact.bytes - bytes;
    if (report.artifact.bytes > maxBytes ||
        report.coverage.examined_entries > maxEntries ||
        report.entries.length > maxEntries)
        return false;
    return (report.tables.every((table) => inside(table.location)) &&
        report.entries.every((entry) => inside(entry.location) && inside(entry.descriptor.location)));
};
