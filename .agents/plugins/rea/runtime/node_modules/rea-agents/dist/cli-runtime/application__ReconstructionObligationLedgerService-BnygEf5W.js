import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { STABLE_IDENTIFIER_PATTERN, analysisInputErrorFromIssues, compareUnicodeCodePoints, createEvidence, describeValidationFailure, digestCanonicalValue, digestSchema, init_canonicalDigest, init_canonicalOrdering, init_digests, init_evidence, init_inputIssueProjection, init_stringPatterns, init_unicodeCodePointOrder, init_validationFailure, uniqueSorted, uniqueSortedBy } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { init_evidenceBundle, readEvidenceBundle } from "./evidenceBundle-DojUFdme.js";
import { JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { init_ProcessEvidence, parseProcessCaptureEvidence } from "./ProcessEvidence-bMwmhU5w.js";
import { hasReconstructionObligationDiagnostic, init_reconstructionObligationLedgerIntegrity, init_reconstructionObligationLedgerSchemas, obligationCaseKindSchema, reconstructionObligationCoverage, reconstructionObligationDependencyGraph, reconstructionObligationEvidenceIds, reconstructionObligationLedgerClosureDigest, reconstructionObligationLedgerInputSchema, reconstructionObligationLedgerSchema, reconstructionObligationLedgerStatus, reconstructionObligationOwnershipGraph, reconstructionObligationReports, summarizeReconstructionObligations } from "./reconstructionObligationLedgerSchemas-B6t0Aw7n.js";
import { init_JavaScriptApplicationEvidenceGraph, parseApplicationGraphEvidence } from "./JavaScriptApplicationEvidenceGraph-C10LjUcu.js";
import { z } from "zod";

//#region dist/domain/reconstructionObligationProof.js
var stableIdSchema, reconstructionObligationProofSchema;
function init_reconstructionObligationProof() {
	return (init_reconstructionObligationProof = __esmMin((() => {
		init_digests();
		init_stringPatterns();
		init_reconstructionObligationLedgerSchemas();
		stableIdSchema = z.string().regex(STABLE_IDENTIFIER_PATTERN);
		reconstructionObligationProofSchema = z.strictObject({ bindings: z.array(z.strictObject({
			obligation_id: stableIdSchema,
			obligation_version: z.int().min(1),
			owner_sha256: digestSchema,
			fixtures: z.array(z.strictObject({
				fixture_id: stableIdSchema,
				case_kind: obligationCaseKindSchema,
				passed: z.boolean()
			})),
			verifiers: z.array(z.strictObject({
				verifier_id: stableIdSchema,
				claim_id: stableIdSchema,
				passed: z.boolean()
			}))
		})).min(1) });
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationAuthority.js
var proofEvidenceAuthorities, proofAuthoritySatisfies, parseReconstructionProofEvidence, qualifyReconstructionProof, evidenceSupportsOriginalAuthority;
function init_ReconstructionObligationAuthority() {
	return (init_ReconstructionObligationAuthority = __esmMin((() => {
		init_result();
		init_ProcessEvidence();
		init_reconstructionObligationProof();
		proofEvidenceAuthorities = {
			unit: ["shipped-artifact", "controlled-replay"],
			integration: ["controlled-replay"],
			protocol: ["controlled-replay", "external-service"],
			renderer: ["controlled-replay", "external-service"],
			"packaged-process": ["controlled-replay"],
			"native-abi": ["shipped-artifact", "controlled-replay"],
			"live-observation": ["controlled-replay", "external-service"],
			external: ["external-service"]
		};
		proofAuthoritySatisfies = (actual, required) => {
			const accepted = {
				unit: [
					"unit",
					"integration",
					"protocol",
					"renderer",
					"packaged-process",
					"native-abi",
					"live-observation",
					"external"
				],
				integration: [
					"integration",
					"protocol",
					"renderer",
					"packaged-process",
					"native-abi",
					"live-observation"
				],
				protocol: [
					"protocol",
					"packaged-process",
					"live-observation"
				],
				renderer: [
					"renderer",
					"packaged-process",
					"live-observation"
				],
				"packaged-process": ["packaged-process", "live-observation"],
				"native-abi": ["native-abi"],
				"live-observation": ["live-observation"],
				external: ["external"]
			};
			return accepted[required].includes(actual);
		};
		parseReconstructionProofEvidence = (evidence) => {
			if (evidence.confidence !== "observed") return err("unobserved-proof");
			if (evidence.predicate_type !== "rea.reconstruction-proof" || evidence.operation !== "verify_reconstruction_obligations") return err("unrecognized-proof");
			const parsed = reconstructionObligationProofSchema.safeParse(evidence.normalized_result);
			return parsed.success ? ok({
				authority: evidence.authority,
				result: parsed.data
			}) : err("invalid-proof");
		};
		qualifyReconstructionProof = (proof, authority, expected) => {
			if (!proof.ok) return proof;
			if (!proofEvidenceAuthorities[authority].includes(proof.value.authority)) return err("insufficient-authority");
			const obligations = proof.value.result.bindings.filter((binding) => binding.obligation_id === expected.obligationId);
			if (obligations.length === 0) return err("obligation-mismatch");
			const owners = obligations.filter((binding) => binding.owner_sha256 === expected.ownerSha256);
			if (owners.length === 0) return err("owner-mismatch");
			const revisions = owners.filter((binding) => binding.obligation_version === expected.obligationVersion);
			if (revisions.length === 0) return err("revision-mismatch");
			const outcomes = revisions.flatMap((binding) => expected.kind === "fixture" ? binding.fixtures.filter((fixture) => fixture.fixture_id === expected.fixtureId && fixture.case_kind === expected.caseKind).map(({ passed }) => passed) : binding.verifiers.filter((verifier) => verifier.verifier_id === expected.verifierId && verifier.claim_id === expected.claimId).map(({ passed }) => passed));
			if (outcomes.length === 0) return err("claim-mismatch");
			return outcomes.every((passed) => passed) ? ok(null) : err("failed-proof");
		};
		evidenceSupportsOriginalAuthority = (evidence, authority) => {
			if (evidence.confidence !== "observed") return false;
			if (authority === "static") return evidence.authority === "shipped-artifact";
			if (authority === "runtime") return ["controlled-replay", "external-service"].includes(evidence.authority);
			if (authority === "process") return evidence.authority === "controlled-replay" && parseProcessCaptureEvidence(evidence).ok;
			return evidence.authority === "external-service";
		};
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationPolicies.js
function policy(applicationLayer, family, authority, cases) {
	return {
		applicationLayer,
		family,
		fixtureAuthority: authority,
		verifierAuthority: authority,
		originalAuthority: "runtime",
		cases,
		requiresParserType: false
	};
}
function parserPolicy(applicationLayer, family, authority) {
	return {
		...policy(applicationLayer, family, authority, [
			"positive",
			"negative",
			"malformed"
		]),
		requiresParserType: true
	};
}
function nativePolicy(family) {
	return {
		applicationLayer: "native-abi",
		family,
		fixtureAuthority: "native-abi",
		verifierAuthority: "native-abi",
		originalAuthority: "static",
		cases: ["positive", "negative"],
		requiresParserType: false
	};
}
var APPLICATION_NODE_POLICIES, SEMANTIC_NODE_POLICIES, applicationObligationPolicy, semanticObligationPolicy;
function init_ReconstructionObligationPolicies() {
	return (init_ReconstructionObligationPolicies = __esmMin((() => {
		APPLICATION_NODE_POLICIES = {
			package: policy("packaging", "package-lifecycle", "packaged-process", [
				"positive",
				"negative",
				"teardown"
			]),
			installer: policy("packaging", "installer", "packaged-process", [
				"positive",
				"negative",
				"teardown"
			]),
			"context-bridge-api": policy("electron", "context-bridge", "renderer", [
				"positive",
				"negative",
				"malformed"
			]),
			"ipc-channel": policy("electron", "ipc", "renderer", [
				"positive",
				"negative",
				"malformed"
			]),
			"ipc-handler": policy("electron", "ipc", "renderer", [
				"positive",
				"negative",
				"malformed"
			]),
			endpoint: policy("protocol", "endpoint", "protocol", [
				"positive",
				"negative",
				"malformed"
			]),
			storage: policy("persistence", "persistence", "integration", [
				"positive",
				"negative",
				"malformed"
			]),
			worker: policy("process", "worker-lifecycle", "packaged-process", [
				"positive",
				"cancellation",
				"teardown"
			]),
			"service-worker": policy("process", "worker-lifecycle", "packaged-process", [
				"positive",
				"cancellation",
				"teardown"
			]),
			"native-addon": nativePolicy("native-addon"),
			"native-export": nativePolicy("native-export"),
			"managed-pinvoke-import": nativePolicy("managed-pinvoke"),
			"managed-native-implementation": nativePolicy("managed-native")
		};
		SEMANTIC_NODE_POLICIES = {
			"child-process": policy("process", "child-process", "packaged-process", [
				"positive",
				"negative",
				"cancellation",
				"teardown"
			]),
			stdio: policy("process", "stdio", "packaged-process", [
				"positive",
				"negative",
				"teardown"
			]),
			signal: policy("process", "signal", "packaged-process", [
				"positive",
				"cancellation",
				"teardown"
			]),
			"config-source": parserPolicy("cli", "configuration", "integration"),
			request: parserPolicy("protocol", "request", "protocol"),
			response: parserPolicy("protocol", "response", "protocol"),
			boundary: parserPolicy("application", "parser-boundary", "integration"),
			resource: policy("persistence", "resource-lifecycle", "integration", [
				"positive",
				"negative",
				"teardown"
			]),
			event: policy("runtime", "event", "packaged-process", [
				"positive",
				"negative",
				"cancellation"
			]),
			timer: policy("runtime", "timer", "packaged-process", [
				"positive",
				"cancellation",
				"teardown"
			]),
			promise: policy("runtime", "promise-ownership", "packaged-process", [
				"positive",
				"negative",
				"cancellation"
			]),
			task: policy("runtime", "task-lifecycle", "packaged-process", [
				"positive",
				"cancellation",
				"teardown"
			])
		};
		applicationObligationPolicy = (nodeKind) => APPLICATION_NODE_POLICIES[nodeKind];
		semanticObligationPolicy = (nodeKind) => SEMANTIC_NODE_POLICIES[nodeKind];
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationCandidates.js
var deriveReconstructionObligationCandidates, deriveApplicationCandidates, deriveProcessCandidate, generatedCandidate, reviewedCandidate, graphReference, reviewedEvidenceState, addCandidate, sourceState, obligationId;
function init_ReconstructionObligationCandidates() {
	return (init_ReconstructionObligationCandidates = __esmMin((() => {
		init_canonicalOrdering();
		init_canonicalDigest();
		init_validationFailure();
		init_JavaScriptApplicationEvidenceGraph();
		init_ProcessEvidence();
		init_ReconstructionObligationAuthority();
		init_ReconstructionObligationPolicies();
		init_unicodeCodePointOrder();
		deriveReconstructionObligationCandidates = (request) => {
			const { bundle, records } = request.sources;
			const candidates = new Map();
			const limitations = new Set();
			for (const evidence of bundle.records) {
				deriveApplicationCandidates(evidence, records, candidates, limitations);
				deriveProcessCandidate(evidence, candidates, limitations);
			}
			for (const obligation of request.reviewedObligations) addCandidate(candidates, reviewedCandidate(obligation, records));
			return {
				candidates: [...candidates.values()].sort((left, right) => compareUnicodeCodePoints(left.obligation_id, right.obligation_id)),
				limitations: [...limitations].sort()
			};
		};
		deriveApplicationCandidates = (evidence, records, candidates, limitations) => {
			if (![
				"analyze_javascript_application",
				"reconcile_javascript_runtime",
				"project_managed_application_graph"
			].includes(evidence.operation)) return;
			const parsed = parseApplicationGraphEvidence(evidence);
			if (!parsed.ok) {
				limitations.add(`Application Evidence ${evidence.evidence_id} could not generate candidates because it failed graph validation.`);
				return;
			}
			const source = parsed.value;
			for (const node of source.graph.nodes) {
				const candidatePolicy = applicationObligationPolicy(node.kind);
				if (candidatePolicy === undefined) {
					if (node.kind === "unknown") limitations.add(`Application graph ${source.graph.graph_id} contains unresolved node ${node.node_id}; reconstruction obligations remain unknown.`);
					continue;
				}
				const reference = node.observations.map((observation) => graphReference(evidence, records, observation.evidence, `${source.graph.graph_id}/node/${node.node_id}/observation/${observation.observation_id}`));
				addCandidate(candidates, generatedCandidate({
					key: `application:${node.node_id}:${candidatePolicy.family}`,
					title: node.observations[0]?.label?.trim() || `${node.kind} boundary`,
					policy: candidatePolicy,
					artifactSha256: source.rootArtifactSha256,
					applicationNodeId: node.node_id,
					semanticNodeId: null,
					location: `application-graph:${source.graph.graph_id}/nodes/${node.node_id}`,
					authorityReferences: reference
				}));
			}
			if (source.semanticGraph !== null) {
				const semanticGraph = source.semanticGraph;
				const unknownIdsByNode = new Map();
				for (const unknown of semanticGraph.unknowns) {
					if (unknown.node_id !== null) {
						const ids = unknownIdsByNode.get(unknown.node_id) ?? [];
						ids.push(unknown.unknown_id);
						unknownIdsByNode.set(unknown.node_id, ids);
					}
					limitations.add(`Semantic graph ${semanticGraph.graph_id} contains unresolved ${unknown.family} unknown ${unknown.unknown_id}: ${unknown.detail}`);
				}
				if (semanticGraph.coverage.status !== "complete") limitations.add(`Semantic graph ${semanticGraph.graph_id} coverage is ${semanticGraph.coverage.status}; omitted candidates remain unknown.`);
				for (const limitation of semanticGraph.limitations) limitations.add(`Semantic graph ${semanticGraph.graph_id}: ${limitation}`);
				const evidenceContexts = new Map(semanticGraph.evidence_contexts.map((context) => [context.context_id, context]));
				for (const node of semanticGraph.nodes) {
					const candidatePolicy = semanticObligationPolicy(node.kind);
					if (candidatePolicy === undefined) continue;
					const evidenceContext = evidenceContexts.get(node.evidence.context_id);
					if (evidenceContext === undefined) throw new TypeError("Semantic evidence reference names an absent context");
					addCandidate(candidates, generatedCandidate({
						key: `semantic:${node.node_id}:${candidatePolicy.family}`,
						title: node.label?.trim() || `${node.kind} semantic boundary`,
						policy: candidatePolicy,
						artifactSha256: node.identity.artifact_sha256,
						applicationNodeId: node.application_node_ids[0] ?? null,
						semanticNodeId: node.node_id,
						residualUnknownIds: unknownIdsByNode.get(node.node_id) ?? [],
						location: `semantic-graph:${semanticGraph.graph_id}/nodes/${node.node_id}`,
						authorityReferences: [graphReference(evidence, records, evidenceContext, `${semanticGraph.graph_id}/node/${node.node_id}`)]
					}));
				}
			}
			if (source.graph.coverage.status !== "complete") limitations.add(`Application graph ${source.graph.graph_id} coverage is ${source.graph.coverage.status}; omitted candidates remain unknown.`);
		};
		deriveProcessCandidate = (input, candidates, limitations) => {
			const parsed = parseProcessCaptureEvidence(input);
			if (!parsed.ok) {
				switch (parsed.error.kind) {
					case "wrong-workflow": break;
					case "unsupported-provider":
						limitations.add(`Process Evidence ${input.evidence_id} has an unsupported provider; process lifecycle candidates remain unknown.`);
						break;
					case "invalid-evidence":
					case "invalid-capture": limitations.add(`Process Evidence ${input.evidence_id} could not generate candidates: ${describeValidationFailure(parsed.error.cause)}`);
				}
				return;
			}
			const { record: evidence, capture } = parsed.value;
			const observedCases = [
				{
					kind: capture.exit.code === 0 ? "positive" : "negative",
					evidence_id: evidence.evidence_id,
					location: "/normalized_result/exit"
				},
				{
					kind: "teardown",
					evidence_id: evidence.evidence_id,
					location: "/normalized_result/settlement"
				},
				...capture.exit.signal !== null || capture.exit.reason !== "exited" ? [{
					kind: "cancellation",
					evidence_id: evidence.evidence_id,
					location: "/normalized_result/exit"
				}] : []
			];
			if (capture.manifest.executable_sha256 === null) {
				limitations.add(`Process capture ${evidence.evidence_id} has no validated executable artifact identity; packaged-process lifecycle obligation was not bound to an artifact.`);
				return;
			}
			addCandidate(candidates, {
				obligation_id: obligationId(`process:${capture.manifest.executable_sha256}:${capture.manifest.full_scenario_sha256}`),
				obligation_version: 1,
				title: "Captured packaged-process lifecycle",
				origin: "generated",
				application_layer: "process",
				family: "packaged-process-lifecycle",
				target: {
					artifact_sha256: capture.manifest.executable_sha256,
					application_node_id: null,
					semantic_node_id: null,
					location: `/evidence/${evidence.evidence_id}/normalized_result`
				},
				authority_references: [{
					evidence_id: evidence.evidence_id,
					authority: evidence.authority,
					state: "observed",
					location: "/normalized_result"
				}],
				source_state: "observed",
				observed_cases: observedCases,
				required: true,
				required_case_kinds: [
					"positive",
					"negative",
					"cancellation",
					"teardown"
				],
				required_original_authority: "process",
				required_fixture_authority: "packaged-process",
				required_verifier_authority: "packaged-process",
				requires_parser_type: false,
				dependency_obligation_ids: [],
				residual_unknown_ids: [],
				unavailable_authority: capture.residual_unknowns.map(({ scope, reason }) => `${scope}: ${reason}`),
				required_next_evidence: capture.truncated ? ["Repeat the packaged-process capture without truncation."] : [],
				definitionCount: 1,
				disposition: "active"
			});
			if (capture.truncated) limitations.add(`Process Evidence ${evidence.evidence_id} is truncated; absence and upper bounds remain unknown.`);
		};
		generatedCandidate = ({ key, title, policy: candidatePolicy, artifactSha256, applicationNodeId, semanticNodeId, location, authorityReferences, residualUnknownIds = [] }) => ({
			obligation_id: obligationId(key),
			obligation_version: 1,
			title,
			origin: "generated",
			application_layer: candidatePolicy.applicationLayer,
			family: candidatePolicy.family,
			target: {
				artifact_sha256: artifactSha256,
				application_node_id: applicationNodeId,
				semantic_node_id: semanticNodeId,
				location
			},
			authority_references: authorityReferences,
			source_state: sourceState(authorityReferences),
			observed_cases: [],
			required: true,
			required_case_kinds: candidatePolicy.cases,
			required_original_authority: candidatePolicy.originalAuthority,
			required_fixture_authority: candidatePolicy.fixtureAuthority,
			required_verifier_authority: candidatePolicy.verifierAuthority,
			requires_parser_type: candidatePolicy.requiresParserType,
			dependency_obligation_ids: [],
			residual_unknown_ids: residualUnknownIds,
			unavailable_authority: [],
			required_next_evidence: [`Obtain ${candidatePolicy.originalAuthority} authority for this finite ${candidatePolicy.family} claim.`],
			definitionCount: 1,
			disposition: "active"
		});
		reviewedCandidate = (obligation, records) => {
			const { review_evidence_ids: reviewEvidenceIds, disposition, ...definition } = obligation;
			return {
				...definition,
				origin: "reviewed",
				authority_references: reviewEvidenceIds.map((evidenceId) => {
					const evidence = records.get(evidenceId);
					if (evidence === undefined) throw new Error(`Resolved reviewed obligation references absent Evidence: ${evidenceId}`);
					return {
						evidence_id: evidenceId,
						authority: evidence.authority,
						state: reviewedEvidenceState(evidence),
						location: `/evidence/${evidenceId}`
					};
				}),
				source_state: "reviewed",
				observed_cases: [],
				definitionCount: 1,
				disposition
			};
		};
		graphReference = (envelope, records, graphEvidence, location) => {
			const linkedId = graphEvidence.evidence_ids.find((evidenceId) => records.has(evidenceId)) ?? envelope.evidence_id;
			const linked = records.get(linkedId) ?? envelope;
			const runtimeAuthority = ["passive-cdp-runtime", "controlled-replay"].includes(graphEvidence.authority);
			return {
				evidence_id: linked.evidence_id,
				authority: linked.authority,
				state: runtimeAuthority && graphEvidence.state === "observed" ? "observed" : graphEvidence.state === "unknown" || graphEvidence.state === "unavailable" ? "unknown" : "candidate",
				location
			};
		};
		reviewedEvidenceState = (evidence) => {
			if (evidenceSupportsOriginalAuthority(evidence, "process")) return "observed";
			if (evidence.authority === "external-service" && evidence.confidence === "observed") return "observed";
			if (evidence.authority === "shipped-artifact") return "candidate";
			return "reviewed";
		};
		addCandidate = (candidates, candidate) => {
			const current = candidates.get(candidate.obligation_id);
			if (current === undefined) {
				candidates.set(candidate.obligation_id, candidate);
				return;
			}
			candidates.set(candidate.obligation_id, {
				...current,
				authority_references: uniqueSortedBy([...current.authority_references, ...candidate.authority_references], (reference) => `${reference.evidence_id}:${reference.state}:${reference.location}`),
				observed_cases: uniqueSortedBy([...current.observed_cases, ...candidate.observed_cases], (item) => `${item.kind}:${item.evidence_id}:${item.location}`),
				source_state: sourceState([...current.authority_references, ...candidate.authority_references]),
				residual_unknown_ids: uniqueSorted([...current.residual_unknown_ids, ...candidate.residual_unknown_ids]),
				unavailable_authority: uniqueSorted([...current.unavailable_authority, ...candidate.unavailable_authority]),
				required_next_evidence: uniqueSorted([...current.required_next_evidence, ...candidate.required_next_evidence]),
				definitionCount: current.origin === "generated" && candidate.origin === "generated" ? current.definitionCount : current.definitionCount + candidate.definitionCount
			});
		};
		sourceState = (references) => {
			if (references.some(({ state }) => state === "observed")) return "observed";
			if (references.some(({ state }) => state === "candidate")) return "candidate";
			if (references.some(({ state }) => state === "reviewed")) return "reviewed";
			return "unknown";
		};
		obligationId = (key) => `obl_${digestCanonicalValue({
			schema: "ReconstructionObligation",
			key
		}, "Reconstruction obligation key")}`;
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationLedgerDiagnostics.js
var groupManifestBindings, groupManifestContradictions, addObligationDiagnostic, uniqueObligationDiagnostics, contradictionDiagnostics;
function init_ReconstructionObligationLedgerDiagnostics() {
	return (init_ReconstructionObligationLedgerDiagnostics = __esmMin((() => {
		init_unicodeCodePointOrder();
		groupManifestBindings = (manifest) => {
			const grouped = new Map();
			for (const binding of manifest.bindings) grouped.set(binding.obligation_id, [...grouped.get(binding.obligation_id) ?? [], binding]);
			return grouped;
		};
		groupManifestContradictions = (manifest) => {
			const grouped = new Map();
			for (const contradiction of manifest.contradictions) grouped.set(contradiction.obligation_id, [...grouped.get(contradiction.obligation_id) ?? [], contradiction]);
			return grouped;
		};
		addObligationDiagnostic = (diagnostics, code, detail) => {
			diagnostics.push({
				code,
				detail
			});
		};
		uniqueObligationDiagnostics = (diagnostics) => [...new Map(diagnostics.map((diagnostic) => [`${diagnostic.code}:${diagnostic.detail}`, diagnostic])).values()].sort((left, right) => compareUnicodeCodePoints(`${left.code}:${left.detail}`, `${right.code}:${right.detail}`));
		contradictionDiagnostics = (obligationId, contradictions, evidenceById) => {
			const entries = contradictions.get(obligationId) ?? [];
			const missing = new Set(entries.flatMap(({ evidence_ids: ids }) => ids.filter((evidenceId) => !evidenceById.has(evidenceId))));
			const diagnostics = [];
			if (missing.size > 0) addObligationDiagnostic(diagnostics, "contradiction-evidence-missing", `Contradiction references missing Evidence: ${[...missing].join(", ")}.`);
			if (entries.some(({ evidence_ids: ids }) => ids.every((evidenceId) => evidenceById.has(evidenceId)))) addObligationDiagnostic(diagnostics, "contradiction", "Authenticated contradictory Evidence reopens this obligation.");
			return diagnostics;
		};
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationOriginalCases.js
var originalCasesFor, originalCaseDiagnostics;
function init_ReconstructionObligationOriginalCases() {
	return (init_ReconstructionObligationOriginalCases = __esmMin((() => {
		init_ReconstructionObligationAuthority();
		init_unicodeCodePointOrder();
		originalCasesFor = (candidate, binding) => [...new Map([...candidate.observed_cases, ...binding?.original_cases ?? []].map((observed) => [`${observed.kind}:${observed.evidence_id}:${observed.location}`, observed])).values()].sort((left, right) => compareUnicodeCodePoints(`${left.kind}:${left.evidence_id}:${left.location}`, `${right.kind}:${right.evidence_id}:${right.location}`));
		originalCaseDiagnostics = (candidate, binding, evidenceById) => {
			const diagnostics = [];
			const originalCases = originalCasesFor(candidate, binding);
			for (const { kind, evidence_id: evidenceId } of originalCases) if (!evidenceById.has(evidenceId)) diagnostics.push({
				code: "missing-original-case",
				detail: `Original ${kind} case references Evidence ${evidenceId}, which is absent from the bundle.`
			});
			for (const caseKind of candidate.required_case_kinds) {
				const cases = originalCases.filter(({ kind }) => kind === caseKind);
				if (cases.length === 0) {
					diagnostics.push({
						code: "missing-original-case",
						detail: `Original ${caseKind} behavior has not been observed.`
					});
					continue;
				}
				if (!cases.some(({ evidence_id: evidenceId }) => {
					const evidence = evidenceById.get(evidenceId);
					return evidence !== undefined && evidenceSupportsOriginalAuthority(evidence, candidate.required_original_authority);
				})) diagnostics.push({
					code: "weak-original-case-authority",
					detail: `Original ${caseKind} behavior lacks ${candidate.required_original_authority} Evidence.`
				});
			}
			return diagnostics;
		};
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationLedgerProjection.js
var obligationLedgerEvidenceLinks;
function init_ReconstructionObligationLedgerProjection() {
	return (init_ReconstructionObligationLedgerProjection = __esmMin((() => {
		init_reconstructionObligationLedgerIntegrity();
		init_unicodeCodePointOrder();
		obligationLedgerEvidenceLinks = (obligations, manifest) => [...new Set([
			...reconstructionObligationEvidenceIds(obligations),
			...manifest.bindings.flatMap((binding) => [
				...binding.original_cases.map(({ evidence_id: id }) => id),
				...binding.fixtures.flatMap(({ evidence_ids: ids }) => ids),
				...binding.verifier === null ? [] : [binding.verifier.result_evidence_id]
			]),
			...manifest.contradictions.flatMap(({ evidence_ids: ids }) => ids)
		])].sort(compareUnicodeCodePoints);
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationLedgerEvaluation.js
var evaluateReconstructionObligationLedger, createEvaluationContext, findOrphanManifestIds, ledgerLimitations, evaluateObligation, evaluateBinding, evaluateVerifier, evaluateAuthority, evaluateDisposition, applyDependencyDiagnostics, obligationStatus, dependencyStatus;
function init_ReconstructionObligationLedgerEvaluation() {
	return (init_ReconstructionObligationLedgerEvaluation = __esmMin((() => {
		init_reconstructionObligationLedgerSchemas();
		init_canonicalDigest();
		init_reconstructionObligationLedgerIntegrity();
		init_ReconstructionObligationAuthority();
		init_ReconstructionObligationLedgerDiagnostics();
		init_ReconstructionObligationOriginalCases();
		init_ReconstructionObligationLedgerProjection();
		init_unicodeCodePointOrder();
		evaluateReconstructionObligationLedger = ({ candidates: candidatesInput, sources, manifest, generationLimitations }) => {
			const { bundle, records } = sources;
			const candidates = [...candidatesInput].sort((left, right) => compareUnicodeCodePoints(left.obligation_id, right.obligation_id));
			const orphanManifestIds = findOrphanManifestIds(candidates, manifest);
			const context = createEvaluationContext(candidates, records, manifest);
			const obligations = applyDependencyDiagnostics(candidates.map((candidate) => evaluateObligation(candidate, context)), context);
			const ownershipGraph = reconstructionObligationOwnershipGraph(obligations);
			const dependencyGraph = reconstructionObligationDependencyGraph(obligations);
			const evidenceLinks = obligationLedgerEvidenceLinks(obligations, manifest);
			const limitations = ledgerLimitations(generationLimitations, candidates.length, orphanManifestIds);
			const coverage = reconstructionObligationCoverage(limitations);
			const semantic = {
				coverage,
				summary: summarizeReconstructionObligations(obligations),
				reports: reconstructionObligationReports(obligations),
				ownership_graph: ownershipGraph,
				dependency_graph: dependencyGraph,
				obligations,
				evidence_links: evidenceLinks,
				limitations
			};
			const status = reconstructionObligationLedgerStatus(obligations, limitations);
			const closureDigest = reconstructionObligationLedgerClosureDigest({
				status,
				...semantic
			});
			return reconstructionObligationLedgerSchema.parse({
				schema: "ReconstructionObligationLedger",
				ledger_id: `rol_${digestCanonicalValue({
					schema: "ReconstructionObligationLedger",
					evidence_ids: bundle.records.map(({ evidence_id: id }) => id),
					obligation_ids: obligations.map(({ obligation_id: id }) => id),
					closure_digest: closureDigest
				}, "Reconstruction obligation ledger")}`,
				closure_digest: closureDigest,
				status,
				...semantic
			});
		};
		createEvaluationContext = (candidates, evidence, manifest) => ({
			candidates: new Map(candidates.map((candidate) => [candidate.obligation_id, candidate])),
			evidence,
			proofs: new Map([...evidence].map(([id, record]) => [id, parseReconstructionProofEvidence(record)])),
			bindings: groupManifestBindings(manifest),
			contradictions: groupManifestContradictions(manifest)
		});
		findOrphanManifestIds = (candidates, manifest) => {
			const candidateIds = new Set(candidates.map(({ obligation_id: obligationId }) => obligationId));
			return [...new Set([...manifest.bindings.map(({ obligation_id: obligationId }) => obligationId), ...manifest.contradictions.map(({ obligation_id: obligationId }) => obligationId)].filter((obligationId) => !candidateIds.has(obligationId)))].sort();
		};
		ledgerLimitations = (generationLimitations, candidateCount, orphanManifestIds) => [...new Set([
			...generationLimitations,
			...candidateCount === 0 ? ["No reconstruction obligations were derived; closure cannot be claimed."] : [],
			...orphanManifestIds.length > 0 ? [`Manifest entries reference unknown obligations: ${orphanManifestIds.join(", ")}.`] : []
		])].sort();
		evaluateObligation = (candidate, context) => {
			const bindings = context.bindings.get(candidate.obligation_id) ?? [];
			const binding = bindings.length === 1 ? bindings[0] ?? null : null;
			const diagnostics = [];
			if (candidate.definitionCount > 1) addObligationDiagnostic(diagnostics, "duplicate-definition", "Multiple candidate definitions share this obligation ID.");
			if (bindings.length === 0) addObligationDiagnostic(diagnostics, "missing-owner", "No reconstruction manifest binding owns this obligation.");
			if (bindings.length > 1) addObligationDiagnostic(diagnostics, "ambiguous-owner", "Multiple reconstruction manifest bindings claim this obligation.");
			if (binding !== null) evaluateBinding(candidate, binding, context, diagnostics);
			diagnostics.push(...originalCaseDiagnostics(candidate, binding, context.evidence));
			evaluateAuthority(candidate, binding, context, diagnostics);
			evaluateDisposition(candidate, diagnostics);
			diagnostics.push(...contradictionDiagnostics(candidate.obligation_id, context.contradictions, context.evidence));
			for (const unknownId of candidate.residual_unknown_ids) addObligationDiagnostic(diagnostics, "residual-unknown", `Residual unknown remains visible: ${unknownId}.`);
			for (const unavailable of candidate.unavailable_authority) addObligationDiagnostic(diagnostics, "unavailable-authority", unavailable);
			return {
				obligation_id: candidate.obligation_id,
				obligation_version: candidate.obligation_version,
				title: candidate.title,
				origin: candidate.origin,
				application_layer: candidate.application_layer,
				family: candidate.family,
				target: candidate.target,
				authority_references: candidate.authority_references,
				source_state: candidate.source_state,
				observed_cases: originalCasesFor(candidate, binding),
				required: candidate.required,
				required_case_kinds: candidate.required_case_kinds,
				required_original_authority: candidate.required_original_authority,
				required_fixture_authority: candidate.required_fixture_authority,
				required_verifier_authority: candidate.required_verifier_authority,
				requires_parser_type: candidate.requires_parser_type,
				dependency_obligation_ids: candidate.dependency_obligation_ids,
				residual_unknown_ids: candidate.residual_unknown_ids,
				unavailable_authority: candidate.unavailable_authority,
				required_next_evidence: candidate.required_next_evidence,
				binding,
				status: obligationStatus(candidate, binding, diagnostics),
				diagnostics: uniqueObligationDiagnostics(diagnostics)
			};
		};
		evaluateBinding = (candidate, binding, context, diagnostics) => {
			if (candidate.requires_parser_type && binding.parser_type === null) addObligationDiagnostic(diagnostics, "missing-parser-type", "This boundary requires an explicit parser, schema, and domain type.");
			for (const fixture of binding.fixtures) for (const evidenceId of fixture.evidence_ids) if (!context.evidence.has(evidenceId)) addObligationDiagnostic(diagnostics, "missing-case", `${fixture.case_kind} fixture ${fixture.fixture_id} references Evidence ${evidenceId}, which is absent from the bundle.`);
			for (const caseKind of candidate.required_case_kinds) {
				const fixtures = binding.fixtures.filter(({ case_kind: fixtureCase }) => fixtureCase === caseKind);
				if (fixtures.length === 0) {
					addObligationDiagnostic(diagnostics, "missing-case", `Required ${caseKind} fixture is missing.`);
					continue;
				}
				const qualifications = fixtures.map((fixture) => ({
					authoritySatisfied: proofAuthoritySatisfies(fixture.authority, candidate.required_fixture_authority),
					proofs: fixture.evidence_ids.map((id) => {
						const proof = context.proofs.get(id);
						return proof === undefined ? {
							ok: false,
							error: "missing-evidence"
						} : qualifyReconstructionProof(proof, fixture.authority, {
							kind: "fixture",
							obligationId: candidate.obligation_id,
							obligationVersion: candidate.obligation_version,
							ownerSha256: binding.owner.owner_sha256,
							fixtureId: fixture.fixture_id,
							caseKind: fixture.case_kind
						});
					})
				}));
				if (qualifications.some(({ authoritySatisfied, proofs }) => authoritySatisfied && proofs.every((proof) => proof.ok))) continue;
				const failures = qualifications.flatMap(({ proofs }) => proofs.flatMap((proof) => proof.ok ? [] : [proof.error]));
				if (qualifications.some(({ authoritySatisfied }) => !authoritySatisfied) || failures.includes("insufficient-authority")) addObligationDiagnostic(diagnostics, "weak-fixture-authority", `${caseKind} fixture lacks ${candidate.required_fixture_authority} authority.`);
				if (failures.length > 0) addObligationDiagnostic(diagnostics, failures.includes("failed-proof") ? "fixture-failed" : "inapplicable-fixture-proof", `${caseKind} fixture proof qualification: ${[...new Set(failures)].sort().join(", ")}.`);
			}
			evaluateVerifier(candidate, binding, context, diagnostics);
		};
		evaluateVerifier = (candidate, binding, context, diagnostics) => {
			const verifier = binding.verifier;
			if (verifier === null) {
				addObligationDiagnostic(diagnostics, "missing-verifier", "No verifier claim is bound to this obligation.");
				return;
			}
			if (!verifier.enumerated_obligation_ids.includes(candidate.obligation_id)) addObligationDiagnostic(diagnostics, "verifier-does-not-enumerate", "The verifier claim does not enumerate this obligation ID.");
			const resultEvidence = context.evidence.get(verifier.result_evidence_id);
			if (resultEvidence === undefined) addObligationDiagnostic(diagnostics, "missing-verifier-result", "The latest verifier result Evidence is absent from the bundle.");
			if (!proofAuthoritySatisfies(verifier.authority, candidate.required_verifier_authority)) addObligationDiagnostic(diagnostics, "weak-verifier-authority", `Verifier authority does not satisfy ${candidate.required_verifier_authority}.`);
			const proof = context.proofs.get(verifier.result_evidence_id);
			if (proof !== undefined) {
				const qualification = qualifyReconstructionProof(proof, verifier.authority, {
					kind: "verifier",
					obligationId: candidate.obligation_id,
					obligationVersion: candidate.obligation_version,
					ownerSha256: binding.owner.owner_sha256,
					verifierId: verifier.verifier_id,
					claimId: verifier.claim_id
				});
				if (!qualification.ok) addObligationDiagnostic(diagnostics, qualification.error === "failed-proof" ? "verifier-failed" : qualification.error === "insufficient-authority" ? "weak-verifier-authority" : "inapplicable-verifier-proof", `Verifier proof qualification: ${qualification.error}.`);
			}
			if (verifier.status !== "pass") addObligationDiagnostic(diagnostics, verifier.status === "fail" ? "verifier-failed" : "verifier-unavailable", `Latest verifier status is ${verifier.status}.`);
		};
		evaluateAuthority = (candidate, binding, context, diagnostics) => {
			const referenceSatisfied = candidate.authority_references.some((reference) => {
				const evidence = context.evidence.get(reference.evidence_id);
				return evidence !== undefined && (candidate.required_original_authority === "static" ? ["candidate", "observed"].includes(reference.state) : reference.state === "observed") && evidenceSupportsOriginalAuthority(evidence, candidate.required_original_authority);
			});
			const caseSatisfied = originalCasesFor(candidate, binding).some(({ evidence_id: evidenceId }) => {
				const evidence = context.evidence.get(evidenceId);
				return evidence !== undefined && evidenceSupportsOriginalAuthority(evidence, candidate.required_original_authority);
			});
			const satisfied = referenceSatisfied || caseSatisfied;
			if (!satisfied) addObligationDiagnostic(diagnostics, "static-only", `No ${candidate.required_original_authority} authority characterizes the original finite behavior.`);
		};
		evaluateDisposition = (candidate, diagnostics) => {
			if (candidate.disposition === "blocked") addObligationDiagnostic(diagnostics, "blocked", "Reviewed disposition marks this obligation blocked.");
			if (candidate.disposition === "out-of-scope") addObligationDiagnostic(diagnostics, "out-of-scope", "Reviewed disposition marks this obligation out of scope; it remains visible.");
		};
		applyDependencyDiagnostics = (obligations, context) => {
			let evaluated = [...obligations];
			for (let pass = 0; pass < obligations.length; pass += 1) {
				const statuses = new Map(evaluated.map(({ obligation_id: id, status }) => [id, status]));
				let changed = false;
				evaluated = evaluated.map((obligation) => {
					const diagnostics = [...obligation.diagnostics];
					for (const dependencyId of obligation.dependency_obligation_ids) {
						const missing = !context.candidates.has(dependencyId);
						if (missing || statuses.get(dependencyId) !== "verified") addObligationDiagnostic(diagnostics, missing ? "dependency-missing" : "dependency-open", `Dependency obligation is ${missing ? "missing" : "not verified"}: ${dependencyId}.`);
					}
					const normalized = uniqueObligationDiagnostics(diagnostics);
					const status = dependencyStatus(obligation.status, normalized);
					changed ||= status !== obligation.status;
					return {
						...obligation,
						status,
						diagnostics: normalized
					};
				});
				if (!changed) break;
			}
			return evaluated;
		};
		obligationStatus = (candidate, binding, diagnostics) => {
			if (hasReconstructionObligationDiagnostic(diagnostics, "out-of-scope")) return "out-of-scope";
			if (hasReconstructionObligationDiagnostic(diagnostics, "blocked")) return "blocked";
			if (hasReconstructionObligationDiagnostic(diagnostics, "contradiction")) return "contradicted";
			if (hasReconstructionObligationDiagnostic(diagnostics, "duplicate-definition") || hasReconstructionObligationDiagnostic(diagnostics, "residual-unknown") || hasReconstructionObligationDiagnostic(diagnostics, "unavailable-authority")) return "unknown";
			if (binding === null) return "unowned";
			if (diagnostics.length === 0) return "verified";
			return "implemented";
		};
		dependencyStatus = (status, diagnostics) => (hasReconstructionObligationDiagnostic(diagnostics, "dependency-missing") || hasReconstructionObligationDiagnostic(diagnostics, "dependency-open")) && !["contradicted", "out-of-scope"].includes(status) ? "blocked" : status;
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationLedgerRequest.js
var OPERATION$1, requestSchema, resolveReconstructionObligationLedgerRequest;
function init_ReconstructionObligationLedgerRequest() {
	return (init_ReconstructionObligationLedgerRequest = __esmMin((() => {
		init_analysisErrorCore();
		init_evidenceBundle();
		init_reconstructionObligationLedgerSchemas();
		init_result();
		init_inputIssueProjection();
		OPERATION$1 = "build_reconstruction_obligation_ledger";
		requestSchema = reconstructionObligationLedgerInputSchema.extend({ evidence_bundle: z.unknown() });
		resolveReconstructionObligationLedgerRequest = (input) => {
			const frame = requestSchema.safeParse(input);
			if (!frame.success) return err(analysisInputErrorFromIssues(OPERATION$1, frame.error.issues, input, { cause: frame.error }));
			const bundle = readEvidenceBundle(frame.data.evidence_bundle);
			if (!bundle.ok) return bundle;
			const records = new Map(bundle.value.records.map((record) => [record.evidence_id, record]));
			for (const [index, obligation] of frame.data.reviewed_obligations.entries()) {
				for (const [referenceIndex, id] of obligation.review_evidence_ids.entries()) {
					if (records.has(id)) continue;
					const message = `Reviewed obligation Evidence is missing: ${id}`;
					return err(new AnalysisInputError(OPERATION$1, { userMessage: message }, [{
						path: [
							"reviewed_obligations",
							index,
							"review_evidence_ids",
							referenceIndex
						],
						reason: "invalid_value",
						message
					}]));
				}
			}
			return ok({
				sources: {
					bundle: bundle.value,
					records
				},
				reviewedObligations: frame.data.reviewed_obligations,
				manifest: frame.data.manifest
			});
		};
	})))();
}

//#endregion
//#region dist/application/ReconstructionObligationLedgerService.js
var OPERATION, buildReconstructionObligationLedgerEvidence, buildResolvedReconstructionObligationLedgerEvidence, createLedgerEvidence;
function init_ReconstructionObligationLedgerService() {
	return (init_ReconstructionObligationLedgerService = __esmMin((() => {
		init_evidence();
		init_result();
		init_investigationProviders();
		init_ReconstructionObligationCandidates();
		init_ReconstructionObligationLedgerEvaluation();
		init_ReconstructionObligationLedgerRequest();
		OPERATION = "build_reconstruction_obligation_ledger";
		buildReconstructionObligationLedgerEvidence = (input) => {
			const request = resolveReconstructionObligationLedgerRequest(input);
			if (!request.ok) return request;
			return ok(buildResolvedReconstructionObligationLedgerEvidence(request.value));
		};
		buildResolvedReconstructionObligationLedgerEvidence = (request) => {
			const generated = deriveReconstructionObligationCandidates(request);
			const ledger = evaluateReconstructionObligationLedger({
				candidates: generated.candidates,
				sources: request.sources,
				manifest: request.manifest,
				generationLimitations: generated.limitations
			});
			return createLedgerEvidence(ledger);
		};
		createLedgerEvidence = (ledger) => createEvidence(undefined, JAVASCRIPT_APPLICATION_WORKFLOW_PROVIDER, {
			predicateType: "rea.reconstruction-obligation-ledger",
			operation: OPERATION,
			parameters: {
				ledger_id: ledger.ledger_id,
				closure_digest: ledger.closure_digest
			},
			result: ledger,
			rawResult: null,
			confidence: "inferred",
			authority: "analyst-inference",
			environment: null,
			limitations: ledger.limitations,
			evidenceLinks: ledger.evidence_links
		});
	})))();
}

//#endregion
init_ReconstructionObligationLedgerService();
export { buildReconstructionObligationLedgerEvidence };