import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_safeJson, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisInputError, AnalysisResourceConstraintError, EvidenceFileError, err, freezeOwnedJsonSnapshotSteps, init_analysisErrorBase, init_analysisErrorCore, init_evidenceErrors, init_immutableJson, init_jsonValue, init_result, jsonValueValidationSteps, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { ArtifactReaderFailure, NonRegularFileReadError, OwnedFileHandle, RegularFileChangedError, RegularFileCleanupFailure, assertRegularFileActive, init_ArtifactReader, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, regularFileCancellation } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { RegularFileReadFailure, bindRegularFileCleanup, init_RegularFileRead, withRegularFile } from "./RegularFileRead-4snB6-IE.js";
import { bindArtifactFileCleanup, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { OwnedStagedOutput, init_OwnedStagedOutput } from "./OwnedStagedOutput-FV1aUtCU.js";
import { createHash } from "node:crypto";
import { basename, dirname, resolve } from "node:path";
import { setImmediate } from "node:timers/promises";
import { getHeapStatistics } from "node:v8";
import { link, lstat, mkdtemp, open, realpath, rename } from "node:fs/promises";
import { constants } from "node:buffer";
import { pipeline } from "node:stream/promises";
import { asStream, flushable, getFunctionList, isFlushable, isFunctionList, none } from "stream-chain";
import fun from "stream-chain/fun.js";
import parser from "stream-json/parser.js";
import streamValues from "stream-json/streamers/stream-values.js";
import streamArray from "stream-json/streamers/stream-array.js";

//#region dist/application/OwnedJsonInput.js
var finish, sealOwnedJsonInput;
function init_OwnedJsonInput() {
	return (init_OwnedJsonInput = __esmMin((() => {
		init_analysisErrorCore();
		init_immutableJson();
		init_jsonValue();
		init_result();
		finish = async (steps, signal) => {
			let completed = false;
			try {
				for (;;) {
					signal?.throwIfAborted();
					const step = steps.next();
					if (step.done) {
						completed = true;
						return step.value;
					}
					await setImmediate(undefined, signal === undefined ? {} : { signal });
				}
			} finally {
				if (!completed) steps.return(undefined);
			}
		};
		sealOwnedJsonInput = async (value, operation, signal) => {
			const issue = await finish(jsonValueValidationSteps(value), signal);
			if (issue !== undefined) return err(new AnalysisInputError(operation, { userMessage: issue }, [{
				path: [],
				reason: "invalid_value",
				expected: "bounded JSON-safe input",
				message: issue
			}]));
			return ok(await finish(freezeOwnedJsonSnapshotSteps(value), signal));
		};
	})))();
}

//#endregion
//#region dist/application/Utf8JsonInput.js
var JSON_INPUT_RESOURCE_REMEDIATION, JSON_BYTE_ORDER_MARK_MESSAGE, parseUtf8Json;
function init_Utf8JsonInput() {
	return (init_Utf8JsonInput = __esmMin((() => {
		init_analysisErrorCore();
		init_safeJson();
		JSON_INPUT_RESOURCE_REMEDIATION = "Provide a smaller valid JSON value. For Evidence workflows, re-analyze a smaller selection of the original target and use its complete Evidence; splitting JSON text or trimming Evidence fields does not produce valid workflow input.";
		JSON_BYTE_ORDER_MARK_MESSAGE = "JSON input begins with a UTF-8 byte-order mark (EF BB BF), which strict JSON input does not accept. Save the file as UTF-8 without a byte-order mark.";
		parseUtf8Json = (bytes, operation, path, boundary = "json-input") => {
			const stringLimitFailure = (cause, decodedUnits) => new AnalysisResourceConstraintError(operation, "memory", "JSON input exceeds the runtime's maximum decoded string length", {
				boundary,
				input_path: path,
				input_bytes: bytes.byteLength,
				max_string_code_units: constants.MAX_STRING_LENGTH,
				...decodedUnits === undefined ? {} : { decoded_string_code_units_at_least: decodedUnits }
			}, {
				...cause === undefined ? {} : { cause },
				remediationAction: JSON_INPUT_RESOURCE_REMEDIATION
			});
			let text;
			try {
				const decoder = new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				});
				if (bytes.byteLength <= constants.MAX_STRING_LENGTH) {
					text = decoder.decode(bytes);
				} else {
					const parts = [];
					let decodedUnits = 0;
					const append = (part) => {
						decodedUnits += part.length;
						if (decodedUnits > constants.MAX_STRING_LENGTH) throw stringLimitFailure(undefined, decodedUnits);
						parts.push(part);
					};
					const chunkBytes = 1024 * 1024;
					for (let offset = 0; offset < bytes.byteLength; offset += chunkBytes) append(decoder.decode(bytes.subarray(offset, offset + chunkBytes), { stream: true }));
					append(decoder.decode());
					text = parts.join("");
				}
			} catch (cause) {
				if (cause instanceof AnalysisResourceConstraintError) throw cause;
				const code = typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
				if (code === "ERR_STRING_TOO_LONG") throw stringLimitFailure(cause);
				if (code !== "ERR_ENCODING_INVALID_ENCODED_DATA") throw cause;
				return {
					ok: false,
					error: "JSON input is not valid UTF-8",
					userMessage: "JSON input is not valid UTF-8",
					cause
				};
			}
			if (text.startsWith("﻿")) return {
				ok: false,
				error: JSON_BYTE_ORDER_MARK_MESSAGE,
				cause: undefined,
				userMessage: JSON_BYTE_ORDER_MARK_MESSAGE
			};
			return safeParseJson(text);
		};
	})))();
}

