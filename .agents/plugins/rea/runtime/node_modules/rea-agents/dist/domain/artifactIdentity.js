import { artifactIntegrityPairOf, } from "./artifactIntegrity.js";
import { posix } from "node:path";
import { digestCanonicalValue } from "./canonicalDigest.js";
/** NFC spelling of a logical archive path. Inventory and path joins share it. */
export const logicalPathNfc = (value) => value.normalize("NFC");
/**
 * Lexical join against an inventoried logical path. The result is NFC.
 * `"."` is the archive root. A path that escapes the root, or that contains
 * NUL, is left in a form the caller can report; `logicalPathEscapesRoot`
 * is then true.
 */
export const normalizeJoinedLogicalPath = (value) => {
    if (value.includes("\0"))
        return value;
    return logicalPathNfc(posix.normalize(value).replace(/^\.\//u, ""));
};
/** Whether a joined logical path leaves the archive root. */
export const logicalPathEscapesRoot = (path) => path.includes("\0") ||
    path === ".." ||
    path.startsWith("../") ||
    path.startsWith("/");
/** Content-address an artifact independently of where it was observed. */
export const artifactIdForContent = (sha256) => `art_${digestCanonicalValue({ sha256 }, "Artifact")}`;
/** Identify an occurrence by its root and exact logical location. */
export const occurrenceIdForLocation = (input) => input.logicalPath === "."
    ? `occ_${digestCanonicalValue({ root: input.rootArtifactId }, "Artifact")}`
    : `occ_${digestCanonicalValue({
        root_artifact_id: input.rootArtifactId,
        logical_path: input.logicalPath,
        entry_kind: input.entryKind,
        ...(input.duplicateOrdinal === undefined
            ? {}
            : { duplicate_ordinal: input.duplicateOrdinal }),
    }, "Artifact")}`;
/** Commit to graph members in the ordering established by the inventory owner. */
export const artifactGraphDigest = (input) => digestCanonicalValue({
    nodes: input.nodes,
    occurrences: input.occurrences,
    edges: input.edges,
    integrity_contradictions: input.contradictions,
}, "Artifact");
/** Bind a root artifact to its graph commitment. */
export const artifactManifestId = (rootArtifactId, graphSha256) => `agm_${digestCanonicalValue({ root_artifact_id: rootArtifactId, graph_sha256: graphSha256 }, "Artifact")}`;
/** Identify one integrity disagreement at its observed logical path. */
export const artifactContradictionId = (input) => `ic_${digestCanonicalValue({
    root_artifact_id: input.rootArtifactId,
    logical_path: input.logicalPath,
    ...artifactIntegrityPairOf(input.integrity),
}, "Artifact")}`;
/**
 * Identify an edge by its semantic relationship and exact occurrence. The
 * child artifact and logical path come from that occurrence.
 */
export const artifactEdgeId = (edge, occurrence) => `edge_${digestCanonicalValue({
    parent_artifact_id: edge.parent_artifact_id,
    child_artifact_id: occurrence.artifact_id,
    relation: edge.relation,
    occurrence_id: edge.occurrence_id,
    logical_path: occurrence.logical_path,
}, "Artifact")}`;
