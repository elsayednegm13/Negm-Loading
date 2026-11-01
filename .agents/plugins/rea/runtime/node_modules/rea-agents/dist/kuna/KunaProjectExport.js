import { createReadStream } from "node:fs";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisArtifactChangedError, AnalysisCancelledError, } from "../domain/analysisErrorCore.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { err, ok } from "../domain/result.js";
import { hashStableFile, StableFileHashFailure, } from "../filesystem/StableFileHash.js";
import { prepareProcessOwnershipInspection } from "../process/ProcessOwnershipObservation.js";
import { copyAndHash, KUNA_INVENTORY_OUTPUT_BYTES, kunaFileCleanupError, runKunaCommand, } from "./KunaCommand.js";
import { kunaProjectDeadline } from "./KunaConfiguration.js";
import { KUNA_DIAGNOSTIC_BYTES } from "./KunaLimits.js";
import { parseKunaExportSummary, parseKunaInventory, scanKunaProjectSource, } from "./KunaProjectFiles.js";
import { KUNA_PROVIDER_ID } from "./KunaRelease.js";
import { RegularFileCleanupFailure, regularFileCancellation, } from "../filesystem/OwnedRegularFile.js";
/** Operation name every export and cache failure reports. */
export const KUNA_EXPORT_OPERATION = "kuna:decompile-project";
const INVENTORY_FILE = "functions.json";
const message = (cause) => cause instanceof Error ? cause.message : String(cause);
const isMissing = (cause) => cause instanceof Error &&
    "code" in cause &&
    (cause.code === "ENOENT" || cause.code === "ENOTDIR");
/** Map an unexpected failure to a typed one, preferring cancellation. */
export const kunaExportFailure = (cause, signal) => {
    if (cause instanceof RegularFileCleanupFailure)
        return kunaFileCleanupError(cause, KUNA_EXPORT_OPERATION);
    const cancellation = regularFileCancellation(cause);
    if (cancellation !== undefined)
        return new AnalysisCancelledError(KUNA_EXPORT_OPERATION, {
            cause: cancellation.reason,
        });
    if (cause instanceof AnalysisError)
        return cause;
    if (!(cause instanceof StableFileHashFailure) && signal?.aborted === true)
        return new AnalysisCancelledError(KUNA_EXPORT_OPERATION, { cause });
    return new ProviderAdapterError(KUNA_PROVIDER_ID, KUNA_EXPORT_OPERATION, {
        cause,
        userMessage: `Kuna project cache failed: ${message(cause)}`,
    });
};
const unusable = (reason) => ({
    kind: "done",
    result: err(new ProviderAdapterError(KUNA_PROVIDER_ID, KUNA_EXPORT_OPERATION, {
        userMessage: `Kuna's project export is not usable: ${reason}`,
    })),
});
/** Verify the selected installation at each execution and publication boundary. */
const verifyKunaExecutable = async (installation, signal, retainFailedFileClose) => {
    const executable = await hashStableFile(installation.executable, {
        signal,
        retainFailedClose: (owner) => retainFailedFileClose(owner, installation.executable),
    });
    if (executable.sha256 === installation.sha256)
        return ok(null);
    return err(new ProviderAdapterError(KUNA_PROVIDER_ID, KUNA_EXPORT_OPERATION, {
        userMessage: `${installation.executable} changed after readiness inspection; reopen the target so REA probes the current Kuna executable.`,
        diagnostics: {
            expected_sha256: installation.sha256,
            observed_sha256: executable.sha256,
        },
    }));
};
/**
 * Inventory and export one target with Kuna, then validate the result.
 *
 * Kuna runs on a copy hashed while copying, so the export always describes
 * the digest the caller selected. Both Kuna runs share one deadline.
 */
