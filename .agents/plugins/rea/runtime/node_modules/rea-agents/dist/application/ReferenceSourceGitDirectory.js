import { lstat, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";
import { absoluteCallerPath } from "../filesystem/callerPath.js";
/** Locate the nearest repository without running Git or following config includes. */
export const locateReferenceSourceGitDirectory = async (root, readText, signal) => {
    let repository = root;
    for (;;) {
        signal?.throwIfAborted();
        const dotgit = join(repository, ".git");
        let metadata;
        try {
            metadata = await lstat(dotgit);
        }
        catch (cause) {
            if (!hasCode(cause, "ENOENT"))
                throw cause;
            const parent = dirname(repository);
            if (parent === repository)
                return undefined;
            repository = parent;
            continue;
        }
        let selectedGitDirectory = dotgit;
        if (metadata.isFile()) {
            const pointer = (await readText(dotgit)).replace(/\r?\n$/u, "");
            if (!pointer.startsWith("gitdir: ") || pointer.length === 8)
                throw new Error("Invalid Git directory pointer");
            selectedGitDirectory = absoluteCallerPath(pointer.slice(8), {
                cwd: repository,
            });
        }
        // Derived joins and the Git library normalize paths lexically. Admit the
        // physical directory first, while the source pointer stays in its file.
        const gitDirectory = await realpath(selectedGitDirectory);
        let common;
        try {
            common = (await readText(join(gitDirectory, "commondir"))).replace(/\r?\n$/u, "");
        }
        catch (cause) {
            if (!hasCode(cause, "ENOENT"))
                throw cause;
        }
        if (common === "")
            throw new Error("Invalid Git common-directory pointer");
        const commonDirectory = common === undefined
            ? gitDirectory
            : await realpath(absoluteCallerPath(common, { cwd: gitDirectory }));
        return { repository, gitDirectory, commonDirectory };
    }
};
const hasCode = (cause, code) => typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === code;
