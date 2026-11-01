import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { analysisInputErrorFromIssues, createEvidence, describeValidationFailure, init_evidence, init_evidenceValidation, init_inputIssueProjection, init_processCaptureParsing, init_validationFailure, projectInputIssues, rebindEvidenceToTargetPath, safeParseEvidence, safeParseProcessCapture } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { INSPECT_ANALYSIS_VIEW_OPERATION, init_analysisView, init_analysisViewErrors, inspectAnalysisViewInputSchema, prepareAnalysisViewProjection } from "./analysisView-DxQriOKj.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisInputError, EvidenceFileError, EvidenceIntegrityError, bufferedJsonParts, canonicalJsonParts, err, immutableJsonSnapshotMember, init_analysisErrorCore, init_evidenceErrors, init_immutableJson, init_jsonSerialization, init_result, isImmutableJsonSnapshot, ok } from "./jsonLines-Gf10X4s1.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { init_JsonAuthenticationHeadroom, requireAuthenticationHeadroom } from "./JsonAuthenticationHeadroom-BLfbjzA3.js";
import { init_evidenceBundle, safeParseEvidenceBundle, safeParseImmutableEvidenceBundle } from "./evidenceBundle-DojUFdme.js";
import { init_JsonFiles, readJsonFile, writeTextParts } from "./JsonFiles-CQsLHX3a.js";
import { ANALYSIS_VIEW_PROVIDER, init_investigationProviders } from "./investigationProviders-Bs5C0Q8b.js";
import { init_EvidenceInputResolver, resolveEvidenceInput } from "./EvidenceInputResolver-CYQeiR8K.js";
import { setImmediate } from "node:timers/promises";

//#region dist/process/queuedInterrupts.js
var dispatchQueuedInterrupts;
function init_queuedInterrupts() {
	return (init_queuedInterrupts = __esmMin((() => {
		dispatchQueuedInterrupts = async () => {
			await setImmediate();
			await setImmediate();
		};
	})))();
}

//#endregion
//#region dist/application/EvidenceBundleFiles.js
var readEvidenceBundle, readImmutableEvidenceBundle, readBundle, authenticateEvidenceBundleValue, writeEvidenceBundle;
function init_EvidenceBundleFiles() {
	return (init_EvidenceBundleFiles = __esmMin((() => {
		init_JsonAuthenticationHeadroom();
		init_callerPath();
		init_validationFailure();
		init_evidenceBundle();
		init_evidenceErrors();
		init_result();
		init_analysisErrorCore();
		init_processCaptureParsing();
		init_jsonSerialization();
		init_JsonFiles();
		readEvidenceBundle = (path, signal, resources, operation = "import_evidence_bundle") => readBundle(path, false, signal, resources, operation);
		readImmutableEvidenceBundle = (path, signal, resources, operation = "import_evidence_bundle") => readBundle(path, true, signal, resources, operation);
		readBundle = async (path, immutable, signal, resources, operation = "import_evidence_bundle") => {
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			const loaded = await readJsonFile(path, signal, resources, operation);
			if (!loaded.ok) return loaded;
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			return authenticateEvidenceBundleValue(loaded.value, path, {
				operation,
				immutable
			});
		};
		authenticateEvidenceBundleValue = (value, path, options) => {
			const { operation } = options;
			const headroom = requireAuthenticationHeadroom(value, {
				operation,
				path: absoluteCallerPath(path),
				description: "Insufficient heap headroom to authenticate the Evidence bundle"
			});
			if (!headroom.ok) return headroom;
			const parsed = options.immutable === true ? safeParseImmutableEvidenceBundle(value) : safeParseEvidenceBundle(value);
			if (!parsed.ok) {
				const failure = parsed.error;
				if (failure.kind === "single-record") return err(new EvidenceFileError("read", "wrong-kind", {
					path: absoluteCallerPath(path),
					cause: failure.cause,
					userMessage: failure.message
				}));
				return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
					cause: failure.cause,
					userMessage: failure.message
				}));
			}
			const bundle = parsed.value;
			for (const record of bundle.records) {
				if (record.predicate_type !== "rea.process-capture") continue;
				const parsedCapture = safeParseProcessCapture(record.normalized_result);
				if (!parsedCapture.success) {
					return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
						cause: parsedCapture.error,
						userMessage: `Process capture record ${record.evidence_id} has an invalid normalized_result (${describeValidationFailure(parsedCapture.error)}). Recreate or re-export the bundle, then try again.`
					}));
				}
			}
			return ok(bundle);
		};
		writeEvidenceBundle = async (bundle, path, overwrite, resources, signal, operation = "export_evidence_bundle") => {
			if (signal?.aborted === true) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			const checked = safeParseEvidenceBundle(bundle);
			if (!checked.ok) {
				return err(new EvidenceIntegrityError("Evidence bundle validation failed", { cause: checked.error.cause }));
			}
			return writeTextParts(bufferedJsonParts(canonicalJsonParts(checked.value)), path, overwrite, resources, signal === undefined ? undefined : {
				signal,
				operation
			});
		};
	})))();
}

