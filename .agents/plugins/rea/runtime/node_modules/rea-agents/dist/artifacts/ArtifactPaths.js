import { posix } from "node:path";
import { logicalPathNfc } from "../domain/artifactIdentity.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
const ABSOLUTE_DRIVE_PATH = /^[A-Za-z]:[\\/]/u;
// Bound diagnostic JSON expansion to 768 characters before formatting. This is
// a presentation budget, never a limit on accepted paths or retained facts.
const PATH_DIAGNOSTIC_CODE_UNITS = 128;
const pathDiagnostic = (path) => path.length <= PATH_DIAGNOSTIC_CODE_UNITS
    ? JSON.stringify(path)
    : `${JSON.stringify(path.slice(0, PATH_DIAGNOSTIC_CODE_UNITS))}… (${String(path.length)} UTF-16 code units)`;
/** Declarations have query identities, but never claim a destination path. */
export const hasDestinationPath = (kind) => kind !== "metadata";
/**
 * English Unicode case folding used only to describe logical names a
 * case-insensitive destination might collapse. It is not a filesystem case table.
 */
const ENGLISH_UNICODE_CASE_NOTE = "This comparison is not a filesystem observation.";
/** Inventory limitation when logical names collide under English Unicode case folding. */
export const ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION = `Logical archive names collide under English (en-US) Unicode case folding; a case-insensitive destination cannot store both spellings. ${ENGLISH_UNICODE_CASE_NOTE}`;
/** A rejected destination create whose directory listing identifies another spelling. */
export class DestinationCaseCollisionFailure extends ArtifactReaderFailure {
    requestedPath;
    existingPath;
    constructor(requestedPath, existingPath, options) {
        super("path", `Destination filesystem cannot store both ${requestedPath} and ${existingPath}; inventory retains both logical names.`, options);
        this.requestedPath = requestedPath;
        this.existingPath = existingPath;
        this.name = "DestinationCaseCollisionFailure";
    }
}
/** Normalize slash-separated logical names; backslashes are literal components. */
export const normalizeArtifactPath = (input) => {
    if (input.includes("\0") ||
        input.startsWith("/") ||
        ABSOLUTE_DRIVE_PATH.test(input))
        throw new ArtifactReaderFailure("path", `Artifact path is absolute or unsafe: ${pathDiagnostic(input)}`);
    const normalized = logicalPathNfc(input).replace(/\/+$/u, "");
    const parts = normalized.split("/");
    if (normalized.length === 0 ||
        parts.some((part) => part === "" || part === "." || part === "..") ||
        posix.normalize(normalized) !== normalized)
        throw new ArtifactReaderFailure("path", `Artifact path is not normalized: ${pathDiagnostic(input)}`);
    return normalized;
};
/** Reject exact and same-spelling prefix collisions. Case-distinct names stay distinct. */
export class ArtifactPathRegistry {
    #root = { kind: undefined, children: new Map() };
    add(path, kind) {
        if (!hasDestinationPath(kind))
            return;
        const parts = path.split("/");
        let node = this.#root;
        for (const [index, part] of parts.entries()) {
            if (node.kind !== undefined && node.kind !== "directory")
                throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${pathDiagnostic(path)}`);
            let child = node.children.get(part);
            if (child === undefined) {
                child = { kind: undefined, children: new Map() };
                node.children.set(part, child);
            }
            node = child;
            if (index === parts.length - 1) {
                if (node.kind !== undefined && node.kind !== kind)
                    throw new ArtifactReaderFailure("path", `Artifact path collision: ${pathDiagnostic(path)}`);
                if (kind !== "directory" && node.children.size > 0)
                    throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${pathDiagnostic(path)}`);
            }
        }
        node.kind = kind;
    }
}
const emptyCaseNode = () => ({
    bySpelling: new Map(),
    spellingsByFold: new Map(),
    terminals: [],
});
const englishCaseFold = (part) => part.toLocaleLowerCase("en-US");
/**
 * Record English (en-US) Unicode case collisions on each affected occurrence.
 * Returns the inventory limitation when any logical names collide.
 */
