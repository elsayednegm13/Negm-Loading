import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";

//#region dist/process/AbortablePromise.js
var ABORTED, waitForAbortable;
function init_AbortablePromise() {
	return (init_AbortablePromise = __esmMin((() => {
		ABORTED = Symbol("aborted");
		waitForAbortable = async (pending, signal) => {
			if (signal === undefined) return pending;
			let onAbort;
			const cancelled = new Promise((resolve) => {
				if (signal.aborted) {
					resolve(ABORTED);
					return;
				}
				onAbort = () => resolve(ABORTED);
				signal.addEventListener("abort", onAbort, { once: true });
			});
			try {
				return await Promise.race([cancelled, pending]);
			} finally {
				if (onAbort !== undefined) signal.removeEventListener("abort", onAbort);
			}
		};
	})))();
}

//#endregion
export { ABORTED, init_AbortablePromise, waitForAbortable };