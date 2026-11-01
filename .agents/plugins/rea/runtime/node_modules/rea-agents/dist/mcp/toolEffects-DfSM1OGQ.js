import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as jsonValueSchema, n as init_jsonValue } from "./jsonValue-CvnZ7JX6.js";
import { z } from "zod";

//#region dist/contracts/providerSelection.js
var analysisProviderIdSchema, analysisProviderSelectorSchema, PROVIDER_REJECTION_CODES;
function init_providerSelection() {
	return (init_providerSelection = __esmMin((() => {
		analysisProviderIdSchema = z.string().min(1).regex(/^[a-z][a-z0-9\x2d]*$/u).refine((value) => value !== "auto", { message: "auto is reserved for provider selection" });
		analysisProviderSelectorSchema = z.union([z.literal("auto"), analysisProviderIdSchema]);
		PROVIDER_REJECTION_CODES = [
			"not_configured",
			"executable_missing",
			"runtime_missing",
			"runtime_unavailable",
			"unsupported_host",
			"unsupported_version",
			"target_kind_unsupported",
			"target_format_unsupported",
			"architecture_unsupported",
			"target_role_unsupported",
			"managed_target_unsupported",
			"open_options_invalid",
			"version_unresolved"
		];
	})))();
}

//#endregion
//#region dist/domain/analysisErrorRecovery.js
var analysisErrorRecoverySchema;
function init_analysisErrorRecovery() {
	return (init_analysisErrorRecovery = __esmMin((() => {
		analysisErrorRecoverySchema = z.discriminatedUnion("kind", [z.object({
			kind: z.literal("inspect_input_contract"),
			operation: z.string().min(1)
		}).strict(), z.object({
			kind: z.literal("inspect_timeout_state"),
			operation: z.string().min(1),
			timeout_ms: z.number().int().positive()
		}).strict()]);
	})))();
}

//#endregion
//#region dist/contracts/errorSchemas.js
var categorySchema, remediationSchema, common, genericDetails, generic, analysisErrorProjectionSchema, analysisCliErrorEnvelopeSchema, analysisErrorJsonSchema;
function init_errorSchemas() {
	return (init_errorSchemas = __esmMin((() => {
		init_analysisErrorRecovery();
		init_jsonValue();
		categorySchema = z.enum([
			"invalid_input",
			"unsupported_provider",
			"unsupported_target",
			"integrity_mismatch",
			"truncated",
			"cancelled",
			"timeout",
			"resource_constraint",
			"unavailable",
			"execution_failure"
		]);
		remediationSchema = z.object({ action: z.string().min(1) }).strict();
		common = {
			category: categorySchema,
			message: z.string().min(1),
			retryable: z.boolean(),
			remediation: remediationSchema,
			recovery: analysisErrorRecoverySchema.optional()
		};
		genericDetails = z.record(z.string(), jsonValueSchema).optional();
		generic = (code) => z.object({
			code: z.literal(code),
			...common,
			details: genericDetails
		}).strict();
		analysisErrorProjectionSchema = z.discriminatedUnion("code", [
			generic("invalid_request"),
			generic("access_denied"),
			generic("artifact_changed"),
			generic("unreadable_output"),
			generic("capability_unavailable"),
			generic("unsupported_target"),
			generic("provider_unavailable"),
			generic("provider_timeout"),
			generic("resource_constraint"),
			generic("cancelled"),
			z.object({
				code: z.literal("artifact_integrity_mismatch"),
				...common,
				details: z.union([z.strictObject({
					logical_path: z.string(),
					declared_sha256: z.string().nullable(),
					calculated_sha256: z.string().nullable(),
					unpacked: z.boolean()
				}), z.strictObject({
					logical_path: z.string(),
					algorithm: z.literal("md5"),
					declared_md5: z.string().regex(/^[a-f0-9]{32}$/u),
					calculated_md5: z.string().regex(/^[a-f0-9]{32}$/u).nullable(),
					unpacked: z.boolean()
				})])
			}).strict(),
			generic("artifact_operation_failed"),
			generic("evidence_integrity_mismatch"),
			generic("truncated"),
			generic("process_capture_failed"),
			generic("cleanup_incomplete"),
			generic("revision_conflict"),
			generic("configuration_invalid"),
			generic("target_unavailable"),
			generic("execution_failure")
		]);
		analysisCliErrorEnvelopeSchema = z.object({
			error: z.string().min(1),
			input_path: z.string().optional(),
			input_reason: z.enum([
				"invalid-json",
				"read-failed",
				"too-large"
			]).optional()
		}).passthrough().superRefine((value, context) => {
			const { error: _label, input_path: _inputPath, input_reason: _inputReason, ...projection } = value;
			const parsed = analysisErrorProjectionSchema.safeParse(projection);
			if (!parsed.success) {
				context.addIssue({
					code: "custom",
					message: "CLI error envelope must contain a canonical analysis error projection"
				});
			}
		});
		analysisErrorJsonSchema = z.toJSONSchema(analysisErrorProjectionSchema);
	})))();
}

