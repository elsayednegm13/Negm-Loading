import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, init_artifactIdentity, init_unicodeCodePointOrder, logicalPathNfc } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-PV1DaSaC.js";
import { posix } from "node:path";

//#region dist/artifacts/StreamBytes.js
var streamChunkToBuffer;
function init_StreamBytes() {
	return (init_StreamBytes = __esmMin((() => {
		streamChunkToBuffer = (value) => {
			if (Buffer.isBuffer(value)) return value;
			if (value instanceof Uint8Array) return Buffer.from(value);
			if (typeof value === "string") return Buffer.from(value);
			throw new TypeError("Readable stream emitted a non-byte chunk");
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactPaths.js
var ABSOLUTE_DRIVE_PATH, PATH_DIAGNOSTIC_CODE_UNITS, pathDiagnostic, hasDestinationPath, ENGLISH_UNICODE_CASE_NOTE, ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION, DestinationCaseCollisionFailure, normalizeArtifactPath, ArtifactPathRegistry, emptyCaseNode, englishCaseFold, annotateEnglishUnicodeCaseCollisions, caseCollisionLimitation, destinationCaseCollision, englishUnicodeCaseCollisions, collisionsAlong;
function init_ArtifactPaths() {
	return (init_ArtifactPaths = __esmMin((() => {
		init_artifactIdentity();
		init_unicodeCodePointOrder();
		init_ArtifactReader();
		ABSOLUTE_DRIVE_PATH = /^[A-Za-z]:[\\/]/u;
		PATH_DIAGNOSTIC_CODE_UNITS = 128;
		pathDiagnostic = (path) => path.length <= PATH_DIAGNOSTIC_CODE_UNITS ? JSON.stringify(path) : `${JSON.stringify(path.slice(0, PATH_DIAGNOSTIC_CODE_UNITS))}… (${String(path.length)} UTF-16 code units)`;
		hasDestinationPath = (kind) => kind !== "metadata";
		ENGLISH_UNICODE_CASE_NOTE = "This comparison is not a filesystem observation.";
		ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION = `Logical archive names collide under English (en-US) Unicode case folding; a case-insensitive destination cannot store both spellings. ${ENGLISH_UNICODE_CASE_NOTE}`;
		DestinationCaseCollisionFailure = class extends ArtifactReaderFailure {
			requestedPath;
			existingPath;
			constructor(requestedPath, existingPath, options) {
				super("path", `Destination filesystem cannot store both ${requestedPath} and ${existingPath}; inventory retains both logical names.`, options);
				this.requestedPath = requestedPath;
				this.existingPath = existingPath;
				this.name = "DestinationCaseCollisionFailure";
			}
		};
		normalizeArtifactPath = (input) => {
			if (input.includes("\0") || input.startsWith("/") || ABSOLUTE_DRIVE_PATH.test(input)) throw new ArtifactReaderFailure("path", `Artifact path is absolute or unsafe: ${pathDiagnostic(input)}`);
			const normalized = logicalPathNfc(input).replace(/\/+$/u, "");
			const parts = normalized.split("/");
			if (normalized.length === 0 || parts.some((part) => part === "" || part === "." || part === "..") || posix.normalize(normalized) !== normalized) throw new ArtifactReaderFailure("path", `Artifact path is not normalized: ${pathDiagnostic(input)}`);
			return normalized;
		};
		ArtifactPathRegistry = class {
			#root = {
				kind: undefined,
				children: new Map()
			};
			add(path, kind) {
				if (!hasDestinationPath(kind)) return;
				const parts = path.split("/");
				let node = this.#root;
				for (const [index, part] of parts.entries()) {
					if (node.kind !== undefined && node.kind !== "directory") throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${pathDiagnostic(path)}`);
					let child = node.children.get(part);
					if (child === undefined) {
						child = {
							kind: undefined,
							children: new Map()
						};
						node.children.set(part, child);
					}
					node = child;
					if (index === parts.length - 1) {
						if (node.kind !== undefined && node.kind !== kind) throw new ArtifactReaderFailure("path", `Artifact path collision: ${pathDiagnostic(path)}`);
						if (kind !== "directory" && node.children.size > 0) throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${pathDiagnostic(path)}`);
					}
				}
				node.kind = kind;
			}
		};
		emptyCaseNode = () => ({
			bySpelling: new Map(),
			spellingsByFold: new Map(),
			terminals: []
		});
		englishCaseFold = (part) => part.toLocaleLowerCase("en-US");
		annotateEnglishUnicodeCaseCollisions = (occurrences) => {
			const destinations = occurrences.filter(({ entry_kind }) => hasDestinationPath(entry_kind));
			const collisions = englishUnicodeCaseCollisions(destinations.map(({ logical_path }) => logical_path));
			if (collisions.size === 0) return undefined;
			for (const occurrence of destinations) for (const collision of collisions.get(occurrence.logical_path) ?? []) occurrence.limitations.push(caseCollisionLimitation(occurrence.logical_path, collision));
			return ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION;
		};
		caseCollisionLimitation = (path, { prefix, other, additional }) => {
			const others = additional === 0 ? other : `${other} and ${String(additional)} other spelling${additional === 1 ? "" : "s"}`;
			const subject = prefix === path ? `Logical path ${path} collides` : `Logical path ${path} is under ${prefix}, which collides`;
			return `${subject} under English (en-US) Unicode case folding with ${others}; a case-insensitive destination cannot store both. ${ENGLISH_UNICODE_CASE_NOTE}`;
		};
		destinationCaseCollision = (requestedPath, existingNames, options) => {
			const slash = requestedPath.lastIndexOf("/");
			const segment = slash < 0 ? requestedPath : requestedPath.slice(slash + 1);
			if (existingNames.includes(segment)) return undefined;
			const folded = englishCaseFold(segment);
			const existing = existingNames.filter((name) => englishCaseFold(name) === folded).sort(compareUnicodeCodePoints)[0];
			if (existing === undefined) return undefined;
			const parent = slash < 0 ? "" : requestedPath.slice(0, slash + 1);
			return new DestinationCaseCollisionFailure(requestedPath, `${parent}${existing}`, options);
		};
		englishUnicodeCaseCollisions = (paths) => {
			const root = emptyCaseNode();
			for (const path of paths) {
				if (path.length === 0 || path === ".") continue;
				let node = root;
				for (const part of path.split("/")) {
					let child = node.bySpelling.get(part);
					if (child === undefined) {
						const folded = englishCaseFold(part);
						const spellings = node.spellingsByFold.get(folded);
						if (spellings === undefined) node.spellingsByFold.set(folded, [part]);
						else spellings.push(part);
						child = emptyCaseNode();
						node.bySpelling.set(part, child);
					}
					node = child;
				}
				node.terminals.push(path);
			}
			const collisions = new Map();
			const pending = [{
				node: root,
				prefix: undefined,
				chain: undefined
			}];
			for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
				const { node, prefix, chain } = item;
				if (chain !== undefined) for (const path of node.terminals) collisions.set(path, collisionsAlong(chain));
				for (const spellings of node.spellingsByFold.values()) spellings.sort(compareUnicodeCodePoints);
				for (const [spelling, child] of node.bySpelling) {
					const childPrefix = prefix === undefined ? spelling : `${prefix}/${spelling}`;
					const spellings = node.spellingsByFold.get(englishCaseFold(spelling)) ?? [];
					const other = spellings[0] === spelling ? spellings[1] : spellings[0];
					pending.push({
						node: child,
						prefix: childPrefix,
						chain: other === undefined ? chain : {
							collision: {
								prefix: childPrefix,
								other: prefix === undefined ? other : `${prefix}/${other}`,
								additional: spellings.length - 2
							},
							parent: chain
						}
					});
				}
			}
			return collisions;
		};
		collisionsAlong = (chain) => {
			const collisions = [];
			let link = chain;
			while (link !== undefined) {
				collisions.push(link.collision);
				link = link.parent;
			}
			return collisions.reverse();
		};
	})))();
}

//#endregion
export { ArtifactPathRegistry, DestinationCaseCollisionFailure, annotateEnglishUnicodeCaseCollisions, destinationCaseCollision, hasDestinationPath, init_ArtifactPaths, init_StreamBytes, normalizeArtifactPath, streamChunkToBuffer };