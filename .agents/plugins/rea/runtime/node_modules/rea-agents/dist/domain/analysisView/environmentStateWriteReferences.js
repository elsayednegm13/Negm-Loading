import { err, ok } from "../result.js";
import { isObject, same, scalarText, } from "./environmentStateRules.js";
/** A member name with its trailing id dropped and lower case, to tie `parentId` to `parent`. */
const stemOf = (name) => name
    .replace(/(?:Id|ID|_id|_ID|Ids|_ids)$/u, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "");
/** Whether every member of an object holds the value an entity holds there. */
const projects = (object, fields) => Object.entries(object).every(([key, value]) => Object.hasOwn(fields, key) && same(fields[key], value));
/**
 * A created or updated object field that repeats fields of the entity a sent member names, as the state holds it: a
 * parent beside `parentId`. Several members naming such entities resolve to the one named like the field; undefined
 * when none does, or when that leaves more than one. An id that names entities of one type in several collections
 * names none, since serving could not tell which.
 */
export const referenceRule = (field, value, body, named) => {
    if (!isObject(value) || Object.keys(value).length < 2)
        return undefined;
    const matches = new Map();
    for (const [member, sent] of Object.entries(body)) {
        const id = scalarText(sent);
        if (id === undefined || id.length === 0)
            continue;
        const held = named(id);
        for (const entity of held)
            if (projects(value, entity.fields) &&
                held.filter((other) => other.type === entity.type).length === 1)
                matches.set(`${member} ${entity.type}`, { member, type: entity.type });
    }
    const candidates = [...matches.values()];
    const chosen = candidates.length === 1
        ? candidates
        : candidates.filter(({ member }) => stemOf(member) === stemOf(field));
    return chosen.length === 1
        ? {
            field,
            rule: "reference",
            member: chosen[0].member,
            type: chosen[0].type,
            fields: Object.keys(value),
        }
        : undefined;
};
/** A reference's value for a call: the named entity's fields it lists, or undefined when the call does not send its member. */
export const referencedValue = (rule, body, referenced) => {
    if (!Object.hasOwn(body, rule.member))
        return ok(undefined);
    const id = scalarText(body[rule.member]);
    const held = id === undefined ? [] : (referenced?.(rule.type, id) ?? []);
    const [fields] = held;
    if (fields === undefined)
        return err(`Member ${rule.member} names no entity of ${rule.type} the environment holds, which ${rule.field} repeats.`);
    if (held.length > 1)
        return err(`Member ${rule.member} names entities of ${rule.type} in ${held.length} collections, so ${rule.field} cannot tell which it repeats.`);
    return ok(Object.fromEntries(rule.fields.flatMap((key) => Object.hasOwn(fields, key) ? [[key, fields[key]]] : [])));
};
