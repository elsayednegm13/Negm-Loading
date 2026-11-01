import { RegularFileCleanupFailure } from "../filesystem/OwnedRegularFile.js";
import { readClientPolicyBlock } from "./GeminiClientSettings.js";
import { readEffectiveClientRegistrationConfiguration } from "./ClientConfigurationFiles.js";
import { clientServerForcedEnabled, clientServerListedDisabled, effectiveClientServer, } from "./ClientConfigurationDocument.js";
import { lstat, stat } from "node:fs/promises";
import { err, ok } from "../domain/result.js";
import { isAbsolute } from "node:path";
import { PRODUCT_IDENTITY } from "../identity.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { CURRENT_ENTRYPOINT_PATH } from "../process/CurrentEntrypointPath.js";
import { MCP_STARTUP_POLICY, mcpProviderDeadlineAllowanceMs, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds, } from "../mcpStartupPolicy.js";
import { inspectClientRegistrationCommand, packageRunnerRegistrationCommand, } from "./ClientRegistrationIdentity.js";
import { clientEvidencePaths, clientOwnershipEvidencePaths, manualRegistrationRemediation, supportedClients, } from "./SupportedClients.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { dshDocument } from "./DshCordisPatch.js";
import { clientRegistrationEnvironmentDetailsWithBudget } from "./ClientRegistrationEnvironment.js";
import { parseClientRegistration, setupPreservesDisabledActivation, } from "./ClientRegistration.js";
/** Project diagnostics from the same inspection used to select maintenance. */
export const readClientRegistrationStatuses = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => (await readClientRegistrationInspections(home, currentCommandPath, options)).map(({ status }) => status);
/** Parse effective registrations and their client-specific activation once.
 * A supplied scope retains failed cleanup; otherwise transfer its exact failure.
 */
