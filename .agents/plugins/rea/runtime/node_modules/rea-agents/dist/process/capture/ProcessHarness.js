import { parseProcessCapture } from "../../domain/process/processCaptureParsing.js";
import { err, ok } from "../../domain/result.js";
import { AnalysisCapabilityUnavailableError } from "../../domain/analysisErrorCore.js";
import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { createProcessTerminalFinalizer, retainTerminalObservationFailure, } from "./ProcessTerminalObservation.js";
import { analysisErrorWithCleanupFailure } from "../../domain/analysisErrorCleanup.js";
import { describeProcessCaptureExecutionFailure, ProcessCaptureError, normalizeCaptureFailure, processCaptureCancelled, } from "./ProcessCaptureError.js";
import { startProcessSampler } from "./ProcessSampling.js";
import { snapshotRoots, ProcessCaptureSnapshotFailure, } from "./FilesystemSnapshot.js";
import { TerminalRenderer } from "./TerminalRenderer.js";
import { createBoundedProcessTextNormalizer, createProcessIdentifierLookup, } from "./ProcessNormalization.js";
import { selectCapturedProcessGroupIds } from "../ProcessOwnershipProcessTree.js";
import { awaitTerminalExit, buildCaptureResult, cleanupReportFailure, captureTerminalFrames, createProcessCaptureObservationBuffer, createRunManifest, observeLaunchedExecutable, observeSelectedExecutable, observeSettlement, prepareProcessCapture, releaseProcessResources, resolveProcessResult, settleProcessCaptureJournal, describeUnverifiedCause, ProcessCaptureResourceScope, captureExitObservation, } from "./ProcessCaptureLifecycle.js";
import { assertNotCancelled, resolveProcessScenarioRuntimePaths, } from "./ProcessScenarioRuntimeValidation.js";
import { createProcessCaptureJournal, scheduleScenarioInteractions, } from "./ProcessCaptureJournal.js";
import { makeProcessCaptureEnvironment } from "./ProcessCaptureEnvironment.js";
import { classifyFilesystemEffects } from "./ProcessFilesystemEffects.js";
import { processCaptureOwnershipUnavailableReason } from "./ProcessCaptureCapability.js";
import { createProcessCaptureProgressTracker, } from "./ProcessCaptureProgress.js";
import { ProcessOwnershipEvidenceOwner } from "../ProcessOwnershipEvidence.js";
import { observeProcessStartIdentity, signalProcessWithStartIdentity, } from "../ProcessOwnershipObservation.js";
import { monotonicProcessCaptureClock } from "./ProcessCaptureClock.js";
/** Bind the captured root's initial identity to its run token before retaining it. */
export const retainRootSignaller = (pid, finalizationMs, runId, host = {
    observe: (rootPid) => observeProcessStartIdentity(rootPid, undefined, runId),
    signal: signalProcessWithStartIdentity,
}) => {
    const retained = finalizationMs > 0
        ? host.observe(pid).then((observation) => observation === undefined
            ? { state: "gone" }
            : observation.state === "readable"
                ? {
                    state: "identity",
                    identity: observation.identity,
                }
                : {
                    state: "unverified",
                    reason: observation.reason.trim() === ""
                        ? "start identity is unavailable without a diagnostic"
                        : observation.reason,
                }, (cause) => ({
            state: "unverified",
            reason: describeUnverifiedCause(cause, "start identity inspection failed without a message"),
        }))
        : undefined;
    return async (signal) => {
        const identity = await retained;
        if (identity === undefined)
            return {
                delivery: "unverified",
                reason: "root identity was not retained",
            };
        if (identity.state === "unverified")
            return { delivery: "unverified", reason: identity.reason };
        if (identity.state === "gone")
            return { delivery: "gone" };
        const delivery = await host.signal(pid, identity.identity, signal);
        return delivery === "unverified"
            ? {
                delivery,
                reason: "start identity could not be verified or the signal call failed",
            }
            : { delivery };
    };
};
const cleanupFailedStartup = async (options) => {
    const sampledProcessGroupIds = options.terminal !== undefined &&
        options.observations?.process_samples.state === "available"
        ? selectCapturedProcessGroupIds(options.terminal.pid, options.observations.process_samples.value).filter((groupId) => groupId !== options.terminal?.pid)
        : undefined;
    const cleanupOptions = {
        timers: options.timers,
        terminal: options.terminal,
        renderer: options.terminalObservation ?? options.renderer,
        runId: options.runId,
        captureBaseline: options.captureBaseline,
        ownershipEvidence: options.ownershipEvidence,
        ...(sampledProcessGroupIds === undefined ? {} : { sampledProcessGroupIds }),
        temporaryRoot: options.temporaryRoot,
        ...(options.cleanupHost === undefined ? {} : { host: options.cleanupHost }),
    };
    const cleanupOutcome = options.resourceScope === undefined
        ? await releaseProcessResources(cleanupOptions)
        : await options.resourceScope.release(cleanupOptions);
    let cause = options.cause;
    if (options.terminalObservation !== undefined) {
        const terminal = await options.terminalObservation.complete();
        if (!terminal.ok)
            cause = retainTerminalObservationFailure(cause, terminal.error);
    }
    const cleanupFailure = cleanupReportFailure(cleanupOutcome.report);
    if (cleanupFailure !== undefined) {
        resolveProcessResult(undefined, cause, cleanupOutcome, options.observations, {
            scenario: options.scenario,
            ...(options.terminal === undefined
                ? {}
                : { rootPid: options.terminal.pid }),
        });
    }
    throw cause;
};
const createTerminalRenderer = (scenario, normalizeText, recordEvent) => new TerminalRenderer({
    columns: scenario.terminal.columns,
    rows: scenario.terminal.rows,
    scrollback: scenario.terminal.scrollback,
    maxBytes: scenario.limits.output_bytes,
    normalize: normalizeText,
    recordEvent,
});
const startCaptureRuntime = async (options) => {
    const { scenario } = options;
    const { ownershipEvidence } = options;
    let renderer;
    let terminal;
    let terminalObservation;
    let stopSampler;
    try {
        const { spawn } = await import("@lydell/node-pty");
        const selectedExecutable = await observeSelectedExecutable(scenario.executable, options.signal, undefined, options.resourceScope);
        const startedAt = new Date();
        const started = monotonicProcessCaptureClock();
        let lastOutput = started;
        const identifiers = createProcessIdentifierLookup(options.samples, () => terminal?.pid ?? -1);
        const normalizeText = createBoundedProcessTextNormalizer(scenario, options.temporaryRoot, identifiers);
        renderer = createTerminalRenderer(scenario, normalizeText, options.recordEvent);
        // Completed executable facts do not authorize launch after cancellation
        // during the sampler's final metadata read or descriptor cleanup.
        assertNotCancelled(options.signal);
        terminal = spawn(scenario.executable, [...scenario.arguments], {
            cwd: scenario.working_directory,
            env: makeProcessCaptureEnvironment(options),
            cols: scenario.terminal.columns,
            rows: scenario.terminal.rows,
            name: "xterm-256color",
        });
        options.onSpawn(terminal.pid);
        options.observationBuffer.target_pid = {
            state: "available",
            value: scenario.normalization.pids ? 1 : terminal.pid,
        };
        const executableIdentity = observeLaunchedExecutable(scenario.executable, selectedExecutable);
        const terminalRetention = captureTerminalFrames({
            ...options,
            terminal,
            started,
            onOutput: () => (lastOutput = monotonicProcessCaptureClock()),
            renderer,
            normalizeText,
            identifiers,
        });
        terminalObservation = createProcessTerminalFinalizer(renderer, terminalRetention, options.observationBuffer);
        scheduleScenarioInteractions({
            ...options,
            getTerminal: () => terminal,
            renderer,
            started,
        });
        stopSampler = startProcessSampler({
            rootPid: terminal.pid,
            runId: options.runId,
            started,
            limit: scenario.limits.processes,
            samples: options.samples,
            recordEvent: options.recordEvent,
        });
        return {
            renderer,
            terminal,
            ownershipEvidence,
            started,
            startedAt,
            executableIdentity,
            lastOutput: () => lastOutput,
            terminalObservation,
            stopSampler,
            signalRoot: retainRootSignaller(terminal.pid, scenario.finalization_ms, options.runId, options.finalizationHost),
        };
    }
    catch (cause) {
        for (const timer of options.timers)
            timer.cancel();
        await stopSampler?.();
        return cleanupFailedStartup({
            cause,
            timers: options.timers,
            terminal,
            renderer,
            terminalObservation,
            runId: options.runId,
            captureBaseline: options.ownershipBaseline,
            ownershipEvidence,
            scenario,
            ...(options.cleanupHost === undefined
                ? {}
                : { cleanupHost: options.cleanupHost }),
            observations: options.observationBuffer,
            temporaryRoot: options.temporaryRoot,
            ...(options.resourceScope === undefined
                ? {}
                : { resourceScope: options.resourceScope }),
        });
    }
};
const finishProcessRun = async (options) => {
    options.progress.closeLive();
    for (const timer of options.timers)
        timer.cancel();
    await options.stopSampler();
    let { capture, executionFailure } = options;
    const sampledProcessGroupIds = options.runtime === undefined
        ? undefined
        : selectCapturedProcessGroupIds(options.runtime.terminal.pid, options.samples).filter((groupId) => groupId !== options.runtime?.terminal.pid);
    const cleanupOptions = {
        timers: options.timers,
        terminal: options.runtime?.terminal,
        renderer: options.runtime?.terminalObservation,
        runId: options.runId,
        captureBaseline: options.captureBaseline,
        ownershipEvidence: options.ownershipEvidence,
        ...(sampledProcessGroupIds === undefined ? {} : { sampledProcessGroupIds }),
        temporaryRoot: options.temporaryRoot,
        ...(options.cleanupHost === undefined ? {} : { host: options.cleanupHost }),
    };
    const cleanupOutcome = options.resourceScope === undefined
        ? await releaseProcessResources(cleanupOptions)
        : await options.resourceScope.release(cleanupOptions);
    if (options.runtime !== undefined && capture === undefined) {
        const terminal = await options.runtime.terminalObservation.complete();
        if (!terminal.ok)
            executionFailure = retainTerminalObservationFailure(executionFailure, terminal.error);
    }
    const cleanup = cleanupOutcome.report;
    if (executionFailure === undefined && options.signal?.aborted)
        executionFailure = processCaptureCancelled(options.signal.reason);
    const observedExit = options.observations?.exit.state === "available"
        ? options.observations.exit.value.reason
        : options.capture?.exit.reason;
    await options.progress.report({
        phase: "cleanup",
        counts: options.progressCounts(),
        terminal: true,
        disposition: captureProgressDisposition(observedExit, executionFailure),
        cleanup,
    });
    const cleanupFailure = cleanupReportFailure(cleanup);
    let verifiedCapture;
    if (capture !== undefined && cleanupFailure === undefined) {
        const settlement = capture.settlement.state === "quiesced"
            ? { ...capture.settlement, cleanup_outcome: "not_required" }
            : { ...capture.settlement, cleanup_outcome: "cleaned" };
        const completedCapture = {
            ...capture,
            settlement,
            cleanup: {
                owned_process_group: "verified",
                temporary_root: "removed",
            },
        };
        try {
            verifiedCapture = parseProcessCapture(completedCapture);
        }
        catch (cause) {
            executionFailure = new ProcessCaptureError(`process capture validation failed${cause instanceof Error ? `: ${cause.message}` : ""}`, { cause });
        }
    }
    const rootPid = options.runtime?.terminal.pid ?? options.rootPid;
    const partialContext = rootPid === undefined
        ? { scenario: options.scenario }
        : { scenario: options.scenario, rootPid };
    // Cancellation remains authoritative until finalization has settled, even
    // when the workload exited normally before cleanup began.
    if (executionFailure === undefined && options.signal?.aborted)
        executionFailure = processCaptureCancelled(options.signal.reason);
    return resolveProcessResult(cleanupFailure === undefined ? verifiedCapture : capture, executionFailure, cleanupOutcome, options.observations, partialContext);
};
const completeCapture = async (options) => {
    const unavailableReason = (stage, cause) => `${stage} failed: ${cause instanceof Error ? cause.message : "unknown failure"}`;
    const { runtime, scenario } = options;
    const { reason } = options.exit;
    if (reason === "cancelled")
        throw processCaptureCancelled(options.signal?.reason);
    let settlement;
    try {
        settlement = await observeSettlement({
            runId: options.runId,
            processGroupIds: selectCapturedProcessGroupIds(runtime.terminal.pid, options.samples),
            ownershipEvidence: runtime.ownershipEvidence,
            settleMs: scenario.settle_ms,
            recordEvent: options.recordEvent,
            platform: options.hostPlatform,
            signal: options.signal,
            onLiveProgress: options.onLiveProgress,
        });
    }
    catch (cause) {
        options.observationBuffer.settlement = {
            state: "unavailable",
            reason: unavailableReason("Process settlement observation", cause),
        };
        throw cause;
    }
    options.observationBuffer.settlement = {
        state: "available",
        value: settlement,
    };
    for (const timer of options.timers)
        timer.cancel();
    const sampling = await runtime.stopSampler();
    const samplingPartial = sampling.partial;
    await settleProcessCaptureJournal(options.eventJournal);
    assertNotCancelled(options.signal);
    let after;
    try {
        after = await options.captureSnapshot(scenario, options.signal, options.before, {
            ...(options.resourceScope === undefined
                ? {}
                : { cleanup: options.resourceScope }),
            observerPaths: [options.temporaryRoot],
        });
    }
    catch (cause) {
        if (cause instanceof ProcessCaptureSnapshotFailure)
            for (const lease of cause.cleanupLeases)
                options.resourceScope?.retain(lease);
        options.observationBuffer.filesystem_snapshots = {
            ...options.observationBuffer.filesystem_snapshots,
            after: cause instanceof ProcessCaptureSnapshotFailure &&
                cause.snapshot !== undefined
                ? { state: "available", value: cause.snapshot }
                : {
                    state: "unavailable",
                    reason: unavailableReason("Final filesystem snapshot", cause),
                },
        };
        throw cause instanceof ProcessCaptureSnapshotFailure
            ? cause.failureForCaller()
            : cause;
    }
    options.observationBuffer.filesystem_snapshots = {
        ...options.observationBuffer.filesystem_snapshots,
        after: {
            state: "available",
            value: after,
        },
    };
    options.recordEvent("filesystem_checkpoints", 1);
    const terminal = await runtime.terminalObservation.complete();
    if (!terminal.ok)
        throw terminal.error;
    const { renderedFrames, retention } = terminal.value;
    const checkpoints = [
        {
            name: "before",
            at_ms: 0,
            files: options.before.files,
            effects: [],
            truncated: options.before.truncated,
        },
        {
            name: "after_settlement",
            at_ms: Math.max(0, monotonicProcessCaptureClock() - runtime.started),
            files: after.files,
            effects: classifyFilesystemEffects(options.before, after),
            truncated: after.truncated,
        },
    ];
    let manifest;
    try {
        manifest = await createRunManifest(scenario, runtime.startedAt, new Date(), runtime.executableIdentity, { platform: options.hostPlatform, architecture: process.arch });
    }
    catch (cause) {
        options.observationBuffer.manifest = {
            state: "unavailable",
            reason: unavailableReason("Capture manifest creation", cause),
        };
        throw cause;
    }
    options.observationBuffer.manifest = { state: "available", value: manifest };
    return buildCaptureResult({
        frames: options.frames,
        exit: { ...options.exit, reason },
        samples: options.samples,
        before: options.before,
        after,
        truncationDetails: {
            ...retention,
            rendered_terminal: runtime.renderer.retention(),
            filesystem_before: options.before.coverage,
            filesystem_after: after.coverage,
            process: sampling.coverage,
        },
        scenario,
        rootPid: runtime.terminal.pid,
        samplingPartial,
        renderedFrames,
        interactions: options.interactions,
        checkpoints,
        settlement,
        manifest,
        eventJournal: options.eventJournal,
    });
};
const captureProgressDisposition = (exitReason, executionFailure) => {
    if (exitReason === "exited" ||
        exitReason === "timeout" ||
        exitReason === "idle_timeout" ||
        exitReason === "cancelled")
        return exitReason;
    if (executionFailure instanceof ProcessCaptureError &&
        executionFailure.reason === "cancelled")
        return "cancelled";
    return "failed";
};
/** Execute one caller-selected scenario and return bounded observations. */
const runProcessScenario = async (scenario, signal, hostEnvironment = process.env, hostPlatform = process.platform, captureSnapshot = snapshotRoots, cleanupHost, progress, resourceScope, finalizationHost) => {
    const progressTracker = createProcessCaptureProgressTracker(progress);
    const frames = [];
    const samples = [];
    const interactions = [];
    const progressCounts = () => ({
        frames: frames.length,
        samples: samples.length,
        interactions: interactions.length,
    });
    const reportRunning = () => {
        void progressTracker.report({ phase: "running", counts: progressCounts() });
    };
    const reportSettling = () => {
        void progressTracker.report({
            phase: "settling",
            counts: progressCounts(),
        });
    };
    let prepared;
    try {
        await progressTracker.report({
            phase: "prepare",
            counts: progressCounts(),
        });
        prepared = await prepareProcessCapture(scenario, signal, captureSnapshot, undefined, resourceScope);
    }
    catch (cause) {
        progressTracker.closeLive();
        await progressTracker.report({
            phase: "cleanup",
            counts: progressCounts(),
            terminal: true,
            disposition: signal?.aborted === true ? "cancelled" : "failed",
            ...(cause instanceof ProcessCaptureError &&
                cause.cleanupReport !== undefined
                ? { cleanup: cause.cleanupReport }
                : {}),
        });
        throw cause;
    }
    const { temporaryRoot, runId, ownershipBaseline, before } = prepared;
    const ownershipEvidence = new ProcessOwnershipEvidenceOwner();
    const journal = createProcessCaptureJournal();
    const { entries: eventJournal, recordEvent } = journal;
    recordEvent("filesystem_checkpoints", 0);
    const observations = createProcessCaptureObservationBuffer({
        frames,
        interactions,
        samples,
        eventJournal,
        before,
        finalizationEnabled: scenario.finalization_ms > 0,
    });
    let runtime;
    let actualRootPid;
    const timers = new Set();
    let capture;
    let executionFailure;
    let stopSampler = async () => ({ partial: false });
    const dispatchedEventIndexes = new Set();
    try {
        runtime = await startCaptureRuntime({
            scenario,
            hostEnvironment,
            temporaryRoot,
            runId,
            ownershipBaseline,
            ownershipEvidence,
            ...(cleanupHost === undefined ? {} : { cleanupHost }),
            ...(resourceScope === undefined ? {} : { resourceScope }),
            observationBuffer: observations,
            onSpawn: (pid) => {
                actualRootPid = pid;
            },
            frames,
            samples,
            interactions,
            timers,
            dispatchedEventIndexes,
            recordEvent,
            ...(signal === undefined ? {} : { signal }),
            ...(finalizationHost === undefined ? {} : { finalizationHost }),
        });
        stopSampler = runtime.stopSampler;
        const exit = await awaitTerminalExit({
            terminal: runtime.terminal,
            scenario,
            started: runtime.started,
            lastOutput: runtime.lastOutput,
            signal,
            signalTarget: runtime.signalRoot,
            recordFinalization: (finalization) => {
                observations.finalization = { state: "available", value: finalization };
            },
            timers,
            interactions,
            dispatchedEventIndexes,
            recordEvent,
            ...(progress === undefined ? {} : { onLiveProgress: reportRunning }),
        });
        if (exit.unobserved === true) {
            observations.finalization = {
                state: "available",
                value: exit.finalization,
            };
            observations.exit = {
                state: "unavailable",
                reason: `The captured process exit was not observed because the finalization SIGKILL could not be delivered (initiating reason: ${exit.reason}).`,
            };
            if (exit.reason === "cancelled")
                throw processCaptureCancelled(signal?.reason);
            throw new Error("The captured process exit was not observed because the finalization SIGKILL could not be delivered.");
        }
        if (exit.finalization !== undefined)
            observations.finalization = {
                state: "available",
                value: exit.finalization,
            };
        observations.exit = {
            state: "available",
            value: captureExitObservation(exit),
        };
        capture = await completeCapture({
            timers,
            scenario,
            hostPlatform,
            runtime,
            runId,
            temporaryRoot,
            before,
            frames,
            samples,
            interactions,
            exit,
            eventJournal,
            observationBuffer: observations,
            recordEvent,
            captureSnapshot,
            ...(resourceScope === undefined ? {} : { resourceScope }),
            ...(signal === undefined ? {} : { signal }),
            ...(progress === undefined ? {} : { onLiveProgress: reportSettling }),
        });
    }
    catch (cause) {
        executionFailure = normalizeCaptureFailure(cause, signal);
    }
    return finishProcessRun({
        runtime,
        timers,
        runId,
        captureBaseline: ownershipBaseline,
        ownershipEvidence,
        ...(cleanupHost === undefined ? {} : { cleanupHost }),
        temporaryRoot,
        scenario,
        samples,
        stopSampler,
        capture,
        executionFailure,
        observations,
        ...(actualRootPid === undefined ? {} : { rootPid: actualRootPid }),
        progress: progressTracker,
        progressCounts,
        ...(resourceScope === undefined ? {} : { resourceScope }),
        ...(signal === undefined ? {} : { signal }),
    });
};
/** Execute one scenario through a typed expected-failure channel. */
export const captureProcessScenario = async (scenario, signal, platform = process.platform, environment = process.env, captureSnapshot, cleanupHost, progress, resourceScope, finalizationHost) => {
    const ownershipReason = processCaptureOwnershipUnavailableReason(platform);
    if (ownershipReason !== undefined)
        return err(new AnalysisCapabilityUnavailableError("rea-process", "capture_process_scenario", ownershipReason, { userMessage: ownershipReason }));
    const runResourceScope = resourceScope ?? new ProcessCaptureResourceScope();
    const execute = async () => {
        try {
            assertNotCancelled(signal);
            const resolvedScenario = await resolveProcessScenarioRuntimePaths(scenario, environment);
            const capture = await runProcessScenario(resolvedScenario, signal, environment, platform, captureSnapshot ?? snapshotRoots, cleanupHost, progress, runResourceScope, finalizationHost);
            return ok(capture);
        }
        catch (cause) {
            const failure = normalizeCaptureFailure(cause, signal);
            const executionFailureReason = describeProcessCaptureExecutionFailure(cause);
            return err(failure instanceof AnalysisError
                ? failure
                : new ProcessCaptureError("process capture failed", {
                    cause,
                    ...(executionFailureReason === undefined
                        ? {}
                        : { executionFailure: executionFailureReason }),
                }));
        }
    };
    if (resourceScope !== undefined) {
        try {
            return await resourceScope.run(execute);
        }
        catch (cause) {
            const failure = normalizeCaptureFailure(cause, signal);
            const executionFailure = describeProcessCaptureExecutionFailure(cause);
            return err(failure instanceof AnalysisError
                ? failure
                : new ProcessCaptureError("process capture lifecycle failed", {
                    cause,
                    reason: "cleanup_incomplete",
                    cleanup: {
                        reason: "process capture lifecycle failed",
                        resources: ["process_capture_lifecycle"],
                    },
                    ...(executionFailure === undefined ? {} : { executionFailure }),
                }));
        }
    }
    const capture = await runResourceScope.run(execute);
    try {
        await runResourceScope.close();
    }
    catch (cause) {
        if (!(cause instanceof AnalysisError))
            throw cause;
        return err(capture.ok
            ? cause
            : capture.error instanceof ProcessCaptureError
                ? capture.error.withFinalization({ cleanupFailure: cause })
                : analysisErrorWithCleanupFailure(capture.error, cause, "capture_process_scenario").bindCleanupDependencies([capture.error, cause]));
    }
    return capture;
};
