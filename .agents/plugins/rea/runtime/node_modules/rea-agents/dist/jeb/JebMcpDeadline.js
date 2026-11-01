import { DEFAULT_REQUEST_TIMEOUT_MSEC, SdkError, SdkErrorCode, } from "@modelcontextprotocol/client";
import { AnalysisCancelledError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { MAX_PROVIDER_STARTUP_TIMEOUT_MS } from "../config/providerStartupTimeout.js";
import { ProviderStartupDeadline } from "../process/ProviderDeadline.js";
/** Name the launch-environment deadline that both JEB phases share. */
export const jebMcpTimeoutGuidance = (phase, timeoutMs) => ({
    userMessage: `This request reached REA's configured JEB ${phase === "discovery" ? "catalog discovery" : phase} deadline of ${String(timeoutMs)} ms (deadlineExpired).`,
    remediationAction: `Increase REA_JEB_MCP_TIMEOUT_MS in REA's launch environment to an integer from 1 to ${String(MAX_PROVIDER_STARTUP_TIMEOUT_MS)} milliseconds (omitted means ${String(DEFAULT_REQUEST_TIMEOUT_MSEC)} ms) and restart and reconnect REA to apply it. The same setting raises catalog discovery and each tools/call. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.`,
});
/** SDK 2.3.1 preserves an SdkError abort reason by identity. */
export class JebMcpDeadline {
    timeoutMs;
    phase;
    #deadline;
    #controller = new AbortController();
    #interruption = new SdkError(SdkErrorCode.RequestTimeout, "JEB MCP interrupted");
    #onAbort = () => this.#controller.abort(this.#interruption);
    constructor(timeoutMs, signal, phase = "tools/call") {
        this.timeoutMs = timeoutMs;
        this.phase = phase;
        this.#deadline = new ProviderStartupDeadline(timeoutMs, signal);
        if (this.#deadline.signal.aborted)
            this.#onAbort();
        else
            this.#deadline.signal.addEventListener("abort", this.#onAbort, {
                once: true,
            });
    }
    get signal() {
        return this.#controller.signal;
    }
    remainingMs() {
        return this.#deadline.remainingMs();
    }
    /** Classify only the rejection produced by this deadline's exact abort. */
    failure(operation, cause) {
        if (cause === this.#interruption) {
            return this.#deadline.interruption === "timeout"
                ? new AnalysisTimeoutError(operation, this.timeoutMs, {
                    cause: this.#deadline.signal.reason,
                    ...jebMcpTimeoutGuidance(this.phase, this.timeoutMs),
                })
                : new AnalysisCancelledError(operation, {
                    cause: this.#deadline.signal.reason,
                });
        }
        if (cause instanceof SdkError && cause.code === SdkErrorCode.RequestTimeout)
            return new AnalysisTimeoutError(operation, this.timeoutMs, {
                cause,
                ...jebMcpTimeoutGuidance(this.phase, this.timeoutMs),
            });
        return cause;
    }
    dispose() {
        this.#deadline.signal.removeEventListener("abort", this.#onAbort);
        this.#deadline.dispose();
    }
}
