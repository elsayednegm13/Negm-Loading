import { runtimeAsarHeaderAdmission } from "../config/runtimeAnalysisSettings.js";
import { artifactTargetRefusal } from "../domain/apple/artifactTargetApplicability.js";
import { bindArtifactFileCleanup } from "./ArtifactFileOperation.js";
import { translateArtifactFailure } from "./ArtifactOperationFailure.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { createAnalysisExecution, } from "../application/AnalysisProvider.js";
import { inspectBundleKeyedArchive } from "./apple/KeyedArchiveReader.js";
import { traceDylibResolution } from "./apple/DylibResolutionReader.js";
import { basename, dirname } from "node:path";
import { inventoryArtifact } from "./inventory/ArtifactInventory.js";
import { extractArtifact } from "./extraction/ArtifactExtraction.js";
import { analyzeInterfaceBuilderBundle } from "./apple/InterfaceBuilderAnalysis.js";
import { analyzeAppleAssetCatalogs } from "./apple/AppleAssetCatalogAnalysis.js";
import { ARTIFACT_ANALYSIS_OPERATIONS, artifactInventoryInputSchema, artifactExtractionExecutionSchema, } from "../contracts/artifactToolContracts.js";
import { AnalysisCapabilityUnavailableError, AnalysisInputError, AnalysisUnsupportedTargetError, } from "../domain/analysisErrorCore.js";
import { interfaceBuilderLimitsSchema } from "../domain/apple/interfaceBuilderGraph.js";
import { err, ok } from "../domain/result.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
import { ArtifactResourceScope } from "./ArtifactResourceScope.js";
import { artifactCapabilities } from "./ArtifactProviderMetadata.js";
import { ARTIFACT_GRAPH_PROVIDER } from "../domain/investigationProviders.js";
import { createEvidence } from "../domain/evidence.js";
import { freezeJsonSnapshot } from "../domain/immutableJson.js";
import { artifactInspectionSources, createArtifactInspection, } from "../domain/artifactInspection.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { BUNDLE_ARTIFACT_RESOURCE_OPERATIONS } from "../application/binary/BundleResourceSession.js";
/** Read-only inventory and exclusively owned extraction provider. */
export class ArtifactProvider {
    settings;
    #capabilities;
    #platform;
    environment;
    constructor(environment, platform = process.platform, settings) {
        this.settings = settings;
        this.environment = snapshotEnvironment(environment, platform);
        this.#capabilities = artifactCapabilities(platform);
        this.#platform = platform;
    }
    identity() {
        return ARTIFACT_GRAPH_PROVIDER;
    }
    capabilities() {
        return this.#capabilities;
    }
    createClient(target) {
        return new ArtifactClient(target, this.environment, this.#platform, this.settings);
    }
    createBundleResourceClient(root) {
        return new BundleResourceArtifactClient(root, this.environment, this.#platform);
    }
}
const serializedResourceRoot = (root) => ({
    caller_path: root.callerPath,
    canonical_path: root.canonicalPath,
    info_plist_path: root.infoPlistPath,
    layout: root.layout,
    executable_sha256: root.executableSha256,
});
class BundleResourceArtifactClient {
    root;
    environment;
    platform;
    #resourceScope = new ArtifactResourceScope();
    constructor(root, environment, platform) {
        this.root = root;
        this.environment = environment;
        this.platform = platform;
    }
    async execute(operation, parameters, options) {
        if (operation === "health")
            return ok(createAnalysisExecution(null, ARTIFACT_GRAPH_PROVIDER));
        if (!BUNDLE_ARTIFACT_RESOURCE_OPERATIONS.has(operation))
            return err(new AnalysisCapabilityUnavailableError(ARTIFACT_GRAPH_PROVIDER.id, operation, "The app resource reader supports only plist, Interface Builder, asset catalog, and keyed archive inspection."));
        try {
            const resourceRoot = serializedResourceRoot(this.root);
            const result = operation === "decode_interface_builder"
                ? await analyzeInterfaceBuilderBundle({
                    bundlePath: this.root.canonicalPath,
                    targetSha256: null,
                    resourceRoot,
                    resources: this.#resourceScope,
                    limits: interfaceBuilderLimitsSchema.parse(parameters),
                    ...(options?.signal === undefined
                        ? {}
                        : { signal: options.signal }),
                })
                : operation === "inspect_keyed_archive"
                    ? await inspectBundleKeyedArchive({
                        bundlePath: this.root.canonicalPath,
                        targetSha256: null,
                        resourceRoot,
                        parameters,
                        platform: this.platform,
                        resources: this.#resourceScope,
                        ...(options?.signal === undefined
                            ? {}
                            : { signal: options.signal }),
                    })
                    : operation === "inspect_asset_catalog"
                        ? await analyzeAppleAssetCatalogs({
                            bundlePath: this.root.canonicalPath,
                            targetSha256: null,
                            resourceRoot,
                            environment: this.environment,
                            resources: this.#resourceScope,
                            page: parameters,
                            ...(options?.signal === undefined
                                ? {}
                                : { signal: options.signal }),
                        })
                        : (() => {
                            throw new AnalysisCapabilityUnavailableError(ARTIFACT_GRAPH_PROVIDER.id, operation, "Property list inspection requires a platform-native reader.");
                        })();
            return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
                limitations: "limitations" in result ? result.limitations : [],
            }));
        }
        catch (cause) {
            return err(translateArtifactFailure(operation, cause));
        }
    }
    close() {
        return this.#resourceScope.close().then(() => ok(null), (cause) => err(new ProviderCleanupError(ARTIFACT_GRAPH_PROVIDER.id, ["app bundle resource reader"], { reason: cause instanceof Error ? cause.message : String(cause) }, { cause, operation: "close_binary" })));
    }
}
class ArtifactClient {
    target;
    environment;
    platform;
    settings;
    #resourceScope = new ArtifactResourceScope();
    constructor(target, environment, platform, settings) {
        this.target = target;
        this.environment = environment;
        this.platform = platform;
        this.settings = settings;
    }
    async execute(operation, parameters, options) {
        if (operation === "health")
            return ok(createAnalysisExecution(null, ARTIFACT_GRAPH_PROVIDER));
        if (!isArtifactOperation(operation))
            return err(new AnalysisCapabilityUnavailableError(ARTIFACT_GRAPH_PROVIDER.id, operation, "Operation is not implemented by artifact graph provider."));
        try {
            const targetRefusal = artifactTargetRefusal(operation, this.target);
            if (targetRefusal !== undefined)
                throw this.unsupportedTarget(operation, targetRefusal.reason);
            if (operation === "inspect_artifact") {
                const inspected = await this.inspectArtifact(parameters, options);
                return inspected;
            }
            if (operation === "decode_interface_builder") {
                const limits = interfaceBuilderLimitsSchema.parse(parameters);
                const result = await analyzeInterfaceBuilderBundle({
                    bundlePath: this.target.sourcePath ?? this.target.path,
                    targetSha256: this.target.sha256,
                    limits,
                    resources: this.#resourceScope,
                    ...(options?.signal === undefined ? {} : { signal: options.signal }),
                });
                return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
                    limitations: result.limitations,
                    locations: result.documents.map(({ relative_path: path }) => ({
                        kind: "artifact-path",
                        path,
                    })),
                }));
            }
            if (operation === "inspect_keyed_archive") {
                const standalone = this.target.kind === "artifact" && this.target.format === "plist";
                if (standalone &&
                    parameters.path !== undefined &&
                    parameters.path !== "." &&
                    parameters.path !== basename(this.target.path))
                    throw new AnalysisInputError(operation, undefined, [
                        {
                            path: ["path"],
                            reason: "invalid_value",
                            message: "For an active plist, path must select that archive (omit path or use its basename).",
                            expected: basename(this.target.path),
                        },
                    ]);
                const bundlePath = standalone
                    ? dirname(this.target.path)
                    : (this.target.sourcePath ?? this.target.path);
                const result = await inspectBundleKeyedArchive({
                    bundlePath,
                    targetSha256: this.target.sha256,
                    parameters: standalone
                        ? { ...parameters, path: basename(this.target.path) }
                        : parameters,
                    platform: this.platform,
                    resources: this.#resourceScope,
                    ...(options?.signal === undefined ? {} : { signal: options.signal }),
                });
                if (standalone && result.archive_sha256 !== this.target.sha256)
                    throw new ArtifactReaderFailure("integrity", `Active archive digest changed: expected ${this.target.sha256}, observed ${result.archive_sha256}`);
                return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
                    limitations: result.limitations,
                    locations: [{ kind: "artifact-path", path: result.archive_path }],
                }));
            }
            if (operation === "inspect_asset_catalog") {
                return await this.inspectAssetCatalog(parameters, options);
            }
            if (operation === "trace_dylib_resolution")
                return await this.traceDylibResolution(parameters, options);
            if (operation === "extract_artifact") {
                const parsed = artifactExtractionExecutionSchema.parse(parameters);
                const result = await extractArtifact({
                    inputPath: this.target.sourcePath ?? this.target.path,
                    inputFormat: this.target.format,
                    outputRoot: parsed.output_root,
                    environment: this.environment,
                    asarHeaderAdmission: runtimeAsarHeaderAdmission(this.environment, this.settings),
                    integrityPolicy: parsed.integrity_policy,
                    resourceScope: this.#resourceScope,
                }, options?.signal);
                return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
                    rawResult: null,
                    limitations: result.limitations,
                    subject: subjectFor(this.target.sourcePath ?? this.target.path, result.manifest),
                    // Each extracted file's path is already in artifacts.
                    locations: [],
                }));
            }
            const parsed = artifactInventoryInputSchema.parse(parameters);
            const result = await this.inventory(parsed, options);
            return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
                rawResult: null,
                limitations: result.limitations,
                subject: subjectFor(this.target.sourcePath ?? this.target.path, result.manifest),
                // Each occurrence's logical path is already in the result.
                locations: [],
            }));
        }
        catch (cause) {
            return err(translateArtifactFailure(operation, cause));
        }
    }
    close() {
        return this.#resourceScope.close().then(() => ok(null), (cause) => {
            const failure = cause instanceof ArtifactReaderFailure ? cause : undefined;
            const error = new ProviderCleanupError(ARTIFACT_GRAPH_PROVIDER.id, failure?.cleanup?.resources ?? ["artifact resources"], {
                reason: failure?.cleanup?.reason ??
                    (cause instanceof Error ? cause.message : String(cause)),
            }, { cause, operation: "close_binary" });
            bindArtifactFileCleanup(cause, error);
            return err(error);
        });
    }
    /** The active target's kind is outside this operation's supported targets. */
    unsupportedTarget(operation, reason) {
        return new AnalysisUnsupportedTargetError(operation, this.target.sourcePath ?? this.target.path, reason);
    }
    async inspectAssetCatalog(parameters, options) {
        const bundlePath = this.target.sourcePath ?? this.target.path;
        const result = await analyzeAppleAssetCatalogs({
            environment: this.environment,
            bundlePath,
            resources: this.#resourceScope,
            targetSha256: this.target.sha256,
            page: parameters,
            ...(options?.signal === undefined ? {} : { signal: options.signal }),
        });
        return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
            limitations: result.limitations,
            locations: result.catalogs.map(({ path }) => ({
                kind: "artifact-path",
                path,
            })),
        }));
    }
    async traceDylibResolution(parameters, options) {
        // Only a target opened from an app bundle directory carries its Info.plist;
        // a regular file whose name ends in .app is a standalone image.
        const bundle = this.target.bundleInfoPlist === undefined
            ? undefined
            : this.target.sourcePath;
        const result = await traceDylibResolution({
            rootPath: bundle ?? dirname(this.target.path),
            targetPath: this.target.path,
            targetSha256: this.target.sha256,
            enumerateRoots: bundle !== undefined,
            parameters,
            resourceScope: this.#resourceScope,
            ...(options?.signal === undefined ? {} : { signal: options.signal }),
        });
        return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
            limitations: result.limitations,
            locations: result.images.map(({ path }) => ({
                kind: "artifact-path",
                path,
            })),
        }));
    }
    async inspectArtifact(parameters, options) {
        const parsed = artifactInventoryInputSchema.parse(parameters);
        const inventoryParameters = {
            integrity_policy: parsed.integrity_policy,
        };
        await options?.progress?.report({
            phase: "inspect_artifact.inventory",
            completed: 0,
            total: 1,
            message: "inventory substep started",
        });
        // The freshly parsed inventory is exclusively owned here. Sealing it lets
        // the nested Evidence share it instead of cloning and re-digesting it.
        const inventory = freezeJsonSnapshot(await this.inventory(inventoryParameters, options));
        const subject = subjectFor(this.target.sourcePath ?? this.target.path, inventory.manifest);
        const inventoryEvidence = createEvidence(subject, ARTIFACT_GRAPH_PROVIDER, {
            operation: "inventory_artifact",
            parameters: inventoryParameters,
            result: inventory,
            rawResult: null,
            limitations: inventory.limitations,
            // The nested inventory already names every occurrence's logical path.
            locations: [],
        });
        // The returned execution and its Evidence then reuse this owned report.
        const result = freezeJsonSnapshot(createArtifactInspection(inventoryEvidence));
        await options?.progress?.report({
            phase: "inspect_artifact.inventory",
            completed: 1,
            total: 1,
            message: "inventory substep completed",
        });
        return ok(createAnalysisExecution(result, ARTIFACT_GRAPH_PROVIDER, {
            rawResult: null,
            limitations: result.limitations,
            sourceEvidence: artifactInspectionSources(result),
            subject,
            locations: [],
        }));
    }
    inventory(parsed, options) {
        return inventoryArtifact(this.target.sourcePath ?? this.target.path, {
            resourceScope: this.#resourceScope,
            environment: this.environment,
            asarHeaderAdmission: runtimeAsarHeaderAdmission(this.environment, this.settings),
            ...(options?.signal === undefined ? {} : { signal: options.signal }),
            integrity: { mode: parsed.integrity_policy },
        });
    }
}
const isArtifactOperation = (operation) => ARTIFACT_ANALYSIS_OPERATIONS.includes(operation);
const subjectFor = (path, manifest) => ({
    path,
    sha256: manifest.root_sha256,
    format: manifest.root_format,
});
