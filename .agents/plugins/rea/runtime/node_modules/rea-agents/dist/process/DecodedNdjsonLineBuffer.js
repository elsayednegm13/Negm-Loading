/** Incrementally splits decoded newline-delimited JSON socket data into lines. */
export class DecodedNdjsonLineBuffer {
    #buffer = "";
    #fragments = [];
    /**
     * Consume a chunk and yield each complete, trimmed, nonblank line.
     * Unconsumed complete lines remain buffered if iteration stops early.
     */
    *push(chunk) {
        this.#fragments.push(chunk);
        if (!chunk.includes("\n"))
            return;
        this.#buffer += this.#fragments.join("");
        this.#fragments = [];
        let newline = this.#buffer.indexOf("\n");
        while (newline >= 0) {
            const encodedLine = this.#buffer.slice(0, newline);
            this.#buffer = this.#buffer.slice(newline + 1);
            const line = encodedLine.trim();
            if (line.length > 0)
                yield line;
            newline = this.#buffer.indexOf("\n");
        }
    }
    /** Drop incomplete and unconsumed lines when a session closes. */
    reset() {
        this.#buffer = "";
        this.#fragments = [];
    }
}
