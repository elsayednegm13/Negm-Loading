import { deserializeMessage, serializeMessage, } from "@modelcontextprotocol/client";
import { randomUUID } from "node:crypto";
import { finished } from "node:stream/promises";
import { ProviderProcessSupervisor, spawnOwnedProviderProcess, } from "../process/ProviderProcess.js";
import { cleanupOwnedProcessGroup } from "../process/ProcessOwnership.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
const MAX_FRAME_BYTES = 8 * 1024 * 1024;
const MAX_OPERATION_BYTES = 32 * 1024 * 1024;
/** SDK-framed stdio with REA-owned process cleanup rather than an unowned child. */
export class JadxMcpTransport {
    options;
    launcher;
    onclose;
    onerror;
    onmessage;
    runId = randomUUID();
    #spawned;
    #supervisor;
    #frameBuffer = Buffer.alloc(0);
    #frameLength = 0;
    #bytes = 0;
    #started = false;
    #closed = false;
    #closePromise;
    #starting;
    #failure;
    constructor(options, launcher = spawnOwnedProviderProcess) {
        this.options = options;
        this.launcher = launcher;
    }
    /** Acquires exactly one protocol process after the SDK installs callbacks. */
    start() {
        if (this.#started || this.#closed)
            throw new Error("JADX transport cannot be restarted");
        this.#started = true;
        this.#starting = this.#acquire().catch((cause) => {
            this.#failure ??= { kind: "process", cause };
            throw cause;
        });
        return this.#starting;
    }
    async #acquire() {
        const spawned = await this.launcher({
            ...this.options,
            runId: this.runId,
            stdin: "pipe",
        });
        this.#spawned = spawned;
        this.#supervisor = new ProviderProcessSupervisor({
            ...spawned,
            ownsProcessLifetime: true,
            cleanup: spawned.cleanup ??
                (() => cleanupOwnedProcessGroup(spawned.ownership)),
        }, { captureStdout: false });
        if (spawned.process.stdin === undefined ||
            spawned.process.stdin === null ||
            spawned.process.stdout === null)
            throw new Error("JADX launcher did not supply protocol stdin/stdout");
        spawned.process.stdout.on("data", this.#read);
        spawned.process.stdout.on("error", this.#error);
        spawned.process.stderr?.on("data", this.#countStderr);
        spawned.process.on("error", this.#error);
        spawned.process.once("exit", this.#exit);
        spawned.process.stdin.on("error", this.#error);
        if (this.#closed)
            throw new Error("JADX transport closed during startup");
    }
    /** Writes SDK-serialized messages and observes stream backpressure. */
    async send(message) {
        const input = this.#spawned?.process.stdin;
        if (this.#closed || input === undefined || input === null)
            throw new Error("JADX protocol process is not writable");
        await new Promise((resolve, reject) => {
            try {
                input.write(serializeMessage(message), (cause) => {
                    if (cause === null || cause === undefined)
                        resolve();
                    else {
                        this.#failure ??= { kind: "process", cause };
                        reject(cause);
                    }
                });
            }
            catch (cause) {
                this.#failure ??= { kind: "process", cause };
                reject(cause);
            }
        });
    }
    /** Verifies owned process exit before declaring the transport closed. */
    close() {
        this.#closePromise ??= this.#stop().catch((cause) => {
            this.#closePromise = undefined;
            throw cause;
        });
        return this.#closePromise;
    }
    /** Keep the interruption reason distinct from errors produced by its teardown. */
    interrupt(reason) {
        this.#failure ??= { kind: "interrupted", reason };
        return this.close();
    }
    /** Captured provider stderr without persisting inherited environment values. */
    diagnostics() {
        const owner = this.#supervisor;
        if (owner === undefined)
            return undefined;
        const snapshot = owner.snapshot();
        return {
            stdout: "",
            stderr: snapshot.stderr.text,
            stderr_bytes: snapshot.stderr.observedBytes,
            truncated: snapshot.diagnosticTruncated === true || !owner.observedOutputClose(),
            ...(snapshot.exitCode === undefined
                ? {}
                : { exit_code: snapshot.exitCode }),
            ...(snapshot.signal === undefined ? {} : { signal: snapshot.signal }),
        };
    }
    /** Preserve the failed protocol/resource constraint after the SDK closes requests. */
    observedFailure() {
        return this.#failure;
    }
    /** Scope both the byte budget and diagnostic retention to the next serialized request. */
    beginOperation() {
        this.#bytes = 0;
        this.#supervisor?.resetOutput();
    }
    async #stop() {
        this.#closed = true;
        this.#frameBuffer = Buffer.alloc(0);
        this.#frameLength = 0;
        // A cancellation may race acquisition. Join it before inspecting ownership.
        await this.#starting?.catch(() => undefined);
        const process = this.#spawned?.process;
        process?.stdout?.off("data", this.#read);
        process?.stdout?.off("error", this.#error);
        process?.stderr?.off("data", this.#countStderr);
        process?.off("error", this.#error);
        process?.off("exit", this.#exit);
        const input = process?.stdin;
        // A job termination can complete an in-flight pipe write asynchronously.
        // Observe its errors until the owned Writable has finished closing.
        const inputClosed = input === undefined || input === null
            ? undefined
            : finished(input, { readable: false, cleanup: true }).catch(() => undefined);
        const stopped = await this.#supervisor?.stop();
        input?.destroy();
        await inputClosed;
        input?.off("error", this.#error);
        this.onclose?.();
        if (stopped?.status === "incomplete")
            throw new ProviderCleanupError("jadx", [this.runId], {
                reason: stopped.reason,
                stderr: this.diagnostics()?.stderr ?? "",
            });
    }
    #error = (error) => {
        this.#failure ??= { kind: "process", cause: error };
        this.onerror?.(error);
        // Reject pending SDK work after joining the same owned teardown on every path.
        void this.close().catch((cause) => this.onerror?.(cause instanceof Error ? cause : new Error(String(cause))));
    };
    #exit = () => {
        this.#failure ??= { kind: "exit" };
        this.onclose?.();
    };
    #countStderr = (chunk) => {
        this.#bytes += Buffer.byteLength(chunk);
        if (this.#bytes > MAX_OPERATION_BYTES)
            this.#fail(new Error(`JADX operation output exceeds ${MAX_OPERATION_BYTES} bytes; no complete result is available`));
    };
    #read = (chunk) => {
        if (this.#closed)
            return;
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        this.#bytes += bytes.length;
        if (this.#bytes > MAX_OPERATION_BYTES) {
            this.#fail(new Error(`JADX operation output exceeds ${MAX_OPERATION_BYTES} bytes; no complete result is available`));
            return;
        }
        try {
            let offset = 0;
            while (offset < bytes.length) {
                const newline = bytes.indexOf(10, offset);
                const end = newline === -1 ? bytes.length : newline;
                const fragment = bytes.subarray(offset, end);
                const frameBytes = this.#frameLength + fragment.length;
                if (frameBytes > MAX_FRAME_BYTES)
                    throw new Error(`JADX MCP frame exceeds ${MAX_FRAME_BYTES} bytes`);
                this.#appendFrame(fragment, frameBytes);
                if (newline === -1)
                    return;
                const line = new TextDecoder("utf-8", {
                    fatal: true,
                    // Preserve a leading BOM so the JSON-RPC parser can reject it.
                    ignoreBOM: true,
                }).decode(this.#frameBuffer.subarray(0, this.#frameLength));
                this.#frameBuffer = Buffer.alloc(0);
                this.#frameLength = 0;
                this.onmessage?.(deserializeMessage(line));
                offset = newline + 1;
            }
        }
        catch (cause) {
            this.#fail(cause instanceof Error ? cause : new Error(String(cause)));
        }
    };
    #appendFrame(fragment, frameBytes) {
        if (frameBytes > this.#frameBuffer.length) {
            const capacity = Math.min(MAX_FRAME_BYTES, Math.max(frameBytes, this.#frameBuffer.length * 2, 1));
            const grown = Buffer.allocUnsafe(capacity);
            this.#frameBuffer.copy(grown, 0, 0, this.#frameLength);
            this.#frameBuffer = grown;
        }
        fragment.copy(this.#frameBuffer, this.#frameLength);
        this.#frameLength = frameBytes;
    }
    #fail(error) {
        this.#failure ??= { kind: "protocol", cause: error };
        this.#error(error);
    }
}
