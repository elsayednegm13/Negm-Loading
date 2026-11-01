import { ArtifactOperationError } from "./artifactOperationError.js";
/** Publication failure retaining its input/output target and cleanup state. */
export class WebScriptExportError extends ArtifactOperationError {
    userMessage;
    cleanupIncomplete;
    constructor(reason, target, diagnostic, options = {}) {
        super("export_web_scripts", reason, undefined, undefined, options);
        this.userMessage = `Script export failed for ${target}: ${diagnostic}`;
        this.setCleanupResources([
            ...new Set([
                ...(options.cleanup?.resources ?? []),
                ...(options.residualPaths ?? []),
            ]),
        ]);
        this.cleanupIncomplete =
            options.cleanup !== undefined || (options.residualPaths?.length ?? 0) > 0;
    }
}
