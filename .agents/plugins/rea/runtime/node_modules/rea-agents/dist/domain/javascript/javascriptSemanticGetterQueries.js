import { SEMANTIC_GETTER_EXPANSION_LIMIT } from "./javascriptSemanticResourceLimits.js";
/** References at different receiver allocations must not erase ownership. */
export class SemanticObjectReferenceSet {
    #nodes = new Map();
    #owners = new WeakMap();
    #ownerCount = 0;
    add(reference) {
        const owner = reference.ownerInitializer;
        if (owner !== undefined && !this.#owners.has(owner))
            this.#owners.set(owner, ++this.#ownerCount);
        // Escaping a primitive cannot cover a write to its slot; retain both effects.
        const key = JSON.stringify([
            reference.path,
            owner === undefined ? null : this.#owners.get(owner),
            reference.escapes === true,
            reference.widenedGetterResult === true,
        ]);
        const paths = this.#nodes.get(reference.node) ?? new Map();
        paths.set(key, reference);
        this.#nodes.set(reference.node, paths);
    }
    values() {
        return [...this.#nodes.values()].flatMap((paths) => [...paths.values()]);
    }
}
/** One syntax query owns its memo and worklist; no receiver evaluation is cached across mutations. */
export class SemanticGetterQuery {
    state;
    #memo = new WeakMap();
    #references = new SemanticObjectReferenceSet();
    #pending = [];
    #current;
    #limited = false;
    #visits = 0;
    #fallback = false;
    constructor(state) {
        this.state = state;
    }
    get widening() {
        return this.#fallback;
    }
    /** Charge retained local work and getter jobs to the same precise query. */
    reserveResult() {
        if (this.#limited)
            return false;
        if (!this.#fallback && this.#visits >= SEMANTIC_GETTER_EXPANSION_LIMIT) {
            this.#limited = true;
            return false;
        }
        this.#visits++;
        return true;
    }
    retain(reference, escapes = false) {
        // Direct fields keep their write suffix; only getter jobs widen omitted paths.
        this.#references.add({
            ...reference,
            ...(escapes ? { escapes: true } : {}),
            ...(this.#fallback && this.#current !== undefined
                ? { widenedGetterResult: true }
                : {}),
        });
    }
    #known(invocation, path, escapes) {
        const receiver = invocation.receiver ?? invocation.owner;
        const receivers = this.#memo.get(invocation.getter);
        const paths = receivers?.get(receiver);
        const key = JSON.stringify([path, escapes]);
        if (paths?.has(key))
            return true;
        if (!this.reserveResult())
            return true;
        const selections = paths ?? new Set();
        const owners = receivers ?? new WeakMap();
        selections.add(key);
        owners.set(receiver, selections);
        this.#memo.set(invocation.getter, owners);
        return false;
    }
    #ancestor(invocation) {
        const receiver = invocation.receiver ?? invocation.owner;
        for (let visit = this.#current?.ancestry; visit !== undefined; visit = visit.parent)
            if (visit.getter === invocation.getter && visit.receiver === receiver)
                return visit;
        return undefined;
    }
    #grows(invocation, path) {
        if (this.#fallback)
            return false;
        const previous = this.#ancestor(invocation);
        if (previous === undefined || previous.length >= path.length)
            return false;
        // Pruning by ancestry would make memo results depend on the first caller.
        // Widen growing cycles; identical finite cycles are handled by the memo alone.
        this.#limited = true;
        return true;
    }
    schedule(invocation, path, escaped = false) {
        if (this.#limited)
            return;
        const escapes = escaped || this.#fallback || this.#current?.escapes === true;
        const selection = this.#fallback ? [] : path;
        if (this.#grows(invocation, selection))
            return;
        if (this.#known(invocation, selection, escapes))
            return;
        this.#pending.push({
            invocation,
            path: selection,
            escapes,
            ancestry: {
                getter: invocation.getter,
                receiver: invocation.receiver ?? invocation.owner,
                length: selection.length,
                ...(this.#current === undefined
                    ? {}
                    : { parent: this.#current.ancestry }),
            },
        });
    }
    #collect(root, expand) {
        for (const reference of root())
            this.retain(reference);
        for (let cursor = 0; cursor < this.#pending.length && !this.#limited; cursor++) {
            const job = this.#pending[cursor];
            if (job === undefined)
                break;
            this.#current = job;
            expand(job);
        }
        this.#current = undefined;
    }
    run(root, expand) {
        this.#collect(root, expand);
        if (this.#limited) {
            this.state.getterResourceLimits.add("getter-expansion");
            // Escaping each selected getter's result covers every omitted suffix.
            // Canonical empty suffixes make the retry finite in receiver/getter pairs.
            this.#fallback = true;
            this.#limited = false;
            this.#memo = new WeakMap();
            this.#references = new SemanticObjectReferenceSet();
            this.#pending = [];
            this.#collect(root, expand);
        }
        return this.#references.values();
    }
}
