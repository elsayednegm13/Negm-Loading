import { projectRetainedAnalysis, requireAnalysisViewRetention, } from "../application/analysisView/AnalysisViewService.js";
import { optionalProviderUnavailable, } from "../application/OptionalObservationProviders.js";
import { err } from "../domain/result.js";
import { captureElectronScenario } from "../application/javascript/ElectronActiveObservationService.js";
import { inspectElectronPage, listElectronTargets, } from "../application/javascript/ElectronObservationService.js";
import { analyzeJavaScriptApplicationValidated } from "../application/javascript/JavaScriptApplicationService.js";
import { reconcileJavaScriptRuntimeEvidenceValidated } from "../application/javascript/JavaScriptRuntimeReconciliationService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { mcpProgressReporter } from "./mcpProgress.js";
import { logToolExecution } from "./toolLogging.js";
import { applicationToolRegistrationOptions, toolRegistrationOptions, } from "./toolRegistrationOptions.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
import { createEvidenceToolHandler, deliverEvidenceResult, } from "./contractToolHandler.js";
/** Register Electron tools even when a provider is absent. */
// oxlint-disable-next-line max-lines-per-function -- direct SDK calls retain each schema-handler type correlation.
export const registerElectronTools = (server, options) => {
    const registration = { ...options, delivery: server.delivery, server };
    registerElectronFuseTool(server, options);
    const listContract = toolContract("list_electron_targets");
    const inspectContract = toolContract("inspect_electron_page");
    const analyzeContract = toolContract("analyze_javascript_application");
    const reconcileContract = toolContract("reconcile_javascript_runtime");
    const activeContract = toolContract("capture_electron_scenario");
    server.registerTool(listContract.name, toolRegistrationOptions(listContract), (input, context) => runElectronTool(registration, listContract, options.observationLoadFailure, { input, context }, (parsed, { signal }) => listElectronTargets(options.electron, parsed, {
        signal,
    })));
    server.registerTool(inspectContract.name, toolRegistrationOptions(inspectContract), (input, context) => runElectronTool(registration, inspectContract, options.observationLoadFailure, { input, context }, (parsed, { signal, progress }) => inspectElectronPage(options.electron, parsed, {
        signal,
        progress,
    })));
    server.registerTool(analyzeContract.name, toolRegistrationOptions(analyzeContract), (input, context) => runElectronTool(registration, analyzeContract, undefined, { input, context }, async ({ detail, view, ...request }, { signal, progress }) => {
        if (detail === "summary") {
            const ready = requireAnalysisViewRetention(analyzeContract.name, options);
            if (!ready.ok)
                return ready;
        }
        const analyzed = await analyzeJavaScriptApplicationValidated(request, options.artifactResources, {
            signal,
            progress,
            environment: options.environment,
            ...(server.analysisSettings === undefined
                ? {}
                : { settings: server.analysisSettings.read }),
        });
        return detail === "summary" && analyzed.ok
            ? projectRetainedAnalysis(analyzed.value, options, view ?? { kind: "summary" })
            : analyzed;
    }));
    server.registerTool(reconcileContract.name, toolRegistrationOptions(reconcileContract), (input, context) => runElectronTool(registration, reconcileContract, undefined, { input, context }, (parsed) => Promise.resolve(reconcileJavaScriptRuntimeEvidenceValidated(parsed))));
    server.registerTool(activeContract.name, toolRegistrationOptions(activeContract), (input, context) => runElectronTool(registration, activeContract, options.activeLoadFailure, { input, context }, (parsed, { signal, progress }) => captureElectronScenario(options.electronActive, parsed, {
        signal,
        progress,
    })));
};
const registerElectronFuseTool = (server, options) => {
    const contract = toolContract("inspect_electron_fuses");
    const handler = createEvidenceToolHandler(server, (input, execution) => options.electronFuses.inspect(input, execution), options.logger, options.recordEvidence, options.withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
const runElectronTool = async (options, contract, loadFailure, request, execute) => {
    const { input, context } = request;
    if (loadFailure !== undefined)
        return options.delivery.toCallToolResult(err(optionalProviderUnavailable(loadFailure, contract.name)), contract);
    return runAdmittedToolOperation(options.server, options.withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(options.logger, contract.name, () => execute(input, {
            signal: context.mcpReq.signal,
            progress: mcpProgressReporter(context),
        }));
        return deliverEvidenceResult(options.server, result, contract, options.recordEvidence);
    });
};
