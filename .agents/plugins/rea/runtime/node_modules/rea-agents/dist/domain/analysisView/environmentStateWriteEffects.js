import { jsonTextCodeUnits } from "../jsonSerialization.js";
import { isObject, locateItem, at, requestJson, } from "./environmentStateRules.js";
import { updatedEntity, updatedFields, recordedGeneratedValue, } from "./environmentStateWriteApply.js";
import { collectionTarget, entityTarget, itemTarget, } from "./environmentStateWriteChecks.js";
import { explainUpdate, responseShapeOf, } from "./environmentStateWriteExplain.js";
import { otherFields } from "./environmentStateWriteGenerated.js";
import { contradictsEarlierCalls, disagreesWithCall, keptFields, rememberCall, appliedUpdate, conflictsWithPlan, refinedBody, reconciledUpdateRule, } from "./environmentStateWriteCalls.js";
import { laterObservation, shownBefore, viewFields, } from "./environmentStateWriteObserve.js";
import { plannedBody, restampedFields } from "./environmentStateWriteStamps.js";
import { readClock } from "./environmentStateWriteValues.js";
import { fittedClockFormat, matchesClockFormat, noteFixedWidths, } from "./environmentStateWriteClockFormats.js";
import { actionItemPath, observationNeeds, } from "./environmentStateWriteAddress.js";
import { keptOrders, pathValuesOf, siblingTrimmedClocks, } from "./environmentStateWriteRules.js";
/** The value a draft fits a clock field against: one showing it at a fixed width, else the exemplar's. */
export const clockEvidence = (draft, field) => draft.fixedWidth.get(field) ?? draft.observed?.[field];
export const UNKNOWN = { kind: "unknown" };
export const built = (draft) => draft.plan.exemplar_ordinal !== null;
/** Give an unbuilt plan its reason; a built plan keeps its model. */
export const fail = (draft, step, reason) => {
    if (!built(draft) && !step.observeOnly)
        draft.plan.reason = reason;
};
/** A recorded call the built model does not explain disqualifies the plan. */
export const refuse = (draft, step, reason) => {
    if (!step.observeOnly)
        draft.plan.reason = reason;
};
/** Shared request interpretation: the object's own fields take precedence over a one-element envelope. */
export const requestBodyPlan = (context, step, draft, observed) => step.pinned
    ? plannedBody(requestJson(context.io.requestBody(step.record.ordinal)), { built: built(draft), envelope: draft.plan.body?.envelope }, (member) => observed !== undefined && Object.hasOwn(observed, member))
    : undefined;
export const callOf = (step, body) => ({
    path: step.record.path,
    pathValues: pathValuesOf(step.tool.path_template, step.record.path) ?? new Map(),
    body,
});
/** The fields of each entity of a type with an id, as the replayed state holds them. */
export const referencedIn = (context) => (type, id) => context.state
    .ofType(type)
    .flatMap((entity) => (entity.id === id ? [entity.fields] : []));
