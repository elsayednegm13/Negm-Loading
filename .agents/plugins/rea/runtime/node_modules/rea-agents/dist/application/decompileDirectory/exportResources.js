import { link, lstat, mkdtemp, open, rename, rmdir, unlink, } from "node:fs/promises";
import { join } from "node:path";
import { AnalysisCleanupLease } from "../../artifacts/AnalysisCleanupLease.js";
import { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import { DECOMPILE_DIRECTORY_JOURNAL_NAME } from "../../contracts/decompileDirectory.js";
import { AnalysisOutputError } from "../../domain/analysisErrorCore.js";
import { analysisErrorWithCleanupFailure } from "../../domain/analysisErrorCleanup.js";
import { err, ok } from "../../domain/result.js";
import { OwnedFileHandle } from "../../filesystem/OwnedFileHandle.js";
import { OwnedStagedOutput } from "../../filesystem/OwnedStagedOutput.js";
import { hashStableFile, stableFileHashCause, } from "../../filesystem/StableFileHash.js";
/** Own every descriptor and staging area until cleanup, then release the directory lease. */
export class ExportResources {
    root;
    identity;
    lease;
    scope;
    #files = new ArtifactResourceScope();
    #cleanup;
    #removeRoot = false;
    #journalIdentity;
    #rootRemoved = false;
    #retained = false;
    #functionsRemoved = false;
    #journalRemoved = false;
    #leaseReleased = false;
    #functionsIdentity;
    constructor(root, identity, lease, scope) {
        this.root = root;
        this.identity = identity;
        this.lease = lease;
        this.scope = scope;
        const resources = this;
        this.#cleanup = AnalysisCleanupLease.forCloseOwner({
            close: async () => {
                await this.#files.retryCleanup();
                if (this.#removeRoot && !this.#rootRemoved)
                    await this.#removeCreatedRoot();
                await this.lease.release();
                this.#leaseReleased = true;
            },
            get cleanupResources() {
                return resources.cleanupResources;
            },
        }, root);
    }
    get cleanupResources() {
        return [
            ...this.#files.cleanupResources,
            ...(this.#removeRoot && !this.#rootRemoved ? [this.root] : []),
            ...(this.#leaseReleased ? [] : [this.lease.socketPath ?? this.root]),
        ];
    }
    ownFunctionsDirectory(identity) {
        this.#functionsIdentity = identity;
    }
    ownFile(handle, path, journal = false) {
        const file = new OwnedFileHandle(handle);
        const owner = {
            kind: "lease",
            resource: path,
            lease: {
                release: async () => {
                    if (journal && handle.fd >= 0)
                        this.#journalIdentity = await handle
                            .stat({ bigint: true })
                            .catch(() => undefined);
                    await file.close();
                },
            },
        };
        this.#files.retain(owner);
        return async () => (await this.#files.release(owner)).kind === "released";
    }
    /** Check existing output with bounded memory and the shared file identity owner. */
    async hashFile(path, signal) {
        try {
            const hash = await hashStableFile(path, {
                ...(signal === undefined ? {} : { signal }),
                retainFailedClose: (handle) => this.#files.retain({ kind: "file-handle", resource: path, handle }),
            });
            return hash.sha256;
        }
        catch (cause) {
            throw stableFileHashCause(cause);
        }
    }
    /** Publish only a verified staged file; failed close or removal stays owned. */
    async publish(bytes, destination, mode) {
        const directory = await mkdtemp(join(this.root, ".decompile-stage-"));
        const staging = await OwnedStagedOutput.create(directory);
        const owner = {
            kind: "staged-output",
            resource: directory,
            output: staging,
        };
        this.#files.retain(owner);
        try {
            const path = join(directory, "content");
            const handle = await open(path, "wx", 0o600);
            staging.setFile(new OwnedFileHandle(handle));
            await handle.writeFile(bytes);
            await handle.sync();
            await staging.closeFile();
            await staging.assertReadyForPublication(path);
            if (mode === "link")
                await link(path, destination);
            else {
                await rename(path, destination);
                staging.recordPublishedRename();
            }
        }
        finally {
            const released = await this.#files.release(owner);
            if (released.kind === "failed")
                throw released.cause;
        }
    }
    /** Keep the lease through all initialization cleanup, including any retry. */
    async failedInitialization(error) {
        this.#removeRoot = true;
        const closed = await this.close();
        return closed.ok
            ? err(error)
            : err(analysisErrorWithCleanupFailure(error, closed.error, "decompile_all").bindCleanupDependencies([closed.error]));
    }
    async close() {
        try {
            await this.#cleanup.release();
            return ok(undefined);
        }
        catch (cause) {
            const error = new AnalysisOutputError("decompile_all", "decompile export cleanup failed", {
                cause,
                cleanup: {
                    reason: "Owned export resources could not be released.",
                    resources: [this.root],
                },
            });
            error.bindCleanupResourceOwner(this.#cleanup);
            this.#cleanup.bindCleanupError(error);
            if (!this.#retained && this.scope !== undefined) {
                this.#retained = true;
                const cleanup = this.#cleanup;
                this.scope.retain({
                    close: () => cleanup.release(),
                    get cleanupResources() {
                        return cleanup.cleanupResources;
                    },
                }, this.root);
            }
            return err(error);
        }
    }
    async #removeCreatedRoot() {
        const root = await lstat(this.root, { bigint: true });
        if (!sameIdentity(root, this.identity) ||
            !root.isDirectory() ||
            root.isSymbolicLink())
            throw new Error("Export directory identity changed during cleanup");
        // Initialization has not exported functions. Refuse unexpected entries rather
        // than recursively deleting work introduced by another owner.
        if (!this.#journalRemoved) {
            const journal = join(this.root, DECOMPILE_DIRECTORY_JOURNAL_NAME);
            const stat = await lstat(journal, { bigint: true }).catch((cause) => {
                if (isMissing(cause))
                    return undefined;
                throw cause;
            });
            if (stat !== undefined) {
                if (this.#journalIdentity === undefined ||
                    !sameIdentity(stat, this.#journalIdentity))
                    throw new Error("Cannot establish ownership of the journal during cleanup");
                await unlink(journal);
            }
            this.#journalRemoved = true;
        }
        if (!this.#functionsRemoved) {
            const path = join(this.root, "functions");
            const stat = await lstat(path, { bigint: true }).catch((cause) => {
                if (isMissing(cause) && this.#functionsIdentity === undefined)
                    return undefined;
                throw cause;
            });
            if (stat !== undefined) {
                if (this.#functionsIdentity === undefined ||
                    !sameIdentity(stat, this.#functionsIdentity))
                    throw new Error("Functions directory identity changed during cleanup");
                await rmdir(path);
            }
            this.#functionsRemoved = true;
        }
        await rmdir(this.root);
        this.#rootRemoved = true;
    }
}
const sameIdentity = (left, right) => left.dev === right.dev && left.ino === right.ino;
const isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
