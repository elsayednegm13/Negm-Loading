import { readFileHandleChunks, } from "../filesystem/readFileHandleChunks.js";
import { ArtifactReaderFailure } from "./ArtifactReader.js";
/** Produce artifact cancellation facts at the actual descriptor read boundary. */
export const readArtifactFileChunks = (handle, options = {}) => readFileHandleChunks(handle, {
    ...options,
    cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", "Artifact file read cancelled", {
        cause: reason,
    }),
});
