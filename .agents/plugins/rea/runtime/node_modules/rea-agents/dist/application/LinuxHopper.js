import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { execFileBoundedOutput } from "../process/ExecFileBoundedOutput.js";
import { execFileOutput } from "../process/ExecFileOutput.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { downloadHopperPackage } from "./HopperDownload.js";
import { inspectLinuxHopperPythonRuntime, linuxHopperPythonUnavailable, LinuxHopperPythonError, } from "./LinuxHopperPython.js";
import { RegularFileCleanupFailure } from "../filesystem/OwnedRegularFile.js";
import { err } from "../domain/result.js";
import { HOPPER_RELEASES_URL, HOPPER_PUBLIC_KEY_URL, HOPPER_DOWNLOAD_PREFIX, HOPPER_LINUX_PRIMARY_FINGERPRINT, HopperReleaseError, } from "./HopperReleaseFeed.js";
import { LinuxHopperPublisher, retryLinuxHopperPublisherCleanup, } from "./LinuxHopperPublisher.js";
/** Package-manager output retained per stream without stopping the command. */
const PACKAGE_MANAGER_OUTPUT_BYTES = 64 * 1024;
/**
 * The only host architecture the published Linux packages declare: `dpkg-deb`
 * reports `Architecture: amd64`, the RPM lead is `x86_64`, and `.PKGINFO` has
 * `arch = x86_64`.
 */
const SUPPORTED_RELEASE_ARCHITECTURE = "x64";
/** Hosts the automated Linux Hopper installer supports, for remediation text. */
export const LINUX_HOPPER_SETUP_HOSTS = "an x86_64 host running Ubuntu 24.04+, Fedora 41+, Nobara 44+, Arch Linux, CachyOS, or Omarchy";
/** Describe the release and package-manager commands without downloading or writing. */
export const linuxHopperInstallDisclosure = (family, isRoot) => {
    return {
        networkOrigins: [
            HOPPER_RELEASES_URL,
            HOPPER_PUBLIC_KEY_URL,
            HOPPER_DOWNLOAD_PREFIX,
        ],
        integrity: `Detached PGP signature · primary ${HOPPER_LINUX_PRIMARY_FINGERPRINT} · package byte identity and installed launcher SHA-256 from the official feed`,
        commands: [
            ...linuxPackageManagerCommands(family, `<verified-hopper.${family}>`, isRoot),
            ...(family === "deb"
                ? [
                    debianPythonLibraryCommand("<libpython matching /usr/bin/python3, if not loadable>", isRoot),
                ]
                : []),
        ].map(({ executable, args }) => formatCommandForDisplay(executable, args)),
    };
};
/**
 * Whether REA's analysis providers run on this distribution. A recognized
 * package family means a glibc host with a known package layout, which is what
 * the providers need; downloading and installing the official Hopper package
 * additionally requires a distribution on its tested list.
 */
export const supportsReaHost = (distribution) => distribution?.packageFamily !== undefined;
const operationFailure = (operation, cause, path) => {
    const code = cause instanceof Error ? Reflect.get(cause, "code") : undefined;
    return {
        operation,
        detail: cause instanceof Error ? cause.message : String(cause),
        ...(path === undefined ? {} : { path }),
        ...(typeof code === "string" ? { systemCode: code } : {}),
    };
};
/** Own failed temporary cleanup until a later retry succeeds. */
export class LinuxHopperTemporaryCleanupOwner {
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
            }
            catch (cause) {
                const reason = cause instanceof Error ? cause.message : String(cause);
                failures.push(`Linux Hopper temporary cleanup failed for ${path}: ${reason}`);
            }
        }
        return failures.length === 0
            ? undefined
            : {
                reason: failures.join("; "),
                resources: [...this.pending.keys()],
            };
    }
}
/**
 * Parse an os-release document without executing its shell syntax, and
 * classify automated Hopper setup for the host architecture.
 */
