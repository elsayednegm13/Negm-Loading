import { __esmMin, __exportAll } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, init_identity } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, err, init_analysisErrorBase, init_analysisErrorCore, init_jsonSerialization, init_result, jsonByteLength, jsonParts, ok } from "./jsonLines-Gf10X4s1.js";
import { ArtifactReaderFailure, RegularFileChangedError, RegularFileCleanupFailure, init_ArtifactReader, init_OwnedRegularFile, init_RegularFile } from "./ArtifactReader-PV1DaSaC.js";
import { JSON_INPUT_RESOURCE_REMEDIATION, init_JsonInputFile, init_OwnedJsonInput, init_Utf8JsonInput, nativeJsonParseRequiredBytes, parseUtf8Json, sealOwnedJsonInput } from "./JsonFiles-CQsLHX3a.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { init_RegularFileRead, readRegularFile, withRegularFile } from "./RegularFileRead-4snB6-IE.js";
import { ArtifactFileCleanupFailure, bindArtifactFileCleanup, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { init_readFileHandleChunks, readFileHandleChunks } from "./readArtifactFileChunks-C0neyJLE.js";
import { init_StreamBytes, streamChunkToBuffer } from "./ArtifactPaths-BSpMttuG.js";
import { SafeOutputTree, SafeOutputTreeCreationFailure, init_SafeOutputTree, init_SafeOutputTreeAdmission, init_SafeOutputTreeCreationFailure, outputDirectoryAdmissionRefusal } from "./SafeOutputTree-C8GFqDva.js";
import { EnvironmentStateStore, init_environmentState, init_environmentStateStore, prepareServedState, servedCatalog } from "./environmentState-UIc1qofA.js";
import { environmentToolAnswer, init_environmentToolAnswer } from "./environmentToolAnswer-Bq51eUGF.js";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join } from "node:path";
import { getHeapStatistics } from "node:v8";
import { mkdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { PACKAGE_METADATA } from "../generatedPackageMetadata.js";

//#region dist/application/environment/environmentBundle.js
var ENVIRONMENT_EXPORT_OPERATION, BUNDLE_BASE_IMAGE, BUNDLE_MCP_PORT, BUNDLE_TARBALL_NAME, BUNDLE_NAME, BUNDLE_NAME_MAX_LENGTH, WINDOWS_RESERVED_NAME, isPortableBundleName, registryPackageSource, nameError, reservedNameError, installLine, READINESS_PROBE_LAYER, bundleDockerfile, servedCheck, pythonLiteral, bundleVerifier, bundleSmokeTask, packageSourceText, servedHere, bundleReadme, planEnvironmentBundle;
function init_environmentBundle() {
	return (init_environmentBundle = __esmMin((() => {
		init_identity();
		init_analysisErrorCore();
		init_result();
		init_environmentState();
		init_environmentToolAnswer();
		init_environmentStateStore();
		ENVIRONMENT_EXPORT_OPERATION = "environment-export";
		BUNDLE_BASE_IMAGE = `node:${PACKAGE_METADATA.pinnedNodeVersion}-bookworm-slim`;
		BUNDLE_MCP_PORT = 18765;
		BUNDLE_TARBALL_NAME = "rea-agents.tgz";
		BUNDLE_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
		BUNDLE_NAME_MAX_LENGTH = 64;
		WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/u;
		isPortableBundleName = (name) => BUNDLE_NAME.test(name) && name.length <= BUNDLE_NAME_MAX_LENGTH && !WINDOWS_RESERVED_NAME.test(name);
		registryPackageSource = () => ({
			kind: "registry",
			specifier: PRODUCT_IDENTITY.registrationPackageSpecifier
		});
		nameError = (name) => new AnalysisInputError(ENVIRONMENT_EXPORT_OPERATION, { userMessage: `The bundle name ${JSON.stringify(name)} is not a portable kebab-case label of at most ${String(BUNDLE_NAME_MAX_LENGTH)} characters.` }, [{
			path: ["name"],
			reason: "invalid_format",
			expected: BUNDLE_NAME.source,
			message: "The bundle name is the env folder and env id; use lowercase letters, digits and single hyphens, excluding Windows device names."
		}]);
		reservedNameError = (name) => new AnalysisInputError(ENVIRONMENT_EXPORT_OPERATION, { userMessage: `The bundle name ${JSON.stringify(name)} is a device name Windows reserves, so it cannot name the env folder; choose another name.` }, [{
			path: ["name"],
			reason: "invalid_value",
			message: "con, prn, aux, nul, com1-com9 and lpt1-lpt9 are reserved file names on Windows."
		}]);
		installLine = (source) => source.kind === "registry" ? `RUN npm install -g --ignore-scripts --no-fund --no-audit ${source.specifier}` : `COPY ${BUNDLE_TARBALL_NAME} /tmp/\nRUN npm install -g --ignore-scripts --no-fund --no-audit /tmp/${BUNDLE_TARBALL_NAME} && rm /tmp/${BUNDLE_TARBALL_NAME}`;
		READINESS_PROBE_LAYER = "RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*";
		bundleDockerfile = (source) => [
			`FROM ${BUNDLE_BASE_IMAGE}`,
			`ENV MCP_HOST=0.0.0.0`,
			`ENV MCP_PORT=${String(BUNDLE_MCP_PORT)}`,
			READINESS_PROBE_LAYER,
			installLine(source),
			"COPY --chown=node:node manifest.json evidence.json /env/",
			"USER node",
			"CMD [\"rea\",\"environment-serve\",\"/env/manifest.json\",\"--evidence\",\"/env/evidence.json\"]",
			""
		].join("\n");
		servedCheck = (tools, answer) => {
			for (const { tool } of tools) {
				if (tool.method !== "GET" || tool.params.length > 0) continue;
				const answered = answer(tool, {});
				if (answered.ok) return {
					tool: tool.name,
					recordOrdinal: answered.value.replay.record_ordinal,
					status: answered.value.status
				};
			}
			return null;
		};
		pythonLiteral = (value) => value === null ? "None" : JSON.stringify(value);
		bundleVerifier = (plan) => [
			`"""Checks the environment, ${plan.state.served ? "served from the state the capture observed" : "served by replay because the state is unavailable"}, through its MCP endpoint: the tool count and one answered status."""`,
			"import json",
			"",
			"from mcp import ClientSession",
			"from mcp.client.streamable_http import streamable_http_client",
			"",
			`TOOL_COUNT = ${String(plan.toolCount)}`,
			`TOOL = ${pythonLiteral(plan.check?.tool ?? null)}`,
			`EXPECTED_STATUS = ${pythonLiteral(plan.check?.status ?? null)}`,
			"",
			"",
			"def answered_status(result):",
			"    \"\"\"The status member of a tool result, structured or from its text content.\"\"\"",
			"    data = result.structuredContent",
			"    if data is None:",
			"        text = \"\".join(getattr(part, \"text\", \"\") for part in result.content)",
			"        data = json.loads(text) if text else {}",
			"    return data.get(\"status\") if isinstance(data, dict) else None",
			"",
			"",
			"async def verify(mcp_url):",
			"    async with streamable_http_client(mcp_url) as (read, write, _):",
			"        async with ClientSession(read, write) as session:",
			"            await session.initialize()",
			"            listed = await session.list_tools()",
			"            result = await session.call_tool(TOOL, {}) if TOOL is not None else None",
			"    count = len(listed.tools)",
			"    passed = count == TOOL_COUNT",
			"    description = f\"listed {count} tools, expected {TOOL_COUNT}\"",
			"    if result is not None:",
			"        status = None if result.isError else answered_status(result)",
			"        passed = passed and not result.isError and status == EXPECTED_STATUS",
			"        description += f\"; {TOOL} answered status {status!r}, expected {EXPECTED_STATUS!r}\"",
			"    else:",
			"        description += \"; no GET tool without path parameters answers without arguments\"",
			"    print(f\"serve: {description}\")",
			"    return [{\"id\": \"serve\", \"result\": passed, \"description\": description}]",
			""
		].join("\n");
		bundleSmokeTask = (name) => `${JSON.stringify([{
			id: "env",
			type: "deploy_env",
			env_id: name,
			sandbox_type: "local"
		}, {
			id: "serve",
			type: "env_outcome_verifier",
			env_id: name,
			file_artifact_id: `check_${name}`,
			verifier_id: "serve"
		}], null, 2)}\n`;
		packageSourceText = (source) => source.kind === "registry" ? `\`${source.specifier}\` from the npm registry` : `the packed tarball \`${BUNDLE_TARBALL_NAME}\` copied beside the Dockerfile`;
		servedHere = (source, plan) => {
			const { state } = plan;
			return state.served ? `This bundle serves from the state: the export derived it as Evidence
\`${state.evidence_id}\`, and the server serves ${String(plan.toolCount)} of the manifest's
${String(source.manifest.tools.length)} tools.` : `This bundle serves replay: the server serves all ${String(plan.toolCount)} manifest tools
from their recordings because the state is unavailable
(\`${state.code}\`: ${state.message}).`;
		};
		bundleReadme = (source, plan) => {
			const { manifest } = source;
			const check = plan.check === null ? "no served GET tool without path parameters answers without arguments, so the verifier checks the tool count only" : `calls \`${plan.check.tool}\` without arguments and checks the call succeeds with \`status\` ${String(plan.check.status)}, the status of record ${String(plan.check.recordOrdinal)} its answer carries`;
			return `# ${plan.name}

An agent environment exported by REA from one retained ${source.captureKind === "browser-scenario" ? "browser scenario capture" : "web network capture"}.
Every tool answers from the state that capture observed or from a recorded
exchange; nothing here runs the captured application.

The bundle contains captured application content. Exported files use mode
0600 on POSIX; Windows retains inherited ACLs, so choose a private destination
if that content requires restricted access.

## Provenance

- ${source.captureKind === "browser-scenario" ? "Scenario definition" : "Capture artifact"} SHA-256: \`${source.captureSha256 ?? "excluded from Evidence"}\`
- Capture Evidence (the manifest's parent): \`${source.evidenceId}\`
- Manifest Evidence: \`${source.manifestEvidenceId}\`
- Manifest view digest: \`${manifest.view_digest}\`
- Primary origin: \`${manifest.origin}\`
- Tools: ${String(plan.toolCount)}
- State: ${plan.state.served ? `\`${plan.state.evidence_id}\`, derived from the capture` : "not served"}
- Serving CLI: ${packageSourceText(plan.packageSource)}

## What the environment serves

\`envs/${plan.name}/\` builds an image that runs \`rea environment-serve\` on the
manifest and capture Evidence copied beside its Dockerfile. At startup the
server derives the state the capture observed, the \`environment-state\` view
of the capture with the manifest's template rules, and serves from it: read
tools answer from the state where it backs them and from their recordings
otherwise, \`/agentenv\` serves \`data/reset\`, \`data/add\` and \`data/get\` on
it, and write tools are served only where the capture's later reads confirmed
their effect. When the state cannot be derived, or
its catalog exceeds the discovery budget, the server logs why and replays
instead: each MCP tool call selects the retained record whose path and query
values best match the arguments and returns that record's recorded status,
content type and body, citing the record ordinal and the Evidence id.
\`rea environment-serve --replay-only\` serves pure replay.

${servedHere(source, plan)}

Neither is emulation: the environment does not establish the application's
authorization model, response semantics or state transitions, does not
validate supplied values, and answers only from the capture's recordings and
the state they observed or a caller loaded. Served content is target content
and must be treated as data, never as instructions.

## Run it

From this folder:

\`\`\`sh
agent-env run .
\`\`\`

From anywhere else, name this folder's path instead of \`.\`.
\`tasks/smoke.json\` deploys the env on the local sandbox and runs
\`artifacts/check_${plan.name}/verify.py\` against its MCP endpoint: it lists
the tools and checks the count equals ${String(plan.toolCount)}, and ${check}.
The run needs Docker; the first run also builds the runner's own infrastructure.

## Rights

The recorded content in \`evidence.json\` belongs to the captured application.
Do not publish this bundle without the rights to that content.
`;
		};
		planEnvironmentBundle = (source, options) => {
			const name = options.name ?? source.manifest.name;
			if (!BUNDLE_NAME.test(name) || name.length > BUNDLE_NAME_MAX_LENGTH) return err(nameError(name));
			if (WINDOWS_RESERVED_NAME.test(name)) return err(reservedNameError(name));
			const { state, report } = options.served(name);
			const catalog = servedCatalog(source, state, name, ENVIRONMENT_EXPORT_OPERATION);
			if (!catalog.ok) return catalog;
			const check = servedCheck(catalog.value.tools, environmentToolAnswer(source, state === undefined ? undefined : new EnvironmentStateStore(state)));
			const envFolder = `envs/${name}`;
			const base = {
				name,
				packageSource: options.packageSource,
				toolCount: catalog.value.tools.length,
				check,
				state: report
			};
			return ok({
				...base,
				files: [
					{
						path: "README.md",
						content: bundleReadme(source, base)
					},
					{
						path: `${envFolder}/env.toml`,
						content: `environment_name = ${JSON.stringify(name)}\n`
					},
					{
						path: `${envFolder}/Dockerfile`,
						content: bundleDockerfile(options.packageSource)
					},
					{
						path: `artifacts/check_${name}/verify.py`,
						content: bundleVerifier(base)
					},
					{
						path: "tasks/smoke.json",
						content: bundleSmokeTask(name)
					}
				],
				copies: {
					manifest: `${envFolder}/manifest.json`,
					evidence: `${envFolder}/evidence.json`,
					tarball: options.packageSource.kind === "tarball" ? `${envFolder}/${BUNDLE_TARBALL_NAME}` : null
				}
			});
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentEvidenceBytes.js
var evidenceFileBytes;
function init_environmentEvidenceBytes() {
	return (init_environmentEvidenceBytes = __esmMin((() => {
		init_jsonSerialization();
		evidenceFileBytes = (evidence, admit) => {
			const size = jsonByteLength(evidence) + 1;
			admit?.(size);
			const bytes = Buffer.allocUnsafe(size);
			let offset = 0;
			for (const part of jsonParts(evidence)) offset += bytes.write(part, offset);
			if (offset !== bytes.length - 1) throw new Error("Evidence serialized to a different length than measured");
			bytes[offset] = 10;
			return bytes;
		};
	})))();
}

//#endregion
//#region dist/application/environment/environmentBundleWrite.js
/** Read the admitted tarball, attributing host failures to the source. */
async function* tarballChunks(source) {
	try {
		yield* readFileHandleChunks(source.handle);
	} catch (cause) {
		if (isHostSystemFailure(cause)) throw new BundleFileHostFailure(source.path, "reading", cause);
		throw cause;
	}
}
var BundleFileHostFailure, isHostSystemFailure, writingBundleFile, writeBytes, bundleTarballDigest, writeTarball, writeBundleFiles, packageTarballRefusal, withBundleTarball, writeEnvironmentBundle;
function init_environmentBundleWrite() {
	return (init_environmentBundleWrite = __esmMin((() => {
		init_analysisErrorCore();
		init_AnalysisCleanupLease();
		init_ArtifactFileOperation();
		init_OwnedRegularFile();
		init_readFileHandleChunks();
		init_StreamBytes();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_SafeOutputTree();
		init_SafeOutputTreeAdmission();
		init_SafeOutputTreeCreationFailure();
		init_RegularFile();
		init_RegularFileRead();
		init_environmentBundle();
		BundleFileHostFailure = class extends Error {
			path;
			operation;
			constructor(path, operation, cause) {
				super(`${cause.message}, ${operation} ${path}`, { cause });
				this.path = path;
				this.operation = operation;
			}
		};
		isHostSystemFailure = (cause) => cause instanceof Error && !(cause instanceof ArtifactReaderFailure) && typeof Reflect.get(cause, "code") === "string";
		writingBundleFile = async (directory, relative, write) => {
			try {
				return await write();
			} catch (cause) {
				if (isHostSystemFailure(cause) && Reflect.get(cause, "path") === undefined) throw new BundleFileHostFailure(join(directory, relative), "writing", cause);
				throw cause;
			}
		};
		writeBytes = async (tree, directory, relative, bytes) => {
			const written = await writingBundleFile(directory, relative, () => tree.write(relative, Readable.from([bytes]), {
				bytes: bytes.length,
				sha256: createHash("sha256").update(bytes).digest("hex")
			}));
			return {
				path: written.relativePath,
				bytes: written.bytesWritten
			};
		};
		bundleTarballDigest = async (source) => {
			const hash = createHash("sha256");
			let observed = 0;
			for await (const chunk of tarballChunks(source)) {
				const bytes = streamChunkToBuffer(chunk);
				observed += bytes.length;
				if (observed > source.size) throw new RegularFileChangedError(source.path);
				hash.update(bytes);
			}
			if (observed !== source.size) throw new RegularFileChangedError(source.path);
			return hash.digest("hex");
		};
		writeTarball = async (tree, directory, relative, source) => {
			const sha256 = await bundleTarballDigest(source);
			const written = await writingBundleFile(directory, relative, () => tree.write(relative, Readable.from(tarballChunks(source)), {
				bytes: source.size,
				sha256
			}));
			return {
				path: written.relativePath,
				bytes: written.bytesWritten
			};
		};
		writeBundleFiles = async (input, plan, tarball) => {
			const resources = new ArtifactResourceScope();
			let tree;
			let written;
			let outcome;
			try {
				if (input.exclusiveDestination !== true) await mkdir(dirname(input.directory), {
					recursive: true,
					mode: 448
				});
				try {
					tree = await SafeOutputTree.create(input.directory, process.platform, { acceptExistingEmpty: input.exclusiveDestination !== true });
				} catch (cause) {
					if (cause instanceof SafeOutputTreeCreationFailure) tree = cause.tree;
					throw cause;
				}
				written = [];
				for (const file of plan.files) written.push(await writeBytes(tree, input.directory, file.path, Buffer.from(file.content)));
				written.push(await writeBytes(tree, input.directory, plan.copies.manifest, input.manifest.bytes));
				written.push(await writeBytes(tree, input.directory, plan.copies.evidence, input.evidence.bytes));
				if (plan.copies.tarball !== null && tarball !== undefined) written.push(await writeTarball(tree, input.directory, plan.copies.tarball, tarball));
				await tree.commit();
				outcome = {
					kind: "completed",
					files: written
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
			}
			const owner = tree;
			if (owner !== undefined) {
				const closed = await resources.release({
					kind: "lease",
					resource: input.directory,
					lease: { release: () => owner.closeHandles() }
				});
				if (closed.kind === "failed") throw resources.cleanupFailure(outcome, [closed]);
			}
			if (outcome.kind === "failed") {
				if (owner?.published === true && written !== undefined) return written;
				throw outputDirectoryAdmissionRefusal(ENVIRONMENT_EXPORT_OPERATION, "directory", outcome.cause);
			}
			return outcome.files;
		};
		packageTarballRefusal = (path, cause) => new AnalysisInputError(ENVIRONMENT_EXPORT_OPERATION, {
			cause,
			userMessage: `${path} must name a readable regular package tarball.`
		}, [{
			path: ["package_tarball"],
			reason: "invalid_value",
			message: "The package tarball must be an existing regular file."
		}]);
		withBundleTarball = async (path, use) => {
			const resources = new ArtifactResourceScope();
			let admitted = false;
			try {
				return await withRegularFile(path, async (handle, state) => {
					admitted = true;
					return use({
						path,
						handle,
						size: state.size
					});
				}, { resources });
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw new ArtifactFileCleanupFailure(cause, AnalysisCleanupLease.forCloseOwner(cause.owner, path));
				if (!admitted && cause instanceof Error && "code" in cause) {
					if (cause.code === "EACCES" || cause.code === "EPERM") throw new AnalysisAccessDeniedError(ENVIRONMENT_EXPORT_OPERATION, path, cause.code, { cause });
					if ([
						"ENOENT",
						"ENOTDIR",
						"ENAMETOOLONG",
						"EISDIR",
						"ENOTFILE"
					].includes(String(cause.code))) throw packageTarballRefusal(path, cause);
				}
				throw cause;
			}
		};
		writeEnvironmentBundle = (input, plan) => plan.packageSource.kind === "tarball" ? withBundleTarball(plan.packageSource.path, (tarball) => writeBundleFiles(input, plan, tarball)) : writeBundleFiles(input, plan);
	})))();
}

//#endregion
//#region dist/application/environment/environmentExport.js
var environmentExport_exports = /* @__PURE__ */ __exportAll({
	environmentExportEvidenceFile: () => environmentExportEvidenceFile,
	exportEnvironmentBundle: () => exportEnvironmentBundle,
	readEnvironmentExportFile: () => readEnvironmentExportFile,
	readEnvironmentExportInputs: () => readEnvironmentExportInputs
});
var inputError, systemCode, hostWriteFailure, hostReadFailure, hostSystemError, accessDeniedError, hostFailurePath, NOT_A_FILE_CODES, headroomRefusal, environmentExportEvidenceFile, environmentExportFile, readEnvironmentExportFile, readEnvironmentExportInputs, packageSourceValue, changedArtifact, readerFailureError, packageTarballBytes, exportEnvironmentBundle;
function init_environmentExport() {
	return (init_environmentExport = __esmMin((() => {
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_analysisErrorCore();
		init_environmentEvidenceBytes();
		init_result();
		init_RegularFile();
		init_ArtifactFileOperation();
		init_AnalysisCleanupLease();
		init_ArtifactResourceScope();
		init_OwnedRegularFile();
		init_ArtifactReader();
		init_environmentBundleWrite();
		init_OwnedJsonInput();
		init_JsonInputFile();
		init_RegularFileRead();
		init_Utf8JsonInput();
		init_environmentBundle();
		init_environmentState();
		inputError = (operation, issue, userMessage) => new AnalysisInputError(operation, { userMessage }, [issue]);
		systemCode = (cause) => cause instanceof Error && "code" in cause && typeof cause.code === "string" ? cause.code : undefined;
		hostWriteFailure = (directory) => ({
			userMessage: `Writing the environment bundle to ${directory} failed on the host; the details name the cause and, when it failed on one bundle file, that file.`,
			remediationAction: `Resolve the reported host failure (for example, choose a shorter destination path or free disk space). Inspect ${directory} and remove any partial output this export wrote before retrying, since a retry refuses a non-empty directory.`,
			diagnostics: { output_directory: directory }
		});
		hostReadFailure = (source, directory) => ({
			userMessage: `Reading ${source} failed on the host while writing the environment bundle to ${directory}; the details name the cause.`,
			remediationAction: `Resolve the reported host failure reading ${source}. Inspect ${directory} and remove any partial output this export wrote before retrying, since a retry refuses a non-empty directory.`,
			diagnostics: { output_directory: directory }
		});
		hostSystemError = (cause) => {
			const seen = new Set([cause]);
			let current = cause.cause;
			while (current instanceof Error && !seen.has(current)) {
				if (systemCode(current) !== undefined) return current;
				seen.add(current);
				current = current.cause;
			}
			return undefined;
		};
		accessDeniedError = (cause, path, diagnostics, access = "read", operation = ENVIRONMENT_EXPORT_OPERATION) => {
			const seen = new Set();
			let current = cause;
			while (current instanceof Error && !seen.has(current)) {
				seen.add(current);
				if (current instanceof BundleFileHostFailure) access = current.operation === "reading" ? "read" : "write";
				const code = systemCode(current);
				if (code === "EACCES" || code === "EPERM") {
					const options = {
						cause,
						...diagnostics === undefined ? {} : { diagnostics },
						...cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? { cleanup: cause.cleanup } : {}
					};
					const error = access === "read" ? new AnalysisAccessDeniedError(operation, path, code, options) : new AnalysisOutputError(operation, `Host filesystem permissions denied write access: ${path}`, {
						...options,
						userMessage: `Host filesystem permissions denied writing the environment bundle at ${path}.`,
						remediationAction: "Check write access or select a writable destination. Inspect the output directory for partial output before retrying; export refuses a non-empty directory.",
						diagnostics: {
							...diagnostics,
							path,
							system_code: code,
							boundary: "filesystem-write"
						}
					});
					bindArtifactFileCleanup(cause, error);
					return error;
				}
				current = current.cause;
			}
			return undefined;
		};
		hostFailurePath = (cause) => {
			const seen = new Set();
			let current = cause;
			while (current instanceof Error && !seen.has(current)) {
				seen.add(current);
				if (current instanceof BundleFileHostFailure) return current.path;
				const path = Reflect.get(current, "path");
				if (systemCode(current) !== undefined && typeof path === "string") return isAbsolute(path) ? path : undefined;
				current = current.cause;
			}
			return undefined;
		};
		NOT_A_FILE_CODES = new Set([
			"ENOENT",
			"EISDIR",
			"ENOTFILE",
			"ENOTDIR",
			"ENAMETOOLONG"
		]);
		headroomRefusal = (operation, path, inputBytes) => {
			const heap = getHeapStatistics();
			const requiredBytes = nativeJsonParseRequiredBytes(inputBytes, true);
			return requiredBytes <= heap.total_available_size ? undefined : new AnalysisResourceConstraintError(operation, "memory", "Insufficient heap headroom to read, parse and seal the complete JSON file", {
				input_path: path,
				input_file_bytes: inputBytes,
				required_heap_bytes: requiredBytes,
				available_heap_bytes: heap.total_available_size,
				heap_size_limit_bytes: heap.heap_size_limit
			}, { remediationAction: JSON_INPUT_RESOURCE_REMEDIATION });
		};
		environmentExportEvidenceFile = async (role, path, evidence, operation = ENVIRONMENT_EXPORT_OPERATION) => {
			try {
				const bytes = evidenceFileBytes(evidence, (size) => {
					const refused = headroomRefusal(operation, path, size);
					if (refused !== undefined) throw refused;
				});
				return await environmentExportFile(role, path, bytes, operation);
			} catch (cause) {
				if (cause instanceof AnalysisResourceConstraintError) return err(cause);
				throw cause;
			}
		};
		environmentExportFile = async (role, path, bytes, operation = ENVIRONMENT_EXPORT_OPERATION) => {
			const refusal = headroomRefusal(operation, path, bytes.length);
			if (refusal !== undefined) return err(refusal);
			let parsed;
			try {
				parsed = parseUtf8Json(bytes, operation, path);
			} catch (cause) {
				if (cause instanceof AnalysisResourceConstraintError) return err(cause);
				throw cause;
			}
			if (!parsed.ok) return err(inputError(operation, {
				path: [role],
				reason: "invalid_format",
				expected: "JSON",
				message: parsed.error
			}, `${path} is not valid JSON: ${parsed.error}`));
			const snapshot = await sealOwnedJsonInput(parsed.value, operation);
			if (!snapshot.ok) return snapshot;
			return ok({
				path,
				bytes,
				value: snapshot.value
			});
		};
		readEnvironmentExportFile = async (role, path, operation = ENVIRONMENT_EXPORT_OPERATION) => {
			const resources = new ArtifactResourceScope();
			let bytes;
			try {
				bytes = await readRegularFile(path, {
					resources,
					admit: (state) => {
						const refused = headroomRefusal(operation, path, state.size);
						if (refused !== undefined) throw refused;
					}
				});
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) {
					const failure = new ArtifactFileCleanupFailure(cause, AnalysisCleanupLease.forCloseOwner(cause.owner, path));
					const cleanup = new AnalysisOutputError(operation, `Could not confirm closing the ${role} input file.`, {
						cause: failure,
						cleanup: failure.cleanup,
						diagnostics: {
							input_path: path,
							input_role: role
						}
					});
					bindArtifactFileCleanup(failure, cleanup);
					const primary = cause.outcome.kind === "failed" ? cause.outcome.cause : undefined;
					return err(primary instanceof AnalysisError ? analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]) : cleanup);
				}
				if (cause instanceof AnalysisResourceConstraintError) return err(cause);
				if (cause instanceof RegularFileChangedError) return err(inputError(operation, {
					path: [role],
					reason: "invalid_value",
					expected: "one stable regular file snapshot",
					message: `The ${role} file changed while it was read.`
				}, `${path} changed while being read; retry with stable input files.`));
				if (NOT_A_FILE_CODES.has(systemCode(cause) ?? "")) return err(inputError(operation, {
					path: [role],
					reason: "invalid_value",
					message: `The ${role} argument must be a readable file path; inline JSON cannot be exported.`
				}, `${path} could not be read as the ${role} file.`));
				const denied = accessDeniedError(cause, path, undefined, "read", operation);
				if (denied !== undefined) return err(denied);
				throw cause;
			}
			return environmentExportFile(role, path, bytes, operation);
		};
		readEnvironmentExportInputs = async (manifestPath, evidencePath) => {
			const manifest = await readEnvironmentExportFile("manifest", manifestPath);
			if (!manifest.ok) return manifest;
			const evidence = await readEnvironmentExportFile("evidence", evidencePath);
			if (!evidence.ok) return evidence;
			return ok({
				manifest: manifest.value,
				evidence: evidence.value
			});
		};
		packageSourceValue = (source) => source.kind === "registry" ? {
			kind: "registry",
			specifier: source.specifier
		} : {
			kind: "tarball",
			path: source.path
		};
		changedArtifact = (cause) => new AnalysisArtifactChangedError(ENVIRONMENT_EXPORT_OPERATION, cause.path, cause.message, { cause });
		readerFailureError = (cause, directory) => {
			const host = hostSystemError(cause);
			const error = new AnalysisOutputError(ENVIRONMENT_EXPORT_OPERATION, host === undefined ? cause.message : `${cause.message}: ${host.message}`, {
				cause,
				...cause.cleanup !== undefined ? { cleanup: cause.cleanup } : directory === undefined ? {} : host === undefined ? { diagnostics: { output_directory: directory } } : hostWriteFailure(directory)
			});
			bindArtifactFileCleanup(cause, error);
			return error;
		};
		packageTarballBytes = async (path) => {
			try {
				return ok(await withBundleTarball(path, async (tarball) => {
					await bundleTarballDigest(tarball);
					return tarball.size;
				}));
			} catch (cause) {
				if (cause instanceof AnalysisError) return err(cause);
				if (cause instanceof RegularFileChangedError) return err(changedArtifact(cause));
				if (cause instanceof ArtifactReaderFailure) return err(readerFailureError(cause, undefined));
				if (cause instanceof BundleFileHostFailure) return err(packageTarballRefusal(path, cause));
				if (systemCode(cause) !== undefined) return err(packageTarballRefusal(path, cause));
				throw cause;
			}
		};
		exportEnvironmentBundle = async (input) => {
			const packageSource = input.packageTarball === undefined ? registryPackageSource() : {
				kind: "tarball",
				path: input.packageTarball
			};
			const plan = planEnvironmentBundle(input.source, {
				name: input.name,
				packageSource,
				served: (name) => input.served ?? prepareServedState(input.source, input.evidence.value, {
					name,
					operation: "environment-export"
				})
			});
			if (!plan.ok) return plan;
			let files;
			try {
				files = await writeEnvironmentBundle(input, plan.value);
			} catch (cause) {
				if (cause instanceof AnalysisError) return err(cause);
				const denied = accessDeniedError(cause, hostFailurePath(cause) ?? input.directory, { output_directory: input.directory }, cause instanceof BundleFileHostFailure && cause.operation === "reading" ? "read" : "write");
				if (denied !== undefined) return err(denied);
				if (cause instanceof RegularFileChangedError) return err(changedArtifact(cause));
				if (cause instanceof ArtifactReaderFailure) return err(readerFailureError(cause, input.directory));
				if (cause instanceof BundleFileHostFailure || cause instanceof Error && systemCode(cause) !== undefined) return err(new AnalysisOutputError(ENVIRONMENT_EXPORT_OPERATION, cause.message, {
					cause,
					...cause instanceof BundleFileHostFailure && cause.operation === "reading" ? hostReadFailure(cause.path, input.directory) : hostWriteFailure(input.directory)
				}));
				throw cause;
			}
			return ok({
				status: "exported",
				directory: input.directory,
				name: plan.value.name,
				tool_count: plan.value.toolCount,
				evidence_id: input.source.evidenceId,
				manifest_evidence_id: input.source.manifestEvidenceId,
				state: plan.value.state,
				package_source: packageSourceValue(plan.value.packageSource),
				files
			});
		};
	})))();
}

//#endregion
export { ENVIRONMENT_EXPORT_OPERATION, environmentExportEvidenceFile, environmentExport_exports, exportEnvironmentBundle, init_environmentBundle, init_environmentExport, isPortableBundleName, packageTarballBytes, planEnvironmentBundle, registryPackageSource };