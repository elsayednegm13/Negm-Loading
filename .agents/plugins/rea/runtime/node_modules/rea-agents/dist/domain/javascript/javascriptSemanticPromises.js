import { javascriptSourceRangeKey } from "./javascriptSourceCoordinates.js";
import * as t from "@babel/types";
import { semanticCallableIdForNode } from "./javascriptSemanticProjection.js";
import { createSemanticCallableIdStack } from "./javascriptSemanticCallableStack.js";
import { semanticStaticPropertyName, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { resolveSemanticBindingState, } from "./javascriptSemanticState.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { traverseJavaScriptValueAst } from "./javascriptSemanticTraversal.js";
import { semanticBindingAtRead } from "./javascriptSemanticMutationInitializers.js";
import { isUnmodifiedGlobalReference } from "./javascriptSemanticAmbientWrites.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
import { assignedSemanticResultBindings, dataEffectMemberCallee, scalarAssignedResultBinding, } from "./javascriptSemanticDataEffectHelpers.js";
/** Recover explicit Promise construction, chaining, aggregation, and ownership. */
export const collectJavaScriptSemanticPromises = (program, state, callables) => {
    const candidates = collectCandidates(program, state, callables);
    const returnSiteIdFor = createReturnSiteLookup(callables);
    const candidateByNode = new WeakMap();
    for (const candidate of candidates)
        candidateByNode.set(candidate.node, candidate);
    return candidates.map((candidate) => {
        const ownership = promiseOwnership(candidate, candidateByNode, state, returnSiteIdFor);
        const sources = promiseSources(candidate, candidateByNode, state);
        return {
            promiseId: candidate.promiseId,
            kind: candidate.kind,
            method: candidate.method,
            location: range(candidate.node),
            ownerCallableId: candidate.ownerCallableId,
            ...ownership,
            sourcePromiseIds: [...new Set(sources.promiseIds)].sort(compareUnicodeCodePoints),
            sourceResolution: sources.status,
        };
    });
};
const collectCandidates = (program, state, callables) => {
    const output = [];
    const admittedCallables = new Set(callables.map(({ callableId }) => callableId));
    const callableStack = createSemanticCallableIdStack(admittedCallables);
    const ancestors = [];
    traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
        enter: (node, parent) => {
            callableStack.enter(node, parent);
            const details = promiseCandidateDetails(node, state);
            if (details !== null) {
                output.push({
                    node,
                    ...details,
                    promiseId: semanticPromiseId(details.kind, node),
                    ownerCallableId: callableStack.callables.at(-1) ?? null,
                    ancestors: [...ancestors],
                });
            }
            ancestors.push(node);
        },
        exit: (node) => {
            ancestors.pop();
            callableStack.exit(node);
        },
    });
    return output;
};
const promiseCandidateDetails = (node, state) => {
    if (t.isNewExpression(node) &&
        t.isIdentifier(node.callee, { name: "Promise" }) &&
        isUnmodifiedGlobalReference(node.callee, state, "Promise"))
        return { kind: "constructor", method: "new" };
    if (t.isCallExpression(node) || t.isOptionalCallExpression(node)) {
        const member = dataEffectMemberCallee(node);
        if (member === null)
            return null;
        const method = semanticStaticPropertyName(member.property, member.computed);
        if (t.isIdentifier(member.object, { name: "Promise" }) &&
            isUnmodifiedGlobalReference(node.callee, state, ["Promise", method ?? ""])) {
            if (method === "all" || method === "allSettled")
                return { kind: "aggregate", method };
            if (method === "resolve" || method === "reject")
                return { kind: "static", method };
        }
        if (method === "then" || method === "catch" || method === "finally")
            return { kind: "chain", method };
    }
    if (t.isAwaitExpression(node) && !isPromiseProducer(node.argument, state))
        return { kind: "awaited-expression", method: "await" };
    return null;
};
const isPromiseProducer = (node, state) => promiseCandidateDetails(unwrapJavaScriptExpression(node).node, state) !==
    null;
