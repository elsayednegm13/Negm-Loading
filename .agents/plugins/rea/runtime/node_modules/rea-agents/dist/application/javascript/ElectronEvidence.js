import { createEvidence, } from "../../domain/evidence.js";
/** Create Evidence for one Electron observation. */
export const createElectronEvidence = (operation, input, result, provider) => createEvidence(undefined, provider, {
    predicateType: operation === "list_electron_targets"
        ? "rea.electron-target-list"
        : "rea.electron-page-inspection",
    operation,
    parameters: parameters(input),
    result,
    confidence: "observed",
    authority: "external-service",
    environment: {
        id: `${result.browser.product}@${result.browser.revision}`,
        platform: "unknown",
        architecture: "unknown",
        isolation: "none",
    },
    limitations: [
        ...result.limitations,
        "Browser host platform and architecture were not observed.",
    ],
});
const parameters = (input) => ({
    cdp_endpoint: input.cdp_endpoint,
    ...("target_id" in input
        ? {
            target_id: input.target_id,
            observation_ms: input.observation_ms,
            include_script_sources: input.include_script_sources,
            ...(input.command_timeout_ms === undefined
                ? {}
                : { command_timeout_ms: input.command_timeout_ms }),
        }
        : {}),
});
