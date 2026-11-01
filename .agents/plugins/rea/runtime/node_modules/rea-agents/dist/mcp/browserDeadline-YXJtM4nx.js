import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { z } from "zod";

//#region dist/domain/browserDeadline.js
var MAX_BROWSER_DEADLINE_MS, DEFAULT_CDP_COMMAND_TIMEOUT_MS, CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, CDP_CLEANUP_GRACE_MS, optionalBrowserDeadlineMs, selectedBrowserDeadlineMs, browserDeadlineIncrease, browserDeadlineRetry, noRuntimeOverrideSentence, webRuntimeCommandTimeoutSchema, COMMAND_TIMEOUT_OPERATIONS, cdpCommandTimeoutIsSelectable, cdpCommandTimeoutUnrelatedControl, cdpDeadlineSubject, cdpCommandDeadlineRecovery, cdpCleanupGraceExpired, selectedCdpCommandTimeoutMs;
function init_browserDeadline() {
	return (init_browserDeadline = __esmMin((() => {
		MAX_BROWSER_DEADLINE_MS = 2147483647;
		DEFAULT_CDP_COMMAND_TIMEOUT_MS = 2e4;
		CDP_DISCOVERY_RESPONSE_TIMEOUT_MS = 1e4;
		CDP_CLEANUP_GRACE_MS = 5e3;
		optionalBrowserDeadlineMs = (description) => z.number().int().min(1).max(MAX_BROWSER_DEADLINE_MS).optional().describe(description);
		selectedBrowserDeadlineMs = (selected, defaultMs) => selected ?? defaultMs;
		browserDeadlineIncrease = (key, timeoutMs, defaultMs, cli) => timeoutMs < 2147483647 ? `Increase ${key} above ${String(timeoutMs)} (integer milliseconds from 1 to ${String(MAX_BROWSER_DEADLINE_MS)}; omitted means ${String(defaultMs)}), or use ${cli} on the CLI.` : `${key} is already at the maximum ${String(MAX_BROWSER_DEADLINE_MS)} ms; do not increase it further.`;
		browserDeadlineRetry = "Applies on the next call. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.";
		noRuntimeOverrideSentence = (allowance, unrelatedControl) => `${allowance} This release has no runtime override.${unrelatedControl === undefined ? "" : ` ${unrelatedControl} does not raise it.`}`;
		webRuntimeCommandTimeoutSchema = optionalBrowserDeadlineMs(`CDP WebSocket handshake and per-command response deadline in milliseconds (default ${String(DEFAULT_CDP_COMMAND_TIMEOUT_MS)}). Omitted means ${String(DEFAULT_CDP_COMMAND_TIMEOUT_MS)} and applies on the next call. deadlineExpired for a handshake or command is not the caller observation window, not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery response deadline, and not the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace. It also bounds passive script-source collection and the inspection/source-join phase that share this deadline. Does not raise the fixed protocol, retained-event, or source byte budgets. CDP discovery and cleanup grace have no runtime override.`);
		COMMAND_TIMEOUT_OPERATIONS = new Set([
			"inspect_web_page",
			"analyze_web_bundle",
			"observe_web_session",
			"observe_web_execution",
			"inspect_web_event_listeners",
			"discover_webmcp_tools",
			"capture_web_screenshot",
			"inspect_electron_page",
			"capture_browser_scenario"
		]);
		cdpCommandTimeoutIsSelectable = (operation) => COMMAND_TIMEOUT_OPERATIONS.has(operation);
		cdpCommandTimeoutUnrelatedControl = (operation) => cdpCommandTimeoutIsSelectable(operation) ? "command_timeout_ms" : undefined;
		cdpDeadlineSubject = (timeoutMs, phase, method, selectable) => {
			const budget = selectable ? `${String(timeoutMs)} ms command_timeout_ms` : `fixed ${String(timeoutMs)} ms`;
			if (phase === "handshake") return `CDP WebSocket handshake exceeded its ${budget} deadline (deadlineExpired).`;
			if (phase === "source-join") return `The inspection/source-join phase exceeded its ${budget} deadline (deadlineExpired).`;
			return `CDP command ${method ?? "request"} exceeded its ${budget} response deadline (deadlineExpired).`;
		};
		cdpCommandDeadlineRecovery = (timeoutMs, phase, method, selectable = true) => {
			const subject = cdpDeadlineSubject(timeoutMs, phase, method, selectable);
			if (!selectable) {
				const fixed = noRuntimeOverrideSentence(`${subject} This is not the caller observation window and not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery deadline.`);
				return {
					userMessage: fixed,
					remediationAction: fixed
				};
			}
			return {
				userMessage: `${subject} This is not the caller observation window, not the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery deadline, and not the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace.`,
				remediationAction: `${browserDeadlineIncrease("command_timeout_ms", timeoutMs, DEFAULT_CDP_COMMAND_TIMEOUT_MS, "--command-timeout-ms")} ${browserDeadlineRetry} command_timeout_ms does not raise the fixed protocol, retained-event, or source byte budgets, the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery response deadline, or the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace. Those have no runtime override.`
			};
		};
		cdpCleanupGraceExpired = () => noRuntimeOverrideSentence(`CDP runtime cleanup exceeded its ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace.`, "command_timeout_ms");
		selectedCdpCommandTimeoutMs = (selected) => selectedBrowserDeadlineMs(selected, DEFAULT_CDP_COMMAND_TIMEOUT_MS);
	})))();
}

//#endregion
export { browserDeadlineIncrease as a, cdpCommandDeadlineRecovery as c, init_browserDeadline as d, noRuntimeOverrideSentence as f, webRuntimeCommandTimeoutSchema as g, selectedCdpCommandTimeoutMs as h, MAX_BROWSER_DEADLINE_MS as i, cdpCommandTimeoutIsSelectable as l, selectedBrowserDeadlineMs as m, CDP_DISCOVERY_RESPONSE_TIMEOUT_MS as n, browserDeadlineRetry as o, optionalBrowserDeadlineMs as p, DEFAULT_CDP_COMMAND_TIMEOUT_MS as r, cdpCleanupGraceExpired as s, CDP_CLEANUP_GRACE_MS as t, cdpCommandTimeoutUnrelatedControl as u };