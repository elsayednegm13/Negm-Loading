import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { errorMessage, readNativeProcessIdentityMap, readProcessOwnershipFacts, settleExitingProcessIdentities, systemProcessOwnershipHost as systemHost, } from "./ProcessOwnershipObservation.js";
import { launcherIdentityFailure } from "./ProcessOwnershipIdentity.js";
import { descendantsOf, liveProcesses } from "./ProcessOwnershipProcessTree.js";
import { processRunIdFromEnvironment, readProcessRunTokens, } from "./ProcessRunTokenObservations.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { ProcessOwnershipEvidenceOwner } from "./ProcessOwnershipEvidence.js";
import { PROCESS_CLEANUP_VERIFICATION_GRACE_MS, PROCESS_CLEANUP_VERIFICATION_INTERVAL_MS, processIdentityHasExited, processIdentityIsExiting, } from "./ProcessLifecycle.js";
const execFileAsync = promisify(execFile);
/**
 * Terminate one Windows process tree through the platform utility.
 *
 * This is a bounded P0 cleanup mechanism, not Job Object ownership proof. The
 * caller-visible Windows capability report remains unavailable until a native
 * authority verifies Job Object creation, membership, and cleanup semantics.
 */
export const cleanupWindowsProcessTree = async (rootPid, host = systemWindowsProcessTreeHost) => {
    if (!Number.isSafeInteger(rootPid) || rootPid <= 0)
        return { cleaned: false, reason: "Windows process-tree PID is invalid" };
    try {
        const result = await host.terminateTree(rootPid);
        return { cleaned: true, signaled: result === "terminated" };
    }
    catch (cause) {
        return {
            cleaned: false,
            reason: `Windows process-tree termination failed for PID ${String(rootPid)}: ${errorMessage(cause)}`,
        };
    }
};
const systemWindowsProcessTreeHost = {
    async terminateTree(rootPid) {
        try {
            await execFileAsync("taskkill.exe", ["/pid", String(rootPid), "/t", "/f"], { windowsHide: true, timeout: 5_000 });
            return "terminated";
        }
        catch (cause) {
            if (cause instanceof Error &&
                "code" in cause &&
                (cause.code === 128 || cause.code === "ESRCH"))
                return "missing";
            throw cause;
        }
    },
};
/** Read the capture run token currently exposed by one live process. */
export const readProcessRunId = async (pid, host = systemHost, signal) => processRunIdFromEnvironment(await host.environment(pid, signal));
/** Merge duplicate uncertainty rows from discovery and final verification. */
const mergeUnverifiedObservations = (result, unverified) => {
    if (unverified.length === 0)
        return result;
    const merged = [
        ...new Map([...(result.unverified ?? []), ...unverified].map((item) => [
            JSON.stringify([item.pid, item.diagnostic]),
            item,
        ])).values(),
    ];
    return { ...result, unverified: merged };
};
/**
 * Times one group may be revalidated in a single cleanup. The second pass
 * covers a group that reappears after it was already processed. Another
 * appearance stays unresolved instead of reporting success.
 */
