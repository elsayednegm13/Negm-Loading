import { resolve } from "node:path";
import { z } from "zod";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { readRuntimeReconciliationInput, reconcileJavaScriptRuntime, } from "../../domain/javascript/javascriptRuntimeReconciliation.js";
import { reconcileJavaScriptRuntimeInputSchema } from "../../domain/javascript/javascriptRuntimeReconciliationSchemas.js";
import { err, ok } from "../../domain/result.js";
import { createJavaScriptRuntimeReconciliationEvidence } from "./JavaScriptRuntimeReconciliationEvidence.js";
const OPERATION = "reconcile_javascript_runtime";
/** Derive a combined JAG from verified static and passive-runtime Evidence. */
export const reconcileJavaScriptRuntimeEvidence = (rawInput) => {
    const parsed = reconcileJavaScriptRuntimeInputSchema.safeParse(rawInput);
    if (!parsed.success)
        return err(analysisInputErrorFromIssues(OPERATION, parsed.error.issues, rawInput));
    return reconcileJavaScriptRuntimeEvidenceValidated(parsed.data);
};
/** Reconcile input already parsed by a trusted adapter boundary. */
export const reconcileJavaScriptRuntimeEvidenceValidated = (parsedInput) => {
    const parsed = readRuntimeReconciliationInput(normalizeRuntimeMappingRoots(parsedInput));
    if (!parsed.ok)
        return parsed;
    const result = reconcileJavaScriptRuntime(parsed.value);
    return ok(createJavaScriptRuntimeReconciliationEvidence(parsed.value.input, result));
};
const normalizeRuntimeMappingRoots = (input) => ({
    ...input,
    static_layers: input.static_layers.map((layer) => ({
        ...layer,
        runtime_mappings: layer.runtime_mappings.map((mapping) => mapping.kind === "file-root"
            ? {
                ...mapping,
                root: isPortableAbsolutePath(mapping.root)
                    ? mapping.root
                    : resolve(mapping.root),
            }
            : mapping),
    })),
});
const isPortableAbsolutePath = (path) => path.startsWith("/") ||
    /^[a-z]:[\\/]/iu.test(path) ||
    /^(?:\\\\|\/\/)[^\\/]+[\\/][^\\/]+(?:[\\/]|$)/u.test(path);
