import { lstat } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
import { err, ok } from "../domain/result.js";
/** Windows' roaming and local application data roots; empty means unset. */
export const windowsAppDataRoots = (home, env) => ({
    roaming: env.APPDATA || join(home, "AppData", "Roaming"),
    local: env.LOCALAPPDATA || join(home, "AppData", "Local"),
});
/** The per-user root of MSIX package data containers. */
export const msixPackagesDirectory = (home, env) => join(windowsAppDataRoots(home, env).local, "Packages");
/** Whether `path` is `root` or inside it, using the host's path comparison. */
const pathWithin = (path, root) => {
    const inner = relative(root, path);
    return (inner === "" ||
        (inner !== ".." && !inner.startsWith(`..${sep}`) && !isAbsolute(inner)));
};
/**
 * Name the package whose private `LocalCache` holds a canonical path. Its
 * processes see those files at virtual AppData locations; other processes do
 * not, and Windows removes them with the package.
 */
export const packagePrivateStorageFamily = (canonicalPath, packagesDirectory) => {
    if (!pathWithin(canonicalPath, packagesDirectory))
        return undefined;
    const [family, storage] = relative(packagesDirectory, canonicalPath).split(/[\\/]/u);
    return family !== undefined &&
        family !== "" &&
        storage?.toLowerCase() === "localcache"
        ? family
        : undefined;
};
/**
 * Explain why setup must not register a launcher that exists only in one
 * package's private storage. Other clients could not start it, and doctor
 * outside that package could not verify it.
 */
export const packagePrivateLauncherBlocker = (command, packagesDirectory, canonicalPath = realpathSync.native) => {
    // Compare canonical forms: a short-name, junctioned or substituted profile
    // spells the same directory differently.
    let packages = packagesDirectory;
    try {
        packages = canonicalPath(packagesDirectory);
    }
    catch (cause) {
        // Without package storage, the spelled path is the only comparison.
        void cause;
    }
    for (const part of command) {
        if (!isAbsolute(part))
            continue;
        let resolved;
        try {
            resolved = canonicalPath(part);
        }
        catch (cause) {
            // A launcher that cannot be resolved is not evidence of package storage.
            void cause;
            continue;
        }
        const family = packagePrivateStorageFamily(resolved, packages);
        if (family !== undefined)
            return `The REA launcher ${part} is stored at ${resolved}, inside the private storage of MSIX package ${family}. Only processes started by that app can see it at ${part}, and Windows removes it with the package, so other clients could not start this registration. Install REA from a terminal that the app did not start (for example with \`npm install -g rea-agents\`), then rerun setup from that terminal.`;
    }
    return undefined;
};
/**
 * Explain why this process must not write `targets`: the running package
 * started it, so writes under its virtualized roots land in that package's
 * private storage, which the targets' owners never read.
 */
const canonicalDestination = (path, canonicalPath) => {
    let ancestor = path;
    const missing = [];
    while (true) {
        try {
            return ok(join(canonicalPath(ancestor), ...missing));
        }
        catch (cause) {
            if (cause instanceof Error &&
                "code" in cause &&
                (cause.code === "ENOENT" || cause.code === "ENOTDIR") &&
                dirname(ancestor) !== ancestor) {
                missing.unshift(basename(ancestor));
                ancestor = dirname(ancestor);
                continue;
            }
            return err({
                path,
                detail: cause instanceof Error ? cause.message : String(cause),
            });
        }
    }
};
export const redirectedWriteBlocker = (view, targets, operation, canonicalPath = realpathSync.native) => {
    if (view?.processView !== "redirected" || targets.length === 0)
        return undefined;
    const roots = [];
    const redirected = [];
    for (const root of view.virtualizedRoots) {
        const resolved = canonicalDestination(root, canonicalPath);
        if (!resolved.ok)
            return `Cannot establish the MSIX write location for ${resolved.error.path}: ${resolved.error.detail}. Rerun ${operation} from a terminal that this app did not start.`;
        roots.push(resolved.value);
    }
    for (const target of targets) {
        const resolved = canonicalDestination(target, canonicalPath);
        if (!resolved.ok)
            return `Cannot establish the MSIX write location for ${resolved.error.path}: ${resolved.error.detail}. Rerun ${operation} from a terminal that this app did not start.`;
        if (roots.some((root) => pathWithin(resolved.value, root)))
            redirected.push(target);
    }
    if (redirected.length === 0)
        return undefined;
    return `This process was started by MSIX package ${view.packageFamilyName}, which redirects its writes under ${view.virtualizedRoots.join(" and ")} into the package's private storage. Changes to ${redirected.join(", ")} would not reach the files other apps read. Rerun ${operation} from a terminal that this app did not start.`;
};
/**
 * Whether the package began reading its private copy after the AppData file
 * was chosen, for example by saving its settings when it quit.
 */
export const packageReadTargetChanged = async (view, configPath) => {
    if (configPath !== view.appDataConfigPath)
        return ok(false);
    try {
        await lstat(view.privateConfigPath);
        return ok(true);
    }
    catch (cause) {
        if (cause instanceof Error &&
            "code" in cause &&
            (cause.code === "ENOENT" || cause.code === "ENOTDIR"))
            return ok(false);
        return err({
            _tag: "MsixReadTargetInspectionFailure",
            path: view.privateConfigPath,
            detail: cause instanceof Error ? cause.message : String(cause),
            cause,
        });
    }
};