//#endregion
//#region dist/application/analysisView/evidenceFileSource.js
var selectionError, RECORD_REFERENCE_PREVIEW_BYTES, selectBundleRecord, listRecordIds, readEvidenceFileSource;
function init_evidenceFileSource() {
	return (init_evidenceFileSource = __esmMin((() => {
		init_JsonAuthenticationHeadroom();
		init_EvidenceBundleFiles();
		init_analysisErrorCore();
		init_analysisViewErrors();
		init_result();
		init_evidenceValidation();
		init_evidenceErrors();
		init_inputIssueProjection();
		init_JsonFiles();
		selectionError = (message) => new AnalysisInputError(INSPECT_ANALYSIS_VIEW_OPERATION, { userMessage: message }, [{
			path: ["source", "evidence_id"],
			reason: "invalid_value",
			message
		}]);
		RECORD_REFERENCE_PREVIEW_BYTES = 2048;
		selectBundleRecord = (records, path, evidenceId) => {
			if (evidenceId !== undefined) {
				const selected = records.find((record) => record.evidence_id === evidenceId);
				return selected === undefined ? err(selectionError(`Evidence bundle ${path} holds no record ${evidenceId}. It holds ${listRecordIds(records)}.`)) : ok(selected);
			}
			const only = records[0];
			if (only === undefined) return err(selectionError(`Evidence bundle ${path} holds no records.`));
			if (records.length > 1) return err(selectionError(`Evidence bundle ${path} holds ${String(records.length)} records; select one with source.evidence_id. It holds ${listRecordIds(records)}.`));
			return ok(only);
		};
		listRecordIds = (records) => {
			const labels = [];
			let bytes = 0;
			for (const record of records) {
				const separator = labels.length === 0 ? "" : ", ";
				const remaining = RECORD_REFERENCE_PREVIEW_BYTES - bytes;
				let label = `${record.evidence_id} (operation omitted)`;
				if (record.operation.length <= remaining) {
					const complete = `${record.evidence_id} (${record.operation})`;
					if (Buffer.byteLength(JSON.stringify(separator + complete), "utf8") <= remaining) label = complete;
				}
				const encodedBytes = Buffer.byteLength(JSON.stringify(separator + label), "utf8");
				if (encodedBytes > remaining) break;
				labels.push(label);
				bytes += encodedBytes;
			}
			const omitted = records.length - labels.length;
			const listed = labels.join(", ");
			return omitted > 0 ? `${listed} and ${String(omitted)} more` : listed;
		};
		readEvidenceFileSource = async (path, options = {}, evidenceId) => {
			const { signal, resources } = options;
			const operation = INSPECT_ANALYSIS_VIEW_OPERATION;
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			const loaded = await readJsonFile(path, signal, resources, operation);
			if (!loaded.ok) return loaded;
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
			const value = loaded.value;
			if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.hasOwn(value, "records")) {
				const bundle = authenticateEvidenceBundleValue(value, path, { operation });
				return bundle.ok ? selectBundleRecord(bundle.value.records, path, evidenceId) : bundle;
			}
			const headroom = requireAuthenticationHeadroom(value, {
				operation,
				path,
				description: "Insufficient heap headroom to authenticate the Evidence file"
			});
			if (!headroom.ok) return headroom;
			const parsed = safeParseEvidence(value);
			if (!parsed.ok) return err(new EvidenceFileError("read", "wrong-kind", {
				path,
				cause: parsed.error,
				contentIssues: projectInputIssues(parsed.error.issues, value),
				userMessage: "The selected file does not contain valid Evidence. Repair or recreate the file and try again."
			}));
			if (evidenceId !== undefined && parsed.value.evidence_id !== evidenceId) return err(selectionError(`Evidence file ${path} holds ${parsed.value.evidence_id}, not selected record ${evidenceId}.`));
			return parsed;
		};
	})))();
}

