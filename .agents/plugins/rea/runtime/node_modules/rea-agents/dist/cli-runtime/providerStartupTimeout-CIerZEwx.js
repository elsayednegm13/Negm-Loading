import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS, MAX_PROVIDER_STARTUP_TIMEOUT_MS, init_analysisResourceLimits } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { z } from "zod";

//#region dist/config/providerStartupTimeout.js
var DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, ghidraDecompileTimeoutSchema, providerStartupTimeoutSchema;
function init_providerStartupTimeout() {
	return (init_providerStartupTimeout = __esmMin((() => {
		init_analysisResourceLimits();
		DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS = 12e4;
		ghidraDecompileTimeoutSchema = z.string().regex(/^[1-9]\d*$/u, "must be a positive decimal integer").transform(Number).pipe(z.number().int().min(1).max(MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS));
		providerStartupTimeoutSchema = z.string().regex(/^[1-9]\d*$/u, "must be a positive decimal integer").transform(Number).pipe(z.int().min(1).max(MAX_PROVIDER_STARTUP_TIMEOUT_MS));
	})))();
}

//#endregion
export { DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, ghidraDecompileTimeoutSchema, init_providerStartupTimeout, providerStartupTimeoutSchema };