import { jsonTextCodeUnits } from "../jsonSerialization.js";
import { digestCanonicalValue } from "../canonicalDigest.js";
import { same } from "./environmentStateRules.js";
import { storedKinds } from "./environmentStateWriteApply.js";
import { composedValue } from "./environmentStateWriteComposed.js";
import { alikeRules, } from "./environmentStateWriteRules.js";
import { integerOf, slugOf } from "./environmentStateWriteValues.js";
/** Whether a rule changes its field on calls that do not send it: serving applies it to every call that could. */
export const unsentChange = (rule) => rule.rule === "increment" ||
    rule.rule === "slug" ||
    rule.rule === "composed" ||
    rule.rule === "stamp" ||
    rule.rule === "derived" ||
    rule.rule === "set";
/** Whether serving gives a rule's field a new value on every call, so no call may have kept it. */
export const regenerates = (rule) => rule.rule === "unique" ||
    rule.rule === "renewed" ||
    rule.rule === "nested-clock";
/** The fields a call showed as they were before it. */
export const keptFields = (before, after) => Object.keys(after).filter((field) => Object.hasOwn(before, field) && same(before[field], after[field]));
/** Whether a plan's rules give a recorded call another value than it showed, or one of them regenerates a field the call kept. */
export const disagreesWithCall = (rules, call) => rules.some((rule) => (unsentChange(rule) &&
    Object.hasOwn(call.after, rule.field) &&
    !same(call.written[rule.field], call.after[rule.field])) ||
    (regenerates(rule) && call.kept.includes(rule.field)));
/** The fields a call found already at the value a set rule gives them: the action sets them rather than toggling them. */
export const steadyFields = (rules, before, after) => rules.flatMap((rule) => rule.rule === "set" &&
    same(before[rule.field], rule.value) &&
    same(after[rule.field], rule.value)
    ? [rule.field]
    : []);
/** A call's scalar members by name, as much of it as later rules are checked against. */
const scalars = (object) => new Map(Object.entries(object).filter(([, value]) => value === null || typeof value !== "object"));
/** Keep structured equality facts without retaining another copy of each response body. */
const observedValue = (value) => value !== null && typeof value === "object"
    ? { kind: "structured", digest: digestCanonicalValue(value) }
    : { kind: "scalar", value };
/** The scalar fields a call showed, as a composed rule reads them. */
const shownScalars = (shown) => Object.fromEntries([...shown].flatMap(([field, observed]) => observed.kind === "scalar" ? [[field, observed.value]] : []));
const sameObserved = (left, right) => left.kind === "structured"
    ? right.kind === "structured" && left.digest === right.digest
    : right.kind === "scalar" && same(left.value, right.value);
