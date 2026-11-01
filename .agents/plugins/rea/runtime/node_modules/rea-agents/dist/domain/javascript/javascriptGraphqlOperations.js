import * as t from "@babel/types";
import { unwrapJavaScriptExpression, semanticStaticPropertyKey, semanticFinalObjectProperty, semanticFinalObjectStringProperty, } from "./javascriptAstValues.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
import { resolveSemanticBindingState, semanticStableInitializer, } from "./javascriptSemanticState.js";
/**
 * Find source-body string values owned by a GraphQL Source-shaped literal.
 * A later duplicate or spread can make the effective `body` unknown, but the
 * earlier strings still belong to this object and must not become standalone
 * operation findings during the string scan.
 */
const graphqlSourceBodyLiterals = (node) => {
    const hasLocationOffset = node.properties.some((property) => t.isObjectProperty(property) &&
        semanticStaticPropertyKey(property.key, property.computed) ===
            "locationOffset");
    if (!hasLocationOffset)
        return undefined;
    const bodyStrings = (object) => object.properties.flatMap((property) => t.isObjectProperty(property) &&
        semanticStaticPropertyKey(property.key, property.computed) === "body" &&
        t.isStringLiteral(property.value)
        ? [property.value]
        : []);
    const bodies = bodyStrings(node);
    // Inline object spreads can own additional body values which the surrounding
    // Source object may select. Include only body-key string literals from those
    // spread values; ordinary strings elsewhere in the object remain scannable.
    const visited = new WeakSet();
    visited.add(node);
    const pending = node.properties.flatMap((property) => {
        if (!t.isSpreadElement(property))
            return [];
        const spread = unwrapJavaScriptExpression(property.argument).node;
        return t.isObjectExpression(spread) ? [spread] : [];
    });
    while (pending.length > 0) {
        const current = pending.pop();
        if (current === undefined || visited.has(current))
            continue;
        visited.add(current);
        bodies.push(...bodyStrings(current));
        for (const property of current.properties) {
            if (t.isSpreadElement(property)) {
                const spread = unwrapJavaScriptExpression(property.argument).node;
                if (t.isObjectExpression(spread))
                    pending.push(spread);
            }
        }
    }
    return bodies.length === 0 ? undefined : bodies;
};
const GRAPHQL_OPERATION_TYPES = new Set([
    "query",
    "mutation",
    "subscription",
]);
// GraphQL October 2021 §2.1.7: ignored BOM, tab/space, line endings, commas;
// comments are consumed separately below.
const isGraphqlIgnoredCharacter = (character) => character === "," ||
    character === "\uFEFF" ||
    character === "\t" ||
    character === " " ||
    character === "\n" ||
    character === "\r";
