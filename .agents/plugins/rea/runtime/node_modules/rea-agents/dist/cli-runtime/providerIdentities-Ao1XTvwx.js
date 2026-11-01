import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/browser/providerIdentities.js
var CDP_BROWSER_PROVIDER_IDENTITY, PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY, CDP_ELECTRON_PROVIDER_IDENTITY, PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY;
function init_providerIdentities() {
	return (init_providerIdentities = __esmMin((() => {
		CDP_BROWSER_PROVIDER_IDENTITY = Object.freeze({
			id: "rea-cdp-browser",
			name: "REA Chrome DevTools Protocol observation provider",
			version: "2"
		});
		PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY = Object.freeze({
			id: "rea-playwright-browser-scenario",
			name: "REA Playwright browser scenario capture provider",
			version: "1"
		});
		CDP_ELECTRON_PROVIDER_IDENTITY = Object.freeze({
			id: "rea-cdp-electron",
			name: "REA Electron file-page CDP observation provider",
			version: "1"
		});
		PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY = Object.freeze({
			id: "rea-playwright-electron-active",
			name: "REA Playwright active Electron observation provider",
			version: "1"
		});
	})))();
}

//#endregion
export { CDP_BROWSER_PROVIDER_IDENTITY, CDP_ELECTRON_PROVIDER_IDENTITY, PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY, PLAYWRIGHT_ELECTRON_ACTIVE_PROVIDER_IDENTITY, init_providerIdentities };