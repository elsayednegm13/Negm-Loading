import { FlutterBuildAnalysisService } from "../application/flutter/FlutterBuildAnalysisService.js";
import { inspectDartAot } from "../application/flutter/DartAotInspection.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler, } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind Flutter handlers to their exact named contracts through admission. */
export const registerFlutterTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    const identify = toolContract("identify_flutter_build");
    server.registerTool(identify.name, toolRegistrationOptions(identify), handler(identify));
    const aotService = {
        execute: (_operation, input, options) => inspectDartAot(service, input, { recordEvidence, evidenceById }, options),
    };
    const aotHandler = createContractToolHandler(server, aotService, logger, recordEvidence, withAdmittedAnalysis);
    const aot = toolContract("inspect_dart_aot");
    server.registerTool(aot.name, toolRegistrationOptions(aot), aotHandler(aot));
};
