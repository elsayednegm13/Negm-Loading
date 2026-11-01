import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { resolve } from "node:path";

//#region dist/process/CurrentEntrypointPath.js
var normalizeEntrypointPath, CURRENT_ENTRYPOINT_PATH;
function init_CurrentEntrypointPath() {
	return (init_CurrentEntrypointPath = __esmMin((() => {
		normalizeEntrypointPath = (entrypoint) => entrypoint === undefined || entrypoint.length === 0 ? undefined : resolve(entrypoint);
		CURRENT_ENTRYPOINT_PATH = normalizeEntrypointPath(process.argv[1]);
	})))();
}

//#endregion
export { CURRENT_ENTRYPOINT_PATH, init_CurrentEntrypointPath, normalizeEntrypointPath };