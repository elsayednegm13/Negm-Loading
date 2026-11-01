import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { MAX_PROVIDER_STARTUP_TIMEOUT_MS, init_analysisResourceLimits, init_safeJson, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCapabilityUnavailableError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { execFileFailureCapturedOutput, execFileOutput, execFileOutputFailure, init_ExecFileOutput } from "./ExecFileOutput-OgYrEogw.js";
import { DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-CIerZEwx.js";
import { z } from "zod";
import { basename, isAbsolute, join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

//#region dist/process/ProcessLifecycle.js
var PROCESS_CLEANUP_VERIFICATION_GRACE_MS, PROCESS_CLEANUP_VERIFICATION_INTERVAL_MS, processIdentityHasExited, processIdentityIsExiting;
function init_ProcessLifecycle() {
	return (init_ProcessLifecycle = __esmMin((() => {
		PROCESS_CLEANUP_VERIFICATION_GRACE_MS = 1e3;
		PROCESS_CLEANUP_VERIFICATION_INTERVAL_MS = 25;
		processIdentityHasExited = (identity) => identity?.state === "absent" || identity?.state === "readable" && identity.lifecycle?.state === "observed" && (identity.lifecycle.lifecycle === "zombie" || identity.lifecycle.lifecycle === "dead");
		processIdentityIsExiting = (identity) => identity?.state === "readable" && identity.lifecycle?.state === "observed" && identity.lifecycle.lifecycle === "exiting";
	})))();
}

//#endregion
//#region dist/process/LinuxProcessStat.js
var parseLinuxProcessStat;
function init_LinuxProcessStat() {
	return (init_LinuxProcessStat = __esmMin((() => {
		parseLinuxProcessStat = (value) => {
			const commandStart = value.indexOf("(");
			const commandEnd = value.lastIndexOf(")");
			if (commandStart <= 0 || commandEnd <= commandStart) return undefined;
			const pidText = value.slice(0, commandStart).trim();
			if (!/^\d+$/u.test(pidText)) return undefined;
			const pid = Number(pidText);
			if (!Number.isSafeInteger(pid) || pid <= 0) return undefined;
			const fields = value.slice(commandEnd + 1).trim().split(/\s+/u);
			const state = fields[0];
			const parentPidText = fields[1];
			const processGroupIdText = fields[2];
			const sessionIdText = fields[3];
			const startTime = fields[19];
			if (state === undefined || !/^[A-Za-z]$/u.test(state) || parentPidText === undefined || !/^\d+$/u.test(parentPidText) || processGroupIdText === undefined || !/^(?:-1|\d+)$/u.test(processGroupIdText) || sessionIdText === undefined || !/^(?:-1|\d+)$/u.test(sessionIdText) || startTime === undefined || !/^\d+$/u.test(startTime)) return undefined;
			const parentPid = Number(parentPidText);
			const processGroupId = Number(processGroupIdText);
			const sessionId = Number(sessionIdText);
			if (!Number.isSafeInteger(parentPid) || !Number.isSafeInteger(processGroupId) || !Number.isSafeInteger(sessionId)) return undefined;
			const flagsText = fields[6];
			const flags = flagsText !== undefined && /^\d+$/u.test(flagsText) ? Number(flagsText) : Number.NaN;
			const lifecycle = state === "Z" ? "zombie" : state === "X" || state === "x" ? "dead" : !Number.isSafeInteger(flags) ? undefined : (flags & 4) !== 0 ? "exiting" : "non-zombie";
			return {
				pid,
				startTime,
				lifecycle,
				parentPid,
				processGroupId,
				sessionId
			};
		};
	})))();
}

//#endregion
//#region dist/process/LinuxProcessStatus.js
var parseLinuxProcessIds, linuxEnvironmentRestriction;
function init_LinuxProcessStatus() {
	return (init_LinuxProcessStatus = __esmMin((() => {
		parseLinuxProcessIds = (value, row) => {
			let ids;
			for (const line of value.split("\n")) {
				if (!line.startsWith(`${row}:`)) continue;
				if (ids !== undefined) return undefined;
				const match = /^[UG]id:\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*$/u.exec(line);
				if (match === null) return undefined;
				const [real, effective, saved, filesystem] = match.slice(1).map(Number);
				if (real === undefined || effective === undefined || saved === undefined || filesystem === undefined || [
					real,
					effective,
					saved,
					filesystem
				].some((id) => !Number.isSafeInteger(id) || id < 0)) return undefined;
				ids = [
					real,
					effective,
					saved,
					filesystem
				];
			}
			return ids;
		};
		linuxEnvironmentRestriction = (facts) => {
			const { uids, gids, procfsOwnerUid, callerUid, callerGid } = facts;
			if (callerUid !== undefined && uids.slice(0, 3).some((uid) => uid !== callerUid) || callerGid !== undefined && gids !== undefined && gids.slice(0, 3).some((gid) => gid !== callerGid)) return "credentials";
			return procfsOwnerUid !== undefined && procfsOwnerUid !== uids[1] ? "non-dumpable" : undefined;
		};
	})))();
}

//#endregion
//#region dist/process/ProcessCommandIdentity.js
var matchesOwnedProcessCommand;
function init_ProcessCommandIdentity() {
	return (init_ProcessCommandIdentity = __esmMin((() => {
		matchesOwnedProcessCommand = (actual, expected, platform = process.platform) => {
			const actualCommand = actual.trim();
			const expectedCommand = expected.trim();
			if (actualCommand === expectedCommand || actualCommand.startsWith(`${expectedCommand} `)) return true;
			if (platform !== "darwin") return false;
			const actualExecutable = actualCommand.split(/\s+/u, 1)[0];
			const expectedExecutable = expectedCommand.split(/\s+/u, 1)[0];
			const normalizedActualExecutable = actualExecutable?.startsWith("(") === true && actualExecutable.endsWith(")") ? actualExecutable.slice(1, -1) : actualExecutable;
			return normalizedActualExecutable !== undefined && expectedExecutable !== undefined && basename(normalizedActualExecutable) === basename(expectedExecutable);
		};
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipIdentity.js
var launcherIdentityFailure;
function init_ProcessOwnershipIdentity() {
	return (init_ProcessOwnershipIdentity = __esmMin((() => {
		init_ProcessCommandIdentity();
		launcherIdentityFailure = (launcher, ownership) => {
			if (launcher.processGroupId !== ownership.processGroupId) return "owned launcher process-group identity did not match";
			if (ownership.expectedParentPid !== undefined && launcher.parentPid !== ownership.expectedParentPid) return "owned launcher parent identity did not match";
			if (ownership.expectedCommand !== undefined && !matchesOwnedProcessCommand(launcher.command, ownership.expectedCommand)) return `owned launcher command identity did not match (observed=${launcher.command}; expected=${ownership.expectedCommand})`;
			return null;
		};
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipProcessTree.js
var liveProcesses, descendantsOf, selectCapturedProcessGroupIds;
function init_ProcessOwnershipProcessTree() {
	return (init_ProcessOwnershipProcessTree = __esmMin((() => {
		liveProcesses = (members) => members.filter(({ state }) => !state.startsWith("Z"));
		descendantsOf = (rootPids, processes) => {
			const childrenByParent = new Map();
			for (const process of processes) {
				const siblings = childrenByParent.get(process.parentPid) ?? [];
				siblings.push(process);
				childrenByParent.set(process.parentPid, siblings);
			}
			const descendants = [];
			const pending = rootPids.flatMap((pid) => childrenByParent.get(pid) ?? []);
			const visited = new Set(rootPids);
			for (const process of pending) {
				if (visited.has(process.pid)) continue;
				visited.add(process.pid);
				descendants.push(process);
				pending.push(...childrenByParent.get(process.pid) ?? []);
			}
			return descendants;
		};
		selectCapturedProcessGroupIds = (rootPid, samples) => {
			const processGroupIds = new Set([rootPid]);
			for (const sample of samples) {
				if (sample.pid === sample.process_group_id) processGroupIds.add(sample.pid);
			}
			return [...processGroupIds];
		};
	})))();
}

//#endregion
//#region dist/process/boundedUtf8Text.js
var boundedUtf8Text;
function init_boundedUtf8Text() {
	return (init_boundedUtf8Text = __esmMin((() => {
		boundedUtf8Text = (value, maximumBytes) => {
			let bytes = 0;
			let end = 0;
			for (const codePoint of value) {
				const codePointBytes = Buffer.byteLength(codePoint, "utf8");
				if (bytes + codePointBytes > maximumBytes) return {
					text: value.slice(0, end),
					truncated: true
				};
				bytes += codePointBytes;
				end += codePoint.length;
			}
			return {
				text: value,
				truncated: false
			};
		};
	})))();
}

//#endregion
//#region dist/process/DarwinProcessRunTokenReader.js
var responseSchema, identityResponseSchema, sourceFiles, SWIFTC_INTERRUPT, resolveSwiftcCompileTimeoutMs, swiftcCompileTimeoutRecovery, STDERR_EXCERPT_LIMIT, DarwinProcessOwnershipInspectionError, MAX_COMPILER_OUTPUT_BYTES, compilerFailureFacts, compilerOutcomeDescription, compilerInspectionError, abortReason, isExpectedAbort$1, waitForCompilation, createDarwinProcessRunTokenReader;
function init_DarwinProcessRunTokenReader() {
	return (init_DarwinProcessRunTokenReader = __esmMin((() => {
		init_providerStartupTimeout();
		init_result();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_safeJson();
		init_boundedUtf8Text();
		init_ExecFileOutput();
		responseSchema = z.strictObject({ results: z.array(z.discriminatedUnion("state", [z.strictObject({
			pid: z.int().positive(),
			state: z.literal("readable"),
			run_id: z.string().optional(),
			reason: z.null().optional()
		}), z.strictObject({
			pid: z.int().positive(),
			state: z.literal("unavailable"),
			run_id: z.union([z.string(), z.null()]).optional(),
			reason: z.string().min(1)
		})])) });
		identityResponseSchema = z.strictObject({ results: z.array(z.discriminatedUnion("state", [
			z.strictObject({
				pid: z.int().positive(),
				state: z.literal("absent"),
				identity: z.null().optional(),
				reason: z.literal("not-in-snapshot")
			}),
			z.strictObject({
				pid: z.int().positive(),
				state: z.literal("readable"),
				identity: z.string().min(1),
				effective_uid: z.int().nonnegative().optional(),
				lifecycle: z.enum(["non-zombie", "zombie"]).optional(),
				relation: z.strictObject({
					state: z.literal("observed"),
					parent_pid: z.int().nonnegative(),
					process_group_id: z.int().nonnegative()
				}).optional(),
				reason: z.null().optional()
			}),
			z.strictObject({
				pid: z.int().positive(),
				state: z.literal("unavailable"),
				identity: z.null().optional(),
				reason: z.string().min(1)
			})
		])) });
		sourceFiles = [fileURLToPath(new URL("../../bridge/process/ProcessRunTokenReader.swift", new URL("../process/DarwinProcessRunTokenReader.js", import.meta.url).href)), fileURLToPath(new URL("../../bridge/process/ProcessRunTokenReaderMain.swift", new URL("../process/DarwinProcessRunTokenReader.js", import.meta.url).href))];
		SWIFTC_INTERRUPT = "SIGINT";
		resolveSwiftcCompileTimeoutMs = (options = {}) => {
			if (options.compileTimeoutMs !== undefined) return options.compileTimeoutMs;
			const raw = (options.environment ?? process.env).REA_SWIFTC_COMPILE_TIMEOUT_MS;
			if (raw === undefined) return DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS;
			const parsed = providerStartupTimeoutSchema.safeParse(raw);
			return parsed.success ? parsed.data : DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS;
		};
		swiftcCompileTimeoutRecovery = (timeoutMs) => `The effective REA_SWIFTC_COMPILE_TIMEOUT_MS value is ${String(timeoutMs)} ms (integer range 1..${String(MAX_PROVIDER_STARTUP_TIMEOUT_MS)}; omitted default ${String(DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS)} ms). Set it in the environment that starts REA and restart REA; the next ownership-helper compile uses the new value.`;
		STDERR_EXCERPT_LIMIT = 512;
		DarwinProcessOwnershipInspectionError = class DarwinProcessOwnershipInspectionError extends Error {
			#cleanupOwner;
			get cleanupOwner() {
				return this.#cleanupOwner;
			}
			constructor(message, options) {
				const { compilerOutcome, capturedOutput, cleanupFailure, cleanupOwner, cancellation, ...errorOptions } = options ?? {};
				super(message, errorOptions);
				this.name = "DarwinProcessOwnershipInspectionError";
				this.compilerOutcome = compilerOutcome;
				this.capturedOutput = capturedOutput;
				this.#cleanupOwner = cleanupOwner;
				this.cleanupFailure = cleanupFailure;
				this.cancellation = cancellation;
			}
			compilerOutcome;
			capturedOutput;
			cleanupFailure;
			cancellation;
			/** Preserve the physical preparation failure while following the exact cleanup owner. */
			withCleanupFailure(cleanup, owner) {
				const combined = this.cleanupFailure === undefined || this.cleanupFailure === cleanup ? cleanup : analysisErrorWithCleanupFailure(this.cleanupFailure, cleanup).bindCleanupDependencies([this.cleanupFailure, cleanup]);
				return new DarwinProcessOwnershipInspectionError(this.message, {
					...Object.hasOwn(this, "cause") ? { cause: this.cause } : {},
					...this.compilerOutcome === undefined ? {} : { compilerOutcome: this.compilerOutcome },
					...this.capturedOutput === undefined ? {} : { capturedOutput: this.capturedOutput },
					cleanupFailure: combined,
					cleanupOwner: owner ?? this.cleanupOwner,
					...this.cancellation === undefined ? {} : { cancellation: this.cancellation }
				});
			}
		};
		MAX_COMPILER_OUTPUT_BYTES = 8 * 1024;
		compilerFailureFacts = (cause, timeoutMs) => {
			const failure = execFileOutputFailure(cause);
			if (failure === undefined) return undefined;
			const stderr = boundedUtf8Text(failure.stderr, MAX_COMPILER_OUTPUT_BYTES);
			const stdout = boundedUtf8Text(failure.stdout, MAX_COMPILER_OUTPUT_BYTES);
			const outcome = failure.code === "ETIMEDOUT" ? "timed_out" : typeof failure.code === "number" ? "exited" : failure.signal !== null ? "signaled" : failure.code === "ENOENT" ? "spawn_failed" : "failed";
			return {
				outcome: {
					outcome,
					code: failure.code,
					signal: failure.signal,
					stderr: stderr.text,
					...failure.stderrBytes === undefined ? {} : { stderrBytes: failure.stderrBytes },
					stderrTruncated: stderr.truncated,
					outputTruncated: failure.outputTruncated,
					killed: failure.killed,
					...outcome === "timed_out" ? { timeoutMs } : {}
				},
				capturedOutput: {
					...execFileFailureCapturedOutput(failure),
					stdout: stdout.text,
					stderr: stderr.text,
					truncated: stdout.truncated || stderr.truncated || failure.outputTruncated
				}
			};
		};
		compilerOutcomeDescription = (outcome, fallbackCode) => {
			if (outcome === undefined) return `compiler result: ${String(fallbackCode)}`;
			if (outcome.outcome === "exited") return `compiler result: exit code ${String(outcome.code)}`;
			if (outcome.outcome === "timed_out") {
				if (outcome.timeoutMs === undefined) return "compiler result: timed out. The effective REA_SWIFTC_COMPILE_TIMEOUT_MS value was not reported.";
				return `compiler result: timed out after ${String(outcome.timeoutMs)} ms. ${swiftcCompileTimeoutRecovery(outcome.timeoutMs)}`;
			}
			if (outcome.outcome === "signaled") return `compiler result: stopped by signal ${outcome.signal ?? "an unknown signal"}`;
			return `compiler result: ${String(outcome.code)}`;
		};
		compilerInspectionError = (cause, timeoutMs, compiler) => {
			const facts = compilerFailureFacts(cause, timeoutMs);
			const outcome = facts?.outcome;
			const code = outcome?.code ?? "unknown";
			const description = compilerOutcomeDescription(outcome, code);
			const launcher = compiler.kind === "xcrun" ? "xcrun" : "the selected Swift compiler (REA_DARWIN_SWIFTC_PATH)";
			const prefix = code === "ENOENT" ? `macOS process ownership inspection requires the Apple Swift compiler via ${launcher}` : `macOS process ownership helper compilation failed via ${launcher}`;
			const stderr = boundedUtf8Text(outcome?.stderr ?? "", STDERR_EXCERPT_LIMIT);
			const diagnostics = stderr.text.trim();
			const truncated = stderr.truncated || outcome?.stderrTruncated === true || outcome?.outputTruncated === true;
			const truncationNote = !truncated ? "" : stderr.truncated ? `… [diagnostics truncated at ${String(STDERR_EXCERPT_LIMIT)} bytes; this release has no runtime override]` : "… [diagnostics truncated; this release has no runtime override]";
			const suffix = diagnostics ? `: ${diagnostics}${truncationNote}` : outcome === undefined ? `: ${cause instanceof Error ? cause.message : String(cause)}` : ": no compiler diagnostics were captured";
			return new DarwinProcessOwnershipInspectionError(`${prefix} (${description})${suffix}`, {
				cause,
				...facts === undefined ? {} : {
					compilerOutcome: facts.outcome,
					capturedOutput: facts.capturedOutput
				}
			});
		};
		abortReason = (signal) => {
			if (signal.reason !== undefined) return signal.reason;
			const error = new Error("The operation was aborted");
			error.name = "AbortError";
			return error;
		};
		isExpectedAbort$1 = (cause, signal) => signal.aborted && (cause === signal.reason || cause instanceof Error && cause.name === "AbortError");
		waitForCompilation = async (operation, signal) => {
			if (signal === undefined) return {
				kind: "completed",
				result: await operation.promise
			};
			return new Promise((resolve) => {
				let completed = false;
				const finish = (outcome) => {
					if (completed) return;
					completed = true;
					signal.removeEventListener("abort", onAbort);
					resolve(outcome);
				};
				const onAbort = () => {
					if (operation.primaryFailure !== undefined) return;
					finish({
						kind: "cancelled",
						reason: signal.reason
					});
				};
				signal.addEventListener("abort", onAbort, { once: true });
				void operation.promise.then((result) => finish({
					kind: "completed",
					result
				}));
				if (signal.aborted) onAbort();
			});
		};
		createDarwinProcessRunTokenReader = (options = {}) => {
			const compiler = options.compiler ?? {
				kind: "xcrun",
				executable: "/usr/bin/xcrun"
			};
			const compilerTimeoutMs = resolveSwiftcCompileTimeoutMs(options);
			const moduleCachePath = options.moduleCachePath ?? "";
			let root;
			let executable;
			let compilation;
			let closePromise;
			let closed = false;
			let exitCleanupInstalled = false;
			const activeCommands = new Set();
			const cleanupAtExit = () => {
				if (root !== undefined) rmSync(root.path, {
					recursive: true,
					force: true
				});
			};
			const cleanupRoot = (target = root) => {
				if (target === undefined) return Promise.resolve();
				target.cleanupPromise ??= Promise.resolve().then(async () => {
					try {
						await rm(target.path, {
							recursive: true,
							force: true
						});
					} catch (cause) {
						const failure = new ProviderCleanupError("process-ownership", [target.path], { reason: "The Darwin ownership helper root remains owned until removal succeeds." }, {
							cause,
							operation: "prepare_owned_process"
						});
						if (target.cleanupAnchor === undefined) target.cleanupAnchor = failure;
						else failure.bindCleanupDependencies([target.cleanupAnchor]);
						throw failure;
					}
					target.cleanupAnchor?.resolveCleanup();
					target.cleanupAnchor = undefined;
					if (root !== target) return;
					root = undefined;
					executable = undefined;
					if (exitCleanupInstalled) process.removeListener("exit", cleanupAtExit);
					exitCleanupInstalled = false;
				}).catch((cause) => {
					target.cleanupPromise = undefined;
					throw cause;
				});
				return target.cleanupPromise;
			};
			const runCompilation = async (operation) => {
				const signal = operation.controller.signal;
				let operationRoot;
				try {
					if (compiler.kind === "swiftc" && (!isAbsolute(compiler.executable) || !isAbsolute(compiler.sdkRoot))) {
						throw new DarwinProcessOwnershipInspectionError("Direct Darwin helper compilation requires absolute REA_DARWIN_SWIFTC_PATH and SDKROOT paths selecting a compatible installed Swift compiler and macOS SDK.");
					}
					operationRoot = { path: await mkdtemp(join(tmpdir(), "rea-process-token-")) };
					root = operationRoot;
					process.once("exit", cleanupAtExit);
					exitCleanupInstalled = true;
					if (signal.aborted || closed) throw abortReason(signal);
					const output = join(operationRoot.path, "reader");
					const compilerTemporary = join(operationRoot.path, "tmp");
					await mkdir(compilerTemporary);
					const compilerEnvironment = {
						...process.env,
						TMPDIR: compilerTemporary
					};
					const compilerArguments = compiler.kind === "xcrun" ? ["swiftc"] : ["-sdk", compiler.sdkRoot];
					if (compiler.kind === "swiftc") compilerEnvironment.SDKROOT = compiler.sdkRoot;
					if (moduleCachePath === "") {
						delete compilerEnvironment.CLANG_MODULE_CACHE_PATH;
					} else {
						await mkdir(moduleCachePath, { recursive: true });
						compilerArguments.push("-module-cache-path", moduleCachePath);
						compilerEnvironment.CLANG_MODULE_CACHE_PATH = moduleCachePath;
					}
					compilerArguments.push(...sourceFiles, "-o", output);
					try {
						await execFileOutput(compiler.executable, compilerArguments, {
							timeout: compilerTimeoutMs,
							maxBuffer: 1024 * 1024,
							signal,
							stopSignal: SWIFTC_INTERRUPT,
							env: compilerEnvironment
						});
					} catch (cause) {
						if (isExpectedAbort$1(cause, signal)) throw cause;
						throw compilerInspectionError(cause, compilerTimeoutMs, compiler);
					}
					if (signal.aborted || closed) throw abortReason(signal);
					executable = output;
					return output;
				} catch (cause) {
					operation.primaryFailure = { cause };
					if (operationRoot !== undefined) {
						try {
							await cleanupRoot(operationRoot);
						} catch (cleanup) {
							if (!(cleanup instanceof ProviderCleanupError)) throw cleanup;
							const primary = cause instanceof DarwinProcessOwnershipInspectionError ? cause : new DarwinProcessOwnershipInspectionError("Darwin process ownership helper preparation failed", { cause });
							throw primary.withCleanupFailure(cleanup, { close: () => cleanupRoot(operationRoot) });
						}
					}
					throw cause;
				}
			};
			const beginCompilation = () => {
				const controller = new AbortController();
				const operation = {
					controller,
					promise: Promise.resolve().then(() => runCompilation(operation)).then(ok, err).finally(() => {
						operation.settled = true;
						if (compilation === operation) compilation = undefined;
					}),
					waiters: 0,
					aborting: false,
					settled: false
				};
				compilation = operation;
				return operation;
			};
			const compile = async (signal) => {
				if (closed) throw new Error("Darwin process token reader is closed");
				signal?.throwIfAborted();
				while (true) {
					if (closed) throw new Error("Darwin process token reader is closed");
					signal?.throwIfAborted();
					if (executable !== undefined) return executable;
					if (compilation === undefined && root !== undefined) {
						await cleanupRoot();
						continue;
					}
					let operation = compilation;
					if (operation?.aborting === true) {
						const waited = await waitForCompilation(operation, signal);
						if (waited.kind === "cancelled") throw waited.reason;
						if (!waited.result.ok && waited.result.error instanceof DarwinProcessOwnershipInspectionError && waited.result.error.cleanupFailure !== undefined) throw waited.result.error;
						continue;
					}
					operation ??= beginCompilation();
					operation.waiters += 1;
					const waited = await waitForCompilation(operation, signal);
					operation.waiters -= 1;
					if (operation.waiters === 0 && !operation.settled && !operation.aborting) {
						operation.aborting = true;
						operation.controller.abort();
						const finalized = await operation.promise;
						if (waited.kind === "cancelled" && !finalized.ok && finalized.error instanceof DarwinProcessOwnershipInspectionError && finalized.error.cleanupFailure !== undefined) {
							throw new DarwinProcessOwnershipInspectionError("Darwin process ownership helper preparation was cancelled", {
								cause: waited.reason,
								cancellation: { reason: waited.reason },
								cleanupFailure: finalized.error.cleanupFailure,
								cleanupOwner: finalized.error.cleanupOwner
							});
						}
					}
					if (waited.kind === "cancelled") throw waited.reason;
					if (!waited.result.ok) throw waited.result.error;
					return waited.result.value;
				}
			};
			const runHelper = (arguments_, signal) => {
				if (closed) return Promise.reject(new Error("Darwin process token reader is closed"));
				const pending = (async () => {
					const binary = await compile(signal);
					const { stdout } = await execFileOutput(binary, arguments_, {
						timeout: 15e3,
						stopSignal: "SIGTERM",
						...signal === undefined ? {} : { signal }
					});
					signal?.throwIfAborted();
					return stdout;
				})();
				activeCommands.add(pending);
				return pending.finally(() => {
					activeCommands.delete(pending);
				});
			};
			const read = async (processes, signal) => {
				signal?.throwIfAborted();
				if (processes.length === 0) return new Map();
				const pids = processes.map(({ pid }) => String(pid));
				const stdout = await runHelper(pids, signal);
				const decoded = safeParseJson(stdout);
				if (!decoded.ok) throw new Error(`macOS process token helper returned invalid JSON: ${decoded.error}`, { cause: decoded.cause });
				const parsed = responseSchema.safeParse(decoded.value);
				if (!parsed.success) throw new Error("macOS process token helper returned an invalid response", { cause: parsed.error });
				const requested = new Set(processes.map(({ pid }) => pid));
				const observations = new Map();
				for (const result of parsed.data.results) {
					if (!requested.has(result.pid) || observations.has(result.pid)) throw new Error("macOS process token helper returned an unexpected PID set");
					observations.set(result.pid, result.state === "readable" ? {
						state: "readable",
						runId: result.run_id
					} : {
						state: "unavailable",
						reason: result.reason ?? "process token observation is unavailable"
					});
				}
				if (observations.size !== requested.size) throw new Error("macOS process token helper returned an incomplete PID set");
				return observations;
			};
			const identities = async (processes, signal) => {
				if (processes.length === 0) return new Map();
				const pids = processes.map(({ pid }) => String(pid));
				const stdout = await runHelper(["--identities", ...pids], signal);
				const decoded = safeParseJson(stdout);
				if (!decoded.ok) throw new Error(`macOS process identity helper returned invalid JSON: ${decoded.error}`, { cause: decoded.cause });
				const parsed = identityResponseSchema.safeParse(decoded.value);
				if (!parsed.success) throw new Error("macOS process identity helper returned an invalid response", { cause: parsed.error });
				const requested = new Set(processes.map(({ pid }) => pid));
				const observations = new Map();
				for (const result of parsed.data.results) {
					if (!requested.has(result.pid) || observations.has(result.pid)) throw new Error("macOS process identity helper returned an unexpected PID set");
					observations.set(result.pid, result.state === "readable" ? {
						state: "readable",
						identity: result.identity,
						...result.effective_uid === undefined ? {} : { effectiveUid: result.effective_uid },
						...result.lifecycle === undefined ? {} : { lifecycle: {
							state: "observed",
							lifecycle: result.lifecycle
						} },
						...result.relation === undefined ? {} : { relation: {
							state: "observed",
							parentPid: result.relation.parent_pid,
							processGroupId: result.relation.process_group_id
						} }
					} : result.state === "absent" ? {
						state: "absent",
						reason: result.reason
					} : {
						state: "unavailable",
						reason: result.reason
					});
				}
				if (observations.size !== requested.size) throw new Error("macOS process identity helper returned an incomplete PID set");
				return observations;
			};
			const close = () => {
				if (closePromise !== undefined) return closePromise;
				closed = true;
				const pendingClose = (async () => {
					const operation = compilation;
					if (operation !== undefined && !operation.settled) {
						operation.aborting = true;
						operation.controller.abort();
						await operation.promise;
					}
					await Promise.allSettled(activeCommands);
					await cleanupRoot();
				})().catch((cause) => {
					if (closePromise === pendingClose) closePromise = undefined;
					throw cause;
				});
				closePromise = pendingClose;
				return closePromise;
			};
			return {
				read,
				identities,
				prepare: compile,
				close
			};
		};
	})))();
}

//#endregion
//#region dist/process/ProcessRunTokenObservations.js
/** Read only ownership tokens, using per-process fallback for missing batch rows. */
async function* readProcessRunTokens(host, processes, signal) {
	signal?.throwIfAborted();
	if (processes.length === 0) return;
	let batch;
	let batchFailure;
	if (host.runTokens !== undefined) {
		try {
			batch = signal === undefined ? await host.runTokens(processes) : await host.runTokens(processes, signal);
		} catch (cause) {
			signal?.throwIfAborted();
			batchFailure = errorMessage$1(cause);
		}
	}
	for (const process of processes) {
		signal?.throwIfAborted();
		let observation = batch?.get(process.pid);
		if (observation === undefined) {
			try {
				const environment = signal === undefined ? await host.environment(process.pid) : await host.environment(process.pid, signal);
				observation = {
					state: "readable",
					runId: processRunIdFromEnvironment(environment)
				};
			} catch (cause) {
				signal?.throwIfAborted();
				const reason = errorMessage$1(cause);
				observation = {
					state: "unavailable",
					reason: batchFailure === undefined ? reason : `${reason}; run-token batch failed: ${batchFailure}`
				};
			}
		}
		signal?.throwIfAborted();
		yield {
			process,
			observation
		};
	}
}
var ProcessRunTokenReadError, errorMessage$1, processRunIdFromEnvironment;
function init_ProcessRunTokenObservations() {
	return (init_ProcessRunTokenObservations = __esmMin((() => {
		ProcessRunTokenReadError = class extends Error {
			pid;
			availability;
			reason;
			_tag = "ProcessRunTokenReadError";
			constructor(pid, availability, reason) {
				super(`Run token for PID ${String(pid)}: ${reason}`);
				this.pid = pid;
				this.availability = availability;
				this.reason = reason;
				this.name = "ProcessRunTokenReadError";
			}
		};
		errorMessage$1 = (cause) => cause instanceof Error ? cause.message : String(cause);
		processRunIdFromEnvironment = (environment) => Object.hasOwn(environment, "REA_PROCESS_RUN_ID") ? environment.REA_PROCESS_RUN_ID : undefined;
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipObservation.js
var observeOwnedProcessGroups, observeOwnedProcessLineage, observeNativeOwnedProcessLineage, classifyIdentitylessLineageRefresh, processWithNativeRelation, lineageTokenMismatchReason, unavailableLineage, parseProcessEnvironment, identityFact, readIdentityFacts, readNativeProcessIdentityMap, settleExitingProcessIdentities, readProcessOwnershipFacts, isExpectedAbort, createSystemProcessOwnershipHost, systemProcessOwnershipHost, observeProcessStartIdentity, observeProcessStartIdentityExit, signalProcessWithStartIdentity, prepareProcessOwnershipInspection, processIsGone, errorMessage;
function init_ProcessOwnershipObservation() {
	return (init_ProcessOwnershipObservation = __esmMin((() => {
		init_ProcessLifecycle();
		init_LinuxProcessStat();
		init_LinuxProcessStatus();
		init_analysisErrorCore();
		init_ProcessOwnershipIdentity();
		init_ProcessOwnershipProcessTree();
		init_ExecFileOutput();
		init_DarwinProcessRunTokenReader();
		init_ProcessRunTokenObservations();
		observeOwnedProcessGroups = async (runId, processGroupIds, host = systemProcessOwnershipHost, signal, evidenceOwner) => {
			signal?.throwIfAborted();
			const groupIds = [...new Set(processGroupIds)];
			if (groupIds.length === 0) return new Map();
			let processes;
			try {
				processes = liveProcesses(await host.listProcesses(signal));
			} catch (cause) {
				signal?.throwIfAborted();
				const failure = {
					state: "unverifiable",
					reason: `process group could not be inspected: ${errorMessage(cause)}`
				};
				return new Map(groupIds.map((groupId) => [groupId, failure]));
			}
			signal?.throwIfAborted();
			if (host.processIdentities !== undefined) {
				const observationRows = evidenceOwner?.rowsForObservation(processes) ?? processes;
				const retainedPids = new Set(evidenceOwner?.candidates.map(({ pid }) => pid) ?? []);
				const firstIdentities = await readNativeProcessIdentityMap(observationRows, host, signal);
				const uncertainGroups = new Set();
				const candidateProcesses = observationRows.filter((process) => {
					if (retainedPids.has(process.pid)) return true;
					const identity = firstIdentities.get(process.pid);
					if (identity?.state === "readable") {
						if (processIdentityHasExited(identity)) return false;
						if (identity.relation?.state === "observed" && groupIds.includes(identity.relation.processGroupId)) return true;
						if (groupIds.includes(process.processGroupId) && identity.relation?.state !== "observed") uncertainGroups.add(process.processGroupId);
						return groupIds.includes(process.processGroupId);
					}
					if (groupIds.includes(process.processGroupId)) uncertainGroups.add(process.processGroupId);
					return groupIds.includes(process.processGroupId);
				});
				const facts = await readProcessOwnershipFacts(candidateProcesses, host, signal, { identityBefore: firstIdentities });
				evidenceOwner?.reconcile(facts, {
					runId,
					listedRows: processes.length,
					listedPids: new Set(processes.map(({ pid }) => pid)),
					leaderPid: -1,
					processGroupIds: new Set(groupIds),
					scopeFacts: facts
				});
				const observations = new Map(groupIds.map((groupId) => [groupId, uncertainGroups.has(groupId) ? {
					state: "unverifiable",
					reason: "native process-group membership could not be verified"
				} : { state: "empty" }]));
				for (const fact of facts) {
					if (fact.identityAfter.state === "absent") continue;
					const nativeGroupId = fact.identityAfter.state === "readable" && fact.identityAfter.relation?.state === "observed" ? fact.identityAfter.relation.processGroupId : undefined;
					if (processIdentityHasExited(fact.identityAfter)) continue;
					const candidateGroups = groupIds.filter((groupId) => nativeGroupId === groupId || nativeGroupId === undefined && fact.process.processGroupId === groupId);
					for (const groupId of candidateGroups) {
						if (observations.get(groupId)?.state === "unverifiable") continue;
						if (fact.state !== "same-generation" || fact.identityAfter.state !== "readable" || nativeGroupId !== groupId) {
							observations.set(groupId, {
								state: "unverifiable",
								reason: `native process-group membership could not be revalidated for PID ${String(fact.process.pid)}`
							});
							continue;
						}
						if (fact.token.state !== "readable" || fact.token.runId !== runId) {
							observations.set(groupId, {
								state: "unverifiable",
								reason: fact.token.state === "unavailable" ? `process ownership could not be revalidated for PID ${String(fact.process.pid)}: ${fact.token.reason}` : "process ownership did not match"
							});
							continue;
						}
						observations.set(groupId, { state: "alive" });
					}
				}
				signal?.throwIfAborted();
				return observations;
			}
			const membersByGroup = new Map(groupIds.map((groupId) => [groupId, []]));
			for (const process of processes) membersByGroup.get(process.processGroupId)?.push(process);
			const observations = new Map(groupIds.map((groupId) => [groupId, (membersByGroup.get(groupId)?.length ?? 0) > 0 ? { state: "alive" } : { state: "empty" }]));
			const liveMembers = groupIds.flatMap((groupId) => membersByGroup.get(groupId) ?? []);
			const pendingGroups = new Set(groupIds.filter((groupId) => (membersByGroup.get(groupId)?.length ?? 0) > 0));
			for await (const { process: member, observation } of readProcessRunTokens(host, liveMembers, signal)) {
				if (!pendingGroups.has(member.processGroupId)) continue;
				if (observation.state === "readable") {
					if (observation.runId !== runId) {
						observations.set(member.processGroupId, {
							state: "unverifiable",
							reason: "process ownership did not match"
						});
						pendingGroups.delete(member.processGroupId);
					}
				} else {
					const gone = await processIsGone(host, member.pid, signal);
					signal?.throwIfAborted();
					if (!gone) {
						observations.set(member.processGroupId, {
							state: "unverifiable",
							reason: `process ownership could not be revalidated for PID ${member.pid}: ${observation.reason}`
						});
						pendingGroups.delete(member.processGroupId);
					}
				}
				if (pendingGroups.size === 0) break;
			}
			signal?.throwIfAborted();
			return observations;
		};
		observeOwnedProcessLineage = async (ownership, host = systemProcessOwnershipHost) => {
			let processes;
			try {
				processes = liveProcesses(await host.listProcesses());
			} catch (cause) {
				return unavailableLineage(ownership, `process table could not be inspected: ${errorMessage(cause)}`);
			}
			if (host.processIdentities !== undefined) return observeNativeOwnedProcessLineage(ownership, processes, host);
			const launcher = processes.find(({ pid }) => pid === ownership.leaderPid);
			if (launcher === undefined) return unavailableLineage(ownership, "owned launcher is not live");
			const identityFailure = launcherIdentityFailure(launcher, ownership);
			if (identityFailure !== null) return unavailableLineage(ownership, identityFailure);
			const descendants = descendantsOf([launcher.pid], processes);
			const verifiedDescendants = [];
			const initialTree = new Set(descendants.map(({ pid }) => pid));
			const initialRelations = new Map();
			const examinedRefresh = new Map();
			for (const process of processes) {
				if (process.pid === launcher.pid) continue;
				const relation = {
					parentPid: process.parentPid,
					processGroupId: process.processGroupId,
					inTree: initialTree.has(process.pid),
					tokenChecked: false,
					descendant: undefined
				};
				initialRelations.set(process.pid, relation);
				examinedRefresh.set(process.pid, relation);
			}
			let refreshDescendants = [];
			let suppressedRefreshPids = new Set();
			let latestRefreshPids;
			for await (const { process: member, observation } of readProcessRunTokens(host, [launcher, ...descendants])) {
				if (observation.state === "readable") {
					if (observation.runId !== ownership.runId) return unavailableLineage(ownership, lineageTokenMismatchReason(member.pid, observation.runId));
					if (member.pid !== launcher.pid) verifiedDescendants.push(member);
					const seeded = examinedRefresh.get(member.pid);
					if (seeded !== undefined) examinedRefresh.set(member.pid, {
						...seeded,
						tokenChecked: true
					});
				} else {
					let refreshed;
					try {
						refreshed = liveProcesses(await host.listProcesses());
					} catch (cause) {
						void cause;
						return unavailableLineage(ownership, `process ownership could not be revalidated for PID ${member.pid}: ${observation.reason}`);
					}
					if (refreshed.some((process) => process.pid === member.pid)) return unavailableLineage(ownership, `process ownership could not be revalidated for PID ${member.pid}: ${observation.reason}`);
					if (member.pid === launcher.pid) return unavailableLineage(ownership, "owned launcher exited during lineage validation");
					const classified = await classifyIdentitylessLineageRefresh(ownership, launcher.pid, refreshed, host, examinedRefresh, initialRelations);
					if (classified.status === "unavailable") return unavailableLineage(ownership, classified.reason);
					refreshDescendants = classified.descendants;
					suppressedRefreshPids = new Set(classified.suppressedPids);
					latestRefreshPids = new Set(refreshed.map(({ pid }) => pid));
				}
			}
			return {
				status: "verified",
				observedAt: new Date().toISOString(),
				lineage: {
					runId: ownership.runId,
					launcherPid: launcher.pid,
					launcherParentPid: launcher.parentPid,
					processGroupId: launcher.processGroupId,
					descendants: [...verifiedDescendants.filter(({ pid }) => (latestRefreshPids === undefined || latestRefreshPids.has(pid)) && !suppressedRefreshPids.has(pid) && !refreshDescendants.some((descendant) => descendant.pid === pid)), ...refreshDescendants].sort((left, right) => left.pid - right.pid).map(({ pid, parentPid, processGroupId }) => ({
						pid,
						parentPid,
						processGroupId
					}))
				}
			};
		};
		observeNativeOwnedProcessLineage = async (ownership, processes, host) => {
			const initialIdentities = await readNativeProcessIdentityMap(processes, host);
			const launcher = processes.find(({ pid }) => pid === ownership.leaderPid);
			const launcherIdentity = launcher === undefined ? undefined : initialIdentities.get(launcher.pid);
			const nativeLauncher = launcher !== undefined && launcherIdentity?.state === "readable" && !processIdentityHasExited(launcherIdentity) ? processWithNativeRelation(launcher, launcherIdentity) : undefined;
			const identityFailure = nativeLauncher === undefined ? null : launcherIdentityFailure(nativeLauncher, ownership);
			const candidateProcesses = processes.map((process) => {
				const identity = initialIdentities.get(process.pid);
				const nativeProcess = identity?.state === "readable" ? processWithNativeRelation(process, identity) : undefined;
				return nativeProcess ?? process;
			});
			const descendants = descendantsOf([ownership.leaderPid], candidateProcesses);
			const lineageRows = [...launcher === undefined ? [] : [launcher], ...descendants];
			const nativeExitedPids = new Set(processes.filter(({ pid }) => processIdentityHasExited(initialIdentities.get(pid))).map(({ pid }) => pid));
			const candidates = lineageRows.filter(({ pid }) => !nativeExitedPids.has(pid));
			const facts = await readProcessOwnershipFacts(candidates, host, undefined, { identityBefore: initialIdentities });
			ownership.evidenceOwner?.reconcile(facts, {
				runId: ownership.runId,
				listedRows: processes.length,
				listedPids: new Set(processes.map(({ pid }) => pid)),
				leaderPid: ownership.leaderPid,
				processGroupIds: new Set([ownership.processGroupId, ...ownership.sampledProcessGroupIds ?? []]),
				allowCapturedScope: identityFailure === null,
				nativeExitedPids,
				unverifiedLineageRelations: new Map(lineageRows.map(({ pid, parentPid, processGroupId }) => [pid, {
					parentPid,
					processGroupId
				}]))
			});
			if (launcher === undefined) return unavailableLineage(ownership, "owned launcher is not live");
			if (launcherIdentity?.state === "absent") return unavailableLineage(ownership, "owned launcher is not live");
			if (launcherIdentity?.state !== "readable") return unavailableLineage(ownership, `owned launcher identity could not be read: ${launcherIdentity?.reason ?? "identity observation was omitted"}`);
			if (processIdentityHasExited(launcherIdentity)) return unavailableLineage(ownership, "owned launcher is not live");
			if (nativeLauncher === undefined) return unavailableLineage(ownership, "owned launcher native parent/group relation was unavailable");
			if (identityFailure !== null) return unavailableLineage(ownership, identityFailure);
			const factsByPid = new Map(facts.map((fact) => [fact.process.pid, fact]));
			const verifiedDescendants = [];
			let currentLauncher = nativeLauncher;
			for (const member of candidates) {
				const fact = factsByPid.get(member.pid);
				if (fact === undefined) return unavailableLineage(ownership, `native process facts were unavailable for PID ${String(member.pid)}`);
				if (fact.state === "absent") {
					if (member.pid === ownership.leaderPid) return unavailableLineage(ownership, "owned launcher exited during lineage validation");
					continue;
				}
				if (fact.state !== "same-generation") return unavailableLineage(ownership, `process identity changed or became unavailable during lineage validation for PID ${String(member.pid)}`);
				if (processIdentityHasExited(fact.identityAfter)) {
					if (member.pid === ownership.leaderPid) return unavailableLineage(ownership, "owned launcher exited during lineage validation");
					continue;
				}
				if (fact.token.state !== "readable") return unavailableLineage(ownership, `process ownership could not be revalidated for PID ${String(member.pid)}: ${fact.token.reason}`);
				if (fact.token.runId !== ownership.runId) return unavailableLineage(ownership, lineageTokenMismatchReason(member.pid, fact.token.runId));
				const nativeMember = processWithNativeRelation(fact.process, fact.identityAfter);
				if (nativeMember === undefined) return unavailableLineage(ownership, `native process relation was unavailable for PID ${String(member.pid)}`);
				if (member.pid === ownership.leaderPid) {
					const failure = launcherIdentityFailure(nativeMember, ownership);
					if (failure !== null) return unavailableLineage(ownership, failure);
					currentLauncher = nativeMember;
					continue;
				}
				verifiedDescendants.push(nativeMember);
			}
			const currentDescendantPids = new Set(descendantsOf([ownership.leaderPid], [currentLauncher, ...verifiedDescendants]).map(({ pid }) => pid));
			const moved = verifiedDescendants.find(({ pid }) => !currentDescendantPids.has(pid));
			if (moved !== undefined) return unavailableLineage(ownership, `process lineage relation changed during validation for PID ${String(moved.pid)}`);
			return {
				status: "verified",
				observedAt: new Date().toISOString(),
				lineage: {
					runId: ownership.runId,
					launcherPid: ownership.leaderPid,
					launcherParentPid: currentLauncher.parentPid,
					processGroupId: currentLauncher.processGroupId,
					descendants: verifiedDescendants.sort((left, right) => left.pid - right.pid).map(({ pid, parentPid, processGroupId }) => ({
						pid,
						parentPid,
						processGroupId
					}))
				}
			};
		};
		classifyIdentitylessLineageRefresh = async (ownership, launcherPid, refreshed, host, examined, initialRelations) => {
			const refreshedLauncher = refreshed.find((process) => process.pid === launcherPid);
			if (refreshedLauncher === undefined) return {
				status: "unavailable",
				reason: "owned launcher exited during lineage validation"
			};
			for await (const { observation } of readProcessRunTokens(host, [refreshedLauncher])) {
				if (observation.state !== "readable") return {
					status: "unavailable",
					reason: `process ownership could not be revalidated for PID ${String(launcherPid)}: ${observation.reason}`
				};
				if (observation.runId !== ownership.runId) return {
					status: "unavailable",
					reason: lineageTokenMismatchReason(launcherPid, observation.runId)
				};
			}
			const identityFailure = launcherIdentityFailure(refreshedLauncher, ownership);
			if (identityFailure !== null) return {
				status: "unavailable",
				reason: identityFailure
			};
			const inTree = new Set(descendantsOf([launcherPid], refreshed).map(({ pid }) => pid));
			const due = refreshed.filter((process) => {
				if (process.pid === launcherPid) return false;
				const previous = examined.get(process.pid);
				return previous === undefined || previous.tokenChecked || previous.parentPid !== process.parentPid || previous.processGroupId !== process.processGroupId || previous.inTree !== inTree.has(process.pid);
			});
			if (due.length > 0) {
				const included = new Map();
				const ownedOutside = [];
				for await (const { process, observation } of readProcessRunTokens(host, due)) {
					if (observation.state !== "readable") return {
						status: "unavailable",
						reason: `process ownership could not be revalidated for PID ${String(process.pid)}: ${observation.reason}`
					};
					if (observation.runId !== ownership.runId) {
						if (inTree.has(process.pid)) return {
							status: "unavailable",
							reason: lineageTokenMismatchReason(process.pid, observation.runId)
						};
						continue;
					}
					if (inTree.has(process.pid)) included.set(process.pid, process);
					else ownedOutside.push(process.pid);
				}
				if (ownedOutside.length > 0) return {
					status: "unavailable",
					reason: `process lineage refresh contained owned PID(s) outside the observed descendants: ${ownedOutside.sort((left, right) => left - right).join(", ")}`
				};
				for (const process of due) examined.set(process.pid, {
					parentPid: process.parentPid,
					processGroupId: process.processGroupId,
					inTree: inTree.has(process.pid),
					tokenChecked: true,
					descendant: included.get(process.pid)
				});
			}
			const livePids = new Set(refreshed.map(({ pid }) => pid));
			for (const pid of examined.keys()) if (!livePids.has(pid)) examined.delete(pid);
			const suppressedPids = [...examined.keys()].filter((pid) => {
				const seed = initialRelations.get(pid);
				const entry = examined.get(pid);
				return seed !== undefined && entry !== undefined && (seed.parentPid !== entry.parentPid || seed.processGroupId !== entry.processGroupId || seed.inTree !== entry.inTree);
			});
			return {
				status: "classified",
				descendants: [...examined.values()].flatMap((entry) => entry.descendant === undefined ? [] : [entry.descendant]),
				suppressedPids
			};
		};
		processWithNativeRelation = (process, identity) => identity.state === "readable" && identity.relation?.state === "observed" ? {
			...process,
			parentPid: identity.relation.parentPid,
			processGroupId: identity.relation.processGroupId
		} : undefined;
		lineageTokenMismatchReason = (pid, observedRunId) => observedRunId === undefined ? `REA_PROCESS_RUN_ID was absent from the readable environment for PID ${String(pid)}; process lineage ownership remains unverified` : "process lineage contains an unowned or PID-reused process";
		unavailableLineage = (ownership, reason) => ({
			status: "unavailable",
			observedAt: new Date().toISOString(),
			runId: ownership.runId,
			launcherPid: ownership.leaderPid,
			processGroupId: ownership.processGroupId,
			reason
		});
		parseProcessEnvironment = (value) => {
			const environment = Object.create(null);
			for (const entry of value.split("\0")) {
				const separator = entry.indexOf("=");
				if (separator > 0) environment[entry.slice(0, separator)] = entry.slice(separator + 1);
			}
			return environment;
		};
		identityFact = (observations, pid, phase, failure) => observations?.get(pid) ?? {
			state: "unavailable",
			reason: failure ?? `process identity was not returned during ${phase} observation`
		};
		readIdentityFacts = async (processes, host, phase, signal, credentialPids) => {
			signal?.throwIfAborted();
			if (host.processIdentities === undefined) return new Map(processes.map(({ pid }) => [pid, {
				state: "unavailable",
				reason: "process identity inspection is unsupported"
			}]));
			try {
				const observations = await host.processIdentities(processes, signal, credentialPids);
				signal?.throwIfAborted();
				return new Map(processes.map(({ pid }) => [pid, identityFact(observations, pid, phase)]));
			} catch (cause) {
				signal?.throwIfAborted();
				const reason = errorMessage(cause);
				return new Map(processes.map(({ pid }) => [pid, identityFact(undefined, pid, phase, reason)]));
			}
		};
		readNativeProcessIdentityMap = async (processes, host, signal) => readIdentityFacts(processes, host, "before", signal);
		settleExitingProcessIdentities = async (processes, host, initial, signal, budget = { deadline: undefined }, credentialPids) => {
			signal?.throwIfAborted();
			let pending = processes.filter(({ pid }) => processIdentityIsExiting(initial.get(pid)));
			if (pending.length === 0) return initial;
			const identities = new Map(initial);
			const deadline = budget.deadline ??= performance.now() + PROCESS_CLEANUP_VERIFICATION_GRACE_MS;
			while (pending.length > 0) {
				const remaining = deadline - performance.now();
				if (remaining <= 0) break;
				try {
					await setTimeout(Math.min(25, remaining), undefined, signal === undefined ? undefined : { signal });
				} catch (cause) {
					signal?.throwIfAborted();
					throw cause;
				}
				const refreshed = await readIdentityFacts(pending, host, "before", signal, credentialPids);
				for (const { pid } of pending) identities.set(pid, identityFact(refreshed, pid, "after"));
				pending = pending.filter(({ pid }) => {
					const first = initial.get(pid);
					const current = identities.get(pid);
					return first?.state === "readable" && current?.state === "readable" && processIdentityIsExiting(current) && current.identity === first.identity;
				});
			}
			signal?.throwIfAborted();
			return identities;
		};
		readProcessOwnershipFacts = async (processes, host, signal, options = {}) => {
			signal?.throwIfAborted();
			if (processes.length === 0) return [];
			const identityBefore = options.identityBefore === undefined ? await readIdentityFacts(processes, host, "before", signal) : new Map(processes.map(({ pid }) => [pid, identityFact(options.identityBefore, pid, "before")]));
			signal?.throwIfAborted();
			const tokens = new Map();
			try {
				for await (const { process, observation } of readProcessRunTokens(host, processes, signal)) {
					signal?.throwIfAborted();
					tokens.set(process.pid, observation);
				}
			} catch (cause) {
				signal?.throwIfAborted();
				const reason = errorMessage(cause);
				for (const { pid } of processes) if (!tokens.has(pid)) tokens.set(pid, {
					state: "unavailable",
					reason
				});
			}
			signal?.throwIfAborted();
			const credentialPids = new Set(processes.filter(({ pid }) => tokens.get(pid)?.state !== "readable").map(({ pid }) => pid));
			const observedAfter = await readIdentityFacts(processes, host, "after", signal, credentialPids);
			const identityAfter = await settleExitingProcessIdentities(processes, host, observedAfter, signal, options.exitSettlement, credentialPids);
			signal?.throwIfAborted();
			const deriveFact = (process, observation) => {
				const before = identityBefore.get(process.pid) ?? {
					state: "unavailable",
					reason: "process identity was not returned during before observation"
				};
				const after = observation ?? {
					state: "unavailable",
					reason: "process identity was not returned during after observation"
				};
				const token = tokens.get(process.pid) ?? {
					state: "unavailable",
					reason: "process token was not returned"
				};
				const state = after.state === "absent" ? "absent" : before.state === "readable" && after.state === "readable" ? before.identity === after.identity ? "same-generation" : "replaced" : before.state === "absent" && after.state === "readable" ? "replaced" : "unavailable";
				return {
					process,
					state,
					identityBefore: before,
					token,
					identityAfter: after
				};
			};
			const facts = processes.map((process) => {
				const after = identityAfter.get(process.pid);
				const original = observedAfter.get(process.pid);
				const fact = deriveFact(process, after);
				return after === original ? fact : {
					...fact,
					beforeExitSettlement: deriveFact(process, original)
				};
			});
			signal?.throwIfAborted();
			return facts;
		};
		isExpectedAbort = (cause, signal) => signal?.aborted === true && (cause === signal.reason || cause instanceof Error && cause.name === "AbortError");
		createSystemProcessOwnershipHost = (platform = process.platform, hostEnvironment = process.env, options = {}) => {
			const darwinModuleCachePath = options.darwinModuleCachePath ?? hostEnvironment.REA_DARWIN_MODULE_CACHE_PATH;
			const swiftcPath = hostEnvironment.REA_DARWIN_SWIFTC_PATH;
			const darwinCompiler = options.darwinCompiler ?? (swiftcPath === undefined || swiftcPath === "" ? undefined : {
				kind: "swiftc",
				executable: swiftcPath,
				sdkRoot: hostEnvironment.SDKROOT ?? ""
			});
			const darwinTokens = platform === "darwin" ? createDarwinProcessRunTokenReader({
				...darwinCompiler === undefined ? {} : { compiler: darwinCompiler },
				...darwinModuleCachePath === undefined ? {} : { moduleCachePath: darwinModuleCachePath },
				...options.compileTimeoutMs === undefined ? { environment: hostEnvironment } : { compileTimeoutMs: options.compileTimeoutMs }
			}) : undefined;
			const listProcesses = async (signal) => {
				if (platform === "win32") return [];
				const { stdout } = await execFileOutput("ps", ["-axo", "pid=,ppid=,pgid=,uid=,stat=,command="], {
					env: hostEnvironment,
					stopSignal: "SIGTERM",
					...signal === undefined ? {} : { signal }
				});
				return stdout.split("\n").map((line) => /\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.*)/u.exec(line)).filter((match) => match !== null).map((match) => ({
					pid: Number(match[1]),
					parentPid: Number(match[2]),
					processGroupId: Number(match[3]),
					uid: Number(match[4]),
					state: match[5] ?? "",
					command: match[6] ?? ""
				}));
			};
			const processIdentities = async (processes, signal, credentialPids) => {
				if (processes.length === 0) return new Map();
				if (platform === "linux") return new Map(await Promise.all(processes.map(async ({ pid }) => {
					if (!Number.isSafeInteger(pid) || pid <= 0) return [pid, {
						state: "unavailable",
						reason: "invalid_process_id"
					}];
					try {
						const stat$1 = await readFile(`/proc/${String(pid)}/stat`, {
							encoding: "utf8",
							...signal === undefined ? {} : { signal }
						});
						const parsed = parseLinuxProcessStat(stat$1);
						if (parsed === undefined || parsed.pid !== pid) return [pid, {
							state: "unavailable",
							reason: "malformed_proc_stat"
						}];
						const readableIdentity = (facts, effectiveUid, environmentRestriction) => ({
							state: "readable",
							identity: `linux-starttime:${facts.startTime}`,
							...effectiveUid === undefined ? {} : { effectiveUid },
							...environmentRestriction === undefined ? {} : { environmentRestriction },
							lifecycle: facts.lifecycle === undefined ? {
								state: "unavailable",
								reason: "malformed_proc_flags"
							} : {
								state: "observed",
								lifecycle: facts.lifecycle
							},
							relation: facts.processGroupId < 0 ? {
								state: "unavailable",
								reason: "proc_stat_relation_unavailable"
							} : {
								state: "observed",
								parentPid: facts.parentPid,
								processGroupId: facts.processGroupId
							}
						});
						if (!credentialPids?.has(pid)) return [pid, readableIdentity(parsed)];
						let status;
						try {
							status = await readFile(`/proc/${String(pid)}/status`, {
								encoding: "utf8",
								...signal === undefined ? {} : { signal }
							});
						} catch (cause) {
							if (isExpectedAbort(cause, signal)) throw cause;
							return [pid, readableIdentity(parsed)];
						}
						signal?.throwIfAborted();
						const uids = parseLinuxProcessIds(status, "Uid");
						if (uids === undefined) return [pid, readableIdentity(parsed)];
						let procfsOwnerUid;
						try {
							procfsOwnerUid = (await stat(`/proc/${String(pid)}/environ`)).uid;
						} catch (cause) {
							void cause;
						}
						signal?.throwIfAborted();
						const environmentRestriction = linuxEnvironmentRestriction({
							uids,
							gids: parseLinuxProcessIds(status, "Gid"),
							procfsOwnerUid,
							callerUid: process.geteuid?.(),
							callerGid: process.getegid?.()
						});
						let afterStatus;
						try {
							afterStatus = await readFile(`/proc/${String(pid)}/stat`, {
								encoding: "utf8",
								...signal === undefined ? {} : { signal }
							});
						} catch (cause) {
							if (isExpectedAbort(cause, signal)) throw cause;
							return [pid, readableIdentity(parsed)];
						}
						signal?.throwIfAborted();
						const verified = parseLinuxProcessStat(afterStatus);
						if (verified !== undefined && verified.pid === pid && verified.startTime !== parsed.startTime) return [pid, {
							state: "unavailable",
							reason: "process_identity_changed_during_uid_observation"
						}];
						if (verified === undefined || verified.pid !== pid) return [pid, readableIdentity(parsed)];
						return [pid, readableIdentity(verified, uids[1], environmentRestriction)];
					} catch (cause) {
						if (isExpectedAbort(cause, signal)) throw cause;
						if (cause instanceof Error && "code" in cause && (cause.code === "ENOENT" || cause.code === "ESRCH")) {
							signal?.throwIfAborted();
							let presenceProbeFailure;
							let presenceProbeSucceeded = false;
							try {
								presenceProbeSucceeded = process.kill(pid, 0);
							} catch (probeCause) {
								presenceProbeFailure = probeCause;
							}
							signal?.throwIfAborted();
							if (presenceProbeFailure instanceof Error && "code" in presenceProbeFailure && presenceProbeFailure.code === "ESRCH") return [pid, {
								state: "absent",
								reason: "not-found-in-caller-pid-namespace"
							}];
							return [pid, {
								state: "unavailable",
								reason: presenceProbeFailure === undefined && presenceProbeSucceeded ? "proc_stat_missing_but_process_signal_probe_succeeded" : presenceProbeFailure === undefined ? "proc_stat_missing_and_process_signal_probe_returned_false" : `proc_stat_missing_and_process_signal_probe_failed: ${errorMessage(presenceProbeFailure)}`
							}];
						}
						return [pid, {
							state: "unavailable",
							reason: errorMessage(cause)
						}];
					}
				})));
				if (darwinTokens === undefined) return new Map();
				try {
					return await darwinTokens.identities(processes, signal);
				} catch (cause) {
					if (isExpectedAbort(cause, signal)) throw cause;
					const reason = errorMessage(cause);
					return new Map(processes.map(({ pid }) => [pid, {
						state: "unavailable",
						reason
					}]));
				}
			};
			const captureBaseline = async (signal) => {
				if (platform !== "linux" && darwinTokens === undefined) return [];
				const processes = liveProcesses(await listProcesses(signal));
				let identities = await processIdentities(processes, signal);
				const unreadable = processes.filter(({ pid }) => identities.get(pid)?.state !== "readable");
				if (unreadable.length > 0) {
					const stillLive = liveProcesses(await listProcesses(signal)).filter(({ pid }) => unreadable.some((entry) => entry.pid === pid));
					const retried = await processIdentities(stillLive, signal);
					identities = new Map([...identities, ...retried]);
					const unresolved = stillLive.filter(({ pid }) => identities.get(pid)?.state !== "readable");
					const liveAfterRetry = liveProcesses(await listProcesses(signal));
					const stillUnresolved = unresolved.filter(({ pid }) => liveAfterRetry.some((entry) => entry.pid === pid));
					if (stillUnresolved.length > 0) throw new Error(`process identity snapshot is unavailable for ${String(stillUnresolved.length)} live processes`);
				}
				return processes.map(({ pid }) => {
					const observation = identities.get(pid);
					return {
						pid,
						identity: observation?.state === "readable" ? observation.identity : null
					};
				});
			};
			return {
				platform,
				prepare: async (signal) => {
					await darwinTokens?.prepare(signal);
					if (platform === "linux") {
						try {
							const processes = await listProcesses(signal);
							if (!processes.some(({ pid }) => pid === process.pid)) throw new Error("ps did not report REA's current process");
						} catch (cause) {
							if (isExpectedAbort(cause, signal)) throw cause;
							const reason = `Linux process ownership inspection requires a procps-compatible ps on REA's PATH before launching a child: ${errorMessage(cause)}`;
							throw new AnalysisCapabilityUnavailableError("process-ownership", "prepare_owned_process", reason, {
								cause,
								userMessage: reason
							});
						}
					}
				},
				listProcesses,
				async environment(pid, signal) {
					signal?.throwIfAborted();
					if (platform === "linux") return parseProcessEnvironment(await readFile(`/proc/${pid}/environ`, {
						encoding: "utf8",
						signal
					}));
					if (platform === "darwin") {
						const process = (await listProcesses(signal)).find((entry) => entry.pid === pid);
						if (process === undefined) throw new ProcessRunTokenReadError(pid, "absent", "process_not_in_snapshot");
						const observation = (await darwinTokens?.read([process], signal))?.get(pid);
						if (observation === undefined || observation.state === "unavailable") throw new ProcessRunTokenReadError(pid, observation?.reason === "process_not_in_snapshot" ? "absent" : "unavailable", observation?.reason ?? "process run token could not be read");
						const environment = Object.create(null);
						if (observation.runId !== undefined) environment.REA_PROCESS_RUN_ID = observation.runId;
						return environment;
					}
					const { stdout } = await execFileOutput("ps", [
						"eww",
						"-p",
						String(pid)
					], {
						env: hostEnvironment,
						stopSignal: "SIGTERM",
						...signal === undefined ? {} : { signal }
					});
					const observedEnvironment = Object.create(null);
					for (const match of stdout.matchAll(/(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=([^\s]*)/gu)) {
						const name = match[1];
						if (name !== undefined) observedEnvironment[name] = match[2] ?? "";
					}
					return observedEnvironment;
				},
				async runTokens(processes, signal) {
					signal?.throwIfAborted();
					if (platform !== "darwin" || processes.length === 0) return new Map();
					try {
						return await darwinTokens?.read(processes, signal) ?? new Map();
					} catch (cause) {
						if (isExpectedAbort(cause, signal)) throw cause;
						void cause;
						return new Map(processes.map(({ pid }) => [pid, {
							state: "unavailable",
							reason: "reader_failure"
						}]));
					}
				},
				...platform !== "linux" && darwinTokens === undefined ? {} : {
					processIdentities,
					captureBaseline,
					...darwinTokens === undefined ? {} : { close: darwinTokens.close }
				},
				signalGroup(processGroupId, signal) {
					process.kill(-processGroupId, signal);
				}
			};
		};
		systemProcessOwnershipHost = createSystemProcessOwnershipHost();
		observeProcessStartIdentity = async (pid, host = systemProcessOwnershipHost, expectedRunId) => {
			const process = (await host.listProcesses()).find((entry) => entry.pid === pid);
			if (process === undefined || liveProcesses([process]).length === 0) return undefined;
			if (host.processIdentities === undefined) return {
				state: "unavailable",
				reason: "process identity is unsupported"
			};
			const identity = (await host.processIdentities([process])).get(pid) ?? {
				state: "unavailable",
				reason: "process identity was not returned"
			};
			if (expectedRunId === undefined || identity.state !== "readable") return identity;
			let owned = false;
			for await (const { observation } of readProcessRunTokens(host, [process])) {
				if (observation.state === "unavailable") return {
					state: "unavailable",
					reason: `process ownership token could not be read for PID ${String(pid)}: ${observation.reason}`
				};
				if (observation.runId !== expectedRunId) return {
					state: "unavailable",
					reason: `process ownership token did not match the captured run for PID ${String(pid)}`
				};
				owned = true;
			}
			if (!owned) return {
				state: "unavailable",
				reason: `process ownership token was not returned for PID ${String(pid)}`
			};
			const confirmed = await observeProcessStartIdentity(pid, host);
			if (confirmed === undefined || confirmed.state !== "readable") return confirmed;
			return confirmed.identity === identity.identity ? identity : {
				state: "unavailable",
				reason: `process identity changed while validating the captured run token for PID ${String(pid)}`
			};
		};
		observeProcessStartIdentityExit = async (pid, expectedIdentity, host = systemProcessOwnershipHost) => {
			try {
				const observed = await observeProcessStartIdentity(pid, host);
				if (observed === undefined) return "exited";
				if (observed.state !== "readable") return "unverified";
				return observed.identity === expectedIdentity ? "present" : "exited";
			} catch {
				return "unverified";
			}
		};
		signalProcessWithStartIdentity = async (pid, expectedIdentity, signal, options = {}) => {
			const host = options.host ?? systemProcessOwnershipHost;
			try {
				const observed = await observeProcessStartIdentity(pid, host);
				if (observed === undefined) return "gone";
				if (observed.state !== "readable") return "unverified";
				if (observed.identity !== expectedIdentity) return "identity-changed";
				(options.sendSignal ?? process.kill)(pid, signal);
				return "signaled";
			} catch {
				return "unverified";
			}
		};
		prepareProcessOwnershipInspection = async (signal) => {
			await systemProcessOwnershipHost.prepare?.(signal);
		};
		processIsGone = async (host, pid, signal) => {
			try {
				const processes = signal === undefined ? await host.listProcesses() : await host.listProcesses(signal);
				return !liveProcesses(processes).some((process) => process.pid === pid);
			} catch (cause) {
				signal?.throwIfAborted();
				void cause;
				return false;
			}
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/process/ProcessOwnershipEvidence.js
var ProcessOwnershipEvidenceOwner;
function init_ProcessOwnershipEvidence() {
	return (init_ProcessOwnershipEvidence = __esmMin((() => {
		init_ProcessLifecycle();
		ProcessOwnershipEvidenceOwner = class {
			#candidates = new Map();
			#snapshotCount = 0;
			#coverage = {
				snapshotCount: 0,
				listedRows: 0,
				examinedPids: 0,
				retainedOnlyPids: 0,
				retainedOwned: 0,
				retainedUnresolved: 0,
				uncertainPids: [],
				processTableCoverage: "unreported-by-host"
			};
			get candidates() {
				return [...this.#candidates.values()];
			}
			get coverage() {
				return this.#coverage;
			}
			/**
			* Reconcile facts from one explicit snapshot. Unrelated transient rows are
			* never retained; unknown related candidates remain evidence, not authority.
			*/
			reconcile(facts, options) {
				this.#snapshotCount += 1;
				const factsByPid = new Map(facts.map((fact) => [fact.process.pid, fact]));
				const sameGeneration = new Map();
				const sameGenerationBefore = new Map();
				const tokenMatchedPids = new Set();
				const uncertainPids = new Set();
				const retiredPids = new Set();
				for (const fact of facts) {
					if (fact.state !== "same-generation") continue;
					if (fact.identityAfter.state !== "readable") continue;
					sameGeneration.set(fact.process.pid, fact.identityAfter);
					if (fact.identityBefore.state === "readable" && fact.identityBefore.identity === fact.identityAfter.identity) sameGenerationBefore.set(fact.process.pid, fact.identityBefore);
					if (fact.token.state === "readable" && fact.token.runId === options.runId) tokenMatchedPids.add(fact.process.pid);
				}
				const findScopeEvidence = (pid, generations, tokenOwners) => {
					let unverifiedRelation = false;
					const relationFor = (candidatePid) => {
						const identity = generations.get(candidatePid);
						if (identity?.relation?.state === "observed") return identity.relation;
						const fallback = options.unverifiedLineageRelations?.get(candidatePid);
						if (fallback === undefined) return undefined;
						const current = sameGeneration.get(candidatePid);
						if (current?.relation?.state === "observed") {
							if (identity === undefined) unverifiedRelation = true;
							return current.relation;
						}
						unverifiedRelation = true;
						return fallback;
					};
					const scoped = (evidence) => unverifiedRelation ? "unverified-table-relation" : evidence;
					const relation = relationFor(pid);
					if (relation === undefined) return undefined;
					if (options.allowCapturedScope !== false && options.processGroupIds.has(relation.processGroupId)) return scoped("captured-process-group-id");
					const visited = new Set([pid]);
					let parentPid = relation.parentPid;
					while (!visited.has(parentPid)) {
						const parent = generations.get(parentPid);
						const previousParent = this.#candidates.get(parentPid);
						if (parent !== undefined && (tokenOwners.has(parentPid) || previousParent?.applicability === "token-verified" && parent.identity === previousParent.identity)) return scoped("current-token-owned-parent");
						if (options.allowCapturedScope !== false && parentPid === options.leaderPid) return scoped("capture-leader-pid");
						visited.add(parentPid);
						const parentRelation = relationFor(parentPid);
						if (parentRelation === undefined) return undefined;
						parentPid = parentRelation.parentPid;
					}
					return undefined;
				};
				const scopeGenerations = new Map();
				const scopeBeforeGenerations = new Map();
				const scopeOwnedPids = new Set();
				for (const observed of options.scopeFacts ?? facts) {
					const fact = observed.beforeExitSettlement ?? observed;
					if (fact.state !== "same-generation" || fact.identityAfter.state !== "readable") continue;
					scopeGenerations.set(fact.process.pid, fact.identityAfter);
					if (fact.identityBefore.state === "readable" && fact.identityAfter.identity === fact.identityBefore.identity) scopeBeforeGenerations.set(fact.process.pid, fact.identityBefore);
					const previous = this.#candidates.get(fact.process.pid);
					if (fact.token.state === "readable" && fact.token.runId === options.runId || previous?.applicability === "token-verified" && previous.identity === fact.identityAfter.identity) scopeOwnedPids.add(fact.process.pid);
				}
				const related = (pid) => {
					const current = findScopeEvidence(pid, sameGeneration, tokenMatchedPids) ?? findScopeEvidence(pid, sameGenerationBefore, tokenMatchedPids);
					if (current !== undefined) return current;
					const original = scopeGenerations.get(pid);
					if (original === undefined || sameGeneration.get(pid)?.identity !== original.identity) return undefined;
					const initial = findScopeEvidence(pid, scopeGenerations, scopeOwnedPids) ?? findScopeEvidence(pid, scopeBeforeGenerations, scopeOwnedPids);
					return initial === undefined ? undefined : "previously-related-generation";
				};
				for (const [pid, previous] of this.#candidates) {
					if (options.nativeExitedPids?.has(pid)) {
						this.#candidates.delete(pid);
						retiredPids.add(pid);
						continue;
					}
					const fact = factsByPid.get(pid);
					if (fact === undefined) continue;
					if (fact.state === "absent" || fact.state === "replaced" || previous.identity !== undefined && fact.identityAfter.state === "readable" && fact.identityAfter.identity !== previous.identity || processIdentityHasExited(fact.identityAfter)) {
						this.#candidates.delete(pid);
						retiredPids.add(pid);
						continue;
					}
					if (fact.state !== "same-generation") {
						uncertainPids.add(pid);
						continue;
					}
					const identity = fact.identityAfter;
					if (identity.state !== "readable") {
						uncertainPids.add(pid);
						continue;
					}
					const matched = fact.token.state === "readable" && fact.token.runId === options.runId;
					if (previous.identity === undefined && !matched) {
						uncertainPids.add(pid);
						this.#candidates.set(pid, {
							...previous,
							process: fact.process,
							token: fact.token,
							...fact.token.state === "unavailable" ? { diagnostic: fact.token.reason } : {}
						});
						continue;
					}
					const relation = identity.relation?.state === "observed" ? {
						state: "observed",
						parentPid: identity.relation.parentPid,
						processGroupId: identity.relation.processGroupId
					} : undefined;
					this.#candidates.set(pid, {
						pid,
						identity: identity.identity,
						process: fact.process,
						applicability: matched || previous.applicability === "token-verified" ? "token-verified" : "related-ownership-unresolved",
						scopeEvidence: matched || previous.applicability === "token-verified" ? "run-token" : related(pid) ?? "previously-related-generation",
						token: fact.token,
						relation,
						...fact.token.state === "unavailable" ? { diagnostic: fact.token.reason } : {}
					});
				}
				for (const fact of facts) {
					const pid = fact.process.pid;
					const matched = fact.token.state === "readable" && fact.token.runId === options.runId;
					const unresolvedReplacement = fact.state === "replaced" && matched;
					if (this.#candidates.has(pid) || retiredPids.has(pid) && fact.state !== "same-generation" && !unresolvedReplacement || fact.state === "absent" || fact.state === "replaced" && !matched || processIdentityHasExited(fact.identityAfter)) continue;
					const identity = fact.identityAfter;
					if (fact.state !== "same-generation" || identity.state !== "readable") {
						if (options.allowCapturedScope === false && !matched && related(pid) === undefined) continue;
						this.#candidates.set(pid, {
							pid,
							identity: undefined,
							process: fact.process,
							applicability: "identity-unresolved",
							scopeEvidence: "native-identity-unresolved",
							token: fact.token,
							relation: undefined,
							...fact.token.state === "unavailable" ? { diagnostic: fact.token.reason } : {}
						});
						uncertainPids.add(pid);
						continue;
					}
					const unresolvedScope = matched ? undefined : related(pid);
					if (!matched && unresolvedScope === undefined) continue;
					const relation = identity.relation?.state === "observed" ? {
						state: "observed",
						parentPid: identity.relation.parentPid,
						processGroupId: identity.relation.processGroupId
					} : undefined;
					this.#candidates.set(pid, {
						pid,
						identity: identity.identity,
						process: fact.process,
						applicability: matched ? "token-verified" : "related-ownership-unresolved",
						scopeEvidence: matched ? "run-token" : unresolvedScope ?? "previously-related-generation",
						token: fact.token,
						relation,
						...fact.token.state === "unavailable" ? { diagnostic: fact.token.reason } : {}
					});
				}
				const retainedOnlyPids = [...this.#candidates.keys()].filter((pid) => !options.listedPids.has(pid));
				this.#coverage = {
					snapshotCount: this.#snapshotCount,
					listedRows: options.listedRows,
					examinedPids: facts.length,
					retainedOnlyPids: retainedOnlyPids.length,
					retainedOwned: [...this.#candidates.values()].filter(({ applicability }) => applicability === "token-verified").length,
					retainedUnresolved: [...this.#candidates.values()].filter(({ applicability }) => applicability !== "token-verified").length,
					uncertainPids: [...uncertainPids].sort((left, right) => left - right),
					processTableCoverage: "unreported-by-host"
				};
				return this.candidates;
			}
			/** Merge current discovery rows with retained candidates without PID-only proof. */
			rowsForObservation(processes) {
				const byPid = new Map(processes.map((process) => [process.pid, process]));
				for (const candidate of this.#candidates.values()) if (!byPid.has(candidate.pid)) byPid.set(candidate.pid, candidate.process);
				return [...byPid.values()];
			}
		};
	})))();
}

//#endregion
export { DarwinProcessOwnershipInspectionError, PROCESS_CLEANUP_VERIFICATION_GRACE_MS, ProcessOwnershipEvidenceOwner, ProcessRunTokenReadError, SWIFTC_INTERRUPT, boundedUtf8Text, descendantsOf, errorMessage, init_DarwinProcessRunTokenReader, init_LinuxProcessStat, init_ProcessLifecycle, init_ProcessOwnershipEvidence, init_ProcessOwnershipIdentity, init_ProcessOwnershipObservation, init_ProcessOwnershipProcessTree, init_ProcessRunTokenObservations, init_boundedUtf8Text, launcherIdentityFailure, liveProcesses, observeOwnedProcessGroups, observeOwnedProcessLineage, observeProcessStartIdentity, observeProcessStartIdentityExit, parseLinuxProcessStat, prepareProcessOwnershipInspection, processIdentityHasExited, processIdentityIsExiting, processRunIdFromEnvironment, readNativeProcessIdentityMap, readProcessOwnershipFacts, readProcessRunTokens, selectCapturedProcessGroupIds, settleExitingProcessIdentities, signalProcessWithStartIdentity, systemProcessOwnershipHost };