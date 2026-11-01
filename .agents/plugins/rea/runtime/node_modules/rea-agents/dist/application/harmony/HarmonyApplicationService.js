import { projectHarmonyInventory } from "../../domain/harmony/harmonyApplication.js";
import { HARMONY_APPLICATION_PROVIDER } from "../../domain/investigationProviders.js";
import { projectInventoryEvidence, } from "../InventoryProjectionEvidence.js";
const OPERATION = "project_harmony_application_graph";
/** Project authenticated HarmonyOS package inventory Evidence into application evidence. */
export const projectHarmonyApplicationEvidence = (rawInput) => {
    return projectInventoryEvidence({
        rawInput,
        project: projectHarmonyInventory,
        operation: OPERATION,
        predicateType: "rea.harmony-application-graph",
        provider: HARMONY_APPLICATION_PROVIDER,
        subjectFormat: (first) => first.subject?.format ?? "unknown",
    });
};