//#endregion
//#region dist/contracts/toolEffects.js
var effects, evidence, nativeEvidence, browserEvidence, sessionEvidence, TOOL_EFFECTS, annotationsFromEffects, TARGET_CONTENT_FREE_TOOLS, toolReturnsTargetContent, toolContractMetadata;
function init_toolEffects() {
	return (init_toolEffects = __esmMin((() => {
		effects = (overrides = {}) => ({
			mutatesTarget: false,
			mutatesSession: false,
			writesFilesystem: false,
			launchesProcess: false,
			accessesNetwork: false,
			changesUiState: false,
			mayDiscardData: false,
			executesForeignCode: false,
			mutatesDevice: false,
			idempotent: true,
			...overrides
		});
		evidence = effects({ mutatesSession: true });
		nativeEvidence = effects({
			mutatesSession: true,
			launchesProcess: true
		});
		browserEvidence = effects({
			mutatesSession: true,
			accessesNetwork: true
		});
		sessionEvidence = effects({ mutatesSession: true });
		TOOL_EFFECTS = {
			inspect_analysis_settings: effects(),
			update_analysis_settings: effects({ mutatesSession: true }),
			list_cutter_sessions: effects({ accessesNetwork: true }),
			cutter_command: effects({
				mutatesTarget: true,
				executesForeignCode: true,
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				idempotent: false
			}),
			inspect_with_objdump: effects({
				mutatesSession: true,
				launchesProcess: true
			}),
			start_gdb_session: effects({
				launchesProcess: true,
				mutatesSession: true,
				idempotent: false
			}),
			gdb_console: effects({
				mutatesTarget: true,
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			gdb_session_status: effects(),
			start_rizin_debug_session: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				executesForeignCode: true,
				idempotent: false
			}),
			rizin_debug_command: effects({
				mutatesTarget: true,
				mutatesSession: true,
				executesForeignCode: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				mayDiscardData: true,
				idempotent: false
			}),
			rizin_debug_session_status: effects({ mutatesSession: true }),
			close_rizin_debug_session: effects({
				mutatesSession: true,
				launchesProcess: true,
				mutatesTarget: true,
				executesForeignCode: true
			}),
			close_gdb_session: effects({
				launchesProcess: true,
				mutatesSession: true,
				mutatesTarget: true,
				executesForeignCode: true,
				idempotent: false
			}),
			execute_rizin_command: effects({
				mutatesTarget: true,
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				mayDiscardData: true,
				executesForeignCode: true,
				idempotent: false
			}),
			inspect_desktop_application: evidence,
			inspect_go_binary: evidence,
			inspect_il2cpp_metadata: evidence,
			inspect_model_artifact: evidence,
			inspect_gpu_code_objects: evidence,
			inspect_rust_binary: evidence,
			inspect_apk_signature: evidence,
			inspect_python_pyc: evidence,
			inspect_erlang_beam: evidence,
			inspect_sqlite_database: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			inspect_packet_fields: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_packet_capture: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_signal_decoders: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			decode_signal_recording: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_wasm_artifact: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			inspect_evm_interface: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			inspect_web_network_capture: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			observe_web_execution: effects({
				mutatesTarget: true,
				mutatesSession: true,
				accessesNetwork: true,
				mayDiscardData: true,
				idempotent: false
			}),
			inspect_web_event_listeners: browserEvidence,
			trace_web_source_location: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			trace_web_module_imports: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			inspect_recorded_crash: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			inspect_binary_layout: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			list_frida_devices: effects({
				launchesProcess: true,
				accessesNetwork: true
			}),
			list_frida_processes: effects({
				launchesProcess: true,
				accessesNetwork: true
			}),
			start_frida_session: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				idempotent: false
			}),
			load_frida_script: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			resume_frida_session: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			unload_frida_script: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				idempotent: false
			}),
			frida_session_status: evidence,
			close_frida_session: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			instrument_with_frida: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			inspect_byte_entropy: evidence,
			inspect_pe_resources: evidence,
			inspect_pe_certificates: evidence,
			inspect_pe_imports: evidence,
			inspect_native_exports: evidence,
			inspect_elf_notes: evidence,
			inspect_apple_ips: evidence,
			inspect_devicetree: evidence,
			inspect_kernel_module: evidence,
			inspect_pe_load_config: evidence,
			inspect_analysis_view: evidence,
			inspect_firmware_regions: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			extract_firmware: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				idempotent: false
			}),
			inspect_android_package: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_pcap_client: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_pcap_capture: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			identify_flutter_build: effects({
				mutatesSession: true,
				writesFilesystem: true
			}),
			inspect_dart_aot: effects({
				mutatesSession: true,
				writesFilesystem: true
			}),
			inspect_apktool_client: effects({
				mutatesSession: true,
				launchesProcess: true
			}),
			decode_android_resources: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_jeb_client: effects({
				mutatesSession: true,
				accessesNetwork: true
			}),
			open_jeb_project: effects({
				mutatesSession: true,
				accessesNetwork: true,
				idempotent: false
			}),
			list_jeb_units: effects({
				mutatesSession: true,
				accessesNetwork: true
			}),
			decompile_jeb_item: effects({
				mutatesSession: true,
				accessesNetwork: true
			}),
			inspect_adb_client: effects({
				mutatesSession: true,
				launchesProcess: true
			}),
			list_adb_devices: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			inspect_adb_device: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			list_adb_packages: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			pull_adb_package: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				accessesNetwork: true,
				idempotent: false
			}),
			read_adb_logcat: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			inspect_adb_package: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			pull_adb_file: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				accessesNetwork: true,
				idempotent: false
			}),
			push_adb_file: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			capture_adb_screen: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				accessesNetwork: true,
				idempotent: false
			}),
			list_adb_processes: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			list_adb_directory: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			list_adb_features: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			list_adb_services: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			inspect_adb_display: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			inspect_adb_window: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			read_adb_setting: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			collect_adb_bugreport: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				accessesNetwork: true,
				idempotent: false
			}),
			resolve_adb_packages: effects({
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true
			}),
			install_adb_package: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			uninstall_adb_package: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			start_adb_app: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			start_adb_activity: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			stop_adb_app: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				mutatesDevice: true,
				idempotent: false
			}),
			search_android_classes: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_android_class: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			inspect_android_method: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			trace_android_references: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			annotate_native_function: effects({
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true,
				mayDiscardData: true
			}),
			inspect_native_load_image: evidence,
			inspect_native_dispatch_metadata: evidence,
			trace_native_ui_action: evidence,
			trace_native_values: evidence,
			address_name: evidence,
			comment: evidence,
			current_address: evidence,
			current_procedure: evidence,
			current_document: evidence,
			goto_address: effects({
				mutatesSession: true,
				changesUiState: true
			}),
			inline_comment: evidence,
			list_bookmarks: evidence,
			list_documents: evidence,
			list_names: evidence,
			list_procedures: evidence,
			list_segments: evidence,
			list_strings: evidence,
			next_address: evidence,
			prev_address: evidence,
			procedure_address: evidence,
			procedure_assembly: evidence,
			procedure_callees: evidence,
			procedure_callers: evidence,
			procedure_info: evidence,
			read_function_instructions: evidence,
			inspect_native_instruction: evidence,
			inspect_native_data_type: evidence,
			resolve_native_call_targets: evidence,
			read_bytes: evidence,
			search_bytes: evidence,
			address_to_file_offset: evidence,
			procedure_references: evidence,
			procedure_pseudo_code: evidence,
			resolve_containing_procedure: evidence,
			search_procedures: evidence,
			search_strings: evidence,
			set_address_name: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			set_addresses_names: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			set_bookmark: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			set_comment: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			set_inline_comment: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			unset_bookmark: effects({
				mutatesTarget: true,
				mutatesSession: true,
				mayDiscardData: true
			}),
			xrefs: evidence,
			get_objc_classes: evidence,
			get_objc_protocols: evidence,
			batch_decompile: evidence,
			decompile_all: effects({
				mutatesSession: true,
				writesFilesystem: true,
				idempotent: false
			}),
			get_call_graph: evidence,
			analyze_swift_types: evidence,
			find_xrefs_to_name: evidence,
			binary_overview: evidence,
			analyze_function: evidence,
			inspect_native_api: effects({
				mutatesSession: true,
				idempotent: false
			}),
			trace_feature: effects({
				mutatesSession: true,
				idempotent: false
			}),
			trace_call_path: effects({
				mutatesSession: true,
				idempotent: false
			}),
			observe_native_ui: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			capture_native_ui_scenario: effects({
				writesFilesystem: true,
				mutatesTarget: true,
				mutatesSession: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				mayDiscardData: true,
				executesForeignCode: true,
				idempotent: false
			}),
			observe_native_calls: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				executesForeignCode: true,
				idempotent: false
			}),
			inspect_macho: nativeEvidence,
			inspect_signature: {
				...nativeEvidence,
				writesFilesystem: true
			},
			inspect_plist: nativeEvidence,
			list_architectures: nativeEvidence,
			demangle_swift: nativeEvidence,
			inspect_artifact: effects({
				mutatesSession: true,
				launchesProcess: true,
				writesFilesystem: true
			}),
			extract_artifact: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				idempotent: false
			}),
			decode_interface_builder: evidence,
			inspect_asset_catalog: nativeEvidence,
			inspect_keyed_archive: evidence,
			trace_dylib_resolution: evidence,
			inspect_managed_artifact: evidence,
			inspect_managed_members: evidence,
			inspect_managed_native_boundaries: evidence,
			compare_managed_members: sessionEvidence,
			verify_managed_native_boundaries: sessionEvidence,
			import_managed_reconstruction: sessionEvidence,
			project_managed_application_graph: sessionEvidence,
			list_browser_targets: browserEvidence,
			inspect_web_page: browserEvidence,
			analyze_web_bundle: effects({
				...browserEvidence,
				launchesProcess: true,
				writesFilesystem: true
			}),
			observe_web_session: browserEvidence,
			discover_webmcp_tools: browserEvidence,
			compare_web_captures: sessionEvidence,
			capture_web_screenshot: browserEvidence,
			compare_web_screenshots: sessionEvidence,
			capture_browser_scenario: effects({
				mutatesTarget: true,
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				mayDiscardData: true,
				executesForeignCode: true,
				idempotent: false
			}),
			list_electron_targets: browserEvidence,
			inspect_electron_page: browserEvidence,
			capture_electron_scenario: effects({
				mutatesTarget: true,
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				changesUiState: true,
				mayDiscardData: true,
				executesForeignCode: true,
				idempotent: false
			}),
			list_javascript_runtime_targets: browserEvidence,
			observe_javascript_runtime: browserEvidence,
			analyze_javascript_application: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true
			}),
			inspect_electron_fuses: evidence,
			export_web_scripts: effects({
				mutatesSession: true,
				writesFilesystem: true,
				idempotent: false
			}),
			export_environment_bundle: effects({
				writesFilesystem: true,
				idempotent: false
			}),
			reconcile_javascript_runtime: evidence,
			recover_javascript_sources: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				idempotent: false
			}),
			trace_application_feature: evidence,
			trace_javascript_semantics: evidence,
			compare_application_versions: evidence,
			compare_source_to_bundle: evidence,
			compare_javascript_export_shapes: evidence,
			build_reconstruction_obligation_ledger: evidence,
			evaluate_reconstruction_coverage: effects(),
			project_android_application_graph: evidence,
			project_apple_application_graph: evidence,
			project_harmony_application_graph: evidence,
			open_binary: effects({
				mutatesSession: true,
				launchesProcess: true
			}),
			open_bundle_resources: effects({ mutatesSession: true }),
			close_binary: effects({
				mutatesSession: true,
				writesFilesystem: true,
				mayDiscardData: true,
				idempotent: false
			}),
			binary_session: effects({ launchesProcess: true }),
			export_evidence_bundle: effects({
				writesFilesystem: true,
				mayDiscardData: true
			}),
			get_evidence_bundle: effects(),
			get_navigation_context: effects({ mutatesSession: true }),
			inspect_address_context: effects({ mutatesSession: true }),
			import_evidence_bundle: effects({ mutatesSession: true }),
			capture_process_scenario: effects({
				mutatesSession: true,
				writesFilesystem: true,
				launchesProcess: true,
				accessesNetwork: true,
				executesForeignCode: true,
				idempotent: false
			}),
			compare_process_captures: sessionEvidence,
			compare_artifacts: sessionEvidence,
			compare_wasm_interfaces: sessionEvidence,
			compare_functions: sessionEvidence,
			match_native_functions: sessionEvidence,
			compare_bundles: effects({ mutatesSession: true }),
			find_changed_behavior: sessionEvidence,
			build_call_path: sessionEvidence,
			correlate_static_and_runtime: sessionEvidence,
			verify_reconstruction: sessionEvidence,
			list_unknowns: effects(),
			record_unknown: effects({
				mutatesSession: true,
				idempotent: false
			}),
			update_unknown: effects({
				mutatesSession: true,
				idempotent: false
			}),
			verify_unknown_resolution: effects()
		};
		annotationsFromEffects = (value) => ({
			readOnlyHint: !(value.mutatesTarget || value.mutatesSession || value.writesFilesystem || value.launchesProcess || value.accessesNetwork || value.changesUiState || value.mayDiscardData || value.executesForeignCode || value.mutatesDevice),
			destructiveHint: value.mayDiscardData || value.executesForeignCode || value.mutatesDevice,
			idempotentHint: value.idempotent,
			openWorldHint: value.launchesProcess || value.accessesNetwork
		});
		TARGET_CONTENT_FREE_TOOLS = new Set([
			"inspect_analysis_settings",
			"update_analysis_settings",
			"export_evidence_bundle",
			"record_unknown"
		]);
		toolReturnsTargetContent = (name) => !TARGET_CONTENT_FREE_TOOLS.has(name);
		toolContractMetadata = (name) => {
			const audited = TOOL_EFFECTS[name];
			if (audited === undefined) throw new Error(`Missing effect audit for ${name}`);
			return {
				title: name.split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" "),
				effects: audited,
				annotations: annotationsFromEffects(audited),
				returnsTargetContent: toolReturnsTargetContent(name)
			};
		};
	})))();
}

//#endregion
export { analysisErrorProjectionSchema as a, analysisProviderIdSchema as c, toolReturnsTargetContent as i, analysisProviderSelectorSchema as l, init_toolEffects as n, init_errorSchemas as o, toolContractMetadata as r, PROVIDER_REJECTION_CODES as s, annotationsFromEffects as t, init_providerSelection as u };