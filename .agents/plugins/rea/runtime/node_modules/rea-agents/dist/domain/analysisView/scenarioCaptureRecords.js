import { AnalysisUnsupportedTargetError } from "../analysisErrorCore.js";
import { retainedBrowserScenarioCaptureSchema, } from "../browserScenarioCapture.js";
import { indexBrowserScenarioTransactions, } from "../browserScenarioTransactions.js";
import { err, ok } from "../result.js";
import { analysisViewResultInputError } from "./analysisViewParent.js";
import { ENTRY_BYTES, textBytes } from "./webNetworkRouteTemplates.js";
/** The one content event of an exchange phase, or undefined when absent or ambiguous. */
const onlyContent = (index, sequence) => {
    const found = sequence === undefined ? undefined : index.contents.get(sequence);
    return found?.length === 1 ? found[0] : undefined;
};
const headerValue = (headers, name) => {
    if (headers?.state !== "captured")
        return undefined;
    const item = headers.items.find((candidate) => candidate.name.toLowerCase() === name);
    return item?.value ?? undefined;
};
const captured = (content) => content?.body.state === "captured" ? content.body : undefined;
/** A captured response body, unless redaction emptied it because a secret could not be cut out. */
const retainedBody = (content) => {
    const body = captured(content);
    return body?.redacted === true && body.bytes === 0 ? undefined : body;
};
/** Strictly decoded text, keeping a byte-order mark; undefined for bytes that are not UTF-8. */
const utf8Text = (body) => {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(Buffer.from(body.content, "base64"));
    }
    catch {
        return undefined;
    }
};
/** A content event's media type: its captured body's, else its retained Content-Type value. */
export const scenarioContentMediaType = (content) => captured(content)?.media_type ??
    headerValue(content?.headers, "content-type");
/** The request object HAR readers expect; a redacted URL is withheld so no path is templated from it. */
const reportedRequest = (request, content, purpose) => {
    const body = purpose === "manifest" ? captured(content) : undefined;
    const text = body === undefined ? undefined : utf8Text(body);
    const mimeType = scenarioContentMediaType(content);
    return {
        method: request.method,
        bodySize: body !== undefined && !body.redacted ? body.bytes : -1,
        url: request.url.redacted ? null : request.url.url,
        ...(text === undefined || mimeType === undefined
            ? {}
            : { postData: { mimeType, text } }),
    };
};
/** Each transaction's browser-reported start and duration, from its single finished or failed event. */
const timingByTransaction = (events) => {
    const timing = new Map();
    for (const event of events) {
        if (event.kind !== "request-finished" && event.kind !== "request-failed")
            continue;
        // A transaction ending twice has no single start or duration.
        timing.set(event.transaction_id, timing.has(event.transaction_id)
            ? {}
            : { started_at: event.started_at, elapsed_ms: event.elapsed_ms });
    }
    return timing;
};
/**
 * HAR timing for a record: the browser's start when it reported one, else when the request was observed, and the
 * browser's duration (0 when it reported none).
 */
