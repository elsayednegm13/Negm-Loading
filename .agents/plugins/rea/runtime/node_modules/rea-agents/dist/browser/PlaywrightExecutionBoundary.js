import { AnalysisCancelledError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
const OPERATION = "capture_browser_scenario";
// Chrome shutdown can take several seconds; expiry bounds the response, not ownership.
export const PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS = 30_000;
export const withPlaywrightExecutionBoundary = (work, timeoutMs, signal, timeoutError = () => new AnalysisTimeoutError(OPERATION, timeoutMs ?? 0)) => {
    if (timeoutMs !== undefined && timeoutMs <= 0)
        return Promise.reject(timeoutError());
    if (signal?.aborted === true)
        return Promise.reject(new AnalysisCancelledError(OPERATION, { cause: signal.reason }));
    return new Promise((resolve, reject) => {
        let settled = false;
        let timer;
        const deadline = timeoutMs === undefined ? undefined : performance.now() + timeoutMs;
        const scheduleTimeout = () => {
            if (deadline === undefined)
                return;
            const remaining = deadline - performance.now();
            if (remaining <= 0) {
                fail(timeoutError());
                return;
            }
            timer = setTimeout(scheduleTimeout, Math.min(remaining, 2_147_483_647));
            timer.unref();
        };
        const cleanup = () => {
            if (timer !== undefined)
                clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
        };
        const succeed = (value) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            resolve(value);
        };
        const fail = (error) => {
            if (settled)
                return;
            settled = true;
            cleanup();
            reject(error);
        };
        const onAbort = () => {
            fail(new AnalysisCancelledError(OPERATION, { cause: signal?.reason }));
        };
        scheduleTimeout();
        if (settled)
            return;
        signal?.addEventListener("abort", onAbort, { once: true });
        if (signal?.aborted === true) {
            onAbort();
            return;
        }
        try {
            void work().then(succeed, fail);
        }
        catch (cause) {
            fail(cause);
        }
    });
};
