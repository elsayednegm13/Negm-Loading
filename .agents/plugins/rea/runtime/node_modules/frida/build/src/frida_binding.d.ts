export interface FridaBinding {
    commitConstructors(): void;
    DeviceManager: typeof DeviceManager;
    Device: typeof Device;
    _Device: typeof _Device;
    RemoteDeviceOptions: RemoteDeviceOptions;
    BareboneDeviceOptions: BareboneDeviceOptions;
    BareboneConfig: typeof BareboneConfig;
    BareboneConnectionConfig: typeof BareboneConnectionConfig;
    BareboneAllocatorConfig: typeof BareboneAllocatorConfig;
    BareboneInvalidAllocatorConfig: typeof BareboneInvalidAllocatorConfig;
    BarebonePhysicalAllocatorConfig: typeof BarebonePhysicalAllocatorConfig;
    BareboneTargetFunctionsAllocatorConfig: typeof BareboneTargetFunctionsAllocatorConfig;
    BareboneCallArgument: typeof BareboneCallArgument;
    BareboneAgentConfig: typeof BareboneAgentConfig;
    BareboneInvalidAgentConfig: typeof BareboneInvalidAgentConfig;
    BareboneInjectedAgentConfig: typeof BareboneInjectedAgentConfig;
    BareboneResidentAgentConfig: typeof BareboneResidentAgentConfig;
    BareboneTransportConfig: typeof BareboneTransportConfig;
    BareboneInjectingTransportConfig: typeof BareboneInjectingTransportConfig;
    BareboneResidentTransportConfig: typeof BareboneResidentTransportConfig;
    BareboneHostlinkTransportConfig: typeof BareboneHostlinkTransportConfig;
    BareboneHostlinkFabric: typeof BareboneHostlinkFabric;
    BareboneHostlinkEcamFabric: typeof BareboneHostlinkEcamFabric;
    BareboneHostlinkPortsFabric: typeof BareboneHostlinkPortsFabric;
    BareboneHostlinkMmioFabric: typeof BareboneHostlinkMmioFabric;
    BareboneVsockTransportConfig: typeof BareboneVsockTransportConfig;
    BareboneSerialTransportConfig: typeof BareboneSerialTransportConfig;
    BareboneVsockPipeTransportConfig: typeof BareboneVsockPipeTransportConfig;
    BareboneGoldfishPipeTransportConfig: typeof BareboneGoldfishPipeTransportConfig;
    BareboneDeviceTransportConfig: typeof BareboneDeviceTransportConfig;
    BareboneSocketTransportConfig: typeof BareboneSocketTransportConfig;
    BareboneImageConfig: typeof BareboneImageConfig;
    BareboneInvalidImageConfig: typeof BareboneInvalidImageConfig;
    BareboneXnuKernelcacheConfig: typeof BareboneXnuKernelcacheConfig;
    BareboneLinuxKernelConfig: typeof BareboneLinuxKernelConfig;
    BareboneMemoryAddress: typeof BareboneMemoryAddress;
    BareboneInvalidMemoryAddress: typeof BareboneInvalidMemoryAddress;
    BareboneNonNullMemoryAddress: typeof BareboneNonNullMemoryAddress;
    Application: typeof Application;
    Process: typeof Process;
    ProcessMatchOptions: ProcessMatchOptions;
    RawSpawnOptions: RawSpawnOptions;
    Spawn: typeof Spawn;
    Child: typeof Child;
    Crash: typeof Crash;
    Bus: typeof Bus;
    _Bus: typeof _Bus;
    Service: typeof Service;
    Session: typeof Session;
    Script: typeof Script;
    _Script: typeof _Script;
    PortalMembership: typeof PortalMembership;
    LinuxKernelSymbols: typeof LinuxKernelSymbols;
    LinuxKernelImage: typeof LinuxKernelImage;
    LinuxSystemMap: typeof LinuxSystemMap;
    XnuKernelcache: typeof XnuKernelcache;
    PackageManager: typeof PackageManager;
    Package: typeof Package;
    PackageSearchOptions: PackageSearchOptions;
    PackageSearchResult: typeof PackageSearchResult;
    PackageInstallOptions: PackageInstallOptions;
    PackageInstallResult: typeof PackageInstallResult;
    ControlService: typeof ControlService;
    ControlServiceOptions: ControlServiceOptions;
    PortalService: typeof PortalService;
    _PortalService: typeof _PortalService;
    FileMonitor: typeof FileMonitor;
    Compiler: typeof Compiler;
    LanguageServer: typeof LanguageServer;
    PatternCompiler: typeof PatternCompiler;
    PatternCompileOptions: PatternCompileOptions;
    PatternModule: typeof PatternModule;
    PatternDecodeOptions: PatternDecodeOptions;
    PatternInput: typeof PatternInput;
    PatternType: typeof PatternType;
    PatternField: typeof PatternField;
    PatternTypeRef: typeof PatternTypeRef;
    PatternEnumValue: typeof PatternEnumValue;
    PatternBit: typeof PatternBit;
    PatternDiagnostic: typeof PatternDiagnostic;
    PatternValue: typeof PatternValue;
    PatternVisualizer: typeof PatternVisualizer;
    PatternVisualizerArgument: typeof PatternVisualizerArgument;
    CompilerOptions: CompilerOptions;
    BuildOptions: BuildOptions;
    WatchOptions: WatchOptions;
    LibraryOptions: LibraryOptions;
    StaticAuthenticationService: typeof StaticAuthenticationService;
    FrontmostQueryOptions: FrontmostQueryOptions;
    ApplicationQueryOptions: ApplicationQueryOptions;
    ProcessQueryOptions: ProcessQueryOptions;
    SpawnGatingOptions: SpawnGatingOptions;
    SessionOptions: SessionOptions;
    ScriptOptions: ScriptOptions;
    SnapshotOptions: SnapshotOptions;
    PortalOptions: PortalOptions;
    PeerOptions: PeerOptions;
    Relay: typeof Relay;
    _Relay: typeof _Relay;
    EndpointParameters: typeof EndpointParameters;
    _EndpointParameters: typeof _EndpointParameters;
    WebRequest: typeof WebRequest;
    WebResponse: typeof WebResponse;
    AbstractAuthenticationService: typeof AbstractAuthenticationService;
    AbstractWebRequestHandler: typeof AbstractWebRequestHandler;
    BaseObject: typeof BaseObject;
    Cancellable: typeof Cancellable;
    _Cancellable: typeof _Cancellable;
    IOStream: typeof IOStream;
    InputStream: typeof InputStream;
    OutputStream: typeof OutputStream;
    InetSocketAddress: typeof InetSocketAddress;
    InetAddress: typeof InetAddress;
    UnixSocketAddress: typeof UnixSocketAddress;
    BaseSocketAddress: typeof BaseSocketAddress;
    SocketAddressEnumerator: typeof SocketAddressEnumerator;
    Runtime: typeof Runtime;
    DeviceType: typeof DeviceType;
    BareboneKernelKind: typeof BareboneKernelKind;
    BareboneStubFlavor: typeof BareboneStubFlavor;
    BareboneCallArgumentRole: typeof BareboneCallArgumentRole;
    PackageInstallPhase: typeof PackageInstallPhase;
    PackageRole: typeof PackageRole;
    PatternTypeKind: typeof PatternTypeKind;
    PatternTypeRefKind: typeof PatternTypeRefKind;
    PatternByteOrder: typeof PatternByteOrder;
    PatternBitKind: typeof PatternBitKind;
    PatternVisualizerPresentation: typeof PatternVisualizerPresentation;
    PatternVisualizerArgumentKind: typeof PatternVisualizerArgumentKind;
    OutputFormat: typeof OutputFormat;
    BundleFormat: typeof BundleFormat;
    TypeCheckMode: typeof TypeCheckMode;
    SourceMaps: typeof SourceMaps;
    JsCompression: typeof JsCompression;
    JsPlatform: typeof JsPlatform;
    GadgetBreakpointAction: typeof GadgetBreakpointAction;
    Realm: typeof Realm;
    Exceptor: typeof Exceptor;
    SpawnGatingDisabledReason: typeof SpawnGatingDisabledReason;
    SessionDetachReason: typeof SessionDetachReason;
    Scope: typeof Scope;
    SpawnGatingScope: typeof SpawnGatingScope;
    Stdio: typeof Stdio;
    ChildOrigin: typeof ChildOrigin;
    SnapshotTransport: typeof SnapshotTransport;
    ScriptRuntime: typeof ScriptRuntime;
    RelayKind: typeof RelayKind;
    XnuMachTrap: typeof XnuMachTrap;
    XnuBsdSyscall: typeof XnuBsdSyscall;
    WaitKind: typeof WaitKind;
    FileMonitorEvent: typeof FileMonitorEvent;
    SocketFamily: typeof SocketFamily;
    UnixSocketAddressType: typeof UnixSocketAddressType;
    MessageType: typeof MessageType;
    LogLevel: typeof LogLevel;
}

export class DeviceManager extends BaseObject {
    constructor();
    static withNonlocalBackendsOnly(): DeviceManager;
    static withSocketBackendOnly(): DeviceManager;
    close(cancellable?: Cancellable | null): Promise<void>;
    getDeviceById(id: string, timeout: number, cancellable?: Cancellable | null): Promise<Device>;
    getDeviceByType(type: DeviceType, timeout: number, cancellable?: Cancellable | null): Promise<Device>;
    findDeviceById(id: string, timeout: number, cancellable?: Cancellable | null): Promise<Device | null>;
    findDeviceByType(type: DeviceType, timeout: number, cancellable?: Cancellable | null): Promise<Device | null>;
    enumerateDevices(cancellable?: Cancellable | null): Promise<Device[]>;
    addRemoteDevice(address: string, options?: RemoteDeviceOptions, cancellable?: Cancellable | null): Promise<Device>;
    removeRemoteDevice(address: string, cancellable?: Cancellable | null): Promise<void>;
    addBareboneDevice(config: BareboneConfig, options?: BareboneDeviceOptions, cancellable?: Cancellable | null): Promise<Device>;
    removeBareboneDevice(device: Device, cancellable?: Cancellable | null): Promise<void>;
    readonly added: Signal<DeviceAddedHandler>;
    readonly removed: Signal<DeviceRemovedHandler>;
    readonly changed: Signal<DeviceChangedHandler>;
}

