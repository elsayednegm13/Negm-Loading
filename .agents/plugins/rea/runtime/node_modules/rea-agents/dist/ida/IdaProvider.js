import { launchRegexMatchingLimitation } from "../process/RegexMatcher.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { createAnalysisProfile, analysisProfilesEqual, } from "../domain/analysisProfile.js";
import { isElfMetadataArchitecture, } from "../domain/binaryTargetTypes.js";
import { err, ok } from "../domain/result.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { idaRegistrationDigest } from "./IdaRegistrationIdentity.js";
import { isDeepStrictEqual } from "node:util";
import { readIdaConfiguration, idaConfigurationError, } from "./IdaConfiguration.js";
import { createIdaMcpConnection, } from "./IdaMcpConnection.js";
import { idaCapabilities, IDA_PROVIDER_IDENTITY, } from "./IdaProviderCapabilities.js";
import { IdaSessionClient } from "./IdaSessionClient.js";
import { privateRuntimeRootCapability } from "../process/PrivateRuntimeRoot.js";
import { ArtifactResourceScope, ArtifactResourceRetryFailure, } from "../artifacts/ArtifactResourceScope.js";
import { AnalysisCleanupLease } from "../artifacts/AnalysisCleanupLease.js";
import { AnalysisCleanupLeaseGroup } from "../artifacts/AnalysisCleanupLease.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
/** Bring-your-own IDA MCP candidate; discovery performs no provider startup. */
export class IdaProvider {
    config;
    connectionFactory;
    #ownedResources = new ArtifactResourceScope();
    #inspectionOwner = {
        retain: (owner, resource) => this.#ownedResources.retain({
            kind: "lease",
            resource,
            lease: AnalysisCleanupLease.forCloseOwner(owner, resource),
        }),
        run: (operation) => this.#ownedResources.run(operation),
    };
    #registrationByScope = new WeakMap();
    environment;
    constructor(config, environment, connectionFactory = createIdaMcpConnection) {
        this.config = config;
        this.connectionFactory = connectionFactory;
        this.environment = snapshotEnvironment(environment);
    }
    identity() {
        return IDA_PROVIDER_IDENTITY;
    }
    capabilities() {
        const profiles = [
            ...idaCapabilities("attached", false, false, this.#regexLimitation()),
            ...idaCapabilities("attached", true, true, this.#regexLimitation()),
            ...idaCapabilities("headless", true, false, this.#regexLimitation()),
        ];
        const byOperation = new Map();
        for (const capability of profiles) {
            const existing = byOperation.get(capability.operation) ?? [];
            existing.push(capability);
            byOperation.set(capability.operation, existing);
        }
        return [...byOperation.values()].map((variants) => {
            const first = variants[0];
            const available = variants.some(({ available }) => available);
            const effects = {
                mutatesArtifact: variants.some(({ effects }) => effects.mutatesArtifact),
                launchesProcess: variants.some(({ effects }) => effects.launchesProcess),
                mayShowUi: variants.some(({ effects }) => effects.mayShowUi),
                mayAccessNetwork: variants.some(({ effects }) => effects.mayAccessNetwork),
                mayWriteFilesystem: variants.some(({ effects }) => effects.mayWriteFilesystem),
                changesPermissions: variants.some(({ effects }) => effects.changesPermissions),
                requiresRoot: variants.some(({ effects }) => effects.requiresRoot),
            };
            const limitations = [
                ...new Set(variants.flatMap(({ limitations }) => limitations)),
            ];
            const descriptor = {
                provider: first.provider,
                operation: first.operation,
                ...(first.cachePolicy === undefined
                    ? {}
                    : { cachePolicy: first.cachePolicy }),
                effects,
                limitations,
            };
            return available
                ? { ...descriptor, available: true, reason: null }
                : {
                    ...descriptor,
                    available: false,
                    reason: first.reason ??
                        "No configured IDA compatibility profile admits this operation.",
                };
        });
    }
    hasPendingOwnedResources() {
        return this.#ownedResources.hasPending;
    }
    async closeOwnedResources() {
        try {
            await this.#ownedResources.close();
            return ok(null);
        }
        catch (cause) {
            const failure = new ProviderCleanupError(IDA_PROVIDER_IDENTITY.id, this.#ownedResources.cleanupResources, { cause: cause instanceof Error ? cause.message : String(cause) }, { cause, operation: "close_owned_resources" });
            if (cause instanceof ArtifactResourceRetryFailure)
                new AnalysisCleanupLeaseGroup(failure, cause.cleanupLeases);
            return err(failure);
        }
    }
    async inspectAvailability(options) {
        return (await this.inspectReadinessSnapshot(options)).availability;
    }
    async inspectReadinessSnapshot(options) {
        const config = await this.#configuration(options);
        const capabilities = config.ok
            ? idaCapabilities(config.value.mode, "command" in config.value, config.value.protocol === "native", this.#regexLimitation())
            : this.capabilities();
        const registrationDiagnostics = {
            configured: this.config.idaMcpConfigPath !== undefined,
            registration_path: this.config.idaMcpConfigPath ?? null,
            live_connection_probed: false,
        };
        if (!config.ok) {
            const failure = projectAnalysisError(config.error);
            return {
                availability: {
                    status: "unavailable",
                    code: this.config.idaMcpConfigPath === undefined
                        ? "not_configured"
                        : "open_options_invalid",
                    reason: failure.message,
                    diagnostics: {
                        ...registrationDiagnostics,
                        configuration_details: failure.details ?? null,
                        configuration_remediation: failure.remediation.action,
                    },
                },
                capabilities,
            };
        }
        if (config.value.mode === "headless") {
            const privacy = privateRuntimeRootCapability();
            if (!privacy.available)
                return {
                    availability: {
                        status: "unavailable",
                        code: privacy.code,
                        reason: privacy.reason,
                        diagnostics: {
                            ...registrationDiagnostics,
                            mode: "headless",
                            private_workspace_available: false,
                            windows_native_failure: {
                                stage: privacy.failureStage,
                                remediation: privacy.remediation,
                            },
                        },
                    },
                    capabilities,
                };
        }
        return {
            availability: {
                status: "available",
                code: null,
                reason: null,
                diagnostics: {
                    ...registrationDiagnostics,
                    mode: config.value.mode,
                    transport: "command" in config.value ? "stdio" : "http",
                },
            },
            capabilities,
        };
    }
    inspectTargetSupport(target) {
        const diagnostics = {
            target_kind: target.kind,
            target_format: target.format,
        };
        if (target.format === "gamecube-dol")
            return {
                status: "unsupported",
                code: "target_format_unsupported",
                reason: "IDA does not admit caller-selected GameCube DOL images. Open the target with Ghidra and select format gamecube-dol.",
                diagnostics,
            };
        if (target.kind === "executable" &&
            (isElfMetadataArchitecture(target.architecture) ||
                target.architecture === "hexagon"))
            return {
                status: "unsupported",
                code: "architecture_unsupported",
                reason: `REA's IDA adapter has no verified ${target.architecture === "mips"
                    ? "MIPS"
                    : target.architecture === "riscv"
                        ? "RISC-V"
                        : target.architecture === "powerpc"
                            ? "PowerPC"
                            : "Hexagon"} lane. Select a supported Ghidra profile instead.`,
                diagnostics,
            };
        if (target.kind === "executable" && target.architecture === "arm64_32")
            return {
                status: "unsupported",
                code: "architecture_unsupported",
                reason: "REA's IDA adapter has no verified arm64_32 lane.",
                diagnostics,
            };
        if (target.kind !== "executable")
            return {
                status: "unsupported",
                code: "target_kind_unsupported",
                reason: "IDA MCP integration admits executable inputs, not analysis databases. Select the original input binary.",
                diagnostics,
            };
        if (target.format === "raw-binary")
            return {
                status: "unsupported",
                code: "target_format_unsupported",
                reason: "IDA does not admit headerless raw binaries. Open the target with Ghidra and supply architecture and entry_point.",
                diagnostics,
            };
        return target.format === "mach-o-universal"
            ? {
                status: "unknown",
                code: null,
                reason: "IDA mode has not been resolved, so universal Mach-O slice identity is unknown.",
                diagnostics,
            }
            : { status: "supported", code: null, reason: null, diagnostics };
    }
    async inspectTargetSupportWithOptions(target, options) {
        const base = this.inspectTargetSupport(target);
        if (base.status === "unsupported" || target.format !== "mach-o-universal")
            return base;
        // Attached identity is the recorded whole-input digest, which every slice
        // of a universal file shares, so it cannot prove the GUI loaded the slice
        // admission selected. Headless mode thins that slice into its own input.
        const config = await this.#configuration(options);
        if (!config.ok)
            return {
                status: "unknown",
                code: null,
                reason: "IDA mode could not be resolved from the registration.",
                diagnostics: base.diagnostics,
            };
        if (config.value.mode === "attached")
            return {
                status: "unsupported",
                code: "target_format_unsupported",
                reason: `Attached IDA records only the whole-file digest of a universal Mach-O, so REA cannot verify that the open database is its ${target.architecture} slice. Extract that slice with lipo -thin and open the thin file in both IDA and REA, or use headless mode.`,
                diagnostics: { ...base.diagnostics, mode: "attached" },
            };
        return {
            status: "supported",
            code: null,
            reason: null,
            diagnostics: base.diagnostics,
        };
    }
    async resolveAnalysisProfile(target, options) {
        if (options?.signal?.aborted === true)
            return err(new AnalysisCancelledError("ida:profile", {
                cause: options.signal.reason,
            }));
        const config = await this.#configuration(options);
        if (!config.ok)
            return config;
        const profile = createAnalysisProfile(IDA_PROVIDER_IDENTITY, {
            version_scope: "rea-ida-adapter",
            engine_version: null,
            upstream_distribution_version: null,
            mode: config.value.mode,
            compatibility_profile: config.value.protocol === "native"
                ? "native-ida-mcp"
                : config.value.mode === "attached"
                    ? "legacy-1.4"
                    : "database-supervisor",
            database_revision: null,
            cache_policy: "live",
            registration_digest: idaRegistrationDigest(config.value),
        });
        if (options?.scope !== undefined)
            this.#registrationByScope.delete(options.scope);
        const registration = config.value;
        const createClient = (requestedTarget, requestedProfile) => isDeepStrictEqual(requestedTarget, target) &&
            analysisProfilesEqual(requestedProfile, profile)
            ? this.#createBoundClient(registration, target, profile)
            : this.#unboundClient("IDA client factory received a target or profile different from the resolved binding.");
        return ok({
            profile,
            createClient,
        });
    }
    createClient(_target, _profile) {
        return this.#unboundClient("IDA client creation requires the provider-owned selected profile binding.");
    }
    async #configuration(options) {
        const scope = options?.scope;
        if (scope?.active === true) {
            const existing = this.#registrationByScope.get(scope);
            if (existing !== undefined)
                return existing;
        }
        const signal = options?.signal;
        const pending = this.config.idaMcpConfigPath === undefined
            ? Promise.resolve(readIdaConfigurationNotConfigured())
            : readIdaConfiguration(this.config.idaMcpConfigPath, {
                ...(signal === undefined ? {} : { signal }),
                resourceScope: options?.resourceScope ?? this.#inspectionOwner,
            });
        if (scope?.active === true)
            this.#registrationByScope.set(scope, pending);
        const registration = await pending;
        return registration;
    }
    #regexLimitation() {
        return launchRegexMatchingLimitation(this.config.regexMatchingDeadline, this.config.regexWorkerHeapRequest);
    }
    #createBoundClient(config, target, profile) {
        return new IdaSessionClient(config, target, this.connectionFactory(config, this.environment), profile, this.config);
    }
    #unboundClient(reason) {
        const error = idaConfigurationError(reason);
        return {
            execute: async () => err(error),
            close: async () => ok(null),
        };
    }
}
const readIdaConfigurationNotConfigured = () => err(idaConfigurationError("Set REA_IDA_MCP_CONFIG to an upstream IDA MCP JSON registration; see docs/ida-provider.md."));
