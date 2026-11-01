import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, digestCanonicalValue, init_canonicalDigest, init_canonicalOrdering, init_javascriptSemanticQuerySchemas, init_javascriptSemanticTraceSchemas, init_unicodeCodePointOrder, javaScriptSemanticQueryResultSchema, uniqueSorted } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { applicationGraphEvidenceInputError, init_JavaScriptApplicationEvidenceGraph, parseApplicationGraphEvidence } from "./JavaScriptApplicationEvidenceGraph-C10LjUcu.js";
import { createJavaScriptSemanticTraceEvidence, init_JavaScriptApplicationWorkflowEvidence } from "./JavaScriptApplicationWorkflowEvidence-D3jvCuP6.js";
import { z } from "zod";

//#region dist/domain/javascript/javascriptSemanticQueryRelations.js
var OWNERSHIP_RELATIONS, isJavaScriptSemanticOwnershipRelation;
function init_javascriptSemanticQueryRelations() {
	return (init_javascriptSemanticQueryRelations = __esmMin((() => {
		OWNERSHIP_RELATIONS = new Set([
			"acquires",
			"aggregates",
			"awaits",
			"chains",
			"connects-stdio",
			"creates-promise",
			"detaches-task",
			"owns",
			"releases",
			"returns-task",
			"spawns"
		]);
		isJavaScriptSemanticOwnershipRelation = (relation) => OWNERSHIP_RELATIONS.has(relation);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticQueryAssessment.js
var assessJavaScriptSemanticQuery, queryCoverage, queryStatus, queryLimitations;
function init_javascriptSemanticQueryAssessment() {
	return (init_javascriptSemanticQueryAssessment = __esmMin((() => {
		init_canonicalOrdering();
		assessJavaScriptSemanticQuery = (input) => ({
			status: queryStatus(input),
			coverage: queryCoverage(input),
			limitations: queryLimitations(input)
		});
		queryCoverage = (input) => ({ status: input.graph.coverage.status === "unavailable" ? "unavailable" : input.unknowns.length > 0 || input.candidateRelations > 0 || input.graph.coverage.status !== "complete" || input.graph.coverage.truncated ? "partial" : "complete" });
		queryStatus = (input) => {
			if (input.graph.coverage.status === "unavailable") return "unsupported";
			if (input.candidateRelations > 0) return "ambiguous";
			if (input.totalSeeds === 0 || input.hasExpectation && input.expectedMatches === 0) return input.unknowns.length > 0 || input.graph.coverage.status !== "complete" || input.graph.coverage.truncated ? "partial" : "no-match";
			return input.totalSeeds > 1 ? "ambiguous" : "found";
		};
		queryLimitations = (input) => uniqueSorted([
			"Semantic graph reachability is a static inference and does not prove runtime execution.",
			...input.graph.limitations,
			...input.unknowns.length === 0 ? [] : ["Relevant dynamic, unsupported, incomplete, or ambiguous semantics remain unknown."],
			...input.candidateRelations === 0 ? [] : ["Candidate relations remain ambiguous and do not establish a resolved semantic path."]
		]);
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticQueryIdentity.js
var javaScriptSemanticQueryIdentifier, resolveJavaScriptSemanticQuerySeeds, seedMatches;
function init_javascriptSemanticQueryIdentity() {
	return (init_javascriptSemanticQueryIdentity = __esmMin((() => {
		init_canonicalDigest();
		init_canonicalOrdering();
		init_unicodeCodePointOrder();
		javaScriptSemanticQueryIdentifier = (graph, input) => {
			const semantic = input;
			return `jsrq_${digestCanonicalValue({
				source_graph_id: graph.graph_id,
				...semantic,
				allowed_relations: semantic.allowed_relations === undefined ? undefined : uniqueSorted(semantic.allowed_relations),
				expected: semantic.expected === null ? null : {
					...semantic.expected,
					classes: uniqueSorted(semantic.expected.classes)
				}
			}, "JavaScript semantic query")}`;
		};
		resolveJavaScriptSemanticQuerySeeds = (graph, input) => {
			const fingerprintFunctions = new Set(input.seed.kind === "function" ? graph.fingerprints.filter(({ fingerprint_sha256 }) => input.seed.kind === "function" && fingerprint_sha256 === input.seed.fingerprint_sha256).map(({ function_node_id }) => function_node_id) : []);
			const unresolvedAccesses = new Set(input.seed.kind === "property" ? graph.unknowns.flatMap(({ family, node_id }) => family === "object-flow" && node_id !== null ? [node_id] : []) : []);
			return graph.nodes.filter((node) => seedMatches(node, input, fingerprintFunctions, unresolvedAccesses)).map(({ node_id }) => node_id).sort(compareUnicodeCodePoints);
		};
		seedMatches = (node, input, fingerprintFunctions, unresolvedAccesses) => {
			const seed = input.seed;
			if (seed.kind === "semantic-node") return node.node_id === seed.node_id;
			if (seed.kind === "application-node") return node.application_node_ids.includes(seed.node_id);
			if (seed.kind === "function") return fingerprintFunctions.has(node.node_id);
			if (seed.kind === "literal") return node.kind === "literal" && node.properties.value === seed.value;
			if (seed.kind === "property") {
				if (node.kind === "property-slot") return node.properties.name === seed.name;
				if (node.kind !== "expression") return false;
				const path = node.properties.property_path;
				const slotless = node.properties.property_slot_resolution === "unresolved" || node.properties.property_slot_resolution === undefined && unresolvedAccesses.has(node.node_id);
				return slotless && Array.isArray(path) && path.at(-1) === seed.name;
			}
			if (seed.kind === "endpoint") return (node.kind === "request" || node.kind === "response") && node.properties.endpoint === seed.value;
			if (seed.kind === "event") return ["event", "listener"].includes(node.kind) && node.properties.event_name === seed.name;
			return node.kind === "boundary" && node.properties.field === seed.field;
		};
	})))();
}

//#endregion
//#region dist/domain/javascript/javascriptSemanticQuery.js
var queryJavaScriptSemanticGraph, createQueryResult, buildAdjacency, addDirectedEntries, addEntry, traverse, retainOwners, relevantUnknownFrontiers, directionAllowsRelation, relevantCandidateRelationCount, expectedMatchesFor;
function init_javascriptSemanticQuery() {
	return (init_javascriptSemanticQuery = __esmMin((() => {
		init_javascriptSemanticQueryRelations();
		init_javascriptSemanticQuerySchemas();
		init_javascriptSemanticQueryAssessment();
		init_javascriptSemanticQueryIdentity();
		queryJavaScriptSemanticGraph = (graph, input) => {
			const queryId = javaScriptSemanticQueryIdentifier(graph, input);
			const seeds = resolveJavaScriptSemanticQuerySeeds(graph, input);
			const nodes = new Map(graph.nodes.map((node) => [node.node_id, node]));
			const adjacency = buildAdjacency(graph.relations, input);
			const traversal = traverse(nodes, seeds, adjacency);
			const result = createQueryResult(graph, traversal);
			const relevantUnknowns = relevantUnknownFrontiers(graph, traversal.nodeIds, input);
			const candidateRelations = relevantCandidateRelationCount(graph, traversal.nodeIds, input);
			const expectedMatches = expectedMatchesFor(result.retainedNodes, result.retainedRelations, input);
			const retainedContextIds = new Set([
				...result.retainedNodes.map(({ evidence }) => evidence.context_id),
				...result.retainedRelations.map(({ evidence }) => evidence.context_id),
				...relevantUnknowns.map(({ evidence }) => evidence.context_id)
			]);
			const assessment = assessJavaScriptSemanticQuery({
				graph,
				totalSeeds: seeds.length,
				expectedMatches: expectedMatches.length,
				hasExpectation: input.expected !== null,
				unknowns: relevantUnknowns,
				candidateRelations
			});
			return javaScriptSemanticQueryResultSchema.parse({
				query_id: queryId,
				source_graph_id: graph.graph_id,
				seed: input.seed,
				direction: input.direction,
				status: assessment.status,
				seed_node_ids: seeds,
				evidence_contexts: graph.evidence_contexts.filter(({ context_id }) => retainedContextIds.has(context_id)),
				nodes: result.retainedNodes,
				relations: result.retainedRelations,
				unknowns: relevantUnknowns,
				expected_match_node_ids: expectedMatches.map(({ node_id }) => node_id),
				summary: {
					total_seed_matches: seeds.length,
					traversed_nodes: traversal.nodeIds.size,
					traversed_relations: traversal.relationIds.size,
					traversed_functions: traversal.functionIds.size,
					traversed_modules: traversal.modules.size,
					relevant_unknowns: relevantUnknowns.length
				},
				coverage: assessment.coverage,
				limitations: assessment.limitations
			});
		};
		createQueryResult = (graph, traversal) => {
			const retainedNodes = graph.nodes.filter(({ node_id }) => traversal.nodeIds.has(node_id));
			const retainedRelations = graph.relations.filter(({ relation_id }) => traversal.relationIds.has(relation_id));
			return {
				retainedNodes,
				retainedRelations
			};
		};
		buildAdjacency = (relations, input) => {
			const adjacency = new Map();
			const allowed = input.allowed_relations === undefined ? null : new Set(input.allowed_relations);
			for (const relation of relations) {
				if (allowed !== null && !allowed.has(relation.relation)) continue;
				if (relation.resolution === "candidate" && !input.include_ambiguous_dynamic_edges) continue;
				addDirectedEntries(adjacency, relation, input.direction);
			}
			return adjacency;
		};
		addDirectedEntries = (adjacency, relation, direction) => {
			if (direction === "callers") {
				if (relation.relation === "calls") addEntry(adjacency, relation.target_node_id, relation.source_node_id, relation);
				return;
			}
			if (direction === "ownership") {
				if (!isJavaScriptSemanticOwnershipRelation(relation.relation)) return;
				addEntry(adjacency, relation.source_node_id, relation.target_node_id, relation);
				addEntry(adjacency, relation.target_node_id, relation.source_node_id, relation);
				return;
			}
			if (direction === "backward-provenance") addEntry(adjacency, relation.target_node_id, relation.source_node_id, relation);
			else addEntry(adjacency, relation.source_node_id, relation.target_node_id, relation);
		};
		addEntry = (adjacency, from, nextNodeId, relation) => {
			const entries = adjacency.get(from) ?? [];
			entries.push({
				relation,
				nextNodeId
			});
			adjacency.set(from, entries);
		};
		traverse = (nodes, seeds, adjacency) => {
			const nodeIds = new Set(seeds);
			const relationIds = new Set();
			const functionIds = new Set();
			const modules = new Set();
			const queue = [...nodeIds];
			for (const nodeId of nodeIds) retainOwners(nodes.get(nodeId), functionIds, modules);
			for (let offset = 0; offset < queue.length; offset += 1) {
				const current = queue[offset];
				if (current === undefined) continue;
				for (const entry of adjacency.get(current) ?? []) {
					relationIds.add(entry.relation.relation_id);
					if (nodeIds.has(entry.nextNodeId)) continue;
					const node = nodes.get(entry.nextNodeId);
					if (node === undefined) continue;
					nodeIds.add(entry.nextNodeId);
					retainOwners(node, functionIds, modules);
					queue.push(entry.nextNodeId);
				}
			}
			return {
				nodeIds,
				relationIds,
				functionIds,
				modules
			};
		};
		retainOwners = (node, functions, modules) => {
			if (node === undefined) return;
			const functionId = node.kind === "function" ? node.node_id : node.function_node_id;
			if (functionId !== null) functions.add(functionId);
			modules.add(node.identity.module_path);
		};
		relevantUnknownFrontiers = (graph, nodeIds, input) => {
			const allowed = input.allowed_relations === undefined ? null : new Set(input.allowed_relations);
			return graph.unknowns.filter((unknown) => (unknown.node_id === null || nodeIds.has(unknown.node_id)) && unknown.relation_kinds.some((relation) => directionAllowsRelation(input.direction, relation) && (allowed === null || allowed.has(relation))));
		};
		directionAllowsRelation = (direction, relation) => direction === "callers" ? relation === "calls" : direction === "ownership" ? isJavaScriptSemanticOwnershipRelation(relation) : true;
		relevantCandidateRelationCount = (graph, nodeIds, input) => {
			const allowed = input.allowed_relations === undefined ? null : new Set(input.allowed_relations);
			let relevant = 0;
			for (const relation of graph.relations) {
				if (relation.resolution !== "candidate" || allowed !== null && !allowed.has(relation.relation)) continue;
				const sourceIsRelevant = nodeIds.has(relation.source_node_id);
				const targetIsRelevant = nodeIds.has(relation.target_node_id);
				if (input.direction === "callers" && relation.relation === "calls" && targetIsRelevant || input.direction === "ownership" && isJavaScriptSemanticOwnershipRelation(relation.relation) && (sourceIsRelevant || targetIsRelevant) || input.direction === "backward-provenance" && targetIsRelevant || input.direction === "forward-influence" && sourceIsRelevant) relevant += 1;
			}
			return relevant;
		};
		expectedMatchesFor = (nodes, relations, input) => {
			if (input.expected === null) return [];
			const classes = new Set(input.expected.classes);
			const connected = new Set(relations.map((relation) => input.expected?.role === "source" ? relation.target_node_id : relation.source_node_id));
			return nodes.filter(({ kind, node_id }) => classes.has(kind) && !connected.has(node_id));
		};
	})))();
}

//#endregion
//#region dist/application/javascript/JavaScriptSemanticTraceService.js
var OPERATION, traceJavaScriptSemanticsEvidenceValidated;
function init_JavaScriptSemanticTraceService() {
	return (init_JavaScriptSemanticTraceService = __esmMin((() => {
		init_analysisErrorCore();
		init_JavaScriptApplicationEvidenceGraph();
		init_javascriptSemanticQuery();
		init_javascriptSemanticTraceSchemas();
		init_result();
		init_JavaScriptApplicationWorkflowEvidence();
		OPERATION = "trace_javascript_semantics";
		traceJavaScriptSemanticsEvidenceValidated = (input) => {
			const sourceResult = parseApplicationGraphEvidence(input.application, ["application"]);
			if (!sourceResult.ok) return err(applicationGraphEvidenceInputError(OPERATION, sourceResult.error));
			const source = sourceResult.value;
			if (source.semanticGraph === null) return err(new AnalysisInputError(OPERATION, undefined, [{
				path: ["application"],
				reason: "invalid_value",
				expected: "inline Evidence from analyze_javascript_application with a semantic graph"
			}]));
			const query = queryJavaScriptSemanticGraph(source.semanticGraph, input.query);
			const result = {
				...query,
				source_evidence_id: source.evidence.evidence_id,
				evidence_links: [source.evidence.evidence_id]
			};
			const { allowed_relations, ...queryParameters } = input.query;
			return ok(createJavaScriptSemanticTraceEvidence({
				application_evidence_id: source.evidence.evidence_id,
				query: allowed_relations === undefined ? queryParameters : {
					...queryParameters,
					allowed_relations
				}
			}, result));
		};
	})))();
}

//#endregion
init_JavaScriptSemanticTraceService();
export { traceJavaScriptSemanticsEvidenceValidated };