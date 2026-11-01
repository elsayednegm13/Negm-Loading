import { setImmediate } from "node:timers/promises";
import { prepareSnapshotEntry, parsePreparedAnalysisSnapshot, serializeAnalysisSnapshot, } from "../../domain/analysisSnapshot.js";
import { EvidenceFileError, EvidenceIntegrityError, } from "../../domain/evidenceErrors.js";
import { err, ok } from "../../domain/result.js";
import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
import { readJsonObjectMembersFile, writeTextFile } from "../JsonFiles.js";
const READ_OPERATION = "open_binary";
/** Read and validate an analysis snapshot from the caller's path. */
export const readAnalysisSnapshot = async (path, signal, resources) => {
    const entries = snapshotEntryReader("provider");
    const workflows = snapshotEntryReader("workflow");
    const header = {};
    const metadata = new Map(["target", "binding", "evidence_bundle"].map((name) => [
        name,
        {
            mode: "value",
            begin: () => {
                delete header[name];
            },
            accept: (value) => {
                header[name] = value;
            },
            reject: (cause) => {
                throw cause;
            },
        },
    ]));
    try {
        const loaded = await readJsonObjectMembersFile(path, [
            new Map([
                ["entries", entries.reader],
                ["workflow_entries", workflows.reader],
            ]),
            metadata,
        ], signal, resources, READ_OPERATION);
        if (!loaded.ok)
            return loaded;
        signal?.throwIfAborted();
        const snapshot = parsePreparedAnalysisSnapshot(header, entries.finish(), workflows.finish());
        // Deliver queued cancellation before handing a complete cache to the session.
        await setImmediate();
        signal?.throwIfAborted();
        return ok(snapshot);
    }
    catch (cause) {
        if (signal?.aborted === true)
            return err(new AnalysisCancelledError(READ_OPERATION, { cause: signal.reason }));
        return err(new EvidenceIntegrityError(snapshotValidationMessage(cause), { cause }));
    }
};
const snapshotEntryReader = (kind) => {
    let seen = false;
    let entries = [];
    let failure;
    const reader = {
        mode: "array",
        begin: () => {
            seen = true;
            entries = [];
            failure = undefined;
        },
        accept: (value) => {
            if (failure === undefined)
                entries.push(prepareSnapshotEntry(value, kind));
        },
        reject: (cause) => {
            failure ??= { cause };
        },
    };
    return {
        reader,
        finish: () => {
            if (!seen)
                throw new TypeError(`Analysis snapshot ${kind === "provider" ? "entries" : "workflow_entries"} is missing`);
            if (failure !== undefined)
                throw failure.cause;
            return entries;
        },
    };
};
/** Atomically write a deterministic analysis snapshot to the caller's path. */
export const writeAnalysisSnapshot = async (snapshot, path, overwrite, resources) => {
    let encoded;
    try {
        encoded = serializeAnalysisSnapshot(snapshot);
    }
    catch (cause) {
        return err(new EvidenceIntegrityError(snapshotValidationMessage(cause), { cause }));
    }
    return writeTextFile(encoded, path, overwrite, resources);
};
const snapshotValidationMessage = (cause) => cause instanceof TypeError
    ? cause.message
    : "Analysis snapshot validation failed";
