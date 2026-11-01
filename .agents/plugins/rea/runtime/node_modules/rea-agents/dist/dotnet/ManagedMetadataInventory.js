import { METADATA_TABLE_NAMES, } from "./ManagedMetadataLayout.js";
import { readAssembly, readAssemblyReference, readCustomAttribute, readModule, readResource, managedMetadataTypeNames, } from "./ManagedMetadataInventoryRows.js";
import { metadataToken } from "./ManagedMetadataHeaps.js";
import { appendManagedParseIssues, readManagedValue, uniqueManagedParseIssues, } from "./ManagedReaderFailure.js";
/** Map optional embedded resources without discarding admitted CLI metadata. */
export const readManagedResourceDirectory = (pe, issues) => {
    const resources = pe.cli?.resources;
    if (resources === undefined || (resources.rva === 0 && resources.size === 0))
        return null;
    return (readManagedValue(() => ({
        offset: pe.rvaToOffset(resources.rva, resources.size, "cli.resources"),
        size: resources.size,
    }), issues) ?? null);
};
const readRows = (descriptor, read) => {
    const total = descriptor?.rowCount ?? 0;
    const items = [];
    for (let index = 0; index < total; index += 1) {
        const item = read(index + 1);
        if (item !== undefined)
            items.push(item);
    }
    return items;
};
const heapExtent = (layout) => Math.max(layout.strings.size, layout.blob?.size ?? 0);
const validateIdentityTableCounts = (layout, issues) => {
    const moduleRows = layout.table(0)?.rowCount ?? 0;
    if (moduleRows !== 1)
        issues.push({
            code: "invalid-row",
            scope: "metadata.Module",
            offset: layout.table(0)?.offset ?? null,
            detail: `Module table must contain exactly one row; found ${String(moduleRows)}`,
        });
    const assemblyRows = layout.table(32)?.rowCount ?? 0;
    if (assemblyRows > 1)
        issues.push({
            code: "invalid-row",
            scope: "metadata.Assembly",
            offset: layout.table(32)?.offset ?? null,
            detail: `Assembly table can contain at most one row; found ${String(assemblyRows)}`,
        });
};
/** Module identity is independent of assembly references, attributes and resources. */
export const readManagedModuleIdentity = (bytes, layout) => {
    const issues = [];
    validateIdentityTableCounts(layout, issues);
    const module = readManagedValue(() => readModule(bytes, layout, heapExtent(layout)), issues) ?? null;
    return { module, issues };
};
const readReferences = (bytes, layout, issues) => {
    const references = readRows(layout.table(35), (row) => readManagedValue(() => readAssemblyReference(bytes, layout, row, heapExtent(layout)), issues));
    return {
        references,
        referenceNames: [...new Set(references.map(({ name }) => name))].sort(),
    };
};
const readResources = ({ bytes, layout, resourceDirectory, issues, }) => readRows(layout.table(40), (row) => readManagedValue(() => readResource({
    bytes,
    layout,
    row,
    directory: resourceDirectory,
    issues,
}), issues));
const readAttributes = (bytes, layout, issues, memberLists, typeNames) => {
    const attributes = readRows(layout.table(12), (row) => readManagedValue(() => readCustomAttribute(bytes, layout, row, heapExtent(layout), issues, memberLists, typeNames), issues));
    const targetFrameworks = new Set();
    for (const attribute of attributes) {
        if (attribute.parent_token === metadataToken(32, 1) &&
            attribute.type_name ===
                "System.Runtime.Versioning.TargetFrameworkAttribute" &&
            attribute.decoded_fixed_string !== null)
            targetFrameworks.add(attribute.decoded_fixed_string);
    }
    return { attributes, targetFrameworks: [...targetFrameworks].sort() };
};
/** Inventory identity tables without CLR reflection or execution. */
export const readManagedMetadataInventory = (bytes, layout, resourceDirectory, memberLists, identity = readManagedModuleIdentity(bytes, layout), typeNames) => {
    const issues = [...memberLists.issues];
    appendManagedParseIssues(issues, identity.issues);
    const { module } = identity;
    const assembly = readManagedValue(() => readAssembly(bytes, layout, heapExtent(layout)), issues) ?? null;
    const { references, referenceNames } = readReferences(bytes, layout, issues);
    const resources = readResources({
        bytes,
        layout,
        resourceDirectory,
        issues,
    });
    const { attributes, targetFrameworks } = readAttributes(bytes, layout, issues, memberLists, typeNames ?? managedMetadataTypeNames(bytes, layout, issues));
    return {
        module,
        assembly,
        targetFrameworks,
        referenceNames,
        references,
        resources,
        attributes,
        issues: uniqueManagedParseIssues(issues),
    };
};
/** Stable table-name/count projection for caller-visible coverage. */
export const managedTableRowCounts = (layout) => Object.fromEntries([...layout.tables.values()].map(({ index, rowCount }) => [
    METADATA_TABLE_NAMES[index] ?? `Table${String(index)}`,
    rowCount,
]));
