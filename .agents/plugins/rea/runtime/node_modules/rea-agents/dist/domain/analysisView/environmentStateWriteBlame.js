import { at, isObject, locateItem, missingRequiredFields, renderStateEntity, same, scalarText, } from "./environmentStateRules.js";
import { writtenFieldChecks, } from "./environmentStateWriteAttribution.js";
import { entityTarget, itemTarget, } from "./environmentStateWriteChecks.js";
import { ENTRY_BYTES } from "./webNetworkRouteTemplates.js";
/** Shorter strings are too common for a matching member to tie an embedded object to an entity. */
const EMBED_MATCH_MIN_LENGTH = 3;
/** A shorter id, as a small integer, names many entities, so the matching member must be this long. */
const EMBED_SHORT_ID_MATCH_LENGTH = 8;
/**
 * Attributes a failed read that no unmodelled write explains: to the writes it exercised, field by
 * field when a whole-entity writer takes it, to a create whose entity it embeds elsewhere, and, when
 * it exercised none, to the create of an entity a refused write's recorded outcome left lacking a
 * required field.
 */
export class FailedReadBlame {
    #facts;
    #created = [];
    /** When a refused write's recorded outcome last replaced each entity's values. */
    #rebased = new Map();
    constructor(facts) {
        this.#facts = facts;
    }
    /** Note an entity a create inserted. */
    inserted(entity, tool) {
        this.#facts.io.retain(ENTRY_BYTES);
        this.#created.push({ ...entity, tool });
    }
    /** Note a refused write's recorded outcome replacing an entity's values. */
    rebased(target, index) {
        if (!this.#rebased.has(target))
            this.#facts.io.retain(ENTRY_BYTES);
        this.#rebased.set(target, index);
    }
    of(failed) {
        const item = this.#item(failed.view, failed.record);
        const contradicted = new Set(this.#embedding(item, failed.exercised));
        if (failed.exercised.size > 0) {
            const blame = this.#fields(item, failed.exercised);
            for (const name of blame?.contradicted ?? failed.exercised)
                contradicted.add(name);
            return { contradicted, confirmed: blame?.confirmed ?? [] };
        }
        const rebased = item === undefined ? -1 : (this.#rebased.get(item.target) ?? -1);
        const create = rebased > failed.since
            ? this.#facts.inserted.get(item.target)
            : undefined;
        // A recorded outcome merges what its answer showed, so a required field it left out is still the create's.
        if (create !== undefined && this.#lacksFields(item))
            contradicted.add(create);
        return { contradicted, confirmed: [] };
    }
    #item(view, record) {
        if (view.shape !== "item")
            return undefined;
        const { state, io } = this.#facts;
        const { collection, id } = itemTarget(state, view.type, record);
        const object = io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
        return {
            view,
            target: entityTarget(view.type, collection, id),
            entity: state.entity(view.type, collection, id),
            object: isObject(object) ? object : undefined,
        };
    }
    /** Field-attributed blame: whole-entity writers take the difference, each update is checked on the fields its effect holds. */
    #fields(item, exercised) {
        if (item?.entity === undefined || item.object === undefined)
            return undefined;
        const { touched, pending, effects, records } = this.#facts;
        const partial = new Map();
        const responses = new Map();
        for (const name of exercised) {
            const sent = touched.get(item.target)?.get(name);
            if (sent === undefined || sent === null)
                continue;
            const changed = effects.changedOn(item.target, name);
            partial.set(name, Array.isArray(changed) ? changed : sent);
            const call = pending.get(item.target)?.at.get(name);
            const response = call === undefined
                ? undefined
                : this.#responseObject(records[call], item.entity.id);
            if (response !== undefined)
                responses.set(name, response);
        }
        return fieldBlame({
            entity: item.entity,
            view: item.view,
            object: item.object,
            volatile: this.#facts.volatileOf(item.view.type),
        }, { exercised, partial, responses });
    }
    /** The entity a write's response shows, located by its id. */
    #responseObject(record, id) {
        return this.#facts.io.withBody(record.ordinal, (body) => {
            const located = body === undefined ? undefined : locateItem(body, id);
            const object = located === undefined ? undefined : at(body, located.pointer);
            return isObject(object) ? object : undefined;
        });
    }
    /** The creates, other than those the read exercised, whose entity a failed item read newly embeds in another field. */
    #embedding(item, exercised) {
        if (item?.object === undefined)
            return [];
        const { state, idField } = this.#facts;
        return embeddingCreates({ object: item.object, entity: item.entity, type: item.view.type }, this.#created.filter((created) => !exercised.has(created.tool)), (created) => {
            const held = state.entity(created.type, created.collection, created.id);
            const field = idField(created.type);
            return held === undefined || field === undefined
                ? undefined
                : { fields: held.fields, idField: field };
        });
    }
    /** Whether the state's entity lacks a field every read of its view shows. */
    #lacksFields(item) {
        return (item.entity !== undefined &&
            missingRequiredFields(item.entity, item.view, this.#facts.volatileOf(item.view.type)).length > 0);
    }
}
/**
 * How a failed item read with no interfering write attributes its difference: the writes that own
 * the whole entity take it, and each update is checked on the fields its effect still holds, so an
 * update whose own fields show as the state holds them, and whose response shows the entity as the
 * read does, is confirmed. Undefined when no whole-entity writer was exercised, since the
 * difference would then be no write's.
 */
