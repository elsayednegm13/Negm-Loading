import { basename } from "node:path";
import { z } from "zod";
import { digestCanonicalValue } from "./canonicalDigest.js";
import { canonicalJsonDigestSteps } from "./canonicalJsonDigestSteps.js";
import { nulFreeStringSchema } from "./localPath.js";
import { analysisProfileSchema, } from "./analysisProfile.js";
import { BINARY_ARCHITECTURES, RAW_ONLY_ARCHITECTURES, } from "./binaryTargetTypes.js";
import { jsonObjectSchema, jsonValueSchema, jsonValueValidationIssue, jsonValueValidationSteps, } from "./jsonValue.js";
import { freezeJsonSnapshot, freezeOwnedJsonTreeSnapshot, canBorrowParsedJsonSnapshot, immutableJsonSnapshotMember, isImmutableJsonSnapshot, } from "./immutableJson.js";
import { digestSchema, prefixedDigestSchema } from "./../domain/digests.js";
import { relationshipCoverageSchema, } from "./relationshipCoverage.js";
/** Provider identity schema shared by evidence-bearing persistence formats. */
export const providerSchema = z.strictObject({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().nullable(),
});
const subjectFormatSchema = z.enum([
    "hopper",
    "analysis-database",
    "mach-o",
    "elf",
    "pe",
    "dos-mz",
    "dos-com",
    "raw-binary",
    "gamecube-dol",
    "zip",
    "ipa",
    "apk",
    "msix",
    "appx",
    "hap",
    "hsp",
    "app-pack",
    "asar",
    "godot-pck",
    "dmg",
    "pkg",
    "plist",
    "javascript",
    "source-map",
    "directory",
    "file",
    "unknown",
    "mach-o-universal",
    "javascript-bundle",
    "entitlements",
    "pyinstaller",
    "node-sea",
]);
const subjectBaseSchema = z.strictObject({
    name: z.string().min(1),
    digest: z.strictObject({ sha256: digestSchema }),
    local_path: nulFreeStringSchema,
});
// The format owns the architecture claim, including nested Evidence subjects.
const subjectSchema = z.discriminatedUnion("format", [
    subjectBaseSchema.extend({
        format: subjectFormatSchema.exclude(["raw-binary", "gamecube-dol"]),
        architecture: z
            .enum(BINARY_ARCHITECTURES)
            .exclude([...RAW_ONLY_ARCHITECTURES])
            .nullable(),
    }),
    subjectBaseSchema.extend({
        format: z.literal("raw-binary"),
        architecture: z.enum(BINARY_ARCHITECTURES).nullable(),
    }),
    subjectBaseSchema.extend({
        format: z.literal("gamecube-dol"),
        architecture: z.literal("powerpc"),
    }),
]);
/** Source location attached to an evidence observation. */
/** Source-location schema shared by evidence-bearing persistence formats. */
export const evidenceLocationSchema = z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("address"), address: z.string().min(1) }),
    z.strictObject({
        kind: z.literal("address-range"),
        start: z.string().min(1),
        end: z.string().min(1),
    }),
    z.strictObject({ kind: z.literal("artifact-path"), path: z.string().min(1) }),
    z.strictObject({
        kind: z.literal("file-offset"),
        offset: z.int().min(0),
    }),
    z.strictObject({
        kind: z.literal("file-offset-range"),
        start: z.int().min(0),
        end: z.int().min(0),
    }),
]);
/** Source authority vocabulary owned by Evidence and reused by its consumers. */
export const evidenceAuthoritySchema = z.enum([
    "shipped-artifact",
    "controlled-replay",
    "historical-reference",
    "external-service",
    "analyst-inference",
]);
const executionEnvironmentSchema = z.strictObject({
    id: z.string().min(1),
    platform: z.string().min(1),
    architecture: z.string().min(1),
    isolation: z.enum(["none", "process", "container", "virtual-machine"]),
});
const evidenceBaseSchema = z
    .object({
    evidence_id: prefixedDigestSchema("ev"),
    subject: subjectSchema.nullable(),
    provider: providerSchema,
    analysis_profile: analysisProfileSchema.nullable(),
    predicate_type: z.string().min(1),
    operation: z.string().min(1),
    parameters: jsonObjectSchema,
    /** Verbatim selected path for a direct request; absent on older records. */
    caller_input_path: nulFreeStringSchema
        .exactOptional()
        .describe("Verbatim direct-request path; not part of semantic identity."),
    raw_result: jsonValueSchema.nullable(),
    normalized_result: jsonValueSchema,
    confidence: z.enum(["observed", "derived", "inferred"]),
    authority: evidenceAuthoritySchema,
    environment: executionEnvironmentSchema.nullable(),
    limitations: z.array(z.string()),
    relationship_coverage: relationshipCoverageSchema.nullable(),
    locations: z.array(evidenceLocationSchema),
    evidence_links: z.array(prefixedDigestSchema("ev")),
})
    .strict();
