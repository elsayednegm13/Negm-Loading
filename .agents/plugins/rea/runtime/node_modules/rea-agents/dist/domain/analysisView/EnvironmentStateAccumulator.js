import { z } from "zod";
import { parseExactJson } from "../exactJsonNumber.js";
import { MAX_JSON_DEPTH } from "../jsonValue.js";
import { compareOffsetDateTimeInstants, readRecordedDateTime, } from "../offsetDateTime.js";
import { ok } from "../result.js";
import { WEB_NETWORK_CAPTURE_LIMITS, } from "../webNetworkCapture.js";
import { EnvironmentManifestAccumulator, isJsonLike, } from "./EnvironmentManifestAccumulator.js";
import { EnvironmentStateExtraction } from "./EnvironmentStateExtraction.js";
import { deeperThan, hasPrototypeKey, isStateWrite, STATE_BODY_LIMIT_BYTES, } from "./environmentStateRules.js";
import { base64PrefixChars, readRecordedResponseBody, recordedResponseBodyIsEmpty, } from "./recordedResponseBody.js";
import { ENTRY_BYTES, RECORD_SCRATCH_BYTES, mediaTypeEssence, readRecordedRequestLine, textBytes, } from "./webNetworkRouteTemplates.js";
/**
 * Levels the state's own nesting adds above a recorded value: Evidence, a `data/get` reply and a
 * JSON-RPC response hold a body's members about ten levels down, so a body must leave this much
 * room under the JSON depth limit to be sealed and served.
 */
