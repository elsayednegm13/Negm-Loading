import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ArtifactInventoryCarrierError, analysisInputErrorFromIssues, digestSchema, evidenceSchema, hasCompleteInventoryCoverage, init_artifactInventoryEvidence, init_digests, init_evidence, init_inputIssueProjection, parseArtifactInventoryEvidence, prefixedDigestSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, EvidenceIntegrityError, err, init_analysisErrorCore, init_evidenceErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";

//#region dist/domain/mobileApplicationGraphProjection.js
var projectionEvidenceIdSchema, projectionPathSchema, applicationInventoryProjectionInputSchema, applicationInventoryRequestSchema, readApplicationInventoryProjection, projectedComponentSchema, unavailableComponentSchema, projectedBridgeCandidateSchema, projectionCoverage, projectedInventoryEntries, projectedFileComponents;
function init_mobileApplicationGraphProjection() {
	return (init_mobileApplicationGraphProjection = __esmMin((() => {
		init_artifactInventoryEvidence();
		init_evidence();
		init_analysisErrorCore();
		init_evidenceErrors();
		init_inputIssueProjection();
		init_result();
		init_digests();
		projectionEvidenceIdSchema = prefixedDigestSchema("ev");
		projectionPathSchema = z.string().min(1);
		applicationInventoryProjectionInputSchema = z.strictObject({ inventory_evidence: z.array(evidenceSchema).min(1) });
		applicationInventoryRequestSchema = applicationInventoryProjectionInputSchema.extend({ inventory_evidence: z.array(z.unknown()).min(1) });
		readApplicationInventoryProjection = (input, operation) => {
			const frame = applicationInventoryRequestSchema.safeParse(input);
			if (!frame.success) return err(analysisInputErrorFromIssues(operation, frame.error.issues, input, { cause: frame.error }));
			try {
				return ok(parseArtifactInventoryEvidence(frame.data.inventory_evidence));
			} catch (cause) {
				if (cause instanceof EvidenceIntegrityError) return err(cause);
				if (!(cause instanceof ArtifactInventoryCarrierError)) throw cause;
				return err(new AnalysisInputError(operation, {
					cause,
					userMessage: cause.message
				}, [{
					path: ["inventory_evidence", ...cause.index === undefined ? [] : [cause.index, "operation"]],
					reason: "invalid_value",
					message: cause.message
				}]));
			}
		};
		projectedComponentSchema = z.strictObject({
			path: projectionPathSchema,
			artifact_id: prefixedDigestSchema("art"),
			sha256: digestSchema,
			format: z.string().min(1)
		});
		unavailableComponentSchema = z.strictObject({
			path: projectionPathSchema,
			artifact_id: z.null(),
			sha256: z.null(),
			format: z.string().min(1),
			encrypted: z.boolean(),
			limitations: z.array(z.string())
		});
		projectedBridgeCandidateSchema = (basis) => z.strictObject({
			managed_path: projectionPathSchema,
			native_path: projectionPathSchema,
			basis: z.enum(basis)
		});
		projectionCoverage = (inventory, budgetComplete) => ({
			status: hasCompleteInventoryCoverage(inventory, "container-entries") && budgetComplete ? "complete-within-inventory" : "partial",
			inventory_complete: inventory.complete
		});
		projectedInventoryEntries = (inventory) => {
			const nodes = new Map(inventory.nodes.map((node) => [node.artifact_id, node]));
			const limitations = [];
			const entries = inventory.occurrences.filter(({ logical_path }) => logical_path !== ".").map((occurrence) => {
				const path = occurrence.logical_path;
				const kind = occurrence.entry_kind;
				if (occurrence.artifact_id === null) return {
					path,
					kind,
					component: undefined,
					unavailable: {
						path,
						artifact_id: null,
						sha256: null,
						format: occurrence.artifact_format,
						encrypted: occurrence.encrypted,
						limitations: occurrence.limitations
					}
				};
				const node = nodes.get(occurrence.artifact_id);
				if (node === undefined) {
					limitations.push(`Inventory occurrence ${JSON.stringify(path)} references ${occurrence.artifact_id} (${occurrence.artifact_format}), whose node is outside the supplied pages. Its content SHA-256 and component classification remain unknown; the source Evidence retains the occurrence.`);
					return {
						path,
						kind,
						component: undefined,
						unavailable: undefined
					};
				}
				return {
					path,
					kind,
					component: {
						path,
						artifact_id: node.artifact_id,
						sha256: node.sha256,
						format: occurrence.artifact_format
					},
					unavailable: undefined
				};
			});
			return {
				entries,
				limitations
			};
		};
		projectedFileComponents = (entries) => entries.flatMap(({ kind, component }) => (kind === "file" || kind === "slice") && component !== undefined ? [component] : []);
	})))();
}

