import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_JADX_OPERATION_TIMEOUT_MS, analysisSettingLimit, init_analysisResourceLimits, init_analysisSettingDefinitions, init_urlComponents, urlDeclaresQueryOrFragment } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisError, AnalysisInputError, AnalysisTimeoutError, err, init_analysisErrorBase, init_analysisErrorCore, init_jsonValue, init_result, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { ProviderAdapterError, init_providerAdapterError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-PV1DaSaC.js";
import { ArtifactFileCancelled, ArtifactFileCleanupFailure, bindArtifactFileCleanup, init_ArtifactFileOperation, withArtifactRegularFile } from "./ArtifactFileOperation-o-ukSUGG.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { DarwinProcessOwnershipInspectionError, init_DarwinProcessRunTokenReader } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-CIerZEwx.js";
import { init_WindowsNativeLoader, systemWindowsNativeAuthority } from "./WindowsNativeLoader-B88N4705.js";
import { OwnedCommandFailure, init_OwnedCommand, prepareOwnedCommand, runOwnedCommand } from "./OwnedCommand-BzzUKKpJ.js";
import { init_WindowsAuthority, inspectWindowsNativeReadiness } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { analysisClientFailureForOperation, init_AnalysisClientFailure, init_OwnedCommandCleanup, retainOwnedCommandCleanup } from "./OwnedCommandCleanup-BGs5-QvP.js";
import { ZipArtifactReader, init_ZipArtifactReader } from "./ZipArtifactReader-CuoDflLN.js";
import { randomUUID } from "node:crypto";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { access, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";

//#region dist/android/JadxInterruption.js
var JadxInterruption, throwIfJadxInterrupted;
function init_JadxInterruption() {
	return (init_JadxInterruption = __esmMin((() => {
		JadxInterruption = class extends Error {
			reason;
			constructor(reason) {
				super("Android operation interrupted", { cause: reason });
				this.reason = reason;
				this.name = "AbortError";
			}
		};
		throwIfJadxInterrupted = (signal) => {
			if (signal?.aborted === true) throw new JadxInterruption(signal.reason);
		};
	})))();
}

//#endregion
//#region dist/android/JadxOperationTimeout.js
var JADX_OPERATION_TIMEOUT_REMEDIATION, jadxOperationTimeoutGuidance;
function init_JadxOperationTimeout() {
	return (init_JadxOperationTimeout = __esmMin((() => {
		init_analysisSettingDefinitions();
		init_analysisResourceLimits();
		JADX_OPERATION_TIMEOUT_REMEDIATION = `Set REA_JADX_OPERATION_TIMEOUT_MS to a decimal millisecond count from 1 to 2147483647, or unset it to keep the ${String(DEFAULT_JADX_OPERATION_TIMEOUT_MS)} ms default.`;
		jadxOperationTimeoutGuidance = (timeoutMs) => ({
			limit: analysisSettingLimit("jadx.operation_timeout_ms", timeoutMs, undefined),
			userMessage: `JADX reached its configured operation deadline of ${String(timeoutMs)} ms (deadlineExpired).`,
			remediationAction: `Set REA_JADX_OPERATION_TIMEOUT_MS in REA's launch environment to an integer from 1 to 2147483647 milliseconds (omitted means ${String(DEFAULT_JADX_OPERATION_TIMEOUT_MS)} ms). For a running MCP server, use update_analysis_settings with setting jadx.operation_timeout_ms and action set; it applies to the next operation without restarting REA. Environment changes apply on the next REA process start. The effective deadline for this attempt was ${String(timeoutMs)} ms. It does not raise the bridge's 30000 ms startup handshake. Raising only the MCP client deadline does not change this budget. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.`
		});
	})))();
}

//#endregion
//#region dist/android/JadxJavaProbe.js
var JAVA_MODULE_LISTING_TIMEOUT_MS, JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES, refusal, capturedOutput, projectRefusal, inspectJadxJava, commandProbeRefusal, parseJavaModules;
function init_JadxJavaProbe() {
	return (init_JadxJavaProbe = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_analysisErrorCleanup();
		init_jsonValue();
		init_result();
		init_OwnedCommand();
		init_DarwinProcessRunTokenReader();
		init_OwnedCommandCleanup();
		init_AnalysisClientFailure();
		init_JadxOperationTimeout();
		JAVA_MODULE_LISTING_TIMEOUT_MS = 1e4;
		JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES = 1024 * 1024;
		refusal = (code, message, diagnostics, kind) => err({
			code,
			message,
			diagnostics,
			kind
		});
		capturedOutput = (snapshot) => ({
			stdout: snapshot.stdout.text,
			stderr: snapshot.stderr.text,
			stdout_bytes: snapshot.stdout.observedBytes,
			stderr_bytes: snapshot.stderr.observedBytes,
			truncated: snapshot.diagnosticTruncated === true || snapshot.outputIncomplete === true,
			exit_code: snapshot.exitCode ?? null,
			signal: snapshot.signal ?? null
		});
		projectRefusal = (failure, operation, cause, output) => {
			const { stdout: _stdout, stderr: _stderr, ...facts } = failure.diagnostics;
			return new AnalysisCapabilityUnavailableError("jadx", operation, failure.message, {
				cause,
				userMessage: failure.message,
				diagnostics: {
					...facts,
					failure_kind: failure.kind,
					failure_code: failure.code
				},
				...output === undefined ? {} : { capturedOutput: output }
			});
		};
		inspectJadxJava = async (java, environment, options) => {
			const operation = options.operation ?? "inspect_jadx_configuration";
			try {
				return await options.resourceOwner.run(async () => {
					let observed;
					try {
						await prepareOwnedCommand(options.signal);
						await runOwnedCommand({
							command: java,
							arguments: ["--list-modules"],
							runId: randomUUID(),
							expectedCommand: null,
							hostEnvironment: environment,
							sweepTokenOwnedProcesses: true
						}, {
							timeoutMs: options.timeoutMs ?? JAVA_MODULE_LISTING_TIMEOUT_MS,
							diagnosticBytes: JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES,
							acceptNonZeroExit: true,
							observeCompleted: (snapshot) => {
								observed = parseJavaModules(java, snapshot);
							}
						}, {
							signal: options.signal,
							...options.launcher === undefined ? {} : { launcher: options.launcher }
						});
						if (observed === undefined) throw new Error("Java probe completed without an observation");
						return observed;
					} catch (cause) {
						const command = cause instanceof OwnedCommandFailure ? cause : undefined;
						const preparation = command?.preparationFailure ?? (cause instanceof DarwinProcessOwnershipInspectionError ? cause : undefined);
						const output = command?.snapshot == null ? preparation?.capturedOutput : capturedOutput(command.snapshot);
						const cleanups = retainOwnedCommandCleanup(cause, options.resourceOwner, "jadx", operation);
						let primary;
						if (observed !== undefined && !observed.ok) {
							if (cleanups.length === 0) return observed;
							primary = projectRefusal(observed.error, operation, cause, output);
						} else if (command?.reason === "cancelled" && command.cancellation !== undefined) {
							const reason = command.cancellation.reason;
							const errorOptions = {
								cause: reason,
								...output === undefined ? {} : { capturedOutput: output },
								...observed?.ok === true ? { diagnostics: { java_module_observation: {
									compiler: observed.value.compiler,
									major: observed.value.major
								} } } : {}
							};
							primary = options.operationDeadline?.signal.aborted === true && reason === options.operationDeadline.signal.reason ? new AnalysisTimeoutError(operation, options.operationDeadline.timeoutMs, {
								...errorOptions,
								...jadxOperationTimeoutGuidance(options.operationDeadline.timeoutMs)
							}) : new AnalysisCancelledError(operation, errorOptions);
						} else if (observed?.ok === true && command?.cleanupOwner !== undefined) {
							primary = new ProviderAdapterError("jadx", operation, {
								cause,
								...output === undefined ? {} : { capturedOutput: output },
								diagnostics: {
									stage: "cleanup",
									java_module_observation: {
										compiler: observed.value.compiler,
										major: observed.value.major
									}
								}
							});
						} else if (preparation !== undefined) {
							primary = new ProviderAdapterError("jadx", operation, {
								cause,
								...output === undefined ? {} : { capturedOutput: output },
								diagnostics: {
									stage: "ownership_preparation",
									...preparation.compilerOutcome === undefined ? {} : { compiler_outcome: jsonValueSchema.parse(preparation.compilerOutcome) }
								}
							});
						} else if (cause instanceof AnalysisError) {
							primary = cause;
						} else {
							const failure = commandProbeRefusal(java, command, cause, options.timeoutMs ?? JAVA_MODULE_LISTING_TIMEOUT_MS);
							if (cleanups.length === 0) return err(failure);
							primary = projectRefusal(failure, operation, cause, output);
						}
						for (const cleanup of cleanups) primary = analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
						throw primary;
					}
				});
			} catch (cause) {
				if (cause instanceof AnalysisError) throw cause;
				throw analysisClientFailureForOperation(cause, "jadx", operation);
			}
		};
		commandProbeRefusal = (java, command, cause, timeoutMs) => {
			const output = command?.snapshot == null ? undefined : capturedOutput(command.snapshot);
			const processError = command?.processError ?? (cause instanceof Error ? cause : undefined);
			const systemCode = processError === undefined ? undefined : Reflect.get(processError, "code");
			const limited = command?.reason === "output-limit";
			const timedOut = command?.reason === "timeout";
			return {
				code: systemCode === "ENOENT" ? "runtime_missing" : limited || timedOut ? "version_unresolved" : "runtime_unavailable",
				kind: systemCode === "ENOENT" ? "java_runtime" : "java_probe",
				message: limited ? `The selected Java launcher ${java} exceeded the ${String(JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES)}-byte module-listing output budget. This release has no runtime override. REA retained partial output but could not establish compiler or version availability. Inspect the selected launcher for verbose or unbounded output; java --list-modules should return a concise module listing. REA_JADX_OPERATION_TIMEOUT_MS does not raise this probe.` : timedOut ? `The selected Java launcher ${java} did not finish the module-listing probe within ${String(timeoutMs)} ms. This release has no runtime override. Inspect its startup responsiveness and verify it with java --list-modules. REA_JADX_OPERATION_TIMEOUT_MS does not raise this probe.` : `Cannot inspect selected Java runtime ${java}: ${systemCode === "ENOENT" ? "spawn java ENOENT" : cause instanceof Error ? cause.message : cause === undefined ? `exit ${String(output?.exit_code ?? "unknown")}${output?.signal == null ? "" : ` (${output.signal})`}` : String(cause)}. Review the selected launcher and retained diagnostics.`,
				diagnostics: {
					java_executable: java,
					phase: "module-inspection",
					exit_code: output?.exit_code ?? null,
					process_error_code: typeof systemCode === "string" ? systemCode : null,
					signal: output?.signal ?? null,
					killed: null,
					stdout: output?.stdout ?? "",
					stderr: output?.stderr ?? "",
					output_truncated: output?.truncated ?? true,
					...limited ? {
						failure: "output_limit",
						output_limit_bytes: JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES
					} : {},
					...timedOut ? {
						failure: "probe_terminated",
						deadline_ms: timeoutMs
					} : {}
				}
			};
		};
		parseJavaModules = (java, snapshot) => {
			if (snapshot.exitCode !== 0 || snapshot.signal !== null) return err(commandProbeRefusal(java, {
				reason: "process",
				snapshot,
				processError: undefined
			}, undefined, JAVA_MODULE_LISTING_TIMEOUT_MS));
			const stdout = snapshot.stdout.text;
			const stderr = snapshot.stderr.text;
			const compiler = /^jdk\.compiler(?:@|$)/mu.test(stdout);
			if (!compiler) return refusal("runtime_missing", `Selected Java runtime ${java} does not provide jdk.compiler. Select a full JDK including jdk.compiler via JAVA_HOME or PATH; verify it with java --list-modules. A JRE cannot compile REA's source bridge.`, {
				java_executable: java,
				phase: "module-inspection",
				jdk_compiler: false,
				stdout,
				stderr,
				output_truncated: false
			}, "java_runtime");
			const major = /^java\.base@(\d+)(?:[.+_-]|$)/mu.exec(stdout)?.[1];
			if (major === undefined) return refusal("version_unresolved", `The selected Java launcher ${java} did not report a parseable java.base version in its module listing. Inspect the launcher output and verify it with java --list-modules.`, {
				java_executable: java,
				phase: "module-inspection",
				jdk_compiler: true,
				java_major: null,
				stdout,
				stderr,
				output_truncated: false
			}, "java_probe");
			const majorNumber = Number(major);
			if (!Number.isSafeInteger(majorNumber) || majorNumber <= 0) return refusal("version_unresolved", `The selected Java launcher ${java} reported an invalid java.base major version. Review the retained module listing.`, {
				java_executable: java,
				phase: "module-inspection",
				jdk_compiler: true,
				java_major: null,
				unparsed_java_major: major,
				stdout,
				stderr,
				output_truncated: false
			}, "java_probe");
			if (majorNumber < 17) return refusal("unsupported_version", `Selected Java runtime ${java} must be JDK 17 or newer and include jdk.compiler; verify it with java --list-modules.`, {
				java_executable: java,
				phase: "module-inspection",
				jdk_compiler: true,
				java_major: major ?? null,
				stdout,
				stderr,
				output_truncated: false
			}, "java_runtime");
			return ok({
				compiler: true,
				major: majorNumber
			});
		};
	})))();
}

