import { monotonicProcessCaptureClock } from "./ProcessCaptureClock.js";
const formatProgressMessage = (elapsedMs, counts, disposition, cleanup) => {
    const status = `elapsed_ms=${String(elapsedMs)} frames=${String(counts.frames)} samples=${String(counts.samples)} interactions=${String(counts.interactions)}`;
    const dispositionText = disposition === undefined ? "" : ` disposition=${disposition}`;
    const cleanupText = cleanup !== undefined
        ? ` owned_process_group=${cleanup.owned_process_group.state} terminal_renderer=${cleanup.terminal_renderer.state} temporary_root=${cleanup.temporary_root.state}`
        : disposition === undefined
            ? ""
            : " owned_process_group=unverified terminal_renderer=unverified temporary_root=unverified";
    return `${status}${dispositionText}${cleanupText}`;
};
/** Serialize observed capture status through one rate-limited reporter. */
export const createProcessCaptureProgressTracker = (progress, now = monotonicProcessCaptureClock) => {
    const started = now();
    let completed = 0;
    let live = true;
    let next;
    let pending;
    const flush = async () => {
        try {
            while (next !== undefined) {
                const update = next;
                next = undefined;
                try {
                    await progress?.report(update);
                }
                catch {
                    // Progress delivery is observational; capture and cleanup still finish.
                    continue;
                }
            }
        }
        finally {
            pending = undefined;
        }
    };
    return {
        closeLive() {
            live = false;
            if (next?.terminal !== true)
                next = undefined;
        },
        report(update) {
            if (progress === undefined)
                return Promise.resolve();
            if (update.terminal !== true && !live)
                return Promise.resolve();
            const units = update.counts.frames +
                update.counts.samples +
                update.counts.interactions;
            if (units > completed)
                completed = units;
            // A slow observer needs the latest observation, not a queue of old states.
            next = {
                phase: update.phase,
                completed,
                total: null,
                message: formatProgressMessage(Math.max(0, now() - started), update.counts, update.disposition, update.cleanup),
                ...(update.terminal === true ? { terminal: true } : {}),
            };
            pending ??= Promise.resolve().then(flush);
            return pending;
        },
    };
};
