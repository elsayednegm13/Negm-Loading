#!/usr/bin/env node
import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as snapshotEnvironment, t as init_snapshotEnvironment } from "./snapshotEnvironment-CH6esxCR.js";
import { h as init_CurrentEntrypointPath, m as CURRENT_ENTRYPOINT_PATH, p as resolveMcpInputSchemaProfile, u as init_mcpInputSchemaProfile } from "./toolSchemaMetadata-C0VxTNwy.js";
import { a as init_EvidenceMcpServerCore, d as parseConfig, i as currentMcpRequestSignal, n as promptArgumentsSchema, o as ToolResultDelivery, r as EvidenceMcpServerCore, s as init_ToolResultDelivery, t as init_promptArguments, u as init_parseConfig } from "./promptArguments-CG-XPQMf.js";
import { n as projectAnalysisError, t as init_analysisErrorProjection } from "./analysisErrorProjection-CbRgJX1L.js";
import { a as reportMcpShutdownFailure, i as init_shutdown, l as SERVER_START_FAILED, n as init_OwnedMcpServers, o as MCP_CONNECTION_LOST, t as OwnedMcpServers, u as init_messages } from "./OwnedMcpServers-w4pIAnCJ.js";
import { n as init_logger, t as createLogger } from "./logger-Brcs2SlV.js";
import { a as parseMcpHttpEndpoint, n as init_mcpHttpEndpoint } from "./mcpHttpEndpoint-H6Fe8RBI.js";
import { pathToFileURL } from "node:url";
import { readFileSync, realpathSync } from "node:fs";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createHash } from "node:crypto";
import { STDIO_DEFAULT_MAX_BUFFER_SIZE } from "@modelcontextprotocol/server";

//#region dist/recordedMcpCatalog.js
var RECORDED_MCP_CATALOG_SHA256;
function init_recordedMcpCatalog() {
	return (init_recordedMcpCatalog = __esmMin((() => {
		RECORDED_MCP_CATALOG_SHA256 = {
			"compact": "d9c6050ee525a265f41f183929f03aa28067423656e104b299b3463f3a819c1c",
			"full": "d7228cf5da32faf435f9d54a7b8fa84c1081734d7c7dad562f962f221ea8b1e7"
		};
	})))();
}

