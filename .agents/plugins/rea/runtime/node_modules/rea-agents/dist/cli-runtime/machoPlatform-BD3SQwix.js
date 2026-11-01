import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/domain/apple/machoPlatform.js
var legacyMachoPlatform;
function init_machoPlatform() {
	return (init_machoPlatform = __esmMin((() => {
		legacyMachoPlatform = (platform, cpuType) => {
			if (platform === 3) return cpuType === 16777223 ? 8 : 3;
			if (cpuType === 7 || cpuType === 16777223) {
				if (platform === 2) return 7;
				if (platform === 4) return 9;
			}
			return platform;
		};
	})))();
}

//#endregion
export { init_machoPlatform, legacyMachoPlatform };