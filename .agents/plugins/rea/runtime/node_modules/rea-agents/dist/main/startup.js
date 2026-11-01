import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
export const openInitialTarget = async (session, config, serverLogger, writeStderr, signal) => {
    if (signal?.aborted)
        return { ok: false, exitCode: 0 };
    if (config.hopperTargetPath === undefined)
        return { ok: true };
    const opened = await session.open(config.hopperTargetPath, {
        targetKind: config.hopperTargetKind,
        ...(signal === undefined ? {} : { signal }),
    });
    if (opened.ok)
        return { ok: true };
    if (opened.error instanceof AnalysisCancelledError && signal?.aborted)
        return { ok: false, exitCode: 0 };
    serverLogger.error({
        error: projectAnalysisError(opened.error),
    }, "Initial target failed to open");
    writeStderr(`${projectAnalysisError(opened.error).message}\n`);
    return { ok: false, exitCode: 1 };
};