export const readClientRegistrationInspections = async (home, currentCommandPath = CURRENT_ENTRYPOINT_PATH, options = {}) => {
    const inspections = [];
    const record = (status, activation = "unknown", commandIdentity = "unknown") => {
        inspections.push({ status, activation, commandIdentity });
    };
    for (const client of supportedClients(home, options.platform, options.environment)) {
        const selected = options.selectedClientIds?.includes(client.name) === true;
        if (client.configPathError !== undefined) {
            record({
                client: client.name,
                config_path: client.configPath,
                command: [],
                state: "invalid",
                remediation: client.configPathError,
            });
            continue;
        }
        const presence = await clientEvidencePresent(client, {
            selected,
            ownership: options.evidence === "ownership",
        });
        if (!presence.ok) {
            record({
                client: client.name,
                config_path: presence.error.path,
                command: [],
                state: "invalid",
                remediation: presence.error.detail,
            });
            continue;
        }
        if (!presence.value)
            continue;
        const manualRemediation = manualRegistrationRemediation(client.name);
        if (client.format === "unsupported") {
            if (manualRemediation !== undefined)
                record({
                    client: client.name,
                    config_path: client.markerPath ?? client.configPath,
                    command: [],
                    state: "manual",
                    remediation: manualRemediation,
                });
            continue;
        }
        let selectedConfigPath = client.configPath;
        try {
            const configuration = await readEffectiveClientRegistrationConfiguration(client, options.resources, options.platform);
            if (!configuration.ok) {
                if (options.resources === undefined &&
                    configuration.error.cleanupFailure !== undefined)
                    throw configuration.error.cleanupFailure;
                record({
                    client: client.name,
                    config_path: configuration.error.path,
                    command: [],
                    state: "invalid",
                    remediation: configuration.error.detail,
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
                if (options.resources === undefined &&
                    policy.error.cleanupFailure !== undefined)
                    throw policy.error.cleanupFailure;
                record({
                    client: client.name,
                    config_path: configPath,
                    command: [],
                    state: "invalid",
                    remediation: policy.error.detail,
                });
                continue;
            }
            const policyBlock = policy.value;
            const raw = effectiveClientServer(parsed, PRODUCT_IDENTITY.mcpServerKey);
            if (raw === undefined) {
                const editabilityError = parsed.dialect === "dsh"
                    ? dshDocument(parsed.document).editabilityError
                    : undefined;
                if (editabilityError !== undefined) {
                    record({
                        client: client.name,
                        config_path: configPath,
                        command: [],
                        state: "invalid",
                        remediation: editabilityError.message,
                    });
                    continue;
                }
                record(unavailableStatus(client, "missing", configPath));
                continue;
            }
            const effectiveClient = parsed.dialect === "zcode_fallback"
                ? {
                    ...client,
                    configPath,
                    configPaths: [configPath],
                    format: "zcode_fallback",
                }
                : client;
            const parsedRegistration = parseClientRegistration(raw, effectiveClient);
            if (!parsedRegistration.ok) {
                record({
                    client: client.name,
                    config_path: configPath,
                    command: [],
                    state: "invalid",
                    remediation: `${parsedRegistration.error.message}: ${parsedRegistration.error.settings.map(({ setting, constraint }) => `${setting}: ${constraint}`).join("; ")}`,
                });
                continue;
            }
            const registration = parsedRegistration.value;
            const registrationEnvironment = client.name === "kimi" || client.name === "codex"
                ? await clientRegistrationEnvironmentDetailsWithBudget(parsed, {}, "effective", options.resolveProviderRequestBudget, options.platform)
                : undefined;
            if (registrationEnvironment !== undefined &&
                !registrationEnvironment.ok) {
                record({
                    client: client.name,
                    config_path: configPath,
                    command: [],
                    state: "invalid",
                    remediation: registrationEnvironment.error.message,
                });
                continue;
            }
            const command = [
                registration.command,
                ...registration.args,
            ];
            const commandFacts = inspectClientRegistrationCommand(command, currentCommandPath);
            const packageReference = commandFacts.package?.reference;
            const activation = registrationActivation(registration, client, parsed);
            const packageVersion = commandFacts.package?.exactVersion;
            const packageVersionDrift = packageVersion !== undefined &&
                packageVersion !== PRODUCT_IDENTITY.packageVersion;
            const alignment = registrationAligned({
                registration,
                client: effectiveClient,
                command,
                commandFacts,
                platform: options.platform ?? process.platform,
                kimiInputSchemaProfileSelected: registrationEnvironment?.ok === true &&
                    snapshotEnvironment(registrationEnvironment.value.values, options.platform).REA_MCP_INPUT_SCHEMA_PROFILE !== undefined,
            });
            record(configuredStatus(effectiveClient, command, alignment === "unknown"
                ? "unknown"
                : activation === "enabled" &&
                    !packageVersionDrift &&
                    alignment === "aligned" &&
                    (parsed.dialect !== "dsh" ||
                        dshDocument(parsed.document).ready) &&
                    policyBlock === undefined
                    ? "aligned"
                    : "stale", policyBlock ??
                (packageVersionDrift
                    ? packageVersionRemediation(packageReference ?? "", client)
                    : alignment === "unknown"
                        ? unknownEntryPointRemediation()
                        : undefined) ??
                // Only a target whose setup preserves the flag is a manual
                // conflict; a native row (for example ZCode's own storage) is
                // still repaired by its setup run below.
                (activation === "disabled" &&
                    registration.enable === false &&
                    setupPreservesDisabledActivation(effectiveClient, effectiveClient.format)
                    ? sharedDisabledActivationRemediation()
                    : undefined), packageReference, registrationEnvironment?.ok === true
                ? timeoutAdvisory(client, registration, registrationEnvironment.value.timeoutInputs)
                : undefined), activation, commandFacts.identity);
        }
        catch (cause) {
            if (options.resources === undefined &&
                cause instanceof RegularFileCleanupFailure)
                throw cause;
            record(unavailableStatus(client, isMissing(cause) ? "missing" : "invalid", selectedConfigPath));
        }
    }
    return inspections.sort((left, right) => compareUnicodeCodePoints(left.status.client, right.status.client));
};
/** Shared registration storage doubles as ZCode's fallback, so its
 * `enable: false` activation fact binds every reader of that storage.
 * Maintenance must not drop the flag by rewriting the row as another
 * product's registration and silently re-enabling it; whether a repair
 * actually preserves it is setupPreservesDisabledActivation. */
const sharedEnableFlagBinds = (registration, client, parsed) => (parsed.dialect === "zcode" ||
    parsed.dialect === "zcode_fallback" ||
    client.sharedRegistration === true) &&
    registration.enable === false;
/** A disable that setup preserves is a manual conflict: its remediation
 * must not point at an ineffective setup run. */
const sharedDisabledActivationRemediation = () => "This shared registration row carries enable: false, which binds every reader of the shared storage, including ZCode's fallback view. REA preserves that flag, so rea setup will not change this row. Re-enable it with the product that disabled it, or remove enable: false manually, then rerun rea doctor.";
// Codex and Kimi Code load a server marked `disabled: true` and honor only
// `enabled`; Devin loads one marked `enabled: false` and honors only `disabled`.
const ignoresDisabledKey = new Set(["codex", "kimi"]);
const ignoresEnabledKey = new Set(["devin"]);
const registrationActivation = (registration, client, parsed) => (client.format !== "grok" &&
    !ignoresDisabledKey.has(client.name) &&
    registration.disabled === true) ||
    (registration.enabled === false &&
        !ignoresEnabledKey.has(client.name) &&
        !clientServerForcedEnabled(parsed, PRODUCT_IDENTITY.mcpServerKey)) ||
    sharedEnableFlagBinds(registration, client, parsed) ||
    clientServerListedDisabled(parsed, PRODUCT_IDENTITY.mcpServerKey)
    ? "disabled"
    : "enabled";
const registrationAligned = ({ registration, client, command, commandFacts, platform, kimiInputSchemaProfileSelected, }) => {
    const { identity } = commandFacts;
    if (identity === "unknown")
        return "unknown";
    if (identity === "foreign")
        return "stale";
    if (client.name === "grok_build" &&
        registration.startup_timeout_sec !==
            MCP_STARTUP_POLICY.codexStartupTimeoutSeconds)
        return "stale";
    if (client.name === "codex" &&
        (registration.startup_timeout_sec === undefined ||
            registration.tool_timeout_sec === undefined))
        return "stale";
    if (client.name === "kimi" &&
        (registration.startupTimeoutMs === undefined ||
            registration.toolTimeoutMs === undefined))
        return "stale";
    if (client.name === "kimi" && !kimiInputSchemaProfileSelected)
        return "stale";
    // A Harness registration only connects as the rea stdio server; another
    // server name or transport leaves the session without REA tools.
    if (client.format === "dsh" &&
        (registration.serverName !== "rea" || registration.transport !== "stdio"))
        return "stale";
    if (["npx", "bunx"].some((runner) => {
        const expected = packageRunnerRegistrationCommand(runner, platform);
        return (command.length === expected.length &&
            command.every((argument, index) => argument === expected[index]));
    }))
        return "aligned";
    // Other owned package references remain stale until pinned to this version.
    if (commandFacts.package !== undefined)
        return "stale";
    // The identity owner already established an exact direct launcher match.
    // A bare command still depends on the client's PATH, so cannot prove alignment.
    return isAbsolute(command[0] ?? "") ? "aligned" : "stale";
};
/** A client that rewrites its file from memory must be quit before setup. */
const remediation = (client) => {
    if (client.quitBeforeSetup !== true)
        return "Run rea setup to refresh this registration, then restart the client.";
    const name = client.displayName ?? client.name;
    return `Quit ${name} fully, run rea setup to refresh this registration, then start ${name} again. A running ${name} can rewrite its configuration from memory and drop the registration.`;
};
const unknownEntryPointRemediation = () => "The existing registration was retained because its executable identity cannot be verified. Check the registered launcher path, symlink targets and access permissions. Run the installed REA CLI or a supported package runner, then rerun rea doctor; no registration was changed.";
const configuredStatus = (client, command, state, policyRemediation, packageReference, advisory) => state === "aligned"
    ? {
        client: client.name,
        config_path: client.configPath,
        command,
        ...(packageReference === undefined
            ? {}
            : { package_reference: packageReference }),
        state,
        remediation: null,
        ...(advisory === undefined ? {} : { advisory }),
    }
    : {
        client: client.name,
        config_path: client.configPath,
        command,
        ...(packageReference === undefined
            ? {}
            : { package_reference: packageReference }),
        state,
        remediation: policyRemediation ?? remediation(client),
    };
const timeoutAdvisory = (client, registration, timeoutInputs) => {
    const toolTimeout = client.name === "kimi"
        ? registration.toolTimeoutMs
        : client.name === "codex"
            ? registration.tool_timeout_sec
            : undefined;
    if (toolTimeout === undefined)
        return undefined;
    const providerAllowance = mcpProviderDeadlineAllowanceMs(timeoutInputs);
    const isKimi = client.name === "kimi";
    // A bigint is beyond the safe Number range, so rounding cannot cross the allowance.
    const toolTimeoutMs = Number(toolTimeout) * (isKimi ? 1 : 1000);
    const batchScope = timeoutInputs.ghidraDecompileTimeoutMs !== undefined &&
        (timeoutInputs.analysisProvider === "ghidra" ||
            timeoutInputs.analysisProvider === "auto")
        ? "The derived Ghidra deadline is a single-decompile estimate. For multi-function workflows such as batch_decompile, decompile_all or trace_native_values, allow startup plus every attempted function's limit and other work; split calls, reduce trace_native_values max_functions, or select a larger client deadline when needed. Explicit caller deadlines remain unchanged."
        : undefined;
    if (toolTimeoutMs >= providerAllowance)
        return batchScope;
    const setting = isKimi ? "toolTimeoutMs" : "tool_timeout_sec";
    const currentValue = isKimi
        ? `${String(toolTimeout)} ms`
        : `${String(toolTimeout)} seconds`;
    const recommendedValue = isKimi
        ? `${String(recommendedMcpToolTimeoutMs(timeoutInputs))} ms`
        : `${String(recommendedMcpToolTimeoutSeconds(timeoutInputs))} seconds`;
    const headroom = isKimi
        ? `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs)} ms`
        : `${String(MCP_STARTUP_POLICY.toolOperationHeadroomMs / 1000)} seconds`;
    const recommendation = `The configured ${setting} (${currentValue}) is shorter than REA's known provider allowance (${String(providerAllowance)} ms), so provider startup or an upstream request may exceed this client deadline. REA recommends ${setting} = ${recommendedValue} to cover that allowance plus ${headroom} of operation headroom; this additional headroom is a recommendation, not a guarantee for every analysis.`;
    return batchScope === undefined
        ? recommendation
        : `${recommendation} ${batchScope}`;
};
const packageVersionRemediation = (packageReference, client) => `This registration requests ${packageReference}, while the current REA CLI package is ${PRODUCT_IDENTITY.packageVersion}. REA does not resolve package-runner requests during doctor; update the registration with rea setup --client ${client.name}, then restart the client.`;
const unavailableStatus = (client, state, configPath = client.configPath) => ({
    client: client.name,
    config_path: configPath,
    command: [],
    state,
    remediation: remediation(client),
});
/** Product discovery follows targets; configuration evidence retains entry presence. */
const clientEvidencePresent = async (client, evidence) => {
    // An explicit selection authorises the read outright: the caller named this
    // client, so an unreadable config must surface as unreadable instead of
    // collapsing to absence. The probes below serve automatic discovery only.
    if (evidence.selected)
        return ok(true);
    const discoveryPaths = new Set(client.discoveryPaths ?? []);
    const paths = [
        ...clientEvidencePaths(client),
        ...(evidence.ownership ? clientOwnershipEvidencePaths(client) : []),
    ];
    let unavailable;
    for (const path of paths) {
        try {
            await (discoveryPaths.has(path) ? stat(path) : lstat(path));
            return ok(true);
        }
        catch (cause) {
            if (!isMissing(cause))
                unavailable ??= {
                    path,
                    detail: `Client configuration evidence at ${path} could not be inspected: ${cause instanceof Error ? cause.message : String(cause)}. Check file permissions and rerun rea doctor.`,
                };
        }
    }
    return unavailable === undefined ? ok(false) : err(unavailable);
};
const isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
