import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_runtimeVersion, javaScriptRuntime } from "./cliOutput-3g9bk55s.js";

//#region dist/process/JavaScriptWorkerMemoryLimit.js
var MIB, BUN_WORKER_RUNTIME_RESERVE_BYTES, javaScriptWorkerMemoryLimitBytes;
function init_JavaScriptWorkerMemoryLimit() {
	return (init_JavaScriptWorkerMemoryLimit = __esmMin((() => {
		init_runtimeVersion();
		MIB = 1024 * 1024;
		BUN_WORKER_RUNTIME_RESERVE_BYTES = 512 * MIB;
		javaScriptWorkerMemoryLimitBytes = (heapBudgetMiB, host = process) => host.platform === "win32" && javaScriptRuntime(host.versions).id === "bun" ? heapBudgetMiB * MIB + BUN_WORKER_RUNTIME_RESERVE_BYTES : null;
	})))();
}

//#endregion
export { init_JavaScriptWorkerMemoryLimit, javaScriptWorkerMemoryLimitBytes };