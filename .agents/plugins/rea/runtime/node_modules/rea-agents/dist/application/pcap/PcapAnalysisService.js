import { analysisOperationInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { pcapRequestSchema, } from "../../domain/pcap/pcapAnalysis.js";
import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
import { createPcapEvidence } from "../../domain/pcap/pcapEvidence.js";
import { err } from "../../domain/result.js";
import { completeProviderEvidence } from "../ProviderOperationExecution.js";
/** Shared CLI/MCP admission, execution, and Evidence composition for pcap. */
export class PcapAnalysisService {
    provider;
    constructor(provider) {
        this.provider = provider;
    }
    /** Run one caller-selected pcap request and retain capture identity inline. */
    async execute(operation, input, options) {
        if (options?.signal?.aborted === true)
            return err(new AnalysisCancelledError(operation, {
                cause: options.signal.reason,
            }));
        const request = pcapRequestSchema.safeParse({ operation, input });
        if (!request.success)
            return err(analysisOperationInputErrorFromIssues(operation, request.error.issues, input, request.error));
        const executed = await this.provider.execute(request.data, options);
        if (!executed.ok)
            return executed;
        return completeProviderEvidence(createPcapEvidence(request.data, executed.value), options?.signal);
    }
}
