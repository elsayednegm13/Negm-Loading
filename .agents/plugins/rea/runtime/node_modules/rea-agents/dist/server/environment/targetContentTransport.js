import { isCallToolResult, isJSONRPCNotification, isJSONRPCRequest, isJSONRPCResultResponse, } from "@modelcontextprotocol/server";
import { carriesTargetContentMarker, TARGET_CONTENT_RESULT_META, } from "../toolResultEncoding.js";
const requestId = (value) => typeof value === "string" || typeof value === "number" ? value : undefined;
/** Marks every tools/call result as target content, including errors the SDK builds before a replay callback runs. */
export class TargetContentTransport {
    transport;
    onclose;
    onerror;
    onmessage;
    hasPerRequestStream;
    #calls = new Set();
    constructor(transport) {
        this.transport = transport;
        if (transport.hasPerRequestStream !== undefined)
            this.hasPerRequestStream = transport.hasPerRequestStream;
        transport.onmessage = (message, extra) => {
            if (isJSONRPCRequest(message) && message.method === "tools/call")
                this.#calls.add(message.id);
            // The SDK sends no reply after a cancellation, so release the id here.
            if (isJSONRPCNotification(message) &&
                message.method === "notifications/cancelled") {
                const id = requestId(message.params?.["requestId"]);
                if (id !== undefined)
                    this.#calls.delete(id);
            }
            this.onmessage?.(message, extra);
        };
        transport.onerror = (error) => this.onerror?.(error);
        transport.onclose = () => {
            this.#calls.clear();
            this.onclose?.();
        };
    }
    get sessionId() {
        return this.transport.sessionId;
    }
    set sessionId(value) {
        this.transport.sessionId = value;
    }
    start() {
        return this.transport.start();
    }
    close() {
        return this.transport.close();
    }
    setProtocolVersion(version) {
        this.transport.setProtocolVersion?.(version);
    }
    setSupportedProtocolVersions(versions) {
        this.transport.setSupportedProtocolVersions?.(versions);
    }
    send(message, options) {
        const id = "id" in message ? requestId(message.id) : undefined;
        const call = id !== undefined && this.#calls.delete(id);
        if (call &&
            isJSONRPCResultResponse(message) &&
            isCallToolResult(message.result) &&
            !carriesTargetContentMarker(message.result))
            return this.transport.send({
                ...message,
                result: {
                    ...message.result,
                    _meta: { ...message.result._meta, ...TARGET_CONTENT_RESULT_META },
                },
            }, options);
        return this.transport.send(message, options);
    }
}
