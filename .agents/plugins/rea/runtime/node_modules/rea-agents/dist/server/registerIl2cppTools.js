import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the exact IL2CPP contract to its shared workflow and owning session Evidence ledger. */
export const registerIl2cppTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_il2cpp_metadata");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options, { recordEvidence, evidenceById }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
