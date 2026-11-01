import { projectAppleInventory } from "../../domain/apple/appleApplication.js";
import { APPLE_APPLICATION_PROVIDER } from "../../domain/investigationProviders.js";
import { projectInventoryEvidence, } from "../InventoryProjectionEvidence.js";
const OPERATION = "project_apple_application_graph";
/** Project authenticated IPA or macOS app inventory Evidence into Apple application evidence. */
export const projectAppleApplicationEvidence = (rawInput) => {
    return projectInventoryEvidence({
        rawInput,
        project: projectAppleInventory,
        operation: OPERATION,
        predicateType: "rea.apple-application-graph",
        provider: APPLE_APPLICATION_PROVIDER,
        subjectFormat: (first) => first.subject?.format ?? "unknown",
    });
};