export type DeviceAddedHandler = (device: Device) => void;
export type DeviceRemovedHandler = (device: Device) => void;
export type DeviceChangedHandler = () => void;

export class Device extends _Device {
    getProcess(name: string, options?: ProcessMatchOptions, cancellable?: Cancellable | null): Promise<Process>;
    querySystemParameters(cancellable?: Cancellable | null): Promise<SystemParameters>;
    spawn(programOrArgv: string | string[], opts?: SpawnOptions, cancellable?: Cancellable | null): Promise<ProcessID>;
    input(target: TargetProcess, data: Buffer, cancellable?: Cancellable | null): Promise<void>;
    resume(target: TargetProcess, cancellable?: Cancellable | null): Promise<void>;
    kill(target: TargetProcess, cancellable?: Cancellable | null): Promise<void>;
    attach(target: TargetProcess, options?: SessionOptions, cancellable?: Cancellable | null): Promise<Session>;
    injectLibraryFile(target: TargetProcess, path: string, entrypoint: string, data: string, cancellable?: Cancellable | null): Promise<InjecteeID>;
    injectLibraryBlob(target: TargetProcess, blob: Buffer, entrypoint: string, data: string, cancellable?: Cancellable | null): Promise<InjecteeID>;
    openChannel(address: string, cancellable?: Cancellable | null): Promise<import("stream").Duplex>;
    readonly output: Signal<OutputHandler>;
    readonly uninjected: Signal<UninjectedHandler>;
}

export type OutputHandler = (pid: ProcessID, fd: FileDescriptor, data: Buffer) => void;
export type UninjectedHandler = (id: InjecteeID) => void;

export class _Device extends BaseObject {
    isLost(): boolean;
    overrideOption(name: string, val: any): void;
    protected _querySystemParameters(cancellable?: Cancellable | null): Promise<VariantDict>;
    getFrontmostApplication(options?: FrontmostQueryOptions, cancellable?: Cancellable | null): Promise<Application | null>;
    enumerateApplications(options?: ApplicationQueryOptions, cancellable?: Cancellable | null): Promise<Application[]>;
    getProcessByPid(pid: number, options?: ProcessMatchOptions, cancellable?: Cancellable | null): Promise<Process>;
    getProcessByName(name: string, options?: ProcessMatchOptions, cancellable?: Cancellable | null): Promise<Process>;
    findProcessByPid(pid: number, options?: ProcessMatchOptions, cancellable?: Cancellable | null): Promise<Process | null>;
    findProcessByName(name: string, options?: ProcessMatchOptions, cancellable?: Cancellable | null): Promise<Process | null>;
    enumerateProcesses(options?: ProcessQueryOptions, cancellable?: Cancellable | null): Promise<Process[]>;
    enableSpawnGating(options?: SpawnGatingOptions, cancellable?: Cancellable | null): Promise<void>;
    disableSpawnGating(cancellable?: Cancellable | null): Promise<void>;
    enumeratePendingSpawn(cancellable?: Cancellable | null): Promise<Spawn[]>;
    enumeratePendingChildren(cancellable?: Cancellable | null): Promise<Child[]>;
    protected _spawn(program: string, options?: RawSpawnOptions, cancellable?: Cancellable | null): Promise<number>;
    protected _input(pid: number, data: Buffer, cancellable?: Cancellable | null): Promise<void>;
    protected _resume(pid: number, cancellable?: Cancellable | null): Promise<void>;
    protected _kill(pid: number, cancellable?: Cancellable | null): Promise<void>;
    protected _attach(pid: number, options?: SessionOptions, cancellable?: Cancellable | null): Promise<Session>;
    protected _injectLibraryFile(pid: number, path: string, entrypoint: string, data: string, cancellable?: Cancellable | null): Promise<number>;
    protected _injectLibraryBlob(pid: number, blob: Buffer, entrypoint: string, data: string, cancellable?: Cancellable | null): Promise<number>;
    protected _openChannel(address: string, cancellable?: Cancellable | null): Promise<IOStream>;
    openService(address: string, cancellable?: Cancellable | null): Promise<Service>;
    unpair(cancellable?: Cancellable | null): Promise<void>;
    readonly id: string;
    readonly name: string;
    icon: any;
    readonly type: DeviceType;
    readonly bus: Bus;
    readonly spawnGatingDisabled: Signal<SpawnGatingDisabledHandler>;
    readonly spawnAdded: Signal<SpawnAddedHandler>;
    readonly spawnRemoved: Signal<SpawnRemovedHandler>;
    readonly childAdded: Signal<ChildAddedHandler>;
    readonly childRemoved: Signal<ChildRemovedHandler>;
    readonly processCrashed: Signal<ProcessCrashedHandler>;
    protected readonly _output: Signal<_OutputHandler>;
    protected readonly _uninjected: Signal<_UninjectedHandler>;
    readonly connecting: Signal<ConnectingHandler>;
    readonly connected: Signal<ConnectedHandler>;
    readonly lost: Signal<DeviceLostHandler>;
}

export type SpawnGatingDisabledHandler = (reason: SpawnGatingDisabledReason) => void;
export type SpawnAddedHandler = (spawn: Spawn) => void;
export type SpawnRemovedHandler = (spawn: Spawn) => void;
export type ChildAddedHandler = (child: Child) => void;
export type ChildRemovedHandler = (child: Child) => void;
export type ProcessCrashedHandler = (crash: Crash) => void;
export type _OutputHandler = (pid: number, fd: number, data: Buffer) => void;
export type _UninjectedHandler = (id: number) => void;
export type ConnectingHandler = (status: string, progress: number) => void;
export type ConnectedHandler = () => void;
export type DeviceLostHandler = () => void;

export interface RemoteDeviceOptions {
    certificate?: string;
    origin?: string;
    token?: string;
    keepaliveInterval?: number;
}

export interface BareboneDeviceOptions {
    id?: string;
    name?: string;
    icon?: any;
}

export class BareboneConfig extends BaseObject {
    constructor(settings?: { connection?: BareboneConnectionConfig; allocator?: BareboneAllocatorConfig; agent?: BareboneAgentConfig; image?: BareboneImageConfig; kernel?: BareboneKernelKind; });
    check(): void;
    connection: BareboneConnectionConfig;
    allocator: BareboneAllocatorConfig;
    agent: BareboneAgentConfig;
    image: BareboneImageConfig;
    kernel: BareboneKernelKind;
}

export class BareboneConnectionConfig extends BaseObject {
    constructor(settings?: { host?: string; port?: number; pid?: number; flavor?: BareboneStubFlavor; });
    check(): void;
    host: string;
    port: number;
    pid: number;
    flavor: BareboneStubFlavor;
}

export class BareboneAllocatorConfig extends BaseObject {
    check(): void;
}

export class BareboneInvalidAllocatorConfig extends BareboneAllocatorConfig {
    constructor();
}

export class BarebonePhysicalAllocatorConfig extends BareboneAllocatorConfig {
    constructor(settings?: { physicalBase?: BareboneMemoryAddress; });
    physicalBase: BareboneMemoryAddress;
}

export class BareboneTargetFunctionsAllocatorConfig extends BareboneAllocatorConfig {
    constructor(settings?: { allocArguments?: BareboneCallArgument[]; freeArguments?: BareboneCallArgument[]; allocFunction?: BareboneMemoryAddress; freeFunction?: BareboneMemoryAddress; allocFlags?: bigint; });
    clearAllocArguments(): void;
    addAllocArgument(argument: BareboneCallArgument): void;
    clearFreeArguments(): void;
    addFreeArgument(argument: BareboneCallArgument): void;
    allocFunction: BareboneMemoryAddress;
    freeFunction: BareboneMemoryAddress;
    allocFlags: bigint;
}

export class BareboneCallArgument extends BaseObject {
    constructor(role: BareboneCallArgumentRole, value: bigint);
    role: BareboneCallArgumentRole;
    value: bigint;
}

export class BareboneAgentConfig extends BaseObject {
    check(): void;
}

export class BareboneInvalidAgentConfig extends BareboneAgentConfig {
    constructor();
}

export class BareboneInjectedAgentConfig extends BareboneAgentConfig {
    constructor();
    static fromBytes(image: Buffer, transport: BareboneInjectingTransportConfig): BareboneInjectedAgentConfig;
    static fromFile(path: string, transport: BareboneInjectingTransportConfig): BareboneInjectedAgentConfig;
    image: Buffer;
    transport: BareboneInjectingTransportConfig;
}

export class BareboneResidentAgentConfig extends BareboneAgentConfig {
    constructor(transport: BareboneResidentTransportConfig);
    transport: BareboneResidentTransportConfig;
}

export class BareboneTransportConfig extends BaseObject {
    check(): void;
}

export class BareboneInjectingTransportConfig extends BareboneTransportConfig {
}

export class BareboneResidentTransportConfig extends BareboneTransportConfig {
}

export class BareboneHostlinkTransportConfig extends BareboneInjectingTransportConfig {
    constructor(settings?: { qmp?: string; bus?: string; fabric?: BareboneHostlinkFabric; });
    qmp: string;
    bus: string;
    fabric: BareboneHostlinkFabric;
}

