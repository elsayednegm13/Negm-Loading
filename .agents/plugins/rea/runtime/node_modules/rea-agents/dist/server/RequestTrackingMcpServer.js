import { McpServer, } from "@modelcontextprotocol/server";
/** Tracks tools automatically; other resource-using MCP callbacks use runRequest. */
export class RequestTrackingMcpServer extends McpServer {
    #calls = new Set();
    #tracking = false;
    /** HTTP sessions share resources across transports; stdio keeps the SDK's original behavior. */
    enableRequestTracking() {
        this.#tracking = true;
    }
    registerTool(name, config, callback) {
        // The SDK calls a schema-less callback with context alone, and a schema'd
        // callback with (validated input, context). Narrow its conditional type at
        // the same inputSchema discriminant used by the SDK.
        const tracked = config.inputSchema === undefined
            ? (context) => this.runRequest(context.mcpReq.signal, () => callback(context))
            : (args, context) => this.runRequest(context.mcpReq.signal, () => callback(args, context));
        return super.registerTool(name, config, tracked);
    }
    /** Retain HTTP dispatch, tool and completion work under the HTTP owner's shared drain. */
    runRequest(signal, callback) {
        if (!this.#tracking)
            return callback();
        // SDK validation can finish after its transport closed. Such a callback
        // must never start work against the next session's shared resources.
        const call = Promise.resolve().then(() => {
            signal?.throwIfAborted();
            return callback();
        });
        this.#calls.add(call);
        return call.finally(() => this.#calls.delete(call));
    }
    /** Wait for running handlers, including their finally blocks; a timeout retains ownership. */
    async drainRequests(timeoutMs) {
        if (this.#calls.size === 0)
            return true;
        const settled = Promise.allSettled(this.#calls).then(() => true);
        if (timeoutMs === undefined)
            return settled;
        let timer;
        try {
            return await Promise.race([
                settled,
                new Promise((resolve) => {
                    timer = setTimeout(() => resolve(false), timeoutMs);
                }),
            ]);
        }
        finally {
            clearTimeout(timer);
        }
    }
}
