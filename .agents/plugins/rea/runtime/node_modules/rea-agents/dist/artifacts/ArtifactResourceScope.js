import { err, ok } from "../domain/result.js";
import { ArtifactReaderFailure, artifactPrimaryCleanupLeases, } from "./ArtifactReader.js";
import { AnalysisCleanupLease } from "./AnalysisCleanupLease.js";
/** Retry failure carrying the exact retained owners that did not release. */
export class ArtifactResourceRetryFailure extends ArtifactReaderFailure {
    failedOwners;
    cleanupLeases;
    constructor(failures, message, options) {
        super("unavailable", message, options);
        this.failedOwners = failures.map(({ owner }) => owner);
        this.cleanupLeases = [...new Set(failures.map(({ lease }) => lease))];
    }
}
/** Caller-owned scope that retains failed artifact cleanup for a later close. */
export class ArtifactResourceScope {
    #pending = new Set();
    #leases = new WeakMap();
    #active = new Set();
    #draining;
    #closeInFlight;
    #closeHooks = [];
    #closed = false;
    get hasPending() {
        return this.#pending.size > 0;
    }
    /** Labels come from the exact retained owners, never from diagnostic text. */
    get cleanupResources() {
        return [
            ...new Set([...this.#pending].flatMap((owner) => {
                const lease = this.#lease(owner);
                return lease.released
                    ? []
                    : (lease.cleanupResources ?? [owner.resource]);
            })),
        ];
    }
    /** Admit a resource operation while the scope remains open. */
    async run(operation) {
        while (true) {
            if (this.#closed)
                throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
            if (this.#draining !== undefined)
                await this.#draining;
            if (this.#closed)
                throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
            if (this.#pending.size > 0) {
                await this.retryCleanup();
                continue;
            }
            const running = Promise.resolve().then(operation);
            this.#active.add(running);
            try {
                return await running;
            }
            finally {
                this.#active.delete(running);
            }
        }
    }
    /** Attempt cleanup now and retain the same owner if it fails. */
    async release(owner) {
        try {
            await this.#lease(owner).release();
            this.#pending.delete(owner);
            return { kind: "released" };
        }
        catch (cause) {
            this.#pending.add(owner);
            this.#observeCleanupFailure(owner, cause);
            return { kind: "failed", cause, owner, lease: this.#lease(owner) };
        }
    }
    /** Compose initial cleanup authority without confusing it with an independent primary. */
    cleanupFailure(outcome, failures, partialObservation) {
        const observations = failures.map(({ cause, owner }) => ArtifactReaderFailure.cleanupObservation(cause, owner.resource));
        const primary = outcome.kind === "failed" ? outcome.cause : failures[0].cause;
        const inherited = outcome.kind === "failed" ? artifactPrimaryCleanupLeases(primary) : [];
        return ArtifactReaderFailure.withCleanup(primary, {
            reason: observations.map(({ reason }) => reason).join("; "),
            resources: [
                ...new Set(observations.flatMap(({ resources }) => resources)),
            ],
        }, partialObservation, inherited === undefined
            ? undefined
            : [...new Set([...inherited, ...failures.map(({ lease }) => lease)])]);
    }
    /** Adopt an owner after another boundary's cleanup attempt failed. */
    retain(owner) {
        this.#pending.add(owner);
    }
    /** Retry retained owners without closing resource admission. */
    retryCleanup() {
        if (this.#draining !== undefined)
            return this.#draining;
        this.#draining = this.#drainAndRetry().finally(() => {
            this.#draining = undefined;
        });
        return this.#draining;
    }
    /**
     * Run after retained owners are released. Hooks stay registered so a later
     * close retries them, and a failing hook does not skip the ones after it.
     * Concurrent closes share one in-flight attempt.
     */
    addCloseHook(hook) {
        this.#closeHooks.push(hook);
    }
    /** Stop admission, wait for active operations, and retry every retained owner. */
    close() {
        this.#closed = true;
        if (this.#closeInFlight !== undefined)
            return this.#closeInFlight;
        const attempt = this.#finishClose();
        let published;
        published = attempt.finally(() => {
            if (this.#closeInFlight === published)
                this.#closeInFlight = undefined;
        });
        this.#closeInFlight = published;
        return published;
    }
    /** Every registered hook runs. One failure is returned unchanged; several are aggregated. */
    async #runCloseHooks() {
        const failures = [];
        for (const hook of this.#closeHooks) {
            try {
                await hook();
            }
            catch (cause) {
                failures.push(cause);
            }
        }
        if (failures.length === 0)
            return ok(undefined);
        if (failures.length === 1)
            return err(failures[0]);
        return err(new AggregateError(failures, failures
            .map((cause) => cause instanceof Error ? cause.message : String(cause))
            .join("; ")));
    }
    async #finishClose() {
        // A parked analyzer is not a pending owner. Stop it even when another
        // retained cleanup is still failing. A later close retries both.
        const cleanup = await this.retryCleanup().then(() => ok(undefined), (cause) => err(cause));
        const hooks = await this.#runCloseHooks();
        if (!cleanup.ok && !hooks.ok)
            throw this.#composeCloseFailures(cleanup.error, hooks.error);
        if (!hooks.ok)
            throw hooks.error;
        if (!cleanup.ok)
            throw cleanup.error;
    }
    /**
     * Report both outstanding owners. The pending set and the close hook stay
     * registered, so the next close retries each failed path.
     */
    #composeCloseFailures(cleanup, hookFailure) {
        const retained = ArtifactReaderFailure.cleanupObservation(cleanup, "retained artifact cleanup");
        const hook = ArtifactReaderFailure.cleanupObservation(hookFailure, "close hook");
        const resources = [...new Set([...retained.resources, ...hook.resources])];
        const options = {
            cause: new AggregateError([cleanup, hookFailure], "Retained cleanup and a close hook both failed"),
            cleanup: {
                reason: `${retained.reason}; ${hook.reason}`,
                resources,
            },
        };
        const message = `Artifact cleanup remains incomplete: ${resources.join(", ")}`;
        if (cleanup instanceof ArtifactResourceRetryFailure)
            return new ArtifactResourceRetryFailure(cleanup.failedOwners.map((owner) => ({
                owner,
                lease: this.#lease(owner),
            })), message, options);
        return new ArtifactReaderFailure("unavailable", message, options);
    }
    async #drainAndRetry() {
        while (this.#active.size > 0)
            await Promise.allSettled(this.#active);
        const failures = [];
        for (const owner of this.#pending) {
            try {
                await this.#lease(owner).release();
                this.#pending.delete(owner);
            }
            catch (cause) {
                this.#observeCleanupFailure(owner, cause);
                failures.push({ owner, cause });
            }
        }
        if (failures.length === 0)
            return;
        const observations = failures.map(({ owner, cause }) => ArtifactReaderFailure.cleanupObservation(cause, owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease
            ? (owner.lease.cleanupResources ?? owner.resource)
            : owner.resource));
        const resources = [
            ...new Set(observations.flatMap(({ resources }) => resources)),
        ];
        throw new ArtifactResourceRetryFailure(failures.map(({ owner }) => ({ owner, lease: this.#lease(owner) })), `Artifact cleanup remains incomplete: ${resources.join(", ")}`, {
            cause: new AggregateError(failures.map(({ cause }) => cause), "One or more artifact resources remain owned"),
            cleanup: {
                reason: observations.map(({ reason }) => reason).join("; "),
                resources,
            },
        });
    }
    /** This boundary owns the latest parsed child cleanup facts for a composite owner. */
    #observeCleanupFailure(owner, cause) {
        const retained = this.#leases.get(owner);
        if (retained !== undefined)
            retained.resources = [
                ...ArtifactReaderFailure.cleanupObservation(cause, owner.resource)
                    .resources,
            ];
    }
    #lease(owner) {
        if (owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease)
            return owner.lease;
        const previous = this.#leases.get(owner);
        if (previous !== undefined)
            return previous.lease;
        const retained = {
            resources: [owner.resource],
            lease: new AnalysisCleanupLease(() => cleanup(owner), {
                get cleanupResources() {
                    return retained.resources;
                },
            }),
        };
        this.#leases.set(owner, retained);
        return retained.lease;
    }
}
const cleanup = async (owner) => {
    switch (owner.kind) {
        case "lease":
            await owner.lease.release();
            return;
        case "javascript-source-analysis":
            await owner.analysis.close();
            return;
        case "reader":
            await owner.reader.close();
            return;
        case "file-handle":
        case "directory-handle":
            await owner.handle.close();
            return;
        case "output-tree":
            await owner.tree.rollback();
            return;
        case "staged-output":
            await owner.output.close();
            return;
        case "private-runtime-root":
            await owner.root.close();
    }
};