//#endregion
//#region dist/application/JsonInputFile.js
async function* decodedChunks(handle, admittedBytes, path, operation, signal, observe, physicalRead = {}) {
	const decoder = new TextDecoder("utf-8", {
		fatal: true,
		ignoreBOM: true
	});
	let leading = true;
	const checked = (text) => {
		if (leading && text.length > 0) {
			leading = false;
			if (text.startsWith("﻿")) throw invalidJson(operation, JSON_BYTE_ORDER_MARK_MESSAGE, { userMessage: JSON_BYTE_ORDER_MARK_MESSAGE });
		}
		return text;
	};
	const decode = (bytes, options) => {
		try {
			return decoder.decode(bytes, options);
		} catch (cause) {
			if (cause instanceof TypeError && "code" in cause && cause.code === "ERR_ENCODING_INVALID_ENCODED_DATA") throw invalidJson(operation, "JSON input is not valid UTF-8", { cause });
			throw cause;
		}
	};
	const bytes = Buffer.allocUnsafe(READ_CHUNK_BYTES);
	let observedBytes = 0;
	while (true) {
		assertRegularFileActive(signal);
		const read = await readPhysicalJsonInput(physicalRead, () => handle.read(bytes, 0, Math.min(bytes.length, admittedBytes - observedBytes + 1), observedBytes));
		assertRegularFileActive(signal);
		if (read.bytesRead === 0) break;
		observedBytes += read.bytesRead;
		if (observedBytes > admittedBytes) throw new RegularFileChangedError(path);
		const chunk = bytes.subarray(0, read.bytesRead);
		observe?.(chunk);
		yield checked(decode(chunk, { stream: true }));
	}
	if (observedBytes !== admittedBytes) throw new RegularFileChangedError(path);
	yield checked(decode());
}
var READ_CHUNK_BYTES, PACKED_TOKEN_PART_CODE_UNITS, NATIVE_PARSE_READ_BUDGET, JsonInputPhysicalReadFailure, JsonInputCancellationFailure, readPhysicalJsonInput, withJsonInputFile, withJsonInputPipeline, nativeJsonParseRequiredBytes, nativeParseFits, readJsonObjectFile, memberConsumer, readJsonInputFile, jsonTokenizers, jsonReadFailure, packJsonScalars, admitJsonAssembly, requireStringAssemblyHeadroom, readPrefix, readNativeJson, invalidJson;
function init_JsonInputFile() {
	return (init_JsonInputFile = __esmMin((() => {
		init_RegularFile();
		init_OwnedJsonInput();
		init_RegularFileRead();
		init_Utf8JsonInput();
		init_analysisErrorCore();
		init_result();
		READ_CHUNK_BYTES = 64 * 1024;
		PACKED_TOKEN_PART_CODE_UNITS = 64 * 1024;
		NATIVE_PARSE_READ_BUDGET = 8 * 1024 * 1024;
		JsonInputPhysicalReadFailure = class extends Error {
			_tag = "JsonInputPhysicalReadFailure";
			physicalCause;
			constructor(physicalCause) {
				super("JSON input descriptor read failed");
				this.physicalCause = physicalCause;
			}
		};
		JsonInputCancellationFailure = class extends Error {
			reason;
			_tag = "JsonInputCancellationFailure";
			constructor(reason) {
				super(reason instanceof Error ? reason.message : "JSON input read cancelled");
				this.reason = reason;
			}
		};
		readPhysicalJsonInput = async (observation, read) => {
			try {
				return await read();
			} catch (physicalCause) {
				const failure = new JsonInputPhysicalReadFailure(physicalCause);
				observation.failure = failure;
				throw failure;
			}
		};
		withJsonInputFile = (path, read, options) => withRegularFile(path, read, {
			...options,
			cancellationFailure: (reason) => new JsonInputCancellationFailure(reason)
		}).catch((cause) => {
			if (cause instanceof RegularFileReadFailure) throw cause.operationCause;
			throw cause;
		});
		withJsonInputPipeline = async (signal, run) => {
			if (signal === undefined) return run();
			const controller = new AbortController();
			const cancel = () => {
				controller.abort(new JsonInputCancellationFailure(signal.reason));
			};
			if (signal.aborted) cancel();
			else signal.addEventListener("abort", cancel, { once: true });
			try {
				return await run(controller.signal);
			} finally {
				signal.removeEventListener("abort", cancel);
			}
		};
		nativeJsonParseRequiredBytes = (inputBytes, snapshot = false) => (inputBytes * 72 + READ_CHUNK_BYTES) * (snapshot ? 2 : 1);
		nativeParseFits = (inputBytes, snapshot = false) => inputBytes <= NATIVE_PARSE_READ_BUDGET && nativeJsonParseRequiredBytes(inputBytes, snapshot) <= getHeapStatistics().total_available_size;
		readJsonObjectFile = (path, operation, scans, signal, resources) => withJsonInputFile(path, async (handle, stats) => {
			let previousDigest;
			const physicalRead = {};
			try {
				const native = await readNativeJson(handle, stats.size, path, operation, signal, false, physicalRead);
				if (native !== undefined) {
					if (!native.ok) return native;
					const value = native.value;
					if (typeof value !== "object" || value === null || Array.isArray(value)) return err(invalidJson(operation, "JSON document root must be an object"));
					for (const members of scans) for (const [key, member] of members) {
						if (!Object.hasOwn(value, key)) continue;
						assertRegularFileActive(signal);
						member.begin();
						const selected = Reflect.get(value, key);
						if (member.mode === "array" && !Array.isArray(selected)) {
							member.reject(new TypeError(`JSON member ${key} must be an array`));
							continue;
						}
						for (const item of member.mode === "array" && Array.isArray(selected) ? selected : [selected]) {
							assertRegularFileActive(signal);
							try {
								await member.accept(item);
							} catch (cause) {
								member.reject(cause);
							}
						}
					}
					return ok(undefined);
				}
				for (const members of scans) {
					const hash = createHash("sha256");
					let rootObject = false;
					let depth = 0;
					let key;
					let consume;
					await withJsonInputPipeline(signal, (pipelineSignal) => pipeline(decodedChunks(handle, stats.size, path, operation, signal, (bytes) => {
						hash.update(bytes);
					}, physicalRead), asStream(fun(jsonTokenizers(operation, stats.size, path), packJsonScalars(operation, stats.size, path), (token) => {
						const opens = token.name === "startObject" || token.name === "startArray";
						const closes = token.name === "endObject" || token.name === "endArray";
						if (depth === 0) {
							rootObject = token.name === "startObject";
						} else if (rootObject && depth === 1 && token.name === "keyValue") {
							key = token.value;
						} else if (rootObject && depth === 1 && !closes) {
							const member = key === undefined ? undefined : members.get(key);
							consume = undefined;
							if (member !== undefined) {
								member.begin();
								if (member.mode === "array" && token.name !== "startArray") {
									member.reject(new TypeError(`JSON member ${key} must be an array`));
								} else {
									consume = memberConsumer(member, operation, stats.size, path);
								}
							}
							key = undefined;
						}
						const selected = consume;
						if (opens) depth += 1;
						if (closes) depth -= 1;
						if (rootObject && depth === 1 && token.name !== "keyValue") consume = undefined;
						if (selected === undefined) return none;
						return selected(token);
					})), pipelineSignal === undefined ? {} : { signal: pipelineSignal }));
					if (!rootObject) return err(invalidJson(operation, "JSON document root must be an object"));
					const digest = hash.digest("hex");
					if (previousDigest !== undefined && digest !== previousDigest) throw new RegularFileChangedError(path);
					previousDigest = digest;
				}
				return ok(undefined);
			} catch (cause) {
				if (physicalRead.failure !== undefined) throw physicalRead.failure;
				const failure = jsonReadFailure(cause, operation, stats.size, path);
				if (failure !== undefined) return err(failure);
				throw cause;
			}
		}, {
			signal,
			...resources === undefined ? {} : { resources }
		});
		memberConsumer = (member, operation, size, path) => {
			let admit = admitJsonAssembly(operation, size, path);
			const streamer = member.mode === "array" ? streamArray() : streamValues();
			const consume = fun((token) => admit(token), streamer, (row) => {
				if (typeof row !== "object" || row === null || !("value" in row)) throw new Error("Unexpected JSON member parser result");
				admit = admitJsonAssembly(operation, size, path);
				try {
					const accepted = member.accept(row.value);
					if (accepted instanceof Promise) return accepted.then(() => none, (cause) => {
						member.reject(cause);
						return none;
					});
				} catch (cause) {
					member.reject(cause);
				}
				return none;
			});
			return (token) => {
				const consumed = consume(token);
				return consumed instanceof Promise ? consumed.then(() => none) : none;
			};
		};
		readJsonInputFile = (path, operation, signal, resources, snapshot = false) => withJsonInputFile(path, async (handle, stats) => {
			let found = false;
			let value;
			const physicalRead = {};
			try {
				const native = await readNativeJson(handle, stats.size, path, operation, signal, snapshot, physicalRead);
				if (native !== undefined) return native.ok && snapshot ? await sealOwnedJsonInput(native.value, operation, signal) : native;
				await withJsonInputPipeline(signal, (pipelineSignal) => pipeline(decodedChunks(handle, stats.size, path, operation, signal, undefined, physicalRead), asStream(fun(jsonTokenizers(operation, stats.size, path), packJsonScalars(operation, stats.size, path), admitJsonAssembly(operation, stats.size, path, snapshot ? 2 : 1), streamValues(), (row) => {
					if (found || typeof row !== "object" || row === null || !("key" in row) || row.key !== 0 || !("value" in row)) throw new Error("Unexpected JSON parser result");
					found = true;
					value = row.value;
					return none;
				})), pipelineSignal === undefined ? {} : { signal: pipelineSignal }));
				return found ? snapshot ? await sealOwnedJsonInput(value, operation, signal) : ok(value) : err(invalidJson(operation, "JSON document is empty"));
			} catch (cause) {
				if (physicalRead.failure !== undefined) throw physicalRead.failure;
				const failure = jsonReadFailure(cause, operation, stats.size, path);
				if (failure !== undefined) return err(failure);
				throw cause;
			}
		}, {
			signal,
			...resources === undefined ? {} : { resources }
		});
		jsonTokenizers = (operation, size, path) => {
			const tokenizer = parser({
				jsonStreaming: false,
				streamValues: false,
				packKeys: false,
				packStrings: false,
				packNumbers: false
			});
			if (!isFunctionList(tokenizer)) throw new Error("JSON tokenizer does not expose its processor stages");
			return fun(...getFunctionList(tokenizer).map((processor) => {
				const tokenize = (value) => {
					try {
						return processor(value);
					} catch (cause) {
						const failure = jsonReadFailure(cause, operation, size, path);
						if (failure !== undefined) throw failure;
						if (cause instanceof Error && cause.constructor === Error) throw invalidJson(operation, cause.message, { cause });
						throw cause;
					}
				};
				return isFlushable(processor) ? flushable(tokenize) : tokenize;
			}));
		};
		jsonReadFailure = (cause, operation, size, path) => {
			if (cause instanceof AnalysisInputError || cause instanceof AnalysisResourceConstraintError) return cause;
			if (cause instanceof Error && (cause instanceof RangeError && cause.message === "Invalid string length" || "code" in cause && cause.code === "ERR_STRING_TOO_LONG")) return new AnalysisResourceConstraintError(operation, "memory", "An individual JSON string or number token exceeds the runtime string limit", {
				input_path: path,
				input_file_bytes: size,
				max_string_code_units: constants.MAX_STRING_LENGTH
			}, {
				cause,
				remediationAction: JSON_INPUT_RESOURCE_REMEDIATION
			});
			return undefined;
		};
		packJsonScalars = (operation, inputFileBytes, path) => {
			let kind;
			let length = 0;
			let value = "";
			let parts = [];
			let partLength = 0;
			return (token) => {
				if (typeof token !== "object" || token === null || !("name" in token)) throw new Error("Unexpected JSON parser token");
				switch (token.name) {
					case "startKey":
					case "startString":
						kind = token.name === "startKey" ? "keyValue" : "stringValue";
						break;
					case "startNumber":
						kind = "numberValue";
						break;
					case "numberChunk":
					case "stringChunk":
						if (kind === undefined || !("value" in token) || typeof token.value !== "string") throw new Error("Unexpected JSON scalar fragment");
						length += token.value.length;
						if (length > constants.MAX_STRING_LENGTH) throw new RangeError("Invalid string length");
						parts.push(token.value);
						partLength += token.value.length;
						if (partLength >= PACKED_TOKEN_PART_CODE_UNITS) {
							requireStringAssemblyHeadroom(operation, inputFileBytes, path, length);
							value += parts.join("");
							parts = [];
							partLength = 0;
						}
						break;
					case "endKey":
					case "endString":
					case "endNumber": {
						if (kind === undefined) throw new Error("Unexpected JSON scalar end");
						requireStringAssemblyHeadroom(operation, inputFileBytes, path, length);
						const packed = {
							name: kind,
							value: value + parts.join("")
						};
						kind = undefined;
						length = 0;
						value = "";
						parts = [];
						partLength = 0;
						return packed;
					}
					default: return token;
				}
				return none;
			};
		};
		admitJsonAssembly = (operation, inputFileBytes, path, retainedMultiplier = 1) => {
			let projectedBytes = 0;
			let nextCheck = 0;
			return (token) => {
				if (typeof token !== "object" || token === null || !("name" in token)) throw new Error("Unexpected JSON assembly token");
				if (token.name === "startObject" || token.name === "startArray") {
					projectedBytes += 128;
				} else if (token.name === "keyValue" || token.name === "stringValue") {
					if (!("value" in token) || typeof token.value !== "string") throw new Error("Unexpected packed JSON string");
					projectedBytes += 64 + token.value.length * 2;
				} else if (token.name === "numberValue" || token.name === "nullValue" || token.name === "trueValue" || token.name === "falseValue") {
					projectedBytes += 64;
				}
				if (projectedBytes >= nextCheck) {
					const heap = getHeapStatistics();
					const requiredBytes = projectedBytes * retainedMultiplier + READ_CHUNK_BYTES;
					if (requiredBytes > heap.total_available_size) throw new AnalysisResourceConstraintError(operation, "memory", "Insufficient heap headroom to materialize the complete JSON value", {
						input_path: path,
						input_file_bytes: inputFileBytes,
						projected_value_bytes: projectedBytes,
						assembly_headroom_bytes: requiredBytes,
						available_heap_bytes: heap.total_available_size,
						heap_size_limit_bytes: heap.heap_size_limit
					}, { remediationAction: JSON_INPUT_RESOURCE_REMEDIATION });
					nextCheck = projectedBytes + READ_CHUNK_BYTES;
				}
				return token;
			};
		};
		requireStringAssemblyHeadroom = (operation, inputFileBytes, path, stringCodeUnits) => {
			if (stringCodeUnits < PACKED_TOKEN_PART_CODE_UNITS) return;
			const heap = getHeapStatistics();
			const requiredBytes = 2 * (stringCodeUnits + PACKED_TOKEN_PART_CODE_UNITS);
			if (requiredBytes > heap.total_available_size) throw new AnalysisResourceConstraintError(operation, "memory", "Insufficient heap headroom to assemble a complete JSON string", {
				input_path: path,
				input_file_bytes: inputFileBytes,
				string_code_units: stringCodeUnits,
				string_assembly_headroom_bytes: requiredBytes,
				available_heap_bytes: heap.total_available_size,
				heap_size_limit_bytes: heap.heap_size_limit
			}, { remediationAction: JSON_INPUT_RESOURCE_REMEDIATION });
		};
		readPrefix = async (handle, size, signal, physicalRead) => {
			const bytes = Buffer.allocUnsafe(size);
			let offset = 0;
			while (offset < bytes.length) {
				assertRegularFileActive(signal);
				const read = await readPhysicalJsonInput(physicalRead, () => handle.read(bytes, offset, bytes.length - offset, null));
				assertRegularFileActive(signal);
				if (read.bytesRead === 0) return {
					bytes: bytes.subarray(0, offset),
					complete: true
				};
				offset += read.bytesRead;
			}
			return {
				bytes,
				complete: false
			};
		};
		readNativeJson = async (handle, size, path, operation, signal, snapshot = false, physicalRead = {}) => {
			if (!nativeParseFits(size, snapshot)) return undefined;
			const prefix = await readPrefix(handle, size + 1, signal, physicalRead);
			if (!prefix.complete || prefix.bytes.length !== size) throw new RegularFileChangedError(path);
			const parsed = parseUtf8Json(prefix.bytes, operation, path, "json-file-input");
			return parsed.ok ? ok(parsed.value) : err(invalidJson(operation, parsed.error, {
				cause: parsed.cause,
				...parsed.userMessage === undefined ? {} : { userMessage: parsed.userMessage }
			}));
		};
		invalidJson = (operation, message, options) => new AnalysisInputError(operation, options, [{
			path: [],
			reason: "invalid_format",
			expected: "JSON",
			message
		}]);
	})))();
}

