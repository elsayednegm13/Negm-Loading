import { jsonValueByteLength } from "../jsonValueByteLength.js";
/**
 * Admit this optional facet inside the enclosing result's actual remaining
 * serialized bytes. The serialization owner supplies the space after all
 * existing facts and this member's key/colon/comma; no worker protocol lives here.
 * Omission means even a capacity envelope cannot fit, never an empty measurement.
 */
export const fitJavaScriptRouteSourceFacts = (facts, availableBytes) => {
    if (availableBytes <= 0)
        return undefined;
    if (jsonValueByteLength(facts, availableBytes) <= availableBytes)
        return facts;
    const result = {
        candidates: [],
        unresolved: [],
        capacity: {
            kind: "result-bytes",
            limit_bytes: availableBytes,
            preceding_work_capacity: facts.capacity === null
                ? null
                : facts.capacity.kind === "route-work-or-facts"
                    ? facts.capacity
                    : facts.capacity.preceding_work_capacity,
        },
    };
    let bytes = jsonValueByteLength(result, availableBytes);
    if (bytes > availableBytes)
        return undefined;
    const append = (source, output) => {
        for (const fact of source) {
            const added = jsonValueByteLength(fact, availableBytes - bytes) +
                (output.length === 0 ? 0 : 1);
            if (bytes + added > availableBytes)
                break;
            output.push(fact);
            bytes += added;
        }
    };
    // Preserve uncertainty before route candidates when a prefix must be returned.
    append(facts.unresolved, result.unresolved);
    append(facts.candidates, result.candidates);
    return result;
};
