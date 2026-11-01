import { prepareProcessOwnershipInspection, systemProcessOwnershipHost, } from "./ProcessOwnershipObservation.js";
import { DarwinProcessOwnershipInspectionError } from "./DarwinProcessRunTokenReader.js";
import { finished } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ProviderProcessSupervisor, spawnOwnedProviderProcess, } from "./ProviderProcess.js";
import { cleanupOwnedProcessGroup, } from "./ProcessOwnership.js";
import { ABORTED, waitForAbortable } from "./AbortablePromise.js";
import { ProviderStartupDeadline, waitForAbortableDelay, } from "./ProviderDeadline.js";
/** A short-lived command failed its lifecycle or complete-output contract. */
export class OwnedCommandFailure extends Error {
    reason;
    snapshot;
    cleanupFailure;
    resources;
    cleanupOwner;
    #cancellation;
    /** Opaque caller reason observed by the owner, distinct from physical causes. */
    get cancellation() {
        return this.#cancellation;
    }
    processError;
    cleanupResult;
    collectionFailure;
    preparationFailure;
    constructor(reason, message, snapshot = null, cleanupFailure = null, options, resources = [], cleanupOwner) {
        super(message, options);
        this.reason = reason;
        this.snapshot = snapshot;
        this.cleanupFailure = cleanupFailure;
        this.resources = resources;
        this.cleanupOwner = cleanupOwner;
        this.#cancellation =
            options?.cancellation === undefined
                ? undefined
                : { reason: options.cancellation.reason };
        this.processError = options?.processError;
        this.cleanupResult = options?.cleanupResult;
        this.collectionFailure = options?.collectionFailure ?? false;
        this.preparationFailure = options?.preparationFailure;
    }
}
/** Report recorded launch identities; these labels do not authorize signaling. */
export const ownedCommandResources = (ownership, directory) => [
    ownership.runId,
    ...(directory === undefined ? [] : [directory]),
    `pid:${ownership.leaderPid}`,
    `process-group:${ownership.processGroupId}`,
];
/** Keep independently bounded macOS helper compilation outside a short command deadline.
 * Other platforms still prepare inside runOwnedCommand: Linux ps has no separate deadline.
 */