//#endregion
//#region dist/server/DeferredEvidenceMcpServer.js
var recordedProjection, DeferredEvidenceMcpServer;
function init_DeferredEvidenceMcpServer() {
	return (init_DeferredEvidenceMcpServer = __esmMin((() => {
		init_EvidenceMcpServerCore();
		init_promptArguments();
		init_messages();
		recordedProjection = (schema, projection) => ({ "~standard": {
			...schema["~standard"],
			jsonSchema: {
				input: () => projection,
				output: () => projection
			}
		} });
		DeferredEvidenceMcpServer = class extends EvidenceMcpServerCore {
			initialize;
			tools = new Map();
			prompts = new Map();
			loading;
			closing = false;
			closeAttempt;
			protocolClosed = false;
			runtimeClosed = false;
			runtimeCleanup;
			partialClose;
			materializing = false;
			protocolClose = () => super.close();
			constructor(catalog, delivery, initialize) {
				super(catalog.info, {
					capabilities: catalog.capabilities,
					instructions: catalog.instructions
				}, undefined, delivery, undefined, false, catalog.identity);
				this.initialize = initialize;
				for (const tool of catalog.tools) {
					const { name, inputSchema, outputSchema, ...metadata } = tool;
					let binding;
					const input = { "~standard": {
						version: 1,
						vendor: "rea",
						jsonSchema: {
							input: () => inputSchema,
							output: () => inputSchema
						},
						validate: async (value) => {
							await this.ensureRuntime();
							const canonical = binding.registered.inputSchema;
							if (canonical === undefined || canonical === input) throw new Error(SERVER_START_FAILED);
							return canonical["~standard"].validate(value);
						}
					} };
					const output = outputSchema === undefined ? undefined : { "~standard": {
						version: 1,
						vendor: "rea",
						jsonSchema: {
							input: () => outputSchema,
							output: () => outputSchema
						},
						validate: async (value) => {
							await this.ensureRuntime();
							const canonical = binding.registered.outputSchema;
							if (canonical === undefined || canonical === output) throw new Error(SERVER_START_FAILED);
							return canonical["~standard"].validate(value);
						}
					} };
					const registered = super.bindTool(name, {
						...metadata,
						inputSchema: input,
						...output === undefined ? {} : { outputSchema: output }
					}, (async (args, ctx) => {
						await this.ensureRuntime();
						ctx.mcpReq.signal.throwIfAborted();
						if (binding.callback === undefined) throw new Error(SERVER_START_FAILED);
						return binding.callback(args, ctx);
					}));
					binding = {
						registered,
						input: inputSchema,
						output: outputSchema
					};
					this.tools.set(name, binding);
				}
				const completion = { complete: async (...args) => {
					await this.ensureRuntime();
					currentMcpRequestSignal()?.throwIfAborted();
					if (this.promptCompletion === undefined) throw new Error(SERVER_START_FAILED);
					return this.promptCompletion.complete(...args);
				} };
				for (const prompt of catalog.prompts) {
					const { name, parameters, title, description } = prompt;
					let binding;
					const argsSchema = promptArgumentsSchema({ arguments: parameters }, completion);
					const registered = super.registerCanonicalPrompt(name, {
						...title === undefined ? {} : { title },
						...description === undefined ? {} : { description },
						argsSchema
					}, async (args, ctx) => {
						await this.ensureRuntime();
						ctx.mcpReq.signal.throwIfAborted();
						if (binding.callback === undefined) throw new Error(SERVER_START_FAILED);
						return binding.callback(args, ctx);
					});
					binding = { registered };
					this.prompts.set(name, binding);
				}
			}
			ensureRuntime() {
				if (this.closing) return Promise.reject(new Error("MCP connection is closed"));
				this.loading ??= Promise.resolve().then(() => this.initialize(this)).catch(() => {
					throw new Error(SERVER_START_FAILED);
				});
				return this.loading;
			}
			/** Register an awaitable cleanup capability before runtime startup can fail. */
			ownRuntimeCleanup(close) {
				this.runtimeCleanup = close;
			}
			/** Canonical composition may wrap close; retain that exact cleanup capability. */
			materialize(build) {
				const ownedClose = this.close.bind(this);
				this.materializing = true;
				this.close = this.protocolClose;
				try {
					build();
					if (this.tools.size !== 0 || this.prompts.size !== 0) throw new Error("MCP catalog does not match runtime registrations");
				} finally {
					this.partialClose = this.close.bind(this);
					this.close = ownedClose;
					this.materializing = false;
				}
			}
			closePartialRuntime() {
				return this.partialClose?.() ?? Promise.resolve();
			}
			bindTool(name, config, callback) {
				const binding = this.tools.get(name);
				if (!this.materializing || binding === undefined || config.inputSchema === undefined || config.outputSchema === undefined !== (binding.output === undefined)) throw new Error("Unexpected MCP runtime registration");
				const canonical = callback;
				const guarded = async (args, ctx) => {
					ctx.mcpReq.signal.throwIfAborted();
					await this.ensureRuntime();
					ctx.mcpReq.signal.throwIfAborted();
					return canonical(args, ctx);
				};
				binding.callback = guarded;
				const { inputSchema: _input, outputSchema: _output, ...metadata } = config;
				binding.registered.update({
					...metadata,
					paramsSchema: recordedProjection(config.inputSchema, binding.input),
					...config.outputSchema === undefined || binding.output === undefined ? {} : { outputSchema: recordedProjection(config.outputSchema, binding.output) },
					callback: guarded
				});
				this.tools.delete(name);
				return binding.registered;
			}
			registerCanonicalPrompt(name, config, callback) {
				const binding = this.prompts.get(name);
				if (!this.materializing || binding === undefined) throw new Error("Unexpected MCP runtime prompt");
				const canonical = callback;
				binding.callback = async (args, ctx) => {
					ctx.mcpReq.signal.throwIfAborted();
					await this.ensureRuntime();
					ctx.mcpReq.signal.throwIfAborted();
					return canonical(args, ctx);
				};
				binding.registered.update({
					...config,
					callback: binding.callback
				});
				this.prompts.delete(name);
				return binding.registered;
			}
			bindPromptCompletion(completion) {
				return super.bindPromptCompletion({ complete: async (...args) => {
					await this.ensureRuntime();
					currentMcpRequestSignal()?.throwIfAborted();
					return completion.complete(...args);
				} });
			}
			sendToolListChanged() {
				if (!this.materializing) super.sendToolListChanged();
			}
			sendPromptListChanged() {
				if (!this.materializing) super.sendPromptListChanged();
			}
			close() {
				this.closing = true;
				this.closeAttempt ??= Promise.resolve().then(() => this.finishClose()).catch((cause) => {
					this.closeAttempt = undefined;
					throw cause;
				});
				return this.closeAttempt;
			}
			async finishClose() {
				const errors = [];
				if (!this.protocolClosed) {
					try {
						await this.protocolClose();
						this.protocolClosed = true;
					} catch (cause) {
						errors.push(cause);
					}
				}
				await this.loading?.catch(() => undefined);
				if (!this.runtimeClosed && this.runtimeCleanup !== undefined) {
					try {
						await this.runtimeCleanup();
						this.runtimeClosed = true;
					} catch (cause) {
						errors.push(cause);
					}
				}
				if (errors.length > 0) throw new AggregateError(errors, "MCP runtime cleanup failed");
			}
		};
	})))();
}

