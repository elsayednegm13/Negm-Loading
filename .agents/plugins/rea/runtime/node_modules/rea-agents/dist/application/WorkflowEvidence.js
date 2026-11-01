import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { jsonStringByteLength } from "../domain/jsonStringByteLength.js";
import { REA_WORKFLOW_PROVIDER } from "../domain/investigationProviders.js";
import { workflowAnalysisProfile } from "./WorkflowAnalysisProfile.js";
import { ok } from "../domain/result.js";
import { analysisProfileSchema, committedProviderSchema, } from "../domain/analysisProfile.js";
import { createEvidence, } from "../domain/evidence.js";
import { UnknownRegistryError } from "../domain/unknownRegistryError.js";
import { workflowUnknownInput } from "./investigation/WorkflowUnknown.js";
import { renderSourceLimitations, sourceLimitationKey, } from "./SourceLimitations.js";
const DECOMPILE_ALL_LIMITATIONS = {
    perItemOperations: new Set(["procedure_info", "procedure_pseudo_code"]),
    maxDistinct: 8,
    retainedIn: "each function's record in decompile-index.json keeps the caveats of the observations it used",
};
/** The caveat budget for a composed workflow, when it has one. */
export const composedLimitationBudget = (operation) => operation === "decompile_all" ? DECOMPILE_ALL_LIMITATIONS : undefined;
/** Retain the limits of exactly the observations used by one composed call. */
export const executeComposedWorkflow = async (analysis, execute, budget) => {
    const limitations = new Map();
    const evidenceLinks = new Set();
    const perItemGroups = new Set();
    let perItemBytes = 0;
    let omittedObservations = 0;
    let cachePolicy;
    const result = await execute({
        resourceScope: analysis.resourceScope,
        execute: async (operation, parameters, options) => {
            const execution = await analysis.execute(operation, parameters, options);
            if (execution.ok && execution.value.evidenceId !== undefined)
                evidenceLinks.add(execution.value.evidenceId);
            if (execution.ok && execution.value.cachePolicy === "live")
                cachePolicy = "live";
            if (execution.ok)
                for (const limitation of execution.value.limitations) {
                    const fact = {
                        provider: execution.value.provider,
                        operation,
                        limitation,
                    };
                    if (budget?.perItemOperations.has(operation) === true) {
                        // Reject oversized text before allocating a grouping key. Complete
                        // caveats are already retained by the export's per-function owner.
                        const maxBytes = budget.maxBytes ?? 8_000;
                        const bytes = jsonStringByteLength(limitation, maxBytes);
                        if (bytes > maxBytes) {
                            omittedObservations += 1;
                            continue;
                        }
                        const group = JSON.stringify([
                            fact.provider.id,
                            fact.provider.name,
                            fact.provider.version,
                            limitation,
                        ]);
                        if (!perItemGroups.has(group)) {
                            if (perItemGroups.size >= budget.maxDistinct ||
                                perItemBytes + bytes > maxBytes) {
                                omittedObservations += 1;
                                continue;
                            }
                            perItemGroups.add(group);
                            perItemBytes += bytes;
                        }
                    }
                    limitations.set(sourceLimitationKey(fact), fact);
                }
            return execution;
        },
    });
    if (!result.ok)
        return result;
    return ok({
        result: result.value,
        limitations: [
            ...renderSourceLimitations([...limitations.values()]),
            ...(omittedObservations === 0
                ? []
                : [
                    `${omittedObservations} per-item provider limitation observation${omittedObservations === 1 ? " was" : "s were"} omitted from this answer; ${budget?.retainedIn}.`,
                ]),
        ],
        ...(cachePolicy === undefined ? {} : { cachePolicy }),
        ...(evidenceLinks.size === 0
            ? {}
            : { evidenceLinks: [...evidenceLinks].sort(compareUnicodeCodePoints) }),
    });
};
/** Build the shared Evidence record for a successful composed binary workflow. */
export const createWorkflowEvidence = (input) => createEvidence(input.target, REA_WORKFLOW_PROVIDER, {
    operation: input.operation,
    parameters: input.parameters,
    result: input.result,
    ...(input.upstreamProfile === undefined
        ? {}
        : {
            analysisProfile: workflowAnalysisProfile(input.upstreamProfile, input.operation),
        }),
    confidence: "derived",
    ...(input.upstreamEvidenceLinks === undefined
        ? {}
        : { evidenceLinks: input.upstreamEvidenceLinks }),
    limitations: [
        "Derived by an REA composed workflow.",
        ...input.upstreamLimitations,
    ],
    ...(input.operation === "batch_decompile"
        ? { locations: batchProcedureLocations(input.result) }
        : {}),
});
const batchProcedureLocations = (result) => {
    if (result === null ||
        typeof result !== "object" ||
        Array.isArray(result) ||
        !Array.isArray(result.items))
        return [];
    const addresses = new Set();
    for (const item of result.items) {
        if (item === null || typeof item !== "object" || Array.isArray(item))
            continue;
        const procedure = item.procedure;
        if (procedure !== null &&
            typeof procedure === "object" &&
            !Array.isArray(procedure) &&
            procedure.status === "resolved" &&
            typeof procedure.address === "string")
            addresses.add(procedure.address);
    }
    return [...addresses].map((address) => ({ kind: "address", address }));
};
/** Convert workflow Evidence into its exact replay binding, when it has a profile. */
export const workflowSnapshotRecord = (evidence, operation, bindingProfile, cachePolicy) => {
    if (evidence.analysis_profile === null ||
        bindingProfile === undefined ||
        cachePolicy === "live")
        return undefined;
    return {
        operation,
        bindingProfile,
        parameters: evidence.parameters,
        execution: {
            result: evidence.normalized_result,
            rawResult: evidence.raw_result,
            provider: committedProviderSchema.parse(evidence.provider),
            analysisProfile: analysisProfileSchema.parse(evidence.analysis_profile),
            limitations: evidence.limitations,
            locations: evidence.locations,
            subject: evidence.subject === null
                ? null
                : {
                    path: evidence.subject.local_path,
                    sha256: evidence.subject.digest.sha256,
                    format: evidence.subject.format,
                    ...(evidence.subject.architecture === null
                        ? {}
                        : { architecture: evidence.subject.architecture }),
                },
        },
    };
};
/** Retain residual workflow questions using the shared investigation policy. */
export const recordWorkflowUnknowns = ({ name, result, evidenceId, recordUnknown, }) => {
    if (!["trace_feature", "trace_call_path", "inspect_native_api"].includes(name) ||
        recordUnknown === undefined ||
        typeof result !== "object" ||
        result === null ||
        Array.isArray(result) ||
        !Array.isArray(result.residual_unknowns))
        return { ok: true, value: null };
    for (const question of result.residual_unknowns) {
        if (typeof question !== "string")
            continue;
        const input = workflowUnknownInput(evidenceId, {
            question,
            severity: "medium",
            domain: name === "inspect_native_api" ? "native-api" : "control-flow",
            required_authority: "shipped-artifact",
            required_confidence: "observed",
            required_environment: null,
            recommended_probes: [
                {
                    operation: name,
                    rationale: name === "inspect_native_api"
                        ? "Confirm the unsupported boundary with a capable provider or ABI probe."
                        : "Continue with a focused query or another available provider.",
                },
            ],
            relationships: [],
        });
        if (!input.ok)
            return input;
        const recorded = recordUnknown(input.value);
        if (!recorded.ok &&
            !(recorded.error instanceof UnknownRegistryError &&
                recorded.error.reason === "already-exists"))
            return recorded;
    }
    return { ok: true, value: null };
};
