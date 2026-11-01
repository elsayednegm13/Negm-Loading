import { toolReturnsTargetContent } from "../contracts/toolEffects.js";
/**
 * Run one complete tool workflow inside session admission when supplied.
 * `operationName` is the MCP tool name; an admission failure is marked with
 * that tool's target-content provenance like any other of its results.
 */
export const runAdmittedToolOperation = async (server, admission, operationName, signal, operation) => {
    if (admission === undefined)
        return operation();
    const admitted = await admission(operationName, signal, operation);
    return admitted.ok
        ? admitted.value
        : server.delivery.toErrorToolResult(admitted.error, toolReturnsTargetContent(operationName));
};