const recordTiming = (request, timing) => {
    const browser = timing.get(request.transaction_id);
    const started = browser?.started_at ?? request.observed_at;
    return started === undefined
        ? undefined
        : { startedDateTime: started, time: browser?.elapsed_ms ?? 0 };
};
const record = (ordinal, observed, index, purpose, timing) => {
    const { item, event: request } = observed;
    const location = {
        kind: "json-pointer",
        pointer: `/events/items/${String(item)}`,
    };
    const empty = {
        binary_fields: [],
        numeric_literals: [],
        redactions: [],
        limitations: [],
    };
    const responses = index.responses.get(request.transaction_id) ?? [];
    const response = responses.length === 1 ? responses[0] : undefined;
    // One request, at most one response and one content event per phase: otherwise the
    // transaction cannot be attributed and is left unrepresented.
    if (index.requestCounts.get(request.transaction_id) !== 1 ||
        responses.length > 1 ||
        (index.contents.get(request.sequence)?.length ?? 0) > 1 ||
        (response !== undefined &&
            (index.contents.get(response.sequence)?.length ?? 0) > 1))
        return {
            record: { ordinal, location, reported: {}, ...empty },
            responseBody: "absent",
        };
    const requestContent = onlyContent(index, request.sequence);
    const responseContent = onlyContent(index, response?.sequence);
    const body = retainedBody(responseContent);
    const mimeType = scenarioContentMediaType(responseContent) ?? "";
    return {
        record: {
            ordinal,
            location,
            reported: {
                ...timing,
                request: reportedRequest(request, requestContent, purpose),
                ...(response === undefined
                    ? {}
                    : {
                        response: {
                            status: response.status,
                            content: body === undefined
                                ? { mimeType }
                                : { mimeType, text: body.content, encoding: "base64" },
                        },
                    }),
            },
            ...empty,
            binary_fields: body === undefined
                ? []
                : [
                    {
                        pointer: "/response/content/text",
                        representation: "har-base64-content",
                        state: "retained",
                        bytes: body.bytes,
                        sha256: body.sha256,
                        content_base64: body.content,
                    },
                ],
        },
        responseBody: body === undefined ? "absent" : body.redacted ? "redacted" : "retained",
    };
};
/** Project each network transaction, in request order, as one record; the ordinal is its zero-based position. */
export const scenarioCaptureRecords = (capture, purpose) => {
    const index = indexBrowserScenarioTransactions(capture.events.items);
    const timings = timingByTransaction(capture.events.items);
    const records = [];
    const responseBodies = new Map();
    let timed = false;
    for (const [item, event] of capture.events.items.entries()) {
        if (event.kind !== "request")
            continue;
        const timing = recordTiming(event, timings);
        timed ||= timing !== undefined;
        const projected = record(records.length, { event, item }, index, purpose, timing);
        records.push(projected.record);
        if (purpose === "manifest")
            responseBodies.set(projected.record.ordinal, projected.responseBody);
    }
    return {
        records,
        totalRecords: records.length,
        responseBodies,
        limitations: [
            "Scenario records are the capture's network transactions in request order; each record ordinal is the transaction's zero-based position.",
            ...(timed
                ? [
                    "Scenario record start times are the browser's own, from when the request ended, or when the provider observed the request where the browser reported none; durations are the browser's own, or 0 where it reported none.",
                ]
                : []),
            ...(capture.events.dropped > 0
                ? [
                    `The scenario capture omitted ${String(capture.events.dropped)} events; the manifest covers only retained transactions.`,
                ]
                : []),
        ],
    };
};
/** An own data member of admitted parent data; the clone admission already refused accessors. */
const member = (value, key) => typeof value === "object" && value !== null && Object.hasOwn(value, key)
    ? value[key]
    : undefined;
/**
 * Bytes the manifest derives from a borrowed scenario: validation decodes and re-encodes one body at
 * a time (two bytes per base64 character), and projection keeps the decoded text of every request
 * body. Response bodies stay borrowed, as HAR response text does; retention metadata is keyed
 * by each request ordinal.
 */
const derivedTextBytes = (value) => {
    const items = member(member(value, "events"), "items");
    let largestBody = 0;
    let requestText = 0;
    let responseBodyEntries = 0;
    // Each event is read on its own, so a body without content leaves the others counted.
    for (const event of Array.isArray(items) ? items : []) {
        if (member(event, "kind") === "request")
            responseBodyEntries += 1;
        const content = member(member(event, "body"), "content");
        if (member(event, "kind") !== "network-content" ||
            typeof content !== "string")
            continue;
        largestBody = Math.max(largestBody, content.length);
        if (member(event, "phase") === "request")
            requestText += textBytes(Math.ceil((content.length * 3) / 4));
    }
    return 64 + largestBody * 2 + requestText + responseBodyEntries * ENTRY_BYTES;
};
/** Admit a capture_browser_scenario parent whose network content identifies response media types; state also needs bodies. */
export const admitScenarioCaptureParent = (parent, viewKind, accumulator) => {
    const admitted = accumulator.admitCaptureClone(parent.normalizedResult);
    if (!admitted.ok)
        return admitted;
    // Reserve body validation and request text before either allocation, even for a parent read from
    // a file, without charging the borrowed response bodies a large capture is made of.
    const derived = accumulator.admitDerivedBytes(derivedTextBytes(parent.normalizedResult));
    if (!derived.ok)
        return derived;
    const parsed = retainedBrowserScenarioCaptureSchema.safeParse(parent.normalizedResult);
    if (!parsed.success)
        return err(analysisViewResultInputError(parent.normalizedResult, parsed.error));
    const content = parsed.data.scenario.network_content;
    // Tools are chosen by response media type, which only bodies or header values carry; state is read from bodies.
    if (viewKind === "environment-state"
        ? !content.response_body
        : !content.response_body && !content.header_values)
        return err(new AnalysisUnsupportedTargetError("inspect_analysis_view", parent.evidenceId, viewKind === "environment-state"
            ? "environment-state needs a capture_browser_scenario capture with capture.network.response_body selected."
            : "environment-manifest needs a capture_browser_scenario capture with capture.network.response_body or header_values selected."));
    return ok(scenarioCaptureRecords(parsed.data, "manifest"));
};