export const parseLinuxDistribution = (text, architecture) => {
    const fields = new Map();
    for (const line of text.split("\n")) {
        const match = /^([A-Z_]+)=(.*)$/u.exec(line.trim());
        if (match === null)
            continue;
        const key = match[1];
        const encoded = match[2];
        if (key === undefined || encoded === undefined)
            continue;
        const quote = encoded[0];
        const quoted = (quote === "'" || quote === '"') && encoded.endsWith(quote);
        const value = !quoted
            ? encoded
            : quote === "'"
                ? encoded.slice(1, -1)
                : encoded.slice(1, -1).replace(/\\(["\\$`])/gu, "$1");
        fields.set(key, value);
    }
    const id = (fields.get("ID") ?? "unknown").toLowerCase();
    const versionId = fields.get("VERSION_ID");
    const packageFamily = packageFamilyFor(id, fields.get("ID_LIKE"));
    const hopperSetupSupported = packageFamily !== undefined &&
        architecture === SUPPORTED_RELEASE_ARCHITECTURE &&
        (id === "arch" ||
            id === "cachyos" ||
            (id === "omarchy" && packageFamily === "arch") ||
            (id === "ubuntu" && versionAtLeast(versionId, 24)) ||
            (id === "fedora" && versionAtLeast(versionId, 41)) ||
            (id === "nobara" && versionAtLeast(versionId, 44)));
    const identity = {
        id,
        ...(versionId === undefined ? {} : { versionId }),
    };
    return hopperSetupSupported
        ? { ...identity, packageFamily, hopperSetupSupported: true }
        : { ...identity, packageFamily, hopperSetupSupported: false };
};
/** Read and classify the current Linux distribution on a host architecture. */
export const readLinuxDistribution = async (architecture) => {
    try {
        return parseLinuxDistribution(await readFile("/etc/os-release", "utf8"), architecture);
    }
    catch (cause) {
        // best-effort cleanup: optional host probing; unknown distribution means unsupported.
        void cause;
        return undefined;
    }
};
/** Download, verify, install, and read back the official Hopper Linux package. */
export const installLinuxHopper = async (host, options = {}) => {
    if (isAborted(options.signal))
        return cancelledInstall(options.signal?.reason);
    const distribution = await host.distribution();
    if (distribution?.hopperSetupSupported !== true)
        return { status: "failed", reason: "unsupported_host" };
    let temporary;
    let result;
    let stage = "release_metadata";
    let operationPath;
    try {
        result = await (async () => {
            const selected = await host.release(distribution.packageFamily, options.signal);
            if (!selected.ok)
                return {
                    status: "failed",
                    verificationFailure: selected.error,
                    reason: selected.error.reason === "cancelled"
                        ? "cancelled"
                        : "release_metadata",
                };
            const release = selected.value;
            stage = "download";
            const archiveDownload = await host.download(release.filename, options);
            if (!archiveDownload.ok)
                return { status: "failed", reason: "download" };
            stage = "archive_write";
            temporary = await host.createTemporaryDirectory();
            // Linux package paths stay POSIX even when this host is exercised from
            // a non-Linux test process.
            const archive = posix.join(temporary, `hopper.${distribution.packageFamily}`);
            operationPath = archive;
            await host.writeArchive(archive, archiveDownload.bytes);
            stage = "publisher_verification_failed";
            const verified = await host.verifyArchive(distribution.packageFamily, release, archive, options.signal);
            if (!verified.ok)
                return {
                    status: "failed",
                    verificationFailure: verified.error,
                    reason: verified.error.reason === "cache_missing"
                        ? "verification_unavailable"
                        : verified.error.reason,
                };
            const retained = await host.retainVerifiedArchive(verified.value, archive, options.signal);
            if (!retained.ok)
                return {
                    status: "failed",
                    verificationFailure: retained.error,
                    reason: retained.error.reason === "cache_missing"
                        ? "verification_unavailable"
                        : retained.error.reason,
                };
            if (isAborted(options.signal))
                return cancelledInstall(options.signal?.reason);
            stage = "authorization_or_package_manager";
            const install = await host.installPackage(distribution.packageFamily, archive, options);
            if (install.status === "cancelled")
                return cancelledInstall(install.cause);
            if (install.status === "failed")
                return {
                    status: "failed",
                    reason: "authorization_or_package_manager",
                    packageFailure: install.failure,
                };
            if (install.status === "runtime_unavailable")
                return {
                    status: "failed",
                    reason: "runtime_dependencies",
                    pythonRuntimeFailure: install.failure,
                };
            stage = "launcher_inspection";
            const launcherPath = "/opt/hopper/bin/Hopper";
            operationPath = launcherPath;
            const launcherStatus = await host.launcherStatus(launcherPath, release.main_exe_hash);
            if (typeof launcherStatus !== "string")
                return {
                    status: "failed",
                    reason: "launcher_inspection",
                    operationFailure: launcherStatus,
                };
            if (launcherStatus !== "ready")
                return {
                    status: "failed",
                    reason: launcherStatus === "missing" ? "launcher_missing" : launcherStatus,
                };
            return { status: "installed", launcherPath };
        })();
    }
    catch (cause) {
        result = {
            status: "failed",
            reason: isAborted(options.signal) || isAbortCause(cause) ? "cancelled" : stage,
            operationFailure: operationFailure(stage, cause, operationPath),
        };
    }
    if (result.status === "failed" &&
        result.reason === "cancelled" &&
        isAborted(options.signal))
        result = { ...result, cancellationReason: options.signal?.reason };
    if (temporary === undefined)
        return result;
    try {
        await host.cleanup(temporary);
        return result;
    }
    catch (cause) {
        return {
            ...result,
            cleanupFailure: {
                path: temporary,
                reason: cause instanceof Error ? cause.message : String(cause),
            },
        };
    }
};
/** Canonical launcher path for a legacy user-local Linux Hopper installation. */
export const linuxHopperLauncherPath = (home) => posix.join(home, ".local/share/rea/hopper/bin/Hopper");
/** REA's managed Linux install path, preferred when no explicit launcher is set. */
export const REA_MANAGED_LINUX_HOPPER_LAUNCHER = "/opt/hopper/bin/Hopper";
/** Other system-wide Hopper paths used by package installations. */
const systemLinuxHopperLauncherCandidates = [
    "/opt/hopper-v4/bin/hopper",
    "/usr/bin/hopper",
];
/** Probe REA-managed and user-local installs before arbitrary system builds. */
export const linuxHopperLauncherCandidates = (home) => [
    REA_MANAGED_LINUX_HOPPER_LAUNCHER,
    linuxHopperLauncherPath(home),
    ...systemLinuxHopperLauncherCandidates,
];
/**
 * Compose package-manager and linker checks from the selected caller
 * environment. The distribution comes from the caller's host-fact owner, so
 * installation follows the same architecture classification as the plan.
 */
export const systemLinuxHopperInstallHost = (environment, distribution) => {
    const publisher = systemLinuxHopperPublisher(environment);
    return {
        distribution,
        release: (family, signal) => publisher.currentRelease(family, signal),
        download: downloadHopperPackage,
        createTemporaryDirectory: () => mkdtemp(join(tmpdir(), "rea-hopper-")),
        writeArchive: (path, bytes) => writeFile(path, bytes, { mode: 0o600 }),
        installPackage: (family, archive, options) => installSystemPackage(family, archive, environment, options?.signal),
        verifyArchive: (family, release, archive, signal) => publisher.verifyArchive(family, release, archive, signal),
        retainVerifiedArchive: (verified, archive, signal) => publisher.retainVerifiedArchive(verified, archive, signal),
        async launcherStatus(path, expectedSha256) {
            let operation = "access";
            try {
                await access(path);
                operation = "dependencies";
                const linked = await execFileOutput("ldd", [path], {
                    env: environment,
                });
                if (!linuxSharedLibrariesAvailable(`${linked.stdout}\n${linked.stderr}`))
                    return "runtime_dependencies";
                operation = "hash";
                return (await publisher.hashLauncher(path)) === expectedSha256
                    ? "ready"
                    : "unsupported_hopper_build";
            }
            catch (cause) {
                if (cause instanceof RegularFileCleanupFailure ||
                    (cause instanceof HopperReleaseError &&
                        cause.reason === "cleanup_failed") ||
                    (cause instanceof ArtifactReaderFailure &&
                        cause.cleanup !== undefined))
                    return "cleanup_failed";
                if (operation === "access" &&
                    cause instanceof Error &&
                    "code" in cause &&
                    cause.code === "ENOENT")
                    return "missing";
                return {
                    status: "inspection_failed",
                    ...operationFailure(operation, cause, path),
                    operation,
                    path,
                };
            }
        },
        cleanup: (path) => rm(path, { recursive: true, force: true }),
        close: () => closePublisherAndRetainedScopes(publisher),
    };
};
export const systemLinuxHopperPublisher = (environment) => new LinuxHopperPublisher(environment, 
// Only the package family is read here; it does not depend on the
// architecture that gates automated setup.
async () => (await readLinuxDistribution(process.arch))?.packageFamily);
/** Read-only authentication; persistent package retention belongs to approved setup. */
export const inspectLinuxHopperLauncher = async (path, environment, signal) => {
    const publisher = systemLinuxHopperPublisher(environment);
    const result = await publisher.inspectLauncher(path, signal);
    try {
        await closePublisherAndRetainedScopes(publisher);
        return result;
    }
    catch (cause) {
        return err(new HopperReleaseError("cleanup_failed", "Hopper publisher verification retains incomplete cleanup.", {
            cause: new AggregateError(result.ok ? [cause] : [result.error, cause], "Publisher verification outcomes"),
        }));
    }
};
/** The publisher retains a failed close before throwing; retry every retained owner. */
const closePublisherAndRetainedScopes = async (publisher) => {
    try {
        await publisher.close();
    }
    catch {
        // The following producer-owned drain includes this scope and earlier ones.
        // Its result reports the resources still unresolved after every attempt.
    }
    await retryLinuxHopperPublisherCleanup();
};
/** Interpret ldd output conservatively so a present but broken launcher is unhealthy. */
export const linuxSharedLibrariesAvailable = (output) => !/(?:=>\s+not found|error while loading shared libraries)/iu.test(output);
const installSystemPackage = async (family, archive, environment, signal) => {
    const cancelled = () => ({
        status: "cancelled",
        cause: signal?.reason,
    });
    const isRoot = process.getuid?.() === 0;
    for (const command of linuxPackageManagerCommands(family, archive, isRoot)) {
        if (isAborted(signal))
            return cancelled();
        // Let a running package transaction settle; do not start another after
        // the caller cancels. Interrupting dpkg can leave configured state partial.
        const result = await runPackageManagerCommand(command, environment);
        if (result.status === "failed")
            return result;
    }
    if (isAborted(signal))
        return cancelled();
    if (family !== "deb")
        return { status: "installed" };
    // Ubuntu splits the executable/stdlib from the embedding library. Resolve
    // the installed distribution interpreter only after python3 is configured.
    const python = await inspectLinuxHopperPythonRuntime(environment, signal);
    if (isAborted(signal))
        return cancelled();
    if (!python.ok)
        return pythonInspectionFailure(python.error);
    if (python.value.library.status === "loadable")
        return { status: "installed" };
    if (python.value.library.status === "unknown")
        return {
            status: "runtime_unavailable",
            failure: linuxHopperPythonUnavailable(python.value.library),
        };
    const packageName = "libpython" + python.value.version.join(".");
    const libraryPath = python.value.library.path;
    // Only the standard Ubuntu shared ABI/layout establishes this APT mapping.
    // Preserve alternate prefixes/SONAMEs as unknown instead of guessing a package.
    if (posix.basename(libraryPath) !== packageName + ".so.1.0" ||
        !/^\/usr\/lib\/[a-z0-9_]+-linux-gnu[a-z0-9_]*$/u.test(posix.dirname(libraryPath)))
        return {
            status: "runtime_unavailable",
            failure: new LinuxHopperPythonError("configuration_unknown", "Cannot determine the matching APT runtime package for " +
                libraryPath +
                ". Repair this interpreter's shared runtime before retrying."),
        };
    if (isAborted(signal))
        return cancelled();
    const installed = await runPackageManagerCommand(debianPythonLibraryCommand(packageName, isRoot), environment);
    if (installed.status === "failed")
        return installed;
    if (isAborted(signal))
        return cancelled();
    // A successful APT exit is not proof that the selected runtime can load.
    const verified = await inspectLinuxHopperPythonRuntime(environment, signal);
    if (isAborted(signal))
        return cancelled();
    if (!verified.ok)
        return pythonInspectionFailure(verified.error);
    if (verified.value.library.status !== "loadable")
        return {
            status: "runtime_unavailable",
            failure: linuxHopperPythonUnavailable(verified.value.library),
        };
    return { status: "installed" };
};
const isAborted = (signal) => signal?.aborted === true;
const cancelledInstall = (cause) => ({
    status: "failed",
    reason: "cancelled",
    cancellationReason: cause,
});
const pythonInspectionFailure = (failure) => failure.reason === "cancelled"
    ? { status: "cancelled", cause: failure.cause }
    : { status: "runtime_unavailable", failure };
const withPackagePrivilege = (executable, args, isRoot) => isRoot
    ? { executable, args }
    : { executable: "pkexec", args: [executable, ...args] };
const debianPythonLibraryCommand = (packageName, isRoot) => withPackagePrivilege("apt-get", ["install", "-y", packageName], isRoot);
const runPackageManagerCommand = async (command, environment) => {
    const output = await execFileBoundedOutput(command.executable, command.args, {
        env: environment,
        limit: PACKAGE_MANAGER_OUTPUT_BYTES,
    });
    return output.exitCode === 0
        ? { status: "installed" }
        : {
            status: "failed",
            failure: {
                command: formatCommandForDisplay(command.executable, command.args),
                exitCode: output.exitCode,
                // Preserve the separately captured streams and truncation marker.
                stdout: output.stdout,
                stderr: output.stderr,
                outputTruncated: output.outputTruncated,
            },
        };
};
/** Preserve argument boundaries in a command shown to the user. */
export const formatCommandForDisplay = (executable, args) => [executable, ...args]
    .map((part) => /^[A-Za-z0-9_./:@%+=,-]+$/u.test(part) ? part : JSON.stringify(part))
    .join(" ");
/** Select the native package manager and authorization boundary without shell evaluation. */
export const linuxPackageManagerCommands = (family, archive, isRoot) => {
    const runtimeDependencies = family === "deb"
        ? ["xvfb", "xauth", "python3", "libx11-6", "libxtst6"]
        : family === "rpm"
            ? [
                "xorg-x11-server-Xvfb",
                "xorg-x11-xauth",
                "python3",
                "libX11",
                "libXtst",
            ]
            : ["xorg-server-xvfb", "xorg-xauth", "python", "libx11", "libxtst"];
    const commands = family === "deb"
        ? [
            // apt-get install upgrades listed packages that are already
            // installed, so dependencies are not named as upgrade targets.
            ["apt-get", "install", "-y", "--no-upgrade", ...runtimeDependencies],
            ["apt-get", "install", "-y", archive],
        ]
        : family === "rpm"
            ? [["dnf", "install", "-y", archive, ...runtimeDependencies]]
            : [
                ["pacman", "-S", "--needed", "--noconfirm", ...runtimeDependencies],
                ["pacman", "-U", "--noconfirm", archive],
            ];
    return commands.map((command) => {
        const executable = command[0];
        if (executable === undefined)
            throw new Error("package command is empty");
        return withPackagePrivilege(executable, command.slice(1), isRoot);
    });
};
const packageFamilyFor = (id, idLike) => {
    const identities = new Set([
        id,
        ...(idLike?.toLowerCase().split(/\s+/u) ?? []),
    ]);
    if (identities.has("ubuntu") || identities.has("debian"))
        return "deb";
    if (identities.has("fedora") || identities.has("rhel"))
        return "rpm";
    if (identities.has("arch"))
        return "arch";
    return undefined;
};
const versionAtLeast = (version, minimum) => version !== undefined &&
    Number.parseInt(version.split(".")[0] ?? "0", 10) >= minimum;
const isAbortCause = (cause) => cause instanceof Error && cause.name === "AbortError";
