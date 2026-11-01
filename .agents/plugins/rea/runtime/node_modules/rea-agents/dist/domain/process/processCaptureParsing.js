import { z } from "zod";
import { processCaptureSchema } from "./processCapture.js";
const verifiedProcessCaptureSchema = processCaptureSchema.brand();
/** Parse a boundary value while retaining Zod's expected validation failure. */
export const safeParseProcessCapture = (input) => verifiedProcessCaptureSchema.safeParse(input);
/**
 * Parse unknown input and reject invalid commitments or semantics. Failures
 * throw the schema's ZodError so structural and semantic issues stay together.
 */
export const parseProcessCapture = (input) => verifiedProcessCaptureSchema.parse(input);
