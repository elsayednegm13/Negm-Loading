import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { withArtifactRegularFile, ArtifactFileCleanupFailure, artifactFileCompletion, bindArtifactFileCleanup, artifactFileCancellationCause, assertArtifactReadActive, } from "../artifacts/ArtifactFileOperation.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, resourceConstraintRecovery, } from "../domain/analysisErrorCore.js";
import { randomUUID } from "node:crypto";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createConnection } from "node:net";
import { lstat, opendir } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { jsonValueByteLength } from "../domain/jsonValueByteLength.js";
import { cutterSessionSchema, } from "../domain/cutterDiscovery.js";
import { err, ok } from "../domain/result.js";
import { cutterBridgeMac } from "./cutterBridgeMac.js";
import { CutterBridgeResponseFrames } from "./cutterAuthenticatedResponse.js";
import { requireWindowsNativeAuthority } from "../windows/WindowsNativeLoader.js";
import { readBoundedFileBytes } from "../process/BoundedFileBytes.js";
import { homeDirectoryFromEnvironment } from "../config/homeDirectory.js";
import { bridgeRequestLimitMismatchError, bridgeRequestOversizeError, DEFAULT_BRIDGE_MAX_REQUEST_BYTES, resolveBridgeMaxRequestBytes, } from "../config/bridgeMaxRequestBytes.js";
const descriptorSchema = z.object({
    ...cutterSessionSchema.shape,
    host: z.literal("127.0.0.1"),
    port: z.int().min(1).max(65535),
    token: z.string().min(20),
    max_request_bytes: z.int().positive().optional(),
});
export const CUTTER_PROVIDER_IDENTITY = {
    id: "cutter.python-plugin",
    name: "Cutter Python plugin",
    version: null,
};
const responseSchema = z.object({
    ok: z.boolean(),
    session_id: z.string().uuid().optional(),
    output: z.unknown().optional(),
    current_file: z.string().nullable().optional(),
    cutter_version: z.string().nullable().optional(),
    document_generation: z.int().nonnegative().optional(),
    identity_status: z.literal("partial").optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    execution_state: z
        .enum(["not_started", "running", "complete", "failed", "unknown"])
        .optional(),
    output_truncated: z.boolean().optional(),
    completed_commands: z
        .array(z.object({
        request_id: z.string().uuid(),
        execution_state: z.enum(["not_started", "complete", "failed"]),
    }))
        .max(64)
        .optional(),
    completed_connection: z
        .string()
        .regex(/^[0-9a-f]{16}$/)
        .optional(),
});
const acknowledgementSchema = z.object({
    ok: z.literal(true),
    acknowledged: z.boolean(),
});
const MAX_DESCRIPTOR_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 25_000;
// Discovery stays at the historical 16 MiB descriptor budget. It does not
// follow REA_BRIDGE_MAX_REQUEST_BYTES.
const DISCOVERY_CANDIDATE_BUDGET_BYTES = 16 * 1024 * 1024;
const MAX_DESCRIPTOR_CANDIDATES = DISCOVERY_CANDIDATE_BUDGET_BYTES / MAX_DESCRIPTOR_BYTES;
const DISCOVERY_CONCURRENCY = 8;
const serializeRequest = (limit, descriptor, request) => {
    const requestValue = {
        ...request,
        session_id: descriptor.session_id,
    };
    // Worst-case JSON expansion (\u00XX) can exceed Node's string ceiling
    // before an after-the-fact byte check. Measure within the budget first.
    const measured = jsonValueByteLength(requestValue, limit.maximumBytes);
    if (measured > limit.maximumBytes)
        throw bridgeRequestOversizeError("cutter_command", limit, measured, "Cutter");
    const requestBytes = JSON.stringify(requestValue);
    let frameBytes = Buffer.byteLength(JSON.stringify({ request: "", proof: "0".repeat(64) })) +
        Buffer.byteLength(requestBytes);
    for (const character of requestBytes)
        if (character === '"' || character === "\\")
            frameBytes += 1;
    if (frameBytes > limit.maximumBytes)
        throw bridgeRequestOversizeError("cutter_command", limit, frameBytes, "Cutter");
    return requestBytes;
};
const serverChallengeSchema = z.object({
    session_id: z.string().uuid(),
    nonce: z.string().regex(/^[0-9a-f]{64}$/),
    proof: z.string().regex(/^[0-9a-f]{64}$/),
});
/** Nonce from a hello whose proof shows this descriptor's bridge is the peer. */
const authenticatedServerNonce = (descriptor, clientNonce, value) => {
    const challenge = serverChallengeSchema.parse(value);
    if (challenge.session_id !== descriptor.session_id)
        throw new Error("unexpected peer session");
    const expected = createHmac("sha256", descriptor.token)
        .update(`rea-cutter-server-v2:${descriptor.session_id}:${clientNonce}:${challenge.nonce}`)
        .digest();
    const presented = Buffer.from(challenge.proof, "hex");
    if (expected.length !== presented.length ||
        !timingSafeEqual(expected, presented))
        throw new Error("peer proof failed");
    return challenge.nonce;
};
const assertBridgeActive = (signal, operation) => {
    if (signal?.aborted)
        throw new AnalysisCancelledError(operation, {
            cause: signal.reason,
        });
};
const mapDiscovery = async (inputs, operation, assertActive) => {
    assertActive();
    const results = new Array(inputs.length);
    let next = 0;
    let stopped = false;
    const workers = await Promise.allSettled(Array.from({ length: Math.min(inputs.length, DISCOVERY_CONCURRENCY) }, async () => {
        try {
            while (!stopped && next < inputs.length) {
                assertActive();
                const index = next++;
                results[index] = await operation(inputs[index]);
            }
        }
        catch (cause) {
            stopped = true;
            throw cause;
        }
    }));
    const failures = workers.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
    if (failures.length > 1)
        throw new CutterDiscoveryFailure(failures);
    if (failures.length === 1)
        throw failures[0];
    assertActive();
    return results;
};
class CutterBridgeRequestFailure extends Error {
    requestSent;
    cancellation;
    limit;
    constructor(message, requestSent, cancellation, limit) {
        super(message);
        this.requestSent = requestSent;
        this.cancellation = cancellation;
        this.limit = limit;
    }
}
/** Discovers and communicates with REA Python bridge plugins in live Cutter processes. */
export class CutterBridgeClient {
    #maxRequestBytes;
    #directory;
    #descriptorResources = new ArtifactResourceScope();
    #platform;
    #windowsPrivateReader;
    #pendingAcknowledgements = new Map();
    constructor(environment = process.env, options = {}) {
        this.#maxRequestBytes = resolveBridgeMaxRequestBytes(environment);
        const configured = environment.REA_CUTTER_BRIDGE_DIR;
        const localAppData = environment.LOCALAPPDATA;
        this.#platform = options.platform ?? process.platform;
        this.#windowsPrivateReader =
            options.windowsPrivateReader ??
                (this.#platform === "win32"
                    ? {
                        verifyDirectory: (directory) => z
                            .object({ privateDacl: z.literal(true) })
                            .safeParse(requireWindowsNativeAuthority().call("cutter_bridge_verify_directory", [directory])).success,
                        readDescriptor: (directory, name, maxBytes) => z
                            .instanceof(Buffer)
                            .parse(requireWindowsNativeAuthority().call("cutter_bridge_read_descriptor", [directory, name, maxBytes])),
                    }
                    : undefined);
        this.#directory = resolveBridgeDirectory(configured, this.#platform, localAppData, homeDirectoryFromEnvironment(environment, this.#platform));
    }
    async retryDescriptorCleanup() {
        try {
            await this.#descriptorResources.retryCleanup();
        }
        catch (cause) {
            throw discoveryFailure(cause, "close_cutter_descriptors");
        }
    }
    async close() {
        try {
            await this.#descriptorResources.close();
        }
        catch (cause) {
            throw discoveryFailure(cause, "close_cutter_descriptors");
        }
    }
    async listSessions(options = {}) {
        const { signal } = options;
        const mismatches = [];
        const loaded = await this.#readDescriptors("list_cutter_sessions", signal);
        if (loaded.error !== undefined)
            return {
                sessions: [],
                bridge_directory: this.#directory,
                discovery_status: loaded.error,
                bridge_directory_security: loaded.security,
            };
        const descriptors = await mapDiscovery(loaded.descriptors, async (descriptor) => {
            assertBridgeActive(signal, "list_cutter_sessions");
            const advertised = descriptor.max_request_bytes ?? DEFAULT_BRIDGE_MAX_REQUEST_BYTES;
            if (advertised !== this.#maxRequestBytes.maximumBytes) {
                // A crashed process can leave the previous ceiling on disk. Count
                // the mismatch only after the hello proves a live authenticated
                // bridge. The probe does not send a status request.
                if (await this.#liveAuthenticatedBridge(descriptor, signal))
                    mismatches.push(advertised);
                return undefined;
            }
            try {
                const status = responseSchema.safeParse(await this.#request(descriptor, serializeRequest(this.#maxRequestBytes, descriptor, {
                    kind: "status",
                    session_id: descriptor.session_id,
                }), signal));
                if (!status.success ||
                    !status.data.ok ||
                    status.data.session_id !== descriptor.session_id)
                    return undefined;
                return {
                    session_id: descriptor.session_id,
                    pid: descriptor.pid,
                    document_generation: status.data.document_generation ?? descriptor.document_generation,
                    current_file: 
                    // Null is an observed unknown path. Only a missing field may
                    // fall back to the descriptor, and never beside a newer generation.
                    status.data.current_file === undefined
                        ? descriptor.current_file
                        : status.data.current_file,
                    cutter_version: status.data.cutter_version ?? descriptor.cutter_version,
                    identity_status: "partial",
                };
            }
            catch (cause) {
                if (cause instanceof AnalysisResourceConstraintError)
                    throw cause;
                if (cause instanceof CutterBridgeRequestFailure) {
                    if (cause.cancellation !== undefined)
                        throw new AnalysisCancelledError("list_cutter_sessions", {
                            cause: cause.cancellation.reason,
                        });
                    if (cause.limit !== undefined)
                        throw new AnalysisResourceConstraintError("list_cutter_sessions", cause.limit.resource, cause.limit.reason, cause.limit.reportedLimits, resourceConstraintRecovery(cause.limit));
                }
                return undefined;
            }
        }, () => assertBridgeActive(signal, "list_cutter_sessions")).catch((cause) => {
            throw discoveryFailure(cause, "list_cutter_sessions");
        });
        const sessions = descriptors.filter((value) => value !== undefined);
        if (mismatches.length > 0)
            throw bridgeRequestLimitMismatchError("list_cutter_sessions", this.#maxRequestBytes, mismatches[0] ?? DEFAULT_BRIDGE_MAX_REQUEST_BYTES, "Cutter", "No status request was sent to the mismatched session.");
        return {
            sessions,
            bridge_directory: this.#directory,
            discovery_status: sessions.length > 0 ? "sessions_found" : "no_live_bridge_found",
            bridge_directory_security: loaded.security,
        };
    }
    async execute(input) {
        try {
            assertBridgeActive(input.signal, "cutter_command");
            const descriptor = await this.#find(input.sessionId, input.signal);
            assertBridgeActive(input.signal, "cutter_command");
            const advertised = descriptor.max_request_bytes ?? DEFAULT_BRIDGE_MAX_REQUEST_BYTES;
            if (advertised !== this.#maxRequestBytes.maximumBytes)
                throw bridgeRequestLimitMismatchError("cutter_command", this.#maxRequestBytes, advertised, "Cutter");
            const requestId = randomUUID();
            const commandRequest = serializeRequest(this.#maxRequestBytes, descriptor, {
                kind: "command",
                request_id: requestId,
                expected_generation: input.expectedGeneration,
                command: input.command,
                json: input.json,
            });
            await this.#recoverCompletedCommands(descriptor, input.signal);
            await this.#retryPendingAcknowledgements(descriptor);
            assertBridgeActive(input.signal, "cutter_command");
            let completionToken;
            let rawResponse;
            try {
                rawResponse = await this.#request(descriptor, commandRequest, input.signal, (ordinal) => {
                    completionToken = ordinal;
                });
            }
            catch (cause) {
                if (!(cause instanceof CutterBridgeRequestFailure) ||
                    !cause.requestSent)
                    throw cause;
                return {
                    requestId,
                    output: null,
                    currentFile: descriptor.current_file,
                    documentGeneration: input.expectedGeneration,
                    identityStatus: "partial",
                    cutterVersion: descriptor.cutter_version,
                    executionState: "unknown",
                    error: "transport-response-missing",
                    message: `${cause.message}; the command may have completed; do not retry automatically`,
                    // The carried limit is the framed response ceiling. The command was
                    // sent, and the discarded response is omitted output.
                    outputTruncated: cause.limit !== undefined,
                    ...(completionToken === undefined ? {} : { completionToken }),
                };
            }
            const parsed = responseSchema.safeParse(rawResponse);
            if (!parsed.success)
                return {
                    requestId,
                    output: null,
                    currentFile: descriptor.current_file,
                    documentGeneration: input.expectedGeneration,
                    identityStatus: "partial",
                    cutterVersion: descriptor.cutter_version,
                    executionState: "unknown",
                    error: "malformed-bridge-response",
                    message: "Cutter may have completed the command, but its response was invalid; do not retry automatically",
                    outputTruncated: false,
                    ...(completionToken === undefined ? {} : { completionToken }),
                };
            const response = parsed.data;
            const executionState = response.ok
                ? response.execution_state === undefined ||
                    response.execution_state === "complete"
                    ? "complete"
                    : response.execution_state === "not_started"
                        ? "not_started"
                        : "unknown"
                : response.execution_state === "failed"
                    ? "failed"
                    : response.execution_state === "not_started"
                        ? "not_started"
                        : "unknown";
            if (executionState !== "unknown")
                await this.#acknowledgeCompletion(descriptor, requestId);
            if (executionState === "not_started" &&
                response.error === "active-document-generation-changed")
                throw new AnalysisInputError("cutter_command", {
                    diagnostics: {
                        session_id: input.sessionId,
                        expected_generation: input.expectedGeneration,
                        ...(response.document_generation === undefined
                            ? {}
                            : { observed_generation: response.document_generation }),
                        execution_state: executionState,
                    },
                }, [
                    {
                        path: ["expected_generation"],
                        reason: "invalid_value",
                        message: "Cutter's active document generation changed. List sessions again and select the current generation.",
                    },
                ]);
            return {
                requestId,
                output: response.output ?? null,
                currentFile: response.current_file === undefined
                    ? descriptor.current_file
                    : response.current_file,
                documentGeneration: response.document_generation ?? input.expectedGeneration,
                identityStatus: "partial",
                cutterVersion: response.cutter_version ?? descriptor.cutter_version,
                executionState,
                error: response.ok ? null : (response.error ?? "cutter-command-failed"),
                message: response.message ?? null,
                outputTruncated: response.output_truncated ?? false,
                ...(completionToken === undefined ? {} : { completionToken }),
            };
        }
        catch (cause) {
            // Sent command failures already became an unknown execution above.
            // A transport failure escaping here precedes command admission.
            if (!(cause instanceof CutterBridgeRequestFailure))
                throw cause;
            if (cause.cancellation !== undefined)
                throw new AnalysisCancelledError("cutter_command", {
                    cause: cause.cancellation.reason,
                });
            throw new AnalysisCapabilityUnavailableError("cutter", "cutter_command", cause.message, { cause });
        }
    }
    /** Confirm completion by exact receipt or authenticated connection watermark. */
    async confirmCommandCompletion(sessionId, requestId, completionToken) {
        let descriptor;
        try {
            descriptor = await this.#find(sessionId);
        }
        catch (cause) {
            if (cause instanceof AnalysisError)
                return err(cause);
            return err(new AnalysisCapabilityUnavailableError("cutter", "cutter_command", cause instanceof Error ? cause.message : "Cutter session unavailable", { cause }));
        }
        try {
            const status = await this.#readCommandStatus(descriptor);
            const completed = (status.completed_commands ?? []).some((receipt) => receipt.request_id === requestId);
            if (completed)
                await this.#acknowledgeCompletion(descriptor, requestId);
            return ok(completed ||
                (completionToken !== undefined &&
                    status.completed_connection !== undefined &&
                    status.completed_connection >= completionToken));
        }
        catch (cause) {
            if (cause instanceof AnalysisError)
                return err(cause);
            return err(new AnalysisCapabilityUnavailableError("cutter", "cutter_command", cause instanceof Error ? cause.message : "Cutter status failed", { cause, diagnostics: { auxiliary_operation: "status" } }));
        }
    }
    async #readCommandStatus(descriptor, signal) {
        const raw = await this.#request(descriptor, serializeRequest(this.#maxRequestBytes, descriptor, {
            kind: "status",
            session_id: descriptor.session_id,
        }), signal);
        const status = responseSchema.safeParse(raw);
        if (!status.success ||
            !status.data.ok ||
            status.data.session_id !== descriptor.session_id)
            throw new AnalysisOutputError("cutter_command", "The bridge status response did not contain a valid session identity.", {
                cause: status.success ? undefined : status.error,
                diagnostics: { auxiliary_operation: "status" },
            });
        return status.data;
    }
    async #recoverCompletedCommands(descriptor, signal) {
        const status = await this.#readCommandStatus(descriptor, signal);
        if (status.completed_connection === undefined)
            throw new AnalysisOutputError("cutter_command", "The bridge did not provide authenticated proof that earlier connections reached a terminal state.", { diagnostics: { auxiliary_operation: "status" } });
        const pending = this.#pendingAcknowledgements.get(descriptor.session_id) ?? new Set();
        for (const receipt of status.completed_commands ?? [])
            pending.add(receipt.request_id);
        if (pending.size > 0)
            this.#pendingAcknowledgements.set(descriptor.session_id, pending);
    }
    async #acknowledgeCompletion(descriptor, requestId) {
        try {
            const raw = await this.#request(descriptor, serializeRequest(this.#maxRequestBytes, descriptor, {
                kind: "ack",
                request_id: requestId,
            }));
            const acknowledged = acknowledgementSchema.safeParse(raw);
            if (!acknowledged.success)
                throw new Error("Cutter did not confirm the completion receipt acknowledgement.");
            const pending = this.#pendingAcknowledgements.get(descriptor.session_id);
            pending?.delete(requestId);
            if (pending?.size === 0)
                this.#pendingAcknowledgements.delete(descriptor.session_id);
            return true;
        }
        catch {
            const pending = this.#pendingAcknowledgements.get(descriptor.session_id) ??
                new Set();
            pending.add(requestId);
            this.#pendingAcknowledgements.set(descriptor.session_id, pending);
            return false;
        }
    }
    async #retryPendingAcknowledgements(descriptor) {
        const pending = this.#pendingAcknowledgements.get(descriptor.session_id);
        if (pending === undefined)
            return;
        for (const requestId of pending) {
            if (!(await this.#acknowledgeCompletion(descriptor, requestId)))
                throw new AnalysisCapabilityUnavailableError("cutter", "cutter_command", "A retained Cutter completion receipt could not be acknowledged; no new command was sent.");
        }
    }
    async #find(sessionId, signal) {
        const loaded = await this.#readDescriptors("cutter_command", signal);
        if (loaded.error === "bridge_directory_capacity_exceeded")
            throw new AnalysisResourceConstraintError("cutter_command", "transport", `Cutter descriptor discovery exceeded its candidate budget of ${String(MAX_DESCRIPTOR_CANDIDATES)} descriptors; no command was sent. This release has no runtime override.`, {
                max_descriptor_candidates: MAX_DESCRIPTOR_CANDIDATES,
                bridge_directory: this.#directory,
            }, {
                remediationAction: `Reduce the number of Cutter bridge descriptors in the bridge directory. This budget of ${String(MAX_DESCRIPTOR_CANDIDATES)} descriptors has no runtime override. Descriptor files above ${String(MAX_DESCRIPTOR_BYTES)} bytes are skipped, and at most ${String(DISCOVERY_CONCURRENCY)} descriptors are probed at once; those caps also have no runtime override.`,
            });
        if (loaded.error !== undefined)
            throw new AnalysisCapabilityUnavailableError("cutter", "cutter_command", `Cutter descriptor discovery failed: ${loaded.error}`);
        const descriptor = loaded.descriptors.find((candidate) => candidate.session_id === sessionId);
        if (descriptor === undefined)
            throw new AnalysisInputError("cutter_command", undefined, [
                {
                    path: ["session_id"],
                    reason: "invalid_value",
                    message: "Cutter bridge session is unavailable or stale; list sessions again and select an available session.",
                },
            ]);
        return descriptor;
    }
    async listDescriptors() {
        const loaded = await this.#readDescriptors("list_cutter_sessions");
        return loaded.descriptors;
    }
    async #readDescriptors(operation, signal) {
        try {
            return await this.#descriptorResources.run(() => this.#loadDescriptors(signal));
        }
        catch (cause) {
            throw discoveryFailure(cause, operation);
        }
    }
    async #loadDescriptors(signal) {
        assertArtifactReadActive(signal);
        let directoryInfo;
        try {
            directoryInfo = await lstat(this.#directory);
        }
        catch (cause) {
            const code = cause.code;
            if (code === "ENOENT")
                return { descriptors: [], security: "not_checked" };
            return {
                descriptors: [],
                security: "not_checked",
                error: "bridge_directory_unavailable",
            };
        }
        if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink())
            return {
                descriptors: [],
                security: "not_private",
                error: "bridge_directory_insecure",
            };
        const currentUid = this.#platform !== "win32" ? process.getuid?.() : undefined;
        const posix = currentUid !== undefined;
        if (posix &&
            (directoryInfo.uid !== currentUid || (directoryInfo.mode & 0o077) !== 0))
            return {
                descriptors: [],
                security: "not_private",
                error: "bridge_directory_insecure",
            };
        let security = posix
            ? "private_verified"
            : "unverified_platform_acl";
        const windowsPrivateReader = this.#windowsPrivateReader;
        if (!posix) {
            if (this.#platform !== "win32" || windowsPrivateReader === undefined)
                return {
                    descriptors: [],
                    security,
                    error: "bridge_directory_insecure",
                };
            try {
                if (!windowsPrivateReader.verifyDirectory(this.#directory))
                    return {
                        descriptors: [],
                        security: "not_private",
                        error: "bridge_directory_insecure",
                    };
                security = "private_verified";
            }
            catch {
                return {
                    descriptors: [],
                    security,
                    error: "bridge_directory_insecure",
                };
            }
        }
        const entries = [];
        try {
            const directory = await opendir(this.#directory);
            for await (const entry of directory) {
                assertArtifactReadActive(signal);
                if (!/^cutter-\d+-[0-9a-f-]{36}\.json$/iu.test(entry.name))
                    continue;
                if (entries.length === MAX_DESCRIPTOR_CANDIDATES)
                    return {
                        descriptors: [],
                        security,
                        error: "bridge_directory_capacity_exceeded",
                    };
                entries.push(entry.name);
            }
        }
        catch (cause) {
            if (cause instanceof ArtifactReaderFailure &&
                cause.reason === "cancelled")
                throw cause;
            return {
                descriptors: [],
                security: "not_checked",
                error: "bridge_directory_unavailable",
            };
        }
        const loaded = await mapDiscovery(entries, async (entry) => {
            assertArtifactReadActive(signal);
            try {
                let bytes;
                if (this.#platform === "win32") {
                    bytes = windowsPrivateReader.readDescriptor(this.#directory, entry, MAX_DESCRIPTOR_BYTES);
                }
                else {
                    const boundedBytes = await withArtifactRegularFile(join(this.#directory, entry), this.#descriptorResources, signal, async ({ handle: file, initial: info }) => {
                        if (info.size > MAX_DESCRIPTOR_BYTES ||
                            info.uid !== currentUid ||
                            (info.mode & 0o077) !== 0)
                            return undefined;
                        assertArtifactReadActive(signal);
                        const bytes = await readBoundedFileBytes(file, MAX_DESCRIPTOR_BYTES);
                        assertArtifactReadActive(signal);
                        return bytes;
                    });
                    if (boundedBytes === undefined)
                        return undefined;
                    bytes = boundedBytes;
                }
                assertArtifactReadActive(signal);
                if (bytes.byteLength > MAX_DESCRIPTOR_BYTES)
                    return undefined;
                const parsed = descriptorSchema.safeParse(JSON.parse(bytes.toString("utf8")));
                if (!parsed.success ||
                    entry !== `cutter-${parsed.data.pid}-${parsed.data.session_id}.json`)
                    return undefined;
                return parsed.data;
            }
            catch (cause) {
                if (cause instanceof ArtifactReaderFailure &&
                    (cause.cleanup !== undefined || cause.reason === "cancelled"))
                    throw cause;
                return undefined;
            }
        }, () => assertArtifactReadActive(signal));
        assertArtifactReadActive(signal);
        return {
            descriptors: loaded.filter((value) => value !== undefined),
            security,
        };
    }
    /**
     * Hello only. A matching server proof means this descriptor is a live
     * authenticated bridge. The socket closes before any status or command.
     */
    #liveAuthenticatedBridge(descriptor, signal) {
        assertBridgeActive(signal, "list_cutter_sessions");
        return new Promise((resolve, reject) => {
            const connection = createConnection({
                host: descriptor.host,
                port: descriptor.port,
            });
            const frames = new CutterBridgeResponseFrames(this.#maxRequestBytes);
            let settled = false;
            const settle = (outcome) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timer);
                signal?.removeEventListener("abort", onAbort);
                connection.destroy();
                if (outcome.ok)
                    resolve(outcome.live);
                else
                    reject(outcome.cause);
            };
            const timer = setTimeout(() => settle({ ok: true, live: false }), REQUEST_TIMEOUT_MS);
            const onAbort = () => {
                settle({
                    ok: false,
                    cause: new AnalysisCancelledError("list_cutter_sessions", {
                        cause: signal?.reason,
                    }),
                });
            };
            signal?.addEventListener("abort", onAbort, { once: true });
            if (signal?.aborted) {
                onAbort();
                return;
            }
            const clientNonce = randomBytes(32).toString("hex");
            connection.once("connect", () => {
                if (settled)
                    return;
                connection.write(`${JSON.stringify({ kind: "rea-auth-v2", nonce: clientNonce })}\n`);
            });
            connection.on("data", (chunk) => {
                if (settled)
                    return;
                try {
                    frames.push(chunk, (frame) => {
                        if (frame.kind !== "challenge") {
                            settle({ ok: true, live: false });
                            return false;
                        }
                        try {
                            authenticatedServerNonce(descriptor, clientNonce, frame.value);
                            settle({ ok: true, live: true });
                        }
                        catch {
                            settle({ ok: true, live: false });
                        }
                        return false;
                    });
                }
                catch {
                    settle({ ok: true, live: false });
                }
            });
            connection.once("error", () => settle({ ok: true, live: false }));
            connection.once("close", () => settle({ ok: true, live: false }));
        });
    }
    #request(descriptor, requestBytes, signal, onAuthenticated) {
        return new Promise((resolve, reject) => {
            const connection = createConnection({
                host: descriptor.host,
                port: descriptor.port,
            });
            const frames = new CutterBridgeResponseFrames(this.#maxRequestBytes);
            let completion;
            let requestSent = false;
            let authenticated = false;
            const clientNonce = randomBytes(32).toString("hex");
            let serverNonce = "";
            let connectionOrdinal;
            const finish = (complete) => {
                if (completion !== undefined)
                    return;
                completion = complete;
                clearTimeout(timer);
                signal?.removeEventListener("abort", onAbort);
                // Retain this request until its owned socket has actually closed.
                connection.destroy();
            };
            const rejectRequest = (message, cancellation, limit) => finish(() => reject(new CutterBridgeRequestFailure(message, requestSent, cancellation, limit)));
            const timer = setTimeout(() => {
                rejectRequest(`Cutter bridge request timed out after ${String(REQUEST_TIMEOUT_MS)} ms (deadlineExpired). This release has no runtime override`);
            }, REQUEST_TIMEOUT_MS);
            const onAbort = () => {
                rejectRequest("Cutter bridge request was cancelled", {
                    reason: signal?.reason,
                });
            };
            signal?.addEventListener("abort", onAbort, { once: true });
            if (signal?.aborted)
                onAbort();
            connection.once("connect", () => {
                if (completion !== undefined)
                    return;
                connection.write(`${JSON.stringify({ kind: "rea-auth-v2", nonce: clientNonce })}\n`);
            });
            connection.on("data", (chunk) => {
                if (completion !== undefined)
                    return;
                try {
                    frames.push(chunk, (frame) => {
                        if (frame.kind === "challenge") {
                            if (authenticated)
                                throw new Error("unexpected challenge");
                            serverNonce = authenticatedServerNonce(descriptor, clientNonce, frame.value);
                            connectionOrdinal = serverNonce.slice(0, 16);
                            onAuthenticated?.(connectionOrdinal);
                            const proof = cutterBridgeMac(descriptor.token, [
                                `rea-cutter-client-v2:${descriptor.session_id}:${clientNonce}:${serverNonce}:`,
                                requestBytes,
                            ]).toString("hex");
                            authenticated = true;
                            requestSent = true;
                            connection.write(`${JSON.stringify({ request: requestBytes, proof })}\n`);
                            return true;
                        }
                        // One decoded payload. The wire pages and outer JSON string are gone.
                        const expected = cutterBridgeMac(descriptor.token, [
                            `rea-cutter-response-v2:${descriptor.session_id}:${clientNonce}:${serverNonce}:`,
                            frame.response,
                        ]);
                        if (!timingSafeEqual(expected, Buffer.from(frame.proof, "hex")))
                            throw new Error("response proof failed");
                        const response = JSON.parse(frame.response);
                        finish(() => resolve(response));
                        return false;
                    });
                }
                catch (cause) {
                    if (cause instanceof AnalysisResourceConstraintError) {
                        // The command is already on the UI thread. Keep the unknown
                        // execution so cleanup waits for its receipt, and carry the
                        // ceiling diagnostic in that result.
                        if (requestSent)
                            rejectRequest(cause.reason, undefined, cause);
                        else
                            finish(() => reject(cause));
                        return;
                    }
                    rejectRequest("Cutter bridge peer authentication or response failed");
                }
            });
            connection.once("error", (cause) => rejectRequest(`Cutter bridge is unavailable: ${cause.message}`));
            connection.once("close", () => {
                rejectRequest("Cutter bridge closed before returning a complete response");
                completion?.();
            });
        });
    }
}
const resolveBridgeDirectory = (configured, platform, localAppData, homeDirectory) => {
    if (configured !== undefined && configured !== "") {
        if (configured === "~")
            return homeDirectory;
        if (configured.startsWith("~/"))
            return join(homeDirectory, configured.slice(2));
        if (platform === "win32" && configured.startsWith("~\\"))
            return join(homeDirectory, configured.slice(2));
        return configured;
    }
    return platform === "win32" && localAppData
        ? join(localAppData, "REA", "CutterBridge")
        : join(homeDirectory, ".cache", "rea", "cutter-bridge");
};
class CutterDiscoveryFailure extends Error {
    failures;
    constructor(failures) {
        super("Cutter discovery workers failed");
        this.failures = failures;
    }
}
const discoveryFailure = (cause, operation) => {
    if (cause instanceof CutterDiscoveryFailure) {
        const failures = cause.failures.map((failure) => {
            const parsed = discoveryFailure(failure, operation);
            return parsed instanceof AnalysisError
                ? parsed
                : new ProviderAdapterError("cutter", operation, { cause: parsed });
        });
        const cleanup = failures.filter((failure) => failure.cleanupIncomplete);
        if (cleanup.length === 0)
            return failures[0];
        return new ProviderCleanupError("cutter", cleanup.flatMap((failure) => failure.cleanupResources), { reason: "Cutter descriptor discovery failed with unconfirmed closes" }, { operation, cause: new AggregateError(failures, cause.message) }).bindCleanupDependencies(cleanup);
    }
    if (!(cause instanceof ArtifactReaderFailure))
        return cause;
    if (cause.cleanup !== undefined) {
        const cleanup = new ProviderCleanupError("cutter", cause.cleanup.resources, { reason: cause.cleanup.reason }, { operation, cause });
        bindArtifactFileCleanup(cause, cleanup);
        const outcome = cause instanceof ArtifactFileCleanupFailure
            ? cause.fileCleanupFailure.outcome
            : undefined;
        const cancellation = artifactFileCompletion(cause)?.cancellation;
        const primary = outcome?.kind === "failed"
            ? discoveryFailure(outcome.cause, operation)
            : cancellation !== undefined
                ? new AnalysisCancelledError(operation, {
                    cause: cancellation.reason,
                })
                : undefined;
        if (primary === undefined && outcome?.kind !== "failed")
            return cleanup;
        const original = primary instanceof AnalysisError
            ? primary
            : new ProviderAdapterError("cutter", operation, { cause: primary });
        return analysisErrorWithCleanupFailure(original, cleanup, operation).bindCleanupDependencies([cleanup]);
    }
    if (cause.reason === "cancelled")
        return new AnalysisCancelledError(operation, {
            cause: artifactFileCancellationCause(cause),
        });
    return cause;
};
