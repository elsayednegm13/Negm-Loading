import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS, absenceClaimable, analysisInputErrorFromIssues, applicationFeatureTraceResultSchema, applicationTraceIdentitiesSchema, applicationVersionIdentitiesSchema, canonicalJson, compareApplicationVersionsInputSchema, compareJavaScriptExportShapesInputSchema, compareUnicodeCodePoints, compositeKey, createImmutableJavaScriptApplicationGraphSteps, createJavaScriptApplicationEdge, createJavaScriptApplicationGraph, digestCanonicalValue, featureSeedMatchMode, init_canonicalDigest, init_canonicalOrdering, init_comparisonSemantics, init_digests, init_evidenceReference, init_inputIssueProjection, init_javascriptApplicationGraph, init_javascriptApplicationVersionComparisonSchemas, init_javascriptArtifactFiles, init_javascriptExportShapeComparisonSchemas, init_javascriptFeatureTraceSchemas, init_sourceToBundleComparisonSchemas, init_unicodeCodePointOrder, isDigest, javaScriptExportShapeComparisonResultSchema, javaScriptExportShapeIdentitiesSchema, javaScriptFileOccurrenceSchema, mergeJavaScriptApplicationNodes, ownedApplicationVersionComparisonResultSchema, projectedExportReturnShapesSchema, retainedEvidenceReferenceSchema, sourceToBundleComparisonResultSchema, traceApplicationFeatureInputSchema, uniqueSorted } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_EvidenceInputResolver, resolveEvidenceInput } from "./EvidenceInputResolver-CYQeiR8K.js";
import { applicationGraphEvidenceInputError, init_JavaScriptApplicationEvidenceGraph, parseApplicationGraphEvidence, parseNativeApplicationEvidence } from "./JavaScriptApplicationEvidenceGraph-C10LjUcu.js";
import { createApplicationFeatureTraceEvidence, createApplicationVersionComparisonEvidence, createJavaScriptExportShapeComparisonEvidence, createSourceToBundleComparisonEvidence, init_JavaScriptApplicationWorkflowEvidence } from "./JavaScriptApplicationWorkflowEvidence-D3jvCuP6.js";
import { z } from "zod";
import { posix } from "node:path";

