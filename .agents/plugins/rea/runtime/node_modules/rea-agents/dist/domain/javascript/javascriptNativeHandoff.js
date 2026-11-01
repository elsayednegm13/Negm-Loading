import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
/** Build provider-neutral addon targets and link exact-subject native Evidence. */
export const buildJavaScriptNativeHandoffs = (graph, selectedNativeNodeIds, nativeEvidence) => {
    let nodeById;
    return graph.nodes
        .filter(({ kind, node_id }) => kind === "native-addon" && selectedNativeNodeIds.has(node_id))
        .flatMap((node) => {
        // Observations may describe only a containing archive. A native target
        // requires the node owner's exact byte identity, independently of its
        // path, availability labels or the artifact supporting an observation.
        if (node.identity.strategy !== "content-digest")
            return [];
        const digest = node.identity.sha256;
        const linked = nativeEvidence.filter(({ subject }) => subject?.digest.sha256 === digest);
        nodeById ??= new Map(graph.nodes.map((candidate) => [candidate.node_id, candidate]));
        const exportNodes = nativeExportNodes(node, graph.edges, nodeById);
        return [
            {
                native_node_id: node.node_id,
                artifact_sha256: digest,
                artifact_path: artifactPath(node),
                export_node_ids: exportNodes.map(({ node_id: id }) => id),
                requested_exports: requestedExports(exportNodes),
                status: linked.length === 0
                    ? "requires-provider-analysis"
                    : "evidence-linked",
                providers: uniqueProviders(linked),
                evidence_ids: linked
                    .map(({ evidence_id: id }) => id)
                    .sort(compareUnicodeCodePoints),
                recommended_tools: [
                    "open_binary",
                    "binary_overview",
                    "search_procedures",
                    "analyze_function",
                    "xrefs",
                ],
            },
        ];
    })
        .sort((left, right) => compareUnicodeCodePoints(left.native_node_id, right.native_node_id));
};
const artifactPath = (node) => {
    for (const { evidence } of node.observations)
        if (evidence.location.available &&
            evidence.location.value.kind === "artifact-path")
            return evidence.location.value.path;
    return null;
};
const nativeExportNodes = (addon, edges, nodeById) => {
    const ids = edges.flatMap((edge) => {
        if (edge.source_node_id === addon.node_id &&
            ["contains", "exposes"].includes(edge.relation))
            return [edge.target_node_id];
        if (edge.target_node_id === addon.node_id &&
            ["imports", "loads"].includes(edge.relation))
            return [edge.source_node_id];
        return [];
    });
    return [...new Set(ids)]
        .map((id) => nodeById.get(id))
        .filter((node) => node?.kind === "native-export")
        .sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
};
const requestedExports = (nodes) => {
    const values = nodes.flatMap((node) => node.observations.flatMap((observation) => [
        // Display labels can summarize several names or namespace access.
        // Only legacy observations without structured member facts need them.
        ...(observation.label === null ||
            Array.isArray(observation.properties.requested_members)
            ? []
            : [observation.label]),
        ...stringArray(observation.properties.requested_members),
        ...stringArray(observation.properties.members),
    ]));
    return [...new Set(values)].sort(compareUnicodeCodePoints);
};
const stringArray = (value) => Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
const uniqueProviders = (evidence) => [
    ...new Map(evidence.map(({ provider }) => [
        `${provider.id}\0${provider.name}\0${provider.version ?? ""}`,
        provider,
    ])).values(),
].sort((left, right) => compareUnicodeCodePoints(`${left.id}\0${left.name}\0${left.version ?? ""}`, `${right.id}\0${right.name}\0${right.version ?? ""}`));
