import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind recorded crash inspection to its named contract and session Evidence owner. */
export const registerRecordedCrashTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("inspect_recorded_crash");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
