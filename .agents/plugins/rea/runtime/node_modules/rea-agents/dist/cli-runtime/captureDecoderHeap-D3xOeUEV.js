import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB, init_analysisResourceLimits } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";

//#region dist/config/captureDecoderHeap.js
var CAPTURE_DECODER_OLD_GENERATION_SETTING, DEFAULT_CAPTURE_DECODER_HEAP, captureDecoderHeapConstraint, decimalInteger, withinHeapRange, captureDecoderOldGenerationMiBSchema, parseCaptureDecoderHeap, resolveCaptureDecoderHeap, captureDecoderHeapRecovery;
function init_captureDecoderHeap() {
	return (init_captureDecoderHeap = __esmMin((() => {
		init_analysisResourceLimits();
		init_configurationErrors();
		init_result();
		CAPTURE_DECODER_OLD_GENERATION_SETTING = "REA_CAPTURE_DECODER_OLD_GENERATION_MIB";
		DEFAULT_CAPTURE_DECODER_HEAP = {
			oldGenerationMiB: 192,
			source: "default"
		};
		captureDecoderHeapConstraint = `${CAPTURE_DECODER_OLD_GENERATION_SETTING} must be a decimal integer from ${String(8)} to ${String(MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB)} MiB; the default is ${String(192)} MiB. An old generation below the decoder's ${String(8)} MiB semi-space aborts Node during startup instead of enforcing a limit, and a larger value is refused.`;
		decimalInteger = /^[1-9]\d*$/u;
		withinHeapRange = (value) => {
			if (!decimalInteger.test(value)) return true;
			const parsed = BigInt(value);
			return parsed >= BigInt(8) && parsed <= BigInt(16384);
		};
		captureDecoderOldGenerationMiBSchema = z.string().regex(decimalInteger, { error: captureDecoderHeapConstraint }).refine(withinHeapRange, { error: captureDecoderHeapConstraint }).transform(Number);
		parseCaptureDecoderHeap = (value) => {
			if (value === undefined) return ok(DEFAULT_CAPTURE_DECODER_HEAP);
			const parsed = captureDecoderOldGenerationMiBSchema.safeParse(value);
			return parsed.success ? ok({
				oldGenerationMiB: parsed.data,
				source: "setting"
			}) : err(new ConfigurationError(captureDecoderHeapConstraint, { settings: [{
				setting: CAPTURE_DECODER_OLD_GENERATION_SETTING,
				constraint: captureDecoderHeapConstraint
			}] }));
		};
		resolveCaptureDecoderHeap = (environment) => {
			const parsed = parseCaptureDecoderHeap(environment[CAPTURE_DECODER_OLD_GENERATION_SETTING]);
			if (!parsed.ok) throw parsed.error;
			return parsed.value;
		};
		captureDecoderHeapRecovery = (heap) => [
			`The effective ${CAPTURE_DECODER_OLD_GENERATION_SETTING} value is ${String(heap.oldGenerationMiB)} MiB (source ${heap.source}; default ${String(192)} MiB, floor ${String(8)} MiB, maximum ${String(MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB)} MiB).`,
			`Set ${CAPTURE_DECODER_OLD_GENERATION_SETTING} in the environment that starts REA to a decimal integer from ${String(8)} to ${String(MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB)}, then restart REA. In a running MCP server, use update_analysis_settings with setting capture.decoder_old_generation_mib and action set instead; the new value applies to new work without a REA restart.`,
			`On Node.js the decoder passes --max-old-space-size=${String(heap.oldGenerationMiB)} and removes inherited NODE_OPTIONS, so additional host memory and NODE_OPTIONS do not raise this heap. The ${String(8)} MiB semi-space stays fixed.`,
			"On Bun the V8 flags are ignored. Windows limits the decoder's committed memory to this value plus a 512 MiB reserve. Other Bun hosts enforce no decoder heap limit."
		].join(" ");
	})))();
}

//#endregion
export { DEFAULT_CAPTURE_DECODER_HEAP, captureDecoderHeapRecovery, captureDecoderOldGenerationMiBSchema, init_captureDecoderHeap, resolveCaptureDecoderHeap };