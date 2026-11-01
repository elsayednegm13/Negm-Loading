import { Client, StreamableHTTPClientTransport, } from "@modelcontextprotocol/client";
import { AnalysisCleanupLease } from "../artifacts/AnalysisCleanupLease.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { SharedStartupAttempt } from "../process/SharedStartupAttempt.js";
/** Physical SDK failure captured before any subsequent resource cleanup. */
export class JebMcpPhysicalFailure extends Error {
    phase;
    cause;
    constructor(phase, cause) {
        super(`JEB MCP ${phase} failed`, { cause });
        this.phase = phase;
        this.cause = cause;
        this.name = "JebMcpPhysicalFailure";
    }
}
/** Acquisition failed while its exact connection still has pending cleanup. */
export class JebMcpAcquisitionCleanupFailure extends ProviderCleanupError {
    primaryFailure;
    cleanupFailure;
    constructor(primaryFailure, cleanupFailure) {
        super("jeb", cleanupFailure.cleanupResources, {
            reason: "JEB MCP acquisition and cleanup failed",
        }, {
            operation: "jeb_mcp_catalog",
            cause: new AggregateError([primaryFailure, cleanupFailure], "JEB MCP acquisition and cleanup failed", { cause: primaryFailure }),
        });
        this.primaryFailure = primaryFailure;
        this.cleanupFailure = cleanupFailure;
        this.bindCleanupDependencies([cleanupFailure]).bindCleanupResourceOwner(cleanupFailure);
    }
}
/** One SDK client owns its attached transport; failed cleanup retains both identities. */
export class JebMcpConnectionOwner {
    client = new Client({ name: "rea-jeb", version: "0.0.0" });
    transport;
    signal = new AbortController();
    tools;
    acquisition;
    acquisitionFailure;
    #clientResource;
    #transportResource;
    #lease;
    #clientClosed = false;
    #transportClosed = false;
    #disposal;
    constructor(endpoint) {
        this.transport = new StreamableHTTPClientTransport(endpoint, {
            requestInit: { redirect: "error" },
        });
        this.#clientResource = `${endpoint} (JEB MCP client)`;
        this.#transportResource = `${endpoint} (JEB MCP transport)`;
        this.#lease = new AnalysisCleanupLease(() => this.#dispose(), [this.#clientResource, this.#transportResource]);
    }
    get disposing() {
        return this.#disposal !== undefined;
    }
    get cleanupResources() {
        return [
            ...(this.#clientClosed ? [] : [this.#clientResource]),
            ...(this.#transportClosed ? [] : [this.#transportResource]),
        ];
    }
    close() {
        return this.#lease.release();
    }
    async #dispose() {
        if (this.#disposal !== undefined)
            return this.#disposal;
        const disposal = this.#closeResources();
        this.#disposal = disposal;
        try {
            await disposal;
        }
        catch (cause) {
            this.#disposal = undefined;
            throw cause;
        }
    }
    async #closeResources() {
        const failures = [];
        if (!this.#clientClosed) {
            const attached = this.client.transport === this.transport;
            try {
                await this.client.close();
                this.#clientClosed = true;
                // SDK 2.3.1 awaits its attached transport's close before resolving.
                if (attached)
                    this.#transportClosed = true;
            }
            catch (cause) {
                failures.push(cause);
            }
        }
        if (!this.#transportClosed) {
            try {
                await this.transport.close();
                this.#transportClosed = true;
            }
            catch (cause) {
                failures.push(cause);
            }
        }
        if (failures.length === 0)
            return;
        const failure = new ProviderCleanupError("jeb", this.cleanupResources, {
            reason: failures
                .map((cause) => cause instanceof Error ? cause.message : String(cause))
                .join("; "),
        }, {
            operation: "close_jeb_connection",
            cause: new AggregateError(failures, "JEB MCP connection cleanup failed"),
        }).bindCleanupResourceOwner(this);
        this.#lease.bindCleanupError(failure);
        throw failure;
    }
}