const STATE_NESTING_DEPTH = 16;
/** A recorded response body as state JSON: a JSON-like media type, complete UTF-8 text within the state body limit, exact numbers and no `__proto__` member; otherwise undefined. */
export const stateBodyJson = (contentType, body) => {
    if (contentType === null ||
        !isJsonLike(mediaTypeEssence(contentType)) ||
        body.bodyText === null ||
        body.bodyEncoding === "base64" ||
        body.bodyCut === true ||
        Buffer.byteLength(body.bodyText, "utf8") > STATE_BODY_LIMIT_BYTES)
        return undefined;
    const value = parseExactJson(body.bodyText);
    return value === undefined ||
        hasPrototypeKey(value) ||
        deeperThan(value, MAX_JSON_DEPTH - STATE_NESTING_DEPTH)
        ? undefined
        : value;
};
const timingSchema = z.object({
    startedDateTime: z.string(),
    time: z.number().nonnegative(),
});
const redactedWriteSchema = z.object({
    request: z.object({ method: z.string() }),
    response: z.object({ status: z.number() }).optional(),
});
const contentSchema = z.object({
    response: z.object({ content: z.object({ text: z.string() }) }),
});
const requestSchema = z.object({
    request: z.object({
        postData: z.unknown().optional(),
        bodySize: z.number().optional(),
    }),
});
const requestContentSchema = z.object({
    mimeType: z.string(),
    text: z.string(),
    params: z.array(z.unknown()).optional(),
});
const UNKNOWNS = [
    {
        kind: "authorization-model",
        statement: "Authorization headers and cookies are structurally excluded from captures; the state states no authorization model.",
    },
    {
        kind: "response-semantics",
        statement: "Views reproduce their recorded responses from the state; they do not establish how the application computes responses, derived values or values copied outside entity objects.",
    },
    {
        kind: "state-transition",
        statement: "The state is one snapshot from before the first related recorded write; write effects are modelled only from the calls the capture recorded, and served only where its later reads confirmed them.",
    },
];
/** The manifest's grouping plus the record facts and bodies the init state is extracted from. */
export class EnvironmentStateAccumulator extends EnvironmentManifestAccumulator {
    #entries = new Map();
    #bodyReleases = [];
    constructor(maximumBytes = WEB_NETWORK_CAPTURE_LIMITS.outputBytes, rules = []) {
        super(maximumBytes, true, rules, "Environment-state");
    }
    /** The state publishes no body shapes. */
    get reportsBodyShapes() {
        return false;
    }
    add(record, scenarioResponseBody) {
        const grouped = super.add(record, scenarioResponseBody);
        if (!grouped.ok)
            return grouped;
        try {
            const line = readRecordedRequestLine(record.reported, true, this.scratch);
            if (line === null)
                return this.overBudget();
            const timing = timingSchema.safeParse(record.reported);
            // Admit normalization and fraction parsing before materializing their strings.
            if (timing.success &&
                !this.scratch(RECORD_SCRATCH_BYTES +
                    textBytes(timing.data.startedDateTime.length + 6) * 3))
                return this.overBudget();
            const startInstant = timing.success
                ? readRecordedDateTime(timing.data.startedDateTime)?.instant
                : undefined;
            // Keep the established millisecond interval policy independently of sorting.
            const start = startInstant === undefined
                ? record.ordinal
                : startInstant.epochSecond * 1000 +
                    Number(startInstant.fraction.slice(0, 3).padEnd(3, "0"));
            // A fraction substring may retain its normalized timestamp's backing store,
            // including trailing zeroes removed from the exact comparison value.
            const instantBytes = timing.success && startInstant !== undefined
                ? ENTRY_BYTES + textBytes(timing.data.startedDateTime.length + 6)
                : 0;
            if (line.kind === "excluded")
                return line.reason === "url-redacted"
                    ? this.#redactedWrite(record, timing.success && startInstant !== undefined
                        ? {
                            start,
                            end: start + timing.data.time,
                            startInstant,
                            instantBytes,
                        }
                        : undefined)
                    : ok(undefined);
            // The entry keeps the line's strings and a reference to the already admitted record.
            if (!this.retain(ENTRY_BYTES * 8 +
                instantBytes +
                textBytes(line.method.length +
                    line.origin.length +
                    line.path.length +
                    (line.query?.length ?? 0) +
                    line.rawMime.length)))
                return this.overBudget();
            this.#entries.set(record.ordinal, {
                facts: {
                    ordinal: record.ordinal,
                    method: line.method,
                    path: line.path,
                    query: line.query === "" ? undefined : line.query,
                    status: line.status,
                    start,
                    end: timing.success && startInstant !== undefined
                        ? start + timing.data.time
                        : record.ordinal,
                },
                origin: line.origin,
                contentType: line.rawMime,
                startInstant,
                record,
            });
            return ok(undefined);
        }
        finally {
            this.releaseTemporary();
        }
    }
    /** Keep a successful write whose URL was redacted, with an empty path whose root relates to every type. */
    #redactedWrite(record, timing) {
        const parsed = redactedWriteSchema.safeParse(record.reported);
        if (!parsed.success)
            return ok(undefined);
        const status = parsed.data.response?.status ?? 0;
        const facts = {
            ordinal: record.ordinal,
            method: parsed.data.request.method,
            path: "",
            query: undefined,
            status: status > 0 ? status : null,
            start: timing?.start ?? record.ordinal,
            end: timing?.end ?? record.ordinal,
        };
        if (!isStateWrite(facts))
            return ok(undefined);
        if (!this.retain(ENTRY_BYTES * 8 +
            textBytes(facts.method.length) +
            (timing?.instantBytes ?? 0)))
            return this.overBudget();
        this.#entries.set(record.ordinal, {
            facts,
            origin: null,
            contentType: "",
            startInstant: timing?.startInstant,
            record,
        });
        return ok(undefined);
    }
    /** Parse one retained response body as state JSON, charging its decoding and tree as temporary work. */
    #body(ordinal) {
        this.#bodyReleases.push(this.temporaryCheckpoint());
        const entry = this.#entries.get(ordinal);
        // A body that is not JSON-like is refused before its decoding is charged.
        if (entry === undefined || !isJsonLike(mediaTypeEssence(entry.contentType)))
            return { kind: "unusable" };
        const content = contentSchema.safeParse(entry.record.reported);
        if (!content.success)
            return { kind: "unusable" };
        // Larger bodies are never parsed; within the limit, decoding copies at most the retained text and the tree is linear in it.
        const length = content.data.response.content.text.length;
        if (length > base64PrefixChars(STATE_BODY_LIMIT_BYTES))
            return { kind: "unusable" };
        if (!this.temporary(RECORD_SCRATCH_BYTES + textBytes(length) * 4))
            return null;
        const value = stateBodyJson(entry.contentType, readRecordedResponseBody(entry.record, STATE_BODY_LIMIT_BYTES));
        return value === undefined ? { kind: "unusable" } : { kind: "json", value };
    }
    /** Parse one recorded request body as state JSON, as response bodies are admitted. */
    #withRequestBody(ordinal, use) {
        const entry = this.#entries.get(ordinal);
        const request = requestSchema.safeParse(entry?.record.reported);
        if (entry === undefined || !request.success)
            return use({ kind: "unusable" });
        const { postData, bodySize } = request.data.request;
        if (postData === undefined)
            return use({ kind: bodySize === 0 ? "absent" : "unusable" });
        const parsed = requestContentSchema.safeParse(postData);
        if (!parsed.success)
            return use({ kind: "unusable" });
        const { mimeType, text, params } = parsed.data;
        if (bodySize === 0 && text === "" && (params?.length ?? 0) === 0)
            return use({ kind: "absent" });
        if (!isJsonLike(mediaTypeEssence(mimeType)) ||
            Buffer.byteLength(text, "utf8") > STATE_BODY_LIMIT_BYTES)
            return use({ kind: "unusable" });
        const release = this.temporaryCheckpoint();
        try {
            if (!this.temporary(RECORD_SCRATCH_BYTES + textBytes(text.length) * 4))
                return null;
            const value = stateBodyJson(mimeType, { bodyText: text });
            return use(value === undefined ? { kind: "unusable" } : { kind: "json", value });
        }
        finally {
            release();
        }
    }
    /** Whether a record's response carried no body: a 204, or known decoded empty content. */
    #emptyResponse(ordinal) {
        const entry = this.#entries.get(ordinal);
        if (entry === undefined)
            return false;
        if (entry.facts.status === 204)
            return true;
        return recordedResponseBodyIsEmpty(entry.record);
    }
    /** Project the init state of the manifest's primary origin; records keep timeline order. */
    finishState() {
        const manifest = this.finish();
        if (!manifest.ok)
            return manifest;
        const entries = [...this.#entries.values()].filter((entry) => entry.origin === manifest.value.origin || entry.origin === null);
        const redactedWrites = entries.filter((entry) => entry.origin === null).length;
        const timeline = entries.length > 0 &&
            entries.every((entry) => entry.startInstant !== undefined)
            ? "recorded-start-time"
            : "record-order";
        const records = entries
            .sort((left, right) => timeline === "record-order"
            ? left.facts.ordinal - right.facts.ordinal
            : compareOffsetDateTimeInstants(left.startInstant, right.startInstant) || left.facts.ordinal - right.facts.ordinal)
            .map((entry) => entry.facts)
            .map((facts) => timeline === "record-order"
            ? { ...facts, start: facts.ordinal, end: facts.ordinal }
            : facts);
        const state = new EnvironmentStateExtraction({
            tools: manifest.value.tools,
            records,
            timeline,
            budget: {
                body: (ordinal) => this.#body(ordinal),
                withRequestBody: (ordinal, use) => this.#withRequestBody(ordinal, use),
                emptyResponse: (ordinal) => this.#emptyResponse(ordinal),
                retain: (bytes) => this.retain(bytes),
                checkpoint: () => this.retainedCheckpoint(),
                release: () => this.#bodyReleases.pop()?.(),
            },
        }).run();
        if (state === null)
            return this.overBudget();
        const limitations = this.addLimitations([
            ...(redactedWrites > 0
                ? [
                    `${String(redactedWrites)} of the recorded writes had a redacted URL; each ends the initial state of every type, since its target is unknown.`,
                ]
                : []),
            ...(timeline === "record-order"
                ? [
                    "Some records carry no start time, so the state's timeline is record order and overlapping requests are not detected.",
                ]
                : []),
            ...(state.views.some((view) => view.shape === "recorded")
                ? [
                    "Tools whose recordings do not reproduce from the extracted state are listed as recorded views with the reason; they replay their recordings.",
                ]
                : []),
        ]);
        if (!limitations.ok)
            return limitations;
        return ok({
            origin: manifest.value.origin,
            name: manifest.value.name,
            timeline,
            ...state,
            unknowns: UNKNOWNS.map((unknown) => ({ ...unknown })),
            coverage: manifest.value.coverage,
            limitations: this.sortedLimitations(),
        });
    }
}
