import { posix } from "node:path";
import { domainToASCII, fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
/** Map-scoped source declaration and its path interpretation for matching. */
export const javascriptSourceMapReferenceSchema = z.strictObject({
    source_name: z.string(),
    source_root: z.string().nullable(),
    map_path: z.string().min(1),
    resolution: z.discriminatedUnion("kind", [
        z.strictObject({
            kind: z.enum(["artifact-relative", "suffix"]),
            path: z.string().min(1),
        }),
        z.strictObject({
            kind: z.literal("unresolved"),
            reason: z.string().min(1),
        }),
    ]),
});
/** Interpret declarations together once at their source-map ingestion boundary. */
export const resolveJavaScriptSourceMapReferences = (sourceNames, sourceRoot, mapPath) => {
    return sourceNames.map((sourceName) => {
        if (sourceName === null)
            return null;
        return {
            source_name: sourceName,
            source_root: sourceRoot,
            map_path: mapPath,
            resolution: resolveJavaScriptSourceMapPath(sourceMapReference(sourceName, sourceRoot), mapPath),
        };
    });
};
/** Resolve one source declaration with ECMA-426's WHATWG URL parsing rule. */
export const resolveJavaScriptSourceMapUrl = (source, sourceRoot, mapUrl) => {
    if (source === null)
        return null;
    return (URL.parse(sourceMapReference(source, sourceRoot), mapUrl)?.href ?? null);
};
const sourceMapReference = (source, sourceRoot) => {
    if (sourceRoot == null)
        return source;
    return `${sourceRoot}${sourceRoot.endsWith("/") ? "" : "/"}${source}`;
};
/** Resolve a source-map URL reference without changing its recorded identity. */
const resolveJavaScriptSourceMapPath = (source, mapPath) => {
    const portable = source.replaceAll("\\", "/");
    const windowsPath = /^[a-z]:\//iu.test(portable) || source.startsWith("\\\\");
    // Preserve parent traversal rather than letting URL resolution clamp at '/'.
    const anchor = `/${"source/".repeat(portable.split("/").length + 1)}`;
    const directory = posix.join(anchor, posix.dirname(mapPath));
    const base = pathToFileURL(`${directory}/`, { windows: false });
    const absolute = windowsPath ? windowsFileUrl(source) : URL.parse(source);
    const resolved = windowsPath ? absolute : URL.parse(source, base);
    if (resolved === null)
        return {
            kind: "unresolved",
            reason: "Source reference is not a valid URL or filesystem path.",
        };
    if (!resolved.pathname.startsWith("/"))
        return {
            kind: "unresolved",
            reason: "Source reference uses a non-hierarchical URL without a file pathname.",
        };
    if (resolved.pathname.endsWith("/"))
        return {
            kind: "unresolved",
            reason: "Source reference names a directory rather than a file.",
        };
    // Reject separators in declarations, not escaped literal names in the owned base.
    const declaredPath = windowsPath
        ? (absolute?.pathname ?? "")
        : (URL.parse(source, "file:///")?.pathname ?? "");
    if (/%(?:2f|5c)/iu.test(declaredPath))
        return {
            kind: "unresolved",
            reason: "Source reference contains an encoded path separator.",
        };
    const relative = absolute === null
        ? !portable.startsWith("/")
        : absolute.href !== resolved.href;
    const path = decodedUrlPath(resolved);
    if (path === null)
        return {
            kind: "unresolved",
            reason: "Source reference has malformed URL encoding or an invalid file URL.",
        };
    const value = relative
        ? posix.relative(anchor, path)
        : path.replace(/^\/+/, "");
    if (value === "" || value === ".." || value.startsWith("../"))
        return {
            kind: "unresolved",
            reason: "Source reference resolves outside the inventoried artifact.",
        };
    return { path: value, kind: relative ? "artifact-relative" : "suffix" };
};
// Reject URL delimiters/escapes before IDNA can truncate or decode the host.
const unusableHost = /[\0\t\n\r #/:<>?@[\\\]^|%]/u;
// URL/IDNA validation also rejects Unicode hosts that normalize to empty.
const carriesUsableHost = (host) => !unusableHost.test(host) && domainToASCII(host) !== "";
const windowsFileUrl = (path) => {
    // A malformed UNC host aborts pathToFileURL() on the Node builds this
    // package admits, so decline the reference before handing the path over
    // rather than trusting a TypeError that never arrives.
    if (path.startsWith("\\\\") &&
        !carriesUsableHost(path.slice(2).split("\\")[0] ?? ""))
        return null;
    try {
        return pathToFileURL(path, { windows: true });
    }
    catch (cause) {
        if (cause instanceof TypeError)
            return null;
        throw cause;
    }
};
const decodedUrlPath = (url) => {
    try {
        if (url.protocol === "file:") {
            const windows = url.hostname !== "" && url.hostname !== "localhost";
            const path = fileURLToPath(url, { windows });
            return windows ? path.replaceAll("\\", "/") : path;
        }
        return `${url.host}${decodeURIComponent(url.pathname)}`;
    }
    catch (cause) {
        if (cause instanceof URIError || cause instanceof TypeError)
            return null;
        throw cause;
    }
};
