import { readFile } from "node:fs/promises";
import { parseLinuxProcessStat } from "./LinuxProcessStat.js";
const DETACH_TIMEOUT_MS = 1_000;
const MAX_LATE_DEBUGGER_OUTPUT_BYTES = 64 * 1024;
/** Read one Linux identity; absence is distinct from unreadable or malformed data. */
export const readLinuxProcessStartTime = async (pid) => {
    if (process.platform !== "linux")
        throw new Error("Inferior process identity verification requires Linux /proc.");
    let stat;
    try {
        stat = await readFile(`/proc/${pid}/stat`, "utf8");
    }
    catch (cause) {
        if (typeof cause === "object" &&
            cause !== null &&
            "code" in cause &&
            cause.code === "ENOENT")
            return null;
        throw cause;
    }
    const parsed = parseLinuxProcessStat(stat);
    if (parsed === undefined || parsed.pid !== Number(pid))
        throw new Error(`Inferior PID ${pid} has an unreadable process identity.`);
    return parsed.startTime;
};
/** Confirm only that every previously identified inferior process has ended. */
export const verifyOwnedInferiorsEnded = async (identities, readStartTime = readLinuxProcessStartTime) => {
    let foundIdentity = false;
    for (const identity of identities) {
        foundIdentity = true;
        const observed = await readStartTime(identity.pid);
        if (observed === identity.startTime)
            return false;
    }
    return foundIdentity;
};
const detachAttempts = new WeakMap();
const detachOutcomes = new WeakMap();
const isVerifiedDetachResult = (result) => typeof result === "object" &&
    result !== null &&
    (("status" in result && result.status === "no-inferior") ||
        ("status" in result &&
            result.status === "detached" &&
            "outputSink" in result &&
            result.outputSink === "durable"));
