import { posix } from "node:path";
import { compareUnicodeCodePoints, compositeKey, } from "../unicodeCodePointOrder.js";
import { SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS, } from "./sourceToBundleComparisonSchemas.js";
import { javaScriptFileOccurrenceSchema, } from "./javascriptArtifactFiles.js";
import { isDigest } from "../digests.js";
const RELEVANT_NODE_KINDS = new Set([
    // Non-JavaScript source files such as JSON are projected as artifacts.
    // Their content digests and paths still identify historical source files.
    "artifact",
    "javascript-asset",
    "javascript-module",
    "source-module",
]);
const PATH_PROPERTIES = [
    "path",
    "source",
    "original_source",
    "module_path",
    "resolved_path",
    "declared_path",
];
const signalWeight = (kind) => {
    const entry = SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS.find(([signal]) => signal === kind);
    if (entry === undefined)
        throw new TypeError(`Missing source-to-bundle signal weight: ${kind}`);
    return entry[1];
};
/** Keep source-bearing application nodes in stable identifier order. */
export const sourceBearingNodes = (nodes) => nodes
    .filter(({ kind }) => RELEVANT_NODE_KINDS.has(kind))
    .sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
/** Keep historical source files in stable path order. */
export const historicalSourceFiles = (graph) => graph.entries
    .filter((entry) => entry.kind === "file" && entry.classifications.includes("source"))
    .sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
/** Build deterministic candidate indices without assigning fuzzy matches. */
export const buildSourceToBundleCandidateIndex = (nodes) => {
    const projections = projectCurrentOccurrences(nodes);
    const byDigest = new Map();
    const byPathSuffix = new Map();
    const byBasename = new Map();
    for (const projection of projections) {
        for (const digest of projection.digests)
            addIndexValue(byDigest, digest, projectionKey(projection));
        for (const path of projection.paths) {
            for (const suffix of path.allowSuffix
                ? pathSuffixes(path.value)
                : [path.value]) {
                addIndexValue(byPathSuffix, suffix, projectionKey(projection));
                const canonical = suffix.normalize("NFC");
                if (canonical !== suffix)
                    addIndexValue(byPathSuffix, canonical, projectionKey(projection));
            }
            addIndexValue(byBasename, posix.basename(path.value), projectionKey(projection));
        }
    }
    return {
        nodes: new Map(projections.map((projection) => [projectionKey(projection), projection])),
        byDigest,
        byPathSuffix,
        byBasename,
    };
};
/** Candidate identifiers ordered by strongest available signal, then ID. */
export const candidateIdsForSource = (source, index) => {
    const canonicalPath = source.path.normalize("NFC");
    const groups = [
        source.sha256 === null ? undefined : index.byDigest.get(source.sha256),
        index.byPathSuffix.get(source.path),
        canonicalPath === source.path
            ? undefined
            : index.byPathSuffix.get(canonicalPath),
        index.byBasename.get(posix.basename(source.path)),
    ];
    const seen = new Set();
    const output = [];
    for (const group of groups) {
        if (group === undefined)
            continue;
        for (const nodeId of [...group].sort(compareUnicodeCodePoints)) {
            if (seen.has(nodeId))
                continue;
            seen.add(nodeId);
            output.push(nodeId);
        }
    }
    return output;
};
/** Whether an indexed candidate carries any content digest to compare. */
export const candidateHasDigest = (index, candidate) => (index.nodes.get(sourceToBundleCandidateIdentity(candidate))?.digests.size ??
    0) > 0;
/** Score one indexed candidate from explicit, caller-visible signals. */
export const scoreSourceToBundleCandidate = (source, nodeId, index) => {
    const projection = index.nodes.get(nodeId);
    if (projection === undefined)
        return null;
    const signals = candidateSignals(source, projection);
    const score = signals.reduce((total, signal) => total + signal.weight, 0);
    if (score < 20)
        return null;
    return {
        ...(projection.occurrence === undefined
            ? {}
            : {
                current_file_occurrence: projection.occurrence,
                representation_node_ids: [...projection.representations],
            }),
        current_node_id: projection.node.node_id,
        current_node_kind: projection.node.kind,
        score,
        confidence: candidateConfidence(signals),
        signals,
    };
};
const fileOccurrenceKey = (occurrence) => compositeKey([
    "file-occurrence",
    occurrence.container_sha256,
    occurrence.path,
    occurrence.sha256,
]);
const projectionKey = (projection) => projection.occurrence === undefined
    ? projection.node.node_id
    : fileOccurrenceKey(projection.occurrence);
