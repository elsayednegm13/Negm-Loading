import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_recordedTransportUrl, iterateUrlQueryParameters, parseRecordedTransportUrl } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { TEMPLATE_RULES, decodeRetainedBase64, init_EnvironmentManifestAccumulator, init_environmentCoverageView, init_environmentManifestRules, init_recordedResponseBody, init_scenarioCaptureRecords, init_webNetworkRouteTemplates, isJsonLike, mediaTypeEssence, readRecordedResponseBody, scenarioContentMediaType, summarizeEnvironmentCoverage } from "./analysisView-DxQriOKj.js";
import { AnalysisCancelledError, AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_AnalysisViewService, inspectAnalysisView } from "./AnalysisViewService-Bw-pzZ6V.js";
import { composeEnvironmentSource, init_environmentSource, parseCaptureEvidence, parseEvidenceFile, parseViewEvidence } from "./environmentSource-BU4MlUgQ.js";
import { init_environmentState, prepareServedState } from "./environmentState-UIc1qofA.js";
import { ENVIRONMENT_EXPORT_OPERATION, environmentExportEvidenceFile, exportEnvironmentBundle, init_environmentBundle, init_environmentExport, isPortableBundleName, packageTarballBytes, planEnvironmentBundle, registryPackageSource } from "./environmentExport-DziGmZfr.js";
import { basename } from "node:path";
import { setImmediate } from "node:timers/promises";
import { isIP } from "node:net";

