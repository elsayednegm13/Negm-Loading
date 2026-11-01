import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_analysisErrorBase, t as AnalysisError } from "./analysisErrorBase-BNnZv0cP.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { l as init_asarHeaderAdmission, s as DEFAULT_ASAR_HEADER_ADMISSION } from "./captureDecoderHeap-DoJoGgQ5.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-Cl6H9zyu.js";
import { A as init_browserObservationError, O as BrowserObservationError, b as init_providerAdapterError, y as ProviderAdapterError } from "./analysisErrorProjection-CbRgJX1L.js";
import { n as urlDeclaresQueryOrFragment, t as init_urlComponents } from "./urlComponents-CGbK3-fc.js";
import { $i as javascriptRuntimeTargetListSchema, Qi as javascriptRuntimeObservationSchema, Zi as init_javascriptRuntimeObservation$1, _i as runtimeAsarHeaderAdmission, hi as init_runtimeAnalysisSettings } from "./createServer-CoLFsKLA.js";
import { c as browserOriginSchema, g as sanitizeBrowserUrl, l as init_browserObservation } from "./webContentArtifact-uGXrWU6X.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-DuTTn95O.js";
import { n as init_providerCleanupError, t as ProviderCleanupError } from "./providerCleanupError-PIbKEUeE.js";
import { _ as parseCdpDiscoveryTargets, f as init_CdpEndpoint, g as init_CdpDiscoveryTargets, m as readCdpJson, n as bindCdpTransportCleanup, p as parseCdpEndpointValue, r as init_CdpTargetSessionOwner, t as CdpTargetSessionOwner } from "./CdpTargetSessionOwner--fX5UnbH.js";
import { a as init_CdpCaptureValues, c as recordValue, i as delayWithCancellation, p as scriptMetadataValues, r as cdpStringValue, s as numberValue } from "./CdpCaptureValues-D79UwkrA.js";
import { i as retryElectronFileCleanup, n as init_ElectronFileScope, r as mapElectronFileAuthorizationFailure, t as authorizedElectronFile } from "./ElectronFileScope-BBF15uEa.js";
import { i as init_providerIdentity, r as V8_INSPECTOR_PROVIDER_IDENTITY } from "./eagerRuntime-uxW_nSgG.js";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { createHash } from "node:crypto";

//#region dist/inspector/JavaScriptRuntimeScope.js
var throwIfRuntimeObservationCancelled, inspectorExclusionKey, authorizeRuntimeLocation, projectReportedRuntimeUrl, authorizeRuntimeTargetLocation;
function init_JavaScriptRuntimeScope() {
	return (init_JavaScriptRuntimeScope = __esmMin((() => {
		init_asarHeaderAdmission();
		init_browserObservation();
		init_analysisErrorCore();
		init_ElectronFileScope();
		throwIfRuntimeObservationCancelled = (signal, operation = "observe_javascript_runtime") => {
			if (signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: signal.reason });
		};
		inspectorExclusionKey = (reason) => {
			void reason;
			return "unsupported_location";
		};
		authorizeRuntimeLocation = async (value, signal, operation = "observe_javascript_runtime", asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) => {
			throwIfRuntimeObservationCancelled(signal, operation);
			if (value.startsWith("file:")) {
				const filePath = await authorizedElectronFile(value, signal, operation, asarHeaderAdmission);
				throwIfRuntimeObservationCancelled(signal, operation);
				return filePath === undefined ? {
					allowed: false,
					reason: "not_approved"
				} : {
					allowed: true,
					location: {
						kind: "file",
						file_path: filePath
					}
				};
			}
			return projectReportedRuntimeUrl(value);
		};
		projectReportedRuntimeUrl = (value) => {
			if (value.startsWith("node:") && value.length > 0) return {
				allowed: true,
				location: {
					kind: "builtin",
					specifier: value
				}
			};
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return {
					allowed: false,
					reason: "unsupported_url"
				};
			}
			if (!["http:", "https:"].includes(url.protocol)) return {
				allowed: false,
				reason: "unsupported_url"
			};
			const parsedOrigin = browserOriginSchema.safeParse(url.origin);
			if (!parsedOrigin.success) return {
				allowed: false,
				reason: "unsupported_url"
			};
			return {
				allowed: true,
				location: {
					kind: "url",
					origin: parsedOrigin.data,
					sanitized_url: sanitizeBrowserUrl(value).url
				}
			};
		};
		authorizeRuntimeTargetLocation = async (value, context, signal, operation = "list_javascript_runtime_targets", asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) => {
			throwIfRuntimeObservationCancelled(signal, operation);
			if (context.type !== "node" || !/^node\.js\/v/iu.test(context.product) || !value.startsWith("file://")) return authorizeRuntimeLocation(value, signal, operation, asarHeaderAdmission);
			const reportedPath = value.slice("file://".length);
			if (!reportedPath.startsWith("/") && !/^[a-z]:[/\\_]/iu.test(reportedPath)) return authorizeRuntimeLocation(value, signal, operation, asarHeaderAdmission);
			if (process.platform !== "win32" && !/[_"\\]/u.test(reportedPath)) {
				if (reportedPath.startsWith("/")) {
					const decision = await authorizeRuntimeLocation(pathToFileURL(reportedPath).href, signal, operation, asarHeaderAdmission);
					if (decision.allowed) return decision;
				}
			}
			return {
				allowed: true,
				location: {
					kind: "unresolved",
					reported_url: value,
					reason: "unverifiable-file-location"
				}
			};
		};
	})))();
}

