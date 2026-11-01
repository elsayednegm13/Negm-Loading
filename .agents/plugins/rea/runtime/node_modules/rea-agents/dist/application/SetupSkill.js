import { copyFile, lstat, mkdir, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join } from "node:path";
import { err, ok } from "../domain/result.js";
import { readBoundedFileBytes } from "../process/BoundedFileBytes.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { PRODUCT_IDENTITY } from "../identity.js";
import { NonRegularFileReadError, RegularFileChangedError, } from "../filesystem/RegularFile.js";
import { RegularFileCleanupFailure } from "../filesystem/OwnedRegularFile.js";
import { withRegularFile } from "./RegularFileRead.js";
import { clientSkillDirectories } from "./SupportedClients.js";
import { preserveCurrentRecoveryBackup } from "./SetupRecoveryBackup.js";
import { SkillFilePublication, SkillFilePreparationFailure, } from "./SkillFilePublication.js";
export const MANAGED_SKILL_FILES = [
    "SKILL.md",
    "references/connection-and-recovery.md",
    "references/native-and-artifacts.md",
    "references/javascript-applications.md",
    "references/android-applications.md",
    "references/runtime-observation.md",
    "references/evidence-workflows.md",
    "references/environments.md",
];
export const isManagedSkillManifest = (content) => content.startsWith(`---\nname: ${PRODUCT_IDENTITY.skillName}\n`) ||
    content.startsWith(`---\r\nname: ${PRODUCT_IDENTITY.skillName}\r\n`);
