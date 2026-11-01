import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-CIerZEwx.js";
import { init_environment, parseEnvironment } from "./SupportedClients-cYThuJwT.js";
import { DEFAULT_BRIDGE_MAX_REQUEST, DEFAULT_REGEX_MATCHING_DEADLINE, DEFAULT_REGEX_WORKER_HEAP_REQUEST, homeDirectoryFromEnvironment, init_bridgeMaxRequestBytes, init_homeDirectory, init_regexMatchingDeadline, init_regexWorkerHeapRequest } from "./homeDirectory-CgrzFhoH.js";
import { REA_MANAGED_LINUX_HOPPER_LAUNCHER, init_LinuxHopper, linuxHopperLauncherCandidates } from "./SharedStartupAttempt-BObuC52s.js";
import { posix } from "node:path";
import { readdir } from "node:fs/promises";
import { accessSync, constants, readdirSync, statSync } from "node:fs";

//#region dist/application/MacHopperPaths.js
/** Yield renamed bundles from the local filesystem, reading each root only if needed. */
function* localMacHopperRenamedLauncherCandidates(homeDirectory) {
	for (const root of macHopperApplicationRoots(homeDirectory)) yield* macHopperRenamedLauncherCandidates(homeDirectory, new Map([[root, localBundleNames(root)]]));
}
var MAC_HOPPER_APPLICATION_DIRECTORY, MAC_HOPPER_APPLICATION_NAME, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY, MAC_HOPPER_SYSTEM_LAUNCHER, macHopperUserApplicationPath, macHopperApplicationRoots, macHopperCanonicalLauncherCandidates, macHopperRenamedLauncherCandidates, directoryNames, localBundleNames, readMacHopperRenamedLauncherCandidates;
function init_MacHopperPaths() {
	return (init_MacHopperPaths = __esmMin((() => {
		MAC_HOPPER_APPLICATION_DIRECTORY = "/Applications";
		MAC_HOPPER_APPLICATION_NAME = "Hopper Disassembler.app";
		MAC_HOPPER_USER_APPLICATIONS_DIRECTORY = "Applications";
		MAC_HOPPER_SYSTEM_LAUNCHER = posix.join(MAC_HOPPER_APPLICATION_DIRECTORY, MAC_HOPPER_APPLICATION_NAME, "Contents/MacOS/hopper");
		macHopperUserApplicationPath = (homeDirectory) => posix.join(homeDirectory, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY, MAC_HOPPER_APPLICATION_NAME);
		macHopperApplicationRoots = (homeDirectory) => [MAC_HOPPER_APPLICATION_DIRECTORY, posix.join(homeDirectory, MAC_HOPPER_USER_APPLICATIONS_DIRECTORY)];
		macHopperCanonicalLauncherCandidates = (homeDirectory) => [MAC_HOPPER_SYSTEM_LAUNCHER, posix.join(macHopperUserApplicationPath(homeDirectory), "Contents/MacOS/hopper")];
		macHopperRenamedLauncherCandidates = (homeDirectory, bundleNamesByRoot) => macHopperApplicationRoots(homeDirectory).flatMap((root) => [...new Set(bundleNamesByRoot.get(root) ?? [])].filter((name) => /^Hopper.*\.app$/iu.test(name) && name.toLocaleLowerCase("en-US") !== "Hopper Disassembler.app".toLocaleLowerCase("en-US")).sort().map((name) => posix.join(root, name, "Contents/MacOS/hopper")));
		directoryNames = (entries) => entries.filter((entry) => entry.isDirectory()).map(({ name }) => name);
		localBundleNames = (root) => {
			try {
				return directoryNames(readdirSync(root, { withFileTypes: true }));
			} catch (cause) {
				void cause;
				return [];
			}
		};
		readMacHopperRenamedLauncherCandidates = async (homeDirectory) => {
			const bundleNamesByRoot = new Map();
			for (const root of macHopperApplicationRoots(homeDirectory)) {
				try {
					bundleNamesByRoot.set(root, directoryNames(await readdir(root, { withFileTypes: true })));
				} catch (cause) {
					void cause;
				}
			}
			return macHopperRenamedLauncherCandidates(homeDirectory, bundleNamesByRoot);
		};
	})))();
}

