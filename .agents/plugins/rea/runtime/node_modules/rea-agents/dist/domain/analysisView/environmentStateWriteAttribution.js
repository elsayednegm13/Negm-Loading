import { renderStateEntity, same, } from "./environmentStateRules.js";
import { collectionTarget, entityTarget, } from "./environmentStateWriteChecks.js";
/** The fields a read of a view shows of its entities, less volatile ones it does not compare; all of a document's. */
export const shownFields = (view, volatileOf) => {
    if (view.shape !== "item" && view.shape !== "list")
        return "all";
    const volatile = volatileOf(view.type);
    return new Set(view.fields.filter((field) => !volatile.has(field)));
};
/** Whether a write that ended at `until` was still running when a read began at `start`, so the read may show either state. */
export const overlapsWrite = (until, start) => until > start;
/** The tools a failed read's difference an unmodelled write may explain: it came after the tool's call on a target where its effect survives, and after every differing target's last check and pending writes. */
export const interference = (history, read) => {
    const keys = [...read.targets, ...read.unheld];
    const after = (since) => history.unmodelledAt.some((index) => index > since);
    const explained = (read.differing ?? []).every((key) => after(Math.max(history.checked.get(key) ?? -1, ...(history.pending.get(key)?.at.values() ?? []))));
    return (tool) => explained &&
        keys.some((key) => {
            if (history.touched.get(key)?.has(tool) !== true)
                return false;
            const at = history.pending.get(key)?.at.get(tool);
            return at !== undefined && after(at);
        });
};
/** Whether a modelled write to the target was still running when a read began at `start`, so the read may show either state. */
export const runningAt = (pending, key, start) => overlapsWrite(pending.get(key)?.until ?? -Infinity, start);
/** The tools whose writes a read exercises: those that changed its targets since they were last checked, less those that borrowed the read to learn their effect. */
export const exercisedBy = (touched, keys, borrowers) => {
    const exercised = new Set();
    for (const key of keys)
        for (const name of touched.get(key)?.keys() ?? [])
            if (!borrowers?.has(name))
                exercised.add(name);
    return exercised;
};
/** Record a modelled write on a target: the fields it wrote (undefined: all), when it was made and when it ended. */
export const touchTarget = (touched, pending, target, write) => {
    const held = pending.get(target);
    pending.set(target, {
        until: Math.max(held?.until ?? -Infinity, write.end),
        at: (held?.at ?? new Map()).set(write.tool, write.index),
    });
    const tools = touched.get(target) ?? new Map();
    const before = tools.get(write.tool);
    tools.set(write.tool, write.fields === undefined || before === null
        ? null
        : [...new Set([...(before ?? []), ...write.fields])]);
    touched.set(target, tools);
};
/** Whether a write's fields cover a field: the same one, or, for a document's pointers, one above it. */
const covers = (write, field) => {
    const { fields } = write;
    if (fields === "all" || fields.has(field))
        return true;
    return (write.pointers && [...fields].some((over) => field.startsWith(`${over}/`)));
};
/** What an earlier effect keeps after a write: nothing once every field it holds is overwritten; an update leaves a create's or delete's whole effect. */
const remaining = (claim, write) => {
    if (write.whole)
        return undefined;
    if (claim === null)
        return null;
    if (write.fields === "all")
        return undefined;
    const left = claim.filter((field) => !covers(write, field));
    return left.length > 0 ? left : undefined;
};
/** Add a write's changed fields under a key: all of them once any write there changed the whole entity. */
const record = (map, key, whole, changed) => {
    const before = map.get(key);
    return map.set(key, whole || before === null
        ? null
        : [...new Set([...(before ?? []), ...changed])]);
};
/**
 * What each write changed since the targets it touched were last checked, less what later writes overwrote, so a
 * write whose effect is gone drops out: from the entity's target, and from its collection's once no entity it changed
 * there keeps any of it.
 */
