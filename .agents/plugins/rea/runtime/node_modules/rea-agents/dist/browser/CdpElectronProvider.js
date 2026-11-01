import { DEFAULT_ASAR_HEADER_ADMISSION, } from "../config/asarHeaderAdmission.js";
import { electronPageInspectionSchema, electronTargetListSchema, } from "../domain/javascript/electronObservation.js";
import { selectedCdpCommandTimeoutMs } from "../domain/browserDeadline.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { BrowserObservationError } from "../domain/browserObservationError.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err, ok } from "../domain/result.js";
import { discoverCdpEndpoint, hasCdpTargetWebSocket, } from "./CdpEndpoint.js";
import { closeCdpTargetSession, openCdpTargetSession, } from "./CdpTargetSession.js";
import { inspectCdpElectronPage } from "./CdpElectronInspection.js";
import { authorizedElectronFile, mapElectronFileAuthorizationFailure, retryElectronFileCleanup, } from "./ElectronFileScope.js";
import { CDP_ELECTRON_PROVIDER_IDENTITY } from "./providerIdentities.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { CdpTargetSessionOwner, bindCdpTransportCleanup, } from "./CdpTargetSessionOwner.js";
/** Passive Electron provider for local file pages exposed by loopback CDP. */
export class CdpElectronProvider {
    #owner = new CdpTargetSessionOwner();
    #asarHeaderAdmission;
    /** The admission comes from the composition root's environment; default otherwise. */
    constructor(asarHeaderAdmission = DEFAULT_ASAR_HEADER_ADMISSION) {
        this.#asarHeaderAdmission = asarHeaderAdmission;
    }
    #activeOperations = 0;
    #closing = false;
    #closePromise;
    #idleWaiters = new Set();
    async close() {
        if (this.#closePromise === undefined) {
            this.#closing = true;
            const attempt = this.#closeAfterOperations();
            let tracked;
            tracked = attempt.catch((cause) => {
                if (this.#closePromise === tracked)
                    this.#closePromise = undefined;
                throw cause;
            });
            this.#closePromise = tracked;
        }
        await this.#closePromise;
    }
    async #closeAfterOperations() {
        while (this.#activeOperations > 0)
            await new Promise((resolve) => this.#idleWaiters.add(resolve));
        const outcomes = await Promise.allSettled([
            this.#owner.close(),
            retryElectronFileCleanup(),
        ]);
        const failures = outcomes.flatMap((outcome) => outcome.status === "rejected" ? [outcome.reason] : []);
        const mapped = failures.map((failure) => mapElectronFileAuthorizationFailure(failure, CDP_ELECTRON_PROVIDER_IDENTITY.id, "inspect_electron_page") ?? failure);
        if (mapped.length === 1)
            throw mapped[0];
        if (mapped.length > 1) {
            const typed = mapped.filter((failure) => failure instanceof AnalysisError);
            throw new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, typed.flatMap((failure) => failure.cleanupResources), { reason: "Electron transport and file cleanup remain incomplete" }, {
                operation: "inspect_electron_page",
                cause: new AggregateError(mapped),
            }).bindCleanupDependencies(typed);
        }
    }
    identity() {
        return CDP_ELECTRON_PROVIDER_IDENTITY;
    }
    async listTargets(input, options = {}) {
        return await this.#withAdmission("list_electron_targets", async () => await this.#listTargets(input, options));
    }
    async #listTargets(input, options) {
        const allowed = [];
        let discovery;
        let unsupportedUrl = 0;
        let nonPage = 0;
        let unconnectable = 0;
        let examined = 0;
        try {
            discovery = await discoverCdpEndpoint(input.cdp_endpoint, "list_electron_targets", options.signal);
            throwIfElectronOperationCancelled(options.signal, "list_electron_targets");
            for (const target of discovery.targets) {
                throwIfElectronOperationCancelled(options.signal, "list_electron_targets");
                if (target.type !== "page") {
                    examined += 1;
                    nonPage += 1;
                    continue;
                }
                const path = await authorizedElectronFile(target.url, options.signal, "list_electron_targets", this.#asarHeaderAdmission);
                if (path === undefined) {
                    examined += 1;
                    unsupportedUrl += 1;
                    continue;
                }
                if (!hasCdpTargetWebSocket(discovery, target)) {
                    examined += 1;
                    unconnectable += 1;
                    continue;
                }
                examined += 1;
                allowed.push({
                    target_id: target.id,
                    type: target.type,
                    title: target.title,
                    file_path: path,
                    attached: target.attached,
                });
            }
            allowed.sort((left, right) => compareUnicodeCodePoints(left.target_id, right.target_id));
            throwIfElectronOperationCancelled(options.signal, "list_electron_targets");
            return ok(electronTargetListSchema.parse({
                browser: discovery.version,
                targets: allowed,
                excluded: {
                    unsupported_url: unsupportedUrl,
                    non_page: nonPage,
                },
                limitations: [
                    ...(discovery.limitations ?? []),
                    "Every local file page exposed by the selected loopback CDP endpoint is eligible for listing.",
                    ...(unconnectable === 0
                        ? []
                        : [
                            `${String(unconnectable)} otherwise allowed page target(s) lacked a validated direct CDP WebSocket and were excluded.`,
                        ]),
                    ...(allowed.some((target) => target.attached === null)
                        ? [
                            "CDP discovery omitted attachment state for one or more targets; attached is reported as unknown.",
                        ]
                        : []),
                ],
            }));
        }
        catch (cause) {
            const fileFailure = mapElectronFileAuthorizationFailure(cause, CDP_ELECTRON_PROVIDER_IDENTITY.id, "list_electron_targets", {
                completed_prefix: {
                    browser_version: discovery?.version ?? null,
                    examined_targets: examined,
                    discovered_targets: discovery?.targets.length ?? null,
                    allowed_targets: allowed,
                    excluded: {
                        unsupported_url: unsupportedUrl,
                        non_page: nonPage,
                    },
                    unconnectable_targets: unconnectable,
                    coverage: "partial: target authorization stopped; remaining targets are unknown",
                },
            });
            if (fileFailure !== undefined)
                return err(fileFailure);
            return err(options.signal?.aborted === true
                ? new AnalysisCancelledError("list_electron_targets", {
                    cause: options.signal.reason,
                    diagnostics: {
                        completed_prefix: {
                            browser_version: discovery?.version ?? null,
                            examined_targets: examined,
                            discovered_targets: discovery?.targets.length ?? null,
                            allowed_targets: allowed,
                            excluded: {
                                unsupported_url: unsupportedUrl,
                                non_page: nonPage,
                            },
                            unconnectable_targets: unconnectable,
                            coverage: "partial: target authorization stopped; remaining targets are unknown",
                        },
                    },
                })
                : providerError(cause, "list_electron_targets"));
        }
    }
    async inspectPage(input, options = {}) {
        return await this.#withAdmission("inspect_electron_page", async () => await this.#inspectPage(input, options));
    }
    async #inspectPage(input, options) {
        let targetSession;
        let cleanupFailure;
        let result;
        try {
            const discovery = await discoverCdpEndpoint(input.cdp_endpoint, "inspect_electron_page", options.signal);
            const target = await authorizeTarget(discovery.targets, input.target_id, this.#asarHeaderAdmission, options.signal);
            targetSession = await openCdpTargetSession(discovery, target, "inspect_electron_page", options.signal, {
                commandTimeoutMs: selectedCdpCommandTimeoutMs(input.command_timeout_ms),
            }, this.#owner);
            result = ok(electronPageInspectionSchema.parse(await inspectCdpElectronPage({
                connection: targetSession.connection,
                sessionId: targetSession.sessionId,
                discovery,
                target,
                input,
                asarHeaderAdmission: this.#asarHeaderAdmission,
                ...(options.signal === undefined ? {} : { signal: options.signal }),
                ...(options.progress === undefined
                    ? {}
                    : { progress: options.progress }),
            })));
        }
        catch (cause) {
            result = err(providerError(cause, "inspect_electron_page"));
        }
        finally {
            if (targetSession !== undefined)
                try {
                    await closeCdpTargetSession(targetSession, ["Debugger", "Runtime", "Page"], options.signal, this.#owner);
                }
                catch (cause) {
                    cleanupFailure =
                        cause instanceof AnalysisError
                            ? cause
                            : new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, [input.target_id], {
                                reason: cause instanceof Error ? cause.message : String(cause),
                            }, { operation: "inspect_electron_page", cause });
                }
        }
        const finalCancellation = result.ok && options.signal?.aborted === true
            ? new AnalysisCancelledError("inspect_electron_page", {
                cause: options.signal.reason,
                partialObservation: {
                    kind: "electron-page-observation",
                    inspection: result.value,
                    cleanup: cleanupFailure === undefined
                        ? "transport-closed"
                        : "incomplete",
                },
            })
            : undefined;
        if (cleanupFailure !== undefined) {
            if (finalCancellation !== undefined)
                return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(finalCancellation, cleanupFailure, "inspect_electron_page")));
            if (!result.ok)
                return err(bindCdpTransportCleanup(cleanupFailure, analysisErrorWithCleanupFailure(result.error, cleanupFailure, "inspect_electron_page")));
            return err(bindCdpTransportCleanup(cleanupFailure, new ProviderCleanupError(CDP_ELECTRON_PROVIDER_IDENTITY.id, cleanupFailure.cleanupResources, { cleanup_error: cleanupFailure.message }, {
                operation: "inspect_electron_page",
                cause: cleanupFailure,
                partialObservation: {
                    kind: "electron-page-observation",
                    inspection: result.value,
                    cleanup: "incomplete",
                },
            })));
        }
        if (!result.ok)
            return result;
        if (finalCancellation !== undefined)
            return err(finalCancellation);
        return result;
    }
    async #withAdmission(operation, work) {
        if (this.#closing)
            return err(new ProviderAdapterError(CDP_ELECTRON_PROVIDER_IDENTITY.id, operation, {
                diagnostics: { reason: "provider_closed" },
                userMessage: "Electron provider is closed to new observations.",
            }));
        this.#activeOperations += 1;
        try {
            return await work();
        }
        catch (cause) {
            return err(providerError(cause, operation));
        }
        finally {
            this.#activeOperations -= 1;
            if (this.#activeOperations === 0) {
                for (const resolve of this.#idleWaiters)
                    resolve();
                this.#idleWaiters.clear();
            }
        }
    }
}
const authorizeTarget = async (targets, targetId, asarHeaderAdmission, signal) => {
    throwIfElectronOperationCancelled(signal, "inspect_electron_page");
    const target = targets.find(({ id }) => id === targetId);
    if (target === undefined)
        throw new BrowserObservationError("inspect_web_page", "target_not_found");
    if (target.type !== "page")
        throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
    const path = await authorizedElectronFile(target.url, signal, "inspect_electron_page", asarHeaderAdmission);
    throwIfElectronOperationCancelled(signal, "inspect_electron_page");
    if (path === undefined)
        throw new BrowserObservationError("inspect_web_page", "target_not_allowed");
    return target;
};
const throwIfElectronOperationCancelled = (signal, operation) => {
    if (signal?.aborted === true)
        throw new AnalysisCancelledError(operation, { cause: signal.reason });
};
const providerError = (cause, operation) => {
    const fileFailure = mapElectronFileAuthorizationFailure(cause, CDP_ELECTRON_PROVIDER_IDENTITY.id, operation);
    if (fileFailure !== undefined)
        return fileFailure;
    return cause instanceof BrowserObservationError
        ? cause.forOperation(operation)
        : cause instanceof AnalysisError
            ? cause
            : new ProviderAdapterError(CDP_ELECTRON_PROVIDER_IDENTITY.id, operation, {
                cause,
            });
};
