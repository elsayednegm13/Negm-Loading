import * as t from "@babel/types";
import { unwrapJavaScriptExpression } from "./javascriptAstValues.js";
import { semanticBindingAtRead } from "./javascriptSemanticMutationInitializers.js";
import { semanticStableInitializer, } from "./javascriptSemanticState.js";
/** Lexical candidates alone do not establish that object contents are intact. */
const optionObjectCandidate = (input, index) => {
    if (input === undefined)
        return undefined;
    let node = unwrapJavaScriptExpression(input).node;
    const seen = new Set();
    const references = [];
    while (t.isIdentifier(node)) {
        if (seen.has(node))
            return undefined;
        seen.add(node);
        const binding = index.bindingForReferenceAt(node);
        if (binding === undefined)
            return undefined;
        const initializer = semanticStableInitializer(binding, index.bindings);
        if (binding.mutable ||
            binding.declarationKinds.size !== 1 ||
            !binding.declarationKinds.has("const") ||
            initializer === undefined ||
            initializer.projection.length !== 0 ||
            !semanticBindingAtRead(binding, node, index.bindings.parentsByNode)
                .hasDefiniteInitializer)
            return undefined;
        references.push(node);
        node = unwrapJavaScriptExpression(initializer.node).node;
    }
    return t.isObjectExpression(node) ? { object: node, references } : undefined;
};
/** Avoid building mutation facts for parameters, missing or unresolved objects. */
export const hasElectronOptionObjectCandidate = (input, index) => optionObjectCandidate(input, index) !== undefined;
/** Select an inert const object using the shared lexical and mutation owner. */
export const resolveElectronOptionObject = (input, site, index, propertyPath = []) => {
    const candidate = optionObjectCandidate(input, index);
    if (candidate === undefined)
        return undefined;
    for (const reference of candidate.references) {
        if (index.referenceMayHaveChangedAt(site, reference, propertyPath))
            return undefined;
    }
    return candidate.object;
};
