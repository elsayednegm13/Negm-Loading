import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisError, AnalysisResourceConstraintError, formatCliOutput, init_analysisErrorBase, init_analysisErrorCore, init_cliOutputFormatter, init_jsonLines, init_jsonOutput, isTerminalOutput, jsonLineParts, jsonLinesErrorRecord, jsonLinesParts, jsonLinesRecords, jsonOutputParts, prepareJsonLines, writeJsonOutput, writeOutputParts, writeOutputText } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { analysisCliErrorEnvelopeSchema, analysisErrorProjectionSchema, init_errorSchemas } from "./errorSchemas-DLqBwcTu.js";
import { Cli, Filter } from "incur";
import { constants } from "node:buffer";
import { estimateTokenCount } from "tokenx";

//#region dist/cliLogging.js
var isRecord, loggedFailures, canonicalFailure, projectCliOperationFailure, inferCliOperationFailure, cliOperationFailurePayload, isCliOperationFailure, cliOperationFailureIdentity, logCliCommand;
function init_cliLogging() {
	return (init_cliLogging = __esmMin((() => {
		init_errorSchemas();
		init_analysisErrorBase();
		init_analysisErrorProjection();
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		loggedFailures = new WeakMap();
		canonicalFailure = (projection) => ({
			payload: projection,
			identity: {
				code: projection.code,
				category: projection.category,
				retryable: projection.retryable
			}
		});
		projectCliOperationFailure = (value) => {
			if (!isRecord(value)) return undefined;
			const direct = analysisErrorProjectionSchema.safeParse(value);
			if (direct.success) return value;
			const envelope = analysisCliErrorEnvelopeSchema.safeParse(value);
			if (envelope.success) {
				const { error: _label, input_path: inputPath, input_reason: inputReason, ...projection } = value;
				const parsed = projection;
				if (typeof inputPath !== "string" && typeof inputReason !== "string") return parsed;
				return {
					...parsed,
					details: {
						...parsed.details,
						...typeof inputPath === "string" ? { input_path: inputPath } : {},
						...typeof inputReason === "string" ? { input_reason: inputReason } : {}
					}
				};
			}
			if (isRecord(value.error)) {
				const nested = analysisErrorProjectionSchema.safeParse(value.error);
				if (nested.success) return value.error;
			}
			return undefined;
		};
		inferCliOperationFailure = (value) => {
			const projection = projectCliOperationFailure(value);
			if (projection !== undefined) return canonicalFailure(projection);
			if (isRecord(value) && value.healthy === false) return { payload: value };
			return undefined;
		};
		cliOperationFailurePayload = (value) => {
			if (isRecord(value) && loggedFailures.has(value)) return loggedFailures.get(value)?.payload;
			const failure = inferCliOperationFailure(value);
			if (failure !== undefined && isRecord(value)) loggedFailures.set(value, failure);
			return failure?.payload;
		};
		isCliOperationFailure = (value) => cliOperationFailurePayload(value) !== undefined;
		cliOperationFailureIdentity = (value) => isRecord(value) ? loggedFailures.get(value)?.identity : undefined;
		logCliCommand = async (logger, command, execute, isCommandFailure) => {
			const startedAt = performance.now();
			try {
				const value = await execute();
				const inferredFailure = inferCliOperationFailure(value);
				const failed = isCommandFailure?.(value) ?? inferredFailure !== undefined;
				if (isRecord(value)) loggedFailures.set(value, failed ? inferredFailure ?? { payload: value } : undefined);
				logger[failed ? "error" : "info"]({
					command,
					durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
					status: failed ? "error" : "ok"
				}, failed ? "CLI command failed" : "CLI command completed");
				if (failed) process.exitCode = 1;
				return value;
			} catch (cause) {
				process.exitCode = 1;
				logger.error({
					command,
					durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
					status: "error"
				}, "CLI command failed");
				if (cause instanceof AnalysisError) {
					process.exitCode = 1;
					const projection = projectAnalysisError(cause);
					loggedFailures.set(projection, canonicalFailure(projection));
					return projection;
				}
				throw cause;
			}
		};
	})))();
}

