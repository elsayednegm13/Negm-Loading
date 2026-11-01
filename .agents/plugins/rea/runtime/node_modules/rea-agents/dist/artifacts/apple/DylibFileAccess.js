import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { NonRegularFileReadError, isSelectedRegularFileError, sameRegularFileState, } from "../../filesystem/RegularFile.js";
import { ArtifactReaderFailure, sameArtifactSourceIdentity, } from "../ArtifactReader.js";
import { assertArtifactReadActive, mapArtifactFileFailure, withArtifactRegularFile, } from "../ArtifactFileOperation.js";
import { readArtifactFileChunks } from "../readArtifactFileChunks.js";
import { hasMachoMagic, readMachoImage } from "./MachoLoadCommandReader.js";
/** One owner for dyld descriptor admission, physical identity and finalization. */
export class DylibFileAccess {
    resources;
    root;
    signal;
    constructor(resources, root, signal) {
        this.resources = resources;
        this.root = root;
        this.signal = signal;
    }
    startsWithMachoMagic(entry) {
        return this.#read(entry.adapterKey, async (file, initial) => {
            if (!sameArtifactSourceIdentity(entry.sourceIdentity, initial))
                throw changed(entry.adapterKey);
            const bytes = new Uint8Array(4);
            const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
            return hasMachoMagic(bytes.subarray(0, bytesRead));
        });
    }
    image(path) {
        return this.#read(path, async (file, identity) => {
            const size = Number(identity.size);
            if (!Number.isSafeInteger(size))
                throw new ArtifactReaderFailure("limit", `Mach-O file extent is not safely addressable: ${path}`);
            const facts = await readMachoImage(async (offset, length) => {
                assertArtifactReadActive(this.signal);
                const bytes = new Uint8Array(Math.max(0, Math.min(length, size - offset)));
                const { bytesRead } = await file.read(bytes, 0, bytes.length, offset);
                assertArtifactReadActive(this.signal);
                return bytes.subarray(0, bytesRead);
            }, size);
            return { facts, identity };
        });
    }
    sha256(path, expected) {
        return this.#read(path, async (file, initial) => {
            if (expected !== undefined && !sameRegularFileState(expected, initial))
                throw changed(path);
            const hash = createHash("sha256");
            // Admit the extent plus one byte to detect growth without following an
            // actively appended file indefinitely. The descriptor remains owned.
            const source = readArtifactFileChunks(file, {
                end: initial.size,
                signal: this.signal,
            });
            for await (const chunk of source)
                hash.update(chunk);
            const coverage = source.readCoverage();
            if (coverage.kind !== "complete" || coverage.bytes !== initial.size)
                throw changed(path);
            return hash.digest("hex");
        });
    }
    async #read(path, operation) {
        try {
            return await withArtifactRegularFile(path, this.resources, this.signal, async ({ handle: file }) => {
                const initial = await file.stat({ bigint: true });
                assertArtifactReadActive(this.signal);
                const result = await operation(file, initial);
                // Parsed headers, magic and digest must refer to the same physical
                // version still selected by the pathname when the read completes.
                const opened = await file.stat({ bigint: true });
                let named;
                try {
                    named = await lstat(path, { bigint: true });
                }
                catch (cause) {
                    if (!isSelectedRegularFileError(cause))
                        throw cause;
                    throw changed(path, cause);
                }
                if (!sameRegularFileState(initial, opened) ||
                    !sameRegularFileState(initial, named))
                    throw changed(path);
                assertArtifactReadActive(this.signal);
                return result;
            });
        }
        catch (cause) {
            throw classifyDylibReadFailure(this.root, cause);
        }
    }
}
/** Normalize dyld admission and permission facts inside their physical outcome. */
export const classifyDylibReadFailure = (root, cause) => mapArtifactFileFailure(cause, (primary) => {
    if (primary instanceof NonRegularFileReadError)
        return new ArtifactReaderFailure("format", `Dyld input is not a regular file: ${primary.path}`, { cause: primary });
    if (primary instanceof Error &&
        "code" in primary &&
        (primary.code === "EACCES" || primary.code === "EPERM")) {
        const path = "path" in primary && typeof primary.path === "string"
            ? primary.path
            : undefined;
        const display = path === undefined
            ? "a file in the analyzed root"
            : deniedDisplayPath(root, path);
        return new ArtifactReaderFailure("unavailable", `Permission denied (${primary.code}) reading ${display}`, { cause: primary });
    }
    return primary;
});
const deniedDisplayPath = (root, path) => {
    const inside = relative(root, path);
    const outside = isAbsolute(inside) || inside === ".." || inside.startsWith(`..${sep}`);
    return inside === "" || outside ? path : inside;
};
const changed = (path, cause) => new ArtifactReaderFailure("integrity", `${path} changed while its dyld load commands were traced`, cause === undefined ? undefined : { cause });
