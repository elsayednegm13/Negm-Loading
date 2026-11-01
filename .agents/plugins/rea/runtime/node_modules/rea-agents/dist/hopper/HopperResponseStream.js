import { parseBridgeMessageLine, } from "./protocol.js";
import { DecodedNdjsonLineBuffer } from "../process/DecodedNdjsonLineBuffer.js";
/** Incrementally validates Hopper NDJSON response frames. */
export class HopperResponseStream {
    options;
    #lines = new DecodedNdjsonLineBuffer();
    constructor(options) {
        this.options = options;
    }
    push(chunk) {
        for (const line of this.#lines.push(chunk))
            if (!this.#acceptLine(line))
                break;
    }
    reset() {
        this.#lines.reset();
    }
    #acceptLine(line) {
        const parsed = parseBridgeMessageLine(line);
        if (!parsed.ok) {
            this.options.abort(parsed.error.message, parsed.error);
            return false;
        }
        if (this.options.accept(parsed.value))
            return true;
        if (parsed.value.id >= this.options.nextRequestId() ||
            this.options.hasQueued(parsed.value.id)) {
            this.options.abort("Hopper returned an unknown response id");
            return false;
        }
        return true;
    }
}
