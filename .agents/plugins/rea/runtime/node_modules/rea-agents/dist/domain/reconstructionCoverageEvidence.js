const evidenceAuthorities = {
    "shipped-artifact": ["shipped-artifact"],
    "controlled-replay": ["controlled-replay"],
    "live-observation": ["controlled-replay", "external-service"],
    external: ["external-service"],
};
const packageAuthorities = {
    build: ["live-observation"],
    "clean-install": ["live-observation"],
    "package-contents": ["shipped-artifact", "live-observation"],
    "runtime-routing": ["live-observation"],
    "authority-independence": ["shipped-artifact", "live-observation"],
};
/** Qualify only the Evidence cited by this verifier observation. */
export const verifierHasComparableEvidence = (result, contract, records) => hasComparableEvidence(result.evidence_ids, [contract.authority], records);
/** Runtime package claims need observations; static package audits can be derived. */
export const packageProofHasComparableEvidence = (proof, records) => hasComparableEvidence(proof.evidence_ids, packageAuthorities[proof.kind], records);
const hasComparableEvidence = (evidenceIds, requirements, records) => evidenceIds.some((id) => {
    const evidence = records.get(id);
    if (evidence === undefined)
        return false;
    return requirements.some((required) => evidenceAuthorities[required].includes(evidence.authority) &&
        (evidence.confidence === "observed" ||
            (required === "shipped-artifact" &&
                evidence.confidence === "derived")));
});
