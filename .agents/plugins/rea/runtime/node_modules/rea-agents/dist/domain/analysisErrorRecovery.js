import { z } from "zod";
export const analysisErrorRecoverySchema = z.discriminatedUnion("kind", [
    z
        .object({
        kind: z.literal("inspect_input_contract"),
        operation: z.string().min(1),
    })
        .strict(),
    z
        .object({
        kind: z.literal("inspect_timeout_state"),
        operation: z.string().min(1),
        timeout_ms: z.number().int().positive(),
    })
        .strict(),
]);
