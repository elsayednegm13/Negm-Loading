import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareOffsetDateTimeInstants, compareUnicodeCodePoints, compositeKey, digestCanonicalValue, digestSchema, init_canonicalDigest, init_canonicalOrdering, init_digests, init_inputIssueProjection, init_offsetDateTime, init_unicodeCodePointOrder, offsetDateTimeInstantFromEpochMilliseconds, offsetDateTimeSchema, parseOffsetDateTimeInstant, prefixedDigestSchema, projectInputIssues, uniqueSorted } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, err, init_analysisErrorCore, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { evidenceBundleSchema, init_evidenceBundle, readEvidenceBundle } from "./evidenceBundle-DojUFdme.js";
import { z } from "zod";

//#region dist/domain/reconstructionCoverageScope.js
var reconstructionCoverageScope, reachableSurfaces;
function init_reconstructionCoverageScope() {
	return (init_reconstructionCoverageScope = __esmMin((() => {
		reconstructionCoverageScope = (parsed, boundary) => {
			const claimIds = new Set(boundary.required_claim_ids);
			const claimSurfaceIds = new Map();
			for (const claimId of claimIds) {
				const claim = parsed.claims.get(claimId);
				if (claim !== undefined) claimSurfaceIds.set(claimId, reachableSurfaces(claim.surface_ids, parsed.surfaces).surfaceIds);
			}
			return {
				...reachableSurfaces([...boundary.required_surface_ids, ...[...claimSurfaceIds.values()].flatMap((ids) => [...ids])], parsed.surfaces),
				claimIds,
				claimSurfaceIds
			};
		};
		reachableSurfaces = (roots, surfaces) => {
			const surfaceIds = new Set(roots);
			const pending = [...surfaceIds];
			const missingDependencies = new Map();
			for (let index = 0; index < pending.length; index += 1) {
				const surface = surfaces.get(pending[index]);
				if (surface === undefined) continue;
				for (const dependencyId of surface.dependency_surface_ids) {
					if (!surfaces.has(dependencyId)) {
						const dependents = missingDependencies.get(dependencyId) ?? new Set();
						dependents.add(surface.surface_id);
						missingDependencies.set(dependencyId, dependents);
					}
					if (!surfaceIds.has(dependencyId)) {
						surfaceIds.add(dependencyId);
						pending.push(dependencyId);
					}
				}
			}
			return {
				surfaceIds,
				missingDependencies
			};
		};
	})))();
}

//#endregion
//#region dist/domain/reconstructionCoverageEvidence.js
var evidenceAuthorities, packageAuthorities, verifierHasComparableEvidence, packageProofHasComparableEvidence, hasComparableEvidence;
function init_reconstructionCoverageEvidence() {
	return (init_reconstructionCoverageEvidence = __esmMin((() => {
		evidenceAuthorities = {
			"shipped-artifact": ["shipped-artifact"],
			"controlled-replay": ["controlled-replay"],
			"live-observation": ["controlled-replay", "external-service"],
			external: ["external-service"]
		};
		packageAuthorities = {
			build: ["live-observation"],
			"clean-install": ["live-observation"],
			"package-contents": ["shipped-artifact", "live-observation"],
			"runtime-routing": ["live-observation"],
			"authority-independence": ["shipped-artifact", "live-observation"]
		};
		verifierHasComparableEvidence = (result, contract, records) => hasComparableEvidence(result.evidence_ids, [contract.authority], records);
		packageProofHasComparableEvidence = (proof, records) => hasComparableEvidence(proof.evidence_ids, packageAuthorities[proof.kind], records);
		hasComparableEvidence = (evidenceIds, requirements, records) => evidenceIds.some((id) => {
			const evidence = records.get(id);
			if (evidence === undefined) return false;
			return requirements.some((required) => evidenceAuthorities[required].includes(evidence.authority) && (evidence.confidence === "observed" || required === "shipped-artifact" && evidence.confidence === "derived"));
		});
	})))();
}

