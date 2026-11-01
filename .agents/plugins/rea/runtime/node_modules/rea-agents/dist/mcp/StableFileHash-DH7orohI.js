import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { a as RegularFileCancelled, g as init_RegularFile, h as assertRegularFileActive, m as RegularFileOperationCancelled, o as RegularFileCleanupFailure, p as RegularFileChangedError, s as init_OwnedRegularFile, u as withOwnedRegularFile, y as sameRegularFileState } from "./ArtifactResourceScope-B-bNzT_G.js";
import { stat } from "node:fs/promises";
import { createHash } from "node:crypto";

//#region dist/filesystem/StableFileHash.js
async function readStableFile(path, options, includePrefix) {
	try {
		return await withOwnedRegularFile(path, options, async ({ handle, initial }) => {
			if (!Number.isSafeInteger(initial.size) || initial.size < 0) throw new RangeError(`Regular file size cannot be represented safely: ${path}`);
			const hash = createHash("sha256");
			const chunk = Buffer.allocUnsafe(64 * 1024);
			const prefix = Buffer.alloc(includePrefix ? Math.min(STABLE_FILE_PREFIX_BYTES, initial.size) : 0);
			let position = 0;
			while (position <= initial.size) {
				assertRegularFileActive(options.signal);
				const length = Math.min(chunk.length, initial.size - position + 1);
				if (length <= 0) break;
				const read = await handle.read(chunk, 0, length, position);
				if (position + read.bytesRead > initial.size || read.bytesRead === 0 && position < initial.size) throw new RegularFileChangedError(path);
				assertRegularFileActive(options.signal);
				if (read.bytesRead === 0) break;
				if (position < prefix.length) {
					const prefixBytes = Math.min(read.bytesRead, prefix.length - position);
					chunk.copy(prefix, position, 0, prefixBytes);
				}
				hash.update(chunk.subarray(0, read.bytesRead));
				position += read.bytesRead;
			}
			assertRegularFileActive(options.signal);
			const [opened, currentPath] = await Promise.all([handle.stat(), stat(path)]);
			if (position !== initial.size || !sameRegularFileState(initial, opened) || !sameRegularFileState(initial, currentPath)) throw new RegularFileChangedError(path);
			assertRegularFileActive(options.signal);
			const fingerprint = {
				sha256: hash.digest("hex"),
				bytes: position
			};
			return includePrefix ? {
				...fingerprint,
				prefix
			} : fingerprint;
		});
	} catch (cause) {
		if (cause instanceof RegularFileCleanupFailure || cause instanceof RegularFileCancelled || cause instanceof RegularFileOperationCancelled) throw cause;
		throw new StableFileHashFailure(path, cause);
	}
}
var STABLE_FILE_PREFIX_BYTES, StableFileHashFailure, stableFileHashCause, hashStableFile, observeStableFile;
function init_StableFileHash() {
	return (init_StableFileHash = __esmMin((() => {
		init_OwnedRegularFile();
		init_RegularFile();
		STABLE_FILE_PREFIX_BYTES = 2;
		StableFileHashFailure = class extends Error {
			path;
			cause;
			_tag = "StableFileHashFailure";
			constructor(path, cause) {
				super(`Could not hash ${path}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
				this.path = path;
				this.cause = cause;
				this.name = this._tag;
			}
		};
		stableFileHashCause = (cause) => cause instanceof StableFileHashFailure ? cause.cause : cause;
		hashStableFile = async (path, options) => {
			return await readStableFile(path, options, false);
		};
		observeStableFile = (path, options) => readStableFile(path, options, true);
	})))();
}

//#endregion
export { stableFileHashCause as a, observeStableFile as i, hashStableFile as n, init_StableFileHash as r, StableFileHashFailure as t };