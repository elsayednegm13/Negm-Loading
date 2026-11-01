import { z } from "zod";
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u);
const md5 = z.string().regex(/^[a-f0-9]{32}$/u);
/** A container's claim is distinct from the SHA-256 identity of observed bytes. */
export const artifactIntegrityClaimSchema = z.discriminatedUnion("algorithm", [
    z.strictObject({ algorithm: z.literal("sha256"), digest: sha256 }),
    z.strictObject({ algorithm: z.literal("md5"), digest: md5 }),
]);
// Keep existing SHA-256 Evidence and its identities unchanged.
export const artifactSha256PairSchema = z.object({
    declared_sha256: sha256,
    observed_sha256: sha256,
});
export const artifactMd5PairSchema = z.object({
    algorithm: z.literal("md5"),
    declared_md5: md5,
    observed_md5: md5,
});
/** The canonical portable fields shared by inventory and inspection findings. */
export const artifactIntegrityPair = (claim, observed) => claim.algorithm === "sha256"
    ? { declared_sha256: claim.digest, observed_sha256: observed }
    : { algorithm: "md5", declared_md5: claim.digest, observed_md5: observed };
/** Select only digest facts from an authenticated inventory contradiction. */
export const artifactIntegrityPairOf = (pair) => "declared_sha256" in pair
    ? {
        declared_sha256: pair.declared_sha256,
        observed_sha256: pair.observed_sha256,
    }
    : {
        algorithm: pair.algorithm,
        declared_md5: pair.declared_md5,
        observed_md5: pair.observed_md5,
    };
/** Preserve the existing error carrier while naming non-SHA digest algorithms. */
export const artifactIntegrityDetails = (logicalPath, claim, observed, unpacked) => ({
    logicalPath,
    unpacked,
    ...(claim?.algorithm === "md5"
        ? {
            algorithm: "md5",
            declaredMd5: claim.digest,
            calculatedMd5: observed,
        }
        : { declaredSha256: claim?.digest ?? null, calculatedSha256: observed }),
});
export const projectArtifactIntegrityDetails = (details) => ({
    logical_path: details.logicalPath,
    ...("declaredSha256" in details
        ? {
            declared_sha256: details.declaredSha256,
            calculated_sha256: details.calculatedSha256,
        }
        : {
            algorithm: details.algorithm,
            declared_md5: details.declaredMd5,
            calculated_md5: details.calculatedMd5,
        }),
    unpacked: details.unpacked,
});
