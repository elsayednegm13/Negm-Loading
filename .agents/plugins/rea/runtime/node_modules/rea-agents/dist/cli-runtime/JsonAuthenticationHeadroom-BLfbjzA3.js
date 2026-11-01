import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisResourceConstraintError, err, init_analysisErrorCore, init_jsonSerialization, init_result, jsonStringCodeUnits, ok } from "./jsonLines-Gf10X4s1.js";
import { getHeapStatistics } from "node:v8";

//#region dist/application/JsonAuthenticationHeadroom.js
var AUTHENTICATION_COPIES, estimateJsonStorage, requireAuthenticationHeadroom;
function init_JsonAuthenticationHeadroom() {
	return (init_JsonAuthenticationHeadroom = __esmMin((() => {
		init_jsonSerialization();
		init_analysisErrorCore();
		init_result();
		AUTHENTICATION_COPIES = 2;
		estimateJsonStorage = (value) => {
			let valueBytes = 0;
			let serializedCharacters = 0;
			const stack = [[value][Symbol.iterator]()];
			while (stack.length > 0) {
				const next = stack[stack.length - 1].next();
				if (next.done) {
					stack.pop();
					continue;
				}
				const item = next.value;
				if (typeof item === "string") {
					valueBytes += 64 + item.length * 2;
					serializedCharacters += jsonStringCodeUnits(item);
				} else if (Array.isArray(item)) {
					valueBytes += 128 + item.length * 16;
					serializedCharacters += 2 + Math.max(0, item.length - 1);
					stack.push(item.values());
				} else if (typeof item === "object" && item !== null) {
					valueBytes += 128;
					serializedCharacters += 2;
					stack.push((function* () {
						let count = 0;
						for (const key in item) {
							if (!Object.hasOwn(item, key)) continue;
							valueBytes += 64 + key.length * 2;
							serializedCharacters += jsonStringCodeUnits(key) + 1 + (count++ === 0 ? 0 : 1);
							yield item[key];
						}
					})());
				} else {
					valueBytes += 16;
					serializedCharacters += typeof item === "number" ? String(item).length : item === true ? 4 : item === false ? 5 : 4;
				}
			}
			return {
				valueBytes,
				serializedUtf16Bytes: serializedCharacters * 2
			};
		};
		requireAuthenticationHeadroom = (value, options) => {
			const availableBytes = options.availableBytes ?? getHeapStatistics().total_available_size;
			const { valueBytes, serializedUtf16Bytes } = estimateJsonStorage(value);
			const requiredBytes = (valueBytes + serializedUtf16Bytes) * AUTHENTICATION_COPIES;
			if (requiredBytes <= availableBytes) return ok(undefined);
			return err(new AnalysisResourceConstraintError(options.operation, "memory", options.description, {
				input_path: options.path,
				projected_value_bytes: valueBytes,
				serialized_json_utf16_bytes: serializedUtf16Bytes,
				authentication_bytes: requiredBytes,
				available_heap_bytes: availableBytes
			}));
		};
	})))();
}

//#endregion
export { init_JsonAuthenticationHeadroom, requireAuthenticationHeadroom };