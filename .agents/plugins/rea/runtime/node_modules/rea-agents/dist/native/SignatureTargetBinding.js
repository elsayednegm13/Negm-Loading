import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { basename, join } from "node:path";
import { assertRegularFileActive, RegularFileOperationCancelled, } from "../filesystem/RegularFile.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisAccessDeniedError, AnalysisArtifactChangedError, AnalysisCancelledError, AnalysisOutputError, AnalysisResourceConstraintError, } from "../domain/analysisErrorCore.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { err, ok } from "../domain/result.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { PrivateRuntimeRoot } from "../process/PrivateRuntimeRoot.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { bindArtifactFileCleanup } from "../artifacts/ArtifactFileOperation.js";
import { NATIVE_MACOS_PROVIDER_IDENTITY } from "./NativeMacOSProviderMetadata.js";
const identity = (stat) => [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(":");
const changedTarget = (target, reason) => err(new AnalysisArtifactChangedError("inspect_signature", target.path, reason));
const signatureReadFailure = (target, cause) => {
    if (cause instanceof RegularFileOperationCancelled)
        return new AnalysisCancelledError("inspect_signature", {
            cause: cause.reason,
        });
    if (cause instanceof AnalysisError)
        return cause;
    const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
    if (code === "EACCES" || code === "EPERM")
        return new AnalysisAccessDeniedError("inspect_signature", target.path, code, { cause });
    if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP")
        return new AnalysisArtifactChangedError("inspect_signature", target.path, `Registered signature target is no longer readable (${code}): ${target.path}`, { cause });
    return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
        cause,
        diagnostics: {
            path: target.path,
            phase: "target-version-binding",
            system_code: typeof code === "string" ? code : null,
            reason: cause instanceof Error ? cause.message : String(cause),
        },
    });
};
/** Inspect a digest-verified private copy, releasing it on every exit path. */
export const withSignatureTarget = async (target, resources, inspect, signal, createRoot = () => PrivateRuntimeRoot.create({ prefix: "rea-signature-" })) => {
    try {
        return await resources.run(async () => {
            let root;
            try {
                assertRegularFileActive(signal);
                root = await createRoot();
            }
            catch (cause) {
                return err(cause instanceof RegularFileOperationCancelled
                    ? signatureReadFailure(target, cause)
                    : snapshotFailure(target, "create", cause));
            }
            const children = new ArtifactResourceScope();
            const owner = {
                kind: "lease",
                lease: new AnalysisCleanupLease(async () => {
                    await children.close();
                    await root.close();
                }, {
                    get cleanupResources() {
                        return [...children.cleanupResources, root.path];
                    },
                }),
                resource: root.path,
            };
            let result;
            try {
                const binding = await bindSignatureTarget(target, join(root.path, basename(target.path)), children, signal);
                if (!binding.ok)
                    result = binding;
                else {
                    try {
                        result = await inspect(binding.value);
                    }
                    catch (cause) {
                        result = err(new AnalysisOutputError("inspect_signature", "Native output parsing failed", { cause }));
                    }
                }
            }
            catch (cause) {
                result = err(signatureReadFailure(target, cause));
            }
            const cleanup = await resources.release(owner);
            if (result.ok && signal?.aborted)
                result = err(new AnalysisCancelledError("inspect_signature", {
                    cause: signal.reason,
                    partialObservation: result.value,
                }));
            if (cleanup.kind === "failed") {
                const failure = signatureCleanupFailure(target, [root.path], cleanup.cause, "cleanup");
                new AnalysisCleanupLeaseGroup(failure, [owner.lease]);
                return combineCleanupFailure(result, failure);
            }
            return result;
        });
    }
    catch (cause) {
        const retained = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined
            ? cause.cleanup
            : undefined;
        if (retained !== undefined) {
            const failure = signatureCleanupFailure(target, retained.resources, cause, "retry");
            bindArtifactFileCleanup(cause, failure);
            return combineCleanupFailure(err(signatureReadFailure(target, cause)), failure);
        }
        return err(signatureReadFailure(target, cause));
    }
};
/** Each composed error follows the exact primary and secondary cleanup owners. */
const combineCleanupFailure = (primary, cleanup) => primary.ok
    ? err(cleanup)
    : err(analysisErrorWithCleanupFailure(primary.error, cleanup, "inspect_signature").bindCleanupDependencies([primary.error, cleanup]));
