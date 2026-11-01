import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { analysisInputErrorFromIssues, historicalSourceGraphSchema, init_inputIssueProjection, init_referenceSourceGraph } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_JsonAuthenticationHeadroom, requireAuthenticationHeadroom } from "./JsonAuthenticationHeadroom-BLfbjzA3.js";
import { init_JsonFiles, readJsonFileWithSource } from "./JsonFiles-CQsLHX3a.js";
import { setImmediate } from "node:timers/promises";

//#region dist/application/javascript/SourceToBundleReference.js
var resolveSourceToBundleReference;
function init_SourceToBundleReference() {
	return (init_SourceToBundleReference = __esmMin((() => {
		init_JsonAuthenticationHeadroom();
		init_referenceSourceGraph();
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_result();
		init_JsonFiles();
		resolveSourceToBundleReference = async (reference, signal, resources) => {
			const cancelled = () => signal?.aborted === true;
			if (cancelled()) return err(new AnalysisCancelledError("compare_source_to_bundle", { cause: signal?.reason }));
			if (!("kind" in reference)) return ok({ reference });
			const read = await readJsonFileWithSource(reference.path, signal, resources, "compare_source_to_bundle");
			if (!read.ok) return read;
			await setImmediate();
			if (cancelled()) return err(new AnalysisCancelledError("compare_source_to_bundle", { cause: signal?.reason }));
			const headroom = requireAuthenticationHeadroom(read.value.data, {
				operation: "compare_source_to_bundle",
				path: read.value.path,
				description: "Insufficient heap headroom to authenticate the historical source graph"
			});
			if (!headroom.ok) return headroom;
			const parsed = historicalSourceGraphSchema.safeParse(read.value.data);
			await setImmediate();
			if (cancelled()) return err(new AnalysisCancelledError("compare_source_to_bundle", { cause: signal?.reason }));
			if (!parsed.success) return err(analysisInputErrorFromIssues("compare_source_to_bundle", parsed.error.issues.map((issue) => ({
				...issue,
				path: ["reference", ...issue.path]
			})), { reference: read.value.data }, { cause: parsed.error }));
			return ok({
				reference: parsed.data,
				reference_source: {
					kind: "file",
					path: read.value.path,
					requested_path: reference.path
				}
			});
		};
	})))();
}

//#endregion
init_SourceToBundleReference();
export { resolveSourceToBundleReference };