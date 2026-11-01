import { readClock, zoneMinutesForFormat, } from "./environmentStateWriteValues.js";
const MINUTE_MS = 60_000;
const pad = (value, width) => String(value).padStart(width, "0");
/** Whether a parsed clock fits a learned format without widening it or learning a new spelling. */
export const matchesClockFormat = (format, reading) => {
    if (reading === undefined)
        return false;
    const spelled = reading.format;
    if (format.kind === "epoch")
        return spelled.kind === "epoch" && spelled.unit === format.unit;
    return (spelled.kind === "iso" &&
        spelled.separator === format.separator &&
        spelled.zone === format.zone &&
        (format.trimmed === true
            ? !reading.fixedWidth && spelled.fraction <= format.fraction
            : spelled.fraction === format.fraction));
};
/**
 * The format that spells both a format's values and another clock value: the format itself, or a trimmed one when the
 * two differ only in how many fraction digits they show and neither ends a fraction in a zero. `exemplar` is the value
 * the format was learned from, which shows whether its own width is fixed.
 */
export const fittedClockFormat = (format, value, exemplar) => {
    const reading = readClock(value);
    if (reading === undefined)
        return undefined;
    if (matchesClockFormat(format, reading))
        return format;
    const spelled = reading.format;
    if (format.kind !== "iso" ||
        spelled.kind !== "iso" ||
        spelled.separator !== format.separator ||
        spelled.zone !== format.zone ||
        reading.fixedWidth)
        return undefined;
    if (format.trimmed !== true) {
        const learned = readClock(exemplar);
        return learned === undefined || learned.fixedWidth
            ? undefined
            : {
                ...format,
                fraction: Math.max(format.fraction, spelled.fraction),
                trimmed: true,
            };
    }
    return { ...format, fraction: spelled.fraction };
};
/** Whether a value spells a clock as an ISO format does with a fraction ending in a zero, which no trimmed spelling shows. */
export const showsFixedWidth = (format, value) => {
    const reading = readClock(value);
    return (reading !== undefined &&
        reading.fixedWidth &&
        format.kind === "iso" &&
        reading.format.kind === "iso" &&
        reading.format.separator === format.separator &&
        reading.format.zone === format.zone);
};
/** Keep the first value showing each field as an ISO clock at a fixed width, which no trimmed spelling of the field may contradict. */
export const noteFixedWidths = (seen, fields) => {
    for (const [field, value] of Object.entries(fields)) {
        const reading = readClock(value);
        if (reading?.fixedWidth === true &&
            reading.format.kind === "iso" &&
            !seen.has(field))
            seen.set(field, value);
    }
};
/** A clock format trimmed as a sibling's is, when it is spelled alike and its own value does not show a fixed width. */
export const trimmedLike = (format, trimmed, value) => {
    const reading = readClock(value);
    return format.kind === "iso" &&
        trimmed.kind === "iso" &&
        trimmed.trimmed === true &&
        format.trimmed !== true &&
        format.separator === trimmed.separator &&
        format.zone === trimmed.zone &&
        reading !== undefined &&
        !reading.fixedWidth
        ? {
            ...format,
            fraction: Math.max(format.fraction, trimmed.fraction),
            trimmed: true,
        }
        : format;
};
export const CLOCK_PATTERNS = [
    "YYYYMMDDhhmmss",
    "YYYYMMDD",
    "YYYY-MM-DD",
    "YYYY/MM/DD",
];
/** A clock value's wall clock in its own zone, in a calendar pattern; undefined when it is not a clock. */
export const clockDigits = (value, pattern) => {
    const clock = readClock(value);
    if (clock === undefined)
        return undefined;
    const zone = clock.format.kind === "iso" ? zoneMinutesForFormat(clock.format.zone) : 0;
    const at = new Date(clock.ms + zone * MINUTE_MS);
    const year = at.getUTCFullYear();
    if (!Number.isInteger(year) || year < 0 || year > 9999)
        return undefined;
    const [y, m, d] = [
        pad(year, 4),
        pad(at.getUTCMonth() + 1, 2),
        pad(at.getUTCDate(), 2),
    ];
    switch (pattern) {
        case "YYYYMMDDhhmmss":
            return `${y}${m}${d}${pad(at.getUTCHours(), 2)}${pad(at.getUTCMinutes(), 2)}${pad(at.getUTCSeconds(), 2)}`;
        case "YYYYMMDD":
            return `${y}${m}${d}`;
        case "YYYY-MM-DD":
            return `${y}-${m}-${d}`;
        case "YYYY/MM/DD":
            return `${y}/${m}/${d}`;
    }
};
