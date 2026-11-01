import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";

//#region dist/domain/jsonStringByteLength.js
var jsonStringByteLength;
function init_jsonStringByteLength() {
	return (init_jsonStringByteLength = __esmMin((() => {
		jsonStringByteLength = (value, budget = Number.POSITIVE_INFINITY) => {
			let bytes = 2;
			for (let index = 0; index < value.length && bytes <= budget; index++) {
				const unit = value.charCodeAt(index);
				if (unit === 34 || unit === 92) bytes += 2;
				else if (unit < 32) bytes += unit === 8 || unit === 9 || unit === 10 || unit === 12 || unit === 13 ? 2 : 6;
				else if (unit < 128) bytes += 1;
				else if (unit < 2048) bytes += 2;
				else if (unit >= 55296 && unit <= 56319) {
					const next = value.charCodeAt(index + 1);
					if (next >= 56320 && next <= 57343) {
						bytes += 4;
						index++;
					} else bytes += 6;
				} else if (unit >= 56320 && unit <= 57343) bytes += 6;
				else bytes += 3;
			}
			return bytes;
		};
	})))();
}

//#endregion
//#region dist/domain/jsonValueByteLength.js
var jsonValueByteLength;
function init_jsonValueByteLength() {
	return (init_jsonValueByteLength = __esmMin((() => {
		init_jsonStringByteLength();
		jsonValueByteLength = (value, budget = Number.POSITIVE_INFINITY) => {
			if (typeof value === "string") return jsonStringByteLength(value, budget);
			if (Array.isArray(value)) {
				let bytes = 2 + Math.max(0, value.length - 1);
				for (const child of value) {
					if (bytes > budget) break;
					bytes += jsonValueByteLength(child, budget - bytes);
				}
				return bytes;
			}
			if (value !== null && typeof value === "object") {
				const keys = Object.keys(value);
				let bytes = 2 + Math.max(0, keys.length - 1);
				for (const key of keys) {
					if (bytes > budget) break;
					bytes += jsonStringByteLength(key, budget - bytes) + 1;
					if (bytes <= budget) bytes += jsonValueByteLength(value[key], budget - bytes);
				}
				return bytes;
			}
			return typeof value === "number" && !Number.isFinite(value) ? 4 : String(value).length;
		};
	})))();
}

//#endregion
export { jsonStringByteLength as i, jsonValueByteLength as n, init_jsonStringByteLength as r, init_jsonValueByteLength as t };