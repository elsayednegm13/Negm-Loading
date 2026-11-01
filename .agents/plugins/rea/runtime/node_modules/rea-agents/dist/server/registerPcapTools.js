import { PcapAnalysisService } from "../application/pcap/PcapAnalysisService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler, createRetainedSummaryToolHandler, } from "./contractToolHandler.js";
import { toolRegistrationOptions, applicationToolRegistrationOptions, } from "./toolRegistrationOptions.js";
/** Bind pcap handlers to their exact named contracts through admission. */
export const registerPcapTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    const clientContract = toolContract("inspect_pcap_client");
    server.registerTool(clientContract.name, toolRegistrationOptions(clientContract), handler(clientContract));
    const contract = toolContract("inspect_pcap_capture");
    const capture = createRetainedSummaryToolHandler(server, contract, (input, options) => service.execute(contract.name, input, options), logger, { recordEvidence, evidenceById }, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), capture);
};
