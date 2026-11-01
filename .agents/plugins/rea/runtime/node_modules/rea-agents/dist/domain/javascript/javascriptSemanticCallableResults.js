import * as t from "@babel/types";
import { childNodes } from "./javascriptSemanticTraversal.js";
/** Collect direct result syntax without executing or evaluating a callable. */
export const semanticCallableResultExpressions = (callable) => {
    if (t.isArrowFunctionExpression(callable) &&
        !t.isBlockStatement(callable.body))
        return [
            {
                node: callable.body,
                site: callable.body,
                kind: "return",
                delegated: false,
            },
        ];
    if (!t.isFunction(callable))
        return [];
    const output = [];
    const pending = childNodes(callable.body).reverse();
    while (pending.length > 0) {
        const node = pending.pop();
        if (node === undefined || t.isFunction(node) || t.isClass(node))
            continue;
        if (t.isReturnStatement(node)) {
            output.push({
                node: node.argument ?? null,
                site: node,
                kind: "return",
                delegated: false,
            });
        }
        if (t.isYieldExpression(node))
            output.push({
                node: node.argument ?? null,
                site: node,
                kind: "yield",
                delegated: node.delegate,
            });
        for (const child of childNodes(node).reverse())
            pending.push(child);
    }
    return output;
};
/** A callable's direct invocation result differs from its body result syntax. */
export const semanticCallableResultKind = (callable) => {
    if (!t.isFunction(callable))
        return "value";
    if (callable.generator)
        return callable.async ? "async-iterator" : "iterator";
    return callable.async ? "promise" : "value";
};
