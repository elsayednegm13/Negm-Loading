import { z } from "incur";
import { visitRegisteredCommands } from "./visitRegisteredCommands.js";
const INPUT_GROUPS = ["args", "env", "options"];
/**
 * Advertise parser-filled defaults as omittable CLI inputs.
 *
 * Incur derives `--schema`, the `--llms` manifests, and help synopses from
 * Zod's output view, where a defaulted field always has a value and is
 * therefore listed as required. Callers may omit such a field, so each one is
 * wrapped as optional while its default, constraints, metadata, and parsed
 * value stay unchanged.
 */
export const presentOmittableDefaults = (cli) => {
    visitRegisteredCommands(cli, (command) => presentInputs(command));
};
const presentInputs = (command) => {
    for (const group of INPUT_GROUPS) {
        const schema = command[group];
        if (schema instanceof z.ZodObject)
            command[group] = withOmittableDefaults(schema);
    }
};
const withOmittableDefaults = (schema) => {
    const omittable = Object.entries(schema.shape).filter(([, field]) => fillsOmission(field));
    if (omittable.length === 0)
        return schema;
    return schema.safeExtend(Object.fromEntries(omittable.map(([key, field]) => [key, optionalWithMetadata(field)])));
};
/** Zod accepts an omitted value (`optin`) but always produces one (`optout`). */
const fillsOmission = (field) => field._zod.optin === "optional" && field._zod.optout === undefined;
const optionalWithMetadata = (field) => {
    const metadata = field.meta();
    return metadata === undefined
        ? field.optional()
        : field.optional().meta(metadata);
};
