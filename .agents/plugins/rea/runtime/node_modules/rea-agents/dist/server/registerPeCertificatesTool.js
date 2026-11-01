import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register the explicit-file PE certificate-table workflow and retain its complete Evidence. */
export const registerPeCertificatesTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_pe_certificates");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
