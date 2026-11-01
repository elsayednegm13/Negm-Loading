import { SEMANTIC_EXPRESSION_DEPTH_LIMIT, SEMANTIC_GETTER_EXPANSION_LIMIT, SEMANTIC_ALIAS_SELECTION_LIMIT, SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT, SEMANTIC_PRIMITIVE_JSON_BYTES_LIMIT, } from "./javascriptSemanticResourceLimits.js";
/** Source-local effect candidates broadened at a projection merge, without dropping targets. */
export const RETURNED_REFERENCE_WIDENING_LIMITATION = "Local returned-reference projections were conservatively widened; effects include additional source-local candidates.";
/** Classify whole-file semantic coverage from parsing, value bounds and widened projections. */
export const semanticCoverage = (parserPartial, resourceLimits = [], widenedReturnedReferences = []) => {
    const widened = widenedReturnedReferences.length > 0 ? { widenedReturnedReferences } : {};
    if (resourceLimits.length > 0)
        return {
            status: "partial",
            omittedCount: null,
            resourceLimits,
            ...widened,
        };
    return {
        status: parserPartial || widenedReturnedReferences.length > 0
            ? "partial"
            : "complete",
        omittedCount: 0,
        ...widened,
    };
};
/** Read typed resource-limit classifications from any coverage state. */
export const semanticCoverageResourceLimits = (coverage) => coverage.resourceLimits ?? [];
const semanticResourceBounds = {
    "primitive-candidates": {
        value: SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT,
        unit: "items",
    },
    "primitive-bytes": {
        value: SEMANTIC_PRIMITIVE_JSON_BYTES_LIMIT,
        unit: "bytes",
    },
    "expression-depth": {
        value: SEMANTIC_EXPRESSION_DEPTH_LIMIT,
        unit: "depth",
    },
    "getter-expansion": {
        value: SEMANTIC_GETTER_EXPANSION_LIMIT,
        unit: "items",
    },
    "alias-selections": {
        value: SEMANTIC_ALIAS_SELECTION_LIMIT,
        unit: "items",
    },
};
/** Map semantic evaluator bounds to their caller-visible application coverage. */
export const semanticResourceLimitCoverage = (resourceLimits) => resourceLimits.map((resourceLimit) => ({
    name: `javascript_semantic_${resourceLimit.replaceAll("-", "_")}`,
    ...semanticResourceBounds[resourceLimit],
}));
/** Classify one callable's direct-return coverage. */
export const semanticReturnCoverage = (retainedCount, parserPartial) => ({
    status: parserPartial ? "partial" : "complete",
    retainedCount,
    omittedCount: 0,
});