//#endregion
//#region dist/inspector/V8InspectorCaptureProjection.js
var createInspectorExclusionCounts, describeInspectorTargetLimitations, LOCATION_AUTHORIZATION_WORKERS, finalizeInspectorCapture, invalidContextUnknowns, scriptFromDraft, partialScriptLocation;
function init_V8InspectorCaptureProjection() {
	return (init_V8InspectorCaptureProjection = __esmMin((() => {
		init_JavaScriptRuntimeScope();
		createInspectorExclusionCounts = () => ({ unsupported_location: 0 });
		describeInspectorTargetLimitations = (attachmentStateUnknown = false) => [
			"REA attaches to an already-running exact target. It does not launch the target, evaluate JavaScript, install breakpoints, or send pause/resume commands.",
			"Enabling Debugger can make target-authored debugger statements pause execution; observation does not suppress or resume these pauses.",
			"Only Runtime.enable and Debugger.enable are sent; source text, object values, EventEmitter activity, and Electron IPC are not inspected.",
			"The selected endpoint and target ID authorize observation; discovery file locations can remain unresolved and do not prove filesystem identity.",
			"Node discovery reports a best-effort pathname rather than an encoded file URL; lossy Windows paths and ambiguous underscores are preserved without guessing a file path.",
			"Every target exposed by the selected Inspector endpoint is eligible for observation; target IDs and locations are not authenticated as operating-system process identity.",
			...attachmentStateUnknown ? ["Inspector discovery did not report the target's current debugger attachment state; it is retained as unknown, and observation rejects only targets explicitly marked attached."] : [],
			"No runtime graph depth is traversed because passive Inspector events do not establish require/import caller edges."
		];
		LOCATION_AUTHORIZATION_WORKERS = 8;
		finalizeInspectorCapture = async ({ discoveryLimitations = [], input, runtime, target, state, authorizeLocation = authorizeRuntimeLocation, locationMode = "verify", signal }) => {
			if (locationMode === "verify") throwIfRuntimeObservationCancelled(signal);
			const exclusions = createInspectorExclusionCounts();
			const scripts = new Map();
			const draftsByUrl = new Map();
			if (locationMode === "verify") for (const draft of state.scripts) {
				const drafts = draftsByUrl.get(draft.rawUrl) ?? [];
				drafts.push(draft);
				draftsByUrl.set(draft.rawUrl, drafts);
			}
			const groups = [...draftsByUrl];
			const authorizedGroups = new Array(groups.length);
			let nextGroup = 0;
			let stopScheduling = false;
			const worker = async () => {
				try {
					for (;;) {
						if (stopScheduling) return;
						throwIfRuntimeObservationCancelled(signal);
						const index = nextGroup;
						nextGroup += 1;
						const group = groups[index];
						if (group === undefined) return;
						const [rawUrl, drafts] = group;
						authorizedGroups[index] = {
							drafts,
							decision: await authorizeLocation(rawUrl, signal)
						};
						throwIfRuntimeObservationCancelled(signal);
					}
				} catch (cause) {
					stopScheduling = true;
					throw cause;
				}
			};
			const workerResults = locationMode === "verify" ? await Promise.allSettled(Array.from({ length: Math.min(LOCATION_AUTHORIZATION_WORKERS, groups.length) }, worker)) : [];
			const failedWorker = workerResults.find((result) => result.status === "rejected");
			if (locationMode === "verify") throwIfRuntimeObservationCancelled(signal);
			if (failedWorker?.status === "rejected") throw failedWorker.reason;
			for (const group of authorizedGroups) {
				if (group === undefined) continue;
				const { drafts, decision } = group;
				for (const draft of drafts) {
					if (!decision.allowed) {
						exclusions[inspectorExclusionKey(decision.reason)] += 1;
						continue;
					}
					const script = scriptFromDraft(draft, decision.location);
					scripts.set(script.script_key, script);
				}
			}
			if (locationMode === "reported") for (const draft of state.scripts) {
				const location = partialScriptLocation(draft.rawUrl);
				const script = scriptFromDraft(draft, location);
				scripts.set(script.script_key, script);
			}
			const items = [...scripts.values()].sort((left, right) => left.script_key < right.script_key ? -1 : left.script_key > right.script_key ? 1 : 0);
			const unresolvedScripts = items.filter(({ location }) => location.kind === "unresolved").length;
			const contexts = [...state.contexts.values()].map((context) => ({
				context_key: context.contextKey,
				state: context.state,
				name: context.name,
				origin: context.origin
			})).sort((left, right) => left.context_key < right.context_key ? -1 : left.context_key > right.context_key ? 1 : 0);
			if (locationMode === "verify") throwIfRuntimeObservationCancelled(signal);
			return {
				runtime,
				target: {
					target_id: target.id,
					protocol_type: target.type,
					attached: target.attached,
					location: target.location,
					runtime_kind: input.runtime_kind ?? "unknown",
					runtime_kind_authority: input.runtime_kind === undefined ? "not-declared" : "caller-declared-unverified"
				},
				capture: {
					observation_ms: input.observation_ms,
					events_observed: state.eventsObserved,
					events_retained: state.eventsRetained,
					events_dropped: state.eventsDropped,
					metadata_bytes_retained: state.metadataBytes,
					truncated: state.truncated,
					truncation_reasons: [...state.truncationReasons].sort()
				},
				scripts: {
					items,
					observed_total: state.scriptsObserved,
					parse_failed_total: state.parseFailedScripts,
					excluded: {
						...exclusions,
						invalid_protocol_value: state.invalidScripts
					}
				},
				execution_contexts: contexts,
				directly_observed: ["Debugger.scriptParsed established script presence within the bounded capture window.", "Runtime execution-context lifecycle events established context creation, destruction, or clearing."],
				unavailable_without_instrumentation: [
					"require/import caller-to-callee edges",
					"EventEmitter emissions and listener invocation",
					"Electron IPC messages and handlers",
					"script unload events"
				],
				unknowns: [
					...target.location.kind === "unresolved" ? ["The discovery-reported file location cannot be verified; loaded script locations are resolved independently from Debugger.scriptParsed."] : [],
					...unresolvedScripts === 0 ? [] : [`${String(unresolvedScripts)} observed script location${unresolvedScripts === 1 ? " remains" : "s remain"} unverified; raw URLs and script metadata are retained.`],
					...invalidContextUnknowns(state.invalidContexts),
					"Scripts collected before attachment may have been garbage-collected and therefore omitted.",
					"A bounded observation window cannot establish that an unobserved script or behavior never occurs.",
					"The declared Node/Electron process role is not authenticated by the Inspector protocol."
				],
				limitations: [...discoveryLimitations, ...describeInspectorTargetLimitations(target.attached === null)]
			};
		};
		invalidContextUnknowns = (count) => count === 0 ? [] : [`${String(count)} execution-context lifecycle ${count === 1 ? "event with a missing or malformed execution-context ID was" : "events with a missing or malformed execution-context ID were"} excluded; the affected contexts' lifecycle state is unknown.`];
		scriptFromDraft = (draft, location) => {
			const stable = JSON.stringify({
				location,
				...location.kind === "file" ? { reported_url: draft.rawUrl } : {},
				execution_context_key: draft.executionContextKey,
				cdp_hash: draft.cdpHash,
				length: draft.length,
				is_module: draft.isModule
			});
			return {
				script_key: `v8_script_${createHash("sha256").update(stable).digest("hex")}`,
				location,
				...location.kind === "file" ? { reported_url: draft.rawUrl } : {},
				execution_context_key: draft.executionContextKey,
				cdp_hash: draft.cdpHash,
				length: draft.length,
				is_module: draft.isModule,
				status: "observed-loaded"
			};
		};
		partialScriptLocation = (reportedUrl) => {
			const projection = projectReportedRuntimeUrl(reportedUrl);
			if (projection.allowed) return projection.location;
			return {
				kind: "unresolved",
				reported_url: reportedUrl,
				reason: "location-authorization-not-attempted"
			};
		};
	})))();
}

