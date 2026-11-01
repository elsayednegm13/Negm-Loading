import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, compareUnicodeCodePoints, init_identity, init_unicodeCodePointOrder } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { RegularFileCleanupFailure, init_OwnedRegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { init_RegularFileRead, readRegularFileText } from "./RegularFileRead-4snB6-IE.js";
import { init_snapshotEnvironment, mergeEnvironmentOverrides, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { clientEvidencePaths, clientOwnershipEvidencePaths, init_ClientRegistrationIdentity, init_SupportedClients, init_environment, inspectClientRegistrationCommand, manualRegistrationRemediation, npxRegistrationCommand, packageRunnerRegistrationCommand, parseEnvironment, parseEnvironmentValues, supportedClients } from "./SupportedClients-cYThuJwT.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { MCP_STARTUP_POLICY, init_mcpStartupPolicy, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds } from "./mcpStartupPolicy-Bb-Cmg4y.js";
import { clientConfigurationRecordSchema, clientConfigurationValuesEqual, clientRegistrationEntry, clientServerForcedEnabled, clientServerListedDisabled, dshDocument, effectiveClientServer, geminiServerPolicyBlock, init_ClientConfigurationDocument, init_ClientRegistration, init_DshCordisPatch, parseClientConfiguration, parseClientRegistration, parseGeminiMcpPolicy, setupPreservesDisabledActivation } from "./ClientRegistration-Cl3KCjlr.js";
import { z } from "zod";
import { dirname, isAbsolute, resolve } from "node:path";
import { lstat, realpath, stat } from "node:fs/promises";
import { stripComments } from "jsonc-parser";

//#region dist/application/ClientRegistrationEnvironment.js
var TIMEOUT_INPUT_SETTINGS, environmentSchema, clientRegistrationEnvironment, clientRegistrationEnvironmentDetails, clientRegistrationEnvironmentDetailsWithBudget, validatedDetails, environmentDetails, validatedBudget;
function init_ClientRegistrationEnvironment() {
	return (init_ClientRegistrationEnvironment = __esmMin((() => {
		init_environment();
		init_configurationErrors();
		init_result();
		init_ClientConfigurationDocument();
		init_identity();
		init_unicodeCodePointOrder();
		init_snapshotEnvironment();
		init_DshCordisPatch();
		TIMEOUT_INPUT_SETTINGS = new Set([
			"REA_ANALYSIS_PROVIDER",
			"REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS",
			"REA_GHIDRA_STARTUP_TIMEOUT_MS",
			"REA_HOPPER_STARTUP_TIMEOUT_MS",
			"REA_JEB_MCP_TIMEOUT_MS"
		]);
		environmentSchema = clientConfigurationRecordSchema.transform((values, context) => {
			const entries = [];
			for (const [key, value] of Object.entries(values)) {
				if (typeof value === "string") entries.push([key, value]);
				else context.addIssue({
					code: "custom",
					path: [key],
					message: "Environment values must be strings"
				});
			}
			return Object.fromEntries(entries);
		});
		clientRegistrationEnvironment = (parsed, overrides = {}, validation = "effective", platform = process.platform) => {
			const details = clientRegistrationEnvironmentDetails(parsed, overrides, validation, platform);
			return details.ok ? ok(details.value.values) : details;
		};
		clientRegistrationEnvironmentDetails = (parsed, overrides = {}, validation = "effective", platform = process.platform) => {
			if (parsed?.dialect === "dsh") {
				const environment = dshDocument(parsed.document).environment(overrides, validation, platform);
				if (!environment.ok) return environment;
				return ok(environmentDetails(environment.value.values, environment.value.configuration, environment.value.unresolvedSettings));
			}
			const key = parsed?.environmentKey ?? "env";
			const registration = parsed === undefined ? undefined : effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey);
			const raw = typeof registration === "object" && registration !== null ? Reflect.get(registration, key) : undefined;
			const existing = environmentSchema.safeParse(raw === undefined ? {} : raw);
			if (!existing.success) return err(new ConfigurationError("Invalid REA server environment", { settings: existing.error.issues.map((issue) => ({
				setting: [key, ...issue.path].join("."),
				constraint: "Server environment must be an object containing only string values"
			})) }));
			const environment = mergeEnvironmentOverrides(existing.data, overrides, platform);
			return validatedDetails(environment, validation, platform);
		};
		clientRegistrationEnvironmentDetailsWithBudget = async (parsed, overrides, validation, resolveProviderRequestBudget, platform = process.platform) => {
			const details = clientRegistrationEnvironmentDetails(parsed, overrides, validation, platform);
			if (!details.ok) return details;
			const unresolved = [...details.value.unresolvedSettings].filter((setting) => resolveProviderRequestBudget !== undefined || TIMEOUT_INPUT_SETTINGS.has(setting));
			if (details.value.timeoutInputs === undefined || unresolved.length > 0) return err(new ConfigurationError("Cannot derive a provider request budget from expression-backed settings", { settings: unresolved.map((setting) => ({
				setting,
				constraint: "Resolve this setting to a literal before deriving a request budget"
			})) }));
			const resolved = {
				...details.value,
				timeoutInputs: details.value.timeoutInputs
			};
			if (resolveProviderRequestBudget === undefined) return ok(resolved);
			return validatedBudget(resolved, resolveProviderRequestBudget, platform);
		};
		validatedDetails = (environment, validation, platform = process.platform) => {
			const runtimeEnvironment = snapshotEnvironment(environment, platform);
			const validated = validation === "fragment" ? parseEnvironmentValues(runtimeEnvironment) : parseEnvironment(runtimeEnvironment);
			if (!validated.ok) return validated;
			return ok(environmentDetails(environment, validated.value));
		};
		environmentDetails = (environment, configuration, unresolvedSettings = new Set()) => ({
			values: Object.fromEntries(Object.entries(environment).sort(([left], [right]) => compareUnicodeCodePoints(left, right))),
			unresolvedSettings,
			timeoutInputs: [...unresolvedSettings].some((setting) => TIMEOUT_INPUT_SETTINGS.has(setting)) ? undefined : {
				analysisProvider: configuration.REA_ANALYSIS_PROVIDER,
				ghidraStartupTimeoutMs: configuration.REA_GHIDRA_STARTUP_TIMEOUT_MS,
				...configuration.REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS === undefined ? {} : { ghidraDecompileTimeoutMs: configuration.REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS * 1e3 },
				hopperStartupTimeoutMs: configuration.REA_HOPPER_STARTUP_TIMEOUT_MS,
				...configuration.REA_JEB_MCP_TIMEOUT_MS === undefined ? {} : { jebMcpTimeoutMs: configuration.REA_JEB_MCP_TIMEOUT_MS }
			}
		});
		validatedBudget = async (details, resolveProviderRequestBudget, platform) => {
			const providerBudget = await resolveProviderRequestBudget(details.timeoutInputs.analysisProvider, snapshotEnvironment(details.values, platform));
			if (!providerBudget.ok) return providerBudget;
			return ok({
				...details,
				timeoutInputs: {
					...details.timeoutInputs,
					...providerBudget.value === undefined ? {} : { providerRequestTimeoutMs: providerBudget.value }
				}
			});
		};
	})))();
}

//#endregion
//#region dist/application/ClientConfigurationFiles.js
var invalidEnvironment, readConfigurationText, readConfigurationFile, readClientConfigurationFiles, mergeConfigurationValue, isObject, clientWriteDialect, clientConfigurationForWrite, effectiveClientConfiguration, readEffectiveClientRegistrationConfiguration;
function init_ClientConfigurationFiles() {
	return (init_ClientConfigurationFiles = __esmMin((() => {
		init_result();
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_ClientConfigurationDocument();
		init_ClientRegistrationEnvironment();
		init_snapshotEnvironment();
		init_identity();
		invalidEnvironment = (path, error) => ({
			kind: "malformed",
			path,
			detail: `Configuration ${path} has an invalid REA server environment: ${error.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}. Repair it before rerunning setup.`
		});
		readConfigurationText = async (path, resources) => {
			try {
				return ok(await readRegularFileText(path, resources === undefined ? {} : { resources }));
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return ok(undefined);
				return err({
					kind: "unreadable",
					path,
					detail: `Configuration ${path} could not be read: ${cause instanceof Error ? cause.message : String(cause)}`,
					...cause instanceof RegularFileCleanupFailure ? { cleanupFailure: cause } : {}
				});
			}
		};
		readConfigurationFile = async (path, format, resources) => {
			const source = await readConfigurationText(path, resources);
			if (!source.ok) return source;
			const content = source.value;
			if (content === undefined) return ok(undefined);
			try {
				return ok(parseClientConfiguration(content, format));
			} catch (cause) {
				return err({
					kind: "malformed",
					path,
					detail: `Configuration ${path} is malformed: ${cause instanceof Error ? cause.message : String(cause)}`
				});
			}
		};
		readClientConfigurationFiles = async (client, resources, platform = process.platform) => {
			const documents = [];
			for (const path of client.configPaths ?? [client.configPath]) {
				const document = await readConfigurationFile(path, client.format, resources);
				if (!document.ok) return document;
				if (document.value !== undefined) {
					const environment = clientRegistrationEnvironment(document.value, {}, "fragment", platform);
					if (!environment.ok) return err(invalidEnvironment(path, environment.error));
					documents.push({
						...document.value,
						sourcePath: path
					});
				}
			}
			const environment = clientRegistrationEnvironment(effectiveClientConfiguration(documents, undefined, platform), {}, "effective", platform);
			if (!environment.ok) return err(invalidEnvironment(client.configPath, environment.error));
			return ok(documents);
		};
		mergeConfigurationValue = (previous, next) => {
			if (!isObject(previous) || !isObject(next)) return next;
			return Object.fromEntries([...new Set([...Object.keys(previous), ...Object.keys(next)])].map((key) => [key, Object.hasOwn(next, key) ? mergeConfigurationValue(previous[key], next[key]) : previous[key]]));
		};
		isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		clientWriteDialect = (dialect, sources) => dialect === "opencode" && sources.some(({ dialect }) => dialect === "opencode_v2") ? "opencode_v2" : dialect;
		clientConfigurationForWrite = (parsed, sources) => {
			if (parsed.dialect !== "opencode" || clientWriteDialect(parsed.dialect, sources) !== "opencode_v2") return parsed;
			if (Object.hasOwn(parsed.servers, "servers")) throw new TypeError("A legacy OpenCode server named servers conflicts with the effective native server table; repair this ambiguity before setup");
			return {
				...parsed,
				dialect: "opencode_v2",
				serversPath: ["mcp", "servers"],
				servers: {},
				legacyServers: parsed.servers
			};
		};
		effectiveClientConfiguration = (sources, target, platform = process.platform) => {
			const documents = target === undefined ? sources : (target.client.configPaths ?? [target.client.configPath]).flatMap((path) => {
				const document = path === target.client.configPath ? target.document : sources.find(({ sourcePath }) => sourcePath === path);
				return document === undefined ? [] : [document];
			});
			const last = documents.at(-1);
			if (last === undefined) return undefined;
			if (documents.length === 1) return last;
			const servers = Object.create(null);
			for (const document of documents) {
				const names = new Set([...Object.keys(document.legacyServers), ...Object.keys(document.servers)]);
				for (const name of names) {
					const previous = servers[name];
					const next = effectiveClientServer(document, name);
					const merged = mergeConfigurationValue(previous, next);
					const key = document.environmentKey;
					if (name === PRODUCT_IDENTITY.mcpServerKey && isObject(merged) && isObject(merged[key])) {
						const before = isObject(previous) && isObject(previous[key]) ? previous[key] : {};
						const after = isObject(next) && isObject(next[key]) ? next[key] : {};
						servers[name] = {
							...merged,
							[key]: mergeEnvironmentOverrides(before, after, platform)
						};
					} else servers[name] = merged;
				}
			}
			return {
				...last,
				dialect: clientWriteDialect(last.dialect, documents),
				servers,
				legacyServers: {}
			};
		};
		readEffectiveClientRegistrationConfiguration = async (client, resources, platform = process.platform) => {
			const nativeSources = await readClientConfigurationFiles(client, resources, platform);
			if (!nativeSources.ok) return nativeSources;
			const nativeDocument = effectiveClientConfiguration(nativeSources.value, undefined, platform);
			const fallbackPath = client.format === "zcode" ? client.zcodeFallbackPath : undefined;
			if (fallbackPath === undefined || nativeDocument !== undefined && Object.keys(nativeDocument.servers).length > 0) return ok({
				document: nativeDocument,
				configPath: client.configPath
			});
			const fallbackClient = {
				...client,
				configPath: fallbackPath,
				configPaths: [fallbackPath],
				format: "zcode_fallback"
			};
			const fallbackSources = await readClientConfigurationFiles(fallbackClient, resources, platform);
			if (!fallbackSources.ok) return fallbackSources;
			const fallbackDocument = effectiveClientConfiguration(fallbackSources.value, undefined, platform);
			return ok(fallbackDocument === undefined ? {
				document: nativeDocument,
				configPath: client.configPath
			} : {
				document: fallbackDocument,
				configPath: fallbackPath
			});
		};
	})))();
}

//#endregion
//#region dist/application/GeminiClientSettings.js
var folderTrustSchema, trustRulesSchema, sourceFailure, normalizedPath, workspaceTrusted, readClientPolicyBlock;
function init_GeminiClientSettings() {
	return (init_GeminiClientSettings = __esmMin((() => {
		init_result();
		init_identity();
		init_ClientRegistrationIdentity();
		init_ClientConfigurationDocument();
		init_ClientConfigurationFiles();
		folderTrustSchema = z.object({ security: z.object({ folderTrust: z.object({ enabled: z.boolean().optional() }).passthrough().optional() }).passthrough().optional() }).passthrough();
		trustRulesSchema = z.record(z.string(), z.enum([
			"TRUST_FOLDER",
			"TRUST_PARENT",
			"DO_NOT_TRUST"
		]));
		sourceFailure = (path, cause) => ({
			kind: "malformed",
			path,
			detail: `Gemini settings in ${path} are malformed: ${cause instanceof Error ? cause.message : String(cause)}`
		});
		normalizedPath = async (path, platform) => {
			const physical = await realpath(path).catch(() => path);
			const absolute = resolve(physical).replaceAll("\\", "/");
			return platform === "win32" || platform === "darwin" ? absolute.toLowerCase() : absolute;
		};
		workspaceTrusted = async (settings, sources, resources) => {
			let enabled = true;
			for (const { path, document } of sources) {
				const parsed = folderTrustSchema.safeParse(document.document);
				if (!parsed.success) return err(sourceFailure(path, parsed.error));
				enabled = parsed.data.security?.folderTrust?.enabled ?? enabled;
			}
			if (settings.trustOverride !== undefined) return ok(settings.trustOverride);
			if (!enabled) return ok(true);
			const text = await readConfigurationText(settings.trustedFoldersPath, resources);
			if (!text.ok) return text;
			if (text.value === undefined) return ok(false);
			let rules;
			try {
				rules = trustRulesSchema.parse(JSON.parse(stripComments(text.value)));
			} catch (cause) {
				return err(sourceFailure(settings.trustedFoldersPath, cause));
			}
			const workspace = await normalizedPath(settings.workspaceDirectory, settings.platform);
			let longest = -1;
			let trusted = false;
			for (const [path, level] of Object.entries(rules)) {
				const effective = await normalizedPath(level === "TRUST_PARENT" ? dirname(path) : path, settings.platform);
				if ((workspace === effective || workspace.startsWith(effective.endsWith("/") ? effective : `${effective}/`)) && path.length > longest) {
					longest = path.length;
					trusted = level !== "DO_NOT_TRUST";
				}
			}
			return ok(trusted);
		};
		readClientPolicyBlock = async (client, userDocument, desiredRegistration, resources) => {
			if (client.name !== "gemini_cli" || client.geminiSettings === undefined) return ok(undefined);
			const settings = client.geminiSettings;
			const sources = [];
			const higher = [];
			for (const path of [
				settings.defaultsPath,
				client.configPath,
				settings.systemPath
			]) {
				const parsed = path === client.configPath ? ok(userDocument) : await readConfigurationFile(path, "json", resources);
				if (!parsed.ok) return parsed;
				if (parsed.value !== undefined) sources.push({
					path,
					document: parsed.value
				});
			}
			const workspace = await normalizedPath(settings.workspaceDirectory, settings.platform);
			const home = await normalizedPath(dirname(dirname(client.configPath)), settings.platform);
			if (workspace !== home) {
				const path = resolve(settings.workspaceDirectory, ".gemini", "settings.json");
				const present = await stat(path).then(() => ok(true), (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT" ? ok(false) : err({
					kind: "unreadable",
					path,
					detail: `Configuration ${path} could not be read: ${cause instanceof Error ? cause.message : String(cause)}`
				}));
				if (!present.ok) return present;
				const includeWorkspace = present.value ? await workspaceTrusted(settings, sources, resources) : ok(false);
				if (!includeWorkspace.ok) return includeWorkspace;
				if (includeWorkspace.value) {
					const document = await readConfigurationFile(path, "json", resources);
					if (!document.ok) return document;
					if (document.value !== undefined) {
						const source = {
							path,
							document: document.value
						};
						const systemIndex = sources.findIndex((item) => item.path === settings.systemPath);
						sources.splice(systemIndex < 0 ? sources.length : systemIndex, 0, source);
						higher.push(source);
					}
				}
			}
			const system = sources.find(({ path }) => path === settings.systemPath);
			if (system !== undefined) higher.push(system);
			const policies = [];
			for (const { path, document } of sources) {
				try {
					policies.push(parseGeminiMcpPolicy(document));
				} catch (cause) {
					return err(sourceFailure(path, cause));
				}
			}
			const policy = geminiServerPolicyBlock(policies, PRODUCT_IDENTITY.mcpServerKey);
			if (policy !== undefined) return ok(`${policy} Settings sources: ${sources.map(({ path }) => path).join(", ")}.`);
			const override = higher.findLast(({ document }) => Object.hasOwn(document.servers, PRODUCT_IDENTITY.mcpServerKey));
			const desired = desiredRegistration ?? userDocument?.servers[PRODUCT_IDENTITY.mcpServerKey] ?? clientRegistrationEntry("json", npxRegistrationCommand(), {});
			if (override !== undefined && !clientConfigurationValuesEqual(override.document.servers[PRODUCT_IDENTITY.mcpServerKey], desired)) return ok(`Gemini mcpServers.${PRODUCT_IDENTITY.mcpServerKey} in ${override.path} overrides the user registration. Review that settings file before rerunning setup; REA does not modify system or workspace settings.`);
			return ok(undefined);
		};
	})))();
}