export class WriteEffects {
    /** Per entity target, the fields each tool changed there. */
    #changed = new Map();
    /** Per collection target, the entities each tool's claim there rests on, with the fields it changed on each. */
    #members = new Map();
    /** Forget a checked target's writes, as the touched targets do: all, or all but those a read showed nothing of. */
    checked(key, unseen) {
        for (const byTool of [this.#changed, this.#members])
            if (unseen === undefined)
                byTool.delete(key);
            else
                for (const tool of byTool.get(key)?.keys() ?? [])
                    if (!unseen.has(tool))
                        byTool.get(key).delete(tool);
    }
    /** A read showed the entity absent: no write's effect on it remains, so a write left with no entity drops from the collection. */
    removed(touched, gone) {
        const entity = entityTarget(gone.type, gone.collection, gone.id);
        const collection = collectionTarget(gone.type, gone.collection);
        this.#changed.delete(entity);
        const byTool = this.#members.get(collection);
        if (byTool === undefined)
            return;
        for (const [tool, entities] of byTool) {
            if (!entities.delete(entity) || entities.size > 0)
                continue;
            byTool.delete(tool);
            touched.get(collection)?.delete(tool);
        }
    }
    /** The fields a tool's effect on an entity still holds: null for a create's or delete's whole effect, undefined when none remains. */
    changedOn(key, tool) {
        return this.#changed.get(key)?.get(tool);
    }
    /** Whether a read showing `fields` of a target shows anything of a tool's effect there: a create's or delete's always, an update's through a field it changed; unknown claims count as shown. */
    shows(tool, key, fields) {
        const visible = (claim) => fields === "all" ||
            claim === undefined ||
            claim === null ||
            claim.some((field) => fields.has(field));
        const own = this.#changed.get(key);
        if (own !== undefined)
            return visible(own.get(tool));
        const members = this.#members.get(key)?.get(tool);
        return members === undefined || [...members.values()].some(visible);
    }
    /** A write's effect replaces what earlier writes left of theirs, then joins them. */
    supersede(touched, writer, effect) {
        const [entity, collection] = effect.targets;
        const changed = effect.changed?.fields ?? effect.fields ?? [];
        const whole = effect.fields === undefined;
        this.#overwrite(touched, { entity, collection, writer }, {
            whole,
            fields: new Set((effect.overwrites ?? changed).filter((field) => !effect.changed?.accumulated.includes(field))),
            pointers: effect.pointers === true,
        });
        this.#changed.set(entity, record(this.#changed.get(entity) ?? new Map(), writer, whole, changed));
        if (collection === undefined)
            return;
        const byTool = this.#members.get(collection) ?? new Map();
        byTool.set(writer, record(byTool.get(writer) ?? new Map(), entity, whole, changed));
        this.#members.set(collection, byTool);
    }
    /** A recorded outcome is the entity's new baseline: what earlier writes changed on it is gone, its membership is not. */
    observed(touched, targets) {
        const [entity, collection] = targets;
        this.#overwrite(touched, { entity, collection, writer: undefined }, { whole: false, fields: "all", pointers: false });
    }
    #overwrite(touched, at, write) {
        const own = this.#changed.get(at.entity);
        for (const [tool, claim] of own ?? []) {
            const left = tool === at.writer ? claim : remaining(claim, write);
            if (left !== undefined) {
                own.set(tool, left);
                if (tool !== at.writer) {
                    const tools = touched.get(at.entity);
                    const sent = tools?.get(tool);
                    // touched keeps sent members. A members check compares those; a surviving derived field stays on the effect.
                    if (tools !== undefined && sent !== undefined)
                        tools.set(tool, sent !== null && left !== null
                            ? sent.filter((field) => left.includes(field))
                            : left);
                }
            }
            else {
                own.delete(tool);
                touched.get(at.entity)?.delete(tool);
            }
        }
        if (at.collection === undefined)
            return;
        const byTool = this.#members.get(at.collection);
        for (const [tool, entities] of byTool ?? []) {
            const claim = entities.get(at.entity);
            if (tool === at.writer || claim === undefined)
                continue;
            const left = remaining(claim, write);
            if (left !== undefined)
                entities.set(at.entity, left);
            else
                entities.delete(at.entity);
            if (entities.size > 0)
                continue;
            byTool.delete(tool);
            touched.get(at.collection)?.delete(tool);
        }
    }
}
/** Of the tools a read exercised, those it shows something of on some target, and per target those it shows nothing of. */
export const shownWrites = (touched, effects, read) => {
    const confirmed = [];
    const unseen = new Map();
    for (const name of read.exercised) {
        const on = read.keys.filter((key) => touched.get(key)?.has(name));
        const seen = on.filter((key) => effects.shows(name, key, read.fields));
        for (const key of on)
            if (!seen.includes(key))
                unseen.set(key, (unseen.get(key) ?? new Set()).add(name));
        if (seen.length > 0)
            confirmed.push(name);
    }
    return { confirmed, unseen };
};
/** A checked target forgets its writes, but for those a passing read showed nothing of, which a later check still takes. */
export const forgetChecked = (pending, key, unseen) => {
    const writes = pending.touched.get(key);
    if (unseen === undefined || writes === undefined) {
        pending.touched.delete(key);
        pending.effects.checked(key);
        pending.since.delete(key);
        return;
    }
    const at = pending.since.get(key)?.at;
    for (const name of writes.keys())
        if (!unseen.has(name)) {
            writes.delete(name);
            at?.delete(name);
        }
    pending.effects.checked(key, unseen);
};
/**
 * Check, field by field, the writes that changed an entity an unmodelled write also changed:
 * each write's own fields must show as the state holds them, but for volatile ones, which take
 * the read's value and so show nothing of a write. A create wrote every field, so it cannot be
 * told apart from the unmodelled change and is not checked.
 */
export const writtenFieldChecks = (entity, view, observed, check) => {
    const shown = renderStateEntity(entity, view, check.volatile, observed);
    const outcomes = new Map();
    for (const [tool, fields] of check.writes) {
        const compared = (fields ?? []).filter((field) => !check.volatile.has(field) &&
            (Object.hasOwn(observed, field) || Object.hasOwn(shown, field)));
        if (fields === null || compared.length === 0)
            continue;
        outcomes.set(tool, compared.every((field) => same(shown[field], observed[field])));
    }
    return outcomes;
};