const OWNED_GROUP_REVALIDATION_LIMIT = 2;
/** Token-validate every rooted POSIX process group before signaling any. */
export const cleanupOwnedProcessGroup = async (ownership, host = systemHost) => {
    const exitSettlement = { deadline: undefined };
    const processTable = await readLiveProcessTable(host);
    if (!processTable.available)
        return {
            cleaned: false,
            reason: `process table could not be inspected: ${processTable.reason}`,
        };
    const plan = await createOwnedCleanupPlan(ownership, processTable.processes, host, exitSettlement);
    if ("cleaned" in plan)
        return plan;
    let signaled = false;
    const pendingGroups = [...plan.signalOrder];
    const pending = new Set(pendingGroups);
    const passes = new Map();
    while (pendingGroups.length > 0) {
        const processGroupId = pendingGroups.shift();
        if (processGroupId === undefined)
            break;
        pending.delete(processGroupId);
        const seen = passes.get(processGroupId) ?? 0;
        if (seen >= OWNED_GROUP_REVALIDATION_LIMIT)
            return mergeUnverifiedObservations({
                cleaned: false,
                reason: `owned process group ${String(processGroupId)} reappeared after ${String(OWNED_GROUP_REVALIDATION_LIMIT)} revalidation passes. This release has no runtime override.`,
            }, plan.unverified);
        passes.set(processGroupId, seen + 1);
        const revalidation = await revalidateOwnedProcessGroup(processGroupId, ownership, host, plan.tokenOwnedIdentities, exitSettlement);
        if ("cleaned" in revalidation)
            return mergeUnverifiedObservations(revalidation, plan.unverified);
        for (const groupId of revalidation.escapedProcessGroupIds) {
            if (groupId === processGroupId || pending.has(groupId))
                continue;
            if ((passes.get(groupId) ?? 0) >= OWNED_GROUP_REVALIDATION_LIMIT)
                return mergeUnverifiedObservations({
                    cleaned: false,
                    reason: `owned process group ${String(groupId)} reappeared after ${String(OWNED_GROUP_REVALIDATION_LIMIT)} revalidation passes. This release has no runtime override.`,
                }, plan.unverified);
            pending.add(groupId);
            pendingGroups.push(groupId);
        }
        if (revalidation.empty)
            continue;
        try {
            host.signalGroup(processGroupId, "SIGKILL");
            signaled = true;
        }
        catch (cause) {
            const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
            if (code !== "ESRCH")
                return mergeUnverifiedObservations({
                    cleaned: false,
                    reason: `owned process group signal failed: ${errorMessage(cause)}`,
                }, plan.unverified);
        }
    }
    if (plan.unresolved.length > 0)
        return cleanupValidationFailure(plan.unresolved, plan.unverified);
    if (ownership.sweepTokenOwnedProcesses === true) {
        let verification;
        try {
            const relation = {
                leaderPid: ownership.leaderPid,
                processGroupId: ownership.processGroupId,
                evidenceOwner: ownership.evidenceOwner,
                ...(ownership.sampledProcessGroupIds === undefined
                    ? {}
                    : { sampledProcessGroupIds: ownership.sampledProcessGroupIds }),
            };
            const deadline = performance.now() + PROCESS_CLEANUP_VERIFICATION_GRACE_MS;
            verification = await verifyNoTokenOwnedProcesses(ownership.runId, host, ownership.captureBaseline, relation, exitSettlement);
            while (!verification.cleaned) {
                const remaining = deadline - performance.now();
                if (remaining <= 0)
                    break;
                await delay(Math.min(PROCESS_CLEANUP_VERIFICATION_INTERVAL_MS, remaining));
                verification = await verifyNoTokenOwnedProcesses(ownership.runId, host, ownership.captureBaseline, relation, exitSettlement);
            }
        }
        catch (cause) {
            return mergeUnverifiedObservations({
                cleaned: false,
                reason: `final process ownership verification failed: ${errorMessage(cause)}`,
            }, plan.unverified);
        }
        if (!verification.cleaned)
            return mergeUnverifiedObservations(verification, plan.unverified);
        return mergeUnverifiedObservations({ cleaned: true, signaled }, [
            ...plan.unverified,
            ...(verification.unverified ?? []),
        ]);
    }
    return {
        cleaned: true,
        signaled,
        ...(plan.unverified.length === 0 ? {} : { unverified: plan.unverified }),
    };
};
/** Verify that no live process still carries an owned capture run token. */
export const verifyNoTokenOwnedProcesses = async (runId, host = systemHost, captureBaseline, relation, exitSettlement = { deadline: undefined }) => {
    const processTable = await readLiveProcessTable(host);
    if (!processTable.available)
        return {
            cleaned: false,
            reason: `process table could not be inspected: ${processTable.reason}`,
        };
    const scan = await scanTokenOwnedProcesses(processTable.processes, runId, host, captureBaseline, relation, exitSettlement);
    if (scan.failures.length > 0)
        return cleanupValidationFailure(scan.failures, scan.unverified);
    if (scan.owned.length > 0)
        return {
            cleaned: false,
            reason: "token-owned process remained after cleanup",
            ...(scan.unverified.length === 0 ? {} : { unverified: scan.unverified }),
        };
    return {
        cleaned: true,
        signaled: false,
        ...(scan.unverified.length === 0 ? {} : { unverified: scan.unverified }),
    };
};
const readLiveProcessTable = async (host) => {
    try {
        return {
            available: true,
            processes: liveProcesses(await host.listProcesses()),
        };
    }
    catch (cause) {
        return { available: false, reason: errorMessage(cause) };
    }
};
/**
 * Enrich cleanup candidates with same-snapshot native membership. Process-table
 * ancestry/group fields select only rows whose missing native facts need to
 * fail closed; they never authorize a group or descendant relation.
 */
const readProcessRelationSnapshot = async (ownership, processes, host) => {
    if (host.processIdentities === undefined)
        return {
            currentRelations: processes,
            identities: new Map(),
            failures: [],
        };
    const identities = await readNativeProcessIdentityMap(processes, host);
    const possibleDescendants = new Set(descendantsOf([ownership.leaderPid], processes).map(({ pid }) => pid));
    const relevantPids = new Set([
        ownership.leaderPid,
        ...possibleDescendants,
        ...processes
            .filter(({ processGroupId }) => processGroupId === ownership.processGroupId ||
            ownership.sampledProcessGroupIds?.includes(processGroupId))
            .map(({ pid }) => pid),
    ]);
    const currentRelations = [];
    const failures = [];
    for (const process of processes) {
        const identity = identities.get(process.pid);
        if (processIdentityHasExited(identity))
            continue;
        if (identity?.state === "readable" &&
            identity.relation?.state === "observed") {
            currentRelations.push({
                ...process,
                parentPid: identity.relation.parentPid,
                processGroupId: identity.relation.processGroupId,
            });
            continue;
        }
        if (relevantPids.has(process.pid) && identity?.state !== "absent")
            failures.push({
                pid: process.pid,
                reason: "process-identity-unavailable",
                diagnostic: `native process membership could not be read${identity?.state === "unavailable" ? `: ${identity.reason}` : ""}`,
            });
    }
    return { currentRelations, identities, failures };
};
const settledProcessTable = (processes) => ({
    processes,
    escapedProcessGroupIds: [],
});
/** Confirmation tables taken after an unreadable exit-refresh row disappears. */
const EXIT_REFRESH_CONFIRMATION_LIMIT = 8;
/**
 * Newcomers are token-checked. A PID from the pre-exit table is checked only
 * when its parent or group changed, which is the identityless sign that the
 * PID may have been reused. An unchanged pre-existing row stays unread.
 */
const isExitRefreshCandidate = (process, ownership, initialRelations) => {
    if (process.processGroupId === ownership.processGroupId)
        return false;
    const initial = initialRelations.get(process.pid);
    return (initial === undefined ||
        initial.parentPid !== process.parentPid ||
        initial.processGroupId !== process.processGroupId);
};
/**
 * Token-check rows that exist only in the post-exit table. A prior PID, group,
 * or ancestry link is handled by the caller; these rows have none of those.
 * Foreign tokens are not owned. A matching token authorizes only a group whose
 * leader also carries that token. An unreadable live row stays unresolved.
 */
