import { toolContract } from "../contracts/toolContracts.js";
import { createRetainedSummaryToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register the explicit-file devicetree workflow and retain its complete Evidence. */
export const registerDevicetreeTool = (server, service, logger, recordEvidence, evidenceById, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_devicetree");
    const handler = createRetainedSummaryToolHandler(server, contract, (input, options) => service.inspect(input, options), logger, { recordEvidence, evidenceById }, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler);
};
