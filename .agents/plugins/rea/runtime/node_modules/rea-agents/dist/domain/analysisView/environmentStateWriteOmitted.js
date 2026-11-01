import { at, isObject, listItems, projectsFields, scalarText, } from "./environmentStateRules.js";
import { succeeded, } from "./environmentStateWriteChecks.js";
/**
 * Fields a type's recordings always carried that a later successful whole read shows the
 * application leaves out of an entity the state holds, as APIs that omit empty or false members
 * do: no entity of the type must carry them, in any of its views.
 */
export class OmittedFields {
    retain;
    #omitted = new Map();
    constructor(retain) {
        this.retain = retain;
    }
    /** Check an item or list read with the fields reads showed omitted, this one's included, no longer required, naming this one's in the outcome. */
    check(state, view, record, read, compare) {
        const omitted = lackedFields(state, view, record, read);
        const noted = this.#omitted.get(view.type);
        const loosened = relaxed(view, omitted.length === 0 ? noted : new Set([...(noted ?? []), ...omitted]));
        const outcome = compare(loosened);
        return outcome === undefined ? undefined : { ...outcome, omitted };
    }
    /** Note the fields a read the gate counts shows left out, so no view of its type requires them. */
    keep(view, outcome) {
        if (view.shape !== "item" && view.shape !== "list")
            return;
        for (const field of outcome.omitted ?? [])
            this.#note(view.type, field);
    }
    /** The current required-field facts, shared by observations, checks and final output. */
    view(view) {
        return view.shape === "item" || view.shape === "list"
            ? relaxed(view, this.#omitted.get(view.type))
            : view;
    }
    /** The views with the fields reads showed omitted no longer required. */
    views(views) {
        return views.map((view) => this.view(view));
    }
    #note(type, field) {
        let fields = this.#omitted.get(type);
        if (fields === undefined) {
            fields = new Set();
            this.#omitted.set(type, fields);
        }
        if (!fields.has(field)) {
            this.retain(64 + field.length * 2);
            fields.add(field);
        }
    }
}
/** The required fields a successful whole read's held entities lack. */
const lackedFields = (state, view, record, read) => {
    if (!succeeded(record) ||
        read.body === undefined ||
        projectsFields(record.query))
        return [];
    const lacked = new Set();
    for (const entity of heldEntities(state, view, read))
        for (const field of view.required_fields)
            if (!Object.hasOwn(entity, field))
                lacked.add(field);
    return [...lacked];
};
/** The entities a read shows that the state holds: an item read's object naming the path's id, a list read's items. */
const heldEntities = (state, view, read) => {
    const object = view.shape === "item" ? at(read.body, view.pointer) : null;
    const shown = view.shape === "list"
        ? (listItems(read.body, view.pointer) ?? [])
        : isObject(object) &&
            read.itemId !== undefined &&
            scalarText(object[read.idField]) === read.itemId
            ? [object]
            : [];
    return shown.filter((entity) => {
        const id = scalarText(entity[read.idField]);
        return (id !== undefined &&
            state.entity(view.type, read.collection, id) !== undefined);
    });
};
const relaxed = (view, omitted) => omitted === undefined
    ? view
    : {
        ...view,
        required_fields: view.required_fields.filter((field) => !omitted.has(field)),
    };