//#endregion
//#region dist/domain/reconstructionCoverageVerifierResults.js
var latestVerifierObservationsByVerifier, sameVerifierAssessment, verifierAssessmentIdentity;
function init_reconstructionCoverageVerifierResults() {
	return (init_reconstructionCoverageVerifierResults = __esmMin((() => {
		init_canonicalOrdering();
		init_offsetDateTime();
		latestVerifierObservationsByVerifier = (results) => {
			const latestByVerifier = new Map();
			for (const result of results) {
				const observation = {
					result,
					instant: parseOffsetDateTimeInstant(result.observed_at)
				};
				const latest = latestByVerifier.get(result.verifier_id);
				const latestInstant = latest?.[0]?.instant;
				const comparison = latestInstant === undefined ? 1 : compareOffsetDateTimeInstants(observation.instant, latestInstant);
				if (latest === undefined || comparison > 0) latestByVerifier.set(result.verifier_id, [observation]);
				else if (comparison === 0) latest.push(observation);
			}
			return latestByVerifier;
		};
		sameVerifierAssessment = (left, right) => verifierAssessmentIdentity(left) === verifierAssessmentIdentity(right);
		verifierAssessmentIdentity = (result) => JSON.stringify({
			verifier_id: result.verifier_id,
			contract_sha256: result.contract_sha256,
			status: result.status,
			covered_claim_ids: uniqueSorted(result.covered_claim_ids),
			covered_dimensions: uniqueSorted(result.covered_dimensions),
			artifact_sha256s: uniqueSorted(result.artifact_sha256s),
			owner_sha256s: uniqueSorted(result.owner_sha256s),
			normalization_sha256: result.normalization_sha256,
			repeats: result.repeats
		});
	})))();
}

