import { once } from "node:events";
/** Cancel DNS/bind through Node's listener owner without coupling later shutdown to the startup signal. */
export const listenHttpServer = async (server, host, port, signal) => {
    signal?.throwIfAborted();
    const startup = new AbortController();
    const cancel = () => startup.abort(signal?.reason);
    signal?.addEventListener("abort", cancel, { once: true });
    try {
        server.listen({ host, port, signal: startup.signal });
        await once(server, "listening", { signal: startup.signal });
        startup.signal.throwIfAborted();
    }
    catch (cause) {
        if (startup.signal.aborted &&
            (cause === startup.signal.reason ||
                (cause instanceof Error && cause.name === "AbortError"))) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error === undefined ||
                        ("code" in error && error.code === "ERR_SERVER_NOT_RUNNING"))
                        resolve();
                    else
                        reject(error);
                });
                server.closeAllConnections();
            });
            throw startup.signal.reason;
        }
        throw cause;
    }
    finally {
        signal?.removeEventListener("abort", cancel);
    }
};
