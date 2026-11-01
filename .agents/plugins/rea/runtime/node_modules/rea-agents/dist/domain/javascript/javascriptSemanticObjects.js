import * as t from "@babel/types";
import { createSemanticCallableIdStack } from "./javascriptSemanticCallableStack.js";
import { semanticStaticPropertyKey, semanticWriteSiteReadsFirst, semanticWriteSiteTarget, semanticWriteTargets, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { resolveSemanticBindingState, } from "./javascriptSemanticState.js";
import { traverseJavaScriptValueAst } from "./javascriptSemanticTraversal.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
/** Recover bounded static property reads, writes, spreads, and destructuring. */
export const collectJavaScriptSemanticObjects = (program, state, callables) => {
    const output = [];
    const callableIds = new Set(callables.map(({ callableId }) => callableId));
    const callableStack = createSemanticCallableIdStack(callableIds);
    const context = {
        state,
        output,
        writeTargets: new Map(),
    };
    traverseJavaScriptValueAst(program, state.erasedSyntaxNodes, {
        enter: (node, parent) => {
            callableStack.enter(node, parent);
            const ownerCallableId = callableStack.callables.at(-1) ?? null;
            const writeTarget = semanticWriteSiteTarget(node);
            if (writeTarget !== null)
                for (const leaf of semanticWriteTargets(writeTarget))
                    if (!t.isIdentifier(leaf))
                        context.writeTargets.set(leaf, node);
            if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
                collectMember(node, parent, ownerCallableId, context);
            else if (t.isSpreadElement(node) &&
                parent !== null &&
                t.isObjectExpression(parent)) {
                const identity = expressionObjectIdentity(node.argument, state);
                addObjectOperation({
                    node,
                    kind: "spread",
                    ownerCallableId,
                    objectBindingId: identity.bindingId,
                    targetBindingId: null,
                    propertyPath: identity.path,
                }, state, output);
            }
            else if (t.isVariableDeclarator(node) &&
                (t.isObjectPattern(node.id) || t.isArrayPattern(node.id)))
                collectDestructuring(node.id, node.init, ownerCallableId, state, output);
            else if (t.isAssignmentExpression(node, { operator: "=" }) &&
                (t.isObjectPattern(node.left) || t.isArrayPattern(node.left)))
                collectDestructuring(node.left, node.right, ownerCallableId, state, output);
        },
        exit: (node) => callableStack.exit(node),
    });
    return output;
};
const collectMember = (node, parent, ownerCallableId, context) => {
    const { state, output } = context;
    // A chain is one property access; retaining every prefix duplicates work and
    // would make full paths quadratic in deeply nested producer expressions.
    if ((t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent)) &&
        parent.object === node)
        return;
    const identity = expressionObjectIdentity(node, state);
    const writeSite = context.writeTargets.get(node);
    context.writeTargets.delete(node);
    const write = writeSite !== undefined;
    const readsBeforeWrite = writeSite !== undefined && semanticWriteSiteReadsFirst(writeSite);
    if (readsBeforeWrite)
        addObjectOperation({
            node,
            kind: "read",
            ownerCallableId,
            objectBindingId: identity.bindingId,
            targetBindingId: null,
            propertyPath: identity.path,
        }, state, output);
    addObjectOperation({
        node,
        kind: write ? "write" : "read",
        ownerCallableId,
        objectBindingId: identity.bindingId,
        targetBindingId: null,
        propertyPath: identity.path,
    }, state, output);
};
const collectDestructuring = (root, initializer, ownerCallableId, state, output) => {
    const source = expressionObjectIdentity(initializer, state);
    const pending = [{ pattern: root, path: [] }];
    while (pending.length > 0) {
        const next = pending.pop();
        if (next === undefined)
            break;
        const { path } = next;
        const occurrence = unwrapJavaScriptExpression(next.pattern).node;
        const pattern = t.isAssignmentPattern(occurrence)
            ? unwrapJavaScriptExpression(occurrence.left).node
            : occurrence;
        if (t.isObjectPattern(pattern)) {
            for (const property of pattern.properties.toReversed()) {
                if (!t.isObjectProperty(property))
                    continue;
                const name = semanticStaticPropertyKey(property.key, property.computed);
                if (name !== null)
                    pending.push({ pattern: property.value, path: [...path, name] });
            }
            continue;
        }
        if (t.isArrayPattern(pattern)) {
            for (let index = pattern.elements.length - 1; index >= 0; index -= 1) {
                const element = pattern.elements[index];
                if (element !== null &&
                    element !== undefined &&
                    !t.isRestElement(element))
                    pending.push({ pattern: element, path: [...path, String(index)] });
            }
            continue;
        }
        if (!t.isIdentifier(pattern))
            continue;
        addObjectOperation({
            node: occurrence,
            kind: "destructure",
            ownerCallableId,
            objectBindingId: source.bindingId,
            targetBindingId: resolveSemanticBindingState(state, pattern, pattern.name)
                ?.bindingId ?? null,
            propertyPath: source.path === null ? null : [...source.path, ...path],
        }, state, output);
    }
};
const addObjectOperation = (input, state, output) => {
    output.push({
        // These high-volume IDs must not retain intermediate concatenations.
        objectOperationId: [
            "object",
            input.kind,
            String(input.node.start ?? -1),
            String(input.node.end ?? -1),
        ].join(":"),
        kind: input.kind,
        location: range(input.node),
        ownerCallableId: input.ownerCallableId,
        objectBindingId: input.objectBindingId,
        targetBindingId: input.targetBindingId,
        propertyPath: input.propertyPath,
        resolution: input.objectBindingId === null ||
            input.propertyPath === null ||
            (input.kind === "destructure" && input.targetBindingId === null)
            ? "partial"
            : "complete",
    });
};
const expressionObjectIdentity = (node, state) => {
    const path = [];
    let current = node;
    let staticPath = true;
    while (current !== null && current !== undefined) {
        current = unwrapJavaScriptExpression(current).node;
        if (t.isMemberExpression(current) ||
            t.isOptionalMemberExpression(current)) {
            const name = semanticStaticPropertyKey(current.property, current.computed);
            if (name === null)
                staticPath = false;
            else
                path.push(name);
            current = current.object;
        }
        else
            break;
    }
    return {
        bindingId: t.isIdentifier(current)
            ? (resolveSemanticBindingState(state, current, current.name)?.bindingId ??
                null)
            : null,
        path: staticPath ? path.reverse() : null,
    };
};
