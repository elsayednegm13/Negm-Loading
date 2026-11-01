import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { EvidenceReferenceError, err, init_evidenceErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";

//#region dist/application/EvidenceInputResolver.js
var resolveEvidenceInput, resolveApplicationEvidenceRequest, resolvePairedEvidenceRequest;
function init_EvidenceInputResolver() {
	return (init_EvidenceInputResolver = __esmMin((() => {
		init_evidenceErrors();
		init_result();
		resolveEvidenceInput = (input, lookup) => {
			if (!("kind" in input)) return ok(input);
			const record = lookup?.(input.evidence_id);
			if (record === undefined) return err(new EvidenceReferenceError(input.evidence_id, "missing", "Evidence available to the selected source", null));
			if (record.evidence_id !== input.evidence_id) return err(new EvidenceReferenceError(input.evidence_id, "identity_mismatch", input.evidence_id, record.evidence_id));
			return ok(record);
		};
		resolveApplicationEvidenceRequest = (input, lookup) => {
			const application = resolveEvidenceInput(input.application, lookup);
			if (!application.ok) return application;
			return ok({
				...input,
				application: application.value
			});
		};
		resolvePairedEvidenceRequest = (input, lookup) => {
			const left = resolveEvidenceInput(input.left, lookup);
			if (!left.ok) return left;
			const right = resolveEvidenceInput(input.right, lookup);
			if (!right.ok) return right;
			return ok({
				...input,
				left: left.value,
				right: right.value
			});
		};
	})))();
}

//#endregion
export { init_EvidenceInputResolver, resolveEvidenceInput, resolvePairedEvidenceRequest };