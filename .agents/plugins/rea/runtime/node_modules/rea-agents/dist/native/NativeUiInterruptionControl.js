import { AnalysisCancelledError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { DEFAULT_NATIVE_UI_DEADLINE_MS, nativeDeadlineRecovery, } from "../domain/native/nativeDeadlines.js";
/** Tracks whether the caller or the owned operation deadline stopped UI work. */
export class NativeUiInterruptionControl {
    signal;
    #controller = new AbortController();
    #interruption;
    #caller;
    #deadline;
    #deadlineMs;
    #onCallerAbort = () => {
        this.#interrupt("caller", this.#caller?.reason);
    };
    #onDeadlineAbort = () => {
        this.#interrupt("deadline", this.#deadline.reason);
    };
    /** Selected `native_ui_deadline_ms`, including the omitted default. */
    get deadlineMs() {
        return this.#deadlineMs;
    }
    constructor(caller, deadline, deadlineMs = DEFAULT_NATIVE_UI_DEADLINE_MS) {
        this.#caller = caller;
        this.#deadline = deadline;
        this.#deadlineMs = deadlineMs;
        this.signal = this.#controller.signal;
        // Match AbortSignal.any's iterable priority when both are already aborted.
        if (caller?.aborted)
            this.#interrupt("caller", caller.reason);
        else if (deadline.aborted)
            this.#interrupt("deadline", deadline.reason);
        else {
            caller?.addEventListener("abort", this.#onCallerAbort, { once: true });
            deadline.addEventListener("abort", this.#onDeadlineAbort, {
                once: true,
            });
        }
    }
    /**
     * A helper subprocess reached the selected deadline before the abort signal
     * settled. Caller cancellation already recorded on this control stays primary.
     */
    deadlineFailure(operation, partialObservation) {
        if (this.#interruption === undefined)
            this.#interrupt("deadline", this.#deadline.reason);
        const error = this.error(operation, partialObservation);
        if (error === undefined)
            throw new Error("UI deadline failure requires an interruption.");
        return error;
    }
    error(operation, partialObservation) {
        const interruption = this.#interruption;
        if (interruption === undefined)
            return undefined;
        return interruption.kind === "deadline"
            ? new AnalysisTimeoutError(operation, this.#deadlineMs, {
                cause: interruption.reason,
                partialObservation,
                ...nativeDeadlineRecovery({
                    timeoutMs: this.#deadlineMs,
                    setting: "native_ui_deadline_ms",
                    cliFlag: "--native-ui-deadline-ms",
                    defaultMs: DEFAULT_NATIVE_UI_DEADLINE_MS,
                    phase: "native UI observation deadline",
                    detail: " A partial observation may already be retained.",
                    unchanged: "The 67108864-byte scenario output allowance and the 180000 ms cap on one wait step have no runtime override.",
                }),
            })
            : new AnalysisCancelledError(operation, {
                cause: interruption.reason,
                partialObservation,
            });
    }
    dispose() {
        this.#caller?.removeEventListener("abort", this.#onCallerAbort);
        this.#deadline.removeEventListener("abort", this.#onDeadlineAbort);
    }
    #interrupt(kind, reason) {
        if (this.#interruption !== undefined)
            return;
        this.#interruption = { kind, reason };
        this.#controller.abort(reason);
    }
}
