import { z } from "zod";
import { compareUnicodeCodePoints as compare } from "../unicodeCodePointOrder.js";
const pathSchema = z.string().min(1);
const BUNDLE_EXTENSION = /\.(?:app|appex|xpc|framework|systemextension|dext|bundle|plugin|qlgenerator|mdimporter)$/iu;
const MACH_O_FORMATS = ["mach-o", "mach-o-universal"];
/** One application root or nested bundle classified by path convention. */
export const appleBundleSchema = z.strictObject({
    path: pathSchema,
    parent_path: pathSchema.nullable(),
    layout: z.enum(["shallow", "macos-deep", "versioned-framework"]),
    role: z.enum([
        "application",
        "app-extension",
        "xpc-service",
        "framework",
        "login-item",
        "system-extension",
        "driver-extension",
        "plug-in",
        "resource-bundle",
        "bundle",
        "helper-application",
        "nested-application",
    ]),
    role_basis: z.literal("path-convention"),
    info_plist_path: pathSchema.nullable(),
    executable_candidates: z.array(pathSchema),
    signing_paths: z.array(pathSchema),
});
/** Report whether an inventory format is a thin or universal Mach-O. */
export const isMachOFormat = (format) => MACH_O_FORMATS.includes(format);
/** AppleDouble metadata written beside archived files (`._name`, `__MACOSX/`). */
export const isSidecar = (path) => {
    const segments = path.split("/");
    return (segments.includes("__MACOSX") || (segments.at(-1) ?? "").startsWith("._"));
};
export const isWithin = (path, root) => root === "." || path === root || path.startsWith(`${root}/`);
/**
 * English (en-US) case fold used only for Apple's fixed anatomy vocabulary.
 * Reported paths keep the archive spelling. Inventory identity stays case-sensitive.
 */
export const anatomyNameIs = (actual, expected) => actual.toLocaleLowerCase("en-US") === expected.toLocaleLowerCase("en-US");
/** Directory entry that folds to one vocabulary word. The exact spelling wins. */
export const anatomyChild = (names, expected) => {
    if (names === undefined)
        return null;
    let exact;
    let folded;
    for (const name of names) {
        if (name === expected)
            exact = name;
        else if (anatomyNameIs(name, expected) &&
            (folded === undefined || compare(name, folded) < 0))
            folded = name;
    }
    return exact ?? folded ?? null;
};
/**
 * Whether `path`'s tail matches anatomy vocabulary. `*` matches one segment
 * that is not itself a vocabulary comparison.
 */
export const anatomyTailMatches = (path, expected) => {
    const actual = path.split("/");
    if (actual.length < expected.length)
        return false;
    const tail = actual.slice(-expected.length);
    return expected.every((name, index) => {
        const segment = tail[index];
        if (segment === undefined || segment.length === 0)
            return false;
        return name === "*" || anatomyNameIs(segment, name);
    });
};
/** Interpret bundle roots and anatomy from the same directory and file indexes. */
export const projectAppleBundleAnatomy = (entries, subject) => {
    const tree = indexTree(entries);
    const roots = applicationRoots(tree, subject);
    return { roots, bundles: detectBundles(tree, roots) };
};
/**
 * Outermost iOS (`Payload/X.app`) and macOS (`X.app/Contents/…`) applications.
 * An inventoried `.app` directory is its own root, `.`.
 */
