import { AndroidAnalysisService } from "../application/android/AndroidAnalysisService.js";
import { inspectAndroidPackage } from "../application/android/AndroidPackageInspection.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createContractToolHandler, } from "./contractToolHandler.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind Android handlers to their exact named contracts through shared workflows. */
export const registerAndroidTools = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const handler = createContractToolHandler(server, service, logger, recordEvidence, withAdmittedAnalysis);
    const packageContract = toolContract("inspect_android_package");
    const packageService = {
        execute: (_operation, input, options) => inspectAndroidPackage(service, input, { recordEvidence, evidenceById }, options),
    };
    const packageHandler = createContractToolHandler(server, packageService, logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(packageContract.name, toolRegistrationOptions(packageContract), packageHandler(packageContract));
    const searchContract = toolContract("search_android_classes");
    server.registerTool(searchContract.name, toolRegistrationOptions(searchContract), handler(searchContract));
    const classContract = toolContract("inspect_android_class");
    server.registerTool(classContract.name, toolRegistrationOptions(classContract), handler(classContract));
    const methodContract = toolContract("inspect_android_method");
    server.registerTool(methodContract.name, toolRegistrationOptions(methodContract), handler(methodContract));
    const referencesContract = toolContract("trace_android_references");
    server.registerTool(referencesContract.name, toolRegistrationOptions(referencesContract), handler(referencesContract));
};