const classifyUnlinkedExitRows = async (ownership, refreshed, unlinked, host, initialRelations) => {
    let current = refreshed;
    let pending = unlinked;
    let confirmations = 0;
    const matched = [];
    const inspected = new Set();
    // A readable token does not expire when the PID's parent and group return
    // to the pre-exit values. Those PIDs are read again on the next table.
    const tokenRead = new Set();
    while (pending.length > 0) {
        const due = pending.filter((process) => !inspected.has(process.pid));
        if (due.length === 0)
            break;
        for (const process of due)
            inspected.add(process.pid);
        const unreadable = [];
        for await (const { process, observation } of readProcessRunTokens(host, due)) {
            if (observation.state === "readable") {
                tokenRead.add(process.pid);
                if (observation.runId === ownership.runId)
                    matched.push(process);
                continue;
            }
            unreadable.push({ pid: process.pid, reason: observation.reason });
        }
        if (unreadable.length === 0)
            break;
        let liveRows;
        try {
            liveRows = liveProcesses(await host.listProcesses());
        }
        catch (cause) {
            void cause;
            liveRows = undefined;
        }
        const live = liveRows === undefined
            ? undefined
            : new Set(liveRows.map(({ pid }) => pid));
        const stillLive = unreadable.filter((candidate) => live === undefined || live.has(candidate.pid));
        if (stillLive.length > 0) {
            const only = stillLive.length === 1 ? stillLive[0] : undefined;
            const pids = stillLive
                .map(({ pid }) => pid)
                .sort((left, right) => left - right);
            return {
                kind: "uncertain",
                reason: only === undefined
                    ? `process ownership could not be revalidated for PID(s): ${pids.join(", ")}`
                    : `process ownership could not be revalidated for PID ${String(only.pid)}: ${only.reason}`,
            };
        }
        if (liveRows === undefined)
            break;
        confirmations += 1;
        if (confirmations > EXIT_REFRESH_CONFIRMATION_LIMIT)
            return {
                kind: "uncertain",
                reason: `process ownership could not be revalidated: the exit refresh confirmation limit of ${String(EXIT_REFRESH_CONFIRMATION_LIMIT)} reads was exceeded. This release has no runtime override.`,
            };
        // The confirmation read is its own table. A PID classified on the previous
        // table, including a readable foreign token, does not identify the process
        // now using that PID. Read newcomers again, read a pre-exit PID again
        // when its parent or group changed, and read a PID again when its token
        // was already read even if that parent and group have returned.
        current = liveRows;
        inspected.clear();
        matched.length = 0;
        pending = current.filter((process) => tokenRead.has(process.pid) ||
            isExitRefreshCandidate(process, ownership, initialRelations));
    }
    const livePids = new Set(current.map(({ pid }) => pid));
    const stillMatched = matched.filter((process) => livePids.has(process.pid));
    if (stillMatched.length === 0)
        return { kind: "clear", processes: current };
    const matchedPids = new Set(stillMatched.map(({ pid }) => pid));
    const groupIds = new Set();
    for (const process of stillMatched) {
        const leader = current.find((candidate) => candidate.pid === process.processGroupId &&
            candidate.processGroupId === process.processGroupId);
        if (leader === undefined || !matchedPids.has(leader.pid))
            return {
                kind: "uncertain",
                reason: "descendant process-group leader identity could not be verified",
            };
        groupIds.add(process.processGroupId);
    }
    return {
        kind: "escaped",
        processes: current,
        groupIds: [...groupIds].sort((left, right) => left - right),
    };
};
// A process-table read can race exit and retain the old state with an altered
// command. Native terminal facts can settle that mismatch; exit-in-progress
// must be confirmed first. Surviving members still require normal token checks.
const settleLauncherExit = async (ownership, processes, host, exitSettlement) => {
    const launcher = processes.find(({ pid }) => pid === ownership.leaderPid);
    if (launcher === undefined)
        return settledProcessTable(processes);
    let identityCheckedLauncher = launcher;
    if (host.processIdentities !== undefined) {
        const initialIdentities = await readNativeProcessIdentityMap([launcher], host);
        const identities = await settleExitingProcessIdentities([launcher], host, initialIdentities, undefined, exitSettlement);
        const identity = identities.get(launcher.pid);
        const initialIdentity = initialIdentities.get(launcher.pid);
        if (initialIdentity?.state === "readable" &&
            identity?.state === "readable" &&
            initialIdentity.identity !== identity.identity)
            return {
                cleaned: false,
                reason: "owned launcher identity changed while verifying exit",
            };
        if (processIdentityIsExiting(identity))
            return {
                cleaned: false,
                reason: "owned launcher exit could not be confirmed",
            };
        if (processIdentityHasExited(identity))
            return settledProcessTable(processes.filter(({ pid }) => pid !== launcher.pid));
        if (identity?.state !== "readable" ||
            identity.relation?.state !== "observed")
            return {
                cleaned: false,
                reason: `owned launcher native identity could not be verified${identity?.state === "unavailable" ? `: ${identity.reason}` : ""}`,
            };
        identityCheckedLauncher = {
            ...launcher,
            parentPid: identity.relation.parentPid,
            processGroupId: identity.relation.processGroupId,
        };
    }
    const reason = launcherIdentityFailure(identityCheckedLauncher, ownership);
    if (reason === null)
        return settledProcessTable(processes);
    // A native identity read already says that the launcher still exists and
    // supplies its current parent/group relation. Refreshing the process table
    // cannot repair a command or launch-relation mismatch for that generation.
    if (host.processIdentities !== undefined)
        return { cleaned: false, reason };
    const refreshed = await readLiveProcessTable(host);
    if (refreshed.available &&
        !refreshed.processes.some(({ pid }) => pid === launcher.pid)) {
        // Refreshing must not discard a surviving detached descendant's lineage,
        // including a child that changed groups while the launcher exited.
        const descendants = descendantsOf([launcher.pid], processes);
        const descendantPids = new Set(descendants.map(({ pid }) => pid));
        const descendantGroupIds = new Set(descendants.map(({ processGroupId }) => processGroupId));
        const refreshedDescendantPids = new Set(descendantsOf(descendants.map(({ pid }) => pid), refreshed.processes).map(({ pid }) => pid));
        if (refreshed.processes.some((process) => process.processGroupId !== ownership.processGroupId &&
            (refreshedDescendantPids.has(process.pid) ||
                descendantPids.has(process.pid) ||
                descendantGroupIds.has(process.processGroupId))))
            return { cleaned: false, reason };
        const initialRelations = new Map(processes.map((process) => [
            process.pid,
            {
                parentPid: process.parentPid,
                processGroupId: process.processGroupId,
            },
        ]));
        const unlinked = refreshed.processes.filter((process) => isExitRefreshCandidate(process, ownership, initialRelations) &&
            !descendantPids.has(process.pid) &&
            !descendantGroupIds.has(process.processGroupId) &&
            !refreshedDescendantPids.has(process.pid));
        const classified = await classifyUnlinkedExitRows(ownership, refreshed.processes, unlinked, host, initialRelations);
        if (classified.kind === "uncertain")
            return { cleaned: false, reason: classified.reason };
        return {
            processes: classified.processes,
            escapedProcessGroupIds: classified.kind === "escaped" ? classified.groupIds : [],
        };
    }
    return { cleaned: false, reason };
};
const createOwnedCleanupPlan = async (ownership, initialProcesses, host, exitSettlement) => {
    const settled = await settleLauncherExit(ownership, initialProcesses, host, exitSettlement);
    if ("cleaned" in settled)
        return settled;
    const processes = settled.processes;
    const escapedProcessGroupIds = new Set(settled.escapedProcessGroupIds);
    const relationSnapshot = await readProcessRelationSnapshot(ownership, processes, host);
    const sampledProcessGroupIds = new Set((ownership.sampledProcessGroupIds ?? []).filter((processGroupId) => Number.isSafeInteger(processGroupId) && processGroupId > 0));
    const tokenOwned = ownership.sweepTokenOwnedProcesses === true
        ? await scanTokenOwnedProcesses(processes, ownership.runId, host, ownership.captureBaseline, {
            leaderPid: ownership.leaderPid,
            processGroupId: ownership.processGroupId,
            evidenceOwner: ownership.evidenceOwner,
            ...(sampledProcessGroupIds.size === 0
                ? {}
                : { sampledProcessGroupIds: [...sampledProcessGroupIds] }),
        }, exitSettlement)
        : { owned: [], failures: [], unverified: [], identities: new Map() };
    const tokenOwnedGroupIds = new Set(tokenOwned.owned.map(({ processGroupId }) => processGroupId));
    const launcher = relationSnapshot.currentRelations.find(({ pid }) => pid === ownership.leaderPid);
    const rootMembers = relationSnapshot.currentRelations.filter(({ processGroupId }) => processGroupId === ownership.processGroupId);
    if (launcher === undefined &&
        rootMembers.length === 0 &&
        tokenOwned.owned.length === 0 &&
        escapedProcessGroupIds.size === 0 &&
        !relationSnapshot.currentRelations.some(({ processGroupId }) => sampledProcessGroupIds.has(processGroupId)))
        return tokenOwned.failures.length > 0 ||
            relationSnapshot.failures.length > 0
            ? {
                signalOrder: [],
                tokenOwnedIdentities: tokenOwned.identities,
                unresolved: [...tokenOwned.failures, ...relationSnapshot.failures],
                unverified: tokenOwned.unverified,
            }
            : {
                cleaned: true,
                signaled: false,
                ...(tokenOwned.unverified.length === 0
                    ? {}
                    : { unverified: tokenOwned.unverified }),
            };
    let descendants = [];
    if (launcher !== undefined) {
        descendants = descendantsOf([launcher.pid], relationSnapshot.currentRelations);
    }
    const descendantPids = new Set(descendants.map(({ pid }) => pid));
    const processGroupIds = new Set([ownership.processGroupId]);
    for (const descendant of descendants)
        processGroupIds.add(descendant.processGroupId);
    for (const process of tokenOwned.owned)
        processGroupIds.add(process.processGroupId);
    for (const processGroupId of sampledProcessGroupIds)
        processGroupIds.add(processGroupId);
    for (const processGroupId of escapedProcessGroupIds)
        processGroupIds.add(processGroupId);
    const signalableGroups = new Set();
    const unresolved = [...tokenOwned.failures, ...relationSnapshot.failures];
    const unverifiableSampledGroups = new Set();
    for (const processGroupId of processGroupIds) {
        if (processGroupId === ownership.processGroupId)
            continue;
        const groupLeader = relationSnapshot.currentRelations.find(({ pid, processGroupId: observedGroupId }) => pid === processGroupId && observedGroupId === processGroupId);
        const provenGroup = tokenOwnedGroupIds.has(processGroupId) ||
            escapedProcessGroupIds.has(processGroupId);
        if ((groupLeader === undefined || !descendantPids.has(groupLeader.pid)) &&
            !provenGroup &&
            !sampledProcessGroupIds.has(processGroupId))
            return {
                cleaned: false,
                reason: "descendant process-group leader identity could not be verified",
            };
        if ((groupLeader === undefined || !descendantPids.has(groupLeader.pid)) &&
            !provenGroup)
            unverifiableSampledGroups.add(processGroupId);
    }
    const liveMembers = relationSnapshot.currentRelations.filter(({ processGroupId }) => processGroupIds.has(processGroupId));
    for (const processGroupId of processGroupIds) {
        const members = liveMembers.filter(({ processGroupId: observedGroupId }) => observedGroupId === processGroupId);
        if (members.length === 0)
            continue;
        const failures = await processOwnershipFailures(members, ownership.runId, host, tokenOwned.identities, exitSettlement);
        if (failures.length === 0 && unverifiableSampledGroups.has(processGroupId))
            unresolved.push(...members.map(({ pid }) => ({
                pid,
                reason: "process-identity-unavailable",
                diagnostic: "sampled process-group leader identity could not be verified",
            })));
        const scanFailures = tokenOwned.failures.filter(({ pid }) => members.some((member) => member.pid === pid));
        for (const failure of failures)
            mergeProcessOwnershipFailure(unresolved, failure);
        if (failures.length === 0 &&
            scanFailures.length === 0 &&
            !unverifiableSampledGroups.has(processGroupId))
            signalableGroups.add(processGroupId);
    }
    if (ownership.sweepTokenOwnedProcesses !== true && unresolved.length > 0)
        return cleanupValidationFailure(unresolved, tokenOwned.unverified);
    return {
        signalOrder: [...signalableGroups]
            .filter((groupId) => processGroupIds.has(groupId))
            .sort((left, right) => left === ownership.processGroupId
            ? -1
            : right === ownership.processGroupId
                ? 1
                : left - right),
        tokenOwnedIdentities: tokenOwned.identities,
        unresolved,
        unverified: tokenOwned.unverified,
    };
};
/** Keep one current, most useful ownership diagnosis for each live PID. */
const mergeProcessOwnershipFailure = (failures, next) => {
    const index = failures.findIndex(({ pid }) => pid === next.pid);
    if (index < 0) {
        failures.push(next);
        return;
    }
    const previous = failures[index];
    if (previous !== undefined &&
        ownershipFailurePriority(next.reason) >=
            ownershipFailurePriority(previous.reason))
        failures[index] = next;
};
const ownershipFailurePriority = (reason) => reason === "run-token-mismatch"
    ? 3
    : reason === "process-identity-unavailable"
        ? 2
        : reason === "environment-unreadable"
            ? 1
            : 0;
