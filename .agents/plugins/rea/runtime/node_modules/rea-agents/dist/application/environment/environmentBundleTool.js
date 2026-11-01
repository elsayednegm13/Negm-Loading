import { AnalysisError } from "../../domain/analysisErrorBase.js";
import { SafeOutputTree } from "../../artifacts/SafeOutputTree.js";
import { outputDirectoryAdmissionRefusal } from "../../artifacts/SafeOutputTreeAdmission.js";
import { err } from "../../domain/result.js";
import { resolveEvidenceInput, } from "../EvidenceInputResolver.js";
import { DEFAULT_BUILD_TEMPLATE_RULES, buildEnvironment, } from "./environmentBuild.js";
import { environmentExportEvidenceFile, readEnvironmentExportFile, } from "./environmentExport.js";
/** MCP tool and operation name of the bundle export. */
export const EXPORT_ENVIRONMENT_BUNDLE_OPERATION = "export_environment_bundle";
/** The capture's bytes as the bundle ships them: a file's own bytes, or retained Evidence as `--format json` writes it. */
const captureFile = async (source, lookup) => {
    if (source.kind === "evidence-file")
        return readEnvironmentExportFile("evidence", source.path, EXPORT_ENVIRONMENT_BUNDLE_OPERATION);
    const retained = resolveEvidenceInput(source, lookup);
    if (!retained.ok)
        return retained;
    return environmentExportEvidenceFile("evidence", source.evidence_id, retained.value, EXPORT_ENVIRONMENT_BUNDLE_OPERATION);
};
/**
 * Build an environment bundle from capture Evidence into an absent output
 * directory whose parent exists, as environment-build does, and return the
 * same report. A dry run checks the directory and writes nothing.
 */
export const exportEnvironmentBundleTool = async (input, lookup, options = {}) => {
    try {
        await SafeOutputTree.checkDestination(input.output_directory);
    }
    catch (cause) {
        const refusal = outputDirectoryAdmissionRefusal(EXPORT_ENVIRONMENT_BUNDLE_OPERATION, "output_directory", cause);
        if (refusal instanceof AnalysisError)
            return err(refusal);
        throw refusal;
    }
    const capture = await captureFile(input.source, lookup);
    if (!capture.ok)
        return capture;
    return buildEnvironment({
        capture: capture.value,
        captureInput: "evidence",
        capturePath: input.source.kind === "evidence-file" ? input.source.path : "",
        templateRules: input.template_rules ?? DEFAULT_BUILD_TEMPLATE_RULES,
        directory: input.output_directory,
        name: input.name,
        packageTarball: input.package_tarball,
        dryRun: input.dry_run,
        signal: options.signal,
        exclusiveDestination: true,
    });
};