//#region dist/domain/javascript/javascriptApplicationChangeGraph.js
var buildJavaScriptApplicationChangeGraph, nodeCandidates, changedFromEdge, comparisonEvidence, changeGraphCoverage, sourceCoverageLimits, combineOmittedCounts, uniqueEdges;
function init_javascriptApplicationChangeGraph() {
	return (init_javascriptApplicationChangeGraph = __esmMin((() => {
		init_javascriptApplicationGraph();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		buildJavaScriptApplicationChangeGraph = (input) => {
			const mergedNodes = mergeJavaScriptApplicationNodes(nodeCandidates(input)).sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
			const retained = new Set(mergedNodes.map(({ node_id }) => node_id));
			const preferredRoots = uniqueSorted([...input.right.root_node_ids, ...input.left.root_node_ids]).filter((nodeId) => retained.has(nodeId));
			const sourceEdges = uniqueEdges([...input.left.edges, ...input.right.edges]).filter(({ source_node_id: source, target_node_id: target }) => retained.has(source) && retained.has(target));
			const leftById = new Map(input.left.nodes.map((node) => [node.node_id, node]));
			const rightById = new Map(input.right.nodes.map((node) => [node.node_id, node]));
			const comparisonEdges = input.items.flatMap((item) => changedFromEdge(item, input, retained, leftById, rightById));
			const candidateEdges = uniqueEdges([...sourceEdges, ...comparisonEdges]);
			const rootNodeIds = preferredRoots.filter((nodeId) => retained.has(nodeId));
			const fallbackRoot = mergedNodes[0]?.node_id;
			const steps = createImmutableJavaScriptApplicationGraphSteps({
				schema: "JavaScriptApplicationGraph",
				root_node_ids: rootNodeIds.length > 0 ? rootNodeIds : fallbackRoot === undefined ? [] : [fallbackRoot],
				nodes: mergedNodes,
				edges: candidateEdges,
				coverage: changeGraphCoverage(input),
				limitations: uniqueSorted([
					...input.left.limitations.map((value) => `Left: ${value}`),
					...input.right.limitations.map((value) => `Right: ${value}`),
					"changed_from edges are cross-version inferences and never promote structural or semantic matches to exact identity.",
					"The change graph contains compared entities and their retained relationships; it is not an executable application."
				])
			});
			let next = steps.next();
			while (!next.done) next = steps.next();
			return { graph: next.value };
		};
		nodeCandidates = (input) => {
			const required = new Set([
				...input.left.root_node_ids,
				...input.right.root_node_ids,
				...input.items.flatMap(({ left_node_id: left, right_node_id: right }) => [...left === null ? [] : [left], ...right === null ? [] : [right]])
			]);
			return [...input.left.nodes, ...input.right.nodes].filter((node) => required.has(node.node_id));
		};
		changedFromEdge = (item, input, retained, leftById, rightById) => {
			const left = item.left_node_id;
			const right = item.right_node_id;
			if (item.match.status !== "matched" || item.status === "unchanged" || item.status === "unknown" && !item.dimensions.some((dimension) => dimension !== "location" && dimension !== "coverage") || left === null || right === null || left === right || !retained.has(left) || !retained.has(right)) return [];
			const evidence = comparisonEvidence(item, input, leftById.get(left), rightById.get(right));
			return [createJavaScriptApplicationEdge({
				source_node_id: right,
				target_node_id: left,
				relation: "changed_from",
				properties: {
					comparison_item_id: item.item_id,
					status: item.status,
					match_basis: item.match.basis,
					match_confidence: item.match.confidence,
					dimensions: item.dimensions
				},
				evidence
			})];
		};
		comparisonEvidence = (item, input, left, right) => {
			const source = right?.observations[0]?.evidence ?? left?.observations[0]?.evidence;
			const complete = input.left.coverage.status === "complete" && input.right.coverage.status === "complete";
			return {
				authority: "cross-version-comparison",
				state: "inferred",
				confidence: item.match.confidence === "medium" ? "medium" : "high",
				artifact: source?.artifact ?? {
					available: false,
					reason: "unresolved",
					detail: "Compared node has no artifact-backed observation."
				},
				location: source?.location ?? {
					available: false,
					reason: "unresolved",
					detail: "Compared node has no actionable source location."
				},
				extractor: {
					name: "rea-application-version-comparison",
					version: "1",
					operation: "compare_application_versions",
					executable_sha256: null
				},
				coverage: complete ? {
					status: "complete",
					truncated: false,
					omitted_count: 0,
					limits: sourceCoverageLimits(input)
				} : {
					status: "partial",
					truncated: input.left.coverage.truncated || input.right.coverage.truncated,
					omitted_count: combineOmittedCounts(input.left.coverage.omitted_count, input.right.coverage.omitted_count),
					limits: sourceCoverageLimits(input)
				},
				limitations: ["Cross-version pairing is inferred from the stated match basis; changed_from does not prove runtime reachability.", ...item.limitations],
				evidence_ids: [input.leftEvidenceId, input.rightEvidenceId]
			};
		};
		changeGraphCoverage = (input) => {
			if (input.left.coverage.status === "complete" && input.right.coverage.status === "complete") return {
				status: "complete",
				truncated: false,
				omitted_count: 0,
				limits: sourceCoverageLimits(input)
			};
			return {
				status: "partial",
				truncated: input.left.coverage.truncated || input.right.coverage.truncated,
				omitted_count: combineOmittedCounts(input.left.coverage.omitted_count, input.right.coverage.omitted_count),
				limits: sourceCoverageLimits(input)
			};
		};
		sourceCoverageLimits = (input) => [...new Map([...input.left.coverage.limits, ...input.right.coverage.limits].map((limit) => [`${limit.name}\0${limit.value}\0${limit.unit}`, limit])).values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
		combineOmittedCounts = (left, right) => left === null || right === null ? null : left + right;
		uniqueEdges = (edges) => [...new Map(edges.map((edge) => [edge.edge_id, edge])).values()].sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationEndpointCorrespondence.js
var applicationEndpointCorrespondence, uniqueIdentity, sourceSiteKey;
function init_javascriptApplicationEndpointCorrespondence() {
	return (init_javascriptApplicationEndpointCorrespondence = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_comparisonSemantics();
		applicationEndpointCorrespondence = (node) => {
			const kinds = new Set();
			const keys = new Set();
			let exact = node.observations.length > 0;
			let keyUnavailable = false;
			let kindUnavailable = node.observations.length === 0;
			for (const { properties, evidence } of node.observations) {
				const kind = properties.endpoint_kind;
				const value = properties.value;
				const interpretation = properties.interpretation === undefined ? "literal" : properties.interpretation;
				const resolution = properties.resolution === undefined ? "complete" : properties.resolution;
				if (typeof kind !== "string" || kind === "") {
					kindUnavailable = true;
					keyUnavailable = true;
					exact = false;
					continue;
				}
				kinds.add(kind);
				if (evidence.state === "unknown" || evidence.state === "unavailable") {
					exact = false;
					keyUnavailable = true;
					continue;
				}
				if (typeof value !== "string" || interpretation !== "literal" && interpretation !== "candidate" || resolution !== "complete" && resolution !== "partial") {
					exact = false;
					keyUnavailable = true;
					continue;
				}
				if (resolution === "complete" && interpretation === "literal") {
					keys.add(compositeKey([
						kind,
						"exact",
						value
					]));
					continue;
				}
				exact = false;
				const sourceSite = sourceSiteKey(evidence.location);
				if (sourceSite === null) {
					keyUnavailable = true;
					continue;
				}
				keys.add(compositeKey([
					kind,
					"source-site",
					interpretation,
					resolution,
					value,
					sourceSite
				]));
			}
			return {
				endpointKind: kindUnavailable ? null : uniqueIdentity(kinds),
				targetResolution: exact && keys.size === 1 ? "exact" : "unresolved",
				semanticKey: keyUnavailable ? null : uniqueIdentity(keys)
			};
		};
		uniqueIdentity = (values) => values.size === 1 ? values.values().next().value ?? null : null;
		sourceSiteKey = (location) => location.available && location.value.kind === "source-range" ? canonicalJson(location.value) : null;
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationVersionItems.js
var classifyJavaScriptApplicationVersions, matchedItem, unmatchedItem, leftOnlyItem, rightOnlyItem, matchedMatch, unmatchedMatch, AMBIGUOUS_MATCH_LIMITATION, INCOMPLETE_GRAPH_LIMITATION, ENDPOINT_TARGET_LIMITATION, ENDPOINT_ABSENCE_LIMITATION, unresolvedEndpointTarget, unresolvedEndpointKinds, oppositeEndpointUncertain, ownPresenceUncertain, ownComparisonLimitations, changedDimensions, contentIdentity, locations, properties, comparisonPropertyValues, indexRelationships, compareRelationships, relationshipFacts, itemEvidenceLinks, nativeLinks, indexNativeEvidence, matchLimitations, itemWithId, stringProperty, graphsComplete;
function init_javascriptApplicationVersionItems() {
	return (init_javascriptApplicationVersionItems = __esmMin((() => {
		init_comparisonSemantics();
		init_canonicalDigest();
		init_unicodeCodePointOrder();
		init_javascriptArtifactFiles();
		init_javascriptApplicationEndpointCorrespondence();
		classifyJavaScriptApplicationVersions = (matching, context) => {
			const pairByLeft = new Map(matching.pairs.map(({ left, right }) => [left.node_id, `pair:${left.node_id}:${right.node_id}`]));
			const pairByRight = new Map(matching.pairs.map(({ left, right }) => [right.node_id, `pair:${left.node_id}:${right.node_id}`]));
			const fullContext = {
				leftGraph: context.leftGraph,
				rightGraph: context.rightGraph,
				leftEvidenceId: context.leftEvidenceId,
				rightEvidenceId: context.rightEvidenceId,
				leftNativeEvidenceByDigest: indexNativeEvidence(context.leftNativeEvidence),
				rightNativeEvidenceByDigest: indexNativeEvidence(context.rightNativeEvidence),
				pairByLeft,
				pairByRight,
				leftRelationships: indexRelationships(context.leftGraph),
				rightRelationships: indexRelationships(context.rightGraph),
				leftUnresolvedEndpointKinds: unresolvedEndpointKinds(context.leftGraph),
				rightUnresolvedEndpointKinds: unresolvedEndpointKinds(context.rightGraph)
			};
			const leftItems = matching.unmatchedLeft.map((node) => {
				const candidates = matching.candidatesForLeft.get(node.node_id) ?? [];
				return unmatchedItem({
					left: node,
					candidateRightNodeIds: candidates
				}, fullContext);
			});
			const rightItems = matching.unmatchedRight.map((node) => {
				const candidates = matching.candidatesForRight.get(node.node_id) ?? [];
				return unmatchedItem({
					right: node,
					candidateLeftNodeIds: candidates
				}, fullContext);
			});
			return { items: [
				...matching.pairs.map((pair) => matchedItem(pair, fullContext)),
				...leftItems,
				...rightItems
			].sort((left, right) => compareUnicodeCodePoints(left.item_id, right.item_id)) };
		};
		matchedItem = (pair, context) => {
			const relationships = compareRelationships(pair, context);
			const dimensions = changedDimensions(pair, relationships);
			const complete = graphsComplete(context);
			const ownEvidenceUncertain = ownPresenceUncertain(pair.left) || ownPresenceUncertain(pair.right);
			const endpointTargetUncertain = unresolvedEndpointTarget(pair.left) || unresolvedEndpointTarget(pair.right);
			const observedChange = !ownEvidenceUncertain && (dimensions.includes("content") || dimensions.includes("properties"));
			const completeChange = !ownEvidenceUncertain && complete && dimensions.some((dimension) => dimension !== "location");
			const status = ownEvidenceUncertain ? "unknown" : observedChange || completeChange ? "changed" : complete && !relationships.unresolved && !endpointTargetUncertain ? "unchanged" : "unknown";
			const finalDimensions = ownEvidenceUncertain ? [] : status === "unknown" && !complete ? [...dimensions, "coverage"] : dimensions;
			const semantic = {
				status,
				node_kind: pair.left.kind,
				left_node_id: pair.left.node_id,
				right_node_id: pair.right.node_id,
				match: matchedMatch(pair),
				dimensions: finalDimensions,
				evidence_links: itemEvidenceLinks(pair.left, pair.right, context),
				limitations: [
					...new Set([...ownComparisonLimitations(pair.left), ...ownComparisonLimitations(pair.right)]),
					...matchLimitations(pair),
					...status === "unknown" && !complete ? ["Incomplete graph coverage prevents a complete node-level conclusion."] : [],
					...relationships.unresolved ? ["Relationship target identity remains unresolved; equal node kinds do not establish cross-version alignment."] : []
				]
			};
			return itemWithId(semantic);
		};
		unmatchedItem = (member, context) => member.left === undefined ? rightOnlyItem(member.right, member.candidateLeftNodeIds, context) : leftOnlyItem(member.left, member.candidateRightNodeIds, context);
		leftOnlyItem = (node, candidateNodeIds, context) => {
			const [firstCandidate, ...remainingCandidates] = candidateNodeIds;
			const common = {
				node_kind: node.kind,
				evidence_links: itemEvidenceLinks(node, undefined, context)
			};
			if (firstCandidate !== undefined) return itemWithId({
				...common,
				status: "unknown",
				left_node_id: node.node_id,
				right_node_id: null,
				match: {
					status: "ambiguous",
					basis: "none",
					confidence: "unknown",
					candidate_left_node_ids: [],
					candidate_right_node_ids: [firstCandidate, ...remainingCandidates]
				},
				dimensions: ["availability"],
				limitations: [...ownComparisonLimitations(node), AMBIGUOUS_MATCH_LIMITATION]
			});
			if (ownPresenceUncertain(node) || unresolvedEndpointTarget(node)) return itemWithId({
				...common,
				status: "unknown",
				left_node_id: node.node_id,
				right_node_id: null,
				match: unmatchedMatch(),
				dimensions: ["availability"],
				limitations: ownComparisonLimitations(node)
			});
			const endpointGap = oppositeEndpointUncertain(node, context.rightUnresolvedEndpointKinds);
			const absenceObserved = !endpointGap && absenceClaimable(context.rightGraph.coverage);
			return itemWithId({
				...common,
				status: absenceObserved ? "removed" : "unknown",
				left_node_id: node.node_id,
				right_node_id: null,
				match: unmatchedMatch(),
				dimensions: absenceObserved || endpointGap ? ["availability"] : ["availability", "coverage"],
				limitations: [...ownComparisonLimitations(node), ...endpointGap ? [ENDPOINT_ABSENCE_LIMITATION] : absenceObserved ? [] : [INCOMPLETE_GRAPH_LIMITATION]]
			});
		};
		rightOnlyItem = (node, candidateNodeIds, context) => {
			const [firstCandidate, ...remainingCandidates] = candidateNodeIds;
			const common = {
				node_kind: node.kind,
				evidence_links: itemEvidenceLinks(undefined, node, context)
			};
			if (firstCandidate !== undefined) return itemWithId({
				...common,
				status: "unknown",
				left_node_id: null,
				right_node_id: node.node_id,
				match: {
					status: "ambiguous",
					basis: "none",
					confidence: "unknown",
					candidate_left_node_ids: [firstCandidate, ...remainingCandidates],
					candidate_right_node_ids: []
				},
				dimensions: ["availability"],
				limitations: [...ownComparisonLimitations(node), AMBIGUOUS_MATCH_LIMITATION]
			});
			if (ownPresenceUncertain(node) || unresolvedEndpointTarget(node)) return itemWithId({
				...common,
				status: "unknown",
				left_node_id: null,
				right_node_id: node.node_id,
				match: unmatchedMatch(),
				dimensions: ["availability"],
				limitations: ownComparisonLimitations(node)
			});
			const endpointGap = oppositeEndpointUncertain(node, context.leftUnresolvedEndpointKinds);
			const absenceObserved = !endpointGap && absenceClaimable(context.leftGraph.coverage);
			return itemWithId({
				...common,
				status: absenceObserved ? "added" : "unknown",
				left_node_id: null,
				right_node_id: node.node_id,
				match: unmatchedMatch(),
				dimensions: absenceObserved || endpointGap ? ["availability"] : ["availability", "coverage"],
				limitations: [...ownComparisonLimitations(node), ...endpointGap ? [ENDPOINT_ABSENCE_LIMITATION] : absenceObserved ? [] : [INCOMPLETE_GRAPH_LIMITATION]]
			});
		};
		matchedMatch = (pair) => {
			const candidates = {
				candidate_left_node_ids: [],
				candidate_right_node_ids: []
			};
			switch (pair.basis) {
				case "exact-node-identity":
				case "exact-content-digest":
				case "exact-module-source-digest": return {
					status: "matched",
					basis: pair.basis,
					confidence: "exact",
					...candidates
				};
				case "source-map-identity": return {
					status: "matched",
					basis: pair.basis,
					confidence: "high",
					...candidates
				};
				case "structural-fingerprint":
				case "semantic-key": return {
					status: "matched",
					basis: pair.basis,
					confidence: "medium",
					...candidates
				};
			}
		};
		unmatchedMatch = () => ({
			status: "unmatched",
			basis: "none",
			confidence: "unknown",
			candidate_left_node_ids: [],
			candidate_right_node_ids: []
		});
		AMBIGUOUS_MATCH_LIMITATION = "Multiple nodes share the same permitted match key; no cross-version pair was selected.";
		INCOMPLETE_GRAPH_LIMITATION = "The opposite graph is incomplete, so an unmatched node cannot be classified as added or removed.";
		ENDPOINT_TARGET_LIMITATION = "Endpoint target identity remains unresolved; any matched source site aligns retained syntax, not an established runtime destination.";
		ENDPOINT_ABSENCE_LIMITATION = "An unresolved endpoint of the same kind on the opposite side prevents proving this endpoint target absent.";
		unresolvedEndpointTarget = (node) => node.kind === "endpoint" && applicationEndpointCorrespondence(node).targetResolution !== "exact";
		unresolvedEndpointKinds = (graph) => {
			const kinds = new Set();
			for (const node of graph.nodes) {
				if (node.kind !== "endpoint") continue;
				const identity = applicationEndpointCorrespondence(node);
				if (identity.targetResolution !== "exact") kinds.add(identity.endpointKind);
			}
			return kinds;
		};
		oppositeEndpointUncertain = (node, kinds) => {
			if (node.kind !== "endpoint" || kinds.size === 0) return false;
			const { endpointKind } = applicationEndpointCorrespondence(node);
			return endpointKind === null || kinds.has(null) || kinds.has(endpointKind);
		};
		ownPresenceUncertain = (node) => node.observations.every(({ evidence }) => evidence.state === "unknown" || evidence.state === "unavailable");
		ownComparisonLimitations = (node) => {
			const limitations = new Set();
			const endpointTargetUncertain = unresolvedEndpointTarget(node);
			if (endpointTargetUncertain) limitations.add(ENDPOINT_TARGET_LIMITATION);
			for (const { evidence } of node.observations) if (endpointTargetUncertain || evidence.state === "unknown" || evidence.state === "unavailable") for (const limitation of evidence.limitations) limitations.add(limitation);
			return [...limitations].sort(compareUnicodeCodePoints);
		};
		changedDimensions = (pair, relationships) => {
			const dimensions = [];
			const leftContent = contentIdentity(pair.left);
			const rightContent = contentIdentity(pair.right);
			if (leftContent !== null && rightContent !== null && leftContent !== rightContent) dimensions.push("content");
			if (canonicalJson(locations(pair.left)) !== canonicalJson(locations(pair.right))) dimensions.push("location");
			if (canonicalJson(properties(pair.left)) !== canonicalJson(properties(pair.right))) dimensions.push("properties");
			if (relationships.different) dimensions.push("relationships");
			return dimensions;
		};
		contentIdentity = (node) => {
			if (node.identity.strategy === "content-digest") return `content:${node.identity.sha256}`;
			if (node.kind === "javascript-module") return stringProperty(node, "source_sha256");
			if (node.kind === "source-module" && node.identity.strategy === "source-map-original") return node.identity.source_sha256;
			return null;
		};
		locations = (node) => node.observations.map(({ evidence }) => evidence.location.available ? evidence.location.value : evidence.location).sort((left, right) => compareUnicodeCodePoints(canonicalJson(left), canonicalJson(right)));
		properties = (node) => node.observations.map(({ label, properties: values, source_map_reference }) => ({
			label,
			properties: comparisonPropertyValues(values),
			source_map_reference
		})).sort((left, right) => compareUnicodeCodePoints(canonicalJson(left), canonicalJson(right)));
		comparisonPropertyValues = (values) => {
			const occurrence = javaScriptFileOccurrenceSchema.safeParse(values.file_occurrence);
			if (!occurrence.success) return values;
			return {
				...values,
				file_occurrence: {
					path: occurrence.data.path,
					sha256: occurrence.data.sha256
				}
			};
		};
		indexRelationships = (graph) => {
			const adjacency = new Map();
			const add = (nodeId, relationship) => {
				const existing = adjacency.get(nodeId);
				if (existing === undefined) adjacency.set(nodeId, [relationship]);
				else existing.push(relationship);
			};
			for (const edge of graph.edges) {
				add(edge.source_node_id, {
					direction: "out",
					relation: edge.relation,
					neighborId: edge.target_node_id
				});
				if (edge.target_node_id !== edge.source_node_id) add(edge.target_node_id, {
					direction: "in",
					relation: edge.relation,
					neighborId: edge.source_node_id
				});
			}
			return {
				nodeById: new Map(graph.nodes.map((value) => [value.node_id, value])),
				adjacency
			};
		};
		compareRelationships = (pair, context) => {
			const left = relationshipFacts(pair.left, "left", context);
			const right = relationshipFacts(pair.right, "right", context);
			return {
				different: left.paired !== right.paired || left.unpairedShape !== right.unpairedShape,
				unresolved: left.unresolved || right.unresolved
			};
		};
		relationshipFacts = (node, side, context) => {
			const { nodeById, adjacency } = side === "left" ? context.leftRelationships : context.rightRelationships;
			const paired = side === "left" ? context.pairByLeft : context.pairByRight;
			const matched = [];
			const unpaired = [];
			for (const { direction, relation, neighborId } of adjacency.get(node.node_id) ?? []) {
				const mapped = paired.get(neighborId);
				if (mapped !== undefined) matched.push(`${direction}\0${relation}\0${mapped}`);
				else unpaired.push(`${direction}\0${relation}\0${nodeById.get(neighborId)?.kind ?? "unknown"}`);
			}
			return {
				paired: canonicalJson(matched.sort(compareUnicodeCodePoints)),
				unpairedShape: canonicalJson(unpaired.sort(compareUnicodeCodePoints)),
				unresolved: unpaired.length > 0
			};
		};
		itemEvidenceLinks = (left, right, context) => [...new Set([
			context.leftEvidenceId,
			context.rightEvidenceId,
			...nativeLinks(left, context.leftNativeEvidenceByDigest),
			...nativeLinks(right, context.rightNativeEvidenceByDigest)
		])].sort(compareUnicodeCodePoints);
		nativeLinks = (node, evidenceByDigest) => {
			const identity = node === undefined ? null : contentIdentity(node);
			if (identity === null) return [];
			const digest = identity.replace(/^content:/u, "");
			return evidenceByDigest.get(digest) ?? [];
		};
		indexNativeEvidence = (evidence) => {
			const evidenceByDigest = new Map();
			for (const { evidence_id: id, subject } of evidence) {
				const digest = subject?.digest.sha256;
				if (digest === undefined) continue;
				const ids = evidenceByDigest.get(digest);
				if (ids === undefined) evidenceByDigest.set(digest, [id]);
				else ids.push(id);
			}
			return evidenceByDigest;
		};
		matchLimitations = (pair) => [
			...pair.basis === "structural-fingerprint" ? ["Structural fingerprint equality is rename-resistant inference; it is not byte identity or proof of semantic equivalence."] : [],
			...pair.basis === "source-map-identity" ? ["Source-map original names identify a candidate source lineage; changed or unavailable source content remains explicit."] : [],
			...pair.basis === "semantic-key" ? ["Semantic-key pairing is a deterministic inference and is never promoted to exact identity."] : []
		];
		itemWithId = (semantic) => ({
			...semantic,
			item_id: `javc_item_${digestCanonicalValue(semantic, "Application version item")}`
		});
		stringProperty = (node, key) => {
			const values = [...new Set(node.observations.map(({ properties: values }) => values[key]).filter((value) => typeof value === "string"))];
			return values.length === 1 ? values[0] ?? null : null;
		};
		graphsComplete = (context) => absenceClaimable(context.leftGraph.coverage) && absenceClaimable(context.rightGraph.coverage);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationVersionKeys.js
var matchTiers, matchJavaScriptApplicationVersions, applyTier, nodesByKey, recordCandidates, sortedCandidates, nodeIdentityKey, contentDigestKey, moduleSourceDigestKey, sourceMapKey, structuralFingerprintKey, semanticKey, semanticValue, canonicalPath, firstProperties, firstLabel, uniqueStringProperty, joined, nonEmptyString, exactString, stringList, sortedNodes;
function init_javascriptApplicationVersionKeys() {
	return (init_javascriptApplicationVersionKeys = __esmMin((() => {
		init_comparisonSemantics();
		init_unicodeCodePointOrder();
		init_javascriptApplicationEndpointCorrespondence();
		matchTiers = () => [
			{
				match: {
					basis: "exact-content-digest",
					confidence: "exact"
				},
				key: contentDigestKey
			},
			{
				match: {
					basis: "exact-module-source-digest",
					confidence: "exact"
				},
				key: moduleSourceDigestKey
			},
			{
				match: {
					basis: "exact-node-identity",
					confidence: "exact"
				},
				key: nodeIdentityKey
			},
			{
				match: {
					basis: "source-map-identity",
					confidence: "high"
				},
				key: sourceMapKey
			},
			{
				match: {
					basis: "structural-fingerprint",
					confidence: "medium"
				},
				key: structuralFingerprintKey
			},
			{
				match: {
					basis: "semantic-key",
					confidence: "medium"
				},
				key: semanticKey
			}
		];
		matchJavaScriptApplicationVersions = (leftNodes, rightNodes) => {
			const left = new Map(leftNodes.map((node) => [node.node_id, node]));
			const right = new Map(rightNodes.map((node) => [node.node_id, node]));
			const pairs = [];
			const ambiguousGroups = [];
			for (const tier of matchTiers()) applyTier({
				left,
				right,
				pairs,
				ambiguousGroups,
				tier
			});
			const remainingLeft = sortedNodes(left.values());
			const remainingRight = sortedNodes(right.values());
			const leftCandidates = new Map();
			const rightCandidates = new Map();
			for (const group of ambiguousGroups) {
				const leftGroup = group.left.filter((node) => left.has(node.node_id));
				if (leftGroup.length === 0) continue;
				const rightGroup = group.right.filter((node) => right.has(node.node_id));
				if (rightGroup.length === 0) continue;
				recordCandidates(leftGroup, rightGroup, leftCandidates, rightCandidates);
			}
			return {
				pairs: pairs.sort((a, b) => compareUnicodeCodePoints(`${a.left.node_id}\0${a.right.node_id}`, `${b.left.node_id}\0${b.right.node_id}`)),
				unmatchedLeft: remainingLeft,
				unmatchedRight: remainingRight,
				candidatesForLeft: sortedCandidates(leftCandidates),
				candidatesForRight: sortedCandidates(rightCandidates)
			};
		};
		applyTier = (context) => {
			const leftByKey = nodesByKey(context.left.values(), context.tier.key);
			const rightByKey = nodesByKey(context.right.values(), context.tier.key);
			for (const key of [...leftByKey.keys()].sort(compareUnicodeCodePoints)) {
				const leftGroup = leftByKey.get(key) ?? [];
				const rightGroup = rightByKey.get(key);
				if (rightGroup === undefined) continue;
				if (leftGroup.length !== 1 || rightGroup.length !== 1) {
					context.ambiguousGroups.push({
						left: leftGroup,
						right: rightGroup
					});
					continue;
				}
				const leftNode = leftGroup[0];
				const rightNode = rightGroup[0];
				if (leftNode === undefined || rightNode === undefined) continue;
				context.pairs.push({
					left: leftNode,
					right: rightNode,
					...context.tier.match
				});
				context.left.delete(leftNode.node_id);
				context.right.delete(rightNode.node_id);
			}
		};
		nodesByKey = (nodes, keyFor) => {
			const output = new Map();
			for (const node of nodes) {
				const key = keyFor(node);
				if (key === null) continue;
				const group = output.get(key);
				if (group === undefined) output.set(key, [node]);
				else group.push(node);
			}
			return output;
		};
		recordCandidates = (left, right, leftCandidates, rightCandidates) => {
			for (const leftNode of left) {
				const candidates = leftCandidates.get(leftNode.node_id) ?? new Set();
				for (const rightNode of right) candidates.add(rightNode.node_id);
				leftCandidates.set(leftNode.node_id, candidates);
			}
			for (const rightNode of right) {
				const candidates = rightCandidates.get(rightNode.node_id) ?? new Set();
				for (const leftNode of left) candidates.add(leftNode.node_id);
				rightCandidates.set(rightNode.node_id, candidates);
			}
		};
		sortedCandidates = (candidates) => new Map([...candidates.entries()].map(([nodeId, values]) => [nodeId, [...values].sort(compareUnicodeCodePoints)]));
		nodeIdentityKey = (node) => `node\0${node.kind}\0${node.node_id}`;
		contentDigestKey = (node) => node.identity.strategy === "content-digest" ? `content\0${node.kind}\0${node.identity.sha256}` : null;
		moduleSourceDigestKey = (node) => {
			if (node.kind !== "javascript-module") return null;
			if (node.identity.strategy === "artifact-local-key" && node.identity.namespace === "module-export") {
				const name = uniqueStringProperty(node, "exported_name");
				return name === null ? null : `module-export\0${node.identity.artifact_sha256}\0${name}`;
			}
			const value = uniqueStringProperty(node, "source_sha256");
			return value === null ? null : `module-source\0${node.kind}\0${value}`;
		};
		sourceMapKey = (node) => node.kind === "source-module" && node.identity.strategy === "source-map-original" ? `source-map\0${canonicalJson([node.identity.source_root, node.identity.original_source])}` : null;
		structuralFingerprintKey = (node) => {
			if (node.kind !== "javascript-module") return null;
			const digest = uniqueStringProperty(node, "structural_fingerprint_sha256");
			const algorithm = uniqueStringProperty(node, "structural_fingerprint_algorithm");
			return digest === null || algorithm === null ? null : `structural\0${node.kind}\0${algorithm}\0${digest}`;
		};
		semanticKey = (node) => {
			if ([
				"javascript-module",
				"javascript-chunk",
				"runtime-script-instance",
				"unknown"
			].includes(node.kind)) return null;
			const properties = firstProperties(node);
			const value = semanticValue(node, properties);
			return value === null ? null : `semantic\0${node.kind}\0${value}`;
		};
		semanticValue = (node, properties) => {
			if (node.kind === "endpoint") return applicationEndpointCorrespondence(node).semanticKey;
			if (node.kind === "storage") return joined(properties.storage_kind, properties.name ?? properties.mechanism);
			if (node.kind === "ipc-channel") return properties.resolution === "dynamic" ? null : exactString(properties.channel) ?? firstLabel(node);
			if (node.kind === "context-bridge-api") return firstLabel(node) ?? exactString(properties.api_key) ?? nonEmptyString(properties.api_name);
			if (node.kind === "native-export") return joined(properties.specifier, compositeKey([
				stringList(properties.requested_members),
				typeof properties.namespace_access === "boolean" ? properties.namespace_access : null,
				typeof properties.dynamic_member_access === "boolean" ? properties.dynamic_member_access : null
			])) ?? firstLabel(node);
			if ([
				"electron-main",
				"electron-preload",
				"electron-renderer",
				"electron-utility"
			].includes(node.kind)) return joined(properties.declared_path, properties.resolved_path);
			if (node.kind === "package") return nonEmptyString(properties.name);
			return canonicalPath(node) ?? nonEmptyString(properties.path);
		};
		canonicalPath = (node) => node.identity.strategy === "canonical-path" ? node.identity.path : null;
		firstProperties = (node) => node.observations[0]?.properties ?? {};
		firstLabel = (node) => node.observations.find(({ label }) => label !== null)?.label ?? null;
		uniqueStringProperty = (node, name) => {
			const values = [...new Set(node.observations.map(({ properties }) => properties[name]).filter((value) => typeof value === "string"))];
			return values.length === 1 ? values[0] ?? null : null;
		};
		joined = (...values) => {
			const strings = values.map(nonEmptyString);
			return strings.some((value) => value === null) ? null : compositeKey(strings);
		};
		nonEmptyString = (value) => typeof value === "string" && value !== "" ? value : null;
		exactString = (value) => typeof value === "string" ? value : null;
		stringList = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string").sort(compareUnicodeCodePoints) : [];
		sortedNodes = (nodes) => [...nodes].sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptApplicationVersionComparison.js
var compareJavaScriptApplicationVersions, summary, countStatus$2, matchingSummary, countBasis, comparisonCoverage$2, comparisonLimitations$2;
function init_javascriptApplicationVersionComparison() {
	return (init_javascriptApplicationVersionComparison = __esmMin((() => {
		init_canonicalDigest();
		init_canonicalOrdering();
		init_javascriptApplicationChangeGraph();
		init_javascriptApplicationVersionComparisonSchemas();
		init_javascriptApplicationVersionItems();
		init_javascriptApplicationVersionKeys();
		compareJavaScriptApplicationVersions = (input) => {
			const matching = matchJavaScriptApplicationVersions(input.left.graph.nodes, input.right.graph.nodes);
			const projection = classifyJavaScriptApplicationVersions(matching, {
				leftGraph: input.left.graph,
				rightGraph: input.right.graph,
				leftEvidenceId: input.left.evidenceId,
				rightEvidenceId: input.right.evidenceId,
				leftNativeEvidence: input.leftNativeEvidence,
				rightNativeEvidence: input.rightNativeEvidence
			});
			const changeGraph = buildJavaScriptApplicationChangeGraph({
				left: input.left.graph,
				right: input.right.graph,
				leftEvidenceId: input.left.evidenceId,
				rightEvidenceId: input.right.evidenceId,
				items: projection.items
			});
			const evidenceLinks = uniqueSorted(projection.items.flatMap(({ evidence_links: links }) => links));
			const omissions = {
				left_graph_omitted_count: input.left.graph.coverage.omitted_count,
				right_graph_omitted_count: input.right.graph.coverage.omitted_count
			};
			const coverage = comparisonCoverage$2(input, omissions);
			const semantic = {
				left: {
					evidence_id: input.left.evidenceId,
					graph_id: input.left.graph.graph_id,
					root_artifact_sha256: input.left.rootArtifactSha256
				},
				right: {
					evidence_id: input.right.evidenceId,
					graph_id: input.right.graph.graph_id,
					root_artifact_sha256: input.right.rootArtifactSha256
				},
				summary: summary(projection.items),
				matching: matchingSummary(projection.items),
				items: projection.items,
				graph: changeGraph.graph,
				coverage,
				evidence_links: evidenceLinks,
				limitations: comparisonLimitations$2(input)
			};
			return ownedApplicationVersionComparisonResultSchema.parse({
				...semantic,
				comparison_id: `javc_${digestCanonicalValue(semantic, "Application version comparison")}`
			});
		};
		summary = (items) => ({
			unchanged: countStatus$2(items, "unchanged"),
			added: countStatus$2(items, "added"),
			removed: countStatus$2(items, "removed"),
			changed: countStatus$2(items, "changed"),
			unknown: countStatus$2(items, "unknown")
		});
		countStatus$2 = (items, status) => items.filter((item) => item.status === status).length;
		matchingSummary = (items) => ({
			exact_node_identity: countBasis(items, "exact-node-identity"),
			exact_content_digest: countBasis(items, "exact-content-digest"),
			exact_module_source_digest: countBasis(items, "exact-module-source-digest"),
			source_map_identity: countBasis(items, "source-map-identity"),
			structural_fingerprint: countBasis(items, "structural-fingerprint"),
			semantic_key: countBasis(items, "semantic-key"),
			ambiguous: items.filter(({ match }) => match.status === "ambiguous").length,
			unmatched: items.filter(({ match }) => match.status === "unmatched").length
		});
		countBasis = (items, basis) => items.filter(({ match }) => match.basis === basis).length;
		comparisonCoverage$2 = (input, omissions) => {
			const context = {
				left_graph_status: input.left.graph.coverage.status,
				right_graph_status: input.right.graph.coverage.status
			};
			const sourceGraphsComplete = input.left.graph.coverage.status === "complete" && input.right.graph.coverage.status === "complete";
			const sourceGraphsTruncated = input.left.graph.coverage.truncated || input.right.graph.coverage.truncated;
			return {
				...context,
				...omissions,
				status: sourceGraphsComplete ? "complete-within-inputs" : sourceGraphsTruncated ? "truncated" : "partial"
			};
		};
		comparisonLimitations$2 = (input) => uniqueSorted([
			"Application comparison never uses bundler module ordinals as persistent identity and performs no fuzzy pairing.",
			"Exact digest equality proves byte identity only; source-map, structural-fingerprint, and semantic-key matches retain inferred confidence.",
			"Minified names and chunk locations are not assumed stable across versions.",
			"The comparison reads retained graphs and Evidence only; it does not execute either application.",
			"Native Evidence is linked only by exact subject digest; provider snapshot reuse remains target/provider/profile exact.",
			...input.left.graph.coverage.status === "complete" && input.right.graph.coverage.status === "complete" ? [] : ["At least one source graph is incomplete; unmatched entities on the opposite side remain unknown rather than added or removed."]
		]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptExportShapeSelection.js
var selectJavaScriptExport, retainJavaScriptExportShapes, selectorBase, unresolvedSelection, exportCandidates, candidateKey, returnShapeFor, unavailableReturnShape;
function init_javascriptExportShapeSelection() {
	return (init_javascriptExportShapeSelection = __esmMin((() => {
		init_javascriptExportShapeComparisonSchemas();
		init_unicodeCodePointOrder();
		selectJavaScriptExport = (side) => {
			const candidates = exportCandidates(side.graph);
			const exact = candidates.filter(({ modulePath, exportName }) => modulePath === side.modulePath && exportName === side.exportName);
			const matchingOneSelector = candidates.filter(({ modulePath, exportName }) => modulePath === side.modulePath || exportName === side.exportName);
			const diagnosticPool = exact.length > 0 ? exact : matchingOneSelector.length > 0 ? matchingOneSelector : candidates;
			const base = selectorBase(side, diagnosticPool);
			if (exact.length === 0) return unresolvedSelection(base, {
				status: "missing",
				selected_node_id: null
			}, [`No exact export binding matched ${side.modulePath}:${side.exportName}.`]);
			if (exact.length > 1) return unresolvedSelection(base, {
				status: "ambiguous",
				selected_node_id: null
			}, [`Multiple exact export bindings matched ${side.modulePath}:${side.exportName}; none was selected.`]);
			const selected = exact[0];
			if (selected === undefined || !selected.trusted) return unresolvedSelection(base, {
				status: "unavailable",
				selected_node_id: selected?.node.node_id ?? null
			}, ["The exact export binding lacks the expected static-analysis authority."]);
			const returnShape = returnShapeFor(selected.node, side);
			if (returnShape.projection === null) return unresolvedSelection(base, {
				status: "unavailable",
				selected_node_id: selected.node.node_id
			}, [returnShape.reason]);
			return {
				selection: {
					...base,
					status: "selected",
					selected_node_id: selected.node.node_id
				},
				projection: returnShape.projection,
				observationComplete: returnShape.observationComplete,
				limitations: []
			};
		};
		retainJavaScriptExportShapes = (selection) => ({
			shapes: selection.projection?.static_return_shapes ?? [],
			omitted: 0
		});
		selectorBase = (side, candidates) => ({
			evidence_id: side.evidenceId,
			graph_id: side.graph.graph_id,
			requested_module_path: side.modulePath,
			requested_export_name: side.exportName,
			candidates: candidates.map((candidate) => ({
				node_id: candidate.node.node_id,
				module_path: candidate.modulePath,
				export_name: candidate.exportName,
				matches_requested_module: candidate.modulePath === side.modulePath,
				matches_requested_export: candidate.exportName === side.exportName
			})),
			omitted_candidates: 0
		});
		unresolvedSelection = (base, resolution, limitations) => ({
			selection: {
				...base,
				...resolution
			},
			projection: null,
			observationComplete: false,
			limitations
		});
		exportCandidates = (graph) => {
			const candidates = new Map();
			for (const node of graph.nodes) {
				for (const observation of node.observations) {
					const properties = observation.properties;
					if (properties.semantic_role !== "export-binding") continue;
					const modulePath = properties.module_path;
					const exportName = properties.exported_name;
					if (typeof modulePath !== "string" || typeof exportName !== "string") continue;
					const key = `${node.node_id}\0${modulePath}\0${exportName}`;
					const trusted = observation.evidence.authority === "ast-static-analysis" && observation.evidence.state === "observed" && observation.evidence.extractor.operation === "recover-module-export";
					const existing = candidates.get(key);
					candidates.set(key, {
						node,
						modulePath,
						exportName,
						trusted: trusted || existing?.trusted === true
					});
				}
			}
			return [...candidates.values()].sort((left, right) => compareUnicodeCodePoints(candidateKey(left), candidateKey(right)));
		};
		candidateKey = (candidate) => `${candidate.modulePath}\0${candidate.exportName}\0${candidate.node.node_id}`;
		returnShapeFor = (node, side) => {
			const roleObservations = node.observations.filter(({ properties }) => properties.semantic_role === "export-return-shapes");
			const parsed = roleObservations.map((observation) => ({
				observation,
				result: projectedExportReturnShapesSchema.safeParse(observation.properties)
			}));
			if (parsed.some(({ result }) => !result.success)) return unavailableReturnShape("The export return-shape observation is malformed.");
			const matching = parsed.filter(({ result }) => result.success && result.data.module_path === side.modulePath && result.data.exported_name === side.exportName);
			if (matching.length !== 1) return unavailableReturnShape(matching.length === 0 ? "No exact static return-shape observation is available for the selected export." : "Multiple static return-shape observations matched the selected export.");
			const selected = matching[0];
			if (selected === undefined || !selected.result.success) return unavailableReturnShape("The selected return-shape observation could not be parsed.");
			const { observation } = selected;
			const trusted = observation.evidence.authority === "static-relationship-inference" && observation.evidence.state === "inferred" && observation.evidence.extractor.operation === "recover-export-return-shapes";
			if (!trusted) return unavailableReturnShape("The return-shape observation lacks the expected static-inference authority.");
			return {
				projection: selected.result.data,
				observationComplete: observation.evidence.coverage.status === "complete" && !observation.evidence.coverage.truncated
			};
		};
		unavailableReturnShape = (reason) => ({
			projection: null,
			observationComplete: false,
			reason
		});
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptExportShapeVariants.js
var UNKNOWN_COVERAGE_PRESENCE, pairJavaScriptExportShapeVariants, buildJavaScriptExportShapeChanges, buildJavaScriptExportShapeInventories, inventoryFor, hasPartialJavaScriptExportPropertyCoverage, discriminantOccurrences, reciprocalPairs, addTarget, indexesNotIn, compareDiscriminants, selectionUnknownChange, emptyShapeUnknownChange, diffPair, fieldAtPath, fieldChangeStatus, fieldPresence, parentPointer, fieldAvailability, selectionAvailability, emptyShapeAvailability, unpairedChange, changeWithId, literalValue, primitiveArray, isPrimitive, capitalize;
function init_javascriptExportShapeVariants() {
	return (init_javascriptExportShapeVariants = __esmMin((() => {
		init_comparisonSemantics();
		init_canonicalDigest();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		UNKNOWN_COVERAGE_PRESENCE = {
			left: "unknown-coverage",
			right: "unknown-coverage"
		};
		pairJavaScriptExportShapeVariants = (left, right) => {
			const leftKeys = discriminantOccurrences(left);
			const rightKeys = discriminantOccurrences(right);
			const edges = new Map();
			const leftTargets = new Map();
			const rightTargets = new Map();
			for (const [key, leftOccurrence] of leftKeys) {
				const rightOccurrence = rightKeys.get(key);
				if (leftOccurrence.indexes.length !== 1 || rightOccurrence?.indexes.length !== 1) continue;
				const leftIndex = leftOccurrence.indexes[0];
				const rightIndex = rightOccurrence.indexes[0];
				if (leftIndex === undefined || rightIndex === undefined) continue;
				const edgeKey = `${String(leftIndex)}:${String(rightIndex)}`;
				edges.set(edgeKey, [...edges.get(edgeKey) ?? [], leftOccurrence.discriminant]);
				addTarget(leftTargets, leftIndex, rightIndex);
				addTarget(rightTargets, rightIndex, leftIndex);
			}
			const pairs = reciprocalPairs(leftTargets, rightTargets, edges);
			const pairedLeft = new Set(pairs.map(({ leftIndex }) => leftIndex));
			const pairedRight = new Set(pairs.map(({ rightIndex }) => rightIndex));
			return {
				pairs,
				unpairedLeft: indexesNotIn(left, pairedLeft),
				unpairedRight: indexesNotIn(right, pairedRight)
			};
		};
		buildJavaScriptExportShapeChanges = (input) => {
			if (input.leftSelection.selection.status !== "selected" || input.rightSelection.selection.status !== "selected") return [selectionUnknownChange(input)];
			if (input.leftShapes.length === 0 && input.rightShapes.length === 0) return [emptyShapeUnknownChange(input)];
			const paired = input.pairing.pairs.flatMap((pair) => {
				const left = input.leftShapes[pair.leftIndex];
				const right = input.rightShapes[pair.rightIndex];
				return left === undefined || right === undefined ? [] : diffPair(left, right, pair.discriminant, input.evidenceLinks);
			});
			const unpairedLeft = input.pairing.unpairedLeft.flatMap((index) => {
				const shape = input.leftShapes[index];
				return shape === undefined ? [] : [unpairedChange("left", shape, input.evidenceLinks)];
			});
			const unpairedRight = input.pairing.unpairedRight.flatMap((index) => {
				const shape = input.rightShapes[index];
				return shape === undefined ? [] : [unpairedChange("right", shape, input.evidenceLinks)];
			});
			return [
				...paired,
				...unpairedLeft,
				...unpairedRight
			];
		};
		buildJavaScriptExportShapeInventories = (input) => {
			const leftPairs = new Map(input.pairing.pairs.map((pair) => [pair.leftIndex, pair]));
			const rightPairs = new Map(input.pairing.pairs.map((pair) => [pair.rightIndex, pair]));
			return [...input.leftShapes.map((shape, index) => inventoryFor("left", index, shape, leftPairs.get(index))), ...input.rightShapes.map((shape, index) => inventoryFor("right", index, shape, rightPairs.get(index)))];
		};
		inventoryFor = (side, variantIndex, shape, pair) => ({
			side,
			variant_index: variantIndex,
			discriminant: pair?.discriminant ?? null,
			paired: pair !== undefined,
			source_range: shape.source_range,
			properties: uniqueSorted([...shape.fields.filter((field) => fieldPresence(shape, field, field.path) === "present").map(({ path }) => path), ...shape.property_coverage.map(({ path }) => path)]).filter((path) => path !== ""),
			property_coverage: shape.property_coverage.map(({ path, status }) => ({
				path,
				status
			}))
		});
		hasPartialJavaScriptExportPropertyCoverage = (shapes) => shapes.some((shape) => shape.property_coverage.some(({ status }) => status === "partial") || shape.fields.some((field) => fieldPresence(shape, field, field.path) === "unknown-coverage"));
		discriminantOccurrences = (shapes) => {
			const output = new Map();
			shapes.forEach((shape, index) => {
				for (const field of shape.fields) {
					if (fieldPresence(shape, field, field.path) !== "present") continue;
					const value = literalValue(field);
					if (!value.found) continue;
					const discriminant = {
						path: field.path,
						value: value.value
					};
					const key = canonicalJson(discriminant, "JavaScript export shape comparison");
					const current = output.get(key);
					output.set(key, {
						discriminant,
						indexes: [...current?.indexes ?? [], index]
					});
				}
			});
			return output;
		};
		reciprocalPairs = (leftTargets, rightTargets, edges) => {
			const pairs = [];
			for (const [leftIndex, targets] of leftTargets) {
				if (targets.size !== 1) continue;
				const rightIndex = [...targets][0];
				if (rightIndex === undefined || rightTargets.get(rightIndex)?.size !== 1 || !rightTargets.get(rightIndex)?.has(leftIndex)) continue;
				const discriminants = edges.get(`${String(leftIndex)}:${String(rightIndex)}`)?.toSorted(compareDiscriminants);
				const discriminant = discriminants?.[0];
				if (discriminant !== undefined) pairs.push({
					leftIndex,
					rightIndex,
					discriminant
				});
			}
			return pairs.sort((first, second) => compareDiscriminants(first.discriminant, second.discriminant));
		};
		addTarget = (map, source, target) => {
			const values = map.get(source) ?? new Set();
			values.add(target);
			map.set(source, values);
		};
		indexesNotIn = (shapes, paired) => shapes.map((_, index) => index).filter((index) => !paired.has(index));
		compareDiscriminants = (left, right) => compareUnicodeCodePoints(canonicalJson(left, "JavaScript export shape comparison"), canonicalJson(right, "JavaScript export shape comparison"));
		selectionUnknownChange = (input) => changeWithId({
			status: "unknown",
			path: "",
			discriminant: null,
			presence: UNKNOWN_COVERAGE_PRESENCE,
			left: selectionAvailability(input.leftSelection.selection, "left"),
			right: selectionAvailability(input.rightSelection.selection, "right"),
			left_source_range: null,
			right_source_range: null,
			evidence_links: input.evidenceLinks,
			limitations: ["Both selectors must resolve one exact export with trusted static return shapes before comparison."]
		});
		emptyShapeUnknownChange = (input) => changeWithId({
			status: "unknown",
			path: "",
			discriminant: null,
			presence: UNKNOWN_COVERAGE_PRESENCE,
			left: emptyShapeAvailability(input.leftShapes, "left"),
			right: emptyShapeAvailability(input.rightShapes, "right"),
			left_source_range: null,
			right_source_range: null,
			evidence_links: input.evidenceLinks,
			limitations: ["At least one selected export has no retained direct return shape."]
		});
		diffPair = (left, right, discriminant, evidenceLinks) => {
			const leftFields = new Map(left.fields.map((field) => [field.path, field]));
			const rightFields = new Map(right.fields.map((field) => [field.path, field]));
			const paths = uniqueSorted([
				...leftFields.keys(),
				...rightFields.keys(),
				...left.property_coverage.map(({ path }) => path),
				...right.property_coverage.map(({ path }) => path)
			]);
			return paths.flatMap((path) => {
				const leftField = fieldAtPath(left, leftFields, path);
				const rightField = fieldAtPath(right, rightFields, path);
				const leftPresence = fieldPresence(left, leftField, path);
				const rightPresence = fieldPresence(right, rightField, path);
				const status = fieldChangeStatus({
					leftPresence,
					rightPresence,
					leftField,
					rightField
				});
				if (status === null) return [];
				return [changeWithId({
					status,
					path,
					discriminant,
					presence: {
						left: leftPresence,
						right: rightPresence
					},
					left: fieldAvailability(leftField, leftPresence),
					right: fieldAvailability(rightField, rightPresence),
					left_source_range: left.source_range,
					right_source_range: right.source_range,
					evidence_links: evidenceLinks,
					limitations: status === "unknown" ? ["The static value or relevant parent-property coverage is incomplete."] : []
				})];
			});
		};
		fieldAtPath = (shape, fields, path) => {
			const field = fields.get(path);
			if (field !== undefined) return field;
			if (!shape.property_coverage.some((coverage) => coverage.path === path)) return undefined;
			return {
				path,
				presence: "present",
				state: "unknown",
				value: null,
				reason: "A static container is retained at this path, but no primitive field value is projected."
			};
		};
		fieldChangeStatus = ({ leftPresence, rightPresence, leftField, rightField }) => {
			if (leftField !== undefined && rightField !== undefined && canonicalJson(leftField, "JavaScript export shape comparison") === canonicalJson(rightField, "JavaScript export shape comparison")) return null;
			if (leftPresence === "absent" && rightPresence === "absent") return null;
			if (leftPresence === "unknown-coverage" || rightPresence === "unknown-coverage") return "unknown";
			if (leftPresence === "absent") return "added";
			if (rightPresence === "absent") return "removed";
			if (leftField !== undefined && rightField !== undefined) {
				return leftField.state === "unknown" || rightField.state === "unknown" ? "unknown" : "changed";
			}
			return null;
		};
		fieldPresence = (shape, field, path) => {
			if (field !== undefined) return field.presence;
			for (let parent = parentPointer(path); parent !== null; parent = parentPointer(parent)) {
				const coverage = shape.property_coverage.find((entry) => entry.path === parent);
				if (coverage?.status === "complete") return "absent";
				const ancestor = shape.fields.find((entry) => entry.path === parent);
				if (ancestor !== undefined) return ancestor.presence === "absent" ? "absent" : "unknown-coverage";
				if (coverage !== undefined) return "unknown-coverage";
			}
			return "unknown-coverage";
		};
		parentPointer = (path) => {
			if (path === "") return null;
			const separator = path.lastIndexOf("/");
			return separator < 0 ? null : path.slice(0, separator);
		};
		fieldAvailability = (field, presence) => {
			if (field === undefined && presence === "unknown-coverage") return {
				availability: "unknown",
				reason: "Property presence is not established by the retained parent coverage."
			};
			if (field === undefined || field.presence === "absent") return { availability: "absent" };
			if (field.state === "unknown") return {
				availability: "unknown",
				reason: field.reason ?? "Static field value is unknown."
			};
			if (field.state === "union") return {
				availability: "union",
				values: primitiveArray(field.value)
			};
			const literal = literalValue(field);
			return literal.found ? {
				availability: "literal",
				value: literal.value
			} : {
				availability: "unknown",
				reason: "Static literal field failed its projection boundary."
			};
		};
		selectionAvailability = (selection, side) => ({
			availability: "unknown",
			reason: selection.status === "selected" ? `${capitalize(side)} export is selected; the counterpart selection is unavailable for comparison.` : `${capitalize(side)} export selection is ${selection.status}.`
		});
		emptyShapeAvailability = (shapes, side) => ({
			availability: "unknown",
			reason: shapes.length === 0 ? `${capitalize(side)} export has no retained direct return shape.` : `${capitalize(side)} export return shape cannot be paired without an opposite variant.`
		});
		unpairedChange = (side, shape, evidenceLinks) => changeWithId({
			status: "unknown",
			path: "",
			discriminant: null,
			presence: UNKNOWN_COVERAGE_PRESENCE,
			left: {
				availability: "unknown",
				reason: side === "left" ? "Left return variant has no unique exact cross-version pairing." : "No left return variant was uniquely paired with this right variant."
			},
			right: {
				availability: "unknown",
				reason: side === "right" ? "Right return variant has no unique exact cross-version pairing." : "No right return variant was uniquely paired with this left variant."
			},
			left_source_range: side === "left" ? shape.source_range : null,
			right_source_range: side === "right" ? shape.source_range : null,
			evidence_links: evidenceLinks,
			limitations: ["The return variant was not paired because no reciprocal unique literal discriminant exists."]
		});
		changeWithId = (semantic) => ({
			...semantic,
			change_id: `jesc_change_${digestCanonicalValue(semantic, "JavaScript export shape comparison")}`
		});
		literalValue = (field) => field.state === "literal" && isPrimitive(field.value) ? {
			found: true,
			value: field.value
		} : { found: false };
		primitiveArray = (value) => Array.isArray(value) ? value.filter(isPrimitive) : [];
		isPrimitive = (value) => value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
		capitalize = (value) => `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptExportShapeComparison.js
var compareJavaScriptExportShapes, sortChanges, comparisonCoverage$1, comparisonTruncated, sourceProjectionTruncated, comparisonPartial, selectionPartial, comparisonLimitations$1, summarize, countStatus$1, evidencePair;
function init_javascriptExportShapeComparison() {
	return (init_javascriptExportShapeComparison = __esmMin((() => {
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_comparisonSemantics();
		init_canonicalDigest();
		init_javascriptExportShapeComparisonSchemas();
		init_javascriptExportShapeSelection();
		init_javascriptExportShapeVariants();
		compareJavaScriptExportShapes = (input) => {
			const left = selectJavaScriptExport(input.left);
			const right = selectJavaScriptExport(input.right);
			const leftRetained = retainJavaScriptExportShapes(left);
			const rightRetained = retainJavaScriptExportShapes(right);
			const pairing = pairJavaScriptExportShapeVariants(leftRetained.shapes, rightRetained.shapes);
			const evidenceLinks = evidencePair(input.left.evidenceId, input.right.evidenceId);
			const allChanges = sortChanges(buildJavaScriptExportShapeChanges({
				leftSelection: left,
				rightSelection: right,
				pairing,
				leftShapes: leftRetained.shapes,
				rightShapes: rightRetained.shapes,
				evidenceLinks
			}));
			const changes = allChanges;
			const omittedChanges = 0;
			const propertyInventories = buildJavaScriptExportShapeInventories({
				pairing,
				leftShapes: leftRetained.shapes,
				rightShapes: rightRetained.shapes
			});
			const coverage = comparisonCoverage$1({
				input,
				left,
				right,
				leftRetained,
				rightRetained,
				pairing,
				allChanges,
				omittedChanges
			});
			const limitations = comparisonLimitations$1(left, right, coverage.status);
			const semantic = {
				left: left.selection,
				right: right.selection,
				property_inventories: propertyInventories,
				summary: summarize(allChanges),
				changes,
				coverage,
				evidence_links: evidenceLinks,
				limitations
			};
			return javaScriptExportShapeComparisonResultSchema.parse({
				...semantic,
				comparison_id: `jesc_${digestCanonicalValue(semantic, "JavaScript export shape comparison")}`
			});
		};
		sortChanges = (changes) => changes.map((change, index) => ({
			change,
			index,
			sortKey: canonicalJson({
				discriminant: change.discriminant,
				path: change.path,
				status: change.status,
				left_source_range: change.left_source_range,
				right_source_range: change.right_source_range,
				change_id: change.change_id
			}, "JavaScript export shape comparison")
		})).sort((left, right) => compareUnicodeCodePoints(left.sortKey, right.sortKey) || left.index - right.index).map(({ change }) => change);
		comparisonCoverage$1 = (context) => {
			const leftSource = context.left.projection?.return_shape_coverage;
			const rightSource = context.right.projection?.return_shape_coverage;
			const omittedCandidates = context.left.selection.omitted_candidates + context.right.selection.omitted_candidates;
			const truncated = comparisonTruncated(context, omittedCandidates);
			const partial = comparisonPartial(context);
			return {
				status: truncated ? "truncated" : partial ? "partial" : "complete-within-inputs",
				left_graph_status: context.input.left.graph.coverage.status,
				right_graph_status: context.input.right.graph.coverage.status,
				paired_variants: context.pairing.pairs.length,
				unpaired_left_variants: context.pairing.unpairedLeft.length,
				unpaired_right_variants: context.pairing.unpairedRight.length,
				omitted_left_variants: context.leftRetained.omitted,
				omitted_right_variants: context.rightRetained.omitted,
				left_source_omitted_variants: leftSource?.omitted_return_sites ?? null,
				right_source_omitted_variants: rightSource?.omitted_return_sites ?? null,
				left_omitted_fields: leftSource?.omitted_fields ?? 0,
				right_omitted_fields: rightSource?.omitted_fields ?? 0,
				left_omitted_property_coverage: leftSource?.omitted_property_coverage ?? 0,
				right_omitted_property_coverage: rightSource?.omitted_property_coverage ?? 0,
				omitted_candidates: omittedCandidates,
				omitted_changes: context.omittedChanges
			};
		};
		comparisonTruncated = (context, omittedCandidates) => context.leftRetained.omitted > 0 || context.rightRetained.omitted > 0 || omittedCandidates > 0 || context.omittedChanges > 0 || sourceProjectionTruncated(context.left) || sourceProjectionTruncated(context.right);
		sourceProjectionTruncated = (selection) => {
			const coverage = selection.projection?.return_shape_coverage;
			if (coverage === undefined) return false;
			return coverage.status === "truncated" || coverage.omitted_fields > 0 || coverage.omitted_property_coverage > 0 || coverage.projection_complete === false;
		};
		comparisonPartial = (context) => selectionPartial(context.left) || selectionPartial(context.right) || context.input.left.graph.coverage.status !== "complete" || context.input.right.graph.coverage.status !== "complete" || hasPartialJavaScriptExportPropertyCoverage(context.leftRetained.shapes) || hasPartialJavaScriptExportPropertyCoverage(context.rightRetained.shapes) || context.pairing.unpairedLeft.length > 0 || context.pairing.unpairedRight.length > 0 || context.allChanges.some(({ status }) => status === "unknown");
		selectionPartial = (selection) => {
			const coverage = selection.projection?.return_shape_coverage;
			return selection.selection.status !== "selected" || !selection.observationComplete || coverage?.status !== "complete" || coverage.projection_complete !== true;
		};
		comparisonLimitations$1 = (left, right, status) => uniqueSorted([
			"Return shapes are inferred from inert syntax and do not prove runtime behavior.",
			"Return variants are paired only by unique exact literal discriminants, never by source order.",
			"Dynamic values, incomplete object coverage, and ambiguous variants remain unknown.",
			"This static comparison cannot establish runtime semantics; run behavioral probes directly against the relevant application versions when that evidence is required.",
			...left.limitations,
			...right.limitations,
			...status === "truncated" ? ["Comparison output or source return-shape recovery reached an explicit limit."] : [],
			...status === "partial" ? ["At least one selector, graph, return shape, or property boundary is incomplete."] : []
		]);
		summarize = (changes) => ({
			added: countStatus$1(changes, "added"),
			removed: countStatus$1(changes, "removed"),
			changed: countStatus$1(changes, "changed"),
			unknown: countStatus$1(changes, "unknown")
		});
		countStatus$1 = (changes, status) => changes.filter((change) => change.status === status).length;
		evidencePair = (left, right) => [left, right];
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptFeatureSeed.js
var findApplicationFeatureSeeds, seedMatch, kindMatches, candidateFields, memberFieldSuffixes, relevantFields, identityFields, propertyFields, normalized;
function init_javascriptFeatureSeed() {
	return (init_javascriptFeatureSeed = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_javascriptFeatureTraceSchemas();
		findApplicationFeatureSeeds = (nodes, seed) => nodes.flatMap((node) => seedMatch(node, seed)).sort((left, right) => compareUnicodeCodePoints(`${left.node_id}\0${left.basis}\0${left.field}`, `${right.node_id}\0${right.basis}\0${right.field}`));
		seedMatch = (node, seed) => {
			const mode = featureSeedMatchMode(seed);
			const caseSensitive = seed.case_sensitive;
			const query = normalized(seed.value, caseSensitive);
			if (!kindMatches(node, seed.kind)) return [];
			const requestedEntryPath = seed.kind === "api" && "entry_path" in seed ? seed.entry_path : undefined;
			if (seed.kind === "api" && requestedEntryPath !== undefined && !node.observations.some(({ properties }) => {
				const entryPath = properties.entry_path;
				return Array.isArray(entryPath) && entryPath.length === requestedEntryPath.length && entryPath.every((segment, index) => segment === requestedEntryPath[index]);
			})) return [];
			const match = candidateFields(node, seed.kind).find((candidate) => {
				const value = normalized(candidate.value, caseSensitive);
				return mode === "exact" ? value === query : value.includes(query);
			});
			return match === undefined ? [] : [{
				node_id: node.node_id,
				kind: node.kind,
				basis: match.basis,
				field: match.field
			}];
		};
		kindMatches = (node, kind) => {
			if (kind === "string" || kind === "node-id") return true;
			if (kind === "route") return node.kind === "endpoint" && node.observations.some(({ properties }) => properties.endpoint_kind === "route");
			if (kind === "api") return node.kind === "context-bridge-api" || node.kind === "javascript-expression" && node.observations.some((o) => o.properties.step_kind === "exposure");
			if (kind === "channel") return node.kind === "ipc-channel";
			if (kind === "module") return [
				"javascript-asset",
				"javascript-module",
				"source-module"
			].includes(node.kind);
			return node.kind === "native-export";
		};
		candidateFields = (node, seedKind) => {
			if (seedKind === "node-id") return [{
				basis: "node-id",
				field: "node_id",
				value: node.node_id
			}];
			if (seedKind === "route") return node.observations.flatMap((observation, index) => ["value", "path"].flatMap((key) => {
				const value = observation.properties[key];
				return typeof value === "string" ? [{
					basis: "property",
					field: `observations[${String(index)}].properties.${key}`,
					value
				}] : [];
			}));
			const fields = [...identityFields(node), ...node.observations.flatMap((observation, index) => [
				...observation.label === null ? [] : [{
					basis: "label",
					field: `observations[${String(index)}].label`,
					value: observation.label
				}],
				...observation.source_map_reference !== null && observation.source_map_reference.resolution.kind !== "unresolved" ? [{
					basis: "property",
					field: `observations[${String(index)}].source_map_reference.resolution.path`,
					value: observation.source_map_reference.resolution.path
				}] : [],
				...propertyFields(observation.properties, `observations[${String(index)}].properties`)
			])];
			if (seedKind === "string") return fields;
			const names = relevantFields[seedKind];
			return fields.filter(({ field, selectionPath = field }) => names.some((name) => {
				const path = memberFieldSuffixes.has(name) ? selectionPath : field;
				return path === "identity" || path.endsWith(name);
			}));
		};
		memberFieldSuffixes = new Set([
			".members",
			".methods",
			".exports",
			".requested_members"
		]);
		relevantFields = {
			route: [
				".label",
				".value",
				".path"
			],
			api: [
				".label",
				".api_name",
				".api_key",
				".key",
				".methods",
				".members"
			],
			channel: [
				".label",
				".channel",
				".key"
			],
			module: [
				".label",
				".module_key",
				".path",
				".source",
				".original_source",
				".source_root",
				".exports"
			],
			"native-export": [
				".label",
				".key",
				".requested_members",
				".members"
			]
		};
		identityFields = (node) => {
			const identity = node.identity;
			if (identity.strategy === "content-digest") return [{
				basis: "identity",
				field: "identity",
				value: identity.sha256
			}];
			if (identity.strategy === "source-map-original") return [{
				basis: "identity",
				field: "identity.original_source",
				value: identity.original_source
			}, ...identity.source_root === null ? [] : [{
				basis: "identity",
				field: "identity.source_root",
				value: identity.source_root
			}]];
			if (identity.strategy === "canonical-path") return [{
				basis: "identity",
				field: "identity.path",
				value: identity.path
			}];
			if (identity.strategy === "artifact-local-key") return [{
				basis: "identity",
				field: "identity.key",
				value: identity.key
			}];
			if (identity.strategy === "runtime-instance") return [{
				basis: "identity",
				field: "identity.runtime_key",
				value: identity.runtime_key
			}];
			return [];
		};
		propertyFields = (value, prefix) => {
			const output = [];
			const pending = [{
				current: value,
				path: prefix,
				selectionPath: prefix
			}];
			while (pending.length > 0) {
				const next = pending.pop();
				if (next === undefined) continue;
				const { current, path, selectionPath } = next;
				if (typeof current === "string") {
					output.push({
						basis: "property",
						field: path,
						selectionPath,
						value: current
					});
					continue;
				}
				if (Array.isArray(current)) {
					for (let index = current.length - 1; index >= 0; index -= 1) {
						const item = current[index];
						if (item !== undefined) pending.push({
							current: item,
							path: `${path}[${String(index)}]`,
							selectionPath
						});
					}
					continue;
				}
				if (current !== null && typeof current === "object") {
					for (const key of Object.keys(current).sort(compareUnicodeCodePoints).reverse()) pending.push({
						current: current[key] ?? null,
						path: `${path}.${key}`,
						selectionPath: `${selectionPath}.${key}`
					});
				}
			}
			return output;
		};
		normalized = (value, caseSensitive) => {
			const normalizedValue = value.normalize(caseSensitive ? "NFC" : "NFKC");
			return caseSensitive ? normalizedValue : normalizedValue.toLocaleLowerCase("en-US");
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptFeatureTraversal.js
var traverseApplicationFeature, buildAdjacency, addAdjacency;
function init_javascriptFeatureTraversal() {
	return (init_javascriptFeatureTraversal = __esmMin((() => {
		init_unicodeCodePointOrder();
		traverseApplicationFeature = (graph, seedNodeIds, direction) => {
			const nodeById = new Map(graph.nodes.map((node) => [node.node_id, node]));
			const adjacency = buildAdjacency(graph.edges, direction);
			const visited = new Set(seedNodeIds);
			const retainedEdges = new Map();
			const predecessors = new Map();
			const queue = [...seedNodeIds];
			for (let offset = 0; offset < queue.length; offset += 1) {
				const current = queue[offset];
				if (current === undefined) continue;
				for (const entry of adjacency.get(current) ?? []) {
					retainedEdges.set(entry.edge.edge_id, entry.edge);
					if (visited.has(entry.nextNodeId)) continue;
					if (!nodeById.has(entry.nextNodeId)) continue;
					visited.add(entry.nextNodeId);
					predecessors.set(entry.nextNodeId, {
						previousNodeId: current,
						edgeId: entry.edge.edge_id
					});
					queue.push(entry.nextNodeId);
				}
			}
			return {
				nodes: [...visited].map((nodeId) => nodeById.get(nodeId)).filter((node) => node !== undefined).sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id)),
				edges: [...retainedEdges.values()].sort((left, right) => compareUnicodeCodePoints(left.edge_id, right.edge_id)),
				predecessors
			};
		};
		buildAdjacency = (edges, direction) => {
			const adjacency = new Map();
			for (const edge of edges) {
				if (direction !== "incoming") addAdjacency(adjacency, edge.source_node_id, {
					edge,
					nextNodeId: edge.target_node_id
				});
				if (direction !== "outgoing") addAdjacency(adjacency, edge.target_node_id, {
					edge,
					nextNodeId: edge.source_node_id
				});
			}
			for (const entries of adjacency.values()) entries.sort((left, right) => compareUnicodeCodePoints(`${left.edge.edge_id}\0${left.nextNodeId}`, `${right.edge.edge_id}\0${right.nextNodeId}`));
			return adjacency;
		};
		addAdjacency = (adjacency, nodeId, entry) => {
			const entries = adjacency.get(nodeId);
			if (entries === undefined) adjacency.set(nodeId, [entry]);
			else entries.push(entry);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptNativeHandoff.js
var buildJavaScriptNativeHandoffs, artifactPath, nativeExportNodes, requestedExports, stringArray, uniqueProviders;
function init_javascriptNativeHandoff() {
	return (init_javascriptNativeHandoff = __esmMin((() => {
		init_unicodeCodePointOrder();
		buildJavaScriptNativeHandoffs = (graph, selectedNativeNodeIds, nativeEvidence) => {
			let nodeById;
			return graph.nodes.filter(({ kind, node_id }) => kind === "native-addon" && selectedNativeNodeIds.has(node_id)).flatMap((node) => {
				if (node.identity.strategy !== "content-digest") return [];
				const digest = node.identity.sha256;
				const linked = nativeEvidence.filter(({ subject }) => subject?.digest.sha256 === digest);
				nodeById ??= new Map(graph.nodes.map((candidate) => [candidate.node_id, candidate]));
				const exportNodes = nativeExportNodes(node, graph.edges, nodeById);
				return [{
					native_node_id: node.node_id,
					artifact_sha256: digest,
					artifact_path: artifactPath(node),
					export_node_ids: exportNodes.map(({ node_id: id }) => id),
					requested_exports: requestedExports(exportNodes),
					status: linked.length === 0 ? "requires-provider-analysis" : "evidence-linked",
					providers: uniqueProviders(linked),
					evidence_ids: linked.map(({ evidence_id: id }) => id).sort(compareUnicodeCodePoints),
					recommended_tools: [
						"open_binary",
						"binary_overview",
						"search_procedures",
						"analyze_function",
						"xrefs"
					]
				}];
			}).sort((left, right) => compareUnicodeCodePoints(left.native_node_id, right.native_node_id));
		};
		artifactPath = (node) => {
			for (const { evidence } of node.observations) if (evidence.location.available && evidence.location.value.kind === "artifact-path") return evidence.location.value.path;
			return null;
		};
		nativeExportNodes = (addon, edges, nodeById) => {
			const ids = edges.flatMap((edge) => {
				if (edge.source_node_id === addon.node_id && ["contains", "exposes"].includes(edge.relation)) return [edge.target_node_id];
				if (edge.target_node_id === addon.node_id && ["imports", "loads"].includes(edge.relation)) return [edge.source_node_id];
				return [];
			});
			return [...new Set(ids)].map((id) => nodeById.get(id)).filter((node) => node?.kind === "native-export").sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
		};
		requestedExports = (nodes) => {
			const values = nodes.flatMap((node) => node.observations.flatMap((observation) => [
				...observation.label === null || Array.isArray(observation.properties.requested_members) ? [] : [observation.label],
				...stringArray(observation.properties.requested_members),
				...stringArray(observation.properties.members)
			]));
			return [...new Set(values)].sort(compareUnicodeCodePoints);
		};
		stringArray = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
		uniqueProviders = (evidence) => [...new Map(evidence.map(({ provider }) => [`${provider.id}\0${provider.name}\0${provider.version ?? ""}`, provider])).values()].sort((left, right) => compareUnicodeCodePoints(`${left.id}\0${left.name}\0${left.version ?? ""}`, `${right.id}\0${right.name}\0${right.version ?? ""}`));
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptFeatureTrace.js
var traceApplicationFeature, noMatchResult, traceGraph, traceGraphCoverage, terminalPaths, pathTo, isTerminal, factSummary, traceCoverageStatus, traceLimitations, sourceCoverageLimitations;
function init_javascriptFeatureTrace() {
	return (init_javascriptFeatureTrace = __esmMin((() => {
		init_canonicalDigest();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_javascriptApplicationGraph();
		init_javascriptFeatureTraceSchemas();
		init_javascriptFeatureSeed();
		init_javascriptFeatureTraversal();
		init_javascriptNativeHandoff();
		traceApplicationFeature = (input) => {
			const seedMatches = findApplicationFeatureSeeds(input.graph.nodes, input.seed);
			if (seedMatches.length === 0) return noMatchResult(input);
			const traversal = traverseApplicationFeature(input.graph, seedMatches.map(({ node_id: id }) => id), input.direction);
			const graph = traceGraph(input, seedMatches, traversal);
			const paths = terminalPaths(traversal, seedMatches);
			const nativeHandoffs = buildJavaScriptNativeHandoffs(input.graph, new Set(traversal.nodes.filter(({ kind }) => kind === "native-addon").map(({ node_id }) => node_id)), input.nativeEvidence);
			const evidenceLinks = uniqueSorted([input.sourceEvidenceId, ...nativeHandoffs.flatMap(({ evidence_ids: ids }) => ids)]);
			const semantic = {
				source_evidence_id: input.sourceEvidenceId,
				source_graph_id: input.graph.graph_id,
				seed: input.seed,
				direction: input.direction,
				seed_matches: seedMatches,
				graph,
				paths,
				native_handoffs: nativeHandoffs,
				summary: {
					matched_seeds: seedMatches.length,
					traced_nodes: traversal.nodes.length,
					traced_edges: traversal.edges.length,
					terminal_paths: paths.length,
					native_handoffs: nativeHandoffs.length,
					...factSummary(traversal.nodes, traversal.edges)
				},
				coverage: {
					status: traceCoverageStatus(input.graph),
					source_graph_status: input.graph.coverage.status,
					total_seed_matches: seedMatches.length
				},
				evidence_links: evidenceLinks,
				limitations: traceLimitations(input.graph)
			};
			return applicationFeatureTraceResultSchema.parse({
				...semantic,
				trace_id: `jatr_${digestCanonicalValue(semantic, "Feature trace")}`
			});
		};
		noMatchResult = (input) => {
			const semantic = {
				source_evidence_id: input.sourceEvidenceId,
				source_graph_id: input.graph.graph_id,
				seed: input.seed,
				direction: input.direction,
				seed_matches: [],
				graph: null,
				paths: [],
				native_handoffs: [],
				summary: {
					matched_seeds: 0,
					traced_nodes: 0,
					traced_edges: 0,
					terminal_paths: 0,
					native_handoffs: 0,
					observed_facts: 0,
					inferred_facts: 0,
					unknown_facts: 0,
					unavailable_facts: 0
				},
				coverage: {
					status: "no-match",
					source_graph_status: input.graph.coverage.status,
					total_seed_matches: 0
				},
				evidence_links: [input.sourceEvidenceId],
				limitations: uniqueSorted(["No graph entity matched the literal seed; this is not evidence that the feature is absent.", ...sourceCoverageLimitations(input.graph)])
			};
			return applicationFeatureTraceResultSchema.parse({
				...semantic,
				trace_id: `jatr_${digestCanonicalValue(semantic, "Feature trace")}`
			});
		};
		traceGraph = (input, seedMatches, traversal) => {
			return createJavaScriptApplicationGraph({
				schema: "JavaScriptApplicationGraph",
				root_node_ids: uniqueSorted(seedMatches.map(({ node_id: id }) => id)),
				nodes: traversal.nodes,
				edges: traversal.edges,
				coverage: traceGraphCoverage(input.graph),
				limitations: uniqueSorted([...input.graph.limitations, "Trace edges retain their source authority; graph connectivity does not prove runtime execution or reachability."])
			});
		};
		traceGraphCoverage = (source) => {
			return source.coverage.status === "complete" ? {
				status: "complete",
				truncated: false,
				omitted_count: 0,
				limits: []
			} : source.coverage;
		};
		terminalPaths = (traversal, seeds) => {
			const seedIds = new Set(seeds.map(({ node_id: id }) => id));
			const edgeById = new Map(traversal.edges.map((edge) => [edge.edge_id, edge]));
			return traversal.nodes.filter((node) => isTerminal(node) && (!seedIds.has(node.node_id) || traversal.nodes.length === 1)).map((node) => pathTo(node, traversal.predecessors, edgeById)).filter((path) => path !== null).sort((left, right) => compareUnicodeCodePoints(left.path_id, right.path_id));
		};
		pathTo = (node, predecessors, edgeById) => {
			const nodeIds = [node.node_id];
			const edgeIds = [];
			let current = node.node_id;
			while (predecessors.has(current)) {
				const predecessor = predecessors.get(current);
				if (predecessor === undefined) break;
				nodeIds.push(predecessor.previousNodeId);
				edgeIds.push(predecessor.edgeId);
				current = predecessor.previousNodeId;
			}
			nodeIds.reverse();
			edgeIds.reverse();
			const edges = edgeIds.map((edgeId) => edgeById.get(edgeId)).filter((edge) => edge !== undefined);
			if (edges.length !== edgeIds.length) return null;
			const semantic = {
				start_node_id: nodeIds[0] ?? node.node_id,
				end_node_id: node.node_id,
				end_kind: node.kind,
				node_ids: nodeIds,
				edge_ids: edgeIds,
				authorities: uniqueSorted(edges.map(({ evidence }) => evidence.authority)),
				contains_inference: edges.some(({ evidence }) => evidence.state === "inferred")
			};
			return {
				...semantic,
				path_id: `jatp_${digestCanonicalValue(semantic, "Feature trace")}`
			};
		};
		isTerminal = (node) => [
			"endpoint",
			"storage",
			"native-addon",
			"native-export",
			"unknown"
		].includes(node.kind) || node.kind === "javascript-expression" && node.observations.some((o) => o.properties.step_kind === "terminal");
		factSummary = (nodes, edges) => {
			const states = [...nodes.flatMap(({ observations }) => observations.map(({ evidence }) => evidence.state)), ...edges.map(({ evidence }) => evidence.state)];
			return {
				observed_facts: states.filter((state) => state === "observed").length,
				inferred_facts: states.filter((state) => state === "inferred").length,
				unknown_facts: states.filter((state) => state === "unknown").length,
				unavailable_facts: states.filter((state) => state === "unavailable").length
			};
		};
		traceCoverageStatus = (graph) => graph.coverage.status === "complete" ? "complete-within-source" : "partial";
		traceLimitations = (graph) => uniqueSorted([
			"A trace reports graph relationships, not proof that code executed or that a feature is reachable in every state.",
			"Static, native, passive-runtime, inferred, and unknown facts retain their original authority in the returned graph.",
			"Native handoffs never open a binary or invoke a provider automatically; snapshot reuse remains provider/profile/target exact.",
			...sourceCoverageLimitations(graph)
		]);
		sourceCoverageLimitations = (graph) => graph.coverage.status === "complete" ? [] : ["The source application graph is incomplete; unmatched seeds and frontiers remain unknown."];
	})))();
}

//#endregion
//#region dist/domain/javascript/sourceToBundleSignals.js
var RELEVANT_NODE_KINDS, PATH_PROPERTIES, signalWeight, sourceBearingNodes, historicalSourceFiles, buildSourceToBundleCandidateIndex, candidateIdsForSource, candidateHasDigest, scoreSourceToBundleCandidate, fileOccurrenceKey, projectionKey, sourceToBundleCandidateIdentity, projectCurrentOccurrences, projectCurrentNode, candidateSignals, signal, candidateConfidence, matchingPaths, matchingUnicodePaths, addJsonPath, addPath, SCHEME_URL, SCHEME_URL_PREFIX, normalizeCurrentPath, uniquePaths, pathSuffixes, addIndexValue;
function init_sourceToBundleSignals() {
	return (init_sourceToBundleSignals = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_sourceToBundleComparisonSchemas();
		init_javascriptArtifactFiles();
		init_digests();
		RELEVANT_NODE_KINDS = new Set([
			"artifact",
			"javascript-asset",
			"javascript-module",
			"source-module"
		]);
		PATH_PROPERTIES = [
			"path",
			"source",
			"original_source",
			"module_path",
			"resolved_path",
			"declared_path"
		];
		signalWeight = (kind) => {
			const entry = SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS.find(([signal]) => signal === kind);
			if (entry === undefined) throw new TypeError(`Missing source-to-bundle signal weight: ${kind}`);
			return entry[1];
		};
		sourceBearingNodes = (nodes) => nodes.filter(({ kind }) => RELEVANT_NODE_KINDS.has(kind)).sort((left, right) => compareUnicodeCodePoints(left.node_id, right.node_id));
		historicalSourceFiles = (graph) => graph.entries.filter((entry) => entry.kind === "file" && entry.classifications.includes("source")).sort((left, right) => compareUnicodeCodePoints(left.path, right.path));
		buildSourceToBundleCandidateIndex = (nodes) => {
			const projections = projectCurrentOccurrences(nodes);
			const byDigest = new Map();
			const byPathSuffix = new Map();
			const byBasename = new Map();
			for (const projection of projections) {
				for (const digest of projection.digests) addIndexValue(byDigest, digest, projectionKey(projection));
				for (const path of projection.paths) {
					for (const suffix of path.allowSuffix ? pathSuffixes(path.value) : [path.value]) {
						addIndexValue(byPathSuffix, suffix, projectionKey(projection));
						const canonical = suffix.normalize("NFC");
						if (canonical !== suffix) addIndexValue(byPathSuffix, canonical, projectionKey(projection));
					}
					addIndexValue(byBasename, posix.basename(path.value), projectionKey(projection));
				}
			}
			return {
				nodes: new Map(projections.map((projection) => [projectionKey(projection), projection])),
				byDigest,
				byPathSuffix,
				byBasename
			};
		};
		candidateIdsForSource = (source, index) => {
			const canonicalPath = source.path.normalize("NFC");
			const groups = [
				source.sha256 === null ? undefined : index.byDigest.get(source.sha256),
				index.byPathSuffix.get(source.path),
				canonicalPath === source.path ? undefined : index.byPathSuffix.get(canonicalPath),
				index.byBasename.get(posix.basename(source.path))
			];
			const seen = new Set();
			const output = [];
			for (const group of groups) {
				if (group === undefined) continue;
				for (const nodeId of [...group].sort(compareUnicodeCodePoints)) {
					if (seen.has(nodeId)) continue;
					seen.add(nodeId);
					output.push(nodeId);
				}
			}
			return output;
		};
		candidateHasDigest = (index, candidate) => (index.nodes.get(sourceToBundleCandidateIdentity(candidate))?.digests.size ?? 0) > 0;
		scoreSourceToBundleCandidate = (source, nodeId, index) => {
			const projection = index.nodes.get(nodeId);
			if (projection === undefined) return null;
			const signals = candidateSignals(source, projection);
			const score = signals.reduce((total, signal) => total + signal.weight, 0);
			if (score < 20) return null;
			return {
				...projection.occurrence === undefined ? {} : {
					current_file_occurrence: projection.occurrence,
					representation_node_ids: [...projection.representations]
				},
				current_node_id: projection.node.node_id,
				current_node_kind: projection.node.kind,
				score,
				confidence: candidateConfidence(signals),
				signals
			};
		};
		fileOccurrenceKey = (occurrence) => compositeKey([
			"file-occurrence",
			occurrence.container_sha256,
			occurrence.path,
			occurrence.sha256
		]);
		projectionKey = (projection) => projection.occurrence === undefined ? projection.node.node_id : fileOccurrenceKey(projection.occurrence);
		sourceToBundleCandidateIdentity = (candidate) => candidate.current_file_occurrence === undefined ? candidate.current_node_id : fileOccurrenceKey(candidate.current_file_occurrence);
		projectCurrentOccurrences = (nodes) => {
			const groups = new Map();
			for (const node of nodes) {
				const occurrences = new Map();
				for (const observation of node.observations) {
					const parsed = javaScriptFileOccurrenceSchema.safeParse(observation.properties.file_occurrence);
					if (!parsed.success) continue;
					const key = fileOccurrenceKey(parsed.data);
					const previous = occurrences.get(key);
					if (previous === undefined) occurrences.set(key, {
						occurrence: parsed.data,
						observations: [observation]
					});
					else previous.observations.push(observation);
				}
				if (occurrences.size === 0) {
					groups.set(node.node_id, projectCurrentNode(node));
					continue;
				}
				for (const [key, { occurrence, observations }] of occurrences) {
					const projected = projectCurrentNode({
						...node,
						observations
					});
					const previous = groups.get(key);
					groups.set(key, {
						...projected,
						occurrence,
						node: previous?.node ?? node,
						representations: [...new Set([...previous?.representations ?? [], node.node_id])].sort(compareUnicodeCodePoints),
						digests: new Set([
							occurrence.sha256,
							...projected.digests,
							...previous?.digests ?? []
						]),
						paths: uniquePaths([...projected.paths, ...previous?.paths ?? []])
					});
				}
			}
			return [...groups.values()];
		};
		projectCurrentNode = (node) => {
			const digests = new Set();
			const paths = [];
			if (node.identity.strategy === "content-digest") digests.add(node.identity.sha256);
			if (node.identity.strategy === "source-map-original") {
				if (node.identity.source_sha256 !== null) digests.add(node.identity.source_sha256);
			}
			if (node.identity.strategy === "canonical-path") addPath(paths, "canonical-path", node.identity.path, "artifact");
			for (const observation of node.observations) {
				if (node.identity.strategy === "source-map-original") {
					const resolution = observation.source_map_reference?.resolution;
					if (resolution !== undefined && resolution.kind !== "unresolved") paths.push({
						kind: "source-map-original",
						value: resolution.path,
						allowSuffix: resolution.kind === "suffix"
					});
				} else {
					const sourceDigest = observation.properties.source_sha256;
					if (typeof sourceDigest === "string" && isDigest(sourceDigest)) digests.add(sourceDigest);
					for (const key of PATH_PROPERTIES) {
						if (key === "declared_path" && typeof observation.properties.resolved_path === "string") continue;
						addJsonPath(paths, observation.properties[key], key === "resolved_path" || (key === "path" || key === "module_path") && !(typeof observation.properties[key] === "string" && SCHEME_URL.test(observation.properties[key])) ? "artifact" : "reference");
					}
				}
			}
			return {
				node,
				representations: [node.node_id],
				digests,
				paths: uniquePaths(paths)
			};
		};
		candidateSignals = (source, current) => {
			const signals = [];
			if (source.sha256 !== null && current.digests.has(source.sha256)) signals.push(signal("exact-source-digest", source.sha256, [source.sha256]));
			const sourceMapPaths = matchingPaths(source.path, current.paths.filter(({ kind }) => kind === "source-map-original"));
			if (sourceMapPaths.length > 0) signals.push(signal("source-map-original-path", source.path, sourceMapPaths));
			const unicodeEquivalentPaths = matchingUnicodePaths(source.path, current.paths);
			if (unicodeEquivalentPaths.length > 0) signals.push(signal("unicode-equivalent-path", source.path, unicodeEquivalentPaths));
			const otherPaths = current.paths.filter(({ kind }) => kind !== "source-map-original");
			const exactPaths = otherPaths.filter(({ value }) => value === source.path).map(({ value }) => value);
			if (exactPaths.length > 0) signals.push(signal("current-path-exact", source.path, exactPaths));
			const suffixPaths = otherPaths.filter(({ value, allowSuffix }) => allowSuffix && value !== source.path && value.endsWith(`/${source.path}`)).map(({ value }) => value);
			if (suffixPaths.length > 0) signals.push(signal("current-path-suffix", source.path, suffixPaths));
			const basename = posix.basename(source.path);
			const basenamePaths = current.paths.filter(({ value }) => posix.basename(value) === basename).map(({ value }) => value);
			if (basenamePaths.length > 0) signals.push(signal("basename-match", basename, basenamePaths));
			const extension = posix.extname(source.path).toLowerCase();
			const extensionPaths = current.paths.filter(({ value }) => posix.extname(value).toLowerCase() === extension).map(({ value }) => value);
			if (extension !== "" && extensionPaths.length > 0) signals.push(signal("language-extension", extension, extensionPaths));
			return signals;
		};
		signal = (kind, sourceValue, currentValues) => ({
			kind,
			weight: signalWeight(kind),
			source_value: sourceValue,
			current_values: [...new Set(currentValues)].sort(compareUnicodeCodePoints)
		});
		candidateConfidence = (signals) => {
			const kinds = new Set(signals.map(({ kind }) => kind));
			if (kinds.has("exact-source-digest")) return "exact";
			if (kinds.has("source-map-original-path") || kinds.has("current-path-exact")) return "high";
			return kinds.has("current-path-suffix") ? "medium" : "low";
		};
		matchingPaths = (sourcePath, currentPaths) => currentPaths.filter(({ value, allowSuffix }) => value === sourcePath || allowSuffix && value.endsWith(`/${sourcePath}`)).map(({ value }) => value);
		matchingUnicodePaths = (sourcePath, currentPaths) => {
			const canonicalSource = sourcePath.normalize("NFC");
			return currentPaths.filter(({ value, allowSuffix }) => {
				if (value === sourcePath || allowSuffix && value.endsWith(`/${sourcePath}`)) return false;
				const canonicalValue = value.normalize("NFC");
				return canonicalValue === canonicalSource || allowSuffix && canonicalValue.endsWith(`/${canonicalSource}`);
			}).map(({ value }) => value);
		};
		addJsonPath = (paths, value, format) => {
			if (typeof value === "string") addPath(paths, "observation-path", value, format);
		};
		addPath = (paths, kind, raw, format) => {
			const value = normalizeCurrentPath(raw, format);
			if (value !== null) paths.push({
				kind,
				value,
				allowSuffix: true
			});
		};
		SCHEME_URL = /^[a-z][a-z0-9+.-]*:\/\//iu;
		SCHEME_URL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\/+/iu;
		normalizeCurrentPath = (raw, format) => {
			const withoutQuery = format === "reference" && SCHEME_URL.test(raw) ? raw.split(/[?#]/u, 1)[0] ?? "" : raw;
			const portable = format === "artifact" ? withoutQuery : withoutQuery.replace(SCHEME_URL_PREFIX, "").replaceAll("\\", "/");
			const parts = [];
			for (const part of portable.split("/")) {
				if (part === "" || part === ".") continue;
				if (part === "..") {
					if (parts.length === 0) return null;
					parts.pop();
				} else parts.push(part);
			}
			if (parts.length === 0) return null;
			return parts.join("/");
		};
		uniquePaths = (paths) => [...new Map(paths.map((path) => [compositeKey([
			path.kind,
			path.value,
			String(path.allowSuffix)
		]), path])).values()].sort((left, right) => compareUnicodeCodePoints(compositeKey([left.kind, left.value]), compositeKey([right.kind, right.value])));
		pathSuffixes = (path) => {
			const parts = path.split("/");
			return parts.map((_, index) => parts.slice(index).join("/"));
		};
		addIndexValue = (index, key, nodeId) => {
			const values = index.get(key) ?? new Set();
			values.add(nodeId);
			index.set(key, values);
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/sourceToBundleComparison.js
var compareSourceToBundle, projectComparison, compareMappings, comparisonCoverage, scoringModel, classifyMapping, markMergedMappings, mappingId, comparisonSummary, countStatus, coverageStatus, comparisonLimitations, hasSignal, compareCandidates;
function init_sourceToBundleComparison() {
	return (init_sourceToBundleComparison = __esmMin((() => {
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		init_comparisonSemantics();
		init_canonicalDigest();
		init_sourceToBundleComparisonSchemas();
		init_sourceToBundleSignals();
		compareSourceToBundle = (input) => {
			const projection = projectComparison(input);
			const mappings = compareMappings(input, projection);
			const factors = { ...projection.factors };
			const mappedCurrentIds = new Set(mappings.items.flatMap(({ current_node_ids: nodeIds, candidates }) => [...nodeIds, ...candidates.filter((candidate) => nodeIds.includes(candidate.current_node_id)).flatMap((candidate) => candidate.representation_node_ids ?? [])]));
			const unmappedCurrentNodeIds = projection.currentNodes.map(({ node_id: nodeId }) => nodeId).filter((nodeId) => !mappedCurrentIds.has(nodeId));
			const semanticResult = {
				reference: {
					root_sha256: input.reference.root_sha256,
					inventory_state: input.reference.inventory_state
				},
				application: {
					evidence_id: input.application.evidenceId,
					graph_id: input.application.graph.graph_id,
					root_artifact_sha256: input.application.rootArtifactSha256
				},
				scoring: scoringModel(),
				summary: comparisonSummary(mappings.items),
				items: mappings.items,
				unmapped_current_node_ids: unmappedCurrentNodeIds,
				coverage: comparisonCoverage(projection, mappings, factors),
				evidence_links: [input.application.evidenceId],
				limitations: comparisonLimitations(factors)
			};
			return sourceToBundleComparisonResultSchema.parse({
				...semanticResult,
				comparison_id: `stbc_${digestCanonicalValue(semanticResult, "Source-to-bundle comparison")}`
			});
		};
		projectComparison = (input) => {
			const allSources = historicalSourceFiles(input.reference);
			const allCurrentNodes = sourceBearingNodes(input.application.graph.nodes);
			const sources = allSources;
			const currentNodes = allCurrentNodes;
			const index = buildSourceToBundleCandidateIndex(currentNodes);
			return {
				sources,
				currentNodes,
				index,
				absenceComplete: input.reference.inventory_state === "complete" && absenceClaimable(input.application.graph.coverage),
				factors: { input }
			};
		};
		compareMappings = (input, projection) => {
			let candidateEvaluations = 0;
			const provisionalItems = [];
			for (const source of projection.sources) {
				const candidateIds = candidateIdsForSource(source, projection.index);
				candidateEvaluations += candidateIds.length;
				const scored = candidateIds.map((nodeId) => scoreSourceToBundleCandidate(source, nodeId, projection.index)).filter((candidate) => candidate !== null).sort(compareCandidates);
				const classification = classifyMapping(scored, projection.absenceComplete, (candidate) => source.sha256 !== null && candidateHasDigest(projection.index, candidate));
				const semantic = {
					source_path: source.path,
					source_sha256: source.sha256,
					source_language: source.language,
					status: classification.status,
					confidence: classification.confidence,
					current_node_ids: classification.currentNodeIds,
					candidates: scored,
					limitations: uniqueSorted([...source.limitations, ...classification.limitations])
				};
				provisionalItems.push({
					mapping_id: mappingId(input, semantic),
					...semantic
				});
			}
			return {
				items: markMergedMappings(input, provisionalItems),
				candidateEvaluations
			};
		};
		comparisonCoverage = (projection, mappings, factors) => ({
			status: coverageStatus(factors),
			reference_inventory_state: factors.input.reference.inventory_state,
			application_graph_status: factors.input.application.graph.coverage.status,
			retained_source_files: projection.sources.length,
			retained_application_nodes: projection.currentNodes.length,
			candidate_evaluations: mappings.candidateEvaluations
		});
		scoringModel = () => ({
			algorithm: "rea-source-to-bundle-signals",
			minimum_candidate_score: 20,
			weights: SOURCE_TO_BUNDLE_SIGNAL_WEIGHTS.map(([signal, weight]) => ({
				signal,
				weight
			}))
		});
		classifyMapping = (candidates, absenceComplete, digestComparable) => {
			const exact = candidates.filter((candidate) => hasSignal(candidate, "exact-source-digest"));
			if (exact.length === 1) return {
				status: "unchanged",
				confidence: "exact",
				currentNodeIds: [exact[0]?.current_node_id ?? ""].filter(Boolean),
				limitations: ["Exact byte identity does not establish equivalent load context or runtime behavior."]
			};
			if (exact.length > 1) return {
				status: "duplicated",
				confidence: "exact",
				currentNodeIds: uniqueSorted(exact.map(({ current_node_id: nodeId }) => nodeId)),
				limitations: ["The same historical source digest occurs in multiple current source occurrences."]
			};
			const pathCandidates = candidates.filter((candidate) => candidate.signals.some(({ kind }) => [
				"source-map-original-path",
				"current-path-exact",
				"current-path-suffix"
			].includes(kind)));
			const topScore = pathCandidates[0]?.score;
			const topPathCandidates = topScore === undefined ? [] : pathCandidates.filter(({ score }) => score === topScore);
			if (topPathCandidates.length === 1) {
				const candidate = topPathCandidates[0];
				if (candidate !== undefined && digestComparable(candidate)) return {
					status: "modified",
					confidence: candidate.confidence === "high" ? "high" : "medium",
					currentNodeIds: [candidate.current_node_id],
					limitations: ["Location evidence links the source to the current node, but their source digests differ."]
				};
				return {
					status: "unknown",
					confidence: "unknown",
					currentNodeIds: candidate === undefined ? [] : [candidate.current_node_id],
					limitations: ["Location evidence links the source to the current node, but comparable source digests are unavailable."]
				};
			}
			if (topPathCandidates.length > 1) return {
				status: "split",
				confidence: "medium",
				currentNodeIds: uniqueSorted(topPathCandidates.map(({ current_node_id: nodeId }) => nodeId)),
				limitations: ["Multiple equally scored current source occurrences retain the historical source path; this is a static split inference, not runtime proof."]
			};
			if (candidates.length > 0) return {
				status: "unknown",
				confidence: "unknown",
				currentNodeIds: [],
				limitations: [candidates.some((candidate) => hasSignal(candidate, "unicode-equivalent-path")) ? "Unicode-equivalent paths are inferred candidates only; filesystem paths with distinct Unicode spellings may identify different files, so no mapping was forced." : "Only weak basename or extension signals were available; no mapping was forced."]
			};
			return absenceComplete ? {
				status: "removed",
				confidence: "high",
				currentNodeIds: [],
				limitations: ["No retained current node matched exact digest or path signals within complete static inventories."]
			} : {
				status: "unknown",
				confidence: "unknown",
				currentNodeIds: [],
				limitations: ["No candidate was observed, but incomplete input or graph coverage prevents a removal claim."]
			};
		};
		markMergedMappings = (input, items) => {
			const sourcesByNode = new Map();
			for (const item of items) {
				if (item.status !== "unchanged" || item.current_node_ids.length !== 1) continue;
				const nodeId = item.current_node_ids[0];
				const candidate = item.candidates.find((candidate) => candidate.current_node_id === nodeId);
				if (candidate === undefined) continue;
				const key = sourceToBundleCandidateIdentity(candidate);
				sourcesByNode.set(key, [...sourcesByNode.get(key) ?? [], item]);
			}
			const mergedSources = new Set([...sourcesByNode.values()].filter((group) => group.length > 1).flatMap((group) => group.map(({ source_path: path }) => path)));
			return items.map((item) => {
				if (!mergedSources.has(item.source_path)) return item;
				const { mapping_id: previousMappingId, ...base } = item;
				void previousMappingId;
				const semantic = {
					...base,
					status: "merged",
					confidence: "exact",
					limitations: uniqueSorted([...item.limitations, "Multiple historical source paths have exact digest identity with the same current source occurrence."])
				};
				return {
					...semantic,
					mapping_id: mappingId(input, semantic)
				};
			});
		};
		mappingId = (input, item) => `stbc_item_${digestCanonicalValue({
			reference_root_sha256: input.reference.root_sha256,
			application_graph_id: input.application.graph.graph_id,
			...item
		}, "Source-to-bundle comparison")}`;
		comparisonSummary = (items) => ({
			unchanged: countStatus(items, "unchanged"),
			modified: countStatus(items, "modified"),
			removed: countStatus(items, "removed"),
			split: countStatus(items, "split"),
			merged: countStatus(items, "merged"),
			duplicated: countStatus(items, "duplicated"),
			unknown: countStatus(items, "unknown")
		});
		countStatus = (items, status) => items.filter((item) => item.status === status).length;
		coverageStatus = (factors) => {
			return factors.input.reference.inventory_state === "complete" && factors.input.application.graph.coverage.status === "complete" ? "complete-within-inputs" : "partial";
		};
		comparisonLimitations = (factors) => uniqueSorted([
			"Static digest and location signals do not establish runtime behavior, semantic equivalence, or absence of dynamically generated modules.",
			...factors.input.reference.limitations,
			...factors.input.application.graph.limitations,
			...factors.input.reference.inventory_state === "complete" ? [] : [`Historical source inventory is ${factors.input.reference.inventory_state}; unmatched files remain unknown.`],
			...factors.input.application.graph.coverage.status === "complete" ? [] : [`Application graph coverage is ${factors.input.application.graph.coverage.status}; unmatched files remain unknown.`]
		]);
		hasSignal = (candidate, kind) => candidate.signals.some((signal) => signal.kind === kind);
		compareCandidates = (left, right) => right.score - left.score || compareUnicodeCodePoints(sourceToBundleCandidateIdentity(left), sourceToBundleCandidateIdentity(right));
	})))();
}

//#endregion
//#region dist/application/javascript/JavaScriptApplicationWorkflowService.js
var featureTraceFrameSchema, versionComparisonFrameSchema, exportShapeFrameSchema, resolveWorkflowEvidence, resolveApplicationGraphPair, traceApplicationFeatureEvidence, compareApplicationVersionsEvidence, compareSourceToBundleEvidence, compareJavaScriptExportShapesEvidence;
function init_JavaScriptApplicationWorkflowService() {
	return (init_JavaScriptApplicationWorkflowService = __esmMin((() => {
		init_EvidenceInputResolver();
		init_evidenceReference();
		init_inputIssueProjection();
		init_javascriptApplicationVersionComparison();
		init_javascriptApplicationVersionComparisonSchemas();
		init_javascriptExportShapeComparison();
		init_javascriptExportShapeComparisonSchemas();
		init_javascriptFeatureTrace();
		init_javascriptFeatureTraceSchemas();
		init_result();
		init_sourceToBundleComparison();
		init_sourceToBundleComparisonSchemas();
		init_JavaScriptApplicationEvidenceGraph();
		init_JavaScriptApplicationWorkflowEvidence();
		featureTraceFrameSchema = z.strictObject({
			...traceApplicationFeatureInputSchema.shape,
			application: z.unknown().nonoptional(),
			native_observations: z.array(z.unknown()).default([])
		});
		versionComparisonFrameSchema = z.strictObject({
			...compareApplicationVersionsInputSchema.shape,
			left: z.unknown().nonoptional(),
			right: z.unknown().nonoptional(),
			left_native_observations: z.array(z.unknown()).default([]),
			right_native_observations: z.array(z.unknown()).default([])
		});
		exportShapeFrameSchema = z.strictObject({
			...compareJavaScriptExportShapesInputSchema.shape,
			left: z.unknown().nonoptional(),
			right: z.unknown().nonoptional()
		});
		resolveWorkflowEvidence = (raw, lookup) => {
			const reference = retainedEvidenceReferenceSchema.safeParse(raw);
			return reference.success ? resolveEvidenceInput(reference.data, lookup) : ok(raw);
		};
		resolveApplicationGraphPair = (operation, input, lookup) => {
			const selectedLeft = resolveWorkflowEvidence(input.left, lookup);
			if (!selectedLeft.ok) return selectedLeft;
			const selectedRight = resolveWorkflowEvidence(input.right, lookup);
			if (!selectedRight.ok) return selectedRight;
			const left = parseApplicationGraphEvidence(selectedLeft.value, ["left"]);
			if (!left.ok) return err(applicationGraphEvidenceInputError(operation, left.error));
			const right = parseApplicationGraphEvidence(selectedRight.value, ["right"]);
			if (!right.ok) return err(applicationGraphEvidenceInputError(operation, right.error));
			return ok({
				left: left.value,
				right: right.value,
				selected: {
					left: selectedLeft.value,
					right: selectedRight.value
				}
			});
		};
		traceApplicationFeatureEvidence = (rawInput, lookup) => {
			const operation = "trace_application_feature";
			const request = featureTraceFrameSchema.safeParse(rawInput);
			if (!request.success) return err(analysisInputErrorFromIssues(operation, request.error.issues, rawInput, { cause: request.error }));
			const selected = resolveWorkflowEvidence(request.data.application, lookup);
			if (!selected.ok) return selected;
			const input = {
				...request.data,
				application: selected.value
			};
			const sourceResult = parseApplicationGraphEvidence(input.application, ["application"]);
			if (!sourceResult.ok) return err(applicationGraphEvidenceInputError(operation, sourceResult.error));
			const nativeResult = parseNativeApplicationEvidence(input.native_observations, ["native_observations"]);
			if (!nativeResult.ok) return err(applicationGraphEvidenceInputError(operation, nativeResult.error));
			const source = sourceResult.value;
			const nativeEvidence = nativeResult.value;
			const identities = applicationTraceIdentitiesSchema.safeParse({ native_observations: nativeEvidence });
			if (!identities.success) return err(analysisInputErrorFromIssues(operation, identities.error.issues, input));
			const result = traceApplicationFeature({
				sourceEvidenceId: source.evidence.evidence_id,
				graph: source.graph,
				nativeEvidence,
				seed: input.seed,
				direction: input.direction
			});
			const evidence = createApplicationFeatureTraceEvidence({
				application_evidence_id: source.evidence.evidence_id,
				native_evidence_ids: nativeEvidence.map(({ evidence_id: id }) => id),
				seed: input.seed,
				direction: input.direction
			}, result);
			return ok({
				evidence,
				result,
				sources: [source.evidence, ...nativeEvidence]
			});
		};
		compareApplicationVersionsEvidence = (rawInput, lookup) => {
			const operation = "compare_application_versions";
			const request = versionComparisonFrameSchema.safeParse(rawInput);
			if (!request.success) return err(analysisInputErrorFromIssues(operation, request.error.issues, rawInput, { cause: request.error }));
			const pair = resolveApplicationGraphPair(operation, request.data, lookup);
			if (!pair.ok) return pair;
			const { left, right } = pair.value;
			const input = {
				...request.data,
				...pair.value.selected
			};
			const leftNativeResult = parseNativeApplicationEvidence(input.left_native_observations, ["left_native_observations"]);
			if (!leftNativeResult.ok) return err(applicationGraphEvidenceInputError(operation, leftNativeResult.error));
			const rightNativeResult = parseNativeApplicationEvidence(input.right_native_observations, ["right_native_observations"]);
			if (!rightNativeResult.ok) return err(applicationGraphEvidenceInputError(operation, rightNativeResult.error));
			const leftNative = leftNativeResult.value;
			const rightNative = rightNativeResult.value;
			const identities = applicationVersionIdentitiesSchema.safeParse({
				left: left.evidence,
				right: right.evidence,
				left_native_observations: leftNative,
				right_native_observations: rightNative
			});
			if (!identities.success) return err(analysisInputErrorFromIssues(operation, identities.error.issues, input));
			const result = compareJavaScriptApplicationVersions({
				left: {
					evidenceId: left.evidence.evidence_id,
					rootArtifactSha256: left.rootArtifactSha256,
					graph: left.graph
				},
				right: {
					evidenceId: right.evidence.evidence_id,
					rootArtifactSha256: right.rootArtifactSha256,
					graph: right.graph
				},
				leftNativeEvidence: leftNative,
				rightNativeEvidence: rightNative
			});
			const evidence = createApplicationVersionComparisonEvidence({
				left_evidence_id: left.evidence.evidence_id,
				right_evidence_id: right.evidence.evidence_id,
				left_native_evidence_ids: leftNative.map(({ evidence_id: id }) => id),
				right_native_evidence_ids: rightNative.map(({ evidence_id: id }) => id)
			}, result);
			return ok({
				evidence,
				result,
				sources: [
					left.evidence,
					right.evidence,
					...leftNative,
					...rightNative
				]
			});
		};
		compareSourceToBundleEvidence = (input) => {
			const operation = "compare_source_to_bundle";
			const applicationResult = parseApplicationGraphEvidence(input.application, ["application"]);
			if (!applicationResult.ok) return err(applicationGraphEvidenceInputError(operation, applicationResult.error));
			const application = applicationResult.value;
			const result = compareSourceToBundle({
				reference: input.reference,
				application: {
					evidenceId: application.evidence.evidence_id,
					rootArtifactSha256: application.rootArtifactSha256,
					graph: application.graph
				}
			});
			const evidence = createSourceToBundleComparisonEvidence({
				reference_root_sha256: input.reference.root_sha256,
				application_evidence_id: application.evidence.evidence_id,
				...input.reference_source === undefined ? {} : { reference_source: input.reference_source }
			}, result);
			return ok({
				evidence,
				result,
				sources: [application.evidence]
			});
		};
		compareJavaScriptExportShapesEvidence = (rawInput, lookup) => {
			const operation = "compare_javascript_export_shapes";
			const request = exportShapeFrameSchema.safeParse(rawInput);
			if (!request.success) return err(analysisInputErrorFromIssues(operation, request.error.issues, rawInput, { cause: request.error }));
			const pair = resolveApplicationGraphPair(operation, request.data, lookup);
			if (!pair.ok) return pair;
			const { left, right } = pair.value;
			const input = {
				...request.data,
				...pair.value.selected
			};
			const identities = javaScriptExportShapeIdentitiesSchema.safeParse({
				left: left.evidence,
				right: right.evidence
			});
			if (!identities.success) return err(analysisInputErrorFromIssues(operation, identities.error.issues, input));
			const result = compareJavaScriptExportShapes({
				left: {
					evidenceId: left.evidence.evidence_id,
					graph: left.graph,
					modulePath: input.left_module_path,
					exportName: input.left_export_name
				},
				right: {
					evidenceId: right.evidence.evidence_id,
					graph: right.graph,
					modulePath: input.right_module_path,
					exportName: input.right_export_name
				}
			});
			const evidence = createJavaScriptExportShapeComparisonEvidence({
				left_evidence_id: left.evidence.evidence_id,
				right_evidence_id: right.evidence.evidence_id,
				left_module_path: input.left_module_path,
				left_export_name: input.left_export_name,
				right_module_path: input.right_module_path,
				right_export_name: input.right_export_name
			}, result);
			return ok({
				evidence,
				result,
				sources: [left.evidence, right.evidence]
			});
		};
	})))();
}

//#endregion
init_JavaScriptApplicationWorkflowService();
export { compareApplicationVersionsEvidence, compareJavaScriptExportShapesEvidence, compareSourceToBundleEvidence, traceApplicationFeatureEvidence };