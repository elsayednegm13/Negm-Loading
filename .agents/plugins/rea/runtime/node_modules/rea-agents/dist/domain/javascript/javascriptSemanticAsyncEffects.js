import * as t from "@babel/types";
import { createSemanticCallableIdStack } from "./javascriptSemanticCallableStack.js";
import { semanticStaticPropertyName } from "./javascriptAstValues.js";
import { resolveSemanticBindingState, semanticResolutionBlocked, } from "./javascriptSemanticState.js";
import { semanticBindingAtRead } from "./javascriptSemanticMutationInitializers.js";
import { traverseJavaScriptValueAst } from "./javascriptSemanticTraversal.js";
import { isUnmodifiedGlobalReference } from "./javascriptSemanticAmbientWrites.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
import { builtinDataEffectMethod, dataEffectArgumentBindingId, dataEffectLiteralString, dataEffectMemberCallee, assignedSemanticResultBindings, scalarAssignedResultBinding, semanticProjectedBindingFacts, } from "./javascriptSemanticDataEffectHelpers.js";
const EVENT_REGISTER_METHODS = [
    "on",
    "once",
    "addListener",
    "prependListener",
    "prependOnceListener",
];
const EVENT_REMOVE_METHODS = [
    "off",
    "removeListener",
    "removeAllListeners",
];
/**
 * Methods whose argument position 1 names a listener. `removeAllListeners`
 * takes only an optional event name, and `emit` passes its remaining
 * arguments as data to listeners that already exist.
 */
