import { processIdentityHasExited } from "./ProcessLifecycle.js";
/** Per-run facts retained across failed cleanup attempts; identity is required for authority. */
export class ProcessOwnershipEvidenceOwner {
    #candidates = new Map();
    #snapshotCount = 0;
    #coverage = {
        snapshotCount: 0,
        listedRows: 0,
        examinedPids: 0,
        retainedOnlyPids: 0,
        retainedOwned: 0,
        retainedUnresolved: 0,
        uncertainPids: [],
        processTableCoverage: "unreported-by-host",
    };
    get candidates() {
        return [...this.#candidates.values()];
    }
    get coverage() {
        return this.#coverage;
    }
    /**
     * Reconcile facts from one explicit snapshot. Unrelated transient rows are
     * never retained; unknown related candidates remain evidence, not authority.
     */
    reconcile(facts, options) {
        this.#snapshotCount += 1;
        const factsByPid = new Map(facts.map((fact) => [fact.process.pid, fact]));
        const sameGeneration = new Map();
        const sameGenerationBefore = new Map();
        const tokenMatchedPids = new Set();
        const uncertainPids = new Set();
        const retiredPids = new Set();
        for (const fact of facts) {
            if (fact.state !== "same-generation")
                continue;
            if (fact.identityAfter.state !== "readable")
                continue;
            sameGeneration.set(fact.process.pid, fact.identityAfter);
            if (fact.identityBefore.state === "readable" &&
                fact.identityBefore.identity === fact.identityAfter.identity)
                sameGenerationBefore.set(fact.process.pid, fact.identityBefore);
            if (fact.token.state === "readable" && fact.token.runId === options.runId)
                tokenMatchedPids.add(fact.process.pid);
        }
        const findScopeEvidence = (pid, generations, tokenOwners) => {
            let unverifiedRelation = false;
            const relationFor = (candidatePid) => {
                const identity = generations.get(candidatePid);
                if (identity?.relation?.state === "observed")
                    return identity.relation;
                const fallback = options.unverifiedLineageRelations?.get(candidatePid);
                if (fallback === undefined)
                    return undefined;
                const current = sameGeneration.get(candidatePid);
                // Only a same-generation native relation can disprove the earlier
                // scope. A replacement or unproven generation must not sever the
                // retained ancestry of a surviving descendant.
                if (current?.relation?.state === "observed") {
                    if (identity === undefined)
                        unverifiedRelation = true;
                    return current.relation;
                }
                unverifiedRelation = true;
                return fallback;
            };
            const scoped = (evidence) => unverifiedRelation ? "unverified-table-relation" : evidence;
            const relation = relationFor(pid);
            if (relation === undefined)
                return undefined;
            if (options.allowCapturedScope !== false &&
                options.processGroupIds.has(relation.processGroupId))
                return scoped("captured-process-group-id");
            const visited = new Set([pid]);
            let parentPid = relation.parentPid;
            while (!visited.has(parentPid)) {
                const parent = generations.get(parentPid);
                const previousParent = this.#candidates.get(parentPid);
                if (parent !== undefined &&
                    (tokenOwners.has(parentPid) ||
                        (previousParent?.applicability === "token-verified" &&
                            parent.identity === previousParent.identity)))
                    return scoped("current-token-owned-parent");
                if (options.allowCapturedScope !== false &&
                    parentPid === options.leaderPid)
                    return scoped("capture-leader-pid");
                visited.add(parentPid);
                const parentRelation = relationFor(parentPid);
                if (parentRelation === undefined)
                    return undefined;
                parentPid = parentRelation.parentPid;
            }
            return undefined;
        };
        const scopeGenerations = new Map();
        const scopeBeforeGenerations = new Map();
        const scopeOwnedPids = new Set();
        // Keep the original batch together: retries can reparent a child after its
        // verified parent exits. Historical parent proof is scope evidence only;
        // it neither establishes current liveness nor authorizes a signal.
        for (const observed of options.scopeFacts ?? facts) {
            const fact = observed.beforeExitSettlement ?? observed;
            if (fact.state !== "same-generation" ||
                fact.identityAfter.state !== "readable")
                continue;
            scopeGenerations.set(fact.process.pid, fact.identityAfter);
            if (fact.identityBefore.state === "readable" &&
                fact.identityAfter.identity === fact.identityBefore.identity)
                scopeBeforeGenerations.set(fact.process.pid, fact.identityBefore);
            // Capture earlier proof before applying terminal observations below.
            // Its generation must match this historical native observation exactly.
            const previous = this.#candidates.get(fact.process.pid);
            if ((fact.token.state === "readable" &&
                fact.token.runId === options.runId) ||
                (previous?.applicability === "token-verified" &&
                    previous.identity === fact.identityAfter.identity))
                scopeOwnedPids.add(fact.process.pid);
        }
        const related = (pid) => {
            const current = findScopeEvidence(pid, sameGeneration, tokenMatchedPids) ??
                findScopeEvidence(pid, sameGenerationBefore, tokenMatchedPids);
            if (current !== undefined)
                return current;
            // The child must still be the generation observed in that original
            // batch. A reused PID cannot inherit its predecessor's historical scope.
            const original = scopeGenerations.get(pid);
            if (original === undefined ||
                sameGeneration.get(pid)?.identity !== original.identity)
                return undefined;
            const initial = findScopeEvidence(pid, scopeGenerations, scopeOwnedPids) ??
                findScopeEvidence(pid, scopeBeforeGenerations, scopeOwnedPids);
            return initial === undefined
                ? undefined
                : "previously-related-generation";
        };
        for (const [pid, previous] of this.#candidates) {
            // A bounded native exit also retires an unresolved prior generation,
            // even when the caller excludes this PID from subsequent token reads.
            if (options.nativeExitedPids?.has(pid)) {
                this.#candidates.delete(pid);
                retiredPids.add(pid);
                continue;
            }
            const fact = factsByPid.get(pid);
            if (fact === undefined)
                continue;
            // Retire only this generation's current ledger entry. Darwin's
            // `not-in-snapshot` and Linux's corroborated ENOENT/ESRCH facts are
            // bounded observations, not claims about later PID reuse or global
            // liveness. A bracketed replacement also settles an identity-less
            // candidate: its earlier lifetime has ended, regardless of relation access.
            if (fact.state === "absent" ||
                fact.state === "replaced" ||
                (previous.identity !== undefined &&
                    fact.identityAfter.state === "readable" &&
                    fact.identityAfter.identity !== previous.identity) ||
                processIdentityHasExited(fact.identityAfter)) {
                this.#candidates.delete(pid);
                retiredPids.add(pid);
                continue;
            }
            if (fact.state !== "same-generation") {
                uncertainPids.add(pid);
                continue;
            }
            const identity = fact.identityAfter;
            if (identity.state !== "readable") {
                uncertainPids.add(pid);
                continue;
            }
            const matched = fact.token.state === "readable" && fact.token.runId === options.runId;
            if (previous.identity === undefined && !matched) {
                uncertainPids.add(pid);
                this.#candidates.set(pid, {
                    ...previous,
                    process: fact.process,
                    token: fact.token,
                    ...(fact.token.state === "unavailable"
                        ? { diagnostic: fact.token.reason }
                        : {}),
                });
                continue;
            }
            const relation = identity.relation?.state === "observed"
                ? {
                    state: "observed",
                    parentPid: identity.relation.parentPid,
                    processGroupId: identity.relation.processGroupId,
                }
                : undefined;
            this.#candidates.set(pid, {
                pid,
                identity: identity.identity,
                process: fact.process,
                applicability: matched || previous.applicability === "token-verified"
                    ? "token-verified"
                    : "related-ownership-unresolved",
                scopeEvidence: matched || previous.applicability === "token-verified"
                    ? "run-token"
                    : (related(pid) ?? "previously-related-generation"),
                token: fact.token,
                relation,
                ...(fact.token.state === "unavailable"
                    ? { diagnostic: fact.token.reason }
                    : {}),
            });
        }
        for (const fact of facts) {
            const pid = fact.process.pid;
            const matched = fact.token.state === "readable" && fact.token.runId === options.runId;
            const unresolvedReplacement = fact.state === "replaced" && matched;
            // A replacement's token cannot be attributed to either generation.
            // A matching token preserves uncertainty for another native observation,
            // without carrying the retired generation's identity or signal authority.
            if (this.#candidates.has(pid) ||
                (retiredPids.has(pid) &&
                    fact.state !== "same-generation" &&
                    !unresolvedReplacement) ||
                fact.state === "absent" ||
                (fact.state === "replaced" && !matched) ||
                processIdentityHasExited(fact.identityAfter))
                continue;
            const identity = fact.identityAfter;
            if (fact.state !== "same-generation" || identity.state !== "readable") {
                if (options.allowCapturedScope === false &&
                    !matched &&
                    related(pid) === undefined)
                    continue;
                this.#candidates.set(pid, {
                    pid,
                    identity: undefined,
                    process: fact.process,
                    applicability: "identity-unresolved",
                    scopeEvidence: "native-identity-unresolved",
                    token: fact.token,
                    relation: undefined,
                    ...(fact.token.state === "unavailable"
                        ? { diagnostic: fact.token.reason }
                        : {}),
                });
                uncertainPids.add(pid);
                continue;
            }
            const unresolvedScope = matched ? undefined : related(pid);
            if (!matched && unresolvedScope === undefined)
                continue;
            const relation = identity.relation?.state === "observed"
                ? {
                    state: "observed",
                    parentPid: identity.relation.parentPid,
                    processGroupId: identity.relation.processGroupId,
                }
                : undefined;
            this.#candidates.set(pid, {
                pid,
                identity: identity.identity,
                process: fact.process,
                applicability: matched
                    ? "token-verified"
                    : "related-ownership-unresolved",
                scopeEvidence: matched
                    ? "run-token"
                    : (unresolvedScope ?? "previously-related-generation"),
                token: fact.token,
                relation,
                ...(fact.token.state === "unavailable"
                    ? { diagnostic: fact.token.reason }
                    : {}),
            });
        }
        const retainedOnlyPids = [...this.#candidates.keys()].filter((pid) => !options.listedPids.has(pid));
        this.#coverage = {
            snapshotCount: this.#snapshotCount,
            listedRows: options.listedRows,
            examinedPids: facts.length,
            retainedOnlyPids: retainedOnlyPids.length,
            retainedOwned: [...this.#candidates.values()].filter(({ applicability }) => applicability === "token-verified").length,
            retainedUnresolved: [...this.#candidates.values()].filter(({ applicability }) => applicability !== "token-verified").length,
            uncertainPids: [...uncertainPids].sort((left, right) => left - right),
            processTableCoverage: "unreported-by-host",
        };
        return this.candidates;
    }
    /** Merge current discovery rows with retained candidates without PID-only proof. */
    rowsForObservation(processes) {
        const byPid = new Map(processes.map((process) => [process.pid, process]));
        for (const candidate of this.#candidates.values())
            if (!byPid.has(candidate.pid))
                byPid.set(candidate.pid, candidate.process);
        return [...byPid.values()];
    }
}
