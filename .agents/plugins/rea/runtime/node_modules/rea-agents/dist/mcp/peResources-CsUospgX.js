import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { a as DEFAULT_REGEX_MATCHING_DEADLINE_MS, c as MAXIMUM_REGEX_MATCHING_DEADLINE_MS, d as MAX_PROVIDER_STARTUP_TIMEOUT_MS, f as init_analysisResourceLimits, i as DEFAULT_JADX_OPERATION_TIMEOUT_MS, l as MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB, n as DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS, o as MAXIMUM_ASAR_MAX_HEADER_BYTES, r as DEFAULT_HOPPER_STARTUP_TIMEOUT_MS, s as MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB, t as DEFAULT_ASAR_MAX_HEADER_BYTES, u as MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS } from "./analysisResourceLimits-21fD6Kv8.js";
import { n as init_localPath, t as absoluteLocalPathStringSchema } from "./localPath-BCKW5wEI.js";
import { ao as init_wasmArtifact, io as MAX_WASM_COMMAND_TIMEOUT_MS, ro as DEFAULT_WASM_COMMAND_TIMEOUT_MS } from "./toolOutputSchemaGroups-BS_G8lPZ.js";
import { A as init_javascriptAnalysisResourceControls, C as JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS, k as JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM } from "./pngHeader-UZyQmuts.js";
import { z } from "zod";

