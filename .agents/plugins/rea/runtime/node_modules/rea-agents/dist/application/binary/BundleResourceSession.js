import { AnalysisCapabilityUnavailableError } from "../../domain/analysisErrorCore.js";
import { analysisErrorWithCleanupFailure } from "../../domain/analysisErrorCleanup.js";
import { err, ok } from "../../domain/result.js";
import { closeAnalysisClient } from "../../providers/AnalysisClientCleanup.js";
export const BUNDLE_NATIVE_RESOURCE_OPERATIONS = new Set([
    "inspect_plist",
]);
export const BUNDLE_ARTIFACT_RESOURCE_OPERATIONS = new Set([
    "decode_interface_builder",
    "inspect_asset_catalog",
    "inspect_keyed_archive",
]);
export const BUNDLE_RESOURCE_OPERATIONS = new Set([
    ...BUNDLE_NATIVE_RESOURCE_OPERATIONS,
    ...BUNDLE_ARTIFACT_RESOURCE_OPERATIONS,
]);
/** Route each resource read to the owner that understands its format. */
export const combineBundleResourceClients = (artifactClient, nativeClient) => ({
    execute: (operation, parameters, options) => {
        if (operation === "health")
            return artifactClient.execute(operation, parameters, options);
        if (!BUNDLE_RESOURCE_OPERATIONS.has(operation))
            return Promise.resolve(err(new AnalysisCapabilityUnavailableError("bundle-resources", operation, "This session provides read-only app resource inspection only.")));
        return BUNDLE_NATIVE_RESOURCE_OPERATIONS.has(operation)
            ? nativeClient.execute(operation, parameters, options)
            : artifactClient.execute(operation, parameters, options);
    },
    close: async (options) => {
        const [artifact, native] = await Promise.all([
            closeAnalysisClient(artifactClient, "bundle-resources", options),
            closeAnalysisClient(nativeClient, "bundle-resources", options),
        ]);
        if (!artifact.ok && !native.ok)
            return err(analysisErrorWithCleanupFailure(artifact.error, native.error, "close_binary"));
        if (!artifact.ok)
            return artifact;
        if (!native.ok)
            return native;
        return ok(null);
    },
});
