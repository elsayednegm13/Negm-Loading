/** Distinguish corrupt recognized binaries from containers outside parser coverage. */
export class BinaryFormatFailure extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
        this.name = "BinaryFormatFailure";
    }
}
/** A missing file span is a candidate miss; conflicting owners are malformed. */
export class BinaryMappingFailure extends BinaryFormatFailure {
    reason;
    constructor(reason, message) {
        super("malformed", message);
        this.reason = reason;
    }
}
/** Resource boundary exceeded while decoding metadata or native container structure. */
export class BinaryResourceFailure extends Error {
    boundary;
    maximum_bytes;
    constructor(boundary, maximum_bytes, message) {
        super(message);
        this.boundary = boundary;
        this.maximum_bytes = maximum_bytes;
        this.name = "BinaryResourceFailure";
    }
}
/** All declared file-backed image memory, including PE headers at the image base. */
export const imageFileMappings = (container) => container.pe_header_mapping === undefined
    ? container.mappings
    : [container.pe_header_mapping, ...container.mappings];
/** Reader that checks every structural range before decoding numeric fields. */
export class BinaryReader {
    bytes;
    little;
    constructor(bytes, little) {
        this.bytes = bytes;
        this.little = little;
    }
    range(offset, size, label) {
        if (!Number.isSafeInteger(offset) ||
            !Number.isSafeInteger(size) ||
            offset < 0 ||
            size < 0 ||
            offset > this.bytes.length ||
            size > this.bytes.length - offset)
            throw new BinaryFormatFailure("malformed", `${label} range is truncated or outside the file`);
        return this.bytes.subarray(offset, offset + size);
    }
    u16(offset) {
        const value = this.range(offset, 2, "16-bit field");
        return this.little ? value.readUInt16LE() : value.readUInt16BE();
    }
    u32(offset) {
        const value = this.range(offset, 4, "32-bit field");
        return this.little ? value.readUInt32LE() : value.readUInt32BE();
    }
    word(offset, bits) {
        if (bits === 32)
            return BigInt(this.u32(offset));
        const value = this.range(offset, 8, "64-bit field");
        return this.little ? value.readBigUInt64LE() : value.readBigUInt64BE();
    }
    fileRange(offset, size, label) {
        if (offset > BigInt(this.bytes.length) ||
            size > BigInt(this.bytes.length) - offset)
            throw new BinaryFormatFailure("malformed", `${label} range is outside the file`);
        const result = { address: 0n, offset: Number(offset), size: Number(size) };
        this.range(result.offset, result.size, label);
        return result;
    }
    table(offset, count, width, label) {
        const size = BigInt(count) * BigInt(width);
        if (size > 16n * 1024n * 1024n)
            throw new BinaryResourceFailure("structure", 16 * 1024 * 1024, `${label} exceeds the 16 MiB structural decoding budget`);
        return this.fileRange(offset, size, label).offset;
    }
}
/** Admit a declared file span, or mark it unbacked when it leaves the file. */
export const declaredFileRange = (fileBytes, offset, size) => {
    if (offset < 0n ||
        size < 0n ||
        offset > BigInt(Number.MAX_SAFE_INTEGER) ||
        size > BigInt(Number.MAX_SAFE_INTEGER) ||
        offset > BigInt(fileBytes) ||
        size > BigInt(fileBytes) - offset)
        return { offset: 0, size: 0, file_backed: false };
    return {
        offset: Number(offset),
        size: Number(size),
        file_backed: size > 0n,
    };
};
/** Map a physically contiguous virtual span across consistent adjacent ranges. */
export const mappedFileOffset = (mappings, address, size, zeroFills = []) => {
    if (!Number.isSafeInteger(size) || size < 0)
        throw new BinaryFormatFailure("malformed", "Virtual span size is invalid");
    const end = address + BigInt(size);
    let found;
    const covered = [];
    let whollyCovered = size === 0;
    for (const mapping of mappings) {
        const mappingEnd = mapping.address + BigInt(mapping.size);
        const start = address > mapping.address ? address : mapping.address;
        const overlapEnd = end < mappingEnd ? end : mappingEnd;
        if (size === 0
            ? address < mapping.address || address > mappingEnd
            : start >= overlapEnd)
            continue;
        const origin = mapping.offset + Number(address - mapping.address);
        if (found !== undefined && found !== origin)
            throw new BinaryMappingFailure("ambiguous", "Virtual span has ambiguous or noncontiguous file mappings");
        found = origin;
        if (start === address && overlapEnd === end)
            whollyCovered = true;
        else if (!whollyCovered)
            covered.push({ start, end: overlapEnd });
    }
    if (found === undefined)
        throw new BinaryMappingFailure("unmapped", "Virtual address or string range is not file mapped");
    if (!whollyCovered) {
        covered.sort((left, right) => left.start < right.start ? -1 : left.start > right.start ? 1 : 0);
        let cursor = address;
        for (const span of covered) {
            if (span.start > cursor)
                throw new BinaryMappingFailure("unmapped", "Virtual address or string range is not file mapped");
            if (span.end > cursor)
                cursor = span.end;
        }
        if (cursor < end)
            throw new BinaryMappingFailure("unmapped", "Virtual address or string range is not file mapped");
    }
    for (const zeroFill of zeroFills) {
        if (spansOverlap(address, BigInt(size), zeroFill.address, zeroFill.size))
            throw new BinaryMappingFailure("ambiguous", "Virtual address has ambiguous file and zero-fill mappings");
    }
    return found;
};
/** Index of the last sorted value at or below `value`, or -1. */
const lastAtOrBelow = (sorted, value) => {
    let low = 0;
    let high = sorted.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (sorted[middle] <= value)
            low = middle + 1;
        else
            high = middle;
    }
    return low - 1;
};
/** Sorted starts with the furthest end reached by any span starting at or before each. */
const prefixReach = (spans) => {
    const sorted = [...spans].sort((left, right) => left.start < right.start ? -1 : left.start > right.start ? 1 : 0);
    const starts = [];
    const reach = [];
    let furthest = -1n;
    for (const span of sorted) {
        if (span.end > furthest)
            furthest = span.end;
        starts.push(span.start);
        reach.push(furthest);
    }
    return { starts, reach };
};
/**
 * Indexed `mappedFileOffset` for parsers that translate many spans in one
 * image. Construction is O(n log n) over mappings; each lookup is O(log n), so
 * hostile section counts cannot multiply the cost of every table entry. It
 * accepts, rejects and translates exactly the spans `mappedFileOffset` does;
 * a span that is both a conflicting file alias and a zero-fill overlap may be
 * refused under either ambiguity message.
 */