//#endregion
//#region dist/android/JadxRelease.js
var JADX_RELEASE, JADX_BRIDGE_IDENTITY, JADX_JAR_CONFIGURATION_REMEDIATION, JADX_JAVA_RUNTIME_REMEDIATION, JADX_JVM_OPTIONS_REMEDIATION, JADX_UNSUPPORTED_HOST_REMEDIATION, JADX_WINDOWS_NATIVE_REMEDIATION, JADX_JAVA_PROBE_REMEDIATION, JADX_PROVIDER_IDENTITY, JADX_LIMITATIONS;
function init_JadxRelease() {
	return (init_JadxRelease = __esmMin((() => {
		JADX_RELEASE = Object.freeze({
			version: "0.7.1",
			revision: "5844800a486d2248fa949b74c9896285f5b54de2",
			sha256: "6e5eacf500b64292bfb73c49797c1958f6ee44646e43e868039ae7feb573ff75",
			url: "https://github.com/1013503897/jadx-headless-mcp/releases/download/v0.7.1/jadx-headless-mcp-0.7.1-all.jar"
		});
		JADX_BRIDGE_IDENTITY = Object.freeze({
			name: "rea-jadx-bridge",
			version: "7"
		});
		JADX_JAR_CONFIGURATION_REMEDIATION = `Set REA_JADX_MCP_JAR to the absolute path of a caller-supplied jadx-headless-mcp ${JADX_RELEASE.version} JAR. REA does not download or install it.`;
		JADX_JAVA_RUNTIME_REMEDIATION = "Select a full JDK including jdk.compiler via JAVA_HOME or PATH, then verify it with java --list-modules. REA does not install Java.";
		JADX_JVM_OPTIONS_REMEDIATION = "Set REA_JADX_HEAP_MIB to a positive integer (heap size in MiB) and REA_JADX_ACTIVE_PROCESSOR_COUNT to a positive integer within the JVM's signed 32-bit range.";
		JADX_UNSUPPORTED_HOST_REMEDIATION = "Use Linux, macOS, or Windows x64 with its bundled native controls for Android JADX analysis.";
		JADX_WINDOWS_NATIVE_REMEDIATION = "Use a matching current Windows x64 REA package with its bundled native controls. The native failure above identifies the failed constraint; Java installation or registration changes cannot enable a missing native backend.";
		JADX_JAVA_PROBE_REMEDIATION = "Verify the selected Java launcher with java --list-modules: it must start promptly and emit a concise module listing including a parseable java.base version. REA does not install Java.";
		JADX_PROVIDER_IDENTITY = Object.freeze({
			id: "jadx",
			name: "JADX headless",
			version: JADX_RELEASE.version
		});
		JADX_LIMITATIONS = [
			"Static decompiler observations do not establish runtime behavior; the APK is never executed.",
			"Method signatures use provider display types; DEX prototypes come from frozen JADX metadata. Display names may be aliases, and overload indices are local to this engine and artifact.",
			"Class inventories use parsed metadata before code generation, including synthetic members that may be omitted from decompiled source. Source positions remain unknown.",
			"Incoming reference totals count JADX using nodes. Direct invoke entries within a using method report raw DEX code-unit offsets and method indexes, but coverage is limited to those nodes and directly matched invokes; it does not establish every possible dynamic or reflective call site.",
			"Manifest summaries are parsed once by REA's bridge from the exact root AndroidManifest.xml resource, using namespace-aware XML attributes; decoded XML is retained. APK signatures, split APKs, native libraries and Android runtime capture are not verified by this provider."
		];
	})))();
}

