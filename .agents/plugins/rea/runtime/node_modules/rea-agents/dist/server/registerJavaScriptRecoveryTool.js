import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind optional recovery to its exact named contract without acquiring an engine. */
export const registerJavaScriptRecoveryTool = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("recover_javascript_sources");
    const handler = createEvidenceToolHandler(server, (input, options) => service.recover(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
