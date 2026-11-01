import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/process/snapshotEnvironment.js
var mergeEnvironmentOverrides, snapshotEnvironment;
function init_snapshotEnvironment() {
	return (init_snapshotEnvironment = __esmMin((() => {
		mergeEnvironmentOverrides = (existing, overrides, platform = process.platform) => {
			const selected = new Map();
			for (const layer of [existing, overrides]) for (const [key, value] of Object.entries(layer)) selected.set(platform === "win32" ? key.toUpperCase() : key, [key, value]);
			return Object.freeze(Object.fromEntries(selected.values()));
		};
		snapshotEnvironment = (environment, platform = process.platform) => {
			const selected = mergeEnvironmentOverrides({}, environment, platform);
			if (platform !== "win32") return selected;
			return Object.freeze(Object.fromEntries(Object.entries(selected).map(([key, value]) => [key.toUpperCase(), value]).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)));
		};
	})))();
}

//#endregion
export { init_snapshotEnvironment, mergeEnvironmentOverrides, snapshotEnvironment };