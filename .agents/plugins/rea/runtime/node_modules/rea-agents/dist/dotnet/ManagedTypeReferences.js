import { managedDecodeBudget } from "./ManagedDecodeBudget.js";
import { decodeMetadataCodedIndex, metadataRowCursor, metadataToken, readMetadataString, } from "./ManagedMetadataHeaps.js";
import { readManagedValue } from "./ManagedReaderFailure.js";
import { metadataRowOffset } from "./ManagedMetadataLayout.js";
/** Own each TypeRef source tuple and scope validation once per inspection. */
export const managedTypeReferences = (bytes, layout, issues) => {
    const rows = new Map();
    const names = new Map();
    const checked = new Map();
    const read = (row) => {
        const cached = rows.get(row);
        if (cached !== undefined)
            return cached;
        // Admit the parsed row, validation entry and bounded walk bookkeeping.
        managedDecodeBudget(layout).reserve(384, null);
        const value = readManagedValue(() => {
            const cursor = metadataRowCursor(bytes, layout, 1, row);
            const raw = cursor.readIndex(layout.codedIndexSize("ResolutionScope"));
            const scope = decodeMetadataCodedIndex(raw, 2, [0, 26, 35, 1], layout.rowCounts);
            if (scope.kind === "invalid")
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.TypeRef:${metadataToken(1, row)}`,
                    offset: cursor.start,
                    detail: `TypeRef ResolutionScope coded index 0x${raw.toString(16)} is invalid: ${scope.reason}`,
                });
            return {
                nameIndex: cursor.readIndex(layout.stringIndexSize),
                namespaceIndex: cursor.readIndex(layout.stringIndexSize),
                enclosingRow: scope.kind !== "null" && scope.table === 1 ? scope.row : null,
                scopeValid: scope.kind !== "invalid",
            };
        }, issues) ?? null;
        rows.set(row, value);
        return value;
    };
    const validate = (row) => {
        const prior = checked.get(row);
        if (prior !== undefined)
            return prior;
        const path = [];
        const seen = new Set();
        let current = row;
        let valid = true;
        while (current !== null) {
            const known = checked.get(current);
            if (known !== undefined) {
                valid = known;
                break;
            }
            if (seen.has(current)) {
                issues.push({
                    code: "invalid-row",
                    scope: `metadata.TypeRef:${metadataToken(1, current)}`,
                    offset: metadataRowOffset(layout, 1, current),
                    detail: "TypeRef ResolutionScope chain contains a cycle",
                });
                valid = false;
                break;
            }
            seen.add(current);
            path.push(current);
            const value = read(current);
            if (value === null || !value.scopeValid) {
                valid = false;
                break;
            }
            current = value.enclosingRow;
        }
        for (const visited of path)
            checked.set(visited, valid);
        return valid;
    };
    return (row) => {
        const cached = names.get(row);
        if (cached !== undefined)
            return cached;
        const value = read(row);
        if (value === null)
            return null;
        const scopeValid = validate(row);
        // Scope validation loads only scalar row facts. The digest owner's nesting
        // cap determines which names are requested, rather than preloading parents.
        managedDecodeBudget(layout).reserve(128, null);
        const named = readManagedValue(() => ({
            namespace: readMetadataString(bytes, layout, value.namespaceIndex, layout.strings.size),
            name: readMetadataString(bytes, layout, value.nameIndex, layout.strings.size),
            enclosingRow: value.enclosingRow,
            scopeValid,
        }), issues) ?? null;
        names.set(row, named);
        return named;
    };
};
