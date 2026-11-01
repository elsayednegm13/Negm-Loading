import * as t from "@babel/types";
import { resolveSemanticBindingState, semanticResolutionBlocked, } from "./javascriptSemanticState.js";
import { semanticRequireOrigin } from "./javascriptSemanticRequireOrigin.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { completeSemanticSteps, traverseJavaScriptValueAstSteps, } from "./javascriptSemanticTraversal.js";
import { evaluateSemanticBinding, evaluateSemanticProvenance, } from "./javascriptSemanticValues.js";
import { range } from "./javascriptStaticAnalysisHelpers.js";
import { propertyName, semanticStaticPropertyKey, semanticWrappedWriteSite, semanticWriteSiteReadsFirst, semanticWriteSiteTarget, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { isErasedJavaScriptDeclaration, isTypeOnlyExportDeclaration, isTypeOnlyExportSpecifier, isTypeOnlyImportDeclaration, isTypeOnlyImportSpecifier, semanticImportEqualsSpecifier, } from "./javascriptModuleDeclaration.js";
import { commonJsRuntimeExportValues, commonJsExportApplicability, } from "./javascriptCommonJsExportReceivers.js";
import { semanticComputedMethodKey } from "./javascriptSemanticEvaluationOrder.js";
/** Retain callable identity without polluting lexical bindings. */
export const collectSemanticCallable = (input) => {
    const { node, parent, containerScope, bodyScope, state } = input;
    const kind = callableKind(node);
    if (kind === undefined)
        return;
    const callableId = semanticCallableIdForNode(node) ?? "callable:unknown:-1:-1";
    state.callables.push({
        callableId,
        kind,
        name: callableName(node, parent),
        containerScopeId: containerScope.scopeId,
        bodyScopeId: bodyScope === undefined || !bodyScope.bindingsComplete
            ? null
            : bodyScope.scopeId,
        location: range(node),
        computedKeyLocation: "key" in node &&
            t.isNode(node.key) &&
            semanticComputedMethodKey(node, node.key)
            ? range(node.key)
            : null,
        returnSites: [],
        returnCoverage: {
            status: "partial",
            retainedCount: 0,
            omittedCount: null,
        },
    });
    state.callableNodesById.set(callableId, node);
};
/** Collect one static import/export relationship for later composition. */
export const collectSemanticModuleLink = (node, state, commonJsReceivers) => {
    // Import/export declarations also describe erased type links. Their nested
    // expressions do not establish runtime require or CommonJS export links.
    if (state.erasedSyntaxNodes.has(node) &&
        !t.isTSImportEqualsDeclaration(node) &&
        !t.isImportDeclaration(node) &&
        !t.isExportNamedDeclaration(node) &&
        !t.isExportAllDeclaration(node))
        return;
    if (t.isTSImportEqualsDeclaration(node))
        collectImportEquals(node, state);
    else if (t.isImportDeclaration(node))
        collectImports(node, state);
    else if (t.isExportAllDeclaration(node))
        addModuleLink(state, {
            kind: isTypeOnlyExportDeclaration(node) ? "type-import" : "re-export",
            specifier: node.source.value,
            importedName: "*",
            localName: null,
            exportedName: "*",
            location: range(node),
        }, node);
    else if (t.isExportNamedDeclaration(node))
        collectNamedExports(node, state);
    else if (t.isExportDefaultDeclaration(node))
        addModuleLink(state, {
            kind: isErasedJavaScriptDeclaration(node.declaration)
                ? "type-import"
                : "export",
            specifier: null,
            importedName: null,
            localName: defaultExportLocalName(node.declaration),
            exportedName: "default",
            callableId: semanticCallableIdForNode(node.declaration),
            location: range(node),
        }, node);
    else if (t.isVariableDeclarator(node))
        collectRequireLink(node, state);
    else if (t.isAssignmentExpression(node))
        collectCommonJsExport(node, state, commonJsReceivers.get(node));
    else if (t.isCallExpression(node)) {
        collectCommonJsExport(node, state, commonJsReceivers.get(node));
        collectUnboundRequireLink(node, state);
    }
};
const collectImportEquals = (node, state) => {
    const moduleReference = node.moduleReference;
    const specifier = semanticImportEqualsSpecifier(node) ??
        (node.importKind === "type" &&
            t.isTSExternalModuleReference(moduleReference) &&
            t.isStringLiteral(moduleReference.expression)
            ? moduleReference.expression.value
            : null);
    if (specifier === null)
        return;
    addModuleLink(state, {
        kind: node.importKind === "type" ? "type-import" : "require",
        specifier,
        importedName: null,
        localName: node.id.name,
        exportedName: null,
        location: range(node),
    }, node);
};
/** Collect lexical references after definitions exist, optionally for one name. */
export const collectSemanticReferences = (program, state, name) => completeSemanticSteps(collectSemanticReferencesSteps(program, state, name));
/** Collect lexical references in steps while preserving resolution and visit order. */
export function* collectSemanticReferencesSteps(program, state, name) {
    const output = [];
    const seen = new Set();
    yield* traverseJavaScriptValueAstSteps(program, state.erasedSyntaxNodes, {
        enter: (node, parent, readAncestors) => {
            if (!t.isIdentifier(node) ||
                parent === null ||
                (name !== undefined && node.name !== name))
                return;
            let ancestors;
            const ancestry = () => (ancestors ??= readAncestors());
            const role = semanticIdentifierRole(node, parent, ancestry);
            if (role === null)
                return;
            // A compound assignment or update reads before it writes; emit both so
            // reference consumers see the read they actually execute.
            const roles = role === "write" &&
                semanticReadsBeforeWrite(node, semanticWrappedWriteSite(node, parent, ancestry()) ?? parent)
                ? ["read", "write"]
                : [role];
            for (const resolvedRole of roles) {
                const key = `${String(node.start)}:${resolvedRole}:${node.name}`;
                if (seen.has(key))
                    continue;
                seen.add(key);
                const binding = resolveSemanticBindingState(state, node, node.name);
                const blocked = binding === undefined &&
                    semanticResolutionBlocked(state, node, node.name);
                output.push({
                    name: node.name,
                    role: resolvedRole,
                    location: range(node),
                    bindingId: binding?.bindingId ?? null,
                    resolution: binding !== undefined
                        ? "resolved"
                        : blocked
                            ? "unknown"
                            : "unbound",
                });
            }
        },
    });
    return output;
}
/** Freeze collected scopes into deterministic IR order. */
export const immutableSemanticScopes = (state) => state.scopes.map((scope) => ({
    scopeId: scope.scopeId,
    parentScopeId: scope.parentScopeId,
    kind: scope.kind,
    location: scope.location,
    bindingsComplete: scope.bindingsComplete,
    bindingIds: [...scope.bindings.values()]
        .map(({ bindingId }) => bindingId)
        .sort(compareUnicodeCodePoints),
}));
/** Evaluate and freeze bindings into deterministic IR order. */
export const immutableSemanticBindings = (state) => [...state.bindingsById.values()]
    .map((binding) => ({
    bindingId: binding.bindingId,
    scopeId: binding.scopeId,
    name: binding.name,
    kind: binding.kind,
    mutable: binding.mutable,
    definitions: binding.definitions,
    value: evaluateSemanticBinding(binding, state),
    provenance: evaluateSemanticProvenance(binding, state),
}))
    .sort((left, right) => compareUnicodeCodePoints(left.bindingId, right.bindingId));
const callableKind = (node) => {
    if (t.isClassMethod(node) ||
        t.isClassPrivateMethod(node) ||
        t.isObjectMethod(node))
        return "method";
    if (t.isFunction(node))
        return "function";
    if (t.isClass(node))
        return "class";
    return undefined;
};
const callableName = (node, parent) => {
    if ((t.isFunctionDeclaration(node) ||
        t.isFunctionExpression(node) ||
        t.isClassDeclaration(node) ||
        t.isClassExpression(node)) &&
        t.isIdentifier(node.id))
        return node.id.name;
    if (t.isClassMethod(node) ||
        t.isClassPrivateMethod(node) ||
        t.isObjectMethod(node)) {
        if (t.isPrivateName(node.key))
            return `#${node.key.id.name}`;
        // `{[key]() {}}` names nothing statically; reading `key` off the key node
        // would report the variable name as the method name. `{[""]() {}}` names
        // the exact empty key, which is retained rather than replaced.
        return (semanticStaticPropertyKey(node.key, node.computed) ??
            `[computed@${String(node.start ?? -1)}]`);
    }
    if (parent !== null &&
        t.isVariableDeclarator(parent) &&
        t.isIdentifier(parent.id))
        return parent.id.name;
    return null;
};
const collectImports = (node, state) => {
    if (node.specifiers.length === 0)
        addModuleLink(state, {
            kind: isTypeOnlyImportDeclaration(node) ? "type-import" : "import",
            specifier: node.source.value,
            importedName: null,
            localName: null,
            exportedName: null,
            location: range(node),
        }, node);
    for (const specifier of node.specifiers)
        addModuleLink(state, {
            kind: isTypeOnlyImportDeclaration(node) ||
                (t.isImportSpecifier(specifier) &&
                    isTypeOnlyImportSpecifier(specifier))
                ? "type-import"
                : "import",
            specifier: node.source.value,
            importedName: t.isImportDefaultSpecifier(specifier)
                ? "default"
                : t.isImportNamespaceSpecifier(specifier)
                    ? "*"
                    : propertyName(specifier.imported),
            localName: specifier.local.name,
            exportedName: null,
            location: range(specifier),
        }, node);
};
const collectNamedExports = (node, state) => {
    const declarationTypeOnly = isTypeOnlyExportDeclaration(node);
    if (node.declaration !== null && node.declaration !== undefined)
        for (const localName of declarationNames(node.declaration))
            addModuleLink(state, {
                kind: declarationTypeOnly ? "type-import" : "export",
                specifier: null,
                importedName: null,
                localName,
                exportedName: localName,
                callableId: declarationCallableId(node.declaration, localName),
                location: range(node.declaration),
            }, node);
    for (const specifier of node.specifiers)
        if (t.isExportSpecifier(specifier) ||
            (t.isExportNamespaceSpecifier(specifier) && node.exportKind !== "type"))
            addModuleLink(state, {
                kind: declarationTypeOnly ||
                    (t.isExportSpecifier(specifier) &&
                        isTypeOnlyExportSpecifier(specifier))
                    ? "type-import"
                    : node.source == null
                        ? "export"
                        : "re-export",
                specifier: node.source?.value ?? null,
                importedName: t.isExportNamespaceSpecifier(specifier)
                    ? "*"
                    : propertyName(specifier.local),
                localName: node.source == null && t.isExportSpecifier(specifier)
                    ? propertyName(specifier.local)
                    : null,
                exportedName: propertyName(specifier.exported),
                location: range(specifier),
            }, node);
};
const collectRequireLink = (node, state) => {
    const required = semanticRequireOrigin(node.init, state);
    if (required === undefined)
        return;
    const { origin, call } = required;
    const bindings = requirePatternBindings(node.id, origin.importedPath);
    for (const binding of bindings)
        addModuleLink(state, {
            kind: "require",
            specifier: origin.specifier,
            importedName: binding.importedName,
            localName: binding.localName,
            exportedName: null,
            location: range(node),
        }, node);
    if (bindings.length > 0)
        state.linkedRequireCalls.add(call);
};
const collectUnboundRequireLink = (node, state) => {
    if (state.linkedRequireCalls.has(node))
        return;
    const required = semanticRequireOrigin(node, state);
    if (required === undefined)
        return;
    addModuleLink(state, {
        kind: "require",
        specifier: required.origin.specifier,
        importedName: null,
        localName: null,
        exportedName: null,
        location: range(node),
    }, node);
    state.linkedRequireCalls.add(node);
};
const requirePatternBindings = (pattern, path) => {
    if (t.isTSParameterProperty(pattern))
        return requirePatternBindings(pattern.parameter, path);
    if (t.isIdentifier(pattern))
        return [{ importedName: path.at(-1) ?? "*", localName: pattern.name }];
    if (t.isAssignmentPattern(pattern))
        return requirePatternBindings(pattern.left, path);
    if (t.isObjectPattern(pattern))
        return pattern.properties.flatMap((property) => {
            if (t.isRestElement(property))
                return [];
            const name = semanticStaticPropertyKey(property.key, property.computed);
            return name === null
                ? []
                : requirePatternBindings(property.value, [...path, name]);
        });
    if (t.isArrayPattern(pattern))
        return pattern.elements.flatMap((element, index) => element === null
            ? []
            : requirePatternBindings(element, [...path, String(index)]));
    return [];
};
const collectCommonJsExport = (node, state, receiverEffect) => {
    // Compound and logical writes also depend on the previous value, so remain unknown.
    for (const exported of commonJsRuntimeExportValues(node, state)) {
        const applicability = commonJsExportApplicability(receiverEffect, exported.exportedName);
        if (applicability === "detached")
            continue;
        addCommonJsExport(node, state, exported.exportedName, applicability === "uncertain" ? null : exported.value, exported.projection);
    }
};
const addCommonJsExport = (node, state, exportedName, exported, projection) => {
    // Simple assignment chains yield their rightmost assigned value.
    let value = exported;
    while (t.isAssignmentExpression(value, { operator: "=" }))
        value = value.right;
    const required = value === null ? undefined : semanticRequireOrigin(value, state);
    // Copies retain their module provenance, but do not export the source object
    // itself. A wildcard with exclusions cannot express one module link.
    const origin = projection?.some((key) => typeof key === "object" && key !== null && key.excludedKeys.length > 0)
        ? undefined
        : required?.origin;
    const selectedName = projection?.at(-1);
    addModuleLink(state, {
        kind: "commonjs-export",
        specifier: origin?.specifier ?? null,
        importedName: origin === undefined
            ? null
            : typeof selectedName === "string" || typeof selectedName === "number"
                ? String(selectedName)
                : (origin.importedPath.at(-1) ?? null),
        localName: projection === undefined && value !== null && t.isIdentifier(value)
            ? value.name
            : null,
        exportedName,
        callableId: projection !== undefined || value === null
            ? null
            : semanticCallableIdForNode(value),
        location: range(node),
    }, node);
    if (origin !== undefined && required !== undefined)
        state.linkedRequireCalls.add(required.call);
};
const addModuleLink = (state, link, referenceNode) => {
    const resolutionMode = link.resolutionMode ??
        (link.kind === "import" ||
            link.kind === "re-export" ||
            link.kind === "type-import"
            ? state.staticImportResolutionMode
            : link.kind === "require"
                ? "require"
                : undefined);
    const collected = {
        ...link,
        ...(resolutionMode === undefined ? {} : { resolutionMode }),
        callableId: link.callableId ?? null,
    };
    state.moduleLinks.push(collected);
    if (t.isExportDefaultDeclaration(referenceNode) &&
        t.isExpression(referenceNode.declaration))
        state.defaultExportExpressions.set(collected, referenceNode.declaration);
    if (link.localName !== null) {
        const binding = resolveSemanticBindingState(state, referenceNode, link.localName);
        if (binding !== undefined)
            state.moduleLinkBindings.set(collected, binding);
    }
};
/** Deterministic callable identity shared by collection and return recovery. */
export const semanticCallableIdForNode = (node) => {
    const kind = callableKind(node);
    return kind === undefined
        ? null
        : `callable:${kind}:${String(node.start ?? -1)}:${String(node.end ?? -1)}`;
};
const declarationCallableId = (declaration, localName) => {
    if ((t.isFunctionDeclaration(declaration) ||
        t.isClassDeclaration(declaration)) &&
        declaration.id?.name === localName)
        return semanticCallableIdForNode(declaration);
    if (!t.isVariableDeclaration(declaration))
        return null;
    const declarator = declaration.declarations.find(({ id }) => t.isIdentifier(id, { name: localName }));
    return declarator?.init === null || declarator?.init === undefined
        ? null
        : semanticCallableIdForNode(declarator.init);
};
/**
 * True when writing `node` also reads it first: a compound assignment
 * (`+=`, `||=`, …) or an update (`++`/`--`). A plain `=` writes only.
 *
 * One predicate serves both member operations and identifier references so the
 * two can never disagree about what counts as a read-modify-write.
 */
export const semanticReadsBeforeWrite = (node, site) => {
    const target = semanticWriteSiteTarget(site);
    return (target !== null &&
        unwrapJavaScriptExpression(target).node === node &&
        semanticWriteSiteReadsFirst(site));
};
/**
 * Role of one identifier occurrence, given the node's ancestry.
 *
 * A binding inside a destructuring pattern has an ObjectProperty/ArrayPattern
 * as its direct parent, so the immediate parent cannot tell a declaration
 * (`const {a} = o`, `catch ({message})`) from an assignment target
 * (`({a} = o)`, `for (a of list)`). Walking the ancestry to the nearest
 * pattern-owning construct is what makes the distinction possible.
 */
export const semanticIdentifierRole = (node, parent, readAncestors) => {
    // Member identifiers are either object/computed-key reads or fixed property
    // names. None is a bound destructuring slot, so no ancestor snapshot is needed.
    if (t.isMemberExpression(parent) || t.isOptionalMemberExpression(parent))
        return semanticReferenceRole(node, parent);
    if (t.isObjectProperty(parent) &&
        parent.key === node &&
        !parent.computed &&
        parent.value !== node)
        return null;
    const ancestors = readAncestors();
    const patternAncestor = enclosingPatternAncestor(node, parent, ancestors);
    if (patternAncestor !== null) {
        if (isPatternOwnerDeclaration(patternAncestor))
            return null;
        return "write";
    }
    const site = semanticWrappedWriteSite(node, parent, ancestors);
    if (site !== null && site !== parent && !isDeleteSite(site))
        return "write";
    return semanticReferenceRole(node, parent, ancestors.at(-2));
};
/**
 * The nearest ancestor that owns this identifier as a *bound* pattern slot, or
 * null when the identifier is not being bound. A binding inside a pattern has
 * an ObjectProperty/ArrayPattern parent, so the immediate parent cannot say
 * whether the identifier declares a binding or is assigned to.
 *
 * Only the bound side counts: `{a = compute()}` binds `a` but merely *reads*
 * `compute`, so the default-value side must not be mistaken for a binding.
 */
const enclosingPatternAncestor = (node, parent, ancestors) => {
    const chain = [...ancestors, parent];
    for (let index = chain.length - 1; index >= 0; index -= 1) {
        const ancestor = chain[index];
        if (ancestor === undefined || !isPatternNode(ancestor))
            continue;
        if (!bindsIdentifier(ancestor, parent, node))
            continue;
        // Found the binding slot; now find what owns the pattern.
        for (let owner = index - 1; owner >= 0; owner -= 1) {
            const candidate = chain[owner];
            if (candidate === undefined)
                continue;
            if (t.isAssignmentExpression(candidate) ||
                t.isForInStatement(candidate) ||
                t.isForOfStatement(candidate))
                return candidate;
            if (isPatternOwnerDeclaration(candidate))
                return candidate;
        }
        return null;
    }
    return null;
};
/** True when `parent` places `node` in the bound slot of `pattern`. */
const bindsIdentifier = (pattern, parent, node) => {
    // The identifier sits directly in the pattern: `[b]`, `({b})`, `{b = 1}`.
    if (parent === pattern)
        return patternContains(pattern, node);
    if (t.isObjectPattern(pattern))
        return (t.isObjectProperty(parent) &&
            (parent.value === node || (parent.shorthand && parent.key === node)));
    if (t.isArrayPattern(pattern))
        return pattern.elements.some((element) => element === parent);
    if (t.isAssignmentPattern(pattern))
        return pattern.left === parent;
    return t.isRestElement(pattern) && pattern.argument === parent;
};
const isPatternNode = (node) => t.isObjectPattern(node) ||
    t.isArrayPattern(node) ||
    t.isAssignmentPattern(node) ||
    t.isRestElement(node);
const isDeleteSite = (site) => t.isUnaryExpression(site, { operator: "delete" });
const isPatternOwnerDeclaration = (node) => t.isTSParameterProperty(node) ||
    (t.isVariableDeclarator(node) && t.isPattern(node.id)) ||
    (t.isFunction(node) &&
        node.params.some((value) => t.isPattern(value))) ||
    (t.isCatchClause(node) && node.param !== null && t.isPattern(node.param));
/** Classify one identifier occurrence consistently with semantic references. */
export const semanticReferenceRole = (node, parent, grandparent) => {
    if ((t.isAssignmentExpression(parent) && parent.left === node) ||
        t.isUpdateExpression(parent) ||
        ((t.isForInStatement(parent) || t.isForOfStatement(parent)) &&
            parent.left === node))
        return "write";
    // Babel owns syntax roles. These TS declaration forms are not covered by
    // the installed Babel 8 isReferenced predicate.
    if ((t.isTSImportEqualsDeclaration(parent) && parent.id === node) ||
        (t.isTSParameterProperty(parent) &&
            patternContains(parent.parameter, node)) ||
        ((t.isTSDeclareMethod(parent) || t.isTSMethodSignature(parent)) &&
            parent.key === node &&
            !parent.computed))
        return null;
    if (!t.isReferenced(node, parent, grandparent))
        return null;
    return t.isExportSpecifier(parent) && parent.local === node
        ? "export"
        : "read";
};
const patternNames = (pattern) => {
    if (t.isTSParameterProperty(pattern))
        return patternNames(pattern.parameter);
    if (t.isIdentifier(pattern))
        return [pattern.name];
    if (t.isAssignmentPattern(pattern))
        return patternNames(pattern.left);
    if (t.isRestElement(pattern))
        return patternNames(pattern.argument);
    if (t.isObjectPattern(pattern))
        return pattern.properties.flatMap((property) => t.isRestElement(property)
            ? patternNames(property.argument)
            : patternNames(property.value));
    if (t.isArrayPattern(pattern))
        return pattern.elements.flatMap((element) => element === null ? [] : patternNames(element));
    return [];
};
const patternContains = (pattern, target) => pattern === target ||
    (t.isTSParameterProperty(pattern) &&
        patternContains(pattern.parameter, target)) ||
    (t.isAssignmentPattern(pattern) && patternContains(pattern.left, target)) ||
    (t.isRestElement(pattern) && patternContains(pattern.argument, target)) ||
    (t.isObjectPattern(pattern) &&
        pattern.properties.some((property) => t.isRestElement(property)
            ? patternContains(property.argument, target)
            : patternContains(property.value, target))) ||
    (t.isArrayPattern(pattern) &&
        pattern.elements.some((element) => element !== null && patternContains(element, target)));
const declarationNames = (declaration) => {
    if (t.isVariableDeclaration(declaration))
        return declaration.declarations.flatMap(({ id }) => patternNames(id));
    if ((t.isFunctionDeclaration(declaration) ||
        t.isClassDeclaration(declaration)) &&
        t.isIdentifier(declaration.id))
        return [declaration.id.name];
    if ((t.isTSInterfaceDeclaration(declaration) ||
        t.isTSTypeAliasDeclaration(declaration) ||
        t.isTSDeclareFunction(declaration)) &&
        t.isIdentifier(declaration.id))
        return [declaration.id.name];
    if (t.isTSImportEqualsDeclaration(declaration) &&
        semanticImportEqualsSpecifier(declaration) !== null)
        return [declaration.id.name];
    return [];
};
const defaultExportLocalName = (declaration) => {
    const value = unwrapJavaScriptExpression(declaration).node;
    if (t.isIdentifier(value))
        return value.name;
    return (t.isFunctionDeclaration(value) || t.isClassDeclaration(value)) &&
        t.isIdentifier(value.id)
        ? value.id.name
        : null;
};
