import { z } from "zod";
import { machoArchitectureFamily } from "./machoCpuIdentity.js";
import { AnalysisCancelledError } from "../analysisErrorCore.js";
import { compatibleSlice, directoryOf, expandPrefix, resolveTreePath, } from "./dyldPaths.js";
import { digestSchema } from "../digests.js";
import { hasApplicableDyldOverrides, embeddedDyldOverrides, } from "./dyldEnvironment.js";
import { DYLIB_RESOLUTION_LIMITATIONS, deriveFindings, isLazyLoadCommand, } from "./dylibResolutionFindings.js";
/**
 * Normalized path below the analyzed root: nonempty segments joined by single
 * `/`, none of them `.` or `..`, without backslash or NUL. Advertised schema
 * patterns avoid look-around, which RE2 and Rust validators reject.
 */
const ROOT_RELATIVE_PATH = /^(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+)(?:\x2f(?:[^\x2f\\\x00.][^\x2f\\\x00]*|\.[^\x2f\\\x00.][^\x2f\\\x00]*|\.\.[^\x2f\\\x00]+))*$/u;
const rootRelativePathSchema = z
    .string()
    .min(1)
    .regex(ROOT_RELATIVE_PATH, "Use a normalized path relative to the analyzed root, without a leading or trailing '/', '//', or '.' and '..' segments");
/** Caller selection of process roots and one CPU slice. */
export const dylibResolutionInputSchema = z.strictObject({
    roots: z.array(rootRelativePathSchema).min(1).optional(),
    architecture: z.enum(["arm64", "arm64e", "x86_64"]).optional(),
});
const dependencyCommandSchema = z.enum([
    "LC_LOAD_DYLIB",
    "LC_LOAD_WEAK_DYLIB",
    "LC_REEXPORT_DYLIB",
    "LC_LAZY_LOAD_DYLIB",
    "LC_LAZY_LOAD_DYLIB_INFO",
    "LC_LOAD_UPWARD_DYLIB",
]);
const IMPLICIT_MACOS_PLATFORM = 1;
const MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES = new Set([
    7, // CPU_TYPE_I386
    0x01000007, // CPU_TYPE_X86_64
    0x0100000c, // CPU_TYPE_ARM64, including arm64 subtypes
]);
const dependencySchema = z.strictObject({
    command: dependencyCommandSchema,
    encoding: z.enum([
        "dylib_command",
        "dylib_use_command",
        "lazy_load_dylib_info",
    ]),
    install_name: z.string(),
    weak: z.boolean(),
    upward: z.boolean(),
    reexport: z.boolean(),
    delayed_init: z.boolean(),
    /**
     * Null for `lazy_load_dylib_info`: that payload has no version fields.
     * Classic dylib commands still carry both versions.
     */
    current_version: z.string().nullable(),
    compatibility_version: z.string().nullable(),
});
/** Observed dylib-loading facts of one Mach-O slice. */
export const machoSliceSchema = z.strictObject({
    architecture: z.string().min(1),
    hidden: z.boolean().exactOptional(),
    /** Physical identity observed in the thin header and, for FAT, its table. */
    slice_offset: z.int().nonnegative(),
    slice_size: z.int().positive(),
    cpu_type: z.int().nonnegative(),
    cpu_subtype: z.int().nonnegative(),
    fat_cpu_type: z.int().nonnegative().nullable(),
    fat_cpu_subtype: z.int().nonnegative().nullable(),
    fat_alignment_exponent: z.int().nonnegative().nullable(),
    file_type: z.enum(["execute", "dylib", "bundle", "other"]),
    file_type_code: z.int().nonnegative(),
    /** Raw LC_BUILD_VERSION platform number; null means no such command was observed. */
    platform: z.int().nonnegative().nullable(),
    /** Every distinct build platform declared by LC_BUILD_VERSION/version-min commands. */
    platforms: z.array(z.int().nonnegative()),
    install_name: z.string().nullable(),
    dependencies: z.array(dependencySchema),
    rpaths: z.array(z.string()),
    dyld_environment: z.array(z.string()),
    code_signature_present: z.boolean(),
});
/** Return every slice that can participate in architecture selection. */
export const machoImageSlices = (facts) => facts.hiddenSlices === undefined
    ? facts.slices
    : [...facts.slices, ...facts.hiddenSlices];
