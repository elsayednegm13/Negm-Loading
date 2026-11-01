import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { isAbsolute, relative, sep } from "node:path";
import { z } from "zod";

//#region dist/domain/localPath.js
var nulFreeStringSchema, localPathStringSchema, absoluteLocalPathStringSchema, isPathWithinRoot;
function init_localPath() {
	return (init_localPath = __esmMin((() => {
		nulFreeStringSchema = z.string().regex(/^[^\x00]*$/u, "Local filesystem paths cannot contain NUL");
		localPathStringSchema = nulFreeStringSchema.min(1);
		absoluteLocalPathStringSchema = localPathStringSchema.regex(process.platform === "win32" ? /^(?:[\\/]|[A-Za-z]:[\\/])/u : /^\//u, "must be an absolute local filesystem path");
		isPathWithinRoot = (root, path) => {
			const value = relative(root, path);
			return value === "" || value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value);
		};
	})))();
}

//#endregion
export { nulFreeStringSchema as a, localPathStringSchema as i, init_localPath as n, isPathWithinRoot as r, absoluteLocalPathStringSchema as t };