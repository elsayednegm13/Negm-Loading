/** A named resource-limit failure that keeps budget exhaustion out of decode errors. */
export class InterfaceBuilderDecodeBudgetExceeded extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = "InterfaceBuilderDecodeBudgetExceeded";
    }
}
/** Map shared plist preflight limits to Interface Builder's public reason. */
export const interfaceBuilderDecodeBudgetFailure = (_kind, message) => new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", message);
/** Shared byte budget for decoder records and projected archive data. */
export class InterfaceBuilderDecodeBudget {
    #initialBytes;
    #remainingBytes;
    constructor(maxBytes) {
        this.#initialBytes = maxBytes;
        this.#remainingBytes = maxBytes;
    }
    /** Representation bytes still available for the current inspection. */
    get remainingBytes() {
        return this.#remainingBytes;
    }
    /** Representation bytes reserved so far. */
    get usedBytes() {
        return this.#initialBytes - this.#remainingBytes;
    }
    /** Reserve representation bytes before allocation, or report exhaustion. */
    reserve(bytes, message) {
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > this.#remainingBytes)
            throw new InterfaceBuilderDecodeBudgetExceeded("aggregate_decode_budget_exhausted", message);
        this.#remainingBytes -= bytes;
    }
    /** Return a reservation whose representation was rejected and not retained. */
    release(bytes) {
        this.#remainingBytes = Math.min(this.#initialBytes, this.#remainingBytes + bytes);
    }
    /** Reserve an upper bound for one JSON-serialized string occurrence. */
    reserveJsonStringOccurrence(value) {
        // JSON escaping uses at most six ASCII bytes per UTF-16 code unit, plus
        // quotes. Count occurrences even when the source string is shared.
        this.reserve(value.length * 6 + 2, "projected JSON strings exceed the aggregate Interface Builder decode budget");
    }
    /** Reserve the exact JSON string length for a base64 value from Buffer. */
    reserveBase64JsonStringOccurrence(value) {
        // Buffer's base64 alphabet contains no JSON-escaped characters.
        this.reserve(value.length + 2, "projected NIB base64 values exceed the aggregate Interface Builder decode budget");
    }
    /** Reserve an upper bound for one JSON object property name occurrence. */
    reserveJsonPropertyNameOccurrence(value) {
        this.reserve(value.length * 6 + 3, "projected JSON property names exceed the aggregate Interface Builder decode budget");
    }
    /** Reserve bytes for an optional projection without throwing on exhaustion. */
    tryReserve(bytes) {
        if (!Number.isSafeInteger(bytes) ||
            bytes < 0 ||
            bytes > this.#remainingBytes)
            return false;
        this.#remainingBytes -= bytes;
        return true;
    }
}
