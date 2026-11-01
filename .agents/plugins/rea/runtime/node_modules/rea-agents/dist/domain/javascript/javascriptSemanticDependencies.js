/**
 * Identity layout belongs to the indexed state, not to a query or its effects.
 * Every proof has the same height. Union shares unchanged branches, so aliases
 * add a path rather than copying their dependency's transitive membership set.
 */
export class SemanticDependencyProofs {
    layout;
    // Proofs are immutable; the same pair always produces the same union.
    // This cache belongs to one query, while its immutable identity layout is
    // shared across queries. Weak keys also release unused pairs within a query.
    unions = new WeakMap();
    constructor(layout) {
        this.layout = layout;
    }
    static forBindings(bindings) {
        const indices = new Map();
        for (const binding of bindings)
            indices.set(binding, indices.size);
        return new SemanticDependencyProofs({
            indices,
            singletons: new Map(),
            height: Math.ceil(Math.log2(Math.max(1, indices.size))),
        });
    }
    /** Share identity proofs while retaining unions for only one query. */
    forQuery() {
        return new SemanticDependencyProofs(this.layout);
    }
    binding(binding) {
        const prior = this.layout.singletons.get(binding);
        if (prior !== undefined)
            return prior;
        const index = this.index(binding);
        let proof = true;
        for (let bit = 0; bit < this.layout.height; bit++) {
            const one = Math.floor(index / 2 ** bit) % 2 === 1;
            proof = Object.freeze({
                zero: one ? undefined : proof,
                one: one ? proof : undefined,
            });
        }
        this.layout.singletons.set(binding, proof);
        return proof;
    }
    union(first, second) {
        if (first === second || second === undefined)
            return first;
        if (first === undefined)
            return second;
        if (first === true || second === true)
            return true;
        const cached = this.unions.get(first)?.get(second) ??
            this.unions.get(second)?.get(first);
        if (cached !== undefined)
            return cached;
        const zero = this.union(first.zero, second.zero);
        const one = this.union(first.one, second.one);
        const result = zero === first.zero && one === first.one
            ? first
            : zero === second.zero && one === second.one
                ? second
                : Object.freeze({ zero, one });
        let unions = this.unions.get(first);
        if (unions === undefined) {
            unions = new WeakMap();
            this.unions.set(first, unions);
        }
        unions.set(second, result);
        return result;
    }
    intersects(proof, active) {
        for (const binding of active.keys())
            if (this.has(proof, binding))
                return true;
        return false;
    }
    has(proof, binding) {
        const index = this.index(binding);
        for (let bit = this.layout.height - 1; bit >= 0; bit--) {
            if (proof === undefined)
                return false;
            if (proof === true)
                return true;
            proof = Math.floor(index / 2 ** bit) % 2 === 1 ? proof.one : proof.zero;
        }
        return proof === true;
    }
    index(binding) {
        const index = this.layout.indices.get(binding);
        if (index === undefined)
            throw new TypeError(`Unindexed semantic dependency: ${binding}`);
        return index;
    }
}
