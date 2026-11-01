import { AnalysisCancelledError, AnalysisResourceConstraintError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { isAbsolute } from "node:path";
import { execFileOutput, execFileFailureCapturedOutput, ExecFileOutputCancelledError, execFileOutputFailure, } from "../process/ExecFileOutput.js";
import { fixedAllowanceOptions } from "../domain/fixedAllowanceRemediation.js";
/** Environment key selecting the caller's adb binary. */
export const ADB_BINARY_ENV = "REA_ADB_PATH";
const VERSION_TIMEOUT_MS = 10_000;
const VERSION_MAX_OUTPUT_BYTES = 64 * 1024;
/**
 * Resolve the caller-supplied adb binary. `REA_ADB_PATH` must be absolute so
 * the selection stays explicit; without it, adb is resolved from `PATH` by
 * the platform exec at run time, like any bring-your-own tool.
 */
export const resolveAdbBinary = (environment) => {
    const configured = environment[ADB_BINARY_ENV];
    if (configured === undefined || configured.trim() === "")
        return { binary: "adb", pathSource: "path" };
    if (!isAbsolute(configured))
        throw new AdbConfigurationFailure("not_absolute", `${ADB_BINARY_ENV} must be an absolute path to the adb binary`, { configured_path: configured });
    return { binary: configured, pathSource: "environment" };
};
export class AdbConfigurationFailure extends Error {
    code;
    diagnostics;
    constructor(code, message, diagnostics = {}, options) {
        super(message, options);
        this.code = code;
        this.diagnostics = diagnostics;
    }
}
/**
 * Parse `adb version` output. The first line carries the protocol version,
 * `Version ` the build version (no colon), and `Installed as` the binary path.
 */
export const parseAdbVersionOutput = (stdout) => {
    const build = /^Version\s+(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\s*$/mu.exec(stdout);
    const installed = /^Installed as\s+(.+)$/mu.exec(stdout);
    return {
        version: build === null ? null : build[1].trim(),
        installedPath: installed === null ? null : installed[1].trim(),
    };
};
/**
 * Probe the selected adb binary without contacting devices. `adb version`
 * never starts the adb server, so this stays a pure client check.
 */
export const inspectAdbClient = async (selection, signal) => {
    try {
        const { stdout, stderr } = await execFileOutput(selection.binary, ["version"], {
            timeout: VERSION_TIMEOUT_MS,
            stopSignal: "SIGTERM",
            maxBuffer: VERSION_MAX_OUTPUT_BYTES,
            ...(signal === undefined ? {} : { signal }),
        });
        const identity = parseAdbVersionOutput(stdout);
        const hasRecognizedProtocolVersion = /^Android Debug Bridge version\s+\d+\.\d+\.\d+\s*$/mu.test(stdout);
        if (identity.version === null && !hasRecognizedProtocolVersion)
            throw new AdbConfigurationFailure("version_unresolved", "The selected adb binary exited successfully but did not report a recognizable protocol or build version", {
                selected_binary: selection.binary,
                path_source: selection.pathSource,
                version_probe: "unrecognized_output",
                stdout,
                stderr,
            });
        return identity;
    }
    catch (cause) {
        if (cause instanceof AdbConfigurationFailure)
            throw cause;
        const failure = execFileOutputFailure(cause);
        if (cause instanceof ExecFileOutputCancelledError)
            throw new AnalysisCancelledError("inspect_adb_client", {
                cause: cause.cause,
                ...(failure === undefined
                    ? {}
                    : { capturedOutput: execFileFailureCapturedOutput(failure) }),
            });
        const diagnostics = {
            selected_binary: selection.binary,
            path_source: selection.pathSource,
            ...(failure === undefined ? {} : { exit_code: failure.code }),
        };
        const options = {
            cause,
            diagnostics,
            ...(failure === undefined
                ? {}
                : { capturedOutput: execFileFailureCapturedOutput(failure) }),
        };
        if (failure?.outputTruncated === true) {
            throw new AnalysisResourceConstraintError("inspect_adb_client", "memory", `adb version output exceeded the ${String(VERSION_MAX_OUTPUT_BYTES)}-byte capture budget`, { max_output_bytes: VERSION_MAX_OUTPUT_BYTES }, {
                ...options,
                ...fixedAllowanceOptions(`The adb version-output capture allowance of ${String(VERSION_MAX_OUTPUT_BYTES)} bytes (this release has no runtime override)`, "capture"),
            });
        }
        if (failure?.code === "ETIMEDOUT")
            throw new AnalysisTimeoutError("inspect_adb_client", VERSION_TIMEOUT_MS, {
                ...options,
                userMessage: `adb version probe reached its ${String(VERSION_TIMEOUT_MS)} ms deadline (deadlineExpired). This release has no runtime override.`,
                remediationAction: `This ${String(VERSION_TIMEOUT_MS)} ms adb version probe has no runtime override. Allow execution, cleanup and delivery headroom in the outer MCP client deadline. Confirm outstanding work and cleanup before retrying.`,
            });
        if (failure?.code === "ENOENT")
            throw new AdbConfigurationFailure("binary_missing", `The selected adb binary was not found: ${selection.binary}`, {
                selected_binary: selection.binary,
                path_source: selection.pathSource,
                remediation: `Set ${ADB_BINARY_ENV} to an absolute path to an existing adb binary`,
            }, { cause });
        if (failure?.code === "EACCES" || failure?.code === "EPERM")
            throw new AdbConfigurationFailure("binary_not_executable", `Execution of the selected adb binary was denied (${failure.code}): ${selection.binary}`, {
                selected_binary: selection.binary,
                path_source: selection.pathSource,
                filesystem_error: failure.code,
                remediation: `Check file type and execute permission for ${ADB_BINARY_ENV} or select an executable adb binary`,
            }, { cause });
        throw new AdbConfigurationFailure("version_unresolved", "The selected adb binary did not report a usable version", {
            selected_binary: selection.binary,
            ...(failure === undefined
                ? {}
                : {
                    exit_code: failure.code,
                    stderr_excerpt: failure.stderr.slice(0, 512),
                }),
        }, { cause });
    }
};
/** Availability in the shape shared by every provider. */
const rejectionCodeOf = (code) => code === "binary_missing"
    ? "executable_missing"
    : code === "not_absolute" || code === "binary_not_executable"
        ? "not_configured"
        : "version_unresolved";
export const adbConfigurationAvailability = (cause) => ({
    status: "unavailable",
    code: rejectionCodeOf(cause.code),
    reason: cause.message,
    diagnostics: { ...cause.diagnostics },
});
