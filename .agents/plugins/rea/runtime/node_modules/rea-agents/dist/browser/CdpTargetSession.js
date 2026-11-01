import { CDP_DISCOVERY_RESPONSE_TIMEOUT_MS, DEFAULT_CDP_COMMAND_TIMEOUT_MS, } from "../domain/browserDeadline.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { BrowserObservationError } from "../domain/browserObservationError.js";
import { CdpConnection } from "./CdpConnection.js";
import { CdpTargetSessionOwner, bindCdpTransportCleanup, } from "./CdpTargetSessionOwner.js";
import { cdpTargetWebSocket, discoverCdpBrowserSocket, discoverCdpEndpoint, withCdpDiscoveryDeadline, } from "./CdpEndpoint.js";
/**
 * Discover one passive browser endpoint through its selected transport. A
 * browser socket's handshake and discovery share one discovery deadline.
 */
export const openCdpEndpoint = async (endpoint, operation, signal, timeoutMs, owner, commandTimeoutMs) => {
    if (endpoint.transport === "http_discovery")
        return {
            discovery: await discoverCdpEndpoint(endpoint.url, operation, signal),
            connection: undefined,
        };
    const discoveryTimeoutMs = timeoutMs ?? CDP_DISCOVERY_RESPONSE_TIMEOUT_MS;
    // The browser-socket handshake and discovery commands stay on the discovery
    // deadline. The selected command deadline starts only after discovery returns.
    const discoveryLimits = {
        commandTimeoutMs: discoveryTimeoutMs,
        // Stay past the discovery abort so a stalled open is labeled as discovery,
        // not as a command_timeout_ms handshake.
        handshakeTimeoutMs: discoveryTimeoutMs + 1_000,
    };
    return await withCdpDiscoveryDeadline(operation, signal, async (deadlineSignal) => {
        const connection = owner === undefined
            ? await CdpConnection.connect(endpoint.url, operation, deadlineSignal, discoveryLimits)
            : await owner.connect(endpoint.url, operation, { signal: deadlineSignal }, "browser-endpoint", discoveryLimits);
        try {
            const discovery = await discoverCdpBrowserSocket(connection, endpoint.url, operation, deadlineSignal);
            connection.selectCommandTimeout(commandTimeoutMs ?? DEFAULT_CDP_COMMAND_TIMEOUT_MS);
            return {
                discovery,
                connection,
            };
        }
        catch (cause) {
            return await failCdpOpenAfterCleanup(connection, cause, operation, owner);
        }
    }, discoveryTimeoutMs);
};
/** Open one authorized target through its supported browser or page transport. */
export const openCdpTargetSession = async (discovery, target, operation, signal, limits, owner) => {
    const webSocket = cdpTargetWebSocket(discovery, target, operation);
    const connection = owner === undefined
        ? await CdpConnection.connect(webSocket.url, operation, signal, limits)
        : await owner.connect(webSocket.url, operation, signal === undefined ? {} : { signal }, target.id, limits);
    if (webSocket.scope === "page")
        return { connection, sessionId: undefined };
    try {
        return await attachCdpTargetSession(connection, target, operation, signal, owner);
    }
    catch (cause) {
        if (owner === undefined)
            throw cause;
        return await failCdpOpenAfterCleanup(connection, cause, operation, owner);
    }
};
/** Attach one target through an open browser socket, which the session then owns. */
export const attachCdpTargetSession = async (connection, target, operation, signal, owner) => {
    try {
        const attached = await connection.send("Target.attachToTarget", { targetId: target.id, flatten: true }, undefined, signal);
        return { connection, sessionId: attachedSessionId(attached, operation) };
    }
    catch (cause) {
        if (owner === undefined)
            return await failCdpOpenAfterCleanup(connection, cause, operation);
        throw cause;
    }
};
/** Finish failed admission without allowing cleanup to replace its primary. */
export const failCdpOpenAfterCleanup = async (connection, primary, operation, owner) => {
    try {
        if (owner === undefined)
            await connection.close();
        else
            await owner.finish(connection);
    }
    catch (cleanup) {
        throw combineOpenFailure(primary, cleanup, operation);
    }
    throw primary;
};
const combineOpenFailure = (primary, cleanup, operation) => primary instanceof AnalysisError && cleanup instanceof AnalysisError
    ? bindCdpTransportCleanup(cleanup, analysisErrorWithCleanupFailure(primary, cleanup, operation))
    : new AggregateError([primary, cleanup], `CDP operation ${operation} failed and its transport cleanup is incomplete.`, { cause: primary });
/** Disable enabled domains, detach browser sessions, and close REA's socket. */
export const closeCdpTargetSession = async (targetSession, enabledDomains, signal, owner) => {
    if (owner !== undefined) {
        await owner.finish(targetSession.connection, () => cleanupCdpTargetCommands(targetSession, enabledDomains, signal));
        return;
    }
    await cleanupCdpTargetCommands(targetSession, enabledDomains, signal);
    await targetSession.connection.close();
};
const cleanupCdpTargetCommands = async (targetSession, enabledDomains, signal) => {
    const { connection, sessionId } = targetSession;
    const cleanup = new AbortController();
    const domainSignal = signal === undefined
        ? cleanup.signal
        : AbortSignal.any([cleanup.signal, signal]);
    const timeout = setTimeout(() => cleanup.abort(), 1_000);
    timeout.unref();
    try {
        if (signal?.aborted !== true) {
            for (const domain of enabledDomains) {
                if (domainSignal.aborted)
                    break;
                try {
                    await connection.send(`${domain}.disable`, {}, sessionId, domainSignal);
                }
                catch {
                    // Best-effort domain cleanup; transport close is the definitive boundary.
                }
            }
        }
        // Cancellation skips optional domain shutdown but still releases the
        // attached session using its independent, bounded cleanup signal.
        if (!cleanup.signal.aborted && sessionId !== undefined)
            try {
                await connection.send("Target.detachFromTarget", { sessionId }, undefined, cleanup.signal);
            }
            catch {
                // Best-effort detach; transport close is the definitive boundary.
            }
    }
    finally {
        clearTimeout(timeout);
        cleanup.abort();
    }
};
const attachedSessionId = (value, operation) => {
    if (typeof value !== "object" ||
        value === null ||
        !("sessionId" in value) ||
        typeof value.sessionId !== "string" ||
        value.sessionId.length === 0)
        throw new BrowserObservationError(operation, "protocol_error");
    return value.sessionId;
};
