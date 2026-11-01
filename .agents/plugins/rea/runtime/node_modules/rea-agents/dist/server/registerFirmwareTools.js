import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind firmware handlers to their exact named schemas. */
export const registerFirmwareTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    const inspect = toolContract("inspect_firmware_regions");
    server.registerTool(inspect.name, toolRegistrationOptions(inspect), handler(inspect));
    const extract = toolContract("extract_firmware");
    server.registerTool(extract.name, toolRegistrationOptions(extract), handler(extract));
};
