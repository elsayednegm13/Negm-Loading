/** Whether any requested REA-owned uninstall action failed. */
export const isUninstallFailure = (result) => {
    const status = result.status;
    switch (status) {
        case "complete":
            return false;
        case "failed":
            return true;
        default: {
            const exhaustive = status;
            throw new TypeError(`Unhandled uninstall result status: ${String(exhaustive)}`);
        }
    }
};
