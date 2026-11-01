import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { browserAllowedOriginsSchema, browserEndpointSchema, classifyBrowserCompleteness, compareUnicodeCodePoints, createJavaScriptApplicationEdge, createJavaScriptApplicationGraph, createJavaScriptApplicationNode, digestCanonicalValue, electronActiveObservationResultSchema, electronPageInspectionSchema, init_artifactIdentity, init_browserCompleteness, init_browserObservation, init_browserObservationSchemas, init_canonicalDigest, init_canonicalOrdering, init_electronActiveObservation, init_electronObservation, init_evidenceValidation, init_inputIssueProjection, init_javascriptApplicationAnalysis, init_javascriptApplicationGraph, init_javascriptRuntimeObservation, init_localPath, init_unicodeCodePointOrder, isPathWithinRoot, javascriptApplicationAnalysisResultSchema, javascriptRuntimeKindSchema, javascriptRuntimeObservationSchema, logicalPathEscapesRoot, mergeJavaScriptApplicationNodes, normalizeJoinedLogicalPath, projectInputIssues, recordedBrowserObservationEndpointSchema, safeParseEvidence, uniqueSorted, webPageInspectionSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_javascriptRuntimeReconciliationSchemas, javascriptRuntimeReconciliationResultSchema } from "./javascriptRuntimeReconciliationSchemas-D0EUQEj4.js";
import { z } from "zod";
import { isAbsolute, posix, win32 } from "node:path";

