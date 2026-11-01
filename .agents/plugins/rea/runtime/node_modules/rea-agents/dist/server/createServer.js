import { AnalysisSettings } from "../application/AnalysisSettings.js";
import { registerAnalysisSettingsTools } from "./registerAnalysisSettingsTools.js";
import { registerDevicetreeTool } from "./registerDevicetreeTool.js";
import { pcapCaptureHostSupported } from "../domain/pcap/pcapAnalysis.js";
import { createGpuCodeObjectsService } from "../composition/gpu.js";
import { registerGpuCodeObjectsTools } from "./registerGpuCodeObjectsTools.js";
import { UNTRUSTED_CONTENT_INSTRUCTIONS } from "./toolResultEncoding.js";
import { RECOVERY_INSTRUCTIONS } from "./recoveryInstructions.js";
import { createPacketCaptureService, tsharkHostSupported, } from "../composition/captures.js";
import { registerCaptureTools } from "./registerCaptureTools.js";
import { createSignalRecordingService, sigrokHostSupported, } from "../composition/signals.js";
import { registerSignalTools } from "./registerSignalTools.js";
import { wasmArtifactModule } from "../composition/wasm.js";
import { registerWasmTools } from "./registerWasmTools.js";
import { apkSignatureModule } from "../composition/apkSignature.js";
import { registerApkSignatureTools } from "./registerApkSignatureTools.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { captureProviderEnvironment } from "./providerEnvironment.js";
import { createElfNotesService, createAppleIpsService, createDevicetreeService, createKernelModuleService, createPeLoadConfigService, createPeCertificatesService, createPeImportsService, createNativeExportsService, createPeResourcesService, createRecordedCrashService, createByteEntropyService, createBinaryLayoutService, pwntoolsHostSupported, } from "../composition/binaryDiagnostics.js";
import { registerElfNotesTool } from "./registerElfNotesTool.js";
import { registerAppleIpsTool } from "./registerAppleIpsTool.js";
import { registerKernelModuleTool } from "./registerKernelModuleTool.js";
import { registerPeLoadConfigTool } from "./registerPeLoadConfigTool.js";
import { registerPeCertificatesTool } from "./registerPeCertificatesTool.js";
import { registerPeImportsTool } from "./registerPeImportsTool.js";
import { registerPeResourcesTool } from "./registerPeResourcesTool.js";
import { registerNativeExportsTool } from "./registerNativeExportsTool.js";
import { evmHostSupported, evmInterfaceModule, evmLimiterAvailability, } from "../composition/evm.js";
import { registerEvmTools } from "./registerEvmTools.js";
import { createSqliteDatabaseService } from "../composition/sqlite.js";
import { registerSqliteTools } from "./registerSqliteTools.js";
import { registerRecordedCrashTools } from "./registerRecordedCrashTools.js";
import { createDesktopApplicationService } from "../composition/desktop.js";
import { registerDesktopApplicationTool } from "./registerDesktopApplicationTool.js";
import { createGoBinaryService } from "../composition/go.js";
import { createModelArtifactService } from "../composition/model.js";
import { registerModelArtifactTools } from "./registerModelArtifactTools.js";
import { createIl2cppMetadataService } from "../composition/il2cpp.js";
import { createElectronFuseService } from "../composition/electronFuses.js";
import { registerGoTools } from "./registerGoTools.js";
import { registerIl2cppTools } from "./registerIl2cppTools.js";
import { createRustBinaryService } from "../composition/rust.js";
import { registerRustTools } from "./registerRustTools.js";
import { createPythonPycService } from "../composition/pythonPyc.js";
import { registerPythonPycTool } from "./registerPythonPycTool.js";
import { createBeamService } from "../composition/erlang.js";
import { registerErlangTools } from "./registerErlangTools.js";
import { registerAnalysisViewTool } from "./registerAnalysisViewTool.js";
import { registerBinaryDiagnosticsTools } from "./registerBinaryDiagnosticsTools.js";
import { FridaInstrumentationManager } from "../frida/FridaInstrumentationManager.js";
import { registerFridaTools } from "./registerFridaTools.js";
import { createCatalogIdentity } from "../catalogIdentity.js";
import { EvidenceMcpServer } from "./EvidenceMcpServer.js";
import { createToolResultDelivery } from "./toolResult.js";
import { parseMcpResponseBudget } from "../config/mcpResponseBudget.js";
import { parseMcpOutputSchemaProfile } from "../config/mcpOutputSchemaProfile.js";
import { compactPresentationForMcpInputSchemaProfile, parseMcpInputSchemaProfile, } from "../config/mcpInputSchemaProfile.js";
import { isAbsolute } from "node:path";
import { PRODUCT_IDENTITY } from "../identity.js";
import { silentLogger } from "../logger.js";
import { registerApplicationTools } from "./registerApplicationTools.js";
import { registerArtifactTools } from "./registerArtifactTools.js";
import { registerNativeTools } from "./registerNativeTools.js";
import { registerBrowserScenarioTool } from "./registerBrowserScenarioTool.js";
import { registerBrowserTools } from "./registerBrowserTools.js";
import { registerWebScriptTool } from "./registerWebScriptTool.js";
import { registerWebModuleTool } from "./registerWebModuleTool.js";
import { createWebModuleTraceService } from "../composition/webModules.js";
import { createWebSourceLocationService } from "../composition/webSourceLocations.js";
import { registerWebSourceLocationTool } from "./registerWebSourceLocationTool.js";
import { createWebRuntimeService } from "../composition/webRuntime.js";
import { registerWebRuntimeTools } from "./registerWebRuntimeTools.js";
import { createWebNetworkCaptureService } from "../composition/webNetworkCaptures.js";
import { registerWebNetworkCaptureTool } from "./registerWebNetworkCaptureTool.js";
import { registerJavaScriptRecoveryTool } from "./registerJavaScriptRecoveryTool.js";
import { JavaScriptRecoveryService } from "../application/javascript/JavaScriptRecoveryService.js";
import { createJavaScriptRecoveryProvider, wakaruHostSupported, } from "../composition/javascriptRecovery.js";
import { registerElectronTools } from "./registerElectronTools.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { registerEnhancedTools } from "./registerEnhancedTools.js";
import { registerJavaScriptRuntimeObservationTools } from "./registerJavaScriptRuntimeObservationTools.js";
import { registerManagedTools } from "./registerManagedTools.js";
import { registerFirmwareTools } from "./registerFirmwareTools.js";
import { FirmwareAnalysisService } from "../application/firmware/FirmwareAnalysisService.js";
import { createFirmwareAnalysisProvider, firmwareHostSupported, } from "../composition/firmware.js";
import { registerAndroidTools } from "./registerAndroidTools.js";
import { registerApktoolTools } from "./registerApktoolTools.js";
import { registerPcapTools } from "./registerPcapTools.js";
import { registerFlutterTools } from "./registerFlutterTools.js";
import { registerJebTools } from "./registerJebTools.js";
import { registerAdbTools } from "./registerAdbTools.js";
import { AndroidAnalysisService } from "../application/android/AndroidAnalysisService.js";
import { JebAnalysisService } from "../application/jeb/JebAnalysisService.js";
import { PcapAnalysisService } from "../application/pcap/PcapAnalysisService.js";
import { locateWiresharkTool, selectWiresharkTool, } from "../pcap/PcapConfiguration.js";
import { ApktoolResourceAnalysisService } from "../application/apktool/ApktoolResourceAnalysisService.js";
import { FlutterBuildAnalysisService } from "../application/flutter/FlutterBuildAnalysisService.js";
import { createAndroidAnalysisProvider } from "../composition/android.js";
import { createApktoolResourceAnalysisProvider } from "../composition/apktool.js";
import { createPcapAnalysisProvider } from "../composition/pcap.js";
import { createFlutterBuildAnalysisProvider } from "../composition/flutter.js";
import { createJebAnalysisProvider } from "../composition/jeb.js";
import { AdbDeviceAnalysisService } from "../application/adb/AdbDeviceAnalysisService.js";
import { createAdbDeviceAnalysisProvider } from "../composition/adb.js";
import { registerManagedWorkflowTools } from "./registerManagedWorkflowTools.js";
import { registerOfficialTools } from "./registerOfficialTools.js";
import { registerGuidedPrompts } from "./registerPrompts.js";
import { registerSessionTools } from "./registerSessionTools.js";
import { sessionAvailabilityPolicy } from "./sessionAvailabilityPolicy.js";
import { withAdmittedAnalysis, } from "./analysisAdmission.js";
import { createReverseEngineeringService } from "../composition/reverseEngineering.js";
import { registerReverseEngineeringTools } from "./registerReverseEngineeringTools.js";
import { CutterBridgeClient } from "../cutter/CutterBridgeClient.js";
import { CutterBridgeService } from "../cutter/CutterBridgeService.js";
import { registerCutterTools } from "./registerCutterTools.js";
import { GdbSessionManager } from "../gdb/GdbSessionManager.js";
import { registerGdbTools } from "./registerGdbTools.js";
import { RizinDebugSessionManager } from "../rizin/RizinDebugSessionManager.js";
import { registerRizinDebugTools } from "./registerRizinDebugTools.js";
const TARGET_FREE_INSTRUCTIONS = "REA provides reverse-engineering tools for local artifacts, native binaries, managed code, browser pages, and runtimes. Use the tool that directly answers the question; discover targets or inspect inventory only when needed. Tool results include inline Evidence and report their coverage and limitations. An opened target persists across turns. When finished, export needed Evidence and call close_binary; its snapshot_path can retain analysis.";
const ACTIVE_TARGET_INSTRUCTIONS = "REA analyzes the active reverse-engineering target. Use the analysis tool that answers the question directly. Search or list symbols when discovery is needed; analyze_function provides a function dossier, and focused procedure tools return individual facets.";
/** Apply the shared TShark selection rule without starting the tool. */
const tsharkLocatable = (environment) => {
    try {
        return (locateWiresharkTool(selectWiresharkTool(environment, "tshark"), environment) !== undefined);
    }
    catch {
        // A relative REA_TSHARK_COMMAND is configuration the tool reports at execution.
        return false;
    }
};
const installSessionToolAvailability = (session, options, environment, fridaInstrumentation) => {
    if (session === undefined)
        return undefined;
    const { platform, arch } = process;
    // Each provider owns its verified host; discovery and execution share it.
    const verifiedHost = {
        packetCapture: tsharkHostSupported(platform),
        pcapCapture: pcapCaptureHostSupported(platform),
        signalRecording: sigrokHostSupported(platform),
        evmInterface: evmHostSupported(platform, arch),
        pwntools: pwntoolsHostSupported(platform, arch),
        firmware: firmwareHostSupported(platform),
        javascriptRecovery: wakaruHostSupported(platform, arch),
    };
    const pwntools = verifiedHost.pwntools && isAbsolute(environment.REA_PWNTOOLS_PYTHON ?? "");
    // Injected services own their availability on any host. Otherwise no
    // configuration lets an integration pass its execution host check.
    const outsideVerifiedHost = (injected, supported) => injected === undefined && !supported;
    const basePolicy = sessionAvailabilityPolicy(options.availabilityPolicy, {
        optionalProviderLoadFailures: options.optionalProviderLoadFailures,
        hostUnsupported: {
            pcapCapture: outsideVerifiedHost(options.pcapAnalysis, verifiedHost.pcapCapture),
            packetCapture: outsideVerifiedHost(options.packetCapture, verifiedHost.packetCapture),
            signalRecording: outsideVerifiedHost(options.signalRecording, verifiedHost.signalRecording),
            evmInterface: outsideVerifiedHost(options.evmInterface, verifiedHost.evmInterface),
            binaryLayout: outsideVerifiedHost(options.binaryLayout, verifiedHost.pwntools),
            recordedCrash: outsideVerifiedHost(options.recordedCrash, verifiedHost.pwntools),
            firmwareInspection: outsideVerifiedHost(options.firmwareAnalysis, verifiedHost.firmware),
            firmwareExtraction: outsideVerifiedHost(options.firmwareAnalysis, verifiedHost.firmware),
            javascriptRecovery: outsideVerifiedHost(options.javascriptRecovery, verifiedHost.javascriptRecovery),
        },
        optionalFeatures: {
            packetCaptureEnabled: options.packetCapture !== undefined ||
                (verifiedHost.packetCapture && tsharkLocatable(environment)),
            signalRecordingEnabled: options.signalRecording !== undefined ||
                (verifiedHost.signalRecording &&
                    isAbsolute(environment.REA_SIGROK_COMMAND ?? "")),
            wasmArtifactEnabled: options.wasmArtifact !== undefined ||
                isAbsolute(environment.REA_WABT_BIN_DIRECTORY ?? ""),
            evmInterfaceEnabled: options.evmInterface !== undefined || verifiedHost.evmInterface,
            webModuleResolutionEnabled: options.webModuleTrace !== undefined ||
                isAbsolute(environment.REA_BROWSER_EXECUTABLE ?? ""),
            recordedCrashEnabled: options.recordedCrash !== undefined || pwntools,
            binaryLayoutEnabled: options.binaryLayout !== undefined || pwntools,
            firmwareInspectionEnabled: options.firmwareAnalysis !== undefined ||
                (verifiedHost.firmware &&
                    isAbsolute(environment.REA_BINWALK_COMMAND ?? "")),
            firmwareExtractionEnabled: options.firmwareAnalysis !== undefined ||
                (verifiedHost.firmware &&
                    isAbsolute(environment.REA_UNBLOB_COMMAND ?? "")),
            browserObservationEnabled: options.browserObservation !== undefined,
            javascriptRecoveryEnabled: options.javascriptRecovery !== undefined ||
                (verifiedHost.javascriptRecovery &&
                    isAbsolute(environment.REA_WAKARU_COMMAND ?? "")),
            browserScenarioEnabled: options.browserScenarioCapture !== undefined,
            electronObservationEnabled: options.electronObservation !== undefined,
            electronAutomationEnabled: options.electronActiveObservation !== undefined,
            v8InspectorObservationEnabled: options.javascriptRuntimeObservation !== undefined,
        },
    });
    const policy = () => {
        const value = basePolicy();
        const fridaFailure = options.optionalProviderLoadFailures?.fridaInstrumentation ??
            fridaInstrumentation.availabilityFailure?.();
        return fridaFailure === undefined
            ? value
            : {
                ...value,
                optionalProviderLoadFailures: {
                    ...value.optionalProviderLoadFailures,
                    fridaInstrumentation: fridaFailure,
                },
            };
    };
    return {
        policy,
        ...(options.evmInterface !== undefined || !verifiedHost.evmInterface
            ? {}
            : {
                evmLimiterAvailability: (signal) => evmLimiterAvailability(environment, { signal }),
            }),
    };
};
const createMcpServer = (session, delivery, compactPresentation, omitOutputSchemas) => new EvidenceMcpServer({
    name: PRODUCT_IDENTITY.mcpServerKey,
    version: PRODUCT_IDENTITY.packageVersion,
}, {
    capabilities: {},
    instructions: `${session === undefined
        ? ACTIVE_TARGET_INSTRUCTIONS
        : TARGET_FREE_INSTRUCTIONS} ${RECOVERY_INSTRUCTIONS} ${UNTRUSTED_CONTENT_INSTRUCTIONS}`,
}, session === undefined
    ? undefined
    : (evidence) => session.recordEvidence(evidence), delivery, compactPresentation, omitOutputSchemas, createCatalogIdentity(compactPresentation, omitOutputSchemas ? "off" : "full"));