export class BareboneHostlinkFabric extends BaseObject {
}

export class BareboneHostlinkEcamFabric extends BareboneHostlinkFabric {
    constructor(ecam: bigint);
    ecam: bigint;
}

export class BareboneHostlinkPortsFabric extends BareboneHostlinkFabric {
    constructor();
}

export class BareboneHostlinkMmioFabric extends BareboneHostlinkFabric {
    constructor();
}

export class BareboneVsockTransportConfig extends BareboneInjectingTransportConfig {
    constructor(settings?: { socketPath?: string; port?: number; });
    socketPath: string;
    port: number;
}

export class BareboneSerialTransportConfig extends BareboneInjectingTransportConfig {
    constructor(settings?: { path?: string; });
    path: string;
}

export class BareboneVsockPipeTransportConfig extends BareboneInjectingTransportConfig {
    constructor(settings?: { socketPath?: string; });
    socketPath: string;
}

export class BareboneGoldfishPipeTransportConfig extends BareboneInjectingTransportConfig {
    constructor(settings?: { socketPath?: string; });
    socketPath: string;
}

export class BareboneDeviceTransportConfig extends BareboneResidentTransportConfig {
    constructor(settings?: { path?: string; });
    path: string;
}

export class BareboneSocketTransportConfig extends BareboneResidentTransportConfig {
    constructor(settings?: { path?: string; });
    path: string;
}

export class BareboneImageConfig extends BaseObject {
    clearSymbols(): void;
    addSymbol(name: string, address: bigint): void;
    check(): void;
    base: BareboneMemoryAddress;
}

export class BareboneInvalidImageConfig extends BareboneImageConfig {
}

export class BareboneXnuKernelcacheConfig extends BareboneImageConfig {
    constructor(settings?: { kernelcache?: XnuKernelcache; symbols?: { [name: string]: bigint }; base?: BareboneMemoryAddress; });
    kernelcache: XnuKernelcache;
}

export class BareboneLinuxKernelConfig extends BareboneImageConfig {
    constructor(settings?: { kernel?: LinuxKernelSymbols; symbols?: { [name: string]: bigint }; base?: BareboneMemoryAddress; });
    kernel: LinuxKernelSymbols;
}

export class BareboneMemoryAddress extends BaseObject {
    check(): void;
    label: string;
    address: bigint;
}

export class BareboneInvalidMemoryAddress extends BareboneMemoryAddress {
    constructor(label: string);
}

export class BareboneNonNullMemoryAddress extends BareboneMemoryAddress {
    constructor(label: string, address: bigint);
}

export class Application extends BaseObject {
    identifier: string;
    name: string;
    pid: number;
    parameters: VariantDict;
}

export class Process extends BaseObject {
    pid: number;
    name: string;
    parameters: VariantDict;
}

export interface ProcessMatchOptions {
    timeout?: number;
    scope?: Scope;
}

export interface RawSpawnOptions {
    argv?: string[];
    envp?: string[];
    env?: string[];
    cwd?: string;
    stdio?: Stdio;
    aux?: VariantDict;
}

export class Spawn extends BaseObject {
    pid: number;
    identifier: string;
}

export class Child extends BaseObject {
    pid: number;
    parentPid: number;
    origin: ChildOrigin;
    identifier: string;
    path: string;
    argv: string[];
    envp: string[];
}

export class Crash extends BaseObject {
    pid: number;
    processName: string;
    summary: string;
    report: string;
    parameters: VariantDict;
}

export class Bus extends _Bus {
    post(message: any, data?: Buffer | null): void;
    readonly message: Signal<BusMessageHandler>;
}

export type BusMessageHandler = (message: any, data: Buffer | null) => void;

export class _Bus extends BaseObject {
    isDetached(): boolean;
    attach(cancellable?: Cancellable | null): Promise<void>;
    protected _post(json: string, data?: Buffer | null): void;
    readonly detached: Signal<BusDetachedHandler>;
    protected readonly _message: Signal<_BusMessageHandler>;
}

export type BusDetachedHandler = () => void;
export type _BusMessageHandler = (json: string, data: Buffer | null) => void;

export class Service extends BaseObject {
    isClosed(): boolean;
    activate(cancellable?: Cancellable | null): Promise<void>;
    cancel(cancellable?: Cancellable | null): Promise<void>;
    request(parameters: any, cancellable?: Cancellable | null): Promise<any>;
    readonly close: Signal<ServiceCloseHandler>;
    readonly message: Signal<ServiceMessageHandler>;
}

export type ServiceCloseHandler = () => void;
export type ServiceMessageHandler = (message: any) => void;

export class Session extends BaseObject {
    isDetached(): boolean;
    detach(cancellable?: Cancellable | null): Promise<void>;
    resume(cancellable?: Cancellable | null): Promise<void>;
    enableChildGating(cancellable?: Cancellable | null): Promise<void>;
    disableChildGating(cancellable?: Cancellable | null): Promise<void>;
    createScript(source: string, options?: ScriptOptions, cancellable?: Cancellable | null): Promise<Script>;
    createScriptFromBytes(bytes: Buffer, options?: ScriptOptions, cancellable?: Cancellable | null): Promise<Script>;
    compileScript(source: string, options?: ScriptOptions, cancellable?: Cancellable | null): Promise<Buffer>;
    snapshotScript(embedScript: string, options?: SnapshotOptions, cancellable?: Cancellable | null): Promise<Buffer>;
    setupPeerConnection(options?: PeerOptions, cancellable?: Cancellable | null): Promise<void>;
    joinPortal(address: string, options?: PortalOptions, cancellable?: Cancellable | null): Promise<PortalMembership>;
    pid: number;
    persistTimeout: number;
    readonly detached: Signal<SessionDetachedHandler>;
}

export type SessionDetachedHandler = (reason: SessionDetachReason, crash: Crash | null) => void;

export class Script extends _Script {
    logHandler: ScriptLogHandler;
    readonly isDestroyed: boolean;
    readonly exports: ScriptExports;
    readonly defaultLogHandler: ScriptLogHandler;
    post(message: any, data?: Buffer | null): void;
    enableDebugger(options?: EnableDebuggerOptions, cancellable?: Cancellable | null): Promise<void>;
    readonly message: Signal<ScriptMessageHandler>;
}

export type ScriptMessageHandler = (message: Message, data: Buffer | null) => void;

export class _Script extends BaseObject {
    protected _isDestroyed(): boolean;
    load(cancellable?: Cancellable | null): Promise<void>;
    interrupt(cancellable?: Cancellable | null): Promise<void>;
    unload(cancellable?: Cancellable | null): Promise<void>;
    terminate(cancellable?: Cancellable | null): Promise<void>;
    eternalize(cancellable?: Cancellable | null): Promise<void>;
    protected _post(json: string, data?: Buffer | null): void;
    protected _enableDebugger(port: number, cancellable?: Cancellable | null): Promise<void>;
    disableDebugger(cancellable?: Cancellable | null): Promise<void>;
    readonly destroyed: Signal<ScriptDestroyedHandler>;
    protected readonly _message: Signal<_ScriptMessageHandler>;
}

export type ScriptDestroyedHandler = () => void;
export type _ScriptMessageHandler = (json: string, data: Buffer | null) => void;

export class PortalMembership extends BaseObject {
    terminate(cancellable?: Cancellable | null): Promise<void>;
}

export class LinuxKernelSymbols extends BaseObject {
    hasSymbol(name: string): boolean;
    tryFindSymbol(name: string): bigint | null;
}

export class LinuxKernelImage extends LinuxKernelSymbols {
    constructor(blob: Buffer);
    static open(path: string): LinuxKernelImage;
}

export class LinuxSystemMap extends LinuxKernelSymbols {
    constructor(blob: Buffer);
    static open(path: string): LinuxSystemMap;
}

export class XnuKernelcache extends BaseObject {
    constructor(blob: Buffer);
    static open(path: string): XnuKernelcache;
}

export class PackageManager extends BaseObject {
    constructor(settings?: { registry?: string; });
    search(query: string, options?: PackageSearchOptions, cancellable?: Cancellable | null): Promise<PackageSearchResult>;
    install(options?: PackageInstallOptions, cancellable?: Cancellable | null): Promise<PackageInstallResult>;
    registry: string;
    readonly installProgress: Signal<PackageManagerInstallProgressHandler>;
}

export type PackageManagerInstallProgressHandler = (phase: PackageInstallPhase, fraction: number, details: string | null) => void;

export class Package extends BaseObject {
    name: string;
    version: string;
    description: string;
    url: string;
}

export interface PackageSearchOptions {
    offset?: number;
    limit?: number;
}

export class PackageSearchResult extends BaseObject {
    packages: Package[];
    total: number;
}

export interface PackageInstallOptions {
    specs?: string[];
    omits?: PackageRole[];
    projectRoot?: string;
    role?: PackageRole;
}

export class PackageInstallResult extends BaseObject {
    packages: Package[];
}

export class ControlService extends BaseObject {
    constructor(endpointParams: EndpointParameters, options?: ControlServiceOptions);
    start(cancellable?: Cancellable | null): Promise<void>;
    stop(cancellable?: Cancellable | null): Promise<void>;
}

export interface ControlServiceOptions {
    enablePreload?: boolean;
    reportCrashes?: boolean;
}

