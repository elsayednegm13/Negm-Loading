import { optionalProviderUnavailable, } from "../application/OptionalObservationProviders.js";
import { err } from "../domain/result.js";
import { listJavaScriptRuntimeTargets, observeJavaScriptRuntime, } from "../application/javascript/JavaScriptRuntimeObservationService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
import { deliverEvidenceResult } from "./contractToolHandler.js";
/** Register passive Inspector tools even when policy keeps them unavailable. */
export const registerJavaScriptRuntimeObservationTools = (server, options) => {
    const registration = { ...options, delivery: server.delivery, server };
    const listContract = toolContract("list_javascript_runtime_targets");
    const observeContract = toolContract("observe_javascript_runtime");
    server.registerTool(listContract.name, toolRegistrationOptions(listContract), (input, context) => runRuntimeTool(registration, listContract, { input, context }, (parsed, signal) => listJavaScriptRuntimeTargets(options.runtime, parsed, { signal })));
    server.registerTool(observeContract.name, toolRegistrationOptions(observeContract), (input, context) => runRuntimeTool(registration, observeContract, { input, context }, (parsed, signal) => observeJavaScriptRuntime(options.runtime, parsed, { signal })));
};
const runRuntimeTool = async (options, contract, request, execute) => {
    const { input, context } = request;
    if (options.loadFailure !== undefined)
        return options.delivery.toCallToolResult(err(optionalProviderUnavailable(options.loadFailure, contract.name)), contract);
    return runAdmittedToolOperation(options.server, options.withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(options.logger, contract.name, () => execute(input, context.mcpReq.signal));
        return deliverEvidenceResult(options.server, result, contract, options.recordEvidence);
    });
};
