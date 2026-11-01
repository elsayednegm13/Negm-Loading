import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisCancelledError, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { RegularFileCleanupFailure, init_OwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { init_PrivateRuntimeRoot, init_WindowsAuthority, inspectWindowsNativeReadiness, privateRuntimeRootCapability } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { init_LinuxHopperPython, inspectLinuxHopperPythonRuntime, linuxHopperPythonUnavailable } from "./SharedStartupAttempt-BObuC52s.js";
import { analysisClientFailureForOperation, init_AnalysisClientFailure } from "./OwnedCommandCleanup-BGs5-QvP.js";
import { JADX_FAILURE_KINDS, init_JadxConfiguration, init_JebMcpEndpoint, inspectJadxAvailability, parseJebMcpEndpoint, projectJadxFailureOutcome } from "./JebMcpEndpoint-DnghC6EU.js";
import { init_Doctor, systemDoctorHost } from "./Doctor-BLZnkeII.js";
import { KUNA_COMMAND_REMEDIATION, KUNA_PROVIDER_ID, KUNA_UNSUPPORTED_HOST_REMEDIATION, KUNA_VERIFIED_VERSION, KUNA_VERSION_PROBE_REMEDIATION, createKunaResourceScope, init_GhidraInstallation, init_IdaConfiguration, init_IdaWorkspace, init_KunaCommand, init_KunaConfiguration, init_KunaInstallation, init_KunaRelease, init_LinuxPrivateDisplayProbe, inspectGhidraInstallation, inspectKunaInstallation, kunaInstallationFailureDiagnostics, kunaRetainedResourceCleanupError, readIdaConfiguration, readKunaConfiguration, resolveIdaWorkspaceParent, selectLinuxPrivateDisplayStrategy } from "./KunaCommand-Bxyg7nv1.js";
import { dirname, posix, win32 } from "node:path";
import { access, lstat, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";

//#region dist/android/JadxDoctor.js
var inspectJadxProvider, optionalEntry, configurationCheck, windowsNativeFailureDetails, asFailureKind, probeDetails;
function init_JadxDoctor() {
	return (init_JadxDoctor = __esmMin((() => {
		init_JadxConfiguration();
		inspectJadxProvider = async (environment, resourceOwner, signal) => {
			const configured = environment.REA_JADX_MCP_JAR !== undefined;
			const availability = await inspectJadxAvailability(environment, {
				resourceOwner,
				signal
			});
			const jarPath = availability.status === "available" && typeof availability.diagnostics["jar_path"] === "string" ? availability.diagnostics["jar_path"] : undefined;
			const available = availability.status === "available" && jarPath !== undefined;
			const configuredJar = environment.REA_JADX_MCP_JAR;
			return {
				id: "jadx",
				configured,
				available,
				providerVersion: null,
				registrationEnvironment: jarPath === undefined || configuredJar === undefined ? {} : {
					REA_JADX_MCP_JAR: configuredJar,
					...optionalEntry("JAVA_HOME", environment.JAVA_HOME),
					...optionalEntry("REA_JADX_HEAP_MIB", environment.REA_JADX_HEAP_MIB),
					...optionalEntry("REA_JADX_ACTIVE_PROCESSOR_COUNT", environment.REA_JADX_ACTIVE_PROCESSOR_COUNT),
					...optionalEntry("REA_JADX_OPERATION_TIMEOUT_MS", environment.REA_JADX_OPERATION_TIMEOUT_MS)
				},
				checks: [configurationCheck(configured, availability, jarPath)]
			};
		};
		optionalEntry = (name, value) => value === undefined ? {} : { [name]: value };
		configurationCheck = (configured, availability, jarPath) => {
			const code = availability.status === "unavailable" ? availability.code : null;
			if (availability.status === "available" && jarPath !== undefined) {
				const operationTimeout = availability.diagnostics["operation_timeout_ms"];
				return {
					name: "configuration",
					ok: true,
					code: null,
					detail: `JADX MCP bridge JAR validated at ${jarPath}; its path is recorded for agent registrations. This checks configuration, not whether a selected APK fits in the worker's memory.`,
					remediation: null,
					classification: "config_drift",
					...typeof operationTimeout === "number" ? { details: { operation_timeout_ms: operationTimeout } } : {}
				};
			}
			const kind = availability.status === "unavailable" ? asFailureKind(availability.diagnostics["failure_kind"]) : null;
			const outcome = projectJadxFailureOutcome(kind, configured);
			return {
				name: "configuration",
				ok: false,
				code,
				detail: availability.status === "available" ? "Validated JADX configuration reported no JAR path." : availability.reason,
				remediation: outcome.remediation,
				classification: outcome.classification,
				...kind === "java_probe" && availability.status === "unavailable" ? { details: probeDetails(availability.diagnostics) } : kind !== null && kind.startsWith("windows_native_") && availability.status === "unavailable" ? { details: windowsNativeFailureDetails(availability.diagnostics) } : {}
			};
		};
		windowsNativeFailureDetails = (diagnostics) => {
			const details = {};
			for (const key of ["failure_stage", "remediation"]) {
				const value = diagnostics[key];
				if (value !== undefined) details[key] = value;
			}
			return details;
		};
		asFailureKind = (value) => typeof value === "string" && JADX_FAILURE_KINDS.includes(value) ? value : null;
		probeDetails = (diagnostics) => {
			const details = {};
			for (const key of [
				"java_executable",
				"failure",
				"output_truncated",
				"exit_code",
				"process_error_code",
				"signal",
				"killed",
				"output_limit_bytes",
				"deadline_ms",
				"jdk_compiler",
				"java_major"
			]) {
				const value = diagnostics[key];
				if (value !== undefined) details[key] = value;
			}
			return details;
		};
	})))();
}

//#endregion
//#region dist/ghidra/GhidraDoctor.js
var projectGhidraDoctorInspection, inspectSystemGhidraProvider, selectedChecks, projectCheck;
function init_GhidraDoctor() {
	return (init_GhidraDoctor = __esmMin((() => {
		init_analysisErrorProjection();
		init_AnalysisClientFailure();
		init_WindowsAuthority();
		init_GhidraInstallation();
		projectGhidraDoctorInspection = (inspection) => {
			const readiness = inspection.status === "available" && inspection.platform === "win32" ? inspectWindowsNativeReadiness(inspection.platform) : undefined;
			const windowsAuthorityUnavailable = readiness?.available === false;
			return {
				id: "ghidra",
				configured: inspection.installDir !== null,
				available: inspection.status === "available" && !windowsAuthorityUnavailable,
				providerVersion: inspection.providerVersion,
				registrationEnvironment: inspection.status === "available" ? {
					GHIDRA_INSTALL_DIR: inspection.installDir,
					JAVA_HOME: inspection.javaHome
				} : {},
				checks: [...selectedChecks(inspection).map((check) => projectCheck(check, inspection.installDir !== null, inspection.javaProbeFailure, inspection.nativeDecompilerHeaderFailure)), ...readiness !== undefined ? [{
					name: "native_authority",
					ok: !windowsAuthorityUnavailable,
					code: !readiness.available ? readiness.code : null,
					detail: !readiness.available ? readiness.reason : "Verified Windows native Job Object, private DACL, and reparse-safe handle controls; local NTFS only.",
					remediation: !readiness.available ? readiness.remediation : null,
					classification: !readiness.available && readiness.code === "runtime_unavailable" ? "runtime_failure" : !readiness.available && readiness.code === "runtime_missing" ? "missing_dependency" : "unsupported_host"
				}] : []]
			};
		};
		inspectSystemGhidraProvider = async (environment, resourceOwner, signal) => {
			try {
				return projectGhidraDoctorInspection(await inspectGhidraInstallation({
					environment,
					resourceOwner,
					...signal === undefined ? {} : { signal },
					...environment.GHIDRA_INSTALL_DIR === undefined ? {} : { installDir: environment.GHIDRA_INSTALL_DIR },
					...environment.JAVA_HOME === undefined ? {} : { javaHome: environment.JAVA_HOME }
				}));
			} catch (cause) {
				throw analysisClientFailureForOperation(cause, "ghidra", "doctor");
			}
		};
		selectedChecks = (inspection) => {
			const byName = new Map(inspection.checks.map((candidate) => [candidate.name, candidate]));
			const configuration = byName.get("configuration");
			if (configuration === undefined) return [];
			if (configuration.status === "failed") return [configuration];
			const installation = byName.get("installation");
			return [
				configuration,
				byName.get("platform"),
				byName.get("architecture"),
				installation,
				...installation?.status === "passed" ? [
					byName.get("version"),
					byName.get("headless"),
					byName.get("native_decompiler")
				] : [],
				byName.get("java")
			].filter((candidate) => Boolean(candidate));
		};
		projectCheck = (check, configured, javaFailure, headerFailure) => ({
			name: check.name,
			ok: check.status === "passed",
			code: check.status === "failed" ? check.code : null,
			detail: check.detail,
			...check.name === "java" && javaFailure?.output !== undefined ? { details: {
				output: { ...javaFailure.output },
				...javaFailure.processErrorCode === undefined ? {} : { process_error_code: javaFailure.processErrorCode },
				...javaFailure.properties === undefined ? {} : { properties: { ...javaFailure.properties } }
			} } : {},
			...check.name === "native_decompiler" && headerFailure !== undefined ? { details: { header_failure: projectAnalysisError(headerFailure) } } : {},
			remediation: check.status === "failed" ? check.remediation : null,
			classification: check.name === "platform" || check.name === "architecture" ? "unsupported_host" : check.name === "java" && check.status === "failed" && check.code === "runtime_missing" ? "missing_dependency" : check.name === "java" && check.status === "failed" && check.code === "runtime_unavailable" ? "runtime_failure" : configured ? "config_drift" : "missing_analysis_engine"
		});
	})))();
}

//#endregion
//#region dist/ida/IdaDoctor.js
var inspectIdaRegistration, inspectPrivateWorkspace, workspaceRootFailure;
function init_IdaDoctor() {
	return (init_IdaDoctor = __esmMin((() => {
		init_IdaConfiguration();
		init_PrivateRuntimeRoot();
		init_IdaWorkspace();
		inspectIdaRegistration = async (path, resourceScope, signal, registration) => {
			const parsed = path === undefined ? undefined : await (registration ?? readIdaConfiguration(path, {
				resourceScope,
				...signal === undefined ? {} : { signal }
			}));
			const valid = parsed?.ok === true;
			const workspaceChecks = parsed?.ok === true && parsed.value.mode === "headless" ? [await inspectPrivateWorkspace(parsed.value.workspaceRoot)] : [];
			return {
				id: "ida",
				configured: path !== undefined,
				available: valid && workspaceChecks.every(({ ok }) => ok),
				providerVersion: null,
				registrationEnvironment: valid && path !== undefined ? { REA_IDA_MCP_CONFIG: path } : {},
				checks: [{
					name: "registration",
					ok: valid,
					code: valid ? null : path === undefined ? "not_configured" : "invalid_configuration",
					detail: valid ? "IDA MCP registration is valid. Upstream availability, compatibility, and target binding are checked when analysis starts; no IDA process was launched." : parsed !== undefined && !parsed.ok ? parsed.error.message : "IDA MCP registration is not configured.",
					remediation: valid ? null : "Set REA_IDA_MCP_CONFIG to your upstream IDA MCP registration JSON; see docs/ida-provider.md.",
					classification: path === undefined ? "missing_analysis_engine" : "config_drift"
				}, ...workspaceChecks]
			};
		};
		inspectPrivateWorkspace = async (workspaceRoot) => {
			const privacy = privateRuntimeRootCapability();
			const unusable = await workspaceRootFailure(workspaceRoot);
			return {
				name: "private_workspace",
				ok: privacy.available && unusable === undefined,
				code: !privacy.available ? privacy.code : unusable === undefined ? null : "invalid_configuration",
				detail: !privacy.available ? privacy.reason : unusable ?? `Private workspace authority is available (${privacy.proof}) under ${workspaceRoot ?? "the system temporary directory"}.`,
				remediation: !privacy.available ? privacy.remediation : unusable === undefined ? null : "Set workspaceRoot to an existing directory REA can create entries in, or omit it to use the system temporary directory; see docs/ida-provider.md.",
				classification: !privacy.available && privacy.code === "runtime_missing" ? "missing_dependency" : !privacy.available && privacy.code === "runtime_unavailable" ? "runtime_failure" : unusable !== undefined ? "config_drift" : "unsupported_host"
			};
		};
		workspaceRootFailure = async (root) => {
			try {
				const parent = await resolveIdaWorkspaceParent(root);
				if (!(await stat(parent)).isDirectory()) return `IDA workspaceRoot ${root ?? "the system temporary directory"} is not a directory.`;
				await access(parent, constants.W_OK | constants.X_OK);
				return undefined;
			} catch (cause) {
				return `IDA workspaceRoot ${root ?? "the system temporary directory"} is not a usable directory: ${cause instanceof Error ? cause.message : String(cause)}`;
			}
		};
	})))();
}

//#endregion
//#region dist/kuna/KunaDoctor.js
var REGISTRATION_SETTINGS, inspectKunaProvider, installationFailure, cacheCheck, nearestDirectoryWritable, isMissing, entryAbsent, cacheRootWithoutTrailingSeparator;
function init_KunaDoctor() {
	return (init_KunaDoctor = __esmMin((() => {
		init_KunaConfiguration();
		init_OwnedRegularFile();
		init_KunaCommand();
		init_KunaInstallation();
		init_KunaRelease();
		REGISTRATION_SETTINGS = [
			"REA_KUNA_COMMAND",
			"REA_KUNA_CACHE_DIR",
			"REA_KUNA_CACHE_MAX_BYTES",
			"REA_KUNA_PROJECT_TIMEOUT_MS",
			"REA_KUNA_TIMEOUT_MS",
			"REA_KUNA_JOBS"
		];
		inspectKunaProvider = async (environment, platform = process.platform, options) => {
			const kunaResources = createKunaResourceScope(options.resourceScope);
			let installation;
			try {
				installation = await inspectKunaInstallation(environment, {
					platform,
					resourceScope: kunaResources.owner,
					...options.signal === undefined ? {} : { signal: options.signal }
				});
			} catch (cause) {
				const retainedCleanup = kunaRetainedResourceCleanupError(cause, "doctor");
				if (retainedCleanup !== undefined) return {
					id: KUNA_PROVIDER_ID,
					configured: environment.REA_KUNA_COMMAND !== undefined,
					available: false,
					providerVersion: null,
					registrationEnvironment: {},
					checks: [{
						name: "installation",
						ok: false,
						code: "cleanup_incomplete",
						detail: retainedCleanup.message,
						remediation: null,
						classification: "config_drift",
						details: {
							cleanup_incomplete: true,
							cleanup_resources: [...retainedCleanup.cleanupResources]
						}
					}]
				};
				if (!(cause instanceof RegularFileCleanupFailure)) {
					const cancellation = kunaResources.installationCancellationError(cause, "doctor");
					if (cancellation !== undefined) throw cancellation;
					throw cause;
				}
				return {
					id: KUNA_PROVIDER_ID,
					configured: environment.REA_KUNA_COMMAND !== undefined,
					available: false,
					providerVersion: null,
					registrationEnvironment: {},
					checks: [{
						name: "installation",
						ok: false,
						code: "cleanup_incomplete",
						detail: `Kuna installation inspection could not confirm file cleanup: ${cause instanceof Error ? cause.message : String(cause)}`,
						remediation: null,
						classification: "config_drift",
						details: {
							cleanup_incomplete: true,
							...kunaInstallationFailureDiagnostics(cause)
						}
					}]
				};
			}
			const configured = environment.REA_KUNA_COMMAND !== undefined && environment.REA_KUNA_COMMAND.length > 0;
			const base = {
				id: KUNA_PROVIDER_ID,
				configured,
				available: false,
				providerVersion: null,
				registrationEnvironment: {}
			};
			if (!installation.ok) {
				const check = installationFailure(installation.error, configured);
				const cleanupResources = kunaResources.cleanupResources;
				if (!kunaResources.hasPending) return {
					...base,
					checks: [check]
				};
				return {
					...base,
					checks: [{
						...check,
						code: "cleanup_incomplete",
						details: {
							...installation.error.diagnostics,
							cleanup_incomplete: true,
							...cleanupResources === undefined ? {} : { cleanup_resources: [...cleanupResources] }
						}
					}]
				};
			}
			const { value } = installation;
			const cache = await cacheCheck(environment, platform);
			return {
				id: KUNA_PROVIDER_ID,
				configured,
				available: cache.ok,
				providerVersion: value.version,
				registrationEnvironment: Object.fromEntries(REGISTRATION_SETTINGS.flatMap((name) => {
					const setting = environment[name];
					return setting === undefined ? [] : [[name, setting]];
				})),
				checks: [{
					name: "installation",
					ok: true,
					code: null,
					detail: `${value.executable} reports Kuna ${value.version} (sha256 ${value.sha256})${value.verified ? "." : `; REA verified ${KUNA_VERIFIED_VERSION}, so this release's project layout is unverified.`}`,
					remediation: null,
					classification: "config_drift",
					details: {
						executable: value.executable,
						version: value.version,
						verified_version: KUNA_VERIFIED_VERSION,
						sha256: value.sha256
					}
				}, cache]
			};
		};
		installationFailure = (failure, configured) => ({
			name: "installation",
			ok: false,
			code: failure.code,
			detail: failure.reason,
			remediation: failure.remediation ?? (failure.code === "unsupported_host" ? "Use Linux or macOS for the Kuna provider. Windows process-tree ownership for Kuna is not verified." : failure.code === "version_unresolved" ? "Run the selected executable with --version: it must exit promptly and print `kuna <major>.<minor>`." : KUNA_COMMAND_REMEDIATION),
			classification: failure.code === "unsupported_host" ? "unsupported_host" : configured ? "config_drift" : "missing_analysis_engine",
			details: failure.diagnostics
		});
		cacheCheck = async (environment, platform) => {
			const configuration = readKunaConfiguration(environment, platform);
			if (!configuration.ok) return {
				name: "cache",
				ok: false,
				code: configuration.error.code,
				detail: configuration.error.reason,
				remediation: KUNA_COMMAND_REMEDIATION,
				classification: "config_drift"
			};
			const { cacheRoot, cacheMaxBytes } = configuration.value;
			const details = {
				cache_root: cacheRoot,
				cache_max_bytes: cacheMaxBytes
			};
			const inspected = cacheRootWithoutTrailingSeparator(cacheRoot, platform);
			try {
				if (!(await stat(inspected)).isDirectory()) return {
					name: "cache",
					ok: false,
					code: "open_options_invalid",
					detail: `The Kuna cache root ${cacheRoot} exists but is not a directory.`,
					remediation: "Set REA_KUNA_CACHE_DIR to a directory REA may own, or remove the conflicting file.",
					classification: "config_drift",
					details
				};
				await access(inspected, constants.W_OK | constants.X_OK);
			} catch (cause) {
				if (isMissing(cause)) {
					const creatable = await nearestDirectoryWritable(inspected);
					return creatable.ok ? {
						name: "cache",
						ok: true,
						code: null,
						detail: `REA creates the Kuna project cache at ${cacheRoot} on first use.`,
						remediation: null,
						classification: "config_drift",
						details
					} : {
						name: "cache",
						ok: false,
						code: "open_options_invalid",
						detail: `REA cannot create the Kuna cache root ${cacheRoot}: ${creatable.reason}`,
						remediation: "Set REA_KUNA_CACHE_DIR to a directory the REA process user can create or write.",
						classification: "config_drift",
						details
					};
				}
				return {
					name: "cache",
					ok: false,
					code: "open_options_invalid",
					detail: `REA cannot write the Kuna cache root ${cacheRoot}: ${cause instanceof Error ? cause.message : String(cause)}`,
					remediation: "Set REA_KUNA_CACHE_DIR to a directory the REA process user can write.",
					classification: "config_drift",
					details
				};
			}
			return {
				name: "cache",
				ok: true,
				code: null,
				detail: `Kuna project exports are cached in ${cacheRoot} (at most ${String(cacheMaxBytes)} bytes).`,
				remediation: null,
				classification: "config_drift",
				details
			};
		};
		nearestDirectoryWritable = async (path) => {
			let candidate = path;
			for (;;) {
				try {
					if (!(await stat(candidate)).isDirectory()) return {
						ok: false,
						reason: `${candidate} is not a directory.`
					};
					await access(candidate, constants.W_OK | constants.X_OK);
					return { ok: true };
				} catch (cause) {
					const parent = dirname(candidate);
					const absent = isMissing(cause) ? await entryAbsent(candidate) : false;
					if (absent !== true || parent === candidate) return {
						ok: false,
						reason: typeof absent === "string" ? absent : `${candidate} is not writable: ${cause instanceof Error ? cause.message : String(cause)}`
					};
					candidate = parent;
				}
			}
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
		entryAbsent = async (path) => {
			try {
				return (await lstat(path)).isSymbolicLink() ? `${path} is a symbolic link whose target does not exist.` : `${path} exists but cannot be resolved.`;
			} catch (cause) {
				return isMissing(cause) ? true : `${path} cannot be inspected: ${cause instanceof Error ? cause.message : String(cause)}`;
			}
		};
		cacheRootWithoutTrailingSeparator = (cacheRoot, platform) => {
			const pathApi = platform === "win32" ? win32 : posix;
			const root = pathApi.parse(cacheRoot).root;
			const separator = pathApi.sep.charCodeAt(0);
			let end = cacheRoot.length;
			while (end > root.length && cacheRoot.charCodeAt(end - 1) === separator) end -= 1;
			return end === cacheRoot.length ? cacheRoot : cacheRoot.slice(0, end);
		};
	})))();
}

//#endregion
//#region dist/doctorRuntime.js
var createSystemDoctorHost, HOPPER_DEMO_HELPER_PATH, inspectLinuxHopperDemoRuntime;
function init_doctorRuntime() {
	return (init_doctorRuntime = __esmMin((() => {
		init_Doctor();
		init_JadxDoctor();
		init_GhidraDoctor();
		init_IdaDoctor();
		init_KunaDoctor();
		init_IdaConfiguration();
		init_JebMcpEndpoint();
		init_LinuxPrivateDisplayProbe();
		init_result();
		init_analysisErrorCore();
		init_providerCleanupError();
		init_AnalysisCleanupLease();
		init_LinuxHopperPython();
		createSystemDoctorHost = (environment = process.env, signal) => {
			const registrationReads = new WeakMap();
			const readRegistration = (path, resourceScope, inspectionSignal) => {
				let byPath = registrationReads.get(resourceScope);
				if (byPath === undefined) {
					byPath = new Map();
					registrationReads.set(resourceScope, byPath);
				}
				let registration = byPath.get(path);
				if (registration === undefined) {
					registration = readIdaConfiguration(path, {
						resourceScope,
						signal: inspectionSignal
					});
					byPath.set(path, registration);
				}
				return registration;
			};
			const selectedJebEndpoint = environment.REA_JEB_MCP_URL;
			const selectedJebRegistrationEnvironment = selectedJebEndpoint !== undefined && selectedJebEndpoint.length > 0 && parseJebMcpEndpoint(selectedJebEndpoint).ok ? { REA_JEB_MCP_URL: selectedJebEndpoint } : {};
			return systemDoctorHost({
				environment,
				...signal === undefined ? {} : { signal },
				providerRegistrationEnvironment: () => selectedJebRegistrationEnvironment,
				resolveProviderRequestBudget: async (analysisProvider, registrationEnvironment, resourceScope, inspectionSignal) => {
					if (analysisProvider !== "ida" && analysisProvider !== "auto") return ok(undefined);
					const path = registrationEnvironment.REA_IDA_MCP_CONFIG;
					if (path === undefined) return ok(undefined);
					const registration = await readRegistration(path, resourceScope, inspectionSignal);
					if (registration.ok) return ok(registration.value.timeoutMs);
					return analysisProvider === "ida" ? registration : ok(undefined);
				},
				providerInspections: async (resourceScope, inspectionSignal) => [
					await inspectSystemGhidraProvider(environment, resourceScope, inspectionSignal),
					await inspectIdaRegistration(environment.REA_IDA_MCP_CONFIG, resourceScope, inspectionSignal, environment.REA_IDA_MCP_CONFIG === undefined ? undefined : readRegistration(environment.REA_IDA_MCP_CONFIG, resourceScope, inspectionSignal)),
					await inspectJadxProvider(environment, resourceScope, inspectionSignal),
					await inspectKunaProvider(environment, process.platform, {
						resourceScope,
						signal: inspectionSignal
					})
				],
				linuxDemoRuntimeCheck: (resourceScope, inspectionSignal) => inspectLinuxHopperDemoRuntime(environment, resourceScope, inspectionSignal)
			});
		};
		HOPPER_DEMO_HELPER_PATH = fileURLToPath(new URL("../scripts/hopper-demo-x11.py", new URL("../doctorRuntime.js", import.meta.url).href));
		inspectLinuxHopperDemoRuntime = async (environment, resourceScope, signal) => {
			const selection = await selectLinuxPrivateDisplayStrategy({
				helperPath: HOPPER_DEMO_HELPER_PATH,
				environment,
				...signal === undefined ? {} : { signal }
			});
			if (!selection.ok && selection.cleanup !== undefined) {
				const { lease, reason } = selection.cleanup;
				resourceScope.retain({
					close: () => lease.release(),
					get cleanupResources() {
						return lease.cleanupResources;
					}
				}, "hopper-private-display-probe");
				const cleanup = {
					reason,
					resources: [...lease.cleanupResources ?? ["hopper-private-display-probe"]]
				};
				const diagnostics = { hopper_demo_runtime: { private_display: { ...selection.diagnostic } } };
				const failure = signal?.aborted === true ? new AnalysisCancelledError("doctor", {
					cause: signal.reason,
					cleanup,
					diagnostics
				}) : new ProviderCleanupError("hopper", cleanup.resources, {
					reason,
					...diagnostics
				}, { operation: "doctor" });
				new AnalysisCleanupLeaseGroup(failure, [lease]);
				throw failure;
			}
			if (signal?.aborted === true) throw new AnalysisCancelledError("doctor", {
				cause: signal.reason,
				diagnostics: { hopper_demo_runtime: { private_display: { ...selection.diagnostic } } }
			});
			const python = await inspectLinuxHopperPythonRuntime(environment, signal);
			const pythonFailure = !python.ok ? python.error : python.value.library.status !== "loadable" ? linuxHopperPythonUnavailable(python.value.library) : undefined;
			const pythonDiagnostic = {
				scope: "system_interpreter",
				hopper_interpreter: "unknown",
				...python.ok ? {
					status: "observed",
					...python.value
				} : {
					status: "unknown",
					reason: python.error.reason,
					message: python.error.message
				}
			};
			const value = selection.diagnostic;
			const detail = [
				`strategy=${selection.strategy}`,
				`socket_directory=${value.socket_directory}`,
				`mode=${value.socket_directory_mode ?? "unknown"}`,
				`mount_read_only=${String(value.mount_read_only)}`,
				`effective_mode=${value.effective_socket_directory_mode ?? "unknown"}`,
				`effective_mount_read_only=${String(value.effective_mount_read_only)}`,
				`wsl=${String(value.wsl)}`,
				`system_python=${python.ok ? python.value.library.status : "unknown"}`
			].join("; ");
			const details = {
				private_display: { ...value },
				embedded_python: pythonDiagnostic
			};
			if (!python.ok && python.error.reason === "cancelled") throw new AnalysisCancelledError("doctor", {
				cause: python.error.cause,
				diagnostics: { hopper_demo_runtime: details }
			});
			if (selection.ok && pythonFailure === undefined) return {
				name: "hopper-demo-runtime",
				ok: true,
				classification: "healthy",
				detail,
				details
			};
			const missingDependency = value.failure_code === "runtime_dependency_unavailable" || value.failure_code === "x11_authorization_failed" || python.ok && python.value.library.status === "unavailable";
			const pythonRemediation = pythonFailure === undefined ? undefined : pythonFailure.reason === "runtime_unavailable" ? pythonFailure.message + " On a supported system run rea setup --install-hopper, then rerun rea doctor --provider hopper. This checks the system interpreter; a custom Hopper Python interpreter needs its own matching shared runtime." : pythonFailure.reason === "configuration_unknown" ? pythonFailure.message + " Inspect this interpreter's shared-runtime configuration, then rerun rea doctor --provider hopper." : pythonFailure.message + " Retry rea doctor --provider hopper and inspect /usr/bin/python3 if its runtime remains unknown.";
			const displayRemediation = selection.ok ? undefined : value.failure_code === "x11_socket_directory_unusable" ? "Enable unprivileged user and mount namespaces, or provide a writable mode-1777 /tmp/.X11-unix directory. Do not mutate the current host mount with sudo; then rerun rea doctor --provider hopper." : value.failure_code === "runtime_dependency_unavailable" || value.failure_code === "x11_authorization_failed" ? "Install Xvfb, xauth, Python 3, libX11, and libXtst, then rerun rea doctor --provider hopper." : "Inspect the private-display diagnostic, correct the reported local condition, and rerun rea doctor --provider hopper.";
			return {
				name: "hopper-demo-runtime",
				ok: false,
				classification: missingDependency ? "missing_dependency" : selection.ok ? "unknown" : "config_drift",
				detail,
				details,
				remediation: [pythonRemediation, displayRemediation].filter((message) => message !== undefined).join(" ")
			};
		};
	})))();
}

//#endregion
init_doctorRuntime();
export { createSystemDoctorHost };