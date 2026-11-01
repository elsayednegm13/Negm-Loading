var _a;
import { WorkerFrameSignal } from "../process/WorkerFrameSignal.js";
import { createHash, randomUUID } from "node:crypto";
import { open, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { StringDecoder } from "node:string_decoder";
import { getHeapStatistics } from "node:v8";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { artifactFileCompletion, ArtifactFileCleanupFailure, artifactFileCancellationCause, withArtifactFileHandle, } from "../artifacts/ArtifactFileOperation.js";
import { completedStableArtifact, readStableArtifact, } from "../artifacts/readStableArtifact.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisCancelledError, AnalysisTimeoutError, AnalysisOutputError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { jsonParts, bufferedJsonParts } from "../domain/jsonSerialization.js";
import { javaScriptRuntime } from "../domain/runtimeVersion.js";
import { err, ok } from "../domain/result.js";
import { webBundleScriptAnalysisSchema, } from "../domain/webBundleScriptAnalysis.js";
import { OwnedWorkerRuntime } from "../process/OwnedWorkerRuntime.js";
import { RuntimeControlUnavailableError, runtimeControlCapabilityError, } from "../process/RuntimeControlUnavailableError.js";
import { spawnOwnedProviderProcess } from "../process/ProviderProcess.js";
import { ProviderStartupDeadline } from "../process/ProviderDeadline.js";
import { prepareProcessOwnershipInspection } from "../process/ProcessOwnershipObservation.js";
import { javaScriptWorkerMemoryLimitBytes } from "../process/JavaScriptWorkerMemoryLimit.js";
import { DEFAULT_WEB_BUNDLE_HEAP_MB, MAX_WEB_BUNDLE_HEAP_MB, MIN_WEB_BUNDLE_HEAP_MB, webBundleFixedByteBudget, webBundleHeapExhaustedReason, webBundleHeapExhaustedRemediation, webBundleMemoryExhaustion, webBundleResultAdmissionFailure, webBundleScriptTimeoutRecovery, } from "../domain/webBundleAnalysis.js";
import { WEB_BUNDLE_WORKER_LIMITS, webBundleWorkerMessageSchema, webBundleWorkerRequestSchema, } from "./WebBundleAnalysisWorkerProtocol.js";
const OPERATION = "analyze_web_bundle";
const PROVIDER = "web-bundle-static-analysis";
const scriptTimeout = (timeoutMs, cause) => new AnalysisTimeoutError(OPERATION, timeoutMs, {
    ...(cause === undefined ? {} : { cause }),
    ...webBundleScriptTimeoutRecovery(timeoutMs),
});
const MIB = 1024 * 1024;
/** Source/result buffers, decoded strings, parsed objects and validation copies. */
const RESULT_EXPANSION = 16;
/** Sequential inert-source analysis; only bounded completed facts cross into the host. */
export class WebBundleAnalysisWorker {
    heapMb;
    static #pendingCleanup = new Set();
    #runtime;
    #files = new ArtifactResourceScope();
    #cleanup;
    #decoder = new StringDecoder("utf8");
    #pending = "";
    #frames = [];
    #protocolFailure;
    #observedFailure;
    #activeDeadline;
    #activeJob;
    #activeTerminalResponseObserved = false;
    #frameSignal = new WorkerFrameSignal();
    #retainedResultBytes = 0;
    #ready = false;
    #stdout = (chunk) => {
        if (this.#activeDeadline?.interruption !== undefined)
            return;
        if (this.#protocolFailure !== undefined)
            return;
        try {
            // Refuse the chunk before appending it to any retained control text.
            if (Buffer.byteLength(chunk) + Buffer.byteLength(this.#pending) >
                WEB_BUNDLE_WORKER_LIMITS.protocolBytes)
                throw new RangeError(webBundleFixedByteBudget(WEB_BUNDLE_WORKER_LIMITS.protocolBytes, "control-frame budget"));
            this.#pending +=
                typeof chunk === "string" ? chunk : this.#decoder.write(chunk);
            for (;;) {
                const end = this.#pending.indexOf("\n");
                if (end < 0)
                    break;
                if (this.#frames.length >= 16)
                    throw new RangeError("Web analyzer exceeded its control-frame queue");
                this.#frames.push(webBundleWorkerMessageSchema.parse(JSON.parse(this.#pending.slice(0, end))));
                this.#observeFrame(this.#frames.at(-1));
                this.#pending = this.#pending.slice(end + 1);
            }
            this.#frameSignal.wake("frame");
        }
        catch (cause) {
            this.#pending = "";
            this.#protocolFailure = cause;
            this.#latchFailure({ kind: "protocol", cause });
            this.#frameSignal.wake("failure");
        }
    };
    constructor(heapMb = DEFAULT_WEB_BUNDLE_HEAP_MB, launcher = spawnOwnedProviderProcess) {
        this.heapMb = heapMb;
        if (!Number.isSafeInteger(heapMb) ||
            heapMb < MIN_WEB_BUNDLE_HEAP_MB ||
            heapMb > MAX_WEB_BUNDLE_HEAP_MB)
            throw new RangeError(`Web analyzer heap must be an integer from ${String(MIN_WEB_BUNDLE_HEAP_MB)} through ${String(MAX_WEB_BUNDLE_HEAP_MB)} MiB (max_heap_mb)`);
        this.#runtime = new OwnedWorkerRuntime({
            rootPrefix: "rea-web-bundle-analysis-",
            launcher,
            retryCleanup: () => this.close(),
            onInputFailure: (cause) => {
                if (this.#activeDeadline?.interruption !== undefined)
                    return;
                this.#latchFailure({ kind: "input", cause });
                this.#frameSignal.wake("failure");
            },
            supervisorOptions: {
                captureStdout: false,
                maxDiagnosticBytes: 256 * 1024,
                onDiagnostic: (event) => {
                    if (this.#activeDeadline?.interruption !== undefined)
                        return;
                    if (event.type === "exit" &&
                        (event.code !== 0 || event.signal !== null)) {
                        const stderr = event.snapshot.stderr.text;
                        const memoryLimitReached = event.snapshot.memoryLimitReached === true;
                        this.#latchFailure({
                            kind: "exit",
                            code: event.code,
                            signal: event.signal,
                            memoryLimitReached,
                            heapExhaustion: memoryLimitReached ||
                                /heap out of memory|heap limit|allocation failed/iu.test(stderr),
                        });
                    }
                    else if (event.type === "output-close") {
                        if (this.#activeDeadline !== undefined &&
                            (this.#activeJob === undefined ||
                                !this.#activeTerminalResponseObserved))
                            this.#latchFailure({ kind: "incomplete-output" });
                        this.#frameSignal.wake("failure");
                    }
                    else if (event.type === "output") {
                        const failure = this.#observedFailure;
                        if (failure?.kind !== "exit")
                            return;
                        const memoryLimitReached = this.#runtime.supervisor?.snapshot().memoryLimitReached === true;
                        const heapMarker = event.stream === "stderr" &&
                            /heap out of memory|heap limit|allocation failed/iu.test(this.#runtime.supervisor?.snapshot().stderr.text ?? "");
                        if (!memoryLimitReached && !heapMarker)
                            return;
                        this.#observedFailure = {
                            ...failure,
                            heapExhaustion: true,
                            memoryLimitReached: failure.memoryLimitReached || memoryLimitReached,
                        };
                    }
                },
            },
        });
        const owner = this;
        this.#cleanup = new AnalysisCleanupLease(() => this.#release(), {
            get cleanupResources() {
                return [
                    ...owner.#files.cleanupResources,
                    ...(owner.#runtime.cleanupResources ?? []),
                ];
            },
        });
    }
    static async retryPending() {
        for (const worker of [...this.#pendingCleanup])
            await worker.close();
        await OwnedWorkerRuntime.retryPending();
    }
    async analyze(script, timeoutMs, signal) {
        let deadline;
        const id = randomUUID();
        this.#observedFailure = undefined;
        this.#activeJob = undefined;
        this.#activeTerminalResponseObserved = false;
        let result;
        let completed = null;
        let continuation;
        let resultDescriptor;
        const failed = (error) => err({
            error,
            completed,
            ...(continuation === undefined ? {} : { continuation }),
        });
        try {
            if (signal?.aborted)
                throw new AnalysisCancelledError(OPERATION, { cause: signal.reason });
            const admitted = this.#admittedResultBudget();
            if (!admitted.ok) {
                continuation = "result_capacity_exhausted";
                throw admitted.error;
            }
            const resultBudget = admitted.bytes;
            await prepareProcessOwnershipInspection(signal);
            deadline = new ProviderStartupDeadline(timeoutMs, signal);
            this.#activeDeadline = deadline;
            await this.#start(deadline);
            if (this.#frames.length > 0 || this.#pending !== "")
                throw new AnalysisOutputError(OPERATION, "Web analyzer emitted unsolicited control data");
            const root = this.#runtime.rootPath;
            const supervisor = this.#runtime.supervisor;
            if (root === undefined || supervisor === undefined)
                throw new TypeError("Web analyzer resources were not acquired");
            supervisor.resetOutput();
            const source = await this.#files.run(() => this.#writeSource(join(root, `${id}.source`), script, deadline.signal));
            const request = webBundleWorkerRequestSchema.parse({
                kind: "analyze",
                id,
                source,
                result_budget_bytes: resultBudget,
            });
            const frame = `${JSON.stringify(request)}\n`;
            const stdin = supervisor.launch.process.stdin;
            if (stdin === null || stdin === undefined)
                throw new TypeError("Web analyzer request stream is unavailable");
            this.#activeJob = { id, resultBudgetBytes: resultBudget };
            this.#activeTerminalResponseObserved = false;
            await new Promise((resolve, reject) => stdin.write(frame, (error) => error == null ? resolve() : reject(error)));
            let response;
            do {
                response = await this.#next(deadline);
                if (response.kind === "ready" || response.id !== id)
                    throw new AnalysisOutputError(OPERATION, "Web analyzer response names another request");
            } while (response.kind === "phase");
            if (response.kind === "failure") {
                if (response.reason === "resource")
                    throw new AnalysisResourceConstraintError(OPERATION, "memory", response.message, { result_budget_bytes: resultBudget });
                throw new AnalysisOutputError(OPERATION, `Web script analysis failed (${response.reason}): ${response.message}`);
            }
            if (response.kind !== "complete")
                throw new AnalysisOutputError(OPERATION, "Web analyzer did not complete a result");
            const descriptor = response.result;
            resultDescriptor = descriptor;
            // Reserve expansion before reading bytes, decoding JSON or schema validation.
            if (descriptor.bytes > resultBudget ||
                descriptor.bytes * RESULT_EXPANSION + 64 * MIB >
                    getHeapStatistics().heap_size_limit - process.memoryUsage().heapUsed)
                throw new AnalysisResourceConstraintError(OPERATION, "memory", "Completed script facts exceed the host's remaining reserved result capacity", { result_budget_bytes: resultBudget });
            const stored = await this.#files.run(() => readStableArtifact(join(root, `${id}.result`), descriptor.bytes, deadline.signal, undefined, this.#files));
            const facts = this.#validateCompletedResult(stored, descriptor, script);
            this.#retainedResultBytes += descriptor.bytes;
            completed = facts;
            result = ok(facts);
        }
        catch (cause) {
            const completion = artifactFileCompletion(cause);
            const snapshot = completedStableArtifact(cause);
            if (snapshot !== undefined && resultDescriptor !== undefined) {
                try {
                    completed = this.#validateCompletedResult(snapshot, resultDescriptor, script);
                    this.#retainedResultBytes += resultDescriptor.bytes;
                }
                catch {
                    // The physical read completed, but only validated facts are retained.
                }
            }
            const cancellationCause = completion?.cancellation;
            const interrupted = deadline?.interruption === "timeout"
                ? scriptTimeout(timeoutMs, cause)
                : cancellationCause !== undefined
                    ? new AnalysisCancelledError(OPERATION, {
                        cause: cancellationCause.reason,
                    })
                    : deadline?.interruption === "cancelled" || signal?.aborted
                        ? new AnalysisCancelledError(OPERATION, {
                            cause: signal?.aborted
                                ? signal.reason
                                : deadline?.signal.reason,
                        })
                        : undefined;
            const observedFailure = this.#observedFailure === undefined
                ? undefined
                : this.#projectObservedFailure();
            if (observedFailure !== undefined && interrupted !== undefined)
                observedFailure.retainSecondaryFailure(interrupted);
            const failure = cause instanceof ArtifactFileCleanupFailure && completion !== undefined
                ? this.#cleanupFailure(cause, interrupted)
                : interrupted !== undefined && observedFailure !== undefined
                    ? observedFailure
                    : (interrupted ??
                        (cause instanceof RuntimeControlUnavailableError
                            ? runtimeControlCapabilityError(PROVIDER, OPERATION, cause)
                            : cause instanceof AnalysisError
                                ? cause
                                : new AnalysisOutputError(OPERATION, "Owned web-script analysis failed", { cause })));
            result = err(failure);
            try {
                const stopped = await this.#runtime.stop();
                if (stopped.status === "incomplete")
                    throw new Error(stopped.reason);
                this.#reset();
            }
            catch (cleanupCause) {
                result = err(this.#cleanupFailure(cleanupCause, failure));
            }
        }
        finally {
            this.#activeDeadline = undefined;
            deadline?.dispose();
            this.#activeJob = undefined;
            this.#activeTerminalResponseObserved = false;
        }
        // Never remove job files while a failed descriptor or child remains owned.
        if (!result.ok && result.error.cleanupIncomplete)
            return failed(result.error);
        if (this.#files.hasPending)
            return failed(this.#cleanupFailure(new Error("Web analyzer artifact cleanup is incomplete"), result.ok ? undefined : result.error));
        try {
            const root = this.#runtime.rootPath;
            if (root !== undefined) {
                await rm(join(root, `${id}.source`), { force: true });
                await rm(join(root, `${id}.result`), { force: true });
            }
        }
        catch (cause) {
            return failed(this.#cleanupFailure(cause, result.ok ? undefined : result.error));
        }
        if (signal?.aborted && result.ok)
            return failed(new AnalysisCancelledError(OPERATION, { cause: signal.reason }));
        return result.ok ? result : failed(result.error);
    }
    #admittedResultBudget() {
        const fixedRemaining = WEB_BUNDLE_WORKER_LIMITS.resultBytes - this.#retainedResultBytes;
        const hostCapacity = Math.max(0, Math.floor((getHeapStatistics().heap_size_limit -
            process.memoryUsage().heapUsed -
            64 * MIB) /
            RESULT_EXPANSION));
        const bytes = Math.min(fixedRemaining, hostCapacity);
        if (bytes > 0)
            return { ok: true, bytes };
        const failure = webBundleResultAdmissionFailure({
            fixedBudgetBytes: WEB_BUNDLE_WORKER_LIMITS.resultBytes,
            fixedRemainingBytes: fixedRemaining,
            hostCapacityBytes: hostCapacity,
        });
        return {
            ok: false,
            error: new AnalysisResourceConstraintError(OPERATION, "memory", failure.reason, failure.reportedLimits, failure.kind === "host-capacity"
                ? { remediationAction: failure.remediationAction }
                : undefined),
        };
    }
    async #writeSource(path, script, signal) {
        const digest = createHash("sha256");
        let bytes = 0;
        const file = await open(path, "wx", 0o600);
        await withArtifactFileHandle(path, file, this.#files, signal, async (handle) => {
            for (const part of bufferedJsonParts(jsonParts(script))) {
                signal.throwIfAborted();
                const chunk = Buffer.from(part, "utf8");
                if (chunk.length > WEB_BUNDLE_WORKER_LIMITS.sourceBytes - bytes)
                    throw new AnalysisResourceConstraintError(OPERATION, "transport", webBundleFixedByteBudget(WEB_BUNDLE_WORKER_LIMITS.sourceBytes, "worker transfer budget"), { source_bytes: WEB_BUNDLE_WORKER_LIMITS.sourceBytes });
                await handle.writeFile(chunk);
                bytes += chunk.length;
                digest.update(chunk);
            }
        });
        return { bytes, sha256: digest.digest("hex") };
    }
    async #start(deadline) {
        if (this.#ready && this.#runtime.supervisor !== undefined)
            return;
        const environment = {
            ...process.env,
            UV_THREADPOOL_SIZE: "1",
        };
        delete environment.NODE_OPTIONS;
        const memoryLimitBytes = javaScriptWorkerMemoryLimitBytes(this.heapMb);
        await this.#runtime.start({
            command: process.execPath,
            arguments: [
                `--max-old-space-size=${String(this.heapMb)}`,
                "--max-semi-space-size=8",
                "--v8-pool-size=1",
                "--expose-gc",
                "--stack_size=2048",
                fileURLToPath(import.meta.resolve("#web-bundle-analysis-worker")),
            ],
            runId: `rea-web-bundle-analysis-${randomUUID()}`,
            hostEnvironment: environment,
            stdin: "pipe",
            signal: deadline.signal,
            ...(memoryLimitBytes === null ? {} : { memoryLimitBytes }),
        }, async () => {
            this.#runtime.onStdout(this.#stdout);
            const ready = await this.#next(deadline);
            if (ready.kind !== "ready" ||
                (ready.heap_limit_bytes === null) ===
                    (javaScriptRuntime(process.versions).id === "node"))
                throw new AnalysisOutputError(OPERATION, "Web analyzer ready frame has an incompatible runtime heap limit");
            this.#ready = true;
        });
    }
    async #next(deadline) {
        for (;;) {
            if (deadline.interruption === "timeout")
                throw scriptTimeout(deadline.timeoutMs);
            if (deadline.interruption === "cancelled")
                throw new AnalysisCancelledError(OPERATION, {
                    cause: deadline.signal.reason,
                });
            deadline.signal.throwIfAborted();
            const frame = this.#frames.shift();
            if (frame !== undefined)
                return frame;
            if (this.#runtime.inputFailure !== undefined)
                this.#latchFailure({
                    kind: "input",
                    cause: this.#runtime.inputFailure,
                });
            if (this.#protocolFailure !== undefined)
                this.#latchFailure({ kind: "protocol", cause: this.#protocolFailure });
            if (this.#observedFailure !== undefined &&
                this.#observedFailure.kind !== "exit")
                throw this.#projectObservedFailure();
            const supervisor = this.#runtime.supervisor;
            const snapshot = supervisor?.snapshot();
            if (snapshot !== undefined &&
                (snapshot.exitCode !== undefined || snapshot.signal !== undefined)) {
                if (supervisor === undefined)
                    continue;
                const outcome = await this.#waitForFrameOrOutputClose(supervisor, deadline);
                if (outcome === "interrupted") {
                    const completedFrame = this.#frames.shift();
                    if (completedFrame !== undefined)
                        return completedFrame;
                    throw deadline.interruption === "timeout"
                        ? scriptTimeout(deadline.timeoutMs)
                        : new AnalysisCancelledError(OPERATION, {
                            cause: deadline.signal.reason,
                        });
                }
                const completedFrame = this.#frames.shift();
                if (completedFrame !== undefined)
                    return completedFrame;
                if (outcome === "failure")
                    throw this.#projectObservedFailure();
                if (outcome === "frame")
                    continue;
                if (this.#observedFailure !== undefined)
                    throw this.#projectObservedFailure();
                throw new AnalysisOutputError(OPERATION, "Owned web analyzer exited before completing this script", { capturedOutput: this.#capturedOutput() });
            }
            await deadline.wait(10);
        }
    }
    #latchFailure(failure) {
        if (this.#observedFailure === undefined &&
            this.#activeDeadline?.interruption === undefined)
            this.#observedFailure = failure;
    }
    #observeFrame(frame) {
        if (this.#activeDeadline?.interruption !== undefined ||
            this.#activeJob === undefined ||
            frame.kind === "ready" ||
            frame.id !== this.#activeJob.id)
            return;
        if (frame.kind === "complete" || frame.kind === "failure")
            this.#activeTerminalResponseObserved = true;
        if (frame.kind !== "failure")
            return;
        this.#latchFailure({
            kind: "frame",
            frame,
            resultBudgetBytes: this.#activeJob.resultBudgetBytes,
        });
    }
    #projectObservedFailure() {
        const failure = this.#observedFailure;
        if (failure === undefined)
            return new AnalysisOutputError(OPERATION, "Owned web analyzer exited before completing this script", { capturedOutput: this.#capturedOutput() });
        const capturedOutput = this.#capturedOutput();
        switch (failure.kind) {
            case "input":
                return new AnalysisOutputError(OPERATION, "Web analyzer request stream failed", { cause: failure.cause, capturedOutput });
            case "protocol":
                return new AnalysisOutputError(OPERATION, "Invalid web analyzer control frame", { cause: failure.cause, capturedOutput });
            case "incomplete-output":
                return new AnalysisOutputError(OPERATION, "Owned web analyzer output closed before completing this script", { capturedOutput });
            case "frame":
                return failure.frame.reason === "resource"
                    ? new AnalysisResourceConstraintError(OPERATION, "memory", failure.frame.message, {
                        result_budget_bytes: failure.resultBudgetBytes,
                    }, { capturedOutput })
                    : new AnalysisOutputError(OPERATION, `Web script analysis failed (${failure.frame.reason}): ${failure.frame.message}`, { capturedOutput });
            case "exit":
                if (failure.heapExhaustion) {
                    const exhaustion = webBundleMemoryExhaustion({
                        runtime: javaScriptRuntime(process.versions).id,
                        heapMb: this.heapMb,
                        memoryLimitReached: failure.memoryLimitReached,
                        processMemoryLimitBytes: javaScriptWorkerMemoryLimitBytes(this.heapMb),
                    });
                    return new AnalysisResourceConstraintError(OPERATION, "memory", webBundleHeapExhaustedReason(exhaustion), {
                        worker_heap_limit_mb: this.heapMb,
                        max_heap_mb: this.heapMb,
                        worker_process_memory_limit_bytes: javaScriptWorkerMemoryLimitBytes(this.heapMb),
                    }, {
                        capturedOutput,
                        remediationAction: webBundleHeapExhaustedRemediation(exhaustion),
                    });
                }
                return new AnalysisOutputError(OPERATION, "Owned web analyzer exited before completing this script", { capturedOutput });
        }
    }
    #capturedOutput() {
        const supervisor = this.#runtime.supervisor;
        const snapshot = supervisor?.snapshot();
        return {
            stdout: "",
            stderr: snapshot?.stderr.text ?? "",
            truncated: snapshot?.diagnosticTruncated === true ||
                snapshot?.outputIncomplete === true ||
                (supervisor !== undefined && !supervisor.observedOutputClose()),
            exit_code: snapshot?.exitCode ?? null,
            signal: snapshot?.signal ?? null,
        };
    }
    async #waitForFrameOrOutputClose(supervisor, deadline) {
        if (this.#frames.length > 0)
            return "frame";
        return this.#frameSignal.waitForOutputClose(supervisor, deadline.signal);
    }
    #validateCompletedResult(stored, descriptor, script) {
        if (stored.bytes.length !== descriptor.bytes ||
            stored.sha256 !== descriptor.sha256)
            throw new AnalysisOutputError(OPERATION, "Web analyzer result differs from its descriptor");
        const facts = webBundleScriptAnalysisSchema.parse(JSON.parse(stored.bytes.toString("utf8")));
        if (facts.status !== "analyzed" || facts.script_key !== script.script_key)
            throw new AnalysisOutputError(OPERATION, "Web analyzer facts name another script");
        return facts;
    }
    #reset() {
        this.#ready = false;
        this.#frames = [];
        this.#pending = "";
        this.#decoder = new StringDecoder("utf8");
        this.#protocolFailure = undefined;
        this.#observedFailure = undefined;
        this.#activeDeadline = undefined;
        this.#activeJob = undefined;
        this.#activeTerminalResponseObserved = false;
        this.#frameSignal.wake("failure");
    }
    #cleanupFailure(cause, primary) {
        _a.#pendingCleanup.add(this);
        this.#runtime.retainForCleanup();
        const cleanup = new ProviderCleanupError(PROVIDER, this.#cleanup.cleanupResources ?? [], { reason: "Owned web analyzer cleanup remains incomplete" }, { operation: OPERATION, cause });
        new AnalysisCleanupLeaseGroup(cleanup, [this.#cleanup]);
        return primary === undefined
            ? cleanup
            : analysisErrorWithCleanupFailure(primary, cleanup, OPERATION).bindCleanupDependencies([primary, cleanup]);
    }
    async close() {
        try {
            await this.#cleanup.release();
        }
        catch (cause) {
            throw this.#cleanupFailure(cause);
        }
    }
    async #release() {
        try {
            const stopped = await this.#runtime.stop();
            if (stopped.status === "incomplete")
                throw new Error(stopped.reason);
            await this.#files.close();
            await this.#runtime.close();
            this.#reset();
            _a.#pendingCleanup.delete(this);
        }
        catch (cause) {
            _a.#pendingCleanup.add(this);
            this.#runtime.retainForCleanup();
            throw cause;
        }
    }
}
_a = WebBundleAnalysisWorker;