const semanticPromiseId = (kind, node) => `promise:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`;
const promiseOwnership = (candidate, candidateByNode, state, returnSiteIdFor) => {
    if (candidate.kind === "awaited-expression")
        return emptyOwnership("awaited");
    const context = {
        candidate,
        candidateByNode,
        state,
        returnSiteIdFor,
    };
    for (let index = candidate.ancestors.length - 1; index >= 0; index -= 1) {
        const ancestor = candidate.ancestors[index];
        if (ancestor === undefined)
            continue;
        const ownership = ownershipAtAncestor(ancestor, context);
        if (ownership === "boundary")
            break;
        if (ownership !== null)
            return ownership;
    }
    return emptyOwnership("unknown");
};
const ownershipAtAncestor = (ancestor, context) => {
    const { candidate, candidateByNode, state, returnSiteIdFor } = context;
    if (t.isAwaitExpression(ancestor))
        return unwrapJavaScriptExpression(ancestor.argument).node === candidate.node
            ? emptyOwnership("awaited")
            : "boundary";
    const outer = candidateByNode.get(ancestor);
    if (outer !== undefined &&
        outer.ownerCallableId === candidate.ownerCallableId &&
        outerConsumesCandidate(outer, candidate))
        return outer.kind === "chain"
            ? emptyOwnership("chained")
            : emptyOwnership("aggregated");
    if (isUnmodeledCall(ancestor, outer))
        return "boundary";
    const assigned = assignedPromiseBinding(ancestor, candidate.node, state);
    if (assigned !== undefined)
        return {
            ownership: "assigned",
            ownerBindingId: assigned,
            returnSiteId: null,
        };
    if (t.isReturnStatement(ancestor)) {
        if (ancestor.argument == null ||
            unwrapJavaScriptExpression(ancestor.argument).node !== candidate.node)
            return "boundary";
        return returnedPromiseOwnership(candidate.ownerCallableId, range(ancestor), returnSiteIdFor);
    }
    if (t.isExpressionStatement(ancestor))
        return unwrapJavaScriptExpression(ancestor.expression).node ===
            candidate.node
            ? emptyOwnership("detached")
            : "boundary";
    const callableId = semanticCallableIdForNode(ancestor);
    if (callableId === null || callableId !== candidate.ownerCallableId)
        return null;
    return t.isArrowFunctionExpression(ancestor) &&
        unwrapJavaScriptExpression(ancestor.body).node === candidate.node
        ? returnedPromiseOwnership(candidate.ownerCallableId, range(ancestor.body), returnSiteIdFor)
        : "boundary";
};
const isUnmodeledCall = (node, candidate) => candidate === undefined &&
    (t.isCallExpression(node) ||
        t.isOptionalCallExpression(node) ||
        t.isNewExpression(node));
