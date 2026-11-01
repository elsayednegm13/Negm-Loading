import { webBundleAcquisitionPartialObservationSchema, webBundleAnalysisSchema, } from "../domain/webBundleAnalysis.js";
import { AnalysisCancelledError, AnalysisCapabilityUnavailableError, AnalysisOutputError, } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { createBrowserEvidence } from "./BrowserEvidence.js";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { completeProviderEvidence, keepIncompleteObservation, } from "./ProviderOperationExecution.js";
import { webPageInspectionSchema } from "../domain/browserObservationSchemas.js";
/** List browser targets within the endpoint and origin scope in the request. */
export const listBrowserTargets = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "list_browser_targets");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("list_browser_targets", {
            cause: options.signal.reason,
        }));
    const result = await ready.value.listTargets(input, options);
    return result.ok
        ? browserEvidence("list_browser_targets", input, result.value, ready.value.identity(), options)
        : result;
};
/** Inspect one page within the endpoint and origin scope in the request. */
export const inspectWebPage = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "inspect_web_page");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("inspect_web_page", {
            cause: options.signal.reason,
        }));
    const result = await ready.value.inspectPage(input, options);
    if (!result.ok)
        return retainBrowserObservation(result.error, input, ready.value, "inspect_web_page");
    return result.ok
        ? browserEvidence("inspect_web_page", input, result.value, ready.value.identity(), options)
        : result;
};
/** Capture requested sources and derive static web-bundle evidence. */
export const analyzeWebBundle = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "analyze_web_bundle");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("analyze_web_bundle", {
            cause: options.signal.reason,
        }));
    const analyzed = await ready.value.analyzeBundle(input, options);
    if (!analyzed.ok)
        return retainBrowserObservation(analyzed.error, input, ready.value, "analyze_web_bundle");
    return browserEvidence("analyze_web_bundle", input, analyzed.value, ready.value.identity(), options);
};
/** Observe navigation caused by external user actions during one armed window. */
export const observeWebSession = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "observe_web_session");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("observe_web_session", {
            cause: options.signal.reason,
        }));
    const observed = await ready.value.observeSession(input, options);
    return observed.ok
        ? browserEvidence("observe_web_session", input, observed.value, ready.value.identity(), options)
        : observed;
};
/** Discover WebMCP declarations without exposing an invocation surface. */
export const discoverWebMcpTools = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "discover_webmcp_tools");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("discover_webmcp_tools", {
            cause: options.signal.reason,
        }));
    const discovered = await ready.value.discoverWebMcpTools(input, options);
    return discovered.ok
        ? browserEvidence("discover_webmcp_tools", input, discovered.value, ready.value.identity(), options)
        : discovered;
};
/** Compare two already-normalized web captures without external access. */
export const compareWebCaptureEvidence = async (browser, input) => {
    const ready = requireBrowser(browser, "compare_web_captures");
    if (!ready.ok)
        return ready;
    const compared = await ready.value.compareCaptures(input);
    return compared.ok
        ? ok(createBrowserEvidence("compare_web_captures", input, compared.value, ready.value.identity()))
        : compared;
};
/** Capture one visible-viewport screenshot for the requested target. */
export const captureWebScreenshot = async (browser, input, options = {}) => {
    const ready = requireBrowser(browser, "capture_web_screenshot");
    if (!ready.ok)
        return ready;
    if (options.signal?.aborted)
        return err(new AnalysisCancelledError("capture_web_screenshot", {
            cause: options.signal.reason,
        }));
    const captured = await ready.value.captureScreenshot(input, options);
    return captured.ok
        ? browserEvidence("capture_web_screenshot", input, captured.value, ready.value.identity(), options)
        : captured;
};
/** Compare two self-verifying PNG artifacts without external access. */
export const compareWebScreenshotEvidence = async (browser, input) => {
    const ready = requireBrowser(browser, "compare_web_screenshots");
    if (!ready.ok)
        return ready;
    const compared = await ready.value.compareScreenshots(input);
    return compared.ok
        ? ok(createBrowserEvidence("compare_web_screenshots", input, compared.value, ready.value.identity()))
        : compared;
};
const requireBrowser = (browser, operation) => browser === undefined
    ? err(new AnalysisCapabilityUnavailableError("rea-cdp-browser", operation, "browser observation provider is not configured"))
    : ok(browser);
const browserEvidence = (operation, input, result, provider, options) => {
    const json = jsonValueSchema.safeParse(result);
    if (!json.success)
        return err(new AnalysisOutputError(operation, "Browser provider returned non-JSON observation data.", {
            cause: json.error,
        }));
    return completeProviderEvidence(createBrowserEvidence(operation, input, result, provider), options.signal);
};
const NON_JSON_BROWSER_OBSERVATION = "Browser provider retained a non-JSON incomplete observation.";
/** Promote completed page or bundle facts; keep only a JSON-safe incomplete observation. */
const retainBrowserObservation = (error, input, provider, errorOperation) => {
    const partial = error.partialObservation;
    if (errorOperation === "analyze_web_bundle" &&
        partial !== undefined &&
        "kind" in partial &&
        partial.kind === "web-bundle-acquisition") {
        const acquisition = webBundleAcquisitionPartialObservationSchema.safeParse(partial);
        if (acquisition.success) {
            error.partialObservation = createBrowserEvidence("analyze_web_bundle", input, acquisition.data, provider.identity());
            return err(error);
        }
    }
    if (errorOperation === "analyze_web_bundle" &&
        partial !== undefined &&
        !("evidence_id" in partial) &&
        "observations" in partial &&
        "capture" in partial) {
        const bundle = webBundleAnalysisSchema.safeParse(partial);
        if (bundle.success) {
            error.partialObservation = createBrowserEvidence("analyze_web_bundle", input, bundle.data, provider.identity());
            return err(error);
        }
    }
    else if (partial !== undefined &&
        !("evidence_id" in partial) &&
        "target" in partial &&
        "network" in partial &&
        "capture_window" in partial) {
        const inspection = webPageInspectionSchema.safeParse(partial);
        if (inspection.success) {
            const pageInput = "fetch_source_maps" in input
                ? (({ fetch_source_maps: _fetchSourceMaps, ...page }) => page)(input)
                : input;
            error.partialObservation = createBrowserEvidence("inspect_web_page", pageInput, inspection.data, provider.identity());
            return err(error);
        }
    }
    return err(keepIncompleteObservation(error, errorOperation, NON_JSON_BROWSER_OBSERVATION));
};
