import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { JAVASCRIPT_SEMANTIC_RELATION_FAMILIES, JavaScriptSemanticEvidenceContextRegistry, absoluteLocalPathStringSchema, analysisProviderSelectorSchema, analysisSettingIdSchema, analysisSettingIds, analysisSettingValueSchema, analyzeJavaScriptApplicationInputSchema, applicationFeatureTraceResultSchema, applicationVersionComparisonResultSchema, artifactGraphDigest, artifactIdForContent, artifactInventoryResultSchema, artifactManifestId, browserTargetListSchema, completeApplicationCoverage, createEvidence, createHistoricalSourceGraph, createJavaScriptApplicationGraph, createJavaScriptApplicationNode, createJavaScriptSemanticGraph, createJavaScriptSemanticGraphNode, createWebTextArtifact, electronActiveObservationInputSchema, electronActiveObservationResultSchema, electronPageInspectionSchema, electronTargetListSchema, evidenceSchema, init_analysisSettingDefinitions, init_artifactGraph, init_artifactIdentity, init_browserObservation, init_browserObservationSchemas, init_digests, init_electronActiveObservation, init_electronFuses, init_electronObservation, init_evidence, init_evidenceReference, init_javascriptApplicationAnalysis, init_javascriptApplicationEvidenceSchemas, init_javascriptApplicationGraph, init_javascriptApplicationVersionComparisonSchemas, init_javascriptExportShapeComparisonSchemas, init_javascriptFeatureTraceSchemas, init_javascriptRuntimeObservation, init_javascriptSemanticGraph, init_javascriptSemanticGraphSchemas, init_javascriptSemanticTraceSchemas, init_localPath, init_peResources, init_processScenario, init_providerSelection, init_referenceSourceGraph, init_sourceToBundleComparisonSchemas, init_webContentArtifact, init_webNetworkCapture, inspectElectronFusesInputSchema, inspectElectronPageInputSchema, inspectPeResourcesInputSchema, inspectWebNetworkCaptureInputSchema, inspectWebPageInputSchema, javaScriptExportShapeComparisonResultSchema, javaScriptSemanticTraceResultSchema, javascriptApplicationAnalysisResultSchema, javascriptRuntimeObservationSchema, javascriptRuntimeTargetListSchema, listBrowserTargetsInputSchema, listElectronTargetsInputSchema, listJavaScriptRuntimeTargetsInputSchema, localPathStringSchema, observeJavaScriptRuntimeInputSchema, occurrenceIdForLocation, partialApplicationCoverage, peResourcesSchema, prefixedDigestSchema, processScenarioSchema, retainedEvidenceReferenceSchema, sourceToBundleComparisonResultSchema, webNetworkCaptureSchema, webPageInspectionSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { TEMPLATE_RULES, analysisViewResultSchema, androidInputSchemas, androidPackageInspectionInputSchema, androidPackageSummaryViewResultSchema, androidResultSchemas, binaryLayoutSchema, binaryLayoutSummaryViewResultSchema, commandEvidenceDetailSchema, commandObservationSchema, dartAotInspectionInputSchema, dartAotSummaryViewResultSchema, desktopApplicationSchema, desktopApplicationSummaryViewResultSchema, devicetreeSchema, devicetreeSummaryViewResultSchema, environmentCoverageSchema, erlangBeamCompleteDeliveryShape, erlangBeamSchema, erlangBeamSummaryDeliveryShape, erlangBeamSummaryViewResultSchema, erlangBeamTableViewResultSchema, flutterInputSchemas, flutterResultSchemas, gdbCommandResultSchema, gdbCommandSummaryViewResultSchema, goBinarySchema, goBinarySummaryViewResultSchema, gpuCodeObjectsPageViewResultSchema, gpuCodeObjectsSchema, gpuCodeObjectsSummaryViewResultSchema, il2cppMetadataSchema, il2cppMetadataSummaryViewResultSchema, init_analysisView, init_androidAnalysis, init_beam, init_binaryLayout, init_byteEntropy, init_commandObservation, init_desktopApplication, init_devicetree, init_environmentCoverageView, init_environmentManifestRules, init_erlangBeamView, init_flutterBuildAnalysis, init_goBinary, init_gpuCodeObjects, init_il2cppMetadata, init_javascriptRoutesView, init_modelArtifact, init_modelArtifactQuery, init_nativeExports, init_pcapAnalysis, init_publicInput, init_pythonPyc, init_pythonPycView, init_rustBinary, init_rustBinaryQuery, inspectAnalysisViewInputSchema, inspectBinaryLayoutInputSchema, inspectByteEntropyInputSchema, inspectDesktopApplicationInputSchema, inspectDevicetreeInputSchema, inspectErlangBeamInputSchema, inspectGoBinaryInputSchema, inspectGpuCodeObjectsInputSchema, inspectIl2cppMetadataInputSchema, inspectModelArtifactInputSchema, inspectNativeExportsInputSchema, inspectPythonPycInputSchema, inspectRustBinaryRequestSchema, javaScriptRoutesCompleteDeliveryShape, javaScriptRoutesSummaryDeliveryShape, javaScriptRoutesViewResultSchema, javascriptApplicationSummaryViewResultSchema, modelArtifactPageViewResultSchema, modelArtifactSchema, modelArtifactSummaryViewResultSchema, nativeExportsSchema, nativeExportsSummaryViewResultSchema, objdumpSummaryViewResultSchema, pcapCaptureSummaryViewResultSchema, pcapInputSchemas, pcapResultSchemas, publicInputStrictObject, pythonPycCodeObjectsViewResultSchema, pythonPycCompleteDeliveryShape, pythonPycSchema, pythonPycSummaryDeliveryShape, pythonPycSummaryViewResultSchema, rustBinaryPageViewResultSchema, rustBinarySchema, rustBinarySummaryViewResultSchema, sourceToBundlePageViewResultSchema, sourceToBundleSummaryViewResultSchema, webNetworkCaptureSummaryViewResultSchema, webRoutesSummaryDeliveryShape } from "./analysisView-DxQriOKj.js";
import { init_jsonValue, jsonObjectSchema } from "./jsonLines-Gf10X4s1.js";
import { functionComparisonInputSchema, init_functionComparisonSchemas, init_residualUnknown, recordUnknownInputSchema, updateUnknownInputSchema } from "./evidenceBundle-DojUFdme.js";
import { DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS, browserScenarioCaptureSchema, captureWebScreenshotInputSchema, compareWebScreenshotsInputSchema, init_browserScenarioCapture, init_browserScenarioCaptureLimits, init_webScreenshot, webScreenshotDiffSchema, webScreenshotSchema } from "./browserScenarioCapture-d91Wory3.js";
import { analysisErrorProjectionSchema, init_errorSchemas } from "./errorSchemas-DLqBwcTu.js";
import { analysisDetailOutputSchemaOf, analysisDetailSchema, analysisDetailSummaryDefaultSchema, artifactComparisonInputSchema, binaryArchitectureSchema, byteEntropyOutputSchema, callPathInputSchema, changedBehaviorInputSchema, compareManagedMembersInputSchema, electronFuseOutputSchemas, enhancedOutputSchemas, evidenceResultOf, init_analysisDetail, init_artifactComparison, init_callPathSchemas, init_changedBehavior, init_managedMemberComparison, init_managedNativeVerificationSchemas, init_managedReconstruction, init_rawBinary, init_reconstructionVerificationSchemas, init_staticRuntimeCorrelation, init_toolEffects, init_toolOutputSchemaGroups, init_toolOutputSchemaPrimitives, managedNativeVerificationInputSchema, managedReconstructionImportInputSchema, managedWorkflowOutputSchemas, rawBinaryEntryPointSchema, rawBinarySelectionError, reconstructionVerificationInputSchema, requireOutputSchema, sessionOutputSchemas, staticRuntimeCorrelationInputSchema, toolContractMetadata } from "./toolOutputSchemaGroups-D49U2-8O.js";
import { APK_SIGNATURE_TOOL_CONTRACTS, CUTTER_TOOL_CONTRACTS, EVM_TOOL_CONTRACTS, FIRMWARE_TOOL_REQUIREMENTS, FRIDA_TOOL_CONTRACTS, WASM_TOOL_CONTRACTS, adbInputSchemas, adbResultSchemas, addressContextInputSchema, analyzeJavaScriptSemantics, analyzeWebBundleInputSchema, apktoolInputSchemas, apktoolResultSchemas, appleIpsSchema, browserCaptureComparisonInputSchema, browserCaptureComparisonSchema, browserScenarioInputSchema, bundleComparisonMcpInputSchema, compareApplicationVersionsRequestSchema, compareJavaScriptExportShapesRequestSchema, compareSourceToBundleRequestSchema, decodeSignalRecordingInputSchema, discoverWebMcpToolsInputSchema, elfNotesSchema, exportWebScriptsInputSchema, firmwareInputSchemas, firmwareResultSchemas, getEvidenceBundleInputSchema, importEvidenceBundleInputSchema, init_adbDeviceAnalysis, init_apkSignatureToolContracts, init_apktoolResourceAnalysis, init_appleIps, init_applicationWorkflowInputContracts, init_browserCaptureComparison, init_browserScenario, init_browserSession, init_cutterToolContracts, init_elfNotes, init_evmToolContracts, init_firmwareAnalysis, init_firmwareToolRequirements, init_fridaToolContracts, init_functionMatchingContracts, init_javascriptRecovery, init_javascriptSemanticAnalysis, init_jebAnalysis, init_kernelModule, init_packetCapture, init_packetFields, init_peCertificates, init_peImports, init_peLoadConfig, init_recordedCrash, init_reverseEngineering, init_sessionToolSchemas, init_signalDecoders, init_signalRecording, init_sqliteDatabase, init_wasmToolContracts, init_webBundleAnalysis, init_webEventListeners, init_webExecution, init_webMcpDiscovery, init_webModuleTrace, init_webScriptExport, init_webSourceLocation, inspectAppleIpsInputSchema, inspectElfNotesInputSchema, inspectKernelModuleInputSchema, inspectPacketCaptureInputSchema, inspectPacketFieldsInputSchema, inspectPeCertificatesInputSchema, inspectPeImportsInputSchema, inspectPeLoadConfigInputSchema, inspectRecordedCrashInputSchema, inspectSignalDecodersInputSchema, inspectSqliteDatabaseInputSchema, inspectWebEventListenersInputSchema, javascriptRecoveryInputSchema, javascriptRecoveryResultSchema, jebInputSchemas, jebResultSchemas, kernelModuleSchema, listUnknownsInputSchema, matchNativeFunctionsInputSchema, navigationContextInputSchema, objdumpInputSchema, observeWebExecutionInputSchema, observeWebSessionInputSchema, packetCaptureSchema, packetFieldsCatalogSchema, peCertificatesSchema, peImportsSchema, peLoadConfigSchema, processComparisonInputSchema, recordedCrashSchema, rizinInputSchema, signalDecodersSchema, signalRecordingSchema, sqliteDatabaseSchema, traceApplicationFeatureRequestSchema, traceJavaScriptSemanticsRequestSchema, verifyUnknownResolutionInputSchema, webBundleAnalysisSchema, webEventListenersSchema, webExecutionSchema, webMcpDiscoverySchema, webModuleTraceInputSchema, webModuleTraceResultSchema, webObservationSessionSchema, webScriptExportResultSchema, webSourceLocationInputSchema, webSourceLocationResultSchema } from "./cutterToolContracts-QHLtCeq9.js";
import { MANAGED_TOOL_CONTRACTS, executableFormatHintSchema, init_dosCom, init_managedToolContracts } from "./managedToolContracts-depS6hrC.js";
import { NATIVE_TOOL_CONTRACTS, init_nativeToolContracts } from "./nativeToolContracts-UdqTuMlR.js";
import { ARTIFACT_TOOL_CONTRACTS, OFFICIAL_TOOL_CONTRACTS, TOOL_EXAMPLE_OVERRIDES, enhancedInputSchemas, examplesFor, init_artifactToolContracts, init_enhancedInputs, init_officialToolContracts, init_toolContractExamples, init_toolContractHelpers } from "./officialToolContracts-BfPYBWaZ.js";
import { init_javascriptRuntimeReconciliationSchemas, javascriptRuntimeReconciliationResultSchema, reconcileJavaScriptRuntimeInputSchema } from "./javascriptRuntimeReconciliationSchemas-D0EUQEj4.js";
import { applicationInventoryProjectionInputSchema, init_mobileApplicationGraphProjection } from "./bridgeCandidateProjection-CnT1LS_C.js";
import { init_reconstructionCoverage, init_reconstructionCoverageInput, reconstructionClosureResultSchema, reconstructionCoverageEvaluationInputSchema } from "./reconstructionCoverageInput-DGsKzzkh.js";
import { init_reconstructionObligationLedgerSchemas, reconstructionObligationLedgerInputSchema, reconstructionObligationLedgerSchema } from "./reconstructionObligationLedgerSchemas-B6t0Aw7n.js";
import { androidApplicationProjectionResultSchema, init_androidApplication } from "./androidApplication-BM-Wcg5K.js";
import { appleApplicationProjectionResultSchema, init_appleApplication } from "./appleApplication-Drcl7Tde.js";
import { harmonyApplicationProjectionResultSchema, init_harmonyApplication } from "./harmonyApplication-CovdgJ55.js";
import { init_javascriptRuntimeReconciliation, readRuntimeReconciliationInput, reconcileJavaScriptRuntime } from "./javascriptRuntimeReconciliation-Bgka2XdR.js";
import { init_javascriptExportReturnShapeProjection, projectJavaScriptExportReturnShapes } from "./javascriptExportReturnShapeProjection-DTsWxNf1.js";
import { z } from "zod";

//#region dist/contracts/analysisSettingsContracts.js
var inspectAnalysisSettingsInputSchema, updateAnalysisSettingsInputSchema, descriptor, analysisSettingsResultSchema, updateAnalysisSettingsResultSchema, ANALYSIS_SETTINGS_TOOL_CONTRACTS;
function init_analysisSettingsContracts() {
	return (init_analysisSettingsContracts = __esmMin((() => {
		init_errorSchemas();
		init_analysisSettingDefinitions();
		init_toolEffects();
		inspectAnalysisSettingsInputSchema = z.strictObject({
			settings: z.array(analysisSettingIdSchema).max(analysisSettingIds.length).optional(),
			operation: z.string().min(1).optional(),
			provider: z.string().min(1).optional()
		});
		updateAnalysisSettingsInputSchema = z.strictObject({
			changes: z.array(z.union([...analysisSettingIds.map((setting) => z.strictObject({
				setting: z.literal(setting),
				action: z.literal("set"),
				value: analysisSettingValueSchema(setting)
			})), z.strictObject({
				setting: analysisSettingIdSchema,
				action: z.literal("reset")
			})])).min(1).max(analysisSettingIds.length),
			expected_revision: z.number().int().nonnegative().optional()
		});
		descriptor = z.strictObject({
			setting: analysisSettingIdSchema,
			value: z.number().nullable().optional(),
			launch_value: z.number().nullable().optional(),
			default_value: z.number().nullable(),
			source: z.enum([
				"default",
				"setting",
				"runtime",
				"invalid"
			]),
			configuration_error: analysisErrorProjectionSchema.optional(),
			unit: z.enum([
				"bytes",
				"ms",
				"seconds",
				"MiB"
			]),
			minimum: z.number(),
			maximum: z.number(),
			applies_at: z.enum([
				"next_operation",
				"next_worker",
				"next_startup"
			]),
			provider: z.string(),
			operations: z.array(z.string()),
			environment: z.string().optional(),
			parameter: z.string().optional(),
			agent_editable: z.literal(true)
		});
		analysisSettingsResultSchema = z.strictObject({
			revision: z.number().int().nonnegative(),
			scope: z.literal("rea-runtime"),
			active_values: z.strictObject({ status: z.literal("not_observed") }),
			settings: z.array(descriptor),
			constraints: z.array(z.strictObject({
				control: z.string(),
				authority: z.enum([
					"operator",
					"external",
					"fixed"
				]),
				value: z.number().nullable(),
				unit: z.string(),
				observation: z.enum(["known", "unknown"]),
				recovery: z.string()
			})).optional()
		});
		updateAnalysisSettingsResultSchema = analysisSettingsResultSchema.extend({
			changed: z.boolean(),
			changes: z.array(z.strictObject({
				setting: analysisSettingIdSchema,
				old_value: z.number().nullable().optional(),
				new_value: z.number().nullable().optional()
			})),
			active_work_changed: z.literal(false),
			rea_restart_required: z.literal(false)
		});
		ANALYSIS_SETTINGS_TOOL_CONTRACTS = [{
			name: "inspect_analysis_settings",
			...toolContractMetadata("inspect_analysis_settings"),
			kind: "application",
			description: "Inspect REA's editable runtime admission sizes, deadlines and worker heaps, their bounds, launch values and application points. No active target is required. Filters intersect. If an error already names a setting and its bounds, update_analysis_settings can be called directly. Explicit per-call arguments override runtime defaults. Active worker values are not observed by this configuration view.",
			inputSchema: inspectAnalysisSettingsInputSchema,
			outputSchema: analysisSettingsResultSchema,
			examples: [{
				title: "Inspect archive header admission",
				input: { settings: ["asar.max_header_bytes"] }
			}]
		}, {
			name: "update_analysis_settings",
			...toolContractMetadata("update_analysis_settings"),
			kind: "application",
			description: "When REA names an adjustable limit, atomically set or reset its runtime default, then retry once work and cleanup have settled. No inspection call is required when the error supplies the bounds. Changes apply only to new work, survive target close/open, and disappear on REA restart. Reset restores launch configuration. Does not edit files, restart providers, raise host limits, or override explicit per-call arguments.",
			inputSchema: updateAnalysisSettingsInputSchema,
			outputSchema: updateAnalysisSettingsResultSchema,
			examples: [{
				title: "Raise ASAR header admission for a retry",
				input: { changes: [{
					setting: "asar.max_header_bytes",
					action: "set",
					value: 33554432
				}] }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/gpu/gpuToolContracts.js
var GPU_TOOL_CONTRACTS;
function init_gpuToolContracts() {
	return (init_gpuToolContracts = __esmMin((() => {
		init_gpuCodeObjects();
		init_analysisView();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		GPU_TOOL_CONTRACTS = [{
			name: "inspect_gpu_code_objects",
			...toolContractMetadata("inspect_gpu_code_objects"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect static CUDA/HIP GPU code objects in local ELF/PE hosts, CUDA fatbins, CUBIN, PTX and Clang HIP bundles (CUDA LZ4/Zstd and CCOB v1/v2/v3 zlib/Zstd). Default inventory reads directories; full-file SHA-256 always streams every byte. analysis kernels decodes only selected object_ids/targets (object_ids require expected_sha256 from their inventory), retaining all inventory rows and explicit partial/unknown states. Reports PTX virtual registers, CUBIN physical registers/nv.info parameters/shared memory and AMDGPU MessagePack kernel declarations separately. No GPU tools, target execution, network, SASS disassembly or host launch correlation. Unsupported CUDA compression retains encoded locations. Default summary retains complete Evidence; optional view returns a selected targets/objects/kernels page or PTX text page in this call. inspect_analysis_view kind gpu-code-objects reuses retained facts without reopening files; PTX text uses UTF-16 code-unit pages. Object IDs are positional within artifact.sha256. One active inspection; 128 MiB/object, 512 MiB decoded work, 16 MiB retained facts. Full Evidence includes selected PTX text artifacts with SHA-256 and encoded/decoded provenance.",
			inputSchema: inspectGpuCodeObjectsInputSchema,
			outputSchema: evidenceResultOf(z.union([
				gpuCodeObjectsSchema,
				gpuCodeObjectsSummaryViewResultSchema,
				gpuCodeObjectsPageViewResultSchema
			])),
			examples: [{
				title: "List embedded GPU targets before selecting payloads",
				input: {
					path: "/artifacts/application.so",
					analysis: "inventory",
					detail: "summary",
					view: { collection: "targets" }
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/captures/captureToolContracts.js
var CAPTURE_TOOL_CONTRACTS;
function init_captureToolContracts() {
	return (init_captureToolContracts = __esmMin((() => {
		init_packetFields();
		init_packetCapture();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		CAPTURE_TOOL_CONTRACTS = [{
			name: "inspect_packet_fields",
			...toolContractMetadata("inspect_packet_fields"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Discover protocols or field names/types registered in the installed TShark 4.x. kind defaults to protocols; use fields and optional exact protocol abbreviation to select field definitions. query searches name/abbreviation/description by case-insensitive literal substring using Unicode simple case folding. Return 50 matches by default with offset/limit paging; null requests all remaining within resource limits. Preserve type/base/bitmask/description, duplicate registrations, source line numbers, coverage, tool identity and diagnostics. Linux, TShark 4.x (PATH or absolute REA_TSHARK_COMMAND) and prlimit required. No capture file, interface or binary target needed. Registrations describe tool capabilities, not observed traffic. Each call rereads the glossary; use selected fields with inspect_packet_capture.",
			inputSchema: inspectPacketFieldsInputSchema,
			outputSchema: evidenceResultOf(packetFieldsCatalogSchema),
			examples: [{
				title: "Find USB protocol registrations",
				input: { query: "usb" }
			}, {
				title: "Find the installed USB vendor-ID field",
				input: {
					kind: "fields",
					protocol: "usb",
					query: "idVendor"
				}
			}]
		}, {
			name: "inspect_packet_capture",
			...toolContractMetadata("inspect_packet_capture"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect caller-selected fields in an existing local packet capture with TShark 4.x. Return 50 matching frames by default, with match_offset/match_limit paging and coverage counts; match_limit:null requests all remaining matches. Preserve repeated values, frame numbers, display filter, decode-as rules and pass mode in inline Evidence with source/tool identity and diagnostics. Optional packet_limit counts input packets before filtering; output paging does not shorten dissection or two-pass reassembly. Requires Linux, util-linux prlimit, and TShark 4.x on PATH or through absolute REA_TSHARK_COMMAND. File-only analysis; no live capture or device communication. Missing fields or no matches do not establish absence of device traffic.",
			inputSchema: inspectPacketCaptureInputSchema,
			outputSchema: evidenceResultOf(packetCaptureSchema),
			examples: [{
				title: "Inspect UDP exchanges in a recording",
				input: {
					path: "/artifacts/device.pcapng",
					fields: [
						"ip.addr",
						"udp.port",
						"data.data"
					],
					display_filter: "udp",
					decode_as: [],
					packet_limit: null,
					two_pass: true
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/signals/signalToolContracts.js
var SIGNAL_TOOL_CONTRACTS;
function init_signalToolContracts() {
	return (init_signalToolContracts = __esmMin((() => {
		init_signalDecoders();
		init_signalRecording();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		SIGNAL_TOOL_CONTRACTS = [{
			name: "inspect_signal_decoders",
			...toolContractMetadata("inspect_signal_decoders"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Discover installed sigrok protocol decoders or inspect one decoder's channel/option help on Linux. Omit decoder to list ID/name pairs; supply its exact ID for literal help lines with source line numbers. query is a case-insensitive literal substring using Unicode simple case folding; catalog queries match the ID or name independently. Page matches with offset/limit (default 50; null returns all remaining). Reports tool identity, version, diagnostics and examined/matching coverage. Uses configured REA_SIGROK_COMMAND and prlimit; no recording, binary target, hardware scan or acquisition. Each call probes again; decoder modules are trusted, not fully fingerprinted. Use returned IDs/options with decode_signal_recording.",
			inputSchema: inspectSignalDecodersInputSchema,
			outputSchema: evidenceResultOf(signalDecodersSchema),
			examples: [{
				title: "Find installed UART decoders",
				input: { query: "uart" }
			}, {
				title: "Read the installed UART baud-rate option",
				input: {
					decoder: "uart",
					query: "baud"
				}
			}]
		}, {
			name: "decode_signal_recording",
			...toolContractMetadata("decode_signal_recording"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Decode an existing local logic/signal recording on Linux with sigrok-cli 0.7.2 and util-linux prlimit. Supply decoder stack, channels and options explicitly; optionally select input format and annotation classes. Return 50 literal output lines by default, with line_offset/line_limit paging; line_limit:null requests all remaining lines. Output windows count display lines, not annotations or samples, and do not shorten decoding. Preserve selected text, sample ranges, stderr, source/tool identity and coverage inline. Configure absolute REA_SIGROK_COMMAND. File-only analysis; no hardware acquisition or device communication. Empty output does not prove absence of traffic.",
			inputSchema: decodeSignalRecordingInputSchema,
			outputSchema: evidenceResultOf(signalRecordingSchema),
			examples: [{
				title: "Decode recorded UART RX bytes",
				input: {
					path: "/artifacts/uart.vcd",
					input_format: "vcd",
					decoders: "uart:rx=RX:baudrate=9600",
					annotations: "uart=rx-data"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/desktopApplicationToolContracts.js
var DESKTOP_APPLICATION_TOOL_CONTRACTS;
function init_desktopApplicationToolContracts() {
	return (init_desktopApplicationToolContracts = __esmMin((() => {
		init_desktopApplication();
		init_analysisView();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		DESKTOP_APPLICATION_TOOL_CONTRACTS = [{
			name: "inspect_desktop_application",
			...toolContractMetadata("inspect_desktop_application"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect a local desktop application directory using bounded listings, file headers and selected metadata. Returns .NET, Unity Mono/IL2CPP, Unreal, Godot, GameMaker and Electron candidates, supporting paths/range hashes, component path markers and concrete next probes. No target execution, extraction, network or target changes. Default summary retains complete Evidence for inspect_analysis_view kind desktop-application; collections files/candidates/components/next_probes support paging and field selection, with exact file paths or candidate families. detail complete returns every retained fact inline. Snapshot identity covers examined metadata/read ranges, not all file contents; coverage and unavailable probes remain explicit.",
			inputSchema: inspectDesktopApplicationInputSchema.extend({ detail: z.enum(["summary", "complete"]).default("summary") }),
			outputSchema: evidenceResultOf(z.union([desktopApplicationSchema, desktopApplicationSummaryViewResultSchema])),
			examples: [{
				title: "Identify a desktop installation",
				input: { path: "/artifacts/application" }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/go/goToolContracts.js
var GO_TOOL_CONTRACTS;
function init_goToolContracts() {
	return (init_goToolContracts = __esmMin((() => {
		init_goBinary();
		init_toolEffects();
		init_analysisDetail();
		init_analysisView();
		GO_TOOL_CONTRACTS = [{
			name: "inspect_go_binary",
			...toolContractMetadata("inspect_go_binary"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect embedded Go compiler version, main module, dependency/replacement versions and build settings in an explicit local ELF, PE or thin Mach-O image, or the slice of a universal Mach-O named by architecture (read without lipo; artifact stays the universal file, selected_slice records the slice and source ranges stay file offsets). Default detail complete returns original artifact SHA-256, exact build-info source ranges, raw framed module bytes and unparsed module-text lines inline as observed Evidence. Explicit detail summary retains the same complete parent and returns compiler/main-module identity, counts, source ranges and parent_evidence_id. Query retained rows through inspect_analysis_view kind go, collection dependencies or settings; select exact dependency paths or setting keys, indices, fields and pagination. Rows always retain their original index scoped to the parent Evidence; empty filters select none. Runtime dependency completeness remains unknown. Supports inline and historical pointer encodings without installing Go, opening a disassembler, executing the target, writing temporary files or accessing the network. Missing metadata is reported as unknown, not proof that an image is not Go. Does not recover functions, source mappings, types or runtime behavior. Resource guards bound files to 256 MiB and charge each distinct build-info search span in full against a cumulative 256 MiB header-search budget, with partial overlaps charged separately; they also bound aggregate embedded strings to 1 MiB, structural table decoding to 16 MiB and complete inline metadata to 8 MiB; malformed, unsupported and oversized inputs receive typed failures rather than partial success.",
			inputSchema: inspectGoBinaryInputSchema,
			outputSchema: analysisDetailOutputSchemaOf(goBinarySchema, goBinarySummaryViewResultSchema),
			examples: [{
				title: "Inspect embedded build provenance",
				input: { path: "/artifacts/application" }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/model/modelToolContracts.js
var MODEL_TOOL_CONTRACTS;
function init_modelToolContracts() {
	return (init_modelToolContracts = __esmMin((() => {
		init_modelArtifactQuery();
		init_modelArtifact();
		init_analysisView();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		MODEL_TOOL_CONTRACTS = [{
			name: "inspect_model_artifact",
			...toolContractMetadata("inspect_model_artifact"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect local GGUF v2/v3 or safetensors declarations by content, without loading models or executing code. Default hash header reads only the header: full-file SHA-256 and Evidence subject are unknown; artifact.header_sha256 is a scoped prefix commitment, not weight identity. hash full additionally streams all file bytes for SHA-256. Optional view returns a selected metadata/tensor/type page plus model context in this call. Summary retains complete Evidence for inspect_analysis_view kind model-artifact, collection metadata (keys/indices/fields) or tensors (names/types/indices/fields), with stable header-scoped indices and paging. Metadata arrays retain eight-element typed previews; scalar metadata is complete. Tensor counts, shapes, numeric type IDs and offsets are observed; textual types and parameter/storage totals use established format facts. Unknown or historically ambiguous GGUF types retain IDs with unknown nonempty byte lengths; ambiguous identities use AMBIGUOUS_<id> labels. Unresolved Q8_1 and K-block layouts also keep nonempty byte lengths unknown. Tensor payload, model behavior and inference quality are not inspected. One active inspection, 100 MB header ceiling and 32 MiB retained-facts budget; resource refusals are explicit. No network, external files, Python, model runtime, extraction or deserialization of pickle.",
			inputSchema: inspectModelArtifactInputSchema,
			outputSchema: evidenceResultOf(z.union([
				modelArtifactSchema,
				modelArtifactSummaryViewResultSchema,
				modelArtifactPageViewResultSchema
			])),
			examples: [{
				title: "Read model declarations without reading weights",
				input: {
					path: "/artifacts/model.gguf",
					hash: "header",
					detail: "summary"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/il2cpp/il2cppToolContracts.js
var IL2CPP_TOOL_CONTRACTS;
function init_il2cppToolContracts() {
	return (init_il2cppToolContracts = __esmMin((() => {
		init_analysisView();
		init_il2cppMetadata();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		IL2CPP_TOOL_CONTRACTS = [{
			name: "inspect_il2cpp_metadata",
			...toolContractMetadata("inspect_il2cpp_metadata"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect local Unity IL2CPP metadata (24/27/29/31/39), optionally linking a caller-selected 64-bit little-endian Mach-O, PE or ELF binary. Static reading only. Default summary retains complete Evidence; use parent_evidence_id with inspect_analysis_view kind il2cpp-metadata for named collections, indices, fields and paging. Parameters accept method_indices; method_addresses accept addresses and states. Stable row indices are scoped to the metadata digest; native pages also identify the binary. Native states distinguish executable code, observed zero slots (no-body), and unknown owners/relocations. Shared addresses preserve all methods. code_gen_modules pages accept image_indices; summaries omit that table. Type names are C#-like; version27 retains indices with unknown names. generic_instances adds genericMethodTable rows with Il2CppDumper-style names (versions 27/29/31, static CodeRegistration and MetadataRegistration); generic_method_instances pages accept method_indices, addresses and states; summaries count issues, paged as generic_method_issues. Unrequested native counts are null. Static-table links are derived; the x86-64/arm64 executable-byte fallback is inferred and does not verify instruction boundaries. Input guards:256MiB metadata/1GiB binary;64MiB encoded report; one active inspection. Unsupported layouts, pointer encodings and resource limits have typed reasons. Full Evidence remains available with detail complete. Neither static linking nor structural agreement proves runtime behavior or a same-build pair.",
			inputSchema: inspectIl2cppMetadataInputSchema,
			outputSchema: evidenceResultOf(z.union([il2cppMetadataSchema, il2cppMetadataSummaryViewResultSchema])),
			examples: [{
				title: "Summarize metadata and retain rows for paging",
				input: {
					path: "/artifacts/Data/Managed/Metadata/global-metadata.dat",
					detail: "summary"
				}
			}, {
				title: "Link method addresses from a universal macOS binary",
				input: {
					path: "/artifacts/Game.app/Contents/Resources/Data/il2cpp_data/Metadata/global-metadata.dat",
					binary_path: "/artifacts/Game.app/Contents/Frameworks/GameAssembly.dylib",
					binary_architecture: "arm64"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/rust/rustToolContracts.js
var RUST_TOOL_CONTRACTS;
function init_rustToolContracts() {
	return (init_rustToolContracts = __esmMin((() => {
		init_rustBinary();
		init_rustBinaryQuery();
		init_analysisView();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		RUST_TOOL_CONTRACTS = [{
			name: "inspect_rust_binary",
			...toolContractMetadata("inspect_rust_binary"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect the cargo-auditable crate dependency list embedded in an explicit local ELF, PE or thin Mach-O image, or the slice of a universal Mach-O named by architecture (read without lipo; artifact stays the universal file, selected_slice records the slice and offsets stay file offsets). Returns the artifact SHA-256, the .dep-v0 section file offset and size, compressed and uncompressed sizes, format version, packages in their original order, the root package index, and dependency edges by index. Omitted or explicit complete detail preserves the full report. Optional detail summary retains that complete Evidence and returns source ranges, counts and parent_evidence_id. Optional view directly selects packages or edges in this call; it cannot be combined with explicit complete detail. Query the same retained facts with inspect_analysis_view kind rust: exact names/versions or package indices, edge from_indices/to_indices, fields and matching-row pagination. Row indices are original and scoped to the parent Evidence; empty filters select none. Default package fields omit dependency vectors; explicitly select dependencies for direct index references. Every matching observed version is retained. No current runtime state is inferred from historical reads. Reads zlib-compressed JSON without installing Rust, opening a disassembler, executing the target, writing temporary files or accessing the network. A missing section is null metadata with a limitation and is not proof that the binary has no dependencies. A rustc commit hash is reported only as an inference when a /rustc/<40-hex>/ path is present in read-only data. Resource guards bound files to 256 MiB, compressed dependency streams to 1 MiB, inflated JSON to the smaller of 8 MiB and 64 times the consumed compressed-stream length, and the complete report to 8 MiB. Malformed, unsupported and oversized inputs receive typed failures rather than partial success.",
			inputSchema: inspectRustBinaryRequestSchema,
			outputSchema: evidenceResultOf(z.union([
				rustBinarySchema,
				rustBinarySummaryViewResultSchema,
				rustBinaryPageViewResultSchema
			])),
			examples: [{
				title: "Inspect an embedded Rust dependency list",
				input: { path: "/artifacts/application" }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/python/pythonPycToolContracts.js
var inspectPythonPycRequestSchema, PYTHON_PYC_TOOL_CONTRACTS;
function init_pythonPycToolContracts() {
	return (init_pythonPycToolContracts = __esmMin((() => {
		init_pythonPyc();
		init_toolEffects();
		init_analysisDetail();
		init_analysisView();
		init_pythonPycView();
		inspectPythonPycRequestSchema = z.discriminatedUnion("detail", [inspectPythonPycInputSchema.extend(pythonPycCompleteDeliveryShape), inspectPythonPycInputSchema.extend(pythonPycSummaryDeliveryShape)]).meta({ "x-rea-root-discriminator": "detail" });
		PYTHON_PYC_TOOL_CONTRACTS = [{
			name: "inspect_python_pyc",
			...toolContractMetadata("inspect_python_pyc"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect one explicit local CPython 3.7–3.13 .pyc file with a supported 16-byte header without executing bytecode, invoking CPython or recovering source. Returns the header (magic, pinned python_version, PEP 552 flags, source hash or mtime/size), the top-level code object with nested functions, names, const summaries, and bytecode length/SHA-256. Complete output is the default. detail summary retains the complete Evidence and returns header/coverage. Include an optional python-pyc code_objects view to return selected names/indices/fields in the first call; inspect_analysis_view pages the same retained source later. Every matching display name survives under its parent-scoped source_index; nested_code represents code-constant references, not runtime calls. Marshal is walked with object, depth and string budgets; unsupported magics/layouts, truncated streams and exhausted budgets return no partial success. A decoded header is not proof the matching .py is present. Portable on supported Node hosts; no Python installation required.",
			inputSchema: inspectPythonPycRequestSchema,
			outputSchema: analysisDetailOutputSchemaOf(pythonPycSchema, z.union([pythonPycSummaryViewResultSchema, pythonPycCodeObjectsViewResultSchema])),
			examples: [
				{
					title: "Return selected function facts immediately and retain the complete report",
					input: {
						path: "/artifacts/module.pyc",
						detail: "summary",
						view: {
							kind: "python-pyc",
							collection: "code_objects",
							names: ["parse_args"],
							fields: [
								"name",
								"qualname",
								"bytecode",
								"nested_code"
							]
						}
					}
				},
				{
					title: "Inspect a CPython 3.12 pyc header and nested code objects",
					input: { path: "/artifacts/module.pyc" }
				},
				{
					title: "Retain the complete pyc report and return only its header and coverage",
					input: {
						path: "/artifacts/module.pyc",
						detail: "summary"
					}
				}
			]
		}];
	})))();
}

//#endregion
//#region dist/contracts/erlang/beamToolContracts.js
var inspectErlangBeamRequestSchema, ERLANG_BEAM_TOOL_CONTRACTS;
function init_beamToolContracts() {
	return (init_beamToolContracts = __esmMin((() => {
		init_beam();
		init_toolEffects();
		init_analysisDetail();
		init_analysisView();
		init_erlangBeamView();
		inspectErlangBeamRequestSchema = z.discriminatedUnion("detail", [inspectErlangBeamInputSchema.extend(erlangBeamCompleteDeliveryShape), inspectErlangBeamInputSchema.extend(erlangBeamSummaryDeliveryShape)]).meta({ "x-rea-root-discriminator": "detail" });
		ERLANG_BEAM_TOOL_CONTRACTS = [{
			name: "inspect_erlang_beam",
			...toolContractMetadata("inspect_erlang_beam"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect one explicit local Erlang BEAM IFF container without executing bytecode or installing Erlang. Returns form/chunk byte ranges and payload SHA-256, atoms, export/import/lambda tables with resolved atom names, and the Code header. Complete output is the default. detail summary retains complete Evidence and returns module/header/counts; include a beam view for selected atoms/exports/imports/lambdas/chunks in the first call, then page retained or offline facts with inspect_analysis_view. Exact names/indices/fields select facts; import modules intersects function names. Same-name arities survive under parent-and-collection-scoped source_index; atom and lambda indexes retain their original meaning. Missing tables stay null in counts; unresolved names stay null and runtime absence remains unknown. Reads a stable regular file; malformed/truncated input and exhausted parser budgets return no partial success. Portable on supported Node hosts; no BEAM emulator required.",
			inputSchema: inspectErlangBeamRequestSchema,
			outputSchema: analysisDetailOutputSchemaOf(erlangBeamSchema, z.union([erlangBeamSummaryViewResultSchema, erlangBeamTableViewResultSchema])),
			examples: [{
				title: "Return selected exports and retain the complete BEAM report",
				input: {
					path: "/artifacts/app.beam",
					detail: "summary",
					view: {
						kind: "beam",
						collection: "exports",
						names: ["module_info"],
						fields: [
							"function_index",
							"function",
							"arity",
							"label"
						]
					}
				}
			}, {
				title: "Inspect the complete BEAM structure",
				input: { path: "/artifacts/app.beam" }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/sqlite/sqliteToolContracts.js
var SQLITE_TOOL_CONTRACTS;
function init_sqliteToolContracts() {
	return (init_sqliteToolContracts = __esmMin((() => {
		init_sqliteDatabase();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		SQLITE_TOOL_CONTRACTS = [{
			name: "inspect_sqlite_database",
			...toolContractMetadata("inspect_sqlite_database"),
			kind: "artifact-provider",
			requiresActiveTarget: true,
			description: "Inspect an explicit local SQLite database snapshot and its existing sibling WAL without modifying source files or opening a native analysis provider. Requires Node.js 24.x >=24.15 or 26+ with native DatabaseSync.limits support, checked by the worker. Returns observed Evidence with database/WAL SHA-256 and a compact schema inventory. Selecting an exact ordinary table expands only its schema and samples rows (default 20, subject to byte and worker resource limits). Select exact columns in the requested order to avoid unrelated or large values; schema_scope=database explicitly expands the whole schema; returned rows retain 64-bit integers, text bytes and blobs with explicit truncation. Adjust worker_timeout_ms (default 30000 ms) for worker startup, queries and reply writing; allow separate client headroom for snapshot acquisition, reply reads, cleanup and delivery. The result retains the actual budget; byte/heap safety limits stay fixed. No arbitrary SQL, view or virtual-table execution, extension loading, database repair, encryption support or live-snapshot atomicity claim. At most two inspections per provider are admitted; occupied capacity is retryable. An isolated temporary copy and owned worker enforce input, value/record, SQL-statement, JSON-reply, JavaScript-heap and deadline limits; overall native heap is not capped. Supply a quiescent snapshot for coherent database/WAL evidence.",
			inputSchema: inspectSqliteDatabaseInputSchema,
			outputSchema: evidenceResultOf(sqliteDatabaseSchema),
			examples: [
				{
					title: "Inspect a compact inventory of a local SQLite snapshot",
					input: { path: "/artifacts/application.sqlite" }
				},
				{
					title: "Read selected rows from an ordinary table",
					input: {
						path: "/artifacts/application.sqlite",
						table: "settings",
						columns: ["key", "value"],
						row_limit: 20
					}
				},
				{
					title: "Expand the complete stored schema",
					input: {
						path: "/artifacts/application.sqlite",
						schema_scope: "database"
					}
				}
			]
		}];
	})))();
}

//#endregion
//#region dist/contracts/analysisViewApiSurfaceExample.js
var API_SURFACE_EXAMPLE;
function init_analysisViewApiSurfaceExample() {
	return (init_analysisViewApiSurfaceExample = __esmMin((() => {
		API_SURFACE_EXAMPLE = {
			input: {
				source: {
					kind: "retained-evidence",
					evidence_id: "ev_1cfc841a51d771fb713db42cab9979d799226b4b88efab7d9616ca4ef9316ad6"
				},
				view: {
					kind: "api-surface",
					offset: 0,
					limit: 50
				}
			},
			output: {
				parent_evidence_id: "ev_1cfc841a51d771fb713db42cab9979d799226b4b88efab7d9616ca4ef9316ad6",
				parent_operation: "inspect_web_network_capture",
				parent_digest: "1cfc841a51d771fb713db42cab9979d799226b4b88efab7d9616ca4ef9316ad6",
				view_digest: "fea1ecf2d7c23f1a25f4f2e1ba6b538a8d6e9c6a8748dad3a756a44bad64e3c2",
				artifact: {
					path: "/fixtures/api-surface.har",
					sha256: "bf58e2c06e55bfe7e0628157c4ad027ce0aeb81a10e8edef8a7f95b8e5f14225"
				},
				coverage: {
					status: "page",
					examined: 1,
					total: 1,
					next_offset: null,
					exhausted: true
				},
				limitations: ["Grouping does not establish handler identity, URL-space schemas or causality.", "HAR text without an encoding declaration is producer-decoded Unicode. Unsupported declared body encodings remain opaque; original body bytes remain unknown unless content explicitly uses valid base64. Declared sizes are preserved independently of retained bytes. mitmproxy 12.2.3 SaveHar may report null optional postData.text; that null is retained and omitted only from the upstream validation copy."],
				unknowns: [],
				records: {
					examined: 2,
					total: 2,
					excluded: 0
				},
				templated_groups: 1,
				groups: [{
					method: "GET",
					origin: "https://api.example.test",
					path_template: "/users/{numeric}",
					templated_segments: [{
						segment_index: 1,
						rule: "numeric",
						basis: "inferred",
						observed_values: ["8812", "9031"]
					}],
					record_ordinals: [0, 1],
					statuses: [200, 404],
					content_types: ["application/json", "text/plain"],
					flags: ["mixed-statuses", "mixed-content-types"]
				}],
				excluded_records: [],
				kind: "api-surface",
				view: {
					kind: "api-surface",
					offset: 0,
					limit: 50
				}
			}
		};
	})))();
}

//#endregion
//#region dist/contracts/analysisViewEnvironmentManifestExample.js
var ENVIRONMENT_MANIFEST_EXAMPLE;
function init_analysisViewEnvironmentManifestExample() {
	return (init_analysisViewEnvironmentManifestExample = __esmMin((() => {
		ENVIRONMENT_MANIFEST_EXAMPLE = {
			input: {
				source: {
					kind: "retained-evidence",
					evidence_id: "ev_3f40227d7f1cad9a068f750f06191eac1a348f4eb04b57afba758b12800adffb"
				},
				view: {
					kind: "environment-manifest",
					template_rules: ["after-uid-literal"]
				}
			},
			output: {
				parent_evidence_id: "ev_3f40227d7f1cad9a068f750f06191eac1a348f4eb04b57afba758b12800adffb",
				parent_operation: "inspect_web_network_capture",
				parent_digest: "3f40227d7f1cad9a068f750f06191eac1a348f4eb04b57afba758b12800adffb",
				view_digest: "1796278f74478e3f932ddb79f6871dee5c6ef8b58ceee1653c471e69b7e971b3",
				artifact: {
					path: "/fixtures/environment-manifest.har",
					sha256: "5bee3e93d69fa5f8650737417615da7fda09f1d8f3e39c1fae8ee69fbcb03420"
				},
				coverage: {
					status: "complete-within-view",
					examined: 2,
					total: 2,
					next_offset: null,
					exhausted: true
				},
				limitations: [
					"Body shapes list top-level JSON key types from one recorded request each; they do not establish required fields or a complete schema.",
					"HAR text without an encoding declaration is producer-decoded Unicode. Unsupported declared body encodings remain opaque; original body bytes remain unknown unless content explicitly uses valid base64. Declared sizes are preserved independently of retained bytes. mitmproxy 12.2.3 SaveHar may report null optional postData.text; that null is retained and omitted only from the upstream validation copy.",
					"Observed query parameter names do not establish required parameters, value types or a complete API schema.",
					"Opt-in template rules after-uid-literal merge recorded literals by shape; merged parameters may conflate distinct resources.",
					"Tool templates, parameters and names are inferences from recorded request lines; they do not establish handler identity, URL-space schemas or causality."
				],
				unknowns: [
					{
						kind: "authorization-model",
						statement: "Authorization headers and cookies are structurally excluded from captures; the manifest states no authorization model."
					},
					{
						kind: "response-semantics",
						statement: "Recorded statuses and bodies are retained only as pointers to parent records; the manifest states no response semantics."
					},
					{
						kind: "state-transition",
						statement: "Recorded exchanges are independent observations; the manifest states no ordering, side effects or state transitions between tools."
					}
				],
				origin: "http://grafana.example",
				name: "grafana-example",
				tools: [{
					name: "get_dashboards_by_uid",
					method: "GET",
					path_template: "/api/dashboards/uid/{uid}",
					api_surface_template: "/api/dashboards/uid/acb4v6",
					params: [{
						index: 3,
						name: "uid",
						rule: "after-uid-literal",
						basis: "inferred",
						observed_values: ["acb4v6"]
					}],
					query_parameter_names: [],
					body_shape: null,
					statuses: [200],
					content_types: ["application/json"],
					record_ordinals: [0]
				}, {
					name: "post_folders",
					method: "POST",
					path_template: "/api/folders",
					api_surface_template: "/api/folders",
					params: [],
					query_parameter_names: [],
					body_shape: {
						type: "object",
						properties: { title: "string" }
					},
					statuses: [200],
					content_types: ["application/json"],
					record_ordinals: [1]
				}],
				records: [{
					ordinal: 0,
					method: "GET",
					path: "/api/dashboards/uid/acb4v6",
					status: 200,
					content_type: "application/json"
				}, {
					ordinal: 1,
					method: "POST",
					path: "/api/folders",
					status: 200,
					content_type: "application/json"
				}],
				excluded: [{
					method: "GET",
					origin: "http://grafana.example",
					path_template: "/avatar/{hex}",
					reason: "ui-page-or-asset"
				}],
				templated_groups: 2,
				kind: "environment-manifest",
				view: {
					kind: "environment-manifest",
					template_rules: ["after-uid-literal"],
					include_query_parameter_names: true
				}
			}
		};
	})))();
}

//#endregion
//#region dist/contracts/analysisViewToolContracts.js
var RETAINED_EXAMPLE_ID, ANALYSIS_VIEW_TOOL_CONTRACTS;
function init_analysisViewToolContracts() {
	return (init_analysisViewToolContracts = __esmMin((() => {
		init_analysisViewApiSurfaceExample();
		init_analysisViewEnvironmentManifestExample();
		init_analysisView();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		RETAINED_EXAMPLE_ID = `ev_${"a".repeat(64)}`;
		ANALYSIS_VIEW_TOOL_CONTRACTS = [{
			name: "inspect_analysis_view",
			...toolContractMetadata("inspect_analysis_view"),
			kind: "application",
			description: "Use javascript-routes collections to query route patterns, source-linked occurrences, source status, unknowns or summary counts from retained JavaScript application or web-bundle Evidence. Inspect selected views of supported completed Evidence without repeating analysis. Choose a view compatible with the parent operation described below. Command summary views preserve ordered GDB records or opaque objdump stdout/stderr once, source parameters, completion facts and parent identity. They do not establish current target state. Historical capture summaries return identity and counts without bodies or archive inventories. Capture views page retained records: view {kind: \"capture\", detail: \"preview\" | \"complete\", offset: 0, limit: 20}; preview selects recorded headline fields and binary descriptors, complete returns exact records with all sidecars. Offsets follow the selected parent record order, preserving original producer ordinals. Paging never reopens the source or reruns the decoder. Native export tables use kind native-exports, collection exports/issues, exact names or original indices, selected fields and matching-row pagination; parent Evidence plus source_index identifies each row. Source coverage stays separate from page coverage. BEAM views use kind beam, collections atoms/exports/imports/lambdas/chunks, exact names/indices/fields and matching-row pages; import modules intersects function names. source_index identifies original parent-and-collection rows, preserving every arity and raw atom index. beam.counts preserves null missing tables versus decoded empty tables; runtime absence remains unknown. PYC views use kind python-pyc, collection code_objects, names/indices/fields and paging; source_index scopes every same-name alternative to the parent, nested_code keeps code-constant references, and pyc.coverage preserves source coverage. Go metadata uses kind go, collection dependencies/settings, exact paths/keys or indices, fields and pagination. Row index refers to the original collection; empty selections return no rows, and dependency coverage remains unknown. Rust metadata uses kind rust, collection packages/edges, exact names/versions or original indices, selected fields, edge from_indices/to_indices and matching-row pagination. Embedded-record coverage is separate from unknown runtime dependencies. For inspect_pcap_capture parents, kind pcap pages endpoints, dns-queries, tls-sni, protocols, http-uris or unattributed-addresses. Select an exact query for dns-addresses, or a tshark/capinfos stream for UTF-16 diagnostics text. Page totals count retained facts; source coverage remains explicit. Qlog summaries keep profile/scope and counts; kind qlog pages traces, streams, loss-declarations, incomplete-records, contributions, ranges or final-sizes. Except traces, select trace_index; stream-specific facets also require exact stream_id and direction. Facts retain all-recorded-events-before-selection scope, and interval overlap or endpoint loss declarations do not prove retransmission or network loss. The api-surface view groups retained HAR requests by method, origin and format-rule path template; templated segments are inferences. It reads no headers or bodies and reports no query values. The environment-manifest view projects the same HAR requests on the primary origin (most JSON-like records) into a replayable tool surface: view {kind: \"environment-manifest\", template_rules: [\"after-uid-literal\", \"opaque-token\", \"sibling-variance\"], include_query_parameter_names: true}. Each tool has a deterministic name, a path template and parameters from the four format rules plus the selected opt-in rules, observed query parameter names, a value-free body shape for POST/PUT/PATCH, status and content-type sets and record ordinals; records are pointers into the parent, excluded groups carry a reason and three fixed unknowns are always stated. Templates, parameters and names are inferences; the view copies no header, cookie or body values and refuses parents inspected with sensitive values. A capture_browser_scenario parent that selected response bodies or header values projects the same way, one record per network transaction in request order; it relies on capture-time redaction of declared secrets instead of that refusal, and a transaction whose URL was redacted is left unrepresented. The environment-state view extracts, from the same parents, the initial state the recorded reads observed: view {kind: \"environment-state\", template_rules: [...]} with the rules of the manifest it accompanies. It reads response bodies recorded before the first related write and reports entity types with an identity field (proved by a path parameter or inferred from a field name), entities in collection order with per-view values where views differ, documents for non-parameterized reads that are not entities and have one initial request line (item-shaped paths stay recorded), and a render plan per read tool: item and list views reproduce their latest recordings from the state (a list also learns the filters, search, sort and paging its recordings verify, and answers new values of them from the state), and every other read tool is a recorded view with a reason. It also reports a write plan per state-changing tool (create, update, delete or document, built from its first successful call) and write_clock; a plan is served only when replaying the capture shows a later read confirming its effect and none contradicting it. Types and identity are inferences; values are recorded data, so it refuses parents inspected with sensitive values, and a scenario parent must have selected response bodies; its values keep the capture redaction markers, and a write whose URL it redacted ends the state of every type. The environment-coverage view, view {kind: \"environment-coverage\", template_rules: [...]}, summarizes that state without its entities: reads.state and reads.recorded count read tools answered from the state and replayed (recorded_reasons per view reason), writes.served lists the served write tools, and writes.withheld lists each other write tool with its reason, plan record, contradicting read and a hint about what to record next; it refuses what the environment-state view refuses. For a retained record use source: {kind: \"retained-evidence\", evidence_id: \"<parent_evidence_id>\"}. Use normalized_result.parent_evidence_id from a summary receipt. Source kind is required. Portable source uses {kind: \"inline\", evidence: <complete Evidence>}. A completed Evidence JSON file on this host uses {kind: \"evidence-file\", path: \"<absolute path>\"}: REA reads and authenticates it, then projects it like retained Evidence, so a large capture is bounded by the file reader rather than by inline-input accounting. The file may also be an Evidence bundle written by CLI --evidence_output or export_evidence_bundle; select evidence_id when it contains more than one record. For layout, JavaScript, inventory, WASM, Mach-O, Interface Builder, EVM, managed artifact, Android package and Dart AOT sources, request a summary with view: {kind: \"summary\"}; summary is a view kind and has no facet. The WASM summary gives validation, counts, WAT digest/length, tool profile and execution/network states without reading WAT text. Select a layout mitigations/linkage facet, one section/symbol/module, or a stable page. Module pages include assets, bundled and source modules; use node_id for ambiguous or unavailable paths. Typed module references use view {kind: \"javascript\", collection: \"modules\", projection: \"references\", where: {path: \"main.js\", kind: \"javascript-module\"}, offset: 0, limit: 64}; where matches exact retained strings (null selects unavailable paths). Rows include canonical identity, retained source-range count and observation support states. Source coverage and selection remain explicit; exhausting matching rows does not prove runtime loading or complete analysis. For exact file/native facts and processing gaps, use view {kind: \"javascript-facts\", where: {paths: [\"package.json\"]}, property_keys: [\"name\", \"operation\", \"analysis_status\"]}. Rows page original observations with canonical identities and Evidence; missing properties remain omitted. Paths match recorded artifact-path/source-range locations; optional kinds filter nodes. To discover field names without values, opt into include_available_property_keys: true with property_keys: []. Canonical identity and Evidence are separate from properties; keep each node_id/observation_id pair together when composing results. Inventory uses view: {kind: \"inventory\", collection: \"occurrences\", logical_paths: [\"package.json\"], offset: 0, limit: 64}. Inventory views page nodes, occurrences, edges or integrity contradictions. Occurrences accept exact logical_paths and occurrence_ids; nodes accept artifact_ids. Batch filters intersect (omitted means all available, [] means none); fields selects columns while retaining identity links. source_complete describes retained graph membership; source_coverage describes producer coverage, including unknown encrypted PCK directories. Page exhaustion does not prove absence in a partial source. WASM views use kind wasm and facet sections/imports/exports/candidates/glue/wat/headers/details/tool_profile; text facets use UTF-16 code units and source forms remain exact. Mach-O views use kind macho and facet entrypoints/architectures/build_metadata/load_commands/dependencies/imports/exports/segments/provenance; source_exhaustive false means unreturned rows may exist. Interface Builder views use kind interface-builder and collection documents/nodes/edges/coverage; nodes and edges accept an exact document relative_path. EVM summary returns all inferred interface candidates, carrier/decoded identities and explicit unknowns without hex or duplicate stdout. EVM views use kind evm and facet functions/bytecode_hex/stdout/stderr; function pages preserve the original candidate rows, and text offsets/limits count UTF-16 code units (hex has two characters per decoded byte). Exhausting candidate pages does not establish global interface completeness. Managed artifact summaries preserve complete identity/classification, metadata status, module/MVID, frameworks, coverage and limitations without unrelated inventories. Managed pages use kind managed and collection references/resources/attributes, retaining source coverage and build-local token scope; page exhaustion does not establish complete metadata. Managed member summaries keep identity, selection with unmatched names, coverage and per-collection counts; managed-members pages use collection types/exported_types/fields/methods/member_refs/call_edges/field_accesses/user_strings and carry the source selection and coverage. Android package summaries retain all declarations, engine identity and counts without decoded manifest text. Android manifest pages use kind android, facet manifest, offset and limit in UTF-16 code units; source_status preserves partial decoded coverage even when the retained text page is exhausted. Dart AOT summary preserves target/ABI/library identity, snapshot headers and pool lower bounds. String pages use kind dart-aot, collection package_uris/dart_uris/class_like_tokens; source coverage remains partial when the producer says partial. Protobuf views use kind protobuf, collection bodies/frames/fields, with record_ordinals, body_pointers and fields; field pages also select frame_indices, field_ids, field_numbers or schema_names. Byte identity, offset basis and body status remain present. Text and schema_value are opt-in page columns. APK signing views use kind apk-signature and collection signers/digests/lineage, with ids, signer_ids, schemes, fields and paging. Identity links remain when fields is empty. Declared identities and digest matches do not establish signature verification or authenticity. Model views use kind model-artifact and collection metadata (keys), tensors (names/types) or types (derived totals), with indices, fields and paging. Header SHA-256 scopes declarations; full-file identity remains unknown unless full hashing was selected. Arrays retain typed eight-element previews with explicit omissions. IL2CPP metadata views use kind il2cpp-metadata and collection sections/images/types/methods/fields/properties/events/parameters/string_literals/code_gen_modules/method_addresses/return_types/field_types/parameter_types/generic_method_instances/generic_method_issues. Select indices, fields and pages; sections/images/types/methods/fields/properties/events/parameters/return_types/field_types/parameter_types/generic_method_instances accept exact names (native type names match retained rendered values, preserving same-name rows; null names never match), types also accept image_indices/namespaces/declaring_types, and methods/members accept declaring_types. Parameters and parameter_types accept method_indices; code_gen_modules accept image_indices; method_addresses and generic_method_instances accept addresses/states (generic_method_instances also method_indices), preserving every folded alternative; generic_method_issues accept rows. Row index is scoped to the metadata digest; native pages add binary_source. Uncollected native tables have null counts and remain unavailable. Desktop directory views use kind desktop-application and collection files/omissions/candidates/components/next_probes, with fields and pagination; files and omissions accept exact paths or their stable IDs, and candidates accept families. Source coverage and stable row IDs remain available. Native inventory Evidence from list_names, list/search_procedures or list/search_strings uses view: {kind: \"native-inventory\", offset: 0, limit: 64, fields: [\"value\"]}. Rows keep source_index and address even with selected fields. Summary counts describe retained rows; provider discovery coverage remains unknown. Native function Evidence accepts kind summary for identity, availability and facet counts, or kind native for selected facts: view: {kind: \"native\", facet: \"procedure\"}. Facets select procedure, pseudocode, assembly, basic blocks, comments, callers/callees, references, unresolved calls, referenced strings/names, native API and high-pcode. Use nonnegative offset and a positive caller-selected limit (defaults 0 and 64); pseudocode uses UTF-16 code units, other native pages use rows. Returns artifact identity, parent Evidence ID, a distinct view digest, coverage, limitations and unknowns. Actual serialized size determines MCP transport admission; choose a smaller page or export the complete retained Evidence if needed.",
			inputSchema: inspectAnalysisViewInputSchema,
			outputSchema: evidenceResultOf(analysisViewResultSchema),
			examples: [
				{
					title: "Page selected native inventory fields without repeating the complete list",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "native-inventory",
							offset: 0,
							limit: 32,
							fields: ["value"]
						}
					}
				},
				{
					title: "Read exact inventory paths from retained inspection Evidence",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "inventory",
							collection: "occurrences",
							logical_paths: ["package.json", "main.js"],
							offset: 0,
							limit: 32
						}
					}
				},
				{
					title: "Group requests from retained HAR Evidence",
					input: API_SURFACE_EXAMPLE.input
				},
				{
					title: "Project an environment manifest from retained HAR Evidence",
					input: ENVIRONMENT_MANIFEST_EXAMPLE.input
				},
				{
					title: "Summarize retained analysis Evidence, including WASM",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: { kind: "summary" }
					}
				},
				{
					title: "Read one ELF section from retained layout Evidence",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "item",
							collection: "sections",
							selector: { name: ".text" }
						}
					}
				},
				{
					title: "Page native high-pcode operations from retained Evidence",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "native",
							facet: "value_flow_operations",
							offset: 0,
							limit: 32
						}
					}
				},
				{
					title: "Page module identities from retained application Evidence",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "page",
							collection: "modules",
							offset: 0,
							limit: 32
						}
					}
				},
				{
					title: "Read selected metadata and native facts by exact retained paths",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "javascript-facts",
							where: { paths: ["package.json", "build/Release/addon.node"] },
							property_keys: [
								"name",
								"version",
								"bytes",
								"availability",
								"operation",
								"analysis_status"
							],
							include_available_property_keys: true,
							offset: 0,
							limit: 32
						}
					}
				},
				{
					title: "Read typed module reference facts from retained application Evidence",
					input: {
						source: {
							kind: "retained-evidence",
							evidence_id: RETAINED_EXAMPLE_ID
						},
						view: {
							kind: "javascript",
							collection: "modules",
							projection: "references",
							where: {
								path: "main.js",
								kind: "javascript-module"
							},
							offset: 0,
							limit: 64
						}
					}
				}
			]
		}];
	})))();
}

//#endregion
//#region dist/contracts/native/binaryDiagnosticsToolContracts.js
var inspectBinaryLayoutRequestSchema, inspectNativeExportsRequestSchema, inspectByteEntropyRequestSchema, BINARY_DIAGNOSTICS_TOOL_CONTRACTS;
function init_binaryDiagnosticsToolContracts() {
	return (init_binaryDiagnosticsToolContracts = __esmMin((() => {
		init_devicetree();
		init_analysisView();
		init_peLoadConfig();
		init_byteEntropy();
		init_publicInput();
		init_toolOutputSchemaGroups();
		init_recordedCrash();
		init_binaryLayout();
		init_analysisDetail();
		init_nativeExports();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_peResources();
		init_peCertificates();
		init_peImports();
		init_elfNotes();
		init_appleIps();
		init_kernelModule();
		inspectBinaryLayoutRequestSchema = inspectBinaryLayoutInputSchema.extend({ detail: analysisDetailSchema });
		inspectNativeExportsRequestSchema = inspectNativeExportsInputSchema.extend({ detail: analysisDetailSchema });
		inspectByteEntropyRequestSchema = publicInputStrictObject(inspectByteEntropyInputSchema.shape).extend({ detail: analysisDetailSchema });
		BINARY_DIAGNOSTICS_TOOL_CONTRACTS = [
			{
				name: "inspect_devicetree",
				...toolContractMetadata("inspect_devicetree"),
				kind: "native-provider",
				description: "Inspect an explicit local flattened devicetree blob (FDT v16/v17) without execution or external tools. Returns validated header, memory reservations, full node/property tree with bounded raw hex, derived standard strings, cells and parent-sized reg tuples, aliases and selected single-cell phandle references with unresolved targets. Binding-specific arrays, overlays and runtime hardware remain unknown. Malformed structure or exhausted named budgets fails without partial success. Complete detail returns all Evidence inline; summary retains it for inspect_analysis_view kind devicetree, collections nodes, properties (requires exact path), reservations and references, with offset/limit pagination.",
				inputSchema: inspectDevicetreeInputSchema.extend({ detail: analysisDetailSchema }),
				outputSchema: analysisDetailOutputSchemaOf(devicetreeSchema, devicetreeSummaryViewResultSchema),
				examples: [{
					title: "Inspect a firmware hardware description",
					input: {
						path: "/artifacts/board.dtb",
						detail: "summary"
					}
				}]
			},
			{
				name: "inspect_pe_load_config",
				...toolContractMetadata("inspect_pe_load_config"),
				kind: "native-provider",
				description: "Inspect PE32/PE32+ TLS callbacks and sized load configuration without executing the image. Returns callback VA/RVA/file offsets and sections, security cookie, SafeSEH (PE32), CFG flags and table pointers/counts, EH continuation and XFG fields. Flag-derived mitigation claims are labeled inferred. Absent directories are null; malformed structures and exhausted budgets fail without partial success. Reads a stable local regular file without a disassembler.",
				inputSchema: inspectPeLoadConfigInputSchema,
				outputSchema: evidenceResultOf(peLoadConfigSchema),
				examples: [{
					title: "Inspect PE TLS callbacks and load configuration",
					input: { path: "/artifacts/program" }
				}]
			},
			{
				name: "inspect_elf_notes",
				...toolContractMetadata("inspect_elf_notes"),
				kind: "native-provider",
				description: "Inspect one explicit local ELF32/ELF64 image's PT_NOTE program headers and SHT_NOTE sections without executing it or opening a disassembler. Returns note-table file ranges, owners, types, descriptor SHA-256 and hex previews, plus GNU build-id, ABI-tag and gold-version fields when those descriptors match. A missing table is observed absence of those declarations, not proof the image never carried notes in another container. Reads a stable regular file; malformed ELF headers, truncated notes and exhausted budgets return no partial success. Portable on supported Node hosts; no debug package or catalog is required.",
				inputSchema: inspectElfNotesInputSchema,
				outputSchema: evidenceResultOf(elfNotesSchema),
				examples: [{
					title: "Inspect ELF GNU build-id and ABI-tag notes",
					input: { path: "/artifacts/program" }
				}]
			},
			{
				name: "inspect_apple_ips",
				...toolContractMetadata("inspect_apple_ips"),
				kind: "native-provider",
				description: "Inspect one explicit local Apple .ips crash report without executing a target, launching atos, or opening a disassembler. Parses the first-line metadata object and, when bug_type is the string 309, the crash body: process identity, exception and termination facts, threads, usedImages, lossless integer registers, and deterministic classification from documented SIGKILL, EXC_GUARD, pointer-authentication and dyld strings. Other bug_type values, including 288 stackshots, return no crash result. A missing or truncated body fails without partial success. Opened Mach-O and dSYM UUID joins remain unobserved. Portable on supported Node hosts; no Xcode or pwntools required.",
				inputSchema: inspectAppleIpsInputSchema,
				outputSchema: evidenceResultOf(appleIpsSchema),
				examples: [{
					title: "Inspect an Apple .ips crash report",
					input: { path: "/artifacts/app.ips" }
				}]
			},
			{
				name: "inspect_kernel_module",
				...toolContractMetadata("inspect_kernel_module"),
				kind: "native-provider",
				description: "Inspect one explicit local ELF32/ELF64 ET_REL Linux kernel module without executing it or opening a disassembler. Returns ordered .modinfo key/value entries (duplicates preserved), __versions symbol CRCs, presence of .gnu.linkonce.this_module and __ksymtab sections, observed .init.text and .exit.text sizes, and an appended module signature trailer with its module_signature fields plus a PKCS#7 byte range and SHA-256. Does not execute the module, decode struct module, or validate certificates. A missing section is observed absence when section names are known, not proof the module never carried that metadata. Other ELF types are not applicable. gzip, xz, and zstd containers are unsupported and name external_decompression as the next probe; neither this tool nor extract_artifact decodes those codecs, so decompress with an external utility and inspect the result. Reads a stable regular file; malformed ELF headers and exhausted entry budgets return no partial success. Portable on supported Node hosts.",
				inputSchema: inspectKernelModuleInputSchema,
				outputSchema: evidenceResultOf(kernelModuleSchema),
				examples: [{
					title: "Inspect Linux kernel module license, vermagic, and dependencies",
					input: { path: "/artifacts/demo.ko" }
				}]
			},
			{
				name: "inspect_byte_entropy",
				...toolContractMetadata("inspect_byte_entropy"),
				kind: "native-provider",
				description: "Inspect Shannon byte entropy for one explicit local file offline, without execution, extraction or external tools. Returns file-wide SHA-256 and entropy, fixed-block entropy for an optional offset/length window, and adjacent high (>=7.2) and low (<=1.0) runs with exact file offsets. Block size is a power of two from 256 to 65536 (default 4096). Complete output can become very large because it includes one row per selected block, and summary detail still retains that full list. Use a shorter length or a larger block_size; the selected window is limited to 32,768 output blocks. Entropy cannot distinguish compression from encryption. Summary detail returns file entropy plus the ten longest runs; retrieve parent Evidence for the full series. The entire file is read even for a window.",
				inputSchema: inspectByteEntropyRequestSchema,
				outputSchema: byteEntropyOutputSchema,
				examples: [{
					title: "Profile firmware bytes before extraction",
					input: { path: "/artifacts/firmware.bin" }
				}, {
					title: "Summarize a selected byte window",
					input: {
						path: "/artifacts/firmware.bin",
						offset: 4096,
						length: 65536,
						block_size: 4096,
						detail: "summary"
					}
				}]
			},
			{
				name: "inspect_pe_certificates",
				...toolContractMetadata("inspect_pe_certificates"),
				kind: "native-provider",
				description: "Inspect one explicit local PE32/PE32+ image's IMAGE_DIRECTORY_ENTRY_SECURITY table without executing it, verifying signatures or opening a disassembler. Returns WIN_CERTIFICATE file ranges, types and payload SHA-256, plus structurally decoded PKCS#7 signedData digest algorithms, embedded X.509 serial/issuer/subject/validity fields and signer identifiers, including a subject key identifier, when type 2 is present. A missing directory is observed absence of that table, not proof the image is unsigned in every catalog or overlay sense. Authenticode digest coverage, chain validity and timestamp trust remain unobserved. Reads a stable regular file; malformed PE headers, truncated WIN_CERTIFICATE entries, X.509 certificates missing subjectPublicKeyInfo or signatureValue, and non-signedData PKCS#7 return no partial success. Portable on supported Node hosts; no Windows SDK or engine installation required.",
				inputSchema: inspectPeCertificatesInputSchema,
				outputSchema: evidenceResultOf(peCertificatesSchema),
				examples: [{
					title: "Inspect PE Authenticode certificate identities",
					input: { path: "/artifacts/application.exe" }
				}]
			},
			{
				name: "inspect_pe_imports",
				...toolContractMetadata("inspect_pe_imports"),
				kind: "native-provider",
				description: "Inspect one explicit local PE32/PE32+ image's IMAGE_DIRECTORY_ENTRY_IMPORT and delay-load tables without executing it or opening a disassembler. Returns DLL names, named and ordinal functions, ILT/IAT RVAs, delay-load descriptors, and the pefile import hash of the standard import table, withheld with a reason when that table is partial or pefile would hash a different row sequence. A missing import directory is observed absence of that table, not proof the image never imported APIs through another table or overlay. Bound snapshots, loaded IAT contents and export-forward resolution remain unobserved. Reads a stable regular file; malformed PE headers and exhausted DLL or function budgets return no partial success. Unreadable names or thunks and descriptors missing a required table are reported as partial coverage with issues. Portable on supported Node hosts; no Windows SDK or engine installation required.",
				inputSchema: inspectPeImportsInputSchema,
				outputSchema: evidenceResultOf(peImportsSchema),
				examples: [{
					title: "Inspect PE import and delay-load identities",
					input: { path: "/artifacts/application.exe" }
				}]
			},
			{
				name: "inspect_pe_resources",
				...toolContractMetadata("inspect_pe_resources"),
				kind: "native-provider",
				description: "Inspect one explicit local PE32/PE32+ image's complete bounded type/name/language resource tree without executing it or opening a disassembler. Returns numeric IDs versus original UTF-16 names, directory identity paths including empty branches, directory/data-entry file locations, payload RVA/file ranges, complete SHA-256 hashes and static RT_GROUP_ICON image-resource candidates. Language fallback, image decoding and actual shell/window loading remain unobserved. Reads a stable regular file; malformed or ambiguous mappings, non-identical overlapping ranges and exhausted budgets return no partial success. Portable on supported Node hosts; no Windows SDK or engine installation required.",
				inputSchema: inspectPeResourcesInputSchema,
				outputSchema: evidenceResultOf(peResourcesSchema),
				examples: [{
					title: "Inspect PE resource identities and icon relationships",
					input: { path: "/artifacts/application.exe" }
				}]
			},
			{
				name: "inspect_native_exports",
				...toolContractMetadata("inspect_native_exports"),
				kind: "native-provider",
				description: "Inspect one explicit local PE or ELF image's export table without executing it or opening an engine: PE export-directory names, ordinals, addresses and forwarders, or ELF defined default/protected global, weak and unique .dynsym symbols with type, binding and symbol version. Ordinal-only, forwarded and hidden-version exports stay distinct. Portable on any supported host. Coverage is partial when table entries are unreadable and unsupported when ELF dynamic symbols cannot be enumerated from the available section metadata; an empty complete inventory means the image declares no exports. Mach-O exports use inspect_macho. Omitted/complete detail preserves inline delivery. Select detail summary to retain complete Evidence and return identity, counts and source coverage. Query inspect_analysis_view kind native-exports, collection exports or issues, with exact names/original indices, fields and matching-row pagination. Names return every version or alias; source_index is scoped to the parent Evidence. ELF name projections keep raw-byte and encoding qualifications.",
				inputSchema: inspectNativeExportsRequestSchema,
				outputSchema: analysisDetailOutputSchemaOf(nativeExportsSchema, nativeExportsSummaryViewResultSchema),
				examples: [{
					title: "List a native library's exports",
					input: { path: "/artifacts/native/libexample.so" }
				}]
			},
			{
				name: "inspect_binary_layout",
				...toolContractMetadata("inspect_binary_layout"),
				kind: "native-provider",
				description: "Inspect an explicit local binary without launching it as a host process. Returns file-backed section/segment ranges, linked addresses, original symbol/REL/RELA table identities, complete encoded RELR tables and upstream-derived offsets with unknown per-word locations/addends, raw name bytes, dependency/interpreter names and static mitigation inferences inline with artifact SHA-256 Evidence. Profile: EXEC/DYN/REL ELF64 x86-64, ELF32 i386, ELF32 little-endian ARM and ELF32 little- or big-endian MIPS on Linux x64 via caller-supplied Python with unchanged pwntools 4.15.0, pyelftools 0.33 and Unicorn 2.1.2. Runtime addresses/library paths, overall relocation inventory completeness and complete derived GOT/PLT coverage remain unknown. Zero executable entry values mean absence; relocatable entries are not applicable. Upstream can emulate PLT instructions with Unicorn for derived static maps. Uses bounded complete output and owned temporary files/processes; malformed, unsupported or oversized objects return no partial success. Select detail summary to retain the complete layout Evidence in this session and receive only its summary view, then inspect sections, symbols, mitigations or linkage with inspect_analysis_view. pwntools_timeout_ms is each owned pwntools command's deadline (omitted means 30000 ms, range 1..2147483647, next call). cpuSeconds 30 and the output, diagnostic, and address-space byte allowances have no runtime override.",
				inputSchema: inspectBinaryLayoutRequestSchema,
				outputSchema: analysisDetailOutputSchemaOf(binaryLayoutSchema, binaryLayoutSummaryViewResultSchema),
				examples: [{
					title: "Inspect ELF linked and file layout",
					input: { path: "/artifacts/application.elf" }
				}, {
					title: "Retain the complete layout and return its summary view",
					input: {
						path: "/artifacts/application.elf",
						detail: "summary"
					}
				}]
			},
			{
				name: "inspect_recorded_crash",
				...toolContractMetadata("inspect_recorded_crash"),
				kind: "native-provider",
				description: "Inspect a supplied Linux ELF64 amd64 or AArch64 little-endian core without launching its target or attaching to any live PID. Returns all recorded segments, raw note owners/descriptors and source ranges, every Linux CORE PRSTATUS thread/register and SIGINFO fields inline with SHA-256 Evidence. Historical PID is recorded metadata; current process/file identity, note coverage and signal-thread associations stay unknown. Optionally add derived core-only GDB/pwndbg mapping candidates through explicit BYO configuration; zero map flags mean unknown permissions. Uses the same stable snapshot for both stages, bounded complete output and owned cleanup. Linux x64 host profile: unchanged pwntools 4.15.0/pyelftools 0.33/Unicorn 2.1.2; optional unchanged pwndbg 2026.09.15. No implicit executable/library pairing, GDB command language, host configuration changes or dependency installation. pwntools_timeout_ms is each owned pwntools command's deadline (omitted means 30000 ms, range 1..2147483647, next call). cpuSeconds 30 and the output, diagnostic, and address-space byte allowances have no runtime override.",
				inputSchema: inspectRecordedCrashInputSchema,
				outputSchema: evidenceResultOf(recordedCrashSchema),
				examples: [{
					title: "Inspect recorded registers and signal evidence",
					input: { path: "/artifacts/crash.core" }
				}, {
					title: "Add core-only debugger mapping candidates",
					input: {
						path: "/artifacts/crash.core",
						include_debugger_context: true
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/firmware/firmwareToolContracts.js
var FIRMWARE_TOOL_CONTRACTS;
function init_firmwareToolContracts() {
	return (init_firmwareToolContracts = __esmMin((() => {
		init_firmwareAnalysis();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		init_firmwareToolRequirements();
		FIRMWARE_TOOL_CONTRACTS = [{
			name: "inspect_firmware_regions",
			...toolContractMetadata("inspect_firmware_regions"),
			kind: "firmware-provider",
			description: `Inspect signature candidates in a local firmware file with ${FIRMWARE_TOOL_REQUIREMENTS.binwalk.requirement}. Returns offsets, reported lengths, descriptions and raw confidence values. Length validation and runtime addresses remain unknown. No extraction or target execution. Linux, caller-supplied tool, util-linux prlimit and procps ps required; 128 MiB input limit, one worker. Adjust analysis_timeout_ms for the analysis wall-clock budget (default 120000); fixed per-process limits are unchanged.`,
			inputSchema: firmwareInputSchemas.inspect_firmware_regions,
			outputSchema: evidenceResultOf(firmwareResultSchemas.inspect_firmware_regions),
			examples: [{
				title: "Inspect firmware regions",
				input: { path: "/tmp/firmware.bin" }
			}]
		}, {
			name: "extract_firmware",
			...toolContractMetadata("extract_firmware"),
			kind: "firmware-provider",
			description: `Extract caller-selected firmware bytes with ${FIRMWARE_TOOL_REQUIREMENTS.unblob.requirement} into an absent output directory. Returns verified child paths/digests, task derivations, unknown chunks and uncovered selected input ranges, extraction diagnostics and explicit extraction_gaps rows naming unextracted regions, missing extractor dependencies and a continuation_id referencing shared extraction_continuations recovery instructions. Preserves the default sandbox; publishes regular files only. Linux, caller-supplied tool, format-specific extractors, util-linux prlimit and procps ps required. No mounts or extracted-code execution. Select a returned native file with open_binary for Ghidra analysis; decompressed offsets are not original-file addresses.`,
			inputSchema: firmwareInputSchemas.extract_firmware,
			outputSchema: evidenceResultOf(firmwareResultSchemas.extract_firmware),
			examples: [{
				title: "Extract selected firmware",
				input: {
					path: "/tmp/firmware.bin",
					output_directory: "/tmp/firmware-output",
					range: {
						offset: 64,
						length: 4096
					}
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/android/androidToolContracts.js
var ANDROID_TOOL_CONTRACTS;
function init_androidToolContracts() {
	return (init_androidToolContracts = __esmMin((() => {
		init_androidAnalysis();
		init_analysisView();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		ANDROID_TOOL_CONTRACTS = [
			{
				name: "inspect_android_package",
				...toolContractMetadata("inspect_android_package"),
				description: "Inspect a local APK's package, SDK and permission declarations, decoded manifest and class/resource counts, with a bounded static component projection. Omitted or complete detail preserves the complete result. Select detail: \"summary\" for all declarations, engine identity and counts without decoded manifest text or duplicate raw calls; retains the complete source and returns a distinct linked inspect_analysis_view summary. Read the exact retained manifest with view kind android, facet manifest, offset and limit (UTF-16 code units), using normalized_result.parent_evidence_id. Does not execute the APK or verify signatures. Requires a caller-supplied JADX MCP JAR and JDK; uses one worker in an isolated temporary workspace.",
				kind: "android-provider",
				inputSchema: androidPackageInspectionInputSchema,
				outputSchema: evidenceResultOf(z.union([androidResultSchemas.inspect_android_package, androidPackageSummaryViewResultSchema])),
				examples: [{
					title: "Inspect an APK",
					input: { path: "/tmp/Example.apk" }
				}, {
					title: "Inspect APK declarations with retained manifest",
					input: {
						path: "/tmp/Example.apk",
						detail: "summary"
					}
				}]
			},
			{
				name: "search_android_classes",
				...toolContractMetadata("search_android_classes"),
				description: "Search complete top-level decompiler class-name rows in an explicit local APK by case-sensitive substring. Empty query inventories all rows. Repeated names remain repeated and appear in duplicate_names; the provider accepts only class names for lookup, so these rows do not identify which same-name class node a later lookup selects. Retains artifact and engine identity; no APK execution.",
				kind: "android-provider",
				inputSchema: androidInputSchemas.search_android_classes,
				outputSchema: evidenceResultOf(androidResultSchemas.search_android_classes),
				examples: [{
					title: "Find activity classes",
					input: {
						path: "/tmp/Example.apk",
						query: "Activity"
					}
				}]
			},
			{
				name: "inspect_android_class",
				...toolContractMetadata("inspect_android_class"),
				description: "Inspect one exact Android class's parsed methods, fields and inner classes, including synthetic members. Returns display signatures, exact DEX prototypes and encoded static final field values without generating source. A prototype is not a complete raw method ID; overload indices remain consistent within the artifact and engine session.",
				kind: "android-provider",
				inputSchema: androidInputSchemas.inspect_android_class,
				outputSchema: evidenceResultOf(androidResultSchemas.inspect_android_class),
				examples: [{
					title: "Inspect a class",
					input: {
						path: "/tmp/Example.apk",
						class_name: "example.MainActivity"
					}
				}]
			},
			{
				name: "inspect_android_method",
				...toolContractMetadata("inspect_android_method"),
				description: "Decompile one Android method with smali fallback. Requires explicit overload_index when multiple methods share a name. Reports its DEX prototype, representation, fallback markers and source truncation; display signatures may be aliases.",
				kind: "android-provider",
				inputSchema: androidInputSchemas.inspect_android_method,
				outputSchema: evidenceResultOf(androidResultSchemas.inspect_android_method),
				examples: [{
					title: "Decompile a method",
					input: {
						path: "/tmp/Example.apk",
						class_name: "example.MainActivity",
						method_name: "onCreate"
					}
				}]
			},
			{
				name: "trace_android_references",
				...toolContractMetadata("trace_android_references"),
				description: "Trace incoming static using nodes to an exact Android class or selected method overload. The total counts containing nodes, not individual invoke instructions. Use inspect_android_class to choose an overload_index when names collide. Source lines and the containing node dex_offset remain unknown. direct_invokes carries exact DEX code-unit instruction offsets when available; direct_invokes_exhaustive false marks byte-bounded partial instruction evidence, and null means coverage is unknown. Using-node coverage remains separate; no runtime calls are inferred.",
				kind: "android-provider",
				inputSchema: androidInputSchemas.trace_android_references,
				outputSchema: evidenceResultOf(androidResultSchemas.trace_android_references),
				examples: [{
					title: "Find references to a class",
					input: {
						path: "/tmp/Example.apk",
						class_name: "example.MainActivity"
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/apktool/apktoolToolContracts.js
var APKTOOL_TOOL_CONTRACTS;
function init_apktoolToolContracts() {
	return (init_apktoolToolContracts = __esmMin((() => {
		init_apktoolResourceAnalysis();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		APKTOOL_TOOL_CONTRACTS = [{
			name: "inspect_apktool_client",
			...toolContractMetadata("inspect_apktool_client"),
			description: "Inspect the caller-selected apktool launcher: resolved command, selection source, and version. Decodes nothing. REA never installs Apktool or Java; select a launcher with REA_APKTOOL_COMMAND (absolute) or apktool on PATH.",
			kind: "apktool-provider",
			inputSchema: apktoolInputSchemas.inspect_apktool_client,
			outputSchema: evidenceResultOf(apktoolResultSchemas.inspect_apktool_client),
			examples: [{
				title: "Check the Apktool launcher",
				input: {}
			}]
		}, {
			name: "decode_android_resources",
			...toolContractMetadata("decode_android_resources"),
			description: "Decode one local APK's resources with `apktool d --no-src` in a provider-owned workspace that is removed after projection: the readable AndroidManifest.xml, apktool.yml version and SDK facts, the app's string resources (default or selected locales, bounded to 2000 entries per table), selectable string locales, and the decoded file count. The target APK is digest with SHA-256 before decoding; smali is skipped because Java-source recovery belongs to the JADX family. Optional decode_timeout_ms is the decode wall clock in milliseconds (default 600000, range 1..2147483647); omitted means 600000 and the value applies on the next decode. It does not raise the fixed output capture allowance or the version probe.",
			kind: "apktool-provider",
			inputSchema: apktoolInputSchemas.decode_android_resources,
			outputSchema: evidenceResultOf(apktoolResultSchemas.decode_android_resources),
			examples: [
				{
					title: "Decode an APK's resources",
					input: { path: "/targets/Example.apk" }
				},
				{
					title: "Decode one locale's strings",
					input: {
						path: "/targets/Example.apk",
						locale: "de"
					}
				},
				{
					title: "Decode multiple locale string tables in one pass",
					input: {
						path: "/targets/Example.apk",
						locales: ["de", "fr"],
						string_tables_only: true
					}
				}
			]
		}];
	})))();
}

//#endregion
//#region dist/contracts/pcap/pcapToolContracts.js
var PCAP_TOOL_CONTRACTS;
function init_pcapToolContracts() {
	return (init_pcapToolContracts = __esmMin((() => {
		init_pcapAnalysis();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		init_analysisDetail();
		init_analysisView();
		PCAP_TOOL_CONTRACTS = [{
			name: "inspect_pcap_client",
			...toolContractMetadata("inspect_pcap_client"),
			description: "Inspect the caller-selected tshark and capinfos binaries: selected commands, selection sources, and versions. Both tools must be usable. Reads no capture file. REA never installs the Wireshark suite; select binaries with REA_TSHARK_COMMAND and REA_CAPINFOS_COMMAND (absolute) or from PATH.",
			kind: "pcap-provider",
			inputSchema: pcapInputSchemas.inspect_pcap_client,
			outputSchema: evidenceResultOf(pcapResultSchemas.inspect_pcap_client),
			examples: [{
				title: "Check the analysis tools",
				input: {}
			}]
		}, {
			name: "inspect_pcap_capture",
			...toolContractMetadata("inspect_pcap_capture"),
			description: "Request detail summary for capture identity/counts, then page retained facts with inspect_analysis_view kind pcap. Default detail complete preserves inline delivery. Inspect one saved pcap or pcapng capture through an owned snapshot: metadata, exact packet count, SHA-256, IPv4/IPv6 address counts, DNS questions and address values from the same single-question response, TLS SNI, protocol distribution and HTTP URIs. All derived inventories are retained within declared resource budgets; unknown DNS attribution and excluded credentials remain explicit. Linux requires util-linux prlimit; Windows uses owned Job Objects. Requires caller-supplied capinfos and tshark; REA never captures traffic.",
			kind: "pcap-provider",
			inputSchema: pcapInputSchemas.inspect_pcap_capture.extend({ detail: analysisDetailSchema }),
			outputSchema: analysisDetailOutputSchemaOf(pcapResultSchemas.inspect_pcap_capture, pcapCaptureSummaryViewResultSchema),
			examples: [{
				title: "Inspect a capture file",
				input: { path: "/captures/session.pcap" }
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/flutter/flutterToolContracts.js
var FLUTTER_TOOL_CONTRACTS;
function init_flutterToolContracts() {
	return (init_flutterToolContracts = __esmMin((() => {
		init_flutterBuildAnalysis();
		init_analysisView();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		FLUTTER_TOOL_CONTRACTS = [{
			name: "identify_flutter_build",
			...toolContractMetadata("identify_flutter_build"),
			description: "Identify a Flutter app's build facts by pure parsing: observed Dart snapshot hashes from lib/<abi>/libapp.so, per-ABI library digests, the engine library's GNU build-id, and any labeled Dart version or toolchain strings libflutter.so carries. Complete snapshot coverage currently expects two independent headers in the legacy split VM/isolate profile; unified and other layouts can yield partial build facts. The snapshot hash maps to a Dart SDK release through an external dataset; REA performs no lookup. No engine, no execution, no external tools.",
			kind: "flutter-provider",
			inputSchema: flutterInputSchemas.identify_flutter_build,
			outputSchema: evidenceResultOf(flutterResultSchemas.identify_flutter_build),
			examples: [{
				title: "Identify a Flutter build",
				input: { path: "/targets/Example.apk" }
			}]
		}, {
			name: "inspect_dart_aot",
			...toolContractMetadata("inspect_dart_aot"),
			description: "Inspect one ABI's legacy split VM/isolate Dart AOT snapshot inside an APK (complete structural coverage: Dart 2.14 FullAOT kind 3). Unified _kDartSnapshotData/_kDartSnapshotText profiles are unsupported. Returns the four snapshot exports through the ELF dynamic symbol table with offsets, sizes and headers (magic, kind, length), snapshot hash, and a bounded string-pool projection from isolate data (package: source URIs, dart: SDK URIs, identifier-like tokens). String-pool entries are byte-pattern observations, not deserialized cluster semantics; typed class and function recovery needs an SDK-specific parser. Omitted or complete detail returns the full observation. Select detail: \"summary\" for target/ABI/library identity, all snapshot headers, coverage and original lower-bound counts without string lists. The complete source stays retained; read returned strings via inspect_analysis_view with parent_evidence_id and kind dart-aot, collection package_uris/dart_uris/class_like_tokens, offset and limit. Exhausting pages does not imply complete pool coverage. No engine, no execution.",
			kind: "flutter-provider",
			inputSchema: dartAotInspectionInputSchema,
			outputSchema: evidenceResultOf(z.union([flutterResultSchemas.inspect_dart_aot, dartAotSummaryViewResultSchema])),
			examples: [
				{
					title: "Inspect the preferred ABI's AOT snapshot",
					input: { path: "/targets/Example.apk" }
				},
				{
					title: "Inspect one ABI explicitly",
					input: {
						path: "/targets/Example.apk",
						abi: "arm64-v8a"
					}
				},
				{
					title: "Inspect snapshot identity with retained string lists",
					input: {
						path: "/targets/Example.apk",
						detail: "summary"
					}
				}
			]
		}];
	})))();
}

//#endregion
//#region dist/contracts/jeb/jebToolContracts.js
var JEB_TOOL_CONTRACTS;
function init_jebToolContracts() {
	return (init_jebToolContracts = __esmMin((() => {
		init_jebAnalysis();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		JEB_TOOL_CONTRACTS = [
			{
				name: "inspect_jeb_client",
				...toolContractMetadata("inspect_jeb_client"),
				description: "Inspect the running JEB client serving MCP: engine version, GUI or headless mode, and startup time. Does not open a target. Requires a caller-started JEB client reachable at REA_JEB_MCP_URL (default http://127.0.0.1:8425/mcp); REA never installs or launches JEB.",
				kind: "jeb-provider",
				inputSchema: jebInputSchemas.inspect_jeb_client,
				outputSchema: evidenceResultOf(jebResultSchemas.inspect_jeb_client),
				examples: [{
					title: "Check the engine",
					input: {}
				}]
			},
			{
				name: "open_jeb_project",
				...toolContractMetadata("open_jeb_project"),
				description: "Open or create a JEB project from an artifact file or existing .jdb2 database on the engine host. Returns the project's input-file digests and top-level units. The engine analyzes the target itself; REA does not read the file or execute it. Fails when a project is already open.",
				kind: "jeb-provider",
				inputSchema: jebInputSchemas.open_jeb_project,
				outputSchema: evidenceResultOf(jebResultSchemas.open_jeb_project),
				examples: [{
					title: "Open a target for analysis",
					input: { path: "/tmp/Example.apk" }
				}]
			},
			{
				name: "list_jeb_units",
				...toolContractMetadata("list_jeb_units"),
				description: "List project units by stable unit path and type, with optional wildcard filter, parent restriction, and pagination. The engine caps pages at 100 units; a full page reports partial coverage because more units may exist. Read-only.",
				kind: "jeb-provider",
				inputSchema: jebInputSchemas.list_jeb_units,
				outputSchema: evidenceResultOf(jebResultSchemas.list_jeb_units),
				examples: [{
					title: "List units",
					input: {}
				}, {
					title: "Find DEX units",
					input: { filter: "*.dex" }
				}]
			},
			{
				name: "decompile_jeb_item",
				...toolContractMetadata("decompile_jeb_item"),
				description: "Decompile one type or method to engine pseudo-code using its decompiler (Dalvik, Java, or native). item_address comes from the engine's code item listing; unit_path defaults to the engine's first code unit and stays unknown when omitted. Read-only with respect to the target file.",
				kind: "jeb-provider",
				inputSchema: jebInputSchemas.decompile_jeb_item,
				outputSchema: evidenceResultOf(jebResultSchemas.decompile_jeb_item),
				examples: [{
					title: "Decompile a method",
					input: {
						item_address: "Lcom/example/Main;->onCreate()V",
						item_kind: "method"
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/adb/adbToolContracts.js
var ADB_TOOL_CONTRACTS;
function init_adbToolContracts() {
	return (init_adbToolContracts = __esmMin((() => {
		init_adbDeviceAnalysis();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		ADB_TOOL_CONTRACTS = [
			{
				name: "inspect_adb_client",
				...toolContractMetadata("inspect_adb_client"),
				description: "Inspect the caller-selected adb client: resolved binary, version, and install path. Never contacts devices and never starts the adb server. REA never installs platform tools; select a binary with REA_ADB_PATH (absolute) or adb on PATH.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.inspect_adb_client,
				outputSchema: evidenceResultOf(adbResultSchemas.inspect_adb_client),
				examples: [{
					title: "Check the adb client",
					input: {}
				}]
			},
			{
				name: "list_adb_devices",
				...toolContractMetadata("list_adb_devices"),
				description: "List attached devices exactly as `adb devices -l` reports them: serial, state, transport, model metadata, and an inferred emulator/physical kind with its evidence basis. Emulators and USB or network devices appear alike; REA neither starts nor manages them. May start the local adb server on first use.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_devices,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_devices),
				examples: [{
					title: "List attached devices",
					input: {}
				}]
			},
			{
				name: "inspect_adb_device",
				...toolContractMetadata("inspect_adb_device"),
				description: "Inspect one device's build identity through a fixed `getprop` whitelist: Android and SDK versions, security patch, fingerprint, product identity, CPU ABIs, and debuggable flag, plus the observed emulator indicator ro.kernel.qemu. Present properties retain empty values; omitted keys were not reported. Read-only with respect to the device.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.inspect_adb_device,
				outputSchema: evidenceResultOf(adbResultSchemas.inspect_adb_device),
				examples: [{
					title: "Inspect one device",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "list_adb_packages",
				...toolContractMetadata("list_adb_packages"),
				description: "List installed packages on one device with each base APK's device path, optionally scoped to third-party or system packages. Paths are device filesystem paths, not host-local. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_packages,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_packages),
				examples: [{
					title: "List third-party packages",
					input: {
						serial: "emulator-5554",
						scope: "third_party"
					}
				}]
			},
			{
				name: "pull_adb_package",
				...toolContractMetadata("pull_adb_package"),
				description: "Pull one installed package's complete APK set (base plus every split, as `pm path` reports) from the device into a caller-selected output directory, creating a package-named subdirectory that must not already exist. Every pulled file is digested with SHA-256; partial pulls keep successful artifacts and per-file failure reasons. The device keeps the originals.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.pull_adb_package,
				outputSchema: evidenceResultOf(adbResultSchemas.pull_adb_package),
				examples: [{
					title: "Pull a package APK set",
					input: {
						serial: "emulator-5554",
						package: "com.example.app",
						output_directory: "/tmp/rea-pulls"
					}
				}]
			},
			{
				name: "read_adb_logcat",
				...toolContractMetadata("read_adb_logcat"),
				description: "Read a bounded dump of the device log (`logcat -d -t`) for one buffer, optionally restricted to a process id. No streaming, no clearing; the newest lines are kept when the count cap trims. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.read_adb_logcat,
				outputSchema: evidenceResultOf(adbResultSchemas.read_adb_logcat),
				examples: [{
					title: "Read the last 200 main-buffer lines",
					input: {
						serial: "emulator-5554",
						count: 200,
						buffer: "main"
					}
				}]
			},
			{
				name: "inspect_adb_package",
				...toolContractMetadata("inspect_adb_package"),
				description: "Inspect installed-package versions, install times, installer, user id, flags, and requested-permission count through read-only `dumpsys package`. Malformed numeric declarations are retained in bounded numeric_issues and make coverage partial; version_code stays exact text. Unknown sections are not inferred.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.inspect_adb_package,
				outputSchema: evidenceResultOf(adbResultSchemas.inspect_adb_package),
				examples: [{
					title: "Inspect an installed package",
					input: {
						serial: "emulator-5554",
						package: "com.example.app"
					}
				}]
			},
			{
				name: "pull_adb_file",
				...toolContractMetadata("pull_adb_file"),
				description: "Pull one absolute device path (a database, shared-preferences XML, or any readable file) into a caller-selected output directory, digesting it with SHA-256. The local copy must not already exist. Read-only with respect to the device.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.pull_adb_file,
				outputSchema: evidenceResultOf(adbResultSchemas.pull_adb_file),
				examples: [{
					title: "Pull an app database",
					input: {
						serial: "emulator-5554",
						device_path: "/data/data/com.example.app/databases/app.db",
						output_directory: "/tmp/rea-pulls"
					}
				}]
			},
			{
				name: "push_adb_file",
				...toolContractMetadata("push_adb_file"),
				description: "Push one local file to an absolute device path. If the destination is an existing directory, adb places the file inside it under the local basename and the result reports that file path. A device-mutating tool: checks for an existing destination file before transfer and refuses it unless overwrite is explicitly requested; this check is not atomic and another process can create the path before adb writes. The private staged copy remains non-writable and preserves source executable bits. When the device provides sha256sum, the transfer is verified by comparing it with the local digest.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.push_adb_file,
				outputSchema: evidenceResultOf(adbResultSchemas.push_adb_file),
				examples: [{
					title: "Push a script to tmp",
					input: {
						serial: "emulator-5554",
						local_path: "/tmp/frida-server",
						device_path: "/data/local/tmp/frida-server"
					}
				}]
			},
			{
				name: "capture_adb_screen",
				...toolContractMetadata("capture_adb_screen"),
				description: "Capture one frame of the device screen as a PNG (`screencap -p` through exec-out, no device-side file) into a caller-selected output directory, digesting it and reporting its dimensions. No recording or interaction.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.capture_adb_screen,
				outputSchema: evidenceResultOf(adbResultSchemas.capture_adb_screen),
				examples: [{
					title: "Capture the current screen",
					input: {
						serial: "emulator-5554",
						output_directory: "/tmp/rea-captures"
					}
				}]
			},
			{
				name: "list_adb_processes",
				...toolContractMetadata("list_adb_processes"),
				description: "List running processes exactly as `ps -A` reports them: user, pid, ppid, rss, state, and name. Useful for pairing with instrumentation lanes. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_processes,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_processes),
				examples: [{
					title: "List processes",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "list_adb_directory",
				...toolContractMetadata("list_adb_directory"),
				description: "List the immediate children of one absolute device directory, including hidden entries: names, kinds, permissions, owner, group, sizes, dates, and symlink targets. Names and targets preserve embedded newlines. Recognizes the standard errors for absent paths and denied reads. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_directory,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_directory),
				examples: [{
					title: "List an app's data directory",
					input: {
						serial: "emulator-5554",
						device_path: "/data/data/com.example.app"
					}
				}]
			},
			{
				name: "list_adb_features",
				...toolContractMetadata("list_adb_features"),
				description: "List the device's declared hardware and software features (`pm list features`) for device fingerprinting. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_features,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_features),
				examples: [{
					title: "List features",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "list_adb_services",
				...toolContractMetadata("list_adb_services"),
				description: "List the device's binder services with their interfaces (`service list`). Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.list_adb_services,
				outputSchema: evidenceResultOf(adbResultSchemas.list_adb_services),
				examples: [{
					title: "List services",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "inspect_adb_display",
				...toolContractMetadata("inspect_adb_display"),
				description: "Read physical and override size/density from `wm size` and `wm density`. Malformed numeric declarations are retained in numeric_issues with partial coverage; optional values remain null. Required physical-size failures retain partial display facts. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.inspect_adb_display,
				outputSchema: evidenceResultOf(adbResultSchemas.inspect_adb_display),
				examples: [{
					title: "Inspect the display",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "inspect_adb_window",
				...toolContractMetadata("inspect_adb_window"),
				description: "Report the window manager's focus declarations with display context, original lines and explicit summary status. Reads `dumpsys window windows`, falling back to `displays` only when no focus field is declared. Singular fields are unknown for multiple contexts or repeated declarations; inspect focus_contexts for every observation. Read-only; no interaction occurs.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.inspect_adb_window,
				outputSchema: evidenceResultOf(adbResultSchemas.inspect_adb_window),
				examples: [{
					title: "Inspect window focus",
					input: { serial: "emulator-5554" }
				}]
			},
			{
				name: "read_adb_setting",
				...toolContractMetadata("read_adb_setting"),
				description: "Read one settings value (`settings get`) from the system, secure, or global namespace. Absent keys report the device's own null observation. Read-only; writing settings is not exposed.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.read_adb_setting,
				outputSchema: evidenceResultOf(adbResultSchemas.read_adb_setting),
				examples: [{
					title: "Read the ADB-enabled setting",
					input: {
						serial: "emulator-5554",
						namespace: "secure",
						key: "adb_enabled"
					}
				}]
			},
			{
				name: "collect_adb_bugreport",
				...toolContractMetadata("collect_adb_bugreport"),
				description: "Collect one device-generated bugreport archive (`adb bugreport`) into a caller-selected output directory, digesting the zip. The archive contains the device's own dumpstate, dumpsys, and logcat report; collection can take minutes. Read-only with respect to configuration.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.collect_adb_bugreport,
				outputSchema: evidenceResultOf(adbResultSchemas.collect_adb_bugreport),
				examples: [{
					title: "Collect a bugreport",
					input: {
						serial: "emulator-5554",
						output_directory: "/tmp/rea-bugreports"
					}
				}]
			},
			{
				name: "resolve_adb_packages",
				...toolContractMetadata("resolve_adb_packages"),
				description: "Find installed packages by case-insensitive substring of the package name (e.g. `whatsapp` → `com.whatsapp`), returning each match's base APK device path. The first step of an easy get: resolve, then pull_adb_package the exact name. Read-only.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.resolve_adb_packages,
				outputSchema: evidenceResultOf(adbResultSchemas.resolve_adb_packages),
				examples: [{
					title: "Find a package by partial name",
					input: {
						serial: "emulator-5554",
						query: "whatsapp"
					}
				}]
			},
			{
				name: "install_adb_package",
				...toolContractMetadata("install_adb_package"),
				description: "Install one local APK on the device (`adb install [-r]`), recording the APK's host digest and byte size. A device-mutating tool: `replace_requested` records whether `-r` was selected; `replaced` is null because install success does not establish prior package state. The device's own Success/Failure verdict is preserved with its reason.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.install_adb_package,
				outputSchema: evidenceResultOf(adbResultSchemas.install_adb_package),
				examples: [{
					title: "Install an APK",
					input: {
						serial: "emulator-5554",
						apk_path: "/tmp/app.apk"
					}
				}, {
					title: "Request reinstall mode to keep existing app data",
					input: {
						serial: "emulator-5554",
						apk_path: "/tmp/app.apk",
						replace: true
					}
				}]
			},
			{
				name: "uninstall_adb_package",
				...toolContractMetadata("uninstall_adb_package"),
				description: "Request package removal for user 0 (`adb shell pm uninstall --user 0`) without data retention. A device-mutating tool; absent packages report the device's own refusal reason.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.uninstall_adb_package,
				outputSchema: evidenceResultOf(adbResultSchemas.uninstall_adb_package),
				examples: [{
					title: "Uninstall a package",
					input: {
						serial: "emulator-5554",
						package: "com.example.app"
					}
				}]
			},
			{
				name: "start_adb_app",
				...toolContractMetadata("start_adb_app"),
				description: "Start one installed app's resolved launcher activity with `am start -W -n`. A device-mutating tool for dynamic analysis. The full wait report determines success; failures retain launch-attempt facts and raw output. Pair with `read_adb_logcat` (pid filter) and `list_adb_processes` to observe the app, and `stop_adb_app` to end the run.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.start_adb_app,
				outputSchema: evidenceResultOf(adbResultSchemas.start_adb_app),
				examples: [{
					title: "Start an app",
					input: {
						serial: "emulator-5554",
						package: "com.example.app"
					}
				}]
			},
			{
				name: "start_adb_activity",
				...toolContractMetadata("start_adb_activity"),
				description: "Start an intent with `am start -W`: one action, optional data URI, optional explicit component, and up to 16 typed extras (string, boolean, int, long, float). A device-mutating tool; the full wait report determines success, with failed-attempt facts and raw output retained.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.start_adb_activity,
				outputSchema: evidenceResultOf(adbResultSchemas.start_adb_activity),
				examples: [{
					title: "Open a deep link",
					input: {
						serial: "emulator-5554",
						action: "android.intent.action.VIEW",
						data_uri: "https://example.com/path"
					}
				}, {
					title: "Start with typed extras",
					input: {
						serial: "emulator-5554",
						action: "com.example.APP_ACTION",
						extras: [{
							key: "level",
							type: "int",
							value: "3"
						}]
					}
				}]
			},
			{
				name: "stop_adb_app",
				...toolContractMetadata("stop_adb_app"),
				description: "Force-stop every process of one package (`am force-stop`), ending a dynamic-analysis run. A device-mutating tool; it succeeds whether or not the package had running processes.",
				kind: "adb-provider",
				inputSchema: adbInputSchemas.stop_adb_app,
				outputSchema: evidenceResultOf(adbResultSchemas.stop_adb_app),
				examples: [{
					title: "Stop an app",
					input: {
						serial: "emulator-5554",
						package: "com.example.app"
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/managed/managedWorkflowExamples.js
var MANAGED_STATIC_EXAMPLE_PROVIDER, NATIVE_EXAMPLE_PROVIDER, emptyManagedMembers, evidence, runtimeMembers, MANAGED_MEMBER_COMPARISON_EXAMPLE, runtimeExampleEvidence, MANAGED_APPLICATION_GRAPH_EXAMPLE, boundaryEvidence, nativeExportEvidence, coverage, MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE, MANAGED_NATIVE_VERIFICATION_EXAMPLE;
function init_managedWorkflowExamples() {
	return (init_managedWorkflowExamples = __esmMin((() => {
		init_evidence();
		MANAGED_STATIC_EXAMPLE_PROVIDER = {
			id: "rea-dotnet-static",
			name: "REA managed static analysis provider",
			version: "1"
		};
		NATIVE_EXAMPLE_PROVIDER = {
			id: "native-macos",
			name: "REA native macOS provider",
			version: "1"
		};
		emptyManagedMembers = (sha256, mvid) => ({
			signature_resolution: null,
			assembly: null,
			artifact: {
				path: `/examples/${sha256.slice(0, 8)}.dll`,
				sha256,
				byte_length: 4096,
				format: "pe"
			},
			module: {
				name: "Example.dll",
				generation: 0,
				mvid,
				enc_id: null,
				enc_base_id: null,
				token: "0x00000001",
				row_offset: 0
			},
			metadata: {
				status: "complete",
				version: "v4.0.30319",
				table_row_counts: {}
			},
			identity_scope: {
				token_identity: "build-local",
				requires_artifact_sha256: sha256,
				requires_mvid: mvid
			},
			types: [],
			nesting_read: true,
			method_rows: {
				offset: 0,
				count: 0,
				total: 0
			},
			exported_types: [],
			fields: [],
			methods: [],
			member_refs: [],
			call_edges: [],
			field_accesses: [],
			user_strings: {
				state: "complete",
				literals: [],
				issues: []
			},
			selection: null,
			coverage: {
				state: "complete",
				issues: []
			},
			limitations: []
		});
		evidence = (result) => createEvidence(undefined, MANAGED_STATIC_EXAMPLE_PROVIDER, {
			operation: "inspect_managed_members",
			parameters: {},
			result,
			rawResult: null,
			limitations: result.limitations
		});
		runtimeMembers = () => {
			const result = emptyManagedMembers("2".repeat(64), "11112222-3333-4444-9555-666677778888");
			return {
				...result,
				methods: [{
					token: "0x06000001",
					row_offset: 128,
					declaring_type_token: "0x02000001",
					declaring_type: "Example.Program",
					name: "Main",
					rva: 8192,
					impl_flags: 0,
					flags: 22,
					signature: {
						raw_length: 3,
						raw_sha256: "3".repeat(64),
						resolved_sha256: "3".repeat(64),
						kind: "method",
						parse_status: "decoded",
						calling_convention: "default",
						generic_parameter_count: 0,
						parameter_count: 0,
						return_type: "void",
						parameter_types: [],
						field_type: null,
						issue: null
					},
					body: {
						status: "present",
						header_format: "tiny",
						rva: 8192,
						file_offset: 512,
						max_stack: 8,
						init_locals: false,
						local_var_sig_token: null,
						il_size: 1,
						il_sha256: "4".repeat(64),
						normalized_il_sha256: "5".repeat(64),
						instruction_count: 1,
						decoded_instruction_count: 1,
						truncated_instructions: 0,
						opcode_counts: { ret: 1 },
						anchors: [],
						exception_regions: [],
						issue: null
					}
				}]
			};
		};
		MANAGED_MEMBER_COMPARISON_EXAMPLE = {
			left: evidence(emptyManagedMembers("0".repeat(64), "00112233-4455-6677-8899-aabbccddeeff")),
			right: evidence(emptyManagedMembers("1".repeat(64), "ffeeddcc-bbaa-4988-9766-554433221100"))
		};
		runtimeExampleEvidence = evidence(runtimeMembers());
		MANAGED_APPLICATION_GRAPH_EXAMPLE = { managed_members: runtimeExampleEvidence };
		boundaryEvidence = () => {
			const result = {
				artifact: {
					path: "/examples/ManagedInterop.exe",
					sha256: "6".repeat(64),
					byte_length: 8192,
					format: "pe"
				},
				module: {
					name: "ManagedInterop.exe",
					generation: 0,
					mvid: "00112233-4455-4677-8899-aabbccddeeff",
					enc_id: null,
					enc_base_id: null,
					token: "0x00000001",
					row_offset: 0
				},
				metadata: {
					status: "complete",
					version: "v4.0.30319",
					table_row_counts: {}
				},
				identity_scope: {
					token_identity: "build-local",
					requires_artifact_sha256: "6".repeat(64),
					requires_mvid: "00112233-4455-4677-8899-aabbccddeeff"
				},
				cli_native: {
					il_only: true,
					requires_32bit: false,
					strong_name_signed: false,
					native_entry_point: false,
					ready_to_run_signature: false,
					managed_native_header_rva: 0,
					managed_native_header_size: 0
				},
				module_refs: [{
					token: "0x1a000001",
					row_offset: 256,
					name: "nativehelper.dll"
				}],
				pinvoke_imports: [{
					token: "0x1c000001",
					row_offset: 288,
					mapping_flags: 0,
					mapping_flags_hex: "0x0000",
					member_token: "0x06000001",
					member_kind: "method",
					member_name: "OpenNative",
					import_name: "open_native",
					import_scope_token: "0x1a000001",
					import_scope_name: "nativehelper.dll",
					no_mangle: true,
					char_set: "not-specified",
					call_convention: "cdecl",
					supports_last_error: false,
					best_fit: "assembly-default",
					throw_on_unmappable_char: "assembly-default",
					verification: "managed-declaration-only"
				}],
				native_implementations: [],
				summary: {
					module_ref_count: 1,
					pinvoke_import_count: 1,
					native_implementation_count: 0,
					ready_to_run: false,
					mixed_mode_or_native_header: false
				},
				coverage: {
					state: "complete",
					issues: []
				},
				limitations: []
			};
			return createEvidence(undefined, MANAGED_STATIC_EXAMPLE_PROVIDER, {
				operation: "inspect_managed_native_boundaries",
				parameters: {},
				result,
				rawResult: null,
				limitations: result.limitations
			});
		};
		nativeExportEvidence = () => {
			const result = {
				format: "mach-o",
				selected_architecture: {
					name: "x86_64",
					container_file_offset: null
				},
				endian: "little",
				word_size: 64,
				file_type: "dylib",
				flags: [],
				uuid: null,
				entrypoints: coverage([]),
				architectures: coverage([]),
				build_metadata: coverage([]),
				load_commands: coverage([]),
				dependencies: coverage([]),
				imports: coverage([]),
				exports: coverage([{
					name: "open_native",
					address: "0x1000",
					weak: false,
					reexport: false,
					source: "nm"
				}]),
				segments: coverage([]),
				provenance: [],
				limitations: ["Selected Mach-O slice container offset is unknown in this synthetic example."]
			};
			return createEvidence({
				path: "/examples/nativehelper.dll",
				sha256: "7".repeat(64),
				format: "mach-o",
				architecture: "x86_64"
			}, NATIVE_EXAMPLE_PROVIDER, {
				operation: "inspect_macho",
				parameters: {},
				result,
				rawResult: null,
				limitations: result.limitations
			});
		};
		coverage = (items) => ({
			items: [...items],
			total: items.length,
			exhaustive: true,
			limitations: []
		});
		MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE = {
			static_members: runtimeExampleEvidence,
			decompiler: {
				name: "ilspycmd",
				version: "9.1.0.7988",
				family: "ilspy",
				executable_sha256: null,
				options: [
					"--disable-updatecheck",
					"--type",
					"Example.Program"
				]
			},
			methods: [{
				token: "0x06000001",
				signature_sha256: "3".repeat(64),
				normalized_il_sha256: "5".repeat(64),
				reconstruction: {
					kind: "decompiled-csharp",
					language: "csharp",
					text: "internal static void Main() { }",
					source_path: "/examples/Example.Program.cs",
					start_line: 1,
					end_line: 1
				}
			}],
			notes: ["Synthetic example only; decompiler output is imported as inference."]
		};
		MANAGED_NATIVE_VERIFICATION_EXAMPLE = {
			managed_boundaries: boundaryEvidence(),
			native_observations: [nativeExportEvidence()]
		};
	})))();
}

//#endregion
//#region dist/contracts/managed/managedWorkflowToolContracts.js
var managedApplicationGraphReferenceShape, managedApplicationGraphReferenceInputSchema, comparisonOutputSchema$1, reconstructionOutputSchema, nativeVerificationOutputSchema, managedApplicationGraphOutputSchema, MANAGED_WORKFLOW_TOOL_CONTRACTS;
function init_managedWorkflowToolContracts() {
	return (init_managedWorkflowToolContracts = __esmMin((() => {
		init_evidence();
		init_managedMemberComparison();
		init_managedNativeVerificationSchemas();
		init_managedReconstruction();
		init_toolOutputSchemaGroups();
		init_managedWorkflowExamples();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		managedApplicationGraphReferenceShape = z.strictObject({
			managed_artifact: evidenceSchema.optional(),
			managed_members: evidenceSchema.optional(),
			managed_native_boundaries: evidenceSchema.optional()
		});
		managedApplicationGraphReferenceInputSchema = z.union([
			managedApplicationGraphReferenceShape.extend({ managed_artifact: evidenceSchema }),
			managedApplicationGraphReferenceShape.extend({ managed_members: evidenceSchema }),
			managedApplicationGraphReferenceShape.extend({ managed_native_boundaries: evidenceSchema })
		]).superRefine((input, context) => {
			const ids = [
				input.managed_artifact?.evidence_id,
				input.managed_members?.evidence_id,
				input.managed_native_boundaries?.evidence_id
			].filter((id) => id !== undefined);
			if (ids.length === 0) context.addIssue({
				code: "custom",
				message: "Provide at least one managed Evidence source"
			});
			if (new Set(ids).size !== ids.length) context.addIssue({
				code: "custom",
				message: "Managed application graph Evidence IDs must be unique"
			});
		});
		comparisonOutputSchema$1 = requireOutputSchema(managedWorkflowOutputSchemas, "compare_managed_members");
		reconstructionOutputSchema = requireOutputSchema(managedWorkflowOutputSchemas, "import_managed_reconstruction");
		nativeVerificationOutputSchema = requireOutputSchema(managedWorkflowOutputSchemas, "verify_managed_native_boundaries");
		managedApplicationGraphOutputSchema = requireOutputSchema(managedWorkflowOutputSchemas, "project_managed_application_graph");
		MANAGED_WORKFLOW_TOOL_CONTRACTS = [
			{
				name: "compare_managed_members",
				...toolContractMetadata("compare_managed_members"),
				description: "Compare two authenticated inspect_managed_members Evidence records using unique-only tiers: exact declared type, name, and CIL/signature; exact declared type, name, and signature (decoded or not); exact declared type, name, and decoded structural method shape; then exact CIL/signature or decoded structural method shape alone, which never takes a member whose own declared type and name remain unpaired on the other side or whose declaring type is unresolved. Signatures compare type operands by name, not by build-local metadata row. Names alone are never a matching basis; a member whose signature was not decoded, or whose same-named counterpart's was not, stays unknown rather than added or removed. Matched methods also compare aligned call-site shapes and observed target declaring-type/method names; missing or unaligned call edges and target names remain unknown. These static names do not prove overload identity or runtime dispatch. Metadata tokens remain build-local coordinates bound to each artifact SHA-256 and MVID, and the tuple digest does not itself remap them.",
				kind: "application",
				inputSchema: compareManagedMembersInputSchema,
				outputSchema: comparisonOutputSchema$1,
				examples: [{
					title: "Compare two managed member observations",
					input: {
						left: MANAGED_MEMBER_COMPARISON_EXAMPLE.left,
						right: MANAGED_MEMBER_COMPARISON_EXAMPLE.right
					}
				}]
			},
			{
				name: "verify_managed_native_boundaries",
				...toolContractMetadata("verify_managed_native_boundaries"),
				description: "Verify managed P/Invoke/native-boundary declarations against authenticated native export or function Evidence without executing managed code or translating managed metadata tokens into native addresses. The workflow preserves declaration-only, verified, inferred, contradicted, and unresolved states; a name candidate with missing managed or native module identity remains unresolved with its candidate evidence retained.",
				kind: "application",
				inputSchema: managedNativeVerificationInputSchema,
				outputSchema: nativeVerificationOutputSchema,
				examples: [{
					title: "Verify a managed P/Invoke declaration against native Evidence",
					input: {
						managed_boundaries: MANAGED_NATIVE_VERIFICATION_EXAMPLE.managed_boundaries,
						native_observations: MANAGED_NATIVE_VERIFICATION_EXAMPLE.native_observations
					}
				}]
			},
			{
				name: "import_managed_reconstruction",
				...toolContractMetadata("import_managed_reconstruction"),
				description: "Import decompiler-produced managed reconstruction against authenticated inspect_managed_members Evidence. The workflow locks each method to artifact SHA-256, MVID, metadata token, signature hash, and the limited decoded-IL tuple hash, records the decompiler identity and options, and marks C# or pseudocode as analyst inference rather than canonical byte observation.",
				kind: "application",
				inputSchema: managedReconstructionImportInputSchema,
				outputSchema: reconstructionOutputSchema,
				examples: [{
					title: "Import a decompiler reconstruction for one managed method",
					input: {
						static_members: MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE.static_members,
						decompiler: MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE.decompiler,
						methods: MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE.methods,
						notes: MANAGED_RECONSTRUCTION_IMPORT_EXAMPLE.notes
					}
				}]
			},
			{
				name: "project_managed_application_graph",
				...toolContractMetadata("project_managed_application_graph"),
				description: "Project authenticated managed artifact, member, and native-boundary Evidence into the provider-neutral application graph without executing managed code, loading assemblies, or translating managed metadata tokens to native addresses. The graph preserves managed static observations as managed-specific nodes linked to source Evidence, with in-module calls and field-access edges; other call and field-access sites are counted in limitations.",
				kind: "application",
				inputSchema: managedApplicationGraphReferenceInputSchema,
				outputSchema: managedApplicationGraphOutputSchema,
				examples: [{
					title: "Project static managed observations into an application graph",
					input: { managed_members: MANAGED_APPLICATION_GRAPH_EXAMPLE.managed_members }
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/browserScenarioToolContracts.js
var example, BROWSER_SCENARIO_TOOL_CONTRACTS;
function init_browserScenarioToolContracts() {
	return (init_browserScenarioToolContracts = __esmMin((() => {
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_browserScenario();
		init_browserScenarioCapture();
		example = {
			browser: {
				mode: "launch",
				executable_path: "/opt/chromium/chrome"
			},
			start_url: {
				url: "https://app.example.test/",
				query: []
			},
			actions: [{
				step_id: "settle",
				action: "wait_for_timeout",
				duration_ms: 250
			}]
		};
		BROWSER_SCENARIO_TOOL_CONTRACTS = [{
			name: "capture_browser_scenario",
			...toolContractMetadata("capture_browser_scenario"),
			description: "Run a controlled browser scenario when passive observation cannot exercise the application. Launch the selected executable or connect to a loopback CDP target, provide a start URL and actions, and select storage or artifacts when needed. A request action sends one HTTP request to the start origin through the page's own fetch, with header values from secrets, page cookies or local storage; write methods change application state. Environment, empty storage, a URL-only final capture, and measured event-retention budgets are defaults. capture.network selects request_body, response_body, and header_values independently; capture.limits lets callers raise or lower the event count, retained-allocation estimates, network transaction count, and network content budgets. Selected content is returned inline with transaction and event references, byte digests, and explicit unavailable states. Budget omissions identify affected event kinds and network transactions. Credentials and declared secrets are redacted. Agents can run their own local fixture servers to control application responses. Actions run until completion or cancellation unless timeout_ms is set. Results are returned inline.",
			kind: "browser-provider",
			inputSchema: browserScenarioInputSchema,
			outputSchema: evidenceResultOf(browserScenarioCaptureSchema),
			examples: [{
				title: "Capture a deterministic browser scenario",
				input: example
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/browserToolContracts.js
function exampleScreenshot() {
	return {
		sha256: "cdb30873bdf16770bfea1fe86e44db7476e504c2dca1542b0660b20f47f523a7",
		bytes: 70,
		media_type: "image/png",
		data_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
	};
}
var listOutputSchema$1, inspectionOutputSchema$1, analyzeWebBundleRequestSchema, bundleOutputSchema, observationSessionOutputSchema, webMcpOutputSchema, captureDiffOutputSchema, screenshotOutputSchema, screenshotDiffOutputSchema, endpoint$2, origin, scenarioUrl, scenarioCompleteness, scenarioArtifacts, exampleScenarioCapture, BROWSER_TOOL_CONTRACTS;
function init_browserToolContracts() {
	return (init_browserToolContracts = __esmMin((() => {
		init_javascriptRoutesView();
		init_analysisView();
		init_browserObservation();
		init_browserObservationSchemas();
		init_webBundleAnalysis();
		init_browserSession();
		init_webMcpDiscovery();
		init_browserCaptureComparison();
		init_browserScenarioCaptureLimits();
		init_webScreenshot();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		listOutputSchema$1 = evidenceResultOf(browserTargetListSchema);
		inspectionOutputSchema$1 = evidenceResultOf(webPageInspectionSchema);
		analyzeWebBundleRequestSchema = z.discriminatedUnion("detail", [analyzeWebBundleInputSchema.extend(javaScriptRoutesCompleteDeliveryShape), analyzeWebBundleInputSchema.extend(webRoutesSummaryDeliveryShape)]).meta({ "x-rea-root-discriminator": "detail" });
		bundleOutputSchema = evidenceResultOf(z.union([webBundleAnalysisSchema, javaScriptRoutesViewResultSchema]));
		observationSessionOutputSchema = evidenceResultOf(webObservationSessionSchema);
		webMcpOutputSchema = evidenceResultOf(webMcpDiscoverySchema);
		captureDiffOutputSchema = evidenceResultOf(browserCaptureComparisonSchema);
		screenshotOutputSchema = evidenceResultOf(webScreenshotSchema);
		screenshotDiffOutputSchema = evidenceResultOf(webScreenshotDiffSchema);
		endpoint$2 = "http://127.0.0.1:9222";
		origin = "https://app.example.test";
		scenarioUrl = {
			url: `${origin}/`,
			origin,
			query_parameter_names: [],
			redacted: false
		};
		scenarioCompleteness = {
			status: "complete",
			equality_eligible: true,
			missing_sections: [],
			truncated_sections: []
		};
		scenarioArtifacts = {
			screenshot: { state: "not_requested" },
			dom: { state: "not_requested" },
			accessibility: { state: "not_requested" },
			url: { state: "not_requested" },
			history: { state: "not_requested" },
			storage: { state: "not_requested" }
		};
		exampleScenarioCapture = () => ({
			browser: {
				mode: "connect",
				process_ownership: "external",
				cleanup: "disconnected-external",
				product: "Chromium",
				version: "149"
			},
			scenario: {
				start_origin: origin,
				action_count: 1,
				secret_references: [],
				network_content: {
					request_body: false,
					response_body: false,
					header_values: false
				},
				event_families: [],
				limits: DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS
			},
			duration_ms: 10,
			steps: [{
				step_index: 0,
				step_id: "scenario_start",
				action: "scenario_start",
				status: "completed",
				elapsed_ms: 0,
				before_url: scenarioUrl,
				after_url: scenarioUrl,
				error: null,
				event_sequence_start: 1,
				event_sequence_end: 0,
				artifacts: scenarioArtifacts,
				completeness: scenarioCompleteness
			}, {
				step_index: 1,
				step_id: "open-settings",
				action: "click",
				status: "completed",
				elapsed_ms: 10,
				before_url: scenarioUrl,
				after_url: scenarioUrl,
				error: null,
				event_sequence_start: 1,
				event_sequence_end: 0,
				artifacts: scenarioArtifacts,
				completeness: scenarioCompleteness
			}],
			events: {
				retained: 0,
				dropped: 0,
				items: [],
				omissions: {
					by_kind: [],
					network_transactions: [],
					network_transaction_range: null
				}
			},
			completeness: {
				status: "incomplete",
				equality_eligible: false,
				missing_sections: ["events"],
				truncated_sections: []
			},
			limitations: [
				"CDP attachment cannot recover pre-attach events or guarantee launch-time context options.",
				"Attached locale en-US applies to Intl formatting only; navigator.language(s) and Accept-Language remain caller-controlled. Use launch mode for matching page and request languages.",
				"Detaching a CDP page session may clear caller-owned navigator.platform emulation. REA cannot snapshot the caller's complete user-agent/client-hint state before attachment; use launch mode to avoid mutating that external browser."
			]
		});
		BROWSER_TOOL_CONTRACTS = [
			{
				name: "list_browser_targets",
				...toolContractMetadata("list_browser_targets"),
				description: "List page targets exposed by the selected loopback Chrome DevTools Protocol endpoint. Optionally filter by exact origin. URLs preserve query values and fragments; only URL userinfo credentials are removed. HTTP discovery and browser-socket discovery use the fixed 10-second discovery deadline, then the socket closes without a later command. This operation accepts no command_timeout_ms; that listing deadline has no runtime override.",
				kind: "browser-provider",
				inputSchema: listBrowserTargetsInputSchema,
				outputSchema: listOutputSchema$1,
				examples: [{
					title: "List browser page targets",
					input: { cdp_endpoint: endpoint$2 }
				}]
			},
			{
				name: "inspect_web_page",
				...toolContractMetadata("inspect_web_page"),
				description: "Passively inspect one selected page target through CDP without evaluating JavaScript, navigating, clicking, closing, or mutating the page. If no origin filter is supplied, capture is scoped to the target's current origin. Returns DOM structure, accessibility, scripts, resources, attach-window network and console metadata, workers, and redacted storage inventory as Evidence.",
				kind: "browser-provider",
				inputSchema: inspectWebPageInputSchema,
				outputSchema: inspectionOutputSchema$1,
				examples: [{
					title: "Inspect one browser page",
					input: {
						cdp_endpoint: endpoint$2,
						target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS"
					}
				}]
			},
			{
				name: "analyze_web_bundle",
				...toolContractMetadata("analyze_web_bundle"),
				description: "Capture JavaScript source from one selected CDP page and statically derive a chunk graph, route and endpoint candidates, vendor fingerprints, page-declared WebMCP metadata, and optionally fetch source maps from the selected target origin or explicitly requested origins. JavaScript is parsed but never executed. Select detail summary and an explicit javascript-routes view for filtered route patterns, occurrences, sources, unknowns or summary counts; complete Evidence remains retained for later views. Static candidates do not establish reachability or a complete application route denominator.",
				kind: "browser-provider",
				inputSchema: analyzeWebBundleRequestSchema,
				outputSchema: bundleOutputSchema,
				examples: [{
					title: "Analyze a page bundle",
					input: {
						cdp_endpoint: endpoint$2,
						target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS",
						observation_ms: 500,
						include_accessibility_text: false,
						include_script_sources: true,
						include_storage_keys: false,
						fetch_source_maps: false
					}
				}]
			},
			{
				name: "observe_web_session",
				...toolContractMetadata("observe_web_session"),
				description: "Arm a CDP observation window of the requested duration while the user operates the page. By default it follows the selected target's current origin; an explicit origin list controls which origins may be retained. Records navigation, redirect, lifecycle, and failure events.",
				kind: "browser-provider",
				inputSchema: observeWebSessionInputSchema,
				outputSchema: observationSessionOutputSchema,
				examples: [{
					title: "Observe one external user action",
					input: {
						cdp_endpoint: endpoint$2,
						target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS",
						observation_ms: 1e4
					}
				}]
			},
			{
				name: "discover_webmcp_tools",
				...toolContractMetadata("discover_webmcp_tools"),
				description: "Passively inventory every page-registered WebMCP tool and its complete structural input-schema summary using the experimental CDP WebMCP domain. Metadata is page-declared-untrusted; REA never registers or invokes discovered tools.",
				kind: "browser-provider",
				inputSchema: discoverWebMcpToolsInputSchema,
				outputSchema: webMcpOutputSchema,
				examples: [{
					title: "Discover current WebMCP declarations",
					input: {
						cdp_endpoint: endpoint$2,
						target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS",
						observation_ms: 100
					}
				}]
			},
			{
				name: "compare_web_captures",
				...toolContractMetadata("compare_web_captures"),
				description: "Compare passive web captures by providing before and after, each with the complete inspect_web_page normalized_result in inspection and an optional complete discover_webmcp_tools normalized_result in webmcp; or compare recorded scenarios by passing complete capture_browser_scenario normalized_result objects in before_scenario and after_scenario with an optional normalization policy. Use exactly one input group. Network comparison includes observed HTTP requests and WebSocket frame streams; same-URL connections are compared as an unordered collection of ordered streams, retaining connection counts without claiming stable identity between individual connections. Scenario comparison aligns exact step IDs, records deterministic literal normalization, and returns every artifact-level difference plus alignment failures inline. Missing or truncated evidence never proves equality.",
				kind: "browser-provider",
				inputSchema: browserCaptureComparisonInputSchema,
				outputSchema: captureDiffOutputSchema,
				examples: [{
					title: "Compare two recorded browser scenarios",
					input: {
						before_scenario: exampleScenarioCapture(),
						after_scenario: exampleScenarioCapture(),
						normalization: { rules: [{
							rule_id: "volatile-build-id",
							artifacts: ["dom", "accessibility"],
							match: "build-123",
							replacement: "[BUILD_ID]"
						}] }
					}
				}]
			},
			{
				name: "capture_web_screenshot",
				...toolContractMetadata("capture_web_screenshot"),
				description: "Capture the current visible viewport of one configured page as an inline, content-addressed PNG artifact. The operation never scrolls, navigates, or evaluates page JavaScript.",
				kind: "browser-provider",
				inputSchema: captureWebScreenshotInputSchema,
				outputSchema: screenshotOutputSchema,
				examples: [{
					title: "Capture a viewport",
					input: {
						cdp_endpoint: endpoint$2,
						target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS"
					}
				}]
			},
			{
				name: "compare_web_screenshots",
				...toolContractMetadata("compare_web_screenshots"),
				description: "Compare two self-verifying PNG screenshot artifacts with local pixel metrics. Returns exact changed-pixel ratios and channel deltas without OCR or external services.",
				kind: "browser-provider",
				inputSchema: compareWebScreenshotsInputSchema,
				outputSchema: screenshotDiffOutputSchema,
				examples: [{
					title: "Compare two screenshot artifacts",
					input: {
						before: exampleScreenshot(),
						after: exampleScreenshot(),
						channel_threshold: 0
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/browserProviderToolContracts.js
var BROWSER_PROVIDER_TOOL_CONTRACTS;
function init_browserProviderToolContracts() {
	return (init_browserProviderToolContracts = __esmMin((() => {
		init_browserScenarioToolContracts();
		init_browserToolContracts();
		BROWSER_PROVIDER_TOOL_CONTRACTS = [...BROWSER_TOOL_CONTRACTS, ...BROWSER_SCENARIO_TOOL_CONTRACTS];
	})))();
}

//#endregion
//#region dist/contracts/javascript/javascriptRuntimeReconciliationExample.js
function browserCompleteness() {
	return {
		status: "complete_within_window",
		conditions: ["complete_within_window"],
		policy_filtered_sections: [],
		attach_limited_sections: [],
		truncated_sections: [],
		unavailable_sections: [],
		excluded: [],
		dropped_events: {
			scripts: 0,
			network_requests: 0,
			console_events: 0,
			websocket_connections: 0,
			websocket_frames: 0,
			webmcp_tools: 0,
			timeline_events: 0,
			total: 0
		}
	};
}
var applicationSha256, script, inputPath, scriptPath, completeCoverage, graphEvidence, asset, graph, evidenceContexts, semanticNode, semanticGraph, JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE, runtimeEvidence, JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE;
function init_javascriptRuntimeReconciliationExample() {
	return (init_javascriptRuntimeReconciliationExample = __esmMin((() => {
		init_evidence();
		init_javascriptApplicationGraph();
		init_webContentArtifact();
		init_javascriptSemanticGraph();
		init_javascriptSemanticGraphSchemas();
		applicationSha256 = "1".repeat(64);
		script = createWebTextArtifact("export const example = true;\n", "text/javascript");
		inputPath = "/Applications/Example.app/Contents/Resources/app";
		scriptPath = `${inputPath}/renderer.js`;
		completeCoverage = {
			status: "complete",
			truncated: false,
			omitted_count: 0,
			limits: []
		};
		graphEvidence = {
			authority: "artifact-bytes",
			state: "observed",
			confidence: "exact",
			artifact: {
				available: true,
				artifact_id: `art_${script.sha256}`,
				sha256: script.sha256
			},
			location: {
				available: true,
				value: {
					kind: "artifact-path",
					path: "renderer.js"
				}
			},
			extractor: {
				name: "rea-javascript-application",
				version: "1",
				operation: "inventory-relevant-file",
				executable_sha256: null
			},
			coverage: completeCoverage,
			limitations: [],
			evidence_ids: []
		};
		asset = createJavaScriptApplicationNode({
			kind: "javascript-asset",
			identity: {
				strategy: "content-digest",
				stability: "global-exact",
				sha256: script.sha256
			},
			observations: [{
				label: "renderer.js",
				properties: {
					path: "renderer.js",
					bytes: script.bytes
				},
				evidence: graphEvidence
			}]
		});
		graph = createJavaScriptApplicationGraph({
			schema: "JavaScriptApplicationGraph",
			root_node_ids: [asset.node_id],
			nodes: [asset],
			edges: [],
			coverage: completeCoverage,
			limitations: []
		});
		evidenceContexts = new JavaScriptSemanticEvidenceContextRegistry();
		semanticNode = createJavaScriptSemanticGraphNode({
			kind: "module",
			identity: {
				artifact_sha256: applicationSha256,
				module_path: "renderer.js",
				source_range: null,
				role_key: "example-module"
			},
			function_node_id: null,
			application_node_ids: [asset.node_id],
			label: "renderer.js",
			properties: {},
			evidence: graphEvidence
		}, evidenceContexts);
		semanticGraph = createJavaScriptSemanticGraph({
			schema: "JavaScriptSemanticRelationGraph",
			root_artifact_sha256: applicationSha256,
			application_graph_id: graph.graph_id,
			root_node_ids: [semanticNode.node_id],
			evidence_contexts: evidenceContexts.contexts,
			nodes: [semanticNode],
			relations: [],
			fingerprints: [],
			unknowns: [],
			coverage: {
				status: "unknown",
				truncated: false,
				omitted_nodes: 0,
				omitted_relations: 0,
				limits: [],
				families: JAVASCRIPT_SEMANTIC_RELATION_FAMILIES.map((family) => ({
					family,
					status: "unknown",
					retained_relations: 0,
					omitted_relations: 0,
					unknown_ids: []
				}))
			},
			limitations: ["Semantic relations are unavailable in this minimal example."]
		});
		JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE = createEvidence({
			path: inputPath,
			sha256: applicationSha256,
			format: "directory"
		}, {
			id: "rea-javascript-application",
			name: "REA JavaScript application analyzer",
			version: "1"
		}, {
			predicateType: "rea.javascript-application-analysis",
			operation: "analyze_javascript_application",
			parameters: {},
			result: {
				input_path: inputPath,
				format: "directory",
				root_artifact_sha256: applicationSha256,
				inventory_manifest_id: `agm_${"2".repeat(64)}`,
				inventory_graph_sha256: "3".repeat(64),
				integrity_contradictions: [],
				graph,
				semantic_graph: semanticGraph,
				summary: {
					browser_windows: 0,
					explicit_web_preferences: 0,
					preload_entrypoints: 0,
					context_bridge_apis: 0,
					exposed_api_members: 0,
					ipc: {
						operations: 0,
						literal_channels: 0,
						dynamic_channel_operations: 0,
						renderer_transmissions: 0,
						renderer_listeners: 0,
						main_handlers: 0,
						paired_renderer_transmissions: 0,
						ambiguous_renderer_transmissions: 0,
						unpaired_literal_renderer_transmissions: 0
					},
					sender_validation_observations: 0,
					utility_processes: 0,
					resolved_utility_entrypoints: 0,
					native_addon_bindings: 0,
					resolved_native_addon_bindings: 0
				},
				statistics: {
					relevant_files: 1,
					nested_asar_containers: 0,
					text_bytes_read: script.bytes,
					invalid_utf8_files: 0,
					parsed_javascript_files: 1,
					skipped_javascript_files: 0,
					visited_ast_nodes: 7,
					findings: 1,
					modules: 0,
					parse_failures: 0
				},
				limitations: []
			},
			confidence: "derived",
			authority: "shipped-artifact"
		});
		runtimeEvidence = createEvidence(undefined, {
			id: "rea-cdp-electron",
			name: "REA Electron file-page CDP observation provider",
			version: "1"
		}, {
			predicateType: "rea.electron-page-inspection",
			operation: "inspect_electron_page",
			parameters: {
				cdp_endpoint: "http://127.0.0.1:9223",
				target_id: "example-target",
				include_script_sources: true
			},
			result: {
				browser: {
					product: "Electron/example",
					protocol_version: "1.3",
					revision: "example",
					user_agent: "Electron example",
					js_version: "1"
				},
				target: {
					target_id: "example-target",
					type: "page",
					title: "Example",
					file_path: `${inputPath}/index.html`,
					attached: false
				},
				capture_window: {
					started_at: "2026-07-15T00:00:00.000Z",
					ended_at: "2026-07-15T00:00:00.100Z",
					observation_ms: 100
				},
				completeness: browserCompleteness(),
				frames: [],
				dom: {
					total_nodes: 0,
					nodes: []
				},
				scripts: {
					total: 1,
					items: [{
						script_key: `electron_script_${"4".repeat(64)}`,
						frame_id: null,
						file_path: scriptPath,
						cdp_hash: "example",
						length: script.bytes,
						is_module: true,
						language: "JavaScript",
						source: {
							included: true,
							artifact: script
						}
					}]
				},
				resources: [],
				workers: [],
				limitations: ["Example passive capture."]
			},
			confidence: "observed",
			authority: "external-service"
		});
		JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE = {
			static_layers: [{ analysis: JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE }],
			runtime_observations: [runtimeEvidence]
		};
	})))();
}

//#endregion
//#region dist/contracts/javascript/electronToolContracts.js
var listOutputSchema, inspectionOutputSchema, javascriptApplicationMcpInputSchema, analyzeJavaScriptApplicationRequestSchema, applicationOutputSchema, reconciliationOutputSchema, endpoint$1, activeExample, ELECTRON_TOOL_CONTRACTS;
function init_electronToolContracts() {
	return (init_electronToolContracts = __esmMin((() => {
		init_localPath();
		init_toolEffects();
		init_toolOutputSchemaGroups();
		init_toolOutputSchemaPrimitives();
		init_electronFuses();
		init_electronObservation();
		init_electronActiveObservation();
		init_javascriptRoutesView();
		init_analysisView();
		init_analysisDetail();
		init_javascriptApplicationAnalysis();
		init_javascriptRuntimeReconciliationSchemas();
		init_javascriptRuntimeReconciliationExample();
		listOutputSchema = evidenceResultOf(electronTargetListSchema);
		inspectionOutputSchema = evidenceResultOf(electronPageInspectionSchema);
		javascriptApplicationMcpInputSchema = analyzeJavaScriptApplicationInputSchema.extend({ input_path: absoluteLocalPathStringSchema.describe("Absolute path to the JavaScript application on the machine running REA.") });
		analyzeJavaScriptApplicationRequestSchema = z.discriminatedUnion("detail", [javascriptApplicationMcpInputSchema.extend(javaScriptRoutesCompleteDeliveryShape), javascriptApplicationMcpInputSchema.extend(javaScriptRoutesSummaryDeliveryShape)]).meta({ "x-rea-root-discriminator": "detail" });
		applicationOutputSchema = analysisDetailOutputSchemaOf(javascriptApplicationAnalysisResultSchema, z.union([javascriptApplicationSummaryViewResultSchema, javaScriptRoutesViewResultSchema]));
		reconciliationOutputSchema = evidenceResultOf(javascriptRuntimeReconciliationResultSchema);
		endpoint$1 = "http://127.0.0.1:9223";
		activeExample = {
			executable_path: "/Applications/Electron.app/Contents/MacOS/Electron",
			application_path: "/Applications/Example.app/Contents/Resources/main.js",
			args: [],
			actions: [{
				step_id: "exercise-ipc",
				kind: "click",
				selector: "#run"
			}]
		};
		ELECTRON_TOOL_CONTRACTS = [
			{
				name: "list_electron_targets",
				...toolContractMetadata("list_electron_targets"),
				description: "List every Electron file:// page target from a selected loopback CDP endpoint. Local file paths are canonicalized after symlink resolution. Selecting an endpoint exposes every eligible target and its local path metadata.",
				kind: "electron-provider",
				inputSchema: listElectronTargetsInputSchema,
				outputSchema: listOutputSchema,
				examples: [{
					title: "List Electron file pages",
					input: { cdp_endpoint: endpoint$1 }
				}]
			},
			{
				name: "inspect_electron_page",
				...toolContractMetadata("inspect_electron_page"),
				description: "Passively inspect one Electron file page by supplying its loopback CDP endpoint and target ID. The provider rechecks that the target currently exists at that endpoint and is a local file page. Returns frames, DOM structure, resource paths, and scripts without evaluating renderer JavaScript or invoking Electron APIs. The selected endpoint exposes every local file page and its metadata to this tool.",
				kind: "electron-provider",
				inputSchema: inspectElectronPageInputSchema,
				outputSchema: inspectionOutputSchema,
				examples: [{
					title: "Inspect an Electron page",
					input: {
						cdp_endpoint: endpoint$1,
						target_id: "TARGET_ID_FROM_LIST_ELECTRON_TARGETS"
					}
				}]
			},
			{
				name: "analyze_javascript_application",
				...toolContractMetadata("analyze_javascript_application"),
				description: "Reconstruct one local ASAR or extracted JavaScript application as an inline application graph without executing it. Returns recovered graph nodes, edges, semantic relations, integrity contradictions, limitations, and coverage. Select source_paths to acquire and analyze only exact inventoried file paths; the complete artifact inventory and identity remain intact, and unselected sources remain explicit unknowns. Dependencies are not implicitly analyzed. Select detail summary to retain the complete analysis Evidence in this session and receive only its summary view, then inspect selected modules or pages with inspect_analysis_view. Select a javascript-routes view with summary detail to query deduplicated static patterns, source-linked occurrences, source status or interpretation gaps with filters, fields and paging. Static routes do not establish reachability or the full application route set. Summary detail reduces delivery, whereas source_paths bounds source analysis. Integrity mismatches fail by default; record-and-continue retains observed bytes as untrusted and marks graph coverage partial. Timeout recovery: returned provider_timeout uses the per-source analysis_timeout_ms budget. A host-only 'timed out awaiting tools/call' needs a longer client tool deadline, not a larger analysis_timeout_ms. Never repeat the unchanged call to test whether that timeout persists; report the host setting if configuration is not editable (Codex: mcp_servers.<server>.tool_timeout_sec, seconds).",
				kind: "electron-provider",
				inputSchema: analyzeJavaScriptApplicationRequestSchema,
				outputSchema: applicationOutputSchema,
				examples: [
					{
						title: "Analyze one local JavaScript application",
						input: {
							input_path: "/Applications/Example.app/Contents/Resources/app.asar",
							format: "auto",
							integrity_policy: "fail"
						}
					},
					{
						title: "Analyze selected entry sources before unrelated vendor files",
						input: {
							input_path: "/Applications/Example.app/Contents/Resources/app.asar",
							source_paths: [
								"package.json",
								"main.js",
								"preload.js"
							],
							detail: "summary"
						}
					},
					{
						title: "Retain the complete analysis and return its summary view",
						input: {
							input_path: "/Applications/Example.app/Contents/Resources/app.asar",
							detail: "summary"
						}
					}
				]
			},
			{
				name: "reconcile_javascript_runtime",
				...toolContractMetadata("reconcile_javascript_runtime"),
				description: "Reconcile verified static JavaScript application graphs with existing passive web/Electron CDP, passive V8 Inspector, or provider-owned active Electron Evidence. Active Electron captures contribute an explicitly partial target-only runtime record; they never invent renderer scripts, frames, workers, or execution claims. Exact captured-source digests take priority over caller-declared file/URL mappings; target, frame, script, and worker ambiguity remains explicit, and source-map authority stays separate.",
				kind: "electron-provider",
				inputSchema: reconcileJavaScriptRuntimeInputSchema,
				outputSchema: reconciliationOutputSchema,
				examples: [{
					title: "Reconcile one passive Electron capture",
					input: JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE
				}]
			},
			{
				name: "capture_electron_scenario",
				...toolContractMetadata("capture_electron_scenario"),
				description: "Use this for a provider-owned Electron run when passive CDP or Inspector observation cannot exercise application behavior. REA owns startup and teardown, accepts caller-defined click/wait actions plus window-targeted renderer reload/crash and synthetic open-url/second-instance delivery, and returns correlated window/WebContents/process/preload/session/navigation/shell/IPC evidence without retaining payload values. Actions wait for completion or request cancellation; a missing click target can keep the request pending. Results identify observed and unavailable event families, coverage status, action targets, and truncation. Cleanup failures retain collected observations with explicit cleanup uncertainty. External shell, navigation, permission, download, popup, updater, and OS-integration effects are blocked and recorded. Use passive Electron tools for observation-only work.",
				kind: "electron-provider",
				inputSchema: electronActiveObservationInputSchema,
				outputSchema: evidenceResultOf(electronActiveObservationResultSchema),
				examples: [{
					title: "Exercise an owned Electron application",
					input: activeExample
				}]
			},
			{
				name: "inspect_electron_fuses",
				...toolContractMetadata("inspect_electron_fuses"),
				kind: "artifact-provider",
				requiresActiveTarget: true,
				description: "Inspect packaged Electron fuse bytes in one local macOS app bundle, Electron Framework binary, Windows PE executable, or Linux ELF executable. Returns the artifact digest, per-slice wire version, fuse index, version-1 name, state, and raw byte, plus derived implications for Inspector flags, ELECTRON_RUN_AS_NODE, embedded ASAR integrity, and app.asar-only loading. A missing sentinel is unknown fuse state. Reads artifact bytes only and does not modify the selected file or open a runtime target.",
				inputSchema: inspectElectronFusesInputSchema,
				outputSchema: electronFuseOutputSchemas.inspect_electron_fuses,
				examples: [{
					title: "Read packaged Electron fuse state",
					input: { path: "/Applications/Example.app" }
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/javascript/javascriptRuntimeObservationToolContracts.js
var endpoint, JAVASCRIPT_RUNTIME_OBSERVATION_TOOL_CONTRACTS;
function init_javascriptRuntimeObservationToolContracts() {
	return (init_javascriptRuntimeObservationToolContracts = __esmMin((() => {
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_javascriptRuntimeObservation();
		endpoint = "http://127.0.0.1:9229";
		JAVASCRIPT_RUNTIME_OBSERVATION_TOOL_CONTRACTS = [{
			name: "list_javascript_runtime_targets",
			...toolContractMetadata("list_javascript_runtime_targets"),
			description: "List every eligible Node/Electron V8 Inspector target from an explicit literal-loopback endpoint. Node discovery file locations that cannot be verified are preserved as unresolved reported URLs; they do not prove filesystem identity. Listing does not attach to targets.",
			kind: "runtime-provider",
			inputSchema: listJavaScriptRuntimeTargetsInputSchema,
			outputSchema: evidenceResultOf(javascriptRuntimeTargetListSchema),
			examples: [{
				title: "List Node Inspector targets",
				input: { inspector_endpoint: endpoint }
			}]
		}, {
			name: "observe_javascript_runtime",
			...toolContractMetadata("observe_javascript_runtime"),
			description: "Attach passively to one Node/Electron V8 Inspector target by supplying its loopback Inspector endpoint and target ID. The provider rechecks target presence and attachability; a Node discovery file location may remain unresolved. Loaded script locations are validated independently from Debugger.scriptParsed. Authorized file script items retain their exact Inspector URL in optional reported_url separately from verified location.file_path, and query/fragment variants remain distinct script identities. Valid Debugger.scriptFailedToParse events are counted at scripts.parse_failed_total separately from malformed protocol values. Captures script and Runtime execution-context metadata. REA never evaluates, pauses, resumes, reads source, or instruments the target; require/import edges, EventEmitter activity, and Electron IPC remain explicit unknowns. Reconcile the result with static Application Graph Evidence using reconcile_javascript_runtime. The selected endpoint exposes every target it serves to this tool.",
			kind: "runtime-provider",
			inputSchema: observeJavaScriptRuntimeInputSchema,
			outputSchema: evidenceResultOf(javascriptRuntimeObservationSchema),
			examples: [{
				title: "Observe one Node runtime",
				input: {
					inspector_endpoint: endpoint,
					target_id: "TARGET_ID_FROM_LIST_JAVASCRIPT_RUNTIME_TARGETS"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/javascript/javascriptApplicationWorkflowExamples.js
var reconciliationInput, reconciliation, reconciliationEvidence, TRACE_SEED, JAVASCRIPT_FEATURE_TRACE_EXAMPLE, JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE, SOURCE_TO_BUNDLE_COMPARISON_EXAMPLE;
function init_javascriptApplicationWorkflowExamples() {
	return (init_javascriptApplicationWorkflowExamples = __esmMin((() => {
		init_evidence();
		init_javascriptRuntimeReconciliation();
		init_javascriptRuntimeReconciliationExample();
		init_referenceSourceGraph();
		init_javascriptRuntimeReconciliationSchemas();
		reconciliationInput = readRuntimeReconciliationInput(reconcileJavaScriptRuntimeInputSchema.parse(JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE));
		if (!reconciliationInput.ok) throw new Error("The JavaScript runtime reconciliation contract example is invalid", { cause: reconciliationInput.error });
		reconciliation = reconcileJavaScriptRuntime(reconciliationInput.value);
		reconciliationEvidence = createEvidence(undefined, {
			id: "rea-javascript-runtime-reconciliation",
			name: "REA JavaScript runtime reconciliation",
			version: "1"
		}, {
			predicateType: "rea.javascript-runtime-reconciliation",
			operation: "reconcile_javascript_runtime",
			parameters: {
				static_layers: JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE.static_layers.map(({ analysis }) => ({
					role: "application",
					evidence_id: analysis.evidence_id,
					runtime_mappings: []
				})),
				runtime_evidence_ids: JAVASCRIPT_RUNTIME_RECONCILIATION_EXAMPLE.runtime_observations.map(({ evidence_id: id }) => id)
			},
			result: reconciliation,
			confidence: "inferred",
			authority: "analyst-inference",
			limitations: reconciliation.limitations,
			evidenceLinks: reconciliation.evidence_links
		});
		TRACE_SEED = {
			kind: "module",
			value: "renderer.js",
			match: "exact",
			case_sensitive: false
		};
		JAVASCRIPT_FEATURE_TRACE_EXAMPLE = {
			application: JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE,
			seed: TRACE_SEED,
			direction: "both"
		};
		JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE = {
			left: JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE,
			right: reconciliationEvidence
		};
		SOURCE_TO_BUNDLE_COMPARISON_EXAMPLE = {
			reference: createHistoricalSourceGraph({
				schema: "HistoricalSourceGraph",
				authority: "historical-reference",
				root_alias: "$REFERENCE_ROOT",
				inventory_state: "complete",
				entries: [{
					path: "src",
					kind: "directory",
					classifications: ["source"],
					tree_state: "enumerated",
					limitations: []
				}, {
					path: "src/main.ts",
					kind: "file",
					sha256: "2".repeat(64),
					size: 128,
					language: "TypeScript",
					classifications: ["source"],
					content_state: "hashed",
					limitations: []
				}],
				relationships: [],
				parse_failures: [],
				exclusions: [],
				languages: ["TypeScript"],
				manifests: [],
				vcs: {
					kind: "none",
					head: null,
					dirty: null
				},
				provenance: {
					importer: "rea",
					importer_version: "1",
					caller: "contract-example"
				},
				limitations: []
			}),
			application: JAVASCRIPT_APPLICATION_EVIDENCE_EXAMPLE
		};
	})))();
}

//#endregion
//#region dist/contracts/javascript/javascriptExportShapeComparisonExample.js
var captures, summary, statistics, modulePath, limitations, exampleEvidence, JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE;
function init_javascriptExportShapeComparisonExample() {
	return (init_javascriptExportShapeComparisonExample = __esmMin((() => {
		init_evidence();
		init_webContentArtifact();
		init_javascriptSemanticAnalysis();
		init_javascriptExportReturnShapeProjection();
		init_javascriptApplicationEvidenceSchemas();
		init_javascriptApplicationGraph();
		init_javascriptSemanticGraph();
		init_javascriptSemanticGraphSchemas();
		init_javascriptApplicationAnalysis();
		captures = {
			count: {
				input_path: "/examples/javascript-export-presence/left",
				root_artifact_sha256: "5005ebc2f35719a2fc014f19a81c669f3a1ab471b7245ef6985a111b6845a747",
				inventory_manifest_id: "agm_f30ded9a83d43a3980417bbe63dfad569e83386f243c4d6a01af0166372cb9e6",
				inventory_graph_sha256: "4b8aceaf67e43fd8317ec1f5fd1df5235f8fa402335accf011683e008c6bc62c",
				integrity_contradictions: []
			},
			total: {
				input_path: "/examples/javascript-export-presence/right",
				root_artifact_sha256: "269ae72a601ad5ac02f1c2dda6ff9accffa2d2e4f4a9e406facee0d5a78a5377",
				inventory_manifest_id: "agm_d3ceaa1af38fb3474070ca25c0d4644282e5fb7d5824cee3e3a81391481e9fc1",
				inventory_graph_sha256: "3e9bc926951480c35385efe5650d9d781631bd74c37a523d543b5fbe06b01ce6",
				integrity_contradictions: []
			}
		};
		summary = {
			browser_windows: 0,
			explicit_web_preferences: 0,
			preload_entrypoints: 0,
			context_bridge_apis: 0,
			exposed_api_members: 0,
			ipc: {
				operations: 0,
				literal_channels: 0,
				dynamic_channel_operations: 0,
				renderer_transmissions: 0,
				renderer_listeners: 0,
				main_handlers: 0,
				paired_renderer_transmissions: 0,
				ambiguous_renderer_transmissions: 0,
				unpaired_literal_renderer_transmissions: 0
			},
			sender_validation_observations: 0,
			utility_processes: 0,
			resolved_utility_entrypoints: 0,
			native_addon_bindings: 0,
			resolved_native_addon_bindings: 0
		};
		statistics = {
			relevant_files: 1,
			nested_asar_containers: 0,
			text_bytes_read: 60,
			invalid_utf8_files: 0,
			parsed_javascript_files: 1,
			skipped_javascript_files: 0,
			visited_ast_nodes: 12,
			findings: 1,
			modules: 0,
			parse_failures: 0
		};
		modulePath = "parser.mjs";
		limitations = ["This example retains export and return-shape facts only; other application and semantic relationships are omitted."];
		exampleEvidence = (property) => {
			const metadata = captures[property];
			const source = `export default () => ({ kind: "results", ${property}: query() });\n`;
			const artifact = createWebTextArtifact(source, "text/javascript");
			const ir = analyzeJavaScriptSemantics(source);
			const link = ir.moduleLinks.find(({ exportedName }) => exportedName === "default");
			if (link === undefined) throw new Error("Example source must define a default export");
			const coverage = ir.coverage.status === "complete" ? completeApplicationCoverage() : partialApplicationCoverage([], ir.coverage.omittedCount);
			const projection = projectJavaScriptExportReturnShapes({
				ir,
				link,
				modulePath,
				baseCoverage: coverage
			});
			if (projection === null) throw new Error("Example export must retain return shapes");
			const evidence = {
				artifact: {
					available: true,
					artifact_id: `art_${artifact.sha256}`,
					sha256: artifact.sha256
				},
				location: {
					available: true,
					value: {
						kind: "source-range",
						source: modulePath,
						...link.location
					}
				},
				extractor: {
					name: "rea-javascript-artifact-reconstruction",
					version: "1",
					operation: "recover-module-export",
					executable_sha256: null
				},
				coverage,
				limitations: ir.limitations,
				evidence_ids: []
			};
			const exported = createJavaScriptApplicationNode({
				kind: "javascript-module",
				identity: {
					strategy: "artifact-local-key",
					stability: "artifact-version",
					artifact_sha256: artifact.sha256,
					namespace: "module-export",
					key: `${metadata.root_artifact_sha256}:${modulePath}:default`
				},
				observations: [{
					label: `${modulePath}:default`,
					properties: {
						semantic_role: "export-binding",
						module_path: modulePath,
						relationship_kind: link.kind,
						exported_name: link.exportedName,
						local_name: link.localName,
						imported_name: link.importedName,
						declared_specifier: link.specifier
					},
					evidence: {
						...evidence,
						authority: "ast-static-analysis",
						state: "observed",
						confidence: "exact"
					}
				}, {
					label: `${modulePath}:default:return-shapes`,
					properties: projection.properties,
					evidence: {
						...evidence,
						authority: "static-relationship-inference",
						state: "inferred",
						confidence: "high",
						location: {
							available: true,
							value: {
								kind: "source-range",
								source: modulePath,
								...projection.range
							}
						},
						extractor: {
							...evidence.extractor,
							operation: "recover-export-return-shapes"
						},
						coverage: projection.coverage,
						limitations: projection.limitations
					}
				}]
			});
			const graph = createJavaScriptApplicationGraph({
				schema: "JavaScriptApplicationGraph",
				root_node_ids: [exported.node_id],
				nodes: [exported],
				edges: [],
				coverage: partialApplicationCoverage([], null),
				limitations
			});
			const evidenceContexts = new JavaScriptSemanticEvidenceContextRegistry();
			const module = createJavaScriptSemanticGraphNode({
				kind: "module",
				identity: {
					artifact_sha256: artifact.sha256,
					module_path: modulePath,
					source_range: null,
					role_key: "example-module"
				},
				function_node_id: null,
				application_node_ids: [exported.node_id],
				label: modulePath,
				properties: {},
				evidence: {
					...evidence,
					authority: "ast-static-analysis",
					state: "observed",
					confidence: "exact"
				}
			}, evidenceContexts);
			const semanticGraph = createJavaScriptSemanticGraph({
				schema: "JavaScriptSemanticRelationGraph",
				root_artifact_sha256: metadata.root_artifact_sha256,
				application_graph_id: graph.graph_id,
				root_node_ids: [module.node_id],
				evidence_contexts: evidenceContexts.contexts,
				nodes: [module],
				relations: [],
				fingerprints: [],
				unknowns: [],
				coverage: {
					status: "unknown",
					truncated: false,
					omitted_nodes: null,
					omitted_relations: null,
					limits: [],
					families: JAVASCRIPT_SEMANTIC_RELATION_FAMILIES.map((family) => ({
						family,
						status: "unknown",
						retained_relations: 0,
						omitted_relations: null,
						unknown_ids: []
					}))
				},
				limitations
			});
			const result = javascriptApplicationAnalysisResultSchema.parse({
				...metadata,
				format: "directory",
				graph,
				semantic_graph: semanticGraph,
				summary,
				statistics,
				limitations
			});
			return createEvidence({
				path: result.input_path,
				sha256: result.root_artifact_sha256,
				format: "directory"
			}, {
				id: "rea-javascript-application",
				name: "REA JavaScript application analyzer",
				version: "1"
			}, {
				predicateType: "rea.javascript-application-analysis",
				operation: "analyze_javascript_application",
				parameters: {},
				result,
				confidence: "derived",
				authority: "shipped-artifact",
				limitations
			});
		};
		JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE = {
			left: exampleEvidence("count"),
			right: exampleEvidence("total"),
			left_module_path: modulePath,
			left_export_name: "default",
			right_module_path: modulePath,
			right_export_name: "default"
		};
	})))();
}

//#endregion
//#region dist/contracts/mobileApplicationGraphExamples.js
var inventory, provider, ANDROID_APPLICATION_GRAPH_EXAMPLE, APPLE_APPLICATION_GRAPH_EXAMPLE, MACOS_APPLICATION_GRAPH_EXAMPLE, HARMONY_APPLICATION_GRAPH_EXAMPLE;
function init_mobileApplicationGraphExamples() {
	return (init_mobileApplicationGraphExamples = __esmMin((() => {
		init_evidence();
		init_artifactGraph();
		init_artifactIdentity();
		inventory = (format, digit) => {
			const sha = digit.repeat(64);
			const artifactId = artifactIdForContent(sha);
			const occurrenceId = occurrenceIdForLocation({
				rootArtifactId: artifactId,
				logicalPath: ".",
				entryKind: "file"
			});
			const nodes = [{
				artifact_id: artifactId,
				format: format === "directory" ? "directory" : "zip",
				sha256: sha,
				size: 1,
				media_type: null,
				architecture: null,
				content_state: "materialized",
				limitations: []
			}];
			const occurrences = [{
				occurrence_id: occurrenceId,
				artifact_id: artifactId,
				parent_occurrence_id: null,
				logical_path: ".",
				entry_kind: "file",
				artifact_kind: "resource",
				artifact_format: format,
				declared_size: 1,
				compressed_size: null,
				executable: false,
				encrypted: false,
				hash_status: "verified",
				source_location: null,
				limitations: []
			}];
			const graphSha256 = artifactGraphDigest({
				nodes,
				occurrences,
				edges: [],
				contradictions: []
			});
			return artifactInventoryResultSchema.parse({
				manifest: {
					manifest_id: artifactManifestId(artifactId, graphSha256),
					root_artifact_id: artifactId,
					root_sha256: sha,
					root_format: format,
					graph_sha256: graphSha256,
					node_count: nodes.length,
					occurrence_count: occurrences.length,
					edge_count: 0
				},
				nodes,
				occurrences,
				edges: [],
				provenance: [],
				integrity_contradictions: [],
				coverage: {
					scope: "root",
					status: "complete"
				},
				limitations: []
			});
		};
		provider = {
			id: "rea-artifact-graph",
			name: "REA safe artifact graph provider",
			version: "1"
		};
		ANDROID_APPLICATION_GRAPH_EXAMPLE = { inventory_evidence: [createEvidence({
			path: "Fixture.apk",
			sha256: "a".repeat(64),
			format: "apk"
		}, provider, {
			operation: "inventory_artifact",
			parameters: {},
			result: inventory("apk", "a"),
			confidence: "observed",
			authority: "shipped-artifact"
		})] };
		APPLE_APPLICATION_GRAPH_EXAMPLE = { inventory_evidence: [createEvidence({
			path: "Fixture.ipa",
			sha256: "b".repeat(64),
			format: "ipa"
		}, provider, {
			operation: "inventory_artifact",
			parameters: {},
			result: inventory("ipa", "b"),
			confidence: "observed",
			authority: "shipped-artifact"
		})] };
		MACOS_APPLICATION_GRAPH_EXAMPLE = { inventory_evidence: [createEvidence({
			path: "Fixture.app",
			sha256: "c".repeat(64),
			format: "directory"
		}, provider, {
			operation: "inventory_artifact",
			parameters: {},
			result: inventory("directory", "c"),
			confidence: "observed",
			authority: "shipped-artifact"
		})] };
		HARMONY_APPLICATION_GRAPH_EXAMPLE = { inventory_evidence: [createEvidence({
			path: "Fixture.hap",
			sha256: "d".repeat(64),
			format: "hap"
		}, provider, {
			operation: "inventory_artifact",
			parameters: {},
			result: inventory("hap", "d"),
			confidence: "observed",
			authority: "shipped-artifact"
		})] };
	})))();
}

//#endregion
//#region dist/contracts/applicationToolContracts.js
var traceOutputSchema, semanticTraceOutputSchema, comparisonOutputSchema, sourceToBundleOutputSchema, exportShapeComparisonOutputSchema, reconstructionObligationLedgerOutputSchema, HASH, retained, APPLICATION_TOOL_CONTRACTS;
function init_applicationToolContracts() {
	return (init_applicationToolContracts = __esmMin((() => {
		init_mobileApplicationGraphProjection();
		init_analysisView();
		init_javascriptApplicationVersionComparisonSchemas();
		init_javascriptFeatureTraceSchemas();
		init_javascriptSemanticTraceSchemas();
		init_javascriptExportShapeComparisonSchemas();
		init_sourceToBundleComparisonSchemas();
		init_applicationWorkflowInputContracts();
		init_reconstructionCoverageInput();
		init_reconstructionCoverage();
		init_reconstructionObligationLedgerSchemas();
		init_androidApplication();
		init_appleApplication();
		init_harmonyApplication();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_javascriptApplicationWorkflowExamples();
		init_javascriptExportShapeComparisonExample();
		init_mobileApplicationGraphExamples();
		traceOutputSchema = evidenceResultOf(applicationFeatureTraceResultSchema);
		semanticTraceOutputSchema = evidenceResultOf(javaScriptSemanticTraceResultSchema);
		comparisonOutputSchema = evidenceResultOf(applicationVersionComparisonResultSchema);
		sourceToBundleOutputSchema = evidenceResultOf(z.union([
			sourceToBundleComparisonResultSchema,
			sourceToBundleSummaryViewResultSchema,
			sourceToBundlePageViewResultSchema
		]));
		exportShapeComparisonOutputSchema = evidenceResultOf(javaScriptExportShapeComparisonResultSchema);
		reconstructionObligationLedgerOutputSchema = evidenceResultOf(reconstructionObligationLedgerSchema);
		HASH = "0".repeat(64);
		retained = (evidence_id) => ({
			kind: "retained-evidence",
			evidence_id
		});
		APPLICATION_TOOL_CONTRACTS = [
			{
				name: "trace_application_feature",
				...toolContractMetadata("trace_application_feature"),
				description: "Trace a typed literal seed through every reachable part of an authenticated JavaScript Application Graph supplied as inline Evidence or exact same-session retained references. Original static, native, passive-runtime, inferred, and unknown authorities remain distinct; native addon handoffs never open a provider or execute the application.",
				kind: "application",
				inputSchema: traceApplicationFeatureRequestSchema,
				outputSchema: traceOutputSchema,
				examples: [{
					title: "Trace one module seed through a retained application graph",
					input: JAVASCRIPT_FEATURE_TRACE_EXAMPLE
				}, {
					title: "Use exact Evidence already retained in this session",
					input: {
						...JAVASCRIPT_FEATURE_TRACE_EXAMPLE,
						application: retained(JAVASCRIPT_FEATURE_TRACE_EXAMPLE.application.evidence_id)
					}
				}]
			},
			{
				name: "trace_javascript_semantics",
				...toolContractMetadata("trace_javascript_semantics"),
				description: "Trace static JavaScript data-flow, direct call/return, and closure relations from inline application Evidence or an exact same-session retained reference. Dynamic or unsupported semantics remain explicit unknowns; static reachability never claims runtime execution.",
				kind: "application",
				inputSchema: traceJavaScriptSemanticsRequestSchema,
				outputSchema: semanticTraceOutputSchema,
				examples: [{
					title: "Trace backward provenance from one semantic node",
					input: {
						application: JAVASCRIPT_FEATURE_TRACE_EXAMPLE.application,
						query: {
							seed: {
								kind: "semantic-node",
								node_id: `jsrg_node_${HASH}`
							},
							direction: "backward-provenance"
						}
					}
				}]
			},
			{
				name: "compare_application_versions",
				...toolContractMetadata("compare_application_versions"),
				description: "Compare two authenticated JavaScript Application Graph versions supplied as inline Evidence or exact same-session retained references. Uses unique-only exact digest, module source digest, source-map identity, structural fingerprint, and non-module semantic-key tiers. Reports added, removed, changed, ambiguous, and unknown entities plus the complete matching changed_from graph without fuzzy or module-ordinal pairing.",
				kind: "application",
				inputSchema: compareApplicationVersionsRequestSchema,
				outputSchema: comparisonOutputSchema,
				examples: [{
					title: "Compare authenticated static and reconciled application graphs",
					input: JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE
				}, {
					title: "Use exact Evidence already retained in this session",
					input: {
						...JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE,
						left: retained(JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE.left.evidence_id),
						right: retained(JAVASCRIPT_APPLICATION_VERSION_COMPARISON_EXAMPLE.right.evidence_id)
					}
				}]
			},
			{
				name: "compare_source_to_bundle",
				...toolContractMetadata("compare_source_to_bundle"),
				description: "Compare a cryptographically committed HistoricalSourceGraph supplied inline or as reference {kind:file,path:absolute-local-JSON-path} with authenticated JavaScript Application Graph Evidence supplied inline or by exact same-session retained reference. Omitted view preserves the full report. Optional view {kind:summary} or {kind:source-to-bundle,collection:mappings|candidates,source_paths?,mapping_ids?,statuses?,fields?,offset?,limit?} retains the full parent and returns selected facts. Query it again using inspect_analysis_view. Empty filters select none; identity fields always remain. Candidate signals are opt-in; classifications use the full comparison. Page coverage never upgrades source coverage. Uses explicit exact-digest, source-map path, current-path, suffix, and basename signals with stable weights. Classifies unchanged, modified, removed, split, merged, duplicated, and unknown; incomplete coverage and ambiguous weak signals never become absence or forced matches.",
				kind: "application",
				inputSchema: compareSourceToBundleRequestSchema,
				outputSchema: sourceToBundleOutputSchema,
				examples: [{
					title: "Compare committed historical source with a shipped bundle graph",
					input: SOURCE_TO_BUNDLE_COMPARISON_EXAMPLE
				}]
			},
			{
				name: "compare_javascript_export_shapes",
				...toolContractMetadata("compare_javascript_export_shapes"),
				description: "Compare static return shapes for one exact module/export selector on each authenticated JavaScript Application Graph supplied as inline Evidence or exact same-session retained references. Variants pair only by reciprocal unique literal discriminants. Each retained variant lists observed return-property names even when values stay unknown. Presence (present, absent, or unknown-coverage) is separate from value resolution: a name present on only one paired shape is added or removed when parent-property coverage is complete on both sides, including when the static value is unresolved. Dynamic values, incomplete parent coverage, and unpaired variants remain unknown. Reports JSON Pointer changes without executing JavaScript; runtime behavior requires a separate agent-run probe.",
				kind: "application",
				inputSchema: compareJavaScriptExportShapesRequestSchema,
				outputSchema: exportShapeComparisonOutputSchema,
				examples: [{
					title: "Report observed return-property presence when static values stay unknown",
					input: JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE
				}, {
					title: "Use exact Evidence already retained in this session",
					input: {
						...JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE,
						left: retained(JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE.left.evidence_id),
						right: retained(JAVASCRIPT_EXPORT_SHAPE_COMPARISON_EXAMPLE.right.evidence_id)
					}
				}]
			},
			{
				name: "build_reconstruction_obligation_ledger",
				...toolContractMetadata("build_reconstruction_obligation_ledger"),
				description: "Generate the complete deterministic ReconstructionObligationLedger from an authenticated Evidence bundle, reviewed obligations, and an explicit reconstruction manifest. Static candidates remain candidates; duplicate ownership, missing original or reconstruction cases, missing parser/type, weak verifier authority, unenumerated claims, contradictions, dependencies, and residual unknowns fail closed. The inline result carries the full-ledger closure digest and typed per-obligation diagnostics.",
				kind: "application",
				inputSchema: reconstructionObligationLedgerInputSchema,
				outputSchema: reconstructionObligationLedgerOutputSchema,
				examples: [{
					title: "Generate the complete obligation ledger",
					input: {
						evidence_bundle: {
							artifacts: [],
							providers: [],
							environments: [],
							scenarios: [],
							captures: [],
							unknowns: [],
							records: []
						},
						reviewed_obligations: [],
						manifest: {
							bindings: [],
							contradictions: []
						}
					}
				}]
			},
			{
				name: "evaluate_reconstruction_coverage",
				...toolContractMetadata("evaluate_reconstruction_coverage"),
				description: "Evaluate inline evidence-backed reconstruction coverage against one named boundary. Missing ownership or inventory is partial; stale, weak, truncated, skipped, unresolved, or conflicting tied verifier proof is unknown; contradictions, failed proof, missing owners, and authority routing fail closed.",
				kind: "application",
				inputSchema: reconstructionCoverageEvaluationInputSchema,
				outputSchema: reconstructionClosureResultSchema,
				examples: [{
					title: "Evaluate one replacement boundary",
					input: {
						coverage: {
							evidence_bundle: {
								artifacts: [],
								providers: [],
								environments: [],
								scenarios: [],
								captures: [],
								unknowns: [],
								records: []
							},
							artifacts: [],
							surfaces: [],
							owners: [],
							claims: [],
							verifier_contracts: [],
							verifier_results: [],
							residual_unknown_ids: [],
							contradictions: [],
							package_proofs: [],
							boundaries: [{
								boundary_id: "replacement.cli",
								title: "CLI replacement",
								required_surface_ids: ["cli.help"],
								required_claim_ids: ["claim.cli.help"],
								required_package_proof_kinds: ["clean-install", "authority-independence"],
								allowed_dispositions: [],
								allowed_unknown_ids: []
							}]
						},
						boundary_id: "replacement.cli"
					}
				}]
			},
			{
				name: "project_android_application_graph",
				...toolContractMetadata("project_android_application_graph"),
				description: "Project authenticated APK inventory_artifact Evidence into an execution-free Android application inventory. Reports exact component paths and hashes, runtime-family hints, and path-based bridge hypotheses without decoding DEX, executing the APK, or claiming observed runtime calls.",
				kind: "application",
				inputSchema: applicationInventoryProjectionInputSchema,
				outputSchema: evidenceResultOf(androidApplicationProjectionResultSchema),
				examples: [{
					title: "Project APK inventory Evidence into an Android application graph",
					input: ANDROID_APPLICATION_GRAPH_EXAMPLE
				}]
			},
			{
				name: "project_apple_application_graph",
				...toolContractMetadata("project_apple_application_graph"),
				description: "Project authenticated IPA, macOS .app directory, ZIP, or DMG inventory Evidence into an execution-free Apple application inventory. Reports application roots, nested bundles with path-convention roles (app extensions, XPC services, login items, privileged helpers, system extensions, frameworks), launchd plists, exact component paths and hashes, runtime-family hints, and path-based bridge hypotheses without parsing plist/CMS semantics or claiming observed runtime calls.",
				kind: "application",
				inputSchema: applicationInventoryProjectionInputSchema,
				outputSchema: evidenceResultOf(appleApplicationProjectionResultSchema),
				examples: [{
					title: "Project IPA inventory Evidence into an Apple application graph",
					input: APPLE_APPLICATION_GRAPH_EXAMPLE
				}, {
					title: "Project a macOS .app directory inventory into its bundle anatomy",
					input: MACOS_APPLICATION_GRAPH_EXAMPLE
				}]
			},
			{
				name: "project_harmony_application_graph",
				...toolContractMetadata("project_harmony_application_graph"),
				description: "Project authenticated HarmonyOS HAP, HSP, or App Pack inventory Evidence into an execution-free application inventory. Reports packaging-model hints (Stage module.json versus FA config.json), exact component paths and hashes (manifests, Ark bytecode, resources, native libraries, JavaScript, signing), App Pack child packages, runtime-family hints, and path-based N-API bridge hypotheses without decoding Ark bytecode, parsing manifest semantics, or claiming observed runtime calls.",
				kind: "application",
				inputSchema: applicationInventoryProjectionInputSchema,
				outputSchema: evidenceResultOf(harmonyApplicationProjectionResultSchema),
				examples: [{
					title: "Project HAP inventory Evidence into a HarmonyOS application graph",
					input: HARMONY_APPLICATION_GRAPH_EXAMPLE
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/webScriptToolContracts.js
var WEB_SCRIPT_TOOL_CONTRACTS;
function init_webScriptToolContracts() {
	return (init_webScriptToolContracts = __esmMin((() => {
		init_webScriptExport();
		init_webModuleTrace();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_webSourceLocation();
		WEB_SCRIPT_TOOL_CONTRACTS = [
			{
				name: "trace_web_source_location",
				...toolContractMetadata("trace_web_source_location"),
				description: "Trace one generated position in an exported website script through an explicitly paired local source map. Verifies manifest, selected script and map SHA-256/byte identities; returns every equal-position mapping, reported source/root, resolved source URL, embedded sourcesContent and original position inline. One-based lines and zero-based UTF-16 columns; greatest generated position <= requested across lines. Duplicate sources and generated-only mappings remain distinct. Caller-selected pairing does not establish deployment authenticity or execution. Regular maps and inline indexed sections only; external section URLs are unsupported. No network access or application execution; uses the pinned upstream codec in an owned Node process with private temporary files, independent 192 MiB old-generation heap and 20-second deadline. 4 MiB map, 32 MiB reply; complete evidence or actionable resource failure. Cleanup may extend the deadline.",
				kind: "application",
				inputSchema: webSourceLocationInputSchema,
				outputSchema: evidenceResultOf(webSourceLocationResultSchema),
				examples: [{
					title: "Trace a selected captured JavaScript point to embedded original source",
					input: {
						manifest_path: "/analysis/scripts/manifest.json",
						script_index: 0,
						source_map: {
							path: "/analysis/app.js.map",
							url: "https://example.test/app.js.map"
						},
						generated_position: {
							line: 1,
							column: 25
						}
					}
				}]
			},
			{
				name: "trace_web_module_imports",
				...toolContractMetadata("trace_web_module_imports"),
				description: "Trace one exported website script's outgoing native ES imports/re-exports, using exact URL and optional selected import-map context. Reads a local export_web_scripts manifest and verifies the selected source's SHA-256/size; returns source positions, native resolved URLs or exact errors, every matching captured candidate and explicit unknown execution. Query/fragment identities are preserved. Computed imports and bundler IDs remain unknown. Select importer_url for unknown inline/document-base context. Caller-supplied Chromium executes only a trusted REA resolver stub in an owned context with page requests locally fulfilled/blocked; no captured application execution or asset refetch. Requires absolute REA_BROWSER_EXECUTABLE for literal imports. 32 MiB manifest, 16 MiB source, 4 MiB map and 20-second native deadline; cleanup may extend the deadline.",
				kind: "application",
				inputSchema: webModuleTraceInputSchema,
				outputSchema: evidenceResultOf(webModuleTraceResultSchema),
				examples: [{
					title: "Trace an exported module under a selected import map",
					input: {
						manifest_path: "/analysis/exported-scripts/manifest.json",
						script_index: 0,
						import_map: {
							path: "/analysis/import-map.json",
							base_url: "https://example.test/app/"
						}
					}
				}]
			},
			{
				name: "export_web_scripts",
				...toolContractMetadata("export_web_scripts"),
				description: "Export JavaScript bytes already retained in one local inspect_web_page or capture_browser_scenario JSON capture (normalized result or complete Evidence). Writes scripts and a digest-verified manifest into an absent absolute output_directory. Returns all source URLs, script or transaction/event references, unavailable states, and an analysis_input for analyze_javascript_application when any bytes were exported. Include script sources in inspect_web_page or select capture.network.response_body in scenarios. No refetch or execution. Safe unambiguous URL layouts preserve relative module paths; versions, query variants, inline scripts, and path collisions are isolated with explicit resolution limitations.",
				kind: "application",
				inputSchema: exportWebScriptsInputSchema,
				outputSchema: evidenceResultOf(webScriptExportResultSchema),
				examples: [{
					title: "Export a saved website capture for static JavaScript analysis",
					input: {
						capture_path: "/analysis/capture.json",
						output_directory: "/analysis/exported-scripts"
					}
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/webRuntimeToolContracts.js
var WEB_RUNTIME_TOOL_CONTRACTS;
function init_webRuntimeToolContracts() {
	return (init_webRuntimeToolContracts = __esmMin((() => {
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		init_webExecution();
		init_webEventListeners();
		WEB_RUNTIME_TOOL_CONTRACTS = [{
			name: "observe_web_execution",
			...toolContractMetadata("observe_web_execution"),
			description: "Instrument one selected CDP page for a finite, externally driven precise coverage window. Resets execution counters and prevents optimized execution until stopped. Returns complete nested UTF-16 ranges/counts, independently hashed script text and request initiator associations by session script ID. Does not navigate, click, evaluate selected code or close the externally owned page. Navigation ends document-scoped collection; workers and UI causality remain outside this claim. Emits an actual armed progress notification before external actions.",
			kind: "browser-provider",
			inputSchema: observeWebExecutionInputSchema,
			outputSchema: evidenceResultOf(webExecutionSchema),
			examples: [{
				title: "Attribute externally triggered page execution",
				input: {
					cdp_endpoint: "http://127.0.0.1:9222",
					target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS",
					observation_ms: 1e4
				}
			}]
		}, {
			name: "inspect_web_event_listeners",
			...toolContractMetadata("inspect_web_event_listeners"),
			description: "Inspect listeners registered directly on the first main-document CSS match in one selected CDP page. Returns event flags, native callback locations, source ownership and exact script text/digests inline. Does not dispatch events, evaluate JavaScript or invoke handlers. Delegated ancestor/framework listeners and execution history remain unknown. Releases REA's object group and transport, preserving the external page.",
			kind: "browser-provider",
			inputSchema: inspectWebEventListenersInputSchema,
			outputSchema: evidenceResultOf(webEventListenersSchema),
			examples: [{
				title: "Find a selected button's callback source",
				input: {
					cdp_endpoint: "http://127.0.0.1:9222",
					target_id: "TARGET_ID_FROM_LIST_BROWSER_TARGETS",
					selector: "#submit"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/webNetworkCaptureToolContracts.js
var WEB_NETWORK_CAPTURE_TOOL_CONTRACTS;
function init_webNetworkCaptureToolContracts() {
	return (init_webNetworkCaptureToolContracts = __esmMin((() => {
		init_webNetworkCapture();
		init_toolEffects();
		init_analysisDetail();
		init_analysisView();
		WEB_NETWORK_CAPTURE_TOOL_CONTRACTS = [{
			name: "inspect_web_network_capture",
			...toolContractMetadata("inspect_web_network_capture"),
			description: "Explicit record_ordinals also decode retained protobuf/gRPC bodies whose declared content type is recognized. Optional protobuf selects exact body_pointers, framing, and a caller-supplied local FileDescriptorSet with message_type. Native gRPC and gRPC-web framing remain distinct. Wire fields are flat byte-range facts; ambiguous readings stay candidates, compressed payloads stay unknown. Page retained decoding with inspect_analysis_view kind protobuf, collection bodies/frames/fields, exact batch selectors and fields. Large text and schema values require explicit fields selection in those pages. Request detail summary for capture identity and counts; then page retained records with inspect_analysis_view kind capture (preview or complete), avoiding repeated decoding. Default detail complete preserves existing inline delivery. Inspect retained local HAR 1.2, native mitmproxy, Fiddler SAZ or aioquic 1.5.0 JSON qlog 0.3 events without contacting recorded URLs. Returns original ordinals, pointers/byte ranges/archive member names, preserved producer fields, precise numeric representations and exact exposed binary bytes inline. Excludes known transport credentials and explicitly marked values. Decodes every record before optional ordinal selection; malformed or oversized captures return no partial success. Duplicate JSON members are invalid; prototype-named members such as __proto__ are preserved as ordinary own JSON members without prototype mutation. Qlog reports trace-scoped STREAM interval unions and endpoint loss declarations; it does not recover bodies, prove network loss or correlate PCAP. Other qlog layouts are unsupported. Uses pinned upstream parsers, owned temporary files and bounded offline processes. SAZ preserves HTTP fields, XML metadata and encoded body/message bytes without replay or HAR conversion; encrypted archives are unsupported. Native mitmproxy requires caller-supplied mitmdump 12.2.3 on Linux. Browser transaction IDs, runtime attribution and original bytes of HAR Unicode text remain unknown.",
			kind: "application",
			inputSchema: inspectWebNetworkCaptureInputSchema.extend({ detail: analysisDetailSchema }),
			outputSchema: analysisDetailOutputSchemaOf(webNetworkCaptureSchema, webNetworkCaptureSummaryViewResultSchema),
			examples: [{
				title: "Inspect retained aioquic qlog events",
				input: {
					capture_path: "/captures/origin.qlog",
					format: "qlog",
					record_ordinals: [0, 2]
				}
			}, {
				title: "Inspect historical HAR entries",
				input: {
					capture_path: "/captures/session.har",
					format: "har",
					record_ordinals: [0, 2]
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/javascript/javascriptRecoveryToolContracts.js
var JAVASCRIPT_RECOVERY_TOOL_CONTRACTS;
function init_javascriptRecoveryToolContracts() {
	return (init_javascriptRecoveryToolContracts = __esmMin((() => {
		init_javascriptRecovery();
		init_toolEffects();
		init_toolOutputSchemaPrimitives();
		JAVASCRIPT_RECOVERY_TOOL_CONTRACTS = [{
			name: "recover_javascript_sources",
			...toolContractMetadata("recover_javascript_sources"),
			kind: "application",
			description: "Recover readable modules from local UTF-8 JavaScript scripts/bundles into an absent directory, using caller-supplied Wakaru ^1.13.0 (verified with 1.14.0) on Linux x64. Use additional_paths for related chunks; each input retains its own snapshot and provenance. Returns original/derived digests, extraction byte ranges, emitted source maps, warnings and analysis_input inline. Structural splitting may fall back to one module; original names and runtime equivalence remain unknown. No application code execution. Requires util-linux prlimit; one worker, 1 GiB address-space ceiling, 120-second deadline, 64 MiB total input, 128 MiB output, 10000 entries and 8 MiB per diagnostic/report stream.",
			inputSchema: javascriptRecoveryInputSchema,
			outputSchema: evidenceResultOf(javascriptRecoveryResultSchema),
			examples: [{
				title: "Recover a captured production bundle",
				input: {
					path: "/tmp/web-scripts/app.js",
					output_directory: "/tmp/recovered-app"
				}
			}, {
				title: "Recover a code-split bundle together",
				input: {
					path: "/tmp/web-scripts/main.js",
					additional_paths: [
						"/tmp/web-scripts/runtime.js",
						"/tmp/web-scripts/shared.js",
						"/tmp/web-scripts/checkout.chunk.js"
					],
					output_directory: "/tmp/recovered-chunks"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/functionWorkflowToolContracts.js
var functionWorkflowInputSchemas, functionWorkflow, FUNCTION_WORKFLOW_TOOL_CONTRACTS;
function init_functionWorkflowToolContracts() {
	return (init_functionWorkflowToolContracts = __esmMin((() => {
		init_jsonValue();
		init_analysisDetail();
		init_enhancedInputs();
		init_toolContractExamples();
		init_toolEffects();
		init_toolOutputSchemaGroups();
		init_toolOutputSchemaPrimitives();
		functionWorkflowInputSchemas = {
			analyze_function: enhancedInputSchemas.analyze_function.extend({ detail: analysisDetailSummaryDefaultSchema }),
			inspect_native_api: enhancedInputSchemas.inspect_native_api
		};
		functionWorkflow = (name, description) => {
			const inputSchema = functionWorkflowInputSchemas[name];
			const outputSchema = requireOutputSchema(enhancedOutputSchemas, name);
			return {
				name,
				...toolContractMetadata(name),
				description,
				kind: "enhanced",
				requiresActiveTarget: true,
				inputSchema,
				outputSchema,
				examples: [{
					title: `Example ${name.replaceAll("_", " ")} request`,
					input: jsonObjectSchema.parse(inputSchema.parse(TOOL_EXAMPLE_OVERRIDES[name] ?? {}))
				}]
			};
		};
		FUNCTION_WORKFLOW_TOOL_CONTRACTS = [functionWorkflow("analyze_function", "Build a dossier for one native function identified by symbol or provider-returned address. Returns identity with complete inclusive analyzed body ranges or explicit unknown, provider-specific pseudocode and assembly, comments, calls, references, referenced strings/names, local CFG blocks, and available native API boundary observations. Ghidra terminal-call assumptions that may cut the analyzed body are reported in limitations with available callee identities. Default detail summary returns a compact dossier (identity, pseudocode size, facet counts, value-flow availability) and retains the complete dossier Evidence in this session; page pseudocode, references, assembly and value-flow through normalized_result.parent_evidence_id with inspect_analysis_view. detail complete returns the full dossier inline."), functionWorkflow("inspect_native_api", "Analyze a native API boundary in one function identified by symbol or provider-returned address. Returns confidence, evidence, jump-table dispatch/data/case mappings, separately evidenced default targets, unsupported branches, and residual unknowns. Null case values mean unresolved cases, never a known default.")];
	})))();
}

//#endregion
//#region dist/contracts/enhancedToolContracts.js
var enhanced, ENHANCED_TOOL_CONTRACTS;
function init_enhancedToolContracts() {
	return (init_enhancedToolContracts = __esmMin((() => {
		init_enhancedInputs();
		init_toolOutputSchemaGroups();
		init_toolOutputSchemaPrimitives();
		init_toolContractHelpers();
		init_toolEffects();
		init_functionWorkflowToolContracts();
		enhanced = (name, description, inputSchema) => ({
			name,
			...toolContractMetadata(name),
			description,
			kind: "enhanced",
			requiresActiveTarget: true,
			inputSchema,
			outputSchema: requireOutputSchema(enhancedOutputSchemas, name),
			examples: examplesFor(name, inputSchema)
		});
		ENHANCED_TOOL_CONTRACTS = [
			enhanced("inspect_native_dispatch_metadata", "Inspect the bound provider's name inventory for Objective-C class/method symbols and Swift mangled symbols, returning at most max_records decoded names. Optional objc_class_import_addresses request exact pointer-slot binding facts for those addresses; they are decoded only from the selected Mach-O slice and retain partial or unsupported coverage when not established. Includes target SHA-256 when available, provider identity/version, analysis-profile digest, facet coverage, and per-record Evidence. This is static symbol and metadata evidence, not runtime metadata: ivar layouts, protocol conformances, witness/class tables, and relative pointers are explicitly marked unsupported unless a provider supplies those decoders. The provider controls how its name inventory is acquired. The Mach-O byte reader holds the whole file in memory: max_input_bytes (default 64 MiB, at most 1 GiB) bounds it, and results record input_admission.", enhancedInputSchemas.inspect_native_dispatch_metadata),
			enhanced("get_objc_classes", "Discover Objective-C class labels, optionally filtering by literal substring. Rows are coalesced only when exact selected-image pointer-fixup evidence proves that their own addresses bind the same imported class symbol, binding stream, raw library ordinal and resolved library, weak status, and addend. Rows without that evidence remain separate, with identity coverage reported as unknown, partial, or unsupported.", enhancedInputSchemas.get_objc_classes),
			enhanced("get_objc_protocols", "Discover and deduplicate Objective-C and Swift protocol labels.", enhancedInputSchemas.get_objc_protocols),
			enhanced("batch_decompile", "Decompile each explicit procedure symbol or address, with one provider read active per batch. Preserves each input selector in address and reports the observed canonical entry and entry label in procedure; identity or label failures remain explicit without discarding usable pseudocode. Returns ordered per-item success or error results and aggregate counts. The complete reply retains every pseudocode body; use selected small batches to bound retained output. A per-function limit is not a batch deadline; allow for every item or split calls.", enhancedInputSchemas.batch_decompile),
			enhanced("decompile_all", "Write provider pseudocode for every analyzed function, or a filtered subset, into a caller-selected directory and return only a manifest. Each file records the provider function name, canonical address, inclusive body ranges when procedure_info supplies them, and that function's procedure_info and pseudocode limitations. Each function's index record keeps its complete limitations. Evidence keeps at most eight first-observed distinct per-function limitations within an encoded-text budget; the omitted count measures observations, not distinct warnings. The manifest reports counts, the output directory, the index path, at most 32 failure details within 2,048 JSON-encoded UTF-8 bytes (names can be omitted; full names remain in the index), provider identity, and the analysis-profile digest. Pseudocode stays in the files. An existing directory is refused unless resume is set and the journal matches the target SHA-256, provider, and analysis profile; verified files are skipped and conflicting files are left unchanged. layout dwarf reports that compilation-unit paths are unavailable and names files by address. A failure of one function does not stop the others. Functions procedure_info classifies as external are counted as external, get no file, and are not decompiled; a resume skips them. Cancellation leaves files already written. Per-function limits do not bound the whole call; use limit and resume to select work that fits the client deadline, including import, listing and file work.", enhancedInputSchemas.decompile_all),
			enhanced("get_call_graph", "Resolve one symbol or address to its canonical procedure entry, then traverse the bound provider's caller or callee relationships until the reachable graph is exhausted. Every node uses a canonical address and has an ok/error status; failures use safe typed projections. Unresolved indirect calls may be missing and results are not a whole-program CFG.", enhancedInputSchemas.get_call_graph),
			enhanced("analyze_swift_types", "Categorize analyzed Swift procedure names using their manglings or same-address Swift symbol aliases. Decodes legacy and literal modern nominal contexts into classes, structs, enums, protocols, and extensions. Preserves provider names and supporting mangled_names; unresolved categories appear in other and in unclassified, which remains inline even under category filters. Returns deduplicated procedure-name counts, not unique source types, plus identification limitations. Optionally select one category and/or apply a case-sensitive literal filter to provider names or supporting manglings; for example, use {category: \"structs\", pattern: \"Pair\"}.", enhancedInputSchemas.analyze_swift_types),
			enhanced("find_xrefs_to_name", "Resolve an exact name against the bound provider's name inventory and return a resolved or unresolved result. Unresolved names use the stable name_not_found reason; this xref workflow returns address-only projections.", enhancedInputSchemas.find_xrefs_to_name),
			enhanced("binary_overview", "Return the bound document and exhaustive procedure/string counts, plus every segment and segment_count when the provider supports segment enumeration. If segment fields are omitted, segment coverage is unavailable rather than empty. When every observed segment agrees on an analysis image base, return it as image_base so callers can relate provider addresses to their loader coordinates. Use search_procedures, list_procedures, or analyze_function directly when you already know which procedure to inspect.", enhancedInputSchemas.binary_overview),
			...FUNCTION_WORKFLOW_TOOL_CONTRACTS,
			enhanced("trace_feature", "Trace the complete literal query, preserving spaces, through every matching string and procedure, their xrefs, and truthful containing-procedure resolution. Returns observations and residual unknowns without inferring reference kinds.", enhancedInputSchemas.trace_feature),
			enhanced("trace_call_path", "Resolve start and optional goal symbols or addresses to canonical procedure entries, then trace direct callers or callees until the graph is exhausted or the goal is reached. Results use canonical addresses; Evidence preserves supplied selectors. Returns visited nodes, direct-call edges, a shortest traversal path, provider failures, and residual unknowns. A requested goal is unknown when unresolved expansions prevent proving it absent; unresolved indirect calls remain unknown.", enhancedInputSchemas.trace_call_path),
			enhanced("trace_native_ui_action", "Trace one unique compiled UI action, object ID, native symbol or exact function address through authored connections, encoded or symbolized Objective-C handlers, and bounded static call references. Typed direct and resolved indirect calls, ambiguous candidates, inferred untyped provider callees, and targetless sites remain distinct. Runtime reachability is unknown; use trace_native_values for recovered value dependencies.", enhancedInputSchemas.trace_native_ui_action),
			enhanced("trace_native_values", "Trace a bounded static dependency graph from one explicit native procedure. Includes high-p-code def-use, constants, operators, memory and branch operations, resolved call edges, and derived argument/parameter and return/output bindings. Missing bindings, alias semantics, persistent state and RNG roles remain unknown. Budgets bound depth, decompilations, graph size and payloads; nodes are paginated. A Ghidra per-function timeout does not bound the whole traversal; allow startup, every attempted function and other work, or reduce max_functions.", enhancedInputSchemas.trace_native_values)
		];
	})))();
}

//#endregion
//#region dist/contracts/sessionLifecycleInputs.js
var snapshotPathSchema, binaryTargetPathSchema, openBinaryInputSchema, openBundleResourcesInputSchema, closeBinaryInputSchema;
function init_sessionLifecycleInputs() {
	return (init_sessionLifecycleInputs = __esmMin((() => {
		init_dosCom();
		init_localPath();
		init_rawBinary();
		init_providerSelection();
		snapshotPathSchema = absoluteLocalPathStringSchema.describe("Absolute local filesystem path for the analysis snapshot; relative paths are rejected.");
		binaryTargetPathSchema = absoluteLocalPathStringSchema.describe("Absolute local filesystem path for the analysis target; relative paths are rejected.");
		openBinaryInputSchema = z.strictObject({
			path: binaryTargetPathSchema,
			format: executableFormatHintSchema.optional().describe("Explicit interpretation: dos-com or raw-binary (headerless), or gamecube-dol (GameCube/Wii DOL, never auto-detected). Omission preserves header-based detection."),
			architecture: binaryArchitectureSchema.optional().describe("Caller-supplied CPU family. Required with format=raw-binary; rejected otherwise. format=gamecube-dol takes powerpc from the header, so it must be omitted."),
			entry_point: rawBinaryEntryPointSchema.optional().describe("Caller-supplied load and entry address (0xhex). File offset 0 is mapped here. Required with format=raw-binary; rejected otherwise. Optional with format=gamecube-dol; must equal the DOL header entry."),
			provider_id: analysisProviderSelectorSchema.optional(),
			snapshot_path: snapshotPathSchema.optional()
		}).superRefine((value, context) => {
			const pairing = rawBinarySelectionError({
				...value.format === undefined ? {} : { format: value.format },
				...value.architecture === undefined ? {} : { architecture: value.architecture },
				...value.entry_point === undefined ? {} : { entryPoint: value.entry_point }
			});
			if (pairing === undefined) return;
			context.addIssue({
				code: "custom",
				path: value.format === "raw-binary" ? value.architecture === undefined ? ["architecture"] : ["entry_point"] : value.architecture === undefined ? ["entry_point"] : ["architecture"],
				message: pairing
			});
		});
		openBundleResourcesInputSchema = z.strictObject({ path: binaryTargetPathSchema });
		closeBinaryInputSchema = z.strictObject({
			snapshot_path: snapshotPathSchema.optional(),
			overwrite: z.boolean().default(false)
		});
	})))();
}

//#endregion
//#region dist/contracts/sessionStatusContract.js
var binarySessionInputSchema;
function init_sessionStatusContract() {
	return (init_sessionStatusContract = __esmMin((() => {
		init_localPath();
		binarySessionInputSchema = z.strictObject({
			expected_package_version: z.string().min(1).optional(),
			expected_catalog_digest: z.string().regex(/^[a-f0-9]{64}$/u).optional(),
			expected_server_path: absoluteLocalPathStringSchema.describe("Absolute local filesystem path expected for the running server; relative paths are rejected.").optional()
		});
	})))();
}

//#endregion
//#region dist/contracts/sessionToolContracts.js
var session, exportEvidenceBundleInputSchema, SESSION_TOOL_CONTRACTS;
function init_sessionToolContracts() {
	return (init_sessionToolContracts = __esmMin((() => {
		init_functionMatchingContracts();
		init_localPath();
		init_artifactComparison();
		init_callPathSchemas();
		init_changedBehavior();
		init_functionComparisonSchemas();
		init_processScenario();
		init_residualUnknown();
		init_reconstructionVerificationSchemas();
		init_staticRuntimeCorrelation();
		init_toolOutputSchemaGroups();
		init_toolOutputSchemaPrimitives();
		init_sessionLifecycleInputs();
		init_sessionStatusContract();
		init_sessionToolSchemas();
		init_toolContractHelpers();
		init_toolEffects();
		session = (name, description, inputSchema) => ({
			name,
			...toolContractMetadata(name),
			description,
			kind: "session",
			inputSchema,
			outputSchema: requireOutputSchema(sessionOutputSchemas, name),
			examples: examplesFor(name, inputSchema)
		});
		exportEvidenceBundleInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute local filesystem path for the exported evidence bundle; relative paths are rejected."),
			overwrite: z.boolean().default(false)
		});
		SESSION_TOOL_CONTRACTS = [
			session("open_binary", "Open a local executable, application bundle, archive, JavaScript, source map, plist, or analysis database after validation. format=dos-com explicitly interprets 1..65280 headerless bytes as a DOS COM analysis image. format=raw-binary interprets headerless bytes with a required architecture and entry_point; file offset 0 maps at that address. Omission preserves header-based detection. provider_id selects one deep provider or deterministic auto selection; the binding remains stable until close or an explicit switch, with no failure fallback. Reopening the same target and profile retains its active database and metadata edits. An optional analysis snapshot is imported atomically and must match the binary identity, concrete provider, and canonical analysis profile exactly; importing into a session with metadata mutations requires closing and reopening it first. Call close_binary when the investigation is finished.", openBinaryInputSchema),
			session("open_bundle_resources", "Open a local app bundle for read-only plist, Interface Builder, asset catalog, and keyed archive inspection without resolving or inventing its executable identity. This switches the shared session to a resource-only lane; executable analysis is unavailable until another target is opened.", openBundleResourcesInputSchema),
			session("close_binary", "When the investigation is finished, drain earlier provider requests, optionally write a provider-neutral analysis snapshot atomically to the caller-supplied path, then close the active analysis session and every provider resource started for it. Resource-only app sessions have no binary snapshot binding, so close them without snapshot_path. Later provider requests wait until this lifecycle operation finishes. Existing files require explicit overwrite; a failed save leaves the session open so cached analysis is not lost. Metadata edits prevent immutable snapshot saves until the session is recreated; export_evidence_bundle preserves mutable observations before closing without a snapshot.", closeBinaryInputSchema),
			session("binary_session", "Report the active binary target or resource-only app root, provider and capability availability when applicable, client-feature, analysis, and server-identity status without starting analysis.", binarySessionInputSchema),
			session("export_evidence_bundle", "Atomically write the session's deterministic Evidence bundle to the requested local path. Existing files require overwrite: true; records and manifests use canonical byte-stable ordering.", exportEvidenceBundleInputSchema),
			session("import_evidence_bundle", "Read the JSON bundle at the supplied local path, validate every Evidence ID and canonical manifest, then atomically merge it. Imported content is data only and is never executed.", importEvidenceBundleInputSchema),
			session("capture_process_scenario", "Run one caller-selected command under a PTY and return process capture Evidence with residual unknowns. The renderer admits at most 1,000,000 combined terminal cells, computed as columns × (rows + scrollback); every resize uses the selected scrollback and must fit the same budget. Supply a smaller terminal shape when that product is too large; dimensions are never clamped. This release has no runtime override for that cell budget. A command name resolves through the inherited PATH; the working directory defaults to the caller's current directory; host environment variables are inherited with scenario overrides. Environment keys cannot contain '=' or NUL, and REA_PROCESS_RUN_ID is reserved for process ownership. Filesystem snapshots are opt-in through filesystem_observation_paths. A positive finalization_ms makes a timeout or idle deadline send SIGTERM to the captured root through its start identity, keep observing, and send SIGKILL once after the interval; exit.finalization records each attempt with its delivery result and the observed exit, and cancellation still ends the run at once. The target runs with the current user's permissions; this is not a security sandbox.", processScenarioSchema),
			session("compare_process_captures", "Compare two compatible process capture observations across terminal, interaction, lifecycle, process, filesystem, command-shim, HTTP, and WebSocket evidence. Optional trace_spec validates exact events against an explicit partial order or finite trace language; concurrency is never inferred from timestamps or broad sorting. Missing, journal-free, or truncated observations are never treated as equivalent.", processComparisonInputSchema),
			session("compare_artifacts", "Compare complete artifact inventories by logical occurrence path, content identity, metadata, and graph relations. Pass the inventory Evidence nested in each inspect_artifact result as left and right, or pass its inspect_analysis_view summary while the complete parent Evidence remains retained in this session. Summary facts are not treated as a complete inventory; comparison resolves the exact retained parent. Every delta cites both complete inputs, and gaps yield truncated or unknown, never equivalence. Returns every change inline.", artifactComparisonInputSchema),
			session("match_native_functions", "Match two retained list_procedures inventories by unique exact reported symbols, then unique identical observed function bytes. Optional same-context list_names/procedure_info/read_bytes/analyze_function Evidence supplies symbol origin, exact bodies, bytes and dossier links as supplied static facts. Optional compatible CFG/call/string fingerprints from supplied dossiers propose unresolved groups only. Duplicate candidates remain unresolved groups; only_left/right mean unpaired within supplied observations, never proof of addition/removal. Default summary retains complete Evidence for filtered, selected-column, paged function-matches views. Complete detail returns every group. Existing dossier pairs provide direct retained-reference compare_functions inputs.", matchNativeFunctionsInputSchema),
			session("compare_functions", "Compare two explicit analyze_function Evidence records or exact retained session references across identity, exact provider text, calls, references, strings, and address-normalized CFG topology. Missing or provider-incompatible facets remain truncated or unknown; every conclusion cites both Evidence sets.", functionComparisonInputSchema),
			session("compare_bundles", "Compare two canonical Evidence bundles by exact record membership, explicit one-to-one observation pairs, and complete residual-unknown revision histories. Supply absolute local filesystem paths; relative paths are rejected. Missing bundle members describe omission only, never behavioral equivalence; output is digest-anchored and returns every change inline.", bundleComparisonMcpInputSchema),
			session("find_changed_behavior", "Aggregate validated process, artifact, and function comparison Evidence. Runtime observations remain distinct from static behavior candidates; missing or incomplete comparisons produce unresolved findings, never causal claims. Returns every finding inline.", changedBehaviorInputSchema),
			session("build_call_path", "Build every shortest direct-callee path inline from complete analyze_function Evidence records using exact canonical addresses. Missing dossiers and provider mixing remain unknown; every node and edge cites source Evidence.", callPathInputSchema),
			session("correlate_static_and_runtime", "Evaluate every explicit caller-declared hypothesis between exact static comparison findings and runtime comparison dimensions. Similar names or paths are never auto-matched, consistent cochange never proves causality, and unknown or truncated inputs remain unresolved. Returns all correlations and their complete Evidence closure inline.", staticRuntimeCorrelationInputSchema),
			session("verify_reconstruction", "Verify a finite typed behavioral and structural specification against a canonical Evidence bundle. Pass means every declared claim has complete comparable authority—not global source equivalence; changed claims fail and missing, limited, or unresolved evidence stays unknown.", reconstructionVerificationInputSchema),
			session("list_unknowns", "List current residual-unknown heads in deterministic ID order, with optional exact status, severity, and domain filters. Results are complete inline by default; supply offset and limit to page the filtered order. total is the matching-head count and next_offset is null when the page exhausts the result. This is read-only; unresolved, contradicted, and non-truth dispositions remain distinct.", listUnknownsInputSchema),
			session("record_unknown", "Create one deterministic residual unknown and immutable mutation evidence. Validates all evidence and relationship references, and rejects duplicate stable identity.", recordUnknownInputSchema),
			session("update_unknown", "Append one immutable full-state revision and mutation evidence. Requires exact expected_revision; stale concurrent writers fail instead of overwriting newer analysis.", updateUnknownInputSchema),
			session("verify_unknown_resolution", "Revalidate the current residual-unknown head against live bundled evidence, exact authority/confidence/environment requirements, and revision integrity. Withdrawn and out-of-scope dispositions are not truth claims.", verifyUnknownResolutionInputSchema),
			session("get_evidence_bundle", "Return every retained Evidence record and residual unknown as a complete canonical bundle by default. detail=summary discovers retained records without copying or transferring their payloads; optionally filter by exact Evidence ID, operation, target SHA-256, analysis-profile digest or canonical native procedure address. Metadata distinguishes complete record retention from native value-flow truncation or unavailable/unknown coverage. Use a discovered evidence_id with inspect_analysis_view without restarting a provider. Filters apply only to summary delivery.", getEvidenceBundleInputSchema),
			{
				...session("get_navigation_context", "Return the selected document, current address, and containing/current procedure in one provider-neutral result. The result reflects sequential provider observations, not an atomic cursor snapshot; a cursor outside any procedure returns procedure: null.", navigationContextInputSchema),
				requiresActiveTarget: true
			},
			session("inspect_address_context", "Inspect one explicit reproducible address for its analyzed name, containing procedure, regular and inline comments, and matching bookmarks. Each unsupported facet returns a typed unavailable outcome; use xrefs, assembly, or pseudocode for those deeper views.", addressContextInputSchema)
		];
	})))();
}

//#endregion
//#region dist/contracts/reverseEngineeringToolContracts.js
var REVERSE_ENGINEERING_TOOL_CONTRACTS;
function init_reverseEngineeringToolContracts() {
	return (init_reverseEngineeringToolContracts = __esmMin((() => {
		init_commandObservation();
		init_analysisView();
		init_reverseEngineering();
		init_toolOutputSchemaPrimitives();
		init_analysisDetail();
		init_toolEffects();
		REVERSE_ENGINEERING_TOOL_CONTRACTS = [{
			name: "inspect_with_objdump",
			...toolContractMetadata("inspect_with_objdump"),
			kind: "native-provider",
			description: "Run caller-selected GNU objdump inspection against a local artifact, or request operation=architectures without a path to list BFD targets advertised by the installed binary. For operation=disassemble, optional symbol selects native symbol-scoped disassembly before output collection; omission preserves all code sections. Matching and symbol boundaries follow GNU objdump. Preserves decoded stdout and stderr inline with SHA-256 Evidence for artifact inspections, up to a shared 16 MiB combined limit; invalid UTF-8 bytes are represented by replacement characters and flagged in Evidence limitations. output_truncated reports output beyond that limit and completion_status is unknown if buffer enforcement terminated the process. The raw output is authoritative and REA does not claim a stable normalized format. DWARF does not follow local debug links by default. Set follow_debug_links to true to follow them; identities of external debug files are not bound to Evidence. REA clears DEBUGINFOD_URLS for objdump so DWARF processing does not make debuginfod network requests. Default detail complete returns original Evidence. Explicit detail summary retains the complete parent and returns its command observation once, without the raw mirror; parent_evidence_id supports later inspect_analysis_view summary queries and complete Evidence export. Architecture output is subjectless and does not establish support for any artifact. Optional command_timeout_ms is the per-phase wall clock in milliseconds (default 120000, range 1..2147483647); omitted means 120000 and the value applies on the next call. It does not raise the 16 MiB output cap.",
			inputSchema: objdumpInputSchema,
			outputSchema: analysisDetailOutputSchemaOf(commandObservationSchema, objdumpSummaryViewResultSchema),
			examples: [{
				title: "Disassemble code sections",
				input: {
					path: "/tmp/program",
					operation: "disassemble"
				}
			}, {
				title: "List advertised BFD targets",
				input: { operation: "architectures" }
			}]
		}, {
			name: "execute_rizin_command",
			...toolContractMetadata("execute_rizin_command"),
			kind: "native-provider",
			description: "Execute one caller-selected Rizin command against a local artifact using the Rizin CLI profile that suppresses user settings and scripts while retaining plugins. Preserves decoded stdout and stderr inline with SHA-256 Evidence, up to a shared 16 MiB combined limit; invalid UTF-8 bytes are represented by replacement characters and flagged in Evidence limitations. output_truncated reports output beyond that limit and completion_status is unknown if buffer enforcement terminated the process. Rizin commands and retained plugins can execute foreign code, mutate files, access the network, and read files outside the selected artifact; identities and contents of those external inputs are not bound to Evidence. Command effects depend on the Rizin command and loaded plugins; JSON is command-specific and raw output remains authoritative. In a shared MCP server, this admitted command closes any active binary-analysis session; after its effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first. Optional command_timeout_ms is the per-phase wall clock in milliseconds (default 120000, range 1..2147483647); omitted means 120000 and the value applies on the next call. It does not raise the 16 MiB output cap or a Rizin debugger session deadline.",
			inputSchema: rizinInputSchema,
			outputSchema: evidenceResultOf(commandObservationSchema),
			examples: [{
				title: "Inspect binary information",
				input: {
					path: "/tmp/program",
					command: "iI"
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/gdbToolContracts.js
var sessionId$1, GDB_TOOL_CONTRACTS;
function init_gdbToolContracts() {
	return (init_gdbToolContracts = __esmMin((() => {
		init_localPath();
		init_commandObservation();
		init_analysisView();
		init_analysisDetail();
		init_toolEffects();
		sessionId$1 = z.string().uuid();
		GDB_TOOL_CONTRACTS = [
			{
				name: "start_gdb_session",
				...toolContractMetadata("start_gdb_session"),
				kind: "native-provider",
				description: "Start a BYO GDB process in MI3 mode when available, suppress startup files, and disable auto-loading. Persistent GDB sessions are available only on Linux, where REA can verify live inferior output descriptors through /proc before detaching; macOS descriptor verification is not implemented, and Windows Job Object cleanup can terminate debugger inferiors. Optionally set inferior_tty to a caller-selected terminal for future inferior runs; REA verifies the setting through GDB/MI before the session becomes ready. The selected terminal must remain available after GDB exits. A live inferior can be detached during close only while this durable output sink remains verified. The session persists in this REA MCP server process and receives an explicit session ID.",
				inputSchema: z.strictObject({ inferior_tty: localPathStringSchema.optional().describe("Caller-selected terminal path for future inferior runs. GDB must report the exact configured path before the session is ready.") }),
				outputSchema: z.strictObject({
					session_id: sessionId$1,
					mi_version: z.enum(["mi3", "mi2"])
				}),
				examples: [{
					title: "Start GDB",
					input: {}
				}]
			},
			{
				name: "gdb_console",
				...toolContractMetadata("gdb_console"),
				kind: "native-provider",
				description: "Run one unrestricted GDB CLI command through MI interpreter-exec console and return raw MI, console, target, and log records inline with Evidence. Default detail complete preserves the original Evidence. Explicit detail summary retains that complete parent and returns every ordered MI record once, omitting duplicate stream groupings and raw mirrors; parent_evidence_id supports later inspect_analysis_view summary queries and complete Evidence export. A command timeout preserves collected records with completion_status unknown and stops the owned debugger session. Commands can execute shell, alter target state, access files, and use network. Closing the debugger never implies target termination. In a shared MCP server, this admitted command closes any active binary-analysis session; after its effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first.",
				inputSchema: z.strictObject({
					session_id: sessionId$1,
					command: z.string().min(1),
					detail: commandEvidenceDetailSchema
				}),
				outputSchema: analysisDetailOutputSchemaOf(gdbCommandResultSchema, gdbCommandSummaryViewResultSchema),
				examples: [{
					title: "Inspect loaded symbols",
					input: {
						session_id: "00000000-0000-4000-8000-000000000001",
						command: "info functions"
					}
				}]
			},
			{
				name: "gdb_session_status",
				...toolContractMetadata("gdb_session_status"),
				kind: "native-provider",
				description: "Return the observed lifecycle state and bounded recent MI records and process diagnostics for one persistent REA GDB session; truncation and invalid-UTF-8 fields report discarded or lossy data.",
				inputSchema: z.strictObject({ session_id: sessionId$1 }),
				outputSchema: z.strictObject({
					session_id: sessionId$1,
					mi_version: z.enum(["mi3", "mi2"]),
					state: z.enum(["ready", "closed"]),
					recent_mi_records: z.array(z.string()),
					recent_mi_records_truncated: z.boolean(),
					mi_invalid_utf8: z.boolean(),
					stderr: z.string(),
					stderr_observed_bytes: z.int().nonnegative(),
					stderr_truncated: z.boolean(),
					stderr_invalid_utf8: z.boolean(),
					diagnostics_truncated: z.boolean(),
					inferior_tty: z.string().nullable(),
					inferior_tty_verified: z.boolean()
				}),
				examples: [{
					title: "Check GDB session",
					input: { session_id: "00000000-0000-4000-8000-000000000001" }
				}]
			},
			{
				name: "close_gdb_session",
				...toolContractMetadata("close_gdb_session"),
				kind: "native-provider",
				description: "Close the owned GDB process after verifying the inferior state. When one live thread group has a verified durable output TTY, REA automatically detaches it, which may resume target execution; otherwise close reports that a disposition is required. REA never kills attached or remote targets as part of debugger cleanup. In a shared MCP server, this admitted close retires any active binary-analysis session; after target effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first.",
				inputSchema: z.strictObject({ session_id: sessionId$1 }),
				outputSchema: z.strictObject({ target_state: z.enum(["none_observed", "unknown"]) }),
				examples: [{
					title: "Close GDB session",
					input: { session_id: "00000000-0000-4000-8000-000000000001" }
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/contracts/rizinDebugToolContracts.js
var sessionId, commandResult, RIZIN_DEBUG_TOOL_CONTRACTS;
function init_rizinDebugToolContracts() {
	return (init_rizinDebugToolContracts = __esmMin((() => {
		init_localPath();
		init_toolOutputSchemaPrimitives();
		init_toolEffects();
		sessionId = z.string().uuid();
		commandResult = z.strictObject({
			command: z.string(),
			output: z.string(),
			output_scope: z.literal("command_and_interleaved_session_output"),
			output_truncated: z.boolean(),
			output_invalid_utf8: z.literal(true).optional(),
			completion_status: z.enum(["complete", "unknown"]),
			backend: z.string().nullable()
		});
		RIZIN_DEBUG_TOOL_CONTRACTS = [
			{
				name: "start_rizin_debug_session",
				...toolContractMetadata("start_rizin_debug_session"),
				kind: "native-provider",
				description: "Start a persistent Rizin debugger session using `-N` to suppress user settings and scripts while retaining plugins, `-0` for NUL framing, and `-d` with an optional caller-selected IO debugger backend. Requires a caller-selected Linux TTY for inferior stdout and stderr; the target may write directly to that terminal while running and after detach. REA verifies both destinations and `dbg.exitkills=false` before detaching. Backend and target capabilities depend on the installed build. The session lives in this REA MCP process. Persistent sessions require Linux `/proc` descriptor readback. In a shared MCP server, starting this session retires any active binary-analysis session; after target effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first.",
				inputSchema: z.strictObject({
					path: localPathStringSchema,
					inferior_tty: localPathStringSchema,
					backend: z.string().min(1).optional()
				}),
				outputSchema: z.strictObject({
					session_id: sessionId,
					backend: z.string().nullable()
				}),
				examples: [{
					title: "Start Rizin debugger",
					input: {
						path: "/tmp/program",
						inferior_tty: "/dev/pts/7"
					}
				}]
			},
			{
				name: "rizin_debug_command",
				...toolContractMetadata("rizin_debug_command"),
				kind: "native-provider",
				description: "Execute one unrestricted command in a persistent Rizin debugger session. Returns raw output inline with Evidence, including backend output interleaved before the completion marker. If the command exceeds the output-byte, frame-byte, or frame-count limit, `output_truncated` is true and `completion_status` is `unknown`; retained partial output is returned and the owned debugger session is stopped. Evidence names the cap that stopped capture. Unsolicited frames already queued before the command make the session unavailable because correlation is ambiguous. Commands can access local files, shell, network, plugins, and target state; effects depend on the active backend and target. In a shared MCP server, this admitted command closes any active binary-analysis session; after its effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first.",
				inputSchema: z.strictObject({
					session_id: sessionId,
					command: z.string().min(1).refine((value) => !/[\r\n]/u.test(value), "A single command line is required")
				}),
				outputSchema: evidenceResultOf(commandResult),
				examples: [{
					title: "Inspect debugger state",
					input: {
						session_id: "00000000-0000-4000-8000-000000000001",
						command: "dr"
					}
				}]
			},
			{
				name: "rizin_debug_session_status",
				...toolContractMetadata("rizin_debug_session_status"),
				kind: "native-provider",
				description: "Return observed lifecycle state and bounded recent NUL-framed output and process diagnostics for one Rizin debugger session; truncation fields report discarded data, and output_invalid_utf8 reports whether invalid UTF-8 has been observed in session frame bytes; recent output may contain replacement characters.",
				inputSchema: z.strictObject({ session_id: sessionId }),
				outputSchema: z.strictObject({
					session_id: sessionId,
					state: z.enum(["ready", "closed"]),
					inferior_tty: z.string(),
					recent_output: z.array(z.string()),
					recent_output_truncated: z.boolean(),
					diagnostics_truncated: z.boolean(),
					output_invalid_utf8: z.boolean()
				}),
				examples: [{
					title: "Check Rizin session",
					input: { session_id: "00000000-0000-4000-8000-000000000001" }
				}]
			},
			{
				name: "close_rizin_debug_session",
				...toolContractMetadata("close_rizin_debug_session"),
				kind: "native-provider",
				description: "Close the REA-owned Rizin debugger only after verifying no inferior remains or detaching one with a verified caller-selected TTY output sink. A detached target may continue running and write to that TTY; target state is otherwise reported as unknown. REA never signals an inferior based on PID or path. In a shared MCP server, this admitted close retires any active binary-analysis session; after target effects have settled, call open_binary before further analysis. Close an active Ghidra session explicitly first.",
				inputSchema: z.strictObject({ session_id: sessionId }),
				outputSchema: z.strictObject({ target_state: z.literal("unknown") }),
				examples: [{
					title: "Close Rizin debugger",
					input: { session_id: "00000000-0000-4000-8000-000000000001" }
				}]
			}
		];
	})))();
}

//#endregion
//#region dist/domain/environmentBundleExport.js
var environmentCaptureSourceSchema, exportEnvironmentBundleInputSchema, environmentBuildReportSchema;
function init_environmentBundleExport() {
	return (init_environmentBundleExport = __esmMin((() => {
		init_environmentCoverageView();
		init_environmentManifestRules();
		init_digests();
		init_evidenceReference();
		init_localPath();
		environmentCaptureSourceSchema = z.discriminatedUnion("kind", [retainedEvidenceReferenceSchema.describe("Capture Evidence this session retained, such as a capture_browser_scenario or inspect_web_network_capture result."), z.strictObject({
			kind: z.literal("evidence-file"),
			path: absoluteLocalPathStringSchema.describe("Absolute path of one capture Evidence JSON file, copied byte for byte into the bundle.")
		})]);
		exportEnvironmentBundleInputSchema = z.strictObject({
			source: environmentCaptureSourceSchema.describe("The capture the environment is built from: capture_browser_scenario Evidence, or HAR inspect_web_network_capture Evidence."),
			output_directory: absoluteLocalPathStringSchema.describe("Absolute, absent output directory for the bundle folder; parent must exist."),
			name: z.string().min(1).optional().describe("Env folder and env id (kebab-case). Default: the manifest's name; required when the capture's origin is a loopback or IP address."),
			template_rules: z.array(z.enum(TEMPLATE_RULES)).optional().describe("Opt-in template rules, each at most once; [] applies only the format rules. Default: after-uid-literal, opaque-token, sibling-variance and prefix-variance."),
			package_tarball: absoluteLocalPathStringSchema.optional().describe("Absolute path of a packed rea-agents tarball the bundle installs instead of the registry package of this version."),
			dry_run: z.boolean().default(false).describe("Report what the bundle would hold without writing anything.")
		});
		environmentBuildReportSchema = z.strictObject({
			status: z.enum(["built", "planned"]),
			directory: z.string().nullable(),
			name: z.string(),
			capture: z.strictObject({
				evidence_id: prefixedDigestSchema("ev"),
				operation: z.string(),
				records: z.int().nonnegative(),
				input: z.enum(["har", "evidence"])
			}),
			manifest: z.strictObject({
				evidence_id: prefixedDigestSchema("ev"),
				tools: z.int().nonnegative(),
				excluded_groups: z.int().nonnegative(),
				template_rules: z.array(z.enum(TEMPLATE_RULES))
			}),
			state: z.union([z.strictObject({
				served: z.literal(true),
				evidence_id: z.string()
			}), z.strictObject({
				served: z.literal(false),
				reason: z.literal("unavailable"),
				code: z.string(),
				message: z.string()
			})]).describe("Whether the bundle serves from the derived state, or replays and why."),
			coverage: environmentCoverageSchema.nullable().describe("Read tools answered from the state or replayed, and write tools served or withheld; null when the bundle serves replay."),
			tool_count: z.int().nonnegative(),
			package_source: z.union([z.strictObject({
				kind: z.literal("registry"),
				specifier: z.string()
			}), z.strictObject({
				kind: z.literal("tarball"),
				path: z.string()
			})]),
			files: z.array(z.strictObject({
				path: z.string(),
				bytes: z.int().nonnegative()
			})),
			warnings: z.array(z.strictObject({
				code: z.enum([
					"name-from-file",
					"credential-named-members",
					"credential-scan-incomplete"
				]),
				message: z.string(),
				pointers: z.array(z.string()).describe("Where the warning applies, such as record pointers; never values.")
			})),
			next: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/contracts/environmentToolContracts.js
var ENVIRONMENT_TOOL_CONTRACTS;
function init_environmentToolContracts() {
	return (init_environmentToolContracts = __esmMin((() => {
		init_environmentBundleExport();
		init_toolEffects();
		ENVIRONMENT_TOOL_CONTRACTS = [{
			name: "export_environment_bundle",
			...toolContractMetadata("export_environment_bundle"),
			description: "Write an agent environment bundle folder from capture Evidence (capture_browser_scenario, or HAR inspect_web_network_capture Evidence) into an absent absolute output_directory whose parent exists, as rea environment-build does. It projects the environment manifest with the default template rules, derives the state the bundle serves, and reports read tools answered from the state or replayed with their reason, and write tools served or withheld with a hint about what to record next; check the same coverage first with inspect_analysis_view view environment-coverage. dry_run reports without writing. The bundle copies the capture Evidence byte for byte, recorded response bodies included, and its README names how the agentenv framework uses it. Reads that Evidence, and package_tarball when given, and writes only that folder; no network access. dry_run still checks output_directory. Destination refusals name this tool; the others name their stage as environment-build's do.",
			kind: "application",
			inputSchema: exportEnvironmentBundleInputSchema,
			outputSchema: environmentBuildReportSchema,
			examples: [{
				title: "Write the bundle for a retained browser scenario capture",
				input: {
					source: {
						kind: "retained-evidence",
						evidence_id: "ev_0000000000000000000000000000000000000000000000000000000000000001"
					},
					output_directory: "/tmp/grafana-env",
					name: "grafana"
				}
			}, {
				title: "Check what a capture file's bundle would serve",
				input: {
					source: {
						kind: "evidence-file",
						path: "/tmp/grafana.capture.json"
					},
					output_directory: "/tmp/grafana-env",
					dry_run: true
				}
			}]
		}];
	})))();
}

//#endregion
//#region dist/contracts/toolContracts.js
var TOOL_CONTRACTS, toolContract;
function init_toolContracts() {
	return (init_toolContracts = __esmMin((() => {
		init_analysisSettingsContracts();
		init_gpuToolContracts();
		init_captureToolContracts();
		init_signalToolContracts();
		init_wasmToolContracts();
		init_apkSignatureToolContracts();
		init_evmToolContracts();
		init_desktopApplicationToolContracts();
		init_goToolContracts();
		init_modelToolContracts();
		init_il2cppToolContracts();
		init_rustToolContracts();
		init_pythonPycToolContracts();
		init_beamToolContracts();
		init_sqliteToolContracts();
		init_analysisViewToolContracts();
		init_binaryDiagnosticsToolContracts();
		init_nativeToolContracts();
		init_artifactToolContracts();
		init_managedToolContracts();
		init_firmwareToolContracts();
		init_androidToolContracts();
		init_apktoolToolContracts();
		init_pcapToolContracts();
		init_flutterToolContracts();
		init_jebToolContracts();
		init_adbToolContracts();
		init_managedWorkflowToolContracts();
		init_browserProviderToolContracts();
		init_electronToolContracts();
		init_javascriptRuntimeObservationToolContracts();
		init_applicationToolContracts();
		init_webScriptToolContracts();
		init_webRuntimeToolContracts();
		init_webNetworkCaptureToolContracts();
		init_javascriptRecoveryToolContracts();
		init_officialToolContracts();
		init_enhancedToolContracts();
		init_sessionToolContracts();
		init_cutterToolContracts();
		init_reverseEngineeringToolContracts();
		init_gdbToolContracts();
		init_rizinDebugToolContracts();
		init_fridaToolContracts();
		init_environmentToolContracts();
		TOOL_CONTRACTS = [
			...ANALYSIS_SETTINGS_TOOL_CONTRACTS,
			...OFFICIAL_TOOL_CONTRACTS,
			...ENHANCED_TOOL_CONTRACTS,
			...NATIVE_TOOL_CONTRACTS,
			...BINARY_DIAGNOSTICS_TOOL_CONTRACTS,
			...ANALYSIS_VIEW_TOOL_CONTRACTS,
			...ARTIFACT_TOOL_CONTRACTS,
			...DESKTOP_APPLICATION_TOOL_CONTRACTS,
			...EVM_TOOL_CONTRACTS,
			...GO_TOOL_CONTRACTS,
			...IL2CPP_TOOL_CONTRACTS,
			...MODEL_TOOL_CONTRACTS,
			...GPU_TOOL_CONTRACTS,
			...RUST_TOOL_CONTRACTS,
			...PYTHON_PYC_TOOL_CONTRACTS,
			...ERLANG_BEAM_TOOL_CONTRACTS,
			...WASM_TOOL_CONTRACTS,
			...APK_SIGNATURE_TOOL_CONTRACTS,
			...SQLITE_TOOL_CONTRACTS,
			...CAPTURE_TOOL_CONTRACTS,
			...SIGNAL_TOOL_CONTRACTS,
			...MANAGED_TOOL_CONTRACTS,
			...ANDROID_TOOL_CONTRACTS,
			...APKTOOL_TOOL_CONTRACTS,
			...PCAP_TOOL_CONTRACTS,
			...FLUTTER_TOOL_CONTRACTS,
			...JEB_TOOL_CONTRACTS,
			...ADB_TOOL_CONTRACTS,
			...FIRMWARE_TOOL_CONTRACTS,
			...MANAGED_WORKFLOW_TOOL_CONTRACTS,
			...BROWSER_PROVIDER_TOOL_CONTRACTS,
			...ELECTRON_TOOL_CONTRACTS,
			...JAVASCRIPT_RUNTIME_OBSERVATION_TOOL_CONTRACTS,
			...APPLICATION_TOOL_CONTRACTS,
			...WEB_SCRIPT_TOOL_CONTRACTS,
			...WEB_RUNTIME_TOOL_CONTRACTS,
			...WEB_NETWORK_CAPTURE_TOOL_CONTRACTS,
			...ENVIRONMENT_TOOL_CONTRACTS,
			...JAVASCRIPT_RECOVERY_TOOL_CONTRACTS,
			...SESSION_TOOL_CONTRACTS,
			...CUTTER_TOOL_CONTRACTS,
			...REVERSE_ENGINEERING_TOOL_CONTRACTS,
			...GDB_TOOL_CONTRACTS,
			...RIZIN_DEBUG_TOOL_CONTRACTS,
			...FRIDA_TOOL_CONTRACTS
		];
		toolContract = (name) => {
			const contract = TOOL_CONTRACTS.find((candidate) => candidate.name === name);
			if (contract === undefined) throw new Error(`Missing tool contract: ${name}`);
			return contract;
		};
	})))();
}

//#endregion
export { ENHANCED_TOOL_CONTRACTS, TOOL_CONTRACTS, init_enhancedToolContracts, init_toolContracts, toolContract };