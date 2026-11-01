import { z } from "zod";
import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import { applicationGraphEvidenceInputError, parseApplicationGraphEvidence, } from "./JavaScriptApplicationEvidenceGraph.js";
import { queryJavaScriptSemanticGraph } from "../../domain/javascript/javascriptSemanticQuery.js";
import { traceJavaScriptSemanticsInputSchema, } from "../../domain/javascript/javascriptSemanticTraceSchemas.js";
import { err, ok } from "../../domain/result.js";
import { createJavaScriptSemanticTraceEvidence } from "./JavaScriptApplicationWorkflowEvidence.js";
const OPERATION = "trace_javascript_semantics";
/** Trace semantic relations from input already parsed by a trusted adapter. */
export const traceJavaScriptSemanticsEvidenceValidated = (input) => {
    const sourceResult = parseApplicationGraphEvidence(input.application, [
        "application",
    ]);
    if (!sourceResult.ok)
        return err(applicationGraphEvidenceInputError(OPERATION, sourceResult.error));
    const source = sourceResult.value;
    if (source.semanticGraph === null)
        return err(new AnalysisInputError(OPERATION, undefined, [
            {
                path: ["application"],
                reason: "invalid_value",
                expected: "inline Evidence from analyze_javascript_application with a semantic graph",
            },
        ]));
    const query = queryJavaScriptSemanticGraph(source.semanticGraph, input.query);
    const result = {
        ...query,
        source_evidence_id: source.evidence.evidence_id,
        evidence_links: [source.evidence.evidence_id],
    };
    const { allowed_relations, ...queryParameters } = input.query;
    return ok(createJavaScriptSemanticTraceEvidence({
        application_evidence_id: source.evidence.evidence_id,
        query: allowed_relations === undefined
            ? queryParameters
            : { ...queryParameters, allowed_relations },
    }, result));
};
