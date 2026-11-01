import canonicalize from "canonicalize";
import { z } from "zod";
import { createEvidenceBundle, createImmutableEvidenceBundle, safeParseImmutableEvidenceBundle, InvalidResidualUnknownGraphError, validateResidualUnknownAddition, } from "../../domain/evidenceBundle.js";
import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import { EvidenceIntegrityError } from "../../domain/evidenceErrors.js";
import { UnknownRegistryError } from "../../domain/unknownRegistryError.js";
import { evidenceSemanticContent, } from "../../domain/evidence.js";
import { safeParseImmutableEvidence } from "../../domain/evidenceValidation.js";
import { createResidualUnknown, updateResidualUnknown, } from "../../domain/residualUnknown.js";
import { err, ok } from "../../domain/result.js";
import { compareUnicodeCodePoints } from "../../domain/unicodeCodePointOrder.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
/** Session-owned set of immutable evidence records. */
export class EvidenceLedger {
    #records = new Map();
    #unknownRevisions = new Map();
    #unknownHeads = new Map();
    /** Record evidence idempotently; conflicting content is rejected. */
    record(input) {
        const authenticated = readLedgerEvidence(input, "Evidence record validation failed");
        if (!authenticated.ok)
            return authenticated;
        const evidence = authenticated.value;
        const existing = this.#records.get(evidence.evidence_id);
        if (existing !== undefined) {
            // A borrowed record is already authenticated and deeply immutable. Its
            // identity cannot change between reads, so comparing document-sized
            // canonical strings again would add no integrity check.
            if (existing === evidence)
                return ok("duplicate");
            return recordsAgree(existing, evidence)
                ? ok("duplicate")
                : err(new EvidenceIntegrityError("Conflicting evidence record"));
        }
        this.#records.set(evidence.evidence_id, evidence);
        return ok("added");
    }
    /** Validate an entire bundle before atomically merging its records. */
    import(input) {
        const parsed = safeParseImmutableEvidenceBundle(input);
        if (!parsed.ok) {
            const { kind, message, cause } = parsed.error;
            if (kind === "single-record")
                return err(new AnalysisInputError("import_evidence_bundle", {
                    cause,
                    userMessage: message,
                }));
            return err(new EvidenceIntegrityError("Evidence bundle validation failed", {
                cause,
                userMessage: message,
            }));
        }
        const bundle = parsed.value;
        // A record-only bundle cannot change the already-valid unknown graph. The
        // bundle parser has validated every incoming record and its manifests, so
        // checking ID conflicts and committing only the additions preserves the
        // atomic merge without rebuilding and reparsing the entire ledger.
        if (bundle.unknowns.length === 0) {
            const additions = new Map();
            const replacements = [];
            for (const evidence of bundle.records) {
                const existing = this.#records.get(evidence.evidence_id);
                if (existing !== undefined) {
                    if (!recordsAgree(existing, evidence))
                        return err(new EvidenceIntegrityError("Conflicting evidence record"));
                    if (!displayMetadataAgree(existing, evidence)) {
                        replacements.push({
                            kind: "metadata",
                            previous: existing,
                            current: evidence,
                        });
                    }
                    continue;
                }
                additions.set(evidence.evidence_id, evidence);
            }
            for (const { current } of replacements)
                this.#records.set(current.evidence_id, current);
            for (const [id, evidence] of additions)
                this.#records.set(id, evidence);
            return ok({
                recordsAdded: additions.size,
                unknownsAdded: 0,
                changed: additions.size > 0 || replacements.length > 0,
                replacements,
            });
        }
        const pending = new Map(this.#records);
        const replacements = [];
        for (const evidence of bundle.records) {
            const existing = pending.get(evidence.evidence_id);
            if (existing !== undefined && !recordsAgree(existing, evidence))
                return err(new EvidenceIntegrityError("Conflicting evidence record"));
            if (existing !== undefined && !displayMetadataAgree(existing, evidence))
                replacements.push({
                    kind: "metadata",
                    previous: existing,
                    current: evidence,
                });
            pending.set(evidence.evidence_id, evidence);
        }
        const pendingUnknowns = new Map(this.#unknownRevisions);
        let unknownsAdded = 0;
        for (const unknown of bundle.unknowns) {
            const key = unknownRevisionKey(unknown);
            const existing = pendingUnknowns.get(key);
            if (existing !== undefined &&
                existing.revision_digest !== unknown.revision_digest)
                return err(new EvidenceIntegrityError("Conflicting unknown revision"));
            pendingUnknowns.set(key, unknown);
            if (existing === undefined)
                unknownsAdded += 1;
        }
        const checked = this.#validateCandidate(pending, pendingUnknowns);
        if (!checked.ok) {
            return err(new EvidenceIntegrityError("Evidence bundle unknown registry failed", {
                cause: checked.error,
            }));
        }
        const added = pending.size - this.#records.size;
        this.#commit(checked.value);
        return ok({
            recordsAdded: added,
            unknownsAdded,
            changed: added > 0 || unknownsAdded > 0 || replacements.length > 0,
            replacements,
        });
    }
    /** Export records in deterministic, semantically irrelevant ID order. */
    export() {
        return structuredClone(createEvidenceBundle([...this.#records.values()], [...this.#unknownRevisions.values()]));
    }
    /** Borrow an authenticated immutable bundle without copying its records. */
    immutableBundle() {
        return createImmutableEvidenceBundle([...this.#records.values()], [...this.#unknownRevisions.values()]);
    }
    /** Check whether one immutable Evidence ID is present in this ledger. */
    has(evidenceId) {
        return this.#records.has(evidenceId);
    }
    /** Return a detached immutable Evidence value by semantic ID. */
    get(evidenceId) {
        const evidence = this.#records.get(evidenceId);
        return evidence === undefined ? undefined : structuredClone(evidence);
    }
    /** Borrow authenticated immutable Evidence for read-only analysis without a full clone. */
    forAnalysis(evidenceId) {
        return this.#records.get(evidenceId);
    }
    /** Create one approved unknown and atomically append its mutation evidence. */
    recordUnknown(input, mutationEvidence) {
        const authenticated = readLedgerEvidence(mutationEvidence, "Unknown mutation evidence is invalid");
        if (!authenticated.ok)
            return authenticated;
        const parsedMutation = authenticated.value;
        let unknown;
        try {
            unknown = createResidualUnknown(input, parsedMutation.evidence_id, parsedMutation.subject?.digest.sha256 ?? null);
        }
        catch (cause) {
            if (!(cause instanceof z.ZodError))
                throw cause;
            return err(analysisInputErrorFromIssues("record_unknown", cause.issues, input, {
                cause,
            }));
        }
        if (this.#unknownHeads.has(unknown.unknown_id))
            return err(new UnknownRegistryError("already-exists"));
        return this.#appendUnknown(unknown, parsedMutation);
    }
    /** Atomically record derived Evidence and a linked residual unknown. */
    recordWithUnknown(evidenceInput, input, mutationInput) {
        const authenticatedEvidence = readLedgerEvidence(evidenceInput, "Atomic Evidence validation failed");
        if (!authenticatedEvidence.ok)
            return authenticatedEvidence;
        const authenticatedMutation = readLedgerEvidence(mutationInput, "Atomic Evidence validation failed");
        if (!authenticatedMutation.ok)
            return authenticatedMutation;
        const evidence = authenticatedEvidence.value;
        const mutation = authenticatedMutation.value;
        const existingEvidence = this.#records.get(evidence.evidence_id);
        if (existingEvidence !== undefined &&
            !recordsAgree(existingEvidence, evidence))
            return err(new EvidenceIntegrityError("Conflicting evidence record"));
        let unknown;
        try {
            unknown = createResidualUnknown(input, mutation.evidence_id, mutation.subject?.digest.sha256 ?? null);
        }
        catch (cause) {
            if (!(cause instanceof z.ZodError))
                throw cause;
            return err(new UnknownRegistryError("invalid-transition", { cause }));
        }
        const creationUnknown = this.#unknownRevisions.get(unknownRevisionKey(unknown));
        if (creationUnknown !== undefined) {
            if (creationUnknown.revision_digest !== unknown.revision_digest)
                return err(new UnknownRegistryError("already-exists"));
            const checked = this.#appendIncremental([evidence]);
            if (!checked.ok)
                return checked;
            return ok(null);
        }
        const checked = this.#appendIncremental([evidence, mutation], unknown);
        if (!checked.ok)
            return checked;
        return ok(structuredClone(unknown));
    }
    /** Apply one approved full-state update using optimistic revision matching. */
    updateUnknown(input, mutationEvidence) {
        const current = this.#unknownHeads.get(input.unknown_id);
        if (current === undefined)
            return err(new UnknownRegistryError("not-found"));
        if (current.revision !== input.expected_revision)
            return err(new UnknownRegistryError("revision-conflict"));
        let unknown;
        try {
            unknown = updateResidualUnknown(current, input, mutationEvidence.evidence_id);
        }
        catch (cause) {
            if (!(cause instanceof z.ZodError))
                throw cause;
            return err(analysisInputErrorFromIssues("update_unknown", cause.issues, input, {
                cause,
            }));
        }
        const authenticated = readLedgerEvidence(mutationEvidence, "Unknown mutation evidence is invalid");
        if (!authenticated.ok)
            return authenticated;
        return this.#appendUnknown(unknown, authenticated.value);
    }
    /** Query current heads in stable ID order. */
    listUnknowns(filters = {}) {
        return this.listUnknownsPage(filters).items;
    }
    /** Select a stable page of current heads before detaching record payloads. */
    listUnknownsPage(query = {}) {
        const offset = query.offset ?? 0;
        const matching = [...this.#unknownHeads.values()]
            .filter((unknown) => (query.status === undefined || unknown.status === query.status) &&
            (query.severity === undefined ||
                unknown.severity === query.severity) &&
            (query.domain === undefined || unknown.domain === query.domain))
            .sort((left, right) => compareUnicodeCodePoints(left.unknown_id, right.unknown_id));
        const start = Math.min(offset, matching.length);
        const end = query.limit === undefined
            ? undefined
            : start + Math.min(query.limit, matching.length - start);
        const page = matching.slice(start, end);
        const nextOffset = offset <= matching.length && start + page.length < matching.length
            ? start + page.length
            : null;
        return {
            items: page.map((unknown) => structuredClone(unknown)),
            total: matching.length,
            offset,
            next_offset: nextOffset,
        };
    }
    /** Return current resolution validity; imported invalid states are rejected. */
    verifyUnknownResolution(unknownId) {
        const unknown = this.#unknownHeads.get(unknownId);
        if (unknown === undefined)
            return err(new UnknownRegistryError("not-found"));
        return ok({
            valid: unknown.status === "resolved",
            truthVerified: unknown.resolution?.disposition === "verified",
            unknown: structuredClone(unknown),
        });
    }
    /** Clear records when the owning session closes. */
    clear() {
        this.#records.clear();
        this.#unknownRevisions.clear();
        this.#unknownHeads.clear();
    }
    #appendUnknown(unknown, mutationEvidence) {
        const checked = this.#appendIncremental([mutationEvidence], unknown);
        if (!checked.ok)
            return checked;
        return ok(structuredClone(unknown));
    }
    /** Incoming records were authenticated and sealed at the ingestion boundary. */
    #appendIncremental(records, unknown) {
        const additions = new Map();
        for (const evidence of records) {
            const existing = additions.get(evidence.evidence_id) ??
                this.#records.get(evidence.evidence_id);
            if (existing !== undefined) {
                if (!recordsAgree(existing, evidence))
                    return err(new EvidenceIntegrityError("Conflicting evidence record"));
                continue;
            }
            additions.set(evidence.evidence_id, evidence);
        }
        const unknownKey = unknown === undefined ? undefined : unknownRevisionKey(unknown);
        if (unknownKey !== undefined && this.#unknownRevisions.has(unknownKey))
            return err(new UnknownRegistryError("integrity"));
        if (unknown !== undefined)
            try {
                validateResidualUnknownAddition(unknown, {
                    get: (id) => additions.get(id) ?? this.#records.get(id),
                    has: (id) => additions.has(id) || this.#records.has(id),
                }, this.#unknownHeads);
            }
            catch (cause) {
                if (!(cause instanceof InvalidResidualUnknownGraphError))
                    throw cause;
                return err(new UnknownRegistryError("integrity", { cause }));
            }
        for (const [id, evidence] of additions)
            this.#records.set(id, evidence);
        if (unknown !== undefined && unknownKey !== undefined) {
            this.#unknownRevisions.set(unknownKey, unknown);
            this.#unknownHeads.set(unknown.unknown_id, unknown);
        }
        return ok(undefined);
    }
    /** Return the sealed candidate facts that the commit will adopt. */
    #validateCandidate(records, unknowns) {
        try {
            return ok(createImmutableEvidenceBundle([...records.values()], [...unknowns.values()]));
        }
        catch (cause) {
            if (!(cause instanceof z.ZodError) &&
                !(cause instanceof InvalidResidualUnknownGraphError))
                throw cause;
            return err(new UnknownRegistryError("integrity", { cause }));
        }
    }
    #commit(bundle) {
        const records = new Map(bundle.records.map((evidence) => [evidence.evidence_id, evidence]));
        const unknownRevisions = new Map(bundle.unknowns.map((unknown) => [unknownRevisionKey(unknown), unknown]));
        const unknownHeads = new Map();
        for (const unknown of bundle.unknowns) {
            const head = unknownHeads.get(unknown.unknown_id);
            if (head === undefined || head.revision < unknown.revision)
                unknownHeads.set(unknown.unknown_id, unknown);
        }
        this.#records = records;
        this.#unknownRevisions = unknownRevisions;
        this.#unknownHeads = unknownHeads;
    }
}
const readLedgerEvidence = (input, message) => {
    const checked = safeParseImmutableEvidence(input);
    return checked.ok
        ? checked
        : err(new EvidenceIntegrityError(message, {
            cause: checked.error,
        }));
};
const unknownRevisionKey = (unknown) => `${unknown.unknown_id}:${String(unknown.revision)}`;
const recordsAgree = (left, right) => canonicalize(evidenceSemanticContent(left)) ===
    canonicalize(evidenceSemanticContent(right));
const displayMetadataAgree = (left, right) => left.subject?.name === right.subject?.name &&
    left.subject?.local_path === right.subject?.local_path &&
    left.caller_input_path === right.caller_input_path;
