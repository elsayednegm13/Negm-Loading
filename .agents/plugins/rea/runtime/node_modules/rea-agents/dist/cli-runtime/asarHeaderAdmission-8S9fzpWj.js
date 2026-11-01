import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_ASAR_MAX_HEADER_BYTES, MAXIMUM_ASAR_MAX_HEADER_BYTES, init_analysisResourceLimits } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";

//#region dist/config/asarHeaderAdmission.js
var ASAR_HEADER_ADMISSION_SETTING, DEFAULT_ASAR_HEADER_ADMISSION, asarMaxHeaderBytesConstraint, asarMaxHeaderBytesSchema, parseAsarHeaderAdmission;
function init_asarHeaderAdmission() {
	return (init_asarHeaderAdmission = __esmMin((() => {
		init_analysisResourceLimits();
		init_configurationErrors();
		init_result();
		ASAR_HEADER_ADMISSION_SETTING = "REA_ASAR_MAX_HEADER_BYTES";
		DEFAULT_ASAR_HEADER_ADMISSION = {
			maximumBytes: DEFAULT_ASAR_MAX_HEADER_BYTES,
			source: "default"
		};
		asarMaxHeaderBytesConstraint = `${ASAR_HEADER_ADMISSION_SETTING} must be a positive decimal integer of at most ${String(MAXIMUM_ASAR_MAX_HEADER_BYTES)} bytes (256 MiB); the default is ${String(DEFAULT_ASAR_MAX_HEADER_BYTES)} bytes (16 MiB).`;
		asarMaxHeaderBytesSchema = z.string().regex(/^[1-9]\d*$/u, { error: asarMaxHeaderBytesConstraint }).transform(Number).pipe(z.number().int().max(MAXIMUM_ASAR_MAX_HEADER_BYTES, { error: asarMaxHeaderBytesConstraint }));
		parseAsarHeaderAdmission = (value) => {
			if (value === undefined) return ok(DEFAULT_ASAR_HEADER_ADMISSION);
			const parsed = asarMaxHeaderBytesSchema.safeParse(value);
			return parsed.success ? ok({
				maximumBytes: parsed.data,
				source: "setting"
			}) : err(new ConfigurationError(asarMaxHeaderBytesConstraint, { settings: [{
				setting: ASAR_HEADER_ADMISSION_SETTING,
				constraint: asarMaxHeaderBytesConstraint
			}] }));
		};
	})))();
}

//#endregion
export { ASAR_HEADER_ADMISSION_SETTING, DEFAULT_ASAR_HEADER_ADMISSION, asarMaxHeaderBytesSchema, init_asarHeaderAdmission, parseAsarHeaderAdmission };