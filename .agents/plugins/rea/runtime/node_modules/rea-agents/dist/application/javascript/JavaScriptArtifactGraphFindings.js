import { createHash } from "node:crypto";
import { posix } from "node:path";
import { compactStringIdentityKey } from "../../domain/compactStringIdentity.js";
import { addStaticInferenceEdge, applicationRootPath, applicationContainerIdentity, addApplicationRootCandidate, artifactLocalIdentity, chunkLookupKey, createElectronRoleNode, javascriptAnalysisCoverage, linkElectronRoleToAsset, moduleLookupKey, selfReferenceOmissions, sourceNodeFor, } from "./JavaScriptArtifactGraphContext.js";
import { astObservationEvidence, staticInferenceEvidence, } from "./JavaScriptArtifactGraphEvidence.js";
import { artifactPathResolutionProperties, resolveArtifactPathByContext, } from "./JavaScriptArtifactPathResolution.js";
import { moduleResolutionModeForJavaScriptReference, isJsonModuleTarget, } from "../../domain/javascript/javascriptModuleResolutionMode.js";
/** Project imports, workers, roles, endpoints, storage, and source-map links. */
export function* addJavaScriptStaticFindingsSteps(context) {
    const omissions = {
        selfReferences: 0,
        imports: new Map(),
    };
    for (const analyzed of context.analysis.files) {
        yield;
        const { file, javascript } = analyzed;
        const asset = context.assetNodes.get(file.path);
        if (javascript === null || asset === undefined)
            continue;
        const coverage = javascriptAnalysisCoverage(javascript);
        for (const value of javascript.references)
            addReference(context, { file, asset, value, coverage }, omissions);
        for (const value of javascript.endpoints)
            addEndpoint(context, { file, asset, value, coverage });
        for (const value of javascript.storage)
            addStorage(context, { file, asset, value, coverage });
        for (const value of javascript.source_map_urls)
            addSourceMapEdge(context, { file, asset, value, coverage });
    }
    yield* propagateApplicationOwners(context, omissions.imports);
    const possible = new Set();
    for (const roots of context.applicationPossibleRootsByContainer.values())
        for (const root of roots)
            addApplicationRootCandidate(possible, root);
    for (const gaps of context.applicationModuleGapSources.values()) {
        for (const gap of gaps) {
            yield;
            for (const root of context.applicationRootsBySource.get(gap) ?? [])
                addApplicationRootCandidate(possible, root);
        }
    }
    // An unknown loader may cross an inventoried archive boundary in either
    // direction. Retain possible owners in every container it could reach.
    for (const file of context.fileSet.files) {
        yield;
        context.applicationPossibleRootsByContainer.set(applicationContainerIdentity(context.fileSet, file), possible);
    }
    const changedRoots = changedApplicationRoots(context);
    for (const { file, javascript } of context.analysis.files) {
        yield;
        const asset = context.assetNodes.get(file.path);
        if (javascript === null || asset === undefined)
            continue;
        const coverage = javascriptAnalysisCoverage(javascript);
        for (const value of javascript.role_paths)
            addDiscoveredRole(context, { file, asset, value, coverage }, changedRoots);
    }
    return selfReferenceOmissions(omissions.selfReferences, ["static reference", "static references"], "the referencing module");
}
/** A setter changes process-wide runtime state, not package ownership. */
const changedApplicationRoots = (context) => {
    const roots = new Set();
    // An unchecked load can execute a setter even when the imported source has
    // no retained AST. Package ownership alone does not prove its runtime path
    // unchanged. Only launch owners that can reach the gap are affected; an
    // unrelated unselected source is not evidence of a running setter.
    for (const sources of context.applicationModuleGapSources.values()) {
        for (const source of sources) {
            const owners = context.applicationRootsBySource.get(source);
            if (owners === undefined)
                continue;
            if (owners.size >= 2)
                return null;
            for (const root of owners)
                roots.add(root);
        }
    }
    for (const { file, javascript } of context.analysis.files) {
        if (!javascript?.electron.app_path_changes?.length)
            continue;
        const owners = context.applicationRootsBySource.get(file.path);
        // A setter whose launching application is unknown cannot establish an
        // unchanged root for any package-based fallback.
        if (owners === undefined)
            return null;
        // Owner sets stop at two distinct roots once uniqueness is disproven.
        // They cannot enumerate every application affected by a shared setter.
        if (owners.size >= 2)
            return null;
        for (const root of owners)
            roots.add(root);
        const possibleOwners = context.applicationPossibleRootsByContainer.get(applicationContainerIdentity(context.fileSet, file));
        // An unchecked loader can execute this setter in another application's
        // process even when only one entrypoint has a proven import of this source.
        // Possible-owner sets have the same two-root saturation as proven owners.
        if (possibleOwners !== undefined) {
            if (possibleOwners.size >= 2)
                return null;
            for (const root of possibleOwners)
                roots.add(root);
        }
    }
    return roots;
};
/** Carry every entrypoint owner through already-resolved imports before roles.
 * Sets and change-driven traversal retain competition and terminate on cycles.
 */
