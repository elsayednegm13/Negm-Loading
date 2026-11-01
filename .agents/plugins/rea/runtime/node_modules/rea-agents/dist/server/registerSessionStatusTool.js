import { AnalysisError } from "../domain/analysisErrorBase.js";
import { buildCapabilityInventory, compactToolAvailability, } from "../application/CapabilityInventory.js";
import { toolContract } from "../contracts/toolContracts.js";
import { jsonObjectSchema } from "../domain/jsonValue.js";
import { createServerIdentity } from "../serverIdentity.js";
import { mcpClientMetadata } from "./mcpClientMetadata.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { err } from "../domain/result.js";
import { CURRENT_ENTRYPOINT_PATH } from "../process/CurrentEntrypointPath.js";
const probeSessionAvailability = (probes, signal) => Promise.all([
    probes.androidAnalysisAvailability(signal),
    probes.adbAnalysisAvailability?.(signal) ?? undefined,
    probes.apktoolAnalysisAvailability?.(signal) ?? undefined,
    probes.jebAnalysisAvailability?.(signal) ?? undefined,
    probes.evmLimiterAvailability?.(signal) ?? undefined,
]).then(([android, adb, apktool, jeb, evmLimiter]) => ({
    android,
    adb,
    apktool,
    jeb,
    evmLimiter,
}));
/** Register the read-only provider and target status operation. */
export const registerSessionStatusTool = (options) => {
    const { server, session, contract, startedAt, availabilityPolicy } = options;
    server.registerTool(contract.name, toolRegistrationOptions(contract), async (input, context) => {
        const { client, clientFeatures, protocolVersion } = mcpClientMetadata(context, server.server);
        let availabilityResults;
        let status;
        try {
            availabilityResults = await probeSessionAvailability(options, context.mcpReq.signal);
            status = await session.status({ signal: context.mcpReq.signal });
        }
        catch (cause) {
            if (!(cause instanceof AnalysisError))
                throw cause;
            return server.delivery.toCallToolResult(err(cause), contract);
        }
        const statusObject = jsonObjectSchema.parse(status);
        const toolAvailability = buildCapabilityInventory(status, {
            ...availabilityPolicy(),
            androidAnalysisAvailability: availabilityResults.android,
            ...(availabilityResults.adb === undefined
                ? {}
                : { adbAnalysisAvailability: availabilityResults.adb }),
            ...(availabilityResults.apktool === undefined
                ? {}
                : { apktoolAnalysisAvailability: availabilityResults.apktool }),
            ...(availabilityResults.jeb === undefined
                ? {}
                : { jebAnalysisAvailability: availabilityResults.jeb }),
            ...(availabilityResults.evmLimiter === undefined
                ? {}
                : { evmLimiterAvailability: availabilityResults.evmLimiter }),
        }, clientFeatures);
        const serverIdentity = createServerIdentity({
            startedAt,
            commandPath: CURRENT_ENTRYPOINT_PATH,
            catalog: server.catalogIdentity,
            expected: {
                ...(input.expected_package_version === undefined
                    ? {}
                    : { package_version: input.expected_package_version }),
                ...(input.expected_catalog_digest === undefined
                    ? {}
                    : { catalog_digest: input.expected_catalog_digest }),
                ...(input.expected_server_path === undefined
                    ? {}
                    : { server_path: input.expected_server_path }),
            },
            ...(client === undefined ? {} : { client }),
            ...(protocolVersion === undefined ? {} : { protocolVersion }),
        });
        return server.delivery.toCallToolResult({
            ok: true,
            value: projectSessionStatus({
                status: statusObject,
                toolAvailability,
                serverIdentity,
                clientFeatures,
            }),
        }, contract);
    });
};
const projectSessionStatus = (options) => jsonObjectSchema.parse({
    ...options.status,
    tool_availability: compactToolAvailability(options.toolAvailability),
    client_features: options.clientFeatures,
    server_identity: options.serverIdentity,
});
