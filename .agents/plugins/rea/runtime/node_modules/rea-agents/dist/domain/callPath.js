import { z } from "zod";
import { relationshipCoverageLimitations } from "./relationshipCoverage.js";
import { callPathInputSchema, callPathResultSchema, } from "./callPathSchemas.js";
import { AnalysisInputError } from "./analysisErrorCore.js";
import { analysisInputErrorFromIssues } from "./inputIssueProjection.js";
import { readEvidencePayload } from "./evidenceValidation.js";
import { nativeAddressInputSchema } from "./native/nativeAddress.js";
import { parseFunctionEvidence, } from "./functionDossierEvidence.js";
import { isCallerOnlyIncompleteCoverage } from "./functionCallCoverage.js";
import { compareUnicodeCodePoints } from "./unicodeCodePointOrder.js";
/** Minimal directed caller-to-callee adjacency for call-path search. */
class CallGraph {
    successors = new Map();
    predecessors = new Map();
    mergeNode(node) {
        if (!this.successors.has(node))
            this.successors.set(node, new Set());
        if (!this.predecessors.has(node))
            this.predecessors.set(node, new Set());
    }
    mergeDirectedEdge(source, target) {
        this.mergeNode(source);
        this.mergeNode(target);
        this.successors.get(source)?.add(target);
        this.predecessors.get(target)?.add(source);
    }
    hasNode(node) {
        return this.successors.has(node);
    }
    outNeighbors(node) {
        return [...(this.successors.get(node) ?? [])];
    }
    inNeighbors(node) {
        return [...(this.predecessors.get(node) ?? [])];
    }
}
/** Shortest remaining distance for every node that can reach the goal. */
const distancesToGoal = (graph, goal) => {
    if (!graph.hasNode(goal))
        return new Map();
    const depth = new Map([[goal, 0]]);
    const queue = [goal];
    for (let index = 0; index < queue.length; index += 1) {
        const node = queue[index] ?? "";
        const next = (depth.get(node) ?? 0) + 1;
        for (const neighbor of graph.inNeighbors(node)) {
            if (!depth.has(neighbor)) {
                depth.set(neighbor, next);
                queue.push(neighbor);
            }
        }
    }
    return depth;
};
const callPathEnvelopeSchema = callPathInputSchema.extend({
    functions: z.array(z.unknown()).min(1),
});
/** Reconstruct direct-callee paths from explicit analyze_function Evidence. */
export const buildCallPath = (input) => {
    const selected = callPathEnvelopeSchema.safeParse(input);
    if (!selected.success)
        throw analysisInputErrorFromIssues("build_call_path", selected.error.issues, input, { cause: selected.error });
    const parsed = selected.data;
    const { snapshots, graph } = prepareCallGraph(parsed);
    const search = inspectSearch({
        graph,
        snapshots,
        start: parsed.start.address,
        goal: parsed.goal.address,
    });
    const goalDistances = distancesToGoal(graph, parsed.goal.address);
    const shortestDepth = goalDistances.get(parsed.start.address) ?? null;
    const paths = shortestDepth === null
        ? []
        : enumeratePaths({
            graph,
            start: parsed.start.address,
            goal: parsed.goal.address,
            goalDistances,
        }).paths.map((path) => citePath(path, snapshots));
    const shortestHops = paths[0]?.hops;
    const found = shortestHops !== undefined;
    const exhaustive = search.exhaustive;
    const limitations = search.limitations;
    const resultContext = {
        start: parsed.start.address,
        goal: parsed.goal.address,
        explored: search.explored,
        evidence_links: uniqueEvidence(snapshots.values()),
        limitations: [...new Set(limitations)].sort(compareUnicodeCodePoints),
    };
    const searchScope = { exhaustive };
    if (found)
        return callPathResultSchema.parse({
            ...resultContext,
            status: "found",
            shortest_hops: shortestHops,
            search_scope: searchScope,
            paths,
        });
    return callPathResultSchema.parse({
        ...resultContext,
        status: exhaustive ? "not_found" : "unknown",
        shortest_hops: null,
        search_scope: searchScope,
        paths: [],
    });
};
const prepareCallGraph = (input) => {
    const { snapshots, graph } = parseSnapshots(input.functions);
    assertCompatible(snapshots);
    if (!snapshots.has(input.start.address))
        throw invalidCallPathSelection(["start", "address"], `No analyze_function Evidence was supplied for start ${input.start.address}`);
    return { snapshots, graph };
};
const parseSnapshots = (groups) => {
    const snapshots = new Map();
    const graph = new CallGraph();
    for (const [index, group] of groups.entries()) {
        const parsed = parseFunctionEvidence(group, {
            operation: "build_call_path",
            path: ["functions", index],
        });
        if (!parsed.ok)
            throw parsed.error;
        const snapshot = parsed.value;
        const parsedAddress = readEvidencePayload(nativeAddressInputSchema, snapshot.dossier.procedure.address);
        if (!parsedAddress.ok)
            throw parsedAddress.error;
        const address = parsedAddress.value;
        if (snapshots.has(address))
            throw invalidCallPathSelection(["functions", index], `Duplicate function Evidence for ${address}`);
        graph.mergeNode(address);
        for (const callee of snapshot.dossier.callees) {
            const parsedCallee = readEvidencePayload(nativeAddressInputSchema, callee.address);
            if (!parsedCallee.ok)
                throw parsedCallee.error;
            graph.mergeDirectedEdge(address, parsedCallee.value);
        }
        snapshots.set(address, snapshot);
    }
    return { snapshots, graph };
};
const assertCompatible = (snapshots) => {
    const firstEntry = snapshots.values().next();
    if (firstEntry.done)
        return;
    const first = firstEntry.value;
    for (const snapshot of snapshots.values()) {
        if (snapshot.subject.digest.sha256 !== first.subject.digest.sha256 ||
            snapshot.subject.format !== first.subject.format ||
            snapshot.subject.architecture !== first.subject.architecture)
            throw invalidCallPathSelection(["functions"], "Call-path Evidence mixes artifact subjects");
        if (snapshot.evidence.provider.id !== first.evidence.provider.id ||
            snapshot.evidence.provider.name !== first.evidence.provider.name ||
            snapshot.evidence.provider.version !== first.evidence.provider.version)
            throw invalidCallPathSelection(["functions"], "Call-path Evidence mixes providers");
    }
};
const invalidCallPathSelection = (path, message) => new AnalysisInputError("build_call_path", { userMessage: message }, [
    { path, reason: "invalid_value", message },
]);
const inspectSearch = ({ graph, snapshots, start, goal, }) => {
    const reached = new Map([[start, 0]]);
    const queue = [start];
    const limitations = [];
    let incompleteExpandedCoverage = false;
    let expandedEdges = 0;
    let depthReached = 0;
    for (let index = 0; index < queue.length; index += 1) {
        const node = queue[index];
        if (node === undefined)
            continue;
        const depth = reached.get(node) ?? 0;
        depthReached = Math.max(depthReached, depth);
        const snapshot = snapshots.get(node);
        if (snapshot !== undefined) {
            const coverage = snapshot.evidence.relationship_coverage;
            for (const limitation of snapshot.limitations)
                limitations.push(limitation);
            limitations.push(...snapshot.unresolvedCallCaveats);
            if (coverage !== null) {
                for (const limitation of relationshipCoverageLimitations(coverage))
                    limitations.push(limitation);
                for (const diagnostic of coverage.diagnostics ?? [])
                    limitations.push(diagnostic);
            }
            // The requested goal is a terminal for this search. Its outgoing edges
            // cannot add a path to the goal, so its dossier limits are contextual
            // but do not make the searched start-to-goal closure incomplete.
            if (node === goal)
                continue;
            if (snapshot.unresolvedCallCaveats.length > 0)
                incompleteExpandedCoverage = true;
            const callees = snapshot.dossier.facet_availability?.callees;
            if (callees?.available === false) {
                limitations.push(callees.reason);
                incompleteExpandedCoverage = true;
            }
            // Explicit, Evidence-bound relationship coverage owns completeness;
            // generic provider/dossier limitations remain contextual. Legacy Evidence
            // without that metadata retains its conservative limitation-based rule.
            // The search only expands callee edges, so coverage that is unknown
            // solely because callers are unobservable does not make the searched
            // callee closure incomplete; the caller caveat stays in limitations.
            if (coverage === null
                ? snapshot.limitations.length > 0
                : coverage.status !== "complete" &&
                    !isCallerOnlyIncompleteCoverage(coverage))
                incompleteExpandedCoverage = true;
        }
        else if (node === goal) {
            continue;
        }
        if (snapshot === undefined) {
            limitations.push(`No analyze_function Evidence covers reachable function ${node}`);
            incompleteExpandedCoverage = true;
            continue;
        }
        const neighbors = graph.outNeighbors(node).sort(compareUnicodeCodePoints);
        // Count only edges this expansion examines; a terminal goal's outgoing
        // relationships never reach this point and so never count as explored.
        expandedEdges += neighbors.length;
        for (const neighbor of neighbors)
            if (!reached.has(neighbor)) {
                reached.set(neighbor, depth + 1);
                queue.push(neighbor);
            }
    }
    return {
        graph,
        snapshots,
        explored: {
            nodes: reached.size,
            edges: expandedEdges,
            depth_reached: depthReached,
        },
        exhaustive: !incompleteExpandedCoverage,
        limitations,
    };
};
const enumeratePaths = ({ graph, start, goal, goalDistances, }) => {
    const output = [];
    const path = [start];
    const neighbors = new Map();
    const frame = (node) => {
        let candidates = neighbors.get(node);
        if (candidates === undefined) {
            const distance = goalDistances.get(node);
            candidates = graph
                .outNeighbors(node)
                .filter((neighbor) => distance !== undefined &&
                goalDistances.get(neighbor) === distance - 1)
                .sort(compareUnicodeCodePoints);
            neighbors.set(node, candidates);
        }
        return { neighbors: candidates, nextIndex: 0 };
    };
    const pending = [frame(start)];
    while (pending.length > 0) {
        const current = pending.at(-1);
        if (current === undefined)
            break;
        if (path.at(-1) === goal) {
            output.push([...path]);
            pending.pop();
            path.pop();
            continue;
        }
        const neighbor = current.neighbors[current.nextIndex];
        if (neighbor === undefined) {
            pending.pop();
            path.pop();
            continue;
        }
        current.nextIndex += 1;
        path.push(neighbor);
        pending.push(frame(neighbor));
    }
    return { paths: output };
};
const citePath = (addresses, snapshots) => {
    const edges = addresses.slice(0, -1).map((source, index) => {
        const target = addresses[index + 1];
        if (target === undefined)
            throw new TypeError("Call path has an invalid edge");
        return {
            source,
            target,
            evidence_links: snapshotLinks(snapshots.get(source)),
        };
    });
    const nodes = addresses.map((address, index) => {
        const snapshot = snapshots.get(address);
        const supporting = snapshot ??
            (index > 0 ? snapshots.get(addresses[index - 1] ?? "") : undefined);
        return {
            address,
            name: snapshot?.dossier.procedure.name ?? null,
            evidence_links: snapshotLinks(supporting),
        };
    });
    return {
        hops: edges.length,
        nodes,
        edges,
        evidence_links: [
            ...new Set(edges
                .flatMap(({ evidence_links: links }) => links)
                .concat(nodes.flatMap(({ evidence_links: links }) => links))),
        ],
    };
};
const snapshotLinks = (snapshot) => {
    if (snapshot === undefined)
        throw new TypeError("Every call-path claim requires supporting Evidence");
    return [snapshot.evidence.evidence_id];
};
const uniqueEvidence = (snapshots) => [
    ...new Set([...snapshots].flatMap((snapshot) => snapshotLinks(snapshot))),
].sort(compareUnicodeCodePoints);
