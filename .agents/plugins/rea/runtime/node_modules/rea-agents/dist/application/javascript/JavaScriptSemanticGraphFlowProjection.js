import { javascriptSourceRangeKey } from "../../domain/javascript/javascriptSourceCoordinates.js";
import { javaScriptSemanticNodeId } from "../../domain/javascript/javascriptSemanticGraph.js";
import { sourceRangesEqual } from "../../domain/javascript/javascriptStaticAnalysisHelpers.js";
import { retainSemanticGraphNode, addSemanticGraphRelation, addSemanticGraphUnknown, } from "./JavaScriptSemanticGraphConstruction.js";
import { inferredSemanticEvidenceAt, unknownSemanticEvidence, } from "./JavaScriptSemanticGraphEvidence.js";
/** Project result destructuring consistently for timers, child processes, and requests. */
export const projectSemanticResultBindings = (context, source, bindings) => {
    for (const projected of bindings)
        addSemanticGraphRelation(context.state, {
            source,
            target: context.bindingNodes.get(projected.bindingId),
            relation: "destructures",
            resolution: projected.resolution === "complete" ? "resolved" : "candidate",
            properties: {
                projection_path: [...projected.projectionPath],
                projection_resolution: projected.resolution,
            },
        });
};
/** Project explicit static Promise/task ownership without runtime claims. */
export const projectSemanticPromises = (context) => {
    const promiseNodes = new Map(context.ir.promiseOperations.flatMap((operation) => {
        const owner = operation.ownerCallableId === null
            ? undefined
            : context.callableNodes.get(operation.ownerCallableId);
        const node = retainSemanticGraphNode(context.state, context.file, {
            kind: operation.kind === "awaited-expression" ? "task" : "promise",
            roleKey: operation.promiseId,
            location: operation.location,
            label: promiseLabel(operation),
            functionNodeId: owner?.node_id ?? null,
            properties: {
                method: operation.method,
                operation_kind: operation.kind,
                ownership: operation.ownership,
                source_resolution: operation.sourceResolution,
            },
        });
        return node === null ? [] : [[operation.promiseId, node]];
    }));
    for (const operation of context.ir.promiseOperations) {
        const promise = promiseNodes.get(operation.promiseId);
        if (promise === undefined)
            continue;
        projectPromiseCreation(context, operation, promise);
        projectPromiseSources(context, operation, promise, promiseNodes);
        projectPromiseOwnership(context, operation, promise);
        if (operation.sourceResolution !== "complete" &&
            ["chain", "aggregate", "awaited-expression"].includes(operation.kind))
            addPromiseUnknown(context, operation, promise, promiseNodes);
    }
};
const promiseLabel = (operation) => operation.kind === "awaited-expression"
    ? "awaited expression"
    : `Promise.${operation.method}`;
const projectPromiseCreation = (context, operation, promise) => {
    if (operation.kind === "awaited-expression")
        return;
    addSemanticGraphRelation(context.state, {
        source: context.callSiteAt(operation.location),
        target: promise,
        relation: "creates-promise",
        resolution: operation.kind === "chain" || operation.sourceResolution !== "complete"
            ? "candidate"
            : "resolved",
    });
};
const projectPromiseSources = (context, operation, promise, promiseNodes) => {
    for (const sourceId of operation.sourcePromiseIds) {
        const source = promiseNodes.get(sourceId);
        if (operation.kind === "aggregate")
            addSemanticGraphRelation(context.state, {
                source: promise,
                target: source,
                relation: "aggregates",
                resolution: operation.sourceResolution === "complete" ? "resolved" : "candidate",
            });
        else
            addSemanticGraphRelation(context.state, {
                source,
                target: promise,
                relation: "chains",
                resolution: operation.sourceResolution === "complete" ? "resolved" : "candidate",
            });
    }
};
const projectPromiseOwnership = (context, operation, promise) => {
    const owner = operation.ownerCallableId === null
        ? context.moduleNode
        : context.callableNodes.get(operation.ownerCallableId);
    if (operation.ownership === "awaited")
        addSemanticGraphRelation(context.state, {
            source: owner,
            target: promise,
            relation: "awaits",
            resolution: "resolved",
        });
    else if (operation.ownership === "assigned")
        addSemanticGraphRelation(context.state, {
            source: operation.ownerBindingId === null
                ? undefined
                : context.bindingNodes.get(operation.ownerBindingId),
            target: promise,
            relation: "owns",
            resolution: "resolved",
        });
    else if (operation.ownership === "returned")
        addSemanticGraphRelation(context.state, {
            source: operation.returnSiteId === null
                ? undefined
                : context.returnSiteNodes.get(operation.returnSiteId),
            target: promise,
            relation: "returns-task",
            resolution: "resolved",
        });
    else if (operation.ownership === "detached")
        addSemanticGraphRelation(context.state, {
            source: owner,
            target: promise,
            relation: "detaches-task",
            resolution: "resolved",
        });
};
const addPromiseUnknown = (context, operation, promise, promiseNodes) => {
    const relation = operation.kind === "aggregate" ? "aggregates" : "chains";
    addSemanticGraphUnknown(context.state, {
        node_id: promise.node_id,
        family: "promise-ownership",
        relation_kinds: [relation],
        reason: "ambiguous-target",
        detail: `Static ${operation.method} source resolution was ${operation.sourceResolution}.`,
        candidate_node_ids: operation.sourcePromiseIds.flatMap((identifier) => {
            const candidate = promiseNodes.get(identifier);
            return candidate === undefined ? [] : [candidate.node_id];
        }),
        evidence: unknownSemanticEvidence(context.file, operation.location),
    });
};
const objectReadIndexes = new WeakMap();
/**
 * The object projection owns a member read's occurrence. Index it once per
 * file so return and argument flow can connect that expression without
 * scanning every property read again.
 */