export class PortalService extends _PortalService {
    constructor(options?: PortalServiceOptions);
    post(connectionId: PortalConnectionId, message: any, data?: Buffer | null): void;
    narrowcast(tag: string, message: any, data?: Buffer | null): void;
    broadcast(message: any, data?: Buffer | null): void;
    readonly nodeConnected: Signal<PortalNodeConnectedHandler>;
    readonly nodeJoined: Signal<PortalNodeJoinedHandler>;
    readonly nodeLeft: Signal<PortalNodeLeftHandler>;
    readonly nodeDisconnected: Signal<PortalNodeDisconnectedHandler>;
    readonly controllerConnected: Signal<PortalControllerConnectedHandler>;
    readonly controllerDisconnected: Signal<PortalControllerDisconnectedHandler>;
    readonly authenticated: Signal<PortalAuthenticatedHandler>;
    readonly subscribe: Signal<PortalSubscribeHandler>;
    readonly message: Signal<PortalMessageHandler>;
}

export type PortalNodeConnectedHandler = (connectionId: PortalConnectionId, remoteAddress: SocketAddress) => void;
export type PortalNodeJoinedHandler = (connectionId: PortalConnectionId, application: Application) => void;
export type PortalNodeLeftHandler = (connectionId: PortalConnectionId, application: Application) => void;
export type PortalNodeDisconnectedHandler = (connectionId: PortalConnectionId, remoteAddress: SocketAddress) => void;
export type PortalControllerConnectedHandler = (connectionId: PortalConnectionId, remoteAddress: SocketAddress) => void;
export type PortalControllerDisconnectedHandler = (connectionId: PortalConnectionId, remoteAddress: SocketAddress) => void;
export type PortalAuthenticatedHandler = (connectionId: PortalConnectionId, sessionInfo: AuthenticatedSessionInfo) => void;
export type PortalSubscribeHandler = (connectionId: PortalConnectionId) => void;
export type PortalMessageHandler = (connectionId: PortalConnectionId, message: any, data: Buffer | null) => void;

export class _PortalService extends BaseObject {
    constructor(clusterParams: EndpointParameters, controlParams?: EndpointParameters | null);
    addClusterEndpoint(endpointParams: EndpointParameters): void;
    addControlEndpoint(endpointParams: EndpointParameters): void;
    start(cancellable?: Cancellable | null): Promise<void>;
    stop(cancellable?: Cancellable | null): Promise<void>;
    kick(connectionId: number): void;
    protected _post(connectionId: number, json: string, data?: Buffer | null): void;
    protected _narrowcast(tag: string, json: string, data?: Buffer | null): void;
    protected _broadcast(json: string, data?: Buffer | null): void;
    enumerateTags(connectionId: number): string[] | null;
    tag(connectionId: number, tag: string): void;
    untag(connectionId: number, tag: string): void;
    readonly device: Device;
    clusterParams: EndpointParameters;
    controlParams: EndpointParameters;
    protected readonly _nodeConnected: Signal<_PortalNodeConnectedHandler>;
    protected readonly _nodeJoined: Signal<_PortalNodeJoinedHandler>;
    protected readonly _nodeLeft: Signal<_PortalNodeLeftHandler>;
    protected readonly _nodeDisconnected: Signal<_PortalNodeDisconnectedHandler>;
    protected readonly _controllerConnected: Signal<_PortalControllerConnectedHandler>;
    protected readonly _controllerDisconnected: Signal<_PortalControllerDisconnectedHandler>;
    protected readonly _authenticated: Signal<_PortalAuthenticatedHandler>;
    protected readonly _subscribe: Signal<_PortalSubscribeHandler>;
    protected readonly _message: Signal<_PortalMessageHandler>;
}

export type _PortalNodeConnectedHandler = (connectionId: number, remoteAddress: BaseSocketAddress) => void;
export type _PortalNodeJoinedHandler = (connectionId: number, application: Application) => void;
export type _PortalNodeLeftHandler = (connectionId: number, application: Application) => void;
export type _PortalNodeDisconnectedHandler = (connectionId: number, remoteAddress: BaseSocketAddress) => void;
export type _PortalControllerConnectedHandler = (connectionId: number, remoteAddress: BaseSocketAddress) => void;
export type _PortalControllerDisconnectedHandler = (connectionId: number, remoteAddress: BaseSocketAddress) => void;
export type _PortalAuthenticatedHandler = (connectionId: number, sessionInfo: string) => void;
export type _PortalSubscribeHandler = (connectionId: number) => void;
export type _PortalMessageHandler = (connectionId: number, json: string, data: Buffer | null) => void;

export class FileMonitor extends BaseObject {
    constructor(path: string);
    enable(cancellable?: Cancellable | null): Promise<void>;
    disable(cancellable?: Cancellable | null): Promise<void>;
    path: string;
    readonly change: Signal<FileMonitorChangeHandler>;
}

export type FileMonitorChangeHandler = (filePath: string, otherFilePath: string | null, event: FileMonitorEvent) => void;

export class Compiler extends BaseObject {
    constructor(manager?: DeviceManager | null);
    build(entrypoint: string, options?: BuildOptions, cancellable?: Cancellable | null): Promise<string>;
    watch(entrypoint: string, options?: WatchOptions, cancellable?: Cancellable | null): Promise<void>;
    buildLibrary(entrypoint: string, outputDir: string, options?: LibraryOptions, cancellable?: Cancellable | null): Promise<void>;
    watchLibrary(entrypoint: string, outputDir: string, options?: LibraryOptions, cancellable?: Cancellable | null): Promise<void>;
    readonly starting: Signal<CompilerStartingHandler>;
    readonly finished: Signal<CompilerFinishedHandler>;
    readonly output: Signal<CompilerOutputHandler>;
    readonly diagnostics: Signal<CompilerDiagnosticsHandler>;
}

export type CompilerStartingHandler = () => void;
export type CompilerFinishedHandler = () => void;
export type CompilerOutputHandler = (bundle: string) => void;
export type CompilerDiagnosticsHandler = (diagnostics: any) => void;

export class LanguageServer extends BaseObject {
    constructor(projectRoot: string);
    start(cancellable?: Cancellable | null): Promise<void>;
    stop(): void;
    post(json: string): void;
    projectRoot: string;
    readonly message: Signal<LanguageServerMessageHandler>;
}

export type LanguageServerMessageHandler = (json: string) => void;

export class PatternCompiler extends BaseObject {
    constructor();
    compile(entrypoint: string, options?: PatternCompileOptions, cancellable?: Cancellable | null): Promise<PatternModule>;
}

export interface PatternCompileOptions {
    projectRoot?: string;
    platform?: string;
    arch?: string;
    defines?: VariantDict;
}

export class PatternModule extends BaseObject {
    lookup(name: string): PatternType | null;
    decode(typeName: string, data: Buffer, address: bigint, options?: PatternDecodeOptions, cancellable?: Cancellable | null): Promise<PatternValue>;
    callFunction(typeName: string, data: Buffer, address: bigint, pattern: number, function_: string, options?: PatternDecodeOptions, cancellable?: Cancellable | null): Promise<string>;
    types: PatternType[];
    rootType: string;
    inputs: PatternInput[];
    diagnostics: PatternDiagnostic[];
}

export interface PatternDecodeOptions {
    inputs?: VariantDict;
}

export class PatternInput extends BaseObject {
    name: string;
    typeRef: PatternTypeRef;
}

export class PatternType extends BaseObject {
    kind: PatternTypeKind;
    name: string;
    doc: string;
    file: string;
    line: number;
    character: number;
    size: bigint;
    align: number;
    fields: PatternField[];
    underlying: PatternTypeRef;
    values: PatternEnumValue[];
    bits: PatternBit[];
    target: PatternTypeRef;
}

export class PatternField extends BaseObject {
    name: string;
    doc: string;
    hidden: boolean;
    conditional: boolean;
    noUniqueAddress: boolean;
    typeRef: PatternTypeRef;
    offset: bigint;
    size: bigint;
}

export class PatternTypeRef extends BaseObject {
    kind: PatternTypeRefKind;
    display: string;
    name: string;
    order: PatternByteOrder;
    target: PatternTypeRef;
    width: PatternTypeRef;
    element: PatternTypeRef;
    length: bigint;
    nullTerminated: boolean;
    size: bigint;
}

export class PatternEnumValue extends BaseObject {
    name: string;
    doc: string;
    value: bigint;
    last: bigint;
}

export class PatternBit extends BaseObject {
    name: string;
    doc: string;
    kind: PatternBitKind;
    offset: number;
    bits: number;
    enumName: string;
}

export class PatternDiagnostic extends BaseObject {
    file: string;
    line: number;
    character: number;
    message: string;
}

export class PatternValue extends BaseObject {
    toVariant(): any;
    id: number;
    name: string;
    typeName: string;
    address: bigint;
    offset: bigint;
    size: bigint;
    value: any;
    label: string;
    displayName: string;
    formatted: string;
    comment: string;
    color: string;
    hidden: boolean;
    inlined: boolean;
    sealed: boolean;
    bitOffset: number;
    bits: number;
    count: bigint;
    fields: PatternValue[];
    elements: PatternValue[];
    truncated: boolean;
    section: bigint;
    visualizer: PatternVisualizer;
}

export class PatternVisualizer extends BaseObject {
    toVariant(): any;
    name: string;
    presentation: PatternVisualizerPresentation;
    arguments: PatternVisualizerArgument[];
}

export class PatternVisualizerArgument extends BaseObject {
    toVariant(): any;
    kind: PatternVisualizerArgumentKind;
    value: any;
    pattern: number;
    address: bigint;
    size: bigint;
    data: Buffer;
}

export interface CompilerOptions {
    externals?: string[];
    projectRoot?: string;
    outputFormat?: OutputFormat;
    bundleFormat?: BundleFormat;
    typeCheck?: TypeCheckMode;
    sourceMaps?: SourceMaps;
    compression?: JsCompression;
    platform?: JsPlatform;
}

export interface BuildOptions {
}

export interface WatchOptions {
}

export interface LibraryOptions {
    projectRoot?: string;
    sourceMaps?: SourceMaps;
}

