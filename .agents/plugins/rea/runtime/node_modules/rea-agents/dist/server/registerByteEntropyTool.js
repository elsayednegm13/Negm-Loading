import { retainedSummaryDelivery } from "./retainedSummaryDelivery.js";
import { toolContract } from "../contracts/toolContracts.js";
import { deliverEvidenceResult } from "./contractToolHandler.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
/** Reject an unretained byte-entropy summary before reading the selected file. */
export const registerByteEntropyTool = (server, entropyService, logger, recordEvidence, evidenceById, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_byte_entropy");
    const delivery = retainedSummaryDelivery(new Set([contract.name]), {
        recordEvidence,
        evidenceById,
    });
    server.registerTool(contract.name, toolRegistrationOptions(contract), async ({ detail, ...request }, context) => runAdmittedToolOperation(server, withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(logger, contract.name, async () => {
            const parameters = { detail };
            const ready = delivery.preflight(contract.name, parameters);
            if (!ready.ok)
                return ready;
            const inspected = await entropyService.inspect(request, {
                signal: context.mcpReq.signal,
            });
            return inspected.ok
                ? delivery.projectEvidence(contract.name, parameters, inspected.value)
                : inspected;
        });
        return deliverEvidenceResult(server, result, contract, recordEvidence);
    }));
};