//#region dist/domain/analysisSettingDefinitions.js
var timer, ANALYSIS_SETTINGS, analysisSettingIds, analysisSettingIdSchema, analysisSettingDefinition, analysisSettingValueSchema, analysisSettingLimit;
function init_analysisSettingDefinitions() {
	return (init_analysisSettingDefinitions = __esmMin((() => {
		init_analysisResourceLimits();
		init_javascriptAnalysisResourceControls();
		init_wasmArtifact();
		timer = {
			minimum: 1,
			maximum: MAX_PROVIDER_STARTUP_TIMEOUT_MS,
			unit: "ms",
			appliesAt: "next_operation"
		};
		ANALYSIS_SETTINGS = {
			"asar.max_header_bytes": {
				environment: "REA_ASAR_MAX_HEADER_BYTES",
				defaultValue: DEFAULT_ASAR_MAX_HEADER_BYTES,
				minimum: 1,
				maximum: MAXIMUM_ASAR_MAX_HEADER_BYTES,
				unit: "bytes",
				appliesAt: "next_operation",
				provider: "rea-artifact-graph",
				relatedProviders: [
					"rea-javascript-application",
					"rea-cdp-electron",
					"rea-v8-inspector"
				],
				operations: [
					"open_binary",
					"inspect_artifact",
					"inventory_artifact",
					"extract_artifact",
					"analyze_javascript_application",
					"inspect_electron_page",
					"observe_javascript_runtime"
				]
			},
			"ghidra.startup_timeout_ms": {
				...timer,
				environment: "REA_GHIDRA_STARTUP_TIMEOUT_MS",
				defaultValue: DEFAULT_GHIDRA_STARTUP_TIMEOUT_MS,
				appliesAt: "next_startup",
				provider: "ghidra",
				operations: [
					"binary_overview",
					"list_documents",
					"list_procedures",
					"search_procedures",
					"list_strings",
					"search_strings",
					"procedure_pseudo_code",
					"procedure_assembly",
					"analyze_function",
					"decompile_all",
					"trace_native_values"
				]
			},
			"hopper.startup_timeout_ms": {
				...timer,
				environment: "REA_HOPPER_STARTUP_TIMEOUT_MS",
				defaultValue: DEFAULT_HOPPER_STARTUP_TIMEOUT_MS,
				appliesAt: "next_startup",
				provider: "hopper",
				operations: [
					"binary_overview",
					"list_documents",
					"list_procedures",
					"search_procedures",
					"list_strings",
					"search_strings",
					"procedure_pseudo_code",
					"procedure_assembly",
					"analyze_function",
					"decompile_all",
					"trace_native_values"
				]
			},
			"ghidra.decompile_timeout_seconds": {
				environment: "REA_GHIDRA_DECOMPILE_TIMEOUT_SECONDS",
				defaultValue: null,
				minimum: 1,
				maximum: MAX_GHIDRA_DECOMPILE_TIMEOUT_SECONDS,
				unit: "seconds",
				appliesAt: "next_operation",
				provider: "ghidra",
				operations: [
					"procedure_pseudo_code",
					"analyze_function",
					"decompile_all",
					"trace_native_values"
				]
			},
			"jadx.operation_timeout_ms": {
				...timer,
				environment: "REA_JADX_OPERATION_TIMEOUT_MS",
				defaultValue: DEFAULT_JADX_OPERATION_TIMEOUT_MS,
				provider: "jadx",
				operations: [
					"inspect_android_package",
					"search_android_classes",
					"inspect_android_class",
					"inspect_android_method",
					"trace_android_references"
				]
			},
			"regex.matching_deadline_ms": {
				...timer,
				environment: "REA_REGEX_MATCHING_DEADLINE_MS",
				defaultValue: DEFAULT_REGEX_MATCHING_DEADLINE_MS,
				maximum: MAXIMUM_REGEX_MATCHING_DEADLINE_MS,
				provider: "regex",
				relatedProviders: [
					"ida",
					"hopper",
					"kuna"
				],
				operations: ["search_strings", "search_procedures"]
			},
			"regex.worker_heap_request_mib": {
				environment: "REA_REGEX_WORKER_HEAP_REQUEST_MIB",
				defaultValue: 128,
				minimum: 7,
				maximum: MAXIMUM_REGEX_WORKER_HEAP_REQUEST_MIB,
				unit: "MiB",
				appliesAt: "next_worker",
				provider: "regex",
				relatedProviders: [
					"ida",
					"hopper",
					"kuna"
				],
				operations: ["search_strings", "search_procedures"]
			},
			"capture.decoder_old_generation_mib": {
				environment: "REA_CAPTURE_DECODER_OLD_GENERATION_MIB",
				defaultValue: 192,
				minimum: 8,
				maximum: MAXIMUM_CAPTURE_DECODER_OLD_GENERATION_MIB,
				unit: "MiB",
				appliesAt: "next_worker",
				provider: "capture",
				operations: ["inspect_web_network_capture"]
			},
			"javascript.analysis_timeout_ms": {
				...timer,
				defaultValue: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.timeoutMs,
				provider: "rea-javascript-application",
				operations: ["analyze_javascript_application"],
				parameter: "analysis_timeout_ms"
			},
			"javascript.max_heap_mb": {
				defaultValue: JAVASCRIPT_ANALYSIS_RESOURCE_DEFAULTS.heapMb,
				minimum: 128,
				maximum: JAVASCRIPT_WORKER_HEAP_MIB_MAXIMUM,
				unit: "MiB",
				appliesAt: "next_worker",
				provider: "rea-javascript-application",
				operations: ["analyze_javascript_application"],
				parameter: "max_heap_mb"
			},
			"wasm.command_timeout_ms": {
				...timer,
				defaultValue: DEFAULT_WASM_COMMAND_TIMEOUT_MS,
				maximum: MAX_WASM_COMMAND_TIMEOUT_MS,
				provider: "wabt-artifact",
				operations: ["inspect_wasm_artifact"],
				parameter: "command_timeout_ms"
			}
		};
		analysisSettingIds = Object.keys(ANALYSIS_SETTINGS);
		analysisSettingIdSchema = z.enum(analysisSettingIds);
		analysisSettingDefinition = (id) => ANALYSIS_SETTINGS[id];
		analysisSettingValueSchema = (id) => {
			const definition = analysisSettingDefinition(id);
			const number = z.number().int().min(definition.minimum).max(definition.maximum);
			return id === "ghidra.decompile_timeout_seconds" ? number.nullable() : number;
		};
		analysisSettingLimit = (setting, effective_value, source) => {
			const definition = analysisSettingDefinition(setting);
			return {
				setting,
				effective_value,
				...source === undefined ? {} : { source },
				unit: definition.unit,
				minimum: definition.minimum,
				maximum: definition.maximum,
				applies_at: definition.appliesAt,
				agent_editable: true,
				scope: "rea-runtime",
				rea_restart_required: false,
				...definition.parameter === undefined ? {} : { parameter: definition.parameter }
			};
		};
	})))();
}

