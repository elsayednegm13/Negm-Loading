import { appleIpsIntegerTextBytes, } from "../../domain/native/appleIps.js";
import { AppleIpsResourceFailure } from "./AppleIps.errors.js";
const UINT32_MAX = 0xffffffff;
const observedType = (value) => value === undefined
    ? "absent"
    : value.kind === "omitted"
        ? value.type
        : value.kind;
/**
 * Typed field access that records every present value whose JSON type differs
 * from the documented one, so wrong-type input never reads as observed absence.
 * JSON `null` and a missing member both mean "not recorded".
 */
export class FieldReader {
    maximumIntegerTextBytes;
    mismatches = [];
    #integers = new WeakMap();
    #integerTextBytes = 0;
    constructor(maximumIntegerTextBytes) {
        this.maximumIntegerTextBytes = maximumIntegerTextBytes;
    }
    /** Reserve a safe decimal/hex upper bound before BigInt or string expansion. */
    #reserve(decimalCharacters, hexadecimal) {
        // log16(10) < 5/6. Include the 0x prefix; signs only enlarge this bound.
        const hexCharacters = hexadecimal
            ? Math.ceil((decimalCharacters * 5) / 6) + 2
            : 0;
        const bytes = 2 * (decimalCharacters + hexCharacters);
        if (bytes > this.maximumIntegerTextBytes - this.#integerTextBytes)
            throw new AppleIpsResourceFailure("integer_text", this.maximumIntegerTextBytes, `IPS integer text reservation exceeds the ${String(this.maximumIntegerTextBytes)}-byte UTF-16 allowance`);
        this.#integerTextBytes += bytes;
        return bytes;
    }
    #retain(value, decimal, reserved) {
        const recorded = {
            decimal,
            hex: value < 0n ? null : `0x${value.toString(16)}`,
        };
        this.#integerTextBytes -= reserved - appleIpsIntegerTextBytes(recorded);
        return recorded;
    }
    recordedInteger(decimal) {
        const hexadecimal = !decimal.startsWith("-") || decimal === "-0";
        const reserved = this.#reserve(decimal.length, hexadecimal);
        const value = BigInt(decimal);
        const recorded = this.#retain(value, decimal, reserved);
        this.#integers.set(recorded, value);
        return recorded;
    }
    add(left, right) {
        if (left === null || right === null)
            return null;
        const a = this.#integers.get(left);
        const b = this.#integers.get(right);
        if (a === undefined || b === undefined)
            throw new Error("IPS integer facts do not belong to this field reader");
        const reserved = this.#reserve(Math.max(left.decimal.length, right.decimal.length) + 1, true);
        const value = a + b;
        return this.#retain(value, value.toString(), reserved);
    }
    mismatch(path, expected, value) {
        this.mismatches.push({ path, expected, observed: observedType(value) });
    }
    text(value, path) {
        if (value === undefined || value.kind === "null")
            return null;
        if (value.kind === "string")
            return value.value;
        this.mismatch(path, "string", value);
        return null;
    }
    integer(value, path) {
        if (value === undefined || value.kind === "null")
            return null;
        if (value.kind === "integer")
            return this.recordedInteger(value.decimal);
        this.mismatch(path, "integer", value);
        return null;
    }
    index(value, path) {
        if (value?.kind === "integer") {
            // Every uint32 fits in ten decimal digits, safely below Number's exact
            // integer limit. Oversized source indices need no BigInt allocation.
            const index = value.decimal.length <= 10 ? Number(value.decimal) : NaN;
            if (Number.isInteger(index) && index >= 0 && index <= UINT32_MAX)
                return index === 0 ? 0 : index;
            this.#reserve(value.decimal.length, false);
            this.mismatches.push({
                path,
                expected: "unsigned 32-bit integer",
                observed: "integer out of range",
                recorded_integer: value.decimal,
            });
            return null;
        }
        if (value === undefined || value.kind === "null")
            return null;
        this.mismatch(path, "unsigned 32-bit integer", value);
        return null;
    }
    /** Keep a recorded lookup separate from whether it resolves to an object. */
    resolveIndex(index, rows, path) {
        if (index === null)
            return null;
        const row = rows[index];
        if (row?.kind === "object")
            return index;
        const decimal = String(index);
        this.#reserve(decimal.length, false);
        this.mismatches.push({
            path,
            expected: "index of a recorded object row",
            observed: row === undefined
                ? "integer reference out of range"
                : "integer references a non-object row",
            recorded_integer: decimal,
        });
        return null;
    }
    boolean(value, path) {
        if (value === undefined || value.kind === "null")
            return null;
        if (value.kind === "boolean")
            return value.value;
        this.mismatch(path, "boolean", value);
        return null;
    }
    object(value, path) {
        if (value === undefined || value.kind === "null")
            return null;
        if (value.kind === "object")
            return value;
        this.mismatch(path, "object", value);
        return null;
    }
    /** An array element is always recorded, so `null` there is a mismatch too. */
    row(value, path) {
        if (value.kind === "object")
            return value.members;
        this.mismatch(path, "object", value);
        return {};
    }
    array(value, path, required) {
        if (value?.kind === "array")
            return value.items;
        if (value === undefined || value.kind === "null") {
            if (required)
                this.mismatch(path, "array", value);
            return null;
        }
        this.mismatch(path, "array", value);
        return null;
    }
}
