import { AnalysisCleanupLease, AnalysisCleanupLeaseGroup, } from "../artifacts/AnalysisCleanupLease.js";
import { ArtifactReaderFailure } from "../artifacts/ArtifactReader.js";
import { LocalWebScriptArtifacts } from "./assets/LocalWebScriptArtifacts.js";
import { AnalysisError } from "../domain/analysisErrorBase.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { ProviderCleanupError } from "../domain/providerCleanupError.js";
const cleanupOwner = (resource, close) => {
    let retained = [resource];
    const lease = new AnalysisCleanupLease(async () => {
        try {
            await close();
        }
        catch (cause) {
            retained =
                cause instanceof AnalysisError && cause.cleanupResources.length > 0
                    ? cause.cleanupResources
                    : ArtifactReaderFailure.cleanupObservation(cause, resource)
                        .resources;
            throw cause;
        }
    }, {
        get cleanupResources() {
            return retained;
        },
    });
    return { resource, lease };
};
/** Retain each composed artifact owner's release across partial cleanup retries. */
export class WebArtifactCleanup {
    owner;
    #owners;
    #operation;
    constructor(owner, resources, scripts) {
        this.owner = owner;
        const sourceLocation = owner === "web-source-location-artifacts";
        this.#operation = sourceLocation
            ? "trace_web_source_location"
            : "trace_web_module_imports";
        const resource = sourceLocation
            ? "web source-location artifacts"
            : "web module artifacts";
        const closeScript = scripts instanceof LocalWebScriptArtifacts &&
            scripts.resources === resources
            ? undefined
            : scripts.close?.bind(scripts);
        this.#owners = [
            cleanupOwner(resource, () => resources.close()),
            ...(closeScript === undefined
                ? []
                : [cleanupOwner("web scripts", closeScript)]),
        ];
    }
    async close() {
        const pending = this.#owners.filter(({ lease }) => !lease.released);
        const results = await Promise.allSettled(pending.map(({ lease }) => lease.release()));
        const failures = results.flatMap((result, index) => result.status === "rejected"
            ? [{ cause: result.reason, ...pending[index] }]
            : []);
        const error = webArtifactCleanupFailures(this.owner, this.#operation, failures);
        if (error !== undefined) {
            new AnalysisCleanupLeaseGroup(error, failures.map(({ lease }) => lease));
            throw error;
        }
    }
}
const webArtifactCleanupFailures = (owner, operation, failures) => {
    if (failures.length === 0)
        return undefined;
    const normalized = failures.map(({ resource, cause }) => {
        if (cause instanceof AnalysisError) {
            const projection = projectAnalysisError(cause);
            return {
                cause,
                projection,
                observation: {
                    reason: projection.message,
                    resources: cause.cleanupResources.length === 0
                        ? [resource]
                        : cause.cleanupResources,
                },
            };
        }
        return {
            cause,
            projection: undefined,
            observation: ArtifactReaderFailure.cleanupObservation(cause, resource),
        };
    });
    const recoveryActions = [
        ...new Set(normalized.flatMap(({ projection }) => projection === undefined ? [] : [projection.remediation.action])),
    ];
    return new ProviderCleanupError(owner, [
        ...new Set(normalized.flatMap(({ observation }) => observation.resources)),
    ], {
        reason: normalized
            .map(({ observation }) => observation.reason)
            .join("; "),
        failures: normalized.map(({ cause, projection, observation }) => projection !== undefined
            ? projection
            : {
                name: cause instanceof Error ? cause.name : "UnknownError",
                message: cause instanceof Error ? cause.message : String(cause),
                resource: [...observation.resources],
            }),
    }, {
        cause: normalized.length === 1
            ? normalized[0].cause
            : new AggregateError(normalized.map(({ cause }) => cause), `${owner} cleanup failed`),
        operation,
        ...(recoveryActions.length === 0
            ? {}
            : { remediationAction: recoveryActions.join("; ") }),
    });
};
