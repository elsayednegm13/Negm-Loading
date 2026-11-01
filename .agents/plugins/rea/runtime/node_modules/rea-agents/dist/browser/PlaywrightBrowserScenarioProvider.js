import { withPlaywrightExecutionBoundary, PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS, } from "./PlaywrightExecutionBoundary.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { BROWSER_SCENARIO_START_STEP_ID, } from "../domain/browserScenarioValues.js";
import { browserScenarioCaptureSchema, } from "../domain/browserScenarioCapture.js";
import { classifyBrowserScenarioCompleteness, browserScenarioStepSchema, browserStepArtifactsSchema, } from "../domain/browserScenarioCaptureValues.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { BrowserObservationError, browserCleanupObservation, } from "../domain/browserObservationError.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err, ok } from "../domain/result.js";
import { notExecutedActionError, } from "./ScenarioActionSequence.js";
import { browserScenarioOperationFailure, browserScenarioCaptureData, } from "./BrowserScenarioPartialObservation.js";
const OPERATION = "capture_browser_scenario";
import { PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY } from "./providerIdentities.js";
const signalIsAborted = (signal) => signal?.aborted === true;
const SNAPSHOT_KINDS = [
    "screenshot",
    "dom",
    "accessibility",
    "url",
    "history",
    "storage",
];
const requestedForStep = (scenario, stepIndex) => new Set([
    ...scenario.capture.after_each_step,
    ...(stepIndex === scenario.actions.length ? scenario.capture.at_end : []),
]);
const unavailableArtifacts = (requested, reason) => {
    const state = (kind) => requested.has(kind)
        ? { state: "missing", reason }
        : { state: "not_requested" };
    return browserStepArtifactsSchema.parse({
        screenshot: state("screenshot"),
        dom: state("dom"),
        accessibility: state("accessibility"),
        url: state("url"),
        history: state("history"),
        storage: state("storage"),
    });
};
const stepCompleteness = (artifacts, status) => {
    const missing = SNAPSHOT_KINDS.filter((section) => artifacts[section].state === "missing");
    const truncated = SNAPSHOT_KINDS.filter((section) => artifacts[section].state === "truncated");
    if (status !== "completed")
        missing.push("action");
    return classifyBrowserScenarioCompleteness(missing, truncated);
};
const createStep = (input) => browserScenarioStepSchema.parse({
    step_index: input.stepIndex,
    step_id: input.stepId,
    action: input.action,
    status: input.status,
    elapsed_ms: input.elapsedMs,
    before_url: input.beforeUrl,
    after_url: input.afterUrl,
    error: input.error,
    event_sequence_start: input.eventStart,
    event_sequence_end: input.eventEnd,
    artifacts: input.artifacts,
    completeness: stepCompleteness(input.artifacts, input.status),
});
const initialStep = async (input) => {
    const { session, scenario, elapsedMs, signal } = input;
    const artifacts = await session.capture(requestedForStep(scenario, 0), signal);
    return createStep({
        stepIndex: 0,
        stepId: BROWSER_SCENARIO_START_STEP_ID,
        action: "goto_start",
        status: "completed",
        elapsedMs,
        beforeUrl: session.sanitizeUrl(session.initialUrl),
        afterUrl: session.sanitizeUrl(session.currentUrl()),
        error: null,
        eventStart: 1,
        eventEnd: session.lastEventSequence(),
        artifacts,
    });
};
const executeStep = async (input) => {
    const { session, scenario, action, stepIndex, stoppedBy, signal } = input;
    const beforeUrl = session.sanitizeUrl(session.currentUrl());
    const eventStart = session.nextEventSequence();
    const requested = requestedForStep(scenario, stepIndex);
    if (stoppedBy !== undefined) {
        const error = notExecutedActionError(stoppedBy);
        return createStep({
            stepIndex,
            stepId: action.step_id,
            action: action.action,
            status: "cancelled",
            elapsedMs: 0,
            beforeUrl,
            afterUrl: beforeUrl,
            error,
            eventStart,
            eventEnd: session.lastEventSequence(),
            artifacts: unavailableArtifacts(requested, error),
        });
    }
    const actionStartedAt = performance.now();
    session.setStep(stepIndex);
    const requestCancelled = () => signal?.aborted === true;
    let outcome = {
        status: "completed",
        error: null,
    };
    if (requestCancelled()) {
        outcome = { status: "cancelled", error: "scenario request cancelled" };
    }
    else {
        try {
            await session.perform(action, signal);
        }
        catch (cause) {
            outcome = {
                status: requestCancelled() ? "cancelled" : "failed",
                error: session.redactError(cause),
            };
        }
    }
    const artifacts = outcome.status === "cancelled"
        ? unavailableArtifacts(requested, "scenario request cancelled")
        : await session.capture(requested, signal);
    return createStep({
        stepIndex,
        stepId: action.step_id,
        action: action.action,
        ...outcome,
        elapsedMs: Math.max(0, Math.round(performance.now() - actionStartedAt)),
        beforeUrl,
        afterUrl: session.sanitizeUrl(session.currentUrl()),
        eventStart,
        eventEnd: session.lastEventSequence(),
        artifacts,
    });
};
const globalCompleteness = (scenario, session, steps) => {
    const missing = steps.flatMap(({ completeness }) => completeness.missing_sections);
    const truncated = steps.flatMap(({ completeness }) => completeness.truncated_sections);
    if (session.mode === "connect")
        missing.push("events");
    if ((session.eventLimitations?.().length ?? 0) > 0)
        missing.push("events");
    if ((session.storageLimitations?.().length ?? 0) > 0)
        missing.push("storage");
    return classifyBrowserScenarioCompleteness(missing, truncated);
};
const runScenario = async (openSession, scenario, options, retainCleanup) => {
    if (options.signal?.aborted)
        throw new BrowserObservationError(OPERATION, "cancelled", {
            cause: options.signal.reason,
        });
    const startedAt = performance.now();
    const session = await openSession(scenario, {
        ...(options.signal === undefined ? {} : { signal: options.signal }),
        retainCleanup,
    });
    const steps = [];
    let operationOutcome = { ok: true };
    try {
        steps.push(await initialStep({
            session,
            scenario,
            elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
            signal: options.signal,
        }));
        let stoppedBy;
        for (const [offset, action] of scenario.actions.entries()) {
            const step = await executeStep({
                session,
                scenario,
                action,
                stepIndex: offset + 1,
                stoppedBy,
                signal: options.signal,
            });
            steps.push(step);
            if (stoppedBy === undefined && step.status !== "completed")
                stoppedBy = step.status;
        }
    }
    catch (cause) {
        operationOutcome = { ok: false, cause };
    }
    let cleanupOutcome;
    try {
        cleanupOutcome = { ok: true, cleanup: await session.close() };
    }
    catch (cause) {
        const cleanup = browserCleanupObservation(cause);
        const failure = new BrowserObservationError(OPERATION, "cleanup_failed", {
            cause,
            cleanup,
        });
        retainCleanup(session.cleanupLease);
        new AnalysisCleanupLeaseGroup(failure, [session.cleanupLease]);
        cleanupOutcome = { ok: false, cause: failure };
    }
    if (!cleanupOutcome.ok) {
        if (operationOutcome.ok && options.signal?.aborted)
            operationOutcome = {
                ok: false,
                cause: new AnalysisCancelledError(OPERATION, {
                    cause: options.signal.reason,
                }),
            };
        const cleanup = browserCleanupObservation(cleanupOutcome.cause);
        const partialObservation = {
            kind: "browser-scenario-observation",
            capture: browserScenarioCaptureData({
                session,
                scenario,
                startedAt,
                steps,
                cleanup: "incomplete",
                limitations: [
                    "Scenario observations are partial because browser cleanup could not be confirmed.",
                ],
            }),
        };
        if (!operationOutcome.ok)
            throw browserScenarioOperationFailure(operationOutcome.cause, partialObservation, { cause: cleanupOutcome.cause });
        const failure = new BrowserObservationError(OPERATION, "cleanup_failed", {
            cause: cleanupOutcome.cause,
            cleanup,
            partialObservation,
            detail: `Browser scenario cleanup could not be confirmed: ${cleanup.reason}. Collected steps and events are retained in partial_observation. Review the reported resources before retrying.`,
        });
        if (cleanupOutcome.cause instanceof AnalysisError &&
            cleanupOutcome.cause.cleanupIncomplete)
            failure.bindCleanupDependencies([cleanupOutcome.cause]);
        throw failure;
    }
    if (!operationOutcome.ok)
        throw browserScenarioOperationFailure(operationOutcome.cause, {
            kind: "browser-scenario-observation",
            capture: browserScenarioCaptureData({
                session,
                scenario,
                startedAt,
                steps,
                cleanup: cleanupOutcome.cleanup,
                limitations: [
                    "Scenario capture ended after an operation failed; uncollected steps are not represented.",
                ],
            }),
        });
    const completeness = globalCompleteness(scenario, session, steps);
    const capture = browserScenarioCaptureSchema.parse({
        ...browserScenarioCaptureData({
            session,
            scenario,
            startedAt,
            steps,
            cleanup: cleanupOutcome.cleanup,
        }),
        completeness,
    });
    if (signalIsAborted(options.signal))
        throw new AnalysisCancelledError(OPERATION, {
            cause: options.signal?.reason,
            partialObservation: {
                kind: "browser-scenario-observation",
                capture: {
                    ...capture,
                    limitations: [
                        ...capture.limitations,
                        "Scenario capture was cancelled; collected steps, observations, and cleanup state are retained.",
                    ],
                },
            },
        });
    return capture;
};
/** Controlled Playwright/CDP scenario driver with exact process ownership. */
export class PlaywrightBrowserScenarioProvider {
    openSession;
    #tail = Promise.resolve();
    #closing = false;
    #closePromise;
    #pendingCleanup = new Set();
    constructor(openSession) {
        this.openSession = openSession;
    }
    identity() {
        return PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY;
    }
    captureScenario(scenario, options = {}) {
        if (this.#closing)
            return Promise.resolve(err(this.#closedError()));
        const operation = this.#tail.then(() => this.#closing
            ? err(this.#closedError())
            : this.#captureScenario(scenario, options));
        this.#tail = operation.then(() => undefined, () => undefined);
        return operation;
    }
    async #captureScenario(scenario, options) {
        const pending = await this.#retryCleanup();
        if (pending !== undefined)
            return err(pending);
        const retained = [];
        try {
            return ok(await runScenario(this.openSession, scenario, options, (lease) => {
                this.#pendingCleanup.add(lease);
                retained.push(lease);
            }));
        }
        catch (cause) {
            const primary = cause instanceof AnalysisError
                ? cause
                : new ProviderAdapterError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, OPERATION, { cause });
            if (retained.length === 0)
                return err(primary);
            const cleanup = new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, retained.flatMap((lease) => lease.cleanupResources ?? []), { reason: "Browser scenario cleanup capabilities remain retained." }, { operation: OPERATION, cause });
            new AnalysisCleanupLeaseGroup(cleanup, retained);
            return err(analysisErrorWithCleanupFailure(primary, cleanup, OPERATION).bindCleanupDependencies([primary, cleanup]));
        }
    }
    async close() {
        this.#closing = true;
        this.#closePromise ??= this.#tail
            .then(async () => {
            const failure = await this.#retryCleanup();
            if (failure !== undefined)
                throw failure;
        })
            .catch((cause) => {
            this.#closePromise = undefined;
            throw cause;
        });
        return this.#closePromise;
    }
    #closedError() {
        return new BrowserObservationError(OPERATION, "cleanup_failed", {
            detail: "Browser scenario provider is closing.",
            cleanup: { reason: "Provider is closing", resources: [] },
        });
    }
    async #retryCleanup() {
        const failures = [];
        for (const pending of this.#pendingCleanup) {
            try {
                await withPlaywrightExecutionBoundary(() => pending.release(), PLAYWRIGHT_CLEANUP_CONFIRMATION_TIMEOUT_MS);
                this.#pendingCleanup.delete(pending);
            }
            catch (cause) {
                const failure = new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, pending.cleanupResources ?? [], { reason: cause instanceof Error ? cause.message : String(cause) }, { operation: OPERATION, cause });
                new AnalysisCleanupLeaseGroup(failure, [pending]);
                failures.push(failure);
            }
        }
        if (failures.length === 0)
            return undefined;
        if (failures.length === 1)
            return failures[0];
        return new ProviderCleanupError(PLAYWRIGHT_BROWSER_SCENARIO_PROVIDER_IDENTITY.id, failures.flatMap((failure) => failure.cleanupResources), { reason: "One or more browser scenario resources remain owned." }, {
            operation: OPERATION,
            cause: new AggregateError(failures, "Browser scenario cleanup failed"),
        }).bindCleanupDependencies(failures);
    }
}
