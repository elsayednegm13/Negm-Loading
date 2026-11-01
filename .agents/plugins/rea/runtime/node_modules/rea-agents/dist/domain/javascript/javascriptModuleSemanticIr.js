/** Retain facts consumed by source-module and export-return composition. */
export const projectJavaScriptModuleSemantics = (ir) => {
    const scopes = ir.scopes.filter(({ kind }) => kind === "program");
    const programScopeId = scopes[0]?.scopeId;
    const localNames = new Set(ir.moduleLinks.map(({ localName }) => localName));
    const callableIds = new Set(ir.moduleLinks.map(({ callableId }) => callableId));
    return {
        scopes,
        bindings: ir.bindings.filter(({ name, scopeId }) => scopeId === programScopeId && localNames.has(name)),
        callables: ir.callables.filter(({ callableId }) => callableIds.has(callableId)),
        moduleLinks: ir.moduleLinks,
        coverage: ir.coverage,
        limitations: ir.limitations,
    };
};
