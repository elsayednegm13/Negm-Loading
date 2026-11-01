import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { RuntimeControlUnavailableError, WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION, init_RuntimeControlUnavailableError, init_WindowsNativeLoader, requireWindowsNativeAuthority, systemWindowsNativeAuthority, windowsFileIdentitySchema, windowsHandleSchema } from "./WindowsNativeLoader-B88N4705.js";
import { z } from "zod";
import { join, win32 } from "node:path";
import { setTimeout } from "node:timers/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

//#region dist/process/PrivateRuntimeRootUnavailableError.js
var PrivateRuntimeRootUnavailableError;
function init_PrivateRuntimeRootUnavailableError() {
	return (init_PrivateRuntimeRootUnavailableError = __esmMin((() => {
		init_RuntimeControlUnavailableError();
		PrivateRuntimeRootUnavailableError = class extends RuntimeControlUnavailableError {
			code = "private-runtime-root-authority-unavailable";
			constructor(message, options) {
				super(message, options);
				this.name = "PrivateRuntimeRootUnavailableError";
			}
		};
	})))();
}

//#endregion
//#region dist/windows/WindowsPrivateRuntime.js
var runtimeSchema, snapshotSchema, fileSchema, runtimes, transientRuntimeAdmissionSchema, transientRuntimeCleanupSchema, snapshotCancellationSchema, WindowsSnapshotCancelledError, RUNTIME_CLEANUP_ATTEMPTS, RUNTIME_CLEANUP_RETRY_DELAY_MS, WindowsPrivateRuntime, windowsRuntimeIdentityKey, windowsPrivateRuntime, readWindowsPrivateRuntimeFile;
function init_WindowsPrivateRuntime() {
	return (init_WindowsPrivateRuntime = __esmMin((() => {
		init_PrivateRuntimeRootUnavailableError();
		init_WindowsNativeLoader();
		runtimeSchema = windowsFileIdentitySchema.extend({
			path: z.string(),
			handle: windowsHandleSchema,
			privateDacl: z.literal(true)
		});
		snapshotSchema = z.strictObject({
			sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			source: windowsFileIdentitySchema,
			snapshot: windowsFileIdentitySchema
		});
		fileSchema = windowsFileIdentitySchema.extend({ handle: windowsHandleSchema });
		runtimes = new Map();
		transientRuntimeAdmissionSchema = z.object({
			code: z.literal("ERR_REA_WINDOWS_NATIVE"),
			win32Code: z.union([z.literal(32), z.literal(33)]),
			runtimeAllocation: z.literal("not-started")
		});
		transientRuntimeCleanupSchema = z.object({
			code: z.literal("ERR_REA_WINDOWS_NATIVE"),
			win32Code: z.union([z.literal(32), z.literal(33)])
		});
		snapshotCancellationSchema = z.object({
			code: z.literal("ERR_REA_WINDOWS_NATIVE"),
			win32Code: z.literal(995)
		});
		WindowsSnapshotCancelledError = class extends Error {
			reason;
			constructor(reason, cause) {
				super("Windows snapshot cancelled", { cause });
				this.reason = reason;
				this.name = "WindowsSnapshotCancelledError";
			}
		};
		RUNTIME_CLEANUP_ATTEMPTS = 10;
		RUNTIME_CLEANUP_RETRY_DELAY_MS = 100;
		WindowsPrivateRuntime = class WindowsPrivateRuntime {
			observation;
			authority;
			#pending;
			#closed = false;
			#closePromise;
			#unreleasedFiles = [];
			constructor(observation, authority) {
				this.observation = observation;
				this.authority = authority;
			}
			/** Create a new directory with its private DACL installed at creation. */
			static create(parent, prefix) {
				const authority = requireWindowsNativeAuthority();
				let observed;
				try {
					observed = authority.call("runtime_create", [parent, prefix]);
				} catch (cause) {
					if (cause instanceof Error && transientRuntimeAdmissionSchema.safeParse(cause).success) throw new PrivateRuntimeRootUnavailableError(cause.message, {
						cause,
						retryable: true
					});
					throw cause;
				}
				const observation = runtimeSchema.parse(observed);
				const runtime = new WindowsPrivateRuntime(observation, authority);
				runtimes.set(windowsRuntimeIdentityKey(observation), runtime);
				return runtime;
			}
			/** Open a private child directory through retained, verified parent handles. */
			mkdir(relativePath) {
				this.authority.call("runtime_mkdir", [this.observation.handle, relativePath]);
			}
			/** Write a new private file once and retain its immutable handle. */
			writeFile(relativePath, content) {
				this.authority.call("runtime_write", [
					this.observation.handle,
					relativePath,
					Buffer.from(content)
				]);
			}
			/** Copy admitted source bytes and digest the bytes actually written. */
			async snapshot(sourcePath, relativePath, signal) {
				const pending = Promise.resolve(this.authority.call("runtime_snapshot", [
					this.observation.handle,
					sourcePath,
					relativePath
				]));
				this.#pending = pending;
				const cancel = () => {
					this.authority.call("runtime_snapshot_cancel", [this.observation.handle]);
				};
				signal?.addEventListener("abort", cancel, { once: true });
				if (signal?.aborted === true) cancel();
				try {
					return snapshotSchema.parse(await pending);
				} catch (cause) {
					if (signal?.aborted === true && snapshotCancellationSchema.safeParse(cause).success) throw new WindowsSnapshotCancelledError(signal.reason, cause);
					throw cause;
				} finally {
					signal?.removeEventListener("abort", cancel);
					if (this.#pending === pending) this.#pending = undefined;
				}
			}
			/** Read a private endpoint from an opened file, without re-opening its path. */
			readFile(relativePath) {
				const file = fileSchema.parse(this.authority.call("runtime_open", [this.observation.handle, relativePath]));
				let text;
				let closeFailure;
				try {
					const chunks = [];
					for (let offset = 0; offset < file.size;) {
						const value = z.instanceof(Buffer).parse(this.authority.call("read", [
							file.handle,
							offset,
							Math.min(65536, file.size - offset)
						]));
						if (value.length === 0) throw new Error("Private runtime file ended before its observed size");
						offset += value.length;
						chunks.push(value);
					}
					text = Buffer.concat(chunks).toString("utf8");
				} finally {
					try {
						this.authority.call("close", [file.handle]);
					} catch (cause) {
						this.#unreleasedFiles.push(file.handle);
						closeFailure = cause;
					}
				}
				if (closeFailure !== undefined) throw closeFailure;
				return text;
			}
			/** Remove owned objects by handle, unlinking reparse entries without traversal. */
			close() {
				this.#closePromise ??= this.#remove().catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
			async #remove() {
				if (this.#closed) return;
				if (this.#pending !== undefined) this.authority.call("runtime_snapshot_cancel", [this.observation.handle]);
				await this.#pending?.catch(() => undefined);
				await this.#closeRuntime();
				this.#closed = true;
				runtimes.delete(windowsRuntimeIdentityKey(this.observation));
			}
			/** Close admitted files that survived readFile before walking the tree. */
			#releaseAdmittedFiles() {
				const pending = this.#unreleasedFiles.splice(0);
				let failure;
				for (const handle of pending) {
					try {
						this.authority.call("close", [handle]);
					} catch (cause) {
						this.#unreleasedFiles.push(handle);
						failure ??= cause;
					}
				}
				if (failure !== undefined) throw failure;
			}
			async #closeRuntime() {
				for (let attempt = 1;; attempt++) {
					try {
						this.#releaseAdmittedFiles();
						this.authority.call("runtime_close", [this.observation.handle]);
						return;
					} catch (cause) {
						if (attempt >= RUNTIME_CLEANUP_ATTEMPTS || !transientRuntimeCleanupSchema.safeParse(cause).success) throw cause;
						await setTimeout(RUNTIME_CLEANUP_RETRY_DELAY_MS);
					}
				}
			}
		};
		windowsRuntimeIdentityKey = (identity) => `${identity.volumeSerial}:${identity.fileId}`;
		windowsPrivateRuntime = (rootPath) => {
			const matches = [...runtimes.values()].filter((runtime) => runtime.observation.finalPath === rootPath || runtime.observation.path === rootPath);
			const runtime = matches[0];
			if (matches.length !== 1 || runtime === undefined) throw new Error(`No native private runtime owns ${rootPath}`);
			return runtime;
		};
		readWindowsPrivateRuntimeFile = (path) => {
			const parent = win32.dirname(path);
			return windowsPrivateRuntime(parent).readFile(win32.basename(path));
		};
	})))();
}

//#endregion
//#region dist/process/WindowsAuthority.js
var inspectWindowsNativeReadiness, windowsNativeCapabilities;
function init_WindowsAuthority() {
	return (init_WindowsAuthority = __esmMin((() => {
		init_WindowsNativeLoader();
		inspectWindowsNativeReadiness = (platform, observation) => {
			if (platform !== "win32") return {
				available: false,
				failureStage: "host",
				reason: "Windows native authority is not applicable on this host",
				proof: "not-applicable",
				code: "unsupported_host",
				remediation: "Use a Windows x64 host for Windows native controls."
			};
			const loaded = observation ?? systemWindowsNativeAuthority();
			if (loaded.available) return { available: true };
			const failureStage = loaded.failureStage;
			return {
				available: false,
				failureStage,
				reason: loaded.reason,
				...loaded.retryable === true ? { retryable: true } : {},
				proof: "not-proven",
				code: failureStage === "host" ? "unsupported_host" : failureStage === "artifact" || failureStage === "load" ? "runtime_missing" : "runtime_unavailable",
				remediation: failureStage === "host" ? "Use a Windows x64 host and a supported Node.js runtime with Node-API 8 or newer." : failureStage === "load" ? WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION : failureStage === "artifact" ? "Use the matching Windows x64 REA package, or restore native/windows/build/manifest.json and native/windows/build/rea-windows-x64.node from the same-version rea-agents tarball or build them with native/windows/README.md. The loader checks version, ABI, architecture, and digest before granting authority; no download or install is performed automatically." : failureStage === "inspection" ? "Install the matching Windows x64 REA package; its native inspection must prove every required security control." : "Inspect the preserved native self-test error. Check that the process's temporary directory is writable local NTFS and that its filesystem, DACL, Job Object, and cleanup operations are permitted. Resolve the reported constraint, then rerun rea doctor; reinstalling Ghidra or Java cannot fix this self-test."
			};
		};
		windowsNativeCapabilities = (platform, readiness = inspectWindowsNativeReadiness(platform)) => {
			const capability = readiness.available ? {
				available: true,
				reason: null,
				proof: "native-authority"
			} : {
				available: false,
				reason: readiness.reason,
				proof: readiness.proof,
				code: readiness.code,
				failureStage: readiness.failureStage,
				remediation: readiness.remediation,
				...readiness.retryable === true ? { retryable: true } : {}
			};
			return {
				job_object_process_ownership: capability,
				private_runtime_dacl: capability,
				reparse_safe_path_admission: capability
			};
		};
	})))();
}

//#endregion
//#region dist/process/PrivateRuntimeRoot.js
var privateRuntimeRootCapability, PrivateRuntimeRoot;
function init_PrivateRuntimeRoot() {
	return (init_PrivateRuntimeRoot = __esmMin((() => {
		init_WindowsPrivateRuntime();
		init_PrivateRuntimeRootUnavailableError();
		init_WindowsAuthority();
		privateRuntimeRootCapability = (platform = process.platform) => platform === "win32" ? windowsNativeCapabilities(platform).private_runtime_dacl : {
			available: true,
			reason: null,
			proof: "posix-mkdtemp-owner-only"
		};
		PrivateRuntimeRoot = class PrivateRuntimeRoot {
			path;
			windowsRuntime;
			#closePromise;
			constructor(path, windowsRuntime) {
				this.path = path;
				this.windowsRuntime = windowsRuntime;
			}
			/** Allocate a new private runtime root without performing protocol work. */
			static async create(options = {}) {
				const platform = options.platform ?? process.platform;
				const capability = privateRuntimeRootCapability(platform);
				if (!capability.available) throw new PrivateRuntimeRootUnavailableError(capability.reason, { retryable: capability.retryable === true });
				if (platform === "win32") {
					const runtime = WindowsPrivateRuntime.create(options.parent ?? tmpdir(), options.prefix ?? "rea-provider-");
					return new PrivateRuntimeRoot(runtime.observation.path, runtime);
				}
				const path = await mkdtemp(join(options.parent ?? tmpdir(), options.prefix ?? "rea-provider-"));
				return new PrivateRuntimeRoot(path);
			}
			/**
			* Remove the runtime root; concurrent callers share one attempt. A failed
			* attempt is not cached, so a later close retries the removal.
			*/
			close() {
				this.#closePromise ??= (this.windowsRuntime === undefined ? rm(this.path, {
					recursive: true,
					force: true
				}) : Promise.resolve().then(() => this.windowsRuntime?.close())).catch((cause) => {
					this.#closePromise = undefined;
					throw cause;
				});
				return this.#closePromise;
			}
		};
	})))();
}

//#endregion
export { PrivateRuntimeRoot, WindowsSnapshotCancelledError, init_PrivateRuntimeRoot, init_WindowsAuthority, init_WindowsPrivateRuntime, inspectWindowsNativeReadiness, privateRuntimeRootCapability, readWindowsPrivateRuntimeFile, windowsNativeCapabilities, windowsPrivateRuntime };