export const readSkillFile = (path, resources) => readSkillFileSnapshot(path, resources).then(({ bytes }) => bytes.toString("utf8"));
const readSkillFileSnapshot = async (path, resources) => withRegularFile(path, async (handle, stats) => {
    const bytes = await readBoundedFileBytes(handle, stats.size, {
        expectedSize: stats.size,
    });
    if (bytes === undefined || bytes.length !== stats.size)
        throw new RegularFileChangedError(path);
    return { bytes, mode: stats.mode & 0o7777, state: stats };
}, {
    symlinks: "reject",
    ...(resources === undefined ? {} : { resources }),
});
const canonicalSkillContent = (relativePath) => readFile(new URL(`../../skills/${PRODUCT_IDENTITY.skillName}/${relativePath}`, import.meta.url), "utf8");
/** Expected failure while replacing a managed skill bundle. */
export class SetupSkillInstallError extends Error {
    _tag = "SetupSkillInstallError";
    path;
    stage;
    reason;
    rollbackFailures;
    recoveryBackupPaths;
    cleanupOwners;
    /** Retry only retained staging cleanup; never reapply a pathname rollback. */
    async retryCleanup() {
        return closeSkillPublications(this.cleanupOwners);
    }
    constructor(input) {
        const message = [
            `REA skill ${input.stage} failed at ${input.path}: ${input.reason}.`,
            ...(input.rollbackFailures.length === 0
                ? []
                : [
                    `Rollback also failed for ${input.rollbackFailures.map(({ path, reason }) => `${path} (${reason})`).join(", ")}.`,
                ]),
            ...(input.recoveryBackupPaths.length === 0
                ? []
                : [
                    `Existing-file backups remain at ${input.recoveryBackupPaths.join(", ")}.`,
                ]),
        ].join(" ");
        super(message, { cause: input.cause });
        this.path = input.path;
        this.stage = input.stage;
        this.reason = input.reason;
        this.rollbackFailures = input.rollbackFailures;
        this.recoveryBackupPaths = input.recoveryBackupPaths;
        this.cleanupOwners = input.cleanupOwners ?? [];
    }
    get remediation() {
        return `${this.message} Check permissions and rerun setup.`;
    }
}
const systemSkillInstallFileOperations = {
    mkdir: async (path) => {
        await mkdir(path, { recursive: true });
    },
    backup: (source, destination) => copyFile(source, destination, fsConstants.COPYFILE_EXCL),
    prepare: SkillFilePublication.prepare,
};
/** Keep unresolved selected roots as diagnostics, never as writable destinations. */
export const skillDestinationSelection = (home, clientIds, environment = {}, platform = process.platform) => {
    const selection = clientSkillDirectories(home, clientIds, environment, platform);
    return {
        destinations: selection.directories.map(({ client, directory }) => ({
            client,
            path: join(directory, PRODUCT_IDENTITY.skillName),
        })),
        issues: selection.unresolved.map(({ client, path, detail }) => ({
            client,
            path,
            detail,
            kind: "unresolved",
        })),
    };
};
/** Writable destinations are available only after all selected roots resolve. */
export const skillDestinations = (home, clientIds, environment = {}, platform = process.platform) => {
    const selection = skillDestinationSelection(home, clientIds, environment, platform);
    if (selection.issues.length > 0)
        throw skillDirectoryFailure(selection.issues);
    return selection.destinations;
};
/** Resolve existing REA-owned skill roots using setup's canonical destinations. */
export const existingSkillDestinations = async (home, environment = {}, platform = process.platform, resources) => {
    const selection = skillDestinationSelection(home, undefined, environment, platform);
    const issues = [...selection.issues];
    const existing = [];
    for (const destination of selection.destinations) {
        try {
            const pathIssues = await skillDirectoryIssues([destination]);
            if (pathIssues.some(({ kind }) => kind === "unreadable")) {
                issues.push(...pathIssues);
                continue;
            }
            if (pathIssues.length > 0)
                continue;
            const manifest = join(destination.path, "SKILL.md");
            const content = await readSkillFile(manifest, resources);
            if (isManagedSkillManifest(content))
                existing.push(destination);
        }
        catch (cause) {
            if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
                continue;
            if (cause instanceof RegularFileCleanupFailure ||
                cause instanceof ArtifactReaderFailure)
                throw cause;
            if (cause instanceof NonRegularFileReadError)
                continue;
            issues.push({
                client: destination.client,
                path: destination.path,
                kind: "unreadable",
                detail: causeReason(cause),
            });
        }
    }
    return { destinations: existing, issues };
};
const readOptionalSkillState = async (path, resources) => {
    try {
        return await readSkillFileSnapshot(path, resources);
    }
    catch (cause) {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
            return undefined;
        throw cause;
    }
};
const inspectSkillDirectory = async (path) => {
    try {
        const directory = await lstat(path);
        if (directory.isSymbolicLink())
            return err({
                path,
                kind: "symbolic_link",
                detail: "Skill directory is a symbolic link.",
            });
        if (!directory.isDirectory())
            return err({
                path,
                kind: "not_directory",
                detail: "Skill path is not a directory.",
            });
        return ok(undefined);
    }
    catch (cause) {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT")
            return ok(undefined);
        return err({
            path,
            kind: "unreadable",
            detail: cause instanceof Error ? cause.message : String(cause),
        });
    }
};
const skillDirectoryIssues = async (destinations) => {
    const issues = [];
    for (const { path } of destinations) {
        const root = await inspectSkillDirectory(path);
        if (!root.ok) {
            issues.push(root.error);
            continue;
        }
        const references = await inspectSkillDirectory(join(path, "references"));
        if (!references.ok)
            issues.push(references.error);
    }
    return issues;
};
const skillDirectoryFailure = (issues) => new SetupSkillInstallError({
    path: issues[0]?.path ?? "skill bundle",
    stage: "prepare",
    reason: `${issues.map(({ path, detail }) => `${detail} (${path})`).join(" ")} Use a regular skill directory, or run setup with --skill=false to configure the client without installing the skill`,
    rollbackFailures: [],
    recoveryBackupPaths: [],
    cause: issues,
});
/** Validate only final selected roots; permission to install is separate from freshness. */
export const validateCanonicalSkillDirectories = async (home, clientIds, environment = {}, platform = process.platform) => {
    const selection = skillDestinationSelection(home, clientIds, environment, platform);
    const issues = [
        ...selection.issues,
        ...(await skillDirectoryIssues(selection.destinations)),
    ];
    return issues.length === 0
        ? ok(undefined)
        : err(skillDirectoryFailure(issues));
};
const canonicalSkillFiles = async (home, clientIds, environment = {}, platform = process.platform, resources) => {
    const destinations = skillDestinations(home, clientIds, environment, platform);
    const admission = await validateCanonicalSkillDirectories(home, clientIds, environment, platform);
    if (!admission.ok)
        throw admission.error;
    return Promise.all(destinations.flatMap(({ path: root }) => MANAGED_SKILL_FILES.map(async (relativePath) => {
        const destination = join(root, relativePath);
        return {
            destination,
            content: await canonicalSkillContent(relativePath),
            original: await readOptionalSkillState(destination, resources),
        };
    })));
};
const inspectCanonicalSkill = async (home, clientIds, environment, platform, resources) => {
    const selection = skillDestinationSelection(home, clientIds, environment, platform);
    const destinations = selection.destinations;
    const issues = [...selection.issues];
    let canonical = true;
    let manifest;
    let failureCause = issues.length > 0 ? issues : undefined;
    let installedDestination = false;
    for (const destination of destinations) {
        const { path: root } = destination;
        const pathIssues = await skillDirectoryIssues([destination]);
        if (pathIssues.length > 0) {
            issues.push(...pathIssues);
            if (failureCause === undefined)
                failureCause = pathIssues;
            installedDestination = true;
            canonical = false;
            continue;
        }
        let rootCanonical = true;
        let rootHasFiles = false;
        const rootIssues = [];
        for (const relativePath of MANAGED_SKILL_FILES) {
            const destination = join(root, relativePath);
            let original;
            try {
                original = await readOptionalSkillState(destination, resources);
            }
            catch (cause) {
                if (cause instanceof RegularFileCleanupFailure ||
                    cause instanceof ArtifactReaderFailure)
                    throw cause;
                rootIssues.push({
                    path: destination,
                    kind: "unreadable",
                    detail: causeReason(cause),
                });
                if (failureCause === undefined)
                    failureCause = cause;
                rootCanonical = false;
                rootHasFiles = true;
                continue;
            }
            if (original !== undefined)
                rootHasFiles = true;
            if (relativePath === "SKILL.md" && manifest === undefined)
                manifest = original?.bytes.toString("utf8");
            // A mismatch settles freshness, but not coverage of later read failures.
            if (original === undefined)
                rootCanonical = false;
            else if (rootCanonical) {
                const content = await canonicalSkillContent(relativePath);
                rootCanonical = original.bytes.equals(Buffer.from(content, "utf8"));
            }
        }
        if (clientIds !== undefined || rootHasFiles || rootIssues.length > 0) {
            installedDestination ||= rootHasFiles;
            canonical = canonical && rootCanonical;
            issues.push(...rootIssues);
            if (!rootCanonical && rootIssues.length === 0)
                issues.push({
                    client: destination.client,
                    path: root,
                    kind: rootHasFiles ? "stale" : "missing",
                    detail: `Selected skill copy is ${rootHasFiles ? "stale" : "missing"}`,
                });
        }
    }
    return issues.length === 0
        ? ok({ canonical, manifest, installedDestination })
        : err({
            _tag: "SkillInspectionFailure",
            issues,
            cause: failureCause,
            manifest,
        });
};
/** Report whether setup would change any file in the managed REA skill bundle. */
export const canonicalSkillNeedsInstall = async (home, clientIds = [], environment = {}, platform = process.platform, resources) => {
    try {
        const inspection = await inspectCanonicalSkill(home, clientIds, environment, platform, resources);
        return !inspection.ok || !inspection.value.canonical;
    }
    catch (cause) {
        if (cause instanceof RegularFileCleanupFailure ||
            cause instanceof ArtifactReaderFailure)
            throw cause;
        // A copy needs attention; selected-root admission decides whether it may be installed.
        void cause;
        return true;
    }
};
const causeReason = (cause) => cause instanceof Error ? cause.message : String(cause);
const causePath = (cause) => cause instanceof Error && "path" in cause && typeof cause.path === "string"
    ? cause.path
    : undefined;