/** Return the first offset after GraphQL ignored tokens. */
const skipGraphqlIgnored = (text, start) => {
    const limit = text.length;
    let index = start;
    while (index < limit) {
        const character = text.charAt(index);
        if (isGraphqlIgnoredCharacter(character))
            index += 1;
        else if (character === "#") {
            while (index < limit && !/[\n\r]/u.test(text.charAt(index)))
                index += 1;
        }
        else
            break;
    }
    return index;
};
const graphqlNameAt = (text, index) => {
    const name = /^[_A-Za-z][_0-9A-Za-z]*/u.exec(text.slice(index))?.[0];
    return name === undefined
        ? undefined
        : { value: name, end: index + name.length };
};
/** Recover a named operation from GraphQL document text. */
const graphqlOperationFromText = (text) => {
    const type = graphqlNameAt(text, skipGraphqlIgnored(text, 0));
    if (type === undefined || !GRAPHQL_OPERATION_TYPES.has(type.value))
        return undefined;
    const name = graphqlNameAt(text, skipGraphqlIgnored(text, type.end));
    if (name === undefined)
        return undefined;
    const index = skipGraphqlIgnored(text, name.end);
    const next = text.charAt(index);
    // Keep the existing bounded recognition scope: a named operation followed
    // by variable definitions, a directive, or a selection set with a field.
    const hasHeader = next === "("
        ? text.charAt(skipGraphqlIgnored(text, index + 1)) === "$"
        : (next === "@" || next === "{") &&
            graphqlNameAt(text, skipGraphqlIgnored(text, index + 1)) !== undefined;
    return hasHeader
        ? { value: name.value, mechanism: `graphql:${type.value}` }
        : undefined;
};
/** Recover a named operation from a precompiled GraphQL document object. */
const graphqlOperationFromDocumentNode = (node) => {
    if (semanticFinalObjectStringProperty(node, "kind") !== "OperationDefinition")
        return undefined;
    const type = semanticFinalObjectStringProperty(node, "operation");
    if (type === undefined || !GRAPHQL_OPERATION_TYPES.has(type))
        return undefined;
    const name = semanticFinalObjectProperty(node, "name");
    if (!t.isObjectExpression(name) ||
        semanticFinalObjectStringProperty(name, "kind") !== "Name")
        return undefined;
    const value = semanticFinalObjectStringProperty(name, "value");
    return value === undefined
        ? undefined
        : { value, mechanism: `graphql:${type}` };
};
/** One private constant owns its initializer; exported or projected values do not. */
const graphqlPrivateBinding = (node, state, sourceType) => {
    const binding = resolveSemanticBindingState(state, node, node.name);
    if (binding === undefined || binding.mutable)
        return undefined;
    const scope = state.scopesById.get(binding.scopeId);
    if (scope === undefined ||
        (scope.kind === "program" && sourceType !== "module"))
        return undefined;
    const initializer = semanticStableInitializer(binding, state);
    if (initializer?.projection.length !== 0)
        return undefined;
    const declaration = state.parentsByNode.get(initializer.node);
    const statement = t.isVariableDeclarator(declaration)
        ? state.parentsByNode.get(declaration)
        : undefined;
    return t.isVariableDeclaration(statement) &&
        !t.isExportNamedDeclaration(state.parentsByNode.get(statement))
        ? { binding, initializer }
        : undefined;
};
/** Resolve potential metadata ownership; references must still prove exclusivity. */
const graphqlSourceObjectValue = (node, index, dependencies) => {
    if (node === undefined)
        return undefined;
    const state = index.bindings;
    const visited = new Set();
    while (node !== undefined && !visited.has(node)) {
        visited.add(node);
        node = unwrapJavaScriptExpression(node).node;
        if (t.isObjectExpression(node))
            return node;
        if (!t.isIdentifier(node))
            return undefined;
        const owner = graphqlPrivateBinding(node, state, index.sourceType);
        if (owner === undefined)
            return undefined;
        const { binding, initializer } = owner;
        if (initializer.node.end == null ||
            node.start == null ||
            node.loc == null ||
            initializer.node.end > node.start)
            return undefined;
        dependencies.push({
            bindingId: binding.bindingId,
            name: binding.name,
            location: range(node),
        });
        node = initializer.node;
    }
    return undefined;
};
const graphqlDocumentSource = (node, index) => {
    const dependencies = [];
    const loc = graphqlSourceObjectValue(semanticFinalObjectProperty(node, "loc"), index, dependencies);
    const source = loc === undefined
        ? undefined
        : graphqlSourceObjectValue(semanticFinalObjectProperty(loc, "source"), index, dependencies);
    return source !== undefined &&
        graphqlContainerOwnership(node, index, dependencies)
        ? { source, dependencies }
        : undefined;
};
/** Follow containment to the binding that can expose or mutate this document. */
const graphqlContainerOwnership = (document, index, dependencies) => {
    const state = index.bindings;
    let node = document;
    for (;;) {
        const parent = state.parentsByNode.get(node);
        if (parent === undefined)
            return false;
        if (t.isObjectProperty(parent) && parent.value === node) {
            const object = state.parentsByNode.get(parent);
            if (!t.isObjectExpression(object))
                return false;
            node = object;
        }
        else if (t.isArrayExpression(parent) ||
            unwrapJavaScriptExpression(parent).node === node)
            node = parent;
        else if (t.isExpressionStatement(parent))
            return true;
        else if (t.isVariableDeclarator(parent) && parent.init === node) {
            if (!t.isIdentifier(parent.id))
                return false;
            const owner = graphqlPrivateBinding(parent.id, state, index.sourceType);
            if (owner?.initializer.node !== node)
                return false;
            const { binding } = owner;
            dependencies.push({ bindingId: binding.bindingId, name: binding.name });
            return true;
        }
        else
            return false;
    }
};
const graphqlDocumentOperations = (node, operation) => {
    if (operation !== undefined)
        return [operation];
    if (semanticFinalObjectStringProperty(node, "kind") !== "Document")
        return [];
    const definitions = semanticFinalObjectProperty(node, "definitions");
    return t.isArrayExpression(definitions)
        ? definitions.elements.flatMap((definition) => {
            const recovered = t.isObjectExpression(definition)
                ? graphqlOperationFromDocumentNode(definition)
                : undefined;
            return recovered === undefined ? [] : [recovered];
        })
        : [];
};
const graphqlOperationKey = (operation) => `${operation.mechanism}:${operation.value}`;
function* graphqlSourceReferenceIndexSteps(copies) {
    const allowed = new Map();
    const neighbors = new Map();
    const byName = new Map();
    let examined = 0;
    for (const { dependencies } of copies) {
        const first = dependencies[0]?.bindingId;
        for (const { bindingId, name, location } of dependencies) {
            if (++examined % 1024 === 0)
                yield;
            const sites = allowed.get(bindingId) ?? new Set();
            if (location !== undefined)
                sites.add(JSON.stringify(location));
            allowed.set(bindingId, sites);
            const names = byName.get(name) ?? new Set();
            names.add(bindingId);
            byName.set(name, names);
            if (first === undefined || first === bindingId)
                continue;
            const left = neighbors.get(first) ?? new Set();
            const right = neighbors.get(bindingId) ?? new Set();
            left.add(bindingId);
            right.add(first);
            neighbors.set(first, left);
            neighbors.set(bindingId, right);
        }
    }
    return { allowed, neighbors, byName };
}
function* uncertainGraphqlSourceBindingsSteps(index, references) {
    const { allowed, neighbors, byName } = index;
    const uncertain = new Set();
    let examined = 0;
    for (const reference of references) {
        if (++examined % 1024 === 0)
            yield;
        // Direct eval may reach private lexical objects. Indirect eval cannot;
        // classic-script globals are already rejected at private-binding admission.
        if (reference.name === "eval")
            return new Set(allowed.keys());
        if (reference.bindingId !== null) {
            const sites = allowed.get(reference.bindingId);
            if (sites !== undefined &&
                (reference.role !== "read" ||
                    !sites.has(JSON.stringify(reference.location))))
                uncertain.add(reference.bindingId);
        }
        else if (reference.resolution === "unknown" ||
            reference.resolution === "ambiguous")
            for (const bindingId of byName.get(reference.name) ?? [])
                uncertain.add(bindingId);
    }
    const pending = [...uncertain];
    for (let bindingId = pending.pop(); bindingId !== undefined; bindingId = pending.pop())
        for (const neighbor of neighbors.get(bindingId) ?? []) {
            if (++examined % 1024 === 0)
                yield;
            if (!uncertain.has(neighbor)) {
                uncertain.add(neighbor);
                pending.push(neighbor);
            }
        }
    return uncertain;
}
function* provenGraphqlSourceCopiesSteps(copies, references) {
    const index = yield* graphqlSourceReferenceIndexSteps(copies);
    const uncertain = yield* uncertainGraphqlSourceBindingsSteps(index, references);
    for (const copy of copies)
        yield copy.dependencies.every(({ bindingId }) => !uncertain.has(bindingId))
            ? copy
            : undefined;
}
const graphqlOperationFromTemplate = (node) => {
    // Interpolations may contain fragment definitions. Continue only
    // across quasis that contain ignored tokens; prose or dynamic text
    // before an operation prevents claiming a later operation belongs to
    // this document prefix.
    for (const quasi of node.quasis) {
        const cooked = quasi.value.cooked;
        if (cooked === undefined || cooked === null)
            return undefined;
        if (skipGraphqlIgnored(cooked, 0) === cooked.length)
            continue;
        return graphqlOperationFromText(cooked);
    }
    return undefined;
};
export const createJavaScriptGraphqlScan = (index) => {
    const bodies = new WeakSet();
    const copied = new WeakMap();
    const copies = [];
    const sources = [];
    const retainCopy = ({ source, operations }) => {
        const keys = copied.get(source) ?? new Set();
        for (const operation of operations)
            keys.add(graphqlOperationKey(operation));
        copied.set(source, keys);
    };
    return {
        inspect: (node) => {
            if (t.isStringLiteral(node))
                return bodies.has(node)
                    ? undefined
                    : graphqlOperationFromText(node.value);
            if (t.isTemplateLiteral(node))
                return graphqlOperationFromTemplate(node);
            if (!t.isObjectExpression(node))
                return undefined;
            const operation = graphqlOperationFromDocumentNode(node);
            if (semanticFinalObjectProperty(node, "loc") !== undefined) {
                const operations = graphqlDocumentOperations(node, operation);
                const source = operations.length === 0
                    ? undefined
                    : graphqlDocumentSource(node, index);
                if (source !== undefined) {
                    copies.push({ ...source, operations });
                }
            }
            const owned = graphqlSourceBodyLiterals(node);
            if (owned !== undefined) {
                for (const body of owned)
                    bodies.add(body);
                const body = semanticFinalObjectProperty(node, "body");
                const recovered = t.isStringLiteral(body)
                    ? graphqlOperationFromText(body.value)
                    : undefined;
                if (t.isStringLiteral(body) && recovered !== undefined)
                    sources.push({ source: node, node: body, operation: recovered });
            }
            return operation;
        },
        *finish() {
            if (sources.length > 0 && copies.length > 0) {
                const references = yield* index.referencesSteps();
                for (const copy of provenGraphqlSourceCopiesSteps(copies, references)) {
                    if (copy !== undefined)
                        retainCopy(copy);
                    yield;
                }
            }
            for (const { source, node, operation } of sources)
                yield copied.get(source)?.has(graphqlOperationKey(operation))
                    ? undefined
                    : { node, ...operation };
            sources.length = 0;
            copies.length = 0;
        },
    };
};
