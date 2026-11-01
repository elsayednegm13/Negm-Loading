import { z } from "zod";
/** Resource bound that prevented an exact semantic value. */
export const javaScriptSemanticResourceLimitSchema = z.enum([
    "primitive-candidates",
    "primitive-bytes",
    "expression-depth",
    "getter-expansion",
    "alias-selections",
]);
