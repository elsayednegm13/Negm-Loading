import { identifierWords } from "./environmentStateWords.js";
import { compareUnicodeCodePoints as compare } from "../unicodeCodePointOrder.js";
import { at, collectionPathOf, isObject, lastSegmentValue, listItems, renderStateEntity, renderStateList, same, scalarText, } from "./environmentStateRules.js";
import { counterPath } from "./environmentStateCounters.js";
import { evaluateQuery, learnQuery, lineChoices, queryTotalCount, renderQueryList, } from "./environmentStateListQuery.js";
import { singleQueryValues } from "../recordedTransportUrl.js";
import { ClockSpellings } from "./environmentStateViewSpellings.js";
import { declaredMembers, mintedEnvelope, mintedFor, } from "./environmentStateResponseMembers.js";
import { itemTotals, listFacts } from "./environmentStateListFacts.js";
import { ENTRY_BYTES, textBytes } from "./webNetworkRouteTemplates.js";
/** A view's replayed reads and their keys, when it has any. */
const replayedReads = (plan) => plan.projected === undefined || plan.projected.length === 0
    ? {}
    : {
        projected_record_ordinals: [...plan.projected],
        ...(plan.projectedKeys === undefined || plan.projectedKeys.length === 0
            ? {}
            : { projected_query_keys: [...plan.projectedKeys] }),
    };
