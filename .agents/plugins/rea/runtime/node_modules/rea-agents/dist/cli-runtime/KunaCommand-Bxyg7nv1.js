import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_binaryTargetTypes, init_inputIssueProjection, init_safeJson, isMachOFormat, projectInputIssues, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisError, AnalysisProtocolError, AnalysisResourceConstraintError, AnalysisTimeoutError, ConfigurationError, err, fixedProducerInputAllowance, init_analysisErrorBase, init_analysisErrorCore, init_configurationErrors, init_fixedAllowanceRemediation, init_jsonValue, init_result, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { ProviderAdapterError, hopperStartupExitCode, init_analysisErrorProjection, init_hopperStartupFailure, init_providerAdapterError, isHopperStartupFailureCode, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, NonRegularFileReadError, RegularFileCancelled, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile, regularFileCancellation, withOwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { ArtifactFileCleanupFailure, artifactFileCompletion, artifactFilePrimaryFacts, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation, mapArtifactFileFailure, withArtifactFileHandle, withArtifactRegularFile } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { DarwinProcessOwnershipInspectionError, boundedUtf8Text, init_DarwinProcessRunTokenReader, init_boundedUtf8Text } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-CIerZEwx.js";
import { ProviderProcessSupervisor, init_ProviderProcess, spawnOwnedProviderProcess } from "./ProviderProcess-DdOAhfXm.js";
import { cleanupOwnedProcessGroup, init_ProcessOwnership } from "./ProcessOwnership-BIq-8nU3.js";
import { OwnedCommandFailure, init_OwnedCommand, prepareOwnedCommand, runOwnedCommand } from "./OwnedCommand-BzzUKKpJ.js";
import { PrivateRuntimeRoot, init_PrivateRuntimeRoot } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { init_snapshotEnvironment, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-CgrzFhoH.js";
import { hashStableFile, init_StableFileHash, observeStableFile, stableFileHashCause } from "./StableFileHash-DxZbYqOI.js";
import { init_binaryTarget, parseExecutableHeader, readFatArchitectureFamilies } from "./godotPckFormat-BQCRCg8e.js";
import { RegularFileCapacityError, init_readStableFileBytes, readStableFileBytes, readStableFilePrefix } from "./readStableFileBytes-BbBj-t4y.js";
import { analysisClientFailureForOperation, ghidraFileFailure, init_AnalysisClientFailure, init_GhidraFileArtifacts, init_OwnedCommandCleanup, retainOwnedCommandCleanup } from "./OwnedCommandCleanup-BGs5-QvP.js";
import { defaultKunaCacheDirectory, init_kunaCacheDirectory } from "./kunaCacheDirectory-DDt35WsX.js";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { basename, delimiter, dirname, isAbsolute, join, normalize, posix, win32 } from "node:path";
import { access, open, realpath, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { accessSync, constants, createReadStream, createWriteStream, realpathSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { Transform } from "node:stream";

//#region dist/hopper/LinuxPrivateDisplayDiagnostic.js
var LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX, diagnosticContextSchema, failureCodeSchema, diagnosticSchema, parseLinuxPrivateDisplayDiagnostic;
function init_LinuxPrivateDisplayDiagnostic() {
	return (init_LinuxPrivateDisplayDiagnostic = __esmMin((() => {
		init_hopperStartupFailure();
		init_safeJson();
		LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX = "REA_X11_DIAGNOSTIC=";
		diagnosticContextSchema = z.object({
			component: z.literal("hopper_private_display"),
			operation: z.enum(["probe", "launch"]),
			reason: z.string().regex(/^[a-z0-9_]+$/u),
			socket_directory: z.literal("/tmp/.X11-unix"),
			socket_directory_mode: z.string().regex(/^[0-7]{4}$/u).nullable(),
			mount_read_only: z.boolean().nullable(),
			effective_socket_directory_mode: z.string().regex(/^[0-7]{4}$/u).nullable(),
			effective_mount_read_only: z.boolean().nullable(),
			wsl: z.boolean(),
			strategy: z.enum([
				"direct",
				"user-mount-namespace",
				"unavailable"
			]),
			fallback_reason: z.string().regex(/^[a-z0-9_]+$/u).nullable(),
			xvfb_stderr_bytes: z.int().nonnegative().safe()
		});
		failureCodeSchema = z.string().transform((value, context) => {
			if (isHopperStartupFailureCode(value)) return value;
			context.addIssue({
				code: "custom",
				message: "Unknown startup failure code"
			});
			return z.NEVER;
		});
		diagnosticSchema = z.discriminatedUnion("status", [diagnosticContextSchema.extend({
			status: z.literal("ready"),
			failure_code: z.null()
		}).strict(), diagnosticContextSchema.extend({
			status: z.literal("error"),
			failure_code: failureCodeSchema
		}).strict()]);
		parseLinuxPrivateDisplayDiagnostic = (stderr) => {
			const records = stderr.split("\n").filter((line) => line.startsWith(LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX));
			if (records.length === 0) return {
				ok: false,
				reason: "diagnostic_missing"
			};
			if (records.length !== 1) return {
				ok: false,
				reason: "diagnostic_multiple"
			};
			const record = records[0];
			if (record === undefined) return {
				ok: false,
				reason: "diagnostic_missing"
			};
			const decoded = safeParseJson(record.slice(LINUX_PRIVATE_DISPLAY_DIAGNOSTIC_PREFIX.length));
			if (!decoded.ok) return {
				ok: false,
				reason: "diagnostic_malformed"
			};
			const parsed = diagnosticSchema.safeParse(decoded.value);
			if (!parsed.success) return {
				ok: false,
				reason: "diagnostic_malformed"
			};
			return {
				ok: true,
				value: parsed.data
			};
		};
	})))();
}

//#endregion
//#region dist/hopper/LinuxPrivateDisplayProbe.js
var PYTHON_PATH, UNSHARE_PATH, DEFAULT_PROBE_TIMEOUT_MS, isAborted, selectLinuxPrivateDisplayStrategy, runLinuxPrivateDisplayProbe, privateDisplayProbeCommand, evaluatedProbe, exitMatchesDiagnostic, syntheticDiagnostic, unavailable, emptyProcessResult, waitForProbeOutputClose;
function init_LinuxPrivateDisplayProbe() {
	return (init_LinuxPrivateDisplayProbe = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_hopperStartupFailure();
		init_ProcessOwnership();
		init_ProviderProcess();
		init_LinuxPrivateDisplayDiagnostic();
		PYTHON_PATH = "/usr/bin/python3";
		UNSHARE_PATH = "/usr/bin/unshare";
		DEFAULT_PROBE_TIMEOUT_MS = 5e3;
		isAborted = (signal) => signal?.aborted === true;
		selectLinuxPrivateDisplayStrategy = async (options) => {
			const timeoutMs = options.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
			const runner = options.runProbe ?? runLinuxPrivateDisplayProbe;
			const direct = await evaluatedProbe("direct", options, timeoutMs, runner);
			if (direct.ok) return direct;
			if (direct.diagnostic.failure_code !== "x11_socket_directory_unusable") return unavailable(direct.diagnostic, direct.cleanup);
			const isolated = await evaluatedProbe("user-mount-namespace", options, timeoutMs, runner);
			if (!isolated.ok) return unavailable({
				...direct.diagnostic,
				strategy: "unavailable",
				reason: "namespace_unavailable",
				fallback_reason: isolated.diagnostic.reason,
				effective_socket_directory_mode: isolated.diagnostic.effective_socket_directory_mode,
				effective_mount_read_only: isolated.diagnostic.effective_mount_read_only,
				xvfb_stderr_bytes: isolated.diagnostic.xvfb_stderr_bytes
			}, isolated.cleanup);
			return {
				ok: true,
				strategy: "user-mount-namespace",
				diagnostic: {
					...isolated.diagnostic,
					socket_directory_mode: direct.diagnostic.socket_directory_mode,
					mount_read_only: direct.diagnostic.mount_read_only,
					fallback_reason: null
				}
			};
		};
		runLinuxPrivateDisplayProbe = async (strategy, options) => {
			if (isAborted(options.signal)) return emptyProcessResult("cancelled");
			const command = privateDisplayProbeCommand(options.helperPath, strategy);
			let started;
			try {
				started = await spawnOwnedProviderProcess({
					command: command.command,
					arguments: command.arguments,
					runId: randomUUID(),
					expectedCommand: null,
					...options.environment === undefined ? {} : { hostEnvironment: options.environment },
					...options.signal === undefined ? {} : { signal: options.signal }
				});
			} catch (cause) {
				void cause;
				return emptyProcessResult(isAborted(options.signal) ? "cancelled" : "launch-failed");
			}
			const launch = {
				process: started.process,
				ownsProcessLifetime: true,
				cleanup: () => cleanupOwnedProcessGroup(started.ownership)
			};
			const supervisor = new ProviderProcessSupervisor(launch);
			const outcome = await waitForProbeOutputClose(supervisor, options.timeoutMs, options.signal);
			let cleanup = { status: "released" };
			if (outcome !== "exit") {
				const lease = new AnalysisCleanupLease(async () => {
					const stopped = await supervisor.stop();
					if (stopped.status === "incomplete") throw new Error(stopped.reason);
					if (stopped.status === "not-owned") throw new Error("Private-display probe ownership remains unresolved");
					supervisor.dispose();
				}, [`hopper-private-display-probe:${started.ownership.runId}`]);
				try {
					await lease.release();
				} catch (cause) {
					cleanup = {
						status: "pending",
						lease,
						reason: cause instanceof Error ? cause.message : String(cause)
					};
				}
			} else supervisor.dispose();
			const snapshot = supervisor.snapshot();
			return {
				outcome: outcome === "exit" ? "exited" : outcome === "timeout" ? "timed-out" : "cancelled",
				exitCode: snapshot.exitCode,
				stderr: snapshot.stderr.text,
				stderrBytes: snapshot.stderr.bytes,
				cleanup
			};
		};
		privateDisplayProbeCommand = (helperPath, strategy) => strategy === "direct" ? {
			command: PYTHON_PATH,
			arguments: [
				helperPath,
				"--probe",
				"--strategy",
				"direct"
			]
		} : {
			command: UNSHARE_PATH,
			arguments: [
				"--user",
				"--map-root-user",
				"--mount",
				"--propagation",
				"private",
				PYTHON_PATH,
				helperPath,
				"--probe",
				"--strategy",
				"user-mount-namespace",
				"--mount-private-x11"
			]
		};
		evaluatedProbe = async (strategy, options, timeoutMs, runner) => {
			let processResult;
			try {
				processResult = await runner(strategy, {
					helperPath: options.helperPath,
					...options.environment === undefined ? {} : { environment: options.environment },
					timeoutMs,
					...options.signal === undefined ? {} : { signal: options.signal }
				});
			} catch (cause) {
				void cause;
				return {
					ok: false,
					diagnostic: syntheticDiagnostic(strategy, "probe_failed")
				};
			}
			const cleanup = processResult.cleanup.status === "pending" ? processResult.cleanup : undefined;
			const failed = (reason) => ({
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, reason),
				...cleanup === undefined ? {} : { cleanup }
			});
			if (processResult.outcome === "cancelled") return failed("cancelled");
			if (processResult.outcome === "timed-out") return failed("probe_timeout");
			if (processResult.outcome === "launch-failed") return failed("probe_failed");
			if (cleanup !== undefined) return failed("cleanup_incomplete");
			const parsed = parseLinuxPrivateDisplayDiagnostic(processResult.stderr);
			if (!parsed.ok) return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, parsed.reason)
			};
			const diagnostic = parsed.value;
			if (diagnostic.strategy !== strategy || diagnostic.operation !== "probe" || !exitMatchesDiagnostic(processResult.exitCode, diagnostic)) return {
				ok: false,
				diagnostic: syntheticDiagnostic(strategy, "diagnostic_malformed")
			};
			return diagnostic.status === "ready" ? {
				ok: true,
				strategy,
				diagnostic
			} : {
				ok: false,
				diagnostic
			};
		};
		exitMatchesDiagnostic = (exitCode, diagnostic) => diagnostic.status === "ready" ? exitCode === 0 : hopperStartupExitCode(diagnostic.failure_code) === exitCode;
		syntheticDiagnostic = (strategy, reason, failureCode = "private_display_unavailable") => ({
			component: "hopper_private_display",
			operation: "probe",
			status: "error",
			failure_code: failureCode,
			reason,
			socket_directory: "/tmp/.X11-unix",
			socket_directory_mode: null,
			mount_read_only: null,
			effective_socket_directory_mode: null,
			effective_mount_read_only: null,
			wsl: false,
			strategy,
			fallback_reason: null,
			xvfb_stderr_bytes: 0
		});
		unavailable = (diagnostic, cleanup) => ({
			ok: false,
			strategy: "unavailable",
			exitCode: hopperStartupExitCode(diagnostic.failure_code) ?? 70,
			diagnostic: {
				...diagnostic,
				strategy: "unavailable"
			},
			...cleanup === undefined ? {} : { cleanup }
		});
		emptyProcessResult = (outcome) => ({
			outcome,
			exitCode: undefined,
			stderr: "",
			stderrBytes: 0,
			cleanup: { status: "released" }
		});
		waitForProbeOutputClose = async (supervisor, timeoutMs, signal) => {
			if (signal?.aborted === true) return "cancelled";
			let releaseAbort;
			const aborted = new Promise((resolve) => {
				if (signal === undefined) return;
				const listener = () => resolve("cancelled");
				signal.addEventListener("abort", listener, { once: true });
				releaseAbort = () => signal.removeEventListener("abort", listener);
			});
			try {
				return await Promise.race([supervisor.waitForOutputClose(Math.max(1, timeoutMs)).then((closed) => closed ? "exit" : "timeout"), aborted]);
			} finally {
				releaseAbort?.();
			}
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraJavaProbe.js
var JAVA_PROBE_MAX_OUTPUT_BYTES, JAVA_DIAGNOSTIC_STREAM_BYTES, capturedProbeOutput, executablePath$1, probeGhidraJava, observeGhidraJava, systemCode, probeFailureError, parseGhidraJavaOutput, javaProperty, javaMajor;
function init_GhidraJavaProbe() {
	return (init_GhidraJavaProbe = __esmMin((() => {
		init_OwnedCommandCleanup();
		init_AnalysisClientFailure();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_analysisErrorCleanup();
		init_jsonValue();
		init_DarwinProcessRunTokenReader();
		init_OwnedCommand();
		init_boundedUtf8Text();
		init_result();
		JAVA_PROBE_MAX_OUTPUT_BYTES = 1024 * 1024;
		JAVA_DIAGNOSTIC_STREAM_BYTES = 8192;
		capturedProbeOutput = (observed) => {
			const stdout = boundedUtf8Text(observed.stdout.text, JAVA_DIAGNOSTIC_STREAM_BYTES);
			const stderr = boundedUtf8Text(observed.stderr.text, JAVA_DIAGNOSTIC_STREAM_BYTES);
			return {
				stdout: stdout.text,
				stderr: stderr.text,
				truncated: stdout.truncated || stderr.truncated || observed.diagnosticTruncated === true || observed.outputIncomplete === true,
				stdout_bytes: observed.stdout.observedBytes,
				stderr_bytes: observed.stderr.observedBytes,
				exit_code: observed.exitCode ?? null,
				signal: observed.signal ?? null
			};
		};
		executablePath$1 = (path) => {
			try {
				accessSync(path, constants.X_OK);
				return statSync(path).isFile();
			} catch {
				return false;
			}
		};
		probeGhidraJava = async (command, environment, options) => {
			try {
				return await options.resourceOwner.run(() => observeGhidraJava(command, environment, options));
			} catch (cause) {
				return err(analysisClientFailureForOperation(cause, "ghidra", "ghidra:java"));
			}
		};
		observeGhidraJava = async (command, environment, options) => {
			let interpreted;
			try {
				await prepareOwnedCommand(options.signal);
				await runOwnedCommand({
					command,
					arguments: [
						"-Dstdout.encoding=UTF-8",
						"-Dstderr.encoding=UTF-8",
						"-Dsun.stdout.encoding=UTF-8",
						"-Dsun.stderr.encoding=UTF-8",
						"-XX:-UsePerfData",
						"-XshowSettings:properties",
						"-version"
					],
					runId: randomUUID(),
					expectedCommand: null,
					hostEnvironment: environment,
					sweepTokenOwnedProcesses: true
				}, {
					timeoutMs: options.timeoutMs ?? 5e3,
					diagnosticBytes: JAVA_PROBE_MAX_OUTPUT_BYTES,
					acceptNonZeroExit: true,
					observeCompleted: (snapshot) => {
						interpreted = parseGhidraJavaOutput(command, snapshot);
					}
				}, {
					signal: options.signal,
					...options.launcher === undefined ? {} : { launcher: options.launcher }
				});
				if (interpreted === undefined) throw new Error("Java command completed without an output observation");
				return interpreted;
			} catch (cause) {
				const commandFailure = cause instanceof OwnedCommandFailure ? cause : undefined;
				const preparation = commandFailure?.preparationFailure ?? (cause instanceof DarwinProcessOwnershipInspectionError ? cause : undefined);
				const output = commandFailure?.snapshot === undefined || commandFailure.snapshot === null ? preparation?.capturedOutput : capturedProbeOutput(commandFailure.snapshot);
				if (interpreted !== undefined && !interpreted.ok && commandFailure?.cancellation !== undefined) Object.defineProperty(interpreted.error, "cancellation", { value: commandFailure.cancellation });
				const cleanups = retainOwnedCommandCleanup(cause, options.resourceOwner, "ghidra", "ghidra:java");
				let primary;
				if (interpreted !== undefined && !interpreted.ok) {
					if (cleanups.length === 0) return interpreted;
					primary = probeFailureError(interpreted.error, cause);
				} else if (commandFailure?.reason === "cancelled" && commandFailure.cancellation !== undefined) {
					primary = new AnalysisCancelledError("ghidra:java", {
						cause: commandFailure.cancellation.reason,
						...output === undefined ? {} : { capturedOutput: output },
						...interpreted?.ok === true ? { diagnostics: { java_observation: jsonValueSchema.parse(interpreted.value) } } : {}
					});
				} else if (interpreted?.ok === true && commandFailure?.cleanupOwner !== undefined) {
					primary = new ProviderAdapterError("ghidra", "ghidra:java", {
						cause,
						...output === undefined ? {} : { capturedOutput: output },
						diagnostics: {
							java_observation: jsonValueSchema.parse(interpreted.value),
							stage: "cleanup",
							...commandFailure.cancellation === undefined ? {} : { cancellation_observed: true }
						}
					});
				} else if (preparation !== undefined) {
					primary = new ProviderAdapterError("ghidra", "ghidra:java", {
						cause,
						...output === undefined ? {} : { capturedOutput: output },
						diagnostics: {
							stage: "ownership_preparation",
							...preparation.compilerOutcome === undefined ? {} : { compiler_outcome: jsonValueSchema.parse(preparation.compilerOutcome) }
						}
					});
				} else if (cause instanceof AnalysisError) {
					primary = cause;
				}
				if (primary === undefined) {
					const code = commandFailure?.reason === "timeout" ? "ETIMEDOUT" : commandFailure?.reason === "output-limit" ? "ENOBUFS" : systemCode(commandFailure?.processError ?? cause);
					const failed = {
						_tag: "GhidraJavaProbeFailure",
						code: code === "ENOENT" ? "runtime_missing" : "runtime_unavailable",
						detail: `${command}: ${cause instanceof Error ? cause.message : String(cause)}`,
						...code === undefined ? {} : { processErrorCode: code },
						...output === undefined ? {} : { output }
					};
					if (commandFailure?.cancellation !== undefined) Object.defineProperty(failed, "cancellation", { value: commandFailure.cancellation });
					if (cleanups.length === 0) return err(failed);
					primary = probeFailureError(failed, cause);
				}
				for (const cleanup of cleanups) primary = analysisErrorWithCleanupFailure(primary, cleanup, "ghidra:java").bindCleanupDependencies([primary, cleanup]);
				return err(primary);
			}
		};
		systemCode = (cause) => cause instanceof Error && "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
		probeFailureError = (failure, cause) => {
			const { output, ...facts } = failure;
			return new ProviderAdapterError("ghidra", "ghidra:java", {
				cause,
				...output === undefined ? {} : { capturedOutput: output },
				diagnostics: {
					java_probe_failure: jsonValueSchema.parse(facts),
					...failure.cancellation === undefined ? {} : { cancellation_observed: true }
				}
			});
		};
		parseGhidraJavaOutput = (command, observed) => {
			if (observed.exitCode !== 0 || observed.signal !== null) return err({
				_tag: "GhidraJavaProbeFailure",
				code: "runtime_unavailable",
				detail: `${command}: Java exited ${String(observed.exitCode)}${observed.signal == null ? "" : ` (${observed.signal})`}`,
				output: capturedProbeOutput(observed)
			});
			const output = `${observed.stdout.text}\n${observed.stderr.text}`;
			const version = javaProperty(output, "java.version") || null;
			const home = javaProperty(output, "java.home") || null;
			const vmName = javaProperty(output, "java.vm.name");
			const osArch = javaProperty(output, "os.arch");
			const osName = javaProperty(output, "os.name");
			const reportedBits = javaProperty(output, "sun.arch.data.model");
			const parsedBits = reportedBits !== null && /^\d+$/.test(reportedBits) ? Number(reportedBits) : null;
			const bits = parsedBits !== null && Number.isSafeInteger(parsedBits) ? parsedBits : null;
			const major = version === null ? undefined : javaMajor(version);
			if (version === null || home === null || major === undefined) return err({
				_tag: "GhidraJavaProbeFailure",
				code: "version_unresolved",
				detail: `${command}: successful Java probe did not establish a valid java.version and nonempty java.home`,
				output: capturedProbeOutput(observed),
				properties: {
					version,
					home,
					vmName,
					osArch,
					osName,
					bits
				}
			});
			return ok({
				version,
				major,
				home,
				...vmName === null ? {} : { vmName },
				...osArch === null ? {} : { osArch },
				...osName === null ? {} : { osName },
				bits,
				...reportedBits === null || bits !== null ? {} : { unparsedBits: reportedBits },
				runtime: executablePath$1((process.platform === "win32" ? win32 : posix).join(home, "bin", process.platform === "win32" ? "javac.exe" : "javac")) ? "jdk" : "jre"
			});
		};
		javaProperty = (output, name) => new RegExp(`^[ \\t]*${name.replaceAll(".", "\\.")}[ \\t]*=[ \\t]*([^\\r\\n]*?)[ \\t]*\\r?$`, "mu").exec(output)?.[1] ?? null;
		javaMajor = (version) => {
			const legacy = /^1\.([1-8])(?:\.[0-9]+)*(?:_[0-9]+)?(?:-[-a-zA-Z0-9.]+)?$/u.exec(version);
			if (legacy?.[1] !== undefined) return Number(legacy[1]);
			const modern = /^(?<number>[1-9][0-9]*(?:(?:\.0)*\.[1-9][0-9]*)*)(?:(?:-[a-zA-Z0-9]+)?\+(?<build>0|[1-9][0-9]*)(?:-[-a-zA-Z0-9.]+)?|-[a-zA-Z0-9]+(?:-[-a-zA-Z0-9.]+)?|\+-[-a-zA-Z0-9.]+)?$/u.exec(version);
			const number = modern?.groups?.number;
			if (number === undefined) return undefined;
			const parts = number.split(".").map(Number);
			const build = modern?.groups?.build;
			if ([...parts, ...build === undefined ? [] : [Number(build)]].some((value) => !Number.isSafeInteger(value) || value > 2147483647)) return undefined;
			return parts[0];
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraExecutableHeader.js
var GHIDRA_EXECUTABLE_HEADER_BYTES, readGhidraExecutableHeader;
function init_GhidraExecutableHeader() {
	return (init_GhidraExecutableHeader = __esmMin((() => {
		init_result();
		init_analysisErrorCore();
		init_ArtifactFileOperation();
		init_readStableFileBytes();
		init_GhidraFileArtifacts();
		GHIDRA_EXECUTABLE_HEADER_BYTES = 4096;
		readGhidraExecutableHeader = async (path, options) => {
			let completedHeader;
			try {
				return ok(await options.resourceOwner.run(() => withArtifactRegularFile(path, { retain: (resource) => options.resourceOwner.retain({ close: () => resource.lease.release() }, resource.resource) }, options.signal, async ({ handle: file }) => {
					const observed = await readStableFilePrefix(file, path, GHIDRA_EXECUTABLE_HEADER_BYTES, {
						symlinks: "follow",
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					if (observed.size > BigInt(Number.MAX_SAFE_INTEGER)) throw new AnalysisResourceConstraintError("ghidra:installation", "file-size", "Executable extent cannot be represented exactly by the header parser", {
						maximum_bytes: Number.MAX_SAFE_INTEGER,
						observed_bytes: observed.size.toString()
					}, {
						diagnostics: {
							path,
							stage: "native_decompiler_header"
						},
						retryable: false
					});
					completedHeader = {
						bytes: observed.bytes,
						size: Number(observed.size)
					};
					return completedHeader;
				}, "follow")));
			} catch (cause) {
				return err(ghidraFileFailure(cause, "ghidra:installation", {
					path,
					stage: "native_decompiler_header",
					...completedHeader === undefined ? {} : { completed_header: {
						file_bytes: completedHeader.size,
						examined_bytes: completedHeader.bytes.length,
						prefix_sha256: createHash("sha256").update(completedHeader.bytes).digest("hex")
					} }
				}));
			}
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraJavaProperties.js
/** Join odd-backslash continuations while stripping leading continuation space. */
function* logicalPropertyLines(content) {
	let physicalStart = 0;
	let logical = "";
	let continuing = false;
	while (physicalStart <= content.length) {
		let physicalEnd = physicalStart;
		while (physicalEnd < content.length && content[physicalEnd] !== "\n" && content[physicalEnd] !== "\r") physicalEnd += 1;
		let line = content.slice(physicalStart, physicalEnd);
		let leading = 0;
		while (isPropertyWhitespace(line[leading])) leading += 1;
		const comment = !continuing && (line[leading] === "#" || line[leading] === "!");
		if (continuing) line = line.slice(leading);
		let continued = false;
		if (!comment) {
			let slashes = 0;
			for (let index = line.length - 1; index >= 0 && line[index] === "\\"; index -= 1) slashes += 1;
			continued = slashes % 2 === 1;
			logical += continued ? line.slice(0, -1) : line;
		}
		if (!continued) {
			yield logical;
			logical = "";
		}
		continuing = continued;
		if (physicalEnd === content.length) break;
		physicalStart = content[physicalEnd] === "\r" && content[physicalEnd + 1] === "\n" ? physicalEnd + 2 : physicalEnd + 1;
	}
	if (continuing) yield logical;
}
var parseGhidraJavaProperties, isPropertyWhitespace, decodePropertyEscapes;
function init_GhidraJavaProperties() {
	return (init_GhidraJavaProperties = __esmMin((() => {
		parseGhidraJavaProperties = (content) => {
			const values = new Map();
			for (const line of logicalPropertyLines(content)) {
				let start = 0;
				while (isPropertyWhitespace(line[start])) start += 1;
				if (start === line.length || line[start] === "#" || line[start] === "!") continue;
				let end = start;
				let escaped = false;
				while (end < line.length) {
					const character = line[end];
					if (!escaped && (character === "=" || character === ":" || isPropertyWhitespace(character))) break;
					if (character === "\\") escaped = !escaped;
					else escaped = false;
					end += 1;
				}
				let valueStart = end;
				while (isPropertyWhitespace(line[valueStart])) valueStart += 1;
				if (line[valueStart] === "=" || line[valueStart] === ":") valueStart += 1;
				while (isPropertyWhitespace(line[valueStart])) valueStart += 1;
				const key = decodePropertyEscapes(line.slice(start, end));
				if (!key.ok) return key;
				const value = decodePropertyEscapes(line.slice(valueStart));
				if (!value.ok) return value;
				values.set(key.value, value.value);
			}
			return {
				ok: true,
				value: values
			};
		};
		isPropertyWhitespace = (value) => value === " " || value === "	" || value === "\f";
		decodePropertyEscapes = (value) => {
			let result = "";
			for (let index = 0; index < value.length; index += 1) {
				const character = value[index];
				if (character !== "\\") {
					result += character;
					continue;
				}
				const escaped = value[++index];
				if (escaped === undefined) return {
					ok: false,
					error: "Trailing escape in Java properties value"
				};
				if (escaped === "t") result += "	";
				else if (escaped === "n") result += "\n";
				else if (escaped === "r") result += "\r";
				else if (escaped === "f") result += "\f";
				else if (escaped === "u") {
					const digits = value.slice(index + 1, index + 5);
					if (digits.length !== 4 || !/^[0-9a-f]{4}$/iu.test(digits)) return {
						ok: false,
						error: "Malformed Unicode escape in Java properties file"
					};
					result += String.fromCharCode(Number.parseInt(digits, 16));
					index += 4;
				} else result += escaped;
			}
			return {
				ok: true,
				value: result
			};
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraReleasePolicy.js
var SUPPORTED_GHIDRA_VERSION, SUPPORTED_GHIDRA_JAVA_MAJOR, GHIDRA_RELEASE_PATTERN, ghidraReleaseCompatibility, unverifiedGhidraBuildLimitation, ghidraReleaseLine, ghidraVersionDetail, ghidraReleaseAccepted, verifiedGhidraRelease, parseGhidraRelease, ghidraConfigurationVersion, integerGroup;
function init_GhidraReleasePolicy() {
	return (init_GhidraReleasePolicy = __esmMin((() => {
		SUPPORTED_GHIDRA_VERSION = "12.1.4";
		SUPPORTED_GHIDRA_JAVA_MAJOR = 21;
		GHIDRA_RELEASE_PATTERN = /^(\d+)\.(\d+)(?:\.(\d+))?([-+].*)?$/u;
		ghidraReleaseCompatibility = (raw) => {
			if (raw === null || raw === undefined) return {
				status: "unresolved",
				raw: null
			};
			const version = parseGhidraRelease(raw);
			if (version === undefined) return {
				status: "unresolved",
				raw
			};
			if (raw === "12.1.4") return {
				status: "verified",
				version,
				raw
			};
			const verified = verifiedGhidraRelease();
			return version.major === verified.major && version.minor === verified.minor ? {
				status: "compatible",
				version,
				raw
			} : {
				status: "unsupported",
				version,
				raw
			};
		};
		unverifiedGhidraBuildLimitation = (providerVersion) => {
			const compatibility = ghidraReleaseCompatibility(providerVersion);
			if (compatibility.status !== "compatible") return undefined;
			return `This session uses Ghidra ${providerVersion}. The bridge is verified against ${SUPPORTED_GHIDRA_VERSION}; other ${ghidraReleaseLine()} builds are accepted and the observed version is reported.`;
		};
		ghidraReleaseLine = () => {
			const verified = verifiedGhidraRelease();
			return `${String(verified.major)}.${String(verified.minor)}.x`;
		};
		ghidraVersionDetail = (raw) => {
			const compatibility = ghidraReleaseCompatibility(raw);
			switch (compatibility.status) {
				case "unresolved": return compatibility.raw ?? "unknown";
				case "verified": return compatibility.raw;
				case "compatible": return `${compatibility.raw}; compatible ${ghidraReleaseLine()} release (verified build ${SUPPORTED_GHIDRA_VERSION})`;
				case "unsupported": return `${compatibility.raw}; accepted releases are ${ghidraReleaseLine()} (verified build ${SUPPORTED_GHIDRA_VERSION})`;
				default: {
					const unreachable = compatibility;
					return unreachable;
				}
			}
		};
		ghidraReleaseAccepted = (raw) => {
			const status = ghidraReleaseCompatibility(raw).status;
			return status === "verified" || status === "compatible";
		};
		verifiedGhidraRelease = () => {
			const version = parseGhidraRelease(SUPPORTED_GHIDRA_VERSION);
			if (version === undefined) throw new TypeError(`SUPPORTED_GHIDRA_VERSION ${SUPPORTED_GHIDRA_VERSION} is not a Ghidra release`);
			return version;
		};
		parseGhidraRelease = (raw) => {
			const match = GHIDRA_RELEASE_PATTERN.exec(raw);
			const major = integerGroup(match?.[1]);
			const minor = integerGroup(match?.[2]);
			if (match === null || major === undefined || minor === undefined) return undefined;
			const patch = match[3] === undefined ? 0 : integerGroup(match[3]);
			return patch === undefined ? undefined : {
				major,
				minor,
				patch,
				suffix: match[4] ?? ""
			};
		};
		ghidraConfigurationVersion = (raw) => {
			const version = parseGhidraRelease(raw);
			if (version === undefined || version.suffix.startsWith("+")) return undefined;
			const patch = version.patch === 0 ? "" : `.${String(version.patch)}`;
			const suffix = version.suffix === "-" ? "" : version.suffix;
			return `${String(version.major)}.${String(version.minor)}${patch}${suffix}`;
		};
		integerGroup = (value) => {
			if (value === undefined) return undefined;
			const parsed = Number(value);
			return Number.isSafeInteger(parsed) ? parsed : undefined;
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallationPolicy.js
var ghidraApplicationProperties, ghidraJavaRequirement, ghidraJavaRangeLabel, ghidraJavaMajorAccepted, parseJavaBound, parseJavaMaximum, parseJavaInteger, javaDecimalDigit, unresolvedJavaRequirement;
function init_GhidraInstallationPolicy() {
	return (init_GhidraInstallationPolicy = __esmMin((() => {
		init_GhidraJavaProperties();
		init_GhidraReleasePolicy();
		ghidraApplicationProperties = (content) => {
			const parsed = parseGhidraJavaProperties(content);
			if (!parsed.ok) return {
				providerVersion: null,
				configurationDirectoryName: null,
				javaMinimum: {
					status: "unresolved",
					raw: parsed.error
				},
				javaMaximum: {
					status: "unresolved",
					raw: parsed.error
				},
				parseError: parsed.error
			};
			const providerVersion = parsed.value.get("application.version");
			const releaseName = parsed.value.get("application.release.name")?.replaceAll(/[ \t\n\r\f\v]/gu, "").toUpperCase();
			const configurationVersion = providerVersion === undefined ? undefined : ghidraConfigurationVersion(providerVersion);
			const configurationDirectoryName = providerVersion !== undefined && configurationVersion !== undefined && releaseName !== undefined && /^[A-Za-z0-9][A-Za-z0-9._+-]*$/u.test(providerVersion) && /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(releaseName) ? `ghidra_${configurationVersion}_${releaseName}` : null;
			const minimum = parsed.value.get("application.java.min");
			const maximum = parsed.value.get("application.java.max");
			return {
				providerVersion: providerVersion ?? null,
				configurationDirectoryName,
				javaMinimum: minimum === undefined ? { status: "absent" } : parseJavaBound(minimum),
				javaMaximum: parseJavaMaximum(maximum),
				parseError: null
			};
		};
		ghidraJavaRequirement = (properties) => {
			if (properties?.parseError !== null && properties?.parseError !== undefined) return unresolvedJavaRequirement(`application.properties parse failed: ${properties.parseError}`);
			if (properties === undefined) return unresolvedJavaRequirement("application.properties is unavailable");
			const minimum = properties.javaMinimum;
			const maximum = properties.javaMaximum;
			if (minimum.status === "unresolved") return unresolvedJavaRequirement(`application.java.min=${minimum.raw}`);
			if (minimum.status === "absent") return unresolvedJavaRequirement("application.java.min is missing");
			if (maximum.status === "unresolved") return unresolvedJavaRequirement(`application.java.max=${maximum.raw}`);
			const minimumMajor = minimum.major;
			const maximumMajor = maximum.status === "major" ? maximum.major : null;
			if (maximumMajor !== null && maximumMajor < minimumMajor) return unresolvedJavaRequirement(`application.java.max=${String(maximumMajor)} is below application.java.min=${String(minimumMajor)}`);
			return {
				minimumMajor,
				maximumMajor,
				unresolved: null
			};
		};
		ghidraJavaRangeLabel = (requirement) => {
			if (requirement.unresolved !== null) return "a 64-bit full JDK matching the installation's declared Java bounds";
			if (requirement.maximumMajor === null) return `a 64-bit full JDK ${String(requirement.minimumMajor)} or newer`;
			if (requirement.maximumMajor === requirement.minimumMajor) return `a 64-bit full JDK ${String(requirement.minimumMajor)}`;
			return `a 64-bit full JDK ${String(requirement.minimumMajor)} through ${String(requirement.maximumMajor)}`;
		};
		ghidraJavaMajorAccepted = (major, requirement) => requirement.unresolved === null && major >= requirement.minimumMajor && (requirement.maximumMajor === null || major <= requirement.maximumMajor);
		parseJavaBound = (raw) => {
			const major = parseJavaInteger(raw);
			return major === undefined ? {
				status: "unresolved",
				raw
			} : {
				status: "major",
				major
			};
		};
		parseJavaMaximum = (raw) => {
			if (raw === undefined || raw === "") return { status: "absent" };
			const bound = parseJavaBound(raw);
			return bound.status === "major" && bound.major === 0 ? { status: "absent" } : bound;
		};
		parseJavaInteger = (raw) => {
			let index = 0;
			let sign = 1;
			if (raw[index] === "+" || raw[index] === "-") {
				if (raw[index] === "-") sign = -1;
				index += 1;
			}
			if (index === raw.length) return undefined;
			const limit = sign < 0 ? 2147483648 : 2147483647;
			let value = 0;
			for (; index < raw.length; index += 1) {
				const character = raw[index];
				if (character === undefined) return undefined;
				const digit = javaDecimalDigit(character);
				if (digit === undefined) return undefined;
				if (value > Math.floor((limit - digit) / 10)) return undefined;
				value = value * 10 + digit;
			}
			return sign * value;
		};
		javaDecimalDigit = (character) => {
			const code = character.charCodeAt(0);
			if (code >= 48 && code <= 57) return code - 48;
			if (!/^\p{Decimal_Number}$/u.test(character)) return undefined;
			let blockStart = code;
			while (blockStart > 0 && /^\p{Decimal_Number}$/u.test(String.fromCharCode(blockStart - 1))) blockStart -= 1;
			return (code - blockStart) % 10;
		};
		unresolvedJavaRequirement = (unresolved) => ({ unresolved });
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallationProperties.js
var MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES, readGhidraInstallationProperties;
function init_GhidraInstallationProperties() {
	return (init_GhidraInstallationProperties = __esmMin((() => {
		init_ArtifactFileOperation();
		init_jsonValue();
		init_readStableFileBytes();
		init_analysisErrorCore();
		init_fixedAllowanceRemediation();
		init_RegularFile();
		init_GhidraInstallationPolicy();
		init_GhidraFileArtifacts();
		MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES = 1024 * 1024;
		readGhidraInstallationProperties = async (path, options) => {
			try {
				return await options.resourceOwner.run(() => withArtifactRegularFile(path, { retain: (resource) => options.resourceOwner.retain({ close: () => resource.lease.release() }, resource.resource) }, options.signal, async ({ handle: file }) => (await readStableFileBytes(file, path, MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES, {
					symlinks: "follow",
					...options.signal === undefined ? {} : { signal: options.signal }
				})).toString("latin1"), "follow"));
			} catch (cause) {
				const { cause: physical } = artifactFilePrimaryFacts(cause);
				if (!(cause instanceof ArtifactFileCleanupFailure) && physical instanceof Error && "code" in physical && "syscall" in physical && physical.syscall === "open" && (physical.code === "ENOENT" || physical.code === "ENOTDIR")) return undefined;
				const completed = artifactFileCompletion(cause)?.value;
				const diagnostics = {
					path,
					stage: "installation_properties",
					...physical instanceof NonRegularFileReadError ? { system_code: physical.code } : {},
					...typeof completed !== "string" ? {} : { completed_properties: {
						bytes: Buffer.byteLength(completed, "latin1"),
						sha256: createHash("sha256").update(completed, "latin1").digest("hex"),
						properties: jsonValueSchema.parse(ghidraApplicationProperties(completed))
					} }
				};
				const qualified = mapArtifactFileFailure(cause, (primary) => primary instanceof RegularFileCapacityError ? new AnalysisResourceConstraintError("ghidra:installation", "file-size", primary.message, {
					maximum_bytes: primary.maximumBytes,
					observed_bytes: primary.observedBytes.toString()
				}, {
					cause: primary,
					diagnostics,
					...fixedProducerInputAllowance(MAX_GHIDRA_INSTALLATION_PROPERTIES_BYTES, "The Ghidra installation-properties read allowance")
				}) : primary);
				throw ghidraFileFailure(qualified, "ghidra:installation", diagnostics);
			}
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraInstallation.js
var NATIVE_PLATFORMS, NATIVE_TOOL_FORMATS, NATIVE_ARCHITECTURES, assessNativeDecompiler, inspectGhidraInstallation, availableInstallation, installationCoordinates, installationChecks, configurationCheck, ghidraInstallationDiagnostics, ghidraJavaEnvironment, installationCheck, nativeDecompilerCheck, jvmOsNameMatchesPlatform, jvmOsArchNativeDirectory, versionCheck, javaCheck, javaRemediation, systemGhidraInstallationHost, discoverGhidraInstallationOnPath, stableGhidraInstallationRoot, stableJavaHome, executablePath;
function init_GhidraInstallation() {
	return (init_GhidraInstallation = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_GhidraJavaProbe();
		init_result();
		init_analysisErrorProjection();
		init_GhidraExecutableHeader();
		init_snapshotEnvironment();
		init_GhidraInstallationProperties();
		init_binaryTarget();
		init_binaryTargetTypes();
		init_GhidraInstallationPolicy();
		init_GhidraReleasePolicy();
		NATIVE_PLATFORMS = {
			linux: {
				x64: "linux_x86_64",
				arm64: "linux_arm_64"
			},
			darwin: {
				x64: "mac_x86_64",
				arm64: "mac_arm_64"
			},
			win32: { x64: "win_x86_64" }
		};
		NATIVE_TOOL_FORMATS = {
			linux: "elf",
			darwin: "mach-o",
			win32: "pe"
		};
		NATIVE_ARCHITECTURES = [
			{
				node: "x64",
				binary: "x86_64"
			},
			{
				node: "ia32",
				binary: "x86"
			},
			{
				node: "arm",
				binary: "arm"
			},
			{
				node: "arm64",
				binary: "arm64"
			}
		];
		assessNativeDecompiler = (path, platform, architecture, probe) => {
			const expectedFormat = NATIVE_TOOL_FORMATS[platform];
			const expectedArchitecture = NATIVE_ARCHITECTURES.find(({ node }) => node === architecture)?.binary;
			if (expectedFormat === undefined || expectedArchitecture === undefined) return {
				status: "unknown",
				detail: `${path} is executable, but no native tool format is defined for ${platform}/${architecture}`
			};
			const parsed = probe === undefined ? undefined : parseExecutableHeader(probe.bytes, architecture, probe.size);
			const families = probe !== undefined && parsed !== undefined && !parsed.ok ? readFatArchitectureFamilies(probe.bytes, probe.size) : null;
			const header = parsed?.ok ? parsed.value : families?.ok && !families.value.some((family) => family === expectedArchitecture) ? {
				format: "mach-o-universal",
				architecture: families.value.join("/") || "no supported architecture"
			} : undefined;
			if (header === undefined) return {
				status: "unknown",
				detail: `${path} is executable, but its executable format for ${platform}/${architecture} could not be established`
			};
			const observed = `${header.format} ${header.architecture}`;
			const expected = `${expectedFormat} ${expectedArchitecture}`;
			const formatMatches = isMachOFormat(expectedFormat) ? isMachOFormat(header.format) : header.format === expectedFormat;
			if (formatMatches && header.architecture === expectedArchitecture) return {
				status: "compatible",
				detail: `${path} reports ${observed}, which matches ${platform}/${architecture}`
			};
			const nativeDirectory = NATIVE_PLATFORMS[platform]?.[architecture];
			const executable = platform === "win32" ? "decompile.exe" : "decompile";
			return {
				status: "incompatible",
				detail: `${path} reports ${observed}, but ${platform}/${architecture} requires ${expected}`,
				remediation: `Provide an executable Ghidra/Features/Decompiler/os/${nativeDirectory ?? "<platform>"}/${executable} built for ${expected}, or its build/os equivalent. REA does not build or install native tools.`
			};
		};
		inspectGhidraInstallation = async (options, host = systemGhidraInstallationHost()) => {
			if (options.signal?.aborted) throw new AnalysisCancelledError("ghidra:installation", { cause: options.signal.reason });
			const platform = options.platform ?? process.platform;
			const architecture = options.architecture ?? process.arch;
			const coordinates = await installationCoordinates(options, platform, architecture, host);
			const checks = installationChecks({
				coordinates,
				platform,
				architecture,
				javaHome: options.javaHome,
				host
			});
			const failed = checks.find((check) => check.status === "failed");
			const javaObservation = coordinates.java ?? coordinates.javaProbeFailure?.properties;
			const observation = {
				platform,
				architecture,
				applicationPropertiesPath: coordinates.applicationPropertiesPath,
				configurationDirectoryName: coordinates.properties?.configurationDirectoryName ?? null,
				nativeDecompilerPath: coordinates.nativeDecompilerPath,
				...coordinates.nativeDecompilerHeader.ok ? {} : { nativeDecompilerHeaderFailure: coordinates.nativeDecompilerHeader.error },
				...coordinates.javaDiscoveryFailures === undefined ? {} : { javaDiscoveryFailures: coordinates.javaDiscoveryFailures },
				javaCommand: coordinates.javaCommand,
				...coordinates.javaProbeFailure === undefined ? {} : { javaProbeFailure: coordinates.javaProbeFailure },
				...javaObservation?.vmName == null ? {} : { javaVmName: javaObservation.vmName },
				...javaObservation?.osArch == null ? {} : { javaOsArch: javaObservation.osArch },
				...javaObservation?.osName == null ? {} : { javaOsName: javaObservation.osName },
				checks
			};
			if (failed !== undefined) return {
				status: "unavailable",
				...observation,
				installDir: coordinates.installDir,
				analyzeHeadlessPath: coordinates.analyzeHeadlessPath,
				providerVersion: coordinates.properties?.providerVersion ?? null,
				javaHome: javaObservation?.home ?? options.javaHome ?? null,
				javaVersion: javaObservation?.version ?? null,
				rejection: {
					code: failed.code,
					reason: failed.remediation
				}
			};
			if (options.signal?.aborted) throw new AnalysisCancelledError("ghidra:installation", {
				cause: options.signal.reason,
				diagnostics: ghidraInstallationDiagnostics(availableInstallation(coordinates, observation, options.javaHome))
			});
			return availableInstallation(coordinates, observation, options.javaHome);
		};
		availableInstallation = (coordinates, observation, selectedJavaHome) => {
			const providerVersion = coordinates.properties?.providerVersion;
			if (coordinates.installDir === null || coordinates.applicationPropertiesPath === null || coordinates.analyzeHeadlessPath === null || providerVersion === null || providerVersion === undefined || coordinates.java === undefined) throw new TypeError("Passing Ghidra installation checks produced incomplete coordinates");
			return {
				status: "available",
				...observation,
				installDir: coordinates.installDir,
				analyzeHeadlessPath: coordinates.analyzeHeadlessPath,
				applicationPropertiesPath: coordinates.applicationPropertiesPath,
				providerVersion,
				javaHome: stableJavaHome(coordinates.java.home, selectedJavaHome, observation.platform),
				javaVersion: coordinates.java.version
			};
		};
		installationCoordinates = async (options, platform, architecture, host) => {
			const path = platform === "win32" ? win32 : posix;
			const installDir = options.installDir ?? host.discoverInstallDirOnPath?.(options.environment, platform) ?? null;
			const applicationPropertiesPath = installDir === null ? null : path.join(installDir, "Ghidra", "application.properties");
			const analyzeHeadlessPath = installDir === null ? null : path.join(installDir, "support", platform === "win32" ? "analyzeHeadless.bat" : "analyzeHeadless");
			const decompilerPlatform = NATIVE_PLATFORMS[platform]?.[architecture];
			const decompilerExecutable = platform === "win32" ? "decompile.exe" : "decompile";
			const nativeDecompilerPath = installDir === null || decompilerPlatform === undefined ? null : [path.join(installDir, "Ghidra", "Features", "Decompiler", "os", decompilerPlatform, decompilerExecutable), path.join(installDir, "Ghidra", "Features", "Decompiler", "build", "os", decompilerPlatform, decompilerExecutable)].find((candidate) => host.executable(candidate)) ?? null;
			const properties = applicationPropertiesPath === null ? undefined : await host.readText(applicationPropertiesPath, {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			});
			const nativeDecompilerHeader = nativeDecompilerPath === null || host.executableHeader === undefined ? ok(undefined) : await host.executableHeader(nativeDecompilerPath, {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			});
			if (!nativeDecompilerHeader.ok && (nativeDecompilerHeader.error instanceof AnalysisCancelledError || nativeDecompilerHeader.error.cleanupIncomplete)) throw nativeDecompilerHeader.error;
			const homebrewJavaCandidates = () => (architecture === "arm64" ? ["/opt/homebrew", "/usr/local"] : ["/usr/local", "/opt/homebrew"]).map((prefix) => path.join(prefix, "opt/openjdk/libexec/openjdk.jdk/Contents/Home/bin/java")).filter((candidate) => host.executable(candidate));
			let javaCommand = (() => {
				if (options.javaHome !== undefined) return path.join(options.javaHome, "bin", platform === "win32" ? "java.exe" : "java");
				if (platform !== "darwin") return platform === "win32" ? "java.exe" : "java";
				const javaOnPath = options.environment.PATH?.split(":").some((directory) => path.isAbsolute(directory) && host.executable(path.join(directory, "java")));
				if (javaOnPath) return "java";
				return homebrewJavaCandidates()[0] ?? "java";
			})();
			let javaProbe = installDir !== null && (options.javaHome === undefined || path.isAbsolute(options.javaHome)) ? await host.probeJava(javaCommand, ghidraJavaEnvironment(options.javaHome, options.environment, platform), {
				resourceOwner: options.resourceOwner,
				...options.signal === undefined ? {} : { signal: options.signal }
			}) : undefined;
			if (javaProbe !== undefined && !javaProbe.ok && javaProbe.error instanceof AnalysisError) throw javaProbe.error;
			const javaDiscoveryFailures = [];
			if (platform === "darwin" && options.javaHome === undefined && javaCommand === "java" && javaProbe !== undefined && !javaProbe.ok && !(javaProbe.error instanceof AnalysisError) && javaProbe.error.code !== "version_unresolved" && javaProbe.error.cancellation === undefined && !options.signal?.aborted) {
				javaDiscoveryFailures.push({
					command: javaCommand,
					failure: javaProbe.error
				});
				for (const candidate of homebrewJavaCandidates()) {
					const fallback = await host.probeJava(candidate, ghidraJavaEnvironment(undefined, options.environment, platform), {
						resourceOwner: options.resourceOwner,
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					if (fallback.ok) {
						javaCommand = candidate;
						javaProbe = fallback;
						break;
					}
					const failure = fallback.error;
					if (failure instanceof AnalysisError) throw failure;
					javaDiscoveryFailures.push({
						command: candidate,
						failure
					});
					if (failure.cancellation !== undefined || options.signal?.aborted) {
						javaCommand = candidate;
						javaProbe = fallback;
						break;
					}
				}
			}
			return {
				installDir,
				applicationPropertiesPath,
				analyzeHeadlessPath,
				nativeDecompilerPath,
				nativeDecompilerHeader,
				properties: properties === undefined ? undefined : ghidraApplicationProperties(properties),
				...javaDiscoveryFailures.length === 0 ? {} : { javaDiscoveryFailures },
				javaCommand,
				java: javaProbe?.ok === true ? javaProbe.value : undefined,
				javaProbeFailure: javaProbe !== undefined && !javaProbe.ok && !(javaProbe.error instanceof AnalysisError) ? javaProbe.error : undefined
			};
		};
		installationChecks = ({ coordinates, platform, architecture, javaHome, host }) => [
			configurationCheck(coordinates.installDir, javaHome, platform),
			installationCheck({
				name: "platform",
				passed: NATIVE_PLATFORMS[platform] !== undefined,
				code: "unsupported_host",
				detail: platform,
				remediation: "Use Linux or macOS x64/arm64, or Windows x64 with matching native Ghidra tools."
			}),
			installationCheck({
				name: "architecture",
				passed: NATIVE_PLATFORMS[platform]?.[architecture] !== undefined,
				code: "unsupported_host",
				detail: architecture,
				remediation: "Use x64/arm64 on Linux or macOS, or x64 on Windows."
			}),
			installationCheck({
				name: "installation",
				passed: coordinates.properties !== undefined,
				code: "executable_missing",
				detail: coordinates.applicationPropertiesPath ?? "Ghidra application properties unavailable",
				remediation: "Point GHIDRA_INSTALL_DIR at the root of an extracted official Ghidra release."
			}),
			versionCheck(coordinates.properties),
			installationCheck({
				name: "headless",
				passed: coordinates.analyzeHeadlessPath !== null && host.executable(coordinates.analyzeHeadlessPath),
				code: "executable_missing",
				detail: coordinates.analyzeHeadlessPath ?? "analyzeHeadless unavailable",
				remediation: "Restore support/analyzeHeadless or support/analyzeHeadless.bat from the official Ghidra release."
			}),
			nativeDecompilerCheck({
				coordinates,
				platform,
				architecture
			}),
			javaCheck(coordinates.java, coordinates.javaCommand, javaHome, coordinates.properties, platform, coordinates.javaProbeFailure)
		];
		configurationCheck = (installDir, javaHome, platform) => {
			const { isAbsolute } = platform === "win32" ? win32 : posix;
			const relative = [...installDir !== null && !isAbsolute(installDir) ? ["GHIDRA_INSTALL_DIR"] : [], ...javaHome !== undefined && !isAbsolute(javaHome) ? ["JAVA_HOME"] : []];
			if (installDir === null || relative.length === 0) return installationCheck({
				name: "configuration",
				passed: installDir !== null,
				code: "not_configured",
				detail: installDir ?? "GHIDRA_INSTALL_DIR is not set",
				remediation: `Set GHIDRA_INSTALL_DIR to an extracted Ghidra ${ghidraReleaseLine()} release directory.`
			});
			const settings = relative.join(" and ");
			return installationCheck({
				name: "configuration",
				passed: false,
				code: "not_configured",
				detail: `${settings} must be absolute`,
				remediation: `Set ${settings} to ${relative.length === 1 ? "an absolute path" : "absolute paths"}. REA's analysis and MCP server reject relative paths even when they resolve from the current directory.`
			});
		};
		ghidraInstallationDiagnostics = (inspection) => ({
			install_dir: inspection.installDir,
			analyze_headless_path: inspection.analyzeHeadlessPath,
			native_decompiler_path: inspection.nativeDecompilerPath,
			...inspection.nativeDecompilerHeaderFailure === undefined ? {} : { native_decompiler_header_failure: projectAnalysisError(inspection.nativeDecompilerHeaderFailure) },
			application_properties_path: inspection.applicationPropertiesPath,
			provider_version: inspection.providerVersion,
			java_command: inspection.javaCommand,
			...inspection.javaProbeFailure === undefined ? {} : { java_probe_failure: {
				code: inspection.javaProbeFailure.code,
				...inspection.javaProbeFailure.processErrorCode === undefined ? {} : { process_error_code: inspection.javaProbeFailure.processErrorCode },
				detail: inspection.javaProbeFailure.detail,
				...inspection.javaProbeFailure.cancellation === undefined ? {} : { cancellation_observed: true },
				...inspection.javaProbeFailure.properties === undefined ? {} : { properties: { ...inspection.javaProbeFailure.properties } },
				...inspection.javaProbeFailure.output === undefined ? {} : { output: { ...inspection.javaProbeFailure.output } }
			} },
			...inspection.javaDiscoveryFailures === undefined ? {} : { java_discovery_failures: inspection.javaDiscoveryFailures.map(({ command, failure }) => ({
				command,
				code: failure.code,
				detail: failure.detail,
				...failure.output === undefined ? {} : { output: { ...failure.output } },
				...failure.properties === undefined ? {} : { properties: { ...failure.properties } },
				...failure.cancellation === undefined ? {} : { cancellation_observed: true }
			})) },
			java_home: inspection.javaHome,
			java_version: inspection.javaVersion,
			java_vm_name: inspection.javaVmName ?? null,
			java_os_arch: inspection.javaOsArch ?? null,
			java_os_name: inspection.javaOsName ?? null,
			platform: inspection.platform,
			architecture: inspection.architecture,
			checks: inspection.checks.map((check) => ({
				name: check.name,
				ok: check.status === "passed",
				code: check.status === "failed" ? check.code : null,
				detail: check.detail
			}))
		});
		ghidraJavaEnvironment = (javaHome, environment, platform = process.platform) => {
			const selectedEnvironment = snapshotEnvironment(environment, platform);
			const boundedEnvironment = {
				...selectedEnvironment,
				_JAVA_OPTIONS: "",
				JAVA_TOOL_OPTIONS: "",
				JDK_JAVA_OPTIONS: "",
				GHIDRA_JAVA_OPTIONS: ""
			};
			return javaHome === undefined ? boundedEnvironment : {
				...boundedEnvironment,
				JAVA_HOME: javaHome,
				PATH: `${(platform === "win32" ? win32 : posix).join(javaHome, "bin")}${platform === "win32" ? win32.delimiter : posix.delimiter}${selectedEnvironment.PATH ?? ""}`
			};
		};
		installationCheck = (options) => options.passed ? {
			status: "passed",
			name: options.name,
			detail: options.detail
		} : {
			status: "failed",
			name: options.name,
			code: options.code,
			detail: options.detail,
			remediation: options.remediation
		};
		nativeDecompilerCheck = ({ coordinates, platform, architecture }) => {
			const path = coordinates.nativeDecompilerPath;
			const compatibility = path === null ? undefined : !coordinates.nativeDecompilerHeader.ok ? {
				status: "unknown",
				detail: `${path} header is unknown: ${coordinates.nativeDecompilerHeader.error.message}`
			} : assessNativeDecompiler(path, platform, architecture, coordinates.nativeDecompilerHeader.value);
			const osArch = coordinates.java?.osArch ?? coordinates.javaProbeFailure?.properties?.osArch ?? undefined;
			const osName = coordinates.java?.osName ?? coordinates.javaProbeFailure?.properties?.osName ?? undefined;
			const selectedDirectory = jvmOsArchNativeDirectory(platform, osArch);
			const validatedDirectory = NATIVE_PLATFORMS[platform]?.[architecture];
			if (coordinates.java !== undefined) {
				if (selectedDirectory === undefined) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: osArch === undefined ? "The Java probe did not report os.arch; the JVM-selected native decompiler directory is unknown and cannot be matched to the validated host directory" : `JVM reports unrecognized os.arch=${osArch}; its selected native decompiler directory is unknown and cannot be matched to the validated host directory`,
					remediation: `Point JAVA_HOME at a JDK whose reported architecture maps to the validated Ghidra decompiler (${validatedDirectory ?? "unsupported host"}). REA does not build or install native tools.`
				});
				if (validatedDirectory !== undefined && selectedDirectory !== validatedDirectory && path !== null) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: `JVM reports os.arch=${osArch}, so Ghidra selects its native decompiler from os/${selectedDirectory}, but the validated decompiler targets ${validatedDirectory} (host ${platform}/${architecture})`,
					remediation: `Point JAVA_HOME at a JDK whose architecture matches the built decompiler (${validatedDirectory}). REA does not build or install native tools.`
				});
				if (osName === undefined) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: "The Java probe did not report os.name; the JVM-selected native decompiler OS directory is unknown and cannot be matched to the validated host platform",
					remediation: `Point JAVA_HOME at a JDK whose reported operating system matches the host platform (${platform}). REA does not build or install native tools.`
				});
				if (!jvmOsNameMatchesPlatform(platform, osName) && path !== null) return installationCheck({
					name: "native_decompiler",
					passed: false,
					code: "executable_missing",
					detail: `JVM reports os.name=${osName}, which does not match the validated host platform ${platform} (host ${platform}/${architecture})`,
					remediation: `Point JAVA_HOME at a JDK whose reported operating system matches the host platform (${platform}). REA does not build or install native tools.`
				});
			}
			return installationCheck({
				name: "native_decompiler",
				passed: path !== null && compatibility?.status !== "incompatible",
				code: "executable_missing",
				detail: compatibility?.detail ?? `Matching native decompiler for ${platform}/${architecture} was not found`,
				remediation: compatibility?.status === "incompatible" ? compatibility.remediation : `Provide an executable Ghidra/Features/Decompiler/os/${NATIVE_PLATFORMS[platform]?.[architecture] ?? "<platform>"}/${platform === "win32" ? "decompile.exe" : "decompile"}, or its build/os equivalent. REA does not build or install native tools.`
			});
		};
		jvmOsNameMatchesPlatform = (platform, osName) => {
			const normalized = osName.toLowerCase();
			if (platform === "win32") return normalized.startsWith("windows");
			if (platform === "darwin") return normalized.startsWith("mac") || normalized.startsWith("darwin");
			if (platform === "linux") return normalized.startsWith("linux");
			return false;
		};
		jvmOsArchNativeDirectory = (platform, osArch) => {
			if (osArch === undefined) return undefined;
			const normalized = osArch.toLowerCase();
			const node = normalized === "x86_64" || normalized === "amd64" || normalized === "x64" ? "x64" : normalized === "aarch64" || normalized === "arm64" ? "arm64" : undefined;
			return node === undefined ? undefined : NATIVE_PLATFORMS[platform]?.[node];
		};
		versionCheck = (properties) => {
			const raw = properties?.providerVersion;
			const parseError = properties?.parseError;
			return installationCheck({
				name: "version",
				passed: parseError == null && ghidraReleaseAccepted(raw),
				code: parseError != null ? "version_unresolved" : ghidraReleaseCompatibility(raw).status === "unsupported" ? "unsupported_version" : "version_unresolved",
				detail: parseError == null ? ghidraVersionDetail(raw) : `application.properties could not be parsed: ${parseError}`,
				remediation: `Install a Ghidra ${ghidraReleaseLine()} release (verified with ${SUPPORTED_GHIDRA_VERSION}), or update REA for another Ghidra line.`
			});
		};
		javaCheck = (observation, command, configuredHome, properties, platform, failure) => {
			const requirement = ghidraJavaRequirement(properties);
			const range = ghidraJavaRangeLabel(requirement);
			const supported = observation !== undefined && ghidraJavaMajorAccepted(observation.major, requirement) && observation.bits === 64 && observation.runtime === "jdk";
			const bitness = observation === undefined ? undefined : observation.bits === null ? `bitness unknown${observation.unparsedBits === undefined ? "" : ` (sun.arch.data.model = ${JSON.stringify(observation.unparsedBits)})`}` : `${String(observation.bits)}-bit`;
			const knownMismatch = observation !== undefined && (!ghidraJavaMajorAccepted(observation.major, requirement) || observation.bits !== null && observation.bits !== 64 || observation.runtime !== "jdk");
			const detail = observation === undefined ? requirement.unresolved === null ? failure?.detail ?? `${command}: Java probe was not attempted` : `${failure?.detail ?? command}; ${requirement.unresolved}` : `${observation.version}; ${bitness}; ${observation.runtime === "jdk" ? "JDK" : "runtime only"}; ${observation.home}; accepted ${range}`;
			return installationCheck({
				name: "java",
				passed: supported,
				code: requirement.unresolved !== null ? "version_unresolved" : observation === undefined ? failure?.code ?? "version_unresolved" : knownMismatch ? "unsupported_version" : "version_unresolved",
				detail,
				remediation: javaRemediation(requirement, configuredHome, range, platform)
			});
		};
		javaRemediation = (requirement, configuredHome, range, platform) => {
			if (requirement.unresolved !== null) return `The Ghidra installation's Java bounds could not be read (${requirement.unresolved}). Install a 64-bit full JDK inside the declared application.java.min and application.java.max.`;
			return configuredHome === undefined ? `Select ${range} on PATH, or set JAVA_HOME to its installation root before starting REA.${platform === "darwin" ? " Homebrew OpenJDK can be keg-only: set JAVA_HOME to the selected formula's libexec/openjdk.jdk/Contents/Home (for example /opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home or /usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home). The installed JDK must satisfy the declared Ghidra Java bounds." : ""}` : `Update JAVA_HOME to the root of ${range} installation.`;
		};
		systemGhidraInstallationHost = () => ({
			readText: readGhidraInstallationProperties,
			executableHeader: readGhidraExecutableHeader,
			executable(path) {
				try {
					accessSync(path, constants.X_OK);
					return statSync(path).isFile();
				} catch (cause) {
					void cause;
					return false;
				}
			},
			probeJava: probeGhidraJava,
			discoverInstallDirOnPath: discoverGhidraInstallationOnPath
		});
		discoverGhidraInstallationOnPath = (environment, platform) => {
			if (platform !== process.platform) return undefined;
			const path = platform === "win32" ? win32 : posix;
			const pathValue = environment.PATH;
			if (pathValue === undefined || pathValue.length === 0) return undefined;
			const launchers = platform === "win32" ? [
				"ghidra.bat",
				"ghidraRun.bat",
				"ghidra.exe",
				"ghidraRun.exe"
			] : ["ghidra", "ghidraRun"];
			for (const directory of pathValue.split(delimiter)) {
				if (directory.length === 0) continue;
				for (const launcher of launchers) {
					let resolved;
					try {
						const candidate = path.resolve(directory, launcher);
						if (!executablePath(candidate)) continue;
						resolved = realpathSync(candidate);
					} catch (cause) {
						void cause;
						continue;
					}
					const root = dirname(resolved);
					const properties = path.join(root, "Ghidra", "application.properties");
					const headless = path.join(root, "support", platform === "win32" ? "analyzeHeadless.bat" : "analyzeHeadless");
					try {
						if (statSync(properties).isFile() && executablePath(headless)) return stableGhidraInstallationRoot(root, platform);
					} catch (cause) {
						void cause;
					}
				}
			}
			return undefined;
		};
		stableGhidraInstallationRoot = (root, platform) => {
			if (platform !== "darwin") return root;
			const parsed = posix.parse(root);
			const segments = root.slice(parsed.root.length).split(posix.sep);
			const cellarIndex = segments.length - 4;
			const formula = segments[cellarIndex + 1];
			const version = segments[cellarIndex + 2];
			if (cellarIndex < 0 || segments[cellarIndex] !== "Cellar" || formula === undefined || formula.length === 0 || version === undefined || version.length === 0 || segments[cellarIndex + 3] !== "libexec") return root;
			const prefix = posix.join(parsed.root, ...segments.slice(0, cellarIndex));
			const candidate = posix.join(prefix, "opt", formula, "libexec");
			try {
				return realpathSync(candidate) === root ? candidate : root;
			} catch (cause) {
				void cause;
				return root;
			}
		};
		stableJavaHome = (observedHome, selectedHome, platform) => {
			if (platform !== process.platform) return observedHome;
			const sameHome = (candidate) => {
				try {
					return realpathSync(candidate) === realpathSync(observedHome);
				} catch (cause) {
					void cause;
					return false;
				}
			};
			if (selectedHome !== undefined) return sameHome(selectedHome) ? selectedHome : observedHome;
			if (platform !== "darwin") return observedHome;
			const parsed = posix.parse(observedHome);
			const segments = observedHome.slice(parsed.root.length).split(posix.sep);
			const cellarIndex = segments.length - 7;
			const formula = segments[cellarIndex + 1];
			const version = segments[cellarIndex + 2];
			if (cellarIndex < 0 || segments[cellarIndex] !== "Cellar" || formula === undefined || formula.length === 0 || version === undefined || version.length === 0 || segments.slice(cellarIndex + 3).join("/") !== "libexec/openjdk.jdk/Contents/Home") return observedHome;
			const prefix = posix.join(parsed.root, ...segments.slice(0, cellarIndex));
			const candidate = posix.join(prefix, "opt", formula, "libexec/openjdk.jdk/Contents/Home");
			return sameHome(candidate) ? candidate : observedHome;
		};
		executablePath = (path) => {
			try {
				accessSync(path, constants.X_OK);
				return statSync(path).isFile();
			} catch (cause) {
				void cause;
				return false;
			}
		};
	})))();
}

//#endregion
//#region dist/ida/IdaConfiguration.js
var DEFAULT_IDA_REQUEST_TIMEOUT_MS, MAX_IDA_REQUEST_TIMEOUT_MS, common, registrationSchema, idaProtocol, readIdaConfiguration, MAXIMUM_REGISTRATION_BYTES, registrationTooLarge, idaRegistrationTimeoutGuidance, idaConfigurationError;
function init_IdaConfiguration() {
	return (init_IdaConfiguration = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_configurationErrors();
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_result();
		init_OwnedRegularFile();
		init_RegularFile();
		DEFAULT_IDA_REQUEST_TIMEOUT_MS = 3e5;
		MAX_IDA_REQUEST_TIMEOUT_MS = 2147483647;
		common = {
			sensitive: z.strictObject({
				headers: z.array(z.string().min(1)).default([]),
				env: z.array(z.string().min(1)).default([])
			}).optional(),
			mode: z.enum(["attached", "headless"]).default("attached"),
			protocol: z.literal("native").optional(),
			timeoutMs: z.int().positive().max(MAX_IDA_REQUEST_TIMEOUT_MS).default(DEFAULT_IDA_REQUEST_TIMEOUT_MS),
			workspaceRoot: z.string().refine(isAbsolute, "workspaceRoot must be absolute on the REA host").optional()
		};
		registrationSchema = z.union([z.object({
			...common,
			type: z.literal("stdio").optional(),
			command: z.string().min(1),
			args: z.array(z.string()).default([]),
			env: z.record(z.string(), z.string()).default({})
		}).strict(), z.object({
			...common,
			type: z.literal("http").optional(),
			url: z.url().refine((value) => {
				const url = new URL(value);
				return ["http:", "https:"].includes(url.protocol) && [
					"localhost",
					"127.0.0.1",
					"[::1]"
				].includes(url.hostname) && url.username === "" && url.password === "";
			}, "IDA MCP must use a local HTTP endpoint without URL credentials"),
			headers: z.record(z.string(), z.string()).default({})
		}).strict()]).refine((config) => config.protocol !== "native" || config.mode === "attached", "The native IDA MCP protocol requires attached mode");
		idaProtocol = (config) => config.protocol ?? (config.mode === "attached" ? "legacy" : "modern");
		readIdaConfiguration = (path, options) => options.resourceScope.run(async () => {
			let closeLease;
			try {
				const text = await withOwnedRegularFile(path, {
					...options.signal === undefined ? {} : { signal: options.signal },
					retainFailedClose: (owner) => {
						closeLease = AnalysisCleanupLease.forCloseOwner(owner, path);
						options.resourceScope.retain({
							close: () => closeLease.release(),
							get cleanupResources() {
								return closeLease.cleanupResources;
							}
						}, path);
					}
				}, async ({ handle, initial: metadata }) => {
					if (metadata.size > MAXIMUM_REGISTRATION_BYTES) throw registrationTooLarge();
					const bytes = Buffer.alloc(MAXIMUM_REGISTRATION_BYTES + 1);
					let length = 0;
					while (length < bytes.length) {
						assertRegularFileActive(options.signal);
						const { bytesRead } = await handle.read(bytes, length, bytes.length - length, null);
						if (bytesRead === 0) break;
						length += bytesRead;
					}
					if (length > MAXIMUM_REGISTRATION_BYTES) throw registrationTooLarge();
					return bytes.toString("utf8", 0, length);
				});
				const input = JSON.parse(text);
				const envelope = z.object({ mcpServers: z.object({ "ida-pro-mcp": z.unknown() }) }).safeParse(input);
				const registration = envelope.success ? envelope.data.mcpServers["ida-pro-mcp"] : input;
				const parsed = registrationSchema.safeParse(registration);
				if (parsed.success) return ok(parsed.data);
				const constraints = projectInputIssues(parsed.error.issues, registration).flatMap((issue) => issue.message === undefined ? [] : [`${issue.path.join(".") || "registration"}: ${issue.message}`]);
				if (constraints.length === 0) return err(idaConfigurationError("REA_IDA_MCP_CONFIG must contain an IDA MCP command/args or local url registration; see docs/ida-provider.md.", parsed.error));
				return err(new ConfigurationError(`REA_IDA_MCP_CONFIG: ${constraints.join("; ")}. See docs/ida-provider.md.`, {
					cause: parsed.error,
					settings: constraints.map((constraint) => ({
						setting: "REA_IDA_MCP_CONFIG",
						constraint
					}))
				}));
			} catch (cause) {
				if (cause instanceof ConfigurationError) return err(cause);
				if (cause instanceof NonRegularFileReadError) return err(idaConfigurationError(`REA_IDA_MCP_CONFIG must select a regular JSON file: ${path}`, cause));
				if (cause instanceof AnalysisCancelledError) throw cause;
				const cancellation = regularFileCancellation(cause);
				if (cancellation !== undefined) {
					if (cause instanceof RegularFileCleanupFailure) {
						const error = new AnalysisCancelledError("ida:registration", {
							cause: cancellation.reason,
							cleanup: {
								reason: cause.cleanupCause instanceof Error ? cause.cleanupCause.message : String(cause.cleanupCause),
								resources: [path]
							}
						});
						closeLease?.bindCleanupError(error);
						throw error;
					}
					throw new AnalysisCancelledError("ida:registration", { cause: cancellation.reason });
				}
				if (cause instanceof RegularFileCleanupFailure) {
					const primary = cause.outcome.kind === "failed" ? cause.outcome.cause : cause.cleanupCause;
					const primaryMessage = cause.outcome.kind === "failed" ? primary instanceof ConfigurationError ? primary.message : primary instanceof NonRegularFileReadError ? `REA_IDA_MCP_CONFIG must select a regular JSON file: ${path}` : `Cannot read IDA MCP registration ${path}: ${primary instanceof Error ? primary.message : String(primary)}` : `Cannot close IDA MCP registration ${path}; provide a readable JSON configuration.`;
					const error = new ConfigurationError(primaryMessage, {
						cause,
						cleanup: {
							reason: cause.cleanupCause instanceof Error ? cause.cleanupCause.message : String(cause.cleanupCause),
							resources: [path]
						},
						settings: [{
							setting: "REA_IDA_MCP_CONFIG",
							constraint: `Close remains incomplete for ${path}`
						}]
					});
					closeLease?.bindCleanupError(error);
					return err(error);
				}
				return err(idaConfigurationError(`Cannot read IDA MCP registration ${path}; provide a readable JSON configuration.`, cause));
			}
		});
		MAXIMUM_REGISTRATION_BYTES = 65536;
		registrationTooLarge = () => idaConfigurationError("REA_IDA_MCP_CONFIG exceeds the 64 KiB registration size.");
		idaRegistrationTimeoutGuidance = (timeoutMs, phase, ceilingMs = timeoutMs) => ({
			userMessage: phase === "readiness" ? `IDA readiness reached its ${String(timeoutMs)} ms deadline while the headless worker was still busy (deadlineExpired).` : ceilingMs === timeoutMs ? `This IDA request reached the registration timeoutMs deadline of ${String(timeoutMs)} ms (deadlineExpired).` : `This IDA request reached its ${String(timeoutMs)} ms deadline (deadlineExpired), within the registration timeoutMs ceiling of ${String(ceilingMs)} ms.`,
			remediationAction: `Set timeoutMs in the JSON file named by REA_IDA_MCP_CONFIG to an integer from 1 to ${String(MAX_IDA_REQUEST_TIMEOUT_MS)} (omitted means ${String(DEFAULT_IDA_REQUEST_TIMEOUT_MS)}). REA applies the edited file on the next IDA connection after it re-reads the registration; an already open session keeps the timeout it connected with. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.`
		});
		idaConfigurationError = (constraint, cause) => new ConfigurationError(constraint, {
			...cause === undefined ? {} : { cause },
			settings: [{
				setting: "REA_IDA_MCP_CONFIG",
				constraint
			}]
		});
	})))();
}

//#endregion
//#region dist/ida/IdaWorkspace.js
var idaFileDigest, sameIdaHostPath, resolveIdaWorkspaceParent, IdaWorkspace;
function init_IdaWorkspace() {
	return (init_IdaWorkspace = __esmMin((() => {
		init_analysisErrorCore();
		init_configurationErrors();
		init_analysisErrorBase();
		init_PrivateRuntimeRoot();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		idaFileDigest = async (path) => {
			const hash = createHash("sha256");
			for await (const chunk of createReadStream(path)) hash.update(chunk);
			return hash.digest("hex");
		};
		sameIdaHostPath = (left, right) => process.platform === "win32" ? normalize(left).toLowerCase() === normalize(right).toLowerCase() : normalize(left) === normalize(right);
		resolveIdaWorkspaceParent = async (root = tmpdir()) => {
			await stat(root);
			return realpath(root);
		};
		IdaWorkspace = class IdaWorkspace {
			runtime;
			inputPath;
			target;
			sessionId = `rea-${randomUUID()}`;
			#inputSha256;
			#files = new ArtifactResourceScope();
			constructor(runtime, inputPath, target) {
				this.runtime = runtime;
				this.inputPath = inputPath;
				this.target = target;
			}
			/** Filesystem root owned exclusively by this headless session. */
			get directory() {
				return this.runtime.path;
			}
			/** SHA-256 of the private input bytes copyInput admitted; undefined until prepared. */
			get inputSha256() {
				return this.#inputSha256;
			}
			/** Allocate a protected workspace so its owner can retain it before input preparation. */
			static async allocate(target, root = tmpdir()) {
				let runtime;
				try {
					runtime = await PrivateRuntimeRoot.create({
						parent: await resolveIdaWorkspaceParent(root),
						prefix: "rea-ida-"
					});
				} catch (cause) {
					if (cause instanceof AnalysisError) throw cause;
					throw new ConfigurationError("IDA workspaceRoot is not a usable private workspace parent.", {
						cause,
						settings: [{
							setting: "workspaceRoot",
							constraint: `Select an existing writable and searchable directory: ${cause instanceof Error ? cause.message : String(cause)}`
						}],
						diagnostics: { workspace_root: root }
					});
				}
				const inputPath = join(runtime.path, basename(target.path));
				return new IdaWorkspace(runtime, inputPath, target);
			}
			/**
			* Copy and verify admitted bytes after the session owns this workspace's
			* cleanup. Universal Mach-O containers are thinned to the selected slice so
			* the upstream engine analyzes the architecture admission reported; the
			* whole-source digest still anchors the copy against admission-time changes.
			*/
			copyInput(signal) {
				return this.#files.run(async () => {
					assertArtifactReadActive(signal);
					const source = await open(this.target.path, "r");
					await withArtifactFileHandle(this.target.path, source, this.#files, signal, async (source) => {
						assertArtifactReadActive(signal);
						const input = await open(this.inputPath, "wx");
						await withArtifactFileHandle(this.inputPath, input, this.#files, signal, (input) => this.#copyBytes(source, input, signal));
					});
				});
			}
			async #copyBytes(source, input, signal) {
				const slice = this.target.format === "mach-o-universal" ? this.target.universalSlice : undefined;
				const sourceHash = createHash("sha256");
				const inputHash = createHash("sha256");
				const chunk = Buffer.allocUnsafe(64 * 1024);
				let position = 0;
				for (;;) {
					assertArtifactReadActive(signal);
					const observed = await source.read(chunk, 0, chunk.length, position);
					if (observed.bytesRead === 0) break;
					assertArtifactReadActive(signal);
					const bytes = chunk.subarray(0, observed.bytesRead);
					sourceHash.update(bytes);
					const start = slice === undefined ? position : Math.max(position, slice.offset);
					const end = slice === undefined ? position + bytes.length : Math.min(position + bytes.length, slice.offset + slice.size);
					if (end > start) {
						const admitted = bytes.subarray(start - position, end - position);
						inputHash.update(admitted);
						await input.write(admitted);
						assertArtifactReadActive(signal);
					}
					position += observed.bytesRead;
				}
				if (sourceHash.digest("hex") !== this.target.sha256) throw new AnalysisProtocolError("IDA target changed between admission and the private input copy; reopen the target.");
				this.#inputSha256 = inputHash.digest("hex");
			}
			/** Delete only this object's privately allocated directory after worker cleanup. */
			async remove() {
				await this.#files.close();
				await this.runtime.close();
			}
		};
	})))();
}

//#endregion
//#region dist/kuna/KunaRelease.js
var KUNA_VERIFIED_VERSION, KUNA_PROVIDER_ID, KUNA_COMMAND_REMEDIATION, KUNA_UNSUPPORTED_HOST_REMEDIATION, KUNA_VERSION_PROBE_REMEDIATION;
function init_KunaRelease() {
	return (init_KunaRelease = __esmMin((() => {
		KUNA_VERIFIED_VERSION = "1.833";
		KUNA_PROVIDER_ID = "kuna";
		KUNA_COMMAND_REMEDIATION = `Set REA_KUNA_COMMAND to the absolute path of a caller-supplied kuna executable (verified with ${KUNA_VERIFIED_VERSION}). REA does not download, install or update Kuna.`;
		KUNA_UNSUPPORTED_HOST_REMEDIATION = "Use Linux or macOS for the Kuna provider. Windows process-tree ownership for Kuna is not verified.";
		KUNA_VERSION_PROBE_REMEDIATION = "Run the selected executable with --version: it must exit promptly and print `kuna <major>.<minor>`.";
	})))();
}

//#endregion
//#region dist/kuna/KunaConfiguration.js
var MAX_KUNA_JOBS, DEFAULT_PROJECT_TIMEOUT_MS, DEFAULT_FUNCTION_TIMEOUT_MS, DEFAULT_JOBS, DEFAULT_CACHE_MAX_BYTES, MIN_CACHE_MAX_BYTES, kunaFunctionDeadline, kunaProjectDeadline, failure$1, positiveInteger, readKunaConfiguration;
function init_KunaConfiguration() {
	return (init_KunaConfiguration = __esmMin((() => {
		init_kunaCacheDirectory();
		init_homeDirectory();
		init_providerStartupTimeout();
		init_result();
		init_KunaRelease();
		MAX_KUNA_JOBS = 32;
		DEFAULT_PROJECT_TIMEOUT_MS = 30 * 60 * 1e3;
		DEFAULT_FUNCTION_TIMEOUT_MS = 12e4;
		DEFAULT_JOBS = 1;
		DEFAULT_CACHE_MAX_BYTES = 4 * 1024 ** 3;
		MIN_CACHE_MAX_BYTES = 1024 ** 2;
		kunaFunctionDeadline = (configuration) => ({
			setting: "REA_KUNA_TIMEOUT_MS",
			ms: configuration.functionTimeoutMs
		});
		kunaProjectDeadline = (configuration) => ({
			setting: "REA_KUNA_PROJECT_TIMEOUT_MS",
			ms: configuration.projectTimeoutMs
		});
		failure$1 = (code, reason, setting = null) => err({
			code,
			reason,
			setting,
			remediation: code === "unsupported_host" ? KUNA_UNSUPPORTED_HOST_REMEDIATION : setting === null || setting === "REA_KUNA_COMMAND" ? KUNA_COMMAND_REMEDIATION : `Correct ${setting} to meet the reported constraint, or unset it to use its default. Restart REA after changing the environment.`
		});
		positiveInteger = (value) => /^[1-9]\d*$/u.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
		readKunaConfiguration = (environment, platform = process.platform) => {
			const command = environment.REA_KUNA_COMMAND;
			if (command === undefined || command.length === 0) return failure$1("not_configured", KUNA_COMMAND_REMEDIATION);
			if (!isAbsolute(command)) return failure$1("open_options_invalid", `REA_KUNA_COMMAND must be an absolute path; received ${command}. ${KUNA_COMMAND_REMEDIATION}`, "REA_KUNA_COMMAND");
			if (platform !== "darwin" && platform !== "linux") return failure$1("unsupported_host", KUNA_UNSUPPORTED_HOST_REMEDIATION);
			const cacheRoot = environment.REA_KUNA_CACHE_DIR;
			if (cacheRoot !== undefined && !isAbsolute(cacheRoot)) return failure$1("open_options_invalid", `REA_KUNA_CACHE_DIR must be an absolute directory; received ${cacheRoot}.`, "REA_KUNA_CACHE_DIR");
			const rawMaxBytes = environment.REA_KUNA_CACHE_MAX_BYTES;
			const cacheMaxBytes = rawMaxBytes === undefined ? DEFAULT_CACHE_MAX_BYTES : positiveInteger(rawMaxBytes);
			if (cacheMaxBytes === undefined || cacheMaxBytes < MIN_CACHE_MAX_BYTES) return failure$1("open_options_invalid", `REA_KUNA_CACHE_MAX_BYTES must be a decimal byte count of at least ${String(MIN_CACHE_MAX_BYTES)}; received ${String(rawMaxBytes)}.`, "REA_KUNA_CACHE_MAX_BYTES");
			const rawTimeout = environment.REA_KUNA_PROJECT_TIMEOUT_MS;
			const timeout = rawTimeout === undefined ? undefined : providerStartupTimeoutSchema.safeParse(rawTimeout);
			if (timeout !== undefined && !timeout.success) return failure$1("open_options_invalid", `REA_KUNA_PROJECT_TIMEOUT_MS must be a decimal millisecond count from 1 to 2147483647; received ${String(rawTimeout)}.`, "REA_KUNA_PROJECT_TIMEOUT_MS");
			const rawFunctionTimeout = environment.REA_KUNA_TIMEOUT_MS;
			const functionTimeout = rawFunctionTimeout === undefined ? undefined : providerStartupTimeoutSchema.safeParse(rawFunctionTimeout);
			if (functionTimeout !== undefined && !functionTimeout.success) return failure$1("open_options_invalid", `REA_KUNA_TIMEOUT_MS must be a decimal millisecond count from 1 to 2147483647; received ${String(rawFunctionTimeout)}.`, "REA_KUNA_TIMEOUT_MS");
			const rawJobs = environment.REA_KUNA_JOBS;
			const jobs = rawJobs === undefined ? DEFAULT_JOBS : positiveInteger(rawJobs);
			if (jobs === undefined || jobs > MAX_KUNA_JOBS) return failure$1("open_options_invalid", `REA_KUNA_JOBS must be an integer from 1 to ${String(MAX_KUNA_JOBS)}; received ${String(rawJobs)}.`, "REA_KUNA_JOBS");
			return ok({
				command,
				cacheRoot: cacheRoot ?? defaultKunaCacheDirectory(homeDirectoryFromEnvironment(environment, platform), environment, platform),
				cacheMaxBytes,
				projectTimeoutMs: timeout?.data ?? DEFAULT_PROJECT_TIMEOUT_MS,
				functionTimeoutMs: functionTimeout?.data ?? DEFAULT_FUNCTION_TIMEOUT_MS,
				jobs
			});
		};
	})))();
}

//#endregion
//#region dist/kuna/KunaInstallation.js
var VERSION_PROBE_TIMEOUT_MS, VERSION_PROBE_MAX_OUTPUT_BYTES, VERSION_LINE, versionProbeOutput, versionProbeOutputDiagnostics, installationFailureDiagnostics, kunaInstallationFailureDiagnostics, kunaInstallationCancellation, createKunaResourceScope, kunaChildEnvironment, failure, message$1, recordPartialInstallationFileOperation, inspectKunaInstallation;
function init_KunaInstallation() {
	return (init_KunaInstallation = __esmMin((() => {
		init_RegularFile();
		init_jsonValue();
		init_analysisErrorCore();
		init_result();
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		init_StableFileHash();
		init_OwnedRegularFile();
		init_OwnedCommand();
		init_OwnedCommandCleanup();
		init_KunaConfiguration();
		init_KunaRelease();
		VERSION_PROBE_TIMEOUT_MS = 1e4;
		VERSION_PROBE_MAX_OUTPUT_BYTES = 64 * 1024;
		VERSION_LINE = /^kuna (\d+\.\d+(?:\.\d+)?)\r?\n?$/u;
		versionProbeOutput = (snapshot) => ({
			stdout: snapshot?.stdout.text ?? "",
			stderr: snapshot?.stderr.text ?? "",
			exitCode: snapshot?.exitCode ?? null,
			signal: snapshot?.signal ?? null,
			stdoutBytes: snapshot?.stdout.bytes ?? 0,
			stdoutObservedBytes: snapshot?.stdout.observedBytes ?? 0,
			stderrBytes: snapshot?.stderr.bytes ?? 0,
			stderrObservedBytes: snapshot?.stderr.observedBytes ?? 0,
			stdoutInvalidUtf8: snapshot?.stdout.invalidUtf8 === true,
			stderrInvalidUtf8: snapshot?.stderr.invalidUtf8 === true,
			diagnosticTruncated: snapshot?.diagnosticTruncated === true,
			outputIncomplete: snapshot?.outputIncomplete === true,
			truncated: snapshot?.diagnosticTruncated === true || snapshot?.outputIncomplete === true || snapshot !== null && snapshot !== undefined && snapshot.stdout.bytes < snapshot.stdout.observedBytes
		});
		versionProbeOutputDiagnostics = (output) => ({
			stdout: output.stdout,
			stderr: output.stderr,
			exit_code: output.exitCode,
			signal: output.signal,
			stdout_bytes: output.stdoutBytes,
			stdout_observed_bytes: output.stdoutObservedBytes,
			stderr_bytes: output.stderrBytes,
			stderr_observed_bytes: output.stderrObservedBytes,
			...output.stdoutInvalidUtf8 ? { stdout_invalid_utf8: true } : {},
			...output.stderrInvalidUtf8 ? { stderr_invalid_utf8: true } : {},
			diagnostic_truncated: output.diagnosticTruncated,
			output_incomplete: output.outputIncomplete,
			output_truncated: output.truncated
		});
		installationFailureDiagnostics = new WeakMap();
		kunaInstallationFailureDiagnostics = (cause) => cause instanceof Error ? installationFailureDiagnostics.get(cause) : undefined;
		kunaInstallationCancellation = (cause) => {
			const cancellation = regularFileCancellation(cause);
			if (cancellation === undefined) return undefined;
			const diagnostics = kunaInstallationFailureDiagnostics(cause);
			return {
				reason: cancellation.reason,
				...diagnostics === undefined ? {} : { diagnostics }
			};
		};
		createKunaResourceScope = (parent) => {
			const leases = new Map();
			const pendingLeases = () => [...leases.values()].map(({ lease }) => lease).filter((lease) => !lease.released);
			const bindPendingFailure = (error) => {
				const retained = pendingLeases();
				if (retained.length > 0) new AnalysisCleanupLeaseGroup(error, retained);
			};
			const cleanupResources = (pending = pendingLeases()) => {
				if (pending.some((lease) => lease.cleanupResources === undefined)) return undefined;
				return [...new Set(pending.flatMap((lease) => lease.cleanupResources ?? []))];
			};
			return {
				get hasPending() {
					return pendingLeases().length > 0;
				},
				get cleanupResources() {
					return cleanupResources();
				},
				installationCancellationError: (cause, operation) => {
					const cancellation = kunaInstallationCancellation(cause);
					if (cancellation === undefined) return undefined;
					const pending = pendingLeases();
					const error = new AnalysisCancelledError(operation, {
						cause: cancellation.reason,
						diagnostics: cancellation.diagnostics,
						...pending.length === 0 ? {} : { cleanup: {
							reason: "Kuna version-probe process cleanup is unconfirmed.",
							resources: cleanupResources(pending) ?? []
						} }
					});
					bindPendingFailure(error);
					return error;
				},
				owner: {
					retain: (owner, resource) => {
						const lease = AnalysisCleanupLease.forCloseOwner(owner, resource);
						leases.set(owner, { lease });
						parent.retain({
							close: () => lease.release(),
							get cleanupResources() {
								return lease.cleanupResources;
							}
						}, resource);
					},
					run: (operation) => parent.run(operation)
				},
				bindFailure: (failure, error) => {
					if (leases.has(failure.owner)) bindPendingFailure(error);
				},
				bindRetainedFailure: bindPendingFailure
			};
		};
		kunaChildEnvironment = (configuration) => {
			const home = join(configuration.cacheRoot, "home");
			return {
				HOME: home,
				XDG_CACHE_HOME: join(home, ".cache"),
				NO_COLOR: "1"
			};
		};
		failure = (code, reason, diagnostics) => err({
			code,
			reason,
			diagnostics
		});
		message$1 = (cause) => cause instanceof Error ? cause.message : String(cause);
		recordPartialInstallationFileOperation = (cause, facts) => {
			const cancellation = regularFileCancellation(cause);
			if (!(cause instanceof Error) || !(cause instanceof RegularFileCleanupFailure) && cancellation === undefined) return false;
			const outcome = cause instanceof RegularFileCancelled || cause instanceof RegularFileCleanupFailure ? cause.outcome : undefined;
			const completed = outcome?.kind === "completed" ? outcome.value : undefined;
			const completedRecord = completed !== null && typeof completed === "object" && !Array.isArray(completed) ? completed : undefined;
			const completedFingerprint = facts.observed.phase === "fingerprint" ? completed : completedRecord === undefined ? undefined : {
				sha256: completedRecord["sha256"],
				bytes: completedRecord["bytes"]
			};
			const completedHash = facts.observed.completedHash ?? (outcome?.kind === "completed" && completedFingerprint !== undefined ? jsonValueSchema.parse(completedFingerprint) : undefined);
			const completedScript = facts.observed.script ?? (facts.observed.phase === "identity" && Buffer.isBuffer(completedRecord?.["prefix"]) ? completedRecord["prefix"].toString("latin1") === "#!" : undefined);
			installationFailureDiagnostics.set(cause, {
				kuna_installation: {
					status: "partial",
					command: facts.command,
					executable: facts.executable,
					...facts.version === undefined ? {} : {
						version: facts.version,
						verified: facts.version === KUNA_VERIFIED_VERSION
					},
					...completedHash === undefined ? {} : { completed_hash: completedHash },
					...completedScript === undefined ? {} : { script: completedScript },
					...facts.observed.beforeProbeFingerprint === undefined ? {} : {
						before_probe_sha256: facts.observed.beforeProbeFingerprint.sha256,
						before_probe_bytes: facts.observed.beforeProbeFingerprint.bytes
					}
				},
				...facts.observed.probe === undefined ? {} : { kuna_version_probe: {
					status: "completed",
					deadline_ms: facts.observed.probe.deadlineMs,
					...versionProbeOutputDiagnostics(facts.observed.probe.output)
				} }
			});
			return true;
		};
		inspectKunaInstallation = async (environment, options) => {
			const configuration = readKunaConfiguration(environment, options.platform);
			if (!configuration.ok) return err({
				code: configuration.error.code,
				reason: configuration.error.reason,
				remediation: configuration.error.remediation,
				diagnostics: {
					configured: configuration.error.code !== "not_configured",
					...configuration.error.setting === null ? {} : { setting: configuration.error.setting }
				}
			});
			const { command } = configuration.value;
			assertRegularFileActive(options.signal);
			let executable;
			try {
				executable = await realpath(command);
				await access(executable, constants.X_OK);
				if (!(await stat(executable)).isFile()) return failure("executable_missing", `REA_KUNA_COMMAND is not a regular file: ${command}. ${KUNA_COMMAND_REMEDIATION}`, { command });
			} catch (cause) {
				return failure("executable_missing", `Cannot execute REA_KUNA_COMMAND ${command}: ${message$1(cause)}. ${KUNA_COMMAND_REMEDIATION}`, { command });
			}
			assertRegularFileActive(options.signal);
			let beforeProbeFingerprint;
			const beforeProbeObservation = { phase: "fingerprint" };
			try {
				beforeProbeFingerprint = await options.resourceScope.run(() => hashStableFile(executable, {
					...options.signal === undefined ? {} : { signal: options.signal },
					retainFailedClose: (owner) => options.resourceScope.retain(owner, executable)
				}));
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure) throw cause;
				if (recordPartialInstallationFileOperation(cause, {
					command,
					executable,
					observed: beforeProbeObservation
				})) throw cause;
				return failure("executable_missing", `Cannot fingerprint ${executable}: ${message$1(stableFileHashCause(cause))}`, {
					command,
					executable
				});
			}
			const deadline = options.probeTimeoutMs ?? VERSION_PROBE_TIMEOUT_MS;
			let snapshot;
			try {
				snapshot = await options.resourceScope.run(() => runOwnedCommand({
					command: executable,
					arguments: ["--version"],
					runId: `rea-kuna-version-${randomUUID()}`,
					expectedCommand: null,
					hostEnvironment: kunaChildEnvironment(configuration.value)
				}, {
					timeoutMs: deadline,
					diagnosticBytes: VERSION_PROBE_MAX_OUTPUT_BYTES
				}, {
					...options.signal === undefined ? {} : { signal: options.signal },
					...options.processLauncher === undefined ? {} : { launcher: options.processLauncher }
				}));
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure) throw cause;
				const retainedCleanup = retainOwnedCommandCleanup(cause, options.resourceScope, "kuna", "kuna:installation");
				const cleanupIncomplete = retainedCleanup.length > 0;
				if (cause instanceof OwnedCommandFailure) {
					const output = versionProbeOutput(cause.snapshot);
					if (cause.reason === "cancelled") {
						const cancellation = new RegularFileOperationCancelled(cause.cancellation?.reason);
						installationFailureDiagnostics.set(cancellation, { kuna_version_probe: {
							status: "partial",
							command,
							executable,
							deadline_ms: deadline,
							...versionProbeOutputDiagnostics(output),
							probe_failure_reason: cause.reason,
							cleanup_incomplete: cleanupIncomplete
						} });
						throw cancellation;
					}
					return failure("version_unresolved", `${executable} --version failed: ${output.stderr.trim() || cause.message}. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
						command,
						executable,
						probe_failure_reason: cause.reason,
						cleanup_incomplete: cleanupIncomplete,
						deadline_ms: deadline,
						...versionProbeOutputDiagnostics(output)
					});
				}
				return failure("version_unresolved", `${executable} --version failed: ${message$1(cause)}. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
					command,
					executable,
					exit_code: null,
					signal: null,
					cleanup_incomplete: cleanupIncomplete,
					deadline_ms: deadline
				});
			}
			const probeOutput = versionProbeOutput(snapshot);
			if (probeOutput.truncated) return failure("version_unresolved", `${executable} --version output was incomplete. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
				command,
				executable,
				deadline_ms: deadline,
				output_truncated: true,
				stdout: probeOutput.stdout.slice(0, 256)
			});
			const version = VERSION_LINE.exec(probeOutput.stdout)?.[1];
			if (version === undefined) return failure("version_unresolved", `${executable} --version printed no recognizable Kuna version. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
				command,
				executable,
				stdout: probeOutput.stdout.slice(0, 256)
			});
			let fingerprint;
			let script;
			const observed = {
				phase: "fingerprint",
				beforeProbeFingerprint,
				probe: {
					deadlineMs: deadline,
					output: probeOutput
				}
			};
			try {
				({fingerprint, script} = await options.resourceScope.run(async () => {
					observed.phase = "identity";
					const observation = await observeStableFile(executable, {
						...options.signal === undefined ? {} : { signal: options.signal },
						retainFailedClose: (owner) => options.resourceScope.retain(owner, executable)
					});
					const fingerprint = {
						sha256: observation.sha256,
						bytes: observation.bytes
					};
					const script = observation.prefix.length === 2 && observation.prefix.toString("latin1") === "#!";
					observed.completedHash = fingerprint;
					observed.script = script;
					assertRegularFileActive(options.signal);
					return {
						fingerprint,
						script
					};
				}));
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure) throw cause;
				if (recordPartialInstallationFileOperation(cause, {
					command,
					executable,
					version,
					observed
				})) {
					throw cause;
				}
				return failure("executable_missing", `Cannot observe ${executable} after its --version probe: ${message$1(stableFileHashCause(cause))}`, {
					command,
					executable,
					version,
					verified: version === KUNA_VERIFIED_VERSION,
					identity_observation_phase: "post_probe",
					identity_observation_failure: message$1(stableFileHashCause(cause)),
					before_probe_sha256: beforeProbeFingerprint.sha256,
					before_probe_bytes: beforeProbeFingerprint.bytes,
					deadline_ms: deadline,
					...versionProbeOutputDiagnostics(probeOutput)
				});
			}
			if (beforeProbeFingerprint.sha256 !== fingerprint.sha256 || beforeProbeFingerprint.bytes !== fingerprint.bytes) return failure("version_unresolved", `${executable} changed during the --version probe. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
				command,
				executable,
				version,
				verified: version === KUNA_VERIFIED_VERSION,
				installation_identity_changed: true,
				before_sha256: beforeProbeFingerprint.sha256,
				before_bytes: beforeProbeFingerprint.bytes,
				after_sha256: fingerprint.sha256,
				after_bytes: fingerprint.bytes,
				deadline_ms: deadline,
				...versionProbeOutputDiagnostics(probeOutput)
			});
			return ok({
				configuration: configuration.value,
				executable,
				version,
				verified: version === KUNA_VERIFIED_VERSION,
				...fingerprint,
				script
			});
		};
	})))();
}

//#endregion
//#region dist/kuna/KunaCommand.js
var KUNA_INVENTORY_OUTPUT_BYTES, message, kunaFileCleanupError, kunaRetainedResourceCleanupError, verifiedExecutables, verifyExecutable, runKunaCommand, copyAndHash, commandFailure;
function init_KunaCommand() {
	return (init_KunaCommand = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_providerCleanupError();
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_OwnedCommand();
		init_StableFileHash();
		init_OwnedRegularFile();
		init_KunaInstallation();
		init_KunaRelease();
		KUNA_INVENTORY_OUTPUT_BYTES = 128 * 1024 * 1024;
		message = (cause) => cause instanceof Error ? cause.message : String(cause);
		kunaFileCleanupError = (failure, operation) => {
			const diagnostics = kunaInstallationFailureDiagnostics(failure);
			const cancellation = regularFileCancellation(failure);
			if (cancellation !== undefined) return new AnalysisCancelledError(operation, {
				cause: cancellation.reason,
				diagnostics,
				cleanup: {
					reason: message(failure.cleanupCause),
					resources: [failure.path]
				}
			});
			const cleanup = new ProviderCleanupError(KUNA_PROVIDER_ID, [failure.path], {
				reason: message(failure.cleanupCause),
				...diagnostics
			}, {
				cause: failure,
				operation
			});
			if (failure.outcome.kind === "completed") return cleanup;
			const primaryCause = failure.outcome.cause;
			const primary = primaryCause instanceof AnalysisError ? primaryCause : new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
				cause: primaryCause,
				diagnostics,
				userMessage: `Kuna ${operation} failed: ${message(primaryCause)}`
			});
			return analysisErrorWithCleanupFailure(primary, cleanup, operation);
		};
		kunaRetainedResourceCleanupError = (cause, operation) => {
			if (!(cause instanceof ArtifactReaderFailure) || cause.cleanupLeases === undefined || cause.cleanupLeases.length === 0) return undefined;
			const cleanup = new ProviderCleanupError(KUNA_PROVIDER_ID, cause.cleanup?.resources ?? [], { reason: message(cause) }, {
				cause,
				operation
			});
			bindArtifactFileCleanup(cause, cleanup);
			return cleanup;
		};
		verifiedExecutables = new Map();
		verifyExecutable = async (installation, signal, retainFailedFileClose) => {
			const status = await stat(installation.executable, { bigint: true });
			const identity = [
				status.dev,
				status.ino,
				status.size,
				status.mtimeNs,
				status.ctimeNs
			].join(":");
			const known = verifiedExecutables.get(installation.executable);
			let sha256 = known?.identity === identity ? known.sha256 : undefined;
			if (sha256 === undefined) {
				sha256 = (await hashStableFile(installation.executable, {
					signal,
					retainFailedClose: (owner) => retainFailedFileClose(owner, installation.executable)
				})).sha256;
				verifiedExecutables.set(installation.executable, {
					identity,
					sha256
				});
			}
			return sha256 === installation.sha256 ? undefined : sha256;
		};
		runKunaCommand = async (request) => {
			const { installation } = request;
			try {
				const changed = await verifyExecutable(installation, request.signal, request.retainFailedFileClose);
				if (changed !== undefined) return {
					kind: "failed",
					error: new ProviderAdapterError(KUNA_PROVIDER_ID, request.operation, {
						userMessage: `${installation.executable} changed after this target was opened; reopen the target so REA probes the current Kuna executable.`,
						diagnostics: {
							expected_sha256: installation.sha256,
							observed_sha256: changed
						}
					})
				};
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) {
					return {
						kind: "failed",
						error: kunaFileCleanupError(cause, request.operation),
						fileCleanupFailure: cause
					};
				}
				const cancellation = regularFileCancellation(cause);
				return {
					kind: "failed",
					error: cancellation !== undefined ? new AnalysisCancelledError(request.operation, { cause: cancellation.reason }) : new ProviderAdapterError(KUNA_PROVIDER_ID, request.operation, {
						cause,
						userMessage: `Cannot verify ${installation.executable}: ${message(cause)}`
					})
				};
			}
			try {
				const snapshot = await runOwnedCommand({
					command: installation.executable,
					arguments: request.arguments,
					runId: `rea-kuna-${randomUUID()}`,
					...installation.script ? { expectedCommand: null } : {},
					cwd: request.workspace,
					hostEnvironment: kunaChildEnvironment(installation.configuration),
					env: { TMPDIR: request.workspace }
				}, {
					timeoutMs: Math.max(1, request.timeoutMs),
					diagnosticBytes: request.outputBytes,
					...request.stdout === undefined ? {} : { stdout: request.stdout }
				}, {
					signal: request.signal,
					...request.launcher === undefined ? {} : { launcher: request.launcher }
				});
				return {
					kind: "ok",
					snapshot
				};
			} catch (cause) {
				return commandFailure(cause, request);
			}
		};
		copyAndHash = async (source, destination, signal) => {
			const hash = createHash("sha256");
			await pipeline(createReadStream(source), new Transform({ transform(chunk, _encoding, callback) {
				hash.update(chunk);
				callback(null, chunk);
			} }), createWriteStream(destination, {
				flags: "wx",
				mode: 384
			}), { signal });
			return hash.digest("hex");
		};
		commandFailure = (cause, request) => {
			const { operation } = request;
			const subcommand = request.arguments[0] ?? "";
			if (!(cause instanceof OwnedCommandFailure)) return {
				kind: "failed",
				error: new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
					cause,
					userMessage: `Cannot run ${request.installation.executable}: ${message(cause)}`
				})
			};
			const snapshot = cause.snapshot;
			const capturedOutput = snapshot === null ? undefined : {
				stdout: cause.reason === "output-limit" ? "" : snapshot.stdout.text.slice(-4096),
				stderr: snapshot.stderr.text,
				truncated: snapshot.diagnosticTruncated === true || snapshot.outputIncomplete === true || snapshot.stdout.text.length > 4096,
				exit_code: snapshot.exitCode ?? null,
				signal: snapshot.signal ?? null
			};
			const details = {
				cause,
				...capturedOutput === undefined ? {} : { capturedOutput }
			};
			let primary;
			if (cause.reason === "cancelled") primary = new AnalysisCancelledError(operation, {
				...details,
				cause: cause.cancellation?.reason
			});
			else if (cause.reason === "timeout") {
				const { setting, ms } = request.deadline;
				primary = new AnalysisTimeoutError(operation, ms, {
					...details,
					userMessage: `kuna ${subcommand} did not finish within ${setting} (${String(ms)} ms).`,
					remediationAction: `Raise ${setting} in the environment that starts REA, then restart REA; it reads Kuna settings when it starts.${subcommand === "decompile" ? " Within a session, pseudocode is also read from the project export once it finishes." : ""}`
				});
			} else if (cause.reason === "output-limit") primary = new AnalysisResourceConstraintError(operation, "memory", `kuna ${subcommand} wrote more than ${String(request.outputBytes)} bytes of output.`, { output_limit_bytes: request.outputBytes }, {
				...details,
				remediationAction: `REA buffers at most ${String(request.outputBytes)} bytes of kuna ${subcommand} output, so repeating this request for this target fails the same way. Use another provider for it.`
			});
			else {
				const exitCode = capturedOutput?.exit_code;
				primary = new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
					...details,
					userMessage: `kuna ${subcommand} failed${exitCode === undefined || exitCode === null ? "" : ` with exit code ${String(exitCode)}`}: ${capturedOutput?.stderr.trim().split("\n").at(-1) || cause.message}`
				});
			}
			if (cause.cleanupFailure !== null) return {
				kind: "retained",
				processResources: cause.resources,
				error: new ProviderCleanupError(KUNA_PROVIDER_ID, [...cause.resources, request.workspace], { reason: cause.cleanupFailure }, {
					...details,
					operation,
					cleanupPrimary: primary
				}),
				owner: cause.cleanupOwner
			};
			return {
				kind: "failed",
				error: primary
			};
		};
	})))();
}

//#endregion
export { IdaWorkspace, KUNA_COMMAND_REMEDIATION, KUNA_INVENTORY_OUTPUT_BYTES, KUNA_PROVIDER_ID, KUNA_UNSUPPORTED_HOST_REMEDIATION, KUNA_VERIFIED_VERSION, KUNA_VERSION_PROBE_REMEDIATION, copyAndHash, createKunaResourceScope, ghidraInstallationDiagnostics, ghidraJavaEnvironment, idaConfigurationError, idaFileDigest, idaProtocol, idaRegistrationTimeoutGuidance, init_GhidraInstallation, init_GhidraJavaProperties, init_GhidraReleasePolicy, init_IdaConfiguration, init_IdaWorkspace, init_KunaCommand, init_KunaConfiguration, init_KunaInstallation, init_KunaRelease, init_LinuxPrivateDisplayDiagnostic, init_LinuxPrivateDisplayProbe, inspectGhidraInstallation, inspectKunaInstallation, kunaFileCleanupError, kunaFunctionDeadline, kunaInstallationFailureDiagnostics, kunaProjectDeadline, kunaRetainedResourceCleanupError, parseGhidraJavaProperties, parseLinuxPrivateDisplayDiagnostic, readIdaConfiguration, readKunaConfiguration, resolveIdaWorkspaceParent, runKunaCommand, sameIdaHostPath, selectLinuxPrivateDisplayStrategy, unverifiedGhidraBuildLimitation };