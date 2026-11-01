import { createHash } from "node:crypto";
import { lstat, opendir, realpath } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { z } from "zod";
import { sameRegularFileState } from "../filesystem/RegularFile.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, } from "../domain/analysisErrorCore.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { err, ok } from "../domain/result.js";
import { parseGhidraJavaProperties } from "./GhidraJavaProperties.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { AnalysisCleanupLease } from "../artifacts/AnalysisCleanupLease.js";
import { OwnedDirectoryHandle } from "../filesystem/OwnedDirectoryHandle.js";
import { assertArtifactReadActive, artifactFileCancellationCause, artifactFilePrimaryFacts, bindArtifactFileCleanup, withArtifactRegularFile, } from "../artifacts/ArtifactFileOperation.js";
/** Installed processor code and data, distinct from REA's analysis-extension ABI. */
export const ghidraPspExtensionSchema = z.strictObject({
    id: z.literal("ghidra-allegrex"),
    root: z.string().refine(isAbsolute),
    ghidra_version: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
});
// Resource bounds for scanning a caller-installed extension, not target limits.
const MAX_ENTRIES = 1024;
const MAX_BYTES = 64 * 1024 * 1024;
const MAX_DEPTH = 16;
const REQUIRED = [
    "Module.manifest",
    "extension.properties",
    "data/languages/allegrex.ldefs",
    "data/languages/allegrex.sla",
    "data/languages/allegrex.pspec",
    "data/languages/allegrex.cspec",
];
/** Read-only fingerprint of all installed files; no home scanning or installation. */
export const inspectGhidraPspExtension = async (root, ghidraVersion, resources, signal) => {
    try {
        return await resources.run(() => fingerprint(root, ghidraVersion, resources, signal));
    }
    catch (cause) {
        throw ghidraPspInspectionError(cause);
    }
};
const fingerprint = async (root, ghidraVersion, resources, signal) => {
    assertArtifactReadActive(signal);
    if (!isAbsolute(root) || (await realpath(root)) !== root)
        throw new Error("The installed Allegrex directory must be a canonical non-symlink path.");
    const files = [];
    let entries = 1; // The root itself consumes one inventory entry.
    const visit = async (relative, depth) => {
        assertArtifactReadActive(signal);
        if (depth > MAX_DEPTH)
            throw new Error("Allegrex extension directory nesting exceeds the inspection limit.");
        const path = join(root, relative);
        const metadata = await lstat(path);
        if (metadata.isDirectory()) {
            const children = await readChildren(path, MAX_ENTRIES - entries, resources, signal);
            entries += children.length;
            children.sort();
            for (const child of children)
                await visit(relative === "" ? child : `${relative}/${child}`, depth + 1);
        }
        else if (metadata.isFile()) {
            files.push(relative);
        }
        else
            throw new Error(`Allegrex extension entries must be regular files or directories: ${relative}`);
    };
    await visit("", 0);
    for (const required of REQUIRED)
        if (!files.includes(required))
            throw new Error(`Missing installed Allegrex component: ${required}`);
    if (!files.some((path) => path.startsWith("lib/") && path.endsWith(".jar")))
        throw new Error("The installed Allegrex extension has no loader JAR.");
    const hash = createHash("sha256");
    let bytesRead = 0;
    let properties = Buffer.alloc(0);
    for (const relative of files) {
        assertArtifactReadActive(signal);
        const path = join(root, relative);
        await withArtifactRegularFile(path, resources, signal, async ({ handle, initial: before }) => {
            if (!Number.isSafeInteger(before.size) ||
                before.size > MAX_BYTES - bytesRead)
                throw new Error("Allegrex extension bytes exceed the inspection limit.");
            if (relative === "extension.properties" && before.size > 65536)
                throw new Error("Allegrex extension properties exceed the inspection limit.");
            hash.update(JSON.stringify([relative, before.size]));
            const buffer = Buffer.alloc(Math.min(65536, before.size + 1));
            let offset = 0;
            const chunks = [];
            // Serial reads keep final close behind every native read. One extra byte
            // detects growth without a stream's read-ahead or unbounded allocation.
            while (offset <= before.size) {
                assertArtifactReadActive(signal);
                const { bytesRead } = await handle.read(buffer, 0, Math.min(buffer.length, before.size - offset + 1), offset);
                assertArtifactReadActive(signal);
                if (bytesRead === 0)
                    break;
                offset += bytesRead;
                if (offset > before.size)
                    throw new Error(`Allegrex component changed during inspection: ${relative}`);
                const chunk = buffer.subarray(0, bytesRead);
                hash.update(chunk);
                if (relative === "extension.properties")
                    chunks.push(Buffer.from(chunk));
            }
            if (offset !== before.size)
                throw new Error(`Truncated Allegrex component: ${relative}`);
            if (!sameRegularFileState(before, await handle.stat()) ||
                !sameRegularFileState(before, await lstat(path)))
                throw new Error(`Allegrex component changed during inspection: ${relative}`);
            bytesRead += before.size;
            if (relative === "extension.properties")
                properties = Buffer.concat(chunks);
        });
    }
    // Ghidra's extension.properties version is the compatible Ghidra version,
    // not the extension release (e.g. v21.4); content identity supplies the latter.
    const parsedProperties = parseGhidraJavaProperties(properties.toString("latin1"));
    if (!parsedProperties.ok)
        throw new Error(`Invalid Allegrex extension properties: ${parsedProperties.error}`);
    const property = (name) => parsedProperties.value.get(name);
    if (property("name") !== "ghidra-allegrex" ||
        property("version") !== ghidraVersion)
        throw new Error(`Allegrex extension metadata does not match the selected Ghidra ${ghidraVersion}; install or rebuild a compatible extension.`);
    assertArtifactReadActive(signal);
    return {
        id: "ghidra-allegrex",
        root,
        ghidra_version: ghidraVersion,
        sha256: hash.digest("hex"),
    };
};
/** Resolve prerequisites before opening or admitting cached PSP analysis. */
export const resolveGhidraPspExtension = async (installation, resources, signal) => {
    try {
        assertArtifactReadActive(signal);
        if (installation.status !== "available" ||
            installation.platform !== "linux" ||
            installation.architecture !== "x64")
            throw new Error("The initial PSP profile requires a supported Linux x64 Ghidra installation.");
        const root = join(await realpath(installation.installDir), "Ghidra", "Extensions", "ghidra-allegrex");
        return ok(await inspectGhidraPspExtension(root, installation.providerVersion, resources, signal));
    }
    catch (cause) {
        return err(ghidraPspInspectionError(cause));
    }
};
/** Preserve the producer's primary failure and its live cleanup dependencies. */
const ghidraPspInspectionError = (cause) => {
    if (cause instanceof AnalysisError)
        return cause;
    const cleanup = cause instanceof ArtifactReaderFailure ? cause.cleanup : undefined;
    const { cause: primary } = artifactFilePrimaryFacts(cause);
    const reason = `PSP_EXTENSION_UNAVAILABLE: ${primary instanceof Error ? primary.message : String(primary)} Use a compatible caller-installed ghidra-allegrex under GHIDRA_INSTALL_DIR/Ghidra/Extensions; REA does not install it.`;
    const error = cause instanceof ArtifactReaderFailure && cause.reason === "cancelled"
        ? new AnalysisCancelledError("resolve_analysis_profile", {
            cause: artifactFileCancellationCause(cause),
            cleanup,
        })
        : new AnalysisCapabilityUnavailableError("ghidra", "resolve_analysis_profile", reason, {
            cause,
            userMessage: reason,
            cleanup,
        });
    bindArtifactFileCleanup(cause, error);
    return error;
};
/** Close before descending, retaining the exact directory owner on uncertainty. */
const readChildren = async (path, remainingEntries, resources, signal) => {
    assertArtifactReadActive(signal);
    const owner = new OwnedDirectoryHandle(await opendir(path));
    let outcome;
    try {
        const names = [];
        for (;;) {
            assertArtifactReadActive(signal);
            const child = await owner.handle.read();
            assertArtifactReadActive(signal);
            if (child === null)
                break;
            if (names.length >= remainingEntries)
                throw new Error("Allegrex extension inventory exceeds the inspection limit.");
            names.push(child.name);
        }
        outcome = { kind: "completed", names };
    }
    catch (cause) {
        outcome = { kind: "failed", cause };
    }
    const lease = new AnalysisCleanupLease(() => owner.close(), [path]);
    const attempt = await resources.release({
        kind: "lease",
        resource: path,
        lease,
    });
    if (attempt.kind === "failed") {
        const primary = outcome.kind === "failed"
            ? outcome.cause
            : signal?.aborted
                ? new ArtifactReaderFailure("cancelled", "PSP inspection cancelled during directory close", { cause: signal.reason })
                : attempt.cause;
        const error = ghidraPspInspectionError(ArtifactReaderFailure.withCleanup(primary, ArtifactReaderFailure.cleanupObservation(attempt.cause, path)));
        lease.bindCleanupError(error);
        throw error;
    }
    if (outcome.kind === "failed")
        throw outcome.cause;
    assertArtifactReadActive(signal);
    return outcome.names;
};
