import { retainedSummaryDelivery } from "./retainedSummaryDelivery.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { redactExplicitFailure } from "../domain/explicitSensitiveFailure.js";
import { captureSensitiveValues } from "../domain/webNetworkCapture.js";
import { err } from "../domain/result.js";
import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Bind historical inspection to its named contract and caller-owned Evidence writer. */
export const registerWebNetworkCaptureTool = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_web_network_capture");
    const delivery = retainedSummaryDelivery(new Set([contract.name]), {
        recordEvidence,
        evidenceById,
    });
    const registration = applicationToolRegistrationOptions(contract);
    // Keep the exact advertised contract; the shared service validates raw input
    // before effects so caller-declared sensitivity also covers invalid arguments.
    // SDK pre-validation otherwise emits unprojected issue paths as plain text.
    const handler = createEvidenceToolHandler(server, async (rawInput, options) => {
        const parsed = contract.inputSchema.safeParse(rawInput);
        if (!parsed.success)
            return err(redactExplicitFailure(analysisInputErrorFromIssues(contract.name, parsed.error.issues, rawInput, { cause: parsed.error }), captureSensitiveValues(rawInput)));
        const { detail, ...input } = parsed.data;
        const parameters = { detail };
        const ready = delivery.preflight(contract.name, parameters);
        if (!ready.ok)
            return ready;
        const inspected = await service.inspect(input, options);
        return inspected.ok
            ? delivery.projectEvidence(contract.name, parameters, inspected.value)
            : inspected;
    }, logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, registration, handler(contract));
};