/** Ambiguous saves may echo an already-derived slug or hold a clock in its own second. Keep the demonstrated derivation; call evidence still has to reproduce it. */
export const reconciledUpdateRule = (held, later, kept) => {
    const alike = alikeRules(held, later, kept);
    if (alike !== undefined)
        return alike;
    for (const [derived, ambiguous] of [
        [held, later],
        [later, held],
    ]) {
        if (derived.rule === "slug" &&
            ambiguous.rule === "echo" &&
            ambiguous.sorted !== true)
            return derived;
        if (derived.rule === "clock" &&
            ambiguous.rule === "held-clock" &&
            same(derived.format, ambiguous.format))
            return derived;
    }
    return undefined;
};
/** Whether a later rule reproduces earlier calls, including echoes promoted to derivations. */
export const contradictsEarlierCalls = (draft, rules) => {
    const ruled = new Map(draft.plan.rules.map((rule) => [rule.field, rule]));
    return rules.some((rule) => {
        if (!(unsentChange(rule) || regenerates(rule) || rule.rule === "clock") ||
            (ruled.has(rule.field) &&
                !(rule.rule === "slug" && ruled.get(rule.field)?.rule === "echo")))
            return false;
        // Compute a structured rule's digest once, rather than once per earlier call.
        const expected = rule.rule === "set" || rule.rule === "stamp" || rule.rule === "derived"
            ? observedValue(rule.value)
            : undefined;
        return draft.updates.some(({ shown, sent, kept }) => {
            if (regenerates(rule))
                return kept.includes(rule.field);
            // An unruled field an earlier call showed is one it left as it was.
            const observation = shown.get(rule.field);
            if (observation === undefined)
                return false;
            if (rule.rule === "increment")
                return (observation.kind === "structured" ||
                    integerOf(observation.value) !== undefined);
            if (rule.rule === "set")
                return !sameObserved(observation, expected);
            // Serving stamps a clock on every call, so a field an earlier call kept contradicts it.
            if (rule.rule === "clock")
                return true;
            if (rule.rule === "stamp")
                return !sameObserved(observation, expected);
            if (rule.rule === "derived")
                return sent.has(rule.member) && !sameObserved(observation, expected);
            if (rule.rule === "composed") {
                const value = composedValue(rule.parts, shownScalars(shown));
                return (value === undefined ||
                    !sameObserved(observation, observedValue(value)));
            }
            const from = rule.rule === "slug" ? sent.get(rule.from) : undefined;
            // A slug rule runs only when its source is sent; otherwise serving keeps the field.
            return (rule.rule === "slug" &&
                (typeof from === "string"
                    ? !sameObserved(observation, observedValue(slugOf(from)))
                    : !kept.includes(rule.field)));
        });
    });
};
/** A plan's body with the members and fixed values a later call's body adds, and the JSON types it stored those members as when the observation shows none. */
export const refinedBody = (body, later, values) => {
    const fixed = new Set(body.fixed.map((entry) => entry.member));
    const accepted = later.accepted.filter((member) => !body.accepted.includes(member));
    return {
        ...body,
        // A later call may be the first to show the body repeating the path's id.
        identity: body.identity ?? later.identity,
        accepted: [...body.accepted, ...accepted],
        fixed: [
            ...body.fixed,
            ...later.fixed.filter((entry) => !fixed.has(entry.member)),
        ],
        // Serving reads member types from the observation, which may not show a member a later call stored.
        kinds: [
            ...body.kinds,
            ...storedKinds(accepted, values.observed, values.stored),
        ],
    };
};
/** Whether a later call explains a member or field otherwise than the plan: echoed by one and stored as something else by the other, or ruled differently. */
export const conflictsWithPlan = (plan, explained, kept) => {
    const body = plan.body;
    const fixed = new Map(body.fixed.map((entry) => [entry.member, entry.sent]));
    const rules = new Map(plan.rules.map((rule) => [rule.field, rule]));
    const { identity } = explained.body;
    // Serving checks a call's identity member before its fixed values, so a member both cannot take every recorded call.
    return (explained.body.accepted.some((member) => fixed.has(member)) ||
        explained.body.fixed.some((entry) => body.accepted.includes(entry.member) ||
            entry.member === body.identity ||
            (fixed.has(entry.member) && !same(fixed.get(entry.member), entry.sent))) ||
        (identity !== null && fixed.has(identity)) ||
        explained.rules.some((rule) => {
            const held = rules.get(rule.field);
            return (held !== undefined &&
                reconciledUpdateRule(held, rule, kept) === undefined);
        }));
};
/** A modelled update's result: a later read that also shows an unmodelled change checks only the members it sent. */
export const appliedUpdate = (plan, at, before, call) => {
    const { written, body } = call;
    const sent = Object.keys(body).filter((member) => member !== plan.body?.identity);
    const derived = Object.keys(written).filter((field) => !Object.hasOwn(before, field) || !same(written[field], before[field]));
    const changed = {
        fields: [...new Set([...sent, ...derived])],
        accumulated: plan.rules.flatMap((rule) => rule.rule === "increment" ? [rule.field] : []),
    };
    return {
        kind: "applied",
        targets: at.targets,
        entity: at.target,
        fields: sent,
        changed,
    };
};
/** Keep what a modelled update call showed, which later calls' rules must reproduce, and the fields it found already set. */
export const rememberCall = (retain, draft, call, 
/** Clocks the call left as they were in its own second, which show neither a stamp nor a kept value. */
sameSecond) => {
    const unstamped = new Set(sameSecond);
    for (const field of unstamped)
        draft.unstamped.add(field);
    const kept = call.kept.filter((field) => !unstamped.has(field));
    const shown = new Map(Object.entries(call.after).map(([field, value]) => [
        field,
        observedValue(value),
    ]));
    for (const field of unstamped)
        shown.delete(field);
    const facts = { shown, sent: scalars(call.sent), kept };
    retain(64 + jsonTextCodeUnits([...facts.shown, ...facts.sent, kept]) * 2);
    draft.updates.push(facts);
    for (const field of steadyFields(draft.plan.rules, call.before, call.after))
        draft.steady.add(field);
};
