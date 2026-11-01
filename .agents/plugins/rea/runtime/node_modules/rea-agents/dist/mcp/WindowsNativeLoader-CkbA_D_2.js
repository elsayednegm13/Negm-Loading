import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { a as AnalysisCapabilityUnavailableError, f as init_analysisErrorCore } from "./analysisErrorCore-Cl6H9zyu.js";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createHash } from "node:crypto";
import { PACKAGE_METADATA } from "../generatedPackageMetadata.js";

//#region dist/process/RuntimeControlUnavailableError.js
var RuntimeControlUnavailableError, runtimeControlCapabilityError;
function init_RuntimeControlUnavailableError() {
	return (init_RuntimeControlUnavailableError = __esmMin((() => {
		init_analysisErrorCore();
		RuntimeControlUnavailableError = class extends Error {
			retryable;
			/** Caller-facing recovery, when the owner knows a specific one. */
			remediationAction;
			constructor(message, options) {
				super(message, options);
				this.retryable = options?.retryable ?? false;
				this.remediationAction = options?.remediationAction;
			}
		};
		runtimeControlCapabilityError = (providerId, operation, cause) => new AnalysisCapabilityUnavailableError(providerId, operation, cause.message, {
			cause,
			retryable: cause.retryable,
			...cause.remediationAction === undefined ? {} : {
				userMessage: cause.message,
				remediationAction: cause.remediationAction
			}
		});
	})))();
}

