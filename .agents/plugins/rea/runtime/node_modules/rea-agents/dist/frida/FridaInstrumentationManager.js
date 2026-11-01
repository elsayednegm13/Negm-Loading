import { isUtf8 } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { FridaScriptLoadCancelledError } from "../application/frida/FridaInstrumentationPort.js";
import { AnalysisAccessDeniedError, AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisInputError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { AnalysisCleanupLease } from "../artifacts/AnalysisCleanupLease.js";
import { jsonStringByteLength } from "../domain/jsonStringByteLength.js";
import { err, ok } from "../domain/result.js";
import { unknownFridaScript, unknownFridaSession, } from "../application/frida/fridaInputErrors.js";
import { MAX_BINARY_MESSAGE_BYTES, MAX_CAPTURE_JSON_NODES, MAX_JSON_DEPTH, MAX_MESSAGE_METADATA_BYTES, MAX_MESSAGE_TEXT_BYTES, MAX_MESSAGE_TYPE_BYTES, MAX_SESSION_CAPTURE_BYTES, } from "./fridaCaptureLimits.js";
const DEVICE_LOOKUP_TIMEOUT_MS = 1_000;
/**
 * Frida Core 17.23.2 raises this from `getDeviceById` only after the supplied
 * timeout elapses without a match. A closed manager or backend failure uses a
 * different message and is not this deadline.
 */
const FRIDA_DEVICE_LOOKUP_TIMEOUT_MESSAGE = "Device not found";
const isFridaDeviceLookupTimeout = (cause) => cause instanceof Error &&
    cause.message === FRIDA_DEVICE_LOOKUP_TIMEOUT_MESSAGE;
export const FRIDA_PROVIDER_IDENTITY = {
    id: "frida",
    name: "Frida",
    version: null,
};
/** Owns Frida sessions and their scripts without owning target process lifetime. */
export class FridaInstrumentationManager {
    #sessions = new Map();
    #pendingStartups = new Set();
    #cleanupLeases = new WeakMap();
    #sessionQueues = new Map();
    #sessionClosures = new Map();
    #remoteDevices = new Map();
    #remoteQueues = new Map();
    #deviceManagerLoader;
    #deviceManager;
    #deviceManagerLoading;
    #availabilityFailure;
    #operations = new Set();
    #closing = false;
    #closeAllPromise;
    constructor(options = {}) {
        this.#deviceManager = options.deviceManager;
        this.#deviceManagerLoader =
            options.deviceManagerLoader ??
                (async () => (await import("frida")).getDeviceManager());
    }
    availabilityFailure() {
        return this.#availabilityFailure;
    }
    listDevices(remote) {
        return this.#withOperation("list_frida_devices", () => this.#listDevices(remote));
    }
    async #listDevices(remote) {
        let manager;
        let remoteHeld = false;
        try {
            manager = await this.#getDeviceManager();
            if (remote !== undefined) {
                await this.#retainRemote(manager, remote);
                remoteHeld = true;
            }
            const devices = await manager.enumerateDevices();
            let cleanupError = null;
            if (manager !== undefined && remoteHeld && remote !== undefined) {
                try {
                    await this.#releaseRemote(manager, remote.address);
                    remoteHeld = false;
                }
                catch (cause) {
                    cleanupError = sanitizeError(cause, remote);
                }
            }
            return ok({
                devices: devices.map((device) => ({
                    deviceId: device.id,
                    name: device.name,
                    type: device.type,
                })),
                cleanupError,
            });
        }
        catch (cause) {
            let cleanupError;
            if (manager !== undefined && remoteHeld && remote !== undefined) {
                try {
                    await this.#releaseRemote(manager, remote.address);
                }
                catch (cleanupCause) {
                    cleanupError = sanitizeError(cleanupCause, remote);
                }
            }
            const failure = providerError("list_frida_devices", cause, remote, cleanupError);
            const reference = remote === undefined
                ? undefined
                : this.#remoteDevices.get(remote.address);
            if (reference !== undefined && failure.cleanupIncomplete)
                this.#retainCleanupFailure(reference, failure);
            return err(failure);
        }
    }
    listProcesses(selector) {
        return this.#withOperation("list_frida_processes", () => this.#listProcesses(selector));
    }
    async #listProcesses(selector) {
        let manager;
        let remoteHeld = false;
        try {
            manager = await this.#getDeviceManager();
            const device = await this.#selectDevice(manager, selector);
            remoteHeld = selector.remote !== undefined;
            const processes = await device.enumerateProcesses();
            let cleanupError = null;
            if (remoteHeld && selector.remote !== undefined) {
                try {
                    await this.#releaseRemote(manager, selector.remote.address);
                    remoteHeld = false;
                }
                catch (cause) {
                    cleanupError = sanitizeError(cause, selector.remote);
                }
            }
            return ok({
                deviceId: device.id,
                processes: processes.map((process) => ({
                    pid: process.pid,
                    name: process.name,
                    identifier: null,
                })),
                cleanupError,
            });
        }
        catch (cause) {
            let cleanupError;
            if (manager !== undefined &&
                remoteHeld &&
                selector.remote !== undefined) {
                try {
                    await this.#releaseRemote(manager, selector.remote.address);
                }
                catch (cleanupCause) {
                    cleanupError = sanitizeError(cleanupCause, selector.remote);
                }
            }
            const failure = providerError("list_frida_processes", cause, selector.remote, cleanupError);
            const reference = selector.remote === undefined
                ? undefined
                : this.#remoteDevices.get(selector.remote.address);
            if (reference !== undefined && failure.cleanupIncomplete)
                this.#retainCleanupFailure(reference, failure);
            return err(failure);
        }
    }
    startSession(input) {
        return this.#withOperation("start_frida_session", () => this.#startSession(input));
    }
    async #startSession(input) {
        let manager;
        let device;
        let remoteHeld = false;
        let spawnedPid;
        let session;
        try {
            manager = await this.#getDeviceManager();
            device = await this.#selectDevice(manager, input);
            remoteHeld = input.remote !== undefined;
            let pid;
            let target;
            if (input.mode === "attach") {
                pid = input.pid;
                target = `pid ${pid}`;
                try {
                    const process = await device.getProcessByPid(pid);
                    target = `${process.name} (pid ${pid})`;
                }
                catch {
                    // Frida can attach to processes absent from its enumeration snapshot.
                }
            }
            else {
                pid = await device.spawn(input.program, input.argv === undefined
                    ? undefined
                    : { argv: [input.program, ...input.argv] });
                spawnedPid = pid;
                target = input.program;
            }
            session = await device.attach(pid);
            const id = randomUUID();
            const managed = {
                id,
                device,
                deviceManager: manager,
                remote: input.remote,
                remoteReferenceHeld: remoteHeld,
                remoteRemovalPending: false,
                session,
                target,
                pid,
                mode: input.mode,
                scripts: new Map(),
                messages: new MessageFifo(),
                scriptCaptures: new Map(),
                detached: false,
                targetResumeObserved: false,
                resumeAfterDetachPending: false,
                capturedBytes: 0,
                messagesTruncated: false,
            };
            session.detached.connect(() => {
                managed.detached = true;
            });
            // A target can exit while metadata lookup/attach is pending, before
            // Frida installs this listener. Subscribe first, then reconcile the
            // current provider state so an already-emitted detach is not lost.
            if (session.isDetached())
                managed.detached = true;
            this.#sessions.set(id, managed);
            return ok(sessionObservation(managed));
        }
        catch (cause) {
            let cleanupFailures = [];
            let pendingCleanup;
            if (manager !== undefined &&
                device !== undefined &&
                (spawnedPid !== undefined || session !== undefined || remoteHeld)) {
                const pending = {
                    id: randomUUID(),
                    device,
                    deviceManager: manager,
                    remote: input.remote,
                    remoteReferenceHeld: remoteHeld,
                    remoteRemovalPending: false,
                    spawnedPid,
                    session,
                };
                // Keep the original provider handles until every acquired resource is
                // released, including failures before a session can be registered.
                this.#pendingStartups.add(pending);
                pendingCleanup = pending;
                cleanupFailures = await this.#cleanupStartup(pending);
            }
            const failure = providerError("start_frida_session", cause, input.remote, cleanupFailures.join("; ") || undefined);
            if (pendingCleanup !== undefined && failure.cleanupIncomplete)
                this.#retainCleanupFailure(pendingCleanup, failure);
            return err(failure);
        }
    }
    loadScript(sessionId, source, signal) {
        return this.#withOperation("load_frida_script", () => this.#withSessionLock(sessionId, () => this.#loadScript(sessionId, source, signal)), signal);
    }
    async #loadScript(sessionId, source, signal) {
        if (signal?.aborted)
            return err(cancelledOperation("load_frida_script", signal));
        const managed = this.#sessions.get(sessionId);
        if (managed === undefined || managed.detached)
            return err(unknownFridaSession("load_frida_script", sessionId));
        let scriptSource;
        let sourceSha256;
        let sourceRepresentation;
        try {
            const selectedSource = source.sourceKind === "inline"
                ? source.source
                : await readFile(source.path);
            sourceSha256 = createHash("sha256").update(selectedSource).digest("hex");
            scriptSource =
                typeof selectedSource === "string"
                    ? selectedSource
                    : selectedSource.toString("utf8");
            if (typeof selectedSource !== "string" && !isUtf8(selectedSource))
                sourceRepresentation = {
                    encoding: "utf8",
                    decoding: "replacement",
                    loadedSourceSha256: createHash("sha256")
                        .update(scriptSource)
                        .digest("hex"),
                };
        }
        catch (cause) {
            const sourcePath = source.sourceKind === "file" ? source.path : undefined;
            return err(cause instanceof Error &&
                "code" in cause &&
                (cause.code === "EACCES" || cause.code === "EPERM")
                ? new AnalysisAccessDeniedError("load_frida_script", sourcePath ?? "<inline>", cause.code, { cause })
                : new AnalysisInputError("load_frida_script", { cause }, [
                    {
                        path: ["path"],
                        reason: "invalid_value",
                        message: `Cannot read Frida script file ${sourcePath ?? "<inline>"}.`,
                    },
                ]));
        }
        if (signal?.aborted)
            return err(cancelledOperation("load_frida_script", signal));
        const scriptId = randomUUID();
        const capture = {
            messages: new MessageFifo(),
            truncated: false,
        };
        managed.scriptCaptures.set(scriptId, capture);
        const onMessage = (message, data) => {
            this.#recordMessage(managed, scriptId, message, data);
        };
        let entry;
        let nativeFailure;
        try {
            const nativeScript = await managed.session.createScript(scriptSource, {
                name: `rea-${scriptId}`,
            });
            entry = {
                id: scriptId,
                name: `rea-${scriptId}`,
                script: nativeScript,
                onMessage,
                state: "active",
            };
            managed.scripts.set(scriptId, entry);
            nativeScript.message.connect(onMessage);
            if (!signal?.aborted)
                await nativeScript.load();
        }
        catch (cause) {
            nativeFailure = { cause };
        }
        // Settle the primary outcome before cleanup: a later abort cannot replace
        // an already observed native failure. Keep the capture through cleanup,
        // including callbacks emitted while unload/disconnect are completing.
        const cancellation = signal?.aborted
            ? { reason: signal.reason }
            : undefined;
        let cleanupReason;
        if (nativeFailure !== undefined || cancellation !== undefined) {
            if (entry === undefined)
                managed.scriptCaptures.delete(scriptId);
            else
                cleanupReason = await this.#releaseScript(managed, entry);
        }
        if (nativeFailure !== undefined && cancellation === undefined) {
            const failure = providerError("load_frida_script", nativeFailure.cause, managed.remote, cleanupReason);
            if (entry !== undefined && failure.cleanupIncomplete)
                this.#retainCleanupFailure(entry, failure);
            return err(failure);
        }
        const observation = {
            scriptId,
            sourceKind: source.sourceKind,
            sourcePath: source.sourceKind === "file" ? source.path : null,
            sourceSha256,
            ...(sourceRepresentation === undefined ? {} : { sourceRepresentation }),
            messages: capture.messages.toArray(),
            messagesTruncated: capture.truncated,
        };
        if (cancellation !== undefined) {
            const failure = new FridaScriptLoadCancelledError(observation, {
                cause: cancellation.reason,
                scriptHandleAcquired: entry !== undefined,
                ...(nativeFailure === undefined
                    ? {}
                    : {
                        diagnostics: {
                            native_failure: sanitizeError(nativeFailure.cause, managed.remote),
                        },
                    }),
                ...(cleanupReason === undefined
                    ? {}
                    : {
                        cleanup: {
                            reason: cleanupReason,
                            resources: [sessionId, scriptId],
                        },
                    }),
            });
            if (entry !== undefined && failure.cleanupIncomplete)
                this.#retainCleanupFailure(entry, failure);
            return err(failure);
        }
        return ok(observation);
    }
    resumeSession(sessionId, signal) {
        return this.#withOperation("resume_frida_session", () => this.#withSessionLock(sessionId, () => signal?.aborted
            ? Promise.resolve(err(cancelledOperation("resume_frida_session", signal)))
            : this.#resumeSession(sessionId)), signal);
    }
    async #resumeSession(sessionId) {
        const managed = this.#sessions.get(sessionId);
        if (managed === undefined || managed.detached)
            return err(unknownFridaSession("resume_frida_session", sessionId));
        if (managed.mode !== "spawn" || managed.targetResumeObserved)
            return err(new AnalysisInputError("resume_frida_session", {
                userMessage: "Only a paused process spawned by this session can be resumed.",
            }, [
                {
                    path: ["session_id"],
                    reason: "invalid_value",
                    message: "Select a paused process spawned by this session.",
                },
            ]));
        const pendingScripts = [...managed.scripts.values()].filter((entry) => entry.state === "cleanup-pending" && !entry.script.isDestroyed);
        if (pendingScripts.length > 0) {
            const reason = "Frida script cleanup is incomplete; unload the retained scripts or close the session before resuming.";
            return err(new AnalysisCapabilityUnavailableError("frida", "resume_frida_session", reason, {
                cleanup: {
                    reason,
                    resources: pendingScripts.map((entry) => entry.id),
                },
            }));
        }
        try {
            await managed.device.resume(managed.pid);
            managed.targetResumeObserved = true;
            managed.resumeAfterDetachPending = false;
            return ok(null);
        }
        catch (cause) {
            return err(providerError("resume_frida_session", cause, managed.remote));
        }
    }
    unloadScript(sessionId, scriptId, signal) {
        return this.#withOperation("unload_frida_script", () => this.#withSessionLock(sessionId, () => signal?.aborted
            ? Promise.resolve(err(cancelledOperation("unload_frida_script", signal)))
            : this.#unloadScript(sessionId, scriptId)), signal);
    }
    async #unloadScript(sessionId, scriptId) {
        const managed = this.#sessions.get(sessionId);
        const entry = managed?.scripts.get(scriptId);
        if (managed === undefined)
            return err(unknownFridaSession("unload_frida_script", sessionId));
        if (entry === undefined)
            return err(unknownFridaScript("unload_frida_script", scriptId));
        const cleanupReason = await this.#releaseScript(managed, entry);
        if (cleanupReason === undefined)
            return ok(null);
        return err(this.#retainCleanupFailure(entry, providerError("unload_frida_script", new Error(cleanupReason), managed.remote, cleanupReason)));
    }
    async #releaseScript(managed, entry, parentSessionReleased = false) {
        if (parentSessionReleased || entry.script.isDestroyed)
            entry.state = "released";
        if (entry.state !== "released") {
            entry.state = "cleanup-pending";
            try {
                await entry.script.unload();
                entry.state = "released";
            }
            catch (cause) {
                if (entry.script.isDestroyed)
                    entry.state = "released";
                else
                    return sanitizeError(cause, managed.remote);
            }
        }
        try {
            entry.script.message.disconnect(entry.onMessage);
        }
        catch (cause) {
            return sanitizeError(cause, managed.remote);
        }
        managed.scripts.delete(entry.id);
        managed.scriptCaptures.delete(entry.id);
        await this.#resolveCleanupFailures(entry);
        return undefined;
    }
    status(sessionId) {
        const managed = this.#sessions.get(sessionId);
        if (managed === undefined)
            return undefined;
        return {
            ...sessionObservation(managed),
            targetResumeObserved: managed.targetResumeObserved,
            scripts: [...managed.scripts.values()].map(({ id, name }) => ({
                scriptId: id,
                name,
            })),
            messages: managed.messages
                .toArray()
                .map(({ observation }) => observation),
            messagesTruncated: managed.messagesTruncated,
        };
    }
    closeSession(sessionId) {
        const pending = this.#sessionClosures.get(sessionId);
        if (pending !== undefined)
            return pending;
        const closing = this.#withSessionLock(sessionId, () => this.#closeSession(sessionId));
        this.#sessionClosures.set(sessionId, closing);
        const clear = () => {
            if (this.#sessionClosures.get(sessionId) === closing)
                this.#sessionClosures.delete(sessionId);
        };
        void closing.then(clear, clear);
        return closing;
    }
    async #closeSession(sessionId) {
        const managed = this.#sessions.get(sessionId);
        if (managed === undefined)
            return err(unknownFridaSession("close_frida_session", sessionId));
        const scriptFailures = new Map();
        const cleanupFailures = [];
        managed.detached ||= managed.session.isDetached();
        let parentSessionReleased = managed.detached;
        const shouldResumePausedSpawn = managed.mode === "spawn" &&
            ((!parentSessionReleased && !managed.targetResumeObserved) ||
                managed.resumeAfterDetachPending);
        let targetResumeObserved = managed.targetResumeObserved;
        for (const entry of [...managed.scripts.values()]) {
            const failure = await this.#releaseScript(managed, entry, parentSessionReleased);
            if (failure !== undefined)
                scriptFailures.set(entry.id, failure);
        }
        try {
            if (!managed.session.isDetached())
                await managed.session.detach();
            managed.detached = true;
            parentSessionReleased = true;
        }
        catch (cause) {
            cleanupFailures.push(`Unable to detach Frida session: ${sanitizeError(cause, managed.remote)}`);
            managed.detached ||= managed.session.isDetached();
            parentSessionReleased = managed.detached;
        }
        if (parentSessionReleased) {
            for (const entry of [...managed.scripts.values()]) {
                const failure = await this.#releaseScript(managed, entry, true);
                if (failure === undefined)
                    scriptFailures.delete(entry.id);
                else
                    scriptFailures.set(entry.id, failure);
            }
        }
        if (shouldResumePausedSpawn && managed.scripts.size === 0) {
            try {
                await managed.device.resume(managed.pid);
                managed.targetResumeObserved = true;
                managed.resumeAfterDetachPending = false;
                targetResumeObserved = true;
            }
            catch (cause) {
                managed.resumeAfterDetachPending = true;
                cleanupFailures.push(`Unable to resume spawned target: ${sanitizeError(cause, managed.remote)}`);
            }
        }
        const failures = [...scriptFailures.values(), ...cleanupFailures];
        if (managed.remote !== undefined &&
            (managed.remoteReferenceHeld || managed.remoteRemovalPending) &&
            parentSessionReleased &&
            managed.scripts.size === 0 &&
            !managed.resumeAfterDetachPending) {
            const failure = await this.#releaseManagedRemote(managed);
            if (failure !== undefined)
                failures.push(failure);
        }
        if (failures.length > 0)
            return err(this.#retainCleanupFailure(managed, new AnalysisCapabilityUnavailableError("frida", "close_frida_session", failures[0] ?? "Frida session cleanup failed", {
                cleanup: {
                    reason: failures.join("; "),
                    resources: [sessionId],
                },
            })));
        this.#sessions.delete(sessionId);
        await this.#resolveCleanupFailures(managed);
        return ok({ targetResumeObserved });
    }
    closeAll() {
        this.#closing = true;
        this.#closeAllPromise ??= this.#closeAll().catch((cause) => {
            this.#closeAllPromise = undefined;
            throw cause;
        });
        return this.#closeAllPromise;
    }
    async #closeAll() {
        await Promise.allSettled(this.#operations);
        const startupFailures = await Promise.all([...this.#pendingStartups].map(async (pending) => {
            const reasons = await this.#cleanupStartup(pending);
            return reasons.length === 0
                ? []
                : [
                    this.#retainCleanupFailure(pending, new ProviderCleanupError("frida", [pending.id], {
                        reason: reasons.join("; "),
                    }, { operation: "frida_cleanup" })),
                ];
        }));
        const results = await Promise.all([...this.#sessions.keys()].map((sessionId) => this.closeSession(sessionId)));
        const failures = [
            ...startupFailures.flat(),
            ...results.flatMap((result) => (result.ok ? [] : [result.error])),
        ];
        const manager = this.#deviceManager;
        if (manager !== undefined) {
            for (const [address, reference] of this.#remoteDevices) {
                if (reference.references !== 0)
                    continue;
                try {
                    await this.#releaseRemote(manager, address);
                }
                catch (cause) {
                    failures.push(this.#retainCleanupFailure(reference, new ProviderCleanupError("frida", [address], {
                        reason: "Unable to close remote Frida connection during shutdown",
                    }, { cause, operation: "frida_cleanup" })));
                }
            }
        }
        if (failures.length > 0)
            throw new ProviderCleanupError("frida", failures.flatMap((failure) => failure.cleanupResources), { reason: "Frida session cleanup was incomplete" }, {
                operation: "frida_cleanup",
                cause: new AggregateError(failures, "Frida session cleanup was incomplete"),
            }).bindCleanupDependencies(failures);
    }
    #cleanupStartup(pending) {
        return this.#withSessionLock(pending.id, async () => {
            if (!this.#pendingStartups.has(pending))
                return [];
            if (pending.session !== undefined) {
                try {
                    if (!pending.session.isDetached())
                        await pending.session.detach();
                    pending.session = undefined;
                }
                catch (cause) {
                    return [
                        `Unable to detach Frida session: ${sanitizeError(cause, pending.remote)}`,
                    ];
                }
            }
            if (pending.spawnedPid !== undefined) {
                try {
                    await pending.device.resume(pending.spawnedPid);
                    pending.spawnedPid = undefined;
                }
                catch (cause) {
                    return [
                        `Unable to resume spawned target: ${sanitizeError(cause, pending.remote)}`,
                    ];
                }
            }
            const remoteFailure = await this.#releaseManagedRemote(pending);
            if (remoteFailure !== undefined)
                return [remoteFailure];
            this.#pendingStartups.delete(pending);
            await this.#resolveCleanupFailures(pending);
            return [];
        });
    }
    #retainCleanupFailure(owner, failure) {
        const lease = this.#cleanupLease(owner);
        failure.bindCleanupResourceOwner(lease);
        lease.bindCleanupError(failure);
        return failure;
    }
    #cleanupLease(owner) {
        let lease = this.#cleanupLeases.get(owner);
        if (lease === undefined) {
            // The manager confirms native release before settling this private lease;
            // its callback must not re-enter the session or remote cleanup lock.
            lease = new AnalysisCleanupLease(async () => { }, [owner.id]);
            this.#cleanupLeases.set(owner, lease);
        }
        return lease;
    }
    async #resolveCleanupFailures(owner) {
        await this.#cleanupLease(owner).release();
    }
    async #releaseManagedRemote(managed) {
        if (managed.remote === undefined ||
            (!managed.remoteReferenceHeld && !managed.remoteRemovalPending))
            return undefined;
        const releaseReference = managed.remoteReferenceHeld;
        managed.remoteReferenceHeld = false;
        try {
            await this.#releaseRemote(managed.deviceManager, managed.remote.address, releaseReference);
            managed.remoteRemovalPending = false;
            return undefined;
        }
        catch (cause) {
            managed.remoteRemovalPending = true;
            return `Unable to close remote Frida connection: ${sanitizeError(cause, managed.remote)}`;
        }
    }
    #withOperation(name, operation, signal) {
        if (this.#closing)
            return Promise.resolve(err(new AnalysisCapabilityUnavailableError("frida", name, "Frida instrumentation is shutting down.")));
        let start = () => { };
        const pending = new Promise((resolve, reject) => {
            start = () => {
                try {
                    resolve(signal?.aborted
                        ? err(cancelledOperation(name, signal))
                        : operation());
                }
                catch (cause) {
                    reject(cause);
                }
            };
        });
        this.#operations.add(pending);
        const release = () => {
            this.#operations.delete(pending);
        };
        void pending.then(release, release);
        start();
        return pending;
    }
    async #withSessionLock(sessionId, operation) {
        const previous = this.#sessionQueues.get(sessionId) ?? Promise.resolve();
        let release;
        const current = new Promise((resolve) => {
            release = resolve;
        });
        const tail = previous.then(() => current);
        this.#sessionQueues.set(sessionId, tail);
        await previous;
        try {
            return await operation();
        }
        finally {
            release?.();
            if (this.#sessionQueues.get(sessionId) === tail)
                this.#sessionQueues.delete(sessionId);
        }
    }
    #recordMessage(managed, scriptId, message, data) {
        const payload = message.payload;
        const secrets = [managed.remote?.token, managed.remote?.certificate].filter((value) => value !== undefined && value.length > 0);
        let payloadResult;
        if (payload !== undefined) {
            try {
                payloadResult = boundedJsonValue(payload, MAX_SESSION_CAPTURE_BYTES - MAX_MESSAGE_METADATA_BYTES, secrets);
            }
            catch {
                payloadResult = {
                    value: { payload_unavailable: true },
                    truncated: true,
                    bytes: Buffer.byteLength('{"payload_unavailable":true}'),
                    limit: "unrepresentable",
                };
            }
        }
        let binaryResult = {};
        if (data !== null) {
            const payloadBytes = payloadResult?.bytes ?? 0;
            const remainingMessageBytes = Math.max(0, MAX_SESSION_CAPTURE_BYTES -
                MAX_MESSAGE_METADATA_BYTES -
                payloadBytes -
                4096);
            const messageBinaryLimit = Math.min(MAX_BINARY_MESSAGE_BYTES, Math.floor((remainingMessageBytes * 3) / 4));
            if (secrets.some((secret) => data.includes(secret, 0, "utf8"))) {
                binaryResult = { data_redacted: true };
            }
            else if (data.byteLength > messageBinaryLimit) {
                const sessionConstrained = messageBinaryLimit < MAX_BINARY_MESSAGE_BYTES;
                binaryResult = {
                    data_truncated: true,
                    data_bytes: data.byteLength,
                    data_capture_limit: sessionConstrained
                        ? "session_bytes"
                        : "binary_bytes",
                };
                if (sessionConstrained)
                    markMessageTruncated(managed, scriptId);
            }
            else {
                binaryResult = { data_base64: data.toString("base64") };
            }
        }
        const type = boundedRedactedString(message.type, MAX_MESSAGE_TYPE_BYTES, secrets);
        const description = message.description === undefined
            ? undefined
            : boundedRedactedString(message.description, MAX_MESSAGE_TEXT_BYTES, secrets);
        const stack = message.stack === undefined
            ? undefined
            : boundedRedactedString(message.stack, MAX_MESSAGE_TEXT_BYTES, secrets);
        const fileName = message.fileName === undefined
            ? undefined
            : boundedRedactedString(message.fileName, MAX_MESSAGE_TEXT_BYTES, secrets);
        const observation = {
            script_id: scriptId,
            type: type.value,
            ...(type.truncated ? { type_truncated: true } : {}),
            ...(payloadResult === undefined
                ? {}
                : {
                    payload: payloadResult.value,
                    ...(payloadResult.truncated
                        ? {
                            payload_truncated: true,
                            ...(payloadResult.limit === undefined
                                ? {}
                                : { payload_capture_limit: payloadResult.limit }),
                        }
                        : {}),
                }),
            ...(description === undefined
                ? {}
                : {
                    description: description.value,
                    ...(description.truncated ? { description_truncated: true } : {}),
                }),
            ...(stack === undefined
                ? {}
                : {
                    stack: stack.value,
                    ...(stack.truncated ? { stack_truncated: true } : {}),
                }),
            ...(fileName === undefined
                ? {}
                : {
                    file_name: fileName.value,
                    ...(fileName.truncated ? { file_name_truncated: true } : {}),
                }),
            ...(typeof message.lineNumber === "number" &&
                Number.isSafeInteger(message.lineNumber) &&
                message.lineNumber >= 0
                ? { line_number: message.lineNumber }
                : {}),
            ...(typeof message.columnNumber === "number" &&
                Number.isSafeInteger(message.columnNumber) &&
                message.columnNumber >= 0
                ? { column_number: message.columnNumber }
                : {}),
            ...binaryResult,
        };
        const charge = Buffer.byteLength(JSON.stringify(observation));
        if (charge > MAX_SESSION_CAPTURE_BYTES) {
            markMessageTruncated(managed, scriptId);
            return;
        }
        while (managed.messages.size > 0 &&
            managed.capturedBytes + charge > MAX_SESSION_CAPTURE_BYTES) {
            const removed = managed.messages.shift();
            if (removed !== undefined) {
                managed.capturedBytes -= removed.charge;
                // Both queues are in arrival order, so the globally oldest message is
                // also the oldest one retained for its script.
                const scriptMessages = managed.scriptCaptures.get(removed.scriptId)?.messages;
                if (scriptMessages?.peek() === removed.observation)
                    scriptMessages.shift();
                markMessageTruncated(managed, removed.scriptId);
            }
        }
        managed.messages.push({ observation, scriptId, charge });
        managed.scriptCaptures.get(scriptId)?.messages.push(observation);
        managed.capturedBytes += charge;
    }
    async #getDeviceManager() {
        if (this.#deviceManager !== undefined)
            return this.#deviceManager;
        if (this.#deviceManagerLoading !== undefined)
            return this.#deviceManagerLoading;
        const loading = Promise.resolve().then(this.#deviceManagerLoader);
        this.#deviceManagerLoading = loading;
        try {
            this.#deviceManager = await loading;
            if (this.#availabilityFailure?.providerId === "frida")
                this.#availabilityFailure = undefined;
            return this.#deviceManager;
        }
        catch (cause) {
            this.#availabilityFailure = {
                providerId: "frida",
                reason: boundedRedactedString(errorMessage(cause), 4096, []).value,
            };
            throw cause;
        }
        finally {
            if (this.#deviceManagerLoading === loading)
                this.#deviceManagerLoading = undefined;
        }
    }
    async #selectDevice(manager, selector) {
        if (selector.remote !== undefined)
            return this.#retainRemote(manager, selector.remote);
        try {
            return await manager.getDeviceById(selector.deviceId ?? "local", DEVICE_LOOKUP_TIMEOUT_MS);
        }
        catch (cause) {
            if (cause instanceof AnalysisCancelledError ||
                cause instanceof AnalysisTimeoutError)
                throw cause;
            if (!isFridaDeviceLookupTimeout(cause))
                throw cause;
            throw new AnalysisTimeoutError("frida_device_lookup", DEVICE_LOOKUP_TIMEOUT_MS, {
                cause,
                userMessage: `Frida device lookup reached its ${String(DEVICE_LOOKUP_TIMEOUT_MS)} ms deadline (deadlineExpired). This release has no runtime override.`,
                remediationAction: `The ${String(DEVICE_LOOKUP_TIMEOUT_MS)} ms Frida device lookup has no runtime override. Confirm the selected device is attached, then retry. Another REA timeout does not raise this lookup.`,
            });
        }
    }
    async #retainRemote(manager, remote) {
        return this.#withRemoteLock(remote.address, async () => {
            const optionsDigest = createHash("sha256")
                .update(JSON.stringify(remoteOptions(remote)))
                .digest("hex");
            let reference = this.#remoteDevices.get(remote.address);
            if (reference !== undefined) {
                if (reference.optionsDigest !== optionsDigest)
                    throw new AnalysisInputError("frida_remote_connection", undefined, [
                        {
                            path: ["remote"],
                            reason: "invalid_value",
                            message: "This endpoint is already retained with different connection options. Reuse the existing options or close its sessions before changing them.",
                        },
                    ]);
                reference.references += 1;
            }
            else {
                const device = manager.addRemoteDevice(remote.address, remoteOptions(remote));
                reference = {
                    id: remote.address,
                    references: 1,
                    optionsDigest,
                    device,
                };
                this.#remoteDevices.set(remote.address, reference);
            }
            try {
                return await reference.device;
            }
            catch (cause) {
                reference.references -= 1;
                if (reference.references === 0)
                    this.#remoteDevices.delete(remote.address);
                throw cause;
            }
        });
    }
    async #releaseRemote(manager, address, releaseReference = true) {
        return this.#withRemoteLock(address, async () => {
            const reference = this.#remoteDevices.get(address);
            if (reference === undefined)
                return;
            if (releaseReference)
                reference.references = Math.max(0, reference.references - 1);
            if (reference.references > 0)
                return;
            try {
                await reference.device;
            }
            catch {
                this.#remoteDevices.delete(address);
                return;
            }
            await manager.removeRemoteDevice(address);
            await this.#resolveCleanupFailures(reference);
            if (this.#remoteDevices.get(address) === reference)
                this.#remoteDevices.delete(address);
        });
    }
    async #withRemoteLock(address, operation) {
        const previous = this.#remoteQueues.get(address) ?? Promise.resolve();
        let release;
        const current = new Promise((resolve) => {
            release = resolve;
        });
        const tail = previous.then(() => current);
        this.#remoteQueues.set(address, tail);
        await previous;
        try {
            return await operation();
        }
        finally {
            release?.();
            if (this.#remoteQueues.get(address) === tail)
                this.#remoteQueues.delete(address);
        }
    }
}
const boundedRedactedString = (input, maximumBytes, secrets) => {
    const chunks = [];
    let outputBytes = 0;
    let cursor = 0;
    let segmentStart = 0;
    let truncated = false;
    while (cursor < input.length) {
        let nextSecretStart = input.length;
        let nextSecret;
        for (const secret of secrets) {
            const match = input.indexOf(secret, cursor);
            if (match !== -1 && match < nextSecretStart) {
                nextSecretStart = match;
                nextSecret = secret;
            }
        }
        if (nextSecretStart === cursor && nextSecret !== undefined) {
            const replacement = "[redacted]";
            const replacementBytes = jsonStringByteLength(replacement) - 2;
            if (outputBytes + replacementBytes > maximumBytes) {
                truncated = true;
                break;
            }
            chunks.push(input.slice(segmentStart, cursor), replacement);
            outputBytes += replacementBytes;
            cursor += nextSecret.length;
            segmentStart = cursor;
            continue;
        }
        while (cursor < nextSecretStart) {
            const codePoint = input.codePointAt(cursor);
            if (codePoint === undefined)
                break;
            const character = String.fromCodePoint(codePoint);
            const characterBytes = jsonStringByteLength(character) - 2;
            if (cursor + character.length > nextSecretStart ||
                outputBytes + characterBytes > maximumBytes) {
                truncated = true;
                break;
            }
            outputBytes += characterBytes;
            cursor += character.length;
        }
        if (truncated)
            break;
    }
    chunks.push(input.slice(segmentStart, cursor));
    if (cursor < input.length)
        truncated = true;
    return { value: chunks.join(""), truncated };
};
const clipped = (limit) => ({
    value: null,
    truncated: true,
    limit,
});
const boundedJsonValue = (input, maximumBytes, secrets) => {
    const seen = new WeakSet();
    let remainingNodes = MAX_CAPTURE_JSON_NODES;
    const visit = (value, budget, depth) => {
        remainingNodes -= 1;
        if (remainingNodes < 0)
            return clipped("json_nodes");
        if (depth > MAX_JSON_DEPTH)
            return clipped("json_depth");
        if (budget < 8)
            return clipped("payload_bytes");
        if (value === null)
            return { value: null, truncated: false };
        if (typeof value === "boolean" || typeof value === "number") {
            if (typeof value === "number" && !Number.isFinite(value))
                return clipped("unrepresentable");
            return { value, truncated: false };
        }
        if (typeof value === "string") {
            const bounded = boundedRedactedString(value, Math.max(0, budget - 2), secrets);
            return bounded.truncated
                ? { value: bounded.value, truncated: true, limit: "payload_bytes" }
                : { value: bounded.value, truncated: false };
        }
        if (typeof value !== "object")
            return clipped("unrepresentable");
        if (seen.has(value))
            return clipped("unrepresentable");
        seen.add(value);
        try {
            if (Array.isArray(value)) {
                const output = [];
                let usedBytes = 2;
                let limit;
                for (let index = 0; index < value.length; index += 1) {
                    const separatorBytes = output.length === 0 ? 0 : 1;
                    const remaining = budget - usedBytes - separatorBytes - 1;
                    if (remaining < 8) {
                        limit ??= "payload_bytes";
                        break;
                    }
                    const item = visit(value[index] ?? null, remaining, depth + 1);
                    const itemBytes = Buffer.byteLength(JSON.stringify(item.value));
                    if (itemBytes > remaining) {
                        limit ??= "payload_bytes";
                        break;
                    }
                    output.push(item.value);
                    usedBytes += separatorBytes + itemBytes;
                    if (item.truncated) {
                        limit ??= item.limit;
                        break;
                    }
                }
                if (output.length < value.length)
                    limit ??= "payload_bytes";
                return limit === undefined
                    ? { value: output, truncated: false }
                    : { value: output, truncated: true, limit };
            }
            const output = {};
            let usedBytes = 2;
            let entries = 0;
            let limit;
            for (const rawKey in value) {
                if (!Object.hasOwn(value, rawKey))
                    continue;
                const separatorBytes = entries === 0 ? 0 : 1;
                const keyLimit = Math.max(0, budget - usedBytes - separatorBytes - 10);
                const boundedKey = boundedRedactedString(rawKey, keyLimit, secrets);
                if (boundedKey.truncated) {
                    limit ??= "payload_bytes";
                    break;
                }
                const key = boundedKey.value;
                const keyBytes = jsonStringByteLength(key) + 1;
                const remaining = budget - usedBytes - separatorBytes - keyBytes - 1;
                if (remaining < 8) {
                    limit ??= "payload_bytes";
                    break;
                }
                const entry = visit(Reflect.get(value, rawKey), remaining, depth + 1);
                const entryBytes = Buffer.byteLength(JSON.stringify(entry.value));
                if (entryBytes > remaining) {
                    limit ??= "payload_bytes";
                    break;
                }
                Object.defineProperty(output, key, {
                    value: entry.value,
                    configurable: true,
                    enumerable: true,
                    writable: true,
                });
                entries += 1;
                usedBytes += separatorBytes + keyBytes + entryBytes;
                if (entry.truncated) {
                    limit ??= entry.limit;
                    break;
                }
            }
            return limit === undefined
                ? { value: output, truncated: false }
                : { value: output, truncated: true, limit };
        }
        finally {
            seen.delete(value);
        }
    };
    const result = visit(input, maximumBytes, 0);
    const bytes = Buffer.byteLength(JSON.stringify(result.value));
    return bytes > maximumBytes
        ? {
            value: null,
            truncated: true,
            bytes: Buffer.byteLength("null"),
            limit: result.limit ?? "payload_bytes",
        }
        : { ...result, bytes };
};
const remoteOptions = (remote) => ({
    ...(remote.token === undefined ? {} : { token: remote.token }),
    ...(remote.certificate === undefined
        ? {}
        : { certificate: remote.certificate }),
    ...(remote.origin === undefined ? {} : { origin: remote.origin }),
    ...(remote.keepaliveInterval === undefined
        ? {}
        : { keepaliveInterval: remote.keepaliveInterval }),
});
// Attachment and target execution have independent native observations. A
// successful target resume cannot reattach a detached instrumentation session.
const sessionState = (managed) => managed.detached
    ? "detached"
    : managed.mode === "spawn" && !managed.targetResumeObserved
        ? "paused"
        : "running";
