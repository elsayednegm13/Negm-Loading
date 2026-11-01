import * as t from "@babel/types";
import { isErasedJavaScriptDeclaration, isTypeOnlyExportDeclaration, isTypeOnlyExportSpecifier, isTypeOnlyImportDeclaration, isTypeOnlyImportSpecifier, } from "./javascriptModuleDeclaration.js";
/** Whether this child and its descendants contribute no JavaScript value. */
export const isErasedJavaScriptValueChild = (node, parent) => {
    if (isErasedJavaScriptDeclaration(node) ||
        t.isTSType(node) ||
        t.isTSTypeElement(node) ||
        t.isTSDeclareMethod(node) ||
        t.isTSTypeAnnotation(node) ||
        t.isTSTypeParameterDeclaration(node) ||
        t.isTSTypeParameterInstantiation(node) ||
        t.isTSClassImplements(node) ||
        t.isTSInterfaceHeritage(node) ||
        t.isTSInterfaceBody(node) ||
        (t.isImportDeclaration(node) && isTypeOnlyImportDeclaration(node)) ||
        ((t.isExportNamedDeclaration(node) || t.isExportAllDeclaration(node)) &&
            isTypeOnlyExportDeclaration(node)) ||
        (t.isImportSpecifier(node) && isTypeOnlyImportSpecifier(node)) ||
        (t.isExportSpecifier(node) && isTypeOnlyExportSpecifier(node)) ||
        (t.isTSImportEqualsDeclaration(node) && node.importKind === "type"))
        return true;
    // Undecorated declared or abstract fields erase their keys and annotations.
    // Decorators and a decorated field's computed key may execute at definition.
    return (t.isClassProperty(parent) &&
        (parent.declare === true || parent.abstract === true) &&
        !t.isDecorator(node) &&
        !(node === parent.key &&
            parent.computed === true &&
            (parent.decorators?.length ?? 0) > 0));
};
/**
 * Visit Babel AST nodes in deterministic source-tree order, excluding skipped subtrees.
 *
 * `readAncestors` returns a snapshot during `enter`, outermost-first and
 * ending with the direct parent. Callers
 * need it whenever meaning depends on where a node sits, not just what its
 * immediate parent is — a binding inside `catch ({message})` or `({a} = o)`
 * has an ObjectProperty parent, so the parent alone cannot say whether the
 * identifier declares a binding or is assigned to.
 */
export const traverseJavaScriptAst = (root, visitor) => completeSemanticSteps(traverseJavaScriptAstSteps(root, visitor));
/** Visit only syntax retained as JavaScript values after TypeScript erasure. */
export const traverseJavaScriptValueAst = (root, erasedSyntaxNodes, visitor) => completeSemanticSteps(traverseJavaScriptValueAstSteps(root, erasedSyntaxNodes, visitor));
/** Cooperative value-only view of the same deterministic AST traversal. */
export function* traverseJavaScriptValueAstSteps(root, erasedSyntaxNodes, visitor) {
    if (erasedSyntaxNodes.has(root))
        return;
    yield* traverseJavaScriptAstSteps(root, {
        ...visitor,
        skip: (node) => erasedSyntaxNodes.has(node) || visitor.skip?.(node) === true,
    });
}
/**
 * {@link traverseJavaScriptAst} with a yield every 1,024 visited nodes, so a
 * caller can serve control messages during one large traversal. Visit order
 * and callbacks are identical.
 */
export function* traverseJavaScriptAstSteps(root, visitor) {
    const ancestors = [];
    const enter = (node, parent) => {
        visitor.enter(node, parent, () => [...ancestors]);
        ancestors.push(node);
        return { node, parent, children: childNodes(node), nextIndex: 0 };
    };
    const pending = [enter(root, null)];
    let visited = 1;
    while (pending.length > 0) {
        const current = pending.at(-1);
        if (current === undefined)
            break;
        const child = current.children[current.nextIndex];
        if (child !== undefined) {
            current.nextIndex += 1;
            if (visited % 1024 === 0)
                yield;
            visited += 1;
            if (visitor.skip?.(child) === true)
                continue;
            pending.push(enter(child, current.node));
        }
        else {
            visitor.exit?.(current.node, current.parent);
            ancestors.pop();
            pending.pop();
        }
    }
}
/** Run cooperative analysis steps to completion without yielding control. */
export const completeSemanticSteps = (steps) => {
    for (;;) {
        const step = steps.next();
        if (step.done === true)
            return step.value;
    }
};
/**
 * Child Babel nodes in `VISITOR_KEYS` order. Single owner for AST child
 * expansion; bespoke `Object.values` / duplicated `childNodes` walkers must
 * not be reintroduced (they diverge on loc/comment fields and ordering).
 */
export const childNodes = (node) => {
    const keys = javaScriptAstChildKeys(node);
    const children = [];
    for (const key of keys) {
        const value = Reflect.get(node, key);
        if (t.isNode(value)) {
            children.push(value);
            continue;
        }
        if (!Array.isArray(value))
            continue;
        for (const item of value) {
            if (t.isNode(item))
                children.push(item);
        }
    }
    return children;
};
/** Child-bearing fields; shared by traversal and structural AST comparison. */
export const javaScriptAstChildKeys = (node) => t.VISITOR_KEYS[node.type] ?? [];
