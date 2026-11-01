import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { WEB_RUNTIME_LIMITS, classifyBrowserCompleteness, compareUnicodeCodePoints, createWebTextArtifact, init_browserCompleteness, init_browserDeadline, init_browserObservation, init_unicodeCodePointOrder, init_webContentArtifact, init_webRuntime, noRuntimeOverrideSentence, sanitizeBrowserUrl, selectedCdpCommandTimeoutMs } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisError, err, init_analysisErrorBase, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { BrowserObservationError, ProviderAdapterError, init_browserObservationError, init_providerAdapterError } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-PV1DaSaC.js";
import { ArtifactFileCleanupFailure, assertArtifactReadActive, bindArtifactFileCleanup, init_ArtifactFileOperation, withArtifactFileHandle } from "./ArtifactFileOperation-o-ukSUGG.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { ProviderStartupDeadline, init_ProviderDeadline } from "./ProviderDeadline-8m2pFRDc.js";
import { DEFAULT_ASAR_HEADER_ADMISSION, init_asarHeaderAdmission } from "./asarHeaderAdmission-8S9fzpWj.js";
import { admitAsarHeader, asarHeaderAdmissionFailure, init_AsarHeader } from "./AsarHeader-C-8M8Vix.js";
import { CdpCommandRejection, init_CdpCommandRejection, init_CdpConnection } from "./CdpTargetSession-D571Zddg.js";
import { isAbsolute, join, sep } from "node:path";
import { open, realpath, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

//#region dist/browser/CdpCaptureCompleteness.js
var EVENT_SECTIONS, POLICY_REASONS, CdpCaptureCompleteness, emptyDropped;
function init_CdpCaptureCompleteness() {
	return (init_CdpCaptureCompleteness = __esmMin((() => {
		init_browserCompleteness();
		EVENT_SECTIONS = {
			scripts: "scripts",
			network_requests: "network_requests",
			console_events: "console_events",
			websocket_connections: "websocket_connections",
			websocket_frames: "websocket_frames",
			webmcp_tools: "webmcp_tools",
			timeline_events: "timeline"
		};
		POLICY_REASONS = new Set([
			"disallowed_origin",
			"unsupported_url",
			"unattributed_origin",
			"not_approved",
			"out_of_target_scope"
		]);
		CdpCaptureCompleteness = class {
			#initialAttachLimited;
			#policyFiltered = new Set();
			#attachLimited = new Set();
			#truncated = new Set();
			#unavailable = new Set();
			#excluded = new Map();
			#dropped = emptyDropped();
			constructor(initialAttachLimited = []) {
				this.#initialAttachLimited = [...initialAttachLimited];
				this.reset();
			}
			reset() {
				this.#policyFiltered.clear();
				this.#attachLimited.clear();
				this.#truncated.clear();
				this.#unavailable.clear();
				this.#excluded.clear();
				Object.assign(this.#dropped, emptyDropped());
				for (const section of this.#initialAttachLimited) this.#attachLimited.add(section);
			}
			exclude(section, reason, count = 1) {
				if (POLICY_REASONS.has(reason)) this.#policyFiltered.add(section);
				if (reason === "provider_unavailable" || reason === "unattributed_target" || reason === "invalid_protocol_value" || reason === "unknown_target_relationship") this.#unavailable.add(section);
				if (reason === "resource_budget_exhausted") this.#truncated.add(section);
				const key = `${section}\0${reason}`;
				const existing = this.#excluded.get(key);
				const combined = count === null || existing?.count === null ? null : (existing?.count ?? 0) + count;
				this.#excluded.set(key, {
					section,
					reason,
					count: combined
				});
			}
			attachLimited(section) {
				this.#attachLimited.add(section);
			}
			unavailable(section) {
				this.#unavailable.add(section);
				this.exclude(section, "provider_unavailable", null);
			}
			truncate(section) {
				this.#truncated.add(section);
			}
			drop(kind, count = 1) {
				this.#dropped[kind] += count;
				this.#truncated.add(EVENT_SECTIONS[kind]);
			}
			get droppedTotal() {
				return Object.values(this.#dropped).reduce((sum, count) => sum + count, 0);
			}
			snapshot() {
				return classifyBrowserCompleteness({
					policyFilteredSections: this.#policyFiltered,
					attachLimitedSections: this.#attachLimited,
					truncatedSections: this.#truncated,
					unavailableSections: this.#unavailable,
					excluded: [...this.#excluded.values()],
					droppedEvents: this.#dropped
				});
			}
		};
		emptyDropped = () => ({
			scripts: 0,
			network_requests: 0,
			console_events: 0,
			websocket_connections: 0,
			websocket_frames: 0,
			webmcp_tools: 0,
			timeline_events: 0
		});
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureValues.js
var isRecord$1, recordValue, admitRecords, recordsValue, cdpStringValue, numberValue, resourceContentSize, scriptMetadataValues, requiredRecord, requiredScriptSource, isHttpUrl, allowedSanitizedUrl, sourceResult, sourceExcluded, delayWithCancellation;
function init_CdpCaptureValues() {
	return (init_CdpCaptureValues = __esmMin((() => {
		init_analysisErrorCore();
		init_browserObservationError();
		init_browserObservation();
		init_webContentArtifact();
		init_result();
		isRecord$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		recordValue = (value) => isRecord$1(value) ? value : undefined;
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
//#region dist/browser/CdpCaptureEventHelpers.js
var nonEmptyString, identityIssueFor, parentFacts, cdpFrameRecordIdentity, cdpFrameIdentity, malformedCallFrame, topCallFrame, initiatorLocation, exclusionReasonForUrl, integerOrNull, executionContextKey, isJsonContentType, isJsonMediaType, consolePrimitive;
function init_CdpCaptureEventHelpers() {
	return (init_CdpCaptureEventHelpers = __esmMin((() => {
		init_result();
		init_CdpCaptureValues();
		nonEmptyString = (value) => typeof value === "string" && value.length > 0 ? value : undefined;
		identityIssueFor = (navigated, frame, rawId) => {
			if (navigated && frame === undefined) return "missing_frame";
			if (rawId === undefined) return "missing_id";
			return nonEmptyString(rawId) === undefined ? "invalid_id" : null;
		};
		parentFacts = (navigated, frame) => {
			if (!navigated) return {
				parentRelation: "not_applicable",
				parentId: null,
				parentIssue: null
			};
			if (frame === undefined) return {
				parentRelation: "unknown",
				parentId: null,
				parentIssue: null
			};
			if (!("parentId" in frame)) return {
				parentRelation: "root",
				parentId: null,
				parentIssue: null
			};
			const parentId = nonEmptyString(frame.parentId);
			return parentId === undefined || parentId === nonEmptyString(frame.id) ? {
				parentRelation: "unknown",
				parentId: null,
				parentIssue: parentId === undefined ? "invalid_parent_id" : "self_parent"
			} : {
				parentRelation: "child",
				parentId,
				parentIssue: null
			};
		};
		cdpFrameRecordIdentity = (frame) => ({
			frameId: nonEmptyString(frame?.id) ?? null,
			identityIssue: identityIssueFor(true, frame, frame?.id),
			...parentFacts(true, frame)
		});
		cdpFrameIdentity = (event, mainFrameId) => {
			const navigated = event.method === "Page.frameNavigated";
			const requested = event.method === "Page.frameRequestedNavigation";
			const sameDocument = event.method === "Page.navigatedWithinDocument";
			if (!navigated && !requested && !sameDocument) return {
				applicability: "not_applicable",
				selection: "unknown",
				isRootReplacement: false,
				frameId: null,
				identityIssue: null,
				parentRelation: "not_applicable",
				parentId: null,
				parentIssue: null
			};
			const params = recordValue(event.params);
			if (params === undefined) return {
				applicability: "applicable",
				selection: "unknown",
				isRootReplacement: false,
				frameId: null,
				identityIssue: event.params === undefined ? "missing_params" : "invalid_params",
				parentRelation: "not_applicable",
				parentId: null,
				parentIssue: null
			};
			const identity = navigated ? cdpFrameRecordIdentity(recordValue(params.frame)) : {
				frameId: nonEmptyString(params.frameId) ?? null,
				identityIssue: identityIssueFor(false, undefined, params.frameId),
				...parentFacts(false, undefined)
			};
			const selection = identity.frameId === null ? "unknown" : identity.frameId === mainFrameId ? "main" : "other";
			return {
				applicability: "applicable",
				selection,
				isRootReplacement: selection === "other" && identity.parentRelation === "root",
				...identity,
				parentIssue: selection === "main" && (identity.parentRelation === "child" || identity.parentIssue === "self_parent") ? "main_frame_has_parent" : identity.parentIssue
			};
		};
		malformedCallFrame = { _tag: "MalformedCdpCallFrame" };
		topCallFrame = (value) => {
			if (value === undefined) return ok(undefined);
			const stack = recordValue(value);
			if (stack === undefined) return err(malformedCallFrame);
			const frames = admitRecords(stack.callFrames);
			if (frames === undefined) return err(malformedCallFrame);
			if (frames.length === 0) return ok(undefined);
			const frame = recordValue(frames[0]);
			return frame === undefined ? err(malformedCallFrame) : ok(frame);
		};
		initiatorLocation = (initiator) => {
			let stack = initiator?.stack;
			for (let depth = 0; depth < 32 && stack !== undefined; depth += 1) {
				const frame = topCallFrame(stack);
				if (!frame.ok || frame.value !== undefined) return frame;
				stack = recordValue(stack)?.parent;
			}
			return ok(cdpStringValue(initiator?.url) === undefined ? undefined : initiator);
		};
		exclusionReasonForUrl = (value) => value === undefined || value === "" ? "unattributed_origin" : isHttpUrl(value) ? "disallowed_origin" : "unsupported_url";
		integerOrNull = (value) => {
			const number = numberValue(value);
			return number === undefined ? null : Math.max(0, Math.trunc(number));
		};
		executionContextKey = (value) => {
			const identifier = numberValue(value);
			return identifier !== undefined && Number.isSafeInteger(identifier) ? String(identifier) : null;
		};
		isJsonContentType = (headers) => {
			if (headers === undefined) return false;
			for (const [name, value] of Object.entries(headers)) if (name.toLowerCase() === "content-type" && isJsonMediaType(cdpStringValue(value))) return true;
			return false;
		};
		isJsonMediaType = (value) => {
			const mediaType = value?.split(";", 1)[0]?.trim().toLowerCase();
			return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
		};
		consolePrimitive = (value) => {
			const type = cdpStringValue(value.type);
			switch (type) {
				case "string": return typeof value.value === "string" ? {
					type,
					text: value.value
				} : undefined;
				case "boolean": return typeof value.value === "boolean" ? {
					type,
					text: String(value.value)
				} : undefined;
				case "number": return typeof value.value === "number" ? {
					type,
					text: String(value.value)
				} : typeof value.unserializableValue === "string" ? {
					type,
					text: value.unserializableValue
				} : undefined;
				case "bigint": return typeof value.unserializableValue === "string" ? {
					type,
					text: value.unserializableValue
				} : undefined;
				case "undefined": return {
					type,
					text: "undefined"
				};
				case "object": return cdpStringValue(value.subtype) === "null" ? {
					type,
					text: "null"
				} : undefined;
				default: return undefined;
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureEventTypes.js
var CDP_CAPTURE_SCRIPT_METADATA_LIMITS;
function init_CdpCaptureEventTypes() {
	return (init_CdpCaptureEventTypes = __esmMin((() => {
		CDP_CAPTURE_SCRIPT_METADATA_LIMITS = {
			retainedBytes: 8 * 1024 * 1024,
			scripts: 5e4
		};
	})))();
}

//#endregion
//#region dist/browser/CdpSnapshotStrings.js
var CDP_EMPTY_STRING_INDEX, cdpSnapshotString, cdpSnapshotValueString;
function init_CdpSnapshotStrings() {
	return (init_CdpSnapshotStrings = __esmMin((() => {
		init_CdpCaptureValues();
		CDP_EMPTY_STRING_INDEX = -1;
		cdpSnapshotString = (strings, index) => {
			const integer = numberValue(index);
			if (integer === undefined || !Number.isSafeInteger(integer) || integer < 0) return undefined;
			return strings[integer];
		};
		cdpSnapshotValueString = (strings, index) => numberValue(index) === CDP_EMPTY_STRING_INDEX ? "" : cdpSnapshotString(strings, index);
	})))();
}

//#endregion
//#region dist/browser/CdpSnapshotNodes.js
var integer, attributes, invalidateParentCycles, snapshotDocumentNodes, snapshotNodeAt;
function init_CdpSnapshotNodes() {
	return (init_CdpSnapshotNodes = __esmMin((() => {
		init_result();
		init_CdpCaptureValues();
		init_CdpSnapshotStrings();
		integer = (value) => {
			const parsed = numberValue(value);
			return parsed !== undefined && Number.isSafeInteger(parsed) ? parsed : undefined;
		};
		attributes = (value, strings) => {
			if (!Array.isArray(value) || value.length % 2 !== 0) return undefined;
			const pairs = [];
			for (let offset = 0; offset < value.length; offset += 2) {
				const name = cdpSnapshotString(strings, value[offset]);
				const text = cdpSnapshotValueString(strings, value[offset + 1]);
				if (name === undefined || text === undefined) return undefined;
				pairs.push([name, text]);
			}
			return pairs;
		};
		invalidateParentCycles = (parents) => {
			const state = new Uint8Array(parents.length);
			const path = [];
			for (let start = 0; start < parents.length; start += 1) {
				if (state[start] !== 0) continue;
				path.length = 0;
				let cursor = start;
				while (cursor >= 0 && state[cursor] === 0) {
					state[cursor] = 1;
					path.push(cursor);
					cursor = parents[cursor] ?? -1;
				}
				if (cursor >= 0 && state[cursor] === 1) for (let index = path.indexOf(cursor); index < path.length; index += 1) parents[path[index]] = undefined;
				for (const index of path) state[index] = 2;
			}
		};
		snapshotDocumentNodes = (value, strings) => {
			const raw = recordValue(value);
			if (raw === undefined || !Array.isArray(raw.nodeType) || !Array.isArray(raw.nodeName) || !Array.isArray(raw.nodeValue) || !Array.isArray(raw.parentIndex) || !Array.isArray(raw.attributes)) return undefined;
			const count = raw.nodeType.length;
			if (raw.nodeName.length !== count || raw.nodeValue.length !== count || raw.parentIndex.length !== count) return undefined;
			const parents = raw.parentIndex.map((value, index) => {
				const parent = integer(value);
				return parent !== undefined && parent >= -1 && parent < count && parent !== index ? parent : undefined;
			});
			invalidateParentCycles(parents);
			const backend = Array.isArray(raw.backendNodeId) ? raw.backendNodeId : [];
			return {
				nodeTypes: raw.nodeType.map((value) => {
					const type = integer(value);
					return type !== undefined && type >= 0 ? type : undefined;
				}),
				nodeNames: raw.nodeName.map((value) => cdpSnapshotString(strings, value)),
				nodeValues: raw.nodeValue.map((value) => cdpSnapshotValueString(strings, value)),
				parents,
				attributes: raw.attributes.slice(0, count).map((value) => attributes(value, strings)),
				backendNodeIds: backend.slice(0, count).map((value) => {
					const id = integer(value);
					return id !== undefined && id > 0 ? id : undefined;
				}),
				excessAttributes: Math.max(0, raw.attributes.length - count)
			};
		};
		snapshotNodeAt = (nodes, index) => {
			const nodeType = nodes.nodeTypes[index];
			const nodeName = nodes.nodeNames[index];
			const nodeValue = nodes.nodeValues[index];
			const parent = nodes.parents[index];
			const attributes = nodes.attributes[index];
			return nodeType === undefined || nodeName === undefined || nodeValue === undefined || parent === undefined || attributes === undefined ? err({
				_tag: "InvalidCdpSnapshotNode",
				index
			}) : ok({
				nodeType,
				nodeName,
				nodeValue,
				parent,
				attributes
			});
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureDomNamespaces.js
var SVG_NAMESPACE, XLINK_NAMESPACE, XHTML_NAMESPACE, capturedSvgNodeKind, xmlDocument, createDocumentNamespaceAncestry, domXmlElement, resolveXmlElements, applyDeclarations, xmlnsPrefix, elementExpandedName, xlinkHrefValue, svgSourceNode;
function init_CdpCaptureDomNamespaces() {
	return (init_CdpCaptureDomNamespaces = __esmMin((() => {
		init_CdpCaptureValues();
		SVG_NAMESPACE = "http://www.w3.org/2000/svg";
		XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
		XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
		capturedSvgNodeKind = (query, result) => {
			const node = recordValue(recordValue(result)?.node);
			if (node?.backendNodeId !== query.backendNodeId || node.nodeName !== query.nodeName || node.nodeType !== 1) return undefined;
			return node.isSVG === undefined ? false : typeof node.isSVG === "boolean" ? node.isSVG : undefined;
		};
		xmlDocument = (nodes) => {
			const documentIndex = nodes.nodeTypes.findIndex((nodeType) => nodeType === 9);
			if (documentIndex < 0) return false;
			if (svgSourceNode(nodes, documentIndex) === undefined || nodes.parents[documentIndex] !== -1) return undefined;
			for (let index = 0; index < nodes.nodeTypes.length; index += 1) {
				if (nodes.nodeTypes[index] !== 1) continue;
				if (nodes.parents[index] !== documentIndex) continue;
				const source = svgSourceNode(nodes, index);
				if (source === undefined) return undefined;
				const name = source.nodeName;
				if (name === "HTML") return false;
				if (name === "html" || name.includes(":")) return true;
				const attributes = source.attributes;
				for (const [attributeName] of attributes) if (xmlnsPrefix(attributeName) !== undefined) return true;
				return false;
			}
			return false;
		};
		createDocumentNamespaceAncestry = (nodes) => {
			const xml = xmlDocument(nodes);
			return {
				xml,
				xmlElements: xml === true ? resolveXmlElements(nodes) : new Map()
			};
		};
		domXmlElement = (ancestry, index) => {
			if (ancestry.xml === false) {
				return {
					svgElement: false,
					xmlDocument: false,
					elementNamespace: undefined,
					localName: undefined,
					xlinkHref: undefined
				};
			}
			if (ancestry.xml === undefined) {
				return {
					svgElement: false,
					xmlDocument: undefined,
					elementNamespace: undefined,
					localName: undefined,
					xlinkHref: undefined
				};
			}
			const resolved = ancestry.xmlElements.get(index);
			if (resolved === undefined) {
				return {
					svgElement: false,
					xmlDocument: undefined,
					elementNamespace: undefined,
					localName: undefined,
					xlinkHref: undefined
				};
			}
			return {
				svgElement: resolved.svgElement,
				xmlDocument: true,
				elementNamespace: resolved.elementNamespace,
				localName: resolved.localName,
				xlinkHref: resolved.xlinkHref
			};
		};
		resolveXmlElements = (nodes) => {
			const children = new Map();
			const pending = [];
			for (let node = 0; node < nodes.nodeNames.length; node += 1) {
				const parent = nodes.parents[node];
				if (parent === undefined) continue;
				if (parent < 0) pending.push({ node });
				else {
					const siblings = children.get(parent);
					if (siblings === undefined) children.set(parent, [node]);
					else siblings.push(node);
				}
			}
			const bindings = new Map();
			const resolved = new Map();
			while (pending.length > 0) {
				const step = pending.pop();
				if (step === undefined) break;
				if ("restore" in step) {
					for (const { prefix, previous } of step.restore) {
						if (previous === undefined) bindings.delete(prefix);
						else bindings.set(prefix, previous);
					}
					continue;
				}
				const { node } = step;
				const source = svgSourceNode(nodes, node);
				if (source === undefined) continue;
				const attributes = source.attributes;
				const restore = applyDeclarations(bindings, attributes);
				const expandedName = elementExpandedName(source.nodeName, bindings);
				const svgElement = source.nodeType === 1 && expandedName?.namespace === SVG_NAMESPACE;
				resolved.set(node, {
					svgElement,
					elementNamespace: expandedName?.namespace,
					localName: expandedName?.localName,
					xlinkHref: svgElement ? xlinkHrefValue(attributes, bindings) : undefined
				});
				pending.push({ restore });
				for (const child of children.get(node) ?? []) pending.push({ node: child });
			}
			return resolved;
		};
		applyDeclarations = (bindings, attributes) => {
			const restore = [];
			const seen = new Set();
			for (const [name, value] of attributes) {
				const prefix = xmlnsPrefix(name);
				if (prefix === undefined || seen.has(prefix)) continue;
				seen.add(prefix);
				restore.push({
					prefix,
					previous: bindings.get(prefix)
				});
				if (value.length === 0) bindings.delete(prefix);
				else bindings.set(prefix, value);
			}
			return restore;
		};
		xmlnsPrefix = (name) => {
			if (name === undefined) return undefined;
			if (name === "xmlns") return "";
			if (!name.startsWith("xmlns:")) return undefined;
			const prefix = name.slice("xmlns:".length);
			if (prefix.length === 0 || prefix === "xmlns" || prefix.includes(":")) return undefined;
			return prefix;
		};
		elementExpandedName = (nodeName, bindings) => {
			if (nodeName === undefined) return undefined;
			const colon = nodeName.indexOf(":");
			if (colon < 0) return {
				namespace: bindings.get("") ?? "",
				localName: nodeName
			};
			const prefix = nodeName.slice(0, colon);
			const local = nodeName.slice(colon + 1);
			if (prefix.length === 0 || local.length === 0 || local.includes(":") || prefix === "xmlns") return undefined;
			const namespace = bindings.get(prefix);
			return namespace === undefined ? undefined : {
				namespace,
				localName: local
			};
		};
		xlinkHrefValue = (attributes, bindings) => {
			const seen = new Set();
			for (const [name, value] of attributes) {
				if (seen.has(name)) continue;
				seen.add(name);
				const colon = name.indexOf(":");
				if (colon <= 0) continue;
				const prefix = name.slice(0, colon);
				const local = name.slice(colon + 1);
				if (local !== "href" || bindings.get(prefix) !== XLINK_NAMESPACE) continue;
				return value;
			}
			return undefined;
		};
		svgSourceNode = (nodes, index) => {
			const nodeType = nodes.nodeTypes[index];
			const nodeName = nodes.nodeNames[index];
			const attributes = nodes.attributes[index];
			return nodeType === undefined || nodeName === undefined || attributes === undefined ? undefined : {
				nodeType,
				nodeName,
				attributes
			};
		};
	})))();
}

//#endregion
//#region dist/browser/CdpCaptureDocuments.js
/** Project one snapshot, requesting bounded batches of SVG identity facts. */
function* captureDom(result, allowedOrigins, input, completeness) {
	const root = requiredRecord(result);
	const strings = Array.isArray(root.strings) ? root.strings.map(cdpStringValue) : [];
	const nodes = [];
	const urls = [];
	const agentHints = [];
	let excludedUrls = 0;
	let total = 0;
	let unresolvedSvgNodes = 0;
	if (!Array.isArray(root.strings)) excludeDocumentEvidence(completeness, "invalid_protocol_value", null);
	for (const document of snapshotDocuments(root.documents, (count) => excludeDocumentEvidence(completeness, "invalid_protocol_value", count))) {
		const documentUrl = cdpSnapshotString(strings, document.documentURL);
		if (documentUrl === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		if (allowedSanitizedUrl(documentUrl, allowedOrigins) === undefined) {
			excludeDocumentEvidence(completeness, exclusionReasonForUrl(documentUrl));
			continue;
		}
		const baseUrlValue = document.baseURL === undefined ? documentUrl : cdpSnapshotValueString(strings, document.baseURL);
		if (baseUrlValue === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		const baseUrl = baseUrlValue || documentUrl;
		const documentNodes = snapshotDocumentNodes(document.nodes, strings);
		if (documentNodes === undefined) {
			excludeDocumentEvidence(completeness, "invalid_protocol_value");
			continue;
		}
		const { nodeTypes, backendNodeIds } = documentNodes;
		if (documentNodes.excessAttributes > 0) excludeDocumentEvidence(completeness, "invalid_protocol_value", documentNodes.excessAttributes);
		const baseIndex = total;
		total += nodeTypes.length;
		const ancestry = createDocumentNamespaceAncestry(documentNodes);
		const pendingMetadata = [];
		for (let index = 0; index < nodeTypes.length; index += 1) {
			const admitted = snapshotNodeAt(documentNodes, index);
			if (!admitted.ok) {
				excludeDocumentEvidence(completeness, "invalid_protocol_value");
				continue;
			}
			const { nodeType, nodeName, nodeValue, parent, attributes } = admitted.value;
			const nodeIndex = baseIndex + index;
			const attributeNames = [...new Set(attributes.map(([name]) => name))];
			const domElement = domXmlElement(ancestry, index);
			if (domElement.xmlDocument === undefined) completeness?.exclude("metadata", "invalid_protocol_value");
			let svgQuery;
			if (domElement.xmlDocument === false && nodeType === 1 && attributeNames.includes("xlink:href") && !attributeNames.includes("href")) {
				const backendNodeId = backendNodeIds[index];
				svgQuery = backendNodeId !== undefined ? {
					backendNodeId,
					nodeName
				} : null;
			}
			nodes.push({
				index: nodeIndex,
				parent_index: parent < 0 ? -1 : baseIndex + parent,
				node_type: nodeType,
				node_name: nodeName,
				node_value_length: nodeValue.length,
				attribute_names: attributeNames
			});
			pendingMetadata.push({
				svgQuery,
				options: {
					attributes,
					baseUrl: nodeName.toLowerCase() === "base" ? documentUrl : baseUrl,
					documentUrl,
					nodeIndex,
					nodeName,
					allowedOrigins,
					...domElement
				}
			});
			if (pendingMetadata.length === DOM_METADATA_BATCH_SIZE || index === nodeTypes.length - 1) {
				const metadata = yield* captureDomMetadata(pendingMetadata, completeness);
				urls.push(...metadata.urls);
				agentHints.push(...metadata.agentHints);
				excludedUrls += metadata.excludedUrls;
				unresolvedSvgNodes += metadata.unresolvedSvgNodes;
				pendingMetadata.length = 0;
			}
		}
		if (pendingMetadata.length > 0) {
			const metadata = yield* captureDomMetadata(pendingMetadata, completeness);
			urls.push(...metadata.urls);
			agentHints.push(...metadata.agentHints);
			excludedUrls += metadata.excludedUrls;
			unresolvedSvgNodes += metadata.unresolvedSvgNodes;
			pendingMetadata.length = 0;
		}
	}
	return {
		total,
		nodes,
		urls,
		agentHints,
		excludedUrls,
		unresolvedSvgNodes
	};
}
function* captureDomMetadata(pending, completeness) {
	const queries = pending.flatMap(({ svgQuery }) => svgQuery == null ? [] : [svgQuery]);
	const kinds = queries.length > 0 ? yield queries : [];
	const urls = [];
	const agentHints = [];
	let queryIndex = 0;
	let unresolvedSvgNodes = 0;
	let excludedUrls = 0;
	for (const { options, svgQuery } of pending) {
		let svgElement = options.svgElement;
		if (svgQuery !== undefined) {
			const kind = svgQuery === null ? undefined : kinds[queryIndex++];
			svgElement = kind === true;
			if (kind === undefined) {
				unresolvedSvgNodes += 1;
				completeness?.exclude("metadata", "provider_unavailable");
			}
		}
		const metadata = domMetadata({
			...options,
			svgElement
		});
		for (const url of metadata.urls) {
			urls.push(url);
			if (url.destination_scope !== "approved") {
				excludedUrls += 1;
				completeness?.exclude("metadata", url.destination_scope === "outside_policy" ? "disallowed_origin" : "unsupported_url");
			}
		}
		agentHints.push(...metadata.agentHints);
	}
	return {
		urls,
		agentHints,
		unresolvedSvgNodes,
		excludedUrls
	};
}
var captureFrames, observeCdpFrameUrl, observeMainFrameUrl, classifyCdpFrameUrl, cdpFrameUrl, mainFrameUrl, captureResources, frameTreeResources, walkFrameTrees, DOM_METADATA_BATCH_SIZE, excludeDocumentEvidence, snapshotDocuments, captureAccessibility, ACCESSIBILITY_STATE_NAMES, accessibilityStates, axText, hrefAttributeValue, domMetadata, domDestination, domUrlAttributes, agentRelValues;
function init_CdpCaptureDocuments() {
	return (init_CdpCaptureDocuments = __esmMin((() => {
		init_browserObservation();
		init_CdpCaptureValues();
		init_CdpSnapshotStrings();
		init_CdpSnapshotNodes();
		init_CdpCaptureEventHelpers();
		init_CdpCaptureDomNamespaces();
		init_unicodeCodePointOrder();
		captureFrames = (result, allowedOrigins, maximum, completeness) => {
			const root = recordValue(recordValue(result)?.frameTree);
			if (root === undefined) {
				completeness?.exclude("frames", "invalid_protocol_value");
				return { items: [] };
			}
			const items = [];
			for (const tree of walkFrameTrees(root, (omittedCount) => completeness?.exclude("frames", "invalid_protocol_value", omittedCount))) {
				const frame = recordValue(tree.frame);
				const frameId = cdpStringValue(frame?.id);
				const observation = observeCdpFrameUrl(frame);
				const scopeUrl = observation.kind === "missing" ? undefined : observation.scopeUrl;
				const facts = classifyCdpFrameUrl(observation, allowedOrigins);
				if (frame === undefined || frameId === undefined) {
					completeness?.exclude("frames", "invalid_protocol_value");
					continue;
				}
				if (observation.kind === "invalid_fragment") {
					completeness?.exclude("frames", "invalid_protocol_value");
					if (facts.scope !== "approved") completeness?.exclude("frames", exclusionReasonForUrl(scopeUrl));
					continue;
				}
				if (facts.url === undefined || facts.origin === null) {
					completeness?.exclude("frames", exclusionReasonForUrl(scopeUrl));
					continue;
				}
				if (maximum !== undefined && items.length >= maximum) continue;
				const parentFrameId = cdpStringValue(frame.parentId);
				if ((tree !== root || Object.hasOwn(frame, "parentId")) && (parentFrameId === undefined || parentFrameId.length === 0)) completeness?.exclude("frames", "invalid_protocol_value");
				items.push({
					frame_id: frameId,
					parent_frame_id: parentFrameId ?? null,
					url: facts.url,
					origin: facts.origin
				});
			}
			return { items };
		};
		observeCdpFrameUrl = (frame) => {
			const url = cdpStringValue(frame?.url);
			if (url === undefined) return { kind: "missing" };
			if (frame?.urlFragment === undefined) return {
				kind: "observed",
				url,
				scopeUrl: url
			};
			const fragment = cdpStringValue(frame.urlFragment);
			if (fragment === undefined || fragment !== "" && !fragment.startsWith("#")) return {
				kind: "invalid_fragment",
				scopeUrl: url
			};
			return {
				kind: "observed",
				url: `${url.split("#", 1)[0] ?? ""}${fragment}`,
				scopeUrl: url
			};
		};
		observeMainFrameUrl = (result) => observeCdpFrameUrl(recordValue(recordValue(requiredRecord(result).frameTree)?.frame));
		classifyCdpFrameUrl = (observation, allowedOrigins) => {
			if (observation.kind === "missing") return {
				scope: "unknown",
				origin: null,
				url: undefined
			};
			const base = sanitizeBrowserUrl(observation.scopeUrl);
			const scope = base.origin === null ? "unsupported" : allowedOrigins.has(base.origin) ? "approved" : "outside_policy";
			return {
				scope,
				origin: base.origin,
				url: observation.kind === "observed" && scope === "approved" ? sanitizeBrowserUrl(observation.url).url : undefined
			};
		};
		cdpFrameUrl = (frame) => {
			const observed = observeCdpFrameUrl(frame);
			return observed.kind === "observed" ? observed.url : undefined;
		};
		mainFrameUrl = (result) => {
			const observed = observeMainFrameUrl(result);
			return observed.kind === "observed" ? observed.url : undefined;
		};
		captureResources = (result, allowedOrigins, completeness) => {
			const root = recordValue(recordValue(result)?.frameTree);
			if (root === undefined) {
				completeness?.exclude("resources", "invalid_protocol_value");
				return { items: [] };
			}
			const items = [];
			for (const resource of frameTreeResources(root, (count) => completeness?.exclude("resources", "invalid_protocol_value", count))) {
				const url = allowedSanitizedUrl(resource.url, allowedOrigins);
				if (url === undefined || url.origin === null) {
					completeness?.exclude("resources", exclusionReasonForUrl(cdpStringValue(resource.url)));
					continue;
				}
				const type = cdpStringValue(resource.type);
				const mimeType = cdpStringValue(resource.mimeType);
				if (type === undefined || type.length === 0 || mimeType === undefined) {
					completeness?.exclude("resources", "invalid_protocol_value");
					continue;
				}
				const contentSize = resourceContentSize(resource.contentSize);
				if (!contentSize.ok) completeness?.exclude("resources", "invalid_protocol_value");
				items.push({
					rawUrl: cdpStringValue(resource.url) ?? "",
					url: url.url,
					origin: url.origin,
					type,
					mime_type: mimeType,
					content_size: contentSize.ok ? contentSize.value : null
				});
			}
			return { items };
		};
		frameTreeResources = function* (root, onInvalid) {
			for (const tree of walkFrameTrees(root, onInvalid)) {
				if (!Array.isArray(tree.resources)) {
					onInvalid(null);
					continue;
				}
				for (const entry of tree.resources) {
					const resource = recordValue(entry);
					if (resource === undefined) onInvalid(1);
					else yield resource;
				}
			}
		};
		walkFrameTrees = function* (root, onMalformedChild) {
			const pending = [root];
			while (pending.length > 0) {
				const tree = pending.pop();
				if (tree === undefined) return;
				const rawChildren = tree.childFrames;
				if (rawChildren !== undefined && !Array.isArray(rawChildren)) onMalformedChild?.(null);
				const children = Array.isArray(rawChildren) ? rawChildren.flatMap((child) => {
					const parsed = recordValue(child);
					if (parsed === undefined) onMalformedChild?.(null);
					return parsed === undefined ? [] : [parsed];
				}) : [];
				for (let index = children.length - 1; index >= 0; index -= 1) {
					const child = children[index];
					if (child !== undefined) pending.push(child);
				}
				yield tree;
			}
		};
		DOM_METADATA_BATCH_SIZE = 8;
		excludeDocumentEvidence = (completeness, reason, count = 1) => {
			completeness?.exclude("dom", reason, count);
			completeness?.exclude("metadata", reason, count);
		};
		snapshotDocuments = (value, onInvalid) => {
			if (!Array.isArray(value) || value.length === 0) {
				onInvalid(null);
				return [];
			}
			return value.flatMap((item) => {
				const document = recordValue(item);
				if (document === undefined) onInvalid(1);
				return document === undefined ? [] : [document];
			});
		};
		captureAccessibility = (results, options) => {
			const all = results.flatMap((result) => {
				const inventory = admitRecords(requiredRecord(result).nodes);
				if (inventory === undefined) {
					options.completeness?.exclude("accessibility", "invalid_protocol_value", null);
					return [];
				}
				const nodes = [];
				let malformedCount = 0;
				for (const entry of inventory) {
					const node = recordValue(entry);
					if (node === undefined || cdpStringValue(node.nodeId) === undefined || cdpStringValue(node.nodeId)?.length === 0 || typeof node.ignored !== "boolean") {
						malformedCount += 1;
						continue;
					}
					const parentId = cdpStringValue(node.parentId);
					if (node.parentId !== undefined && (parentId === undefined || parentId.length === 0)) malformedCount += 1;
					if (node.childIds !== undefined && (!Array.isArray(node.childIds) || node.childIds.some((childId) => cdpStringValue(childId) === undefined || cdpStringValue(childId)?.length === 0))) malformedCount += 1;
					nodes.push(node);
				}
				if (malformedCount > 0) options.completeness?.exclude("accessibility", "invalid_protocol_value", malformedCount);
				return nodes;
			});
			const nodeIds = new Set(all.flatMap((node) => {
				const nodeId = cdpStringValue(node.nodeId);
				return nodeId === undefined ? [] : [nodeId];
			}));
			let excludedFields = 0;
			const nodes = all.map((node) => {
				const captureText = (value) => {
					const raw = cdpStringValue(recordValue(value)?.value);
					if (raw === undefined) return null;
					if (!options.includeText) {
						excludedFields += 1;
						return null;
					}
					return raw;
				};
				return {
					node_id: cdpStringValue(node.nodeId) ?? "",
					parent_id: cdpStringValue(node.parentId) ?? null,
					role: axText(node.role),
					name: captureText(node.name),
					description: captureText(node.description),
					ignored: node.ignored === true,
					states: accessibilityStates(node.properties)
				};
			});
			return {
				total: all.length,
				nodes,
				hasUnobservedChildren: all.some((node) => Array.isArray(node.childIds) && node.childIds.some((childId) => {
					const id = cdpStringValue(childId);
					return id !== undefined && !nodeIds.has(id);
				})),
				textCapture: {
					status: options.unavailable ? "unavailable" : !options.includeText ? "not_approved" : "included",
					retained_bytes: nodes.reduce((total, node) => total + Buffer.byteLength(node.name ?? "") + Buffer.byteLength(node.description ?? ""), 0),
					excluded_fields: excludedFields
				}
			};
		};
		ACCESSIBILITY_STATE_NAMES = new Set([
			"atomic",
			"autocomplete",
			"busy",
			"checked",
			"disabled",
			"editable",
			"expanded",
			"focusable",
			"focused",
			"hasPopup",
			"hidden",
			"invalid",
			"level",
			"live",
			"modal",
			"multiline",
			"multiselectable",
			"orientation",
			"pressed",
			"readonly",
			"required",
			"selected",
			"valuemax",
			"valuemin"
		]);
		accessibilityStates = (value) => {
			const states = new Map();
			for (const property of recordsValue(value)) {
				const name = cdpStringValue(property.name);
				if (name === undefined || !ACCESSIBILITY_STATE_NAMES.has(name)) continue;
				const raw = recordValue(property.value)?.value;
				const state = typeof raw === "boolean" ? raw : typeof raw === "number" ? numberValue(raw) : typeof raw === "string" ? raw : undefined;
				if (state !== undefined) states.set(name, state);
			}
			return [...states].sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([name, state]) => ({
				name,
				value: state
			}));
		};
		axText = (value) => cdpStringValue(recordValue(value)?.value) ?? null;
		hrefAttributeValue = (pairs, attribute, options) => {
			const declared = pairs.get(attribute);
			if (declared !== undefined) return declared;
			if (attribute !== "href" || !options.svgElement) return undefined;
			return options.xmlDocument ? options.xlinkHref : pairs.get("xlink:href");
		};
		domMetadata = (options) => {
			const { attributes, baseUrl, documentUrl, nodeIndex, nodeName, allowedOrigins, xmlDocument, elementNamespace, localName } = options;
			const pairs = new Map();
			for (const [name, value] of attributes) {
				if (!pairs.has(name)) pairs.set(name, value);
			}
			const urls = [];
			for (const attribute of domUrlAttributes) {
				const value = hrefAttributeValue(pairs, attribute, options);
				if (value === undefined) continue;
				const tagName = xmlDocument === false ? nodeName.toLowerCase() : xmlDocument === true && elementNamespace === "http://www.w3.org/1999/xhtml" ? localName ?? "" : "";
				const usesDocumentUrl = tagName === "form" && attribute === "action" && /^[\t\n\f\r ]*$/u.test(value) || (tagName === "button" || tagName === "input") && attribute === "formaction" && value === "";
				const destination = domDestination(usesDocumentUrl ? documentUrl : value, baseUrl, allowedOrigins);
				urls.push({
					node_index: nodeIndex,
					attribute,
					url: destination.url,
					destination_scope: destination.scope
				});
			}
			const rel = (pairs.get("rel") ?? "").toLowerCase().split(/[\t\n\f\r ]+/u).filter((value) => agentRelValues.includes(value));
			const href = urls.find(({ attribute }) => attribute === "href")?.url ?? null;
			const agentHints = nodeName.toLowerCase() === "link" && rel.length > 0 ? rel.map((declaration) => ({
				mechanism: "dom_link_rel",
				declaration,
				url: href,
				trust: "page-declared-untrusted"
			})) : [];
			return {
				urls,
				agentHints
			};
		};
		domDestination = (value, baseUrl, allowedOrigins) => {
			try {
				const parsed = new URL(value, baseUrl);
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return {
					url: null,
					scope: "unsupported"
				};
				if (!allowedOrigins.has(parsed.origin)) return {
					url: null,
					scope: "outside_policy"
				};
				return {
					url: allowedSanitizedUrl(parsed.href, allowedOrigins)?.url ?? null,
					scope: "approved"
				};
			} catch (cause) {
				void cause;
				return {
					url: null,
					scope: "unsupported"
				};
			}
		};
		domUrlAttributes = [
			"href",
			"src",
			"action",
			"formaction",
			"poster"
		];
		agentRelValues = [
			"mcp",
			"model-context",
			"ai-plugin",
			"service-desc"
		];
	})))();
}

//#endregion
//#region dist/browser/CdpOptionalCommand.js
var optionalCdpCommand;
function init_CdpOptionalCommand() {
	return (init_CdpOptionalCommand = __esmMin((() => {
		init_CdpCommandRejection();
		init_CdpConnection();
		optionalCdpCommand = async (context, method, parameters, limitations) => {
			try {
				return await context.connection.send(method, parameters, context.sessionId, context.signal);
			} catch (cause) {
				if (!(cause instanceof CdpCommandRejection) || cause.code !== -32601) throw cause;
				limitations.push(`${method} was unavailable from this browser target.`);
				return undefined;
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpScriptSourceBudget.js
var MIB, CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON, cdpScriptSourceDeadlineOmissionReason, CdpScriptSourceBudget;
function init_CdpScriptSourceBudget() {
	return (init_CdpScriptSourceBudget = __esmMin((() => {
		init_browserDeadline();
		init_webRuntime();
		init_ProviderDeadline();
		MIB = 1024 * 1024;
		CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON = `script source was omitted because the aggregate ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte (${String(WEB_RUNTIME_LIMITS.sourceBytes / MIB)} MiB) source budget was exhausted. ${noRuntimeOverrideSentence("That source budget stays fixed.", "command_timeout_ms")}`;
		cdpScriptSourceDeadlineOmissionReason = (timeoutMs) => `script source was omitted because the ${String(timeoutMs)} ms command_timeout_ms source collection deadline elapsed (deadlineExpired). This is not the caller observation window. ${noRuntimeOverrideSentence(`The ${String(WEB_RUNTIME_LIMITS.sourceBytes)}-byte source budget stays fixed.`, "command_timeout_ms")}`;
		CdpScriptSourceBudget = class {
			#deadline;
			commandTimeoutMs;
			#retainedBytes = 0;
			constructor(signal, commandTimeoutMs = selectedCdpCommandTimeoutMs(undefined)) {
				this.commandTimeoutMs = commandTimeoutMs;
				this.#deadline = new ProviderStartupDeadline(commandTimeoutMs, signal);
			}
			get signal() {
				return this.#deadline.signal;
			}
			get timedOut() {
				return this.#deadline.interruption === "timeout";
			}
			/** Admit exact UTF-8 source bytes before building or retaining its artifact. */
			admit(text) {
				const bytes = Buffer.byteLength(text, "utf8");
				if (bytes > WEB_RUNTIME_LIMITS.sourceBytes - this.#retainedBytes) return false;
				this.#retainedBytes += bytes;
				return true;
			}
			dispose() {
				this.#deadline.dispose();
			}
		};
	})))();
}

//#endregion
//#region dist/browser/CdpWorkerTargetOwnership.js
var workerTargetOwnership;
function init_CdpWorkerTargetOwnership() {
	return (init_CdpWorkerTargetOwnership = __esmMin((() => {
		init_result();
		init_CdpCaptureValues();
		workerTargetOwnership = (target, selectedTargetId, frameIds) => {
			const openerTargetId = cdpStringValue(target.openerId);
			const parentFrameId = cdpStringValue(target.parentFrameId);
			if (target.openerId !== undefined && (openerTargetId === undefined || openerTargetId === "") || target.parentFrameId !== undefined && (parentFrameId === undefined || parentFrameId === "")) return err({ _tag: "InvalidWorkerRelationship" });
			const selected = openerTargetId === selectedTargetId || parentFrameId !== undefined && frameIds.has(parentFrameId);
			return ok({
				scope: selected ? "selected" : openerTargetId === undefined && parentFrameId === undefined ? "unknown" : "foreign",
				openerTargetId: openerTargetId ?? null,
				parentFrameId: parentFrameId ?? null
			});
		};
	})))();
}

//#endregion
//#region dist/browser/ElectronFileScope.js
var resources, authorizedElectronFile, retryElectronFileCleanup, mapElectronFileAuthorizationFailure, resolveAuthorizedElectronFile, authorizedAsarMember, MAX_CACHED_HEADERS, headerCache, archiveIdentity, asarFiles, isAsarRegularFile, isRecord, throwIfAborted;
function init_ElectronFileScope() {
	return (init_ElectronFileScope = __esmMin((() => {
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_providerAdapterError();
		init_providerCleanupError();
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_AsarHeader();
		init_asarHeaderAdmission();
		resources = new ArtifactResourceScope();
		authorizedElectronFile = async (value, signal, operation = "inspect_electron_page", asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) => {
			try {
				return await resources.run(async () => await resolveAuthorizedElectronFile(value, signal, asarHeaderAdmission));
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) throw cause;
				if (signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: signal.reason });
				throw cause;
			}
		};
		retryElectronFileCleanup = async () => await resources.retryCleanup();
		mapElectronFileAuthorizationFailure = (cause, providerId, operation, diagnostics) => {
			if (!(cause instanceof ArtifactReaderFailure) || cause.cleanup === undefined) return undefined;
			const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
			const physicalPrimary = physical?.outcome.kind === "failed" ? physical.outcome.cause : undefined;
			const cancellationReason = physical?.completionCancellation === undefined ? physicalPrimary instanceof ArtifactReaderFailure && physicalPrimary.reason === "cancelled" ? physicalPrimary.cancellation === undefined ? physicalPrimary.cause : physicalPrimary.cancellation.reason : undefined : physical.completionCancellation.reason;
			const hasCancellation = physical?.completionCancellation !== undefined || physicalPrimary instanceof ArtifactReaderFailure && physicalPrimary.reason === "cancelled";
			const primary = hasCancellation ? new AnalysisCancelledError(operation, { cause: cancellationReason }) : physicalPrimary instanceof AnalysisError ? physicalPrimary : physicalPrimary === undefined ? undefined : new ProviderAdapterError(providerId, operation, { cause: physicalPrimary });
			const cleanup = new ProviderCleanupError(providerId, cause.cleanup.resources, { reason: cause.cleanup.reason }, {
				operation,
				cause
			});
			bindArtifactFileCleanup(cause, cleanup);
			if (diagnostics !== undefined) (primary ?? cleanup).retainDiagnostics(diagnostics);
			if (primary === undefined) return cleanup;
			const composed = analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
			bindArtifactFileCleanup(cause, composed);
			return composed;
		};
		resolveAuthorizedElectronFile = async (value, signal, asarHeaderAdmission) => {
			throwIfAborted(signal);
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return undefined;
			}
			if (url.protocol !== "file:" || url.hostname !== "" || url.username !== "" || url.password !== "" || /%(?:2f|5c)/iu.test(url.pathname)) return undefined;
			let path;
			try {
				path = fileURLToPath(url);
			} catch (cause) {
				void cause;
				return undefined;
			}
			if (!isAbsolute(path) || path.includes("\0")) return undefined;
			try {
				const metadata = await stat(path);
				throwIfAborted(signal);
				if (metadata.isFile()) {
					const canonical = await realpath(path);
					throwIfAborted(signal);
					return canonical;
				}
			} catch (cause) {
				throwIfAborted(signal);
				void cause;
			}
			throwIfAborted(signal);
			return await authorizedAsarMember(path, signal, asarHeaderAdmission);
		};
		authorizedAsarMember = async (path, signal, asarHeaderAdmission) => {
			const segments = path.split(sep);
			for (let index = 1; index < segments.length - 1; index += 1) {
				throwIfAborted(signal);
				if (!(segments[index] ?? "").toLowerCase().endsWith(".asar")) continue;
				const archive = segments.slice(0, index + 1).join(sep);
				const member = segments.slice(index + 1);
				if (member.some((part) => part === "" || part === "." || part === "..")) return undefined;
				try {
					const metadata = await stat(archive);
					throwIfAborted(signal);
					if (!metadata.isFile()) continue;
					const canonical = await realpath(archive);
					throwIfAborted(signal);
					const files = await asarFiles(canonical, metadata, asarHeaderAdmission, signal, resources);
					throwIfAborted(signal);
					return isAsarRegularFile(files, member) ? join(canonical, ...member) : undefined;
				} catch (cause) {
					if (cause instanceof ArtifactFileCleanupFailure) throw cause;
					if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) throw cause;
					throwIfAborted(signal);
					void cause;
					return undefined;
				}
			}
			return undefined;
		};
		MAX_CACHED_HEADERS = 8;
		headerCache = new Map();
		archiveIdentity = (metadata) => `${String(metadata.dev)}:${String(metadata.ino)}:${String(metadata.size)}:${String(metadata.mtimeMs)}`;
		asarFiles = async (archive, metadata, admission, signal, resources) => {
			throwIfAborted(signal);
			const identity = archiveIdentity(metadata);
			const cached = headerCache.get(archive);
			if (cached?.identity === identity) {
				if (cached.headerBytes > admission.maximumBytes) throw asarHeaderAdmissionFailure(admission, cached.headerBytes);
				return cached.files;
			}
			const handle = await open(archive, "r");
			const admitted = await withArtifactFileHandle(archive, handle, resources, signal, async (file) => {
				let jsonBytes;
				let headerBytes;
				throwIfAborted(signal);
				const opened = await file.stat();
				throwIfAborted(signal);
				if (!opened.isFile() || archiveIdentity(opened) !== identity) throw new Error("ASAR identity changed before header read");
				const header = await admitAsarHeader(file, signal, admission);
				throwIfAborted(signal);
				jsonBytes = header.jsonBytes;
				headerBytes = header.headerBytes;
				const json = Buffer.alloc(jsonBytes);
				let offset = 0;
				while (offset < json.length) {
					throwIfAborted(signal);
					const part = await file.read(json, offset, json.length - offset, 16 + offset);
					throwIfAborted(signal);
					if (part.bytesRead === 0) throw new Error("Truncated ASAR JSON header");
					offset += part.bytesRead;
				}
				const afterRead = await file.stat();
				throwIfAborted(signal);
				if (archiveIdentity(afterRead) !== identity) throw new Error("ASAR identity changed during header read");
				const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(json));
				if (!isRecord(parsed) || !isRecord(parsed.files)) throw new Error("ASAR header has no file tree");
				return {
					files: parsed.files,
					jsonBytes,
					headerBytes
				};
			});
			throwIfAborted(signal);
			headerCache.delete(archive);
			headerCache.set(archive, {
				identity,
				files: admitted.files,
				bytes: admitted.jsonBytes,
				headerBytes: admitted.headerBytes
			});
			const retainedBytes = () => [...headerCache.values()].reduce((sum, entry) => sum + entry.bytes, 0);
			while (headerCache.size > MAX_CACHED_HEADERS || retainedBytes() > admission.maximumBytes) headerCache.delete(headerCache.keys().next().value ?? archive);
			return admitted.files;
		};
		isAsarRegularFile = (files, member) => {
			let node = { files };
			for (const part of member) {
				const children = isRecord(node) ? node.files : undefined;
				if (!isRecord(children) || !Object.hasOwn(children, part)) return false;
				node = children[part];
			}
			return isRecord(node) && typeof node.size === "number" && !("files" in node) && !("link" in node);
		};
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		throwIfAborted = (signal) => {
			assertArtifactReadActive(signal);
		};
	})))();
}

//#endregion
export { CDP_CAPTURE_SCRIPT_METADATA_LIMITS, CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON, CdpCaptureCompleteness, CdpScriptSourceBudget, admitRecords, allowedSanitizedUrl, authorizedElectronFile, captureAccessibility, captureDom, captureFrames, captureResources, capturedSvgNodeKind, cdpFrameIdentity, cdpFrameRecordIdentity, cdpFrameUrl, cdpScriptSourceDeadlineOmissionReason, cdpSnapshotString, cdpStringValue, classifyCdpFrameUrl, consolePrimitive, delayWithCancellation, exclusionReasonForUrl, executionContextKey, frameTreeResources, init_CdpCaptureCompleteness, init_CdpCaptureDocuments, init_CdpCaptureDomNamespaces, init_CdpCaptureEventHelpers, init_CdpCaptureEventTypes, init_CdpCaptureValues, init_CdpOptionalCommand, init_CdpScriptSourceBudget, init_CdpSnapshotNodes, init_CdpSnapshotStrings, init_CdpWorkerTargetOwnership, init_ElectronFileScope, initiatorLocation, integerOrNull, isHttpUrl, isJsonContentType, isJsonMediaType, mainFrameUrl, mapElectronFileAuthorizationFailure, numberValue, observeCdpFrameUrl, observeMainFrameUrl, optionalCdpCommand, recordValue, recordsValue, requiredRecord, requiredScriptSource, resourceContentSize, retryElectronFileCleanup, scriptMetadataValues, snapshotDocumentNodes, snapshotDocuments, snapshotNodeAt, sourceExcluded, sourceResult, topCallFrame, walkFrameTrees, workerTargetOwnership };