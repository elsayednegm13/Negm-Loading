import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_NATIVE_COMMAND_TIMEOUT_MS, init_machoCpuIdentity, init_nativeDeadlines, machoCpuSubtypeBase } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisOutputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { DarwinProcessOwnershipInspectionError, boundedUtf8Text, init_DarwinProcessRunTokenReader, init_boundedUtf8Text } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { OwnedCommandFailure, init_OwnedCommand, runOwnedCommand } from "./OwnedCommand-BzzUKKpJ.js";
import { init_snapshotEnvironment, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { realpath } from "node:fs/promises";
import { createReadStream } from "node:fs";

//#region dist/native/CommandRunner.js
var NATIVE_COMMAND_OUTPUT_BUDGET_BYTES, NATIVE_FAILURE_DIAGNOSTIC_BYTES, NativeCommandFailure, XcrunCommandRunner, commandProcessResources, commandCleanupFailure, ALLOWED_TOOLS, resolveXcrunTool, failureCapture, captureProcess, processFailureReason, processCaptureFromSnapshot, hashFile;
function init_CommandRunner() {
	return (init_CommandRunner = __esmMin((() => {
		init_snapshotEnvironment();
		init_result();
		init_providerCleanupError();
		init_DarwinProcessRunTokenReader();
		init_OwnedCommand();
		init_boundedUtf8Text();
		init_nativeDeadlines();
		NATIVE_COMMAND_OUTPUT_BUDGET_BYTES = 64 * 1024 * 1024;
		NATIVE_FAILURE_DIAGNOSTIC_BYTES = 64 * 1024;
		NativeCommandFailure = class NativeCommandFailure extends Error {
			tool;
			reason;
			exitCode;
			capture;
			cleanupFailure;
			cleanupResources;
			/** Caller-owned cancellation fact retained separately from the physical cause. */
			cancellation;
			cleanupOwner;
			cleanupFailures;
			cleanupMarker;
			detail;
			preparationFailure;
			constructor(tool, reason, exitCode = null, options, capture = null, cleanupFailure = null, cleanupResources = []) {
				super(`Native command ${tool} failed: ${reason}`, options);
				this.tool = tool;
				this.reason = reason;
				this.exitCode = exitCode;
				this.capture = capture;
				this.cleanupFailure = cleanupFailure;
				this.cleanupResources = cleanupResources;
				this.cancellation = options?.cancellation === undefined ? undefined : { reason: options.cancellation.reason };
				this.cleanupOwner = options?.cleanupOwner;
				this.cleanupFailures = options?.cleanupFailures ?? [];
				this.cleanupMarker = options?.cleanupMarker;
				this.preparationFailure = options?.cause instanceof DarwinProcessOwnershipInspectionError ? options.cause : options?.cause instanceof NativeCommandFailure || options?.cause instanceof OwnedCommandFailure ? options.cause.preparationFailure : undefined;
				this.detail = options?.detail ?? this.preparationFailure?.message ?? null;
			}
		};
		XcrunCommandRunner = class {
			resolveTool;
			launcher;
			environment;
			#cleanupMarkers = new Map();
			#cleanupAttempt;
			constructor(environment, resolveTool = (tool, signal, launcher, timeoutMs) => resolveXcrunTool(tool, this.environment, signal, launcher, timeoutMs), launcher) {
				this.resolveTool = resolveTool;
				this.launcher = launcher;
				this.environment = snapshotEnvironment(environment);
			}
			run(tool, arguments_, options) {
				if (!ALLOWED_TOOLS.has(tool)) return Promise.resolve(err(new NativeCommandFailure(tool, "unavailable")));
				return this.#runAfterCleanup(tool, arguments_, options);
			}
			/** Retry every retained owner; a failed retry prevents another command launch. */
			retryCleanup() {
				if (this.#cleanupMarkers.size === 0) return Promise.resolve([]);
				if (this.#cleanupAttempt !== undefined) return this.#cleanupAttempt;
				this.#cleanupAttempt = this.#retryCleanup().finally(() => {
					this.#cleanupAttempt = undefined;
				});
				return this.#cleanupAttempt;
			}
			async #runAfterCleanup(tool, arguments_, options) {
				const pendingFailures = await this.retryCleanup();
				if (pendingFailures.length > 0) return err(commandCleanupFailure(tool, pendingFailures));
				const resolved = await this.resolveTool(tool, options.signal, this.launcher, options.timeoutMs);
				if (!resolved.ok) {
					return err(this.#retainCleanupOwner(resolved.error));
				}
				const captured = await captureProcess(resolved.value.path, arguments_, tool, options, this.environment, this.launcher);
				if (!captured.ok) return err(this.#retainCleanupOwner(captured.error));
				return ok({
					...captured.value,
					tool,
					executable: resolved.value.path,
					executableSha256: resolved.value.sha256,
					toolVersion: null,
					versionReason: "Tool exposes no uniform stable version flag; executable SHA-256 is a prelaunch file sample and does not prove atomic OS image binding.",
					arguments: [...arguments_]
				});
			}
			async #retryCleanup() {
				const failures = [];
				for (const [owner, marker] of this.#cleanupMarkers) {
					let reason;
					try {
						const stopped = await owner.stop();
						if (stopped.status === "not-owned") {
							reason = "native command ownership remains unresolved";
						} else if (stopped.status !== "incomplete") {
							marker.resolveCleanup();
							this.#cleanupMarkers.delete(owner);
							continue;
						} else reason = stopped.reason || "native command cleanup remains unverified";
					} catch (cause) {
						reason = cause instanceof Error ? cause.message || cause.name : String(cause) || "native command cleanup failed unexpectedly";
					}
					failures.push({
						owner,
						reason: reason ?? "native command cleanup remains unverified",
						resources: commandProcessResources(owner),
						marker
					});
				}
				return failures;
			}
			#retainCleanupOwner(failure) {
				const owner = failure.cleanupOwner;
				if (owner === undefined) return failure;
				let marker = failure.cleanupMarker ?? this.#cleanupMarkers.get(owner);
				if (marker === undefined) {
					marker = new ProviderCleanupError("native-macos", commandProcessResources(owner), { reason: failure.cleanupFailure ?? "native command cleanup remains incomplete" }, {
						operation: "native_command",
						cause: failure
					});
				}
				this.#cleanupMarkers.set(owner, marker);
				if (failure.cleanupMarker === marker) return failure;
				return new NativeCommandFailure(failure.tool, failure.reason, failure.exitCode, {
					cause: failure,
					...failure.cancellation === undefined ? {} : { cancellation: failure.cancellation },
					cleanupOwner: owner,
					cleanupFailures: failure.cleanupFailures,
					cleanupMarker: marker,
					...failure.detail === null ? {} : { detail: failure.detail }
				}, failure.capture, failure.cleanupFailure, failure.cleanupResources);
			}
		};
		commandProcessResources = (owner) => {
			const ownership = owner.launch.ownership;
			return ownership === undefined ? ["native-command-process"] : [
				ownership.runId,
				`pid:${String(ownership.leaderPid)}`,
				`process-group:${String(ownership.processGroupId)}`
			];
		};
		commandCleanupFailure = (tool, failures) => new NativeCommandFailure(tool, "io", null, {
			cleanupFailures: failures,
			cause: new AggregateError(failures.map(({ reason, resources }) => new Error(`${reason} (${resources.join(", ")})`)), "Previously owned native command cleanup remains incomplete")
		}, null, failures.map(({ reason, resources }) => `${resources.join(", ")}: ${reason}`).join("; "), [...new Set(failures.flatMap(({ resources }) => resources))]);
		ALLOWED_TOOLS = new Set([
			"codesign",
			"dyld_info",
			"dwarfdump",
			"file",
			"lipo",
			"nm",
			"otool",
			"plutil",
			"strings",
			"swift-demangle",
			"vtool"
		]);
		resolveXcrunTool = async (tool, environment, signal, launcher, timeoutMs) => {
			const found = await captureProcess("/usr/bin/xcrun", ["--find", tool], "xcrun", {
				...signal === undefined ? {} : { signal },
				...timeoutMs === undefined ? {} : { timeoutMs }
			}, environment, launcher);
			if (!found.ok) {
				return err(new NativeCommandFailure(tool, found.error.reason === "nonzero-exit" || found.error.reason === "unavailable" ? "unavailable" : found.error.reason, found.error.exitCode, {
					cause: found.error,
					...found.error.cleanupOwner === undefined ? {} : { cleanupOwner: found.error.cleanupOwner },
					...found.error.cleanupFailures.length === 0 ? {} : { cleanupFailures: found.error.cleanupFailures },
					...found.error.cleanupMarker === undefined ? {} : { cleanupMarker: found.error.cleanupMarker },
					...found.error.cancellation === undefined ? {} : { cancellation: found.error.cancellation },
					...found.error.detail === null ? {} : { detail: found.error.detail }
				}, found.error.capture, found.error.cleanupFailure, found.error.cleanupResources));
			}
			if (found.value.exitCode !== 0) return err(new NativeCommandFailure(tool, "unavailable", found.value.exitCode, undefined, failureCapture(found.value, false)));
			const candidate = found.value.stdout.trim();
			if (!candidate.startsWith("/")) return err(new NativeCommandFailure(tool, "unavailable", found.value.exitCode, undefined, failureCapture(found.value, false)));
			try {
				const path = await realpath(candidate);
				return ok({
					path,
					sha256: await hashFile(path, signal)
				});
			} catch (cause) {
				const capture = failureCapture(found.value, false);
				const cancellation = signal?.aborted === true ? { reason: signal.reason } : undefined;
				const abortedHashRead = cause instanceof Error && "code" in cause && cause.code === "ABORT_ERR" && signal?.aborted === true && cause.cause === signal.reason;
				return err(new NativeCommandFailure(tool, abortedHashRead ? "cancelled" : "io", capture.exitCode, {
					cause,
					...cancellation === undefined ? {} : { cancellation }
				}, capture));
			}
		};
		failureCapture = (capture, truncated) => {
			const stdout = boundedUtf8Text(capture.stdout, NATIVE_FAILURE_DIAGNOSTIC_BYTES);
			const stderr = boundedUtf8Text(capture.stderr, NATIVE_FAILURE_DIAGNOSTIC_BYTES);
			return {
				stdout: stdout.text,
				stderr: stderr.text,
				stdoutBytes: capture.stdoutBytes,
				stderrBytes: capture.stderrBytes,
				exitCode: capture.exitCode,
				signal: capture.signal,
				truncated: truncated || stdout.truncated || stderr.truncated
			};
		};
		captureProcess = async (executable, arguments_, tool, options, environment, launcher) => {
			const runId = `rea-native-command-${randomUUID()}`;
			try {
				const snapshot = await runOwnedCommand({
					command: executable,
					arguments: [...arguments_],
					runId,
					env: {
						LC_ALL: "C",
						LANG: "C"
					},
					hostEnvironment: environment,
					...options.signal === undefined ? {} : { signal: options.signal }
				}, {
					timeoutMs: options.timeoutMs ?? 6e4,
					diagnosticBytes: NATIVE_COMMAND_OUTPUT_BUDGET_BYTES,
					acceptNonZeroExit: options.acceptNonZero === true
				}, launcher === undefined ? {} : { launcher });
				return ok(processCaptureFromSnapshot(snapshot));
			} catch (cause) {
				if (cause instanceof OwnedCommandFailure) {
					const capture = cause.snapshot === null ? null : failureCapture(processCaptureFromSnapshot(cause.snapshot), cause.snapshot.diagnosticTruncated === true);
					return err(new NativeCommandFailure(tool, cause.reason === "process" ? processFailureReason(capture) : cause.reason, capture?.exitCode ?? null, {
						cause,
						...cause.cancellation === undefined ? {} : { cancellation: cause.cancellation },
						...cause.cleanupOwner === undefined ? {} : { cleanupOwner: cause.cleanupOwner }
					}, capture, cause.cleanupFailure, cause.resources));
				}
				return err(new NativeCommandFailure(tool, cause instanceof DarwinProcessOwnershipInspectionError && cause.cancellation !== undefined ? "cancelled" : "io", null, { cause }));
			}
		};
		processFailureReason = (capture) => capture !== null && (capture.signal !== null || capture.exitCode !== null && capture.exitCode !== 0) ? "nonzero-exit" : "io";
		processCaptureFromSnapshot = (snapshot) => ({
			stdout: snapshot.stdout.text,
			stderr: snapshot.stderr.text,
			stdoutBytes: snapshot.stdout.bytes,
			stderrBytes: snapshot.stderr.bytes,
			exitCode: snapshot.exitCode ?? null,
			signal: snapshot.signal ?? null
		});
		hashFile = (path, signal) => new Promise((resolve, reject) => {
			const hash = createHash("sha256");
			const stream = createReadStream(path, signal === undefined ? undefined : { signal });
			stream.on("data", (chunk) => hash.update(chunk));
			stream.once("error", reject);
			stream.once("end", () => resolve(hash.digest("hex")));
		});
	})))();
}

