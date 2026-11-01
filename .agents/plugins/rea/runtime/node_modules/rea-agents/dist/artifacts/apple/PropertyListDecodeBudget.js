import { decodeXmlPlistText } from "../../domain/propertyListXmlText.js";
import { hasBinaryPlistSignature } from "../../domain/apple/appleArchiveFormat.js";
import { binaryPlistCloneOffsetWidth, binaryDateRequiresExactSeconds, binaryPlistObjectEnd, binaryPlistUidNormalizationWidth, } from "./PlistScalars.js";
/** Preflight the representation created by the pinned plist decoder. */
export const preflightPropertyListDecode = (bytes, maxBytes, xmlText, options = {}) => {
    const { numberProjection = false, uidProjection = false, budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure, } = options;
    const expansion = hasBinaryPlistSignature(bytes)
        ? estimateBinaryPlistExpansion(bytes, maxBytes, {
            numberProjection,
            uidProjection,
            budget,
            fail,
        })
        : {
            estimatedBytes: estimateXmlPlistExpansion(bytes, maxBytes, xmlText, numberProjection, budget, fail),
            binaryPrototypeKeyObserved: false,
            datePrecisionOverlapCount: 0,
            reachableDateOffsets: [],
            overlappingDateOffsets: [],
            reachableWideIntegerOffsets: [],
            overlappingWideIntegerOffsets: [],
            reachableNumericOffsets: [],
            uidOffsetsToNormalize: [],
            containersToNormalize: [],
            normalizedOffsetSize: 1,
            normalizedReferenceSize: 1,
        };
    if (expansion.estimatedBytes > maxBytes)
        throw fail("expansion", `plist representation exceeds ${budget}`);
    return expansion;
};
const estimateXmlPlistExpansion = (bytes, maxBytes, xmlText, numberProjection = false, budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure) => {
    const xml = xmlText ?? decodeXmlPlistText(bytes);
    const decodedSourceBytes = xml.length * 2;
    let elementCount = 0;
    // Reserve room for numeric source metadata and the projected attribute copy.
    const elementBytes = numberProjection ? 256 : 128;
    // Value nesting is bounded by the shared plist parser, which counts plist
    // value depth; raw element depth would also count the envelope and keys.
    for (const token of xmlPreflightTokens(xml)) {
        if (token.doctype) {
            // Only a declaration outside opaque text can introduce an internal
            // subset. Brackets in quoted external identifiers are literal text.
            if (token.internalSubset)
                throw fail("expansion", `XML plist internal entity expansion exceeds ${budget}`);
            continue;
        }
        elementCount += 1;
        if (decodedSourceBytes * 2 + elementCount * elementBytes > maxBytes)
            return maxBytes + 1;
    }
    return decodedSourceBytes * 2 + elementCount * elementBytes;
};
/** Consume each XML span once; malformed tokens cannot restart suffix scans. */
function* xmlPreflightTokens(xml) {
    let cursor = 0;
    while (cursor < xml.length) {
        const start = xml.indexOf("<", cursor);
        if (start < 0)
            return;
        const opaqueEnd = xml.startsWith("<!--", start)
            ? "-->"
            : xml.startsWith("<![CDATA[", start)
                ? "]]>"
                : xml.startsWith("<?", start)
                    ? "?>"
                    : undefined;
        if (opaqueEnd !== undefined) {
            const end = xml.indexOf(opaqueEnd, start + 2);
            if (end < 0)
                return;
            cursor = end + opaqueEnd.length;
            continue;
        }
        const doctype = /^<!DOCTYPE\b/iu.test(xml.slice(start, start + 10));
        const element = /^<\/?[A-Za-z]/u.test(xml.slice(start, start + 4));
        let quote;
        let internalSubset = false;
        let end = start + 1;
        for (; end < xml.length; end += 1) {
            const character = xml[end];
            if (quote !== undefined) {
                if (character === quote)
                    quote = undefined;
            }
            else if (character === '"' || character === "'")
                quote = character;
            else if (character === ">")
                break;
            else if (doctype && character === "[")
                internalSubset = true;
        }
        if (end === xml.length)
            return;
        cursor = end + 1;
        if (doctype || element)
            yield { doctype, internalSubset };
    }
}
/** Deepest binary plist value nesting the reference walk admits. */
export const MAX_BINARY_PLIST_NESTING_DEPTH = 128;
/** Typed failure for shared plist preflight resource limits. */
export class PropertyListDecodeBudgetFailure extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
        this.name = "PropertyListDecodeBudgetFailure";
    }
}
const propertyListDecodeBudgetFailure = (kind, message) => new PropertyListDecodeBudgetFailure(kind, message);
const PROTOTYPE_KEY = "__proto__";
const findOverlappingScalarOffsets = (spans, scalarOffsets) => {
    let maxPriorEnd = -1;
    const overlappingOffsets = new Set();
    const activeScalars = new Map();
    for (const span of spans) {
        for (const [offset, end] of activeScalars)
            if (end <= span.offset)
                activeScalars.delete(offset);
        if (scalarOffsets.has(span.offset)) {
            if (maxPriorEnd > span.offset) {
                overlappingOffsets.add(span.offset);
                for (const activeOffset of activeScalars.keys())
                    overlappingOffsets.add(activeOffset);
                activeScalars.clear();
            }
            else
                activeScalars.set(span.offset, span.end);
        }
        else {
            for (const activeOffset of activeScalars.keys())
                overlappingOffsets.add(activeOffset);
            activeScalars.clear();
        }
        maxPriorEnd = Math.max(maxPriorEnd, span.end);
    }
    return overlappingOffsets;
};
/**
 * Count every expanded binary-plist reference before calling plist.parseBinary,
 * which recurses on each reference and copies shared containers. Malformed
 * structure throws TypeError; resource and cycle failures use `fail`.
 */