export class StaticAuthenticationService extends BaseObject implements AuthenticationService {
    constructor(token: string);
    tokenHash: string;
    authenticate(token: string, cancellable?: Cancellable | null): Promise<string>;
}

export interface FrontmostQueryOptions {
    scope?: Scope;
}

export interface ApplicationQueryOptions {
    identifiers?: string[];
    scope?: Scope;
}

export interface ProcessQueryOptions {
    pids?: number[];
    scope?: Scope;
}

export interface SpawnGatingOptions {
    scope?: SpawnGatingScope;
}

export interface SessionOptions {
    linkerNotifierOffsets?: number[];
    realm?: Realm;
    persistTimeout?: number;
    emulatedAgentPath?: string;
    exceptor?: Exceptor;
    unwindBroker?: boolean;
    exitMonitor?: boolean;
    threadSuspendMonitor?: boolean;
}

export interface ScriptOptions {
    name?: string;
    snapshot?: Buffer;
    snapshotTransport?: SnapshotTransport;
    runtime?: ScriptRuntime;
}

export interface SnapshotOptions {
    warmupScript?: string;
    runtime?: ScriptRuntime;
}

export interface PortalOptions {
    certificate?: string;
    token?: string;
    acl?: string[];
}

export interface PeerOptions {
    relays?: Relay[];
    stunServer?: string;
}

export class Relay extends _Relay {
    constructor(properties: RelayProperties);
}

export class _Relay extends BaseObject {
    constructor(address: string, username: string, password: string, kind: RelayKind);
    address: string;
    username: string;
    password: string;
    kind: RelayKind;
}

export class EndpointParameters extends _EndpointParameters {
    constructor(params?: EndpointParametersSubset);
}

export class _EndpointParameters extends BaseObject {
    constructor(address: string | null, port: number, certificate?: string | null, origin?: string | null, authService?: AuthenticationService | null, assetRoot?: string | null);
    address: string;
    port: number;
    certificate: string;
    origin: string;
    authService: AuthenticationService;
    assetRoot: string;
    requestHandler: WebRequestHandler;
}

export class WebRequest extends BaseObject {
    method: string;
    path: string;
    queryString: string;
    body: Buffer;
}

export class WebResponse extends BaseObject {
    constructor(status: number, body: Buffer);
    addHeader(name: string, val: string): void;
    status: number;
    body: Buffer;
}

export interface AuthenticationService extends BaseObject {
    authenticate(token: string, cancellable?: Cancellable | null): Promise<string>;
}

export abstract class AbstractAuthenticationService extends BaseObject implements AuthenticationService {
    authenticate(token: string, cancellable: Cancellable | null): Promise<string>;
}

export interface WebRequestHandler extends BaseObject {
    handleRequest(request: WebRequest, cancellable?: Cancellable | null): Promise<WebResponse | null>;
}

export abstract class AbstractWebRequestHandler extends BaseObject implements WebRequestHandler {
    handleRequest(request: WebRequest, cancellable: Cancellable | null): Promise<WebResponse | null>;
}

export class BaseObject {
    notify(propertyName: string): void;
}

export class Cancellable extends _Cancellable {
    readonly isCancelled: boolean;
    static withTimeout(ms: number): Cancellable;
    combine(other: Cancellable): Cancellable;
}

export class _Cancellable extends BaseObject {
    constructor();
    cancel(): void;
    disconnect(handlerId: number): void;
    getFd(): number;
    protected _isCancelled(): boolean;
    popCurrent(): void;
    pushCurrent(): void;
    reset(): void;
    throwIfCancelled(): boolean;
    readonly cancelled: Signal<CancelledHandler>;
}

export type CancelledHandler = () => void;

export class IOStream extends BaseObject {
    close(ioPriority: number, cancellable?: Cancellable | null): Promise<boolean>;
    readonly closed: boolean;
    readonly inputStream: InputStream;
    readonly outputStream: OutputStream;
}

export class InputStream extends BaseObject {
    close(ioPriority: number, cancellable?: Cancellable | null): Promise<boolean>;
    read(count: number, ioPriority: number, cancellable?: Cancellable | null): Promise<Buffer>;
    skip(count: number, ioPriority: number, cancellable?: Cancellable | null): Promise<number>;
}

export class OutputStream extends BaseObject {
    close(ioPriority: number, cancellable?: Cancellable | null): Promise<boolean>;
    flush(ioPriority: number, cancellable?: Cancellable | null): Promise<boolean>;
    write(bytes: Buffer, ioPriority: number, cancellable?: Cancellable | null): Promise<number>;
}

export class InetSocketAddress extends BaseSocketAddress implements SocketConnectable {
    constructor(address: InetAddress, port: number);
    static newFromString(address: string, port: number): InetSocketAddress;
    address: InetAddress;
    flowinfo: number;
    port: number;
    scopeId: number;
    enumerate(): SocketAddressEnumerator;
    proxyEnumerate(): SocketAddressEnumerator;
    toString(): string;
}

export class InetAddress extends BaseObject {
    constructor(family: SocketFamily);
    static newFromString(string: string): InetAddress;
    static newLoopback(family: SocketFamily): InetAddress;
    equal(otherAddress: InetAddress): boolean;
    getNativeSize(): number;
    toString(): string;
    family: SocketFamily;
    readonly isAny: boolean;
    readonly isLinkLocal: boolean;
    readonly isLoopback: boolean;
    readonly isMcGlobal: boolean;
    readonly isMcLinkLocal: boolean;
    readonly isMcNodeLocal: boolean;
    readonly isMcOrgLocal: boolean;
    readonly isMcSiteLocal: boolean;
    readonly isMulticast: boolean;
    readonly isSiteLocal: boolean;
}

export class UnixSocketAddress extends BaseSocketAddress implements SocketConnectable {
    constructor(path: string);
    addressType: UnixSocketAddressType;
    path: Buffer;
    enumerate(): SocketAddressEnumerator;
    proxyEnumerate(): SocketAddressEnumerator;
    toString(): string;
}

export class BaseSocketAddress extends BaseObject implements SocketConnectable {
    getNativeSize(): number;
    readonly family: SocketFamily;
    enumerate(): SocketAddressEnumerator;
    proxyEnumerate(): SocketAddressEnumerator;
    toString(): string;
}

export class SocketAddressEnumerator extends BaseObject {
    next(cancellable?: Cancellable | null): BaseSocketAddress | null;
    nextAsync(cancellable?: Cancellable | null): Promise<BaseSocketAddress | null>;
}

export interface SocketConnectable {
    enumerate(): SocketAddressEnumerator;
    proxyEnumerate(): SocketAddressEnumerator;
    toString(): string;
}

export enum Runtime {
    Glib = "glib",
    Other = "other"
}

export enum DeviceType {
    Local = "local",
    Remote = "remote",
    Usb = "usb"
}

export enum BareboneKernelKind {
    Auto = "auto",
    Bare = "bare",
    Win9x = "win9x",
    Winnt = "winnt",
    Xnu = "xnu",
    Linux = "linux"
}

export enum BareboneStubFlavor {
    GdbRemote = "gdb-remote",
    Vz = "vz",
    Parallels = "parallels",
    AndroidEmulator = "android-emulator",
    Virtualbox = "virtualbox",
    VirtualboxConsole = "virtualbox-console"
}

export enum BareboneCallArgumentRole {
    Size = "size",
    Address = "address",
    Literal = "literal"
}

export enum PackageInstallPhase {
    Initializing = "initializing",
    PreparingDependencies = "preparing-dependencies",
    ResolvingPackage = "resolving-package",
    FetchingResource = "fetching-resource",
    PackageAlreadyInstalled = "package-already-installed",
    DownloadingPackage = "downloading-package",
    PackageInstalled = "package-installed",
    ResolvingAndInstallingAll = "resolving-and-installing-all",
    Complete = "complete"
}

export enum PackageRole {
    Runtime = "runtime",
    Development = "development",
    Optional = "optional",
    Peer = "peer"
}

export enum PatternTypeKind {
    Struct = "struct",
    Union = "union",
    Enum = "enum",
    Bitfield = "bitfield",
    Alias = "alias"
}

export enum PatternTypeRefKind {
    Primitive = "primitive",
    Named = "named",
    Pointer = "pointer",
    Array = "array",
    Padding = "padding"
}

export enum PatternByteOrder {
    Native = "native",
    Little = "little",
    Big = "big"
}

export enum PatternBitKind {
    Unsigned = "unsigned",
    Signed = "signed",
    Bool = "bool",
    Enum = "enum"
}

export enum PatternVisualizerPresentation {
    Detached = "detached",
    Inline = "inline"
}

export enum PatternVisualizerArgumentKind {
    Value = "value",
    Pattern = "pattern"
}

export enum OutputFormat {
    Unescaped = "unescaped",
    HexBytes = "hex-bytes",
    CString = "c-string"
}

export enum BundleFormat {
    Esm = "esm",
    Iife = "iife"
}

export enum TypeCheckMode {
    Full = "full",
    None = "none"
}

export enum SourceMaps {
    Included = "included",
    Omitted = "omitted"
}

export enum JsCompression {
    None = "none",
    Terser = "terser"
}

export enum JsPlatform {
    Gum = "gum",
    Browser = "browser",
    Neutral = "neutral"
}

export enum GadgetBreakpointAction {
    InvokeReturn = "invoke-return",
    Resume = "resume",
    Detach = "detach",
    PagePlan = "page-plan"
}

export enum Realm {
    Native = "native",
    Emulated = "emulated"
}

export enum Exceptor {
    Full = "full",
    HandlerOnly = "handler-only",
    Off = "off"
}

export enum SpawnGatingDisabledReason {
    ApplicationRequested = "application-requested",
    WatchdogTimeout = "watchdog-timeout"
}

