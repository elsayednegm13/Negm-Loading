import { inspectAnalysisView } from "../application/analysisView/AnalysisViewService.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind selected-view projection to its named contract and session Evidence owner. */
export const registerAnalysisViewTool = (server, logger, evidenceById, recordEvidence, withAdmittedAnalysis, artifactResources) => {
    const contract = toolContract("inspect_analysis_view");
    const registration = applicationToolRegistrationOptions(contract);
    const handler = createEvidenceToolHandler(server, (input, options) => inspectAnalysisView(input, evidenceById, {
        ...(options.signal === undefined ? {} : { signal: options.signal }),
        ...(artifactResources === undefined
            ? {}
            : { resources: artifactResources }),
    }), logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, registration, handler(contract));
};
