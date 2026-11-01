import { AnalysisInputError } from "../domain/analysisErrorCore.js";
import { err, ok } from "../domain/result.js";
import { createHash } from "node:crypto";
import { sanitizeBrowserUrl, } from "../domain/browserObservation.js";
const REDACTION_PREFIX = "[REDACTED:";
/** Page values shorter than this are not redacted: redacting them would rewrite ids, ports and hosts throughout the capture. */
export const MIN_REDACTED_PAGE_VALUE_LENGTH = 8;
const encodedSecretValues = (secret) => new Set([
    encodeURIComponent(secret),
    new URLSearchParams([["value", secret]]).toString().slice("value=".length),
]);
const normalizePercentEscapes = (value) => {
    if (!value.includes("%"))
        return value;
    return value.replace(/%[0-9a-f]{2}/giu, (escape) => escape.toLowerCase());
};
const secretPatterns = (secret, spellings) => {
    if (secret === "")
        return [];
    const patterns = [
        { text: secret, searchText: secret, percentInsensitive: false },
        ...[...encodedSecretValues(secret)].map((text) => ({
            text,
            searchText: normalizePercentEscapes(text),
            percentInsensitive: true,
        })),
    ];
    if (spellings === "text")
        patterns.push({
            text: JSON.stringify(secret).slice(1, -1),
            searchText: JSON.stringify(secret).slice(1, -1),
            percentInsensitive: false,
        });
    const seen = new Set();
    return patterns.filter(({ text, percentInsensitive }) => {
        if (text === "")
            return false;
        const key = `${percentInsensitive ? "percent" : "literal"}:${text}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
const declaredPatterns = (values, spellings) => {
    const seen = new Set();
    return [...values.values()]
        .flatMap((secret) => secretPatterns(secret, spellings))
        .filter(({ text, percentInsensitive }) => {
        const key = `${percentInsensitive ? "percent" : "literal"}:${text}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
const secretReplacements = (values, spellings) => [...values]
    .flatMap(([id, secret]) => secretPatterns(secret, spellings).map((pattern) => ({ id, ...pattern })))
    .sort((left, right) => right.text.length - left.text.length ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
const normalizePercentEscapesBytes = (value) => {
    if (value.indexOf(37) < 0)
        return value;
    const normalized = Buffer.from(value);
    for (let index = 0; index + 2 < normalized.length; index += 1)
        if (normalized[index] === 37 &&
            isHexByte(normalized[index + 1]) &&
            isHexByte(normalized[index + 2])) {
            normalized[index + 1] = lowercaseHexByte(normalized[index + 1]);
            normalized[index + 2] = lowercaseHexByte(normalized[index + 2]);
            index += 2;
        }
    return normalized;
};
const isHexByte = (value) => value !== undefined &&
    ((value >= 48 && value <= 57) ||
        (value >= 65 && value <= 70) ||
        (value >= 97 && value <= 102));
const lowercaseHexByte = (value) => value >= 65 && value <= 70 ? value + 32 : value;
const patternMatches = (value, normalizedValue, pattern) => (pattern.percentInsensitive ? normalizedValue : value).includes(pattern.searchText);
const containsSecretPattern = (value, normalizedValue, patterns) => {
    if (patterns.length === 0)
        return false;
    return patterns.some((pattern) => patternMatches(value, normalizedValue, pattern));
};
const containsSecretBytePattern = (value, normalizedValue, needles) => needles.some((needle) => (needle.percentInsensitive ? normalizedValue : value).includes(needle.needle));
/** Pick a marker that does not itself contain a declared secret spelling. */
const redactionMarker = (id, patterns) => {
    const candidates = [`${REDACTION_PREFIX}${id}]`, "[REDACTED]", "…", ""];
    return (candidates.find((candidate) => patterns.every((pattern) => !patternMatches(candidate, normalizePercentEscapes(candidate), pattern))) ?? "");
};
const replaceSecretLiterals = (value, replacements, patterns) => {
    const normalizedValue = replacements.some(({ percentInsensitive }) => percentInsensitive)
        ? normalizePercentEscapes(value)
        : value;
    const parts = [];
    let offset = 0;
    while (offset < value.length) {
        let next;
        for (const replacement of replacements) {
            const search = replacement.searchText;
            const view = replacement.percentInsensitive ? normalizedValue : value;
            const index = view.indexOf(search, offset);
            if (index >= 0 &&
                (next === undefined ||
                    index < next.index ||
                    (index === next.index && replacement.text.length > next.text.length)))
                next = { ...replacement, index };
        }
        if (next === undefined)
            break;
        const marker = redactionMarker(next.id, patterns);
        parts.push(value.slice(offset, next.index), marker);
        offset = next.index + next.text.length;
    }
    if (parts.length === 0)
        return value;
    parts.push(value.slice(offset));
    return parts.join("");
};
const secretNeedles = (replacements, patterns) => replacements.map((pattern) => ({
    id: pattern.id,
    needle: Buffer.from(pattern.searchText),
    percentInsensitive: pattern.percentInsensitive,
    marker: Buffer.from(redactionMarker(pattern.id, patterns)),
}));
/** Resolved secret values kept only for one in-memory scenario session. */
export class BrowserScenarioSecrets {
    values;
    urlPatterns = [];
    textPatterns = [];
    urlReplacements = [];
    textReplacements = [];
    textNeedles = [];
    redactionCostPerCharacter = 8;
    constructor(values) {
        this.values = values;
        this.compile();
    }
    compile() {
        const values = this.values;
        this.urlPatterns = declaredPatterns(values, "url");
        this.textPatterns = declaredPatterns(values, "text");
        this.urlReplacements = secretReplacements(values, "url");
        this.textReplacements = secretReplacements(values, "text");
        this.textNeedles = secretNeedles(this.textReplacements, this.textPatterns);
        this.redactionCostPerCharacter = 8;
        for (const [replacements, patterns] of [
            [this.textReplacements, this.textPatterns],
            [this.urlReplacements, this.urlPatterns],
        ])
            for (const replacement of replacements)
                this.redactionCostPerCharacter = Math.max(this.redactionCostPerCharacter, 8 +
                    (Buffer.byteLength(redactionMarker(replacement.id, patterns)) * 8 +
                        128) /
                        replacement.text.length);
    }
    /**
     * Redact a value a request step read from the page, such as a CSRF cookie
     * or a stored bearer token, from everything recorded after it, as a
     * declared secret is. The label names it in redaction markers; a value
     * already redacted keeps its first marker, and a value shorter than
     * {@link MIN_REDACTED_PAGE_VALUE_LENGTH} is not redacted.
     */
    admitPageValue(label, value) {
        // fetch sends a header value without surrounding spaces and tabs, so that is the spelling records hold.
        const sent = value.replace(/^[\t ]+|[\t ]+$/gu, "");
        if (sent !== value)
            this.admitPageValue(label, sent);
        if (value.length < MIN_REDACTED_PAGE_VALUE_LENGTH)
            return;
        for (const held of this.values.values())
            if (held === value)
                return;
        let id = `page:${label}`;
        for (let suffix = 2; this.values.has(id); suffix += 1)
            id = `page:${label}~${String(suffix)}`;
        this.values.set(id, value);
        this.compile();
    }
    static resolve(scenario, environment) {
        const values = new Map();
        for (const [index, declaration] of scenario.secrets.entries()) {
            const value = environment[declaration.environment_variable];
            if (!Object.hasOwn(environment, declaration.environment_variable) ||
                typeof value !== "string")
                return err(new AnalysisInputError("capture_browser_scenario", {
                    userMessage: `Set environment variable ${declaration.environment_variable} for browser scenario secret ${declaration.secret_id} in the environment that starts REA, then retry.`,
                }, [
                    {
                        path: ["secrets", index, "environment_variable"],
                        reason: "missing_argument",
                        message: `Environment variable ${declaration.environment_variable} is not set for declared secret ${declaration.secret_id}.`,
                        expected: {
                            secret_id: declaration.secret_id,
                            environment_variable: declaration.environment_variable,
                        },
                    },
                ]));
            values.set(declaration.secret_id, value);
        }
        return ok(new BrowserScenarioSecrets(values));
    }
    value(source) {
        if (source.source === "literal")
            return source.value;
        const value = this.values.get(source.secret_id);
        if (value === undefined)
            throw new Error("Validated browser secret was not resolved");
        return value;
    }
    url(destination) {
        const url = new URL(destination.url);
        for (const { name, value } of destination.query)
            url.searchParams.append(name, this.value(value));
        return url.href;
    }
    /** Conservative preflight for output expansion and per-match part arrays.
     * Callers measuring untrusted observations must reserve this cost before
     * invoking redaction. A one-byte secret can otherwise expand every byte.
     */
    redactionAllocationCost(length) {
        return Math.ceil(length * this.redactionCostPerCharacter);
    }
    redact(value) {
        const patterns = this.textPatterns;
        if (patterns.length === 0)
            return value;
        const output = replaceSecretLiterals(value, this.textReplacements, patterns);
        return containsSecretPattern(output, normalizePercentEscapes(output), patterns)
            ? ""
            : output;
    }
    /** Replace declared UTF-8, URI/form, and JSON-escaped secret spellings. */
    redactBytes(value) {
        const patterns = this.textPatterns;
        if (patterns.length === 0)
            return value;
        const candidates = this.textNeedles;
        const hasPercentPatterns = candidates.some(({ percentInsensitive }) => percentInsensitive);
        const normalizedValue = hasPercentPatterns && value.indexOf(37) >= 0
            ? normalizePercentEscapesBytes(value)
            : value;
        const sortedCandidates = candidates
            .map((candidate) => ({
            ...candidate,
            index: (candidate.percentInsensitive ? normalizedValue : value).indexOf(candidate.needle),
        }))
            .sort((left, right) => right.needle.length - left.needle.length ||
            (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
        const parts = [];
        let offset = 0;
        while (true) {
            let next;
            for (const candidate of sortedCandidates) {
                if (candidate.index >= 0 && candidate.index < offset)
                    candidate.index = (candidate.percentInsensitive ? normalizedValue : value).indexOf(candidate.needle, offset);
                if (candidate.index >= 0 &&
                    (next === undefined ||
                        candidate.index < next.index ||
                        (candidate.index === next.index &&
                            candidate.needle.length > next.needle.length)))
                    next = candidate;
            }
            if (next === undefined)
                break;
            parts.push(value.subarray(offset, next.index), next.marker);
            offset = next.index + next.needle.length;
        }
        if (parts.length === 0)
            return value;
        parts.push(value.subarray(offset));
        const redacted = Buffer.concat(parts);
        const normalizedRedacted = hasPercentPatterns && redacted.indexOf(37) >= 0
            ? normalizePercentEscapesBytes(redacted)
            : redacted;
        return containsSecretBytePattern(redacted, normalizedRedacted, candidates)
            ? Buffer.alloc(0)
            : redacted;
    }
    /** Remove only declared secret values from one URL and report that action. */
    sanitizeUrl(value) {
        const patterns = this.urlPatterns;
        if (patterns.length === 0)
            return sanitizeBrowserUrl(value);
        const output = replaceSecretLiterals(value, this.urlReplacements, patterns);
        if (containsSecretPattern(output, normalizePercentEscapes(output), patterns))
            return {
                url: "",
                origin: null,
                query_parameter_names: [],
                redacted: true,
            };
        const sanitized = sanitizeBrowserUrl(output);
        return {
            ...sanitized,
            redacted: sanitized.redacted || output !== value,
        };
    }
    fingerprint(value) {
        const patterns = this.textPatterns;
        if (patterns.length > 0 &&
            containsSecretPattern(value, normalizePercentEscapes(value), patterns))
            return { value_state: "redacted-secret", value_sha256: null };
        const hash = createHash("sha256");
        // In Unicode mode this class matches unpaired units, not valid pairs.
        if (!/[\uD800-\uDFFF]/u.test(value))
            hash.update(value);
        // 0xff cannot occur in UTF-8, keeping the two preimage domains disjoint.
        else
            hash.update(Buffer.from([0xff])).update(value, "utf16le");
        return { value_state: "hashed", value_sha256: hash.digest("hex") };
    }
}
