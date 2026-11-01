import { checkRange, readIndex, Il2cppMetadataFormatFailure, } from "./Il2cppMetadataFormat.js";
const entries = (indexing, section, recordBytes) => {
    const count = indexing === "counted" ? (section.count ?? 0) : section.size / recordBytes;
    if (!Number.isInteger(count) || section.size !== count * recordBytes)
        throw new Il2cppMetadataFormatFailure("record-size-mismatch", `section ${section.name} size ${section.size} does not hold whole ${recordBytes}-byte records`);
    return count;
};
/** Own member record widths and validate all counts before any row allocation. */
export const readIl2cppMemberTables = ({ widths, indexing, section, }) => {
    const recordBytes = {
        fields: 8 + widths.type,
        properties: 20,
        events: 20 + widths.type,
        parameters: 8 + widths.type,
        stringLiterals: indexing === "counted" ? 4 : 8,
    };
    const literalRecords = entries(indexing, section("stringLiterals"), recordBytes.stringLiterals);
    return {
        recordBytes,
        literalRecords,
        counts: {
            fields: entries(indexing, section("fields"), recordBytes.fields),
            properties: entries(indexing, section("properties"), recordBytes.properties),
            events: entries(indexing, section("events"), recordBytes.events),
            parameters: entries(indexing, section("parameters"), recordBytes.parameters),
            string_literals: indexing === "counted"
                ? Math.max(literalRecords - 1, 0)
                : literalRecords,
        },
    };
};
/** Owners come from already parsed type/method facts, never a second raw-table interpretation. */
function* claim(ranges, total, label) {
    const owners = new Int32Array(total).fill(-1);
    let work = 0;
    for (const [owner, range] of ranges.entries()) {
        if (++work % 256 === 0)
            yield;
        checkRange(`${label} range of owner ${owner}`, range.start, range.count, total);
        for (let row = range.start; row < range.start + range.count; row++) {
            if (++work % 256 === 0)
                yield;
            if (owners[row] !== -1)
                throw new Il2cppMetadataFormatFailure("declaring-type-mismatch", `${label} ${row} is claimed by owners ${owners[row]} and ${owner}`);
            owners[row] = owner;
        }
    }
    return owners;
}
function* readNamed(tables, name, ranges, makeRow) {
    const section = tables.section(name), total = tables.members.counts[name];
    const owners = yield* claim(ranges, total, name), rows = [];
    for (let index = 0; index < total; index++) {
        if (index % 256 === 0)
            yield;
        const row = makeRow(tables.readString(tables.bytes.readInt32LE(section.offset + index * tables.members.recordBytes[name]), `${name} ${index} name`), owners[index]);
        if (tables.linkFacts !== undefined &&
            (name === "fields" || name === "parameters")) {
            const column = name === "fields"
                ? tables.linkFacts.fieldTypes
                : tables.linkFacts.parameterTypes;
            column[index] = readIndex(tables.bytes, section.offset +
                index * tables.members.recordBytes[name] +
                (name === "fields" ? 4 : 8), tables.widths.type);
        }
        tables.onRow?.(row);
        rows.push(row);
    }
    return rows;
}
function* readStringLiterals(tables) {
    const { bytes, section, indexing, members } = tables;
    const literals = section("stringLiterals"), data = section("stringLiteralData");
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    // Repeated spans reuse their decoded text for this immutable file snapshot.
    const decoded = new Map();
    const rows = [];
    if (indexing === "counted" && members.literalRecords === 1) {
        const sentinel = bytes.readInt32LE(literals.offset);
        if (sentinel < 0 || sentinel > data.size)
            throw new Il2cppMetadataFormatFailure("index-out-of-range", `empty string literal sentinel ${sentinel} is outside the ${data.size}-byte literal data`);
    }
    for (let index = 0; index < members.counts.string_literals; index++) {
        if (index % 256 === 0)
            yield;
        const at = literals.offset + index * members.recordBytes.stringLiterals;
        const start = bytes.readInt32LE(at + (indexing === "counted" ? 0 : 4));
        const length = indexing === "counted"
            ? bytes.readInt32LE(at + 4) - start
            : bytes.readUInt32LE(at);
        if (start < 0 || length < 0 || start + length > data.size)
            throw new Il2cppMetadataFormatFailure("index-out-of-range", `string literal ${index} [${start}, ${start + length}) is outside the ${data.size}-byte literal data`);
        const key = `${start}:${length}`;
        let literal = decoded.get(key);
        if (literal === undefined) {
            // Strict UTF-8 round trips preserve at least these bytes; base64 is larger.
            // Refuse impossible output before allocating either representation.
            tables.beforeText?.(length);
            const value = bytes.subarray(data.offset + start, data.offset + start + length);
            try {
                literal = { value: decoder.decode(value), value_base64: null };
            }
            catch {
                tables.beforeText?.(4 * Math.ceil(length / 3));
                literal = { value: null, value_base64: value.toString("base64") };
            }
            decoded.set(key, literal);
        }
        tables.onRow?.(literal);
        rows.push({ ...literal });
    }
    return rows;
}
/** Decode each fact directly into its final row shape, yielding through ownership and content. */
export function* readIl2cppMembers(tables, owners) {
    const member = (name, declaring_type) => ({
        name,
        declaring_type,
    });
    const fields = yield* readNamed(tables, "fields", owners.fields, member);
    const properties = yield* readNamed(tables, "properties", owners.properties, member);
    const events = yield* readNamed(tables, "events", owners.events, member);
    const parameters = yield* readNamed(tables, "parameters", owners.parameters, (name, method) => ({ name, method }));
    return {
        fields,
        properties,
        events,
        parameters,
        string_literals: yield* readStringLiterals(tables),
    };
}
