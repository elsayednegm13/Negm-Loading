/** The serialized size of what a property's schema adds to its type and description, charged against the catalog budget like text. */
export const schemaBytes = (property) => {
    const added = [
        property.items,
        property.enum,
        property.const,
        property.properties,
        property.required,
    ];
    return added.every((part) => part === undefined)
        ? 0
        : 6 * JSON.stringify(added).length;
};
