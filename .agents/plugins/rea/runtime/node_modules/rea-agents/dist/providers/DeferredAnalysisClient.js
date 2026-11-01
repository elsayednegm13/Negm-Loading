import { AnalysisError } from "../domain/analysisErrorBase.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err } from "../domain/result.js";
import { AnalysisClientCreation } from "./AnalysisClientCreation.js";
/** Expose a closeable client before deferred prerequisite work starts. */
export class DeferredAnalysisClient {
    #creation;
    #providerId;
    executeIfReady = (operation, parameters, options) => this.#creation.readyClient?.executeIfReady?.(operation, parameters, options) ?? Promise.resolve(undefined);
    constructor(loadClient, providerId) {
        this.#creation = new AnalysisClientCreation(providerId, loadClient);
        this.#providerId = providerId;
    }
    execute = async (operation, parameters, options) => {
        try {
            const loaded = await this.#creation.acquire(operation, options?.signal);
            if (!loaded.ok)
                return loaded;
            if (this.#creation.readyClient !== loaded.value)
                return err(new ProviderAdapterError(this.#providerId, operation, {
                    diagnostics: { reason: "client_closed" },
                }));
            return await loaded.value.execute(operation, parameters, options);
        }
        catch (cause) {
            if (cause instanceof AnalysisError)
                return err(cause);
            return err(new ProviderAdapterError(this.#providerId, operation, {
                cause,
            }));
        }
    };
    runtimeLineageSnapshots() {
        return this.#creation.ownedClient?.runtimeLineageSnapshots?.() ?? [];
    }
    requestActivitySnapshots() {
        return this.#creation.ownedClient?.requestActivitySnapshots?.() ?? [];
    }
    reuseReadiness() {
        if (!this.#creation.reusable || this.#creation.readyClient === undefined)
            return "blocked";
        return this.#creation.readyClient.reuseReadiness?.() ?? "unknown";
    }
    operationHealthSnapshot() {
        return this.#creation.ownedClient?.operationHealthSnapshot?.();
    }
    close = (options) => this.#creation.close(options);
}