const signatureCleanupFailure = (target, resources, cause, phase) => new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, resources, {
    reason: cause instanceof Error ? cause.message : String(cause),
    phase: `signature-snapshot-${phase}`,
    path: target.path,
}, { operation: "inspect_signature", cause });
const snapshotFailure = (target, phase, cause) => new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
    cause,
    diagnostics: {
        path: target.path,
        phase: `signature-snapshot-${phase}`,
        reason: cause instanceof Error ? cause.message : String(cause),
    },
});
const snapshotIO = async (target, phase, operation) => {
    try {
        return await operation();
    }
    catch (cause) {
        throw snapshotFailure(target, phase, cause);
    }
};
const copySignatureBytes = async (target, source, snapshot, signal) => {
    const size = Number(source.stat.size);
    if (!Number.isSafeInteger(size))
        throw new AnalysisResourceConstraintError("inspect_signature", "file-size", `Signature target size is not exactly representable: ${target.path}`, null);
    const hash = createHash("sha256");
    const chunk = Buffer.alloc(64 * 1024);
    let position = 0;
    while (position < size) {
        assertRegularFileActive(signal);
        const { bytesRead } = await source.file.read(chunk, 0, Math.min(chunk.length, size - position), position);
        assertRegularFileActive(signal);
        if (bytesRead === 0)
            throw new AnalysisArtifactChangedError("inspect_signature", target.path, `Signature target was truncated while hashing: ${target.path}`);
        const bytes = chunk.subarray(0, bytesRead);
        hash.update(bytes);
        // writeFile retries short writes; memory remains bounded to this chunk.
        await snapshotIO(target, "write", () => snapshot.writeFile(bytes));
        position += bytesRead;
    }
    return hash.digest("hex");
};
/** Hash and copy the same descriptor bytes, without reopening the mutable path. */
const bindSignatureTarget = async (target, snapshotPath, resources, signal) => {
    let sourceOwner;
    let snapshotOwner;
    const perform = async () => {
        try {
            assertRegularFileActive(signal);
            const before = await lstat(target.path, { bigint: true });
            assertRegularFileActive(signal);
            if (!before.isFile() || before.isSymbolicLink())
                return changedTarget(target, `Signature target is no longer a regular file: ${target.path}`);
            const file = await open(target.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
            const sourceHandle = new OwnedFileHandle(file);
            sourceOwner = {
                kind: "lease",
                resource: target.path,
                lease: new AnalysisCleanupLease(() => sourceHandle.close(), [target.path]),
            };
            const opened = await file.stat({ bigint: true });
            assertRegularFileActive(signal);
            if (identity(opened) !== identity(before))
                return changedTarget(target, `Signature target changed before open: ${target.path}`);
            const snapshot = await snapshotIO(target, "create-file", () => open(snapshotPath, "wx", 0o600));
            const snapshotHandle = new OwnedFileHandle(snapshot);
            snapshotOwner = {
                kind: "lease",
                resource: snapshotPath,
                lease: new AnalysisCleanupLease(() => snapshotHandle.close(), [snapshotPath]),
            };
            const observed = await copySignatureBytes(target, { file, stat: opened }, snapshot, signal);
            if (observed !== target.sha256)
                return changedTarget(target, `Signature target digest changed: ${target.path}; expected ${target.sha256}, observed ${observed}`);
            const after = await file.stat({ bigint: true });
            const current = await lstat(target.path, { bigint: true });
            assertRegularFileActive(signal);
            if (identity(after) !== identity(opened) ||
                identity(current) !== identity(opened))
                return changedTarget(target, `Signature target changed while establishing its version: ${target.path}`);
            await snapshotIO(target, "seal", () => snapshot.chmod(0o400));
            const snapshotOpened = await snapshot.stat({ bigint: true });
            const snapshotAtPath = await lstat(snapshotPath, { bigint: true });
            if (!snapshotOpened.isFile() ||
                !snapshotAtPath.isFile() ||
                snapshotAtPath.isSymbolicLink() ||
                identity(snapshotOpened) !== identity(snapshotAtPath))
                return changedTarget(target, `Digest-verified signature snapshot changed while binding: ${target.path}`);
            return ok({
                identity: identity(opened),
                snapshotPath,
                snapshotIdentity: identity(snapshotOpened),
            });
        }
        catch (cause) {
            return err(signatureReadFailure(target, cause));
        }
    };
    let result = await perform();
    const cleanupFailures = [];
    for (const owner of [snapshotOwner, sourceOwner]) {
        if (owner === undefined)
            continue;
        const cleanup = await resources.release(owner);
        if (cleanup.kind === "failed")
            cleanupFailures.push({ owner, cause: cleanup.cause });
    }
    if (result.ok && signal?.aborted)
        result = err(new AnalysisCancelledError("inspect_signature", {
            cause: signal.reason,
            diagnostics: {
                snapshot_binding: {
                    identity: result.value.identity,
                    snapshot_path: result.value.snapshotPath,
                },
            },
        }));
    if (cleanupFailures.length > 0) {
        const cause = new AggregateError(cleanupFailures.map(({ cause: failure }) => failure), "Signature snapshot file handles could not be closed");
        const cleanup = signatureCleanupFailure(target, cleanupFailures.map(({ owner }) => owner.resource), cause, "close");
        new AnalysisCleanupLeaseGroup(cleanup, cleanupFailures.map(({ owner }) => owner.lease));
        result = combineCleanupFailure(result, cleanup);
    }
    return result;
};
/** Reject target drift across signature command captures. */
export const verifySignatureTarget = async (target, binding, signal) => {
    try {
        assertRegularFileActive(signal);
        const current = await lstat(target.path, { bigint: true });
        assertRegularFileActive(signal);
        if (!current.isFile() || identity(current) !== binding.identity)
            return changedTarget(target, `Signature target changed during inspection: ${target.path}`);
        let snapshot;
        try {
            snapshot = await lstat(binding.snapshotPath, { bigint: true });
        }
        catch (cause) {
            const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
            if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP")
                return changedTarget(target, `Digest-verified signature snapshot is unavailable during inspection: ${target.path}`);
            return err(signatureReadFailure(target, cause));
        }
        assertRegularFileActive(signal);
        return snapshot.isFile() &&
            !snapshot.isSymbolicLink() &&
            identity(snapshot) === binding.snapshotIdentity
            ? ok(undefined)
            : changedTarget(target, `Digest-verified signature snapshot changed during inspection: ${target.path}`);
    }
    catch (cause) {
        return err(signatureReadFailure(target, cause));
    }
};