function* propagateApplicationOwners(context, imports) {
    const pending = [...context.applicationRootsBySource.keys()];
    while (pending.length > 0) {
        yield;
        const source = pending.pop();
        if (source === undefined)
            break;
        const roots = context.applicationRootsBySource.get(source);
        if (roots === undefined)
            continue;
        for (const target of imports.get(source) ?? []) {
            yield;
            const candidates = context.applicationRootsBySource.get(target) ?? new Set();
            const previousSize = candidates.size;
            for (const root of roots)
                addApplicationRootCandidate(candidates, root);
            if (candidates.size === previousSize)
                continue;
            context.applicationRootsBySource.set(target, candidates);
            pending.push(target);
        }
    }
}
const addReference = (context, input, omissions) => {
    const source = sourceNodeFor(context, input.file.path, input.value.module_key, input.value.module_runtime) ?? input.asset;
    const resolved = input.value.specifier === null
        ? null
        : resolveReference(context, input.file.path, input.value, input.coverage);
    if (input.value.operation === "load" &&
        (input.value.kind === "static-import" ||
            input.value.kind === "dynamic-import" ||
            input.value.kind === "require") &&
        (input.value.specifier === null ||
            resolved === null ||
            resolved.targetImportsUnexamined === true)) {
        const container = applicationContainerIdentity(context.fileSet, input.file);
        const gaps = context.applicationModuleGapSources.get(container) ?? new Set();
        gaps.add(input.file.path);
        context.applicationModuleGapSources.set(container, gaps);
    }
    if (resolved !== null &&
        resolved.path !== null &&
        resolved.file !== null &&
        input.value.operation === "load" &&
        (input.value.kind === "static-import" ||
            input.value.kind === "dynamic-import" ||
            input.value.kind === "require")) {
        const targets = omissions.imports.get(input.file.path) ?? new Set();
        targets.add(resolved.path);
        omissions.imports.set(input.file.path, targets);
    }
    if (input.value.kind === "worker" || input.value.kind === "service-worker") {
        const worker = context.accumulator.addNode({
            kind: input.value.kind === "worker" ? "worker" : "service-worker",
            identity: artifactLocalIdentity(input.file.sha256, input.value.kind, input.value.specifier ?? input.value.expression),
            observations: [
                {
                    label: input.value.specifier,
                    properties: {
                        declared_specifier: input.value.specifier,
                        expression: input.value.expression,
                        resolved_path: resolved?.path ?? null,
                        resolution_status: resolved?.resolution?.resolution_status ?? null,
                        ...artifactPathResolutionProperties(resolved?.resolution),
                    },
                    evidence: staticInferenceEvidence({
                        sha256: input.file.sha256,
                        path: input.file.path,
                        range: input.value.location,
                        operation: "discover-worker",
                        coverage: input.coverage,
                        limitations: resolved?.limitations ?? [],
                    }),
                },
            ],
        });
        addStaticInferenceEdge(context, {
            source,
            target: worker,
            file: input.file,
            range: input.value.location,
            coverage: input.coverage,
            relation: "loads",
            properties: {
                kind: input.value.kind,
                resolution_status: resolved?.resolution?.resolution_status ?? null,
                ...artifactPathResolutionProperties(resolved?.resolution),
            },
            limitations: resolved?.limitations ?? [],
        });
        if (resolved !== null && resolved.path !== null && resolved.node !== null)
            addStaticInferenceEdge(context, {
                source: worker,
                target: resolved.node,
                file: input.file,
                range: input.value.location,
                coverage: input.coverage,
                relation: "maps_to",
                properties: { resolved_path: resolved.path },
                limitations: resolved.limitations,
            });
        return;
    }
    // A reference that resolves to its own source, such as a bundled module
    // requiring its own key, cannot become an edge: the application graph
    // forbids self-referential edges and one would fail the whole analysis.
    if (resolved?.node?.node_id === source.node_id) {
        omissions.selfReferences += 1;
        return;
    }
    const target = resolved?.node ??
        unresolvedReferenceNode(context, input.file, input.value, input.coverage);
    addStaticInferenceEdge(context, {
        source,
        target,
        file: input.file,
        range: input.value.location,
        coverage: input.coverage,
        relation: input.value.operation === "load" &&
            resolved?.file?.kind === "native-addon"
            ? "loads"
            : "imports",
        properties: {
            kind: input.value.kind,
            operation: input.value.operation,
            specifier: input.value.specifier,
            expression: input.value.expression,
            resolution_base_path: input.value.resolution_base_path ?? null,
            resolution_mode: input.value.kind === "static-import" ||
                input.value.kind === "dynamic-import" ||
                input.value.kind === "require"
                ? moduleResolutionModeForJavaScriptReference(input.file.path, input.value.kind)
                : null,
            resolved_path: resolved?.path ?? null,
            resolution_status: resolved?.resolution?.resolution_status ?? null,
            ...artifactPathResolutionProperties(resolved?.resolution),
        },
        ...(resolved === null ? {} : { limitations: resolved.limitations }),
    });
};
const addEndpoint = (context, input) => {
    const source = sourceNodeFor(context, input.file.path, input.value.module_key, input.value.module_runtime) ?? input.asset;
    const key = compactStringIdentityKey(input.value.value);
    const candidate = input.value.interpretation === "candidate";
    const partial = input.value.resolution === "partial";
    const candidateLimitation = input.value.kind === "route"
        ? "Only the property name suggests a route; the enclosing object has no router fields."
        : "The unbound method-like argument is only a candidate; its receiver does not establish a network call.";
    const partialLimitation = "The request target is not an exact literal; the endpoint value retains the unresolved source expression.";
    const label = `${input.value.kind} ${candidate ? "endpoint candidate" : "endpoint"}`;
    const node = context.accumulator.addNode({
        kind: "endpoint",
        identity: artifactLocalIdentity(input.file.sha256, input.value.kind, JSON.stringify([
            input.value.interpretation ?? "literal",
            ...(partial ? ["partial", input.value.location] : []),
            key,
        ])),
        observations: [
            {
                label: input.value.value.length <= label.length ? input.value.value : label,
                properties: {
                    endpoint_kind: input.value.kind,
                    value: input.value.value,
                    mechanism: input.value.mechanism,
                    ...(candidate ? { interpretation: input.value.interpretation } : {}),
                    ...(partial ? { resolution: input.value.resolution } : {}),
                },
                evidence: candidate
                    ? staticInferenceEvidence({
                        sha256: input.file.sha256,
                        path: input.file.path,
                        range: input.value.location,
                        operation: "classify-static-endpoint-candidate",
                        coverage: input.coverage,
                        confidence: "low",
                        limitations: [candidateLimitation],
                    })
                    : astObservationEvidence({
                        sha256: input.file.sha256,
                        path: input.file.path,
                        range: input.value.location,
                        operation: "discover-static-endpoint",
                        coverage: input.coverage,
                        ...(partial ? { limitations: [partialLimitation] } : {}),
                    }),
            },
        ],
    });
    addStaticInferenceEdge(context, {
        source,
        target: node,
        file: input.file,
        range: input.value.location,
        coverage: input.coverage,
        relation: input.value.kind === "route" ? "exposes" : "calls",
        properties: {
            mechanism: input.value.mechanism,
            ...(candidate ? { interpretation: input.value.interpretation } : {}),
            ...(partial ? { resolution: input.value.resolution } : {}),
        },
        ...(candidate
            ? {
                confidence: "low",
                limitations: [candidateLimitation],
            }
            : partial
                ? { limitations: [partialLimitation] }
                : {}),
    });
};
const addStorage = (context, input) => {
    const candidate = input.value.interpretation === "candidate";
    const limitation = "The constructor name is only a candidate; an unchanged SQLite module API origin is unproven.";
    const source = sourceNodeFor(context, input.file.path, input.value.module_key, input.value.module_runtime) ?? input.asset;
    const node = context.accumulator.addNode({
        kind: "storage",
        identity: artifactLocalIdentity(input.file.sha256, candidate ? `${input.value.kind}:candidate` : input.value.kind, input.value.name ?? input.value.mechanism),
        observations: [
            {
                label: input.value.name ?? input.value.kind,
                properties: {
                    storage_kind: input.value.kind,
                    name: input.value.name,
                    mechanism: input.value.mechanism,
                    ...(candidate ? { interpretation: "candidate" } : {}),
                },
                evidence: candidate
                    ? staticInferenceEvidence({
                        sha256: input.file.sha256,
                        path: input.file.path,
                        range: input.value.location,
                        operation: "classify-static-storage-candidate",
                        coverage: input.coverage,
                        confidence: "low",
                        limitations: [limitation],
                    })
                    : astObservationEvidence({
                        sha256: input.file.sha256,
                        path: input.file.path,
                        range: input.value.location,
                        operation: "discover-static-storage",
                        coverage: input.coverage,
                    }),
            },
        ],
    });
    addStaticInferenceEdge(context, {
        source,
        target: node,
        file: input.file,
        range: input.value.location,
        coverage: input.coverage,
        relation: "persists_to",
        properties: {
            mechanism: input.value.mechanism,
            ...(candidate ? { interpretation: "candidate" } : {}),
        },
        ...(candidate
            ? { confidence: "low", limitations: [limitation] }
            : {}),
    });
};
const addDiscoveredRole = (context, input, changedRoots) => {
    const root = applicationRootPath(context, input.file);
    const resolution = resolveArtifactPathByContext({
        declaredPath: input.value.path,
        sourcePath: input.file.path,
        context: input.value.resolution_context,
        files: context.filesByPath,
        jsonDocuments: context.analysis.jsonDocuments,
        directoryPaths: context.directoryPaths,
        unanalyzedFiles: context.unanalyzedFiles,
        ...(input.value.role === "preload"
            ? { runtimePathKind: "exact-file" }
            : input.value.role === "renderer" &&
                input.value.resolution_context === "filesystem-expression"
                ? {
                    // Raw loadFile literals belong to the application, not its caller.
                    runtimePathKind: "application-file",
                    applicationRootPath: changedRoots === null || (root !== null && changedRoots.has(root))
                        ? null
                        : root,
                    applicationRootIsProven: context.applicationRootsBySource.has(input.file.path),
                }
                : input.value.role === "renderer" &&
                    input.value.resolution_context === "module-specifier"
                    ? { runtimePathKind: "url-resource" }
                    : {}),
    });
    const role = createElectronRoleNode(context, {
        kind: input.value.role === "preload" ? "electron-preload" : "electron-renderer",
        anchor: input.file,
        resolution,
        mechanism: input.value.mechanism,
        range: input.value.location,
        coverage: input.coverage,
    });
    const source = sourceNodeFor(context, input.file.path, input.value.module_key, input.value.module_runtime) ?? input.asset;
    addStaticInferenceEdge(context, {
        source,
        target: role,
        file: input.file,
        range: input.value.location,
        coverage: input.coverage,
        relation: "loads",
        properties: { mechanism: input.value.mechanism },
    });
    linkElectronRoleToAsset(context, {
        role,
        anchor: input.file,
        resolution,
        range: input.value.location,
        coverage: input.coverage,
    });
};
const addSourceMapEdge = (context, input) => {
    const declaredUrlSha256 = createHash("sha256")
        .update(input.value.declared_url)
        .digest("hex");
    const resolution = resolveArtifactPathByContext({
        declaredPath: input.value.declared_url,
        sourcePath: input.file.path,
        context: "url-reference",
        files: context.filesByPath,
        jsonDocuments: context.analysis.jsonDocuments,
        directoryPaths: context.directoryPaths,
        unanalyzedFiles: context.unanalyzedFiles,
    });
    const resolvedPath = resolution.resolved_path;
    const resolvedFile = resolvedPath === null ? undefined : context.filesByPath.get(resolvedPath);
    const resolvedNode = resolvedPath === null ? undefined : context.fileNodes.get(resolvedPath);
    const isAvailable = resolvedFile?.kind === "source-map" && resolvedNode !== undefined;
    const limitations = isAvailable || resolution.limitations.length > 0
        ? resolution.limitations
        : [
            "The declared reference does not identify an available source-map projection.",
        ];
    const target = context.accumulator.addNode({
        kind: "source-map",
        identity: isAvailable && resolvedNode !== undefined
            ? resolvedNode.identity
            : artifactLocalIdentity(input.file.sha256, "unresolved-source-map", declaredUrlSha256),
        observations: [
            {
                label: "source map reference",
                properties: {
                    declared_url: input.value.declared_url,
                    declared_url_sha256: declaredUrlSha256,
                    resolved_path: resolvedPath,
                    resolution_status: resolution.resolution_status,
                    ...artifactPathResolutionProperties(resolution),
                    available: isAvailable,
                },
                evidence: staticInferenceEvidence({
                    sha256: input.file.sha256,
                    path: input.file.path,
                    range: input.value.location,
                    operation: "discover-source-map",
                    coverage: input.coverage,
                    confidence: "medium",
                    limitations,
                }),
            },
        ],
    });
    addStaticInferenceEdge(context, {
        source: input.asset,
        target,
        file: input.file,
        range: input.value.location,
        coverage: input.coverage,
        relation: "maps_to",
        limitations,
        properties: {
            declared_url_sha256: declaredUrlSha256,
            resolved_path: resolvedPath,
            resolution_status: resolution.resolution_status,
            ...artifactPathResolutionProperties(resolution),
        },
    });
};
const resolveReference = (context, sourcePath, reference, coverage) => {
    const specifier = reference.specifier;
    if (specifier === null)
        return null;
    const isWorker = reference.kind === "worker" || reference.kind === "service-worker";
    const resolutionSourcePath = reference.kind === "require" && reference.resolution_base_path !== undefined
        ? posix.normalize(posix.join(posix.dirname(sourcePath), reference.resolution_base_path))
        : sourcePath;
    const chunk = isWorker
        ? null
        : resolveBundlerChunkReference(context, sourcePath, reference);
    if (chunk !== null)
        return chunk;
    const module = isWorker || reference.module_runtime === undefined
        ? undefined
        : context.moduleNodes.get(moduleLookupKey(sourcePath, reference.module_runtime, specifier));
    if (module !== undefined) {
        const file = context.filesByPath.get(sourcePath);
        return file === undefined
            ? null
            : {
                path: `${sourcePath}#module:${specifier}`,
                file,
                node: module,
                limitations: [],
            };
    }
    // Worker scripts are URLs relative to the script, not module specifiers.
    const resolution = isWorker
        ? resolveArtifactPathByContext({
            declaredPath: specifier,
            sourcePath,
            context: "url-reference",
            files: context.filesByPath,
            jsonDocuments: context.analysis.jsonDocuments,
            directoryPaths: context.directoryPaths,
            unanalyzedFiles: context.unanalyzedFiles,
        })
        : resolveArtifactPathByContext({
            declaredPath: specifier,
            sourcePath: resolutionSourcePath,
            context: "module-specifier",
            files: context.filesByPath,
            jsonDocuments: context.analysis.jsonDocuments,
            directoryPaths: context.directoryPaths,
            unanalyzedFiles: context.unanalyzedFiles,
            ...("require" === reference.kind ||
                "static-import" === reference.kind ||
                "dynamic-import" === reference.kind
                ? {
                    moduleKind: moduleResolutionModeForJavaScriptReference(resolutionSourcePath, reference.kind),
                }
                : {}),
        });
    const path = resolution.resolved_path;
    const targetPath = path ?? resolution.candidate_path;
    const targetKind = targetPath === undefined
        ? undefined
        : (context.filesByPath.get(targetPath) ??
            context.unanalyzedFiles?.get(targetPath))?.kind;
    // Resolving bytes does not prove that the loader's module imports were read.
    // Only an exact JSON loader target can be inert without JavaScript analysis.
    const targetIsJson = targetPath !== undefined && isJsonModuleTarget(targetPath, targetKind);
    const targetImportsUnexamined = !targetIsJson &&
        (resolution.resolution_status === "unavailable" ||
            (path !== null &&
                !context.applicationModuleReferencesRetained.has(path)));
    if (path === null) {
        const source = context.filesByPath.get(sourcePath);
        return source === undefined
            ? null
            : {
                path: null,
                file: null,
                node: isWorker
                    ? null
                    : unresolvedReferenceNode(context, source, reference, coverage, resolution),
                limitations: resolution.limitations,
                ...(targetImportsUnexamined
                    ? { targetImportsUnexamined: true }
                    : {}),
                resolution,
            };
    }
    const file = context.filesByPath.get(path);
    const node = context.fileNodes.get(path);
    return file === undefined || node === undefined
        ? null
        : {
            path,
            file,
            node,
            limitations: resolution.limitations,
            ...(targetImportsUnexamined
                ? { targetImportsUnexamined: true }
                : {}),
            resolution,
        };
};
const resolveBundlerChunkReference = (context, sourcePath, reference) => {
    const key = reference.specifier?.startsWith("chunk:")
        ? reference.specifier.slice("chunk:".length)
        : null;
    if (key === null)
        return null;
    const file = context.filesByPath.get(sourcePath);
    if (file === undefined)
        return null;
    const registrations = context.analysis.files
        .find(({ file: analyzedFile }) => analyzedFile.path === sourcePath)
        ?.javascript?.bundler_registrations.filter(({ runtime, modules }) => reference.module_runtime === undefined
        ? reference.module_key === null
        : runtime === reference.module_runtime &&
            modules.some(({ module_key: moduleKey }) => moduleKey === reference.module_key));
    if (registrations === undefined)
        return null;
    const candidates = registrations.flatMap(({ runtime }) => {
        const node = context.chunkNodes.get(chunkLookupKey(sourcePath, runtime, key));
        return node === undefined ? [] : [node];
    });
    const unique = [
        ...new Map(candidates.map((node) => [node.node_id, node])).values(),
    ];
    if (unique.length !== 1)
        return null;
    const node = unique[0];
    return node === undefined
        ? null
        : { path: `${sourcePath}#chunk:${key}`, file, node, limitations: [] };
};
const unresolvedReferenceNode = (context, file, reference, coverage, resolution) => context.accumulator.addNode({
    kind: "javascript-module",
    identity: artifactLocalIdentity(file.sha256, "unresolved-reference", `${reference.kind}:${reference.specifier ?? reference.expression}`),
    observations: [
        {
            label: reference.specifier,
            properties: {
                reference_kind: reference.kind,
                specifier: reference.specifier,
                expression: reference.expression,
                resolution: "unresolved",
                ...(resolution === undefined
                    ? {}
                    : { resolution_status: resolution.resolution_status }),
                ...artifactPathResolutionProperties(resolution),
            },
            evidence: staticInferenceEvidence({
                sha256: file.sha256,
                path: file.path,
                range: reference.location,
                operation: "resolve-static-reference",
                coverage,
                confidence: "low",
                limitations: [
                    "The static reference could not be resolved within the inventoried artifact.",
                    ...(resolution?.limitations ?? []),
                ],
            }),
        },
    ],
});