//#endregion
//#region dist/native/parsers/lipo.js
var architectureSchema, parseLipoOutput, parseLipoOutputResult, parseLipoCapture, integer, CPU_TYPES, CPU_SUBTYPES, cpuTypeCode, cpuSubtypeCode, cpuSubtypeBase, capabilityBits, unsigned32, alignment;
function init_lipo() {
	return (init_lipo = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_machoCpuIdentity();
		architectureSchema = z.object({
			name: z.string().min(1),
			hidden: z.boolean(),
			cpu_type: z.string().nullable(),
			cpu_subtype: z.string().nullable(),
			cpu_type_code: z.int().nonnegative().nullable(),
			cpu_subtype_code: z.int().nonnegative().nullable(),
			cpu_subtype_base: z.int().nonnegative().nullable(),
			capabilities: z.string().nullable(),
			file_offset: z.int().min(0).nullable(),
			size: z.int().min(0).nullable(),
			alignment: z.int().min(0).nullable()
		});
		parseLipoOutput = (output, operandPath) => {
			if (operandPath !== undefined) {
				const header = `Fat header in: ${operandPath}`;
				if (output.startsWith(header)) {
					if (output.startsWith("\r\n", header.length)) output = output.slice(header.length + 2);
					else if (output.startsWith("\n", header.length)) output = output.slice(header.length + 1);
				}
			}
			const thinArchitecture = /(?:^|\r?\n)Non-fat file:[\s\S]* is architecture: ([^\s]+)\s*$/u.exec(output)?.[1];
			if (thinArchitecture !== undefined) return {
				format: "thin",
				declaredArchitectureCount: null,
				hiddenArchitectureCount: null,
				architectures: [architectureSchema.parse({
					name: thinArchitecture,
					hidden: false,
					cpu_type: null,
					cpu_subtype: null,
					cpu_type_code: null,
					cpu_subtype_code: null,
					cpu_subtype_base: null,
					capabilities: null,
					file_offset: null,
					size: null,
					alignment: null
				})]
			};
			const architectures = [];
			let declaredArchitectureCount = null;
			let hiddenArchitectureCount = null;
			let current;
			const flush = () => {
				if (current === undefined) return;
				const name = current.architecture ?? current["Non-fat file"];
				if (name !== undefined) architectures.push(architectureSchema.parse({
					name: name.includes(" is architecture: ") ? name.split(" is architecture: ").at(-1) ?? name : name.replace(/ \(hidden\)$/u, ""),
					hidden: name.endsWith(" (hidden)"),
					cpu_type: current.cputype ?? null,
					cpu_subtype: current.cpusubtype ?? null,
					cpu_type_code: cpuTypeCode(current.cputype),
					cpu_subtype_code: cpuSubtypeCode(current.cpusubtype, current.capabilities),
					cpu_subtype_base: cpuSubtypeBase(current.cpusubtype),
					capabilities: current.capabilities ?? null,
					file_offset: integer(current.offset),
					size: integer(current.size),
					alignment: alignment(current.align)
				}));
				current = undefined;
			};
			for (const rawLine of output.split(/\r?\n/u)) {
				const line = rawLine.trim();
				const count = /^nfat_arch\s+(\d+)(?:\s+\(\+(\d+) hidden\))?$/u.exec(line);
				if (count?.[1] !== undefined) {
					declaredArchitectureCount = integer(count[1]);
					hiddenArchitectureCount = integer(count[2] ?? "0");
					continue;
				}
				if (line.startsWith("Non-fat file:")) {
					flush();
					current = { "Non-fat file": line };
					continue;
				}
				if (line.startsWith("architecture ")) {
					flush();
					current = { architecture: line.slice("architecture ".length).trim() };
					continue;
				}
				const match = /^(cputype|cpusubtype|capabilities|offset|size|align)\s+(.+)$/u.exec(line);
				if (match?.[1] !== undefined && match[2] !== undefined) {
					current ??= {};
					current[match[1]] = match[2].trim();
				}
			}
			flush();
			if (architectures.length === 0) throw new TypeError("lipo output contained no architectures");
			return {
				format: "fat",
				declaredArchitectureCount,
				hiddenArchitectureCount,
				architectures
			};
		};
		parseLipoOutputResult = (output, operandPath) => {
			try {
				return ok(parseLipoOutput(output, operandPath));
			} catch (cause) {
				if (!(cause instanceof TypeError) && !(cause instanceof z.ZodError)) throw cause;
				return err(cause);
			}
		};
		parseLipoCapture = (capture, operation, operandPath) => {
			const parsed = parseLipoOutputResult(capture.stdout, operandPath);
			if (parsed.ok) return parsed;
			return err(new AnalysisOutputError(operation, "lipo did not produce readable architecture records", {
				cause: parsed.error,
				capturedOutput: {
					stdout: capture.stdout,
					stderr: capture.stderr,
					truncated: false,
					stdout_bytes: capture.stdoutBytes,
					stderr_bytes: capture.stderrBytes,
					exit_code: capture.exitCode,
					signal: capture.signal
				}
			}));
		};
		integer = (value) => {
			if (value === undefined || !/^\d+$/u.test(value)) return null;
			const parsed = Number.parseInt(value, 10);
			return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
		};
		CPU_TYPES = {
			CPU_TYPE_X86: 7,
			CPU_TYPE_X86_64: 16777223,
			CPU_TYPE_ARM: 12,
			CPU_TYPE_ARM64: 16777228,
			CPU_TYPE_ARM64_32: 33554444,
			CPU_TYPE_POWERPC: 18,
			CPU_TYPE_POWERPC64: 16777234
		};
		CPU_SUBTYPES = {
			CPU_SUBTYPE_X86_ALL: 3,
			CPU_SUBTYPE_X86_64_ALL: 3,
			CPU_SUBTYPE_X86_64_H: 8,
			CPU_SUBTYPE_ARM64_ALL: 0,
			CPU_SUBTYPE_ARM64_V8: 1,
			CPU_SUBTYPE_ARM64E: 2,
			CPU_SUBTYPE_ARM64_32_ALL: 0,
			CPU_SUBTYPE_ARM64_32_V8: 1,
			CPU_SUBTYPE_ARM_V7: 9,
			CPU_SUBTYPE_ARM_V7S: 11,
			CPU_SUBTYPE_ARM_V7K: 12,
			CPU_SUBTYPE_POWERPC_ALL: 0,
			CPU_SUBTYPE_POWERPC_970: 100
		};
		cpuTypeCode = (value) => {
			if (value === undefined) return null;
			const numeric = unsigned32(value);
			return numeric ?? CPU_TYPES[value] ?? null;
		};
		cpuSubtypeCode = (value, capabilities) => {
			if (value === undefined) return null;
			const numeric = unsigned32(value);
			if (numeric !== null) return numeric;
			const subtype = CPU_SUBTYPES[value];
			if (subtype === undefined) return null;
			if (value !== "CPU_SUBTYPE_ARM64E") {
				const bits = capabilityBits(capabilities);
				return bits === null ? null : (bits << 24 | subtype) >>> 0;
			}
			const version = /PTR_AUTH_VERSION\s+USERSPACE\s+(\d+)/u.exec(capabilities ?? "")?.[1];
			if (version === undefined) return null;
			const parsedVersion = Number(version);
			if (!Number.isInteger(parsedVersion) || parsedVersion < 0 || parsedVersion > 15) return null;
			return (2147483648 | parsedVersion << 24 | subtype) >>> 0;
		};
		cpuSubtypeBase = (value) => {
			if (value === undefined) return null;
			const subtype = unsigned32(value) ?? CPU_SUBTYPES[value];
			return subtype === undefined ? null : machoCpuSubtypeBase(subtype);
		};
		capabilityBits = (capabilities) => {
			if (capabilities === "CPU_SUBTYPE_LIB64") return 128;
			const bits = /^0x([\da-f]{1,2})$/iu.exec(capabilities ?? "")?.[1];
			return bits === undefined ? null : Number.parseInt(bits, 16);
		};
		unsigned32 = (value) => {
			if (!/^(?:\d+|0x[\da-f]+)$/iu.test(value)) return null;
			const parsed = Number(value);
			return Number.isInteger(parsed) && parsed >= 0 && parsed <= 4294967295 ? parsed >>> 0 : null;
		};
		alignment = (value) => {
			if (value === undefined) return null;
			const exponent = /^2\^(\d+)(?: \((\d+)\))?$/u.exec(value);
			const powerText = exponent?.[1];
			if (powerText !== undefined) {
				const power = Number.parseInt(powerText, 10);
				if (power > 52) return null;
				const alignment = 2 ** power;
				const reported = exponent?.[2];
				return reported === undefined || integer(reported) === alignment ? alignment : null;
			}
			return integer(value);
		};
	})))();
}

//#endregion
export { NATIVE_COMMAND_OUTPUT_BUDGET_BYTES, NATIVE_FAILURE_DIAGNOSTIC_BYTES, NativeCommandFailure, XcrunCommandRunner, failureCapture, init_CommandRunner, init_lipo, parseLipoCapture, parseLipoOutputResult, resolveXcrunTool };