//#endregion
//#region dist/main/deferredRuntime.js
var readCatalog, initializeRuntime, runDeferred;
function init_deferredRuntime() {
	return (init_deferredRuntime = __esmMin((() => {
		init_recordedMcpCatalog();
		init_mcpInputSchemaProfile();
		init_DeferredEvidenceMcpServer();
		init_ToolResultDelivery();
		init_logger();
		init_shutdown();
		init_messages();
		init_OwnedMcpServers();
		readCatalog = (profile) => {
			const bytes = readFileSync(new URL(profile === "full" ? "../mcp-catalog-full.json" : "../mcp-catalog.json", new URL("../main/deferredRuntime.js", import.meta.url).href));
			if (createHash("sha256").update(bytes).digest("hex") !== RECORDED_MCP_CATALOG_SHA256?.[profile]) throw new Error(SERVER_START_FAILED);
			const catalog = JSON.parse(bytes.toString("utf8"));
			if (typeof catalog !== "object" || catalog === null || Reflect.get(catalog, "version") !== 1) throw new Error(SERVER_START_FAILED);
			return catalog;
		};
		initializeRuntime = async (server, dependencies, context, config, startedAt) => {
			let shutdown;
			let closeSession;
			let sessionClosed = false;
			server.ownRuntimeCleanup(async () => {
				if (shutdown !== undefined) return shutdown();
				const results = await Promise.allSettled([server.closePartialRuntime(), (async () => {
					if (!sessionClosed && closeSession !== undefined) {
						await closeSession();
						sessionClosed = true;
					}
				})()]);
				const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
				if (failures.length > 0) throw new AggregateError(failures, "MCP startup cleanup failed");
			});
			const [{ runEager }, { createServer }] = await Promise.all([import("./eagerRuntime-uxW_nSgG.js").then((n) => (n.n(), n.t)), import("./createServer-CoLFsKLA.js").then((n) => (n.r(), n.n))]);
			const result = await runEager({
				...dependencies,
				stdin: undefined,
				registerShutdown: () => () => undefined,
				captureShutdown: (close) => {
					shutdown = close;
				},
				createServer: (source, options) => {
					if (source.kind === "session") closeSession = async () => {
						const result = await source.session.close({ retainProviderDocuments: true });
						if (!result.ok) throw result.error;
					};
					return createServer(source, {
						...options,
						mcpServer: server,
						startedAt
					});
				},
				serve: (factory) => {
					let close;
					server.materialize(() => {
						const configured = factory(context);
						if (configured !== server) throw new Error(SERVER_START_FAILED);
						close = configured.close.bind(configured);
					});
					return { close: () => close?.() ?? Promise.resolve() };
				}
			}, config);
			if (result !== 0 || shutdown === undefined) throw new Error(SERVER_START_FAILED);
		};
		runDeferred = async (dependencies, config) => {
			const serverLogger = createLogger("mcp", config.logLevel).child({ layer: "server" });
			const profile = resolveMcpInputSchemaProfile(config.mcpInputSchemaProfile);
			let firstCatalog = readCatalog(profile);
			const servers = new OwnedMcpServers();
			let handle;
			let attempt;
			let unregister = () => undefined;
			let closing = false;
			let finishServing;
			const serving = new Promise((resolve) => {
				finishServing = resolve;
			});
			const close = () => {
				closing = true;
				attempt ??= Promise.resolve().then(async () => {
					await serving;
					const ownedHandle = handle;
					const handleResults = Promise.allSettled(ownedHandle === undefined ? [] : [Promise.resolve().then(() => ownedHandle.close()).then(() => {
						handle = undefined;
					})]);
					const [handles, instances] = await Promise.all([handleResults, servers.closeAll()]);
					const failures = [...handles, ...instances].flatMap((result) => result.status === "rejected" ? [result.reason] : []);
					if (failures.length > 0) throw new AggregateError(failures, "MCP cleanup failed");
					unregister();
				}).catch((cause) => {
					attempt = undefined;
					throw cause;
				});
				return attempt;
			};
			const requestClose = () => {
				void close().catch((cause) => reportMcpShutdownFailure(cause, dependencies, serverLogger));
			};
			try {
				unregister = dependencies.registerShutdown(requestClose);
				dependencies.captureShutdown?.(close);
				try {
					handle = await dependencies.serve((context) => {
						const server = servers.create(() => {
							const catalog = firstCatalog ?? readCatalog(profile);
							firstCatalog = undefined;
							const startedAt = new Date().toISOString();
							const server = new DeferredEvidenceMcpServer(catalog, new ToolResultDelivery(config.mcpMaxResponseBytes ?? STDIO_DEFAULT_MAX_BUFFER_SIZE), (target) => initializeRuntime(target, dependencies, context, config, startedAt).catch((cause) => {
								dependencies.setExitCode(1);
								throw cause;
							}));
							return server;
						});
						const previous = server.server.onclose;
						server.server.onclose = () => {
							previous?.();
							requestClose();
						};
						return server;
					}, { onerror: () => {
						serverLogger.error(MCP_CONNECTION_LOST);
						dependencies.writeStderr(`${MCP_CONNECTION_LOST}\n`);
					} });
				} finally {
					finishServing();
				}
			} catch (cause) {
				finishServing();
				serverLogger.error({ error: cause instanceof Error ? cause.message : String(cause) }, SERVER_START_FAILED);
				try {
					await close();
				} catch (cleanupCause) {
					throw new AggregateError([cause, cleanupCause], "MCP startup and cleanup failed");
				}
				dependencies.writeStderr(`${SERVER_START_FAILED}\n`);
				return 1;
			}
			if (closing) await close();
			return 0;
		};
	})))();
}

