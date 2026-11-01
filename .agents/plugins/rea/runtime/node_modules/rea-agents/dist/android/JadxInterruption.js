/** An Android checkpoint observed interruption; the caller's reason stays opaque. */
export class JadxInterruption extends Error {
    reason;
    constructor(reason) {
        super("Android operation interrupted", { cause: reason });
        this.reason = reason;
        this.name = "AbortError";
    }
}
export const throwIfJadxInterrupted = (signal) => {
    if (signal?.aborted === true)
        throw new JadxInterruption(signal.reason);
};
