import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/process/ProviderDeadline.js
var waitForAbortableDelay, ProviderStartupDeadline;
function init_ProviderDeadline() {
	return (init_ProviderDeadline = __esmMin((() => {
		waitForAbortableDelay = (milliseconds, signal) => {
			if (signal?.aborted === true) return Promise.resolve("aborted");
			return new Promise((resolve) => {
				const settle = (result) => {
					clearTimeout(timer);
					signal?.removeEventListener("abort", onAbort);
					resolve(result);
				};
				const onAbort = () => settle("aborted");
				const timer = setTimeout(() => settle("elapsed"), Math.max(0, milliseconds));
				signal?.addEventListener("abort", onAbort, { once: true });
			});
		};
		ProviderStartupDeadline = class {
			timeoutMs;
			#controller = new AbortController();
			#deadlineAt;
			#externalSignal;
			#onExternalAbort;
			#timer;
			#interruption;
			constructor(timeoutMs, signal) {
				this.timeoutMs = timeoutMs;
				if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new RangeError("Provider startup timeout must be positive");
				this.#deadlineAt = performance.now() + timeoutMs;
				this.#externalSignal = signal;
				this.#onExternalAbort = () => {
					if (this.#controller.signal.aborted) return;
					if (performance.now() >= this.#deadlineAt) {
						this.#interruption = "timeout";
						this.#abort(new DOMException("Provider startup deadline elapsed", "TimeoutError"));
						return;
					}
					this.#interruption = "cancelled";
					this.#abort(signal?.reason);
				};
				if (signal?.aborted === true) {
					this.#onExternalAbort();
					return;
				}
				signal?.addEventListener("abort", this.#onExternalAbort, { once: true });
				this.#armDeadlineTimer(timeoutMs);
			}
			/** Composite signal aborted by either the caller or the absolute deadline. */
			get signal() {
				return this.#controller.signal;
			}
			/** First control path that interrupted startup, if any. */
			get interruption() {
				return this.#interruption ?? (performance.now() >= this.#deadlineAt ? "timeout" : undefined);
			}
			/** Milliseconds still available to the next startup phase. */
			remainingMs() {
				if (this.#interruption === "timeout") return 0;
				return Math.max(0, Math.ceil(this.#deadlineAt - performance.now()));
			}
			/**
			* Wait for at most one polling interval under the shared deadline signal.
			*
			* Both timers may fire before their monotonic targets. Retain the earlier
			* of the polling target and deadline, and wait again for any residual time.
			*/
			wait(milliseconds) {
				const startedAt = performance.now();
				const targetAt = Math.min(startedAt + milliseconds, this.#deadlineAt);
				const poll = () => {
					const budget = this.remainingMs();
					const residual = Math.max(0, targetAt - performance.now());
					return waitForAbortableDelay(Math.min(residual, budget), this.signal).then((result) => {
						if (result === "aborted") return "aborted";
						const now = performance.now();
						if (now >= this.#deadlineAt) return "aborted";
						if (now >= targetAt) return "elapsed";
						return poll();
					});
				};
				return poll();
			}
			/** Release the deadline timer and external abort listener. */
			dispose() {
				this.#clearTimer();
				this.#externalSignal?.removeEventListener("abort", this.#onExternalAbort);
			}
			#abort(reason) {
				this.#clearTimer();
				this.#externalSignal?.removeEventListener("abort", this.#onExternalAbort);
				this.#controller.abort(reason);
			}
			#clearTimer() {
				if (this.#timer !== undefined) clearTimeout(this.#timer);
				this.#timer = undefined;
			}
			/**
			* Arm (or re-arm) the timer that expires the absolute monotonic deadline.
			*
			* Re-check the clock before classifying expiry, and retain the residual
			* budget when the timer arrives early.
			*/
			#armDeadlineTimer(milliseconds) {
				this.#timer = setTimeout(() => {
					this.#timer = undefined;
					if (this.#controller.signal.aborted) return;
					if (performance.now() >= this.#deadlineAt) {
						this.#interruption = "timeout";
						this.#abort(new DOMException("Provider startup deadline elapsed", "TimeoutError"));
						return;
					}
					this.#armDeadlineTimer(this.remainingMs());
				}, milliseconds);
			}
		};
	})))();
}

//#endregion
export { ProviderStartupDeadline, init_ProviderDeadline, waitForAbortableDelay };