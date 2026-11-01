import { z } from "zod";
import { err, ok } from "../domain/result.js";
import { HOPPER_DOWNLOAD_BYTES } from "./HopperDownload.js";
import { urlDeclaresQueryOrFragment } from "../domain/urlComponents.js";
/** Vendor endpoints, shared by installation and existing-build inspection. */
export const HOPPER_RELEASES_URL = "https://www.hopperapp.com/include/files-api.php?request=releases&public=true";
export const HOPPER_PUBLIC_KEY_URL = "https://www.hopperapp.com/hopper-public-key.asc";
export const HOPPER_DOWNLOAD_PREFIX = "https://www.hopperapp.com:443/downloader/public/";
/** Stable publisher identity; signing subkeys are admitted through this primary. */
export const HOPPER_LINUX_PRIMARY_FINGERPRINT = "7C2D73BAFAF5B9A710A69DA1A26DF815099B1BCD";
const platforms = {
    deb: "Ubuntu / Mint",
    rpm: "Fedora",
    arch: "Arch",
};
const suffixes = { deb: ".deb", rpm: ".rpm", arch: ".pkg.tar.xz" };
export class HopperReleaseError extends Error {
    reason;
    _tag = "HopperReleaseError";
    constructor(reason, message, options) {
        super(message, options);
        this.reason = reason;
        this.name = this._tag;
    }
}
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
const releaseSchema = z
    .object({
    version: z.string().min(1),
    filename: z.string().url(),
    file_length: z
        .string()
        .regex(/^[1-9]\d*$/u)
        .refine((text) => {
        const count = Number(text);
        return Number.isSafeInteger(count) && count <= HOPPER_DOWNLOAD_BYTES;
    }),
    file_hash: z.string().regex(/^[a-f0-9]{40}$/u),
    main_exe_hash: sha256,
    signature: z
        .string()
        .min(1)
        .refine((text) => Buffer.from(text, "base64").toString("base64") === text),
    public: z.literal("1"),
    beta: z.literal("0"),
})
    .passthrough();
export const parseLinuxHopperRelease = (raw, family) => {
    const parsed = releaseSchema.safeParse(raw);
    if (!parsed.success)
        return err(new HopperReleaseError("release_metadata", "The Hopper release omitted valid package identity or signature metadata."));
    const url = new URL(parsed.data.filename);
    if (url.origin !== "https://www.hopperapp.com" ||
        url.username !== "" ||
        url.password !== "" ||
        urlDeclaresQueryOrFragment(url) ||
        !url.pathname.startsWith("/downloader/public/Hopper-") ||
        !url.pathname.endsWith(`-Linux-demo${suffixes[family]}`))
        return err(new HopperReleaseError("release_metadata", "The Hopper release is outside the official public Linux demo channel."));
    return ok(parsed.data);
};
export const parseLinuxHopperReleases = (raw) => {
    const feed = z.record(z.string(), z.unknown()).safeParse(raw);
    if (!feed.success)
        return err(new HopperReleaseError("release_metadata", "The Hopper releases response is not an object."));
    return ok({
        deb: parseLinuxHopperRelease(feed.data[platforms.deb], "deb"),
        rpm: parseLinuxHopperRelease(feed.data[platforms.rpm], "rpm"),
        arch: parseLinuxHopperRelease(feed.data[platforms.arch], "arch"),
    });
};
