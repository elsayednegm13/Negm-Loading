import { ApktoolResourceAnalysisService } from "../application/apktool/ApktoolResourceAnalysisService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind Apktool handlers to their exact named contracts. */
export const registerApktoolTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    for (const contract of [
        toolContract("inspect_apktool_client"),
        toolContract("decode_android_resources"),
    ]) {
        server.registerTool(contract.name, toolRegistrationOptions(contract), handler(contract));
    }
};
