import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_artifactInspection, init_evidence, readArtifactInspectionSources, withEvidenceCallerInputPath } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisCancelledError, AnalysisInputError, EvidenceFileError, err, init_analysisErrorCore, init_evidenceErrors, init_jsonValue, init_result, jsonValueSchema, ok } from "./jsonLines-Gf10X4s1.js";
import { absoluteCallerPath, init_callerPath } from "./callerPath-D1wtkHi_.js";
import { dispatchQueuedInterrupts, init_AnalysisViewService, init_EvidenceBundleFiles, init_queuedInterrupts, inspectAnalysisViewValidated, readEvidenceBundle, readImmutableEvidenceBundle, writeEvidenceBundle } from "./AnalysisViewService-Bw-pzZ6V.js";
import { init_JsonAuthenticationHeadroom, requireAuthenticationHeadroom } from "./JsonAuthenticationHeadroom-BLfbjzA3.js";
import { createImmutableEvidenceBundle, init_evidenceBundle } from "./evidenceBundle-DojUFdme.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { compareBundles, init_bundleComparison } from "./toolOutputSchemaGroups-D49U2-8O.js";

//#region dist/application/EvidenceBundleCommands.js
var importEvidenceBundleCommand, exportEvidenceBundleCommand, deliverAnalysisEvidence, publishEvidenceDelivery, persistEvidenceBundleCommand, compareEvidenceBundlesCommand, projectWrite;
function init_EvidenceBundleCommands() {
	return (init_EvidenceBundleCommands = __esmMin((() => {
		init_artifactInspection();
		init_queuedInterrupts();
		init_callerPath();
		init_JsonAuthenticationHeadroom();
		init_evidenceErrors();
		init_analysisErrorCore();
		init_evidence();
		init_evidenceBundle();
		init_jsonValue();
		init_result();
		init_bundleComparison();
		init_ArtifactResourceScope();
		init_EvidenceBundleFiles();
		init_AnalysisViewService();
		importEvidenceBundleCommand = async (path) => {
			const loaded = await readEvidenceBundle(path, undefined, undefined, "import_evidence_bundle");
			if (!loaded.ok) return loaded;
			return ok({
				imported: loaded.value.records.length,
				unknowns_added: loaded.value.unknowns.length,
				total: loaded.value.records.length
			});
		};
		exportEvidenceBundleCommand = async (sourcePath, outputPath, overwrite) => {
			const loaded = await readImmutableEvidenceBundle(sourcePath, undefined, undefined, "export_evidence_bundle");
			if (!loaded.ok) return loaded;
			return projectWrite(loaded.value, await persistEvidenceBundleCommand(loaded.value, outputPath, overwrite));
		};
		deliverAnalysisEvidence = async (evidence, outputPath, detail = "complete", signal) => {
			const headroom = requireAuthenticationHeadroom(evidence, {
				operation: evidence.operation,
				path: absoluteCallerPath(outputPath),
				description: "Insufficient heap headroom to authenticate the complete parent Evidence"
			});
			if (!headroom.ok) return err(headroom.error.retainPartialObservation(evidence));
			const sourceEvidence = evidence.operation === "inspect_artifact" ? readArtifactInspectionSources(evidence.normalized_result) : ok([]);
			if (!sourceEvidence.ok) return err(sourceEvidence.error.retainPartialObservation(evidence));
			const bundle = createImmutableEvidenceBundle([...sourceEvidence.value, evidence]);
			const delivered = detail === "summary" ? inspectAnalysisViewValidated({
				source: {
					kind: "retained-evidence",
					evidence_id: evidence.evidence_id
				},
				view: { kind: "summary" }
			}, (id) => bundle.records.find((record) => record.evidence_id === id)) : ok(evidence);
			if (!delivered.ok) return delivered;
			const selected = detail === "summary" && evidence.caller_input_path !== undefined ? withEvidenceCallerInputPath(delivered.value, evidence.caller_input_path) : delivered.value;
			const published = await publishEvidenceDelivery({
				bundle,
				complete: evidence,
				delivered: selected,
				outputPath,
				operation: evidence.operation,
				signal
			});
			return published.ok ? ok(published.value.delivered) : published;
		};
		publishEvidenceDelivery = async (input) => {
			const { signal, operation } = input;
			const written = await persistEvidenceBundleCommand(input.bundle, input.outputPath, false, signal, operation);
			await dispatchQueuedInterrupts();
			if (!written.ok) {
				const original = written.error;
				const failure = original instanceof EvidenceFileError && original.reason === "exists" ? new EvidenceFileError(original.operation, original.reason, {
					cause: original,
					...original.path === undefined ? {} : { path: original.path },
					userMessage: "Evidence file already exists. Choose another output path.",
					cleanup: original.cleanup,
					diagnostics: original.diagnostics
				}).bindCleanupDependencies([original]) : original;
				return err(failure.retainPartialObservation(input.complete));
			}
			if (signal?.aborted) return err(new AnalysisCancelledError(operation, {
				cause: signal.reason,
				partialObservation: input.delivered,
				diagnostics: { evidence_bundle: { ...written.value } }
			}));
			return ok({
				delivered: input.delivered,
				evidenceBundle: written.value
			});
		};
		persistEvidenceBundleCommand = async (bundle, outputPath, overwrite, signal, operation) => {
			const resources = new ArtifactResourceScope();
			const written = await writeEvidenceBundle(bundle, outputPath, overwrite, resources, signal, operation);
			if (written.ok) return written;
			await resources.close().catch(() => undefined);
			if (!written.error.cleanupIncomplete && written.error instanceof EvidenceFileError && written.error.published) {
				return ok(written.error.published);
			}
			return written;
		};
		compareEvidenceBundlesCommand = async (input) => {
			const [left, right] = await Promise.all([readImmutableEvidenceBundle(input.leftPath, undefined, undefined, "compare_bundles"), readImmutableEvidenceBundle(input.rightPath, undefined, undefined, "compare_bundles")]);
			if (!left.ok) return left;
			if (!right.ok) return right;
			try {
				return ok(jsonValueSchema.parse(compareBundles(left.value, right.value, input.recordPairs)));
			} catch (cause) {
				if (cause instanceof AnalysisInputError) return err(cause);
				throw cause;
			}
		};
		projectWrite = (bundle, written) => written.ok ? ok({
			path: written.value.path,
			bytes: written.value.bytes,
			records: bundle.records.length
		}) : err(written.error);
	})))();
}

//#endregion
export { compareEvidenceBundlesCommand, deliverAnalysisEvidence, exportEvidenceBundleCommand, importEvidenceBundleCommand, init_EvidenceBundleCommands, publishEvidenceDelivery };