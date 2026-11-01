import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, compactPresentationForMcpInputSchemaProfile, init_identity, init_mcpInputSchemaProfile, init_mcpOutputSchemaProfile, init_mcpStartupBudgets, parseMcpInputSchemaProfile, parseMcpOutputSchemaProfile, parseMcpStartupBudgets } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_jsonLines, init_result, jsonLinesErrorRecord, ok } from "./jsonLines-Gf10X4s1.js";
import { CLI_OUTPUT_FORMATS, init_cliOutput, missingCliOutputValueMessage, renderCliDocument } from "./cliOutput-3g9bk55s.js";
import { PROMPT_CONTRACTS, createCatalogIdentity, init_catalogIdentity, init_promptContracts } from "./catalogIdentity-CzaLY8eV.js";
import { TOOL_CONTRACTS, init_toolContracts } from "./toolContracts-DnpaQ4H2.js";
import { MCP_STARTUP_POLICY, init_mcpStartupPolicy, mcpDoctorDeadlineRecovery } from "./mcpStartupPolicy-Bb-Cmg4y.js";
import { resolve } from "node:path";
import { Help, z } from "incur";
import { performance } from "node:perf_hooks";
import { Client, SdkError, SdkErrorCode } from "@modelcontextprotocol/client";
import { StringDecoder } from "node:string_decoder";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