/** Require a reported analysis profile to identify the observation provider. */
export const validateAnalysisProfileProvider = (evidence, context) => {
    const profile = evidence.analysis_profile;
    if (profile !== null &&
        (profile.provider.id !== evidence.provider.id ||
            profile.provider.name !== evidence.provider.name ||
            profile.provider.version !== evidence.provider.version))
        context.addIssue({
            code: "custom",
            path: ["analysis_profile", "provider"],
            message: "Analysis profile provider does not match Evidence provider",
        });
};
/** Strict, provider-neutral record for one successful public observation. */
export const evidenceSchema = evidenceBaseSchema.superRefine(validateAnalysisProfileProvider);
const authenticatedEvidenceSchema = evidenceSchema.superRefine((evidence, context) => {
    const { evidence_id: evidenceId, ...withoutId } = evidence;
    if (computeEvidenceId(withoutId) !== evidenceId)
        context.addIssue({
            code: "custom",
            path: ["evidence_id"],
            message: usesPre66NullCoverageIdentity(withoutId, evidenceId)
                ? "Evidence uses an earlier relationship_coverage identity commitment: explicit null was omitted from that digest. Recreate this observation with the current REA release; re-exporting the old bundle cannot update its identity."
                : "Evidence semantic identifier does not match its record",
        });
});
const immutableEvidenceSnapshots = new WeakMap();
const immutableResultSchema = z
    .custom(isImmutableJsonSnapshot)
    .superRefine((value, context) => {
    const issue = jsonValueValidationIssue(value);
    if (issue !== undefined)
        context.addIssue({ code: "custom", message: issue });
});
/** Rebind a matching immutable artifact subject to the caller's selected path. */
export const rebindEvidenceSubjectTargetPath = (subject, target) => subject.sha256 === target.sha256 &&
    subject.format === target.format &&
    (subject.architecture ?? null) === (target.architecture ?? null)
    ? { ...subject, path: target.path }
    : subject;