export enum SessionDetachReason {
    ApplicationRequested = "application-requested",
    ProcessReplaced = "process-replaced",
    ProcessTerminated = "process-terminated",
    ConnectionTerminated = "connection-terminated",
    DeviceLost = "device-lost"
}

export enum Scope {
    Minimal = "minimal",
    Metadata = "metadata",
    Full = "full"
}

export enum SpawnGatingScope {
    Default = "default",
    Applications = "applications",
    Processes = "processes"
}

export enum Stdio {
    Inherit = "inherit",
    Pipe = "pipe"
}

export enum ChildOrigin {
    Fork = "fork",
    Exec = "exec",
    Spawn = "spawn"
}

export enum SnapshotTransport {
    Inline = "inline",
    SharedMemory = "shared-memory"
}

export enum ScriptRuntime {
    Default = "default",
    QJS = "qjs",
    V8 = "v8"
}

export enum RelayKind {
    TurnUDP = "turn-udp",
    TurnTCP = "turn-tcp",
    TurnTLS = "turn-tls"
}

export enum XnuMachTrap {
    MachVmAllocate = "mach-vm-allocate",
    MachVmPurgableControl = "mach-vm-purgable-control",
    MachVmDeallocate = "mach-vm-deallocate",
    TaskDyldProcessInfoNotifyGet = "task-dyld-process-info-notify-get",
    MachVmProtect = "mach-vm-protect",
    MachVmMap = "mach-vm-map",
    MachPortAllocate = "mach-port-allocate",
    MachPortDeallocate = "mach-port-deallocate",
    MachPortModRefs = "mach-port-mod-refs",
    MachPortMoveMember = "mach-port-move-member",
    MachPortInsertRight = "mach-port-insert-right",
    MachPortInsertMember = "mach-port-insert-member",
    MachPortExtractMember = "mach-port-extract-member",
    MachPortConstruct = "mach-port-construct",
    MachPortDestruct = "mach-port-destruct",
    MachReplyPort = "mach-reply-port",
    ThreadSelf = "thread-self",
    TaskSelf = "task-self",
    HostSelf = "host-self",
    MachMsg = "mach-msg",
    MachMsgOverwrite = "mach-msg-overwrite",
    SemaphoreSignal = "semaphore-signal",
    SemaphoreSignalAll = "semaphore-signal-all",
    SemaphoreSignalThread = "semaphore-signal-thread",
    SemaphoreWait = "semaphore-wait",
    SemaphoreWaitSignal = "semaphore-wait-signal",
    SemaphoreTimedwait = "semaphore-timedwait",
    SemaphoreTimedwaitSignal = "semaphore-timedwait-signal",
    MachPortGetAttributes = "mach-port-get-attributes",
    MachPortGuard = "mach-port-guard",
    MachPortUnguard = "mach-port-unguard",
    MachGenerateActivityId = "mach-generate-activity-id",
    TaskNameForPid = "task-name-for-pid",
    TaskForPid = "task-for-pid",
    PidForTask = "pid-for-task",
    MachMsg2 = "mach-msg2",
    MacxSwapon = "macx-swapon",
    MacxSwapoff = "macx-swapoff",
    ThreadGetSpecialReplyPort = "thread-get-special-reply-port",
    MacxTriggers = "macx-triggers",
    MacxBackingStoreSuspend = "macx-backing-store-suspend",
    MacxBackingStoreRecovery = "macx-backing-store-recovery",
    PfzExit = "pfz-exit",
    SwtchPri = "swtch-pri",
    Swtch = "swtch",
    ThreadSwitch = "thread-switch",
    ClockSleep = "clock-sleep",
    MachVmReclaimUpdateKernelAccounting = "mach-vm-reclaim-update-kernel-accounting",
    HostCreateMachVoucher = "host-create-mach-voucher",
    MachVoucherExtractAttrRecipe = "mach-voucher-extract-attr-recipe",
    MachPortType = "mach-port-type",
    MachPortRequestNotification = "mach-port-request-notification",
    ExclavesCtl = "exclaves-ctl",
    MachTimebaseInfo = "mach-timebase-info",
    MachWaitUntil = "mach-wait-until",
    MkTimerCreate = "mk-timer-create",
    MkTimerDestroy = "mk-timer-destroy",
    MkTimerArm = "mk-timer-arm",
    MkTimerCancel = "mk-timer-cancel",
    MkTimerArmLeeway = "mk-timer-arm-leeway",
    DebugControlPortForPid = "debug-control-port-for-pid",
    IokitUserClient = "iokit-user-client"
}

