/** Report one operation start through the shared monotonic boundary. */
export const reportOperationStart = (progress, phase, message = "started") => progress.report({ phase, completed: 0, total: 1, message });
/** Report one operation's terminal disposition. */
export const reportOperationEnd = (progress, phase, succeeded) => progress.report({
    phase,
    completed: 1,
    total: 1,
    message: succeeded ? "completed" : "failed",
    terminal: true,
});
