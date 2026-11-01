import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind source point tracing to its exact named contract and session Evidence owner. */
export const registerWebSourceLocationTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("trace_web_source_location");
    const handler = createEvidenceToolHandler(server, (input, options) => service.trace(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
