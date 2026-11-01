import { assertRegularFileActive, RegularFileOperationCancelled, } from "../filesystem/RegularFile.js";
import { constants } from "node:fs";
import { randomUUID } from "node:crypto";
import { access, realpath, stat } from "node:fs/promises";
import { join } from "node:path";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { hashStableFile, observeStableFile, stableFileHashCause, } from "../filesystem/StableFileHash.js";
import { RegularFileCleanupFailure, RegularFileCancelled, regularFileCancellation, } from "../filesystem/OwnedRegularFile.js";
import { OwnedCommandFailure, runOwnedCommand, } from "../process/OwnedCommand.js";
import { retainOwnedCommandCleanup } from "../providers/OwnedCommandCleanup.js";
import { readKunaConfiguration, } from "./KunaConfiguration.js";
import { KUNA_COMMAND_REMEDIATION, KUNA_VERIFIED_VERSION, KUNA_VERSION_PROBE_REMEDIATION, } from "./KunaRelease.js";
/** `kuna --version` exits before loading specs or an input; it needs no budget beyond this. */
const VERSION_PROBE_TIMEOUT_MS = 10_000;
const VERSION_PROBE_MAX_OUTPUT_BYTES = 64 * 1024;
/** Release CI prints exactly `kuna <MAJOR.MINOR>`; source builds print the Cargo version. */
const VERSION_LINE = /^kuna (\d+\.\d+(?:\.\d+)?)\r?\n?$/u;
const versionProbeOutput = (snapshot) => ({
    stdout: snapshot?.stdout.text ?? "",
    stderr: snapshot?.stderr.text ?? "",
    exitCode: snapshot?.exitCode ?? null,
    signal: snapshot?.signal ?? null,
    stdoutBytes: snapshot?.stdout.bytes ?? 0,
    stdoutObservedBytes: snapshot?.stdout.observedBytes ?? 0,
    stderrBytes: snapshot?.stderr.bytes ?? 0,
    stderrObservedBytes: snapshot?.stderr.observedBytes ?? 0,
    stdoutInvalidUtf8: snapshot?.stdout.invalidUtf8 === true,
    stderrInvalidUtf8: snapshot?.stderr.invalidUtf8 === true,
    diagnosticTruncated: snapshot?.diagnosticTruncated === true,
    outputIncomplete: snapshot?.outputIncomplete === true,
    truncated: snapshot?.diagnosticTruncated === true ||
        snapshot?.outputIncomplete === true ||
        (snapshot !== null &&
            snapshot !== undefined &&
            snapshot.stdout.bytes < snapshot.stdout.observedBytes),
});
const versionProbeOutputDiagnostics = (output) => ({
    stdout: output.stdout,
    stderr: output.stderr,
    exit_code: output.exitCode,
    signal: output.signal,
    stdout_bytes: output.stdoutBytes,
    stdout_observed_bytes: output.stdoutObservedBytes,
    stderr_bytes: output.stderrBytes,
    stderr_observed_bytes: output.stderrObservedBytes,
    ...(output.stdoutInvalidUtf8 ? { stdout_invalid_utf8: true } : {}),
    ...(output.stderrInvalidUtf8 ? { stderr_invalid_utf8: true } : {}),
    diagnostic_truncated: output.diagnosticTruncated,
    output_incomplete: output.outputIncomplete,
    output_truncated: output.truncated,
});
// Annotations follow the exact failure's lifetime. Descriptor ownership stays
// with the supplied resource scope, independently of this weak metadata.
const installationFailureDiagnostics = new WeakMap();
export const kunaInstallationFailureDiagnostics = (cause) => cause instanceof Error
    ? installationFailureDiagnostics.get(cause)
    : undefined;
