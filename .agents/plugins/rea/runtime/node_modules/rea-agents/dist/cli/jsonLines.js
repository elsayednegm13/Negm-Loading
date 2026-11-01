import { err, ok } from "../domain/result.js";
import { AnalysisOutputError } from "../domain/analysisErrorCore.js";
import { jsonParts } from "../domain/jsonSerialization.js";
/** Reserved control-record marker, not an advertised external JSON Schema. */
export const JSON_LINES_PROTOCOL = "jsonl/v1";
const COLLECTION_KEYS = ["rows", "items", "records", "occurrences"];
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const atPath = (value, path) => {
    for (const key of path) {
        if (!isRecord(value) || !Object.hasOwn(value, key))
            return undefined;
        value = value[key];
    }
    return value;
};
const collections = (value, prefix) => {
    if (Array.isArray(value))
        return [{ records: value, path: prefix }];
    if (!isRecord(value))
        return [];
    const found = [];
    const collect = (object, path) => {
        for (const key of COLLECTION_KEYS) {
            const records = object[key];
            if (Object.hasOwn(object, key) && Array.isArray(records))
                found.push({ records, path: [...path, key] });
        }
    };
    collect(value, prefix);
    if (Object.hasOwn(value, "page") && isRecord(value.page))
        collect(value.page, [...prefix, "page"]);
    return found;
};
const documentCollections = (value, fullOutput) => {
    const prefix = fullOutput ? ["data"] : [];
    const data = atPath(value, prefix);
    return [
        ...collections(data, prefix),
        ...collections(atPath(data, ["normalized_result"]), [
            ...prefix,
            "normalized_result",
        ]),
    ];
};
/** Shallow copies only ancestors of the emitted array; every other fact survives. */
const withoutRecords = (source, selected, path, filtered) => {
    if (path.length === 0 || !isRecord(source))
        return undefined;
    const context = { ...source };
    const selectedObject = isRecord(selected) ? selected : undefined;
    // A data filter intentionally excludes raw observation payloads. Keep its
    // selected raw value if requested, while always retaining Evidence provenance.
    if (filtered &&
        Object.hasOwn(source, "evidence_id") &&
        typeof source.evidence_id === "string" &&
        Object.hasOwn(source, "normalized_result")) {
        if (selectedObject && Object.hasOwn(selectedObject, "raw_result"))
            context.raw_result = selectedObject.raw_result;
        else
            delete context.raw_result;
    }
    const [key, ...rest] = path;
    if (key === undefined)
        return context;
    if (rest.length === 0)
        delete context[key];
    else
        context[key] = withoutRecords(source[key], selectedObject?.[key], rest, filtered);
    return context;
};
/** Project a clear collection without interpreting or whitelisting its context. */
export const prepareJsonLines = (selected, options) => {
    const found = documentCollections(selected, options.fullOutput === true);
    const reject = (reason) => err(new AnalysisOutputError(options.command, reason, {
        remediationAction: "Use --format json for the complete document, or select one record collection with --filter-output.",
    }));
    if (found.length !== 1)
        return reject(found.length === 0
            ? "JSON Lines requires an array or one explicit rows, items, records, or occurrences collection."
            : "JSON Lines cannot choose between multiple record collections. Select one collection explicitly.");
    const collection = found[0];
    if (collection === undefined)
        return reject("The record collection is unavailable.");
    for (const record of collection.records) {
        if (isRecord(record) && Object.hasOwn(record, "$rea"))
            return reject("A data record uses the reserved $rea JSON Lines control marker.");
    }
    const source = Object.hasOwn(options, "source") ? options.source : selected;
    const originalRecords = atPath(source, collection.path);
    const sourceMatches = Array.isArray(originalRecords);
    let context = withoutRecords(sourceMatches ? source : selected, selected, collection.path, options.filter !== undefined);
    if (options.filter !== undefined && sourceMatches) {
        // Excluded peer rows are data, not context. A filter can disambiguate them
        // without restoring an unselected collection into the final record.
        for (const peer of documentCollections(source, options.fullOutput === true)) {
            if (peer.path.join(".") !== collection.path.join("."))
                context = withoutRecords(context, selected, peer.path, true);
        }
    }
    return ok({
        ...collection,
        context,
        sourceRecords: sourceMatches ? originalRecords.length : null,
        filter: options.filter,
    });
};
/** The caller supplies the outcome; error-shaped data is never reclassified here. */
export const jsonLinesErrorRecord = (result) => ({
    $rea: JSON_LINES_PROTOCOL,
    type: "error",
    ok: false,
    result,
});
export function* jsonLinesParts(plan) {
    for (const record of jsonLinesRecords(plan)) {
        yield* jsonLineParts(record);
    }
}
/** One record stays one line even when the record itself is an array. */
export function* jsonLineParts(record) {
    yield* jsonParts(record);
    yield "\n";
}
/** Newline-separated records also bound the token estimator's working set. */
export function* jsonLinesRecords(plan) {
    yield* plan.records;
    if (plan.context !== undefined || plan.path.length > 0) {
        const metadata = {
            $rea: JSON_LINES_PROTOCOL,
            type: "metadata",
            records: {
                path: plan.path,
                emitted: plan.records.length,
                source: plan.sourceRecords,
                ...(plan.filter === undefined ? {} : { filter: plan.filter }),
            },
            context: plan.context ?? null,
        };
        yield metadata;
    }
}
