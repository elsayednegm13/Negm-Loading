import { requireAuthenticationHeadroom } from "./JsonAuthenticationHeadroom.js";
import { absoluteCallerPath } from "../filesystem/callerPath.js";
import { describeValidationFailure } from "../domain/validationFailure.js";
import { safeParseImmutableEvidenceBundle, safeParseEvidenceBundle, } from "../domain/evidenceBundle.js";
import { EvidenceFileError, EvidenceIntegrityError, } from "../domain/evidenceErrors.js";
import { err, ok } from "../domain/result.js";
import { AnalysisCancelledError, } from "../domain/analysisErrorCore.js";
import { safeParseProcessCapture } from "../domain/process/processCaptureParsing.js";
import { bufferedJsonParts, canonicalJsonParts, } from "../domain/jsonSerialization.js";
import { readJsonFile, writeTextParts } from "./JsonFiles.js";
/** Read and validate an evidence bundle at the caller-supplied path. */
export const readEvidenceBundle = (path, signal, resources, operation = "import_evidence_bundle") => readBundle(path, false, signal, resources, operation);
/** Read an authenticated immutable snapshot for a subsequent session import. */
export const readImmutableEvidenceBundle = (path, signal, resources, operation = "import_evidence_bundle") => readBundle(path, true, signal, resources, operation);
const readBundle = async (path, immutable, signal, resources, operation = "import_evidence_bundle") => {
    if (signal?.aborted)
        return err(new AnalysisCancelledError(operation, {
            cause: signal.reason,
        }));
    const loaded = await readJsonFile(path, signal, resources, operation);
    if (!loaded.ok)
        return loaded;
    if (signal?.aborted)
        return err(new AnalysisCancelledError(operation, {
            cause: signal.reason,
        }));
    return authenticateEvidenceBundleValue(loaded.value, path, {
        operation,
        immutable,
    });
};
/** Authenticate a loaded bundle once, preserving file-reader failure and process-capture semantics. */
export const authenticateEvidenceBundleValue = (value, path, options) => {
    const { operation } = options;
    const headroom = requireAuthenticationHeadroom(value, {
        operation,
        path: absoluteCallerPath(path),
        description: "Insufficient heap headroom to authenticate the Evidence bundle",
    });
    if (!headroom.ok)
        return headroom;
    const parsed = options.immutable === true
        ? safeParseImmutableEvidenceBundle(value)
        : safeParseEvidenceBundle(value);
    if (!parsed.ok) {
        const failure = parsed.error;
        if (failure.kind === "single-record")
            return err(new EvidenceFileError("read", "wrong-kind", {
                path: absoluteCallerPath(path),
                cause: failure.cause,
                userMessage: failure.message,
            }));
        return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
            cause: failure.cause,
            userMessage: failure.message,
        }));
    }
    const bundle = parsed.value;
    for (const record of bundle.records) {
        if (record.predicate_type !== "rea.process-capture")
            continue;
        const parsedCapture = safeParseProcessCapture(record.normalized_result);
        if (!parsedCapture.success) {
            return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
                cause: parsedCapture.error,
                userMessage: `Process capture record ${record.evidence_id} has an invalid normalized_result (${describeValidationFailure(parsedCapture.error)}). Recreate or re-export the bundle, then try again.`,
            }));
        }
    }
    return ok(bundle);
};
/** Atomically write deterministic evidence JSON at the caller-supplied path. */
export const writeEvidenceBundle = async (bundle, path, overwrite, resources, signal, operation = "export_evidence_bundle") => {
    if (signal?.aborted === true)
        return err(new AnalysisCancelledError(operation, {
            cause: signal.reason,
        }));
    const checked = safeParseEvidenceBundle(bundle);
    if (!checked.ok) {
        return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
            cause: checked.error.cause,
        }));
    }
    return writeTextParts(bufferedJsonParts(canonicalJsonParts(checked.value)), path, overwrite, resources, signal === undefined ? undefined : { signal, operation });
};
