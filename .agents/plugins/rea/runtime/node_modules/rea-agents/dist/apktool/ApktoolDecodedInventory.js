import { ok, err } from "../domain/result.js";
import { DirectoryArtifactTraversalLimit } from "../artifacts/DirectoryArtifactReader.js";
import { assertArtifactReadActive } from "../artifacts/ArtifactFileOperation.js";
import { classifyAndroidStringsTable } from "../domain/apktool/apktoolResourceAnalysis.js";
/** Count files over bounded examined coverage, including omitted special entries. */
export const countDecodedFiles = async (workspace, root, signal, maximumEntries) => {
    let count = 0;
    let capped = false;
    const locales = [];
    const otherStringsTables = [];
    const unreadableStringsTables = [];
    const observeTable = (path, kind) => {
        const match = /^res\/(values(?:-([^/]*))?)\/strings\.xml$/u.exec(path);
        if (match === null)
            return;
        if (kind !== "file") {
            unreadableStringsTables.push({ path, kind });
            return;
        }
        const suffix = match[2];
        if (suffix === undefined)
            return;
        const table = classifyAndroidStringsTable(suffix);
        if (table.kind === "locale")
            locales.push(table.locale);
        else
            otherStringsTables.push(match[1]);
    };
    const observation = () => {
        return {
            count,
            capped,
            locales: locales.sort(),
            otherStringsTables: otherStringsTables.sort(),
            unreadableStringsTables: unreadableStringsTables.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
        };
    };
    try {
        for await (const entry of workspace.entries(root, signal, maximumEntries, (omission) => observeTable(omission.path, omission.kind))) {
            assertArtifactReadActive(signal);
            observeTable(entry.path, entry.kind);
            if (entry.kind === "file")
                count += 1;
        }
    }
    catch (cause) {
        if (!(cause instanceof DirectoryArtifactTraversalLimit))
            return err({ cause, partial: observation() });
        capped = true;
    }
    return ok(observation());
};