const candidateSchema = z.strictObject({
    path: z.string(),
    source: z.enum([
        "literal",
        "executable_path",
        "loader_path",
        "rpath",
        "already-loaded",
    ]),
    rpath: z.string().nullable(),
    rpath_owner: z.string().nullable(),
    outcome: z.enum([
        "resolved",
        "absent",
        "not-mach-o",
        "malformed",
        "unsupported",
        "architecture-missing",
        "not-loadable",
        "platform-mismatch",
        "outside-target",
        "escapes-target",
        "undetermined",
    ]),
    resolved_path: z.string().nullable(),
    platform_basis: z.enum(["macos-dyld-implicit"]).optional(),
});
const edgeSchema = z.strictObject({
    root: z.string(),
    architecture: z.string(),
    loader: z.string(),
    via: z.array(z.string()),
    ...dependencySchema.shape,
    candidates: z.array(candidateSchema),
    resolution: z.strictObject({
        status: z.enum(["resolved", "conditional", "unresolved", "undetermined"]),
        image: z.string().nullable(),
    }),
    install_name_matches: z.boolean().nullable(),
    /**
     * The loader was reached through a conditional edge, so it might not load;
     * this edge describes what happens only if it does.
     */
    loader_conditional: z.boolean(),
});
const findingSchema = z.strictObject({
    kind: z.enum([
        "required-load-unresolved",
        "weak-load-unresolved",
        "lazy-load-unresolved",
        "earlier-rpath-candidate-absent",
        "dyld-environment-present",
    ]),
    edge_index: z.int().nonnegative().nullable(),
    image: z.string().nullable(),
    basis: z.literal("derived"),
    explanation: z.string().min(1),
});
const imageSchema = z.strictObject({
    path: z.string(),
    sha256: digestSchema,
    parse_status: z.enum(["parsed", "malformed", "unsupported"]),
    reason: z.string().nullable(),
    slices: z.array(machoSliceSchema.omit({ dependencies: true })),
});
/** Static dyld load-path resolution for every selected process root. */
export const dylibResolutionResultSchema = z.strictObject({
    root_path: z.string(),
    target_sha256: digestSchema,
    roots: z.array(z.strictObject({ image: z.string(), architecture: z.string() })),
    images: z.array(imageSchema),
    edges: z.array(edgeSchema),
    findings: z.array(findingSchema),
    coverage: z.strictObject({
        status: z.enum(["complete", "partial"]),
        unparsed_images: z.array(z.string()),
        roots_without_architecture: z.array(z.string()),
    }),
    limitations: z.array(z.string().min(1)),
});
const expandCandidatePath = (raw, ownerDirectory, context) => expandPrefix(raw, {
    ownerDirectory,
    executable: context.executable,
    rootRelativePath: (absolutePath) => context.view.rootRelativePath(absolutePath),
});
const appendRpath = (base, rest) => {
    if (base === "")
        return rest;
    if (base === "/")
        return `/${rest}`;
    return `${base.replace(/\/+$/u, "")}/${rest}`;
};
const candidateTemplates = (dependency, loader, context) => {
    const name = dependency.install_name;
    if (!name.startsWith("@rpath/")) {
        const source = name.startsWith("@executable_path")
            ? "executable_path"
            : name.startsWith("@loader_path")
                ? "loader_path"
                : "literal";
        return [
            {
                expansion: expandCandidatePath(name, directoryOf(loader), context),
                source,
                rpath: null,
                rpathOwner: null,
            },
        ];
    }
    const rest = name.slice("@rpath/".length);
    const owners = [...(context.loaded.get(loader)?.chain ?? [loader])].reverse();
    return owners.flatMap((owner) => (context.loaded.get(owner)?.slice.rpaths ?? []).map((rpath) => {
        const base = expandCandidatePath(rpath, directoryOf(owner), context);
        const lookupPath = base.scope === "target" ? base.lookupPath : undefined;
        const expansion = {
            scope: base.scope,
            path: base.scope === "outside" || lookupPath !== undefined
                ? appendRpath(base.path, rest)
                : `${base.path}${base.path === "" ? "" : "/"}${rest}`,
            ...(lookupPath === undefined
                ? {}
                : { lookupPath: appendRpath(lookupPath, rest) }),
        };
        return { expansion, source: "rpath", rpath, rpathOwner: owner };
    }));
};
const evaluateCandidate = async (template, context) => {
    const base = {
        path: template.expansion.path,
        source: template.source,
        rpath: template.rpath,
        rpath_owner: template.rpathOwner,
    };
    if (template.expansion.scope === "outside")
        return { ...base, outcome: "outside-target", resolved_path: null };
    if (template.expansion.scope === "undetermined")
        return { ...base, outcome: "undetermined", resolved_path: null };
    const lookup = await resolveTreePath(context.view, template.expansion.lookupPath ?? template.expansion.path);
    if (lookup.kind === "escapes")
        return { ...base, outcome: "escapes-target", resolved_path: null };
    if (lookup.kind !== "file")
        return { ...base, outcome: "absent", resolved_path: null };
    const facts = await imageFacts(context, lookup.path);
    let outcome;
    if (facts.status !== "parsed")
        outcome = facts.status;
    else {
        const selection = compatibleSlice(machoImageSlices(facts), context.processIdentity);
        if (selection.kind === "unknown")
            outcome = "undetermined";
        else if (selection.kind === "missing")
            outcome = "architecture-missing";
        // Dependency commands require a dylib; generic dyld image loadability
        // also admits main executables and bundles for different operations.
        else if (selection.slice.file_type_code !== 6)
            outcome = "not-loadable";
        else {
            const { slice } = selection;
            const platformResult = platformLoadability(context, slice);
            outcome =
                platformResult.outcome === "compatible"
                    ? "resolved"
                    : platformResult.outcome === "incompatible"
                        ? "platform-mismatch"
                        : "undetermined";
            if (outcome === "undetermined")
                context.unknownPlatformCandidates.add(lookup.path);
            if (platformResult.basis !== undefined) {
                context.implicitMacOSPlatformCandidates.add(lookup.path);
                return {
                    ...base,
                    outcome,
                    resolved_path: lookup.path,
                    platform_basis: platformResult.basis,
                };
            }
        }
    }
    return { ...base, outcome, resolved_path: lookup.path };
};
/** Apply dyld's documented cross-platform load cases and retain uncertain host cases. */
const platformLoadability = (context, image) => {
    const { platforms: processPlatforms } = context;
    const { file_type_code: fileType, platforms: imagePlatforms } = image;
    let effectiveImagePlatforms = imagePlatforms;
    let basis;
    if (imagePlatforms.length === 0) {
        // macOS dyld supplies an implicit macOS platform to old dylibs on these
        // CPU types. Keep the parsed platform facts untouched; this is only the
        // compatibility interpretation used for an explicitly macOS process.
        if (context.executable !== null &&
            processPlatforms.length === 1 &&
            processPlatforms[0] === IMPLICIT_MACOS_PLATFORM &&
            MACOS_DYLD_IMPLICIT_PLATFORM_CPU_TYPES.has(image.cpu_type)) {
            effectiveImagePlatforms = [IMPLICIT_MACOS_PLATFORM];
            basis = "macos-dyld-implicit";
        }
        else
            return { outcome: "unknown" };
    }
    if (processPlatforms.length === 0)
        return { outcome: "unknown" };
    const outcomes = processPlatforms.map((processPlatform) => imageLoadabilityForPlatform(processPlatform, effectiveImagePlatforms, fileType, image.architecture));
    if (outcomes.every((outcome) => outcome === "compatible"))
        return { outcome: "compatible", ...(basis === undefined ? {} : { basis }) };
    if (outcomes.every((outcome) => outcome === "incompatible"))
        return {
            outcome: "incompatible",
            ...(basis === undefined ? {} : { basis }),
        };
    return { outcome: "unknown", ...(basis === undefined ? {} : { basis }) };
};
const imageLoadabilityForPlatform = (processPlatform, imagePlatforms, fileType, architecture) => {
    if (imagePlatforms.includes(processPlatform))
        return "compatible";
    // These are explicit dyld loadableIntoProcess cross-platform cases.
    if (processPlatform === 6 && imagePlatforms.includes(1))
        return "compatible"; // macOS dylibs in Mac Catalyst processes
    if (processPlatform === 2 && imagePlatforms.includes(6))
        return "compatible"; // Catalyst dylibs in iOS processes
    if (processPlatform === 2 && imagePlatforms.includes(11))
        return "compatible"; // visionOS dylibs in iOS processes
    if (processPlatform === 7 && imagePlatforms.includes(12))
        return "compatible"; // visionOS simulator dylibs in iOS simulator processes
    if (processPlatform === 1 && fileType === 2 && imagePlatforms.includes(6))
        return "compatible"; // Catalyst main executables run on macOS
    // dyld's remaining exceptions depend on host architecture or a special path.
    if ((processPlatform === 2 &&
        imagePlatforms.includes(1) &&
        architecture.startsWith("arm64")) ||
        ([7, 8, 9].includes(processPlatform) && imagePlatforms.includes(1)))
        return "unknown";
    if (isKnownPlatform(processPlatform) && imagePlatforms.every(isKnownPlatform))
        return "incompatible";
    return "unknown";
};
const isKnownPlatform = (platform) => platform >= 1 && platform <= 12;
const imageFacts = async (context, path) => {
    const known = context.images.get(path);
    if (known !== undefined)
        return known;
    const facts = await context.view.image(path);
    context.images.set(path, facts);
    return facts;
};
const resolution = (candidates) => {
    let external = false;
    for (const candidate of candidates) {
        if (candidate.outcome === "resolved")
            return {
                status: external ? "conditional" : "resolved",
                image: candidate.resolved_path,
            };
        // dyld might load these; REA cannot decide them from the analyzed root.
        if (candidate.outcome === "outside-target" ||
            candidate.outcome === "escapes-target" ||
            candidate.outcome === "unsupported" ||
            candidate.outcome === "undetermined")
            external = true;
    }
    return { status: external ? "undetermined" : "unresolved", image: null };
};
const resolveDependency = async (dependency, loader, context) => {
    const current = context.loaded.get(loader);
    const chain = current?.chain ?? [loader];
    const loaded = dependency.install_name.startsWith("@rpath/")
        ? context.byInstallName.get(dependency.install_name)
        : undefined;
    const candidates = [];
    if (loaded !== undefined)
        candidates.push({
            path: dependency.install_name,
            source: "already-loaded",
            rpath: null,
            rpath_owner: null,
            outcome: "resolved",
            resolved_path: loaded,
        });
    else
        for (const template of candidateTemplates(dependency, loader, context)) {
            const candidate = await evaluateCandidate(template, context);
            candidates.push(candidate);
            // dyld stops at the first loadable candidate.
            if (candidate.outcome === "resolved")
                break;
        }
    const modeled = resolution(candidates);
    const searchUnknown = loaded === undefined &&
        hasApplicableDyldOverrides(context.searchOverrides, dependency.install_name, modeled.image !== null);
    if (searchUnknown)
        context.environmentRoots.add(context.root);
    // Fallbacks cannot preempt a modeled hit, and framework paths do not
    // override ordinary dylibs. Reuse inherits uncertainty from the first load.
    const searched = searchUnknown
        ? {
            ...modeled,
            status: modeled.image === null ? "undetermined" : "conditional",
        }
        : modeled;
    // Reusing an image that itself loads only conditionally is conditional too.
    const resolved = loaded !== undefined &&
        context.loaded.get(loaded)?.conditional === true &&
        searched.status === "resolved"
        ? { ...searched, status: "conditional" }
        : searched;
    const image = resolved.image === null ? undefined : context.images.get(resolved.image);
    const selection = image?.status === "parsed"
        ? compatibleSlice(machoImageSlices(image), context.processIdentity)
        : undefined;
    const slice = selection?.kind === "selected" ? selection.slice : undefined;
    return {
        root: context.root,
        architecture: context.processIdentity.architecture,
        loader,
        via: [...chain],
        ...dependency,
        candidates,
        resolution: resolved,
        install_name_matches: slice === undefined || slice.install_name === null
            ? null
            : slice.install_name === dependency.install_name,
        loader_conditional: current?.conditional ?? false,
    };
};
/**
 * Follow dyld4's dependents-first order: resolve every dependency of one
 * image, then recurse into the images it newly loaded, in load-command order.
 */
