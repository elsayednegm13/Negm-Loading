import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register the explicit-file PE resource workflow and retain its complete Evidence. */
export const registerPeResourcesTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_pe_resources");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