const EVENT_LISTENER_METHODS = [...EVENT_REGISTER_METHODS, "off", "removeListener"];
const EVENT_METHODS = [
    ...EVENT_REGISTER_METHODS,
    ...EVENT_REMOVE_METHODS,
    "emit",
];
const TIMER_SCHEDULE_METHODS = [
    "setTimeout",
    "setInterval",
    "setImmediate",
];
const TIMER_CANCEL_METHODS = [
    "clearTimeout",
    "clearInterval",
    "clearImmediate",
];
/** Recover explicit EventEmitter and Node timer candidates from inert syntax. */
export const collectJavaScriptSemanticAsyncEffects = (program, state, callables) => {
    const events = [];
    const timers = [];
    const callableIds = new Set(callables.map(({ callableId }) => callableId));
    const callableStack = createSemanticCallableIdStack(callableIds);
    const ancestors = [];
    traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
        enter: (node, parent) => {
            callableStack.enter(node, parent);
            if (t.isCallExpression(node) || t.isOptionalCallExpression(node)) {
                const ownerCallableId = callableStack.callables.at(-1) ?? null;
                collectEvent(node, ownerCallableId, state, events);
                collectTimer({
                    node,
                    ownerCallableId,
                    state,
                    output: timers,
                    ancestors,
                });
            }
            ancestors.push(node);
        },
        exit: (node) => {
            ancestors.pop();
            callableStack.exit(node);
        },
    });
    return {
        eventOperations: events,
        timerOperations: resolveTimers(timers),
    };
};
const collectEvent = (node, ownerCallableId, state, output) => {
    const member = dataEffectMemberCallee(node);
    if (member === null)
        return;
    const method = EVENT_METHODS.find((candidate) => candidate ===
        semanticStaticPropertyName(member.property, member.computed));
    if (method === undefined)
        return;
    const kind = eventKind(method);
    const eventArgument = node.arguments[0];
    const listenerArgument = EVENT_LISTENER_METHODS.includes(method)
        ? node.arguments[1]
        : undefined;
    const emitter = emitterIdentity(member.object, state);
    const eventName = dataEffectLiteralString(eventArgument);
    output.push({
        eventId: `event:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`,
        kind,
        method,
        location: range(node),
        ownerCallableId,
        emitterKey: emitter.key,
        emitterBindingId: emitter.bindingId,
        eventName,
        listenerBindingId: dataEffectArgumentBindingId(listenerArgument, state),
        listenerLocation: t.isNode(listenerArgument)
            ? range(listenerArgument)
            : null,
        resolution: eventName === null
            ? "unresolved"
            : emitter.complete
                ? "complete"
                : "partial",
    });
};
const eventKind = (method) => {
    if (EVENT_REGISTER_METHODS.some((candidate) => candidate === method))
        return "register";
    if (EVENT_REMOVE_METHODS.some((candidate) => candidate === method))
        return "remove";
    return "dispatch";
};
const emitterIdentity = (node, state) => {
    if (t.isIdentifier(node)) {
        const binding = resolveSemanticBindingState(state, node, node.name);
        if (binding !== undefined) {
            const read = semanticBindingAtRead(binding, node, state.parentsByNode);
            const origins = [
                ...read.binding.initializers,
                ...read.binding.referenceInitializers,
            ];
            const replaced = binding.definitions.some(({ kind }) => kind === "assignment");
            const origin = origins.length === 1 ? origins[0] : undefined;
            const complete = !replaced ||
                (read.status === "ordered" &&
                    read.hasDefiniteInitializer &&
                    origin !== undefined);
            return {
                key: !replaced
                    ? `binding:${binding.bindingId}`
                    : complete
                        ? `binding:${binding.bindingId}:origin:${origin?.node.start ?? -1}:${origin?.node.end ?? -1}`
                        : `expression:${node.start ?? -1}:${node.end ?? -1}`,
                bindingId: binding.bindingId,
                complete,
            };
        }
        return {
            key: `global:${node.name}`,
            bindingId: null,
            complete: !semanticResolutionBlocked(state, node, node.name),
        };
    }
    if (t.isThisExpression(node)) {
        let owner = state.parentsByNode.get(node);
        while (owner !== undefined &&
            !t.isClass(owner) &&
            !(t.isFunction(owner) && !t.isArrowFunctionExpression(owner)))
            owner = state.parentsByNode.get(owner);
        // Lexical receiver ownership does not establish one runtime instance.
        return {
            key: `this:${owner?.start ?? -1}:${owner?.end ?? -1}`,
            bindingId: null,
            complete: false,
        };
    }
    return {
        key: `expression:${String(node.start ?? -1)}:${String(node.end ?? -1)}`,
        bindingId: null,
        complete: false,
    };
};
const collectTimer = (input) => {
    const { node, ownerCallableId, state, output, ancestors } = input;
    const method = timerMethod(node.callee, state);
    if (method === null)
        return;
    const kind = TIMER_SCHEDULE_METHODS.some((candidate) => candidate === method)
        ? "schedule"
        : "cancel";
    const projectedResultBindings = assignedSemanticResultBindings(node, ancestors, state);
    const handle = kind === "cancel" && t.isIdentifier(node.arguments[0])
        ? resolveSemanticBindingState(state, node.arguments[0], node.arguments[0].name)
        : undefined;
    const handleRead = handle === undefined || !t.isIdentifier(node.arguments[0])
        ? null
        : (() => {
            const snapshot = semanticBindingAtRead(handle, node.arguments[0], state.parentsByNode);
            // A const handle has the same value inside a later closure even
            // when the source positions belong to different function bodies.
            const stableClosureCapture = !handle.mutable &&
                handle.initializers.length === 1 &&
                handle.referenceInitializers.length === 0;
            const origins = [
                ...snapshot.binding.initializers,
                ...snapshot.binding.referenceInitializers,
            ];
            return {
                origins: origins.map(({ node: origin }) => origin),
                complete: snapshot.status === "ordered" || stableClosureCapture,
            };
        })();
    output.push({
        node,
        method,
        kind,
        ownerCallableId,
        handleBindingId: kind === "schedule"
            ? scalarAssignedResultBinding(projectedResultBindings)
            : dataEffectArgumentBindingId(node.arguments[0], state),
        projectedResultBindings: kind === "schedule"
            ? semanticProjectedBindingFacts(projectedResultBindings.filter(({ projectionPath }) => projectionPath.length > 0))
            : [],
        handleRead,
    });
};
const resolveTimers = (candidates) => {
    const schedules = new Map(candidates
        .filter(({ kind }) => kind === "schedule")
        .map((candidate) => [candidate.node, candidate]));
    return candidates.map((candidate) => {
        // Unordered reads retain possible initializers as candidate edges. Only an
        // ordered or immutable read can establish one complete cancellation link.
        const linked = candidate.handleRead?.origins.flatMap((origin) => {
            const schedule = schedules.get(origin);
            return schedule === undefined ? [] : [schedule];
        }) ?? [];
        const incompleteOrigins = candidate.handleRead !== null &&
            candidate.handleRead.origins.length !== linked.length;
        return {
            timerId: timerId(candidate),
            kind: candidate.kind,
            method: candidate.method,
            location: range(candidate.node),
            ownerCallableId: candidate.ownerCallableId,
            handleBindingId: candidate.handleBindingId,
            projectedResultBindings: candidate.projectedResultBindings,
            linkedTimerId: linked.length === 1 && linked[0] !== undefined
                ? timerId(linked[0])
                : null,
            delayMilliseconds: timerDelay(candidate),
            resolution: candidate.kind === "schedule"
                ? "complete"
                : linked.length === 1 &&
                    candidate.handleRead?.complete &&
                    !incompleteOrigins &&
                    !linked[0]?.projectedResultBindings.some(({ bindingId }) => bindingId === candidate.handleBindingId)
                    ? "complete"
                    : linked.length > 0
                        ? "partial"
                        : "unresolved",
        };
    });
};
const timerMethod = (callee, state) => {
    if (t.isIdentifier(callee)) {
        const binding = resolveSemanticBindingState(state, callee, callee.name);
        if (binding === undefined) {
            const method = admittedTimerMethod(callee.name);
            if (method === null)
                return null;
            return semanticResolutionBlocked(state, callee, callee.name) ||
                !isUnmodifiedGlobalReference(callee, state, callee.name)
                ? null
                : method;
        }
    }
    return admittedTimerMethod(builtinDataEffectMethod(callee, state, ["timers", "node:timers"]) ?? "");
};
const admittedTimerMethod = (value) => [...TIMER_SCHEDULE_METHODS, ...TIMER_CANCEL_METHODS].find((candidate) => candidate === value) ?? null;
const timerDelay = (candidate) => {
    if (candidate.kind !== "schedule" || candidate.method === "setImmediate")
        return null;
    const delay = candidate.node.arguments[1];
    // An overflowing literal such as 1e999 parses to Infinity, which JSON
    // Evidence cannot carry; keep that delay unknown like any other.
    return t.isNumericLiteral(delay) && Number.isFinite(delay.value)
        ? delay.value
        : null;
};
const timerId = (candidate) => `timer:${candidate.kind}:${String(candidate.node.start ?? -1)}:${String(candidate.node.end ?? -1)}`;
