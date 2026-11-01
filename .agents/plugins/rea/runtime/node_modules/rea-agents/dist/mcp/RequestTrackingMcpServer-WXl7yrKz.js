import { n as __exportAll, t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { McpServer } from "@modelcontextprotocol/server";

//#region dist/server/RequestTrackingMcpServer.js
var RequestTrackingMcpServer_exports = /* @__PURE__ */ __exportAll({ RequestTrackingMcpServer: () => RequestTrackingMcpServer });
var RequestTrackingMcpServer;
function init_RequestTrackingMcpServer() {
	return (init_RequestTrackingMcpServer = __esmMin((() => {
		RequestTrackingMcpServer = class extends McpServer {
			#calls = new Set();
			#tracking = false;
			/** HTTP sessions share resources across transports; stdio keeps the SDK's original behavior. */
			enableRequestTracking() {
				this.#tracking = true;
			}
			registerTool(name, config, callback) {
				const tracked = config.inputSchema === undefined ? (context) => this.runRequest(context.mcpReq.signal, () => callback(context)) : (args, context) => this.runRequest(context.mcpReq.signal, () => callback(args, context));
				return super.registerTool(name, config, tracked);
			}
			/** Retain HTTP dispatch, tool and completion work under the HTTP owner's shared drain. */
			runRequest(signal, callback) {
				if (!this.#tracking) return callback();
				const call = Promise.resolve().then(() => {
					signal?.throwIfAborted();
					return callback();
				});
				this.#calls.add(call);
				return call.finally(() => this.#calls.delete(call));
			}
			/** Wait for running handlers, including their finally blocks; a timeout retains ownership. */
			async drainRequests(timeoutMs) {
				if (this.#calls.size === 0) return true;
				const settled = Promise.allSettled(this.#calls).then(() => true);
				if (timeoutMs === undefined) return settled;
				let timer;
				try {
					return await Promise.race([settled, new Promise((resolve) => {
						timer = setTimeout(() => resolve(false), timeoutMs);
					})]);
				} finally {
					clearTimeout(timer);
				}
			}
		};
	})))();
}

//#endregion
export { RequestTrackingMcpServer_exports as n, init_RequestTrackingMcpServer as r, RequestTrackingMcpServer as t };