//#endregion
//#region dist/domain/bridgeCandidateProjection.js
var bridgeCandidateCoverageSchema, MAX_BRIDGE_CANDIDATE_JSON_BYTES, jsonText, projectCartesianCandidates;
function init_bridgeCandidateProjection() {
	return (init_bridgeCandidateProjection = __esmMin((() => {
		bridgeCandidateCoverageSchema = z.strictObject({
			status: z.enum(["complete", "partial"]),
			total_candidates: z.int().nonnegative(),
			emitted_candidates: z.int().nonnegative(),
			omitted_candidates: z.int().nonnegative()
		});
		MAX_BRIDGE_CANDIDATE_JSON_BYTES = 2 * 1024 * 1024;
		jsonText = (value) => {
			const serialized = JSON.stringify(value);
			if (serialized === undefined) throw new TypeError("Bridge candidate is not JSON serializable");
			return serialized;
		};
		projectCartesianCandidates = (input) => {
			const total = input.groups.reduce((sum, group) => sum + group.left.length * group.right.length, 0);
			const preparedGroups = input.groups.map((group) => ({
				left: group.left.map((value) => ({
					value,
					pathBytes: Buffer.byteLength(jsonText(value.path))
				})),
				right: group.right.map((value) => {
					const emptyLeftCandidate = jsonText(input.createCandidate("", value));
					return {
						value,
						rowOverhead: Buffer.byteLength(emptyLeftCandidate) - 2
					};
				})
			}));
			let estimatedFullBytes = 2 + Math.max(0, total - 1);
			for (const group of preparedGroups) {
				estimatedFullBytes += group.left.length * group.right.reduce((sum, { rowOverhead }) => sum + rowOverhead, 0) + group.right.length * group.left.reduce((sum, { pathBytes }) => sum + pathBytes, 0);
			}
			const shouldEmitAll = estimatedFullBytes <= MAX_BRIDGE_CANDIDATE_JSON_BYTES;
			const candidates = [];
			let estimatedRetainedBytes = 2;
			candidateLoop: for (const group of preparedGroups) {
				for (const left of group.left) {
					for (const right of group.right) {
						const candidateBytes = right.rowOverhead + left.pathBytes;
						const additionalBytes = candidateBytes + (candidates.length > 0 ? 1 : 0);
						if (!shouldEmitAll && estimatedRetainedBytes + additionalBytes > 2097152) break candidateLoop;
						candidates.push(input.createCandidate(left.value.path, right.value));
						estimatedRetainedBytes += additionalBytes;
					}
				}
			}
			return {
				candidates,
				coverage: {
					status: candidates.length === total ? "complete" : "partial",
					total_candidates: total,
					emitted_candidates: candidates.length,
					omitted_candidates: total - candidates.length
				}
			};
		};
	})))();
}

//#endregion
export { applicationInventoryProjectionInputSchema, bridgeCandidateCoverageSchema, init_bridgeCandidateProjection, init_mobileApplicationGraphProjection, projectCartesianCandidates, projectedBridgeCandidateSchema, projectedComponentSchema, projectedFileComponents, projectedInventoryEntries, projectionCoverage, projectionEvidenceIdSchema, projectionPathSchema, readApplicationInventoryProjection, unavailableComponentSchema };