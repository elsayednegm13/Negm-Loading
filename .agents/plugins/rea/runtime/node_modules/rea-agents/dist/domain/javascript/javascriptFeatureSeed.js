import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { featureSeedMatchMode, } from "./javascriptFeatureTraceSchemas.js";
/** Locate every graph node matching a typed literal seed without regex execution. */
export const findApplicationFeatureSeeds = (nodes, seed) => nodes
    .flatMap((node) => seedMatch(node, seed))
    .sort((left, right) => compareUnicodeCodePoints(`${left.node_id}\0${left.basis}\0${left.field}`, `${right.node_id}\0${right.basis}\0${right.field}`));
const seedMatch = (node, seed) => {
    const mode = featureSeedMatchMode(seed);
    const caseSensitive = seed.case_sensitive;
    const query = normalized(seed.value, caseSensitive);
    if (!kindMatches(node, seed.kind))
        return [];
    const requestedEntryPath = seed.kind === "api" && "entry_path" in seed ? seed.entry_path : undefined;
    if (seed.kind === "api" &&
        requestedEntryPath !== undefined &&
        !node.observations.some(({ properties }) => {
            const entryPath = properties.entry_path;
            return (Array.isArray(entryPath) &&
                entryPath.length === requestedEntryPath.length &&
                entryPath.every((segment, index) => segment === requestedEntryPath[index]));
        }))
        return [];
    const match = candidateFields(node, seed.kind).find((candidate) => {
        const value = normalized(candidate.value, caseSensitive);
        return mode === "exact" ? value === query : value.includes(query);
    });
    return match === undefined
        ? []
        : [
            {
                node_id: node.node_id,
                kind: node.kind,
                basis: match.basis,
                field: match.field,
            },
        ];
};
const kindMatches = (node, kind) => {
    if (kind === "string" || kind === "node-id")
        return true;
    if (kind === "route")
        return (node.kind === "endpoint" &&
            node.observations.some(({ properties }) => properties.endpoint_kind === "route"));
    if (kind === "api")
        return (node.kind === "context-bridge-api" ||
            (node.kind === "javascript-expression" &&
                node.observations.some((o) => o.properties.step_kind === "exposure")));
    if (kind === "channel")
        return node.kind === "ipc-channel";
    if (kind === "module")
        return ["javascript-asset", "javascript-module", "source-module"].includes(node.kind);
    return node.kind === "native-export";
};
const candidateFields = (node, seedKind) => {
    if (seedKind === "node-id")
        return [{ basis: "node-id", field: "node_id", value: node.node_id }];
    if (seedKind === "route")
        return node.observations.flatMap((observation, index) => ["value", "path"].flatMap((key) => {
            const value = observation.properties[key];
            return typeof value === "string"
                ? [
                    {
                        basis: "property",
                        field: `observations[${String(index)}].properties.${key}`,
                        value,
                    },
                ]
                : [];
        }));
    const fields = [
        ...identityFields(node),
        ...node.observations.flatMap((observation, index) => [
            ...(observation.label === null
                ? []
                : [
                    {
                        basis: "label",
                        field: `observations[${String(index)}].label`,
                        value: observation.label,
                    },
                ]),
            ...(observation.source_map_reference !== null &&
                observation.source_map_reference.resolution.kind !== "unresolved"
                ? [
                    {
                        basis: "property",
                        field: `observations[${String(index)}].source_map_reference.resolution.path`,
                        value: observation.source_map_reference.resolution.path,
                    },
                ]
                : []),
            ...propertyFields(observation.properties, `observations[${String(index)}].properties`),
        ]),
    ];
    if (seedKind === "string")
        return fields;
    const names = relevantFields[seedKind];
    return fields.filter(({ field, selectionPath = field }) => names.some((name) => {
        const path = memberFieldSuffixes.has(name) ? selectionPath : field;
        return path === "identity" || path.endsWith(name);
    }));
};
const memberFieldSuffixes = new Set([
    ".members",
    ".methods",
    ".exports",
    ".requested_members",
]);
const relevantFields = {
    route: [".label", ".value", ".path"],
    api: [".label", ".api_name", ".api_key", ".key", ".methods", ".members"],
    channel: [".label", ".channel", ".key"],
    module: [
        ".label",
        ".module_key",
        ".path",
        ".source",
        ".original_source",
        ".source_root",
        ".exports",
    ],
    "native-export": [".label", ".key", ".requested_members", ".members"],
};
const identityFields = (node) => {
    const identity = node.identity;
    if (identity.strategy === "content-digest")
        return [{ basis: "identity", field: "identity", value: identity.sha256 }];
    if (identity.strategy === "source-map-original")
        return [
            {
                basis: "identity",
                field: "identity.original_source",
                value: identity.original_source,
            },
            ...(identity.source_root === null
                ? []
                : [
                    {
                        basis: "identity",
                        field: "identity.source_root",
                        value: identity.source_root,
                    },
                ]),
        ];
    if (identity.strategy === "canonical-path")
        return [
            { basis: "identity", field: "identity.path", value: identity.path },
        ];
    if (identity.strategy === "artifact-local-key")
        return [{ basis: "identity", field: "identity.key", value: identity.key }];
    if (identity.strategy === "runtime-instance")
        return [
            {
                basis: "identity",
                field: "identity.runtime_key",
                value: identity.runtime_key,
            },
        ];
    return [];
};
const propertyFields = (value, prefix) => {
    const output = [];
    const pending = [{ current: value, path: prefix, selectionPath: prefix }];
    while (pending.length > 0) {
        const next = pending.pop();
        if (next === undefined)
            continue;
        const { current, path, selectionPath } = next;
        if (typeof current === "string") {
            output.push({
                basis: "property",
                field: path,
                selectionPath,
                value: current,
            });
            continue;
        }
        if (Array.isArray(current)) {
            for (let index = current.length - 1; index >= 0; index -= 1) {
                const item = current[index];
                if (item !== undefined)
                    pending.push({
                        current: item,
                        path: `${path}[${String(index)}]`,
                        selectionPath,
                    });
            }
            continue;
        }
        if (current !== null && typeof current === "object") {
            for (const key of Object.keys(current)
                .sort(compareUnicodeCodePoints)
                .reverse())
                pending.push({
                    current: current[key] ?? null,
                    path: `${path}.${key}`,
                    selectionPath: `${selectionPath}.${key}`,
                });
        }
    }
    return output;
};
const normalized = (value, caseSensitive) => {
    const normalizedValue = value.normalize(caseSensitive ? "NFC" : "NFKC");
    return caseSensitive
        ? normalizedValue
        : normalizedValue.toLocaleLowerCase("en-US");
};
