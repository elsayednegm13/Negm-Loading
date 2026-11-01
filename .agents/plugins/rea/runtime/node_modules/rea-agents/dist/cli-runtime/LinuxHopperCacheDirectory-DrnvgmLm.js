import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_urlComponents, urlDeclaresQueryOrFragment } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { err, init_result, ok } from "./jsonLines-Gf10X4s1.js";
import { homeDirectoryFromEnvironment, init_homeDirectory } from "./homeDirectory-CgrzFhoH.js";
import { z } from "zod";
import { isAbsolute, join } from "node:path";

//#region dist/application/HopperDownload.js
var HOPPER_DOWNLOAD_BYTES, downloadHopperPackage, FETCH_REDIRECT_LIMIT, REDIRECT_STATUSES, fetchHopperResponse;
function init_HopperDownload() {
	return (init_HopperDownload = __esmMin((() => {
		HOPPER_DOWNLOAD_BYTES = 1e8;
		downloadHopperPackage = async (url, options = {}) => {
			const timeoutMs = options.timeoutMs ?? 12e4;
			if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12e4) throw new RangeError("Invalid Hopper response time budget");
			const deadline = AbortSignal.timeout(timeoutMs);
			const maxBytes = options.maxBytes ?? 1e8;
			if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1e8) throw new RangeError("Invalid Hopper response byte budget");
			const response = await fetchHopperResponse(url, options.signal === undefined ? deadline : AbortSignal.any([options.signal, deadline]));
			const refused = {
				ok: false,
				bytes: new Uint8Array()
			};
			if (response === undefined) return refused;
			if (!response.ok || Number(response.headers.get("content-length")) > maxBytes) {
				await response.body?.cancel();
				return refused;
			}
			if (response.body === null) return {
				ok: true,
				bytes: new Uint8Array()
			};
			const reader = response.body.getReader();
			const chunks = [];
			let bytes = 0;
			try {
				while (true) {
					const chunk = await reader.read();
					if (chunk.done) return {
						ok: true,
						bytes: Buffer.concat(chunks, bytes)
					};
					if (chunk.value.byteLength > maxBytes - bytes) {
						await reader.cancel();
						return refused;
					}
					chunks.push(chunk.value);
					bytes += chunk.value.byteLength;
				}
			} finally {
				reader.releaseLock();
			}
		};
		FETCH_REDIRECT_LIMIT = 20;
		REDIRECT_STATUSES = new Set([
			301,
			302,
			303,
			307,
			308
		]);
		fetchHopperResponse = async (url, signal) => {
			let selected;
			try {
				selected = new URL(url);
			} catch {
				return undefined;
			}
			let requested = url;
			for (let redirects = 0;; redirects++) {
				if (selected.protocol !== "https:") return undefined;
				const response = await fetch(requested, {
					redirect: "manual",
					headers: {
						accept: "application/json",
						"user-agent": "rea-installer"
					},
					signal
				});
				if (!REDIRECT_STATUSES.has(response.status)) return response;
				const location = response.headers.get("location");
				await response.body?.cancel();
				if (location === null || redirects === FETCH_REDIRECT_LIMIT) return undefined;
				let next;
				try {
					next = new URL(location, selected);
				} catch {
					return undefined;
				}
				if (!location.includes("#")) next.hash = selected.hash;
				selected = next;
				requested = next.href;
			}
		};
	})))();
}

