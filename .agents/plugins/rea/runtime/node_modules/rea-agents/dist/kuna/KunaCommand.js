import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { AnalysisCancelledError, AnalysisResourceConstraintError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { bindArtifactFileCleanup } from "../artifacts/ArtifactFileOperation.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { OwnedCommandFailure, runOwnedCommand, } from "../process/OwnedCommand.js";
import { hashStableFile } from "../filesystem/StableFileHash.js";
import { RegularFileCleanupFailure, regularFileCancellation, } from "../filesystem/OwnedRegularFile.js";
import { kunaChildEnvironment, kunaInstallationFailureDiagnostics, } from "./KunaInstallation.js";
import { KUNA_PROVIDER_ID } from "./KunaRelease.js";
/**
 * `kuna functions --json` costs ~210 bytes per function; this admits about
 * 600,000 functions, above the 392,814 of the largest image Kuna documents.
 */
export const KUNA_INVENTORY_OUTPUT_BYTES = 128 * 1024 * 1024;
const message = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Preserve the operation's typed failure while attaching descriptor cleanup. */
export const kunaFileCleanupError = (failure, operation) => {
    const diagnostics = kunaInstallationFailureDiagnostics(failure);
    const cancellation = regularFileCancellation(failure);
    if (cancellation !== undefined)
        return new AnalysisCancelledError(operation, {
            cause: cancellation.reason,
            diagnostics,
            cleanup: {
                reason: message(failure.cleanupCause),
                resources: [failure.path],
            },
        });
    const cleanup = new ProviderCleanupError(KUNA_PROVIDER_ID, [failure.path], { reason: message(failure.cleanupCause), ...diagnostics }, { cause: failure, operation });
    if (failure.outcome.kind === "completed")
        return cleanup;
    const primaryCause = failure.outcome.cause;
    const primary = primaryCause instanceof AnalysisError
        ? primaryCause
        : new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
            cause: primaryCause,
            diagnostics,
            userMessage: `Kuna ${operation} failed: ${message(primaryCause)}`,
        });
    return analysisErrorWithCleanupFailure(primary, cleanup, operation);
};
/** Preserve the exact retryable resources when an inspection admission retries them. */
export const kunaRetainedResourceCleanupError = (cause, operation) => {
    if (!(cause instanceof ArtifactReaderFailure) ||
        cause.cleanupLeases === undefined ||
        cause.cleanupLeases.length === 0)
        return undefined;
    const cleanup = new ProviderCleanupError(KUNA_PROVIDER_ID, cause.cleanup?.resources ?? [], { reason: message(cause) }, { cause, operation });
    bindArtifactFileCleanup(cause, cleanup);
    return cleanup;
};
/** File metadata that, unchanged, lets a verified digest stand without re-hashing. */
const verifiedExecutables = new Map();
/**
 * Confirm the executable still has the digest its analysis profile committed,
 * so no answer names one Kuna build while another produced it.
 */