//#endregion
//#region dist/android/JadxConfiguration.js
var JAR_METADATA_READ_MAX_BYTES, JADX_FAILURE_KINDS, projectJadxFailureOutcome, JadxConfigurationFailure, inspectJadxAvailability, resolveJadxOperationTimeout, resolveJadxConfigurationInputs, validateJadxConfiguration, readJadxConfigurationInputs, validateJadxConfigurationContents, projectConfigurationFailure, requireEngineArchive, archiveInspectionFailure, archiveAnalysisFailure, archiveCancellation, requireSupportedHost, resolveJar, resolveJava, requireJavaHomeExecutable, resolveJvmArguments, readOperationTimeout, inspectJavaRuntime, configurationFailure, errorText;
function init_JadxConfiguration() {
	return (init_JadxConfiguration = __esmMin((() => {
		init_analysisResourceLimits();
		init_JadxOperationTimeout();
		init_JadxJavaProbe();
		init_JadxInterruption();
		init_WindowsAuthority();
		init_WindowsNativeLoader();
		init_providerStartupTimeout();
		init_analysisErrorCore();
		init_result();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_providerCleanupError();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_AnalysisClientFailure();
		init_ZipArtifactReader();
		init_JadxRelease();
		JAR_METADATA_READ_MAX_BYTES = 8 * 1024 * 1024;
		JADX_FAILURE_KINDS = [
			"windows_native_artifact",
			"windows_native_runtime",
			"java_runtime",
			"java_home",
			"jvm_options",
			"operation_timeout",
			"jar",
			"java_probe",
			"unsupported_host"
		];
		projectJadxFailureOutcome = (kind, configured) => {
			const drift = configured ? "config_drift" : "missing_analysis_engine";
			switch (kind) {
				case "windows_native_artifact": return {
					remediation: JADX_WINDOWS_NATIVE_REMEDIATION,
					classification: "missing_dependency"
				};
				case "windows_native_runtime": return {
					remediation: JADX_WINDOWS_NATIVE_REMEDIATION,
					classification: "runtime_failure"
				};
				case "java_runtime": return {
					remediation: JADX_JAVA_RUNTIME_REMEDIATION,
					classification: "missing_dependency"
				};
				case "java_home": return {
					remediation: JADX_JAVA_RUNTIME_REMEDIATION,
					classification: drift
				};
				case "jvm_options": return {
					remediation: JADX_JVM_OPTIONS_REMEDIATION,
					classification: drift
				};
				case "operation_timeout": return {
					remediation: JADX_OPERATION_TIMEOUT_REMEDIATION,
					classification: drift
				};
				case "jar": return {
					remediation: JADX_JAR_CONFIGURATION_REMEDIATION,
					classification: drift
				};
				case "java_probe": return {
					remediation: JADX_JAVA_PROBE_REMEDIATION,
					classification: drift
				};
				case "unsupported_host": return {
					remediation: JADX_UNSUPPORTED_HOST_REMEDIATION,
					classification: "unsupported_host"
				};
				case null: return {
					remediation: JADX_JAR_CONFIGURATION_REMEDIATION,
					classification: drift
				};
			}
		};
		JadxConfigurationFailure = class extends Error {
			code;
			diagnostics;
			kind;
			constructor(code, message, diagnostics, kind, options) {
				super(message, options);
				this.code = code;
				this.diagnostics = diagnostics;
				this.kind = kind;
			}
		};
		inspectJadxAvailability = async (environment, options) => {
			try {
				const operationTimeoutMs = readOperationTimeout(environment, options.operationTimeoutMs);
				const configuration = await readJadxConfigurationInputs(environment, options.signal);
				await validateJadxConfigurationContents(configuration, environment, options);
				return {
					status: "available",
					code: null,
					reason: null,
					diagnostics: {
						configured: true,
						java_executable: configuration.java,
						jdk_compiler: true,
						jar_path: configuration.jar,
						operation_timeout_ms: operationTimeoutMs
					}
				};
			} catch (cause) {
				if (cause instanceof JadxInterruption) throw new AnalysisCancelledError(options.operation ?? "inspect_jadx_configuration", { cause: cause.reason });
				if (cause instanceof JadxConfigurationFailure) return {
					status: "unavailable",
					code: cause.code,
					reason: cause.message,
					diagnostics: {
						...cause.diagnostics,
						failure_kind: cause.kind
					}
				};
				throw cause;
			}
		};
		resolveJadxOperationTimeout = (environment, operation, runtimeTimeoutMs) => {
			try {
				return ok(readOperationTimeout(environment, runtimeTimeoutMs));
			} catch (cause) {
				if (!(cause instanceof JadxConfigurationFailure)) throw cause;
				return err(projectConfigurationFailure(operation, cause));
			}
		};
		resolveJadxConfigurationInputs = async (environment, operation, signal) => {
			try {
				return await readJadxConfigurationInputs(environment, signal);
			} catch (cause) {
				if (!(cause instanceof JadxConfigurationFailure)) throw cause;
				throw projectConfigurationFailure(operation, cause);
			}
		};
		validateJadxConfiguration = async (configuration, environment, operation, options) => {
			try {
				await validateJadxConfigurationContents(configuration, environment, {
					...options,
					operation
				});
			} catch (cause) {
				if (!(cause instanceof JadxConfigurationFailure)) throw cause;
				throw projectConfigurationFailure(operation, cause);
			}
		};
		readJadxConfigurationInputs = async (environment, signal) => {
			throwIfJadxInterrupted(signal);
			requireSupportedHost();
			const jar = await resolveJar(environment);
			const java = await resolveJava(environment, signal);
			await requireJavaHomeExecutable(environment.JAVA_HOME, java);
			throwIfJadxInterrupted(signal);
			return {
				jar,
				java,
				jvmArguments: resolveJvmArguments(environment)
			};
		};
		validateJadxConfigurationContents = async (configuration, environment, options) => {
			throwIfJadxInterrupted(options.signal);
			await inspectJavaRuntime(configuration.java, environment, options);
			await requireEngineArchive(configuration.jar, options);
		};
		projectConfigurationFailure = (operation, cause) => {
			const output = cause.diagnostics;
			const { stdout: _stdout, stderr: _stderr, ...facts } = output;
			return new AnalysisCapabilityUnavailableError("jadx", operation, cause.message, {
				cause,
				userMessage: cause.message,
				diagnostics: {
					...facts,
					failure_kind: cause.kind,
					failure_code: cause.code
				},
				...typeof output.stdout === "string" && typeof output.stderr === "string" ? { capturedOutput: {
					stdout: output.stdout,
					stderr: output.stderr,
					truncated: output.output_truncated === true
				} } : {}
			});
		};
		requireEngineArchive = async (jar, options) => {
			const operation = options.operation ?? "inspect_jadx_configuration";
			try {
				await options.resourceOwner.run(() => withArtifactRegularFile(jar, { retain: ({ lease, resource }) => options.resourceOwner.retain({ close: () => lease.release() }, resource) }, options.signal, async ({ handle, initial }) => {
					try {
						const reader = new ZipArtifactReader(jar, "zip", JAR_METADATA_READ_MAX_BYTES, {
							handle,
							initial
						});
						const missing = new Set([
							"com/atxx/jhmcp/JadxSession.class",
							"com/atxx/jhmcp/SessionHolder.class",
							"jadx/api/JadxDecompiler.class",
							"com/google/gson/Gson.class",
							"io/modelcontextprotocol/kotlin/sdk/server/Server.class"
						]);
						for await (const entry of reader.entries(options.signal)) {
							if (entry.kind === "file" && !entry.encrypted) missing.delete(entry.path);
							if (missing.size === 0) return;
						}
						throw configurationFailure("unsupported_version", `REA_JADX_MCP_JAR ${jar} does not contain the required metadata bridge classes: ${[...missing].join(", ")}. ${JADX_JAR_CONFIGURATION_REMEDIATION}`, {
							jar_path: jar,
							phase: "jar-inspection",
							missing_classes: [...missing]
						}, "jar");
					} catch (cause) {
						if (cause instanceof JadxConfigurationFailure || cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") throw cause;
						throw archiveInspectionFailure(jar, cause);
					}
				}));
			} catch (cause) {
				if (cause instanceof ArtifactFileCleanupFailure) {
					const physical = cause.fileCleanupFailure;
					const cleanup = new ProviderCleanupError("jadx", [jar], {
						phase: "jar-inspection",
						...physical.outcome.kind === "completed" ? { archive_observation: {
							jar_path: jar,
							required_classes: true
						} } : {}
					}, {
						operation,
						cause: physical.cleanupCause
					});
					bindArtifactFileCleanup(cause, cleanup);
					const primary = physical.outcome.kind === "failed" ? archiveAnalysisFailure(jar, physical.outcome.cause, options) : physical.completionCancellation === undefined ? undefined : archiveCancellation(physical.completionCancellation.reason, options, { archive_observation: {
						jar_path: jar,
						required_classes: true
					} });
					if (primary === undefined) throw cleanup;
					throw analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
				}
				if (cause instanceof ArtifactFileCancelled) {
					throw archiveCancellation(cause.fileCancellation.reason, options, { archive_observation: {
						jar_path: jar,
						required_classes: true
					} });
				}
				if (cause instanceof ArtifactReaderFailure) {
					if (cause.reason === "cancelled") throw archiveCancellation(cause.cancellation?.reason, options);
					throw analysisClientFailureForOperation(cause, "jadx", operation);
				}
				if (cause instanceof AnalysisError || cause instanceof JadxConfigurationFailure) throw cause;
				throw archiveInspectionFailure(jar, cause);
			}
		};
		archiveInspectionFailure = (jar, cause) => {
			const reason = cause instanceof Error ? cause.message : String(cause);
			return configurationFailure("version_unresolved", `Cannot inspect REA_JADX_MCP_JAR ${jar} as a Java archive: ${reason}. ${JADX_JAR_CONFIGURATION_REMEDIATION}`, {
				jar_path: jar,
				phase: "jar-inspection",
				archive_error: reason,
				maximum_metadata_read_bytes: JAR_METADATA_READ_MAX_BYTES
			}, "jar", cause);
		};
		archiveAnalysisFailure = (jar, cause, options) => {
			if (cause instanceof AnalysisError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return archiveCancellation(cause.cancellation?.reason, options);
			return projectConfigurationFailure(options.operation ?? "inspect_jadx_configuration", cause instanceof JadxConfigurationFailure ? cause : archiveInspectionFailure(jar, cause));
		};
		archiveCancellation = (reason, options, diagnostics) => {
			const operation = options.operation ?? "inspect_jadx_configuration";
			return options.operationDeadline?.signal.aborted === true && reason === options.operationDeadline.signal.reason ? new AnalysisTimeoutError(operation, options.operationDeadline.timeoutMs, {
				cause: reason,
				diagnostics,
				...jadxOperationTimeoutGuidance(options.operationDeadline.timeoutMs)
			}) : new AnalysisCancelledError(operation, {
				cause: reason,
				diagnostics
			});
		};
		requireSupportedHost = () => {
			if (process.platform === "linux" || process.platform === "darwin") return;
			if (process.platform === "win32" && process.arch === "x64") {
				const loaded = systemWindowsNativeAuthority();
				if (loaded.available) {
					if (loaded.authority.inspection.protocolStdin === true) return;
					throw configurationFailure("runtime_missing", "The bundled Windows native artifact lacks owned protocol stdin; use a matching current Windows x64 REA package.", {
						platform: process.platform,
						architecture: process.arch,
						phase: "process-ownership",
						owned_protocol_stdin: false
					}, "windows_native_artifact");
				}
				const readiness = inspectWindowsNativeReadiness(process.platform, loaded);
				throw configurationFailure(readiness.available ? "runtime_unavailable" : readiness.code, readiness.available ? "Windows native readiness disagreed with the native loader result." : readiness.reason, {
					platform: process.platform,
					architecture: process.arch,
					phase: "process-ownership",
					owned_protocol_stdin: false,
					...readiness.available ? {} : {
						failure_stage: readiness.failureStage,
						remediation: readiness.remediation
					}
				}, readiness.available ? "windows_native_runtime" : readiness.code === "unsupported_host" ? "unsupported_host" : readiness.code === "runtime_missing" ? "windows_native_artifact" : "windows_native_runtime");
			}
			throw configurationFailure("unsupported_host", `Android JADX subprocess ownership is unsupported on ${process.platform}/${process.arch}; use Linux, macOS, or Windows x64 with its bundled native controls.`, { platform: process.platform }, "unsupported_host");
		};
		resolveJar = async (environment) => {
			const jar = environment.REA_JADX_MCP_JAR;
			if (jar === undefined) throw configurationFailure("not_configured", JADX_JAR_CONFIGURATION_REMEDIATION, { jar_configured: false }, "jar");
			if (!isAbsolute(jar)) throw configurationFailure("open_options_invalid", `REA_JADX_MCP_JAR must be an absolute path; received ${JSON.stringify(jar)}. ${JADX_JAR_CONFIGURATION_REMEDIATION}`, {
				jar_configured: true,
				jar_path: jar,
				path_requirement: "absolute"
			}, "jar");
			try {
				await access(jar, constants.R_OK);
				if (!(await stat(jar)).isFile()) throw configurationFailure("executable_missing", `REA_JADX_MCP_JAR is not a regular file: ${jar}`, { jar_path: jar }, "jar");
				return await realpath(jar);
			} catch (cause) {
				if (cause instanceof JadxConfigurationFailure) throw cause;
				throw configurationFailure("executable_missing", `Cannot read REA_JADX_MCP_JAR ${jar}: ${cause instanceof Error ? cause.message : String(cause)}`, { jar_path: jar }, "jar", cause);
			}
		};
		resolveJava = async (environment, signal) => {
			const executable = process.platform === "win32" ? "java.exe" : "java";
			if (environment.JAVA_HOME === undefined) {
				if (process.platform !== "win32") return executable;
				const path = Object.entries(environment).find(([key]) => key.toLowerCase() === "path")?.[1] ?? "";
				for (const directory of path.split(delimiter).filter((entry) => entry !== "")) {
					throwIfJadxInterrupted(signal);
					const selected = directory.startsWith("\"") && directory.endsWith("\"") ? directory.slice(1, -1) : directory;
					const candidate = resolve(selected, executable);
					try {
						await access(candidate, constants.R_OK | constants.X_OK);
						if ((await stat(candidate)).isFile()) return await realpath(candidate);
					} catch (cause) {
						if (typeof cause === "object" && cause !== null && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR")) continue;
						throw configurationFailure("runtime_missing", `Cannot inspect selected Java executable ${candidate}: ${errorText(cause)}`, { java_executable: candidate }, "java_runtime", cause);
					}
				}
				throw configurationFailure("runtime_missing", "Cannot find java.exe on the selected Windows PATH. Select a full JDK with JAVA_HOME or PATH, then verify it with java --list-modules. REA does not install Java.", { java_executable: executable }, "java_runtime");
			}
			if (isAbsolute(environment.JAVA_HOME)) return join(environment.JAVA_HOME, "bin", executable);
			throw configurationFailure("open_options_invalid", "JAVA_HOME must select an existing JDK by absolute path; omit it to use java on PATH.", { java_home: environment.JAVA_HOME }, "java_home");
		};
		requireJavaHomeExecutable = async (javaHome, java) => {
			if (javaHome === undefined) return;
			try {
				await access(java, constants.R_OK | constants.X_OK);
				if ((await stat(java)).isFile()) return;
				throw configurationFailure("runtime_missing", `JAVA_HOME java is not a regular file: ${java}`, { java_executable: java }, "java_runtime");
			} catch (cause) {
				if (cause instanceof JadxConfigurationFailure) throw cause;
				throw configurationFailure("runtime_missing", `Cannot execute JAVA_HOME java ${java}: ${cause instanceof Error ? cause.message : String(cause)}`, { java_executable: java }, "java_runtime", cause);
			}
		};
		resolveJvmArguments = (environment) => {
			const result = [];
			for (const [name, prefix, suffix] of [[
				"REA_JADX_HEAP_MIB",
				"-Xmx",
				"m"
			], [
				"REA_JADX_ACTIVE_PROCESSOR_COUNT",
				"-XX:ActiveProcessorCount=",
				""
			]]) {
				const value = environment[name];
				if (value === undefined) continue;
				if (!/^[1-9]\d*$/u.test(value) || !Number.isSafeInteger(Number(value))) throw configurationFailure("open_options_invalid", `${name} must be a positive safe integer; received ${value}.`, {
					setting: name,
					value
				}, "jvm_options");
				if (name === "REA_JADX_ACTIVE_PROCESSOR_COUNT" && Number(value) > 2147483647) throw configurationFailure("open_options_invalid", `${name} exceeds the JVM's signed 32-bit processor-count range.`, {
					setting: name,
					value
				}, "jvm_options");
				result.push(`${prefix}${value}${suffix}`);
			}
			return result;
		};
		readOperationTimeout = (environment, runtimeTimeoutMs) => {
			if (runtimeTimeoutMs !== undefined) return runtimeTimeoutMs;
			const value = environment.REA_JADX_OPERATION_TIMEOUT_MS;
			if (value === undefined) return DEFAULT_JADX_OPERATION_TIMEOUT_MS;
			const parsed = providerStartupTimeoutSchema.safeParse(value);
			if (parsed.success) return parsed.data;
			throw configurationFailure("open_options_invalid", `REA_JADX_OPERATION_TIMEOUT_MS must be a decimal millisecond count from 1 to 2147483647; received ${value}.`, {
				setting: "REA_JADX_OPERATION_TIMEOUT_MS",
				value
			}, "operation_timeout");
		};
		inspectJavaRuntime = async (java, environment, options) => {
			const result = await inspectJadxJava(java, environment, options);
			if (!result.ok) {
				const failure = result.error;
				throw configurationFailure(failure.code, failure.message, failure.diagnostics, failure.kind);
			}
		};
		configurationFailure = (code, message, diagnostics, kind, cause) => new JadxConfigurationFailure(code, message, diagnostics, kind, cause === undefined ? undefined : { cause });
		errorText = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/jeb/JebMcpEndpoint.js
var DEFAULT_JEB_MCP_ENDPOINT, parseJebMcpEndpoint;
function init_JebMcpEndpoint() {
	return (init_JebMcpEndpoint = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_urlComponents();
		DEFAULT_JEB_MCP_ENDPOINT = "http://127.0.0.1:8425/mcp";
		parseJebMcpEndpoint = (value) => {
			const raw = value === undefined || value.length === 0 ? null : value;
			let url;
			try {
				url = new URL(raw ?? "http://127.0.0.1:8425/mcp");
			} catch {
				return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "Expected an absolute http(s) URL" }));
			}
			if (url.protocol !== "http:" && url.protocol !== "https:") return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "Only http and https JEB MCP endpoints are supported" }));
			if (url.hostname !== "127.0.0.1" && url.hostname !== "[::1]") return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "JEB MCP endpoint must use a literal loopback host (127.0.0.1 or ::1)" }));
			if (url.username !== "" || url.password !== "") return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "Embedding credentials in the JEB MCP endpoint is not supported; configure authentication with the engine" }));
			if (url.pathname !== "/mcp" && url.pathname !== "/mcp/") return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "JEB MCP endpoint must use the /mcp route" }));
			if (urlDeclaresQueryOrFragment(url)) return err(new AnalysisInputError("jeb_mcp_endpoint", { cause: "JEB MCP endpoint query strings and fragments are not supported" }));
			return ok(url);
		};
	})))();
}

//#endregion
export { DEFAULT_JEB_MCP_ENDPOINT, JADX_BRIDGE_IDENTITY, JADX_FAILURE_KINDS, JADX_LIMITATIONS, JADX_PROVIDER_IDENTITY, JADX_RELEASE, JadxInterruption, init_JadxConfiguration, init_JadxInterruption, init_JadxOperationTimeout, init_JadxRelease, init_JebMcpEndpoint, inspectJadxAvailability, jadxOperationTimeoutGuidance, parseJebMcpEndpoint, projectJadxFailureOutcome, resolveJadxConfigurationInputs, resolveJadxOperationTimeout, throwIfJadxInterrupted, validateJadxConfiguration };