import { packageSubpathPatternMatches } from "./javascriptPackageSubpathPatterns.js";
/**
 * Classify a `#` module specifier before any package-scope walk.
 * `#` and names ending in `/` are invalid. Other literal keys, including
 * `#/…`, participate in exact lookup; wildcard expansion remains unsupported.
 */
export const classifyPackageImportSpecifier = (specifier) => {
    if (specifier === "#" || specifier.endsWith("/"))
        return { kind: "invalid" };
    if (specifier.includes("*"))
        return { kind: "pattern" };
    return { kind: "exact", key: specifier };
};
/** True when an `imports` key is a pattern rather than an exact alias. */
export const isPackageImportPatternKey = (key) => key.includes("*") || key.endsWith("/");
/**
 * Look up one exact `#` key in a package `imports` value.
 * Only a matching wildcard keeps an exact miss unresolved. Unrelated patterns
 * cannot select a target and therefore do not hide an undefined specifier.
 */
export const lookupExactPackageImport = (imports, key) => {
    if (typeof imports !== "object" || imports === null || Array.isArray(imports))
        return { kind: "undefined-map" };
    const declared = Object.keys(imports);
    if (Object.hasOwn(imports, key) && !isPackageImportPatternKey(key))
        return {
            kind: "found",
            target: Reflect.get(imports, key),
            declared,
        };
    return declared.some((pattern) => packageSubpathPatternMatches(pattern, key))
        ? { kind: "pattern-unresolved", declared }
        : { kind: "missing-key", declared };
};
/**
 * Classify a selected string import target. Only package-local `./` paths are
 * resolved as files; recursive `#` aliases and bare packages stay unknown.
 * Parent-relative, absolute, and URL targets are invalid, allowing array
 * selection to skip them before choosing a package-local fallback.
 */
export const classifyPackageImportTargetString = (target) => {
    if (target.startsWith("./"))
        return { kind: "relative", target };
    if (target.startsWith("../") ||
        target.startsWith("/") ||
        URL.canParse(target))
        return { kind: "invalid", target };
    if (target.startsWith("#"))
        return { kind: "recursive", target };
    return { kind: "external-package", target };
};
