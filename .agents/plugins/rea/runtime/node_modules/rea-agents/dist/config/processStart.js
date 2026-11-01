import { z } from "zod";
import { ConfigurationError } from "../domain/configurationErrors.js";
import { err, ok } from "../domain/result.js";
/** Settings rejected before CLI commands and MCP startup, required in every Doctor scope. */
export const processStartConfigurationSchema = z.object({
    REA_LOG_LEVEL: z
        .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
        .default("info"),
});
/** True when `setting` prevents the REA process from starting. */
export const blocksProcessStart = (setting) => Object.hasOwn(processStartConfigurationSchema.shape, setting);
/** Parse the optional REA_LOG_LEVEL environment variable. */
export const parseLogLevel = (value) => {
    const parsed = processStartConfigurationSchema.shape.REA_LOG_LEVEL.safeParse(value);
    if (parsed.success)
        return ok(parsed.data);
    return err(new ConfigurationError("Invalid REA environment configuration", {
        cause: parsed.error,
        settings: parsed.error.issues.map(({ message }) => ({
            setting: "REA_LOG_LEVEL",
            constraint: message,
        })),
    }));
};
