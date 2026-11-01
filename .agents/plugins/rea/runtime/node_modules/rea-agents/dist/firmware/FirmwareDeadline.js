/** Keep a phase's selected budget paired with its cancellation identity. */
export const startFirmwareDeadline = (phase, timeoutMs) => ({
    phase,
    expiresAtMs: performance.now() + timeoutMs,
    signal: AbortSignal.timeout(timeoutMs),
    timeoutMs,
});
/** Timers may not have run when synchronous inventory or result parsing returns. */
export const firmwareDeadlineElapsed = (deadline) => performance.now() >= deadline.expiresAtMs;
