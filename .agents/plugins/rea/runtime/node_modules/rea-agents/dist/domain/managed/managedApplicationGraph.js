import { z } from "zod";
import { createJavaScriptApplicationGraph, javascriptApplicationGraphSchema, } from "../javascript/javascriptApplicationGraph.js";
import { managedArtifactInspectionSchema, managedMemberInspectionSchema, managedNativeBoundaryInspectionSchema, } from "./managedArtifact.js";
import { digestCanonicalValue } from "../canonicalDigest.js";
import { assessManagedGraphOmissions, managedGraphEvidenceCoverage, managedGraphResultCoverage, } from "./managedApplicationGraphCoverage.js";
import { addArtifactNode, addArtifactIdentityNodes, addBoundaryNodes, addMemberNodes, } from "./managedApplicationGraphNodes.js";
import { addMemberRelations, relationOmissionLimitations, } from "./managedApplicationGraphRelations.js";
import { digestSchema, prefixedDigestSchema } from "../digests.js";
import { readManagedInspectionEvidence } from "./managedInspectionEvidence.js";
import { AnalysisInputError } from "../analysisErrorCore.js";
import { analysisInputErrorFromIssues } from "../inputIssueProjection.js";
import { err, ok } from "../result.js";
const evidenceIdSchema = prefixedDigestSchema("ev");
const textSchema = z.string().min(1);
/** Authenticated managed Evidence records projected into the application graph. */
const managedGraphRequestSchema = z
    .strictObject({
    managed_artifact: z.unknown().optional(),
    managed_members: z.unknown().optional(),
    managed_native_boundaries: z.unknown().optional(),
})
    .superRefine((input, context) => {
    if (input.managed_artifact === undefined &&
        input.managed_members === undefined &&
        input.managed_native_boundaries === undefined)
        context.addIssue({
            code: "custom",
            message: "At least one managed artifact, member, or native-boundary Evidence record is required",
        });
});
/** Managed-code projection result containing a validated application graph. */
export const managedApplicationGraphResultSchema = z.strictObject({
    projection_id: prefixedDigestSchema("magp"),
    root_artifact_sha256: digestSchema,
    source_evidence: z.strictObject({
        managed_artifact_evidence_id: evidenceIdSchema.nullable(),
        managed_members_evidence_id: evidenceIdSchema.nullable(),
        managed_native_boundaries_evidence_id: evidenceIdSchema.nullable(),
    }),
    summary: z.strictObject({
        graph_nodes: z.int().min(0),
        graph_edges: z.int().min(0),
        assemblies: z.int().min(0),
        modules: z.int().min(0),
        types: z.int().min(0),
        methods: z.int().min(0),
        fields: z.int().min(0),
        pinvoke_imports: z.int().min(0),
        native_implementations: z.int().min(0),
        // Graphs projected before call and field-access edges existed omit these
        // counters; null means those relations were not projected, not zero.
        calls: z
            .int()
            .min(0)
            .nullable()
            .default(null)
            .describe("calls edges; null for graphs projected before calls edges"),
        field_accesses: z
            .int()
            .min(0)
            .nullable()
            .default(null)
            .describe("accesses edges; null for graphs projected before accesses edges"),
    }),
    graph: javascriptApplicationGraphSchema,
    coverage: z.strictObject({
        status: z.enum(["complete-within-inputs", "partial"]),
    }),
    evidence_links: z.array(evidenceIdSchema).min(1).max(3),
    limitations: z.array(textSchema),
});
/** Build from authenticated sources whose shared identity has been established. */
export const projectManagedGraph = (request) => {
    const { sources: parsed, artifact: artifactIdentity } = request;
    const evidenceLinks = [
        parsed.artifact?.evidence.evidence_id,
        parsed.members?.evidence.evidence_id,
        parsed.boundaries?.evidence.evidence_id,
    ].filter((id) => id !== undefined);
    const state = {
        nodes: [],
        edges: [],
        artifactSha256: artifactIdentity.sha256,
        artifactPath: artifactIdentity.path,
        evidenceLinks,
        typeNodes: new Map(),
        methodNodes: new Map(),
        fieldNodes: new Map(),
    };
    const artifactNode = addArtifactNode(state);
    addArtifactIdentityNodes(state, artifactNode, parsed);
    addMemberNodes(state, artifactNode, parsed);
    addBoundaryNodes(state, artifactNode, parsed);
    const relations = addMemberRelations(state, parsed);
    const omissions = assessManagedGraphOmissions({
        artifact: parsed.artifact?.result ?? null,
        members: parsed.members?.result ?? null,
        boundaries: parsed.boundaries?.result ?? null,
    }, relations);
    const limitations = projectionLimitations(parsed, omissions);
    const graph = createJavaScriptApplicationGraph({
        schema: "JavaScriptApplicationGraph",
        root_node_ids: [artifactNode.node_id],
        nodes: state.nodes,
        edges: state.edges,
        coverage: managedGraphEvidenceCoverage(omissions),
        limitations,
    });
    const withoutId = {
        root_artifact_sha256: state.artifactSha256,
        source_evidence: {
            managed_artifact_evidence_id: parsed.artifact?.evidence.evidence_id ?? null,
            managed_members_evidence_id: parsed.members?.evidence.evidence_id ?? null,
            managed_native_boundaries_evidence_id: parsed.boundaries?.evidence.evidence_id ?? null,
        },
        summary: {
            graph_nodes: graph.nodes.length,
            graph_edges: graph.edges.length,
            assemblies: countNodes(graph.nodes, "managed-assembly"),
            modules: countNodes(graph.nodes, "managed-module"),
            types: countNodes(graph.nodes, "managed-type"),
            methods: countNodes(graph.nodes, "managed-method"),
            fields: countNodes(graph.nodes, "managed-field"),
            pinvoke_imports: countNodes(graph.nodes, "managed-pinvoke-import"),
            native_implementations: countNodes(graph.nodes, "managed-native-implementation"),
            calls: countEdges(graph.edges, "calls"),
            field_accesses: countEdges(graph.edges, "accesses"),
        },
        graph,
        coverage: managedGraphResultCoverage(omissions),
        evidence_links: evidenceLinks,
        limitations,
    };
    return managedApplicationGraphResultSchema.parse({
        ...withoutId,
        projection_id: `magp_${digestCanonicalValue(withoutId, "Managed application graph")}`,
    });
};
const countNodes = (nodes, kind) => nodes.filter((node) => node.kind === kind).length;
const countEdges = (edges, relation) => edges.filter((edge) => edge.relation === relation).length;
/** Authenticate each source once, then establish the shared projection identity. */
export const readManagedGraphProjection = (input) => {
    const frame = managedGraphRequestSchema.safeParse(input);
    if (!frame.success)
        return err(analysisInputErrorFromIssues(OPERATION, frame.error.issues, input, {
            cause: frame.error,
        }));
    const { managed_artifact, managed_members, managed_native_boundaries } = frame.data;
    const artifact = managed_artifact === undefined
        ? ok(null)
        : readManagedInspectionEvidence(managed_artifact, "inspect_managed_artifact", managedArtifactInspectionSchema, { operation: OPERATION, path: ["managed_artifact"] });
    if (!artifact.ok)
        return artifact;
    const members = managed_members === undefined
        ? ok(null)
        : readManagedInspectionEvidence(managed_members, "inspect_managed_members", managedMemberInspectionSchema, { operation: OPERATION, path: ["managed_members"] });
    if (!members.ok)
        return members;
    const boundaries = managed_native_boundaries === undefined
        ? ok(null)
        : readManagedInspectionEvidence(managed_native_boundaries, "inspect_managed_native_boundaries", managedNativeBoundaryInspectionSchema, { operation: OPERATION, path: ["managed_native_boundaries"] });
    if (!boundaries.ok)
        return boundaries;
    const sources = {
        artifact: artifact.value,
        members: members.value,
        boundaries: boundaries.value,
    };
    const identity = chooseArtifact(sources);
    const mismatch = artifactMismatch(sources, identity.sha256) ??
        moduleIdentityMismatch(sources);
    if (mismatch !== null)
        return err(new AnalysisInputError(OPERATION, { userMessage: mismatch }, [
            { path: [], reason: "invalid_value", message: mismatch },
        ]));
    return ok({ sources, artifact: identity });
};
const OPERATION = "project_managed_application_graph";
const chooseArtifact = (parsed) => {
    const result = parsed.artifact?.result ??
        parsed.members?.result ??
        parsed.boundaries?.result;
    if (result === undefined)
        throw new Error("Validated managed graph projection has no source");
    return { sha256: result.artifact.sha256, path: result.artifact.path };
};
const artifactMismatch = (parsed, sha256Value) => {
    for (const result of [
        parsed.artifact?.result,
        parsed.members?.result,
        parsed.boundaries?.result,
    ])
        if (result !== undefined && result.artifact.sha256 !== sha256Value)
            return "Managed graph projection inputs must describe the same artifact SHA-256";
    return null;
};
/** Reject contradictory known module identities while leaving null fields unknown. */
const moduleIdentityMismatch = (parsed) => {
    const mvidClaims = [
        parsed.artifact?.result.module?.mvid,
        parsed.members?.result.module?.mvid,
        parsed.members?.result.identity_scope.requires_mvid,
        parsed.boundaries?.result.module?.mvid,
        parsed.boundaries?.result.identity_scope.requires_mvid,
    ]
        .filter((mvid) => mvid !== undefined && mvid !== null)
        .map((mvid) => mvid.toLowerCase());
    if (new Set(mvidClaims).size > 1)
        return "Managed graph inputs report conflicting known module MVIDs or token scopes";
    const modules = [
        parsed.artifact?.result.module,
        parsed.members?.result.module,
        parsed.boundaries?.result.module,
    ].filter((module) => module !== undefined && module !== null);
    for (const field of ["name", "generation", "token", "row_offset"]) {
        const values = new Set(modules.map((module) => module[field]));
        if (values.size > 1)
            return `Managed graph inputs report conflicting module ${field} values`;
    }
    for (const field of ["enc_id", "enc_base_id"]) {
        const values = new Set(modules
            .map((module) => module[field]?.toLowerCase())
            .filter((value) => value !== undefined));
        if (values.size > 1)
            return `Managed graph inputs report conflicting module ${field} values`;
    }
    return null;
};
const projectionLimitations = (parsed, omissions) => [
    "Managed graph projection preserves static metadata observations only; it does not execute managed code, load assemblies, or map managed tokens to native addresses.",
    ...(parsed.members === null
        ? [
            "Managed member Evidence was not supplied; type, method, and field nodes are absent.",
        ]
        : []),
    ...(parsed.artifact === null
        ? [
            "Managed artifact Evidence was not supplied; assembly identity observations are absent.",
        ]
        : []),
    ...(parsed.boundaries === null
        ? [
            "Managed native-boundary Evidence was not supplied; P/Invoke and native-implementation nodes are absent.",
        ]
        : []),
    ...(omissions.partialInput
        ? ["At least one supplied managed Evidence record has partial coverage."]
        : []),
    ...(omissions.selectedTypes === null
        ? []
        : [
            `Managed member Evidence selected only these declaring types: ${omissions.selectedTypes.join(", ")}; type, method, and field nodes of other types are omitted, not absent.`,
        ]),
    ...(omissions.unscopedTokenRelationships
        ? [
            "Managed boundary tokens were not linked to member nodes because matching module MVID scope was not established.",
        ]
        : []),
    ...relationOmissionLimitations(omissions.relations),
];
