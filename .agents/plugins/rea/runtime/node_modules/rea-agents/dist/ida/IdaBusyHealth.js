import { setTimeout as sleep } from "node:timers/promises";
import { AnalysisCancelledError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { idaRegistrationTimeoutGuidance } from "./IdaConfiguration.js";
import { busyHealthSchema } from "./IdaProtocolValues.js";
/** Pause between health reads while a freshly opened worker reports itself busy. */
const BUSY_HEALTH_RETRY_MS = 100;
/** Only a tool-name-shaped value is repeated; other producer text is not echoed into errors. */
const BUSY_TOOL_NAME = /^[A-Za-z0-9_.:-]{1,64}$/u;
const monotonicClock = {
    now: () => performance.now(),
    delay: (ms, signal) => sleep(ms, undefined, { signal }),
};
const busyToolName = (tool) => tool !== undefined && BUSY_TOOL_NAME.test(tool) ? tool : "unknown";
const isBusyStatus = (raw) => typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    raw["status"] === "busy";
/**
 * Reads `server_health` until the worker stops reporting a transient busy
 * state. The wait ends when the worker answers, the caller aborts, or the
 * registration's request deadline has elapsed; once it has elapsed no further
 * read is started and the last busy observation is reported. Any other payload
 * is returned for the caller's strict parse, except an invalid busy payload,
 * which keeps its own diagnostic.
 */
export const readSettledHealth = async (connection, { database, timeoutMs, signal, clock = monotonicClock, }) => {
    const started = clock.now();
    const remaining = () => timeoutMs - (clock.now() - started);
    let lastBusy;
    for (;;) {
        if (signal?.aborted)
            throw new AnalysisCancelledError("server_health", {
                cause: signal.reason,
            });
        const budgetMs = remaining();
        if (budgetMs <= 0)
            throw lastBusy === undefined
                ? new AnalysisTimeoutError("server_health", timeoutMs, {
                    ...idaRegistrationTimeoutGuidance(timeoutMs, "readiness"),
                })
                : busyTimeout(lastBusy, timeoutMs);
        const requestTimeoutMs = Math.min(timeoutMs, Math.ceil(budgetMs));
        let raw;
        try {
            raw = await connection.call("server_health", { database }, { timeoutMs: requestTimeoutMs, signal });
        }
        catch (cause) {
            if (lastBusy !== undefined &&
                cause instanceof AnalysisTimeoutError &&
                cause.timeoutMs === requestTimeoutMs &&
                requestTimeoutMs < timeoutMs) {
                throw busyTimeout(lastBusy, timeoutMs, cause);
            }
            throw cause;
        }
        const busy = busyHealthSchema.safeParse(raw);
        if (!busy.success) {
            if (isBusyStatus(raw))
                throw busy.error;
            return raw;
        }
        const observedBusy = {
            raw,
            tool: busyToolName(busy.data.busy_tool),
        };
        lastBusy = observedBusy;
        const expired = () => busyTimeout(observedBusy, timeoutMs);
        if (remaining() <= 0)
            throw expired();
        try {
            await clock.delay(Math.min(BUSY_HEALTH_RETRY_MS, remaining()), signal);
        }
        catch (cause) {
            if (signal?.aborted &&
                cause instanceof Error &&
                cause.name === "AbortError")
                throw new AnalysisCancelledError("server_health", {
                    cause: signal.reason,
                });
            throw cause;
        }
        if (signal?.aborted)
            throw new AnalysisCancelledError("server_health", {
                cause: signal.reason,
            });
        if (remaining() <= 0)
            throw expired();
    }
};
const busyTimeout = (lastBusy, timeoutMs, requestFailure) => {
    const guidance = idaRegistrationTimeoutGuidance(timeoutMs, "readiness");
    return new AnalysisTimeoutError("server_health", timeoutMs, {
        cause: lastBusy.raw,
        ...guidance,
        userMessage: `${guidance.userMessage} The last reported busy tool was ${lastBusy.tool}.`,
        diagnostics: {
            busy_tool: lastBusy.tool,
            ...(requestFailure === undefined
                ? {}
                : {
                    health_request_operation: requestFailure.operation,
                    health_request_timeout_ms: requestFailure.timeoutMs,
                }),
        },
        ...(requestFailure === undefined
            ? {}
            : { capturedOutput: requestFailure.capturedOutput }),
    });
};
