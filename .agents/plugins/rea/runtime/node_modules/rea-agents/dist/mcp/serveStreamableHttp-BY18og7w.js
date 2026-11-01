import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { f as init_analysisErrorCore, l as AnalysisResourceConstraintError } from "./analysisErrorCore-Cl6H9zyu.js";
import { r as init_RequestTrackingMcpServer } from "./RequestTrackingMcpServer-WXl7yrKz.js";
import { n as init_streamableHttpListenError, t as StreamableHttpListenError } from "./streamableHttpListenError-DgGpqyX2.js";
import { randomUUID } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";
import { WebStandardStreamableHTTPServerTransport, hostHeaderValidationResponse, isInitializeRequest, isJsonContentType, localhostAllowedHostnames, originValidationResponse, readRequestBody } from "@modelcontextprotocol/server";
import { finished } from "node:stream";
import { once } from "node:events";
import { createServer as createServer$1 } from "node:http";

//#region dist/server/http/nodeHttpBridge.js
var BODYLESS_METHODS, UnsupportedRequestTargetError, requestUrl, toHeaders, requestBody, toWebRequest, responseHeaders, drainOrClose, retainCleanup, pumpBody, writeWebResponse;
function init_nodeHttpBridge() {
	return (init_nodeHttpBridge = __esmMin((() => {
		BODYLESS_METHODS = new Set(["GET", "HEAD"]);
		UnsupportedRequestTargetError = class extends Error {
			name = "UnsupportedRequestTargetError";
			constructor(target) {
				super(`Unsupported request target ${target}`);
			}
		};
		requestUrl = (target, origin) => {
			if (!target.startsWith("/") || target.includes("#")) throw new UnsupportedRequestTargetError(target);
			const url = new URL(`${origin}${target}`);
			const rawPath = target.split("?")[0] ?? "";
			if (url.pathname !== rawPath) throw new UnsupportedRequestTargetError(target);
			return url;
		};
		toHeaders = (incoming) => {
			const headers = new Headers();
			for (const [name, value] of Object.entries(incoming)) {
				if (value === undefined) continue;
				if (Array.isArray(value)) for (const entry of value) headers.append(name, entry);
				else headers.set(name, value);
			}
			return headers;
		};
		requestBody = (request) => {
			let ended = false;
			let controller;
			let cleanup = () => undefined;
			const onData = (chunk) => {
				if (ended) return;
				if (!Buffer.isBuffer(chunk)) {
					ended = true;
					request.pause();
					request.off("data", onData);
					controller.error(new TypeError("HTTP request body must be bytes"));
					return;
				}
				controller.enqueue(new Uint8Array(chunk));
				if ((controller.desiredSize ?? 0) <= 0) request.pause();
			};
			return new ReadableStream({
				start(target) {
					controller = target;
					request.pause();
					cleanup = finished(request, {
						readable: true,
						writable: false
					}, (cause) => {
						request.off("data", onData);
						cleanup();
						if (ended) return;
						ended = true;
						if (cause) controller.error(cause);
						else controller.close();
					});
					request.on("data", onData);
				},
				pull() {
					if (!ended) request.resume();
				},
				cancel() {
					ended = true;
					request.pause();
					request.off("data", onData);
				}
			}, new ByteLengthQueuingStrategy({ highWaterMark: request.readableHighWaterMark }));
		};
		toWebRequest = (request, response, origin) => {
			const controller = new AbortController();
			response.once("close", () => {
				if (!response.writableFinished) controller.abort();
			});
			const method = request.method ?? "GET";
			return new Request(requestUrl(request.url ?? "/", origin), {
				method,
				headers: toHeaders(request.headers),
				signal: controller.signal,
				...BODYLESS_METHODS.has(method) ? {} : {
					body: requestBody(request),
					duplex: "half"
				}
			});
		};
		responseHeaders = (headers, closeConnection) => {
			const fields = Object.fromEntries(headers);
			const cookies = headers.getSetCookie();
			if (cookies.length > 0) fields["set-cookie"] = cookies;
			if (closeConnection) fields.connection = "close";
			return fields;
		};
		drainOrClose = (target) => new Promise((resolve) => {
			if (target.destroyed) {
				resolve();
				return;
			}
			const settle = () => {
				target.off("drain", settle);
				target.off("close", settle);
				resolve();
			};
			target.once("drain", settle);
			target.once("close", settle);
		});
		retainCleanup = (cleanup, options) => {
			options.onBodyCleanup?.(cleanup);
			void cleanup.catch(() => undefined);
		};
		pumpBody = async (reader, target, cancel) => {
			let left = false;
			const leave = () => {
				if (left) return;
				left = true;
				cancel();
			};
			target.once("close", leave);
			try {
				if (target.destroyed) {
					leave();
					return;
				}
				for (let next = await reader.read(); !next.done && !left; next = await reader.read()) if (!target.write(next.value) && !left) await drainOrClose(target);
			} finally {
				target.off("close", leave);
			}
			if (!left) target.end();
		};
		writeWebResponse = async (response, target, options = {}) => {
			let reader;
			try {
				reader = response.body?.getReader();
			} catch (cause) {
				retainCleanup(Promise.reject(cause), options);
				throw cause;
			}
			let cancelled = false;
			const cancel = () => {
				if (cancelled || reader === undefined) return;
				cancelled = true;
				retainCleanup(reader.cancel(), options);
			};
			try {
				if (target.destroyed) {
					cancel();
					return;
				}
				target.writeHead(response.status, responseHeaders(response.headers, options.closeConnection ?? false));
				target.flushHeaders();
				if (reader === undefined || target.req.method === "HEAD") {
					target.end();
					cancel();
					return;
				}
				await pumpBody(reader, target, cancel);
			} catch (cause) {
				cancel();
				throw cause;
			} finally {
				reader?.releaseLock();
			}
		};
	})))();
}