/** Matching and multiplicity share the producing occurrence identity. */
export const sourceToBundleCandidateIdentity = (candidate) => candidate.current_file_occurrence === undefined
    ? candidate.current_node_id
    : fileOccurrenceKey(candidate.current_file_occurrence);
const projectCurrentOccurrences = (nodes) => {
    const groups = new Map();
    for (const node of nodes) {
        const occurrences = new Map();
        for (const observation of node.observations) {
            const parsed = javaScriptFileOccurrenceSchema.safeParse(observation.properties.file_occurrence);
            if (!parsed.success)
                continue;
            const key = fileOccurrenceKey(parsed.data);
            const previous = occurrences.get(key);
            if (previous === undefined)
                occurrences.set(key, {
                    occurrence: parsed.data,
                    observations: [observation],
                });
            else
                previous.observations.push(observation);
        }
        if (occurrences.size === 0) {
            groups.set(node.node_id, projectCurrentNode(node));
            continue;
        }
        for (const [key, { occurrence, observations }] of occurrences) {
            const projected = projectCurrentNode({ ...node, observations });
            const previous = groups.get(key);
            groups.set(key, {
                ...projected,
                occurrence,
                node: previous?.node ?? node,
                representations: [
                    ...new Set([...(previous?.representations ?? []), node.node_id]),
                ].sort(compareUnicodeCodePoints),
                digests: new Set([
                    occurrence.sha256,
                    ...projected.digests,
                    ...(previous?.digests ?? []),
                ]),
                paths: uniquePaths([...projected.paths, ...(previous?.paths ?? [])]),
            });
        }
    }
    return [...groups.values()];
};
const projectCurrentNode = (node) => {
    const digests = new Set();
    const paths = [];
    if (node.identity.strategy === "content-digest")
        digests.add(node.identity.sha256);
    if (node.identity.strategy === "source-map-original") {
        if (node.identity.source_sha256 !== null)
            digests.add(node.identity.source_sha256);
    }
    if (node.identity.strategy === "canonical-path")
        addPath(paths, "canonical-path", node.identity.path, "artifact");
    for (const observation of node.observations) {
        if (node.identity.strategy === "source-map-original") {
            const resolution = observation.source_map_reference?.resolution;
            if (resolution !== undefined && resolution.kind !== "unresolved")
                paths.push({
                    kind: "source-map-original",
                    value: resolution.path,
                    allowSuffix: resolution.kind === "suffix",
                });
        }
        else {
            const sourceDigest = observation.properties.source_sha256;
            if (typeof sourceDigest === "string" && isDigest(sourceDigest))
                digests.add(sourceDigest);
            for (const key of PATH_PROPERTIES) {
                // A resolved declaration already has an owning artifact-path fact.
                if (key === "declared_path" &&
                    typeof observation.properties.resolved_path === "string")
                    continue;
                addJsonPath(paths, observation.properties[key], key === "resolved_path" ||
                    ((key === "path" || key === "module_path") &&
                        !(typeof observation.properties[key] === "string" &&
                            SCHEME_URL.test(observation.properties[key])))
                    ? "artifact"
                    : "reference");
            }
        }
    }
    return {
        node,
        representations: [node.node_id],
        digests,
        paths: uniquePaths(paths),
    };
};
const candidateSignals = (source, current) => {
    const signals = [];
    if (source.sha256 !== null && current.digests.has(source.sha256))
        signals.push(signal("exact-source-digest", source.sha256, [source.sha256]));
    const sourceMapPaths = matchingPaths(source.path, current.paths.filter(({ kind }) => kind === "source-map-original"));
    if (sourceMapPaths.length > 0)
        signals.push(signal("source-map-original-path", source.path, sourceMapPaths));
    const unicodeEquivalentPaths = matchingUnicodePaths(source.path, current.paths);
    if (unicodeEquivalentPaths.length > 0)
        signals.push(signal("unicode-equivalent-path", source.path, unicodeEquivalentPaths));
    const otherPaths = current.paths.filter(({ kind }) => kind !== "source-map-original");
    const exactPaths = otherPaths
        .filter(({ value }) => value === source.path)
        .map(({ value }) => value);
    if (exactPaths.length > 0)
        signals.push(signal("current-path-exact", source.path, exactPaths));
    const suffixPaths = otherPaths
        .filter(({ value, allowSuffix }) => allowSuffix &&
        value !== source.path &&
        value.endsWith(`/${source.path}`))
        .map(({ value }) => value);
    if (suffixPaths.length > 0)
        signals.push(signal("current-path-suffix", source.path, suffixPaths));
    const basename = posix.basename(source.path);
    const basenamePaths = current.paths
        .filter(({ value }) => posix.basename(value) === basename)
        .map(({ value }) => value);
    if (basenamePaths.length > 0)
        signals.push(signal("basename-match", basename, basenamePaths));
    const extension = posix.extname(source.path).toLowerCase();
    const extensionPaths = current.paths
        .filter(({ value }) => posix.extname(value).toLowerCase() === extension)
        .map(({ value }) => value);
    if (extension !== "" && extensionPaths.length > 0)
        signals.push(signal("language-extension", extension, extensionPaths));
    return signals;
};
const signal = (kind, sourceValue, currentValues) => ({
    kind,
    weight: signalWeight(kind),
    source_value: sourceValue,
    current_values: [...new Set(currentValues)].sort(compareUnicodeCodePoints),
});
const candidateConfidence = (signals) => {
    const kinds = new Set(signals.map(({ kind }) => kind));
    if (kinds.has("exact-source-digest"))
        return "exact";
    if (kinds.has("source-map-original-path") || kinds.has("current-path-exact"))
        return "high";
    return kinds.has("current-path-suffix") ? "medium" : "low";
};
const matchingPaths = (sourcePath, currentPaths) => currentPaths
    .filter(({ value, allowSuffix }) => value === sourcePath ||
    (allowSuffix && value.endsWith(`/${sourcePath}`)))
    .map(({ value }) => value);
