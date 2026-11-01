import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { BINARY_ARCHITECTURES, RAW_ONLY_ARCHITECTURES, analysisProfileSchema, analysisProfilesEqual, canonicalJsonDigestSteps, committedProviderSchema, compareUnicodeCodePoints, compositeKey, createAnalysisProfile, digestSchema, evidenceLocationSchema, init_analysisProfile, init_binaryTargetTypes, init_canonicalJsonDigestSteps, init_digests, init_evidence, init_localPath, init_relationshipCoverage, init_unicodeCodePointOrder, localPathStringSchema, prefixedDigestSchema, rebindEvidenceSubjectTargetPath, rebindEvidenceToTargetPath, relationshipCoverageSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCapabilityUnavailableError, AnalysisError, AnalysisSnapshotMismatchError, EvidenceIntegrityError, NoBinaryOpenError, err, freezeJsonSnapshot, init_analysisErrorBase, init_analysisErrorCore, init_configurationErrors, init_evidenceErrors, init_immutableJson, init_jsonValue, init_result, jsonObjectSchema, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { evidenceBundleForTarget, evidenceBundleSchema, init_evidenceBundle, parseEvidenceBundle, parseImmutableEvidenceBundle } from "./evidenceBundle-DojUFdme.js";
import { REA_WORKFLOW_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { analysisErrorWithCleanupFailure, init_analysisErrorCleanup } from "./analysisErrorCleanup-DBL-xO0h.js";
import { ProviderCleanupError, init_providerCleanupError } from "./providerCleanupError-CdFjQgxe.js";
import { binaryArchitectureSchema, init_rawBinary, rawBinaryEntryPointSchema } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { OFFICIAL_TOOL_CONTRACTS, init_officialToolContracts } from "./officialToolContracts-BfPYBWaZ.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import canonicalize from "canonicalize";

//#region dist/domain/analysisSnapshot.js
var architectureSchema, formatSchema, kindSchema, subjectBaseSchema, subjectFormatSchema, subjectSchema, targetIdentitySchema, targetSchema, bindingSchema, entrySchema, workflowEntrySchema, analysisSnapshotSchema, preparedEntryBrand, preparedEntries, prepareSnapshotEntry, snapshotFileHeaderSchema, parsePreparedAnalysisSnapshot, contentDigest, snapshotContentDigest, evidenceContentDigest, snapshotExecutionProjection, canonicalJson, snapshotTarget, snapshotBinding, snapshotMatchesTarget, snapshotMatchesProfile, snapshotMatchesBinding, snapshotEvidenceForQuery, createAnalysisSnapshotWorkflowEntry, evidenceMatchesEntry, analysisQueryId, createAnalysisSnapshotEntry, validatedSnapshots, parseAnalysisSnapshot, immutableAnalysisSnapshot, sealSnapshot, restoreSnapshot, hasCanonicalQueryOrder, isCorrespondingEvidence, evidenceQueryKey, entryQueryKey, entryEvidenceKey, workflowEntryQueryKey, workflowEntryEvidenceKey, isWorkflowEvidence, evidenceMatchesWorkflowEntry, evidenceContentMetadata, serializeAnalysisSnapshot;
function init_analysisSnapshot() {
	return (init_analysisSnapshot = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_localPath();
		init_analysisProfile();
		init_binaryTargetTypes();
		init_evidenceBundle();
		init_evidence();
		init_jsonValue();
		init_digests();
		init_canonicalJsonDigestSteps();
		init_immutableJson();
		init_rawBinary();
		init_relationshipCoverage();
		architectureSchema = z.enum(BINARY_ARCHITECTURES);
		formatSchema = z.enum([
			"analysis-database",
			"mach-o",
			"mach-o-universal",
			"elf",
			"pe",
			"dos-mz",
			"dos-com",
			"raw-binary",
			"gamecube-dol",
			"zip",
			"ipa",
			"apk",
			"msix",
			"appx",
			"hap",
			"hsp",
			"app-pack",
			"asar",
			"godot-pck",
			"dmg",
			"pkg",
			"plist",
			"javascript",
			"source-map"
		]);
		kindSchema = z.enum([
			"executable",
			"database",
			"archive",
			"artifact"
		]);
		subjectBaseSchema = z.object({
			path: localPathStringSchema,
			sha256: digestSchema
		});
		subjectFormatSchema = z.enum([
			...formatSchema.options,
			"hopper",
			"directory",
			"file",
			"unknown",
			"javascript-bundle",
			"entitlements",
			"pyinstaller",
			"node-sea"
		]);
		subjectSchema = z.discriminatedUnion("format", [
			subjectBaseSchema.extend({
				format: subjectFormatSchema.exclude(["raw-binary", "gamecube-dol"]),
				architecture: architectureSchema.exclude([...RAW_ONLY_ARCHITECTURES]).nullable()
			}),
			subjectBaseSchema.extend({
				format: z.literal("raw-binary"),
				architecture: architectureSchema.nullable()
			}),
			subjectBaseSchema.extend({
				format: z.literal("gamecube-dol"),
				architecture: z.literal("powerpc")
			})
		]);
		targetIdentitySchema = z.object({
			sha256: digestSchema,
			kind: kindSchema,
			architecture: architectureSchema.nullable()
		});
		targetSchema = z.discriminatedUnion("format", [
			targetIdentitySchema.extend({
				format: z.enum(formatSchema.options.filter((format) => format !== "raw-binary" && format !== "gamecube-dol")),
				architecture: architectureSchema.exclude([...RAW_ONLY_ARCHITECTURES]).nullable()
			}),
			targetIdentitySchema.extend({
				format: z.literal("raw-binary"),
				kind: z.literal("executable"),
				architecture: binaryArchitectureSchema,
				entry_point: rawBinaryEntryPointSchema
			}),
			targetIdentitySchema.extend({
				format: z.literal("gamecube-dol"),
				kind: z.literal("executable"),
				architecture: z.literal("powerpc"),
				entry_point: rawBinaryEntryPointSchema
			})
		]);
		bindingSchema = z.object({
			provider: committedProviderSchema,
			analysis_profile: analysisProfileSchema
		}).superRefine((binding, context) => {
			if (binding.provider.id !== binding.analysis_profile.provider.id || binding.provider.name !== binding.analysis_profile.provider.name || binding.provider.version !== binding.analysis_profile.provider.version) context.addIssue({
				code: "custom",
				path: ["provider"],
				message: "Snapshot binding provider does not match analysis profile"
			});
		});
		entrySchema = z.object({
			query_id: prefixedDigestSchema("query"),
			operation: z.string().min(1),
			parameters: jsonObjectSchema,
			execution: z.object({
				result: jsonValueSchema,
				raw_result: jsonValueSchema.nullable(),
				provider: committedProviderSchema,
				limitations: z.array(z.string()),
				relationship_coverage: relationshipCoverageSchema.nullable(),
				locations: z.array(evidenceLocationSchema),
				subject: subjectSchema.nullable()
			})
		});
		workflowEntrySchema = z.object({
			query_id: prefixedDigestSchema("query"),
			operation: z.string().min(1),
			parameters: jsonObjectSchema,
			execution: z.object({
				result: jsonValueSchema,
				raw_result: jsonValueSchema.nullable(),
				provider: committedProviderSchema,
				analysis_profile: analysisProfileSchema,
				limitations: z.array(z.string()),
				relationship_coverage: relationshipCoverageSchema.nullable(),
				locations: z.array(evidenceLocationSchema),
				subject: subjectSchema.nullable()
			})
		});
		analysisSnapshotSchema = z.object({
			target: targetSchema,
			binding: bindingSchema,
			entries: z.array(entrySchema),
			workflow_entries: z.array(workflowEntrySchema),
			evidence_bundle: evidenceBundleSchema
		});
		preparedEntryBrand = Symbol("prepared-snapshot-entry");
		preparedEntries = new WeakMap();
		prepareSnapshotEntry = (input, kind) => {
			const handle = Object.freeze({ [preparedEntryBrand]: true });
			if (kind === "provider") {
				const entry = entrySchema.parse(input);
				const { result, raw_result, ...execution } = entry.execution;
				preparedEntries.set(handle, {
					kind,
					entry: {
						...entry,
						execution
					},
					digest: snapshotContentDigest(result, raw_result, execution)
				});
			} else {
				const entry = workflowEntrySchema.parse(input);
				const { result, raw_result, ...execution } = entry.execution;
				preparedEntries.set(handle, {
					kind,
					entry: {
						...entry,
						execution
					},
					digest: snapshotContentDigest(result, raw_result, execution)
				});
			}
			return handle;
		};
		snapshotFileHeaderSchema = z.object({
			target: targetSchema,
			binding: bindingSchema,
			evidence_bundle: z.unknown()
		});
		parsePreparedAnalysisSnapshot = (input, entries, workflowEntries) => {
			const header = snapshotFileHeaderSchema.parse(input);
			const bundle = parseImmutableEvidenceBundle(header.evidence_bundle);
			const providerRows = entries.map((handle) => {
				const row = preparedEntries.get(handle);
				if (row?.kind !== "provider") throw new TypeError("Analysis snapshot entry was not parsed in this realm");
				return row;
			});
			const workflowRows = workflowEntries.map((handle) => {
				const row = preparedEntries.get(handle);
				if (row?.kind !== "workflow") throw new TypeError("Analysis snapshot workflow entry was not parsed in this realm");
				return row;
			});
			const restored = sealSnapshot(restoreSnapshot(header, bundle, providerRows, workflowRows));
			for (const handle of [...entries, ...workflowEntries]) preparedEntries.delete(handle);
			return restored;
		};
		contentDigest = (value) => {
			const steps = canonicalJsonDigestSteps(value);
			let step = steps.next();
			while (!step.done) step = steps.next();
			return step.value;
		};
		snapshotContentDigest = (result, rawResult, execution) => {
			const metadata = jsonObjectSchema.parse({
				limitations: execution.limitations,
				locations: execution.locations,
				subject: execution.subject === null ? null : {
					local_path: execution.subject.path,
					sha256: execution.subject.sha256,
					format: execution.subject.format,
					architecture: execution.subject.architecture
				},
				relationship_coverage: execution.relationship_coverage
			});
			return contentDigest({
				...metadata,
				normalized_result: result,
				raw_result: rawResult
			});
		};
		evidenceContentDigest = (evidence) => {
			return contentDigest({
				...jsonObjectSchema.parse(evidenceContentMetadata(evidence)),
				normalized_result: evidence.normalized_result,
				raw_result: evidence.raw_result
			});
		};
		snapshotExecutionProjection = (execution, provider) => ({
			result: execution.result,
			raw_result: execution.rawResult,
			provider,
			limitations: [...execution.limitations],
			relationship_coverage: execution.relationshipCoverage ?? null,
			locations: [...execution.locations],
			subject: execution.subject === null ? null : subjectSchema.parse({
				...execution.subject,
				architecture: execution.subject.architecture ?? null
			})
		});
		canonicalJson = (value) => {
			const json = jsonValueSchema.parse(value);
			const encoded = canonicalize(json);
			if (encoded === undefined) throw new TypeError("RFC 8785 canonicalization rejected snapshot data");
			return encoded;
		};
		snapshotTarget = (target) => target.format === "raw-binary" ? {
			sha256: target.sha256,
			kind: target.kind,
			architecture: target.architecture,
			format: target.format,
			entry_point: target.entryPoint
		} : target.format === "gamecube-dol" ? {
			sha256: target.sha256,
			kind: target.kind,
			architecture: target.architecture,
			format: target.format,
			entry_point: target.entryPoint
		} : {
			sha256: target.sha256,
			kind: target.kind,
			architecture: target.architecture ?? null,
			format: target.format
		};
		snapshotBinding = (profile) => bindingSchema.parse({
			provider: profile.provider,
			analysis_profile: profile
		});
		snapshotMatchesTarget = (snapshot, target) => snapshot.sha256 === target.sha256 && snapshot.kind === target.kind && snapshot.format === target.format && snapshot.architecture === (target.architecture ?? null) && (snapshot.format !== "raw-binary" || target.format === "raw-binary" && snapshot.entry_point === target.entryPoint) && (snapshot.format !== "gamecube-dol" || target.format === "gamecube-dol" && snapshot.entry_point === target.entryPoint);
		snapshotMatchesProfile = (binding, profile) => binding.provider.id === profile.provider.id && binding.provider.name === profile.provider.name && binding.provider.version === profile.provider.version && analysisProfilesEqual(binding.analysis_profile, profile);
		snapshotMatchesBinding = (snapshot, target, profile) => snapshotMatchesTarget(snapshot.target, target) && snapshotMatchesProfile(snapshot.binding, profile);
		snapshotEvidenceForQuery = (snapshot, query) => {
			const { target, bindingProfile, operation, parameters, provider, evidenceProfile } = query;
			if (!snapshotMatchesBinding(snapshot, target, bindingProfile)) return undefined;
			const encodedParameters = canonicalJson(parameters);
			const queryId = analysisQueryId(snapshot.target, snapshot.binding, operation, parameters);
			const entry = snapshot.entries.find((candidate) => candidate.query_id === queryId);
			const workflowEntry = snapshot.workflow_entries.find((candidate) => candidate.query_id === queryId);
			if (entry === undefined && workflowEntry === undefined) return undefined;
			let evidence;
			for (const record of snapshot.evidence_bundle.records) {
				if (!(record.subject?.digest.sha256 === target.sha256 && record.operation === operation && record.provider.id === provider.id && record.provider.name === provider.name && record.provider.version === provider.version && record.analysis_profile !== null && analysisProfilesEqual(record.analysis_profile, evidenceProfile) && canonicalJson(record.parameters) === encodedParameters && (entry !== undefined && evidenceMatchesEntry(record, entry, snapshot) || workflowEntry !== undefined && evidenceMatchesWorkflowEntry(record, workflowEntry, snapshot)))) continue;
				if (evidence !== undefined && evidence.evidence_id !== record.evidence_id) return undefined;
				evidence = record;
			}
			return evidence === undefined ? undefined : rebindEvidenceToTargetPath(evidence, target);
		};
		createAnalysisSnapshotWorkflowEntry = (input) => {
			const { target, binding, operation, parameters, execution } = input;
			if (execution.provider.id !== execution.analysisProfile.provider.id || execution.provider.name !== execution.analysisProfile.provider.name || execution.provider.version !== execution.analysisProfile.provider.version) throw new TypeError("Workflow snapshot execution provider does not match its profile");
			return {
				query_id: analysisQueryId(target, binding, operation, parameters),
				operation,
				parameters: jsonObjectSchema.parse(parameters),
				execution: {
					...snapshotExecutionProjection(execution, execution.analysisProfile.provider),
					analysis_profile: execution.analysisProfile
				}
			};
		};
		evidenceMatchesEntry = (evidence, entry, snapshot) => isCorrespondingEvidence(evidence, snapshot) && compositeKey([evidenceQueryKey(evidence), evidenceContentDigest(evidence)]) === entryEvidenceKey(entry, snapshot.binding);
		analysisQueryId = (target, binding, operation, parameters) => `query_${createHash("sha256").update(canonicalJson({
			target,
			binding,
			operation,
			parameters
		})).digest("hex")}`;
		createAnalysisSnapshotEntry = (input) => {
			const { target, binding, operation, parameters, execution } = input;
			if (execution.analysisProfile === undefined || !snapshotMatchesProfile(binding, execution.analysisProfile) || execution.provider.id !== binding.provider.id || execution.provider.name !== binding.provider.name || execution.provider.version !== binding.provider.version) throw new TypeError("Snapshot execution does not match its provider/profile binding");
			return {
				query_id: analysisQueryId(target, binding, operation, parameters),
				operation,
				parameters: jsonObjectSchema.parse(parameters),
				execution: snapshotExecutionProjection(execution, binding.provider)
			};
		};
		validatedSnapshots = new WeakMap();
		parseAnalysisSnapshot = (input) => {
			if (typeof input === "object" && input !== null) {
				const owned = validatedSnapshots.get(input);
				if (owned !== undefined) return owned;
			}
			const parsed = analysisSnapshotSchema.parse(input);
			restoreSnapshot(parsed, parseEvidenceBundle(parsed.evidence_bundle), parsed.entries.map((entry) => ({
				kind: "provider",
				entry,
				digest: snapshotContentDigest(entry.execution.result, entry.execution.raw_result, entry.execution)
			})), parsed.workflow_entries.map((entry) => ({
				kind: "workflow",
				entry,
				digest: snapshotContentDigest(entry.execution.result, entry.execution.raw_result, entry.execution)
			})));
			return parsed;
		};
		immutableAnalysisSnapshot = (input) => sealSnapshot(parseAnalysisSnapshot(input));
		sealSnapshot = (snapshot) => {
			for (const entry of [...snapshot.entries, ...snapshot.workflow_entries]) {
				freezeJsonSnapshot(entry.execution.result);
				freezeJsonSnapshot(entry.execution.raw_result);
			}
			freezeJsonSnapshot(snapshot);
			validatedSnapshots.set(snapshot, snapshot);
			return snapshot;
		};
		restoreSnapshot = (header, bundle, providerRows, workflowRows) => {
			const scopedEvidence = evidenceBundleForTarget(bundle, header.target.sha256);
			if (scopedEvidence.records.length !== bundle.records.length || scopedEvidence.unknowns.length !== bundle.unknowns.length) throw new TypeError("Analysis snapshot evidence contains records for another target");
			if (!hasCanonicalQueryOrder(providerRows.map(({ entry }) => entry))) throw new TypeError("Analysis snapshot entries are not canonical");
			if (!hasCanonicalQueryOrder(workflowRows.map(({ entry }) => entry))) throw new TypeError("Analysis snapshot workflow entries are not canonical");
			const ids = new Set();
			const corresponding = new Set();
			const matching = new Map();
			for (const evidence of bundle.records) {
				if (evidence.predicate_type !== "rea.analysis" || evidence.authority !== "shipped-artifact" || evidence.subject?.digest.sha256 !== header.target.sha256 || evidence.analysis_profile === null || evidence.confidence !== "observed" && evidence.confidence !== "derived") continue;
				if (evidence.confidence === "observed" && !isCorrespondingEvidence(evidence, header)) continue;
				const query = compositeKey([evidence.confidence, evidenceQueryKey(evidence)]);
				corresponding.add(query);
				matching.set(compositeKey([query, evidenceContentDigest(evidence)]), evidence);
			}
			const find = (query, digest, label, operation) => {
				const evidence = matching.get(compositeKey([query, digest]));
				if (evidence !== undefined) return evidence;
				throw new TypeError(corresponding.has(query) ? `Analysis snapshot ${label} ${operation} differs from its Evidence record` : `Analysis snapshot ${label} ${operation} has no profile-bound Evidence record`);
			};
			const checkId = (entry, workflow) => {
				const expected = analysisQueryId(header.target, header.binding, entry.operation, entry.parameters);
				if (entry.query_id !== expected) throw new TypeError(workflow ? "Analysis snapshot workflow query identifier does not match" : "Analysis snapshot query identifier does not match");
				if (ids.has(entry.query_id)) throw new TypeError("Analysis snapshot contains duplicate queries");
				ids.add(entry.query_id);
			};
			const entries = providerRows.map(({ entry, digest }) => {
				if (entry.execution.provider.id !== header.binding.provider.id || entry.execution.provider.name !== header.binding.provider.name || entry.execution.provider.version !== header.binding.provider.version) throw new TypeError("Analysis snapshot entry provider does not match");
				checkId(entry, false);
				const evidence = find(compositeKey(["observed", entryQueryKey(entry, header.binding)]), digest, "entry", entry.operation);
				return {
					...entry,
					execution: {
						...entry.execution,
						result: evidence.normalized_result,
						raw_result: evidence.raw_result
					}
				};
			});
			const workflow_entries = workflowRows.map(({ entry, digest }) => {
				const provider = entry.execution.analysis_profile.provider;
				if (entry.execution.provider.id !== provider.id || entry.execution.provider.name !== provider.name || entry.execution.provider.version !== provider.version) throw new TypeError("Analysis snapshot workflow entry provider does not match its profile");
				checkId(entry, true);
				const evidence = find(compositeKey(["derived", workflowEntryQueryKey(entry)]), digest, "workflow entry", entry.operation);
				return {
					...entry,
					execution: {
						...entry.execution,
						result: evidence.normalized_result,
						raw_result: evidence.raw_result
					}
				};
			});
			return {
				target: header.target,
				binding: header.binding,
				entries,
				workflow_entries,
				evidence_bundle: bundle
			};
		};
		hasCanonicalQueryOrder = (entries) => {
			let previous;
			for (const { query_id: queryId } of entries) {
				if (previous !== undefined && compareUnicodeCodePoints(previous, queryId) > 0) return false;
				previous = queryId;
			}
			return true;
		};
		isCorrespondingEvidence = (evidence, snapshot) => evidence.predicate_type === "rea.analysis" && evidence.confidence === "observed" && evidence.authority === "shipped-artifact" && evidence.subject?.digest.sha256 === snapshot.target.sha256 && evidence.analysis_profile !== null && analysisProfilesEqual(evidence.analysis_profile, snapshot.binding.analysis_profile);
		evidenceQueryKey = (evidence) => contentDigest({
			operation: evidence.operation,
			parameters: evidence.parameters,
			provider: evidence.provider,
			analysis_profile: evidence.analysis_profile
		});
		entryQueryKey = (entry, binding) => contentDigest({
			operation: entry.operation,
			parameters: entry.parameters,
			provider: entry.execution.provider,
			analysis_profile: binding.analysis_profile
		});
		entryEvidenceKey = (entry, binding) => compositeKey([entryQueryKey(entry, binding), snapshotContentDigest(entry.execution.result, entry.execution.raw_result, entry.execution)]);
		workflowEntryQueryKey = (entry) => contentDigest({
			operation: entry.operation,
			parameters: entry.parameters,
			provider: entry.execution.provider,
			analysis_profile: entry.execution.analysis_profile
		});
		workflowEntryEvidenceKey = (entry) => compositeKey([workflowEntryQueryKey(entry), snapshotContentDigest(entry.execution.result, entry.execution.raw_result, entry.execution)]);
		isWorkflowEvidence = (evidence, snapshot, entry) => evidence.predicate_type === "rea.analysis" && evidence.confidence === "derived" && evidence.authority === "shipped-artifact" && evidence.subject?.digest.sha256 === snapshot.target.sha256 && evidence.analysis_profile !== null && analysisProfilesEqual(evidence.analysis_profile, entry.execution.analysis_profile) && evidence.provider.id === entry.execution.provider.id && evidence.provider.name === entry.execution.provider.name && evidence.provider.version === entry.execution.provider.version;
		evidenceMatchesWorkflowEntry = (evidence, entry, snapshot) => isWorkflowEvidence(evidence, snapshot, entry) && compositeKey([evidenceQueryKey(evidence), evidenceContentDigest(evidence)]) === workflowEntryEvidenceKey(entry);
		evidenceContentMetadata = (evidence) => {
			return {
				limitations: evidence.limitations,
				relationship_coverage: evidence.relationship_coverage,
				locations: evidence.locations,
				subject: evidence.subject === null ? null : {
					local_path: evidence.subject.local_path,
					sha256: evidence.subject.digest.sha256,
					format: evidence.subject.format,
					architecture: evidence.subject.architecture
				}
			};
		};
		serializeAnalysisSnapshot = (snapshot) => `${canonicalJson(parseAnalysisSnapshot(snapshot))}\n`;
	})))();
}

