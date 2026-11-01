/** Own frame waiters and release the losing output-close wait after each race. */
export class WorkerFrameSignal {
    #waiters = new Set();
    wake(outcome) {
        for (const wake of this.#waiters)
            wake(outcome);
        this.clear();
    }
    clear() {
        this.#waiters.clear();
    }
    async waitForOutputClose(supervisor, signal) {
        let wakeFrame;
        const frameAvailable = new Promise((resolve) => {
            wakeFrame = resolve;
            this.#waiters.add(wakeFrame);
        });
        const outputCloseController = new AbortController();
        const interruptOutputClose = () => outputCloseController.abort(signal.reason);
        if (signal.aborted)
            interruptOutputClose();
        else
            signal.addEventListener("abort", interruptOutputClose, { once: true });
        try {
            const outputClose = supervisor
                .waitForOutputClose(undefined, outputCloseController.signal)
                .then((closed) => closed ? "closed" : "interrupted");
            return await Promise.race([frameAvailable, outputClose]);
        }
        finally {
            outputCloseController.abort();
            signal.removeEventListener("abort", interruptOutputClose);
            this.#waiters.delete(wakeFrame);
        }
    }
}
