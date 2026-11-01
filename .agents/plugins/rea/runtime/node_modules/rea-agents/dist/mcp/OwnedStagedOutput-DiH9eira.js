import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { x as init_OwnedFileHandle } from "./ArtifactResourceScope-B-bNzT_G.js";
import { lstat, readdir, rmdir, unlink } from "node:fs/promises";

//#region dist/filesystem/OwnedStagedOutput.js
var identityOf, sameIdentity, OwnedStagedOutput, errorCode;
function init_OwnedStagedOutput() {
	return (init_OwnedStagedOutput = __esmMin((() => {
		init_OwnedFileHandle();
		identityOf = (stats) => ({
			dev: stats.dev,
			ino: stats.ino
		});
		sameIdentity = (stats, identity) => stats.dev === identity.dev && stats.ino === identity.ino;
		OwnedStagedOutput = class OwnedStagedOutput {
			directory;
			directoryIdentity;
			#file;
			#fileIdentity;
			#fileClosed = false;
			#fileRemovedByOwner = false;
			#publishedRename = false;
			#closeAttempt;
			#closed = false;
			#identityFailure;
			constructor(directory, directoryIdentity) {
				this.directory = directory;
				this.directoryIdentity = directoryIdentity;
			}
			static async create(directory) {
				try {
					const stats = await lstat(directory);
					if (!stats.isDirectory() || stats.isSymbolicLink()) return new OwnedStagedOutput(directory, undefined);
					return new OwnedStagedOutput(directory, identityOf(stats));
				} catch (cause) {
					const owner = new OwnedStagedOutput(directory, undefined);
					owner.#identityFailure = cause;
					return owner;
				}
			}
			setFile(file) {
				if (this.#file !== undefined) throw new Error("Staged output already owns a file handle");
				this.#file = file;
			}
			/** Verify the staged name against its descriptor after the last write. */
			async assertReadyForPublication(content) {
				await this.#verifiedDirectory();
				if (this.#file !== undefined && !this.#fileClosed) await this.#observeFileIdentity();
				if (this.#fileIdentity === undefined) throw new Error("Cannot verify staged file identity", { cause: this.#identityFailure });
				const stagedFile = await lstat(content);
				if (!stagedFile.isFile() || stagedFile.isSymbolicLink() || !sameIdentity(stagedFile, this.#fileIdentity)) throw new Error(`Staged file identity changed: ${content}`);
			}
			/** Observe the descriptor's identity after its last write, then close it. */
			async closeFile() {
				const file = this.#file;
				if (file === undefined || this.#fileClosed) return;
				await this.#observeFileIdentity();
				await file.close();
				this.#fileClosed = true;
			}
			async #observeFileIdentity() {
				const file = this.#file;
				if (file === undefined) return;
				try {
					this.#fileIdentity = identityOf(await file.handle.stat());
				} catch (cause) {
					this.#fileIdentity = undefined;
					this.#identityFailure = cause;
				}
			}
			/** Record that the staged file moved to the published destination by rename. */
			recordPublishedRename() {
				this.#publishedRename = true;
			}
			/** Close the owned descriptor and remove only the exact staged entries. */
			close() {
				if (this.#closed) return Promise.resolve();
				if (this.#closeAttempt !== undefined) return this.#closeAttempt;
				const attempt = Promise.resolve().then(() => this.#cleanup());
				this.#closeAttempt = attempt;
				void attempt.then(() => {
					this.#closed = true;
					this.#closeAttempt = undefined;
				}, () => {
					this.#closeAttempt = undefined;
				});
				return attempt;
			}
			async #cleanup() {
				await this.closeFile();
				await this.#verifiedDirectory();
				if (this.#file !== undefined) {
					const content = `${this.directory}/content`;
					let stagedFile;
					try {
						stagedFile = await lstat(content);
					} catch (cause) {
						if (errorCode(cause) === "ENOENT" && (this.#fileRemovedByOwner || this.#publishedRename)) {
							stagedFile = undefined;
						} else if (errorCode(cause) === "ENOENT") {
							throw new Error(`Owned staged file disappeared: ${content}`, { cause });
						} else {
							throw cause;
						}
					}
					if (stagedFile !== undefined) {
						if (!stagedFile.isFile() || stagedFile.isSymbolicLink() || this.#fileIdentity === undefined || !sameIdentity(stagedFile, this.#fileIdentity)) throw new Error(`Staged file identity changed: ${content}`);
						await unlink(content);
						this.#fileRemovedByOwner = true;
					}
				}
				const remaining = await readdir(this.directory);
				if (remaining.length > 0) throw new Error(`Unexpected staging entries remain in ${this.directory}: ${remaining.join(", ")}`);
				await this.#verifiedDirectory();
				await rmdir(this.directory);
			}
			async #verifiedDirectory() {
				if (this.directoryIdentity === undefined) throw new Error(`Cannot verify staging directory ownership: ${this.directory}`, { cause: this.#identityFailure });
				const directory = await lstat(this.directory);
				if (!directory.isDirectory() || directory.isSymbolicLink() || !sameIdentity(directory, this.directoryIdentity)) throw new Error(`Staging directory identity changed: ${this.directory}`);
			}
		};
		errorCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
	})))();
}

//#endregion
export { init_OwnedStagedOutput as n, OwnedStagedOutput as t };