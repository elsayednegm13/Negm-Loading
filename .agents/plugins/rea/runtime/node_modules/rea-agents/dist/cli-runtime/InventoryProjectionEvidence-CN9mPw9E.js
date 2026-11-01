import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { createEvidence, init_evidence } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_mobileApplicationGraphProjection, readApplicationInventoryProjection } from "./bridgeCandidateProjection-CnT1LS_C.js";

//#region dist/application/InventoryProjectionEvidence.js
var projectInventoryEvidence;
function init_InventoryProjectionEvidence() {
	return (init_InventoryProjectionEvidence = __esmMin((() => {
		init_evidence();
		init_mobileApplicationGraphProjection();
		init_result();
		projectInventoryEvidence = (options) => {
			const source = readApplicationInventoryProjection(options.rawInput, options.operation);
			if (!source.ok) return source;
			const projected = options.project(source.value);
			if (!projected.ok) return projected;
			const result = projected.value;
			const first = source.value.evidence[0];
			return ok({
				evidence: createEvidence(first?.subject === null || first?.subject === undefined ? undefined : {
					path: first.subject.local_path,
					sha256: result.root_sha256,
					format: options.subjectFormat(first)
				}, options.provider, {
					predicateType: options.predicateType,
					operation: options.operation,
					parameters: { inventory_evidence_ids: [...result.source_evidence_ids] },
					result,
					rawResult: null,
					confidence: "inferred",
					authority: "analyst-inference",
					environment: null,
					limitations: result.limitations,
					evidenceLinks: result.source_evidence_ids
				}),
				sources: source.value.evidence
			});
		};
	})))();
}

//#endregion
export { init_InventoryProjectionEvidence, projectInventoryEvidence };