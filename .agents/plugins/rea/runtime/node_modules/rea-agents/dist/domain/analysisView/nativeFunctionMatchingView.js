import { z } from "zod";
import { nativeFunctionMatchingSchema, nativeFunctionMatchingContextSchema, nativeFunctionMatchSchema, nativeFunctionMatchMemberSchema, nativeMatchStateSchema, } from "../native/functionMatching.js";
import { isImmutableJsonSnapshot } from "../immutableJson.js";
import { parseAnalysisViewResult } from "./analysisViewParent.js";
import { analysisViewInputError } from "./analysisViewErrors.js";
import { boundedViewMessages, completeWithinViewCoverage, pageViewCoverage, } from "./analysisViewCoverage.js";
import { err, ok } from "../result.js";
const matchRow = nativeFunctionMatchSchema.extend({
    left_count: z.number().int().nonnegative(),
    right_count: z.number().int().nonnegative(),
});
const functionRow = nativeFunctionMatchMemberSchema.extend({
    match_id: nativeFunctionMatchSchema.shape.match_id,
    state: nativeMatchStateSchema,
    side: z.enum(["left", "right"]),
});
const page = {
    kind: z.literal("function-matches"),
    states: z.array(nativeMatchStateSchema).optional(),
    match_ids: z.array(z.string()).optional(),
    function_ids: z.array(z.string()).optional(),
    offset: z.number().int().nonnegative().default(0),
    limit: z.number().int().positive().default(64),
};
export const nativeFunctionMatchingViewRequestSchema = z.discriminatedUnion("collection", [
    z.strictObject({
        ...page,
        collection: z.literal("matches"),
        fields: z.array(matchRow.keyof()).optional(),
    }),
    z.strictObject({
        ...page,
        collection: z.literal("functions"),
        sides: z.array(z.enum(["left", "right"])).optional(),
        names: z.array(z.string()).optional(),
        fields: z.array(functionRow.keyof()).optional(),
    }),
]);
export const nativeFunctionMatchingViewItemsSchema = z.union([
    z.array(matchRow.partial().required({
        match_id: true,
        state: true,
        left_count: true,
        right_count: true,
    })),
    z.array(functionRow.partial().required({
        function_id: true,
        match_id: true,
        state: true,
        side: true,
        inventory_evidence_id: true,
        source_index: true,
        address: true,
        evidence_links: true,
    })),
]);
export const nativeFunctionMatchingViewContextSchema = nativeFunctionMatchingContextSchema;
const checked = new WeakMap();
const checkedReport = (parent) => {
    const source = parent.normalizedResult;
    const reusable = typeof source === "object" &&
        source !== null &&
        parent.sealedResult === true &&
        isImmutableJsonSnapshot(source);
    const cached = reusable ? checked.get(source) : undefined;
    if (cached !== undefined)
        return ok(cached);
    const parsed = parseAnalysisViewResult(nativeFunctionMatchingSchema, parent);
    if (!parsed.ok)
        return parsed;
    const entry = {
        report: reusable ? source : parsed.value,
    };
    if (reusable)
        checked.set(source, entry);
    return ok(entry);
};
const functionRows = (entry) => {
    if (entry.functions !== undefined)
        return entry.functions;
    const functions = [];
    for (const match of entry.report.matches)
        for (const side of ["left", "right"])
            for (const member of match[side])
                functions.push({
                    member,
                    match_id: match.match_id,
                    state: match.state,
                    side,
                });
    entry.functions = functions;
    return functions;
};
const sharedContext = (parent, report) => ({
    parent_evidence_id: parent.evidenceId,
    parent_operation: "match_native_functions",
    parent_digest: parent.evidenceId.slice(3),
    artifact: null,
    limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
    unknowns: [
        "Unpaired observations and page exhaustion do not establish binary-wide function absence or behavioral equivalence.",
    ],
});
const selected = (values) => values === undefined ? undefined : new Set(values);
const filterRows = (entry, view) => {
    const key = JSON.stringify([
        view.collection,
        view.states,
        view.match_ids,
        view.function_ids,
        view.collection === "functions" ? view.sides : null,
        view.collection === "functions" ? view.names : null,
    ]);
    if (entry.recent?.key === key)
        return entry.recent.rows;
    const states = selected(view.states), ids = selected(view.match_ids), functions = selected(view.function_ids), sides = selected(view.collection === "functions" ? view.sides : undefined), names = selected(view.collection === "functions" ? view.names : undefined);
    const matchesIdentity = (row) => (states === undefined || states.has(row.state)) &&
        (ids === undefined || ids.has(row.match_id));
    const rows = [];
    if (view.collection === "matches")
        entry.report.matches.forEach((row, index) => {
            if (matchesIdentity(row) &&
                (functions === undefined ||
                    [...row.left, ...row.right].some((member) => functions.has(member.function_id))))
                rows.push(index);
        });
    else
        functionRows(entry).forEach((row, index) => {
            if (matchesIdentity(row) &&
                (functions === undefined || functions.has(row.member.function_id)) &&
                (sides === undefined || sides.has(row.side)) &&
                (names === undefined || names.has(row.member.name)))
                rows.push(index);
        });
    // One recent selector and at most one row index per source occurrence.
    const count = entry.report.left.functions + entry.report.right.functions;
    if (key.length <= Math.max(256, count * 8))
        entry.recent = { key, rows };
    return rows;
};
const selectedItems = (entry, view, rows) => {
    const indices = rows.slice(view.offset, view.offset + view.limit);
    const defaults = view.collection === "matches"
        ? [
            "match_id",
            "state",
            "basis",
            "reason",
            "left_count",
            "right_count",
            "compare_functions_input",
        ]
        : [
            "function_id",
            "match_id",
            "state",
            "side",
            "inventory_evidence_id",
            "source_index",
            "address",
            "name",
            "body_sha256",
            "structural_candidate_sha256",
            "body_bytes",
            "dossier_evidence_id",
            "evidence_links",
        ];
    const fields = new Set(view.fields ?? defaults);
    const columns = (row) => Object.fromEntries([...fields].map((field) => [field, row[field]]));
    if (view.collection === "matches")
        return indices.map((index) => {
            const row = entry.report.matches[index], left_count = row.left.length, right_count = row.right.length;
            return {
                ...columns({ ...row, left_count, right_count }),
                match_id: row.match_id,
                state: row.state,
                left_count,
                right_count,
            };
        });
    const functions = functionRows(entry);
    return indices.map((index) => {
        const row = functions[index], member = row.member;
        return {
            ...columns({
                ...member,
                match_id: row.match_id,
                state: row.state,
                side: row.side,
            }),
            function_id: member.function_id,
            match_id: row.match_id,
            state: row.state,
            side: row.side,
            inventory_evidence_id: member.inventory_evidence_id,
            source_index: member.source_index,
            address: member.address,
            evidence_links: member.evidence_links,
        };
    });
};
/** Query immutable matching facts without copying full alias groups into selected pages. */
export const projectNativeFunctionMatchingView = (parent, view) => {
    if (view.kind !== "summary" && view.kind !== "function-matches")
        return err(analysisViewInputError([
            {
                path: ["view"],
                reason: "invalid_value",
                message: "Native matching supports summary and function-matches pages",
            },
        ]));
    const parsed = checkedReport(parent);
    if (!parsed.ok)
        return parsed;
    const entry = parsed.value;
    const { matches: _matches, limitations: _limitations, ...context } = entry.report;
    const shared = sharedContext(parent, entry.report);
    if (view.kind === "summary")
        return ok({
            kind: "summary",
            view,
            ...shared,
            summary: context,
            coverage: completeWithinViewCoverage(1, 1),
        });
    const rows = filterRows(entry, view), items = selectedItems(entry, view, rows);
    return ok({
        kind: "function-matches",
        view,
        ...shared,
        ...context,
        items,
        coverage: pageViewCoverage(view.offset, items.length, rows.length),
    });
};
