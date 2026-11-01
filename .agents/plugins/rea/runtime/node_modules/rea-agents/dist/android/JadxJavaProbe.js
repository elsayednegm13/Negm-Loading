import { randomUUID } from "node:crypto";
import { AnalysisError, } from "../domain/analysisErrorBase.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisTimeoutError, } from "../domain/analysisErrorCore.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { err, ok } from "../domain/result.js";
import { prepareOwnedCommand, runOwnedCommand, OwnedCommandFailure, } from "../process/OwnedCommand.js";
import { DarwinProcessOwnershipInspectionError } from "../process/DarwinProcessRunTokenReader.js";
import { retainOwnedCommandCleanup } from "../providers/OwnedCommandCleanup.js";
import { analysisClientFailureForOperation } from "../providers/AnalysisClientFailure.js";
import { jadxOperationTimeoutGuidance } from "./JadxOperationTimeout.js";
const JAVA_MODULE_LISTING_TIMEOUT_MS = 10_000;
const JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES = 1024 * 1024;
const refusal = (code, message, diagnostics, kind) => err({ code, message, diagnostics, kind });
const capturedOutput = (snapshot) => ({
    stdout: snapshot.stdout.text,
    stderr: snapshot.stderr.text,
    stdout_bytes: snapshot.stdout.observedBytes,
    stderr_bytes: snapshot.stderr.observedBytes,
    truncated: snapshot.diagnosticTruncated === true || snapshot.outputIncomplete === true,
    exit_code: snapshot.exitCode ?? null,
    signal: snapshot.signal ?? null,
});
const projectRefusal = (failure, operation, cause, output) => {
    const { stdout: _stdout, stderr: _stderr, ...facts } = failure.diagnostics;
    return new AnalysisCapabilityUnavailableError("jadx", operation, failure.message, {
        cause,
        userMessage: failure.message,
        diagnostics: {
            ...facts,
            failure_kind: failure.kind,
            failure_code: failure.code,
        },
        ...(output === undefined ? {} : { capturedOutput: output }),
    });
};
/** Interpret one complete module listing before joining final cleanup. */
export const inspectJadxJava = async (java, environment, options) => {
    const operation = options.operation ?? "inspect_jadx_configuration";
    try {
        return await options.resourceOwner.run(async () => {
            let observed;
            try {
                await prepareOwnedCommand(options.signal);
                await runOwnedCommand({
                    command: java,
                    arguments: ["--list-modules"],
                    runId: randomUUID(),
                    expectedCommand: null,
                    hostEnvironment: environment,
                    sweepTokenOwnedProcesses: true,
                }, {
                    timeoutMs: options.timeoutMs ?? JAVA_MODULE_LISTING_TIMEOUT_MS,
                    diagnosticBytes: JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES,
                    acceptNonZeroExit: true,
                    observeCompleted: (snapshot) => {
                        observed = parseJavaModules(java, snapshot);
                    },
                }, {
                    signal: options.signal,
                    ...(options.launcher === undefined
                        ? {}
                        : { launcher: options.launcher }),
                });
                if (observed === undefined)
                    throw new Error("Java probe completed without an observation");
                return observed;
            }
            catch (cause) {
                const command = cause instanceof OwnedCommandFailure ? cause : undefined;
                const preparation = command?.preparationFailure ??
                    (cause instanceof DarwinProcessOwnershipInspectionError
                        ? cause
                        : undefined);
                const output = command?.snapshot == null
                    ? preparation?.capturedOutput
                    : capturedOutput(command.snapshot);
                const cleanups = retainOwnedCommandCleanup(cause, options.resourceOwner, "jadx", operation);
                let primary;
                if (observed !== undefined && !observed.ok) {
                    if (cleanups.length === 0)
                        return observed;
                    primary = projectRefusal(observed.error, operation, cause, output);
                }
                else if (command?.reason === "cancelled" &&
                    command.cancellation !== undefined) {
                    const reason = command.cancellation.reason;
                    const errorOptions = {
                        cause: reason,
                        ...(output === undefined ? {} : { capturedOutput: output }),
                        ...(observed?.ok === true
                            ? {
                                diagnostics: {
                                    java_module_observation: {
                                        compiler: observed.value.compiler,
                                        major: observed.value.major,
                                    },
                                },
                            }
                            : {}),
                    };
                    primary =
                        options.operationDeadline?.signal.aborted === true &&
                            reason === options.operationDeadline.signal.reason
                            ? new AnalysisTimeoutError(operation, options.operationDeadline.timeoutMs, {
                                ...errorOptions,
                                ...jadxOperationTimeoutGuidance(options.operationDeadline.timeoutMs),
                            })
                            : new AnalysisCancelledError(operation, errorOptions);
                }
                else if (observed?.ok === true &&
                    command?.cleanupOwner !== undefined) {
                    primary = new ProviderAdapterError("jadx", operation, {
                        cause,
                        ...(output === undefined ? {} : { capturedOutput: output }),
                        diagnostics: {
                            stage: "cleanup",
                            java_module_observation: {
                                compiler: observed.value.compiler,
                                major: observed.value.major,
                            },
                        },
                    });
                }
                else if (preparation !== undefined) {
                    primary = new ProviderAdapterError("jadx", operation, {
                        cause,
                        ...(output === undefined ? {} : { capturedOutput: output }),
                        diagnostics: {
                            stage: "ownership_preparation",
                            ...(preparation.compilerOutcome === undefined
                                ? {}
                                : {
                                    compiler_outcome: jsonValueSchema.parse(preparation.compilerOutcome),
                                }),
                        },
                    });
                }
                else if (cause instanceof AnalysisError) {
                    primary = cause;
                }
                else {
                    const failure = commandProbeRefusal(java, command, cause, options.timeoutMs ?? JAVA_MODULE_LISTING_TIMEOUT_MS);
                    if (cleanups.length === 0)
                        return err(failure);
                    primary = projectRefusal(failure, operation, cause, output);
                }
                for (const cleanup of cleanups)
                    primary = analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
                throw primary;
            }
        });
    }
    catch (cause) {
        if (cause instanceof AnalysisError)
            throw cause;
        throw analysisClientFailureForOperation(cause, "jadx", operation);
    }
};
const commandProbeRefusal = (java, command, cause, timeoutMs) => {
    const output = command?.snapshot == null ? undefined : capturedOutput(command.snapshot);
    const processError = command?.processError ?? (cause instanceof Error ? cause : undefined);
    const systemCode = processError === undefined ? undefined : Reflect.get(processError, "code");
    const limited = command?.reason === "output-limit";
    const timedOut = command?.reason === "timeout";
    return {
        code: systemCode === "ENOENT"
            ? "runtime_missing"
            : limited || timedOut
                ? "version_unresolved"
                : "runtime_unavailable",
        kind: systemCode === "ENOENT" ? "java_runtime" : "java_probe",
        message: limited
            ? `The selected Java launcher ${java} exceeded the ${String(JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES)}-byte module-listing output budget. This release has no runtime override. REA retained partial output but could not establish compiler or version availability. Inspect the selected launcher for verbose or unbounded output; java --list-modules should return a concise module listing. REA_JADX_OPERATION_TIMEOUT_MS does not raise this probe.`
            : timedOut
                ? `The selected Java launcher ${java} did not finish the module-listing probe within ${String(timeoutMs)} ms. This release has no runtime override. Inspect its startup responsiveness and verify it with java --list-modules. REA_JADX_OPERATION_TIMEOUT_MS does not raise this probe.`
                : `Cannot inspect selected Java runtime ${java}: ${systemCode === "ENOENT" ? "spawn java ENOENT" : cause instanceof Error ? cause.message : cause === undefined ? `exit ${String(output?.exit_code ?? "unknown")}${output?.signal == null ? "" : ` (${output.signal})`}` : String(cause)}. Review the selected launcher and retained diagnostics.`,
        diagnostics: {
            java_executable: java,
            phase: "module-inspection",
            exit_code: output?.exit_code ?? null,
            process_error_code: typeof systemCode === "string" ? systemCode : null,
            signal: output?.signal ?? null,
            killed: null,
            stdout: output?.stdout ?? "",
            stderr: output?.stderr ?? "",
            output_truncated: output?.truncated ?? true,
            ...(limited
                ? {
                    failure: "output_limit",
                    output_limit_bytes: JAVA_MODULE_LISTING_MAX_OUTPUT_BYTES,
                }
                : {}),
            ...(timedOut
                ? { failure: "probe_terminated", deadline_ms: timeoutMs }
                : {}),
        },
    };
};
const parseJavaModules = (java, snapshot) => {
    if (snapshot.exitCode !== 0 || snapshot.signal !== null)
        return err(commandProbeRefusal(java, { reason: "process", snapshot, processError: undefined }, undefined, JAVA_MODULE_LISTING_TIMEOUT_MS));
    const stdout = snapshot.stdout.text;
    const stderr = snapshot.stderr.text;
    const compiler = /^jdk\.compiler(?:@|$)/mu.test(stdout);
    if (!compiler)
        return refusal("runtime_missing", `Selected Java runtime ${java} does not provide jdk.compiler. Select a full JDK including jdk.compiler via JAVA_HOME or PATH; verify it with java --list-modules. A JRE cannot compile REA's source bridge.`, {
            java_executable: java,
            phase: "module-inspection",
            jdk_compiler: false,
            stdout,
            stderr,
            output_truncated: false,
        }, "java_runtime");
    const major = /^java\.base@(\d+)(?:[.+_-]|$)/mu.exec(stdout)?.[1];
    if (major === undefined)
        return refusal("version_unresolved", `The selected Java launcher ${java} did not report a parseable java.base version in its module listing. Inspect the launcher output and verify it with java --list-modules.`, {
            java_executable: java,
            phase: "module-inspection",
            jdk_compiler: true,
            java_major: null,
            stdout,
            stderr,
            output_truncated: false,
        }, "java_probe");
    const majorNumber = Number(major);
    if (!Number.isSafeInteger(majorNumber) || majorNumber <= 0)
        return refusal("version_unresolved", `The selected Java launcher ${java} reported an invalid java.base major version. Review the retained module listing.`, {
            java_executable: java,
            phase: "module-inspection",
            jdk_compiler: true,
            java_major: null,
            unparsed_java_major: major,
            stdout,
            stderr,
            output_truncated: false,
        }, "java_probe");
    if (majorNumber < 17)
        return refusal("unsupported_version", `Selected Java runtime ${java} must be JDK 17 or newer and include jdk.compiler; verify it with java --list-modules.`, {
            java_executable: java,
            phase: "module-inspection",
            jdk_compiler: true,
            java_major: major ?? null,
            stdout,
            stderr,
            output_truncated: false,
        }, "java_runtime");
    return ok({ compiler: true, major: majorNumber });
};
