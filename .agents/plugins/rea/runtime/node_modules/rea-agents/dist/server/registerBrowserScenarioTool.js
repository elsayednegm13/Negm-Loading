import { optionalProviderUnavailable, } from "../application/OptionalObservationProviders.js";
import { err } from "../domain/result.js";
import { captureBrowserScenario } from "../application/BrowserScenarioCaptureService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { browserScenarioSchema } from "../domain/browserScenario.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
import { deliverEvidenceResult } from "./contractToolHandler.js";
/** Register the browser scenario tool with execution-time provider diagnostics. */
export const registerBrowserScenarioTool = (server, options) => {
    const contract = toolContract("capture_browser_scenario");
    server.registerTool(contract.name, toolRegistrationOptions(contract), async (input, context) => {
        const parsedScenario = browserScenarioSchema.safeParse(input);
        if (!parsedScenario.success)
            return server.delivery.toCallToolResult(err(analysisInputErrorFromIssues(contract.name, parsedScenario.error.issues, input, { cause: parsedScenario.error })), contract);
        const scenario = parsedScenario.data;
        if (options.loadFailure !== undefined)
            return server.delivery.toCallToolResult(err(optionalProviderUnavailable(options.loadFailure, contract.name)), contract);
        return runAdmittedToolOperation(server, options.withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
            const result = await logToolExecution(options.logger, contract.name, () => captureBrowserScenario(options.provider, scenario, {
                signal: context.mcpReq.signal,
            }));
            return deliverEvidenceResult(server, result, contract, options.recordEvidence);
        });
    });
};
