import { throwIfJadxInterrupted } from "./JadxInterruption.js";
import { Client } from "@modelcontextprotocol/client";
import { createAnalysisExecution } from "../application/AnalysisProvider.js";
import { AnalysisCapabilityUnavailableError, AnalysisInputError, AnalysisOutputError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { jsonObjectSchema, jsonValueSchema, } from "../domain/jsonValue.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { analyzeJadxRequest } from "./JadxAnalysis.js";
import { JadxMcpTransport } from "./JadxMcpTransport.js";
import { parseJadxClassPage, jadxLoadSchema, parseJadxFailure, jadxRuntimeSchema, parseJadxEnvelope, parseJadxJson, } from "./JadxProtocol.js";
import { JADX_BRIDGE_IDENTITY, JADX_RELEASE, JADX_PROVIDER_IDENTITY, JADX_LIMITATIONS, } from "./JadxRelease.js";
/** One owned engine connection; its wire protocol stays inside the Android adapter. */
export class JadxSession {
    transport;
    #client = new Client({ name: "rea-android-adapter", version: "1" });
    #loaded;
    #connected = false;
    #partialContext;
    #observedCalls = [];
    #serverName = null;
    #serverVersion = null;
    #engineVersion = null;
    constructor(options, launcher) {
        this.transport = new JadxMcpTransport(options, launcher);
    }
    /** Analyze one admitted immutable APK, checking producer identity and selectors. */
    async execute(context) {
        const { request, target, snapshot, jarHash, signal, timeoutMs } = context;
        this.#partialContext = {
            operation: request.operation,
            selectedPath: request.input.path,
            target,
            jarHash,
            bridgeHash: context.bridgeHash,
        };
        this.#observedCalls = [];
        this.#serverName = null;
        this.#serverVersion = null;
        this.#engineVersion = null;
        const abort = () => {
            void this.transport.interrupt(signal.reason).catch(() => undefined);
        };
        signal.addEventListener("abort", abort, { once: true });
        try {
            if (signal.aborted)
                abort();
            throwIfJadxInterrupted(signal);
            this.transport.beginOperation();
            if (!this.#connected) {
                await this.#client.connect(this.transport, { timeout: 30_000 });
                this.#connected = true;
            }
            const server = this.#client.getServerVersion();
            this.#serverName = server?.name ?? null;
            this.#serverVersion = server?.version ?? null;
            if (server?.name !== JADX_BRIDGE_IDENTITY.name ||
                server.version !== JADX_BRIDGE_IDENTITY.version)
                throw new AnalysisCapabilityUnavailableError("jadx", request.operation, `Expected ${JADX_BRIDGE_IDENTITY.name} ${JADX_BRIDGE_IDENTITY.version}; server reported ${server?.name ?? "unknown"} ${server?.version ?? "unknown"}.`);
            const tools = this.#tools(request, target, signal, timeoutMs);
            const runtime = jadxRuntimeSchema.parse(await tools.json("rea_jvm_status", {}));
            this.#engineVersion = runtime.engine_reported_version;
            if (runtime.engine_reported_version !== JADX_RELEASE.version)
                throw new AnalysisCapabilityUnavailableError("jadx", request.operation, `Expected engine ${JADX_RELEASE.version}; JAR reported ${runtime.engine_reported_version}.`);
            const loaded = this.#loaded ??
                jadxLoadSchema.parse(await tools.json("load_apk", {
                    path: snapshot,
                    threads: 1,
                    resources: "full",
                }));
            if (loaded.apk_path !== snapshot)
                throw new AnalysisOutputError(request.operation, "JADX loaded a different APK path than the admitted snapshot");
            this.#loaded = loaded;
            const engine = {
                name: "jadx-headless-mcp",
                version: runtime.engine_reported_version,
                artifact_sha256: jarHash,
                source_revision: jarHash === JADX_RELEASE.sha256 ? JADX_RELEASE.revision : null,
                worker_count: 1,
                heap_limit_mib: Math.floor(runtime.max_heap_bytes / (1024 * 1024)) || null,
            };
            const result = await analyzeJadxRequest(tools, request, loaded, engine);
            const raw = jsonObjectSchema.parse({
                server,
                bridge_sha256: context.bridgeHash,
                jar_sha256: jarHash,
                loaded,
            });
            const execution = createAnalysisExecution(result, JADX_PROVIDER_IDENTITY, {
                rawResult: {
                    ...raw,
                    calls: this.#observedCalls.map(({ complete }) => complete),
                },
                subject: target,
                limitations: JADX_LIMITATIONS,
                locations: request.operation === "inspect_android_package"
                    ? [{ kind: "artifact-path", path: "AndroidManifest.xml" }]
                    : [],
            });
            return request.operation === "search_android_classes"
                ? {
                    ...execution,
                    searchRawSummary: {
                        ...raw,
                        calls: this.#observedCalls.map(({ complete, inline }) => inline ?? complete),
                    },
                }
                : execution;
        }
        finally {
            signal.removeEventListener("abort", abort);
        }
    }
    /** Facts and upstream replies retained if a later request step fails. */
    partialObservation() {
        const context = this.#partialContext;
        if (context === undefined)
            return undefined;
        return {
            provider_id: "jadx",
            operation: context.operation,
            target: {
                selected_path: context.selectedPath,
                path: context.target.path,
                sha256: context.target.sha256,
                format: "apk",
            },
            provider_facts: {
                jar_sha256: context.jarHash,
                bridge_sha256: context.bridgeHash,
                bridge_name: JADX_BRIDGE_IDENTITY.name,
                bridge_version: JADX_BRIDGE_IDENTITY.version,
                server_name: this.#serverName,
                server_version: this.#serverVersion,
                engine_version: this.#engineVersion,
            },
            calls: this.#observedCalls.map(({ complete }) => complete),
        };
    }
    /** Whether the selected Java runtime established the REA bridge protocol. */
    initialized() {
        return this.#connected;
    }
    /** Join owned cleanup even if SDK connection teardown itself fails. */
    async close() {
        try {
            await this.#client.close();
        }
        finally {
            await this.transport.close();
        }
    }
    #tools(request, target, signal, timeoutMs) {
        const call = async (name, input) => {
            throwIfJadxInterrupted(signal);
            // Keep an explicit bound: omitting it falls back to the SDK's 60-second default.
            const response = await this.#client.callTool({ name, arguments: input }, { timeout: timeoutMs, signal });
            const observedResponse = jsonValueSchema.parse(response);
            const call = { operation: name, input, response: observedResponse };
            const observation = { complete: call };
            this.#observedCalls.push(observation);
            const envelope = parseJadxEnvelope(observedResponse, request.operation);
            const text = envelope.content[0].text;
            if (envelope.isError === true) {
                const failure = parseJadxFailure(text);
                if (failure !== undefined) {
                    if (name === "load_apk" && failure.kind === "jvm-memory-failure")
                        throw new AnalysisResourceConstraintError(request.operation, "memory", `The JADX JVM could not allocate memory during ${name}${failure.message ? `: ${failure.message}` : ""}`, {
                            observed_max_heap_bytes: failure.max_heap_bytes,
                            memory_area: failure.memory_area,
                        }, {
                            retryable: false,
                            remediationAction: failure.memory_area === "heap"
                                ? "Increase REA_JADX_HEAP_MIB (MiB) in the environment that starts REA, within the host or container memory budget. Review JAVA_TOOL_OPTIONS and other JVM heap overrides. The observed heap is this run's limit, not the heap the APK requires."
                                : "Review the JVM allocation failure and the host or container memory limits. The observed maximum heap does not establish which memory region was exhausted; increasing heap alone may not help.",
                            diagnostics: {
                                upstream_operation: name,
                                reason: failure.message ?? null,
                                exception_type: failure.exception_type,
                                target_path: target.path,
                                target_sha256: target.sha256,
                            },
                        });
                    if (failure.kind === "invalid-input")
                        throw new AnalysisInputError(request.operation, undefined, [
                            {
                                path: [failure.field],
                                reason: "invalid_value",
                                message: failure.message,
                            },
                        ]);
                }
                throw new ProviderAdapterError("jadx", request.operation, {
                    diagnostics: {
                        upstream_operation: name,
                        reason: text,
                        target_path: target.path,
                        target_sha256: target.sha256,
                    },
                });
            }
            return { text, envelope, observation };
        };
        return {
            text: async (name, input) => (await call(name, input)).text,
            json: async (name, input) => parseJadxJson((await call(name, input)).text, request.operation),
            listClasses: async (input) => {
                const reply = await call("list_classes", input);
                const page = parseJadxClassPage(parseJadxJson(reply.text, request.operation));
                const { items, ...audit } = page;
                reply.observation.inline = {
                    ...reply.observation.complete,
                    inventory_elided: true,
                    response: {
                        ...reply.envelope,
                        content: reply.envelope.content.map((entry) => ({
                            ...entry,
                            text: JSON.stringify({ ...audit, items_omitted: items.length }),
                        })),
                    },
                };
                return page;
            },
        };
    }
}
