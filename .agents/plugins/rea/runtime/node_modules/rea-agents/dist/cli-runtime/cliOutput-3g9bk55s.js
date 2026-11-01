import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ConfigurationError, err, formatCliOutput, init_cliOutputFormatter, init_configurationErrors, init_jsonLines, init_jsonOutput, init_result, jsonLinesErrorRecord, jsonOutputParts, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { declaredSensitiveValues, init_cliBuiltinArguments, splitIncurBuiltinArguments } from "./cliBuiltinArguments-C-p5kRCy.js";
import { z } from "zod";
import { satisfies } from "semver";

//#region dist/config/processStart.js
var processStartConfigurationSchema, blocksProcessStart, parseLogLevel;
function init_processStart() {
	return (init_processStart = __esmMin((() => {
		init_configurationErrors();
		init_result();
		processStartConfigurationSchema = z.object({ REA_LOG_LEVEL: z.enum([
			"trace",
			"debug",
			"info",
			"warn",
			"error",
			"fatal",
			"silent"
		]).default("info") });
		blocksProcessStart = (setting) => Object.hasOwn(processStartConfigurationSchema.shape, setting);
		parseLogLevel = (value) => {
			const parsed = processStartConfigurationSchema.shape.REA_LOG_LEVEL.safeParse(value);
			if (parsed.success) return ok(parsed.data);
			return err(new ConfigurationError("Invalid REA environment configuration", {
				cause: parsed.error,
				settings: parsed.error.issues.map(({ message }) => ({
					setting: "REA_LOG_LEVEL",
					constraint: message
				}))
			}));
		};
	})))();
}

//#endregion
//#region dist/domain/explicitSensitiveValues.js
var redactExplicitText;
function init_explicitSensitiveValues() {
	return (init_explicitSensitiveValues = __esmMin((() => {
		redactExplicitText = (value, sensitiveValues) => {
			const literals = [...new Set(sensitiveValues)].filter((literal) => literal !== "");
			const replacement = [
				"[REDACTED]",
				"…",
				""
			].find((candidate) => literals.every((literal) => !candidate.includes(literal))) ?? "";
			let result = value;
			for (const literal of literals.sort((left, right) => right.length - left.length)) result = result.replaceAll(literal, replacement);
			return literals.some((literal) => result.includes(literal)) ? "" : result;
		};
	})))();
}

//#endregion
//#region dist/domain/runtimeVersion.js
var SUPPORTED_NODE_VERSION_RANGE, SUPPORTED_NODE_VERSION_PROSE, supportsNodeVersion, javaScriptRuntime, supportsJavaScriptRuntime;
function init_runtimeVersion() {
	return (init_runtimeVersion = __esmMin((() => {
		SUPPORTED_NODE_VERSION_RANGE = "^22.23.4 || ^24.22.1 || >=26.12.1";
		SUPPORTED_NODE_VERSION_PROSE = "Node.js 22.x (>=22.23.4), 24.x (>=24.22.1), or 26.12.1+";
		supportsNodeVersion = (version) => satisfies(version, SUPPORTED_NODE_VERSION_RANGE);
		javaScriptRuntime = (versions) => versions.bun === undefined ? {
			id: "node",
			version: versions.node
		} : {
			id: "bun",
			version: versions.bun,
			nodeCompatibilityVersion: versions.node
		};
		supportsJavaScriptRuntime = (runtime) => supportsNodeVersion(runtime.id === "node" ? runtime.version : runtime.nodeCompatibilityVersion);
	})))();
}

//#endregion
//#region dist/domain/versionReport.js
var versionReportSchema, versionReport;
function init_versionReport() {
	return (init_versionReport = __esmMin((() => {
		init_runtimeVersion();
		versionReportSchema = z.strictObject({
			name: z.string(),
			version: z.string(),
			runtime: z.discriminatedUnion("id", [z.strictObject({
				id: z.literal("node"),
				version: z.string()
			}), z.strictObject({
				id: z.literal("bun"),
				version: z.string(),
				node_compatibility_version: z.string()
			})]),
			platform: z.string(),
			architecture: z.string(),
			supported_runtime: z.strictObject({
				range: z.string(),
				satisfied: z.boolean()
			})
		});
		versionReport = (host) => {
			const runtime = javaScriptRuntime(host.versions);
			return {
				name: host.packageName,
				version: host.packageVersion,
				runtime: runtime.id === "node" ? {
					id: "node",
					version: runtime.version
				} : {
					id: "bun",
					version: runtime.version,
					node_compatibility_version: runtime.nodeCompatibilityVersion
				},
				platform: host.platform,
				architecture: host.architecture,
				supported_runtime: {
					range: SUPPORTED_NODE_VERSION_RANGE,
					satisfied: supportsJavaScriptRuntime(runtime)
				}
			};
		};
	})))();
}

