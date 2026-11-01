import { nextSequence } from "../../domain/analysisView/environmentStateWriteValues.js";
import { AnalysisInputError, AnalysisResourceConstraintError, } from "../../domain/analysisErrorCore.js";
import { jsonByteLength } from "../../domain/jsonSerialization.js";
import { err, ok } from "../../domain/result.js";
import { compositeKey } from "../../domain/unicodeCodePointOrder.js";
import { ENVIRONMENT_SERVE_OPERATION } from "./environmentSource.js";
import { parseStateDocument, STATE_INTAKE_LIMIT_BYTES, } from "./environmentStateDocument.js";
/** Maximum logical budget for collection spellings added by served creates since reset/load. */
export const ENVIRONMENT_COLLECTION_HISTORY_LIMIT_BYTES = 1024 * 1024;
const collectionHistoryCost = (state, type, collection) => {
    // Account key bytes without building temporary key strings or a Set.
    let sequenceBytes = 0;
    for (const plan of state.writes.values()) {
        if (!plan.served || plan.target !== type)
            continue;
        for (const rule of plan.rules) {
            if (rule.rule === "sequence" && rule.scope === "collection")
                sequenceBytes +=
                    64 +
                        Buffer.byteLength(plan.tool, "utf8") +
                        1 +
                        Buffer.byteLength(rule.field, "utf8") +
                        1 +
                        Buffer.byteLength(collection, "utf8");
            else if (rule.rule === "identity" && rule.generator === "sequence")
                sequenceBytes +=
                    64 +
                        Buffer.byteLength(type, "utf8") +
                        1 +
                        Buffer.byteLength(rule.field, "utf8") +
                        1 +
                        Buffer.byteLength(collection, "utf8");
        }
    }
    return 64 + Buffer.byteLength(collection, "utf8") + sequenceBytes;
};
/** The bytes JSON writes for these array items and the commas between them. */
const itemsBytes = (items) => items.reduce((sum, item) => sum + jsonByteLength(item), 0) +
    Math.max(0, items.length - 1);
/** What `data/get` reports for some content of a state. */
const snapshotOf = (state, entities, documents) => ({
    rea_state: {
        version: 1,
        state_evidence_id: state.evidenceId,
        types: state.types,
        entities,
        documents,
    },
});
/** What `data/get` writes for a state as the Evidence holds it, in UTF-8 bytes, summed item by item. */
export const initialStateBytes = (state) => jsonByteLength(snapshotOf(state, [], [])) +
    itemsBytes(state.entities) +
    itemsBytes(state.documents);
/**
 * The live state one served environment answers from, shared by every MCP
 * session and the data plane. Mutations are synchronous and swap the whole
 * state, so every answer reads one consistent state. A mutation that would take
 * what `data/get` reports past the size `data/add` loads is refused, so that
 * report always loads back.
 */
