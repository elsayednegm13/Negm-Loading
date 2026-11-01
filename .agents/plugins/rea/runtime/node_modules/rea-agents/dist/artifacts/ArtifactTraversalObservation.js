import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { normalizeArtifactPath } from "./ArtifactPaths.js";
/** Retain producer coverage and omissions across one or more exhausted traversals. */
export class ArtifactTraversalObservation {
    #limitations = new Set();
    #unknown = false;
    onCoverage = (coverage) => {
        this.#unknown ||= coverage.status === "unknown";
        for (const limitation of coverage.limitations)
            this.#limitations.add(limitation);
    };
    onOmission = (omission) => {
        const path = normalizeArtifactPath(omission.path);
        this.#unknown = true;
        this.#limitations.add(`Artifact traversal omitted ${omission.kind} at ${JSON.stringify(path)}.`);
    };
    snapshot() {
        return {
            status: this.#unknown ? "unknown" : "complete",
            limitations: [...this.#limitations].sort(compareUnicodeCodePoints),
        };
    }
}
