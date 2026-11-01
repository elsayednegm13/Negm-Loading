import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { PRODUCT_IDENTITY, compareUnicodeCodePoints, init_identity, init_unicodeCodePointOrder } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ConfigurationError, err, init_configurationErrors, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { ArtifactReaderFailure, NonRegularFileReadError, OwnedFileHandle, RegularFileChangedError, RegularFileCleanupFailure, init_ArtifactReader, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, sameRegularFileState } from "./ArtifactReader-PV1DaSaC.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DNoM_zCF.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-DZIxbgES.js";
import { init_RegularFileRead, readRegularFile, withRegularFile } from "./RegularFileRead-4snB6-IE.js";
import { OwnedStagedOutput, init_OwnedStagedOutput } from "./OwnedStagedOutput-FV1aUtCU.js";
import { init_snapshotEnvironment, mergeEnvironmentOverrides, snapshotEnvironment } from "./snapshotEnvironment-Dxega7Jt.js";
import { clientSkillDirectories, equivalentClientRegistrationCommands, init_ClientRegistrationIdentity, init_SupportedClients, init_environment, parseEnvironment, parseEnvironmentValues } from "./SupportedClients-cYThuJwT.js";
import { MCP_STARTUP_POLICY, init_mcpStartupPolicy, recommendedMcpToolTimeoutMs, recommendedMcpToolTimeoutSeconds } from "./mcpStartupPolicy-Bb-Cmg4y.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { copyFile, link, lstat, mkdir, mkdtemp, open, readFile, realpath, rename } from "node:fs/promises";
import { constants } from "node:fs";
import { applyEdits, createScanner, format, getNodeValue, parseTree, printParseErrorCode } from "jsonc-parser";
import { Document, Schema, isAlias, isMap, isNode, isScalar, isSeq, parseDocument, visit as visit$1 } from "yaml";
import { parse, stringify } from "smol-toml";

//#region dist/application/SetupRecoveryBackup.js
var isMissing, errorDetail, selectCurrentRecoveryBackup, copyExclusive, preserveCurrentRecoveryBackup;
function init_SetupRecoveryBackup() {
	return (init_SetupRecoveryBackup = __esmMin((() => {
		init_result();
		init_OwnedRegularFile();
		init_RegularFileRead();
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
		errorDetail = (cause) => cause instanceof Error ? cause.message : String(cause);
		selectCurrentRecoveryBackup = async (firstBackupPath, original, resources) => {
			const read = (path) => readRegularFile(path, {
				symlinks: "reject",
				...resources === undefined ? {} : { resources }
			});
			const expected = Buffer.isBuffer(original) ? original : Buffer.from(original, "utf8");
			let firstBackup;
			try {
				firstBackup = await read(firstBackupPath);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				if (!isMissing(cause)) return err({
					kind: "unreadable",
					path: firstBackupPath,
					detail: `The recovery backup could not be checked: ${errorDetail(cause)}`
				});
			}
			if (firstBackup === undefined) return ok({
				backupPath: firstBackupPath,
				present: false
			});
			if (firstBackup.equals(expected)) return ok({
				backupPath: firstBackupPath,
				present: true
			});
			const digest = createHash("sha256").update(expected).digest("hex");
			const recoveryPath = `${firstBackupPath}.${digest}.recovery`;
			let recovery;
			try {
				recovery = await read(recoveryPath);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				if (!isMissing(cause)) return err({
					kind: "unreadable",
					path: recoveryPath,
					detail: `The recovery backup could not be checked: ${errorDetail(cause)}`
				});
			}
			if (recovery !== undefined && !recovery.equals(expected)) return err({
				kind: "occupied",
				path: recoveryPath,
				detail: `The recovery path already contains different data: ${recoveryPath}`
			});
			return ok({
				backupPath: recoveryPath,
				present: recovery !== undefined
			});
		};
		copyExclusive = (source, destination) => copyFile(source, destination, constants.COPYFILE_EXCL);
		preserveCurrentRecoveryBackup = async (firstBackupPath, source, original, { copy = copyExclusive, resources } = {}) => {
			const selection = await selectCurrentRecoveryBackup(firstBackupPath, original, resources);
			if (!selection.ok) return selection;
			const { backupPath } = selection.value;
			if (!selection.value.present) {
				try {
					await copy(source, backupPath);
				} catch (cause) {
					if (!(cause instanceof Error && "code" in cause && cause.code === "EEXIST")) return err({
						kind: "copy",
						path: backupPath,
						detail: `The recovery backup could not be written: ${errorDetail(cause)}`
					});
				}
			}
			const verified = await selectCurrentRecoveryBackup(firstBackupPath, original, resources);
			if (!verified.ok) return verified;
			if (verified.value.backupPath !== backupPath || !verified.value.present) return err({
				kind: "unverified",
				path: backupPath,
				detail: `The recovery backup does not match the configuration it preserves: ${backupPath}`
			});
			return ok(backupPath);
		};
	})))();
}

//#endregion
//#region dist/filesystem/fileHandleMatchesBytes.js
var fileHandleMatchesBytes;
function init_fileHandleMatchesBytes() {
	return (init_fileHandleMatchesBytes = __esmMin((() => {
		fileHandleMatchesBytes = async (handle, expected) => {
			if ((await handle.stat()).size !== expected.length) return false;
			const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, expected.length));
			for (let position = 0; position < expected.length;) {
				const { bytesRead } = await handle.read(chunk, 0, Math.min(chunk.length, expected.length - position), position);
				if (bytesRead === 0 || !chunk.subarray(0, bytesRead).equals(expected.subarray(position, position + bytesRead))) return false;
				position += bytesRead;
			}
			return true;
		};
	})))();
}

//#endregion
//#region dist/application/SkillFilePublication.js
var SkillFilePreparationFailure, SkillFilePublication, optionalState;
function init_SkillFilePublication() {
	return (init_SkillFilePublication = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_fileHandleMatchesBytes();
		init_OwnedFileHandle();
		init_OwnedStagedOutput();
		init_RegularFile();
		SkillFilePreparationFailure = class extends Error {
			publication;
			primary;
			cleanupCause;
			_tag = "SkillFilePreparationFailure";
			constructor(publication, primary, cleanupCause) {
				super(`Skill staging cleanup failed for ${publication.path}: ${primary instanceof Error ? primary.message : String(primary)}; cleanup: ${cleanupCause instanceof Error ? cleanupCause.message : String(cleanupCause)}`, { cause: new AggregateError([primary, cleanupCause]) });
				this.publication = publication;
				this.primary = primary;
				this.cleanupCause = cleanupCause;
			}
		};
		SkillFilePublication = class SkillFilePublication {
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
					const owner = new OwnedFileHandle(await open(stagedPath, constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 384));
					staging.setFile(owner);
					publication = new SkillFilePublication(destination, Buffer.from(bytes), original, staging, owner, stagedPath);
					await owner.handle.writeFile(bytes);
					const created = await owner.handle.stat();
					if (original !== undefined && (created.uid !== original.state.uid || created.gid !== original.state.gid)) await owner.handle.chown(original.state.uid, original.state.gid);
					await owner.handle.chmod(original?.mode ?? 384);
					await owner.handle.sync();
					await staging.assertReadyForPublication(stagedPath);
					return publication;
				} catch (primary) {
					try {
						await staging.close();
					} catch (cleanupCause) {
						if (publication === undefined) {
							const lease = new AnalysisCleanupLease(() => staging.close(), [directory]);
							throw new SkillFilePreparationFailure({
								path: destination,
								kind: "lease",
								resource: directory,
								lease,
								close: () => lease.release()
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
					await link(this.stagedPath, this.path);
				} else {
					await rename(this.stagedPath, this.path);
					this.staging.recordPublishedRename();
				}
				this.#publishedState = await this.owner.handle.stat();
			}
			async assertCurrent() {
				const before = this.#publishedState;
				if (before === undefined || !sameRegularFileState(before, await this.owner.handle.stat())) throw new RegularFileChangedError(this.path);
				await this.#assertNamed(before);
				if (!await fileHandleMatchesBytes(this.owner.handle, this.bytes)) throw new RegularFileChangedError(this.path);
				if (!sameRegularFileState(before, await this.owner.handle.stat())) throw new RegularFileChangedError(this.path);
				await this.#assertNamed(before);
			}
			/** Restore through the owned descriptor; a changed name never grants write authority. */
			async restore() {
				if (!this.#attempted || this.#restored) return;
				const named = await optionalState(this.path);
				if (this.original !== undefined && named !== undefined && sameRegularFileState(this.original.state, named)) return;
				if (this.original === undefined && named === undefined) return;
				await this.assertCurrent();
				if (this.original === undefined) throw new Error("First-install skill recovery requires manual removal; pathname deletion cannot prove ownership");
				const original = this.original;
				for (let position = 0; position < original.bytes.length;) {
					const { bytesWritten } = await this.owner.handle.write(original.bytes, position, original.bytes.length - position, position);
					if (bytesWritten === 0) throw new Error("Skill restoration made no write progress");
					position += bytesWritten;
				}
				await this.owner.handle.truncate(original.bytes.length);
				await this.owner.handle.chmod(original.mode);
				await this.owner.handle.sync();
				await this.#assertNamed(await this.owner.handle.stat());
				if (!await fileHandleMatchesBytes(this.owner.handle, original.bytes)) throw new RegularFileChangedError(this.path);
				this.#restored = true;
			}
			close() {
				return this.lease.release();
			}
			async #assertNamed(expected) {
				const named = await lstat(this.path);
				if (expected.ino === 0 || named.isSymbolicLink() || !sameRegularFileState(expected, named)) throw new RegularFileChangedError(this.path);
			}
			async #assertSelected() {
				const current = await optionalState(this.path);
				if (this.original === undefined ? current !== undefined : current === undefined || current.isSymbolicLink() || !sameRegularFileState(this.original.state, current)) throw new RegularFileChangedError(this.path);
			}
		};
		optionalState = async (path) => {
			try {
				return await lstat(path);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
				throw cause;
			}
		};
	})))();
}

