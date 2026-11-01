import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { jsonValueSchema } from "../domain/jsonValue.js";
import { PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY } from "./providerIdentities.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { BrowserObservationError } from "../domain/browserObservationError.js";
import { BrowserScenarioSecrets } from "./BrowserScenarioSecrets.js";
import { failBrowserScenarioOperation, openPlaywrightScenarioBrowser, } from "./PlaywrightScenarioBrowser.js";
import { performPlaywrightScenarioAction } from "./PlaywrightScenarioActions.js";
import { capturePlaywrightStepArtifacts } from "./PlaywrightScenarioArtifacts.js";
import { PlaywrightScenarioEvents } from "./PlaywrightScenarioEvents.js";
import { PlaywrightScenarioStorage } from "./PlaywrightScenarioStorage.js";
import { PlaywrightScenarioServiceWorkers } from "./PlaywrightScenarioServiceWorkers.js";
import { withPlaywrightExecutionBoundary, PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS, } from "./PlaywrightExecutionBoundary.js";
import { browserScenarioCaptureData, browserScenarioOperationFailure, } from "./BrowserScenarioPartialObservation.js";
const OPERATION = "capture_browser_scenario";
const throwIfScenarioCancelled = (signal) => {
    if (signal?.aborted === true)
        throw new BrowserObservationError(OPERATION, "cancelled", {
            cause: signal?.reason,
        });
};
const throwCleanupFailures = (failures) => {
    if (failures.length === 1)
        throw failures[0];
    if (failures.length > 1)
        throw new AggregateError(failures, "Browser scenario cleanup failed");
};
const installCookies = async (context, scenario, secrets) => {
    await context.addCookies(scenario.storage.cookies.map((cookie) => ({
        name: cookie.name,
        value: secrets.value(cookie.value),
        url: secrets.url(cookie.destination),
        httpOnly: cookie.http_only,
        secure: cookie.secure,
        sameSite: cookie.same_site,
    })));
};
const initializePage = async (context, scenario, secrets) => {
    context.setDefaultTimeout(0);
    context.setDefaultNavigationTimeout(0);
    await installCookies(context, scenario, secrets);
};
export class PlaywrightScenarioSession {
    opened;
    mode;
    processOwnership;
    product = "Chromium";
    version;
    initialUrl;
    secrets;
    startOrigin;
    eventCapture;
    storage;
    serviceWorkers;
    signal;
    #storageReleased = false;
    #storageCloseCompleted = false;
    #storageStopConfirmed = false;
    #stopLoading = false;
    #stopRevision = 0;
    cleanupLease;
    #navigationStopConfirmed = false;
    #browserReleaseGate;
    #onAbort = () => this.#recordStopRequest();
    constructor(opened, options) {
        this.opened = opened;
        this.mode = options.mode;
        this.processOwnership =
            options.mode === "launch" ? "provider-owned" : "external";
        this.secrets = options.secrets;
        this.startOrigin = options.startOrigin;
        this.eventCapture = options.eventCapture;
        this.storage = options.storage;
        this.serviceWorkers = options.serviceWorkers;
        this.signal = options.signal;
        const session = this;
        this.#browserReleaseGate = {
            get revision() {
                return session.#stopRevision;
            },
            run: () => this.#fulfillNavigationStopRequest(),
        };
        if (this.signal?.aborted === true)
            this.#recordStopRequest();
        else
            this.signal?.addEventListener("abort", this.#onAbort, { once: true });
        this.version = opened.browser.version();
        this.initialUrl = opened.page.url();
        this.cleanupLease = new AnalysisCleanupLease(async () => {
            await this.#closeResources();
        }, {
            get cleanupResources() {
                return opened.cleanup.cleanupResources;
            },
        });
    }
    static async open(scenario, environment, options) {
        throwIfScenarioCancelled(options.signal);
        const resolved = BrowserScenarioSecrets.resolve(scenario, environment);
        if (!resolved.ok)
            throw resolved.error;
        const secrets = resolved.value;
        const startedAt = performance.now();
        const openingCleanup = new Set();
        const opening = openPlaywrightScenarioBrowser(scenario, environment, {
            signal: options.signal,
            retainCleanup: (lease) => {
                openingCleanup.add(lease);
                options.retainCleanup?.(lease);
            },
        });
        let opened;
        try {
            opened = await withPlaywrightExecutionBoundary(() => opening, undefined, options.signal);
        }
        catch (cause) {
            let lateOpened;
            let openingFailure;
            const cleanup = new AnalysisCleanupLease(async () => {
                try {
                    lateOpened = await opening;
                }
                catch (cause) {
                    openingFailure =
                        cause instanceof AnalysisError &&
                            !(options.signal?.aborted === true &&
                                cause === options.signal.reason)
                            ? cause
                            : undefined;
                    const results = await Promise.allSettled([...openingCleanup].map((lease) => lease.release()));
                    const failures = results.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
                    throwCleanupFailures(failures);
                    if (openingFailure?.cleanupIncomplete === true)
                        throw openingFailure;
                    return;
                }
                await lateOpened.cleanup.release();
            }, {
                get cleanupResources() {
                    return (lateOpened?.cleanup.cleanupResources ??
                        openingFailure?.cleanupResources);
                },
            });
            options.retainCleanup?.(cleanup);
            void withPlaywrightExecutionBoundary(() => cleanup.release(), 1_000).catch(() => undefined);
            throw cause;
        }
        const session = await this.initializeSession(opened, scenario, secrets, options);
        try {
            await withPlaywrightExecutionBoundary(() => opened.page.goto(secrets.url(scenario.start_url), {
                waitUntil: "load",
                timeout: 0,
            }), scenario.command_timeout_ms, options.signal);
            await withPlaywrightExecutionBoundary(() => session.serviceWorkers?.assertBlocked() ?? Promise.resolve(), undefined, options.signal);
            await withPlaywrightExecutionBoundary(() => session.storage?.settle() ?? Promise.resolve(), undefined, options.signal);
            return session;
        }
        catch (cause) {
            let cleanup;
            let cleanupFailure;
            try {
                cleanup = await session.close(true);
            }
            catch (failure) {
                cleanup = "incomplete";
                cleanupFailure = { cause: failure };
                options.retainCleanup?.(session.cleanupLease);
            }
            throw browserScenarioOperationFailure(cause, {
                kind: "browser-scenario-observation",
                capture: browserScenarioCaptureData({
                    session,
                    scenario,
                    startedAt,
                    steps: [],
                    cleanup,
                    limitations: [
                        "Scenario navigation failed before the initial state was captured.",
                    ],
                }),
            }, cleanupFailure);
        }
    }
    static async initializeSession(opened, scenario, secrets, options) {
        let events;
        let storage;
        const serviceWorkers = scenario.browser.mode === "connect" &&
            scenario.environment.service_workers === "block"
            ? new PlaywrightScenarioServiceWorkers(opened.page, scenario.browser.cdp_endpoint, scenario.browser.target_id, scenario.command_timeout_ms)
            : undefined;
        try {
            await withPlaywrightExecutionBoundary(async () => {
                await serviceWorkers?.initialize();
                await initializePage(opened.context, scenario, secrets);
            }, undefined, options.signal);
            storage = await PlaywrightScenarioStorage.create(opened, scenario, secrets, {
                ...(options.signal === undefined ? {} : { signal: options.signal }),
                ...(options.retainCleanup === undefined
                    ? {}
                    : { retainCleanup: options.retainCleanup }),
            });
            await storage?.initialize(opened.page, opened.context);
            throwIfScenarioCancelled(options.signal);
            events = new PlaywrightScenarioEvents({
                page: opened.page,
                context: opened.context,
                ownsContext: scenario.browser.mode === "launch",
                enabled: new Set(scenario.capture.events),
                secrets,
                network: scenario.capture.network,
                limits: scenario.capture.limits,
                ...(options.signal === undefined ? {} : { signal: options.signal }),
            });
            return new PlaywrightScenarioSession(opened, {
                mode: scenario.browser.mode,
                secrets,
                startOrigin: new URL(scenario.start_url.url).origin,
                eventCapture: events,
                storage,
                serviceWorkers,
                signal: options.signal,
            });
        }
        catch (cause) {
            let storageReleased = false;
            const storageStopsLoading = storage !== undefined && options.signal?.aborted === true;
            let policyStopsLoading = !storageStopsLoading;
            const cleanup = async () => {
                let storageFailure;
                let policyFailure;
                let browserFailure;
                if (!storageReleased) {
                    try {
                        const result = await storage?.close(storageStopsLoading);
                        if (storageStopsLoading && result?.loadingStopped !== true)
                            policyStopsLoading = true;
                    }
                    catch (failure) {
                        storageFailure = { cause: failure };
                        // Ownership transfers only after the storage attempt is no longer
                        // in flight. Its failure does not establish that navigation stop
                        // succeeded, so the policy owner must confirm it before release.
                        policyStopsLoading = true;
                    }
                }
                try {
                    if (!opened.cleanup.browserClosed)
                        await serviceWorkers?.close(policyStopsLoading);
                }
                catch (failure) {
                    policyFailure = { cause: failure };
                }
                if (policyFailure === undefined) {
                    try {
                        await opened.cleanup.release(events === undefined
                            ? undefined
                            : () => events?.finish() ?? Promise.resolve());
                    }
                    catch (failure) {
                        browserFailure = { cause: failure };
                    }
                }
                else {
                    try {
                        await events?.finish();
                    }
                    catch (failure) {
                        browserFailure = { cause: failure };
                    }
                }
                if (opened.cleanup.browserClosed)
                    storageReleased = true;
                throwCleanupFailures([
                    ...(policyFailure === undefined ? [] : [policyFailure.cause]),
                    ...(storageReleased || storageFailure === undefined
                        ? []
                        : [storageFailure.cause]),
                    ...(browserFailure === undefined ? [] : [browserFailure.cause]),
                ]);
            };
            const recovery = new AnalysisCleanupLease(cleanup, opened.cleanup);
            try {
                return await failBrowserScenarioOperation(recovery, cause);
            }
            catch (failure) {
                if (failure !== cause)
                    options.retainCleanup?.(recovery);
                throw failure;
            }
        }
    }
    currentUrl() {
        return this.opened.page.url();
    }
    sanitizeUrl(value) {
        return this.secrets.sanitizeUrl(value);
    }
    setStep(index) {
        this.eventCapture.setStep(index);
    }
    nextEventSequence() {
        return this.eventCapture.nextSequence();
    }
    lastEventSequence() {
        return this.eventCapture.lastSequence();
    }
    events() {
        return this.eventCapture.result();
    }
    /** Preserve event coverage gaps for the aggregate capture's completeness. */
    eventLimitations() {
        return this.eventCapture.limitations();
    }
    storageLimitations() {
        return this.storage?.limitations() ?? [];
    }
    async perform(action, signal) {
        await withPlaywrightExecutionBoundary(() => performPlaywrightScenarioAction({
            page: this.opened.page,
            action,
            secrets: this.secrets,
            startOrigin: this.startOrigin,
            signal,
        }), "timeout_ms" in action ? action.timeout_ms : undefined, signal);
        await withPlaywrightExecutionBoundary(() => this.storage?.settle() ?? Promise.resolve(), undefined, signal);
    }
    async capture(requested, signal) {
        await withPlaywrightExecutionBoundary(() => this.serviceWorkers?.assertBlocked() ?? Promise.resolve(), undefined, signal);
        await withPlaywrightExecutionBoundary(() => this.storage?.settle() ?? Promise.resolve(), undefined, signal);
        const artifacts = await withPlaywrightExecutionBoundary(() => capturePlaywrightStepArtifacts({
            context: this.opened.context,
            page: this.opened.page,
            secrets: this.secrets,
            requested,
        }), undefined, signal);
        try {
            await withPlaywrightExecutionBoundary(() => this.serviceWorkers?.assertBlocked() ?? Promise.resolve(), undefined, signal);
        }
        catch (cause) {
            const failure = cause instanceof AnalysisError
                ? cause
                : new ProviderAdapterError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, OPERATION, { cause });
            failure.retainDiagnostics({
                collected_artifacts: jsonValueSchema.parse(artifacts),
            });
            throw failure;
        }
        return artifacts;
    }
    async close(stopLoading = this.signal?.aborted === true) {
        if (stopLoading)
            this.#recordStopRequest();
        try {
            await withPlaywrightExecutionBoundary(() => this.cleanupLease.release(), PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
        }
        catch (cause) {
            const error = new BrowserObservationError(OPERATION, "cleanup_failed", {
                cause,
                cleanup: {
                    reason: cause instanceof Error ? cause.message : String(cause),
                    resources: this.cleanupLease.cleanupResources ?? [],
                },
            });
            new AnalysisCleanupLeaseGroup(error, [this.cleanupLease]);
            throw error;
        }
        return this.mode === "launch"
            ? "terminated-owned-process"
            : "disconnected-external";
    }
    async #closeResources() {
        const stopLoading = this.#stopLoading;
        let storageFailure;
        let policyFailure;
        let browserFailure;
        if (!this.#storageCloseCompleted) {
            try {
                const result = await this.storage?.close(stopLoading);
                this.#storageStopConfirmed = result?.loadingStopped === true;
                this.#storageCloseCompleted = true;
            }
            catch (failure) {
                storageFailure = { cause: failure };
            }
        }
        try {
            if (!this.opened.cleanup.browserClosed)
                await this.serviceWorkers?.close(stopLoading && !this.#storageStopConfirmed);
            if (stopLoading &&
                !this.#storageStopConfirmed &&
                this.serviceWorkers !== undefined)
                this.#navigationStopConfirmed = true;
        }
        catch (failure) {
            policyFailure = { cause: failure };
        }
        if (policyFailure === undefined) {
            try {
                await this.#fulfillNavigationStopRequest();
            }
            catch (failure) {
                policyFailure = { cause: failure };
            }
        }
        if (policyFailure === undefined) {
            try {
                await this.opened.cleanup.release(() => this.eventCapture.finish(), this.#browserReleaseGate);
            }
            catch (failure) {
                browserFailure = { cause: failure };
            }
        }
        else {
            try {
                await this.eventCapture.finish();
            }
            catch (failure) {
                browserFailure = { cause: failure };
            }
        }
        if (this.opened.cleanup.browserClosed) {
            this.#storageReleased = true;
            this.signal?.removeEventListener("abort", this.#onAbort);
        }
        throwCleanupFailures([
            ...(policyFailure === undefined ? [] : [policyFailure.cause]),
            ...(this.#storageReleased || storageFailure === undefined
                ? []
                : [storageFailure.cause]),
            ...(browserFailure === undefined ? [] : [browserFailure.cause]),
        ]);
    }
    #recordStopRequest() {
        if (!this.#stopLoading)
            this.#stopRevision += 1;
        this.#stopLoading = true;
    }
    async #fulfillNavigationStopRequest() {
        if (!this.#stopLoading ||
            this.#storageStopConfirmed ||
            this.#navigationStopConfirmed ||
            this.mode === "launch")
            return;
        if (this.serviceWorkers !== undefined) {
            await this.serviceWorkers.close(true);
        }
        else if (this.opened.page.isClosed()) {
            this.#navigationStopConfirmed = true;
            return;
        }
        else {
            const frame = this.opened.page.mainFrame();
            if (frame.isDetached())
                throw new Error("Cannot stop navigation through a detached main frame");
            await frame.evaluate("globalThis.stop()");
        }
        this.#navigationStopConfirmed = true;
    }
    redactError(error) {
        return this.secrets.redact(error instanceof Error ? error.message : "browser action failed");
    }
}
