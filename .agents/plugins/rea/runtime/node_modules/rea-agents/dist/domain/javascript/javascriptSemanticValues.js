import { semanticBindingMayHaveOpaqueEffect, semanticBindingCanBeRebound, semanticOpaqueBindingReadMayHaveChanged, } from "./javascriptSemanticOpaqueEffects.js";
import * as t from "@babel/types";
import { semanticKnownSymbolKey } from "./javascriptSemanticPropertyKeys.js";
import { logicalRightOperand } from "./javascriptSymbolicControlFlow.js";
import { SemanticDependencyProofs, } from "./javascriptSemanticDependencies.js";
import { semanticCapturePosition, semanticEscapeFollowsCapture, semanticBindingEffectFollowsCapture, semanticBindingPrecedesCapture, semanticBindingAtRead, } from "./javascriptSemanticMutationInitializers.js";
import { semanticSlotAtPath, semanticContainer, } from "./javascriptSemanticSlots.js";
import { invalidateSemanticEscapedPath, invalidateSemanticMutationPaths, } from "./javascriptSemanticMutationValues.js";
import { recordSemanticValueLimit, resolveSemanticBindingState, } from "./javascriptSemanticState.js";
import { semanticRequireOrigin } from "./javascriptSemanticRequireOrigin.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { readExactJavaScriptLiteral, semanticStaticPropertyKey, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { semanticAmbiguousProvenance, semanticLocalProvenance, semanticOriginsProvenance, semanticUnresolvedProvenance, uniqueSemanticOrigins, } from "./javascriptSemanticProvenance.js";
import { semanticPrimitiveCandidates as primitiveCandidates, semanticPrimitiveSet as primitiveSet, } from "./javascriptSemanticPrimitives.js";
import { SEMANTIC_EXPRESSION_DEPTH_LIMIT, SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT, exceedsSemanticPrimitiveAdditionByteBudget, exceedsSemanticTemplateByteBudget, semanticResourceLimitUnknown, semanticResourceLimitReason, } from "./javascriptSemanticResourceLimits.js";
// Function identity is outside the public constant lattice. Retain its
// non-undefined proof with the immutable value rather than interpreting an
// "unknown" reason or recovering callable syntax in default consumers.
const definitelyDefinedValues = new WeakSet();
const definedNonPrimitiveValue = (reason) => {
    const value = { status: "unknown", reason };
    definitelyDefinedValues.add(value);
    return value;
};
/** Definedness is independent of whether the constant lattice retains a value. */
export const semanticValueDefinitelyDefined = (value) => value.status === "literal" ||
    value.status === "union" ||
    value.status === "object" ||
    value.status === "array" ||
    definitelyDefinedValues.has(value);
// Indexing owns stable binding identities; effects invalidate values, not this
// identity-only layout. No query result or dependency closure is retained here.
const dependencyProofsByState = new WeakMap();
const createEvaluationMemo = (state) => {
    let dependencies = dependencyProofsByState.get(state);
    if (dependencies === undefined) {
        dependencies = SemanticDependencyProofs.forBindings(state.bindingsById.keys());
        dependencyProofsByState.set(state, dependencies);
    }
    return {
        provenance: new Map(),
        dependencyFrames: [],
        dependencies: dependencies.forQuery(),
    };
};
const CALLER_INDEPENDENT = Number.POSITIVE_INFINITY;
const EVERY_CALLER = -1;
const callerIndependentBindingValuesByState = new WeakMap();
const primitiveBindingValuesByState = new WeakMap();
const primitiveExpressionValuesByState = new WeakMap();
const capturedBindingValuesByState = new WeakMap();
/** Discard every state-owned value derived before the effects boundary changed. */
export const clearSemanticValueCaches = (state) => {
    primitiveBindingValuesByState.delete(state);
    capturedBindingValuesByState.delete(state);
    primitiveExpressionValuesByState.delete(state);
    callerIndependentBindingValuesByState.delete(state);
};
const callerIndependentBindingValuesFor = (state) => {
    const existing = callerIndependentBindingValuesByState.get(state);
    if (existing !== undefined)
        return existing;
    const values = new Map();
    callerIndependentBindingValuesByState.set(state, values);
    return values;
};
const primitiveBindingValuesFor = (state) => {
    const existing = primitiveBindingValuesByState.get(state);
    if (existing !== undefined)
        return existing;
    const values = new Map();
    primitiveBindingValuesByState.set(state, values);
    return values;
};
// Cap expression recursion independently from graph nodes and primitive unions.
const isSemanticResourceLimit = (value) => value.status === "unknown" && value.resourceLimit !== undefined;
/** Evaluate one binding in the bounded constant-value lattice. */
export const evaluateSemanticBinding = (binding, state) => semanticBindingCanBeRebound(binding) &&
    semanticBindingMayHaveOpaqueEffect(binding, state)
    ? {
        status: "unknown",
        reason: "Direct eval may have changed this lexical binding.",
    }
    : evaluateBinding(binding, {
        state,
        bindings: new Map(),
        expressionDepth: 0,
        primitiveBindingValues: primitiveBindingValuesFor(state),
        dependence: { lowest: CALLER_INDEPENDENT },
        memo: createEvaluationMemo(state),
    });
