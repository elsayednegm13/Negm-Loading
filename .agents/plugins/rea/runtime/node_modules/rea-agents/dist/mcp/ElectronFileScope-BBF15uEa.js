import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_analysisErrorBase, t as AnalysisError } from "./analysisErrorBase-BNnZv0cP.js";
import { l as init_asarHeaderAdmission, s as DEFAULT_ASAR_HEADER_ADMISSION } from "./captureDecoderHeap-DoJoGgQ5.js";
import { f as init_analysisErrorCore, i as AnalysisCancelledError } from "./analysisErrorCore-Cl6H9zyu.js";
import { b as init_providerAdapterError, y as ProviderAdapterError } from "./analysisErrorProjection-CbRgJX1L.js";
import { S as ArtifactReaderFailure, T as init_ArtifactReader, n as ArtifactResourceScope, r as init_ArtifactResourceScope } from "./ArtifactResourceScope-B-bNzT_G.js";
import { Gr as admitAsarHeader, Kr as asarHeaderAdmissionFailure, qr as init_AsarHeader } from "./createServer-CoLFsKLA.js";
import { c as bindArtifactFileCleanup, d as withArtifactFileHandle, l as init_ArtifactFileOperation, n as ArtifactFileCleanupFailure, s as assertArtifactReadActive } from "./ArtifactFileOperation-Ccrs3GME.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-DuTTn95O.js";
import { n as init_providerCleanupError, t as ProviderCleanupError } from "./providerCleanupError-PIbKEUeE.js";
import { isAbsolute, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { open, realpath, stat } from "node:fs/promises";

//#region dist/browser/ElectronFileScope.js
var resources, authorizedElectronFile, retryElectronFileCleanup, mapElectronFileAuthorizationFailure, resolveAuthorizedElectronFile, authorizedAsarMember, MAX_CACHED_HEADERS, headerCache, archiveIdentity, asarFiles, isAsarRegularFile, isRecord, throwIfAborted;
function init_ElectronFileScope() {
	return (init_ElectronFileScope = __esmMin((() => {
		init_analysisErrorCore();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_providerAdapterError();
		init_providerCleanupError();
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_ArtifactResourceScope();
		init_AsarHeader();
		init_asarHeaderAdmission();
		resources = new ArtifactResourceScope();
		authorizedElectronFile = async (value, signal, operation = "inspect_electron_page", asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) => {
			try {
				return await resources.run(async () => await resolveAuthorizedElectronFile(value, signal, asarHeaderAdmission));
			} catch (cause) {
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) throw cause;
				if (signal?.aborted === true) throw new AnalysisCancelledError(operation, { cause: signal.reason });
				throw cause;
			}
		};
		retryElectronFileCleanup = async () => await resources.retryCleanup();
		mapElectronFileAuthorizationFailure = (cause, providerId, operation, diagnostics) => {
			if (!(cause instanceof ArtifactReaderFailure) || cause.cleanup === undefined) return undefined;
			const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
			const physicalPrimary = physical?.outcome.kind === "failed" ? physical.outcome.cause : undefined;
			const cancellationReason = physical?.completionCancellation === undefined ? physicalPrimary instanceof ArtifactReaderFailure && physicalPrimary.reason === "cancelled" ? physicalPrimary.cancellation === undefined ? physicalPrimary.cause : physicalPrimary.cancellation.reason : undefined : physical.completionCancellation.reason;
			const hasCancellation = physical?.completionCancellation !== undefined || physicalPrimary instanceof ArtifactReaderFailure && physicalPrimary.reason === "cancelled";
			const primary = hasCancellation ? new AnalysisCancelledError(operation, { cause: cancellationReason }) : physicalPrimary instanceof AnalysisError ? physicalPrimary : physicalPrimary === undefined ? undefined : new ProviderAdapterError(providerId, operation, { cause: physicalPrimary });
			const cleanup = new ProviderCleanupError(providerId, cause.cleanup.resources, { reason: cause.cleanup.reason }, {
				operation,
				cause
			});
			bindArtifactFileCleanup(cause, cleanup);
			if (diagnostics !== undefined) (primary ?? cleanup).retainDiagnostics(diagnostics);
			if (primary === undefined) return cleanup;
			const composed = analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
			bindArtifactFileCleanup(cause, composed);
			return composed;
		};
		resolveAuthorizedElectronFile = async (value, signal, asarHeaderAdmission) => {
			throwIfAborted(signal);
			let url;
			try {
				url = new URL(value);
			} catch (cause) {
				void cause;
				return undefined;
			}
			if (url.protocol !== "file:" || url.hostname !== "" || url.username !== "" || url.password !== "" || /%(?:2f|5c)/iu.test(url.pathname)) return undefined;
			let path;
			try {
				path = fileURLToPath(url);
			} catch (cause) {
				void cause;
				return undefined;
			}
			if (!isAbsolute(path) || path.includes("\0")) return undefined;
			try {
				const metadata = await stat(path);
				throwIfAborted(signal);
				if (metadata.isFile()) {
					const canonical = await realpath(path);
					throwIfAborted(signal);
					return canonical;
				}
			} catch (cause) {
				throwIfAborted(signal);
				void cause;
			}
			throwIfAborted(signal);
			return await authorizedAsarMember(path, signal, asarHeaderAdmission);
		};
		authorizedAsarMember = async (path, signal, asarHeaderAdmission) => {
			const segments = path.split(sep);
			for (let index = 1; index < segments.length - 1; index += 1) {
				throwIfAborted(signal);
				if (!(segments[index] ?? "").toLowerCase().endsWith(".asar")) continue;
				const archive = segments.slice(0, index + 1).join(sep);
				const member = segments.slice(index + 1);
				if (member.some((part) => part === "" || part === "." || part === "..")) return undefined;
				try {
					const metadata = await stat(archive);
					throwIfAborted(signal);
					if (!metadata.isFile()) continue;
					const canonical = await realpath(archive);
					throwIfAborted(signal);
					const files = await asarFiles(canonical, metadata, asarHeaderAdmission, signal, resources);
					throwIfAborted(signal);
					return isAsarRegularFile(files, member) ? join(canonical, ...member) : undefined;
				} catch (cause) {
					if (cause instanceof ArtifactFileCleanupFailure) throw cause;
					if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) throw cause;
					throwIfAborted(signal);
					void cause;
					return undefined;
				}
			}
			return undefined;
		};
		MAX_CACHED_HEADERS = 8;
		headerCache = new Map();
		archiveIdentity = (metadata) => `${String(metadata.dev)}:${String(metadata.ino)}:${String(metadata.size)}:${String(metadata.mtimeMs)}`;
		asarFiles = async (archive, metadata, admission, signal, resources) => {
			throwIfAborted(signal);
			const identity = archiveIdentity(metadata);
			const cached = headerCache.get(archive);
			if (cached?.identity === identity) {
				if (cached.headerBytes > admission.maximumBytes) throw asarHeaderAdmissionFailure(admission, cached.headerBytes);
				return cached.files;
			}
			const handle = await open(archive, "r");
			const admitted = await withArtifactFileHandle(archive, handle, resources, signal, async (file) => {
				let jsonBytes;
				let headerBytes;
				throwIfAborted(signal);
				const opened = await file.stat();
				throwIfAborted(signal);
				if (!opened.isFile() || archiveIdentity(opened) !== identity) throw new Error("ASAR identity changed before header read");
				const header = await admitAsarHeader(file, signal, admission);
				throwIfAborted(signal);
				jsonBytes = header.jsonBytes;
				headerBytes = header.headerBytes;
				const json = Buffer.alloc(jsonBytes);
				let offset = 0;
				while (offset < json.length) {
					throwIfAborted(signal);
					const part = await file.read(json, offset, json.length - offset, 16 + offset);
					throwIfAborted(signal);
					if (part.bytesRead === 0) throw new Error("Truncated ASAR JSON header");
					offset += part.bytesRead;
				}
				const afterRead = await file.stat();
				throwIfAborted(signal);
				if (archiveIdentity(afterRead) !== identity) throw new Error("ASAR identity changed during header read");
				const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(json));
				if (!isRecord(parsed) || !isRecord(parsed.files)) throw new Error("ASAR header has no file tree");
				return {
					files: parsed.files,
					jsonBytes,
					headerBytes
				};
			});
			throwIfAborted(signal);
			headerCache.delete(archive);
			headerCache.set(archive, {
				identity,
				files: admitted.files,
				bytes: admitted.jsonBytes,
				headerBytes: admitted.headerBytes
			});
			const retainedBytes = () => [...headerCache.values()].reduce((sum, entry) => sum + entry.bytes, 0);
			while (headerCache.size > MAX_CACHED_HEADERS || retainedBytes() > admission.maximumBytes) headerCache.delete(headerCache.keys().next().value ?? archive);
			return admitted.files;
		};
		isAsarRegularFile = (files, member) => {
			let node = { files };
			for (const part of member) {
				const children = isRecord(node) ? node.files : undefined;
				if (!isRecord(children) || !Object.hasOwn(children, part)) return false;
				node = children[part];
			}
			return isRecord(node) && typeof node.size === "number" && !("files" in node) && !("link" in node);
		};
		isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		throwIfAborted = (signal) => {
			assertArtifactReadActive(signal);
		};
	})))();
}

//#endregion
export { retryElectronFileCleanup as i, init_ElectronFileScope as n, mapElectronFileAuthorizationFailure as r, authorizedElectronFile as t };