/** Content committed by an Evidence ID, excluding local request/display metadata. */
export const evidenceSemanticContent = (evidence) => ({
    subject: evidence.subject === null
        ? null
        : {
            digest: evidence.subject.digest,
            format: evidence.subject.format,
            architecture: evidence.subject.architecture,
        },
    provider: evidence.provider,
    analysis_profile: evidence.analysis_profile,
    predicate_type: evidence.predicate_type,
    operation: evidence.operation,
    parameters: evidence.parameters,
    raw_result: evidence.raw_result,
    normalized_result: evidence.normalized_result,
    confidence: evidence.confidence,
    authority: evidence.authority,
    environment: evidence.environment,
    limitations: evidence.limitations,
    relationship_coverage: evidence.relationship_coverage,
    locations: evidence.locations,
    evidence_links: evidence.evidence_links,
});
/** Hash semantic content, including raw results and excluding local metadata. */
const computeEvidenceId = (evidence) => `ev_${digestCanonicalValue(evidenceSemanticContent(evidence), "Evidence")}`;
/** Recognize an obsolete commitment for diagnosis only; never admit or rewrite it. */
const usesPre66NullCoverageIdentity = (evidence, evidenceId) => {
    if (evidence.relationship_coverage !== null)
        return false;
    const legacyProjection = evidenceSemanticContent(evidence);
    delete legacyProjection.relationship_coverage;
    return (evidenceId ===
        `ev_${digestCanonicalValue(legacyProjection, "Historical Evidence identity")}`);
};
/** Parse evidence and reject a syntactically valid but tampered semantic ID. */
export const parseEvidence = (input) => {
    const immutable = typeof input === "object" && input !== null
        ? immutableEvidenceSnapshots.get(input)
        : undefined;
    if (immutable !== undefined)
        return immutable;
    return authenticatedEvidenceSchema.parse(input);
};
/** Authenticate and seal a ledger-owned snapshot; external mutable values are copied first. */
export const immutableEvidence = (input) => {
    const parsed = parseEvidence(input);
    return rememberImmutableEvidence(canBorrowParsedJsonSnapshot(input, parsed) ? input : parsed);
};
/** Rebind display path metadata when an authenticated record names this target. */
export const rebindEvidenceToTargetPath = (evidence, target) => {
    const subject = evidence.subject;
    if (subject === null)
        return evidence;
    const rebound = rebindEvidenceSubjectTargetPath({
        path: subject.local_path,
        sha256: subject.digest.sha256,
        format: subject.format,
        ...(subject.architecture === null
            ? {}
            : { architecture: subject.architecture }),
    }, target);
    if (rebound.path === subject.local_path)
        return evidence;
    const reboundSubject = subjectSchema.parse({
        ...subject,
        name: basename(target.path) || "artifact",
        local_path: target.path,
    });
    const reboundEvidence = { ...evidence, subject: reboundSubject };
    if (!isImmutableEvidence(evidence))
        return immutableEvidence(reboundEvidence);
    // The original authenticated Evidence owns immutable payloads. Only the
    // small display subject and envelope are new, so preserve those payloads
    // without reparsing a potentially large analysis result.
    return rememberReboundEvidence(evidence, reboundEvidence);
};
/** Bind the exact selected request path without changing semantic identity or stored history. */
export const withEvidenceCallerInputPath = (evidence, rawPath) => {
    const callerInputPath = nulFreeStringSchema.parse(rawPath);
    const owned = immutableEvidence(evidence);
    if (owned.caller_input_path === callerInputPath)
        return owned;
    // The authenticated source owns its immutable payloads. Only this small
    // envelope changes, so replay does not copy a document-sized result.
    const rebound = {
        ...owned,
        caller_input_path: callerInputPath,
    };
    return rememberReboundEvidence(owned, rebound);
};
/** Carry the source's sealing proof before sealing only the changed envelope. */
const rememberReboundEvidence = (source, rebound) => {
    // Each own member belongs to an authenticated immutable source. Register
    // these shared roots so sealing the envelope never walks their payloads.
    for (const key of Object.keys(source))
        immutableJsonSnapshotMember(source, key);
    return rememberImmutableEvidence(rebound);
};
/** Recognize authenticated Evidence whose complete reachable JSON data is immutable. */
export const isImmutableEvidence = (evidence) => immutableEvidenceSnapshots.has(evidence);
const rememberImmutableEvidence = (evidence) => {
    freezeJsonSnapshot(evidence);
    immutableEvidenceSnapshots.set(evidence, evidence);
    return evidence;
};
/** Admit payloads into deterministic Evidence bound to an immutable artifact subject. */
export const createEvidence = (target, provider, observation, options) => {
    const { normalized, sharedResult } = normalizeEvidenceObservation(target, provider, observation);
    const evidence = {
        ...normalized,
        evidence_id: computeEvidenceId(normalized),
    };
    // Seal this already parsed, exclusively owned snapshot without authenticating
    // or copying its payload again, including later partial-error delivery.
    if (sharedResult || options?.immutable === true) {
        // The normalizer's JSON parser clones mutable payloads into trees and only
        // borrows previously sealed roots. No graph-sized sealing scratch is needed.
        freezeOwnedJsonTreeSnapshot(evidence);
        immutableEvidenceSnapshots.set(evidence, evidence);
    }
    return evidence;
};
/** Create Evidence from owned immutable JSON while exposing cooperative computation steps. */
export function* createImmutableEvidenceSteps(target, provider, observation) {
    if (!isImmutableJsonSnapshot(observation.result))
        throw new TypeError("Cooperative Evidence requires an authenticated immutable result");
    // The envelope parser below retains its usual diagnostics, using the completed
    // immutable validation rather than traversing the payload synchronously again.
    yield* jsonValueValidationSteps(observation.result);
    const { normalized } = normalizeEvidenceObservation(target, provider, observation);
    const digest = yield* canonicalJsonDigestSteps(evidenceSemanticContent(normalized));
    return rememberImmutableEvidence({
        ...normalized,
        evidence_id: `ev_${digest}`,
    });
}
const normalizeEvidenceObservation = (target, provider, observation) => {
    const subject = target === undefined
        ? null
        : {
            name: basename(target.path) || "artifact",
            digest: { sha256: target.sha256 },
            format: target.format,
            architecture: target.architecture ?? null,
            local_path: target.path,
        };
    const semantic = {
        subject: subject === null
            ? null
            : {
                digest: subject.digest,
                format: subject.format,
                architecture: subject.architecture,
            },
        provider: {
            id: provider.id,
            name: provider.name,
            version: provider.version,
        },
        analysis_profile: observation.analysisProfile ?? null,
        predicate_type: observation.predicateType ?? "rea.analysis",
        operation: observation.operation,
        parameters: observation.parameters,
        raw_result: observation.rawResult ?? null,
        normalized_result: observation.result,
        confidence: observation.confidence ?? "observed",
        authority: observation.authority ?? "shipped-artifact",
        environment: observation.environment ?? null,
        limitations: [
            ...(target === undefined
                ? [
                    observation.subjectUnavailableReason ??
                        "Artifact identity is unavailable for this observation.",
                ]
                : []),
            ...(observation.limitations ?? []),
        ],
        ...(observation.relationshipCoverage === undefined
            ? { relationship_coverage: null }
            : { relationship_coverage: observation.relationshipCoverage }),
        locations: [...(observation.locations ?? [])],
        evidence_links: [...(observation.evidenceLinks ?? [])],
    };
    const sharedResult = typeof observation.result === "object" &&
        observation.result !== null &&
        isImmutableJsonSnapshot(observation.result);
    const selectedSchema = sharedResult
        ? evidenceSchema.safeExtend({ normalized_result: immutableResultSchema })
        : evidenceSchema;
    const normalized = selectedSchema.parse({
        ...semantic,
        evidence_id: `ev_${"0".repeat(64)}`,
        subject,
    });
    // The envelope has already been parsed into an independent snapshot. Only
    // its derived identifier changes here; parsing again clones the full payload
    // and recomputes the same digest while the previous snapshot is still live.
    return { normalized, sharedResult };
};