//#endregion
//#region dist/inspector/V8InspectorEndpoint.js
var versionSchema, discoverV8Inspector, validatedInspectorWebSocket;
function init_V8InspectorEndpoint() {
	return (init_V8InspectorEndpoint = __esmMin((() => {
		init_browserObservationError();
		init_urlComponents();
		init_CdpEndpoint();
		init_CdpDiscoveryTargets();
		versionSchema = z.object({
			Browser: z.string().min(1),
			"Protocol-Version": z.string().min(1),
			"V8-Version": z.string().optional()
		}).passthrough();
		discoverV8Inspector = async (endpoint, operation, signal) => {
			const [versionInput, targetsInput] = await Promise.all([readCdpJson(new URL("/json/version", endpoint), operation, signal), readCdpJson(new URL("/json/list", endpoint), operation, signal)]);
			const version = parseCdpEndpointValue(versionSchema, versionInput, operation);
			const { targets, limitations } = parseCdpDiscoveryTargets(targetsInput, operation);
			return {
				limitations,
				runtime: {
					product: version.Browser,
					protocol_version: version["Protocol-Version"],
					v8_version: version["V8-Version"] ?? null
				},
				targets: targets.map((target) => ({
					id: target.id,
					type: target.type,
					url: target.url,
					attached: target.attached ?? null,
					webSocketUrl: validatedInspectorWebSocket(endpoint, target.id, target.webSocketDebuggerUrl)
				}))
			};
		};
		validatedInspectorWebSocket = (endpoint, targetId, reported) => {
			if (typeof reported !== "string" || reported.length === 0) return null;
			let socket;
			try {
				socket = new URL(reported);
			} catch {
				return null;
			}
			const trusted = new URL(endpoint);
			const allowedPaths = new Set([
				`/${targetId}`,
				`/devtools/node/${targetId}`,
				`/devtools/page/${targetId}`
			]);
			if (socket.protocol !== "ws:" || socket.port !== trusted.port || socket.username !== "" || socket.password !== "" || urlDeclaresQueryOrFragment(socket) || !allowedPaths.has(socket.pathname)) return null;
			socket.hostname = trusted.hostname;
			return socket.href;
		};
	})))();
}

