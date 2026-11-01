import { z } from "zod";
import { browserAllowedOriginsSchema, browserEndpointSchema, recordedBrowserObservationEndpointSchema, } from "../browserObservation.js";
import { webPageInspectionSchema, } from "../browserObservationSchemas.js";
import { classifyBrowserCompleteness, } from "../browserCompleteness.js";
import { electronPageInspectionSchema, } from "./electronObservation.js";
import { javascriptRuntimeObservationSchema, javascriptRuntimeKindSchema, } from "./javascriptRuntimeObservation.js";
import { digestCanonicalValue } from "../canonicalDigest.js";
import { compareUnicodeCodePoints } from "../unicodeCodePointOrder.js";
import { parseActiveElectronCapture } from "./javascriptRuntimeReconciliationActive.js";
import { assertEvidenceIdentity, authenticateRuntimeEvidence, invalidInput, parseInputAtPath, } from "./javascriptRuntimeReconciliationInputValidation.js";
/** Parse only supported passive web/Electron inspection Evidence. */
export const parseRuntimeCaptures = (observations, path = ["runtime_observations"]) => observations
    .map((observation, index) => parseRuntimeCapture(observation, [...path, index]))
    .sort((left, right) => compareUnicodeCodePoints(left.evidence.evidence_id, right.evidence.evidence_id));