/** Ordered key union and always-present keys, grown one object at a time. */
class FieldUnion {
    fields = [];
    /** Membership beside the ordered list, so a wide object is not scanned per key. */
    #seen = new Set();
    #required;
    add(object) {
        for (const key of Object.keys(object))
            if (!this.#seen.has(key)) {
                this.#seen.add(key);
                this.fields.push(key);
            }
        const keys = new Set(Object.keys(object));
        this.#required =
            this.#required === undefined
                ? keys
                : new Set([...this.#required].filter((key) => keys.has(key)));
    }
    get required() {
        return this.fields.filter((key) => this.#required?.has(key) === true);
    }
    /** Retained bytes of the field lists a plan keeps. */
    get bytes() {
        return this.fields.reduce((sum, name) => sum + ENTRY_BYTES * 2 + textBytes(name.length) * 2, ENTRY_BYTES * 2);
    }
}
const recorded = (plan, reason) => ({
    tool: plan.tool.name,
    shape: "recorded",
    reason,
});
/** Why one latest item recording does not render from the shared envelope and the entity's state, if it does not. */
const itemMismatch = (context, plan, check, record) => {
    const { view, envelope } = check;
    const entity = context.entity(plan.type, collectionPathOf(record, true), lastSegmentValue(record.path));
    return context.withBody(record.ordinal, (body) => {
        const object = body === undefined ? undefined : at(body, plan.pointer);
        if (entity === undefined || body === undefined || !isObject(object))
            return "fields-differ";
        const { skeleton, members } = mintedEnvelope(body, plan.pointer, check.minted);
        if (envelope.skeleton === undefined) {
            context.retain(textBytes(skeleton.length));
            envelope.skeleton = skeleton;
            envelope.members = members;
        }
        if (skeleton !== envelope.skeleton)
            return "envelope-varies";
        check.spellings.note(entity.fields, object);
        const shown = renderStateEntity(entity, view, context.volatileOf(plan.type), object);
        return same(shown, object) ? undefined : "fields-differ";
    });
};
/** An item plan must reproduce each latest recording from the first one's envelope and the entity's state. */
export const checkItemPlan = (context, plan) => {
    const union = new FieldUnion();
    for (const record of plan.latest)
        context.withBody(record.ordinal, (body) => {
            const object = body === undefined ? undefined : at(body, plan.pointer);
            if (isObject(object))
                union.add(object);
        });
    context.retain(union.bytes);
    const view = { tool: plan.tool.name, fields: union.fields };
    const envelope = {};
    const spellings = new ClockSpellings(context.retain);
    const minted = mintedFor(context.minted, plan.latest);
    for (const record of plan.latest) {
        const reason = itemMismatch(context, plan, { view, envelope, spellings, minted }, record);
        if (reason !== undefined)
            return recorded(plan, reason);
    }
    return {
        tool: plan.tool.name,
        shape: "item",
        type: plan.type,
        pointer: plan.pointer,
        fields: union.fields,
        required_fields: union.required,
        envelope_ordinal: plan.latest[0].ordinal,
        ...declaredMembers(envelope.members, context.retain),
        checked_record_ordinals: plan.latest.map((record) => record.ordinal),
        ...replayedReads(plan),
        ...spellings.view,
    };
};
/** The query that lines which are not whole follow, with the item totals that count its matches before paging. */
const listQuery = (context, plan, whole) => {
    const field = context.idField(plan.type);
    const lines = [];
    const counts = new Map();
    for (const record of plan.latest) {
        const values = whole.has(record.ordinal)
            ? undefined
            : singleQueryValues(record.query);
        if (values === undefined || values.size === 0)
            continue;
        context.withBody(record.ordinal, (body) => {
            const items = body === undefined ? undefined : listItems(body, plan.pointer);
            if (body === undefined || items === undefined)
                return;
            const choices = lineChoices(values, items);
            context.retain(ENTRY_BYTES * (items.length + choices.length * 4 + 2));
            lines.push({
                ordinal: record.ordinal,
                values,
                choices,
                listed: items.map((item) => scalarText(item[field]) ?? ""),
                entities: context.inCollection(plan.type, collectionPathOf(record, false)),
            });
            const parent = plan.pointer === "" || !isObject(body) ? {} : body;
            counts.set(record.ordinal, itemTotals(parent, plan.pointer).flatMap(([name, value]) => {
                const count = queryTotalCount(value);
                return count === undefined ? [] : [[name, count]];
            }));
        });
    }
    const learned = learnQuery(lines);
    if (learned === undefined)
        return undefined;
    // Totals count every match on each line the query answers; a `number`-of-items member counts the page.
    const totals = new Set();
    const contradicted = new Set();
    const answered = new Set(learned.record_ordinals);
    for (const line of lines) {
        if (!answered.has(line.ordinal))
            continue;
        const { total } = evaluateQuery(learned.parameters, line.values, line.entities);
        // Absence says nothing about another envelope's counter. Only a present
        // count that disagrees invalidates the shared total interpretation.
        for (const [name, count] of counts.get(line.ordinal) ?? []) {
            if (identifierWords(counterPath(name).at(-1)).includes("number"))
                continue;
            if (count === total)
                totals.add(name);
            else
                contradicted.add(name);
        }
    }
    return {
        ...learned,
        totals: [...totals].filter((name) => !contradicted.has(name)).sort(compare),
    };
};
/** Whether one latest list recording renders from its own envelope and the state: the whole collection, the query's matches, or the listed entities. */
const listReproduces = (context, plan, check, record) => {
    const { view, spellings } = check;
    const field = context.idField(plan.type);
    const collection = collectionPathOf(record, false);
    return context.withBody(record.ordinal, (body) => {
        const items = body === undefined ? undefined : listItems(body, plan.pointer);
        if (body === undefined || items === undefined)
            return false;
        const observed = new Map(items.map((item) => [scalarText(item[field]) ?? "", item]));
        const computed = view.query?.record_ordinals.includes(record.ordinal)
            ? evaluateQuery(view.query.parameters, singleQueryValues(record.query) ?? new Map(), context.inCollection(plan.type, collection))
            : undefined;
        const members = view.whole.has(record.ordinal)
            ? context.inCollection(plan.type, collection)
            : (computed?.page ??
                items.flatMap((item) => {
                    const entity = context.entity(plan.type, collection, scalarText(item[field]) ?? "");
                    return entity === undefined ? [] : [entity];
                }));
        const rendered = members.map((entity) => {
            const item = observed.get(entity.id);
            if (item !== undefined)
                spellings?.note(entity.fields, item);
            return renderStateEntity(entity, view, context.volatileOf(plan.type), item);
        });
        const answer = view.query === undefined ||
            (computed === undefined && !view.whole.has(record.ordinal))
            ? renderStateList(view, body, rendered)
            : renderQueryList({ ...view, query: view.query }, body, rendered, computed?.total ?? rendered.length);
        return same(answer, body);
    });
};
/** A list plan must reproduce each latest recording from its own envelope and the listed entities' state. */
export const checkListPlan = (context, plan) => {
    const union = new FieldUnion();
    const { whole, counters, minted } = listFacts(context, plan, union);
    context.retain(union.bytes);
    const base = {
        tool: plan.tool.name,
        fields: union.fields,
        pointer: plan.pointer,
        counters,
        whole,
    };
    let query = listQuery(context, plan, whole);
    // A line the query explains but whose envelope or fields the state does not reproduce keeps its recorded members.
    if (query !== undefined) {
        const failing = plan.latest.filter((record) => query.record_ordinals.includes(record.ordinal) &&
            !listReproduces(context, plan, { view: { ...base, query } }, record));
        const kept = query.record_ordinals.filter((ordinal) => !failing.some((record) => record.ordinal === ordinal));
        query = kept.length === 0 ? undefined : { ...query, record_ordinals: kept };
    }
    const view = { ...base, query };
    const all = plan.latest.every((record) => whole.has(record.ordinal));
    const spellings = new ClockSpellings(context.retain);
    if (!plan.latest.every((record) => listReproduces(context, plan, { view, spellings }, record)))
        return recorded(plan, "list-differs");
    return {
        tool: plan.tool.name,
        shape: "list",
        type: plan.type,
        pointer: plan.pointer,
        fields: union.fields,
        required_fields: union.required,
        membership: all ? "all" : "recorded",
        ...(all || whole.size === 0
            ? {}
            : {
                all_record_ordinals: plan.latest
                    .map((record) => record.ordinal)
                    .filter((ordinal) => whole.has(ordinal)),
            }),
        counters,
        ...(query === undefined ? {} : { query }),
        ...declaredMembers(minted, context.retain),
        checked_record_ordinals: plan.latest.map((record) => record.ordinal),
        ...replayedReads(plan),
        ...spellings.view,
    };
};
