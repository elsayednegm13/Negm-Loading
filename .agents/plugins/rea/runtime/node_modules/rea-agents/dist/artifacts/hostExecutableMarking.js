import { extname } from "node:path";
/** Extensions Windows launches directly through CreateProcess or cmd.exe. */
const windowsLaunchableExtensions = new Set([".bat", ".cmd", ".com", ".exe"]);
/**
 * Whether a host filesystem entry carries the host's executable marking.
 *
 * POSIX hosts mark executability with permission bits. Windows has no execute
 * bit (Node reports file modes from the read-only attribute alone), so it marks
 * launchable files by extension instead.
 */
export const hostExecutableMarking = (path, metadata, platform = process.platform) => platform === "win32"
    ? metadata.isFile() &&
        windowsLaunchableExtensions.has(extname(path).toLowerCase())
    : typeof metadata.mode === "bigint"
        ? (metadata.mode & 73n) !== 0n
        : (metadata.mode & 0o111) !== 0;
