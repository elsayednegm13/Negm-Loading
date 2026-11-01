import { isObject, same, } from "./environmentStateRules.js";
import { integerOf, readClock, slugOf, sortedStrings, } from "./environmentStateWriteValues.js";
import { freshUuid, renewedRule } from "./environmentStateWriteGenerated.js";
import { composedChange } from "./environmentStateWriteComposed.js";
import { referenceRule } from "./environmentStateWriteReferences.js";
import { derivedRule, freshToken, isClockNear, nestedClockRule, stampRule, } from "./environmentStateWriteStamps.js";
/** The rule a field the update changed without sending follows, if any; `slugs` maps each echoed member's slug to the first such member. */
export const changeRule = (evidence, field, slugs) => {
    const before = evidence.before[field];
    const after = evidence.after[field];
    if (readClock(after) !== undefined && isClockNear(after, evidence.startMs))
        return { field, rule: "clock", format: readClock(after).format };
    if (freshUuid(evidence, field))
        return { field, rule: "unique" };
    // A renamed slug is spelled like a token, so the slug comes first.
    const member = typeof after === "string" ? slugs.get(after) : undefined;
    if (member !== undefined)
        return { field, rule: "slug", from: member };
    if (freshToken(evidence, field))
        return { field, rule: "unique" };
    const nested = nestedClockRule(field, { before, after }, evidence);
    if (nested !== undefined)
        return nested;
    const reference = evidence.named === undefined
        ? undefined
        : referenceRule(field, after, evidence.call.body, evidence.named);
    if (reference !== undefined)
        return reference;
    // Child rows only: a single UUID that changed is a reference or a generated value, judged above.
    const renewed = Array.isArray(before) || isObject(before)
        ? renewedRule(field, { before, after }, evidence.others)
        : undefined;
    if (renewed !== undefined)
        return renewed;
    const was = integerOf(before);
    if (was !== undefined && integerOf(after) === was + 1)
        return { field, rule: "increment" };
    return (stampRule(evidence, field) ??
        derivedRule(evidence, field) ??
        composedChange(field, {
            ...evidence,
            sent: evidence.call.body,
        }) ??
        actionRule(evidence, field));
};
/** An item action sets a scalar it names; a changed object, list or instant is another write's doing or a regenerated value. */
const actionRule = (evidence, field) => {
    const after = evidence.after[field];
    return evidence.action === true &&
        (after === null || typeof after !== "object") &&
        readClock(after) === undefined
        ? { field, rule: "set", value: after }
        : undefined;
};
/** Whether a clock stored in whole seconds names the second a call started in, where a fresh stamp would read the same. */
const inCallSecond = (value, startMs) => {
    const clock = readClock(value);
    return (clock !== undefined &&
        startMs !== undefined &&
        clock.ms % 1000 === 0 &&
        clock.subMillisecond === 0 &&
        Math.abs(clock.ms - startMs) < 1000);
};
/** A sent clock the call left as it was, stored in whole seconds and naming the second the call ran in: the application stamps it anew, and the client sent back the one it read. */
export const heldClock = (evidence, member, sent) => inCallSecond(sent, evidence.startMs) &&
    same(evidence.before[member], sent) &&
    same(evidence.after[member], sent);
/** A field naming when its entity was made (`createdAt`, `row_created_timestamp`), which no update stamps. */
const CREATION_CLOCK = /creat(?:ed|ion)/iu;
/** Unsent clocks an update left as they were in the second it ran, other than creation clocks: a fresh stamp would read the same, so the call cannot show whether it stamps them. */
export const sameSecondClocks = (evidence) => Object.keys(evidence.after).filter((field) => !CREATION_CLOCK.test(field) &&
    !Object.hasOwn(evidence.call.body, field) &&
    Object.hasOwn(evidence.before, field) &&
    same(evidence.before[field], evidence.after[field]) &&
    inCallSecond(evidence.after[field], evidence.startMs));
/** Another sent member stored as sent whose slug the application stored in place of what this member sent. */
const sentSlugSource = (evidence, member) => {
    const stored = evidence.after[member];
    if (typeof stored !== "string")
        return undefined;
    return Object.entries(evidence.call.body).find(([other, value]) => other !== member &&
        typeof value === "string" &&
        same(evidence.after[other], value) &&
        slugOf(value) === stored)?.[0];
};
/** Whether a call sent back the clock the entity held, as a whole-object write does, and the application stamped it anew near the call. */
const restampedClock = (evidence, member, sent) => !CREATION_CLOCK.test(member) &&
    readClock(sent) !== undefined &&
    same(evidence.before[member], sent) &&
    readClock(evidence.after[member]) !== undefined &&
    isClockNear(evidence.after[member], evidence.startMs);
/** How an update stored a sent member: stamped anew as the one held clock it sent back other than a creation clock, echoed, stamped anew or slugged from another member in place of what it sent, renewed as a fresh UUID, or as a constant. */
export const sentRule = (evidence, member, held) => {
    const sent = evidence.call.body[member];
    if (held.length === 1 && held[0] === member && !CREATION_CLOCK.test(member))
        return {
            field: member,
            rule: "held-clock",
            format: readClock(sent).format,
        };
    if (same(evidence.after[member], sent))
        return { field: member, rule: "echo" };
    if (same(evidence.after[member], sortedStrings(sent)))
        return { field: member, rule: "echo", sorted: true };
    if (restampedClock(evidence, member, sent))
        return {
            field: member,
            rule: "clock",
            format: readClock(evidence.after[member]).format,
        };
    const from = sentSlugSource(evidence, member);
    if (from !== undefined)
        return { field: member, rule: "slug", from };
    return freshUuid(evidence, member)
        ? { field: member, rule: "unique" }
        : { field: member, rule: "constant", value: evidence.after[member] };
};