export const startOf = (context, step) => (context.timed ? step.record.start : undefined);
export const searchFrom = (context, step) => ({
    records: context.records,
    from: step.index,
    ...(context.timed ? { after: step.record.end } : {}),
    viewOf: context.viewOf,
    withBody: context.io.withBody,
    queryOf: context.io.queryOf,
});
/** The later item reads of the entity a write resolved, as a forward search finds them. */
export const itemReads = (context, entity) => ({
    ...entity,
    held: () => true,
    isWrite: context.isWrite,
    sameItem: (record) => {
        const found = itemTarget(context.state, entity.type, record);
        return found.collection === entity.collection && found.id === entity.id;
    },
});
/** The entity an update's response shows, located by its identity, else a later item read of the target the write resolved. */
const updatedObservation = (context, step, entity, observing) => {
    const { required, borrow } = observing;
    const own = step.responseObservation === undefined
        ? context.io.withBody(step.record.ordinal, (body) => {
            const located = body === undefined ? undefined : locateItem(body, entity.id);
            const object = located === undefined ? undefined : at(body, located.pointer);
            return located?.keys.includes(entity.idField) === true &&
                isObject(object)
                ? {
                    ordinal: step.record.ordinal,
                    pointer: located.pointer,
                    object,
                    id: entity.id,
                }
                : undefined;
        })
        : (step.responseObservation ?? undefined);
    if (own !== undefined &&
        required.every((field) => Object.hasOwn(own.object, field)))
        return own;
    if (!borrow)
        return undefined;
    const later = laterObservation(searchFrom(context, step), {
        ...itemReads(context, entity),
        // With an answer or without one, only a read whose view shows every learned clock shows what this call stamped.
        covers: (view) => required.every((field) => view.fields.includes(field)),
    });
    if (later === undefined)
        return own;
    const readFields = viewFields(context.viewOf(later.ordinal));
    context.observed(later.ordinal);
    const object = { ...own?.object, ...later.object };
    // For covered fields, the later read's omission is evidence too; do not fill it back
    // from an earlier write response. Fields outside that view retain response evidence.
    for (const field of readFields ?? [])
        if (!Object.hasOwn(later.object, field))
            delete object[field];
    return {
        ...later,
        object,
        ...(readFields === undefined ? {} : { readFields }),
    };
};
/** Add what a later call of an update showed to its plan: members, their stored types, fixed values and rules not seen before. */
const refineUpdate = (context, draft, evidence) => {
    const { plan } = draft;
    const body = refinedBody(plan.body, evidence.explained.body, {
        observed: draft.observed,
        stored: evidence.after.object,
    });
    retainFixed(context, body.fixed.slice(plan.body.fixed.length));
    plan.body = body;
    const ruled = new Set(plan.rules.map((rule) => rule.field));
    const later = new Map(evidence.explained.rules.map((rule) => [rule.field, rule]));
    plan.rules = [
        // A later call may be the first to show an echoed array sorted.
        ...plan.rules.map((rule) => {
            const shown = later.get(rule.field);
            return shown === undefined
                ? rule
                : (reconciledUpdateRule(rule, shown, draft.kept) ?? rule);
        }),
        ...evidence.explained.rules.filter((rule) => !ruled.has(rule.field)),
    ];
};
/** Count the sent values of fixed members a plan keeps, which outlive the request body they were read from. */
export const retainFixed = (context, fixed) => {
    if (fixed.length > 0)
        context.io.retain(64 + jsonTextCodeUnits(fixed) * 2);
};
/** An update's targets, and its recorded outcome: the entity takes what its observation shows, attributed to no tool. */
const outcomes = (context, entity, shown) => {
    const { type, collection, id } = entity;
    const targets = [
        entityTarget(type, collection, id),
        collectionTarget(type, collection),
    ];
    const target = { type, collection, id };
    const recorded = () => {
        context.state.put(updatedEntity(entity, { ...entity.fields, ...shown }));
        return { kind: "observed", targets, entity: target };
    };
    return { targets, target, recorded };
};
/** Build an update plan from its exemplar, or add what a later call showed. */
const buildUpdate = (context, draft, step, evidence) => {
    if (built(draft)) {
        refineUpdate(context, draft, evidence);
        return;
    }
    retainFixed(context, evidence.explained.body.fixed);
    const { ordinal } = step.record;
    const envelope = requestBodyPlan(context, step, draft, evidence.after.object)?.envelope;
    Object.assign(draft.plan, {
        exemplar_ordinal: ordinal,
        observation: {
            ordinal: evidence.after.ordinal,
            pointer: evidence.after.pointer,
        },
        response: step.response ??
            context.io.withBody(ordinal, (response) => responseShapeOf(ordinal, response, context.io.emptyResponse(ordinal), {
                idField: evidence.idField,
                id: evidence.after.id,
            })),
        body: {
            ...evidence.explained.body,
            ...(envelope === undefined ? {} : { envelope }),
        },
        rules: evidence.explained.rules,
    });
    draft.observed = evidence.after.object;
    for (const entity of context.state.ofType(draft.plan.target))
        noteFixedWidths(draft.fixedWidth, entity.fields);
};
/**
 * Apply a recorded update to the held entity, explaining every change it made. An update the
 * model does not explain, or of an entity an unmodelled write may have changed, brings the
 * entity to what it recorded instead and is not attributed to the tool.
 */
