import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, SDK_IDENTITY, compactPresentationForMcpInputSchemaProfile, init_identity, init_mcpInputSchemaProfile } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { init_jsonValue, init_result, jsonObjectSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { init_analysisErrorProjection, projectAnalysisError } from "./analysisErrorProjection-DCiob2UF.js";
import { init_toolOutputSchemaPrimitives, providerCapabilitySet } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { SQLITE_PROVIDER_IDENTITY, init_sqliteDatabase } from "./cutterToolContracts-QHLtCeq9.js";
import { init_logger, silentLogger } from "./logger-CYsWF45U.js";
import { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath } from "./CurrentEntrypointPath-m7QCIVN0.js";
import { createCatalogIdentity, init_catalogIdentity } from "./catalogIdentity-CzaLY8eV.js";
import { init_toolContracts, toolContract } from "./toolContracts-DnpaQ4H2.js";
import { directAnalysisCleanupFailure, init_DirectAnalysisCleanup, withSessionCleanup } from "./DirectAnalysisCleanup-W8e1kyLr.js";
import { init_BinarySessionStatus, providerCapabilitySets } from "./BinarySessionStatus-_76Rn7pT.js";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { satisfies } from "semver";

//#region dist/serverIdentity.js
var packageRoot, createServerIdentity;
function init_serverIdentity() {
	return (init_serverIdentity = __esmMin((() => {
		init_identity();
		packageRoot = () => {
			const moduleDirectory = dirname(fileURLToPath(new URL("../serverIdentity.js", import.meta.url).href));
			return basename(moduleDirectory) === "src" && basename(dirname(moduleDirectory)) === "dist" ? resolve(moduleDirectory, "../..") : resolve(moduleDirectory, "..");
		};
		createServerIdentity = (input) => {
			const catalog = input.catalog;
			const serverPath = input.commandPath || undefined;
			const reasons = [];
			if (input.expected?.package_version !== undefined && input.expected.package_version !== PRODUCT_IDENTITY.packageVersion) reasons.push("package_version_mismatch");
			if (input.expected?.catalog_digest !== undefined && input.expected.catalog_digest !== catalog.digests.combined_sha256) reasons.push("catalog_digest_mismatch");
			if (input.expected?.server_path !== undefined && serverPath !== undefined && resolve(input.expected.server_path) !== serverPath) reasons.push("registration_path_mismatch");
			const observedExpectation = input.expected !== undefined && Object.values(input.expected).some((value) => value !== undefined);
			const pathComparable = input.expected?.server_path === undefined || serverPath !== undefined;
			return {
				package: {
					name: PRODUCT_IDENTITY.packageName,
					version: PRODUCT_IDENTITY.packageVersion,
					root_path: packageRoot(),
					build_commit: process.env.REA_BUILD_COMMIT ?? null
				},
				server: {
					name: PRODUCT_IDENTITY.mcpServerKey,
					version: PRODUCT_IDENTITY.packageVersion,
					started_at: input.startedAt,
					command_path: serverPath ?? null
				},
				sdk: SDK_IDENTITY,
				negotiated_protocol_version: input.protocolVersion ?? null,
				client: input.client === undefined ? null : {
					name: input.client.name,
					version: input.client.version
				},
				skill: {
					name: PRODUCT_IDENTITY.skillName,
					expected_version: PRODUCT_IDENTITY.skillVersion
				},
				catalog: {
					counts: catalog.counts,
					digests: catalog.digests
				},
				protocol_features: {
					progress: true,
					cancellation: true,
					elicitation: false
				},
				alignment: {
					state: reasons.length > 0 ? "mcp_server_restart_required" : observedExpectation && pathComparable ? "aligned" : "unknown",
					reasons,
					remediation: reasons.length > 0 ? "Restart the registered MCP server/client, then compare identity again." : observedExpectation && pathComparable ? null : input.expected?.server_path !== undefined && serverPath === undefined ? "The server entrypoint path is unavailable, so registration identity cannot be compared." : "Supply expected package, catalog, or registration identity to compare the live server."
				}
			};
		};
	})))();
}

//#endregion
//#region dist/application/sqlite/SqliteDatabaseCapability.js
var SQLITE_RUNTIME_REQUIREMENT, sqliteDatabaseCapability;
function init_SqliteDatabaseCapability() {
	return (init_SqliteDatabaseCapability = __esmMin((() => {
		init_toolContracts();
		init_sqliteDatabase();
		SQLITE_RUNTIME_REQUIREMENT = "SQLite inspection requires Node.js 24.x >=24.15 or 26+ with the native DatabaseSync.limits API. Other REA features retain their published runtime requirements. The inspection worker verifies the API before querying the snapshot.";
		sqliteDatabaseCapability = (nodeVersion) => {
			const contract = toolContract("inspect_sqlite_database");
			const facts = {
				operation: contract.name,
				provider: SQLITE_PROVIDER_IDENTITY,
				effects: {
					mutatesArtifact: contract.effects.mutatesTarget,
					launchesProcess: contract.effects.launchesProcess,
					mayShowUi: contract.effects.changesUiState,
					mayAccessNetwork: contract.effects.accessesNetwork,
					mayWriteFilesystem: contract.effects.writesFilesystem,
					changesPermissions: false,
					requiresRoot: false
				},
				limitations: [SQLITE_RUNTIME_REQUIREMENT]
			};
			return satisfies(nodeVersion, "^24.15.0 || >=26.0.0") ? {
				...facts,
				available: true,
				reason: null
			} : {
				...facts,
				available: false,
				reason: SQLITE_RUNTIME_REQUIREMENT,
				availabilityCode: "unsupported_version"
			};
		};
	})))();
}

//#endregion
//#region dist/application/DirectAnalysisStatus.js
var runSessionStatus;
function init_DirectAnalysisStatus() {
	return (init_DirectAnalysisStatus = __esmMin((() => {
		init_analysisErrorProjection();
		init_jsonValue();
		init_serverIdentity();
		init_logger();
		init_toolOutputSchemaPrimitives();
		init_BinarySessionStatus();
		init_SqliteDatabaseCapability();
		init_CurrentEntrypointPath();
		init_catalogIdentity();
		init_mcpInputSchemaProfile();
		init_DirectAnalysisCleanup();
		init_result();
		runSessionStatus = async (dependencies, logger = silentLogger) => {
			const config = dependencies.readConfiguration();
			if (!config.ok) return { error: projectAnalysisError(config.error) };
			const session = await dependencies.createBinarySession(config.value, logger);
			return withSessionCleanup(session, async () => {
				const status = jsonObjectSchema.parse(await session.status());
				return {
					...status,
					capabilities: [...providerCapabilitySet.array().parse(status.capabilities), ...providerCapabilitySets([sqliteDatabaseCapability(process.versions.node)])],
					server_identity: createServerIdentity({
						startedAt: new Date().toISOString(),
						commandPath: CURRENT_ENTRYPOINT_PATH,
						catalog: createCatalogIdentity(compactPresentationForMcpInputSchemaProfile(config.value.mcpInputSchemaProfile), config.value.mcpOutputSchemaProfile ?? "full")
					})
				};
			}, (status, cleanup) => directAnalysisCleanupFailure(ok(status), cleanup));
		};
	})))();
}

//#endregion
init_DirectAnalysisStatus();
export { runSessionStatus };