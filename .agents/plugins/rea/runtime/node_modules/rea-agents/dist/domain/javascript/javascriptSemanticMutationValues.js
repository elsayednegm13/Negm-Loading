import { semanticPropertyPathKeyMatches, } from "./javascriptSemanticPropertyPaths.js";
/** Invalidate escaped object references without rewriting their containing slots. */
export const invalidateSemanticEscapedPath = (value, path) => {
    if (value.status !== "object" && value.status !== "array")
        return value;
    const [key, ...remaining] = path;
    if (key === undefined)
        return {
            status: "unknown",
            reason: "This object reference may have been mutated by a call.",
        };
    const invalidateChild = (property) => semanticPropertyPathKeyMatches(key, property.name)
        ? {
            ...property,
            value: invalidateSemanticEscapedPath(property.value, remaining),
        }
        : property;
    return value.status === "object"
        ? { ...value, properties: value.properties.map(invalidateChild) }
        : { ...value, items: value.items.map(invalidateChild) };
};
/**
 * Invalidate only slots that explicit mutations can affect, as if applying each
 * path in order. Paths are grouped per slot so that many writes to one object
 * cost one pass over its slots rather than one pass per write.
 */
export const invalidateSemanticMutationPaths = (value, paths) => {
    if (paths.length === 0)
        return value;
    // An unknown key or a replaced value leaves nothing that a later path can
    // restore, wherever it occurs in the sequence.
    if ((value.status !== "object" && value.status !== "array") ||
        paths.some(([key]) => key === undefined || key === null))
        return {
            status: "unknown",
            reason: "This property may have been mutated.",
        };
    // Writing an array length discards every item known before it.
    const reset = value.status === "array"
        ? paths.findLastIndex(([key]) => key === "length")
        : -1;
    const base = reset < 0
        ? value
        : { status: "array", items: [], unknownItems: true, omittedItems: null };
    const slots = base.status === "object" ? base.properties : base.items;
    const slotsByName = new Map();
    slots.forEach((property, index) => {
        const indexes = slotsByName.get(property.name) ?? [];
        indexes.push(index);
        slotsByName.set(property.name, indexes);
    });
    const slotPaths = new Map();
    const replacedSlots = new Set();
    const select = (index, remaining) => {
        const selected = slotPaths.get(index) ?? [];
        selected.push(remaining);
        slotPaths.set(index, selected);
        if (remaining.length === 0)
            replacedSlots.add(index);
    };
    // An added slot is already unknown, so later paths that select it are inert.
    const added = new Set();
    for (const [key, ...remaining] of paths.slice(reset + 1)) {
        if (key === undefined || key === null)
            continue;
        if (typeof key === "object") {
            slots.forEach((property, index) => {
                if (semanticPropertyPathKeyMatches(key, property.name))
                    select(index, remaining);
            });
            continue;
        }
        const indexes = slotsByName.get(String(key));
        if (indexes === undefined)
            added.add(String(key));
        else
            for (const index of indexes)
                select(index, remaining);
    }
    const properties = slots.map((property, index) => {
        const selected = slotPaths.get(index);
        return selected === undefined
            ? property
            : {
                ...property,
                ...(replacedSlots.has(index)
                    ? { presence: "unknown-coverage" }
                    : {}),
                value: invalidateSemanticMutationPaths(property.value, selected),
            };
    });
    for (const name of added)
        properties.push({
            name,
            value: {
                status: "unknown",
                reason: "This property may have been mutated.",
            },
            presence: "unknown-coverage",
        });
    return base.status === "object"
        ? { ...base, properties }
        : { ...base, items: properties };
};
