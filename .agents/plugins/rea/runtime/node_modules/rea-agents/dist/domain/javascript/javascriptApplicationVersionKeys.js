import { canonicalJson } from "../comparisonSemantics.js";
import { compareUnicodeCodePoints, compositeKey, } from "../unicodeCodePointOrder.js";
import { applicationEndpointCorrespondence } from "./javascriptApplicationEndpointCorrespondence.js";
const matchTiers = () => [
    {
        match: { basis: "exact-content-digest", confidence: "exact" },
        key: contentDigestKey,
    },
    {
        match: { basis: "exact-module-source-digest", confidence: "exact" },
        key: moduleSourceDigestKey,
    },
    {
        match: { basis: "exact-node-identity", confidence: "exact" },
        key: nodeIdentityKey,
    },
    {
        match: { basis: "source-map-identity", confidence: "high" },
        key: sourceMapKey,
    },
    {
        match: { basis: "structural-fingerprint", confidence: "medium" },
        key: structuralFingerprintKey,
    },
    {
        match: { basis: "semantic-key", confidence: "medium" },
        key: semanticKey,
    },
];
/** Apply ordered, unique-only matching tiers without fuzzy pairing. */
export const matchJavaScriptApplicationVersions = (leftNodes, rightNodes) => {
    const left = new Map(leftNodes.map((node) => [node.node_id, node]));
    const right = new Map(rightNodes.map((node) => [node.node_id, node]));
    const pairs = [];
    const ambiguousGroups = [];
    for (const tier of matchTiers())
        applyTier({ left, right, pairs, ambiguousGroups, tier });
    const remainingLeft = sortedNodes(left.values());
    const remainingRight = sortedNodes(right.values());
    const leftCandidates = new Map();
    const rightCandidates = new Map();
    // Later tiers can pair members of an ambiguous group. Expand only survivors,
    // without pairing groups that became unique after those later matches.
    for (const group of ambiguousGroups) {
        const leftGroup = group.left.filter((node) => left.has(node.node_id));
        if (leftGroup.length === 0)
            continue;
        const rightGroup = group.right.filter((node) => right.has(node.node_id));
        if (rightGroup.length === 0)
            continue;
        recordCandidates(leftGroup, rightGroup, leftCandidates, rightCandidates);
    }
    return {
        pairs: pairs.sort((a, b) => compareUnicodeCodePoints(`${a.left.node_id}\0${a.right.node_id}`, `${b.left.node_id}\0${b.right.node_id}`)),
        unmatchedLeft: remainingLeft,
        unmatchedRight: remainingRight,
        candidatesForLeft: sortedCandidates(leftCandidates),
        candidatesForRight: sortedCandidates(rightCandidates),
    };
};
const applyTier = (context) => {
    const leftByKey = nodesByKey(context.left.values(), context.tier.key);
    const rightByKey = nodesByKey(context.right.values(), context.tier.key);
    for (const key of [...leftByKey.keys()].sort(compareUnicodeCodePoints)) {
        const leftGroup = leftByKey.get(key) ?? [];
        const rightGroup = rightByKey.get(key);
        if (rightGroup === undefined)
            continue;
        if (leftGroup.length !== 1 || rightGroup.length !== 1) {
            context.ambiguousGroups.push({ left: leftGroup, right: rightGroup });
            continue;
        }
        const leftNode = leftGroup[0];
        const rightNode = rightGroup[0];
        if (leftNode === undefined || rightNode === undefined)
            continue;
        context.pairs.push({
            left: leftNode,
            right: rightNode,
            ...context.tier.match,
        });
        context.left.delete(leftNode.node_id);
        context.right.delete(rightNode.node_id);
    }
};
const nodesByKey = (nodes, keyFor) => {
    const output = new Map();
    for (const node of nodes) {
        const key = keyFor(node);
        if (key === null)
            continue;
        const group = output.get(key);
        if (group === undefined)
            output.set(key, [node]);
        else
            group.push(node);
    }
    return output;
};
const recordCandidates = (left, right, leftCandidates, rightCandidates) => {
    for (const leftNode of left) {
        const candidates = leftCandidates.get(leftNode.node_id) ?? new Set();
        for (const rightNode of right)
            candidates.add(rightNode.node_id);
        leftCandidates.set(leftNode.node_id, candidates);
    }
    for (const rightNode of right) {
        const candidates = rightCandidates.get(rightNode.node_id) ?? new Set();
        for (const leftNode of left)
            candidates.add(leftNode.node_id);
        rightCandidates.set(rightNode.node_id, candidates);
    }
};
const sortedCandidates = (candidates) => new Map([...candidates.entries()].map(([nodeId, values]) => [
    nodeId,
    [...values].sort(compareUnicodeCodePoints),
]));
const nodeIdentityKey = (node) => `node\0${node.kind}\0${node.node_id}`;
const contentDigestKey = (node) => node.identity.strategy === "content-digest"
    ? `content\0${node.kind}\0${node.identity.sha256}`
    : null;