export const annotateEnglishUnicodeCaseCollisions = (occurrences) => {
    const destinations = occurrences.filter(({ entry_kind }) => hasDestinationPath(entry_kind));
    const collisions = englishUnicodeCaseCollisions(destinations.map(({ logical_path }) => logical_path));
    if (collisions.size === 0)
        return undefined;
    for (const occurrence of destinations)
        for (const collision of collisions.get(occurrence.logical_path) ?? [])
            occurrence.limitations.push(caseCollisionLimitation(occurrence.logical_path, collision));
    return ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION;
};
const caseCollisionLimitation = (path, { prefix, other, additional }) => {
    const others = additional === 0
        ? other
        : `${other} and ${String(additional)} other spelling${additional === 1 ? "" : "s"}`;
    const subject = prefix === path
        ? `Logical path ${path} collides`
        : `Logical path ${path} is under ${prefix}, which collides`;
    return `${subject} under English (en-US) Unicode case folding with ${others}; a case-insensitive destination cannot store both. ${ENGLISH_UNICODE_CASE_NOTE}`;
};
/**
 * Name the directory-listing spelling that differs from the requested segment
 * only by English (en-US) Unicode case. Exact matches are the same logical name.
 */
export const destinationCaseCollision = (requestedPath, existingNames, options) => {
    const slash = requestedPath.lastIndexOf("/");
    const segment = slash < 0 ? requestedPath : requestedPath.slice(slash + 1);
    if (existingNames.includes(segment))
        return undefined;
    const folded = englishCaseFold(segment);
    const existing = existingNames
        .filter((name) => englishCaseFold(name) === folded)
        .sort(compareUnicodeCodePoints)[0];
    if (existing === undefined)
        return undefined;
    const parent = slash < 0 ? "" : requestedPath.slice(0, slash + 1);
    return new DestinationCaseCollisionFailure(requestedPath, `${parent}${existing}`, options);
};
const englishUnicodeCaseCollisions = (paths) => {
    const root = emptyCaseNode();
    for (const path of paths) {
        if (path.length === 0 || path === ".")
            continue;
        let node = root;
        for (const part of path.split("/")) {
            let child = node.bySpelling.get(part);
            if (child === undefined) {
                const folded = englishCaseFold(part);
                const spellings = node.spellingsByFold.get(folded);
                if (spellings === undefined)
                    node.spellingsByFold.set(folded, [part]);
                else
                    spellings.push(part);
                child = emptyCaseNode();
                node.bySpelling.set(part, child);
            }
            node = child;
        }
        node.terminals.push(path);
    }
    // A collision is recorded once, at the segment where spellings diverge, and
    // shared down the subtree. Pairing every descendant of one spelling with
    // every descendant of another grew quadratically with the subtree sizes.
    // The walk is iterative because a ZIP name can hold more components than
    // the call stack allows.
    const collisions = new Map();
    const pending = [{ node: root, prefix: undefined, chain: undefined }];
    for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
        const { node, prefix, chain } = item;
        if (chain !== undefined)
            for (const path of node.terminals)
                collisions.set(path, collisionsAlong(chain));
        for (const spellings of node.spellingsByFold.values())
            spellings.sort(compareUnicodeCodePoints);
        for (const [spelling, child] of node.bySpelling) {
            const childPrefix = prefix === undefined ? spelling : `${prefix}/${spelling}`;
            const spellings = node.spellingsByFold.get(englishCaseFold(spelling)) ?? [];
            const other = spellings[0] === spelling ? spellings[1] : spellings[0];
            pending.push({
                node: child,
                prefix: childPrefix,
                chain: other === undefined
                    ? chain
                    : {
                        collision: {
                            prefix: childPrefix,
                            other: prefix === undefined ? other : `${prefix}/${other}`,
                            additional: spellings.length - 2,
                        },
                        parent: chain,
                    },
            });
        }
    }
    return collisions;
};
const collisionsAlong = (chain) => {
    const collisions = [];
    let link = chain;
    while (link !== undefined) {
        collisions.push(link.collision);
        link = link.parent;
    }
    return collisions.reverse();
};
