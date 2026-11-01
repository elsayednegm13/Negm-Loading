import bindings from "bindings";
import util from "util";
import { Minimatch } from "minimatch";
import { Duplex } from "stream";
const { inspect } = util;
const binding = bindings({
    bindings: "frida_binding",
    try: [
        ["module_root", "build", "bindings"],
        [process.cwd(), "bindings"],
    ]
});
var MessageTypeImpl;
(function (MessageTypeImpl) {
    MessageTypeImpl["Send"] = "send";
    MessageTypeImpl["Error"] = "error";
})(MessageTypeImpl || (MessageTypeImpl = {}));
binding.MessageType = MessageTypeImpl;
export const MessageType = binding.MessageType;
var LogLevelImpl;
(function (LogLevelImpl) {
    LogLevelImpl["Info"] = "info";
    LogLevelImpl["Warning"] = "warning";
    LogLevelImpl["Error"] = "error";
})(LogLevelImpl || (LogLevelImpl = {}));
binding.LogLevel = LogLevelImpl;
export const LogLevel = binding.LogLevel;
{
    const STANDARD_SPAWN_OPTION_NAMES = new Set([
        "argv",
        "envp",
        "env",
        "cwd",
        "stdio",
    ]);
    class ScriptServices {
        exportsProxy = new ScriptExportsProxy(this);
        #script;
        #pendingRequests = new Map();
        #nextRequestId = 1;
        constructor(script) {
            this.#script = script;
            process.nextTick(() => {
                script.message.connect(() => { });
            });
        }
        handleMessageIntercept = (message, data) => {
            if (message.type === MessageType.Send && isRpcSendMessage(message)) {
                const [, id, operation, ...params] = message.payload;
                this.#onRpcMessage(id, operation, params, data);
                return false;
            }
            else if (isLogMessage(message)) {
                const opaqueMessage = message;
                const logMessage = opaqueMessage;
                this.#script.logHandler(logMessage.level, logMessage.payload);
                return false;
            }
            return true;
        };
        request(operation, params, data, cancellable = null) {
            return new Promise((resolve, reject) => {
                const id = this.#nextRequestId++;
                const complete = (error, result) => {
                    if (cancellable !== null) {
                        cancellable.cancelled.disconnect(onOperationCancelled);
                    }
                    this.#script.destroyed.disconnect(onScriptDestroyed);
                    this.#pendingRequests.delete(id);
                    if (error === null) {
                        resolve(result);
                    }
                    else {
                        reject(error);
                    }
                };
                function onScriptDestroyed() {
                    complete(new Error("Script is destroyed"));
                }
                function onOperationCancelled() {
                    complete(new Error("Operation was cancelled"));
                }
                this.#pendingRequests.set(id, complete);
                this.#script.post(["frida:rpc", id, operation, ...params], data);
                this.#script.destroyed.connect(onScriptDestroyed);
                if (cancellable !== null) {
                    cancellable.cancelled.connect(onOperationCancelled);
                    if (cancellable.isCancelled) {
                        onOperationCancelled();
                        return;
                    }
                }
                if (this.#script.isDestroyed) {
                    onScriptDestroyed();
                }
            });
        }
        #onRpcMessage(id, operation, params, data) {
            if (operation === RpcOperation.Ok || operation === RpcOperation.Error) {
                const callback = this.#pendingRequests.get(id);
                if (callback === undefined) {
                    return;
                }
                let value = null;
                let error = null;
                if (operation === RpcOperation.Ok) {
                    if (data !== null) {
                        value = (params.length > 1) ? [params[1], data] : data;
                    }
                    else {
                        value = params[0];
                    }
                }
                else {
                    const [message, name, stack, rawErr] = params;
                    error = new Error(message);
                    error.name = name;
                    error.stack = stack;
                    Object.assign(error, rawErr);
                }
                callback(error, value);
            }
        }
    }
    class ScriptExportsProxy {
        constructor(rpcController) {
            return new Proxy(this, {
                has(target, property) {
                    return !isReservedMethodName(property);
                },
                get(target, property, receiver) {
                    if (typeof property === "symbol") {
                        if (property === inspect.custom) {
                            return inspectProxy;
                        }
                        return undefined;
                    }
                    if (property in target) {
                        return target[property];
                    }
                    if (isReservedMethodName(property)) {
                        return undefined;
                    }
                    return (...args) => {
                        let cancellable = null;
                        if (args[args.length - 1] instanceof Cancellable) {
                            cancellable = args.pop();
                        }
                        let data = null;
                        if (Buffer.isBuffer(args[args.length - 1])) {
                            data = args.pop();
                        }
                        return rpcController.request("call", [property, args], data, cancellable);
                    };
                },
                set(target, property, value, receiver) {
                    if (typeof property === "symbol") {
                        return false;
                    }
                    target[property] = value;
                    return true;
                },
                ownKeys(target) {
                    return Object.getOwnPropertyNames(target);
                },
                getOwnPropertyDescriptor(target, property) {
                    if (property in target) {
                        return Object.getOwnPropertyDescriptor(target, property);
                    }
                    if (isReservedMethodName(property)) {
                        return undefined;
                    }
                    return {
                        writable: true,
                        configurable: true,
                        enumerable: true
                    };
                },
            });
        }
    }
    function inspectProxy() {
        return "ScriptExportsProxy {}";
    }
    let RpcOperation;
    (function (RpcOperation) {
        RpcOperation["Ok"] = "ok";
        RpcOperation["Error"] = "error";
    })(RpcOperation || (RpcOperation = {}));
    function isInternalMessage(message) {
        return isRpcMessage(message) || isLogMessage(message);
    }
    function isRpcMessage(message) {
        return message.type === MessageType.Send && isRpcSendMessage(message);
    }
    function isRpcSendMessage(message) {
        const payload = message.payload;
        if (!Array.isArray(payload)) {
            return false;
        }
        return payload[0] === "frida:rpc";
    }
    function isLogMessage(message) {
        return message.type === "log";
    }
    function log(level, text) {
        switch (level) {
            case LogLevel.Info:
                console.log(text);
                break;
            case LogLevel.Warning:
                console.warn(text);
                break;
            case LogLevel.Error:
                console.error(text);
                break;
        }
    }
    const reservedMethodNames = new Set([
        "then",
        "catch",
        "finally",
    ]);
    function isReservedMethodName(name) {
        return reservedMethodNames.has(name.toString());
    }
    const IO_PRIORITY_DEFAULT = 0;
    class IOStreamAdapter extends Duplex {
        #impl;
        #input;
        #output;
        #pending = new Set();
        #cancellable = new Cancellable();
        constructor(impl) {
            super({});
            this.#impl = impl;
            this.#input = impl.inputStream;
            this.#output = impl.outputStream;
        }
        async _destroy(error, callback) {
            this.#cancellable.cancel();
            for (const operation of this.#pending) {
                try {
                    await operation;
                }
                catch (e) {
                }
            }
            try {
                await this.#impl.close(IO_PRIORITY_DEFAULT);
            }
            catch (e) {
            }
            callback(error);
        }
        _read(size) {
            const operation = this.#input.read(size, IO_PRIORITY_DEFAULT, this.#cancellable)
                .then((data) => {
                const isEof = data.length === 0;
                if (isEof) {
                    this.push(null);
                    return;
                }
                this.push(data);
            })
                .catch((error) => {
                if (this.#impl.closed) {
                    this.push(null);
                }
                this.emit("error", error);
            });
            this.#track(operation);
        }
        _write(chunk, encoding, callback) {
            let data;
            if (Buffer.isBuffer(chunk)) {
                data = chunk;
            }
            else {
                data = Buffer.from(chunk, encoding);
            }
            const operation = this.#writeAll(data)
                .then(() => {
                callback(null);
            })
                .catch((error) => {
                callback(error);
            });
            this.#track(operation);
        }
        async #writeAll(data) {
            let offset = 0;
            do {
                const n = await this.#output.write(data.slice(offset), IO_PRIORITY_DEFAULT, this.#cancellable);
                offset += n;
            } while (offset !== data.length);
        }
        #track(operation) {
            this.#pending.add(operation);
            operation
                .catch(_ => { })
                .finally(() => {
                this.#pending.delete(operation);
            });
        }
    }
    class CallbackAuthenticationService extends binding.AbstractAuthenticationService {
        #callback;
        constructor(callback) {
            super();
            this.#callback = callback;
        }
        async authenticate(token, cancellable) {
            const info = await this.#callback(token);
            return JSON.stringify(info);
        }
    }
    function parseSocketAddress(address) {
        const family = address.family;
        switch (family) {
            case SocketFamily.Unix: {
                const addr = address;
                switch (addr.addressType) {
                    case UnixSocketAddressType.Anonymous:
                        return {
                            family: "unix:anonymous",
                        };
                    case UnixSocketAddressType.Path:
                        return {
                            family: "unix:path",
                            path: addr.path.toString(),
                        };
                    case UnixSocketAddressType.Abstract:
                    case UnixSocketAddressType.AbstractPadded:
                        return {
                            family: "unix:abstract",
                            path: addr.path,
                        };
                }
                break;
            }
            case SocketFamily.Ipv4: {
                const addr = address;
                return {
                    family: "ipv4",
                    address: addr.address.toString(),
                    port: addr.port,
                };
            }
            case SocketFamily.Ipv6: {
                const addr = address;
                return {
                    family: "ipv6",
                    address: addr.address.toString(),
                    port: addr.port,
                    flowlabel: addr.flowinfo,
                    scopeid: addr.scopeId,
                };
            }
        }
        throw new Error("invalid BaseSocketAddress");
    }
    function objectToStrv(object) {
        return Object.entries(object).map(([k, v]) => `${k}=${v}`);
    }
    class SignalWrapper {
        #source;
        #transform;
        #intercept;
        #handlers = new Set();
        constructor(source, options) {
            this.#source = source;
            if (options === undefined || options.transform === undefined) {
                this.#intercept = options?.intercept;
            }
            else {
                this.#transform = options.transform;
                this.#intercept = options.intercept;
            }
        }
        connect(handler) {
            this.#handlers.add(handler);
            if (this.#handlers.size === 1) {
                this.#source.connect(this.#wrappedHandler);
            }
        }
        disconnect(handler) {
            this.#handlers.delete(handler);
            if (this.#handlers.size === 0) {
                this.#source.disconnect(this.#wrappedHandler);
            }
        }
        #wrappedHandler = ((...sourceArgs) => {
            let targetArgs;
            const transform = this.#transform;
            if (transform === undefined) {
                targetArgs = sourceArgs;
            }
            else {
                targetArgs = transform(...sourceArgs);
            }
            const intercept = this.#intercept;
            if (intercept !== undefined) {
                if (!intercept(...targetArgs)) {
                    return;
                }
            }
            for (const handler of this.#handlers) {
                handler(...targetArgs);
            }
        });
    }
    function inspectWrapper(object, name, properties, depth, options) {
        if (depth < 0) {
            return options.stylize(`[${name}]`, "special");
        }
        const summary = Object.fromEntries(properties.map(name => [name, object[name]]));
        const nextOptions = Object.assign({}, options, {
            depth: (options.depth === null) ? null : depth - 1
        });
        return name + " " + inspect(summary, nextOptions);
    }
    binding.DeviceManager.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "DeviceManager", [], depth, options);
    };
    binding._Device.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Device", ["id", "name", "icon", "type", "bus"], depth, options);
    };
    class Device extends binding._Device {
        async getProcess(name, options = {}, cancellable) {
            const { scope = Scope.Minimal, } = options;
            const processes = await this.enumerateProcesses({ scope }, cancellable);
            const mm = new Minimatch(name.toLowerCase());
            const matching = processes.filter(process => mm.match(process.name.toLowerCase()));
            if (matching.length === 1) {
                return matching[0];
            }
            else if (matching.length > 1) {
                throw new Error("Ambiguous name; it matches: " + matching.map(process => `${process.name} (pid: ${process.pid})`).join(", "));
            }
            else {
                throw new Error("Process not found");
            }
        }
        async #getPid(target, cancellable) {
            if (typeof target === "number") {
                return target;
            }
            const process = await this.getProcess(target, {}, cancellable);
            return process.pid;
        }
        async querySystemParameters(cancellable) {
            const result = await this._querySystemParameters(cancellable);
            return result;
        }
        async spawn(programOrArgv, opts, cancellable) {
            const options = {};
            let program;
            let argv;
            if (typeof programOrArgv === "string") {
                program = programOrArgv;
                argv = opts?.argv;
            }
            else {
                program = programOrArgv[0];
                argv = programOrArgv;
                if (argv.length === 1) {
                    argv = undefined;
                }
            }
            if (argv !== undefined) {
                options.argv = argv;
            }
            if (opts !== undefined) {
                const envp = opts.envp;
                if (envp !== undefined) {
                    options.envp = objectToStrv(envp);
                }
                const env = opts.env;
                if (env !== undefined) {
                    options.env = objectToStrv(env);
                }
                const cwd = opts.cwd;
                if (cwd !== undefined) {
                    options.cwd = cwd;
                }
                const stdio = opts.stdio;
                if (stdio !== undefined) {
                    options.stdio = stdio;
                }
                options.aux = Object.fromEntries(Object.entries(opts).filter(([k, v]) => !STANDARD_SPAWN_OPTION_NAMES.has(k)));
            }
            const result = await this._spawn(program, options, cancellable);
            return result;
        }
        async input(target, data, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._input(pid, data, cancellable);
            return result;
        }
        async resume(target, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._resume(pid, cancellable);
            return result;
        }
        async kill(target, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._kill(pid, cancellable);
            return result;
        }
        async attach(target, options, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._attach(pid, options, cancellable);
            return result;
        }
        async injectLibraryFile(target, path, entrypoint, data, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._injectLibraryFile(pid, path, entrypoint, data, cancellable);
            return result;
        }
        async injectLibraryBlob(target, blob, entrypoint, data, cancellable) {
            const pid = await this.#getPid(target, cancellable);
            const result = await this._injectLibraryBlob(pid, blob, entrypoint, data, cancellable);
            return result;
        }
        async openChannel(address, cancellable) {
            const result = await this._openChannel(address, cancellable);
            return new IOStreamAdapter(result);
        }
        output = new SignalWrapper(this._output, {
            transform(pid, fd, data) {
                return [pid, fd, data];
            },
        });
        uninjected = new SignalWrapper(this._uninjected, {
            transform(id) {
                return [id];
            },
        });
    }
    binding.Device = Device;
    binding.BareboneConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneConfig", ["connection", "allocator", "agent", "image", "kernel"], depth, options);
    };
    binding.BareboneConnectionConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneConnectionConfig", ["host", "port", "pid", "flavor"], depth, options);
    };
    binding.BareboneAllocatorConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneAllocatorConfig", [], depth, options);
    };
    binding.BareboneInvalidAllocatorConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInvalidAllocatorConfig", [], depth, options);
    };
    binding.BarebonePhysicalAllocatorConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BarebonePhysicalAllocatorConfig", ["physicalBase"], depth, options);
    };
    binding.BareboneTargetFunctionsAllocatorConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneTargetFunctionsAllocatorConfig", ["allocFunction", "freeFunction", "allocFlags"], depth, options);
    };
    binding.BareboneCallArgument.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneCallArgument", ["role", "value"], depth, options);
    };
    binding.BareboneAgentConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneAgentConfig", [], depth, options);
    };
    binding.BareboneInvalidAgentConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInvalidAgentConfig", [], depth, options);
    };
    binding.BareboneInjectedAgentConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInjectedAgentConfig", ["image", "transport"], depth, options);
    };
    binding.BareboneResidentAgentConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneResidentAgentConfig", ["transport"], depth, options);
    };
    binding.BareboneTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneTransportConfig", [], depth, options);
    };
    binding.BareboneInjectingTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInjectingTransportConfig", [], depth, options);
    };
    binding.BareboneResidentTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneResidentTransportConfig", [], depth, options);
    };
    binding.BareboneHostlinkTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneHostlinkTransportConfig", ["qmp", "bus", "fabric"], depth, options);
    };
    binding.BareboneHostlinkFabric.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneHostlinkFabric", [], depth, options);
    };
    binding.BareboneHostlinkEcamFabric.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneHostlinkEcamFabric", ["ecam"], depth, options);
    };
    binding.BareboneHostlinkPortsFabric.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneHostlinkPortsFabric", [], depth, options);
    };
    binding.BareboneHostlinkMmioFabric.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneHostlinkMmioFabric", [], depth, options);
    };
    binding.BareboneVsockTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneVsockTransportConfig", ["socketPath", "port"], depth, options);
    };
    binding.BareboneSerialTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneSerialTransportConfig", ["path"], depth, options);
    };
    binding.BareboneVsockPipeTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneVsockPipeTransportConfig", ["socketPath"], depth, options);
    };
    binding.BareboneGoldfishPipeTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneGoldfishPipeTransportConfig", ["socketPath"], depth, options);
    };
    binding.BareboneDeviceTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneDeviceTransportConfig", ["path"], depth, options);
    };
    binding.BareboneSocketTransportConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneSocketTransportConfig", ["path"], depth, options);
    };
    binding.BareboneImageConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneImageConfig", ["base"], depth, options);
    };
    binding.BareboneInvalidImageConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInvalidImageConfig", [], depth, options);
    };
    binding.BareboneXnuKernelcacheConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneXnuKernelcacheConfig", ["kernelcache"], depth, options);
    };
    binding.BareboneLinuxKernelConfig.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneLinuxKernelConfig", ["kernel"], depth, options);
    };
    binding.BareboneMemoryAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneMemoryAddress", ["label", "address"], depth, options);
    };
    binding.BareboneInvalidMemoryAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneInvalidMemoryAddress", [], depth, options);
    };
    binding.BareboneNonNullMemoryAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BareboneNonNullMemoryAddress", [], depth, options);
    };
    binding.Application.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Application", ["identifier", "name", "pid", "parameters"], depth, options);
    };
    binding.Process.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Process", ["pid", "name", "parameters"], depth, options);
    };
    binding.Spawn.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Spawn", ["pid", "identifier"], depth, options);
    };
    binding.Child.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Child", ["pid", "parentPid", "origin", "identifier", "path", "argv", "envp"], depth, options);
    };
    binding.Crash.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Crash", ["pid", "processName", "summary", "report", "parameters"], depth, options);
    };
    binding._Bus.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Bus", [], depth, options);
    };
    class Bus extends binding._Bus {
        post(message, data) {
            const json = JSON.stringify(message);
            this._post(json, data);
        }
        message = new SignalWrapper(this._message, {
            transform(json, data) {
                return [JSON.parse(json), data];
            },
        });
    }
    binding.Bus = Bus;
    binding.Service.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Service", [], depth, options);
    };
    binding.Session.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Session", ["pid", "persistTimeout"], depth, options);
    };
    binding._Script.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Script", [], depth, options);
    };
    class Script extends binding._Script {
        #services = new ScriptServices(this);
        logHandler = log;
        get isDestroyed() {
            return this._isDestroyed();
        }
        get exports() {
            return this.#services.exportsProxy;
        }
        get defaultLogHandler() {
            return log;
        }
        post(message, data) {
            const json = JSON.stringify(message);
            this._post(json, data);
        }
        async enableDebugger(options, cancellable) {
            const port = options?.port ?? 0;
            const result = await this._enableDebugger(port, cancellable);
            return result;
        }
        message = new SignalWrapper(this._message, {
            transform(json, data) {
                return [JSON.parse(json), data];
            },
            intercept: this.#services.handleMessageIntercept,
        });
    }
    binding.Script = Script;
    binding.PortalMembership.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PortalMembership", [], depth, options);
    };
    binding.LinuxKernelSymbols.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "LinuxKernelSymbols", [], depth, options);
    };
    binding.LinuxKernelImage.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "LinuxKernelImage", [], depth, options);
    };
    binding.LinuxSystemMap.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "LinuxSystemMap", [], depth, options);
    };
    binding.XnuKernelcache.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "XnuKernelcache", [], depth, options);
    };
    binding.PackageManager.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PackageManager", ["registry"], depth, options);
    };
    binding.Package.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Package", ["name", "version", "description", "url"], depth, options);
    };
    binding.PackageSearchResult.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PackageSearchResult", ["packages", "total"], depth, options);
    };
    binding.PackageInstallResult.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PackageInstallResult", ["packages"], depth, options);
    };
    binding.ControlService.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "ControlService", [], depth, options);
    };
    binding._PortalService.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PortalService", ["device", "clusterParams", "controlParams"], depth, options);
    };
    class PortalService extends binding._PortalService {
        constructor(options) {
            const clusterParams = options?.clusterParams ?? new EndpointParameters();
            const controlParams = options?.controlParams ?? null;
            super(clusterParams, controlParams);
        }
        post(connectionId, message, data) {
            const json = JSON.stringify(message);
            this._post(connectionId, json, data);
        }
        narrowcast(tag, message, data) {
            const json = JSON.stringify(message);
            this._narrowcast(tag, json, data);
        }
        broadcast(message, data) {
            const json = JSON.stringify(message);
            this._broadcast(json, data);
        }
        nodeConnected = new SignalWrapper(this._nodeConnected, {
            transform(connectionId, remoteAddress) {
                return [connectionId, parseSocketAddress(remoteAddress)];
            },
        });
        nodeJoined = new SignalWrapper(this._nodeJoined, {
            transform(connectionId, application) {
                return [connectionId, application];
            },
        });
        nodeLeft = new SignalWrapper(this._nodeLeft, {
            transform(connectionId, application) {
                return [connectionId, application];
            },
        });
        nodeDisconnected = new SignalWrapper(this._nodeDisconnected, {
            transform(connectionId, remoteAddress) {
                return [connectionId, parseSocketAddress(remoteAddress)];
            },
        });
        controllerConnected = new SignalWrapper(this._controllerConnected, {
            transform(connectionId, remoteAddress) {
                return [connectionId, parseSocketAddress(remoteAddress)];
            },
        });
        controllerDisconnected = new SignalWrapper(this._controllerDisconnected, {
            transform(connectionId, remoteAddress) {
                return [connectionId, parseSocketAddress(remoteAddress)];
            },
        });
        authenticated = new SignalWrapper(this._authenticated, {
            transform(connectionId, sessionInfo) {
                return [connectionId, JSON.parse(sessionInfo)];
            },
        });
        subscribe = new SignalWrapper(this._subscribe, {
            transform(connectionId) {
                return [connectionId];
            },
        });
        message = new SignalWrapper(this._message, {
            transform(connectionId, json, data) {
                return [connectionId, JSON.parse(json), data];
            },
        });
    }
    binding.PortalService = PortalService;
    binding.FileMonitor.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "FileMonitor", ["path"], depth, options);
    };
    binding.Compiler.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Compiler", [], depth, options);
    };
    binding.LanguageServer.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "LanguageServer", ["projectRoot"], depth, options);
    };
    binding.PatternCompiler.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternCompiler", [], depth, options);
    };
    binding.PatternModule.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternModule", ["types", "rootType", "inputs", "diagnostics"], depth, options);
    };
    binding.PatternInput.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternInput", ["name", "typeRef"], depth, options);
    };
    binding.PatternType.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternType", ["kind", "name", "doc", "file", "line", "character", "size", "align", "fields", "underlying", "values", "bits", "target"], depth, options);
    };
    binding.PatternField.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternField", ["name", "doc", "hidden", "conditional", "noUniqueAddress", "typeRef", "offset", "size"], depth, options);
    };
    binding.PatternTypeRef.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternTypeRef", ["kind", "display", "name", "order", "target", "width", "element", "length", "nullTerminated", "size"], depth, options);
    };
    binding.PatternEnumValue.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternEnumValue", ["name", "doc", "value", "last"], depth, options);
    };
    binding.PatternBit.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternBit", ["name", "doc", "kind", "offset", "bits", "enumName"], depth, options);
    };
    binding.PatternDiagnostic.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternDiagnostic", ["file", "line", "character", "message"], depth, options);
    };
    binding.PatternValue.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternValue", ["id", "name", "typeName", "address", "offset", "size", "value", "label", "displayName", "formatted", "comment", "color", "hidden", "inlined", "sealed", "bitOffset", "bits", "count", "fields", "elements", "truncated", "section", "visualizer"], depth, options);
    };
    binding.PatternVisualizer.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternVisualizer", ["name", "presentation", "arguments"], depth, options);
    };
    binding.PatternVisualizerArgument.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "PatternVisualizerArgument", ["kind", "value", "pattern", "address", "size", "data"], depth, options);
    };
    binding.StaticAuthenticationService.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "StaticAuthenticationService", ["tokenHash"], depth, options);
    };
    binding._Relay.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Relay", ["address", "username", "password", "kind"], depth, options);
    };
    class Relay extends binding._Relay {
        constructor(properties) {
            const { address, username, password, kind } = properties;
            super(address, username, password, kind);
        }
    }
    binding.Relay = Relay;
    binding._EndpointParameters.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "EndpointParameters", ["address", "port", "certificate", "origin", "authService", "assetRoot", "requestHandler"], depth, options);
    };
    class EndpointParameters extends binding._EndpointParameters {
        constructor(params) {
            const address = params?.address ?? null;
            const port = params?.port ?? 0;
            const certificate = params?.certificate ?? null;
            const origin = params?.origin ?? null;
            let authService = null;
            const auth = params?.authentication;
            if (auth !== undefined) {
                if (auth.scheme === "token") {
                    authService = new StaticAuthenticationService(auth.token);
                }
                else {
                    authService = new CallbackAuthenticationService(auth.callback);
                }
            }
            const assetRoot = params?.assetRoot ?? null;
            super(address, port, certificate, origin, authService, assetRoot);
        }
    }
    binding.EndpointParameters = EndpointParameters;
    binding.WebRequest.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "WebRequest", ["method", "path", "queryString", "body"], depth, options);
    };
    binding.WebResponse.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "WebResponse", ["status", "body"], depth, options);
    };
    binding.AuthenticationService.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "AuthenticationService", [], depth, options);
    };
    binding.WebRequestHandler.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "WebRequestHandler", [], depth, options);
    };
    binding.BaseObject.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BaseObject", [], depth, options);
    };
    binding._Cancellable.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "Cancellable", [], depth, options);
    };
    class Cancellable extends binding._Cancellable {
        get isCancelled() {
            return this._isCancelled();
        }
        static withTimeout(ms) {
            const c = new Cancellable();
            setTimeout(() => c.cancel(), ms).unref();
            return c;
        }
        combine(other) {
            const c = new Cancellable();
            this.cancelled.connect(() => c.cancel());
            other.cancelled.connect(() => c.cancel());
            if (this.isCancelled)
                c.cancel();
            if (other.isCancelled)
                c.cancel();
            return c;
        }
    }
    binding.Cancellable = Cancellable;
    binding.IOStream.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "IOStream", ["closed", "inputStream", "outputStream"], depth, options);
    };
    binding.InputStream.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "InputStream", [], depth, options);
    };
    binding.OutputStream.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "OutputStream", [], depth, options);
    };
    binding.InetSocketAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "InetSocketAddress", ["address", "flowinfo", "port", "scopeId"], depth, options);
    };
    binding.InetAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "InetAddress", ["family", "isAny", "isLinkLocal", "isLoopback", "isMcGlobal", "isMcLinkLocal", "isMcNodeLocal", "isMcOrgLocal", "isMcSiteLocal", "isMulticast", "isSiteLocal"], depth, options);
    };
    binding.UnixSocketAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "UnixSocketAddress", ["addressType", "path"], depth, options);
    };
    binding.BaseSocketAddress.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "BaseSocketAddress", ["family"], depth, options);
    };
    binding.SocketAddressEnumerator.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "SocketAddressEnumerator", [], depth, options);
    };
    binding.SocketConnectable.prototype[inspect.custom] = function (depth, options) {
        return inspectWrapper(this, "SocketConnectable", [], depth, options);
    };
}
binding.commitConstructors();
export const { DeviceManager, Device, RemoteDeviceOptions, BareboneDeviceOptions, BareboneConfig, BareboneConnectionConfig, BareboneAllocatorConfig, BareboneInvalidAllocatorConfig, BarebonePhysicalAllocatorConfig, BareboneTargetFunctionsAllocatorConfig, BareboneCallArgument, BareboneAgentConfig, BareboneInvalidAgentConfig, BareboneInjectedAgentConfig, BareboneResidentAgentConfig, BareboneTransportConfig, BareboneInjectingTransportConfig, BareboneResidentTransportConfig, BareboneHostlinkTransportConfig, BareboneHostlinkFabric, BareboneHostlinkEcamFabric, BareboneHostlinkPortsFabric, BareboneHostlinkMmioFabric, BareboneVsockTransportConfig, BareboneSerialTransportConfig, BareboneVsockPipeTransportConfig, BareboneGoldfishPipeTransportConfig, BareboneDeviceTransportConfig, BareboneSocketTransportConfig, BareboneImageConfig, BareboneInvalidImageConfig, BareboneXnuKernelcacheConfig, BareboneLinuxKernelConfig, BareboneMemoryAddress, BareboneInvalidMemoryAddress, BareboneNonNullMemoryAddress, Application, Process, ProcessMatchOptions, RawSpawnOptions, Spawn, Child, Crash, Bus, Service, Session, Script, PortalMembership, LinuxKernelSymbols, LinuxKernelImage, LinuxSystemMap, XnuKernelcache, PackageManager, Package, PackageSearchOptions, PackageSearchResult, PackageInstallOptions, PackageInstallResult, ControlService, ControlServiceOptions, PortalService, FileMonitor, Compiler, LanguageServer, PatternCompiler, PatternCompileOptions, PatternModule, PatternDecodeOptions, PatternInput, PatternType, PatternField, PatternTypeRef, PatternEnumValue, PatternBit, PatternDiagnostic, PatternValue, PatternVisualizer, PatternVisualizerArgument, CompilerOptions, BuildOptions, WatchOptions, LibraryOptions, StaticAuthenticationService, FrontmostQueryOptions, ApplicationQueryOptions, ProcessQueryOptions, SpawnGatingOptions, SessionOptions, ScriptOptions, SnapshotOptions, PortalOptions, PeerOptions, Relay, EndpointParameters, WebRequest, WebResponse, AbstractAuthenticationService, AbstractWebRequestHandler, BaseObject, Cancellable, IOStream, InputStream, OutputStream, InetSocketAddress, InetAddress, UnixSocketAddress, BaseSocketAddress, SocketAddressEnumerator, Runtime, DeviceType, BareboneKernelKind, BareboneStubFlavor, BareboneCallArgumentRole, PackageInstallPhase, PackageRole, PatternTypeKind, PatternTypeRefKind, PatternByteOrder, PatternBitKind, PatternVisualizerPresentation, PatternVisualizerArgumentKind, OutputFormat, BundleFormat, TypeCheckMode, SourceMaps, JsCompression, JsPlatform, GadgetBreakpointAction, Realm, Exceptor, SpawnGatingDisabledReason, SessionDetachReason, Scope, SpawnGatingScope, Stdio, ChildOrigin, SnapshotTransport, ScriptRuntime, RelayKind, XnuMachTrap, XnuBsdSyscall, WaitKind, FileMonitorEvent, SocketFamily, UnixSocketAddressType, } = binding;
const frida = {
    DeviceManager,
    Device,
    RemoteDeviceOptions,
    BareboneDeviceOptions,
    BareboneConfig,
    BareboneConnectionConfig,
    BareboneAllocatorConfig,
    BareboneInvalidAllocatorConfig,
    BarebonePhysicalAllocatorConfig,
    BareboneTargetFunctionsAllocatorConfig,
    BareboneCallArgument,
    BareboneAgentConfig,
    BareboneInvalidAgentConfig,
    BareboneInjectedAgentConfig,
    BareboneResidentAgentConfig,
    BareboneTransportConfig,
    BareboneInjectingTransportConfig,
    BareboneResidentTransportConfig,
    BareboneHostlinkTransportConfig,
    BareboneHostlinkFabric,
    BareboneHostlinkEcamFabric,
    BareboneHostlinkPortsFabric,
    BareboneHostlinkMmioFabric,
    BareboneVsockTransportConfig,
    BareboneSerialTransportConfig,
    BareboneVsockPipeTransportConfig,
    BareboneGoldfishPipeTransportConfig,
    BareboneDeviceTransportConfig,
    BareboneSocketTransportConfig,
    BareboneImageConfig,
    BareboneInvalidImageConfig,
    BareboneXnuKernelcacheConfig,
    BareboneLinuxKernelConfig,
    BareboneMemoryAddress,
    BareboneInvalidMemoryAddress,
    BareboneNonNullMemoryAddress,
    Application,
    Process,
    ProcessMatchOptions,
    RawSpawnOptions,
    Spawn,
    Child,
    Crash,
    Bus,
    Service,
    Session,
    Script,
    PortalMembership,
    LinuxKernelSymbols,
    LinuxKernelImage,
    LinuxSystemMap,
    XnuKernelcache,
    PackageManager,
    Package,
    PackageSearchOptions,
    PackageSearchResult,
    PackageInstallOptions,
    PackageInstallResult,
    ControlService,
    ControlServiceOptions,
    PortalService,
    FileMonitor,
    Compiler,
    LanguageServer,
    PatternCompiler,
    PatternCompileOptions,
    PatternModule,
    PatternDecodeOptions,
    PatternInput,
    PatternType,
    PatternField,
    PatternTypeRef,
    PatternEnumValue,
    PatternBit,
    PatternDiagnostic,
    PatternValue,
    PatternVisualizer,
    PatternVisualizerArgument,
    CompilerOptions,
    BuildOptions,
    WatchOptions,
    LibraryOptions,
    StaticAuthenticationService,
    FrontmostQueryOptions,
    ApplicationQueryOptions,
    ProcessQueryOptions,
    SpawnGatingOptions,
    SessionOptions,
    ScriptOptions,
    SnapshotOptions,
    PortalOptions,
    PeerOptions,
    Relay,
    EndpointParameters,
    WebRequest,
    WebResponse,
    AbstractAuthenticationService,
    AbstractWebRequestHandler,
    BaseObject,
    Cancellable,
    IOStream,
    InputStream,
    OutputStream,
    InetSocketAddress,
    InetAddress,
    UnixSocketAddress,
    BaseSocketAddress,
    SocketAddressEnumerator,
    Runtime,
    DeviceType,
    BareboneKernelKind,
    BareboneStubFlavor,
    BareboneCallArgumentRole,
    PackageInstallPhase,
    PackageRole,
    PatternTypeKind,
    PatternTypeRefKind,
    PatternByteOrder,
    PatternBitKind,
    PatternVisualizerPresentation,
    PatternVisualizerArgumentKind,
    OutputFormat,
    BundleFormat,
    TypeCheckMode,
    SourceMaps,
    JsCompression,
    JsPlatform,
    GadgetBreakpointAction,
    Realm,
    Exceptor,
    SpawnGatingDisabledReason,
    SessionDetachReason,
    Scope,
    SpawnGatingScope,
    Stdio,
    ChildOrigin,
    SnapshotTransport,
    ScriptRuntime,
    RelayKind,
    XnuMachTrap,
    XnuBsdSyscall,
    WaitKind,
    FileMonitorEvent,
    SocketFamily,
    UnixSocketAddressType,
    MessageType,
    LogLevel,
    querySystemParameters,
    spawn,
    resume,
    kill,
    attach,
    injectLibraryFile,
    injectLibraryBlob,
    enumerateDevices,
    getDeviceManager,
    getLocalDevice,
    getRemoteDevice,
    getUsbDevice,
    getDevice,
};
export default frida;
let sharedDeviceManager = null;
export async function querySystemParameters(cancellable) {
    const device = await getLocalDevice(cancellable);
    return await device.querySystemParameters(cancellable);
}
export async function spawn(program, options, cancellable) {
    const device = await getLocalDevice(cancellable);
    return await device.spawn(program, options, cancellable);
}
export async function resume(target, cancellable) {
    const device = await getLocalDevice(cancellable);
    await device.resume(target, cancellable);
}
export async function kill(target, cancellable) {
    const device = await getLocalDevice(cancellable);
    await device.kill(target, cancellable);
}
export async function attach(target, options, cancellable) {
    const device = await getLocalDevice(cancellable);
    return await device.attach(target, options, cancellable);
}
export async function injectLibraryFile(target, path, entrypoint, data, cancellable) {
    const device = await getLocalDevice(cancellable);
    return await device.injectLibraryFile(target, path, entrypoint, data, cancellable);
}
export async function injectLibraryBlob(target, blob, entrypoint, data, cancellable) {
    const device = await getLocalDevice(cancellable);
    return await device.injectLibraryBlob(target, blob, entrypoint, data, cancellable);
}
export async function enumerateDevices(cancellable) {
    const deviceManager = getDeviceManager();
    return await deviceManager.enumerateDevices(cancellable);
}
;
export function getDeviceManager() {
    if (sharedDeviceManager === null) {
        sharedDeviceManager = new DeviceManager();
    }
    return sharedDeviceManager;
}
export function getLocalDevice(cancellable) {
    return getMatchingDevice(device => device.type === DeviceType.Local, {}, cancellable);
}
export function getRemoteDevice(cancellable) {
    return getMatchingDevice(device => device.type === DeviceType.Remote, {}, cancellable);
}
export function getUsbDevice(options, cancellable) {
    return getMatchingDevice(device => device.type === DeviceType.Usb, options, cancellable);
}
export function getDevice(id, options, cancellable) {
    return getMatchingDevice(device => device.id === id, options, cancellable);
}
async function getMatchingDevice(predicate, options = {}, cancellable = null) {
    const device = await findMatchingDevice(predicate, cancellable);
    if (device !== null) {
        return device;
    }
    const { timeout = 0 } = options;
    if (timeout === 0) {
        throw new Error("Device not found");
    }
    const getDeviceEventually = new Promise((resolve, reject) => {
        const deviceManager = getDeviceManager();
        deviceManager.added.connect(onDeviceAdded);
        const timer = (timeout !== null) ? setTimeout(onTimeout, timeout) : null;
        if (cancellable !== null) {
            cancellable.cancelled.connect(onCancel);
            if (cancellable.isCancelled) {
                onCancel();
                return;
            }
        }
        findMatchingDevice(predicate, cancellable)
            .then(device => {
            if (device !== null) {
                onSuccess(device);
            }
        })
            .catch(onError);
        function onDeviceAdded(device) {
            if (predicate(device)) {
                onSuccess(device);
            }
        }
        function onSuccess(device) {
            stopMonitoring();
            resolve(device);
        }
        function onError(error) {
            stopMonitoring();
            reject(error);
        }
        function onTimeout() {
            onError(new Error("Timed out while waiting for device to appear"));
        }
        function onCancel() {
            onError(new Error("Operation was cancelled"));
        }
        function stopMonitoring() {
            cancellable?.cancelled.disconnect(onCancel);
            if (timer !== null) {
                clearTimeout(timer);
            }
            deviceManager.added.disconnect(onDeviceAdded);
        }
    });
    return await getDeviceEventually;
}
async function findMatchingDevice(predicate, cancellable) {
    const deviceManager = getDeviceManager();
    const devices = await deviceManager.enumerateDevices(cancellable);
    return devices.find(predicate) ?? null;
}