//#endregion
//#region dist/domain/reconstructionCoverageEvaluation.js
var recommendedReconstructionProbes, probeOperation, evaluateReconstructionSurfaces, evaluateOwner, evaluateReconstructionClaims, createVerifierIndexes, evaluateVerifierResult, verifierResultMatchesContract, evaluateReconstructionCoverageRisks, evaluateReconstructionPackageProofs, addReason, addEvidence;
function init_reconstructionCoverageEvaluation() {
	return (init_reconstructionCoverageEvaluation = __esmMin((() => {
		init_reconstructionCoverageEvidence();
		init_offsetDateTime();
		init_reconstructionCoverageVerifierResults();
		recommendedReconstructionProbes = (reasons) => reasons.map((reason) => ({
			operation: probeOperation(reason.code),
			subject_id: reason.subject_id,
			rationale: reason.detail
		}));
		probeOperation = (code) => {
			if (code.startsWith("owner-") || code.startsWith("authority-routing")) return "reconcile_reconstruction_owner";
			if (code.startsWith("verifier-")) return "run_reconstruction_verifier";
			if (code.startsWith("package-proof")) return "verify_reconstruction_package";
			if (code === "active-contradiction") return "resolve_contradiction";
			if (code === "active-unknown") return "probe_residual_unknown";
			return "update_authoritative_inventory";
		};
		evaluateReconstructionSurfaces = (context) => {
			for (const surfaceId of context.scope.surfaceIds) {
				const surface = context.surfaces.get(surfaceId);
				if (surface === undefined) {
					const dependents = context.scope.missingDependencies.get(surfaceId);
					if (dependents === undefined) addReason(context, "surface-missing", surfaceId, "Required surface is absent from the authoritative inventory.");
					else for (const dependentId of dependents) addReason(context, "dependency-surface-missing", dependentId, `Declared dependency surface is absent: ${surfaceId}`);
					continue;
				}
				addEvidence(context, surface.evidence_ids);
				evaluateOwner(context, surfaceId);
			}
		};
		evaluateOwner = (context, surfaceId) => {
			const owners = context.ownersBySurface.get(surfaceId) ?? [];
			if (owners.length === 0) {
				addReason(context, "owner-missing", surfaceId, "Required surface has no reconstructed owner or explicit disposition.");
				return;
			}
			if (owners.length > 1) {
				addReason(context, "owner-duplicate", surfaceId, "Required surface has conflicting ownership declarations.");
				return;
			}
			const owner = owners[0]?.ownership;
			if (owner === undefined) return;
			if (owner.disposition !== "implemented") {
				if (!context.boundary.allowed_dispositions.includes(owner.disposition)) addReason(context, "disposition-not-allowed", surfaceId, `${owner.disposition} is not allowed by this completion boundary.`);
				return;
			}
			const ownerChecks = [
				[
					owner.path_state === "missing",
					"owner-path-missing",
					"Declared owner path is missing."
				],
				[
					owner.path_state === "unknown",
					"owner-path-unknown",
					"Declared owner path has not been checked."
				],
				[
					owner.package_state === "missing",
					"owner-undistributed",
					"Declared owner is absent from the distributable."
				],
				[
					owner.package_state === "unknown",
					"owner-distribution-unknown",
					"Owner distribution state is unknown."
				],
				[
					owner.authority_route === "detected",
					"authority-routing-detected",
					"Reconstructed owner routes into the authority."
				],
				[
					owner.authority_route === "unknown",
					"authority-routing-unknown",
					"Authority independence has not been established."
				]
			];
			for (const [matches, code, detail] of ownerChecks) if (matches) addReason(context, code, surfaceId, detail);
		};
		evaluateReconstructionClaims = (context) => {
			const indexes = createVerifierIndexes(context);
			for (const claimId of context.scope.claimIds) {
				const claim = context.claims.get(claimId);
				if (claim === undefined) {
					addReason(context, "claim-missing", claimId, "Required finite claim is absent.");
					continue;
				}
				const contracts = indexes.contractsByClaim.get(claimId) ?? [];
				if (contracts.length === 0) {
					addReason(context, "verifier-missing", claimId, "No verifier contract covers this claim.");
					continue;
				}
				if (contracts.length > 1) {
					addReason(context, "verifier-duplicate", claimId, "Multiple verifier contracts claim primary coverage.");
					continue;
				}
				const contract = contracts[0];
				if (contract !== undefined) evaluateVerifierResult(context, claim, contract, indexes);
			}
		};
		createVerifierIndexes = (context) => {
			const { coverage } = context;
			const contractsByClaim = new Map();
			for (const contract of coverage.verifier_contracts) for (const claimId of new Set(contract.claim_ids)) {
				const contracts = contractsByClaim.get(claimId) ?? [];
				contracts.push(contract);
				contractsByClaim.set(claimId, contracts);
			}
			return {
				claimSurfaceIds: context.scope.claimSurfaceIds,
				contractsByClaim,
				latestResultsByVerifier: latestVerifierObservationsByVerifier(coverage.verifier_results),
				artifactDigests: new Set(coverage.artifacts.map(({ artifact_sha256: value }) => value)),
				ownerDigests: new Set(coverage.owners.flatMap(({ ownership }) => ownership.disposition === "implemented" ? [ownership.owner_sha256] : [])),
				surfaces: context.surfaces,
				artifacts: context.artifacts,
				ownersBySurface: context.ownersBySurface
			};
		};
		evaluateVerifierResult = (context, claim, contract, indexes) => {
			const latestResults = indexes.latestResultsByVerifier.get(contract.verifier_id);
			if (latestResults === undefined) {
				addReason(context, "verifier-result-missing", claim.claim_id, "Verifier has no recorded result.");
				return;
			}
			addEvidence(context, latestResults.flatMap(({ result }) => result.evidence_ids));
			const latest = latestResults[0];
			if (latest === undefined) return;
			if (!latestResults.every((candidate) => sameVerifierAssessment(latest.result, candidate.result))) {
				addReason(context, "verifier-result-ambiguous", claim.claim_id, "Latest verifier observations have conflicting assessment content.");
				return;
			}
			const comparable = latestResults.find(({ result }) => verifierHasComparableEvidence(result, contract, context.evidenceById));
			if (comparable === undefined) {
				addReason(context, "verifier-result-incompatible", claim.claim_id, `Latest verifier observation has no cited Evidence with comparable ${contract.authority} authority and confidence.`);
				return;
			}
			const { result } = comparable;
			if (!verifierResultMatchesContract(claim, contract, result, indexes)) {
				addReason(context, "verifier-result-incompatible", claim.claim_id, "Latest verifier result does not match current artifacts, owners, dimensions, authority, normalization, repeats, or contract.");
				return;
			}
			const cutoffEpochMs = context.nowEpochMs - contract.max_age_ms;
			if (compareOffsetDateTimeInstants(comparable.instant, context.nowInstant) > 0 || cutoffEpochMs >= -Number.MAX_SAFE_INTEGER && compareOffsetDateTimeInstants(comparable.instant, offsetDateTimeInstantFromEpochMilliseconds(cutoffEpochMs)) < 0) {
				addReason(context, "verifier-result-stale", claim.claim_id, "Latest compatible verifier result is stale.");
				return;
			}
			if (result.status === "fail") addReason(context, "verifier-failed", claim.claim_id, "Latest compatible verifier result failed.");
			else if (result.status !== "pass") addReason(context, "verifier-unknown", claim.claim_id, `Latest compatible verifier result is ${result.status}.`);
		};
		verifierResultMatchesContract = (claim, contract, result, indexes) => {
			const requiredSurfaceIds = [...indexes.claimSurfaceIds.get(claim.claim_id) ?? []];
			const expectedArtifactDigests = requiredSurfaceIds.flatMap((surfaceId) => {
				const surface = indexes.surfaces.get(surfaceId);
				const artifact = surface === undefined ? undefined : indexes.artifacts.get(surface.artifact_id);
				return artifact === undefined ? [] : [artifact.artifact_sha256];
			});
			const expectedOwnerDigests = requiredSurfaceIds.flatMap((surfaceId) => (indexes.ownersBySurface.get(surfaceId) ?? []).flatMap(({ ownership }) => ownership.disposition === "implemented" ? [ownership.owner_sha256] : []));
			return result.contract_sha256 === contract.contract_sha256 && result.normalization_sha256 === contract.normalization_sha256 && result.covered_claim_ids.includes(claim.claim_id) && result.covered_claim_ids.every((item) => contract.claim_ids.includes(item)) && claim.required_dimensions.every((item) => contract.dimensions.includes(item)) && claim.required_dimensions.every((item) => result.covered_dimensions.includes(item)) && result.covered_dimensions.every((item) => contract.dimensions.includes(item)) && result.artifact_sha256s.every((item) => indexes.artifactDigests.has(item)) && expectedArtifactDigests.every((item) => result.artifact_sha256s.includes(item)) && result.owner_sha256s.every((item) => indexes.ownerDigests.has(item)) && expectedOwnerDigests.every((item) => result.owner_sha256s.includes(item)) && result.repeats >= contract.minimum_repeats && claim.required_authority === contract.authority;
		};
		evaluateReconstructionCoverageRisks = (context) => {
			for (const unknownId of context.coverage.residual_unknown_ids) if (!context.boundary.allowed_unknown_ids.includes(unknownId)) addReason(context, "active-unknown", unknownId, "Active residual unknown is not permitted by the completion boundary.");
			for (const contradiction of context.coverage.contradictions) if (contradiction.status === "active" && (contradiction.surface_ids.some((id) => context.scope.surfaceIds.has(id)) || contradiction.claim_ids.some((id) => context.scope.claimIds.has(id)))) {
				addEvidence(context, contradiction.evidence_ids);
				addReason(context, "active-contradiction", contradiction.contradiction_id, "Active contradiction affects the completion boundary.");
			}
		};
		evaluateReconstructionPackageProofs = (context) => {
			const requiredArtifactDigests = [...context.scope.surfaceIds].flatMap((surfaceId) => {
				const surface = context.surfaces.get(surfaceId);
				const artifact = surface === undefined ? undefined : context.artifacts.get(surface.artifact_id);
				return artifact === undefined ? [] : [artifact.artifact_sha256];
			});
			for (const kind of context.boundary.required_package_proof_kinds) {
				const proofs = context.coverage.package_proofs.filter((proof) => proof.kind === kind);
				const applicable = (proof) => requiredArtifactDigests.every((digest) => proof.artifact_sha256s.includes(digest)) && packageProofHasComparableEvidence(proof, context.evidenceById);
				const applicableProofs = proofs.filter(applicable);
				addEvidence(context, applicableProofs.flatMap((proof) => proof.evidence_ids));
				if (applicableProofs.some((proof) => proof.status === "fail")) {
					addReason(context, "package-proof-failed", kind, "Required package or integration proof failed; all applicable outcomes are retained.");
				} else if (applicableProofs.length > 0 && applicableProofs.every((proof) => proof.status === "pass")) {
					continue;
				} else if (proofs.length > 0) {
					if (applicableProofs.length === 0) addEvidence(context, proofs.flatMap((proof) => proof.evidence_ids));
					addReason(context, "package-proof-unknown", kind, "Required package or integration proof has unresolved or unqualified outcomes.");
				} else addReason(context, "package-proof-missing", kind, "Required package or integration proof is missing.");
			}
		};
		addReason = (context, code, subjectId, detail) => {
			context.reasons.push({
				code,
				subject_id: subjectId,
				detail
			});
		};
		addEvidence = (context, evidenceIds) => {
			for (const evidenceId of evidenceIds) context.evidenceIds.add(evidenceId);
		};
	})))();
}

