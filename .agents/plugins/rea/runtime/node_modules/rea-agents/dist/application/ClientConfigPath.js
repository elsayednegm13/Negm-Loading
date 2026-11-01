import { lstat, realpath } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
const systemFileSystem = { lstat, realpath };
/**
 * Resolve one stable transaction path for a configuration file.
 * An existing user-owned config symlink resolves to its target file.
 * Parent-directory aliases resolve for regular and missing files, so a
 * directory symlink and its real directory share one queue key. Missing
 * paths stay eligible for first-run creation.
 */
export const resolveClientConfigTransactionPath = async (requestedPath, fileSystem = systemFileSystem) => {
    let requestedStats;
    try {
        requestedStats = await fileSystem.lstat(requestedPath);
    }
    catch (cause) {
        if (!isMissing(cause))
            return undefined;
    }
    if (requestedStats?.isSymbolicLink() === true)
        return resolveOwnedConfigSymlink(requestedPath, requestedStats, fileSystem);
    return canonicalRegularConfigPath(requestedPath, fileSystem);
};
const resolveOwnedConfigSymlink = async (requestedPath, requestedStats, fileSystem) => {
    const currentUid = typeof process.getuid === "function" ? process.getuid() : undefined;
    if (currentUid === undefined ||
        requestedStats.uid !== currentUid ||
        fileSystem.realpath === undefined)
        return undefined;
    try {
        const canonicalPath = await fileSystem.realpath(requestedPath);
        const targetStats = await fileSystem.lstat(canonicalPath);
        return targetStats.isFile?.() === true && targetStats.uid === currentUid
            ? canonicalPath
            : undefined;
    }
    catch (cause) {
        // best-effort cleanup: unreadable or vanishing config paths mean no registration.
        void cause;
        return undefined;
    }
};
/**
 * Resolve parent-directory aliases, including when the file or an intermediate
 * directory is absent. A realpath failure keeps the requested spelling.
 */
const canonicalRegularConfigPath = async (requestedPath, fileSystem) => {
    if (fileSystem.realpath === undefined)
        return requestedPath;
    let ancestor = resolve(requestedPath);
    const missing = [];
    while (true) {
        try {
            return join(await fileSystem.realpath(ancestor), ...missing);
        }
        catch (cause) {
            if (!isAbsentPath(cause) || dirname(ancestor) === ancestor)
                return requestedPath;
            missing.unshift(basename(ancestor));
            ancestor = dirname(ancestor);
        }
    }
};
const isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
const isAbsentPath = (cause) => cause instanceof Error &&
    "code" in cause &&
    (cause.code === "ENOENT" || cause.code === "ENOTDIR");
