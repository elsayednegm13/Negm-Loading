import * as t from "@babel/types";
import { sanitizeBrowserUrl } from "./browserObservation.js";
import { hasScheme } from "./artifactPathSyntax.js";
import { isNullishJavaScriptSyntax, readExactJavaScriptLiteral, staticObjectProperty, } from "./javascript/javascriptAstValues.js";
/** Read a statically known own property value from an object expression. */
export const objectValue = (object, name) => {
    const result = staticObjectProperty(object, name, isNullishJavaScriptSyntax);
    return result.status === "explicit" ? result.property.value : undefined;
};
export const objectString = (object, name) => {
    const value = objectValue(object, name);
    if (value === undefined)
        return undefined;
    const literal = readExactJavaScriptLiteral(value);
    return literal.found && typeof literal.value === "string"
        ? literal.value
        : undefined;
};
/** Whether module syntax supplies a URL location without a package/import-map resolver. */
export const isUrlLikeModuleSpecifier = (specifier) => specifier.startsWith("/") ||
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    hasScheme(specifier);
export const resolveSpecifier = (specifier, base) => {
    try {
        const resolved = new URL(specifier, base);
        if (resolved.protocol !== "http:" && resolved.protocol !== "https:")
            return null;
        return sanitizeBrowserUrl(resolved.href).url;
    }
    catch (cause) {
        // Unresolvable specifiers are represented by the null return.
        void cause;
        return null;
    }
};
export const location = (scriptKey, node) => ({
    script_key: scriptKey,
    ...locationFields(node),
});
export const locationFields = (node) => ({
    line: node.loc?.start.line ?? null,
    column: node.loc?.start.column ?? null,
});