const fieldBlame = (read, writes) => {
    const whole = [...writes.exercised].filter((name) => !writes.partial.has(name));
    if (writes.partial.size === 0 || whole.length === 0)
        return undefined;
    // A field the state holds and no exercised update wrote may differ by any exercised write's effect.
    const written = new Set([...writes.partial.values()].flat());
    const shown = renderStateEntity(read.entity, read.view, read.volatile);
    if (Object.keys(read.object).some((field) => Object.hasOwn(shown, field) &&
        !read.volatile.has(field) &&
        !written.has(field) &&
        !same(shown[field], read.object[field])))
        return undefined;
    const outcomes = writtenFieldChecks(read.entity, read.view, read.object, {
        volatile: read.volatile,
        writes: writes.partial,
    });
    // Serving answers an update from the state, so a response showing an unwritten field otherwise than the read would be answered wrongly.
    const answered = (name) => {
        const response = writes.responses.get(name);
        const others = new Set([...writes.partial]
            .filter(([other]) => other !== name)
            .flatMap(([, fields]) => fields));
        return (response === undefined ||
            Object.keys(response).every((field) => !Object.hasOwn(read.object, field) ||
                read.volatile.has(field) ||
                others.has(field) ||
                same(response[field], read.object[field])));
    };
    const lacking = lackingFields(read, shown, writes);
    const confirmed = [...writes.partial.keys()].filter((name) => outcomes.get(name) === true &&
        answered(name) &&
        !lacking.unruled.has(name));
    // When updates' changes the state lacks are the read's whole difference, the entity's own writer is not blamed for them.
    const owned = lacking.fields > 0 &&
        !lacking.unowned &&
        [...writes.partial.keys()].every((name) => confirmed.includes(name) || lacking.unruled.has(name));
    return {
        contradicted: [...writes.exercised].filter((name) => !confirmed.includes(name) &&
            !lacking.unruled.has(name) &&
            !(owned && !writes.partial.has(name))),
        confirmed,
    };
};
/**
 * Fields a failed read shows that the state's entity lacks: one an exercised update's response
 * shows with the same value, not null, is that update's change, and an update whose effect does not
 * hold it changed something no rule models, so the read confirms it no more than it contradicts it.
 */
const lackingFields = (read, shown, writes) => {
    const fields = Object.keys(read.object).filter((field) => !Object.hasOwn(shown, field) && !read.volatile.has(field));
    const unruled = new Set();
    let unowned = false;
    for (const field of fields) {
        const value = read.object[field] ?? null;
        const owners = [...writes.partial.keys()].filter((name) => {
            const response = writes.responses.get(name);
            return (value !== null && response !== undefined && same(response[field], value));
        });
        if (owners.length === 0)
            unowned = true;
        for (const name of owners)
            if (!writes.partial.get(name).includes(field))
                unruled.add(name);
    }
    return { fields: fields.length, unowned, unruled };
};
/** Whether an object names the entity by its id and by one more of its strings, a long one when the id is short. */
const names = (item, entity, idField, id) => {
    const length = id.length < EMBED_SHORT_ID_MATCH_LENGTH
        ? EMBED_SHORT_ID_MATCH_LENGTH
        : EMBED_MATCH_MIN_LENGTH;
    return (scalarText(item[idField]) === id &&
        Object.entries(item).some(([key, member]) => key !== idField &&
            typeof member === "string" &&
            member.length >= length &&
            entity[key] === member));
};
/** Visit every object a value holds at any depth, itself included. */
const eachObject = (value, visit) => {
    const pending = value === undefined ? [] : [value];
    for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
        if (isObject(item))
            visit(item);
        const children = Array.isArray(item)
            ? item
            : isObject(item)
                ? Object.values(item)
                : [];
        for (const child of children)
            pending.push(child);
    }
};
/** Whether a value is or holds an object naming the entity by its id and by one more of its strings. */
const embeds = (value, entity, idField) => {
    const id = scalarText(entity[idField]);
    let found = false;
    if (id !== undefined)
        eachObject(value, (item) => {
            found ||= names(item, entity, idField, id);
        });
    return found;
};
/**
 * The creates whose entity a failed item read newly embeds: a field the read shows otherwise than the
 * state holds it, with an object naming the created entity the state's value lacks, is a change the
 * create made to another collection (a reverse embed) that serving would not show. The created
 * entities are found by id, so the read is walked once however many creates there were.
 */
const embeddingCreates = (read, created, heldOf) => {
    const byId = new Map();
    const idFields = new Set();
    for (const entity of created) {
        if (entity.type === read.type && entity.id === read.entity?.id)
            continue;
        const held = heldOf(entity);
        const id = held === undefined ? undefined : scalarText(held.fields[held.idField]);
        if (held === undefined || id === undefined)
            continue;
        idFields.add(held.idField);
        const key = `${held.idField}\u0000${id}`;
        byId.set(key, [
            ...(byId.get(key) ?? []),
            { tool: entity.tool, fields: held.fields, id },
        ]);
    }
    const tools = new Set();
    if (byId.size === 0)
        return [];
    for (const [field, value] of Object.entries(read.object)) {
        const before = read.entity?.fields[field];
        if (same(before, value))
            continue;
        eachObject(value, (item) => {
            for (const idField of idFields) {
                const id = scalarText(item[idField]);
                for (const entity of id === undefined
                    ? []
                    : (byId.get(`${idField}\u0000${id}`) ?? []))
                    if (!tools.has(entity.tool) &&
                        names(item, entity.fields, idField, entity.id) &&
                        !embeds(before, entity.fields, idField))
                        tools.add(entity.tool);
            }
        });
    }
    return [...tools];
};