export const applyUpdate = (context, draft, step) => {
    const action = draft.plan.address?.by === "action";
    // The entity as serving names it.
    const named = itemTarget(context.state, draft.plan.target, {
        path: action ? actionItemPath(step.record.path) : step.record.path,
    });
    return updateEntity(context, draft, step, { ...named, request: true });
};
/** Apply a recorded update to the held entity a call names, with the members it wrote to that entity. */
export const updateEntity = (context, draft, step, named) => {
    const type = draft.plan.target;
    const idField = context.idField(type);
    const { collection, id } = named;
    const needs = observationNeeds(draft.plan, {
        collection,
        id,
        type,
        idField,
        body: "body" in named ? named.body : undefined,
    }, context.pending);
    const entity = context.state.entity(type, collection, id);
    const after = entity === undefined
        ? undefined
        : updatedObservation(context, step, { type, idField, collection, id }, needs);
    if (entity === undefined || after === undefined) {
        fail(draft, step, "no-observation");
        return UNKNOWN;
    }
    const { targets, target, recorded } = outcomes(context, entity, after.object);
    // Only confirmed absence makes a bodyless action; malformed or unretained content stays unknown.
    const body = "body" in named
        ? named.body
        : draft.plan.address?.by === "action" &&
            step.pinned &&
            context.io.requestBody(step.record.ordinal).kind === "absent"
            ? {}
            : requestBodyPlan(context, step, draft, after.object)?.object;
    if (step.observeOnly || body === undefined) {
        fail(draft, step, "body-unusable");
        return recorded();
    }
    const unknown = context.unknown(type, collection, id);
    const call = { ...callOf(step, body), body };
    const { explained, rules } = fitUpdateClocks(draft, after.object, explainUpdate({
        before: entity.fields,
        after: after.object,
        call,
        method: step.tool.method,
        idField,
        id,
        startMs: startOf(context, step),
        ...(after.readFields === undefined
            ? {}
            : { readFields: after.readFields }),
        others: otherFields(context.state.ofType(type), { collection, id }),
        shown: shownBefore(context.viewOf, entity, after.ordinal),
        named: (named) => context.state.named(named),
        action: needs.action,
        references: draft.plan.rules.filter((rule) => rule.rule === "reference"),
    }));
    for (const member of keptOrders(call.body, after.object))
        draft.kept.add(member);
    if (explained.unexplained.length > 0 && !unknown) {
        refuse(draft, step, "unexplained-change");
        return recorded();
    }
    // Each call must agree with the plan; one on an unknown entity cannot be checked, so it adds nothing to the plan.
    if (built(draft) &&
        (unknown ||
            contradictsPlan({ ...draft, plan: { ...draft.plan, rules } }, entity.fields, after.object, explained))) {
        if (!unknown)
            refuse(draft, step, "unexplained-change");
        return recorded();
    }
    draft.plan.rules = rules;
    noteFixedWidths(draft.fixedWidth, after.object);
    buildUpdate(context, draft, step, { after, explained, idField });
    // Serving reads the plan's observation, so the gate does too; generated values are this call's.
    const written = updatedFields(draft.plan, { before: entity.fields, observed: draft.observed }, { ...call, id }, (rule) => recordedGeneratedValue(rule, entity.fields[rule.field], after.object[rule.field]), referencedIn(context));
    const kept = keptFields(entity.fields, after.object);
    const disagrees = written.ok &&
        disagreesWithCall(draft.plan.rules, {
            written: written.value,
            after: after.object,
            kept,
        });
    if (!written.ok || (disagrees && !unknown))
        refuse(draft, step, "unexplained-change");
    if (!written.ok || disagrees || unknown)
        return recorded();
    rememberCall(context.io.retain, draft, { before: entity.fields, after: after.object, sent: body, kept }, explained.unstamped);
    // Response reproducibility is established before the read owner adopts a stored clock spelling.
    const stored = restampedFields(searchFrom(context, step), itemReads(context, { type, idField, collection, id }), written.value, draft.plan.rules);
    context.io.retain(64 +
        jsonTextCodeUnits(stored) * 2 +
        (stored === written.value ? 0 : jsonTextCodeUnits(written.value) * 2));
    context.state.put(updatedEntity(entity, stored));
    return {
        ...appliedUpdate(draft.plan, { targets, target }, entity.fields, {
            written: stored,
            body,
        }),
        responseFields: written.value,
    };
};
/** A later update's clocks in the plan's format, and the plan's rules widened to the trimmed spelling the call showed when one covers both, its siblings with it wherever the call's values fit; the plan adopts them only once the call is checked. */
const fitUpdateClocks = (draft, after, explained) => {
    if (!built(draft))
        return { explained, rules: draft.plan.rules };
    const rules = draft.plan.rules.map((rule) => {
        const later = explained.rules.find((other) => other.field === rule.field);
        if (rule.rule !== "clock" ||
            later?.rule !== "clock" ||
            JSON.stringify(later.format) === JSON.stringify(rule.format))
            return rule;
        const format = fittedClockFormat(rule.format, after[rule.field], clockEvidence(draft, rule.field));
        return format === undefined ? rule : { ...rule, format };
    });
    const fitted = siblingTrimmedClocks(rules, draft.observed, after, Object.fromEntries(draft.fixedWidth));
    const planned = new Map(fitted.map((rule) => [rule.field, rule]));
    return {
        explained: {
            ...explained,
            rules: explained.rules.map((rule) => {
                const held = planned.get(rule.field);
                return rule.rule === "clock" &&
                    held?.rule === "clock" &&
                    matchesClockFormat(held.format, readClock(after[rule.field]))
                    ? { ...rule, format: held.format }
                    : rule;
            }),
        },
        rules: fitted,
    };
};
/** Serving regenerates a learned clock on every update, so recorded calls must advance it. */
const contradictsGeneratedClock = (before, after, rules, explained) => rules.some((rule) => {
    // A clock left in the call's own second cannot show whether it advanced.
    if (rule.rule !== "clock" ||
        !Object.hasOwn(after, rule.field) ||
        explained.unstamped.includes(rule.field) ||
        explained.rules.some((candidate) => candidate.field === rule.field && candidate.rule === "held-clock"))
        return false;
    const previous = readClock(before[rule.field]);
    if (previous === undefined)
        return false;
    const next = readClock(after[rule.field]);
    return (!explained.rules.some((candidate) => candidate.field === rule.field && candidate.rule === "clock") ||
        next === undefined ||
        next.ms <= previous.ms);
});
/** Whether a later call explains its changes otherwise than the plan: rules for unsent changes hold for every call, so each call must agree with the others. */
const contradictsPlan = (draft, before, after, explained) => contradictsEarlierCalls(draft, explained.rules) ||
    contradictsGeneratedClock(before, after, draft.plan.rules, explained) ||
    conflictsWithPlan(draft.plan, explained, draft.kept);
