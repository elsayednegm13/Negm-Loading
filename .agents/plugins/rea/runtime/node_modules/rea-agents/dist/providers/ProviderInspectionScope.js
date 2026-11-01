/** Lifetime of one task's prerequisite observations, distinct from resource ownership. */
export class ProviderInspectionScope {
    #active = true;
    get active() {
        return this.#active;
    }
    close() {
        this.#active = false;
    }
}
