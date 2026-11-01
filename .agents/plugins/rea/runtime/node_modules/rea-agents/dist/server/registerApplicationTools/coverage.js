import { runAdmittedToolOperation } from "../admittedToolOperation.js";
import { evaluateReconstructionCoverage } from "../../application/ReconstructionCoverageService.js";
import { toolContract } from "../../contracts/toolContracts.js";
import { logToolExecution } from "../toolLogging.js";
import { applicationToolRegistrationOptions } from "../toolRegistrationOptions.js";
const contract = toolContract("evaluate_reconstruction_coverage");
/** Register the inline fail-closed reconstruction coverage evaluator. */
export const registerCoverageTools = (server, options) => {
    server.registerTool(contract.name, applicationToolRegistrationOptions(contract), async (input, context) => runAdmittedToolOperation(server, options.withAdmittedAnalysis, contract.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(options.logger, contract.name, () => Promise.resolve(evaluateReconstructionCoverage(input)));
        return server.delivery.toCallToolResult(result, contract);
    }));
};
