import { posix } from "node:path";
import { err, ok } from "./result.js";
/**
 * Reference inventories retain filesystem spelling. Prefer that exact identity;
 * canonical Unicode equivalence is a fallback only when it identifies one entry.
 */
export const createReferenceSourcePathLookup = (paths) => {
    const exact = new Set(paths);
    const canonical = new Map();
    for (const path of exact) {
        const key = path.normalize("NFC");
        canonical.set(key, canonical.has(key) ? null : path);
    }
    const equivalent = (path) => canonical.get(path.normalize("NFC")) ?? undefined;
    const has = (path) => exact.has(path) || canonical.has(path.normalize("NFC"));
    const resolve = (path) => exact.has(path) ? path : equivalent(path);
    return {
        has,
        resolve,
        resolveCandidates: (candidates) => candidates.find((path) => exact.has(path)) ??
            candidates.map(equivalent).find((path) => path !== undefined),
        resolveAncestor: (path) => {
            for (let candidate = path; candidate !== "." && candidate !== "/"; candidate = posix.dirname(candidate)) {
                const found = resolve(candidate);
                if (found !== undefined)
                    return found;
            }
            return undefined;
        },
    };
};
/** Symlink evidence can originate on a different OS from the graph reader. */
export const isPortableAbsoluteReferenceTarget = (target) => target.startsWith("/") ||
    /^[A-Za-z]:[\\/]/u.test(target) ||
    /^\\\\[^\\/]+[\\/][^\\/]+/u.test(target);
/** Decode one historical inventory URL path; backslash remains a filename byte. */
export const decodeReferenceSourceModuleUrlPath = (value) => {
    if (/%2f/iu.test(value))
        return err("Historical module URL paths cannot contain percent-encoded slash bytes.");
    try {
        const decoded = decodeURIComponent(value);
        return decoded.includes("\0")
            ? err("The decoded historical module URL path contains NUL.")
            : ok(decoded);
    }
    catch (cause) {
        if (!(cause instanceof URIError))
            throw cause;
        return err("The historical module URL path contains malformed percent encoding.");
    }
};
