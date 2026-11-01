import { createElectronFuseEvidence } from "../domain/electron/electronFuseEvidence.js";
import { ArtifactResourceScope } from "../artifacts/ArtifactResourceScope.js";
import { assertArtifactReadActive, artifactFileCompletion, } from "../artifacts/ArtifactFileOperation.js";
import { AnalysisOutputError } from "../domain/analysisErrorCore.js";
import { describeElectronFuseFindings, electronFuseReportSchema, } from "../domain/electron/electronFuses.js";
import { err, ok } from "../domain/result.js";
import { resolveElectronFuseTarget } from "./ElectronFusePath.js";
import { electronFuseReadLimitation, readElectronFuseImage, } from "./ElectronFuseReader.js";
import { ELECTRON_FUSE_PROVIDER_IDENTITY, electronFuseFailure, } from "./ElectronFuseFailures.js";
export { ELECTRON_FUSE_PROVIDER_IDENTITY };
const OPERATION = "inspect_electron_fuses";
/** Read packaged Electron fuse wires from one selected local file or app bundle. */
export class ElectronFuseProvider {
    identity = ELECTRON_FUSE_PROVIDER_IDENTITY;
    #resources = new ArtifactResourceScope();
    /** Retry the same failed descriptor owners, awaiting active reads first. */
    async close() {
        try {
            await this.#resources.close();
        }
        catch (cause) {
            throw electronFuseFailure(cause, "artifact-resources");
        }
    }
    async inspect(input, options) {
        try {
            return await this.#resources.run(() => this.#inspectFile(input, options));
        }
        catch (cause) {
            return err(electronFuseFailure(cause, input.path));
        }
    }
    async #inspectFile(input, options) {
        let resolvedPath = input.path;
        let completed;
        try {
            assertArtifactReadActive(options?.signal);
            const located = await resolveElectronFuseTarget(input.path, options?.signal);
            assertArtifactReadActive(options?.signal);
            resolvedPath = located.file.path;
            const image = await readElectronFuseImage(located.file.path, {
                resources: this.#resources,
                selection: located.file,
                ...(options?.signal === undefined ? {} : { signal: options.signal }),
            });
            completed = reportFor(image, located.selectedPath, resolvedPath);
            assertArtifactReadActive(options?.signal);
            return ok(completed);
        }
        catch (cause) {
            const failure = electronFuseFailure(cause, input.path);
            // Only this reader's completed physical outcome supplies partial fuse facts.
            const completion = artifactFileCompletion(cause);
            const report = completed ??
                (completion === undefined
                    ? undefined
                    : reportFor(completion.value, input.path, resolvedPath));
            if (report !== undefined) {
                failure.retainPartialObservation(createElectronFuseEvidence(input, report, this.identity));
            }
            return err(failure);
        }
    }
}
const reportFor = (image, selectedPath, resolvedPath) => {
    const findings = describeElectronFuseFindings(image.slices, image.format);
    const parsed = electronFuseReportSchema.safeParse({
        artifact: {
            selected_path: selectedPath,
            resolved_path: resolvedPath,
            sha256: image.sha256,
            bytes: image.bytes,
            format: image.format,
        },
        slices: image.slices,
        runtime_implications: findings.runtime_implications,
        limitations: [...findings.limitations, electronFuseReadLimitation()],
    });
    if (!parsed.success)
        throw new AnalysisOutputError(OPERATION, "Electron fuse reader produced a report outside its schema.", { cause: parsed.error });
    return parsed.data;
};