const moduleSourceDigestKey = (node) => {
    if (node.kind !== "javascript-module")
        return null;
    // An export binding is identified within its whole application root, so its
    // id changes with any sibling file. Its own file's bytes and exported name
    // identify it across versions, as `source_sha256` does a source module.
    if (node.identity.strategy === "artifact-local-key" &&
        node.identity.namespace === "module-export") {
        const name = uniqueStringProperty(node, "exported_name");
        return name === null
            ? null
            : `module-export\0${node.identity.artifact_sha256}\0${name}`;
    }
    const value = uniqueStringProperty(node, "source_sha256");
    return value === null ? null : `module-source\0${node.kind}\0${value}`;
};
const sourceMapKey = (node) => node.kind === "source-module" &&
    node.identity.strategy === "source-map-original"
    ? `source-map\0${canonicalJson([node.identity.source_root, node.identity.original_source])}`
    : null;
const structuralFingerprintKey = (node) => {
    if (node.kind !== "javascript-module")
        return null;
    const digest = uniqueStringProperty(node, "structural_fingerprint_sha256");
    const algorithm = uniqueStringProperty(node, "structural_fingerprint_algorithm");
    return digest === null || algorithm === null
        ? null
        : `structural\0${node.kind}\0${algorithm}\0${digest}`;
};
const semanticKey = (node) => {
    if ([
        "javascript-module",
        "javascript-chunk",
        "runtime-script-instance",
        "unknown",
    ].includes(node.kind))
        return null;
    const properties = firstProperties(node);
    const value = semanticValue(node, properties);
    return value === null ? null : `semantic\0${node.kind}\0${value}`;
};
const semanticValue = (node, properties) => {
    if (node.kind === "endpoint")
        return applicationEndpointCorrespondence(node).semanticKey;
    if (node.kind === "storage")
        return joined(properties.storage_kind, properties.name ?? properties.mechanism);
    if (node.kind === "ipc-channel")
        return properties.resolution === "dynamic"
            ? null
            : (exactString(properties.channel) ?? firstLabel(node));
    if (node.kind === "context-bridge-api")
        return (firstLabel(node) ??
            exactString(properties.api_key) ??
            nonEmptyString(properties.api_name));
    if (node.kind === "native-export")
        return (joined(properties.specifier, compositeKey([
            stringList(properties.requested_members),
            typeof properties.namespace_access === "boolean"
                ? properties.namespace_access
                : null,
            typeof properties.dynamic_member_access === "boolean"
                ? properties.dynamic_member_access
                : null,
        ])) ?? firstLabel(node));
    if ([
        "electron-main",
        "electron-preload",
        "electron-renderer",
        "electron-utility",
    ].includes(node.kind))
        return joined(properties.declared_path, properties.resolved_path);
    if (node.kind === "package")
        return nonEmptyString(properties.name);
    return canonicalPath(node) ?? nonEmptyString(properties.path);
};
const canonicalPath = (node) => node.identity.strategy === "canonical-path" ? node.identity.path : null;
const firstProperties = (node) => node.observations[0]?.properties ?? {};
const firstLabel = (node) => node.observations.find(({ label }) => label !== null)?.label ?? null;
const uniqueStringProperty = (node, name) => {
    const values = [
        ...new Set(node.observations
            .map(({ properties }) => properties[name])
            .filter((value) => typeof value === "string")),
    ];
    return values.length === 1 ? (values[0] ?? null) : null;
};
const joined = (...values) => {
    const strings = values.map(nonEmptyString);
    return strings.some((value) => value === null) ? null : compositeKey(strings);
};
const nonEmptyString = (value) => typeof value === "string" && value !== "" ? value : null;
/** A literal value such as `ipcMain.handle("")` keeps its exact empty text. */
const exactString = (value) => typeof value === "string" ? value : null;
const stringList = (value) => Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .sort(compareUnicodeCodePoints)
    : [];
const sortedNodes = (nodes) => [...nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