const waitForInferiorDetach = async (session, detach) => {
    let attempt = detachAttempts.get(session);
    if (attempt === undefined) {
        // Providers may use `this` to access their command transport.
        const pending = Promise.resolve().then(() => detach.call(session));
        const tracked = pending.then((result) => {
            detachAttempts.delete(session);
            detachOutcomes.set(session, isVerifiedDetachResult(result) ? "confirmed" : "unconfirmed");
            return result;
        }, (cause) => {
            detachAttempts.delete(session);
            detachOutcomes.set(session, "unconfirmed");
            throw cause;
        });
        attempt = tracked;
        detachAttempts.set(session, tracked);
    }
    let timer;
    try {
        return await Promise.race([
            attempt,
            new Promise((resolve) => {
                timer = setTimeout(() => resolve(undefined), DETACH_TIMEOUT_MS);
            }),
        ]);
    }
    finally {
        clearTimeout(timer);
    }
};
const finishExitedDebuggerSession = async (session, debuggerName, platform, status) => {
    try {
        session.supervisor.limitAdditionalOutputBytes(MAX_LATE_DEBUGGER_OUTPUT_BYTES);
        if (!(await session.supervisor.waitForOutputClose(1_000))) {
            return {
                status: "incomplete",
                reason: platform === "win32"
                    ? `Owned ${debuggerName} process leader exited, but its Windows Job Object still has active descendants or has not reported settlement.`
                    : `Owned ${debuggerName} process leader exited, but inherited output streams are still open or have not reported settlement.`,
            };
        }
    }
    catch (cause) {
        return {
            status: "incomplete",
            reason: platform === "win32"
                ? `Owned ${debuggerName} Windows Job Object settlement could not be verified: ${cause instanceof Error ? cause.message : String(cause)}`
                : `Owned ${debuggerName} inherited output stream settlement could not be verified: ${cause instanceof Error ? cause.message : String(cause)}`,
        };
    }
    if (platform !== "win32")
        session.supervisor.unrefOutputStreams();
    session.supervisor.dispose();
    return { status };
};
/** Stop only the directly owned debugger process, never its process group or target. */
export const stopOwnedDebuggerProcess = async (session, debuggerName, options = {}) => {
    const platform = options.platform ?? process.platform;
    if (session.exited) {
        if (detachAttempts.has(session))
            return {
                status: "incomplete",
                reason: `Owned ${debuggerName} inferior detach is still pending after the process exited.`,
            };
        const detachOutcome = detachOutcomes.get(session);
        if (detachOutcome === "unconfirmed" ||
            (detachOutcome === undefined && session.inferiorStateUnknown?.() === true)) {
            try {
                if ((await session.verifyInferiorsEndedAfterExit?.()) !== true)
                    return {
                        status: "incomplete",
                        reason: `Owned ${debuggerName} inferior disposition was not verified before the debugger exited, and no owner proof confirms the identified inferior processes have ended.`,
                    };
                detachOutcomes.set(session, "inferior-ended");
            }
            catch (cause) {
                return {
                    status: "incomplete",
                    reason: `Owned ${debuggerName} inferior process identity could not be verified after debugger exit: ${cause instanceof Error ? cause.message : String(cause)}`,
                };
            }
        }
        return finishExitedDebuggerSession(session, debuggerName, platform, "already_exited");
    }
    if (platform === "win32")
        return {
            status: "incomplete",
            reason: `Owned ${debuggerName} process cannot be stopped safely on Windows because job termination can also terminate its inferior processes.`,
        };
    try {
        if (session.detachInferior === undefined) {
            detachOutcomes.set(session, "unconfirmed");
            return {
                status: "incomplete",
                reason: `Owned ${debuggerName} inferior detach cannot be verified because the provider has no detach capability.`,
            };
        }
        const detached = await waitForInferiorDetach(session, session.detachInferior);
        if (detached === undefined)
            return {
                status: "incomplete",
                reason: `Owned ${debuggerName} inferior detach was not verified within ${String(DETACH_TIMEOUT_MS)} ms. This release has no runtime override.`,
            };
        if (!isVerifiedDetachResult(detached)) {
            detachOutcomes.set(session, "unconfirmed");
            return {
                status: "incomplete",
                reason: `Owned ${debuggerName} provider did not confirm no inferior or detachment with a durable output sink.`,
            };
        }
        detachOutcomes.set(session, "confirmed");
    }
    catch (cause) {
        return {
            status: "incomplete",
            reason: `Owned ${debuggerName} inferior detach could not be verified: ${cause instanceof Error ? cause.message : String(cause)}`,
        };
    }
    session.launched.process.kill("SIGTERM");
    if (!(await session.supervisor.waitForExit(300))) {
        session.launched.process.kill("SIGKILL");
        const exitedAfterKill = await session.supervisor.waitForExit(1_000);
        if (exitedAfterKill)
            return finishExitedDebuggerSession(session, debuggerName, platform, "stopped");
        return {
            status: "incomplete",
            reason: `Owned ${debuggerName} process did not exit after direct termination.`,
        };
    }
    return finishExitedDebuggerSession(session, debuggerName, platform, "stopped");
};
/**
 * Stop every owned session and retain failed sessions for possible recovery.
 * Callers must block replacement admission and drain in-flight starts until
 * this settles; incomplete cleanup leaves the old owner in the map for retry.
 */
export const closeOwnedDebuggerSessions = async (sessions, stop, debuggerName) => {
    const results = await Promise.allSettled([...sessions.entries()].map(async ([key, session]) => ({
        key,
        session,
        result: await stop(session),
    })));
    const failures = [];
    for (const settled of results) {
        if (settled.status === "rejected") {
            failures.push(settled.reason instanceof Error
                ? settled.reason
                : new Error(String(settled.reason)));
            continue;
        }
        const { key, session, result } = settled.value;
        if (result.status === "incomplete")
            failures.push(new Error(result.reason));
        else if (sessions.get(key) === session)
            sessions.delete(key);
    }
    if (failures.length > 0)
        throw new AggregateError(failures, `One or more owned ${debuggerName} processes did not stop cleanly`);
};
