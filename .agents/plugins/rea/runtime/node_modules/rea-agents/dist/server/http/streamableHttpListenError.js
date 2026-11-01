import { err, ok } from "../../domain/result.js";
const systemCode = (cause) => {
    if (typeof cause !== "object" || cause === null || !("code" in cause))
        return undefined;
    const code = cause.code;
    return typeof code === "string" ? code : undefined;
};
/** Normalize recognized Node listener system codes once, at the listener boundary. */
const classify = (cause) => {
    const code = systemCode(cause);
    switch (code) {
        case "ENOTFOUND":
        case "EAI_AGAIN":
        case "EAI_FAIL":
        case "EAI_NONAME":
        case "ENODATA":
        case "EAI_NODATA":
            return ok({ kind: "host_lookup", systemCode: code });
        case "EADDRNOTAVAIL":
            return ok({ kind: "host_unavailable", systemCode: "EADDRNOTAVAIL" });
        case "EADDRINUSE":
            return ok({ kind: "port_in_use", systemCode: "EADDRINUSE" });
        case "EACCES":
        case "EPERM":
            return ok({ kind: "permission_denied", systemCode: code });
        default:
            return err({
                kind: "unclassified",
                ...(code === undefined ? {} : { systemCode: code }),
            });
    }
};
/** Listener failure retaining its native cause, phase, and parsed recovery facts. */
export class StreamableHttpListenError extends Error {
    name = "StreamableHttpListenError";
    classification;
    phase;
    constructor(cause, phase = "startup") {
        super(phase === "startup"
            ? `MCP HTTP listener startup failed: ${cause instanceof Error ? cause.message : String(cause)}`
            : `MCP HTTP listener failed after binding: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
        this.phase = phase;
        this.classification = classify(cause);
    }
}
