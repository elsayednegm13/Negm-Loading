import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, realpath, stat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisOutputError, } from "../../domain/analysisErrorCore.js";
import { ArtifactReaderFailure } from "../../artifacts/ArtifactReader.js";
import { ProviderAdapterError } from "../../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../../domain/providerCleanupError.js";
import { prlimitArgumentVector } from "../../process/LinuxResourceLimits.js";
import { cleanupOwnedProcessGroup } from "../../process/ProcessOwnership.js";
import { ProviderProcessSupervisor, spawnOwnedProviderProcess, } from "../../process/ProviderProcess.js";
import { checkRecoveryDeadline, inventoryRecoveryFiles, fingerprintRecoveryFile, recoveryFailureMessage, } from "./RecoveryFiles.js";
import { RECOVERY_LIMITS, wakaruFixedLimitRecovery } from "./WakaruRelease.js";
const OPERATION = "recover_javascript_sources";
const WAKARU_REQUIREMENT = "Provide an absolute REA_WAKARU_COMMAND pointing to a Wakaru ^1.13.0 Linux x64 binary (verified with 1.14.0); no tool is installed by REA. See docs/javascript-recovery.md#install-wakaru.";
/** Wakaru recovery runs only on Linux x64; discovery and execution share this check. */
export const wakaruHostSupported = (platform, arch) => platform === "linux" && arch === "x64";
/** Cleanup failure carrying the live supervisor so the provider can retry it. */
export class WakaruCleanupFailure extends ProviderCleanupError {
    cleanupOwner;
    runId;
    cwd;
    constructor(cleanupOwner, runId, cwd, reason, previousError, snapshot) {
        super("wakaru", [runId, cwd], {
            reason,
            previous_error: previousError instanceof Error ? previousError.message : null,
            exit_code: snapshot.exitCode ?? null,
            signal: snapshot.signal ?? null,
        }, { operation: OPERATION, cause: previousError });
        this.cleanupOwner = cleanupOwner;
        this.runId = runId;
        this.cwd = cwd;
    }
}
/** Resolve and fingerprint explicitly configured tools; acquire nothing at startup. */
export const resolveWakaruCommand = async (environment, resources, signal) => {
    const configured = environment.REA_WAKARU_COMMAND;
    if (!wakaruHostSupported(process.platform, process.arch) ||
        configured === undefined ||
        !isAbsolute(configured))
        throw new AnalysisCapabilityUnavailableError("wakaru", OPERATION, WAKARU_REQUIREMENT, { userMessage: WAKARU_REQUIREMENT });
    try {
        const command = await realpath(configured);
        await access(command, constants.R_OK | constants.X_OK);
        const fingerprint = await fingerprintRecoveryFile(command, RECOVERY_LIMITS.outputBytes, signal, resources);
        const limiter = environment.REA_JAVASCRIPT_PRLIMIT_COMMAND ?? "/usr/bin/prlimit";
        if (!isAbsolute(limiter))
            throw new TypeError("REA_JAVASCRIPT_PRLIMIT_COMMAND must be absolute");
        await access(limiter, constants.X_OK);
        if (!(await stat(limiter)).isFile())
            throw new TypeError(`Resource limiter is not a regular file: ${limiter}`);
        return { command, limiter, ...fingerprint };
    }
    catch (cause) {
        if (cause instanceof AnalysisCancelledError ||
            cause instanceof AnalysisArtifactChangedError ||
            (cause instanceof ArtifactReaderFailure &&
                (cause.cleanup !== undefined || cause.reason === "cancelled")))
            throw cause;
        const reason = `Configured Wakaru or util-linux prlimit is unavailable: ${recoveryFailureMessage(cause)}`;
        throw new AnalysisCapabilityUnavailableError("wakaru", OPERATION, reason, {
            cause,
            userMessage: reason,
        });
    }
};
/** Run one bounded command and verify cleanup before consuming its output. */
export const runWakaruCommand = async (context) => {
    checkRecoveryDeadline(context.deadline, context.signal);
    const runId = `rea-wakaru-${randomUUID()}`;
    const spawned = await (context.launcher ?? spawnOwnedProviderProcess)({
        command: context.limiter,
        arguments: [
            ...prlimitArgumentVector({
                address_space_bytes: RECOVERY_LIMITS.addressSpaceBytes,
                file_bytes: RECOVERY_LIMITS.outputBytes,
                cpu_seconds: RECOVERY_LIMITS.cpuSeconds,
            }, context.command),
            ...context.arguments,
        ],
        expectedCommand: null,
        runId,
        cwd: context.cwd,
        hostEnvironment: context.environment,
        ...(context.signal === undefined ? {} : { signal: context.signal }),
        env: { TMPDIR: context.cwd, RAYON_NUM_THREADS: "1", NO_COLOR: "1" },
    }).catch((cause) => {
        if (context.signal?.aborted === true)
            throw new AnalysisCancelledError(OPERATION, {
                cause: context.signal.reason,
            });
        throw new ProviderAdapterError("wakaru", OPERATION, {
            cause,
            diagnostics: {
                reason: "Failed to launch configured Wakaru through util-linux prlimit",
                command: context.command,
                detail: recoveryFailureMessage(cause),
            },
        });
    });
    let oversized = false;
    const supervisor = new ProviderProcessSupervisor({
        ...spawned,
        ownsProcessLifetime: true,
        cleanup: spawned.cleanup ?? (() => cleanupOwnedProcessGroup(spawned.ownership)),
    }, {
        onDiagnostic: (event) => {
            if (event.type === "output" &&
                event.totalBytes > RECOVERY_LIMITS.reportBytes)
                oversized = true;
        },
    });
    let failure;
    try {
        while (!(await supervisor.waitForOutputClose(100))) {
            checkRecoveryDeadline(context.deadline, context.signal);
            if (oversized)
                throw new AnalysisOutputError(OPERATION, "Wakaru diagnostic stream exceeds 8 MiB", wakaruFixedLimitRecovery(`Wakaru diagnostic stream exceeds the ${String(RECOVERY_LIMITS.reportBytes)}-byte report allowance`));
            if (context.staging !== undefined)
                await inventoryRecoveryFiles(context.staging, context.signal, context.resources);
        }
        checkRecoveryDeadline(context.deadline, context.signal);
        if (oversized)
            throw new AnalysisOutputError(OPERATION, "Wakaru diagnostic stream exceeds 8 MiB", wakaruFixedLimitRecovery(`Wakaru diagnostic stream exceeds the ${String(RECOVERY_LIMITS.reportBytes)}-byte report allowance`));
    }
    catch (cause) {
        failure = cause;
    }
    const stopped = await supervisor.stop();
    const snapshot = supervisor.snapshot();
    if (stopped.status === "incomplete")
        throw new WakaruCleanupFailure(supervisor, runId, context.cwd, stopped.reason, failure, snapshot);
    if (failure !== undefined)
        throw failure;
    if (context.signal?.aborted === true)
        throw new AnalysisCancelledError(OPERATION, {
            cause: context.signal.reason,
        });
    return {
        exit_code: snapshot.exitCode ?? null,
        signal: snapshot.signal ?? null,
        stdout: snapshot.stdout.text,
        stderr: snapshot.stderr.text,
        command: context.command,
        arguments: [...context.arguments],
        resource_limiter: context.limiter,
    };
};
