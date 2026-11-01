import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_REGEX_MATCHING_DEADLINE_MS, MAXIMUM_REGEX_MATCHING_DEADLINE_MS, MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB, init_analysisResourceLimits } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisResourceConstraintError, ConfigurationError, err, init_analysisErrorCore, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";
import { userInfo } from "node:os";

//#region dist/config/ghidraDisabledAnalyzers.js
var MAX_GHIDRA_DISABLED_ANALYZER_NAMES, MAX_GHIDRA_DISABLED_ANALYZER_NAME_LENGTH, ghidraAnalyzerNamePattern, ghidraDisabledAnalyzersSchema;
function init_ghidraDisabledAnalyzers() {
	return (init_ghidraDisabledAnalyzers = __esmMin((() => {
		MAX_GHIDRA_DISABLED_ANALYZER_NAMES = 32;
		MAX_GHIDRA_DISABLED_ANALYZER_NAME_LENGTH = 120;
		ghidraAnalyzerNamePattern = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/u;
		ghidraDisabledAnalyzersSchema = z.string().transform((value) => value.split(",").map((name) => name.trim()).filter((name) => name.length > 0)).refine((names) => names.length <= 32, `must list at most ${32} analyzer names`).refine((names) => names.every((name) => name.length <= 120), `must keep every analyzer name at most ${120} characters`).refine((names) => names.every((name) => ghidraAnalyzerNamePattern.test(name)), "must be Ghidra analyzer names starting with a letter or digit and containing only letters, digits, spaces, periods, underscores, and hyphens").transform((names) => names.length === 0 ? undefined : names);
	})))();
}

