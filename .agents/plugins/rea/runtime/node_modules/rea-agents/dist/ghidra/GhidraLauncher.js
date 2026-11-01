import { GHIDRA_BRIDGE_SOURCES } from "./GhidraBridgeSources.js";
import { snapshotGhidraAnalysisSeeds, } from "./GhidraAnalysisSeeds.js";
import { snapshotEnvironment } from "../process/snapshotEnvironment.js";
import { mkdir, realpath } from "node:fs/promises";
import { basename, dirname, join, posix, win32 } from "node:path";
import { writeGhidraRuntimeFile } from "./GhidraRuntimeFile.js";
import { windowsPrivateRuntime } from "../windows/WindowsPrivateRuntime.js";
import { quoteWindowsBatchToken, windowsBatchCommand, WindowsBatchCommandError, } from "../process/WindowsBatchCommand.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { DarwinProcessOwnershipInspectionError } from "../process/DarwinProcessRunTokenReader.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { execFileOutputFailure, execFileFailureCapturedOutput, } from "../process/ExecFileOutput.js";
import { boundedUtf8Text } from "../process/boundedUtf8Text.js";
import { redactCapturedTransportCredential } from "../process/ProviderDiagnosticRedaction.js";
import { cleanupOwnedProcessGroup, cleanupWindowsProcessTree, } from "../process/ProcessOwnership.js";
import { spawnOwnedProviderProcess, } from "../process/ProviderProcess.js";
import { ghidraJavaEnvironment } from "./GhidraInstallation.js";
import { ghidraJavaLaunch, GhidraLaunchSupportError, } from "./GhidraJavaLaunch.js";
import { snapshotGhidraExtensions, } from "./extensions/GhidraExtensions.js";
import { inspectGhidraPspExtension, } from "./GhidraPspExtension.js";
/** Same per-stream projection budget for helper warnings and failed commands. */
export const GHIDRA_LAUNCH_COMMAND_OUTPUT_BYTES = 8 * 1024;
/** Local launch failure retained as the cause of a provider-neutral error. */
export class GhidraLaunchError extends Error {
    #partialLaunch;
    #capturedOutput;
    launchSupport;
    rollbackFailure;
    cleanupFailure;
    /** Known producer outcome, independent of a signal that changes during finalization. */
    primaryFailure;
    constructor(message, options) {
        const { partialLaunch, capturedOutput, launchSupport, rollbackFailure, cleanupFailure, primaryFailure, ...errorOptions } = options ?? {};
        super(message, errorOptions);
        this.name = "GhidraLaunchError";
        this.#partialLaunch = partialLaunch;
        this.rollbackFailure = rollbackFailure;
        this.primaryFailure =
            primaryFailure ??
                (errorOptions.cause instanceof AnalysisError
                    ? errorOptions.cause
                    : errorOptions.cause instanceof GhidraLaunchError
                        ? errorOptions.cause.primaryFailure
                        : undefined);
        const inherited = errorOptions.cause instanceof DarwinProcessOwnershipInspectionError ||
            errorOptions.cause instanceof GhidraLaunchError
            ? errorOptions.cause.cleanupFailure
            : errorOptions.cause instanceof AnalysisError &&
                errorOptions.cause.cleanupIncomplete
                ? errorOptions.cause
                : undefined;
        this.cleanupFailure =
            cleanupFailure === undefined
                ? inherited
                : inherited === undefined || inherited === cleanupFailure
                    ? cleanupFailure
                    : analysisErrorWithCleanupFailure(inherited, cleanupFailure).bindCleanupDependencies([inherited, cleanupFailure]);
        const output = capturedOutput ??
            (errorOptions.cause instanceof DarwinProcessOwnershipInspectionError ||
                errorOptions.cause instanceof GhidraLaunchError
                ? errorOptions.cause.capturedOutput
                : undefined);
        this.#capturedOutput = output === undefined ? undefined : { ...output };
        this.launchSupport = (launchSupport ?? []).map((output) => ({ ...output }));
    }
    /** Process ownership retained for the client to retry an incomplete rollback. */
    get partialLaunch() {
        return this.#partialLaunch;
    }
    /** Launcher command outcome retained when a launch command reported one. */
    get capturedOutput() {
        return this.#capturedOutput === undefined
            ? undefined
            : { ...this.#capturedOutput };
    }
}
/**
 * Retain a failed launcher command's exit/signal and output in the shared
 * captured-output envelope. Bounds apply at projection; truncation there stays
 * explicit, matching the compiler-outcome diagnostics.
 */
const ghidraLaunchCommandOutput = (cause) => {
    if (cause instanceof DarwinProcessOwnershipInspectionError)
        return cause.capturedOutput;
    const failure = execFileOutputFailure(cause);
    if (failure === undefined)
        return undefined;
    return execFileFailureCapturedOutput(failure);
};
/** Launch Ghidra without copying scripts into or modifying its installation. */
export class GhidraHeadlessLauncher {
    options;
    constructor(options) {
        this.options = {
            ...options,
            environment: snapshotEnvironment(options.environment, options.platform),
        };
    }
    async launch(session, options = {}) {
        if (isAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const paths = ghidraRuntimePaths(session.runtimeRoot);
        const platform = this.options.platform ?? process.platform;
        let started;
        let configuredMaxHeap;
        const launchSupport = [];
        try {
            if (this.options.configurationDirectoryName === null)
                throw new GhidraLaunchError("Ghidra configuration directory identity is unresolved; restore application.version and application.release.name in the selected installation's application.properties.");
            const psp = this.options.pspExtension;
            if (psp !== undefined) {
                const installedRoot = await realpath(join(dirname(this.options.analyzeHeadlessPath), "..", "Ghidra", "Extensions", "ghidra-allegrex"));
                if (installedRoot !== psp.root)
                    throw new GhidraLaunchError("Allegrex profile does not belong to the selected Ghidra installation.");
                if (options.resourceScope === undefined)
                    throw new GhidraLaunchError("PSP inspection requires a caller-owned resource scope.");
                const inspected = await inspectGhidraPspExtension(psp.root, psp.ghidra_version, options.resourceScope, options.signal);
                if (inspected.sha256 !== psp.sha256)
                    throw new GhidraLaunchError("Installed Allegrex content changed since profile resolution; reopen the target to resolve a fresh profile.");
            }
            await createGhidraRuntimeDirectories(paths, platform, this.options.configurationDirectoryName);
            let seedPath;
            let gamecubeDolSectionPath;
            let extensions = [];
            if (this.options.analysisSeeds !== undefined ||
                (this.options.analysisExtensions?.length ?? 0) > 0) {
                if (options.resourceScope === undefined)
                    throw new GhidraLaunchError("Configured Ghidra artifacts require a caller-owned resource scope.");
                if (this.options.analysisSeeds !== undefined)
                    seedPath = await snapshotGhidraAnalysisSeeds(this.options.analysisSeeds, session.runtimeRoot, options.resourceScope, options.signal);
                extensions = await snapshotGhidraExtensions(this.options.analysisExtensions ?? [], session.runtimeRoot, options.resourceScope, options.signal);
            }
            await writeGhidraRuntimeFile(paths.descriptorPath, `${JSON.stringify({
                transport: session.transport,
                endpoint_path: session.endpointPath,
                token: session.token,
                run_id: session.runId,
                target_sha256: session.targetSha256,
                provider_version: session.providerVersion,
                profile_digest: session.profileDigest,
                ...(this.options.decompileTimeoutSeconds === undefined
                    ? {}
                    : {
                        decompile_timeout_seconds: this.options.decompileTimeoutSeconds,
                    }),
                ...(extensions.length === 0
                    ? {}
                    : { analysis_extensions: extensions }),
            })}\n`, platform);
            if (this.options.gamecubeDol !== undefined) {
                gamecubeDolSectionPath = join(dirname(paths.descriptorPath), "gamecube-dol-sections.txt");
                await writeGhidraRuntimeFile(gamecubeDolSectionPath, this.options.gamecubeDol.sectionFile, platform);
            }
            if (isAborted(options.signal))
                return err(new AnalysisCancelledError("open_binary", {
                    cause: options.signal?.reason,
                }));
            const headlessArguments = ghidraHeadlessArguments({
                platform,
                ...(psp === undefined ? {} : { psp: true }),
                ...(this.options.mipsSoftFloat === undefined
                    ? {}
                    : { mipsSoftFloat: this.options.mipsSoftFloat }),
                projectRoot: paths.projectRoot,
                targetPath: session.targetPath,
                bridgeScriptPath: this.options.bridgeScriptPath,
                descriptorPath: paths.descriptorPath,
                ghidraLogPath: paths.ghidraLogPath,
                scriptLogPath: paths.scriptLogPath,
                ...(this.options.dosCom === undefined
                    ? {}
                    : { dosCom: this.options.dosCom }),
                ...(this.options.dosMz === undefined
                    ? {}
                    : { dosMz: this.options.dosMz }),
                ...(this.options.rawBinary === undefined
                    ? {}
                    : { rawBinary: this.options.rawBinary }),
                ...(this.options.gamecubeDol === undefined ||
                    gamecubeDolSectionPath === undefined
                    ? {}
                    : {
                        gamecubeDol: {
                            languageId: this.options.gamecubeDol.languageId,
                            ...(this.options.gamecubeDol.compilerSpecId === undefined
                                ? {}
                                : {
                                    compilerSpecId: this.options.gamecubeDol.compilerSpecId,
                                }),
                            sectionFilePath: gamecubeDolSectionPath,
                        },
                    }),
                ...(this.options.languageOverride === undefined
                    ? {}
                    : { languageOverride: this.options.languageOverride }),
                ...(seedPath === undefined ? {} : { seedPath }),
                ...(this.options.disabledAnalyzers === undefined
                    ? {}
                    : { disabledAnalyzers: this.options.disabledAnalyzers }),
            });
            const scriptCommand = ghidraHeadlessCommand({
                environment: this.options.environment,
                platform,
                analyzeHeadlessPath: this.options.analyzeHeadlessPath,
                arguments: headlessArguments,
                ...(this.options.comSpec === undefined
                    ? {}
                    : { comSpec: this.options.comSpec }),
            });
            const environment = ghidraLaunchEnvironment(paths, this.options.javaHome, platform, scriptCommand.command, this.options.environment);
            if (platform !== "win32" && this.options.javaHome === undefined)
                throw new GhidraLaunchError("POSIX Ghidra requires its inspected JDK home");
            const inspectedJavaLaunch = await (this.options.javaLaunch ?? ghidraJavaLaunch)({
                platform,
                analyzeHeadlessPath: this.options.analyzeHeadlessPath,
                ...(this.options.javaHome === undefined
                    ? {}
                    : { javaHome: this.options.javaHome }),
                ...(this.options.javaVmName === undefined
                    ? {}
                    : { javaVmName: this.options.javaVmName }),
                homeRoot: paths.homeRoot,
                tempRoot: paths.tempRoot,
                argumentFileRoot: session.runtimeRoot,
                ...(options.resourceScope === undefined
                    ? {}
                    : { resourceScope: options.resourceScope }),
                arguments: headlessArguments,
                environment,
                onStderr: (mode, stderr) => {
                    if (stderr === "")
                        return;
                    const bytes = Buffer.byteLength(stderr);
                    const redacted = redactCapturedTransportCredential({ text: stderr, bytes, observedBytes: bytes }, session.token, "[REDACTED]");
                    const bounded = boundedUtf8Text(redacted, GHIDRA_LAUNCH_COMMAND_OUTPUT_BYTES);
                    launchSupport.push({
                        mode,
                        stderr: bounded.text,
                        stderr_bytes: bytes,
                        stderr_truncated: bounded.truncated,
                    });
                },
                ...(options.signal === undefined ? {} : { signal: options.signal }),
            });
            // Windows starts the script wrapper rather than this inspected JVM command.
            configuredMaxHeap =
                platform === "win32"
                    ? undefined
                    : inspectedJavaLaunch.configuredMaxHeap;
            const command = platform === "win32"
                ? {
                    ...scriptCommand,
                    environment: {
                        ...environment,
                        ...(inspectedJavaLaunch.preparedJdkJavaOptions === undefined
                            ? {}
                            : {
                                JDK_JAVA_OPTIONS: inspectedJavaLaunch.preparedJdkJavaOptions,
                            }),
                    },
                }
                : inspectedJavaLaunch;
            started = await (this.options.spawnProcess ?? spawnOwnedProviderProcess)({
                command: command.command,
                arguments: command.arguments,
                runId: session.runId,
                // POSIX launches the inspected JVM directly; script wrappers cannot
                // preserve JVM property paths containing spaces as single arguments.
                expectedCommand: platform !== "win32" ? command.command : null,
                windowsVerbatimArguments: platform === "win32",
                platform,
                env: command.environment,
                hostEnvironment: {},
                ...(options.signal === undefined ? {} : { signal: options.signal }),
            }).catch((cause) => {
                // The spawn boundary throws the exact opaque reason at preparation
                // checkpoints. Wrap it before interpreting any typed provider facts.
                if (options.signal?.aborted === true && cause === options.signal.reason)
                    throw new AnalysisCancelledError("open_binary", { cause });
                throw cause;
            });
            const partialLaunch = ownedGhidraLaunch(started, paths, platform, launchSupport, configuredMaxHeap);
            await writeGhidraRuntimeFile(paths.ownershipPath, `${JSON.stringify({
                run_id: session.runId,
                transport: session.transport,
                endpoint_path: session.endpointPath,
                pid: started.ownership.leaderPid,
                process_group_id: started.ownership.processGroupId,
                parent_pid: process.pid,
                ownership_kind: platform === "win32" ? "windows-job-object" : "posix-process-group",
                launcher: command.command,
                headless_script: this.options.analyzeHeadlessPath,
                created_at: new Date().toISOString(),
            })}\n`, platform);
            if (isAborted(options.signal)) {
                throw new AnalysisCancelledError("open_binary", {
                    cause: options.signal?.reason,
                });
            }
            return ok(partialLaunch);
        }
        catch (cause) {
            const cancellation = cause instanceof AnalysisCancelledError
                ? cause
                : (cause instanceof GhidraLaunchSupportError ||
                    cause instanceof DarwinProcessOwnershipInspectionError) &&
                    cause.cancellation !== undefined
                    ? new AnalysisCancelledError("open_binary", {
                        cause: cause.cancellation.reason,
                    })
                    : undefined;
            const capturedOutput = ghidraLaunchCommandOutput(cause);
            const launchFailure = new GhidraLaunchError("Ghidra headless launch failed", {
                cause,
                ...(cancellation === undefined
                    ? {}
                    : { primaryFailure: cancellation }),
                launchSupport,
                ...(capturedOutput === undefined ? {} : { capturedOutput }),
            });
            if (started === undefined)
                return err(launchFailure);
            const cleanupOwner = started;
            const rollback = await Promise.resolve()
                .then(() => cleanupStartedProcess(cleanupOwner, platform))
                .then((result) => result.cleaned ? ok(null) : err({ kind: "incomplete", result }), (cause) => err({ kind: "rejected", cause }));
            if (!rollback.ok) {
                const partialLaunch = ownedGhidraLaunch(started, paths, platform, launchSupport, configuredMaxHeap);
                const primaryMessage = cancellation !== undefined
                    ? cancellation.message
                    : `Ghidra headless launch failed: ${cause instanceof Error ? cause.message : String(cause)}`;
                return err(new GhidraLaunchError(`${primaryMessage}; process cleanup remains incomplete`, {
                    cause: new AggregateError([
                        launchFailure,
                        rollback.error.kind === "rejected"
                            ? rollback.error.cause
                            : rollback.error.result,
                    ], "Ghidra launch rollback did not release its process", { cause: launchFailure }),
                    partialLaunch,
                    ...(launchFailure.primaryFailure === undefined
                        ? {}
                        : { primaryFailure: launchFailure.primaryFailure }),
                    rollbackFailure: rollback.error,
                    ...(launchFailure.cleanupFailure === undefined
                        ? {}
                        : { cleanupFailure: launchFailure.cleanupFailure }),
                    launchSupport,
                    ...(capturedOutput === undefined ? {} : { capturedOutput }),
                }));
            }
            return err(launchFailure);
        }
    }
}
const ownedGhidraLaunch = (spawned, paths, platform, launchSupport, configuredMaxHeap) => ({
    ...ownedGhidraProcess(spawned, platform),
    projectRoot: paths.projectRoot,
    ghidraLogPath: paths.ghidraLogPath,
    scriptLogPath: paths.scriptLogPath,
    ...(configuredMaxHeap === undefined ? {} : { configuredMaxHeap }),
    ...(launchSupport.length === 0 ? {} : { launchSupport: [...launchSupport] }),
});
const ownedGhidraProcess = (spawned, platform) => ({
    process: spawned.process,
    ownsProcessLifetime: true,
    ownership: spawned.ownership,
    cleanup: () => cleanupStartedProcess(spawned, platform),
});
/** Build a direct POSIX launch or a conservatively quoted Windows batch call. */
export const ghidraHeadlessCommand = (options) => {
    if (options.platform !== "win32")
        return {
            command: options.analyzeHeadlessPath,
            arguments: [...options.arguments],
        };
    const command = ghidraBatchStep(() => windowsBatchCommand({
        environment: options.environment,
        batchPath: options.analyzeHeadlessPath,
        arguments: options.arguments,
        ...(options.comSpec === undefined ? {} : { comSpec: options.comSpec }),
    }));
    if ((command.arguments.at(-1)?.length ?? 0) > 30_000)
        throw new GhidraLaunchError("Windows Ghidra command exceeds the P0 length limit");
    return command;
};
/** Keep Ghidra's launch error type and P0 wording for shared batch checks. */
const ghidraBatchStep = (step) => {
    try {
        return step();
    }
    catch (cause) {
        if (!(cause instanceof WindowsBatchCommandError))
            throw cause;
        throw new GhidraLaunchError(cause.reason === "metacharacter"
            ? "Windows Ghidra P0 paths cannot contain command-interpreter metacharacters"
            : cause.message, { cause });
    }
};
const cleanupStartedProcess = (started, platform) => started.cleanup !== undefined
    ? started.cleanup()
    : platform === "win32"
        ? cleanupWindowsProcessTree(started.ownership.leaderPid)
        : cleanupOwnedProcessGroup(started.ownership);
/** Build the complete read-only headless invocation in deterministic order. */
export const ghidraHeadlessArguments = (options) => {
    // Bridge script paths use the target platform's syntax, which differs from
    // the host when building a cross-platform invocation.
    const scriptPath = (options.platform ?? process.platform) === "win32" ? win32 : posix;
    const bridgeDirectory = scriptPath.dirname(options.bridgeScriptPath);
    const override = options.languageOverride;
    const rawBinary = options.rawBinary;
    const gamecubeDol = options.gamecubeDol;
    if (gamecubeDol !== undefined &&
        (options.psp === true ||
            options.dosMz === true ||
            options.dosCom === true ||
            options.mipsSoftFloat === true ||
            rawBinary !== undefined ||
            override !== undefined))
        throw new Error("A GameCube DOL import cannot be combined with another loader, language override, or analysis lane; its language is committed in the gamecubeDol option.");
    if (options.psp === true &&
        (options.dosMz === true ||
            options.dosCom === true ||
            override !== undefined))
        throw new Error("A PSP ELF import cannot be combined with DOS or a generic Ghidra language override.");
    if (options.psp === true && rawBinary !== undefined)
        throw new Error("A PSP ELF import cannot be combined with a raw-binary import.");
    if (options.mipsSoftFloat === true &&
        (options.psp === true ||
            options.dosMz === true ||
            options.dosCom === true ||
            rawBinary !== undefined))
        throw new Error("MIPS soft-float storage applies only to a generic MIPS ELF import.");
    if (override !== undefined &&
        (options.dosMz === true || options.dosCom === true))
        throw new Error("A Ghidra language override cannot be combined with a DOS import.");
    if (override !== undefined && rawBinary !== undefined)
        throw new Error("A Ghidra language override cannot be combined with a raw-binary import.");
    if (rawBinary !== undefined &&
        (options.dosMz === true || options.dosCom === true))
        throw new Error("A raw-binary import cannot be combined with a DOS import.");
    return [
        options.projectRoot,
        "rea-project",
        "-import",
        options.targetPath,
        ...(gamecubeDol !== undefined
            ? [
                // One BinaryLoader block at file offset 0; the pre-script rebuilds the DOL section map.
                "-loader",
                "BinaryLoader",
                "-loader-baseAddr",
                "0x0",
                "-processor",
                gamecubeDol.languageId,
                ...(gamecubeDol.compilerSpecId === undefined
                    ? []
                    : ["-cspec", gamecubeDol.compilerSpecId]),
            ]
            : options.dosMz === true
                ? [
                    "-loader",
                    "MzLoader",
                    "-processor",
                    "x86:LE:16:Real Mode",
                    "-cspec",
                    "default",
                ]
                : options.dosCom === true
                    ? [
                        "-loader",
                        "BinaryLoader",
                        "-loader-baseAddr",
                        "1000:0100",
                        "-processor",
                        "x86:LE:16:Real Mode",
                        "-cspec",
                        "default",
                    ]
                    : rawBinary === undefined
                        ? options.psp === true
                            ? [
                                "-loader",
                                "PspElfLoader",
                                "-processor",
                                "Allegrex:LE:32:default",
                                "-cspec",
                                "default",
                            ]
                            : override !== undefined
                                ? [
                                    "-processor",
                                    override.languageId,
                                    ...(override.compilerSpecId === undefined
                                        ? []
                                        : ["-cspec", override.compilerSpecId]),
                                ]
                                : []
                        : [
                            "-loader",
                            "BinaryLoader",
                            "-loader-baseAddr",
                            rawBinary.baseAddr,
                            "-processor",
                            rawBinary.languageId,
                            "-cspec",
                            rawBinary.compilerSpecId,
                        ]),
        "-readOnly",
        "-deleteProject",
        "-log",
        options.ghidraLogPath,
        "-scriptlog",
        options.scriptLogPath,
        "-scriptPath",
        bridgeDirectory,
        ...(options.dosCom === true
            ? [
                "-preScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.prepareCom),
            ]
            : []),
        ...(rawBinary === undefined
            ? []
            : [
                "-preScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.prepareRaw),
                rawBinary.languageId,
                rawBinary.baseAddr,
            ]),
        ...(gamecubeDol === undefined
            ? []
            : [
                "-preScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.prepareDol),
                gamecubeDol.sectionFilePath,
            ]),
        // Seeds follow any loader preparation and precede default auto-analysis.
        ...(options.seedPath === undefined
            ? []
            : [
                "-preScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.applySeeds),
                options.seedPath,
            ]),
        // Analyzer options must apply before default auto-analysis and before the
        // post-analysis repair and bridge scripts start serving.
        ...(options.disabledAnalyzers === undefined ||
            options.disabledAnalyzers.length === 0
            ? []
            : [
                "-preScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.analysisOptions),
                options.disabledAnalyzers.join(","),
            ]),
        ...((options.platform ?? process.platform) === "win32"
            ? []
            : [
                "-postScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.noReturnFix),
            ]),
        // After analysis and the no-return refit, before the bridge serves results.
        ...(options.mipsSoftFloat === true
            ? [
                "-postScript",
                scriptPath.join(bridgeDirectory, GHIDRA_BRIDGE_SOURCES.mipsSoftFloat),
            ]
            : []),
        "-postScript",
        // Ghidra checks the caller's cwd before scriptPath for a basename. Select
        // the packaged source explicitly so unrelated entries cannot shadow it.
        options.bridgeScriptPath,
        options.descriptorPath,
    ];
};
const ghidraRuntimePaths = (runtimeRoot) => ({
    projectRoot: join(runtimeRoot, "project"),
    homeRoot: join(runtimeRoot, "home"),
    tempRoot: join(runtimeRoot, "tmp"),
    cacheRoot: join(runtimeRoot, "cache"),
    configRoot: join(runtimeRoot, "config"),
    dataRoot: join(runtimeRoot, "data"),
    descriptorPath: join(runtimeRoot, "session.json"),
    ownershipPath: join(runtimeRoot, "ownership.json"),
    ghidraLogPath: join(runtimeRoot, "ghidra.log"),
    scriptLogPath: join(runtimeRoot, "script.log"),
});
/**
 * Ghidra's launch support resolves its JDK before the headless run and then
 * persists that choice under `<config>/ghidra/<release directory>`. Inside
 * REA's Windows private runtime a child JVM cannot create those directories
 * itself, so startup aborted with "Failed to create directory" and reported
 * that no supported JDK was found. Create the release directory while this
 * process still owns the runtime, leaving Ghidra only a file write inside it.
 */
const createGhidraRuntimeDirectories = async (paths, platform, configReleaseDirectory) => {
    if (platform === "win32") {
        const runtime = windowsPrivateRuntime(dirname(paths.projectRoot));
        for (const path of [
            paths.projectRoot,
            paths.homeRoot,
            paths.tempRoot,
            paths.cacheRoot,
            paths.configRoot,
            paths.dataRoot,
        ])
            runtime.mkdir(basename(path));
        // Each level needs its parent first: the native owner opens every existing
        // component and creates only the final one.
        const configRoot = basename(paths.configRoot);
        runtime.mkdir(win32.join(configRoot, "ghidra"));
        runtime.mkdir(win32.join(configRoot, "ghidra", configReleaseDirectory));
        return;
    }
    await Promise.all([
        paths.projectRoot,
        paths.homeRoot,
        paths.tempRoot,
        paths.cacheRoot,
        paths.configRoot,
        paths.dataRoot,
        join(paths.configRoot, "ghidra", configReleaseDirectory),
    ].map((path) => mkdir(path, { recursive: true, mode: 0o700 })));
};
const ghidraLaunchEnvironment = (paths, javaHome, platform, executable, selectedEnvironment) => {
    return {
        ...ghidraJavaEnvironment(javaHome, selectedEnvironment, platform),
        ...ghidraHeadlessJavaOptions(paths.homeRoot, paths.tempRoot, platform),
        HOME: paths.homeRoot,
        TMPDIR: paths.tempRoot,
        ...(platform === "win32"
            ? {
                // Batch FOR /F launches another command interpreter through ComSpec.
                // Use the same executable with the spelling consumed by cmd.exe.
                ComSpec: executable.replaceAll("/", "\\"),
                USERPROFILE: paths.homeRoot,
                APPDATA: paths.configRoot,
                LOCALAPPDATA: paths.cacheRoot,
                TEMP: paths.tempRoot,
                TMP: paths.tempRoot,
            }
            : {}),
        XDG_CACHE_HOME: paths.cacheRoot,
        XDG_CONFIG_HOME: paths.configRoot,
        XDG_DATA_HOME: paths.dataRoot,
    };
};
/** Encode provider-owned JVM paths for the platform launcher that consumes them. */
export const ghidraHeadlessJavaOptions = (homeRoot, tempRoot, platform) => {
    const options = [`-Duser.home=${homeRoot}`, `-Djava.io.tmpdir=${tempRoot}`];
    if (platform === "win32")
        return {
            JDK_JAVA_OPTIONS: [...options, "-XX:-UsePerfData"]
                .map((option) => ghidraBatchStep(() => quoteWindowsBatchToken(option)))
                .join(" "),
            GHIDRA_HEADLESS_JAVA_OPTIONS: "",
        };
    // POSIX launches the JVM directly, so these properties travel as separate
    // argv items instead of the shell-split analyzeHeadless option list.
    return { JDK_JAVA_OPTIONS: "", GHIDRA_HEADLESS_JAVA_OPTIONS: "" };
};
const isAborted = (signal) => signal?.aborted === true;
