import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { AnalysisInputError, AnalysisAccessDeniedError, } from "../../domain/analysisErrorCore.js";
import { AnalysisCleanupLease } from "../../artifacts/AnalysisCleanupLease.js";
import { ArtifactFileCleanupFailure } from "../../artifacts/ArtifactFileOperation.js";
import { RegularFileCleanupFailure } from "../../filesystem/OwnedRegularFile.js";
import { readFileHandleChunks } from "../../filesystem/readFileHandleChunks.js";
import { streamChunkToBuffer } from "../../artifacts/StreamBytes.js";
import { ArtifactReaderFailure } from "../../artifacts/ArtifactReader.js";
import { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import { SafeOutputTree } from "../../artifacts/SafeOutputTree.js";
import { outputDirectoryAdmissionRefusal } from "../../artifacts/SafeOutputTreeAdmission.js";
import { SafeOutputTreeCreationFailure } from "../../artifacts/SafeOutputTreeCreationFailure.js";
import { RegularFileChangedError } from "../../filesystem/RegularFile.js";
import { withRegularFile } from "../RegularFileRead.js";
import { ENVIRONMENT_EXPORT_OPERATION, } from "./environmentBundle.js";
/**
 * A host failure on one file the bundle writer was reading or writing.
 * Descriptor operations such as `read`, `write` and `fsync` fail without a
 * path, so this names the file and the direction of the failed operation.
 */
export class BundleFileHostFailure extends Error {
    path;
    operation;
    constructor(path, operation, cause) {
        super(`${cause.message}, ${operation} ${path}`, { cause });
        this.path = path;
        this.operation = operation;
    }
}
/** An untyped host system failure, which carries an errno-style code. */
const isHostSystemFailure = (cause) => cause instanceof Error &&
    !(cause instanceof ArtifactReaderFailure) &&
    typeof Reflect.get(cause, "code") === "string";
/** Attribute a pathless host failure to the bundle file being written. */
const writingBundleFile = async (directory, relative, write) => {
    try {
        return await write();
    }
    catch (cause) {
        if (isHostSystemFailure(cause) && Reflect.get(cause, "path") === undefined)
            throw new BundleFileHostFailure(join(directory, relative), "writing", cause);
        throw cause;
    }
};
/** Read the admitted tarball, attributing host failures to the source. */
async function* tarballChunks(source) {
    try {
        yield* readFileHandleChunks(source.handle);
    }
    catch (cause) {
        if (isHostSystemFailure(cause))
            throw new BundleFileHostFailure(source.path, "reading", cause);
        throw cause;
    }
}
const writeBytes = async (tree, directory, relative, bytes) => {
    const written = await writingBundleFile(directory, relative, () => tree.write(relative, Readable.from([bytes]), {
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
    }));
    return { path: written.relativePath, bytes: written.bytesWritten };
};
/** Read and hash the admitted instance, checking its complete length without retaining its contents. */
export const bundleTarballDigest = async (source) => {
    const hash = createHash("sha256");
    let observed = 0;
    for await (const chunk of tarballChunks(source)) {
        const bytes = streamChunkToBuffer(chunk);
        observed += bytes.length;
        if (observed > source.size)
            throw new RegularFileChangedError(source.path);
        hash.update(bytes);
    }
    if (observed !== source.size)
        throw new RegularFileChangedError(source.path);
    return hash.digest("hex");
};
/** Hash and copy only the instance retained before destination admission. */
const writeTarball = async (tree, directory, relative, source) => {
    const sha256 = await bundleTarballDigest(source);
    const written = await writingBundleFile(directory, relative, () => tree.write(relative, Readable.from(tarballChunks(source)), {
        bytes: source.size,
        sha256,
    }));
    return { path: written.relativePath, bytes: written.bytesWritten };
};
/** The output owner anchors every create and verifies the complete tree before publication. */
const writeBundleFiles = async (input, plan, tarball) => {
    const resources = new ArtifactResourceScope();
    let tree;
    let written;
    let outcome;
    try {
        if (input.exclusiveDestination !== true)
            await mkdir(dirname(input.directory), { recursive: true, mode: 0o700 });
        try {
            tree = await SafeOutputTree.create(input.directory, process.platform, {
                acceptExistingEmpty: input.exclusiveDestination !== true,
            });
        }
        catch (cause) {
            if (cause instanceof SafeOutputTreeCreationFailure)
                tree = cause.tree;
            throw cause;
        }
        written = [];
        for (const file of plan.files)
            written.push(await writeBytes(tree, input.directory, file.path, Buffer.from(file.content)));
        written.push(await writeBytes(tree, input.directory, plan.copies.manifest, input.manifest.bytes));
        written.push(await writeBytes(tree, input.directory, plan.copies.evidence, input.evidence.bytes));
        if (plan.copies.tarball !== null && tarball !== undefined)
            written.push(await writeTarball(tree, input.directory, plan.copies.tarball, tarball));
        await tree.commit();
        outcome = { kind: "completed", files: written };
    }
    catch (cause) {
        outcome = { kind: "failed", cause };
    }
    const owner = tree;
    if (owner !== undefined) {
        const closed = await resources.release({
            kind: "lease",
            resource: input.directory,
            lease: { release: () => owner.closeHandles() },
        });
        if (closed.kind === "failed")
            throw resources.cleanupFailure(outcome, [closed]);
    }
    if (outcome.kind === "failed") {
        if (owner?.published === true && written !== undefined)
            return written;
        // Only a destination refusal can blame the selected directory.
        throw outputDirectoryAdmissionRefusal(ENVIRONMENT_EXPORT_OPERATION, "directory", outcome.cause);
    }
    return outcome.files;
};
/** A package tarball path that names no readable regular file. */
export const packageTarballRefusal = (path, cause) => new AnalysisInputError(ENVIRONMENT_EXPORT_OPERATION, {
    cause,
    userMessage: `${path} must name a readable regular package tarball.`,
}, [
    {
        path: ["package_tarball"],
        reason: "invalid_value",
        message: "The package tarball must be an existing regular file.",
    },
]);
/** Admit the package tarball once and retain it through `use`; a close it cannot confirm stays bound to its owner. */
export const withBundleTarball = async (path, use) => {
    const resources = new ArtifactResourceScope();
    let admitted = false;
    try {
        return await withRegularFile(path, async (handle, state) => {
            admitted = true;
            return use({ path, handle, size: state.size });
        }, { resources });
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure)
            throw new ArtifactFileCleanupFailure(cause, AnalysisCleanupLease.forCloseOwner(cause.owner, path));
        if (!admitted && cause instanceof Error && "code" in cause) {
            if (cause.code === "EACCES" || cause.code === "EPERM")
                throw new AnalysisAccessDeniedError(ENVIRONMENT_EXPORT_OPERATION, path, cause.code, { cause });
            if (["ENOENT", "ENOTDIR", "ENAMETOOLONG", "EISDIR", "ENOTFILE"].includes(String(cause.code)))
                throw packageTarballRefusal(path, cause);
        }
        throw cause;
    }
};
/** Retain one tarball instance across planning output writes and final stability verification. */
export const writeEnvironmentBundle = (input, plan) => plan.packageSource.kind === "tarball"
    ? withBundleTarball(plan.packageSource.path, (tarball) => writeBundleFiles(input, plan, tarball))
    : writeBundleFiles(input, plan);