//#endregion
//#region dist/config/bridgeMaxRequestBytes.js
var BRIDGE_MAX_REQUEST_BYTES_SETTING, DEFAULT_BRIDGE_MAX_REQUEST_BYTES, MINIMUM_BRIDGE_MAX_REQUEST_BYTES, NODE_MAX_STRING_LENGTH, FRAMING_LF_CODE_UNITS, MAXIMUM_BRIDGE_MAX_REQUEST_BYTES, DEFAULT_BRIDGE_MAX_REQUEST, bridgeMaxRequestBytesConstraint, decimalInteger$2, withinRequestRange, bridgeMaxRequestBytesSchema, parseBridgeMaxRequestBytes, resolveBridgeMaxRequestBytes, bridgeMaxRequestBytesRecovery, limitFacts, bridgeRequestOversizeError, bridgeRequestLimitMismatchError, bridgeResponseOversizeError;
function init_bridgeMaxRequestBytes() {
	return (init_bridgeMaxRequestBytes = __esmMin((() => {
		init_analysisErrorCore();
		init_configurationErrors();
		init_result();
		BRIDGE_MAX_REQUEST_BYTES_SETTING = "REA_BRIDGE_MAX_REQUEST_BYTES";
		DEFAULT_BRIDGE_MAX_REQUEST_BYTES = 16 * 1024 * 1024;
		MINIMUM_BRIDGE_MAX_REQUEST_BYTES = 7464;
		NODE_MAX_STRING_LENGTH = 536870888;
		FRAMING_LF_CODE_UNITS = 1;
		MAXIMUM_BRIDGE_MAX_REQUEST_BYTES = NODE_MAX_STRING_LENGTH - FRAMING_LF_CODE_UNITS;
		DEFAULT_BRIDGE_MAX_REQUEST = {
			maximumBytes: DEFAULT_BRIDGE_MAX_REQUEST_BYTES,
			source: "default"
		};
		bridgeMaxRequestBytesConstraint = `${BRIDGE_MAX_REQUEST_BYTES_SETTING} must be a positive decimal integer from ${String(MINIMUM_BRIDGE_MAX_REQUEST_BYTES)} to ${String(MAXIMUM_BRIDGE_MAX_REQUEST_BYTES)} bytes; the default is ${String(DEFAULT_BRIDGE_MAX_REQUEST_BYTES)} bytes (16 MiB). A value below ${String(MINIMUM_BRIDGE_MAX_REQUEST_BYTES)} bytes cannot carry the largest admitted symbol-name command, and a larger value is refused so the encoded payload plus its framing LF stays one string under Node's single-string ceiling.`;
		decimalInteger$2 = /^[1-9]\d*$/u;
		withinRequestRange = (value) => {
			if (!decimalInteger$2.test(value)) return true;
			const parsed = BigInt(value);
			return parsed >= BigInt(7464) && parsed <= BigInt(536870887);
		};
		bridgeMaxRequestBytesSchema = z.string().regex(decimalInteger$2, { error: bridgeMaxRequestBytesConstraint }).refine(withinRequestRange, { error: bridgeMaxRequestBytesConstraint }).transform(Number);
		parseBridgeMaxRequestBytes = (value) => {
			if (value === undefined) return ok(DEFAULT_BRIDGE_MAX_REQUEST);
			const parsed = bridgeMaxRequestBytesSchema.safeParse(value);
			return parsed.success ? ok({
				maximumBytes: parsed.data,
				source: "setting"
			}) : err(new ConfigurationError(bridgeMaxRequestBytesConstraint, { settings: [{
				setting: BRIDGE_MAX_REQUEST_BYTES_SETTING,
				constraint: bridgeMaxRequestBytesConstraint
			}] }));
		};
		resolveBridgeMaxRequestBytes = (environment) => {
			const parsed = parseBridgeMaxRequestBytes(environment[BRIDGE_MAX_REQUEST_BYTES_SETTING]);
			if (!parsed.ok) throw parsed.error;
			return parsed.value;
		};
		bridgeMaxRequestBytesRecovery = (limit, peer = "Hopper") => [
			`The effective ${BRIDGE_MAX_REQUEST_BYTES_SETTING} value is ${String(limit.maximumBytes)} bytes (source ${limit.source}; default ${String(DEFAULT_BRIDGE_MAX_REQUEST_BYTES)}, floor ${String(MINIMUM_BRIDGE_MAX_REQUEST_BYTES)}, maximum ${String(MAXIMUM_BRIDGE_MAX_REQUEST_BYTES)}).`,
			`Set ${BRIDGE_MAX_REQUEST_BYTES_SETTING} in the environment that starts REA to a decimal integer from ${String(MINIMUM_BRIDGE_MAX_REQUEST_BYTES)} to ${String(MAXIMUM_BRIDGE_MAX_REQUEST_BYTES)}, then restart REA.`,
			peer === "Ghidra" ? `The Ghidra bridge enforces no request ceiling of its own, so only the REA client applies ${BRIDGE_MAX_REQUEST_BYTES_SETTING} to Ghidra requests.` : "Restart Hopper or Cutter from that same environment so the bridge uses this ceiling."
		].join(" ");
		limitFacts = (limit) => ({ max_request_bytes: limit.maximumBytes });
		bridgeRequestOversizeError = (operation, limit, payloadBytes, peer) => {
			const recovery = bridgeMaxRequestBytesRecovery(limit, peer);
			const refusal = peer === "Cutter" ? `Cutter request exceeds its authenticated frame limit of ${String(limit.maximumBytes)} bytes; no command was sent.` : `${peer} request exceeds its ${String(limit.maximumBytes)}-byte payload limit; no request was sent.`;
			return new AnalysisResourceConstraintError(operation, "transport", `${refusal} ${recovery}`, {
				...limitFacts(limit),
				payload_bytes: payloadBytes
			}, {
				remediationAction: recovery,
				retryable: false
			});
		};
		bridgeRequestLimitMismatchError = (operation, limit, bridgeBytes, peer, sent = peer === "Cutter" ? "No command was sent." : "No request was sent.") => {
			const recovery = bridgeMaxRequestBytesRecovery(limit, peer);
			return new AnalysisResourceConstraintError(operation, "transport", `The ${peer} bridge ceiling is ${String(bridgeBytes)} bytes and the REA client ceiling is ${String(limit.maximumBytes)} bytes. ${sent} An out-of-band ${peer} process defaults to ${String(DEFAULT_BRIDGE_MAX_REQUEST_BYTES)} bytes when ${BRIDGE_MAX_REQUEST_BYTES_SETTING} is unset. ${recovery}`, {
				bridge_max_request_bytes: bridgeBytes,
				client_max_request_bytes: limit.maximumBytes
			}, {
				remediationAction: recovery,
				retryable: false
			});
		};
		bridgeResponseOversizeError = (limit) => {
			const recovery = bridgeMaxRequestBytesRecovery(limit, "Cutter");
			return new AnalysisResourceConstraintError("cutter_command", "transport", `Cutter bridge response exceeded its framed transport limit of ${String(limit.maximumBytes)} bytes. ${recovery}`, limitFacts(limit), {
				remediationAction: recovery,
				retryable: false
			});
		};
	})))();
}

