import { managedDecodeBudget } from "./ManagedDecodeBudget.js";
import { metadataRowCursor, metadataToken } from "./ManagedMetadataHeaps.js";
import { memberListIndexSize, memberListTable, validatedMemberListStart, } from "./ManagedMemberPointers.js";
export const readTypeMemberListFacts = (bytes, layout) => {
    const fields = memberListTable(layout, 4);
    const methods = memberListTable(layout, 6);
    const rows = [];
    const issues = [];
    const types = layout.table(2);
    const typeCount = types?.rowCount ?? 0;
    // Peak retained shape includes both the parsed-start and range arrays, their
    // nested records, plus each eventual JSON object/key projection. Malformed
    // row diagnostics are admitted separately before they are allocated.
    managedDecodeBudget(layout).reserve(typeCount * 512 + 256, types?.offset ?? null);
    for (let row = 1; row <= typeCount; row += 1) {
        const cursor = metadataRowCursor(bytes, layout, 2, row);
        cursor.readUInt32();
        cursor.readIndex(layout.stringIndexSize);
        cursor.readIndex(layout.stringIndexSize);
        cursor.readIndex(layout.codedIndexSize("TypeDefOrRef"));
        const field = {
            offset: cursor.offset,
            raw: cursor.readIndex(memberListIndexSize(layout, 4)),
        };
        const method = {
            offset: cursor.offset,
            raw: cursor.readIndex(memberListIndexSize(layout, 6)),
        };
        const entry = {
            field: { ...field, value: validatedMemberListStart(field.raw, fields) },
            method: {
                ...method,
                value: validatedMemberListStart(method.raw, methods),
            },
        };
        rows.push(entry);
        for (const [name, start, table] of [
            ["FieldList", entry.field, fields],
            ["MethodList", entry.method, methods],
        ])
            if (start.value === null) {
                managedDecodeBudget(layout).reserve(512, start.offset);
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.TypeDef:${metadataToken(2, row)}`,
                    offset: start.offset,
                    detail: `TypeDef ${name} start ${String(start.raw)} is outside the one-based list range 1..${String((table?.rowCount ?? 0) + 1)}`,
                });
            }
    }
    const nonmonotonicFields = new Set();
    const nonmonotonicMethods = new Set();
    for (let index = 0; index + 1 < rows.length; index += 1) {
        const current = rows[index];
        const next = rows[index + 1];
        if (current === undefined || next === undefined)
            continue;
        for (const [name, before, after, affected] of [
            ["FieldList", current.field, next.field, nonmonotonicFields],
            ["MethodList", current.method, next.method, nonmonotonicMethods],
        ])
            if (before.value !== null &&
                after.value !== null &&
                after.value < before.value) {
                managedDecodeBudget(layout).reserve(512, after.offset);
                affected.add(index);
                affected.add(index + 1);
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.TypeDef:${metadataToken(2, index + 2)}`,
                    offset: after.offset,
                    detail: `TypeDef ${name} start ${String(after.raw)} decreases from preceding start ${String(before.raw)}; adjacent member ranges are unknown`,
                });
            }
    }
    const entries = rows.map((entry, index) => {
        const next = rows[index + 1];
        return {
            field: {
                start: {
                    ...entry.field,
                    value: nonmonotonicFields.has(index) ? null : entry.field.value,
                },
                end: next === undefined
                    ? (fields?.rowCount ?? 0) + 1
                    : nonmonotonicFields.has(index) || nonmonotonicFields.has(index + 1)
                        ? null
                        : next.field.value,
            },
            method: {
                start: {
                    ...entry.method,
                    value: nonmonotonicMethods.has(index) ? null : entry.method.value,
                },
                end: next === undefined
                    ? (methods?.rowCount ?? 0) + 1
                    : nonmonotonicMethods.has(index) ||
                        nonmonotonicMethods.has(index + 1)
                        ? null
                        : next.method.value,
            },
        };
    });
    return { entries, issues };
};
