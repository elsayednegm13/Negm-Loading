import { z } from "zod";
import { parseEvidence, immutableEvidence } from "./evidence.js";
import { EvidenceIntegrityError } from "./evidenceErrors.js";
import { describeValidationFailure } from "./validationFailure.js";
import { err, ok } from "./result.js";
/** Expected authentication failures, independent of a caller's error contract. */
export const safeParseEvidence = (input) => authenticateEvidence(input, parseEvidence);
/** Authenticate and seal source records while retaining typed validation failures. */
export const safeParseImmutableEvidence = (input) => authenticateEvidence(input, immutableEvidence);
/** Authenticate one source record, preserving unexpected implementation failures. */
export const readEvidence = (input) => {
    const parsed = safeParseEvidence(input);
    return parsed.ok ? parsed : err(integrityFailure(parsed.error));
};
/** Authenticate and seal source records retained independently of mutable input. */
export const readImmutableEvidence = (input) => {
    const parsed = safeParseImmutableEvidence(input);
    return parsed.ok ? parsed : err(integrityFailure(parsed.error));
};
const authenticateEvidence = (input, parse) => {
    try {
        return ok(parse(input));
    }
    catch (cause) {
        if (!(cause instanceof z.ZodError))
            throw cause;
        return err(cause);
    }
};
/** Validate an authenticated source payload, separately from generated output. */
export const readEvidencePayload = (schema, input) => {
    const parsed = schema.safeParse(input);
    return parsed.success ? ok(parsed.data) : err(integrityFailure(parsed.error));
};
const integrityFailure = (cause) => {
    const message = `Evidence validation failed ${describeValidationFailure(cause)}`;
    return new EvidenceIntegrityError(message, { cause, userMessage: message });
};