//#endregion
//#region dist/domain/native/peResources.js
var uint, range, identity, MAX_INSPECT_PE_FILE_BYTES, MAX_INSPECT_PE_DIRECTORY_ENTRIES, inspectPeResourcesInputSchema, peResourcesSchema;
function init_peResources() {
	return (init_peResources = __esmMin((() => {
		init_localPath();
		uint = z.number().int().min(0).max(4294967295);
		range = z.strictObject({
			offset: uint,
			bytes: uint
		});
		identity = z.discriminatedUnion("kind", [z.strictObject({
			kind: z.literal("id"),
			id: uint
		}), z.strictObject({
			kind: z.literal("name"),
			name: z.string(),
			utf16le_hex: z.string().regex(/^(?:[0-9a-f]{4})*$/),
			location: range
		})]);
		MAX_INSPECT_PE_FILE_BYTES = 536870912;
		MAX_INSPECT_PE_DIRECTORY_ENTRIES = 65536;
		inspectPeResourcesInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a PE image"),
			max_file_bytes: z.number().int().min(64).max(MAX_INSPECT_PE_FILE_BYTES).default(67108864).describe("Maximum stable artifact bytes to read (default 64 MiB)"),
			max_entries: z.number().int().min(1).max(MAX_INSPECT_PE_DIRECTORY_ENTRIES).default(16384).describe("Maximum resource directory entries to examine; exceeding the budget fails without partial success")
		});
		peResourcesSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string().min(1),
				sha256: z.string().regex(/^[a-f0-9]{64}$/),
				bytes: uint
			}),
			format: z.enum(["pe32", "pe32-plus"]),
			machine: uint,
			directory: z.strictObject({
				rva: uint,
				location: range,
				data_directory_location: range
			}).nullable(),
			directories: z.array(z.strictObject({
				path: z.array(identity).max(2).describe("Type/name identities leading to this directory; [] for the root"),
				entry_locations: z.array(range).max(2).describe("Incoming entry file ranges corresponding to path"),
				location: range,
				characteristics: uint,
				timestamp: uint,
				major_version: uint,
				minor_version: uint,
				named_entries: uint,
				id_entries: uint
			})),
			resources: z.array(z.strictObject({
				index: uint,
				type: identity,
				name: identity,
				language: identity,
				entry_locations: z.array(range).length(3),
				data_entry_location: range,
				code_page: uint,
				reserved: uint,
				payload: z.strictObject({
					rva: uint,
					location: range,
					sha256: z.string().regex(/^[a-f0-9]{64}$/)
				})
			})),
			icon_groups: z.array(z.strictObject({
				resource_index: uint,
				images: z.array(z.strictObject({
					location: range,
					width: uint,
					height: uint,
					color_count: uint,
					reserved: uint,
					planes: uint,
					bit_count: uint,
					declared_bytes: uint,
					resource_id: uint,
					candidate_resource_indices: z.array(uint),
					same_language_resource_index: uint.nullable(),
					size_matches: z.boolean().nullable()
				}))
			})),
			coverage: z.strictObject({
				status: z.literal("complete"),
				examined_entries: uint,
				resources: uint
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
export { peResourcesSchema as a, analysisSettingIds as c, init_analysisSettingDefinitions as d, inspectPeResourcesInputSchema as i, analysisSettingLimit as l, MAX_INSPECT_PE_FILE_BYTES as n, analysisSettingDefinition as o, init_peResources as r, analysisSettingIdSchema as s, MAX_INSPECT_PE_DIRECTORY_ENTRIES as t, analysisSettingValueSchema as u };