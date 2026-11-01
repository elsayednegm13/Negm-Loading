import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_canonicalDigest, t as digestCanonicalValue } from "./canonicalDigest-BTvxtxxs.js";
import { n as init_digests, t as digestSchema } from "./digests-CzeqVG1r.js";
import { n as jsonValueByteLength, t as init_jsonValueByteLength } from "./jsonValueByteLength-D_Ap3bp9.js";
import { posix } from "node:path";
import { domainToASCII, fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { crc32 } from "node:zlib";

//#region dist/domain/javascript/javascriptSourceCoordinates.js
var compareJavaScriptSourcePoints, javascriptSourceRangeContains, javascriptSourceRangeKey, sourcePointSchema, javascriptSourceRangeSchema;
function init_javascriptSourceCoordinates() {
	return (init_javascriptSourceCoordinates = __esmMin((() => {
		compareJavaScriptSourcePoints = (left, right) => left.line - right.line || left.column - right.column;
		javascriptSourceRangeContains = (outer, inner) => compareJavaScriptSourcePoints(outer.start, inner.start) <= 0 && compareJavaScriptSourcePoints(outer.end, inner.end) >= 0;
		javascriptSourceRangeKey = (range) => `${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`;
		sourcePointSchema = z.strictObject({
			line: z.number().int().min(1),
			column: z.number().int().min(0)
		});
		javascriptSourceRangeSchema = z.strictObject({
			start: sourcePointSchema,
			end: sourcePointSchema
		}).superRefine((range, context) => {
			if (compareJavaScriptSourcePoints(range.end, range.start) < 0) context.addIssue({
				code: "custom",
				path: ["end"],
				message: "Source range end must not precede its start"
			});
		}).describe("One-based lines, zero-based UTF-16 columns; start inclusive, end exclusive.");
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptAnalysisResourceControls.js
var JAVASCRIPT_STATIC_FACT_BYTES, JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS, JAVASCRIPT_WORKER_HEAP_MIB_MINIMUM, JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM, JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM, HEAP_DOES_NOT_RAISE, javaScriptWorkerHeapRemediation, JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS, JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION, JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION, javaScriptWorkerHeapExhaustionRecovery, semanticControl, semanticAdjustment, javaScriptSemanticCeilingCoverage, javaScriptAnalysisCoverageLimits, javaScriptAnalysisResourceControlsSchema;
function init_javascriptAnalysisResourceControls() {
	return (init_javascriptAnalysisResourceControls = __esmMin((() => {
		JAVASCRIPT_STATIC_FACT_BYTES = 8 * 1024 * 1024;
		JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS = {
			heapMb: 1024,
			timeoutMs: 3e5,
			semanticNodes: 1e5,
			semanticNodesPerFile: 2e4,
			semanticUnknowns: 1e5,
			semanticUnknownsPerFile: 2e4
		};
		JAVASCRIPT_WORKER_HEAP_MIB_MINIMUM = 128;
		JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM = 16384;
		JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM = 1e6;
		HEAP_DOES_NOT_RAISE = "Raising max_heap_mb does not raise the parent result budget, transfer record or transfer file byte ceilings, the CLI/MCP process heap, or fixed parser limits.";
		javaScriptWorkerHeapRemediation = (heapMb) => {
			const bounds = `an integer from ${String(128)} to ${String(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM)} (default ${String(JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.heapMb)} MiB)`;
			const adjustment = heapMb >= 16384 ? `max_heap_mb is already ${String(heapMb)} MiB, the maximum ${String(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM)}. Do not increase it further.` : `Increase max_heap_mb (CLI: rea analyze-javascript-application <input_path> --max-heap-mb <mebibytes>), ${bounds}.`;
			return `${adjustment} The effective worker heap for this analysis is ${String(heapMb)} MiB. A changed max_heap_mb applies on the next analysis, which starts a new worker. It does not change a worker that is already running, and it does not require restarting the REA server. ${HEAP_DOES_NOT_RAISE} On Bun, V8 heap flags are ignored: Windows limits the analyzer's committed memory to max_heap_mb plus a 512 MiB reserve, and other Bun hosts enforce no analyzer heap limit.`;
		};
		JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS = "On Node, set NODE_OPTIONS (for example --max-old-space-size=<MiB>) in the environment that starts the CLI or MCP server, then restart that process,";
		JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION = `This limit belongs to the parent result budget. That budget follows the parent V8 heap limit. Increasing max_heap_mb does not raise it. ${JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS} to raise the parent heap and this budget. Use the retained static facts or analyze fewer source files.`;
		JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION = `This limit belongs to the parent process heap. Increasing max_heap_mb does not raise it. max_heap_mb changes only the isolated analyzer, on the next analysis, by starting a new worker. ${JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS} to raise the parent heap and admit this checkpoint.`;
		javaScriptWorkerHeapExhaustionRecovery = (input) => {
			if (input.heapFlagsEnforced) return {
				reason: `Owned JavaScript worker exhausted its ${String(input.heapMb)} MiB V8 old-space heap (max_heap_mb) while analyzing ${input.path} during ${input.phase}`,
				remediationAction: javaScriptWorkerHeapRemediation(input.heapMb)
			};
			return {
				reason: `Owned JavaScript worker ran out of memory while analyzing ${input.path} during ${input.phase}. Bun ignores the V8 old-space flag, so this exit is not the configured max_heap_mb limit of ${String(input.heapMb)} MiB.`,
				remediationAction: "Bun ignores V8 heap flags, so raising max_heap_mb does not change this exit. Windows limits the analyzer's committed memory to max_heap_mb plus a 512 MiB reserve and reports that separately as a process memory limit. Other Bun hosts enforce no analyzer heap limit. Reduce the analysis instead of increasing max_heap_mb."
			};
		};
		semanticControl = {
			nodes: {
				total: "max_semantic_nodes",
				perFile: "max_semantic_nodes_per_file",
				ceiling: "semantic_graph_node_ceiling",
				fileCeiling: "semantic_graph_file_node_ceiling",
				totalDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticNodes,
				perFileDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticNodesPerFile,
				cliTotal: "--max-semantic-nodes",
				cliPerFile: "--max-semantic-nodes-per-file",
				doesNotRaise: "max_semantic_unknowns, max_heap_mb, transfer ceilings, or the parent result budget"
			},
			unknowns: {
				total: "max_semantic_unknowns",
				perFile: "max_semantic_unknowns_per_file",
				ceiling: "semantic_graph_unknown_ceiling",
				fileCeiling: "semantic_graph_file_unknown_ceiling",
				totalDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticUnknowns,
				perFileDefault: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.semanticUnknownsPerFile,
				cliTotal: "--max-semantic-unknowns",
				cliPerFile: "--max-semantic-unknowns-per-file",
				doesNotRaise: "max_semantic_nodes, max_heap_mb, transfer ceilings, or the parent result budget"
			}
		};
		semanticAdjustment = (name, value, fallback) => value >= 1e6 ? `${name} is already ${String(value)}, the maximum ${String(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM)}. Do not increase it further.` : `${name} is ${String(value)} (default ${String(fallback)}; an integer from 1 to ${String(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM)})`;
		javaScriptSemanticCeilingCoverage = (kind, total, perFile, reached) => {
			const control = semanticControl[kind];
			const limits = [
				{
					name: control.ceiling,
					value: total,
					unit: "items"
				},
				{
					name: control.fileCeiling,
					value: perFile,
					unit: "items"
				},
				{
					name: control.total,
					value: total,
					unit: "items"
				},
				{
					name: control.perFile,
					value: perFile,
					unit: "items"
				}
			];
			const reachedControls = [...reached.total ? [{
				name: control.total,
				value: total,
				fallback: control.totalDefault,
				cli: control.cliTotal
			}] : [], ...reached.perFile ? [{
				name: control.perFile,
				value: perFile,
				fallback: control.perFileDefault,
				cli: control.cliPerFile
			}] : []];
			if (reachedControls.length === 0) throw new RangeError("Semantic ceiling coverage requires a ceiling that stopped retention");
			const reachedText = reachedControls.map((item) => semanticAdjustment(item.name, item.value, item.fallback)).join(" and ");
			const names = reachedControls.map((item) => item.name).join(" and ");
			const cli = reachedControls.map((item) => item.cli).join(" and ");
			const raising = reachedControls.length === 1 ? "Raising it" : "Raising them";
			const limitation = `Semantic ${kind === "nodes" ? "node" : "unknown"} retention reached ${reachedText}. Set ${names} on the next analyze_javascript_application call (CLI: ${cli}). The change applies to that next analysis and does not restart the worker or the REA server. ${raising} does not raise ${control.doesNotRaise}. Coverage reports the same effective values as ${control.ceiling} and ${control.fileCeiling}.`;
			return {
				limits,
				limitation
			};
		};
		javaScriptAnalysisCoverageLimits = (limits) => {
			const result = [];
			for (const key of [
				"worker_heap_limit_bytes",
				"worker_process_memory_limit_bytes",
				"worker_timeout_ms",
				"parent_result_budget_bytes",
				"parent_available_result_budget_bytes",
				"semantic_result_budget_bytes",
				"transfer_record_bytes",
				"transfer_file_bytes"
			]) {
				const value = limits?.[key];
				if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) continue;
				result.push({
					name: `javascript_analysis_${key}`,
					value,
					unit: key.endsWith("_ms") ? "milliseconds" : "bytes"
				});
			}
			return result;
		};
		javaScriptAnalysisResourceControlsSchema = z.strictObject({
			max_semantic_nodes: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic nodes across the application; defaults to 100000. Worker heap and parent result admission remain enforced."),
			max_semantic_nodes_per_file: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic nodes per source file; defaults to 20000, additionally bounded by max_semantic_nodes and memory/transfer limits."),
			max_semantic_unknowns: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic unknown records across the application; defaults to 100000. Omitted emission occurrences are counted by family and reason."),
			max_semantic_unknowns_per_file: z.number().int().min(1).max(JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM).optional().describe("Maximum retained semantic unknown records per source file; defaults to 20000, additionally bounded by max_semantic_unknowns and memory/transfer limits."),
			max_heap_mb: z.number().int().min(128).max(JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM).optional().describe("Maximum V8 old-space heap in MiB for the isolated JavaScript source analyzer; defaults to 1024. This does not change the CLI/MCP process heap. When REA runs on Bun, which ignores V8 heap flags, Windows instead limits the analyzer's committed memory to this budget plus a 512 MiB runtime reserve; other Bun hosts enforce no limit."),
			analysis_timeout_ms: z.number().int().min(1).max(2147483647).optional().describe("Maximum startup, analysis and transfer time per JavaScript source, in milliseconds; defaults to 300000. On timeout, return collected partial Evidence and stop the analysis.")
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRouteFacts.js
var javaScriptRouteMechanismSchema, javaScriptRouteSegmentSchema, javaScriptRouteCandidateSchema, javaScriptRouteWorkCapacitySchema, javaScriptRouteSourceFactsSchema;
function init_javascriptRouteFacts() {
	return (init_javascriptRouteFacts = __esmMin((() => {
		init_javascriptSourceCoordinates();
		javaScriptRouteMechanismSchema = z.enum([
			"router-call",
			"nested-route-object",
			"typed-route-tree",
			"next-app-chunk",
			"navigation-target",
			"route-string-constant"
		]);
		javaScriptRouteSegmentSchema = z.strictObject({
			value: z.string(),
			location: javascriptSourceRangeSchema,
			origin: z.enum([
				"literal",
				"property-name",
				"next-app-path"
			])
		});
		javaScriptRouteCandidateSchema = z.strictObject({
			path: z.string().startsWith("/"),
			mechanism: javaScriptRouteMechanismSchema,
			confidence: z.enum([
				"low",
				"medium",
				"high"
			]),
			derivation: z.enum([
				"literal",
				"joined",
				"inferred"
			]),
			location: javascriptSourceRangeSchema,
			segments: z.array(javaScriptRouteSegmentSchema)
		});
		javaScriptRouteWorkCapacitySchema = z.strictObject({
			kind: z.literal("route-work-or-facts"),
			limit_bytes: z.int().nonnegative(),
			accounted_fact_bytes: z.int().nonnegative(),
			accounted_work_bytes: z.int().nonnegative()
		});
		javaScriptRouteSourceFactsSchema = z.strictObject({
			candidates: z.array(javaScriptRouteCandidateSchema),
			unresolved: z.array(z.strictObject({
				mechanism: javaScriptRouteMechanismSchema,
				location: javascriptSourceRangeSchema,
				reason: z.string()
			})),
			capacity: z.discriminatedUnion("kind", [javaScriptRouteWorkCapacitySchema, z.strictObject({
				kind: z.literal("result-bytes"),
				limit_bytes: z.int().nonnegative(),
				preceding_work_capacity: javaScriptRouteWorkCapacitySchema.nullable()
			})]).nullable()
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRoutePaths.js
var packageIdentitySchema, nextAppSourceContextSchema, routePath, classifyNextAppRoutePath, nextScriptBasePath;
function init_javascriptRoutePaths() {
	return (init_javascriptRoutePaths = __esmMin((() => {
		init_digests();
		packageIdentitySchema = z.strictObject({
			path: z.string().min(1),
			sha256: digestSchema,
			container_sha256: digestSchema
		});
		nextAppSourceContextSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("app-directory"),
				directory: z.string().min(1),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("compiled-directory"),
				directory: z.string().min(1),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("outside-app-directory"),
				package: packageIdentitySchema
			}),
			z.strictObject({
				kind: z.literal("unknown"),
				reason: z.string(),
				package: packageIdentitySchema.nullable()
			})
		]);
		routePath = (value, options = {}) => {
			const end = options.navigation ? value.search(/[?#]/u) : -1;
			const path = end < 0 ? value : value.slice(0, end);
			if (!path || /[\u0000-\u0020\u007f\\]/u.test(path) || path.startsWith("//")) return;
			if (!path.startsWith("/") && !options.relative) return;
			if (/^[a-z][a-z0-9+.-]*:/iu.test(path)) return;
			return path.startsWith("/") ? path : `/${path}`;
		};
		classifyNextAppRoutePath = (raw, context) => {
			if (raw.includes("\\") || context.kind === "source-reference") return;
			let value = raw;
			if (context.kind === "script-url" || context.kind === "source-literal" && raw.includes("://")) {
				try {
					value = new URL(raw).pathname;
				} catch {
					return;
				}
			}
			let relative;
			let chunk = false;
			if (context.kind === "source-path") {
				if (context.source.kind === "outside-app-directory") return;
				if (context.source.kind === "app-directory" || context.source.kind === "compiled-directory") {
					const prefix = `${context.source.directory}/`;
					if (!value.startsWith(prefix)) return;
					relative = value.slice(prefix.length);
					chunk = context.source.kind === "compiled-directory";
				}
			} else if (context.kind === "script-url" || context.runtime === "next") {
				const boundary = "/_next/static/chunks/app/";
				const assetRoot = value.indexOf(boundary);
				const localChunk = ["static/chunks/app/", ".next/static/chunks/app/"].find((prefix) => value.startsWith(prefix));
				if (assetRoot >= 0) {
					relative = value.slice(assetRoot + boundary.length);
					chunk = true;
				} else if (context.kind === "source-literal" && localChunk !== undefined) {
					relative = value.slice(localChunk.length);
					chunk = true;
				} else if (context.kind === "source-literal") {
					const prefix = value.startsWith("src/app/") ? "src/app/" : "app/";
					if (value.startsWith(prefix)) relative = value.slice(prefix.length);
				}
			}
			if (relative === undefined) {
				if (/(?:^|\/)app\/(?:.*\/)?page(?:\.[cm]?[jt]sx?|-[^/?#]+\.js|)(?:[?#].*)?$/u.test(value)) return {
					kind: "unknown",
					reason: context.kind === "source-path" && context.source.kind === "unknown" ? context.source.reason : "The page-shaped path has no established Next App Router root or runtime context."
				};
				return;
			}
			const match = /^(?:(.*?)\/)?page(?:-([^/?#]+)\.js|\.(?:[cm]?jsx?|tsx?)|)(?:[?#].*)?$/u.exec(relative);
			if (match === null || match[2] !== undefined && !chunk) return;
			const sourceSegments = (match[1] ?? "").split("/");
			if (sourceSegments.some((segment) => segment.startsWith("_"))) return;
			const segments = [];
			for (const sourceSegment of sourceSegments) {
				const segment = sourceSegment.replace(/%5F/gu, "_");
				if (/^\([^)]*\)$/u.test(segment) || segment.startsWith("@")) continue;
				if (segment.startsWith("(")) return {
					kind: "unknown",
					reason: "An intercepted Next page route requires parent routing context unavailable from its filename."
				};
				if (segment.includes("/") || segment === "." || segment === "..") return;
				const optional = /^\[\[\.\.\.([^\]]+)\]\]$/u.exec(segment);
				const catchAll = /^\[\.\.\.([^\]]+)\]$/u.exec(segment);
				const parameter = /^\[([^\]]+)\]$/u.exec(segment);
				segments.push(optional ? `:${optional[1]}*` : catchAll ? `:${catchAll[1]}+` : parameter ? `:${parameter[1]}` : segment);
			}
			const path = routePath(`/${segments.filter(Boolean).join("/")}`);
			return path === undefined ? undefined : {
				kind: "known",
				path
			};
		};
		nextScriptBasePath = (source) => {
			let path = source;
			if (/^https?:\/\//iu.test(source)) {
				try {
					path = new URL(source).pathname;
				} catch {
					return;
				}
			} else if (!source.startsWith("/")) return;
			const at = path.indexOf("/_next/");
			return at < 0 ? undefined : path.slice(0, at);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRouteInventory.js
/** Join only owned syntax facts and source metadata; never fetch or reinterpret source text. */
function* buildJavaScriptRouteInventorySteps(inputs, byteBudget = JAVASCRIPT_STATIC_FACT_BYTES, captureOmissions = []) {
	const sources = [], occurrences = [], unknowns = [];
	const routes = new Map(), sourceIdsByRoute = new Map(), seenOccurrences = new Set(), seenGaps = new Set();
	const contexts = [];
	const headerBytes = jsonValueByteLength({
		inventory_id: `jsri:${"f".repeat(64)}`,
		source_manifest_sha256: "f".repeat(64),
		sources: [],
		routes: [],
		occurrences: [],
		unknowns: [],
		capacity: {
			limit_bytes: Number.MAX_SAFE_INTEGER,
			accounted_bytes: Number.MAX_SAFE_INTEGER
		},
		coverage: {
			scope: "provided-code-sources",
			source_parsing: "complete",
			candidate_enumeration: "complete",
			application_routes: "unknown"
		},
		statistics: Object.fromEntries([
			"sources_seen",
			"sources_retained",
			"route_patterns",
			"occurrences",
			"unanchored_literals_excluded"
		].map((key) => [key, Number.MAX_SAFE_INTEGER])),
		limitations: [...INVENTORY_LIMITATIONS]
	});
	if (!Number.isSafeInteger(byteBudget) || byteBudget < headerBytes) throw new RangeError(`Route inventory budget must fit its ${headerBytes}-byte envelope.`);
	let accounted = headerBytes, capacity = null, partial = false, unanchored = 0;
	const reserve = (value) => {
		if (capacity !== null) return false;
		const bytes = jsonValueByteLength(value, byteBudget - accounted) + 1;
		if (bytes > byteBudget - accounted) {
			capacity = {
				limit_bytes: byteBudget,
				accounted_bytes: accounted
			};
			partial = true;
			return false;
		}
		accounted += bytes;
		return true;
	};
	const retainGap = (body) => {
		const value = {
			id: routeGapId(body),
			...body
		};
		if (!seenGaps.has(value.id) && reserve(value)) {
			unknowns.push(value);
			seenGaps.add(value.id);
		}
	};
	const gap = (source, kind, reason, source_range = null) => retainGap({
		source_id: source.id,
		kind,
		source_range,
		reason
	});
	for (const { unit, count, reason } of captureOmissions) {
		yield;
		partial = true;
		retainGap({
			source_id: null,
			kind: "capture-omission",
			source_range: null,
			reason,
			capture_omission: {
				unit,
				count
			}
		});
	}
	const manifestIds = [];
	for (const input of inputs) {
		yield;
		const metadata = classifyNextAppRoutePath(input.url ?? input.path ?? "", input.url !== null ? { kind: "script-url" } : {
			kind: "source-path",
			source: input.next_app_context ?? {
				kind: "unknown",
				package: null,
				reason: "Next App Router source applicability was not measured."
			}
		});
		const nextContext = metadata === undefined ? undefined : input.next_app_context;
		const id = lookupId("jss", [
			input.key,
			input.path,
			input.url,
			input.sha256,
			input.container_sha256,
			...nextContext === undefined ? [] : [nextContext]
		]);
		manifestIds.push(id);
		const prefix = input.url === null ? undefined : nextScriptBasePath(input.url);
		const source = {
			id,
			key: input.key,
			path: input.path,
			url: input.url,
			sha256: input.sha256,
			container_sha256: input.container_sha256,
			status: input.status,
			...nextContext === undefined ? {} : { next_app_context: nextContext },
			reported_route_capacity: input.facts?.capacity ?? null,
			reason: input.reason,
			base_path: prefix ? {
				value: prefix,
				basis: "next-script-url",
				status: "inferred"
			} : null
		};
		if (!reserve(source)) continue;
		sources.push(source);
		const metadataPath = metadata?.kind === "known" ? metadata.path : undefined;
		contexts.push({
			input,
			source,
			metadataPath
		});
		if (metadata?.kind === "unknown") {
			partial = true;
			gap(source, "interpretation", metadata.reason);
		}
		if (input.status !== "complete" || input.facts === null) {
			partial = true;
			gap(source, "source-unavailable", input.reason ?? "Route syntax was not fully measured for this source.");
		}
		if (source.base_path !== null) gap(source, "inferred-base", "A Next script URL prefix is an inferred routing base; assetPrefix may differ from the deployed route base.");
		if (input.facts?.capacity !== null && input.facts?.capacity !== undefined) {
			partial = true;
			gap(source, "capacity", input.facts.capacity.kind === "result-bytes" ? `Route facts exceeded the ${input.facts.capacity.limit_bytes}-byte remaining serialized-result budget; additional candidates remain unknown.` : `Source route work/facts reached ${input.facts.capacity.limit_bytes} accounted bytes; additional candidates remain unknown.`);
		}
		for (const unknown of input.facts?.unresolved ?? []) {
			partial = true;
			gap(source, "interpretation", unknown.reason, unknown.location);
		}
	}
	const prefixPath = (path, source, applicationRelative) => {
		const base = source.base_path?.value;
		return base === undefined || !applicationRelative && (path === base || path.startsWith(`${base}/`)) ? path : path === "/" ? base : `${base}${path}`;
	};
	const applicationRoot = (path, source, applicationRelative) => {
		const base = source.base_path?.value;
		const start = !applicationRelative && base !== undefined && (path === base || path.startsWith(`${base}/`)) ? base.length + 1 : 1;
		const end = path.indexOf("/", start);
		return path.slice(start, end < 0 ? undefined : end);
	};
	const roots = new Set();
	for (const { input, source, metadataPath } of contexts) {
		yield;
		if (metadataPath !== undefined) {
			const root = applicationRoot(metadataPath, source, true);
			if (root) roots.add(root);
		}
		for (const candidate of input.facts?.candidates ?? []) if (candidate.mechanism !== "route-string-constant") {
			const root = applicationRoot(candidate.path, source, candidate.mechanism === "next-app-chunk");
			if (root) roots.add(root);
		}
	}
	const append = (source, candidate, origin) => {
		if (capacity !== null) return;
		const applicationRelative = candidate.mechanism === "next-app-chunk";
		const path = prefixPath(candidate.path, source, applicationRelative);
		if (candidate.mechanism === "route-string-constant" && !roots.has(applicationRoot(candidate.path, source, applicationRelative))) {
			unanchored++;
			return;
		}
		const route_id = routeId(path), inferredBase = path === candidate.path ? null : source.base_path.value;
		const identity = [
			source.id,
			path,
			candidate.mechanism,
			origin,
			candidate.location,
			candidate.segments
		];
		const id = lookupId("jso", identity);
		if (seenOccurrences.has(id)) return;
		const occurrence = {
			id,
			route_id,
			source_id: source.id,
			mechanism: candidate.mechanism,
			confidence: inferredBase === null ? candidate.confidence : "low",
			derivation: inferredBase === null ? candidate.derivation : "inferred",
			source_range: origin === "source-syntax" ? candidate.location : null,
			origin,
			unprefixed_path: candidate.path,
			inferred_base_path: inferredBase,
			segments: origin === "source-syntax" ? candidate.segments : []
		};
		let route = routes.get(path);
		if (route === undefined) {
			route = {
				id: route_id,
				path,
				...classify(path, [candidate.mechanism]),
				confidence: occurrence.confidence,
				mechanisms: [],
				occurrence_count: 0,
				source_count: 0,
				primary_occurrence_id: id
			};
			if (!reserve({
				...route,
				classification_basis: "router-configuration",
				confidence: "medium",
				mechanisms: javaScriptRouteMechanismSchema.options,
				occurrence_count: Number.MAX_SAFE_INTEGER,
				source_count: Number.MAX_SAFE_INTEGER
			})) return;
		}
		if (!reserve(occurrence)) return;
		if (!routes.has(path)) {
			routes.set(path, route);
			sourceIdsByRoute.set(route_id, new Set());
		}
		occurrences.push(occurrence);
		seenOccurrences.add(id);
		route.occurrence_count++;
		const routeSources = sourceIdsByRoute.get(route_id);
		routeSources.add(source.id);
		route.source_count = routeSources.size;
		if (!route.mechanisms.includes(candidate.mechanism)) {
			route.mechanisms.push(candidate.mechanism);
			Object.assign(route, classify(path, route.mechanisms));
		}
		if (ranks[occurrence.confidence] > ranks[route.confidence] || ranks[occurrence.confidence] === ranks[route.confidence] && id < route.primary_occurrence_id) {
			route.confidence = occurrence.confidence;
			route.primary_occurrence_id = id;
		}
	};
	for (const { input, source, metadataPath } of contexts) {
		yield;
		if (metadataPath !== undefined) append(source, {
			path: metadataPath,
			mechanism: "next-app-chunk",
			confidence: "medium",
			derivation: "joined",
			location: null,
			segments: []
		}, source.url === null ? "source-path" : "source-url");
		for (const candidate of input.facts?.candidates ?? []) {
			yield;
			append(source, candidate, "source-syntax");
			if (capacity !== null) break;
		}
	}
	sources.sort((a, b) => order(a.key, b.key) || order(a.id, b.id));
	occurrences.sort((a, b) => order(a.id, b.id));
	const items = [...routes.values()].sort((a, b) => order(a.path, b.path));
	for (const route of items) route.mechanisms.sort(order);
	unknowns.sort((a, b) => order(a.source_id ?? "", b.source_id ?? "") || order(a.kind, b.kind) || (a.source_range?.start.line ?? 0) - (b.source_range?.start.line ?? 0) || (a.source_range?.start.column ?? 0) - (b.source_range?.start.column ?? 0) || (a.source_range?.end.line ?? 0) - (b.source_range?.end.line ?? 0) || (a.source_range?.end.column ?? 0) - (b.source_range?.end.column ?? 0) || order(a.reason, b.reason));
	const source_manifest_sha256 = hash(manifestIds.sort(order));
	const result = {
		source_manifest_sha256,
		sources,
		routes: items,
		occurrences,
		unknowns,
		capacity,
		coverage: {
			scope: "provided-code-sources",
			source_parsing: sources.length === 0 ? "unknown" : sources.some((source) => source.status !== "complete") || capacity !== null ? "partial" : "complete",
			candidate_enumeration: partial ? "partial" : "complete",
			application_routes: "unknown"
		},
		statistics: {
			sources_seen: inputs.length,
			sources_retained: sources.length,
			route_patterns: items.length,
			occurrences: occurrences.length,
			unanchored_literals_excluded: unanchored
		},
		limitations: [...INVENTORY_LIMITATIONS]
	};
	return {
		inventory_id: `jsri:${hash(["javascript-routes-v1", result])}`,
		...result
	};
}
var sourceStatus, confidence, sourceShape, javaScriptRouteInventorySourceSchema, javaScriptRouteOccurrenceSchema, javaScriptInventoryRouteSchema, javaScriptRouteCaptureOmissionSchema, javaScriptRouteGapSchema, capacitySchema, inventoryShape, javaScriptRouteInventorySchema, hash, lookupId, routeGapId, routeId, order, ranks, classify, INVENTORY_LIMITATIONS;
function init_javascriptRouteInventory() {
	return (init_javascriptRouteInventory = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_canonicalDigest();
		init_jsonValueByteLength();
		init_digests();
		init_javascriptAnalysisResourceControls();
		init_javascriptRouteFacts();
		init_javascriptRoutePaths();
		sourceStatus = z.enum([
			"complete",
			"partial",
			"unavailable",
			"unknown"
		]);
		confidence = javaScriptRouteCandidateSchema.shape.confidence;
		sourceShape = {
			id: z.string().regex(/^jss:[a-f0-9]{32}$/u),
			key: z.string(),
			path: z.string().nullable(),
			url: z.string().nullable(),
			sha256: digestSchema.nullable(),
			container_sha256: digestSchema.nullable(),
			status: sourceStatus,
			reported_route_capacity: javaScriptRouteSourceFactsSchema.shape.capacity,
			reason: z.string().nullable(),
			next_app_context: nextAppSourceContextSchema.exactOptional(),
			base_path: z.strictObject({
				value: z.string(),
				basis: z.literal("next-script-url"),
				status: z.literal("inferred")
			}).nullable()
		};
		javaScriptRouteInventorySourceSchema = z.strictObject(sourceShape);
		javaScriptRouteOccurrenceSchema = z.strictObject({
			id: z.string().regex(/^jso:[a-f0-9]{32}$/u),
			route_id: z.string().regex(/^jsr:[a-f0-9]{32}$/u),
			source_id: sourceShape.id,
			mechanism: javaScriptRouteMechanismSchema,
			confidence,
			derivation: javaScriptRouteCandidateSchema.shape.derivation,
			source_range: javascriptSourceRangeSchema.nullable(),
			origin: z.enum([
				"source-syntax",
				"source-path",
				"source-url"
			]),
			unprefixed_path: z.string(),
			inferred_base_path: z.string().nullable(),
			segments: z.array(javaScriptRouteSegmentSchema)
		});
		javaScriptInventoryRouteSchema = z.strictObject({
			id: z.string().regex(/^jsr:[a-f0-9]{32}$/u),
			path: z.string().startsWith("/"),
			classification: z.enum([
				"page",
				"system",
				"unknown"
			]),
			classification_basis: z.enum([
				"next-app-page",
				"router-configuration",
				"path-name-heuristic",
				"unknown"
			]),
			confidence,
			mechanisms: z.array(javaScriptRouteMechanismSchema),
			occurrence_count: z.int().nonnegative(),
			source_count: z.int().nonnegative(),
			primary_occurrence_id: javaScriptRouteOccurrenceSchema.shape.id
		});
		javaScriptRouteCaptureOmissionSchema = z.strictObject({
			unit: z.enum(["script-records", "script-sources"]),
			count: z.int().nonnegative().nullable()
		});
		javaScriptRouteGapSchema = z.strictObject({
			id: z.string().regex(/^jsg:[a-f0-9]{32}$/u),
			source_id: sourceShape.id.nullable(),
			kind: z.enum([
				"source-unavailable",
				"interpretation",
				"inferred-base",
				"capacity",
				"capture-omission"
			]),
			source_range: javascriptSourceRangeSchema.nullable(),
			reason: z.string(),
			capture_omission: javaScriptRouteCaptureOmissionSchema.exactOptional()
		});
		capacitySchema = z.strictObject({
			limit_bytes: z.int().nonnegative(),
			accounted_bytes: z.int().nonnegative()
		});
		inventoryShape = z.strictObject({
			inventory_id: z.string().regex(/^jsri:[a-f0-9]{64}$/u),
			source_manifest_sha256: digestSchema,
			sources: z.array(javaScriptRouteInventorySourceSchema),
			routes: z.array(javaScriptInventoryRouteSchema),
			occurrences: z.array(javaScriptRouteOccurrenceSchema),
			unknowns: z.array(javaScriptRouteGapSchema),
			coverage: z.strictObject({
				scope: z.literal("provided-code-sources"),
				source_parsing: z.enum([
					"complete",
					"partial",
					"unknown"
				]),
				candidate_enumeration: z.enum(["complete", "partial"]),
				application_routes: z.literal("unknown")
			}),
			statistics: z.strictObject({
				sources_seen: z.int().nonnegative(),
				sources_retained: z.int().nonnegative(),
				route_patterns: z.int().nonnegative(),
				occurrences: z.int().nonnegative(),
				unanchored_literals_excluded: z.int().nonnegative()
			}),
			capacity: capacitySchema.nullable(),
			limitations: z.array(z.string())
		});
		javaScriptRouteInventorySchema = inventoryShape.superRefine((value, context) => {
			const sources = new Set(), routes = new Map(), occurrences = new Map();
			for (const source of value.sources) {
				if (sources.has(source.id) || source.id !== lookupId("jss", [
					source.key,
					source.path,
					source.url,
					source.sha256,
					source.container_sha256,
					...source.next_app_context === undefined ? [] : [source.next_app_context]
				])) context.addIssue({
					code: "custom",
					path: ["sources"],
					message: "Route source identity must be unique and bind source/content/applicability fields"
				});
				sources.add(source.id);
			}
			for (const route of value.routes) {
				if (routes.has(route.id) || route.id !== routeId(route.path)) context.addIssue({
					code: "custom",
					path: ["routes"],
					message: "Route identity must uniquely bind its exact pattern"
				});
				routes.set(route.id, route);
			}
			const byRoute = new Map();
			for (const occurrence of value.occurrences) {
				if (occurrences.has(occurrence.id) || !sources.has(occurrence.source_id) || !routes.has(occurrence.route_id) || occurrence.id !== lookupId("jso", [
					occurrence.source_id,
					routes.get(occurrence.route_id)?.path ?? null,
					occurrence.mechanism,
					occurrence.origin,
					occurrence.source_range,
					occurrence.segments
				])) context.addIssue({
					code: "custom",
					path: ["occurrences"],
					message: "Route occurrences require unique identities and retained source/route owners"
				});
				occurrences.set(occurrence.id, occurrence);
				let rows = byRoute.get(occurrence.route_id);
				if (rows === undefined) {
					rows = [];
					byRoute.set(occurrence.route_id, rows);
				}
				rows.push(occurrence);
			}
			for (const route of value.routes) {
				const rows = byRoute.get(route.id) ?? [], primary = occurrences.get(route.primary_occurrence_id);
				if (rows.length !== route.occurrence_count || new Set(rows.map((row) => row.source_id)).size !== route.source_count || primary?.route_id !== route.id || rows.some((row) => !route.mechanisms.includes(row.mechanism)) || new Set(rows.map((row) => row.mechanism)).size !== new Set(route.mechanisms).size || new Set(route.mechanisms).size !== route.mechanisms.length || route.confidence !== primary?.confidence || rows.some((row) => ranks[row.confidence] > ranks[route.confidence]) || route.classification !== classify(route.path, route.mechanisms).classification || route.classification_basis !== classify(route.path, route.mechanisms).classification_basis) context.addIssue({
					code: "custom",
					path: ["routes"],
					message: "Route aggregates and primary provenance must match their occurrences"
				});
			}
			if (value.statistics.sources_retained !== value.sources.length || value.statistics.route_patterns !== value.routes.length || value.statistics.occurrences !== value.occurrences.length) context.addIssue({
				code: "custom",
				path: ["statistics"],
				message: "Route statistics must count retained facts"
			});
			const gaps = new Set();
			for (const gap of value.unknowns) {
				if (gaps.has(gap.id) || gap.id !== routeGapId(gap) || gap.source_id !== null && !sources.has(gap.source_id)) context.addIssue({
					code: "custom",
					path: ["unknowns"],
					message: "An attributed route gap requires a unique content-bound identity and retained source"
				});
				if (gap.kind === "capture-omission" !== (gap.capture_omission !== undefined) || gap.kind === "capture-omission" && (gap.source_id !== null || gap.source_range !== null)) context.addIssue({
					code: "custom",
					path: ["unknowns"],
					message: "Capture omissions keep capture-level counts and have no invented source or range."
				});
				gaps.add(gap.id);
			}
			const { inventory_id, ...body } = value;
			if (inventory_id !== `jsri:${hash(["javascript-routes-v1", body])}`) context.addIssue({
				code: "custom",
				path: ["inventory_id"],
				message: "Inventory identity must bind all retained facts and coverage."
			});
		});
		hash = (value) => digestCanonicalValue(value, "JavaScript route fact");
		lookupId = (prefix, value) => `${prefix}:${hash(value).slice(0, 32)}`;
		routeGapId = (gap) => lookupId("jsg", [
			gap.source_id,
			gap.kind,
			gap.source_range,
			gap.reason,
			...gap.capture_omission === undefined ? [] : [gap.capture_omission]
		]);
		routeId = (path) => lookupId("jsr", path);
		order = (a, b) => a < b ? -1 : a > b ? 1 : 0;
		ranks = {
			low: 0,
			medium: 1,
			high: 2
		};
		classify = (path, mechanisms) => {
			if (/(?:^|\/)(?:auth|login|logout|signin|signup|billing|callback|callbacks|oauth|sso)(?:\/|$)/iu.test(path)) return {
				classification: "system",
				classification_basis: "path-name-heuristic"
			};
			if (mechanisms.includes("next-app-chunk")) return {
				classification: "page",
				classification_basis: "next-app-page"
			};
			if (mechanisms.includes("nested-route-object") || mechanisms.includes("typed-route-tree")) return {
				classification: "page",
				classification_basis: "router-configuration"
			};
			return {
				classification: "unknown",
				classification_basis: "unknown"
			};
		};
		INVENTORY_LIMITATIONS = [
			"Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.",
			"Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.",
			"System classification is a path-name heuristic. Asset URL prefixes can differ from routing bases; inferred prefixes retain the original unprefixed path.",
			"Unbound path strings require a top-level segment supported by structural routes or navigation candidates. Unknown or missing source facts do not establish route absence."
		];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSourceMapPaths.js
var javascriptSourceMapReferenceSchema, resolveJavaScriptSourceMapReferences, resolveJavaScriptSourceMapUrl, sourceMapReference, resolveJavaScriptSourceMapPath, unusableHost, carriesUsableHost, windowsFileUrl, decodedUrlPath;
function init_javascriptSourceMapPaths() {
	return (init_javascriptSourceMapPaths = __esmMin((() => {
		javascriptSourceMapReferenceSchema = z.strictObject({
			source_name: z.string(),
			source_root: z.string().nullable(),
			map_path: z.string().min(1),
			resolution: z.discriminatedUnion("kind", [z.strictObject({
				kind: z.enum(["artifact-relative", "suffix"]),
				path: z.string().min(1)
			}), z.strictObject({
				kind: z.literal("unresolved"),
				reason: z.string().min(1)
			})])
		});
		resolveJavaScriptSourceMapReferences = (sourceNames, sourceRoot, mapPath) => {
			return sourceNames.map((sourceName) => {
				if (sourceName === null) return null;
				return {
					source_name: sourceName,
					source_root: sourceRoot,
					map_path: mapPath,
					resolution: resolveJavaScriptSourceMapPath(sourceMapReference(sourceName, sourceRoot), mapPath)
				};
			});
		};
		resolveJavaScriptSourceMapUrl = (source, sourceRoot, mapUrl) => {
			if (source === null) return null;
			return URL.parse(sourceMapReference(source, sourceRoot), mapUrl)?.href ?? null;
		};
		sourceMapReference = (source, sourceRoot) => {
			if (sourceRoot == null) return source;
			return `${sourceRoot}${sourceRoot.endsWith("/") ? "" : "/"}${source}`;
		};
		resolveJavaScriptSourceMapPath = (source, mapPath) => {
			const portable = source.replaceAll("\\", "/");
			const windowsPath = /^[a-z]:\//iu.test(portable) || source.startsWith("\\\\");
			const anchor = `/${"source/".repeat(portable.split("/").length + 1)}`;
			const directory = posix.join(anchor, posix.dirname(mapPath));
			const base = pathToFileURL(`${directory}/`, { windows: false });
			const absolute = windowsPath ? windowsFileUrl(source) : URL.parse(source);
			const resolved = windowsPath ? absolute : URL.parse(source, base);
			if (resolved === null) return {
				kind: "unresolved",
				reason: "Source reference is not a valid URL or filesystem path."
			};
			if (!resolved.pathname.startsWith("/")) return {
				kind: "unresolved",
				reason: "Source reference uses a non-hierarchical URL without a file pathname."
			};
			if (resolved.pathname.endsWith("/")) return {
				kind: "unresolved",
				reason: "Source reference names a directory rather than a file."
			};
			const declaredPath = windowsPath ? absolute?.pathname ?? "" : URL.parse(source, "file:///")?.pathname ?? "";
			if (/%(?:2f|5c)/iu.test(declaredPath)) return {
				kind: "unresolved",
				reason: "Source reference contains an encoded path separator."
			};
			const relative = absolute === null ? !portable.startsWith("/") : absolute.href !== resolved.href;
			const path = decodedUrlPath(resolved);
			if (path === null) return {
				kind: "unresolved",
				reason: "Source reference has malformed URL encoding or an invalid file URL."
			};
			const value = relative ? posix.relative(anchor, path) : path.replace(/^\/+/, "");
			if (value === "" || value === ".." || value.startsWith("../")) return {
				kind: "unresolved",
				reason: "Source reference resolves outside the inventoried artifact."
			};
			return {
				path: value,
				kind: relative ? "artifact-relative" : "suffix"
			};
		};
		unusableHost = /[\0\t\n\r #/:<>?@[\\\]^|%]/u;
		carriesUsableHost = (host) => !unusableHost.test(host) && domainToASCII(host) !== "";
		windowsFileUrl = (path) => {
			if (path.startsWith("\\\\") && !carriesUsableHost(path.slice(2).split("\\")[0] ?? "")) return null;
			try {
				return pathToFileURL(path, { windows: true });
			} catch (cause) {
				if (cause instanceof TypeError) return null;
				throw cause;
			}
		};
		decodedUrlPath = (url) => {
			try {
				if (url.protocol === "file:") {
					const windows = url.hostname !== "" && url.hostname !== "localhost";
					const path = fileURLToPath(url, { windows });
					return windows ? path.replaceAll("\\", "/") : path;
				}
				return `${url.host}${decodeURIComponent(url.pathname)}`;
			} catch (cause) {
				if (cause instanceof URIError || cause instanceof TypeError) return null;
				throw cause;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticValueTypes.js
var javaScriptSemanticResourceLimitSchema;
function init_javascriptSemanticValueTypes() {
	return (init_javascriptSemanticValueTypes = __esmMin((() => {
		javaScriptSemanticResourceLimitSchema = z.enum([
			"primitive-candidates",
			"primitive-bytes",
			"expression-depth",
			"getter-expansion",
			"alias-selections"
		]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptStaticCoverage.js
var javaScriptStaticCoverageSchema, javaScriptStaticParseStatus, unexaminedJavaScriptStaticCoverage;
function init_javascriptStaticCoverage() {
	return (init_javascriptStaticCoverage = __esmMin((() => {
		init_javascriptSemanticValueTypes();
		javaScriptStaticCoverageSchema = z.strictObject({
			syntax: z.discriminatedUnion("status", [
				z.strictObject({
					status: z.literal("complete"),
					error_count: z.literal(0)
				}),
				z.strictObject({
					status: z.literal("recovered"),
					error_count: z.int().positive()
				}),
				z.strictObject({
					status: z.literal("failed"),
					error_count: z.null()
				}),
				z.strictObject({
					status: z.literal("not-examined"),
					error_count: z.null()
				})
			]),
			semantics: z.strictObject({
				unknown_findings: z.int().nonnegative().nullable(),
				uncertainty: z.array(z.enum([
					"dynamic-findings",
					"returned-reference-widening",
					"type-only-module-side-effect"
				]))
			}),
			examination: z.strictObject({
				status: z.enum([
					"complete",
					"limited",
					"not-examined"
				]),
				semantic_resource_limits: z.array(javaScriptSemanticResourceLimitSchema),
				electron_call_paths_limited: z.boolean()
			}),
			applicability: z.strictObject({ electron: z.enum(["observed", "unknown"]) }),
			unexamined_reason: z.string().min(1).exactOptional()
		});
		javaScriptStaticParseStatus = (coverage) => coverage.syntax.status === "failed" || coverage.syntax.status === "not-examined" ? "failed" : coverage.syntax.status === "recovered" || (coverage.semantics.unknown_findings ?? 0) > 0 || coverage.examination.semantic_resource_limits.includes("alias-selections") ? "partial" : "complete";
		unexaminedJavaScriptStaticCoverage = (reason) => ({
			syntax: {
				status: "not-examined",
				error_count: null
			},
			semantics: {
				unknown_findings: null,
				uncertainty: []
			},
			examination: {
				status: "not-examined",
				semantic_resource_limits: [],
				electron_call_paths_limited: false
			},
			applicability: { electron: "unknown" },
			unexamined_reason: reason
		});
	})))();
}

//#endregion
//#region dist/domain/pngHeader.js
var PNG_SIGNATURE, IHDR_TYPE, readPngHeaderDimensions;
function init_pngHeader() {
	return (init_pngHeader = __esmMin((() => {
		PNG_SIGNATURE = Buffer.from([
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		]);
		IHDR_TYPE = Buffer.from("IHDR");
		readPngHeaderDimensions = (bytes) => {
			if (bytes.byteLength < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.readUInt32BE(8) !== 13 || !bytes.subarray(12, 16).equals(IHDR_TYPE) || crc32(bytes.subarray(12, 29)) !== bytes.readUInt32BE(29)) return undefined;
			const width = bytes.readUInt32BE(16);
			const height = bytes.readUInt32BE(20);
			return width === 0 || height === 0 || width > 2147483647 || height > 2147483647 ? undefined : {
				width,
				height
			};
		};
	})))();
}

//#endregion
export { init_javascriptAnalysisResourceControls as A, javascriptSourceRangeSchema as B, JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS as C, JAVASCRIPT_SEMANTIC_ITEM_MAXIMUM as D, JAVASCRIPT_PARENT_RESULT_BUDGET_REMEDIATION as E, javaScriptWorkerHeapRemediation as F, compareJavaScriptSourcePoints as I, init_javascriptSourceCoordinates as L, javaScriptAnalysisResourceControlsSchema as M, javaScriptSemanticCeilingCoverage as N, JAVASCRIPT_STATIC_FACT_BYTES as O, javaScriptWorkerHeapExhaustionRecovery as P, javascriptSourceRangeContains as R, javaScriptRouteSourceFactsSchema as S, JAVASCRIPT_PARENT_HEAP_NODE_OPTIONS as T, javaScriptRouteInventorySchema as _, unexaminedJavaScriptStaticCoverage as a, init_javascriptRouteFacts as b, init_javascriptSourceMapPaths as c, resolveJavaScriptSourceMapUrl as d, buildJavaScriptRouteInventorySteps as f, javaScriptRouteGapSchema as g, javaScriptRouteCaptureOmissionSchema as h, javaScriptStaticCoverageSchema as i, javaScriptAnalysisCoverageLimits as j, JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM as k, javascriptSourceMapReferenceSchema as l, javaScriptInventoryRouteSchema as m, readPngHeaderDimensions as n, init_javascriptSemanticValueTypes as o, init_javascriptRouteInventory as p, init_javascriptStaticCoverage as r, javaScriptSemanticResourceLimitSchema as s, init_pngHeader as t, resolveJavaScriptSourceMapReferences as u, javaScriptRouteInventorySourceSchema as v, JAVASCRIPT_PARENT_CHECKPOINT_HEAP_REMEDIATION as w, javaScriptRouteMechanismSchema as x, javaScriptRouteOccurrenceSchema as y, javascriptSourceRangeKey as z };