//#endregion
//#region dist/application/binary/AnalysisSnapshotCache.js
var RELATIONSHIP_OPERATIONS, STATEFUL_OPERATIONS, CURSOR_DEFAULT_OPERATIONS, DOCUMENT_SCOPED_OPERATIONS, SNAPSHOT_CACHE_ENTRY_CEILING, isSnapshotCacheable, requiresNativeSourceAdmissionBeforeReplay, AnalysisSnapshotCache;
function init_AnalysisSnapshotCache() {
	return (init_AnalysisSnapshotCache = __esmMin((() => {
		init_evidenceErrors();
		init_configurationErrors();
		init_evidence();
		init_result();
		init_analysisSnapshot();
		init_officialToolContracts();
		init_unicodeCodePointOrder();
		RELATIONSHIP_OPERATIONS = new Set(["procedure_callers", "procedure_callees"]);
		STATEFUL_OPERATIONS = new Set([
			"health",
			"current_address",
			"current_procedure",
			"current_document",
			"goto_address",
			"list_documents"
		]);
		CURSOR_DEFAULT_OPERATIONS = new Set([
			"address_name",
			"comment",
			"inline_comment",
			"next_address",
			"prev_address",
			"xrefs"
		]);
		DOCUMENT_SCOPED_OPERATIONS = new Set(OFFICIAL_TOOL_CONTRACTS.map(({ name }) => name).filter((name) => name !== "current_document" && name !== "list_documents"));
		SNAPSHOT_CACHE_ENTRY_CEILING = 1e4;
		isSnapshotCacheable = (operation, descriptor, parameters) => !STATEFUL_OPERATIONS.has(operation) && (!DOCUMENT_SCOPED_OPERATIONS.has(operation) || typeof parameters.document === "string") && (!CURSOR_DEFAULT_OPERATIONS.has(operation) || typeof parameters.address === "string") && descriptor?.effects.mutatesArtifact === false && descriptor.cachePolicy !== "live" && (descriptor.cachePolicy === "snapshot" || descriptor.effects.mayWriteFilesystem === false) && descriptor.effects.changesPermissions === false;
		requiresNativeSourceAdmissionBeforeReplay = (providerId) => process.platform === "win32" && providerId === "ghidra";
		AnalysisSnapshotCache = class {
			#entries = new Map();
			#evidenceIds = new Map();
			#workflowEntries = new Map();
			#target;
			#binding;
			/** Whether staged entries belong to the supplied target and profile. */
			matches(target, profile) {
				return this.#target === undefined && this.#binding === undefined || this.#target !== undefined && this.#binding !== undefined && profile !== undefined && snapshotMatchesTarget(this.#target, target) && snapshotMatchesProfile(this.#binding, profile);
			}
			/** Replace cache state when the target or selected profile changes. */
			select(target, profile) {
				if (!this.matches(target, profile)) this.#clearEntries();
				this.#target = snapshotTarget(target);
				this.#binding = snapshotBinding(profile);
			}
			/** Merge already-validated entries and return the new-entry count. */
			stage(snapshot) {
				snapshot = immutableAnalysisSnapshot(snapshot);
				if (this.#target !== undefined && JSON.stringify(this.#target) !== JSON.stringify(snapshot.target) || this.#binding !== undefined && !snapshotMatchesProfile(this.#binding, snapshot.binding.analysis_profile)) this.#clearEntries();
				this.#target = structuredClone(snapshot.target);
				this.#binding = structuredClone(snapshot.binding);
				let imported = 0;
				const stagedQueryIds = new Set();
				for (const entry of snapshot.entries) {
					if (!this.#entries.has(entry.query_id) && !this.#hasCapacity()) continue;
					if (!this.#entries.has(entry.query_id)) imported += 1;
					this.#entries.set(entry.query_id, entry);
					stagedQueryIds.add(entry.query_id);
					this.#evidenceIds.delete(entry.query_id);
				}
				const evidenceIds = new Map();
				const ambiguous = new Set();
				for (const evidence of snapshot.evidence_bundle.records) {
					const queryId = analysisQueryId(snapshot.target, snapshot.binding, evidence.operation, evidence.parameters);
					if (!stagedQueryIds.has(queryId)) continue;
					const entry = this.#entries.get(queryId);
					if (entry === undefined || !evidenceMatchesEntry(evidence, entry, snapshot)) continue;
					const previous = evidenceIds.get(queryId);
					if (previous !== undefined && previous !== evidence.evidence_id) ambiguous.add(queryId);
					else evidenceIds.set(queryId, evidence.evidence_id);
				}
				for (const [queryId, evidenceId] of evidenceIds) {
					if (ambiguous.has(queryId)) this.#evidenceIds.delete(queryId);
					else this.#evidenceIds.set(queryId, evidenceId);
				}
				for (const entry of snapshot.workflow_entries) {
					if (!this.#workflowEntries.has(entry.query_id) && !this.#hasCapacity()) continue;
					if (!this.#workflowEntries.has(entry.query_id)) imported += 1;
					this.#workflowEntries.set(entry.query_id, entry);
				}
				return imported;
			}
			/** Refresh subject bindings backed by replaced authenticated metadata. */
			refreshEvidenceMetadata(replacements) {
				if (this.#target === undefined || this.#binding === undefined) return;
				const header = {
					target: this.#target,
					binding: this.#binding
				};
				for (const { previous, current } of replacements) {
					if (current.subject === null || previous.subject?.local_path === current.subject.local_path) continue;
					const queryId = analysisQueryId(header.target, header.binding, previous.operation, previous.parameters);
					const entry = this.#entries.get(queryId);
					if (entry !== undefined && entry.execution.subject !== null && evidenceMatchesEntry(previous, entry, header)) this.#entries.set(queryId, {
						...entry,
						execution: {
							...entry.execution,
							subject: {
								...entry.execution.subject,
								path: current.subject.local_path
							}
						}
					});
					const workflow = this.#workflowEntries.get(queryId);
					if (workflow !== undefined && workflow.execution.subject !== null && evidenceMatchesWorkflowEntry(previous, workflow, header)) this.#workflowEntries.set(queryId, {
						...workflow,
						execution: {
							...workflow.execution,
							subject: {
								...workflow.execution.subject,
								path: current.subject.local_path
							}
						}
					});
				}
			}
			/** Build a complete snapshot for an active target. */
			export(target, profile, evidenceBundle) {
				if (target === undefined || profile === undefined) return err(new NoBinaryOpenError());
				try {
					const snapshotTargetIdentity = snapshotTarget(target);
					const binding = snapshotBinding(profile);
					const entries = [...this.#entries.values()].sort((left, right) => compareUnicodeCodePoints(left.query_id, right.query_id));
					const workflows = [...this.#workflowEntries.values()].sort((left, right) => compareUnicodeCodePoints(left.query_id, right.query_id));
					return ok(parseAnalysisSnapshot({
						target: snapshotTargetIdentity,
						binding,
						entries,
						workflow_entries: workflows,
						evidence_bundle: evidenceBundle
					}));
				} catch (cause) {
					return err(new EvidenceIntegrityError("Analysis snapshot validation failed", { cause }));
				}
			}
			/** Validate target identity, merge evidence atomically, then stage entries. */
			import(snapshot, active, mergeEvidence) {
				let validated;
				try {
					validated = immutableAnalysisSnapshot(snapshot);
				} catch (cause) {
					return err(new EvidenceIntegrityError("Analysis snapshot validation failed", { cause }));
				}
				if (active !== undefined && (!snapshotMatchesTarget(validated.target, active.target) || !snapshotMatchesProfile(validated.binding, active.profile))) return err(new AnalysisSnapshotMismatchError("Analysis snapshot profile_mismatch: target, provider, or analysis profile does not match the active binary"));
				const importedEvidence = mergeEvidence(validated.evidence_bundle);
				return importedEvidence.ok ? ok(this.stage(validated)) : importedEvidence;
			}
			/** Return canonical entries for persistence. */
			entries() {
				return [...this.#entries.values()].sort((left, right) => compareUnicodeCodePoints(left.query_id, right.query_id)).map((entry) => structuredClone(entry));
			}
			/** Return canonical composed-workflow entries for persistence. */
			workflowEntries() {
				return [...this.#workflowEntries.values()].sort((left, right) => compareUnicodeCodePoints(left.query_id, right.query_id)).map((entry) => structuredClone(entry));
			}
			/** Record one exact derived workflow result unless the shared cache is full. */
			recordWorkflow(input) {
				this.select(input.target, input.profile);
				const queryId = analysisQueryId(snapshotTarget(input.target), snapshotBinding(input.profile), input.operation, input.parameters);
				if (!this.#workflowEntries.has(queryId) && !this.#hasCapacity()) return;
				const entry = createAnalysisSnapshotWorkflowEntry({
					target: snapshotTarget(input.target),
					binding: snapshotBinding(input.profile),
					operation: input.operation,
					parameters: input.parameters,
					execution: input.execution
				});
				this.#workflowEntries.set(entry.query_id, entry);
			}
			/** Replay an exact provider-specific query, marking its cached provenance. */
			lookup(target, profile, operation, parameters) {
				const queryId = analysisQueryId(snapshotTarget(target), snapshotBinding(profile), operation, parameters);
				const cached = this.#entries.get(queryId);
				if (cached === undefined) return undefined;
				const cachedSubject = cached.execution.subject;
				const subject = cachedSubject == null ? null : rebindEvidenceSubjectTargetPath({
					path: cachedSubject.path,
					sha256: cachedSubject.sha256,
					format: cachedSubject.format,
					...cachedSubject.architecture === null ? {} : { architecture: cachedSubject.architecture }
				}, target);
				const evidenceId = this.#evidenceIds.get(queryId);
				return structuredClone({
					...evidenceId === undefined ? {} : { evidenceId },
					result: cached.execution.result,
					rawResult: cached.execution.raw_result,
					provider: cached.execution.provider,
					analysisProfile: structuredClone(profile),
					limitations: [...cached.execution.limitations, "Loaded from a local REA analysis snapshot; this call did not re-run the provider."],
					...cached.execution.relationship_coverage === null && RELATIONSHIP_OPERATIONS.has(operation) ? { relationshipCoverage: {
						status: "unknown",
						reason: "Snapshot entry does not report relationship coverage."
					} } : cached.execution.relationship_coverage === null ? {} : { relationshipCoverage: cached.execution.relationship_coverage },
					locations: cached.execution.locations,
					subject: subject ?? null
				});
			}
			/** Record one successful immutable call unless the cache is full. */
			record(input) {
				const { target, profile, operation, parameters, execution } = input;
				this.select(target, profile);
				if (execution.referencesTruncated === true) return;
				if ((execution.sourceEvidence?.length ?? 0) > 0) return;
				const queryId = analysisQueryId(snapshotTarget(target), snapshotBinding(profile), operation, parameters);
				if (!this.#entries.has(queryId) && !this.#hasCapacity()) return;
				const entry = createAnalysisSnapshotEntry({
					target: snapshotTarget(target),
					binding: snapshotBinding(profile),
					operation,
					parameters,
					execution: {
						...execution,
						subject: execution.subject === undefined ? {
							path: target.path,
							sha256: target.sha256,
							format: target.format,
							...target.architecture === undefined ? {} : { architecture: target.architecture }
						} : execution.subject
					}
				});
				this.#entries.set(entry.query_id, entry);
				if (execution.evidenceId === undefined) this.#evidenceIds.delete(entry.query_id);
				else this.#evidenceIds.set(entry.query_id, execution.evidenceId);
			}
			/** Forget all target-bound entries. */
			clear() {
				this.#clearEntries();
				this.#target = undefined;
				this.#binding = undefined;
			}
			#clearEntries() {
				this.#entries.clear();
				this.#evidenceIds.clear();
				this.#workflowEntries.clear();
			}
			#hasCapacity() {
				return this.#entries.size + this.#workflowEntries.size < SNAPSHOT_CACHE_ENTRY_CEILING;
			}
		};
	})))();
}

//#endregion
//#region dist/application/WorkflowAnalysisProfile.js
var workflowAnalysisProfile;
function init_WorkflowAnalysisProfile() {
	return (init_WorkflowAnalysisProfile = __esmMin((() => {
		init_analysisProfile();
		init_investigationProviders();
		workflowAnalysisProfile = (upstream, operation) => createAnalysisProfile(REA_WORKFLOW_PROVIDER, {
			upstream_analysis_profile: upstream,
			source_limitations: "provider-operation-caveats-v1",
			...operation === "binary_overview" ? { workflow_revision: 4 } : operation === "batch_decompile" || operation === "get_call_graph" || operation === "trace_feature" ? { workflow_revision: 3 } : { workflow_revision: 1 }
		});
	})))();
}

//#endregion
//#region dist/application/binary/ProfilelessNativeWorkflowSnapshot.js
var profilelessNativeDispatchProfile, isProfilelessNativeDispatchSnapshot, hasOnlyProfilelessNativeDispatchEntries;
function init_ProfilelessNativeWorkflowSnapshot() {
	return (init_ProfilelessNativeWorkflowSnapshot = __esmMin((() => {
		init_analysisProfile();
		init_analysisSnapshot();
		init_WorkflowAnalysisProfile();
		profilelessNativeDispatchProfile = (route) => {
			const descriptor = route.capabilities.get("inspect_native_dispatch_metadata");
			const profile = descriptor?.analysisProfile;
			if (descriptor === undefined || descriptor.operation !== "inspect_native_dispatch_metadata" || !descriptor.available || descriptor.provider.id !== "native-macos" || profile === undefined || profile.provider.id !== descriptor.provider.id || profile.provider.name !== descriptor.provider.name || profile.provider.version.length === 0) return undefined;
			return structuredClone(profile);
		};
		isProfilelessNativeDispatchSnapshot = (snapshot, target, profile) => snapshotMatchesBinding(snapshot, target, profile) && snapshot.entries.length === 0 && hasOnlyProfilelessNativeDispatchEntries(snapshot.workflow_entries, profile);
		hasOnlyProfilelessNativeDispatchEntries = (entries, profile) => entries.length > 0 && entries.every((entry) => entry.operation === "inspect_native_dispatch_metadata" && analysisProfilesEqual(entry.execution.analysis_profile, workflowAnalysisProfile(profile, entry.operation)));
	})))();
}

//#endregion
//#region dist/providers/AnalysisClientCleanup.js
var closeAnalysisClient;
function init_AnalysisClientCleanup() {
	return (init_AnalysisClientCleanup = __esmMin((() => {
		init_providerCleanupError();
		init_result();
		init_analysisErrorBase();
		closeAnalysisClient = async (client, providerId, options = {}) => {
			try {
				const result = await client.close(options);
				if (!result.ok) options.onCleanupFailure?.(result.error);
				return result;
			} catch (cause) {
				const failure = cause instanceof AnalysisError && cause.cleanupIncomplete ? cause : new ProviderCleanupError(providerId, ["provider-client"], { reason: "provider client close rejected unexpectedly" }, { cause });
				options.onCleanupFailure?.(failure);
				return err(failure);
			}
		};
	})))();
}

//#endregion
//#region dist/application/binary/BundleResourceSession.js
var BUNDLE_NATIVE_RESOURCE_OPERATIONS, BUNDLE_ARTIFACT_RESOURCE_OPERATIONS, BUNDLE_RESOURCE_OPERATIONS, combineBundleResourceClients;
function init_BundleResourceSession() {
	return (init_BundleResourceSession = __esmMin((() => {
		init_analysisErrorCore();
		init_analysisErrorCleanup();
		init_result();
		init_AnalysisClientCleanup();
		BUNDLE_NATIVE_RESOURCE_OPERATIONS = new Set(["inspect_plist"]);
		BUNDLE_ARTIFACT_RESOURCE_OPERATIONS = new Set([
			"decode_interface_builder",
			"inspect_asset_catalog",
			"inspect_keyed_archive"
		]);
		BUNDLE_RESOURCE_OPERATIONS = new Set([...BUNDLE_NATIVE_RESOURCE_OPERATIONS, ...BUNDLE_ARTIFACT_RESOURCE_OPERATIONS]);
		combineBundleResourceClients = (artifactClient, nativeClient) => ({
			execute: (operation, parameters, options) => {
				if (operation === "health") return artifactClient.execute(operation, parameters, options);
				if (!BUNDLE_RESOURCE_OPERATIONS.has(operation)) return Promise.resolve(err(new AnalysisCapabilityUnavailableError("bundle-resources", operation, "This session provides read-only app resource inspection only.")));
				return BUNDLE_NATIVE_RESOURCE_OPERATIONS.has(operation) ? nativeClient.execute(operation, parameters, options) : artifactClient.execute(operation, parameters, options);
			},
			close: async (options) => {
				const [artifact, native] = await Promise.all([closeAnalysisClient(artifactClient, "bundle-resources", options), closeAnalysisClient(nativeClient, "bundle-resources", options)]);
				if (!artifact.ok && !native.ok) return err(analysisErrorWithCleanupFailure(artifact.error, native.error, "close_binary"));
				if (!artifact.ok) return artifact;
				if (!native.ok) return native;
				return ok(null);
			}
		});
	})))();
}

//#endregion
export { AnalysisSnapshotCache, BUNDLE_ARTIFACT_RESOURCE_OPERATIONS, BUNDLE_NATIVE_RESOURCE_OPERATIONS, BUNDLE_RESOURCE_OPERATIONS, closeAnalysisClient, combineBundleResourceClients, hasOnlyProfilelessNativeDispatchEntries, init_AnalysisClientCleanup, init_AnalysisSnapshotCache, init_BundleResourceSession, init_ProfilelessNativeWorkflowSnapshot, init_WorkflowAnalysisProfile, init_analysisSnapshot, isProfilelessNativeDispatchSnapshot, isSnapshotCacheable, parsePreparedAnalysisSnapshot, prepareSnapshotEntry, profilelessNativeDispatchProfile, requiresNativeSourceAdmissionBeforeReplay, serializeAnalysisSnapshot, snapshotEvidenceForQuery, snapshotMatchesBinding, snapshotMatchesTarget, snapshotTarget, workflowAnalysisProfile };