//#endregion
//#region dist/cliConfiguration.js
var cliConfigurationError;
function init_cliConfiguration() {
	return (init_cliConfiguration = __esmMin((() => {
		init_processStart();
		init_analysisErrorProjection();
		cliConfigurationError = (selectedEnvironment) => {
			const value = selectedEnvironment.REA_LOG_LEVEL;
			if (value === undefined) return undefined;
			const level = parseLogLevel(value);
			return level.ok ? undefined : projectAnalysisError(level.error).message;
		};
	})))();
}

//#endregion
//#region dist/cliOutput.js
var UNSUPPORTED_OUTPUT_COMBINATION_MESSAGE, CLI_OUTPUT_FORMATS, INCUR_OUTPUT_FORMATS, isCliOutputFormat, renderCliDocument, cliOutputValueRejection, parseCliOutputArguments, hasUnclosedFilterSlice, missingCliOutputValueMessage, validateCliOutputControls, renderEmptyFilteredCliOutput, renderCliOutputArgumentError, renderVersionReport;
function init_cliOutput() {
	return (init_cliOutput = __esmMin((() => {
		init_cliBuiltinArguments();
		init_explicitSensitiveValues();
		init_cliOutputFormatter();
		init_jsonOutput();
		init_jsonLines();
		init_versionReport();
		init_cliConfiguration();
		UNSUPPORTED_OUTPUT_COMBINATION_MESSAGE = "Token windows cannot preserve structured output. Remove --token-limit/--token-offset and use --filter-output or command pagination.";
		CLI_OUTPUT_FORMATS = [
			"toon",
			"json",
			"yaml",
			"md",
			"jsonl"
		];
		INCUR_OUTPUT_FORMATS = new Set(CLI_OUTPUT_FORMATS);
		isCliOutputFormat = (value) => INCUR_OUTPUT_FORMATS.has(value);
		renderCliDocument = (value, format, stdoutIsTerminal) => format === "json" || format === "jsonl" ? [...jsonOutputParts(value, format, stdoutIsTerminal)].join("") : `${formatCliOutput(value, format)}\n`;
		cliOutputValueRejection = (flag, value) => {
			if (flag === "--format") return INCUR_OUTPUT_FORMATS.has(value) ? undefined : `Invalid format: "${value}". Expected one of: ${[...INCUR_OUTPUT_FORMATS].join(", ")}`;
			if ((flag === "--token-limit" || flag === "--token-offset") && (!Number.isSafeInteger(Number(value)) || Number(value) < 0 || value.trim() === "")) return `Invalid value for ${flag}: "${value}". Expected a nonnegative safe integer.`;
			return undefined;
		};
		parseCliOutputArguments = (arguments_) => {
			let format = "toon";
			let rootVersion = false;
			let versionEligible = true;
			let formatExplicit = false;
			let filterOutput;
			let fullOutput = false;
			let missingValue;
			let invalidValue;
			let tokenCount = false;
			let tokenLimit;
			let tokenOffset;
			const parsed = () => {
				const parseError = invalidValue !== undefined;
				const controls = {
					filterOutput,
					format,
					formatExplicit,
					fullOutput,
					missingValue,
					invalidValue: invalidValue === undefined ? undefined : redactExplicitText(invalidValue, declaredSensitiveValues(splitIncurBuiltinArguments(arguments_).command)),
					tokenCount,
					tokenWindow: !parseError && (tokenLimit !== undefined || tokenOffset !== undefined),
					tokenLimit: parseError ? undefined : tokenLimit,
					tokenOffset: parseError ? undefined : tokenOffset
				};
				return {
					...controls,
					validation: validateCliOutputControls(controls),
					versionReportFormat: rootVersion && versionEligible && formatExplicit && !parseError && missingValue === undefined && isCliOutputFormat(format) ? format : undefined
				};
			};
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "--version") {
					const next = arguments_[index + 1];
					if (next === undefined || next.startsWith("-")) rootVersion = true;
					else versionEligible = false;
				} else if (argument !== "--json" && argument !== "--format") versionEligible = false;
				if (argument === "--json") {
					format = "json";
					formatExplicit = true;
					continue;
				}
				if (argument === "--format") {
					const value = arguments_[index + 1];
					if (value) {
						const rejection = cliOutputValueRejection(argument, value);
						if (rejection !== undefined) invalidValue ??= rejection;
						else {
							format = value;
							formatExplicit = true;
						}
						index += 1;
					} else missingValue ??= argument;
					continue;
				}
				if (argument === "--filter-output") {
					if (arguments_[index + 1]) {
						filterOutput = arguments_[index + 1];
						index += 1;
					} else missingValue ??= argument;
					continue;
				}
				if (argument === "--token-limit" || argument === "--token-offset") {
					const value = arguments_[index + 1];
					if (value) {
						const rejection = cliOutputValueRejection(argument, value);
						if (rejection !== undefined) invalidValue ??= rejection;
						else if (argument === "--token-limit") tokenLimit = Number(value);
						else tokenOffset = Number(value);
						index += 1;
					} else missingValue ??= argument;
					continue;
				}
				if (argument === "--full-output") fullOutput = true;
				if (argument === "--token-count") tokenCount = true;
			}
			return parsed();
		};
		hasUnclosedFilterSlice = (expression) => {
			let depth = 0;
			let unclosed = false;
			for (const character of expression) {
				if (character === "[") {
					depth += 1;
					unclosed = true;
				} else if (character === "]") {
					depth -= 1;
					unclosed = false;
				} else if (character === "," && depth === 0 && unclosed) return true;
			}
			return unclosed;
		};
		missingCliOutputValueMessage = (flag) => `${flag} requires a value, as in ${flag} <value> or ${flag}=<value>.`;
		validateCliOutputControls = ({ filterOutput, format, missingValue, invalidValue, tokenWindow }) => {
			if (invalidValue !== undefined) return {
				ok: false,
				format: format === "yaml" || format === "jsonl" ? format : "json",
				code: "INVALID_OUTPUT_VALUE",
				message: invalidValue
			};
			if (filterOutput !== undefined && hasUnclosedFilterSlice(filterOutput)) return {
				ok: false,
				format: format === "yaml" || format === "jsonl" ? format : "json",
				code: "INVALID_OUTPUT_FILTER",
				message: "The --filter-output expression has a slice without a closing ]. Close the slice or remove --filter-output."
			};
			if (tokenWindow && (format === "json" || format === "jsonl" || format === "yaml")) return {
				ok: false,
				format,
				code: "UNSUPPORTED_OUTPUT_COMBINATION",
				message: UNSUPPORTED_OUTPUT_COMBINATION_MESSAGE
			};
			if (missingValue !== undefined) return {
				ok: false,
				format: format === "yaml" || format === "jsonl" ? format : "json",
				code: "MISSING_OUTPUT_VALUE",
				message: missingCliOutputValueMessage(missingValue)
			};
			return { ok: true };
		};
		renderEmptyFilteredCliOutput = ({ filterOutput, format, validation }) => {
			if (!validation.ok) return undefined;
			if (filterOutput && (format === "json" || format === "jsonl" || format === "yaml")) return "{}\n";
			return undefined;
		};
		renderCliOutputArgumentError = (error) => {
			const value = {
				ok: false,
				error: {
					code: error.code,
					message: error.message
				}
			};
			if (error.format === "yaml") return `ok: false\nerror:\n  code: ${error.code}\n  message: ${JSON.stringify(error.message)}\n`;
			return `${JSON.stringify(error.format === "jsonl" ? jsonLinesErrorRecord(value) : value)}\n`;
		};
		renderVersionReport = ({ versionReportFormat: format }, host, stdoutIsTerminal) => {
			return format === undefined ? undefined : renderCliDocument(versionReport(host), format, stdoutIsTerminal);
		};
	})))();
}

//#endregion
export { CLI_OUTPUT_FORMATS, SUPPORTED_NODE_VERSION_PROSE, blocksProcessStart, cliConfigurationError, cliOutputValueRejection, init_cliConfiguration, init_cliOutput, init_explicitSensitiveValues, init_processStart, init_runtimeVersion, javaScriptRuntime, missingCliOutputValueMessage, parseCliOutputArguments, parseLogLevel, processStartConfigurationSchema, redactExplicitText, renderCliDocument, renderCliOutputArgumentError, renderEmptyFilteredCliOutput, renderVersionReport, supportsJavaScriptRuntime, supportsNodeVersion };