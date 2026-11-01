import { sha256Text } from "../../domain/javascript/javascriptStaticAnalysisHelpers.js";
import { sourceNodeFor, } from "./JavaScriptArtifactGraphContext.js";
import { astObservationEvidence, staticInferenceEvidence, } from "./JavaScriptArtifactGraphEvidence.js";
/** Resolve the file or recovered bundle module that owns one finding. */
export const electronFindingSourceNode = (context, file, moduleKey, runtime) => moduleKey === null
    ? (context.assetNodes.get(file.path) ?? context.fileNodes.get(file.path))
    : sourceNodeFor(context, file.path, moduleKey, runtime);
/** Observation-scoped identity shared safely across different artifact files. */
export const electronObservationIdentity = (context, scope, key) => ({
    strategy: "observation-fingerprint",
    stability: "observation-only",
    observation_sha256: sha256Text(`${context.snapshot.manifest.root_sha256}\0${scope}\0${key}`),
    scope,
});
/** Add a direct AST syntax relationship. */
export const addElectronAstEdge = (context, input) => {
    context.accumulator.addEdge({
        source_node_id: input.source.node_id,
        target_node_id: input.target.node_id,
        relation: input.relation,
        properties: input.properties,
        evidence: astObservationEvidence({
            sha256: input.file.sha256,
            path: input.file.path,
            range: input.range,
            operation: input.operation,
            coverage: input.coverage,
            ...(input.limitations === undefined
                ? {}
                : { limitations: input.limitations }),
        }),
    });
};
/** Add an Electron relationship that static syntax suggests but cannot prove. */
export const addElectronInferenceEdge = (context, input) => {
    context.accumulator.addEdge({
        source_node_id: input.source.node_id,
        target_node_id: input.target.node_id,
        relation: input.relation,
        properties: input.properties,
        evidence: staticInferenceEvidence({
            sha256: input.file.sha256,
            path: input.file.path,
            range: input.range,
            operation: input.operation,
            coverage: input.coverage,
            ...(input.confidence === undefined
                ? {}
                : { confidence: input.confidence }),
            ...(input.limitations === undefined
                ? {}
                : { limitations: input.limitations }),
        }),
    });
};