//#endregion
//#region dist/application/analysisView/AnalysisViewService.js
var inspectAnalysisView, inspectFileView, inspectBundleView, inspectAnalysisViewValidated, projectResolvedAnalysisView, requireAnalysisViewRetention, summarizeRetainedAnalysis, projectRetainedAnalysis, resolveAnalysisViewSource, authenticateEvidence, createAnalysisViewEvidence;
function init_AnalysisViewService() {
	return (init_AnalysisViewService = __esmMin((() => {
		init_queuedInterrupts();
		init_EvidenceBundleFiles();
		init_analysisViewErrors();
		init_investigationProviders();
		init_EvidenceInputResolver();
		init_analysisErrorCore();
		init_inputIssueProjection();
		init_evidenceErrors();
		init_evidenceValidation();
		init_evidence();
		init_analysisView();
		init_immutableJson();
		init_result();
		init_evidenceFileSource();
		inspectAnalysisView = async (rawInput, lookup, options = {}) => {
			const parsed = inspectAnalysisViewInputSchema.safeParse(rawInput);
			if (!parsed.success) return err(analysisInputErrorFromIssues(INSPECT_ANALYSIS_VIEW_OPERATION, parsed.error.issues, rawInput, { cause: parsed.error }));
			if (options.evidenceBundlePath !== undefined) return inspectBundleView(parsed.data, options.evidenceBundlePath, options);
			const source = parsed.data.source;
			if (source.kind === "evidence-file") return inspectFileView({
				...parsed.data,
				source
			}, lookup, options);
			return inspectAnalysisViewValidated({
				...parsed.data,
				source
			}, lookup);
		};
		inspectFileView = async (input, lookup, options = {}) => {
			const loaded = await readEvidenceFileSource(input.source.path, options, input.source.evidence_id);
			const cancelled = async () => {
				await setImmediate();
				return options.signal?.aborted === true;
			};
			if (await cancelled()) return err(new AnalysisCancelledError(INSPECT_ANALYSIS_VIEW_OPERATION, { cause: options.signal?.reason }));
			if (!loaded.ok) return loaded;
			const id = loaded.value.evidence_id;
			const projected = inspectAnalysisViewValidated({
				...input,
				source: {
					kind: "retained-evidence",
					evidence_id: id
				}
			}, (evidenceId) => evidenceId === id ? loaded.value : lookup?.(evidenceId));
			if (await cancelled()) return err(new AnalysisCancelledError(INSPECT_ANALYSIS_VIEW_OPERATION, { cause: options.signal?.reason }));
			return projected;
		};
		inspectBundleView = async (input, bundlePath, { resources, signal }) => {
			if (input.source.kind !== "retained-evidence") return err(new AnalysisInputError("inspect_analysis_view", undefined, [{
				path: ["source", "kind"],
				reason: "invalid_value",
				message: "--evidence-bundle requires a retained-evidence source with the exact parent evidence_id; inline Evidence already supplies its source"
			}]));
			const loaded = await readImmutableEvidenceBundle(bundlePath, signal, resources, "inspect_analysis_view");
			await dispatchQueuedInterrupts();
			if (!loaded.ok) return loaded;
			if (signal?.aborted) return err(new AnalysisCancelledError("inspect_analysis_view", { cause: signal.reason }));
			const projected = inspectAnalysisViewValidated({
				source: input.source,
				view: input.view
			}, (id) => loaded.value.records.find((record) => record.evidence_id === id));
			await dispatchQueuedInterrupts();
			if (projected.ok && signal?.aborted) return err(new AnalysisCancelledError("inspect_analysis_view", {
				cause: signal.reason,
				partialObservation: projected.value
			}));
			return projected;
		};
		inspectAnalysisViewValidated = (input, lookup) => {
			const projection = prepareAnalysisViewProjection(input.view);
			if (input.source.kind === "inline") {
				const admitted = projection.admitInlineEvidence(input.source.evidence);
				if (!admitted.ok) return admitted;
			}
			const resolved = resolveAnalysisViewSource(input.source, lookup);
			if (!resolved.ok) return resolved;
			return projectResolvedAnalysisView(input, projection, resolved.value);
		};
		projectResolvedAnalysisView = (input, projection, parent, selectedTarget) => {
			const presentation = selectedTarget === undefined ? parent : rebindEvidenceToTargetPath(parent, selectedTarget);
			const projected = projection.project({
				evidenceId: parent.evidence_id,
				operation: parent.operation,
				provider: parent.provider,
				analysisProfileDigest: parent.analysis_profile?.digest ?? null,
				normalizedResult: immutableJsonSnapshotMember(parent, "normalized_result") ?? parent.normalized_result,
				sealedResult: isImmutableJsonSnapshot(parent),
				subject: presentation.subject,
				limitations: parent.limitations,
				parameters: parent.parameters,
				artifact: presentation.subject === null ? null : {
					path: presentation.subject.local_path,
					sha256: presentation.subject.digest.sha256
				}
			});
			if (!projected.ok) return projected;
			if (parent.subject !== null && parent.subject.digest.sha256 !== projected.value.artifact?.sha256) return err(new EvidenceIntegrityError(`Parent subject SHA-256 ${parent.subject.digest.sha256} differs from analysis artifact SHA-256 ${projected.value.artifact?.sha256 ?? "unknown"}.`));
			return ok(createAnalysisViewEvidence(input, presentation, projected.value));
		};
		requireAnalysisViewRetention = (operation, retention) => {
			if (retention.recordEvidence === undefined || retention.evidenceById === undefined) return err(new AnalysisCapabilityUnavailableError(ANALYSIS_VIEW_PROVIDER.id, operation, "summary detail requires a server session that retains Evidence for later views", { userMessage: "This server does not retain Evidence. Select detail complete to receive the complete analysis inline." }));
			return ok({
				evidenceById: retention.evidenceById,
				recordEvidence: retention.recordEvidence
			});
		};
		summarizeRetainedAnalysis = (evidence, retention) => projectRetainedAnalysis(evidence, retention, { kind: "summary" });
		projectRetainedAnalysis = (evidence, retention, view) => {
			const ready = requireAnalysisViewRetention(evidence.operation, retention);
			if (!ready.ok) return ready;
			const recorded = ready.value.recordEvidence(evidence);
			if (!recorded.ok) return recorded;
			const source = {
				kind: "retained-evidence",
				evidence_id: evidence.evidence_id
			};
			const retained = resolveEvidenceInput(source, ready.value.evidenceById);
			if (!retained.ok) return retained;
			const subject = evidence.subject;
			return projectResolvedAnalysisView({
				source,
				view
			}, prepareAnalysisViewProjection(view), retained.value, subject === null ? undefined : {
				path: subject.local_path,
				sha256: subject.digest.sha256,
				format: subject.format,
				...subject.architecture === null ? {} : { architecture: subject.architecture }
			});
		};
		resolveAnalysisViewSource = (source, lookup) => {
			if (source.kind === "retained-evidence") return resolveEvidenceInput(source, lookup);
			return authenticateEvidence(source.evidence, ["source", "evidence"], { source });
		};
		authenticateEvidence = (value, path, input) => {
			const parsed = safeParseEvidence(value);
			if (parsed.ok) return parsed;
			const cause = parsed.error;
			return err(analysisInputErrorFromIssues(INSPECT_ANALYSIS_VIEW_OPERATION, cause.issues.map((issue) => ({
				...issue,
				path: [...path, ...issue.path]
			})), input, { cause }));
		};
		createAnalysisViewEvidence = (input, parent, result) => {
			const target = parent.subject === null ? undefined : {
				path: parent.subject.local_path,
				sha256: parent.subject.digest.sha256,
				format: parent.subject.format,
				...parent.subject.architecture === null ? {} : { architecture: parent.subject.architecture }
			};
			const nativeFunctionView = result.kind === "native" || result.kind === "summary" && result.parent_operation === "analyze_function" ? result : undefined;
			return createEvidence(target, ANALYSIS_VIEW_PROVIDER, {
				predicateType: "rea.analysis-view",
				operation: INSPECT_ANALYSIS_VIEW_OPERATION,
				parameters: {
					parent_evidence_id: parent.evidence_id,
					view: input.view
				},
				result,
				rawResult: null,
				confidence: result.kind === "environment-state" || result.kind === "environment-coverage" || (result.kind === "api-surface" || result.kind === "environment-manifest") && result.templated_groups > 0 ? "inferred" : "derived",
				authority: parent.authority,
				limitations: result.limitations,
				...nativeFunctionView !== undefined && parent.relationship_coverage !== null ? { relationshipCoverage: parent.relationship_coverage } : {},
				locations: [...result.artifact != null && result.artifact.path.length > 0 ? [{
					kind: "artifact-path",
					path: result.artifact.path
				}] : [], ...nativeFunctionView !== undefined && nativeFunctionView.procedure_address !== null && nativeFunctionView.procedure_address.length > 0 ? [{
					kind: "address",
					address: nativeFunctionView.procedure_address
				}] : []],
				evidenceLinks: [parent.evidence_id]
			}, { immutable: true });
		};
	})))();
}

//#endregion
export { dispatchQueuedInterrupts, init_AnalysisViewService, init_EvidenceBundleFiles, init_queuedInterrupts, inspectAnalysisView, inspectAnalysisViewValidated, projectRetainedAnalysis, readEvidenceBundle, readImmutableEvidenceBundle, requireAnalysisViewRetention, summarizeRetainedAnalysis, writeEvidenceBundle };