export enum XnuBsdSyscall {
    Exit = "exit",
    Fork = "fork",
    Read = "read",
    Write = "write",
    Open = "open",
    Close = "close",
    Wait4 = "wait4",
    Link = "link",
    Unlink = "unlink",
    Chdir = "chdir",
    Fchdir = "fchdir",
    Mknod = "mknod",
    Chmod = "chmod",
    Chown = "chown",
    Getfsstat = "getfsstat",
    Getpid = "getpid",
    Setuid = "setuid",
    Getuid = "getuid",
    Geteuid = "geteuid",
    Ptrace = "ptrace",
    Recvmsg = "recvmsg",
    Sendmsg = "sendmsg",
    Recvfrom = "recvfrom",
    Accept = "accept",
    Getpeername = "getpeername",
    Getsockname = "getsockname",
    Access = "access",
    Chflags = "chflags",
    Fchflags = "fchflags",
    Sync = "sync",
    Kill = "kill",
    CrossarchTrap = "crossarch-trap",
    Getppid = "getppid",
    Dup = "dup",
    Pipe = "pipe",
    Getegid = "getegid",
    Sigaction = "sigaction",
    Getgid = "getgid",
    Sigprocmask = "sigprocmask",
    Getlogin = "getlogin",
    Setlogin = "setlogin",
    Acct = "acct",
    Sigpending = "sigpending",
    Sigaltstack = "sigaltstack",
    Ioctl = "ioctl",
    Reboot = "reboot",
    Revoke = "revoke",
    Symlink = "symlink",
    Readlink = "readlink",
    Execve = "execve",
    Umask = "umask",
    Chroot = "chroot",
    Msync = "msync",
    Vfork = "vfork",
    OslogCoprocReg = "oslog-coproc-reg",
    OslogCoproc = "oslog-coproc",
    Munmap = "munmap",
    Mprotect = "mprotect",
    Madvise = "madvise",
    Mincore = "mincore",
    Getgroups = "getgroups",
    Setgroups = "setgroups",
    Getpgrp = "getpgrp",
    Setpgid = "setpgid",
    Setitimer = "setitimer",
    Swapon = "swapon",
    Getitimer = "getitimer",
    Getdtablesize = "getdtablesize",
    Dup2 = "dup2",
    Fcntl = "fcntl",
    Select = "select",
    Fsync = "fsync",
    Setpriority = "setpriority",
    Socket = "socket",
    Connect = "connect",
    Getpriority = "getpriority",
    Bind = "bind",
    Setsockopt = "setsockopt",
    Listen = "listen",
    Sigsuspend = "sigsuspend",
    Gettimeofday = "gettimeofday",
    Getrusage = "getrusage",
    Getsockopt = "getsockopt",
    Readv = "readv",
    Writev = "writev",
    Settimeofday = "settimeofday",
    Fchown = "fchown",
    Fchmod = "fchmod",
    Setreuid = "setreuid",
    Setregid = "setregid",
    Rename = "rename",
    Flock = "flock",
    Mkfifo = "mkfifo",
    Sendto = "sendto",
    Shutdown = "shutdown",
    Socketpair = "socketpair",
    Mkdir = "mkdir",
    Rmdir = "rmdir",
    Utimes = "utimes",
    Futimes = "futimes",
    Adjtime = "adjtime",
    Gethostuuid = "gethostuuid",
    Setsid = "setsid",
    Getpgid = "getpgid",
    Setprivexec = "setprivexec",
    Pread = "pread",
    Pwrite = "pwrite",
    Nfssvc = "nfssvc",
    Statfs = "statfs",
    Fstatfs = "fstatfs",
    Unmount = "unmount",
    Getfh = "getfh",
    Funmount = "funmount",
    Quotactl = "quotactl",
    Mount = "mount",
    Csops = "csops",
    CsopsAudittoken = "csops-audittoken",
    Waitid = "waitid",
    KdebugTypefilter = "kdebug-typefilter",
    KdebugTraceString = "kdebug-trace-string",
    KdebugTrace64 = "kdebug-trace64",
    KdebugTrace = "kdebug-trace",
    Setgid = "setgid",
    Setegid = "setegid",
    Seteuid = "seteuid",
    Sigreturn = "sigreturn",
    PanicWithData = "panic-with-data",
    ThreadSelfcounts = "thread-selfcounts",
    Fdatasync = "fdatasync",
    Stat = "stat",
    Fstat = "fstat",
    Lstat = "lstat",
    Pathconf = "pathconf",
    Fpathconf = "fpathconf",
    Getrlimit = "getrlimit",
    Setrlimit = "setrlimit",
    Getdirentries = "getdirentries",
    Mmap = "mmap",
    Lseek = "lseek",
    Truncate = "truncate",
    Ftruncate = "ftruncate",
    Sysctl = "sysctl",
    Mlock = "mlock",
    Munlock = "munlock",
    Undelete = "undelete",
    OpenDprotectedNp = "open-dprotected-np",
    FsgetpathExt = "fsgetpath-ext",
    OpenatDprotectedNp = "openat-dprotected-np",
    Getattrlist = "getattrlist",
    Setattrlist = "setattrlist",
    Getdirentriesattr = "getdirentriesattr",
    Exchangedata = "exchangedata",
    Searchfs = "searchfs",
    Delete = "delete",
    Copyfile = "copyfile",
    Fgetattrlist = "fgetattrlist",
    Fsetattrlist = "fsetattrlist",
    Poll = "poll",
    Getxattr = "getxattr",
    Fgetxattr = "fgetxattr",
    Setxattr = "setxattr",
    Fsetxattr = "fsetxattr",
    Removexattr = "removexattr",
    Fremovexattr = "fremovexattr",
    Listxattr = "listxattr",
    Flistxattr = "flistxattr",
    Fsctl = "fsctl",
    Initgroups = "initgroups",
    PosixSpawn = "posix-spawn",
    Ffsctl = "ffsctl",
    Fhopen = "fhopen",
    Minherit = "minherit",
    Semsys = "semsys",
    Msgsys = "msgsys",
    Shmsys = "shmsys",
    Semctl = "semctl",
    Semget = "semget",
    Semop = "semop",
    Msgctl = "msgctl",
    Msgget = "msgget",
    Msgsnd = "msgsnd",
    Msgrcv = "msgrcv",
    Shmat = "shmat",
    Shmctl = "shmctl",
    Shmdt = "shmdt",
    Shmget = "shmget",
    ShmOpen = "shm-open",
    ShmUnlink = "shm-unlink",
    SemOpen = "sem-open",
    SemClose = "sem-close",
    SemUnlink = "sem-unlink",
    SemWait = "sem-wait",
    SemTrywait = "sem-trywait",
    SemPost = "sem-post",
    Sysctlbyname = "sysctlbyname",
    OpenExtended = "open-extended",
    UmaskExtended = "umask-extended",
    StatExtended = "stat-extended",
    LstatExtended = "lstat-extended",
    FstatExtended = "fstat-extended",
    ChmodExtended = "chmod-extended",
    FchmodExtended = "fchmod-extended",
    AccessExtended = "access-extended",
    Settid = "settid",
    Gettid = "gettid",
    Setsgroups = "setsgroups",
    Getsgroups = "getsgroups",
    Setwgroups = "setwgroups",
    Getwgroups = "getwgroups",
    MkfifoExtended = "mkfifo-extended",
    MkdirExtended = "mkdir-extended",
    Identitysvc = "identitysvc",
    SharedRegionCheckNp = "shared-region-check-np",
    VmPressureMonitor = "vm-pressure-monitor",
    PsynchRwLongrdlock = "psynch-rw-longrdlock",
    PsynchRwYieldwrlock = "psynch-rw-yieldwrlock",
    PsynchRwDowngrade = "psynch-rw-downgrade",
    PsynchRwUpgrade = "psynch-rw-upgrade",
    PsynchMutexwait = "psynch-mutexwait",
    PsynchMutexdrop = "psynch-mutexdrop",
    PsynchCvbroad = "psynch-cvbroad",
    PsynchCvsignal = "psynch-cvsignal",
    PsynchCvwait = "psynch-cvwait",
    PsynchRwRdlock = "psynch-rw-rdlock",
    PsynchRwWrlock = "psynch-rw-wrlock",
    PsynchRwUnlock = "psynch-rw-unlock",
    PsynchRwUnlock2 = "psynch-rw-unlock2",
    Getsid = "getsid",
    SettidWithPid = "settid-with-pid",
    PsynchCvclrprepost = "psynch-cvclrprepost",
    AioFsync = "aio-fsync",
    AioReturn = "aio-return",
    AioSuspend = "aio-suspend",
    AioCancel = "aio-cancel",
    AioError = "aio-error",
    AioRead = "aio-read",
    AioWrite = "aio-write",
    LioListio = "lio-listio",
    Iopolicysys = "iopolicysys",
    ProcessPolicy = "process-policy",
    Mlockall = "mlockall",
    Munlockall = "munlockall",
    Issetugid = "issetugid",
    PthreadKill = "pthread-kill",
    PthreadSigmask = "pthread-sigmask",
    Sigwait = "sigwait",
    DisableThreadsignal = "disable-threadsignal",
    PthreadMarkcancel = "pthread-markcancel",
    PthreadCanceled = "pthread-canceled",
    SemwaitSignal = "semwait-signal",
    ProcInfo = "proc-info",
    Sendfile = "sendfile",
    Stat64 = "stat64",
    Fstat64 = "fstat64",
    Lstat64 = "lstat64",
    Stat64Extended = "stat64-extended",
    Lstat64Extended = "lstat64-extended",
    Fstat64Extended = "fstat64-extended",
    Getdirentries64 = "getdirentries64",
    Statfs64 = "statfs64",
    Fstatfs64 = "fstatfs64",
    Getfsstat64 = "getfsstat64",
    PthreadChdir = "pthread-chdir",
    PthreadFchdir = "pthread-fchdir",
    Audit = "audit",
    Auditon = "auditon",
    Getauid = "getauid",
    Setauid = "setauid",
    GetauditAddr = "getaudit-addr",
    SetauditAddr = "setaudit-addr",
    Auditctl = "auditctl",
    BsdthreadCreate = "bsdthread-create",
    BsdthreadTerminate = "bsdthread-terminate",
    Kqueue = "kqueue",
    Kevent = "kevent",
    Lchown = "lchown",
    BsdthreadRegister = "bsdthread-register",
    WorkqOpen = "workq-open",
    WorkqKernreturn = "workq-kernreturn",
    Kevent64 = "kevent64",
    ThreadSelfid = "thread-selfid",
    Ledger = "ledger",
    KeventQos = "kevent-qos",
    KeventId = "kevent-id",
    MacExecve = "mac-execve",
    MacSyscall = "mac-syscall",
    MacGetFile = "mac-get-file",
    MacSetFile = "mac-set-file",
    MacGetLink = "mac-get-link",
    MacSetLink = "mac-set-link",
    MacGetProc = "mac-get-proc",
    MacSetProc = "mac-set-proc",
    MacGetFd = "mac-get-fd",
    MacSetFd = "mac-set-fd",
    MacGetPid = "mac-get-pid",
    Pselect = "pselect",
    PselectNocancel = "pselect-nocancel",
    ReadNocancel = "read-nocancel",
    WriteNocancel = "write-nocancel",
    OpenNocancel = "open-nocancel",
    CloseNocancel = "close-nocancel",
    Wait4Nocancel = "wait4-nocancel",
    RecvmsgNocancel = "recvmsg-nocancel",
    SendmsgNocancel = "sendmsg-nocancel",
    RecvfromNocancel = "recvfrom-nocancel",
    AcceptNocancel = "accept-nocancel",
    MsyncNocancel = "msync-nocancel",
    FcntlNocancel = "fcntl-nocancel",
    SelectNocancel = "select-nocancel",
    FsyncNocancel = "fsync-nocancel",
    ConnectNocancel = "connect-nocancel",
    SigsuspendNocancel = "sigsuspend-nocancel",
    ReadvNocancel = "readv-nocancel",
    WritevNocancel = "writev-nocancel",
    SendtoNocancel = "sendto-nocancel",
    PreadNocancel = "pread-nocancel",
    PwriteNocancel = "pwrite-nocancel",
    WaitidNocancel = "waitid-nocancel",
    PollNocancel = "poll-nocancel",
    MsgsndNocancel = "msgsnd-nocancel",
    MsgrcvNocancel = "msgrcv-nocancel",
    SemWaitNocancel = "sem-wait-nocancel",
    AioSuspendNocancel = "aio-suspend-nocancel",
    SigwaitNocancel = "sigwait-nocancel",
    SemwaitSignalNocancel = "semwait-signal-nocancel",
    MacMount = "mac-mount",
    MacGetMount = "mac-get-mount",
    MacGetfsstat = "mac-getfsstat",
    Fsgetpath = "fsgetpath",
    AuditSessionSelf = "audit-session-self",
    AuditSessionJoin = "audit-session-join",
    FileportMakeport = "fileport-makeport",
    FileportMakefd = "fileport-makefd",
    AuditSessionPort = "audit-session-port",
    PidSuspend = "pid-suspend",
    PidResume = "pid-resume",
    PidHibernate = "pid-hibernate",
    PidShutdownSockets = "pid-shutdown-sockets",
    KasInfo = "kas-info",
    MemorystatusControl = "memorystatus-control",
    GuardedOpenNp = "guarded-open-np",
    GuardedCloseNp = "guarded-close-np",
    GuardedKqueueNp = "guarded-kqueue-np",
    ChangeFdguardNp = "change-fdguard-np",
    Usrctl = "usrctl",
    ProcRlimitControl = "proc-rlimit-control",
    Connectx = "connectx",
    Disconnectx = "disconnectx",
    Peeloff = "peeloff",
    SocketDelegate = "socket-delegate",
    Telemetry = "telemetry",
    ProcUuidPolicy = "proc-uuid-policy",
    MemorystatusGetLevel = "memorystatus-get-level",
    SystemOverride = "system-override",
    VfsPurge = "vfs-purge",
    SfiCtl = "sfi-ctl",
    SfiPidctl = "sfi-pidctl",
    Coalition = "coalition",
    CoalitionInfo = "coalition-info",
    NecpMatchPolicy = "necp-match-policy",
    Getattrlistbulk = "getattrlistbulk",
    Clonefileat = "clonefileat",
    Openat = "openat",
    OpenatNocancel = "openat-nocancel",
    Renameat = "renameat",
    Faccessat = "faccessat",
    Fchmodat = "fchmodat",
    Fchownat = "fchownat",
    Fstatat = "fstatat",
    Fstatat64 = "fstatat64",
    Linkat = "linkat",
    Unlinkat = "unlinkat",
    Readlinkat = "readlinkat",
    Symlinkat = "symlinkat",
    Mkdirat = "mkdirat",
    Getattrlistat = "getattrlistat",
    ProcTraceLog = "proc-trace-log",
    BsdthreadCtl = "bsdthread-ctl",
    OpenbyidNp = "openbyid-np",
    RecvmsgX = "recvmsg-x",
    SendmsgX = "sendmsg-x",
    ThreadSelfusage = "thread-selfusage",
    Csrctl = "csrctl",
    GuardedOpenDprotectedNp = "guarded-open-dprotected-np",
    GuardedWriteNp = "guarded-write-np",
    GuardedPwriteNp = "guarded-pwrite-np",
    GuardedWritevNp = "guarded-writev-np",
    RenameatxNp = "renameatx-np",
    MremapEncrypted = "mremap-encrypted",
    NetagentTrigger = "netagent-trigger",
    StackSnapshotWithConfig = "stack-snapshot-with-config",
    Microstackshot = "microstackshot",
    GrabPgoData = "grab-pgo-data",
    Persona = "persona",
    MachEventlinkSignal = "mach-eventlink-signal",
    MachEventlinkWaitUntil = "mach-eventlink-wait-until",
    MachEventlinkSignalWaitUntil = "mach-eventlink-signal-wait-until",
    WorkIntervalCtl = "work-interval-ctl",
    Getentropy = "getentropy",
    NecpClientAction = "necp-client-action",
    NexusOpen = "nexus-open",
    NexusRegister = "nexus-register",
    NexusDeregister = "nexus-deregister",
    NexusCreate = "nexus-create",
    NexusDestroy = "nexus-destroy",
    NexusGetOpt = "nexus-get-opt",
    NexusSetOpt = "nexus-set-opt",
    ChannelOpen = "channel-open",
    ChannelGetInfo = "channel-get-info",
    ChannelSync = "channel-sync",
    ChannelGetOpt = "channel-get-opt",
    ChannelSetOpt = "channel-set-opt",
    UlockWait = "ulock-wait",
    UlockWake = "ulock-wake",
    Fclonefileat = "fclonefileat",
    FsSnapshot = "fs-snapshot",
    TerminateWithPayload = "terminate-with-payload",
    AbortWithPayload = "abort-with-payload",
    NecpSessionAction = "necp-session-action",
    Setattrlistat = "setattrlistat",
    NetQosGuideline = "net-qos-guideline",
    Fmount = "fmount",
    NtpAdjtime = "ntp-adjtime",
    NtpGettime = "ntp-gettime",
    OsFaultWithPayload = "os-fault-with-payload",
    KqueueWorkloopCtl = "kqueue-workloop-ctl",
    MachBridgeRemoteTime = "mach-bridge-remote-time",
    CoalitionLedger = "coalition-ledger",
    LogData = "log-data",
    MemorystatusAvailableMemory = "memorystatus-available-memory",
    ObjcBpAssistCfgNp = "objc-bp-assist-cfg-np",
    SharedRegionMapAndSlide2Np = "shared-region-map-and-slide-2-np",
    PivotRoot = "pivot-root",
    TaskInspectForPid = "task-inspect-for-pid",
    TaskReadForPid = "task-read-for-pid",
    Preadv = "preadv",
    Pwritev = "pwritev",
    PreadvNocancel = "preadv-nocancel",
    PwritevNocancel = "pwritev-nocancel",
    UlockWait2 = "ulock-wait2",
    ProcInfoExtendedId = "proc-info-extended-id",
    TrackerAction = "tracker-action",
    DebugSyscallReject = "debug-syscall-reject",
    DebugSyscallRejectConfig = "debug-syscall-reject-config",
    Graftdmg = "graftdmg",
    MapWithLinkingNp = "map-with-linking-np",
    Freadlink = "freadlink",
    RecordSystemEvent = "record-system-event",
    Mkfifoat = "mkfifoat",
    Mknodat = "mknodat",
    Ungraftdmg = "ungraftdmg",
    CoalitionPolicySet = "coalition-policy-set",
    CoalitionPolicyGet = "coalition-policy-get"
}

