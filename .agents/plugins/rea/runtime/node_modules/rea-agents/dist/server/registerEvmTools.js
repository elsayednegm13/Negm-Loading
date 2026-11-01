import { evmInterfaceModule } from "../composition/evm.js";
import { createRetainedSummaryToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind the named EVM contract to shared validation and session Evidence recording. */
export const registerEvmTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = evmInterfaceModule.contract;
    const handler = createRetainedSummaryToolHandler(server, contract, (input, options) => service.inspect(input, options), logger, { recordEvidence, evidenceById }, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler);
};
