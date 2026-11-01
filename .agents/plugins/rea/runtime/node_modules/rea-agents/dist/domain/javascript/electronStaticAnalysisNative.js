import * as t from "@babel/types";
import { compareUnicodeCodePoints, compositeKey, } from "../unicodeCodePointOrder.js";
import { stripQueryAndFragment } from "../artifactPathSyntax.js";
import { isTypeOnlyExportDeclaration, isTypeOnlyExportSpecifier, isTypeOnlyImportDeclaration, isTypeOnlyImportSpecifier, } from "./javascriptModuleDeclaration.js";
import { addLocatedFinding } from "./javascriptStaticAnalysisFindings.js";
import { argumentNode, range, stringValue, } from "./javascriptStaticAnalysisHelpers.js";
import { propertyName, semanticStaticPropertyKey, unwrapJavaScriptExpression, } from "./javascriptAstValues.js";
import { semanticRequireCallAt } from "./javascriptSemanticRequireOrigin.js";
import { commonJsExportApplicability, commonJsRuntimeExportValues, indexCommonJsExportReceiversSteps, } from "./javascriptCommonJsExportReceivers.js";
/** Inspect JavaScript-side imports and re-exports of native .node addons. */
export const inspectElectronNativeNode = (node, context) => {
    if (t.isImportDeclaration(node))
        inspectImport(node, context);
    else if (t.isExportNamedDeclaration(node))
        inspectNamedExport(node, context);
    else if (t.isExportAllDeclaration(node))
        inspectExportAll(node, context);
    else if (t.isVariableDeclarator(node) || t.isAssignmentExpression(node)) {
        const value = nativeCallReceiver(t.isVariableDeclarator(node) ? node.init : node.right);
        // Admission is syntax only; the shared call owner proves loader and arguments later.
        if (value !== undefined &&
            value.arguments.some((argument) => t.isArrayExpression(argument)
                ? argument.elements.some((element) => isNativeSpecifier(stringValue(element) ?? "", "require"))
                : isNativeSpecifier(stringValue(argument) ?? "", "require")))
            context.accumulator.pendingNativeAddonBindings.push(node);
    }
};
/** Shared loader, argument and receiver facts settle before native projection. */
export function* finishElectronNativeBindingsSteps(context, index) {
    const pending = context.accumulator.pendingNativeAddonBindings;
    if (pending.length === 0)
        return;
    yield* index.indexMemberMutationFactsSteps();
    const receivers = pending.some((node) => t.isAssignmentExpression(node))
        ? yield* indexCommonJsExportReceiversSteps(index.bindings)
        : new Map();
    for (const node of pending) {
        if (t.isVariableDeclarator(node))
            inspectRequireBinding(node, context, index.bindings);
        else
            inspectReExport(node, context, index.bindings, receivers.get(node));
    }
    pending.length = 0;
}
const inspectImport = (node, context) => {
    if (!isNativeSpecifier(node.source.value, "import"))
        return;
    // TypeScript erases `import type` and per-binding `type` imports; they never
    // request a runtime native-addon member.
    if (isTypeOnlyImportDeclaration(node))
        return;
    const valueSpecifiers = node.specifiers.filter((specifier) => !(t.isImportSpecifier(specifier) && isTypeOnlyImportSpecifier(specifier)));
    if (node.specifiers.length > 0 && valueSpecifiers.length === 0)
        return;
    const members = valueSpecifiers.flatMap((specifier) => {
        if (t.isImportDefaultSpecifier(specifier))
            return ["default"];
        if (t.isImportNamespaceSpecifier(specifier))
            return [];
        return [propertyName(specifier.imported)];
    });
    addBinding({
        context,
        node,
        specifier: node.source.value,
        kind: "import",
        moduleKind: "import",
        members,
        namespaceAccess: valueSpecifiers.some((value) => t.isImportNamespaceSpecifier(value)),
        dynamicMemberAccess: false,
    });
};
const inspectNamedExport = (node, context) => {
    if (node.source === null ||
        node.source === undefined ||
        !isNativeSpecifier(node.source.value, "import"))
        return;
    if (isTypeOnlyExportDeclaration(node))
        return;
    const valueSpecifiers = node.specifiers.filter((specifier) => !(t.isExportSpecifier(specifier) && isTypeOnlyExportSpecifier(specifier)));
    if (node.specifiers.length > 0 && valueSpecifiers.length === 0)
        return;
    const members = valueSpecifiers.flatMap((specifier) => {
        if (t.isExportSpecifier(specifier))
            return [propertyName(specifier.local)];
        if (t.isExportDefaultSpecifier(specifier))
            return ["default"];
        return [];
    });
    addBinding({
        context,
        node,
        specifier: node.source.value,
        kind: "re-export",
        moduleKind: "import",
        members,
        namespaceAccess: valueSpecifiers.some((value) => t.isExportNamespaceSpecifier(value)),
        dynamicMemberAccess: false,
    });
};
const inspectExportAll = (node, context) => {
    if (node.source === undefined ||
        !isNativeSpecifier(node.source.value, "import") ||
        isTypeOnlyExportDeclaration(node))
        return;
    addBinding({
        context,
        node,
        specifier: node.source.value,
        kind: "re-export",
        moduleKind: "import",
        members: [],
        namespaceAccess: true,
        dynamicMemberAccess: false,
    });
};
const inspectRequireBinding = (node, context, bindings) => {
    const required = nativeRequire(node.init, context, bindings);
    if (required === undefined)
        return;
    addBinding({
        context,
        node,
        specifier: required.specifier,
        kind: "require",
        moduleKind: "require",
        ...(required.hasMemberAccess ? required.access : bindingMembers(node.id)),
    });
};
const inspectReExport = (node, context, bindings, receiver) => {
    const exported = commonJsRuntimeExportValues(node, bindings)[0];
    if (exported === undefined)
        return;
    const applicability = commonJsExportApplicability(receiver, exported.exportedName);
    if (applicability === "detached")
        return;
    if (applicability === "uncertain") {
        context.accumulator.unknownFindings += 1;
        return;
    }
    // The export owner leaves arithmetic/logical stores without a selected RHS.
    const value = exported.value;
    if (value == null)
        return;
    const required = nativeRequire(value, context, bindings);
    if (required === undefined)
        return;
    addBinding({
        context,
        node,
        specifier: required.specifier,
        kind: "re-export",
        moduleKind: "require",
        ...required.access,
    });
};
const addBinding = (input) => {
    const { context, node, specifier, kind } = input;
    const members = [...new Set(input.members)].sort(compareUnicodeCodePoints);
    addLocatedFinding(context, {
        collection: context.accumulator.nativeAddonBindings,
        // Members are a variable-length source-derived list: compositeKey keeps
        // ["a\0b"] distinct from ["a", "b"] instead of collapsing one binding.
        key: compositeKey([
            "native-addon-binding",
            kind,
            specifier,
            members,
            input.namespaceAccess,
            input.dynamicMemberAccess,
        ]),
        node,
        value: {
            specifier,
            binding_kind: kind,
            module_kind: input.moduleKind,
            members,
            namespace_access: input.namespaceAccess,
            dynamic_member_access: input.dynamicMemberAccess,
            module_key: null,
            location: range(node),
        },
    });
};
const nativeCallReceiver = (node) => {
    if (node == null)
        return undefined;
    node = unwrapJavaScriptExpression(node).node;
    while (t.isMemberExpression(node) || t.isOptionalMemberExpression(node))
        node = unwrapJavaScriptExpression(node.object).node;
    return t.isCallExpression(node) || t.isOptionalCallExpression(node)
        ? node
        : undefined;
};
const nativeRequire = (node, context, bindings) => {
    if (node == null)
        return undefined;
    node = unwrapJavaScriptExpression(node).node;
    let member = null;
    let hasMemberAccess = false;
    while (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        if (!t.isNode(node.object))
            return undefined;
        const property = semanticStaticPropertyKey(node.property, node.computed);
        // Walking inward leaves the first member consumed from the addon itself.
        member = property;
        hasMemberAccess = true;
        node = unwrapJavaScriptExpression(node.object).node;
    }
    if (!t.isCallExpression(node) && !t.isOptionalCallExpression(node))
        return undefined;
    const call = semanticRequireCallAt(node, bindings, context.accumulator.factoryRequireBindingIds);
    if (call === undefined ||
        call.loader === "local" ||
        call.operation !== "load")
        return undefined;
    const specifier = stringValue(argumentNode(call.arguments?.[0]));
    if (specifier === undefined || !isNativeSpecifier(specifier, "require"))
        return undefined;
    if (call.loader === "unknown" ||
        !call.sourceRelative ||
        call.sourceRelativePath !== undefined) {
        context.accumulator.unknownFindings += 1;
        return undefined;
    }
    return {
        specifier,
        hasMemberAccess,
        access: {
            members: member === null ? [] : [member],
            namespaceAccess: !hasMemberAccess,
            dynamicMemberAccess: hasMemberAccess && member === null,
        },
    };
};
const bindingMembers = (pattern) => {
    if (!t.isObjectPattern(pattern))
        return { members: [], namespaceAccess: true, dynamicMemberAccess: false };
    const members = [];
    let namespaceAccess = false;
    let dynamicMemberAccess = false;
    for (const property of pattern.properties) {
        if (t.isRestElement(property)) {
            namespaceAccess = true;
            continue;
        }
        const key = semanticStaticPropertyKey(property.key, property.computed);
        if (key === null)
            dynamicMemberAccess = true;
        else
            members.push(key);
    }
    return { members, namespaceAccess, dynamicMemberAccess };
};
const isNativeSpecifier = (specifier, moduleKind) => {
    const path = moduleKind === "require" ? specifier : stripQueryAndFragment(specifier);
    return path.toLowerCase().endsWith(".node");
};