export enum WaitKind {
    Exited = "exited",
    Signaled = "signaled",
    Stopped = "stopped",
    Other = "other"
}

export enum FileMonitorEvent {
    Changed = "changed",
    ChangesDoneHint = "changes-done-hint",
    Deleted = "deleted",
    Created = "created",
    AttributeChanged = "attribute-changed",
    PreUnmount = "pre-unmount",
    Unmounted = "unmounted",
    Moved = "moved",
    Renamed = "renamed",
    MovedIn = "moved-in",
    MovedOut = "moved-out"
}

export enum SocketFamily {
    Invalid = "invalid",
    Unix = "unix",
    Ipv4 = "ipv4",
    Ipv6 = "ipv6"
}

export enum UnixSocketAddressType {
    Invalid = "invalid",
    Anonymous = "anonymous",
    Path = "path",
    Abstract = "abstract",
    AbstractPadded = "abstract-padded"
}

export type TargetProcess = ProcessID | ProcessName;

export type ProcessID = number;

export type InjecteeID = number;

export type FileDescriptor = number;

export type ProcessName = string;

export interface SystemParameters {
    /**
     * Operating System details.
     */
    os: {
        /**
         * ID, e.g.: windows, macos, linux, ios, android, qnx, fedora, ubuntu, etc.
         */
        id: string;

        /**
         * Human-readable name, e.g. `"macOS"`.
         */
        name: string;

        /**
         * Human-readable version string, e.g. `"11.2.2"`.
         */
        version?: string;

        /**
         * Build version, e.g. `"21B91"`.
         */
        build?: string;
    }

    /**
     * Platform, same as `Process.platform` in GumJS.
     */
    platform: "windows" | "darwin" | "linux" | "freebsd" | "qnx";

    /**
     * Architecture, same as `Process.arch` in GumJS.
     */
    arch: "ia32" | "x64" | "arm" | "arm64" | "mips";

    /**
     * Hardware details.
     */
    hardware?: {
        /**
         * Product type, e.g. `"iPad6,3"`.
         */
        product?: string;

        /**
         * Hardware platform, e.g. `"t8010"`.
         */
        platform?: string;

        /**
         * Hardware model, e.g. `"J71bAP"`.
         */
        model?: string;
    }

    /**
     * Level of access.
     */
    access: "full" | "jailed";

    /**
     * System name, e.g. `"Ole André’s iPhone"`.
     */
    name?: string;

    /**
     * iOS UDID (Unique Device ID).
     */
    udid?: string;

    /**
     * Details about cellular and networking interfaces.
     */
    interfaces?: SystemInterface[];

    /**
     * Android API level, e.g.: `30`.
     */
    apiLevel?: number;

    [name: string]: any;
}

export type SystemInterface = NetworkInterface | CellularInterface;

export interface NetworkInterface {
    type: "ethernet" | "wifi" | "bluetooth";

    /**
     * MAC address, e.g.: `"aa:bb:cc:dd:ee:ff"`.
     */
    address: string;
}

export interface CellularInterface {
    type: "cellular";

    /**
     * Phone number, e.g. `"+47 123 45 678"`.
     */
    phoneNumber: string;
}

export interface SpawnOptions {
    argv?: string[];
    envp?: { [name: string]: string };
    env?: { [name: string]: string };
    cwd?: string;
    stdio?: Stdio;

    [name: string]: any;
}

export interface RelayProperties {
    address: string;
    username: string;
    password: string;
    kind: RelayKind;
}

export type Message = SendMessage | ErrorMessage;

export enum MessageType {
    Send = "send",
    Error = "error"
}

export interface SendMessage {
    type: MessageType.Send;
    payload: any;
}

export interface ErrorMessage {
    type: MessageType.Error;
    description: string;
    stack?: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
}

export type ScriptLogHandler = (level: LogLevel, text: string) => void;

export interface ScriptExports {
    [name: string]: (...args: any[]) => Promise<any>;
}

export enum LogLevel {
    Info = "info",
    Warning = "warning",
    Error = "error",
}

export interface EnableDebuggerOptions {
    port?: number;
}

export interface PortalServiceOptions {
    clusterParams?: EndpointParameters;
    controlParams?: EndpointParameters;
}

export type PortalConnectionId = number;

export type PortalConnectionTag = string;

export interface EndpointParametersSubset {
    address?: string;
    port?: number;
    certificate?: string;
    origin?: string;
    authentication?: AuthenticationScheme;
    assetRoot?: string;
}

export type AuthenticationScheme = TokenAuthenticationScheme | CallbackAuthenticationScheme;

export interface TokenAuthenticationScheme {
    scheme: "token";
    token: string;
}

export interface CallbackAuthenticationScheme {
    scheme: "callback";
    callback: AuthenticationCallback;
}

export type AuthenticationCallback = (token: string) => Promise<AuthenticatedSessionInfo>;

export interface AuthenticatedSessionInfo {
    [key: string]: any;
}

export type SocketAddress = IPV4SocketAddress | IPV6SocketAddress | AnonymousUnixSocketAddress | PathUnixSocketAddress | AbstractUnixSocketAddress;

export interface IPV4SocketAddress {
    family: "ipv4";
    address: string;
    port: number;
}

export interface IPV6SocketAddress {
    family: "ipv6";
    address: string;
    port: number;
    flowlabel: number;
    scopeid: number;
}

export interface AnonymousUnixSocketAddress {
    family: "unix:anonymous";
}

export interface PathUnixSocketAddress {
    family: "unix:path";
    path: string;
}

export interface AbstractUnixSocketAddress {
    family: "unix:abstract";
    path: Buffer;
}

export type Variant = VariantValue | [type: symbol, value: VariantValue];

export type VariantValue = | boolean
| number
| string
| Buffer
| Variant[]
| VariantDict;

export interface VariantDict {
    [key: string]: Variant;
}

export class Signal<H extends SignalHandler> {
    connect(handler: H): void;
    disconnect(handler: H): void;
}

export type SignalHandler = (...args: any[]) => void;
