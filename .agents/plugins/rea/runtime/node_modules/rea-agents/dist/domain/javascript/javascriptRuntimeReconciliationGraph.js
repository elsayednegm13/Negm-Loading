import { createJavaScriptApplicationGraph, mergeJavaScriptApplicationNodes, } from "./javascriptApplicationGraph.js";
import { uniqueSorted } from "../canonicalOrdering.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
/** Merge source graphs, runtime nodes, and inferred mappings into one valid JAG. */
export const buildReconciledApplicationGraph = (input) => {
    const merged = mergeJavaScriptApplicationNodes([
        ...input.layers.flatMap(({ graph }) => graph.nodes),
        ...input.runtime.nodes,
    ]);
    const allEdges = uniqueEdges([
        ...input.layers.flatMap(({ graph }) => graph.edges),
        ...input.runtime.edges,
        ...input.reconciliationEdges,
    ]);
    const bounded = boundGraphContent(input, merged, allEdges);
    const facts = graphCoverageFacts(input, bounded.omittedItems);
    const graph = createJavaScriptApplicationGraph({
        schema: "JavaScriptApplicationGraph",
        root_node_ids: bounded.rootNodeIds,
        nodes: bounded.nodes,
        edges: bounded.edges,
        coverage: graphCoverage(input, facts, bounded.nodes.length),
        limitations: uniqueSorted([
            ...input.layers.flatMap(({ graph }) => graph.limitations),
            "Runtime presence is bounded to passive capture windows and does not prove feature execution.",
            "Cross-layer observed_as edges are inferences; digest equality proves byte identity only.",
            "Source-map relationships retain their original static authority and are not promoted into runtime matches.",
            ...(facts.inputStatus === "truncated"
                ? [
                    "One or more source graphs or passive captures were incomplete or truncated.",
                ]
                : []),
            ...(facts.outputTruncated
                ? [
                    "The reconciled graph omitted entities or classifications during projection.",
                ]
                : []),
        ]),
    });
    return {
        graph,
        omittedGraphItems: bounded.omittedItems,
    };
};
const boundGraphContent = (input, nodes, edges) => {
    const allRoots = preferredRootIds(input);
    const rootNodeIds = allRoots;
    const sortedNodes = [...nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
    const retainedNodes = sortedNodes;
    const retainedIds = new Set(retainedNodes.map(({ node_id: id }) => id));
    const retainedEdges = [...edges]
        .sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id))
        .filter(({ source_node_id: source, target_node_id: target }) => retainedIds.has(source) && retainedIds.has(target));
    return {
        rootNodeIds,
        nodes: retainedNodes,
        edges: retainedEdges,
        omittedItems: 0,
    };
};
const preferredRootIds = (input) => {
    const runtime = [...input.runtime.targetNodeByEvidenceId.values()].map(({ node_id: id }) => id);
    const application = input.layers
        .filter(({ role }) => role === "application")
        .flatMap(({ graph }) => graph.root_node_ids);
    const supplemental = input.layers
        .filter(({ role }) => role !== "application")
        .flatMap(({ graph }) => graph.root_node_ids);
    return [...new Set([...runtime, ...application, ...supplemental])];
};
const graphCoverageFacts = (input, omittedNodeObservations) => {
    const projectionOmissions = input.runtime.omittedEntities +
        input.omittedReconciliationItems +
        omittedNodeObservations;
    const captureTruncated = input.captures.some(({ inspection }) => inspection.completeness.conditions.includes("truncated"));
    const captureHasUnknownOmissions = input.captures.some(({ inspection }) => inspection.completeness.unavailable_sections.length > 0);
    const inputTruncated = input.layers.some(({ graph }) => graph.coverage.truncated) ||
        captureTruncated;
    const inputComplete = input.layers.every(({ graph }) => graph.coverage.status === "complete") &&
        input.captures.every(({ inspection }) => inspection.completeness.status === "complete_within_window");
    const outputTruncated = projectionOmissions > 0;
    const sourceOmissions = input.layers.reduce((total, { graph }) => total + (graph.coverage.omitted_count ?? 0), 0);
    const omissionsKnown = !captureTruncated &&
        !captureHasUnknownOmissions &&
        input.layers.every(({ graph }) => graph.coverage.omitted_count !== null);
    return {
        projectionOmissions,
        knownOmissions: projectionOmissions + sourceOmissions,
        omissionsKnown,
        inputStatus: inputTruncated
            ? "truncated"
            : inputComplete
                ? "complete"
                : "partial",
        outputTruncated,
    };
};
const graphCoverage = (input, facts, nodeCount) => facts.inputStatus === "complete" && !facts.outputTruncated
    ? { status: "complete", truncated: false, omitted_count: 0, limits: [] }
    : facts.inputStatus === "truncated" || facts.outputTruncated
        ? {
            status: "partial",
            truncated: true,
            omitted_count: facts.omissionsKnown ? facts.knownOmissions : null,
            limits: [
                ...(facts.inputStatus === "truncated"
                    ? [
                        {
                            name: "runtime-reconciliation-input-coverage",
                            value: input.layers.length + input.captures.length,
                            unit: "items",
                        },
                    ]
                    : []),
                ...(facts.outputTruncated
                    ? [
                        {
                            name: "runtime-reconciliation-output-limits",
                            value: nodeCount,
                            unit: "items",
                        },
                    ]
                    : []),
            ],
        }
        : {
            status: "partial",
            truncated: false,
            omitted_count: facts.omissionsKnown ? facts.knownOmissions : null,
            limits: [],
        };
const uniqueEdges = (edges) => [
    ...new Map(edges.map((edge) => [edge.edge_id, edge])).values(),
];