const parseRuntimeCapture = (input, evidencePath) => {
    const evidence = authenticateRuntimeEvidence(input, evidencePath);
    if (evidence.operation === "inspect_web_page")
        return parseBrowserCapture(evidence, evidencePath);
    if (evidence.operation === "inspect_electron_page")
        return parseElectronCapture(evidence, evidencePath);
    if (evidence.operation === "observe_javascript_runtime")
        return parseV8Capture(evidence, evidencePath);
    if (evidence.operation === "capture_electron_scenario") {
        return parseActiveElectronCapture(evidence, evidencePath);
    }
    throw invalidInput(evidencePath, "Runtime reconciliation requires inspect_web_page, inspect_electron_page, observe_javascript_runtime, or capture_electron_scenario Evidence");
};
const parseBrowserCapture = (evidence, path) => {
    assertEvidenceIdentity(evidence, {
        operation: "inspect_web_page",
        predicate: "rea.web-page-inspection",
        providerId: "rea-cdp-browser",
        providerName: "REA Chrome DevTools Protocol observation provider",
        providerVersion: "2",
        authority: "external-service",
        confidence: "observed",
    }, path);
    const inspection = parseInputAtPath(webPageInspectionSchema, evidence.normalized_result, [...path, "normalized_result"]);
    assertRuntimeParameters(evidence, {
        kind: "browser",
        targetId: inspection.target.target_id,
        targetOrigin: inspection.target.origin,
        sourceIncluded: inspection.scripts.items.some(({ source }) => source.included),
    }, path);
    return {
        kind: "browser",
        evidence,
        inspection,
        captureSha256: digestCanonicalValue(inspection, "Runtime reconciliation"),
        scriptsCompleteWithinScope: scriptsComplete(inspection.completeness),
        codeInventoryCompleteWithinScope: codeInventoryComplete(inspection.completeness),
    };
};
const parseElectronCapture = (evidence, path) => {
    assertEvidenceIdentity(evidence, {
        operation: "inspect_electron_page",
        predicate: "rea.electron-page-inspection",
        providerId: "rea-cdp-electron",
        providerName: "REA Electron file-page CDP observation provider",
        providerVersion: "1",
        authority: "external-service",
        confidence: "observed",
    }, path);
    const inspection = parseInputAtPath(electronPageInspectionSchema, evidence.normalized_result, [...path, "normalized_result"]);
    assertRuntimeParameters(evidence, {
        kind: "electron",
        targetId: inspection.target.target_id,
        sourceIncluded: inspection.scripts.items.some(({ source }) => source.included),
    }, path);
    return {
        kind: "electron",
        evidence,
        inspection,
        captureSha256: digestCanonicalValue(inspection, "Runtime reconciliation"),
        scriptsCompleteWithinScope: scriptsComplete(inspection.completeness),
        codeInventoryCompleteWithinScope: codeInventoryComplete(inspection.completeness),
    };
};
const parseV8Capture = (evidence, path) => {
    assertEvidenceIdentity(evidence, {
        operation: "observe_javascript_runtime",
        predicate: "rea.javascript-runtime-observation",
        providerId: "rea-v8-inspector",
        providerName: "REA passive Node/Electron V8 Inspector provider",
        providerVersion: "1",
        authority: "external-service",
        confidence: "observed",
    }, path);
    const result = parseInputAtPath(javascriptRuntimeObservationSchema, evidence.normalized_result, [...path, "normalized_result"]);
    assertV8RuntimeParameters(evidence, result, path);
    return {
        kind: "v8-inspector",
        evidence,
        inspection: normalizeV8Inspection(result),
        captureSha256: digestCanonicalValue(result, "Runtime reconciliation"),
        scriptsCompleteWithinScope: false,
        codeInventoryCompleteWithinScope: false,
    };
};
const assertV8RuntimeParameters = (evidence, result, path) => {
    const parameters = parseInputAtPath(z
        .object({
        inspector_endpoint: browserEndpointSchema,
        target_id: z.string().trim().min(1),
        runtime_kind: javascriptRuntimeKindSchema.optional(),
    })
        .passthrough(), evidence.parameters, [...path, "parameters"]);
    if (parameters.target_id !== result.target.target_id)
        throw invalidInput([...path, "parameters", "target_id"], "Runtime Evidence target disagrees with its result");
    if (parameters.runtime_kind !== undefined &&
        parameters.runtime_kind !== result.target.runtime_kind)
        throw invalidInput([...path, "parameters", "runtime_kind"], "Runtime Evidence declared role disagrees with its result");
    if (result.target.location.kind === "builtin" &&
        !result.target.location.specifier.startsWith("node:"))
        throw invalidInput([...path, "normalized_result", "target", "location"], "Runtime Evidence contains an invalid builtin location");
    for (const [index, { location }] of result.scripts.items.entries())
        if (location.kind === "builtin" && !location.specifier.startsWith("node:"))
            throw invalidInput([...path, "normalized_result", "scripts", "items", index, "location"], "Runtime Evidence contains an invalid builtin location");
};
const normalizeV8Inspection = (result) => ({
    target: {
        target_id: result.target.target_id,
        type: result.target.protocol_type,
        title: result.target.runtime_kind,
        attached: result.target.attached,
        ...(result.target.location.kind === "unresolved"
            ? { unresolved_location: result.target.location }
            : runtimeLocation(result.target.location)),
    },
    frames: [],
    scripts: {
        items: result.scripts.items.map((script) => ({
            script_key: script.script_key,
            frame_id: script.execution_context_key,
            ...runtimeLocation(script.location),
            ...("reported_url" in script && script.reported_url !== undefined
                ? { reported_url: script.reported_url }
                : {}),
            cdp_hash: script.cdp_hash,
            length: script.length,
            is_module: script.is_module,
            language: null,
            source: {
                included: false,
                reason: "V8 Inspector source capture is outside passive authority.",
            },
        })),
    },
    workers: [],
    // Route exclusions as CdpCaptureCompleteness does: denied locations are
    // policy filtered, while invalid protocol values leave scripts unavailable.
    completeness: classifyBrowserCompleteness({
        policyFilteredSections: new Set(result.scripts.excluded.unsupported_location > 0 ? ["scripts"] : []),
        attachLimitedSections: new Set([
            "frames",
            "scripts",
            "script_sources",
            "workers",
        ]),
        truncatedSections: new Set(result.capture.truncated ? ["scripts"] : []),
        unavailableSections: new Set([
            "frames",
            "script_sources",
            "workers",
            ...(result.scripts.excluded.invalid_protocol_value > 0
                ? ["scripts"]
                : []),
        ]),
        excluded: v8ScriptExclusions(result),
        droppedEvents: {
            scripts: result.capture.events_dropped,
            network_requests: 0,
            console_events: 0,
            websocket_connections: 0,
            websocket_frames: 0,
            webmcp_tools: 0,
            timeline_events: 0,
        },
    }),
});
const runtimeLocation = (location) => {
    if (location.kind === "unresolved")
        return { unresolved_location: location };
    if (location.kind === "file")
        return { file_path: location.file_path };
    if (location.kind === "url")
        return { url: location.sanitized_url };
    return { url: location.specifier };
};
const v8ScriptExclusions = (result) => {
    const { unsupported_location, invalid_protocol_value } = result.scripts.excluded;
    return [
        ...(unsupported_location > 0
            ? [
                {
                    section: "scripts",
                    reason: "out_of_target_scope",
                    count: unsupported_location,
                },
            ]
            : []),
        ...(invalid_protocol_value > 0
            ? [
                {
                    section: "scripts",
                    reason: "invalid_protocol_value",
                    count: invalid_protocol_value,
                },
            ]
            : []),
    ];
};
const assertRuntimeParameters = (evidence, expected, path) => {
    const common = {
        target_id: z.string().trim().min(1),
        include_script_sources: z.boolean(),
    };
    if (expected.kind === "browser") {
        const parameters = parseInputAtPath(z
            .object({
            ...common,
            cdp_endpoint: recordedBrowserObservationEndpointSchema,
            allowed_origins: browserAllowedOriginsSchema,
        })
            .passthrough(), evidence.parameters, [...path, "parameters"]);
        if (parameters.target_id !== expected.targetId)
            throw invalidInput([...path, "parameters", "target_id"], "Runtime Evidence target disagrees with its captured result");
        if (!parameters.allowed_origins.includes(expected.targetOrigin))
            throw invalidInput([...path, "parameters", "allowed_origins"], "Browser Evidence target is outside its recorded origin scope");
        if (expected.sourceIncluded && !parameters.include_script_sources)
            throw invalidInput([...path, "parameters", "include_script_sources"], "Runtime Evidence contains source without source-capture selection");
        return;
    }
    const parameters = parseInputAtPath(z.object({ ...common, cdp_endpoint: browserEndpointSchema }).passthrough(), evidence.parameters, [...path, "parameters"]);
    if (parameters.target_id !== expected.targetId)
        throw invalidInput([...path, "parameters", "target_id"], "Runtime Evidence target disagrees with its captured result");
    if (expected.sourceIncluded && !parameters.include_script_sources)
        throw invalidInput([...path, "parameters", "include_script_sources"], "Runtime Evidence contains source without source-capture selection");
};
const scriptsComplete = (completeness) => !completeness.attach_limited_sections.includes("scripts") &&
    !completeness.truncated_sections.includes("scripts") &&
    !completeness.unavailable_sections.includes("scripts") &&
    completeness.dropped_events.scripts === 0;
// Missing worker inventory cannot establish absence of a worker code asset,
// even when the selected page's own script inventory is complete.
const codeInventoryComplete = (completeness) => scriptsComplete(completeness) &&
    !completeness.unavailable_sections.includes("workers") &&
    !completeness.truncated_sections.includes("workers") &&
    !completeness.attach_limited_sections.includes("workers");
