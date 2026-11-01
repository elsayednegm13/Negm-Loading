/** Dir.close invalidates Node's private handle before its native close settles. */
export class OwnedDirectoryHandle {
    handle;
    #state = { kind: "open" };
    constructor(handle) {
        this.handle = handle;
    }
    close() {
        if (this.#state.kind === "closed")
            return Promise.resolve();
        if (this.#state.kind === "closing")
            return this.#state.attempt;
        if (this.#state.kind === "failed")
            return Promise.reject(this.#state.cause);
        const attempt = Promise.resolve().then(async () => {
            try {
                await this.handle.close();
                this.#state = { kind: "closed" };
            }
            catch (cause) {
                // Dir has no public validity signal with which to authorize a retry.
                this.#state = { kind: "failed", cause };
                throw cause;
            }
        });
        this.#state = { kind: "closing", attempt };
        return attempt;
    }
}
