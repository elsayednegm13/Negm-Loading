import { ArtifactReaderFailure } from "./ArtifactReader.js";
/** Setup failed after this tree was acquired; callers still own this exact tree. */
export class SafeOutputTreeCreationFailure extends ArtifactReaderFailure {
    tree;
    constructor(cause, tree) {
        const primary = cause instanceof ArtifactReaderFailure
            ? cause
            : new ArtifactReaderFailure("io", errorMessage(cause), { cause });
        super(primary.reason, primary.message, {
            cause: primary,
            cancellation: primary.cancellation,
            ...(primary.cleanup === undefined ? {} : { cleanup: primary.cleanup }),
            ...(primary.partialObservation === undefined
                ? {}
                : { partialObservation: primary.partialObservation }),
        }, primary.details);
        this.name = "SafeOutputTreeCreationFailure";
        this.tree = tree;
    }
}
const errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
