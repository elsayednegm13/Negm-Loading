import { analysisSettingsConstraints } from "./analysisSettingsConstraints.js";
import { toolContract } from "../contracts/toolContracts.js";
import { ok } from "../domain/result.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
/** Runtime settings remain usable without an active target or healthy provider. */
export const registerAnalysisSettingsTools = (server, settings) => {
    const inspect = toolContract("inspect_analysis_settings");
    server.registerTool(inspect.name, toolRegistrationOptions(inspect), async (input) => server.delivery.toCallToolResult(ok({
        ...settings.inspect(input),
        constraints: analysisSettingsConstraints(server.delivery),
    }), inspect));
    const update = toolContract("update_analysis_settings");
    server.registerTool(update.name, toolRegistrationOptions(update), async (input) => server.delivery.toCallToolResult(settings.update(input), update));
};