const revalidateOwnedProcessGroup = async (processGroupId, ownership, host, expectedIdentities, exitSettlement) => {
    let members;
    let escapedProcessGroupIds = [];
    try {
        const settled = await settleLauncherExit(ownership, liveProcesses(await host.listProcesses()), host, exitSettlement);
        if ("cleaned" in settled)
            return settled;
        escapedProcessGroupIds = settled.escapedProcessGroupIds;
        const processes = settled.processes;
        const relationSnapshot = await readProcessRelationSnapshot(ownership, processes, host);
        if (relationSnapshot.failures.length > 0)
            return cleanupValidationFailure(relationSnapshot.failures);
        members = relationSnapshot.currentRelations.filter(({ processGroupId: observedGroupId }) => observedGroupId === processGroupId);
    }
    catch (cause) {
        return {
            cleaned: false,
            reason: `process ownership could not be revalidated: ${errorMessage(cause)}`,
        };
    }
    const failures = await processOwnershipFailures(members, ownership.runId, host, expectedIdentities, exitSettlement);
    if (failures.length > 0)
        return cleanupValidationFailure(failures);
    if (processGroupId !== ownership.processGroupId &&
        members.length > 0 &&
        !members.some(({ pid }) => pid === processGroupId) &&
        ownership.sweepTokenOwnedProcesses !== true)
        return {
            cleaned: false,
            reason: "descendant process-group leader identity could not be revalidated",
        };
    return { empty: members.length === 0, escapedProcessGroupIds };
};
const cleanupValidationFailure = (failures, unverified = []) => {
    const unverifiedEntry = unverified.length === 0 ? {} : { unverified };
    const unreadable = failures.filter(({ reason }) => reason === "environment-unreadable");
    if (failures.some(({ reason }) => reason === "run-token-mismatch"))
        return {
            cleaned: false,
            reason: `process ownership token mismatch for PID(s): ${[
                ...new Set(failures
                    .filter(({ reason }) => reason === "run-token-mismatch")
                    .map(({ pid }) => pid)),
            ]
                .sort((left, right) => left - right)
                .join(", ")}`,
            failures,
            ...unverifiedEntry,
        };
    if (failures.some(({ reason }) => reason === "process-identity-unavailable"))
        return {
            cleaned: false,
            reason: "process identity could not be revalidated",
            failures,
            ...unverifiedEntry,
        };
    if (unreadable.length > 0) {
        const counts = new Map();
        for (const { diagnostic } of unreadable) {
            const category = sanitizedTokenReadFailure(diagnostic);
            counts.set(category, (counts.get(category) ?? 0) + 1);
        }
        const breakdown = [...counts]
            .sort(([left], [right]) => compareUnicodeCodePoints(left, right))
            .map(([category, count]) => `${category}=${String(count)}`)
            .join(", ");
        const candidates = unreadable
            .map(({ pid, diagnostic }) => `${String(pid)}=${sanitizedTokenReadFailure(diagnostic)}`)
            .sort((left, right) => compareUnicodeCodePoints(left, right));
        return {
            cleaned: false,
            reason: `process ownership token could not be read for ${String(unreadable.length)} live process(es): ${breakdown}; live candidates ${candidates.join(", ")}`,
            failures,
            ...unverifiedEntry,
        };
    }
    return {
        cleaned: false,
        reason: "process ownership could not be revalidated",
        failures,
        ...unverifiedEntry,
    };
};
const sanitizedTokenReadFailure = (diagnostic) => {
    if (diagnostic === "environment_unavailable")
        return diagnostic;
    if (diagnostic === "platform_binary_environment_withheld")
        return diagnostic;
    if (diagnostic === "restricted_process_environment_withheld")
        return diagnostic;
    const environmentErrno = /^(EACCES|EPERM|ENOENT|ESRCH):/u.exec(diagnostic ?? "");
    if (environmentErrno?.[1] !== undefined)
        return `environment_errno_${environmentErrno[1]}`;
    if (diagnostic === "apple_vector_unavailable")
        return diagnostic;
    if (diagnostic === "ambiguous_environment_boundary")
        return diagnostic;
    if (diagnostic === "malformed_procargs")
        return diagnostic;
    if (diagnostic === "process_identity_changed_during_token_read")
        return diagnostic;
    if (diagnostic === "process_not_in_snapshot")
        return diagnostic;
    const processTableFailure = /^process_table_failed_(\d+)$/u.exec(diagnostic ?? "");
    if (processTableFailure?.[1] !== undefined)
        return `process_table_errno_${processTableFailure[1]}`;
    const sysctlFailure = /^sysctl_failed_(\d+)$/u.exec(diagnostic ?? "");
    if (sysctlFailure?.[1] !== undefined)
        return `sysctl_errno_${sysctlFailure[1]}`;
    if (diagnostic === "reader_failure")
        return diagnostic;
    if (diagnostic === "duplicate_run_token")
        return diagnostic;
    if (diagnostic === "invalid_run_token_encoding")
        return diagnostic;
    return "other_unavailable";
};
const processOwnershipFailures = async (members, runId, host, expectedIdentities = new Map(), exitSettlement = { deadline: undefined }) => {
    if (host.processIdentities !== undefined) {
        const facts = await readProcessOwnershipFacts(members, host, undefined, {
            exitSettlement,
        });
        const failures = [];
        for (const fact of facts) {
            if (processIdentityHasExited(fact.identityAfter))
                continue;
            if (processIdentityIsExiting(fact.identityAfter)) {
                failures.push({
                    pid: fact.process.pid,
                    reason: "process-identity-unavailable",
                    diagnostic: "native process exit could not be confirmed before signal",
                });
                continue;
            }
            const relation = fact.identityAfter.state === "readable" &&
                fact.identityAfter.relation?.state === "observed"
                ? fact.identityAfter.relation
                : undefined;
            if (relation !== undefined &&
                relation.processGroupId !== fact.process.processGroupId)
                continue;
            if (fact.state !== "same-generation") {
                failures.push({
                    pid: fact.process.pid,
                    reason: "process-identity-unavailable",
                    diagnostic: "process identity changed or became unavailable before signal",
                });
                continue;
            }
            const expected = expectedIdentities.get(fact.process.pid);
            if ((expected !== undefined &&
                expected !== null &&
                fact.identityAfter.state === "readable" &&
                fact.identityAfter.identity !== expected) ||
                expected === null ||
                relation === undefined) {
                failures.push({
                    pid: fact.process.pid,
                    reason: "process-identity-unavailable",
                    diagnostic: "process identity or group membership could not be revalidated before signal",
                });
                continue;
            }
            if (fact.token.state === "unavailable") {
                failures.push({
                    pid: fact.process.pid,
                    reason: "environment-unreadable",
                    diagnostic: fact.token.reason,
                });
            }
            else if (fact.token.runId !== runId) {
                failures.push({ pid: fact.process.pid, reason: "run-token-mismatch" });
            }
        }
        return failures;
    }
    return processRunTokenFailures(members, runId, host);
};
const processRunTokenFailures = async (members, runId, host) => {
    const failures = [];
    for await (const { process: member, observation } of readProcessRunTokens(host, members)) {
        if (observation.state === "readable") {
            if (observation.runId !== runId)
                failures.push({ pid: member.pid, reason: "run-token-mismatch" });
            continue;
        }
        failures.push({
            pid: member.pid,
            reason: "environment-unreadable",
            diagnostic: observation.reason,
        });
    }
    return recheckOwnershipFailures(failures, host);
};
/**
 * Take a fresh liveness snapshot after each ownership-read phase. Only an
 * absent PID resolves an unreadable observation; a readable token mismatch
 * remains a failure. Never reuse this snapshot across identity/token reads.
 */
