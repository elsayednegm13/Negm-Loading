import { createEvidence, } from "../evidence.js";
/** Preserve the same validated inference and provenance on success and failed finalization. */
export const evmInterfaceEvidence = (input, execution) => createEvidence(execution.subject, execution.provider, {
    operation: "inspect_evm_interface",
    parameters: {
        path: input.path,
        encoding: input.encoding,
        ...(input.timeout_ms === undefined
            ? {}
            : { timeout_ms: input.timeout_ms }),
    },
    result: execution.result,
    ...(execution.rawResult === null ? {} : { rawResult: execution.rawResult }),
    confidence: "inferred",
    locations: execution.locations,
    limitations: execution.limitations,
});
