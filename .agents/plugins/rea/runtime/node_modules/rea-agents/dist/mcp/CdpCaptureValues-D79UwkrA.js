import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-Cl6H9zyu.js";
import { A as init_browserObservationError, O as BrowserObservationError } from "./analysisErrorProjection-CbRgJX1L.js";
import { g as sanitizeBrowserUrl, l as init_browserObservation, n as init_webContentArtifact, t as createWebTextArtifact } from "./webContentArtifact-uGXrWU6X.js";

//#region dist/browser/CdpCaptureValues.js
var isRecord, recordValue, admitRecords, recordsValue, cdpStringValue, numberValue, resourceContentSize, scriptMetadataValues, requiredRecord, requiredScriptSource, isHttpUrl, allowedSanitizedUrl, sourceResult, sourceExcluded, delayWithCancellation;
function init_CdpCaptureValues() {
	return (init_CdpCaptureValues = __esmMin((() => {
		init_analysisErrorCore();
		init_browserObservationError();
		init_browserObservation();
		init_webContentArtifact();
		init_result();
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		recordValue = (value) => isRecord(value) ? value : undefined;
		admitRecords = (value) => Array.isArray(value) ? value : undefined;
		recordsValue = (value) => Array.isArray(value) ? value.flatMap((item) => {
			const record = recordValue(item);
			return record === undefined ? [] : [record];
		}) : [];
		cdpStringValue = (value) => typeof value === "string" ? value : undefined;
		numberValue = (value) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
		resourceContentSize = (value) => {
			if (value === undefined) return ok(null);
			const size = numberValue(value);
			return size !== undefined && size >= 0 ? ok(size) : err({ _tag: "InvalidCdpResourceSize" });
		};
		scriptMetadataValues = (value) => {
			const length = numberValue(value?.length);
			return {
				hash: cdpStringValue(value?.hash) ?? null,
				length: length !== undefined && Number.isSafeInteger(length) && length >= 0 ? length : null,
				isModule: typeof value?.isModule === "boolean" ? value.isModule : null,
				language: cdpStringValue(value?.scriptLanguage) ?? null
			};
		};
		requiredRecord = (value) => {
			const record = recordValue(value);
			if (record === undefined) throw new BrowserObservationError("inspect_web_page", "protocol_error");
			return record;
		};
		requiredScriptSource = (value, operation) => {
			const source = cdpStringValue(recordValue(value)?.scriptSource);
			if (source === undefined) throw new BrowserObservationError(operation, "protocol_error", { detail: "Debugger.getScriptSource returned malformed source text: scriptSource must be a string." });
			return source;
		};
		isHttpUrl = (value) => {
			if (value === undefined) return false;
			try {
				const protocol = new URL(value).protocol;
				return protocol === "http:" || protocol === "https:";
			} catch (cause) {
				void cause;
				return false;
			}
		};
		allowedSanitizedUrl = (value, allowedOrigins) => {
			const text = cdpStringValue(value);
			if (text === undefined) return undefined;
			const sanitized = sanitizeBrowserUrl(text);
			return sanitized.origin !== null && allowedOrigins.has(sanitized.origin) ? sanitized : undefined;
		};
		sourceResult = (source) => ({
			included: true,
			artifact: createWebTextArtifact(source, "text/javascript")
		});
		sourceExcluded = (reason) => ({
			included: false,
			reason
		});
		delayWithCancellation = async (durationMs, operation, signal) => {
			const maximumTimerDelay = 2147483647;
			let remaining = durationMs;
			while (remaining > 0) {
				if (signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: signal.reason });
				const delay = Math.min(remaining, maximumTimerDelay);
				await new Promise((resolve, reject) => {
					const timer = setTimeout(() => {
						signal?.removeEventListener("abort", onAbort);
						resolve();
					}, delay);
					const onAbort = () => {
						clearTimeout(timer);
						signal?.removeEventListener("abort", onAbort);
						reject(new AnalysisCancelledError(operation, { cause: signal?.reason }));
					};
					signal?.addEventListener("abort", onAbort, { once: true });
					if (signal?.aborted === true) onAbort();
				});
				remaining -= delay;
			}
		};
	})))();
}

//#endregion
export { init_CdpCaptureValues as a, recordValue as c, requiredScriptSource as d, resourceContentSize as f, sourceResult as h, delayWithCancellation as i, recordsValue as l, sourceExcluded as m, allowedSanitizedUrl as n, isHttpUrl as o, scriptMetadataValues as p, cdpStringValue as r, numberValue as s, admitRecords as t, requiredRecord as u };