import { readFile } from "node:fs/promises";
/** Safe diagnostics for a browser process that did not publish a CDP port. */
export class BrowserStartupError extends Error {
    _tag = "BrowserStartupError";
    failure;
    executable;
    elapsedMs;
    startupTimeoutMs;
    exitCode;
    signalCode;
    stderr;
    constructor(diagnostics, options) {
        super(browserStartupMessage(diagnostics.failure, diagnostics), options);
        this.failure = diagnostics.failure;
        this.executable = diagnostics.executable;
        this.elapsedMs = diagnostics.elapsedMs;
        this.startupTimeoutMs = diagnostics.startupTimeoutMs;
        this.exitCode = diagnostics.exitCode;
        this.signalCode = diagnostics.signalCode;
        this.stderr = diagnostics.stderr;
    }
}
/**
 * Single owner of the wait for Chrome to publish its DevToolsActivePort.
 *
 * Callers that need a different budget pass `timeoutMs`; nobody else should
 * restate this number, because a per-caller literal silently changes how long
 * a cold Chrome launch is tolerated before the failure names its ceiling.
 */
export const BROWSER_DEVTOOLS_STARTUP_TIMEOUT_MS = 60_000;
/** Wait for Chrome's valid DevToolsActivePort or a terminal process outcome. */
export const waitForBrowserDevtoolsPort = async (options) => {
    const timeoutMs = options.timeoutMs ?? BROWSER_DEVTOOLS_STARTUP_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? 25;
    const startedAt = performance.now();
    const terminal = childTermination(options, startedAt, timeoutMs);
    const deadline = startedAt + timeoutMs;
    while (true) {
        const terminalState = currentTerminalState(options.child);
        if (terminalState !== null)
            throw startupError(options, startedAt, timeoutMs, terminalState);
        const port = await readDevtoolsPort(options.activePortPath);
        if (port !== null)
            return port;
        const remainingMs = deadline - performance.now();
        if (remainingMs <= 0)
            throw startupError(options, startedAt, timeoutMs, { failure: "timeout" });
        const outcome = await Promise.race([
            terminal,
            delay(Math.min(pollIntervalMs, remainingMs)).then(() => null),
        ]);
        if (outcome !== null)
            throw outcome;
    }
};
const childTermination = (options, startedAt, startupTimeoutMs) => new Promise((resolve) => {
    options.child.once("error", (cause) => {
        resolve(startupError(options, startedAt, startupTimeoutMs, {
            failure: "spawn-error",
            cause,
        }));
    });
    options.child.once("exit", () => {
        resolve(startupError(options, startedAt, startupTimeoutMs, options.child.signalCode === null
            ? { failure: "exited" }
            : { failure: "signalled" }));
    });
});
const currentTerminalState = (child) => {
    if (child.signalCode !== null)
        return { failure: "signalled" };
    if (child.exitCode !== null)
        return { failure: "exited" };
    return null;
};
const startupError = (options, startedAt, startupTimeoutMs, state) => new BrowserStartupError({
    failure: state.failure,
    executable: options.executable,
    elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
    startupTimeoutMs,
    exitCode: options.child.exitCode,
    signalCode: options.child.signalCode,
    stderr: options.stderr(),
}, state.failure === "spawn-error" ? { cause: state.cause } : undefined);
const readDevtoolsPort = async (path) => {
    try {
        const firstLine = (await readFile(path, "utf8")).trim().split("\n")[0];
        const port = Number(firstLine);
        return Number.isSafeInteger(port) && port > 0 && port <= 65_535
            ? port
            : null;
    }
    catch (cause) {
        // Missing or unreadable port files mean the port is unknown.
        void cause;
        return null;
    }
};
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const browserStartupMessage = (failure, diagnostics) => `Chrome CDP startup ${failure}; executable=${diagnostics.executable}; elapsed_ms=${String(diagnostics.elapsedMs)}; timeoutMs=${String(diagnostics.startupTimeoutMs)} (DevToolsActivePort wait; omitted means ${String(BROWSER_DEVTOOLS_STARTUP_TIMEOUT_MS)} ms); exit_code=${diagnostics.exitCode === null ? "null" : String(diagnostics.exitCode)}; signal=${diagnostics.signalCode ?? "null"}; stderr=${diagnostics.stderr.length === 0 ? "<empty>" : diagnostics.stderr}`;
