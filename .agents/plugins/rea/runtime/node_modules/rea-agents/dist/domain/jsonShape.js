import { z } from "zod";
import { compareUnicodeCodePoints } from "./unicodeCodePointOrder.js";
import { safeParseJson } from "./safeJson.js";
import { jsonStringByteLength } from "./jsonStringByteLength.js";
import { jsonValueByteLength } from "./jsonValueByteLength.js";
import { err, ok } from "./result.js";
const jsonValueTypeSchema = z.enum([
    "object",
    "array",
    "string",
    "number",
    "boolean",
    "null",
]);
const jsonShapePathSegmentSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("property"), name: z.string() }),
    z.object({ kind: z.literal("array-element") }),
]);
/** Value-free structural summary of one approved JSON payload. */
export const jsonShapeSchema = z.object({
    root_type: jsonValueTypeSchema,
    node_count: z.int().min(1),
    max_depth_observed: z.int().min(0),
    properties: z.array(z.object({
        path: z.array(jsonShapePathSegmentSchema).min(1),
        types: z.array(jsonValueTypeSchema).min(1),
        observations: z.int().min(1),
    })),
});
const arrayElementKey = Symbol("array-element");
const propertyBaseBytes = jsonValueByteLength({
    path: [],
    types: [],
    observations: 0,
});
const digits = (value) => String(value).length;
/** Infer complete value-free facts only within the caller's remaining output allowance. */
export const inferJsonShape = (source, maximumBytes) => {
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0)
        throw new RangeError("JSON shape byte allowance must be a non-negative safe integer");
    let text;
    try {
        text =
            typeof source === "string"
                ? source
                : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(source);
    }
    catch {
        return err({ kind: "invalid-json" });
    }
    const parsed = safeParseJson(text);
    if (!parsed.ok)
        return err({ kind: "invalid-json" });
    const root = parsed.value;
    const rootType = jsonValueType(root);
    let serializedBytes = jsonValueByteLength({
        root_type: rootType,
        node_count: 0,
        max_depth_observed: 0,
        properties: [],
    });
    let requiredBytesAtLeast = serializedBytes;
    const capacity = () => err({
        kind: "capacity",
        maximumBytes,
        requiredBytesAtLeast,
    });
    const reserve = (bytes) => {
        requiredBytesAtLeast = serializedBytes + bytes;
        if (requiredBytesAtLeast > maximumBytes)
            return false;
        serializedBytes = requiredBytesAtLeast;
        return true;
    };
    if (serializedBytes > maximumBytes)
        return capacity();
    const rootShape = {
        depth: 0,
        pathBytes: 2,
        types: new Set(),
        observations: 0,
    };
    let propertyCount = 0;
    const childShape = (parent, key) => {
        const existing = parent.children?.get(key);
        if (existing !== undefined)
            return existing;
        const segment = typeof key === "string"
            ? { kind: "property", name: key }
            : { kind: "array-element" };
        const segmentBytes = jsonValueByteLength(segment, maximumBytes - serializedBytes);
        const pathBytes = parent.pathBytes + segmentBytes + (parent.depth === 0 ? 0 : 1);
        // Admit the expanded serialized path before allocating its accumulator.
        // Parent links retain one segment rather than every temporary full path.
        if (!reserve(propertyBaseBytes - 2 + pathBytes + (propertyCount === 0 ? 0 : 1)))
            return undefined;
        const node = {
            parent,
            segment,
            depth: parent.depth + 1,
            pathBytes,
            types: new Set(),
            observations: 0,
        };
        (parent.children ??= new Map()).set(key, node);
        propertyCount++;
        return node;
    };
    const pending = [{ value: root, shape: rootShape }];
    let nodeCount = 0;
    let maxDepthObserved = 0;
    while (pending.length > 0) {
        const current = pending.at(-1);
        if (current.children === undefined) {
            const nextCount = nodeCount + 1;
            const nextDepth = Math.max(maxDepthObserved, current.shape.depth);
            if (!reserve(digits(nextCount) -
                digits(nodeCount) +
                digits(nextDepth) -
                digits(maxDepthObserved)))
                return capacity();
            nodeCount = nextCount;
            maxDepthObserved = nextDepth;
            if (current.shape.parent !== undefined) {
                const type = jsonValueType(current.value);
                const newType = !current.shape.types.has(type);
                const nextObservations = current.shape.observations + 1;
                const typeBytes = newType
                    ? jsonStringByteLength(type) +
                        (current.shape.types.size === 0 ? 0 : 1)
                    : 0;
                if (!reserve(typeBytes +
                    digits(nextObservations) -
                    digits(current.shape.observations)))
                    return capacity();
                current.shape.types.add(type);
                current.shape.observations = nextObservations;
            }
            current.children = shapeChildren(current.value);
        }
        const next = current.children.next();
        if (next.done) {
            pending.pop();
            continue;
        }
        const [key, value] = next.value;
        const shape = childShape(current.shape, key);
        if (shape === undefined)
            return capacity();
        pending.push({ value, shape });
    }
    // Every expanded output path was admitted above. Reconstruct each path once,
    // preserving independently owned segments and canonical sibling ordering.
    const properties = [];
    const shapes = orderedChildren(rootShape);
    while (shapes.length > 0) {
        const shape = shapes.pop();
        const path = [];
        let ancestor = shape;
        while (ancestor.parent !== undefined && ancestor.segment !== undefined) {
            path.push({ ...ancestor.segment });
            ancestor = ancestor.parent;
        }
        path.reverse();
        properties.push({
            path,
            types: [...shape.types].sort(),
            observations: shape.observations,
        });
        for (const child of orderedChildren(shape))
            shapes.push(child);
    }
    return ok({
        shape: {
            root_type: rootType,
            node_count: nodeCount,
            max_depth_observed: maxDepthObserved,
            properties,
        },
        serializedBytes,
    });
};
/** Keep traversal scratch proportional to nesting rather than a wide input array. */
function* shapeChildren(value) {
    if (Array.isArray(value)) {
        for (const item of value)
            yield [arrayElementKey, item];
    }
    else if (isRecord(value)) {
        for (const key in value)
            if (Object.hasOwn(value, key))
                yield [key, value[key]];
    }
}
/** Parse text as a JSON object; anything else, including invalid JSON, is null. */
export const parseJsonObject = (text) => {
    const parsed = safeParseJson(text);
    return parsed.ok && isRecord(parsed.value) ? parsed.value : null;
};
/** The JSON type name of one parsed value. */
export const jsonValueType = (value) => {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "array";
    switch (typeof value) {
        case "string":
            return "string";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        default:
            return "object";
    }
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/** Reverse sibling order for the traversal stack; array elements sort first. */
const orderedChildren = (node) => [...(node.children ?? [])]
    .sort(([left], [right]) => left === right
    ? 0
    : left === arrayElementKey
        ? 1
        : right === arrayElementKey
            ? -1
            : compareUnicodeCodePoints(right, left))
    .map(([, child]) => child);
