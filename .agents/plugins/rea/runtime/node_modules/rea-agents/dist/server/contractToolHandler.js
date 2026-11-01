import { err } from "../domain/result.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { logToolExecution } from "./toolLogging.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
import { retainedSummaryDelivery } from "./retainedSummaryDelivery.js";
/** Record and deliver one Evidence result using the tool's exact contract. */
export const deliverEvidenceResult = (server, result, contract, recordEvidence) => {
    if (!result.ok)
        return server.delivery.toPartialErrorToolResult(result.error, contract.returnsTargetContent, recordEvidence);
    const recorded = recordEvidence?.(result.value);
    return server.delivery.toEvidenceToolResult(result.value, contract, recorded);
};
/**
 * Bind one service-backed handler to its exact named contract through the
 * shared log/execute/record/deliver workflow.
 */
export const createContractToolHandler = (server, service, logger, recordEvidence, withAdmittedAnalysis) => (contract) => createEvidenceToolHandler(server, (input, options) => service.execute(contract.name, input, options), logger, recordEvidence, withAdmittedAnalysis)(contract);
/** Validate delivery selection before inspection and retain its complete source for summaries. */
export const createRetainedSummaryToolHandler = (server, contract, inspect, logger, retention, withAdmittedAnalysis) => {
    const delivery = retainedSummaryDelivery(new Set([contract.name]), retention);
    return createEvidenceToolHandler(server, async (rawInput, options) => {
        const parsed = contract.inputSchema.safeParse(rawInput);
        if (!parsed.success)
            return err(analysisInputErrorFromIssues(contract.name, parsed.error.issues, rawInput, { cause: parsed.error }));
        const { detail, ...input } = parsed.data;
        const parameters = { detail };
        const ready = delivery.preflight(contract.name, parameters);
        if (!ready.ok)
            return ready;
        const inspected = await inspect(input, options);
        return inspected.ok
            ? delivery.projectEvidence(contract.name, parameters, inspected.value)
            : inspected;
    }, logger, retention.recordEvidence, withAdmittedAnalysis)(contract);
};
/** Bind a named Evidence-producing operation to shared logging and delivery. */
export const createEvidenceToolHandler = (server, operation, logger, recordEvidence, withAdmittedAnalysis) => (contract) => {
    const name = contract.name;
    return async (input, context) => {
        const executeAndRecord = async () => {
            const result = await logToolExecution(logger, name, () => operation(input, { signal: context.mcpReq.signal }));
            return deliverEvidenceResult(server, result, contract, recordEvidence);
        };
        return runAdmittedToolOperation(server, withAdmittedAnalysis, name, context.mcpReq.signal, executeAndRecord);
    };
};
