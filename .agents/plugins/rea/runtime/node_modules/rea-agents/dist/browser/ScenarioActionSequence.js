/**
 * Explain a declared action recorded as `cancelled` without running because an
 * earlier action stopped the sequence. Scenario producers record every
 * remaining action so results account for the whole declared sequence.
 */
export const notExecutedActionError = (stoppedBy) => stoppedBy === "failed"
    ? "not executed after an earlier action failure"
    : "not executed after scenario request cancellation";