//#endregion
//#region dist/windows/WindowsNativeLoader.js
var windowsHandleSchema, windowsFileIdentitySchema, windowsNativeManifestSchema, inspectionSchema, bindingSchema, missingWindowsNativeFileReason, WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION, readPackagedWindowsNativeFile, loadWindowsNativeAuthority, assertWindowsX64Artifact, cached, systemWindowsNativeAuthority, requireWindowsNativeAuthority;
function init_WindowsNativeLoader() {
	return (init_WindowsNativeLoader = __esmMin((() => {
		windowsHandleSchema = z.custom((value) => typeof value === "object" && value !== null && !Array.isArray(value));
		windowsFileIdentitySchema = z.strictObject({
			requestedPath: z.string(),
			finalPath: z.string(),
			filesystem: z.literal("NTFS"),
			volumeSerial: z.string().regex(/^[a-f0-9]{16}$/u),
			fileId: z.string().regex(/^[a-f0-9]{32}$/u),
			size: z.int().nonnegative().max(Number.MAX_SAFE_INTEGER),
			directory: z.boolean()
		});
		windowsNativeManifestSchema = z.strictObject({
			packageVersion: z.string(),
			platform: z.literal("win32"),
			architecture: z.literal("x64"),
			abiVersion: z.literal(1),
			nodeApiVersion: z.literal(8),
			artifact: z.literal("rea-windows-x64.node"),
			artifactSha256: z.string().regex(/^[a-f0-9]{64}$/u)
		});
		inspectionSchema = z.strictObject({
			abiVersion: z.literal(1),
			nodeApiVersion: z.literal(8),
			architecture: z.literal("x64"),
			filesystem: windowsFileIdentitySchema,
			privateDacl: z.literal(true),
			privateBridgeDescriptorAccess: z.literal(true),
			atomicJobAssignment: z.literal(true),
			killOnOwnerClose: z.literal(true),
			protocolStdin: z.boolean().optional(),
			/** Absent from artifacts built before owned Job Object commit limits. */
			jobMemoryLimit: z.literal(true).optional()
		});
		bindingSchema = z.strictObject({ call: z.custom((value) => typeof value === "function") });
		missingWindowsNativeFileReason = (file) => `Missing packaged Windows native file native/windows/build/${file} (ENOENT). Restore both native/windows/build/manifest.json and native/windows/build/rea-windows-x64.node from the rea-agents@${PACKAGE_METADATA.version} tarball or build them with native/windows/README.md; no native artifact was loaded.`;
		WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION = "The file matched the package manifest, so restoring or reinstalling it will not help. If Windows reports that an Application Control policy blocked the file, Smart App Control or an App Control for Business policy refused it. Windows native controls, which Ghidra and JADX need on Windows, stay unavailable; rea setup can still register clients. Run REA on a host whose policy allows this file, or ask the REA maintainers about a signed build.";
		readPackagedWindowsNativeFile = (file, read) => {
			try {
				return read();
			} catch (cause) {
				if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ENOENT") throw new Error(missingWindowsNativeFileReason(file), { cause });
				throw cause;
			}
		};
		loadWindowsNativeAuthority = (host) => {
			if (host.platform !== "win32" || host.architecture !== "x64") return {
				available: false,
				failureStage: "host",
				reason: "REA Windows native controls require a Windows x64 host."
			};
			const nodeApiVersion = Number(host.nodeApiVersion);
			if (!Number.isSafeInteger(nodeApiVersion) || nodeApiVersion < 8) return {
				available: false,
				failureStage: "host",
				reason: "REA Windows native controls require Node-API 8 or newer."
			};
			try {
				const manifest = windowsNativeManifestSchema.parse(readPackagedWindowsNativeFile("manifest.json", () => host.readManifest()));
				if (manifest.packageVersion !== host.packageVersion) throw new Error("Windows native artifact belongs to another REA version");
				const artifact = readPackagedWindowsNativeFile("rea-windows-x64.node", () => host.readArtifact());
				if (createHash("sha256").update(artifact).digest("hex") !== manifest.artifactSha256) throw new Error("Windows native artifact SHA-256 does not match package metadata");
				assertWindowsX64Artifact(artifact);
				let loadedModule;
				try {
					loadedModule = host.loadArtifact();
				} catch (cause) {
					return {
						available: false,
						failureStage: "load",
						reason: `REA Windows native controls are unavailable: Windows refused to load the verified native/windows/build/rea-windows-x64.node: ${cause instanceof Error ? cause.message : String(cause)} ${WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION}`
					};
				}
				const binding = bindingSchema.parse(loadedModule);
				let observed;
				try {
					observed = binding.call("inspect", []);
				} catch (cause) {
					return {
						available: false,
						failureStage: "self-test",
						retryable: true,
						reason: `REA Windows native self-test failed: ${cause instanceof Error ? cause.message : String(cause)}`
					};
				}
				const parsed = inspectionSchema.safeParse(observed);
				if (!parsed.success) return {
					available: false,
					failureStage: "inspection",
					reason: `REA Windows native inspection is invalid: ${parsed.error.message}`
				};
				const inspection = parsed.data;
				return {
					available: true,
					authority: {
						call: binding.call,
						inspection
					}
				};
			} catch (cause) {
				return {
					available: false,
					failureStage: "artifact",
					reason: `REA Windows native controls are unavailable: ${cause instanceof Error ? cause.message : String(cause)}`
				};
			}
		};
		assertWindowsX64Artifact = (bytes) => {
			if (bytes.length < 64 || bytes.toString("latin1", 0, 2) !== "MZ") throw new Error("Windows native artifact is not a PE image");
			const offset = bytes.readUInt32LE(60);
			if (offset > bytes.length - 26 || bytes.toString("latin1", offset, offset + 4) !== "PE\0\0" || bytes.readUInt16LE(offset + 4) !== 34404 || bytes.readUInt16LE(offset + 24) !== 523) throw new Error("Windows native artifact is not a Windows x64 PE32+ image");
		};
		;
		systemWindowsNativeAuthority = () => {
			if (cached?.available === false && cached.retryable === true) cached = undefined;
			cached ??= loadWindowsNativeAuthority({
				platform: process.platform,
				architecture: process.arch,
				nodeApiVersion: process.versions.napi,
				packageVersion: PACKAGE_METADATA.version,
				readManifest: () => {
					const encoded = readFileSync(new URL("../../native/windows/build/manifest.json", new URL("../windows/WindowsNativeLoader.js", import.meta.url).href), "utf8");
					const value = JSON.parse(encoded);
					return value;
				},
				readArtifact: () => readFileSync(new URL("../../native/windows/build/rea-windows-x64.node", new URL("../windows/WindowsNativeLoader.js", import.meta.url).href)),
				loadArtifact: () => {
					const value = createRequire(new URL("../windows/WindowsNativeLoader.js", import.meta.url).href)(fileURLToPath(new URL("../../native/windows/build/rea-windows-x64.node", new URL("../windows/WindowsNativeLoader.js", import.meta.url).href)));
					return value;
				}
			});
			return cached;
		};
		requireWindowsNativeAuthority = () => {
			const loaded = systemWindowsNativeAuthority();
			if (!loaded.available) throw new Error(loaded.reason);
			return loaded.authority;
		};
	})))();
}

//#endregion
export { windowsFileIdentitySchema as a, init_RuntimeControlUnavailableError as c, systemWindowsNativeAuthority as i, runtimeControlCapabilityError as l, init_WindowsNativeLoader as n, windowsHandleSchema as o, requireWindowsNativeAuthority as r, RuntimeControlUnavailableError as s, WINDOWS_NATIVE_LOAD_REFUSED_REMEDIATION as t };