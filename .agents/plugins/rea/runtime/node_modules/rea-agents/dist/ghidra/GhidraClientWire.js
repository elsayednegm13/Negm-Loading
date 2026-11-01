import { bridgeRequestOversizeError, } from "../config/bridgeMaxRequestBytes.js";
import { jsonValueByteLength } from "../domain/jsonValueByteLength.js";
import { err } from "../domain/result.js";
/** Owns the socket write and pending-reply lifecycle for one bridge session. */
export class GhidraWire {
    #options;
    constructor(options) {
        this.#options = options;
    }
    /** Write one authenticated request and return its correlated reply. */
    async request(method, params, options) {
        const socket = this.#options.getSocket();
        const token = this.#options.getToken();
        if (socket === undefined || socket.destroyed || token === undefined)
            return err(this.#options.failure("process", "Ghidra bridge is unavailable"));
        if (options.signal?.aborted === true)
            return err(this.#cancelled(options.signal));
        const id = this.#options.nextId();
        if (options.timeoutMs !== undefined && options.timeoutMs <= 0)
            return err(this.#options.failure("timeout", "Ghidra request deadline elapsed", undefined, { timeoutMs: options.timeoutMs }));
        const timeoutMs = options.timeoutMs;
        const payloadValue = {
            id,
            token,
            method,
            params,
            ...(options.decompileTimeoutSeconds === undefined
                ? {}
                : { decompile_timeout_seconds: options.decompileTimeoutSeconds }),
        };
        const payloadBytes = jsonValueByteLength(payloadValue);
        // Refuse before registering the operation and before any socket write, so
        // an oversized request never reaches the bridge or occupies a pending key.
        if (payloadBytes > this.#options.bridgeMaxRequestBytes.maximumBytes) {
            const oversize = bridgeRequestOversizeError(method, this.#options.bridgeMaxRequestBytes, payloadBytes, "Ghidra");
            return err(this.#options.failure("admission", oversize.message, oversize));
        }
        const payload = JSON.stringify(payloadValue);
        const response = this.#options.pending.wait(id, {
            ...(timeoutMs === undefined
                ? {}
                : {
                    timeoutMs,
                    timeoutValue: () => err(this.#options.failure("timeout", "Ghidra bridge request timed out", undefined, { timeoutMs })),
                }),
            ...(options.signal === undefined ? {} : { signal: options.signal }),
            cancelledValue: () => err(this.#cancelled(options.signal)),
        });
        socket.write(`${payload}\n`, (cause) => {
            if (cause !== undefined && cause !== null)
                this.#options.pending.settle(id, err(this.#options.failure("process", "Ghidra bridge write failed", cause)));
        });
        const result = await response;
        this.#options.logger[result.ok ? "debug" : "warn"]({ method, status: result.ok ? "ok" : "error" }, "Ghidra bridge request completed");
        return result;
    }
    #cancelled(signal) {
        return this.#options.failure("cancelled", "Ghidra request was cancelled", signal?.reason, signal === undefined ? {} : { cancellation: { reason: signal.reason } });
    }
}
