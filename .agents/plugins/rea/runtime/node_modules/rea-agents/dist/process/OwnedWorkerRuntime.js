var _a;
import { PrivateRuntimeRoot } from "./PrivateRuntimeRoot.js";
import { ProviderProcessSupervisor, spawnOwnedProviderProcess, } from "./ProviderProcess.js";
import { cleanupOwnedProcessGroup } from "./ProcessOwnership.js";
export class OwnedWorkerRuntimeCleanupError extends Error {
    cleanupResources;
    processId;
    #cleanupEpoch;
    constructor(cleanupResources, processId, message, cleanupEpoch, options) {
        super(message, options);
        this.cleanupResources = cleanupResources;
        this.processId = processId;
        this.name = "OwnedWorkerRuntimeCleanupError";
        this.#cleanupEpoch = cleanupEpoch;
    }
    bindCleanupFailure(error) {
        if (this.#cleanupEpoch === undefined) {
            error.bindCleanupResourceOwner(releasedCleanupOwner);
            error.resolveCleanup();
            return;
        }
        this.#cleanupEpoch.bind(error);
    }
}
/** A root's cleanup attribution is stable even after this runtime is reused. */
class OwnedWorkerRuntimeCleanupEpoch {
    rootPath;
    #released = false;
    #runId;
    #failures = [];
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    get cleanupResources() {
        return this.#released
            ? []
            : [...(this.#runId === undefined ? [] : [this.#runId]), this.rootPath];
    }
    setRunId(runId) {
        if (!this.#released)
            this.#runId = runId;
    }
    bind(error) {
        error.bindCleanupResourceOwner(this);
        if (this.#released) {
            error.resolveCleanup();
            return;
        }
        this.#failures = [
            ...this.#failures.filter((reference) => reference.deref() !== undefined),
            new WeakRef(error),
        ];
    }
    release() {
        if (this.#released)
            return;
        this.#released = true;
        for (const reference of this.#failures)
            reference.deref()?.resolveCleanup();
        this.#failures = [];
    }
}
/** Own the private root and process lifecycle shared by sequential workers. */
export class OwnedWorkerRuntime {
    options;
    static #pending = new Set();
    #root;
    #cleanupEpoch;
    #supervisor;
    #processId = null;
    #acquisition;
    #cleanupRetryAttempt;
    #stopAttempt;
    #closeAttempt;
    #closing = false;
    #closed = false;
    #lastRunId;
    #terminalCloseRequested = false;
    #inputFailure;
    #stdinGeneration = 0;
    #stdoutListeners = new Set();
    constructor(options) {
        this.options = options;
    }
    get rootPath() {
        return this.#root?.path;
    }
    /** Exposes the exact supervisor so consumers retain their protocol policy. */
    get supervisor() {
        return this.#supervisor;
    }
    get cleanupResources() {
        const resources = [
            ...(this.#supervisor === undefined
                ? []
                : [this.#supervisor.launch.ownership?.runId ?? this.#lastRunId]),
            ...(this.#root === undefined ? [] : [this.#root.path]),
        ].filter((resource) => resource !== undefined);
        return resources.length === 0 ? [] : resources;
    }
    /** Whether this exact owner still retains an unconfirmed resource release. */
    get hasPendingCleanup() {
        return _a.#pending.has(this);
    }
    /** First error observed on the current child's request stream, if any. */
    get inputFailure() {
        return this.#inputFailure;
    }
    /** Keep a returned typed cleanup error live until this exact owner releases. */
    bindCleanupFailure(error) {
        if (this.#cleanupEpoch === undefined) {
            error.bindCleanupResourceOwner(releasedCleanupOwner);
            error.resolveCleanup();
            return;
        }
        this.#cleanupEpoch.bind(error);
    }
    /** Mark this still-owned runtime for retry before any consumer starts a child. */
    retainForCleanup() {
        _a.#pending.add(this);
    }
    /** Retry every earlier worker owner before any consumer admits a new child. */
    static async retryPending(except) {
        for (const owner of [...this.#pending])
            if (owner !== except)
                await owner.#retryPending();
    }
    /**
     * Acquire one child and let the protocol owner complete its own handshake.
     * Close waits for this entire callback, including a late handshake.
     */
    start(spawnOptions, initialize) {
        if (this.#terminalCloseRequested || this.#closing)
            return Promise.reject(new Error("Owned worker runtime is closing"));
        if (this.#acquisition !== undefined)
            return this.#acquisition;
        if (this.#supervisor !== undefined &&
            !_a.#pending.has(this))
            return Promise.resolve();
        if (this.options.retryCleanup !== undefined &&
            _a.#pending.has(this))
            return this.#retryOwnedCleanup().then(() => {
                if (this.#terminalCloseRequested || this.#closing)
                    throw new Error("Owned worker runtime is closing");
                return this.start(spawnOptions, initialize);
            });
        const ownRetry = _a.#pending.has(this)
            ? this.#retryPending()
            : Promise.resolve();
        const acquisition = ownRetry.then(async () => {
            if (this.#closed)
                this.#closed = false;
            await this.#start(spawnOptions, initialize);
        });
        this.#acquisition = acquisition;
        void acquisition
            .finally(() => {
            if (this.#acquisition === acquisition)
                this.#acquisition = undefined;
        })
            .catch(() => undefined);
        return acquisition;
    }
    /** Attach protocol stdout while ensuring it is detached before process stop. */
    onStdout(listener) {
        const stream = this.#supervisor?.launch.process.stdout;
        if (stream === null || stream === undefined)
            throw new Error("Owned worker runtime has no stdout stream");
        stream.on("data", listener);
        this.#stdoutListeners.add({ stream, listener });
    }
    stop() {
        if (this.#stopAttempt !== undefined)
            return this.#stopAttempt;
        const attempt = this.#stop();
        this.#stopAttempt = attempt;
        void attempt
            .finally(() => {
            if (this.#stopAttempt === attempt)
                this.#stopAttempt = undefined;
        })
            .catch(() => undefined);
        return attempt;
    }
    /** Stop the exact child before releasing its root; every failure is retryable. */
    close() {
        this.#terminalCloseRequested = true;
        this.#closing = true;
        if (this.#closed)
            return Promise.resolve();
        if (this.#closeAttempt !== undefined)
            return this.#closeAttempt;
        const attempt = this.#close();
        this.#closeAttempt = attempt;
        void attempt
            .finally(() => {
            if (this.#closeAttempt === attempt)
                this.#closeAttempt = undefined;
        })
            .catch(() => undefined);
        return attempt;
    }
    async #retryPending() {
        if (this.options.retryCleanup !== undefined)
            return this.#retryOwnedCleanup();
        if (this.#terminalCloseRequested)
            return this.close();
        this.#closing = true;
        if (this.#closeAttempt === undefined) {
            const attempt = this.#close();
            this.#closeAttempt = attempt;
            void attempt
                .finally(() => {
                if (this.#closeAttempt === attempt)
                    this.#closeAttempt = undefined;
            })
                .catch(() => undefined);
        }
        const attempt = this.#closeAttempt;
        if (attempt === undefined)
            return;
        try {
            await attempt;
            if (!this.#terminalCloseRequested) {
                this.#closed = false;
                this.#closing = false;
            }
        }
        catch (cause) {
            if (!this.#terminalCloseRequested)
                this.#closing = false;
            throw cause;
        }
    }
    #retryOwnedCleanup() {
        if (this.#cleanupRetryAttempt !== undefined)
            return this.#cleanupRetryAttempt;
        const attempt = Promise.resolve()
            .then(() => this.options.retryCleanup?.())
            .then(() => {
            if (_a.#pending.has(this))
                throw this.#cleanupError("Higher-level cleanup retry returned while ownership remains pending");
        });
        this.#cleanupRetryAttempt = attempt;
        void attempt
            .finally(() => {
            if (this.#cleanupRetryAttempt === attempt)
                this.#cleanupRetryAttempt = undefined;
        })
            .catch(() => undefined);
        return attempt;
    }
    async #start(spawnOptions, initialize) {
        await _a.retryPending(this);
        if (this.#closing)
            throw new Error("Owned worker runtime is closing");
        this.#root ??= await PrivateRuntimeRoot.create({
            prefix: this.options.rootPrefix,
        });
        this.#cleanupEpoch ??= new OwnedWorkerRuntimeCleanupEpoch(this.#root.path);
        if (this.#closing)
            throw new Error("Owned worker runtime is closing");
        this.#lastRunId = spawnOptions.runId;
        const spawned = await (this.options.launcher ?? spawnOwnedProviderProcess)({
            ...spawnOptions,
            cwd: this.#root.path,
        });
        this.#inputFailure = undefined;
        this.#observeStdin(spawned.process.stdin);
        this.#processId = spawned.process.pid ?? null;
        this.#cleanupEpoch.setRunId(spawned.ownership?.runId ?? spawnOptions.runId);
        this.#supervisor = new ProviderProcessSupervisor({
            ...spawned,
            ownsProcessLifetime: true,
            cleanup: spawned.cleanup ??
                (() => cleanupOwnedProcessGroup(spawned.ownership)),
        }, this.options.supervisorOptions);
        // A close may have begun while spawn was pending. Adopt the process first;
        // close waits for this acquisition and then stops the exact adopted owner.
        if (this.#closing)
            throw new Error("Owned worker runtime is closing");
        await initialize?.(this.#supervisor);
        if (this.#closing)
            throw new Error("Owned worker runtime is closing");
    }
    async #stop() {
        const acquisition = this.#acquisition;
        if (acquisition !== undefined)
            await acquisition.catch(() => undefined);
        const supervisor = this.#supervisor;
        if (supervisor === undefined)
            return { status: "already-exited" };
        this.#detachStdout();
        const stopped = await supervisor.stop();
        if (stopped.status === "incomplete") {
            _a.#pending.add(this);
            const stdin = supervisor.launch.process.stdin;
            if (stdin !== undefined &&
                stdin !== null &&
                !stdin.destroyed &&
                !stdin.writableEnded) {
                try {
                    stdin.end();
                }
                catch {
                    // Closing stdin is cooperative only; retain the original stop failure.
                }
            }
            return stopped;
        }
        supervisor.dispose();
        this.#supervisor = undefined;
        this.#processId = null;
        this.#cleanupEpoch?.setRunId(undefined);
        return stopped;
    }
    async #close() {
        const acquisition = this.#acquisition;
        if (acquisition !== undefined)
            await acquisition.catch(() => undefined);
        const stopped = await this.stop();
        if (stopped.status === "incomplete")
            throw this.#cleanupError(stopped.reason);
        if (this.#root !== undefined) {
            try {
                await this.#root.close();
                this.#root = undefined;
                this.#cleanupEpoch?.release();
                this.#cleanupEpoch = undefined;
            }
            catch (cause) {
                _a.#pending.add(this);
                throw this.#cleanupError(message(cause), cause);
            }
        }
        this.#closed = true;
        _a.#pending.delete(this);
    }
    #detachStdout() {
        for (const { stream, listener } of this.#stdoutListeners)
            stream.off("data", listener);
        this.#stdoutListeners.clear();
    }
    #observeStdin(stream) {
        if (stream === null || stream === undefined)
            return;
        const generation = ++this.#stdinGeneration;
        const onError = (cause) => {
            if (generation !== this.#stdinGeneration ||
                this.#inputFailure !== undefined)
                return;
            this.#inputFailure =
                cause instanceof Error
                    ? cause
                    : new Error("Owned worker request stream failed", { cause });
            this.options.onInputFailure?.(this.#inputFailure);
        };
        const onClose = () => {
            stream.off("error", onError);
            stream.off("close", onClose);
        };
        stream.on("error", onError);
        stream.once("close", onClose);
    }
    #cleanupError(reason, cause) {
        const resources = this.cleanupResources ?? [];
        return new OwnedWorkerRuntimeCleanupError(resources, this.#supervisor?.launch.process.pid ?? null, reason, this.#cleanupEpoch, cause === undefined ? undefined : { cause });
    }
}
_a = OwnedWorkerRuntime;
const releasedCleanupOwner = { cleanupResources: [] };
const message = (cause) => cause instanceof Error ? cause.message : String(cause);
