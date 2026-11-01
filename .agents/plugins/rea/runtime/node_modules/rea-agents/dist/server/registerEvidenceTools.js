import { createAnalysisExecutionEvidence } from "../domain/analysisObservation.js";
import { jsonObjectSchema } from "../domain/jsonValue.js";
import { ok } from "../domain/result.js";
import { mcpProgressReporter } from "./mcpProgress.js";
import { logToolExecution } from "./toolLogging.js";
import { toolRegistrationOptions } from "./toolRegistrationOptions.js";
import { recordEvidenceSources } from "../application/investigation/recordEvidenceSources.js";
import { reportOperationStart, reportOperationEnd, } from "./operationProgress.js";
/** Register provider-backed contracts that return atomic Evidence observations. */
export const registerEvidenceTools = (server, contracts, options) => {
    for (const contract of contracts) {
        server.registerTool(contract.name, toolRegistrationOptions(contract), async (input, context) => {
            const parameters = jsonObjectSchema.parse(input);
            const ready = options.preflight?.(contract.name, parameters);
            if (ready !== undefined && !ready.ok)
                return server.delivery.toCallToolResult(ready, contract);
            const admitted = await options.withAdmittedAnalysis(contract.name, context.mcpReq.signal, async (admittedAnalysis) => {
                const analysis = options.analysisForAdmission?.(admittedAnalysis) ??
                    admittedAnalysis;
                const progress = mcpProgressReporter(context);
                await reportOperationStart(progress, contract.name);
                const executionParameters = options.parametersForExecution?.(contract.name, parameters) ??
                    parameters;
                const execution = await logToolExecution(options.logger, contract.name, () => analysis.execute(contract.name, executionParameters, {
                    signal: context.mcpReq.signal,
                    progress,
                }));
                await reportOperationEnd(progress, contract.name, execution.ok);
                if (!execution.ok)
                    return server.delivery.toCallToolResult(execution, contract);
                const sourceEvidence = execution.value.sourceEvidence ?? [];
                const evidence = createAnalysisExecutionEvidence(contract.name, options.parametersForEvidence?.(contract.name, parameters) ??
                    parameters, {
                    ...execution.value,
                    subject: execution.value.subject === undefined
                        ? (options.activeTarget?.() ?? null)
                        : execution.value.subject,
                }, "observed");
                const sourceRecorded = recordEvidenceSources(options.recordEvidence, sourceEvidence);
                if (!sourceRecorded.ok)
                    return server.delivery.toCallToolResult(sourceRecorded, contract);
                const projected = options.projectEvidence?.(contract.name, parameters, evidence) ??
                    ok(evidence);
                if (!projected.ok)
                    return server.delivery.toCallToolResult(projected, contract);
                const recorded = options.recordEvidence?.(projected.value);
                return server.delivery.toEvidenceToolResult(projected.value, contract, recorded);
            });
            return admitted.ok
                ? admitted.value
                : server.delivery.toCallToolResult(admitted, contract);
        });
    }
};
