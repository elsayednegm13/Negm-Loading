import { __esmMin, __exportAll } from "./rolldown-runtime-DXoylpqc.js";
import { init_evidenceValidation, init_inputIssueProjection, init_webNetworkCapture, projectInputIssues, safeParseImmutableEvidence, safeParseOwnedWebNetworkCapture } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { analysisViewResultSchema, init_EnvironmentManifestAccumulator, init_analysisView, init_exactJsonNumber, init_recordedResponseBody, init_scenarioCaptureRecords, init_webNetworkRouteTemplates, isJsonLike, mediaTypeEssence, parseExactJson, readRecordedRequestLine, readRecordedResponseBody, scenarioCaptureRecords } from "./analysisView-DxQriOKj.js";
import { AnalysisInputError, err, immutableJsonSnapshotMember, init_analysisErrorCore, init_immutableJson, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_browserScenarioCapture, retainedBrowserScenarioCaptureSchema } from "./browserScenarioCapture-d91Wory3.js";
import { z } from "zod";

//#region dist/application/environment/environmentSource.js
var environmentSource_exports = /* @__PURE__ */ __exportAll({ loadEnvironmentSource: () => loadEnvironmentSource });
var ENVIRONMENT_SERVE_OPERATION, REPLAY_BODY_LIMIT_BYTES, decodedBase64Bytes, replayedBody, inputError, parseEvidenceFile, schemaInputError, recordedExchange, parseViewEvidence, CAPTURE_PAYLOAD_PATH, parseScenarioCapture, parseHarCapture, parseCaptureEvidence, indexExchanges, loadEnvironmentSource, composeEnvironmentSource;
function init_environmentSource() {
	return (init_environmentSource = __esmMin((() => {
		init_analysisView();
		init_scenarioCaptureRecords();
		init_recordedResponseBody();
		init_EnvironmentManifestAccumulator();
		init_webNetworkRouteTemplates();
		init_browserScenarioCapture();
		init_analysisErrorCore();
		init_evidenceValidation();
		init_exactJsonNumber();
		init_inputIssueProjection();
		init_immutableJson();
		init_result();
		init_webNetworkCapture();
		ENVIRONMENT_SERVE_OPERATION = "environment-serve";
		REPLAY_BODY_LIMIT_BYTES = 256 * 1024;
		decodedBase64Bytes = (encoded) => Math.floor(encoded.length * 3 / 4) - (encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0);
		replayedBody = (exchange) => {
			const text = exchange.bodyText;
			if (text === null) return { kind: "none" };
			if (exchange.bodyEncoding === "base64") return {
				kind: "base64",
				encoded: text,
				whole: exchange.bodyCut !== true && decodedBase64Bytes(text) <= 262144
			};
			if (exchange.bodyCut === true || text.length > 262144 || Buffer.byteLength(text, "utf8") > 262144) return {
				kind: "cut",
				text
			};
			const value = exchange.contentType !== null && isJsonLike(mediaTypeEssence(exchange.contentType)) ? parseExactJson(text) : undefined;
			return value === undefined ? {
				kind: "text",
				text
			} : {
				kind: "json",
				value
			};
		};
		inputError = (operation, issues, userMessage) => new AnalysisInputError(operation, userMessage === undefined ? undefined : { userMessage }, issues);
		parseEvidenceFile = (operation, role, value) => {
			for (const key of [
				"parameters",
				"raw_result",
				"normalized_result"
			]) immutableJsonSnapshotMember(value, key);
			const parsed = safeParseImmutableEvidence(value);
			return parsed.ok ? parsed : err(schemaInputError(operation, {
				prefix: [role],
				cause: parsed.error,
				value
			}, `The ${role} file is not authenticated REA Evidence JSON.`));
		};
		schemaInputError = (operation, failure, userMessage) => new AnalysisInputError(operation, {
			userMessage,
			cause: failure.cause
		}, projectInputIssues(failure.cause.issues, failure.value).map((issue) => ({
			...issue,
			path: [...failure.prefix, ...issue.path]
		})));
		recordedExchange = (record, line) => ({
			ordinal: record.ordinal,
			path: line.path,
			query: line.query === undefined || line.query === "" ? null : line.query,
			status: line.status,
			contentType: line.rawMime === "" ? null : line.rawMime,
			...readRecordedResponseBody(record, REPLAY_BODY_LIMIT_BYTES)
		});
		parseViewEvidence = (operation, role, value, kind) => {
			const evidence = parseEvidenceFile(operation, role, value);
			if (!evidence.ok) return evidence;
			const message = `The ${role} file is not ${kind} view Evidence.`;
			if (evidence.value.operation !== "inspect_analysis_view") return err(inputError(operation, [{
				path: [role, "operation"],
				reason: "invalid_value",
				expected: "inspect_analysis_view",
				message: `The ${role} file must be inspect_analysis_view Evidence of kind ${kind}.`
			}], message));
			const normalized = immutableJsonSnapshotMember(evidence.value, "normalized_result");
			if (immutableJsonSnapshotMember(normalized, "kind") !== kind) return err(inputError(operation, [{
				path: [
					role,
					"normalized_result",
					"kind"
				],
				reason: "invalid_value",
				expected: kind,
				message: `The ${role} file must be inspect_analysis_view Evidence of kind ${kind}.`
			}], message));
			const view = analysisViewResultSchema.safeParse(normalized);
			if (!view.success) return err(schemaInputError(operation, {
				prefix: [role, "normalized_result"],
				cause: view.error,
				value: normalized
			}, message));
			return ok({
				view: view.data,
				evidenceId: evidence.value.evidence_id
			});
		};
		CAPTURE_PAYLOAD_PATH = ["evidence", "normalized_result"];
		parseScenarioCapture = (operation, normalized, parameters, purpose) => {
			const scenario = retainedBrowserScenarioCaptureSchema.safeParse(normalized);
			if (!scenario.success) return err(schemaInputError(operation, {
				prefix: CAPTURE_PAYLOAD_PATH,
				cause: scenario.error,
				value: normalized
			}, "The evidence file is not a complete browser scenario capture."));
			const definition = z.object({ scenario_sha256: z.string() }).safeParse(parameters);
			return ok({
				records: scenarioCaptureRecords(scenario.data, purpose).records,
				captureKind: "browser-scenario",
				captureSha256: definition.success ? definition.data.scenario_sha256 : null,
				responseBodies: scenario.data.scenario.network_content.response_body,
				requestBodies: scenario.data.scenario.network_content.request_body,
				scenarioEvents: scenario.data.events.items
			});
		};
		parseHarCapture = (operation, normalized) => {
			const records = immutableJsonSnapshotMember(normalized, "records");
			if (Array.isArray(records)) for (let index = 0; index < records.length; index += 1) {
				const record = immutableJsonSnapshotMember(records, String(index));
				immutableJsonSnapshotMember(record, "reported");
			}
			const capture = safeParseOwnedWebNetworkCapture(normalized);
			if (!capture.success) return err(schemaInputError(operation, {
				prefix: CAPTURE_PAYLOAD_PATH,
				cause: capture.error,
				value: normalized
			}, "The evidence file is not a complete web network capture."));
			if (capture.data.format !== "har") return err(inputError(operation, [{
				path: [...CAPTURE_PAYLOAD_PATH, "format"],
				reason: "invalid_value",
				expected: "har",
				message: `Agent environments replay HAR captures; this capture's format is ${capture.data.format}.`
			}], "The evidence file is not a HAR capture."));
			return ok({
				records: capture.data.records,
				captureKind: "web-network-capture",
				captureSha256: capture.data.artifact.sha256,
				responseBodies: true,
				requestBodies: true,
				scenarioEvents: null
			});
		};
		parseCaptureEvidence = (operation, value, purpose = "replay") => {
			const evidence = parseEvidenceFile(operation, "evidence", value);
			if (!evidence.ok) return evidence;
			const normalized = immutableJsonSnapshotMember(evidence.value, "normalized_result");
			const capture = evidence.value.operation === "capture_browser_scenario" ? parseScenarioCapture(operation, normalized, evidence.value.parameters, purpose) : evidence.value.operation === "inspect_web_network_capture" ? parseHarCapture(operation, normalized) : err(inputError(operation, [{
				path: ["evidence", "operation"],
				reason: "invalid_value",
				expected: "inspect_web_network_capture or capture_browser_scenario",
				message: "The evidence file must be inspect_web_network_capture or capture_browser_scenario Evidence."
			}], "The evidence file is not web network capture or browser scenario Evidence."));
			return capture.ok ? ok({
				...capture.value,
				evidenceId: evidence.value.evidence_id
			}) : capture;
		};
		indexExchanges = (manifest, records) => {
			const byOrdinal = new Map(records.map((record) => [record.ordinal, record]));
			const exchanges = new Map();
			for (const tool of manifest.tools) for (const ordinal of tool.record_ordinals) {
				if (exchanges.has(ordinal)) continue;
				const record = byOrdinal.get(ordinal);
				if (record === undefined) continue;
				const line = readRecordedRequestLine(record.reported, true, () => true);
				if (line?.kind === "line") exchanges.set(ordinal, recordedExchange(record, line));
			}
			return exchanges;
		};
		loadEnvironmentSource = (manifestValue, evidenceValue, operation = ENVIRONMENT_SERVE_OPERATION) => {
			const manifest = parseViewEvidence(operation, "manifest", manifestValue, "environment-manifest");
			if (!manifest.ok) return manifest;
			const capture = parseCaptureEvidence(operation, evidenceValue);
			if (!capture.ok) return capture;
			return composeEnvironmentSource(manifest.value, capture.value, operation);
		};
		composeEnvironmentSource = (manifest, capture, operation = ENVIRONMENT_SERVE_OPERATION) => {
			const parentId = manifest.view.parent_evidence_id;
			if (parentId !== capture.evidenceId) return err(inputError(operation, [{
				path: ["evidence", "evidence_id"],
				reason: "invalid_value",
				expected: parentId,
				message: `The manifest cites parent Evidence ${parentId}; the evidence file is ${capture.evidenceId}.`
			}], "The manifest was projected from a different capture than the supplied evidence file."));
			return ok({
				manifest: manifest.view,
				manifestEvidenceId: manifest.evidenceId,
				evidenceId: capture.evidenceId,
				captureKind: capture.captureKind,
				captureSha256: capture.captureSha256,
				exchanges: indexExchanges(manifest.view, capture.records)
			});
		};
	})))();
}

//#endregion
export { ENVIRONMENT_SERVE_OPERATION, REPLAY_BODY_LIMIT_BYTES, composeEnvironmentSource, environmentSource_exports, init_environmentSource, inputError, parseCaptureEvidence, parseEvidenceFile, parseViewEvidence, recordedExchange, replayedBody };