/** Consumers project the owner's facts without reinterpreting generic file outcomes. */
export const kunaInstallationCancellation = (cause) => {
    const cancellation = regularFileCancellation(cause);
    if (cancellation === undefined)
        return undefined;
    const diagnostics = kunaInstallationFailureDiagnostics(cause);
    return {
        reason: cancellation.reason,
        ...(diagnostics === undefined ? {} : { diagnostics }),
    };
};
/** Adapt retained resource owners into leases and bind errors to exact owners. */
export const createKunaResourceScope = (parent) => {
    const leases = new Map();
    const pendingLeases = () => [...leases.values()]
        .map(({ lease }) => lease)
        .filter((lease) => !lease.released);
    const bindPendingFailure = (error) => {
        const retained = pendingLeases();
        if (retained.length > 0)
            new AnalysisCleanupLeaseGroup(error, retained);
    };
    const cleanupResources = (pending = pendingLeases()) => {
        if (pending.some((lease) => lease.cleanupResources === undefined))
            return undefined;
        return [
            ...new Set(pending.flatMap((lease) => lease.cleanupResources ?? [])),
        ];
    };
    return {
        get hasPending() {
            return pendingLeases().length > 0;
        },
        get cleanupResources() {
            return cleanupResources();
        },
        installationCancellationError: (cause, operation) => {
            const cancellation = kunaInstallationCancellation(cause);
            if (cancellation === undefined)
                return undefined;
            const pending = pendingLeases();
            const error = new AnalysisCancelledError(operation, {
                cause: cancellation.reason,
                diagnostics: cancellation.diagnostics,
                ...(pending.length === 0
                    ? {}
                    : {
                        cleanup: {
                            reason: "Kuna version-probe process cleanup is unconfirmed.",
                            resources: cleanupResources(pending) ?? [],
                        },
                    }),
            });
            bindPendingFailure(error);
            return error;
        },
        owner: {
            retain: (owner, resource) => {
                const lease = AnalysisCleanupLease.forCloseOwner(owner, resource);
                leases.set(owner, { lease });
                parent.retain({
                    close: () => lease.release(),
                    get cleanupResources() {
                        return lease.cleanupResources;
                    },
                }, resource);
            },
            run: (operation) => parent.run(operation),
        },
        bindFailure: (failure, error) => {
            if (leases.has(failure.owner))
                bindPendingFailure(error);
        },
        bindRetainedFailure: bindPendingFailure,
    };
};
/**
 * Environment for every Kuna child. Kuna unpacks its built-in SLEIGH tree into
 * the per-user cache under HOME (macOS) or XDG_CACHE_HOME (Linux), so both
 * point inside REA's own cache root instead of the user's.
 */