//#endregion
//#region dist/config/regexMatchingDeadline.js
var REGEX_MATCHING_DEADLINE_SETTING, DEFAULT_REGEX_MATCHING_DEADLINE, regexMatchingDeadlineConstraint, decimalInteger$1, withinDeadlineRange, regexMatchingDeadlineMsSchema, parseRegexMatchingDeadline, resolveRegexMatchingDeadline, regexMatchingDeadlineRecovery;
function init_regexMatchingDeadline() {
	return (init_regexMatchingDeadline = __esmMin((() => {
		init_analysisResourceLimits();
		init_configurationErrors();
		init_result();
		REGEX_MATCHING_DEADLINE_SETTING = "REA_REGEX_MATCHING_DEADLINE_MS";
		DEFAULT_REGEX_MATCHING_DEADLINE = {
			deadlineMs: DEFAULT_REGEX_MATCHING_DEADLINE_MS,
			source: "default"
		};
		regexMatchingDeadlineConstraint = `${REGEX_MATCHING_DEADLINE_SETTING} must be a positive decimal integer from 1 to ${String(MAXIMUM_REGEX_MATCHING_DEADLINE_MS)} ms; the default is ${String(DEFAULT_REGEX_MATCHING_DEADLINE_MS)} ms. Node schedules a delay above that maximum as 1 ms, so a larger value is refused.`;
		decimalInteger$1 = /^[1-9]\d*$/u;
		withinDeadlineRange = (value) => {
			if (!decimalInteger$1.test(value)) return true;
			const parsed = BigInt(value);
			return parsed >= 1n && parsed <= BigInt(2147483647);
		};
		regexMatchingDeadlineMsSchema = z.string().regex(decimalInteger$1, { error: regexMatchingDeadlineConstraint }).refine(withinDeadlineRange, { error: regexMatchingDeadlineConstraint }).transform(Number);
		parseRegexMatchingDeadline = (value) => {
			if (value === undefined) return ok(DEFAULT_REGEX_MATCHING_DEADLINE);
			const parsed = regexMatchingDeadlineMsSchema.safeParse(value);
			return parsed.success ? ok({
				deadlineMs: parsed.data,
				source: "setting"
			}) : err(new ConfigurationError(regexMatchingDeadlineConstraint, { settings: [{
				setting: REGEX_MATCHING_DEADLINE_SETTING,
				constraint: regexMatchingDeadlineConstraint
			}] }));
		};
		resolveRegexMatchingDeadline = (environment) => {
			const parsed = parseRegexMatchingDeadline(environment[REGEX_MATCHING_DEADLINE_SETTING]);
			if (!parsed.ok) throw parsed.error;
			return parsed.value;
		};
		regexMatchingDeadlineRecovery = (deadline) => [
			`The effective ${REGEX_MATCHING_DEADLINE_SETTING} value is ${String(deadline.deadlineMs)} ms (source ${deadline.source}; default ${String(DEFAULT_REGEX_MATCHING_DEADLINE_MS)} ms, floor 1 ms, maximum ${String(MAXIMUM_REGEX_MATCHING_DEADLINE_MS)} ms).`,
			`Set ${REGEX_MATCHING_DEADLINE_SETTING} in the environment that starts REA to a positive decimal integer from 1 to ${String(MAXIMUM_REGEX_MATCHING_DEADLINE_MS)}, then restart REA. In a running MCP server, use update_analysis_settings with setting regex.matching_deadline_ms and action set instead; the new value applies to new work without a REA restart.`,
			"The worker old-generation heap does not raise this deadline."
		].join(" ");
	})))();
}

