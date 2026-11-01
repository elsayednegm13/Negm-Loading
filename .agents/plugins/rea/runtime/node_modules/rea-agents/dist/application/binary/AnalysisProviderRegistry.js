import { ProviderInspectionScope } from "../../providers/ProviderInspectionScope.js";
import { AnalysisCleanupLease } from "../../artifacts/AnalysisCleanupLease.js";
import { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import { ArtifactReaderFailure } from "../../artifacts/ArtifactReader.js";
import { bindArtifactFileCleanup } from "../../artifacts/ArtifactFileOperation.js";
import { SharedStartupAttempt } from "../../process/SharedStartupAttempt.js";
import { ProviderAdapterError } from "../../domain/providerAdapterError.js";
import { projectAnalysisError } from "../../domain/analysisErrorProjection.js";
import { ProviderCleanupError } from "../../domain/providerCleanupError.js";
import { analysisProviderIdSchema, analysisProviderSelectorSchema, } from "../../contracts/providerSelection.js";
import { AnalysisCancelledError, AnalysisUnsupportedTargetError, } from "../../domain/analysisErrorCore.js";
import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { ProviderSelectionError, } from "../../domain/providerSelectionError.js";
import { jsonObjectSchema, jsonValueSchema, } from "../../domain/jsonValue.js";
import { err, ok } from "../../domain/result.js";
import { evaluateAnalysisProviderCandidate, } from "./AnalysisProviderEvaluation.js";
import { compareUnicodeCodePoints } from "../../domain/unicodeCodePointOrder.js";
/**
 * Discover and select overlapping deep providers without starting their clients.
 * Registration order never affects selection or caller-visible output.
 */
export class AnalysisProviderRegistry {
    canInspectWithoutDeepProvider;
    #providers;
    #byId;
    #declaredOperations;
    #defaultSelector;
    #selections = new Set();
    #discoveries = new Set();
    #selectionCleanup = new Set();
    #profileResources = new ArtifactResourceScope();
    #profileOwner = {
        retain: (owner, resource) => this.#profileResources.retain({
            kind: "lease",
            resource,
            lease: AnalysisCleanupLease.forCloseOwner(owner, resource),
        }),
        run: (operation) => this.#profileResources.run(operation),
    };
    #closing;
    constructor(providers, defaultSelector = "auto", canInspectWithoutDeepProvider) {
        this.canInspectWithoutDeepProvider = canInspectWithoutDeepProvider;
        this.#defaultSelector =
            analysisProviderSelectorSchema.parse(defaultSelector);
        const byId = new Map();
        const declaredOperations = new Set();
        for (const provider of providers) {
            const identity = provider.identity();
            if (!analysisProviderIdSchema.safeParse(identity.id).success)
                throw new TypeError(`Invalid analysis provider ID: ${identity.id}`);
            if (byId.has(identity.id))
                throw new TypeError(`Duplicate analysis provider ID: ${identity.id}`);
            const providerOperations = new Set();
            for (const capability of provider.capabilities()) {
                if (capability.provider.id !== identity.id ||
                    capability.provider.name !== identity.name ||
                    capability.provider.version !== identity.version)
                    throw new TypeError(`Provider ${identity.id} published mismatched capability provenance for ${capability.operation}`);
                if (providerOperations.has(capability.operation))
                    throw new TypeError(`Provider ${identity.id} declares operation ${capability.operation} more than once`);
                providerOperations.add(capability.operation);
                declaredOperations.add(capability.operation);
            }
            byId.set(identity.id, provider);
        }
        this.#providers = Object.freeze([...providers].sort((left, right) => compareUnicodeCodePoints(left.identity().id, right.identity().id)));
        this.#byId = byId;
        this.#declaredOperations = Object.freeze([...declaredOperations].sort((left, right) => compareUnicodeCodePoints(left, right)));
    }
    /** Return the configured default without interpreting it as priority. */
    defaultSelector() {
        return this.#defaultSelector;
    }
    /** List configured candidate identities in canonical provider-ID order. */
    identities() {
        return this.#providers.map((provider) => structuredClone(provider.identity()));
    }
    /** Report retained candidate resources without retrying cleanup. */
    hasPendingOwnedResources() {
        return (this.#selections.size > 0 ||
            this.#discoveries.size > 0 ||
            this.#profileResources.hasPending ||
            [...this.#selectionCleanup].some((error) => error.cleanupIncomplete) ||
            this.#providers.some((provider) => provider.hasPendingOwnedResources?.() === true));
    }
    /** Close candidate-owned resources even when no target client was opened. */
    closeOwnedResources() {
        this.#closing ??= Promise.resolve()
            .then(() => this.#closeOwnedResources())
            .finally(() => {
            this.#closing = undefined;
        });
        return this.#closing;
    }
    async #closeOwnedResources() {
        const selections = [...this.#selections];
        const discoveries = [...this.#discoveries];
        for (const discovery of discoveries)
            discovery.close();
        for (const selection of selections)
            selection.close();
        await Promise.allSettled([
            ...discoveries.map((discovery) => discovery.promise),
            ...selections.map((selection) => selection.promise),
        ]);
        const failures = [];
        try {
            await this.#profileResources.retryCleanup();
        }
        catch (cause) {
            const cleanup = ArtifactReaderFailure.cleanupObservation(cause, "provider profile files");
            const failure = new ProviderCleanupError("rea", cleanup.resources, { reason: cleanup.reason }, { cause });
            bindArtifactFileCleanup(cause, failure);
            failures.push(failure);
        }
        for (const provider of this.#providers) {
            if (provider.closeOwnedResources === undefined)
                continue;
            const result = await provider.closeOwnedResources();
            if (!result.ok)
                failures.push(result.error);
        }
        for (const failure of this.#selectionCleanup) {
            if (failure.cleanupIncomplete)
                failures.push(failure);
            else
                this.#selectionCleanup.delete(failure);
        }
        const distinct = [...new Set(failures)];
        if (distinct.length === 0)
            return ok(null);
        if (distinct.length === 1)
            return err(distinct[0]);
        return err(new ProviderCleanupError("rea", [...new Set(distinct.flatMap((failure) => failure.cleanupResources))], { reason: distinct.map((failure) => failure.message).join("; ") }, { cause: new AggregateError(distinct) }).bindCleanupDependencies(distinct.filter((failure) => failure.cleanupIncomplete)));
    }
    /** List the unique deep-operation declarations without probing candidates. */
    declaredOperations() {
        return [...this.#declaredOperations];
    }
    /** Discover candidates for status without resolving profiles or starting clients. */
    async candidates(target, options = {}) {
        if (options.signal?.aborted)
            throw new AnalysisCancelledError("binary_session", {
                cause: options.signal.reason,
            });
        if (this.#closing !== undefined)
            return this.#providers.map((provider) => ({
                provider: structuredClone(provider.identity()),
                availability: {
                    status: "unknown",
                    code: null,
                    reason: "Provider ownership finalization is in progress; readiness has not been re-observed.",
                    diagnostics: { finalization: "in_progress" },
                },
                targetSupport: target === undefined
                    ? {
                        status: "unknown",
                        code: null,
                        reason: "No target is open.",
                        diagnostics: {},
                    }
                    : {
                        status: "unknown",
                        code: null,
                        reason: "Target support has not been re-observed during provider finalization.",
                        diagnostics: {},
                    },
                selected: false,
                capabilities: provider
                    .capabilities()
                    .map((capability) => structuredClone(capability)),
            }));
        const scope = new ProviderInspectionScope();
        const discovery = new SharedStartupAttempt((signal) => Promise.resolve().then(() => this.#discoverCandidates(target, {
            signal,
            scope,
            resourceScope: this.#profileOwner,
            operation: "binary_session",
        })), options.signal);
        this.#discoveries.add(discovery);
        try {
            const result = await discovery.promise;
            if (!result.ok)
                throw result.error;
            if (discovery.signal.aborted)
                throw new AnalysisCancelledError("binary_session", {
                    cause: discovery.signal.reason,
                    diagnostics: {
                        readiness_candidates: jsonValueSchema.parse(result.value),
                    },
                });
            return result.value;
        }
        finally {
            scope.close();
            this.#discoveries.delete(discovery);
        }
    }
    async #discoverCandidates(target, context) {
        const { signal, operation } = context;
        if (signal.aborted)
            return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
        const results = await Promise.allSettled(this.#providers.map((provider) => candidateStatus(provider, target, context)));
        const statuses = [];
        const failures = [];
        for (const [index, result] of results.entries()) {
            if (result.status === "fulfilled")
                statuses.push(result.value);
            else
                failures.push({
                    providerId: this.#providers[index].identity().id,
                    error: result.reason instanceof AnalysisError
                        ? result.reason
                        : new ProviderAdapterError(this.#providers[index].identity().id, operation, { cause: result.reason }),
                });
        }
        for (const { error } of failures)
            if (error.cleanupIncomplete)
                this.#selectionCleanup.add(error);
        if (failures.length > 0)
            return err(providerInspectionFailure(failures, { operation, candidates: statuses }, signal));
        return ok(statuses);
    }
    /** Select one whole deep-operation family for a parsed target. */
    async select(target, requestedSelector, options = {}) {
        if (signalIsAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        if (this.#closing !== undefined) {
            const closed = await this.#closing;
            if (!closed.ok)
                return closed;
        }
        for (const failure of this.#selectionCleanup)
            if (!failure.cleanupIncomplete)
                this.#selectionCleanup.delete(failure);
        if ([...this.#selectionCleanup].some((failure) => failure.cleanupIncomplete)) {
            // A retry may release retained owners; never stop another live selection
            // merely because a new caller wants admission.
            if (this.#selections.size > 0 || this.#discoveries.size > 0)
                return err([...this.#selectionCleanup].find((failure) => failure.cleanupIncomplete));
            const closed = await this.closeOwnedResources();
            if (!closed.ok)
                return closed;
        }
        if (signalIsAborted(options.signal))
            return err(new AnalysisCancelledError("open_binary", {
                cause: options.signal?.reason,
            }));
        const selection = new SharedStartupAttempt((signal) => Promise.resolve().then(() => this.#selectTarget(target, requestedSelector, signal)), options.signal);
        this.#selections.add(selection);
        void selection.promise.then((result) => {
            this.#selections.delete(selection);
            if (!result.ok && result.error.cleanupIncomplete)
                this.#selectionCleanup.add(result.error);
        }, () => {
            this.#selections.delete(selection);
        });
        const waited = await selection.wait(options.signal);
        if (waited.status !== "cancelled") {
            if (!waited.value.ok)
                return waited.value;
            if (!selection.signal.aborted)
                return waited.value;
            return err(new AnalysisCancelledError("open_binary", {
                cause: selection.signal.reason,
            }));
        }
        return err(new AnalysisCancelledError("open_binary", {
            cause: options.signal?.reason,
        }));
    }
    async #selectTarget(target, requestedSelector, signal) {
        const scope = new ProviderInspectionScope();
        try {
            if (signalIsAborted(signal))
                return err(new AnalysisCancelledError("open_binary", { cause: signal.reason }));
            const discovery = await this.#discoverCandidates(target, {
                signal,
                scope,
                resourceScope: this.#profileOwner,
                operation: "open_binary",
            });
            if (!discovery.ok)
                return discovery;
            const baseline = discovery.value;
            const parsedRequest = requestedSelector === undefined
                ? undefined
                : analysisProviderSelectorSchema.safeParse(requestedSelector);
            if (parsedRequest !== undefined && !parsedRequest.success)
                return err(selectionError("invalid_options", typeof requestedSelector === "string"
                    ? requestedSelector
                    : "<invalid>", baseline));
            const request = parsedRequest?.data;
            const selector = request ?? this.#defaultSelector;
            if (signalIsAborted(signal))
                return err(new AnalysisCancelledError("open_binary", { cause: signal.reason }));
            if (selector === "auto" && this.canInspectWithoutDeepProvider?.(target))
                return ok({
                    requestedProviderId: selector,
                    binding: null,
                    candidates: baseline,
                });
            if (request === undefined &&
                this.#byId.has(selector) &&
                baseline.length > 0 &&
                baseline.every(({ targetSupport }) => targetSupport.status === "unsupported"))
                return ok({
                    requestedProviderId: selector,
                    binding: null,
                    candidates: baseline,
                });
            if (selector !== "auto")
                return await this.#selectConcrete({
                    target,
                    baseline,
                    signal: signal,
                    scope,
                }, selector, request === undefined ? "environment" : "request");
            return await this.#selectAutomatically({
                target,
                baseline,
                signal: signal,
                scope,
            });
        }
        finally {
            scope.close();
        }
    }
    /** Explain why a deep operation is unavailable on an unbound target. */
    unboundOperationError(operation, selection) {
        const reason = selection.candidates.length > 0 &&
            selection.candidates.every(({ targetSupport }) => targetSupport.status === "unsupported")
            ? "target_unsupported"
            : "provider_unavailable";
        return selectionError(reason, selection.requestedProviderId, selection.candidates, {
            operation,
        });
    }
    async #selectConcrete(context, providerId, source) {
        const { baseline, signal, target, scope } = context;
        const provider = this.#byId.get(providerId);
        if (provider === undefined)
            return err(selectionError("unknown_provider", providerId, baseline));
        const initial = baseline.find(({ provider: identity }) => identity.id === providerId);
        if (initial === undefined)
            throw new TypeError("Registered provider is absent from discovery output");
        if (initial.targetSupport.status === "unsupported")
            return err(selectionError("target_unsupported", providerId, baseline));
        if (initial.availability.status === "unavailable")
            return err(selectionError("provider_unavailable", providerId, baseline));
        if (initial.targetSupport.status === "unknown")
            return err(selectionError("provider_unavailable", providerId, baseline));
        const evaluation = await evaluateAnalysisProviderCandidate(provider, initial, target, { signal, resourceScope: this.#profileOwner, scope });
        if (!evaluation.ok)
            return evaluation;
        const evaluated = evaluation.value;
        const statuses = replaceCandidate(baseline, evaluated.status);
        const refusal = evaluated.profileError;
        // A selected provider refusing the target is a selection outcome that keeps the
        // refusal's reason, recovery and evidence; unconfirmed cleanup stays with the refusal.
        if (refusal instanceof AnalysisUnsupportedTargetError &&
            !refusal.cleanupIncomplete)
            return err(selectionError("target_unsupported", providerId, statuses, {
                refusal: {
                    userMessage: refusal.message,
                    ...(refusal.remediationAction === undefined
                        ? {}
                        : { remediationAction: refusal.remediationAction }),
                    capturedOutput: refusal.capturedOutput,
                    diagnostics: refusal.diagnostics,
                    partialObservation: refusal.partialObservation,
                    cause: refusal,
                },
            }));
        if (refusal !== undefined)
            return err(refusal);
        if (evaluated.profile === undefined)
            return err(selectionError("provider_unavailable", providerId, statuses));
        return ok(selectedResult(providerId, source, {
            ...evaluated,
            profile: evaluated.profile,
        }, statuses));
    }
    async #selectAutomatically(context) {
        const { baseline, signal, target, scope } = context;
        const results = await Promise.all(this.#providers.map(async (provider) => {
            const status = baseline.find(({ provider: identity }) => identity.id === provider.identity().id);
            if (status === undefined)
                throw new TypeError("Registered provider is absent from discovery output");
            return status.availability.status === "available" &&
                status.targetSupport.status === "supported"
                ? evaluateAnalysisProviderCandidate(provider, status, target, {
                    signal,
                    resourceScope: this.#profileOwner,
                    scope,
                })
                : ok({
                    candidate: provider,
                    status,
                });
        }));
        const evaluations = results.flatMap((result) => result.ok ? [result.value] : []);
        const failures = results.flatMap((result, index) => {
            const error = result.ok ? result.value.profileError : result.error;
            return error === undefined
                ? []
                : [{ providerId: this.#providers[index].identity().id, error }];
        });
        if (results.some((result) => !result.ok) ||
            failures.some(({ error }) => error.cleanupIncomplete) ||
            signalIsAborted(signal))
            return err(providerInspectionFailure(failures, { operation: "resolve_analysis_profile" }, signal));
        const statuses = evaluations.map(({ status }) => status);
        const usable = evaluations.filter((evaluation) => evaluation.profile !== undefined);
        if (usable.length === 0)
            return ok({
                requestedProviderId: "auto",
                binding: null,
                candidates: statuses,
            });
        if (usable.length > 1)
            return err(selectionError("ambiguous", "auto", usable.map(({ status }) => status), { rejectionCandidates: statuses }));
        const selected = usable[0];
        if (selected === undefined)
            throw new TypeError("Usable provider selection disappeared");
        return ok(selectedResult("auto", "auto-single-candidate", selected, statuses));
    }
}
const candidateStatus = async (provider, target, context) => {
    const { signal, scope, resourceScope, operation } = context;
    if (signal.aborted)
        throw new AnalysisCancelledError(operation, { cause: signal.reason });
    const readiness = provider.inspectReadinessSnapshot === undefined
        ? {
            availability: await provider.inspectAvailability({
                signal,
                scope,
                resourceScope,
            }),
            capabilities: provider.capabilities(),
        }
        : await provider.inspectReadinessSnapshot({
            signal,
            scope,
            resourceScope,
        });
    return await projectCandidateStatus(provider, target, readiness, {
        signal,
        scope,
        resourceScope,
    });
};
const projectCandidateStatus = async (provider, target, readiness, options) => {
    return {
        provider: structuredClone(provider.identity()),
        availability: cloneAvailability(readiness.availability),
        targetSupport: target === undefined
            ? {
                status: "unknown",
                code: null,
                reason: "No target is open.",
                diagnostics: {},
            }
            : cloneTargetSupport(await (provider.inspectTargetSupportWithOptions?.(target, options) ?? provider.inspectTargetSupport(target))),
        selected: false,
        capabilities: readiness.capabilities.map((capability) => structuredClone(capability)),
    };
};
const signalIsAborted = (signal) => signal?.aborted === true;
const selectedResult = (requestedProviderId, source, evaluated, statuses) => {
    const identity = evaluated.profile.provider;
    const capabilities = evaluated.status.capabilities.map((capability) => ({
        ...capability,
        provider: structuredClone(identity),
    }));
    const selectedStatus = {
        ...evaluated.status,
        provider: structuredClone(identity),
        selected: true,
        capabilities,
    };
    return {
        requestedProviderId,
        binding: {
            provider: evaluated.candidate,
            identity: structuredClone(identity),
            selectionSource: source,
            profile: structuredClone(evaluated.profile),
            ...(evaluated.createClient === undefined
                ? {}
                : { createClient: evaluated.createClient }),
            capabilities,
        },
        candidates: replaceCandidate(statuses, selectedStatus),
    };
};
const replaceCandidate = (statuses, replacement) => statuses.map((status) => status.provider.id === replacement.provider.id ? replacement : status);
const selectionError = (reason, requestedProviderId, candidateChoices, options = {}) => new ProviderSelectionError({
    ...options.refusal,
    operation: options.operation ?? "open_binary",
    reason,
    requestedProviderId,
    candidateIds: candidateChoices.map(({ provider }) => provider.id),
    rejections: candidateRejections(options.rejectionCandidates ?? candidateChoices),
});
const candidateRejections = (candidates) => candidates.flatMap((candidate) => [
    ...(candidate.availability.status === "unavailable"
        ? [candidate.availability]
        : []),
    ...(candidate.targetSupport.status === "unsupported"
        ? [candidate.targetSupport]
        : []),
].map((rejection) => ({
    providerId: candidate.provider.id,
    code: rejection.code,
    reason: rejection.reason,
    diagnostics: structuredClone(rejection.diagnostics),
})));
const cloneAvailability = (availability) => ({
    ...availability,
    diagnostics: jsonObjectSchema.parse(availability.diagnostics),
});
const cloneTargetSupport = (support) => ({
    ...support,
    diagnostics: jsonObjectSchema.parse(support.diagnostics),
});
/** Every terminal child remains attributed; cleanup is conjunctive across owners. */
const providerInspectionFailure = (failures, context, signal) => {
    const primary = failures.find(({ error }) => !(error instanceof AnalysisCancelledError)) ??
        failures[0];
    if (primary === undefined)
        return new AnalysisCancelledError(context.operation === "resolve_analysis_profile"
            ? "open_binary"
            : context.operation, { cause: signal?.reason });
    if (failures.length === 1 &&
        (context.operation === "resolve_analysis_profile" ||
            context.candidates.length === 0))
        return primary.error;
    const cleanupFailures = failures
        .filter(({ error }) => error.cleanupIncomplete)
        .map(({ error }) => error);
    const options = {
        diagnostics: {
            [context.operation === "resolve_analysis_profile"
                ? "profile_errors"
                : "readiness_errors"]: failures.map(({ providerId, error }) => ({
                provider_id: providerId,
                error: projectAnalysisError(error),
            })),
            ...(context.operation === "resolve_analysis_profile"
                ? {}
                : { readiness_candidates: jsonValueSchema.parse(context.candidates) }),
        },
        ...(primary.error.capturedOutput === undefined
            ? {}
            : { capturedOutput: primary.error.capturedOutput }),
        ...(primary.error.partialObservation === undefined
            ? {}
            : { partialObservation: primary.error.partialObservation }),
        ...(cleanupFailures.length === 0
            ? {}
            : {
                cleanupPrimary: primary.error,
                cleanup: {
                    reason: cleanupFailures.map((error) => error.message).join("; "),
                    resources: [
                        ...new Set(cleanupFailures.flatMap((error) => error.cleanupResources)),
                    ],
                },
            }),
    };
    const failure = primary.error instanceof AnalysisCancelledError
        ? new AnalysisCancelledError(context.operation === "resolve_analysis_profile"
            ? "open_binary"
            : context.operation, {
            ...options,
            cause: primary.error.cause,
        })
        : new ProviderAdapterError("rea", context.operation, {
            ...options,
            userMessage: projectAnalysisError(primary.error).message,
            cause: new AggregateError(failures.map(({ error }) => error), "Provider inspections failed", { cause: primary.error }),
        });
    return failure.bindCleanupDependencies(cleanupFailures);
};