//#region dist/application/environment/environmentBuildReport.js
var CREDENTIAL_SEGMENTS, CREDENTIAL_PAIRS, nameSegments, credentialNamed, SCAN_BODY_LIMIT_BYTES, REPORTED_POINTERS, pointerToken, holdsValue, member, FORM_MEDIA_TYPE, bodyFormat, parsedBody, decodedBody, namedValues, tallied, credentialTally, scanCredentialNames, scanScenarioCredentialNames, credentialScanWarnings, anonymousOrigin, nameFromCaptureFile;
function init_environmentBuildReport() {
	return (init_environmentBuildReport = __esmMin((() => {
		init_EnvironmentManifestAccumulator();
		init_recordedResponseBody();
		init_scenarioCaptureRecords();
		init_webNetworkRouteTemplates();
		init_recordedTransportUrl();
		CREDENTIAL_SEGMENTS = new Set([
			"accesstoken",
			"apikey",
			"apikeys",
			"apitoken",
			"auth",
			"authorization",
			"bearer",
			"cookie",
			"credential",
			"credentials",
			"jwt",
			"passphrase",
			"passwd",
			"password",
			"privatekey",
			"pwd",
			"secret",
			"secrets",
			"session",
			"sessionid",
			"token",
			"tokens"
		]);
		CREDENTIAL_PAIRS = new Set([
			"access key",
			"api key",
			"api keys",
			"client secret",
			"private key",
			"session id",
			"ssh key"
		]);
		nameSegments = (name) => name.replaceAll(/([a-z0-9])([A-Z])/gu, "$1 $2").replaceAll(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2").toLowerCase().split(/[^a-z0-9]+/u).filter((segment) => segment.length > 0);
		credentialNamed = (name) => {
			const segments = nameSegments(name);
			return segments.some((segment, index) => CREDENTIAL_SEGMENTS.has(segment) || index > 0 && CREDENTIAL_PAIRS.has(`${segments[index - 1]} ${segment}`));
		};
		SCAN_BODY_LIMIT_BYTES = 4 * 1024 * 1024;
		REPORTED_POINTERS = 20;
		pointerToken = (name) => name.replaceAll("~", "~0").replaceAll("/", "~1");
		holdsValue = (value) => typeof value === "string" && value !== "" || Array.isArray(value) && value.some((item) => typeof item === "string" && item !== "");
		member = (value, name) => typeof value === "object" && value !== null ? Reflect.get(value, name) : undefined;
		FORM_MEDIA_TYPE = "application/x-www-form-urlencoded";
		bodyFormat = (text, mediaType) => {
			const essence = typeof mediaType === "string" ? mediaTypeEssence(mediaType) : null;
			if (essence === FORM_MEDIA_TYPE) return "form";
			if (isJsonLike(essence)) return "json";
			const start = text.trimStart()[0];
			if (start === "{" || start === "[") return "json";
			return text.includes("=") && !/\s/u.test(text) ? "form" : undefined;
		};
		parsedBody = (text, mediaType, cut = false) => {
			if (typeof text !== "string") return undefined;
			if (cut || Buffer.byteLength(text, "utf8") > SCAN_BODY_LIMIT_BYTES) return { kind: "skipped" };
			const format = bodyFormat(text, mediaType);
			if (format === "form") return {
				kind: "form",
				fields: [...new URLSearchParams(text)]
			};
			if (format === undefined) return undefined;
			try {
				return {
					kind: "json",
					value: JSON.parse(text)
				};
			} catch {
				return undefined;
			}
		};
		decodedBody = (body, mediaType) => body.bodyEncoding === "base64" ? undefined : parsedBody(body.bodyText, mediaType, body.bodyCut === true);
		namedValues = (value) => Array.isArray(value) ? value.flatMap((entry) => {
			const name = member(entry, "name");
			return typeof name === "string" ? [[name, member(entry, "value")]] : [];
		}) : [];
		tallied = (tally, pointer) => {
			tally.count++;
			if (tally.pointers.length < REPORTED_POINTERS) tally.pointers.push(pointer);
		};
		credentialTally = () => {
			const matches = {
				count: 0,
				pointers: []
			};
			const skipped = {
				count: 0,
				pointers: []
			};
			const field = (pointer, name, value) => {
				if (credentialNamed(name) && holdsValue(value)) tallied(matches, pointer);
			};
			const walk = (root, label) => {
				const stack = [[root, ""]];
				while (stack.length > 0) {
					const [value, pointer] = stack.pop();
					if (typeof value !== "object" || value === null) continue;
					if (Array.isArray(value)) {
						for (let index = value.length - 1; index >= 0; index--) stack.push([value[index], `${pointer}/${String(index)}`]);
						continue;
					}
					const entries = Object.entries(value);
					for (let index = entries.length - 1; index >= 0; index--) {
						const [name, child] = entries[index];
						const path = `${pointer}/${pointerToken(name)}`;
						field(`${label} ${path}`, name, child);
						stack.push([child, path]);
					}
				}
			};
			const body = (scanned, label) => {
				if (scanned?.kind === "skipped") tallied(skipped, label);
				else if (scanned?.kind === "json") walk(scanned.value, label);
				else if (scanned?.kind === "form") for (const [name, value] of scanned.fields) field(`${label} /${pointerToken(name)}`, name, value);
			};
			return {
				field,
				body,
				result: () => ({
					...matches,
					skipped
				})
			};
		};
		scanCredentialNames = (records) => {
			const scan = credentialTally();
			for (const record of records) {
				const ordinal = String(record.ordinal);
				const request = member(record.reported, "request");
				const response = member(record.reported, "response");
				for (const [side, message] of [["request", request], ["response", response]]) for (const [name, value] of namedValues(member(message, "headers"))) scan.field(`record ${ordinal} ${side} header ${name}`, name, value);
				for (const [name, value] of namedValues(member(request, "queryString"))) scan.field(`record ${ordinal} request query ${name}`, name, value);
				const postData = member(request, "postData");
				const text = member(postData, "text");
				scan.body(typeof text !== "string" ? {
					kind: "form",
					fields: namedValues(member(postData, "params")).flatMap(([name, value]) => typeof value === "string" ? [[name, value]] : [])
				} : parsedBody(text, member(postData, "mimeType")), `record ${ordinal} request`);
				scan.body(decodedBody(readRecordedResponseBody(record, SCAN_BODY_LIMIT_BYTES), member(member(response, "content"), "mimeType")), `record ${ordinal} response`);
			}
			return scan.result();
		};
		scanScenarioCredentialNames = (events) => {
			const scan = credentialTally();
			const urls = new Set();
			for (const [index, event] of events.entries()) {
				const label = `event ${String(index)}`;
				if (event.kind === "network-content") {
					const side = `${label} ${event.phase}`;
					if (event.headers.state === "captured") for (const { name, value } of event.headers.items) scan.field(`${side} header ${name}`, name, value);
					if (event.body.state === "captured") scan.body(decodedBody(decodeRetainedBase64(event.body.content, SCAN_BODY_LIMIT_BYTES), scenarioContentMediaType(event)), side);
				} else if ("transaction_id" in event) {
					const key = `${event.transaction_id} ${event.url.url}`;
					if (urls.has(key)) continue;
					urls.add(key);
					const { query } = parseRecordedTransportUrl(event.url.url, { includeQuery: true });
					for (const [name, value] of iterateUrlQueryParameters(query ?? "")) scan.field(`${label} ${event.kind} query ${name}`, name, value);
				}
			}
			return scan.result();
		};
		credentialScanWarnings = (capture) => {
			const scanned = capture.scenarioEvents === null ? scanCredentialNames(capture.records) : scanScenarioCredentialNames(capture.scenarioEvents);
			const warnings = [];
			if (scanned.count > 0) warnings.push({
				code: "credential-named-members",
				message: `${String(scanned.count)} recorded body members have credential-like names and a value; evidence.json ships them, so review it before sharing.`,
				pointers: scanned.pointers
			});
			if (scanned.skipped.count > 0) warnings.push({
				code: "credential-scan-incomplete",
				message: `${String(scanned.skipped.count)} recorded bodies exceed the credential-name scan's 4 MiB limit and were not scanned; evidence.json ships them, so review them before sharing.`,
				pointers: scanned.skipped.pointers
			});
			return warnings;
		};
		anonymousOrigin = (origin) => {
			let host;
			try {
				host = new URL(origin).hostname.toLowerCase();
			} catch {
				return false;
			}
			const bracketless = host.startsWith("[") ? host.slice(1, -1) : host;
			const bare = bracketless.endsWith(".") ? bracketless.slice(0, -1) : bracketless;
			return bare === "localhost" || bare.endsWith(".localhost") || isIP(bare) !== 0;
		};
		nameFromCaptureFile = (path) => basename(path).replace(/\.(?:har|json)$/iu, "").replace(/\.capture$/iu, "").toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-").replace(/^-+/u, "").replace(/-+$/u, "");
	})))();
}

//#endregion
//#region dist/application/environment/environmentBuild.js
var ENVIRONMENT_BUILD_OPERATION, DEFAULT_BUILD_TEMPLATE_RULES, classifyBuildCapture, canonicalTemplateRules, captureOperations, harDocument, harAsJson, repeatedRules, cancelled, notCaptureEvidence, unnamed, missingDirectory, environmentName, shellWord, packageSourceValue, buildEnvironment;
function init_environmentBuild() {
	return (init_environmentBuild = __esmMin((() => {
		init_analysisErrorCore();
		init_environmentCoverageView();
		init_environmentManifestRules();
		init_result();
		init_AnalysisViewService();
		init_environmentBundle();
		init_environmentBuildReport();
		init_environmentExport();
		init_environmentSource();
		init_environmentState();
		ENVIRONMENT_BUILD_OPERATION = "environment-build";
		DEFAULT_BUILD_TEMPLATE_RULES = [
			"after-uid-literal",
			"opaque-token",
			"sibling-variance",
			"prefix-variance"
		];
		classifyBuildCapture = (path) => {
			if (/\.har$/iu.test(path)) return ok("har");
			if (/\.json$/iu.test(path)) return ok("evidence");
			return err(new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, { userMessage: `${path} is neither a .har capture nor a .json capture Evidence file.` }, [{
				path: ["capture"],
				reason: "invalid_value",
				expected: ".har or .json",
				message: "Pass a HAR file, or capture Evidence JSON from inspect-web-network-capture (HAR) or capture-browser-scenario."
			}]));
		};
		canonicalTemplateRules = (rules) => TEMPLATE_RULES.filter((rule) => rules.includes(rule));
		captureOperations = new Set(["inspect_web_network_capture", "capture_browser_scenario"]);
		harDocument = (value) => {
			if (typeof value !== "object" || value === null) return false;
			const log = Reflect.get(value, "log");
			return typeof log === "object" && log !== null && Array.isArray(Reflect.get(log, "entries"));
		};
		harAsJson = (path) => new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, { userMessage: `${path} is a HAR document, not capture Evidence; save it as a .har file to build from it, or inspect it as a HAR first (inspect_web_network_capture) and build from that Evidence.` }, [{
			path: ["capture"],
			reason: "invalid_value",
			expected: "capture Evidence JSON, or a .har file",
			message: "A .json capture must be capture Evidence; a HAR document is inspected only from a .har file."
		}]);
		repeatedRules = () => new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, undefined, [{
			path: ["template_rules"],
			reason: "invalid_value",
			message: "template_rules must not repeat a rule"
		}]);
		cancelled = async (signal, written) => {
			if (signal !== undefined) await setImmediate();
			return signal?.aborted === true ? new AnalysisCancelledError(ENVIRONMENT_BUILD_OPERATION, {
				cause: signal.reason,
				...written === undefined ? {} : {
					userMessage: `The build was cancelled after it wrote the bundle at ${written}.`,
					diagnostics: {
						output_directory: written,
						bundle_written: true
					}
				}
			}) : undefined;
		};
		notCaptureEvidence = (operation) => new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, { userMessage: `The capture file is ${operation} Evidence, not capture Evidence.` }, [{
			path: ["capture", "operation"],
			reason: "invalid_value",
			expected: "inspect_web_network_capture or capture_browser_scenario",
			message: "Pass a HAR file, or capture Evidence JSON from inspect-web-network-capture (HAR) or capture-browser-scenario."
		}]);
		unnamed = (path) => new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, { userMessage: `The capture's origin is a loopback or IP address, and ${path === "" ? "retained Evidence has no file name to take one from" : `${path} yields no portable environment name (a kebab-case label of at most 64 characters that is not a Windows device name)`}; name the environment.` }, [{
			path: ["name"],
			reason: "invalid_value",
			message: "Name the environment: a kebab-case label of lowercase letters, digits and single hyphens."
		}]);
		missingDirectory = () => new AnalysisInputError(ENVIRONMENT_BUILD_OPERATION, { userMessage: "Name the bundle directory, or plan a dry run." }, [{
			path: ["directory"],
			reason: "invalid_value",
			message: "The bundle directory may be omitted only with --dry-run."
		}]);
		environmentName = (input, manifest, warnings) => {
			if (input.name !== undefined) return ok(input.name);
			if (!anonymousOrigin(manifest.origin)) return ok(undefined);
			const name = nameFromCaptureFile(input.capturePath);
			if (!isPortableBundleName(name)) return err(unnamed(input.capturePath));
			warnings.push({
				code: "name-from-file",
				pointers: [],
				message: `The capture's origin ${manifest.origin} names no application, so the environment is named ${name} after the capture file; name it explicitly to choose another.`
			});
			return ok(name);
		};
		shellWord = (path) => /^[\w./@%+=:,-]+$/u.test(path) ? path : `'${path.replaceAll("'", "'\\''")}'`;
		packageSourceValue = (source) => source.kind === "registry" ? {
			kind: "registry",
			specifier: source.specifier
		} : {
			kind: "tarball",
			path: source.path
		};
		buildEnvironment = async (input) => {
			if (input.directory === undefined && !input.dryRun) return err(missingDirectory());
			if (new Set(input.templateRules).size !== input.templateRules.length) return err(repeatedRules());
			if (input.captureInput === "evidence" && harDocument(input.capture.value)) return err(harAsJson(input.capturePath));
			const evidence = parseEvidenceFile(ENVIRONMENT_BUILD_OPERATION, "evidence", input.capture.value);
			if (!evidence.ok) return evidence;
			if (!captureOperations.has(evidence.value.operation)) return err(notCaptureEvidence(evidence.value.operation));
			const capture = evidence.value;
			const templateRules = canonicalTemplateRules(input.templateRules);
			input.progress?.("manifest");
			const projected = await inspectAnalysisView({
				source: {
					kind: "retained-evidence",
					evidence_id: capture.evidence_id
				},
				view: {
					kind: "environment-manifest",
					template_rules: templateRules
				}
			}, (id) => id === capture.evidence_id ? capture : undefined);
			if (!projected.ok) return projected;
			const stopped = await cancelled(input.signal);
			if (stopped !== undefined) return err(stopped);
			const manifest = await environmentExportEvidenceFile("manifest", "manifest.json", projected.value, ENVIRONMENT_BUILD_OPERATION);
			if (!manifest.ok) return manifest;
			const parsedManifest = parseViewEvidence(ENVIRONMENT_BUILD_OPERATION, "manifest", manifest.value.value, "environment-manifest");
			if (!parsedManifest.ok) return parsedManifest;
			const recorded = parseCaptureEvidence(ENVIRONMENT_BUILD_OPERATION, input.capture.value);
			if (!recorded.ok) return recorded;
			const source = composeEnvironmentSource(parsedManifest.value, recorded.value, ENVIRONMENT_BUILD_OPERATION);
			if (!source.ok) return source;
			const warnings = [];
			const named = environmentName(input, source.value.manifest, warnings);
			if (!named.ok) return named;
			const name = named.value ?? source.value.manifest.name;
			const beforeState = await cancelled(input.signal);
			if (beforeState !== undefined) return err(beforeState);
			input.progress?.("state");
			const served = prepareServedState(source.value, input.capture.value, {
				name,
				operation: ENVIRONMENT_EXPORT_OPERATION
			});
			warnings.push(...credentialScanWarnings(recorded.value));
			const packageSource = input.packageTarball === undefined ? registryPackageSource() : {
				kind: "tarball",
				path: input.packageTarball
			};
			const base = {
				name,
				capture: {
					evidence_id: capture.evidence_id,
					operation: capture.operation,
					records: recorded.value.records.length,
					input: input.captureInput
				},
				manifest: {
					evidence_id: source.value.manifestEvidenceId,
					tools: source.value.manifest.tools.length,
					excluded_groups: source.value.manifest.excluded.length,
					template_rules: templateRules
				},
				state: served.report,
				coverage: served.state === undefined ? null : summarizeEnvironmentCoverage({
					views: served.state.views.values(),
					writes: served.state.writes.values()
				}),
				warnings
			};
			if (input.dryRun) {
				const beforePlan = await cancelled(input.signal);
				if (beforePlan !== undefined) return err(beforePlan);
				const plan = planEnvironmentBundle(source.value, {
					name,
					packageSource,
					served: () => served
				});
				if (!plan.ok) return plan;
				const files = [
					...plan.value.files.map((file) => ({
						path: file.path,
						bytes: Buffer.byteLength(file.content)
					})),
					{
						path: plan.value.copies.manifest,
						bytes: manifest.value.bytes.length
					},
					{
						path: plan.value.copies.evidence,
						bytes: input.capture.bytes.length
					}
				];
				if (plan.value.copies.tarball !== null && input.packageTarball !== undefined) {
					const bytes = await packageTarballBytes(input.packageTarball);
					if (!bytes.ok) return bytes;
					files.push({
						path: plan.value.copies.tarball,
						bytes: bytes.value
					});
				}
				const afterPlan = await cancelled(input.signal);
				if (afterPlan !== undefined) return err(afterPlan);
				return ok({
					status: "planned",
					directory: input.directory ?? null,
					...base,
					tool_count: plan.value.toolCount,
					package_source: packageSourceValue(packageSource),
					files,
					next: []
				});
			}
			const directory = input.directory;
			if (directory === undefined) return err(missingDirectory());
			const beforeWrite = await cancelled(input.signal);
			if (beforeWrite !== undefined) return err(beforeWrite);
			input.progress?.("bundle");
			const exported = await exportEnvironmentBundle({
				manifest: manifest.value,
				evidence: input.capture,
				source: source.value,
				served,
				directory,
				name,
				packageTarball: input.packageTarball,
				exclusiveDestination: input.exclusiveDestination
			});
			if (!exported.ok) return exported;
			const report = {
				status: "built",
				directory,
				...base,
				tool_count: exported.value.tool_count,
				package_source: packageSourceValue(packageSource),
				files: [...exported.value.files],
				next: [`agent-env run ${shellWord(directory)}`]
			};
			const afterWrite = await cancelled(input.signal, directory);
			return afterWrite === undefined ? ok(report) : err(afterWrite);
		};
	})))();
}

//#endregion
init_environmentBuild();
export { DEFAULT_BUILD_TEMPLATE_RULES, ENVIRONMENT_BUILD_OPERATION, buildEnvironment, classifyBuildCapture };