const matchingUnicodePaths = (sourcePath, currentPaths) => {
    const canonicalSource = sourcePath.normalize("NFC");
    return currentPaths
        .filter(({ value, allowSuffix }) => {
        if (value === sourcePath ||
            (allowSuffix && value.endsWith(`/${sourcePath}`)))
            return false;
        const canonicalValue = value.normalize("NFC");
        return (canonicalValue === canonicalSource ||
            (allowSuffix && canonicalValue.endsWith(`/${canonicalSource}`)));
    })
        .map(({ value }) => value);
};
const addJsonPath = (paths, value, format) => {
    if (typeof value === "string")
        addPath(paths, "observation-path", value, format);
};
const addPath = (paths, kind, raw, format) => {
    const value = normalizeCurrentPath(raw, format);
    if (value !== null)
        paths.push({ kind, value, allowSuffix: true });
};
const SCHEME_URL = /^[a-z][a-z0-9+.-]*:\/\//iu;
const SCHEME_URL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\/+/iu;
const normalizeCurrentPath = (raw, format) => {
    const withoutQuery = format === "reference" && SCHEME_URL.test(raw)
        ? (raw.split(/[?#]/u, 1)[0] ?? "")
        : raw;
    const portable = format === "artifact"
        ? withoutQuery
        : withoutQuery.replace(SCHEME_URL_PREFIX, "").replaceAll("\\", "/");
    const parts = [];
    for (const part of portable.split("/")) {
        if (part === "" || part === ".")
            continue;
        if (part === "..") {
            if (parts.length === 0)
                return null;
            parts.pop();
        }
        else
            parts.push(part);
    }
    if (parts.length === 0)
        return null;
    return parts.join("/");
};
const uniquePaths = (paths) => [
    ...new Map(paths.map((path) => [
        compositeKey([path.kind, path.value, String(path.allowSuffix)]),
        path,
    ])).values(),
].sort((left, right) => compareUnicodeCodePoints(compositeKey([left.kind, left.value]), compositeKey([right.kind, right.value])));
const pathSuffixes = (path) => {
    const parts = path.split("/");
    return parts.map((_, index) => parts.slice(index).join("/"));
};
const addIndexValue = (index, key, nodeId) => {
    const values = index.get(key) ?? new Set();
    values.add(nodeId);
    index.set(key, values);
};