//#endregion
//#region dist/config/regexWorkerHeapRequest.js
var REGEX_WORKER_HEAP_REQUEST_SETTING, DEFAULT_REGEX_WORKER_HEAP_REQUEST, regexWorkerHeapRequestConstraint, decimalInteger, withinHeapRange, regexWorkerHeapRequestMiBSchema, parseRegexWorkerHeapRequest, resolveRegexWorkerHeapRequest, regexWorkerHeapRequestRecovery;
function init_regexWorkerHeapRequest() {
	return (init_regexWorkerHeapRequest = __esmMin((() => {
		init_analysisResourceLimits();
		init_configurationErrors();
		init_result();
		REGEX_WORKER_HEAP_REQUEST_SETTING = "REA_REGEX_WORKER_HEAP_REQUEST_MIB";
		DEFAULT_REGEX_WORKER_HEAP_REQUEST = {
			heapMiB: 128,
			source: "default"
		};
		regexWorkerHeapRequestConstraint = `${REGEX_WORKER_HEAP_REQUEST_SETTING} must be a decimal integer from ${String(7)} to ${String(MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB)} MiB; the default is ${String(128)} MiB. A request below ${String(7)} MiB aborts the worker during startup, and a larger value is refused.`;
		decimalInteger = /^[1-9]\d*$/u;
		withinHeapRange = (value) => {
			if (!decimalInteger.test(value)) return true;
			const parsed = BigInt(value);
			return parsed >= BigInt(7) && parsed <= BigInt(16384);
		};
		regexWorkerHeapRequestMiBSchema = z.string().regex(decimalInteger, { error: regexWorkerHeapRequestConstraint }).refine(withinHeapRange, { error: regexWorkerHeapRequestConstraint }).transform(Number);
		parseRegexWorkerHeapRequest = (value) => {
			if (value === undefined) return ok(DEFAULT_REGEX_WORKER_HEAP_REQUEST);
			const parsed = regexWorkerHeapRequestMiBSchema.safeParse(value);
			return parsed.success ? ok({
				heapMiB: parsed.data,
				source: "setting"
			}) : err(new ConfigurationError(regexWorkerHeapRequestConstraint, { settings: [{
				setting: REGEX_WORKER_HEAP_REQUEST_SETTING,
				constraint: regexWorkerHeapRequestConstraint
			}] }));
		};
		resolveRegexWorkerHeapRequest = (environment) => {
			const parsed = parseRegexWorkerHeapRequest(environment[REGEX_WORKER_HEAP_REQUEST_SETTING]);
			if (!parsed.ok) throw parsed.error;
			return parsed.value;
		};
		regexWorkerHeapRequestRecovery = (request) => [
			`The effective ${REGEX_WORKER_HEAP_REQUEST_SETTING} value is ${String(request.heapMiB)} MiB (source ${request.source}; default ${String(128)} MiB, floor ${String(7)} MiB, maximum ${String(MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB)} MiB).`,
			`Set ${REGEX_WORKER_HEAP_REQUEST_SETTING} in the environment that starts REA to a decimal integer from ${String(7)} to ${String(MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB)}, then restart REA. In a running MCP server, use update_analysis_settings with setting regex.worker_heap_request_mib and action set instead; the new value applies to new work without a REA restart.`,
			"A positive Node --max-old-space-size, including NODE_OPTIONS, overrides this request and sets the effective heap. That flag is not limited by this setting's floor or maximum. Raising host memory alone does not raise the request."
		].join(" ");
	})))();
}

//#endregion
//#region dist/config/homeDirectory.js
var firstNonempty, homeDirectoryFromEnvironment;
function init_homeDirectory() {
	return (init_homeDirectory = __esmMin((() => {
		firstNonempty = (...values) => values.find((value) => value !== undefined && value.length > 0);
		homeDirectoryFromEnvironment = (environment, platform) => {
			const windowsDriveHome = environment.HOMEDRIVE !== undefined && environment.HOMEDRIVE.length > 0 && environment.HOMEPATH !== undefined && environment.HOMEPATH.length > 0 ? `${environment.HOMEDRIVE}${environment.HOMEPATH}` : undefined;
			const selected = platform === "win32" ? firstNonempty(environment.USERPROFILE, windowsDriveHome, environment.HOME) : firstNonempty(environment.HOME, environment.USERPROFILE);
			return selected ?? userInfo().homedir;
		};
	})))();
}

//#endregion
export { DEFAULT_BRIDGE_MAX_REQUEST, DEFAULT_BRIDGE_MAX_REQUEST_BYTES, DEFAULT_REGEX_MATCHING_DEADLINE, DEFAULT_REGEX_WORKER_HEAP_REQUEST, MAXIMUM_BRIDGE_MAX_REQUEST_BYTES, MINIMUM_BRIDGE_MAX_REQUEST_BYTES, REGEX_WORKER_HEAP_REQUEST_SETTING, bridgeMaxRequestBytesSchema, bridgeRequestLimitMismatchError, bridgeRequestOversizeError, bridgeResponseOversizeError, ghidraDisabledAnalyzersSchema, homeDirectoryFromEnvironment, init_bridgeMaxRequestBytes, init_ghidraDisabledAnalyzers, init_homeDirectory, init_regexMatchingDeadline, init_regexWorkerHeapRequest, regexMatchingDeadlineMsSchema, regexMatchingDeadlineRecovery, regexWorkerHeapRequestMiBSchema, regexWorkerHeapRequestRecovery, resolveBridgeMaxRequestBytes, resolveRegexMatchingDeadline, resolveRegexWorkerHeapRequest };