//#endregion
//#region dist/main/processShutdown.js
var SIGNAL_EXIT_STATUS, processShutdownEvents, registerProcessShutdown, registerSignalShutdown, latchSignalShutdown, createExitStatus;
function init_processShutdown() {
	return (init_processShutdown = __esmMin((() => {
		SIGNAL_EXIT_STATUS = {
			SIGINT: 130,
			SIGTERM: 143
		};
		processShutdownEvents = {
			signals: process,
			stdin: process.stdin
		};
		registerProcessShutdown = (handler, events = processShutdownEvents) => {
			const onInterrupt = () => handler("SIGINT");
			const onTerminate = () => handler("SIGTERM");
			const onInputEnd = () => handler();
			events.signals.on("SIGINT", onInterrupt);
			events.signals.on("SIGTERM", onTerminate);
			events.stdin?.on("end", onInputEnd);
			events.stdin?.on("close", onInputEnd);
			return () => {
				events.signals.off("SIGINT", onInterrupt);
				events.signals.off("SIGTERM", onTerminate);
				events.stdin?.off("end", onInputEnd);
				events.stdin?.off("close", onInputEnd);
			};
		};
		registerSignalShutdown = (handler, signals = process) => registerProcessShutdown((signal) => {
			if (signal !== undefined) handler(SIGNAL_EXIT_STATUS[signal]);
		}, { signals });
		latchSignalShutdown = (signals = process, exit = (status) => process.exit(status)) => {
			let pending;
			const record = (signal) => () => {
				if (pending === undefined) pending = SIGNAL_EXIT_STATUS[signal];
				else exit(pending);
			};
			const onInterrupt = record("SIGINT");
			const onTerminate = record("SIGTERM");
			signals.on("SIGINT", onInterrupt);
			signals.on("SIGTERM", onTerminate);
			return { release: () => {
				signals.off("SIGINT", onInterrupt);
				signals.off("SIGTERM", onTerminate);
				return pending;
			} };
		};
		createExitStatus = (setExitCode) => {
			let signalStatus;
			return {
				set: (code) => {
					setExitCode(code === 0 && signalStatus !== undefined ? signalStatus : code);
				},
				signal: (status) => {
					signalStatus = status;
					setExitCode(status);
				}
			};
		};
	})))();
}

