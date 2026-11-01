import { readArtifactInspectionSources } from "../domain/artifactInspection.js";
import { z } from "incur";
import { parseEvidence } from "../domain/evidence.js";
import { projectAnalysisError } from "../domain/analysisErrorProjection.js";
import { err, ok } from "../domain/result.js";
import { AnalysisInputError } from "../domain/analysisErrorCore.js";
import { createEvidenceBundle } from "../domain/evidenceBundle.js";
import { publishEvidenceDelivery } from "../application/EvidenceBundleCommands.js";
import { inspectAnalysisViewValidated } from "../application/analysisView/AnalysisViewService.js";
import { localPathStringSchema } from "../domain/localPath.js";
import { absoluteCallerPath } from "../filesystem/callerPath.js";
import { finishAnalysisCommand } from "./finishAnalysisCommand.js";
import { analysisInputErrorFromIssues } from "../domain/inputIssueProjection.js";
export const analysisEvidenceDeliveryOptions = {
    detail: z
        .enum(["complete", "summary"])
        .default("complete")
        .describe("Deliver complete Evidence, or a summary with --evidence_output"),
    evidence_output: localPathStringSchema
        .optional()
        .describe("Save complete Evidence as a bundle; required for summary delivery. Never overwrites."),
};
const isEvidence = (value) => typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "evidence_id" in value &&
    "normalized_result" in value;
export const cliEvidenceDeliveryInputError = (input) => input.detail === "summary" && input.evidenceOutput === undefined
    ? new AnalysisInputError(input.operation, undefined, [
        {
            path: ["evidence_output"],
            reason: "invalid_value",
            message: "Summary delivery requires --evidence_output so complete source Evidence remains available.",
        },
    ])
    : undefined;
/** Parse delivery JSON once and enforce its owning schema before opening a target. */
export const parseCliAnalysisEvidenceDelivery = (operation, options, schema) => {
    let view;
    try {
        view = options.view === undefined ? undefined : JSON.parse(options.view);
    }
    catch (cause) {
        return err(new AnalysisInputError(operation, { cause }, [
            {
                path: ["view"],
                reason: "invalid_format",
                message: "view must be valid JSON",
            },
        ]));
    }
    const raw = {
        detail: options.detail,
        ...(view === undefined ? {} : { view }),
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success)
        return err(analysisInputErrorFromIssues(operation, parsed.error.issues, raw));
    const value = { ...parsed.data, evidenceOutput: options.evidence_output };
    const invalid = cliEvidenceDeliveryInputError({ ...value, operation });
    return invalid === undefined ? ok(value) : err(invalid);
};
/** One-shot delivery owns report publication; analysis keeps its own cleanup owner. */
export const deliverCliAnalysisEvidence = async (input) => {
    const { run, service, providerId, operation, signal, detail, evidenceOutput, } = input;
    const inputError = cliEvidenceDeliveryInputError(input);
    if (inputError !== undefined)
        return finishAnalysisCommand(async () => ({ ok: false, error: inputError }), service, providerId, operation, signal);
    const complete = await finishAnalysisCommand(run, service, providerId, operation, signal);
    return publishCliAnalysisEvidence(complete, {
        providerId,
        operation,
        signal,
        detail,
        evidenceOutput,
        ...(input.view === undefined ? {} : { view: input.view }),
        ...(input.sourceEvidence === undefined
            ? {}
            : { sourceEvidence: input.sourceEvidence }),
    });
};
/** Publish already finalized CLI analysis without opening a second provider/session. */
export const publishCliAnalysisEvidence = async (value, input) => {
    const { operation, signal, detail, evidenceOutput } = input;
    if (!isEvidence(value))
        return value;
    const complete = parseEvidence(value);
    const inputError = cliEvidenceDeliveryInputError(input);
    if (inputError !== undefined) {
        inputError.retainPartialObservation(complete);
        return projectAnalysisError(inputError);
    }
    if (evidenceOutput === undefined)
        return complete;
    // Project before publication so a view failure cannot commit an
    // unreported bundle; publication then owns every post-commit outcome.
    const delivered = detail === "summary"
        ? inspectAnalysisViewValidated({
            source: { kind: "inline", evidence: complete },
            view: input.view ?? { kind: "summary" },
        })
        : ok(complete);
    if (!delivered.ok)
        return projectAnalysisError(delivered.error.retainPartialObservation(complete));
    const inspectionSources = complete.operation === "inspect_artifact"
        ? readArtifactInspectionSources(complete.normalized_result)
        : ok([]);
    if (!inspectionSources.ok)
        return projectAnalysisError(inspectionSources.error.retainPartialObservation(complete));
    const published = await publishEvidenceDelivery({
        bundle: createEvidenceBundle([
            ...new Map([
                ...(input.sourceEvidence ?? []),
                ...inspectionSources.value,
                complete,
            ].map((record) => [record.evidence_id, record])).values(),
        ]),
        complete,
        delivered: delivered.value,
        outputPath: absoluteCallerPath(evidenceOutput),
        operation,
        signal,
    });
    if (!published.ok)
        return projectAnalysisError(published.error);
    return detail === "summary"
        ? {
            summary: published.value.delivered,
            evidence_bundle: {
                path: published.value.evidenceBundle.path,
                bytes: published.value.evidenceBundle.bytes,
            },
        }
        : published.value.delivered;
};
