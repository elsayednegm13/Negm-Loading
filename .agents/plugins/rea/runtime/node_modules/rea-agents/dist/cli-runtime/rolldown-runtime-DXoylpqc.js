import { createRequire } from "node:module";

//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", {
	value,
	configurable: true
});
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function() {
	if (err) throw err[0];
	try {
		return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJS = (cb, mod) => function() {
	return mod || ((0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), cb = null), mod.exports;
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) {
		__defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	}
	if (!no_symbols) {
		__defProp(target, Symbol.toStringTag, { value: "Module" });
	}
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __share_factories = /* @__PURE__ */ __create(null);
var __share_records = /* @__PURE__ */ __create(null);
var __share = (id, factory) => {
	if (!(id in __share_factories)) __share_factories[id] = factory;
};
var __share_require = (id) => {
	var record = __share_records[id];
	if (record) {
		if (record.failed) throw record.error;
		return record.exports;
	}
	var factory = __share_factories[id];
	if (!factory) throw new Error("Shared chunk \"" + id + "\" was not registered before it was required.");
	record = __share_records[id] = {
		exports: {},
		failed: false,
		error: void 0
	};
	try {
		factory(record.exports);
	} catch (error) {
		record.failed = true;
		record.error = error;
		throw error;
	}
	return record.exports;
};
var __share_export = (target, all) => {
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
};
var __toBinaryNode = (base64) => new Uint8Array(Buffer.from(base64, "base64"));
var __toBinary = /* @__PURE__ */ (() => {
	var table = new Uint8Array(128);
	for (var i = 0; i < 64; i++) {
		table[i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i * 4 - 205] = i;
	}
	return (base64) => {
		var n = base64.length, bytes = new Uint8Array((n - (base64[n - 1] == "=") - (base64[n - 2] == "=")) * 3 / 4 | 0);
		for (var i = 0, j = 0; i < n;) {
			var c0 = table[base64.charCodeAt(i++)], c1 = table[base64.charCodeAt(i++)];
			var c2 = table[base64.charCodeAt(i++)], c3 = table[base64.charCodeAt(i++)];
			bytes[j++] = c0 << 2 | c1 >> 4;
			bytes[j++] = c1 << 4 | c2 >> 2;
			bytes[j++] = c2 << 6 | c3;
		}
		return bytes;
	};
})();
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();

//#endregion
export { __esmMin, __exportAll };