export const kunaChildEnvironment = (configuration) => {
    const home = join(configuration.cacheRoot, "home");
    return {
        HOME: home,
        XDG_CACHE_HOME: join(home, ".cache"),
        NO_COLOR: "1",
    };
};
const failure = (code, reason, diagnostics) => err({ code, reason, diagnostics });
const message = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Keep completed file facts attached when cancellation or close failure interrupts inspection. */
const recordPartialInstallationFileOperation = (cause, facts) => {
    const cancellation = regularFileCancellation(cause);
    if (!(cause instanceof Error) ||
        (!(cause instanceof RegularFileCleanupFailure) &&
            cancellation === undefined))
        return false;
    const outcome = cause instanceof RegularFileCancelled ||
        cause instanceof RegularFileCleanupFailure
        ? cause.outcome
        : undefined;
    const completed = outcome?.kind === "completed" ? outcome.value : undefined;
    const completedRecord = completed !== null &&
        typeof completed === "object" &&
        !Array.isArray(completed)
        ? completed
        : undefined;
    const completedFingerprint = facts.observed.phase === "fingerprint"
        ? completed
        : completedRecord === undefined
            ? undefined
            : {
                sha256: completedRecord["sha256"],
                bytes: completedRecord["bytes"],
            };
    const completedHash = facts.observed.completedHash ??
        (outcome?.kind === "completed" && completedFingerprint !== undefined
            ? jsonValueSchema.parse(completedFingerprint)
            : undefined);
    const completedScript = facts.observed.script ??
        (facts.observed.phase === "identity" &&
            Buffer.isBuffer(completedRecord?.["prefix"])
            ? completedRecord["prefix"].toString("latin1") === "#!"
            : undefined);
    installationFailureDiagnostics.set(cause, {
        kuna_installation: {
            status: "partial",
            command: facts.command,
            executable: facts.executable,
            ...(facts.version === undefined
                ? {}
                : {
                    version: facts.version,
                    verified: facts.version === KUNA_VERIFIED_VERSION,
                }),
            ...(completedHash === undefined ? {} : { completed_hash: completedHash }),
            ...(completedScript === undefined ? {} : { script: completedScript }),
            ...(facts.observed.beforeProbeFingerprint === undefined
                ? {}
                : {
                    before_probe_sha256: facts.observed.beforeProbeFingerprint.sha256,
                    before_probe_bytes: facts.observed.beforeProbeFingerprint.bytes,
                }),
        },
        ...(facts.observed.probe === undefined
            ? {}
            : {
                kuna_version_probe: {
                    status: "completed",
                    deadline_ms: facts.observed.probe.deadlineMs,
                    ...versionProbeOutputDiagnostics(facts.observed.probe.output),
                },
            }),
    });
    return true;
};
/** Resolve, version-probe and fingerprint the configured executable. */
export const inspectKunaInstallation = async (environment, options) => {
    const configuration = readKunaConfiguration(environment, options.platform);
    if (!configuration.ok)
        return err({
            code: configuration.error.code,
            reason: configuration.error.reason,
            remediation: configuration.error.remediation,
            diagnostics: {
                configured: configuration.error.code !== "not_configured",
                ...(configuration.error.setting === null
                    ? {}
                    : { setting: configuration.error.setting }),
            },
        });
    const { command } = configuration.value;
    assertRegularFileActive(options.signal);
    let executable;
    try {
        executable = await realpath(command);
        await access(executable, constants.X_OK);
        if (!(await stat(executable)).isFile())
            return failure("executable_missing", `REA_KUNA_COMMAND is not a regular file: ${command}. ${KUNA_COMMAND_REMEDIATION}`, { command });
    }
    catch (cause) {
        return failure("executable_missing", `Cannot execute REA_KUNA_COMMAND ${command}: ${message(cause)}. ${KUNA_COMMAND_REMEDIATION}`, { command });
    }
    assertRegularFileActive(options.signal);
    let beforeProbeFingerprint;
    const beforeProbeObservation = {
        phase: "fingerprint",
    };
    try {
        beforeProbeFingerprint = await options.resourceScope.run(() => hashStableFile(executable, {
            ...(options.signal === undefined ? {} : { signal: options.signal }),
            retainFailedClose: (owner) => options.resourceScope.retain(owner, executable),
        }));
    }
    catch (cause) {
        if (cause instanceof ArtifactReaderFailure)
            throw cause;
        if (recordPartialInstallationFileOperation(cause, {
            command,
            executable,
            observed: beforeProbeObservation,
        }))
            throw cause;
        return failure("executable_missing", `Cannot fingerprint ${executable}: ${message(stableFileHashCause(cause))}`, { command, executable });
    }
    const deadline = options.probeTimeoutMs ?? VERSION_PROBE_TIMEOUT_MS;
    let snapshot;
    try {
        snapshot = await options.resourceScope.run(() => runOwnedCommand({
            command: executable,
            arguments: ["--version"],
            runId: `rea-kuna-version-${randomUUID()}`,
            // The configured command may be an interpreter-driven shim.
            expectedCommand: null,
            hostEnvironment: kunaChildEnvironment(configuration.value),
        }, {
            timeoutMs: deadline,
            diagnosticBytes: VERSION_PROBE_MAX_OUTPUT_BYTES,
        }, {
            ...(options.signal === undefined ? {} : { signal: options.signal }),
            ...(options.processLauncher === undefined
                ? {}
                : { launcher: options.processLauncher }),
        }));
    }
    catch (cause) {
        if (cause instanceof ArtifactReaderFailure)
            throw cause;
        const retainedCleanup = retainOwnedCommandCleanup(cause, options.resourceScope, "kuna", "kuna:installation");
        const cleanupIncomplete = retainedCleanup.length > 0;
        if (cause instanceof OwnedCommandFailure) {
            const output = versionProbeOutput(cause.snapshot);
            if (cause.reason === "cancelled") {
                const cancellation = new RegularFileOperationCancelled(cause.cancellation?.reason);
                installationFailureDiagnostics.set(cancellation, {
                    kuna_version_probe: {
                        status: "partial",
                        command,
                        executable,
                        deadline_ms: deadline,
                        ...versionProbeOutputDiagnostics(output),
                        probe_failure_reason: cause.reason,
                        cleanup_incomplete: cleanupIncomplete,
                    },
                });
                throw cancellation;
            }
            return failure("version_unresolved", `${executable} --version failed: ${output.stderr.trim() || cause.message}. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
                command,
                executable,
                probe_failure_reason: cause.reason,
                cleanup_incomplete: cleanupIncomplete,
                deadline_ms: deadline,
                ...versionProbeOutputDiagnostics(output),
            });
        }
        return failure("version_unresolved", `${executable} --version failed: ${message(cause)}. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
            command,
            executable,
            exit_code: null,
            signal: null,
            cleanup_incomplete: cleanupIncomplete,
            deadline_ms: deadline,
        });
    }
    const probeOutput = versionProbeOutput(snapshot);
    if (probeOutput.truncated)
        return failure("version_unresolved", `${executable} --version output was incomplete. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
            command,
            executable,
            deadline_ms: deadline,
            output_truncated: true,
            stdout: probeOutput.stdout.slice(0, 256),
        });
    const version = VERSION_LINE.exec(probeOutput.stdout)?.[1];
    if (version === undefined)
        return failure("version_unresolved", `${executable} --version printed no recognizable Kuna version. ${KUNA_VERSION_PROBE_REMEDIATION}`, { command, executable, stdout: probeOutput.stdout.slice(0, 256) });
    let fingerprint;
    let script;
    const observed = {
        phase: "fingerprint",
        beforeProbeFingerprint,
        probe: { deadlineMs: deadline, output: probeOutput },
    };
    try {
        ({ fingerprint, script } = await options.resourceScope.run(async () => {
            observed.phase = "identity";
            const observation = await observeStableFile(executable, {
                ...(options.signal === undefined ? {} : { signal: options.signal }),
                retainFailedClose: (owner) => options.resourceScope.retain(owner, executable),
            });
            const fingerprint = {
                sha256: observation.sha256,
                bytes: observation.bytes,
            };
            const script = observation.prefix.length === 2 &&
                observation.prefix.toString("latin1") === "#!";
            observed.completedHash = fingerprint;
            observed.script = script;
            assertRegularFileActive(options.signal);
            return { fingerprint, script };
        }));
    }
    catch (cause) {
        if (cause instanceof ArtifactReaderFailure)
            throw cause;
        if (recordPartialInstallationFileOperation(cause, {
            command,
            executable,
            version,
            observed,
        })) {
            throw cause;
        }
        return failure("executable_missing", `Cannot observe ${executable} after its --version probe: ${message(stableFileHashCause(cause))}`, {
            command,
            executable,
            version,
            verified: version === KUNA_VERIFIED_VERSION,
            identity_observation_phase: "post_probe",
            identity_observation_failure: message(stableFileHashCause(cause)),
            before_probe_sha256: beforeProbeFingerprint.sha256,
            before_probe_bytes: beforeProbeFingerprint.bytes,
            deadline_ms: deadline,
            ...versionProbeOutputDiagnostics(probeOutput),
        });
    }
    if (beforeProbeFingerprint.sha256 !== fingerprint.sha256 ||
        beforeProbeFingerprint.bytes !== fingerprint.bytes)
        return failure("version_unresolved", `${executable} changed during the --version probe. ${KUNA_VERSION_PROBE_REMEDIATION}`, {
            command,
            executable,
            version,
            verified: version === KUNA_VERIFIED_VERSION,
            installation_identity_changed: true,
            before_sha256: beforeProbeFingerprint.sha256,
            before_bytes: beforeProbeFingerprint.bytes,
            after_sha256: fingerprint.sha256,
            after_bytes: fingerprint.bytes,
            deadline_ms: deadline,
            ...versionProbeOutputDiagnostics(probeOutput),
        });
    return ok({
        configuration: configuration.value,
        executable,
        version,
        verified: version === KUNA_VERIFIED_VERSION,
        ...fingerprint,
        script,
    });
};