const objectReadOccurrences = (context) => {
    const cached = objectReadIndexes.get(context.ir);
    if (cached !== undefined && cached.state === context.state)
        return cached.nodes;
    const nodes = new Map();
    for (const operation of context.ir.objectOperations) {
        if (operation.kind !== "read")
            continue;
        const node = context.state.nodes.get(javaScriptSemanticNodeId({
            kind: "expression",
            identity: {
                artifact_sha256: context.file.sha256,
                module_path: context.file.path,
                source_range: operation.location,
                role_key: operation.objectOperationId,
            },
        }));
        if (node !== undefined)
            nodes.set(javascriptSourceRangeKey(operation.location), node);
    }
    objectReadIndexes.set(context.ir, { state: context.state, nodes });
    return nodes;
};
/** Return the retained read occurrence for one unwrapped member expression. */
export const semanticObjectReadOccurrence = (context, location) => location === null
    ? undefined
    : objectReadOccurrences(context).get(javascriptSourceRangeKey(location));
/** Link direct return expressions to their retained semantic references. */
export const projectSemanticReturnValues = (context) => {
    for (const callable of context.ir.callables)
        for (const site of callable.returnSites) {
            const returnNode = context.returnSiteNodes.get(site.returnSiteId);
            const references = context.referenceNodesWithin(site.location);
            for (const reference of references)
                addSemanticGraphRelation(context.state, {
                    source: reference,
                    target: returnNode,
                    relation: "aliases",
                    resolution: site.identityReferenceLocation !== null &&
                        sourceRangesEqual(reference.identity.source_range, site.identityReferenceLocation)
                        ? "resolved"
                        : "candidate",
                });
            addSemanticGraphRelation(context.state, {
                source: semanticObjectReadOccurrence(context, site.valueExpressionLocation),
                target: returnNode,
                relation: "aliases",
                resolution: "resolved",
            });
        }
};
/** Link each captured binding to the callable at the exact reference site. */
export const projectSemanticClosureCaptures = (context) => {
    for (const capture of context.ir.closureCaptures)
        addSemanticGraphRelation(context.state, {
            source: context.bindingNodes.get(capture.bindingId),
            target: context.callableNodes.get(capture.callableId),
            relation: "captures",
            resolution: "resolved",
            evidence: inferredSemanticEvidenceAt(context.file, capture.referenceLocation),
        });
};
/** Retain bounded unresolved dynamic-call, dynamic-property and dynamic-scope frontiers. */
export function* projectSemanticFrontiers(context) {
    for (const [index, frontier] of context.ir.frontiers.entries()) {
        if (index % 64 === 0)
            yield;
        // Dynamic environments leave identifier reads and writes unresolved.
        const family = frontier.kind === "dynamic-call"
            ? "call-flow"
            : frontier.kind === "dynamic-scope"
                ? "data-flow"
                : "object-flow";
        const relationKinds = frontier.kind === "dynamic-call"
            ? ["calls"]
            : frontier.kind === "dynamic-scope"
                ? ["reads", "writes"]
                : ["reads-property", "writes-property"];
        addSemanticGraphUnknown(context.state, {
            node_id: frontier.callableId === null
                ? context.moduleNode.node_id
                : (context.callableNodes.get(frontier.callableId)?.node_id ??
                    context.moduleNode.node_id),
            family,
            relation_kinds: [...relationKinds],
            reason: frontier.kind,
            detail: frontier.reason,
            candidate_node_ids: [],
            evidence: unknownSemanticEvidence(context.file, frontier.location),
        });
    }
}
