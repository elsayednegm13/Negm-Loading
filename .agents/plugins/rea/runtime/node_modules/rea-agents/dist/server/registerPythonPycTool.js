import { toolContract } from "../contracts/toolContracts.js";
import { createEvidenceToolHandler } from "./contractToolHandler.js";
import { applicationToolRegistrationOptions } from "./toolRegistrationOptions.js";
import { requireAnalysisViewRetention, projectRetainedAnalysis, } from "../application/analysisView/AnalysisViewService.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
import { err } from "../domain/result.js";
/** Register the explicit-file CPython pyc workflow and retain its complete Evidence. */
export const registerPythonPycTool = (server, service, logger, recordEvidence, withAdmittedAnalysis, evidenceById) => {
    const contract = toolContract("inspect_python_pyc");
    const handler = createEvidenceToolHandler(server, async (rawInput, options) => {
        const parsed = contract.inputSchema.safeParse(rawInput);
        if (!parsed.success)
            return err(analysisInputErrorFromIssues(contract.name, parsed.error.issues, rawInput, { cause: parsed.error }));
        const { detail, view, ...input } = parsed.data;
        const retention = { recordEvidence, evidenceById };
        if (detail === "summary") {
            const ready = requireAnalysisViewRetention(contract.name, retention);
            if (!ready.ok)
                return ready;
        }
        const inspected = await service.inspect(input, options);
        return detail === "summary" && inspected.ok
            ? projectRetainedAnalysis(inspected.value, retention, view ?? { kind: "summary" })
            : inspected;
    }, logger, recordEvidence, withAdmittedAnalysis);
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), handler(contract));
};
