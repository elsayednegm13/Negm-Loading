import { z } from "zod";
import { ConfigurationError } from "../domain/configurationErrors.js";
import { nulFreeStringSchema } from "../domain/localPath.js";
import { err, ok } from "../domain/result.js";
import { safeParseJson } from "../domain/safeJson.js";
/** Decode explicitly selected reference-source exclusion patterns. */
export const parseStringArray = (encoded, name) => {
    return parseConfiguredStringArray(encoded, name, z.string().min(1));
};
/** Decode Hopper arguments while preserving meaningful empty argv entries. */
export const parseLoaderArgs = (encoded) => {
    if (encoded === undefined)
        return ok([]);
    return parseConfiguredStringArray(encoded, "HOPPER_LOADER_ARGS_JSON", nulFreeStringSchema, "must encode an array of strings without NUL bytes");
};
const parseConfiguredStringArray = (encoded, setting, itemSchema, requirement = "must encode an array of strings") => {
    const decoded = safeParseJson(encoded);
    if (!decoded.ok)
        return err(configuredArrayError(setting, "must be valid JSON", decoded.cause));
    const parsed = z.array(itemSchema).safeParse(decoded.value);
    return parsed.success
        ? ok(parsed.data)
        : err(configuredArrayError(setting, requirement, parsed.error));
};
const configuredArrayError = (setting, requirement, cause) => {
    const constraint = `${setting} ${requirement}`;
    return new ConfigurationError(constraint, {
        cause,
        settings: [{ setting, constraint }],
    });
};
