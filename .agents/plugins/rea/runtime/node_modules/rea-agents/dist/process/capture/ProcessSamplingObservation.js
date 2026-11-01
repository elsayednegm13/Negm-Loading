import { ProcessRunTokenReadError } from "../ProcessRunTokenObservations.js";
import { err, ok } from "../../domain/result.js";
export const mergeSamplingDiagnostics = (...parts) => ({
    count: parts.reduce((count, part) => count + part.count, 0),
    first: parts.find((part) => part.first !== null)?.first ?? null,
    interrupted: parts.some((part) => part.interrupted),
});
export const samplingObservation = (value, ...diagnostics) => ({
    value,
    diagnostics: mergeSamplingDiagnostics(...diagnostics),
});
export const samplingFailure = (diagnostic) => ({
    count: 1,
    first: diagnostic,
    interrupted: false,
});
/** An interrupted attempt left an observation or declared traversal unfinished. */
export const samplingInterrupted = () => ({
    count: 0,
    first: null,
    interrupted: true,
});
/** Only this attempt's abort can end a read without a failure observation. */
export const isSamplingAbort = (cause, signal) => signal.aborted &&
    (cause === signal.reason ||
        (cause instanceof Error &&
            cause.name === "AbortError" &&
            cause.cause === signal.reason));
/** Settle each issued read, including peers still completing after shutdown. */
export const readSamplingSource = async (source, signal, read) => {
    if (signal.aborted)
        return err({ kind: "cancelled", reason: signal.reason });
    try {
        return ok(await read());
    }
    catch (cause) {
        if (isSamplingAbort(cause, signal))
            return err({ kind: "cancelled", reason: signal.reason });
        if (cause instanceof ProcessRunTokenReadError &&
            cause.availability === "absent")
            return err({ kind: "process-exited" });
        const systemCode = cause instanceof Error &&
            "code" in cause &&
            typeof cause.code === "string"
            ? cause.code
            : undefined;
        const reason = cause instanceof Error
            ? `${cause.name}: ${cause.message}`
            : String(cause);
        return err({
            kind: "unavailable",
            systemCode,
            diagnostic: `${source}: ${systemCode === undefined ? "" : `${systemCode}: `}${reason}`,
        });
    }
};
export const samplingReadObservation = (result) => result.ok
    ? samplingObservation(result.value)
    : samplingObservation(undefined, result.error.kind === "cancelled"
        ? samplingInterrupted()
        : result.error.kind === "process-exited"
            ? mergeSamplingDiagnostics()
            : samplingFailure(result.error.diagnostic));
/** Missing procfs entries are expected exit races; denied reads stay unknown. */
export const readProcSamplingSource = async (path, signal, read) => {
    const result = await readSamplingSource(path, signal, read);
    if (!result.ok &&
        result.error.kind === "unavailable" &&
        (result.error.systemCode === "ENOENT" ||
            result.error.systemCode === "ESRCH"))
        return samplingObservation(undefined);
    return samplingReadObservation(result);
};
