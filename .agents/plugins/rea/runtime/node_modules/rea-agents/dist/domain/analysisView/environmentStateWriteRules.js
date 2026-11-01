import { decodedSegment, isParam, normalizedPath, pathSegmentMatches, same, segmentsOf, } from "./environmentStateRules.js";
import { sortedStrings, } from "./environmentStateWriteValues.js";
import { showsFixedWidth, trimmedLike, } from "./environmentStateWriteClockFormats.js";
/** Clock rules spelled as a trimmed sibling is, since an application spells its clocks alike: fields whose `values`, and every `later` call's, show no fixed width. */
export const siblingTrimmedClocks = (rules, values, ...later) => {
    const trimmed = new Map();
    for (const rule of rules) {
        if (rule.rule !== "clock" ||
            rule.format.kind !== "iso" ||
            rule.format.trimmed !== true)
            continue;
        const format = rule.format;
        const group = `${format.separator}${format.zone}`;
        const widest = trimmed.get(group);
        if (widest === undefined || format.fraction > widest.fraction)
            trimmed.set(group, format);
    }
    if (trimmed.size === 0)
        return [...rules];
    return rules.map((rule) => {
        if (rule.rule !== "clock" || rule.format.kind !== "iso")
            return rule;
        const peer = trimmed.get(`${rule.format.separator}${rule.format.zone}`);
        if (peer === undefined)
            return rule;
        const format = later.some((fields) => showsFixedWidth(rule.format, fields[rule.field]))
            ? rule.format
            : trimmedLike(rule.format, peer, values?.[rule.field]);
        return format === rule.format ? rule : { ...rule, format };
    });
};
/**
 * Two calls' rules for a field as one plan holds them: equal, or echoes one of which sorted its strings (a call whose
 * array was already in order cannot show it), kept sorted unless a call kept strings out of order. Undefined when they
 * differ otherwise.
 */
export const alikeRules = (held, later, kept = new Set()) => {
    if (held.rule !== "echo" || later.rule !== "echo")
        return same(held, later) ? held : undefined;
    if ((held.sorted === true) === (later.sorted === true))
        return held;
    if (kept.has(held.field))
        return undefined;
    return held.sorted === true ? held : later;
};
/** Members a call sent as strings out of code-point order and stored as sent, which shows the application keeps their order. */
export const keptOrders = (body, stored) => Object.keys(body).filter((member) => sortedStrings(body[member]) !== undefined &&
    same(stored[member], body[member]));
/** The effect a state-changing tool has and its target: a state type, or a document tool by template. */
export const classifyWrite = (tool, types, documents) => {
    const segments = segmentsOf(tool.path_template);
    const path = normalizedPath(tool.path_template);
    const parent = `/${segments.slice(0, -1).join("/")}`;
    const item = segments.length > 0 && isParam(segments.at(-1));
    if (tool.method === "POST" && types.has(path))
        return { effect: "create", target: path };
    if (item && types.has(parent)) {
        if (tool.method === "DELETE")
            return { effect: "delete", target: parent };
        if (["PUT", "PATCH", "POST"].includes(tool.method))
            return { effect: "update", target: parent };
    }
    const document = documents.get(path);
    if (document !== undefined && ["PUT", "PATCH", "POST"].includes(tool.method))
        return { effect: "document", target: document };
    return { effect: "none", target: null };
};
/** A plan for a tool whose effect is not modelled or cannot be built. */
export const unservedPlan = (tool, effect, target, reason) => ({
    tool,
    effect,
    target,
    served: false,
    reason,
    exemplar_ordinal: null,
    observation: null,
    response: null,
    body: null,
    rules: [],
    collection: null,
    insert: null,
    merge: null,
    checked_record_ordinals: [],
    contradicted_by: null,
});
/** The value each template parameter takes in a concrete path, decoded; undefined when the path does not instantiate it. */
export const pathValuesOf = (template, path) => {
    const pattern = segmentsOf(template);
    const concrete = segmentsOf(path);
    if (pattern.length !== concrete.length)
        return undefined;
    const values = new Map();
    for (const [index, segment] of pattern.entries()) {
        const value = concrete[index];
        if (!isParam(segment)) {
            if (segment !== value)
                return undefined;
            continue;
        }
        values.set(segment.slice(1, -1), decodedSegment(value));
    }
    return values;
};
/** Whether two paths are segment prefixes of one another, a parameter on either side matching any segment, with the shared single-decode spelling rule. */
export const prefixRelated = (left, right) => {
    const a = segmentsOf(left);
    const b = segmentsOf(right);
    const shared = Math.min(a.length, b.length);
    for (let index = 0; index < shared; index += 1)
        if (!isParam(a[index]) &&
            !isParam(b[index]) &&
            !pathSegmentMatches(a[index], b[index]))
            return false;
    return true;
};
