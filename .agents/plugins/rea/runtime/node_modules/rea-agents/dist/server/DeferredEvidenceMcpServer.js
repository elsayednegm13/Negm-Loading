import { EvidenceMcpServerCore, currentMcpRequestSignal, } from "./EvidenceMcpServerCore.js";
import { promptArgumentsSchema } from "./promptArguments.js";
import { SERVER_START_FAILED } from "../main/messages.js";
/** Borrow the build-owned wire projection while retaining the canonical parser. */
const recordedProjection = (schema, projection) => ({
    "~standard": {
        ...schema["~standard"],
        jsonSchema: { input: () => projection, output: () => projection },
    },
});
/** One SDK server, with async canonical validation installed on first use. */
export class DeferredEvidenceMcpServer extends EvidenceMcpServerCore {
    initialize;
    tools = new Map();
    prompts = new Map();
    loading;
    closing = false;
    closeAttempt;
    protocolClosed = false;
    runtimeClosed = false;
    runtimeCleanup;
    partialClose;
    materializing = false;
    protocolClose = () => super.close();
    constructor(catalog, delivery, initialize) {
        super(catalog.info, {
            capabilities: catalog.capabilities,
            instructions: catalog.instructions,
        }, undefined, delivery, undefined, false, catalog.identity);
        this.initialize = initialize;
        for (const tool of catalog.tools) {
            const { name, inputSchema, outputSchema, ...metadata } = tool;
            let binding;
            const input = {
                "~standard": {
                    version: 1,
                    vendor: "rea",
                    jsonSchema: { input: () => inputSchema, output: () => inputSchema },
                    validate: async (value) => {
                        await this.ensureRuntime();
                        const canonical = binding.registered.inputSchema;
                        if (canonical === undefined || canonical === input)
                            throw new Error(SERVER_START_FAILED);
                        return canonical["~standard"].validate(value);
                    },
                },
            };
            const output = outputSchema === undefined
                ? undefined
                : {
                    "~standard": {
                        version: 1,
                        vendor: "rea",
                        jsonSchema: {
                            input: () => outputSchema,
                            output: () => outputSchema,
                        },
                        validate: async (value) => {
                            await this.ensureRuntime();
                            const canonical = binding.registered.outputSchema;
                            if (canonical === undefined || canonical === output)
                                throw new Error(SERVER_START_FAILED);
                            return canonical["~standard"].validate(value);
                        },
                    },
                };
            const registered = super.bindTool(name, {
                ...metadata,
                inputSchema: input,
                ...(output === undefined ? {} : { outputSchema: output }),
            }, (async (args, ctx) => {
                await this.ensureRuntime();
                ctx.mcpReq.signal.throwIfAborted();
                if (binding.callback === undefined)
                    throw new Error(SERVER_START_FAILED);
                return binding.callback(args, ctx);
            }));
            binding = { registered, input: inputSchema, output: outputSchema };
            this.tools.set(name, binding);
        }
        const completion = {
            complete: async (...args) => {
                await this.ensureRuntime();
                currentMcpRequestSignal()?.throwIfAborted();
                if (this.promptCompletion === undefined)
                    throw new Error(SERVER_START_FAILED);
                return this.promptCompletion.complete(...args);
            },
        };
        for (const prompt of catalog.prompts) {
            const { name, parameters, title, description } = prompt;
            let binding;
            const argsSchema = promptArgumentsSchema({ arguments: parameters }, completion);
            const registered = super.registerCanonicalPrompt(name, {
                ...(title === undefined ? {} : { title }),
                ...(description === undefined ? {} : { description }),
                argsSchema,
            }, async (args, ctx) => {
                await this.ensureRuntime();
                ctx.mcpReq.signal.throwIfAborted();
                if (binding.callback === undefined)
                    throw new Error(SERVER_START_FAILED);
                return binding.callback(args, ctx);
            });
            binding = { registered };
            this.prompts.set(name, binding);
        }
    }
    ensureRuntime() {
        if (this.closing)
            return Promise.reject(new Error("MCP connection is closed"));
        this.loading ??= Promise.resolve()
            .then(() => this.initialize(this))
            .catch(() => {
            throw new Error(SERVER_START_FAILED);
        });
        return this.loading;
    }
    /** Register an awaitable cleanup capability before runtime startup can fail. */
    ownRuntimeCleanup(close) {
        this.runtimeCleanup = close;
    }
    /** Canonical composition may wrap close; retain that exact cleanup capability. */
    materialize(build) {
        const ownedClose = this.close.bind(this);
        this.materializing = true;
        this.close = this.protocolClose;
        try {
            build();
            if (this.tools.size !== 0 || this.prompts.size !== 0)
                throw new Error("MCP catalog does not match runtime registrations");
        }
        finally {
            this.partialClose = this.close.bind(this);
            this.close = ownedClose;
            this.materializing = false;
        }
    }
    closePartialRuntime() {
        return this.partialClose?.() ?? Promise.resolve();
    }
    bindTool(name, config, callback) {
        const binding = this.tools.get(name);
        if (!this.materializing ||
            binding === undefined ||
            config.inputSchema === undefined ||
            (config.outputSchema === undefined) !== (binding.output === undefined))
            throw new Error("Unexpected MCP runtime registration");
        const canonical = callback;
        const guarded = async (args, ctx) => {
            ctx.mcpReq.signal.throwIfAborted();
            await this.ensureRuntime();
            ctx.mcpReq.signal.throwIfAborted();
            return canonical(args, ctx);
        };
        binding.callback = guarded;
        const { inputSchema: _input, outputSchema: _output, ...metadata } = config;
        binding.registered.update({
            ...metadata,
            paramsSchema: recordedProjection(config.inputSchema, binding.input),
            ...(config.outputSchema === undefined || binding.output === undefined
                ? {}
                : {
                    outputSchema: recordedProjection(config.outputSchema, binding.output),
                }),
            callback: guarded,
        });
        this.tools.delete(name);
        return binding.registered;
    }
    registerCanonicalPrompt(name, config, callback) {
        const binding = this.prompts.get(name);
        if (!this.materializing || binding === undefined)
            throw new Error("Unexpected MCP runtime prompt");
        const canonical = callback;
        binding.callback = async (args, ctx) => {
            ctx.mcpReq.signal.throwIfAborted();
            await this.ensureRuntime();
            ctx.mcpReq.signal.throwIfAborted();
            return canonical(args, ctx);
        };
        binding.registered.update({
            ...config,
            callback: binding.callback,
        });
        this.prompts.delete(name);
        return binding.registered;
    }
    bindPromptCompletion(completion) {
        return super.bindPromptCompletion({
            complete: async (...args) => {
                await this.ensureRuntime();
                currentMcpRequestSignal()?.throwIfAborted();
                return completion.complete(...args);
            },
        });
    }
    sendToolListChanged() {
        if (!this.materializing)
            super.sendToolListChanged();
    }
    sendPromptListChanged() {
        if (!this.materializing)
            super.sendPromptListChanged();
    }
    close() {
        this.closing = true;
        this.closeAttempt ??= Promise.resolve()
            .then(() => this.finishClose())
            .catch((cause) => {
            this.closeAttempt = undefined;
            throw cause;
        });
        return this.closeAttempt;
    }
    async finishClose() {
        const errors = [];
        if (!this.protocolClosed) {
            try {
                await this.protocolClose();
                this.protocolClosed = true;
            }
            catch (cause) {
                errors.push(cause);
            }
        }
        await this.loading?.catch(() => undefined);
        if (!this.runtimeClosed && this.runtimeCleanup !== undefined) {
            try {
                await this.runtimeCleanup();
                this.runtimeClosed = true;
            }
            catch (cause) {
                errors.push(cause);
            }
        }
        if (errors.length > 0)
            throw new AggregateError(errors, "MCP runtime cleanup failed");
    }
}
