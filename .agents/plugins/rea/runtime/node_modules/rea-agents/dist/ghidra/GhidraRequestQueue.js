import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { err } from "../domain/result.js";
import { GhidraSessionError, } from "./GhidraSessionError.js";
/** FIFO that admits one Ghidra Program request at a time. */
export class GhidraRequestQueue {
    execute;
    failure;
    onActiveCancellation;
    #queue = [];
    #active = false;
    #closedFailure;
    constructor(execute, failure, onActiveCancellation) {
        this.execute = execute;
        this.failure = failure;
        this.onActiveCancellation = onActiveCancellation;
    }
    /** Queue one request until it completes, is cancelled, or the session closes. */
    run(method, parameters, options) {
        if (this.#closedFailure !== undefined)
            return Promise.resolve(err(this.#closedFailure));
        if (options.signal?.aborted === true)
            return Promise.resolve(err(this.#cancelled(options.signal)));
        return new Promise((resolve) => {
            let entry;
            const onAbort = options.signal === undefined
                ? undefined
                : () => this.#rejectQueued(entry, err(this.#cancelled(options.signal)));
            entry = {
                method,
                parameters,
                options,
                resolve,
                onAbort,
            };
            this.#queue.push(entry);
            if (onAbort !== undefined)
                options.signal?.addEventListener("abort", onAbort, { once: true });
            this.#drain();
        });
    }
    /** Fail requests that have not crossed the socket during session cleanup. */
    failQueued(failure) {
        this.#closedFailure = failure;
        for (const entry of this.#queue.splice(0)) {
            this.#release(entry);
            entry.resolve(err(failure));
        }
    }
    /** Admit requests after the owning client completes a new session startup. */
    reopen() {
        this.#closedFailure = undefined;
    }
    #drain() {
        if (this.#active)
            return;
        const entry = this.#queue.shift();
        if (entry === undefined)
            return;
        this.#release(entry);
        if (entry.options.signal?.aborted === true) {
            entry.resolve(err(this.#cancelled(entry.options.signal)));
            this.#drain();
            return;
        }
        this.#active = true;
        void this.#executeEntry(entry)
            .then(entry.resolve)
            .finally(() => {
            this.#active = false;
            if (this.#closedFailure === undefined)
                this.#drain();
        });
    }
    async #executeEntry(entry) {
        let cancellation;
        const onAbort = () => {
            this.failQueued(this.failure("process", "Ghidra session closed after active request cancellation"));
            cancellation = {
                failure: this.#cancelled(entry.options.signal),
                // Capture rejection immediately, including a synchronous callback throw.
                // Execution and finalization may settle in either order.
                cleanup: Promise.resolve()
                    .then(() => this.onActiveCancellation())
                    .then((value) => ({ kind: "returned", value }), (cause) => ({ kind: "rejected", cause })),
            };
        };
        entry.options.signal?.addEventListener("abort", onAbort, { once: true });
        try {
            let result;
            try {
                result = await this.execute(entry.method, entry.parameters, entry.options);
            }
            catch (cause) {
                result = err(cause instanceof GhidraSessionError
                    ? cause
                    : this.failure("protocol", "Ghidra serial request execution rejected unexpectedly", cause));
            }
            if (cancellation === undefined)
                return result;
            // An observed bridge reply stays primary, but it must carry the session
            // close so its projection does not promise that the session is usable.
            const primary = result.ok
                ? cancellation.failure
                : result.error.kind === "remote"
                    ? result.error.withConcurrentCancellation({
                        reason: entry.options.signal?.reason,
                    })
                    : result.error;
            const cleanup = await cancellation.cleanup;
            if (cleanup.kind === "rejected")
                return err(this.#withUnexpectedCleanupRejection(primary, cleanup.cause));
            return err(cleanup.value.ok
                ? primary
                : primary.withCleanupFailure(cleanup.value.error));
        }
        finally {
            entry.options.signal?.removeEventListener("abort", onAbort);
        }
    }
    #cancelled(signal) {
        return this.failure("cancelled", "Ghidra request was cancelled", signal?.reason, signal === undefined ? {} : { cancellation: { reason: signal.reason } });
    }
    #rejectQueued(entry, result) {
        const index = this.#queue.indexOf(entry);
        if (index < 0)
            return;
        this.#queue.splice(index, 1);
        this.#release(entry);
        entry.resolve(result);
    }
    #withUnexpectedCleanupRejection(primary, cause) {
        const described = this.failure(primary.kind, primary.message, cause);
        const rejection = described.diagnostics.failure_cause;
        const cleanupFailure = new ProviderCleanupError("ghidra", ["Ghidra cancellation cleanup"], {
            reason: "Cancellation cleanup rejected before release was confirmed",
            unexpected_cleanup_rejection: rejection ?? { type: typeof cause },
        }, { cause });
        return primary.withCleanupFailure(cleanupFailure, {
            ...primary.diagnostics,
            unexpected_cleanup_rejection: rejection ?? { type: typeof cause },
        });
    }
    #release(entry) {
        if (entry.options.signal !== undefined && entry.onAbort !== undefined)
            entry.options.signal.removeEventListener("abort", entry.onAbort);
    }
}
