import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";

//#region dist/browser/ScenarioActionSequence.js
var notExecutedActionError;
function init_ScenarioActionSequence() {
	return (init_ScenarioActionSequence = __esmMin((() => {
		notExecutedActionError = (stoppedBy) => stoppedBy === "failed" ? "not executed after an earlier action failure" : "not executed after scenario request cancellation";
	})))();
}

//#endregion
export { notExecutedActionError as n, init_ScenarioActionSequence as t };