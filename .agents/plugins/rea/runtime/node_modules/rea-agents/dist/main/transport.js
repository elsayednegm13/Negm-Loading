import { createAndroidAnalysisProvider } from "../composition/android.js";
import { createServer } from "../server/createServer.js";
import { StreamableHttpListenError } from "../server/http/streamableHttpListenError.js";
import { OwnedMcpServers } from "./OwnedMcpServers.js";
import { MCP_CONNECTION_LOST, MCP_CONNECTION_START_FAILED, MCP_HTTP_LISTEN_FAILED, } from "./messages.js";
/** Start the injected transport (stdio or streamable HTTP) around one shared session. */
export const startMcpTransport = async (dependencies, session, serverContext) => {
    const { serverLogger } = serverContext;
    let optionalProviders = {};
    try {
        optionalProviders = await serverContext.loadOptionalProviders();
    }
    catch (cause) {
        serverLogger.warn({
            error: cause instanceof Error ? cause.message : String(cause),
        }, "Optional MCP providers could not load; affected tools remain unavailable");
    }
    const { optionalProviderLoadFailures, ...observationProviders } = optionalProviders;
    for (const failure of Object.values(optionalProviderLoadFailures ?? {})) {
        serverLogger.warn({ providerId: failure.providerId, error: failure.reason }, "Optional MCP adapter could not load; its peers remain available");
    }
    const androidProviders = new Set();
    const servers = new OwnedMcpServers();
    const closeServers = async () => {
        const results = await servers.closeAll();
        const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
        if (failures.length > 0)
            throw new AggregateError(failures, "REA server cleanup failed");
    };
    const closeAndroid = async () => {
        const results = await Promise.allSettled([...androidProviders].map(async (provider) => {
            await provider.close();
            androidProviders.delete(provider);
        }));
        for (const result of results)
            if (result.status === "rejected")
                throw result.reason;
    };
    // Optional providers are shared by every server instance the SDK creates,
    // including a discarded discovery probe, so only process shutdown closes them.
    const optionalProvidersToClose = new Set(Object.values(observationProviders).filter((provider) => provider !== undefined));
    let optionalProviderClose;
    const closeOptionalProviders = async () => {
        optionalProviderClose ??= (async () => {
            const results = await Promise.allSettled([...optionalProvidersToClose].map(async (provider) => {
                await provider.close?.();
                optionalProvidersToClose.delete(provider);
            }));
            const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
            if (failures.length > 0)
                throw new AggregateError(failures, "Optional provider cleanup failed");
        })().catch((cause) => {
            optionalProviderClose = undefined;
            throw cause;
        });
        await optionalProviderClose;
    };
    let handle;
    try {
        if (serverContext.signal?.aborted)
            throw serverContext.signal.reason;
        handle = await dependencies.serve(() => servers.create(() => {
            // The SDK can discard a discovery probe and construct a replacement server.
            const android = createAndroidAnalysisProvider(serverContext.environment, undefined, serverContext.analysisSettings?.read);
            androidProviders.add(android);
            const server = (dependencies.createServer ?? createServer)({ kind: "session", session }, {
                ...(serverContext.analysisSettings === undefined
                    ? {}
                    : { analysisSettings: serverContext.analysisSettings }),
                logger: serverContext.logger,
                environment: serverContext.environment,
                delivery: serverContext.delivery,
                ...optionalProviders,
                optionalObservationProviderOwner: "caller",
                androidAnalysis: android,
            });
            return server;
        }), {
            onerror: () => {
                serverLogger.error(MCP_CONNECTION_LOST);
                dependencies.writeStderr(`${MCP_CONNECTION_LOST}\n`);
            },
            logger: serverLogger,
            ...(serverContext.signal === undefined
                ? {}
                : { signal: serverContext.signal }),
        });
    }
    catch (cause) {
        const cancelled = serverContext.signal?.aborted === true &&
            cause === serverContext.signal.reason;
        const [androidCleanup, serverCleanup, optionalProviderCleanup] = await Promise.allSettled([
            closeAndroid(),
            closeServers(),
            closeOptionalProviders(),
        ]);
        if (!cancelled) {
            const startFailure = cause instanceof StreamableHttpListenError
                ? MCP_HTTP_LISTEN_FAILED
                : MCP_CONNECTION_START_FAILED;
            serverLogger.error({
                error: cause instanceof Error ? cause.message : String(cause),
            }, startFailure);
            dependencies.writeStderr(`${startFailure}\n`);
        }
        for (const cleanup of [
            androidCleanup,
            serverCleanup,
            optionalProviderCleanup,
        ]) {
            if (cleanup.status === "rejected") {
                const reason = cleanup.reason instanceof Error
                    ? cleanup.reason.message
                    : String(cleanup.reason);
                serverLogger.error({ cleanup_error: reason }, "Provider cleanup rejected after MCP startup");
                dependencies.writeStderr(`Provider cleanup failed: ${reason}\n`);
            }
        }
        // Return the same partial owners for retry; the caller owns the binary
        // session independently of transport admission.
        return {
            ok: false,
            cancelled,
            handle: { close: closeServers },
            closeAndroid,
            closeOptionalProviders,
        };
    }
    return {
        ok: true,
        handle: {
            ...(handle.prepareShutdown === undefined
                ? {}
                : { prepareShutdown: handle.prepareShutdown }),
            close: async () => {
                await handle.prepareShutdown?.();
                const results = await Promise.allSettled([
                    handle.close(),
                    closeServers(),
                ]);
                const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
                if (failures.length === 1)
                    throw failures[0];
                if (failures.length > 1)
                    throw new AggregateError(failures, "REA transport cleanup failed");
            },
        },
        closeAndroid,
        closeOptionalProviders,
    };
};