const applicationRoots = (tree, subject) => {
    // A selected `.app` directory is the application, even when its inventory
    // is partial or lacks Contents/; coverage and limitations describe that.
    if (subject.format === "directory" && /\.app$/iu.test(subject.name))
        return ["."];
    const found = new Set();
    for (const path of directoryPaths(tree)) {
        const segments = path.split("/");
        const app = segments[1];
        if (anatomyNameIs(segments[0] ?? "", "Payload") &&
            app !== undefined &&
            /\.app$/iu.test(app)) {
            found.add(`${segments[0]}/${app}`);
            continue;
        }
        const index = segments.findIndex((segment, position) => /\.app$/iu.test(segment) &&
            anatomyNameIs(segments[position + 1] ?? "", "Contents"));
        if (index >= 0)
            found.add(segments.slice(0, index + 1).join("/"));
    }
    const roots = [...found];
    return roots
        .filter((root) => !roots.some((other) => other !== root && isWithin(root, other)))
        .sort(compare);
};
const detectBundles = (tree, roots) => {
    const paths = new Set(roots);
    for (const path of directoryPaths(tree)) {
        if (BUNDLE_EXTENSION.test(path.split("/").at(-1) ?? "") &&
            roots.some((root) => isWithin(path, root)))
            paths.add(path);
    }
    return [...paths].sort(compare).map((path) => {
        const layout = bundleLayout(path, tree);
        return {
            path,
            parent_path: enclosingBundle(path, paths),
            layout,
            role: roots.includes(path) ? "application" : bundleRole(path),
            role_basis: "path-convention",
            info_plist_path: infoPlistPath(path, layout, tree),
            executable_candidates: executableCandidates(path, layout, tree),
            signing_paths: signingPaths(path, layout, tree),
        };
    });
};
const indexTree = (entries) => {
    const directories = new Map();
    const files = new Map();
    for (const entry of entries) {
        const { path, kind } = entry;
        if (isSidecar(path))
            continue;
        const segments = path.split("/");
        let parent = "";
        for (const [index, segment] of segments.entries()) {
            const leaf = index === segments.length - 1;
            if (!leaf || kind === "directory") {
                const names = directories.get(parent) ?? new Set();
                names.add(segment);
                directories.set(parent, names);
            }
            else if (kind === "file") {
                const children = files.get(parent) ?? new Map();
                children.set(segment, entry);
                files.set(parent, children);
            }
            parent = joinPath(parent, segment);
        }
    }
    return { directories, files };
};
function* directoryPaths(tree) {
    for (const [parent, names] of tree.directories)
        for (const name of names)
            yield joinPath(parent, name);
}
const joinPath = (directory, name) => directory === "" ? name : `${directory}/${name}`;
const directoryOf = (bundle) => (bundle === "." ? "" : bundle);
const enclosingBundle = (path, bundles) => {
    if (path === ".")
        return null;
    const segments = path.split("/");
    for (let length = segments.length - 1; length > 0; length--) {
        const candidate = segments.slice(0, length).join("/");
        if (bundles.has(candidate))
            return candidate;
    }
    return bundles.has(".") ? "." : null;
};
const bundleLayout = (bundle, tree) => {
    const directory = directoryOf(bundle);
    if (namedDirectory(tree, directory, "Contents") !== null)
        return "macos-deep";
    if (namedDirectory(tree, directory, "Versions") !== null)
        return "versioned-framework";
    return "shallow";
};
const bundleRole = (bundle) => {
    const segments = bundle.split("/");
    const name = (segments.at(-1) ?? "").toLowerCase();
    const container = segments.at(-2);
    if (name.endsWith(".appex"))
        return "app-extension";
    if (name.endsWith(".xpc"))
        return "xpc-service";
    if (name.endsWith(".framework"))
        return "framework";
    if (name.endsWith(".systemextension"))
        return "system-extension";
    if (name.endsWith(".dext"))
        return "driver-extension";
    if (name.endsWith(".bundle")) {
        if (anatomyNameIs(container ?? "", "PlugIns"))
            return "plug-in";
        return anatomyNameIs(container ?? "", "Resources")
            ? "resource-bundle"
            : "bundle";
    }
    if (!name.endsWith(".app"))
        return "plug-in";
    if (anatomyNameIs(container ?? "", "LoginItems") &&
        anatomyNameIs(segments.at(-3) ?? "", "Library"))
        return "login-item";
    if (anatomyNameIs(container ?? "", "Helpers"))
        return "helper-application";
    return "nested-application";
};
/** Files directly inside one directory; nested bundles are deeper paths. */
const directFiles = (directory, tree) => [...(tree.files.get(directory)?.values() ?? [])].sort((left, right) => compare(left.path, right.path));
/** Content directories; `Versions/Current` is a symlink outside the inventory. */
const contentDirectories = (bundle, layout, tree) => {
    const directory = directoryOf(bundle);
    if (layout === "macos-deep") {
        const contents = namedDirectory(tree, directory, "Contents");
        return contents === null ? [] : [contents];
    }
    if (layout === "shallow")
        return [directory];
    const versions = namedDirectory(tree, directory, "Versions");
    if (versions === null)
        return [];
    // Only real version directories count: Current is a symlink, and files
    // such as .DS_Store are not versions.
    return [...(tree.directories.get(versions) ?? [])]
        .filter((version) => !anatomyNameIs(version, "Current"))
        .map((version) => joinPath(versions, version))
        .sort(compare);
};
/** Select applicable entry kinds before applying Apple's case preference. */
const namedDirectory = (tree, directory, expected) => {
    const name = anatomyChild(tree.directories.get(directory), expected);
    return name === null ? null : joinPath(directory, name);
};
const namedFile = (tree, directory, expected) => {
    const name = anatomyChild(tree.files.get(directory)?.keys(), expected);
    return name === null ? null : joinPath(directory, name);
};
const infoPlistPath = (bundle, layout, tree) => {
    const directories = contentDirectories(bundle, layout, tree);
    // With several real versions, Versions/Current (a symlink outside the
    // inventory) decides which plist applies, so the plist stays unknown.
    if (directories.length !== 1)
        return null;
    const directory = directories[0];
    if (directory === undefined)
        return null;
    const parent = layout === "versioned-framework"
        ? namedDirectory(tree, directory, "Resources")
        : directory;
    if (parent === null)
        return null;
    return namedFile(tree, parent, "Info.plist");
};
const executableCandidates = (bundle, layout, tree) => contentDirectories(bundle, layout, tree)
    .flatMap((directory) => {
    const executableDirectory = layout === "macos-deep"
        ? namedDirectory(tree, directory, "MacOS")
        : directory;
    return executableDirectory === null
        ? []
        : directFiles(executableDirectory, tree);
})
    .filter(({ component }) => component !== undefined && isMachOFormat(component.format))
    .map(({ path }) => path);
const signingPaths = (bundle, layout, tree) => contentDirectories(bundle, layout, tree)
    .flatMap((directory) => {
    const signature = namedDirectory(tree, directory, "_CodeSignature");
    return [
        signature === null ? null : namedFile(tree, signature, "CodeResources"),
        namedFile(tree, directory, "embedded.provisionprofile"),
        namedFile(tree, directory, "embedded.mobileprovision"),
    ];
})
    .filter((path) => path !== null)
    .sort(compare);
/** Platforms of application roots whose layout was observed, not assumed. */
export const platformsOf = (bundles) => [
    ...new Set(bundles.flatMap(({ role, layout, info_plist_path: plist }) => {
        if (role !== "application")
            return [];
        if (layout === "macos-deep")
            return ["macos"];
        // An empty or partial root has no Contents/ either; require Info.plist.
        if (layout === "shallow" && plist !== null)
            return ["ios"];
        return [];
    })),
].sort(compare);
