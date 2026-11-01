import * as t from "@babel/types";
import { delayedInstanceFieldValue, semanticComputedMethodKey, semanticBranchMayBeSkipped, semanticIterationCardinality, } from "./javascriptSemanticEvaluationOrder.js";
import { semanticStaticPropertyKey, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { semanticScopeId } from "./javascriptSemanticState.js";
const initializerPositionCaches = new WeakMap();
const initializerPositionCache = (parents) => {
    const cached = initializerPositionCaches.get(parents);
    if (cached !== undefined)
        return cached;
    const created = {
        direct: new WeakMap(),
        mutation: new WeakMap(),
        reference: new WeakMap(),
        read: new WeakMap(),
        evaluationChildren: new WeakMap(),
        expressionAncestry: undefined,
    };
    initializerPositionCaches.set(parents, created);
    return created;
};
const statementPosition = (statement, parents, declarator) => {
    const directParent = parents.get(statement);
    const enclosing = (t.isExportNamedDeclaration(directParent) ||
        t.isExportDefaultDeclaration(directParent)) &&
        directParent.declaration === statement
        ? directParent
        : statement;
    const parent = parents.get(enclosing);
    if (!t.isProgram(parent) && !t.isBlockStatement(parent))
        return null;
    const index = parent.body.indexOf(enclosing);
    return index < 0
        ? null
        : {
            body: parent.body,
            index,
            declaratorIndex: t.isVariableDeclaration(statement) && declarator !== undefined
                ? statement.declarations.indexOf(declarator)
                : -1,
        };
};
const positionPrecedes = (left, right) => left.body === right.body &&
    (left.index < right.index ||
        (left.index === right.index &&
            left.declaratorIndex >= 0 &&
            left.declaratorIndex < right.declaratorIndex));
/** Order effects only in a non-repeating top-level activation. */
export const semanticTopLevelEffectFollowsCapture = (capture, effect, parents) => {
    const position = (node) => {
        let selected = null;
        let declarator;
        let child;
        while (node !== undefined) {
            if (t.isFunction(node) || t.isLoop(node))
                return null;
            if (delayedInstanceFieldValue(node, child))
                return null;
            if (t.isVariableDeclarator(node))
                declarator = node;
            if (t.isStatement(node)) {
                const enclosing = statementPosition(node, parents, declarator);
                if (enclosing !== null)
                    selected = enclosing;
            }
            if (t.isProgram(node))
                return selected;
            child = node;
            node = parents.get(node);
        }
        return null;
    };
    const before = position(capture);
    const after = position(effect);
    if (before === null || after === null)
        return false;
    if (positionPrecedes(before, after))
        return true;
    if (before.body !== after.body ||
        before.index !== after.index ||
        before.declaratorIndex !== after.declaratorIndex)
        return false;
    return expressionEvaluationOrder(capture, effect, parents) === "before";
};
const scopeExitMarkers = new WeakMap();
const scopeExitOwners = new WeakMap();
/** A derived scope-end effect keeps disposal separate from initializer evaluation. */
export const semanticScopeExitEffect = (scope) => {
    const cached = scopeExitMarkers.get(scope);
    if (cached !== undefined)
        return cached;
    const marker = t.emptyStatement();
    if (scope.end !== undefined) {
        marker.start = scope.end;
        marker.end = scope.end;
    }
    if (scope.loc != null)
        marker.loc = { ...scope.loc, start: scope.loc.end, end: scope.loc.end };
    scopeExitMarkers.set(scope, marker);
    scopeExitOwners.set(marker, scope);
    return marker;
};
const withinScopeExit = (reference, scope, parents) => {
    for (let node = reference; node !== undefined; node = parents.get(node)) {
        if (node === scope) {
            for (let owner = parents.get(scope); owner !== undefined; owner = parents.get(owner)) {
                if (t.isLoop(owner))
                    return false;
                if (t.isFunction(owner))
                    break;
            }
            return !t.isLoop(scope);
        }
        if (t.isFunction(node) || t.isLoop(node))
            return false;
    }
    return false;
};
/** Include expression order when a write operation contains the read site. */
export const semanticEffectFollowsReference = (reference, effect, parents) => {
    if (reference === effect)
        return false;
    const exit = effect === undefined ? undefined : scopeExitOwners.get(effect);
    if (exit !== undefined) {
        if (withinScopeExit(reference, exit, parents))
            return true;
        effect = exit;
    }
    let current = reference;
    let child;
    while (current !== undefined && current !== effect) {
        if (t.isFunction(current))
            break;
        child = current;
        current = parents.get(current);
    }
    const loopInput = (t.isForInStatement(effect) || t.isForOfStatement(effect)) &&
        child === effect.right;
    let once = current;
    child = undefined;
    while (once !== undefined) {
        const initialLoopInput = (t.isForStatement(once) && child === once.init) ||
            ((t.isForInStatement(once) || t.isForOfStatement(once)) &&
                child === once.right) ||
            (once === effect && loopInput);
        if (t.isFunction(once) ||
            (t.isLoop(once) && !initialLoopInput) ||
            delayedInstanceFieldValue(once, child))
            break;
        child = once;
        once = parents.get(once);
    }
    return ((current === effect &&
        once === undefined &&
        (t.isAssignmentExpression(effect) ||
            t.isUpdateExpression(effect) ||
            t.isVariableDeclarator(effect) ||
            t.isCallExpression(effect) ||
            t.isOptionalCallExpression(effect) ||
            t.isNewExpression(effect))) ||
        (current === effect && once === undefined && loopInput) ||
        semanticTopLevelEffectFollowsCapture(reference, effect, parents));
};
export const semanticEffectTiming = (site, effect, state) => {
    if (effect === undefined)
        return "unknown";
    const exit = scopeExitOwners.get(effect);
    if (exit !== undefined) {
        if (withinScopeExit(site, exit, state.parentsByNode))
            return "after";
        effect = exit;
    }
    // Invocation receives arguments after their values have been selected.
    if (site === effect &&
        (t.isCallExpression(site) ||
            t.isOptionalCallExpression(site) ||
            t.isNewExpression(site)))
        return "after";
    const loop = semanticEnclosingIteration(effect, state);
    if (loop !== undefined) {
        const cardinality = semanticIterationCardinality(loop, state.prototypeEnumerationMayAffect);
        if (cardinality === "empty")
            return "after";
        if (cardinality === "nonempty") {
            const loopParent = state.parentsByNode.get(loop);
            const crossesFunction = (node) => {
                let current = node;
                while (current !== undefined) {
                    if (t.isFunction(current))
                        return true;
                    current = state.parentsByNode.get(current);
                }
                return false;
            };
            if (loopParent === state.program &&
                !crossesFunction(site) &&
                typeof loop.start === "number" &&
                typeof loop.end === "number" &&
                typeof site.start === "number") {
                if (site.start > loop.end)
                    return "before";
                if (site.start < loop.start)
                    return "after";
            }
        }
    }
    if (semanticEffectFollowsReference(site, effect, state.parentsByNode))
        return "after";
    if (semanticEffectFollowsReference(effect, site, state.parentsByNode))
        return "before";
    return "unknown";
};
const semanticEnclosingIteration = (node, state) => {
    let current = node;
    while (current !== undefined) {
        if (t.isForInStatement(current) || t.isForOfStatement(current))
            return current;
        if (t.isFunction(current))
            return undefined;
        current = state.parentsByNode.get(current);
    }
    return undefined;
};
/** Memoize descendant paths toward the currently compared source expression. */
const expressionSiblings = (earlier, later, parents) => {
    const cache = initializerPositionCache(parents);
    let context = cache.expressionAncestry;
    if (context?.source !== earlier) {
        const ancestors = new Map();
        let child;
        for (let node = earlier; node !== undefined; node = parents.get(node)) {
            ancestors.set(node, child);
            child = node;
        }
        context = { source: earlier, ancestors, siblings: new WeakMap() };
        cache.expressionAncestry = context;
    }
    const path = [];
    let result = null;
    for (let node = later; node !== undefined; node = parents.get(node)) {
        if (context.ancestors.has(node)) {
            const sourceChild = context.ancestors.get(node);
            const readChild = path.at(-1);
            if (sourceChild !== undefined && readChild !== undefined)
                result = { common: node, earlier: sourceChild, later: readChild };
            break;
        }
        const cached = context.siblings.get(node);
        if (cached !== undefined) {
            result = cached;
            break;
        }
        path.push(node);
    }
    for (const node of path)
        context.siblings.set(node, result);
    return result;
};
/** Index existing child arrays once; wide literals/calls need no repeated copies. */
const expressionChildIndices = (node, parents) => {
    const cache = initializerPositionCache(parents).evaluationChildren;
    const cached = cache.get(node);
    if (cached !== undefined)
        return cached;
    const children = (() => {
        if (t.isSequenceExpression(node))
            return node.expressions;
        if (t.isArrayExpression(node))
            return node.elements;
        if (t.isObjectExpression(node))
            return node.properties;
        if (t.isObjectProperty(node))
            return node.computed ? [node.key, node.value] : [node.value];
        if (t.isCallExpression(node) ||
            t.isOptionalCallExpression(node) ||
            t.isNewExpression(node))
            return node.arguments;
        if (t.isBinaryExpression(node) || t.isLogicalExpression(node))
            return [node.left, node.right];
        if (t.isConditionalExpression(node))
            return [node.test];
        return null;
    })();
    if (children === null) {
        cache.set(node, null);
        return null;
    }
    const indices = new Map();
    let index = 0;
    if (t.isCallExpression(node) ||
        t.isOptionalCallExpression(node) ||
        t.isNewExpression(node))
        indices.set(node.callee, index++);
    for (const child of children) {
        if (child !== null)
            indices.set(child, index);
        index++;
    }
    cache.set(node, indices);
    return indices;
};
/** Unproved ordering stays distinct from proof that a write follows the read. */
const expressionEvaluationOrder = (earlier, later, parents) => {
    if (later === undefined)
        return "unresolved";
    const siblings = expressionSiblings(earlier, later, parents);
    if (siblings === null)
        return "unresolved";
    const children = expressionChildIndices(siblings.common, parents);
    const earlierIndex = children?.get(siblings.earlier);
    const laterIndex = children?.get(siblings.later);
    if (earlierIndex === undefined ||
        laterIndex === undefined ||
        earlierIndex === laterIndex)
        return "unresolved";
    return earlierIndex < laterIndex ? "before" : "after";
};
const computeDirectInitializerPosition = (node, parents) => {
    if (t.isClassDeclaration(node) && node.id !== null)
        return statementPosition(node, parents);
    if ((t.isAssignmentExpression(node) &&
        t.isIdentifier(unwrapJavaScriptExpression(node.left).node)) ||
        t.isUpdateExpression(node))
        return directMutationPosition(node, parents);
    const parent = parents.get(node);
    if (t.isVariableDeclarator(parent) && parent.init === node) {
        const declaration = parents.get(parent);
        return t.isVariableDeclaration(declaration)
            ? statementPosition(declaration, parents, parent)
            : null;
    }
    if (t.isAssignmentExpression(parent) &&
        parent.right === node &&
        t.isIdentifier(parent.left)) {
        return directMutationPosition(parent, parents);
    }
    return null;
};
const directInitializerPosition = (node, parents) => {
    const cache = initializerPositionCache(parents);
    const cached = cache.direct.get(node);
    if (cached !== undefined)
        return cached;
    const computed = computeDirectInitializerPosition(node, parents);
    cache.direct.set(node, computed);
    return computed;
};
const computeDirectMutationPosition = (node, parents) => {
    if (t.isForOfStatement(node))
        return statementPosition(node, parents);
    if (t.isVariableDeclarator(node)) {
        const declaration = parents.get(node);
        return t.isVariableDeclaration(declaration)
            ? statementPosition(declaration, parents, node)
            : null;
    }
    if (t.isSpreadElement(node)) {
        const array = parents.get(node);
        return t.isArrayExpression(array)
            ? semanticCapturePosition(array, parents)
            : null;
    }
    if (!t.isAssignmentExpression(node) &&
        !t.isUpdateExpression(node) &&
        !t.isUnaryExpression(node, { operator: "delete" }) &&
        !t.isCallExpression(node) &&
        !t.isOptionalCallExpression(node) &&
        !t.isNewExpression(node) &&
        !t.isTaggedTemplateExpression(node))
        return null;
    let current = node;
    while (true) {
        const parent = parents.get(current);
        if (parent === undefined ||
            t.isFunction(parent) ||
            semanticBranchMayBeSkipped(parent, current))
            return null;
        if (t.isStatement(parent))
            return statementPosition(parent, parents);
        if (t.isVariableDeclarator(parent)) {
            const declaration = parents.get(parent);
            return t.isVariableDeclaration(declaration)
                ? statementPosition(declaration, parents, parent)
                : null;
        }
        current = parent;
    }
};
const directMutationPosition = (node, parents) => {
    const cache = initializerPositionCache(parents);
    const cached = cache.mutation.get(node);
    if (cached !== undefined)
        return cached;
    const computed = computeDirectMutationPosition(node, parents);
    cache.mutation.set(node, computed);
    return computed;
};
/** Prove that an unconditional member replacement precedes this read. */
export const semanticDefiniteEffectPrecedesReference = (effect, reference, parents) => {
    const before = directMutationPosition(effect, parents);
    const after = bindingReadPosition(reference, parents);
    if (before === null || after.position === null || after.repeatingLoop)
        return false;
    if (positionPrecedes(before, after.position))
        return true;
    return (before.body === after.position.body &&
        before.index === after.position.index &&
        before.declaratorIndex === after.position.declaratorIndex &&
        expressionEvaluationOrder(effect, reference, parents) === "before");
};
/** Order a selected value before a later effect in this non-repeating body. */
export const semanticReadPrecedesEffectWithinActivation = (read, effect, parents) => {
    const before = bindingReadPosition(read, parents);
    const after = directMutationPosition(effect, parents);
    if (before.position === null || before.repeatingLoop || after === null)
        return false;
    if (positionPrecedes(before.position, after))
        return true;
    return (before.position.body === after.body &&
        before.position.index === after.index &&
        before.position.declaratorIndex === after.declaratorIndex &&
        expressionEvaluationOrder(read, effect, parents) === "before");
};
/** Order straight-line source effects in one activation, preserving deferred/repeating unknowns. */
export const semanticEffectTimingWithinActivation = (site, effect, state) => {
    if (effect !== undefined) {
        if (semanticDefiniteEffectPrecedesReference(site, effect, state.parentsByNode))
            return "after";
        if (semanticDefiniteEffectPrecedesReference(effect, site, state.parentsByNode))
            return "before";
    }
    return semanticEffectTiming(site, effect, state);
};
const computeReferenceInitializerPosition = (node, parents) => {
    // Defaults live inside the declaration pattern rather than its initializer.
    let current = node;
    while (true) {
        const direct = directInitializerPosition(current, parents);
        if (direct !== null)
            return direct;
        const parent = parents.get(current);
        if (t.isAssignmentExpression(parent, { operator: "=" }) &&
            (t.isObjectPattern(parent.left) || t.isArrayPattern(parent.left)))
            return directMutationPosition(parent, parents);
        if (t.isFunction(parent))
            return t.isBlockStatement(parent.body)
                ? { body: parent.body.body, index: -1, declaratorIndex: -1 }
                : null;
        if (parent === undefined ||
            t.isStatement(parent) ||
            delayedInstanceFieldValue(parent, current))
            return null;
        if (t.isVariableDeclarator(parent)) {
            const declaration = parents.get(parent);
            return t.isVariableDeclaration(declaration)
                ? statementPosition(declaration, parents, parent)
                : null;
        }
        current = parent;
    }
};
const referenceInitializerPosition = (node, parents) => {
    const cache = initializerPositionCache(parents);
    const cached = cache.reference.get(node);
    if (cached !== undefined)
        return cached;
    const computed = computeReferenceInitializerPosition(node, parents);
    cache.reference.set(node, computed);
    return computed;
};
/** Parameter-to-body copies and ordinary expressions share one position owner. */
const initializerPosition = (initializer, parents, reference = false) => {
    if (initializer.entryBody !== undefined)
        return { body: initializer.entryBody.body, index: -1, declaratorIndex: -1 };
    return reference
        ? referenceInitializerPosition(initializer.node, parents)
        : directInitializerPosition(initializer.node, parents);
};
/** Resolve origins at their use or capture, never at a later transitive effect. */
export const semanticMutationInitializers = (binding, mutation, parents) => {
    const mutationPosition = directMutationPosition(mutation, parents) ??
        referenceInitializerPosition(mutation, parents);
    if (mutationPosition === null)
        return binding;
    const origins = [
        ...binding.initializers.map((initializer) => ({
            initializer,
            position: initializerPosition(initializer, parents),
        })),
        ...binding.referenceInitializers.map((initializer) => ({
            initializer,
            position: initializerPosition(initializer, parents, true),
        })),
    ];
    if (origins.some(({ position }) => position === null || !positionPrecedes(position, mutationPosition)))
        return binding;
    const { retained, replacesEntry } = retainedInitializerOrigins(origins, binding, parents);
    return {
        // A proven earlier assignment replaces even an import-equals value. A
        // capture before or inside an uncertain assignment retains the full binding.
        directOrigins: replacesEntry ? [] : binding.directOrigins,
        initializers: binding.initializers.filter((initializer) => retained.has(initializer)),
        referenceInitializers: binding.referenceInitializers.filter((initializer) => retained.has(initializer)),
    };
};
/** Reuse immutable ancestry facts across reads nested in the same expression. */
const bindingReadPosition = (read, parents) => {
    const cache = initializerPositionCache(parents).read;
    const path = [];
    let current = read;
    let result;
    while (true) {
        const cached = cache.get(current);
        if (cached !== undefined) {
            result = cached;
            break;
        }
        path.push(current);
        const parent = parents.get(current);
        if (t.isLoop(parent)) {
            result = { position: null, repeatingLoop: parent };
            break;
        }
        if (parent === undefined ||
            (t.isFunction(parent) && !semanticComputedMethodKey(parent, current)) ||
            delayedInstanceFieldValue(parent, current)) {
            result = { position: null, repeatingLoop: undefined };
            break;
        }
        current = parent;
    }
    for (let index = path.length - 1; index >= 0; index--) {
        const node = path[index];
        if (node === undefined)
            continue;
        const parent = parents.get(node);
        let position = null;
        if (t.isVariableDeclarator(parent)) {
            const declaration = parents.get(parent);
            if (t.isVariableDeclaration(declaration))
                position = statementPosition(declaration, parents, parent);
        }
        else if (t.isStatement(parent) &&
            !t.isLoop(parent) &&
            !t.isFunction(parent))
            position = statementPosition(parent, parents);
        if (position !== null && position !== result.position)
            result = { ...result, position };
        cache.set(node, result);
    }
    return result;
};
/** Repeated member reads share unknown ordering, while retaining their source sites. */
export const semanticCaptureOrderingIdentity = (capture, parents) => {
    // Calls can have a distinct invocation effect at their own selection site.
    if (!t.isMemberExpression(capture) && !t.isOptionalMemberExpression(capture))
        return capture;
    const loop = bindingReadPosition(capture, parents).repeatingLoop;
    if (loop === undefined)
        return capture;
    let child = capture;
    for (let parent = parents.get(child); parent !== undefined && parent !== loop; parent = parents.get(child))
        child = parent;
    // These inputs run once, before the repeating portion of the loop.
    if ((t.isForStatement(loop) && child === loop.init) ||
        ((t.isForInStatement(loop) || t.isForOfStatement(loop)) &&
            child === loop.right))
        return capture;
    return loop;
};
export const semanticBindingAtRead = (binding, read, parents) => {
    if (binding.initializers.length === 0 &&
        binding.referenceInitializers.length === 0)
        return { status: "ordered", binding, hasDefiniteInitializer: false };
    const [soleInitializer] = binding.initializers;
    if (binding.initializers.length === 1 &&
        binding.referenceInitializers.length === 0 &&
        binding.declarationKinds.size === 0 &&
        binding.definitions.length === 1 &&
        binding.definitions[0]?.kind === "function" &&
        soleInitializer !== undefined &&
        t.isFunctionDeclaration(soleInitializer.node))
        return { status: "ordered", binding, hasDefiniteInitializer: true };
    if (soleInitializer !== undefined &&
        t.isClass(soleInitializer.node) &&
        binding.scopeId === semanticScopeId("class", soleInitializer.node) &&
        !binding.mutable &&
        binding.initializers.length === 1 &&
        binding.referenceInitializers.length === 0 &&
        !binding.definitions.some(({ kind }) => kind === "assignment")) {
        // The class self name is initialized before fields/static blocks run and
        // before a body method can be invoked, but not during heritage/key evaluation.
        const owner = soleInitializer.node;
        let child = read;
        let memberPart;
        for (let parent = parents.get(child); parent !== undefined; child = parent, parent = parents.get(parent)) {
            if (parents.get(parent) === owner.body)
                memberPart = child;
            if (parent === owner.body) {
                if (t.isClassMethod(child) || t.isClassPrivateMethod(child)
                    ? memberPart === child.body
                    : t.isStaticBlock(child) ||
                        ((t.isClassProperty(child) ||
                            t.isClassPrivateProperty(child) ||
                            t.isClassAccessorProperty(child)) &&
                            memberPart === child.value))
                    return { status: "ordered", binding, hasDefiniteInitializer: true };
                break;
            }
            if (parent === owner)
                break;
        }
    }
    const initializer = binding.initializers[0];
    const reference = binding.referenceInitializers[0];
    const origin = initializer ?? reference;
    const sourcePosition = initializer === undefined
        ? reference === undefined
            ? null
            : initializerPosition(reference, parents, true)
        : initializerPosition(initializer, parents);
    const { position, repeatingLoop } = bindingReadPosition(read, parents);
    // Coverage and latest-value selection are independent. A preceding write
    // can cover entry even when another write's order remains unknown.
    const hasDefiniteInitializer = position !== null &&
        [
            ...binding.initializers,
            ...binding.referenceInitializers.filter(({ assignment }) => assignment),
        ].some((initializer) => {
            const source = initializerPosition(initializer, parents, binding.referenceInitializers.includes(initializer));
            return (source !== null &&
                positionPrecedes(source, position) &&
                !initializerMayRetainEntry(initializer, binding, parents));
        });
    if (!repeatingLoop &&
        origin !== undefined &&
        binding.initializers.length + binding.referenceInitializers.length === 1 &&
        sourcePosition !== null &&
        position !== null &&
        positionPrecedes(sourcePosition, position))
        return {
            status: "ordered",
            binding,
            hasDefiniteInitializer,
        };
    const uncertainOrder = repeatingLoop ||
        sourcePosition === null ||
        position === null ||
        sourcePosition.body !== position.body;
    if (uncertainOrder)
        return { status: "unresolved", binding, hasDefiniteInitializer };
    const selected = selectInitializers(binding, position, read, parents);
    if (selected === undefined)
        return { status: "unresolved", binding, hasDefiniteInitializer };
    if (selected.binding === binding)
        return {
            status: "ordered",
            binding,
            hasDefiniteInitializer: hasDefiniteInitializer || selected.hasDefiniteInitializer,
        };
    return {
        status: "ordered",
        hasDefiniteInitializer: hasDefiniteInitializer || selected.hasDefiniteInitializer,
        binding: {
            ...binding,
            ...selected.binding,
            // Later assignment definitions do not describe the value captured here.
            definitions: binding.definitions.filter(({ kind }) => kind !== "assignment"),
        },
    };
};
const selectInitializers = (binding, position, read, parents) => {
    if (position === null)
        return undefined;
    const origins = [
        ...binding.initializers.map((initializer) => ({
            initializer,
            position: initializerPosition(initializer, parents),
        })),
        ...binding.referenceInitializers.map((initializer) => ({
            initializer,
            position: initializerPosition(initializer, parents, true),
        })),
    ];
    const preceding = [];
    for (const origin of origins) {
        const source = origin.position;
        if (source === null || source.body !== position.body)
            return undefined;
        if (positionPrecedes(source, position))
            preceding.push(origin);
        else if (!positionPrecedes(position, source)) {
            if (source.index !== position.index ||
                source.declaratorIndex !== position.declaratorIndex)
                return undefined;
            const order = expressionEvaluationOrder(origin.initializer.node, read, parents);
            // Failure to prove precedence is not proof that the write happens later.
            if (order === "unresolved")
                return undefined;
            if (order === "before")
                preceding.push(origin);
        }
    }
    const { retained, replacesEntry } = retainedInitializerOrigins(preceding, binding, parents);
    // Preserve the owner's identity when selection removes no facts. Consumers
    // can then reuse the binding's dependency-aware provenance memo rather than
    // treating every equivalent read as a new temporal snapshot.
    if (binding.initializers.every((initializer) => retained.has(initializer)) &&
        binding.referenceInitializers.every((initializer) => retained.has(initializer)))
        return { binding, hasDefiniteInitializer: replacesEntry };
    return {
        hasDefiniteInitializer: replacesEntry,
        binding: {
            initializers: binding.initializers.filter((initializer) => retained.has(initializer)),
            referenceInitializers: binding.referenceInitializers.filter((initializer) => retained.has(initializer)),
        },
    };
};
/** Logical writes may keep prior aliases. An RHS fact alone does not prove an
 * empty local: the complete binding must exclude incoming/default/other writes.
 */
const initializerMayRetainEntry = (initializer, binding, parents) => {
    const node = initializer.node, parent = parents.get(node);
    const assignment = t.isAssignmentExpression(node)
        ? node
        : t.isAssignmentExpression(parent) && parent.right === node
            ? parent
            : undefined;
    if (assignment === undefined ||
        !["&&=", "||=", "??="].includes(assignment.operator))
        return false;
    const emptyLocal = node === assignment.right &&
        binding.kind === "variable" &&
        !binding.runtimeImport &&
        binding.initializers.length === 1 &&
        binding.initializers[0] === initializer &&
        binding.referenceInitializers.length === 0 &&
        binding.directOrigins.length === 0 &&
        binding.definitions.some(({ kind }) => kind === "variable") &&
        binding.definitions.every(({ kind }) => kind === "variable" || kind === "assignment");
    return !emptyLocal;
};
/** Certain writes replace prior origins; short-circuit writes retain both. */
const retainedInitializerOrigins = (origins, binding, parents) => {
    const latest = origins.reduce((latest, { initializer, position }) => position !== null &&
        !initializerMayRetainEntry(initializer, binding, parents) &&
        (latest === null || positionPrecedes(latest, position))
        ? position
        : latest, null);
    return {
        replacesEntry: latest !== null,
        retained: new Set(origins
            .filter(({ position }) => latest === null ||
            (position?.index === latest.index &&
                position?.declaratorIndex === latest.declaratorIndex) ||
            (position !== null && positionPrecedes(latest, position)))
            .map(({ initializer }) => initializer)),
    };
};
/** Locate an initializer or completed return-expression capture in its body. */
export const semanticCapturePosition = (node, parents) => {
    let current = node;
    while (true) {
        const direct = directInitializerPosition(current, parents);
        if (direct !== null)
            return direct;
        const parent = parents.get(current);
        if (t.isReturnStatement(parent) && parent.argument === current)
            return statementPosition(parent, parents);
        if (t.isObjectProperty(parent) &&
            parent.value === current &&
            semanticStaticPropertyKey(parent.key, parent.computed) !== null)
            current = parent;
        else if (t.isSpreadElement(parent) &&
            parent.argument === current &&
            t.isObjectExpression(parents.get(parent)))
            current = parent;
        else if (t.isObjectExpression(parent) || t.isArrayExpression(parent))
            current = parent;
        else
            return null;
    }
};
/** Intermediate values must themselves have been initialized before capture. */
export const semanticBindingPrecedesCapture = (binding, capture, parents) => {
    const initializer = binding.initializers[0];
    if (binding.initializers.length !== 1 || initializer === undefined)
        return false;
    const sourcePosition = initializerPosition(initializer, parents);
    const capturePosition = semanticCapturePosition(capture, parents);
    return (sourcePosition !== null &&
        capturePosition !== null &&
        positionPrecedes(sourcePosition, capturePosition));
};
/** A preceding initializer and capture in one body precede its later effect. */
export const semanticBindingEffectFollowsCapture = (binding, capture, effect, parents) => {
    if (!semanticBindingPrecedesCapture(binding, capture, parents))
        return false;
    const captured = semanticCapturePosition(capture, parents);
    const written = directMutationPosition(effect, parents);
    return (captured !== null && written !== null && positionPrecedes(captured, written));
};
/** A local declaration resets its lexical value before an ordinary member read. */
export const semanticBindingEffectFollowsRead = (binding, read, effect, parents) => {
    const initializer = binding.initializers[0];
    if (binding.initializers.length !== 1 || initializer === undefined)
        return false;
    const declaration = parents.get(initializer.node);
    // A logical/compound assignment may preserve a value from a prior call.
    if (!t.isVariableDeclarator(declaration) ||
        declaration.init !== initializer.node)
        return false;
    const initialized = initializerPosition(initializer, parents);
    const selected = bindingReadPosition(read, parents).position;
    return (initialized !== null &&
        selected !== null &&
        positionPrecedes(initialized, selected) &&
        semanticReadPrecedesEffectWithinActivation(read, effect, parents));
};
/** Ignore later escapes only while reading earlier references in one activation. */
export const semanticEscapeFollowsCapture = (binding, capture, escape, parents) => {
    const initializer = binding.initializers[0];
    if (escape === undefined ||
        initializer === undefined ||
        !semanticBindingPrecedesCapture(binding, capture, parents))
        return false;
    // A literal allocates here. Aliases are evaluated at the same capture point,
    // so an outer/persistent origin still receives all of its own escape effects.
    const origin = unwrapJavaScriptExpression(initializer.node).node;
    if (!t.isObjectExpression(origin) &&
        !t.isArrayExpression(origin) &&
        !t.isIdentifier(origin) &&
        !t.isMemberExpression(origin) &&
        !t.isOptionalMemberExpression(origin))
        return false;
    const capturePosition = semanticCapturePosition(capture, parents);
    const exit = scopeExitOwners.get(escape);
    if (exit !== undefined) {
        // Unlike a source-global ordering proof, this binding was initialized in
        // the captured body. Its later sibling scope exits follow this activation.
        const exitPosition = t.isStatement(exit)
            ? statementPosition(exit, parents)
            : null;
        return (withinScopeExit(capture, exit, parents) ||
            (capturePosition !== null &&
                exitPosition !== null &&
                positionPrecedes(capturePosition, exitPosition)));
    }
    const escapePosition = directMutationPosition(escape, parents);
    return (capturePosition !== null &&
        escapePosition !== null &&
        positionPrecedes(capturePosition, escapePosition));
};
