import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";

//#region dist/domain/urlComponents.js
var urlDeclaresQueryOrFragment;
function init_urlComponents() {
	return (init_urlComponents = __esmMin((() => {
		urlDeclaresQueryOrFragment = (url) => url.href.includes("?") || url.href.includes("#");
	})))();
}

//#endregion
export { urlDeclaresQueryOrFragment as n, init_urlComponents as t };