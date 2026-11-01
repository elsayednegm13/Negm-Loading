import { toolContract } from "../contracts/toolContracts.js";
import { mcpProgressReporter } from "./mcpProgress.js";
import { deliverEvidenceResult } from "./contractToolHandler.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { runAdmittedToolOperation } from "./admittedToolOperation.js";
/** Bind distinct runtime operations to named contracts and the session's Evidence owner. */
export const registerWebRuntimeTools = (server, service, logger, recordEvidence, withAdmittedAnalysis) => {
    const execution = toolContract("observe_web_execution");
    const listeners = toolContract("inspect_web_event_listeners");
    server.registerTool(execution.name, toolRegistrationOptions(execution), async (input, context) => runAdmittedToolOperation(server, withAdmittedAnalysis, execution.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(logger, execution.name, () => service.observe(input, {
            signal: context.mcpReq.signal,
            progress: mcpProgressReporter(context),
        }));
        return deliverEvidenceResult(server, result, execution, recordEvidence);
    }));
    server.registerTool(listeners.name, toolRegistrationOptions(listeners), async (input, context) => runAdmittedToolOperation(server, withAdmittedAnalysis, listeners.name, context.mcpReq.signal, async () => {
        const result = await logToolExecution(logger, listeners.name, () => service.inspect(input, { signal: context.mcpReq.signal }));
        return deliverEvidenceResult(server, result, listeners, recordEvidence);
    }));
};
