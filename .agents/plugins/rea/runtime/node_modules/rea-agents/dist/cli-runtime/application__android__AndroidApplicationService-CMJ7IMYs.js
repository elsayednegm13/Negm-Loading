import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ANDROID_APPLICATION_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { init_androidApplication, projectAndroidInventory } from "./androidApplication-BM-Wcg5K.js";
import { init_InventoryProjectionEvidence, projectInventoryEvidence } from "./InventoryProjectionEvidence-CN9mPw9E.js";

//#region dist/application/android/AndroidApplicationService.js
var OPERATION, projectAndroidApplicationEvidence;
function init_AndroidApplicationService() {
	return (init_AndroidApplicationService = __esmMin((() => {
		init_androidApplication();
		init_investigationProviders();
		init_InventoryProjectionEvidence();
		OPERATION = "project_android_application_graph";
		projectAndroidApplicationEvidence = (rawInput) => {
			return projectInventoryEvidence({
				rawInput,
				project: projectAndroidInventory,
				operation: OPERATION,
				predicateType: "rea.android-application-graph",
				provider: ANDROID_APPLICATION_PROVIDER,
				subjectFormat: () => "apk"
			});
		};
	})))();
}

//#endregion
init_AndroidApplicationService();
export { projectAndroidApplicationEvidence };