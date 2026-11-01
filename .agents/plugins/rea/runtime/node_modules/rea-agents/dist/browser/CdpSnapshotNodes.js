import { err, ok } from "../domain/result.js";
import { numberValue, recordValue } from "./CdpCaptureValues.js";
import { cdpSnapshotString, cdpSnapshotValueString, } from "./CdpSnapshotStrings.js";
const integer = (value) => {
    const parsed = numberValue(value);
    return parsed !== undefined && Number.isSafeInteger(parsed)
        ? parsed
        : undefined;
};
const attributes = (value, strings) => {
    if (!Array.isArray(value) || value.length % 2 !== 0)
        return undefined;
    const pairs = [];
    for (let offset = 0; offset < value.length; offset += 2) {
        const name = cdpSnapshotString(strings, value[offset]);
        const text = cdpSnapshotValueString(strings, value[offset + 1]);
        if (name === undefined || text === undefined)
            return undefined;
        pairs.push([name, text]);
    }
    return pairs;
};
/** Remove only cyclic parent facts; descendants keep their directly observed links. */
const invalidateParentCycles = (parents) => {
    const state = new Uint8Array(parents.length);
    const path = [];
    for (let start = 0; start < parents.length; start += 1) {
        if (state[start] !== 0)
            continue;
        path.length = 0;
        let cursor = start;
        while (cursor >= 0 && state[cursor] === 0) {
            state[cursor] = 1;
            path.push(cursor);
            // Unknown ancestry ends this walk without inventing a root fact.
            cursor = parents[cursor] ?? -1;
        }
        if (cursor >= 0 && state[cursor] === 1)
            for (let index = path.indexOf(cursor); index < path.length; index += 1)
                parents[path[index]] = undefined;
        for (const index of path)
            state[index] = 2;
    }
};
/** One boundary owns aligned arrays, string references and parent validity. */
export const snapshotDocumentNodes = (value, strings) => {
    const raw = recordValue(value);
    if (raw === undefined ||
        !Array.isArray(raw.nodeType) ||
        !Array.isArray(raw.nodeName) ||
        !Array.isArray(raw.nodeValue) ||
        !Array.isArray(raw.parentIndex) ||
        !Array.isArray(raw.attributes))
        return undefined;
    const count = raw.nodeType.length;
    if (raw.nodeName.length !== count ||
        raw.nodeValue.length !== count ||
        raw.parentIndex.length !== count)
        return undefined;
    const parents = raw.parentIndex.map((value, index) => {
        const parent = integer(value);
        return parent !== undefined &&
            parent >= -1 &&
            parent < count &&
            parent !== index
            ? parent
            : undefined;
    });
    invalidateParentCycles(parents);
    const backend = Array.isArray(raw.backendNodeId) ? raw.backendNodeId : [];
    return {
        nodeTypes: raw.nodeType.map((value) => {
            const type = integer(value);
            return type !== undefined && type >= 0 ? type : undefined;
        }),
        nodeNames: raw.nodeName.map((value) => cdpSnapshotString(strings, value)),
        nodeValues: raw.nodeValue.map((value) => cdpSnapshotValueString(strings, value)),
        parents,
        attributes: raw.attributes
            .slice(0, count)
            .map((value) => attributes(value, strings)),
        backendNodeIds: backend.slice(0, count).map((value) => {
            const id = integer(value);
            return id !== undefined && id > 0 ? id : undefined;
        }),
        excessAttributes: Math.max(0, raw.attributes.length - count),
    };
};
/** Admit a DOM row from parsed facts without changing its source identity. */
export const snapshotNodeAt = (nodes, index) => {
    const nodeType = nodes.nodeTypes[index];
    const nodeName = nodes.nodeNames[index];
    const nodeValue = nodes.nodeValues[index];
    const parent = nodes.parents[index];
    const attributes = nodes.attributes[index];
    return nodeType === undefined ||
        nodeName === undefined ||
        nodeValue === undefined ||
        parent === undefined ||
        attributes === undefined
        ? err({ _tag: "InvalidCdpSnapshotNode", index })
        : ok({ nodeType, nodeName, nodeValue, parent, attributes });
};
