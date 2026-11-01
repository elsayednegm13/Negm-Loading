import { jsonValueSchema } from "../domain/jsonValue.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { nativeLoadImageSchema, } from "../domain/native/nativeLoadImage.js";
import { ProviderAdapterError } from "../domain/providerAdapterError.js";
import { err, ok } from "../domain/result.js";
import { attestGhidraDosComLoadImage, attestGhidraRawBinaryLoadImage, } from "./GhidraLoadImageValues.js";
import { attestGhidraDolLoadImage } from "./GhidraDolLoadImage.js";
/** Consume one typed comparison, retaining completed facts after the last awaited work. */
export const attestGhidraNativeLoadImage = async (input) => {
    const result = await compareLoadImage(input);
    if (!result.ok)
        return result;
    return input.signal?.aborted
        ? err(new AnalysisCancelledError(input.operation, {
            cause: input.signal.reason,
            partialObservation: {
                kind: "native-load-image",
                stage: "completed",
                result: result.value,
            },
        }))
        : result;
};
const comparisonFailure = (input, reason, cause) => new ProviderAdapterError("ghidra", input.operation, {
    diagnostics: { reason },
    ...(cause === undefined ? {} : { cause }),
    partialObservation: {
        kind: "native-load-image",
        stage: "measured",
        observations: input.measured,
    },
});
const compareLoadImage = async (input) => {
    const { target, operation, measured: observations, client, mapSessionError, nativeAotResult, signal, } = input;
    // These formats have no additional source work; retain already-derived PE facts.
    if (target.format === "pe" ||
        !["dos-mz", "dos-com", "raw-binary", "gamecube-dol"].includes(target.format)) {
        if (target.format === "pe" && nativeAotResult === undefined)
            return err(comparisonFailure(input, "The Ghidra provider did not produce read-only NativeAOT metadata for this admitted PE snapshot."));
        const represented = nativeLoadImageSchema.safeParse({
            status: "unsupported",
            reason: "Independent load-image verification currently supports DOS MZ, explicit DOS COM, and caller-supplied raw-binary targets only.",
            observations: target.format !== "pe" || nativeAotResult === undefined
                ? observations
                : {
                    ...observations,
                    metadata_recovery: [
                        ...(observations.metadata_recovery ?? []),
                        nativeAotResult.summary,
                    ],
                },
            limitations: [
                target.format === "pe"
                    ? "Load-image verification is not performed for PE targets; NativeAOT metadata observations are derived separately from the exact admitted snapshot."
                    : "Other formats expose measured mappings and source identities; no format-specific verification was performed.",
            ],
        });
        return represented.success
            ? ok(represented.data)
            : err(comparisonFailure(input, "Load-image observations could not be represented in the result", represented.error));
    }
    if (signal?.aborted)
        return err(new AnalysisCancelledError(operation, {
            cause: signal.reason,
            partialObservation: {
                kind: "native-load-image",
                stage: "measured",
                observations,
            },
        }));
    const sourceFailure = (failure) => mapSessionError(failure.withDiagnostics({
        ...failure.diagnostics,
        load_image_observations: jsonValueSchema.parse(observations),
    }));
    if (target.format === "gamecube-dol") {
        if (client.hashTargetSnapshotRanges === undefined)
            return err(comparisonFailure(input, "The Ghidra client does not expose its immutable target snapshot ranges for independent DOL load-image verification."));
        const snapshot = await client.hashTargetSnapshotRanges(target.dol.sections.map((section) => ({
            start: section.fileOffset,
            end: section.fileOffset + section.size,
        })), signal);
        if (!snapshot.ok)
            return err(sourceFailure(snapshot.error));
        const attested = attestGhidraDolLoadImage({
            sha256: snapshot.value.sha256,
            bytes: snapshot.value.bytes,
            sectionSha256: snapshot.value.rangeSha256,
        }, target, observations, input.languageOverride);
        return attested.ok
            ? attested
            : err(comparisonFailure(input, attested.error));
    }
    if (target.format === "raw-binary") {
        if (client.hashTargetSnapshot === undefined)
            return err(comparisonFailure(input, "The Ghidra client does not expose its immutable target snapshot identity for independent raw-binary load-image verification."));
        const snapshot = await client.hashTargetSnapshot(signal);
        if (!snapshot.ok)
            return err(sourceFailure(snapshot.error));
        const attested = attestGhidraRawBinaryLoadImage(snapshot.value, target, observations);
        return attested.ok
            ? attested
            : err(comparisonFailure(input, attested.error));
    }
    if (target.format === "dos-mz") {
        if (client.attestDosTargetSnapshot === undefined)
            return err(comparisonFailure(input, "The Ghidra client does not expose its bounded DOS target snapshot comparison."));
        const compared = await client.attestDosTargetSnapshot(observations, signal);
        return compared.ok ? compared : err(sourceFailure(compared.error));
    }
    if (client.readTargetSnapshot === undefined)
        return err(comparisonFailure(input, "The Ghidra client does not expose its immutable target snapshot for independent load-image verification."));
    const snapshot = await client.readTargetSnapshot(undefined, signal);
    if (!snapshot.ok)
        return err(sourceFailure(snapshot.error));
    if (snapshot.value.kind !== "captured")
        return err(comparisonFailure(input, "The uncapped load-image snapshot was unexpectedly not captured."));
    const attested = attestGhidraDosComLoadImage(snapshot.value.bytes, target.sha256, observations);
    return attested.ok ? attested : err(comparisonFailure(input, attested.error));
};
