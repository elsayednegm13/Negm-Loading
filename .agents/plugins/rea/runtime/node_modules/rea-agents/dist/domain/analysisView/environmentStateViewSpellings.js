import { isObject, same } from "./environmentStateRules.js";
import { readClock } from "./environmentStateWriteValues.js";
import { ENTRY_BYTES, textBytes } from "./webNetworkRouteTemplates.js";
/** Whether two objects show the same keys, in any order. */
const sameKeys = (left, shown) => left.length === Object.keys(shown).length &&
    left.every((key) => Object.hasOwn(shown, key));
/** The spellings a view always gives clock fields where its recordings spell the stored instant otherwise. */
export class ClockSpellings {
    retain;
    /** Each category retains one spelling or a permanent mixed marker, never an expanding format history. */
    #fields = new Map();
    /** Per object field, the keys every recording showed in the first one's order, or null once two differ, and whether one showed fewer than stored. */
    #shapes = new Map();
    constructor(retain) {
        this.retain = retain;
        retain(ENTRY_BYTES);
    }
    #shape(field, shown, stored) {
        const keys = Object.keys(shown);
        const projects = isObject(stored) &&
            Object.keys(stored).some((key) => !Object.hasOwn(shown, key));
        const facts = this.#shapes.get(field);
        if (facts === undefined) {
            this.retain(ENTRY_BYTES * 2 +
                textBytes(field.length) +
                keys.reduce((sum, key) => sum + ENTRY_BYTES + textBytes(key.length), 0));
            this.#shapes.set(field, { keys, projects });
            return;
        }
        if (facts.keys !== null && !sameKeys(facts.keys, shown))
            facts.keys = null;
        facts.projects ||= projects;
    }
    #note(field, category, format) {
        let facts = this.#fields.get(field);
        if (facts === undefined) {
            this.retain(ENTRY_BYTES + textBytes(field.length));
            facts = { matched: undefined, other: undefined };
            this.#fields.set(field, facts);
        }
        const held = facts[category];
        if (held === undefined) {
            if (format !== null)
                this.retain(ENTRY_BYTES +
                    (format.kind === "iso" ? textBytes(format.zone.length) : 0));
            facts[category] = format;
        }
        else if (held !== null && !same(held, format))
            facts[category] = null;
    }
    note(stored, shown) {
        for (const [field, value] of Object.entries(shown)) {
            if (isObject(value))
                this.#shape(field, value, stored[field]);
            const now = readClock(value);
            if (now === undefined)
                continue;
            const was = Object.hasOwn(stored, field)
                ? readClock(stored[field])
                : undefined;
            if (was === undefined ||
                was.ms !== now.ms ||
                was.subMillisecond !== now.subMillisecond) {
                this.#note(field, "other", now.format);
                continue;
            }
            const spelled = same(stored[field], value) ? null : now.format;
            this.#note(field, "matched", spelled);
        }
    }
    /** The fields whose objects every recording showed with the same keys, fewer than one stored. */
    get #nested() {
        const nested = [...this.#shapes].flatMap(([field, { keys, projects }]) => keys !== null && projects ? [[field, keys]] : []);
        return nested.length === 0
            ? {}
            : { nested_fields: Object.fromEntries(nested) };
    }
    /** The view members: the spelling of fields it always spells otherwise, and the keys of objects it shows fewer of. */
    get view() {
        const formats = [];
        for (const [field, { matched, other }] of this.#fields) {
            if (matched === undefined ||
                matched === null ||
                other === null ||
                (other !== undefined && !same(other, matched)))
                continue;
            if (formats.length === 0)
                this.retain(ENTRY_BYTES * 2);
            // Both the temporary entry and its returned object member remain covered.
            this.retain(ENTRY_BYTES * 2 + textBytes(field.length));
            formats.push([field, matched]);
        }
        return {
            ...(formats.length === 0
                ? {}
                : { clock_formats: Object.fromEntries(formats) }),
            ...this.#nested,
        };
    }
}
