import { z } from "zod";
/**
 * An array schema's own constraints, such as a minimum length, without its
 * element schema. Pair it with {@link parseElementSteps} to validate a large
 * collection in cooperative steps.
 */
export const arrayContainerSchema = (array) => array.clone({ ...array.def, element: z.unknown() });
/** Elements validated between yields, in the issues and paths a whole-array parse reports. */
export function* parseElementSteps(element, values, path, issues) {
    const parsed = [];
    for (const [index, value] of values.entries()) {
        if (index % 64 === 0)
            yield;
        const result = element.safeParse(value);
        if (result.success)
            parsed.push(result.data);
        else
            issues.push(...result.error.issues.map((issue) => ({
                ...issue,
                path: [...path, index, ...issue.path],
            })));
    }
    return parsed;
}
