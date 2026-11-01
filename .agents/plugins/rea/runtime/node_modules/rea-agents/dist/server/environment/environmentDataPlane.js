import { ArtifactResourceScope } from "../../artifacts/ArtifactResourceScope.js";
import { CANCELLED, DEFAULT_STATE_INTAKE, invalidParams, partDocument, } from "./stateIntake.js";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const pointerSegment = (segment) => String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
/** The first document problem as `-32602`, located by a JSON pointer into the document. */
const documentError = (error) => {
    const issue = error.issues[0];
    const pointer = (issue?.path ?? [])
        .map((segment) => `/${pointerSegment(segment)}`)
        .join("");
    return invalidParams(`${pointer === "" ? "the document" : pointer} ${issue?.message ?? "is not a rea-state/v1 document"}`, pointer);
};
/** `data/add`: exactly one part, whose document replaces the whole state only when it is valid and the call was not cancelled. */
const addState = async ({ store, intake, cancel, files }, params) => {
    const parts = isRecord(params) ? params.parts : undefined;
    if (!Array.isArray(parts) || parts.length !== 1)
        return { error: invalidParams("data/add takes exactly one part") };
    const document = await partDocument(parts[0], intake, cancel, files);
    if (!document.ok)
        return { error: document.error };
    // A file read is not interruptible, so a cancellation during it is honoured here, before the state changes.
    if (cancel.aborted)
        return { error: CANCELLED };
    const replaced = store.replaceOwnedDocument(document.value);
    return replaced.ok
        ? { result: {} }
        : { error: documentError(replaced.error) };
};
const METHODS = new Map([
    [
        "data/reset",
        ({ store }) => {
            store.reset();
            return { result: {} };
        },
    ],
    ["data/add", addState],
    [
        "data/get",
        ({ store }) => ({
            result: { parts: [{ kind: "data", data: store.snapshot() }] },
        }),
    ],
]);
/**
 * `data/reset`, `data/add` and `data/get` over one live state. Calls run one
 * at a time in the order they are made, across requests, so a slow load never
 * overwrites a later reset and at most one loaded document is parsed at once.
 * Once `stopped` or a call's own signal aborts, its download ends and a call
 * not yet run is answered as cancelled. `files` keeps a state file whose close
 * failed and retries it before the next file read; its owner closes it at shutdown.
 */
export const stateDataPlane = (store, intake = DEFAULT_STATE_INTAKE, stopped = new AbortController().signal, files = new ArtifactResourceScope()) => {
    let previous = Promise.resolve();
    return (method, params, signal) => {
        const run = METHODS.get(method);
        if (run === undefined)
            return Promise.resolve(undefined);
        const cancel = signal === undefined ? stopped : AbortSignal.any([stopped, signal]);
        const next = previous.then(() => cancel.aborted
            ? { error: CANCELLED }
            : run({ store, intake, cancel, files }, params));
        previous = next.catch(() => undefined);
        return next;
    };
};
