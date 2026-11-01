import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { AnalysisTimeoutError } from "../../domain/analysisErrorCore.js";
import { BrowserObservationError } from "../../domain/browserObservationError.js";
import { ProviderCleanupError } from "../../domain/providerCleanupError.js";
import { analysisErrorWithCleanupFailure } from "../../domain/analysisErrorCleanup.js";
import { cdpCleanupGraceExpired, cdpCommandDeadlineRecovery, selectedCdpCommandTimeoutMs, } from "../../domain/browserDeadline.js";
import { CdpTargetSessionOwner } from "../CdpTargetSessionOwner.js";
import { classifyCdpFrameUrl, observeMainFrameUrl, } from "../CdpCaptureDocuments.js";
import { WEB_RUNTIME_LIMITS, } from "../../domain/webRuntime.js";
import { authorizeCdpTarget } from "../CdpAuthorizedTarget.js";
import { authorizedMainFrame } from "../CdpAuthorizedMainFrame.js";
import { cdpOriginScopeRefusal } from "../CdpOriginScopeError.js";
import { discoverCdpEndpoint, } from "../CdpEndpoint.js";
import { openCdpTargetSession, } from "../CdpTargetSession.js";
import { runtimeFrameTreeSchema } from "./CdpRuntimeProtocol.js";
/** Owned transport and instrumentation; the selected browser/page remain externally owned. */
export class CdpRuntimeSession {
    transport;
    discovery;
    target;
    allowedOrigins;
    operation;
    options;
    owner;
    commandTimeoutMs;
    enabledDomains = [];
    preciseCoverageMayBeActive = false;
    #completion;
    #completionTimer;
    constructor(transport, discovery, target, allowedOrigins, operation, options, owner, commandTimeoutMs) {
        this.transport = transport;
        this.discovery = discovery;
        this.target = target;
        this.allowedOrigins = allowedOrigins;
        this.operation = operation;
        this.options = options;
        this.owner = owner;
        this.commandTimeoutMs = commandTimeoutMs;
    }
    /** Acquire a validated target; failed setup releases its owned socket. */
    static async open(input, operation, options, owner) {
        const commandTimeoutMs = selectedCdpCommandTimeoutMs(input.command_timeout_ms);
        // HTTP discovery keeps its own fixed deadline. The WebSocket handshake
        // and a browser-level Target.attachToTarget each get commandTimeoutMs.
        // One deadline around both would expire a valid attach after a slow handshake.
        const discovery = await discoverCdpEndpoint(input.cdp_endpoint, operation, options.signal);
        const { target, allowedOrigins } = authorizeCdpTarget(discovery, input, operation);
        const transport = await openCdpTargetSession(discovery, target, operation, options.signal, {
            maxPayloadBytes: WEB_RUNTIME_LIMITS.protocolBytes,
            commandTimeoutMs,
        }, owner);
        try {
            const frame = runtimeMainFrame(await runtimeDeadline(operation, options.signal, (signal) => authorizedMainFrame({
                ...transport,
                allowedOrigins,
                signal,
                operation,
            }), commandTimeoutMs, "command", "Page.getFrameTree"), allowedOrigins);
            const url = runtimeFrameUrl(frame, operation);
            return new CdpRuntimeSession(transport, discovery, {
                target_id: target.id,
                initial_url: url.url,
                origin: url.origin,
                frame_id: frame.id,
                loader_id: frame.loaderId ?? null,
            }, allowedOrigins, operation, options, owner, commandTimeoutMs);
        }
        catch (cause) {
            try {
                await owner.finish(transport.connection);
            }
            catch (cleanupCause) {
                if (cause instanceof AnalysisError &&
                    cleanupCause instanceof AnalysisError)
                    throw analysisErrorWithCleanupFailure(cause, cleanupCause, operation);
                throw new AggregateError([cause, cleanupCause], `CDP runtime setup ${operation} failed and cleanup remains incomplete.`, { cause });
            }
            throw cause;
        }
    }
    /** Bound each command separately from the caller-selected observation duration. */
    async command(method, params = {}) {
        const signals = [this.options.signal, this.#completion?.signal].filter((signal) => signal !== undefined);
        try {
            return await runtimeDeadline(this.operation, signals.length === 0 ? undefined : AbortSignal.any(signals), (signal) => this.transport.connection.send(method, params, this.transport.sessionId, signal), this.commandTimeoutMs, "command", method);
        }
        catch (cause) {
            if (this.#completion?.signal.aborted && !this.options.signal?.aborted) {
                const recovery = cdpCommandDeadlineRecovery(this.commandTimeoutMs, "source-join");
                throw new AnalysisTimeoutError(this.operation, this.commandTimeoutMs, recovery);
            }
            throw cause;
        }
    }
    /** Bound the complete inspection/source-join phase as well as each individual command. */
    beginCompletion() {
        if (this.#completion !== undefined)
            return;
        this.#completion = new AbortController();
        this.#completionTimer = setTimeout(() => this.#completion?.abort(), this.commandTimeoutMs);
    }
    /** Register cleanup before sending: cancellation can occur after producer acceptance. */
    async enable(domain) {
        this.enabledDomains.push(domain);
        await this.command(`${domain}.enable`);
    }
    /** Check document identity before joining any live node or final coverage evidence. */
    async assertDocument() {
        const frame = runtimeMainFrame(await this.command("Page.getFrameTree"), this.allowedOrigins);
        if (frame.id !== this.target.frame_id ||
            (frame.loaderId ?? null) !== this.target.loader_id ||
            (this.target.loader_id === null &&
                ((frame.url !== undefined && frame.url !== this.target.initial_url) ||
                    frame.scope === "outside_policy" ||
                    frame.scope === "unsupported")))
            throw new BrowserObservationError(this.operation, "target_changed", {
                detail: `Selected target ${this.target.target_id} changed document during ${this.operation}.`,
            });
        runtimeFrameUrl(frame, this.operation, `Selected target ${this.target.target_id} moved to an unselected origin during ${this.operation}.`);
    }
    /** Cleanup uses its own deadline after caller cancellation, then closes REA's transport. */
    async close(previousError, objectGroup) {
        if (this.#completionTimer !== undefined)
            clearTimeout(this.#completionTimer);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), WEB_RUNTIME_LIMITS.cleanupTimeoutMs);
        // Switch before the first restoration send. A short command_timeout_ms
        // would otherwise expire the connection timer and report cleanup_failed.
        this.transport.connection.beginCleanupGrace(WEB_RUNTIME_LIMITS.cleanupTimeoutMs);
        const failures = [];
        let transportFailure;
        const send = async (method, params = {}) => {
            try {
                await this.transport.connection.send(method, params, this.transport.sessionId, controller.signal);
            }
            catch (cause) {
                failures.push(`${method}: ${cause instanceof AnalysisError ? (cause.userMessage ?? cause.message) : cause instanceof Error ? cause.message : String(cause)}`);
            }
        };
        try {
            if (this.preciseCoverageMayBeActive)
                await send("Profiler.stopPreciseCoverage");
            if (objectGroup !== undefined)
                await send("Runtime.releaseObjectGroup", { objectGroup });
            for (const domain of [...this.enabledDomains].reverse())
                await send(`${domain}.disable`);
            if (this.transport.sessionId !== undefined) {
                try {
                    await this.transport.connection.send("Target.detachFromTarget", { sessionId: this.transport.sessionId }, undefined, controller.signal);
                }
                catch (cause) {
                    failures.push(`Target.detachFromTarget: ${cause instanceof AnalysisError ? (cause.userMessage ?? cause.message) : cause instanceof Error ? cause.message : String(cause)}`);
                }
            }
        }
        finally {
            clearTimeout(timer);
            if (controller.signal.aborted)
                failures.push(cdpCleanupGraceExpired());
            try {
                await this.owner.finish(this.transport.connection);
            }
            catch (cause) {
                transportFailure =
                    cause instanceof AnalysisError
                        ? cause
                        : new ProviderCleanupError("rea-cdp-browser", [this.target.target_id], {
                            reason: cause instanceof Error ? cause.message : String(cause),
                        }, { operation: this.operation, cause });
                failures.push(`CDP WebSocket close: ${transportFailure.userMessage ?? transportFailure.message}`);
            }
        }
        return failures.length === 0
            ? undefined
            : new ProviderCleanupError("rea-cdp-browser", [this.target.target_id, "runtime-instrumentation"], {
                target_id: this.target.target_id,
                cleanup_failures: failures,
                previous_error: previousError?.userMessage ?? previousError?.message ?? null,
            }, {
                operation: this.operation,
                ...(transportFailure === undefined
                    ? {}
                    : { cause: transportFailure }),
            });
    }
}
/** Runtime validates document IDs; CDP owns URL and scope interpretation. */
const runtimeMainFrame = (result, allowedOrigins) => ({
    ...runtimeFrameTreeSchema.parse(result).frameTree.frame,
    ...classifyCdpFrameUrl(observeMainFrameUrl(result), allowedOrigins),
});
const runtimeFrameUrl = (frame, operation, detail) => {
    if (frame.scope === "outside_policy" || frame.scope === "unsupported")
        throw cdpOriginScopeRefusal(operation, detail === undefined ? {} : { detail });
    if (frame.url === undefined || frame.origin === null)
        throw new BrowserObservationError(operation, "protocol_error");
    return { url: frame.url, origin: frame.origin };
};
/** Apply a disposable command deadline without turning timeout into caller cancellation. */
export const runtimeDeadline = async (operation, signal, run, timeoutMs = selectedCdpCommandTimeoutMs(undefined), phase = "command", method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await run(signal === undefined
            ? controller.signal
            : AbortSignal.any([signal, controller.signal]));
    }
    catch (cause) {
        if (controller.signal.aborted && signal?.aborted !== true) {
            if (cause instanceof AnalysisError && cause.userMessage !== undefined)
                throw cause;
            const recovery = cdpCommandDeadlineRecovery(timeoutMs, phase, method ?? (phase === "handshake" ? undefined : "session setup"));
            throw new AnalysisTimeoutError(operation, timeoutMs, recovery);
        }
        throw cause;
    }
    finally {
        clearTimeout(timer);
    }
};
