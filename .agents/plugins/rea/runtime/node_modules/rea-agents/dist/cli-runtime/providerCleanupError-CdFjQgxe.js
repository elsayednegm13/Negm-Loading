import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ProviderAdapterError, init_providerAdapterError } from "./analysisErrorProjection-DCiob2UF.js";

//#region dist/domain/providerCleanupError.js
var ProviderCleanupError;
function init_providerCleanupError() {
	return (init_providerCleanupError = __esmMin((() => {
		init_providerAdapterError();
		ProviderCleanupError = class extends ProviderAdapterError {
			cleanupIncomplete = true;
			userMessage = "Provider cleanup could not be fully confirmed. Review the reported local resources before opening another target.";
			constructor(providerId, resources, diagnostics, options) {
				const { operation = "close_binary", ...errorOptions } = options ?? {};
				super(providerId, operation, {
					...errorOptions,
					diagnostics
				});
				this.setCleanupResources(resources);
			}
		};
	})))();
}

//#endregion
export { ProviderCleanupError, init_providerCleanupError };