import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { canonicalJson, compareUnicodeCodePoints, compositeKey, describeValidationFailure, digestCanonicalValue, digestSchema, evidenceInputSchema, evidenceSchema, immutableEvidence, init_canonicalDigest, init_canonicalOrdering, init_comparisonSemantics, init_digests, init_evidence, init_evidenceReference, init_unicodeCodePointOrder, init_validationFailure, parseEvidence, prefixedDigestSchema, providerSchema, uniqueSorted as uniqueSorted$1 } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { EvidenceIntegrityError, equalJsonText, err, freezeJsonSnapshot, init_evidenceErrors, init_immutableJson, init_jsonSerialization, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";
import canonicalize from "canonicalize";

//#region dist/domain/functionComparisonResults.js
var dimensionResult, unresolvedDimension, overallStatus, summarize, digest;
function init_functionComparisonResults() {
	return (init_functionComparisonResults = __esmMin((() => {
		init_canonicalDigest();
		dimensionResult = (input) => {
			const context = {
				dimension: input.dimension,
				left_digest: digest(input.left),
				right_digest: digest(input.right),
				left_count: input.leftCount,
				right_count: input.rightCount,
				text_delta: input.textDelta,
				evidence_links: [...input.links],
				limitations: [...input.limitations]
			};
			if (input.status === "unchanged") return {
				...context,
				status: "unchanged",
				conclusion_kind: "derived_relationship"
			};
			return {
				...context,
				status: "changed",
				conclusion_kind: input.providersDiffer ? "contradiction" : "derived_relationship"
			};
		};
		unresolvedDimension = (input) => ({
			dimension: input.dimension,
			status: "unknown",
			left_digest: null,
			right_digest: null,
			left_count: input.leftCount,
			right_count: input.rightCount,
			text_delta: null,
			conclusion_kind: "unresolved_branch",
			evidence_links: [...input.links],
			limitations: [...input.limitations]
		});
		overallStatus = (dimensions, match) => {
			if (match === "mismatched") return "changed";
			if (match === "ambiguous") return "unknown";
			if (dimensions.some(({ status }) => status === "changed")) return "changed";
			if (dimensions.some(({ status }) => status === "unknown")) return "unknown";
			return "unchanged";
		};
		summarize = (dimensions) => ({
			unchanged: dimensions.filter(({ status }) => status === "unchanged").length,
			changed: dimensions.filter(({ status }) => status === "changed").length,
			unknown: dimensions.filter(({ status }) => status === "unknown").length
		});
		digest = (value) => digestCanonicalValue(value, "Function comparison");
	})))();
}

//#endregion
//#region dist/domain/functionComparisonSchemas.js
var comparisonStatusSchema, functionComparisonDimensionNameSchema, evidenceIdSchema$1, functionComparisonInputSchema, textDeltaSchema, functionDimensionContextShape, functionDimensionSchema, functionMatchSchema, functionComparisonResultSchema;
function init_functionComparisonSchemas() {
	return (init_functionComparisonSchemas = __esmMin((() => {
		init_functionComparisonResults();
		init_comparisonSemantics();
		init_evidenceReference();
		init_digests();
		comparisonStatusSchema = z.enum([
			"unchanged",
			"changed",
			"unknown"
		]);
		functionComparisonDimensionNameSchema = z.enum([
			"identity",
			"pseudocode",
			"assembly",
			"comments",
			"calls",
			"references",
			"strings_names",
			"cfg"
		]);
		evidenceIdSchema$1 = prefixedDigestSchema("ev");
		functionComparisonInputSchema = z.strictObject({
			left: evidenceInputSchema,
			right: evidenceInputSchema
		});
		textDeltaSchema = z.object({
			added_lines: z.int().min(0),
			removed_lines: z.int().min(0),
			hunks: z.int().min(0)
		});
		functionDimensionContextShape = {
			dimension: functionComparisonDimensionNameSchema,
			left_count: z.int().min(0).nullable(),
			right_count: z.int().min(0).nullable(),
			evidence_links: z.array(evidenceIdSchema$1).min(2),
			limitations: z.array(z.string())
		};
		functionDimensionSchema = z.union([
			z.object({
				...functionDimensionContextShape,
				status: z.literal("unchanged"),
				left_digest: digestSchema,
				right_digest: digestSchema,
				text_delta: textDeltaSchema.nullable(),
				conclusion_kind: z.literal("derived_relationship")
			}),
			z.object({
				...functionDimensionContextShape,
				status: z.literal("changed"),
				left_digest: digestSchema,
				right_digest: digestSchema,
				text_delta: textDeltaSchema.nullable(),
				conclusion_kind: z.enum(["derived_relationship", "contradiction"])
			}),
			z.object({
				...functionDimensionContextShape,
				status: z.literal("unknown"),
				left_digest: z.null(),
				right_digest: z.null(),
				text_delta: z.null(),
				conclusion_kind: z.literal("unresolved_branch")
			})
		]);
		functionMatchSchema = z.union([z.object({
			status: z.literal("matched"),
			method: z.literal("symbol"),
			left_name: z.string(),
			right_name: z.string()
		}), z.object({
			status: z.enum(["mismatched", "ambiguous"]),
			method: z.literal("explicit"),
			left_name: z.string(),
			right_name: z.string()
		})]);
		functionComparisonResultSchema = z.object({
			status: comparisonStatusSchema,
			function_match: functionMatchSchema,
			left_subject_sha256: digestSchema,
			right_subject_sha256: digestSchema,
			summary: z.object({
				unchanged: z.int().min(0),
				changed: z.int().min(0),
				unknown: z.int().min(0)
			}),
			dimensions: z.array(functionDimensionSchema).length(functionComparisonDimensionNameSchema.options.length),
			changes: z.array(functionDimensionSchema),
			limitations: z.array(z.string())
		}).superRefine((result, context) => {
			const dimensions = new Map();
			for (const [index, dimension] of result.dimensions.entries()) {
				if (dimensions.has(dimension.dimension)) context.addIssue({
					code: "custom",
					path: [
						"dimensions",
						index,
						"dimension"
					],
					message: "Function comparison dimensions must occur exactly once."
				});
				dimensions.set(dimension.dimension, dimension);
			}
			const expectedSummary = summarize(result.dimensions);
			for (const status of comparisonStatusSchema.options) if (result.summary[status] !== expectedSummary[status]) context.addIssue({
				code: "custom",
				path: ["summary", status],
				message: "Function comparison summary must count its dimensions."
			});
			const changes = new Set();
			for (const [index, change] of result.changes.entries()) {
				const dimension = dimensions.get(change.dimension);
				if (changes.has(change.dimension) || dimension === undefined || change.status === "unchanged" || canonicalJson(change) !== canonicalJson(dimension)) context.addIssue({
					code: "custom",
					path: ["changes", index],
					message: "Function comparison changes must cite each changed or unknown dimension exactly as recorded."
				});
				changes.add(change.dimension);
			}
			if (result.dimensions.some(({ dimension, status }) => status !== "unchanged" && !changes.has(dimension))) context.addIssue({
				code: "custom",
				path: ["changes"],
				message: "Function comparison changes must include every changed or unknown dimension."
			});
			if (result.status !== overallStatus(result.dimensions, result.function_match.status)) context.addIssue({
				code: "custom",
				path: ["status"],
				message: "Function comparison status contradicts its dimensions or function match."
			});
		});
	})))();
}

//#endregion
//#region dist/domain/residualUnknown.js
var evidenceIdSchema, unknownIdSchema, text, environmentRequirementSchema, stableUnknownId, probeSchema, comparisonConclusionScopeSchema, relationshipSchema, resolutionSchema, residualUnknownObjectSchema, refineRevision, residualUnknownSchema, generatedRevisionSchema, recordUnknownInputSchema, updateUnknownInputSchema, createResidualUnknown, updateResidualUnknown, createRevision, projectRevisionDetails, computeRevisionDigest, sameOrderedValues, sortedRelationships;
function init_residualUnknown() {
	return (init_residualUnknown = __esmMin((() => {
		init_canonicalOrdering();
		init_canonicalDigest();
		init_unicodeCodePointOrder();
		init_digests();
		init_functionComparisonSchemas();
		evidenceIdSchema = prefixedDigestSchema("ev");
		unknownIdSchema = prefixedDigestSchema("unk");
		text = z.string().trim().min(1);
		environmentRequirementSchema = z.strictObject({
			id: z.string().min(1).nullable(),
			platform: z.string().min(1).nullable(),
			architecture: z.string().min(1).nullable(),
			isolation: z.enum([
				"none",
				"process",
				"container",
				"virtual-machine"
			]).nullable()
		});
		stableUnknownId = (question, domain, scopeDigest, comparisonConclusionScope) => `unk_${digestCanonicalValue({
			domain: domain.trim(),
			question: question.replace(/\s+/gu, " ").trim(),
			scope_digest: scopeDigest,
			...comparisonConclusionScope === undefined ? {} : { comparison_conclusion_scope: comparisonConclusionScope }
		}, "Unknown identity")}`;
		probeSchema = z.strictObject({
			operation: z.string().min(1),
			rationale: text
		});
		comparisonConclusionScopeSchema = z.object({
			comparison_evidence_id: evidenceIdSchema,
			dimensions: z.array(z.union([z.literal("overall"), functionComparisonDimensionNameSchema])).min(1)
		}).strict().superRefine(({ dimensions }, context) => {
			if (!sameOrderedValues(dimensions, uniqueSorted$1(dimensions))) context.addIssue({
				code: "custom",
				message: "Comparison dimensions must be sorted and unique"
			});
		});
		relationshipSchema = z.strictObject({
			type: z.enum([
				"depends-on",
				"related-to",
				"contradicts"
			]),
			unknown_id: unknownIdSchema
		});
		resolutionSchema = z.discriminatedUnion("disposition", [z.strictObject({
			disposition: z.literal("verified"),
			rationale: text,
			evidence_ids: z.array(evidenceIdSchema).min(1)
		}), z.strictObject({
			disposition: z.enum(["withdrawn", "out-of-scope"]),
			rationale: text,
			evidence_ids: z.array(evidenceIdSchema)
		})]);
		residualUnknownObjectSchema = z.strictObject({
			unknown_id: unknownIdSchema,
			revision: z.int().min(1),
			previous_revision_digest: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			revision_digest: z.string().regex(/^[a-f0-9]{64}$/u),
			scope_digest: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			question: text,
			status: z.enum([
				"open",
				"investigating",
				"blocked",
				"contradicted",
				"resolved"
			]),
			severity: z.enum([
				"low",
				"medium",
				"high",
				"critical"
			]),
			domain: text,
			comparison_conclusion_scope: comparisonConclusionScopeSchema.exactOptional(),
			supporting_evidence_ids: z.array(evidenceIdSchema),
			contradicting_evidence_ids: z.array(evidenceIdSchema),
			required_authority: z.enum([
				"shipped-artifact",
				"controlled-replay",
				"historical-reference",
				"external-service",
				"analyst-inference"
			]).nullable(),
			required_confidence: z.enum([
				"observed",
				"derived",
				"inferred"
			]),
			required_environment: environmentRequirementSchema.nullable(),
			recommended_probes: z.array(probeSchema),
			relationships: z.array(relationshipSchema),
			resolution: resolutionSchema.nullable(),
			mutation_evidence_ids: z.array(evidenceIdSchema).min(1)
		});
		refineRevision = (value, context) => {
			if (value.unknown_id !== stableUnknownId(value.question, value.domain, value.scope_digest, value.comparison_conclusion_scope)) context.addIssue({
				code: "custom",
				message: "Residual unknown ID does not match its immutable identity",
				path: ["unknown_id"]
			});
			if (value.revision === 1 !== (value.previous_revision_digest === null)) context.addIssue({
				code: "custom",
				message: "Only the first revision has no predecessor",
				path: ["previous_revision_digest"]
			});
			if (value.status === "resolved" !== (value.resolution !== null)) context.addIssue({
				code: "custom",
				message: "Only resolved unknowns carry a resolution",
				path: ["resolution"]
			});
			if (value.status === "contradicted" && value.contradicting_evidence_ids.length === 0) context.addIssue({
				code: "custom",
				message: "Contradicted status requires contradicting evidence",
				path: ["contradicting_evidence_ids"]
			});
			if (value.relationships.some((relationship) => relationship.unknown_id === value.unknown_id)) context.addIssue({
				code: "custom",
				message: "An unknown cannot relate to itself",
				path: ["relationships"]
			});
			for (const ids of [
				value.supporting_evidence_ids,
				value.contradicting_evidence_ids,
				value.mutation_evidence_ids
			]) if (new Set(ids).size !== ids.length) context.addIssue({
				code: "custom",
				message: "Evidence IDs must be unique"
			});
			if (value.comparison_conclusion_scope !== undefined && ![...value.supporting_evidence_ids, ...value.contradicting_evidence_ids].includes(value.comparison_conclusion_scope.comparison_evidence_id)) context.addIssue({
				code: "custom",
				message: "Scoped comparison Evidence must support or contradict the unknown",
				path: ["comparison_conclusion_scope"]
			});
			if (value.comparison_conclusion_scope !== undefined && value.domain !== "function-comparison") context.addIssue({
				code: "custom",
				message: "Comparison conclusion scope requires function-comparison domain",
				path: ["comparison_conclusion_scope"]
			});
			const contradictingEvidence = new Set(value.contradicting_evidence_ids);
			if (value.supporting_evidence_ids.some((id) => contradictingEvidence.has(id))) context.addIssue({
				code: "custom",
				message: "Evidence cannot simultaneously support and contradict"
			});
			const relationships = value.relationships.map((relationship) => `${relationship.type}:${relationship.unknown_id}`);
			if (new Set(relationships).size !== relationships.length) context.addIssue({
				code: "custom",
				message: "Relationships must be unique",
				path: ["relationships"]
			});
		};
		residualUnknownSchema = residualUnknownObjectSchema.superRefine((value, context) => {
			if (computeRevisionDigest(value) !== value.revision_digest) context.addIssue({
				code: "custom",
				message: "Residual unknown revision digest does not match",
				path: ["revision_digest"]
			});
			refineRevision(value, context);
		});
		generatedRevisionSchema = residualUnknownObjectSchema.omit({ revision_digest: true }).superRefine(refineRevision);
		recordUnknownInputSchema = residualUnknownObjectSchema.omit({
			unknown_id: true,
			revision: true,
			previous_revision_digest: true,
			revision_digest: true,
			scope_digest: true,
			status: true,
			supporting_evidence_ids: true,
			contradicting_evidence_ids: true,
			resolution: true,
			mutation_evidence_ids: true
		}).extend({
			supporting_evidence_ids: z.array(evidenceIdSchema).default([]),
			contradicting_evidence_ids: z.array(evidenceIdSchema).default([])
		}).strict();
		updateUnknownInputSchema = z.strictObject({
			unknown_id: unknownIdSchema,
			expected_revision: z.int().min(1),
			status: residualUnknownObjectSchema.shape.status,
			severity: residualUnknownObjectSchema.shape.severity,
			supporting_evidence_ids: z.array(evidenceIdSchema),
			contradicting_evidence_ids: z.array(evidenceIdSchema),
			required_authority: residualUnknownObjectSchema.shape.required_authority,
			required_confidence: residualUnknownObjectSchema.shape.required_confidence,
			required_environment: environmentRequirementSchema.nullable(),
			recommended_probes: z.array(probeSchema),
			relationships: z.array(relationshipSchema),
			resolution: resolutionSchema.nullable()
		});
		createResidualUnknown = (input, mutationEvidenceId, scopeDigest) => {
			const question = input.question.replace(/\s+/gu, " ").trim();
			const domain = input.domain.trim();
			const comparisonConclusionScope = input.comparison_conclusion_scope === undefined ? undefined : {
				comparison_evidence_id: input.comparison_conclusion_scope.comparison_evidence_id,
				dimensions: input.comparison_conclusion_scope.dimensions
			};
			const revision = {
				unknown_id: stableUnknownId(question, domain, scopeDigest, comparisonConclusionScope),
				revision: 1,
				previous_revision_digest: null,
				scope_digest: scopeDigest,
				question,
				status: input.contradicting_evidence_ids.length > 0 ? "contradicted" : "open",
				domain,
				...comparisonConclusionScope === undefined ? {} : { comparison_conclusion_scope: comparisonConclusionScope },
				...projectRevisionDetails(input),
				resolution: null,
				mutation_evidence_ids: [mutationEvidenceId]
			};
			return createRevision(revision);
		};
		updateResidualUnknown = (current, input, mutationEvidenceId) => {
			const revision = {
				unknown_id: current.unknown_id,
				revision: current.revision + 1,
				previous_revision_digest: current.revision_digest,
				scope_digest: current.scope_digest,
				question: current.question,
				status: input.status,
				domain: current.domain,
				...current.comparison_conclusion_scope === undefined ? {} : { comparison_conclusion_scope: current.comparison_conclusion_scope },
				...projectRevisionDetails(input),
				resolution: input.resolution,
				mutation_evidence_ids: uniqueSorted$1([...current.mutation_evidence_ids, mutationEvidenceId])
			};
			return createRevision(revision);
		};
		createRevision = (value) => {
			const revision = generatedRevisionSchema.parse(value);
			return {
				...revision,
				revision_digest: computeRevisionDigest(revision)
			};
		};
		projectRevisionDetails = (input) => ({
			severity: input.severity,
			supporting_evidence_ids: uniqueSorted$1(input.supporting_evidence_ids),
			contradicting_evidence_ids: uniqueSorted$1(input.contradicting_evidence_ids),
			required_authority: input.required_authority,
			required_confidence: input.required_confidence,
			required_environment: input.required_environment,
			recommended_probes: [...input.recommended_probes],
			relationships: sortedRelationships(input.relationships)
		});
		computeRevisionDigest = (value) => {
			const { revision_digest: _revisionDigest, ...semantic } = "revision_digest" in value ? value : {
				...value,
				revision_digest: ""
			};
			void _revisionDigest;
			return digestCanonicalValue(semantic, "Unknown identity");
		};
		sameOrderedValues = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
		sortedRelationships = (values) => [...values].sort((left, right) => compareUnicodeCodePoints(compositeKey([left.type, left.unknown_id]), compositeKey([right.type, right.unknown_id])));
	})))();
}

//#endregion
//#region dist/domain/evidenceBundle.js
var detectedSubjectSchema, rawSubjectSchema, manifestFields, artifactManifestSchema, providerManifestSchema, environmentManifestSchema, scenarioManifestSchema, captureManifestSchema, evidenceBundleSchema, immutableBundles, NonCanonicalEvidenceBundleError, DuplicateEvidenceRecordError, InvalidResidualUnknownGraphError, createImmutableEvidenceBundle, createEvidenceBundle, evidenceBundleForTarget, referencedEvidenceIds, describeEvidenceBundleFailure, parseEvidenceBundle, parseImmutableEvidenceBundle, safeParseEvidenceBundle, safeParseImmutableEvidenceBundle, parseBundle, readEvidenceBundle, readBundle, authenticateParsedEvidenceBundle, authenticateBundle, validateUnknownGraph, validateVerifiedResolution, validateResidualUnknownAddition, reachesUnknown, evidenceQualifies, rejectDependencyCycles, serializeEvidenceBundle, uniqueSorted;
function init_evidenceBundle() {
	return (init_evidenceBundle = __esmMin((() => {
		init_evidenceErrors();
		init_result();
		init_validationFailure();
		init_jsonSerialization();
		init_unicodeCodePointOrder();
		init_evidence();
		init_residualUnknown();
		init_immutableJson();
		[detectedSubjectSchema, rawSubjectSchema] = evidenceSchema.shape.subject.unwrap().options;
		manifestFields = {
			digest: true,
			format: true,
			architecture: true
		};
		artifactManifestSchema = z.discriminatedUnion("format", [detectedSubjectSchema.pick(manifestFields), rawSubjectSchema.pick(manifestFields)]);
		providerManifestSchema = providerSchema;
		environmentManifestSchema = evidenceSchema.shape.environment.unwrap();
		scenarioManifestSchema = z.strictObject({
			evidence_id: evidenceSchema.shape.evidence_id,
			operation: z.string().min(1),
			authority: z.literal("controlled-replay")
		});
		captureManifestSchema = z.strictObject({
			evidence_id: evidenceSchema.shape.evidence_id,
			predicate_type: z.string().min(1)
		});
		evidenceBundleSchema = z.strictObject({
			artifacts: z.array(artifactManifestSchema),
			providers: z.array(providerManifestSchema),
			environments: z.array(environmentManifestSchema),
			scenarios: z.array(scenarioManifestSchema),
			captures: z.array(captureManifestSchema),
			unknowns: z.array(residualUnknownSchema),
			records: z.array(evidenceSchema)
		});
		immutableBundles = new WeakMap();
		NonCanonicalEvidenceBundleError = class extends TypeError {
			constructor() {
				super("Evidence bundle manifests are not canonical");
				this.name = "NonCanonicalEvidenceBundleError";
			}
		};
		DuplicateEvidenceRecordError = class extends TypeError {
			constructor() {
				super("Evidence bundle contains duplicate record IDs");
				this.name = "DuplicateEvidenceRecordError";
			}
		};
		InvalidResidualUnknownGraphError = class extends TypeError {
			constructor(message) {
				super(message);
				this.name = "InvalidResidualUnknownGraphError";
			}
		};
		createImmutableEvidenceBundle = (records, unknowns = []) => {
			const checkedRecords = records.map(immutableEvidence);
			if (new Set(checkedRecords.map(({ evidence_id }) => evidence_id)).size !== checkedRecords.length) throw new DuplicateEvidenceRecordError();
			const checkedUnknowns = unknowns.map((unknown) => residualUnknownSchema.parse(unknown));
			validateUnknownGraph(checkedUnknowns, checkedRecords);
			const bundle = freezeJsonSnapshot(createEvidenceBundle(checkedRecords, checkedUnknowns));
			immutableBundles.set(bundle, bundle);
			return bundle;
		};
		createEvidenceBundle = (records, unknowns = []) => {
			const sortedRecords = [...records].sort((left, right) => compareUnicodeCodePoints(left.evidence_id, right.evidence_id));
			return {
				artifacts: uniqueSorted(sortedRecords.flatMap(({ subject }) => subject === null ? [] : [artifactManifestSchema.parse({
					digest: subject.digest,
					format: subject.format,
					architecture: subject.architecture
				})])),
				providers: uniqueSorted(sortedRecords.map(({ provider }) => provider)),
				environments: uniqueSorted(sortedRecords.flatMap(({ environment }) => environment === null ? [] : [environment])),
				scenarios: sortedRecords.flatMap((evidence) => evidence.authority === "controlled-replay" ? [{
					evidence_id: evidence.evidence_id,
					operation: evidence.operation,
					authority: evidence.authority
				}] : []),
				captures: sortedRecords.flatMap((evidence) => evidence.predicate_type === "rea.process-capture" ? [{
					evidence_id: evidence.evidence_id,
					predicate_type: evidence.predicate_type
				}] : []),
				unknowns: [...unknowns].sort((left, right) => compareUnicodeCodePoints(left.unknown_id, right.unknown_id) || left.revision - right.revision),
				records: sortedRecords
			};
		};
		evidenceBundleForTarget = (bundle, sha256) => {
			const recordsById = new Map(bundle.records.map((record) => [record.evidence_id, record]));
			const histories = new Map();
			for (const unknown of bundle.unknowns) {
				const history = histories.get(unknown.unknown_id) ?? [];
				history.push(unknown);
				histories.set(unknown.unknown_id, history);
			}
			const retained = new Set();
			const dependents = new Map();
			const relationships = new Map();
			for (const [id, history] of histories) {
				const eligible = history.every((unknown) => {
					if (unknown.scope_digest !== sha256) return false;
					const mutationEvidenceIds = new Set(unknown.mutation_evidence_ids);
					return referencedEvidenceIds(unknown).every((evidenceId) => {
						const record = recordsById.get(evidenceId);
						return record?.subject?.digest.sha256 === sha256 || mutationEvidenceIds.has(evidenceId) && record?.predicate_type === "rea.residual-unknown-mutation";
					});
				});
				if (!eligible) continue;
				retained.add(id);
				const relatedIds = new Set(history.flatMap((unknown) => unknown.relationships.map(({ unknown_id }) => unknown_id)));
				relationships.set(id, relatedIds);
				for (const relatedId of relatedIds) {
					const references = dependents.get(relatedId) ?? new Set();
					references.add(id);
					dependents.set(relatedId, references);
				}
			}
			const pending = [];
			for (const [id, relatedIds] of relationships) if ([...relatedIds].some((relatedId) => !retained.has(relatedId))) pending.push(id);
			for (let index = 0; index < pending.length; index += 1) {
				const id = pending[index];
				if (id === undefined || !retained.delete(id)) continue;
				for (const dependent of dependents.get(id) ?? []) pending.push(dependent);
			}
			const unknowns = bundle.unknowns.filter((unknown) => retained.has(unknown.unknown_id));
			const mutationIds = new Set(unknowns.flatMap(({ mutation_evidence_ids: ids }) => ids));
			return createEvidenceBundle(bundle.records.filter((record) => record.subject?.digest.sha256 === sha256 || mutationIds.has(record.evidence_id)), unknowns);
		};
		referencedEvidenceIds = (unknown) => [
			...unknown.supporting_evidence_ids,
			...unknown.contradicting_evidence_ids,
			...unknown.mutation_evidence_ids,
			...unknown.resolution?.evidence_ids ?? []
		];
		describeEvidenceBundleFailure = (input, cause) => {
			try {
				const record = parseEvidence(input);
				return {
					kind: "single-record",
					cause,
					message: `Expected an Evidence bundle with records and manifest arrays, but this JSON is one Evidence record (${record.evidence_id}). Export a session bundle with the MCP export_evidence_bundle tool and supply that file.`
				};
			} catch (recordFailure) {
				if (!(recordFailure instanceof z.ZodError)) throw recordFailure;
				return {
					kind: "invalid-bundle",
					cause,
					message: cause instanceof z.ZodError ? `Evidence bundle does not match the bundle schema ${describeValidationFailure(cause)}. Supply an unmodified bundle produced by this REA identity format. Recreate observations from earlier formats; re-exporting an old bundle does not update its identities.` : `Evidence bundle validation failed: ${describeValidationFailure(cause)}. Recreate or re-export the bundle, then try again.`
				};
			}
		};
		parseEvidenceBundle = (input) => {
			return parseBundle(input, false);
		};
		parseImmutableEvidenceBundle = (input) => parseBundle(input, true);
		safeParseEvidenceBundle = (input) => readBundle(input, false);
		safeParseImmutableEvidenceBundle = (input) => readBundle(input, true);
		parseBundle = (input, seal) => {
			if (typeof input === "object" && input !== null) {
				const owned = immutableBundles.get(input);
				if (owned !== undefined) return owned;
			}
			return authenticateBundle(evidenceBundleSchema.parse(input), seal);
		};
		readEvidenceBundle = (input) => {
			const parsed = safeParseEvidenceBundle(input);
			if (parsed.ok) return parsed;
			const { cause } = parsed.error;
			return err(new EvidenceIntegrityError(cause.message, {
				cause,
				userMessage: cause.message
			}));
		};
		readBundle = (input, seal) => {
			try {
				return ok(seal ? parseImmutableEvidenceBundle(input) : parseEvidenceBundle(input));
			} catch (cause) {
				if (!(cause instanceof z.ZodError) && !(cause instanceof DuplicateEvidenceRecordError) && !(cause instanceof InvalidResidualUnknownGraphError) && !(cause instanceof NonCanonicalEvidenceBundleError)) throw cause;
				return err(describeEvidenceBundleFailure(input, cause));
			}
		};
		authenticateParsedEvidenceBundle = (parsed) => authenticateBundle(parsed, false);
		authenticateBundle = (parsed, seal) => {
			const recordIds = parsed.records.map(({ evidence_id: id }) => id);
			if (new Set(recordIds).size !== recordIds.length) throw new DuplicateEvidenceRecordError();
			validateUnknownGraph(parsed.unknowns, parsed.records);
			const canonical = createEvidenceBundle(parsed.records.map((record, index) => {
				try {
					if (!seal) return parseEvidence(record);
					record.normalized_result = freezeJsonSnapshot(record.normalized_result);
					record.raw_result = freezeJsonSnapshot(record.raw_result);
					return immutableEvidence(record);
				} catch (cause) {
					if (cause instanceof z.ZodError) throw new z.ZodError(cause.issues.map((issue) => ({
						...issue,
						path: [
							"records",
							index,
							...issue.path
						]
					})));
					throw cause;
				}
			}), parsed.unknowns);
			if (!equalJsonText(parsed, canonical)) throw new NonCanonicalEvidenceBundleError();
			if (seal) {
				freezeJsonSnapshot(canonical);
				immutableBundles.set(canonical, canonical);
			}
			return canonical;
		};
		validateUnknownGraph = (unknowns, records) => {
			const evidenceById = new Map(records.map((record) => [record.evidence_id, record]));
			const histories = new Map();
			for (const unknown of unknowns) {
				const history = histories.get(unknown.unknown_id) ?? [];
				history.push(unknown);
				histories.set(unknown.unknown_id, history);
			}
			const unknownById = new Map();
			for (const [id, unordered] of histories) {
				const history = [...unordered].sort((left, right) => left.revision - right.revision);
				for (const [index, revision] of history.entries()) {
					if (revision.revision !== index + 1) throw new InvalidResidualUnknownGraphError(`Residual unknown ${id} revision history has a gap`);
					if (index > 0 && revision.previous_revision_digest !== history[index - 1]?.revision_digest) throw new InvalidResidualUnknownGraphError(`Residual unknown ${id} revision chain is broken`);
				}
				const head = history.at(-1);
				if (head === undefined) throw new TypeError("Residual unknown revision history is empty");
				unknownById.set(id, head);
			}
			for (const unknown of unknowns) {
				const referencedEvidence = [
					...unknown.supporting_evidence_ids,
					...unknown.contradicting_evidence_ids,
					...unknown.mutation_evidence_ids,
					...unknown.resolution?.evidence_ids ?? []
				];
				for (const evidenceId of referencedEvidence) if (!evidenceById.has(evidenceId)) throw new InvalidResidualUnknownGraphError(`Residual unknown references missing evidence ${evidenceId}`);
				for (const relationship of unknown.relationships) if (!unknownById.has(relationship.unknown_id)) throw new InvalidResidualUnknownGraphError(`Residual unknown references missing unknown ${relationship.unknown_id}`);
				if (unknown.resolution?.disposition === "verified") validateVerifiedResolution(unknown, evidenceById);
			}
			rejectDependencyCycles(unknownById);
		};
		validateVerifiedResolution = (unknown, evidenceById) => {
			if (unknown.contradicting_evidence_ids.length > 0) throw new InvalidResidualUnknownGraphError(`Residual unknown ${unknown.unknown_id} retains contradicting evidence`);
			const qualifies = unknown.resolution?.evidence_ids.some((evidenceId) => {
				const evidence = evidenceById.get(evidenceId);
				return unknown.supporting_evidence_ids.includes(evidenceId) && evidence !== undefined && evidence.predicate_type !== "rea.residual-unknown-mutation" && evidenceQualifies(unknown, evidence);
			});
			if (qualifies !== true) throw new InvalidResidualUnknownGraphError(`Residual unknown ${unknown.unknown_id} has no qualifying resolution evidence`);
		};
		validateResidualUnknownAddition = (unknown, evidenceById, currentHeads) => {
			const current = currentHeads.get(unknown.unknown_id);
			if (current === undefined ? unknown.revision !== 1 || unknown.previous_revision_digest !== null : unknown.revision !== current.revision + 1 || unknown.previous_revision_digest !== current.revision_digest) throw new InvalidResidualUnknownGraphError(`Residual unknown ${unknown.unknown_id} revision chain is broken`);
			for (const evidenceId of referencedEvidenceIds(unknown)) if (!evidenceById.has(evidenceId)) throw new InvalidResidualUnknownGraphError(`Residual unknown references missing evidence ${evidenceId}`);
			for (const relationship of unknown.relationships) if (relationship.unknown_id !== unknown.unknown_id && !currentHeads.has(relationship.unknown_id)) throw new InvalidResidualUnknownGraphError(`Residual unknown references missing unknown ${relationship.unknown_id}`);
			if (unknown.resolution?.disposition === "verified") validateVerifiedResolution(unknown, evidenceById);
			if (current !== undefined) {
				const dependencies = unknown.relationships.filter((relationship) => relationship.type === "depends-on").map(({ unknown_id }) => unknown_id);
				if (dependencies.length > 0 && reachesUnknown(dependencies, unknown.unknown_id, currentHeads, unknown)) throw new InvalidResidualUnknownGraphError("Residual unknown dependency graph contains a cycle");
			}
		};
		reachesUnknown = (starts, goal, currentHeads, candidate) => {
			const pending = [...starts];
			const visited = new Set();
			while (pending.length > 0) {
				const id = pending.pop();
				if (id === undefined) break;
				if (id === goal) return true;
				if (visited.has(id)) continue;
				visited.add(id);
				const unknown = id === candidate.unknown_id ? candidate : currentHeads.get(id);
				if (unknown === undefined) continue;
				for (const relationship of unknown.relationships) if (relationship.type === "depends-on") pending.push(relationship.unknown_id);
			}
			return false;
		};
		evidenceQualifies = (unknown, evidence) => {
			if (unknown.required_authority !== null && evidence.authority !== unknown.required_authority) return false;
			const confidenceRank = {
				inferred: 1,
				derived: 2,
				observed: 3
			};
			if (confidenceRank[evidence.confidence] < confidenceRank[unknown.required_confidence]) return false;
			const requirement = unknown.required_environment;
			if (requirement === null) return true;
			if (evidence.environment === null) return false;
			return (requirement.id === null || requirement.id === evidence.environment.id) && (requirement.platform === null || requirement.platform === evidence.environment.platform) && (requirement.architecture === null || requirement.architecture === evidence.environment.architecture) && (requirement.isolation === null || requirement.isolation === evidence.environment.isolation);
		};
		rejectDependencyCycles = (unknownById) => {
			const visited = new Set();
			const active = new Set();
			const pending = [];
			for (const root of unknownById.keys()) {
				if (visited.has(root)) continue;
				const rootUnknown = unknownById.get(root);
				if (rootUnknown === undefined) throw new TypeError("Residual unknown dependency graph is inconsistent");
				active.add(root);
				pending.push({
					id: root,
					relationships: rootUnknown.relationships,
					nextRelationship: 0
				});
				while (pending.length > 0) {
					const frame = pending[pending.length - 1];
					if (frame === undefined) break;
					let descended = false;
					while (frame.nextRelationship < frame.relationships.length) {
						const relationship = frame.relationships[frame.nextRelationship];
						frame.nextRelationship += 1;
						if (relationship?.type !== "depends-on") continue;
						const dependency = relationship.unknown_id;
						if (active.has(dependency)) throw new InvalidResidualUnknownGraphError("Residual unknown dependency graph contains a cycle");
						if (visited.has(dependency)) continue;
						const unknown = unknownById.get(dependency);
						if (unknown === undefined) throw new TypeError("Residual unknown dependency graph is inconsistent");
						active.add(dependency);
						pending.push({
							id: dependency,
							relationships: unknown.relationships,
							nextRelationship: 0
						});
						descended = true;
						break;
					}
					if (descended) continue;
					pending.pop();
					active.delete(frame.id);
					visited.add(frame.id);
				}
			}
		};
		serializeEvidenceBundle = (bundle) => {
			const serialized = canonicalize(parseEvidenceBundle(bundle));
			if (serialized === undefined) throw new TypeError("Evidence bundle canonicalization failed");
			return serialized;
		};
		uniqueSorted = (values) => {
			const unique = new Map();
			for (const value of values) unique.set(JSON.stringify(value), value);
			return [...unique.entries()].sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([, value]) => value);
		};
	})))();
}

//#endregion
export { InvalidResidualUnknownGraphError, createEvidenceBundle, createImmutableEvidenceBundle, createResidualUnknown, dimensionResult, evidenceBundleForTarget, evidenceBundleSchema, functionComparisonDimensionNameSchema, functionComparisonInputSchema, functionComparisonResultSchema, init_evidenceBundle, init_functionComparisonResults, init_functionComparisonSchemas, init_residualUnknown, overallStatus, parseEvidenceBundle, parseImmutableEvidenceBundle, readEvidenceBundle, recordUnknownInputSchema, residualUnknownSchema, safeParseEvidenceBundle, safeParseImmutableEvidenceBundle, serializeEvidenceBundle, summarize, unresolvedDimension, updateResidualUnknown, updateUnknownInputSchema, validateResidualUnknownAddition };