//#endregion
//#region dist/main.js
var runtimeDependencies, httpRuntimeDependencies, run, runEntrypoint, processIo, runMcpHttpEntrypoint, isDirectEntrypoint;
function init_main() {
	return (init_main = __esmMin((() => {
		init_snapshotEnvironment();
		init_CurrentEntrypointPath();
		init_parseConfig();
		init_analysisErrorProjection();
		init_deferredRuntime();
		init_recordedMcpCatalog();
		init_messages();
		init_processShutdown();
		init_mcpHttpEndpoint();
		runtimeDependencies = () => ({
			env: process.env,
			stdin: process.stdin,
			serve: serveStdio,
			writeStderr: (text) => process.stderr.write(text),
			setExitCode: (code) => {
				process.exitCode = code;
			},
			registerShutdown: registerProcessShutdown
		});
		httpRuntimeDependencies = (endpoint, latch, exit) => {
			const base = runtimeDependencies();
			return {
				...base,
				transport: "http",
				setExitCode: exit.set,
				serve: async (factory, options) => {
					const { serveStreamableHttp } = await import("./serveStreamableHttp-BY18og7w.js");
					const { RequestTrackingMcpServer } = await import("./RequestTrackingMcpServer-WXl7yrKz.js").then((n) => (n.r(), n.n));
					return serveStreamableHttp({
						...endpoint,
						createMcpServer: async (context) => {
							const server = await factory(context);
							if (!(server instanceof RequestTrackingMcpServer)) throw new TypeError("HTTP MCP servers must track tool completion");
							return server;
						},
						closeInstance: false,
						...options
					});
				},
				registerShutdown: (request) => {
					const unregister = registerSignalShutdown((exitStatus) => {
						exit.signal(exitStatus);
						request();
					});
					const pending = latch.release();
					if (pending !== undefined) {
						exit.signal(pending);
						request();
					}
					return unregister;
				}
			};
		};
		run = async (dependencies = runtimeDependencies()) => {
			const environment = snapshotEnvironment(dependencies.env);
			const config = parseConfig(environment);
			if (!config.ok) {
				dependencies.writeStderr(`${projectAnalysisError(config.error).message}\n`);
				return 1;
			}
			const fullOutputCatalog = environment.REA_MCP_OUTPUT_SCHEMA_PROFILE === undefined || environment.REA_MCP_OUTPUT_SCHEMA_PROFILE === "full";
			if (RECORDED_MCP_CATALOG_SHA256 !== undefined && dependencies.transport !== "http" && config.value.hopperTargetPath === undefined && fullOutputCatalog && dependencies.createServer === undefined && dependencies.loadOptionalProviders === undefined) {
				return runDeferred({
					...dependencies,
					env: environment
				}, config.value);
			}
			return (await import("./eagerRuntime-uxW_nSgG.js").then((n) => (n.n(), n.t))).runEager({
				...dependencies,
				env: environment
			}, config.value);
		};
		runEntrypoint = async (start = () => run(), writeStderr = (text) => process.stderr.write(text), setExitCode = (code) => {
			process.exitCode = code;
		}) => {
			try {
				setExitCode(await start());
			} catch (cause) {
				void cause;
				writeStderr(`${SERVER_START_FAILED}\n`);
				setExitCode(1);
			}
		};
		processIo = {
			writeStdout: (text) => void process.stdout.write(text),
			writeStderr: (text) => void process.stderr.write(text),
			setExitCode: (code) => {
				process.exitCode = code;
			}
		};
		runMcpHttpEntrypoint = async (arguments_, io = processIo) => {
			const { parseMcpHttpArguments, renderMcpHttpHelp } = await import("./mcpHttpArguments-DcMXHa54.js");
			const parsed = parseMcpHttpArguments(arguments_);
			if (!parsed.ok) {
				if (parsed.help) {
					io.writeStdout(`${renderMcpHttpHelp()}\n`);
					io.setExitCode(0);
					return;
				}
				io.writeStderr(`${parsed.message}\n`);
				io.setExitCode(1);
				return;
			}
			const endpoint = parseMcpHttpEndpoint(snapshotEnvironment(process.env), {
				...parsed.host === undefined ? {} : { host: parsed.host },
				...parsed.port === undefined ? {} : { port: parsed.port }
			});
			if (!endpoint.ok) {
				io.writeStderr(`${projectAnalysisError(endpoint.error).message}\n`);
				io.setExitCode(1);
				return;
			}
			const latch = latchSignalShutdown();
			const exit = createExitStatus(io.setExitCode);
			try {
				await runEntrypoint(() => run(httpRuntimeDependencies(endpoint.value, latch, exit)), io.writeStderr, exit.set);
			} finally {
				latch.release();
			}
		};
		isDirectEntrypoint = (entryPath, moduleUrl) => {
			if (entryPath === undefined) return false;
			try {
				return pathToFileURL(realpathSync(entryPath)).href === moduleUrl;
			} catch {
				return false;
			}
		};
		if (isDirectEntrypoint(CURRENT_ENTRYPOINT_PATH, new URL("../main.js", import.meta.url).href)) {
			void runEntrypoint();
		}
	})))();
}

//#endregion
init_main();
export { run, runEntrypoint, runMcpHttpEntrypoint };