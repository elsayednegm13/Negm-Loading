import { AnalysisCancelledError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { err } from "../domain/result.js";
import { SharedStartupAttempt } from "../process/SharedStartupAttempt.js";
import { DEFAULT_REGEX_MATCHING_DEADLINE, } from "../config/regexMatchingDeadline.js";
import { DEFAULT_REGEX_WORKER_HEAP_REQUEST, } from "../config/regexWorkerHeapRequest.js";
import { matchRegexValues } from "../process/RegexMatcher.js";
import { KUNA_DIAGNOSTIC_BYTES } from "./KunaLimits.js";
import { KunaRunSlots } from "./KunaRunSlots.js";
/** Shared admission, cancellation and cleanup for session metadata queries. */
export class KunaQueryWork {
    commands;
    lifetime;
    deadline;
    heapRequest;
    #nativeSlots = new KunaRunSlots(1);
    #regexSlots = new KunaRunSlots(1);
    constructor(commands, lifetime, deadline = DEFAULT_REGEX_MATCHING_DEADLINE, heapRequest = DEFAULT_REGEX_WORKER_HEAP_REQUEST) {
        this.commands = commands;
        this.lifetime = lifetime;
        this.deadline = deadline;
        this.heapRequest = heapRequest;
    }
    /** Unproven process cleanup retains both leases in the native command owner. */
    async run(request) {
        const local = await this.#nativeSlots.acquire(request.signal);
        if (local === undefined)
            return err(new AnalysisCancelledError(request.operation, {
                cause: request.signal.reason,
            }));
        let release;
        try {
            const foreground = await this.lifetime.runSlots.acquire(request.signal);
            if (foreground === undefined) {
                local();
                return err(new AnalysisCancelledError(request.operation, {
                    cause: request.signal.reason,
                }));
            }
            release = () => {
                foreground();
                local();
            };
            return await this.commands.run({ ...request, releaseRun: release });
        }
        catch (cause) {
            if (release === undefined)
                local();
            else
                release();
            throw cause;
        }
    }
    /**
     * Run a whole-program command whose stdout `reader` validates as it
     * arrives. A rejected document stops Kuna and reports why; diagnostics
     * beyond their buffer recur for this target and executable, so they are
     * passed to `retain` for the session to keep.
     */
    async scan(request, reader, signal, retain) {
        const run = await this.run({
            ...request,
            outputBytes: KUNA_DIAGNOSTIC_BYTES,
            stdout: reader,
            signal: AbortSignal.any([signal, reader.rejected]),
        });
        if (run.ok)
            return reader.finish(run.value.input);
        const rejection = reader.rejection;
        if (rejection !== undefined &&
            run.error instanceof AnalysisCancelledError &&
            !signal.aborted)
            return err(rejection);
        if (run.error instanceof AnalysisResourceConstraintError &&
            run.error.resource === "memory")
            retain(run.error);
        return run;
    }
    /** Bound inventory copies and regex workers; close cancels and drains both. */
    match(input) {
        const signal = AbortSignal.any([
            this.lifetime.signal,
            ...(input.signal === undefined ? [] : [input.signal]),
        ]);
        return this.lifetime.own(this.#match(input, signal));
    }
    async #match(input, signal) {
        const release = await this.#regexSlots.acquire(signal);
        if (release === undefined)
            return err(new AnalysisCancelledError(input.operation, { cause: signal.reason }));
        try {
            return await matchRegexValues({
                ...input,
                values: input.values(),
                signal,
                deadline: this.deadline,
                heapRequest: this.heapRequest,
            });
        }
        finally {
            release();
        }
    }
    start(load, accept) {
        const pending = new SharedStartupAttempt((signal) => this.lifetime.own(load(signal)), this.lifetime.signal);
        void pending.promise.then((result) => {
            if (result.ok && !pending.signal.aborted)
                accept(result.value);
        }, () => { });
        return pending;
    }
    async wait(pending, signal, operation) {
        const waited = await pending.wait(signal);
        if (waited.status === "completed")
            return waited.value;
        // Final departure retains all producer failures, including a typed
        // cancellation with captured facts or incomplete cleanup.
        if (waited.status === "stopped" && !waited.value.ok)
            return waited.value;
        return err(new AnalysisCancelledError(operation, { cause: signal?.reason }));
    }
}
