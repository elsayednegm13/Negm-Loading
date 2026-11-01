import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactResourceRetryFailure, ArtifactResourceScope, } from "../artifacts/ArtifactResourceScope.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { analysisErrorWithCleanupFailure } from "../domain/analysisErrorCleanup.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
import { DarwinProcessOwnershipInspectionError } from "../process/DarwinProcessRunTokenReader.js";
import { OwnedCommandFailure } from "../process/OwnedCommand.js";
/** Retain exact command/helper capabilities across invocation and shutdown. */
export class ApktoolCommandCleanup {
    #scope = new ArtifactResourceScope();
    #owners = new Set();
    async run(operation, name) {
        try {
            return await this.#scope.run(() => {
                this.#prune();
                return operation();
            });
        }
        catch (cause) {
            throw this.#retryFailure(cause, name);
        }
    }
    async close() {
        try {
            await this.#scope.close();
        }
        catch (cause) {
            throw this.#retryFailure(cause, "close");
        }
        finally {
            this.#prune();
        }
    }
    pendingFor(root) {
        this.#prune();
        return [...this.#owners].some((owner) => owner.root === root);
    }
    retainFailure(cause, primary, operation, root) {
        const retained = [];
        const command = cause instanceof OwnedCommandFailure ? cause : undefined;
        const preparation = command?.preparationFailure ??
            (cause instanceof DarwinProcessOwnershipInspectionError
                ? cause
                : undefined);
        if (preparation?.cleanupFailure !== undefined) {
            const cleanup = preparation.cleanupFailure;
            retained.push(this.#retain(cleanup, async () => {
                if (!cleanup.cleanupIncomplete)
                    return;
                if (preparation.cleanupOwner === undefined)
                    throw cleanup;
                await preparation.cleanupOwner.close();
                if (cleanup.cleanupIncomplete)
                    throw cleanup;
            }, root));
        }
        if (command !== undefined &&
            (command.cleanupOwner !== undefined || command.cleanupFailure !== null)) {
            const owner = command.cleanupOwner;
            const cleanup = new ProviderCleanupError("apktool", command.resources, {
                reason: command.cleanupFailure ?? "Command cleanup remains incomplete",
            }, { operation, cause });
            const retainedOwner = this.#retain(cleanup, async () => {
                if (owner === undefined)
                    throw cleanup;
                const result = await owner.stop();
                if (result.status === "incomplete")
                    throw new Error(result.reason);
            }, root);
            retainedOwner.lease.bindCleanupError(cleanup);
            retained.push(retainedOwner);
        }
        if (retained.length === 0)
            return primary;
        const cleanup = new ProviderCleanupError("apktool", retained.flatMap((owner) => owner.cleanup.cleanupResources), {}, { operation, cause });
        this.#bind(cleanup, retained);
        return analysisErrorWithCleanupFailure(primary, cleanup, operation).bindCleanupDependencies([primary, cleanup]);
    }
    #retain(cleanup, release, root) {
        const lease = new AnalysisCleanupLease(async () => {
            try {
                await release();
            }
            catch (cause) {
                throw new ArtifactReaderFailure("unavailable", cleanup.message, {
                    cause,
                    cleanup: {
                        reason: cleanup.message,
                        resources: cleanup.cleanupResources,
                    },
                });
            }
        }, cleanup.cleanupResources);
        const owner = { lease, cleanup, root };
        this.#owners.add(owner);
        this.#scope.retain({
            kind: "lease",
            resource: cleanup.cleanupResources[0] ?? "apktool command",
            lease,
        });
        return owner;
    }
    #bind(error, owners) {
        new AnalysisCleanupLeaseGroup(error, owners.map((owner) => owner.lease));
        // Helper cleanup can itself contain independently released peers. Its
        // producer owns current labels; the leases own completion of this retry set.
        error.bindCleanupResourceOwner({
            get cleanupResources() {
                return [
                    ...new Set(owners
                        .filter((owner) => !owner.lease.released)
                        .flatMap((owner) => owner.cleanup.cleanupResources)),
                ];
            },
        });
    }
    #retryFailure(cause, operation) {
        if (!(cause instanceof ArtifactResourceRetryFailure) ||
            cause.cleanup === undefined ||
            !cause.failedOwners.every((failed) => failed.kind === "lease" &&
                [...this.#owners].some((owner) => owner.lease === failed.lease)))
            return cause;
        const owners = [...this.#owners].filter((owner) => !owner.lease.released);
        const failure = new ProviderCleanupError("apktool", owners.flatMap((owner) => owner.cleanup.cleanupResources), { reason: cause.cleanup.reason }, { operation, cause });
        this.#bind(failure, owners);
        return failure;
    }
    #prune() {
        for (const owner of this.#owners)
            if (owner.lease.released)
                this.#owners.delete(owner);
    }
}
