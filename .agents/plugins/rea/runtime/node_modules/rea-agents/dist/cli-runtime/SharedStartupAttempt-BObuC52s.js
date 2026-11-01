import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { HopperStartError, init_hopperErrors } from "./analysisErrorProjection-DCiob2UF.js";
import { ArtifactReaderFailure, RegularFileCancelled, RegularFileCleanupFailure, artifactPrimaryCleanupLeases, init_ArtifactReader, init_OwnedRegularFile, regularFileCancellation } from "./ArtifactReader-PV1DaSaC.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DNoM_zCF.js";
import { init_RegularFileRead, withRegularFile } from "./RegularFileRead-4snB6-IE.js";
import { ArtifactResourceScope, init_ArtifactResourceScope } from "./ArtifactResourceScope-BLhM2W5p.js";
import { execFileOutput, init_ExecFileOutput } from "./ExecFileOutput-OgYrEogw.js";
import { ABORTED, init_AbortablePromise, waitForAbortable } from "./AbortablePromise-CJXBPQGB.js";
import { init_ProviderDeadline, waitForAbortableDelay } from "./ProviderDeadline-8m2pFRDc.js";
import { PrivateRuntimeRoot, init_PrivateRuntimeRoot } from "./PrivateRuntimeRoot-CCl5QOdR.js";
import { HOPPER_DOWNLOAD_BYTES, HOPPER_DOWNLOAD_PREFIX, HOPPER_LINUX_PRIMARY_FINGERPRINT, HOPPER_PUBLIC_KEY_URL, HOPPER_RELEASES_URL, HopperReleaseError, downloadHopperPackage, init_HopperDownload, init_HopperReleaseFeed, init_LinuxHopperCacheDirectory, linuxHopperReleaseCacheDirectory, parseLinuxHopperRelease, parseLinuxHopperReleases } from "./LinuxHopperCacheDirectory-DrnvgmLm.js";
import { StableFileHashFailure, hashStableFile, init_StableFileHash } from "./StableFileHash-DxZbYqOI.js";
import { acquireOwnedLease, init_OwnedLease } from "./OwnedLease-Dd2rekJa.js";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { join, posix } from "node:path";
import { access, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

//#region dist/process/ExecFileBoundedOutput.js
var execFileBoundedOutput, retainedOutput;
function init_ExecFileBoundedOutput() {
	return (init_ExecFileBoundedOutput = __esmMin((() => {
		execFileBoundedOutput = (executable, args, options) => new Promise((resolve) => {
			const child = spawn(executable, [...args], {
				env: options.env,
				stdio: [
					"ignore",
					"pipe",
					"pipe"
				]
			});
			const headLimit = Math.ceil(options.limit / 2);
			const tailLimit = options.limit - headLimit;
			const stdout = {
				head: Buffer.alloc(0),
				tail: Buffer.alloc(0),
				total: 0
			};
			const stderr = {
				head: Buffer.alloc(0),
				tail: Buffer.alloc(0),
				total: 0
			};
			let outputTruncated = false;
			const capture = (stream) => (chunk) => {
				stream.total += chunk.length;
				const headCount = Math.min(chunk.length, Math.max(0, headLimit - stream.head.length));
				if (headCount > 0) stream.head = Buffer.concat([stream.head, chunk.subarray(0, headCount)]);
				const rest = chunk.subarray(headCount);
				if (rest.length > 0 && tailLimit > 0) stream.tail = Buffer.concat([stream.tail, rest]).subarray(-tailLimit);
				if (stream.total > options.limit) outputTruncated = true;
			};
			child.stdout.on("data", capture(stdout));
			child.stderr.on("data", capture(stderr));
			let spawnError;
			child.on("error", (error) => {
				spawnError = error;
			});
			child.on("close", (code, signal) => {
				resolve({
					exitCode: spawnError?.code ?? code ?? signal,
					stdout: retainedOutput(stdout, options.limit),
					stderr: retainedOutput(stderr, options.limit),
					outputTruncated
				});
			});
		});
		retainedOutput = (stream, limit) => stream.total > limit ? `${stream.head.toString("utf8")} … [output omitted] … ${stream.tail.toString("utf8")}` : Buffer.concat([stream.head, stream.tail]).toString("utf8");
	})))();
}

//#endregion
//#region dist/application/LinuxHopperPython.js
var libraryPath, runtimeSchema, LinuxHopperPythonError, query, runtimeCommand, isAborted$1, inspectLinuxHopperPythonRuntime, linuxHopperPythonUnavailable;
function init_LinuxHopperPython() {
	return (init_LinuxHopperPython = __esmMin((() => {
		init_result();
		init_ExecFileOutput();
		libraryPath = z.string().refine((value) => posix.isAbsolute(value) && !value.includes("\0"));
		runtimeSchema = z.object({
			version: z.tuple([z.literal(3), z.number().int().nonnegative()]),
			library: z.discriminatedUnion("status", [
				z.object({
					status: z.literal("loadable"),
					path: libraryPath
				}),
				z.object({
					status: z.literal("unavailable"),
					path: libraryPath,
					reason: z.string().min(1)
				}),
				z.object({
					status: z.literal("unknown"),
					reason: z.string().min(1)
				})
			])
		});
		LinuxHopperPythonError = class extends Error {
			reason;
			_tag = "LinuxHopperPythonError";
			constructor(reason, message, cause) {
				super(message, { cause });
				this.reason = reason;
			}
		};
		query = `import ctypes, json, os, sys, sysconfig
directory = sysconfig.get_config_var("LIBDIR")
name = sysconfig.get_config_var("INSTSONAME")
if not isinstance(directory, str) or not os.path.isabs(directory) or not isinstance(name, str) or not name:
    library = {"status": "unknown", "reason": "Python did not report an absolute shared-library location"}
else:
    path = os.path.join(directory, name)
    try:
        ctypes.CDLL(path)
        library = {"status": "loadable", "path": path}
    except OSError as error:
        library = {"status": "unavailable", "path": path, "reason": str(error)}
print(json.dumps({"version": list(sys.version_info[:2]), "library": library}))
`;
		runtimeCommand = {
			executable: "/usr/bin/python3",
			args: [
				"-I",
				"-S",
				"-B",
				"-c",
				query
			]
		};
		isAborted$1 = (signal) => signal?.aborted === true;
		inspectLinuxHopperPythonRuntime = async (environment, signal, execute = execFileOutput) => {
			const cancelled = () => err(new LinuxHopperPythonError("cancelled", "Python runtime inspection was cancelled.", signal?.reason));
			if (isAborted$1(signal)) return cancelled();
			let output;
			try {
				const result = await execute(runtimeCommand.executable, runtimeCommand.args, {
					env: environment,
					signal,
					stopSignal: "SIGTERM",
					timeout: 1e4,
					maxBuffer: 64 * 1024
				});
				output = result.stdout;
			} catch (cause) {
				if (isAborted$1(signal)) return cancelled();
				return err(new LinuxHopperPythonError("query_failed", "Could not inspect the shared runtime of /usr/bin/python3.", cause));
			}
			if (isAborted$1(signal)) return cancelled();
			let value;
			try {
				value = JSON.parse(output);
			} catch (cause) {
				return err(new LinuxHopperPythonError("invalid_response", "System Python returned an invalid shared-runtime description.", cause));
			}
			const parsed = runtimeSchema.safeParse(value);
			if (!parsed.success) return err(new LinuxHopperPythonError("invalid_response", "System Python returned an invalid shared-runtime description.", parsed.error));
			return ok({
				...parsed.data,
				interpreter: runtimeCommand.executable
			});
		};
		linuxHopperPythonUnavailable = (library) => new LinuxHopperPythonError(library.status === "unknown" ? "configuration_unknown" : "runtime_unavailable", library.status === "unavailable" ? "The system Python shared runtime cannot load " + library.path + ": " + library.reason : "System Python did not identify its shared runtime: " + library.reason);
	})))();
}

//#endregion
//#region dist/process/DetachedPgpSignature.js
var DetachedPgpSignatureError, verifyDetachedPgpSignature;
function init_DetachedPgpSignature() {
	return (init_DetachedPgpSignature = __esmMin((() => {
		init_result();
		DetachedPgpSignatureError = class extends Error {
			reason;
			_tag = "DetachedPgpSignatureError";
			constructor(reason, message, options) {
				super(message, options);
				this.reason = reason;
				this.name = this._tag;
			}
		};
		verifyDetachedPgpSignature = async (bytes, detachedSignature, armoredPublicKey, primaryFingerprint, signal) => {
			const cancelled = () => err(new DetachedPgpSignatureError("cancelled", "Package verification was cancelled.", { cause: signal?.reason }));
			const isAborted = () => signal?.aborted === true;
			if (isAborted()) return cancelled();
			try {
				const pgp = await import("openpgp");
				const key = await pgp.readKey({ armoredKey: armoredPublicKey });
				if (isAborted()) return cancelled();
				const fingerprint = key.getFingerprint().toUpperCase();
				if (fingerprint !== primaryFingerprint) return err(new DetachedPgpSignatureError("wrong_publisher", "The package signing key does not belong to the pinned publisher."));
				const signature = await pgp.readSignature({ binarySignature: detachedSignature });
				if (isAborted()) return cancelled();
				if (signature.packets.length !== 1 || signature.packets[0]?.signatureType !== pgp.enums.signature.binary) return err(new DetachedPgpSignatureError("invalid_signature", "Expected one detached binary package signature."));
				const verified = await pgp.verify({
					message: await pgp.createMessage({ binary: bytes }),
					signature,
					verificationKeys: key,
					format: "binary"
				});
				const signed = verified.signatures[0];
				if (signed === undefined || verified.signatures.length !== 1) return err(new DetachedPgpSignatureError("invalid_signature", "The package has no unique verified signature."));
				await signed.verified;
				const signingKey = await key.getSigningKey(signed.keyID, signature.packets[0].created);
				if (isAborted()) return cancelled();
				return ok({
					primaryFingerprint: fingerprint,
					signingFingerprint: signingKey.getFingerprint().toUpperCase()
				});
			} catch (cause) {
				if (isAborted()) return cancelled();
				return err(new DetachedPgpSignatureError("invalid_signature", "The package signature could not be verified.", { cause }));
			}
		};
	})))();
}

//#endregion
//#region dist/process/HopperLease.js
var HOPPER_TARGET_LEASE_DIRECTORY, acquireHopperTargetLease, acquireLinuxHopperApplicationLease, acquireHopperReleaseCacheLease, acquireLease, hopperLeaseFailure, hopperLeaseMessage;
function init_HopperLease() {
	return (init_HopperLease = __esmMin((() => {
		init_hopperErrors();
		init_OwnedLease();
		HOPPER_TARGET_LEASE_DIRECTORY = join("/tmp", `rea-hopper-${process.getuid?.() ?? 0}`);
		acquireHopperTargetLease = async (input) => {
			let targetPath;
			try {
				targetPath = await realpath(input.targetPath);
			} catch (cause) {
				throw new HopperStartError({
					cause,
					userMessage: `REA could not resolve Hopper target ${JSON.stringify(input.targetPath)} to a canonical path before reserving the document. Confirm that the target exists and its path is accessible.`
				});
			}
			return acquireLease({
				...input,
				identity: {
					targetPath,
					targetKind: input.targetKind,
					loaderArgs: input.loaderArgs
				}
			});
		};
		acquireLinuxHopperApplicationLease = (input) => acquireLease({
			...input,
			identity: { application: "linux-hopper-demo" }
		});
		acquireHopperReleaseCacheLease = async (input) => acquireLease({
			runId: input.runId,
			identity: {
				cacheDirectory: await realpath(input.cacheDirectory),
				launcherSha256: input.launcherSha256,
				operation: "signed-package-retention"
			}
		});
		acquireLease = async (input) => acquireOwnedLease({
			identity: input.identity,
			runId: input.runId,
			directory: input.directory ?? HOPPER_TARGET_LEASE_DIRECTORY,
			failure: hopperLeaseFailure
		});
		hopperLeaseFailure = (failure, cause) => new HopperStartError({
			...cause === undefined ? {} : { cause },
			userMessage: hopperLeaseMessage(failure)
		});
		hopperLeaseMessage = (failure) => {
			switch (failure.kind) {
				case "directory_create": return "REA could not create its private Hopper lease directory.";
				case "directory_not_private": return "REA's Hopper lease directory is not a private directory owned by this user.";
				case "directory_permissions": return "REA's Hopper lease directory permissions could not be secured.";
				case "directory_access_denied": return `REA could not access its Hopper lease directory at ${JSON.stringify(failure.directory)}. Check its ownership and parent-directory access. For a directory you own, restore owner-only read, write, and search permissions (0700), then retry.`;
				case "directory_inspect": return "REA could not inspect its private Hopper lease directory.";
				case "recovery_busy": return `REA could not reserve Hopper lease recovery at ${JSON.stringify(failure.path)}; the existing socket was left unchanged. Retry after concurrent startup finishes. If recovery was interrupted, stop REA sessions and remove this recovery directory before retrying.`;
				case "recovery_create": return `REA could not create its Hopper recovery directory at ${JSON.stringify(failure.path)}; the existing socket was left unchanged. Check the parent directory's write access before retrying.`;
				case "recovery_remove": return `REA could not remove its Hopper recovery directory at ${JSON.stringify(failure.path)}. Check this directory's write access before retrying.`;
				case "owner_unverified": return `REA could not verify the existing Hopper lease (${failure.reason}); it was left unchanged. Retry when the owning REA session is responsive.`;
				case "unrecoverable": return "REA could not reserve Hopper for this request. Close competing REA sessions and retry.";
			}
		};
	})))();
}

//#endregion
//#region dist/application/LinuxHopperPublisher.js
var RELEASE_METADATA_BYTES, RELEASE_METADATA_TIMEOUT_MS, cacheRecordSchema, pendingCleanup, packageProofs, liveLauncherProofs, retainProof, LinuxHopperPublisher, retryLinuxHopperPublisherCleanup, decodeUtf8, releaseFailure, launcherIdentity;
function init_LinuxHopperPublisher() {
	return (init_LinuxHopperPublisher = __esmMin((() => {
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_LinuxHopperCacheDirectory();
		init_result();
		init_StableFileHash();
		init_OwnedRegularFile();
		init_BoundedFileBytes();
		init_DetachedPgpSignature();
		init_ExecFileOutput();
		init_PrivateRuntimeRoot();
		init_ProviderDeadline();
		init_HopperLease();
		init_HopperDownload();
		init_HopperReleaseFeed();
		init_RegularFileRead();
		RELEASE_METADATA_BYTES = 1024 * 1024;
		RELEASE_METADATA_TIMEOUT_MS = 1e4;
		cacheRecordSchema = z.object({
			format: z.literal("rea-signed-hopper-release-v1"),
			family: z.enum([
				"deb",
				"rpm",
				"arch"
			]),
			release: z.unknown()
		});
		pendingCleanup = new Set();
		packageProofs = new Map();
		liveLauncherProofs = new Map();
		retainProof = (cache, key, proof) => {
			cache.delete(key);
			cache.set(key, proof);
			const oldest = cache.keys().next().value;
			if (cache.size > 8 && oldest !== undefined) cache.delete(oldest);
		};
		LinuxHopperPublisher = class {
			environment;
			packageFamily;
			#resources = new ArtifactResourceScope();
			#feed;
			constructor(environment, packageFamily) {
				this.environment = environment;
				this.packageFamily = packageFamily;
			}
			get cacheRoot() {
				const location = linuxHopperReleaseCacheDirectory(this.environment);
				if (!location.ok) throw location.error;
				return location.value;
			}
			async currentRelease(family, signal) {
				try {
					signal?.throwIfAborted();
					if (this.#feed === undefined) {
						const response = await downloadHopperPackage(HOPPER_RELEASES_URL, {
							...signal === undefined ? {} : { signal },
							maxBytes: RELEASE_METADATA_BYTES,
							timeoutMs: RELEASE_METADATA_TIMEOUT_MS
						});
						if (!response.ok) throw new HopperReleaseError("release_metadata", "The official Hopper release feed is unavailable.");
						this.#feed = parseLinuxHopperReleases(JSON.parse(decodeUtf8(response.bytes)));
					}
					if (!this.#feed.ok) return this.#feed;
					return this.#feed.value[family];
				} catch (cause) {
					return err(releaseFailure(cause, signal, "release_metadata"));
				}
			}
			async verifyArchive(family, release, archive, signal, suppliedPublicKey) {
				return this.#runOperation(signal, (resources) => this.#verifyArchive(family, release, archive, signal, suppliedPublicKey, resources));
			}
			async #verifyArchive(family, release, archive, signal, suppliedPublicKey, resources) {
				try {
					const bytes = await this.#read(archive, HOPPER_DOWNLOAD_BYTES, signal, resources);
					if (bytes.length !== Number(release.file_length) || createHash("sha1").update(bytes).digest("hex") !== release.file_hash) return err(new HopperReleaseError("integrity", "The Hopper package does not match the selected release bytes."));
					let publicKey = suppliedPublicKey;
					if (publicKey === undefined) {
						const response = await downloadHopperPackage(HOPPER_PUBLIC_KEY_URL, {
							...signal === undefined ? {} : { signal },
							maxBytes: RELEASE_METADATA_BYTES,
							timeoutMs: RELEASE_METADATA_TIMEOUT_MS
						});
						if (!response.ok) throw new HopperReleaseError("verification_unavailable", "The official Hopper public key is unavailable.");
						publicKey = decodeUtf8(response.bytes);
					}
					const packageSha256 = createHash("sha256").update(bytes).digest("hex");
					const proofKey = createHash("sha256").update(JSON.stringify([
						family,
						packageSha256,
						publicKey,
						release.signature,
						release.main_exe_hash
					])).digest("hex");
					signal?.throwIfAborted();
					const existingProof = packageProofs.get(proofKey);
					if (existingProof !== undefined) return ok({
						release,
						family,
						packageSha256,
						publicKey,
						...existingProof
					});
					const verified = await verifyDetachedPgpSignature(bytes, Buffer.from(release.signature, "base64"), publicKey, HOPPER_LINUX_PRIMARY_FINGERPRINT, signal);
					if (!verified.ok) return err(new HopperReleaseError(verified.error.reason === "cancelled" ? "cancelled" : "publisher_verification_failed", verified.error.message, { cause: verified.error }));
					const mainExeHash = await this.#withTemporary(async (root, temporaryResources) => {
						const snapshot = join(root, "package");
						await writeFile(snapshot, bytes, {
							flag: "wx",
							mode: 384
						});
						return this.#packageLauncherHash(family, snapshot, root, signal, temporaryResources);
					});
					if (mainExeHash !== release.main_exe_hash) return err(new HopperReleaseError("integrity", `The signed ${family} package launcher SHA-256 ${mainExeHash} differs from the release main_exe_hash ${release.main_exe_hash}.`));
					retainProof(packageProofs, proofKey, verified.value);
					return ok({
						release,
						family,
						packageSha256,
						publicKey,
						...verified.value
					});
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			/** Durable evidence contains the signed bytes; an editable digest receipt cannot authorize a build. */
			async retainVerifiedArchive(verified, archive, signal) {
				return this.#runOperation(signal, (resources) => this.#retainVerifiedArchive(verified, archive, signal, resources));
			}
			async #retainVerifiedArchive(verified, archive, signal, resources) {
				try {
					signal?.throwIfAborted();
					await mkdir(this.cacheRoot, {
						recursive: true,
						mode: 448
					});
					const parent = await lstat(this.cacheRoot);
					if (!parent.isDirectory() || parent.isSymbolicLink() || parent.uid !== process.getuid?.()) throw new HopperReleaseError("verification_unavailable", "The Hopper release cache is not a caller-owned directory.");
					const target = join(this.cacheRoot, verified.release.main_exe_hash);
					const lease = await this.#acquireCacheLease(verified.release.main_exe_hash, signal);
					await this.#withOwnedResource({
						kind: "lease",
						resource: lease.socketPath ?? "hopper-release-cache-lease",
						lease
					}, async () => {
						signal?.throwIfAborted();
						await this.#withTemporary(async (stage, temporaryResources) => {
							await copyFile(archive, join(stage, "archive"));
							if ((await this.#hashFileWithResources(join(stage, "archive"), signal, temporaryResources)).sha256 !== verified.packageSha256) throw new HopperReleaseError("integrity", "The verified package changed before cache retention.");
							await writeFile(join(stage, "public-key.asc"), verified.publicKey, {
								flag: "wx",
								mode: 384
							});
							await writeFile(join(stage, "release.json"), JSON.stringify({
								format: "rea-signed-hopper-release-v1",
								family: verified.family,
								release: verified.release
							}) + "\n", {
								flag: "wx",
								mode: 384
							});
							await this.#publishCacheStage(stage, target, verified.release.main_exe_hash, signal, resources);
						}, this.cacheRoot);
					});
					return ok(undefined);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async #publishCacheStage(stage, target, digest, signal, resources) {
				const existing = await this.#cachedPackage(digest, signal, resources);
				if (existing.ok) return;
				if (existing.error.reason === "cache_missing") {
					await rename(stage, target);
					return;
				}
				if (![
					"integrity",
					"release_metadata",
					"publisher_verification_failed"
				].includes(existing.error.reason)) throw existing.error;
				signal?.throwIfAborted();
				const previous = await lstat(target);
				if (!previous.isDirectory() || previous.isSymbolicLink() || previous.uid !== process.getuid?.()) throw existing.error;
				const backup = `${target}.backup-${randomUUID()}`;
				await rename(target, backup);
				try {
					const moved = await lstat(backup);
					if (moved.dev !== previous.dev || moved.ino !== previous.ino) throw new Error("The Hopper cache entry changed during repair.");
					await rename(stage, target);
				} catch (cause) {
					const replacement = await this.#cachedPackage(digest, signal, resources);
					if (replacement.ok) return;
					await this.#failedCachePublication(target, backup, [cause, replacement.error], replacement.error.reason === "cleanup_failed");
				}
			}
			async #acquireCacheLease(digest, signal) {
				const deadline = performance.now() + 12e4;
				const runId = randomUUID();
				let delay = 25;
				while (true) {
					signal?.throwIfAborted();
					const acquired = await acquireHopperReleaseCacheLease({
						cacheDirectory: this.cacheRoot,
						launcherSha256: digest,
						runId
					});
					if (acquired.acquired) return acquired.lease;
					const remaining = deadline - performance.now();
					if (remaining <= 0) throw new HopperReleaseError("verification_unavailable", "Another approved Hopper setup still owns this release cache. Retry after it finishes.");
					await waitForAbortableDelay(Math.min(delay, remaining), signal);
					delay = Math.min(delay * 2, 200);
				}
			}
			async #failedCachePublication(target, backup, causes, cleanupFailed = false) {
				let preserved = backup;
				try {
					await rename(backup, target);
					preserved = target;
				} catch (cause) {
					causes.push(cause);
				}
				throw new HopperReleaseError(cleanupFailed ? "cleanup_failed" : "verification_unavailable", `The Hopper cache repair did not finish; previous evidence is preserved at ${preserved}. Retry approved setup.`, { cause: new AggregateError(causes, "Hopper cache publication and recovery outcomes") });
			}
			async inspectLauncher(path, signal) {
				return this.#runOperation(signal, (resources) => this.#inspectLauncher(path, signal, resources));
			}
			async #inspectLauncher(path, signal, resources) {
				try {
					const observed = await this.#hashFileWithResources(path, signal, resources);
					const cached = await this.#cachedPackage(observed.sha256, signal, resources);
					if (cached.ok) {
						if ((await this.#hashFileWithResources(path, signal, resources)).sha256 !== observed.sha256) return err(new HopperReleaseError("integrity", "The Hopper launcher changed during publisher verification."));
						return ok(launcherIdentity(cached.value, "signed_package_cache"));
					}
					if (cached.error.reason !== "cache_missing") return cached;
					signal?.throwIfAborted();
					const processProof = liveLauncherProofs.get(observed.sha256);
					if (processProof !== undefined) return ok({
						...processProof,
						source: "verified_process_cache"
					});
					const family = await this.packageFamily();
					if (family === undefined) return err(new HopperReleaseError("verification_unavailable", "No native Linux package family is available for Hopper publisher verification."));
					const selected = await this.currentRelease(family, signal);
					if (!selected.ok) return selected;
					if (selected.value.main_exe_hash !== observed.sha256) return err(new HopperReleaseError("unsupported_hopper_build", "The selected Hopper launcher does not match an authenticated cached release or the official current Linux demo."));
					const verified = await this.#withTemporary(async (root, temporaryResources) => {
						const response = await downloadHopperPackage(selected.value.filename, signal === undefined ? {} : { signal });
						if (!response.ok) throw new HopperReleaseError("download", "The official Hopper package is unavailable for publisher verification.");
						const archive = join(root, "archive");
						await writeFile(archive, response.bytes, {
							flag: "wx",
							mode: 384
						});
						const verified = await this.#verifyArchive(family, selected.value, archive, signal, undefined, temporaryResources);
						if (!verified.ok) throw verified.error;
						return verified.value;
					});
					if ((await this.#hashFileWithResources(path, signal, resources)).sha256 !== observed.sha256) return err(new HopperReleaseError("integrity", "The Hopper launcher changed during publisher verification."));
					const identity = launcherIdentity(verified, "signed_vendor_release");
					retainProof(liveLauncherProofs, observed.sha256, identity);
					return ok(identity);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async close() {
				try {
					await this.#resources.close();
					pendingCleanup.delete(this.#resources);
				} catch (cause) {
					pendingCleanup.add(this.#resources);
					throw cause;
				}
			}
			/** Admit once at the publisher boundary; file reads use this operation's child scope. */
			async #runOperation(signal, operation) {
				try {
					return await this.#resources.run(async () => {
						const resources = new ArtifactResourceScope();
						let result;
						try {
							result = await operation(resources);
						} catch (cause) {
							result = err(releaseFailure(cause, signal, "verification_unavailable"));
						}
						const cleanup = await resources.close().then(() => ({ ok: true }), (cause) => ({
							ok: false,
							cause
						}));
						if (!cleanup.ok) {
							const owner = {
								kind: "lease",
								resource: "hopper-publisher-operation-resources",
								lease: { release: () => resources.close() }
							};
							this.#resources.retain(owner);
							pendingCleanup.add(this.#resources);
							throw new HopperReleaseError("cleanup_failed", "Hopper publisher retained operation resource cleanup.", { cause: new AggregateError(result.ok ? [cleanup.cause] : [result.error, cleanup.cause], "Publisher operation and resource cleanup outcomes") });
						}
						return result;
					});
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			/** Hash an installed launcher under this publisher's cleanup lifetime. */
			async hashLauncher(path) {
				const result = await this.#runOperation(undefined, async (resources) => ok((await this.#hashFileWithResources(path, undefined, resources)).sha256));
				if (!result.ok) throw result.error;
				return result.value;
			}
			async #hashFileWithResources(path, signal, resources) {
				let retainedOwner;
				try {
					return await hashStableFile(path, {
						...signal === undefined ? {} : { signal },
						retainFailedClose: (handle) => {
							retainedOwner = {
								kind: "file-handle",
								resource: path,
								handle
							};
							resources.retain(retainedOwner);
							if (resources === this.#resources) pendingCleanup.add(resources);
						}
					});
				} catch (cause) {
					if (!(cause instanceof RegularFileCleanupFailure)) throw cause;
					const hashFailure = cause;
					const owner = retainedOwner ?? {
						kind: "file-handle",
						resource: path,
						handle: hashFailure.owner
					};
					const released = await resources.release(owner);
					if (released.kind === "failed") {
						if (resources === this.#resources) pendingCleanup.add(resources);
						throw new HopperReleaseError("cleanup_failed", `Hopper publisher retained file descriptor cleanup for ${path}.`, { cause: new AggregateError([cause, released.cause], "Stable file hash and descriptor cleanup failed", { cause }) });
					}
					if (hashFailure.outcome.kind === "failed") {
						if (regularFileCancellation(hashFailure) !== undefined) throw hashFailure.outcome.cause;
						throw new StableFileHashFailure(path, hashFailure.outcome.cause);
					}
					const cancellation = regularFileCancellation(hashFailure);
					if (cancellation !== undefined) throw new RegularFileCancelled(path, hashFailure.owner, {
						outcome: hashFailure.outcome,
						reason: cancellation.reason
					});
					return hashFailure.outcome.value;
				}
			}
			async #cachedPackage(digest, signal, resources) {
				try {
					const root = join(this.cacheRoot, digest);
					try {
						const directory = await lstat(root);
						if (!directory.isDirectory() || directory.isSymbolicLink()) throw new HopperReleaseError("integrity", "The retained Hopper cache entry is not a regular directory.");
					} catch (cause) {
						if (cause instanceof Error && Reflect.get(cause, "code") === "ENOENT") {
							return err(new HopperReleaseError("cache_missing", "No retained signed Hopper package identifies this launcher.", { cause }));
						}
						throw cause;
					}
					for (const name of [
						"release.json",
						"public-key.asc",
						"archive"
					]) await this.#assertCacheFile(join(root, name));
					const metadata = await this.#read(join(root, "release.json"), RELEASE_METADATA_BYTES, signal, resources);
					let value;
					try {
						value = JSON.parse(decodeUtf8(metadata));
					} catch (cause) {
						throw new HopperReleaseError("release_metadata", "The retained Hopper package metadata is malformed.", { cause });
					}
					const parsed = cacheRecordSchema.safeParse(value);
					if (!parsed.success) throw new HopperReleaseError("release_metadata", "The retained Hopper package metadata is malformed.");
					const release = parseLinuxHopperRelease(parsed.data.release, parsed.data.family);
					if (!release.ok) return release;
					if (release.value.main_exe_hash !== digest) throw new HopperReleaseError("integrity", "The retained Hopper metadata does not identify this launcher.");
					const keyBytes = await this.#read(join(root, "public-key.asc"), RELEASE_METADATA_BYTES, signal, resources);
					let key;
					try {
						key = decodeUtf8(keyBytes);
					} catch (cause) {
						throw new HopperReleaseError("publisher_verification_failed", "The retained Hopper public key is malformed.", { cause });
					}
					return await this.#verifyArchive(parsed.data.family, release.value, join(root, "archive"), signal, key, resources);
				} catch (cause) {
					return err(releaseFailure(cause, signal, "verification_unavailable"));
				}
			}
			async #assertCacheFile(path) {
				try {
					const stats = await lstat(path);
					if (!stats.isFile() || stats.isSymbolicLink()) throw new HopperReleaseError("integrity", `Required Hopper evidence is not a regular file: ${path}.`);
				} catch (cause) {
					if (cause instanceof Error && Reflect.get(cause, "code") === "ENOENT") throw new HopperReleaseError("integrity", `Required Hopper evidence is missing: ${path}.`, { cause });
					throw cause;
				}
			}
			async #packageLauncherHash(family, archive, root, signal, resources) {
				const commandOptions = {
					env: this.environment,
					signal,
					timeout: 12e4,
					stopSignal: "SIGKILL",
					maxBuffer: RELEASE_METADATA_BYTES
				};
				if (family === "rpm") {
					const output = await execFileOutput("rpm", [
						"-qp",
						"--nosignature",
						"--nodigest",
						"--qf",
						"%{FILEDIGESTALGO}\n[%{FILENAMES}	%{FILEDIGESTS}\n]",
						archive
					], commandOptions);
					const rows = output.stdout.split("\n");
					if (rows.shift() !== "8") throw new HopperReleaseError("integrity", "The signed RPM header does not use SHA-256 file digests.");
					const matches = rows.filter((row) => row.startsWith("/opt/hopper/bin/Hopper	"));
					const digest = matches[0]?.split("	")[1];
					if (matches.length !== 1 || digest === undefined || !/^[a-f0-9]{64}$/u.test(digest)) throw new HopperReleaseError("integrity", "The signed RPM header has no unique Hopper launcher digest.");
					return digest;
				}
				const extracted = join(root, "extracted");
				await mkdir(extracted, { mode: 448 });
				if (family === "deb") await execFileOutput("dpkg-deb", [
					"--extract",
					archive,
					extracted
				], commandOptions);
				else await execFileOutput("tar", [
					"-xf",
					archive,
					"-C",
					extracted,
					"--",
					"opt/hopper/bin/Hopper"
				], commandOptions);
				return (await this.#hashFileWithResources(join(extracted, "opt", "hopper", "bin", "Hopper"), signal, resources)).sha256;
			}
			#read(path, limit, signal, resources) {
				return withRegularFile(path, async (handle, stats) => {
					if (stats.size > limit) throw new HopperReleaseError("integrity", "Retained Hopper evidence exceeds its resource byte budget.");
					const bytes = await readBoundedFileBytes(handle, stats.size, { signal });
					if (bytes === undefined) throw new HopperReleaseError("integrity", "Retained Hopper evidence changed during inspection.");
					return bytes;
				}, {
					signal,
					symlinks: "reject",
					resources
				}).catch((cause) => {
					if (resources === this.#resources && cause instanceof RegularFileCleanupFailure) pendingCleanup.add(resources);
					throw cause;
				});
			}
			async #withTemporary(operation, parent) {
				const root = await PrivateRuntimeRoot.create({
					prefix: "rea-hopper-publisher-",
					...parent === undefined ? {} : { parent }
				});
				const temporaryResources = new ArtifactResourceScope();
				const dependency = {
					kind: "lease",
					resource: root.path,
					lease: { release: async () => {
						await temporaryResources.close();
						await root.close();
					} }
				};
				let outcome;
				try {
					outcome = {
						ok: true,
						value: await operation(root.path, temporaryResources)
					};
				} catch (cause) {
					outcome = {
						ok: false,
						cause
					};
				}
				const released = await temporaryResources.close().then(() => ({ ok: true }), (cause) => ({
					ok: false,
					cause
				}));
				if (!released.ok) {
					this.#resources.retain(dependency);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained temporary cleanup ownership for ${root.path}.`, { cause: new AggregateError(outcome.ok ? [released.cause] : [outcome.cause, released.cause], "Temporary operation and descendant cleanup outcomes") });
				}
				try {
					await root.close();
				} catch (cleanupCause) {
					this.#resources.retain(dependency);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained temporary cleanup ownership for ${root.path}.`, { cause: new AggregateError(outcome.ok ? [cleanupCause] : [outcome.cause, cleanupCause], "Temporary operation and cleanup outcomes") });
				}
				if (!outcome.ok) throw outcome.cause;
				return outcome.value;
			}
			async #withOwnedResource(owner, operation) {
				let outcome;
				try {
					outcome = {
						ok: true,
						value: await operation()
					};
				} catch (cause) {
					outcome = {
						ok: false,
						cause
					};
				}
				if (this.#resources.hasPending) {
					this.#resources.retain(owner);
					pendingCleanup.add(this.#resources);
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained cleanup ownership for ${owner.resource}.`, { cause: new AggregateError(outcome.ok ? [] : [outcome.cause], "Publisher operation and descendant cleanup outcomes") });
				}
				const cleanup = await this.#resources.release(owner);
				if (cleanup.kind === "failed") {
					pendingCleanup.add(this.#resources);
					const causes = outcome.ok ? [cleanup.cause] : [outcome.cause, cleanup.cause];
					throw new HopperReleaseError("cleanup_failed", `Hopper publisher verification retained cleanup ownership for ${owner.resource}.`, { cause: new AggregateError(causes, "Publisher inspection and cleanup outcomes") });
				}
				if (!outcome.ok) throw outcome.cause;
				return outcome.value;
			}
		};
		retryLinuxHopperPublisherCleanup = async () => {
			const causes = [];
			const observations = [];
			const cleanupLeases = new Set();
			let cleanupLeaseAuthorityKnown = true;
			for (const scope of pendingCleanup) {
				try {
					await scope.close();
					pendingCleanup.delete(scope);
				} catch (cause) {
					causes.push(cause);
					const leases = artifactPrimaryCleanupLeases(cause);
					if (leases === undefined) cleanupLeaseAuthorityKnown = false;
					else for (const lease of leases) cleanupLeases.add(lease);
					observations.push(ArtifactReaderFailure.cleanupObservation(cause, "hopper-publisher-verification"));
				}
			}
			if (causes.length > 0) {
				const cleanup = {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: [...new Set(observations.flatMap(({ resources }) => resources))]
				};
				throw new ArtifactReaderFailure("unavailable", `Hopper publisher cleanup remains incomplete: ${cleanup.resources.join(", ")}`, {
					cause: new AggregateError(causes, "Hopper publisher cleanup failures"),
					cleanup,
					cleanupLeases: cleanupLeaseAuthorityKnown ? [...cleanupLeases] : undefined
				});
			}
		};
		decodeUtf8 = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		releaseFailure = (cause, signal, fallback) => {
			if (cause instanceof HopperReleaseError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return new HopperReleaseError("cleanup_failed", "Hopper publisher cleanup remains incomplete.", { cause });
			const cancellation = regularFileCancellation(cause);
			if (cancellation !== undefined) return new HopperReleaseError("cancelled", "Hopper publisher verification was cancelled.", { cause: cancellation.reason });
			if (!(cause instanceof StableFileHashFailure) && signal?.aborted === true) return new HopperReleaseError("cancelled", "Hopper publisher verification was cancelled.", { cause });
			return new HopperReleaseError(fallback, "Hopper publisher verification could not complete.", { cause });
		};
		launcherIdentity = (verified, source) => ({
			sha256: verified.release.main_exe_hash,
			version: verified.release.version,
			primaryFingerprint: verified.primaryFingerprint,
			signingFingerprint: verified.signingFingerprint,
			source
		});
	})))();
}

//#endregion
//#region dist/application/LinuxHopper.js
var PACKAGE_MANAGER_OUTPUT_BYTES, SUPPORTED_RELEASE_ARCHITECTURE, LINUX_HOPPER_SETUP_HOSTS, linuxHopperInstallDisclosure, supportsReaHost, operationFailure, LinuxHopperTemporaryCleanupOwner, parseLinuxDistribution, readLinuxDistribution, installLinuxHopper, linuxHopperLauncherPath, REA_MANAGED_LINUX_HOPPER_LAUNCHER, systemLinuxHopperLauncherCandidates, linuxHopperLauncherCandidates, systemLinuxHopperInstallHost, systemLinuxHopperPublisher, inspectLinuxHopperLauncher, closePublisherAndRetainedScopes, linuxSharedLibrariesAvailable, installSystemPackage, isAborted, cancelledInstall, pythonInspectionFailure, withPackagePrivilege, debianPythonLibraryCommand, runPackageManagerCommand, formatCommandForDisplay, linuxPackageManagerCommands, packageFamilyFor, versionAtLeast, isAbortCause;
function init_LinuxHopper() {
	return (init_LinuxHopper = __esmMin((() => {
		init_ExecFileBoundedOutput();
		init_ExecFileOutput();
		init_ArtifactReader();
		init_HopperDownload();
		init_LinuxHopperPython();
		init_OwnedRegularFile();
		init_result();
		init_HopperReleaseFeed();
		init_LinuxHopperPublisher();
		PACKAGE_MANAGER_OUTPUT_BYTES = 64 * 1024;
		SUPPORTED_RELEASE_ARCHITECTURE = "x64";
		LINUX_HOPPER_SETUP_HOSTS = "an x86_64 host running Ubuntu 24.04+, Fedora 41+, Nobara 44+, Arch Linux, CachyOS, or Omarchy";
		linuxHopperInstallDisclosure = (family, isRoot) => {
			return {
				networkOrigins: [
					HOPPER_RELEASES_URL,
					HOPPER_PUBLIC_KEY_URL,
					HOPPER_DOWNLOAD_PREFIX
				],
				integrity: `Detached PGP signature · primary ${HOPPER_LINUX_PRIMARY_FINGERPRINT} · package byte identity and installed launcher SHA-256 from the official feed`,
				commands: [...linuxPackageManagerCommands(family, `<verified-hopper.${family}>`, isRoot), ...family === "deb" ? [debianPythonLibraryCommand("<libpython matching /usr/bin/python3, if not loadable>", isRoot)] : []].map(({ executable, args }) => formatCommandForDisplay(executable, args))
			};
		};
		supportsReaHost = (distribution) => distribution?.packageFamily !== undefined;
		operationFailure = (operation, cause, path) => {
			const code = cause instanceof Error ? Reflect.get(cause, "code") : undefined;
			return {
				operation,
				detail: cause instanceof Error ? cause.message : String(cause),
				...path === undefined ? {} : { path },
				...typeof code === "string" ? { systemCode: code } : {}
			};
		};
		LinuxHopperTemporaryCleanupOwner = class {
			pending = new Map();
			retain(failure) {
				this.pending.set(failure.path, failure);
			}
			async retry(cleanup) {
				const failures = [];
				for (const path of this.pending.keys()) {
					try {
						await cleanup(path);
						this.pending.delete(path);
					} catch (cause) {
						const reason = cause instanceof Error ? cause.message : String(cause);
						failures.push(`Linux Hopper temporary cleanup failed for ${path}: ${reason}`);
					}
				}
				return failures.length === 0 ? undefined : {
					reason: failures.join("; "),
					resources: [...this.pending.keys()]
				};
			}
		};
		parseLinuxDistribution = (text, architecture) => {
			const fields = new Map();
			for (const line of text.split("\n")) {
				const match = /^([A-Z_]+)=(.*)$/u.exec(line.trim());
				if (match === null) continue;
				const key = match[1];
				const encoded = match[2];
				if (key === undefined || encoded === undefined) continue;
				const quote = encoded[0];
				const quoted = (quote === "'" || quote === "\"") && encoded.endsWith(quote);
				const value = !quoted ? encoded : quote === "'" ? encoded.slice(1, -1) : encoded.slice(1, -1).replace(/\\(["\\$`])/gu, "$1");
				fields.set(key, value);
			}
			const id = (fields.get("ID") ?? "unknown").toLowerCase();
			const versionId = fields.get("VERSION_ID");
			const packageFamily = packageFamilyFor(id, fields.get("ID_LIKE"));
			const hopperSetupSupported = packageFamily !== undefined && architecture === SUPPORTED_RELEASE_ARCHITECTURE && (id === "arch" || id === "cachyos" || id === "omarchy" && packageFamily === "arch" || id === "ubuntu" && versionAtLeast(versionId, 24) || id === "fedora" && versionAtLeast(versionId, 41) || id === "nobara" && versionAtLeast(versionId, 44));
			const identity = {
				id,
				...versionId === undefined ? {} : { versionId }
			};
			return hopperSetupSupported ? {
				...identity,
				packageFamily,
				hopperSetupSupported: true
			} : {
				...identity,
				packageFamily,
				hopperSetupSupported: false
			};
		};
		readLinuxDistribution = async (architecture) => {
			try {
				return parseLinuxDistribution(await readFile("/etc/os-release", "utf8"), architecture);
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		installLinuxHopper = async (host, options = {}) => {
			if (isAborted(options.signal)) return cancelledInstall(options.signal?.reason);
			const distribution = await host.distribution();
			if (distribution?.hopperSetupSupported !== true) return {
				status: "failed",
				reason: "unsupported_host"
			};
			let temporary;
			let result;
			let stage = "release_metadata";
			let operationPath;
			try {
				result = await (async () => {
					const selected = await host.release(distribution.packageFamily, options.signal);
					if (!selected.ok) return {
						status: "failed",
						verificationFailure: selected.error,
						reason: selected.error.reason === "cancelled" ? "cancelled" : "release_metadata"
					};
					const release = selected.value;
					stage = "download";
					const archiveDownload = await host.download(release.filename, options);
					if (!archiveDownload.ok) return {
						status: "failed",
						reason: "download"
					};
					stage = "archive_write";
					temporary = await host.createTemporaryDirectory();
					const archive = posix.join(temporary, `hopper.${distribution.packageFamily}`);
					operationPath = archive;
					await host.writeArchive(archive, archiveDownload.bytes);
					stage = "publisher_verification_failed";
					const verified = await host.verifyArchive(distribution.packageFamily, release, archive, options.signal);
					if (!verified.ok) return {
						status: "failed",
						verificationFailure: verified.error,
						reason: verified.error.reason === "cache_missing" ? "verification_unavailable" : verified.error.reason
					};
					const retained = await host.retainVerifiedArchive(verified.value, archive, options.signal);
					if (!retained.ok) return {
						status: "failed",
						verificationFailure: retained.error,
						reason: retained.error.reason === "cache_missing" ? "verification_unavailable" : retained.error.reason
					};
					if (isAborted(options.signal)) return cancelledInstall(options.signal?.reason);
					stage = "authorization_or_package_manager";
					const install = await host.installPackage(distribution.packageFamily, archive, options);
					if (install.status === "cancelled") return cancelledInstall(install.cause);
					if (install.status === "failed") return {
						status: "failed",
						reason: "authorization_or_package_manager",
						packageFailure: install.failure
					};
					if (install.status === "runtime_unavailable") return {
						status: "failed",
						reason: "runtime_dependencies",
						pythonRuntimeFailure: install.failure
					};
					stage = "launcher_inspection";
					const launcherPath = "/opt/hopper/bin/Hopper";
					operationPath = launcherPath;
					const launcherStatus = await host.launcherStatus(launcherPath, release.main_exe_hash);
					if (typeof launcherStatus !== "string") return {
						status: "failed",
						reason: "launcher_inspection",
						operationFailure: launcherStatus
					};
					if (launcherStatus !== "ready") return {
						status: "failed",
						reason: launcherStatus === "missing" ? "launcher_missing" : launcherStatus
					};
					return {
						status: "installed",
						launcherPath
					};
				})();
			} catch (cause) {
				result = {
					status: "failed",
					reason: isAborted(options.signal) || isAbortCause(cause) ? "cancelled" : stage,
					operationFailure: operationFailure(stage, cause, operationPath)
				};
			}
			if (result.status === "failed" && result.reason === "cancelled" && isAborted(options.signal)) result = {
				...result,
				cancellationReason: options.signal?.reason
			};
			if (temporary === undefined) return result;
			try {
				await host.cleanup(temporary);
				return result;
			} catch (cause) {
				return {
					...result,
					cleanupFailure: {
						path: temporary,
						reason: cause instanceof Error ? cause.message : String(cause)
					}
				};
			}
		};
		linuxHopperLauncherPath = (home) => posix.join(home, ".local/share/rea/hopper/bin/Hopper");
		REA_MANAGED_LINUX_HOPPER_LAUNCHER = "/opt/hopper/bin/Hopper";
		systemLinuxHopperLauncherCandidates = ["/opt/hopper-v4/bin/hopper", "/usr/bin/hopper"];
		linuxHopperLauncherCandidates = (home) => [
			REA_MANAGED_LINUX_HOPPER_LAUNCHER,
			linuxHopperLauncherPath(home),
			...systemLinuxHopperLauncherCandidates
		];
		systemLinuxHopperInstallHost = (environment, distribution) => {
			const publisher = systemLinuxHopperPublisher(environment);
			return {
				distribution,
				release: (family, signal) => publisher.currentRelease(family, signal),
				download: downloadHopperPackage,
				createTemporaryDirectory: () => mkdtemp(join(tmpdir(), "rea-hopper-")),
				writeArchive: (path, bytes) => writeFile(path, bytes, { mode: 384 }),
				installPackage: (family, archive, options) => installSystemPackage(family, archive, environment, options?.signal),
				verifyArchive: (family, release, archive, signal) => publisher.verifyArchive(family, release, archive, signal),
				retainVerifiedArchive: (verified, archive, signal) => publisher.retainVerifiedArchive(verified, archive, signal),
				async launcherStatus(path, expectedSha256) {
					let operation = "access";
					try {
						await access(path);
						operation = "dependencies";
						const linked = await execFileOutput("ldd", [path], { env: environment });
						if (!linuxSharedLibrariesAvailable(`${linked.stdout}\n${linked.stderr}`)) return "runtime_dependencies";
						operation = "hash";
						return await publisher.hashLauncher(path) === expectedSha256 ? "ready" : "unsupported_hopper_build";
					} catch (cause) {
						if (cause instanceof RegularFileCleanupFailure || cause instanceof HopperReleaseError && cause.reason === "cleanup_failed" || cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return "cleanup_failed";
						if (operation === "access" && cause instanceof Error && "code" in cause && cause.code === "ENOENT") return "missing";
						return {
							status: "inspection_failed",
							...operationFailure(operation, cause, path),
							operation,
							path
						};
					}
				},
				cleanup: (path) => rm(path, {
					recursive: true,
					force: true
				}),
				close: () => closePublisherAndRetainedScopes(publisher)
			};
		};
		systemLinuxHopperPublisher = (environment) => new LinuxHopperPublisher(environment, async () => (await readLinuxDistribution(process.arch))?.packageFamily);
		inspectLinuxHopperLauncher = async (path, environment, signal) => {
			const publisher = systemLinuxHopperPublisher(environment);
			const result = await publisher.inspectLauncher(path, signal);
			try {
				await closePublisherAndRetainedScopes(publisher);
				return result;
			} catch (cause) {
				return err(new HopperReleaseError("cleanup_failed", "Hopper publisher verification retains incomplete cleanup.", { cause: new AggregateError(result.ok ? [cause] : [result.error, cause], "Publisher verification outcomes") }));
			}
		};
		closePublisherAndRetainedScopes = async (publisher) => {
			try {
				await publisher.close();
			} catch {}
			await retryLinuxHopperPublisherCleanup();
		};
		linuxSharedLibrariesAvailable = (output) => !/(?:=>\s+not found|error while loading shared libraries)/iu.test(output);
		installSystemPackage = async (family, archive, environment, signal) => {
			const cancelled = () => ({
				status: "cancelled",
				cause: signal?.reason
			});
			const isRoot = process.getuid?.() === 0;
			for (const command of linuxPackageManagerCommands(family, archive, isRoot)) {
				if (isAborted(signal)) return cancelled();
				const result = await runPackageManagerCommand(command, environment);
				if (result.status === "failed") return result;
			}
			if (isAborted(signal)) return cancelled();
			if (family !== "deb") return { status: "installed" };
			const python = await inspectLinuxHopperPythonRuntime(environment, signal);
			if (isAborted(signal)) return cancelled();
			if (!python.ok) return pythonInspectionFailure(python.error);
			if (python.value.library.status === "loadable") return { status: "installed" };
			if (python.value.library.status === "unknown") return {
				status: "runtime_unavailable",
				failure: linuxHopperPythonUnavailable(python.value.library)
			};
			const packageName = "libpython" + python.value.version.join(".");
			const libraryPath = python.value.library.path;
			if (posix.basename(libraryPath) !== packageName + ".so.1.0" || !/^\/usr\/lib\/[a-z0-9_]+-linux-gnu[a-z0-9_]*$/u.test(posix.dirname(libraryPath))) return {
				status: "runtime_unavailable",
				failure: new LinuxHopperPythonError("configuration_unknown", "Cannot determine the matching APT runtime package for " + libraryPath + ". Repair this interpreter's shared runtime before retrying.")
			};
			if (isAborted(signal)) return cancelled();
			const installed = await runPackageManagerCommand(debianPythonLibraryCommand(packageName, isRoot), environment);
			if (installed.status === "failed") return installed;
			if (isAborted(signal)) return cancelled();
			const verified = await inspectLinuxHopperPythonRuntime(environment, signal);
			if (isAborted(signal)) return cancelled();
			if (!verified.ok) return pythonInspectionFailure(verified.error);
			if (verified.value.library.status !== "loadable") return {
				status: "runtime_unavailable",
				failure: linuxHopperPythonUnavailable(verified.value.library)
			};
			return { status: "installed" };
		};
		isAborted = (signal) => signal?.aborted === true;
		cancelledInstall = (cause) => ({
			status: "failed",
			reason: "cancelled",
			cancellationReason: cause
		});
		pythonInspectionFailure = (failure) => failure.reason === "cancelled" ? {
			status: "cancelled",
			cause: failure.cause
		} : {
			status: "runtime_unavailable",
			failure
		};
		withPackagePrivilege = (executable, args, isRoot) => isRoot ? {
			executable,
			args
		} : {
			executable: "pkexec",
			args: [executable, ...args]
		};
		debianPythonLibraryCommand = (packageName, isRoot) => withPackagePrivilege("apt-get", [
			"install",
			"-y",
			packageName
		], isRoot);
		runPackageManagerCommand = async (command, environment) => {
			const output = await execFileBoundedOutput(command.executable, command.args, {
				env: environment,
				limit: PACKAGE_MANAGER_OUTPUT_BYTES
			});
			return output.exitCode === 0 ? { status: "installed" } : {
				status: "failed",
				failure: {
					command: formatCommandForDisplay(command.executable, command.args),
					exitCode: output.exitCode,
					stdout: output.stdout,
					stderr: output.stderr,
					outputTruncated: output.outputTruncated
				}
			};
		};
		formatCommandForDisplay = (executable, args) => [executable, ...args].map((part) => /^[A-Za-z0-9_./:@%+=,-]+$/u.test(part) ? part : JSON.stringify(part)).join(" ");
		linuxPackageManagerCommands = (family, archive, isRoot) => {
			const runtimeDependencies = family === "deb" ? [
				"xvfb",
				"xauth",
				"python3",
				"libx11-6",
				"libxtst6"
			] : family === "rpm" ? [
				"xorg-x11-server-Xvfb",
				"xorg-x11-xauth",
				"python3",
				"libX11",
				"libXtst"
			] : [
				"xorg-server-xvfb",
				"xorg-xauth",
				"python",
				"libx11",
				"libxtst"
			];
			const commands = family === "deb" ? [[
				"apt-get",
				"install",
				"-y",
				"--no-upgrade",
				...runtimeDependencies
			], [
				"apt-get",
				"install",
				"-y",
				archive
			]] : family === "rpm" ? [[
				"dnf",
				"install",
				"-y",
				archive,
				...runtimeDependencies
			]] : [[
				"pacman",
				"-S",
				"--needed",
				"--noconfirm",
				...runtimeDependencies
			], [
				"pacman",
				"-U",
				"--noconfirm",
				archive
			]];
			return commands.map((command) => {
				const executable = command[0];
				if (executable === undefined) throw new Error("package command is empty");
				return withPackagePrivilege(executable, command.slice(1), isRoot);
			});
		};
		packageFamilyFor = (id, idLike) => {
			const identities = new Set([id, ...idLike?.toLowerCase().split(/\s+/u) ?? []]);
			if (identities.has("ubuntu") || identities.has("debian")) return "deb";
			if (identities.has("fedora") || identities.has("rhel")) return "rpm";
			if (identities.has("arch")) return "arch";
			return undefined;
		};
		versionAtLeast = (version, minimum) => version !== undefined && Number.parseInt(version.split(".")[0] ?? "0", 10) >= minimum;
		isAbortCause = (cause) => cause instanceof Error && cause.name === "AbortError";
	})))();
}

//#endregion
//#region dist/process/SharedStartupAttempt.js
var STARTUP_OWNER_CLOSED, SharedStartupAttempt;
function init_SharedStartupAttempt() {
	return (init_SharedStartupAttempt = __esmMin((() => {
		init_AbortablePromise();
		STARTUP_OWNER_CLOSED = Symbol("provider startup owner closed");
		SharedStartupAttempt = class {
			#controller = new AbortController();
			promise;
			#signal;
			#waiters = 0;
			#settlement = { status: "pending" };
			constructor(start, ownerSignal) {
				this.#signal = ownerSignal === undefined ? this.#controller.signal : AbortSignal.any([ownerSignal, this.#controller.signal]);
				this.promise = start(this.#signal);
				void this.promise.then((value) => {
					this.#settlement = {
						status: "completed",
						value
					};
				}, () => {
					this.#settlement = { status: "rejected" };
				});
			}
			/** Signal consumed by the startup producer, never by an individual waiter. */
			get signal() {
				return this.#signal;
			}
			/** Completion includes the producer's final cleanup, not just its abort. */
			get settled() {
				return this.#settlement.status !== "pending";
			}
			/** Parsed completion facts are owned here, rather than copied into adapters. */
			get settlement() {
				return this.#settlement;
			}
			/** Stop startup when its owning provider closes, regardless of active waits. */
			close() {
				if (!this.settled) this.#controller.abort(STARTUP_OWNER_CLOSED);
			}
			/** A peer's departure leaves the producer running; final departure joins cleanup. */
			async wait(signal) {
				this.#waiters += 1;
				try {
					const waited = await waitForAbortable(this.promise, signal);
					if (waited !== ABORTED) return {
						status: "completed",
						value: waited
					};
					if (this.#waiters > 1) return { status: "cancelled" };
					if (!this.settled) this.#controller.abort(signal?.reason);
					return {
						status: "stopped",
						value: await this.promise
					};
				} finally {
					this.#waiters -= 1;
				}
			}
		};
	})))();
}

//#endregion
export { LINUX_HOPPER_SETUP_HOSTS, LinuxHopperTemporaryCleanupOwner, REA_MANAGED_LINUX_HOPPER_LAUNCHER, STARTUP_OWNER_CLOSED, SharedStartupAttempt, acquireHopperTargetLease, acquireLinuxHopperApplicationLease, init_HopperLease, init_LinuxHopper, init_LinuxHopperPublisher, init_LinuxHopperPython, init_SharedStartupAttempt, inspectLinuxHopperLauncher, inspectLinuxHopperPythonRuntime, installLinuxHopper, linuxHopperInstallDisclosure, linuxHopperLauncherCandidates, linuxHopperPythonUnavailable, linuxSharedLibrariesAvailable, readLinuxDistribution, retryLinuxHopperPublisherCleanup, supportsReaHost, systemLinuxHopperInstallHost };