export class EnvironmentStateStore {
    state;
    #entities = new Map();
    #collections = new Map();
    #typeCollections = new Map();
    #documents = new Map();
    #content = { entities: [], documents: [] };
    #types;
    #clockStart;
    /** What `data/get` writes for the current state, in UTF-8 bytes; kept by each mutation rather than reserialized. */
    #bytes = 0;
    /** The bytes of `data/get` with no entities or documents. */
    #frameBytes;
    #initialBytes;
    /** Served writes since the state was last reset or loaded: the clock's seconds and the generators' counter. */
    #writes = 0;
    /** The largest value each sequence has generated since the last reset or load, so a deleted entity's value is not reused. */
    #sequences = new Map();
    /** The entities the state held when it was last reset or loaded, whose values no sequence reuses either. */
    #started = [];
    /** The types a served create has added an entity to since the last reset or load. */
    #createdTypes = new Set();
    /** Baseline and post-start spellings kept known after their entities are deleted. */
    #knownCollections = new Map();
    /** Logical UTF-8 key bytes plus a 64-byte allowance per collection and potential sequence-key record. */
    #collectionHistoryBytes = 0;
    /** The collections of the Evidence's own state, which stay known after any load. */
    #evidenceCollections = new Map();
    constructor(state) {
        this.state = state;
        this.#types = new Map(state.types.map((type) => [type.collection_template, type]));
        this.#clockStart =
            state.writeClock === null ? 0 : Date.parse(state.writeClock);
        this.#frameBytes = jsonByteLength(snapshotOf(state, [], []));
        this.#initialBytes = initialStateBytes(state);
        this.reset();
    }
    /** Restore the initial state the Evidence holds; the clock and counter start again. */
    reset() {
        this.#install(this.state, this.#initialBytes);
        this.#evidenceCollections = this.#typeCollections;
        this.#restart();
    }
    /** Validate a caller-owned document and copy its JSON values before retaining them; the clock and counter start again. */
    replace(document) {
        return this.#replace(document, false);
    }
    /** Validate and retain a JSON document created exclusively by the serving boundary. */
    replaceOwnedDocument(document) {
        return this.#replace(document, true);
    }
    #replace(document, owned) {
        const content = parseStateDocument(this.state, document, owned);
        if (!content.ok)
            return content;
        // data/get writes members a document may omit, so the state it reports must still be one data/add loads.
        const bytes = this.#contentBytes(content.value);
        if (bytes > STATE_INTAKE_LIMIT_BYTES)
            return err(new AnalysisInputError(ENVIRONMENT_SERVE_OPERATION, {
                userMessage: `The state would exceed ${String(STATE_INTAKE_LIMIT_BYTES)} bytes as data/get writes it.`,
            }, [
                {
                    path: [],
                    reason: "out_of_range",
                    message: `would exceed ${String(STATE_INTAKE_LIMIT_BYTES)} bytes as data/get writes it`,
                    maximum: STATE_INTAKE_LIMIT_BYTES,
                },
            ]));
        this.#install(content.value, bytes);
        this.#restart();
        return ok(undefined);
    }
    /** The write a served call would be: its number since the last reset or load, and its clock instant, one second past the previous applied write. */
    pendingWrite() {
        const count = this.#writes + 1;
        return { count, clockMs: this.#clockStart + count * 1000 };
    }
    /** Count an applied write and keep the sequence values it took, so a refused call takes none. */
    commitWrite(sequences) {
        this.#writes += 1;
        for (const [key, value] of sequences) {
            const taken = this.#sequences.get(key);
            // No earlier value leaves this one in place, including when it is negative.
            this.#sequences.set(key, taken === undefined ? value : Math.max(taken, value));
        }
    }
    /** The next value of a sequence: the next held integer, else one past the later of that and the last value taken. */
    sequenceAfter(key, held) {
        return nextSequence(held, this.#sequences.get(key));
    }
    #restart() {
        this.#writes = 0;
        this.#sequences.clear();
        this.#started = this.#content.entities;
        this.#createdTypes.clear();
        this.#knownCollections.clear();
        this.#collectionHistoryBytes = 0;
        for (const [type, collections] of this.#typeCollections)
            for (const collection of collections)
                this.#rememberCollection(type, collection);
        for (const [type, collections] of this.#evidenceCollections)
            for (const collection of collections)
                this.#rememberCollection(type, collection);
    }
    #rememberCollection(type, collection) {
        const known = this.#knownCollections.get(type) ?? new Set();
        known.add(collection);
        this.#knownCollections.set(type, known);
    }
    /** The entities of a type the state held when it was last reset or loaded. */
    /** Whether a served create has added an entity of the type since the last reset or load. */
    createdInto(type) {
        return this.#createdTypes.has(type);
    }
    startedWith(type) {
        return this.#started.filter((entity) => entity.type === type);
    }
    /** Every held entity of a type, in state order. */
    ofType(type) {
        return this.#content.entities.filter((entity) => entity.type === type);
    }
    /** Add an entity at `index` of its collection's order, unless the state would outgrow what `data/add` loads. */
    insert(entity, index) {
        const entities = this.#content.entities;
        const bytes = this.#grown(jsonByteLength(entity) + (entities.length > 0 ? 1 : 0));
        if (!bytes.ok)
            return bytes;
        const known = this.#knownCollections.get(entity.type);
        const newCollectionBytes = known?.has(entity.collection) === true
            ? 0
            : collectionHistoryCost(this.state, entity.type, entity.collection);
        if (newCollectionBytes > 0) {
            const historyBytes = this.#collectionHistoryBytes + newCollectionBytes;
            if (historyBytes > ENVIRONMENT_COLLECTION_HISTORY_LIMIT_BYTES)
                return err(new AnalysisResourceConstraintError(ENVIRONMENT_SERVE_OPERATION, "capacity", "Served collection history would exceed its deterministic accounting budget", {
                    max_collection_history_bytes: ENVIRONMENT_COLLECTION_HISTORY_LIMIT_BYTES,
                    collection_history_bytes: historyBytes,
                }, {
                    retryable: false,
                    remediationAction: "Reset the served state or load a smaller state to clear generated collection history, then use fewer distinct collection paths.",
                }));
        }
        const members = this.inCollection(entity.type, entity.collection);
        const anchor = index < members.length
            ? entities.indexOf(members[index])
            : members.length > 0
                ? entities.indexOf(members.at(-1)) + 1
                : entities.length;
        this.#install({
            ...this.#content,
            entities: [
                ...entities.slice(0, anchor),
                entity,
                ...entities.slice(anchor),
            ],
        }, bytes.value);
        if (newCollectionBytes > 0) {
            this.#rememberCollection(entity.type, entity.collection);
            this.#collectionHistoryBytes += newCollectionBytes;
        }
        this.#createdTypes.add(entity.type);
        return ok(undefined);
    }
    /** Replace a held entity's values in place, unless the state would outgrow what `data/add` loads. */
    update(entity) {
        return this.updateAll([entity]);
    }
    /** Replace held entities in one step, unless the state would outgrow what `data/add` loads; a refusal changes nothing. */
    updateAll(entities) {
        const replaced = new Map();
        for (const entity of entities) {
            const held = this.#entities.get(compositeKey([entity.type, entity.collection, entity.id]));
            if (held !== undefined)
                replaced.set(held, entity);
        }
        if (replaced.size === 0)
            return ok(undefined);
        // Sized from the replacements installed, so an entity named twice counts once.
        let delta = 0;
        for (const [held, entity] of replaced)
            delta += jsonByteLength(entity) - jsonByteLength(held);
        const bytes = this.#grown(delta);
        if (!bytes.ok)
            return bytes;
        this.#install({
            ...this.#content,
            entities: this.#content.entities.map((candidate) => replaced.get(candidate) ?? candidate),
        }, bytes.value);
        return ok(undefined);
    }
    remove(entity) {
        this.removeAll([entity]);
    }
    /** Remove held entities in one step. */
    removeAll(entities) {
        const held = new Set(entities.flatMap((entity) => {
            const found = this.#entities.get(compositeKey([entity.type, entity.collection, entity.id]));
            return found === undefined ? [] : [found];
        }));
        if (held.size === 0)
            return;
        const kept = this.#content.entities.filter((candidate) => !held.has(candidate));
        let bytes = this.#bytes;
        for (const entity of held)
            bytes -= jsonByteLength(entity);
        // Each removed entity takes its separator, except the last one an emptied list had none for.
        bytes -= held.size - (kept.length === 0 ? 1 : 0);
        this.#install({ ...this.#content, entities: kept }, bytes);
    }
    /** Set a held document's value, unless the state would outgrow what `data/add` loads; a value that is not the Evidence's cites no record. */
    setDocument(tool, value) {
        const held = this.#documents.get(tool);
        if (held === undefined)
            return ok(undefined);
        const written = { tool: held.tool, path: held.path, value };
        const bytes = this.#grown(jsonByteLength(written) - jsonByteLength(held));
        if (!bytes.ok)
            return bytes;
        this.#install({
            ...this.#content,
            documents: this.#content.documents.map((document) => document === held ? written : document),
        }, bytes.value);
        return ok(undefined);
    }
    /** The state's bytes after a change of `delta`, or a refusal when a change that grows it would pass the intake limit. */
    #grown(delta) {
        const bytes = this.#bytes + delta;
        if (delta <= 0 || bytes <= STATE_INTAKE_LIMIT_BYTES)
            return ok(bytes);
        return err(new AnalysisResourceConstraintError(ENVIRONMENT_SERVE_OPERATION, "capacity", "The write would take the served state past the size data/add loads", { max_state_bytes: STATE_INTAKE_LIMIT_BYTES, state_bytes: bytes }, {
            retryable: false,
            remediationAction: "Delete entities, or restore a smaller state with data/reset or data/add.",
        }));
    }
    type(collectionTemplate) {
        return this.#types.get(collectionTemplate);
    }
    entity(type, collection, id) {
        return this.#entities.get(compositeKey([type, collection, id]));
    }
    /** One collection's entities in state order. */
    inCollection(type, collection) {
        return this.#collections.get(compositeKey([type, collection])) ?? [];
    }
    /** The collections holding entities of one type, in state order of their first entity. */
    collectionsOf(type) {
        return this.#typeCollections.get(type) ?? [];
    }
    /** Every collection spelling in the active, baseline, Evidence, or generated history, with active entities first. */
    knownCollectionsOf(type) {
        const known = new Set([
            ...this.collectionsOf(type),
            ...(this.#knownCollections.get(type) ?? []),
        ]);
        return [...known];
    }
    document(tool) {
        return this.#documents.get(tool);
    }
    snapshot() {
        return snapshotOf(this.state, this.#content.entities, this.#content.documents);
    }
    /** What `data/get` writes for the current state, in UTF-8 bytes. */
    byteLength() {
        return this.#bytes;
    }
    /** What `data/get` writes for some content, summed item by item so the whole state is never one string. */
    #contentBytes(content) {
        return (this.#frameBytes +
            itemsBytes(content.entities) +
            itemsBytes(content.documents));
    }
    /** Build current-state indexes without copying baseline collections into generated history. */
    #install(content, bytes) {
        const entities = new Map();
        const collections = new Map();
        const typeCollections = new Map();
        for (const entity of content.entities) {
            entities.set(compositeKey([entity.type, entity.collection, entity.id]), entity);
            const key = compositeKey([entity.type, entity.collection]);
            const members = collections.get(key);
            if (members !== undefined) {
                members.push(entity);
                continue;
            }
            collections.set(key, [entity]);
            const named = typeCollections.get(entity.type);
            if (named === undefined)
                typeCollections.set(entity.type, [entity.collection]);
            else
                named.push(entity.collection);
        }
        this.#entities = entities;
        this.#collections = collections;
        this.#typeCollections = typeCollections;
        this.#documents = new Map(content.documents.map((document) => [document.tool, document]));
        this.#content = content;
        this.#bytes = bytes;
    }
}