//#region dist/mcpDoctor.js
var OUTPUT_FORMATS, MCP_DOCTOR_OPTIONS, MCP_DOCTOR_ALIAS, MCP_DOCTOR_COMMAND, MCP_DOCTOR_DESCRIPTION, HELP_FLAGS, renderMcpDoctorHelp, runProductionMcpDoctor, OwnedStdioClientTransport, inspectProductionMcpSession, runProductionMcpDoctorCli, compareInventory, inventoryCheck, parseIdentityToolResult, parseOutputArguments, hasHelpInOptionPosition, isOutputFormat, requestOptions, targetFreeEnvironment, catalogIdentityForEnvironment, captureStderr, isRecord, errorMessage, doctorTransportDetail, appliedDoctorBudget;
function init_mcpDoctor() {
	return (init_mcpDoctor = __esmMin((() => {
		init_catalogIdentity();
		init_jsonLines();
		init_cliOutput();
		init_mcpInputSchemaProfile();
		init_mcpOutputSchemaProfile();
		init_promptContracts();
		init_toolContracts();
		init_result();
		init_identity();
		init_mcpStartupBudgets();
		init_mcpStartupPolicy();
		OUTPUT_FORMATS = CLI_OUTPUT_FORMATS;
		MCP_DOCTOR_OPTIONS = z.object({
			format: z.enum(OUTPUT_FORMATS).optional().describe("Output format"),
			json: z.boolean().optional().describe("Emit the report as JSON"),
			fullOutput: z.boolean().optional().describe("Show the full output envelope"),
			help: z.boolean().optional().describe("Show help")
		});
		MCP_DOCTOR_ALIAS = { help: "h" };
		MCP_DOCTOR_COMMAND = "rea mcp doctor";
		MCP_DOCTOR_DESCRIPTION = "Validate MCP server startup and tool listing";
		HELP_FLAGS = new Set(["--help", "-h"]);
		renderMcpDoctorHelp = () => Help.formatCommand(MCP_DOCTOR_COMMAND, {
			description: MCP_DOCTOR_DESCRIPTION,
			hideGlobalOptions: true,
			options: MCP_DOCTOR_OPTIONS,
			alias: MCP_DOCTOR_ALIAS,
			hint: "This entry accepts only the options above."
		});
		runProductionMcpDoctor = async (options) => {
			const parsedBudgets = parseMcpStartupBudgets(options.environment);
			if (!parsedBudgets.ok) return {
				healthy: false,
				adapter: "production-stdio",
				server: null,
				inventory: null,
				identity: null,
				request_flow: {
					tool: "binary_session",
					ok: false
				},
				checks: parsedBudgets.error.settings.map((issue) => ({
					name: issue.setting,
					ok: false,
					detail: issue.constraint
				})),
				diagnostics: {
					stderr: "",
					stderr_bytes: 0,
					stderr_truncated: false
				}
			};
			const catalog = catalogIdentityForEnvironment(options.environment);
			const budget = appliedDoctorBudget(parsedBudgets.value.doctor, options.deadlineMs);
			const budgetMs = budget.milliseconds;
			const deadline = performance.now() + budgetMs;
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(new Error("Production MCP doctor deadline expired")), Math.max(1, Math.ceil(deadline - performance.now())));
			const stderr = captureStderr();
			const transport = new OwnedStdioClientTransport({
				command: options.command,
				args: [...options.args],
				cwd: options.cwd,
				env: targetFreeEnvironment(options.environment),
				stderr: "pipe"
			});
			transport.stderr?.on("data", stderr.append);
			const client = new Client({
				name: "rea-mcp-doctor",
				version: "1"
			});
			let result;
			let cleanupFailure;
			try {
				await client.connect(transport, requestOptions(deadline, controller.signal));
				result = await inspectProductionMcpSession(client, deadline, controller.signal, catalog, budget);
			} catch (cause) {
				result = {
					healthy: false,
					adapter: "production-stdio",
					server: null,
					inventory: null,
					identity: null,
					request_flow: {
						tool: "binary_session",
						ok: false
					},
					checks: [{
						name: "transport",
						ok: false,
						detail: doctorTransportDetail(cause, budget, controller.signal)
					}]
				};
			} finally {
				clearTimeout(timer);
				try {
					await client.close();
				} catch (cause) {
					cleanupFailure = { cause };
				}
				try {
					await transport.close();
				} catch (cause) {
					cleanupFailure = { cause: cleanupFailure === undefined || cleanupFailure.cause === cause ? cause : new AggregateError([cleanupFailure.cause, cause], `MCP client and transport cleanup failed: ${errorMessage(cleanupFailure.cause)}; ${errorMessage(cause)}`) };
				}
			}
			if (cleanupFailure !== undefined) result = {
				...result,
				healthy: false,
				checks: [...result.checks, {
					name: "cleanup",
					ok: false,
					detail: `MCP stdio cleanup failed: ${errorMessage(cleanupFailure.cause)}`
				}]
			};
			return {
				...result,
				diagnostics: stderr.value()
			};
		};
		OwnedStdioClientTransport = class extends StdioClientTransport {
			#closePromise;
			close() {
				this.#closePromise ??= super.close();
				return this.#closePromise;
			}
		};
		inspectProductionMcpSession = async (client, deadline, signal, catalog, budget) => {
			const request = requestOptions(deadline, signal);
			const [tools, prompts] = await Promise.all([client.listTools(undefined, request), client.listPrompts(undefined, request)]);
			const sessionTool = tools.tools.find(({ name }) => name === "binary_session");
			const requestFlow = await client.callTool({
				name: "binary_session",
				arguments: {}
			}, {
				...requestOptions(deadline, signal),
				...sessionTool === undefined ? {} : { toolDefinition: sessionTool }
			}).then(ok, (cause) => err({
				kind: "request-flow",
				detail: doctorTransportDetail(cause, budget, signal)
			}));
			const inventory = {
				tools: compareInventory(TOOL_CONTRACTS.map(({ name }) => name), tools.tools.map(({ name }) => name)),
				prompts: compareInventory(PROMPT_CONTRACTS.map(({ name }) => name), prompts.prompts.map(({ name }) => name))
			};
			const observedIdentity = parseIdentityToolResult(requestFlow.ok ? requestFlow.value.structuredContent : undefined);
			const serverVersion = client.getServerVersion();
			const protocolVersion = client.getNegotiatedProtocolVersion();
			const checks = [
				{
					name: "initialize",
					ok: serverVersion?.name === PRODUCT_IDENTITY.mcpServerKey && serverVersion.version === PRODUCT_IDENTITY.packageVersion && protocolVersion !== undefined,
					detail: `${serverVersion?.name ?? "unknown"}@${serverVersion?.version ?? "unknown"}; protocol=${protocolVersion ?? "unknown"}`
				},
				...Object.entries(inventory).map(([name, comparison]) => inventoryCheck(name, comparison)),
				{
					name: "server-identity",
					ok: observedIdentity.packageVersion === PRODUCT_IDENTITY.packageVersion && observedIdentity.catalogDigest === catalog.digests.combined_sha256,
					detail: `package=${observedIdentity.packageVersion ?? "missing"}; catalog=${observedIdentity.catalogDigest ?? "missing"}`
				},
				{
					name: "request-flow",
					ok: requestFlow.ok && requestFlow.value.isError !== true,
					detail: requestFlow.ok ? "binary_session target-free request" : requestFlow.error.detail
				}
			];
			return {
				healthy: checks.every(({ ok }) => ok),
				adapter: "production-stdio",
				server: {
					name: serverVersion?.name ?? null,
					version: serverVersion?.version ?? null,
					protocol_version: protocolVersion ?? null
				},
				inventory,
				identity: {
					expected_package_version: PRODUCT_IDENTITY.packageVersion,
					observed_package_version: observedIdentity.packageVersion,
					expected_catalog_digest: catalog.digests.combined_sha256,
					observed_catalog_digest: observedIdentity.catalogDigest
				},
				request_flow: {
					tool: "binary_session",
					ok: requestFlow.ok && requestFlow.value.isError !== true
				},
				checks
			};
		};
		runProductionMcpDoctorCli = async (arguments_, input) => {
			const started = performance.now();
			const parsed = parseOutputArguments(arguments_);
			if (!parsed.ok) {
				if (parsed.help) return {
					output: `${renderMcpDoctorHelp()}\n`,
					exitCode: 0
				};
				return {
					output: renderCliDocument(parsed.format === "jsonl" ? jsonLinesErrorRecord({
						code: parsed.code,
						message: parsed.message
					}) : {
						code: parsed.code,
						message: parsed.message
					}, parsed.format, input.stdoutIsTerminal),
					exitCode: 1
				};
			}
			const result = await runProductionMcpDoctor({
				command: process.execPath,
				args: [resolve(input.dispatcherPath), "mcp"],
				cwd: input.packageRoot,
				environment: process.env
			});
			const outputValue = parsed.fullOutput ? {
				ok: result.healthy,
				...result.healthy ? { data: result } : { error: result },
				meta: {
					command: MCP_DOCTOR_COMMAND,
					duration: `${Math.round(performance.now() - started)}ms`
				}
			} : result;
			return {
				output: renderCliDocument(parsed.format === "jsonl" && !result.healthy ? jsonLinesErrorRecord(outputValue) : outputValue, parsed.format, input.stdoutIsTerminal),
				exitCode: result.healthy ? 0 : 1
			};
		};
		compareInventory = (expectedNames, observedNames) => {
			const expected = new Set(expectedNames);
			const observed = new Set(observedNames);
			return {
				expected: expectedNames.length,
				observed: observedNames.length,
				missing: [...expected].filter((name) => !observed.has(name)).sort(),
				unexpected: [...observed].filter((name) => !expected.has(name)).sort(),
				duplicates: [...observed].filter((name) => observedNames.filter((candidate) => candidate === name).length > 1).sort()
			};
		};
		inventoryCheck = (name, comparison) => ({
			name: `inventory:${name}`,
			ok: comparison.expected === comparison.observed && comparison.missing.length === 0 && comparison.unexpected.length === 0 && comparison.duplicates.length === 0,
			detail: `expected=${String(comparison.expected)} observed=${String(comparison.observed)} missing=${comparison.missing.join(",") || "none"} unexpected=${comparison.unexpected.join(",") || "none"} duplicates=${comparison.duplicates.join(",") || "none"}`
		});
		parseIdentityToolResult = (input) => {
			if (!isRecord(input) || !isRecord(input.result)) return {
				packageVersion: null,
				catalogDigest: null
			};
			const identity = input.result.server_identity;
			if (!isRecord(identity)) return {
				packageVersion: null,
				catalogDigest: null
			};
			const packageIdentity = identity.package;
			const catalog = identity.catalog;
			const digests = isRecord(catalog) ? catalog.digests : undefined;
			return {
				packageVersion: isRecord(packageIdentity) && typeof packageIdentity.version === "string" ? packageIdentity.version : null,
				catalogDigest: isRecord(digests) && typeof digests.combined_sha256 === "string" ? digests.combined_sha256 : null
			};
		};
		parseOutputArguments = (arguments_) => {
			if (hasHelpInOptionPosition(arguments_)) return {
				ok: false,
				help: true
			};
			let format = "toon";
			let fullOutput = false;
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "--json") {
					format = "json";
					continue;
				}
				const inline = argument?.startsWith("--format=") ? argument.slice("--format=".length) : undefined;
				if (argument === "--format" || inline !== undefined) {
					const candidate = inline ?? arguments_[index + 1];
					if (inline === undefined) index += 1;
					if (candidate === undefined || candidate === "") return {
						ok: false,
						help: false,
						format,
						code: "MISSING_OUTPUT_VALUE",
						message: missingCliOutputValueMessage("--format")
					};
					if (!isOutputFormat(candidate)) return {
						ok: false,
						help: false,
						format,
						code: "VALIDATION_ERROR",
						message: `Invalid output format: ${candidate}`
					};
					format = candidate;
					continue;
				}
				if (argument === "--full-output") {
					fullOutput = true;
					continue;
				}
				if (HELP_FLAGS.has(argument ?? "")) return {
					ok: false,
					help: true
				};
				return {
					ok: false,
					help: false,
					format,
					code: "VALIDATION_ERROR",
					message: `Unknown mcp doctor option: ${argument ?? "missing"}`
				};
			}
			return {
				ok: true,
				format,
				fullOutput
			};
		};
		hasHelpInOptionPosition = (arguments_) => {
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "--format") {
					index += 1;
					continue;
				}
				if (HELP_FLAGS.has(argument ?? "")) return true;
			}
			return false;
		};
		isOutputFormat = (value) => OUTPUT_FORMATS.some((candidate) => candidate === value);
		requestOptions = (deadline, signal) => ({
			signal,
			timeout: Math.max(1, Math.ceil(deadline - performance.now()))
		});
		targetFreeEnvironment = (environment) => {
			const result = Object.fromEntries(Object.entries(environment).filter((entry) => entry[1] !== undefined));
			for (const name of [
				"HOPPER_TARGET_PATH",
				"HOPPER_TARGET_KIND",
				"HOPPER_LOADER_ARGS_JSON"
			]) delete result[name];
			return result;
		};
		catalogIdentityForEnvironment = (environment) => {
			const inputProfile = parseMcpInputSchemaProfile(environment.REA_MCP_INPUT_SCHEMA_PROFILE);
			const outputProfile = parseMcpOutputSchemaProfile(environment.REA_MCP_OUTPUT_SCHEMA_PROFILE);
			return createCatalogIdentity(compactPresentationForMcpInputSchemaProfile(inputProfile.ok ? inputProfile.value : undefined), outputProfile.ok ? outputProfile.value ?? "full" : "full");
		};
		captureStderr = () => {
			const retained = Buffer.allocUnsafe(MCP_STARTUP_POLICY.doctorStderrBytes);
			let retainedBytes = 0;
			let bytes = 0;
			let truncated = false;
			return {
				append(chunk) {
					const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), "utf8");
					bytes += buffer.byteLength;
					const remaining = retained.byteLength - retainedBytes;
					const copied = Math.min(remaining, buffer.byteLength);
					if (copied > 0) {
						buffer.copy(retained, retainedBytes, 0, copied);
						retainedBytes += copied;
					}
					if (copied < buffer.byteLength) truncated = true;
				},
				value: () => ({
					stderr: truncated ? new StringDecoder("utf8").write(retained.subarray(0, retainedBytes)) : retained.toString("utf8", 0, retainedBytes),
					stderr_bytes: bytes,
					stderr_truncated: truncated
				})
			};
		};
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		doctorTransportDetail = (cause, budget, signal) => {
			const message = errorMessage(cause);
			const timedOut = signal.aborted && cause === signal.reason || cause instanceof SdkError && cause.code === SdkErrorCode.RequestTimeout;
			return timedOut ? `${message} ${mcpDoctorDeadlineRecovery(budget)}` : message;
		};
		appliedDoctorBudget = (resolved, deadlineMs) => deadlineMs === undefined ? resolved : {
			...resolved,
			milliseconds: deadlineMs,
			source: deadlineMs === resolved.defaultMilliseconds && resolved.source === "default" ? "default" : "setting"
		};
	})))();
}

//#endregion
init_mcpDoctor();
export { compareInventory, runProductionMcpDoctor, runProductionMcpDoctorCli };