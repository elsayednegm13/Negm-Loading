import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { electronActiveObservationResultSchema, electronActiveProcessMetricSchema, electronActiveTimelineEventSchema, electronActiveWindowSchema, init_electronActiveObservation } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisError, AnalysisUnsupportedTargetError, err, init_analysisErrorBase, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { BrowserObservationError, ProviderAdapterError, init_browserObservationError, init_providerAdapterError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-PV1DaSaC.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { ProcessOwnershipEvidenceOwner, init_ProcessOwnershipEvidence, init_ProcessOwnershipObservation, init_ProcessOwnershipProcessTree, observeOwnedProcessLineage, prepareProcessOwnershipInspection, selectCapturedProcessGroupIds, systemProcessOwnershipHost } from "./ProcessOwnershipEvidence-DNSlHo8A.js";
import { cleanupOwnedProcessGroup, cleanupWindowsProcessTree, init_ProcessOwnership, verifyNoTokenOwnedProcesses } from "./ProcessOwnership-BIq-8nU3.js";
import { PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY, init_providerIdentities } from "./providerIdentities-Ao1XTvwx.js";
import { electronFuseFailure, init_ElectronFuseFailures, init_ElectronFusePath, init_ElectronFuseReader, readElectronFuseImage, resolveElectronFuseTarget } from "./ElectronFuseFailures-CyyR6dWf.js";
import { init_ScenarioActionSequence, notExecutedActionError } from "./ScenarioActionSequence-DrpX1TAG.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

//#region dist/browser/PlaywrightElectronExecution.js
var OPERATION$3, runWithExecutionLimits;
function init_PlaywrightElectronExecution() {
	return (init_PlaywrightElectronExecution = __esmMin((() => {
		init_browserObservationError();
		OPERATION$3 = "capture_electron_scenario";
		runWithExecutionLimits = async (operation, signal, deadline) => {
			if (signal?.aborted === true) {
				void operation.catch(() => undefined);
				throw new BrowserObservationError(OPERATION$3, "cancelled", { cause: signal.reason });
			}
			if (signal === undefined && deadline === undefined) return operation;
			let timer;
			let abortListener;
			const interruptions = [];
			if (deadline !== undefined) interruptions.push(new Promise((_, reject) => {
				timer = setTimeout(() => reject(new BrowserObservationError(OPERATION$3, "timeout")), Math.max(1, deadline - performance.now()));
			}));
			if (signal !== undefined) interruptions.push(new Promise((_, reject) => {
				abortListener = () => reject(new BrowserObservationError(OPERATION$3, "cancelled", { cause: signal.reason }));
				signal.addEventListener("abort", abortListener, { once: true });
			}));
			try {
				return interruptions.length === 0 ? await operation : await Promise.race([operation, ...interruptions]);
			} finally {
				if (timer !== undefined) clearTimeout(timer);
				if (abortListener !== undefined) signal?.removeEventListener("abort", abortListener);
			}
		};
	})))();
}

//#endregion
//#region dist/browser/ElectronProcessCleanup.js
var cleanupElectronProcesses, verifyFamilyRelease;
function init_ElectronProcessCleanup() {
	return (init_ElectronProcessCleanup = __esmMin((() => {
		init_ProcessOwnership();
		init_ProcessOwnershipObservation();
		init_ProcessOwnershipProcessTree();
		cleanupElectronProcesses = async (ownership, lineage, host = {
			platform: process.platform,
			terminateTree: cleanupWindowsProcessTree,
			processOwnershipHost: systemProcessOwnershipHost
		}) => {
			if (lineage?.status === "verified" && (lineage.lineage.runId !== ownership.runId || lineage.lineage.launcherPid !== ownership.leaderPid || lineage.lineage.processGroupId !== ownership.processGroupId)) {
				return {
					cleaned: false,
					reason: "Electron lineage does not match the retained process owner"
				};
			}
			if (lineage?.status !== "verified") {
				const root = host.platform === "win32" ? {
					cleaned: true,
					signaled: false
				} : await cleanupOwnedProcessGroup(ownership, host.processOwnershipHost);
				if (!root.cleaned) return root;
				if (host.platform !== "win32" && ownership.sweepTokenOwnedProcesses === true) return root;
				const released = await verifyFamilyRelease(ownership, root, host.processOwnershipHost);
				return released.cleaned ? released : {
					...released,
					reason: `${lineage?.reason ?? "owned Electron lineage was not observed"}; helper cleanup was not proven: ${released.reason}`
				};
			}
			if (host.platform === "win32") {
				const root = await host.terminateTree(ownership.leaderPid);
				return root.cleaned ? verifyFamilyRelease(ownership, root, host.processOwnershipHost) : root;
			}
			const groupIds = selectCapturedProcessGroupIds(ownership.leaderPid, lineage.lineage.descendants.map(({ pid, processGroupId }) => ({
				pid,
				process_group_id: processGroupId
			})));
			const sampledProcessGroupIds = [...new Set([...ownership.sampledProcessGroupIds ?? [], ...groupIds])];
			const root = await cleanupOwnedProcessGroup({
				...ownership,
				sampledProcessGroupIds
			}, host.processOwnershipHost);
			if (!root.cleaned) return root;
			return ownership.sweepTokenOwnedProcesses === true ? root : verifyFamilyRelease(ownership, root, host.processOwnershipHost);
		};
		verifyFamilyRelease = async (ownership, root, processHost) => {
			const remaining = await verifyNoTokenOwnedProcesses(ownership.runId, processHost, ownership.captureBaseline, {
				leaderPid: ownership.leaderPid,
				processGroupId: ownership.processGroupId,
				...ownership.sampledProcessGroupIds === undefined ? {} : { sampledProcessGroupIds: ownership.sampledProcessGroupIds },
				evidenceOwner: ownership.evidenceOwner
			});
			const unverified = [...root.unverified ?? [], ...remaining.unverified ?? []];
			if (!remaining.cleaned) return {
				...remaining,
				...unverified.length === 0 ? {} : { unverified }
			};
			return {
				cleaned: true,
				signaled: root.signaled || remaining.signaled,
				...unverified.length === 0 ? {} : { unverified: [...new Map(unverified.map((item) => [`${String(item.pid)}:${item.diagnostic}`, item])).values()] }
			};
		};
	})))();
}

//#endregion
//#region dist/browser/ElectronCaptureCleanup.js
var ElectronCaptureCleanup;
function init_ElectronCaptureCleanup() {
	return (init_ElectronCaptureCleanup = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_ArtifactReader();
		init_ProcessOwnershipObservation();
		init_PlaywrightElectronExecution();
		init_ElectronProcessCleanup();
		ElectronCaptureCleanup = class {
			#transport;
			#processes;
			#ownership;
			#closeOperation;
			#lineage;
			#processResult;
			constructor(application, ownership, lineage) {
				this.#ownership = ownership;
				this.#lineage = lineage;
				this.#transport = new AnalysisCleanupLease(async () => {
					if (this.#closeOperation === undefined) {
						const closing = Promise.resolve().then(() => application.close());
						this.#closeOperation = closing;
						void closing.catch(() => {
							if (this.#closeOperation === closing) this.#closeOperation = undefined;
						});
					}
					await runWithExecutionLimits(this.#closeOperation, undefined, performance.now() + 5e3);
				}, ["browser_transport"]);
				const resources = this.#ownership === undefined ? ["owned_process_group"] : [
					"owned_process_group",
					`run:${this.#ownership.runId}`,
					`process-group:${String(this.#ownership.processGroupId)}`
				];
				this.#processes = new AnalysisCleanupLease(async () => {
					const cleanup = this.#ownership === undefined ? {
						cleaned: false,
						reason: "owned Electron process identity was unavailable"
					} : await this.#cleanupProcesses(this.#ownership);
					this.#processResult = cleanup;
					if (!cleanup.cleaned) throw new ArtifactReaderFailure("unavailable", cleanup.reason, { cleanup: {
						reason: cleanup.reason,
						resources
					} });
				}, resources);
			}
			get processResult() {
				return this.#processResult;
			}
			get pendingResources() {
				return this.#pending.flatMap((lease) => lease.cleanupResources ?? []);
			}
			get #pending() {
				return [this.#transport, this.#processes].filter((lease) => !lease.released);
			}
			async release(scope) {
				const transport = await scope.release({
					kind: "lease",
					resource: "browser_transport",
					lease: this.#transport
				});
				const processes = await scope.release({
					kind: "lease",
					resource: "owned_process_group",
					lease: this.#processes
				});
				return {
					transport,
					processes
				};
			}
			bind(error) {
				new AnalysisCleanupLeaseGroup(error, this.#pending);
			}
			async #cleanupProcesses(ownership) {
				const current = await observeOwnedProcessLineage(ownership);
				if (current.status === "verified") this.#lineage = current;
				return cleanupElectronProcesses(ownership, process.platform === "win32" ? current : this.#lineage ?? current);
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightElectronActiveActions.js
var OPERATION$2, CANCELLED_STATE_READ_TIMEOUT_MS, GRACE_EXPIRED, retention, hookSnapshotSchema, runElectronActions, ownActionWindow, releaseActionWindow, runAction, actionWindowIndex, waitForWindow, emitDeepLink, readApplicationState, readFinalApplicationState, safeActionErrorMessage;
function init_PlaywrightElectronActiveActions() {
	return (init_PlaywrightElectronActiveActions = __esmMin((() => {
		init_PlaywrightElectronExecution();
		init_providerCleanupError();
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_browserObservationError();
		init_electronActiveObservation();
		init_ScenarioActionSequence();
		OPERATION$2 = "capture_electron_scenario";
		CANCELLED_STATE_READ_TIMEOUT_MS = 5e3;
		GRACE_EXPIRED = Symbol("cancellation grace expired");
		retention = electronActiveObservationResultSchema.shape.retention.shape;
		hookSnapshotSchema = z.strictObject({
			events: z.array(electronActiveTimelineEventSchema),
			retention_budget_bytes: retention.budget_bytes,
			estimated_retained_bytes: retention.estimated_retained_bytes,
			event_serialized_byte_upper_bound: retention.event_serialized_byte_upper_bound,
			retained: retention.retained,
			dropped: retention.dropped,
			dropped_ipc: retention.dropped_ipc,
			dropped_runtime: retention.dropped_runtime,
			dropped_event_families: retention.dropped_event_families,
			dropped_event_roles: retention.dropped_event_roles,
			observed: z.int().min(0),
			observed_ipc: retention.observed_ipc,
			observed_runtime: retention.observed_runtime,
			hook_error: z.boolean()
		});
		runElectronActions = async (application, input, options, resources) => {
			const actions = [];
			let cleanupError;
			let stoppedBy;
			for (const action of input.actions) {
				const actionStartedAt = performance.now();
				const windowIndex = actionWindowIndex(action);
				if (stoppedBy !== undefined) {
					actions.push({
						step_id: action.step_id,
						kind: action.kind,
						window_index: windowIndex,
						target: null,
						status: "cancelled",
						elapsed_ms: 0,
						error: notExecutedActionError(stoppedBy)
					});
					continue;
				}
				let selectedWindow;
				let selectedHandle;
				let handleOwner;
				let target = null;
				let actionError = null;
				try {
					if (options.signal?.aborted === true) throw new BrowserObservationError(OPERATION$2, "cancelled");
					selectedWindow = windowIndex === null ? undefined : await waitForWindow({
						application,
						windowIndex,
						signal: options.signal
					});
					if (selectedWindow !== undefined) {
						const selected = ownActionWindow(application, selectedWindow, resources);
						handleOwner = selected.owner;
						selectedHandle = await runWithExecutionLimits(selected.handle, options.signal);
						const id = z.int().safe().nonnegative().parse(await runWithExecutionLimits(selectedHandle.evaluate((window) => window.id), options.signal));
						target = `window:${String(id)}`;
					}
					await runAction({
						application,
						action,
						selectedWindow,
						selectedHandle,
						options
					});
				} catch (cause) {
					stoppedBy = options.signal?.aborted ? "cancelled" : "failed";
					actionError = safeActionErrorMessage(cause);
				}
				const outcome = actionError === null ? {
					status: "completed",
					error: null
				} : {
					status: stoppedBy ?? "failed",
					error: actionError
				};
				actions.push({
					step_id: action.step_id,
					kind: action.kind,
					window_index: windowIndex,
					target,
					...outcome,
					elapsed_ms: Math.max(0, Math.round(performance.now() - actionStartedAt))
				});
				if (handleOwner !== undefined) {
					cleanupError = await releaseActionWindow(resources, handleOwner, stoppedBy ?? "completed", options.signal);
					if (cleanupError !== undefined) stoppedBy = "failed";
				}
			}
			return {
				actions,
				...cleanupError === undefined ? {} : { cleanupError }
			};
		};
		ownActionWindow = (application, page, resources) => {
			const handle = Promise.resolve().then(() => application.browserWindow(page));
			let disposing;
			const owner = {
				kind: "lease",
				resource: "selected Electron BrowserWindow handle",
				lease: { release: async () => {
					if (disposing === undefined) {
						const attempt = handle.then((selected) => selected.dispose(), () => undefined);
						disposing = attempt;
						void attempt.catch(() => {
							if (disposing === attempt) disposing = undefined;
						});
					}
					await runWithExecutionLimits(disposing, undefined, performance.now() + CANCELLED_STATE_READ_TIMEOUT_MS);
				} }
			};
			resources.retain(owner);
			return {
				handle,
				owner
			};
		};
		releaseActionWindow = async (resources, owner, actionStatus, signal) => {
			const released = await resources.release(owner);
			if (released.kind === "released") return undefined;
			const error = new ProviderCleanupError("playwright-electron-active", released.lease.cleanupResources ?? [owner.resource], { reason: safeActionErrorMessage(released.cause) }, {
				cause: released.cause,
				operation: OPERATION$2
			});
			error.bindCleanupResourceOwner(released.lease);
			released.lease.bindCleanupError(error);
			if (!signal?.aborted) return error;
			const cancellation = new AnalysisCancelledError(OPERATION$2, { cause: signal.reason });
			return actionStatus === "failed" ? error.retainSecondaryFailure(cancellation) : analysisErrorWithCleanupFailure(cancellation, error, OPERATION$2).bindCleanupDependencies([cancellation, error]);
		};
		runAction = async ({ application, action, selectedWindow, selectedHandle, options }) => {
			switch (action.kind) {
				case "click":
					if (selectedWindow === undefined) throw new BrowserObservationError(OPERATION$2, "window_not_found");
					await runWithExecutionLimits(selectedWindow.locator(action.selector).click({ timeout: 0 }), options.signal);
					return;
				case "wait": {
					const page = selectedWindow ?? await runWithExecutionLimits(application.firstWindow({ timeout: 0 }), options.signal);
					await runWithExecutionLimits(page.waitForTimeout(action.duration_ms), options.signal);
					return;
				}
				case "renderer-reload":
					if (selectedWindow === undefined) throw new BrowserObservationError(OPERATION$2, "window_not_found");
					await runWithExecutionLimits(selectedWindow.reload({ timeout: 0 }), options.signal);
					return;
				case "renderer-crash": {
					if (selectedHandle === undefined) throw new BrowserObservationError(OPERATION$2, "window_not_found");
					const crashed = await runWithExecutionLimits(selectedHandle.evaluate((window) => {
						if (window.isDestroyed()) return false;
						window.webContents.forcefullyCrashRenderer();
						return true;
					}), options.signal);
					if (!crashed) throw new BrowserObservationError(OPERATION$2, "window_not_found");
					return;
				}
				case "deep-link":
					await runWithExecutionLimits(emitDeepLink(application, action), options.signal);
					return;
			}
		};
		actionWindowIndex = (action) => {
			switch (action.kind) {
				case "click":
				case "renderer-reload":
				case "renderer-crash": return action.window_index;
				case "wait": return action.window_index ?? null;
				case "deep-link": return null;
			}
		};
		waitForWindow = async ({ application, windowIndex, signal }) => {
			while (true) {
				if (signal?.aborted === true) throw new BrowserObservationError(OPERATION$2, "cancelled");
				const window = application.windows()[windowIndex];
				if (window !== undefined) return window;
				await runWithExecutionLimits(new Promise((resolve) => setTimeout(resolve, 25)), signal);
			}
		};
		emitDeepLink = (application, action) => application.evaluate(({ app }, payload) => {
			if (payload.delivery === "open-url") return app.emit("open-url", { preventDefault: () => undefined }, payload.url);
			return app.emit("second-instance", {}, [payload.url], "", {});
		}, {
			delivery: action.delivery,
			url: action.url
		});
		readApplicationState = async (application) => {
			const windowMetadataPromise = application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map((window) => ({
				window_id: `window:${String(window.id)}`,
				web_contents_id: `webContents:${String(window.webContents.id)}`,
				url: window.webContents.getURL(),
				title: window.webContents.getTitle(),
				visible: window.isDestroyed() ? null : window.isVisible(),
				destroyed: window.isDestroyed()
			}))).then((value) => z.array(electronActiveWindowSchema).parse(value));
			const processMetricsPromise = application.evaluate(({ app }) => app.getAppMetrics().map((metric) => ({
				pid: metric.pid,
				type: metric.type,
				name: metric.name ?? null,
				service_name: metric.serviceName ?? null
			}))).then((value) => z.array(electronActiveProcessMetricSchema).parse(value));
			const electronVersionPromise = application.evaluate(() => process.versions.electron).then((value) => z.string().parse(value));
			const hookSnapshotPromise = application.evaluate(() => {
				const candidate = Reflect.get(globalThis, "__reaElectronActiveSnapshot");
				return typeof candidate === "function" ? candidate() : {
					events: [],
					retention_budget_bytes: 0,
					estimated_retained_bytes: 0,
					event_serialized_byte_upper_bound: 0,
					retained: 0,
					dropped: 0,
					dropped_ipc: 0,
					dropped_runtime: 0,
					dropped_event_families: [],
					dropped_event_roles: [],
					observed: 0,
					observed_ipc: 0,
					observed_runtime: 0,
					hook_error: true
				};
			}).then((value) => hookSnapshotSchema.parse(value));
			const [windowMetadata, processMetrics, electronVersion, hookSnapshot] = await Promise.all([
				windowMetadataPromise,
				processMetricsPromise,
				electronVersionPromise,
				hookSnapshotPromise
			]);
			return {
				windows: windowMetadata,
				metrics: processMetrics,
				electronVersion,
				hookSnapshot
			};
		};
		readFinalApplicationState = async (application, signal) => {
			const state = readApplicationState(application);
			if (signal?.aborted !== true) try {
				return await runWithExecutionLimits(state, signal);
			} catch (cause) {
				if (!(cause instanceof BrowserObservationError) || cause.reason !== "cancelled") throw cause;
			}
			let timer;
			const graceExpired = new Promise((resolve) => {
				timer = setTimeout(() => resolve(GRACE_EXPIRED), CANCELLED_STATE_READ_TIMEOUT_MS);
			});
			try {
				const settled = await Promise.race([state, graceExpired]);
				if (settled !== GRACE_EXPIRED) return settled;
			} finally {
				clearTimeout(timer);
			}
			throw new BrowserObservationError(OPERATION$2, "cancelled", {
				cause: signal?.reason,
				diagnostics: {
					final_state_read: "cancellation_grace_expired",
					cancellation_grace_ms: CANCELLED_STATE_READ_TIMEOUT_MS
				}
			});
		};
		safeActionErrorMessage = (cause) => {
			return cause instanceof Error ? cause.message : "Electron action failed";
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightElectronActiveProjection.js
var observableEventFamilies, ipcEventKinds, eventFamily, normalizeObservations, createCoverage, hasUnattributedDroppedPreloadFamily, hasObservedPreloadConfiguration, projectElectronActiveCapture;
function init_PlaywrightElectronActiveProjection() {
	return (init_PlaywrightElectronActiveProjection = __esmMin((() => {
		init_electronActiveObservation();
		observableEventFamilies = [
			"app-lifecycle",
			"window-lifecycle",
			"web-contents-lifecycle",
			"navigation",
			"shell-attempt",
			"process-lifecycle",
			"permission",
			"popup-attempt",
			"download",
			"protocol",
			"preload",
			"preload-configuration",
			"renderer-ipc",
			"native-addon",
			"updater",
			"error",
			"ipc"
		];
		ipcEventKinds = new Set([
			"main-handler-invocation",
			"main-event-invocation",
			"utility-process-fork",
			"utility-process-message",
			"ipc-main-to-renderer",
			"ipc-utility-to-main",
			"ipc-renderer-send",
			"ipc-renderer-invoke",
			"ipc-renderer-post-message"
		]);
		eventFamily = (kind, processType) => {
			if (kind === "preload" && (processType === "main" || processType === "browser")) return "preload-configuration";
			if (kind.startsWith("ipc-renderer")) return processType === "renderer" ? "renderer-ipc" : "ipc";
			return ipcEventKinds.has(kind) ? "ipc" : kind;
		};
		normalizeObservations = (hookSnapshot) => {
			const observedEventFamilies = [...new Set([...hookSnapshot.events.map(({ kind, process_type }) => eventFamily(kind, process_type)), ...hookSnapshot.dropped_event_families.map(({ family }) => family)])].sort();
			const observedRoles = [...new Set([...hookSnapshot.events.flatMap(({ process_type, kind }) => [
				...process_type === null ? [] : [process_type],
				...kind === "window-lifecycle" ? ["window"] : [],
				...kind === "web-contents-lifecycle" || kind === "navigation" ? ["web_contents"] : [],
				...kind === "preload" && process_type === "preload" ? ["preload"] : [],
				...kind.startsWith("ipc-renderer") && process_type === "renderer" ? ["renderer"] : []
			]), ...hookSnapshot.dropped_event_roles.map(({ role }) => role)])].sort();
			return {
				observedEventFamilies,
				observedRoles
			};
		};
		createCoverage = (hookSnapshot, observations) => {
			const { observedEventFamilies, observedRoles } = observations;
			const unavailableEventFamilies = new Set(observableEventFamilies.filter((family) => !observedEventFamilies.includes(family)));
			if (!observedRoles.includes("preload")) unavailableEventFamilies.add("preload");
			if (!observedRoles.includes("renderer")) unavailableEventFamilies.add("renderer-ipc");
			return {
				status: hookSnapshot.hook_error ? "hook_conflict" : "partial_attach",
				observed_event_families: observedEventFamilies,
				unavailable_event_families: [...unavailableEventFamilies].sort(),
				observed_roles: observedRoles,
				pre_capture_activity: "unavailable"
			};
		};
		hasUnattributedDroppedPreloadFamily = (hookSnapshot) => hookSnapshot.dropped_event_families.some(({ family, count }) => family === "preload" && count > 0);
		hasObservedPreloadConfiguration = (observations) => observations.observedEventFamilies.includes("preload-configuration");
		projectElectronActiveCapture = (paths, actions, state) => {
			const { hookSnapshot } = state;
			const observations = normalizeObservations(hookSnapshot);
			const ipcEvents = hookSnapshot.events.filter(({ kind }) => ipcEventKinds.has(kind));
			return electronActiveObservationResultSchema.parse({
				application: {
					executable_path: paths.executable,
					application_path: paths.application,
					electron_version: state.electronVersion,
					process_ownership: "provider-owned",
					cleanup: "terminated-owned-process"
				},
				actions,
				windows: state.windows,
				processes: { items: state.metrics },
				ipc: {
					events: ipcEvents,
					observed: hookSnapshot.observed_ipc,
					dropped: hookSnapshot.dropped_ipc
				},
				timeline: {
					events: hookSnapshot.events,
					observed: hookSnapshot.observed,
					dropped: hookSnapshot.dropped
				},
				retention: {
					budget_bytes: hookSnapshot.retention_budget_bytes,
					estimated_retained_bytes: hookSnapshot.estimated_retained_bytes,
					event_serialized_byte_upper_bound: hookSnapshot.event_serialized_byte_upper_bound,
					retained: hookSnapshot.retained,
					dropped: hookSnapshot.dropped,
					dropped_event_families: hookSnapshot.dropped_event_families,
					dropped_event_roles: hookSnapshot.dropped_event_roles,
					observed_ipc: hookSnapshot.observed_ipc,
					dropped_ipc: hookSnapshot.dropped_ipc,
					observed_runtime: hookSnapshot.observed_runtime,
					dropped_runtime: hookSnapshot.dropped_runtime
				},
				coverage: createCoverage(hookSnapshot, observations),
				limitations: [
					"IPC payloads are represented by value shapes; payload values are never retained.",
					...observations.observedEventFamilies.includes("ipc-observation-gap") ? ["IPC observation gaps have unobserved callback arguments and execution. Available ipc-observation-gap timeline records identify the callable, registration or removal boundary and channel where known; dropped gap records are counted by retention. Registration gaps do not prove IPC delivery, and removal gaps do not confirm which registration was removed."] : [],
					"IPC direction and sender/receiver identifiers are observed only where Electron exposes them at the hooked boundary.",
					"The runtime timeline records lifecycle, navigation, shell, permission, popup, download, protocol, preload, native-addon, process, and IPC events; activity before hook installation is unavailable.",
					"The preload and renderer process contexts are not instrumented by the main-process -r hook; preload configuration and contextBridge API-shape events are main-boundary observations, not proof of renderer-side execution.",
					...!hasObservedPreloadConfiguration(observations) ? ["Preload configuration was not exposed by the observed Electron window metadata. Preload paths and execution remain unavailable."] : [],
					...hasUnattributedDroppedPreloadFamily(hookSnapshot) ? ["Dropped preload-family events were not attributed to preload configuration; independently aggregated event families and roles cannot establish that relationship."] : [],
					"Process metrics are an Electron API snapshot and do not prove hostile-local-user isolation.",
					...hookSnapshot.dropped > 0 ? [`The active hook retained ${hookSnapshot.retained} of ${hookSnapshot.observed} observed events within a ${hookSnapshot.retention_budget_bytes}-byte (${String(hookSnapshot.retention_budget_bytes / (1024 * 1024))} MiB) retained-data budget; ${hookSnapshot.dropped} events were dropped (${hookSnapshot.dropped_ipc} IPC, ${hookSnapshot.dropped_runtime} runtime). This release has no runtime override.`] : [],
					"External shell opens, external navigation, permission grants, downloads, popup windows, updater relaunches, and OS integration are blocked and recorded by the active hook; other application filesystem and network behavior is not sandboxed by this provider.",
					...hookSnapshot.hook_error ? ["The active IPC hook could not be installed."] : []
				]
			});
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightElectronActiveFuses.js
var OPERATION$1, NODE_CLI_INSPECT_ARGUMENTS_FUSE_INDEX, appBundleDirectoryOf, assertNodeCliInspectArgumentsSupported;
function init_PlaywrightElectronActiveFuses() {
	return (init_PlaywrightElectronActiveFuses = __esmMin((() => {
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_ElectronFuseFailures();
		init_analysisErrorCore();
		init_ElectronFusePath();
		init_ElectronFuseReader();
		OPERATION$1 = "capture_electron_scenario";
		NODE_CLI_INSPECT_ARGUMENTS_FUSE_INDEX = 3;
		appBundleDirectoryOf = (executablePath) => {
			let current = dirname(executablePath);
			while (true) {
				if (basename(current).endsWith(".app")) return current;
				const parent = dirname(current);
				if (parent === current) return null;
				current = parent;
			}
		};
		assertNodeCliInspectArgumentsSupported = async (executablePath, options) => {
			assertArtifactReadActive(options?.signal);
			const reader = options?.readFuseImage ?? readElectronFuseImage;
			const resolver = options?.resolveFuseTarget ?? resolveElectronFuseTarget;
			try {
				let targetPath = executablePath;
				const bundleDir = appBundleDirectoryOf(executablePath);
				if (bundleDir !== null) {
					try {
						const resolved = await resolver(bundleDir, options?.signal);
						targetPath = resolved.file.path;
					} catch (cause) {
						if (options?.signal?.aborted) throw cause;
						targetPath = executablePath;
					}
				}
				const image = await reader(targetPath, {
					...options?.signal === undefined ? {} : { signal: options.signal },
					...options?.resources === undefined ? {} : { resources: options.resources }
				});
				if (image.slices.length === 0) return;
				const hostArchitecture = process.arch === "x64" ? "x86_64" : process.arch;
				const targetSlice = image.slices.find((slice) => slice.architecture === hostArchitecture) ?? image.slices[0];
				if (targetSlice === undefined) return;
				for (const sentinel of targetSlice.sentinels) {
					if (sentinel.wire_version !== 1) continue;
					const fuse = sentinel.fuses.find((entry) => entry.index === NODE_CLI_INSPECT_ARGUMENTS_FUSE_INDEX || entry.name === "EnableNodeCliInspectArguments");
					if (fuse?.state === "disabled" || fuse?.state === "removed") {
						throw new AnalysisUnsupportedTargetError(OPERATION$1, executablePath, "Target binary disables the EnableNodeCliInspectArguments fuse; Node CLI inspector arguments are ignored and active scenario capture cannot attach.", { remediationAction: "Use passive CDP observation tools (inspect_electron_page), or launch active capture against an Electron development build or a stock Electron runtime with the extracted app." });
					}
				}
			} catch (cause) {
				if (cause instanceof AnalysisUnsupportedTargetError) throw cause;
				if (cause instanceof ArtifactReaderFailure && (cause.cleanup !== undefined || cause.reason === "cancelled")) throw electronFuseFailure(cause, executablePath, OPERATION$1);
				assertArtifactReadActive(options?.signal);
			}
		};
	})))();
}

//#endregion
//#region dist/browser/PlaywrightElectronActiveProvider.js
var OPERATION, STARTUP_TIMEOUT_MS, hookPath, PlaywrightElectronActiveProvider, cancelledCapture, cancellationCause, safeElectronEnvironment, PLAYWRIGHT_INTERNAL_FRAME, activeLaunches, heldLaunchRejections, holdLaunchRejection, forwardLaunchRejection, containLaunchRejections, providerError;
function init_PlaywrightElectronActiveProvider() {
	return (init_PlaywrightElectronActiveProvider = __esmMin((() => {
		init_PlaywrightElectronExecution();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_providerCleanupError();
		init_ElectronCaptureCleanup();
		init_analysisErrorCleanup();
		init_ArtifactResourceScope();
		init_ElectronFuseFailures();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_browserObservationError();
		init_providerAdapterError();
		init_result();
		init_ProcessOwnershipEvidence();
		init_ProcessOwnershipObservation();
		init_PlaywrightElectronActiveActions();
		init_PlaywrightElectronActiveProjection();
		init_ElectronFuseReader();
		init_PlaywrightElectronActiveFuses();
		init_providerIdentities();
		OPERATION = "capture_electron_scenario";
		STARTUP_TIMEOUT_MS = 6e4;
		hookPath = fileURLToPath(new URL("../../scripts/electron-active-hook.cjs", new URL("../browser/PlaywrightElectronActiveProvider.js", import.meta.url).href));
		PlaywrightElectronActiveProvider = class {
			environment;
			launch;
			readFuseImage;
			#resources = new ArtifactResourceScope();
			#shutdown = new AbortController();
			/** Stop admitting work, cancel and join captures, then retry exact retained resource owners. */
			async close() {
				this.#shutdown.abort(new Error("Electron active provider is closing"));
				try {
					await this.#resources.close();
				} catch (cause) {
					throw providerError(cause);
				}
			}
			constructor(environment, launch = async (options) => (await import("playwright-core"))._electron.launch(options), readFuseImage = readElectronFuseImage) {
				this.environment = environment;
				this.launch = launch;
				this.readFuseImage = readFuseImage;
			}
			identity() {
				return PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY;
			}
			async capture(input, options = {}) {
				const signal = AbortSignal.any([this.#shutdown.signal, ...options.signal === undefined ? [] : [options.signal]]);
				try {
					return await this.#resources.run(() => this.#capture(input, {
						...options,
						signal
					}));
				} catch (cause) {
					return err(providerError(cause));
				}
			}
			async #capture(input, options) {
				let application;
				let ownership;
				let lineage;
				let capture;
				let paths;
				let initialState;
				let actions = [];
				let outcome;
				const runId = randomUUID();
				try {
					if (options.signal?.aborted === true) throw new BrowserObservationError(OPERATION, "cancelled");
					await prepareProcessOwnershipInspection(options.signal);
					const startupDeadline = performance.now() + STARTUP_TIMEOUT_MS;
					paths = {
						executable: input.executable_path,
						application: input.application_path,
						root: input.application_root
					};
					const preflight = assertNodeCliInspectArgumentsSupported(input.executable_path, {
						resources: this.#resources,
						...options.signal === undefined ? {} : { signal: options.signal },
						readFuseImage: this.readFuseImage
					}).catch((cause) => {
						throw electronFuseFailure(cause, input.executable_path, OPERATION);
					});
					try {
						await runWithExecutionLimits(preflight, options.signal, startupDeadline);
					} catch (interruption) {
						await preflight;
						throw interruption;
					}
					const captureBaseline = await systemProcessOwnershipHost.captureBaseline?.(options.signal);
					if (options.signal?.aborted) throw new BrowserObservationError(OPERATION, "cancelled");
					const launchOptions = {
						executablePath: paths.executable,
						cwd: paths.root,
						env: safeElectronEnvironment(this.environment, runId),
						args: [
							"-r",
							hookPath,
							paths.application,
							...input.args
						],
						timeout: Math.max(1, startupDeadline - performance.now())
					};
					application = await containLaunchRejections(() => {
						options.signal?.throwIfAborted();
						return this.launch(launchOptions);
					});
					const leaderPid = application.process().pid;
					if (typeof leaderPid !== "number" || !Number.isSafeInteger(leaderPid) || leaderPid <= 0) throw new BrowserObservationError(OPERATION, "process_ownership_unavailable");
					ownership = {
						runId,
						leaderPid,
						processGroupId: leaderPid,
						expectedParentPid: process.pid,
						expectedCommand: paths.executable,
						sweepTokenOwnedProcesses: true,
						evidenceOwner: new ProcessOwnershipEvidenceOwner(),
						...captureBaseline === undefined ? {} : { captureBaseline }
					};
					lineage = await observeOwnedProcessLineage(ownership);
					initialState = await runWithExecutionLimits(readApplicationState(application), options.signal, startupDeadline);
					const actionOutcome = await runElectronActions(application, input, options, this.#resources);
					actions = actionOutcome.actions;
					if (actionOutcome.cleanupError !== undefined) throw actionOutcome.cleanupError;
					const state = await readFinalApplicationState(application, options.signal);
					capture = projectElectronActiveCapture(paths, actions, state);
					outcome = options.signal?.aborted ? err(cancelledCapture(capture, options.signal.reason)) : ok(capture);
				} catch (cause) {
					if (paths !== undefined && initialState !== undefined) {
						const retainedCapture = projectElectronActiveCapture(paths, actions, initialState);
						capture = {
							...retainedCapture,
							limitations: [...retainedCapture.limitations, `Capture stopped after the initial pre-action snapshot: ${cause instanceof Error ? cause.message : String(cause)}. Final Windows, metrics, IPC, and timeline state is unknown; the retained snapshot may omit action effects.`]
						};
					}
					if (cause instanceof AnalysisError && cause.cleanupIncomplete) {
						if (capture !== undefined) cause.retainPartialObservation({
							kind: "electron-active-observation",
							capture
						});
						outcome = err(cause);
					} else if (options.signal?.aborted === true) outcome = err(new BrowserObservationError(OPERATION, "cancelled", {
						...cancellationCause(cause, options.signal),
						...capture === undefined ? {} : { partialObservation: {
							kind: "electron-active-observation",
							capture
						} }
					}));
					else {
						const error = providerError(cause);
						if (capture !== undefined) error.retainPartialObservation({
							kind: "electron-active-observation",
							capture
						});
						outcome = err(error);
					}
				}
				if (application !== undefined) {
					const owner = new ElectronCaptureCleanup(application, ownership, lineage);
					const released = await owner.release(this.#resources);
					const cleanup = owner.processResult;
					if (outcome.ok && options.signal?.aborted === true) outcome = err(cancelledCapture(outcome.value, options.signal.reason));
					if (released.processes.kind === "failed" || released.transport.kind === "failed") {
						const processFailure = released.processes.kind === "failed";
						const failures = [released.processes, released.transport].flatMap((attempt) => attempt.kind === "failed" ? [attempt.cause] : []);
						const cause = failures.length === 1 ? failures[0] : new AggregateError(failures, "Electron process and transport cleanup failed");
						const reason = failures.map((failure) => failure instanceof Error ? failure.message : String(failure)).join("; ");
						const failure = new BrowserObservationError(OPERATION, "cleanup_failed", {
							cause,
							detail: `${processFailure ? "Electron process cleanup could not be verified" : "Electron transport teardown failed after process cleanup"}: ${reason}. Collected observations are retained when available.`,
							cleanup: {
								reason,
								resources: owner.pendingResources
							},
							...capture === undefined ? {} : { partialObservation: {
								kind: "electron-active-observation",
								capture: processFailure ? {
									...capture,
									application: {
										...capture.application,
										cleanup: "unverified"
									}
								} : capture
							} }
						});
						owner.bind(failure);
						if (outcome.ok) return err(failure);
						const composed = analysisErrorWithCleanupFailure(outcome.error, failure, OPERATION).bindCleanupDependencies([outcome.error, failure]);
						if (failure.partialObservation !== undefined) composed.partialObservation = failure.partialObservation;
						return err(composed);
					}
					if (outcome.ok && cleanup?.cleaned && cleanup.unverified !== undefined) outcome = ok({
						...outcome.value,
						limitations: [...outcome.value.limitations, ...cleanup.unverified.map(({ pid, diagnostic }) => `Ownership of unrelated process ${String(pid)} could not be verified; it was left untouched: ${diagnostic}`)]
					});
				}
				if (outcome.ok && options.signal?.aborted === true) return err(cancelledCapture(outcome.value, options.signal.reason));
				return outcome;
			}
		};
		cancelledCapture = (capture, reason) => new BrowserObservationError(OPERATION, "cancelled", {
			cause: reason,
			partialObservation: {
				kind: "electron-active-observation",
				capture
			}
		});
		cancellationCause = (cause, signal) => cause instanceof AnalysisCancelledError || cause instanceof AnalysisError && cause.userCategory === "cancelled" ? {
			cause: signal.reason,
			...cause.diagnostics === undefined ? {} : { diagnostics: cause.diagnostics }
		} : { cause };
		safeElectronEnvironment = (environment, runId, platform = process.platform) => Object.fromEntries([...[
			"HOME",
			"LANG",
			"PATH",
			"TMP",
			"TMPDIR",
			"USER",
			"DISPLAY",
			"XAUTHORITY",
			"WAYLAND_DISPLAY",
			...platform === "win32" ? [
				"SYSTEMROOT",
				"TEMP",
				"APPDATA",
				"LOCALAPPDATA",
				"USERPROFILE",
				"COMSPEC",
				"PATHEXT",
				"PROGRAMDATA",
				"ALLUSERSPROFILE",
				"USERNAME",
				"SYSTEMDRIVE",
				"HOMEDRIVE",
				"HOMEPATH"
			] : []
		].map((name) => [name, environment[name]]).filter((entry) => entry[1] !== undefined), ["REA_PROCESS_RUN_ID", runId]]);
		PLAYWRIGHT_INTERNAL_FRAME = /playwright-core[\\/]lib[\\/]/;
		activeLaunches = new Set();
		heldLaunchRejections = new Map();
		holdLaunchRejection = (reason, promise) => {
			if (!(reason instanceof Error) || !PLAYWRIGHT_INTERNAL_FRAME.test(reason.stack ?? "")) throw reason;
			if (!heldLaunchRejections.has(promise)) heldLaunchRejections.set(promise, {
				reason,
				candidates: new Set(activeLaunches),
				hadExternalListener: process.listeners("unhandledRejection").some((listener) => listener !== holdLaunchRejection)
			});
		};
		forwardLaunchRejection = (reason, hadExternalListener) => {
			if (!hadExternalListener) process.nextTick(() => {
				throw reason;
			});
		};
		containLaunchRejections = async (launch) => {
			const scope = {};
			if (activeLaunches.size === 0) process.on("unhandledRejection", holdLaunchRejection);
			activeLaunches.add(scope);
			try {
				return await launch();
			} catch (cause) {
				scope.failure = cause;
				throw cause;
			} finally {
				await new Promise((resolve) => setImmediate(resolve));
				activeLaunches.delete(scope);
				if (activeLaunches.size === 0) process.off("unhandledRejection", holdLaunchRejection);
				for (const [promise, { reason, candidates, hadExternalListener }] of heldLaunchRejections) {
					if (!candidates.delete(scope)) continue;
					if (scope.failure instanceof Error && reason.message !== "" && scope.failure.message.includes(reason.message)) heldLaunchRejections.delete(promise);
					else if (candidates.size === 0) {
						heldLaunchRejections.delete(promise);
						forwardLaunchRejection(reason, hadExternalListener);
					}
				}
			}
		};
		providerError = (cause) => {
			if (cause instanceof AnalysisError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const failure = new ProviderCleanupError(PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY.id, cause.cleanup.resources, { reason: cause.cleanup.reason }, {
					operation: OPERATION,
					cause
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			return new ProviderAdapterError(PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY.id, OPERATION, {
				cause,
				diagnostics: { message: cause instanceof Error ? cause.message : String(cause) }
			});
		};
	})))();
}

//#endregion
//#region dist/composition/electronScenario.js
var createElectronScenarioProvider;
function init_electronScenario() {
	return (init_electronScenario = __esmMin((() => {
		init_PlaywrightElectronActiveProvider();
		createElectronScenarioProvider = (environment) => new PlaywrightElectronActiveProvider(environment);
	})))();
}

//#endregion
init_electronScenario();
export { createElectronScenarioProvider };