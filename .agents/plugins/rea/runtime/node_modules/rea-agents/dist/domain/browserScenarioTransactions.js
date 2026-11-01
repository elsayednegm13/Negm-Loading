/** Index the captured transaction and source-event identities without interpreting content. */
export const indexBrowserScenarioTransactions = (events) => {
    const requestCounts = new Map();
    const responses = new Map();
    const contents = new Map();
    for (const event of events) {
        if (event.kind === "request")
            requestCounts.set(event.transaction_id, (requestCounts.get(event.transaction_id) ?? 0) + 1);
        else if (event.kind === "response")
            append(responses, event.transaction_id, event);
        else if (event.kind === "network-content")
            append(contents, event.source_event_sequence, event);
    }
    return { requestCounts, responses, contents };
};
const append = (map, key, value) => {
    const existing = map.get(key);
    if (existing === undefined)
        map.set(key, [value]);
    else
        existing.push(value);
};