//#endregion
//#region dist/inspector/V8InspectorProvider.js
var inspectorConnections, inspectorActiveOperations, inspectorClosing, inspectorClosePromise, inspectorIdleWaiters, withInspectorAdmission, closeInspectorResources, INSPECTOR_MAX_PAYLOAD_BYTES, INSPECTOR_MAX_RETAINED_METADATA_BYTES, RETAINED_OBJECT_OVERHEAD_BYTES, V8InspectorProvider, projectTarget, authorizedTarget, assertRuntimeKind, emptyCaptureState, ingestEvent, ingestScript, ingestContext, retainEvent, replaceRetainedMetadata, waitForCapture, retainedMetadataBytes, contextKey, providerError;
function init_V8InspectorProvider() {
	return (init_V8InspectorProvider = __esmMin((() => {
		init_asarHeaderAdmission();
		init_javascriptRuntimeObservation$1();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_browserObservationError();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_result();
		init_CdpCaptureValues();
		init_ElectronFileScope();
		init_CdpTargetSessionOwner();
		init_JavaScriptRuntimeScope();
		init_V8InspectorCaptureProjection();
		init_V8InspectorEndpoint();
		init_providerIdentity();
		inspectorConnections = new CdpTargetSessionOwner();
		inspectorActiveOperations = 0;
		inspectorClosing = false;
		;
		inspectorIdleWaiters = new Set();
		withInspectorAdmission = async (operation, work) => {
			if (inspectorClosing && inspectorClosePromise !== undefined) await inspectorClosePromise;
			if (inspectorClosing) throw new ProviderAdapterError(V8_INSPECTOR_PROVIDER_IDENTITY.id, operation, {
				diagnostics: { reason: "provider_closing" },
				userMessage: "Inspector provider cleanup is in progress."
			});
			inspectorActiveOperations += 1;
			try {
				return await work();
			} finally {
				inspectorActiveOperations -= 1;
				if (inspectorActiveOperations === 0) {
					for (const resolve of inspectorIdleWaiters) resolve();
					inspectorIdleWaiters.clear();
				}
			}
		};
		closeInspectorResources = async () => {
			inspectorClosing = true;
			try {
				while (inspectorActiveOperations > 0) await new Promise((resolve) => inspectorIdleWaiters.add(resolve));
				const failures = [];
				try {
					await inspectorConnections.retryPending();
				} catch (cause) {
					failures.push(providerError(cause, "observe_javascript_runtime"));
				}
				try {
					await retryElectronFileCleanup();
				} catch (cause) {
					failures.push(providerError(cause, "observe_javascript_runtime"));
				}
				if (failures.length === 0) return;
				if (failures.length === 1) throw failures[0];
				const cleanup = new ProviderCleanupError(V8_INSPECTOR_PROVIDER_IDENTITY.id, failures.flatMap(({ cleanupResources }) => cleanupResources), { reason: "Inspector provider cleanup remains incomplete." }, {
					operation: "observe_javascript_runtime",
					cause: new AggregateError(failures, "Inspector provider cleanup owners remain unresolved.")
				});
				cleanup.bindCleanupDependencies(failures);
				throw cleanup;
			} finally {
				inspectorClosing = false;
			}
		};
		INSPECTOR_MAX_PAYLOAD_BYTES = 16 * 1024 * 1024;
		INSPECTOR_MAX_RETAINED_METADATA_BYTES = 8 * 1024 * 1024;
		RETAINED_OBJECT_OVERHEAD_BYTES = 512;
		V8InspectorProvider = class {
			#asarHeaderAdmission;
			/** The admission comes from the composition root's environment; default otherwise. */
			constructor(asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) {
				this.#asarHeaderAdmission = asarHeaderAdmission;
			}
			identity() {
				return V8_INSPECTOR_PROVIDER_IDENTITY;
			}
			async close() {
				if (inspectorClosePromise !== undefined) return await inspectorClosePromise;
				const attempt = closeInspectorResources();
				inspectorClosePromise = attempt;
				try {
					await attempt;
				} finally {
					if (inspectorClosePromise === attempt) inspectorClosePromise = undefined;
				}
			}
			async listTargets(input, options = {}) {
				try {
					return await withInspectorAdmission("list_javascript_runtime_targets", () => this.#listTargets(input, options));
				} catch (cause) {
					return err(providerError(cause, "list_javascript_runtime_targets"));
				}
			}
			async #listTargets(input, options) {
				let discovery;
				const allowed = [];
				const excluded = createInspectorExclusionCounts();
				let unconnectable = 0;
				let targetsExamined = 0;
				try {
					throwIfRuntimeObservationCancelled(options.signal, "list_javascript_runtime_targets");
					await retryElectronFileCleanup();
					discovery = await discoverV8Inspector(input.inspector_endpoint, "list_javascript_runtime_targets", options.signal);
					for (const target of discovery.targets) {
						throwIfRuntimeObservationCancelled(options.signal, "list_javascript_runtime_targets");
						const decision = await authorizeRuntimeTargetLocation(target.url, {
							type: target.type,
							product: discovery.runtime.product
						}, options.signal, "list_javascript_runtime_targets", this.#asarHeaderAdmission);
						if (!decision.allowed) {
							excluded[inspectorExclusionKey(decision.reason)] += 1;
							targetsExamined += 1;
							continue;
						}
						if (decision.location.kind === "builtin") {
							excluded.unsupported_location += 1;
							targetsExamined += 1;
							continue;
						}
						if (target.webSocketUrl === null) {
							unconnectable += 1;
							targetsExamined += 1;
							continue;
						}
						allowed.push({
							id: target.id,
							type: target.type,
							url: target.url,
							attached: target.attached,
							webSocketUrl: target.webSocketUrl,
							location: decision.location
						});
						targetsExamined += 1;
					}
					allowed.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
					throwIfRuntimeObservationCancelled(options.signal, "list_javascript_runtime_targets");
					return ok(javascriptRuntimeTargetListSchema.parse({
						runtime: discovery.runtime,
						targets: allowed.map(projectTarget),
						excluded: {
							...excluded,
							unconnectable
						},
						limitations: [...discovery.limitations, ...describeInspectorTargetLimitations(allowed.some((target) => target.attached === null))]
					}));
				} catch (cause) {
					if (cause instanceof AnalysisCancelledError && discovery !== undefined) {
						const complete = targetsExamined === discovery.targets.length;
						const limitations = [...discovery.limitations, ...describeInspectorTargetLimitations(allowed.some((target) => target.attached === null))];
						return err(new AnalysisCancelledError("list_javascript_runtime_targets", {
							cause: cause.cause,
							diagnostics: { completed_target_inventory: {
								runtime: discovery.runtime,
								targets: allowed.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0).map(projectTarget),
								excluded: {
									...excluded,
									unconnectable
								},
								targets_examined: targetsExamined,
								targets_discovered: discovery.targets.length,
								complete,
								limitations: complete ? limitations : [...limitations, "Cancellation stopped target authorization; unexamined targets are unknown, not excluded."]
							} }
						}));
					}
					return err(providerError(cause, "list_javascript_runtime_targets"));
				}
			}
			async observe(input, options = {}) {
				try {
					return await withInspectorAdmission("observe_javascript_runtime", () => this.#observe(input, options));
				} catch (cause) {
					return err(providerError(cause, "observe_javascript_runtime"));
				}
			}
			async #observe(input, options) {
				let connection;
				let discovery;
				let target;
				let state;
				let cleanupFailure;
				let cleanupFailed = false;
				let connectionClosePromise;
				let outcome;
				const closeConnection = () => {
					if (connection === undefined) return Promise.resolve();
					const ownedConnection = connection;
					connectionClosePromise ??= inspectorConnections.finish(ownedConnection);
					return connectionClosePromise;
				};
				try {
					throwIfRuntimeObservationCancelled(options.signal);
					await inspectorConnections.retryPending();
					await retryElectronFileCleanup();
					discovery = await discoverV8Inspector(input.inspector_endpoint, "observe_javascript_runtime", options.signal);
					target = await authorizedTarget(discovery.targets, input, discovery.runtime.product, this.#asarHeaderAdmission, options.signal);
					if (input.runtime_kind !== undefined) assertRuntimeKind(target, input.runtime_kind);
					throwIfRuntimeObservationCancelled(options.signal);
					connection = await inspectorConnections.connect(target.webSocketUrl, "observe_javascript_runtime", options, "browser_transport", { maxPayloadBytes: INSPECTOR_MAX_PAYLOAD_BYTES });
					const captureState = emptyCaptureState();
					state = captureState;
					const removeListener = connection.onEvent((event) => ingestEvent(event, captureState));
					try {
						await connection.send("Runtime.enable", {}, undefined, options.signal);
						await connection.send("Debugger.enable", {}, undefined, options.signal);
						await waitForCapture(connection, input.observation_ms, options.signal);
					} finally {
						removeListener();
					}
					const result = await finalizeInspectorCapture({
						input,
						runtime: discovery.runtime,
						discoveryLimitations: discovery.limitations,
						target,
						state: captureState,
						authorizeLocation: (rawUrl, signal) => authorizeRuntimeLocation(rawUrl, signal, "observe_javascript_runtime", this.#asarHeaderAdmission),
						...options.signal === undefined ? {} : { signal: options.signal }
					});
					outcome = ok(javascriptRuntimeObservationSchema.parse(result));
				} catch (cause) {
					const error = providerError(cause, "observe_javascript_runtime");
					if (state !== undefined && discovery !== undefined && target !== undefined) {
						try {
							const partialObservation = await finalizeInspectorCapture({
								input,
								runtime: discovery.runtime,
								discoveryLimitations: discovery.limitations,
								target,
								state,
								locationMode: "reported"
							});
							error.retainPartialObservation(partialObservation);
						} catch (projectionFailure) {
							error.retainSecondaryFailure(new ProviderAdapterError(V8_INSPECTOR_PROVIDER_IDENTITY.id, "observe_javascript_runtime", {
								cause: projectionFailure,
								userMessage: "Inspector partial observations could not be projected."
							}));
						}
					}
					outcome = err(error);
				} finally {
					if (connection !== undefined) try {
						await closeConnection();
					} catch (cause) {
						cleanupFailed = true;
						cleanupFailure = cause;
					}
				}
				if (options.signal?.aborted === true && outcome?.ok === true) {
					const cancellation = new AnalysisCancelledError("observe_javascript_runtime", {
						cause: options.signal.reason,
						partialObservation: outcome.value
					});
					outcome = err(cancellation);
				}
				if (cleanupFailed) {
					const cleanup = cleanupFailure instanceof AnalysisError ? cleanupFailure : providerError(cleanupFailure, "observe_javascript_runtime");
					const primary = outcome?.ok === false ? outcome.error : undefined;
					const partialObservation = outcome?.ok === true ? outcome.value : outcome?.ok === false ? outcome.error.partialObservation : undefined;
					if (primary === undefined) {
						if (partialObservation !== undefined) cleanup.retainPartialObservation(partialObservation);
						return err(bindCdpTransportCleanup(cleanupFailure, cleanup));
					}
					const composed = analysisErrorWithCleanupFailure(primary, cleanup, "observe_javascript_runtime");
					return err(bindCdpTransportCleanup(cleanupFailure, composed));
				}
				return outcome ?? err(new BrowserObservationError("observe_javascript_runtime", "protocol_error"));
			}
		};
		projectTarget = (target) => ({
			target_id: target.id,
			protocol_type: target.type,
			attached: target.attached,
			location: target.location
		});
		authorizedTarget = async (targets, input, product, asarHeaderAdmission, signal) => {
			throwIfRuntimeObservationCancelled(signal);
			const target = targets.find(({ id }) => id === input.target_id);
			if (target === undefined) throw new BrowserObservationError("observe_javascript_runtime", "target_not_found");
			const decision = await authorizeRuntimeTargetLocation(target.url, {
				type: target.type,
				product
			}, signal, "observe_javascript_runtime", asarHeaderAdmission);
			throwIfRuntimeObservationCancelled(signal);
			if (target.attached === true) throw new BrowserObservationError("observe_javascript_runtime", "target_not_allowed", {
				detail: `Inspector target ${target.id} reports attached: true; REA will not displace its debugger.`,
				diagnostics: {
					target_id: target.id,
					attached: true
				},
				remediationAction: "Disconnect the other debugger or select an unattached target, refresh list_javascript_runtime_targets, and retry with its exact target ID."
			});
			if (!decision.allowed || decision.location.kind === "builtin") throw new BrowserObservationError("observe_javascript_runtime", "target_not_allowed", {
				detail: `Inspector target ${target.id} has no supported observable target location.`,
				remediationAction: "Select a target with a supported file or HTTP(S) location from list_javascript_runtime_targets."
			});
			if (target.webSocketUrl === null) throw new BrowserObservationError("observe_javascript_runtime", "invalid_endpoint_response", { detail: "The selected Inspector target has no validated direct WebSocket endpoint." });
			return {
				id: target.id,
				type: target.type,
				url: target.url,
				attached: target.attached,
				webSocketUrl: target.webSocketUrl,
				location: decision.location
			};
		};
		assertRuntimeKind = (target, kind) => {
			const accepted = kind === "electron-preload" || kind === "electron-renderer" ? target.type === "page" : target.type === "node";
			if (!accepted) throw new BrowserObservationError("observe_javascript_runtime", "target_not_allowed", {
				detail: `Declared runtime_kind ${String(kind)} is incompatible with Inspector target ${target.id} protocol type ${target.type}.`,
				diagnostics: {
					target_id: target.id,
					protocol_type: target.type,
					runtime_kind: kind ?? null
				},
				remediationAction: "Correct runtime_kind to match the selected target's protocol type (node for Node or Electron main, page for Electron renderer or preload), or omit runtime_kind to retain an unknown role. The declared role is not authenticated by Inspector."
			});
		};
		emptyCaptureState = () => ({
			scripts: [],
			contexts: new Map(),
			eventsObserved: 0,
			eventsRetained: 0,
			eventsDropped: 0,
			metadataBytes: 0,
			scriptsObserved: 0,
			invalidScripts: 0,
			parseFailedScripts: 0,
			invalidContexts: 0,
			truncated: false,
			truncationReasons: new Set()
		});
		ingestEvent = (event, state) => {
			if (event.method !== "Debugger.scriptParsed" && event.method !== "Debugger.scriptFailedToParse" && event.method !== "Runtime.executionContextCreated" && event.method !== "Runtime.executionContextDestroyed" && event.method !== "Runtime.executionContextsCleared") return;
			state.eventsObserved += 1;
			if (event.method === "Debugger.scriptParsed") {
				ingestScript(event, state);
				return;
			}
			if (event.method === "Debugger.scriptFailedToParse") {
				const params = recordValue(event.params);
				if (typeof params?.scriptId !== "string" || typeof params.url !== "string") {
					state.invalidScripts += 1;
					retainEvent(state, 0);
					return;
				}
				state.parseFailedScripts += 1;
				retainEvent(state, 0);
				return;
			}
			ingestContext(event, state);
		};
		ingestScript = (event, state) => {
			state.scriptsObserved += 1;
			const value = recordValue(event.params);
			const rawUrl = cdpStringValue(value?.url);
			if (rawUrl === undefined) {
				state.invalidScripts += 1;
				retainEvent(state, 0);
				return;
			}
			const metadata = scriptMetadataValues(value);
			const draft = {
				rawUrl,
				executionContextKey: contextKey(value?.executionContextId),
				cdpHash: metadata.hash,
				length: metadata.length,
				isModule: metadata.isModule
			};
			const bytes = retainedMetadataBytes(draft);
			if (!retainEvent(state, bytes)) return;
			state.scripts.push(draft);
		};
		ingestContext = (event, state) => {
			if (event.method === "Runtime.executionContextsCleared") {
				let byteDelta = 0;
				for (const context of state.contexts.values()) {
					byteDelta += retainedMetadataBytes({
						...context,
						state: "cleared"
					}) - retainedMetadataBytes(context);
				}
				if (replaceRetainedMetadata(state, byteDelta)) {
					for (const context of state.contexts.values()) context.state = "cleared";
					retainEvent(state, 0);
				}
				return;
			}
			const parameters = recordValue(event.params);
			const runtimeContext = event.method === "Runtime.executionContextCreated" ? recordValue(parameters?.context) : parameters;
			const key = contextKey(event.method === "Runtime.executionContextCreated" ? runtimeContext?.id : runtimeContext?.executionContextId);
			if (key === null) {
				state.invalidContexts += 1;
				retainEvent(state, 0);
				return;
			}
			const previous = state.contexts.get(key);
			const created = event.method === "Runtime.executionContextCreated";
			const draft = {
				contextKey: key,
				state: created ? "created" : "destroyed",
				name: created ? cdpStringValue(runtimeContext?.name) ?? null : previous?.name ?? null,
				origin: created ? cdpStringValue(runtimeContext?.origin) ?? null : previous?.origin ?? null
			};
			const bytes = retainedMetadataBytes(draft) - (previous === undefined ? 0 : retainedMetadataBytes(previous));
			if (!retainEvent(state, bytes)) return;
			state.contexts.set(key, draft);
		};
		retainEvent = (state, bytes) => {
			if (!replaceRetainedMetadata(state, bytes)) return false;
			state.eventsRetained += 1;
			return true;
		};
		replaceRetainedMetadata = (state, byteDelta) => {
			if (state.metadataBytes + byteDelta > 8388608) {
				state.eventsDropped += 1;
				state.truncated = true;
				state.truncationReasons.add("retained_metadata_budget_exceeded");
				return false;
			}
			state.metadataBytes += byteDelta;
			return true;
		};
		waitForCapture = async (connection, observationMs, signal) => {
			let removeDisconnect = () => undefined;
			let removeProtocolFailure = () => undefined;
			const disconnected = new Promise((_resolve, reject) => {
				removeDisconnect = connection.onDisconnect((error) => reject(error));
			});
			const protocolFailure = new Promise((_resolve, reject) => {
				removeProtocolFailure = connection.onProtocolFailure((error) => reject(error));
			});
			const timerOwner = new AbortController();
			const timerSignal = signal === undefined ? timerOwner.signal : AbortSignal.any([signal, timerOwner.signal]);
			try {
				await Promise.race([
					delayWithCancellation(observationMs, "observe_javascript_runtime", timerSignal),
					disconnected,
					protocolFailure
				]);
			} finally {
				timerOwner.abort();
				removeDisconnect();
				removeProtocolFailure();
			}
		};
		retainedMetadataBytes = (value) => {
			const strings = "rawUrl" in value ? [
				value.rawUrl,
				value.rawUrl,
				value.executionContextKey,
				value.cdpHash
			] : [
				value.contextKey,
				value.name,
				value.origin
			];
			return RETAINED_OBJECT_OVERHEAD_BYTES + strings.reduce((total, text) => total + (text?.length ?? 0) * 2, 0);
		};
		contextKey = (value) => {
			const identifier = numberValue(value);
			return identifier !== undefined && Number.isSafeInteger(identifier) ? String(identifier) : null;
		};
		providerError = (cause, operation) => {
			const fileFailure = operation === "observe_javascript_runtime" || operation === "list_javascript_runtime_targets" ? mapElectronFileAuthorizationFailure(cause, V8_INSPECTOR_PROVIDER_IDENTITY.id, operation) : undefined;
			if (fileFailure !== undefined) return fileFailure;
			if (cause instanceof AnalysisError) return cause;
			return new ProviderAdapterError(V8_INSPECTOR_PROVIDER_IDENTITY.id, operation, { cause });
		};
	})))();
}

//#endregion
//#region dist/composition/javascriptRuntimeObservation.js
var createJavaScriptRuntimeObservationProvider;
function init_javascriptRuntimeObservation() {
	return (init_javascriptRuntimeObservation = __esmMin((() => {
		init_runtimeAnalysisSettings();
		init_V8InspectorProvider();
		createJavaScriptRuntimeObservationProvider = (environment, settings) => new V8InspectorProvider(runtimeAsarHeaderAdmission(environment, settings));
	})))();
}

//#endregion
init_javascriptRuntimeObservation();
export { createJavaScriptRuntimeObservationProvider };