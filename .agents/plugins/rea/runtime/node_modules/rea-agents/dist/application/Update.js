import { gt, valid } from "semver";
import { PRODUCT_IDENTITY } from "../identity.js";
/** Resolve the exact package-manager command for the identified installation and release. */
export const updateInstallCommand = (installation, version) => {
    const release = `${PRODUCT_IDENTITY.packageName}@${version}`;
    const manager = installation.manager;
    switch (manager) {
        case "npm":
            return [
                "npm",
                "install",
                "--global",
                "--ignore-scripts",
                "--prefix",
                installation.prefix,
                release,
            ];
        case "bun":
            // The host pins Bun's global directory and working directory for this command.
            return ["bun", "add", "--global", "--ignore-scripts", release];
        default: {
            const exhaustive = manager;
            throw new TypeError(`Unhandled installation manager: ${String(exhaustive)}`);
        }
    }
};
const versionCheckRemediation = (release) => {
    if (release.ok) {
        return "REA received invalid version metadata. Check the installed version and npm registry, then rerun rea update.";
    }
    const failure = release.error;
    const kind = failure.kind;
    switch (kind) {
        case "unsupported-package-manager":
            return failure.detail;
        case "unavailable":
            return `REA could not resolve the latest release: ${failure.detail}. Retry rea update when registry access is available.`;
        case "invalid-metadata":
            return `REA could not resolve the latest release: ${failure.detail}. Check the npm release metadata, then rerun rea update.`;
        default: {
            const exhaustive = kind;
            throw new TypeError(`Unhandled release lookup failure: ${String(exhaustive)}`);
        }
    }
};
/** Identify, resolve, install, and verify REA without applying setup changes. */
export const runUpdate = async (currentVersion, host, output = "human") => {
    let result;
    let primaryFailure;
    let failed = false;
    try {
        result = await runUpdateWorkflow(currentVersion, host, output);
    }
    catch (cause) {
        failed = true;
        primaryFailure = cause;
    }
    let cleanupFailure;
    try {
        cleanupFailure = await host.close?.();
    }
    catch (cause) {
        cleanupFailure = `Update resource cleanup failed: ${cause instanceof Error ? cause.message : String(cause)}`;
    }
    if (failed) {
        if (cleanupFailure !== undefined)
            throw new AggregateError([primaryFailure, new Error(cleanupFailure)], "Update failed and its resource cleanup remains incomplete.", { cause: primaryFailure });
        throw primaryFailure;
    }
    if (result === undefined)
        throw new Error("Update result was not produced.");
    return cleanupFailure === undefined ? result : { ...result, cleanupFailure };
};
const runUpdateWorkflow = async (currentVersion, host, output) => {
    const installation = await host.installation();
    const release = await host.latestVersion(installation);
    const latestVersion = release.ok ? release.value : null;
    const targetVersion = release.ok ? valid(release.value) : null;
    if (!release.ok || valid(currentVersion) === null || targetVersion === null)
        return {
            status: "failed",
            currentVersion,
            latestVersion,
            reason: "version-check",
            remediation: versionCheckRemediation(release),
        };
    if (!gt(targetVersion, currentVersion))
        return {
            status: "current",
            currentVersion,
            latestVersion: targetVersion,
            installMethod: installation?.manager ?? "unknown",
        };
    if (installation === undefined)
        return {
            status: "failed",
            currentVersion,
            latestVersion: targetVersion,
            reason: "unknown-install-method",
            remediation: "Update this installation with the package manager or source checkout that owns it. For a one-off latest invocation, use npx rea-agents@latest.",
        };
    const installed = await host.installVersion(installation, targetVersion, output);
    if (!installed.ok)
        return {
            status: "failed",
            currentVersion,
            latestVersion: targetVersion,
            reason: "install",
            remediation: `REA could not install ${targetVersion} in ${installation.manager === "npm" ? installation.prefix : installation.globalDirectory}: ${installed.error}. Repair this ${installation.manager} installation, then rerun rea update.`,
        };
    const verified = await host.installedVersion(installation);
    if (!verified.ok || verified.value !== targetVersion)
        return {
            status: "failed",
            currentVersion,
            latestVersion: targetVersion,
            reason: "verification",
            ...(verified.ok ? { installedVersion: verified.value } : {}),
            remediation: `${installation.manager} completed, but REA could not verify ${targetVersion} in ${installation.packageRoot}: ${verified.ok ? `the executable reported ${verified.value}` : verified.error}. The installation may have changed; repair it before retrying.`,
        };
    const maintenance = await host.planMaintenance(installation);
    return {
        status: "updated",
        previousVersion: currentVersion,
        latestVersion: targetVersion,
        installedVersion: verified.value,
        installMethod: installation.manager,
        command: updateInstallCommand(installation, targetVersion),
        maintenance,
        remediation: maintenance.status === "planned"
            ? "REA is updated. Run the maintenance command to review and approve changes to existing REA integrations, then restart affected agents."
            : maintenance.status === "unavailable"
                ? "REA is updated. Integration maintenance could not be planned; inspect the maintenance diagnostic before changing configuration."
                : "REA is updated. Restart agents running this installation to load the new version.",
    };
};