export const prepareOwnedCommand = async (signal) => {
    if (systemProcessOwnershipHost.platform !== "darwin")
        return;
    try {
        signal?.throwIfAborted();
        await prepareProcessOwnershipInspection(signal);
    }
    catch (cause) {
        throwCommandPreparationFailure(cause, signal, signal?.aborted === true ? "cancelled" : undefined);
    }
};
/** Both preparation stages preserve physical failures, opaque cancellation and exact owners. */
function throwCommandPreparationFailure(cause, signal, interruption) {
    // A caller's raw abort reason remains opaque even if it is a typed error.
    const preparationFailure = cause instanceof DarwinProcessOwnershipInspectionError &&
        !(signal?.aborted === true && cause === signal.reason)
        ? cause
        : undefined;
    // Preparation owns its physical outcome and any retained helper resources.
    if (preparationFailure !== undefined &&
        preparationFailure.cancellation === undefined)
        throw preparationFailure;
    if (interruption !== undefined)
        throw new OwnedCommandFailure(interruption, interruption === "cancelled"
            ? "Command cancelled during ownership preparation."
            : "Command deadline elapsed during ownership preparation.", null, null, {
            cause,
            ...(interruption === "cancelled"
                ? {
                    cancellation: { reason: signal?.reason },
                }
                : {}),
            ...(preparationFailure === undefined ? {} : { preparationFailure }),
        });
    throw cause;
}
/** Execute a single owned process with independent cleanup and bounded diagnostic retention. */
export const runOwnedCommand = async (spawn, limits, options = {}) => {
    const callerSignal = options.signal ?? spawn.signal;
    if (callerSignal?.aborted)
        throw new OwnedCommandFailure("cancelled", "Command cancelled before launch.", null, null, { cancellation: { reason: callerSignal.reason } });
    const deadline = limits.timeoutMs === null
        ? undefined
        : new ProviderStartupDeadline(limits.timeoutMs, callerSignal);
    const control = deadline ?? {
        signal: callerSignal ?? new AbortController().signal,
        get interruption() {
            return callerSignal?.aborted === true ? "cancelled" : undefined;
        },
    };
    try {
        return await collectOwnedCommand(spawn, limits, options.launcher ?? spawnOwnedProviderProcess, control, callerSignal, options.retainCleanup);
    }
    finally {
        deadline?.dispose();
    }
};
const collectOwnedCommand = async (spawn, limits, launcher, deadline, callerSignal, retainCleanup) => {
    const signal = deadline.signal;
    let launched;
    try {
        launched = await launcher({
            ...spawn,
            ...(limits.stdin === undefined ? {} : { stdin: "pipe" }),
            signal,
        });
    }
    catch (cause) {
        throwCommandPreparationFailure(cause, signal, deadline.interruption);
    }
    let exceeded = false;
    let outputLimitObservedBeforeInterruption = false;
    let processFailure;
    let processError;
    let processFailureCause;
    let processFailureBeforeInterruption;
    const supervisor = new ProviderProcessSupervisor({
        ...launched,
        ownsProcessLifetime: true,
        cleanup: launched.cleanup ??
            (() => cleanupOwnedProcessGroup(launched.ownership)),
    }, {
        captureStdout: limits.stdout === undefined,
        maxDiagnosticBytes: limits.diagnosticBytes,
        onDiagnostic: (event) => {
            if (event.type === "output" && event.truncated === true) {
                exceeded = true;
                if (deadline.interruption === undefined)
                    outputLimitObservedBeforeInterruption = true;
            }
            if (event.type === "error") {
                processFailure ??= event.message;
                processError ??= event.cause;
                if (deadline.interruption === undefined)
                    processFailureBeforeInterruption ??= {
                        message: processFailure,
                        processError,
                        collectionFailure: true,
                    };
            }
            if (event.type === "exit" && deadline.interruption === undefined) {
                const acceptedNonzeroExit = limits.acceptNonZeroExit === true &&
                    event.code !== null &&
                    event.code !== 0 &&
                    event.signal === null;
                if (event.signal !== null ||
                    (event.code !== null && event.code !== 0 && !acceptedNonzeroExit))
                    processFailureBeforeInterruption ??= {
                        message: "Command failed; inspect its exit status and diagnostics.",
                        processError: undefined,
                        collectionFailure: false,
                    };
            }
        },
    });
    // A command that fails or is interrupted destroys its sink with its stdout.
    const abandoned = new AbortController();
    const collectionSignal = AbortSignal.any([signal, abandoned.signal]);
    const consumed = consumeStdout(launched.process.stdout, limits.stdout, collectionSignal);
    void consumed.then((failed) => {
        processFailure ??= failed;
        if (failed !== undefined && deadline.interruption === undefined)
            processFailureBeforeInterruption ??= {
                message: processFailure ?? failed,
                processError,
                collectionFailure: true,
            };
    });
    let inputFailure;
    const inputCompleted = limits.stdin === "closed-pipe"
        ? finishCommandInput(launched.process.stdin, (cause) => {
            inputFailure ??= {
                cause,
                message: `stdin stream failed: ${cause instanceof Error ? cause.message : String(cause)}`,
                processError: cause instanceof Error ? cause : undefined,
            };
            if (processFailure === undefined) {
                processFailure = inputFailure.message;
                processError = inputFailure.processError;
                processFailureCause = { cause: inputFailure.cause };
            }
            if (deadline.interruption === undefined)
                processFailureBeforeInterruption ??= {
                    message: processFailure,
                    ...processFailureCause,
                    processError,
                    collectionFailure: true,
                };
            abandoned.abort();
        })
        : Promise.resolve();
    let failure;
    const interruptionOrObservedFailure = (interruption, snapshot = null) => {
        if (interruption === undefined)
            return;
        if (outputLimitObservedBeforeInterruption)
            return new OwnedCommandFailure("output-limit", "Command diagnostic output exceeded its complete-output budget.", snapshot);
        if (processFailureBeforeInterruption !== undefined)
            return new OwnedCommandFailure("process", processFailureBeforeInterruption.message, snapshot, null, {
                ...("cause" in processFailureBeforeInterruption
                    ? { cause: processFailureBeforeInterruption.cause }
                    : {}),
                processError: processFailureBeforeInterruption.processError,
                collectionFailure: processFailureBeforeInterruption.collectionFailure,
            });
        return new OwnedCommandFailure(interruption, interruption === "cancelled"
            ? "Command cancelled."
            : "Command deadline elapsed.", snapshot, null, interruption === "cancelled"
            ? { cancellation: { reason: signal.reason } }
            : undefined);
    };
    try {
        while (!(await supervisor.waitForOutputClose(10))) {
            const interrupted = interruptionOrObservedFailure(deadline.interruption);
            if (interrupted !== undefined)
                throw interrupted;
            if (exceeded)
                throw new OwnedCommandFailure("output-limit", "Command diagnostic output exceeded its complete-output budget.");
            if (processFailure !== undefined)
                throw new OwnedCommandFailure("process", processFailure, null, null, {
                    ...processFailureCause,
                    processError,
                    collectionFailure: true,
                });
            await waitForAbortableDelay(25, signal);
        }
        // Output has closed, but the sink may still be parsing what it buffered.
        const sinkFailure = await waitForAbortable(consumed, collectionSignal);
        if (sinkFailure !== ABORTED)
            processFailure ??= sinkFailure;
        await waitForAbortable(inputCompleted, collectionSignal);
        const snapshot = supervisor.snapshot();
        const interrupted = interruptionOrObservedFailure(deadline.interruption, snapshot);
        if (interrupted !== undefined)
            throw interrupted;
        if (exceeded)
            throw new OwnedCommandFailure("output-limit", "Command diagnostic output exceeded its complete-output budget.", snapshot);
        const acceptedNonzeroExit = limits.acceptNonZeroExit === true &&
            snapshot.exitCode !== null &&
            snapshot.exitCode !== undefined &&
            snapshot.exitCode !== 0 &&
            snapshot.signal === null;
        if (processFailure !== undefined ||
            ((snapshot.exitCode !== 0 || snapshot.signal !== null) &&
                !acceptedNonzeroExit))
            throw new OwnedCommandFailure("process", processFailure ??
                "Command failed; inspect its exit status and diagnostics.", snapshot, null, {
                ...processFailureCause,
                processError,
                collectionFailure: processFailure !== undefined,
            });
        limits.observeCompleted?.(snapshot);
    }
    catch (cause) {
        failure =
            cause instanceof OwnedCommandFailure
                ? cause
                : new OwnedCommandFailure("process", "Command collection failed.", null, null, { cause });
    }
    // A finished sink ignores this; an unfinished one is destroyed.
    abandoned.abort();
    const stopped = await supervisor.stop();
    const snapshot = supervisor.snapshot();
    // An input error can arrive after finish while process cleanup is still pending.
    if (failure === undefined && inputFailure !== undefined)
        failure =
            interruptionOrObservedFailure(deadline.interruption, snapshot) ??
                new OwnedCommandFailure("process", inputFailure.message, snapshot, null, {
                    cause: inputFailure.cause,
                    processError: inputFailure.processError,
                    collectionFailure: true,
                });
    const cancellation = failure?.cancellation ??
        (callerSignal?.aborted ? { reason: callerSignal.reason } : undefined);
    if (stopped.status === "incomplete" && retainCleanup !== undefined)
        retainCleanup(supervisor, stopped);
    else if (stopped.status === "incomplete")
        throw new OwnedCommandFailure(failure?.reason ?? "process", failure?.message ?? "Command cleanup failed.", snapshot, stopped.reason, {
            cancellation,
            ...(failure === undefined
                ? {}
                : { cause: failure, processError: failure.processError }),
            ...(stopped.cleanupResult === undefined
                ? {}
                : { cleanupResult: stopped.cleanupResult }),
            ...(failure?.collectionFailure === true
                ? { collectionFailure: true }
                : {}),
        }, ownedCommandResources(launched.ownership, spawn.cwd), supervisor);
    if (failure !== undefined)
        throw new OwnedCommandFailure(failure.reason, failure.message, snapshot, failure.cleanupFailure, {
            cause: failure,
            cancellation,
            processError: failure.processError,
            ...(failure.cleanupResult === undefined
                ? {}
                : { cleanupResult: failure.cleanupResult }),
            ...(failure.collectionFailure ? { collectionFailure: true } : {}),
        }, failure.resources);
    if (callerSignal?.aborted)
        throw new OwnedCommandFailure("cancelled", "Command cancelled.", snapshot, null, {
            cancellation: { reason: callerSignal.reason },
        });
    return snapshot;
};
/** Observe completion before sending EOF; listeners stay with input through cleanup retries. */
const finishCommandInput = (input, failed) => {
    if (input === null || input === undefined) {
        failed(new Error("stdin stream is unavailable"));
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const failure = (cause) => {
            failed(cause);
            resolve();
        };
        input.on("error", failure);
        finished(input, { readable: false }, (cause) => {
            if (cause !== undefined && cause !== null)
                failure(cause);
            // finished() also accepts ended, empty writes when close interrupts _final.
            else if (!input.writableFinished)
                failure(new Error("closed before writable finalization completed"));
            else
                resolve();
        });
        try {
            input.end();
        }
        catch (cause) {
            failure(cause);
        }
    });
};
/**
 * Pipe stdout into its sink until `signal` aborts, which destroys both; settles
 * with a failure message, never rejects.
 */
const consumeStdout = (stdout, sink, signal) => {
    if (sink === undefined)
        return Promise.resolve(undefined);
    if (stdout === null) {
        sink.destroy();
        return Promise.resolve("stdout stream is unavailable");
    }
    return pipeline(stdout, sink, { signal }).then(() => undefined, (cause) => `stdout stream failed: ${cause instanceof Error ? cause.message : String(cause)}`);
};