export const exportKunaProject = async (request) => {
    const { installation, signal } = request;
    const { configuration } = installation;
    const deadline = Date.now() + configuration.projectTimeoutMs;
    const input = join(request.workspace, "input", basename(request.targetPath));
    await mkdir(join(request.workspace, "input"), { mode: 0o700 });
    await mkdir(request.output, { recursive: true, mode: 0o700 });
    const copied = await copyAndHash(request.targetPath, input, signal);
    if (copied !== request.targetSha256)
        return {
            kind: "done",
            result: err(new AnalysisArtifactChangedError(KUNA_EXPORT_OPERATION, request.targetPath, "the target no longer matches the digest selected for analysis")),
        };
    await prepareProcessOwnershipInspection(signal);
    const run = async (arguments_, outputBytes) => {
        const outcome = await runKunaCommand({
            installation,
            arguments: arguments_,
            workspace: request.workspace,
            operation: KUNA_EXPORT_OPERATION,
            timeoutMs: deadline - Date.now(),
            deadline: kunaProjectDeadline(configuration),
            outputBytes,
            signal,
            launcher: request.launcher,
            retainFailedFileClose: request.retainFailedFileClose,
        });
        if (outcome.kind === "ok")
            return { ok: true, snapshot: outcome.snapshot };
        return {
            ok: false,
            outcome: outcome.kind === "retained"
                ? {
                    kind: "retained",
                    error: outcome.error,
                    owner: outcome.owner,
                }
                : {
                    kind: "done",
                    result: err(outcome.error),
                    ...(outcome.fileCleanupFailure === undefined
                        ? {}
                        : { fileCleanupFailure: outcome.fileCleanupFailure }),
                },
        };
    };
    request.onStatus({ phase: "inventory", inventory: null });
    const listed = await run(["functions", input, "--json"], KUNA_INVENTORY_OUTPUT_BYTES);
    if (!listed.ok)
        return listed.outcome;
    const inventory = parseKunaInventory(listed.snapshot.stdout.text);
    if (!inventory.ok)
        return unusable(inventory.error);
    if (listed.snapshot.stdout.invalidUtf8 === true)
        return unusable("the function inventory is not valid UTF-8");
    await writeFile(join(request.output, INVENTORY_FILE), listed.snapshot.stdout.text, { mode: 0o600 });
    request.onStatus({ phase: "decompiling", inventory: inventory.value });
    const exported = await run([
        "decompile-project",
        input,
        "-o",
        request.output,
        "--jobs",
        String(configuration.jobs),
    ], 
    // Kuna prints one summary line per export on stdout.
    KUNA_DIAGNOSTIC_BYTES);
    if (!exported.ok)
        return exported.outcome;
    request.onStatus({ phase: "sealing", inventory: inventory.value });
    const summary = parseKunaExportSummary(exported.snapshot.stdout.text);
    if (summary === undefined)
        return unusable("Kuna did not print its `functions: N ok, M failed` summary.");
    const stem = basename(request.targetPath);
    const names = {
        c: `${stem}.c`,
        h: `${stem}.h`,
        asm: `${stem}.asm`,
        readme: "README.md",
        inventory: INVENTORY_FILE,
    };
    const files = {};
    for (const [role, name] of Object.entries(names)) {
        const path = join(request.output, name);
        const status = await lstat(path).catch((cause) => {
            if (isMissing(cause))
                return undefined;
            throw cause;
        });
        if (status === undefined || !status.isFile())
            return unusable(`Kuna's export has no regular ${name}.`);
        files[role] = {
            path: name,
            ...(await hashStableFile(path, {
                signal,
                retainFailedClose: (owner) => request.retainFailedFileClose(owner, path),
            })),
        };
    }
    const complete = files;
    const functions = await readKunaExportSource(request.output, complete.c, summary, signal);
    if (!functions.ok)
        return unusable(functions.error);
    const identity = await verifyKunaExecutable(installation, signal, request.retainFailedFileClose);
    if (!identity.ok)
        return { kind: "done", result: identity };
    // `functions.json` holds exactly the text this inventory was parsed from, so
    // publishing reuses it rather than holding a second parsed copy.
    return {
        kind: "done",
        result: ok({
            files: complete,
            summary,
            functions: functions.value,
            inventory: inventory.value,
        }),
    };
};
/** Split an export's `.c` into its function blocks without buffering the file. */
const readKunaExportSource = (directory, file, summary, signal) => scanKunaProjectSource(createReadStream(join(directory, file.path), signal === undefined ? {} : { signal }), summary);
/** Parse a published export's function blocks and inventory from its own files. */
export const readKunaExport = async (directory, files, summary, signal) => {
    const functions = await readKunaExportSource(directory, files.c, summary, signal);
    if (!functions.ok)
        return functions;
    const inventory = parseKunaInventory(await readFile(join(directory, files.inventory.path), {
        encoding: "utf8",
        ...(signal === undefined ? {} : { signal }),
    }));
    if (!inventory.ok)
        return inventory;
    return ok({ functions: functions.value, inventory: inventory.value });
};
