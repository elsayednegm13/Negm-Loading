import { javascriptSourceRangeKey } from "../../domain/javascript/javascriptSourceCoordinates.js";
import { javascriptDisplayText } from "../../domain/javascript/javascriptAstValues.js";
import { createJavaScriptSemanticGraphNode, createJavaScriptSemanticGraphUnknown, createJavaScriptSemanticGraphRelation, JavaScriptSemanticEvidenceContextRegistry, javaScriptSemanticNodeId, } from "../../domain/javascript/javascriptSemanticGraph.js";
import { inferredSemanticEvidence, observedSemanticEvidence, unavailableSemanticRootEvidence, } from "./JavaScriptSemanticGraphEvidence.js";
/** Create empty projection state; application-node links are bound at finish. */
export const createSemanticGraphProjectionState = () => ({
    nodes: new Map(),
    relations: new Map(),
    unknowns: new Map(),
    unknownCapacity: null,
    unknownOmissions: new Map(),
    evidenceContexts: new JavaScriptSemanticEvidenceContextRegistry(),
    roots: new Set(),
});
/** Bind retained semantic identities after all application observations exist. */
export const bindSemanticGraphApplicationNodes = (state, applicationGraph) => {
    const applicationNodeIdsByLocation = indexApplicationNodes(applicationGraph.nodes);
    for (const [identifier, node] of state.nodes) {
        state.nodes.set(identifier, {
            ...node,
            application_node_ids: [
                ...(applicationNodeIdsByLocation.get(applicationLocationKey(node.identity.artifact_sha256, node.identity.module_path, node.identity.source_range)) ?? []),
            ],
        });
    }
};
/** Construct one canonical semantic node backed by an exact artifact file. */
export const constructSemanticGraphNode = (file, input, state) => createJavaScriptSemanticGraphNode({
    kind: input.kind,
    identity: {
        artifact_sha256: file.sha256,
        module_path: file.path,
        source_range: input.location,
        role_key: input.roleKey,
    },
    function_node_id: input.functionNodeId,
    application_node_ids: [],
    label: input.label === null ? null : javascriptDisplayText(input.label),
    properties: input.properties ?? {},
    evidence: observedSemanticEvidence(file, input.location),
}, state.evidenceContexts);
/** Reuse retained identities and reject exhausted budgets before allocation. */
export const retainSemanticGraphNode = (state, file, input) => {
    const identifier = javaScriptSemanticNodeId({
        kind: input.kind,
        identity: {
            artifact_sha256: file.sha256,
            module_path: file.path,
            source_range: input.location,
            role_key: input.roleKey,
        },
    });
    const existing = state.nodes.get(identifier);
    if (existing !== undefined)
        return existing;
    if (typeof state.fileNodeBudget === "number" && state.fileNodeBudget <= 0) {
        state.fileNodesDropped = true;
        return null;
    }
    return addSemanticGraphNode(state, constructSemanticGraphNode(file, input, state));
};
/** Retain one canonical semantic node. */
export const addSemanticGraphNode = (state, node) => {
    const existing = state.nodes.get(node.node_id);
    if (existing !== undefined)
        return existing;
    const budget = state.fileNodeBudget;
    if (typeof budget === "number") {
        if (budget <= 0) {
            state.fileNodesDropped = true;
            return null;
        }
        state.fileNodeBudget = budget - 1;
    }
    state.nodes.set(node.node_id, node);
    return node;
};
/** Retain one non-self semantic relationship. */
export const addSemanticGraphRelation = (state, input) => {
    if (input.source === undefined ||
        input.source === null ||
        input.target === undefined ||
        input.target === null ||
        input.source.node_id === input.target.node_id)
        return;
    const value = createJavaScriptSemanticGraphRelation({
        source_node_id: input.source.node_id,
        target_node_id: input.target.node_id,
        relation: input.relation,
        resolution: input.resolution ?? "candidate",
        properties: input.properties ?? {},
        evidence: input.evidence ??
            inferredSemanticEvidence(state.evidenceContexts.resolve(input.source.evidence)),
    }, state.evidenceContexts);
    if (state.relations.has(value.relation_id))
        return;
    state.relations.set(value.relation_id, value);
};
/** Aggregate examined omissions without retaining unbounded discarded identities. */
export const recordSemanticUnknownOmission = (state, omission) => {
    const key = `${omission.family}:${omission.reason}`;
    const occurrences = (state.unknownOmissions.get(key)?.occurrences ?? 0) + omission.occurrences;
    if (!Number.isSafeInteger(occurrences))
        throw new RangeError("Semantic unknown omission count overflow");
    state.unknownOmissions.set(key, { ...omission, occurrences });
};
/** Admit unknown provenance only while its independent retained capacity allows it. */
export const addSemanticGraphUnknown = (state, input) => {
    if (state.unknownCapacity !== null &&
        state.unknowns.size >= state.unknownCapacity) {
        recordSemanticUnknownOmission(state, {
            family: input.family,
            reason: input.reason,
            occurrences: 1,
        });
        return;
    }
    const unknown = createJavaScriptSemanticGraphUnknown(input, state.evidenceContexts);
    if (state.unknowns.has(unknown.unknown_id))
        return;
    state.unknowns.set(unknown.unknown_id, unknown);
};
/** Add a truthful root when no source file could produce semantic IR. */
export const addSemanticFallbackRoot = (rootArtifactSha256, state) => {
    const node = addSemanticGraphNode(state, createJavaScriptSemanticGraphNode({
        kind: "module",
        identity: {
            artifact_sha256: rootArtifactSha256,
            module_path: "unknown-semantic-root",
            source_range: null,
            role_key: "artifact-root",
        },
        function_node_id: null,
        application_node_ids: [],
        label: "unavailable semantic root",
        properties: {},
        evidence: unavailableSemanticRootEvidence(rootArtifactSha256),
    }, state.evidenceContexts));
    if (node !== null)
        state.roots.add(node.node_id);
};
const indexApplicationNodes = (nodes) => {
    const identifiers = new Map();
    for (const node of nodes) {
        for (const observation of node.observations) {
            const { artifact, location } = observation.evidence;
            if (!artifact.available || !location.available)
                continue;
            if (location.value.kind === "artifact-path") {
                addApplicationNodeIdentifier(identifiers, applicationLocationKey(artifact.sha256, location.value.path, null), node.node_id);
            }
            if (location.value.kind === "source-range") {
                addApplicationNodeIdentifier(identifiers, applicationLocationKey(artifact.sha256, location.value.source, {
                    start: location.value.start,
                    end: location.value.end,
                }), node.node_id);
            }
        }
    }
    const indexed = new Map([...identifiers].map(([key, values]) => {
        const sorted = [...values].sort();
        return [key, sorted];
    }));
    return indexed;
};
const addApplicationNodeIdentifier = (identifiers, key, nodeId) => {
    const values = identifiers.get(key) ?? new Set();
    values.add(nodeId);
    identifiers.set(key, values);
};
const applicationLocationKey = (artifactSha256, path, range) => [
    artifactSha256,
    path,
    range === null ? "artifact-path" : javascriptSourceRangeKey(range),
].join("\u0000");