export const createFileMappingIndex = (mappings, zeroFills = []) => {
    const backed = mappings
        .filter((mapping) => mapping.size > 0)
        .map((mapping) => ({
        start: mapping.address,
        end: mapping.address + BigInt(mapping.size),
        translation: BigInt(mapping.offset) - mapping.address,
    }));
    const zeroFilled = prefixReach(zeroFills
        .filter((zeroFill) => zeroFill.size > 0n)
        .map((zeroFill) => ({
        start: zeroFill.address,
        end: zeroFill.address + zeroFill.size,
    })));
    // Elementary intervals between every mapping boundary, each with the single
    // file translation shared by all mappings covering it (or none/ambiguous).
    const events = new Map();
    const event = (at) => {
        let entry = events.get(at);
        if (entry === undefined) {
            entry = { add: [], remove: [] };
            events.set(at, entry);
        }
        return entry;
    };
    for (const span of backed) {
        event(span.start).add.push(span.translation);
        event(span.end).remove.push(span.translation);
    }
    const boundaries = [...events.keys()].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
    const active = new Map();
    // Undefined is a gap; null is an overlap with conflicting translations.
    const translations = [];
    for (const boundary of boundaries) {
        const entry = events.get(boundary);
        for (const translation of entry?.remove ?? []) {
            const count = (active.get(translation) ?? 0) - 1;
            if (count === 0)
                active.delete(translation);
            else
                active.set(translation, count);
        }
        for (const translation of entry?.add ?? [])
            active.set(translation, (active.get(translation) ?? 0) + 1);
        translations.push(active.size === 0
            ? undefined
            : active.size === 1
                ? active.keys().next().value
                : null);
    }
    // runEnd[i]: end of the maximal run of intervals sharing interval i's translation.
    const runEnd = boundaries.map(() => 0n);
    for (let index = boundaries.length - 1; index >= 0; index--) {
        const next = boundaries[index + 1];
        const translation = translations[index];
        runEnd[index] =
            next === undefined
                ? boundaries[index]
                : translation !== null &&
                    translation !== undefined &&
                    translations[index + 1] === translation
                    ? runEnd[index + 1]
                    : next;
    }
    const ambiguousPrefix = [0];
    const previousMapped = [];
    const nextMapped = [];
    const translationRuns = [];
    let previous = -1;
    let run = 0;
    let previousTranslation;
    for (const [index, translation] of translations.entries()) {
        ambiguousPrefix.push((ambiguousPrefix[index] ?? 0) + (translation === null ? 1 : 0));
        if (typeof translation === "bigint") {
            if (translation !== previousTranslation)
                run += 1;
            previousTranslation = translation;
            previous = index;
        }
        previousMapped.push(previous);
        translationRuns.push(run);
    }
    let next = translations.length;
    for (let index = translations.length - 1; index >= 0; index--) {
        if (typeof translations[index] === "bigint")
            next = index;
        nextMapped[index] = next;
    }
    const offset = (address, size) => {
        if (!Number.isSafeInteger(size) || size <= 0)
            return mappedFileOffset(mappings, address, size, zeroFills);
        const end = address + BigInt(size);
        const interval = lastAtOrBelow(boundaries, address);
        const lower = Math.max(0, interval);
        const upper = lastAtOrBelow(boundaries, end - 1n);
        const first = nextMapped[lower] ?? translations.length;
        const last = previousMapped[upper] ?? -1;
        // Like the scan, conflicts anywhere in the requested span win over gaps.
        if ((ambiguousPrefix[upper + 1] ?? 0) - (ambiguousPrefix[lower] ?? 0) > 0 ||
            (first <= upper &&
                last >= lower &&
                translationRuns[first] !== translationRuns[last]))
            throw new BinaryMappingFailure("ambiguous", "Virtual span has ambiguous or noncontiguous file mappings");
        const translation = translations[interval];
        if (typeof translation !== "bigint" || runEnd[interval] < end)
            throw new BinaryMappingFailure("unmapped", "Virtual address or string range is not file mapped");
        const zeroFill = lastAtOrBelow(zeroFilled.starts, end - 1n);
        if (zeroFill >= 0 && zeroFilled.reach[zeroFill] > address)
            throw new BinaryMappingFailure("ambiguous", "Virtual address has ambiguous file and zero-fill mappings");
        return Number(address + translation);
    };
    const access = {
        offset,
        mappingAt: (address) => {
            const start = offset(address, 1);
            const interval = lastAtOrBelow(boundaries, address);
            return {
                address,
                offset: start,
                size: Number(runEnd[interval] - address),
            };
        },
    };
    return {
        offset,
        readCString: (bytes, address, maximumBytes) => readMappedString(bytes, access, address, maximumBytes),
    };
};
/** Read a bounded NUL-terminated string while retaining mapping/alias semantics. */
export const readMappedCString = (bytes, image, address, maximumBytes) => {
    const mappings = imageFileMappings(image);
    return readMappedString(bytes, {
        mappingAt: (cursor) => mappings.find((range) => range.address <= cursor &&
            cursor < range.address + BigInt(range.size)),
        offset: (cursor, size) => mappedFileOffset(mappings, cursor, size, image.zero_fills),
    }, address, maximumBytes);
};
const readMappedString = (bytes, access, address, maximumBytes) => {
    const chunks = [];
    let length = 0;
    while (length <= maximumBytes) {
        const cursor = address + BigInt(length);
        const mapping = access.mappingAt(cursor);
        if (mapping === undefined) {
            access.offset(cursor, 1);
            throw new BinaryMappingFailure("unmapped", "String range is not file mapped");
        }
        const size = Math.min(maximumBytes + 1 - length, Number(mapping.address + BigInt(mapping.size) - cursor));
        const offset = mapping.offset + Number(cursor - mapping.address);
        const chunk = bytes.subarray(offset, offset + size);
        const terminator = chunk.indexOf(0);
        const consumed = terminator < 0 ? size : terminator + 1;
        access.offset(cursor, consumed);
        if (terminator >= 0) {
            const tail = chunk.subarray(0, terminator);
            if (chunks.length === 0)
                return tail;
            chunks.push(tail);
            return Buffer.concat(chunks, length + terminator);
        }
        chunks.push(chunk);
        length += size;
    }
    throw new BinaryFormatFailure("malformed", `String is unterminated or longer than ${String(maximumBytes)} bytes`);
};
/** Recognize a wholly zero-filled span while refusing even partial file aliases. */
export const isZeroFilledSpan = (mappings, zeroFills, address, size) => {
    const bytes = BigInt(size);
    if (!zeroFills.some((mapping) => address >= mapping.address &&
        address + bytes <= mapping.address + mapping.size))
        return false;
    for (const mapping of mappings) {
        if (spansOverlap(address, bytes, mapping.address, BigInt(mapping.size)))
            throw new BinaryMappingFailure("ambiguous", "Virtual address has ambiguous file and zero-fill mappings");
    }
    return true;
};
const spansOverlap = (address, size, otherAddress, otherSize) => size > 0n &&
    otherSize > 0n &&
    address < otherAddress + otherSize &&
    otherAddress < address + size;