const assignedPromiseBinding = (ancestor, candidate, state) => {
    if (!t.isVariableDeclarator(ancestor) && !t.isAssignmentExpression(ancestor))
        return undefined;
    const source = t.isVariableDeclarator(ancestor)
        ? ancestor.init
        : ancestor.right;
    if (source == null)
        return undefined;
    if (unwrapJavaScriptExpression(source).node !== candidate)
        return undefined;
    return scalarAssignedResultBinding(assignedSemanticResultBindings(source, [ancestor], state));
};
const returnedPromiseOwnership = (callableId, location, returnSiteIdFor) => ({
    ownership: "returned",
    ownerBindingId: null,
    returnSiteId: returnSiteIdFor(callableId, location),
});
const outerConsumesCandidate = (outer, candidate) => {
    if (outer.kind === "chain" &&
        (t.isCallExpression(outer.node) || t.isOptionalCallExpression(outer.node))) {
        const member = dataEffectMemberCallee(outer.node);
        return (member !== null &&
            unwrapJavaScriptExpression(member.object).node === candidate.node);
    }
    if (outer.kind === "aggregate" &&
        (t.isCallExpression(outer.node) || t.isOptionalCallExpression(outer.node))) {
        const input = outer.node.arguments[0];
        return (t.isArrayExpression(input) &&
            input.elements.some((element) => element !== null &&
                !t.isSpreadElement(element) &&
                unwrapJavaScriptExpression(element).node === candidate.node));
    }
    return false;
};
const emptyOwnership = (ownership) => ({
    ownership,
    ownerBindingId: null,
    returnSiteId: null,
});
const indexReturnSites = (callable) => {
    const output = new Map();
    for (const site of callable.returnSites) {
        const key = javascriptSourceRangeKey(site.location);
        if (!output.has(key))
            output.set(key, site.returnSiteId);
    }
    return output;
};
const createReturnSiteLookup = (callables) => {
    let callablesById;
    let returnSiteIdsByCallable;
    return (callableId, location) => {
        if (callableId === null)
            return null;
        callablesById ??= indexCallablesById(callables);
        const callable = callablesById.get(callableId);
        if (callable === undefined)
            return null;
        returnSiteIdsByCallable ??= new Map();
        let returnSiteIds = returnSiteIdsByCallable.get(callableId);
        if (returnSiteIds === undefined) {
            returnSiteIds = indexReturnSites(callable);
            returnSiteIdsByCallable.set(callableId, returnSiteIds);
        }
        return returnSiteIds.get(javascriptSourceRangeKey(location)) ?? null;
    };
};
const indexCallablesById = (callables) => {
    const output = new Map();
    for (const callable of callables) {
        if (output.has(callable.callableId))
            continue;
        output.set(callable.callableId, callable);
    }
    return output;
};
const promiseSources = (candidate, candidateByNode, state) => {
    if (candidate.kind === "chain") {
        const member = t.isCallExpression(candidate.node) ||
            t.isOptionalCallExpression(candidate.node)
            ? dataEffectMemberCallee(candidate.node)
            : null;
        return member === null
            ? unresolvedPromise()
            : resolvePromiseExpression(member.object, promiseResolutionContext(candidate, candidateByNode, state));
    }
    if (candidate.kind === "aggregate")
        return aggregateSources(candidate, candidateByNode, state);
    if (candidate.kind === "awaited-expression")
        return t.isAwaitExpression(candidate.node)
            ? resolvePromiseExpression(candidate.node.argument, promiseResolutionContext(candidate, candidateByNode, state))
            : unresolvedPromise();
    return { promiseIds: [], status: "complete" };
};
const aggregateSources = (candidate, candidateByNode, state) => {
    if (!t.isCallExpression(candidate.node) &&
        !t.isOptionalCallExpression(candidate.node))
        return unresolvedPromise();
    const input = candidate.node.arguments[0];
    if (!t.isArrayExpression(input))
        return unresolvedPromise();
    const resolutions = input.elements.map((element) => {
        if (element === null)
            return completePromise();
        if (t.isSpreadElement(element))
            return unresolvedPromise();
        if (isObviouslyNonPromise(element))
            return completePromise();
        return resolvePromiseExpression(element, promiseResolutionContext(candidate, candidateByNode, state));
    });
    return combinePromiseResolutions(resolutions);
};
const resolvePromiseExpression = (rawNode, context) => {
    const { current, candidateByNode, state, seenBindings } = context;
    const node = unwrapJavaScriptExpression(rawNode).node;
    const direct = candidateByNode.get(node);
    if (direct !== undefined && direct.promiseId !== current.promiseId)
        return { promiseIds: [direct.promiseId], status: "complete" };
    if (!t.isIdentifier(node))
        return unresolvedPromise();
    const binding = resolveSemanticBindingState(state, node, node.name);
    if (binding === undefined || seenBindings.has(binding.bindingId))
        return unresolvedPromise();
    const read = semanticBindingAtRead(binding, node, state.parentsByNode);
    if (read.status !== "ordered" ||
        !read.hasDefiniteInitializer ||
        read.binding.initializers.length !== 1)
        return unresolvedPromise();
    const initializer = read.binding.initializers[0];
    if (initializer === undefined || initializer.projection.length > 0)
        return unresolvedPromise();
    const nestedSeen = new Set(seenBindings);
    nestedSeen.add(binding.bindingId);
    return resolvePromiseExpression(initializer.node, {
        ...context,
        seenBindings: nestedSeen,
    });
};
const promiseResolutionContext = (current, candidateByNode, state) => ({
    current,
    candidateByNode,
    state,
    seenBindings: new Set(),
});
const combinePromiseResolutions = (resolutions) => ({
    promiseIds: resolutions.flatMap(({ promiseIds }) => promiseIds),
    status: resolutions.some(({ status }) => status === "unresolved")
        ? resolutions.some(({ status }) => status === "complete")
            ? "partial"
            : "unresolved"
        : resolutions.some(({ status }) => status === "partial")
            ? "partial"
            : "complete",
});
const completePromise = () => ({
    promiseIds: [],
    status: "complete",
});
const unresolvedPromise = () => ({
    promiseIds: [],
    status: "unresolved",
});
const isObviouslyNonPromise = (node) => t.isLiteral(node) ||
    t.isObjectExpression(node) ||
    t.isFunction(node) ||
    t.isClassExpression(node);