//#endregion
//#region dist/application/HopperLauncherDiscovery.js
var hopperLauncherDiscovery;
function init_HopperLauncherDiscovery() {
	return (init_HopperLauncherDiscovery = __esmMin((() => {
		init_LinuxHopper();
		init_MacHopperPaths();
		hopperLauncherDiscovery = (platform, homeDirectory) => {
			if (platform === "darwin") return {
				candidates: macHopperCanonicalLauncherCandidates(homeDirectory),
				probesMacApplicationBundles: true,
				fallback: MAC_HOPPER_SYSTEM_LAUNCHER
			};
			if (platform === "linux") return {
				candidates: linuxHopperLauncherCandidates(homeDirectory),
				probesMacApplicationBundles: false,
				fallback: REA_MANAGED_LINUX_HOPPER_LAUNCHER
			};
			return {
				candidates: [],
				probesMacApplicationBundles: false,
				fallback: MAC_HOPPER_SYSTEM_LAUNCHER
			};
		};
	})))();
}

//#endregion
//#region dist/config/parseConfig.js
var executableAvailable, defaultHopperLauncherPath, nativeAnalysisEnvironment, inspectNativeAnalysisConfiguration, parseConfig;
function init_parseConfig() {
	return (init_parseConfig = __esmMin((() => {
		init_configurationErrors();
		init_result();
		init_environment();
		init_providerStartupTimeout();
		init_homeDirectory();
		init_bridgeMaxRequestBytes();
		init_regexMatchingDeadline();
		init_regexWorkerHeapRequest();
		init_HopperLauncherDiscovery();
		init_MacHopperPaths();
		executableAvailable = (path) => {
			try {
				accessSync(path, constants.X_OK);
				return statSync(path).isFile();
			} catch {
				return false;
			}
		};
		defaultHopperLauncherPath = (platform, homeDirectory, executable = executableAvailable) => {
			const discovery = hopperLauncherDiscovery(platform, homeDirectory);
			for (const candidate of discovery.candidates) if (executable(candidate)) return candidate;
			if (discovery.probesMacApplicationBundles) {
				for (const candidate of localMacHopperRenamedLauncherCandidates(homeDirectory)) if (executable(candidate)) return candidate;
			}
			return discovery.fallback;
		};
		nativeAnalysisEnvironment = (environment) => {
			const { REA_JEB_MCP_TIMEOUT_MS: _jebTimeout, ...appEnvironment } = environment;
			return appEnvironment;
		};
		inspectNativeAnalysisConfiguration = (environment) => {
			const parsed = parseEnvironment(nativeAnalysisEnvironment(environment));
			const issues = parsed.ok ? [] : parsed.error.settings;
			const configuredTimeout = environment.REA_HOPPER_STARTUP_TIMEOUT_MS;
			if (configuredTimeout === undefined) return { issues };
			if (parsed.ok) return {
				issues,
				configuredHopperStartupTimeout: ok(parsed.value.REA_HOPPER_STARTUP_TIMEOUT_MS)
			};
			const timeout = providerStartupTimeoutSchema.safeParse(configuredTimeout);
			return {
				issues,
				configuredHopperStartupTimeout: timeout.success ? ok(timeout.data) : err(new ConfigurationError("Invalid REA environment configuration", {
					cause: timeout.error,
					settings: timeout.error.issues.map(({ message }) => ({
						setting: "REA_HOPPER_STARTUP_TIMEOUT_MS",
						constraint: message
					}))
				}))
			};
		};
		parseConfig = (environment) => {
			const parsed = parseEnvironment(nativeAnalysisEnvironment(environment));
			if (!parsed.ok) return parsed;
			const env = parsed.value;
			return ok({
				...env.REA_MCP_MAX_RESPONSE_BYTES === undefined ? {} : { mcpMaxResponseBytes: env.REA_MCP_MAX_RESPONSE_BYTES },
				...env.REA_MCP_INPUT_SCHEMA_PROFILE === undefined ? {} : { mcpInputSchemaProfile: env.REA_MCP_INPUT_SCHEMA_PROFILE },
				...env.REA_MCP_OUTPUT_SCHEMA_PROFILE === undefined ? {} : { mcpOutputSchemaProfile: env.REA_MCP_OUTPUT_SCHEMA_PROFILE },
				analysisProvider: env.REA_ANALYSIS_PROVIDER,
				...env.REA_IDA_MCP_CONFIG === undefined ? {} : { idaMcpConfigPath: env.REA_IDA_MCP_CONFIG },
				ghidraInstallDir: env.GHIDRA_INSTALL_DIR,
				ghidraJavaHome: env.JAVA_HOME,
				ghidraStartupTimeoutMs: env.REA_GHIDRA_STARTUP_TIMEOUT_MS,
				...env.REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS === undefined ? {} : { ghidraDecompileTimeoutSeconds: env.REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS },
				...env.REA_GHIDRA_LANGUAGE_ID === undefined ? {} : { ghidraLanguageOverride: {
					languageId: env.REA_GHIDRA_LANGUAGE_ID,
					...env.REA_GHIDRA_COMPILER_SPEC_ID === undefined ? {} : { compilerSpecId: env.REA_GHIDRA_COMPILER_SPEC_ID }
				} },
				...env.REA_GHIDRA_SEED_FILE === undefined ? {} : { ghidraSeedFile: env.REA_GHIDRA_SEED_FILE },
				...env.REA_GHIDRA_DISABLED_ANALYZERS === undefined ? {} : { ghidraDisabledAnalyzers: env.REA_GHIDRA_DISABLED_ANALYZERS },
				...env.REA_GHIDRA_NATIVEAOT_JAR === undefined ? {} : { ghidraNativeAotJar: env.REA_GHIDRA_NATIVEAOT_JAR },
				ilspyCmdPath: env.REA_ILSPY_CMD_PATH,
				hopperLauncherPath: env.HOPPER_LAUNCHER_PATH ?? defaultHopperLauncherPath(process.platform, homeDirectoryFromEnvironment(environment, process.platform)),
				hopperStartupTimeoutMs: env.REA_HOPPER_STARTUP_TIMEOUT_MS,
				hopperTargetPath: env.HOPPER_TARGET_PATH,
				hopperTargetKind: env.HOPPER_TARGET_KIND,
				hopperLoaderArgs: env.loaderArgs,
				logLevel: env.REA_LOG_LEVEL,
				referenceSourcePolicy: { secretPatterns: env.referenceSecretPatterns },
				bridgeMaxRequestBytes: env.REA_BRIDGE_MAX_REQUEST_BYTES === undefined ? DEFAULT_BRIDGE_MAX_REQUEST : {
					maximumBytes: env.REA_BRIDGE_MAX_REQUEST_BYTES,
					source: "setting"
				},
				regexMatchingDeadline: env.REA_REGEX_MATCHING_DEADLINE_MS === undefined ? DEFAULT_REGEX_MATCHING_DEADLINE : {
					deadlineMs: env.REA_REGEX_MATCHING_DEADLINE_MS,
					source: "setting"
				},
				regexWorkerHeapRequest: env.REA_REGEX_WORKER_HEAP_REQUEST_MIB === undefined ? DEFAULT_REGEX_WORKER_HEAP_REQUEST : {
					heapMiB: env.REA_REGEX_WORKER_HEAP_REQUEST_MIB,
					source: "setting"
				}
			});
		};
	})))();
}

//#endregion
export { hopperLauncherDiscovery, init_HopperLauncherDiscovery, init_MacHopperPaths, init_parseConfig, inspectNativeAnalysisConfiguration, macHopperUserApplicationPath, parseConfig, readMacHopperRenamedLauncherCandidates };