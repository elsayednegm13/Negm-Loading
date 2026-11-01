import { createRequire } from "node:module";
import { BrowserObservationError } from "../domain/browserObservationError.js";
import { browserDeadlineRetry, cdpCommandDeadlineRecovery, CDP_CLEANUP_GRACE_MS, CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, DEFAULT_CDP_COMMAND_TIMEOUT_MS, MAX_BROWSER_DEADLINE_MS, selectedCdpCommandTimeoutMs, } from "../domain/browserDeadline.js";
const OPERATION = "capture_browser_scenario";
const pendingScenarioCommands = new WeakMap();
/** Selected scenario CDP deadline, or today's 20000 ms default when omitted. */
export const scenarioCommandTimeoutMs = (scenario) => selectedCdpCommandTimeoutMs(scenario.command_timeout_ms);
const playwrightTimedOut = (cause) => {
    if (!(cause instanceof Error) || cause.name !== "TimeoutError")
        return false;
    // Check the public producer type without loading Playwright at MCP startup.
    const { errors } = createRequire(import.meta.url)("playwright-core");
    return cause instanceof errors.TimeoutError;
};
/**
 * `capture-browser-scenario` accepts only scenario JSON, so recovery names
 * `command_timeout_ms` there and does not advertise a CLI flag.
 */
const scenarioCommandDeadlineRecovery = (timeoutMs, phase, method) => {
    const userMessage = phase === "launch"
        ? `Browser launch and persistent-context startup exceeded its ${String(timeoutMs)} ms command_timeout_ms deadline (deadlineExpired). This is not the caller observation window, the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery deadline, or the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace.`
        : cdpCommandDeadlineRecovery(timeoutMs, phase, method).userMessage;
    const increase = timeoutMs < MAX_BROWSER_DEADLINE_MS
        ? `Set command_timeout_ms in the capture-browser-scenario JSON above ${String(timeoutMs)} (integer milliseconds from 1 to ${String(MAX_BROWSER_DEADLINE_MS)}; omitted means ${String(DEFAULT_CDP_COMMAND_TIMEOUT_MS)}).`
        : `command_timeout_ms is already at the maximum ${String(MAX_BROWSER_DEADLINE_MS)} ms; do not increase it further.`;
    return {
        userMessage,
        remediationAction: `${increase} ${browserDeadlineRetry} command_timeout_ms does not raise the fixed protocol, retained-event, or source byte budgets, the ${String(CDP_DISCOVERY_RESPONSE_TIMEOUT_MS)} ms CDP discovery response deadline, or the ${String(CDP_CLEANUP_GRACE_MS)} ms cleanup grace. Those have no runtime override.`,
    };
};
/** The scenario command still running after this deadline rejection, if any. */
export const scenarioCommandPending = (cause) => cause instanceof BrowserObservationError
    ? pendingScenarioCommands.get(cause)
    : undefined;
/**
 * Observe a timed-out scenario command through completion.
 * The result stays with its caller; this does not close or detach it.
 */
export const settleScenarioCommand = async (cause) => {
    await scenarioCommandPending(cause)?.catch(() => undefined);
};
const releasableCommandResult = (value) => typeof value === "object" && value !== null;
/** Close or detach a browser, context, or session that arrives after its deadline. */
export const releaseLateScenarioCommand = async (cause) => {
    const pending = scenarioCommandPending(cause);
    if (pending === undefined)
        return;
    let value;
    try {
        value = await pending;
    }
    catch {
        return;
    }
    if (!releasableCommandResult(value))
        return;
    if (typeof value.detach === "function") {
        await value.detach();
        return;
    }
    if (typeof value.close === "function")
        await value.close();
};
/**
 * Bound browser startup, a CDP handshake or a command by the scenario deadline.
 * The underlying operation stays reachable after a timeout so its owner can
 * close the returned handle or restore a mutation that lands late.
 * Playwright's own timeout, when it rejects first, is reported as that deadline.
 */
export const withScenarioCommandDeadline = async (work, timeoutMs, phase, method) => {
    let operation;
    try {
        operation = work();
    }
    catch (cause) {
        operation = Promise.reject(cause);
    }
    let timer;
    let settled = false;
    const deadlineFailure = (cause) => {
        const deadline = scenarioCommandDeadlineRecovery(timeoutMs, phase, method);
        return new BrowserObservationError(OPERATION, "timeout", {
            detail: deadline.userMessage,
            remediationAction: deadline.remediationAction,
            cause,
            diagnostics: {
                phase,
                command_timeout_ms: timeoutMs,
                ...(method === undefined ? {} : { method }),
                // Discovered CDP URLs can carry transport userinfo in Playwright's
                // native message. Preserve that cause without projecting it here.
                ...(cause === undefined || phase !== "launch"
                    ? {}
                    : { producer_message: cause.message }),
            },
        });
    };
    try {
        return await new Promise((resolve, reject) => {
            const fail = (cause) => {
                if (settled)
                    return;
                settled = true;
                reject(cause);
            };
            timer = setTimeout(() => {
                const timeout = deadlineFailure();
                pendingScenarioCommands.set(timeout, operation);
                fail(timeout);
            }, timeoutMs);
            operation.then((value) => {
                if (settled)
                    return;
                settled = true;
                resolve(value);
            }, (cause) => {
                if (playwrightTimedOut(cause)) {
                    fail(deadlineFailure(cause));
                    return;
                }
                fail(cause);
            });
        });
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
};
