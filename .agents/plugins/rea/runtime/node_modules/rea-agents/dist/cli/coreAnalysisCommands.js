import { registerCoreBinaryCommands } from "./coreBinaryCommands.js";
import { registerCoreNativeCommands } from "./coreNativeCommands.js";
/** Register core binary and native deep-analysis CLI commands. */
export const registerCoreAnalysisCommands = (cli, logger, runDirectAnalysis, environment) => {
    registerCoreBinaryCommands(cli, logger, runDirectAnalysis, environment);
    registerCoreNativeCommands(cli, logger, runDirectAnalysis);
};
