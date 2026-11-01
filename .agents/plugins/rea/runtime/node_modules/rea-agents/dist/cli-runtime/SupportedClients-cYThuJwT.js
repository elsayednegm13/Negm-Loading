import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS, DEFAULT_HOPPER_STARTUP_TIMEOUT_MS, PRODUCT_IDENTITY, analysisProviderSelectorSchema, compareUnicodeCodePoints, init_analysisResourceLimits, init_identity, init_localPath, init_mcpInputSchemaProfile, init_mcpOutputSchemaProfile, init_mcpStartupBudgets, init_providerSelection, init_safeJson, init_unicodeCodePointOrder, mcpDoctorDeadlineMsSchema, mcpFirstCatalogBudgetMsSchema, mcpInitializeBudgetMsSchema, mcpInputSchemaProfileSchema, mcpOutputSchemaProfileSchema, mcpToolsListBudgetMsSchema, nulFreeStringSchema, safeParseJson } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS, ghidraDecompileTimeoutSchema, init_providerStartupTimeout, providerStartupTimeoutSchema } from "./providerStartupTimeout-CIerZEwx.js";
import { bridgeMaxRequestBytesSchema, ghidraDisabledAnalyzersSchema, init_bridgeMaxRequestBytes, init_ghidraDisabledAnalyzers, init_regexMatchingDeadline, init_regexWorkerHeapRequest, regexMatchingDeadlineMsSchema, regexWorkerHeapRequestMiBSchema } from "./homeDirectory-CgrzFhoH.js";
import { asarMaxHeaderBytesSchema, init_asarHeaderAdmission } from "./asarHeaderAdmission-8S9fzpWj.js";
import { captureDecoderOldGenerationMiBSchema, init_captureDecoderHeap } from "./captureDecoderHeap-D3xOeUEV.js";
import { init_processStart, processStartConfigurationSchema } from "./cliOutput-3g9bk55s.js";
import { init_CurrentEntrypointPath, normalizeEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { z } from "zod";
import { basename, dirname, isAbsolute, join, relative, resolve, sep, win32 } from "node:path";
import { lstat } from "node:fs/promises";
import { accessSync, constants, lstatSync, opendirSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { userInfo } from "node:os";
import { fileURLToPath } from "node:url";
import { valid } from "semver";

//#region dist/config/ghidraLanguageOverride.js
var ghidraLanguageIdSchema, ghidraCompilerSpecIdSchema;
function init_ghidraLanguageOverride() {
	return (init_ghidraLanguageOverride = __esmMin((() => {
		ghidraLanguageIdSchema = z.string().regex(/^[A-Za-z0-9_.+-]+(?:\/[A-Za-z0-9_.+-]+)*:(?:LE|BE|LEBE):[1-9]\d*:[A-Za-z0-9_.+-](?:[A-Za-z0-9_.+ -]*[A-Za-z0-9_.+-])?$/u, "must be a Ghidra language ID such as x86:LE:32:default");
		ghidraCompilerSpecIdSchema = z.string().regex(/^[A-Za-z0-9_.+-]+$/u, "must be a Ghidra compiler-spec ID such as default or borlandcpp");
	})))();
}

//#endregion
//#region dist/config/mcpResponseBudget.js
var MINIMUM_RESPONSE_BYTES, stdioResponseBudgetRecovery, nodeStringCeilingRecovery, mcpResponseBudgetSchema, budgetConstraint, parseMcpResponseBudget;
function init_mcpResponseBudget() {
	return (init_mcpResponseBudget = __esmMin((() => {
		init_configurationErrors();
		init_result();
		MINIMUM_RESPONSE_BYTES = 10 * 1024 * 1024;
		stdioResponseBudgetRecovery = (effectiveResponseBytes, reservedStringCodeUnits, nodeStringCeilingCodeUnits) => `The effective REA_MCP_MAX_RESPONSE_BYTES value is ${String(effectiveResponseBytes)} bytes (floor ${String(MINIMUM_RESPONSE_BYTES)} bytes, 10 MiB). A change requires restarting the REA process and a matching client receive buffer. It does not raise REA's reserved single-string limit of ${String(reservedStringCodeUnits)} UTF-16 code units or Node's single-string ceiling of ${String(nodeStringCeilingCodeUnits)} UTF-16 code units. This release has no runtime override for either limit.`;
		nodeStringCeilingRecovery = (reservedStringCodeUnits, nodeStringCeilingCodeUnits) => `REA's reserved single-string limit is ${String(reservedStringCodeUnits)} UTF-16 code units, below Node's single-string ceiling of ${String(nodeStringCeilingCodeUnits)} UTF-16 code units. This release has no runtime override for either limit, and REA_MCP_MAX_RESPONSE_BYTES does not raise them.`;
		mcpResponseBudgetSchema = z.string().regex(/^[1-9]\d*$/u).transform(Number).pipe(z.int().safe().min(MINIMUM_RESPONSE_BYTES));
		budgetConstraint = `REA_MCP_MAX_RESPONSE_BYTES must be a decimal safe integer at least ${String(MINIMUM_RESPONSE_BYTES)} bytes, the default stdio receive-buffer size.`;
		parseMcpResponseBudget = (value) => {
			if (value === undefined) return ok(undefined);
			const parsed = mcpResponseBudgetSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new ConfigurationError(budgetConstraint, { settings: [{
				setting: "REA_MCP_MAX_RESPONSE_BYTES",
				constraint: budgetConstraint
			}] }));
		};
	})))();
}

//#endregion
//#region dist/config/parsers.js
var parseStringArray, parseLoaderArgs, parseConfiguredStringArray, configuredArrayError;
function init_parsers() {
	return (init_parsers = __esmMin((() => {
		init_configurationErrors();
		init_localPath();
		init_result();
		init_safeJson();
		parseStringArray = (encoded, name) => {
			return parseConfiguredStringArray(encoded, name, z.string().min(1));
		};
		parseLoaderArgs = (encoded) => {
			if (encoded === undefined) return ok([]);
			return parseConfiguredStringArray(encoded, "HOPPER_LOADER_ARGS_JSON", nulFreeStringSchema, "must encode an array of strings without NUL bytes");
		};
		parseConfiguredStringArray = (encoded, setting, itemSchema, requirement = "must encode an array of strings") => {
			const decoded = safeParseJson(encoded);
			if (!decoded.ok) return err(configuredArrayError(setting, "must be valid JSON", decoded.cause));
			const parsed = z.array(itemSchema).safeParse(decoded.value);
			return parsed.success ? ok(parsed.data) : err(configuredArrayError(setting, requirement, parsed.error));
		};
		configuredArrayError = (setting, requirement, cause) => {
			const constraint = `${setting} ${requirement}`;
			return new ConfigurationError(constraint, {
				cause,
				settings: [{
					setting,
					constraint
				}]
			});
		};
	})))();
}

//#endregion
//#region dist/config/environment.js
var environmentSchema, parseJebMcpTimeoutMs, parseEnvironmentValues, parseEnvironment;
function init_environment() {
	return (init_environment = __esmMin((() => {
		init_configurationErrors();
		init_result();
		init_providerSelection();
		init_ghidraLanguageOverride();
		init_ghidraDisabledAnalyzers();
		init_providerStartupTimeout();
		init_mcpInputSchemaProfile();
		init_mcpOutputSchemaProfile();
		init_mcpResponseBudget();
		init_asarHeaderAdmission();
		init_bridgeMaxRequestBytes();
		init_captureDecoderHeap();
		init_regexMatchingDeadline();
		init_regexWorkerHeapRequest();
		init_mcpStartupBudgets();
		init_parsers();
		init_processStart();
		environmentSchema = z.object({
			REA_ANALYSIS_PROVIDER: analysisProviderSelectorSchema.default("auto"),
			REA_BRIDGE_MAX_REQUEST_BYTES: bridgeMaxRequestBytesSchema.optional(),
			REA_MCP_MAX_RESPONSE_BYTES: mcpResponseBudgetSchema.optional(),
			REA_ASAR_MAX_HEADER_BYTES: asarMaxHeaderBytesSchema.optional(),
			REA_CAPTURE_DECODER_OLD_GENERATION_MIB: captureDecoderOldGenerationMiBSchema.optional(),
			REA_REGEX_MATCHING_DEADLINE_MS: regexMatchingDeadlineMsSchema.optional(),
			REA_REGEX_WORKER_HEAP_REQUEST_MIB: regexWorkerHeapRequestMiBSchema.optional(),
			REA_MCP_INITIALIZE_BUDGET_MS: mcpInitializeBudgetMsSchema.optional(),
			REA_MCP_TOOLS_LIST_BUDGET_MS: mcpToolsListBudgetMsSchema.optional(),
			REA_MCP_FIRST_CATALOG_BUDGET_MS: mcpFirstCatalogBudgetMsSchema.optional(),
			REA_MCP_DOCTOR_DEADLINE_MS: mcpDoctorDeadlineMsSchema.optional(),
			REA_MCP_INPUT_SCHEMA_PROFILE: mcpInputSchemaProfileSchema.optional(),
			REA_MCP_OUTPUT_SCHEMA_PROFILE: mcpOutputSchemaProfileSchema.optional(),
			REA_IDA_MCP_CONFIG: z.string().min(1).refine(isAbsolute, "REA_IDA_MCP_CONFIG must be absolute").optional(),
			REA_JEB_MCP_TIMEOUT_MS: providerStartupTimeoutSchema.optional(),
			GHIDRA_INSTALL_DIR: z.string().min(1).refine(isAbsolute, "GHIDRA_INSTALL_DIR must be absolute").optional(),
			JAVA_HOME: z.string().min(1).refine(isAbsolute, "JAVA_HOME must be absolute").optional(),
			REA_GHIDRA_NATIVEAOT_JAR: z.string().min(1).refine(isAbsolute, "REA_GHIDRA_NATIVEAOT_JAR must be absolute").optional(),
			REA_GHIDRA_STARTUP_TIMEOUT_MS: providerStartupTimeoutSchema.default(DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS),
			REA_HOPPER_STARTUP_TIMEOUT_MS: providerStartupTimeoutSchema.default(DEFAULT_HOPPER_STARTUP_TIMEOUT_MS),
			REA_SWIFTC_COMPILE_TIMEOUT_MS: providerStartupTimeoutSchema.default(DEFAULT_SWIFTC_COMPILE_TIMEOUT_MS),
			REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS: ghidraDecompileTimeoutSchema.optional(),
			REA_GHIDRA_LANGUAGE_ID: ghidraLanguageIdSchema.optional(),
			REA_GHIDRA_COMPILER_SPEC_ID: ghidraCompilerSpecIdSchema.optional(),
			REA_GHIDRA_DISABLED_ANALYZERS: ghidraDisabledAnalyzersSchema.optional(),
			REA_GHIDRA_SEED_FILE: z.string().min(1).refine(isAbsolute, "REA_GHIDRA_SEED_FILE must be absolute").optional(),
			REA_ILSPY_CMD_PATH: z.string().min(1).refine(isAbsolute, "REA_ILSPY_CMD_PATH must be absolute").optional(),
			HOPPER_LAUNCHER_PATH: z.string().min(1).optional(),
			HOPPER_TARGET_PATH: z.string().min(1).optional(),
			HOPPER_TARGET_KIND: z.enum(["executable", "database"]).default("executable"),
			HOPPER_LOADER_ARGS_JSON: z.string().optional(),
			REA_LOG_LEVEL: processStartConfigurationSchema.shape.REA_LOG_LEVEL,
			REA_REFERENCE_SECRET_PATTERNS_JSON: z.string().default("[]")
		});
		parseJebMcpTimeoutMs = (value) => {
			if (value === undefined) return ok(undefined);
			const parsed = providerStartupTimeoutSchema.safeParse(value);
			if (parsed.success) return ok(parsed.data);
			return err(new ConfigurationError("Invalid REA environment configuration", {
				cause: parsed.error,
				settings: [{
					setting: "REA_JEB_MCP_TIMEOUT_MS",
					constraint: parsed.error.issues[0]?.message ?? "must be a valid timeout"
				}]
			}));
		};
		parseEnvironmentValues = (environment, unresolvedSettings = new Set()) => {
			const keys = new Set([...Object.keys(environment), ...unresolvedSettings]);
			const invalidEntries = [...keys].filter((key) => key.includes("\0") || Object.hasOwn(environment, key) && environment[key]?.includes("\0")).map((setting) => ({
				setting,
				constraint: "Environment variable names and values must not contain NUL bytes"
			}));
			if (invalidEntries.length > 0) return err(new ConfigurationError("Invalid REA environment configuration", { settings: invalidEntries }));
			const parsed = environmentSchema.safeParse(environment);
			if (!parsed.success) {
				const settings = parsed.error.issues.map((issue) => ({
					setting: String(issue.path[0] ?? "environment"),
					constraint: issue.message
				}));
				return err(new ConfigurationError("Invalid REA environment configuration", {
					cause: parsed.error,
					settings
				}));
			}
			const { HOPPER_LOADER_ARGS_JSON: encodedLoaderArgs, REA_REFERENCE_SECRET_PATTERNS_JSON: encodedSecretPatterns, ...env } = parsed.data;
			const loaderArgs = parseLoaderArgs(encodedLoaderArgs);
			if (!loaderArgs.ok) return loaderArgs;
			const secretPatterns = parseStringArray(encodedSecretPatterns, "REA_REFERENCE_SECRET_PATTERNS_JSON");
			if (!secretPatterns.ok) return secretPatterns;
			return ok({
				...env,
				loaderArgs: loaderArgs.value,
				referenceSecretPatterns: secretPatterns.value
			});
		};
		parseEnvironment = (environment, unresolvedSettings = new Set()) => {
			const parsed = parseEnvironmentValues(environment, unresolvedSettings);
			if (!parsed.ok) return parsed;
			const env = parsed.value;
			if (env.REA_GHIDRA_COMPILER_SPEC_ID !== undefined && env.REA_GHIDRA_LANGUAGE_ID === undefined && !unresolvedSettings.has("REA_GHIDRA_LANGUAGE_ID")) return err(new ConfigurationError("Invalid REA environment configuration", { settings: [{
				setting: "REA_GHIDRA_COMPILER_SPEC_ID",
				constraint: "requires REA_GHIDRA_LANGUAGE_ID"
			}] }));
			return parsed;
		};
	})))();
}

//#endregion
//#region dist/application/ClientRegistrationIdentity.js
var environmentValue, invokingPackageRunner, withoutPackageRunnerIdentity, packageRunnerRegistrationCommand, npxRegistrationCommand, unwrapCmdCommand, clientRegistrationPackageReference, entrypointIdentity, directEntrypointIdentity, registrationEntrypointPath, equivalentClientRegistrationCommands, inspectClientRegistrationCommand, classifyClientRegistrationCommand, inspectDirectRegistrationCommand;
function init_ClientRegistrationIdentity() {
	return (init_ClientRegistrationIdentity = __esmMin((() => {
		init_CurrentEntrypointPath();
		init_identity();
		environmentValue = (environment, name, platform) => {
			if (platform !== "win32") return environment[name];
			const target = name.toLowerCase();
			const key = Object.keys(environment).findLast((candidate) => candidate.toLowerCase() === target);
			return key === undefined ? undefined : environment[key];
		};
		invokingPackageRunner = (environment, platform = process.platform) => {
			if (environmentValue(environment, "npm_command", platform) !== "exec") return undefined;
			return environmentValue(environment, "npm_config_user_agent", platform)?.startsWith("bun/") === true ? "bunx" : "npx";
		};
		withoutPackageRunnerIdentity = (environment, platform = process.platform) => Object.fromEntries(Object.entries(environment).filter(([key]) => platform === "win32" ? key.toLowerCase() !== "npm_command" : key !== "npm_command"));
		packageRunnerRegistrationCommand = (runner, platform = process.platform) => {
			const command = runner === "npx" ? [
				"npx",
				"-y",
				PRODUCT_IDENTITY.registrationPackageSpecifier,
				"mcp"
			] : [
				"bunx",
				PRODUCT_IDENTITY.registrationPackageSpecifier,
				"mcp"
			];
			return platform === "win32" ? [
				"cmd.exe",
				"/d",
				"/c",
				...command
			] : command;
		};
		npxRegistrationCommand = (platform = process.platform) => packageRunnerRegistrationCommand("npx", platform);
		unwrapCmdCommand = (command) => {
			const executable = command[0]?.toLowerCase();
			if (executable !== "cmd" && executable !== "cmd.exe") return command;
			if (command[1]?.toLowerCase() === "/c") return command.slice(2);
			if (command[1]?.toLowerCase() === "/d" && command[2]?.toLowerCase() === "/c") return command.slice(3);
			return [];
		};
		clientRegistrationPackageReference = (command) => {
			const arguments_ = unwrapCmdCommand(command);
			if (arguments_.length === 4 && arguments_[0] === "npx" && arguments_[1] === "-y" && arguments_[3] === "mcp") return arguments_[2];
			if (arguments_.length === 3 && arguments_[0] === "bunx" && arguments_[2] === "mcp") return arguments_[1];
			return undefined;
		};
		entrypointIdentity = (candidate, current) => {
			if (!isAbsolute(candidate) || !isAbsolute(current)) return "unknown";
			if (candidate === current) return "owned";
			try {
				return realpathSync.native(candidate) === realpathSync.native(current) ? "owned" : "foreign";
			} catch {
				return "unknown";
			}
		};
		directEntrypointIdentity = (candidate, current) => {
			const nativeIdentity = entrypointIdentity(candidate, current);
			const scriptPath = normalizeEntrypointPath(candidate);
			if (scriptPath === candidate) return nativeIdentity;
			return scriptPath !== undefined && entrypointIdentity(scriptPath, current) === nativeIdentity ? nativeIdentity : "unknown";
		};
		registrationEntrypointPath = (entrypoint, environment, platform) => {
			if (platform === "win32") return entrypoint;
			for (const directory of (environment.PATH ?? "").split(":")) {
				if (!isAbsolute(directory)) continue;
				const candidate = join(directory, PRODUCT_IDENTITY.cliBinary);
				if (directEntrypointIdentity(candidate, entrypoint) !== "owned") continue;
				try {
					accessSync(candidate, constants.X_OK);
					return candidate;
				} catch {}
			}
			return entrypoint;
		};
		equivalentClientRegistrationCommands = (previous, requested) => {
			if (previous.length === requested.length && previous.every((value, index) => value === requested[index])) return true;
			const current = inspectClientRegistrationCommand(requested, undefined).entrypoint;
			if (current === undefined) return false;
			const prior = inspectClientRegistrationCommand(previous, current);
			return prior.entrypoint !== undefined && prior.identity === "owned";
		};
		inspectClientRegistrationCommand = (command, currentCommandPath) => {
			const reference = clientRegistrationPackageReference(command);
			if (reference !== undefined) {
				const prefix = `${PRODUCT_IDENTITY.packageName}@`;
				const version = reference.startsWith(prefix) ? reference.slice(prefix.length) : undefined;
				const normalized = version === undefined ? null : valid(version);
				const owned = reference === PRODUCT_IDENTITY.packageName || reference === PRODUCT_IDENTITY.packageSpecifier || reference === PRODUCT_IDENTITY.registrationPackageSpecifier || normalized !== null;
				return {
					identity: owned ? "owned" : "foreign",
					entrypoint: undefined,
					package: {
						reference,
						exactVersion: normalized === version ? version : undefined
					}
				};
			}
			return inspectDirectRegistrationCommand(command, currentCommandPath);
		};
		classifyClientRegistrationCommand = (command, currentCommandPath) => inspectClientRegistrationCommand(command, currentCommandPath).identity;
		inspectDirectRegistrationCommand = (command, currentCommandPath) => {
			const currentPathAvailable = currentCommandPath !== undefined && currentCommandPath.length > 0;
			if (command.length === 3 && command[2] === "mcp") {
				const interpreter = command[0] ?? "";
				const entrypoint = command[1] ?? "";
				if (!isAbsolute(interpreter) || !isAbsolute(entrypoint)) return {
					identity: "unknown",
					entrypoint: undefined,
					package: undefined
				};
				const interpreterIdentity = entrypointIdentity(interpreter, process.execPath);
				if (interpreterIdentity !== "owned") return {
					identity: currentPathAvailable ? interpreterIdentity : "unknown",
					entrypoint: undefined,
					package: undefined
				};
				const selectedEntrypoint = normalizeEntrypointPath(entrypoint);
				return {
					identity: selectedEntrypoint === undefined || !currentPathAvailable ? "unknown" : entrypointIdentity(selectedEntrypoint, currentCommandPath),
					entrypoint: selectedEntrypoint,
					package: undefined
				};
			}
			if (command.length === 2 && command[1] === "mcp") {
				const executable = command[0] ?? "";
				if (executable === PRODUCT_IDENTITY.cliBinary) return {
					identity: "owned",
					entrypoint: undefined,
					package: undefined
				};
				if (isAbsolute(executable)) return {
					identity: currentPathAvailable ? directEntrypointIdentity(executable, currentCommandPath) : "unknown",
					entrypoint: executable,
					package: undefined
				};
				if (/[./\\]/u.test(executable)) return {
					identity: "unknown",
					entrypoint: undefined,
					package: undefined
				};
			}
			return {
				identity: "foreign",
				entrypoint: undefined,
				package: undefined
			};
		};
	})))();
}

//#endregion
//#region dist/application/HermesClientHome.js
var HermesClientPathError, defaultDirectory, expandedDirectory, physicalPath, within, PROFILE_MARKERS, RESERVED_PROFILES, liveProfile, resolveHermesClientHome;
function init_HermesClientHome() {
	return (init_HermesClientHome = __esmMin((() => {
		HermesClientPathError = class extends Error {
			path;
			constructor(path, message) {
				super(message);
				this.path = path;
				this.name = "HermesClientPathError";
			}
		};
		defaultDirectory = (home, platform, env) => {
			const suffix = env.HERMES_DATA_DIR_SUFFIX ?? "";
			return platform === "win32" ? join(env.LOCALAPPDATA?.trim() || join(home, "AppData", "Local"), `hermes${suffix}`) : join(home, `.hermes${suffix}`);
		};
		expandedDirectory = (home, platform, env) => {
			const override = env.HERMES_HOME?.trim();
			if (!override) return undefined;
			const variables = override.replace(/\$(\w+|\{[^}]*\})/gu, (match, variable) => {
				const key = variable.startsWith("{") ? variable.slice(1, -1) : variable;
				return env[key] ?? match;
			});
			const expanded = platform === "win32" ? variables.replace(/%([^%]+)%/gu, (match, variable) => env[variable] ?? match) : variables;
			if (expanded === "~") return home;
			if (expanded.startsWith("~/") || platform === "win32" && expanded.startsWith("~\\")) return join(home, expanded.slice(2));
			if (expanded.startsWith("~")) {
				if (platform !== "win32") {
					const separator = expanded.indexOf("/");
					const username = expanded.slice(1, separator < 0 ? undefined : separator);
					let account;
					try {
						account = userInfo();
					} catch {
						throw new HermesClientPathError(override, "Cannot resolve the OS account for this named Hermes home. Set an absolute HERMES_HOME before configuring Hermes.");
					}
					if (account.username === username && isAbsolute(account.homedir)) return join(account.homedir, separator < 0 ? "" : expanded.slice(separator + 1));
				}
				throw new HermesClientPathError(override, "Cannot resolve this named Hermes home. Set an absolute HERMES_HOME before configuring Hermes.");
			}
			return resolve(expanded);
		};
		physicalPath = (path) => {
			try {
				return realpathSync(path);
			} catch {
				return resolve(path);
			}
		};
		within = (root, path) => {
			const difference = relative(physicalPath(root), physicalPath(path));
			return difference === "" || !isAbsolute(difference) && difference !== ".." && !difference.startsWith(`..${sep}`);
		};
		PROFILE_MARKERS = [
			"config.yaml",
			".env",
			"SOUL.md",
			"profile.yaml",
			"auth.json",
			"state.db"
		];
		RESERVED_PROFILES = new Set([
			"hermes",
			"test",
			"tmp",
			"root",
			"sudo"
		]);
		liveProfile = (path) => {
			try {
				if (!statSync(path).isDirectory()) return false;
				try {
					statSync(join(dirname(path), ".deleted", basename(path)));
					return false;
				} catch {}
				return PROFILE_MARKERS.some((marker) => {
					try {
						const status = lstatSync(join(path, marker));
						return status.isFile() || status.isSymbolicLink();
					} catch {
						return false;
					}
				});
			} catch {
				return false;
			}
		};
		resolveHermesClientHome = (home, platform, env) => {
			const native = defaultDirectory(home, platform, env);
			const root = expandedDirectory(home, platform, env) ?? native;
			if (basename(dirname(root)) === "profiles") return root;
			const stickyRoot = within(native, root) ? native : root;
			let name;
			try {
				name = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(join(stickyRoot, "active_profile"))).trim();
			} catch {
				return root;
			}
			if (name === "" || name === "default") return root;
			const canonical = name.toLowerCase();
			if (canonical === "default") return root;
			if (!/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(canonical) || RESERVED_PROFILES.has(canonical)) throw new HermesClientPathError(join(stickyRoot, "active_profile"), `Invalid saved Hermes profile ${JSON.stringify(name)}. Run 'hermes profile use default' or repair active_profile.`);
			const selected = join(stickyRoot, "profiles", canonical);
			if (!liveProfile(selected)) throw new HermesClientPathError(selected, `Saved Hermes profile ${JSON.stringify(name)} is missing, deleted, or has no profile identity. Run 'hermes profile use default' or restore that profile before configuring it.`);
			return selected;
		};
	})))();
}

