import { toolContract } from "../contracts/toolContracts.js";
import { runWithExternalMutationAdmission, } from "./externalMutationAdmission.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Register Cutter discovery and command tools against their named contracts. */
export const registerCutterTools = (server, service, logger, delivery, recordEvidence, session) => {
    const list = toolContract("list_cutter_sessions");
    const command = toolContract("cutter_command");
    server.registerTool(list.name, toolRegistrationOptions(list), async (_input, context) => {
        const result = await logToolExecution(logger, list.name, () => service.listSessions({ signal: context.mcpReq.signal }));
        if (!result.ok)
            return delivery.toCallToolResult(result, list);
        return delivery.toCallToolResult({
            ok: true,
            value: { ...result.value, sessions: [...result.value.sessions] },
        }, list);
    });
    server.registerTool(command.name, toolRegistrationOptions(command), async (input, context) => {
        const result = await runWithExternalMutationAdmission(session, command.name, context.mcpReq.signal, () => logToolExecution(logger, command.name, () => service.execute(input, { signal: context.mcpReq.signal })), (value) => value, () => service.retryCleanup());
        if (!result.ok)
            return delivery.toPartialErrorToolResult(result.error, command.returnsTargetContent, recordEvidence);
        return delivery.toEvidenceToolResult(result.value, command, recordEvidence?.(result.value));
    });
};
