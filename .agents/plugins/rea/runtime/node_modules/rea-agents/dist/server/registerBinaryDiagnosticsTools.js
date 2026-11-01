import { retainedSummaryDelivery } from "./retainedSummaryDelivery.js";
import { toolContract } from "../contracts/toolContracts.js";
import { deliverEvidenceResult } from "./contractToolHandler.js";
import { logToolExecution } from "./toolLogging.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { err } from "../domain/result.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
import { registerByteEntropyTool } from "./registerByteEntropyTool.js";
/** Bind offline layout inspection to its named contract and session Evidence owner. */
export const registerBinaryDiagnosticsTools = (server, service, entropyService, logger, recordEvidence, evidenceById, withAdmittedAnalysis) => {
    registerByteEntropyTool(server, entropyService, logger, recordEvidence, evidenceById, withAdmittedAnalysis);
    const contract = toolContract("inspect_binary_layout");
    const delivery = retainedSummaryDelivery(new Set([contract.name]), {
        recordEvidence,
        evidenceById,
    });
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), async (rawInput, context) => {
        const parsed = contract.inputSchema.safeParse(rawInput);
        if (!parsed.success)
            return server.delivery.toCallToolResult(err(analysisInputErrorFromIssues(contract.name, parsed.error.issues, rawInput, { cause: parsed.error })), contract);
        const { detail, ...request } = parsed.data;
        const parameters = { detail };
        return runAdmittedToolOperation(server, withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
            const result = await logToolExecution(logger, contract.name, async () => {
                const ready = delivery.preflight(contract.name, parameters);
                if (!ready.ok)
                    return ready;
                const inspected = await service.inspect(request, {
                    signal: context.mcpReq.signal,
                });
                return inspected.ok
                    ? delivery.projectEvidence(contract.name, parameters, inspected.value)
                    : inspected;
            });
            return deliverEvidenceResult(server, result, contract, recordEvidence);
        });
    });
};
