/** Keep wall-clock timestamps separate from capture-relative elapsed time. */
export const monotonicProcessCaptureClock = () => Math.floor(performance.now());
