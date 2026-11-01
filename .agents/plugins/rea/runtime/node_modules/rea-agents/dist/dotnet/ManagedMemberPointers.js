import { managedDecodeBudget } from "./ManagedDecodeBudget.js";
import { managedFailure, ManagedReaderFailure, } from "./ManagedReaderFailure.js";
const lookups = new WeakMap();
/** TypeDef list coordinates refer to the nonempty pointer table when present. */
export const memberListTable = (layout, table) => {
    const pointers = layout.table(table - 1);
    return pointers !== undefined && pointers.rowCount > 0
        ? pointers
        : layout.table(table);
};
/** List columns must accommodate either physical definition or pointer rows. */
export const memberListIndexSize = (layout, table) => layout.tableIndexSize(table - 1) === 4 || layout.tableIndexSize(table) === 4
    ? 4
    : 2;
/** Normalize a TypeDef list coordinate once for parsing and owner lookup. */
export const validatedMemberListStart = (start, table) => {
    const total = table?.rowCount ?? 0;
    return Number.isSafeInteger(start) && start >= 1 && start <= total + 1
        ? start
        : null;
};
/** Resolve physical definition rows to list positions without changing token identity. */
export const memberListRowLookup = (bytes, layout, table) => {
    const pointers = layout.table(table - 1);
    if (pointers === undefined || pointers.rowCount === 0)
        return (row) => row;
    let byTable = lookups.get(layout);
    const cached = byTable?.get(table);
    if (cached instanceof ManagedReaderFailure)
        throw cached;
    if (cached !== undefined)
        return cached;
    const definitionCount = layout.table(table)?.rowCount ?? 0;
    // The layout already admitted the source table extent. Reserve retained index
    // storage and its fixed bookkeeping before allocating either container.
    managedDecodeBudget(layout).reserve((definitionCount + 1) * Uint32Array.BYTES_PER_ELEMENT + 256, pointers.offset);
    if (byTable === undefined) {
        byTable = new Map();
        lookups.set(layout, byTable);
    }
    const positions = new Uint32Array(definitionCount + 1);
    try {
        const width = layout.tableIndexSize(table);
        for (let row = 1; row <= pointers.rowCount; row += 1) {
            const offset = pointers.offset + (row - 1) * pointers.rowSize;
            const definition = width === 2 ? bytes.readUInt16LE(offset) : bytes.readUInt32LE(offset);
            if (definition === 0 || definition > definitionCount)
                throw managedFailure("invalid-row", `metadata.${pointers.name}`, `Pointer row ${String(row)} names an out-of-range definition row ${String(definition)}`, offset);
            if (positions[definition] !== 0)
                throw managedFailure("invalid-row", `metadata.${pointers.name}`, `Definition row ${String(definition)} has more than one pointer row; its declaring type is ambiguous`, offset);
            positions[definition] = row;
        }
        const lookup = (definition) => {
            const position = positions[definition] ?? 0;
            if (position === 0)
                throw managedFailure("invalid-row", `metadata.${pointers.name}`, `Definition row ${String(definition)} has no pointer row identifying its declaring type`, pointers.offset);
            return position;
        };
        byTable.set(table, lookup);
        return lookup;
    }
    catch (cause) {
        // Invalid metadata must not rebuild and charge the same retained index for
        // every attribute/member that asks for its owner.
        if (cause instanceof ManagedReaderFailure)
            byTable.set(table, cause);
        throw cause;
    }
};
