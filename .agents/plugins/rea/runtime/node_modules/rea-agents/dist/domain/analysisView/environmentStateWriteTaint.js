import { isParam, normalizedPath, pathSegmentMatches, segmentsOf, } from "./environmentStateRules.js";
import { collectionTarget, documentTarget, entityTarget, heldCollection, itemTarget, } from "./environmentStateWriteChecks.js";
import { prefixRelated } from "./environmentStateWriteRules.js";
/**
 * What writes the gate does not model leave unknown: an entity below whose item path one wrote,
 * or every entity of a collection when the path names none it holds (until a read shows each
 * again); a collection one wrote at; everything under a path one wrote above collections; and
 * targets whose check failed.
 */
export class WriteTaint {
    types;
    documents;
    state;
    #prefixes = [];
    #targets = new Set();
    #entities = new Set();
    /** Collections whose entities are all unknown, with the ones a read has shown since. */
    #collections = new Map();
    constructor(types, documents, state) {
        this.types = types;
        this.documents = documents;
        this.state = state;
    }
    /** Record an unmodelled write's path against every related type and document, naming entities and collections as modelled writes do. */
    write(path) {
        const segments = segmentsOf(path);
        for (const type of this.types) {
            if (!prefixRelated(type, path))
                continue;
            const depth = segmentsOf(type).length;
            const written = `/${segments.slice(0, depth).join("/")}`;
            const collection = () => collectionTarget(type, heldCollection(this.state, type, written));
            if (segments.length > depth) {
                const item = itemTarget(this.state, type, {
                    path: `${written}/${segments[depth]}`,
                });
                if (this.state.entity(type, item.collection, item.id) !== undefined)
                    this.#entities.add(entityTarget(type, item.collection, item.id));
                else
                    this.#collections.set(collection(), new Set());
            }
            else if (segments.length === depth)
                this.#targets.add(collection());
            else
                this.#prefixes.push(normalizedPath(path));
        }
        for (const [tool, documentPath] of this.documents)
            if (prefixRelated(documentPath, path))
                this.#targets.add(documentTarget(tool));
    }
    /** Stop checking a target whose check failed. */
    fail(target) {
        this.#targets.add(target);
    }
    tainted(target) {
        return this.#targets.has(target);
    }
    /** Whether an unmodelled write above a collection path left everything under it unknown, each collection segment matching the write's verbatim or either once percent-decoded. */
    under(collection) {
        const concrete = segmentsOf(collection);
        return this.#prefixes.some((prefix) => segmentsOf(prefix).every((segment, index) => isParam(segment) ||
            pathSegmentMatches(concrete[index] ?? "", segment)));
    }
    unknown(type, collection, id) {
        const target = entityTarget(type, collection, id);
        const seen = this.#collections.get(collectionTarget(type, collection));
        return (this.#entities.has(target) || (seen !== undefined && !seen.has(target)));
    }
    /** Whether a list read of a collection lists, or holds, an entity left unknown. */
    blocksList(type, collection, ids) {
        return (this.#collections.has(collectionTarget(type, collection)) ||
            ids.some((id) => this.#entities.has(entityTarget(type, collection, id))));
    }
    /** The state saw the entity again, or a modelled write replaced it. */
    known(type, collection, id) {
        const target = entityTarget(type, collection, id);
        this.#entities.delete(target);
        this.#collections.get(collectionTarget(type, collection))?.add(target);
    }
}
