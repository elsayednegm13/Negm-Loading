import { JebAnalysisService } from "../application/jeb/JebAnalysisService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind JEB handlers to their exact named contracts through shared workflows. */
export const registerJebTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    const clientContract = toolContract("inspect_jeb_client");
    server.registerTool(clientContract.name, toolRegistrationOptions(clientContract), handler(clientContract));
    const openContract = toolContract("open_jeb_project");
    server.registerTool(openContract.name, toolRegistrationOptions(openContract), handler(openContract));
    const unitsContract = toolContract("list_jeb_units");
    server.registerTool(unitsContract.name, toolRegistrationOptions(unitsContract), handler(unitsContract));
    const decompileContract = toolContract("decompile_jeb_item");
    server.registerTool(decompileContract.name, toolRegistrationOptions(decompileContract), handler(decompileContract));
};