const traceProcess = async (context, rootSlice, signal) => {
    const edges = [];
    context.loaded.set(context.root, {
        slice: rootSlice,
        chain: [context.root],
        conditional: false,
    });
    if (rootSlice.install_name !== null &&
        rootSlice.install_name.startsWith("@rpath/"))
        context.byInstallName.set(rootSlice.install_name, context.root);
    const pending = [context.root];
    while (pending.length > 0) {
        if (signal?.aborted)
            throw new AnalysisCancelledError("trace_dylib_resolution", {
                cause: signal.reason,
            });
        const loader = pending.pop() ?? "";
        const current = context.loaded.get(loader);
        if (current === undefined)
            continue;
        const created = [];
        for (const dependency of current.slice.dependencies) {
            const edge = await resolveDependency(dependency, loader, context);
            edges.push(edge);
            // dyld loads lazy images on first use, not at launch.
            if (isLazyLoadCommand(dependency.command))
                continue;
            const image = edge.resolution.image;
            if (image === null || context.loaded.has(image))
                continue;
            const facts = context.images.get(image);
            const selection = facts?.status === "parsed"
                ? compatibleSlice(machoImageSlices(facts), context.processIdentity)
                : undefined;
            if (selection?.kind !== "selected")
                continue;
            const { slice } = selection;
            context.loaded.set(image, {
                slice,
                chain: [...current.chain, image],
                // A modeled earlier search uncertainty can make this image conditional.
                conditional: current.conditional || edge.resolution.status === "conditional",
            });
            if (slice.install_name !== null &&
                slice.install_name.startsWith("@rpath/") &&
                !context.byInstallName.has(slice.install_name))
                context.byInstallName.set(slice.install_name, image);
            created.push(image);
        }
        pending.push(...created.reverse());
    }
    return edges;
};
const projectTraceResult = (input) => {
    const reported = [...input.images.entries()]
        .filter(([, facts]) => facts.status !== "not-mach-o")
        .sort(([left], [right]) => compare(left, right));
    const unparsed = reported
        .filter(([, facts]) => facts.status !== "parsed")
        .map(([path]) => path);
    return {
        roots: input.roots,
        images: reported.map(([path, facts]) => ({
            path,
            parse_status: facts.status === "not-mach-o" ? "unsupported" : facts.status,
            reason: facts.status === "parsed" || facts.status === "not-mach-o"
                ? null
                : facts.reason,
            slices: facts.status === "parsed"
                ? machoImageSlices(facts).map(withoutDependencies)
                : [],
        })),
        edges: [...input.edges],
        findings: deriveFindings(input.edges, input.rootSlices),
        coverage: {
            status: unparsed.length === 0 &&
                input.withoutArchitecture.length === 0 &&
                input.environmentRoots.size === 0 &&
                input.unknownPlatformCandidates.size === 0 &&
                input.rootEnumeration?.status !== "unknown"
                ? "complete"
                : "partial",
            unparsed_images: unparsed,
            roots_without_architecture: [...input.withoutArchitecture],
        },
        limitations: [
            ...DYLIB_RESOLUTION_LIMITATIONS,
            ...(input.rootEnumeration?.limitations ?? []),
            ...(input.environmentRoots.size === 0
                ? []
                : [
                    `Roots ${[...input.environmentRoots].join(", ")} request applicable image-selection inputs through LC_DYLD_ENVIRONMENT that are not modeled; affected dependencies or inserted images remain uncertain.`,
                ]),
            ...(input.unknownPlatformCandidates.size === 0
                ? []
                : [
                    `In-root dylib candidates ${[...input.unknownPlatformCandidates].sort(compare).join(", ")} have unknown platform compatibility and are not treated as incompatible. Their dependent graphs may be incomplete.`,
                ]),
            ...(input.implicitMacOSPlatformCandidates.size === 0
                ? []
                : [
                    `In-root dylib candidates ${[...input.implicitMacOSPlatformCandidates].sort(compare).join(", ")} have no observed platform load command; macOS compatibility was derived from dyld's implicit-platform rule for an executable root with explicit macOS platform and a supported CPU type. Reported platform facts remain unchanged.`,
                ]),
        ],
    };
};
/** Trace dyld load paths from each process root through the analyzed root. */
export const traceDylibLoading = async (view, request) => {
    const images = new Map();
    for (const path of request.unclassified ?? [])
        images.set(path, await view.image(path));
    const roots = [];
    const rootSlices = [];
    const edges = [];
    const withoutArchitecture = [];
    const environmentRoots = new Set();
    const unknownPlatformCandidates = new Set();
    const implicitMacOSPlatformCandidates = new Set();
    for (const root of request.roots) {
        const facts = await view.image(root);
        images.set(root, facts);
        if (facts.status !== "parsed")
            continue;
        const slices = machoImageSlices(facts).filter(({ architecture }) => request.architecture === undefined ||
            machoArchitectureFamily(architecture) === request.architecture);
        if (slices.length === 0)
            withoutArchitecture.push(root);
        for (const slice of slices) {
            const executable = slice.file_type === "execute" ? root : null;
            // Only the main executable supplies the process's embedded environment.
            const searchOverrides = executable === null
                ? []
                : embeddedDyldOverrides(slice.dyld_environment, slice.platforms);
            // Inserted libraries introduce unexamined images even without dependencies.
            if (searchOverrides.some(({ variable, value }) => variable === "DYLD_INSERT_LIBRARIES" && value !== ""))
                environmentRoots.add(root);
            roots.push({ image: root, architecture: slice.architecture });
            rootSlices.push({ image: root, slice });
            edges.push(...(await traceProcess({
                view,
                root,
                processIdentity: {
                    architecture: slice.architecture,
                    cpu_type: slice.cpu_type,
                    cpu_subtype: slice.cpu_subtype,
                },
                searchOverrides,
                environmentRoots,
                unknownPlatformCandidates,
                implicitMacOSPlatformCandidates,
                platforms: slice.platforms,
                executable,
                loaded: new Map(),
                byInstallName: new Map(),
                images,
            }, slice, request.signal)));
        }
    }
    return projectTraceResult({
        images,
        roots,
        rootSlices,
        edges,
        withoutArchitecture,
        environmentRoots,
        unknownPlatformCandidates,
        implicitMacOSPlatformCandidates,
        rootEnumeration: request.rootEnumeration,
    });
};
const withoutDependencies = (slice) => ({
    architecture: slice.architecture,
    ...(slice.hidden === undefined ? {} : { hidden: slice.hidden }),
    slice_offset: slice.slice_offset,
    slice_size: slice.slice_size,
    cpu_type: slice.cpu_type,
    cpu_subtype: slice.cpu_subtype,
    fat_cpu_type: slice.fat_cpu_type,
    fat_cpu_subtype: slice.fat_cpu_subtype,
    fat_alignment_exponent: slice.fat_alignment_exponent,
    file_type: slice.file_type,
    file_type_code: slice.file_type_code,
    platform: slice.platform,
    platforms: slice.platforms,
    install_name: slice.install_name,
    rpaths: slice.rpaths,
    dyld_environment: slice.dyld_environment,
    code_signature_present: slice.code_signature_present,
});
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