//#endregion
//#region dist/application/ClientRegistrationStatus.js
var readClientRegistrationStatuses, readClientRegistrationInspections, sharedEnableFlagBinds, sharedDisabledActivationRemediation, ignoresDisabledKey, ignoresEnabledKey, registrationActivation, registrationAligned, remediation, unknownEntryPointRemediation, configuredStatus, timeoutAdvisory, packageVersionRemediation, unavailableStatus, clientEvidencePresent, isMissing;
function init_ClientRegistrationStatus() {
	return (init_ClientRegistrationStatus = __esmMin((() => {
		init_OwnedRegularFile();
		init_GeminiClientSettings();
		init_ClientConfigurationFiles();
		init_ClientConfigurationDocument();
		init_result();
		init_identity();
		init_snapshotEnvironment();
		init_CurrentEntrypointPath();
		init_mcpStartupPolicy();
		init_ClientRegistrationIdentity();
		init_SupportedClients();
		init_unicodeCodePointOrder();
		init_DshCordisPatch();
		init_ClientRegistrationEnvironment();
		init_ClientRegistration();
		readClientRegistrationStatuses = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => (await readClientRegistrationInspections(home, currentCommandPath, options)).map(({ status }) => status);
		readClientRegistrationInspections = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => {
			const inspections = [];
			const record = (status, activation = "unknown", commandIdentity = "unknown") => {
				inspections.push({
					status,
					activation,
					commandIdentity
				});
			};
			for (const client of supportedClients(home, options.platform, options.environment)) {
				const selected = options.selectedClientIds?.includes(client.name) === true;
				if (client.configPathError !== undefined) {
					record({
						client: client.name,
						config_path: client.configPath,
						command: [],
						state: "invalid",
						remediation: client.configPathError
					});
					continue;
				}
				const presence = await clientEvidencePresent(client, {
					selected,
					ownership: options.evidence === "ownership"
				});
				if (!presence.ok) {
					record({
						client: client.name,
						config_path: presence.error.path,
						command: [],
						state: "invalid",
						remediation: presence.error.detail
					});
					continue;
				}
				if (!presence.value) continue;
				const manualRemediation = manualRegistrationRemediation(client.name);
				if (client.format === "unsupported") {
					if (manualRemediation !== undefined) record({
						client: client.name,
						config_path: client.markerPath ?? client.configPath,
						command: [],
						state: "manual",
						remediation: manualRemediation
					});
					continue;
				}
				let selectedConfigPath = client.configPath;
				try {
					const configuration = await readEffectiveClientRegistrationConfiguration(client, options.resources, options.platform);
					if (!configuration.ok) {
						if (options.resources === undefined && configuration.error.cleanupFailure !== undefined) throw configuration.error.cleanupFailure;
						record({
							client: client.name,
							config_path: configuration.error.path,
							command: [],
							state: "invalid",
							remediation: configuration.error.detail
						});
						continue;
					}
					const { document: parsed, configPath } = configuration.value;
					selectedConfigPath = configPath;
					if (parsed === undefined) {
						record(unavailableStatus(client, "missing", configPath));
						continue;
					}
					const policy = await readClientPolicyBlock(client, parsed, undefined, options.resources);
					if (!policy.ok) {
						if (options.resources === undefined && policy.error.cleanupFailure !== undefined) throw policy.error.cleanupFailure;
						record({
							client: client.name,
							config_path: configPath,
							command: [],
							state: "invalid",
							remediation: policy.error.detail
						});
						continue;
					}
					const policyBlock = policy.value;
					const raw = effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey);
					if (raw === undefined) {
						const editabilityError = parsed.dialect === "dsh" ? dshDocument(parsed.document).editabilityError : undefined;
						if (editabilityError !== undefined) {
							record({
								client: client.name,
								config_path: configPath,
								command: [],
								state: "invalid",
								remediation: editabilityError.message
							});
							continue;
						}
						record(unavailableStatus(client, "missing", configPath));
						continue;
					}
					const effectiveClient = parsed.dialect === "zcode_fallback" ? {
						...client,
						configPath,
						configPaths: [configPath],
						format: "zcode_fallback"
					} : client;
					const parsedRegistration = parseClientRegistration(raw, effectiveClient);
					if (!parsedRegistration.ok) {
						record({
							client: client.name,
							config_path: configPath,
							command: [],
							state: "invalid",
							remediation: `${parsedRegistration.error.message}: ${parsedRegistration.error.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}`
						});
						continue;
					}
					const registration = parsedRegistration.value;
					const registrationEnvironment = client.name === "kimi" || client.name === "codex" ? await clientRegistrationEnvironmentDetailsWithBudget(parsed, {}, "effective", options.resolveProviderRequestBudget, options.platform) : undefined;
					if (registrationEnvironment !== undefined && !registrationEnvironment.ok) {
						record({
							client: client.name,
							config_path: configPath,
							command: [],
							state: "invalid",
							remediation: registrationEnvironment.error.message
						});
						continue;
					}
					const command = [registration.command, ...registration.args];
					const commandFacts = inspectClientRegistrationCommand(command, currentCommandPath);
					const packageReference = commandFacts.package?.reference;
					const activation = registrationActivation(registration, client, parsed);
					const packageVersion = commandFacts.package?.exactVersion;
					const packageVersionDrift = packageVersion !== undefined && packageVersion !== PRODUCT_IDENTITY.packageVersion;
					const alignment = registrationAligned({
						registration,
						client: effectiveClient,
						command,
						commandFacts,
						platform: options.platform ?? process.platform,
						kimiInputSchemaProfileSelected: registrationEnvironment?.ok === true && snapshotEnvironment(registrationEnvironment.value.values, options.platform).REA_MCP_INPUT_SCHEMA_PROFILE !== undefined
					});
					record(configuredStatus(effectiveClient, command, alignment === "unknown" ? "unknown" : activation === "enabled" && !packageVersionDrift && alignment === "aligned" && (parsed.dialect !== "dsh" || dshDocument(parsed.document).ready) && policyBlock === undefined ? "aligned" : "stale", policyBlock ?? (packageVersionDrift ? packageVersionRemediation(packageReference ?? "", client) : alignment === "unknown" ? unknownEntryPointRemediation() : undefined) ?? (activation === "disabled" && registration.enable === false && setupPreservesDisabledActivation(effectiveClient, effectiveClient.format) ? sharedDisabledActivationRemediation() : undefined), packageReference, registrationEnvironment?.ok === true ? timeoutAdvisory(client, registration, registrationEnvironment.value.timeoutInputs) : undefined), activation, commandFacts.identity);
				} catch (cause) {
					if (options.resources === undefined && cause instanceof RegularFileCleanupFailure) throw cause;
					record(unavailableStatus(client, isMissing(cause) ? "missing" : "invalid", selectedConfigPath));
				}
			}
			return inspections.sort((left, right) => compareUnicodeCodePoints(left.status.client, right.status.client));
		};
		sharedEnableFlagBinds = (registration, client, parsed) => (parsed.dialect === "zcode" || parsed.dialect === "zcode_fallback" || client.sharedRegistration === true) && registration.enable === false;
		sharedDisabledActivationRemediation = () => "This shared registration row carries enable: false, which binds every reader of the shared storage, including ZCode's fallback view. REA preserves that flag, so rea setup will not change this row. Re-enable it with the product that disabled it, or remove enable: false manually, then rerun rea doctor.";
		ignoresDisabledKey = new Set(["codex", "kimi"]);
		ignoresEnabledKey = new Set(["devin"]);
		registrationActivation = (registration, client, parsed) => client.format !== "grok" && !ignoresDisabledKey.has(client.name) && registration.disabled === true || registration.enabled === false && !ignoresEnabledKey.has(client.name) && !clientServerForcedEnabled(parsed, PRODUCT_IDENTITY.mcpServerKey) || sharedEnableFlagBinds(registration, client, parsed) || clientServerListedDisabled(parsed, PRODUCT_IDENTITY.mcpServerKey) ? "disabled" : "enabled";
		registrationAligned = ({ registration, client, command, commandFacts, platform, kimiInputSchemaProfileSelected }) => {
			const { identity } = commandFacts;
			if (identity === "unknown") return "unknown";
			if (identity === "foreign") return "stale";
			if (client.name === "grok_build" && registration.startup_timeout_sec !== MCP_STARTUP_POLICY.codexStartupTimeoutSeconds) return "stale";
			if (client.name === "codex" && (registration.startup_timeout_sec === undefined || registration.tool_timeout_sec === undefined)) return "stale";
			if (client.name === "kimi" && (registration.startupTimeoutMs === undefined || registration.toolTimeoutMs === undefined)) return "stale";
			if (client.name === "kimi" && !kimiInputSchemaProfileSelected) return "stale";
			if (client.format === "dsh" && (registration.serverName !== "rea" || registration.transport !== "stdio")) return "stale";
			if (["npx", "bunx"].some((runner) => {
				const expected = packageRunnerRegistrationCommand(runner, platform);
				return command.length === expected.length && command.every((argument, index) => argument === expected[index]);
			})) return "aligned";
			if (commandFacts.package !== undefined) return "stale";
			return isAbsolute(command[0] ?? "") ? "aligned" : "stale";
		};
		remediation = (client) => {
			if (client.quitBeforeSetup !== true) return "Run rea setup to refresh this registration, then restart the client.";
			const name = client.displayName ?? client.name;
			return `Quit ${name} fully, run rea setup to refresh this registration, then start ${name} again. A running ${name} can rewrite its configuration from memory and drop the registration.`;
		};
		unknownEntryPointRemediation = () => "The existing registration was retained because its executable identity cannot be verified. Check the registered launcher path, symlink targets and access permissions. Run the installed REA CLI or a supported package runner, then rerun rea doctor; no registration was changed.";
		configuredStatus = (client, command, state, policyRemediation, packageReference, advisory) => state === "aligned" ? {
			client: client.name,
			config_path: client.configPath,
			command,
			...packageReference === undefined ? {} : { package_reference: packageReference },
			state,
			remediation: null,
			...advisory === undefined ? {} : { advisory }
		} : {
			client: client.name,
			config_path: client.configPath,
			command,
			...packageReference === undefined ? {} : { package_reference: packageReference },
			state,
			remediation: policyRemediation ?? remediation(client)
		};
		timeoutAdvisory = (client, registration, timeoutInputs) => {
			const toolTimeout = client.name === "kimi" ? registration.toolTimeoutMs : client.name === "codex" ? registration.tool_timeout_sec : undefined;
			if (toolTimeout === undefined) return undefined;
			const providerAllowance = mcpProviderDeadlineAllowanceMs(timeoutInputs);
			const isKimi = client.name === "kimi";
			const toolTimeoutMs = Number(toolTimeout) * (isKimi ? 1 : 1e3);
			const batchScope = timeoutInputs.ghidraDecompileTimeoutMs !== undefined && (timeoutInputs.analysisProvider === "ghidra" || timeoutInputs.analysisProvider === "auto") ? "The derived Ghidra deadline is a single-decompile estimate. For multi-function workflows such as batch_decompile, decompile_all or trace_native_values, allow startup plus every attempted function's limit and other work; split calls, reduce trace_native_values max_functions, or select a larger client deadline when needed. Explicit caller deadlines remain unchanged." : undefined;
			if (toolTimeoutMs >= providerAllowance) return batchScope;
			const setting = isKimi ? "toolTimeoutMs" : "tool_timeout_sec";
			const currentValue = isKimi ? `${String(toolTimeout)} ms` : `${String(toolTimeout)} seconds`;
			const recommendedValue = isKimi ? `${String(recommendedMcpToolTimeoutMs(timeoutInputs))} ms` : `${String(recommendedMcpToolTimeoutSeconds(timeoutInputs))} seconds`;
			const headroom = isKimi ? `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs)} ms` : `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs / 1e3)} seconds`;
			const recommendation = `The configured ${setting} (${currentValue}) is shorter than REA's known provider allowance (${String(providerAllowance)} ms), so provider startup or an upstream request may exceed this client deadline. REA recommends ${setting} = ${recommendedValue} to cover that allowance plus ${headroom} of operation headroom; this additional headroom is a recommendation, not a guarantee for every analysis.`;
			return batchScope === undefined ? recommendation : `${recommendation} ${batchScope}`;
		};
		packageVersionRemediation = (packageReference, client) => `This registration requests ${packageReference}, while the current REA CLI package is ${PRODUCT_IDENTITY.packageVersion}. REA does not resolve package-runner requests during doctor; update the registration with rea setup --client ${client.name}, then restart the client.`;
		unavailableStatus = (client, state, configPath = client.configPath) => ({
			client: client.name,
			config_path: configPath,
			command: [],
			state,
			remediation: remediation(client)
		});
		clientEvidencePresent = async (client, evidence) => {
			if (evidence.selected) return ok(true);
			const discoveryPaths = new Set(client.discoveryPaths ?? []);
			const paths = [...clientEvidencePaths(client), ...evidence.ownership ? clientOwnershipEvidencePaths(client) : []];
			let unavailable;
			for (const path of paths) {
				try {
					await (discoveryPaths.has(path) ? stat(path) : lstat(path));
					return ok(true);
				} catch (cause) {
					if (!isMissing(cause)) unavailable ??= {
						path,
						detail: `Client configuration evidence at ${path} could not be inspected: ${cause instanceof Error ? cause.message : String(cause)}. Check file permissions and rerun rea doctor.`
					};
				}
			}
			return unavailable === undefined ? ok(false) : err(unavailable);
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
export { clientConfigurationForWrite, clientRegistrationEnvironment, clientRegistrationEnvironmentDetailsWithBudget, clientWriteDialect, effectiveClientConfiguration, init_ClientConfigurationFiles, init_ClientRegistrationEnvironment, init_ClientRegistrationStatus, init_GeminiClientSettings, readClientConfigurationFiles, readClientPolicyBlock, readClientRegistrationInspections, readClientRegistrationStatuses, readConfigurationText };