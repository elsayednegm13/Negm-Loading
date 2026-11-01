import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, DEFAULT_CDP_COMMAND_TIMEOUT_MS, WEB_RUNTIME_LIMITS, cdpCleanupGraceExpired, cdpCommandDeadlineRecovery, cdpCommandTimeoutIsSelectable, cdpCommandTimeoutUnrelatedControl, init_browserDeadline, init_browserObservation, init_safeJson, init_urlComponents, init_webRuntime, noRuntimeOverrideSentence, safeParseJson, sanitizeBrowserUrl, urlDeclaresQueryOrFragment } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisError, init_analysisErrorBase, init_analysisErrorCore } from "./jsonLines-Gf10X4s1.js";
import { BrowserObservationError, init_browserObservationError } from "./analysisErrorProjection-DCiob2UF.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { z } from "zod";
import { request } from "node:http";
import WebSocket from "ws";

//#region dist/browser/CdpDiscoveryTargets.js
var identitySchema, parseCdpDiscoveryTargets;
function init_CdpDiscoveryTargets() {
	return (init_CdpDiscoveryTargets = __esmMin((() => {
		init_browserObservationError();
		identitySchema = z.object({
			id: z.string().min(1),
			type: z.string().min(1),
			url: z.string(),
			title: z.unknown().optional(),
			attached: z.unknown().optional(),
			webSocketDebuggerUrl: z.unknown().optional()
		});
		parseCdpDiscoveryTargets = (input, operation) => {
			if (!Array.isArray(input)) throw new BrowserObservationError(operation, "invalid_endpoint_response", { detail: "CDP /json/list must return an array of target rows." });
			const targets = [];
			const limitations = [];
			for (const [index, row] of input.entries()) {
				const parsed = identitySchema.safeParse(row);
				if (!parsed.success) {
					limitations.push(`CDP /json/list row ${String(index)} was excluded because its target identity is malformed: ${JSON.stringify(parsed.error.issues)}.`);
					continue;
				}
				const target = parsed.data;
				if (target.attached !== undefined && target.attached !== null && typeof target.attached !== "boolean") limitations.push(`CDP /json/list row ${String(index)} target ${target.id} reported malformed attached metadata ${JSON.stringify(target.attached)}; attachment state is unknown.`);
				if (target.title !== undefined && typeof target.title !== "string") limitations.push(`CDP /json/list row ${String(index)} target ${target.id} reported malformed title metadata ${JSON.stringify(target.title)}; title is unavailable.`);
				targets.push({
					id: target.id,
					type: target.type,
					url: target.url,
					title: typeof target.title === "string" ? target.title : "",
					attached: typeof target.attached === "boolean" ? target.attached : null,
					webSocketDebuggerUrl: target.webSocketDebuggerUrl
				});
			}
			return {
				targets,
				limitations
			};
		};
	})))();
}

