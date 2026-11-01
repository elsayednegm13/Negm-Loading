import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions, toolRegistrationOptions, } from "./toolRegistrationOptions.js";
/** Bind the named signal contract through shared admission and retained Evidence delivery. */
export const registerSignalTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const contract = toolContract("decode_signal_recording");
    const handler = createEvidenceToolHandler(server, (input, options) => service.decode(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
    const discovery = toolContract("inspect_signal_decoders");
    const discover = createEvidenceToolHandler(server, (input, options) => service.inspectDecoders(input, options), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(discovery.name, toolRegistrationOptions(discovery), discover(discovery));
};
