import { SEMANTIC_ALIAS_SELECTION_LIMIT } from "./javascriptSemanticResourceLimits.js";
export const semanticAliasSelectionChoices = (key) => key !== null && typeof key === "object" && "alternatives" in key
    ? key.alternatives
    : [key];
const selection = (choices) => {
    if (choices.includes(null))
        return null;
    const alternatives = [
        ...new Map(choices.map((choice) => [JSON.stringify(choice), choice])),
    ]
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([, choice]) => choice);
    return alternatives.length === 1 ? alternatives[0] : { alternatives };
};
const selectionCovers = (prior, next) => {
    if (prior === null)
        return true;
    const choices = new Set(semanticAliasSelectionChoices(prior).map((key) => JSON.stringify(key)));
    return semanticAliasSelectionChoices(next).every((key) => choices.has(JSON.stringify(key)));
};
const pathCovers = (prior, next) => prior.every((key, index) => next[index] !== undefined && selectionCovers(key, next[index]));
/** Only one differing selector can be joined without inventing crossed paths. */
const joinSelections = (prior, next) => {
    let changed = -1;
    for (let index = 0; index < prior.length; index++) {
        if (JSON.stringify(prior[index]) === JSON.stringify(next[index]))
            continue;
        if (changed !== -1)
            return undefined;
        changed = index;
    }
    return prior.map((key, index) => index === changed
        ? selection([
            ...semanticAliasSelectionChoices(key),
            ...semanticAliasSelectionChoices(next[index]),
        ])
        : key);
};
/** Preserve correlated selector alternatives while coalescing complete grids. */
export class SemanticAliasSelections {
    onLimit;
    #paths = new WeakMap();
    #calls = 0;
    #limited = false;
    constructor(onLimit) {
        this.onLimit = onLimit;
    }
    get limited() {
        return this.#limited;
    }
    normalize(node, next) {
        if (this.#limited)
            return next.map(() => null);
        const existing = this.#paths.get(node);
        const byDepth = existing ?? new Map();
        const paths = [...(byDepth.get(next.length) ?? [])];
        let candidate = next.map((key) => selection(semanticAliasSelectionChoices(key)));
        const covered = paths.find((prior) => pathCovers(prior, candidate));
        if (covered !== undefined)
            return covered;
        if (existing !== undefined &&
            ++this.#calls > SEMANTIC_ALIAS_SELECTION_LIMIT) {
            this.#limited = true;
            this.#paths = new WeakMap();
            this.onLimit();
            return next.map(() => null);
        }
        for (let index = 0; index < paths.length;) {
            const prior = paths[index];
            if (pathCovers(prior, candidate))
                return prior;
            const joined = pathCovers(candidate, prior)
                ? candidate
                : joinSelections(prior, candidate);
            if (joined === undefined) {
                index++;
                continue;
            }
            candidate = [...joined];
            paths.splice(index, 1);
            index = 0;
        }
        paths.push(candidate);
        byDepth.set(candidate.length, paths);
        this.#paths.set(node, byDepth);
        return candidate;
    }
}
