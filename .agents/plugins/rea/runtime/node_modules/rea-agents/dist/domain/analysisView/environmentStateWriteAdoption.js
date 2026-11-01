import { ENTRY_BYTES, textBytes } from "./webNetworkRouteTemplates.js";
import { at, isObject, stateValueRetentionBytes, scalarText, } from "./environmentStateRules.js";
import { collectionTarget, entityTarget, itemTarget, succeeded, } from "./environmentStateWriteChecks.js";
/**
 * Entities a write no built plan models made, such as rows an import or a nested create added: the
 * copy takes one when a successful item read first shows it, rather than failing the read. A call
 * of a built plan that serving would not apply keeps its evidence.
 */
export class UnseenEntities {
    facts;
    /** Targets of the entities the copy has held: the initial ones and any a modelled write or an adoption touched. */
    #held;
    /** Timeline indexes of writes no built plan models, and of redirected or unanswered ones. */
    #unplannedAt = [];
    constructor(initial, facts) {
        this.facts = facts;
        this.#held = new Set(initial.map((entity) => entityTarget(entity.type, entity.collection, entity.id)));
    }
    /** Note an entity a modelled write created, changed or removed, which no read takes back. */
    touched(entity) {
        const key = entityTarget(entity.type, entity.collection, entity.id);
        if (this.#held.has(key))
            return;
        this.facts.io.retain(ENTRY_BYTES + textBytes(key.length));
        this.#held.add(key);
    }
    /** Note a write no built plan models, or one redirected or unanswered. */
    unplanned(index) {
        this.facts.io.retain(ENTRY_BYTES);
        this.#unplannedAt.push(index);
    }
    /**
     * Put into the copy the entity a successful item read shows that the copy never held, when an
     * unplanned write ran since the entity or its collection was last checked; the entity taken, if any.
     */
    adopt(view, read) {
        const { record, index } = read;
        const { state, lastCheck } = this.facts;
        // Only an unplanned write before the read can have made what it shows, so its target is found only then.
        if (!succeeded(record) || !this.#unplannedAt.some((write) => write < index))
            return undefined;
        const { collection, id } = itemTarget(state, view.type, record);
        const key = entityTarget(view.type, collection, id);
        if (this.#held.has(key) || state.entity(view.type, collection, id))
            return undefined;
        const since = Math.max(lastCheck.get(key) ?? -1, lastCheck.get(collectionTarget(view.type, collection)) ?? -1);
        if (!this.#unplannedAt.some((write) => write > since && write < index))
            return undefined;
        const object = this.facts.io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
        const idField = this.facts.idField(view.type);
        if (!isObject(object) ||
            idField === undefined ||
            scalarText(object[idField]) !== id)
            return undefined;
        const entity = {
            type: view.type,
            collection,
            id,
            fields: object,
            view_fields: [],
            record_ordinals: [],
        };
        // The copy keeps the read's object, which the body's own reservation no longer covers.
        this.facts.io.retain(ENTRY_BYTES * 4 +
            textBytes(key.length) +
            stateValueRetentionBytes(object));
        state.put(entity);
        this.#held.add(key);
        return entity;
    }
}