//#endregion
//#region dist/server/http/listenHttpServer.js
var listenHttpServer;
function init_listenHttpServer() {
	return (init_listenHttpServer = __esmMin((() => {
		listenHttpServer = async (server, host, port, signal) => {
			signal?.throwIfAborted();
			const startup = new AbortController();
			const cancel = () => startup.abort(signal?.reason);
			signal?.addEventListener("abort", cancel, { once: true });
			try {
				server.listen({
					host,
					port,
					signal: startup.signal
				});
				await once(server, "listening", { signal: startup.signal });
				startup.signal.throwIfAborted();
			} catch (cause) {
				if (startup.signal.aborted && (cause === startup.signal.reason || cause instanceof Error && cause.name === "AbortError")) {
					await new Promise((resolve, reject) => {
						server.close((error) => {
							if (error === undefined || "code" in error && error.code === "ERR_SERVER_NOT_RUNNING") resolve();
							else reject(error);
						});
						server.closeAllConnections();
					});
					throw startup.signal.reason;
				}
				throw cause;
			} finally {
				signal?.removeEventListener("abort", cancel);
			}
		};
	})))();
}

//#endregion
//#region dist/server/http/NodeHttpRequestOwner.js
var NodeHttpRequestOwner;
function init_NodeHttpRequestOwner() {
	return (init_NodeHttpRequestOwner = __esmMin((() => {
		init_nodeHttpBridge();
		init_analysisErrorCore();
		NodeHttpRequestOwner = class {
			capacity;
			target;
			#active = 0;
			#exchanges = new Set();
			#bodyCleanups = new Set();
			#cleanupFailures = [];
			constructor(capacity, target) {
				this.capacity = capacity;
				this.target = target;
				if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError("maxConcurrentDispatches must be a positive safe integer");
			}
			handle(request, response) {
				if (request.socket.destroyed || response.socket === null) {
					request.socket.destroy();
					return Promise.resolve();
				}
				const refusal = this.#cleanupFailures.length > 0 ? "cleanup" : this.#active >= this.capacity ? "capacity" : undefined;
				if (refusal !== undefined) {
					return this.#trackExchange(async () => {
						try {
							await writeWebResponse(this.target.refuse(refusal), response, {
								closeConnection: true,
								onBodyCleanup: this.#trackBodyCleanup
							});
						} catch {
							response.destroy();
						}
					});
				}
				this.#active += 1;
				let reserved = true;
				let dispatched = false;
				let inputDone = false;
				let responseDone = false;
				let holdResponse = true;
				let pendingCleanups = 0;
				let cleanupFailed = false;
				const release = () => {
					if (!reserved) return;
					reserved = false;
					this.#active -= 1;
					request.off("end", inputEnded);
					request.off("close", inputEnded);
					response.off("close", inputEnded);
				};
				const releaseIfReady = () => {
					if (dispatched && inputDone && (!holdResponse || responseDone && pendingCleanups === 0 && !cleanupFailed)) release();
				};
				const inputEnded = () => {
					inputDone = true;
					releaseIfReady();
				};
				return this.#trackExchange(async () => {
					if (request.socket.destroyed || response.destroyed) {
						release();
						return;
					}
					try {
						await this.target.serve(request, response, {
							onBodyCleanup: (cleanup) => {
								pendingCleanups += 1;
								this.#trackBodyCleanup(cleanup, (succeeded) => {
									pendingCleanups -= 1;
									cleanupFailed ||= !succeeded;
									releaseIfReady();
								});
							},
							onDispatchSettled: ({ hasUnreadBody, admissionLifetime }) => {
								dispatched = true;
								holdResponse = admissionLifetime === "response";
								if (!hasUnreadBody || request.destroyed || response.destroyed) {
									inputEnded();
									return;
								}
								request.once("end", inputEnded);
								request.once("close", inputEnded);
								response.once("close", inputEnded);
							}
						});
					} catch (cause) {
						response.destroy();
						release();
						throw cause;
					} finally {
						responseDone = true;
						releaseIfReady();
					}
				});
			}
			#trackExchange(serve) {
				const exchange = Promise.resolve().then(serve);
				this.#exchanges.add(exchange);
				return exchange.finally(() => this.#exchanges.delete(exchange));
			}
			#trackBodyCleanup = (cleanup, settled) => {
				this.#bodyCleanups.add(cleanup);
				void cleanup.then(() => {
					this.#bodyCleanups.delete(cleanup);
					settled?.(true);
				}, (cause) => {
					this.#cleanupFailures.push(cause);
					this.#bodyCleanups.delete(cleanup);
					settled?.(false);
				});
			};
			async drain() {
				while (this.#exchanges.size > 0) await Promise.allSettled(this.#exchanges);
				while (this.#bodyCleanups.size > 0) await Promise.allSettled(this.#bodyCleanups);
				if (this.#cleanupFailures.length > 0) throw new AnalysisResourceConstraintError("mcp_http_response_cleanup", "transport", "HTTP response cleanup could not be confirmed; provider shutdown remains blocked", { failed_cleanup_count: this.#cleanupFailures.length }, {
					cause: new AggregateError(this.#cleanupFailures, "Response cleanup failed"),
					retryable: false
				});
			}
		};
	})))();
}

