import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
import { DeferredAnalysisClient } from "../../providers/DeferredAnalysisClient.js";
/**
 * Preserve synchronous provider discovery while loading implementation modules
 * only when a target-bound client first executes.
 */
export class LazyAnalysisProvider {
    #providerIdentity;
    #capabilityDescriptors;
    #loadProvider;
    #provider;
    constructor(options) {
        this.#providerIdentity = options.identity;
        this.#capabilityDescriptors = options.capabilities;
        this.#loadProvider = options.load;
    }
    /** Return source-declared provider identity without loading its implementation. */
    identity() {
        return this.#providerIdentity;
    }
    /** Return source-declared capability metadata without loading its implementation. */
    capabilities() {
        return this.#capabilityDescriptors;
    }
    /** Create a client whose implementation is loaded on first execution. */
    createClient(target, profile, context) {
        return new DeferredAnalysisClient(async (signal) => {
            const provider = await this.#load();
            if (signal.aborted)
                throw new AnalysisCancelledError("create_analysis_client", {
                    cause: signal.reason,
                });
            return provider.createClient(target, profile, context);
        }, this.#providerIdentity.id);
    }
    async #load() {
        this.#provider ??= this.#loadProvider().catch((cause) => {
            this.#provider = undefined;
            throw cause;
        });
        return this.#provider;
    }
}
