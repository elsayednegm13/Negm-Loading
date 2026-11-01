import { runtimeAnalysisConfig } from "../config/runtimeAnalysisSettings.js";
import { isAppleDispatchMetadataTarget } from "../domain/native/objcSwiftMetadata.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { HopperProvider } from "../hopper/HopperProvider.js";
import { GhidraProvider } from "../ghidra/GhidraProvider.js";
import { IdaProvider } from "../ida/IdaProvider.js";
import { KunaProvider } from "../kuna/KunaProvider.js";
import { auxiliaryAnalysisProviderDeclarations } from "./auxiliaryAnalysisProviders.js";
import { AnalysisProviderRegistry } from "../application/binary/AnalysisProviderRegistry.js";
import { composeBinarySession } from "../application/binary/BinarySessionComposition.js";
import { LazyAnalysisProvider } from "../application/binary/LazyAnalysisProvider.js";
import { ManagedStaticProvider } from "../dotnet/ManagedStaticProvider.js";
import { BUNDLE_ARTIFACT_RESOURCE_OPERATIONS, BUNDLE_NATIVE_RESOURCE_OPERATIONS, combineBundleResourceClients, } from "../application/binary/BundleResourceSession.js";
/**
 * Compose the target-switching runtime shared directly by CLI and MCP adapters.
 * This is the sole production wiring point, so both adapters share identical
 * provider selection, profile, lifecycle, and Evidence semantics.
 */
export const createBinarySession = (config, logger, selectedEnvironment, settings) => composeDeepBinarySession(runtimeAnalysisConfig(config, settings), logger, selectedEnvironment, undefined, settings);
/** Prefer byte-backed dispatch inspection while retaining deep symbol fallback. */
export const createNativeDispatchBinarySession = (config, logger, selectedEnvironment) => composeDeepBinarySession(config, logger, selectedEnvironment, "inspect_native_dispatch_metadata");
const composeDeepBinarySession = (config, logger, selectedEnvironment, inspection, settings) => {
    const environment = snapshotEnvironment(selectedEnvironment);
    const hopper = new HopperProvider(config, logger, environment);
    const ghidra = new GhidraProvider(config, logger, environment);
    const ida = new IdaProvider(config, environment);
    const kuna = new KunaProvider(environment, {
        regexMatchingDeadline: config.regexMatchingDeadline,
        regexWorkerHeapRequest: config.regexWorkerHeapRequest,
    });
    const auxiliaryDeclarations = auxiliaryAnalysisProviderDeclarations(environment, process.platform, settings);
    const nativeInspectionAvailable = inspection !== undefined &&
        auxiliaryDeclarations.some(({ capabilities }) => capabilities.some(({ operation, available }) => operation === inspection && available));
    return composeBinarySession(new AnalysisProviderRegistry([hopper, ghidra, ida, kuna], config.analysisProvider, nativeInspectionAvailable ? isAppleDispatchMetadataTarget : undefined), auxiliaryDeclarations.map((declaration) => new LazyAnalysisProvider(declaration)), createBundleResourceFactory(environment, process.platform, settings));
};
const createBundleResourceFactory = (environment, platform, settings) => {
    return {
        createClient: async (root) => {
            const [{ ArtifactProvider }, { NativeMacOSProvider }] = await Promise.all([
                import("../artifacts/ArtifactProvider.js"),
                import("../native/NativeMacOSProvider.js"),
            ]);
            const artifact = new ArtifactProvider(environment, platform, settings);
            const native = new NativeMacOSProvider(environment, undefined, platform);
            const capabilities = [
                ...artifact
                    .capabilities()
                    .filter(({ operation }) => BUNDLE_ARTIFACT_RESOURCE_OPERATIONS.has(operation)),
                ...native
                    .capabilities()
                    .filter(({ operation }) => BUNDLE_NATIVE_RESOURCE_OPERATIONS.has(operation)),
            ];
            return {
                client: combineBundleResourceClients(artifact.createBundleResourceClient(root), native.createBundleResourceClient(root)),
                capabilities,
            };
        },
    };
};
/** Compose an execution-free managed session without native provider selection. */
export const createManagedBinarySession = () => composeBinarySession(new AnalysisProviderRegistry([]), [
    new ManagedStaticProvider(),
]);
/** Compose the artifact operations without candidates for deep analysis engines. */
export const createArtifactBinarySession = (selectedEnvironment, platform = process.platform) => import("../artifacts/ArtifactProvider.js").then(({ ArtifactProvider }) => composeBinarySession(new AnalysisProviderRegistry([]), [
    new ArtifactProvider(snapshotEnvironment(selectedEnvironment, platform), platform),
], createBundleResourceFactory(snapshotEnvironment(selectedEnvironment, platform), platform)));
/** Compose native inspection utilities without candidates for deep analysis. */
export const createNativeBinarySession = (selectedEnvironment, platform = process.platform) => import("../native/NativeMacOSProvider.js").then(({ NativeMacOSProvider }) => composeBinarySession(new AnalysisProviderRegistry([]), [
    new NativeMacOSProvider(snapshotEnvironment(selectedEnvironment, platform), undefined, platform),
], createBundleResourceFactory(snapshotEnvironment(selectedEnvironment, platform), platform)));
