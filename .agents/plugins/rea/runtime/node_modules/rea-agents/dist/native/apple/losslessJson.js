/** JSON text could not be parsed as a single complete value. */
export class LosslessJsonFailure extends Error {
    reason;
    maximum;
    constructor(message, reason = "syntax", maximum = null) {
        super(message);
        this.reason = reason;
        this.maximum = maximum;
        this.name = "LosslessJsonFailure";
    }
}
const ANY = { kind: "any" };
const OMITTED_ARRAY = Object.freeze({
    kind: "omitted",
    type: "array",
});
const OMITTED_OBJECT = Object.freeze({
    kind: "omitted",
    type: "object",
});
const DEFAULT_MAX_DEPTH = 512;
const QUOTE = 0x22;
const BACKSLASH = 0x5c;
const isDigit = (code) => code >= 48 && code <= 57;
/** Parse one JSON value, preserving integer literals that exceed IEEE-754 range. */
export const parseLosslessJson = (text, start = 0, shape = ANY, options = {}) => {
    const parser = new Parser(text, start, options.maxDepth ?? DEFAULT_MAX_DEPTH);
    const value = parser.parseValue(shape, 0);
    return { value, end: parser.position };
};
class Parser {
    text;
    maxDepth;
    position;
    constructor(text, start, maxDepth) {
        this.text = text;
        this.maxDepth = maxDepth;
        this.position = start;
    }
    parseValue(shape, depth) {
        this.skipWhitespace();
        const ch = this.text[this.position];
        if (ch === "{") {
            if (shape.kind === "object" || shape.kind === "any")
                return this.parseObject(shape, depth + 1);
            this.skipValue(depth);
            return OMITTED_OBJECT;
        }
        if (ch === "[") {
            if (shape.kind === "array" || shape.kind === "any")
                return this.parseArray(shape, depth + 1);
            this.skipValue(depth);
            return OMITTED_ARRAY;
        }
        return this.parseScalar();
    }
    enter(depth) {
        if (depth > this.maxDepth)
            throw new LosslessJsonFailure(`JSON nesting exceeds ${String(this.maxDepth)} levels at offset ${String(this.position)}`, "depth", this.maxDepth);
    }
    parseScalar() {
        const ch = this.text[this.position];
        if (ch === undefined)
            throw new LosslessJsonFailure("Unexpected end of JSON input");
        if (ch === '"')
            return { kind: "string", value: this.parseString() };
        if (ch === "t")
            return this.literal("true", { kind: "boolean", value: true });
        if (ch === "f")
            return this.literal("false", { kind: "boolean", value: false });
        if (ch === "n")
            return this.literal("null", { kind: "null" });
        if (ch === "-" || isDigit(ch.charCodeAt(0))) {
            const start = this.position;
            const fractional = this.scanNumber();
            const recorded = this.text.slice(start, this.position);
            return fractional
                ? { kind: "number", recorded }
                : { kind: "integer", decimal: recorded };
        }
        throw new LosslessJsonFailure(`Unexpected ${JSON.stringify(ch)} at JSON offset ${String(this.position)}`);
    }
    parseObject(shape, depth) {
        this.enter(depth);
        this.position += 1;
        const members = Object.create(null);
        const unlisted = [];
        const unlistedSeen = new Set();
        this.skipWhitespace();
        if (this.text[this.position] === "}") {
            this.position += 1;
            return { kind: "object", members, unlisted };
        }
        for (;;) {
            this.skipWhitespace();
            if (this.text[this.position] !== '"')
                throw new LosslessJsonFailure(`Expected a JSON object key at offset ${String(this.position)}`);
            const key = this.parseString();
            this.skipWhitespace();
            this.expect(":");
            const listed = shape.kind === "any" || Object.hasOwn(shape.members, key);
            const memberShape = shape.kind === "any" ? ANY : listed ? shape.members[key] : shape.rest;
            if (memberShape === undefined) {
                if (shape.kind === "object" && shape.beforeUnlisted !== undefined) {
                    if (unlistedSeen.has(key))
                        throw new LosslessJsonFailure(`Duplicate JSON object key ${JSON.stringify(key)}`);
                    shape.beforeUnlisted(unlisted.length + 1);
                    unlistedSeen.add(key);
                    unlisted.push(key);
                }
                this.skipValue(depth);
            }
            else {
                if (Object.hasOwn(members, key))
                    throw new LosslessJsonFailure(`Duplicate JSON object key ${JSON.stringify(key)}`);
                if (!listed && shape.kind === "object")
                    shape.beforeRest?.();
                members[key] = this.parseValue(memberShape, depth);
            }
            this.skipWhitespace();
            const next = this.text[this.position];
            if (next === "}") {
                this.position += 1;
                return { kind: "object", members, unlisted };
            }
            if (next !== ",")
                throw new LosslessJsonFailure(`Expected ',' or '}' in JSON object at offset ${String(this.position)}`);
            this.position += 1;
        }
    }
    parseArray(shape, depth) {
        this.enter(depth);
        this.position += 1;
        const items = [];
        const itemShape = shape.kind === "any" ? ANY : shape.items;
        const beforeItem = shape.kind === "array" ? shape.beforeItem : undefined;
        this.skipWhitespace();
        if (this.text[this.position] === "]") {
            this.position += 1;
            return { kind: "array", items };
        }
        for (;;) {
            beforeItem?.();
            items.push(this.parseValue(itemShape, depth));
            this.skipWhitespace();
            const next = this.text[this.position];
            if (next === "]") {
                this.position += 1;
                return { kind: "array", items };
            }
            if (next !== ",")
                throw new LosslessJsonFailure(`Expected ',' or ']' in JSON array at offset ${String(this.position)}`);
            this.position += 1;
        }
    }
    /** Validate one value's syntax without retaining it. */
    skipValue(depth) {
        this.skipWhitespace();
        const ch = this.text[this.position];
        if (ch === "{") {
            this.enter(depth + 1);
            this.position += 1;
            this.skipWhitespace();
            if (this.text[this.position] === "}") {
                this.position += 1;
                return;
            }
            for (;;) {
                this.skipWhitespace();
                if (this.text[this.position] !== '"')
                    throw new LosslessJsonFailure(`Expected a JSON object key at offset ${String(this.position)}`);
                this.parseString();
                this.skipWhitespace();
                this.expect(":");
                this.skipValue(depth + 1);
                this.skipWhitespace();
                const next = this.text[this.position];
                if (next === "}") {
                    this.position += 1;
                    return;
                }
                if (next !== ",")
                    throw new LosslessJsonFailure(`Expected ',' or '}' in JSON object at offset ${String(this.position)}`);
                this.position += 1;
            }
        }
        if (ch === "[") {
            this.enter(depth + 1);
            this.position += 1;
            this.skipWhitespace();
            if (this.text[this.position] === "]") {
                this.position += 1;
                return;
            }
            for (;;) {
                this.skipValue(depth + 1);
                this.skipWhitespace();
                const next = this.text[this.position];
                if (next === "]") {
                    this.position += 1;
                    return;
                }
                if (next !== ",")
                    throw new LosslessJsonFailure(`Expected ',' or ']' in JSON array at offset ${String(this.position)}`);
                this.position += 1;
            }
        }
        if (ch === '"') {
            this.parseString();
            return;
        }
        if (ch === "-" || (ch !== undefined && isDigit(ch.charCodeAt(0)))) {
            this.scanNumber();
            return;
        }
        this.parseScalar();
    }
    /** Validate once, then let V8 decode escapes without a per-escape fragment array. */
    parseString() {
        const start = this.position;
        const escaped = this.skipString();
        const decoded = escaped
            ? // A decoded JSON string cannot contain more code units than its literal.
                // The input's byte allowance bounds this allocation, including dense escapes.
                JSON.parse(this.text.slice(start, this.position))
            : this.text.slice(start + 1, this.position - 1);
        if (typeof decoded !== "string")
            throw new LosslessJsonFailure("Expected a JSON string");
        return this.requirePairedSurrogates(decoded);
    }
    /**
     * JSON admits \uXXXX escapes for unpaired surrogates, but the decoded text is
     * not valid Unicode. Evidence carrying one would report malformed text as
     * complete, so the parser refuses the string like any other malformed input.
     * A high surrogate followed by its low surrogate escape stays valid text.
     */
    requirePairedSurrogates(value) {
        for (let index = 0; index < value.length; index += 1) {
            const unit = value.charCodeAt(index);
            if (unit >= 0xd800 && unit <= 0xdbff) {
                const next = index + 1 < value.length ? value.charCodeAt(index + 1) : 0;
                if (next < 0xdc00 || next > 0xdfff)
                    throw new LosslessJsonFailure("JSON string contains an unpaired surrogate");
                index += 1;
                continue;
            }
            if (unit >= 0xdc00 && unit <= 0xdfff)
                throw new LosslessJsonFailure("JSON string contains an unpaired surrogate");
        }
        return value;
    }
    skipString() {
        const text = this.text;
        let escaped = false;
        this.position += 1;
        while (this.position < text.length) {
            const code = text.charCodeAt(this.position);
            if (code === QUOTE) {
                this.position += 1;
                return escaped;
            }
            if (code === BACKSLASH) {
                escaped = true;
                this.position += 1;
                this.escape();
                continue;
            }
            if (code < 0x20)
                throw new LosslessJsonFailure("Unescaped control character in JSON string");
            this.position += 1;
        }
        throw new LosslessJsonFailure("Unterminated JSON string");
    }
    escape() {
        const ch = this.text[this.position];
        this.position += 1;
        switch (ch) {
            case '"':
            case "\\":
            case "/":
                return ch;
            case "b":
                return "\b";
            case "f":
                return "\f";
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "t":
                return "\t";
            case "u": {
                const hex = this.text.slice(this.position, this.position + 4);
                if (!/^[0-9a-fA-F]{4}$/u.test(hex))
                    throw new LosslessJsonFailure("Invalid JSON Unicode escape");
                this.position += 4;
                return String.fromCharCode(Number.parseInt(hex, 16));
            }
            default:
                throw new LosslessJsonFailure("Invalid JSON string escape");
        }
    }
    /** Advance over one number; returns whether it has a fraction or exponent. */
    scanNumber() {
        if (this.text[this.position] === "-")
            this.position += 1;
        if (this.text[this.position] === "0")
            this.position += 1;
        else {
            if (!isDigit(this.text.charCodeAt(this.position)))
                throw new LosslessJsonFailure("Invalid JSON number");
            while (isDigit(this.text.charCodeAt(this.position)))
                this.position += 1;
        }
        let fractional = false;
        if (this.text[this.position] === ".") {
            fractional = true;
            this.position += 1;
            if (!isDigit(this.text.charCodeAt(this.position)))
                throw new LosslessJsonFailure("Invalid JSON number fraction");
            while (isDigit(this.text.charCodeAt(this.position)))
                this.position += 1;
        }
        if (this.text[this.position] === "e" || this.text[this.position] === "E") {
            fractional = true;
            this.position += 1;
            if (this.text[this.position] === "+" || this.text[this.position] === "-")
                this.position += 1;
            if (!isDigit(this.text.charCodeAt(this.position)))
                throw new LosslessJsonFailure("Invalid JSON number exponent");
            while (isDigit(this.text.charCodeAt(this.position)))
                this.position += 1;
        }
        return fractional;
    }
    literal(token, value) {
        if (!this.text.startsWith(token, this.position))
            throw new LosslessJsonFailure(`Expected ${token} in JSON`);
        this.position += token.length;
        return value;
    }
    expect(token) {
        if (!this.text.startsWith(token, this.position))
            throw new LosslessJsonFailure(`Expected ${JSON.stringify(token)} at JSON offset ${String(this.position)}`);
        this.position += token.length;
    }
    skipWhitespace() {
        while (this.position < this.text.length) {
            const ch = this.text[this.position];
            if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r")
                return;
            this.position += 1;
        }
    }
}
