import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register the explicit-file Apple .ips workflow and retain its complete Evidence. */
export const registerAppleIpsTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_apple_ips");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
