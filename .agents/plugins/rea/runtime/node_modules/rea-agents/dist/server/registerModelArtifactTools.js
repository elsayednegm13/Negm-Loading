import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the named model contract to the shared inspection and session Evidence owners. */
export const registerModelArtifactTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_model_artifact");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options, { recordEvidence, evidenceById }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
