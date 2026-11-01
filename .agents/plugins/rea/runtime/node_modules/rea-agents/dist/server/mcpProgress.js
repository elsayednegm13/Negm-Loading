import { createProgressReporter, silentProgressReporter, } from "../application/ProgressReporter.js";
/** Adapt the request's negotiated MCP progress token to application progress. */
export const mcpProgressReporter = (context) => {
    const token = context.mcpReq._meta?.progressToken;
    if (token === undefined)
        return silentProgressReporter;
    return createProgressReporter(async (update) => {
        try {
            await context.mcpReq.notify({
                method: "notifications/progress",
                params: {
                    progressToken: token,
                    // Status phases can repeat their work count while waiting. The
                    // protocol requires every notification to advance; count emitted
                    // observations without inventing a total amount of analysis work.
                    progress: update.sequence,
                    message: `${update.phase}: ${update.message}`,
                },
            });
        }
        catch (cause) {
            // Progress is observational; transport failure cannot change tool truth.
            void cause;
        }
    }, { minimumIntervalMs: 100 });
};
