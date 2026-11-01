import { toolContract } from "../contracts/toolContracts.js";
import { createRetainedSummaryToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register the explicit-file export-table workflow and retain its complete Evidence. */
export const registerNativeExportsTool = (server, service, logger, recordEvidence, evidenceById, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_native_exports");
    const handler = createRetainedSummaryToolHandler(server, contract, (input, options) => service.inspect(input, options), logger, { recordEvidence, evidenceById }, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler);
};
