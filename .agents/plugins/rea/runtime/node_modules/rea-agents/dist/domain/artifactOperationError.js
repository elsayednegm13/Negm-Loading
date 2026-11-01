import { projectArtifactIntegrityDetails, } from "./artifactIntegrity.js";
import { AnalysisError, } from "./analysisErrorBase.js";
/** Artifact inventory or extraction failed a typed safety boundary. */
export class ArtifactOperationError extends AnalysisError {
    operation;
    reason;
    artifactDetails;
    detail;
    _tag = "ArtifactOperationError";
    userMessage;
    admission;
    boundary;
    constructor(operation, reason, artifactDetails, 
    /** The specific constraint that failed, such as the colliding path. */
    detail, options) {
        super(artifactDetails === undefined
            ? `Artifact ${operation} failed: ${reason}`
            : artifactDetailsMessage(operation, reason, artifactDetails), options);
        this.operation = operation;
        this.reason = reason;
        this.artifactDetails = artifactDetails;
        this.detail = detail;
        this.admission = options?.admission;
        this.boundary = options?.boundary;
        this.userMessage =
            options?.userMessage ??
                (options?.admission === undefined ? undefined : detail);
    }
}
const artifactDetailsMessage = (operation, reason, details) => {
    const { logical_path, ...facts } = projectArtifactIntegrityDetails(details);
    const description = Object.entries(facts)
        .map(([key, value]) => `${key}=${String(value ?? "unavailable")}`)
        .join(", ");
    return `Artifact ${operation} failed: ${reason} at ${logical_path} (${description})`;
};