//#endregion
//#region dist/application/MsixPackageStorage.js
var windowsAppDataRoots, msixPackagesDirectory, pathWithin, packagePrivateStorageFamily, packagePrivateLauncherBlocker, canonicalDestination, redirectedWriteBlocker, packageReadTargetChanged;
function init_MsixPackageStorage() {
	return (init_MsixPackageStorage = __esmMin((() => {
		init_result();
		windowsAppDataRoots = (home, env) => ({
			roaming: env.APPDATA || join(home, "AppData", "Roaming"),
			local: env.LOCALAPPDATA || join(home, "AppData", "Local")
		});
		msixPackagesDirectory = (home, env) => join(windowsAppDataRoots(home, env).local, "Packages");
		pathWithin = (path, root) => {
			const inner = relative(root, path);
			return inner === "" || inner !== ".." && !inner.startsWith(`..${sep}`) && !isAbsolute(inner);
		};
		packagePrivateStorageFamily = (canonicalPath, packagesDirectory) => {
			if (!pathWithin(canonicalPath, packagesDirectory)) return undefined;
			const [family, storage] = relative(packagesDirectory, canonicalPath).split(/[\\/]/u);
			return family !== undefined && family !== "" && storage?.toLowerCase() === "localcache" ? family : undefined;
		};
		packagePrivateLauncherBlocker = (command, packagesDirectory, canonicalPath = realpathSync.native) => {
			let packages = packagesDirectory;
			try {
				packages = canonicalPath(packagesDirectory);
			} catch (cause) {
				void cause;
			}
			for (const part of command) {
				if (!isAbsolute(part)) continue;
				let resolved;
				try {
					resolved = canonicalPath(part);
				} catch (cause) {
					void cause;
					continue;
				}
				const family = packagePrivateStorageFamily(resolved, packages);
				if (family !== undefined) return `The REA launcher ${part} is stored at ${resolved}, inside the private storage of MSIX package ${family}. Only processes started by that app can see it at ${part}, and Windows removes it with the package, so other clients could not start this registration. Install REA from a terminal that the app did not start (for example with \`npm install -g rea-agents\`), then rerun setup from that terminal.`;
			}
			return undefined;
		};
		canonicalDestination = (path, canonicalPath) => {
			let ancestor = path;
			const missing = [];
			while (true) {
				try {
					return ok(join(canonicalPath(ancestor), ...missing));
				} catch (cause) {
					if (cause instanceof Error && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR") && dirname(ancestor) !== ancestor) {
						missing.unshift(basename(ancestor));
						ancestor = dirname(ancestor);
						continue;
					}
					return err({
						path,
						detail: cause instanceof Error ? cause.message : String(cause)
					});
				}
			}
		};
		redirectedWriteBlocker = (view, targets, operation, canonicalPath = realpathSync.native) => {
			if (view?.processView !== "redirected" || targets.length === 0) return undefined;
			const roots = [];
			const redirected = [];
			for (const root of view.virtualizedRoots) {
				const resolved = canonicalDestination(root, canonicalPath);
				if (!resolved.ok) return `Cannot establish the MSIX write location for ${resolved.error.path}: ${resolved.error.detail}. Rerun ${operation} from a terminal that this app did not start.`;
				roots.push(resolved.value);
			}
			for (const target of targets) {
				const resolved = canonicalDestination(target, canonicalPath);
				if (!resolved.ok) return `Cannot establish the MSIX write location for ${resolved.error.path}: ${resolved.error.detail}. Rerun ${operation} from a terminal that this app did not start.`;
				if (roots.some((root) => pathWithin(resolved.value, root))) redirected.push(target);
			}
			if (redirected.length === 0) return undefined;
			return `This process was started by MSIX package ${view.packageFamilyName}, which redirects its writes under ${view.virtualizedRoots.join(" and ")} into the package's private storage. Changes to ${redirected.join(", ")} would not reach the files other apps read. Rerun ${operation} from a terminal that this app did not start.`;
		};
		packageReadTargetChanged = async (view, configPath) => {
			if (configPath !== view.appDataConfigPath) return ok(false);
			try {
				await lstat(view.privateConfigPath);
				return ok(true);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR")) return ok(false);
				return err({
					_tag: "MsixReadTargetInspectionFailure",
					path: view.privateConfigPath,
					detail: cause instanceof Error ? cause.message : String(cause),
					cause
				});
			}
		};
	})))();
}

