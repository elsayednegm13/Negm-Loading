import { compareUnicodeCodePoints as compare, compositeKey, } from "../unicodeCodePointOrder.js";
import { iterateUrlQueryParameters, parseUrlQueryParameterNames, singleQueryValues, } from "../recordedTransportUrl.js";
import { allLines, pathSegmentMatches, isParam, listsAll, segmentsOf, } from "./environmentStateRules.js";
import { pagesOnly } from "./environmentStatePaging.js";
/** A query's decoded values by name, in any order, as replay compares a call's. */
export const queryValuesKey = (values) => compositeKey([...values].sort(([left], [right]) => compare(left, right)));
/** A query as replay compares a call's; undefined when it repeats a name with another value, which no call's arguments can carry. */
export const queryKey = (query) => {
    const values = singleQueryValues(query ?? undefined);
    return values === undefined ? undefined : queryValuesKey(values);
};
const lineOf = (record) => ({
    ordinal: record.ordinal,
    segments: segmentsOf(record.path),
    query: record.query,
});
/** A query list's roles, and its query and whole lines in the tool's recorded order, which replay keeps among equal matches. */
const queryLines = (view, tool, byOrdinal) => {
    if (view.shape !== "list" || view.query === undefined)
        return undefined;
    const answered = new Set([...view.query.record_ordinals, ...allLines(view)]);
    return {
        roles: new Set(Object.keys(view.query.parameters)),
        lines: tool.record_ordinals.flatMap((ordinal) => {
            const record = byOrdinal.get(ordinal);
            return record === undefined || !answered.has(ordinal)
                ? []
                : [lineOf(record)];
        }),
    };
};
/** Each list or document view's checked lines. */
export const checkedLines = (input) => {
    const byOrdinal = new Map(input.records.map((record) => [record.ordinal, record]));
    const tools = new Map(input.tools.map((tool) => [tool.name, tool]));
    const byView = new Map();
    for (const view of input.views.values()) {
        const tool = tools.get(view.tool);
        if (view.shape === "recorded" || view.shape === "item" || !tool)
            continue;
        const checked = new Set(view.checked_record_ordinals);
        const byQuery = new Map();
        const unfiltered = [];
        for (const ordinal of tool.record_ordinals) {
            const record = byOrdinal.get(ordinal);
            const key = record === undefined ? undefined : queryKey(record.query);
            if (!checked.has(ordinal) || key === undefined)
                continue;
            const line = lineOf(record);
            byQuery.set(key, [...(byQuery.get(key) ?? []), line]);
            if (view.shape === "list" &&
                listsAll(view, ordinal) &&
                pagesOnly(record.query))
                unfiltered.push(line);
        }
        const params = new Set(segmentsOf(tool.path_template).flatMap((segment, index) => isParam(segment) ? [index] : []));
        const query = queryLines(view, tool, byOrdinal);
        byView.set(view.tool, {
            params,
            byQuery,
            unfiltered,
            ...(query === undefined ? {} : { query }),
        });
    }
    return byView;
};
/**
 * The checked line serving answers a read's call from, ranked as replay ranks lines: every
 * parameter the read's value verbatim or once percent-decoded and the query the read's, then the
 * most verbatim parameters, then the most query values the read shares, then recorded order. A
 * read with no query falls back, as serving does, on a whole list's lines that only page it.
 */
export const servedLine = (lines, record) => {
    const key = queryKey(record.query);
    if (lines === undefined || key === undefined)
        return undefined;
    const names = [...parseUrlQueryParameterNames(record.query ?? "")];
    const named = bestLine(lines, lines.byQuery.get(key) ?? [], record);
    if (named !== undefined)
        return { ...named, named: true };
    const unfiltered = names.length === 0 ? bestLine(lines, lines.unfiltered, record) : undefined;
    if (unfiltered !== undefined)
        return { ...unfiltered, named: false };
    if (lines.query === undefined)
        return undefined;
    // As serving does, a read whose every query name has a role answers on a query or whole line, on its own values.
    const { roles } = lines.query;
    if (!names.every((name) => roles.has(name)))
        return undefined;
    const line = bestLine(lines, lines.query.lines, record);
    return line === undefined
        ? undefined
        : { ...line, named: false, queried: names.length > 0 };
};
/** How many of the read's query names a line recorded with the read's value, as replay counts them. */
const queryMatches = (read, query) => {
    const matched = new Set();
    for (const [name, value] of iterateUrlQueryParameters(query ?? "", read))
        if (read.get(name) === value)
            matched.add(name);
    return matched.size;
};
const bestLine = (lines, candidates, record) => {
    const read = segmentsOf(record.path);
    const values = new Map(iterateUrlQueryParameters(record.query ?? ""));
    let best;
    for (const { ordinal, segments, query } of candidates) {
        if (segments.length !== read.length)
            continue;
        let verbatim = 0;
        const matches = segments.every((segment, index) => {
            if (segment === read[index]) {
                if (lines.params.has(index))
                    verbatim += 1;
                return true;
            }
            return (lines.params.has(index) &&
                read[index] !== undefined &&
                pathSegmentMatches(segment, read[index]));
        });
        if (!matches)
            continue;
        const matched = queryMatches(values, query);
        if (best === undefined ||
            verbatim > best.verbatim ||
            (verbatim === best.verbatim && matched > best.query))
            best = {
                line: { ordinal, collection: `/${segments.join("/")}` },
                verbatim,
                query: matched,
            };
    }
    return best?.line;
};
