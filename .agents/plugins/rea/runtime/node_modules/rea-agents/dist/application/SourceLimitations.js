import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
/** Stable exact-provenance key for deduplication before rendering. */
export const sourceLimitationKey = ({ provider, operation, limitation, }) => JSON.stringify([
    provider.id,
    provider.name,
    provider.version,
    operation,
    limitation,
]);
/** Render unique source caveats without losing their provider or operation. */
export const renderSourceLimitations = (limitations) => {
    const groups = new Map();
    for (const { provider, operation, limitation } of limitations) {
        const key = JSON.stringify([
            provider.id,
            provider.name,
            provider.version,
            limitation,
        ]);
        const group = groups.get(key) ?? {
            provider,
            limitation,
            operations: new Set(),
        };
        group.operations.add(operation);
        groups.set(key, group);
    }
    return [...groups.values()]
        .map(({ provider, limitation, operations }) => {
        const version = provider.version === null ? "" : ` ${provider.version}`;
        const operationList = [...operations].sort(compareUnicodeCodePoints);
        return `${provider.name} (${provider.id}${version}) ${operationList.join(", ")}: ${limitation}`;
    })
        .sort(compareUnicodeCodePoints);
};