/** Evaluate an inert expression, optionally at an earlier reference capture. */
export const evaluateSemanticExpression = (node, state, capturePoint) => {
    const context = {
        state,
        bindings: new Map(),
        expressionDepth: 0,
        primitiveBindingValues: primitiveBindingValuesFor(state),
        dependence: { lowest: CALLER_INDEPENDENT },
        memo: createEvaluationMemo(state),
    };
    return capturePoint === undefined
        ? evaluateCapturedExpression(node, context)
        : evaluateExpression(node, captureContextAt(capturePoint, context) ?? context);
};
/** Resolve an expression using the same alias and module provenance owner. */
export const evaluateSemanticExpressionProvenance = (node, state) => provenanceForExpression(node, {
    state,
    bindings: new Map(),
    expressionDepth: 0,
    primitiveBindingValues: primitiveBindingValuesFor(state),
    dependence: { lowest: CALLER_INDEPENDENT },
    memo: createEvaluationMemo(state),
});
/** Follow module provenance through destructuring, members, and aliases. */
export const evaluateSemanticProvenance = (binding, state) => {
    const provenance = provenanceForBinding(binding, {
        state,
        bindings: new Map(),
        expressionDepth: 0,
        primitiveBindingValues: primitiveBindingValuesFor(state),
        dependence: { lowest: CALLER_INDEPENDENT },
        memo: createEvaluationMemo(state),
    });
    return semanticBindingCanBeRebound(binding) &&
        semanticBindingMayHaveOpaqueEffect(binding, state)
        ? semanticAmbiguousProvenance(provenance.origins, "Direct eval may have changed this runtime value.")
        : provenance;
};
/** Follow a namespace binding as it was read at a specific source position. */
export const evaluateSemanticProvenanceAtRead = (binding, read, state) => provenanceForBindingAtRead(binding, read, {
    state,
    bindings: new Map(),
    expressionDepth: 0,
    primitiveBindingValues: primitiveBindingValuesFor(state),
    dependence: { lowest: CALLER_INDEPENDENT },
    memo: createEvaluationMemo(state),
});
const readMemoizedEvaluation = (entry, context) => {
    if (entry === undefined ||
        context.memo.dependencies.intersects(entry.dependencies, context.bindings))
        return undefined;
    retainDependencyProof(entry.dependencies, context);
    return entry.value;
};
const retainDependencyProof = (proof, context) => {
    const parent = context.memo.dependencyFrames.at(-1);
    if (parent !== undefined)
        parent.proof = context.memo.dependencies.union(parent.proof, proof);
};
const recordBindingDependency = (binding, context) => retainDependencyProof(context.memo.dependencies.binding(binding.bindingId), context);
const collectEvaluationDependencies = (binding, context, evaluate) => {
    const frame = { proof: context.memo.dependencies.binding(binding.bindingId) };
    context.memo.dependencyFrames.push(frame);
    try {
        return { value: evaluate(), dependencies: frame.proof };
    }
    finally {
        context.memo.dependencyFrames.pop();
        retainDependencyProof(frame.proof, context);
    }
};
/**
 * A value snapshot consumes its sole initializer plus its source binding's
 * effects. Key the parsed initializer fact (including projection), binding ID
 * and capture point, rather than an ephemeral snapshot object or the whole ID.
 * Query ownership prevents reuse across effect changes. Exact expression-depth
 * keys also bound failed speculative evaluations without skipping their budget.
 */