const recheckOwnershipFailures = async (failures, host) => {
    if (!failures.some(({ reason }) => reason !== "run-token-mismatch"))
        return failures;
    try {
        let processes = await host.listProcesses();
        const isDarwin = (host.platform ?? process.platform) === "darwin";
        for (let attempt = 0; isDarwin &&
            attempt < TOKEN_READ_RETRY_ATTEMPTS &&
            processes.some(({ pid, state }) => failures.some((failure) => failure.pid === pid && failure.reason !== "run-token-mismatch") && state.slice(1).includes("E")); attempt += 1) {
            await delay(TOKEN_READ_RETRY_DELAY_MS);
            processes = await host.listProcesses();
        }
        const live = new Set(liveProcesses(processes).map(({ pid }) => pid));
        return failures.filter(({ pid, reason }) => reason === "run-token-mismatch" || live.has(pid));
    }
    catch (cause) {
        return failures.map((failure) => failure.reason === "run-token-mismatch"
            ? failure
            : {
                ...failure,
                diagnostic: `${failure.diagnostic}; process liveness recheck failed: ${errorMessage(cause)}`,
            });
    }
};
const TOKEN_READ_RETRY_ATTEMPTS = 3;
const TOKEN_READ_RETRY_DELAY_MS = 40;
/** Darwin reports this when the kernel withholds a platform binary's environment. */
const PLATFORM_BINARY_ENVIRONMENT_WITHHELD = "platform_binary_environment_withheld";
/** Darwin reports this when the kernel withholds a restricted process environment. */
const RESTRICTED_PROCESS_ENVIRONMENT_WITHHELD = "restricted_process_environment_withheld";
const currentProcessUid = () => typeof process.getuid === "function" ? process.getuid() : undefined;
/**
 * Whether the operating system provably withheld this candidate's run token:
 * current macOS omits the environment of Apple platform binaries and
 * CS_RESTRICT processes from KERN_PROCARGS2, and fails with EINVAL for
 * processes owned by another account. Linux denies `/proc/<pid>/environ` for
 * another account, mismatched real/saved IDs (setgid and setuid programs) and
 * non-dumpable processes. These classes cannot be token-verified by this
 * caller. An unrelated candidate is recorded as unverified instead of failing
 * an otherwise clean capture; every related or otherwise unreadable candidate
 * stays fail-closed.
 */
