import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_asarHeaderAdmission, parseAsarHeaderAdmission } from "./asarHeaderAdmission-8S9fzpWj.js";
import { init_captureDecoderHeap, resolveCaptureDecoderHeap } from "./captureDecoderHeap-D3xOeUEV.js";

//#region dist/config/runtimeAnalysisSettings.js
var runtimeAnalysisConfig, runtimeAsarHeaderAdmission, runtimeCaptureDecoderHeap;
function init_runtimeAnalysisSettings() {
	return (init_runtimeAnalysisSettings = __esmMin((() => {
		init_asarHeaderAdmission();
		init_captureDecoderHeap();
		runtimeAnalysisConfig = (config, read) => {
			if (read === undefined) return config;
			const deadline = config.regexMatchingDeadline;
			const heap = config.regexWorkerHeapRequest;
			return {
				...config,
				get ghidraStartupTimeoutMs() {
					return read().overrides["ghidra.startup_timeout_ms"] ?? config.ghidraStartupTimeoutMs;
				},
				get hopperStartupTimeoutMs() {
					return read().overrides["hopper.startup_timeout_ms"] ?? config.hopperStartupTimeoutMs;
				},
				get ghidraDecompileTimeoutSeconds() {
					const value = read().overrides["ghidra.decompile_timeout_seconds"];
					return value === undefined ? config.ghidraDecompileTimeoutSeconds : value === null ? undefined : value;
				},
				regexMatchingDeadline: {
					get deadlineMs() {
						return read().overrides["regex.matching_deadline_ms"] ?? deadline.deadlineMs;
					},
					get source() {
						return read().overrides["regex.matching_deadline_ms"] === undefined ? deadline.source : "runtime";
					}
				},
				regexWorkerHeapRequest: {
					get heapMiB() {
						return read().overrides["regex.worker_heap_request_mib"] ?? heap.heapMiB;
					},
					get source() {
						return read().overrides["regex.worker_heap_request_mib"] === undefined ? heap.source : "runtime";
					}
				}
			};
		};
		runtimeAsarHeaderAdmission = (environment, read) => {
			const parsed = parseAsarHeaderAdmission(environment.REA_ASAR_MAX_HEADER_BYTES);
			if (!parsed.ok) throw parsed.error;
			const baseline = parsed.value;
			return read === undefined ? baseline : {
				get maximumBytes() {
					return read().overrides["asar.max_header_bytes"] ?? baseline.maximumBytes;
				},
				get source() {
					return read().overrides["asar.max_header_bytes"] === undefined ? baseline.source : "runtime";
				}
			};
		};
		runtimeCaptureDecoderHeap = (environment, read) => {
			const baseline = resolveCaptureDecoderHeap(environment);
			return read === undefined ? baseline : {
				get oldGenerationMiB() {
					return read().overrides["capture.decoder_old_generation_mib"] ?? baseline.oldGenerationMiB;
				},
				get source() {
					return read().overrides["capture.decoder_old_generation_mib"] === undefined ? baseline.source : "runtime";
				}
			};
		};
	})))();
}

//#endregion
export { init_runtimeAnalysisSettings, runtimeAnalysisConfig, runtimeAsarHeaderAdmission, runtimeCaptureDecoderHeap };