//#endregion
//#region dist/application/JsonFiles.js
function writeTextParts(parts, path, overwrite, resources, cancellation) {
	return resources.run(() => writeTextPartsOwned(parts, path, overwrite, resources, cancellation)).catch((cause) => {
		const cleanup = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? cause.cleanup : undefined;
		const error = new EvidenceFileError("write", "io", {
			cause,
			path: absoluteCallerPath(path),
			...cleanup === undefined ? {} : { cleanup }
		});
		bindArtifactFileCleanup(cause, error);
		return err(error);
	});
}
var readJsonFile, readJsonFileWithSource, readJsonObjectMembersFile, readJsonFileInput, decodedJsonFileResult, jsonFileReadFailure, jsonFileCleanupError, isJsonReadCancellation, writeTextFile, writeTextPartsOwned, stagedCleanupFailure, fileAccessFailureReason, publishFile, acquireStagedFile, StagedOutputCleanupFailure, failureMessage, writeStagedParts, assertWriteActive, fileErrorCode;
function init_JsonFiles() {
	return (init_JsonFiles = __esmMin((() => {
		init_evidenceErrors();
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_analysisErrorProjection();
		init_result();
		init_JsonInputFile();
		init_RegularFile();
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_AnalysisCleanupLease();
		init_OwnedFileHandle();
		init_OwnedStagedOutput();
		init_callerPath();
		readJsonFile = async (path, signal, resources, operation = "read_evidence_file") => {
			const read = await readJsonFileWithSource(path, signal, resources, operation);
			return read.ok ? ok(read.value.data) : read;
		};
		readJsonFileWithSource = (path, signal, resources, operation = "read_evidence_file") => readJsonFileInput(path, async (selected) => {
			const read = await readJsonInputFile(selected, operation, signal, resources);
			return read.ok ? ok({
				data: read.value,
				path: selected
			}) : read;
		}, signal, operation);
		readJsonObjectMembersFile = (path, scans, signal, resources, operation = "read_evidence_file") => readJsonFileInput(path, (selected) => readJsonObjectFile(selected, operation, scans, signal, resources), signal, operation);
		readJsonFileInput = async (path, read, signal, operation = "read_evidence_file") => {
			const requestedPath = absoluteCallerPath(path);
			try {
				return decodedJsonFileResult(await read(requestedPath), requestedPath);
			} catch (cause) {
				if (signal?.aborted === true && cause === signal.reason) return err(new AnalysisCancelledError(operation, { cause }));
				if (cause instanceof RegularFileCleanupFailure) return err(jsonFileCleanupError(cause, requestedPath, operation, signal));
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
					const primary = cause.reason === "cancelled" ? new AnalysisCancelledError(operation, {
						cause: cause.cancellation === undefined ? cause.cause : cause.cancellation.reason,
						partialObservation: cause.partialObservation
					}) : undefined;
					const error = new EvidenceFileError("read", "io", {
						cause,
						path: requestedPath,
						cleanup: cause.cleanup,
						partialObservation: cause.partialObservation,
						cleanupPrimary: primary,
						...primary === undefined ? {} : { diagnostics: { primary_error: projectAnalysisError(primary) } }
					});
					bindRegularFileCleanup(cause, error);
					return err(error);
				}
				return err(jsonFileReadFailure(cause, requestedPath, operation, signal));
			}
		};
		decodedJsonFileResult = (decoded, path) => {
			if (decoded.ok) return decoded;
			if (decoded.error instanceof AnalysisResourceConstraintError) return err(decoded.error);
			return err(new EvidenceFileError("read", "invalid-json", {
				cause: decoded.error.cause ?? new SyntaxError(decoded.error.issues[0]?.message ?? decoded.error.message),
				path,
				...decoded.error.userMessage === undefined ? {} : { userMessage: decoded.error.userMessage },
				contentIssues: decoded.error.issues
			}));
		};
		jsonFileReadFailure = (cause, path, operation, signal) => {
			if (cause instanceof AnalysisResourceConstraintError) return cause;
			if (cause instanceof JsonInputCancellationFailure) return new AnalysisCancelledError(operation, { cause: cause.reason });
			if (cause instanceof JsonInputPhysicalReadFailure) return new EvidenceFileError("read", "io", {
				cause: cause.physicalCause,
				path
			});
			if (isJsonReadCancellation(cause, signal)) return new AnalysisCancelledError(operation, { cause: signal?.reason });
			return new EvidenceFileError("read", cause instanceof NonRegularFileReadError ? "not-file" : fileAccessFailureReason(cause), {
				cause,
				path
			});
		};
		jsonFileCleanupError = (failure, path, operation, signal) => {
			const cleanup = new EvidenceFileError("read", "io", {
				cause: failure,
				path,
				cleanup: {
					reason: failure.cleanupCause instanceof Error ? failure.cleanupCause.message : String(failure.cleanupCause),
					resources: [failure.path]
				}
			});
			bindRegularFileCleanup(failure, cleanup);
			const cancellation = regularFileCancellation(failure);
			let primary;
			if (failure.outcome.kind === "failed") {
				primary = cancellation === undefined ? jsonFileReadFailure(failure.outcome.cause, path, operation, signal) : new AnalysisCancelledError(operation, { cause: cancellation.reason });
			} else {
				const decoded = decodedJsonFileResult(failure.outcome.value, path);
				if (!decoded.ok) primary = decoded.error;
				else if (cancellation !== undefined) primary = new AnalysisCancelledError(operation, { cause: cancellation.reason });
			}
			if (primary === undefined) return cleanup;
			return new EvidenceFileError("read", "io", {
				path,
				cause: new AggregateError([primary, cleanup], "JSON read and cleanup failures", { cause: primary }),
				cleanupPrimary: primary,
				cleanup: cleanup.cleanup,
				diagnostics: { primary_error: projectAnalysisError(primary) }
			}).bindCleanupDependencies([primary, cleanup]);
		};
		isJsonReadCancellation = (cause, signal) => {
			if (signal?.aborted !== true) return false;
			if (cause === signal.reason) return true;
			return cause instanceof Error && cause.name === "AbortError" && "code" in cause && cause.code === "ABORT_ERR" && cause.cause === signal.reason;
		};
		writeTextFile = async (encoded, path, overwrite, resources) => writeTextParts([encoded], path, overwrite, resources);
		writeTextPartsOwned = async (parts, path, overwrite, resources, cancellation) => {
			const requestedPath = absoluteCallerPath(path);
			try {
				assertWriteActive(cancellation);
				if (process.platform !== "win32" && requestedPath.endsWith("/")) return err(new EvidenceFileError("write", "not-file", { path: requestedPath }));
				const canonicalParent = await realpath(dirname(requestedPath));
				const destination = resolve(canonicalParent, basename(requestedPath));
				const existing = await lstat(destination).catch((cause) => {
					if (fileErrorCode(cause) === "ENOENT") return undefined;
					throw cause;
				});
				if (existing !== undefined) {
					if (!overwrite) return err(new EvidenceFileError("write", "exists", { path: requestedPath }));
					if (!existing.isFile() || existing.isSymbolicLink()) return err(new EvidenceFileError("write", "not-file", { path: requestedPath }));
				}
				assertWriteActive(cancellation);
				const bytes = await publishFile(destination, parts, overwrite, resources, cancellation);
				return ok({
					path: requestedPath,
					bytes
				});
			} catch (cause) {
				if (cause instanceof StagedOutputCleanupFailure) {
					const cleanup = {
						reason: failureMessage(cause.cleanupCause),
						resources: [cause.owner.directory]
					};
					if (cause.outcome.ok) return stagedCleanupFailure(new EvidenceFileError("write", "io", {
						cause,
						path: requestedPath,
						cleanup,
						published: {
							...cause.outcome.value,
							path: requestedPath
						}
					}), cause.lease);
					if (cause.outcome.error instanceof AnalysisCancelledError) return stagedCleanupFailure(new AnalysisCancelledError(cause.outcome.error.operation, {
						cause: cause.outcome.error.cause,
						cleanupPrimary: cause.outcome.error,
						cleanup
					}), cause.lease);
					return stagedCleanupFailure(new EvidenceFileError("write", fileAccessFailureReason(cause.outcome.error), {
						cause,
						path: requestedPath,
						cleanup
					}), cause.lease);
				}
				if (cancellation?.signal.aborted === true && cause instanceof AnalysisCancelledError && cause.operation === cancellation.operation) return err(cause);
				if (!overwrite && fileErrorCode(cause) === "EEXIST") return err(new EvidenceFileError("write", "exists", {
					cause,
					path: requestedPath
				}));
				return err(new EvidenceFileError("write", fileAccessFailureReason(cause), {
					cause,
					path: requestedPath
				}));
			}
		};
		stagedCleanupFailure = (error, lease) => {
			new AnalysisCleanupLeaseGroup(error, [lease]);
			return err(error);
		};
		fileAccessFailureReason = (cause) => {
			const code = fileErrorCode(cause);
			if (code === "ENAMETOOLONG") return "path-limit";
			return code === "ENOENT" || code === "ENOTDIR" ? "missing" : "io";
		};
		publishFile = async (destination, parts, overwrite, resources, cancellation) => {
			const { owner, staged, file } = await acquireStagedFile(dirname(destination), resources, cancellation);
			let outcome;
			try {
				let written;
				try {
					const bytes = await writeStagedParts(file, parts, cancellation);
					assertWriteActive(cancellation);
					await file.sync();
					written = ok(bytes);
				} catch (cause) {
					written = err(cause);
				}
				try {
					await owner.closeFile();
				} catch (cause) {
					if (written.ok) written = err(cause);
				}
				if (!written.ok) throw written.error;
				assertWriteActive(cancellation);
				await owner.assertReadyForPublication(staged);
				assertWriteActive(cancellation);
				if (overwrite) {
					await rename(staged, destination);
					owner.recordPublishedRename();
				} else await link(staged, destination);
				outcome = ok({
					path: destination,
					bytes: written.value
				});
			} catch (cause) {
				outcome = err(cause);
			}
			const released = await resources.release({
				kind: "staged-output",
				resource: owner.directory,
				output: owner
			});
			if (released.kind === "failed") throw new StagedOutputCleanupFailure(outcome, released.cause, owner, released.lease);
			if (!outcome.ok) throw outcome.error;
			return outcome.value.bytes;
		};
		acquireStagedFile = async (destinationParent, resources, cancellation) => {
			const destinationDevice = (await lstat(destinationParent)).dev;
			let parent = destinationParent;
			for (;;) {
				assertWriteActive(cancellation);
				let failure;
				let directory;
				try {
					directory = await mkdtemp(resolve(parent, ".rea-write-"));
				} catch (cause) {
					if (fileErrorCode(cause) !== "ENAMETOOLONG") throw cause;
					failure = cause;
				}
				if (directory !== undefined) {
					const owner = await OwnedStagedOutput.create(directory);
					const staged = resolve(directory, "content");
					try {
						const file = await open(staged, "wx", 384);
						owner.setFile(new OwnedFileHandle(file));
						return {
							owner,
							staged,
							file
						};
					} catch (cause) {
						const released = await resources.release({
							kind: "staged-output",
							resource: owner.directory,
							output: owner
						});
						if (released.kind === "failed") throw new StagedOutputCleanupFailure(err(cause), released.cause, owner, released.lease);
						if (fileErrorCode(cause) !== "ENAMETOOLONG") throw cause;
						failure = cause;
					}
				}
				const ancestor = dirname(parent);
				if (ancestor === parent) throw failure;
				const metadata = await lstat(ancestor);
				if (metadata.dev !== destinationDevice) throw failure;
				parent = ancestor;
			}
		};
		StagedOutputCleanupFailure = class extends Error {
			outcome;
			cleanupCause;
			owner;
			lease;
			constructor(outcome, cleanupCause, owner, lease) {
				super("Staged output cleanup failed", { cause: outcome.ok ? cleanupCause : outcome.error });
				this.outcome = outcome;
				this.cleanupCause = cleanupCause;
				this.owner = owner;
				this.lease = lease;
			}
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message || cause.name : String(cause);
		writeStagedParts = async (file, parts, cancellation) => {
			assertWriteActive(cancellation);
			const iterator = parts[Symbol.iterator]();
			let exhausted = false;
			let bytes = 0;
			try {
				for (;;) {
					assertWriteActive(cancellation);
					const part = iterator.next();
					if (part.done) exhausted = true;
					assertWriteActive(cancellation);
					if (part.done) return bytes;
					await file.writeFile(part.value, { encoding: "utf8" });
					bytes += Buffer.byteLength(part.value, "utf8");
				}
			} finally {
				if (!exhausted) iterator.return?.();
			}
		};
		assertWriteActive = (cancellation) => {
			if (cancellation?.signal.aborted === true) throw new AnalysisCancelledError(cancellation.operation, { cause: cancellation.signal.reason });
		};
		fileErrorCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
	})))();
}

//#endregion
export { JSON_INPUT_RESOURCE_REMEDIATION, JsonInputCancellationFailure, JsonInputPhysicalReadFailure, init_JsonFiles, init_JsonInputFile, init_OwnedJsonInput, init_Utf8JsonInput, nativeJsonParseRequiredBytes, parseUtf8Json, readJsonFile, readJsonFileWithSource, readJsonInputFile, readJsonObjectMembersFile, sealOwnedJsonInput, writeTextFile, writeTextParts };