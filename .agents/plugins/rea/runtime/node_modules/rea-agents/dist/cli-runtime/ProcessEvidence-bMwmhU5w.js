import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PROCESS_PROVIDER, createEvidence, init_evidence, init_evidenceValidation, init_processCaptureParsing, init_processEvidenceProvider, isProcessEvidenceProvider, safeParseEvidence, safeParseProcessCapture } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { posix, win32 } from "node:path";

//#region dist/application/process/ProcessEvidence.js
var PROCESS_CAPTURE_EVIDENCE, parseProcessCaptureEvidence, processEvidenceParameters, createProcessCaptureEvidence;
function init_ProcessEvidence() {
	return (init_ProcessEvidence = __esmMin((() => {
		init_evidence();
		init_processEvidenceProvider();
		init_processCaptureParsing();
		init_evidenceValidation();
		init_result();
		PROCESS_CAPTURE_EVIDENCE = {
			operation: "capture_process_scenario",
			predicate: "rea.process-capture"
		};
		parseProcessCaptureEvidence = (input) => {
			const parsedEvidence = safeParseEvidence(input);
			if (!parsedEvidence.ok) return err({
				kind: "invalid-evidence",
				cause: parsedEvidence.error
			});
			const record = parsedEvidence.value;
			if (record.operation !== PROCESS_CAPTURE_EVIDENCE.operation || record.predicate_type !== PROCESS_CAPTURE_EVIDENCE.predicate) return err({
				kind: "wrong-workflow",
				expected: PROCESS_CAPTURE_EVIDENCE,
				actual: {
					operation: record.operation,
					predicate: record.predicate_type
				}
			});
			if (!isProcessEvidenceProvider(record.provider)) return err({
				kind: "unsupported-provider",
				provider: record.provider
			});
			const parsedCapture = safeParseProcessCapture(record.normalized_result);
			return parsedCapture.success ? ok({
				record,
				capture: parsedCapture.data
			}) : err({
				kind: "invalid-capture",
				cause: parsedCapture.error
			});
		};
		processEvidenceParameters = (scenario, platform) => ({
			executable_name: (platform === "win32" ? win32 : posix).basename(scenario.executable),
			argument_count: scenario.arguments.length,
			event_count: scenario.events.length,
			filesystem_observation_path_count: scenario.filesystem_observation_paths.length,
			normalization: scenario.normalization
		});
		createProcessCaptureEvidence = (scenario, capture) => {
			return createEvidence(undefined, PROCESS_PROVIDER, {
				predicateType: PROCESS_CAPTURE_EVIDENCE.predicate,
				operation: PROCESS_CAPTURE_EVIDENCE.operation,
				parameters: processEvidenceParameters(scenario, capture.manifest.platform),
				result: capture,
				confidence: "observed",
				authority: "controlled-replay",
				environment: {
					id: `${capture.manifest.platform}-${capture.manifest.architecture}`,
					platform: capture.manifest.platform,
					architecture: capture.manifest.architecture,
					isolation: "process"
				},
				limitations: capture.limitations
			});
		};
	})))();
}

//#endregion
export { createProcessCaptureEvidence, init_ProcessEvidence, parseProcessCaptureEvidence };