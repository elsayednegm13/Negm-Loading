import { ArtifactResourceRetryFailure, } from "../artifacts/ArtifactResourceScope.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { RegularFileCleanupFailure, } from "../filesystem/OwnedRegularFile.js";
import { retryRegularFileCleanupFailures } from "./RegularFileRead.js";
/** Completion and exact staging owner retained when publication cleanup fails. */
export class ClientConfigurationPublicationFailure extends ArtifactResourceRetryFailure {
    path;
    outcome;
    cleanupCause;
    owner;
    cleanupLease;
    constructor(path, outcome, cleanupCause, owner, cleanupLease) {
        super([{ owner, lease: cleanupLease }], "Configuration publication cleanup remains incomplete", {
            cause: new AggregateError([...(outcome.kind === "failed" ? [outcome.cause] : []), cleanupCause], "Configuration operation and staging cleanup failures"),
            cleanup: ArtifactReaderFailure.cleanupObservation(cleanupCause, owner.resource),
        });
        this.path = path;
        this.outcome = outcome;
        this.cleanupCause = cleanupCause;
        this.owner = owner;
        this.cleanupLease = cleanupLease;
    }
}
export const isClientConfigurationCleanupFailure = (cause) => cause instanceof RegularFileCleanupFailure ||
    cause instanceof ClientConfigurationPublicationFailure;
/** Adopt only capabilities carried by explicit operation outcomes, never opaque causes. */
export const retryClientConfigurationCleanup = async (failure, resources) => {
    const failures = [];
    const cleanupLeases = new Set();
    const observations = [];
    let current = failure;
    let primary;
    for (;;) {
        let nested;
        if (current instanceof RegularFileCleanupFailure) {
            const retried = await retryRegularFileCleanupFailures(current, resources);
            failures.push(...retried.failures);
            for (const lease of retried.cleanupLeases)
                cleanupLeases.add(lease);
            if (retried.cleanup !== undefined)
                observations.push(retried.cleanup);
            primary = retried.primary;
            const last = retried.failures.at(-1);
            nested =
                last.operationFailure === undefined && last.outcome.kind === "failed"
                    ? last.outcome.cause
                    : undefined;
        }
        else {
            const released = await resources.release({
                kind: "lease",
                resource: current.owner.resource,
                lease: current.cleanupLease,
            });
            if (released.kind === "failed") {
                cleanupLeases.add(released.lease);
                observations.push(ArtifactReaderFailure.cleanupObservation(released.cause, current.owner.resource));
            }
            primary =
                current.outcome.kind === "failed"
                    ? current.outcome.cause
                    : current.cleanupCause;
            nested =
                current.outcome.kind === "failed" ? current.outcome.cause : undefined;
        }
        if (!isClientConfigurationCleanupFailure(nested))
            break;
        current = nested;
    }
    return {
        primary,
        failures,
        cleanupLeases: [...cleanupLeases],
        ...(observations.length === 0
            ? {}
            : {
                cleanup: {
                    reason: observations.map(({ reason }) => reason).join("; "),
                    resources: observations.flatMap(({ resources }) => resources),
                },
            }),
    };
};
