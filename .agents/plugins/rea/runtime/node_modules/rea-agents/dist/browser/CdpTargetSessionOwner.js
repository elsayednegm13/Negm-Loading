import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { CdpConnection } from "./CdpConnection.js";
/** Typed ownership facts shared by transport errors and their adapter projections. */
class CdpTransportCleanupFailure extends ProviderCleanupError {
    cleanupLeases;
    constructor(cleanupLeases, failure) {
        super("rea-cdp-browser", failure.resources, failure.diagnostics, {
            operation: failure.operation,
            cause: failure.cause,
        });
        this.cleanupLeases = cleanupLeases;
        new AnalysisCleanupLeaseGroup(this, cleanupLeases);
    }
}
/** Bind a translated error without interpreting diagnostic cause chains. */
export const bindCdpTransportCleanup = (cause, failure) => {
    if (cause instanceof CdpTransportCleanupFailure)
        new AnalysisCleanupLeaseGroup(failure, cause.cleanupLeases);
    return failure;
};
/** Retains exact REA-owned CDP transports until their close is observed. */
export class CdpTargetSessionOwner {
    #connections = new Map();
    #closing = false;
    #admissions = 0;
    #closePromise;
    #admissionWaiters = new Set();
    /** Admit and own one WebSocket from handshake completion onward. */
    async connect(url, operation, options, resource, limits) {
        if (this.#closing)
            throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
        await this.retryPending();
        if (this.#closing)
            throw new ProviderCleanupError("rea-cdp-browser", [resource], { reason: "CDP provider is closing and cannot admit another session." }, { operation });
        if (options.signal?.aborted === true)
            throw new AnalysisCancelledError(operation, {
                cause: options.signal.reason,
            });
        this.#admissions += 1;
        let connection;
        try {
            return await CdpConnection.connect(url, operation, options.signal, limits, (opened) => {
                connection = opened;
                this.register(opened, operation, resource);
            });
        }
        catch (cause) {
            if (connection === undefined)
                throw cause;
            try {
                await this.finish(connection);
            }
            catch (cleanupCause) {
                if (cause instanceof AnalysisError &&
                    cleanupCause instanceof AnalysisError)
                    throw bindCdpTransportCleanup(cleanupCause, analysisErrorWithCleanupFailure(cause, cleanupCause, operation));
                throw new AggregateError([cause, cleanupCause], `CDP operation ${operation} failed during handshake and cleanup remains incomplete.`, { cause });
            }
            throw cause;
        }
        finally {
            this.#admissions -= 1;
            if (this.#admissions === 0) {
                for (const resolve of this.#admissionWaiters)
                    resolve();
                this.#admissionWaiters.clear();
            }
        }
    }
    /** Register synchronously before awaiting the WebSocket handshake. */
    register(connection, operation, resource) {
        let settle = () => undefined;
        const settled = new Promise((resolve) => {
            settle = resolve;
        });
        this.#connections.set(connection, {
            connection,
            operation,
            resource,
            cleanupLease: new AnalysisCleanupLease(() => connection.close(), [resource]),
            active: true,
            settled,
            settle,
            cleanup: undefined,
            cleanupAttempted: false,
            failure: undefined,
        });
    }
    /** Finish one admitted operation, retaining a failed transport for retry. */
    async finish(connection, cleanup) {
        const record = this.#connections.get(connection);
        if (record === undefined)
            return;
        if (record.failure !== undefined)
            throw record.failure;
        record.cleanup ??= cleanup;
        try {
            if (!record.cleanupAttempted && record.cleanup !== undefined) {
                record.cleanupAttempted = true;
                await record.cleanup();
            }
            await record.cleanupLease.release();
            this.#connections.delete(connection);
        }
        catch (cause) {
            const failure = cleanupError(record, cause);
            record.failure = failure;
            throw failure;
        }
        finally {
            record.active = false;
            record.settle();
        }
    }
    /** Retry only retained failed transports; active peers finish their own cleanup. */
    async close() {
        this.#closing = true;
        this.#closePromise ??= this.#closeAll().catch((cause) => {
            this.#closePromise = undefined;
            throw cause;
        });
        return await this.#closePromise;
    }
    /** Retry retained failures without touching concurrently active sessions. */
    async retryPending() {
        const failures = [];
        for (const record of this.#connections.values()) {
            if (record.active || record.failure === undefined)
                continue;
            try {
                await record.cleanupLease.release();
                this.#connections.delete(record.connection);
            }
            catch (cause) {
                const failure = cleanupError(record, cause);
                record.failure = failure;
                failures.push(failure);
            }
        }
        if (failures.length === 1)
            throw failures[0];
        if (failures.length > 1)
            throw aggregateCleanupFailures(failures);
    }
    async #closeAll() {
        while (this.#admissions > 0)
            await new Promise((resolve) => this.#admissionWaiters.add(resolve));
        while (true) {
            const active = [...this.#connections.values()].filter(({ active }) => active);
            if (active.length === 0)
                break;
            await Promise.all(active.map(({ settled }) => settled));
        }
        const failures = [];
        for (const record of this.#connections.values()) {
            try {
                await record.cleanupLease.release();
                this.#connections.delete(record.connection);
            }
            catch (cause) {
                const failure = cleanupError(record, cause);
                record.failure = failure;
                failures.push(failure);
            }
        }
        if (failures.length === 1)
            throw failures[0];
        if (failures.length > 1)
            throw aggregateCleanupFailures(failures);
    }
}
const cleanupError = (record, cause) => new CdpTransportCleanupFailure([record.cleanupLease], {
    resources: [record.resource],
    operation: record.operation,
    cause,
    diagnostics: {
        reason: cause instanceof AnalysisError
            ? (cause.userMessage ?? cause.message)
            : cause instanceof Error
                ? cause.message
                : String(cause),
    },
});
const aggregateCleanupFailures = (failures) => new CdpTransportCleanupFailure(failures.flatMap((failure) => failure.cleanupLeases), {
    resources: failures.flatMap(({ cleanupResources }) => cleanupResources),
    operation: "close_cdp_transports",
    cause: new AggregateError(failures, "One or more REA-owned CDP transports remain open."),
    diagnostics: {
        failures: failures.map(({ message, diagnostics }) => ({
            message,
            diagnostics: diagnostics ?? {},
        })),
    },
});
