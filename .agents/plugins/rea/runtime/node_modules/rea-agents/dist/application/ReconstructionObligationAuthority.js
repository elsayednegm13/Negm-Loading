import { err, ok } from "../domain/result.js";
import { parseProcessCaptureEvidence } from "./process/ProcessEvidence.js";
import { reconstructionObligationProofSchema, } from "../domain/reconstructionObligationProof.js";
const proofEvidenceAuthorities = {
    unit: ["shipped-artifact", "controlled-replay"],
    integration: ["controlled-replay"],
    protocol: ["controlled-replay", "external-service"],
    renderer: ["controlled-replay", "external-service"],
    "packaged-process": ["controlled-replay"],
    "native-abi": ["shipped-artifact", "controlled-replay"],
    "live-observation": ["controlled-replay", "external-service"],
    external: ["external-service"],
};
/** Return whether an actual reconstruction proof is comparable to a requirement. */
export const proofAuthoritySatisfies = (actual, required) => {
    const accepted = {
        unit: [
            "unit",
            "integration",
            "protocol",
            "renderer",
            "packaged-process",
            "native-abi",
            "live-observation",
            "external",
        ],
        integration: [
            "integration",
            "protocol",
            "renderer",
            "packaged-process",
            "native-abi",
            "live-observation",
        ],
        protocol: ["protocol", "packaged-process", "live-observation"],
        renderer: ["renderer", "packaged-process", "live-observation"],
        "packaged-process": ["packaged-process", "live-observation"],
        "native-abi": ["native-abi"],
        "live-observation": ["live-observation"],
        external: ["external"],
    };
    return accepted[required].includes(actual);
};
/** Parse retained proof once; authenticity is checked by bundle admission. */
export const parseReconstructionProofEvidence = (evidence) => {
    if (evidence.confidence !== "observed")
        return err("unobserved-proof");
    if (evidence.predicate_type !== "rea.reconstruction-proof" ||
        evidence.operation !== "verify_reconstruction_obligations")
        return err("unrecognized-proof");
    const parsed = reconstructionObligationProofSchema.safeParse(evidence.normalized_result);
    return parsed.success
        ? ok({ authority: evidence.authority, result: parsed.data })
        : err("invalid-proof");
};
/** Qualify one exact claim, without joining unrelated identities or results. */
export const qualifyReconstructionProof = (proof, authority, expected) => {
    if (!proof.ok)
        return proof;
    if (!proofEvidenceAuthorities[authority].includes(proof.value.authority))
        return err("insufficient-authority");
    const obligations = proof.value.result.bindings.filter((binding) => binding.obligation_id === expected.obligationId);
    if (obligations.length === 0)
        return err("obligation-mismatch");
    const owners = obligations.filter((binding) => binding.owner_sha256 === expected.ownerSha256);
    if (owners.length === 0)
        return err("owner-mismatch");
    const revisions = owners.filter((binding) => binding.obligation_version === expected.obligationVersion);
    if (revisions.length === 0)
        return err("revision-mismatch");
    const outcomes = revisions.flatMap((binding) => expected.kind === "fixture"
        ? binding.fixtures
            .filter((fixture) => fixture.fixture_id === expected.fixtureId &&
            fixture.case_kind === expected.caseKind)
            .map(({ passed }) => passed)
        : binding.verifiers
            .filter((verifier) => verifier.verifier_id === expected.verifierId &&
            verifier.claim_id === expected.claimId)
            .map(({ passed }) => passed));
    if (outcomes.length === 0)
        return err("claim-mismatch");
    return outcomes.every((passed) => passed) ? ok(null) : err("failed-proof");
};
/** Check that Evidence observes the original at the required boundary. */
export const evidenceSupportsOriginalAuthority = (evidence, authority) => {
    if (evidence.confidence !== "observed")
        return false;
    if (authority === "static")
        return evidence.authority === "shipped-artifact";
    if (authority === "runtime")
        return ["controlled-replay", "external-service"].includes(evidence.authority);
    if (authority === "process")
        return (evidence.authority === "controlled-replay" &&
            parseProcessCaptureEvidence(evidence).ok);
    return evidence.authority === "external-service";
};
