import { AnalysisInputError, } from "../analysisErrorCore.js";
import { err, ok } from "../result.js";
import { boundedViewMessages, completeWithinViewCoverage as completeCoverage, pageViewCoverage as pageCoverage, } from "./analysisViewCoverage.js";
const OPERATION = "inspect_analysis_view";
const inputError = (issues) => new AnalysisInputError(OPERATION, undefined, issues);
const layoutUnknowns = (layout) => {
    const unknowns = [
        "runtime_load_base is unknown",
        "entry_point.execution_status is unknown",
        "relocation_inventory_completeness is unknown",
        "linkage.convenience_maps_completeness is unknown",
        "linkage.runtime_library_paths are unknown",
    ];
    if (layout.mitigations.nx_indicator === null)
        unknowns.push("mitigations.nx_indicator is unknown");
    if (layout.mitigations.relro === null)
        unknowns.push("mitigations.relro is unknown");
    return unknowns;
};
const displayName = (name) => name.display;
const namedMatches = (rows, name) => rows.flatMap((row, index) => row.name.unknown_reason === null && displayName(row.name) === name
    ? [{ index, row }]
    : []);
const selectNamed = (collection, rows, name) => {
    const matches = namedMatches(rows, name);
    if (matches.length === 1) {
        const selected = matches[0];
        if (selected !== undefined)
            return ok(selected.row);
    }
    if (matches.length === 0)
        return err(inputError([
            {
                path: ["view", "selector", "name"],
                reason: "invalid_value",
                message: `No ${collection} named ${JSON.stringify(name)}. Collection has ${String(rows.length)} entries; page it to inspect exact indexes and names.`,
            },
        ]));
    return err(inputError([
        {
            path: ["view", "selector", "name"],
            reason: "invalid_value",
            message: `Multiple ${collection} named ${JSON.stringify(name)}; select one by index.`,
            expected: matches.map(({ index }) => ({ index })),
        },
    ]));
};
const selectIndexed = (collection, rows, index) => {
    const row = rows[index];
    if (row !== undefined)
        return ok(row);
    if (rows.length === 0)
        return err(inputError([
            {
                path: ["view", "selector", "index"],
                reason: "invalid_value",
                message: `No retained ${collection} entries can be selected by index.`,
            },
        ]));
    return err(inputError([
        {
            path: ["view", "selector", "index"],
            reason: "out_of_range",
            message: `${collection} index ${String(index)} is outside 0..${String(rows.length - 1)} (${String(rows.length)} entries).`,
            minimum: 0,
            maximum: rows.length - 1,
        },
    ]));
};
const pageRows = (rows, offset, limit) => rows.slice(offset, offset + limit);
const layoutIncompatible = (detail) => inputError([
    {
        path: ["view"],
        reason: "invalid_value",
        message: detail,
    },
]);
const parentFields = (parent, layout) => ({
    parent_evidence_id: parent.evidenceId,
    parent_operation: "inspect_binary_layout",
    parent_digest: parent.evidenceId.slice(3),
    artifact: {
        path: layout.artifact.path,
        sha256: layout.artifact.sha256,
    },
    limitations: boundedViewMessages([...parent.limitations, ...layout.limitations], parent.evidenceId, "limitations"),
    unknowns: boundedViewMessages(layoutUnknowns(layout), parent.evidenceId, "unknowns"),
});
const layoutSummary = (layout) => ({
    bytes: layout.artifact.bytes,
    format: layout.format,
    architecture: layout.architecture,
    image_type: layout.image_type,
    entry: layout.entry_point,
    counts: {
        sections: layout.sections.length,
        segments: layout.segments.length,
        symbols: layout.symbols.length,
        relocations: layout.relocations.length,
    },
    limitation_count: layout.limitations.length,
});
/** Project one layout view without re-running the decoder. */
export const projectBinaryLayoutView = (parent, layout, view) => {
    const shared = parentFields(parent, layout);
    if (view.kind === "native")
        return err(layoutIncompatible("Native views require analyze_function Evidence."));
    if (view.kind === "inventory")
        return err(layoutIncompatible("Inventory views require artifact Evidence."));
    if (view.kind === "wasm")
        return err(layoutIncompatible("WASM views require inspect_wasm_artifact Evidence."));
    if (view.kind === "evm")
        return err(layoutIncompatible("EVM views require inspect_evm_interface Evidence."));
    if (view.kind === "summary")
        return ok({
            kind: "summary",
            view,
            summary: layoutSummary(layout),
            coverage: completeCoverage(layout.sections.length +
                layout.segments.length +
                layout.symbols.length +
                layout.relocations.length, layout.sections.length +
                layout.segments.length +
                layout.symbols.length +
                layout.relocations.length),
            ...shared,
        });
    if (view.kind === "facet")
        return ok({
            kind: "facet",
            view,
            facet: view.facet === "mitigations" ? layout.mitigations : layout.linkage,
            coverage: completeCoverage(1, 1),
            ...shared,
        });
    if (view.kind === "item") {
        if (view.collection === "modules")
            return err(layoutIncompatible("modules collection applies to analyze_javascript_application Evidence."));
        const selected = view.collection === "sections"
            ? selectLayoutItem(view.collection, layout.sections, view.selector)
            : selectLayoutItem(view.collection, layout.symbols, view.selector);
        if (!selected.ok)
            return selected;
        return ok({
            kind: "item",
            view,
            item: selected.value,
            coverage: completeCoverage(1, view.collection === "sections"
                ? layout.sections.length
                : layout.symbols.length),
            ...shared,
        });
    }
    if (view.kind !== "page")
        return err(layoutIncompatible("Layout views require summary, facet, item or page selections."));
    if (view.collection === "modules")
        return err(layoutIncompatible("modules collection applies to analyze_javascript_application Evidence."));
    const rows = view.collection === "sections" ? layout.sections : layout.symbols;
    const items = view.collection === "sections"
        ? pageRows(layout.sections, view.offset, view.limit)
        : pageRows(layout.symbols, view.offset, view.limit);
    return ok({
        kind: "page",
        view,
        items: [...items],
        coverage: pageCoverage(view.offset, items.length, rows.length),
        ...shared,
    });
};
const selectLayoutItem = (collection, rows, selector) => {
    if ("index" in selector)
        return selectIndexed(collection, rows, selector.index);
    if ("name" in selector)
        return selectNamed(collection, rows, selector.name);
    return err(layoutIncompatible("Section and symbol items are selected by index or exact name."));
};