//#endregion
//#region dist/server/http/serveStreamableHttp.js
var MCP_HTTP_PATH, normalizedHostname, isLoopbackIpv4, isLoopbackAddress, hostHeaderAllowlist, jsonRpcErrorResponse, jsonError, protocolOf, describe, NO_SHUTDOWN_HOOK, SHUTTING_DOWN, SESSION_NOT_FOUND, DEFAULT_SESSION_DRAIN_TIMEOUT_MS, DEFAULT_MAX_CONCURRENT_DISPATCHES, SessionDrainTimeoutError, splitUnquoted, mediaType, quality, hasStreamablePostHeaders, classifyInitializePost, LiveSession, McpSessionSlot, endpointUrl, serveStreamableHttp, closeHttpServer, serveNodeRequest, stagedClose;
function init_serveStreamableHttp() {
	return (init_serveStreamableHttp = __esmMin((() => {
		init_nodeHttpBridge();
		init_listenHttpServer();
		init_streamableHttpListenError();
		init_NodeHttpRequestOwner();
		init_RequestTrackingMcpServer();
		init_analysisErrorCore();
		MCP_HTTP_PATH = "/mcp";
		normalizedHostname = (host) => {
			try {
				return new URL(`http://${isIPv6(host) ? `[${host}]` : host}`).hostname;
			} catch {
				return undefined;
			}
		};
		isLoopbackIpv4 = (address) => isIPv4(address) && address.startsWith("127.");
		isLoopbackAddress = (hostname) => {
			if (isLoopbackIpv4(hostname)) return true;
			if (!hostname.startsWith("[") || !hostname.endsWith("]")) return false;
			const inner = hostname.slice(1, -1);
			if (inner === "::1") return true;
			if (!inner.startsWith("::ffff:")) return false;
			const mapped = inner.slice("::ffff:".length);
			if (isLoopbackIpv4(mapped)) return true;
			const hex = /^([0-9a-f]{1,4}):[0-9a-f]{1,4}$/u.exec(mapped);
			return hex !== null && Number.parseInt(hex[1] ?? "0", 16) >> 8 === 127;
		};
		hostHeaderAllowlist = (host, boundAddress) => {
			const bound = normalizedHostname(boundAddress);
			if (bound === undefined || !isLoopbackAddress(bound)) return undefined;
			const names = [normalizedHostname(host), bound];
			const known = names.filter((name) => name !== undefined);
			return [...new Set([...localhostAllowedHostnames(), ...known])];
		};
		jsonRpcErrorResponse = (status, code, message) => Response.json({
			jsonrpc: "2.0",
			error: {
				code,
				message
			},
			id: null
		}, { status });
		jsonError = jsonRpcErrorResponse;
		protocolOf = (instance) => "server" in instance ? instance.server : instance;
		describe = (cause) => cause instanceof Error ? cause.message : String(cause);
		NO_SHUTDOWN_HOOK = () => undefined;
		SHUTTING_DOWN = () => jsonError(503, -32e3, "Server shutting down");
		SESSION_NOT_FOUND = () => jsonError(404, -32001, "Session not found");
		DEFAULT_SESSION_DRAIN_TIMEOUT_MS = 1e4;
		DEFAULT_MAX_CONCURRENT_DISPATCHES = 8;
		SessionDrainTimeoutError = class extends AnalysisResourceConstraintError {
			constructor(timeoutMs) {
				super("mcp_http_session", "transport", "Previous MCP session still has running requests; retry after they finish", { drain_timeout_ms: timeoutMs });
			}
		};
		splitUnquoted = (value, separator) => {
			const parts = [];
			let current = "";
			let quoted = false;
			let escaped = false;
			for (const char of value) {
				if (escaped) escaped = false;
				else if (quoted && char === "\\") escaped = true;
				else if (char === "\"") quoted = !quoted;
				else if (char === separator && !quoted) {
					parts.push(current);
					current = "";
					continue;
				}
				current += char;
			}
			parts.push(current);
			return parts;
		};
		mediaType = (value) => (splitUnquoted(value, ";")[0] ?? "").trim().toLowerCase();
		quality = (range) => {
			const q = splitUnquoted(range, ";").slice(1).map((parameter) => parameter.split("=")).find(([name]) => name?.trim().toLowerCase() === "q")?.[1];
			const value = q === undefined ? 1 : Number(q.trim());
			return Number.isFinite(value) ? value : 1;
		};
		hasStreamablePostHeaders = (request) => {
			const accept = request.headers.get("accept") ?? "";
			const accepted = new Set(splitUnquoted(accept, ",").filter((range) => quality(range) > 0).map(mediaType));
			return accepted.has("application/json") && accepted.has("text/event-stream") && accept.includes("application/json") && accept.includes("text/event-stream") && isJsonContentType(request.headers.get("content-type"));
		};
		classifyInitializePost = async (request) => {
			if (request.method !== "POST" || request.headers.has("mcp-session-id") || !hasStreamablePostHeaders(request)) return undefined;
			const probe = request.clone();
			try {
				const read = await readRequestBody(probe);
				if (read.tooLarge) return undefined;
				const body = JSON.parse(read.text);
				if (Array.isArray(body)) return body.some(isInitializeRequest) ? "batch" : undefined;
				return isInitializeRequest(body) ? "initialize" : undefined;
			} catch {
				return undefined;
			} finally {
				void probe.body?.cancel().catch(() => undefined);
			}
		};
		LiveSession = class {
			transport;
			instance;
			#closed = false;
			#bodyAbort = new AbortController();
			#shutdown;
			constructor(transport, instance) {
				this.transport = transport;
				this.instance = instance;
				this.#shutdown = transport.close.bind(transport);
			}
			/** Install after connect, so the SDK and Evidence adapter have bound their callbacks. */
			fenceDispatch() {
				const dispatch = this.transport.onmessage;
				this.transport.onmessage = (...args) => {
					if (!this.#closed) dispatch?.(...args);
				};
			}
			handle(request) {
				if (this.#closed) return Promise.resolve(SESSION_NOT_FOUND());
				if (request.method === "DELETE") return this.transport.handleRequest(request);
				return Promise.resolve(this.instance.runRequest(undefined, async () => {
					if (this.#closed) return SESSION_NOT_FOUND();
					const bodyAbort = new AbortController();
					try {
						const guarded = request.body === null ? request : new Request(request, {
							body: request.body.pipeThrough(new TransformStream(), { signal: AbortSignal.any([this.#bodyAbort.signal, bodyAbort.signal]) }),
							duplex: "half"
						});
						const response = await this.transport.handleRequest(guarded);
						if (!this.#closed) return response;
						await response.body?.cancel();
						return SESSION_NOT_FOUND();
					} finally {
						bodyAbort.abort();
					}
				}));
			}
			shutdown() {
				this.#closed = true;
				this.#bodyAbort.abort();
				return this.#shutdown();
			}
		};
		McpSessionSlot = class {
			instance;
			logger;
			drainTimeoutMs;
			#live;
			#arming;
			#closed = false;
			#hookRan = false;
			#draining = false;
			#ending;
			/** The instance's own close hook, captured once; it runs exactly once, when the listener closes. */
			#shutdownHook;
			constructor(instance, logger, drainTimeoutMs = DEFAULT_SESSION_DRAIN_TIMEOUT_MS) {
				this.instance = instance;
				this.logger = logger;
				this.drainTimeoutMs = drainTimeoutMs;
				instance.enableRequestTracking();
				const protocol = protocolOf(instance);
				const captured = protocol.onclose ?? NO_SHUTDOWN_HOOK;
				let running = false;
				this.#shutdownHook = () => {
					if (this.#hookRan || running) return;
					running = true;
					try {
						captured();
						this.#hookRan = true;
					} finally {
						running = false;
					}
				};
				protocol.onclose = this.#shutdownHook;
			}
			/** Route one MCP request; a new client's initialize replaces a session its predecessor left open. */
			async handle(request) {
				try {
					return await this.#handle(request);
				} catch (cause) {
					if (!(cause instanceof SessionDrainTimeoutError)) throw cause;
					return jsonError(503, -32e3, cause.message);
				}
			}
			async #handle(request) {
				if (this.#closed) return SHUTTING_DOWN();
				const initialization = await classifyInitializePost(request);
				if (initialization === "batch") return jsonError(400, -32600, "Initialize must be a single JSON-RPC object, not a batch");
				if (this.#draining) await this.#live?.transport.close();
				if (this.#closed) return SHUTTING_DOWN();
				const open = this.#live;
				if (open?.transport.sessionId !== undefined && initialization === "initialize" && !request.signal.aborted) {
					if (this.#closed) return SHUTTING_DOWN();
					this.logger?.info("MCP HTTP session replaced by a new client");
					await open.transport.close();
				}
				if (this.#closed) return SHUTTING_DOWN();
				const session = await this.#current();
				if (this.#closed) return SHUTTING_DOWN();
				return session.handle(request);
			}
			/** Cancel and drain MCP work before any shared provider shutdown hook can run. */
			async prepareShutdown() {
				this.#closed = true;
				await this.#arming?.catch(() => undefined);
				const open = this.#live;
				try {
					await open?.transport.close();
				} catch (cause) {
					if (!(cause instanceof SessionDrainTimeoutError)) throw cause;
					await open?.transport.close();
				}
				if (this.#live === open) this.#live = undefined;
			}
			/** Finish shutdown once every consumer of the shared providers has settled. */
			async close() {
				await this.prepareShutdown();
				this.#shutdownHook();
			}
			#current() {
				if (this.#closed) return Promise.reject(new Error("MCP HTTP session slot is closed"));
				if (this.#live !== undefined) return Promise.resolve(this.#live);
				this.#arming ??= this.#arm().finally(() => {
					this.#arming = undefined;
				});
				return this.#arming;
			}
			async #arm() {
				const transport = new WebStandardStreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: () => this.logger?.info("MCP HTTP session opened"),
					onsessionclosed: () => this.logger?.info("MCP HTTP session closed by the client")
				});
				const session = new LiveSession(transport, this.instance);
				transport.close = () => this.#endSession(session);
				await this.instance.connect(transport);
				session.fenceDispatch();
				this.#live = session;
				return session;
			}
			/** Close one session's transport while the instance's onclose hooks wait for close(). */
			async #endSession(session) {
				if (this.#live !== session) return;
				if (this.#ending !== undefined) return this.#ending;
				this.#draining = true;
				const ending = this.#finishSession(session).finally(() => {
					if (this.#ending === ending) this.#ending = undefined;
				});
				this.#ending = ending;
				return ending;
			}
			async #finishSession(session) {
				const protocol = protocolOf(this.instance);
				protocol.onclose = NO_SHUTDOWN_HOOK;
				try {
					await session.shutdown();
					if (!await this.instance.drainRequests(this.#closed ? undefined : this.drainTimeoutMs)) throw new SessionDrainTimeoutError(this.drainTimeoutMs);
					if (this.#live === session) this.#live = undefined;
					this.#draining = false;
				} finally {
					protocol.onclose = this.#shutdownHook;
				}
			}
		};
		endpointUrl = (address) => {
			const host = address.family === "IPv6" ? `[${address.address}]` : address.address;
			return `http://${host}:${String(address.port)}${MCP_HTTP_PATH}`;
		};
		serveStreamableHttp = async (options) => {
			const { host, port, logger, routes = [], closeInstance = true } = options;
			if (host.includes("%")) throw new StreamableHttpListenError(new Error(`scoped IPv6 bind address ${host} is not supported`));
			let allowedHosts;
			let slot;
			let origin = "";
			let stopped = false;
			const route = async (request) => {
				const local = (response) => ({
					response,
					admissionLifetime: "response"
				});
				if (stopped) return local(jsonError(503, -32e3, "Server shutting down"));
				const refused = allowedHosts === undefined ? undefined : hostHeaderValidationResponse(request, allowedHosts) ?? originValidationResponse(request, allowedHosts);
				if (refused !== undefined) return local(refused);
				if (slot === undefined) return local(jsonError(503, -32e3, "Server starting"));
				const { pathname } = new URL(request.url);
				if (pathname === "/mcp") return {
					response: await slot.handle(request),
					admissionLifetime: "dispatch"
				};
				const match = routes.find((candidate) => candidate.path === pathname && candidate.method === request.method);
				return local(match === undefined ? jsonError(404, -32601, `No route for ${request.method} ${pathname}`) : await match.handle(request));
			};
			const httpServer = createServer$1();
			const target = {
				route,
				origin: () => origin,
				logger
			};
			const requests = new NodeHttpRequestOwner(options.maxConcurrentDispatches ?? DEFAULT_MAX_CONCURRENT_DISPATCHES, {
				serve: (request, response, context) => serveNodeRequest(target, request, response, context),
				refuse: (reason) => jsonError(503, -32e3, reason === "capacity" ? "HTTP request capacity is full; retry after pending dispatches finish" : "HTTP response cleanup failed; this server is not accepting new requests")
			});
			const prepareTransportShutdown = stagedClose([
				async () => {
					stopped = true;
					await closeHttpServer(httpServer);
				},
				() => slot?.prepareShutdown() ?? Promise.resolve(),
				() => requests.drain()
			]);
			try {
				await listenHttpServer(httpServer, host, port, options.signal);
				options.signal?.throwIfAborted();
			} catch (cause) {
				if (options.signal?.aborted && cause === options.signal.reason) {
					if (httpServer.listening) await prepareTransportShutdown();
					throw cause;
				}
				throw new StreamableHttpListenError(cause);
			}
			const bound = httpServer.address();
			let url;
			try {
				if (bound === null || typeof bound === "string") throw new TypeError("MCP HTTP listener has no TCP address");
				url = endpointUrl(bound);
				origin = new URL(url).origin;
				allowedHosts = hostHeaderAllowlist(host, bound.address);
			} catch (cause) {
				await prepareTransportShutdown().catch(() => undefined);
				throw new StreamableHttpListenError(cause);
			}
			httpServer.on("request", (request, response) => {
				void requests.handle(request, response).catch((cause) => {
					logger?.warn({ error: describe(cause) }, "MCP HTTP request did not complete");
					response.destroy();
				});
			});
			httpServer.on("error", (error) => options.onerror?.(new StreamableHttpListenError(error, "serving")));
			let instance;
			try {
				instance = await options.createMcpServer({ era: "legacy" });
			} catch (cause) {
				await prepareTransportShutdown().catch(() => undefined);
				throw cause;
			}
			protocolOf(instance).onerror = (error) => logger?.warn({ error: error.message }, "MCP HTTP request rejected");
			const live = new McpSessionSlot(instance, logger, options.sessionDrainTimeoutMs);
			slot = live;
			const prepareShutdown = stagedClose([prepareTransportShutdown, () => live.close()]);
			const close = stagedClose([prepareShutdown, ...closeInstance ? [() => instance.close()] : []]);
			if (options.signal?.aborted) {
				await close();
				throw options.signal.reason;
			}
			if (allowedHosts === undefined) logger?.warn({ host }, "MCP HTTP Host header validation relaxed for a non-loopback bind");
			logger?.child({}, { level: "info" }).info({
				transport: "streamable-http",
				url
			}, "MCP transport listening");
			return {
				url,
				prepareShutdown,
				close
			};
		};
		closeHttpServer = (httpServer) => {
			const closed = new Promise((resolve, reject) => {
				httpServer.close((error) => error === undefined ? resolve() : reject(error));
			});
			httpServer.closeAllConnections();
			return closed;
		};
		serveNodeRequest = async (target, request, response, context) => {
			const { route, origin, logger } = target;
			const declaresBody = request.headers["content-length"] !== undefined || request.headers["transfer-encoding"] !== undefined;
			let webRequest;
			const unreadBody = () => declaresBody && !request.readableEnded;
			let reported = false;
			let admissionLifetime = "response";
			const settled = () => {
				if (reported) return;
				reported = true;
				context.onDispatchSettled({
					hasUnreadBody: unreadBody(),
					admissionLifetime
				});
			};
			try {
				try {
					webRequest = toWebRequest(request, response, origin());
				} catch (cause) {
					const target = cause instanceof UnsupportedRequestTargetError;
					await writeWebResponse(jsonError(target ? 400 : 405, -32600, target ? "Unsupported request target" : `Unsupported method ${request.method ?? ""}`), response, {
						closeConnection: true,
						onBodyCleanup: context.onBodyCleanup
					});
					return;
				}
				let webResponse;
				try {
					const routed = await route(webRequest);
					webResponse = routed.response;
					admissionLifetime = routed.admissionLifetime;
				} finally {
					settled();
				}
				await writeWebResponse(webResponse, response, {
					closeConnection: unreadBody(),
					onBodyCleanup: context.onBodyCleanup
				});
			} catch (cause) {
				logger?.[response.headersSent ? "debug" : "warn"]({ error: describe(cause) }, "MCP HTTP request did not complete");
				if (response.headersSent) response.destroy();
				else await writeWebResponse(jsonError(500, -32603, "Internal server error"), response, {
					closeConnection: unreadBody(),
					onBodyCleanup: context.onBodyCleanup
				}).catch(() => undefined);
			} finally {
				settled();
			}
		};
		stagedClose = (stages) => {
			const done = stages.map(() => false);
			let closing;
			return () => {
				if (closing !== undefined) return closing;
				const attempt = (async () => {
					for (const [index, stage] of stages.entries()) {
						if (done[index]) continue;
						await stage();
						done[index] = true;
					}
				})();
				closing = attempt;
				void attempt.catch(() => {
					if (closing === attempt) closing = undefined;
				});
				return attempt;
			};
		};
	})))();
}

//#endregion
init_serveStreamableHttp();
export { serveStreamableHttp };