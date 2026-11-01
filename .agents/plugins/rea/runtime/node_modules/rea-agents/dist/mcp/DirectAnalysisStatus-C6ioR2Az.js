import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { h as init_CurrentEntrypointPath, l as compactPresentationForMcpInputSchemaProfile, m as CURRENT_ENTRYPOINT_PATH, u as init_mcpInputSchemaProfile } from "./toolSchemaMetadata-C0VxTNwy.js";
import { n as init_result, r as ok } from "./result-Dbqc_peo.js";
import { n as projectAnalysisError, t as init_analysisErrorProjection } from "./analysisErrorProjection-CbRgJX1L.js";
import { n as init_jsonValue, r as jsonObjectSchema } from "./jsonValue-CvnZ7JX6.js";
import { n as init_logger, r as silentLogger } from "./logger-Brcs2SlV.js";
import { Ci as init_catalogIdentity, Ha as init_serverIdentity, Si as createCatalogIdentity, Ti as sqliteDatabaseCapability, Va as createServerIdentity, wi as init_SqliteDatabaseCapability } from "./createServer-CoLFsKLA.js";
import { Ln as init_toolOutputSchemaPrimitives, Rn as providerCapabilitySet } from "./toolOutputSchemaGroups-BS_G8lPZ.js";
import { i as withSessionCleanup, n as init_DirectAnalysisCleanup, t as directAnalysisCleanupFailure } from "./DirectAnalysisCleanup-D2DO7dIp.js";
import { n as init_BinarySessionStatus, r as providerCapabilitySets } from "./BinarySessionStatus-DmMV0LBu.js";

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