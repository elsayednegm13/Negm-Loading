import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the named GPU contract to the shared inspection and session Evidence owners. */
export const registerGpuCodeObjectsTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_gpu_code_objects");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options, { recordEvidence, evidenceById }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
};
