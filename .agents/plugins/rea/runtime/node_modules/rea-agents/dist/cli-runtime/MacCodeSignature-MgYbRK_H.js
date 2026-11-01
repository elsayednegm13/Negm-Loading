import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/domain/hopperPublisher.js
var HOPPER_PUBLISHER;
function init_hopperPublisher() {
	return (init_hopperPublisher = __esmMin((() => {
		HOPPER_PUBLISHER = Object.freeze({
			bundleIdentifier: "com.cryptic-apps.hopper-web-4",
			teamIdentifier: "2AMA2753NF"
		});
	})))();
}

//#endregion
//#region dist/process/MacCodeSignature.js
var macDeveloperIdRequirement;
function init_MacCodeSignature() {
	return (init_MacCodeSignature = __esmMin((() => {
		macDeveloperIdRequirement = (identifier, teamIdentifier) => `= identifier "${identifier}" and anchor apple generic` + ` and certificate leaf[subject.OU] = "${teamIdentifier}"`;
	})))();
}

//#endregion
export { HOPPER_PUBLISHER, init_MacCodeSignature, init_hopperPublisher, macDeveloperIdRequirement };