//#endregion
//#region dist/application/SetupSkill.js
var MANAGED_SKILL_FILES, isManagedSkillManifest, readSkillFile, readSkillFileSnapshot, canonicalSkillContent, SetupSkillInstallError, systemSkillInstallFileOperations, skillDestinationSelection, skillDestinations, existingSkillDestinations, readOptionalSkillState, inspectSkillDirectory, skillDirectoryIssues, skillDirectoryFailure, validateCanonicalSkillDirectories, canonicalSkillFiles, inspectCanonicalSkill, canonicalSkillNeedsInstall, causeReason, causePath, closeSkillPublications, installCanonicalSkill, readInstalledSkillIdentity;
function init_SetupSkill() {
	return (init_SetupSkill = __esmMin((() => {
		init_result();
		init_BoundedFileBytes();
		init_ArtifactReader();
		init_identity();
		init_RegularFile();
		init_OwnedRegularFile();
		init_RegularFileRead();
		init_SupportedClients();
		init_SetupRecoveryBackup();
		init_SkillFilePublication();
		MANAGED_SKILL_FILES = [
			"SKILL.md",
			"references/connection-and-recovery.md",
			"references/native-and-artifacts.md",
			"references/javascript-applications.md",
			"references/android-applications.md",
			"references/runtime-observation.md",
			"references/evidence-workflows.md",
			"references/environments.md"
		];
		isManagedSkillManifest = (content) => content.startsWith(`---\nname: ${PRODUCT_IDENTITY.skillName}\n`) || content.startsWith(`---\r\nname: ${PRODUCT_IDENTITY.skillName}\r\n`);
		readSkillFile = (path, resources) => readSkillFileSnapshot(path, resources).then(({ bytes }) => bytes.toString("utf8"));
		readSkillFileSnapshot = async (path, resources) => withRegularFile(path, async (handle, stats) => {
			const bytes = await readBoundedFileBytes(handle, stats.size, { expectedSize: stats.size });
			if (bytes === undefined || bytes.length !== stats.size) throw new RegularFileChangedError(path);
			return {
				bytes,
				mode: stats.mode & 4095,
				state: stats
			};
		}, {
			symlinks: "reject",
			...resources === undefined ? {} : { resources }
		});
		canonicalSkillContent = (relativePath) => readFile(new URL(`../../skills/${PRODUCT_IDENTITY.skillName}/${relativePath}`, new URL("../application/SetupSkill.js", import.meta.url).href), "utf8");
		SetupSkillInstallError = class extends Error {
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
					...input.rollbackFailures.length === 0 ? [] : [`Rollback also failed for ${input.rollbackFailures.map(({ path, reason }) => `${path} (${reason})`).join(", ")}.`],
					...input.recoveryBackupPaths.length === 0 ? [] : [`Existing-file backups remain at ${input.recoveryBackupPaths.join(", ")}.`]
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
		};
		systemSkillInstallFileOperations = {
			mkdir: async (path) => {
				await mkdir(path, { recursive: true });
			},
			backup: (source, destination) => copyFile(source, destination, constants.COPYFILE_EXCL),
			prepare: SkillFilePublication.prepare
		};
		skillDestinationSelection = (home, clientIds, environment = {}, platform = process.platform) => {
			const selection = clientSkillDirectories(home, clientIds, environment, platform);
			return {
				destinations: selection.directories.map(({ client, directory }) => ({
					client,
					path: join(directory, PRODUCT_IDENTITY.skillName)
				})),
				issues: selection.unresolved.map(({ client, path, detail }) => ({
					client,
					path,
					detail,
					kind: "unresolved"
				}))
			};
		};
		skillDestinations = (home, clientIds, environment = {}, platform = process.platform) => {
			const selection = skillDestinationSelection(home, clientIds, environment, platform);
			if (selection.issues.length > 0) throw skillDirectoryFailure(selection.issues);
			return selection.destinations;
		};
		existingSkillDestinations = async (home, environment = {}, platform = process.platform, resources) => {
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
					if (pathIssues.length > 0) continue;
					const manifest = join(destination.path, "SKILL.md");
					const content = await readSkillFile(manifest, resources);
					if (isManagedSkillManifest(content)) existing.push(destination);
				} catch (cause) {
					if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") continue;
					if (cause instanceof RegularFileCleanupFailure || cause instanceof ArtifactReaderFailure) throw cause;
					if (cause instanceof NonRegularFileReadError) continue;
					issues.push({
						client: destination.client,
						path: destination.path,
						kind: "unreadable",
						detail: causeReason(cause)
					});
				}
			}
			return {
				destinations: existing,
				issues
			};
		};
		readOptionalSkillState = async (path, resources) => {
			try {
				return await readSkillFileSnapshot(path, resources);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
				throw cause;
			}
		};
		inspectSkillDirectory = async (path) => {
			try {
				const directory = await lstat(path);
				if (directory.isSymbolicLink()) return err({
					path,
					kind: "symbolic_link",
					detail: "Skill directory is a symbolic link."
				});
				if (!directory.isDirectory()) return err({
					path,
					kind: "not_directory",
					detail: "Skill path is not a directory."
				});
				return ok(undefined);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return ok(undefined);
				return err({
					path,
					kind: "unreadable",
					detail: cause instanceof Error ? cause.message : String(cause)
				});
			}
		};
		skillDirectoryIssues = async (destinations) => {
			const issues = [];
			for (const { path } of destinations) {
				const root = await inspectSkillDirectory(path);
				if (!root.ok) {
					issues.push(root.error);
					continue;
				}
				const references = await inspectSkillDirectory(join(path, "references"));
				if (!references.ok) issues.push(references.error);
			}
			return issues;
		};
		skillDirectoryFailure = (issues) => new SetupSkillInstallError({
			path: issues[0]?.path ?? "skill bundle",
			stage: "prepare",
			reason: `${issues.map(({ path, detail }) => `${detail} (${path})`).join(" ")} Use a regular skill directory, or run setup with --skill=false to configure the client without installing the skill`,
			rollbackFailures: [],
			recoveryBackupPaths: [],
			cause: issues
		});
		validateCanonicalSkillDirectories = async (home, clientIds, environment = {}, platform = process.platform) => {
			const selection = skillDestinationSelection(home, clientIds, environment, platform);
			const issues = [...selection.issues, ...await skillDirectoryIssues(selection.destinations)];
			return issues.length === 0 ? ok(undefined) : err(skillDirectoryFailure(issues));
		};
		canonicalSkillFiles = async (home, clientIds, environment = {}, platform = process.platform, resources) => {
			const destinations = skillDestinations(home, clientIds, environment, platform);
			const admission = await validateCanonicalSkillDirectories(home, clientIds, environment, platform);
			if (!admission.ok) throw admission.error;
			return Promise.all(destinations.flatMap(({ path: root }) => MANAGED_SKILL_FILES.map(async (relativePath) => {
				const destination = join(root, relativePath);
				return {
					destination,
					content: await canonicalSkillContent(relativePath),
					original: await readOptionalSkillState(destination, resources)
				};
			})));
		};
		inspectCanonicalSkill = async (home, clientIds, environment, platform, resources) => {
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
					if (failureCause === undefined) failureCause = pathIssues;
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
					} catch (cause) {
						if (cause instanceof RegularFileCleanupFailure || cause instanceof ArtifactReaderFailure) throw cause;
						rootIssues.push({
							path: destination,
							kind: "unreadable",
							detail: causeReason(cause)
						});
						if (failureCause === undefined) failureCause = cause;
						rootCanonical = false;
						rootHasFiles = true;
						continue;
					}
					if (original !== undefined) rootHasFiles = true;
					if (relativePath === "SKILL.md" && manifest === undefined) manifest = original?.bytes.toString("utf8");
					if (original === undefined) rootCanonical = false;
					else if (rootCanonical) {
						const content = await canonicalSkillContent(relativePath);
						rootCanonical = original.bytes.equals(Buffer.from(content, "utf8"));
					}
				}
				if (clientIds !== undefined || rootHasFiles || rootIssues.length > 0) {
					installedDestination ||= rootHasFiles;
					canonical = canonical && rootCanonical;
					issues.push(...rootIssues);
					if (!rootCanonical && rootIssues.length === 0) issues.push({
						client: destination.client,
						path: root,
						kind: rootHasFiles ? "stale" : "missing",
						detail: `Selected skill copy is ${rootHasFiles ? "stale" : "missing"}`
					});
				}
			}
			return issues.length === 0 ? ok({
				canonical,
				manifest,
				installedDestination
			}) : err({
				_tag: "SkillInspectionFailure",
				issues,
				cause: failureCause,
				manifest
			});
		};
		canonicalSkillNeedsInstall = async (home, clientIds = [], environment = {}, platform = process.platform, resources) => {
			try {
				const inspection = await inspectCanonicalSkill(home, clientIds, environment, platform, resources);
				return !inspection.ok || !inspection.value.canonical;
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure || cause instanceof ArtifactReaderFailure) throw cause;
				void cause;
				return true;
			}
		};
		causeReason = (cause) => cause instanceof Error ? cause.message : String(cause);
		causePath = (cause) => cause instanceof Error && "path" in cause && typeof cause.path === "string" ? cause.path : undefined;
		closeSkillPublications = async (publications, resources) => {
			const failures = [];
			for (const publication of publications) {
				if (publication.lease.released) continue;
				try {
					if (resources === undefined) await publication.close();
					else {
						const released = await resources.release(publication);
						if (released.kind === "failed") throw released.cause;
					}
				} catch (cause) {
					failures.push({
						path: publication.resource,
						reason: causeReason(cause)
					});
				}
			}
			return failures;
		};
		installCanonicalSkill = async (home, clientIds = [], environment = {}, platform = process.platform, operations = systemSkillInstallFileOperations, resources) => {
			const publications = [];
			const preparedCleanupOwners = [];
			let verified = false;
			let stage = "prepare";
			let failingPath = "skill bundle";
			const recoveryPaths = new Map();
			try {
				const canonical = await canonicalSkillFiles(home, clientIds, environment, platform, resources);
				const changed = canonical.filter(({ content, original }) => original?.bytes.equals(Buffer.from(content, "utf8")) !== true);
				if (changed.length === 0) return ok("unchanged");
				stage = "backup";
				for (const { destination, original } of changed) {
					failingPath = destination;
					await operations.mkdir(dirname(destination));
					if (original !== undefined) {
						const preserved = await preserveCurrentRecoveryBackup(`${destination}.rea.backup`, destination, original.bytes, {
							copy: operations.backup,
							...resources === undefined ? {} : { resources }
						});
						if (!preserved.ok) throw new Error(preserved.error.detail);
						recoveryPaths.set(destination, preserved.value);
					}
				}
				stage = "write";
				for (const file of changed) {
					failingPath = file.destination;
					const publication = await operations.prepare(file.destination, Buffer.from(file.content, "utf8"), file.original);
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
				if (cleanupFailures.length > 0) throw new Error(`Skill publication cleanup incomplete: ${cleanupFailures.map(({ path, reason }) => `${path} (${reason})`).join(", ")}`);
				return ok("installed");
			} catch (cause) {
				if (stage === "prepare" && cause instanceof SetupSkillInstallError) return err(cause);
				failingPath = causePath(cause) ?? failingPath;
				if (cause instanceof SkillFilePreparationFailure) preparedCleanupOwners.push(cause.publication);
				const rollbackFailures = [];
				if (!verified) {
					for (const publication of [...publications].reverse()) {
						try {
							await publication.restore();
						} catch (rollbackCause) {
							rollbackFailures.push({
								path: publication.path,
								reason: causeReason(rollbackCause)
							});
						}
					}
				}
				const cleanupOwners = [...publications, ...preparedCleanupOwners];
				rollbackFailures.push(...await closeSkillPublications(cleanupOwners, resources));
				return err(new SetupSkillInstallError({
					path: failingPath,
					stage,
					reason: causeReason(cause),
					rollbackFailures,
					recoveryBackupPaths: [...recoveryPaths.values()],
					cleanupOwners,
					cause
				}));
			}
		};
		readInstalledSkillIdentity = async (home, clientIds, environment = {}, platform = process.platform, resources) => {
			const inspection = await inspectCanonicalSkill(home, clientIds, environment, platform, resources);
			if (inspection.ok && !inspection.value.installedDestination) return undefined;
			const content = inspection.ok ? inspection.value.manifest : inspection.error.manifest;
			const issues = inspection.ok ? [] : inspection.error.issues;
			const toolCount = content === undefined ? undefined : /^\s{2}tool_count:\s*(\d+)\s*$/mu.exec(content)?.[1];
			return {
				canonical: inspection.ok && inspection.value.canonical,
				version: content === undefined ? null : /^\s{2}version:\s*"([^"]+)"\s*$/mu.exec(content)?.[1] ?? null,
				toolCount: toolCount === undefined ? null : Number.parseInt(toolCount, 10),
				...issues.length === 0 ? {} : { issues }
			};
		};
	})))();
}