//#endregion
//#region dist/browser/CdpEndpoint.js
var endpointVersionSchema, CDP_DISCOVERY_RESPONSE_LIMITS, discoveryBudget, discoveryTimeout, browserSocketVersionSchema, browserSocketTargetsSchema, discoverCdpEndpoint, withCdpDiscoveryDeadline, discoverCdpBrowserSocket, sanitizeTargetTitle, sanitizeTargetUrlAlias, sanitizeSameOriginTitleUrl, escapeRegExp, cdpTargetWebSocket, hasCdpTargetWebSocket, availableCdpTargetWebSocket, parseCdpEndpointValue, safeCdpWebSocketEndpoint, cdpWebSocketPath, pathIdentifier, targetWebSocket, readCdpJson, endpointFailure;
function init_CdpEndpoint() {
	return (init_CdpEndpoint = __esmMin((() => {
		init_browserDeadline();
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_browserObservationError();
		init_browserObservation();
		init_urlComponents();
		init_safeJson();
		init_webRuntime();
		init_CdpDiscoveryTargets();
		endpointVersionSchema = z.object({
			Browser: z.string().min(1),
			"Protocol-Version": z.string().min(1),
			"User-Agent": z.string(),
			"V8-Version": z.string(),
			"WebKit-Version": z.string(),
			webSocketDebuggerUrl: z.string().min(1)
		});
		CDP_DISCOVERY_RESPONSE_LIMITS = {
			bytes: 8 * 1024 * 1024,
			timeoutMs: CDP_DISCOVERY_RESPONSE_TIMEOUT_MS
		};
		discoveryBudget = (phase) => phase === "response" ? `The ${String(CDP_DISCOVERY_RESPONSE_LIMITS.bytes)}-byte discovery document budget` : `The ${String(WEB_RUNTIME_LIMITS.protocolBytes)}-byte browser-socket message budget`;
		discoveryTimeout = (operation, timeoutMs, phase) => {
			const subject = phase === "response" ? `CDP discovery response exceeded its ${String(timeoutMs)} ms deadline.` : `CDP browser-socket discovery exceeded its ${String(timeoutMs)} ms deadline.`;
			const fixed = noRuntimeOverrideSentence(`${discoveryBudget(phase)} and the ${String(timeoutMs)} ms discovery deadline stay fixed.`, cdpCommandTimeoutUnrelatedControl(operation));
			return new BrowserObservationError(operation, "timeout", {
				detail: `${subject} ${fixed}`,
				remediationAction: fixed
			});
		};
		browserSocketVersionSchema = z.object({
			protocolVersion: z.string().min(1),
			product: z.string().min(1),
			revision: z.string(),
			userAgent: z.string(),
			jsVersion: z.string()
		});
		browserSocketTargetsSchema = z.object({ targetInfos: z.array(z.object({
			targetId: z.string().min(1),
			type: z.string().min(1),
			title: z.string().default(""),
			url: z.string(),
			attached: z.boolean().optional()
		})) });
		discoverCdpEndpoint = async (endpoint, operation, signal) => {
			const versionInput = await readCdpJson(new URL("/json/version", endpoint), operation, signal);
			const targetsInput = await readCdpJson(new URL("/json/list", endpoint), operation, signal);
			const version = parseCdpEndpointValue(endpointVersionSchema, versionInput, operation);
			const { targets, limitations } = parseCdpDiscoveryTargets(targetsInput, operation);
			return {
				limitations,
				webSocket: safeCdpWebSocketEndpoint(endpoint, version.webSocketDebuggerUrl, operation),
				version: {
					product: version.Browser,
					protocol_version: version["Protocol-Version"],
					revision: version["WebKit-Version"],
					user_agent: version["User-Agent"],
					js_version: version["V8-Version"]
				},
				targets: targets.map((target) => ({
					id: target.id,
					type: target.type,
					title: sanitizeTargetTitle(target.title, target.url),
					url: target.url,
					attached: target.attached ?? null,
					...targetWebSocket(endpoint, target, operation)
				}))
			};
		};
		withCdpDiscoveryDeadline = async (operation, signal, work, timeoutMs = CDP_DISCOVERY_RESPONSE_LIMITS.timeoutMs) => {
			const deadline = new AbortController();
			let abortSource;
			let abortReason;
			const abort = (source, reason) => {
				if (abortSource !== undefined) return;
				abortSource = source;
				abortReason = reason;
				deadline.abort(reason);
			};
			const onCallerAbort = () => {
				if (signal?.aborted === true) abort("caller", signal.reason);
			};
			const timer = setTimeout(() => abort("deadline", new Error("CDP discovery deadline exceeded")), timeoutMs);
			signal?.addEventListener("abort", onCallerAbort, { once: true });
			onCallerAbort();
			try {
				return await work(deadline.signal);
			} catch (cause) {
				if (cause === abortReason) {
					if (abortSource === "caller") throw new AnalysisCancelledError(operation, { cause: abortReason });
					if (abortSource === "deadline") throw discoveryTimeout(operation, timeoutMs, "browser-socket");
				}
				if (cause instanceof AnalysisError) {
					if (abortSource === "deadline" && cause instanceof AnalysisCancelledError && cause.cause === abortReason) throw discoveryTimeout(operation, timeoutMs, "browser-socket");
					throw cause;
				}
				throw cause;
			} finally {
				clearTimeout(timer);
				signal?.removeEventListener("abort", onCallerAbort);
			}
		};
		discoverCdpBrowserSocket = async (connection, url, operation, signal) => {
			const versionInput = await connection.send("Browser.getVersion", {}, undefined, signal);
			const targetsInput = await connection.send("Target.getTargets", {}, undefined, signal);
			const version = parseCdpEndpointValue(browserSocketVersionSchema, versionInput, operation);
			const targets = parseCdpEndpointValue(browserSocketTargetsSchema, targetsInput, operation);
			return {
				webSocket: {
					scope: "browser",
					url
				},
				version: {
					product: version.product,
					protocol_version: version.protocolVersion,
					revision: version.revision,
					user_agent: version.userAgent,
					js_version: version.jsVersion
				},
				targets: targets.targetInfos.map((target) => ({
					id: target.targetId,
					type: target.type,
					title: sanitizeTargetTitle(target.title, target.url),
					url: target.url,
					attached: target.attached ?? null
				}))
			};
		};
		sanitizeTargetTitle = (value, targetUrl) => {
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return sanitizeTargetUrlAlias(value, targetUrl);
			}
			return url.protocol === "http:" || url.protocol === "https:" ? sanitizeBrowserUrl(value).url : sanitizeTargetUrlAlias(value, targetUrl);
		};
		sanitizeTargetUrlAlias = (value, targetUrl) => {
			let parsed;
			try {
				parsed = new URL(targetUrl);
			} catch (cause) {
				void cause;
				return value;
			}
			const markers = [
				parsed.origin,
				`//${parsed.host}`,
				parsed.host
			];
			if (parsed.pathname !== "/") markers.push(parsed.pathname);
			const candidatePattern = new RegExp(`(?:${markers.map(escapeRegExp).join("|")})[^\\s<>"']*`, "gu");
			return value.replace(candidatePattern, (candidate) => sanitizeSameOriginTitleUrl(candidate, parsed));
		};
		sanitizeSameOriginTitleUrl = (candidate, target) => {
			let parsed;
			try {
				parsed = candidate.startsWith("//") ? new URL(`${target.protocol}${candidate}`) : candidate.startsWith(target.host) ? new URL(`${target.protocol}//${candidate}`) : new URL(candidate, target.origin);
			} catch (cause) {
				void cause;
				return candidate;
			}
			return parsed.origin === target.origin && (parsed.username !== "" || parsed.password !== "") ? sanitizeBrowserUrl(candidate).url : candidate;
		};
		escapeRegExp = (value) => value.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&");
		cdpTargetWebSocket = (discovery, target, operation) => {
			const webSocket = availableCdpTargetWebSocket(discovery, target);
			if (webSocket !== undefined) return webSocket;
			throw new BrowserObservationError(operation, "invalid_endpoint_response");
		};
		hasCdpTargetWebSocket = (discovery, target) => availableCdpTargetWebSocket(discovery, target) !== undefined;
		availableCdpTargetWebSocket = (discovery, target) => {
			if (discovery.webSocket.scope === "browser") return discovery.webSocket;
			if (target.webSocket !== undefined) return target.webSocket;
			return discovery.webSocket.targetId === target.id ? discovery.webSocket : undefined;
		};
		parseCdpEndpointValue = (schema, input, operation) => {
			const parsed = schema.safeParse(input);
			if (!parsed.success) throw new BrowserObservationError(operation, "invalid_endpoint_response", { cause: parsed.error });
			return parsed.data;
		};
		safeCdpWebSocketEndpoint = (endpoint, reported, operation) => {
			let parsed;
			try {
				parsed = new URL(reported);
			} catch (cause) {
				throw new BrowserObservationError(operation, "invalid_endpoint_response", { cause });
			}
			const trustedEndpoint = new URL(endpoint);
			const path = cdpWebSocketPath(parsed.pathname);
			if (parsed.protocol !== "ws:" || parsed.port !== trustedEndpoint.port || parsed.username !== "" || parsed.password !== "" || urlDeclaresQueryOrFragment(parsed) || path === undefined) throw new BrowserObservationError(operation, "invalid_endpoint_response");
			parsed.hostname = trustedEndpoint.hostname;
			return path.scope === "browser" ? {
				scope: "browser",
				url: parsed.href
			} : {
				scope: "page",
				targetId: path.targetId,
				url: parsed.href
			};
		};
		cdpWebSocketPath = (pathname) => {
			const browserId = pathIdentifier(pathname, "/devtools/browser/");
			if (browserId !== undefined) return { scope: "browser" };
			const targetId = pathIdentifier(pathname, "/devtools/page/");
			return targetId === undefined ? undefined : {
				scope: "page",
				targetId
			};
		};
		pathIdentifier = (pathname, prefix) => {
			if (!pathname.startsWith(prefix)) return undefined;
			const identifier = pathname.slice(prefix.length);
			return identifier.length > 0 && !identifier.includes("/") ? identifier : undefined;
		};
		targetWebSocket = (endpoint, target, operation) => {
			if (typeof target.webSocketDebuggerUrl !== "string" || target.webSocketDebuggerUrl.length === 0) return {};
			try {
				const webSocket = safeCdpWebSocketEndpoint(endpoint, target.webSocketDebuggerUrl, operation);
				return webSocket.scope === "page" && webSocket.targetId === target.id ? { webSocket } : {};
			} catch (cause) {
				void cause;
				return {};
			}
		};
		readCdpJson = async (url, operation, signal, limits = CDP_DISCOVERY_RESPONSE_LIMITS) => await new Promise((resolve, reject) => {
			if (signal?.aborted === true) {
				reject(new AnalysisCancelledError(operation, { cause: signal.reason }));
				return;
			}
			let response;
			let request_;
			let timer;
			let settled = false;
			const removeAbort = () => signal?.removeEventListener("abort", onAbort);
			const finish = (error, value) => {
				if (settled) return;
				settled = true;
				if (timer !== undefined) clearTimeout(timer);
				removeAbort();
				if (error !== undefined) {
					reject(error);
					response?.destroy();
					request_?.destroy();
				} else resolve(value);
			};
			const onAbort = () => {
				if (signal?.aborted === true) finish(new AnalysisCancelledError(operation, { cause: signal.reason }));
			};
			request_ = request(url, {
				method: "GET",
				headers: { Accept: "application/json" }
			}, (received) => {
				response = received;
				if (settled) {
					received.destroy();
					return;
				}
				if (received.statusCode !== 200) {
					finish(new BrowserObservationError(operation, "invalid_endpoint_response"));
					return;
				}
				const chunks = [];
				let bytes = 0;
				received.on("data", (chunk) => {
					if (settled) return;
					bytes += chunk.byteLength;
					if (bytes > limits.bytes) {
						finish(new BrowserObservationError(operation, "payload_limit", { detail: noRuntimeOverrideSentence(`CDP discovery response exceeds its ${String(limits.bytes)}-byte limit.`, cdpCommandTimeoutUnrelatedControl(operation)) }));
						return;
					}
					chunks.push(chunk);
				});
				received.on("end", () => {
					if (settled) return;
					const parsed = safeParseJson(Buffer.concat(chunks, bytes).toString("utf8"));
					if (!parsed.ok) {
						finish(new BrowserObservationError(operation, "invalid_endpoint_response", { cause: parsed.cause }));
						return;
					}
					finish(undefined, parsed.value);
				});
				received.on("aborted", () => finish(new BrowserObservationError(operation, "invalid_endpoint_response")));
				received.on("close", () => {
					if (!settled && !received.complete) finish(new BrowserObservationError(operation, "invalid_endpoint_response"));
				});
				received.on("error", (cause) => finish(endpointFailure(cause, operation, signal)));
			});
			request_.on("error", (cause) => finish(endpointFailure(cause, operation, signal)));
			signal?.addEventListener("abort", onAbort, { once: true });
			onAbort();
			if (settled) return;
			timer = setTimeout(() => finish(discoveryTimeout(operation, limits.timeoutMs, "response")), limits.timeoutMs);
			request_.end();
		});
		endpointFailure = (cause, operation, signal) => {
			if (cause instanceof AnalysisError) return cause;
			if (signal?.aborted === true) return new AnalysisCancelledError(operation, { cause: signal.reason });
			return new BrowserObservationError(operation, "endpoint_unreachable", { cause });
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCommandRejection.js
var CdpCommandRejection;
function init_CdpCommandRejection() {
	return (init_CdpCommandRejection = __esmMin((() => {
		init_browserObservationError();
		CdpCommandRejection = class extends BrowserObservationError {
			command;
			code;
			reportedMessage;
			constructor(operation, command, code, reportedMessage) {
				super(operation, "protocol_error", { detail: reportedMessage === null ? "CDP returned a malformed command error." : `CDP ${command} failed (${code === null ? "unknown code" : String(code)}): ${reportedMessage}` });
				this.command = command;
				this.code = code;
				this.reportedMessage = reportedMessage;
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpConnection.js
var MAX_WEBSOCKET_PAYLOAD_BYTES, CdpConnection, socketIsClosed, rawText, rawByteLength, isRecord, waitForOpen, terminateSocket;
function init_CdpConnection() {
	return (init_CdpConnection = __esmMin((() => {
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_browserObservationError();
		init_CdpCommandRejection();
		init_browserDeadline();
		init_safeJson();
		init_webRuntime();
		MAX_WEBSOCKET_PAYLOAD_BYTES = 2147483647;
		CdpConnection = class CdpConnection {
			socket;
			operation;
			maxPayloadBytes;
			#pending = new Map();
			#listeners = new Set();
			#disconnectListeners = new Set();
			#protocolFailureListeners = new Set();
			#nextId = 1;
			#closed = false;
			#closePromise;
			#protocolFailed = false;
			#transportFailure = "disconnected";
			#commandTimeoutMs;
			#deadlineKind = "command";
			constructor(socket, operation, maxPayloadBytes, commandTimeoutMs) {
				this.socket = socket;
				this.operation = operation;
				this.maxPayloadBytes = maxPayloadBytes;
				this.#commandTimeoutMs = commandTimeoutMs;
				socket.on("message", (data) => this.#receive(data));
				socket.on("close", () => this.#disconnect());
				socket.on("error", (cause) => this.#disconnect(isRecord(cause) && cause.code === "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH" ? "payload_limit" : "disconnected"));
			}
			/** Connect to one already-validated loopback CDP WebSocket. */
			static async connect(url, operation, signal, limits, onConnected) {
				if (signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: signal.reason });
				const maxPayloadBytes = limits?.maxPayloadBytes ?? WEB_RUNTIME_LIMITS.protocolBytes;
				const commandTimeoutMs = limits?.commandTimeoutMs ?? 2e4;
				const handshakeTimeoutMs = limits?.handshakeTimeoutMs ?? commandTimeoutMs;
				if (!Number.isSafeInteger(maxPayloadBytes) || maxPayloadBytes <= 0 || maxPayloadBytes > MAX_WEBSOCKET_PAYLOAD_BYTES) throw new RangeError(`CDP maxPayloadBytes must be a positive safe integer no greater than ${String(MAX_WEBSOCKET_PAYLOAD_BYTES)}.`);
				const socket = new WebSocket(url, {
					handshakeTimeout: 0,
					maxPayload: maxPayloadBytes,
					perMessageDeflate: false
				});
				const connection = new CdpConnection(socket, operation, maxPayloadBytes, commandTimeoutMs);
				try {
					onConnected?.(connection);
				} catch (cause) {
					await connection.close();
					throw cause;
				}
				try {
					await waitForOpen(socket, operation, signal, handshakeTimeoutMs);
				} catch (cause) {
					if (onConnected === undefined) {
						try {
							await connection.close();
						} catch (cleanupCause) {
							throw new AggregateError([cause, cleanupCause], "CDP WebSocket handshake failed and its transport cleanup is incomplete.", { cause });
						}
					}
					throw cause;
				}
				return connection;
			}
			/** Subscribe to validated CDP event envelopes. */
			onEvent(listener) {
				this.#listeners.add(listener);
				return () => this.#listeners.delete(listener);
			}
			/** Subscribe to an unexpected transport loss while an operation is active. */
			onDisconnect(listener) {
				if (this.#closed) {
					listener(this.#transportError(this.#transportFailure));
					return () => undefined;
				}
				this.#disconnectListeners.add(listener);
				return () => this.#disconnectListeners.delete(listener);
			}
			/** Notify fatal wire parsing failure even when no command is outstanding. */
			onProtocolFailure(listener) {
				if (this.#protocolFailed) {
					listener(this.#transportError("protocol_error"));
					return () => undefined;
				}
				this.#protocolFailureListeners.add(listener);
				return () => this.#protocolFailureListeners.delete(listener);
			}
			/** Apply the post-discovery command deadline to commands that have not started. */
			selectCommandTimeout(timeoutMs) {
				if (this.#deadlineKind === "cleanup") return;
				this.#commandTimeoutMs = timeoutMs;
			}
			/**
			* Restoration uses the fixed cleanup grace. Commands already waiting are
			* rescheduled from now so a raised command deadline cannot extend them.
			*/
			beginCleanupGrace(timeoutMs) {
				this.#deadlineKind = "cleanup";
				this.#commandTimeoutMs = timeoutMs;
				for (const pending of this.#pending.values()) pending.reschedule(timeoutMs);
			}
			/** Bound each response separately from the caller-selected observation window. */
			async send(method, params = {}, sessionId, signal) {
				if (this.#protocolFailed) throw new BrowserObservationError(this.operation, "protocol_error");
				if (this.#closed || this.socket.readyState !== WebSocket.OPEN) throw this.#transportError(this.#transportFailure);
				if (signal?.aborted === true) throw new AnalysisCancelledError(this.operation, { cause: signal.reason });
				const id = this.#nextId;
				this.#nextId += 1;
				const message = JSON.stringify({
					id,
					method,
					params,
					...sessionId === undefined ? {} : { sessionId }
				});
				return await new Promise((resolve, reject) => {
					const onAbort = () => {
						const pending = this.#pending.get(id);
						if (pending === undefined) return;
						this.#complete(id, pending);
						reject(new AnalysisCancelledError(this.operation, { cause: signal?.reason }));
					};
					const failTimeout = () => {
						const pending = this.#pending.get(id);
						if (pending === undefined) return;
						this.#complete(id, pending);
						if (this.#deadlineKind === "cleanup") {
							const detail = cdpCleanupGraceExpired();
							reject(new BrowserObservationError(this.operation, "timeout", {
								detail,
								remediationAction: detail
							}));
							return;
						}
						const recovery = cdpCommandDeadlineRecovery(this.#commandTimeoutMs, "command", method, cdpCommandTimeoutIsSelectable(this.operation));
						reject(new BrowserObservationError(this.operation, "timeout", {
							detail: recovery.userMessage,
							remediationAction: recovery.remediationAction
						}));
					};
					let timer = setTimeout(failTimeout, this.#commandTimeoutMs);
					signal?.addEventListener("abort", onAbort, { once: true });
					this.#pending.set(id, {
						method,
						...sessionId === undefined ? {} : { sessionId },
						resolve,
						reject,
						reschedule: (timeoutMs) => {
							clearTimeout(timer);
							timer = setTimeout(failTimeout, timeoutMs);
						},
						dispose: () => {
							clearTimeout(timer);
							signal?.removeEventListener("abort", onAbort);
						}
					});
					this.socket.send(message, (error) => {
						if (error === undefined || error === null) return;
						const pending = this.#pending.get(id);
						if (pending === undefined) return;
						this.#complete(id, pending);
						reject(new BrowserObservationError(this.operation, "disconnected", { cause: error }));
					});
				});
			}
			/** Close only REA's socket; never close the browser or selected page. */
			close() {
				this.#closePromise ??= this.#closeTransport().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
			async #closeTransport() {
				this.#closed = true;
				this.#failPending("disconnected");
				if (socketIsClosed(this.socket)) return;
				await new Promise((resolve, reject) => {
					let settled = false;
					let fallbackStarted = false;
					let fallbackTimer;
					const finish = (cause) => {
						if (settled) return;
						settled = true;
						clearTimeout(timer);
						if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
						this.socket.off("close", onClose);
						if (cause === undefined) resolve();
						else reject(cause);
					};
					const onClose = () => finish();
					const forceClose = (gracefulFailure) => {
						if (settled || fallbackStarted) return;
						fallbackStarted = true;
						clearTimeout(timer);
						if (socketIsClosed(this.socket)) {
							finish();
							return;
						}
						try {
							this.socket.terminate();
						} catch (cause) {
							gracefulFailure = gracefulFailure === undefined ? cause : new AggregateError([gracefulFailure, cause], "Graceful and forced CDP WebSocket close both failed.", { cause: gracefulFailure });
						}
						if (socketIsClosed(this.socket)) finish();
						else {
							fallbackTimer = setTimeout(() => {
								if (socketIsClosed(this.socket)) {
									finish();
									return;
								}
								finish(gracefulFailure ?? new BrowserObservationError(this.operation, "cleanup_failed", { detail: "REA could not confirm release of its CDP WebSocket." }));
							}, 1e3);
						}
					};
					const timer = setTimeout(() => forceClose(), 1e3);
					this.socket.once("close", onClose);
					try {
						this.socket.close();
					} catch (closeCause) {
						forceClose(closeCause);
					}
				});
			}
			#receive(data) {
				if (this.#closed || this.#protocolFailed) return;
				const parsed = safeParseJson(rawText(data));
				if (!parsed.ok) {
					this.#failPending("protocol_error");
					return;
				}
				const message = parsed.value;
				if (!isRecord(message)) {
					this.#failPending("protocol_error");
					return;
				}
				if ("id" in message) {
					if (typeof message.id !== "number" || !Number.isSafeInteger(message.id) || message.id < 1) {
						this.#failPending("protocol_error");
						return;
					}
					this.#receiveResponse(message, message.id);
					return;
				}
				if (typeof message.method !== "string" || message.method.length === 0 || "params" in message && !isRecord(message.params) || "sessionId" in message && typeof message.sessionId !== "string") {
					this.#failPending("protocol_error");
					return;
				}
				const wireBytes = rawByteLength(data);
				const event = {
					method: message.method,
					params: "params" in message ? message.params : {},
					wireBytes,
					...typeof message.sessionId === "string" ? { sessionId: message.sessionId } : {}
				};
				for (const listener of this.#listeners) listener(event);
			}
			#receiveResponse(message, id) {
				const pending = this.#pending.get(id);
				if (pending === undefined) return;
				const hasResult = "result" in message;
				const hasError = "error" in message;
				const detachedSessionError = pending.sessionId !== undefined && !("sessionId" in message) && hasError && isRecord(message.error) && message.error.code === -32001 && message.error.message === "Session with given id not found.";
				if ((pending.sessionId === undefined ? "sessionId" in message : message.sessionId !== pending.sessionId && !detachedSessionError) || hasResult === hasError) {
					this.#failPending("protocol_error");
					return;
				}
				if (hasResult) {
					if (!isRecord(message.result)) {
						this.#failPending("protocol_error");
						return;
					}
					this.#complete(id, pending);
					pending.resolve(message.result);
					return;
				}
				const reported = message.error;
				if (!isRecord(reported) || typeof reported.code !== "number" || !Number.isSafeInteger(reported.code) || typeof reported.message !== "string") {
					this.#failPending("protocol_error");
					return;
				}
				this.#complete(id, pending);
				pending.reject(new CdpCommandRejection(this.operation, pending.method, reported.code, reported.message));
			}
			#complete(id, pending) {
				pending.dispose();
				this.#pending.delete(id);
			}
			#failPending(reason) {
				const wasProtocolFailed = this.#protocolFailed;
				if (reason !== "protocol_error") this.#closed = true;
				else this.#protocolFailed = true;
				for (const [id, pending] of this.#pending) {
					this.#complete(id, pending);
					pending.reject(this.#transportError(reason));
				}
				if (reason === "protocol_error" && !wasProtocolFailed) {
					const error = this.#transportError(reason);
					for (const listener of this.#protocolFailureListeners) listener(error);
					this.#protocolFailureListeners.clear();
				}
			}
			#disconnect(reason = "disconnected") {
				const wasClosed = this.#closed;
				if (!wasClosed) this.#transportFailure = reason;
				this.#failPending(reason);
				if (wasClosed) return;
				const error = this.#transportError(reason);
				for (const listener of this.#disconnectListeners) listener(error);
				this.#disconnectListeners.clear();
			}
			#transportError(reason) {
				return new BrowserObservationError(this.operation, reason, reason === "payload_limit" ? { detail: noRuntimeOverrideSentence(`CDP message exceeded the ${String(this.maxPayloadBytes)} byte protocol budget.`, cdpCommandTimeoutUnrelatedControl(this.operation)) } : undefined);
			}
		};
		socketIsClosed = (socket) => socket.readyState === WebSocket.CLOSED;
		rawText = (data) => Array.isArray(data) ? Buffer.concat(data).toString("utf8") : Buffer.isBuffer(data) ? data.toString("utf8") : Buffer.from(data).toString("utf8");
		rawByteLength = (data) => Array.isArray(data) ? data.reduce((bytes, chunk) => bytes + chunk.byteLength, 0) : data.byteLength;
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		waitForOpen = async (socket, operation, signal, commandTimeoutMs = DEFAULT_CDP_COMMAND_TIMEOUT_MS) => await new Promise((resolve, reject) => {
			const onOpen = () => {
				cleanup();
				resolve();
			};
			const onFailure = (cause) => {
				cleanup();
				reject(new BrowserObservationError(operation, "endpoint_unreachable", { cause }));
			};
			const onClose = (code, reason) => {
				onFailure(new Error(`CDP WebSocket closed before opening (${code}: ${reason.toString("utf8")})`));
			};
			const onAbort = () => {
				cleanup();
				terminateSocket(socket);
				reject(new AnalysisCancelledError(operation, { cause: signal?.reason }));
			};
			const cleanup = () => {
				clearTimeout(timer);
				socket.off("open", onOpen);
				socket.off("error", onFailure);
				socket.off("close", onClose);
				signal?.removeEventListener("abort", onAbort);
			};
			const timer = setTimeout(() => {
				terminateSocket(socket);
				cleanup();
				const recovery = cdpCommandDeadlineRecovery(commandTimeoutMs, "handshake", undefined, cdpCommandTimeoutIsSelectable(operation));
				reject(new BrowserObservationError(operation, "timeout", {
					detail: recovery.userMessage,
					remediationAction: recovery.remediationAction
				}));
			}, commandTimeoutMs);
			socket.once("open", onOpen);
			socket.once("error", onFailure);
			socket.once("close", onClose);
			signal?.addEventListener("abort", onAbort, { once: true });
			if (signal?.aborted === true) onAbort();
		});
		terminateSocket = (socket) => {
			try {
				socket.terminate();
			} catch {}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpTargetSessionOwner.js
var CdpTransportCleanupFailure, bindCdpTransportCleanup, CdpTargetSessionOwner, cleanupError, aggregateCleanupFailures;
function init_CdpTargetSessionOwner() {
	return (init_CdpTargetSessionOwner = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_analysisErrorBase();
		init_providerCleanupError();
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_CdpConnection();
		CdpTransportCleanupFailure = class extends ProviderCleanupError {
			cleanupLeases;
			constructor(cleanupLeases, failure) {
				super("rea-cdp-browser", failure.resources, failure.diagnostics, {
					operation: failure.operation,
					cause: failure.cause
				});
				this.cleanupLeases = cleanupLeases;
				new AnalysisCleanupLeaseGroup(this, cleanupLeases);
			}
		};
		bindCdpTransportCleanup = (cause, failure) => {
			if (cause instanceof CdpTransportCleanupFailure) new AnalysisCleanupLeaseGroup(failure, cause.cleanupLeases);
			return failure;
		};
		CdpTargetSessionOwner = class {
			#connections = new Map();
			#closing = false;
			#admissions = 0;
			#closePromise;
			#admissionWaiters = new Set();
			/** Admit and own one WebSocket from handshake completion onward. */
			async connect(url, operation, options, resource, limits) {
				if (this.#closing) throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
				await this.retryPending();
				if (this.#closing) throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
				if (options.signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: options.signal.reason });
				this.#admissions += 1;
				let connection;
				try {
					return await CdpConnection.connect(url, operation, options.signal, limits, (opened) => {
						connection = opened;
						this.register(opened, operation, resource);
					});
				} catch (cause) {
					if (connection === undefined) throw cause;
					try {
						await this.finish(connection);
					} catch (cleanupCause) {
						if (cause instanceof AnalysisError && cleanupCause instanceof AnalysisError) throw bindCdpTransportCleanup(cleanupCause, analysisErrorWithCleanupFailure(cause, cleanupCause, operation));
						throw new AggregateError([cause, cleanupCause], `CDP operation ${operation} failed during handshake and cleanup remains incomplete.`, { cause });
					}
					throw cause;
				} finally {
					this.#admissions -= 1;
					if (this.#admissions === 0) {
						for (const resolve of this.#admissionWaiters) resolve();
						this.#admissionWaiters.clear();
					}
				}
			}
			/** Register synchronously before awaiting the WebSocket handshake. */
			register(connection, operation, resource) {
				let settle = () => undefined;
				const settled = new Promise((resolve) => {
					settle = resolve;
				});
				this.#connections.set(connection, {
					connection,
					operation,
					resource,
					cleanupLease: new AnalysisCleanupLease(() => connection.close(), [resource]),
					active: true,
					settled,
					settle,
					cleanup: undefined,
					cleanupAttempted: false,
					failure: undefined
				});
			}
			/** Finish one admitted operation, retaining a failed transport for retry. */
			async finish(connection, cleanup) {
				const record = this.#connections.get(connection);
				if (record === undefined) return;
				if (record.failure !== undefined) throw record.failure;
				record.cleanup ??= cleanup;
				try {
					if (!record.cleanupAttempted && record.cleanup !== undefined) {
						record.cleanupAttempted = true;
						await record.cleanup();
					}
					await record.cleanupLease.release();
					this.#connections.delete(connection);
				} catch (cause) {
					const failure = cleanupError(record, cause);
					record.failure = failure;
					throw failure;
				} finally {
					record.active = false;
					record.settle();
				}
			}
			/** Retry only retained failed transports; active peers finish their own cleanup. */
			async close() {
				this.#closing = true;
				this.#closePromise ??= this.#closeAll().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return await this.#closePromise;
			}
			/** Retry retained failures without touching concurrently active sessions. */
			async retryPending() {
				const failures = [];
				for (const record of this.#connections.values()) {
					if (record.active || record.failure === undefined) continue;
					try {
						await record.cleanupLease.release();
						this.#connections.delete(record.connection);
					} catch (cause) {
						const failure = cleanupError(record, cause);
						record.failure = failure;
						failures.push(failure);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw aggregateCleanupFailures(failures);
			}
			async #closeAll() {
				while (this.#admissions > 0) await new Promise((resolve) => this.#admissionWaiters.add(resolve));
				while (true) {
					const active = [...this.#connections.values()].filter(({ active }) => active);
					if (active.length === 0) break;
					await Promise.all(active.map(({ settled }) => settled));
				}
				const failures = [];
				for (const record of this.#connections.values()) {
					try {
						await record.cleanupLease.release();
						this.#connections.delete(record.connection);
					} catch (cause) {
						const failure = cleanupError(record, cause);
						record.failure = failure;
						failures.push(failure);
					}
				}
				if (failures.length === 1) throw failures[0];
				if (failures.length > 1) throw aggregateCleanupFailures(failures);
			}
		};
		cleanupError = (record, cause) => new CdpTransportCleanupFailure([record.cleanupLease], {
			resources: [record.resource],
			operation: record.operation,
			cause,
			diagnostics: { reason: cause instanceof AnalysisError ? cause.userMessage ?? cause.message : cause instanceof Error ? cause.message : String(cause) }
		});
		aggregateCleanupFailures = (failures) => new CdpTransportCleanupFailure(failures.flatMap((failure) => failure.cleanupLeases), {
			resources: failures.flatMap(({ cleanupResources }) => cleanupResources),
			operation: "close_cdp_transports",
			cause: new AggregateError(failures, "One or more REA-owned CDP transports remain open."),
			diagnostics: { failures: failures.map(({ message, diagnostics }) => ({
				message,
				diagnostics: diagnostics ?? {}
			})) }
		});
	})))();
}

//#endregion
//#region dist/browser/CdpTargetSession.js
var openCdpEndpoint, openCdpTargetSession, attachCdpTargetSession, failCdpOpenAfterCleanup, combineOpenFailure, closeCdpTargetSession, cleanupCdpTargetCommands, attachedSessionId;
function init_CdpTargetSession() {
	return (init_CdpTargetSession = __esmMin((() => {
		init_browserDeadline();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_browserObservationError();
		init_CdpConnection();
		init_CdpTargetSessionOwner();
		init_CdpEndpoint();
		openCdpEndpoint = async (endpoint, operation, signal, timeoutMs, owner, commandTimeoutMs) => {
			if (endpoint.transport === "http_discovery") return {
				discovery: await discoverCdpEndpoint(endpoint.url, operation, signal),
				connection: undefined
			};
			const discoveryTimeoutMs = timeoutMs ?? 1e4;
			const discoveryLimits = {
				commandTimeoutMs: discoveryTimeoutMs,
				handshakeTimeoutMs: discoveryTimeoutMs + 1e3
			};
			return await withCdpDiscoveryDeadline(operation, signal, async (deadlineSignal) => {
				const connection = owner === undefined ? await CdpConnection.connect(endpoint.url, operation, deadlineSignal, discoveryLimits) : await owner.connect(endpoint.url, operation, { signal: deadlineSignal }, "browser-endpoint", discoveryLimits);
				try {
					const discovery = await discoverCdpBrowserSocket(connection, endpoint.url, operation, deadlineSignal);
					connection.selectCommandTimeout(commandTimeoutMs ?? 2e4);
					return {
						discovery,
						connection
					};
				} catch (cause) {
					return await failCdpOpenAfterCleanup(connection, cause, operation, owner);
				}
			}, discoveryTimeoutMs);
		};
		openCdpTargetSession = async (discovery, target, operation, signal, limits, owner) => {
			const webSocket = cdpTargetWebSocket(discovery, target, operation);
			const connection = owner === undefined ? await CdpConnection.connect(webSocket.url, operation, signal, limits) : await owner.connect(webSocket.url, operation, signal === undefined ? {} : { signal }, target.id, limits);
			if (webSocket.scope === "page") return {
				connection,
				sessionId: undefined
			};
			try {
				return await attachCdpTargetSession(connection, target, operation, signal, owner);
			} catch (cause) {
				if (owner === undefined) throw cause;
				return await failCdpOpenAfterCleanup(connection, cause, operation, owner);
			}
		};
		attachCdpTargetSession = async (connection, target, operation, signal, owner) => {
			try {
				const attached = await connection.send("Target.attachToTarget", {
					targetId: target.id,
					flatten: true
				}, undefined, signal);
				return {
					connection,
					sessionId: attachedSessionId(attached, operation)
				};
			} catch (cause) {
				if (owner === undefined) return await failCdpOpenAfterCleanup(connection, cause, operation);
				throw cause;
			}
		};
		failCdpOpenAfterCleanup = async (connection, primary, operation, owner) => {
			try {
				if (owner === undefined) await connection.close();
				else await owner.finish(connection);
			} catch (cleanup) {
				throw combineOpenFailure(primary, cleanup, operation);
			}
			throw primary;
		};
		combineOpenFailure = (primary, cleanup, operation) => primary instanceof AnalysisError && cleanup instanceof AnalysisError ? bindCdpTransportCleanup(cleanup, analysisErrorWithCleanupFailure(primary, cleanup, operation)) : new AggregateError([primary, cleanup], `CDP operation ${operation} failed and its transport cleanup is incomplete.`, { cause: primary });
		closeCdpTargetSession = async (targetSession, enabledDomains, signal, owner) => {
			if (owner !== undefined) {
				await owner.finish(targetSession.connection, () => cleanupCdpTargetCommands(targetSession, enabledDomains, signal));
				return;
			}
			await cleanupCdpTargetCommands(targetSession, enabledDomains, signal);
			await targetSession.connection.close();
		};
		cleanupCdpTargetCommands = async (targetSession, enabledDomains, signal) => {
			const { connection, sessionId } = targetSession;
			const cleanup = new AbortController();
			const domainSignal = signal === undefined ? cleanup.signal : AbortSignal.any([cleanup.signal, signal]);
			const timeout = setTimeout(() => cleanup.abort(), 1e3);
			timeout.unref();
			try {
				if (signal?.aborted !== true) {
					for (const domain of enabledDomains) {
						if (domainSignal.aborted) break;
						try {
							await connection.send(`${domain}.disable`, {}, sessionId, domainSignal);
						} catch {}
					}
				}
				if (!cleanup.signal.aborted && sessionId !== undefined) try {
					await connection.send("Target.detachFromTarget", { sessionId }, undefined, cleanup.signal);
				} catch {}
			} finally {
				clearTimeout(timeout);
				cleanup.abort();
			}
		};
		attachedSessionId = (value, operation) => {
			if (typeof value !== "object" || value === null || !("sessionId" in value) || typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new BrowserObservationError(operation, "protocol_error");
			return value.sessionId;
		};
	})))();
}

//#endregion
export { CdpCommandRejection, CdpTargetSessionOwner, attachCdpTargetSession, bindCdpTransportCleanup, closeCdpTargetSession, discoverCdpEndpoint, failCdpOpenAfterCleanup, hasCdpTargetWebSocket, init_CdpCommandRejection, init_CdpConnection, init_CdpDiscoveryTargets, init_CdpEndpoint, init_CdpTargetSession, init_CdpTargetSessionOwner, openCdpEndpoint, openCdpTargetSession, parseCdpDiscoveryTargets, parseCdpEndpointValue, readCdpJson, withCdpDiscoveryDeadline };