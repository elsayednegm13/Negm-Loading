import { constants } from "node:fs";
import { link, lstat, mkdtemp, open, realpath, rename } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { AnalysisCleanupLease } from "../artifacts/AnalysisCleanupLease.js";
import { fileHandleMatchesBytes } from "../filesystem/fileHandleMatchesBytes.js";
import { OwnedFileHandle } from "../filesystem/OwnedFileHandle.js";
import { OwnedStagedOutput } from "../filesystem/OwnedStagedOutput.js";
import { RegularFileChangedError, sameRegularFileState, } from "../filesystem/RegularFile.js";
/** Staging cleanup failed before a publication could be returned to its caller. */
export class SkillFilePreparationFailure extends Error {
    publication;
    primary;
    cleanupCause;
    _tag = "SkillFilePreparationFailure";
    constructor(publication, primary, cleanupCause) {
        super(`Skill staging cleanup failed for ${publication.path}: ${primary instanceof Error ? primary.message : String(primary)}; cleanup: ${cleanupCause instanceof Error ? cleanupCause.message : String(cleanupCause)}`, {
            cause: new AggregateError([primary, cleanupCause]),
        });
        this.publication = publication;
        this.primary = primary;
        this.cleanupCause = cleanupCause;
    }
}
/** One byte-oriented publication, retained before entering a fallible publish. */
export class SkillFilePublication {
    path;
    bytes;
    original;
    staging;
    owner;
    stagedPath;
    #attempted = false;
    #restored = false;
    #publishedState;
    kind = "lease";
    resource;
    lease;
    constructor(path, bytes, original, staging, owner, stagedPath) {
        this.path = path;
        this.bytes = bytes;
        this.original = original;
        this.staging = staging;
        this.owner = owner;
        this.stagedPath = stagedPath;
        this.resource = staging.directory;
        this.lease = new AnalysisCleanupLease(() => staging.close(), [staging.directory]);
    }
    static async prepare(path, bytes, original) {
        const parent = await realpath(dirname(path));
        const destination = join(parent, basename(path));
        const directory = await mkdtemp(join(parent, ".rea-skill-"));
        const staging = await OwnedStagedOutput.create(directory);
        let publication;
        try {
            const stagedPath = join(directory, "content");
            const owner = new OwnedFileHandle(await open(stagedPath, constants.O_RDWR |
                constants.O_CREAT |
                constants.O_EXCL |
                (constants.O_NOFOLLOW ?? 0), 0o600));
            staging.setFile(owner);
            publication = new SkillFilePublication(destination, Buffer.from(bytes), original, staging, owner, stagedPath);
            await owner.handle.writeFile(bytes);
            const created = await owner.handle.stat();
            if (original !== undefined &&
                (created.uid !== original.state.uid ||
                    created.gid !== original.state.gid))
                await owner.handle.chown(original.state.uid, original.state.gid);
            await owner.handle.chmod(original?.mode ?? 0o600);
            await owner.handle.sync();
            await staging.assertReadyForPublication(stagedPath);
            return publication;
        }
        catch (primary) {
            try {
                await staging.close();
            }
            catch (cleanupCause) {
                // Even an open failure leaves the staging directory owned and retryable.
                if (publication === undefined) {
                    const lease = new AnalysisCleanupLease(() => staging.close(), [directory]);
                    throw new SkillFilePreparationFailure({
                        path: destination,
                        kind: "lease",
                        resource: directory,
                        lease,
                        close: () => lease.release(),
                    }, primary, cleanupCause);
                }
                throw new SkillFilePreparationFailure(publication, primary, cleanupCause);
            }
            throw primary;
        }
    }
    async publish() {
        await this.staging.assertReadyForPublication(this.stagedPath);
        await this.#assertSelected();
        this.#attempted = true;
        if (this.original === undefined) {
            // Exclusive creation preserves a file created after the absence check.
            await link(this.stagedPath, this.path);
        }
        else {
            await rename(this.stagedPath, this.path);
            this.staging.recordPublishedRename();
        }
        this.#publishedState = await this.owner.handle.stat();
    }
    async assertCurrent() {
        const before = this.#publishedState;
        if (before === undefined ||
            !sameRegularFileState(before, await this.owner.handle.stat()))
            throw new RegularFileChangedError(this.path);
        await this.#assertNamed(before);
        if (!(await fileHandleMatchesBytes(this.owner.handle, this.bytes)))
            throw new RegularFileChangedError(this.path);
        if (!sameRegularFileState(before, await this.owner.handle.stat()))
            throw new RegularFileChangedError(this.path);
        await this.#assertNamed(before);
    }
    /** Restore through the owned descriptor; a changed name never grants write authority. */
    async restore() {
        if (!this.#attempted || this.#restored)
            return;
        // A rejected exclusive link or rename may leave the original selection intact.
        const named = await optionalState(this.path);
        if (this.original !== undefined &&
            named !== undefined &&
            sameRegularFileState(this.original.state, named))
            return;
        if (this.original === undefined && named === undefined)
            return;
        await this.assertCurrent();
        if (this.original === undefined)
            throw new Error("First-install skill recovery requires manual removal; pathname deletion cannot prove ownership");
        const original = this.original;
        for (let position = 0; position < original.bytes.length;) {
            const { bytesWritten } = await this.owner.handle.write(original.bytes, position, original.bytes.length - position, position);
            if (bytesWritten === 0)
                throw new Error("Skill restoration made no write progress");
            position += bytesWritten;
        }
        await this.owner.handle.truncate(original.bytes.length);
        await this.owner.handle.chmod(original.mode);
        await this.owner.handle.sync();
        await this.#assertNamed(await this.owner.handle.stat());
        if (!(await fileHandleMatchesBytes(this.owner.handle, original.bytes)))
            throw new RegularFileChangedError(this.path);
        this.#restored = true;
    }
    close() {
        return this.lease.release();
    }
    async #assertNamed(expected) {
        const named = await lstat(this.path);
        if (expected.ino === 0 ||
            named.isSymbolicLink() ||
            !sameRegularFileState(expected, named))
            throw new RegularFileChangedError(this.path);
    }
    async #assertSelected() {
        const current = await optionalState(this.path);
        if (this.original === undefined
            ? current !== undefined
            : current === undefined ||
                current.isSymbolicLink() ||
                !sameRegularFileState(this.original.state, current))
            throw new RegularFileChangedError(this.path);
    }
}
const optionalState = async (path) => {
    try {
        return await lstat(path);
    }
    catch (cause) {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
            return undefined;
        throw cause;
    }
};
