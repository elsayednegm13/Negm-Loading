import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { APPLE_APPLICATION_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { init_appleApplication, projectAppleInventory } from "./appleApplication-Drcl7Tde.js";
import { init_InventoryProjectionEvidence, projectInventoryEvidence } from "./InventoryProjectionEvidence-CN9mPw9E.js";

//#region dist/application/apple/AppleApplicationService.js
var OPERATION, projectAppleApplicationEvidence;
function init_AppleApplicationService() {
	return (init_AppleApplicationService = __esmMin((() => {
		init_appleApplication();
		init_investigationProviders();
		init_InventoryProjectionEvidence();
		OPERATION = "project_apple_application_graph";
		projectAppleApplicationEvidence = (rawInput) => {
			return projectInventoryEvidence({
				rawInput,
				project: projectAppleInventory,
				operation: OPERATION,
				predicateType: "rea.apple-application-graph",
				provider: APPLE_APPLICATION_PROVIDER,
				subjectFormat: (first) => first.subject?.format ?? "unknown"
			});
		};
	})))();
}

//#endregion
init_AppleApplicationService();
export { projectAppleApplicationEvidence };