//#endregion
//#region dist/domain/reconstructionCoverage.js
var evidenceIdSchema, stableIdSchema, boundedTextSchema, authoritySchema, artifactSchema, surfaceSchema, implementationOwnerSchema, externalOwnerSchema, ownerSchema, claimSchema, verifierContractSchema, verifierResultSchema, contradictionSchema, packageProofSchema, boundarySchema, reconstructionCoverageDataSchema, coverageEnvelopeSchema, readReconstructionCoverageData, closureReasonSchema, reconstructionClosureResultSchema, evaluateParsedReconstructionClosure, validateCoverageReferences, indexUnique, coverageInputError, closureStatus, reasonOrder;
function init_reconstructionCoverage() {
	return (init_reconstructionCoverage = __esmMin((() => {
		init_reconstructionCoverageScope();
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_result();
		init_unicodeCodePointOrder();
		init_evidenceBundle();
		init_reconstructionCoverageEvaluation();
		init_digests();
		init_canonicalDigest();
		init_offsetDateTime();
		evidenceIdSchema = prefixedDigestSchema("ev");
		stableIdSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9._:\x2f\x2d]{0,199}$/u);
		boundedTextSchema = z.string().trim().min(1);
		authoritySchema = z.enum([
			"observed",
			"derived",
			"inferred",
			"historical",
			"external"
		]);
		artifactSchema = z.strictObject({
			artifact_id: stableIdSchema,
			artifact_sha256: digestSchema,
			version: z.string().trim().min(1),
			environment_sha256: digestSchema,
			evidence_ids: z.array(evidenceIdSchema).min(1)
		});
		surfaceSchema = z.strictObject({
			surface_id: stableIdSchema,
			family: z.string().trim().min(1),
			artifact_id: stableIdSchema,
			occurrence_id: z.string().trim().min(1).nullable(),
			location: boundedTextSchema,
			authority: authoritySchema,
			dependency_surface_ids: z.array(stableIdSchema),
			evidence_ids: z.array(evidenceIdSchema).min(1)
		});
		implementationOwnerSchema = z.strictObject({
			disposition: z.literal("implemented"),
			owner_path: boundedTextSchema,
			owner_export: z.string().trim().min(1).nullable(),
			owner_sha256: digestSchema,
			path_state: z.enum([
				"present",
				"missing",
				"unknown"
			]),
			package_state: z.enum([
				"distributed",
				"missing",
				"unknown"
			]),
			authority_route: z.enum([
				"none",
				"detected",
				"unknown"
			])
		});
		externalOwnerSchema = z.strictObject({
			disposition: z.enum(["external", "non-goal"]),
			rationale: boundedTextSchema
		});
		ownerSchema = z.strictObject({
			surface_id: stableIdSchema,
			ownership: z.discriminatedUnion("disposition", [implementationOwnerSchema, externalOwnerSchema])
		});
		claimSchema = z.strictObject({
			claim_id: stableIdSchema,
			title: z.string().trim().min(1),
			kind: z.string().trim().min(1),
			surface_ids: z.array(stableIdSchema).min(1),
			required_dimensions: z.array(stableIdSchema).min(1),
			required_authority: z.enum([
				"shipped-artifact",
				"controlled-replay",
				"live-observation",
				"external"
			])
		});
		verifierContractSchema = z.strictObject({
			verifier_id: stableIdSchema,
			claim_ids: z.array(stableIdSchema).min(1),
			dimensions: z.array(stableIdSchema).min(1),
			authority: z.enum([
				"shipped-artifact",
				"controlled-replay",
				"live-observation",
				"external"
			]),
			max_age_ms: z.int().min(1),
			minimum_repeats: z.int().min(1),
			normalization_sha256: digestSchema,
			normalization_removes_dimensions: z.literal(false),
			contract_sha256: digestSchema
		});
		verifierResultSchema = z.strictObject({
			verifier_id: stableIdSchema,
			contract_sha256: digestSchema,
			observed_at: offsetDateTimeSchema,
			status: z.enum([
				"pass",
				"fail",
				"unknown",
				"unsupported",
				"truncated",
				"skipped"
			]),
			covered_claim_ids: z.array(stableIdSchema).min(1),
			covered_dimensions: z.array(stableIdSchema).min(1),
			artifact_sha256s: z.array(digestSchema).min(1),
			owner_sha256s: z.array(digestSchema),
			normalization_sha256: digestSchema,
			repeats: z.int().min(1),
			evidence_ids: z.array(evidenceIdSchema).min(1)
		});
		contradictionSchema = z.strictObject({
			contradiction_id: stableIdSchema,
			status: z.enum(["active", "resolved"]),
			surface_ids: z.array(stableIdSchema),
			claim_ids: z.array(stableIdSchema),
			evidence_ids: z.array(evidenceIdSchema).min(2)
		});
		packageProofSchema = z.strictObject({
			proof_id: stableIdSchema,
			kind: z.enum([
				"build",
				"clean-install",
				"package-contents",
				"runtime-routing",
				"authority-independence"
			]),
			status: z.enum([
				"pass",
				"fail",
				"unknown",
				"unsupported",
				"skipped"
			]),
			artifact_sha256s: z.array(digestSchema).min(1),
			evidence_ids: z.array(evidenceIdSchema).min(1)
		});
		boundarySchema = z.strictObject({
			boundary_id: stableIdSchema,
			title: z.string().trim().min(1),
			required_surface_ids: z.array(stableIdSchema).min(1),
			required_claim_ids: z.array(stableIdSchema).min(1),
			required_package_proof_kinds: z.array(packageProofSchema.shape.kind).min(1),
			allowed_dispositions: z.array(z.enum(["external", "non-goal"])),
			allowed_unknown_ids: z.array(stableIdSchema)
		});
		reconstructionCoverageDataSchema = z.strictObject({
			evidence_bundle: evidenceBundleSchema,
			artifacts: z.array(artifactSchema),
			surfaces: z.array(surfaceSchema),
			owners: z.array(ownerSchema),
			claims: z.array(claimSchema),
			verifier_contracts: z.array(verifierContractSchema),
			verifier_results: z.array(verifierResultSchema),
			residual_unknown_ids: z.array(stableIdSchema),
			contradictions: z.array(contradictionSchema),
			package_proofs: z.array(packageProofSchema),
			boundaries: z.array(boundarySchema)
		});
		coverageEnvelopeSchema = reconstructionCoverageDataSchema.extend({ evidence_bundle: z.unknown() });
		readReconstructionCoverageData = (input, path = []) => {
			const parsed = coverageEnvelopeSchema.safeParse(input);
			if (!parsed.success) return err(new AnalysisInputError("evaluate_reconstruction_coverage", { cause: parsed.error }, projectInputIssues(parsed.error.issues, input).map((issue) => ({
				...issue,
				path: [...path, ...issue.path]
			}))));
			const bundle = readEvidenceBundle(parsed.data.evidence_bundle);
			if (!bundle.ok) return bundle;
			const coverage = {
				...parsed.data,
				evidence_bundle: bundle.value
			};
			try {
				return ok({
					coverage,
					...validateCoverageReferences(coverage, path)
				});
			} catch (cause) {
				if (cause instanceof AnalysisInputError) return err(cause);
				throw cause;
			}
		};
		closureReasonSchema = z.strictObject({
			code: z.enum([
				"surface-missing",
				"owner-missing",
				"owner-duplicate",
				"owner-path-missing",
				"owner-path-unknown",
				"owner-undistributed",
				"owner-distribution-unknown",
				"authority-routing-detected",
				"authority-routing-unknown",
				"disposition-not-allowed",
				"dependency-surface-missing",
				"claim-missing",
				"verifier-missing",
				"verifier-duplicate",
				"verifier-result-missing",
				"verifier-result-stale",
				"verifier-result-incompatible",
				"verifier-result-ambiguous",
				"verifier-failed",
				"verifier-unknown",
				"active-unknown",
				"active-contradiction",
				"package-proof-missing",
				"package-proof-failed",
				"package-proof-unknown"
			]),
			subject_id: stableIdSchema,
			detail: boundedTextSchema
		});
		reconstructionClosureResultSchema = z.strictObject({
			boundary_id: stableIdSchema,
			status: z.enum([
				"partial",
				"failed",
				"unknown",
				"ready"
			]),
			summary: z.strictObject({
				required_surfaces: z.int().min(0),
				required_claims: z.int().min(0),
				reasons: z.int().min(0)
			}),
			reasons: z.array(closureReasonSchema),
			recommended_probes: z.array(z.strictObject({
				operation: stableIdSchema,
				subject_id: stableIdSchema,
				rationale: boundedTextSchema
			})),
			evidence_ids: z.array(evidenceIdSchema)
		});
		evaluateParsedReconstructionClosure = (parsed, boundaryId, nowEpochMs) => {
			const boundary = parsed.coverage.boundaries.find(({ boundary_id: id }) => id === boundaryId);
			if (boundary === undefined) return err(coverageInputError(["boundary_id"], `Unknown reconstruction boundary: ${boundaryId}`));
			const nowInstant = offsetDateTimeInstantFromEpochMilliseconds(nowEpochMs);
			const context = {
				...parsed,
				boundary,
				scope: reconstructionCoverageScope(parsed, boundary),
				nowEpochMs,
				nowInstant,
				reasons: [],
				evidenceIds: new Set()
			};
			evaluateReconstructionSurfaces(context);
			evaluateReconstructionClaims(context);
			evaluateReconstructionCoverageRisks(context);
			evaluateReconstructionPackageProofs(context);
			const reasons = [...context.reasons].sort(reasonOrder);
			return ok(reconstructionClosureResultSchema.parse({
				boundary_id: boundary.boundary_id,
				status: closureStatus(reasons),
				summary: {
					required_surfaces: context.scope.surfaceIds.size,
					required_claims: context.scope.claimIds.size,
					reasons: reasons.length
				},
				reasons,
				recommended_probes: recommendedReconstructionProbes(reasons),
				evidence_ids: [...context.evidenceIds].sort()
			}));
		};
		validateCoverageReferences = (workspace, path) => {
			const invalid = (location, message) => coverageInputError([...path, ...location], message);
			const evidenceById = new Map(workspace.evidence_bundle.records.map((record) => [record.evidence_id, record]));
			const unknownIds = new Set(workspace.evidence_bundle.unknowns.map(({ unknown_id: id }) => id));
			const artifacts = indexUnique(workspace.artifacts, "artifact_id", [...path, "artifacts"]);
			const surfaces = indexUnique(workspace.surfaces, "surface_id", [...path, "surfaces"]);
			const claims = indexUnique(workspace.claims, "claim_id", [...path, "claims"]);
			const contracts = indexUnique(workspace.verifier_contracts, "verifier_id", [...path, "verifier_contracts"]);
			indexUnique(workspace.contradictions, "contradiction_id", [...path, "contradictions"]);
			indexUnique(workspace.package_proofs, "proof_id", [...path, "package_proofs"]);
			indexUnique(workspace.boundaries, "boundary_id", [...path, "boundaries"]);
			for (const [index, contract] of workspace.verifier_contracts.entries()) {
				const { contract_sha256: contractSha256, ...base } = contract;
				if (contractSha256 !== digestCanonicalValue(base, "Reconstruction coverage")) throw invalid([
					"verifier_contracts",
					index,
					"contract_sha256"
				], `Verifier contract digest is invalid: ${contract.verifier_id}`);
			}
			for (const [index, surface] of workspace.surfaces.entries()) if (!artifacts.has(surface.artifact_id)) throw invalid([
				"surfaces",
				index,
				"artifact_id"
			], `Surface artifact is missing: ${surface.surface_id}`);
			const ownersBySurface = new Map();
			for (const [index, owner] of workspace.owners.entries()) {
				if (!surfaces.has(owner.surface_id)) throw invalid([
					"owners",
					index,
					"surface_id"
				], `Owner surface is missing: ${owner.surface_id}`);
				const owners = ownersBySurface.get(owner.surface_id);
				if (owners === undefined) ownersBySurface.set(owner.surface_id, [owner]);
				else owners.push(owner);
			}
			for (const [index, claim] of workspace.claims.entries()) {
				const missingSurface = claim.surface_ids.findIndex((id) => !surfaces.has(id));
				if (missingSurface !== -1) throw invalid([
					"claims",
					index,
					"surface_ids",
					missingSurface
				], `Claim surface is missing: ${claim.claim_id}`);
			}
			for (const [index, contract] of workspace.verifier_contracts.entries()) {
				const missingClaim = contract.claim_ids.findIndex((id) => !claims.has(id));
				if (missingClaim !== -1) throw invalid([
					"verifier_contracts",
					index,
					"claim_ids",
					missingClaim
				], `Verifier claim is missing: ${contract.verifier_id}`);
			}
			for (const [index, result] of workspace.verifier_results.entries()) if (!contracts.has(result.verifier_id)) throw invalid([
				"verifier_results",
				index,
				"verifier_id"
			], `Verifier result contract is missing: ${result.verifier_id}`);
			const evidenceSources = [
				["artifacts", workspace.artifacts],
				["surfaces", workspace.surfaces],
				["verifier_results", workspace.verifier_results],
				["contradictions", workspace.contradictions],
				["package_proofs", workspace.package_proofs]
			];
			for (const [collection, items] of evidenceSources) for (const [index, item] of items.entries()) for (const [referenceIndex, id] of item.evidence_ids.entries()) if (!evidenceById.has(id)) throw invalid([
				collection,
				index,
				"evidence_ids",
				referenceIndex
			], `Coverage workspace Evidence is missing: ${id}`);
			for (const [index, id] of workspace.residual_unknown_ids.entries()) if (!unknownIds.has(id)) throw invalid(["residual_unknown_ids", index], `Coverage workspace residual unknown is missing: ${id}`);
			return {
				evidenceById,
				artifacts,
				surfaces,
				claims,
				ownersBySurface
			};
		};
		indexUnique = (items, key, path) => {
			const values = new Map();
			for (const [index, item] of items.entries()) {
				if (values.has(item[key])) throw coverageInputError([
					...path,
					index,
					String(key)
				], `Duplicate reconstruction coverage ${String(key)}`);
				values.set(item[key], item);
			}
			return values;
		};
		coverageInputError = (path, message) => new AnalysisInputError("evaluate_reconstruction_coverage", { userMessage: message }, [{
			path,
			reason: "invalid_value",
			message
		}]);
		closureStatus = (reasons) => {
			if (reasons.length === 0) return "ready";
			if (reasons.some(({ code }) => [
				"verifier-failed",
				"active-contradiction",
				"authority-routing-detected",
				"owner-path-missing",
				"owner-undistributed",
				"package-proof-failed"
			].includes(code))) return "failed";
			if (reasons.some(({ code }) => [
				"verifier-result-stale",
				"verifier-result-incompatible",
				"verifier-result-ambiguous",
				"verifier-unknown",
				"active-unknown",
				"owner-path-unknown",
				"owner-distribution-unknown",
				"authority-routing-unknown",
				"package-proof-unknown"
			].includes(code))) return "unknown";
			return "partial";
		};
		reasonOrder = (left, right) => compareUnicodeCodePoints(compositeKey([left.code, left.subject_id]), compositeKey([right.code, right.subject_id]));
	})))();
}

//#endregion
//#region dist/domain/reconstructionCoverageInput.js
var reconstructionCoverageEvaluationInputSchema;
function init_reconstructionCoverageInput() {
	return (init_reconstructionCoverageInput = __esmMin((() => {
		init_reconstructionCoverage();
		reconstructionCoverageEvaluationInputSchema = z.strictObject({
			coverage: reconstructionCoverageDataSchema,
			boundary_id: z.string().min(1)
		});
	})))();
}

//#endregion
export { evaluateParsedReconstructionClosure, init_reconstructionCoverage, init_reconstructionCoverageInput, readReconstructionCoverageData, reconstructionClosureResultSchema, reconstructionCoverageEvaluationInputSchema };