import { posix } from "node:path";
/** JSON dispatch uses the exact loader filename, not the inventory's folded kind. */
export const isJsonModuleTarget = (path, kind) => path.endsWith(".json") && (kind === "json" || kind === "package-json");
/** Derive source mode only when syntax or an explicit source format owns it. */
export const moduleResolutionModeForJavaScriptReference = (sourcePath, referenceKind, explicitMode) => {
    if (explicitMode !== undefined)
        return explicitMode;
    if (referenceKind === "require")
        return "require";
    if (referenceKind === "dynamic-import")
        return "import";
    const extension = posix.extname(sourcePath).toLowerCase();
    if (extension === ".cjs" || extension === ".cts")
        return "require";
    if (extension === ".mts")
        return "import";
    if (extension === ".ts" || extension === ".tsx")
        return "compiler-dependent";
    return "import";
};