//#region dist/domain/javascript/javascriptRuntimeStaticCandidates.js
var collectStaticRuntimeCandidates, mappedRuntimePaths, createStaticRuntimeScope, staticNodeRuntimeScope, candidatesForLayer, candidateCategory, isStaticSourceModule, indexStaticPaths, nodePaths, hasOwnedArtifactPath, ownedApplicationPath, isRawApplicationFileObservation, usesApplicationFileDeclaration, nativeDeclarationPaths, nativeDeclarationSource, candidateDigests, pathBelowRoot, absoluteFilePathStyle, OUTSIDE_MAPPING, translateRuntimeLocation, pathBelowUrlPrefix, decodeUrlPathSegments, exercisedArtifactPrefixes, normalizeArtifactPrefix, pathWithinPrefix, safeArtifactPath, relativeLogicalPath, uniqueMappedPaths;
function init_javascriptRuntimeStaticCandidates() {
	return (init_javascriptRuntimeStaticCandidates = __esmMin((() => {
		init_artifactIdentity();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		collectStaticRuntimeCandidates = (layers) => layers.flatMap((layer) => candidatesForLayer(layer)).sort((left, right) => compareUnicodeCodePoints(left.layer.layerId, right.layer.layerId) || compareUnicodeCodePoints(left.node.node_id, right.node.node_id));
		mappedRuntimePaths = (layer, entity) => {
			const paths = [];
			const fileStyle = entity.location.kind === "file" ? absoluteFilePathStyle(entity.location.value) : null;
			if (entity.location.kind === "file" && layer.result.format === "directory") {
				const path = pathBelowRoot(layer.result.input_path, entity.location.value);
				if (path !== null) paths.push({
					path,
					fileStyle,
					nativeRelativePath: path,
					artifactPrefix: "",
					basis: "artifact-path"
				});
			}
			for (const mapping of layer.runtimeMappings) {
				const translation = translateRuntimeLocation(mapping, entity.location);
				if (translation.kind !== "translated") continue;
				const suffix = translation.suffix;
				const path = safeArtifactPath(mapping.artifact_prefix, suffix);
				if (path === null) continue;
				paths.push({
					path,
					fileStyle,
					nativeRelativePath: mapping.kind === "file-root" ? suffix : null,
					artifactPrefix: normalizeArtifactPrefix(mapping.artifact_prefix),
					basis: mapping.kind === "file-root" ? "operator-file-mapping" : "operator-url-mapping"
				});
			}
			return uniqueMappedPaths(paths);
		};
		createStaticRuntimeScope = (layer, entities) => ({
			...exercisedArtifactPrefixes(layer, entities),
			pathsByNodeId: indexStaticPaths(layer.graph)
		});
		staticNodeRuntimeScope = (node, scope) => {
			const paths = scope.pathsByNodeId.get(node.node_id) ?? [];
			const beneath = (prefixes) => paths.some((path) => prefixes.some((prefix) => pathWithinPrefix(path, prefix)));
			if (beneath(scope.untranslatedArtifactPrefixes)) return "uncertain";
			return beneath(scope.artifactPrefixes) ? "within" : "outside";
		};
		candidatesForLayer = (layer) => {
			const graph = layer.graph;
			const pathsByNodeId = indexStaticPaths(graph);
			return graph.nodes.flatMap((node) => {
				const category = candidateCategory(node);
				if (category === null) return [];
				return [{
					layer,
					node,
					category,
					paths: pathsByNodeId.get(node.node_id) ?? [],
					nativeDeclarationPaths: nativeDeclarationPaths(node),
					digests: candidateDigests(node)
				}];
			});
		};
		candidateCategory = (node) => {
			if (node.kind === "electron-renderer") return "renderer";
			if (node.kind === "javascript-asset" || node.kind === "javascript-module" && !isStaticSourceModule(node)) return "javascript";
			if (node.kind === "worker") return "worker";
			if (node.kind === "service-worker") return "service-worker";
			return null;
		};
		isStaticSourceModule = (node) => node.observations.some(({ properties }) => properties.semantic_role === "source-module");
		indexStaticPaths = (graph) => {
			const nodes = new Map(graph.nodes.map((candidate) => [candidate.node_id, candidate]));
			const relatedBySource = new Map();
			for (const edge of graph.edges) {
				if (edge.relation !== "maps_to") continue;
				const target = nodes.get(edge.target_node_id);
				if (target === undefined) continue;
				const related = relatedBySource.get(edge.source_node_id);
				if (related === undefined) relatedBySource.set(edge.source_node_id, [target]);
				else related.push(target);
			}
			return new Map(graph.nodes.map((node) => [node.node_id, uniqueSorted([...nodePaths(node), ...usesApplicationFileDeclaration(node) ? [] : (relatedBySource.get(node.node_id) ?? []).flatMap(nodePaths)])]));
		};
		nodePaths = (node) => {
			const paths = [];
			if (node.identity.strategy === "canonical-path") paths.push(node.identity.path);
			for (const observation of node.observations) {
				const rawApplicationFile = node.kind === "electron-renderer" && isRawApplicationFileObservation(observation);
				if (typeof observation.properties.path === "string") paths.push(observation.properties.path);
				const applicationPath = ownedApplicationPath(observation);
				if (applicationPath !== undefined) paths.push(applicationPath);
				if (rawApplicationFile) continue;
				if (typeof observation.properties.resolved_path === "string") paths.push(observation.properties.resolved_path);
				const declaration = observation.properties.declared_path;
				if (!hasOwnedArtifactPath(node) && typeof declaration === "string" && !declaration.includes("\\")) paths.push(declaration);
				if (observation.evidence.location.available && observation.evidence.location.value.kind === "artifact-path") paths.push(observation.evidence.location.value.path);
			}
			return paths.map(relativeLogicalPath).filter((path) => path !== null && path !== "artifact-root");
		};
		hasOwnedArtifactPath = (node) => node.identity.strategy === "canonical-path" || node.observations.some(({ properties }) => typeof properties.path === "string") || node.observations.some((observation) => ownedApplicationPath(observation) !== undefined || !isRawApplicationFileObservation(observation) && typeof observation.properties.resolved_path === "string");
		ownedApplicationPath = (observation) => {
			const properties = observation.properties;
			if (properties.runtime_path_base !== "application-root") return undefined;
			if (properties.resolution_status === "resolved" && typeof properties.resolved_path === "string") return properties.resolved_path;
			if (properties.runtime_path_base_proven === true && (properties.resolution_status === "not-found" || properties.resolution_status === "unavailable") && typeof properties.candidate_path === "string") return properties.candidate_path;
			return undefined;
		};
		isRawApplicationFileObservation = (observation) => observation.properties.runtime_path_base === "application-root" ? ownedApplicationPath(observation) === undefined : observation.properties.resolution_context === "filesystem-expression" && typeof observation.properties.mechanism === "string" && observation.properties.mechanism.startsWith("call:") && observation.properties.mechanism.endsWith("loadFile");
		usesApplicationFileDeclaration = (node) => node.kind === "electron-renderer" && !hasOwnedArtifactPath(node) && node.observations.some(isRawApplicationFileObservation);
		nativeDeclarationPaths = (node) => {
			if (hasOwnedArtifactPath(node)) return {
				posix: [],
				windows: []
			};
			const declarations = node.observations.flatMap((observation) => {
				const { properties } = observation;
				return properties.resolution_context === "filesystem-expression" && typeof properties.declared_path === "string" && (isRawApplicationFileObservation(observation) || properties.declared_path.includes("\\")) ? [{
					path: properties.declared_path,
					sourcePath: nativeDeclarationSource(observation)
				}] : [];
			});
			const normalized = (windows) => {
				const values = declarations.flatMap(({ path, sourcePath }) => {
					if (windows && (win32.isAbsolute(path) || /^[a-z]:/iu.test(path))) return [];
					const normalizedPath = relativeLogicalPath(windows ? path.replaceAll("\\", "/") : path);
					return normalizedPath === null ? [] : [{
						path: normalizedPath,
						sourcePath
					}];
				});
				return [...new Map(values.map((value) => [JSON.stringify(value), value])).values()].sort((left, right) => compareUnicodeCodePoints(left.path, right.path) || compareUnicodeCodePoints(left.sourcePath ?? "", right.sourcePath ?? ""));
			};
			return {
				posix: normalized(false),
				windows: normalized(true)
			};
		};
		nativeDeclarationSource = (observation) => {
			const location = observation.evidence.location;
			if (!location.available) return null;
			const source = location.value.kind === "source-range" ? location.value.source : location.value.kind === "artifact-path" ? location.value.path : null;
			return source === null || source === "artifact-root" ? null : relativeLogicalPath(source);
		};
		candidateDigests = (node) => {
			const values = [];
			if (node.kind === "javascript-asset" && node.identity.strategy === "content-digest") values.push({
				sha256: node.identity.sha256,
				basis: "content-sha256"
			});
			if (node.kind === "javascript-module") for (const observation of node.observations) {
				const digest = observation.properties.source_sha256;
				if (typeof digest === "string" && /^[a-f0-9]{64}$/u.test(digest)) values.push({
					sha256: digest,
					basis: "module-source-sha256"
				});
			}
			return [...new Map(values.map((value) => [`${value.basis}:${value.sha256}`, value])).values()];
		};
		pathBelowRoot = (root, value) => {
			const rootStyle = absoluteFilePathStyle(root);
			if (rootStyle === null || rootStyle !== absoluteFilePathStyle(value)) return null;
			const remainder = rootStyle === "windows" ? win32.relative(root, value) : posix.relative(root, value);
			const portableRemainder = rootStyle === "windows" ? remainder.replaceAll("\\", "/") : remainder;
			if (remainder === "" || rootStyle === "windows" && win32.isAbsolute(remainder) || portableRemainder === ".." || portableRemainder.startsWith("../")) return null;
			return relativeLogicalPath(portableRemainder);
		};
		absoluteFilePathStyle = (path) => {
			if (/^[a-z]:[\\/]/iu.test(path) || /^(?:\\\\|\/\/)[^\\/]+[\\/][^\\/]+(?:[\\/]|$)/u.test(path)) return "windows";
			return path.startsWith("/") ? "posix" : null;
		};
		OUTSIDE_MAPPING = { kind: "outside" };
		translateRuntimeLocation = (mapping, location) => {
			if (mapping.kind === "url-prefix") return location.kind === "url" ? pathBelowUrlPrefix(mapping.prefix, location.value) : OUTSIDE_MAPPING;
			const suffix = location.kind === "file" ? pathBelowRoot(mapping.root, location.value) : null;
			return suffix === null ? OUTSIDE_MAPPING : {
				kind: "translated",
				suffix
			};
		};
		pathBelowUrlPrefix = (prefix, value) => {
			const base = URL.parse(prefix);
			const candidate = URL.parse(value);
			if (base === null || candidate === null || base.origin !== candidate.origin || !candidate.pathname.startsWith(base.pathname)) return OUTSIDE_MAPPING;
			const encoded = candidate.pathname.slice(base.pathname.length);
			if (encoded === "") return OUTSIDE_MAPPING;
			const decoded = decodeUrlPathSegments(encoded);
			const suffix = decoded === null ? null : relativeLogicalPath(decoded);
			return suffix === null ? { kind: "untranslatable" } : {
				kind: "translated",
				suffix
			};
		};
		decodeUrlPathSegments = (value) => {
			const segments = [];
			for (const segment of value.split("/")) {
				let decoded;
				try {
					decoded = decodeURIComponent(segment);
				} catch (cause) {
					void cause;
					return null;
				}
				if (decoded.includes("/")) return null;
				segments.push(decoded);
			}
			return segments.join("/");
		};
		exercisedArtifactPrefixes = (layer, entities) => {
			const prefixes = new Set();
			const untranslated = new Set();
			if (layer.result.format === "directory" && entities.some(({ location }) => location.kind === "file" && pathBelowRoot(layer.result.input_path, location.value) !== null)) prefixes.add("");
			for (const mapping of layer.runtimeMappings) {
				const prefix = normalizeArtifactPrefix(mapping.artifact_prefix);
				for (const entity of entities) {
					if (prefixes.has(prefix) && untranslated.has(prefix)) break;
					const translation = translateRuntimeLocation(mapping, entity.location);
					if (translation.kind === "translated") prefixes.add(prefix);
					else if (translation.kind === "untranslatable" && (entity.kind === "script" || entity.kind === "worker")) untranslated.add(prefix);
				}
			}
			return {
				artifactPrefixes: [...prefixes].sort(compareUnicodeCodePoints),
				untranslatedArtifactPrefixes: [...untranslated].sort(compareUnicodeCodePoints)
			};
		};
		normalizeArtifactPrefix = (prefix) => prefix === "" ? "" : normalizeJoinedLogicalPath(prefix);
		pathWithinPrefix = (path, prefix) => prefix === "" || path === prefix || path.startsWith(`${prefix}/`);
		safeArtifactPath = (prefix, suffix) => relativeLogicalPath(prefix === "" ? suffix : posix.join(prefix, suffix));
		relativeLogicalPath = (value) => {
			const normalized = normalizeJoinedLogicalPath(value);
			return normalized !== "" && normalized !== "." && !logicalPathEscapesRoot(normalized) ? normalized : null;
		};
		uniqueMappedPaths = (values) => [...new Map(values.map((value) => [JSON.stringify([
			value.basis,
			value.path,
			value.fileStyle,
			value.nativeRelativePath,
			value.artifactPrefix
		]), value])).values()].sort((left, right) => compareUnicodeCodePoints(left.path, right.path) || compareUnicodeCodePoints(left.basis, right.basis) || compareUnicodeCodePoints(left.nativeRelativePath ?? "", right.nativeRelativePath ?? "") || compareUnicodeCodePoints(left.artifactPrefix, right.artifactPrefix));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeLoadState.js
var classifyStaticLoadStates, classifyLayer, residentNodes, append, isLoadStateNode, state;
function init_javascriptRuntimeLoadState() {
	return (init_javascriptRuntimeLoadState = __esmMin((() => {
		init_canonicalOrdering();
		init_javascriptRuntimeStaticCandidates();
		classifyStaticLoadStates = (layers, runtimeEntities, matches, options) => {
			const states = [];
			for (const layer of layers) {
				const projection = classifyLayer(layer, runtimeEntities, matches, { reconciliationComplete: options.reconciliationComplete });
				states.push(...projection.states);
			}
			return {
				states,
				omittedStates: 0
			};
		};
		classifyLayer = (layer, runtimeEntities, matches, options) => {
			const nodes = layer.graph.nodes.filter(isLoadStateNode);
			const direct = new Map();
			const ambiguous = new Set();
			const incomplete = new Set();
			for (const match of matches) if (match.status === "matched" && match.static_layer_id === layer.layerId && match.static_node_id !== null) append(direct, match.static_node_id, match.runtime_node_id);
			else if (match.status === "ambiguous" || match.status === "unknown") {
				const uncertain = match.status === "ambiguous" ? ambiguous : incomplete;
				for (const candidate of match.candidate_static_nodes) if (candidate.static_layer_id === layer.layerId) uncertain.add(candidate.static_node_id);
			}
			const resident = residentNodes(layer, new Set(direct.keys()));
			const runtimeScope = createStaticRuntimeScope(layer, runtimeEntities);
			const scopedEntities = runtimeEntities.filter((entity) => mappedRuntimePaths(layer, entity).length > 0);
			const layerComplete = options.reconciliationComplete && layer.graph.coverage.status === "complete" && scopedEntities.length > 0 && scopedEntities.every(({ capture }) => capture.codeInventoryCompleteWithinScope);
			const states = nodes.map((node) => {
				const runtimeNodeIds = uniqueSorted(direct.get(node.node_id) ?? []);
				if (runtimeNodeIds.length > 0) return state(layer, node, {
					status: "loaded",
					runtimeNodeIds,
					reason: "runtime-script-correspondence"
				});
				if (resident.has(node.node_id)) return state(layer, node, {
					status: "resident-in-loaded-asset",
					runtimeNodeIds: [],
					reason: "containing-asset-was-loaded"
				});
				if (incomplete.has(node.node_id) || ambiguous.has(node.node_id)) return state(layer, node, {
					status: "unknown",
					runtimeNodeIds: [],
					reason: incomplete.has(node.node_id) ? "static-or-runtime-coverage-incomplete" : "ambiguous-runtime-candidate"
				});
				const membership = staticNodeRuntimeScope(node, runtimeScope);
				if (layerComplete && membership === "within") return state(layer, node, {
					status: "not-observed-in-capture",
					runtimeNodeIds: [],
					reason: "not-observed-in-bounded-capture"
				});
				return state(layer, node, {
					status: "unknown",
					runtimeNodeIds: [],
					reason: membership === "outside" ? "layer-outside-runtime-scope" : "static-or-runtime-coverage-incomplete"
				});
			});
			return { states };
		};
		residentNodes = (layer, directlyLoaded) => {
			const nodeKinds = new Map(layer.graph.nodes.map(({ node_id: id, kind }) => [id, kind]));
			const children = new Map();
			for (const edge of layer.graph.edges) if (edge.relation === "contains") append(children, edge.source_node_id, edge.target_node_id);
			const pending = [...directlyLoaded].filter((nodeId) => nodeKinds.get(nodeId) === "javascript-asset");
			const resident = new Set();
			for (let index = 0; index < pending.length; index += 1) {
				const current = pending[index];
				if (current === undefined) break;
				for (const child of children.get(current) ?? []) {
					if (resident.has(child)) continue;
					resident.add(child);
					pending.push(child);
				}
			}
			return resident;
		};
		append = (values, key, value) => {
			const current = values.get(key);
			if (current === undefined) values.set(key, [value]);
			else current.push(value);
		};
		isLoadStateNode = (node) => node.kind === "javascript-asset" || node.kind === "javascript-chunk" || node.kind === "javascript-module";
		state = (layer, node, input) => ({
			static_layer_id: layer.layerId,
			static_node_id: node.node_id,
			kind: node.kind,
			status: input.status,
			runtime_node_ids: [...input.runtimeNodeIds],
			reason: input.reason
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationGraph.js
var buildReconciledApplicationGraph, boundGraphContent, preferredRootIds, graphCoverageFacts, graphCoverage, uniqueEdges;
function init_javascriptRuntimeReconciliationGraph() {
	return (init_javascriptRuntimeReconciliationGraph = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		buildReconciledApplicationGraph = (input) => {
			const merged = mergeJavaScriptApplicationNodes([...input.layers.flatMap(({ graph }) => graph.nodes), ...input.runtime.nodes]);
			const allEdges = uniqueEdges([
				...input.layers.flatMap(({ graph }) => graph.edges),
				...input.runtime.edges,
				...input.reconciliationEdges
			]);
			const bounded = boundGraphContent(input, merged, allEdges);
			const facts = graphCoverageFacts(input, bounded.omittedItems);
			const graph = createJavaScriptApplicationGraph({
				schema: "JavaScriptApplicationGraph",
				root_node_ids: bounded.rootNodeIds,
				nodes: bounded.nodes,
				edges: bounded.edges,
				coverage: graphCoverage(input, facts, bounded.nodes.length),
				limitations: uniqueSorted([
					...input.layers.flatMap(({ graph }) => graph.limitations),
					"Runtime presence is bounded to passive capture windows and does not prove feature execution.",
					"Cross-layer observed_as edges are inferences; digest equality proves byte identity only.",
					"Source-map relationships retain their original static authority and are not promoted into runtime matches.",
					...facts.inputStatus === "truncated" ? ["One or more source graphs or passive captures were incomplete or truncated."] : [],
					...facts.outputTruncated ? ["The reconciled graph omitted entities or classifications during projection."] : []
				])
			});
			return {
				graph,
				omittedGraphItems: bounded.omittedItems
			};
		};
		boundGraphContent = (input, nodes, edges) => {
			const allRoots = preferredRootIds(input);
			const rootNodeIds = allRoots;
			const sortedNodes = [...nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
			const retainedNodes = sortedNodes;
			const retainedIds = new Set(retainedNodes.map(({ node_id: id }) => id));
			const retainedEdges = [...edges].sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id)).filter(({ source_node_id: source, target_node_id: target }) => retainedIds.has(source) && retainedIds.has(target));
			return {
				rootNodeIds,
				nodes: retainedNodes,
				edges: retainedEdges,
				omittedItems: 0
			};
		};
		preferredRootIds = (input) => {
			const runtime = [...input.runtime.targetNodeByEvidenceId.values()].map(({ node_id: id }) => id);
			const application = input.layers.filter(({ role }) => role === "application").flatMap(({ graph }) => graph.root_node_ids);
			const supplemental = input.layers.filter(({ role }) => role !== "application").flatMap(({ graph }) => graph.root_node_ids);
			return [...new Set([
				...runtime,
				...application,
				...supplemental
			])];
		};
		graphCoverageFacts = (input, omittedNodeObservations) => {
			const projectionOmissions = input.runtime.omittedEntities + input.omittedReconciliationItems + omittedNodeObservations;
			const captureTruncated = input.captures.some(({ inspection }) => inspection.completeness.conditions.includes("truncated"));
			const captureHasUnknownOmissions = input.captures.some(({ inspection }) => inspection.completeness.unavailable_sections.length > 0);
			const inputTruncated = input.layers.some(({ graph }) => graph.coverage.truncated) || captureTruncated;
			const inputComplete = input.layers.every(({ graph }) => graph.coverage.status === "complete") && input.captures.every(({ inspection }) => inspection.completeness.status === "complete_within_window");
			const outputTruncated = projectionOmissions > 0;
			const sourceOmissions = input.layers.reduce((total, { graph }) => total + (graph.coverage.omitted_count ?? 0), 0);
			const omissionsKnown = !captureTruncated && !captureHasUnknownOmissions && input.layers.every(({ graph }) => graph.coverage.omitted_count !== null);
			return {
				projectionOmissions,
				knownOmissions: projectionOmissions + sourceOmissions,
				omissionsKnown,
				inputStatus: inputTruncated ? "truncated" : inputComplete ? "complete" : "partial",
				outputTruncated
			};
		};
		graphCoverage = (input, facts, nodeCount) => facts.inputStatus === "complete" && !facts.outputTruncated ? {
			status: "complete",
			truncated: false,
			omitted_count: 0,
			limits: []
		} : facts.inputStatus === "truncated" || facts.outputTruncated ? {
			status: "partial",
			truncated: true,
			omitted_count: facts.omissionsKnown ? facts.knownOmissions : null,
			limits: [...facts.inputStatus === "truncated" ? [{
				name: "runtime-reconciliation-input-coverage",
				value: input.layers.length + input.captures.length,
				unit: "items"
			}] : [], ...facts.outputTruncated ? [{
				name: "runtime-reconciliation-output-limits",
				value: nodeCount,
				unit: "items"
			}] : []]
		} : {
			status: "partial",
			truncated: false,
			omitted_count: facts.omissionsKnown ? facts.knownOmissions : null,
			limits: []
		};
		uniqueEdges = (edges) => [...new Map(edges.map((edge) => [edge.edge_id, edge])).values()];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationMatching.js
var reconcileRuntimeEntities, reconcileEntity, withoutStaticCandidate, reconcileCapturedSource, locateEntity, indexCandidates, appendIndex, categoryDigestKey, layerCategoryPathKey, matched, unresolved, createItem, reconciliationEvidence, strongestLocationBasis, candidateKey, uniqueCandidateReferences;
function init_javascriptRuntimeReconciliationMatching() {
	return (init_javascriptRuntimeReconciliationMatching = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_canonicalDigest();
		init_unicodeCodePointOrder();
		init_javascriptRuntimeStaticCandidates();
		reconcileRuntimeEntities = (input) => {
			const index = indexCandidates(input.candidates);
			const evaluated = input.entities.map((entity) => reconcileEntity(entity, index, input.layers));
			const retained = evaluated.sort((left, right) => compareUnicodeCodePoints(left.item.reconciliation_id, right.item.reconciliation_id));
			return {
				items: retained.map(({ item }) => item),
				edges: retained.flatMap(({ edge }) => edge === null ? [] : [edge]),
				omittedItems: 0
			};
		};
		reconcileEntity = (entity, index, layers) => {
			if (entity.location.kind === "unresolved") return unresolved(entity, {
				status: "unknown",
				basis: "none",
				confidence: "unknown",
				reason: "runtime-location-unresolved",
				candidates: []
			});
			const { locations, mapped } = locateEntity(entity, index, layers);
			if (entity.sourceSha256 !== null) return reconcileCapturedSource(entity, entity.sourceSha256, {
				locations,
				mapped,
				index
			});
			const location = locations.at(0);
			if (locations.length === 1 && location !== undefined) {
				const located = location;
				return matched(entity, located.candidate, {
					basis: located.mapping.basis,
					confidence: "medium",
					reason: "unique-location-match"
				});
			}
			if (locations.length > 1) return unresolved(entity, {
				status: "ambiguous",
				basis: strongestLocationBasis(locations),
				confidence: "unknown",
				reason: "ambiguous-static-candidates",
				candidates: locations.map(({ candidate }) => candidate)
			});
			return withoutStaticCandidate(entity, mapped, "unknown");
		};
		withoutStaticCandidate = (entity, mapped, absenceConfidence) => unresolved(entity, mapped ? {
			status: "unmatched",
			basis: "none",
			confidence: absenceConfidence,
			reason: "no-static-content-match",
			candidates: []
		} : {
			status: "unknown",
			basis: "none",
			confidence: "unknown",
			reason: "no-authorized-location-mapping",
			candidates: []
		});
		reconcileCapturedSource = (entity, sourceSha256, { locations, mapped, index }) => {
			const content = locations.length > 0 ? locations.map(({ candidate }) => candidate).filter(({ digests }) => digests.some(({ sha256 }) => sha256 === sourceSha256)) : index.byCategoryDigest.get(categoryDigestKey(entity.staticKind, sourceSha256)) ?? [];
			const candidate = content.at(0);
			if (content.length === 1 && candidate !== undefined) return matched(entity, candidate, {
				basis: locations.length > 0 ? "content-and-location" : candidate.digests.find(({ sha256 }) => sha256 === sourceSha256)?.basis ?? "content-sha256",
				confidence: "high",
				reason: locations.length > 0 ? "content-and-location-match" : "unique-content-match"
			});
			if (content.length > 1) return unresolved(entity, {
				status: "ambiguous",
				basis: locations.length > 0 ? "content-and-location" : "none",
				confidence: "unknown",
				reason: "ambiguous-static-candidates",
				candidates: content
			});
			if (locations.length > 0) {
				const digestUnavailable = locations.some(({ candidate: { digests } }) => digests.length === 0);
				return unresolved(entity, {
					status: digestUnavailable ? "unknown" : "unmatched",
					basis: strongestLocationBasis(locations),
					confidence: digestUnavailable ? "unknown" : "high",
					reason: digestUnavailable ? "static-or-runtime-coverage-incomplete" : "captured-content-disagrees-with-static-location",
					candidates: locations.map(({ candidate: located }) => located)
				});
			}
			return withoutStaticCandidate(entity, mapped, "high");
		};
		locateEntity = (entity, index, layers) => {
			const located = new Map();
			let mapped = false;
			for (const layer of layers) for (const mapping of mappedRuntimePaths(layer, entity)) {
				mapped = true;
				for (const candidate of [...index.byLayerCategoryPath.get(layerCategoryPathKey(layer.layerId, entity.staticKind, mapping.path)) ?? [], ...mapping.fileStyle === null || mapping.nativeRelativePath === null ? [] : (index.byNativeDeclarationPath.get(`${mapping.fileStyle}\0${layerCategoryPathKey(layer.layerId, entity.staticKind, mapping.nativeRelativePath)}`) ?? []).filter(({ sourcePath }) => mapping.artifactPrefix === "" || sourcePath !== null && sourcePath.startsWith(`${mapping.artifactPrefix}/`)).map(({ candidate }) => candidate)]) {
					const key = candidateKey(candidate);
					if (!located.has(key)) located.set(key, {
						candidate,
						mapping
					});
				}
			}
			return {
				locations: [...located.values()].sort((left, right) => compareUnicodeCodePoints(candidateKey(left.candidate), candidateKey(right.candidate))),
				mapped
			};
		};
		indexCandidates = (candidates) => {
			const byCategoryDigest = new Map();
			const byLayerCategoryPath = new Map();
			const byNativeDeclarationPath = new Map();
			for (const candidate of candidates) {
				for (const { sha256 } of candidate.digests) appendIndex(byCategoryDigest, categoryDigestKey(candidate.category, sha256), candidate);
				for (const path of candidate.paths) appendIndex(byLayerCategoryPath, layerCategoryPathKey(candidate.layer.layerId, candidate.category, path), candidate);
				for (const style of ["posix", "windows"]) for (const { path, sourcePath } of candidate.nativeDeclarationPaths[style]) appendIndex(byNativeDeclarationPath, `${style}\0${layerCategoryPathKey(candidate.layer.layerId, candidate.category, path)}`, {
					candidate,
					sourcePath
				});
			}
			return {
				byCategoryDigest,
				byLayerCategoryPath,
				byNativeDeclarationPath
			};
		};
		appendIndex = (index, key, candidate) => {
			const values = index.get(key);
			if (values === undefined) index.set(key, [candidate]);
			else values.push(candidate);
		};
		categoryDigestKey = (category, digest) => `${category}\0${digest}`;
		layerCategoryPathKey = (layerId, category, path) => `${layerId}\0${category}\0${path}`;
		matched = (entity, candidate, input) => {
			const item = createItem(entity, {
				layer: candidate.layer,
				staticNodeId: candidate.node.node_id,
				status: "matched",
				basis: input.basis,
				confidence: input.confidence,
				reason: input.reason,
				candidates: [candidate]
			});
			return {
				item,
				edge: createJavaScriptApplicationEdge({
					source_node_id: candidate.node.node_id,
					target_node_id: entity.node.node_id,
					relation: "observed_as",
					properties: {
						reconciliation_id: item.reconciliation_id,
						basis: input.basis,
						static_layer_id: candidate.layer.layerId
					},
					evidence: reconciliationEvidence(entity, candidate.layer, input.basis, input.confidence)
				})
			};
		};
		unresolved = (entity, input) => ({
			item: createItem(entity, {
				layer: null,
				staticNodeId: null,
				status: input.status,
				basis: input.basis,
				confidence: input.confidence,
				reason: input.reason,
				candidates: input.candidates
			}),
			edge: null
		});
		createItem = (entity, input) => {
			const candidateReferences = uniqueCandidateReferences(input.candidates);
			const staticMatch = input.status === "matched" ? {
				static_layer_id: input.layer.layerId,
				static_node_id: input.staticNodeId,
				status: input.status
			} : {
				static_layer_id: null,
				static_node_id: null,
				status: input.status
			};
			const semantic = {
				entity_kind: entity.kind,
				runtime_evidence_id: entity.capture.evidence.evidence_id,
				runtime_node_id: entity.node.node_id,
				...staticMatch,
				basis: input.basis,
				confidence: input.confidence,
				reason: input.reason,
				candidate_static_count: candidateReferences.count,
				candidate_static_nodes: candidateReferences.items
			};
			return {
				reconciliation_id: `jrr_item_${digestCanonicalValue(semantic, "Runtime reconciliation")}`,
				...semantic
			};
		};
		reconciliationEvidence = (entity, layer, basis, confidence) => {
			const observation = entity.node.observations.at(0);
			if (observation === undefined) throw new TypeError("Runtime reconciliation entity has no observation");
			return {
				authority: "cross-layer-reconciliation",
				state: "inferred",
				confidence: confidence === "medium" ? "medium" : "high",
				artifact: entity.sourceSha256 === null ? {
					available: false,
					reason: "not-observed",
					detail: "Runtime source bytes were not captured for this mapping."
				} : {
					available: true,
					artifact_id: `art_${entity.sourceSha256}`,
					sha256: entity.sourceSha256
				},
				location: observation.evidence.location,
				extractor: {
					name: "rea-javascript-runtime-reconciliation",
					version: "1",
					operation: "reconcile_javascript_runtime",
					executable_sha256: null
				},
				coverage: layer.graph.coverage.status === "complete" && entity.capture.scriptsCompleteWithinScope ? {
					status: "complete",
					truncated: false,
					omitted_count: 0,
					limits: []
				} : {
					status: "partial",
					truncated: false,
					omitted_count: null,
					limits: []
				},
				limitations: [basis === "content-sha256" || basis === "module-source-sha256" || basis === "content-and-location" ? "Equal content digests establish byte identity, not execution causality." : "Location correspondence is inferred from an artifact root or caller-declared mapping.", "Passive script parsing or target presence does not prove feature execution."],
				evidence_ids: [layer.evidence.evidence_id, entity.capture.evidence.evidence_id].sort()
			};
		};
		strongestLocationBasis = (values) => {
			const bases = new Set(values.map(({ mapping }) => mapping.basis));
			if (bases.has("artifact-path")) return "artifact-path";
			if (bases.has("operator-file-mapping")) return "operator-file-mapping";
			return "operator-url-mapping";
		};
		candidateKey = (candidate) => `${candidate.layer.layerId}:${candidate.node.node_id}`;
		uniqueCandidateReferences = (candidates) => {
			const seen = new Set();
			let count = 0;
			const items = [];
			for (const { layer, node } of candidates) {
				const key = `${layer.layerId}:${node.node_id}`;
				if (seen.has(key)) continue;
				seen.add(key);
				count += 1;
				items.push({
					static_layer_id: layer.layerId,
					static_node_id: node.node_id
				});
			}
			return {
				count,
				items
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationInputValidation.js
var OPERATION, parseInputAtPath, authenticateRuntimeEvidence, invalidInput, assertEvidenceIdentity, inputErrorAtPath;
function init_javascriptRuntimeReconciliationInputValidation() {
	return (init_javascriptRuntimeReconciliationInputValidation = __esmMin((() => {
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_evidenceValidation();
		OPERATION = "reconcile_javascript_runtime";
		parseInputAtPath = (schema, input, path) => {
			const parsed = schema.safeParse(input);
			if (!parsed.success) throw inputErrorAtPath(parsed.error.issues, input, path, parsed.error);
			return parsed.data;
		};
		authenticateRuntimeEvidence = (input, path) => {
			const parsed = safeParseEvidence(input);
			if (parsed.ok) return parsed.value;
			throw inputErrorAtPath(parsed.error.issues, input, path, parsed.error);
		};
		invalidInput = (path, message) => new AnalysisInputError(OPERATION, undefined, [{
			path: [...path],
			reason: "invalid_value",
			message
		}]);
		assertEvidenceIdentity = (evidence, expected, path) => {
			if (evidence.operation !== expected.operation || evidence.predicate_type !== expected.predicate || evidence.provider.id !== expected.providerId || evidence.provider.name !== expected.providerName || evidence.provider.version !== expected.providerVersion || evidence.authority !== expected.authority || evidence.confidence !== expected.confidence) throw invalidInput(path, `Evidence does not match the supported ${expected.operation} contract`);
		};
		inputErrorAtPath = (issues, input, path, cause) => new AnalysisInputError(OPERATION, { cause }, projectInputIssues(issues, input).map((issue) => ({
			...issue,
			path: [...path, ...issue.path]
		})));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationParsing.js
var parseStaticLayers, parseStaticLayer;
function init_javascriptRuntimeReconciliationParsing() {
	return (init_javascriptRuntimeReconciliationParsing = __esmMin((() => {
		init_canonicalDigest();
		init_unicodeCodePointOrder();
		init_javascriptApplicationAnalysis();
		init_javascriptRuntimeReconciliationInputValidation();
		parseStaticLayers = (layers, path = ["static_layers"]) => layers.map((layer, index) => parseStaticLayer(layer, [
			...path,
			index,
			"analysis"
		])).sort((left, right) => compareUnicodeCodePoints(left.layerId, right.layerId));
		parseStaticLayer = (layer, evidencePath) => {
			const evidence = authenticateRuntimeEvidence(layer.analysis, evidencePath);
			const result = parseInputAtPath(javascriptApplicationAnalysisResultSchema, evidence.normalized_result, [...evidencePath, "normalized_result"]);
			assertEvidenceIdentity(evidence, {
				operation: "analyze_javascript_application",
				predicate: "rea.javascript-application-analysis",
				providerId: "rea-javascript-application",
				providerName: "REA JavaScript application analyzer",
				providerVersion: "1",
				authority: "shipped-artifact",
				confidence: "derived"
			}, evidencePath);
			if (evidence.subject === null || evidence.subject.digest.sha256 !== result.root_artifact_sha256 || evidence.subject.format !== result.format || evidence.subject.local_path !== result.input_path) throw invalidInput([...evidencePath, "subject"], "JavaScript application Evidence subject disagrees with its result");
			return {
				layerId: `jrl_${digestCanonicalValue({
					role: layer.role,
					evidence_id: evidence.evidence_id,
					runtime_mappings: layer.runtime_mappings
				}, "Runtime reconciliation")}`,
				role: layer.role,
				evidence,
				result,
				graph: result.graph,
				runtimeMappings: layer.runtime_mappings
			};
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationActive.js
var parseActiveElectronCapture, absolutePathSchema, normalizeInspection;
function init_javascriptRuntimeReconciliationActive() {
	return (init_javascriptRuntimeReconciliationActive = __esmMin((() => {
		init_canonicalDigest();
		init_localPath();
		init_javascriptRuntimeReconciliationInputValidation();
		init_browserCompleteness();
		init_electronActiveObservation();
		parseActiveElectronCapture = (evidence, path) => {
			assertEvidenceIdentity(evidence, {
				operation: "capture_electron_scenario",
				predicate: "rea.electron-active-scenario",
				providerId: "rea-playwright-electron-active",
				providerName: "REA Playwright active Electron observation provider",
				providerVersion: "1",
				authority: "controlled-replay",
				confidence: "observed"
			}, path);
			const result = parseInputAtPath(electronActiveObservationResultSchema, evidence.normalized_result, [...path, "normalized_result"]);
			const parameters = parseInputAtPath(z.object({
				application_path: absolutePathSchema,
				application_root: absolutePathSchema
			}).passthrough(), evidence.parameters, [...path, "parameters"]);
			if (result.application.application_path !== parameters.application_path || !isPathWithinRoot(parameters.application_root, result.application.application_path)) throw invalidInput([
				...path,
				"normalized_result",
				"application",
				"application_path"
			], "Active Electron Evidence application path disagrees with its configured root");
			return {
				kind: "electron-active",
				evidence,
				inspection: normalizeInspection(result),
				captureSha256: digestCanonicalValue(result, "Runtime reconciliation"),
				scriptsCompleteWithinScope: false,
				codeInventoryCompleteWithinScope: false
			};
		};
		absolutePathSchema = z.string().min(1).refine(isAbsolute);
		normalizeInspection = (result) => ({
			target: {
				target_id: `electron-active:${digestCanonicalValue(result.application.application_path, "Runtime reconciliation").slice(0, 32)}`,
				type: "electron-application",
				title: result.application.application_path,
				attached: true,
				file_path: result.application.application_path
			},
			frames: [],
			scripts: { items: [] },
			workers: [],
			completeness: classifyBrowserCompleteness({
				policyFilteredSections: new Set(),
				attachLimitedSections: new Set(),
				truncatedSections: new Set(),
				unavailableSections: new Set([
					"frames",
					"scripts",
					"script_sources",
					"workers"
				]),
				excluded: [],
				droppedEvents: {
					scripts: 0,
					network_requests: 0,
					console_events: 0,
					websocket_connections: 0,
					websocket_frames: 0,
					webmcp_tools: 0,
					timeline_events: 0
				}
			})
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationCaptureParsing.js
var parseRuntimeCaptures, parseRuntimeCapture, parseBrowserCapture, parseElectronCapture, parseV8Capture, assertV8RuntimeParameters, normalizeV8Inspection, runtimeLocation, v8ScriptExclusions, assertRuntimeParameters, scriptsComplete, codeInventoryComplete;
function init_javascriptRuntimeReconciliationCaptureParsing() {
	return (init_javascriptRuntimeReconciliationCaptureParsing = __esmMin((() => {
		init_browserObservation();
		init_browserObservationSchemas();
		init_browserCompleteness();
		init_electronObservation();
		init_javascriptRuntimeObservation();
		init_canonicalDigest();
		init_unicodeCodePointOrder();
		init_javascriptRuntimeReconciliationActive();
		init_javascriptRuntimeReconciliationInputValidation();
		parseRuntimeCaptures = (observations, path = ["runtime_observations"]) => observations.map((observation, index) => parseRuntimeCapture(observation, [...path, index])).sort((left, right) => compareUnicodeCodePoints(left.evidence.evidence_id, right.evidence.evidence_id));
		parseRuntimeCapture = (input, evidencePath) => {
			const evidence = authenticateRuntimeEvidence(input, evidencePath);
			if (evidence.operation === "inspect_web_page") return parseBrowserCapture(evidence, evidencePath);
			if (evidence.operation === "inspect_electron_page") return parseElectronCapture(evidence, evidencePath);
			if (evidence.operation === "observe_javascript_runtime") return parseV8Capture(evidence, evidencePath);
			if (evidence.operation === "capture_electron_scenario") {
				return parseActiveElectronCapture(evidence, evidencePath);
			}
			throw invalidInput(evidencePath, "Runtime reconciliation requires inspect_web_page, inspect_electron_page, observe_javascript_runtime, or capture_electron_scenario Evidence");
		};
		parseBrowserCapture = (evidence, path) => {
			assertEvidenceIdentity(evidence, {
				operation: "inspect_web_page",
				predicate: "rea.web-page-inspection",
				providerId: "rea-cdp-browser",
				providerName: "REA Chrome DevTools Protocol observation provider",
				providerVersion: "2",
				authority: "external-service",
				confidence: "observed"
			}, path);
			const inspection = parseInputAtPath(webPageInspectionSchema, evidence.normalized_result, [...path, "normalized_result"]);
			assertRuntimeParameters(evidence, {
				kind: "browser",
				targetId: inspection.target.target_id,
				targetOrigin: inspection.target.origin,
				sourceIncluded: inspection.scripts.items.some(({ source }) => source.included)
			}, path);
			return {
				kind: "browser",
				evidence,
				inspection,
				captureSha256: digestCanonicalValue(inspection, "Runtime reconciliation"),
				scriptsCompleteWithinScope: scriptsComplete(inspection.completeness),
				codeInventoryCompleteWithinScope: codeInventoryComplete(inspection.completeness)
			};
		};
		parseElectronCapture = (evidence, path) => {
			assertEvidenceIdentity(evidence, {
				operation: "inspect_electron_page",
				predicate: "rea.electron-page-inspection",
				providerId: "rea-cdp-electron",
				providerName: "REA Electron file-page CDP observation provider",
				providerVersion: "1",
				authority: "external-service",
				confidence: "observed"
			}, path);
			const inspection = parseInputAtPath(electronPageInspectionSchema, evidence.normalized_result, [...path, "normalized_result"]);
			assertRuntimeParameters(evidence, {
				kind: "electron",
				targetId: inspection.target.target_id,
				sourceIncluded: inspection.scripts.items.some(({ source }) => source.included)
			}, path);
			return {
				kind: "electron",
				evidence,
				inspection,
				captureSha256: digestCanonicalValue(inspection, "Runtime reconciliation"),
				scriptsCompleteWithinScope: scriptsComplete(inspection.completeness),
				codeInventoryCompleteWithinScope: codeInventoryComplete(inspection.completeness)
			};
		};
		parseV8Capture = (evidence, path) => {
			assertEvidenceIdentity(evidence, {
				operation: "observe_javascript_runtime",
				predicate: "rea.javascript-runtime-observation",
				providerId: "rea-v8-inspector",
				providerName: "REA passive Node/Electron V8 Inspector provider",
				providerVersion: "1",
				authority: "external-service",
				confidence: "observed"
			}, path);
			const result = parseInputAtPath(javascriptRuntimeObservationSchema, evidence.normalized_result, [...path, "normalized_result"]);
			assertV8RuntimeParameters(evidence, result, path);
			return {
				kind: "v8-inspector",
				evidence,
				inspection: normalizeV8Inspection(result),
				captureSha256: digestCanonicalValue(result, "Runtime reconciliation"),
				scriptsCompleteWithinScope: false,
				codeInventoryCompleteWithinScope: false
			};
		};
		assertV8RuntimeParameters = (evidence, result, path) => {
			const parameters = parseInputAtPath(z.object({
				inspector_endpoint: browserEndpointSchema,
				target_id: z.string().trim().min(1),
				runtime_kind: javascriptRuntimeKindSchema.optional()
			}).passthrough(), evidence.parameters, [...path, "parameters"]);
			if (parameters.target_id !== result.target.target_id) throw invalidInput([
				...path,
				"parameters",
				"target_id"
			], "Runtime Evidence target disagrees with its result");
			if (parameters.runtime_kind !== undefined && parameters.runtime_kind !== result.target.runtime_kind) throw invalidInput([
				...path,
				"parameters",
				"runtime_kind"
			], "Runtime Evidence declared role disagrees with its result");
			if (result.target.location.kind === "builtin" && !result.target.location.specifier.startsWith("node:")) throw invalidInput([
				...path,
				"normalized_result",
				"target",
				"location"
			], "Runtime Evidence contains an invalid builtin location");
			for (const [index, { location }] of result.scripts.items.entries()) if (location.kind === "builtin" && !location.specifier.startsWith("node:")) throw invalidInput([
				...path,
				"normalized_result",
				"scripts",
				"items",
				index,
				"location"
			], "Runtime Evidence contains an invalid builtin location");
		};
		normalizeV8Inspection = (result) => ({
			target: {
				target_id: result.target.target_id,
				type: result.target.protocol_type,
				title: result.target.runtime_kind,
				attached: result.target.attached,
				...result.target.location.kind === "unresolved" ? { unresolved_location: result.target.location } : runtimeLocation(result.target.location)
			},
			frames: [],
			scripts: { items: result.scripts.items.map((script) => ({
				script_key: script.script_key,
				frame_id: script.execution_context_key,
				...runtimeLocation(script.location),
				..."reported_url" in script && script.reported_url !== undefined ? { reported_url: script.reported_url } : {},
				cdp_hash: script.cdp_hash,
				length: script.length,
				is_module: script.is_module,
				language: null,
				source: {
					included: false,
					reason: "V8 Inspector source capture is outside passive authority."
				}
			})) },
			workers: [],
			completeness: classifyBrowserCompleteness({
				policyFilteredSections: new Set(result.scripts.excluded.unsupported_location > 0 ? ["scripts"] : []),
				attachLimitedSections: new Set([
					"frames",
					"scripts",
					"script_sources",
					"workers"
				]),
				truncatedSections: new Set(result.capture.truncated ? ["scripts"] : []),
				unavailableSections: new Set([
					"frames",
					"script_sources",
					"workers",
					...result.scripts.excluded.invalid_protocol_value > 0 ? ["scripts"] : []
				]),
				excluded: v8ScriptExclusions(result),
				droppedEvents: {
					scripts: result.capture.events_dropped,
					network_requests: 0,
					console_events: 0,
					websocket_connections: 0,
					websocket_frames: 0,
					webmcp_tools: 0,
					timeline_events: 0
				}
			})
		});
		runtimeLocation = (location) => {
			if (location.kind === "unresolved") return { unresolved_location: location };
			if (location.kind === "file") return { file_path: location.file_path };
			if (location.kind === "url") return { url: location.sanitized_url };
			return { url: location.specifier };
		};
		v8ScriptExclusions = (result) => {
			const { unsupported_location, invalid_protocol_value } = result.scripts.excluded;
			return [...unsupported_location > 0 ? [{
				section: "scripts",
				reason: "out_of_target_scope",
				count: unsupported_location
			}] : [], ...invalid_protocol_value > 0 ? [{
				section: "scripts",
				reason: "invalid_protocol_value",
				count: invalid_protocol_value
			}] : []];
		};
		assertRuntimeParameters = (evidence, expected, path) => {
			const common = {
				target_id: z.string().trim().min(1),
				include_script_sources: z.boolean()
			};
			if (expected.kind === "browser") {
				const parameters = parseInputAtPath(z.object({
					...common,
					cdp_endpoint: recordedBrowserObservationEndpointSchema,
					allowed_origins: browserAllowedOriginsSchema
				}).passthrough(), evidence.parameters, [...path, "parameters"]);
				if (parameters.target_id !== expected.targetId) throw invalidInput([
					...path,
					"parameters",
					"target_id"
				], "Runtime Evidence target disagrees with its captured result");
				if (!parameters.allowed_origins.includes(expected.targetOrigin)) throw invalidInput([
					...path,
					"parameters",
					"allowed_origins"
				], "Browser Evidence target is outside its recorded origin scope");
				if (expected.sourceIncluded && !parameters.include_script_sources) throw invalidInput([
					...path,
					"parameters",
					"include_script_sources"
				], "Runtime Evidence contains source without source-capture selection");
				return;
			}
			const parameters = parseInputAtPath(z.object({
				...common,
				cdp_endpoint: browserEndpointSchema
			}).passthrough(), evidence.parameters, [...path, "parameters"]);
			if (parameters.target_id !== expected.targetId) throw invalidInput([
				...path,
				"parameters",
				"target_id"
			], "Runtime Evidence target disagrees with its captured result");
			if (expected.sourceIncluded && !parameters.include_script_sources) throw invalidInput([
				...path,
				"parameters",
				"include_script_sources"
			], "Runtime Evidence contains source without source-capture selection");
		};
		scriptsComplete = (completeness) => !completeness.attach_limited_sections.includes("scripts") && !completeness.truncated_sections.includes("scripts") && !completeness.unavailable_sections.includes("scripts") && completeness.dropped_events.scripts === 0;
		codeInventoryComplete = (completeness) => scriptsComplete(completeness) && !completeness.unavailable_sections.includes("workers") && !completeness.truncated_sections.includes("workers") && !completeness.attach_limited_sections.includes("workers");
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationResult.js
var createJavaScriptRuntimeReconciliationResult, staticLayerSummaries, captureSummaries, reconciliationSummary, sourceMapAuthority, reconciliationCoverage, completionFlags, reconciliationLimitations, countBy;
function init_javascriptRuntimeReconciliationResult() {
	return (init_javascriptRuntimeReconciliationResult = __esmMin((() => {
		init_canonicalDigest();
		init_canonicalOrdering();
		init_javascriptRuntimeReconciliationSchemas();
		createJavaScriptRuntimeReconciliationResult = (input) => {
			const completion = completionFlags(input);
			const semantic = {
				static_layers: staticLayerSummaries(input.layers),
				runtime_captures: captureSummaries(input.captures, input.runtime),
				graph: input.graph,
				summary: reconciliationSummary(input),
				reconciliations: input.matching.items,
				static_load_states: input.loadStates.states,
				source_map_authority: sourceMapAuthority(input),
				coverage: reconciliationCoverage(input, completion),
				evidence_links: uniqueSorted([...input.layers.map(({ evidence }) => evidence.evidence_id), ...input.captures.map(({ evidence }) => evidence.evidence_id)]),
				limitations: reconciliationLimitations(completion)
			};
			return javascriptRuntimeReconciliationResultSchema.parse({
				reconciliation_id: `jrr_${digestCanonicalValue(semantic, "Runtime reconciliation")}`,
				...semantic
			});
		};
		staticLayerSummaries = (layers) => layers.map((layer) => ({
			layer_id: layer.layerId,
			role: layer.role,
			evidence_id: layer.evidence.evidence_id,
			graph_id: layer.graph.graph_id,
			root_artifact_sha256: layer.result.root_artifact_sha256,
			input_path: layer.result.input_path,
			format: layer.result.format,
			runtime_mappings: [...layer.runtimeMappings]
		}));
		captureSummaries = (captures, runtime) => captures.map((capture) => {
			const targetNode = runtime.targetNodeByEvidenceId.get(capture.evidence.evidence_id);
			if (targetNode === undefined) throw new TypeError("Runtime projection omitted a required target node");
			return {
				evidence_id: capture.evidence.evidence_id,
				capture_sha256: capture.captureSha256,
				kind: capture.kind,
				target_node_id: targetNode.node_id,
				target_key: capture.inspection.target.target_id,
				target_location: "unresolved_location" in capture.inspection.target ? capture.inspection.target.unresolved_location : "url" in capture.inspection.target ? capture.inspection.target.url : capture.inspection.target.file_path,
				frames: capture.inspection.frames.length,
				scripts: capture.inspection.scripts.items.length,
				workers: capture.inspection.workers.length,
				scripts_complete_within_scope: capture.scriptsCompleteWithinScope
			};
		});
		reconciliationSummary = (input) => ({
			runtime_targets: countBy(input.runtime.entities, "kind", "target"),
			runtime_frames: countBy(input.runtime.entities, "kind", "frame"),
			runtime_scripts: countBy(input.runtime.entities, "kind", "script"),
			runtime_workers: countBy(input.runtime.entities, "kind", "worker"),
			matched: countBy(input.matching.items, "status", "matched"),
			ambiguous: countBy(input.matching.items, "status", "ambiguous"),
			unmatched: countBy(input.matching.items, "status", "unmatched"),
			unknown: countBy(input.matching.items, "status", "unknown"),
			static_loaded: countBy(input.loadStates.states, "status", "loaded"),
			static_resident: countBy(input.loadStates.states, "status", "resident-in-loaded-asset"),
			static_not_observed: countBy(input.loadStates.states, "status", "not-observed-in-capture"),
			static_unknown: countBy(input.loadStates.states, "status", "unknown")
		});
		sourceMapAuthority = (input) => ({
			used_for_primary_matching: false,
			static_layer_count: input.layers.length,
			runtime_script_declarations: input.captures.reduce((total, capture) => total + (capture.kind === "browser" ? capture.inspection.scripts.items.filter(({ source_map_url: url }) => url !== null).length : 0), 0),
			limitation: "Source-map declarations and original-source content retain separate static authority and are not used as primary runtime byte matches."
		});
		reconciliationCoverage = (input, completion) => ({
			status: completion.outputTruncated || completion.inputStatus === "truncated" ? "truncated" : completion.inputStatus === "partial" ? "partial" : "complete-within-inputs",
			truncated: completion.outputTruncated || completion.inputStatus === "truncated",
			omitted_runtime_entities: input.runtime.omittedEntities,
			omitted_reconciliation_items: input.matching.omittedItems,
			omitted_static_load_states: input.loadStates.omittedStates,
			omitted_graph_items: input.omittedGraphItems
		});
		completionFlags = (input) => {
			const inputTruncated = input.layers.some(({ graph }) => graph.coverage.truncated) || input.captures.some(({ inspection }) => inspection.completeness.conditions.includes("truncated"));
			const inputPartial = input.layers.some(({ graph }) => graph.coverage.status !== "complete") || input.captures.some(({ inspection }) => inspection.completeness.status !== "complete_within_window");
			return {
				outputTruncated: input.runtime.omittedEntities > 0 || input.matching.omittedItems > 0 || input.loadStates.omittedStates > 0 || input.omittedGraphItems > 0,
				inputStatus: inputTruncated ? "truncated" : inputPartial ? "partial" : "complete"
			};
		};
		reconciliationLimitations = (completion) => uniqueSorted([
			"Only caller-supplied, semantically verified Evidence records were reconciled.",
			"Digest equality establishes byte identity but not code reachability, module initialization, or feature execution.",
			"A static module resident in an observed bundle is not reported as executed.",
			"Not-observed means absent from the bounded captures in scope, never globally unloaded.",
			"Caller-declared file and URL mappings are inference inputs and do not expand CDP origin or filesystem-root authority.",
			"Source-map authority remains separate from passive runtime authority.",
			...completion.inputStatus !== "complete" ? ["One or more static graphs or passive captures were incomplete."] : [],
			...completion.outputTruncated ? ["Runtime reconciliation omitted entities or classifications during projection."] : []
		]);
		countBy = (items, key, value) => items.filter((item) => item[key] === value).length;
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliationRuntime.js
var projectRuntimeCaptures, projectCapture, targetEntity, frameEntities, scriptEntities, workerEntities, runtimeEntity, runtimeEvidence, runtimeEdges, runtimeRelationshipEvidence, runtimeSectionComplete, runtimeSectionCoverage, runtimeSectionCount;
function init_javascriptRuntimeReconciliationRuntime() {
	return (init_javascriptRuntimeReconciliationRuntime = __esmMin((() => {
		init_javascriptApplicationGraph();
		projectRuntimeCaptures = (captures) => {
			const all = captures.flatMap(projectCapture);
			const retained = all;
			const retainedIds = new Set(retained.map(({ node }) => node.node_id));
			const nodes = retained.map(({ node }) => node);
			const edges = captures.flatMap((capture) => runtimeEdges(capture, all)).filter(({ source_node_id: source, target_node_id: target }) => retainedIds.has(source) && retainedIds.has(target));
			const targetNodeByEvidenceId = new Map(retained.filter(({ kind }) => kind === "target").map(({ capture, node }) => [capture.evidence.evidence_id, node]));
			return {
				entities: retained,
				nodes,
				edges,
				targetNodeByEvidenceId,
				omittedEntities: 0
			};
		};
		projectCapture = (capture) => {
			const target = targetEntity(capture);
			return [
				target,
				...frameEntities(capture),
				...scriptEntities(capture),
				...workerEntities(capture)
			];
		};
		targetEntity = (capture) => {
			const target = capture.inspection.target;
			const location = "unresolved_location" in target ? {
				kind: "unresolved",
				value: target.unresolved_location.reported_url
			} : "url" in target ? {
				kind: "url",
				value: target.url
			} : {
				kind: "file",
				value: target.file_path
			};
			return runtimeEntity(capture, {
				kind: "target",
				nodeKind: "target",
				runtimeKey: target.target_id,
				targetKey: target.target_id,
				frameKey: null,
				scriptKey: null,
				location,
				staticKind: "renderer",
				sourceSha256: null,
				label: target.title,
				properties: {
					runtime_type: target.type,
					...location.kind === "unresolved" ? {
						reported_url: location.value,
						location_kind: "unresolved",
						location_reason: "unverifiable-file-location"
					} : { location: location.value },
					attached: target.attached
				},
				section: "target"
			});
		};
		frameEntities = (capture) => capture.inspection.frames.map((frame) => {
			const location = "url" in frame ? {
				kind: "url",
				value: frame.url
			} : {
				kind: "file",
				value: frame.file_path
			};
			return runtimeEntity(capture, {
				kind: "frame",
				nodeKind: "frame",
				runtimeKey: frame.frame_id,
				targetKey: capture.inspection.target.target_id,
				frameKey: frame.frame_id,
				scriptKey: null,
				location,
				staticKind: "renderer",
				sourceSha256: null,
				label: location.value,
				properties: {
					parent_frame_id: frame.parent_frame_id,
					location: location.value
				},
				section: "frames"
			});
		});
		scriptEntities = (capture) => capture.inspection.scripts.items.map((script) => {
			const location = "unresolved_location" in script ? {
				kind: "unresolved",
				value: script.unresolved_location.reported_url
			} : "url" in script ? {
				kind: "url",
				value: script.url
			} : {
				kind: "file",
				value: script.file_path
			};
			return runtimeEntity(capture, {
				kind: "script",
				nodeKind: "runtime-script-instance",
				runtimeKey: script.script_key,
				targetKey: capture.inspection.target.target_id,
				frameKey: "frame_scope" in script && script.frame_scope === "unknown" ? null : script.frame_id,
				scriptKey: script.script_key,
				location,
				staticKind: "javascript",
				sourceSha256: script.source.included ? script.source.artifact.sha256 : null,
				label: location.value,
				properties: {
					..."unresolved_location" in script ? {
						location_kind: "unresolved",
						reported_url: script.unresolved_location.reported_url,
						location_reason: script.unresolved_location.reason
					} : { location: location.value },
					..."reported_url" in script && script.reported_url !== undefined ? { reported_url: script.reported_url } : {},
					..."frame_scope" in script && script.frame_scope !== undefined ? {
						frame_scope: script.frame_scope,
						reported_frame_id: script.frame_id
					} : {},
					..."has_source_url" in script && script.has_source_url !== undefined ? { has_source_url: script.has_source_url } : {},
					..."frame_claims" in script && script.frame_claims !== undefined ? { frame_claims: script.frame_claims } : {},
					cdp_hash: script.cdp_hash,
					length: script.length,
					is_module: script.is_module,
					language: script.language,
					source_sha256: script.source.included ? script.source.artifact.sha256 : null,
					..."source_map_url" in script ? { source_map_url: script.source_map_url } : {}
				},
				section: "scripts",
				...script.source.included ? { artifactSha256: script.source.artifact.sha256 } : {}
			});
		});
		workerEntities = (capture) => capture.inspection.workers.map((worker) => {
			const location = "url" in worker ? {
				kind: "url",
				value: worker.url
			} : {
				kind: "file",
				value: worker.file_path
			};
			const serviceWorker = worker.type.includes("service");
			return runtimeEntity(capture, {
				kind: "worker",
				nodeKind: serviceWorker ? "service-worker" : "worker",
				runtimeKey: worker.target_id,
				targetKey: worker.target_id,
				frameKey: worker.parent_frame_id,
				scriptKey: null,
				location,
				staticKind: serviceWorker ? "service-worker" : "worker",
				sourceSha256: null,
				label: location.value,
				properties: {
					runtime_type: worker.type,
					location: location.value,
					attached: worker.attached,
					opener_target_id: worker.opener_target_id,
					parent_frame_id: worker.parent_frame_id
				},
				section: "workers"
			});
		});
		runtimeEntity = (capture, input) => ({
			kind: input.kind,
			section: input.section,
			capture,
			runtimeKey: input.runtimeKey,
			location: input.location,
			frameKey: input.frameKey,
			sourceSha256: input.sourceSha256,
			staticKind: input.staticKind,
			node: createJavaScriptApplicationNode({
				kind: input.nodeKind,
				identity: {
					strategy: "runtime-instance",
					stability: "capture-only",
					capture_sha256: capture.captureSha256,
					runtime_key: input.runtimeKey
				},
				observations: [{
					label: input.label || null,
					properties: input.properties,
					evidence: runtimeEvidence(capture, input)
				}]
			})
		});
		runtimeEvidence = (capture, input) => ({
			authority: "passive-cdp-runtime",
			state: "observed",
			confidence: "exact",
			artifact: input.artifactSha256 === undefined ? {
				available: false,
				reason: input.section === "scripts" ? "not-observed" : "not-applicable",
				detail: input.section === "scripts" ? "Script source bytes were not included in this passive capture." : "This runtime entity has no standalone artifact bytes."
			} : {
				available: true,
				artifact_id: `art_${input.artifactSha256}`,
				sha256: input.artifactSha256
			},
			location: {
				available: true,
				value: {
					kind: "runtime",
					capture_sha256: capture.captureSha256,
					target_key: input.targetKey,
					frame_key: input.frameKey,
					script_key: input.scriptKey
				}
			},
			extractor: {
				name: capture.evidence.provider.id,
				version: capture.evidence.provider.version ?? (capture.kind === "browser" ? "2" : "1"),
				operation: capture.evidence.operation,
				executable_sha256: null
			},
			coverage: runtimeSectionCoverage(capture, input.section),
			limitations: ["The entity was observed only within one bounded passive CDP capture.", ...runtimeSectionComplete(capture, input.section) ? [] : [`The runtime ${input.section} inventory was incomplete within this capture.`]],
			evidence_ids: [capture.evidence.evidence_id]
		});
		runtimeEdges = (capture, entities) => {
			const local = entities.filter(({ capture: candidate }) => candidate.evidence.evidence_id === capture.evidence.evidence_id);
			const target = local.find(({ kind }) => kind === "target");
			if (target === undefined) return [];
			const frames = new Map(local.filter(({ kind }) => kind === "frame").map((entity) => [entity.runtimeKey, entity]));
			return local.flatMap((entity) => {
				if (entity === target) return [];
				const parent = (entity.kind === "script" || entity.kind === "worker") && entity.frameKey !== null ? frames.get(entity.frameKey) ?? target : target;
				return [createJavaScriptApplicationEdge({
					source_node_id: parent.node.node_id,
					target_node_id: entity.node.node_id,
					relation: entity.kind === "script" ? "loads" : "contains",
					properties: { basis: "passive-cdp-observation" },
					evidence: runtimeRelationshipEvidence(capture, entity)
				})];
			});
		};
		runtimeRelationshipEvidence = (capture, entity) => ({
			authority: "passive-cdp-runtime",
			state: "observed",
			confidence: "exact",
			artifact: {
				available: false,
				reason: "not-applicable",
				detail: "The relationship is runtime metadata, not standalone bytes."
			},
			location: {
				available: true,
				value: {
					kind: "runtime",
					capture_sha256: capture.captureSha256,
					target_key: capture.inspection.target.target_id,
					frame_key: entity.frameKey,
					script_key: entity.kind === "script" ? entity.runtimeKey : null
				}
			},
			extractor: {
				name: capture.evidence.provider.id,
				version: capture.evidence.provider.version ?? (capture.kind === "browser" ? "2" : "1"),
				operation: capture.evidence.operation,
				executable_sha256: null
			},
			coverage: runtimeSectionCoverage(capture, entity.section),
			limitations: ["The relationship was observed only within one bounded passive CDP capture."],
			evidence_ids: [capture.evidence.evidence_id]
		});
		runtimeSectionComplete = (capture, section) => {
			if (section === "target") return true;
			if (section === "scripts") return capture.scriptsCompleteWithinScope;
			return !capture.inspection.completeness.truncated_sections.includes(section) && !capture.inspection.completeness.unavailable_sections.includes(section);
		};
		runtimeSectionCoverage = (capture, section) => {
			if (runtimeSectionComplete(capture, section)) return {
				status: "complete",
				truncated: false,
				omitted_count: 0,
				limits: []
			};
			const truncated = section !== "target" && capture.inspection.completeness.truncated_sections.includes(section);
			return {
				status: "partial",
				truncated,
				omitted_count: null,
				limits: truncated ? [{
					name: `passive-cdp-${section}-limit`,
					value: runtimeSectionCount(capture, section),
					unit: "items"
				}] : []
			};
		};
		runtimeSectionCount = (capture, section) => {
			switch (section) {
				case "target": return 1;
				case "frames": return capture.inspection.frames.length;
				case "scripts": return capture.inspection.scripts.items.length;
				case "workers": return capture.inspection.workers.length;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptRuntimeReconciliation.js
var readRuntimeReconciliationInput, reconcileJavaScriptRuntime;
function init_javascriptRuntimeReconciliation() {
	return (init_javascriptRuntimeReconciliation = __esmMin((() => {
		init_javascriptRuntimeLoadState();
		init_javascriptRuntimeReconciliationGraph();
		init_javascriptRuntimeReconciliationMatching();
		init_javascriptRuntimeReconciliationParsing();
		init_javascriptRuntimeReconciliationCaptureParsing();
		init_javascriptRuntimeReconciliationResult();
		init_javascriptRuntimeReconciliationRuntime();
		init_javascriptRuntimeStaticCandidates();
		init_analysisErrorCore();
		init_result();
		readRuntimeReconciliationInput = (input) => {
			try {
				return ok({
					input,
					layers: parseStaticLayers(input.static_layers, ["static_layers"]),
					captures: parseRuntimeCaptures(input.runtime_observations, ["runtime_observations"])
				});
			} catch (cause) {
				if (cause instanceof AnalysisInputError) return err(cause);
				throw cause;
			}
		};
		reconcileJavaScriptRuntime = (parsed) => {
			const { layers, captures } = parsed;
			const runtime = projectRuntimeCaptures(captures);
			const candidates = collectStaticRuntimeCandidates(layers);
			const matching = reconcileRuntimeEntities({
				entities: runtime.entities,
				candidates,
				layers
			});
			const loadStates = classifyStaticLoadStates(layers, runtime.entities, matching.items, { reconciliationComplete: runtime.omittedEntities === 0 && matching.omittedItems === 0 });
			const graph = buildReconciledApplicationGraph({
				layers,
				captures,
				runtime,
				reconciliationEdges: matching.edges,
				omittedReconciliationItems: matching.omittedItems
			});
			return createJavaScriptRuntimeReconciliationResult({
				layers,
				captures,
				runtime,
				matching,
				loadStates,
				graph: graph.graph,
				omittedGraphItems: graph.omittedGraphItems
			});
		};
	})))();
}

//#endregion
export { init_javascriptRuntimeReconciliation, readRuntimeReconciliationInput, reconcileJavaScriptRuntime };