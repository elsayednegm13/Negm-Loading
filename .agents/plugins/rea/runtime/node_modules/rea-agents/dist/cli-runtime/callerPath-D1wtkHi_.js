import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { posix, win32 } from "node:path";

//#region dist/filesystem/callerPath.js
var absoluteCallerPath;
function init_callerPath() {
	return (init_callerPath = __esmMin((() => {
		absoluteCallerPath = (path, { cwd = process.cwd(), platform = process.platform } = {}) => {
			if (platform === "win32") return win32.resolve(cwd, path);
			if (!posix.isAbsolute(path)) {
				const base = posix.isAbsolute(cwd) ? cwd : absoluteCallerPath(cwd, { platform });
				return absoluteCallerPath(`${base}/${path}`, { platform });
			}
			const segments = path.split("/").filter((segment) => segment !== "" && segment !== ".");
			const directory = /\/\.?$/u.test(path) && segments.length > 0;
			return `/${segments.join("/")}${directory ? "/" : ""}`;
		};
	})))();
}

//#endregion
export { absoluteCallerPath, init_callerPath };