//#endregion
//#region dist/cli/visitRegisteredCommands.js
var registeredCommands, visitRegisteredCommands, visitCommands;
function init_visitRegisteredCommands() {
	return (init_visitRegisteredCommands = __esmMin((() => {
		registeredCommands = Cli.toCommands;
		visitRegisteredCommands = (cli, visit) => {
			const commands = registeredCommands.get(cli);
			if (commands !== undefined) visitCommands(commands, [], undefined, visit);
		};
		visitCommands = (commands, parents, inheritedPolicy, visit) => {
			for (const [name, entry] of commands) {
				const path = [...parents, name];
				if ("_group" in entry) {
					const policy = entry.outputPolicy ?? inheritedPolicy;
					visitCommands(entry.commands, path, policy, visit);
					if (entry.root !== undefined) visit(entry.root, path.join(" "), entry.root.outputPolicy ?? policy);
				} else if (!("_alias" in entry) && !("_fetch" in entry)) {
					visit(entry, path.join(" "), entry.outputPolicy ?? inheritedPolicy);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/cli/tokenWindow.js
var TOKEN_SPLIT_PATTERN, codePointSafeBoundary, segmentBoundary, sliceTextByTokenWindow;
function init_tokenWindow() {
	return (init_tokenWindow = __esmMin((() => {
		TOKEN_SPLIT_PATTERN = /(\s+|[.,!?;(){}[\]<>:/\\|@#$%^&*+=`~_-]+)/;
		codePointSafeBoundary = (text, offset) => offset > 0 && offset < text.length && text.charCodeAt(offset - 1) >= 55296 && text.charCodeAt(offset - 1) <= 56319 && text.charCodeAt(offset) >= 56320 && text.charCodeAt(offset) <= 57343 ? offset - 1 : offset;
		segmentBoundary = (segment, tokenOffset, tokenCount) => codePointSafeBoundary(segment, Math.floor(tokenOffset / tokenCount * segment.length));
		sliceTextByTokenWindow = (text, offset, limit) => {
			const total = estimateTokenCount(text);
			const end = limit === undefined ? total : offset + limit;
			if (offset === 0 && end >= total) return {
				text,
				total,
				start: 0,
				end: total,
				truncated: false
			};
			const actualEnd = Math.min(end, total);
			if (offset >= actualEnd) return {
				text: "",
				total,
				start: actualEnd,
				end: actualEnd,
				truncated: true
			};
			const parts = [];
			let tokenPosition = 0;
			for (const segment of text.split(TOKEN_SPLIT_PATTERN).filter(Boolean)) {
				if (tokenPosition >= actualEnd && actualEnd < total) break;
				const tokenCount = estimateTokenCount(segment);
				if (tokenCount === 0) {
					if (tokenPosition >= offset && (tokenPosition < actualEnd || actualEnd === total)) parts.push(segment);
					continue;
				}
				const segmentEnd = tokenPosition + tokenCount;
				if (tokenPosition < actualEnd && segmentEnd > offset) {
					const localStart = Math.max(0, offset - tokenPosition);
					const localEnd = Math.min(tokenCount, actualEnd - tokenPosition);
					const charStart = segmentBoundary(segment, localStart, tokenCount);
					const charEnd = segmentBoundary(segment, localEnd, tokenCount);
					parts.push(segment.slice(charStart, charEnd));
				}
				tokenPosition = segmentEnd;
			}
			return {
				text: parts.join(""),
				total,
				start: offset,
				end: actualEnd,
				truncated: true
			};
		};
	})))();
}

//#endregion
//#region dist/cli/jsonLinesOutput.js
var writeCliJsonLines;
function init_jsonLinesOutput() {
	return (init_jsonLinesOutput = __esmMin((() => {
		init_analysisErrorCore();
		init_analysisErrorProjection();
		init_jsonLines();
		init_jsonOutput();
		writeCliJsonLines = async (options, destination) => {
			const { source, selected, operationFailure } = options;
			let error;
			const meta = {
				command: options.command,
				duration: options.duration
			};
			const envelope = (data) => options.fullOutput ? {
				ok: true,
				data,
				meta
			} : data;
			let failureRecord = operationFailure === undefined ? undefined : jsonLinesErrorRecord(options.fullOutput ? {
				ok: false,
				error: operationFailure,
				meta
			} : operationFailure);
			const plan = failureRecord === undefined ? prepareJsonLines(envelope(selected), {
				command: options.command,
				source: envelope(source),
				...options.filterOutput === undefined ? {} : { filter: options.filterOutput },
				fullOutput: options.fullOutput
			}) : undefined;
			if (plan?.ok === false) {
				error = projectAnalysisError(plan.error);
				failureRecord = jsonLinesErrorRecord(options.fullOutput ? {
					ok: false,
					error,
					meta
				} : error);
			}
			if (failureRecord !== undefined) {
				await writeJsonOutput(failureRecord, destination, "jsonl");
			} else if (plan?.ok === true) {
				if (options.tokenCount) {
					let count = 0;
					for (const record of jsonLinesRecords(plan.value)) {
						let characters = 0;
						for (const part of jsonLineParts(record)) characters += part.length;
						if (characters > constants.MAX_STRING_LENGTH) {
							error = projectAnalysisError(new AnalysisResourceConstraintError(options.command, "memory", "A JSON Lines record exceeds the token estimator's runtime string limit.", {
								formatted_characters: characters,
								max_string_characters: constants.MAX_STRING_LENGTH
							}, { remediationAction: "Remove --token-count to stream the records, or select smaller fields with --filter-output." }));
							break;
						}
						count += estimateTokenCount([...jsonLineParts(record)].join(""));
					}
					if (error !== undefined) await writeJsonOutput(jsonLinesErrorRecord(options.fullOutput ? {
						ok: false,
						error,
						meta
					} : error), destination, "jsonl");
					else await writeOutputText(destination, `${count}\n`);
				} else await writeOutputParts(destination, jsonLinesParts(plan.value));
			}
			return error;
		};
	})))();
}

//#endregion
//#region dist/cli/cliResultOutput.js
var streamCliCommandResults, wrapCommand, createCliResultOutput, fullFailureEnvelope, applyCliOutputFilter, projectObjectPaths, projectArraySlices, normalizeSliceIndex, normalizeJsonArrayValues;
function init_cliResultOutput() {
	return (init_cliResultOutput = __esmMin((() => {
		init_cliLogging();
		init_analysisErrorCore();
		init_tokenWindow();
		init_analysisErrorProjection();
		init_cliOutputFormatter();
		init_jsonLines();
		init_jsonLinesOutput();
		init_jsonOutput();
		init_visitRegisteredCommands();
		streamCliCommandResults = (cli, output) => {
			visitRegisteredCommands(cli, (command, path, inheritedPolicy) => wrapCommand(command, path, output, inheritedPolicy));
		};
		wrapCommand = (command, name, output, inheritedPolicy) => {
			const run = command.run;
			command.run = (context) => {
				const started = performance.now();
				const result = run(context);
				if (typeof result === "object" && result !== null && Symbol.asyncIterator in result) {
					output.delegateStreaming();
					return result;
				}
				return Promise.resolve(result).then(async (value) => {
					if (typeof value === "object" && value !== null && Symbol.for("incur.sentinel") in value) return value;
					if (!await output.write(value, {
						command: name,
						format: context.format,
						renderOutput: context.agent || inheritedPolicy !== "agent-only",
						duration: `${Math.round(performance.now() - started)}ms`
					})) return value;
					if (output.error !== undefined) return context.error({
						code: output.error.code,
						message: output.error.message
					});
					return undefined;
				});
			};
		};
		createCliResultOutput = (initialOptions, destination) => {
			let options = initialOptions;
			if (!options.validation.ok) return undefined;
			let format = options.format;
			let handled = false;
			let failed = false;
			let error;
			let streaming = false;
			const sdkParts = [];
			let sdkCompletion;
			let completed;
			const recoverFormattingFailure = async (cause) => {
				if (completed === undefined || handled || !(cause instanceof RangeError) || cause.message !== "Invalid string length") return false;
				const { originalFailure } = completed;
				error = projectAnalysisError(new AnalysisResourceConstraintError(completed.metadata.command, "memory", `The ${format} result could not fit in a runtime string. The original result was not written.`, {
					format,
					formatted_characters: null,
					max_string_characters: constants.MAX_STRING_LENGTH,
					...originalFailure === undefined ? {} : { original_failure: originalFailure }
				}, {
					cause,
					retryable: false,
					remediationAction: "Use --format json to stream the complete result, or narrow it with --filter-output. Token limits are applied after formatting and cannot avoid this constraint."
				}));
				const document = options.fullOutput ? {
					ok: false,
					error,
					meta: {
						command: completed.metadata.command,
						duration: completed.metadata.duration
					}
				} : error;
				const text = formatCliOutput(format === "jsonl" ? jsonLinesErrorRecord(document) : document, format);
				handled = true;
				try {
					await writeOutputText(destination, `${text}\n`);
				} catch (writeFailure) {
					failed = true;
					throw writeFailure;
				}
				return true;
			};
			const write = async (value, metadata) => {
				completed = undefined;
				if (metadata.format !== format) return false;
				try {
					return await writeResult(value, metadata);
				} catch (cause) {
					if (await recoverFormattingFailure(cause)) return true;
					throw cause;
				}
			};
			return {
				get handled() {
					return handled;
				},
				get failed() {
					return failed;
				},
				get error() {
					return error;
				},
				begin(nextOptions) {
					options = nextOptions;
					format = options.format;
					handled = false;
					failed = false;
					error = undefined;
					completed = undefined;
					streaming = false;
					sdkParts.length = 0;
					sdkCompletion = undefined;
				},
				delegateStreaming() {
					streaming = true;
				},
				captureSdkOutput(text) {
					if (format !== "jsonl" || streaming || handled) return false;
					if (text.length > 0) sdkParts.push(text);
					return true;
				},
				finishSdkOutput(exitCode) {
					return sdkCompletion ??= (async () => {
						const parts = sdkParts.splice(0);
						try {
							if (parts.length === 0) {
								await writeOutputText(destination, "");
								return;
							}
							if (exitCode === 0) {
								for (const part of parts) await writeOutputText(destination, part);
							} else {
								const text = parts.join("");
								let result = text;
								try {
									result = JSON.parse(text);
								} catch {}
								await writeJsonOutput(jsonLinesErrorRecord(result), destination, "jsonl");
							}
						} catch (cause) {
							handled = true;
							failed = true;
							throw cause;
						}
					})();
				},
				write,
				recoverFormattingFailure
			};
			async function writeResult(value, metadata) {
				completed = {
					metadata,
					originalFailure: cliOperationFailureIdentity(value)
				};
				const filterPaths = options.filterOutput ? Filter.parse(options.filterOutput) : undefined;
				const operationFailure = format === "jsonl" || options.fullOutput || filterPaths !== undefined ? cliOperationFailurePayload(value) : undefined;
				const failure = options.fullOutput ? operationFailure : undefined;
				const ownsFilteredOutput = operationFailure === undefined && filterPaths !== undefined && filterPaths.length > 0;
				if (operationFailure === undefined && metadata.renderOutput === false && format !== "jsonl" && !options.fullOutput && !options.tokenCount) return false;
				const selected = operationFailure ?? (filterPaths === undefined ? value : applyCliOutputFilter(value, filterPaths));
				const filtered = (format === "json" || format === "jsonl") && ownsFilteredOutput && Array.isArray(selected) ? normalizeJsonArrayValues(selected) : selected;
				const ownsSuccessfulTokenWindow = operationFailure === undefined && options.tokenWindow && !options.tokenCount && format !== "json" && format !== "jsonl";
				if (format !== "md" && format !== "json" && format !== "jsonl" && operationFailure === undefined && !ownsFilteredOutput && !ownsSuccessfulTokenWindow) return false;
				if (format === "jsonl") {
					handled = true;
					try {
						error = await writeCliJsonLines({
							...options,
							source: value,
							selected: filtered,
							operationFailure,
							command: metadata.command,
							duration: metadata.duration
						}, destination);
					} catch (cause) {
						failed = true;
						throw cause;
					}
					return true;
				}
				const meta = {
					command: metadata.command,
					duration: metadata.duration
				};
				const errorDocument = options.fullOutput && failure !== undefined ? fullFailureEnvelope(failure, meta, format, options.tokenLimit, options.tokenOffset) : undefined;
				const document = options.fullOutput ? failure !== undefined ? errorDocument : filtered === undefined ? {
					ok: true,
					meta
				} : {
					ok: true,
					data: filtered,
					meta
				} : filtered === undefined || typeof filtered === "function" || typeof filtered === "symbol" ? {} : filtered;
				if (options.tokenCount) {
					const tokenValue = document;
					let characters = 0;
					if (tokenValue !== undefined && tokenValue !== null && typeof tokenValue !== "function" && typeof tokenValue !== "symbol") {
						if (format === "json") {
							for (const part of jsonOutputParts(tokenValue, format, isTerminalOutput(destination))) characters += part.length;
						}
					}
					if (characters <= constants.MAX_STRING_LENGTH) {
						let formatted;
						if (format === "json") {
							formatted = "";
							for (const part of jsonOutputParts(tokenValue, format, isTerminalOutput(destination))) formatted += part;
						} else formatted = formatCliOutput(tokenValue, format);
						const count = estimateTokenCount(formatted);
						handled = true;
						try {
							await writeOutputText(destination, `${count}\n`);
							return true;
						} catch (cause) {
							failed = true;
							throw cause;
						}
					}
					error = projectAnalysisError(new AnalysisResourceConstraintError(metadata.command, "memory", "Token counting requires a formatted string larger than the runtime permits.", {
						formatted_characters: characters,
						max_string_characters: constants.MAX_STRING_LENGTH
					}, { remediationAction: "Remove --token-count to stream the complete JSON result, or narrow it with --filter-output." }));
				}
				if (ownsSuccessfulTokenWindow) {
					const formatted = formatCliOutput(filtered, format);
					const window = sliceTextByTokenWindow(formatted, options.tokenOffset ?? 0, options.tokenLimit);
					if (!window.truncated && !options.fullOutput && formatted === "") return false;
					const sliced = window.truncated ? `${window.text}\n[truncated: showing tokens ${window.start}–${window.end} of ${window.total}]` : formatted;
					const outputDocument = options.fullOutput ? formatCliOutput(window.truncated ? {
						ok: true,
						data: sliced,
						meta: {
							command: metadata.command,
							duration: metadata.duration,
							...window.end < window.total ? { nextOffset: window.end } : {}
						}
					} : {
						ok: true,
						data: filtered,
						meta
					}, format) : sliced;
					handled = true;
					try {
						await writeOutputText(destination, outputDocument.endsWith("\n") ? outputDocument : `${outputDocument}\n`);
					} catch (cause) {
						failed = true;
						throw cause;
					}
					return true;
				}
				const formattedText = format === "md" || (operationFailure !== undefined || ownsFilteredOutput) && format !== "json" ? formatCliOutput(document, format) : undefined;
				if (format === "md" && formattedText === "" && !options.fullOutput && !ownsFilteredOutput && operationFailure === undefined) return false;
				handled = true;
				try {
					if (formattedText !== undefined) {
						await writeOutputText(destination, `${formattedText}\n`);
					} else {
						await writeJsonOutput(error === undefined ? document : options.fullOutput ? {
							ok: false,
							error,
							meta
						} : error, destination, format);
					}
				} catch (cause) {
					failed = true;
					throw cause;
				}
				return true;
			}
		};
		fullFailureEnvelope = (failure, meta, format, tokenLimit, tokenOffset) => {
			if (tokenLimit === undefined && tokenOffset === undefined) return {
				ok: false,
				error: failure,
				meta
			};
			const formatted = formatCliOutput(failure, format);
			const offset = tokenOffset ?? 0;
			const window = sliceTextByTokenWindow(formatted, offset, tokenLimit);
			if (!window.truncated) return {
				ok: false,
				error: failure,
				meta
			};
			const nextOffset = window.end < window.total ? window.end : undefined;
			return {
				ok: false,
				error: `${window.text}\n[truncated: showing tokens ${window.start}–${window.end} of ${window.total}]`,
				meta: {
					...meta,
					...nextOffset === undefined ? {} : { nextOffset }
				}
			};
		};
		applyCliOutputFilter = (value, paths) => {
			if (paths.length === 0) return value;
			if (Array.isArray(value)) return value.map((item) => applyCliOutputFilter(item, paths));
			if (paths.length === 1 && paths[0]?.length === 1 && paths[0][0] !== undefined && "key" in paths[0][0]) {
				const key = paths[0][0].key;
				if (typeof value !== "object" || value === null || !Object.hasOwn(value, key)) return undefined;
				const selected = value[key];
				return typeof selected !== "object" || selected === null ? selected : { [key]: selected };
			}
			return projectObjectPaths(value, paths);
		};
		projectObjectPaths = (value, paths) => {
			if (typeof value !== "object" || value === null) return {};
			const byKey = new Map();
			for (const path of paths) {
				const [segment, ...tail] = path;
				if (segment === undefined || !("key" in segment)) continue;
				const siblings = byKey.get(segment.key) ?? [];
				siblings.push(tail);
				byKey.set(segment.key, siblings);
			}
			const result = new Map();
			for (const key of [...byKey.keys()].sort()) {
				const siblings = byKey.get(key);
				if (!Object.hasOwn(value, key)) continue;
				const child = value[key];
				if (child === undefined) continue;
				if (siblings.some((path) => path.length === 0)) {
					result.set(key, child);
					continue;
				}
				const slicePaths = siblings.filter((path) => path[0] !== undefined && "start" in path[0]);
				if (slicePaths.length > 0 && Array.isArray(child)) {
					result.set(key, projectArraySlices(child, slicePaths));
					continue;
				}
				const objectPaths = siblings.filter((path) => path[0] !== undefined && "key" in path[0]);
				if (objectPaths.length > 0 && typeof child === "object" && child !== null) result.set(key, projectObjectPaths(child, objectPaths));
			}
			return Object.fromEntries(result);
		};
		projectArraySlices = (source, paths) => {
			const selected = new Map();
			for (const path of paths) {
				const [slice, ...tail] = path;
				if (slice === undefined || !("start" in slice)) continue;
				const start = normalizeSliceIndex(slice.start, source.length);
				const end = normalizeSliceIndex(slice.end, source.length);
				for (let index = start; index < end; index += 1) {
					const siblings = selected.get(index) ?? [];
					siblings.push(tail);
					selected.set(index, siblings);
				}
			}
			return [...selected.keys()].sort((left, right) => left - right).map((index) => {
				const siblings = selected.get(index);
				const item = source[index];
				if (siblings.some((path) => path.length === 0)) return item;
				return projectObjectPaths(item, siblings);
			});
		};
		normalizeSliceIndex = (index, length) => {
			const integer = Number.isNaN(index) ? 0 : Math.trunc(index);
			return integer < 0 ? Math.max(length + integer, 0) : Math.min(integer, length);
		};
		normalizeJsonArrayValues = (source) => {
			let result;
			for (let index = 0; index < source.length; index += 1) {
				const value = source[index];
				const normalized = value === undefined || typeof value === "function" || typeof value === "symbol" ? null : Array.isArray(value) ? normalizeJsonArrayValues(value) : value;
				if (normalized !== value) {
					result ??= source.slice();
					result[index] = normalized;
				}
			}
			return result ?? source;
		};
	})))();
}

//#endregion
export { createCliResultOutput, init_cliLogging, init_cliResultOutput, init_visitRegisteredCommands, isCliOperationFailure, logCliCommand, streamCliCommandResults, visitRegisteredCommands };