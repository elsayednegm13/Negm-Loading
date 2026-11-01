import { requireAnalysisViewRetention, summarizeRetainedAnalysis, } from "../analysisView/AnalysisViewService.js";
import { AnalysisCancelledError } from "../../domain/analysisErrorCore.js";
import { androidPackageInspectionInputSchema } from "../../domain/android/androidAnalysis.js";
import { analysisInputErrorFromIssues } from "../../domain/inputIssueProjection.js";
import { err } from "../../domain/result.js";
/** Preserve the complete provider request; select retained delivery explicitly. */
export const inspectAndroidPackage = async (service, rawInput, retention, options) => {
    const operation = "inspect_android_package";
    if (options?.signal?.aborted === true)
        return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
    const parsed = androidPackageInspectionInputSchema.safeParse(rawInput);
    if (!parsed.success)
        return err(analysisInputErrorFromIssues(operation, parsed.error.issues, rawInput, {
            cause: parsed.error,
        }));
    if (parsed.data.detail === "summary") {
        const ready = requireAnalysisViewRetention(operation, retention);
        if (!ready.ok)
            return ready;
    }
    const executed = await service.execute(operation, { path: parsed.data.path }, options);
    if (!executed.ok || parsed.data.detail !== "summary")
        return executed;
    return summarizeRetainedAnalysis(executed.value, retention);
};
