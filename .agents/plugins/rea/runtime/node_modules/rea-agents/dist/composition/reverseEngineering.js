import { ReverseEngineeringService } from "../application/reverse/ReverseEngineeringService.js";
import { objdumpCommand, OBJDUMP_PROVIDER_IDENTITY, } from "../objdump/ObjdumpCommand.js";
import { rizinCommand, RIZIN_PROVIDER_IDENTITY, } from "../rizin/RizinCommand.js";
import { resolveWindowsProviderExecutable } from "./resolveWindowsProviderExecutable.js";
export const createReverseEngineeringCommandPort = (environment, platform = process.platform) => ({
    objdump: (input) => ({
        executable: providerExecutable(environment.REA_OBJDUMP_COMMAND ?? "objdump", environment, platform),
        arguments: objdumpCommand(input),
        identity: OBJDUMP_PROVIDER_IDENTITY,
        environmentOverrides: { DEBUGINFOD_URLS: "" },
    }),
    rizin: (input) => ({
        executable: providerExecutable(environment.REA_RIZIN_COMMAND ?? "rizin", environment, platform),
        arguments: rizinCommand(input),
        identity: RIZIN_PROVIDER_IDENTITY,
    }),
});
const providerExecutable = (executable, environment, platform) => platform === "win32"
    ? resolveWindowsProviderExecutable(executable, environment)
    : executable;
/** Compose BYO reverse-engineering commands without acquiring tools at import time. */
export const createReverseEngineeringService = (environment = process.env, options = {}) => {
    const environmentSnapshot = { ...environment };
    return new ReverseEngineeringService({
        ...options,
        environment: environmentSnapshot,
        commands: createReverseEngineeringCommandPort(environmentSnapshot),
    });
};