const readSnapshotValuesFor = (binding, context) => {
    const initializer = binding.initializers[0];
    if (binding.initializers.length !== 1 || initializer === undefined)
        return undefined;
    let values;
    if (context.capturePoint === undefined)
        values = context.memo.snapshotValues ??= new WeakMap();
    else {
        const captures = (context.memo.capturedSnapshotValues ??= new WeakMap());
        let captured = captures.get(context.capturePoint);
        if (captured === undefined) {
            captured = new WeakMap();
            captures.set(context.capturePoint, captured);
        }
        values = captured;
    }
    let entries = values.get(initializer);
    if (entries === undefined) {
        entries = new Map();
        values.set(initializer, entries);
    }
    let depths = entries.get(binding.bindingId);
    if (depths === undefined) {
        depths = new Map();
        entries.set(binding.bindingId, depths);
    }
    return depths;
};
const evaluateBinding = (binding, context, 
// Temporal read facts use a query-owned cache separate from whole bindings.
wholeBinding = true) => {
    recordBindingDependency(binding, context);
    const cycleHead = context.bindings.get(binding.bindingId);
    if (cycleHead !== undefined) {
        context.dependence.lowest = Math.min(context.dependence.lowest, cycleHead);
        return { status: "cycle", reason: `Alias cycle at ${binding.name}.` };
    }
    if (wholeBinding &&
        context.capturePoint !== undefined &&
        !semanticBindingPrecedesCapture(binding, context.capturePoint, context.state.parentsByNode)) {
        const { capturePoint: _capturePoint, ...liveContext } = context;
        return evaluateBinding(binding, {
            ...liveContext,
            primitiveBindingValues: primitiveBindingValuesFor(context.state),
        });
    }
    const cached = wholeBinding
        ? context.primitiveBindingValues.get(binding.bindingId)
        : undefined;
    if (cached !== undefined)
        return cached;
    // Each closure that aliases an outer binding evaluates it both live and at
    // its capture point, so re-deriving it doubles the work at every level of
    // nesting. A deeper reader derives it again: the retained value would carry
    // more nesting than the remaining depth budget allows it to observe.
    const snapshots = wholeBinding
        ? undefined
        : readSnapshotValuesFor(binding, context);
    const snapshot = snapshots?.get(context.expressionDepth);
    const snapshotValue = readMemoizedEvaluation(snapshot, context);
    if (snapshotValue !== undefined) {
        // A result limited by this budget must not become caller-independent when
        // reused inside another binding evaluated at the same remaining depth.
        if (snapshot?.depthDependent === true)
            context.dependence.lowest = EVERY_CALLER;
        return snapshotValue;
    }
    const independent = wholeBinding && context.capturePoint === undefined
        ? callerIndependentBindingValuesFor(context.state)
        : undefined;
    const retained = independent?.get(binding.bindingId);
    if (retained !== undefined &&
        context.expressionDepth <= retained.expressionDepth) {
        const reusable = readMemoizedEvaluation(retained, context);
        if (reusable !== undefined)
            return reusable;
    }
    if (binding.referenceInitializers.some(({ assignment }) => assignment) &&
        (binding.initializers.length > 0 ||
            (context.state.bindingsById.get(binding.bindingId)?.initializers.length ??
                0) > 0))
        return {
            status: "ambiguous",
            reason: `Binding ${binding.name} has value and projected-reference assignments.`,
        };
    if (binding.initializers.length === 0)
        return {
            status: "unknown",
            reason: wholeBinding
                ? `Binding ${binding.name} has no constant initializer.`
                : `Binding ${binding.name} has no proven initializer at this read.`,
        };
    if (binding.initializers.some(({ node }) => t.isUpdateExpression(node) ||
        (t.isAssignmentExpression(node) &&
            node.operator !== "=" &&
            node.operator !== "&&=" &&
            node.operator !== "||=" &&
            node.operator !== "??=")))
        return {
            status: "unknown",
            reason: `Binding ${binding.name} has a compound or update write.`,
        };
    if (binding.initializers.length > 1)
        return {
            status: "ambiguous",
            reason: `Binding ${binding.name} has multiple possible assignments.`,
        };
    const initializer = binding.initializers[0];
    if (initializer === undefined)
        return { status: "unknown", reason: "Missing binding initializer." };
    if (context.state.conditionallySkippedExpressions.has(initializer.node))
        return {
            status: "unknown",
            reason: `Binding ${binding.name} may remain uninitialized.`,
        };
    const position = context.bindings.size;
    const callerDependence = context.dependence.lowest;
    context.dependence.lowest = CALLER_INDEPENDENT;
    context.bindings.set(binding.bindingId, position);
    let value;
    let callerIndependent = false;
    let depthDependent = false;
    let evaluated;
    try {
        evaluated = collectEvaluationDependencies(binding, context, () => {
            const nested = nestedContext(context);
            let value = projectValue(evaluateExpression(initializer.node, nested), initializer.projection);
            if (canCapturePrimitive(value)) {
                const captureContext = primitiveCaptureContext(initializer.node, nested);
                if (captureContext !== undefined) {
                    const captured = projectValue(evaluateExpression(initializer.node, captureContext), initializer.projection);
                    if (isPrimitive(captured))
                        value = captured;
                }
            }
            return value;
        });
        value = evaluated.value;
        // A cycle among bindings this one reads is part of its value. A cycle
        // through this binding is cut elsewhere when a caller holds another member.
        callerIndependent = context.dependence.lowest > position;
        depthDependent = context.dependence.lowest === EVERY_CALLER;
    }
    finally {
        context.bindings.delete(binding.bindingId);
        context.dependence.lowest = callerIndependent
            ? callerDependence
            : Math.min(callerDependence, context.dependence.lowest);
    }
    let projected = invalidateSemanticMutationPaths(value, binding.memberWrites
        .filter(({ node }) => context.capturePoint === undefined ||
        node === undefined ||
        !semanticBindingEffectFollowsCapture(binding, context.capturePoint, node, context.state.parentsByNode))
        .map(({ path }) => path));
    for (const escape of binding.escapedPaths) {
        // Escapes only invalidate object references; other lattice values survive.
        if (projected.status !== "object" && projected.status !== "array")
            break;
        if (context.capturePoint !== undefined &&
            semanticEscapeFollowsCapture(binding, context.capturePoint, escape.node, context.state.parentsByNode))
            continue;
        projected = invalidateSemanticEscapedPath(projected, escape.path);
    }
    if ((projected.status === "object" || projected.status === "array") &&
        semanticBindingMayHaveOpaqueEffect(binding, context.state, context.capturePoint, "reference"))
        projected = {
            status: "unknown",
            reason: "Direct eval may have mutated this object reference.",
        };
    if (callerIndependent &&
        independent !== undefined &&
        (retained === undefined ||
            retained.expressionDepth < context.expressionDepth))
        independent.set(binding.bindingId, {
            value: projected,
            dependencies: evaluated.dependencies,
            expressionDepth: context.expressionDepth,
        });
    // A cycle through an active caller is not reusable. Depth-dependent partial
    // values are reusable at this exact budget, with their dependence preserved.
    if (snapshots !== undefined &&
        (callerIndependent || depthDependent) &&
        !context.memo.dependencies.intersects(evaluated.dependencies, context.bindings))
        snapshots.set(context.expressionDepth, {
            value: projected,
            dependencies: evaluated.dependencies,
            depthDependent,
        });
    // Point-local memoization also bounds failed speculative captures. Only a
    // primitive result is allowed back into ordinary value evaluation.
    if (wholeBinding &&
        (context.capturePoint !== undefined ||
            projected.status === "literal" ||
            projected.status === "union" ||
            (isSemanticResourceLimit(projected) &&
                (projected.resourceLimit === "primitive-bytes" ||
                    projected.resourceLimit === "primitive-candidates"))))
        context.primitiveBindingValues.set(binding.bindingId, projected);
    return projected;
};
const evaluateExpression = (node, context) => {
    const value = evaluateExpressionValue(node, context);
    recordSemanticValueLimit(context.state, value);
    return value;
};
const evaluateExpressionValue = (node, context) => {
    if (context.expressionDepth > SEMANTIC_EXPRESSION_DEPTH_LIMIT) {
        context.dependence.lowest = EVERY_CALLER;
        return semanticResourceLimitUnknown("expression-depth");
    }
    const unwrapped = unwrapJavaScriptExpression(node);
    if (unwrapped.depth > 0) {
        if (context.expressionDepth + unwrapped.depth >
            SEMANTIC_EXPRESSION_DEPTH_LIMIT) {
            context.dependence.lowest = EVERY_CALLER;
            return semanticResourceLimitUnknown("expression-depth");
        }
        return evaluateExpression(unwrapped.node, {
            ...context,
            expressionDepth: context.expressionDepth + unwrapped.depth,
        });
    }
    const literal = readExactJavaScriptLiteral(node);
    if (literal.found)
        return primitiveSet([literal.value]);
    if (t.isFunctionExpression(node) ||
        t.isFunctionDeclaration(node) ||
        t.isArrowFunctionExpression(node) ||
        t.isClassExpression(node) ||
        t.isClassDeclaration(node))
        return definedNonPrimitiveValue(`Unsupported ${node.type} value.`);
    if (t.isIdentifier(node)) {
        const binding = resolveSemanticBindingState(context.state, node, node.name);
        if (binding === undefined)
            return { status: "unknown", reason: `Unbound identifier ${node.name}.` };
        const read = semanticBindingAtRead(binding, node, context.state.parentsByNode);
        if (read.status === "unresolved" &&
            binding.mutable &&
            binding.definitions.some(({ kind }) => kind === "assignment")) {
            const value = evaluateBinding(binding, nestedContext(context));
            if (value.status === "unknown" ||
                value.status === "ambiguous" ||
                value.status === "cycle")
                return value;
            return {
                status: "unknown",
                reason: `Binding ${binding.name} has unresolved ordering at this read.`,
            };
        }
        const atRead = read.binding;
        if (semanticOpaqueBindingReadMayHaveChanged(binding, context.capturePoint ?? node, context.state))
            return {
                status: "unknown",
                reason: "Direct eval may have changed this lexical binding.",
            };
        return evaluateBinding(atRead, nestedContext(context), atRead === binding);
    }
    if (t.isTemplateLiteral(node))
        return evaluateTemplate(node, context);
    if (t.isConditionalExpression(node) || t.isLogicalExpression(node))
        return mergeValues(semanticSelectedBranches(node, context).map((branch) => evaluateExpression(branch, nestedContext(context))));
    if (t.isObjectExpression(node))
        return evaluateObject(node, context);
    if (t.isArrayExpression(node))
        return evaluateArray(node, context);
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
        return evaluateMember(node, context);
    if (t.isBinaryExpression(node, { operator: "+" }))
        return evaluateAddition(node, context);
    if (t.isUnaryExpression(node))
        return evaluateUnary(node, context);
    return { status: "unknown", reason: `Unsupported ${node.type} value.` };
};
const evaluateTemplate = (node, context) => {
    let candidates = [""];
    for (let index = 0; index < node.quasis.length; index += 1) {
        const quasi = node.quasis[index];
        const text = quasi?.value.cooked;
        if (text === undefined || text === null)
            return {
                status: "unknown",
                reason: "Template text has no cooked representation.",
            };
        if (exceedsSemanticTemplateByteBudget(candidates, [text]))
            return semanticResourceLimitUnknown("primitive-bytes");
        candidates = candidates.map((prefix) => `${prefix}${text}`);
        const expression = node.expressions[index];
        if (expression === undefined)
            continue;
        const evaluated = evaluateExpression(expression, nestedContext(context));
        const values = primitiveCandidates(evaluated);
        if (values === null) {
            if (isSemanticResourceLimit(evaluated))
                return evaluated;
            return {
                status: "unknown",
                reason: "Template expression is not a bounded primitive.",
            };
        }
        if (candidates.length > SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT / values.length)
            return semanticResourceLimitUnknown("primitive-candidates");
        const suffixes = values.map((value) => String(value));
        if (exceedsSemanticTemplateByteBudget(candidates, suffixes))
            return semanticResourceLimitUnknown("primitive-bytes");
        candidates = candidates.flatMap((prefix) => suffixes.map((suffix) => `${prefix}${suffix}`));
    }
    return primitiveSet(candidates);
};
/** Value and provenance selection consume the same established branch facts. */
const semanticSelectedBranches = (node, context) => {
    if (t.isConditionalExpression(node)) {
        const test = evaluateExpression(node.test, nestedContext(context));
        const choice = semanticCondition(test, Boolean);
        return choice === undefined
            ? [node.consequent, node.alternate]
            : [choice ? node.consequent : node.alternate];
    }
    const left = evaluateExpression(node.left, nestedContext(context));
    const choice = logicalRightOperand(node.operator, semanticCondition(left, Boolean), semanticCondition(left, (value) => value === null, false));
    return choice === undefined
        ? [node.left, node.right]
        : [choice ? node.right : node.left];
};
/** All retained alternatives must agree before discarding a branch. */
const semanticCondition = (value, select, objectResult = true) => {
    if (value.status === "object" || value.status === "array")
        return objectResult;
    const choices = primitiveCandidates(value)?.map(select);
    return choices !== undefined &&
        choices.length > 0 &&
        choices.every((choice) => choice === choices[0])
        ? choices[0]
        : undefined;
};
const evaluateObject = (node, context) => {
    const propertiesByName = new Map();
    let unknownProperties = false;
    let omittedProperties = 0;
    const invalidateEarlierProperties = () => {
        for (const [name] of propertiesByName)
            propertiesByName.set(name, {
                name,
                presence: "present",
                value: {
                    status: "unknown",
                    reason: "A later property may overwrite this value.",
                },
            });
    };
    for (const property of node.properties) {
        if (t.isSpreadElement(property)) {
            const copied = evaluateExpression(property.argument, captureContextAt(property.argument, nestedContext(context)) ??
                nestedContext(context));
            if (copied.status === "object" || copied.status === "array") {
                const unknown = copied.status === "object"
                    ? copied.unknownProperties
                    : copied.unknownItems;
                if (unknown) {
                    unknownProperties = true;
                    omittedProperties = null;
                    invalidateEarlierProperties();
                }
                for (const field of semanticContainer(copied).slots) {
                    if (field.presence === "absent")
                        continue;
                    propertiesByName.set(field.name, {
                        ...field,
                        value: isPrimitive(field.value)
                            ? field.value
                            : {
                                status: "unknown",
                                reason: "Copied reference fields retain live identity rather than a scalar snapshot.",
                            },
                    });
                }
            }
            else if (copied.status !== "literal" ||
                typeof copied.value === "string") {
                unknownProperties = true;
                omittedProperties = null;
                invalidateEarlierProperties();
            }
            continue;
        }
        if (property.computed &&
            semanticKnownSymbolKey(property.key, context.state)) {
            // The string-slot lattice omits symbol names, but they cannot overwrite
            // established string fields. Keep the omitted inventory explicit.
            unknownProperties = true;
            if (omittedProperties !== null)
                omittedProperties += 1;
            continue;
        }
        const name = semanticStaticPropertyKey(property.key, property.computed);
        if (name === null) {
            unknownProperties = true;
            if (omittedProperties !== null)
                omittedProperties += 1;
            invalidateEarlierProperties();
            continue;
        }
        // This spelling changes the prototype instead of defining an own slot.
        if (t.isObjectProperty(property) &&
            !property.computed &&
            !property.shorthand &&
            name === "__proto__") {
            unknownProperties = true;
            if (omittedProperties !== null)
                omittedProperties += 1;
            continue;
        }
        propertiesByName.set(name, {
            name,
            presence: "present",
            value: t.isObjectProperty(property)
                ? evaluateCapturedExpression(property.value, nestedContext(context))
                : property.kind === "method"
                    ? definedNonPrimitiveValue("Object method or accessor value is not a primitive.")
                    : {
                        status: "unknown",
                        reason: "Object method or accessor value is not a primitive.",
                    },
        });
    }
    const properties = [...propertiesByName.values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
    return unknownProperties
        ? {
            status: "object",
            properties,
            unknownProperties: true,
            omittedProperties,
        }
        : {
            status: "object",
            properties,
            unknownProperties: false,
            omittedProperties: 0,
        };
};
const evaluateArray = (node, context) => {
    const items = [];
    let unknownItems = false;
    let omittedItems = 0;
    for (const element of node.elements) {
        if (t.isSpreadElement(element)) {
            unknownItems = true;
            omittedItems = null;
            // Subsequent elements have no fixed index after an unknown-length spread.
            break;
        }
        if (element === null) {
            items.push({
                name: String(items.length),
                presence: "absent",
                value: { status: "unknown", reason: "Array hole has no own value." },
            });
            continue;
        }
        items.push({
            name: String(items.length),
            presence: "present",
            value: evaluateCapturedExpression(element, nestedContext(context)),
        });
    }
    return unknownItems
        ? { status: "array", items, unknownItems: true, omittedItems }
        : {
            status: "array",
            items,
            unknownItems: false,
            omittedItems: 0,
        };
};
const evaluateMember = (node, context) => {
    const keys = [];
    let current = node;
    let value;
    while (t.isMemberExpression(current) ||
        t.isOptionalMemberExpression(current)) {
        if (!t.isNode(current.object)) {
            value = { status: "unknown", reason: "Unsupported member base." };
            break;
        }
        const key = semanticStaticPropertyKey(current.property, current.computed);
        if (key === null) {
            value = { status: "unknown", reason: "Dynamic member key." };
            break;
        }
        keys.push(key);
        current = current.object;
    }
    value ??= evaluateExpression(current, nestedContext(context));
    for (const key of keys.reverse())
        value = projectValue(value, [key]);
    return value;
};
const evaluateAddition = (node, context) => {
    const pending = [];
    let current = node;
    while (true) {
        if (t.isBinaryExpression(current, { operator: "+" })) {
            pending.push({ node: current, left: undefined });
            current = current.left;
            continue;
        }
        let value = evaluateExpression(current, nestedContext(context));
        while (true) {
            const parent = pending.at(-1);
            if (parent === undefined)
                return value;
            if (parent.left === undefined) {
                parent.left = value;
                current = parent.node.right;
                break;
            }
            value = addPrimitiveValues(parent.left, value);
            pending.pop();
        }
    }
};
const addPrimitiveValues = (leftValue, rightValue) => {
    const left = primitiveCandidates(leftValue);
    const right = primitiveCandidates(rightValue);
    if (left === null || right === null) {
        if (isSemanticResourceLimit(leftValue))
            return leftValue;
        if (isSemanticResourceLimit(rightValue))
            return rightValue;
        return { status: "unknown", reason: "Non-primitive addition." };
    }
    if (left.length > SEMANTIC_PRIMITIVE_CANDIDATE_LIMIT / right.length)
        return semanticResourceLimitUnknown("primitive-candidates");
    if (exceedsSemanticPrimitiveAdditionByteBudget(left, right))
        return semanticResourceLimitUnknown("primitive-bytes");
    const values = left.flatMap((leftValue) => right.map((rightValue) => typeof leftValue === "string" || typeof rightValue === "string"
        ? `${String(leftValue)}${String(rightValue)}`
        : Number(leftValue) + Number(rightValue)));
    return primitiveSet(values);
};
const evaluateUnary = (node, context) => {
    const evaluated = evaluateExpression(node.argument, nestedContext(context));
    const argument = primitiveCandidates(evaluated);
    if (argument === null) {
        if (isSemanticResourceLimit(evaluated))
            return evaluated;
        return { status: "unknown", reason: "Non-primitive unary operand." };
    }
    if (node.operator === "!")
        return primitiveSet(argument.map((value) => !value));
    if (node.operator === "+")
        return primitiveSet(argument.map((value) => Number(value)));
    if (node.operator === "-")
        return primitiveSet(argument.map((value) => -Number(value)));
    return { status: "unknown", reason: `Unsupported unary ${node.operator}.` };
};
const projectValue = (value, projection) => {
    if (isSemanticResourceLimit(value))
        return value;
    if (projection.includes(null))
        return { status: "unknown", reason: "Cannot project a dynamic property." };
    const path = projection.map((key) => String(key));
    const slot = semanticSlotAtPath(value, path);
    return slot.presence === "present" || isSemanticResourceLimit(slot.value)
        ? slot.value
        : {
            status: "unknown",
            reason: `Own property ${path.join("/")} is ${slot.presence}.`,
        };
};
const provenanceForBinding = (binding, context) => {
    recordBindingDependency(binding, context);
    const cycleHead = context.bindings.get(binding.bindingId);
    if (cycleHead !== undefined) {
        context.dependence.lowest = Math.min(context.dependence.lowest, cycleHead);
        return semanticUnresolvedProvenance("cycle", `Alias cycle at ${binding.name}.`);
    }
    let depths = context.memo.provenance.get(binding.bindingId);
    const prior = readMemoizedEvaluation(depths?.get(context.expressionDepth), context);
    if (prior !== undefined)
        return prior;
    const position = context.bindings.size;
    const callerDependence = context.dependence.lowest;
    context.dependence.lowest = CALLER_INDEPENDENT;
    let result;
    let callerIndependent = false;
    try {
        result = collectEvaluationDependencies(binding, context, () => provenanceForBindingUncached(binding, context));
        callerIndependent = context.dependence.lowest > position;
    }
    finally {
        context.dependence.lowest = callerIndependent
            ? callerDependence
            : Math.min(callerDependence, context.dependence.lowest);
    }
    if (callerIndependent) {
        if (depths === undefined) {
            depths = new Map();
            context.memo.provenance.set(binding.bindingId, depths);
        }
        depths.set(context.expressionDepth, result);
    }
    return result.value;
};
const provenanceForBindingUncached = (binding, context) => {
    const provenance = provenanceForBindingValue(binding, context);
    const assigned = binding.definitions.some(({ kind }) => kind === "assignment");
    const conditionallyInitialized = binding.initializers.some(({ node }) => context.state.conditionallySkippedExpressions.has(node));
    if (provenance.status !== "module" ||
        (!assigned && !conditionallyInitialized))
        return provenance;
    return semanticAmbiguousProvenance(provenance.origins, assigned
        ? `Binding ${binding.name} may be reassigned.`
        : `Binding ${binding.name} may remain uninitialized.`);
};
const provenanceForBindingValue = (binding, context) => {
    const provenance = provenanceForBindingInitializers(binding, context);
    if (!binding.referenceInitializers.some(({ assignment }) => assignment))
        return provenance;
    // Projected replacements are retained reference sources, not evidence of a
    // local value or an unchanged earlier module. Apply this only to the selected
    // read snapshot so a later replacement does not erase captured origins.
    if (provenance.status === "local")
        return semanticUnresolvedProvenance("unknown", `Binding ${binding.name} has projected reference assignments whose module provenance is unresolved.`);
    return provenance.status === "module"
        ? semanticAmbiguousProvenance(provenance.origins, `Binding ${binding.name} has projected reference assignments that may replace its module origin.`)
        : provenance;
};
const provenanceForBindingInitializers = (binding, context) => {
    if (binding.kind === "parameter" || binding.kind === "catch")
        return semanticUnresolvedProvenance("unknown", binding.kind === "parameter"
            ? "Parameter provenance depends on caller arguments."
            : "Catch binding provenance depends on the thrown value.");
    if (binding.directOrigins.length > 0)
        return semanticOriginsProvenance(binding.directOrigins);
    if (binding.initializers.length === 0)
        return semanticLocalProvenance();
    if (binding.initializers.length > 1)
        return semanticAmbiguousProvenance([], `Binding ${binding.name} has multiple possible assignments.`);
    const initializer = binding.initializers[0];
    if (initializer === undefined)
        return semanticUnresolvedProvenance("unknown", "Missing binding initializer.");
    if (initializer.projection.includes(null))
        return semanticUnresolvedProvenance("unknown", "Dynamic provenance projection.");
    context.bindings.set(binding.bindingId, context.bindings.size);
    let resolved;
    try {
        resolved = provenanceForExpression(initializer.node, nestedContext(context));
    }
    finally {
        context.bindings.delete(binding.bindingId);
    }
    if (resolved.status !== "module" || initializer.projection.length === 0)
        return resolved;
    return semanticOriginsProvenance(resolved.origins.map((origin) => ({
        ...origin,
        importedPath: [
            ...origin.importedPath,
            ...initializer.projection.map((segment) => String(segment)),
        ],
    })));
};
const provenanceForExpression = (node, context) => {
    if (context.expressionDepth > SEMANTIC_EXPRESSION_DEPTH_LIMIT) {
        context.dependence.lowest = EVERY_CALLER;
        context.state.valueResourceLimits.add("expression-depth");
        return semanticUnresolvedProvenance("unknown", semanticResourceLimitReason("expression-depth"));
    }
    const unwrapped = unwrapJavaScriptExpression(node);
    if (unwrapped.depth > 0) {
        if (context.expressionDepth + unwrapped.depth >
            SEMANTIC_EXPRESSION_DEPTH_LIMIT) {
            context.dependence.lowest = EVERY_CALLER;
            context.state.valueResourceLimits.add("expression-depth");
            return semanticUnresolvedProvenance("unknown", semanticResourceLimitReason("expression-depth"));
        }
        return provenanceForExpression(unwrapped.node, {
            ...context,
            expressionDepth: context.expressionDepth + unwrapped.depth,
        });
    }
    const required = semanticRequireOrigin(node, context.state);
    if (required !== undefined)
        return semanticOriginsProvenance([required.origin]);
    if (t.isSequenceExpression(node)) {
        const finalExpression = node.expressions.at(-1);
        return finalExpression === undefined
            ? semanticUnresolvedProvenance("unknown", "Empty sequence expression.")
            : provenanceForExpression(finalExpression, nestedContext(context));
    }
    if (t.isAssignmentExpression(node) && node.operator === "=")
        return provenanceForExpression(node.right, nestedContext(context));
    if (t.isIdentifier(node)) {
        const binding = resolveSemanticBindingState(context.state, node, node.name);
        return binding === undefined
            ? semanticUnresolvedProvenance("unknown", `Unbound identifier ${node.name}.`)
            : provenanceForBindingAtRead(binding, node, nestedContext(context));
    }
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        const members = [];
        let current = node;
        while (t.isMemberExpression(current) ||
            t.isOptionalMemberExpression(current)) {
            if (!t.isNode(current.object))
                return semanticUnresolvedProvenance("unknown", "Unsupported member base.");
            const member = semanticStaticPropertyKey(current.property, current.computed);
            if (member === null)
                return semanticUnresolvedProvenance("unknown", "Dynamic provenance member.");
            members.push(member);
            current = current.object;
        }
        const base = provenanceForExpression(current, nestedContext(context));
        const path = members.reverse();
        return base.status !== "module"
            ? base
            : semanticOriginsProvenance(base.origins.map((origin) => ({
                ...origin,
                importedPath: [...origin.importedPath, ...path],
            })));
    }
    if (t.isConditionalExpression(node) || t.isLogicalExpression(node)) {
        const candidates = semanticSelectedBranches(node, context).map((branch) => provenanceForExpression(branch, nestedContext(context)));
        const origins = uniqueSemanticOrigins(candidates.flatMap((candidate) => candidate.origins));
        const allModuleOrigins = candidates.every(({ status }) => status === "module");
        if (allModuleOrigins && origins.length === 1)
            return semanticOriginsProvenance(origins);
        return origins.length > 0
            ? semanticAmbiguousProvenance(origins, allModuleOrigins
                ? "Multiple module origins."
                : "Conditional provenance includes a non-module alternative.")
            : semanticUnresolvedProvenance("unknown", "Conditional provenance is unresolved.");
    }
    if (isLocallyCreatedValue(node))
        return semanticLocalProvenance();
    return semanticUnresolvedProvenance("unknown", `Unsupported ${node.type} provenance.`);
};
/** Resolve an alias from the value visible at this read, before later rebinds. */
const provenanceForBindingAtRead = (binding, read, context) => {
    if (semanticOpaqueBindingReadMayHaveChanged(binding, read, context.state))
        return semanticAmbiguousProvenance(provenanceForBinding(binding, context).origins, "Direct eval may have changed this runtime value.");
    const { binding: snapshot } = semanticBindingAtRead(binding, read, context.state.parentsByNode);
    if (snapshot === binding)
        return provenanceForBinding(binding, context);
    if (context.bindings.has(binding.bindingId))
        return semanticUnresolvedProvenance("cycle", `Alias cycle at ${binding.name}.`);
    context.bindings.set(binding.bindingId, context.bindings.size);
    try {
        return provenanceForBindingValue(snapshot, context);
    }
    finally {
        context.bindings.delete(binding.bindingId);
    }
};
const isLocallyCreatedValue = (node) => readExactJavaScriptLiteral(node).found ||
    t.isObjectExpression(node) ||
    t.isArrayExpression(node) ||
    t.isFunctionExpression(node) ||
    t.isFunctionDeclaration(node) ||
    t.isArrowFunctionExpression(node) ||
    t.isClassExpression(node) ||
    t.isClassDeclaration(node) ||
    t.isTemplateLiteral(node) ||
    t.isUnaryExpression(node) ||
    t.isBinaryExpression(node) ||
    t.isUpdateExpression(node);