/**
 * Construct one MCP server without acquiring subprocess resources.
 * Supplying a session adds target lifecycle tools; omitting it retains the
 * fixed-target seam used by focused tests and embedders.
 */
export const createServer = (source, options = {}) => {
    const session = source.kind === "session" ? source.session : undefined;
    const analysis = source.kind === "session" ? source.session : source.analysis;
    const environment = snapshotEnvironment(options.environment ?? process.env);
    const analysisSettings = options.analysisSettings ?? new AnalysisSettings(environment);
    const omitOutputSchemas = outputSchemasOmitted(environment);
    const providerEnvironment = captureProviderEnvironment(options.providerEnvironment, environment);
    const delivery = selectToolResultDelivery(environment, options.delivery);
    const evmInterface = options.evmInterface ?? evmInterfaceModule.create(environment);
    const sqliteDatabase = options.sqliteDatabase ?? createSqliteDatabaseService(environment);
    const binaryLayout = options.binaryLayout ?? createBinaryLayoutService(environment);
    const recordedCrash = options.recordedCrash ?? createRecordedCrashService(environment);
    const webSourceLocation = options.webSourceLocation ?? createWebSourceLocationService(environment);
    const webModuleTrace = options.webModuleTrace ?? createWebModuleTraceService(environment);
    const desktopApplication = createDesktopApplicationService();
    const goBinary = options.goBinary ?? createGoBinaryService();
    const rustBinary = options.rustBinary ?? createRustBinaryService();
    const erlangBeam = options.erlangBeam ?? createBeamService();
    const modelArtifact = createModelArtifactService();
    const gpuCodeObjects = createGpuCodeObjectsService();
    const il2cppMetadata = options.il2cppMetadata ?? createIl2cppMetadataService();
    const peResources = createPeResourcesService();
    const nativeExports = createNativeExportsService();
    const devicetree = createDevicetreeService();
    const elfNotes = createElfNotesService();
    const appleIps = createAppleIpsService();
    const kernelModule = createKernelModuleService();
    const peLoadConfig = createPeLoadConfigService();
    const peCertificates = createPeCertificatesService();
    const peImports = createPeImportsService();
    const electronFuses = options.electronFuses ?? createElectronFuseService();
    const pythonPyc = options.pythonPyc ?? createPythonPycService();
    const webNetworkCapture = options.webNetworkCapture ??
        createWebNetworkCaptureService(environment, analysisSettings.read);
    const javascriptRecovery = options.javascriptRecovery ?? createJavaScriptRecoveryProvider(environment);
    const artifactResources = new ArtifactResourceScope();
    const reverseEngineering = createReverseEngineeringService(providerEnvironment);
    const firmwareAnalysis = new FirmwareAnalysisService(options.firmwareAnalysis ?? createFirmwareAnalysisProvider(environment));
    const selectedOptions = {
        ...options,
        environment,
        delivery,
        evmInterface,
        sqliteDatabase,
        binaryLayout,
        recordedCrash,
        webSourceLocation,
        webModuleTrace,
        javascriptRecovery,
    };
    const startedAt = options.startedAt ?? new Date().toISOString();
    const logger = options.logger ?? silentLogger;
    const server = options.mcpServer ??
        createMcpServer(session, delivery, selectCompactInputSchemaPresentation(environment), omitOutputSchemas);
    server.analysisSettings = analysisSettings;
    registerAnalysisSettingsTools(server, analysisSettings);
    if (options.mcpServer !== undefined) {
        server.attachRuntime(session === undefined
            ? undefined
            : (evidence) => session.recordEvidence(evidence), delivery, createCatalogIdentity(selectCompactInputSchemaPresentation(environment), omitOutputSchemas ? "off" : "full"));
    }
    const gdbSessions = new GdbSessionManager({
        environment: providerEnvironment,
    });
    const rizinDebugSessions = new RizinDebugSessionManager(providerEnvironment);
    const android = options.androidAnalysis ??
        createAndroidAnalysisProvider(environment, undefined, analysisSettings.read);
    const pcap = options.pcapAnalysis ?? createPcapAnalysisProvider(environment);
    const flutter = options.flutterAnalysis ?? createFlutterBuildAnalysisProvider();
    const fridaInstrumentation = options.fridaInstrumentation ?? new FridaInstrumentationManager();
    const wasmArtifact = wasmArtifactModule.create(environment, options.wasmArtifact, analysisSettings.read);
    const apkSignature = apkSignatureModule.create(environment, options.apkSignature);
    const packetCapture = options.packetCapture ?? createPacketCaptureService(environment);
    const signalRecording = options.signalRecording ?? createSignalRecordingService(environment);
    const webRuntime = options.webRuntime ?? createWebRuntimeService();
    const apktool = options.apktoolAnalysis ??
        createApktoolResourceAnalysisProvider(environment);
    const jeb = options.jebAnalysis ?? createJebAnalysisProvider(environment);
    const adbDevice = options.adbDeviceAnalysis ?? createAdbDeviceAnalysisProvider(environment);
    const cutter = new CutterBridgeService(new CutterBridgeClient(providerEnvironment));
    let providerClose;
    const closeProviders = () => {
        providerClose ??= Promise.allSettled([
            android.close(),
            cutter.close(),
            fridaInstrumentation.closeAll(),
            wasmArtifact.close(),
            apkSignature.close(),
            packetCapture.close(),
            signalRecording.close(),
            apktool.close(),
            jeb.close(),
            adbDevice.close(),
            flutter.close(),
            pcap.close(),
            evmInterface.close(),
            sqliteDatabase.close(),
            binaryLayout.close(),
            recordedCrash.close(),
            webSourceLocation.close(),
            webModuleTrace.close(),
            desktopApplication.close(),
            goBinary.close(),
            rustBinary.close(),
            erlangBeam.close(),
            il2cppMetadata.close(),
            modelArtifact.close(),
            gpuCodeObjects.close(),
            peResources.close(),
            nativeExports.close(),
            devicetree.close(),
            elfNotes.close(),
            appleIps.close(),
            kernelModule.close(),
            peLoadConfig.close(),
            peCertificates.close(),
            peImports.close(),
            electronFuses.close(),
            pythonPyc.close(),
            webNetworkCapture.close(),
            javascriptRecovery.close?.() ?? Promise.resolve(),
            ...(options.optionalObservationProviderOwner === "caller"
                ? []
                : [
                    options.browserObservation?.close?.() ?? Promise.resolve(),
                    options.browserScenarioCapture?.close?.() ?? Promise.resolve(),
                    options.electronObservation?.close?.() ?? Promise.resolve(),
                    options.electronActiveObservation?.close?.() ?? Promise.resolve(),
                    options.javascriptRuntimeObservation?.close?.() ??
                        Promise.resolve(),
                ]),
            webRuntime.provider.close?.() ?? Promise.resolve(),
            artifactResources.close(),
            reverseEngineering.close(),
            firmwareAnalysis.close(),
            gdbSessions.closeAll(),
            rizinDebugSessions.closeAll(),
        ])
            .then((results) => {
            const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
            if (failures.length > 0)
                throw new AggregateError(failures, "REA provider cleanup failed");
        })
            .catch((cause) => {
            providerClose = undefined;
            throw cause;
        });
        return providerClose;
    };
    const availability = installSessionToolAvailability(session, options, environment, fridaInstrumentation);
    const toolLogger = logger.child({ layer: "server" });
    const { evidenceById, activeTarget, recordEvidence, recordEvidenceWithUnknown, } = createSessionRecorders(server, session);
    const analysisAdmission = withAdmittedAnalysis(source);
    const toolContext = {
        server,
        session,
        options: selectedOptions,
        environment,
        logger: toolLogger,
        evidenceById,
        activeTarget,
        recordEvidence,
        recordEvidenceWithUnknown,
        withAdmittedAnalysis: analysisAdmission,
        artifactResources,
        goBinary,
        rustBinary,
        erlangBeam,
        il2cppMetadata,
        peResources,
        nativeExports,
        devicetree,
        elfNotes,
        appleIps,
        kernelModule,
        peLoadConfig,
        peCertificates,
        peImports,
        electronFuses,
        pythonPyc,
        webNetworkCapture,
    };
    registerDesktopApplicationTool(server, desktopApplication, toolLogger, recordEvidence, analysisAdmission, evidenceById);
    registerModelArtifactTools(server, modelArtifact, toolLogger, recordEvidence, analysisAdmission, evidenceById);
    registerGpuCodeObjectsTools(server, gpuCodeObjects, toolLogger, recordEvidence, analysisAdmission, evidenceById);
    registerBinaryAnalysisTools(toolContext);
    registerReverseEngineeringTools(server, reverseEngineering, toolLogger, delivery, session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence), analysisAdmission, session === undefined
        ? undefined
        : () => session.invalidateSnapshotForExternalMutation(), session === undefined
        ? undefined
        : (path, signal, operation, rebindFailure) => session.withAdmittedExternalMutation(path, signal, operation, rebindFailure), evidenceById);
    registerFridaTools(server, fridaInstrumentation, toolLogger, delivery, session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence), evidenceById);
    registerCutterTools(server, cutter, toolLogger, delivery, session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence), session);
    registerGdbTools(server, gdbSessions, toolLogger, delivery, session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence), session, evidenceById);
    registerRizinDebugTools(server, rizinDebugSessions, toolLogger, delivery, session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence), session);
    const previousOnclose = server.server.onclose;
    server.server.onclose = () => {
        previousOnclose?.();
        void closeProviders().catch((cause) => {
            logger.error({ error: cause instanceof Error ? cause.message : String(cause) }, "Provider cleanup failed during server shutdown");
        });
    };
    const closeServer = server.close.bind(server);
    server.close = async () => {
        const results = await Promise.allSettled([closeServer(), closeProviders()]);
        for (const result of results)
            if (result.status === "rejected")
                throw result.reason;
    };
    registerCaptureTools(server, packetCapture, toolLogger, recordEvidence, analysisAdmission);
    registerSignalTools(server, signalRecording, toolLogger, recordEvidence, analysisAdmission);
    registerConfiguredAnalysisTools(toolContext, android, wasmArtifact, apkSignature, evmInterface, jeb, firmwareAnalysis, webRuntime);
    registerAdbTools(server, new AdbDeviceAnalysisService(adbDevice), toolLogger, recordEvidence, analysisAdmission);
    registerPcapTools(server, new PcapAnalysisService(pcap), toolLogger, recordEvidence, analysisAdmission, evidenceById);
    registerFlutterTools(server, new FlutterBuildAnalysisService(flutter), toolLogger, recordEvidence, analysisAdmission, evidenceById);
    registerApktoolTools(server, new ApktoolResourceAnalysisService(apktool), toolLogger, recordEvidence, analysisAdmission);
    registerObservationTools(toolContext);
    registerGuidedPrompts(server, analysis, session);
    if (session !== undefined) {
        registerSessionTools(server, session, toolLogger, {
            ...selectedOptions,
            artifactResources,
            ...(availability === undefined
                ? {}
                : { availabilityPolicy: availability.policy }),
            ...(availability?.evmLimiterAvailability === undefined
                ? {}
                : { evmLimiterAvailability: availability.evmLimiterAvailability }),
            androidAnalysisAvailability: (signal) => android.inspectAvailability(signal),
            adbAnalysisAvailability: (signal) => adbDevice.inspectAvailability(signal),
            apktoolAnalysisAvailability: (signal) => apktool.inspectAvailability(signal),
            jebAnalysisAvailability: (signal) => jeb.inspectAvailability(signal),
            startedAt,
        });
    }
    return server;
};
const selectToolResultDelivery = (environment, selected) => {
    if (selected !== undefined)
        return selected;
    const configured = parseMcpResponseBudget(environment.REA_MCP_MAX_RESPONSE_BYTES);
    if (!configured.ok)
        throw configured.error;
    return createToolResultDelivery(configured.value);
};
const outputSchemasOmitted = (environment) => {
    const configured = parseMcpOutputSchemaProfile(environment.REA_MCP_OUTPUT_SCHEMA_PROFILE);
    if (!configured.ok)
        throw configured.error;
    return configured.value === "off";
};
const selectCompactInputSchemaPresentation = (environment) => {
    const configured = parseMcpInputSchemaProfile(environment.REA_MCP_INPUT_SCHEMA_PROFILE);
    if (!configured.ok)
        throw configured.error;
    return compactPresentationForMcpInputSchemaProfile(configured.value);
};
const registerConfiguredAnalysisTools = ({ server, options, environment, logger: toolLogger, evidenceById, recordEvidence, withAdmittedAnalysis, goBinary, rustBinary, erlangBeam, il2cppMetadata, peResources, nativeExports, devicetree, elfNotes, appleIps, kernelModule, peLoadConfig, peCertificates, peImports, pythonPyc, webNetworkCapture, artifactResources, }, android, wasmArtifact, apkSignature, evmInterface, jeb, firmwareAnalysis, webRuntime) => {
    registerAndroidTools(server, new AndroidAnalysisService(android, recordEvidence), toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerJebTools(server, new JebAnalysisService(jeb), toolLogger, recordEvidence, withAdmittedAnalysis);
    registerBinaryDiagnosticsTools(server, options.binaryLayout ?? createBinaryLayoutService(environment), createByteEntropyService(artifactResources), toolLogger, recordEvidence, evidenceById, withAdmittedAnalysis);
    registerAnalysisViewTool(server, toolLogger, evidenceById, recordEvidence, withAdmittedAnalysis, artifactResources);
    registerPeResourcesTool(server, peResources, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerNativeExportsTool(server, nativeExports, toolLogger, recordEvidence, evidenceById, withAdmittedAnalysis);
    registerDevicetreeTool(server, devicetree, toolLogger, recordEvidence, evidenceById, withAdmittedAnalysis);
    registerElfNotesTool(server, elfNotes, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerAppleIpsTool(server, appleIps, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerKernelModuleTool(server, kernelModule, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerPeLoadConfigTool(server, peLoadConfig, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerPeCertificatesTool(server, peCertificates, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerPeImportsTool(server, peImports, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerGoTools(server, goBinary, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerIl2cppTools(server, il2cppMetadata, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerRustTools(server, rustBinary, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerPythonPycTool(server, pythonPyc, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerErlangTools(server, erlangBeam, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerWasmTools(server, wasmArtifact, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerApkSignatureTools(server, apkSignature, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerEvmTools(server, evmInterface, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerSqliteTools(server, options.sqliteDatabase ?? createSqliteDatabaseService(environment), toolLogger, recordEvidence, withAdmittedAnalysis);
    registerRecordedCrashTools(server, options.recordedCrash ?? createRecordedCrashService(environment), toolLogger, recordEvidence, withAdmittedAnalysis);
    registerFirmwareTools(server, firmwareAnalysis, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerWebModuleTool(server, options.webModuleTrace ?? createWebModuleTraceService(environment), toolLogger, recordEvidence, withAdmittedAnalysis);
    registerWebSourceLocationTool(server, options.webSourceLocation ?? createWebSourceLocationService(environment), toolLogger, recordEvidence, withAdmittedAnalysis);
    registerWebRuntimeTools(server, webRuntime, toolLogger, recordEvidence, withAdmittedAnalysis);
    registerWebNetworkCaptureTool(server, webNetworkCapture, toolLogger, recordEvidence, withAdmittedAnalysis, evidenceById);
    registerJavaScriptRecoveryTool(server, new JavaScriptRecoveryService(options.javascriptRecovery ??
        createJavaScriptRecoveryProvider(environment)), toolLogger, recordEvidence, withAdmittedAnalysis);
};
const createSessionRecorders = (server, session) => ({
    evidenceById: session === undefined
        ? undefined
        : session.evidenceForAnalysis.bind(session),
    activeTarget: session === undefined ? undefined : () => session.activeTarget(),
    recordEvidence: session === undefined
        ? undefined
        : (evidence) => session.recordEvidence(evidence),
    recordEvidenceWithUnknown: session === undefined
        ? undefined
        : (evidence, input) => session.recordEvidenceWithUnknown(evidence, input),
});
const registerBinaryAnalysisTools = ({ server, session, logger, activeTarget, recordEvidence, recordEvidenceWithUnknown, evidenceById, withAdmittedAnalysis, }) => {
    const recordUnknown = session === undefined
        ? undefined
        : (input) => session.recordUnknown(input);
    const analysisOptions = {
        logger,
        activeTarget,
        recordEvidence,
        recordUnknown,
        evidenceById,
        withAdmittedAnalysis,
    };
    registerOfficialTools(server, analysisOptions);
    registerEnhancedTools(server, {
        ...analysisOptions,
        analysisProfile: session === undefined
            ? undefined
            : (operation) => session.analysisProfile() ?? session.analysisProfile(operation),
        allowsSnapshotReplay: session === undefined
            ? undefined
            : (operation) => session.allowsSnapshotReplay(operation),
        recordWorkflowSnapshot: session === undefined
            ? undefined
            : (input) => session.recordWorkflowSnapshot(input),
    });
    const evidenceOptions = {
        logger,
        activeTarget,
        recordEvidence,
        withAdmittedAnalysis,
    };
    registerNativeTools(server, { ...evidenceOptions, evidenceById });
    registerArtifactTools(server, { ...evidenceOptions, evidenceById });
    registerManagedTools(server, { ...evidenceOptions, evidenceById });
    if (session !== undefined)
        registerManagedWorkflowTools(server, {
            logger,
            recordEvidence,
            recordEvidenceWithUnknown,
            session,
            withAdmittedAnalysis,
        });
};
const registerObservationTools = ({ electronFuses, evidenceById, server, options, logger, recordEvidence, recordEvidenceWithUnknown, withAdmittedAnalysis, artifactResources, environment, }) => {
    const common = { logger, recordEvidence, withAdmittedAnalysis };
    registerWebScriptTool(server, { ...common, artifactResources });
    registerBrowserTools(server, {
        ...common,
        evidenceById,
        browser: options.browserObservation,
        loadFailure: options.optionalProviderLoadFailures?.browserObservation,
    });
    registerBrowserScenarioTool(server, {
        ...common,
        provider: options.browserScenarioCapture,
        loadFailure: options.optionalProviderLoadFailures?.browserScenarioCapture,
    });
    registerElectronTools(server, {
        ...common,
        artifactResources,
        environment,
        evidenceById,
        electron: options.electronObservation,
        electronActive: options.electronActiveObservation,
        electronFuses,
        observationLoadFailure: options.optionalProviderLoadFailures?.electronObservation,
        activeLoadFailure: options.optionalProviderLoadFailures?.electronActiveObservation,
    });
    registerJavaScriptRuntimeObservationTools(server, {
        ...common,
        runtime: options.javascriptRuntimeObservation,
        loadFailure: options.optionalProviderLoadFailures?.javascriptRuntimeObservation,
    });
    registerApplicationTools(server, {
        artifactResources,
        evidenceById,
        logger,
        recordEvidence,
        recordEvidenceWithUnknown,
        withAdmittedAnalysis,
    });
};
