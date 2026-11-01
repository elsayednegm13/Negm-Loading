import { existsSync, statSync } from "node:fs";
import { win32 } from "node:path";
const splitWindowsPath = (value) => {
    const entries = [];
    let start = 0;
    let quoted = false;
    for (let index = 0; index < value.length; index += 1) {
        if (value[index] === '"')
            quoted = !quoted;
        else if (value[index] === ";" && !quoted) {
            entries.push(value.slice(start, index));
            start = index + 1;
        }
    }
    entries.push(value.slice(start));
    return entries.flatMap((entry) => {
        if (entry.startsWith('"') && entry.endsWith('"') && entry.length >= 2)
            return [entry.slice(1, -1)];
        return entry.includes('"') ? [] : [entry];
    });
};
const isRegularFile = (path) => {
    try {
        return existsSync(path) && statSync(path).isFile();
    }
    catch {
        return false;
    }
};
/** Resolve Windows bare command names against the captured child environment. */
export const resolveWindowsProviderExecutable = (executable, environment, lookup = {}) => {
    const cwd = lookup.cwd ?? process.cwd();
    const absolute = (...paths) => win32.resolve(cwd, ...paths);
    if (win32.isAbsolute(executable) ||
        executable.includes("/") ||
        executable.includes("\\") ||
        win32.parse(executable).root !== "")
        return absolute(executable);
    const pathValue = environment.PATH ?? environment.Path ?? environment.path;
    if (pathValue === undefined)
        return executable;
    const pathEntries = splitWindowsPath(pathValue);
    const explicitExtension = win32.extname(executable).toLowerCase();
    if (explicitExtension !== "" && ![".com", ".exe"].includes(explicitExtension))
        return executable;
    const extensions = explicitExtension !== ""
        ? [""]
        : (environment.PATHEXT ?? environment.PathExt ?? ".COM;.EXE")
            .split(";")
            .filter((extension) => [".com", ".exe"].includes(extension.toLowerCase()));
    for (const entry of pathEntries) {
        if (entry.length === 0)
            continue;
        for (const extension of extensions) {
            const candidate = absolute(entry, `${executable}${extension}`);
            if ((lookup.isFile ?? isRegularFile)(candidate))
                return candidate;
        }
    }
    return executable;
};
