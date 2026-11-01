import * as t from "@babel/types";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { readExactJavaScriptLiteral, semanticStaticPropertyKey, semanticStaticPropertyName, } from "./javascriptAstValues.js";
import { sourceSlice } from "./javascriptStaticAnalysisHelpers.js";
/** Resolve a callee only when its root has a proven Electron module identity. */
export const electronCalleePath = (callee, context) => {
    const members = [];
    let root = callee;
    while (t.isMemberExpression(root) || t.isOptionalMemberExpression(root)) {
        const member = semanticStaticPropertyName(root.property, root.computed);
        if (member === "" || !t.isNode(root.object))
            return undefined;
        members.push(member);
        root = root.object;
    }
    const exported = context.electronBindings?.get(root.start ?? -1);
    return exported === undefined
        ? undefined
        : [...exported, ...members.toReversed()];
};
/** Preserve one literal value or the exact inert expression. */
export const electronStaticValue = (source, node) => {
    const literal = literalValue(node);
    return literal.found
        ? { status: "literal", value: literal.value, expression: null }
        : {
            status: "dynamic",
            value: null,
            expression: boundedExpression(source, node),
        };
};
/** Return an actionable expression without evaluating it. */
export const boundedExpression = (source, node) => {
    if (node === null || node === undefined)
        return "[missing-expression]";
    const expression = sourceSlice(source, node).trim();
    return expression === "" ? `[${node.type}]` : expression;
};
export function handlerKind(node) {
    if (node === null || node === undefined)
        return "missing";
    if (t.isArrowFunctionExpression(node) ||
        t.isFunctionExpression(node) ||
        t.isFunctionDeclaration(node))
        return "inline-function";
    if (t.isIdentifier(node))
        return "identifier";
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
        return "member-expression";
    return "dynamic-expression";
}
/**
 * Nesting bound for dotted contextBridge member paths. Deeper objects count as
 * one unknown member rather than being enumerated.
 */
export const contextBridgeMemberPathDepth = 8;
/** Collect statically visible dotted keys from one literal contextBridge API object. */
export const collectContextBridgeMembers = (node) => {
    if (node === null || node === undefined)
        return {
            status: "missing",
            members: [],
            unknown: 0,
        };
    if (!t.isObjectExpression(node))
        return {
            status: "dynamic",
            members: [],
            unknown: 1,
        };
    const state = {
        members: [],
        unknown: 0,
    };
    collectMembersAt(node, [], state);
    const members = [...new Set(state.members)].sort(compareUnicodeCodePoints);
    return {
        status: "object-literal",
        members,
        unknown: state.unknown,
    };
};
const collectMembersAt = (object, prefix, state) => {
    if (prefix.length >= contextBridgeMemberPathDepth) {
        state.unknown += 1;
        return;
    }
    for (const property of object.properties) {
        if (t.isSpreadElement(property)) {
            state.unknown += 1;
            continue;
        }
        const name = semanticStaticPropertyKey(property.key, property.computed);
        if (name === null) {
            state.unknown += 1;
            continue;
        }
        if (t.isObjectProperty(property) &&
            !property.computed &&
            !property.shorthand &&
            name === "__proto__")
            continue;
        const segments = [...prefix, name];
        const path = segments.join(".");
        state.members.push(path);
        if (t.isObjectProperty(property) && t.isObjectExpression(property.value))
            collectMembersAt(property.value, segments, state);
    }
};
const literalValue = (node) => {
    if (node === null || node === undefined)
        return { found: false };
    const literal = readExactJavaScriptLiteral(node);
    if (literal.found)
        return literal;
    if (t.isUnaryExpression(node, { operator: "-" }) &&
        t.isNumericLiteral(node.argument)) {
        const value = -node.argument.value;
        return Number.isFinite(value) && !Object.is(value, -0)
            ? { found: true, value }
            : { found: false };
    }
    return { found: false };
};
