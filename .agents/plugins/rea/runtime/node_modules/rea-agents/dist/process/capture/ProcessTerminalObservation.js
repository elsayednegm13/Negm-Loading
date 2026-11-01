import { err, ok } from "../../domain/result.js";
import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { projectAnalysisError } from "../../domain/analysisErrorProjection.js";
import { ProcessCaptureError } from "./ProcessCaptureError.js";
const terminalFailure = (cause) => cause instanceof AnalysisError
    ? cause
    : new ProcessCaptureError(`Terminal observation failed: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
/** Keep a primary capture failure while retaining the finalizer's typed diagnostic. */
export const retainTerminalObservationFailure = (primary, failure) => {
    if (primary === undefined)
        return failure;
    const error = primary instanceof AnalysisError
        ? primary
        : new ProcessCaptureError("process capture failed", { cause: primary });
    if (error !== failure)
        error.retainSecondaryFailure(failure, {
            terminal_observation_error: projectAnalysisError(failure),
        });
    return error;
};
/** Finalize retained chunks once after sampling, for both completion and error cleanup. */
export const createProcessTerminalFinalizer = (renderer, retention, observations) => {
    let completed;
    const complete = () => (completed ??= observeTerminal(renderer, retention, observations));
    return {
        complete,
        dispose: async () => {
            await complete();
            await renderer.dispose();
        },
    };
};
const observeTerminal = async (renderer, readRetention, observations) => {
    let retention;
    try {
        retention = ok(readRetention());
    }
    catch (cause) {
        retention = err(terminalFailure(cause));
    }
    let rendered;
    try {
        const frames = await renderer.frames();
        rendered = ok(frames);
        observations.rendered_frames = {
            state: "available",
            value: frames,
        };
    }
    catch (cause) {
        const failure = terminalFailure(cause);
        rendered = err(failure);
        observations.rendered_frames = {
            state: "unavailable",
            reason: `Rendered terminal frame collection failed: ${failure.message}`,
        };
    }
    if (!retention.ok) {
        if (!rendered.ok)
            retention.error.retainSecondaryFailure(rendered.error, {
                rendered_terminal_failure: projectAnalysisError(rendered.error),
            });
        return retention;
    }
    if (!rendered.ok)
        return rendered;
    return ok({ retention: retention.value, renderedFrames: rendered.value });
};
