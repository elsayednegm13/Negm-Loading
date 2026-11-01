/**
 * Select the semantic arguments for a contextBridge exposure method.
 * Callers retain authority over callee identity and interpretation of values.
 */
export const contextBridgeExposureArguments = (method, arguments_) => {
    if (method === "exposeInMainWorld")
        return {
            world: "main",
            worldId: null,
            worldIdIndex: null,
            apiKey: arguments_[0],
            api: arguments_[1],
        };
    if (method === "exposeInIsolatedWorld")
        return {
            world: "isolated",
            worldId: arguments_[0],
            worldIdIndex: 0,
            apiKey: arguments_[1],
            api: arguments_[2],
        };
    return undefined;
};
