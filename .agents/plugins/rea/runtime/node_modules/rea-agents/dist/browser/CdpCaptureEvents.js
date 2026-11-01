import { CdpCaptureCompleteness } from "./CdpCaptureCompleteness.js";
import * as bodyShapes from "./CdpCaptureEventBodyShapes.js";
import * as handlers from "./CdpCaptureEventHandlers.js";
import { isJsonMediaType } from "./CdpCaptureEventHelpers.js";
import { cdpStringValue, recordValue } from "./CdpCaptureValues.js";
/** Event accumulator that validates and normalizes payloads at ingestion. */
export class CdpCaptureEvents {
    #coverageStarts = new Map();
    #scriptMetadataBudgetExclusionsRecorded = false;
    #networkRequestOccurrences = new Map();
    #responseBodyExaminedOccurrences = new Map();
    scripts = new Map();
    scriptMetadataBudgetOmissionsById = new Map();
    rejectedScriptMetadataBudgetCount = 0;
    rejectedSourceMapMetadataBudgetCount = 0;
    scriptMetadataBytesById = new Map();
    retainedScriptMetadataBytes = 0;
    retainedEventBytes = 0;
    bodyShapeBytesByRequestId = new Map();
    executionContextFrames = new Map();
    network = new Map();
    networkRequestTimestamps = new Map();
    malformedRedirectRequestIds = new Set();
    missingRequestBodyShapeIds = new Set();
    webSocketConnectionsById = new Map();
    console = [];
    responseMetadata = [];
    agentHints = [];
    completeness = new CdpCaptureCompleteness([
        "network_requests",
        "console_events",
        "websocket_connections",
        "websocket_frames",
        "metadata",
    ]);
    originViolation = false;
    navigationDuringCapture = false;
    unknownRootIdentity = false;
    mainFrameId = undefined;
    committedDocument = undefined;
    input;
    allowedOrigins;
    constructor(input, allowedOrigins) {
        this.input = input;
        this.allowedOrigins = allowedOrigins;
    }
    beginAuthorizedFrame(frameId) {
        this.mainFrameId = frameId;
        this.#coverageStarts.clear();
        this.originViolation = false;
        this.navigationDuringCapture = false;
        this.unknownRootIdentity = false;
        this.committedDocument = undefined;
        this.scripts.clear();
        this.scriptMetadataBudgetOmissionsById.clear();
        this.rejectedScriptMetadataBudgetCount = 0;
        this.rejectedSourceMapMetadataBudgetCount = 0;
        this.scriptMetadataBytesById.clear();
        this.retainedScriptMetadataBytes = 0;
        this.retainedEventBytes = 0;
        this.bodyShapeBytesByRequestId.clear();
        this.#scriptMetadataBudgetExclusionsRecorded = false;
        this.executionContextFrames.clear();
        this.network.clear();
        this.networkRequestTimestamps.clear();
        this.#networkRequestOccurrences.clear();
        this.#responseBodyExaminedOccurrences.clear();
        this.malformedRedirectRequestIds.clear();
        this.missingRequestBodyShapeIds.clear();
        this.webSocketConnectionsById.clear();
        this.console.length = 0;
        this.responseMetadata.length = 0;
        this.agentHints.length = 0;
        this.completeness.reset();
        if (!this.input.include_console_text)
            this.completeness.exclude("console_text", "not_approved", null);
        if (!this.input.include_json_body_shapes)
            this.completeness.exclude("json_body_shapes", "not_approved", null);
        if (!this.input.include_websocket_shapes)
            this.completeness.exclude("websocket_shapes", "not_approved", null);
    }
    /** The first observed domain event or successful enable reply proves activity. */
    markDomainEnabled(domain) {
        if (!this.#coverageStarts.has(domain))
            this.#coverageStarts.set(domain, new Date().toISOString());
    }
    coverageStartedAt(domain) {
        const started = this.#coverageStarts.get(domain);
        if (started === undefined)
            throw new Error(`${domain} observation has not been enabled`);
        return started;
    }
    beginFinalCapture(frameId) {
        this.mainFrameId = frameId;
        // Deliberately does not clear `navigationDuringCapture`. A main-frame
        // navigation observed during the observation window means the page never
        // settled, and clearing the flag here reported the capture as clean while
        // carrying pre-navigation scripts, network and console into the inventory
        // of the new document. The caller now reports `target_changed` instead.
        // `committedDocument` is dropped so the new document's frame events are
        // compared against itself rather than the document we just left.
        this.committedDocument = undefined;
    }
    /** Record final script metadata omissions after all scriptParsed replacements. */
    recordScriptMetadataBudgetExclusions() {
        if (this.#scriptMetadataBudgetExclusionsRecorded)
            return;
        this.#scriptMetadataBudgetExclusionsRecorded = true;
        const omittedScripts = this.rejectedScriptMetadataBudgetCount;
        const omittedSourceMaps = this.rejectedSourceMapMetadataBudgetCount +
            this.scriptMetadataBudgetOmissionsById.size;
        if (omittedScripts > 0)
            this.completeness.exclude("scripts", "resource_budget_exhausted", omittedScripts);
        if (omittedSourceMaps > 0)
            this.completeness.exclude("source_maps", "resource_budget_exhausted", omittedSourceMaps);
    }
    ingest(event) {
        if (this.mainFrameId !== undefined) {
            if (event.method.startsWith("Network."))
                this.markDomainEnabled("Network");
            if (event.method.startsWith("Runtime."))
                this.markDomainEnabled("Runtime");
        }
        if (event.method === "Page.frameNavigated") {
            handlers.handleFrameNavigated(this, event.params);
            return;
        }
        const params = recordValue(event.params);
        if (params === undefined)
            return;
        switch (event.method) {
            case "Runtime.executionContextCreated":
                handlers.handleExecutionContextCreated(this, params);
                break;
            case "Runtime.executionContextDestroyed":
                handlers.handleExecutionContextDestroyed(this, params);
                break;
            case "Runtime.executionContextsCleared":
                this.executionContextFrames.clear();
                break;
            case "Debugger.scriptParsed":
                handlers.handleScriptParsed(this, params);
                break;
            case "Network.requestWillBeSent": {
                const requestId = cdpStringValue(params.requestId);
                const previous = requestId === undefined ? undefined : this.network.get(requestId);
                handlers.handleRequestWillBeSent(this, params);
                if (requestId !== undefined && this.network.get(requestId) !== previous)
                    this.#networkRequestOccurrences.set(requestId, (this.#networkRequestOccurrences.get(requestId) ?? 0) + 1);
                break;
            }
            case "Network.responseReceived":
                handlers.handleResponseReceived(this, params);
                break;
            case "Network.loadingFinished":
                handlers.handleLoadingFinished(this, params);
                break;
            case "Runtime.consoleAPICalled":
                handlers.handleConsoleAPICalled(this, params);
                break;
            case "Network.webSocketCreated":
                handlers.handleWebSocketCreated(this, params);
                break;
            case "Network.webSocketFrameSent":
                handlers.handleWebSocketFrame(this, params, "sent");
                break;
            case "Network.webSocketFrameReceived":
                handlers.handleWebSocketFrame(this, params, "received");
                break;
        }
    }
    /** Resolve a transient execution context to one already authorized frame. */
    frameForScript(script, allowedFrameIds) {
        return script.frameId !== null && allowedFrameIds.has(script.frameId)
            ? script.frameId
            : null;
    }
    responseBodyRequests() {
        if (!this.input.include_json_body_shapes)
            return [];
        return [...this.network.values()]
            .filter((request) => !this.malformedRedirectRequestIds.has(request.request_id))
            .filter((request) => isJsonMediaType(request.mime_type))
            .flatMap((request) => {
            const occurrence = this.#networkRequestOccurrences.get(request.request_id);
            return occurrence === undefined
                ? []
                : [{ requestId: request.request_id, occurrence }];
        });
    }
    currentResponseBodyRequest(candidate) {
        if (candidate.occurrence !==
            this.#networkRequestOccurrences.get(candidate.requestId))
            return undefined;
        return this.network.get(candidate.requestId);
    }
    responseBodyUnavailable(candidate) {
        if (this.currentResponseBodyRequest(candidate) === undefined)
            return;
        this.#responseBodyExaminedOccurrences.set(candidate.requestId, candidate.occurrence);
        if (this.malformedRedirectRequestIds.has(candidate.requestId))
            return;
        bodyShapes.updateResponseBodyShape(this, candidate.requestId, null);
        this.completeness.unavailable("json_body_shapes");
    }
    /**
     * Mark eligible response bodies that arrived after the fetch pass was
     * enumerated.
     */
    settleUnexaminedResponseBodies() {
        for (const candidate of this.responseBodyRequests()) {
            const request = this.currentResponseBodyRequest(candidate);
            if (request?.body_shapes.response === null &&
                this.#responseBodyExaminedOccurrences.get(candidate.requestId) !==
                    candidate.occurrence)
                this.responseBodyUnavailable(candidate);
        }
    }
    ingestResponseBody(candidate, value) {
        if (this.currentResponseBodyRequest(candidate) === undefined)
            return;
        this.#responseBodyExaminedOccurrences.set(candidate.requestId, candidate.occurrence);
        if (this.malformedRedirectRequestIds.has(candidate.requestId))
            return;
        bodyShapes.ingestResponseBodyShape(this, candidate.requestId, value);
    }
}
