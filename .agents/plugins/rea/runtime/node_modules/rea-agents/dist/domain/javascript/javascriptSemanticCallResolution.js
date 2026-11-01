import { javascriptSourceRangeContains } from "./javascriptSourceCoordinates.js";
import * as t from "@babel/types";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { semanticCallableIdForNode } from "./javascriptSemanticProjection.js";
import { semanticBindingAtRead, semanticEffectTiming, } from "./javascriptSemanticMutationInitializers.js";
import { unwrapJavaScriptExpression, runtimeFunctionParameters, } from "./javascriptAstValues.js";
import { resolveSemanticBindingState, } from "./javascriptSemanticState.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
/** Resolve local callable candidates without following dynamic properties. */
export const resolveLocalCallables = (input) => resolveCallables(input.node, {
    state: input.state,
    callableById: input.callableById,
    seenInitializers: input.seenInitializers,
    seenBindings: new Set(),
    bindingCache: input.bindingCache,
});
const resolveCallables = (node, context) => {
    // `unwrapJavaScriptExpression` strips all transparent layers iteratively,
    // so a single recursion step suffices (no per-layer stack growth).
    const unwrapped = unwrapJavaScriptExpression(node).node;
    if (unwrapped !== node)
        return resolveCallables(unwrapped, context);
    const direct = semanticCallableIdForNode(node);
    if (direct !== null && context.callableById.has(direct))
        return {
            callableIds: [direct],
            complete: true,
            reason: "Direct local callable.",
        };
    if (t.isIdentifier(node))
        return resolveIdentifier(node, context);
    if (t.isConditionalExpression(node) || t.isLogicalExpression(node))
        return resolveAlternatives(t.isConditionalExpression(node) ? node.consequent : node.left, t.isConditionalExpression(node) ? node.alternate : node.right, context);
    return {
        callableIds: [],
        complete: false,
        reason: `Unsupported ${node.type} call target.`,
    };
};
const resolveIdentifier = (node, context) => {
    const cached = context.bindingCache.get(node);
    if (cached !== undefined)
        return cached;
    const binding = resolveSemanticBindingState(context.state, node, node.name);
    if (binding === undefined)
        return {
            callableIds: [],
            complete: false,
            reason: `Unresolved call target ${node.name}.`,
        };
    const read = semanticBindingAtRead(binding, node, context.state.parentsByNode);
    // A full read re-enters the same candidate set wherever the chain returns
    // to this binding. Close that cycle at the binding; position-narrowed reads
    // keep their per-initializer cycle handling.
    const selectsAll = read.binding === binding;
    if (selectsAll && context.seenBindings.has(binding))
        return {
            callableIds: [],
            complete: false,
            cycleDependent: true,
            reason: `Call target initializer cycle at ${binding.name}.`,
        };
    const candidates = resolveBindingCallables(read.binding, node, selectsAll
        ? {
            ...context,
            seenBindings: new Set(context.seenBindings).add(binding),
        }
        : context);
    // Knowing every local candidate does not prove that any write replaced the
    // incoming value, or that a write in another activation precedes this read.
    const covered = read.hasDefiniteInitializer;
    const resolution = candidates.complete && !covered
        ? {
            ...candidates,
            complete: false,
            reason: `Call target ${binding.name} may retain an incoming value or an unordered assignment.`,
        }
        : candidates;
    // Key by the immutable read, not binding identity: before/after snapshots
    // differ. Cache cycle-independent partial results too, keeping alias
    // diamonds linear even when their shared leaf has an unknown incoming value.
    if (!resolution.cycleDependent)
        context.bindingCache.set(node, resolution);
    return resolution;
};
const resolveAlternatives = (left, right, context) => {
    const candidates = [left, right].map((candidate) => resolveCallables(candidate, context));
    return {
        callableIds: uniqueCallableIds(candidates.flatMap(({ callableIds }) => callableIds)),
        complete: candidates.every(({ complete }) => complete),
        reason: "Conditional or logical call target has multiple candidates.",
        ...(candidates.some((candidate) => candidate.cycleDependent)
            ? { cycleDependent: true }
            : {}),
    };
};
const resolveBindingCallables = (binding, site, context) => {
    if (binding.initializers.length === 0)
        return missingBindingInitializer(binding);
    const candidates = binding.initializers.map((initializer) => {
        if (context.seenInitializers.has(initializer))
            return {
                callableIds: [],
                complete: false,
                cycleDependent: true,
                reason: `Call target initializer cycle at ${binding.name}.`,
            };
        return initializer.projection.length === 0
            ? resolveCallables(initializer.node, {
                ...context,
                seenInitializers: new Set([
                    ...context.seenInitializers,
                    initializer,
                ]),
            })
            : {
                callableIds: [],
                complete: false,
                reason: `Projected call target ${binding.name} is unresolved.`,
            };
    });
    const callableIds = uniqueCallableIds(candidates.flatMap((candidate) => candidate.callableIds));
    // Pattern writes are owned reference facts, not ordinary initializers. A
    // read may retain both an earlier callable and a conditional projected
    // replacement. Until projected callable resolution is supported here,
    // preserve known candidates without claiming they cover every target.
    const complete = !binding.referenceInitializers.some((initializer) => initializer.assignment &&
        semanticEffectTiming(site, initializer.node, context.state) !== "after") && candidates.every(({ complete }) => complete);
    const resolution = {
        callableIds,
        complete,
        reason: callableIds.length === 1 && complete
            ? "Unique local callable target."
            : `Call target ${binding.name} has ambiguous or unsupported assignments.`,
        ...(candidates.some((candidate) => candidate.cycleDependent)
            ? { cycleDependent: true }
            : {}),
    };
    return resolution;
};
const missingBindingInitializer = (binding) => ({
    callableIds: [],
    complete: false,
    reason: binding.kind === "import"
        ? `Call target ${binding.name} is imported from outside this source.`
        : `Call target ${binding.name} has no local initializer.`,
});
/** Find all bindings introduced by one positional parameter pattern. */
export const parameterBindings = (callable, index, state) => {
    if (callable.bodyScopeId === null)
        return [];
    const scope = state.scopesById.get(callable.bodyScopeId);
    if (scope === undefined)
        return [];
    return [...scope.bindings.values()]
        .filter((binding) => binding.kind === "parameter" &&
        binding.definitions.some(({ kind, location }) => kind === "parameter" &&
            parameterAcceptsArgument(callable, location, index, state)))
        .sort((left, right) => compareUnicodeCodePoints(left.bindingId, right.bindingId));
};
const parameterAcceptsArgument = (callable, location, argumentIndex, state) => {
    const node = state.callableNodesById.get(callable.callableId);
    if (!t.isFunction(node))
        return false;
    const parameters = runtimeFunctionParameters(node);
    const parameterIndex = parameters.findIndex((parameter) => javascriptSourceRangeContains(range(parameter), location));
    if (parameterIndex === argumentIndex)
        return true;
    return (parameterIndex >= 0 &&
        parameterIndex < argumentIndex &&
        t.isRestElement(parameters[parameterIndex]));
};
const uniqueCallableIds = (values) => [...new Set(values)].sort(compareUnicodeCodePoints);
