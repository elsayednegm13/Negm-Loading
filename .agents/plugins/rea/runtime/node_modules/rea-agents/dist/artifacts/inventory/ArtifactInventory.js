import { realpath } from "node:fs/promises";
import { artifactInventoryResultSchema, } from "../../domain/artifactGraph.js";
import { abortIfNeeded } from "../ArtifactHash.js";
import { scanCanonicalArtifactInventoryInScope, scanCanonicalArtifactInventoryForExtractionInScope, } from "./scanCanonical.js";
/** Inventory one local artifact and return every graph collection inline. */
export const inventoryArtifact = async (inputPath, options) => {
    const snapshot = await options.resourceScope.run(() => scanArtifactInventoryInScope(inputPath, options));
    return artifactInventoryResultSchema.parse(snapshot);
};
export const scanArtifactInventoryInScope = async (inputPath, options) => {
    abortIfNeeded(options.signal);
    const path = await realpath(inputPath);
    return scanCanonicalArtifactInventoryInScope(path, options);
};
export const scanArtifactInventoryForExtractionInScope = async (inputPath, options) => {
    abortIfNeeded(options.signal);
    const path = await realpath(inputPath);
    return scanCanonicalArtifactInventoryForExtractionInScope(path, options);
};