//#endregion
//#region dist/application/HopperReleaseFeed.js
var HOPPER_RELEASES_URL, HOPPER_PUBLIC_KEY_URL, HOPPER_DOWNLOAD_PREFIX, HOPPER_LINUX_PRIMARY_FINGERPRINT, platforms, suffixes, HopperReleaseError, sha256, releaseSchema, parseLinuxHopperRelease, parseLinuxHopperReleases;
function init_HopperReleaseFeed() {
	return (init_HopperReleaseFeed = __esmMin((() => {
		init_result();
		init_HopperDownload();
		init_urlComponents();
		HOPPER_RELEASES_URL = "https://www.hopperapp.com/include/files-api.php?request=releases&public=true";
		HOPPER_PUBLIC_KEY_URL = "https://www.hopperapp.com/hopper-public-key.asc";
		HOPPER_DOWNLOAD_PREFIX = "https://www.hopperapp.com:443/downloader/public/";
		HOPPER_LINUX_PRIMARY_FINGERPRINT = "7C2D73BAFAF5B9A710A69DA1A26DF815099B1BCD";
		platforms = {
			deb: "Ubuntu / Mint",
			rpm: "Fedora",
			arch: "Arch"
		};
		suffixes = {
			deb: ".deb",
			rpm: ".rpm",
			arch: ".pkg.tar.xz"
		};
		HopperReleaseError = class extends Error {
			reason;
			_tag = "HopperReleaseError";
			constructor(reason, message, options) {
				super(message, options);
				this.reason = reason;
				this.name = this._tag;
			}
		};
		sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
		releaseSchema = z.object({
			version: z.string().min(1),
			filename: z.string().url(),
			file_length: z.string().regex(/^[1-9]\d*$/u).refine((text) => {
				const count = Number(text);
				return Number.isSafeInteger(count) && count <= 1e8;
			}),
			file_hash: z.string().regex(/^[a-f0-9]{40}$/u),
			main_exe_hash: sha256,
			signature: z.string().min(1).refine((text) => Buffer.from(text, "base64").toString("base64") === text),
			public: z.literal("1"),
			beta: z.literal("0")
		}).passthrough();
		parseLinuxHopperRelease = (raw, family) => {
			const parsed = releaseSchema.safeParse(raw);
			if (!parsed.success) return err(new HopperReleaseError("release_metadata", "The Hopper release omitted valid package identity or signature metadata."));
			const url = new URL(parsed.data.filename);
			if (url.origin !== "https://www.hopperapp.com" || url.username !== "" || url.password !== "" || urlDeclaresQueryOrFragment(url) || !url.pathname.startsWith("/downloader/public/Hopper-") || !url.pathname.endsWith(`-Linux-demo${suffixes[family]}`)) return err(new HopperReleaseError("release_metadata", "The Hopper release is outside the official public Linux demo channel."));
			return ok(parsed.data);
		};
		parseLinuxHopperReleases = (raw) => {
			const feed = z.record(z.string(), z.unknown()).safeParse(raw);
			if (!feed.success) return err(new HopperReleaseError("release_metadata", "The Hopper releases response is not an object."));
			return ok({
				deb: parseLinuxHopperRelease(feed.data[platforms.deb], "deb"),
				rpm: parseLinuxHopperRelease(feed.data[platforms.rpm], "rpm"),
				arch: parseLinuxHopperRelease(feed.data[platforms.arch], "arch")
			});
		};
	})))();
}

//#endregion
//#region dist/application/LinuxHopperCacheDirectory.js
var linuxHopperReleaseCacheDirectory;
function init_LinuxHopperCacheDirectory() {
	return (init_LinuxHopperCacheDirectory = __esmMin((() => {
		init_homeDirectory();
		init_result();
		init_HopperReleaseFeed();
		linuxHopperReleaseCacheDirectory = (environment, selectedHome) => {
			try {
				const supplied = environment.XDG_CACHE_HOME || undefined;
				if (supplied !== undefined && !isAbsolute(supplied)) return err(new HopperReleaseError("verification_unavailable", "XDG_CACHE_HOME must be an absolute filesystem path."));
				return ok(join(supplied ?? join(selectedHome ?? homeDirectoryFromEnvironment(environment, "linux"), ".cache"), "rea", "hopper-releases"));
			} catch (cause) {
				return err(new HopperReleaseError("verification_unavailable", "The Hopper release cache location could not be resolved.", { cause }));
			}
		};
	})))();
}

//#endregion
export { HOPPER_DOWNLOAD_BYTES, HOPPER_DOWNLOAD_PREFIX, HOPPER_LINUX_PRIMARY_FINGERPRINT, HOPPER_PUBLIC_KEY_URL, HOPPER_RELEASES_URL, HopperReleaseError, downloadHopperPackage, init_HopperDownload, init_HopperReleaseFeed, init_LinuxHopperCacheDirectory, linuxHopperReleaseCacheDirectory, parseLinuxHopperRelease, parseLinuxHopperReleases };