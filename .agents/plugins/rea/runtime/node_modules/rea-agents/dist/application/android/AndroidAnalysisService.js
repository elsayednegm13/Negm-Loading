import { analysisOperationInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { summarizeRetainedAndroidSearch } from "./AndroidSearchEvidenceSummary.js";
import { parseBinaryTarget } from "../BinaryTargetResolver.js";
import { androidRequestSchema, } from "../../domain/android/androidAnalysis.js";
import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
import { createEvidence } from "../../domain/evidence.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution and Evidence composition for Android. */
export class AndroidAnalysisService {
    provider;
    recordEvidence;
    constructor(provider, recordEvidence) {
        this.provider = provider;
        this.recordEvidence = recordEvidence;
    }
    /** Inspect a caller-selected APK and retain producing-provider provenance inline. */
    async execute(operation, input, options) {
        if (options?.signal?.aborted === true)
            return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
        const request = androidRequestSchema.safeParse({ operation, input });
        if (!request.success)
            return err(analysisOperationInputErrorFromIssues(operation, request.error.issues, input, request.error));
        const target = await parseBinaryTarget(request.data.input.path, options?.signal === undefined ? {} : { signal: options.signal });
        if (!target.ok)
            return target;
        const executed = await this.provider.execute(target.value, request.data, options);
        if (!executed.ok)
            return executed;
        const execution = executed.value;
        const completed = completeProviderEvidence(createEvidence(execution.subject === undefined
            ? target.value
            : (execution.subject ?? undefined), execution.provider, {
            operation,
            parameters: request.data.input,
            result: execution.result,
            rawResult: execution.rawResult,
            limitations: execution.limitations,
            locations: execution.locations,
            confidence: operation === "inspect_android_method" ? "derived" : "observed",
        }), options?.signal);
        if (!completed.ok ||
            operation !== "search_android_classes" ||
            execution.searchRawSummary === undefined)
            return completed;
        return summarizeRetainedAndroidSearch(completed.value, execution.searchRawSummary, this.recordEvidence);
    }
}
