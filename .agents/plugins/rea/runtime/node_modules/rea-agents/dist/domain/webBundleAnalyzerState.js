export const createWebBundleAnalysisAccumulator = () => ({
    edges: [],
    routes: [],
    endpoints: [],
    webMcp: [],
    inferences: [],
    seen: new Set(),
    visitedNodes: 0,
    parsedScripts: 0,
    failedScripts: [],
    recoveredScripts: [],
    widenedScripts: [],
});
export const isIncludedScript = (script) => script.source.included;
