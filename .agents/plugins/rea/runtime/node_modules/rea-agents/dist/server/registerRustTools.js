import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the exact Rust contract to its shared workflow and owning session Evidence ledger. */
export const registerRustTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_rust_binary");
    const handler = createEvidenceToolHandler(server, (input, options) => service.inspect(input, options, { recordEvidence, evidenceById }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
