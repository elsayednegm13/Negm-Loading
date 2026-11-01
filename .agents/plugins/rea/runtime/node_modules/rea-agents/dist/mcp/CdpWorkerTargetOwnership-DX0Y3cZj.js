import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { n as init_ProviderDeadline, t as ProviderStartupDeadline } from "./ProviderDeadline-BHJfBmfF.js";
import { d as init_browserDeadline, f as noRuntimeOverrideSentence, h as selectedCdpCommandTimeoutMs } from "./browserDeadline-YXJtM4nx.js";
import { d as classifyBrowserCompleteness, f as init_browserCompleteness } from "./browserObservationSchemas-D8LpYojE.js";
import { n as init_webRuntime, t as WEB_RUNTIME_LIMITS } from "./webRuntime-r29_jh0W.js";
import { a as init_CdpConnection, o as CdpCommandRejection, s as init_CdpCommandRejection } from "./CdpTargetSessionOwner--fX5UnbH.js";
import { a as init_CdpCaptureValues, r as cdpStringValue } from "./CdpCaptureValues-D79UwkrA.js";

//#region dist/browser/CdpCaptureCompleteness.js
var EVENT_SECTIONS, POLICY_REASONS, CdpCaptureCompleteness, emptyDropped;
function init_CdpCaptureCompleteness() {
	return (init_CdpCaptureCompleteness = __esmMin((() => {
		init_browserCompleteness();
		EVENT_SECTIONS = {
			scripts: "scripts",
			network_requests: "network_requests",
			console_events: "console_events",
			websocket_connections: "websocket_connections",
			websocket_frames: "websocket_frames",
			webmcp_tools: "webmcp_tools",
			timeline_events: "timeline"
		};
		POLICY_REASONS = new Set([
			"disallowed_origin",
			"unsupported_url",
			"unattributed_origin",
			"not_approved",
			"out_of_target_scope"
		]);
		CdpCaptureCompleteness = class {
			#initialAttachLimited;
			#policyFiltered = new Set();
			#attachLimited = new Set();
			#truncated = new Set();
			#unavailable = new Set();
			#excluded = new Map();
			#dropped = emptyDropped();
			constructor(initialAttachLimited = []) {
				this.#initialAttachLimited = [...initialAttachLimited];
				this.reset();
			}
			reset() {
				this.#policyFiltered.clear();
				this.#attachLimited.clear();
				this.#truncated.clear();
				this.#unavailable.clear();
				this.#excluded.clear();
				Object.assign(this.#dropped, emptyDropped());
				for (const section of this.#initialAttachLimited) this.#attachLimited.add(section);
			}
			exclude(section, reason, count = 1) {
				if (POLICY_REASONS.has(reason)) this.#policyFiltered.add(section);
				if (reason === "provider_unavailable" || reason === "unattributed_target" || reason === "invalid_protocol_value" || reason === "unknown_target_relationship") this.#unavailable.add(section);
				if (reason === "resource_budget_exhausted") this.#truncated.add(section);
				const key = `${section}\0${reason}`;
				const existing = this.#excluded.get(key);
				const combined = count === null || existing?.count === null ? null : (existing?.count ?? 0) + count;
				this.#excluded.set(key, {
					section,
					reason,
					count: combined
				});
			}
			attachLimited(section) {
				this.#attachLimited.add(section);
			}
			unavailable(section) {
				this.#unavailable.add(section);
				this.exclude(section, "provider_unavailable", null);
			}
			truncate(section) {
				this.#truncated.add(section);
			}
			drop(kind, count = 1) {
				this.#dropped[kind] += count;
				this.#truncated.add(EVENT_SECTIONS[kind]);
			}
			get droppedTotal() {
				return Object.values(this.#dropped).reduce((sum, count) => sum + count, 0);
			}
			snapshot() {
				return classifyBrowserCompleteness({
					policyFilteredSections: this.#policyFiltered,
					attachLimitedSections: this.#attachLimited,
					truncatedSections: this.#truncated,
					unavailableSections: this.#unavailable,
					excluded: [...this.#excluded.values()],
					droppedEvents: this.#dropped
				});
			}
		};
		emptyDropped = () => ({
			scripts: 0,
			network_requests: 0,
			console_events: 0,
			websocket_connections: 0,
			websocket_frames: 0,
			webmcp_tools: 0,
			timeline_events: 0
		});
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureEventTypes.js
var CDP_CAPTURE_SCRIPT_METADATA_LIMITS;
function init_CdpCaptureEventTypes() {
	return (init_CdpCaptureEventTypes = __esmMin((() => {
		CDP_CAPTURE_SCRIPT_METADATA_LIMITS = {
			retainedBytes: 8 * 1024 * 1024,
			scripts: 5e4
		};
	})))();
}

//#endregion
//#region dist/browser/CdpOptionalCommand.js
var optionalCdpCommand;
function init_CdpOptionalCommand() {
	return (init_CdpOptionalCommand = __esmMin((() => {
		init_CdpCommandRejection();
		init_CdpConnection();
		optionalCdpCommand = async (context, method, parameters, limitations) => {
			try {
				return await context.connection.send(method, parameters, context.sessionId, context.signal);
			} catch (cause) {
				if (!(cause instanceof CdpCommandRejection) || cause.code !== -32601) throw cause;
				limitations.push(`${method} was unavailable from this browser target.`);
				return undefined;
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpScriptSourceBudget.js
var MIB, CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON, cdpScriptSourceDeadlineOmissionReason, CdpScriptSourceBudget;
function init_CdpScriptSourceBudget() {
	return (init_CdpScriptSourceBudget = __esmMin((() => {
		init_browserDeadline();
		init_webRuntime();
		init_ProviderDeadline();
		MIB = 1024 * 1024;
		CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON = `script source was omitted because the aggregate ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte (${String(WEB_RUNTIME_LIMITS.sourceBytes / MIB)} MiB) source budget was exhausted. ${noRuntimeOverrideSentence("That source budget stays fixed.", "command_timeout_ms")}`;
		cdpScriptSourceDeadlineOmissionReason = (timeoutMs) => `script source was omitted because the ${String(timeoutMs)} ms command_timeout_ms source collection deadline elapsed (deadlineExpired). This is not the caller observation window. ${noRuntimeOverrideSentence(`The ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte source budget stays fixed.`, "command_timeout_ms")}`;
		CdpScriptSourceBudget = class {
			#deadline;
			commandTimeoutMs;
			#retainedBytes = 0;
			constructor(signal, commandTimeoutMs = selectedCdpCommandTimeoutMs(undefined)) {
				this.commandTimeoutMs = commandTimeoutMs;
				this.#deadline = new ProviderStartupDeadline(commandTimeoutMs, signal);
			}
			get signal() {
				return this.#deadline.signal;
			}
			get timedOut() {
				return this.#deadline.interruption === "timeout";
			}
			/** Admit exact UTF-8 source bytes before building or retaining its artifact. */
			admit(text) {
				const bytes = Buffer.byteLength(text, "utf8");
				if (bytes > WEB_RUNTIME_LIMITS.sourceBytes - this.#retainedBytes) return false;
				this.#retainedBytes += bytes;
				return true;
			}
			dispose() {
				this.#deadline.dispose();
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpWorkerTargetOwnership.js
var workerTargetOwnership;
function init_CdpWorkerTargetOwnership() {
	return (init_CdpWorkerTargetOwnership = __esmMin((() => {
		init_result();
		init_CdpCaptureValues();
		workerTargetOwnership = (target, selectedTargetId, frameIds) => {
			const openerTargetId = cdpStringValue(target.openerId);
			const parentFrameId = cdpStringValue(target.parentFrameId);
			if (target.openerId !== undefined && (openerTargetId === undefined || openerTargetId === "") || target.parentFrameId !== undefined && (parentFrameId === undefined || parentFrameId === "")) return err({ _tag: "InvalidWorkerRelationship" });
			const selected = openerTargetId === selectedTargetId || parentFrameId !== undefined && frameIds.has(parentFrameId);
			return ok({
				scope: selected ? "selected" : openerTargetId === undefined && parentFrameId === undefined ? "unknown" : "foreign",
				openerTargetId: openerTargetId ?? null,
				parentFrameId: parentFrameId ?? null
			});
		};
	})))();
}

//#endregion
export { cdpScriptSourceDeadlineOmissionReason as a, optionalCdpCommand as c, CdpCaptureCompleteness as d, init_CdpCaptureCompleteness as f, CdpScriptSourceBudget as i, CDP_CAPTURE_SCRIPT_METADATA_LIMITS as l, workerTargetOwnership as n, init_CdpScriptSourceBudget as o, CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON as r, init_CdpOptionalCommand as s, init_CdpWorkerTargetOwnership as t, init_CdpCaptureEventTypes as u };