const verifyExecutable = async (installation, signal, retainFailedFileClose) => {
    const status = await stat(installation.executable, { bigint: true });
    const identity = [
        status.dev,
        status.ino,
        status.size,
        status.mtimeNs,
        status.ctimeNs,
    ].join(":");
    const known = verifiedExecutables.get(installation.executable);
    let sha256 = known?.identity === identity ? known.sha256 : undefined;
    if (sha256 === undefined) {
        sha256 = (await hashStableFile(installation.executable, {
            signal,
            retainFailedClose: (owner) => retainFailedFileClose(owner, installation.executable),
        })).sha256;
        verifiedExecutables.set(installation.executable, { identity, sha256 });
    }
    return sha256 === installation.sha256 ? undefined : sha256;
};
/** Run Kuna under an owned process group with REA's environment and limits. */
export const runKunaCommand = async (request) => {
    const { installation } = request;
    try {
        const changed = await verifyExecutable(installation, request.signal, request.retainFailedFileClose);
        if (changed !== undefined)
            return {
                kind: "failed",
                error: new ProviderAdapterError(KUNA_PROVIDER_ID, request.operation, {
                    userMessage: `${installation.executable} changed after this target was opened; reopen the target so REA probes the current Kuna executable.`,
                    diagnostics: {
                        expected_sha256: installation.sha256,
                        observed_sha256: changed,
                    },
                }),
            };
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure) {
            return {
                kind: "failed",
                error: kunaFileCleanupError(cause, request.operation),
                fileCleanupFailure: cause,
            };
        }
        const cancellation = regularFileCancellation(cause);
        return {
            kind: "failed",
            error: cancellation !== undefined
                ? new AnalysisCancelledError(request.operation, {
                    cause: cancellation.reason,
                })
                : new ProviderAdapterError(KUNA_PROVIDER_ID, request.operation, {
                    cause,
                    userMessage: `Cannot verify ${installation.executable}: ${message(cause)}`,
                }),
        };
    }
    try {
        const snapshot = await runOwnedCommand({
            command: installation.executable,
            arguments: request.arguments,
            runId: `rea-kuna-${randomUUID()}`,
            // A script's process reports its interpreter, not the configured path.
            ...(installation.script ? { expectedCommand: null } : {}),
            cwd: request.workspace,
            hostEnvironment: kunaChildEnvironment(installation.configuration),
            env: { TMPDIR: request.workspace },
        }, {
            timeoutMs: Math.max(1, request.timeoutMs),
            diagnosticBytes: request.outputBytes,
            ...(request.stdout === undefined ? {} : { stdout: request.stdout }),
        }, {
            signal: request.signal,
            ...(request.launcher === undefined
                ? {}
                : { launcher: request.launcher }),
        });
        return { kind: "ok", snapshot };
    }
    catch (cause) {
        return commandFailure(cause, request);
    }
};
/** Copy a file and return the SHA-256 of exactly the bytes copied. */
export const copyAndHash = async (source, destination, signal) => {
    const hash = createHash("sha256");
    await pipeline(createReadStream(source), new Transform({
        transform(chunk, _encoding, callback) {
            hash.update(chunk);
            callback(null, chunk);
        },
    }), createWriteStream(destination, { flags: "wx", mode: 0o600 }), { signal });
    return hash.digest("hex");
};
/** Map an owned-command failure to its typed error, keeping unproven cleanup owned. */
const commandFailure = (cause, request) => {
    const { operation } = request;
    const subcommand = request.arguments[0] ?? "";
    if (!(cause instanceof OwnedCommandFailure))
        return {
            kind: "failed",
            error: new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
                cause,
                userMessage: `Cannot run ${request.installation.executable}: ${message(cause)}`,
            }),
        };
    const snapshot = cause.snapshot;
    const capturedOutput = snapshot === null
        ? undefined
        : {
            // Output can be evidence-sized, not diagnostic-sized; keep only its
            // tail. Output that overflowed its buffer is a cut-off document
            // whose tail explains nothing, so none of it is kept.
            stdout: cause.reason === "output-limit"
                ? ""
                : snapshot.stdout.text.slice(-4096),
            stderr: snapshot.stderr.text,
            truncated: snapshot.diagnosticTruncated === true ||
                snapshot.outputIncomplete === true ||
                snapshot.stdout.text.length > 4096,
            exit_code: snapshot.exitCode ?? null,
            signal: snapshot.signal ?? null,
        };
    const details = {
        cause,
        ...(capturedOutput === undefined ? {} : { capturedOutput }),
    };
    let primary;
    if (cause.reason === "cancelled")
        primary = new AnalysisCancelledError(operation, {
            ...details,
            cause: cause.cancellation?.reason,
        });
    else if (cause.reason === "timeout") {
        const { setting, ms } = request.deadline;
        primary = new AnalysisTimeoutError(operation, ms, {
            ...details,
            userMessage: `kuna ${subcommand} did not finish within ${setting} (${String(ms)} ms).`,
            // The same run takes as long again, so only a longer deadline helps.
            remediationAction: `Raise ${setting} in the environment that starts REA, then restart REA; it reads Kuna settings when it starts.${subcommand === "decompile"
                ? " Within a session, pseudocode is also read from the project export once it finishes."
                : ""}`,
        });
    }
    // The same input overflows the same fixed buffer; waiting cannot help.
    else if (cause.reason === "output-limit")
        primary = new AnalysisResourceConstraintError(operation, "memory", `kuna ${subcommand} wrote more than ${String(request.outputBytes)} bytes of output.`, { output_limit_bytes: request.outputBytes }, {
            ...details,
            remediationAction: `REA buffers at most ${String(request.outputBytes)} bytes of kuna ${subcommand} output, so repeating this request for this target fails the same way. Use another provider for it.`,
        });
    else {
        const exitCode = capturedOutput?.exit_code;
        primary = new ProviderAdapterError(KUNA_PROVIDER_ID, operation, {
            ...details,
            userMessage: `kuna ${subcommand} failed${exitCode === undefined || exitCode === null ? "" : ` with exit code ${String(exitCode)}`}: ${capturedOutput?.stderr.trim().split("\n").at(-1) || cause.message}`,
        });
    }
    if (cause.cleanupFailure !== null)
        return {
            kind: "retained",
            processResources: cause.resources,
            error: new ProviderCleanupError(KUNA_PROVIDER_ID, [...cause.resources, request.workspace], { reason: cause.cleanupFailure }, { ...details, operation, cleanupPrimary: primary }),
            owner: cause.cleanupOwner,
        };
    return { kind: "failed", error: primary };
};
