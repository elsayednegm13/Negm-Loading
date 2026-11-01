import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the module relationship workflow to its exact canonical contract. */
export const registerWebModuleTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("trace_web_module_imports");
    const handler = createEvidenceToolHandler(server, (input, options) => service.trace(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