export const estimateBinaryPlistExpansion = (bytes, maxBytes, { budget = "the property list decode budget", fail = propertyListDecodeBudgetFailure, bounds = "strict", numberProjection = false, uidProjection = false, maximumDepth = MAX_BINARY_PLIST_NESTING_DEPTH, } = {}) => {
    if (bytes.length < 40)
        throw new TypeError("binary plist trailer is truncated");
    const trailer = bytes.length - 32;
    const offsetSize = bytes[trailer + 6] ?? 0;
    const referenceSize = bytes[trailer + 7] ?? 0;
    if (offsetSize < 1 || referenceSize < 1)
        throw new TypeError("binary plist trailer integer sizes are invalid");
    const readInteger = (offset, size) => {
        if (offset < 0 || size < 1 || offset + size > bytes.length)
            return -1;
        let value = 0n;
        for (let index = 0; index < size; index += 1)
            value = BigInt.asUintN(64, (value << 8n) | BigInt(bytes[offset + index] ?? 0));
        return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : -1;
    };
    const objectCount = readInteger(trailer + 8, 8);
    const topObject = readInteger(trailer + 16, 8);
    const offsetTable = readInteger(trailer + 24, 8);
    const tableEnd = bounds === "strict" ? trailer : bytes.length;
    const objectsEnd = bounds === "strict" ? offsetTable : bytes.length;
    if (objectCount < 1 ||
        topObject < 0 ||
        topObject >= objectCount ||
        offsetTable < 8 ||
        !Number.isSafeInteger(objectCount * offsetSize) ||
        !Number.isSafeInteger(offsetTable + objectCount * offsetSize) ||
        offsetTable + objectCount * offsetSize > tableEnd)
        throw new TypeError("binary plist trailer or object table is invalid");
    if ((offsetSize < 8 && offsetTable >= 2 ** (offsetSize * 8)) ||
        (referenceSize < 8 && objectCount >= 2 ** (referenceSize * 8)))
        throw new TypeError("binary plist table width cannot address its contents");
    const normalizedReferenceSize = [1, 2, 4, 8].includes(referenceSize) &&
        (referenceSize === 8 || objectCount < 2 ** (referenceSize * 8))
        ? referenceSize
        : [1, 2, 4, 8].find((width) => width === 8 || objectCount < 2 ** (width * 8));
    if (normalizedReferenceSize === undefined)
        throw new TypeError("binary plist object reference count is invalid");
    // Reserve source metadata and reachable-offset indexes for scalar projection.
    // Without projection, the traversal retains only structural validation state.
    const objectBytes = numberProjection || uidProjection ? 320 : 16;
    const expandedNodeBytes = numberProjection || uidProjection ? 224 : 96;
    // Scalar projection may require a same-sized parser-compatible input copy
    // for wide integers and sub-millisecond dates. Reserve before allocation.
    let estimate = bytes.length * (numberProjection ? 3 : 2) + objectCount * objectBytes;
    let binaryPrototypeKeyObserved = false;
    if (estimate > maxBytes)
        throw fail("expansion", `binary plist object table exceeds ${budget}`);
    const active = new Set();
    const pending = [
        {
            object: topObject,
            depth: 0,
            exit: false,
            dictionaryKey: false,
            ...(uidProjection ? { path: null } : {}),
        },
    ];
    const binaryUidPaths = [];
    const dictionaryKeys = new Map();
    const readDictionaryKey = (object) => {
        const prior = dictionaryKeys.get(object);
        if (prior !== undefined)
            return prior;
        const offset = readInteger(offsetTable + object * offsetSize, offsetSize);
        if (offset < 8 || offset >= objectsEnd)
            throw new TypeError("binary plist object offset is invalid");
        const marker = bytes[offset] ?? 0;
        const type = marker >> 4;
        if (type !== 5 && type !== 6)
            throw new TypeError("binary plist dictionary key is not a string");
        let size = marker & 0x0f;
        let cursor = offset + 1;
        if (size === 15) {
            const extended = bytes[cursor] ?? 0;
            if (extended >> 4 !== 1 || (extended & 15) > 3)
                throw new TypeError("binary plist extended object size is invalid");
            const width = 1 << (extended & 15);
            size = readInteger(cursor + 1, width);
            cursor += 1 + width;
        }
        if (size < 0 || cursor + size * (type === 6 ? 2 : 1) > objectsEnd)
            throw new TypeError("binary plist scalar object is truncated");
        let key = "";
        for (let index = 0; index < size; index += 1)
            key += String.fromCharCode(type === 5
                ? bytes[cursor + index]
                : bytes.readUInt16BE(cursor + index * 2));
        dictionaryKeys.set(object, key);
        return key;
    };
    let pendingObjectCount = 1;
    const reachableObjectOffsets = new Set();
    const reachableDateOffsets = new Set();
    const reachableWideIntegerOffsets = new Set();
    const reachableNumericOffsets = new Set();
    const uidWidthsToNormalize = new Map();
    const containersToNormalize = new Map();
    const reachableDateOccurrences = [];
    while (pending.length > 0) {
        const entry = pending.pop();
        if (entry === undefined)
            break;
        if (entry.exit) {
            active.delete(entry.object);
            continue;
        }
        pendingObjectCount -= 1;
        if (entry.depth > maximumDepth)
            throw fail("depth", `binary plist nesting exceeds ${budget}`);
        if (active.has(entry.object))
            throw fail("cycle", `binary plist reference cycle exceeds ${budget}`);
        estimate += expandedNodeBytes;
        if (estimate > maxBytes)
            throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
        const offset = readInteger(offsetTable + entry.object * offsetSize, offsetSize);
        if (offset < 8 || offset >= objectsEnd)
            throw new TypeError("binary plist object offset is invalid");
        if (numberProjection)
            reachableObjectOffsets.add(offset);
        const marker = bytes[offset] ?? 0;
        const type = marker >> 4;
        if (entry.dictionaryKey && type !== 5 && type !== 6)
            throw new TypeError("binary plist dictionary key is not a string");
        if (type === 3) {
            if (marker !== 0x33)
                throw new TypeError(`binary plist date marker 0x${marker.toString(16)} is invalid`);
            // The offset table and trailer are not part of an encoded object. Keep
            // this scalar boundary even when compatibility mode follows decoder
            // bounds for other object and reference checks.
            if (offset + 9 > offsetTable)
                throw new TypeError("binary plist date object is truncated");
            if (numberProjection) {
                reachableDateOffsets.add(offset);
                reachableDateOccurrences.push(offset);
            }
            continue;
        }
        if (type === 8) {
            const uidWidth = (marker & 0x0f) + 1;
            if (offset + 1 + uidWidth > objectsEnd)
                throw new TypeError("binary plist UID object is truncated");
            if (entry.path !== undefined)
                binaryUidPaths.push(entry.path);
            const normalizedWidth = binaryPlistUidNormalizationWidth(bytes, offset);
            if (normalizedWidth !== undefined)
                uidWidthsToNormalize.set(offset, normalizedWidth);
            continue;
        }
        if (type === 1 || type === 2) {
            const info = marker & 0x0f;
            if (type === 1 && info > 4)
                throw new TypeError("binary plist integer width is invalid");
            if (type === 2 && info !== 2 && info !== 3)
                throw new TypeError("binary plist real width is invalid");
            const width = 1 << info;
            if (offset + 1 + width > offsetTable)
                throw new TypeError("binary plist numeric scalar is truncated");
            if (numberProjection) {
                reachableNumericOffsets.add(offset);
                if (type === 1 && width === 16)
                    reachableWideIntegerOffsets.add(offset);
            }
            continue;
        }
        let size = marker & 0x0f;
        let cursor = offset + 1;
        if (size === 0x0f && type !== 0 && type !== 8) {
            const extMarker = bytes[cursor] ?? 0;
            if (extMarker >> 4 !== 1 || (extMarker & 0x0f) > 3)
                throw new TypeError("binary plist extended object size is invalid");
            cursor += 1;
            const integerSize = 1 << (extMarker & 0x0f);
            size = readInteger(cursor, integerSize);
            cursor += integerSize;
            if (size < 0 || cursor > objectsEnd)
                throw new TypeError("binary plist extended object size is invalid");
        }
        if (type === 4 || type === 5 || type === 6) {
            const byteLength = type === 6 ? size * 2 : size;
            if (cursor + byteLength > objectsEnd)
                throw new TypeError("binary plist scalar object is truncated");
            if (!binaryPrototypeKeyObserved &&
                entry.dictionaryKey &&
                (type === 5 || type === 6) &&
                size === PROTOTYPE_KEY.length) {
                let matches = true;
                for (let index = 0; index < PROTOTYPE_KEY.length; index += 1) {
                    const codeUnit = type === 5
                        ? (bytes[cursor + index] ?? 0)
                        : ((bytes[cursor + index * 2] ?? 0) << 8) |
                            (bytes[cursor + index * 2 + 1] ?? 0);
                    if (codeUnit !== PROTOTYPE_KEY.charCodeAt(index)) {
                        matches = false;
                        break;
                    }
                }
                if (matches)
                    binaryPrototypeKeyObserved = true;
            }
            estimate += type === 4 ? size + 4 * Math.ceil(size / 3) : byteLength * 2;
            if (estimate > maxBytes)
                throw fail("expansion", `binary plist scalar expansion exceeds ${budget}`);
            continue;
        }
        if (type !== 10 && type !== 13)
            continue;
        const childCount = type === 13 ? size * 2 : size;
        const refsEnd = cursor + childCount * referenceSize;
        if (!Number.isSafeInteger(refsEnd) || refsEnd > objectsEnd)
            throw new TypeError("binary plist reference table is truncated");
        const availableNodes = Math.floor((maxBytes - estimate) / expandedNodeBytes);
        if (childCount > availableNodes - pendingObjectCount)
            throw fail("expansion", `binary plist reference expansion exceeds ${budget}`);
        const parsedReferences = referenceSize !== normalizedReferenceSize &&
            !containersToNormalize.has(offset)
            ? []
            : undefined;
        // A duplicate dictionary key exposes only its final value in plist@5.
        // Keep provenance for that value while still validating every source ref.
        const valueKeys = new Map();
        if (entry.path !== undefined && type === 13) {
            const lastKeyIndexes = new Map();
            for (let index = 0; index < size; index += 1) {
                const reference = readInteger(cursor + index * referenceSize, referenceSize);
                if (reference < 0 || reference >= objectCount)
                    throw new TypeError("binary plist reference is invalid");
                lastKeyIndexes.set(readDictionaryKey(reference), index);
            }
            for (const [key, index] of lastKeyIndexes)
                if (key !== PROTOTYPE_KEY)
                    valueKeys.set(size + index, key);
        }
        active.add(entry.object);
        pending.push({
            object: entry.object,
            depth: entry.depth,
            exit: true,
            dictionaryKey: false,
        });
        for (let index = childCount - 1; index >= 0; index -= 1) {
            const reference = readInteger(cursor + index * referenceSize, referenceSize);
            if (reference < 0 || reference >= objectCount)
                throw new TypeError("binary plist reference is invalid");
            if (parsedReferences !== undefined)
                parsedReferences[index] = reference;
            pending.push({
                object: reference,
                depth: entry.depth + 1,
                exit: false,
                dictionaryKey: type === 13 && index < size,
                ...(entry.path === undefined || (type === 13 && !valueKeys.has(index))
                    ? {}
                    : {
                        path: {
                            parent: entry.path,
                            key: type === 13 ? valueKeys.get(index) : index,
                        },
                    }),
            });
        }
        if (parsedReferences !== undefined)
            containersToNormalize.set(offset, {
                offset,
                headerLength: cursor - offset,
                references: parsedReferences,
            });
        pendingObjectCount += childCount;
    }
    const uidOffsetsToNormalize = [...uidWidthsToNormalize]
        .map(([offset, width]) => ({ offset, width }))
        .sort((left, right) => left.offset - right.offset);
    const normalizedContainers = [...containersToNormalize.values()].sort((left, right) => left.offset - right.offset);
    const containerCloneLengths = normalizedContainers.map(({ headerLength, references }) => {
        const cloneLength = headerLength + references.length * normalizedReferenceSize;
        if (!Number.isSafeInteger(cloneLength))
            throw new TypeError("binary plist reference table is too large");
        return cloneLength;
    });
    const normalizeOffsetWidth = (cloneLengths) => {
        const width = binaryPlistCloneOffsetWidth(offsetSize, offsetTable, cloneLengths);
        if (width === undefined)
            throw new TypeError("binary plist object offset exceeds supported width");
        return width;
    };
    if (!numberProjection) {
        const cloneLengths = [
            ...uidOffsetsToNormalize.map(({ width }) => width + 1),
            ...containerCloneLengths,
        ];
        const normalizedOffsetSize = normalizeOffsetWidth(cloneLengths);
        if (cloneLengths.length > 0 || normalizedOffsetSize !== offsetSize) {
            const cloneBytes = cloneLengths.reduce((sum, length) => sum + length, 0);
            estimate +=
                cloneBytes + objectCount * (normalizedOffsetSize - offsetSize);
            if (estimate > maxBytes)
                throw fail("expansion", `binary plist UID-copy expansion exceeds ${budget}`);
        }
        return {
            estimatedBytes: estimate,
            ...(uidProjection ? { binaryUidPaths } : {}),
            binaryPrototypeKeyObserved,
            datePrecisionOverlapCount: 0,
            reachableDateOffsets: [],
            overlappingDateOffsets: [],
            reachableWideIntegerOffsets: [],
            overlappingWideIntegerOffsets: [],
            reachableNumericOffsets: [],
            uidOffsetsToNormalize,
            containersToNormalize: normalizedContainers,
            normalizedOffsetSize,
            normalizedReferenceSize,
        };
    }
    // Distinct objects can legally overlap in binary plists. Rewriting a date or
    // wide integer in place could change another reachable value, so isolate
    // affected scalar records in the decoder copy. Track both overlap directions
    // using the same bounded span parser as scalar collection.
    const reachableSpans = [...reachableObjectOffsets]
        .map((offset) => ({
        offset,
        end: binaryPlistObjectEnd(bytes, offset, objectsEnd, referenceSize),
    }))
        .filter((span) => span.end !== undefined)
        .sort((left, right) => left.offset - right.offset);
    const overlappingDateOffsets = findOverlappingScalarOffsets(reachableSpans, reachableDateOffsets);
    const overlappingWideIntegerOffsets = findOverlappingScalarOffsets(reachableSpans, reachableWideIntegerOffsets);
    const precisionUnknownDateOffsets = [...overlappingDateOffsets]
        .filter((offset) => {
        const seconds = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(offset + 1);
        return binaryDateRequiresExactSeconds(seconds);
    })
        .sort((left, right) => left - right);
    const cloneOffsets = new Set([
        ...precisionUnknownDateOffsets,
        ...overlappingWideIntegerOffsets,
    ]);
    const cloneLengths = [
        ...uidOffsetsToNormalize.map(({ width }) => width + 1),
        ...containerCloneLengths,
        ...Array.from(cloneOffsets, () => 9),
    ];
    const normalizedOffsetSize = normalizeOffsetWidth(cloneLengths);
    if (cloneLengths.length > 0 || normalizedOffsetSize !== offsetSize) {
        const cloneBytes = cloneLengths.reduce((sum, length) => sum + length, 0);
        estimate += cloneBytes + objectCount * (normalizedOffsetSize - offsetSize);
        if (estimate > maxBytes)
            throw fail("expansion", `binary plist scalar-copy expansion exceeds ${budget}`);
    }
    const precisionUnknownOffsets = new Set(precisionUnknownDateOffsets);
    const datePrecisionOverlapCount = reachableDateOccurrences.filter((offset) => precisionUnknownOffsets.has(offset)).length;
    return {
        estimatedBytes: estimate,
        ...(uidProjection ? { binaryUidPaths } : {}),
        binaryPrototypeKeyObserved,
        datePrecisionOverlapCount,
        reachableDateOffsets: [...reachableDateOffsets].sort((left, right) => left - right),
        overlappingDateOffsets: precisionUnknownDateOffsets,
        reachableWideIntegerOffsets: [...reachableWideIntegerOffsets].sort((left, right) => left - right),
        overlappingWideIntegerOffsets: [...overlappingWideIntegerOffsets].sort((left, right) => left - right),
        reachableNumericOffsets: [...reachableNumericOffsets].sort((left, right) => left - right),
        uidOffsetsToNormalize,
        containersToNormalize: normalizedContainers,
        normalizedOffsetSize,
        normalizedReferenceSize,
    };
};