const environmentWithheldFromInspection = (diagnostic, observedUid, restriction) => {
    if (restriction !== undefined)
        return true;
    const uid = currentProcessUid();
    if (uid !== undefined && observedUid !== undefined && observedUid !== uid)
        return true;
    return (diagnostic === PLATFORM_BINARY_ENVIRONMENT_WITHHELD ||
        diagnostic === RESTRICTED_PROCESS_ENVIRONMENT_WITHHELD);
};
const scanTokenOwnedProcesses = async (processes, runId, host, captureBaseline, relation, exitSettlement = { deadline: undefined }) => {
    if (host.processIdentities !== undefined)
        return scanWithOwnershipEvidence(processes, runId, host, captureBaseline, relation, exitSettlement);
    const candidates = processes;
    const failures = [];
    const owned = [];
    const ownedIdentities = new Map();
    const recordOwned = (process) => {
        owned.push(process);
        ownedIdentities.set(process.pid, null);
    };
    const unreadable = [];
    for await (const { process, observation } of readProcessRunTokens(host, candidates)) {
        if (observation.state === "readable") {
            if (observation.runId === runId)
                recordOwned(process);
        }
        else
            unreadable.push({ process, diagnostic: observation.reason });
    }
    const remaining = await settleUnreadableTokenCandidates(unreadable, runId, host, recordOwned);
    const relatedPids = new Set();
    const relatedGroupIds = new Set();
    if (relation !== undefined) {
        relatedPids.add(relation.leaderPid);
        for (const descendant of descendantsOf([relation.leaderPid], processes))
            relatedPids.add(descendant.pid);
        relatedGroupIds.add(relation.processGroupId);
        for (const processGroupId of relation.sampledProcessGroupIds ?? [])
            if (Number.isSafeInteger(processGroupId) && processGroupId > 0)
                relatedGroupIds.add(processGroupId);
        for (const process of owned)
            relatedGroupIds.add(process.processGroupId);
    }
    const unverified = [];
    const strict = [];
    const withheld = [];
    for (const candidate of remaining) {
        const isRelated = relation === undefined ||
            relatedPids.has(candidate.process.pid) ||
            relatedGroupIds.has(candidate.process.processGroupId);
        if (!isRelated &&
            environmentWithheldFromInspection(candidate.diagnostic, candidate.process.uid)) {
            withheld.push(candidate);
            continue;
        }
        strict.push(candidate);
    }
    let finalLive;
    try {
        finalLive = new Set(liveProcesses(await host.listProcesses()).map(({ pid }) => pid));
    }
    catch (cause) {
        void cause;
        finalLive = undefined;
    }
    for (const candidate of strict) {
        if (finalLive !== undefined && !finalLive.has(candidate.process.pid))
            continue;
        failures.push({
            pid: candidate.process.pid,
            reason: "environment-unreadable",
            diagnostic: candidate.diagnostic,
        });
    }
    for (const candidate of withheld) {
        if (finalLive !== undefined && !finalLive.has(candidate.process.pid))
            continue;
        unverified.push({
            pid: candidate.process.pid,
            diagnostic: candidate.diagnostic,
        });
    }
    return { owned, failures, unverified, identities: ownedIdentities };
};
const scanWithOwnershipEvidence = async (listedProcesses, runId, host, captureBaseline, relation, exitSettlement) => {
    const evidenceOwner = relation === undefined
        ? new ProcessOwnershipEvidenceOwner()
        : relation.evidenceOwner;
    if (evidenceOwner === undefined)
        return {
            owned: [],
            failures: [
                {
                    pid: relation?.leaderPid ?? -1,
                    reason: "process-identity-unavailable",
                    diagnostic: "persistent process ownership evidence owner is required for scoped token scan",
                },
            ],
            unverified: [],
            identities: new Map(),
        };
    const observationRows = evidenceOwner.rowsForObservation(listedProcesses);
    const listedPids = new Set(listedProcesses.map(({ pid }) => pid));
    const baseline = new Map((captureBaseline ?? []).map(({ pid, identity }) => [pid, identity]));
    const retainedPids = new Set(evidenceOwner.candidates.map(({ pid }) => pid));
    const firstIdentities = await readNativeProcessIdentityMap(observationRows, host);
    const candidates = observationRows.filter((process) => {
        if (retainedPids.has(process.pid))
            return true;
        if (!baseline.has(process.pid))
            return true;
        const before = baseline.get(process.pid);
        const now = firstIdentities.get(process.pid);
        if (before === null || now?.state !== "readable") {
            // The baseline selects candidates; current native facts and retained
            // ownership evidence decide identity, liveness and applicability.
            return true;
        }
        return now.identity !== before;
    });
    // Keep the first relation/token observation: bounded retries can see a
    // reparented process and a different withheld-token diagnostic.
    const initialFacts = await readProcessOwnershipFacts(candidates, host, undefined, {
        identityBefore: firstIdentities,
        exitSettlement,
    });
    let facts = initialFacts;
    for (let attempt = 0; attempt < TOKEN_READ_RETRY_ATTEMPTS; attempt += 1) {
        const retryRows = facts
            .filter(({ token, identityAfter }) => token.state === "unavailable" &&
            !processIdentityHasExited(identityAfter) &&
            !processIdentityIsExiting(identityAfter))
            .map(({ process }) => process);
        if (retryRows.length === 0)
            break;
        await delay(TOKEN_READ_RETRY_DELAY_MS);
        const retries = await readProcessOwnershipFacts(retryRows, host, undefined, { exitSettlement });
        const retryByPid = new Map(retries.map((fact) => [fact.process.pid, fact]));
        facts = facts.map((fact) => retryByPid.get(fact.process.pid) ?? fact);
    }
    const processGroupIds = new Set([
        ...(relation === undefined ? [] : [relation.processGroupId]),
        ...(relation?.sampledProcessGroupIds ?? []),
    ]);
    const retained = evidenceOwner.reconcile(facts, {
        runId,
        listedRows: listedProcesses.length,
        listedPids,
        leaderPid: relation?.leaderPid ?? -1,
        processGroupIds,
        scopeFacts: initialFacts,
    });
    const factsByPid = new Map(facts.map((fact) => [fact.process.pid, fact]));
    const retainedByPid = new Map(retained.map((candidate) => [candidate.pid, candidate]));
    const failures = [];
    const unverified = [];
    const owned = [];
    const identities = new Map();
    for (const fact of facts) {
        // The table row and baseline predate the final native observation. An
        // exited candidate needs no ownership proof or signal, even when its
        // token became unreadable while exiting. Unknown native state stays a
        // cleanup failure; table omission alone is never proof of exit.
        if (processIdentityHasExited(fact.identityAfter))
            continue;
        if (fact.state === "replaced")
            failures.push({
                pid: fact.process.pid,
                reason: "process-identity-unavailable",
                diagnostic: "process identity changed during token validation",
            });
        else if (fact.state === "unavailable")
            failures.push({
                pid: fact.process.pid,
                reason: "process-identity-unavailable",
                diagnostic: "process identity was unavailable during token validation",
            });
        const retainedCandidate = retainedByPid.get(fact.process.pid);
        if (fact.state === "same-generation" &&
            fact.token.state === "readable" &&
            fact.token.runId !== runId &&
            retainedCandidate !== undefined)
            failures.push({
                pid: fact.process.pid,
                reason: "run-token-mismatch",
            });
        if (fact.token.state !== "unavailable")
            continue;
        const relationBefore = fact.identityBefore.state === "readable"
            ? fact.identityBefore.relation
            : undefined;
        const relationAfter = fact.identityAfter.state === "readable"
            ? fact.identityAfter.relation
            : undefined;
        const knownUnrelated = relation !== undefined &&
            retainedCandidate === undefined &&
            fact.state === "same-generation" &&
            relationBefore?.state === "observed" &&
            relationAfter?.state === "observed" &&
            relationBefore.parentPid === relationAfter.parentPid &&
            relationBefore.processGroupId === relationAfter.processGroupId;
        const observed = fact.state === "same-generation" &&
            fact.identityAfter.state === "readable"
            ? fact.identityAfter
            : undefined;
        if (knownUnrelated &&
            environmentWithheldFromInspection(fact.token.reason, observed?.effectiveUid, observed?.environmentRestriction)) {
            unverified.push({
                pid: fact.process.pid,
                diagnostic: fact.token.reason,
            });
            continue;
        }
        if (fact.state === "same-generation" ||
            (retainedCandidate?.applicability === "related-ownership-unresolved" &&
                fact.identityAfter.state === "readable" &&
                fact.identityAfter.identity === retainedCandidate.identity))
            failures.push({
                pid: fact.process.pid,
                reason: "environment-unreadable",
                diagnostic: fact.token.reason,
            });
    }
    for (const candidate of retained) {
        const fact = factsByPid.get(candidate.pid);
        if (fact?.state !== "same-generation") {
            if (fact?.identityAfter.state !== "absent" &&
                !failures.some(({ pid }) => pid === candidate.pid))
                mergeProcessOwnershipFailure(failures, {
                    pid: candidate.pid,
                    reason: "process-identity-unavailable",
                    diagnostic: "retained candidate identity is not currently verified",
                });
            continue;
        }
        const identity = fact.identityAfter;
        if (identity.state !== "readable" ||
            candidate.identity === undefined ||
            identity.identity !== candidate.identity)
            continue;
        if (candidate.applicability !== "token-verified" ||
            fact.token.state !== "readable" ||
            fact.token.runId !== runId)
            continue;
        if (identity.relation?.state !== "observed") {
            failures.push({
                pid: candidate.pid,
                reason: "process-identity-unavailable",
                diagnostic: "native process membership was unavailable",
            });
            continue;
        }
        owned.push({
            ...fact.process,
            parentPid: identity.relation.parentPid,
            processGroupId: identity.relation.processGroupId,
        });
        identities.set(candidate.pid, candidate.identity);
    }
    const mergedFailures = [];
    for (const failure of failures)
        mergeProcessOwnershipFailure(mergedFailures, failure);
    return { owned, failures: mergedFailures, unverified, identities };
};
/**
 * Re-read run tokens for unresolved sweep candidates so transient exec and
 * exit states settle before classification. Each attempt revalidates
 * liveness, refreshes the diagnostic, and is bounded by a fixed attempt
 * budget; a still-unreadable candidate keeps its latest diagnostic.
 */
const settleUnreadableTokenCandidates = async (pending, runId, host, recordOwned) => {
    let remaining = pending;
    for (let attempt = 0; attempt < TOKEN_READ_RETRY_ATTEMPTS && remaining.length > 0; attempt += 1) {
        await delay(TOKEN_READ_RETRY_DELAY_MS);
        let live;
        try {
            live = new Set(liveProcesses(await host.listProcesses()).map(({ pid }) => pid));
        }
        catch (cause) {
            void cause;
            live = undefined;
        }
        const stillUnreadable = [];
        const candidates = remaining
            .map(({ process }) => process)
            .filter(({ pid }) => live === undefined || live.has(pid));
        for await (const { process, observation } of readProcessRunTokens(host, candidates)) {
            if (observation.state === "readable") {
                if (observation.runId === runId)
                    recordOwned(process);
                continue;
            }
            stillUnreadable.push({
                process,
                diagnostic: observation.reason,
            });
        }
        remaining = stillUnreadable;
    }
    return remaining;
};