const sessionObservation = (managed) => ({
    sessionId: managed.id,
    deviceId: managed.device.id,
    target: managed.target,
    pid: managed.pid,
    mode: managed.mode,
    state: sessionState(managed),
});
const sanitizeError = (cause, remote) => boundedRedactedString(errorMessage(cause), 4096, [remote?.token, remote?.certificate].filter((secret) => secret !== undefined && secret.length > 0)).value;
const providerError = (operation, cause, remote, cleanupReason) => {
    if (cause instanceof AnalysisInputError)
        return new AnalysisInputError(operation, { cause }, cause.issues);
    if (cause instanceof AnalysisTimeoutError)
        return new AnalysisTimeoutError(operation, cause.timeoutMs, {
            cause,
            ...(cause.userMessage === undefined
                ? {}
                : { userMessage: cause.userMessage }),
            ...(cause.remediationAction === undefined
                ? {}
                : { remediationAction: cause.remediationAction }),
            ...(cleanupReason === undefined
                ? {}
                : {
                    cleanup: {
                        reason: cleanupReason,
                        resources: ["Frida provider operation"],
                    },
                }),
        });
    if (cause instanceof AnalysisCancelledError)
        return new AnalysisCancelledError(operation, {
            cause: cause.cause,
            ...(cleanupReason === undefined
                ? {}
                : {
                    cleanup: {
                        reason: cleanupReason,
                        resources: ["Frida provider operation"],
                    },
                }),
        });
    const reason = sanitizeError(cause, remote);
    return new AnalysisCapabilityUnavailableError("frida", operation, reason, {
        cause: remote === undefined ? cause : new Error(reason),
        ...(cleanupReason === undefined
            ? {}
            : {
                cleanup: {
                    reason: cleanupReason,
                    resources: ["Frida provider operation"],
                },
            }),
    });
};
const errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
const cancelledOperation = (operation, signal) => new AnalysisCancelledError(operation, { cause: signal.reason });
const markMessageTruncated = (managed, scriptId) => {
    managed.messagesTruncated = true;
    const capture = managed.scriptCaptures.get(scriptId);
    if (capture !== undefined)
        capture.truncated = true;
};
/**
 * Arrival-ordered queue whose eviction advances a head offset. A full capture
 * budget evicts on every message, and `Array#shift` would copy every retained
 * message each time.
 */
class MessageFifo {
    #items = [];
    #head = 0;
    get size() {
        return this.#items.length - this.#head;
    }
    push(item) {
        this.#items.push(item);
    }
    peek() {
        return this.#items[this.#head];
    }
    shift() {
        if (this.#head >= this.#items.length)
            return undefined;
        const item = this.#items[this.#head];
        this.#items[this.#head] = undefined;
        this.#head += 1;
        // Compacting once half the slots are evicted keeps eviction amortized O(1).
        if (this.#head * 2 >= this.#items.length) {
            this.#items = this.#items.slice(this.#head);
            this.#head = 0;
        }
        return item;
    }
    toArray() {
        return this.#items.slice(this.#head);
    }
}
