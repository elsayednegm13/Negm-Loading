/** Exit status a signal-terminated process reports (128 + signal number). */
const SIGNAL_EXIT_STATUS = {
    SIGINT: 130,
    SIGTERM: 143,
};
const processShutdownEvents = {
    signals: process,
    stdin: process.stdin,
};
/** Register the process events that request shutdown and return their owner. */
export const registerProcessShutdown = (handler, events = processShutdownEvents) => {
    const onInterrupt = () => handler("SIGINT");
    const onTerminate = () => handler("SIGTERM");
    const onInputEnd = () => handler();
    events.signals.on("SIGINT", onInterrupt);
    events.signals.on("SIGTERM", onTerminate);
    events.stdin?.on("end", onInputEnd);
    events.stdin?.on("close", onInputEnd);
    return () => {
        events.signals.off("SIGINT", onInterrupt);
        events.signals.off("SIGTERM", onTerminate);
        events.stdin?.off("end", onInputEnd);
        events.stdin?.off("close", onInputEnd);
    };
};
/** Register signals only, for a transport that does not own stdin, and report the signal's exit status. */
export const registerSignalShutdown = (handler, signals = process) => registerProcessShutdown((signal) => {
    if (signal !== undefined)
        handler(SIGNAL_EXIT_STATUS[signal]);
}, { signals });
/** Record the first SIGINT or SIGTERM during startup and exit at once on a second one, so startup never dies without its cleanup. */
export const latchSignalShutdown = (signals = process, exit = (status) => process.exit(status)) => {
    let pending;
    const record = (signal) => () => {
        if (pending === undefined)
            pending = SIGNAL_EXIT_STATUS[signal];
        else
            exit(pending);
    };
    const onInterrupt = record("SIGINT");
    const onTerminate = record("SIGTERM");
    signals.on("SIGINT", onInterrupt);
    signals.on("SIGTERM", onTerminate);
    return {
        release: () => {
            signals.off("SIGINT", onInterrupt);
            signals.off("SIGTERM", onTerminate);
            return pending;
        },
    };
};
export const createExitStatus = (setExitCode) => {
    let signalStatus;
    return {
        set: (code) => {
            setExitCode(code === 0 && signalStatus !== undefined ? signalStatus : code);
        },
        signal: (status) => {
            signalStatus = status;
            setExitCode(status);
        },
    };
};
