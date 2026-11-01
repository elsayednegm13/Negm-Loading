import { lstat, readdir } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
/** Reject unowned, missing or replaced entries before an output tree is published. */
export const assertExactTreeEntries = async (root, directories, files) => {
    const expected = new Map();
    expected.set(root, new Set());
    for (const directory of directories.keys())
        expected.set(directory, new Set());
    for (const path of directories.keys())
        expected.get(dirname(path))?.add(basename(path));
    for (const path of files.keys())
        expected.get(dirname(path))?.add(basename(path));
    for (const [directory, names] of expected) {
        const entries = await readdir(directory);
        const remaining = new Map();
        for (const name of names) {
            const key = name.normalize("NFC");
            remaining.set(key, (remaining.get(key) ?? 0) + 1);
        }
        let unexpected = entries.length !== names.size;
        for (const entry of entries) {
            const key = entry.normalize("NFC");
            const count = remaining.get(key) ?? 0;
            if (count === 0)
                unexpected = true;
            else
                remaining.set(key, count - 1);
        }
        // HFS+ can return an equivalent decomposed spelling. Counts avoid merging
        // distinct Linux names; the original paths must still resolve to owned IDs.
        if (unexpected)
            throw new ArtifactReaderFailure("path", `Unowned or missing output entries: ${directory}`);
    }
    for (const [path, identity] of files)
        await assertFilePathIdentity(path, identity);
};
export const readDirectoryIdentity = async (path) => {
    const metadata = await lstat(path, { bigint: true });
    if (!metadata.isDirectory())
        throw new ArtifactReaderFailure("path", `Output destination must be a directory: ${path}`);
    return { dev: metadata.dev, ino: metadata.ino };
};
export const assertPathIdentity = async (path, expected) => {
    const metadata = await lstat(path, { bigint: true });
    if (!metadata.isDirectory() ||
        metadata.dev !== expected.dev ||
        metadata.ino !== expected.ino)
        throw replacedDirectory(path);
};
export const assertHandleIdentity = async (handle, expected, path) => {
    const metadata = await handle.stat({ bigint: true });
    if (!metadata.isDirectory() ||
        metadata.dev !== expected.dev ||
        metadata.ino !== expected.ino)
        throw replacedDirectory(path);
};
export const readFileIdentity = async (handle, path) => {
    const metadata = await handle.stat({ bigint: true });
    if (!metadata.isFile())
        throw new ArtifactReaderFailure("path", `Extraction file identity changed: ${path}`);
    return { dev: metadata.dev, ino: metadata.ino };
};
export const assertFilePathIdentity = async (path, expected) => {
    const metadata = await lstat(path, { bigint: true });
    if (!metadata.isFile() ||
        metadata.dev !== expected.dev ||
        metadata.ino !== expected.ino)
        throw new ArtifactReaderFailure("path", `Extraction file identity changed: ${path}`);
};
export const isAbsent = async (path) => lstat(path).then(() => false, (cause) => {
    if (isNotFound(cause))
        return true;
    throw cause;
});
export const replacedDirectory = (path) => new ArtifactReaderFailure("path", `Extraction directory identity changed: ${path}`);
const isNotFound = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