//#endregion
//#region dist/application/ClaudeDesktopConfigLocation.js
var CONFIG_FILE, PROCESS_VIEW_PROBES, ROAMING_DIRECTORY_LIMIT, ROAMING_DEPTH_LIMIT, ROAMING_ENTRY_LIMIT, PROBES_PER_DIRECTORY, CLAUDE_DESKTOP_PACKAGE_FAMILY, CLAUDE_PACKAGE_FAMILY, readNames, systemFileSystem, resolveWindowsClaudeDesktopLocation, processView, resolveAppData, claudeFolderProbes, roamingProbes, isPrivateFile, entryKind, present, isMissing, errorMessage;
function init_ClaudeDesktopConfigLocation() {
	return (init_ClaudeDesktopConfigLocation = __esmMin((() => {
		init_result();
		init_MsixPackageStorage();
		CONFIG_FILE = "claude_desktop_config.json";
		PROCESS_VIEW_PROBES = 8;
		ROAMING_DIRECTORY_LIMIT = 64;
		ROAMING_DEPTH_LIMIT = 4;
		ROAMING_ENTRY_LIMIT = 1024;
		PROBES_PER_DIRECTORY = 2;
		CLAUDE_DESKTOP_PACKAGE_FAMILY = "Claude_pzs8sxrjxfjjc";
		CLAUDE_PACKAGE_FAMILY = /^(?:AnthropicPBC\.)?Claude_[0-9a-hjkmnp-tv-z]{13}$/iu;
		readNames = (path, limit) => {
			const directory = opendirSync(path);
			const names = [];
			try {
				while (names.length < limit) {
					const entry = directory.readSync();
					if (entry === null) break;
					names.push(entry.name);
				}
			} finally {
				directory.closeSync();
			}
			return names;
		};
		systemFileSystem = {
			readdir: (path, limit) => limit === undefined ? readdirSync(path) : readNames(path, limit),
			lstat: (path) => lstatSync(path),
			realpath: (path) => realpathSync.native(path)
		};
		resolveWindowsClaudeDesktopLocation = (home, env, fileSystem = systemFileSystem) => {
			const roots = windowsAppDataRoots(home, env);
			const appDataDirectory = join(roots.roaming, "Claude");
			const appDataConfigPath = join(appDataDirectory, CONFIG_FILE);
			const packagesDirectory = join(roots.local, "Packages");
			let families;
			try {
				families = fileSystem.readdir(packagesDirectory).filter((name) => CLAUDE_PACKAGE_FAMILY.test(name));
			} catch (cause) {
				if (!isMissing(cause)) return err({
					path: packagesDirectory,
					message: `MSIX package storage ${packagesDirectory} could not be inspected, so REA cannot establish whether Claude Desktop reads ${appDataConfigPath} or a package-private copy: ${errorMessage(cause)}. Repair access to that directory, then rerun.`
				});
				families = [];
			}
			const foreign = families.filter((name) => name.toLowerCase() !== CLAUDE_DESKTOP_PACKAGE_FAMILY.toLowerCase());
			if (foreign.length > 0) return err({
				path: join(packagesDirectory, foreign[0] ?? ""),
				message: `MSIX package storage ${foreign.map((name) => join(packagesDirectory, name)).join(", ")} has an unrecognized Claude Desktop package identity or deployment (the supported identity is ${CLAUDE_DESKTOP_PACKAGE_FAMILY}). REA cannot establish which ${CONFIG_FILE} that package reads and does not fall back to ${appDataConfigPath}. Quit Claude Desktop fully and register REA in the configuration the installed app reads.`
			});
			const family = families[0];
			if (family === undefined) return ok({
				configPath: appDataConfigPath,
				markerPath: appDataDirectory
			});
			const container = join(packagesDirectory, family);
			const privateRoaming = join(container, "LocalCache", "Roaming");
			const privateDirectory = join(privateRoaming, "Claude");
			const privateConfigPath = join(privateDirectory, CONFIG_FILE);
			const privateCopy = present(fileSystem, privateConfigPath);
			if (!privateCopy.ok) return privateCopy;
			const appDataCopy = privateCopy.value ? ok(false) : present(fileSystem, appDataConfigPath);
			if (!appDataCopy.ok) return appDataCopy;
			return ok({
				configPath: privateCopy.value || !appDataCopy.value ? privateConfigPath : appDataConfigPath,
				markerPath: container,
				msixPackage: {
					packageFamilyName: family,
					privateConfigPath,
					appDataConfigPath,
					virtualizedRoots: [roots.roaming, roots.local],
					processView: processView(fileSystem, privateRoaming, roots.roaming, privateCopy.value)
				}
			});
		};
		processView = (fileSystem, privateRoaming, appDataRoaming, privateConfig) => {
			const entryBudget = { inspected: 0 };
			const ownProbes = privateConfig ? [join("Claude", CONFIG_FILE)] : claudeFolderProbes(fileSystem, privateRoaming, entryBudget);
			const probes = ownProbes.length > 0 ? ownProbes : roamingProbes(fileSystem, privateRoaming, entryBudget);
			let view = "unknown";
			for (const probe of probes) {
				let privateTarget;
				try {
					privateTarget = fileSystem.realpath(join(privateRoaming, probe));
				} catch (cause) {
					void cause;
					continue;
				}
				const appDataPath = join(appDataRoaming, probe);
				const first = resolveAppData(fileSystem, appDataPath);
				if (first === undefined) return "unknown";
				if (first === privateTarget) return "redirected";
				if (!isPrivateFile(fileSystem, privateRoaming, probe)) continue;
				const second = resolveAppData(fileSystem, appDataPath);
				if (second === undefined) return "unknown";
				if (second === privateTarget) return "redirected";
				if (second === first) view = "direct";
			}
			return view;
		};
		resolveAppData = (fileSystem, path) => {
			try {
				return fileSystem.realpath(path);
			} catch (cause) {
				return isMissing(cause) ? null : undefined;
			}
		};
		claudeFolderProbes = (fileSystem, privateRoaming, entryBudget) => {
			try {
				const remaining = ROAMING_ENTRY_LIMIT - entryBudget.inspected;
				if (remaining <= 0) return [];
				const names = fileSystem.readdir(join(privateRoaming, "Claude"), remaining);
				entryBudget.inspected += names.length;
				const probes = [];
				for (const name of names) {
					if (isPrivateFile(fileSystem, privateRoaming, join("Claude", name))) {
						probes.push(join("Claude", name));
						if (probes.length === PROCESS_VIEW_PROBES) break;
					}
				}
				return probes;
			} catch (cause) {
				void cause;
				return [];
			}
		};
		roamingProbes = (fileSystem, privateRoaming, entryBudget) => {
			const probes = [];
			const queue = [{
				path: "",
				depth: 0
			}];
			for (let listed = 0; listed < ROAMING_DIRECTORY_LIMIT && probes.length < PROCESS_VIEW_PROBES && entryBudget.inspected < ROAMING_ENTRY_LIMIT; listed++) {
				const directory = queue.shift();
				if (directory === undefined) break;
				let names;
				try {
					const enumerated = fileSystem.readdir(join(privateRoaming, directory.path), ROAMING_ENTRY_LIMIT - entryBudget.inspected);
					entryBudget.inspected += enumerated.length;
					names = [...enumerated].sort();
				} catch (cause) {
					void cause;
					continue;
				}
				let taken = 0;
				for (const name of names) {
					const wantsFile = taken < PROBES_PER_DIRECTORY;
					const wantsFolder = directory.depth < ROAMING_DEPTH_LIMIT && listed + queue.length < ROAMING_DIRECTORY_LIMIT - 1;
					if (!wantsFile && !wantsFolder) break;
					const path = join(directory.path, name);
					const entry = entryKind(fileSystem, join(privateRoaming, path));
					if (entry === "file" && wantsFile) {
						probes.push(path);
						taken += 1;
						if (probes.length === PROCESS_VIEW_PROBES) break;
					} else if (entry === "directory" && wantsFolder) queue.push({
						path,
						depth: directory.depth + 1
					});
				}
			}
			return probes;
		};
		isPrivateFile = (fileSystem, privateRoaming, path) => entryKind(fileSystem, join(privateRoaming, path)) === "file";
		entryKind = (fileSystem, path) => {
			try {
				const entry = fileSystem.lstat(path);
				return entry.isFile() ? "file" : entry.isDirectory() ? "directory" : undefined;
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		present = (fileSystem, path) => {
			try {
				fileSystem.lstat(path);
				return ok(true);
			} catch (cause) {
				if (isMissing(cause)) return ok(false);
				return err({
					path,
					message: `${path} could not be inspected, so REA cannot establish which ${CONFIG_FILE} Claude Desktop's MSIX package reads: ${errorMessage(cause)}. Repair access to that path, then rerun.`
				});
			}
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && (cause.code === "ENOENT" || cause.code === "ENOTDIR");
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
	})))();
}

//#endregion
//#region dist/application/SupportedClients.js
var xdgConfigHome, vscodeUserDirectory, traeUserDirectory, claudeDesktopLocation, claudeCodeConfigDirectory, claudeCodeMarkerDirectory, codexDirectory, kimiDirectory, qoderDirectory, factoryDirectory, qwenCodeDirectory, grokDirectory, dshDirectory, dshHomeDirectory, dshPatchDirectory, hermesDirectory, grokBotDirectory, GROK_BOT_MANUAL_REGISTRATION_REMEDIATION, manualRegistrationRemediation, registrationPersistenceDetail, registrationWriteBlocker, appDataRedirection, OMP_PROFILE_NAME, OMP_RESERVED_PROFILE, ompAgentDirectory, piAgentDirectory, copilotDirectory, commandCodeDirectory, openCodeOverrideDirectory, opencodeDirectory, openCodeConfigurationPaths, existingOpenCodeConfigPath, geminiSettings, devinDirectory, freebuffProfileDirectory, SUPPORTED_CLIENT_DEFINITIONS, clientEvidencePaths, clientOwnershipEvidencePaths, clientSharedRegistrationPaths, resolvePath, resolveLocation, supportedClients, clientSkillDirectories;
function init_SupportedClients() {
	return (init_SupportedClients = __esmMin((() => {
		init_result();
		init_HermesClientHome();
		init_unicodeCodePointOrder();
		init_ClaudeDesktopConfigLocation();
		init_MsixPackageStorage();
		xdgConfigHome = ({ home, env }) => env.XDG_CONFIG_HOME || join(home, ".config");
		vscodeUserDirectory = ({ home, platform, env }) => {
			if (platform === "win32") return join(windowsAppDataRoots(home, env).roaming, "Code", "User");
			if (platform === "darwin") return join(home, "Library", "Application Support", "Code", "User");
			return join(xdgConfigHome({
				home,
				platform,
				env
			}), "Code", "User");
		};
		traeUserDirectory = ({ home, platform, env }) => {
			if (platform === "win32") return join(windowsAppDataRoots(home, env).roaming, "Trae", "User");
			if (platform === "darwin") return join(home, "Library", "Application Support", "Trae", "User");
			return join(xdgConfigHome({
				home,
				platform,
				env
			}), "Trae", "User");
		};
		claudeDesktopLocation = (context) => {
			if (context.platform === "win32") return resolveWindowsClaudeDesktopLocation(context.home, context.env);
			const directory = context.platform === "linux" ? join(xdgConfigHome(context), "Claude") : join(context.home, "Library", "Application Support", "Claude");
			return ok({
				configPath: join(directory, "claude_desktop_config.json"),
				markerPath: directory
			});
		};
		claudeCodeConfigDirectory = ({ home, env }) => env.CLAUDE_CONFIG_DIR || home;
		claudeCodeMarkerDirectory = ({ home, env }) => env.CLAUDE_CONFIG_DIR || join(home, ".claude");
		codexDirectory = ({ home, env }) => env.CODEX_HOME || join(home, ".codex");
		kimiDirectory = ({ home, env }) => env.KIMI_CODE_HOME || join(home, ".kimi-code");
		qoderDirectory = ({ home, env }) => env.QODER_CONFIG_DIR || join(home, ".qoder");
		factoryDirectory = ({ home }) => join(home, ".factory");
		qwenCodeDirectory = ({ home, env }) => {
			const override = env.QWEN_HOME;
			if (!override) return join(home, ".qwen");
			const expanded = override === "~" ? home : override.startsWith("~/") || override.startsWith("~\\") ? join(home, ...override.slice(2).split(/[/\\]+/).filter(Boolean)) : override;
			return isAbsolute(expanded) ? expanded : resolve(expanded);
		};
		grokDirectory = ({ home, env }) => env.GROK_HOME || join(home, ".grok");
		dshDirectory = (home, override, fallback) => {
			const selected = override !== undefined && override.trim().length > 0 ? override : join(home, fallback);
			const expanded = selected === "~" ? home : selected.startsWith("~/") || selected.startsWith("~\\") ? join(home, selected.slice(2)) : selected;
			return resolve(expanded);
		};
		dshHomeDirectory = ({ home, env }) => dshDirectory(home, env.DSH_HOME, ".dsh");
		dshPatchDirectory = (context) => join(dshHomeDirectory(context), "cordis.patch.yml");
		hermesDirectory = ({ home, platform, env }) => resolveHermesClientHome(home, platform, env);
		grokBotDirectory = ({ home, env }) => {
			const root = env.SAND_DATA_ROOT;
			return root !== undefined && root !== "" && isAbsolute(root) ? root : join(home, ".grokbot");
		};
		GROK_BOT_MANUAL_REGISTRATION_REMEDIATION = "Grok Bot keeps connectors in the signed-in account and runs them on its hosted computer. Setup does not write that account store, and a data-directory mcp.json is not a registration. In the Grok Bot chat, add a custom MCP server named rea that runs on the Bot's computer with `npx -y rea-agents@<version> mcp`. Do not put credentials in the command or arguments. A stdio server on this machine is not attached.";
		manualRegistrationRemediation = (clientName) => clientName === "grok_bot" ? GROK_BOT_MANUAL_REGISTRATION_REMEDIATION : undefined;
		registrationPersistenceDetail = (client) => {
			const name = client.displayName ?? client.name;
			const msix = client.msixPackage;
			const packageDetail = msix === undefined ? undefined : client.configPath === msix.privateConfigPath ? `${name} is installed as MSIX package ${msix.packageFamilyName}, which reads this package-private file instead of ${msix.appDataConfigPath}.` : `${name} is installed as MSIX package ${msix.packageFamilyName}, which reads this file until it saves its own copy at ${msix.privateConfigPath}.`;
			const quitDetail = client.quitBeforeSetup === true ? `Quit ${name} fully before approving; closing its window is not enough. A running ${name} can rewrite this file from memory and drop the registration. Start it again after setup.` : undefined;
			const details = [packageDetail, quitDetail].filter((detail) => detail !== undefined);
			return details.length === 0 ? undefined : details.join(" ");
		};
		registrationWriteBlocker = (client, operation) => {
			const msix = client.msixPackage;
			if (msix === undefined || msix.processView === "direct") return undefined;
			const name = client.displayName ?? client.name;
			if (msix.processView === "redirected") return `This process was started from ${name}'s MSIX package ${msix.packageFamilyName}: its AppData is redirected into that package, so ${name} is running and would overwrite ${msix.privateConfigPath} from memory. Quit ${name} fully, then rerun ${operation} from a terminal that ${name} did not start.`;
			const manualEdit = operation === "setup" ? `Add REA's entry to ${client.configPath} by hand` : `Remove REA's entry by hand from each of ${msix.privateConfigPath} and ${msix.appDataConfigPath} that has one`;
			return `REA cannot tell whether ${name}'s MSIX package ${msix.packageFamilyName} started this process, because no private file under ${dirname(dirname(msix.privateConfigPath))} could be compared with ${dirname(dirname(msix.appDataConfigPath))}, and a ${name} that started it would overwrite the change from memory. ${manualEdit} while ${name} is fully quit, or rerun ${operation} from a terminal that ${name} did not start once REA can compare a private file there.`;
		};
		appDataRedirection = (clients) => clients.find(({ msixPackage }) => msixPackage?.processView === "redirected")?.msixPackage;
		OMP_PROFILE_NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/u;
		OMP_RESERVED_PROFILE = /^(?:CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(?:\..*)?$/iu;
		ompAgentDirectory = (context) => {
			const root = join(context.home, context.env.PI_CONFIG_DIR || ".omp");
			const profile = (context.env.OMP_PROFILE ?? context.env.PI_PROFILE)?.trim();
			if (profile !== undefined && profile !== "" && profile !== "default") {
				if (!OMP_PROFILE_NAME.test(profile) || profile.endsWith(".") || OMP_RESERVED_PROFILE.test(profile)) return err({
					path: root,
					message: `Invalid OMP profile ${JSON.stringify(profile)}: names must match ^[a-z0-9][a-z0-9._-]{0,63}$, cannot end with ".", and cannot be a Windows reserved device name (CON, PRN, AUX, NUL, COM0-9, LPT0-9, including extensions). Repair OMP_PROFILE or PI_PROFILE before configuring OMP.`
				});
				return ok(join(root, "profiles", profile, "agent"));
			}
			const override = context.env.PI_CODING_AGENT_DIR;
			return ok(override ? resolve(override) : join(root, "agent"));
		};
		piAgentDirectory = ({ home, platform, env }) => {
			const paths = platform === "win32" ? win32 : { join };
			let directory = env.PI_CODING_AGENT_DIR;
			if (!directory) return paths.join(home, ".pi", "agent");
			if (platform === "win32" && directory.startsWith("/") && !directory.startsWith("//") && !directory.includes("\\")) {
				const drive = /^\/(?:mnt\/|cygdrive\/)?([a-z])(?:\/(.*))?$/iu.exec(directory);
				if (drive !== null) directory = `${drive[1]?.toUpperCase()}:\\${drive[2]?.replaceAll("/", "\\") ?? ""}`;
			}
			if (directory === "~") return home;
			if (directory.startsWith("~/") || platform === "win32" && directory.startsWith("~\\")) return paths.join(home, directory.slice(2));
			if (directory.startsWith("file://")) return fileURLToPath(directory, { windows: platform === "win32" });
			return directory;
		};
		copilotDirectory = ({ home, env }) => env.COPILOT_HOME || join(home, ".copilot");
		commandCodeDirectory = ({ home }) => join(home, ".commandcode");
		openCodeOverrideDirectory = (env) => {
			const directory = env.OPENCODE_CONFIG_DIR;
			return directory === undefined || directory === "" ? undefined : directory;
		};
		opencodeDirectory = (context) => openCodeOverrideDirectory(context.env) ?? join(xdgConfigHome(context), "opencode");
		openCodeConfigurationPaths = (context) => {
			const directory = join(xdgConfigHome(context), "opencode");
			const overrideDirectory = openCodeOverrideDirectory(context.env);
			const paths = [
				join(directory, "config.json"),
				join(directory, "opencode.json"),
				join(directory, "opencode.jsonc"),
				...context.env.OPENCODE_CONFIG ? [context.env.OPENCODE_CONFIG] : [],
				...overrideDirectory !== undefined ? [join(overrideDirectory, "opencode.json"), join(overrideDirectory, "opencode.jsonc")] : []
			];
			const resolved = paths.map((path) => resolve(path));
			return resolved.filter((path, index) => resolved.lastIndexOf(path) === index);
		};
		existingOpenCodeConfigPath = (context) => {
			const overrideDirectory = openCodeOverrideDirectory(context.env);
			const candidates = overrideDirectory !== undefined ? [join(overrideDirectory, "opencode.json"), join(overrideDirectory, "opencode.jsonc")].map((path) => resolve(path)) : context.env.OPENCODE_CONFIG ? [resolve(context.env.OPENCODE_CONFIG)] : [join(opencodeDirectory(context), "opencode.json"), join(opencodeDirectory(context), "opencode.jsonc")].map((path) => resolve(path));
			return [...candidates].reverse().find((path) => {
				try {
					lstatSync(path);
					return true;
				} catch (cause) {
					return !(cause instanceof Error && "code" in cause && cause.code === "ENOENT");
				}
			}) ?? resolve(overrideDirectory !== undefined ? join(overrideDirectory, "opencode.json") : context.env.OPENCODE_CONFIG || join(opencodeDirectory(context), "opencode.json"));
		};
		geminiSettings = ({ home, platform, env }) => {
			const system = env.GEMINI_CLI_SYSTEM_SETTINGS_PATH || (platform === "darwin" ? "/Library/Application Support/GeminiCli/settings.json" : platform === "win32" ? "C:\\ProgramData\\gemini-cli\\settings.json" : "/etc/gemini-cli/settings.json");
			const trustOverride = env.GEMINI_RESTRICTED_MODE === "true" || env.GEMINI_CLI_TRUST_WORKSPACE === "false" ? false : env.GEMINI_CLI_TRUST_WORKSPACE === "true" ? true : undefined;
			return {
				systemPath: system,
				defaultsPath: env.GEMINI_CLI_SYSTEM_DEFAULTS_PATH || join(dirname(system), "system-defaults.json"),
				workspaceDirectory: process.cwd(),
				trustedFoldersPath: env.GEMINI_CLI_TRUSTED_FOLDERS_PATH || join(env.GEMINI_CLI_HOME || home, ".gemini", "trustedFolders.json"),
				...trustOverride === undefined ? {} : { trustOverride },
				platform
			};
		};
		devinDirectory = ({ home, platform, env }) => platform === "win32" ? join(windowsAppDataRoots(home, env).roaming, "devin") : join(env.XDG_CONFIG_HOME || join(home, ".config"), "devin");
		freebuffProfileDirectory = ({ home }) => join(home, ".config", "freebuff-desktop");
		SUPPORTED_CLIENT_DEFINITIONS = [
			{
				name: "claude_code",
				displayName: "Claude Code",
				skillPath: (context) => join(claudeCodeMarkerDirectory(context), "skills"),
				configPath: (context) => join(claudeCodeConfigDirectory(context), ".claude.json"),
				markerPath: claudeCodeMarkerDirectory,
				format: "claude_code"
			},
			{
				name: "claude_desktop",
				displayName: "Claude Desktop",
				location: claudeDesktopLocation,
				quitBeforeSetup: true,
				format: "json"
			},
			{
				name: "codex",
				displayName: "Codex",
				configPath: (context) => join(codexDirectory(context), "config.toml"),
				markerPath: codexDirectory,
				format: "toml"
			},
			{
				name: "cursor",
				displayName: "Cursor",
				configPath: [".cursor", "mcp.json"],
				markerPath: [".cursor"],
				format: "json"
			},
			{
				name: "gemini_cli",
				displayName: "Gemini CLI",
				geminiSettings,
				configPath: ({ home, env }) => join(env.GEMINI_CLI_HOME || home, ".gemini", "settings.json"),
				markerPath: ({ home, env }) => join(env.GEMINI_CLI_HOME || home, ".gemini"),
				skillPath: ({ home, env }) => join(env.GEMINI_CLI_HOME || home, ".agents", "skills"),
				format: "json"
			},
			{
				name: "windsurf",
				displayName: "Windsurf",
				configPath: [
					".codeium",
					"windsurf",
					"mcp_config.json"
				],
				markerPath: [".codeium", "windsurf"],
				format: "json"
			},
			{
				name: "devin",
				displayName: "Devin",
				configPath: ({ home, platform, env }) => join(devinDirectory({
					home,
					platform,
					env
				}), "mcp_config.json"),
				markerPath: devinDirectory,
				format: "json"
			},
			{
				name: "opencode",
				displayName: "OpenCode",
				configPath: existingOpenCodeConfigPath,
				configPaths: openCodeConfigurationPaths,
				markerPath: opencodeDirectory,
				format: "opencode"
			},
			{
				name: "antigravity",
				displayName: "Antigravity",
				skillPath: [
					".gemini",
					"config",
					"skills"
				],
				configPath: [
					".gemini",
					"config",
					"mcp_config.json"
				],
				markerPath: [".gemini", "config"],
				format: "json"
			},
			{
				name: "copilot_cli",
				displayName: "GitHub Copilot CLI",
				configPath: (context) => join(copilotDirectory(context), "mcp-config.json"),
				markerPath: copilotDirectory,
				format: "copilot_cli"
			},
			{
				name: "commandcode",
				displayName: "Command Code",
				configPath: (context) => join(commandCodeDirectory(context), "mcp.json"),
				markerPath: commandCodeDirectory,
				format: "commandcode"
			},
			{
				name: "qwen_code",
				displayName: "Qwen Code",
				configPath: (context) => join(qwenCodeDirectory(context), "settings.json"),
				markerPath: qwenCodeDirectory,
				format: "json"
			},
			{
				name: "kimi",
				displayName: "Kimi Code",
				configPath: (context) => join(kimiDirectory(context), "mcp.json"),
				markerPath: kimiDirectory,
				format: "kimi"
			},
			{
				name: "vscode",
				displayName: "VS Code",
				configPath: (context) => join(vscodeUserDirectory(context), "mcp.json"),
				markerPath: vscodeUserDirectory,
				format: "vscode"
			},
			{
				name: "trae",
				displayName: "Trae",
				skillPath: [".trae", "skills"],
				configPath: (context) => join(traeUserDirectory(context), "mcp.json"),
				markerPath: traeUserDirectory,
				format: "json"
			},
			{
				name: "workbuddy",
				displayName: "WorkBuddy",
				skillPath: [".workbuddy", "skills"],
				configPath: [".workbuddy", "mcp.json"],
				markerPath: [".workbuddy"],
				format: "json"
			},
			{
				name: "grok_build",
				displayName: "Grok Build",
				configPath: (context) => join(grokDirectory(context), "config.toml"),
				markerPath: grokDirectory,
				format: "grok"
			},
			{
				name: "omp",
				displayName: "OMP",
				configPath: (context) => {
					const directory = ompAgentDirectory(context);
					return directory.ok ? ok(join(directory.value, "mcp.json")) : directory;
				},
				markerPath: ompAgentDirectory,
				format: "omp"
			},
			{
				name: "pi",
				displayName: "Pi",
				configPath: (context) => (context.platform === "win32" ? win32 : { join }).join(piAgentDirectory(context), "mcp.json"),
				markerPath: piAgentDirectory,
				format: "pi"
			},
			{
				name: "hermes",
				displayName: "Hermes",
				skillPath: (context) => join(hermesDirectory(context), "skills"),
				configPath: (context) => join(hermesDirectory(context), "config.yaml"),
				markerPath: hermesDirectory,
				format: "hermes"
			},
			{
				name: "qoder",
				displayName: "Qoder",
				skillPath: (context) => join(qoderDirectory(context), "skills"),
				configPath: (context) => join(qoderDirectory(context), "settings.json"),
				markerPath: qoderDirectory,
				format: "json"
			},
			{
				name: "droid",
				displayName: "Factory Droid",
				skillPath: (context) => join(factoryDirectory(context), "skills"),
				configPath: (context) => join(factoryDirectory(context), "mcp.json"),
				markerPath: factoryDirectory,
				format: "json"
			},
			{
				name: "zcode",
				zcodeFallbackPath: ({ home }) => join(home, ".agents", "mcp.json"),
				displayName: "ZCode",
				configPath: [
					".zcode",
					"cli",
					"config.json"
				],
				markerPath: [".zcode", "cli"],
				skillPath: [".zcode", "skills"],
				discoveryPaths: ({ home }) => [join(home, ".zcode", "cli")],
				format: "zcode"
			},
			{
				name: "dsh",
				displayName: "DeepSeek Harness",
				skillPath: ({ home, env }) => join(dshDirectory(home, env.DSH_AGENTS_HOME, ".agents"), "skills"),
				configPath: dshPatchDirectory,
				markerPath: dshHomeDirectory,
				format: "dsh"
			},
			{
				name: "freebuff",
				displayName: "FreeBuff",
				skillPath: ({ home }) => join(home, ".agents", "skills"),
				configPath: ({ home }) => join(home, ".agents", "mcp.json"),
				markerPath: freebuffProfileDirectory,
				discoveryPaths: (context) => [freebuffProfileDirectory(context)],
				sharedRegistration: true,
				format: "json"
			},
			{
				name: "grok_bot",
				displayName: "Grok Bot",
				configPath: grokBotDirectory,
				markerPath: grokBotDirectory,
				format: "unsupported"
			}
		];
		clientEvidencePaths = (client) => [...new Set((client.discoveryPaths ?? [
			client.configPath,
			...client.configPaths ?? [],
			client.markerPath
		]).filter((path) => path !== undefined && path.length > 0))];
		clientOwnershipEvidencePaths = (client) => client.sharedRegistration === true ? [client.configPath, ...client.configPaths ?? []].filter((path) => path !== undefined && path.length > 0) : [];
		clientSharedRegistrationPaths = (client) => new Set([...clientOwnershipEvidencePaths(client), ...client.zcodeFallbackPath === undefined ? [] : [client.zcodeFallbackPath]]);
		resolvePath = (path, context) => {
			const resolved = typeof path === "function" ? path(context) : join(context.home, ...path);
			return typeof resolved === "string" ? ok(resolved) : resolved;
		};
		resolveLocation = (definition, context) => {
			if (definition.location !== undefined) return definition.location(context);
			const config = resolvePath(definition.configPath, context);
			if (!config.ok) return config;
			const marker = resolvePath(definition.markerPath, context);
			return marker.ok ? ok({
				configPath: config.value,
				markerPath: marker.value
			}) : marker;
		};
		supportedClients = (home, platform = process.platform, env = process.env) => {
			const context = {
				home,
				platform,
				env
			};
			const definitions = SUPPORTED_CLIENT_DEFINITIONS;
			return definitions.map((definition) => {
				try {
					const location = resolveLocation(definition, context);
					if (!location.ok) return {
						name: definition.name,
						displayName: definition.displayName,
						format: definition.format,
						configPath: location.error.path,
						configPathError: location.error.message
					};
					const { configPath, markerPath, msixPackage } = location.value;
					return {
						name: definition.name,
						displayName: definition.displayName,
						configPath,
						...definition.geminiSettings === undefined ? {} : { geminiSettings: definition.geminiSettings(context) },
						...definition.configPaths === undefined ? {} : { configPaths: [...new Set([...definition.configPaths(context), configPath])] },
						...definition.zcodeFallbackPath === undefined ? {} : { zcodeFallbackPath: definition.zcodeFallbackPath(context) },
						markerPath,
						...msixPackage === undefined ? {} : { msixPackage },
						...definition.quitBeforeSetup === true ? { quitBeforeSetup: true } : {},
						...definition.discoveryPaths === undefined ? {} : { discoveryPaths: definition.discoveryPaths(context) },
						...definition.sharedRegistration === true ? { sharedRegistration: true } : {},
						format: definition.format
					};
				} catch (cause) {
					if (cause instanceof HermesClientPathError) return {
						name: definition.name,
						displayName: definition.displayName,
						format: definition.format,
						configPath: cause.path,
						configPathError: cause.message
					};
					if (definition.name !== "pi") throw cause;
					return {
						name: definition.name,
						displayName: definition.displayName,
						format: definition.format,
						configPath: env.PI_CODING_AGENT_DIR ?? "",
						configPathError: `Invalid PI_CODING_AGENT_DIR: ${cause instanceof Error ? cause.message : String(cause)}. Repair the override before configuring Pi.`
					};
				}
			});
		};
		clientSkillDirectories = (home, clientIds, environment = {}, platform = process.platform) => {
			const unresolved = [];
			const definitions = SUPPORTED_CLIENT_DEFINITIONS;
			const selected = clientIds === undefined ? ["shared", ...definitions.filter(({ skillPath }) => skillPath !== undefined).map(({ name }) => name)] : clientIds.length === 0 ? ["shared"] : clientIds;
			const destinations = new Map();
			for (const client of selected) {
				const definition = definitions.find(({ name }) => name === client);
				if (definition === undefined && client !== "shared") {
					unresolved.push({
						client,
						path: client,
						detail: `Unsupported skill client: ${client}`
					});
					continue;
				}
				let directory;
				try {
					const resolved = definition?.skillPath === undefined ? ok(join(home, ".agents", "skills")) : resolvePath(definition.skillPath, {
						home,
						platform,
						env: environment
					});
					if (!resolved.ok) {
						unresolved.push({
							client,
							path: resolved.error.path,
							detail: resolved.error.message
						});
						continue;
					}
					directory = resolved.value;
				} catch (cause) {
					if (cause instanceof HermesClientPathError) {
						unresolved.push({
							client,
							path: cause.path,
							detail: cause.message
						});
						continue;
					}
					throw cause;
				}
				if (!destinations.has(directory)) destinations.set(directory, {
					client: directory === join(home, ".agents", "skills") ? "shared" : client,
					directory
				});
			}
			return {
				directories: [...destinations.values()].sort((left, right) => compareUnicodeCodePoints(left.directory, right.directory)),
				unresolved
			};
		};
	})))();
}

//#endregion
export { SUPPORTED_CLIENT_DEFINITIONS, appDataRedirection, classifyClientRegistrationCommand, clientEvidencePaths, clientOwnershipEvidencePaths, clientSharedRegistrationPaths, clientSkillDirectories, equivalentClientRegistrationCommands, init_ClientRegistrationIdentity, init_MsixPackageStorage, init_SupportedClients, init_environment, inspectClientRegistrationCommand, invokingPackageRunner, manualRegistrationRemediation, msixPackagesDirectory, npxRegistrationCommand, packagePrivateLauncherBlocker, packageReadTargetChanged, packageRunnerRegistrationCommand, parseEnvironment, parseEnvironmentValues, parseJebMcpTimeoutMs, redirectedWriteBlocker, registrationEntrypointPath, registrationPersistenceDetail, registrationWriteBlocker, supportedClients, withoutPackageRunnerIdentity };