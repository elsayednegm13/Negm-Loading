import * as t from "@babel/types";
import { semanticWriteTargets } from "./javascriptAstValues.js";
/** Declaration syntax that establishes no runtime value, regardless of export form. */
export const isErasedJavaScriptDeclaration = (node) => t.isTSInterfaceDeclaration(node) ||
    t.isTSTypeAliasDeclaration(node) ||
    t.isTSDeclareFunction(node) ||
    ((t.isVariableDeclaration(node) ||
        t.isClassDeclaration(node) ||
        t.isTSEnumDeclaration(node) ||
        t.isTSModuleDeclaration(node)) &&
        node.declare === true);
/** Namespace/enum lowering introduces runtime scopes absent from this source index. */
export const isUnmodeledJavaScriptRuntimeScope = (node) => t.isTSModuleDeclaration(node) || t.isTSEnumDeclaration(node);
/** Whether TypeScript explicitly erases this entire import declaration. */
export const isTypeOnlyImportDeclaration = (node) => node.importKind === "type" || node.importKind === "typeof";
/** Whether TypeScript explicitly erases this entire export declaration. */
export const isTypeOnlyExportDeclaration = (node) => node.exportKind === "type" ||
    (t.isExportNamedDeclaration(node) &&
        node.declaration != null &&
        isErasedJavaScriptDeclaration(node.declaration));
/**
 * Runtime external-module target for a value import-equals declaration;
 * `import type X = require("m")` is erased and declares no dependency.
 */
export const semanticImportEqualsSpecifier = (node) => node.importKind !== "type" &&
    t.isTSExternalModuleReference(node.moduleReference) &&
    t.isStringLiteral(node.moduleReference.expression)
    ? node.moduleReference.expression.value
    : null;
/** Whether this import binding is explicitly type-only. */
export const isTypeOnlyImportSpecifier = (node) => node.importKind === "type" || node.importKind === "typeof";
/** Whether this exported binding is explicitly type-only. */
export const isTypeOnlyExportSpecifier = (node) => node.exportKind === "type";
/** Runtime values published by a local ESM export; source re-exports have no local value. */
export const semanticRuntimeExportValueSources = (node) => {
    if (t.isExportDefaultDeclaration(node))
        return isErasedJavaScriptDeclaration(node.declaration)
            ? []
            : [node.declaration];
    if (!t.isExportNamedDeclaration(node) ||
        node.source != null ||
        isTypeOnlyExportDeclaration(node))
        return [];
    const values = [];
    if (t.isVariableDeclaration(node.declaration))
        for (const declaration of node.declaration.declarations)
            values.push(...semanticWriteTargets(declaration.id));
    else if ((t.isFunctionDeclaration(node.declaration) ||
        t.isClassDeclaration(node.declaration)) &&
        node.declaration.id != null)
        values.push(node.declaration.id);
    for (const specifier of node.specifiers)
        if (t.isExportSpecifier(specifier) && !isTypeOnlyExportSpecifier(specifier))
            values.push(specifier.local);
    return values;
};
/** A regular import whose bindings are all erased but may retain side effects. */
export const hasOnlyInlineTypeImportSpecifiers = (node) => !isTypeOnlyImportDeclaration(node) &&
    node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => t.isImportSpecifier(specifier) && isTypeOnlyImportSpecifier(specifier));
/** A regular re-export whose bindings are all erased but may retain side effects. */
export const hasOnlyInlineTypeExportSpecifiers = (node) => !isTypeOnlyExportDeclaration(node) &&
    node.source != null &&
    node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => t.isExportSpecifier(specifier) && isTypeOnlyExportSpecifier(specifier));
/** Whether compiler options leave an inline type-only declaration's side effect unknown. */
export const hasUncertainTypeOnlyModuleSideEffect = (program) => program.body.some((node) => (t.isImportDeclaration(node) &&
    hasOnlyInlineTypeImportSpecifiers(node)) ||
    (t.isExportNamedDeclaration(node) &&
        hasOnlyInlineTypeExportSpecifiers(node)));
