import { createCapturedWebScriptReconciler, stableWebScriptKey, } from "../domain/webInventory.js";
import { requiredScriptSource, sourceExcluded, sourceResult, } from "./CdpCaptureValues.js";
import { compareUnicodeCodePoints } from "../domain/unicodeCodePointOrder.js";
import { AnalysisCancelledError } from "../domain/analysisErrorCore.js";
import { selectedCdpCommandTimeoutMs } from "../domain/browserDeadline.js";
import { CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON, cdpScriptSourceDeadlineOmissionReason, CdpScriptSourceBudget, } from "./CdpScriptSourceBudget.js";
export const captureScripts = async (options) => {
    const { context, events, rawResources, resources, frameIds } = options;
    let state;
    const drafts = [];
    const scripts = new Map(events.scripts);
    const commandTimeoutMs = selectedCdpCommandTimeoutMs(context.input.command_timeout_ms);
    const deadlineOmission = cdpScriptSourceDeadlineOmissionReason(commandTimeoutMs);
    const sourceBudget = context.input.include_script_sources && scripts.size > 0
        ? new CdpScriptSourceBudget(context.signal, commandTimeoutMs)
        : undefined;
    try {
        for (const script of scripts.values()) {
            state ??= {
                context,
                events,
                frameIds,
                reconcileResource: createCapturedWebScriptReconciler(rawResources, resources),
            };
            let source = context.input.include_script_sources
                ? sourceExcluded(deadlineOmission)
                : sourceExcluded("source capture was not selected");
            if (context.input.include_script_sources &&
                isSourceDeadlineExpired(sourceBudget)) {
                events.completeness.exclude("script_sources", "resource_budget_exhausted");
            }
            else if (context.input.include_script_sources &&
                sourceBudget !== undefined) {
                try {
                    source = await captureScriptSource(script, state, sourceBudget);
                }
                catch (cause) {
                    throwIfCallerCancelled(context.signal, context.operation);
                    if (isSourceDeadlineExpired(sourceBudget))
                        events.completeness.exclude("script_sources", "resource_budget_exhausted");
                    else
                        throw cause;
                }
            }
            drafts.push(buildScriptDraft(script, state, source));
        }
    }
    finally {
        sourceBudget?.dispose();
    }
    if (!context.input.include_script_sources)
        events.completeness.exclude("script_sources", "not_approved", scripts.size);
    return {
        ...keyAndBuildInventory(drafts, scripts.size),
        scriptIds: new Set(scripts.keys()),
    };
};
/** Settle once after the last CDP read, before normalizing completeness. */
export const finalizeScriptInventory = (snapshot, events) => {
    let lateCount = 0;
    for (const scriptId of events.scripts.keys())
        if (!snapshot.scriptIds.has(scriptId))
            lateCount += 1;
    if (lateCount > 0)
        events.completeness.drop("scripts", lateCount);
    return { ...snapshot.inventory, total: snapshot.inventory.total + lateCount };
};
const buildScriptDraft = (script, state, source) => {
    const inventoryScript = {
        frame_id: state.events.frameForScript(script, state.frameIds),
        url: script.url,
        cdp_hash: script.hash,
        length: script.length,
        is_module: script.isModule,
        language: script.language,
        source_map_url: script.sourceMapUrl,
    };
    return {
        item: {
            ...inventoryScript,
            origin: script.origin,
            resource_reconciliation: state.reconcileResource({
                ...inventoryScript,
                rawUrl: script.rawUrl,
            }),
            source,
        },
        sourceMapRawUrl: script.sourceMapRawUrl,
    };
};
const captureScriptSource = async (script, state, sourceBudget) => {
    const { context } = state;
    const response = await context.connection.send("Debugger.getScriptSource", { scriptId: script.scriptId }, context.sessionId, sourceBudget.signal);
    throwIfCallerCancelled(context.signal, context.operation);
    const content = requiredScriptSource(response, context.operation);
    if (sourceBudget.timedOut) {
        state.events.completeness.exclude("script_sources", "resource_budget_exhausted");
        return sourceExcluded(cdpScriptSourceDeadlineOmissionReason(sourceBudget.commandTimeoutMs));
    }
    if (!sourceBudget.admit(content)) {
        state.events.completeness.exclude("script_sources", "resource_budget_exhausted");
        return sourceExcluded(CDP_SCRIPT_SOURCE_BYTES_OMISSION_REASON);
    }
    return sourceResult(content);
};
const throwIfCallerCancelled = (signal, operation) => {
    if (signal?.aborted === true)
        throw new AnalysisCancelledError(operation, { cause: signal.reason });
};
const isSourceDeadlineExpired = (sourceBudget) => sourceBudget?.timedOut === true;
const keyAndBuildInventory = (drafts, scriptCount) => {
    const keyed = drafts.map((draft) => ({
        ...draft,
        base: stableWebScriptKey(draft.item),
    }));
    keyed.sort((left, right) => compareUnicodeCodePoints(left.base, right.base) ||
        compareUnicodeCodePoints(sourceDigest(left.item.source), sourceDigest(right.item.source)) ||
        compareUnicodeCodePoints(left.item.frame_id ?? "", right.item.frame_id ?? ""));
    const totals = new Map();
    for (const { base } of keyed)
        totals.set(base, (totals.get(base) ?? 0) + 1);
    const seen = new Map();
    const sourceMapRequests = [];
    const items = keyed.map(({ base, item, sourceMapRawUrl }) => {
        const occurrence = (seen.get(base) ?? 0) + 1;
        seen.set(base, occurrence);
        const scriptKey = totals.get(base) === 1 ? base : `${base}_${String(occurrence)}`;
        if (item.source_map_url !== null && sourceMapRawUrl !== null)
            sourceMapRequests.push({
                scriptKey,
                declaredUrl: item.source_map_url,
                fetchUrl: sourceMapRawUrl,
            });
        return { script_key: scriptKey, ...item };
    });
    return {
        inventory: { total: scriptCount, items },
        sourceMapRequests,
    };
};
const sourceDigest = (source) => (source.included ? source.artifact.sha256 : source.reason);