//#endregion
//#region dist/application/DshCordisYaml.js
var CordisExpression, DshCordisYaml;
function init_DshCordisYaml() {
	return (init_DshCordisYaml = __esmMin((() => {
		init_configurationErrors();
		CordisExpression = class {
			source;
			kind = "cordis-expression";
			constructor(source) {
				this.source = source;
			}
		};
		DshCordisYaml = class {
			document;
			#values = new Map();
			#visiting = new Set();
			constructor(text) {
				this.document = parseDocument(text, {
					customTags: [{
						tag: "tag:yaml.org,2002:js",
						resolve: (source) => source
					}],
					logLevel: "silent"
				});
				if (this.document.errors.length > 0 || this.document.warnings.length > 0) throw new ConfigurationError("Invalid or unsupported Cordis YAML", { cause: this.document.errors[0] ?? this.document.warnings[0] });
				if (this.document.contents === null) this.document.contents = this.document.createNode([]);
				if (!isSeq(this.document.contents)) throw new ConfigurationError("Cordis patches must be a YAML operation list");
				this.value(this.document.contents);
				try {
					this.document.toJS();
				} catch (cause) {
					throw new ConfigurationError("Unsafe Cordis YAML alias expansion", { cause });
				}
			}
			resolve(node) {
				if (!isAlias(node)) return node;
				const resolved = node.resolve(this.document);
				if (resolved === undefined) throw new ConfigurationError("Cordis YAML contains an unresolved alias");
				return resolved;
			}
			value(node) {
				const resolved = this.resolve(node);
				if (!isNode(resolved)) return resolved;
				if (this.#values.has(resolved)) return this.#values.get(resolved);
				if (this.#visiting.has(resolved)) throw new ConfigurationError("Cyclic Cordis YAML cannot be safely edited");
				this.#visiting.add(resolved);
				let value;
				if (isScalar(resolved)) value = resolved.tag === "tag:yaml.org,2002:js" ? new CordisExpression(String(resolved.value)) : resolved.value;
				else if (isSeq(resolved)) value = resolved.items.map((item) => this.value(item));
				else if (isMap(resolved)) {
					const entries = [];
					for (const pair of resolved.items) {
						entries.push([this.key(pair.key), this.value(pair.value)]);
					}
					value = Object.fromEntries(entries);
				}
				this.#visiting.delete(resolved);
				this.#values.set(resolved, value);
				return value;
			}
			key(node) {
				const key = this.value(node);
				if (typeof key === "object" && key !== null) throw new ConfigurationError("Cordis YAML mapping keys must be literal scalars");
				return key === null ? "" : String(key);
			}
			/** A case-only rename retains source key/value comments on the chosen alias. */
			renameKey(map, pair, key) {
				const existing = map.items.find((item) => item !== pair && this.key(item.key) === key);
				const replacement = existing ?? pair;
				const carry = (source, target) => {
					if (!isNode(source) || !isNode(target) || source === target) return;
					for (const name of ["comment", "commentBefore"]) {
						const values = [target[name], source[name]].filter((value) => value !== undefined);
						if (values.length > 0) target[name] = [...new Set(values)].join("\n");
					}
				};
				if (existing !== undefined) {
					carry(pair.key, existing.key);
					carry(pair.value, existing.value);
					map.items = map.items.filter((item) => item !== pair);
				} else if (this.key(pair.key) !== key) {
					const renamed = this.document.createNode(key);
					carry(pair.key, renamed);
					replacement.key = renamed;
				}
			}
			field(map, key) {
				return map?.items.findLast((pair) => this.key(pair.key) === key)?.value;
			}
			/** Preserve unchanged nodes and carry their comments when replacing values. */
			setValue(map, key, value) {
				const pair = map.items.findLast((item) => this.key(item.key) === key);
				const original = pair?.value;
				if (isDeepStrictEqual(this.value(original), value)) return;
				const replacement = this.document.createNode(value);
				if (isNode(original) && isNode(replacement)) {
					if (original.comment !== undefined) replacement.comment = original.comment;
					if (original.commentBefore !== undefined) replacement.commentBefore = original.commentBefore;
				}
				if (pair === undefined) map.set(key, replacement);
				else pair.value = replacement;
			}
			/** Copy from the source before edits; materialized nodes own no anchors. */
			copy(node, invalidated) {
				if (isAlias(node)) {
					const target = this.resolve(node);
					return invalidated === undefined || isNode(target) && invalidated.has(target) ? this.copy(target) : node.clone();
				}
				if (!isNode(node)) return node;
				const copied = node.clone();
				if ((invalidated === undefined || invalidated.has(node)) && (isScalar(copied) || isMap(copied) || isSeq(copied))) delete copied.anchor;
				if (isSeq(node) && isSeq(copied)) copied.items = node.items.map((item) => this.copy(item, invalidated));
				if (isMap(node) && isMap(copied)) copied.items.forEach((pair, index) => {
					pair.key = this.copy(node.items[index].key, invalidated);
					pair.value = this.copy(node.items[index].value, invalidated);
				});
				return copied;
			}
			/** Replacing an anchor must not change untouched consumers of its old value. */
			detach(node, invalidated) {
				const copied = this.copy(node, invalidated);
				if (isNode(copied)) visit$1(copied, {
					Pair: (_key, pair) => {
						if (isAlias(pair.key)) pair.key = this.copy(this.resolve(pair.key));
					},
					Value: (_key, value) => {
						delete value.anchor;
					}
				});
				return copied;
			}
			anchors(node) {
				if (!isNode(node)) return [];
				const anchors = [];
				visit$1(node, { Value: (_key, value) => {
					if (value.anchor) anchors.push(value);
				} });
				return anchors;
			}
		};
	})))();
}

//#endregion
//#region dist/application/DshCordisPatch.js
var DSH_ENTRY_ID, DSH_CLIENT_PACKAGE, LAUNCHER_KEYS, SELECTOR_KEYS, isRecord, DshCordisDocument, DshCordisEdit, dshDocument, parseDshCordisDocument, editDshDocument, serializeDshDocument, dshClientRegistrationEntry;
function init_DshCordisPatch() {
	return (init_DshCordisPatch = __esmMin((() => {
		init_environment();
		init_configurationErrors();
		init_result();
		init_DshCordisYaml();
		init_snapshotEnvironment();
		DSH_ENTRY_ID = "rea-mcp";
		DSH_CLIENT_PACKAGE = "@deepseek-ai/dsh-mcp-client";
		LAUNCHER_KEYS = new Set([
			"serverName",
			"transport",
			"command",
			"args"
		]);
		SELECTOR_KEYS = new Set(["id", "name"]);
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof CordisExpression);
		DshCordisDocument = class {
			#yaml;
			#operations;
			#fields = new Map();
			#entryNode;
			#insertions;
			#unknownSelector = false;
			#unknownStructure = false;
			#editabilityError;
			config;
			constructor(text) {
				this.#yaml = new DshCordisYaml(text);
				const root = this.#yaml.document.contents;
				if (!isSeq(root)) throw new ConfigurationError("Cordis patches must be a list");
				const operations = [];
				let insertions = 0;
				let malformedStructure = false;
				for (const source of root.items) {
					const map = this.#map(source);
					if (map === undefined) {
						if (this.#yaml.value(source) instanceof CordisExpression) this.#unknownStructure = true;
						else malformedStructure = true;
						continue;
					}
					const inserted = this.#yaml.resolve(this.#yaml.field(map, "insert"));
					const targetId = this.#id(map);
					const unknownApplicability = targetId !== undefined;
					const insertedValue = this.#yaml.value(inserted);
					const invalidEntries = isSeq(inserted) ? inserted.items.filter((entry) => this.#map(entry) === undefined) : [];
					if (insertedValue instanceof CordisExpression || invalidEntries.some((entry) => this.#yaml.value(entry) instanceof CordisExpression)) this.#unknownStructure = true;
					else if (insertedValue != null && !isSeq(inserted)) malformedStructure = true;
					else if (invalidEntries.length > 0) malformedStructure = true;
					const ownedRows = isSeq(inserted) ? inserted.items.flatMap((entry, index) => this.#id(entry) === "rea-mcp" ? [index] : []) : [];
					const direct = !isSeq(inserted) && targetId === "rea-mcp";
					operations.push({
						source,
						map,
						ownedRows,
						direct,
						unknownApplicability
					});
					if (isSeq(inserted)) {
						for (const index of ownedRows) {
							const entry = this.#map(inserted.items[index]);
							if (entry === undefined) continue;
							insertions += 1;
							this.#entryNode = entry;
							this.#fields.clear();
							this.#unknownSelector = false;
							this.#readFields(entry);
						}
					} else if (direct) {
						if (insertions === 0) continue;
						const selector = this.#yaml.value(this.#yaml.field(map, "name"));
						if (selector instanceof CordisExpression || selector && this.#field("name") instanceof CordisExpression) {
							this.#unknownSelector = true;
							continue;
						}
						if (selector && selector !== this.#field("name")) continue;
						this.#readFields(map, new Set(["id", "name"]));
					}
				}
				this.#operations = operations;
				this.#insertions = insertions;
				this.#editabilityError = this.#unknownStructure ? new ConfigurationError("Expression-backed Cordis patches have unknown structure; use literal patches before setup") : malformedStructure ? new ConfigurationError("Malformed Cordis patches cannot be edited safely; use mapping entries and insert lists before setup") : operations.some((op) => op.unknownApplicability && op.ownedRows.length > 0) ? new ConfigurationError("Cordis REA insertion targets a group with unknown activity; use a direct insertion before setup") : this.#unknownSelector ? new ConfigurationError("Expression-backed Cordis name selectors have unknown applicability; use literal selectors before setup", { settings: [{
					setting: "name",
					constraint: "Use literal selectors before setup"
				}] }) : undefined;
				const config = this.#field("config");
				this.config = insertions === 0 ? undefined : isRecord(config) ? config : {};
			}
			#map(node) {
				const map = this.#yaml.resolve(node);
				return isMap(map) ? map : undefined;
			}
			#id(node) {
				const id = this.#yaml.value(this.#yaml.field(this.#map(node), "id"));
				if (id instanceof CordisExpression) throw new ConfigurationError("Expression-backed Cordis IDs have unknown ownership; use literal IDs before changing registrations");
				return id;
			}
			#field(key) {
				return this.#yaml.value(this.#fields.get(key));
			}
			#readFields(map, omitted = new Set()) {
				for (const pair of map.items) {
					const key = this.#yaml.value(pair.key);
					if (typeof key === "string" && !omitted.has(key)) this.#fields.set(key, pair.value);
				}
			}
			get carriesEntry() {
				return this.#operations.some((op) => op.direct || op.ownedRows.length > 0);
			}
			get hasUnknownStructure() {
				return this.#unknownStructure;
			}
			get editabilityError() {
				return this.#editabilityError;
			}
			get ready() {
				const disabled = this.#field("disabled");
				return this.#insertions === 1 && this.#editabilityError === undefined && this.#field("name") === "@deepseek-ai/dsh-mcp-client" && (disabled === undefined || disabled === false);
			}
			/** Validate literals without treating expression source as an environment value. */
			environment(overrides = {}, validation = "effective", platform = process.platform) {
				const config = this.#field("config");
				if (config instanceof CordisExpression) return err(new ConfigurationError("Expression-backed Cordis config cannot be safely edited", { settings: [{
					setting: "config",
					constraint: "Use a literal mapping to preserve caller fields during setup"
				}] }));
				if (config !== undefined && !isRecord(config)) return err(new ConfigurationError("Cordis REA config must be a mapping", { settings: [{
					setting: "config",
					constraint: "Use a literal mapping before setup"
				}] }));
				const raw = this.config?.env;
				if (raw !== undefined && !isRecord(raw)) return err(new ConfigurationError("Cordis server environment must be a mapping"));
				const literals = Object.create(null);
				const unresolvedSettings = new Set();
				for (const [key, value] of Object.entries(mergeEnvironmentOverrides(raw ?? {}, overrides, platform))) {
					if (value instanceof CordisExpression) {
						unresolvedSettings.add(key);
						continue;
					}
					if (typeof value !== "string") return err(new ConfigurationError("Invalid Cordis server environment", { settings: [{
						setting: `env.${key}`,
						constraint: "Environment values must be strings or Cordis expressions"
					}] }));
					literals[key] = value;
				}
				const runtimeEnvironment = snapshotEnvironment(literals, platform);
				const unresolved = new Set(Object.keys(snapshotEnvironment(Object.fromEntries([...unresolvedSettings].map((key) => [key, ""])), platform)));
				const validated = validation === "fragment" ? parseEnvironmentValues(runtimeEnvironment, unresolved) : parseEnvironment(runtimeEnvironment, unresolved);
				return validated.ok ? ok({
					values: literals,
					configuration: validated.value,
					unresolvedSettings: unresolved
				}) : validated;
			}
			desired(command, overrides) {
				if (this.#editabilityError !== undefined) return err(this.#editabilityError);
				const environment = this.environment(overrides);
				if (!environment.ok) return environment;
				const env = mergeEnvironmentOverrides(isRecord(this.config?.env) ? this.config.env : {}, overrides);
				const desired = {
					...this.config,
					...dshClientRegistrationEntry(command)
				};
				delete desired.env;
				if (Object.keys(env).length > 0) desired.env = env;
				return ok(desired);
			}
			/** Plan every replacement from source snapshots before changing an output tree. */
			serialize(desired) {
				if (this.#editabilityError !== undefined && (this.#unknownStructure || desired !== undefined)) throw this.#editabilityError;
				const root = this.#yaml.document.contents;
				if (!isSeq(root)) throw new ConfigurationError("Cordis patches must be a list");
				const replacements = new Map();
				const invalidated = new Set(this.#operations.flatMap((op) => op.direct || op.ownedRows.length > 0 ? this.#yaml.anchors(op.source) : []));
				let carried = false;
				for (const op of this.#operations) {
					if (op.direct) {
						replacements.set(op.source, undefined);
						continue;
					}
					if (op.ownedRows.length === 0) continue;
					const copy = this.#yaml.detach(op.map, invalidated);
					if (!isMap(copy)) throw new ConfigurationError("Cordis operation is not a mapping");
					const inserted = this.#yaml.detach(this.#yaml.resolve(this.#yaml.field(op.map, "insert")), invalidated);
					if (!isSeq(inserted)) throw new ConfigurationError("Cordis insertion is not a list");
					copy.set("insert", inserted);
					const owned = new Set(op.ownedRows);
					inserted.items = inserted.items.flatMap((entry, index) => {
						if (!owned.has(index)) return [entry];
						if (carried || desired === undefined) return [];
						carried = true;
						return [this.#entry(desired, invalidated)];
					});
					if (inserted.items.length === 0) copy.delete("insert");
					const kept = inserted.items.length > 0 || this.#id(op.map) !== "rea-mcp" && copy.items.some((pair) => !SELECTOR_KEYS.has(this.#yaml.value(pair.key)));
					replacements.set(op.source, kept ? copy : undefined);
				}
				const output = this.#yaml.document.clone();
				const outputRoot = output.contents;
				if (!isSeq(outputRoot)) throw new ConfigurationError("Cordis patches must be a list");
				outputRoot.items = root.items.flatMap((source) => {
					const copy = replacements.has(source) ? replacements.get(source) : this.#yaml.copy(source, invalidated);
					return copy === undefined ? [] : [copy];
				});
				if (!carried && desired !== undefined) outputRoot.items.push(output.createNode({ insert: [{
					id: DSH_ENTRY_ID,
					name: DSH_CLIENT_PACKAGE,
					config: desired
				}] }));
				return output.toString({ lineWidth: 0 });
			}
			#entry(desired, invalidated) {
				const entry = this.#yaml.detach(this.#entryNode, invalidated);
				if (!isMap(entry)) throw new ConfigurationError("Cordis entry is not a mapping");
				this.#yaml.setValue(entry, "id", DSH_ENTRY_ID);
				this.#yaml.setValue(entry, "name", DSH_CLIENT_PACKAGE);
				entry.delete("disabled");
				for (const [key, value] of this.#fields) {
					if ([
						"id",
						"name",
						"config",
						"disabled"
					].includes(key)) continue;
					entry.set(key, this.#yaml.detach(value, invalidated));
				}
				const sourceConfig = this.#map(this.#fields.get("config"));
				const config = sourceConfig === undefined ? this.#yaml.document.createNode({}) : this.#yaml.detach(sourceConfig, invalidated);
				if (!isMap(config)) throw new ConfigurationError("Cordis registration config is not a mapping");
				for (const key of LAUNCHER_KEYS) this.#yaml.setValue(config, key, desired[key]);
				const env = this.#map(this.#yaml.field(sourceConfig, "env"));
				const desiredEnv = desired.env;
				if (isRecord(desiredEnv)) {
					const nextEnv = env === undefined ? this.#yaml.document.createNode({}) : this.#yaml.detach(env, invalidated);
					if (!isMap(nextEnv)) throw new ConfigurationError("Cordis environment is not a mapping");
					for (const pair of [...nextEnv.items]) {
						const key = this.#yaml.key(pair.key);
						if (Object.hasOwn(desiredEnv, key)) {
							this.#yaml.renameKey(nextEnv, pair, key);
							continue;
						}
						const alias = process.platform === "win32" ? Object.keys(desiredEnv).find((name) => name.toUpperCase() === key.toUpperCase()) : undefined;
						if (alias === undefined) nextEnv.delete(pair.key);
						else this.#yaml.renameKey(nextEnv, pair, alias);
					}
					for (const [key, value] of Object.entries(desiredEnv)) {
						this.#yaml.setValue(nextEnv, key, value);
					}
					config.set("env", nextEnv);
				} else config.delete("env");
				entry.set("config", config);
				return entry;
			}
		};
		DshCordisEdit = class {
			source;
			desired;
			constructor(source, desired) {
				this.source = source;
				this.desired = desired;
			}
		};
		dshDocument = (document) => {
			if (!(document.cordis instanceof DshCordisDocument)) throw new ConfigurationError("Missing Cordis document owner");
			return document.cordis;
		};
		parseDshCordisDocument = (text) => {
			const source = new DshCordisDocument(text);
			return {
				document: { cordis: source },
				servers: source.config === undefined ? {} : { rea: source.config },
				serversPath: [],
				dialect: "dsh",
				environmentKey: "env",
				legacyServers: {}
			};
		};
		editDshDocument = (parsed, desired) => ({ cordis: new DshCordisEdit(dshDocument(parsed.document), desired) });
		serializeDshDocument = (document) => {
			if (!(document.cordis instanceof DshCordisEdit)) throw new ConfigurationError("Missing Cordis edit plan");
			return document.cordis.source.serialize(document.cordis.desired);
		};
		dshClientRegistrationEntry = (command, environment = {}) => {
			const [executable = "rea", ...args] = command;
			return {
				serverName: "rea",
				transport: "stdio",
				command: executable,
				args,
				...Object.keys(environment).length === 0 ? {} : { env: { ...environment } }
			};
		};
	})))();
}

//#endregion
//#region dist/application/HermesConfigurationYaml.js
var SOURCE_SCALAR_TAGS, timestampTag, timestampSource, hermesTimestampImplicit, floorDivide, civilDay, parseHermesTimestamp, numericValue, numericValuesEqual, sameResolvedScalarValue, keepScalarSource, createHermesYamlOptions, stringifyHermesConfigurationYaml, isEmptyYamlRoot, parseHermesDocument, parseHermesConfigurationYaml, retainHermesScalarSource, copyHermesAliasSource, retainHermesAliasConsumers, editHermesConfigurationYaml;
function init_HermesConfigurationYaml() {
	return (init_HermesConfigurationYaml = __esmMin((() => {
		SOURCE_SCALAR_TAGS = new Set([
			"tag:yaml.org,2002:int",
			"tag:yaml.org,2002:float",
			"tag:yaml.org,2002:timestamp"
		]);
		timestampTag = new Schema({ schema: "yaml-1.1" }).tags.find((tag) => tag.tag === "tag:yaml.org,2002:timestamp" && tag.collection === undefined);
		if (timestampTag === undefined) throw new Error("The YAML 1.1 schema must provide its timestamp tag");
		timestampSource = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:(?:[Tt]|[ \t]+)(\d{1,2}):(\d{2}):(\d{2})(?:\.([0-9]*))?(?:[ \t]*(Z|([-+])(\d{1,2})(?::(\d{2}))?))?)?$/;
		hermesTimestampImplicit = /^(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{1,2}-\d{1,2}(?:[Tt]|[ \t]+)\d{1,2}:\d{2}:\d{2}(?:\.[0-9]*)?(?:[ \t]*(?:Z|[-+]\d{1,2}(?::\d{2})?))?)$/;
		floorDivide = (value, divisor) => Math.floor(value / divisor);
		civilDay = (year, month, day) => {
			const adjustedYear = year - (month <= 2 ? 1 : 0);
			const era = floorDivide(adjustedYear, 400);
			const yearOfEra = adjustedYear - era * 400;
			const adjustedMonth = month + (month > 2 ? -3 : 9);
			const dayOfYear = floorDivide(153 * adjustedMonth + 2, 5) + day - 1;
			const dayOfEra = yearOfEra * 365 + floorDivide(yearOfEra, 4) - floorDivide(yearOfEra, 100) + dayOfYear;
			return era * 146097 + dayOfEra - 719468;
		};
		parseHermesTimestamp = (source) => {
			const match = timestampSource.exec(source);
			if (match === null) return undefined;
			const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, zone, sign, zoneHourText, zoneMinuteText] = match;
			if (yearText === undefined || monthText === undefined || dayText === undefined) return undefined;
			const year = Number(yearText);
			const month = Number(monthText);
			const dayOfMonth = Number(dayText);
			if (year < 1 || year > 9999 || month < 1 || month > 12) return undefined;
			const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
			const monthDays = [
				31,
				leapYear ? 29 : 28,
				31,
				30,
				31,
				30,
				31,
				31,
				30,
				31,
				30,
				31
			];
			if (dayOfMonth < 1 || dayOfMonth > (monthDays[month - 1] ?? 0)) return undefined;
			const date = `${yearText}-${monthText.padStart(2, "0")}-${dayText.padStart(2, "0")}`;
			const day = civilDay(year, month, dayOfMonth);
			if (hourText === undefined) {
				const micros = BigInt(day) * 86400000000n;
				return {
					key: `date:${date}`,
					value: new Date(Number(micros / 1000n))
				};
			}
			const hour = Number(hourText);
			const minute = Number(minuteText);
			const second = Number(secondText);
			if (hour > 23 || minute > 59 || second > 59) return undefined;
			const zoneHour = Number(zoneHourText ?? 0);
			const zoneMinute = Number(zoneMinuteText ?? 0);
			if (zoneHour > 23 || zoneMinute > 59) return undefined;
			let microseconds = 0;
			if (fraction !== undefined && fraction.length > 0) {
				microseconds = Number((fraction.slice(0, 6) + "000000").slice(0, 6));
				if (fraction.length > 6 && Number(fraction[6]) > 4) microseconds += 1;
			}
			const wholeSeconds = hour * 3600 + minute * 60 + second;
			if (year === 9999 && month === 12 && dayOfMonth === 31 && wholeSeconds === 86399 && microseconds === 1e6) return undefined;
			let micros = BigInt(day) * 86400000000n + BigInt(wholeSeconds) * 1000000n + BigInt(microseconds);
			if (zone !== undefined && zone !== "Z") {
				const offset = (zoneHour * 60 + zoneMinute) * (sign === "+" ? 1 : -1);
				micros -= BigInt(offset) * 60000000n;
			}
			return {
				key: zone === undefined ? `datetime-local:${micros}` : `datetime-utc:${micros}`,
				value: new Date(Number(micros / 1000n - (micros % 1000n < 0n ? 1n : 0n)))
			};
		};
		numericValue = (value) => {
			if (typeof value === "boolean") return value ? 1n : 0n;
			if (typeof value === "bigint" || typeof value === "number") return value;
			return undefined;
		};
		numericValuesEqual = (left, right) => {
			if (typeof left === "bigint" && typeof right === "bigint") return left === right;
			if (typeof left === "number" && typeof right === "number") return left === right || Number.isNaN(left) && Number.isNaN(right);
			const integer = typeof left === "bigint" ? left : right;
			const number = typeof left === "number" ? left : right;
			return Number.isFinite(number) && Number.isInteger(number) && BigInt(number) === integer;
		};
		sameResolvedScalarValue = (left, right) => Object.is(left, right) || left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
		keepScalarSource = (tag) => {
			if (typeof tag === "string" || tag.collection !== undefined) return tag;
			const { stringify } = tag;
			if (!SOURCE_SCALAR_TAGS.has(tag.tag) || stringify === undefined) return tag;
			return {
				...tag,
				stringify: (item, context, ...rest) => {
					const { source } = item;
					if (source === undefined) return stringify(item, context, ...rest);
					const reader = context.doc.schema.tags.find((candidate) => candidate.default === true && candidate.test?.test(source) === true);
					const read = reader?.resolve(source, () => undefined, context.doc.options);
					return sameResolvedScalarValue(isScalar(read) ? read.value : read, item.value) ? source : stringify(item, context, ...rest);
				}
			};
		};
		createHermesYamlOptions = () => {
			const timestamps = new Map();
			const timestampFacts = (source) => {
				if (timestamps.has(source)) return timestamps.get(source);
				const facts = parseHermesTimestamp(source);
				timestamps.set(source, facts);
				return facts;
			};
			const hermesTimestampTag = {
				...timestampTag,
				test: hermesTimestampImplicit,
				resolve: (source) => {
					const facts = timestampFacts(source);
					if (facts === undefined) throw new Error(`Invalid Hermes YAML timestamp: ${source}`);
					return facts.value;
				}
			};
			const keyFacts = new WeakMap();
			const hermesKey = (node) => {
				const cached = keyFacts.get(node);
				if (cached !== undefined) return cached;
				if (!isScalar(node)) return {
					kind: "other",
					value: node
				};
				const numeric = numericValue(node.value);
				const key = numeric !== undefined ? {
					kind: "numeric",
					value: numeric
				} : node.value instanceof Date ? {
					kind: "timestamp",
					value: timestampFacts(node.source ?? "")?.key ?? `invalid:${node.source ?? ""}`
				} : {
					kind: "other",
					value: node.value
				};
				keyFacts.set(node, key);
				return key;
			};
			/** Python dict key equality is Hermes' duplicate-key behavior (bool is int). */
			const hermesKeysEqual = (leftNode, rightNode) => {
				const left = hermesKey(leftNode);
				const right = hermesKey(rightNode);
				if (left.kind !== right.kind) return false;
				if (left.kind === "numeric" && right.kind === "numeric") return numericValuesEqual(left.value, right.value);
				return left.value === right.value;
			};
			return {
				version: "1.1",
				intAsBigInt: true,
				customTags: (tags) => {
					const hasTimestamp = tags.some((tag) => typeof tag !== "string" && tag.tag === timestampTag.tag);
					const withHermesTimestamp = hasTimestamp ? tags.map((tag) => typeof tag !== "string" && tag.tag === timestampTag.tag ? hermesTimestampTag : tag) : [...tags, hermesTimestampTag];
					return withHermesTimestamp.map(keepScalarSource);
				},
				uniqueKeys: hermesKeysEqual
			};
		};
		stringifyHermesConfigurationYaml = (document) => new Document(document, createHermesYamlOptions()).toString({ lineWidth: 0 });
		isEmptyYamlRoot = (root) => root === null || isScalar(root) && root.value === null && root.source === "" && root.tag === undefined && root.anchor === undefined;
		parseHermesDocument = (text) => {
			const document = parseDocument(text, createHermesYamlOptions());
			const error = document.errors[0];
			if (error !== undefined) throw error;
			return document;
		};
		parseHermesConfigurationYaml = (text) => {
			const document = parseHermesDocument(text);
			return isEmptyYamlRoot(document.contents) ? {} : document.toJS({ reviver: (_key, value) => typeof value === "bigint" ? Number(value) : value });
		};
		retainHermesScalarSource = (previous, next) => {
			if (isScalar(previous) && isScalar(next) && previous.value === next.value) return previous;
			if (isMap(previous) && isMap(next)) {
				const entries = new Map(previous.items.flatMap((pair) => isScalar(pair.key) && typeof pair.key.value === "string" ? [[pair.key.value, pair]] : []));
				for (const pair of next.items) {
					const key = isScalar(pair.key) ? pair.key.value : undefined;
					const prior = typeof key === "string" ? entries.get(key) : undefined;
					if (prior === undefined) continue;
					pair.key = prior.key;
					if (isNode(pair.value)) pair.value = retainHermesScalarSource(prior.value, pair.value);
				}
			} else if (isSeq(previous) && isSeq(next)) {
				next.items = next.items.map((item, index) => isNode(item) ? retainHermesScalarSource(previous.items[index], item) : item);
			}
			return next;
		};
		copyHermesAliasSource = (source, document, visiting = new Set()) => {
			const node = isAlias(source) ? source.resolve(document) : source;
			if (isAlias(source) && node === undefined) throw new TypeError("Cannot edit an unresolved Hermes YAML alias");
			if (!isNode(node)) return node;
			if (visiting.has(node)) throw new TypeError("Cannot edit cyclic Hermes YAML aliases");
			visiting.add(node);
			const copied = node.clone();
			if (isScalar(copied) || isMap(copied) || isSeq(copied)) delete copied.anchor;
			if (isSeq(node) && isSeq(copied)) copied.items = node.items.map((item) => copyHermesAliasSource(item, document, visiting));
			else if (isMap(node) && isMap(copied)) copied.items.forEach((pair, index) => {
				const original = node.items[index];
				if (original === undefined) return;
				pair.key = copyHermesAliasSource(original.key, document, visiting);
				pair.value = copyHermesAliasSource(original.value, document, visiting);
			});
			if (isAlias(source)) {
				delete copied.commentBefore;
				delete copied.comment;
				if (source.commentBefore !== undefined) copied.commentBefore = source.commentBefore;
				if (source.comment !== undefined) copied.comment = source.comment;
			}
			visiting.delete(node);
			return copied;
		};
		retainHermesAliasConsumers = (document, previous) => {
			if (!isNode(previous)) return;
			const replaced = new Set();
			visit$1(previous, { Node: (_key, node) => {
				replaced.add(node);
			} });
			visit$1(document, { Alias: (_key, alias, path) => {
				const source = alias.resolve(document);
				if (source === undefined || !replaced.has(source) || path.some((parent) => isNode(parent) && replaced.has(parent))) return;
				const copied = copyHermesAliasSource(alias, document);
				return isNode(copied) ? copied : undefined;
			} });
		};
		editHermesConfigurationYaml = (text, path, value) => {
			const document = parseHermesDocument(text);
			const root = document.contents;
			if (isEmptyYamlRoot(root)) {
				const map = document.createNode({});
				if (isScalar(root)) map.commentBefore = [root.commentBefore, root.comment].filter((comment) => comment !== undefined).join("\n");
				document.contents = map;
			}
			for (let length = 1; length < path.length; length++) {
				const parent = path.slice(0, length);
				const previous = document.getIn(parent, true);
				if (isAlias(previous)) {
					const copied = copyHermesAliasSource(previous, document);
					if (isMap(copied)) {
						document.setIn(parent, copied);
					}
				} else if (value !== undefined && !document.hasIn(parent)) {
					document.setIn(parent, document.createNode({}));
				}
			}
			retainHermesAliasConsumers(document, document.getIn(path, true));
			if (value === undefined) {
				if (!document.deleteIn(path)) return text;
			} else {
				const previous = document.getIn(path, true);
				document.setIn(path, isMap(previous) || isSeq(previous) ? retainHermesScalarSource(previous, document.createNode(value)) : value);
			}
			return document.toString({
				lineWidth: 0,
				...document.directives?.yaml.version === "1.2" ? {
					defaultStringType: "QUOTE_DOUBLE",
					defaultKeyType: "QUOTE_DOUBLE"
				} : {}
			});
		};
	})))();
}

//#endregion
//#region dist/application/ClientConfigurationDocument.js
var clientConfigurationRecordSchema, clientConfigurationValuesEqual, normalizeConfigurationValue, clientConfigurationServersKey, isEmptyClientConfigurationText, INT64_MIN, INT64_MAX, parseClientToml, parseDocument$1, ClientConfigurationShapeError, requireObject, parseZcodeFallbackConfiguration, OPENCODE_V2_MCP_SETTINGS, parseClientConfiguration, effectiveClientServer, withClientServers, valueAt, TOML_BASIC_ESCAPES, skipHorizontalSpace, decodeBasicEscape, parseQuotedKey, parseBareKey, parseTomlTableHeader, tomlStringModeAfter, closeMultiline, isBlankOrComment, looksLikeTomlHeader, isTomlServerTable, parseKeyPath, parseAssignment, skipWsAndComments, endOfTomlValue, endOfContainer, tomlBasicString, tomlInlineKey, tomlInlineValue, readTrivia, commasOutsideComments, hasSeparatorComma, editInlineServerTable, rebuildInlineTable, rebuildDelimitedEntries, tomlStringValue, tomlArrayWithoutString, disabledServerListEdit, disabledServerListLines, withoutTrailingLineFeeds, tomlCommentLines, upsertTomlServerSection, tomlServerEntry, grokServerListedDisabled, OMP_DISABLED_SERVERS_KEY, ompServerListedDisabled, OMP_ENABLED_SERVERS_KEY, clientServerForcedEnabled, clientServerListedDisabled, serializeGrokConfiguration, withoutEmptyServerTable, serializeCodexConfiguration, tomlTextHolds, JSON_COMMA, nextJsoncToken, isJsonMember, effectiveJsonProperty, effectiveJsonObject, NO_SHADOWED_SERVERS, JSON_STRING, JSON_EOF, hasRepeatedJsonString, shadowedJsonMembers, shadowedClientServers, applyFormattedJsonEdit, deleteJsonMembers, editJsonMember, serializeClientConfiguration, clientServerPath, legacyClientServerPath, serializeHermesConfiguration, clientRegistrationEntry, parseGeminiMcpPolicy, normalizeGeminiServerName, geminiServerPolicyBlock;
function init_ClientConfigurationDocument() {
	return (init_ClientConfigurationDocument = __esmMin((() => {
		init_DshCordisPatch();
		init_HermesConfigurationYaml();
		init_result();
		init_identity();
		init_unicodeCodePointOrder();
		clientConfigurationRecordSchema = z.custom((value) => {
			if (typeof value !== "object" || value === null) return false;
			const prototype = Object.getPrototypeOf(value);
			return prototype === null || prototype === Object.prototype;
		}).transform((value) => Object.fromEntries(Object.entries(value)));
		clientConfigurationValuesEqual = (left, right) => isDeepStrictEqual(normalizeConfigurationValue(left), normalizeConfigurationValue(right));
		normalizeConfigurationValue = (value) => {
			if (Array.isArray(value)) return value.map(normalizeConfigurationValue);
			if (typeof value !== "object" || value === null || value instanceof Date) return value;
			return Object.fromEntries(Object.entries(value).sort(([left], [right]) => compareUnicodeCodePoints(left, right)).map(([key, nested]) => [key, normalizeConfigurationValue(nested)]));
		};
		clientConfigurationServersKey = (format) => {
			switch (format) {
				case "toml":
				case "grok":
				case "hermes": return "mcp_servers";
				case "opencode":
				case "zcode": return "mcp";
				case "vscode": return "servers";
				default: return "mcpServers";
			}
		};
		isEmptyClientConfigurationText = (text) => text.replace(/^\uFEFF/, "").trim() === "";
		INT64_MIN = -(2n ** 63n);
		INT64_MAX = 2n ** 63n - 1n;
		parseClientToml = (text) => {
			const parsed = parse(text, { integersAsBigInt: "asNeeded" });
			const pending = [parsed];
			for (let value = pending.pop(); value !== undefined; value = pending.pop()) {
				if (typeof value === "bigint") {
					if (value < INT64_MIN || value > INT64_MAX) throw new SyntaxError(`Invalid TOML document: integer ${String(value)} is outside the signed 64-bit range`);
				} else if (typeof value === "object" && value !== null && !(value instanceof Date)) for (const nested of Object.values(value)) pending.push(nested);
			}
			return parsed;
		};
		parseDocument$1 = (text, format) => {
			if (format === "toml" || format === "grok") return requireObject(parseClientToml(text), "The configuration root");
			if (format === "pi" || format === "kimi") {
				if (format === "kimi" && text.trim().length === 0) return {};
				return requireObject(JSON.parse(text), "The configuration root");
			}
			if (isEmptyClientConfigurationText(text)) return {};
			if (format === "hermes") return requireObject(parseHermesConfigurationYaml(text), "The configuration root");
			if (format === "zcode") return requireObject(JSON.parse(text), "The configuration root");
			if (format === "claude_code") return requireObject(JSON.parse(text.replace(/^\uFEFF/, "")), "The configuration root");
			const errors = [];
			const jsonText = text.startsWith("﻿") ? ` ${text.slice(1)}` : text;
			const root = parseTree(jsonText, errors, { allowTrailingComma: true });
			const firstError = errors[0];
			if (firstError !== undefined) throw new SyntaxError(`Invalid JSON/JSONC at offset ${firstError.offset}: ${printParseErrorCode(firstError.error)}`);
			return requireObject(root === undefined ? undefined : getNodeValue(root), "The configuration root");
		};
		ClientConfigurationShapeError = class extends TypeError {};
		requireObject = (value, description) => {
			const parsed = clientConfigurationRecordSchema.safeParse(value);
			if (parsed.success) return parsed.data;
			throw new ClientConfigurationShapeError(`${description} must be an object`, { cause: parsed.error });
		};
		parseZcodeFallbackConfiguration = (text) => {
			const document = requireObject(JSON.parse(text), "ZCode fallback root");
			return {
				document,
				servers: document.mcpServers === undefined ? {} : requireObject(document.mcpServers, "ZCode fallback mcpServers"),
				serversPath: ["mcpServers"],
				dialect: "zcode_fallback",
				environmentKey: "env",
				legacyServers: {}
			};
		};
		OPENCODE_V2_MCP_SETTINGS = new Set(["servers", "timeout"]);
		parseClientConfiguration = (text, format) => {
			if (format === undefined || format === "unsupported") throw new TypeError("client does not have a supported MCP config format");
			if (format === "zcode_fallback") return parseZcodeFallbackConfiguration(text);
			if (format === "dsh") return parseDshCordisDocument(text);
			const document = parseDocument$1(text, format);
			const environmentKey = format === "opencode" ? "environment" : "env";
			const serversKey = clientConfigurationServersKey(format);
			const value = document[serversKey];
			const servers = value === undefined ? {} : requireObject(value, `"${serversKey}"`);
			if (format === "zcode") {
				const nested = servers.servers;
				return {
					document,
					servers: nested === undefined ? {} : requireObject(nested, `"${serversKey}.servers"`),
					serversPath: [serversKey, "servers"],
					dialect: format,
					environmentKey,
					legacyServers: {}
				};
			}
			const native = servers.servers;
			if (format !== "opencode" || native === undefined || typeof native === "object" && native !== null && "type" in native && typeof native.type === "string") return {
				document,
				servers,
				serversPath: [serversKey],
				dialect: format,
				environmentKey,
				legacyServers: {}
			};
			return {
				document,
				servers: requireObject(native, `"${serversKey}.servers"`),
				serversPath: [serversKey, "servers"],
				dialect: "opencode_v2",
				environmentKey,
				legacyServers: Object.fromEntries(Object.entries(servers).filter(([name]) => !OPENCODE_V2_MCP_SETTINGS.has(name)))
			};
		};
		effectiveClientServer = (parsed, name) => {
			const native = Object.hasOwn(parsed.servers, name);
			const value = native ? parsed.servers[name] : Object.hasOwn(parsed.legacyServers, name) ? parsed.legacyServers[name] : undefined;
			if (parsed.dialect !== "opencode" && parsed.dialect !== "opencode_v2" || typeof value !== "object" || value === null || Array.isArray(value)) return value;
			const { enabled, ...registration } = value;
			return (parsed.dialect === "opencode" || !native) && typeof enabled === "boolean" ? {
				...registration,
				disabled: !enabled
			} : registration;
		};
		withClientServers = (parsed, servers, removeLegacy) => {
			if (parsed.dialect === "dsh") return Object.hasOwn(servers, PRODUCT_IDENTITY.mcpServerKey) ? editDshDocument(parsed, clientConfigurationRecordSchema.parse(servers[PRODUCT_IDENTITY.mcpServerKey])) : editDshDocument(parsed);
			const [key = "", nested] = parsed.serversPath;
			if (nested === undefined) return {
				...parsed.document,
				[key]: servers
			};
			const outerValue = parsed.document[key];
			const outer = outerValue === undefined ? {} : clientConfigurationRecordSchema.parse(outerValue);
			if (parsed.dialect === "opencode_v2" && removeLegacy !== undefined && !OPENCODE_V2_MCP_SETTINGS.has(removeLegacy)) delete outer[removeLegacy];
			return {
				...parsed.document,
				[key]: {
					...outer,
					[nested]: servers
				}
			};
		};
		valueAt = (document, path) => {
			let current = document;
			for (const key of path) {
				const object = clientConfigurationRecordSchema.safeParse(current);
				if (!object.success || !Object.hasOwn(object.data, key)) return undefined;
				current = object.data[key];
			}
			return current;
		};
		TOML_BASIC_ESCAPES = {
			b: "\b",
			t: "	",
			n: "\n",
			f: "\f",
			r: "\r",
			e: "\x1B",
			"\"": "\"",
			"\\": "\\"
		};
		skipHorizontalSpace = (line, index) => {
			let next = index;
			while (line[next] === " " || line[next] === "	") next += 1;
			return next;
		};
		decodeBasicEscape = (line, slash) => {
			const escape = line[slash + 1];
			if (escape === undefined) return undefined;
			const simple = TOML_BASIC_ESCAPES[escape];
			if (simple !== undefined) return {
				value: simple,
				next: slash + 2
			};
			if (escape === "x") {
				const hex = line.slice(slash + 2, slash + 4);
				if (!/^[0-9A-Fa-f]{2}$/u.test(hex)) return undefined;
				return {
					value: String.fromCodePoint(Number.parseInt(hex, 16)),
					next: slash + 4
				};
			}
			if (escape !== "u" && escape !== "U") return undefined;
			const length = escape === "u" ? 4 : 8;
			const hex = line.slice(slash + 2, slash + 2 + length);
			if (!new RegExp(`^[0-9A-Fa-f]{${String(length)}}$`, "u").test(hex)) return undefined;
			const code = Number.parseInt(hex, 16);
			if (code > 1114111 || code >= 55296 && code <= 57343) return undefined;
			return {
				value: String.fromCodePoint(code),
				next: slash + 2 + length
			};
		};
		parseQuotedKey = (line, start) => {
			const quote = line[start];
			if (quote !== "\"" && quote !== "'" || line.startsWith(quote === "\"" ? "\"\"\"" : "'''", start)) return undefined;
			if (quote === "'") {
				const end = line.indexOf("'", start + 1);
				if (end < 0 || line.slice(start + 1, end).includes("\n")) return undefined;
				return {
					value: line.slice(start + 1, end),
					next: end + 1
				};
			}
			let value = "";
			let index = start + 1;
			while (index < line.length) {
				const char = line[index];
				if (char === "\n" || char === "\r") return undefined;
				if (char === "\"") return {
					value,
					next: index + 1
				};
				if (char !== "\\") {
					value += char ?? "";
					index += 1;
					continue;
				}
				const decoded = decodeBasicEscape(line, index);
				if (decoded === undefined) return undefined;
				value += decoded.value;
				index = decoded.next;
			}
			return undefined;
		};
		parseBareKey = (line, start) => {
			let index = start;
			while (/[A-Za-z0-9_-]/u.test(line[index] ?? "")) index += 1;
			if (index === start) return undefined;
			return {
				value: line.slice(start, index),
				next: index
			};
		};
		parseTomlTableHeader = (line) => {
			let index = skipHorizontalSpace(line, 0);
			const array = line.startsWith("[[", index);
			if (!array && line[index] !== "[") return undefined;
			index += array ? 2 : 1;
			const path = [];
			for (;;) {
				index = skipHorizontalSpace(line, index);
				const key = line[index] === "\"" || line[index] === "'" ? parseQuotedKey(line, index) : parseBareKey(line, index);
				if (key === undefined) return undefined;
				path.push(key.value);
				index = skipHorizontalSpace(line, key.next);
				if (line[index] !== ".") break;
				index += 1;
			}
			const close = array ? "]]" : "]";
			if (!line.startsWith(close, index)) return undefined;
			index = skipHorizontalSpace(line, index + close.length);
			if (index < line.length && line[index] !== "#") return undefined;
			return { path };
		};
		tomlStringModeAfter = (line, mode, start = 0) => {
			if (mode === "ml-basic" || mode === "ml-literal") {
				const delimiter = mode === "ml-basic" ? "\"\"\"" : "'''";
				const closed = closeMultiline(line, start, delimiter, mode === "ml-basic");
				if (closed === undefined) return mode;
				return tomlStringModeAfter(line, "none", closed);
			}
			let index = start;
			while (index < line.length) {
				if (line[index] === "#") return "none";
				if (line.startsWith("\"\"\"", index)) {
					const closed = closeMultiline(line, index + 3, "\"\"\"", true);
					if (closed === undefined) return "ml-basic";
					index = closed;
					continue;
				}
				if (line.startsWith("'''", index)) {
					const closed = closeMultiline(line, index + 3, "'''", false);
					if (closed === undefined) return "ml-literal";
					index = closed;
					continue;
				}
				const quote = line[index];
				if (quote === "\"" || quote === "'") {
					const quoted = parseQuotedKey(line, index);
					if (quoted === undefined) return "none";
					index = quoted.next;
					continue;
				}
				index += 1;
			}
			return "none";
		};
		closeMultiline = (line, start, delimiter, escapes) => {
			let index = start;
			while (index < line.length) {
				if (escapes && line[index] === "\\") {
					if (line[index + 1] === undefined) return undefined;
					index += 2;
					continue;
				}
				if (line.startsWith(delimiter, index)) {
					let end = index + delimiter.length;
					const quote = delimiter[0];
					let extra = 0;
					while (extra < 2 && line[end] === quote) {
						extra += 1;
						end += 1;
					}
					return end;
				}
				index += 1;
			}
			return undefined;
		};
		isBlankOrComment = (line) => {
			const trimmed = line.trimStart();
			return trimmed === "" || trimmed.startsWith("#");
		};
		looksLikeTomlHeader = (line) => line.trimStart().startsWith("[");
		isTomlServerTable = (path, serverKey) => path[0] === "mcp_servers" && path[1] === serverKey;
		parseKeyPath = (text, start) => {
			const segments = [];
			let index = start;
			for (;;) {
				index = skipHorizontalSpace(text, index);
				const current = text[index];
				if (current === undefined || current === "\n" || current === "\r") return undefined;
				const key = current === "\"" || current === "'" ? parseQuotedKey(text, index) : parseBareKey(text, index);
				if (key === undefined) return undefined;
				segments.push(key.value);
				index = skipHorizontalSpace(text, key.next);
				if (text[index] !== ".") return {
					segments,
					next: index
				};
				index += 1;
			}
		};
		parseAssignment = (line) => {
			const key = parseKeyPath(line, 0);
			if (key === undefined) return undefined;
			const equals = skipHorizontalSpace(line, key.next);
			if (line[equals] !== "=") return undefined;
			return {
				segments: key.segments,
				equals
			};
		};
		skipWsAndComments = (text, start) => {
			let index = start;
			while (index < text.length) {
				const char = text[index];
				if (char === " " || char === "	" || char === "\n" || char === "\r") {
					index += 1;
					continue;
				}
				if (char === "#") {
					while (index < text.length && text[index] !== "\n") index += 1;
					continue;
				}
				return index;
			}
			return index;
		};
		endOfTomlValue = (text, start) => {
			const index = skipWsAndComments(text, start);
			if (index >= text.length) return index;
			if (text.startsWith("\"\"\"", index)) {
				const closed = closeMultiline(text, index + 3, "\"\"\"", true);
				return closed ?? text.length;
			}
			if (text.startsWith("'''", index)) {
				const closed = closeMultiline(text, index + 3, "'''", false);
				return closed ?? text.length;
			}
			const quote = text[index];
			if (quote === "\"" || quote === "'") {
				const quoted = parseQuotedKey(text, index);
				return quoted === undefined ? text.length : quoted.next;
			}
			if (quote === "{" || quote === "[") return endOfContainer(text, index);
			let cursor = index;
			while (cursor < text.length) {
				const char = text[cursor];
				if (char === "\n" || char === "#" || char === "," || char === "}" || char === "]") break;
				cursor += 1;
			}
			return cursor;
		};
		endOfContainer = (text, open) => {
			const closers = [text[open] === "{" ? "}" : "]"];
			let index = open + 1;
			while (index < text.length && closers.length > 0) {
				if (text.startsWith("\"\"\"", index)) {
					const closed = closeMultiline(text, index + 3, "\"\"\"", true);
					if (closed === undefined) return text.length;
					index = closed;
					continue;
				}
				if (text.startsWith("'''", index)) {
					const closed = closeMultiline(text, index + 3, "'''", false);
					if (closed === undefined) return text.length;
					index = closed;
					continue;
				}
				const quote = text[index];
				if (quote === "\"" || quote === "'") {
					const quoted = parseQuotedKey(text, index);
					if (quoted === undefined) return text.length;
					index = quoted.next;
					continue;
				}
				if (quote === "#") {
					while (index < text.length && text[index] !== "\n") index += 1;
					continue;
				}
				if (quote === "{" || quote === "[") {
					closers.push(quote === "{" ? "}" : "]");
					index += 1;
					continue;
				}
				if (quote === closers[closers.length - 1]) {
					closers.pop();
					index += 1;
					continue;
				}
				index += 1;
			}
			return index;
		};
		tomlBasicString = (value) => JSON.stringify(value).replaceAll("", "\\u007f");
		tomlInlineKey = (key) => /^[A-Za-z0-9_-]+$/u.test(key) ? key : tomlBasicString(key);
		tomlInlineValue = (value) => {
			if (typeof value === "string") return tomlBasicString(value);
			if (typeof value === "boolean") return value ? "true" : "false";
			if (typeof value === "number" && Number.isFinite(value)) return String(value);
			if (typeof value === "bigint") return String(value);
			if (Array.isArray(value)) return `[${value.map((item) => tomlInlineValue(item)).join(", ")}]`;
			if (typeof value === "object" && value !== null) {
				const body = Object.entries(value).map(([key, nested]) => `${tomlInlineKey(key)} = ${tomlInlineValue(nested)}`).join(", ");
				return `{ ${body} }`;
			}
			return "\"\"";
		};
		readTrivia = (text, start, limit) => {
			let index = start;
			while (index < limit) {
				const char = text[index];
				if (char === " " || char === "	" || char === "\n" || char === "\r" || char === ",") {
					index += 1;
					continue;
				}
				if (char === "#") {
					while (index < limit && text[index] !== "\n") index += 1;
					continue;
				}
				break;
			}
			return {
				text: text.slice(start, index),
				next: index
			};
		};
		commasOutsideComments = (trivia) => trivia.split("\n").map((part) => {
			const comment = part.indexOf("#");
			if (comment < 0) return part.replaceAll(",", "");
			return `${part.slice(0, comment).replaceAll(",", "")}${part.slice(comment)}`;
		}).join("\n");
		hasSeparatorComma = (trivia) => trivia.split("\n").some((part) => {
			const comment = part.indexOf("#");
			const code = comment < 0 ? part : part.slice(0, comment);
			return code.includes(",");
		});
		editInlineServerTable = (table, serverKey, entry) => {
			if (!table.startsWith("{")) return undefined;
			const end = endOfContainer(table, 0);
			if (table[end - 1] !== "}") return undefined;
			const pairs = [];
			const comments = [];
			let index = 1;
			let trailing = "";
			while (index < end - 1) {
				const trivia = readTrivia(table, index, end - 1);
				if (trivia.next >= end - 1) {
					trailing = trivia.text;
					break;
				}
				const key = parseKeyPath(table, trivia.next);
				if (key === undefined) return undefined;
				const equals = skipWsAndComments(table, key.next);
				if (table[equals] !== "=") return undefined;
				const valueEnd = endOfTomlValue(table, equals + 1);
				if (valueEnd > end - 1) return undefined;
				const pairText = table.slice(trivia.next, valueEnd);
				const drop = key.segments[0] === serverKey;
				if (drop) for (const comment of tomlCommentLines(pairText)) comments.push(comment);
				pairs.push({
					leading: trivia.text,
					text: pairText,
					drop
				});
				index = valueEnd;
			}
			const insertion = entry === undefined ? undefined : `${tomlInlineKey(serverKey)} = ${tomlInlineValue(entry)}`;
			if (insertion === undefined && pairs.every((pair) => !pair.drop)) return {
				text: table,
				comments
			};
			return {
				text: rebuildInlineTable(pairs, trailing, insertion),
				comments
			};
		};
		rebuildInlineTable = (pairs, trailing, insertion) => rebuildDelimitedEntries(pairs, trailing, insertion, "{", "}");
		rebuildDelimitedEntries = (pairs, trailing, insertion, open, close) => {
			const parts = [open];
			let emitted = false;
			let separatorPending = false;
			for (const pair of pairs) {
				if (pair.drop) {
					if (!pair.leading.includes("#")) continue;
					const dropped = !emitted || separatorPending ? commasOutsideComments(pair.leading) : pair.leading;
					parts.push(dropped);
					separatorPending = separatorPending || hasSeparatorComma(dropped);
					continue;
				}
				const kept = emitted ? pair.leading : commasOutsideComments(pair.leading);
				parts.push(separatorPending ? commasOutsideComments(kept) : kept);
				if (emitted && !separatorPending && !pair.leading.includes(",")) parts.push(", ");
				separatorPending = false;
				parts.push(pair.text);
				emitted = true;
			}
			if (insertion !== undefined) {
				if (!(emitted && separatorPending)) parts.push(emitted ? ", " : " ");
				parts.push(insertion);
				emitted = true;
			}
			if (!emitted) {
				const retained = `${parts.slice(1).join("")}${commasOutsideComments(trailing)}`;
				return retained.includes("#") ? `${open}${retained}${close}` : `${open}${close}`;
			}
			const tail = commasOutsideComments(trailing);
			parts.push(tail);
			if (tail === "" && open === "{") parts.push(" ");
			parts.push(close);
			return parts.join("");
		};
		tomlStringValue = (text) => {
			try {
				const value = parseClientToml(`value = ${text}`)["value"];
				return typeof value === "string" ? value : undefined;
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		tomlArrayWithoutString = (array, serverKey) => {
			if (!array.startsWith("[")) return undefined;
			const end = endOfContainer(array, 0);
			if (end !== array.length || array[end - 1] !== "]") return undefined;
			const pairs = [];
			let index = 1;
			let trailing = "";
			while (index < end - 1) {
				const trivia = readTrivia(array, index, end - 1);
				if (trivia.next >= end - 1) {
					trailing = trivia.text;
					break;
				}
				const valueEnd = endOfTomlValue(array, trivia.next);
				if (valueEnd > end - 1) return undefined;
				const text = array.slice(trivia.next, valueEnd);
				pairs.push({
					leading: trivia.text,
					text,
					drop: tomlStringValue(text) === serverKey
				});
				index = valueEnd;
			}
			if (pairs.every((pair) => !pair.drop)) return array;
			const rebuilt = rebuildDelimitedEntries(pairs, trailing, undefined, "[", "]");
			return rebuilt === "[]" ? "" : rebuilt;
		};
		disabledServerListEdit = (input) => {
			if (input.entry === undefined || input.tablePath.length !== 0 || input.segments.length !== 1 || input.segments[0] !== "disabled_mcp_servers") return { kind: "ignore" };
			const open = skipWsAndComments(input.text, input.valueOffset);
			if (input.text[open] !== "[") return { kind: "ignore" };
			const arrayText = input.text.slice(open, input.valueEnd);
			const edited = tomlArrayWithoutString(arrayText, input.serverKey);
			if (edited === undefined || edited === arrayText) return { kind: "keep" };
			if (edited === "") {
				const suffix = input.text.slice(input.valueEnd, input.statementEnd);
				const hash = suffix.indexOf("#");
				return {
					kind: "delete",
					comment: hash < 0 ? undefined : suffix.slice(hash)
				};
			}
			return {
				kind: "replace",
				text: `${input.text.slice(input.lineStart, open)}${edited}${input.text.slice(input.valueEnd, input.statementEnd)}`
			};
		};
		disabledServerListLines = (edit, lines, lineIndex, endLine) => {
			switch (edit.kind) {
				case "ignore": return undefined;
				case "keep": return lines.slice(lineIndex, endLine + 1);
				case "replace": return edit.text.split("\n");
				case "delete": return edit.comment === undefined ? [] : [edit.comment];
				default: {
					const unreachable = edit;
					return unreachable;
				}
			}
		};
		withoutTrailingLineFeeds = (text) => {
			let end = text.length;
			while (end > 0 && text.charCodeAt(end - 1) === 10) end -= 1;
			return text.slice(0, end);
		};
		tomlCommentLines = (text) => {
			const comments = [];
			let index = 0;
			while (index < text.length) {
				if (text.startsWith("\"\"\"", index) || text.startsWith("'''", index)) {
					const basic = text[index] === "\"";
					index = closeMultiline(text, index + 3, basic ? "\"\"\"" : "'''", basic) ?? text.length;
				} else if (text[index] === "\"" || text[index] === "'") {
					index = parseQuotedKey(text, index)?.next ?? text.length;
				} else if (text[index] === "#") {
					const end = text.indexOf("\n", index);
					comments.push(text.slice(index, end < 0 ? text.length : end));
					index = end < 0 ? text.length : end + 1;
				} else index += 1;
			}
			return comments;
		};
		upsertTomlServerSection = (originalText, serverKey, entry, format) => {
			const bom = originalText.startsWith("﻿");
			const source = bom ? originalText.slice(1) : originalText;
			const crlf = source.includes("\r\n") && !source.replaceAll("\r\n", "").includes("\n");
			const text = source;
			const lines = text.split("\n");
			const lineStarts = [];
			let cursor = 0;
			for (const line of lines) {
				lineStarts.push(cursor);
				cursor += line.length + 1;
			}
			const kept = [];
			const pending = [];
			let skipping = false;
			let inlineServerTable = false;
			let mode = "none";
			let tablePath = [];
			const discardPending = () => {
				pending.length = 0;
			};
			const appendLines = (lines) => {
				for (const line of lines) kept.push(line);
			};
			const flushPending = () => {
				appendLines(pending);
				pending.length = 0;
			};
			let lineIndex = 0;
			while (lineIndex < lines.length) {
				const physical = lines[lineIndex] ?? "";
				const line = physical.endsWith("\r") ? physical.slice(0, -1) : physical;
				if (mode !== "none") {
					mode = tomlStringModeAfter(line, mode);
					if (skipping) discardPending();
					else kept.push(physical);
					lineIndex += 1;
					continue;
				}
				const header = parseTomlTableHeader(line);
				if (header !== undefined) {
					tablePath = header.path;
					if (isTomlServerTable(header.path, serverKey)) {
						discardPending();
						appendLines(tomlCommentLines(physical));
						skipping = true;
						lineIndex += 1;
						continue;
					}
					skipping = false;
					flushPending();
					kept.push(physical);
					lineIndex += 1;
					continue;
				}
				const assignment = parseAssignment(line);
				if (assignment !== undefined) {
					const lineStart = lineStarts[lineIndex] ?? 0;
					const valueOffset = lineStart + assignment.equals + 1;
					const valueEnd = endOfTomlValue(text, valueOffset);
					let statementEnd = valueEnd;
					while (statementEnd < text.length && text[statementEnd] !== "\n") statementEnd += 1;
					const lastOffset = Math.max(statementEnd - 1, lineStart);
					let endLine = lineIndex;
					while (endLine + 1 < lineStarts.length && (lineStarts[endLine + 1] ?? 0) <= lastOffset) endLine += 1;
					if (skipping) {
						discardPending();
						appendLines(tomlCommentLines(text.slice(lineStart, statementEnd)));
						lineIndex = endLine + 1;
						mode = "none";
						continue;
					}
					const disabledLines = format === "grok" ? disabledServerListLines(disabledServerListEdit({
						text,
						lineStart,
						valueOffset,
						valueEnd,
						statementEnd,
						tablePath,
						segments: assignment.segments,
						serverKey,
						entry
					}), lines, lineIndex, endLine) : undefined;
					if (disabledLines !== undefined) {
						flushPending();
						appendLines(disabledLines);
						lineIndex = endLine + 1;
						mode = "none";
						continue;
					}
					const absolute = [...tablePath, ...assignment.segments];
					const open = skipWsAndComments(text, valueOffset);
					const closesServerTable = absolute.length === 1 && absolute[0] === "mcp_servers" && text[open] === "{";
					if (closesServerTable || isTomlServerTable(absolute, serverKey)) {
						if (closesServerTable) {
							flushPending();
							const edited = editInlineServerTable(text.slice(open, valueEnd), serverKey, entry);
							const prefix = text.slice(lineStart, open);
							const suffix = text.slice(valueEnd, statementEnd);
							const replacement = edited === undefined ? text.slice(lineStart, statementEnd) : `${prefix}${edited.text}${suffix}`;
							appendLines(replacement.split("\n"));
							if (edited !== undefined) appendLines(edited.comments);
							inlineServerTable = true;
						} else {
							discardPending();
							appendLines(tomlCommentLines(text.slice(lineStart, statementEnd)));
						}
					} else {
						flushPending();
						for (let index = lineIndex; index <= endLine; index += 1) kept.push(lines[index] ?? "");
					}
					lineIndex = endLine + 1;
					mode = "none";
					continue;
				}
				if (isBlankOrComment(line)) {
					if (line.trimStart().startsWith("#")) {
						flushPending();
						kept.push(physical);
					} else pending.push(physical);
					lineIndex += 1;
					continue;
				}
				mode = tomlStringModeAfter(line, "none");
				if (skipping) {
					if (looksLikeTomlHeader(line)) {
						flushPending();
						skipping = false;
						tablePath = ["\0"];
						kept.push(physical);
					} else discardPending();
				} else {
					flushPending();
					kept.push(physical);
				}
				lineIndex += 1;
			}
			if (!skipping) flushPending();
			let body = kept.join("\n");
			if (body.endsWith("\r")) body += "\n";
			if (entry !== undefined && !inlineServerTable) {
				let fragment = withoutTrailingLineFeeds(stringify({ mcp_servers: { [serverKey]: entry } }));
				if (crlf) fragment = fragment.replaceAll("\n", "\r\n");
				const nl = crlf ? "\r\n" : "\n";
				const endedWithNewline = body.endsWith("\n");
				const base = withoutTrailingLineFeeds(body);
				const trimmed = endedWithNewline && base.endsWith("\r") ? base.slice(0, -1) : base;
				body = trimmed.length === 0 ? `${fragment}${nl}` : `${trimmed}${nl}${nl}${fragment}${nl}`;
			}
			if (originalText.endsWith("\n") && !body.endsWith("\n")) body += originalText.endsWith("\r\n") ? "\r\n" : "\n";
			return bom ? `\uFEFF${body}` : body;
		};
		tomlServerEntry = (document, serverKey) => {
			const servers = clientConfigurationRecordSchema.safeParse(document.mcp_servers);
			if (!servers.success || !Object.hasOwn(servers.data, serverKey)) return undefined;
			return servers.data[serverKey];
		};
		grokServerListedDisabled = (document, serverKey) => Array.isArray(document.disabled_mcp_servers) && document.disabled_mcp_servers.includes(serverKey);
		OMP_DISABLED_SERVERS_KEY = "disabledServers";
		ompServerListedDisabled = (document, serverKey) => {
			const listed = document[OMP_DISABLED_SERVERS_KEY];
			return Array.isArray(listed) && listed.includes(serverKey);
		};
		OMP_ENABLED_SERVERS_KEY = "enabledServers";
		clientServerForcedEnabled = (parsed, serverKey) => {
			if (parsed.dialect !== "omp") return false;
			const listed = parsed.document[OMP_ENABLED_SERVERS_KEY];
			return Array.isArray(listed) && listed.includes(serverKey);
		};
		clientServerListedDisabled = (parsed, serverKey) => parsed.dialect === "grok" && grokServerListedDisabled(parsed.document, serverKey) || parsed.dialect === "omp" && ompServerListedDisabled(parsed.document, serverKey);
		serializeGrokConfiguration = (document, originalText) => {
			const entry = tomlServerEntry(document, PRODUCT_IDENTITY.mcpServerKey);
			if (originalText === undefined) return stringify(document);
			return upsertTomlServerSection(originalText, PRODUCT_IDENTITY.mcpServerKey, entry, "grok");
		};
		withoutEmptyServerTable = (document) => {
			const servers = clientConfigurationRecordSchema.safeParse(document.mcp_servers);
			if (!servers.success || Object.keys(servers.data).length > 0) return document;
			const { mcp_servers: empty, ...rest } = document;
			void empty;
			return rest;
		};
		serializeCodexConfiguration = (document, originalText) => {
			if (originalText === undefined || isEmptyClientConfigurationText(originalText)) return stringify(document);
			const edited = upsertTomlServerSection(originalText, PRODUCT_IDENTITY.mcpServerKey, tomlServerEntry(document, PRODUCT_IDENTITY.mcpServerKey), "toml");
			return tomlTextHolds(edited, document) ? edited : stringify(document);
		};
		tomlTextHolds = (text, document) => {
			try {
				return clientConfigurationValuesEqual(withoutEmptyServerTable(clientConfigurationRecordSchema.parse(parseClientToml(text))), withoutEmptyServerTable(document));
			} catch (cause) {
				void cause;
				return false;
			}
		};
		JSON_COMMA = 5;
		nextJsoncToken = (text, offset) => {
			const scanner = createScanner(text, true);
			scanner.setPosition(offset);
			const kind = scanner.scan();
			return {
				kind,
				offset: scanner.getTokenOffset()
			};
		};
		isJsonMember = (property, key) => property.children?.length === 2 && property.children[0]?.value === key;
		effectiveJsonProperty = (object, key) => object.children?.findLast((property) => isJsonMember(property, key));
		effectiveJsonObject = (root, path) => {
			let node = root;
			for (const key of path) {
				if (node?.type !== "object") return undefined;
				node = effectiveJsonProperty(node, key)?.children?.[1];
			}
			return node?.type === "object" ? node : undefined;
		};
		NO_SHADOWED_SERVERS = Object.freeze({
			servers: [],
			legacyServers: []
		});
		JSON_STRING = 10;
		JSON_EOF = 17;
		hasRepeatedJsonString = (text, name) => {
			const scanner = createScanner(text, true);
			let matches = 0;
			for (let token = scanner.scan(); token !== JSON_EOF; token = scanner.scan()) {
				if (token === JSON_STRING && scanner.getTokenValue() === name) {
					matches += 1;
					if (matches === 2) return true;
				}
			}
			return false;
		};
		shadowedJsonMembers = (object, name) => (object?.children ?? []).filter((property) => isJsonMember(property, name)).slice(0, -1).map((property) => {
			const value = property.children?.[1];
			return value === undefined ? undefined : getNodeValue(value);
		});
		shadowedClientServers = (text, parsed, name) => {
			if (parsed.dialect === "toml" || parsed.dialect === "grok" || parsed.dialect === "hermes" || parsed.dialect === "dsh" || !hasRepeatedJsonString(text, name)) return NO_SHADOWED_SERVERS;
			const root = parseTree(text, [], { allowTrailingComma: true });
			return {
				servers: shadowedJsonMembers(effectiveJsonObject(root, parsed.serversPath), name),
				legacyServers: parsed.dialect === "opencode_v2" && !OPENCODE_V2_MCP_SETTINGS.has(name) ? shadowedJsonMembers(effectiveJsonObject(root, parsed.serversPath.slice(0, 1)), name) : []
			};
		};
		applyFormattedJsonEdit = (text, edit) => {
			const edited = applyEdits(text, [edit]);
			let begin = edit.offset;
			let end = edit.offset + edit.content.length;
			if (edit.length === 0) {
				while (begin > 0 && !"\r\n".includes(edited.charAt(begin - 1))) begin -= 1;
				while (end < edited.length && !"\r\n".includes(edited.charAt(end))) end += 1;
			}
			return applyEdits(edited, format(edited, {
				offset: begin,
				length: end - begin
			}, {
				insertSpaces: true,
				tabSize: 2,
				eol: "\n",
				keepLines: false
			}));
		};
		deleteJsonMembers = (text, object, properties) => {
			const siblings = object.children ?? [];
			const removed = new Set(properties);
			const anyKept = siblings.some((member) => !removed.has(member));
			const edits = [];
			let earlierKept = false;
			for (const [index, member] of siblings.entries()) {
				if (removed.has(member)) edits.push({
					offset: member.offset,
					length: member.length,
					content: ""
				});
				else earlierKept = true;
				const separator = nextJsoncToken(text, member.offset + member.length);
				const next = siblings[index + 1];
				if (separator.kind !== JSON_COMMA && next !== undefined) throw new TypeError("JSON property separator was not found");
				const keepSeparator = next === undefined ? anyKept : earlierKept && !removed.has(next);
				if (separator.kind === JSON_COMMA && !keepSeparator) edits.push({
					offset: separator.offset,
					length: 1,
					content: ""
				});
			}
			return applyEdits(text, edits);
		};
		editJsonMember = (text, path, value, removeShadowedMembers) => {
			let object = parseTree(text, [], { allowTrailingComma: true });
			for (const [index, key] of path.entries()) {
				if (object?.type !== "object") throw new TypeError("JSON edit parent is not an object");
				const property = effectiveJsonProperty(object, key);
				const member = property?.children?.[1];
				if (property === undefined || member === undefined) {
					if (value === undefined) return ok(text);
					const content = `${JSON.stringify(key)}: ${JSON.stringify(path.slice(index + 1).reduceRight((nested, name) => ({ [name]: nested }), value))}`;
					const previous = object.children?.at(-1);
					return ok(applyFormattedJsonEdit(text, previous === undefined ? {
						offset: object.offset + 1,
						length: 0,
						content
					} : {
						offset: previous.offset + previous.length,
						length: 0,
						content: `,${content}`
					}));
				}
				if (index < path.length - 1) {
					object = member;
					continue;
				}
				if (value !== undefined) return ok(applyFormattedJsonEdit(text, {
					offset: member.offset,
					length: member.length,
					content: JSON.stringify(value)
				}));
				if (object.children?.some((sibling) => sibling !== property && isJsonMember(sibling, key))) return removeShadowedMembers ? ok(deleteJsonMembers(text, object, (object.children ?? []).filter((sibling) => isJsonMember(sibling, key)))) : err({
					kind: "shadowed_member",
					path
				});
				return ok(deleteJsonMembers(text, object, [property]));
			}
			throw new TypeError("JSON edit path is empty");
		};
		serializeClientConfiguration = (document, format, originalText, editedPaths, options = {}) => {
			if (format === undefined || format === "unsupported") throw new TypeError("client does not have a supported MCP config format");
			if (format === "toml") return ok(serializeCodexConfiguration(document, originalText));
			if (format === "grok") return ok(serializeGrokConfiguration(document, originalText));
			if (format === "hermes") return ok(serializeHermesConfiguration(document, originalText));
			if (format === "dsh") return ok(serializeDshDocument(document));
			if (originalText === undefined || isEmptyClientConfigurationText(originalText) || editedPaths === undefined) return ok(`${JSON.stringify(document, null, 2)}\n`);
			let text = originalText;
			for (const path of editedPaths) {
				const edited = editJsonMember(text, path, valueAt(document, path), options.removeShadowedMembersAt?.some((allowed) => allowed.length === path.length && allowed.every((key, index) => key === path[index])) ?? false);
				if (!edited.ok) return edited;
				text = edited.value;
			}
			return ok(text);
		};
		clientServerPath = (parsed, name) => [...parsed.serversPath, name];
		legacyClientServerPath = (parsed, name) => Object.hasOwn(parsed.legacyServers, name) ? [parsed.serversPath[0] ?? "mcp", name] : undefined;
		serializeHermesConfiguration = (document, originalText) => {
			if (originalText === undefined || isEmptyClientConfigurationText(originalText)) return stringifyHermesConfigurationYaml(document);
			const serversKey = clientConfigurationServersKey("hermes");
			const servers = document[serversKey];
			const entry = typeof servers === "object" && servers !== null ? servers[PRODUCT_IDENTITY.mcpServerKey] : undefined;
			return editHermesConfigurationYaml(originalText, [serversKey, PRODUCT_IDENTITY.mcpServerKey], entry);
		};
		clientRegistrationEntry = (format, command, environment) => {
			const [executable = "rea", ...args] = command;
			switch (format) {
				case "opencode": return {
					type: "local",
					command: [...command],
					enabled: true,
					...Object.keys(environment).length === 0 ? {} : { environment: { ...environment } }
				};
				case "kimi": return {
					command: executable,
					args,
					...Object.keys(environment).length === 0 ? {} : { env: environment }
				};
				case "opencode_v2": return {
					type: "local",
					command: [...command],
					disabled: false,
					...Object.keys(environment).length === 0 ? {} : { environment: { ...environment } }
				};
				case "vscode":
				case "omp":
				case "pi": return {
					type: "stdio",
					command: executable,
					args,
					...Object.keys(environment).length === 0 ? {} : { env: environment }
				};
				case "copilot_cli": return {
					type: "stdio",
					command: executable,
					args,
					tools: ["*"],
					...Object.keys(environment).length === 0 ? {} : { env: environment }
				};
				case "commandcode": return {
					transport: "stdio",
					enabled: true,
					command: executable,
					args,
					...Object.keys(environment).length === 0 ? {} : { env: environment }
				};
				case "dsh": return dshClientRegistrationEntry(command, environment);
				case "hermes": return {
					command: executable,
					args,
					...Object.keys(environment).length === 0 ? {} : { env: environment },
					enabled: true
				};
				default: return {
					command: executable,
					args,
					...Object.keys(environment).length === 0 ? {} : { env: environment }
				};
			}
		};
		parseGeminiMcpPolicy = (parsed) => z.object({
			allowed: z.array(z.string()).optional(),
			excluded: z.array(z.string()).optional()
		}).passthrough().parse(parsed.document.mcp ?? {});
		normalizeGeminiServerName = (name) => name.toLowerCase().trim();
		geminiServerPolicyBlock = (policies, serverKey) => {
			const key = normalizeGeminiServerName(serverKey);
			if (policies.some(({ excluded }) => excluded?.some((name) => normalizeGeminiServerName(name) === key))) return `Gemini mcp.excluded blocks ${serverKey}. Review the selected settings policies before rerunning setup.`;
			const allowlists = policies.flatMap(({ allowed }) => allowed === undefined ? [] : [allowed]);
			const allowed = allowlists.reduce((previous, current) => {
				if (previous === undefined) return current;
				const normalized = new Set(current.map(normalizeGeminiServerName));
				return previous.filter((name) => normalized.has(normalizeGeminiServerName(name)));
			}, undefined);
			if (allowed !== undefined && allowed.length > 0 && !allowed.some((name) => normalizeGeminiServerName(name) === key)) return `Gemini mcp.allowed does not include ${serverKey}. Review the selected settings policies before rerunning setup.`;
			return undefined;
		};
	})))();
}

//#endregion
//#region dist/application/ClientRegistration.js
var tomlTimeoutSchema, launcherSchema, opencodeLauncherSchema, normalizeOpencodeLauncher, registrationSchema, codexApprovalModeSchema, codexToolPolicySchema, codexPolicySchema, registrationError, parseClientRegistrationLauncher, validateClientPolicy, parseClientRegistration, managedConnectionKeys, setupPreservesDisabledActivation, refreshClientRegistration, positiveTimeout;
function init_ClientRegistration() {
	return (init_ClientRegistration = __esmMin((() => {
		init_configurationErrors();
		init_result();
		init_mcpStartupPolicy();
		init_ClientConfigurationDocument();
		init_ClientRegistrationIdentity();
		tomlTimeoutSchema = z.union([z.number().positive(), z.bigint().positive()]);
		launcherSchema = z.object({
			command: z.string().min(1),
			args: z.array(z.string()).default([])
		}).passthrough();
		opencodeLauncherSchema = z.object({
			type: z.literal("local"),
			command: z.array(z.string()).min(1)
		}).passthrough();
		normalizeOpencodeLauncher = (entry) => {
			const [command = "", ...args] = entry.command;
			return {
				...entry,
				command,
				args
			};
		};
		registrationSchema = launcherSchema.extend({
			startup_timeout_sec: tomlTimeoutSchema.optional(),
			tool_timeout_sec: tomlTimeoutSchema.optional(),
			startupTimeoutMs: z.number().positive().optional(),
			toolTimeoutMs: z.number().positive().optional(),
			type: z.string().optional(),
			transport: z.string().optional(),
			serverName: z.string().optional(),
			disabled: z.boolean().optional(),
			enabled: z.boolean().optional()
		});
		codexApprovalModeSchema = z.enum([
			"auto",
			"prompt",
			"writes",
			"approve"
		]);
		codexToolPolicySchema = z.object({
			approval_mode: codexApprovalModeSchema.optional(),
			output_token_limit: z.union([z.number().int().positive(), z.bigint().positive()]).optional()
		}).passthrough();
		codexPolicySchema = z.object({
			default_tools_approval_mode: codexApprovalModeSchema.optional(),
			enabled_tools: z.array(z.string()).optional(),
			disabled_tools: z.array(z.string()).optional(),
			tools: clientConfigurationRecordSchema.superRefine((tools, context) => {
				for (const [name, value] of Object.entries(tools)) {
					const policy = codexToolPolicySchema.safeParse(value);
					if (!policy.success) for (const issue of policy.error.issues) context.addIssue({
						...issue,
						path: [name, ...issue.path]
					});
				}
			}).optional()
		}).passthrough();
		registrationError = (error) => new ConfigurationError("Invalid client registration settings", { settings: error.issues.map((issue) => ({
			setting: issue.path.join("."),
			constraint: issue.message
		})) });
		parseClientRegistrationLauncher = (value, client) => {
			const parsed = client.format === "opencode" ? opencodeLauncherSchema.transform(normalizeOpencodeLauncher).safeParse(value) : launcherSchema.safeParse(value);
			return parsed.success ? ok({
				command: parsed.data.command,
				args: parsed.data.args
			}) : err(registrationError(parsed.error));
		};
		validateClientPolicy = (value, client) => {
			const policy = client.name === "codex" ? codexPolicySchema.safeParse(value) : client.format === "copilot_cli" ? z.object({ tools: z.array(z.string()).optional() }).safeParse(value) : undefined;
			return policy === undefined || policy.success ? ok(undefined) : err(registrationError(policy.error));
		};
		parseClientRegistration = (value, client) => {
			const policy = validateClientPolicy(value, client);
			if (!policy.ok) return policy;
			if (client.format === "dsh") {
				const parsed = registrationSchema.pick({
					command: true,
					args: true,
					serverName: true,
					transport: true
				}).strip().safeParse(value);
				return parsed.success ? ok(parsed.data) : err(registrationError(parsed.error));
			}
			if (client.format === "opencode") {
				const entry = opencodeLauncherSchema.extend({ environment: z.record(z.string(), z.string()).optional() }).transform(normalizeOpencodeLauncher).safeParse(value);
				if (!entry.success) return err(registrationError(entry.error));
				value = entry.data;
			}
			const parsed = registrationSchema.safeParse(value);
			if (!parsed.success) return err(registrationError(parsed.error));
			const registration = parsed.data;
			const transportInvalid = (client.format === "kimi" || client.format === "commandcode") && registration.transport !== undefined && registration.transport !== "stdio" || client.format === "commandcode" && registration.transport === undefined;
			const typeInvalid = (client.format === "vscode" || client.format === "copilot_cli") && registration.type !== "stdio" || (client.format === "kimi" || client.format === "omp" || client.format === "pi") && registration.type !== undefined && registration.type !== "stdio";
			if (transportInvalid || typeInvalid) return err(new ConfigurationError("Expected an stdio registration", { settings: [{
				setting: transportInvalid ? "transport" : "type",
				constraint: "Expected stdio"
			}] }));
			return ok(registration);
		};
		managedConnectionKeys = new Set([
			"command",
			"args",
			"env",
			"environment",
			"type",
			"transport",
			"enabled",
			"disabled",
			"enable",
			"serverName",
			"url",
			"httpUrl"
		]);
		setupPreservesDisabledActivation = (client, format) => client.sharedRegistration === true || format === "zcode_fallback";
		refreshClientRegistration = (client, dialect, command, environment, previous, timeoutInputs) => {
			const source = clientConfigurationRecordSchema.safeParse(previous);
			const existing = source.success ? source.data : {};
			const policy = validateClientPolicy(existing, client);
			if (!policy.ok) return policy;
			const prior = parseClientRegistrationLauncher(existing, client);
			const priorCommand = prior.ok ? [prior.value.command, ...prior.value.args] : undefined;
			const launcher = priorCommand !== undefined && equivalentClientRegistrationCommands(priorCommand, command) ? priorCommand : command;
			const registration = {
				...clientRegistrationEntry(dialect, launcher, environment),
				...Object.fromEntries(Object.entries(existing).filter(([key]) => !managedConnectionKeys.has(key)))
			};
			if (setupPreservesDisabledActivation(client, dialect) && existing.enable === false) registration.enable = false;
			if (client.name === "codex" || client.name === "grok_build") registration.startup_timeout_sec = (client.name === "codex" ? positiveTimeout(existing.startup_timeout_sec) : undefined) ?? MCP_STARTUP_POLICY.codexStartupTimeoutSeconds;
			if (client.name === "codex") registration.tool_timeout_sec = positiveTimeout(existing.tool_timeout_sec) ?? recommendedMcpToolTimeoutSeconds(timeoutInputs);
			if (client.name === "kimi") {
				registration.startupTimeoutMs = positiveTimeout(existing.startupTimeoutMs) ?? MCP_STARTUP_POLICY.kimiStartupTimeoutMs;
				registration.toolTimeoutMs = positiveTimeout(existing.toolTimeoutMs) ?? recommendedMcpToolTimeoutMs(timeoutInputs);
			}
			return ok(registration);
		};
		positiveTimeout = (value) => {
			if (typeof value === "bigint") return value > 0n ? value : undefined;
			return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
		};
	})))();
}

//#endregion
export { ClientConfigurationShapeError, DshCordisDocument, MANAGED_SKILL_FILES, OMP_DISABLED_SERVERS_KEY, SetupSkillInstallError, canonicalSkillNeedsInstall, clientConfigurationRecordSchema, clientConfigurationServersKey, clientConfigurationValuesEqual, clientRegistrationEntry, clientServerForcedEnabled, clientServerListedDisabled, clientServerPath, dshDocument, effectiveClientServer, existingSkillDestinations, fileHandleMatchesBytes, geminiServerPolicyBlock, init_ClientConfigurationDocument, init_ClientRegistration, init_DshCordisPatch, init_SetupRecoveryBackup, init_SetupSkill, init_fileHandleMatchesBytes, installCanonicalSkill, isManagedSkillManifest, legacyClientServerPath, parseClientConfiguration, parseClientRegistration, parseClientRegistrationLauncher, parseGeminiMcpPolicy, parseZcodeFallbackConfiguration, preserveCurrentRecoveryBackup, readInstalledSkillIdentity, readSkillFile, refreshClientRegistration, selectCurrentRecoveryBackup, serializeClientConfiguration, setupPreservesDisabledActivation, shadowedClientServers, skillDestinationSelection, skillDestinations, validateCanonicalSkillDirectories, withClientServers };