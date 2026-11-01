import { AnalysisError } from "../domain/analysisErrorBase.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { MCP_SHUTDOWN_FAILED } from "./messages.js";
/** Own idempotent teardown of the transport handle, providers and session for any shutdown trigger. */
export const createShutdown = (input) => {
    const { handle, session, dependencies, serverLogger } = input;
    let shutdownAttempt;
    const cleanupOwners = [
        { close: () => handle.close(), closed: false },
        ...(input.closeAndroid === undefined
            ? []
            : [{ close: input.closeAndroid, closed: false }]),
        ...(input.closeOptionalProviders === undefined
            ? []
            : [{ close: input.closeOptionalProviders, closed: false }]),
        {
            close: async () => {
                const closed = await session.close({ retainProviderDocuments: true });
                if (!closed.ok)
                    throw closed.error;
            },
            closed: false,
        },
    ];
    let shutdownUnregistered = false;
    let unregisterShutdown = () => undefined;
    const shutdown = async () => {
        if (shutdownAttempt !== undefined)
            return shutdownAttempt;
        const pending = cleanupOwners.filter(({ closed }) => !closed);
        const attempt = (async () => {
            // Seal before the drain and owner closes. A tool call admitted before
            // shutdown can reach session.open() after that close and would otherwise
            // start a provider the completed shutdown never retires. A failed drain
            // still keeps every shared owner available for a later cleanup retry.
            session.beginShutdown();
            await handle.prepareShutdown?.();
            const results = await Promise.allSettled(pending.map(async (owner) => {
                await owner.close();
                owner.closed = true;
            }));
            const failures = [];
            for (const result of results)
                if (result.status === "rejected")
                    failures.push(result.reason);
            if (failures.length === 1)
                throw failures[0];
            if (failures.length > 1)
                throw new AggregateError(failures, "Multiple MCP cleanup operations failed");
            if (!shutdownUnregistered) {
                unregisterShutdown();
                shutdownUnregistered = true;
            }
        })();
        shutdownAttempt = attempt;
        void attempt.catch(() => {
            if (shutdownAttempt === attempt)
                shutdownAttempt = undefined;
        });
        return attempt;
    };
    const requestShutdown = () => {
        shutdown().catch((cause) => {
            reportMcpShutdownFailure(cause, dependencies, serverLogger);
        });
    };
    unregisterShutdown = dependencies.registerShutdown(requestShutdown);
    return { shutdown, request: requestShutdown };
};
/** Preserve the same diagnostics for eager and deferred runtime owners. */
export const reportMcpShutdownFailure = (cause, dependencies, serverLogger) => {
    serverLogger.debug({ failure_cause: describeShutdownFailure(cause) }, "MCP shutdown rejected");
    dependencies.setExitCode(1);
    serverLogger.error(MCP_SHUTDOWN_FAILED);
    dependencies.writeStderr(`${MCP_SHUTDOWN_FAILED}\n`);
    if (cause instanceof AnalysisError)
        dependencies.writeStderr(`${projectAnalysisError(cause).message}\n`);
};
const describeShutdownFailure = (cause) => describeShutdownFailureNode(cause, new WeakSet());
const describeShutdownFailureNode = (cause, active) => {
    if (typeof cause === "object" && cause !== null) {
        if (active.has(cause))
            return { type: "cyclic_error" };
        active.add(cause);
    }
    try {
        if (cause instanceof AnalysisError)
            return { analysis_error: projectAnalysisError(cause) };
        if (cause instanceof Error) {
            const code = "code" in cause ? cause.code : undefined;
            return {
                name: cause.name,
                message: cause.message,
                ...(typeof code === "string" ||
                    (typeof code === "number" && Number.isFinite(code))
                    ? { code }
                    : {}),
                ...(cause instanceof AggregateError
                    ? {
                        errors: cause.errors.map((error) => describeShutdownFailureNode(error, active)),
                    }
                    : {}),
            };
        }
        if (cause === null ||
            typeof cause === "string" ||
            typeof cause === "boolean" ||
            (typeof cause === "number" && Number.isFinite(cause)))
            return { type: cause === null ? "null" : typeof cause, value: cause };
        return { type: typeof cause };
    }
    finally {
        if (typeof cause === "object" && cause !== null)
            active.delete(cause);
    }
};
