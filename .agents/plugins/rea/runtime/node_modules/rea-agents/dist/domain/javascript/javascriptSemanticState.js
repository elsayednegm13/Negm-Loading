import * as t from "@babel/types";
import { semanticStaticPropertyKey, staticJavaScriptTruthiness, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { semanticBindingAtRead, semanticEffectTiming, } from "./javascriptSemanticMutationInitializers.js";
/** Record one producer outcome without traversing or retaining its value graph. */
export const recordSemanticValueLimit = (state, value) => {
    if (value.status === "unknown" && value.resourceLimit !== undefined)
        state.valueResourceLimits.add(value.resourceLimit);
};
/**
 * Return one unconditional source initializer for a declared lexical binding.
 * Repeated variable declarations without another initializer do not write it.
 * This establishes a stable source fact only; it does not prove immutability or
 * that the declaration has executed at a particular program point.
 */
export const semanticStableInitializer = (binding, state) => {
    const [initializer] = binding?.initializers ?? [];
    const [definition] = binding?.definitions ?? [];
    return binding !== undefined &&
        ((definition?.kind === "variable" &&
            binding.definitions.every(({ kind }) => kind === "variable")) ||
            (binding.definitions.length === 1 &&
                (definition?.kind === "function" || definition?.kind === "class"))) &&
        binding.initializers.length === 1 &&
        initializer !== undefined &&
        !state.conditionallySkippedExpressions.has(initializer.node)
        ? initializer
        : undefined;
};
/** Return the active scope from a non-empty construction stack. */
export const currentSemanticScope = (stack) => {
    const scope = stack.at(-1);
    if (scope === undefined)
        throw new TypeError("Missing semantic scope");
    return scope;
};
/** Create a stable source-position identity for one lexical scope. */
export const semanticScopeId = (kind, node) => `scope:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`;
/** Create the canonical identity used by one binding in a lexical scope. */
export const semanticBindingId = (scopeId, name) => `${scopeId}:binding:${encodeURIComponent(name)}`;
/** Resolve one lexical name from the scope containing a node. */
export const resolveSemanticBindingState = (state, node, name) => {
    const lookup = semanticBindingLookupAt(state, node, name);
    return lookup.kind === "binding" ? lookup.binding : undefined;
};
/** Report whether an omitted or dynamic binding blocks a trustworthy miss. */
export const semanticResolutionBlocked = (state, node, name) => {
    const lookup = semanticBindingLookupAt(state, node, name);
    return lookup.kind !== "binding" && lookup.kind !== "ambient";
};
const semanticScopeForNode = (state, node) => {
    let candidate = node;
    while (candidate !== undefined) {
        const scope = state.scopeByNode.get(candidate);
        if (scope !== undefined) {
            // Repeated references in a deep expression share this ancestry. Cache
            // the traversed path without eagerly indexing nodes never resolved.
            let descendant = node;
            while (descendant !== undefined && descendant !== candidate) {
                state.scopeByNode.set(descendant, scope);
                descendant = state.parentsByNode.get(descendant);
            }
            return scope;
        }
        candidate = state.parentsByNode.get(candidate);
    }
    return undefined;
};
/** Retain both a dynamic lookup's uncertainty and its possible outer write owner. */
export const semanticBindingLookupFromScope = (scope, name, state) => {
    let uncertain = false;
    while (scope !== undefined) {
        const binding = scope.bindings.get(name);
        if (binding !== undefined)
            return { kind: uncertain ? "uncertain-binding" : "binding", binding };
        if (name === "arguments" && scope.implicitArguments === true)
            return { kind: "implicit-arguments" };
        if (!scope.bindingsComplete) {
            if (scope.dynamicWithStatement === undefined)
                return { kind: "unknown" };
            const lookup = semanticWithRequireLookup(state, scope.dynamicWithStatement, name);
            if (lookup === "captures")
                return { kind: "captured" };
            if (lookup === "unknown")
                uncertain = true;
        }
        scope =
            scope.parentScopeId === null
                ? undefined
                : state.scopesById.get(scope.parentScopeId);
    }
    return { kind: uncertain ? "uncertain-ambient" : "ambient" };
};
/** Return certain and possible binding ownership without discarding uncertainty. */
export const semanticBindingLookupAt = (state, node, name) => semanticBindingLookupFromScope(semanticScopeForNode(state, node), name, state);
/** Resolve a certain lexical binding from an explicitly selected scope. */
export const resolveSemanticBindingFromScope = (scope, name, state) => {
    const lookup = semanticBindingLookupFromScope(scope, name, state);
    return lookup.kind === "binding" ? lookup.binding : undefined;
};
const semanticUnscopablesKey = Symbol("semantic-unscopables-key");
/** Classify only source-visible own `require` entries in a literal with object. */
const semanticWithRequireLookup = (state, statement, name) => {
    if (name !== "require")
        return "unknown";
    const object = unwrapJavaScriptExpression(statement.object).node;
    if (!t.isObjectExpression(object))
        return "unknown";
    let ownRequire = false;
    let hasUnknownOwnProperties = false;
    let prototypeIsNull = false;
    let unknownPrototype = false;
    for (const property of object.properties) {
        if (t.isSpreadElement(property)) {
            hasUnknownOwnProperties = true;
            continue;
        }
        const key = semanticWithPropertyName(property.key, property.computed, state);
        if (key === "require")
            ownRequire = true;
        else if (key === "__proto__" &&
            t.isObjectProperty(property) &&
            !property.computed &&
            !property.shorthand) {
            const prototype = unwrapJavaScriptExpression(property.value).node;
            if (t.isNullLiteral(prototype))
                prototypeIsNull = true;
            else
                unknownPrototype = true;
        }
        else if (key === null && property.computed) {
            hasUnknownOwnProperties = true;
        }
    }
    if (ownRequire) {
        const unscopablesValue = finalSemanticWithSymbolProperty(object, state);
        if (unscopablesValue === "unknown")
            return "unknown";
        if (unscopablesValue === undefined)
            return prototypeIsNull ||
                (!unknownPrototype && state.prototypeRequireMutationObserved === false)
                ? "captures"
                : "unknown";
        const unscopables = unwrapJavaScriptExpression(unscopablesValue).node;
        if (!t.isObjectExpression(unscopables))
            return isSemanticWithPrimitive(unscopables) ? "captures" : "unknown";
        const entry = finalSemanticWithStringProperty(unscopables, "require");
        if (entry === "unknown")
            return "unknown";
        if (entry === undefined) {
            const prototype = semanticWithPrototypeKind(unscopables);
            return prototype === "null" ||
                (prototype === "ordinary" &&
                    state.prototypeRequireMutationObserved === false)
                ? "captures"
                : "unknown";
        }
        const truthiness = staticJavaScriptTruthiness(entry);
        return truthiness === true
            ? "skips"
            : truthiness === false
                ? "captures"
                : "unknown";
    }
    if (hasUnknownOwnProperties || unknownPrototype)
        return "unknown";
    if (prototypeIsNull)
        return "skips";
    return state.prototypeRequireMutationObserved === false ? "skips" : "unknown";
};
const semanticWithPropertyName = (key, computed, state) => {
    if (computed &&
        t.isMemberExpression(key) &&
        !key.computed &&
        t.isIdentifier(key.object, { name: "Symbol" }) &&
        semanticStaticPropertyKey(key.property, false) === "unscopables" &&
        resolveSemanticBindingState(state, key.object, "Symbol") === undefined &&
        !semanticResolutionBlocked(state, key.object, "Symbol"))
        return semanticUnscopablesKey;
    return semanticStaticPropertyKey(key, computed);
};
const finalSemanticWithSymbolProperty = (object, state) => {
    for (let index = object.properties.length - 1; index >= 0; index -= 1) {
        const property = object.properties[index];
        if (property === undefined || t.isSpreadElement(property))
            return "unknown";
        const name = semanticWithPropertyName(property.key, property.computed, state);
        if (name === semanticUnscopablesKey)
            return t.isObjectProperty(property) ? property.value : "unknown";
        if (name === null && property.computed)
            return "unknown";
    }
    return undefined;
};
const semanticWithPrototypeKind = (object) => {
    for (const property of object.properties) {
        if (t.isObjectProperty(property) &&
            !property.computed &&
            !property.shorthand &&
            t.isIdentifier(property.key, { name: "__proto__" }))
            return t.isNullLiteral(unwrapJavaScriptExpression(property.value).node)
                ? "null"
                : "other";
    }
    return "ordinary";
};
const finalSemanticWithStringProperty = (object, sought) => {
    for (let index = object.properties.length - 1; index >= 0; index -= 1) {
        const property = object.properties[index];
        if (property === undefined || t.isSpreadElement(property))
            return "unknown";
        const name = semanticStaticPropertyKey(property.key, property.computed);
        if (name === sought)
            return t.isObjectProperty(property) ? property.value : "unknown";
        if (name === null && property.computed)
            return "unknown";
    }
    return undefined;
};
const isSemanticWithPrimitive = (node) => t.isNullLiteral(node) ||
    t.isBooleanLiteral(node) ||
    t.isStringLiteral(node) ||
    t.isNumericLiteral(node) ||
    t.isBigIntLiteral(node) ||
    (t.isUnaryExpression(node, { operator: "-" }) &&
        (t.isNumericLiteral(node.argument) || t.isBigIntLiteral(node.argument)));
/** Select the function/program owner for a var declaration. */
export const semanticVariableScope = (scope, parent, state) => {
    if (!(parent !== null && t.isVariableDeclaration(parent, { kind: "var" })))
        return scope;
    let candidate = scope;
    while (candidate.kind === "block" || candidate.kind === "catch") {
        const outer = candidate.parentScopeId === null
            ? undefined
            : state.scopesById.get(candidate.parentScopeId);
        if (outer === undefined)
            break;
        candidate = outer;
    }
    return candidate;
};
/** Identify a global name only when no lexical or dynamic environment shadows it. */
export const isUnshadowedGlobal = (node, state, name) => t.isIdentifier(node, { name }) &&
    (resolveSemanticBindingState(state, node, name) === undefined
        ? !semanticResolutionBlocked(state, node, name)
        : isUnmodifiedCommonJsWrapperBinding(node, name, state));
/** A program-level `var` redeclaration still denotes its untouched CJS wrapper parameter. */
export const isUnmodifiedCommonJsWrapperBinding = (node, name, state) => {
    const binding = commonJsWrapperBindingDeclaration(node, name, state);
    return (binding !== undefined &&
        !semanticBindingHasPriorValueWrite(node, binding, state));
};
/** Retained value and pattern stores share one source-ordered write boundary. */
export const semanticBindingHasPriorValueWrite = (site, binding, state) => {
    if (binding.definitions.some(({ kind }) => kind === "function"))
        return true;
    const writes = state.bindingWrites.get(binding.bindingId) ?? [];
    const read = semanticBindingAtRead(binding, site, state.parentsByNode);
    const retained = read.status === "ordered"
        ? new Set([
            ...read.binding.initializers,
            ...read.binding.referenceInitializers,
        ])
        : undefined;
    const representedWrites = new Set();
    const retainedWrites = new Set();
    for (const source of [
        ...binding.initializers,
        ...binding.referenceInitializers,
    ]) {
        let owner = source.node;
        while (owner !== undefined && !writes.includes(owner))
            owner = state.parentsByNode.get(owner);
        if (owner !== undefined) {
            representedWrites.add(owner);
            if (retained === undefined || retained.has(source))
                retainedWrites.add(owner);
        }
        else if ((retained === undefined || retained.has(source)) &&
            semanticEffectTiming(site, source.node, state) !== "after")
            return true;
    }
    return writes.some((write) => (!representedWrites.has(write) || retainedWrites.has(write)) &&
        semanticEffectTiming(site, write, state) !== "after");
};
/** Explicit wrapper facts and program `var` redeclarations retain their lexical identity. */
export const commonJsWrapperBindingDeclaration = (node, name, state) => {
    if (!["module", "exports", "require", "__dirname", "__filename"].includes(name) ||
        !t.isIdentifier(node, { name }))
        return undefined;
    const binding = resolveSemanticBindingState(state, node, name);
    if (binding === undefined)
        return undefined;
    const scope = state.scopesById.get(binding.scopeId);
    if (scope?.kind !== "program" ||
        ![...binding.declarationKinds].every((kind) => kind === "var"))
        return undefined;
    // The index owns explicit wrapper parameters, including ones with no source
    // redeclaration. Babel's module classification does not invalidate that fact.
    if (binding.hostOrigin === "commonjs-wrapper")
        return binding;
    // Without an explicit host fact, preserve the legacy script-var inference.
    return state.program.sourceType === "script" &&
        binding.declarationKinds.size > 0
        ? binding
        : undefined;
};