const mergeValues = (values) => {
    const resourceLimit = values.find(isSemanticResourceLimit);
    if (resourceLimit !== undefined)
        return resourceLimit;
    const primitives = values.flatMap((value) => primitiveCandidates(value) ?? []);
    const merged = values.every((value) => value.status === "union" || value.status === "literal")
        ? primitiveSet(primitives)
        : { status: "ambiguous", reason: "Branches have incompatible values." };
    if (values.length > 0 && values.every(semanticValueDefinitelyDefined))
        definitelyDefinedValues.add(merged);
    return merged;
};
const nestedContext = (context) => ({
    state: context.state,
    primitiveBindingValues: context.primitiveBindingValues,
    ...(context.capturePoint === undefined
        ? {}
        : { capturePoint: context.capturePoint }),
    expressionDepth: context.expressionDepth + 1,
    bindings: context.bindings,
    dependence: context.dependence,
    memo: context.memo,
});
const isPrimitive = (value) => value.status === "literal" || value.status === "union";
/** Capturing cannot restore an exhausted expression-depth budget. */
const canCapturePrimitive = (value) => !isPrimitive(value) &&
    !(isSemanticResourceLimit(value) && value.resourceLimit === "expression-depth");
const primitiveCaptureContext = (node, context) => {
    if (t.isObjectExpression(node) || t.isArrayExpression(node))
        return undefined;
    return captureContextAt(node, context);
};
const captureContextAt = (node, context) => {
    if (context.capturePoint !== undefined ||
        semanticCapturePosition(node, context.state.parentsByNode) === null)
        return undefined;
    let captures = capturedBindingValuesByState.get(context.state);
    if (captures === undefined) {
        captures = new WeakMap();
        capturedBindingValuesByState.set(context.state, captures);
    }
    let values = captures.get(node);
    if (values === undefined) {
        values = new Map();
        captures.set(node, values);
    }
    return { ...context, capturePoint: node, primitiveBindingValues: values };
};
const evaluateCapturedExpression = (node, context) => {
    // A literal field captures its primitive at construction, even when its
    // containing object is subsequently read at another capture point.
    let values = primitiveExpressionValuesByState.get(context.state);
    const cached = values?.get(node);
    if (cached !== undefined)
        return cached;
    let value = evaluateExpression(node, context);
    if (canCapturePrimitive(value)) {
        const captureContext = primitiveCaptureContext(node, context);
        if (captureContext !== undefined) {
            const captured = evaluateExpression(node, captureContext);
            if (isPrimitive(captured))
                value = captured;
        }
    }
    // Never publish values evaluated at somebody else's capture point. Like
    // binding caches, these entries are discarded whenever effects change.
    if (context.capturePoint === undefined && isPrimitive(value)) {
        if (values === undefined) {
            values = new WeakMap();
            primitiveExpressionValuesByState.set(context.state, values);
        }
        values.set(node, value);
    }
    return value;
};
