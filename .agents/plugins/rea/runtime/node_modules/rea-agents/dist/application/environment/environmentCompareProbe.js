import { z } from "zod";
import { isJsonLike } from "../../domain/analysisView/EnvironmentManifestAccumulator.js";
import { primaryOrigin, } from "../../domain/analysisView/environmentManifestOrigin.js";
import { mediaTypeEssence, readRecordedRequestLine, } from "../../domain/analysisView/webNetworkRouteTemplates.js";
import { parseExactJson } from "../../domain/exactJsonNumber.js";
import { compareOffsetDateTimeInstants, offsetDateTimeInstantFromEpochMilliseconds, readRecordedDateTime, } from "../../domain/offsetDateTime.js";
import { recordedExchange, replayedBody, } from "./environmentSource.js";
/** Statuses whose answers carry no body, so a missing body is known to be empty. */
const BODYLESS_STATUSES = new Set([204, 205, 304]);
const startedSchema = z.object({ startedDateTime: z.string() });
const postDataSchema = z.object({
    request: z.object({
        postData: z.object({ mimeType: z.string(), text: z.string() }),
    }),
});
const methodSchema = z.object({ request: z.object({ method: z.string() }) });
const startedInstant = (record) => {
    const started = startedSchema.safeParse(record.reported);
    if (!started.success)
        return undefined;
    const reading = readRecordedDateTime(started.data.startedDateTime);
    if (reading !== undefined) {
        const { spelling } = reading;
        const offsetTimestamp = spelling.separator === "T" &&
            (spelling.zone === "Z" || spelling.zone.includes(":"));
        const clockTimestamp = spelling.secondsPresent && spelling.fractionDigits <= 9;
        if (offsetTimestamp || clockTimestamp)
            return reading.instant;
    }
    // Preserve native-Date admission for legacy spellings, at its original precision.
    const ms = Date.parse(started.data.startedDateTime);
    return Number.isFinite(ms)
        ? offsetDateTimeInstantFromEpochMilliseconds(ms)
        : undefined;
};
/** Whether a probe makes calls that carry a request body: a POST, PUT or PATCH. */
export const sendsBodies = (records) => records.some((record) => {
    const parsed = methodSchema.safeParse(record.reported);
    return (parsed.success &&
        ["POST", "PUT", "PATCH"].includes(parsed.data.request.method));
});
/** The JSON a request body holds, its text when it is not JSON, or undefined without one. */
export const requestBody = (record) => {
    const parsed = postDataSchema.safeParse(record.reported);
    if (!parsed.success)
        return undefined;
    const { mimeType, text } = parsed.data.request.postData;
    return isJsonLike(mediaTypeEssence(mimeType))
        ? (parseExactJson(text) ?? text)
        : text;
};
/** The application's answer as an environment answer carries it: JSON, text, or null when it is empty; a body the probe did not record is marked. */
const liveAnswer = (method, status, body) => {
    if (body.kind === "none")
        return method === "HEAD" || BODYLESS_STATUSES.has(status)
            ? { status, body }
            : { status, body, unobserved: true };
    if (body.kind === "text" && body.text === "")
        return { status, body: { kind: "none" } };
    return { status, body };
};
/** The origin a probe calls the application at, chosen as the manifest chooses its own. */
const probeOrigin = (lines) => {
    const origins = new Map();
    for (const line of lines.values()) {
        if (line?.kind !== "line")
            continue;
        const stats = origins.get(line.origin) ?? { records: 0, jsonLike: 0 };
        stats.records += 1;
        if (isJsonLike(mediaTypeEssence(line.rawMime)))
            stats.jsonLike += 1;
        origins.set(line.origin, stats);
    }
    return primaryOrigin(origins);
};
/** The probe's requests in the order they were made, each with the application's answer, and the records left uncompared. */
export const probeRequests = (records) => {
    const steps = [];
    const unobserved = [];
    // Without a start time for every record the probe keeps its recorded order, as state extraction does.
    const starts = new Map(records.map((record) => [record.ordinal, startedInstant(record)]));
    const timed = [...starts.values()].every((instant) => instant !== undefined);
    const ordered = [...records].sort((left, right) => (timed
        ? compareOffsetDateTimeInstants(starts.get(left.ordinal), starts.get(right.ordinal))
        : 0) || left.ordinal - right.ordinal);
    const lines = new Map(records.map((record) => [
        record.ordinal,
        readRecordedRequestLine(record.reported, true, () => true),
    ]));
    // Another origin's request goes to some other server, so it neither calls nor changes the environment.
    const origin = probeOrigin(lines);
    for (const record of ordered) {
        const line = lines.get(record.ordinal);
        const { ordinal } = record;
        if (line?.kind === "line" && line.origin !== origin)
            unobserved.push({ ordinal, reason: "other-origin" });
        else if (line?.kind !== "line")
            unobserved.push({
                ordinal,
                reason: line?.kind === "excluded" ? line.reason : "request-unavailable",
            });
        else {
            const exchange = recordedExchange(record, line);
            const request = {
                method: line.method,
                path: exchange.path,
                query: exchange.query,
                body: requestBody(record),
            };
            // A request whose answer was lost may still have changed the application, so it is made but not compared.
            if (exchange.status === null) {
                unobserved.push({ ordinal, reason: "no-response" });
                steps.push({ ordinal, request });
            }
            else
                steps.push({
                    ordinal,
                    request,
                    live: liveAnswer(line.method, exchange.status, replayedBody(exchange)),
                });
        }
    }
    return { steps, unobserved };
};