const closeSkillPublications = async (publications, resources) => {
    const failures = [];
    for (const publication of publications) {
        if (publication.lease.released)
            continue;
        try {
            if (resources === undefined)
                await publication.close();
            else {
                const released = await resources.release(publication);
                if (released.kind === "failed")
                    throw released.cause;
            }
        }
        catch (cause) {
            failures.push({
                path: publication.resource,
                reason: causeReason(cause),
            });
        }
    }
    return failures;
};
/** Transactionally install the canonical skill bundle and optional references. */
export const installCanonicalSkill = async (home, clientIds = [], environment = {}, platform = process.platform, operations = systemSkillInstallFileOperations, resources) => {
    const publications = [];
    const preparedCleanupOwners = [];
    let verified = false;
    let stage = "prepare";
    let failingPath = "skill bundle";
    const recoveryPaths = new Map();
    try {
        const canonical = await canonicalSkillFiles(home, clientIds, environment, platform, resources);
        const changed = canonical.filter(({ content, original }) => original?.bytes.equals(Buffer.from(content, "utf8")) !== true);
        if (changed.length === 0)
            return ok("unchanged");
        stage = "backup";
        for (const { destination, original } of changed) {
            failingPath = destination;
            await operations.mkdir(dirname(destination));
            if (original !== undefined) {
                const preserved = await preserveCurrentRecoveryBackup(`${destination}.rea.backup`, destination, original.bytes, {
                    copy: operations.backup,
                    ...(resources === undefined ? {} : { resources }),
                });
                if (!preserved.ok)
                    throw new Error(preserved.error.detail);
                recoveryPaths.set(destination, preserved.value);
            }
        }
        stage = "write";
        for (const file of changed) {
            failingPath = file.destination;
            const publication = await operations.prepare(file.destination, Buffer.from(file.content, "utf8"), file.original);
            // Ownership exists before publish can succeed and subsequently reject.
            publications.push(publication);
            await publication.publish();
        }
        stage = "readback";
        for (const publication of publications) {
            failingPath = publication.path;
            await publication.assertCurrent();
        }
        verified = true;
        const cleanupFailures = await closeSkillPublications(publications, resources);
        if (cleanupFailures.length > 0)
            throw new Error(`Skill publication cleanup incomplete: ${cleanupFailures.map(({ path, reason }) => `${path} (${reason})`).join(", ")}`);
        return ok("installed");
    }
    catch (cause) {
        if (stage === "prepare" && cause instanceof SetupSkillInstallError)
            return err(cause);
        failingPath = causePath(cause) ?? failingPath;
        if (cause instanceof SkillFilePreparationFailure)
            preparedCleanupOwners.push(cause.publication);
        const rollbackFailures = [];
        if (!verified) {
            for (const publication of [...publications].reverse()) {
                try {
                    await publication.restore();
                }
                catch (rollbackCause) {
                    rollbackFailures.push({
                        path: publication.path,
                        reason: causeReason(rollbackCause),
                    });
                }
            }
        }
        const cleanupOwners = [...publications, ...preparedCleanupOwners];
        rollbackFailures.push(...(await closeSkillPublications(cleanupOwners, resources)));
        return err(new SetupSkillInstallError({
            path: failingPath,
            stage,
            reason: causeReason(cause),
            rollbackFailures,
            recoveryBackupPaths: [...recoveryPaths.values()],
            cleanupOwners,
            cause,
        }));
    }
};
/** Read installed skill metadata and compare every managed location. */
export const readInstalledSkillIdentity = async (home, clientIds, environment = {}, platform = process.platform, resources) => {
    const inspection = await inspectCanonicalSkill(home, clientIds, environment, platform, resources);
    if (inspection.ok && !inspection.value.installedDestination)
        return undefined;
    const content = inspection.ok
        ? inspection.value.manifest
        : inspection.error.manifest;
    const issues = inspection.ok ? [] : inspection.error.issues;
    const toolCount = content === undefined
        ? undefined
        : /^\s{2}tool_count:\s*(\d+)\s*$/mu.exec(content)?.[1];
    return {
        canonical: inspection.ok && inspection.value.canonical,
        version: content === undefined
            ? null
            : (/^\s{2}version:\s*"([^"]+)"\s*$/mu.exec(content)?.[1] ?? null),
        toolCount: toolCount === undefined ? null : Number.parseInt(toolCount, 10),
        ...(issues.length === 0 ? {} : { issues }),
    };
};
