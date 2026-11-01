import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { ArtifactInventoryValidationError, BINARY_ARCHITECTURES, WEB_NETWORK_CAPTURE_FORMATS, WEB_NETWORK_CAPTURE_LIMITS, absoluteLocalPathStringSchema, analysisInputErrorFromIssues, analysisStringSchema, applicationCoverageSchema, applicationGraphEvidenceSchema, applicationNodeIdentitySchema, applicationNodeObservationSchema, applicationNodeSchema, artifactEdgeSchema, artifactFormatMetadataSchema, artifactGraphManifestSchema, artifactInspectionResultSchema, artifactInventoryCoverageSchema, artifactNodeSchema, artifactOccurrenceSchema, artifactTraversalOmissionKindSchema, canonicalBase64Schema, canonicalJson, compareOffsetDateTimeInstants, compareUnicodeCodePoints, compositeKey, digestCanonicalValue, digestSchema, evidenceSchema, functionDossierSchema, functionFacetAvailabilitySchema, init_artifactFormatMetadata, init_artifactGraph, init_artifactInspection, init_artifactInventoryEvidence, init_binaryTargetTypes, init_canonicalDigest, init_canonicalOrdering, init_comparisonSemantics, init_digests, init_evidence, init_evidenceReference, init_hopperValues, init_inputIssueProjection, init_javascriptApplicationAnalysis, init_javascriptApplicationEvidenceSchemas, init_javascriptApplicationGraphSchemas, init_javascriptRouteFacts, init_javascriptRouteInventory, init_javascriptSemanticGraphSchemas, init_javascriptSourceCoordinates, init_javascriptSourceSelection, init_javascriptStaticCoverage, init_jsonShape, init_jsonValueByteLength, init_localPath, init_managedArtifact, init_nativeDeadlines, init_offsetDateTime, init_protobufWire, init_qlogCapture, init_recordedTransportUrl, init_safeJson, init_sourceToBundleComparisonSchemas, init_stringPatterns, init_unicodeCodePointOrder, init_wasmArtifact, init_webNetworkCapture, integrityContradictionSchema, isMachOFormat, iterateUrlQueryParameters, javaScriptInventoryRouteSchema, javaScriptRouteCaptureOmissionSchema, javaScriptRouteGapSchema, javaScriptRouteInventorySchema, javaScriptRouteInventorySourceSchema, javaScriptRouteMechanismSchema, javaScriptRouteOccurrenceSchema, javaScriptSemanticGraphInputSchema, javaScriptSourceSelectionSchema, javaScriptStaticCoverageSchema, javascriptSourceRangeSchema, jsonValueByteLength, jsonValueType, localPathStringSchema, managedArtifactInspectionSchema, managedMemberInspectionSchema, parseArtifactInspectionInventoryResult, parseArtifactInventoryResult, parseJsonObject, parseOwnedJavaScriptApplicationAnalysisSteps, parseRecordedTransportUrl, parseUrlQueryParameterNames, prefixedDigestSchema, protobufCaptureCoverageSchema, protobufDecodingObjectSchema, protobufDecodingSchema, protobufFieldSchema, protobufFrameSchema, providerSchema, pwntoolsTimeoutField, qlogCaptureFactsSchema, readRecordedDateTime, retainedEvidenceReferenceSchema, safeParseJson, safeParseOwnedWebNetworkCapture, singleQueryValues, sourceToBundleComparisonResultSchema, uniqueSorted, validateArtifactInventorySubject, wasmArtifactMatchesSubject, wasmArtifactSchema, webNetworkCaptureArtifactSchema, webNetworkCaptureBinaryDescriptorSchema, webNetworkCaptureDecoderSchema, webNetworkCaptureRecordSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { AnalysisInputError, AnalysisResourceConstraintError, AnalysisUnsupportedTargetError, MAX_JSON_DEPTH, canBorrowParsedJsonSnapshot, err, fixedAllowanceOptions, freezeOwnedJsonTreeSnapshot, init_analysisErrorCore, init_fixedAllowanceRemediation, init_immutableJson, init_jsonSerialization, init_jsonValue, init_result, isImmutableJsonSnapshot, jsonByteLength, jsonObjectSchema, jsonTextCodeUnits, jsonValueSchema, ok, ownedJsonValueSchema } from "./jsonLines-Gf10X4s1.js";
import { NATIVE_INVENTORY_OPERATIONS, addressedValueSchema, bundleResourceRootSchema, init_bundleResourceRoot, init_interfaceBuilderGraph, init_machoTargetSelection, init_nativeInventory, init_nativeInvestigationGraph, interfaceBuilderAnalysisSchema, interfaceBuilderDocumentSchema, isNativeInventoryOperation, machoSelectionContainsRange, machoSliceArchitectureSchema, machoTargetSelectionSchema, metadataReportSubjectFormat, nativeInventoryOperationSchema, nativeInventoryRowsSchemas, nativeInvestigationCoverageSchema, nativeInvestigationEdgeSchema, nativeInvestigationNodeSchema, nativeInvestigationProviderSchema, selectedSliceAgreesWithReport } from "./interfaceBuilderGraph-DKoO7eCM.js";
import { init_browserScenarioCapture, retainedBrowserScenarioCaptureSchema } from "./browserScenarioCapture-d91Wory3.js";
import { z } from "zod";
import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";
import { isSafeNumber } from "lossless-json";

//#region dist/domain/gpu/gpuCodeObjects.js
var count$5, gpuLocationSchema, gpuObjectSchema, gpuParameterSchema, gpuKernelSchema, gpuPtxArtifactSchema, gpuCodeObjectsObjectSchema, gpuCodeObjectsSchema, gpuCodeObjectsPartialSchema, gpuTargetSchema, selection$1, gpuCodeObjectsSelectionSchema, inspectGpuCodeObjectsInputSchema;
function init_gpuCodeObjects() {
	return (init_gpuCodeObjects = __esmMin((() => {
		init_digests();
		init_localPath();
		count$5 = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
		gpuLocationSchema = z.strictObject({
			container_id: z.string().nullable(),
			offset: count$5,
			size: count$5,
			section_index: count$5.nullable(),
			section_name: z.string().nullable()
		});
		gpuObjectSchema = z.strictObject({
			id: z.string(),
			parent_id: z.string().nullable(),
			kind: z.enum([
				"cuda-fatbin",
				"hip-bundle",
				"native-section",
				"ptx",
				"cubin",
				"amdgpu",
				"host",
				"unknown"
			]),
			target: z.string().nullable(),
			payload_target: z.string().nullable(),
			cuda_target_header: z.strictObject({
				os_abi: z.number().int().min(0).max(255),
				flags: z.string().regex(/^0x[0-9a-f]{8}$/u),
				location: gpuLocationSchema
			}).nullable(),
			target_consistency: z.enum([
				"unexamined",
				"single-source",
				"consistent",
				"base-only",
				"conflict",
				"unknown"
			]),
			bundle_id: z.string().nullable(),
			compression: z.enum([
				"none",
				"zstd",
				"zlib",
				"lz4",
				"unsupported"
			]),
			compression_id: z.string().nullable(),
			encoded_size: count$5,
			decoded_size: count$5.nullable(),
			sha256: digestSchema.nullable(),
			raw_flags: z.string().nullable(),
			location: gpuLocationSchema,
			metadata_location: gpuLocationSchema,
			inspection: z.enum([
				"inventory",
				"complete",
				"partial",
				"not-selected",
				"unsupported",
				"malformed",
				"capacity"
			]),
			limitations: z.array(z.string())
		});
		gpuParameterSchema = z.strictObject({
			ordinal: count$5,
			name: z.string().nullable(),
			offset: count$5.nullable(),
			size: count$5.nullable(),
			type: z.string().nullable(),
			hidden: z.boolean().nullable()
		});
		gpuKernelSchema = z.strictObject({
			id: z.string(),
			object_id: z.string(),
			representation: z.enum([
				"ptx-declarations",
				"cuda-elf-metadata",
				"amdgpu-metadata"
			]),
			name: z.string(),
			symbol: z.string().nullable(),
			parameter_count: count$5.nullable(),
			parameter_bytes: count$5.nullable(),
			parameters: z.array(gpuParameterSchema),
			registers: z.strictObject({
				physical: count$5.nullable(),
				sgpr: count$5.nullable(),
				vgpr: count$5.nullable(),
				agpr: count$5.nullable(),
				virtual: z.array(z.strictObject({
					type: z.string(),
					count: count$5.nullable()
				}))
			}),
			shared_bytes: count$5.nullable().describe("PTX: entry-local declared static bytes; CUDA ELF: allocated section bytes; AMDGPU: group_segment_fixed_size. Runtime dynamic/module shared allocations are not established by PTX."),
			private_bytes: count$5.nullable(),
			location: gpuLocationSchema,
			sources: z.strictObject({
				parameters: gpuLocationSchema.nullable(),
				registers: gpuLocationSchema.nullable(),
				shared: gpuLocationSchema.nullable(),
				private: gpuLocationSchema.nullable()
			}),
			limitations: z.array(z.string())
		});
		gpuPtxArtifactSchema = z.strictObject({
			id: z.string(),
			object_id: z.string(),
			sha256: digestSchema,
			media_type: z.literal("text/x-ptx"),
			encoding: z.literal("utf-8"),
			byte_length: count$5,
			text: z.string(),
			location: gpuLocationSchema
		}).superRefine((artifact, context) => {
			if (/[\uD800-\uDFFF]/u.test(artifact.text) || Buffer.byteLength(artifact.text, "utf8") !== artifact.byte_length || artifact.location.size !== artifact.byte_length) context.addIssue({
				code: "custom",
				path: ["byte_length"],
				message: "PTX text and its UTF-8 source extent disagree"
			});
			if (createHash("sha256").update(artifact.text, "utf8").digest("hex") !== artifact.sha256) context.addIssue({
				code: "custom",
				path: ["sha256"],
				message: "PTX digest does not match retained UTF-8 text"
			});
		});
		gpuCodeObjectsObjectSchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				file_size: count$5,
				sha256: digestSchema,
				bytes_read: count$5
			}),
			format: z.enum([
				"elf",
				"pe",
				"cuda-fatbin",
				"hip-bundle",
				"ptx"
			]),
			analysis: z.enum(["inventory", "kernels"]),
			objects: z.array(gpuObjectSchema),
			kernels: z.array(gpuKernelSchema),
			ptx_artifacts: z.array(gpuPtxArtifactSchema),
			coverage: z.strictObject({
				discovery_scope: z.literal("supported-section-names-and-standalone-formats"),
				discovery: z.enum(["complete", "partial"]),
				payloads: z.enum([
					"not-requested",
					"complete",
					"partial"
				]),
				examined_sections: count$5,
				unknown_section_names: count$5
			}),
			limitations: z.array(z.string())
		});
		gpuCodeObjectsSchema = gpuCodeObjectsObjectSchema.superRefine((report, context) => {
			const objects = new Map();
			const issue = (path, message) => context.addIssue({
				code: "custom",
				path,
				message
			});
			for (let index = 0; index < report.objects.length; index++) {
				const row = report.objects[index];
				if (objects.has(row.id)) issue([
					"objects",
					index,
					"id"
				], "GPU object IDs must be unique");
				if (row.parent_id !== null && !objects.has(row.parent_id)) issue([
					"objects",
					index,
					"parent_id"
				], "GPU parents must precede their children");
				if (row.location.container_id !== row.parent_id || row.metadata_location.container_id !== row.parent_id) issue([
					"objects",
					index,
					"location"
				], "GPU object ranges must use their parent's coordinate space");
				objects.set(row.id, row);
			}
			const range = (value, path) => {
				const size = value.container_id === null ? report.artifact.file_size : objects.get(value.container_id)?.decoded_size;
				if (size === undefined || size !== null && (value.offset > size || value.size > size - value.offset)) issue(path, "GPU source range is outside its declared coordinate space");
			};
			for (let index = 0; index < report.objects.length; index++) {
				const row = report.objects[index];
				range(row.location, [
					"objects",
					index,
					"location"
				]);
				range(row.metadata_location, [
					"objects",
					index,
					"metadata_location"
				]);
				const header = row.cuda_target_header;
				if (header !== null) {
					range(header.location, [
						"objects",
						index,
						"cuda_target_header",
						"location"
					]);
					if (row.kind !== "cubin" || ![52, 64].includes(header.location.size) || (header.location.container_id === row.id ? header.location.offset !== 0 : header.location.container_id !== row.parent_id || header.location.offset !== row.location.offset)) issue([
						"objects",
						index,
						"cuda_target_header"
					], "CUDA header provenance must start at its CUBIN object");
				}
			}
			const kernelIds = new Set();
			for (let index = 0; index < report.kernels.length; index++) {
				const row = report.kernels[index];
				if (kernelIds.has(row.id)) issue([
					"kernels",
					index,
					"id"
				], "GPU kernel IDs must be unique");
				kernelIds.add(row.id);
				if (!objects.has(row.object_id) || row.location.container_id !== row.object_id) issue([
					"kernels",
					index,
					"object_id"
				], "GPU kernels require an inventoried object and its coordinate space");
				range(row.location, [
					"kernels",
					index,
					"location"
				]);
				for (const [field, source] of Object.entries(row.sources)) if (source !== null) range(source, [
					"kernels",
					index,
					"sources",
					field
				]);
			}
			const artifactIds = new Set();
			for (let index = 0; index < report.ptx_artifacts.length; index++) {
				const row = report.ptx_artifacts[index];
				if (artifactIds.has(row.id)) issue([
					"ptx_artifacts",
					index,
					"id"
				], "PTX artifact IDs must be unique");
				artifactIds.add(row.id);
				if (objects.get(row.object_id)?.kind !== "ptx" || row.location.container_id !== row.object_id) issue([
					"ptx_artifacts",
					index,
					"object_id"
				], "PTX artifacts require an inventoried PTX object");
				range(row.location, [
					"ptx_artifacts",
					index,
					"location"
				]);
			}
		});
		gpuCodeObjectsPartialSchema = z.strictObject({
			kind: z.literal("gpu-code-objects-partial"),
			artifact: z.strictObject({
				path: localPathStringSchema,
				observed_file_size: count$5,
				sha256: z.null(),
				file_identity: z.literal("unverified")
			}),
			analysis: z.enum(["inventory", "kernels"]),
			objects: z.array(gpuObjectSchema),
			kernels: z.array(gpuKernelSchema),
			ptx_artifacts: z.array(gpuPtxArtifactSchema),
			coverage: z.strictObject({
				discovery: z.literal("partial"),
				payloads: z.literal("partial")
			}),
			limitations: z.array(z.string())
		});
		gpuTargetSchema = z.strictObject({
			id: z.string(),
			target: z.string().nullable(),
			confidence: z.literal("derived"),
			object_count: count$5,
			kernel_count: count$5,
			encoded_bytes: z.string().regex(/^(?:0|[1-9][0-9]*)$/u),
			decoded_bytes: z.string().regex(/^(?:0|[1-9][0-9]*)$/u).nullable(),
			kernel_coverage: z.enum([
				"not-requested",
				"complete",
				"partial"
			]),
			by_kind: z.strictObject({
				ptx: count$5,
				cubin: count$5,
				amdgpu: count$5,
				unknown: count$5
			})
		});
		selection$1 = {
			ids: z.array(z.string()).optional(),
			targets: z.array(z.string()).optional(),
			offset: count$5.default(0),
			limit: z.number().int().positive().default(32)
		};
		gpuCodeObjectsSelectionSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...selection$1,
				collection: z.literal("objects"),
				fields: z.array(gpuObjectSchema.keyof()).optional()
			}),
			z.strictObject({
				...selection$1,
				collection: z.literal("kernels"),
				object_ids: z.array(z.string()).optional(),
				names: z.array(z.string()).optional(),
				fields: z.array(gpuKernelSchema.keyof()).optional()
			}),
			z.strictObject({
				collection: z.literal("ptx"),
				object_id: z.string(),
				offset: count$5.default(0),
				limit: z.number().int().positive().default(4096)
			}),
			z.strictObject({
				...selection$1,
				collection: z.literal("targets"),
				fields: z.array(gpuTargetSchema.keyof()).optional()
			})
		]);
		inspectGpuCodeObjectsInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema,
			analysis: z.enum(["inventory", "kernels"]).default("inventory"),
			expected_sha256: digestSchema.optional().describe("Require the current full-file digest; mandatory when selecting inventory object_ids"),
			object_ids: z.array(z.string()).optional().describe("Decode only these inventory IDs; IDs are scoped to the artifact SHA-256"),
			targets: z.array(z.string()).optional().describe("Decode only exact target declarations, preserving all inventory rows"),
			detail: z.enum(["summary", "complete"]).default("summary"),
			view: gpuCodeObjectsSelectionSchema.optional()
		}).superRefine((input, context) => {
			if (input.object_ids !== undefined && input.expected_sha256 === undefined) context.addIssue({
				code: "custom",
				path: ["expected_sha256"],
				message: "object_ids require the artifact SHA-256 from their inventory"
			});
			if (input.view !== undefined && input.detail === "complete") context.addIssue({
				code: "custom",
				path: ["view"],
				message: "view requires summary detail"
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisViewErrors.js
var INSPECT_ANALYSIS_VIEW_OPERATION, analysisViewInputError;
function init_analysisViewErrors() {
	return (init_analysisViewErrors = __esmMin((() => {
		init_analysisErrorCore();
		INSPECT_ANALYSIS_VIEW_OPERATION = "inspect_analysis_view";
		analysisViewInputError = (issues) => new AnalysisInputError(INSPECT_ANALYSIS_VIEW_OPERATION, undefined, issues);
	})))();
}

//#endregion
//#region dist/domain/firmware/devicetree.js
var uint$3, MAX_DEVICETREE_FILE_BYTES, inspectDevicetreeInputSchema, devicetreePropertySchema, devicetreeNodeSchema, devicetreeSchema;
function init_devicetree() {
	return (init_devicetree = __esmMin((() => {
		init_digests();
		init_localPath();
		uint$3 = z.number().int().min(0).max(4294967295);
		MAX_DEVICETREE_FILE_BYTES = 16777216;
		inspectDevicetreeInputSchema = z.strictObject({
			path: localPathStringSchema,
			max_file_bytes: z.number().int().min(40).max(MAX_DEVICETREE_FILE_BYTES).default(4194304),
			max_nodes: z.number().int().min(1).max(65536).default(8192),
			max_properties: z.number().int().min(1).max(262144).default(32768),
			max_depth: z.number().int().min(1).max(256).default(64)
		});
		devicetreePropertySchema = z.strictObject({
			name: z.string(),
			offset: uint$3,
			bytes: uint$3,
			hex: z.string().regex(/^[0-9a-f]*$/).max(512),
			truncated: z.boolean(),
			derived: z.strictObject({
				confidence: z.literal("derived"),
				strings: z.array(z.string()).nullable(),
				cells: z.array(uint$3).nullable(),
				reg: z.array(z.strictObject({
					address: z.string().nullable(),
					size: z.string().nullable()
				})).nullable()
			})
		});
		devicetreeNodeSchema = z.strictObject({
			path: z.string(),
			parent: z.string().nullable(),
			offset: uint$3,
			properties: z.array(devicetreePropertySchema)
		});
		devicetreeSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string(),
				sha256: digestSchema,
				bytes: uint$3
			}),
			header: z.strictObject({
				magic: uint$3,
				totalsize: uint$3,
				off_dt_struct: uint$3,
				off_dt_strings: uint$3,
				off_mem_rsvmap: uint$3,
				version: uint$3,
				last_comp_version: uint$3,
				boot_cpuid_phys: uint$3,
				size_dt_strings: uint$3,
				size_dt_struct: uint$3.nullable()
			}),
			reservations: z.array(z.strictObject({
				offset: uint$3,
				address: z.string(),
				size: z.string()
			})),
			nodes: z.array(devicetreeNodeSchema),
			references: z.array(z.strictObject({
				source: z.string(),
				property: z.string(),
				phandle: uint$3,
				target: z.string().nullable(),
				confidence: z.literal("derived")
			})),
			summary: z.strictObject({
				confidence: z.literal("derived"),
				compatible: z.array(z.string()).nullable(),
				model: z.string().nullable(),
				bootargs: z.string().nullable(),
				stdout_path: z.string().nullable(),
				aliases: z.array(z.strictObject({
					name: z.string(),
					path: z.string().nullable()
				}))
			}),
			coverage: z.strictObject({
				status: z.literal("complete"),
				examined_nodes: uint$3,
				examined_properties: uint$3
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisViewParent.js
var createAnalysisViewResultReader, parseAnalysisViewResult, analysisViewResultInputError;
function init_analysisViewParent() {
	return (init_analysisViewParent = __esmMin((() => {
		init_inputIssueProjection();
		init_result();
		init_jsonValue();
		init_immutableJson();
		createAnalysisViewResultReader = (parser) => {
			const checked = new WeakMap();
			return (parent) => {
				const source = parent.normalizedResult;
				const reusable = parent.sealedResult === true && typeof source === "object" && source !== null && isImmutableJsonSnapshot(source);
				const known = reusable ? checked.get(source) : undefined;
				if (known !== undefined) return ok(known);
				const parsed = parseAnalysisViewResult(parser, parent);
				if (!parsed.ok || !reusable) return parsed;
				if (canBorrowParsedJsonSnapshot(source, parsed.value)) {
					checked.set(source, source);
					return ok(source);
				}
				const normalized = ownedJsonValueSchema.safeParse(parsed.value);
				if (!normalized.success) return parsed;
				freezeOwnedJsonTreeSnapshot(normalized.data);
				checked.set(source, parsed.value);
				return parsed;
			};
		};
		parseAnalysisViewResult = (parser, parent) => {
			const parsed = parser.safeParse(parent.normalizedResult);
			if (parsed.success) return ok(parsed.data);
			return err(analysisViewResultInputError(parent.normalizedResult, parsed.error));
		};
		analysisViewResultInputError = (input, cause) => analysisInputErrorFromIssues("inspect_analysis_view", cause.issues.map((issue) => ({
			...issue,
			path: [
				"source",
				"normalized_result",
				...issue.path
			]
		})), { source: { normalized_result: input } }, { cause });
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisViewCoverage.js
var completeWithinViewCoverage, pageViewCoverage, ANALYSIS_VIEW_MESSAGE_BYTE_LIMIT, messageWireBytes, boundedViewMessages;
function init_analysisViewCoverage() {
	return (init_analysisViewCoverage = __esmMin((() => {
		init_canonicalOrdering();
		completeWithinViewCoverage = (examined, total) => ({
			status: "complete-within-view",
			examined,
			total,
			next_offset: null,
			exhausted: true
		});
		pageViewCoverage = (offset, examined, total) => {
			const exhausted = offset >= total || offset + examined >= total;
			return {
				status: examined === 0 ? "empty" : "page",
				examined,
				total,
				next_offset: exhausted ? null : offset + examined,
				exhausted
			};
		};
		ANALYSIS_VIEW_MESSAGE_BYTE_LIMIT = 256 * 1024;
		messageWireBytes = (value) => (value.length * 18 + 6) * 3;
		boundedViewMessages = (values, parentEvidenceId, field, required = []) => {
			const priority = uniqueSorted(required);
			const unique = uniqueSorted([...priority, ...values]);
			const notice = (omitted) => `${String(omitted)} additional ${field} omitted from this view; consult source parent Evidence ${parentEvidenceId} for the complete list (the caller-supplied record, or its retaining session).`;
			const totalBytes = unique.reduce((total, value) => total + messageWireBytes(value), 0);
			if (totalBytes <= 262144) return unique;
			let remaining = ANALYSIS_VIEW_MESSAGE_BYTE_LIMIT - messageWireBytes(notice(unique.length));
			const retained = new Set();
			for (const value of [...priority, ...unique]) {
				if (retained.has(value)) continue;
				const bytes = messageWireBytes(value);
				if (bytes > remaining) continue;
				retained.add(value);
				remaining -= bytes;
			}
			const omitted = unique.length - retained.size;
			return omitted === 0 ? unique : [...uniqueSorted([...retained]), notice(omitted)];
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/devicetreeView.js
var devicetreeViewRequestSchema, sourceIndex$1, devicetreeViewItemsSchema, counts$1, devicetreeSummarySchema, devicetreePageContextSchema, readReport$4, projectDevicetreeView;
function init_devicetreeView() {
	return (init_devicetreeView = __esmMin((() => {
		init_devicetree();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		devicetreeViewRequestSchema = z.strictObject({
			kind: z.literal("devicetree"),
			collection: z.enum([
				"nodes",
				"properties",
				"reservations",
				"references"
			]),
			path: z.string().optional().describe("Exact node path; required for properties and optional for nodes"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().max(256).default(32)
		});
		sourceIndex$1 = { source_index: z.int().nonnegative() };
		devicetreeViewItemsSchema = z.union([
			z.array(devicetreeSchema.shape.nodes.element.omit({ properties: true }).extend({
				property_count: z.int().nonnegative(),
				...sourceIndex$1
			})),
			z.array(devicetreeSchema.shape.nodes.element.shape.properties.element.extend(sourceIndex$1)),
			z.array(devicetreeSchema.shape.reservations.element.extend(sourceIndex$1)),
			z.array(devicetreeSchema.shape.references.element.extend(sourceIndex$1))
		]);
		counts$1 = {
			reservation_count: z.int().nonnegative(),
			reference_count: z.int().nonnegative(),
			unresolved_reference_count: z.int().nonnegative()
		};
		devicetreeSummarySchema = devicetreeSchema.pick({
			artifact: true,
			header: true,
			summary: true,
			coverage: true
		}).extend(counts$1);
		devicetreePageContextSchema = devicetreeSchema.pick({
			artifact: true,
			header: true,
			coverage: true
		}).extend({
			...counts$1,
			alias_count: z.int().nonnegative()
		});
		readReport$4 = createAnalysisViewResultReader(devicetreeSchema);
		projectDevicetreeView = (parent, view) => {
			const invalid = (message) => err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message
			}]));
			if (view.kind !== "summary" && view.kind !== "devicetree") return invalid("Devicetree Evidence supports summary and devicetree views.");
			const parsed = readReport$4(parent);
			if (!parsed.ok) return parsed;
			const r = parsed.value;
			const context = {
				artifact: r.artifact,
				header: r.header,
				coverage: r.coverage,
				reservation_count: r.reservations.length,
				reference_count: r.references.length,
				unresolved_reference_count: r.references.filter((ref) => ref.target === null).length
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_devicetree",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: r.artifact.path,
					sha256: r.artifact.sha256
				},
				limitations: boundedViewMessages([...parent.limitations, ...r.limitations], parent.evidenceId, "limitations"),
				unknowns: ["Binding-specific references, address translation and runtime hardware state are not established."]
			};
			if (view.kind === "summary") return ok({
				...shared,
				kind: "summary",
				view,
				summary: {
					...context,
					summary: r.summary
				},
				coverage: completeWithinViewCoverage(r.nodes.length, r.nodes.length)
			});
			if (view.collection === "properties" && view.path === undefined) return invalid("A properties page requires an exact node path.");
			if (view.path !== undefined && view.collection !== "nodes" && view.collection !== "properties") return invalid("path selects only nodes or properties.");
			const nodeIndex = view.path === undefined ? -1 : r.nodes.findIndex((n) => n.path === view.path);
			const node = r.nodes[nodeIndex];
			if (view.collection === "properties" && node === undefined) return invalid("The selected node path is absent from this Evidence.");
			const page = (rows, originalIndex) => ({
				items: rows.slice(view.offset, view.offset + view.limit).map((row, i) => ({
					...row,
					source_index: originalIndex ?? view.offset + i
				})),
				total: rows.length
			});
			const selectedNodes = page(view.path === undefined ? r.nodes : node === undefined ? [] : [node], view.path === undefined ? undefined : nodeIndex);
			const selected = view.collection === "nodes" ? {
				items: selectedNodes.items.map(({ properties, ...n }) => ({
					...n,
					property_count: properties.length
				})),
				total: selectedNodes.total
			} : view.collection === "properties" ? page(node?.properties ?? []) : view.collection === "reservations" ? page(r.reservations) : page(r.references);
			const { items, total } = selected;
			return ok({
				...shared,
				kind: "devicetree",
				view,
				devicetree: {
					...context,
					alias_count: r.summary.aliases.length
				},
				items,
				coverage: pageViewCoverage(view.offset, items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/apkSignature/apkSignatureReport.js
/**
* Public contract shape for `inspect_apk_signature` and the pure signing
* posture derivation. The domain owns the schema so CLI and MCP present
* identical, validated facts. Certificate facts are plain data extracted by the
* adapter (via the platform X.509 parser); this module never parses DER itself.
*/
var certificate, digestEntry, apkSignerSchema, lineageNode, apkSignerV3Schema, v1Signer, SCHEME, apkSignatureResultSchema, apkSignatureUninterpretedBytes, APK_SIGNATURE_LIMITATIONS, setKey, signerChangeDeclared, expectedV1Certificate, v1MatchesBlockSigners, deriveApkPosture, apkSignatureMatchesSubject;
function init_apkSignatureReport() {
	return (init_apkSignatureReport = __esmMin((() => {
		init_digests();
		certificate = z.strictObject({
			sha256_fingerprint: digestSchema,
			subject: z.string().nullable(),
			issuer: z.string().nullable(),
			serial_number: z.string().nullable(),
			/** ISO 8601. */
			not_before: z.string().nullable(),
			/** ISO 8601. */
			not_after: z.string().nullable(),
			public_key_algorithm: z.string().nullable()
		}).nullable();
		digestEntry = z.strictObject({
			uninterpreted_bytes: z.int().nonnegative(),
			signature_algorithm_id: z.int().min(0).max(4294967295),
			algorithm: z.enum([
				"sha256",
				"sha512",
				"verity-sha256",
				"unknown"
			]),
			declared_digest_hex: z.string().regex(/^(?:[a-f0-9]{2})*$/),
			/**
			* Whether the DECLARED content digest equals the digest recomputed over the
			* current bytes; null when not recomputed. Not a signature verification:
			* anyone who changes the bytes can recompute and replace the declared digest.
			*/
			matches_apk: z.boolean().nullable()
		});
		apkSignerSchema = z.strictObject({
			uninterpreted_signed_data_bytes: z.int().nonnegative(),
			uninterpreted_signer_bytes: z.int().nonnegative(),
			certificate,
			digests: z.array(digestEntry),
			signatures: z.array(z.strictObject({
				signature_algorithm_id: z.int().min(0).max(4294967295),
				algorithm: digestEntry.shape.algorithm,
				signature_bytes: z.int().nonnegative(),
				uninterpreted_bytes: z.int().nonnegative()
			})),
			public_key_bytes: z.int().nonnegative(),
			min_sdk: z.number().int().nullable(),
			max_sdk: z.number().int().nullable()
		});
		lineageNode = z.strictObject({
			certificate,
			/**
			* Raw capability flags RETAINED by this node's own certificate after the
			* rotation (kept raw so unknown future bits are preserved).
			*/
			flags: z.number().int().nonnegative(),
			capabilities: z.strictObject({
				installed_data: z.boolean(),
				shared_uid: z.boolean(),
				permission: z.boolean(),
				rollback: z.boolean(),
				auth: z.boolean()
			})
		});
		apkSignerV3Schema = apkSignerSchema.extend({ 
		/**
		* The proof-of-rotation lineage the APK DECLARES, oldest signer first. Node
		* signatures are not verified. `decode_error` is set (and `lineage` empty)
		* when the attribute is present but could not be decoded.
		*/
rotation: z.strictObject({
			present: z.boolean(),
			lineage: z.array(lineageNode),
			decode_error: z.string().nullable()
		}) });
		v1Signer = z.strictObject({
			signature_file: z.string(),
			block_file: z.string(),
			/**
			* The certificate the block's one SignerInfo names (by issuerAndSerialNumber
			* or subjectKeyIdentifier), with the same facts as a v2/v3 signer. Null when
			* the block could not be decoded, has other than one SignerInfo, or its
			* SignerInfo names no certificate the block carries (identity unknown).
			*/
			certificate,
			/** Every certificate the SignedData carries, in block order. */
			certificates: z.array(z.strictObject({
				sha256_fingerprint: digestSchema,
				subject: z.string().nullable()
			})),
			signer_infos: z.array(z.strictObject({
				identified_by: z.enum(["issuer-and-serial", "subject-key-identifier"]),
				/** The named certificate's fingerprint; null when none in the block matches. */
				certificate_sha256: digestSchema.nullable(),
				digest_algorithm_oid: z.string(),
				signature_algorithm_oid: z.string()
			})),
			/** Why the block could not be read (malformed, unsupported or over a bound); never silently empty. */
			decode_error: z.string().nullable()
		});
		SCHEME = z.enum([
			"none",
			"v1",
			"v2",
			"v3",
			"v3.1"
		]);
		apkSignatureResultSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string().min(1),
				sha256: digestSchema,
				bytes: z.number().int().nonnegative()
			}),
			schemes: z.strictObject({
				v1: z.strictObject({
					/** Structural: META-INF signature files exist (not platform applicability). */
					present: z.boolean(),
					has_manifest: z.boolean(),
					signature_files: z.array(z.string()),
					block_files: z.array(z.string()),
					/** Signature blocks paired with their `.SF` file, in central-directory order. */
					signers: z.array(v1Signer)
				}),
				v2: z.strictObject({
					present: z.boolean(),
					signers: z.array(apkSignerSchema),
					uninterpreted_bytes: z.int().nonnegative()
				}),
				v3: z.strictObject({
					present: z.boolean(),
					signers: z.array(apkSignerV3Schema),
					uninterpreted_bytes: z.int().nonnegative()
				}),
				"v3.1": z.strictObject({
					present: z.boolean(),
					signers: z.array(apkSignerV3Schema),
					uninterpreted_bytes: z.int().nonnegative()
				})
			}),
			/**
			* The source stamp the APK declares (V2 block preferred over V1, as apksig
			* does). `certificate` is the declared stamp certificate; it is null when no
			* stamp is present or when `decode_error` says why it could not be read.
			* Stamp signatures are not verified.
			*/
			source_stamp: z.strictObject({
				present: z.boolean(),
				certificate,
				decode_error: z.string().nullable()
			}),
			/** Derived from the observed and declared facts above; not separately observed. */
			posture: z.strictObject({
				/**
				* v1 present and no v2/v3/v3.1 block. The v1 X-Android-APK-Signed marker
				* is not read, so this cannot distinguish a v1-only APK from one whose
				* v2/v3 block was removed.
				*/
				v1_only: z.boolean(),
				/**
				* Observed: every present block scheme (v2/v3/v3.1) presents the same set
				* of signer certificates. Null when no block scheme has a signer, or when
				* any signer carries no certificate (identity unknown).
				*/
				schemes_agree_on_signer: z.boolean().nullable(),
				/**
				* Declared: the signers differ, but every one appears in a rotation
				* lineage the APK declares. Unverified — an APK can declare any lineage.
				* Null when a signer's identity is unknown, or when the signers differ and
				* a declared lineage could not be decoded.
				*/
				signer_change_declared_by_rotation: z.boolean().nullable(),
				/**
				* Observed: the set of v1 signer certificates equals what the lowest
				* present block scheme with signers (v2, else v3, else v3.1) expects v1 to
				* carry: its signer set, or, for a v3/v3.1 signer that declares a rotation
				* lineage, that lineage's first (original) certificate, as apksig requires.
				* False is notable: the JAR signature names a different key. Null when v1
				* or a block scheme is absent, any signer's identity is unknown
				* (including a v1 SignerInfo identified by subjectKeyIdentifier, which
				* apksig cannot resolve), or a declared lineage's original certificate
				* cannot be identified (a limitation then says why).
				*/
				v1_signers_match_block_signers: z.boolean().nullable(),
				rotation_present: z.boolean(),
				source_stamp_present: z.boolean(),
				strongest_scheme: SCHEME,
				/**
				* Every recomputed declared content digest equals the current bytes; null
				* when none was recomputed. Not a signature verification.
				*/
				self_consistent: z.boolean().nullable()
			}),
			runtime_execution: z.literal("not-performed")
		});
		apkSignatureUninterpretedBytes = (report) => {
			let total = 0;
			for (const scheme of [
				report.schemes.v2,
				report.schemes.v3,
				report.schemes["v3.1"]
			]) {
				total += scheme.uninterpreted_bytes;
				for (const signer of scheme.signers) total += signer.uninterpreted_signed_data_bytes + signer.uninterpreted_signer_bytes + signer.digests.reduce((n, record) => n + record.uninterpreted_bytes, 0) + signer.signatures.reduce((n, record) => n + record.uninterpreted_bytes, 0);
			}
			return total;
		};
		APK_SIGNATURE_LIMITATIONS = [
			"Static structural inspection only. No Android code executes, no device or adb is involved, and odex/vdex/oat/cdex are not read.",
			"No signature is verified: signer, rotation-lineage and source-stamp signatures are NOT cryptographically checked, and certificate chains, revocation and authenticity are NOT evaluated. Certificates and lineages are what the APK declares.",
			"matches_apk and self_consistent only show that the declared content digest equals the digest of the current bytes. This is not a signature verification: anyone who changes the bytes can recompute the digest and write it into the signed data. SHA-256 identifies the exact bytes, not the producer.",
			"v1 signers are what each signature block's PKCS#7 SignedData declares: its signatures, the .SF and MANIFEST.MF digests and entry coverage are NOT verified.",
			"Not read: v4 .apk.idsig, verity digests (matches_apk null), and the v1 X-Android-APK-Signed marker, so v1_only cannot distinguish a v1-only APK from one whose v2/v3 block was removed."
		];
		setKey = (fingerprints) => [...new Set(fingerprints)].sort().join(",");
		signerChangeDeclared = (signerSetsDiffer, signers, lineage, lineageUnknown) => {
			if (signerSetsDiffer === null) return null;
			if (!signerSetsDiffer || signers.size <= 1) return false;
			if ([...signers].every((fp) => lineage.has(fp))) return true;
			return lineageUnknown ? null : false;
		};
		expectedV1Certificate = (scheme, signer) => {
			if (signer.fingerprint === null || scheme === "v2" || signer.lineage.kind === "absent") return {
				ok: true,
				fingerprint: signer.fingerprint
			};
			if (signer.lineage.kind === "undecoded") return {
				ok: false,
				reason: `the ${scheme} signer's declared rotation lineage could not be decoded`
			};
			const origin = signer.lineage.fingerprints[0];
			return origin === undefined || origin === null ? {
				ok: false,
				reason: `the ${scheme} signer's declared rotation lineage names no readable original certificate`
			} : {
				ok: true,
				fingerprint: origin
			};
		};
		v1MatchesBlockSigners = (v1, lowest) => {
			if (v1.length === 0 || lowest === undefined || lowest.signers.length === 0) return {
				match: null,
				note: null
			};
			const expected = [];
			for (const signer of lowest.signers) {
				const one = expectedV1Certificate(lowest.scheme, signer);
				if (!one.ok) return {
					match: null,
					note: `v1_signers_match_block_signers is null: ${one.reason}, so the original certificate v1 is expected to carry is unknown.`
				};
				expected.push(one.fingerprint);
			}
			if (v1.includes(null) || expected.includes(null)) return {
				match: null,
				note: null
			};
			return {
				match: setKey(v1) === setKey(expected),
				note: null
			};
		};
		deriveApkPosture = (input) => {
			const blockPresent = input.v2Present || input.v3Present || input.v31Present;
			const strongest = input.v31Present ? "v3.1" : input.v3Present ? "v3" : input.v2Present ? "v2" : input.v1Present ? "v1" : "none";
			const present = input.blockSchemes.filter(({ scheme }) => scheme === "v2" ? input.v2Present : scheme === "v3" ? input.v3Present : input.v31Present);
			const sets = present.map(({ signers }) => signers.map(({ fingerprint }) => fingerprint));
			const identityUnknown = sets.some((fps) => fps.includes(null));
			const known = sets.map((fps) => fps.filter((fp) => fp !== null));
			const union = new Set(known.flat());
			const signerSetsDiffer = identityUnknown ? null : new Set(known.map(setKey)).size > 1;
			const lineages = present.flatMap(({ signers }) => signers.map(({ lineage }) => lineage));
			const lineage = new Set(lineages.flatMap((l) => l.kind === "decoded" ? l.fingerprints.filter((fp) => fp !== null) : []));
			const v1Match = input.v1Present ? v1MatchesBlockSigners(input.v1SignerFingerprints, present.find(({ signers }) => signers.length > 0)) : {
				match: null,
				note: null
			};
			return {
				posture: {
					v1_only: input.v1Present && !blockPresent,
					schemes_agree_on_signer: union.size === 0 || signerSetsDiffer === null ? null : !signerSetsDiffer,
					signer_change_declared_by_rotation: signerChangeDeclared(signerSetsDiffer, union, lineage, lineages.some((l) => l.kind === "undecoded")),
					v1_signers_match_block_signers: v1Match.match,
					rotation_present: lineages.some((l) => l.kind !== "absent"),
					source_stamp_present: input.sourceStampPresent,
					strongest_scheme: strongest,
					self_consistent: input.selfConsistent
				},
				notes: v1Match.note === null ? [] : [v1Match.note]
			};
		};
		apkSignatureMatchesSubject = (artifact, subject) => artifact.sha256 === subject.sha256 && artifact.path === subject.path && (subject.format === "file" || subject.format === "apk" || subject.format === "zip");
	})))();
}

//#endregion
//#region dist/domain/apkSignature/apkSignatureQuery.js
var apkSignatureSchemeSchema, position, identity$2, childIdentity, apkSignerRowSchema, apkDigestRowSchema, apkLineageRowSchema, filters, signers, digests, lineage, apkSignatureSelectionSchema, apkSignatureViewRequestSchema, apkSignatureViewItemsSchema, inspectApkSignatureInputSchema;
function init_apkSignatureQuery() {
	return (init_apkSignatureQuery = __esmMin((() => {
		init_digests();
		init_localPath();
		init_apkSignatureReport();
		apkSignatureSchemeSchema = z.enum([
			"v1",
			"v2",
			"v3",
			"v3.1"
		]);
		position = z.int().nonnegative();
		identity$2 = {
			id: z.string().min(1),
			scheme: apkSignatureSchemeSchema,
			index: position
		};
		childIdentity = {
			...identity$2,
			signer_id: z.string().min(1),
			signer_index: position
		};
		apkSignerRowSchema = z.strictObject({
			...identity$2,
			certificate: apkSignerSchema.shape.certificate,
			certificate_sha256: digestSchema.nullable(),
			signatures: apkSignerSchema.shape.signatures,
			public_key_bytes: position.nullable(),
			uninterpreted_signed_data_bytes: position.nullable(),
			uninterpreted_signer_bytes: position.nullable(),
			min_sdk: apkSignerSchema.shape.min_sdk,
			max_sdk: apkSignerSchema.shape.max_sdk,
			signature_file: z.string().nullable(),
			block_file: z.string().nullable(),
			signer_infos: apkSignatureResultSchema.shape.schemes.shape.v1.shape.signers.element.shape.signer_infos,
			decode_error: z.string().nullable()
		});
		apkDigestRowSchema = apkSignerSchema.shape.digests.element.extend(childIdentity);
		apkLineageRowSchema = apkSignerV3Schema.shape.rotation.shape.lineage.element.extend({
			...childIdentity,
			previous_id: z.string().nullable(),
			certificate_sha256: digestSchema.nullable()
		});
		filters = {
			ids: z.array(z.string()).optional(),
			schemes: z.array(apkSignatureSchemeSchema).optional(),
			signer_ids: z.array(z.string()).optional(),
			offset: position.default(0),
			limit: z.int().positive().default(32)
		};
		signers = z.strictObject({
			...filters,
			collection: z.literal("signers"),
			fields: z.array(apkSignerRowSchema.keyof()).optional()
		});
		digests = z.strictObject({
			...filters,
			collection: z.literal("digests"),
			fields: z.array(apkDigestRowSchema.keyof()).optional()
		});
		lineage = z.strictObject({
			...filters,
			collection: z.literal("lineage"),
			fields: z.array(apkLineageRowSchema.keyof()).optional()
		});
		apkSignatureSelectionSchema = z.discriminatedUnion("collection", [
			signers,
			digests,
			lineage
		]);
		apkSignatureViewRequestSchema = z.discriminatedUnion("collection", [
			signers.extend({ kind: z.literal("apk-signature") }),
			digests.extend({ kind: z.literal("apk-signature") }),
			lineage.extend({ kind: z.literal("apk-signature") })
		]);
		apkSignatureViewItemsSchema = z.union([
			z.array(apkSignerRowSchema.partial().required({
				id: true,
				scheme: true,
				index: true,
				certificate_sha256: true
			})),
			z.array(apkDigestRowSchema.partial().required({
				id: true,
				scheme: true,
				index: true,
				signer_id: true,
				signer_index: true
			})),
			z.array(apkLineageRowSchema.partial().required({
				id: true,
				scheme: true,
				index: true,
				signer_id: true,
				signer_index: true,
				certificate_sha256: true
			}))
		]);
		inspectApkSignatureInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Selected local APK/ZIP/AAB; static inspection only"),
			detail: z.enum(["summary", "complete"]).default("summary"),
			view: apkSignatureSelectionSchema.optional()
		}).superRefine((input, context) => {
			if (input.detail === "complete" && input.view !== undefined) context.addIssue({
				code: "custom",
				path: ["view"],
				message: "view requires summary delivery; omit it for complete Evidence"
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/apkSignatureView.js
/** Borrow canonical parsed facts; allocate rows only as this selected collection is visited. */
function* records(report, selection) {
	const wanted = selection.schemes === undefined ? undefined : new Set(selection.schemes);
	for (const scheme of schemes) {
		if (wanted !== undefined && !wanted.has(scheme)) continue;
		for (const [signerIndex, signer] of report.schemes[scheme].signers.entries()) {
			const id = signerId(report, scheme, signerIndex);
			if (selection.collection === "signers") {
				yield {
					id,
					scheme,
					index: signerIndex,
					certificate: signer.certificate,
					uninterpreted_signed_data_bytes: "uninterpreted_signed_data_bytes" in signer ? signer.uninterpreted_signed_data_bytes : null,
					uninterpreted_signer_bytes: "uninterpreted_signer_bytes" in signer ? signer.uninterpreted_signer_bytes : null,
					certificate_sha256: signer.certificate?.sha256_fingerprint ?? null,
					signatures: "signatures" in signer ? signer.signatures : [],
					public_key_bytes: "public_key_bytes" in signer ? signer.public_key_bytes : null,
					min_sdk: "min_sdk" in signer ? signer.min_sdk : null,
					max_sdk: "max_sdk" in signer ? signer.max_sdk : null,
					signature_file: "signature_file" in signer ? signer.signature_file : null,
					block_file: "block_file" in signer ? signer.block_file : null,
					signer_infos: "signer_infos" in signer ? signer.signer_infos : [],
					decode_error: "decode_error" in signer ? signer.decode_error : null
				};
			} else if (selection.collection === "digests" && "digests" in signer) {
				for (const [index, digest] of signer.digests.entries()) yield {
					...digest,
					id: recordId(id, "digests", index),
					scheme,
					index,
					signer_id: id,
					signer_index: signerIndex
				};
			} else if (selection.collection === "lineage" && (scheme === "v3" || scheme === "v3.1")) {
				for (const [index, node] of report.schemes[scheme].signers[signerIndex].rotation.lineage.entries()) yield {
					...node,
					certificate_sha256: node.certificate?.sha256_fingerprint ?? null,
					id: recordId(id, "lineage", index),
					scheme,
					index,
					signer_id: id,
					signer_index: signerIndex,
					previous_id: index === 0 ? null : recordId(id, "lineage", index - 1)
				};
			}
		}
	}
}
var identityFields, schemes, signerId, recordId, apkSignatureSourceCoverageSchema, apkSignatureSummarySchema, checked$3, read$2, projectApkSignatureView;
function init_apkSignatureView() {
	return (init_apkSignatureView = __esmMin((() => {
		init_digests();
		init_apkSignatureReport();
		init_apkSignatureQuery();
		init_immutableJson();
		init_result();
		init_analysisViewParent();
		init_analysisViewErrors();
		init_analysisViewCoverage();
		identityFields = new Set([
			"id",
			"scheme",
			"index",
			"signer_id",
			"signer_index",
			"certificate_sha256"
		]);
		schemes = [
			"v1",
			"v2",
			"v3",
			"v3.1"
		];
		signerId = (report, scheme, index) => `apk:${report.artifact.sha256}:${scheme}:signer:${String(index)}`;
		recordId = (signer, collection, index) => `${signer}:${collection}:${String(index)}`;
		apkSignatureSourceCoverageSchema = z.strictObject({
			scope: z.literal("declared-signing-records"),
			uninterpreted_bytes: z.int().nonnegative(),
			signer_identity: z.enum(["complete-within-records", "partial"]),
			lineage_decoding: z.enum(["complete-within-records", "partial"]),
			signature_verification: z.literal("not-performed"),
			v1_entry_coverage: z.literal("unknown"),
			authenticity: z.literal("unknown")
		});
		apkSignatureSummarySchema = z.strictObject({
			artifact: apkSignatureResultSchema.shape.artifact,
			schemes: z.record(apkSignatureSchemeSchema, z.strictObject({
				present: z.boolean(),
				signers: z.int().nonnegative()
			})),
			signers: z.array(z.strictObject({
				id: z.string(),
				scheme: apkSignatureSchemeSchema,
				index: z.int().nonnegative(),
				certificate_sha256: digestSchema.nullable()
			})),
			counts: z.strictObject({
				signers: z.int().nonnegative(),
				digests: z.int().nonnegative(),
				lineage: z.int().nonnegative()
			}),
			source_stamp: apkSignatureResultSchema.shape.source_stamp.omit({ certificate: true }).extend({ certificate_sha256: digestSchema.nullable() }),
			posture: apkSignatureResultSchema.shape.posture,
			source_coverage: apkSignatureSourceCoverageSchema
		});
		checked$3 = new WeakMap();
		read$2 = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && key !== null && typeof key === "object" && isImmutableJsonSnapshot(key);
			const cached = reusable ? checked$3.get(key) : undefined;
			let report = cached?.report;
			if (report === undefined) {
				const parsed = parseAnalysisViewResult(apkSignatureResultSchema, parent);
				if (!parsed.ok) return parsed;
				report = reusable ? key : parsed.value;
			}
			if (parent.subject != null && (parent.subject.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "APK subject does not match its recorded artifact"
			}]));
			if (cached !== undefined) return ok(cached);
			const unknowns = ["Declared signer and rotation identities are unverified; authenticity and v1 entry coverage remain unknown."];
			if (report.source_stamp.decode_error !== null) unknowns.push(`Source stamp: ${report.source_stamp.decode_error}`);
			const identities = [];
			let digests = 0, lineage = 0, unknownIdentity = false, unknownLineage = false;
			for (const scheme of schemes) {
				for (const [index, signer] of report.schemes[scheme].signers.entries()) {
					identities.push({
						id: signerId(report, scheme, index),
						scheme,
						index,
						certificate_sha256: signer.certificate?.sha256_fingerprint ?? null
					});
					unknownIdentity ||= signer.certificate === null;
					if (signer.certificate === null) unknowns.push(`${scheme} signer ${String(index)} has no resolved declared certificate identity.`);
					if ("decode_error" in signer && signer.decode_error !== null) unknowns.push(`${scheme} signer ${String(index)}: ${String(signer.decode_error)}`);
					if ("digests" in signer) digests += signer.digests.length;
					if (scheme === "v3" || scheme === "v3.1") {
						const rotation = report.schemes[scheme].signers[index].rotation;
						lineage += rotation.lineage.length;
						unknownLineage ||= rotation.decode_error !== null;
						if (rotation.decode_error !== null) unknowns.push(`${scheme} signer ${String(index)} lineage: ${rotation.decode_error}`);
					}
				}
			}
			const summary = apkSignatureSummarySchema.parse({
				artifact: report.artifact,
				schemes: Object.fromEntries(schemes.map((scheme) => [scheme, {
					present: report.schemes[scheme].present,
					signers: report.schemes[scheme].signers.length
				}])),
				signers: identities,
				counts: {
					signers: identities.length,
					digests,
					lineage
				},
				source_stamp: {
					present: report.source_stamp.present,
					certificate_sha256: report.source_stamp.certificate?.sha256_fingerprint ?? null,
					decode_error: report.source_stamp.decode_error
				},
				posture: report.posture,
				source_coverage: {
					scope: "declared-signing-records",
					uninterpreted_bytes: apkSignatureUninterpretedBytes(report),
					signer_identity: unknownIdentity ? "partial" : "complete-within-records",
					lineage_decoding: unknownLineage ? "partial" : "complete-within-records",
					signature_verification: "not-performed",
					v1_entry_coverage: "unknown",
					authenticity: "unknown"
				}
			});
			const value = {
				report,
				summary,
				unknowns
			};
			if (reusable) checked$3.set(key, value);
			return ok(value);
		};
		projectApkSignatureView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "apk-signature") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "APK Evidence supports summary and apk-signature signer/digest/lineage pages"
			}]));
			const parsed = read$2(parent);
			if (!parsed.ok) return parsed;
			const { report, summary } = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_apk_signature",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: boundedViewMessages(parent.limitations, parent.evidenceId, "limitations"),
				unknowns: boundedViewMessages(parsed.value.unknowns, parent.evidenceId, "unknowns")
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary,
				coverage: completeWithinViewCoverage(1, 1)
			});
			const ids = view.ids === undefined ? undefined : new Set(view.ids);
			const signers = view.signer_ids === undefined ? undefined : new Set(view.signer_ids);
			const fields = view.fields === undefined ? undefined : new Set(view.fields);
			const items = [];
			let total = 0;
			const rows = ids?.size === 0 || signers?.size === 0 ? [] : records(report, view);
			for (const row of rows) {
				if (ids !== undefined && !ids.has(String(row.id))) continue;
				if (signers !== undefined && !signers.has(String(row.signer_id ?? row.id))) continue;
				if (total++ < view.offset || items.length >= view.limit) continue;
				const item = {};
				for (const [key, value] of Object.entries(row)) if (identityFields.has(key) || fields === undefined || fields.has(key)) item[key] = value;
				items.push(item);
			}
			return ok({
				kind: "apk-signature",
				view,
				...shared,
				source_coverage: summary.source_coverage,
				items: apkSignatureViewItemsSchema.parse(items),
				coverage: pageViewCoverage(view.offset, items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/publicInput.js
var publicInputStrictObject;
function init_publicInput() {
	return (init_publicInput = __esmMin((() => {
		publicInputStrictObject = z.strictObject;
	})))();
}

//#endregion
//#region dist/domain/native/byteEntropy.js
var offsetSchema, entropySchema, inspectByteEntropyInputSchema, blockSchema, runSchema, byteEntropySchema, entropyFromCounts, computeBlockEntropy, mergeEntropyRuns;
function init_byteEntropy() {
	return (init_byteEntropy = __esmMin((() => {
		init_localPath();
		init_publicInput();
		offsetSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
		entropySchema = z.number().min(0).max(8);
		inspectByteEntropyInputSchema = publicInputStrictObject({
			path: localPathStringSchema,
			block_size: z.number().int().min(256).max(65536).refine((value) => (value & value - 1) === 0, "Block size must be a power of two.").default(4096),
			offset: offsetSchema.default(0),
			length: offsetSchema.optional()
		});
		blockSchema = z.strictObject({
			offset: offsetSchema,
			length: offsetSchema,
			entropy: entropySchema
		});
		runSchema = z.strictObject({
			offset: offsetSchema,
			length: offsetSchema,
			classification: z.enum(["high", "low"])
		});
		byteEntropySchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string(),
				bytes: offsetSchema,
				sha256: z.string().regex(/^[a-f0-9]{64}$/)
			}),
			block_size: z.number().int().min(256).max(65536),
			window: z.strictObject({
				offset: offsetSchema,
				length: offsetSchema
			}),
			file_entropy: entropySchema,
			thresholds: z.strictObject({
				high: entropySchema,
				low: entropySchema
			}),
			blocks: z.array(blockSchema),
			runs: z.array(runSchema),
			limitations: z.array(z.string())
		});
		entropyFromCounts = (counts, length) => {
			if (length === 0) return 0;
			let entropy = 0;
			for (let i = 0; i < counts.length; i++) {
				const count = counts[i] ?? 0;
				if (count > 0) {
					const probability = count / length;
					entropy -= probability * Math.log2(probability);
				}
			}
			return Math.round(entropy * 1e4) / 1e4;
		};
		computeBlockEntropy = (bytes) => {
			const counts = new Float64Array(256);
			for (const byte of bytes) counts[byte] = (counts[byte] ?? 0) + 1;
			return entropyFromCounts(counts, bytes.length);
		};
		mergeEntropyRuns = (blocks, thresholds) => {
			const runs = [];
			for (const block of blocks) {
				const classification = block.entropy >= thresholds.high ? "high" : block.entropy <= thresholds.low ? "low" : null;
				if (classification === null || block.length === 0) continue;
				const previous = runs.at(-1);
				if (previous?.classification === classification && previous.offset + previous.length === block.offset) previous.length += block.length;
				else runs.push({
					offset: block.offset,
					length: block.length,
					classification
				});
			}
			return runs;
		};
	})))();
}

//#endregion
//#region dist/domain/erlang/beam.js
var uint$2, range$1, MAX_INSPECT_ERLANG_BEAM_FILE_BYTES, MAX_INSPECT_ERLANG_BEAM_CHUNKS, MAX_INSPECT_ERLANG_BEAM_ATOMS, MAX_INSPECT_ERLANG_BEAM_TABLE_ROWS, inspectErlangBeamInputSchema, atomSchema, exportSchema, importSchema, lambdaSchema, chunkSchema, erlangBeamSchema;
function init_beam() {
	return (init_beam = __esmMin((() => {
		init_digests();
		init_localPath();
		init_publicInput();
		uint$2 = z.number().int().min(0).max(4294967295);
		range$1 = z.strictObject({
			offset: uint$2,
			bytes: uint$2
		});
		MAX_INSPECT_ERLANG_BEAM_FILE_BYTES = 536870912;
		MAX_INSPECT_ERLANG_BEAM_CHUNKS = 256;
		MAX_INSPECT_ERLANG_BEAM_ATOMS = 65536;
		MAX_INSPECT_ERLANG_BEAM_TABLE_ROWS = 65536;
		inspectErlangBeamInputSchema = publicInputStrictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a BEAM file"),
			max_file_bytes: z.number().int().min(16).max(MAX_INSPECT_ERLANG_BEAM_FILE_BYTES).default(67108864).describe("Maximum stable artifact bytes to read (default 64 MiB)"),
			max_chunks: z.number().int().min(1).max(256).default(64).describe("Maximum IFF chunks to examine; exceeding the budget fails without partial success"),
			max_atoms: z.number().int().min(1).max(MAX_INSPECT_ERLANG_BEAM_ATOMS).default(4096).describe("Maximum atom-table entries to decode; exceeding the budget fails without partial success")
		});
		atomSchema = z.strictObject({
			index: uint$2,
			name: z.string()
		});
		exportSchema = z.strictObject({
			function_index: uint$2,
			function: z.string().nullable(),
			arity: uint$2,
			label: uint$2
		});
		importSchema = z.strictObject({
			module_index: uint$2,
			module: z.string().nullable(),
			function_index: uint$2,
			function: z.string().nullable(),
			arity: uint$2
		});
		lambdaSchema = z.strictObject({
			function_index: uint$2,
			function: z.string().nullable(),
			arity: uint$2,
			label: uint$2,
			index: uint$2,
			free_vars: uint$2,
			old_unique: uint$2
		});
		chunkSchema = z.strictObject({
			index: uint$2,
			name: z.string().length(4),
			location: range$1,
			payload: z.strictObject({
				location: range$1,
				bytes: uint$2,
				sha256: digestSchema
			})
		});
		erlangBeamSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string().min(1),
				sha256: digestSchema,
				bytes: uint$2
			}),
			form: z.strictObject({
				location: range$1,
				size: uint$2
			}),
			chunks: z.array(chunkSchema),
			atoms: z.array(atomSchema).nullable(),
			atom_encoding: z.enum(["latin1", "utf8"]).nullable(),
			exports: z.array(exportSchema).nullable(),
			imports: z.array(importSchema).nullable(),
			lambdas: z.array(lambdaSchema).nullable(),
			code: z.strictObject({
				instruction_set: uint$2,
				opcode_max: uint$2,
				labels: uint$2,
				functions: uint$2,
				extra_header_bytes: uint$2,
				instructions: range$1
			}).nullable(),
			module: z.string().nullable(),
			coverage: z.strictObject({
				status: z.literal("complete"),
				examined_chunks: uint$2,
				atoms: uint$2
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/selectViewRows.js
var selectViewRows;
function init_selectViewRows() {
	return (init_selectViewRows = __esmMin((() => {
		selectViewRows = (rows, view, matches, project) => {
			const selected = [];
			let total = 0;
			for (const [index, row] of rows.entries()) {
				if (!matches(row, index)) continue;
				if (total >= view.offset && selected.length < view.limit) selected.push(project(row, index));
				total++;
			}
			return {
				rows: selected,
				total
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/erlangBeamView.js
var atom, exported, imported, lambda, chunk, page$11, erlangBeamViewRequestSchema, index$4, erlangBeamViewPageSchema, count$4, erlangBeamSummarySchema, erlangBeamCompleteDeliveryShape, erlangBeamSummaryDeliveryShape, erlangBeamDeliverySchema, readReport$3, selectRows$1, projectErlangBeamView;
function init_erlangBeamView() {
	return (init_erlangBeamView = __esmMin((() => {
		init_beam();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_selectViewRows();
		atom = erlangBeamSchema.shape.atoms.unwrap().element;
		exported = erlangBeamSchema.shape.exports.unwrap().element;
		imported = erlangBeamSchema.shape.imports.unwrap().element;
		lambda = erlangBeamSchema.shape.lambdas.unwrap().element;
		chunk = erlangBeamSchema.shape.chunks.element;
		page$11 = {
			kind: z.literal("beam"),
			names: z.array(z.string()).optional(),
			indices: z.array(z.int().nonnegative()).optional(),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		erlangBeamViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...page$11,
				collection: z.literal("atoms"),
				fields: z.array(atom.keyof()).optional()
			}),
			z.strictObject({
				...page$11,
				collection: z.literal("exports"),
				fields: z.array(exported.keyof()).optional()
			}),
			z.strictObject({
				...page$11,
				collection: z.literal("imports"),
				modules: z.array(z.string()).optional(),
				fields: z.array(imported.keyof()).optional()
			}),
			z.strictObject({
				...page$11,
				collection: z.literal("lambdas"),
				fields: z.array(lambda.keyof()).optional()
			}),
			z.strictObject({
				...page$11,
				collection: z.literal("chunks"),
				fields: z.array(chunk.keyof()).optional()
			})
		]);
		index$4 = { source_index: z.int().nonnegative() };
		erlangBeamViewPageSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				collection: z.literal("atoms"),
				items: z.array(atom.partial().extend(index$4))
			}),
			z.strictObject({
				collection: z.literal("exports"),
				items: z.array(exported.partial().extend(index$4))
			}),
			z.strictObject({
				collection: z.literal("imports"),
				items: z.array(imported.partial().extend(index$4))
			}),
			z.strictObject({
				collection: z.literal("lambdas"),
				items: z.array(lambda.partial().extend(index$4))
			}),
			z.strictObject({
				collection: z.literal("chunks"),
				items: z.array(chunk.partial().extend(index$4))
			})
		]);
		count$4 = z.int().nonnegative();
		erlangBeamSummarySchema = erlangBeamSchema.omit({
			chunks: true,
			atoms: true,
			exports: true,
			imports: true,
			lambdas: true,
			limitations: true
		}).extend({
			counts: z.strictObject({
				chunks: count$4,
				atoms: count$4.nullable(),
				exports: count$4.nullable(),
				imports: count$4.nullable(),
				lambdas: count$4.nullable()
			}),
			limitation_count: count$4
		});
		erlangBeamCompleteDeliveryShape = {
			detail: z.literal("complete").optional().default("complete"),
			view: z.never().exactOptional()
		};
		erlangBeamSummaryDeliveryShape = {
			detail: z.literal("summary"),
			view: erlangBeamViewRequestSchema.exactOptional()
		};
		erlangBeamDeliverySchema = z.discriminatedUnion("detail", [z.strictObject(erlangBeamCompleteDeliveryShape), z.strictObject(erlangBeamSummaryDeliveryShape)]);
		readReport$3 = createAnalysisViewResultReader(erlangBeamSchema);
		selectRows$1 = (rows, view) => {
			const names = view.names === undefined ? undefined : new Set(view.names);
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			const modules = view.collection === "imports" && view.modules !== undefined ? new Set(view.modules) : undefined;
			const fields = view.fields === undefined ? undefined : new Set(view.fields);
			const project = (row, source_index) => ({
				...Object.fromEntries(Object.entries(row).filter(([key]) => fields === undefined || fields.has(key))),
				source_index
			});
			const source = rows ?? [];
			if (names === undefined && indices === undefined && modules === undefined) return {
				rows: source.slice(view.offset, view.offset + view.limit).map((row, i) => project(row, view.offset + i)),
				total: source.length
			};
			return selectViewRows(source, view, (row, i) => {
				const name = "name" in row ? row.name : row.function;
				return (indices === undefined || indices.has(i)) && (names === undefined || name !== null && names.has(name)) && (modules === undefined || "module" in row && row.module !== null && modules.has(row.module));
			}, project);
		};
		projectErlangBeamView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "beam") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "BEAM Evidence supports summary and beam views."
			}]));
			const parsed = readReport$3(parent);
			if (!parsed.ok) return parsed;
			const { atoms, exports, imports, lambdas, chunks, limitations, ...identity } = parsed.value;
			const summary = {
				...identity,
				counts: {
					atoms: atoms?.length ?? null,
					exports: exports?.length ?? null,
					imports: imports?.length ?? null,
					lambdas: lambdas?.length ?? null,
					chunks: chunks.length
				},
				limitation_count: limitations.length
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_erlang_beam",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: identity.artifact.path,
					sha256: identity.artifact.sha256
				},
				limitations: boundedViewMessages([...parent.limitations, ...limitations], parent.evidenceId, "limitations"),
				unknowns: [
					"atoms",
					"exports",
					"imports",
					"lambdas"
				].filter((key) => summary.counts[key] === null).map((key) => `No ${key} table was decoded; runtime absence is not established.`)
			};
			if (view.kind === "summary") return ok({
				...shared,
				kind: "summary",
				view,
				summary,
				coverage: completeWithinViewCoverage(chunks.length, chunks.length)
			});
			const selected = selectRows$1(parsed.value[view.collection], view);
			return ok({
				...shared,
				kind: "beam",
				view,
				beam: summary,
				page: {
					collection: view.collection,
					items: selected.rows
				},
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/python/pythonPyc.js
var PYTHON_PYC_HEADER_BYTES, PYTHON_PYC_HASH_BASED, PYTHON_PYC_CHECK_SOURCE, uint$1, index$3, signedInt32, nonNegativeInt32, PYTHON_PYC_CODE_LAYOUTS, magics, consecutive, PYTHON_PYC_MAGIC_TABLE, pythonPycMagicEntry, PYTHON_PYC_LIMIT_MAXIMA, inspectPythonPycInputSchema, PYTHON_PYC_CONST_PREVIEW_LIMIT, PYTHON_PYC_INT_PREVIEW_BITS, pythonFloatSchema, pythonConstSchema, pythonCodeFields, pythonCodeObjectSchema, pythonPycHeaderSchema, pythonPycSchema;
function init_pythonPyc() {
	return (init_pythonPyc = __esmMin((() => {
		init_digests();
		init_localPath();
		PYTHON_PYC_HEADER_BYTES = 16;
		PYTHON_PYC_HASH_BASED = 1;
		PYTHON_PYC_CHECK_SOURCE = 2;
		uint$1 = z.number().int().min(0).max(4294967295);
		index$3 = z.number().int().nonnegative();
		signedInt32 = z.number().int().min(-2147483648).max(2147483647);
		nonNegativeInt32 = z.number().int().min(0).max(2147483647);
		PYTHON_PYC_CODE_LAYOUTS = [
			"py37",
			"py38",
			"py311"
		];
		magics = (values, python_version, code_layout, header_bytes = 16, negative_code_fields = "rejected") => values.map((magic) => [magic, {
			python_version,
			code_layout,
			header_bytes,
			negative_code_fields
		}]);
		consecutive = (start, end, python_version, code_layout) => magics(Array.from({ length: end - start + 1 }, (_, offset) => start + offset), python_version, code_layout);
		PYTHON_PYC_MAGIC_TABLE = new Map([
			...magics([3390, 3391], "3.7", "py37", 12, "accepted"),
			...magics([
				3392,
				3393,
				3394
			], "3.7", "py37", 16, "accepted"),
			...magics([3400, 3401], "3.8", "py37", 16, "accepted"),
			...magics([3410], "3.8", "py38", 16, "revision-dependent"),
			...magics([
				3411,
				3412,
				3413
			], "3.8", "py38", 16, "rejected"),
			...magics([
				3420,
				3421,
				3422,
				3423,
				3424,
				3425
			], "3.9", "py38"),
			...magics([
				3430,
				3431,
				3432,
				3433,
				3434,
				3435,
				3436,
				3437,
				3438,
				3439
			], "3.10", "py38"),
			...consecutive(3494, 3495, "3.11", "py311"),
			...consecutive(3500, 3531, "3.12", "py311"),
			...consecutive(3550, 3571, "3.13", "py311")
		]);
		pythonPycMagicEntry = (magic) => PYTHON_PYC_MAGIC_TABLE.get(magic) ?? null;
		PYTHON_PYC_LIMIT_MAXIMA = {
			max_file_bytes: 64 * 1024 * 1024,
			max_objects: 65536,
			max_depth: 256,
			max_string_bytes: 8 * 1024 * 1024
		};
		inspectPythonPycInputSchema = z.strictObject({
			path: localPathStringSchema.describe("Absolute filesystem path to the selected CPython .pyc file"),
			max_file_bytes: z.number().int().min(16).max(PYTHON_PYC_LIMIT_MAXIMA.max_file_bytes).default(16 * 1024 * 1024).describe("Maximum selected file size in bytes; exceeding the budget fails without partial success"),
			max_objects: z.number().int().min(1).max(PYTHON_PYC_LIMIT_MAXIMA.max_objects).default(16384).describe("Maximum marshal objects to examine; exceeding the budget fails without partial success"),
			max_depth: z.number().int().min(1).max(PYTHON_PYC_LIMIT_MAXIMA.max_depth).default(64).describe("Maximum marshal nesting depth; exceeding the budget fails without partial success"),
			max_string_bytes: z.number().int().min(1).max(PYTHON_PYC_LIMIT_MAXIMA.max_string_bytes).default(1024 * 1024).describe("Maximum bytes retained for one marshal string or byte string; exceeding the budget fails without partial success")
		});
		PYTHON_PYC_CONST_PREVIEW_LIMIT = 80;
		PYTHON_PYC_INT_PREVIEW_BITS = 256;
		pythonFloatSchema = z.union([z.number(), z.enum([
			"inf",
			"-inf",
			"nan",
			"-0.0"
		])]);
		pythonConstSchema = z.discriminatedUnion("kind", [
			z.strictObject({ kind: z.literal("none") }),
			z.strictObject({
				kind: z.literal("bool"),
				value: z.boolean()
			}),
			z.strictObject({
				kind: z.literal("int"),
				bits: uint$1,
				value: z.string().min(1).max(80).nullable()
			}),
			z.strictObject({
				kind: z.literal("float"),
				value: pythonFloatSchema
			}),
			z.strictObject({
				kind: z.literal("str"),
				bytes: uint$1,
				truncated: z.boolean(),
				value: z.string().max(80)
			}),
			z.strictObject({
				kind: z.literal("bytes"),
				bytes: uint$1,
				sha256: digestSchema
			}),
			z.strictObject({
				kind: z.literal("code"),
				name: z.string(),
				firstlineno: signedInt32
			}),
			z.strictObject({
				kind: z.literal("tuple"),
				length: uint$1
			}),
			z.strictObject({
				kind: z.literal("list"),
				length: uint$1
			}),
			z.strictObject({
				kind: z.literal("set"),
				length: uint$1
			}),
			z.strictObject({
				kind: z.literal("frozenset"),
				length: uint$1
			}),
			z.strictObject({
				kind: z.literal("dict"),
				length: uint$1
			}),
			z.strictObject({ kind: z.literal("ellipsis") }),
			z.strictObject({
				kind: z.literal("complex"),
				real: pythonFloatSchema,
				imag: pythonFloatSchema
			}),
			z.strictObject({
				kind: z.literal("other"),
				type: z.string().min(1)
			})
		]);
		pythonCodeFields = {
			name: z.string(),
			qualname: z.string().nullable(),
			filename: z.string(),
			firstlineno: signedInt32,
			argcount: nonNegativeInt32,
			posonlyargcount: nonNegativeInt32.nullable(),
			kwonlyargcount: nonNegativeInt32,
			nlocals: nonNegativeInt32.nullable(),
			stacksize: signedInt32,
			flags: signedInt32,
			names: z.array(z.string()),
			varnames: z.array(z.string()).nullable(),
			freevars: z.array(z.string()).nullable(),
			cellvars: z.array(z.string()).nullable(),
			localsplusnames: z.array(z.string()).nullable(),
			localspluskinds_hex: z.string().nullable(),
			bytecode: z.strictObject({
				bytes: uint$1,
				sha256: digestSchema
			}),
			consts: z.array(pythonConstSchema)
		};
		pythonCodeObjectSchema = z.strictObject({
			...pythonCodeFields,
			nested_code: z.array(index$3)
		});
		pythonPycHeaderSchema = z.strictObject({
			magic: z.number().int().min(0).max(65535),
			python_version: z.string().min(1),
			code_layout: z.enum(PYTHON_PYC_CODE_LAYOUTS),
			flags: uint$1,
			hash_based: z.boolean(),
			check_source: z.boolean(),
			source_hash_hex: z.string().nullable(),
			source_mtime: uint$1.nullable(),
			source_size: uint$1.nullable()
		});
		pythonPycSchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				sha256: digestSchema,
				bytes: index$3
			}),
			header: pythonPycHeaderSchema,
			/** The top-level module code object is first. */
			code_objects: z.array(pythonCodeObjectSchema).min(1),
			coverage: z.strictObject({
				status: z.literal("complete"),
				objects: uint$1,
				code_objects: uint$1,
				marshal_bytes: uint$1,
				marshal_depth: uint$1
			}),
			limitations: z.array(z.string().min(1)).min(1)
		}).superRefine((report, context) => {
			if (report.artifact.bytes < 16) {
				context.addIssue({
					code: "custom",
					path: ["artifact", "bytes"],
					message: "A pyc header does not fit in the selected artifact."
				});
			}
			const marshalBytes = report.artifact.bytes - 16;
			if (report.coverage.marshal_bytes !== marshalBytes) {
				context.addIssue({
					code: "custom",
					path: ["coverage", "marshal_bytes"],
					message: "Marshal byte count disagrees with the header-stripped file."
				});
			}
			if (report.header.hash_based === (report.header.source_hash_hex === null)) {
				context.addIssue({
					code: "custom",
					path: ["header", "source_hash_hex"],
					message: "Hash-based pycs require an 8-byte source hash; others must omit it."
				});
			}
			if (report.header.hash_based === (report.header.source_mtime !== null)) {
				context.addIssue({
					code: "custom",
					path: ["header", "source_mtime"],
					message: "Timestamp pycs require mtime; hash-based pycs must omit it."
				});
			}
			if (report.header.hash_based === (report.header.source_size !== null)) {
				context.addIssue({
					code: "custom",
					path: ["header", "source_size"],
					message: "Timestamp pycs require source_size; hash-based pycs must omit it."
				});
			}
			if (report.coverage.code_objects !== report.code_objects.length) {
				context.addIssue({
					code: "custom",
					path: ["coverage", "code_objects"],
					message: "Code-object coverage disagrees with the listed code objects."
				});
			}
			report.code_objects.forEach((code, owner) => {
				if (code.localspluskinds_hex !== null && code.localspluskinds_hex.length !== (code.localsplusnames?.length ?? 0) * 2) context.addIssue({
					code: "custom",
					path: [
						"code_objects",
						owner,
						"localspluskinds_hex"
					],
					message: "co_localspluskinds length does not match co_localsplusnames."
				});
				code.nested_code.forEach((nested, position) => {
					if (nested >= report.code_objects.length) context.addIssue({
						code: "custom",
						path: [
							"code_objects",
							owner,
							"nested_code",
							position
						],
						message: "Nested code index does not name a listed code object."
					});
				});
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/pythonPycView.js
var code, pythonPycViewRequestSchema, pythonPycCompleteDeliveryShape, pythonPycSummaryDeliveryShape, pythonPycDeliverySchema, pythonPycViewItemsSchema, pythonPycSummarySchema, readReport$2, projectPythonPycView;
function init_pythonPycView() {
	return (init_pythonPycView = __esmMin((() => {
		init_pythonPyc();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_selectViewRows();
		code = pythonPycSchema.shape.code_objects.element;
		pythonPycViewRequestSchema = z.strictObject({
			kind: z.literal("python-pyc"),
			collection: z.literal("code_objects"),
			names: z.array(z.string()).optional(),
			indices: z.array(z.int().nonnegative()).optional(),
			fields: z.array(code.keyof()).optional(),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		pythonPycCompleteDeliveryShape = {
			detail: z.literal("complete").optional().default("complete"),
			view: z.never().exactOptional()
		};
		pythonPycSummaryDeliveryShape = {
			detail: z.literal("summary"),
			view: pythonPycViewRequestSchema.exactOptional()
		};
		pythonPycDeliverySchema = z.discriminatedUnion("detail", [z.strictObject(pythonPycCompleteDeliveryShape), z.strictObject(pythonPycSummaryDeliveryShape)]);
		pythonPycViewItemsSchema = z.array(code.partial().extend({ source_index: z.int().nonnegative() }));
		pythonPycSummarySchema = z.strictObject({
			artifact: pythonPycSchema.shape.artifact,
			header: pythonPycSchema.shape.header,
			coverage: pythonPycSchema.shape.coverage,
			limitation_count: z.int().nonnegative()
		});
		readReport$2 = createAnalysisViewResultReader(pythonPycSchema);
		projectPythonPycView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "python-pyc") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Python pyc Evidence supports summary and python-pyc views."
			}]));
			const parsed = readReport$2(parent);
			if (!parsed.ok) return parsed;
			const { code_objects, limitations, ...identity } = parsed.value;
			const summary = {
				...identity,
				limitation_count: limitations.length
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_python_pyc",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: identity.artifact.path,
					sha256: identity.artifact.sha256
				},
				limitations: boundedViewMessages([...parent.limitations, ...limitations], parent.evidenceId, "limitations"),
				unknowns: []
			};
			if (view.kind === "summary") return ok({
				...shared,
				kind: "summary",
				view,
				summary,
				coverage: completeWithinViewCoverage(code_objects.length, code_objects.length)
			});
			const names = view.names === undefined ? undefined : new Set(view.names);
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			const fields = new Set(view.fields ?? code.keyof().options);
			const projectRow = (row, source_index) => ({
				...Object.fromEntries(Object.entries(row).filter(([key]) => fields.has(key))),
				source_index
			});
			const selected = names === undefined && indices === undefined ? {
				rows: code_objects.slice(view.offset, view.offset + view.limit).map((row, index) => projectRow(row, view.offset + index)),
				total: code_objects.length
			} : selectViewRows(code_objects, view, (row, index) => (names === undefined || names.has(row.name)) && (indices === undefined || indices.has(index)), projectRow);
			return ok({
				...shared,
				kind: "python-pyc",
				view,
				pyc: summary,
				items: selected.rows,
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeExports.js
var uint, address, MAX_PE_EXPORT_ORDINAL, MAX_INSPECT_NATIVE_EXPORTS_FILE_BYTES, MAX_NATIVE_EXPORT_ROWS, inspectNativeExportsInputSchema, peExportSchema, elfExportSchema, nativeExportIssueSchema, artifactSchema$1, coverageSchema$1, peNativeExportsSchema, elfNativeExportsSchema, nativeExportsSchema;
function init_nativeExports() {
	return (init_nativeExports = __esmMin((() => {
		init_localPath();
		uint = z.number().int().min(0).max(4294967295);
		address = z.string().regex(/^0x[0-9a-f]+$/u);
		MAX_PE_EXPORT_ORDINAL = 4294967295 + 4294967294;
		MAX_INSPECT_NATIVE_EXPORTS_FILE_BYTES = 536870912;
		MAX_NATIVE_EXPORT_ROWS = 262144;
		inspectNativeExportsInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a PE or ELF image"),
			max_file_bytes: z.number().int().min(64).max(MAX_INSPECT_NATIVE_EXPORTS_FILE_BYTES).default(268435456).describe("Maximum stable artifact bytes to read (default 256 MiB)")
		});
		peExportSchema = z.strictObject({
			name: z.string().min(1).nullable(),
			ordinal: z.number().int().min(0).max(MAX_PE_EXPORT_ORDINAL),
			address: address.nullable(),
			forwarder: z.string().min(1).nullable()
		});
		elfExportSchema = z.strictObject({
			name: z.string().min(1),
			/** Exact non-ASCII name bytes; ELF string tables do not declare text encoding. */
			name_bytes_base64: z.string().nullable().default(null),
			/** Whether `name` was decoded as UTF-8; null means this field was not recorded in older Evidence. */
			name_utf8_decodable: z.boolean().nullable().default(null),
			/** `st_value` as stored; on 32-bit ARM, bit 0 of a function marks Thumb code. */
			value: address,
			size: z.string().regex(/^[0-9]+$/u),
			type: z.enum([
				"function",
				"ifunc",
				"object",
				"tls",
				"other"
			]),
			binding: z.enum([
				"global",
				"weak",
				"unique"
			]),
			version: z.union([
				z.null(),
				z.literal("unknown"),
				z.strictObject({
					index: z.number().int().min(2).max(32767),
					name: z.string().min(1).nullable(),
					/** Exact non-ASCII version-name bytes; ELF strings do not declare encoding. */
					name_bytes_base64: z.string().nullable().default(null),
					/** Null means older Evidence did not retain version-name encoding facts. */
					name_utf8_decodable: z.boolean().nullable().default(null),
					hidden: z.boolean()
				})
			])
		});
		nativeExportIssueSchema = z.strictObject({
			code: z.enum([
				"malformed_entry",
				"name_unreadable",
				"version_unresolved",
				"table_unavailable"
			]),
			location: z.string().min(1).nullable(),
			message: z.string().min(1)
		});
		artifactSchema$1 = z.strictObject({
			path: z.string().min(1),
			sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			bytes: uint
		});
		coverageSchema$1 = z.strictObject({
			/** complete: every table entry was read; partial: issues name the gaps. */
			status: z.enum([
				"complete",
				"partial",
				"unsupported"
			]),
			reason: z.string().min(1).nullable(),
			examined_entries: uint,
			exports: uint
		});
		peNativeExportsSchema = z.strictObject({
			artifact: artifactSchema$1,
			format: z.literal("pe"),
			architecture: z.string().min(1),
			bits: z.union([z.literal(32), z.literal(64)]),
			/** Null when the image declares no export directory. */
			export_directory: z.strictObject({
				rva: uint,
				size: uint,
				dll_name: z.string().nullable(),
				ordinal_base: uint,
				timestamp: uint
			}).nullable(),
			exports: z.array(peExportSchema).max(MAX_NATIVE_EXPORT_ROWS),
			coverage: coverageSchema$1,
			issues: z.array(nativeExportIssueSchema),
			limitations: z.array(z.string().min(1))
		});
		elfNativeExportsSchema = z.strictObject({
			artifact: artifactSchema$1,
			format: z.literal("elf"),
			architecture: z.string().min(1),
			bits: z.union([z.literal(32), z.literal(64)]),
			byte_order: z.enum(["little", "big"]),
			exports: z.array(elfExportSchema).max(MAX_NATIVE_EXPORT_ROWS),
			coverage: coverageSchema$1,
			issues: z.array(nativeExportIssueSchema),
			limitations: z.array(z.string().min(1))
		});
		nativeExportsSchema = z.discriminatedUnion("format", [peNativeExportsSchema, elfNativeExportsSchema]).superRefine((value, context) => {
			if (value.coverage.exports !== value.exports.length) context.addIssue({
				code: "custom",
				path: ["coverage", "exports"],
				message: "Export coverage count must equal the retained export row count."
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/nativeExportsView.js
var peRow, elfRow, issue$1, sourceIndex, page$10, nativeExportsViewRequestSchema, nativeExportsViewItemsSchema, counts, nativeExportsSummarySchema, readReport$1, projectNativeExportsView;
function init_nativeExportsView() {
	return (init_nativeExportsView = __esmMin((() => {
		init_nativeExports();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_selectViewRows();
		peRow = peNativeExportsSchema.shape.exports.element;
		elfRow = elfNativeExportsSchema.shape.exports.element;
		issue$1 = peNativeExportsSchema.shape.issues.element;
		sourceIndex = { source_index: z.int().nonnegative() };
		page$10 = {
			kind: z.literal("native-exports"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		nativeExportsViewRequestSchema = z.discriminatedUnion("collection", [z.strictObject({
			...page$10,
			collection: z.literal("exports"),
			names: z.array(z.string()).optional(),
			indices: z.array(z.int().nonnegative()).optional(),
			fields: z.array(z.union([peRow.keyof(), elfRow.keyof()])).optional()
		}), z.strictObject({
			...page$10,
			collection: z.literal("issues"),
			indices: z.array(z.int().nonnegative()).optional()
		})]);
		nativeExportsViewItemsSchema = z.union([
			z.array(peRow.partial().extend(sourceIndex)),
			z.array(elfRow.partial().extend({
				...sourceIndex,
				name_bytes_base64: elfRow.shape.name_bytes_base64.removeDefault().optional(),
				name_utf8_decodable: elfRow.shape.name_utf8_decodable.removeDefault().optional()
			})),
			z.array(issue$1.extend(sourceIndex))
		]);
		counts = {
			export_count: z.int().nonnegative(),
			issue_count: z.int().nonnegative(),
			limitation_count: z.int().nonnegative()
		};
		nativeExportsSummarySchema = z.discriminatedUnion("format", [peNativeExportsSchema.omit({
			exports: true,
			issues: true,
			limitations: true
		}).extend(counts), elfNativeExportsSchema.omit({
			exports: true,
			issues: true,
			limitations: true
		}).extend(counts)]);
		readReport$1 = createAnalysisViewResultReader(nativeExportsSchema);
		projectNativeExportsView = (parent, view) => {
			const invalid = (message) => err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message
			}]));
			if (view.kind !== "summary" && view.kind !== "native-exports") return invalid("Native export Evidence supports summary and native-exports views.");
			const parsed = readReport$1(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const { exports, issues, limitations, ...identity } = report;
			const summary = {
				...identity,
				export_count: exports.length,
				issue_count: issues.length,
				limitation_count: limitations.length
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_native_exports",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: boundedViewMessages([...parent.limitations, ...limitations], parent.evidenceId, "limitations"),
				unknowns: report.coverage.status === "complete" ? [] : [report.coverage.reason ?? "Export-table coverage is incomplete; no-match pages do not prove absence."]
			};
			if (view.kind === "summary") return ok({
				...shared,
				kind: "summary",
				view,
				summary,
				coverage: completeWithinViewCoverage(exports.length, exports.length)
			});
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			if (view.collection === "issues") {
				const selected = indices === undefined ? {
					rows: issues.slice(view.offset, view.offset + view.limit).map((row, index) => ({
						...row,
						source_index: view.offset + index
					})),
					total: issues.length
				} : selectViewRows(issues, view, (_, index) => indices.has(index), (row, source_index) => ({
					...row,
					source_index
				}));
				return ok({
					...shared,
					kind: "native-exports",
					view,
					exports: summary,
					items: selected.rows,
					coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
				});
			}
			const allowed = report.format === "pe" ? peRow.keyof().options : elfRow.keyof().options;
			const fields = view.fields === undefined ? allowed : [...new Set(view.fields)];
			const allowedFields = allowed;
			if (fields.some((field) => !allowedFields.includes(field))) return invalid(`Selected export fields do not belong to ${report.format}; available fields: ${allowed.join(", ")}.`);
			const names = view.names === undefined ? undefined : new Set(view.names);
			const columns = new Set(fields);
			if (report.format === "elf" && columns.has("name")) {
				columns.add("name_bytes_base64");
				columns.add("name_utf8_decodable");
			}
			const rows = exports;
			const projectRow = (row, source_index) => ({
				...Object.fromEntries(Object.entries(row).filter(([key]) => columns.has(key))),
				source_index
			});
			const selected = names === undefined && indices === undefined ? {
				rows: rows.slice(view.offset, view.offset + view.limit).map((row, index) => projectRow(row, view.offset + index)),
				total: rows.length
			} : selectViewRows(rows, view, (row, index) => (indices === undefined || indices.has(index)) && (names === undefined || row.name !== null && names.has(row.name)), projectRow);
			return ok({
				...shared,
				kind: "native-exports",
				view,
				exports: summary,
				items: selected.rows,
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/byteEntropyView.js
var byteEntropySummarySchema, projectByteEntropyView;
function init_byteEntropyView() {
	return (init_byteEntropyView = __esmMin((() => {
		init_analysisErrorCore();
		init_byteEntropy();
		init_result();
		init_analysisViewCoverage();
		byteEntropySummarySchema = byteEntropySchema.omit({
			blocks: true,
			runs: true,
			limitations: true
		}).extend({
			block_count: z.number().int().nonnegative(),
			run_count: z.number().int().nonnegative(),
			top_runs: byteEntropySchema.shape.runs
		});
		projectByteEntropyView = (parent, report, view) => {
			if (view.kind !== "summary") return err(new AnalysisInputError("inspect_analysis_view", undefined, [{
				path: ["view"],
				reason: "invalid_value",
				message: "Byte entropy Evidence supports the summary view; retrieve parent Evidence for the complete block series."
			}]));
			return ok({
				kind: "summary",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_byte_entropy",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				summary: {
					artifact: report.artifact,
					block_size: report.block_size,
					window: report.window,
					file_entropy: report.file_entropy,
					thresholds: report.thresholds,
					block_count: report.blocks.length,
					run_count: report.runs.length,
					top_runs: [...report.runs].sort((a, b) => b.length - a.length || a.offset - b.offset).slice(0, 10)
				},
				coverage: completeWithinViewCoverage(report.blocks.length, report.blocks.length),
				limitations: [...new Set([...parent.limitations, ...report.limitations])].sort(),
				unknowns: []
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/javascriptRoutesView.js
var identity$1, paging, ids, javaScriptRoutesViewRequestSchema, javaScriptRoutesCompleteDeliveryShape, javaScriptRoutesSummaryDeliveryShape, webRoutesSummaryDeliveryShape, javaScriptRoutesDeliverySchema, webRoutesDeliverySchema, javaScriptRouteProvenanceSchema, javaScriptRoutesViewItemsSchema, javaScriptRoutesViewSummarySchema, javaScriptRoutesSourceReferenceSchema, table, checkedRoutes, inputError$3, read$1, candidates, choose, matches, selectedSet, ranks, PAGE_BYTES, DIGEST_BYTES, PROJECTION_BYTES, appIdentity, captureIdentity, projectJavaScriptRoutesView;
function init_javascriptRoutesView() {
	return (init_javascriptRoutesView = __esmMin((() => {
		init_javascriptSourceCoordinates();
		init_digests();
		init_immutableJson();
		init_result();
		init_analysisErrorCore();
		init_jsonValueByteLength();
		init_javascriptRouteInventory();
		init_javascriptRouteFacts();
		init_analysisViewErrors();
		init_analysisViewCoverage();
		identity$1 = { kind: z.literal("javascript-routes") };
		paging = {
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		ids = z.array(z.string()).exactOptional();
		javaScriptRoutesViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...identity$1,
				collection: z.literal("summary")
			}),
			z.strictObject({
				...identity$1,
				collection: z.literal("routes"),
				where: z.strictObject({
					ids,
					paths: z.array(z.string()).exactOptional(),
					path_prefix: z.string().exactOptional().describe("Exact string prefix; no URL/path normalization."),
					classifications: z.array(javaScriptInventoryRouteSchema.shape.classification).exactOptional(),
					mechanisms: z.array(javaScriptRouteMechanismSchema).exactOptional(),
					min_confidence: javaScriptInventoryRouteSchema.shape.confidence.exactOptional()
				}).default({}),
				fields: z.array(javaScriptInventoryRouteSchema.keyof()).exactOptional(),
				...paging
			}),
			z.strictObject({
				...identity$1,
				collection: z.literal("occurrences"),
				where: z.strictObject({
					ids,
					route_ids: z.array(z.string()).exactOptional(),
					source_ids: z.array(z.string()).exactOptional(),
					mechanisms: z.array(javaScriptRouteMechanismSchema).exactOptional()
				}).default({}),
				fields: z.array(javaScriptRouteOccurrenceSchema.keyof()).exactOptional(),
				...paging
			}),
			z.strictObject({
				...identity$1,
				collection: z.literal("sources"),
				where: z.strictObject({
					ids,
					keys: z.array(z.string()).exactOptional(),
					statuses: z.array(javaScriptRouteInventorySourceSchema.shape.status).exactOptional()
				}).default({}),
				fields: z.array(javaScriptRouteInventorySourceSchema.keyof()).exactOptional(),
				...paging
			}),
			z.strictObject({
				...identity$1,
				collection: z.literal("unknowns"),
				where: z.strictObject({
					ids,
					source_ids: z.array(z.string()).exactOptional(),
					kinds: z.array(javaScriptRouteGapSchema.shape.kind).exactOptional()
				}).default({}),
				fields: z.array(javaScriptRouteGapSchema.keyof()).exactOptional(),
				...paging
			})
		]);
		javaScriptRoutesCompleteDeliveryShape = {
			detail: z.literal("complete").optional().default("complete"),
			view: z.never().exactOptional()
		};
		javaScriptRoutesSummaryDeliveryShape = {
			detail: z.literal("summary"),
			view: javaScriptRoutesViewRequestSchema.exactOptional()
		};
		webRoutesSummaryDeliveryShape = {
			detail: z.literal("summary"),
			view: javaScriptRoutesViewRequestSchema
		};
		javaScriptRoutesDeliverySchema = z.discriminatedUnion("detail", [z.strictObject(javaScriptRoutesCompleteDeliveryShape), z.strictObject(javaScriptRoutesSummaryDeliveryShape)]);
		webRoutesDeliverySchema = z.discriminatedUnion("detail", [z.strictObject(javaScriptRoutesCompleteDeliveryShape), z.strictObject(webRoutesSummaryDeliveryShape)]);
		javaScriptRouteProvenanceSchema = z.strictObject({
			source_id: javaScriptRouteInventorySourceSchema.shape.id,
			occurrence_id: javaScriptRouteOccurrenceSchema.shape.id.nullable(),
			source_range: javascriptSourceRangeSchema.nullable(),
			mechanism: javaScriptRouteMechanismSchema.nullable(),
			derivation: javaScriptRouteOccurrenceSchema.shape.derivation.nullable(),
			inferred_base_path: z.string().nullable()
		});
		javaScriptRoutesViewItemsSchema = z.union([
			z.array(javaScriptInventoryRouteSchema.partial().required({ id: true }).extend({ provenance: javaScriptRouteProvenanceSchema })),
			z.array(javaScriptRouteOccurrenceSchema.partial().required({
				id: true,
				route_id: true,
				source_id: true
			}).extend({ provenance: javaScriptRouteProvenanceSchema })),
			z.array(javaScriptRouteInventorySourceSchema.partial().required({
				id: true,
				key: true,
				sha256: true,
				status: true
			})),
			z.array(javaScriptRouteGapSchema.partial().required({
				id: true,
				source_id: true,
				kind: true
			}).extend({ provenance: javaScriptRouteProvenanceSchema.nullable() }))
		]);
		javaScriptRoutesViewSummarySchema = z.strictObject({
			reported_capture_omissions: z.array(z.strictObject({
				id: javaScriptRouteGapSchema.shape.id,
				reason: z.string(),
				...javaScriptRouteCaptureOmissionSchema.shape
			})),
			statistics: javaScriptRouteInventorySchema.shape.statistics,
			gaps: z.int().nonnegative(),
			source_status_counts: z.strictObject({
				complete: z.int().nonnegative(),
				partial: z.int().nonnegative(),
				unavailable: z.int().nonnegative(),
				unknown: z.int().nonnegative()
			}),
			patterns_by_classification: z.strictObject({
				page: z.int().nonnegative(),
				system: z.int().nonnegative(),
				unknown: z.int().nonnegative()
			})
		});
		javaScriptRoutesSourceReferenceSchema = javaScriptRouteInventorySourceSchema;
		table = (rows) => ({
			rows,
			byId: new Map(rows.map((row, index) => [row.id, {
				row,
				index
			}]))
		});
		checkedRoutes = new WeakMap();
		inputError$3 = (message) => analysisViewInputError([{
			path: [
				"source",
				"normalized_result",
				"route_inventory"
			],
			reason: "invalid_value",
			message
		}]);
		read$1 = (parent) => {
			const raw = parent.normalizedResult;
			if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return err(inputError$3("Parent result is not an analysis record."));
			const reusable = parent.sealedResult === true && isImmutableJsonSnapshot(raw);
			const retained = reusable ? checkedRoutes.get(raw) : undefined;
			if (retained !== undefined) return ok(retained);
			const value = raw.route_inventory;
			if (value === undefined) return err(inputError$3("This parent has no measured route inventory; route absence remains unknown."));
			const parsed = javaScriptRouteInventorySchema.safeParse(value);
			if (!parsed.success) return err(inputError$3(`Parent route inventory failed validation (${parsed.error.issues.length} issues); the complete source remains in parent Evidence ${parent.evidenceId}.`));
			const inventory = parsed.data;
			const source_status_counts = {
				complete: 0,
				partial: 0,
				unavailable: 0,
				unknown: 0
			}, patterns_by_classification = {
				page: 0,
				system: 0,
				unknown: 0
			};
			for (const source of inventory.sources) source_status_counts[source.status]++;
			for (const route of inventory.routes) patterns_by_classification[route.classification]++;
			const checked = {
				inventory,
				routes: table(inventory.routes),
				occurrences: table(inventory.occurrences),
				sources: table(inventory.sources),
				gaps: table(inventory.unknowns),
				summary: {
					reported_capture_omissions: inventory.unknowns.flatMap((gap) => gap.capture_omission === undefined ? [] : [{
						id: gap.id,
						reason: gap.reason,
						...gap.capture_omission
					}]),
					statistics: inventory.statistics,
					gaps: inventory.unknowns.length,
					source_status_counts,
					patterns_by_classification
				}
			};
			if (reusable) checkedRoutes.set(raw, checked);
			return ok(checked);
		};
		candidates = (rows, selected) => selected === undefined ? rows.rows : [...new Set(selected)].flatMap((id) => {
			const entry = rows.byId.get(id);
			return entry === undefined ? [] : [entry];
		}).sort((a, b) => a.index - b.index).map((entry) => entry.row);
		choose = (row, fields) => Object.fromEntries([...new Set(fields)].filter((field) => Object.hasOwn(row, field)).map((field) => [field, row[field]]));
		matches = (values, value) => values === undefined || value !== null && values.has(value);
		selectedSet = (values) => values === undefined ? undefined : new Set(values);
		ranks = {
			low: 0,
			medium: 1,
			high: 2
		};
		PAGE_BYTES = 1024 * 1024;
		DIGEST_BYTES = jsonValueByteLength({ view_digest: "0".repeat(64) }) - 1;
		PROJECTION_BYTES = PAGE_BYTES - DIGEST_BYTES;
		appIdentity = z.object({
			input_path: z.string().min(1),
			root_artifact_sha256: digestSchema
		});
		captureIdentity = z.object({ capture: z.object({ target_url: z.string() }) });
		projectJavaScriptRoutesView = (parent, selected) => {
			if (selected.kind !== "javascript-routes") return err(inputError$3("Select a javascript-routes view."));
			const operation = parent.operation;
			if (operation !== "analyze_javascript_application" && operation !== "analyze_web_bundle") return err(inputError$3("Route views require JavaScript application or captured web-bundle Evidence."));
			let artifact = parent.artifact ?? null, capture_url = null;
			if (operation === "analyze_javascript_application") {
				const identity = appIdentity.safeParse(parent.normalizedResult);
				if (!identity.success) return err(inputError$3("Parent application artifact identity is missing or malformed."));
				artifact = {
					path: identity.data.input_path,
					sha256: identity.data.root_artifact_sha256
				};
				if (parent.subject != null && (parent.subject.local_path !== artifact.path || parent.subject.digest.sha256 !== artifact.sha256)) return err(inputError$3("Parent subject does not match its application artifact identity."));
			} else {
				const identity = captureIdentity.safeParse(parent.normalizedResult);
				if (!identity.success) return err(inputError$3("Parent captured-page identity is missing or malformed."));
				capture_url = identity.data.capture.target_url;
			}
			const parsed = read$1(parent);
			if (!parsed.ok) return parsed;
			const data = parsed.value, inventory = data.inventory, view = selected;
			const shared = {
				kind: "javascript-routes",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_operation: operation,
				parent_digest: parent.evidenceId.slice(3),
				artifact,
				capture_url,
				inventory_id: inventory.inventory_id,
				source_manifest_sha256: inventory.source_manifest_sha256,
				source_coverage: { ...inventory.coverage },
				inventory_capacity: inventory.capacity === null ? null : { ...inventory.capacity },
				limitations: boundedViewMessages([...parent.limitations, ...inventory.limitations], parent.evidenceId, "limitations"),
				unknowns: ["The complete application route set, reachability and runtime permissions remain unknown.", ...inventory.coverage.candidate_enumeration === "partial" ? ["Some source/routing facts are incomplete; inspect sources and unknowns without reanalyzing."] : []]
			};
			const tooLarge = () => err(new AnalysisResourceConstraintError("inspect_analysis_view", "transport", "The requested route page cannot fit the analysis-view byte budget; select fewer fields or a smaller selection. The complete parent is retained.", {
				parent_evidence_id: parent.evidenceId,
				limit_bytes: PAGE_BYTES,
				collection: view.collection
			}));
			if (view.collection === "summary") {
				const summary = {
					...shared,
					items: [],
					sources: [],
					summary: {
						...data.summary,
						statistics: { ...data.summary.statistics },
						source_status_counts: { ...data.summary.source_status_counts },
						patterns_by_classification: { ...data.summary.patterns_by_classification }
					},
					byte_limited: false,
					coverage: completeWithinViewCoverage(inventory.routes.length, inventory.routes.length)
				};
				return jsonValueByteLength(summary, PROJECTION_BYTES) > PROJECTION_BYTES ? tooLarge() : ok(summary);
			}
			const page = view;
			const proof = (occurrence) => ({
				source_id: occurrence.source_id,
				occurrence_id: occurrence.id,
				source_range: occurrence.source_range,
				mechanism: occurrence.mechanism,
				derivation: occurrence.derivation,
				inferred_base_path: occurrence.inferred_base_path
			});
			const deliver = (source, ids, predicate, project) => {
				const rows = candidates(source, ids).filter(predicate), items = [], refs = new Map();
				let bytes = DIGEST_BYTES + jsonValueByteLength({
					...shared,
					items: [],
					sources: [],
					summary: null,
					byte_limited: false,
					coverage: {
						status: "complete-within-view",
						examined: Number.MAX_SAFE_INTEGER,
						total: Number.MAX_SAFE_INTEGER,
						next_offset: Number.MAX_SAFE_INTEGER,
						exhausted: false
					}
				}, PROJECTION_BYTES), byte_limited = false;
				if (bytes > PAGE_BYTES) return tooLarge();
				for (let index = page.offset; index < rows.length && items.length < page.limit; index++) {
					const projected = project(rows[index]), additions = [];
					let addedBytes = jsonValueByteLength(projected.item, PAGE_BYTES - bytes) + (items.length > 0 ? 1 : 0);
					for (const id of new Set(projected.sources)) {
						if (refs.has(id)) continue;
						const entry = data.sources.byId.get(id);
						if (entry !== undefined) {
							addedBytes += jsonValueByteLength(entry.row, Math.max(0, PAGE_BYTES - bytes - addedBytes)) + (refs.size + additions.length > 0 ? 1 : 0);
							additions.push(entry.row);
						}
					}
					if (bytes + addedBytes > PAGE_BYTES) {
						if (items.length === 0) return tooLarge();
						byte_limited = true;
						break;
					}
					bytes += addedBytes;
					items.push(projected.item);
					for (const row of additions) refs.set(row.id, row);
				}
				const result = {
					...shared,
					items: javaScriptRoutesViewItemsSchema.parse(items),
					sources: [...refs.values()],
					summary: null,
					byte_limited,
					coverage: pageViewCoverage(page.offset, items.length, rows.length)
				};
				return jsonValueByteLength({
					...result,
					items
				}, PROJECTION_BYTES) > PROJECTION_BYTES ? tooLarge() : ok(result);
			};
			if (page.collection === "routes") {
				const where = page.where, filters = {
					paths: selectedSet(where.paths),
					classifications: selectedSet(where.classifications),
					mechanisms: selectedSet(where.mechanisms)
				}, fields = page.fields ?? [
					"path",
					"classification",
					"classification_basis",
					"confidence",
					"mechanisms",
					"occurrence_count",
					"source_count"
				];
				return deliver(data.routes, where.ids, (row) => matches(filters.paths, row.path) && (where.path_prefix === undefined || row.path.startsWith(where.path_prefix)) && matches(filters.classifications, row.classification) && (where.mechanisms === undefined || row.mechanisms.some((mechanism) => filters.mechanisms.has(mechanism))) && (where.min_confidence === undefined || ranks[row.confidence] >= ranks[where.min_confidence]), (row) => {
					const occurrence = data.occurrences.byId.get(row.primary_occurrence_id).row;
					return {
						item: {
							...choose(row, fields),
							id: row.id,
							provenance: proof(occurrence)
						},
						sources: [occurrence.source_id]
					};
				});
			}
			if (page.collection === "occurrences") {
				const where = page.where, filters = {
					route_ids: selectedSet(where.route_ids),
					source_ids: selectedSet(where.source_ids),
					mechanisms: selectedSet(where.mechanisms)
				}, fields = page.fields ?? [
					"mechanism",
					"confidence",
					"derivation",
					"origin",
					"source_range",
					"unprefixed_path",
					"inferred_base_path"
				];
				return deliver(data.occurrences, where.ids, (row) => matches(filters.route_ids, row.route_id) && matches(filters.source_ids, row.source_id) && matches(filters.mechanisms, row.mechanism), (row) => ({
					item: {
						...choose(row, fields),
						id: row.id,
						route_id: row.route_id,
						source_id: row.source_id,
						provenance: proof(row)
					},
					sources: [row.source_id]
				}));
			}
			if (page.collection === "sources") {
				const where = page.where, filters = {
					keys: selectedSet(where.keys),
					statuses: selectedSet(where.statuses)
				}, fields = page.fields ?? [
					"path",
					"url",
					"container_sha256",
					"reason",
					"base_path",
					"reported_route_capacity"
				];
				return deliver(data.sources, where.ids, (row) => matches(filters.keys, row.key) && matches(filters.statuses, row.status), (row) => ({
					item: {
						...choose(row, fields),
						id: row.id,
						key: row.key,
						sha256: row.sha256,
						status: row.status
					},
					sources: []
				}));
			}
			const where = page.where, filters = {
				source_ids: selectedSet(where.source_ids),
				kinds: selectedSet(where.kinds)
			}, fields = page.fields ?? ["source_range", "reason"];
			return deliver(data.gaps, where.ids, (row) => matches(filters.source_ids, row.source_id) && matches(filters.kinds, row.kind), (row) => ({
				item: {
					...choose(row, fields),
					id: row.id,
					source_id: row.source_id,
					kind: row.kind,
					provenance: row.source_id === null ? null : {
						source_id: row.source_id,
						occurrence_id: null,
						source_range: row.source_range,
						mechanism: null,
						derivation: null,
						inferred_base_path: null
					}
				},
				sources: row.source_id === null ? [] : [row.source_id]
			}));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/sourceToBundleView.js
var mapping, candidate, identity, mappingRow, candidateRow, page$9, sourceToBundleViewRequestSchema, sourceToBundleViewItemsSchema, sourceToBundleViewContextSchema, checked$2, checkedReport$1, selected$1, columns, projectSourceToBundleView;
function init_sourceToBundleView() {
	return (init_sourceToBundleView = __esmMin((() => {
		init_sourceToBundleComparisonSchemas();
		init_immutableJson();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_selectViewRows();
		mapping = sourceToBundleComparisonResultSchema.shape.items.element;
		candidate = mapping.shape.candidates.element;
		identity = mapping.pick({
			mapping_id: true,
			source_path: true
		}).extend({ source_index: z.number().int().nonnegative() });
		mappingRow = mapping.omit({
			candidates: true,
			current_node_ids: true
		}).extend({
			source_index: identity.shape.source_index,
			candidate_count: z.number().int().nonnegative(),
			mapped_node_count: z.number().int().nonnegative()
		});
		candidateRow = candidate.extend({
			...identity.shape,
			candidate_index: z.number().int().nonnegative(),
			mapped: z.boolean()
		});
		page$9 = {
			kind: z.literal("source-to-bundle"),
			source_paths: z.array(z.string()).optional(),
			mapping_ids: z.array(mapping.shape.mapping_id).optional(),
			statuses: z.array(mapping.shape.status).optional(),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		};
		sourceToBundleViewRequestSchema = z.discriminatedUnion("collection", [z.strictObject({
			...page$9,
			collection: z.literal("mappings"),
			fields: z.array(mappingRow.keyof()).optional()
		}), z.strictObject({
			...page$9,
			collection: z.literal("candidates"),
			fields: z.array(candidateRow.keyof()).optional()
		})]);
		sourceToBundleViewItemsSchema = z.union([z.array(mappingRow.partial().required({
			mapping_id: true,
			source_path: true,
			source_index: true
		})), z.array(candidateRow.partial().required({
			mapping_id: true,
			source_path: true,
			source_index: true,
			candidate_index: true,
			current_node_id: true,
			mapped: true
		}))]);
		sourceToBundleViewContextSchema = sourceToBundleComparisonResultSchema.pick({
			comparison_id: true,
			reference: true,
			application: true,
			scoring: true,
			summary: true,
			evidence_links: true
		}).extend({
			source_coverage: sourceToBundleComparisonResultSchema.shape.coverage,
			unmapped_current_node_count: z.number().int().nonnegative()
		});
		checked$2 = new WeakMap();
		checkedReport$1 = (parent) => {
			const source = parent.normalizedResult;
			const reusable = typeof source === "object" && source !== null && parent.sealedResult === true && isImmutableJsonSnapshot(source);
			const cached = reusable ? checked$2.get(source) : undefined;
			if (cached !== undefined) return ok(cached);
			const parsed = parseAnalysisViewResult(sourceToBundleComparisonResultSchema, parent);
			if (!parsed.ok) return parsed;
			const report = reusable ? source : parsed.value;
			if (reusable) checked$2.set(source, report);
			return ok(report);
		};
		selected$1 = (values) => values === undefined ? undefined : new Set(values);
		columns = (row, fields) => {
			const source = row;
			return Object.fromEntries(fields.map((field) => [field, source[field]]));
		};
		projectSourceToBundleView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "source-to-bundle") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Source-to-bundle comparisons support summary and source-to-bundle pages"
			}]));
			const parsed = checkedReport$1(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const { items: _items, unmapped_current_node_ids, coverage: source_coverage, limitations: _limitations, ...facts } = report;
			const context = {
				...facts,
				source_coverage,
				unmapped_current_node_count: unmapped_current_node_ids.length
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "compare_source_to_bundle",
				parent_digest: parent.evidenceId.slice(3),
				artifact: null,
				limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
				unknowns: ["Candidate correspondence is not behavioral equivalence. Exhausting a selected page does not establish absence outside the examined inputs."]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: context,
				coverage: completeWithinViewCoverage(1, 1)
			});
			const paths = selected$1(view.source_paths), ids = selected$1(view.mapping_ids), statuses = selected$1(view.statuses);
			const matches = (row) => (paths === undefined || paths.has(row.source_path)) && (ids === undefined || ids.has(row.mapping_id)) && (statuses === undefined || statuses.has(row.status));
			const fields = view.fields ?? (view.collection === "mappings" ? [
				"status",
				"confidence",
				"source_sha256",
				"source_language",
				"candidate_count",
				"mapped_node_count"
			] : [
				"current_node_kind",
				"score",
				"confidence"
			]);
			let items, total;
			if (view.collection === "mappings") {
				const page = selectViewRows(report.items, view, matches, (row, source_index) => ({
					...columns({
						...row,
						source_index,
						candidate_count: row.candidates.length,
						mapped_node_count: row.current_node_ids.length
					}, fields),
					mapping_id: row.mapping_id,
					source_path: row.source_path,
					source_index
				}));
				items = page.rows;
				total = page.total;
			} else {
				items = [];
				total = 0;
				for (const [source_index, row] of report.items.entries()) {
					if (!matches(row)) continue;
					const start = Math.max(0, view.offset - total);
					const end = Math.min(row.candidates.length, start + view.limit - items.length);
					if (start < end) {
						const mapped = new Set(row.current_node_ids);
						for (let candidate_index = start; candidate_index < end; candidate_index++) {
							const candidate = row.candidates[candidate_index];
							items.push({
								...columns(candidate, fields),
								mapping_id: row.mapping_id,
								source_path: row.source_path,
								source_index,
								candidate_index,
								current_node_id: candidate.current_node_id,
								mapped: mapped.has(candidate.current_node_id)
							});
						}
					}
					total += row.candidates.length;
				}
			}
			return ok({
				kind: "source-to-bundle",
				view,
				...shared,
				...context,
				items,
				coverage: pageViewCoverage(view.offset, items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/gpuCodeObjectsView.js
var gpuCodeObjectsViewRequestSchema, gpuCodeObjectsSummarySchema, gpuCodeObjectsItemsSchema, gpuCodeObjectsPtxPageSchema, summarizeGpuTargets, checkedGpu, readGpuFacts, projectGpuCodeObjectsView;
function init_gpuCodeObjectsView() {
	return (init_gpuCodeObjectsView = __esmMin((() => {
		init_immutableJson();
		init_digests();
		init_gpuCodeObjects();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_result();
		init_jsonValueByteLength();
		init_analysisErrorCore();
		gpuCodeObjectsViewRequestSchema = z.discriminatedUnion("collection", [
			gpuCodeObjectsSelectionSchema.options[0].extend({ kind: z.literal("gpu-code-objects") }),
			gpuCodeObjectsSelectionSchema.options[1].extend({ kind: z.literal("gpu-code-objects") }),
			gpuCodeObjectsSelectionSchema.options[2].extend({ kind: z.literal("gpu-code-objects") }),
			gpuCodeObjectsSelectionSchema.options[3].extend({ kind: z.literal("gpu-code-objects") })
		]);
		gpuCodeObjectsSummarySchema = gpuCodeObjectsObjectSchema.omit({
			objects: true,
			kernels: true,
			ptx_artifacts: true
		}).extend({
			counts: z.strictObject({
				objects: z.number().int().nonnegative(),
				kernels: z.number().int().nonnegative(),
				ptx_artifacts: z.number().int().nonnegative(),
				targets: z.number().int().nonnegative()
			}),
			target_preview: z.array(z.string())
		});
		gpuCodeObjectsItemsSchema = z.union([
			z.array(gpuObjectSchema.partial().required({
				id: true,
				kind: true,
				target: true,
				location: true,
				metadata_location: true,
				payload_target: true,
				target_consistency: true,
				inspection: true
			})),
			z.array(gpuKernelSchema.partial().required({
				id: true,
				object_id: true,
				location: true,
				sources: true,
				representation: true
			})),
			z.array(gpuTargetSchema.partial().required({
				id: true,
				target: true,
				confidence: true,
				kernel_coverage: true
			}))
		]);
		gpuCodeObjectsPtxPageSchema = z.strictObject({
			artifact_id: z.string(),
			object_id: z.string(),
			sha256: digestSchema,
			byte_length: z.number().int().nonnegative(),
			text: z.string(),
			offset: z.number().int().nonnegative(),
			offset_unit: z.literal("utf16-code-unit")
		});
		summarizeGpuTargets = (report) => {
			const groups = new Map();
			const kernelCounts = new Map();
			for (const kernel of report.kernels) kernelCounts.set(kernel.object_id, (kernelCounts.get(kernel.object_id) ?? 0) + 1);
			for (const object of report.objects) {
				if (object.kind === "cuda-fatbin" || object.kind === "hip-bundle" || object.kind === "native-section" || object.kind === "host") continue;
				let group = groups.get(object.target);
				if (group === undefined) {
					group = {
						encoded: 0n,
						decoded: 0n,
						row: {
							id: `target:${JSON.stringify(object.target)}`,
							target: object.target,
							confidence: "derived",
							object_count: 0,
							kernel_count: 0,
							encoded_bytes: "0",
							decoded_bytes: "0",
							kernel_coverage: report.analysis === "inventory" ? "not-requested" : "complete",
							by_kind: {
								ptx: 0,
								cubin: 0,
								amdgpu: 0,
								unknown: 0
							}
						}
					};
					groups.set(object.target, group);
				}
				group.row.object_count++;
				group.row.by_kind[object.kind]++;
				group.row.kernel_count += kernelCounts.get(object.id) ?? 0;
				group.encoded += BigInt(object.encoded_size);
				group.decoded = group.decoded === null || object.decoded_size === null ? null : group.decoded + BigInt(object.decoded_size);
				if (report.analysis === "kernels" && object.inspection !== "complete") group.row.kernel_coverage = "partial";
			}
			return [...groups.values()].map(({ row, encoded, decoded }) => ({
				...row,
				encoded_bytes: encoded.toString(),
				decoded_bytes: decoded?.toString() ?? null
			}));
		};
		checkedGpu = new WeakMap();
		readGpuFacts = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && key !== null && typeof key === "object" && isImmutableJsonSnapshot(key);
			let checked = reusable ? checkedGpu.get(key) : undefined;
			if (checked === undefined) {
				const parsed = parseAnalysisViewResult(gpuCodeObjectsSchema, parent);
				if (!parsed.ok) return parsed;
				const report = reusable ? key : parsed.value;
				const { objects, kernels, ptx_artifacts, ...context } = report;
				const targets = new Set(objects.flatMap((row) => row.target === null ? [] : [row.target]));
				checked = {
					report,
					targets: summarizeGpuTargets(report),
					byId: new Map(objects.map((row) => [row.id, row])),
					summary: {
						...context,
						counts: {
							objects: objects.length,
							kernels: kernels.length,
							ptx_artifacts: ptx_artifacts.length,
							targets: targets.size
						},
						target_preview: [...targets].slice(0, 8).map((target) => target.slice(0, 256))
					}
				};
				if (reusable) checkedGpu.set(key, checked);
			}
			if (parent.subject != null && (parent.subject.local_path !== checked.report.artifact.path || parent.subject.digest.sha256 !== checked.report.artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "GPU Evidence subject does not match its recorded artifact"
			}]));
			return ok(checked);
		};
		projectGpuCodeObjectsView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "gpu-code-objects") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "GPU Evidence supports summary and gpu-code-objects pages"
			}]));
			const parsed = readGpuFacts(parent);
			if (!parsed.ok) return parsed;
			const { report, byId, summary, targets: targetRows } = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_gpu_code_objects",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
				unknowns: ["GPU execution, runtime compatibility and host launch sites were not inspected.", ...report.coverage.payloads !== "complete" ? ["Kernel facts are incomplete outside successfully decoded selected payloads; consult object inspection states."] : []]
			};
			if (view.kind === "summary") {
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						...summary,
						limitations: shared.limitations
					},
					coverage: completeWithinViewCoverage(report.objects.length, report.objects.length)
				});
			}
			if (view.collection === "ptx") {
				const artifact = report.ptx_artifacts.find((row) => row.object_id === view.object_id);
				if (artifact === undefined) return err(analysisViewInputError([{
					path: ["view", "object_id"],
					reason: "invalid_value",
					message: "No retained PTX artifact exists for this object; inspect a selected PTX payload with analysis kernels"
				}]));
				const end = Math.min(artifact.text.length, view.offset + view.limit);
				const split = (offset) => offset > 0 && offset < artifact.text.length && /[\uD800-\uDBFF]/u.test(artifact.text[offset - 1]) && /[\uDC00-\uDFFF]/u.test(artifact.text[offset]);
				if (split(view.offset) || split(end)) return err(analysisViewInputError([{
					path: ["view"],
					reason: "invalid_value",
					message: "PTX text page must end and start on Unicode scalar boundaries; offsets use UTF-16 code units"
				}]));
				const text = artifact.text.slice(view.offset, end);
				if (jsonValueByteLength(text, 1024 * 1024) > 1024 * 1024) return err(new AnalysisResourceConstraintError("inspect_analysis_view", "memory", "PTX page exceeds the 1 MiB response budget; lower limit", { maximum_page_bytes: 1024 * 1024 }));
				return ok({
					kind: "gpu-code-objects",
					view,
					...shared,
					source_coverage: report.coverage,
					items: [],
					ptx: {
						artifact_id: artifact.id,
						object_id: artifact.object_id,
						sha256: artifact.sha256,
						byte_length: artifact.byte_length,
						text,
						offset: view.offset,
						offset_unit: "utf16-code-unit"
					},
					coverage: pageViewCoverage(view.offset, text.length, artifact.text.length)
				});
			}
			const targets = view.targets === undefined ? undefined : new Set(view.targets);
			const ids = view.ids === undefined ? undefined : new Set(view.ids);
			const objectIds = view.collection === "kernels" && view.object_ids !== undefined ? new Set(view.object_ids) : undefined;
			const names = view.collection === "kernels" && view.names !== undefined ? new Set(view.names) : undefined;
			const rows = view.collection === "objects" ? report.objects : view.collection === "targets" ? targetRows : report.kernels;
			const matchesTarget = (row) => {
				if (targets === undefined) return true;
				const target = "target" in row ? row.target : byId.get(row.object_id)?.target;
				return target !== null && target !== undefined && targets.has(target);
			};
			const matches = rows.filter((row) => (ids === undefined || ids.has(row.id)) && (objectIds === undefined || "object_id" in row && objectIds.has(row.object_id)) && (names === undefined || "name" in row && names.has(row.name)) && matchesTarget(row));
			const defaults = view.collection === "kernels" ? new Set([
				"id",
				"object_id",
				"name",
				"parameter_count",
				"parameter_bytes",
				"registers",
				"shared_bytes",
				"private_bytes",
				"location",
				"limitations"
			]) : undefined;
			const fields = view.fields === undefined ? defaults : new Set(view.fields);
			const items = matches.slice(view.offset, view.offset + view.limit).map((row) => {
				const projected = {};
				for (const [key, value] of Object.entries(row)) if (key === "id" || key === "object_id" || key === "location" || key === "metadata_location" || key === "kind" || key === "target" || key === "payload_target" || key === "target_consistency" || key === "inspection" || key === "sources" || key === "representation" || view.collection === "targets" && (key === "target" || key === "confidence" || key === "kernel_coverage") || fields === undefined || fields.has(key)) projected[key] = value;
				return projected;
			});
			if (jsonValueByteLength(items, 1024 * 1024) > 1024 * 1024) return err(new AnalysisResourceConstraintError("inspect_analysis_view", "memory", "GPU page exceeds the 1 MiB response budget; select fewer fields or rows", { maximum_page_bytes: 1024 * 1024 }));
			return ok({
				kind: "gpu-code-objects",
				view,
				...shared,
				source_coverage: report.coverage,
				items: gpuCodeObjectsItemsSchema.parse(items),
				ptx: null,
				coverage: pageViewCoverage(view.offset, items.length, matches.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/model/modelArtifact.js
var count$3, decimal, modelSourceSchema, location, modelMetadataSchema, modelTensorSchema, modelArtifactObjectSchema, modelArtifactPartialTensorSchema, modelArtifactPartialSchema, modelArtifactSchema;
function init_modelArtifact() {
	return (init_modelArtifact = __esmMin((() => {
		init_localPath();
		init_digests();
		init_jsonValue();
		count$3 = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
		decimal = z.string().regex(/^(?:0|[1-9][0-9]*)$/u);
		modelSourceSchema = z.strictObject({
			path: localPathStringSchema,
			file_size: count$3,
			header_sha256: digestSchema,
			header_length: count$3,
			sha256: digestSchema.nullable(),
			bytes_read: count$3,
			read_scope: z.enum(["header", "full-file"])
		});
		location = {
			source_offset: count$3,
			source_length: count$3,
			json_pointer: z.string().nullable()
		};
		modelMetadataSchema = z.strictObject({
			index: count$3,
			key: z.string(),
			type: z.string(),
			value: jsonValueSchema,
			element_type: z.string().nullable(),
			element_count: count$3.nullable(),
			preview_complete: z.boolean(),
			...location
		});
		modelTensorSchema = z.strictObject({
			index: count$3,
			name: z.string(),
			type: z.string(),
			type_id: count$3.nullable(),
			shape: z.array(decimal),
			data_offset: count$3,
			file_offset: count$3,
			byte_length: count$3.nullable(),
			parameter_count: decimal,
			byte_length_state: z.enum([
				"derived",
				"declared",
				"unknown"
			]),
			storage_validation: z.enum(["consistent", "unknown"]),
			...location
		});
		modelArtifactObjectSchema = z.strictObject({
			artifact: modelSourceSchema,
			format: z.enum(["gguf", "safetensors"]),
			version: count$3.nullable(),
			byte_order: z.enum(["little", "big"]),
			alignment: count$3.nullable(),
			tensor_data_offset: count$3,
			metadata: z.array(modelMetadataSchema),
			tensors: z.array(modelTensorSchema),
			totals: z.strictObject({
				confidence: z.literal("derived"),
				parameter_count: decimal,
				tensor_bytes: count$3.nullable(),
				by_type: z.array(z.strictObject({
					type: z.string(),
					tensors: count$3,
					parameter_count: decimal,
					bytes: count$3.nullable()
				}))
			}),
			coverage: z.strictObject({
				header: z.literal("complete"),
				tensor_data: z.literal("not-interpreted"),
				array_values: z.enum(["complete", "preview"]),
				tensor_ranges: z.enum(["complete", "partial"]),
				storage_sizes: z.enum(["complete", "partial"])
			}),
			limitations: z.array(z.string())
		});
		modelArtifactPartialTensorSchema = z.strictObject({
			index: count$3,
			name: z.string(),
			type: z.string(),
			type_id: count$3.nullable(),
			shape: z.array(decimal),
			data_offset: count$3,
			file_offset: count$3.nullable(),
			byte_length: count$3.nullable(),
			parameter_count: decimal,
			byte_length_state: z.enum([
				"derived",
				"declared",
				"unknown"
			]),
			storage_validation: z.enum([
				"consistent",
				"unknown",
				"not-established"
			]),
			...location
		});
		modelArtifactPartialSchema = z.strictObject({
			kind: z.literal("model-artifact-partial"),
			artifact: z.strictObject({
				path: localPathStringSchema,
				observed_file_size: count$3,
				header_sha256: z.null(),
				sha256: z.null(),
				file_identity: z.literal("unverified")
			}),
			format: z.enum(["gguf", "safetensors"]),
			version: count$3.nullable(),
			byte_order: z.enum(["little", "big"]).nullable(),
			alignment: count$3.nullable(),
			declared_metadata_count: count$3.nullable(),
			declared_tensor_count: count$3.nullable(),
			metadata: z.array(modelMetadataSchema),
			tensor_declarations: z.array(modelArtifactPartialTensorSchema),
			tensors: z.array(modelTensorSchema),
			coverage: z.strictObject({
				header: z.enum(["partial", "complete"]),
				metadata: z.enum([
					"not-started",
					"partial",
					"complete"
				]),
				tensors: z.enum([
					"not-started",
					"partial",
					"complete"
				])
			}),
			limitations: z.array(z.string())
		});
		modelArtifactSchema = modelArtifactObjectSchema.superRefine((report, context) => {
			const collections = [
				{
					name: "metadata",
					rows: report.metadata,
					identity: "key"
				},
				{
					name: "tensors",
					rows: report.tensors,
					identity: "name"
				},
				{
					name: "totals.by_type",
					rows: report.totals.by_type,
					identity: "type"
				}
			];
			for (const { name, rows, identity } of collections) {
				const seen = new Set();
				const prefix = name.split(".");
				for (let index = 0; index < rows.length; index++) {
					const row = rows[index];
					if ("index" in row && row.index !== index) {
						context.addIssue({
							code: "custom",
							path: [
								...prefix,
								index,
								"index"
							],
							message: "Model row index must equal its source position"
						});
						return;
					}
					const value = identity === "key" && "key" in row ? row.key : identity === "name" && "name" in row ? row.name : row.type;
					if (seen.has(value)) {
						context.addIssue({
							code: "custom",
							path: [
								...prefix,
								index,
								identity
							],
							message: "Model collection identities must be unique"
						});
						return;
					}
					seen.add(value);
				}
			}
		});
	})))();
}

//#endregion
//#region dist/domain/model/modelArtifactQuery.js
var modelTypeRowSchema, page$8, tensorSelectionSchema, typeSelectionSchema, metadataSelectionSchema, modelArtifactSelectionSchema, modelArtifactViewRequestSchema, inspectModelArtifactInputSchema;
function init_modelArtifactQuery() {
	return (init_modelArtifactQuery = __esmMin((() => {
		init_localPath();
		init_modelArtifact();
		modelTypeRowSchema = modelArtifactObjectSchema.shape.totals.shape.by_type.element.extend({ index: z.number().int().nonnegative() });
		page$8 = {
			indices: z.array(z.number().int().nonnegative()).optional(),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(32)
		};
		tensorSelectionSchema = z.strictObject({
			...page$8,
			collection: z.literal("tensors"),
			names: z.array(z.string()).optional(),
			storage_validation: z.array(modelTensorSchema.shape.storage_validation).optional(),
			types: z.array(z.string()).optional(),
			fields: z.array(modelTensorSchema.keyof()).optional()
		});
		typeSelectionSchema = z.strictObject({
			...page$8,
			collection: z.literal("types"),
			types: z.array(z.string()).optional(),
			fields: z.array(modelTypeRowSchema.keyof()).optional()
		});
		metadataSelectionSchema = z.strictObject({
			...page$8,
			collection: z.literal("metadata"),
			keys: z.array(z.string()).optional(),
			fields: z.array(modelMetadataSchema.keyof()).optional()
		});
		modelArtifactSelectionSchema = z.discriminatedUnion("collection", [
			tensorSelectionSchema,
			typeSelectionSchema,
			metadataSelectionSchema
		]);
		modelArtifactViewRequestSchema = z.discriminatedUnion("collection", [
			tensorSelectionSchema.extend({ kind: z.literal("model-artifact") }),
			typeSelectionSchema.extend({ kind: z.literal("model-artifact") }),
			metadataSelectionSchema.extend({ kind: z.literal("model-artifact") })
		]);
		inspectModelArtifactInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema,
			hash: z.enum(["header", "full"]).default("header").describe("header reads declarations only; full streams all bytes for SHA-256"),
			detail: z.enum(["summary", "complete"]).default("summary"),
			view: modelArtifactSelectionSchema.optional().describe("Return this selected page with compact model context, retaining complete Evidence; requires summary detail")
		}).superRefine((value, context) => {
			if (value.view !== undefined && value.detail === "complete") context.addIssue({
				code: "custom",
				path: ["view"],
				message: "view selects summary delivery; omit view to request complete Evidence"
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/modelArtifactView.js
var HEADLINE_TEXT_LIMIT, modelArtifactSummarySchema, summarizeModel, modelContextSchema, modelArtifactViewItemsSchema, modelArtifactViewContextSchema, checked$1, read, projectModelArtifactView;
function init_modelArtifactView() {
	return (init_modelArtifactView = __esmMin((() => {
		init_modelArtifactQuery();
		init_modelArtifact();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_immutableJson();
		init_result();
		init_analysisViewCoverage();
		HEADLINE_TEXT_LIMIT = 512;
		modelArtifactSummarySchema = modelArtifactObjectSchema.omit({
			metadata: true,
			tensors: true,
			totals: true
		}).extend({
			totals: modelArtifactObjectSchema.shape.totals.omit({ by_type: true }),
			counts: z.strictObject({
				metadata: z.number().int().nonnegative(),
				tensors: z.number().int().nonnegative(),
				types: z.number().int().nonnegative()
			}),
			headlines: z.array(modelMetadataSchema.omit({
				source_offset: true,
				source_length: true,
				json_pointer: true
			})),
			chat_template_present: z.boolean()
		});
		summarizeModel = (report) => {
			const { tensors, metadata, totals: { by_type, ...totals }, ...identity } = report;
			const headlineKeys = new Set([
				"general.architecture",
				"general.name",
				"general.file_type",
				"tokenizer.ggml.model",
				"format"
			]);
			const architecture = metadata.find((row) => row.key === "general.architecture")?.value;
			if (typeof architecture === "string" && architecture.length <= HEADLINE_TEXT_LIMIT - ".context_length".length) headlineKeys.add(`${architecture}.context_length`);
			return {
				...identity,
				totals,
				counts: {
					tensors: tensors.length,
					metadata: metadata.length,
					types: by_type.length
				},
				headlines: metadata.filter((row) => headlineKeys.has(row.key) && row.element_count === null && row.element_type === null && row.type.length <= HEADLINE_TEXT_LIMIT && (row.value === null || typeof row.value === "boolean" || typeof row.value === "number" || typeof row.value === "string" && row.value.length <= HEADLINE_TEXT_LIMIT)).map(({ source_offset: _offset, source_length: _length, json_pointer: _pointer, ...row }) => row),
				chat_template_present: metadata.some((row) => row.type === "STRING" && typeof row.value === "string" && (row.key === "tokenizer.chat_template" || row.key.startsWith("tokenizer.chat_template.")))
			};
		};
		modelContextSchema = modelArtifactSummarySchema.omit({
			artifact: true,
			coverage: true,
			limitations: true
		});
		modelArtifactViewItemsSchema = z.union([
			z.array(modelTypeRowSchema.partial().required({ index: true })),
			z.array(modelTensorSchema.partial().required({ index: true })),
			z.array(modelMetadataSchema.partial().required({ index: true }))
		]);
		modelArtifactViewContextSchema = z.strictObject({
			source: modelSourceSchema,
			model: modelContextSchema,
			source_coverage: modelArtifactObjectSchema.shape.coverage
		});
		checked$1 = new WeakMap();
		read = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && key !== null && typeof key === "object" && isImmutableJsonSnapshot(key);
			const cached = reusable ? checked$1.get(key) : undefined;
			let report;
			if (cached !== undefined) report = cached.report;
			else {
				const parsed = parseAnalysisViewResult(modelArtifactSchema, parent);
				if (!parsed.ok) return parsed;
				report = reusable ? key : parsed.value;
			}
			if (parent.subject != null && (parent.subject.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Model full-file subject does not match its recorded artifact"
			}]));
			if (cached !== undefined) return ok(cached);
			const summary = summarizeModel(report);
			const { artifact: _artifact, coverage: _coverage, limitations: _limitations, ...model } = summary;
			const value = {
				report,
				summary,
				model,
				typeRows: report.totals.by_type.map((row, index) => ({
					index,
					...row
				})),
				types: new Map(report.totals.by_type.map((row, index) => [row.type, index])),
				names: new Map(report.tensors.map((row) => [row.name, row.index])),
				keys: new Map(report.metadata.map((row) => [row.key, row.index]))
			};
			if (reusable) checked$1.set(key, value);
			return ok(value);
		};
		projectModelArtifactView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "model-artifact") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Model Evidence supports summary and model-artifact metadata/tensor pages"
			}]));
			const parsed = read(parent);
			if (!parsed.ok) return parsed;
			const { report, summary, model, names, keys, types: typeIndices, typeRows } = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_model_artifact",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: boundedViewMessages(parent.limitations, parent.evidenceId, "limitations"),
				unknowns: ["Tensor values, runtime execution and inference quality were not inspected.", ...report.artifact.sha256 === null ? ["Full-file content identity is unknown; header_sha256 commits only to declarations."] : []]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: {
					...summary,
					limitations: boundedViewMessages(summary.limitations, parent.evidenceId, "limitations")
				},
				coverage: completeWithinViewCoverage(1, 1)
			});
			const rows = view.collection === "tensors" ? report.tensors : view.collection === "metadata" ? report.metadata : typeRows;
			const selectedNames = view.collection === "tensors" ? view.names : view.collection === "metadata" ? view.keys : view.types;
			const lookup = view.collection === "tensors" ? names : view.collection === "metadata" ? keys : typeIndices;
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			const types = view.collection === "tensors" && view.types !== undefined ? new Set(view.types) : undefined;
			const storageStates = view.collection === "tensors" && view.storage_validation !== undefined ? new Set(view.storage_validation) : undefined;
			let selected;
			if (selectedNames !== undefined) selected = [...new Set(selectedNames.flatMap((name) => {
				const index = lookup.get(name);
				return index === undefined ? [] : [index];
			}))].sort((a, b) => a - b);
			else if (indices !== undefined) selected = [...indices].filter((index) => index < rows.length).sort((a, b) => a - b);
			if (indices !== undefined || types !== undefined || storageStates !== undefined) selected = (selected ?? rows.map((row) => row.index)).filter((index) => {
				const row = rows[index];
				return (indices === undefined || indices.has(index)) && (types === undefined || types.has(row.type)) && (storageStates === undefined || "storage_validation" in row && storageStates.has(row.storage_validation));
			});
			const total = selected?.length ?? rows.length;
			const pageIndices = selected === undefined ? Array.from({ length: Math.max(0, Math.min(view.limit, rows.length - view.offset)) }, (_, index) => view.offset + index) : selected.slice(view.offset, view.offset + view.limit);
			const fields = view.fields === undefined ? undefined : new Set(view.fields);
			const items = pageIndices.map((index) => {
				const row = rows[index];
				const result = { index };
				for (const [name, value] of Object.entries(row)) if (fields === undefined || fields.has(name)) result[name] = value;
				return result;
			});
			return ok({
				kind: "model-artifact",
				view,
				...shared,
				source: report.artifact,
				model,
				source_coverage: report.coverage,
				items: modelArtifactViewItemsSchema.parse(items),
				coverage: pageViewCoverage(view.offset, items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/commandObservation.js
var commandObservationSchema, gdbCommandResultSchema, commandEvidenceDetailSchema;
function init_commandObservation() {
	return (init_commandObservation = __esmMin((() => {
		commandObservationSchema = z.strictObject({
			stdout: z.string(),
			stderr: z.string(),
			exit_code: z.union([
				z.string(),
				z.number(),
				z.null()
			]),
			signal: z.string().nullable(),
			output_truncated: z.boolean(),
			completion_status: z.enum(["complete", "unknown"]),
			artifact_sha256_after: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			artifact_changed: z.boolean().nullable()
		});
		gdbCommandResultSchema = z.strictObject({
			command: z.string(),
			mi: z.string().describe("The console command's independently framed MI result record; empty when a separate read-only query proves completion but raw stdout prevents identifying the original result class."),
			records: z.array(z.string()),
			console: z.string(),
			target: z.string(),
			log: z.string(),
			process_exit_observed: z.boolean().exactOptional(),
			process_exit_code: z.number().int().nullable().exactOptional(),
			process_exit_signal: z.string().nullable().exactOptional(),
			output_truncated: z.boolean(),
			output_invalid_utf8: z.literal(true).exactOptional(),
			completion_status: z.enum(["complete", "unknown"])
		});
		commandEvidenceDetailSchema = z.enum(["complete", "summary"]).default("complete").describe("complete returns the original Evidence; summary retains that complete parent and returns command output once with completion and source context.");
	})))();
}

//#endregion
//#region dist/domain/analysisView/commandObservationView.js
var commandSummaryContext, gdbCommandSummarySchema, projectCommandObservationView;
function init_commandObservationView() {
	return (init_commandObservationView = __esmMin((() => {
		init_commandObservation();
		init_digests();
		init_evidence();
		init_inputIssueProjection();
		init_jsonValue();
		init_result();
		init_analysisViewCoverage();
		init_analysisViewErrors();
		init_analysisViewParent();
		commandSummaryContext = {
			source_provider: providerSchema.nullable(),
			source_analysis_profile_digest: digestSchema.nullable(),
			source_parameters: jsonValueSchema
		};
		gdbCommandSummarySchema = gdbCommandResultSchema.omit({
			console: true,
			target: true,
			log: true
		}).extend({ available_counts: z.strictObject({
			records: z.number().int().nonnegative(),
			console_utf16_units: z.number().int().nonnegative(),
			target_utf16_units: z.number().int().nonnegative(),
			log_utf16_units: z.number().int().nonnegative()
		}) });
		projectCommandObservationView = (parent, view) => {
			if (view.kind !== "summary") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Command observations support summary views."
			}]));
			if (parent.operation !== "gdb_console" && parent.operation !== "inspect_with_objdump") return err(analysisViewInputError([{
				path: ["source", "operation"],
				reason: "invalid_value",
				message: "Unsupported command-observation operation."
			}]));
			const parameters = jsonValueSchema.safeParse(parent.parameters ?? null);
			if (!parameters.success) return err(analysisInputErrorFromIssues("inspect_analysis_view", parameters.error.issues.map((issue) => ({
				...issue,
				path: [
					"source",
					"parameters",
					...issue.path
				]
			})), { source: { parameters: parent.parameters } }, { cause: parameters.error }));
			const artifact = parent.subject === null ? null : parent.subject === undefined ? parent.artifact ?? null : {
				path: parent.subject.local_path,
				sha256: parent.subject.digest.sha256
			};
			const shared = {
				kind: "summary",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_digest: parent.evidenceId.slice(3),
				artifact,
				source_provider: parent.provider ?? null,
				source_analysis_profile_digest: parent.analysisProfileDigest ?? null,
				source_parameters: parameters.data,
				coverage: completeWithinViewCoverage(1, 1),
				limitations: boundedViewMessages(parent.limitations, parent.evidenceId, "limitations"),
				unknowns: boundedViewMessages(["This retained command observation does not establish current target state or global analysis coverage."], parent.evidenceId, "unknowns")
			};
			if (parent.operation === "gdb_console") {
				const parsed = parseAnalysisViewResult(gdbCommandResultSchema, parent);
				if (!parsed.ok) return parsed;
				const selection = parameters.data;
				if (typeof selection === "object" && selection !== null && !Array.isArray(selection) && typeof selection.command === "string" && selection.command !== parsed.value.command) return err(analysisViewInputError([{
					path: [
						"source",
						"parameters",
						"command"
					],
					reason: "invalid_value",
					message: "The captured command conflicts with its source parameters."
				}]));
				const { console, target, log, ...records } = parsed.value;
				return ok({
					...shared,
					parent_operation: "gdb_console",
					summary: {
						...records,
						available_counts: {
							records: records.records.length,
							console_utf16_units: console.length,
							target_utf16_units: target.length,
							log_utf16_units: log.length
						}
					}
				});
			}
			const parsed = parseAnalysisViewResult(commandObservationSchema, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (artifact !== null && report.artifact_sha256_after !== null && report.artifact_changed !== null && report.artifact_changed !== (artifact.sha256 !== report.artifact_sha256_after)) return err(analysisViewInputError([{
				path: [
					"source",
					"normalized_result",
					"artifact_changed"
				],
				reason: "invalid_value",
				message: "The recorded artifact-change flag conflicts with the observed digests."
			}]));
			return ok({
				...shared,
				parent_operation: "inspect_with_objdump",
				summary: report
			});
		};
	})))();
}

//#endregion
//#region dist/domain/fridaSessionStatus.js
var fridaSessionStatusInputSchema, fridaSessionObservationSchema, fridaSessionStatusSchema;
function init_fridaSessionStatus() {
	return (init_fridaSessionStatus = __esmMin((() => {
		fridaSessionStatusInputSchema = z.strictObject({
			session_id: z.string().uuid(),
			detail: z.enum(["complete", "summary"]).optional()
		});
		fridaSessionObservationSchema = z.strictObject({
			session_id: z.string().uuid(),
			device_id: z.string(),
			state: z.enum([
				"paused",
				"running",
				"detached"
			]),
			target: z.string(),
			pid: z.number().int().nonnegative(),
			mode: z.enum(["attach", "spawn"])
		});
		fridaSessionStatusSchema = fridaSessionObservationSchema.extend({
			scripts: z.array(z.strictObject({
				script_id: z.string().uuid(),
				name: z.string()
			})),
			messages: z.array(z.unknown()),
			messages_truncated: z.boolean()
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/fridaSessionStatusView.js
var fridaSessionStatusSummarySchema, fridaSessionStatusViewContext, projectFridaSessionStatusView;
function init_fridaSessionStatusView() {
	return (init_fridaSessionStatusView = __esmMin((() => {
		init_evidence();
		init_fridaSessionStatus();
		init_result();
		init_analysisViewCoverage();
		init_analysisViewErrors();
		init_analysisViewParent();
		fridaSessionStatusSummarySchema = fridaSessionStatusSchema.omit({ messages: true }).extend({ messages_retained: z.number().int().nonnegative() });
		fridaSessionStatusViewContext = {
			source_provider: providerSchema.nullable(),
			source_parameters: z.strictObject({ session_id: z.string().uuid() })
		};
		projectFridaSessionStatusView = (parent, view) => {
			if (view.kind !== "summary") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Frida session status supports summary views."
			}]));
			const report = parseAnalysisViewResult(fridaSessionStatusSchema, parent);
			if (!report.ok) return report;
			const parameters = fridaSessionStatusViewContext.source_parameters.safeParse(parent.parameters);
			if (!parameters.success || parameters.data.session_id !== report.value.session_id) return err(analysisViewInputError([{
				path: [
					"source",
					"parameters",
					"session_id"
				],
				reason: "invalid_value",
				message: "The Frida status must identify the session selected by its source parameters."
			}]));
			const { messages, ...status } = report.value;
			return ok({
				kind: "summary",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_digest: parent.evidenceId.slice(3),
				parent_operation: "frida_session_status",
				artifact: null,
				source_provider: parent.provider ?? null,
				source_parameters: parameters.data,
				summary: {
					...status,
					messages_retained: messages.length
				},
				coverage: completeWithinViewCoverage(1, 1),
				limitations: boundedViewMessages([...parent.limitations, `Message payloads remain in complete parent Evidence ${parent.evidenceId}; export_evidence_bundle preserves them.`], parent.evidenceId, "limitations"),
				unknowns: ["This is a captured session observation; querying retained Evidence does not refresh live state or establish target process identity after exit or reuse.", "messages_retained counts queued messages, not all target events. messages_truncated preserves the provider's capture limitation; payload meanings and global event coverage are unknown."]
			});
		};
	})))();
}

//#endregion
//#region dist/domain/binaryMetadataArchitecture.js
var binaryMetadataArchitecture;
function init_binaryMetadataArchitecture() {
	return (init_binaryMetadataArchitecture = __esmMin((() => {
		init_binaryTargetTypes();
		binaryMetadataArchitecture = (architecture) => {
			switch (architecture) {
				case "386": return "x86";
				case "amd64": return "x86_64";
				case "ppc": return "powerpc";
				default: return BINARY_ARCHITECTURES.find((supported) => supported === architecture);
			}
		};
	})))();
}

//#endregion
//#region dist/domain/rust/rustBinary.js
var RUST_AUDITABLE_FORMAT_VERSIONS, index$2, rustcHash, rustPackageFeaturesSchema, rustPackageSchema, dependencyEdgeSchema, rustAuditableMetadataSchema, rustcCommitSchema, inspectRustBinaryInputSchema, rustBinarySchema, issue, inside, checkSection, checkPackages, cyclicDependencyIndices, dependencyPostorder, reversedDependencyEdges, dependencyComponent, dependencyComponentInCycle, checkSlice, checkRustc;
function init_rustBinary() {
	return (init_rustBinary = __esmMin((() => {
		init_digests();
		init_localPath();
		init_binaryMetadataArchitecture();
		init_machoTargetSelection();
		RUST_AUDITABLE_FORMAT_VERSIONS = [
			0,
			1,
			8
		];
		index$2 = z.int().nonnegative();
		rustcHash = z.string().regex(/^[0-9a-f]{40}$/u);
		rustPackageFeaturesSchema = z.array(z.string().min(1)).nullable();
		rustPackageSchema = z.strictObject({
			name: z.string().min(1),
			version: z.string().min(1),
			source: z.string().min(1),
			kind: z.enum(["runtime", "build"]).nullable(),
			dependencies: z.array(index$2),
			features: rustPackageFeaturesSchema.default(null),
			root: z.boolean()
		});
		dependencyEdgeSchema = z.strictObject({
			from_index: index$2,
			to_index: index$2
		});
		rustAuditableMetadataSchema = z.strictObject({
			section_name: z.enum([".dep-v0", "__DATA,.dep-v0"]),
			file_offset: index$2,
			/** Stored section range, including accepted PE file-alignment bytes. */
			section_bytes: z.int().positive(),
			/** Bytes consumed by the zlib stream; the inflate ratio uses this size. */
			compressed_bytes: z.int().positive(),
			uncompressed_bytes: z.int().positive(),
			/** Original embedded revision; null means the source omitted the field. */
			format_version: z.int().nonnegative().max(4294967295).nullable(),
			packages: z.array(rustPackageSchema),
			root_package_index: index$2.nullable(),
			dependency_edges: z.array(dependencyEdgeSchema),
			cyclic_dependency_indices: z.array(index$2)
		});
		rustcCommitSchema = z.strictObject({
			evidence_kind: z.literal("inferred"),
			hashes: z.array(z.strictObject({
				hash: rustcHash,
				file_offset: index$2
			})).min(1)
		});
		inspectRustBinaryInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to the selected executable or library"),
			architecture: machoSliceArchitectureSchema.exactOptional()
		});
		rustBinarySchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				sha256: digestSchema,
				bytes: index$2
			}),
			format: z.enum([
				"elf",
				"pe",
				"macho"
			]),
			architecture: z.string(),
			bits: z.union([z.literal(32), z.literal(64)]),
			byte_order: z.enum(["little", "big"]),
			/** The universal slice that was read; file offsets stay inside it. */
			selected_slice: machoTargetSelectionSchema.exactOptional(),
			auditable_metadata: rustAuditableMetadataSchema.nullable(),
			rustc_commit: rustcCommitSchema.nullable(),
			limitations: z.array(z.string())
		}).superRefine((report, context) => {
			const metadata = report.auditable_metadata;
			if (metadata !== null) {
				checkSection(report.artifact.bytes, metadata, context);
				checkPackages(metadata, context);
			}
			checkRustc(report.artifact.bytes, report.rustc_commit, context);
			checkSlice(report, context);
		});
		issue = (context, path, message) => {
			context.addIssue({
				code: "custom",
				path,
				message
			});
		};
		inside = (fileBytes, offset, size) => offset <= fileBytes && size <= fileBytes - offset;
		checkSection = (fileBytes, metadata, context) => {
			if (!inside(fileBytes, metadata.file_offset, metadata.section_bytes) || metadata.compressed_bytes > metadata.section_bytes) issue(context, ["auditable_metadata", "file_offset"], "Dependency section range is outside the selected artifact or shorter than its compressed stream.");
		};
		checkPackages = (metadata, context) => {
			const roots = [];
			const edgesByPackage = new Map();
			for (const [position, edge] of metadata.dependency_edges.entries()) {
				if (edge.from_index >= metadata.packages.length || edge.to_index >= metadata.packages.length) {
					issue(context, [
						"auditable_metadata",
						"dependency_edges",
						position
					], "Dependency edge index is outside the package list.");
					continue;
				}
				const grouped = edgesByPackage.get(edge.from_index);
				if (grouped === undefined) edgesByPackage.set(edge.from_index, [edge]);
				else grouped.push(edge);
			}
			for (const [packageIndex, pkg] of metadata.packages.entries()) {
				if (pkg.root) roots.push(packageIndex);
				const edges = edgesByPackage.get(packageIndex) ?? [];
				if (edges.length !== pkg.dependencies.length || edges.some((edge, index) => edge.to_index !== pkg.dependencies[index])) issue(context, ["auditable_metadata", "dependency_edges"], "Dependency edges do not match package dependency indices.");
				if (pkg.dependencies.some((target) => target >= metadata.packages.length)) issue(context, [
					"auditable_metadata",
					"packages",
					packageIndex,
					"dependencies"
				], "Dependency index is outside the package list.");
			}
			const root = metadata.root_package_index;
			if (root === null ? roots.length !== 0 : roots.length !== 1 || roots[0] !== root) issue(context, ["auditable_metadata", "root_package_index"], "Root package index does not match packages marked root.");
			const cycles = cyclicDependencyIndices(metadata.packages);
			if (cycles.length !== metadata.cyclic_dependency_indices.length || cycles.some((index, position) => metadata.cyclic_dependency_indices[position] !== index)) issue(context, ["auditable_metadata", "cyclic_dependency_indices"], "Cyclic dependency indices do not match the cycles in package dependencies.");
		};
		cyclicDependencyIndices = (packages) => {
			const edges = packages.map((pkg) => pkg.dependencies);
			const order = dependencyPostorder(edges);
			const reversed = reversedDependencyEdges(edges);
			const seen = new Uint8Array(edges.length);
			const cyclic = new Set();
			for (let cursor = order.length - 1; cursor >= 0; cursor -= 1) {
				const start = order[cursor];
				if (start === undefined || seen[start] === 1) continue;
				const component = dependencyComponent(start, reversed, seen);
				if (dependencyComponentInCycle(component, edges)) for (const index of component) cyclic.add(index);
			}
			return [...cyclic].sort((left, right) => left - right);
		};
		dependencyPostorder = (edges) => {
			const seen = new Uint8Array(edges.length);
			const order = [];
			for (let start = 0; start < edges.length; start += 1) {
				if (seen[start] === 1) continue;
				const stack = [{
					index: start,
					edge: 0
				}];
				seen[start] = 1;
				while (stack.length > 0) {
					const frame = stack[stack.length - 1];
					if (frame === undefined) break;
					const next = edges[frame.index]?.[frame.edge];
					if (next === undefined) {
						stack.pop();
						order.push(frame.index);
						continue;
					}
					frame.edge += 1;
					if (seen[next] === 0) {
						seen[next] = 1;
						stack.push({
							index: next,
							edge: 0
						});
					}
				}
			}
			return order;
		};
		reversedDependencyEdges = (edges) => {
			const reversed = Array.from({ length: edges.length }, () => []);
			for (let from = 0; from < edges.length; from += 1) for (const to of edges[from] ?? []) reversed[to]?.push(from);
			return reversed;
		};
		dependencyComponent = (start, reversed, seen) => {
			const component = [];
			const stack = [start];
			seen[start] = 1;
			while (stack.length > 0) {
				const index = stack.pop();
				if (index === undefined) break;
				component.push(index);
				for (const next of reversed[index] ?? []) {
					if (seen[next] === 0) {
						seen[next] = 1;
						stack.push(next);
					}
				}
			}
			return component;
		};
		dependencyComponentInCycle = (component, edges) => {
			if (component.length > 1) return true;
			const only = component[0];
			return only !== undefined && (edges[only]?.includes(only) ?? false);
		};
		checkSlice = (report, context) => {
			const slice = report.selected_slice;
			if (slice === undefined) return;
			const ranges = [
				{
					offset: slice.offset,
					bytes: 0
				},
				...report.auditable_metadata === null ? [] : [{
					offset: report.auditable_metadata.file_offset,
					bytes: report.auditable_metadata.section_bytes
				}],
				...report.rustc_commit?.hashes.map(({ file_offset: offset }) => ({
					offset,
					bytes: 48
				})) ?? []
			];
			if (!selectedSliceAgreesWithReport(slice, report.format, binaryMetadataArchitecture(report.architecture)) || ranges.some(({ offset, bytes }) => !machoSelectionContainsRange(slice, report.artifact.bytes, offset, bytes))) issue(context, ["selected_slice"], "Selected universal slice must be a FAT slice of the artifact whose CPU matches the report's Mach-O architecture and that contains the reported file offsets.");
		};
		checkRustc = (fileBytes, commit, context) => {
			if (commit === null) return;
			const seen = new Set();
			for (const [position, entry] of commit.hashes.entries()) {
				if (seen.has(entry.hash) || !inside(fileBytes, entry.file_offset, 48)) issue(context, [
					"rustc_commit",
					"hashes",
					position
				], "rustc path hash is duplicated or its file offset is outside the artifact.");
				seen.add(entry.hash);
			}
		};
	})))();
}

//#endregion
//#region dist/domain/rust/rustBinaryQuery.js
var edgeSchema, index$1, page$7, packages, edges, rustBinarySelectionSchema, rustBinaryViewRequestSchema, rustBinaryViewPageSchema, inspectRustBinaryRequestSchema;
function init_rustBinaryQuery() {
	return (init_rustBinaryQuery = __esmMin((() => {
		init_rustBinary();
		edgeSchema = rustAuditableMetadataSchema.shape.dependency_edges.element;
		index$1 = z.number().int().nonnegative();
		page$7 = {
			indices: z.array(index$1).optional(),
			offset: index$1.default(0),
			limit: z.number().int().positive().default(64)
		};
		packages = z.strictObject({
			...page$7,
			collection: z.literal("packages"),
			names: z.array(z.string()).optional(),
			versions: z.array(z.string()).optional(),
			fields: z.array(rustPackageSchema.keyof()).optional().describe("Original index always retained. Default attributes omit dependency vectors; select dependencies explicitly for direct index references.")
		});
		edges = z.strictObject({
			...page$7,
			collection: z.literal("edges"),
			from_indices: z.array(index$1).optional(),
			to_indices: z.array(index$1).optional(),
			fields: z.array(edgeSchema.keyof()).optional()
		});
		rustBinarySelectionSchema = z.discriminatedUnion("collection", [packages, edges]);
		rustBinaryViewRequestSchema = z.discriminatedUnion("collection", [packages.extend({ kind: z.literal("rust") }), edges.extend({ kind: z.literal("rust") })]);
		rustBinaryViewPageSchema = z.discriminatedUnion("collection", [z.strictObject({
			collection: z.literal("packages"),
			rows: z.array(rustPackageSchema.partial().extend({
				features: rustPackageFeaturesSchema.optional(),
				index: index$1
			}))
		}), z.strictObject({
			collection: z.literal("edges"),
			rows: z.array(edgeSchema.partial().extend({ index: index$1 }))
		})]);
		inspectRustBinaryRequestSchema = inspectRustBinaryInputSchema.extend({
			detail: z.enum(["complete", "summary"]).optional(),
			view: rustBinarySelectionSchema.optional()
		}).superRefine((value, context) => {
			if (value.view !== undefined && value.detail === "complete") context.addIssue({
				code: "custom",
				path: ["view"],
				message: "view selects compact delivery; omit view for complete Evidence"
			});
		});
	})))();
}

//#endregion
//#region dist/domain/go/goBinary.js
var sourceRangeSchema, moduleIdentitySchema, goModuleSchema, goModuleMetadataSchema, inspectGoBinaryInputSchema, goBuildInfoSchema, goBinarySchema;
function init_goBinary() {
	return (init_goBinary = __esmMin((() => {
		init_binaryMetadataArchitecture();
		init_machoTargetSelection();
		init_digests();
		init_localPath();
		init_stringPatterns();
		sourceRangeSchema = z.strictObject({
			offset: z.int().nonnegative(),
			bytes: z.int().nonnegative()
		});
		moduleIdentitySchema = z.strictObject({
			path: z.string(),
			version: z.string(),
			sum: z.string().nullable()
		});
		goModuleSchema = moduleIdentitySchema.extend({ replacement: moduleIdentitySchema.nullable() });
		goModuleMetadataSchema = z.strictObject({
			path: z.string().nullable(),
			main: goModuleSchema.nullable(),
			dependencies: z.array(goModuleSchema),
			settings: z.array(z.strictObject({
				key: z.string(),
				value: z.string()
			})),
			unparsed_lines: z.array(z.string()),
			unparsed_line_bytes_base64: z.array(canonicalBase64Schema),
			complete: z.boolean()
		});
		inspectGoBinaryInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to the selected executable or library"),
			architecture: machoSliceArchitectureSchema.exactOptional(),
			detail: z.enum(["complete", "summary"]).default("complete").describe("complete returns all metadata inline; summary retains complete Evidence and returns build identity and counts for subsequent retained Go views.")
		});
		goBuildInfoSchema = z.strictObject({
			header_offset: z.int().nonnegative(),
			encoding: z.enum(["inline", "pointer"]),
			go_version: z.string().nullable(),
			go_version_bytes_base64: canonicalBase64Schema,
			module_text: z.string().nullable(),
			module_bytes_base64: canonicalBase64Schema,
			version_location: sourceRangeSchema,
			module_location: sourceRangeSchema,
			module: goModuleMetadataSchema
		});
		goBinarySchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				sha256: digestSchema,
				bytes: z.int().nonnegative()
			}),
			format: z.enum([
				"elf",
				"pe",
				"macho"
			]),
			architecture: z.string(),
			bits: z.union([z.literal(32), z.literal(64)]),
			byte_order: z.enum(["little", "big"]),
			/** The universal slice that was read; source ranges stay file offsets inside it. */
			selected_slice: machoTargetSelectionSchema.exactOptional(),
			build_info: goBuildInfoSchema.nullable(),
			limitations: z.array(z.string())
		}).superRefine((report, context) => {
			const info = report.build_info;
			const slice = report.selected_slice;
			if (slice !== undefined && (!selectedSliceAgreesWithReport(slice, report.format, binaryMetadataArchitecture(report.architecture)) || !machoSelectionContainsRange(slice, report.artifact.bytes, slice.offset, 0) || info !== null && [
				{
					offset: info.header_offset,
					bytes: 32
				},
				info.version_location,
				info.module_location
			].some((range) => !machoSelectionContainsRange(slice, report.artifact.bytes, range.offset, range.bytes)))) context.addIssue({
				code: "custom",
				path: ["selected_slice"],
				message: "Selected universal slice must be a FAT slice of the artifact whose CPU matches the report's Mach-O architecture and that contains the build-info source ranges."
			});
			if (info === null) return;
			if (info.header_offset > report.artifact.bytes - 32) context.addIssue({
				code: "custom",
				path: ["build_info", "header_offset"],
				message: "Build-info header is outside the selected artifact."
			});
			for (const field of ["version_location", "module_location"]) {
				const range = info[field];
				if (range.offset > report.artifact.bytes || range.bytes > report.artifact.bytes - range.offset) context.addIssue({
					code: "custom",
					path: ["build_info", field],
					message: "Build-info source range is outside the selected artifact."
				});
			}
			for (const [field, range, description] of [[
				"go_version_bytes_base64",
				info.version_location,
				"compiler"
			], [
				"module_bytes_base64",
				info.module_location,
				"module"
			]]) {
				const encoded = info[field];
				if (Buffer.byteLength(encoded, "base64") !== range.bytes) context.addIssue({
					code: "custom",
					path: ["build_info", field],
					message: `Encoded ${description} bytes do not match their reported source length.`
				});
			}
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/goBinaryView.js
var indexSchema$1, count$2, settingSchema, page$6, goBinaryViewRequestSchema, goBinaryViewPageSchema, goBinaryViewContextSchema, goBinarySummarySchema, checkedReports$2, parseReport$1, projectGoBinaryView;
function init_goBinaryView() {
	return (init_goBinaryView = __esmMin((() => {
		init_binaryMetadataArchitecture();
		init_machoTargetSelection();
		init_goBinary();
		init_immutableJson();
		init_result();
		init_analysisViewCoverage();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_selectViewRows();
		indexSchema$1 = z.number().int().nonnegative();
		count$2 = z.number().int().nonnegative();
		settingSchema = goModuleMetadataSchema.shape.settings.element;
		page$6 = {
			kind: z.literal("go"),
			indices: z.array(indexSchema$1).optional(),
			offset: indexSchema$1.default(0),
			limit: z.number().int().positive().default(64)
		};
		goBinaryViewRequestSchema = z.discriminatedUnion("collection", [z.strictObject({
			...page$6,
			collection: z.literal("dependencies"),
			paths: z.array(z.string()).optional(),
			fields: z.array(goModuleSchema.keyof()).optional()
		}), z.strictObject({
			...page$6,
			collection: z.literal("settings"),
			keys: z.array(z.string()).optional(),
			fields: z.array(settingSchema.keyof()).optional()
		})]);
		goBinaryViewPageSchema = z.discriminatedUnion("collection", [z.strictObject({
			collection: z.literal("dependencies"),
			rows: z.array(goModuleSchema.partial().extend({ index: indexSchema$1 }))
		}), z.strictObject({
			collection: z.literal("settings"),
			rows: z.array(settingSchema.partial().extend({ index: indexSchema$1 }))
		})]);
		goBinaryViewContextSchema = z.strictObject({ source_coverage: z.strictObject({
			build_info_available: z.boolean(),
			module_parse_complete: z.boolean().nullable(),
			runtime_dependencies: z.literal("unknown")
		}) });
		goBinarySummarySchema = z.strictObject({
			bytes: count$2,
			format: goBinarySchema.shape.format,
			architecture: goBinarySchema.shape.architecture,
			bits: goBinarySchema.shape.bits,
			byte_order: goBinarySchema.shape.byte_order,
			selected_slice: goBinarySchema.shape.selected_slice,
			build_info: goBuildInfoSchema.omit({
				go_version_bytes_base64: true,
				module_text: true,
				module_bytes_base64: true,
				module: true
			}).extend({ module: goModuleMetadataSchema.omit({
				dependencies: true,
				settings: true,
				unparsed_lines: true,
				unparsed_line_bytes_base64: true
			}).extend({ available_counts: z.strictObject({
				dependencies: count$2,
				settings: count$2,
				unparsed_lines: count$2,
				unparsed_line_bytes_base64: count$2
			}) }) }).nullable()
		});
		checkedReports$2 = new WeakMap();
		parseReport$1 = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && typeof key === "object" && key !== null && isImmutableJsonSnapshot(key);
			const existing = reusable ? checkedReports$2.get(key) : undefined;
			if (existing !== undefined) return ok(existing);
			const parsed = parseAnalysisViewResult(goBinarySchema, parent);
			if (!parsed.ok) return parsed;
			const report = reusable ? key : parsed.value;
			if (reusable) checkedReports$2.set(key, report);
			return ok(report);
		};
		projectGoBinaryView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "go") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Go build Evidence supports summary and go views."
			}]));
			const parsed = parseReport$1(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (parent.subject?.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256 || parent.subject.format !== metadataReportSubjectFormat(report) || parent.subject.architecture !== (binaryMetadataArchitecture(report.architecture) ?? null)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Go parent subject must identify the report's exact artifact."
			}]));
			const info = report.build_info;
			const runtimeUnknown = "Embedded build records do not establish complete runtime dependencies or target behavior.";
			const unknowns = [runtimeUnknown, ...info === null ? ["Build information is unavailable; language and dependencies remain unknown."] : [...info.module.complete ? [] : ["Some module records were not parsed; consult the complete parent Evidence for original lines and bytes."], ...info.module.main === null ? ["No main module was decoded; embedded dependency coverage remains unknown."] : []]];
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_go_binary",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				source_coverage: {
					build_info_available: info !== null,
					module_parse_complete: info?.module.complete ?? null,
					runtime_dependencies: "unknown"
				},
				limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
				unknowns: boundedViewMessages(unknowns, parent.evidenceId, "unknowns", [runtimeUnknown])
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: {
					bytes: report.artifact.bytes,
					format: report.format,
					architecture: report.architecture,
					bits: report.bits,
					byte_order: report.byte_order,
					...report.selected_slice === undefined ? {} : { selected_slice: report.selected_slice },
					build_info: info === null ? null : {
						header_offset: info.header_offset,
						encoding: info.encoding,
						go_version: info.go_version,
						version_location: info.version_location,
						module_location: info.module_location,
						module: {
							path: info.module.path,
							main: info.module.main,
							complete: info.module.complete,
							available_counts: {
								dependencies: info.module.dependencies.length,
								settings: info.module.settings.length,
								unparsed_lines: info.module.unparsed_lines.length,
								unparsed_line_bytes_base64: info.module.unparsed_line_bytes_base64.length
							}
						}
					}
				},
				coverage: completeWithinViewCoverage(1, 1)
			});
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			const fields = view.fields === undefined ? undefined : new Set(view.fields);
			if (view.collection === "dependencies") {
				const paths = view.paths === undefined ? undefined : new Set(view.paths);
				const selected = selectViewRows(info?.module.dependencies ?? [], view, (row, index) => (indices?.has(index) ?? true) && (paths?.has(row.path) ?? true), (row, index) => ({
					index,
					...(fields?.has("path") ?? true) && { path: row.path },
					...(fields?.has("version") ?? true) && { version: row.version },
					...(fields?.has("sum") ?? true) && { sum: row.sum },
					...(fields?.has("replacement") ?? true) && { replacement: row.replacement }
				}));
				return ok({
					kind: "go",
					view,
					...shared,
					page: {
						collection: "dependencies",
						rows: selected.rows
					},
					coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
				});
			}
			const keys = view.keys === undefined ? undefined : new Set(view.keys);
			const selected = selectViewRows(info?.module.settings ?? [], view, (row, index) => (indices?.has(index) ?? true) && (keys?.has(row.key) ?? true), (row, index) => ({
				index,
				...(fields?.has("key") ?? true) && { key: row.key },
				...(fields?.has("value") ?? true) && { value: row.value }
			}));
			return ok({
				kind: "go",
				view,
				...shared,
				page: {
					collection: "settings",
					rows: selected.rows
				},
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/rustBinaryView.js
var count$1, rustBinarySummarySchema, rustBinaryViewContextSchema, checkedReports$1, parseReport, summarize$1, projectRustBinaryView;
function init_rustBinaryView() {
	return (init_rustBinaryView = __esmMin((() => {
		init_binaryMetadataArchitecture();
		init_machoTargetSelection();
		init_rustBinary();
		init_immutableJson();
		init_result();
		init_analysisViewCoverage();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_selectViewRows();
		count$1 = z.number().int().nonnegative();
		rustBinarySummarySchema = z.strictObject({
			bytes: count$1,
			format: rustBinarySchema.shape.format,
			architecture: rustBinarySchema.shape.architecture,
			bits: rustBinarySchema.shape.bits,
			byte_order: rustBinarySchema.shape.byte_order,
			selected_slice: rustBinarySchema.shape.selected_slice,
			auditable_metadata: rustAuditableMetadataSchema.omit({
				packages: true,
				dependency_edges: true,
				cyclic_dependency_indices: true
			}).extend({ counts: z.strictObject({
				packages: count$1,
				edges: count$1,
				cyclic_packages: count$1
			}) }).nullable(),
			rustc_commit: rustcCommitSchema.omit({ hashes: true }).extend({ hashes_count: count$1 }).nullable()
		});
		rustBinaryViewContextSchema = z.strictObject({ source_coverage: z.strictObject({
			auditable_metadata_available: z.boolean(),
			embedded_records: z.enum(["complete", "unknown"]),
			runtime_dependencies: z.literal("unknown")
		}) });
		checkedReports$1 = new WeakMap();
		parseReport = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && typeof key === "object" && key !== null && isImmutableJsonSnapshot(key);
			const known = reusable ? checkedReports$1.get(key) : undefined;
			if (known !== undefined) return ok(known);
			const parsed = parseAnalysisViewResult(rustBinarySchema, parent);
			if (!parsed.ok) return parsed;
			if (reusable) {
				const report = canBorrowParsedJsonSnapshot(key, parsed.value) ? key : freezeOwnedJsonTreeSnapshot(parsed.value);
				checkedReports$1.set(key, report);
				return ok(report);
			}
			return parsed;
		};
		summarize$1 = (report) => {
			const { artifact, auditable_metadata: metadata, rustc_commit: compiler } = report;
			const section = metadata === null ? null : {
				section_name: metadata.section_name,
				file_offset: metadata.file_offset,
				section_bytes: metadata.section_bytes,
				compressed_bytes: metadata.compressed_bytes,
				uncompressed_bytes: metadata.uncompressed_bytes,
				format_version: metadata.format_version,
				root_package_index: metadata.root_package_index,
				counts: {
					packages: metadata.packages.length,
					edges: metadata.dependency_edges.length,
					cyclic_packages: metadata.cyclic_dependency_indices.length
				}
			};
			return {
				format: report.format,
				architecture: report.architecture,
				bits: report.bits,
				byte_order: report.byte_order,
				...report.selected_slice === undefined ? {} : { selected_slice: report.selected_slice },
				bytes: artifact.bytes,
				auditable_metadata: section,
				rustc_commit: compiler === null ? null : {
					evidence_kind: compiler.evidence_kind,
					hashes_count: compiler.hashes.length
				}
			};
		};
		projectRustBinaryView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "rust") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Rust Evidence supports summary and rust views."
			}]));
			const parsed = parseReport(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const subject = parent.subject;
			if (subject == null || subject.local_path !== report.artifact.path || subject.digest.sha256 !== report.artifact.sha256 || subject.format !== metadataReportSubjectFormat(report) || subject.architecture !== (binaryMetadataArchitecture(report.architecture) ?? null)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Rust parent subject must identify the report's exact artifact."
			}]));
			const metadata = report.auditable_metadata;
			const unknown = "Embedded dependency records do not authenticate build provenance or establish complete runtime dependencies or target behavior.";
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_rust_binary",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				source_coverage: {
					auditable_metadata_available: metadata !== null,
					embedded_records: metadata === null ? "unknown" : "complete",
					runtime_dependencies: "unknown"
				},
				limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
				unknowns: boundedViewMessages([unknown, ...metadata === null ? ["No cargo-auditable metadata was observed; missing metadata does not establish an empty dependency set."] : []], parent.evidenceId, "unknowns", [unknown])
			};
			const summary = summarize$1(report);
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary,
				coverage: completeWithinViewCoverage(1, 1)
			});
			const indices = view.indices === undefined ? undefined : new Set(view.indices);
			const fields = view.fields === undefined ? undefined : new Set(view.fields);
			if (view.collection === "packages") {
				const names = view.names === undefined ? undefined : new Set(view.names);
				const versions = view.versions === undefined ? undefined : new Set(view.versions);
				const selected = selectViewRows(metadata?.packages ?? [], view, (row, index) => (indices?.has(index) ?? true) && (names?.has(row.name) ?? true) && (versions?.has(row.version) ?? true), (row, index) => ({
					index,
					...(fields?.has("name") ?? true) && { name: row.name },
					...(fields?.has("version") ?? true) && { version: row.version },
					...(fields?.has("source") ?? true) && { source: row.source },
					...(fields?.has("kind") ?? true) && { kind: row.kind },
					...(fields?.has("root") ?? true) && { root: row.root },
					...fields?.has("dependencies") === true && { dependencies: row.dependencies },
					...fields?.has("features") === true && { features: row.features }
				}));
				return ok({
					kind: "rust",
					view,
					...shared,
					rust: summary,
					page: {
						collection: "packages",
						rows: selected.rows
					},
					coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
				});
			}
			const from = view.from_indices === undefined ? undefined : new Set(view.from_indices);
			const to = view.to_indices === undefined ? undefined : new Set(view.to_indices);
			const selected = selectViewRows(metadata?.dependency_edges ?? [], view, (row, index) => (indices?.has(index) ?? true) && (from?.has(row.from_index) ?? true) && (to?.has(row.to_index) ?? true), (row, index) => ({
				index,
				...(fields?.has("from_index") ?? true) && { from_index: row.from_index },
				...(fields?.has("to_index") ?? true) && { to_index: row.to_index }
			}));
			return ok({
				kind: "rust",
				view,
				...shared,
				rust: summary,
				page: {
					collection: "edges",
					rows: selected.rows
				},
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/native/functionMatching.js
var evidenceId, nativeMatchStateSchema, nativeFunctionMatchMemberSchema, nativeFunctionMatchSchema, nativeFunctionMatchingSummarySchema, nativeFunctionMatchingContextSchema, nativeFunctionMatchingSchema;
function init_functionMatching() {
	return (init_functionMatching = __esmMin((() => {
		init_canonicalDigest();
		init_digests();
		init_evidenceReference();
		evidenceId = prefixedDigestSchema("ev");
		nativeMatchStateSchema = z.enum([
			"matched",
			"only_left",
			"only_right",
			"unresolved"
		]);
		nativeFunctionMatchMemberSchema = z.strictObject({
			function_id: z.string().min(1),
			inventory_evidence_id: evidenceId,
			source_index: z.number().int().nonnegative(),
			address: z.string(),
			name: z.string(),
			body_sha256: digestSchema.nullable(),
			structural_candidate_sha256: digestSchema.nullable(),
			body_bytes: z.number().int().nonnegative().nullable(),
			dossier_evidence_id: evidenceId.nullable(),
			evidence_links: z.array(evidenceId).min(1),
			limitations: z.array(z.string())
		});
		nativeFunctionMatchSchema = z.strictObject({
			match_id: prefixedDigestSchema("match"),
			state: nativeMatchStateSchema,
			basis: z.enum(["exact-symbol", "identical-bytes"]).nullable(),
			left: z.array(nativeFunctionMatchMemberSchema),
			right: z.array(nativeFunctionMatchMemberSchema),
			reason: z.string(),
			compare_functions_input: z.strictObject({
				left: retainedEvidenceReferenceSchema,
				right: retainedEvidenceReferenceSchema
			}).nullable()
		});
		nativeFunctionMatchingSummarySchema = z.strictObject({
			matched: z.number().int().nonnegative(),
			only_left: z.number().int().nonnegative(),
			only_right: z.number().int().nonnegative(),
			unresolved: z.number().int().nonnegative()
		});
		nativeFunctionMatchingContextSchema = z.strictObject({
			left: z.strictObject({
				evidence_id: evidenceId,
				sha256: digestSchema,
				functions: z.number().int().nonnegative()
			}),
			right: z.strictObject({
				evidence_id: evidenceId,
				sha256: digestSchema,
				functions: z.number().int().nonnegative()
			}),
			scope: z.literal("provider-observed-inputs"),
			source_coverage: z.strictObject({
				status: z.enum(["complete-within-inputs", "partial"]),
				left_inventory_completeness: z.literal("unknown"),
				right_inventory_completeness: z.literal("unknown"),
				left_byte_fingerprints: z.number().int().nonnegative(),
				right_byte_fingerprints: z.number().int().nonnegative(),
				left_structural_candidates: z.number().int().nonnegative(),
				right_structural_candidates: z.number().int().nonnegative()
			}),
			summary: nativeFunctionMatchingSummarySchema
		});
		nativeFunctionMatchingSchema = nativeFunctionMatchingContextSchema.extend({
			matches: z.array(nativeFunctionMatchSchema),
			limitations: z.array(z.string())
		}).superRefine((report, context) => {
			const seen = new Set();
			const members = {
				left: new Set(),
				right: new Set()
			};
			const fingerprints = {
				left: 0,
				right: 0
			};
			const candidates = {
				left: 0,
				right: 0
			};
			const counts = {
				matched: 0,
				only_left: 0,
				only_right: 0,
				unresolved: 0
			};
			let left = 0, right = 0;
			for (const match of report.matches) {
				counts[match.state]++;
				left += match.left.length;
				right += match.right.length;
				if (seen.has(match.match_id)) context.addIssue({
					code: "custom",
					message: "Repeated match identity"
				});
				seen.add(match.match_id);
				if (match.match_id !== `match_${digestCanonicalValue({
					state: match.state,
					basis: match.basis,
					left: match.left.map((x) => x.function_id),
					right: match.right.map((x) => x.function_id)
				})}`) context.addIssue({
					code: "custom",
					message: "Match identity does not bind its selected occurrences and basis"
				});
				for (const side of ["left", "right"]) for (const member of match[side]) {
					if (member.inventory_evidence_id !== report[side].evidence_id || member.source_index >= report[side].functions || member.function_id !== `${report[side].evidence_id}/${member.source_index}` || members[side].has(member.function_id) || !member.evidence_links.includes(member.inventory_evidence_id) || member.dossier_evidence_id !== null && !member.evidence_links.includes(member.dossier_evidence_id)) context.addIssue({
						code: "custom",
						message: "Function occurrence identity, provenance or uniqueness disagrees with its selected inventory"
					});
					members[side].add(member.function_id);
					if (member.body_sha256 !== null) fingerprints[side]++;
					if (member.structural_candidate_sha256 !== null) candidates[side]++;
				}
				if (match.left.length + match.right.length === 0 || match.state !== "matched" && (match.basis !== null || match.compare_functions_input !== null)) context.addIssue({
					code: "custom",
					message: "Unresolved/unpaired group cannot contain a definitive basis or comparison input"
				});
				if (match.basis === "identical-bytes" && (match.left[0]?.body_sha256 == null || match.left[0]?.body_sha256 !== match.right[0]?.body_sha256 || match.left[0]?.body_bytes !== match.right[0]?.body_bytes)) context.addIssue({
					code: "custom",
					message: "Identical-byte match disagrees with its complete body digests and sizes"
				});
				if (match.compare_functions_input !== null && (match.compare_functions_input.left.evidence_id !== match.left[0]?.dossier_evidence_id || match.compare_functions_input.right.evidence_id !== match.right[0]?.dossier_evidence_id)) context.addIssue({
					code: "custom",
					message: "Comparison input does not identify this pair's dossiers"
				});
				if (match.state === "matched" && (match.left.length !== 1 || match.right.length !== 1 || match.basis === null) || match.state === "only_left" && (match.left.length !== 1 || match.right.length !== 0) || match.state === "only_right" && (match.right.length !== 1 || match.left.length !== 0)) context.addIssue({
					code: "custom",
					message: "Match state contradicts its occurrences"
				});
			}
			if (report.source_coverage.status !== (counts.only_left + counts.only_right + counts.unresolved > 0 ? "partial" : "complete-within-inputs") || report.source_coverage.left_byte_fingerprints !== fingerprints.left || report.source_coverage.right_byte_fingerprints !== fingerprints.right || report.source_coverage.left_structural_candidates !== candidates.left || report.source_coverage.right_structural_candidates !== candidates.right) context.addIssue({
				code: "custom",
				message: "Source/matching coverage contradicts examined facts"
			});
			if (left !== report.left.functions || right !== report.right.functions || Object.keys(counts).some((key) => counts[key] !== report.summary[key])) context.addIssue({
				code: "custom",
				message: "Matching summary or examined inventory coverage disagrees"
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/nativeFunctionMatchingView.js
var matchRow, functionRow, page$5, nativeFunctionMatchingViewRequestSchema, nativeFunctionMatchingViewItemsSchema, nativeFunctionMatchingViewContextSchema, checked, checkedReport, functionRows, sharedContext, selected, filterRows, selectedItems, projectNativeFunctionMatchingView;
function init_nativeFunctionMatchingView() {
	return (init_nativeFunctionMatchingView = __esmMin((() => {
		init_functionMatching();
		init_immutableJson();
		init_analysisViewParent();
		init_analysisViewErrors();
		init_analysisViewCoverage();
		init_result();
		matchRow = nativeFunctionMatchSchema.extend({
			left_count: z.number().int().nonnegative(),
			right_count: z.number().int().nonnegative()
		});
		functionRow = nativeFunctionMatchMemberSchema.extend({
			match_id: nativeFunctionMatchSchema.shape.match_id,
			state: nativeMatchStateSchema,
			side: z.enum(["left", "right"])
		});
		page$5 = {
			kind: z.literal("function-matches"),
			states: z.array(nativeMatchStateSchema).optional(),
			match_ids: z.array(z.string()).optional(),
			function_ids: z.array(z.string()).optional(),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		};
		nativeFunctionMatchingViewRequestSchema = z.discriminatedUnion("collection", [z.strictObject({
			...page$5,
			collection: z.literal("matches"),
			fields: z.array(matchRow.keyof()).optional()
		}), z.strictObject({
			...page$5,
			collection: z.literal("functions"),
			sides: z.array(z.enum(["left", "right"])).optional(),
			names: z.array(z.string()).optional(),
			fields: z.array(functionRow.keyof()).optional()
		})]);
		nativeFunctionMatchingViewItemsSchema = z.union([z.array(matchRow.partial().required({
			match_id: true,
			state: true,
			left_count: true,
			right_count: true
		})), z.array(functionRow.partial().required({
			function_id: true,
			match_id: true,
			state: true,
			side: true,
			inventory_evidence_id: true,
			source_index: true,
			address: true,
			evidence_links: true
		}))]);
		nativeFunctionMatchingViewContextSchema = nativeFunctionMatchingContextSchema;
		checked = new WeakMap();
		checkedReport = (parent) => {
			const source = parent.normalizedResult;
			const reusable = typeof source === "object" && source !== null && parent.sealedResult === true && isImmutableJsonSnapshot(source);
			const cached = reusable ? checked.get(source) : undefined;
			if (cached !== undefined) return ok(cached);
			const parsed = parseAnalysisViewResult(nativeFunctionMatchingSchema, parent);
			if (!parsed.ok) return parsed;
			const entry = { report: reusable ? source : parsed.value };
			if (reusable) checked.set(source, entry);
			return ok(entry);
		};
		functionRows = (entry) => {
			if (entry.functions !== undefined) return entry.functions;
			const functions = [];
			for (const match of entry.report.matches) for (const side of ["left", "right"]) for (const member of match[side]) functions.push({
				member,
				match_id: match.match_id,
				state: match.state,
				side
			});
			entry.functions = functions;
			return functions;
		};
		sharedContext = (parent, report) => ({
			parent_evidence_id: parent.evidenceId,
			parent_operation: "match_native_functions",
			parent_digest: parent.evidenceId.slice(3),
			artifact: null,
			limitations: boundedViewMessages([...parent.limitations, ...report.limitations], parent.evidenceId, "limitations"),
			unknowns: ["Unpaired observations and page exhaustion do not establish binary-wide function absence or behavioral equivalence."]
		});
		selected = (values) => values === undefined ? undefined : new Set(values);
		filterRows = (entry, view) => {
			const key = JSON.stringify([
				view.collection,
				view.states,
				view.match_ids,
				view.function_ids,
				view.collection === "functions" ? view.sides : null,
				view.collection === "functions" ? view.names : null
			]);
			if (entry.recent?.key === key) return entry.recent.rows;
			const states = selected(view.states), ids = selected(view.match_ids), functions = selected(view.function_ids), sides = selected(view.collection === "functions" ? view.sides : undefined), names = selected(view.collection === "functions" ? view.names : undefined);
			const matchesIdentity = (row) => (states === undefined || states.has(row.state)) && (ids === undefined || ids.has(row.match_id));
			const rows = [];
			if (view.collection === "matches") entry.report.matches.forEach((row, index) => {
				if (matchesIdentity(row) && (functions === undefined || [...row.left, ...row.right].some((member) => functions.has(member.function_id)))) rows.push(index);
			});
			else functionRows(entry).forEach((row, index) => {
				if (matchesIdentity(row) && (functions === undefined || functions.has(row.member.function_id)) && (sides === undefined || sides.has(row.side)) && (names === undefined || names.has(row.member.name))) rows.push(index);
			});
			const count = entry.report.left.functions + entry.report.right.functions;
			if (key.length <= Math.max(256, count * 8)) entry.recent = {
				key,
				rows
			};
			return rows;
		};
		selectedItems = (entry, view, rows) => {
			const indices = rows.slice(view.offset, view.offset + view.limit);
			const defaults = view.collection === "matches" ? [
				"match_id",
				"state",
				"basis",
				"reason",
				"left_count",
				"right_count",
				"compare_functions_input"
			] : [
				"function_id",
				"match_id",
				"state",
				"side",
				"inventory_evidence_id",
				"source_index",
				"address",
				"name",
				"body_sha256",
				"structural_candidate_sha256",
				"body_bytes",
				"dossier_evidence_id",
				"evidence_links"
			];
			const fields = new Set(view.fields ?? defaults);
			const columns = (row) => Object.fromEntries([...fields].map((field) => [field, row[field]]));
			if (view.collection === "matches") return indices.map((index) => {
				const row = entry.report.matches[index], left_count = row.left.length, right_count = row.right.length;
				return {
					...columns({
						...row,
						left_count,
						right_count
					}),
					match_id: row.match_id,
					state: row.state,
					left_count,
					right_count
				};
			});
			const functions = functionRows(entry);
			return indices.map((index) => {
				const row = functions[index], member = row.member;
				return {
					...columns({
						...member,
						match_id: row.match_id,
						state: row.state,
						side: row.side
					}),
					function_id: member.function_id,
					match_id: row.match_id,
					state: row.state,
					side: row.side,
					inventory_evidence_id: member.inventory_evidence_id,
					source_index: member.source_index,
					address: member.address,
					evidence_links: member.evidence_links
				};
			});
		};
		projectNativeFunctionMatchingView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "function-matches") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Native matching supports summary and function-matches pages"
			}]));
			const parsed = checkedReport(parent);
			if (!parsed.ok) return parsed;
			const entry = parsed.value;
			const { matches: _matches, limitations: _limitations, ...context } = entry.report;
			const shared = sharedContext(parent, entry.report);
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: context,
				coverage: completeWithinViewCoverage(1, 1)
			});
			const rows = filterRows(entry, view), items = selectedItems(entry, view, rows);
			return ok({
				kind: "function-matches",
				view,
				...shared,
				...context,
				items,
				coverage: pageViewCoverage(view.offset, items.length, rows.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/protobufCaptureView.js
var body, bodyRow, frameRow, fieldRow, page$4, protobufViewRequestSchema, protobufViewItemsSchema, protobufViewContextSchema, checkedBodies, fieldQueries, fieldSelection, selectFields$2, projectProtobufCapturePage;
function init_protobufCaptureView() {
	return (init_protobufCaptureView = __esmMin((() => {
		init_immutableJson();
		init_protobufWire();
		init_analysisViewCoverage();
		body = {
			record_ordinal: z.number().int().nonnegative(),
			body_pointer: z.string(),
			body_sha256: z.string(),
			body_status: protobufDecodingSchema.shape.status,
			offset_basis: protobufDecodingSchema.shape.offset_basis
		};
		bodyRow = protobufDecodingObjectSchema.omit({
			pointer: true,
			body_sha256: true,
			offset_basis: true,
			frames: true,
			fields: true
		}).extend({
			...body,
			frame_count: z.number().int().nonnegative(),
			field_count: z.number().int().nonnegative()
		});
		frameRow = protobufFrameSchema.extend(body);
		fieldRow = protobufFieldSchema.extend(body);
		page$4 = {
			kind: z.literal("protobuf"),
			record_ordinals: z.array(z.number().int().nonnegative()).optional(),
			body_pointers: z.array(z.string()).optional(),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		};
		protobufViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...page$4,
				collection: z.literal("bodies"),
				fields: z.array(bodyRow.keyof()).optional()
			}),
			z.strictObject({
				...page$4,
				collection: z.literal("frames"),
				frame_indices: z.array(z.number().int().nonnegative()).optional(),
				fields: z.array(frameRow.keyof()).optional()
			}),
			z.strictObject({
				...page$4,
				collection: z.literal("fields"),
				frame_indices: z.array(z.number().int().nonnegative()).optional(),
				field_ids: z.array(z.string()).optional(),
				field_numbers: z.array(z.number().int().positive()).optional(),
				schema_names: z.array(z.string()).optional(),
				fields: z.array(fieldRow.keyof()).optional()
			})
		]);
		protobufViewItemsSchema = z.union([
			z.array(bodyRow.partial().required({
				record_ordinal: true,
				body_pointer: true,
				body_sha256: true,
				body_status: true,
				offset_basis: true
			})),
			z.array(frameRow.partial().required({
				record_ordinal: true,
				body_pointer: true,
				body_sha256: true,
				body_status: true,
				offset_basis: true,
				index: true,
				offset: true
			})),
			z.array(fieldRow.partial().required({
				record_ordinal: true,
				body_pointer: true,
				body_sha256: true,
				body_status: true,
				offset_basis: true,
				index: true,
				frame_index: true,
				field_id: true,
				parent_field_id: true,
				offset: true,
				payload_offset: true,
				payload_bytes: true
			}))
		]);
		protobufViewContextSchema = z.strictObject({
			source_status: z.enum([
				"complete",
				"partial",
				"unknown"
			]),
			retained_decoded_bodies: z.number().int().nonnegative()
		});
		checkedBodies = new WeakMap();
		fieldQueries = new WeakMap();
		fieldSelection = (report, bodies, view, reusable) => {
			if (view.frame_indices === undefined && view.field_ids === undefined && view.field_numbers === undefined && view.schema_names === undefined) return undefined;
			const key = JSON.stringify([
				view.frame_indices,
				view.field_ids,
				view.field_numbers,
				view.schema_names
			]);
			const cached = reusable ? fieldQueries.get(report) : undefined;
			if (cached?.key === key) return cached;
			const referenceBytes = bodies.reduce((sum, body) => sum + body.decoding.fields.length * 8, 0);
			const cache = reusable && key.length * 2 <= referenceBytes;
			const selection = {
				key,
				frames: view.frame_indices === undefined ? undefined : new Set(view.frame_indices),
				ids: view.field_ids === undefined ? undefined : new Set(view.field_ids),
				numbers: view.field_numbers === undefined ? undefined : new Set(view.field_numbers),
				names: view.schema_names === undefined ? undefined : new Set(view.schema_names),
				rows: cache ? new WeakMap() : undefined
			};
			if (cache) fieldQueries.set(report, selection);
			return selection;
		};
		selectFields$2 = (decoding, selection) => {
			if (selection === undefined) return decoding.fields;
			const cached = selection.rows?.get(decoding);
			if (cached !== undefined) return cached;
			const { frames, ids, numbers, names } = selection;
			const rows = decoding.fields.filter((field) => (frames === undefined || frames.has(field.frame_index)) && (ids === undefined || ids.has(field.field_id)) && (numbers === undefined || numbers.has(field.number)) && (names === undefined || field.schema_name !== undefined && names.has(field.schema_name)));
			selection.rows?.set(decoding, rows);
			return rows;
		};
		projectProtobufCapturePage = (report, view) => {
			const reusable = isImmutableJsonSnapshot(report);
			let bodies = reusable ? checkedBodies.get(report) : undefined;
			if (bodies === undefined) {
				bodies = report.records.flatMap((record) => (record.protobuf ?? []).map((decoding) => ({
					recordOrdinal: record.ordinal,
					decoding
				})));
				if (reusable) checkedBodies.set(report, bodies);
			}
			const selection = view.collection === "fields" ? fieldSelection(report, bodies, view, reusable) : undefined;
			const ordinals = view.record_ordinals === undefined ? undefined : new Set(view.record_ordinals);
			const pointers = view.body_pointers === undefined ? undefined : new Set(view.body_pointers);
			const frames = "frame_indices" in view && view.frame_indices !== undefined ? new Set(view.frame_indices) : undefined;
			let total = 0;
			const items = [];
			let sourceStatus = report.protobuf_coverage?.status === "partial" ? "partial" : bodies.length === 0 ? "unknown" : "complete";
			for (const entry of bodies) {
				const { recordOrdinal, decoding } = entry;
				if (ordinals !== undefined && !ordinals.has(recordOrdinal) || pointers !== undefined && !pointers.has(decoding.pointer)) continue;
				if (decoding.status !== "complete") sourceStatus = "partial";
				const rows = view.collection === "bodies" ? [decoding] : view.collection === "frames" ? frames === undefined ? decoding.frames : decoding.frames.filter((frame) => frames.has(frame.index)) : selectFields$2(decoding, selection);
				const from = Math.max(0, view.offset - total);
				const to = Math.min(rows.length, view.offset + view.limit - total);
				for (let index = from; index < to; index++) {
					const source = rows[index];
					const row = view.collection === "bodies" ? {
						...decoding,
						frame_count: decoding.frames.length,
						field_count: decoding.fields.length
					} : source;
					const mandatory = [
						"record_ordinal",
						"body_pointer",
						"body_sha256",
						"body_status",
						"offset_basis",
						...view.collection === "fields" ? [
							"index",
							"frame_index",
							"field_id",
							"parent_field_id",
							"offset",
							"payload_offset",
							"payload_bytes"
						] : view.collection === "frames" ? ["index", "offset"] : []
					];
					const keys = view.fields ?? Object.keys(row).filter((key) => ![
						"frames",
						"fields",
						"pointer",
						"text",
						"schema_value",
						"schema_enum_values"
					].includes(key));
					const chosen = new Set([...mandatory, ...keys]);
					const projected = {
						record_ordinal: recordOrdinal,
						body_pointer: decoding.pointer,
						body_sha256: decoding.body_sha256,
						body_status: decoding.status,
						offset_basis: decoding.offset_basis
					};
					for (const key of keys) if (chosen.has(key) && Object.hasOwn(row, key) && ![
						"frames",
						"fields",
						"pointer"
					].includes(key)) projected[key] = row[key];
					for (const key of mandatory) if (Object.hasOwn(row, key)) projected[key] = row[key];
					items.push(projected);
				}
				total += rows.length;
			}
			return {
				kind: "protobuf",
				view,
				items: protobufViewItemsSchema.parse(items),
				source_status: sourceStatus,
				retained_decoded_bodies: bodies.length,
				coverage: pageViewCoverage(view.offset, items.length, total)
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/nativeInventoryView.js
var inventoryRecordSchema, fieldSchema, nativeInventoryViewRequestSchema, nativeInventoryViewRowSchema, nativeInventoryViewContext, nativeInventorySummarySchema, checkedNames, checkedStrings, readRows, projectNativeInventoryView;
function init_nativeInventoryView() {
	return (init_nativeInventoryView = __esmMin((() => {
		init_hopperValues();
		init_immutableJson();
		init_jsonValue();
		init_nativeInventory();
		init_digests();
		init_evidence();
		init_result();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		inventoryRecordSchema = addressedValueSchema.extend({
			provider_value: analysisStringSchema.shape.provider_value,
			decoding: analysisStringSchema.shape.decoding,
			string: z.union([analysisStringSchema.shape.string, addressedValueSchema.shape.string])
		});
		fieldSchema = inventoryRecordSchema.keyof();
		nativeInventoryViewRequestSchema = z.strictObject({
			kind: z.literal("native-inventory"),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64),
			fields: z.array(fieldSchema).exactOptional().describe("Select record fields; address and source_index preserve identity. Selecting value also retains its string and decoding qualifications. Omit for every recorded field. Search tools filter before retention.")
		});
		nativeInventoryViewRowSchema = z.strictObject({
			source_index: z.number().int().nonnegative(),
			record: inventoryRecordSchema.partial().required({ address: true })
		});
		nativeInventoryViewContext = {
			source_provider: providerSchema.nullable(),
			source_analysis_profile_digest: digestSchema.nullable(),
			source_parameters: jsonValueSchema
		};
		nativeInventorySummarySchema = z.strictObject({
			collection: z.enum([
				"procedures",
				"strings",
				"names"
			]),
			row_count: z.number().int().nonnegative(),
			discovery_coverage: z.literal("unknown"),
			selectable_fields: z.array(fieldSchema)
		});
		checkedNames = new WeakSet();
		checkedStrings = new WeakSet();
		readRows = (parent, strings) => {
			const checked = strings ? checkedStrings : checkedNames;
			const source = parent.normalizedResult;
			if (Array.isArray(source) && checked.has(source)) return ok(source);
			const parsed = strings ? parseAnalysisViewResult(nativeInventoryRowsSchemas.strings, parent) : parseAnalysisViewResult(nativeInventoryRowsSchemas.names, parent);
			if (!parsed.ok) return parsed;
			if (Array.isArray(source) && parent.sealedResult === true && canBorrowParsedJsonSnapshot(source, parsed.value)) {
				checked.add(source);
				return ok(source);
			}
			return parsed;
		};
		projectNativeInventoryView = (parent, view) => {
			if (!isNativeInventoryOperation(parent.operation) || view.kind !== "summary" && view.kind !== "native-inventory") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Native inventory Evidence supports summary and native-inventory views."
			}]));
			const strings = parent.operation === "list_strings" || parent.operation === "search_strings";
			const parsed = readRows(parent, strings);
			if (!parsed.ok) return parsed;
			const rows = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: parent.operation,
				parent_digest: parent.evidenceId.slice(3),
				artifact: parent.artifact ?? null,
				source_provider: parent.provider ?? null,
				source_analysis_profile_digest: parent.analysisProfileDigest ?? null,
				source_parameters: jsonValueSchema.parse(parent.parameters ?? null),
				limitations: boundedViewMessages(parent.limitations, parent.evidenceId, "limitations"),
				unknowns: ["Counts and paging describe the retained provider-reported rows, not complete discovery of every program object. Missing matches do not establish absence outside that observation.", ...parent.artifact == null ? ["No artifact identity was bound to the source Evidence."] : []]
			};
			if (view.kind === "summary") return ok({
				...shared,
				kind: "summary",
				view,
				summary: {
					collection: strings ? "strings" : parent.operation === "list_names" ? "names" : "procedures",
					row_count: rows.length,
					discovery_coverage: "unknown",
					selectable_fields: fieldSchema.options
				},
				coverage: completeWithinViewCoverage(rows.length, rows.length)
			});
			const fields = view.fields === undefined ? undefined : [...new Set(view.fields)].filter((field) => field !== "address");
			const selectingValue = fields?.includes("value") === true;
			const selected = rows.slice(view.offset, view.offset + view.limit);
			return ok({
				...shared,
				kind: "native-inventory",
				view,
				rows: selected.map((record, index) => ({
					source_index: view.offset + index,
					record: fields === undefined ? record : {
						address: record.address,
						...selectingValue && record.string !== undefined ? { string: record.string } : {},
						...selectingValue && record.decoding !== undefined ? { decoding: record.decoding } : {},
						...Object.fromEntries(fields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]]))
					}
				})),
				coverage: pageViewCoverage(view.offset, selected.length, rows.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/desktopApplication.js
var desktopFamilySchema, inspectDesktopApplicationInputSchema, byteOffset$1, fact, desktopFactSchema, desktopFileSchema, desktopOmissionSchema, desktopCandidateSchema, desktopComponentSchema, desktopProbeSchema, desktopCoverageSchema, desktopApplicationSchema;
function init_desktopApplication() {
	return (init_desktopApplication = __esmMin((() => {
		init_digests();
		init_localPath();
		init_artifactGraph();
		desktopFamilySchema = z.enum([
			"dotnet",
			"unity-mono",
			"unity-il2cpp",
			"unreal",
			"godot",
			"gamemaker",
			"electron"
		]);
		inspectDesktopApplicationInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema,
			max_entries: z.number().int().positive().max(1e5).default(2e4),
			max_probe_bytes: z.number().int().min(4096).max(64 * 1024 * 1024).default(8 * 1024 * 1024)
		});
		byteOffset$1 = z.number().int().nonnegative();
		fact = (kind, value) => z.strictObject({
			kind: z.literal(kind),
			offset: byteOffset$1,
			value
		});
		desktopFactSchema = z.discriminatedUnion("kind", [
			fact("pe-cli-directory", z.strictObject({
				rva: byteOffset$1,
				bytes: byteOffset$1
			})),
			fact("unity-assembly-reference", z.strictObject({
				name: z.string(),
				token: z.string(),
				managed_directory: z.string()
			})),
			fact("native-image-header", z.union([z.strictObject({
				format: z.literal("pe"),
				machine: byteOffset$1
			}), z.strictObject({
				format: z.enum(["elf", "mach-o"]),
				signature: z.string()
			})])),
			fact("il2cpp-metadata-header", z.strictObject({
				magic: z.literal("0xfab11baf"),
				raw_version: byteOffset$1.nullable()
			})),
			fact("godot-pck-header", z.strictObject({
				pack_version: byteOffset$1,
				engine_version: z.array(byteOffset$1).length(3),
				placement: z.enum(["standalone", "embedded-trailer"])
			})),
			fact("gamemaker-form-header", z.strictObject({
				container: z.literal("FORM"),
				first_chunk: z.literal("GEN8")
			})),
			z.strictObject({
				kind: z.literal("il2cpp-library-convention"),
				offset: z.null(),
				value: z.string()
			}),
			z.strictObject({
				kind: z.literal("electron-asar-convention"),
				offset: z.null(),
				value: z.string()
			}),
			z.strictObject({
				kind: z.literal("unreal-container-convention"),
				offset: byteOffset$1.nullable(),
				value: z.union([z.string(), z.strictObject({ format: z.literal("IoStore TOC") })])
			})
		]);
		desktopFileSchema = z.strictObject({
			file_id: prefixedDigestSchema("dsf"),
			path: z.string(),
			local_path: localPathStringSchema,
			kind: z.enum([
				"file",
				"directory",
				"symlink"
			]),
			bytes: z.number().int().nonnegative().nullable(),
			identity: z.strictObject({
				device: z.string(),
				inode: z.string(),
				size: z.string(),
				mode: z.string(),
				mtime_ns: z.string(),
				ctime_ns: z.string()
			}).nullable(),
			read_status: z.enum([
				"not-selected",
				"examined",
				"partial",
				"unavailable"
			]),
			ranges: z.array(z.strictObject({
				offset: z.number().int().nonnegative(),
				bytes: z.number().int().nonnegative(),
				sha256: digestSchema
			})),
			facts: z.array(desktopFactSchema),
			issues: z.array(z.string())
		});
		desktopOmissionSchema = z.strictObject({
			omission_id: prefixedDigestSchema("dso"),
			path: z.string(),
			kind: artifactTraversalOmissionKindSchema
		});
		desktopCandidateSchema = z.strictObject({
			candidate_id: prefixedDigestSchema("dsc"),
			family: desktopFamilySchema,
			confidence: z.enum(["derived", "inferred"]),
			basis_file_ids: z.array(prefixedDigestSchema("dsf")).min(1),
			rationale: z.string()
		});
		desktopComponentSchema = z.strictObject({
			component_id: prefixedDigestSchema("dsm"),
			name: z.string(),
			category: z.enum(["mod-loader", "protection"]),
			basis_file_ids: z.array(prefixedDigestSchema("dsf")).min(1),
			confidence: z.literal("inferred"),
			runtime_presence: z.literal("unknown")
		});
		desktopProbeSchema = z.strictObject({
			probe_id: prefixedDigestSchema("dsp"),
			operation: z.enum([
				"inspect_managed_artifact",
				"inspect_il2cpp_metadata",
				"open_binary",
				"analyze_javascript_application"
			]),
			path: localPathStringSchema,
			file_id: prefixedDigestSchema("dsf"),
			rationale: z.string(),
			confidence: z.literal("inferred")
		});
		desktopCoverageSchema = z.strictObject({
			status: z.enum(["complete-within-scan", "partial"]),
			entries_examined: z.number().int().nonnegative(),
			files_probed: z.number().int().nonnegative(),
			bytes_read: z.number().int().nonnegative(),
			symlinks_not_followed: z.number().int().nonnegative(),
			special_entries_omitted: z.number().int().nonnegative(),
			limits: z.strictObject({
				max_entries: inspectDesktopApplicationInputSchema.shape.max_entries.removeDefault(),
				max_probe_bytes: inspectDesktopApplicationInputSchema.shape.max_probe_bytes.removeDefault()
			})
		});
		desktopApplicationSchema = z.strictObject({
			root: z.strictObject({
				path: localPathStringSchema,
				canonical_path: localPathStringSchema,
				namespace_id: prefixedDigestSchema("dsr"),
				identity: z.strictObject({
					device: z.string(),
					inode: z.string()
				}),
				snapshot_sha256: digestSchema,
				identity_scope: z.literal("examined-metadata-and-read-ranges")
			}),
			files: z.array(desktopFileSchema),
			omissions: z.array(desktopOmissionSchema),
			candidates: z.array(desktopCandidateSchema),
			components: z.array(desktopComponentSchema),
			next_probes: z.array(desktopProbeSchema),
			coverage: desktopCoverageSchema,
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/desktopApplicationView.js
var DIAGNOSTIC_PREVIEW_FILES, DIAGNOSTIC_PREVIEW_UNITS, hasProbeIssues, diagnosticTextPreview, page$3, desktopViewRequestSchema, desktopViewItemsSchema, desktopSummarySchema, validatedParents, projectDesktopApplicationView;
function init_desktopApplicationView() {
	return (init_desktopApplicationView = __esmMin((() => {
		init_desktopApplication();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_result();
		DIAGNOSTIC_PREVIEW_FILES = 2;
		DIAGNOSTIC_PREVIEW_UNITS = 256;
		hasProbeIssues = (file) => file.issues.length > 0;
		diagnosticTextPreview = (value) => {
			let end = Math.min(value.length, DIAGNOSTIC_PREVIEW_UNITS);
			const last = value.charCodeAt(end - 1);
			if (end < value.length && last >= 55296 && last <= 56319) end--;
			return {
				text: value.slice(0, end),
				truncated: end < value.length
			};
		};
		page$3 = {
			kind: z.literal("desktop-application"),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		};
		desktopViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...page$3,
				collection: z.literal("files"),
				paths: z.array(z.string()).optional(),
				file_ids: z.array(desktopFileSchema.shape.file_id).optional(),
				has_issues: z.boolean().optional(),
				fields: z.array(desktopFileSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$3,
				collection: z.literal("candidates"),
				families: z.array(desktopFamilySchema).optional(),
				fields: z.array(desktopCandidateSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$3,
				collection: z.literal("omissions"),
				paths: z.array(z.string()).optional(),
				omission_ids: z.array(desktopOmissionSchema.shape.omission_id).optional(),
				fields: z.array(desktopOmissionSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$3,
				collection: z.literal("components"),
				fields: z.array(desktopComponentSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$3,
				collection: z.literal("next_probes"),
				fields: z.array(desktopProbeSchema.keyof()).optional()
			})
		]);
		desktopViewItemsSchema = z.array(z.union([
			desktopFileSchema.partial(),
			desktopOmissionSchema.partial(),
			desktopCandidateSchema.partial(),
			desktopComponentSchema.partial(),
			desktopProbeSchema.partial()
		]));
		desktopSummarySchema = z.strictObject({
			root: desktopApplicationSchema.shape.root,
			source_coverage: desktopCoverageSchema,
			available_counts: z.strictObject({
				files: z.number().int().nonnegative(),
				omissions: z.number().int().nonnegative(),
				candidates: z.number().int().nonnegative(),
				components: z.number().int().nonnegative(),
				next_probes: z.number().int().nonnegative()
			}),
			probe_issues: z.strictObject({
				file_count: z.number().int().nonnegative(),
				issue_count: z.number().int().nonnegative(),
				preview: z.array(z.strictObject({
					file_id: desktopFileSchema.shape.file_id,
					path_preview: z.string(),
					read_status: desktopFileSchema.shape.read_status,
					issue_count: z.number().int().positive(),
					first_issue_preview: z.string(),
					text_truncated: z.boolean()
				})).max(DIAGNOSTIC_PREVIEW_FILES),
				preview_truncated: z.boolean().describe("More retained files have probe issues than fit in the preview.")
			}),
			candidates: z.array(desktopCandidateSchema.omit({ basis_file_ids: true }).extend({
				basis_file_count: z.number().int().positive(),
				basis_path_preview: z.array(z.string())
			})),
			components: z.array(desktopComponentSchema.omit({ basis_file_ids: true }).extend({
				basis_file_count: z.number().int().positive(),
				basis_path_preview: z.array(z.string())
			})),
			next_probe_groups: z.array(z.strictObject({
				operation: desktopProbeSchema.shape.operation,
				count: z.number().int().positive(),
				example: desktopProbeSchema
			}))
		});
		validatedParents = new WeakSet();
		projectDesktopApplicationView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "desktop-application") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Desktop directory Evidence supports summary and desktop-application views."
			}]));
			const key = typeof parent.normalizedResult === "object" && parent.normalizedResult !== null ? parent.normalizedResult : undefined;
			const reusable = parent.sealedResult === true && key !== undefined && Object.isFrozen(key);
			let report = reusable && validatedParents.has(key) ? key : undefined;
			if (report === undefined) {
				const parsed = parseAnalysisViewResult(desktopApplicationSchema, parent);
				if (!parsed.ok) return parsed;
				report = parsed.value;
				if (reusable) {
					report = key;
					validatedParents.add(key);
				}
			}
			if (parent.subject === undefined || parent.subject === null || parent.subject.format !== "directory" || parent.subject.local_path !== report.root.path || parent.subject.digest.sha256 !== report.root.snapshot_sha256) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Parent must identify the same examined directory snapshot."
			}]));
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_desktop_application",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.root.path,
					sha256: report.root.snapshot_sha256
				},
				limitations: [...new Set([...parent.limitations, ...report.limitations])],
				unknowns: ["Runtime behavior and unread bytes remain unknown.", ...report.coverage.status === "partial" ? ["Source inspection is partial; an exhausted page does not establish absence."] : []]
			};
			if (view.kind === "summary") {
				const byId = new Map();
				const probeIssues = {
					file_count: 0,
					issue_count: 0,
					preview: [],
					preview_truncated: false
				};
				for (const file of report.files) {
					byId.set(file.file_id, file.path);
					if (!hasProbeIssues(file)) continue;
					probeIssues.file_count++;
					probeIssues.issue_count += file.issues.length;
					if (probeIssues.preview.length === DIAGNOSTIC_PREVIEW_FILES) continue;
					const firstIssue = file.issues[0];
					if (firstIssue === undefined) continue;
					const path = diagnosticTextPreview(file.path);
					const issue = diagnosticTextPreview(firstIssue);
					probeIssues.preview.push({
						file_id: file.file_id,
						path_preview: path.text,
						read_status: file.read_status,
						issue_count: file.issues.length,
						first_issue_preview: issue.text,
						text_truncated: path.truncated || issue.truncated
					});
				}
				probeIssues.preview_truncated = probeIssues.file_count > probeIssues.preview.length;
				const summarizeBasis = (row) => {
					const { basis_file_ids, ...value } = row;
					return {
						...value,
						basis_file_count: basis_file_ids.length,
						basis_path_preview: basis_file_ids.slice(0, 2).map((id) => byId.get(id) ?? id)
					};
				};
				const groups = new Map();
				for (const probe of report.next_probes) {
					const group = groups.get(probe.operation);
					if (group === undefined) groups.set(probe.operation, {
						operation: probe.operation,
						count: 1,
						example: probe
					});
					else group.count++;
				}
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						root: report.root,
						source_coverage: report.coverage,
						available_counts: {
							files: report.files.length,
							omissions: report.omissions.length,
							candidates: report.candidates.length,
							components: report.components.length,
							next_probes: report.next_probes.length
						},
						probe_issues: probeIssues,
						candidates: report.candidates.map(summarizeBasis),
						components: report.components.map(summarizeBasis),
						next_probe_groups: [...groups.values()]
					},
					coverage: completeWithinViewCoverage(report.files.length, report.files.length)
				});
			}
			let rows = report[view.collection];
			if (view.collection === "files" || view.collection === "omissions") {
				const paths = view.paths === undefined ? undefined : new Set(view.paths);
				const ids = view.collection === "files" ? view.file_ids : view.omission_ids;
				const selected = ids === undefined ? undefined : new Set(ids);
				const withIssues = view.collection === "files" ? view.has_issues : undefined;
				if (paths !== undefined || selected !== undefined || withIssues !== undefined) rows = report[view.collection].filter((row) => (paths === undefined || paths.has(row.path)) && (selected === undefined || selected.has("file_id" in row ? row.file_id : row.omission_id)) && (withIssues === undefined || "issues" in row && hasProbeIssues(row) === withIssues));
			}
			if (view.collection === "candidates" && view.families !== undefined) {
				const selected = new Set(view.families);
				rows = report.candidates.filter((row) => selected.has(row.family));
			}
			const idField = {
				files: "file_id",
				omissions: "omission_id",
				candidates: "candidate_id",
				components: "component_id",
				next_probes: "probe_id"
			}[view.collection];
			const fields = view.fields === undefined ? undefined : new Set([idField, ...view.fields]);
			const items = rows.slice(view.offset, view.offset + view.limit).map((row) => fields === undefined ? row : Object.fromEntries(Object.entries(row).filter(([field]) => fields.has(field))));
			return ok({
				kind: "desktop-application",
				view,
				...shared,
				source_coverage: report.coverage,
				items: desktopViewItemsSchema.parse(items),
				coverage: pageViewCoverage(view.offset, items.length, rows.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/javascriptModuleReferences.js
var moduleKindSchema, javascriptModuleReferencesRequestSchema, basisSchema, javascriptModuleReferenceSchema;
function init_javascriptModuleReferences() {
	return (init_javascriptModuleReferences = __esmMin((() => {
		init_digests();
		init_javascriptApplicationEvidenceSchemas();
		moduleKindSchema = z.enum([
			"javascript-asset",
			"javascript-module",
			"source-module"
		]);
		javascriptModuleReferencesRequestSchema = z.strictObject({
			kind: z.literal("javascript"),
			collection: z.literal("modules"),
			projection: z.literal("references"),
			where: z.strictObject({
				path: z.string().nullable().optional(),
				kind: moduleKindSchema.optional()
			}).default({}),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		basisSchema = z.strictObject({
			authority: applicationGraphEvidenceSchema.shape.authority,
			state: applicationGraphEvidenceSchema.shape.state,
			confidence: applicationGraphEvidenceSchema.shape.confidence
		});
		javascriptModuleReferenceSchema = z.strictObject({
			node_id: prefixedDigestSchema("jag_node"),
			kind: moduleKindSchema,
			path: z.string().nullable(),
			identity: applicationNodeIdentitySchema,
			retained_source_range_count: z.int().nonnegative(),
			basis: z.array(basisSchema).min(1)
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/javascriptApplicationCoverage.js
var javascriptApplicationSourceCoverageSchema, javascriptApplicationSourceCoverage, javascriptStaticSourceCoverageSummary;
function init_javascriptApplicationCoverage() {
	return (init_javascriptApplicationCoverage = __esmMin((() => {
		init_javascriptApplicationEvidenceSchemas();
		init_javascriptSemanticGraphSchemas();
		init_javascriptSourceSelection();
		init_javascriptStaticCoverage();
		javascriptApplicationSourceCoverageSchema = z.strictObject({
			source_selection: javaScriptSourceSelectionSchema.exactOptional(),
			application: applicationCoverageSchema,
			semantic: javaScriptSemanticGraphInputSchema.shape.coverage.omit({ families: true }),
			application_unknown_count: z.int().nonnegative(),
			semantic_unknown_count: z.int().nonnegative()
		});
		javascriptApplicationSourceCoverage = (analysis) => {
			const { families: _families, ...semantic } = analysis.semantic_graph.coverage;
			return {
				...analysis.source_selection === undefined ? {} : { source_selection: analysis.source_selection },
				application: analysis.graph.coverage,
				semantic,
				application_unknown_count: analysis.graph.nodes.reduce((count, node) => count + Number(node.kind === "unknown"), 0),
				semantic_unknown_count: analysis.semantic_graph.unknowns.length
			};
		};
		javascriptStaticSourceCoverageSummary = (analysis) => {
			const summary = {
				sources: 0,
				unmeasured_sources: 0,
				syntax: {
					complete: 0,
					recovered: 0,
					failed: 0,
					"not-examined": 0
				},
				semantics: {
					unknown_sources: 0,
					unexamined_sources: 0
				},
				examination: {
					complete: 0,
					limited: 0,
					"not-examined": 0
				},
				electron_applicability: {
					observed: 0,
					unknown: 0
				}
			};
			for (const node of analysis.graph.nodes) {
				for (const observation of node.observations) {
					if (observation.properties.file_kind !== "javascript") continue;
					summary.sources += 1;
					const parsed = javaScriptStaticCoverageSchema.safeParse(observation.properties.analysis_coverage);
					if (!parsed.success) {
						summary.unmeasured_sources += 1;
						continue;
					}
					const coverage = parsed.data;
					summary.syntax[coverage.syntax.status] += 1;
					summary.examination[coverage.examination.status] += 1;
					summary.electron_applicability[coverage.applicability.electron] += 1;
					if (coverage.semantics.unknown_findings === null) summary.semantics.unexamined_sources += 1;
					else if (coverage.semantics.uncertainty.length > 0) summary.semantics.unknown_sources += 1;
				}
			}
			return summary;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/javascriptFactsView.js
var propertyKeySchema, javascriptFactsViewRequestSchema, javascriptFactRowSchema, observationPath, projectJavaScriptFacts;
function init_javascriptFactsView() {
	return (init_javascriptFactsView = __esmMin((() => {
		init_javascriptApplicationGraphSchemas();
		propertyKeySchema = applicationNodeObservationSchema.shape.properties.keyType;
		javascriptFactsViewRequestSchema = z.strictObject({
			kind: z.literal("javascript-facts"),
			where: z.strictObject({
				paths: z.array(z.string()).optional().describe("Exact Evidence artifact-path or source-range source strings. Omitted includes unknown locations; [] matches none. No filesystem lookup or path normalization."),
				kinds: z.array(applicationNodeSchema.shape.kind).optional()
			}).default({}),
			property_keys: z.array(propertyKeySchema).describe("Exact retained observation-property names to read; [] requests identities/provenance only. Missing properties remain omitted, distinct from retained null. No cross-observation merging or inferred values."),
			include_available_property_keys: z.boolean().default(false).describe("Opt into original property names for each returned observation, without unselected values. Use with property_keys: [] to discover fields before reading them."),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		});
		javascriptFactRowSchema = applicationNodeSchema.pick({
			node_id: true,
			kind: true,
			identity: true
		}).extend(applicationNodeObservationSchema.pick({
			observation_id: true,
			source_map_reference: true,
			properties: true,
			evidence: true
		}).shape).extend({ available_property_keys: z.array(propertyKeySchema).exactOptional() });
		observationPath = (observation) => {
			const { location } = observation.evidence;
			if (!location.available) return null;
			if (location.value.kind === "artifact-path") return location.value.path;
			if (location.value.kind === "source-range") return location.value.source;
			return null;
		};
		projectJavaScriptFacts = (nodes, view) => {
			const paths = view.where.paths === undefined ? null : new Set(view.where.paths);
			const kinds = view.where.kinds === undefined ? null : new Set(view.where.kinds);
			if (paths?.size === 0 || kinds?.size === 0) return {
				rows: [],
				total: 0
			};
			const keys = [...new Set(view.property_keys)];
			const rows = [];
			let total = 0;
			for (const node of nodes) {
				if (kinds !== null && !kinds.has(node.kind)) continue;
				for (const observation of node.observations) {
					if (paths !== null) {
						const path = observationPath(observation);
						if (path === null || !paths.has(path)) continue;
					}
					total += 1;
					if (total <= view.offset || rows.length >= view.limit) continue;
					rows.push({
						node_id: node.node_id,
						kind: node.kind,
						identity: node.identity,
						observation_id: observation.observation_id,
						source_map_reference: observation.source_map_reference,
						...view.include_available_property_keys ? { available_property_keys: Object.keys(observation.properties).sort() } : {},
						properties: Object.fromEntries(keys.flatMap((key) => {
							const value = observation.properties[key];
							return value !== undefined && Object.hasOwn(observation.properties, key) ? [[key, value]] : [];
						})),
						evidence: observation.evidence
					});
				}
			}
			return {
				rows,
				total
			};
		};
	})))();
}

//#endregion
//#region dist/domain/native/binaryLayout.js
var unsignedHex, index, scalar, range, canonicalBase64, name, inspectBinaryLayoutInputSchema, binaryLayoutObjectSchema, binaryLayoutPayloadSchema, binaryLayoutSchema, validatedImmutableLayouts, safeParseOwnedBinaryLayout, validateRelocationReferences, validatePackedRelativeTables;
function init_binaryLayout() {
	return (init_binaryLayout = __esmMin((() => {
		init_immutableJson();
		init_nativeDeadlines();
		init_localPath();
		init_stringPatterns();
		unsignedHex = z.string().regex(/^0x(?:0|[1-9a-f][0-9a-f]{0,15})$/);
		index = z.int().nonnegative();
		scalar = z.union([z.string(), z.int()]);
		range = z.strictObject({
			offset: unsignedHex,
			bytes: unsignedHex
		});
		canonicalBase64 = canonicalBase64Schema;
		name = z.strictObject({
			display: z.string(),
			bytes_base64: canonicalBase64.nullable(),
			location: range.nullable(),
			unknown_reason: z.string().nullable()
		});
		inspectBinaryLayoutInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to the selected binary"),
			pwntools_timeout_ms: pwntoolsTimeoutField
		});
		binaryLayoutObjectSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string().min(1),
				sha256: z.string().regex(/^[a-f0-9]{64}$/),
				bytes: index
			}),
			format: z.literal("elf"),
			architecture: z.union([
				z.strictObject({
					machine: z.literal("EM_X86_64"),
					bits: z.literal(64),
					byte_order: z.literal("little")
				}),
				z.strictObject({
					machine: z.enum(["EM_386", "EM_ARM"]),
					bits: z.literal(32),
					byte_order: z.literal("little")
				}),
				z.strictObject({
					machine: z.literal("EM_MIPS"),
					bits: z.literal(32),
					byte_order: z.enum(["little", "big"])
				})
			]),
			image_type: z.enum([
				"ET_EXEC",
				"ET_DYN",
				"ET_REL"
			]),
			entry_point: z.strictObject({
				reported_value: unsignedHex,
				meaning: z.enum([
					"linked-virtual-address",
					"not-applicable",
					"absent"
				]),
				execution_status: z.literal("unknown")
			}),
			runtime_load_base: z.null(),
			sections: z.array(z.strictObject({
				index,
				name,
				name_offset: unsignedHex,
				type: scalar,
				header_location: range,
				address: unsignedHex,
				offset: unsignedHex,
				size: unsignedHex,
				alignment: unsignedHex,
				flags: unsignedHex,
				link: index,
				info: index,
				entry_size: unsignedHex,
				file_backing: z.enum(["file", "none"])
			})),
			segments: z.array(z.strictObject({
				index,
				type: scalar,
				header_location: range,
				offset: unsignedHex,
				file_size: unsignedHex,
				memory_size: unsignedHex,
				virtual_address: unsignedHex,
				physical_address: unsignedHex,
				alignment: unsignedHex,
				flags: unsignedHex,
				file_backing: z.enum(["file", "none"]),
				permissions: z.strictObject({
					read: z.boolean(),
					write: z.boolean(),
					execute: z.boolean()
				}).nullable()
			})),
			symbols: z.array(z.strictObject({
				table_index: index,
				entry_index: index,
				name,
				name_offset: unsignedHex,
				location: range,
				value: unsignedHex,
				value_meaning: z.enum([
					"undefined",
					"alignment",
					"absolute-value",
					"no-address",
					"unknown-section-index",
					"section-offset",
					"tls-offset",
					"linked-virtual-address"
				]),
				size: unsignedHex,
				binding: scalar,
				type: scalar,
				visibility: scalar,
				section_index: scalar
			})),
			relocations: z.array(z.strictObject({
				section_index: index,
				entry_index: index,
				reported_offset: unsignedHex,
				target: z.discriminatedUnion("kind", [
					z.strictObject({
						kind: z.literal("section-offset"),
						section_index: index,
						offset: unsignedHex
					}),
					z.strictObject({
						kind: z.literal("linked-virtual-address"),
						address: unsignedHex
					}),
					z.strictObject({
						kind: z.literal("unknown-section"),
						reported_section_index: index,
						offset: unsignedHex,
						unknown_reason: z.enum(["undefined-section-reference", "inactive-section-header"])
					})
				]),
				location: range,
				type: index,
				symbol_table_index: index,
				symbol_index: index,
				symbol_reference_meaning: z.enum(["zero-symbol-value", "symbol-table-entry"]),
				addend: z.string().regex(/^-?(?:0|[1-9][0-9]{0,18})$/).nullable()
			})),
			packed_relative_relocations: z.array(z.strictObject({
				section_index: index,
				location: range,
				encoded_bytes_base64: canonicalBase64,
				entries: z.array(z.strictObject({
					decoded_index: index,
					reported_offset: unsignedHex
				})),
				offset_meaning: z.enum(["linked-virtual-address", "unknown"]),
				evidence_kind: z.literal("derived"),
				entry_source_locations: z.null(),
				addends: z.null()
			})),
			relocation_inventory_completeness: z.literal("unknown"),
			linkage: z.strictObject({
				needed_libraries: z.array(name),
				interpreters: z.array(name),
				got: z.array(z.strictObject({
					display_name: z.string(),
					address: unsignedHex
				})),
				plt: z.array(z.strictObject({
					display_name: z.string(),
					address: unsignedHex
				})),
				convenience_maps_completeness: z.literal("unknown"),
				runtime_library_paths: z.null()
			}),
			mitigations: z.strictObject({
				evidence_kind: z.literal("inferred"),
				position_independent: z.boolean(),
				nx_indicator: z.boolean().nullable(),
				executable_stack_indicator: z.boolean(),
				stack_canary_indicator: z.boolean(),
				relro: z.enum(["Partial", "Full"]).nullable()
			}),
			diagnostics: z.strictObject({
				stdout: z.string(),
				stderr: z.string(),
				truncated: z.boolean()
			}),
			limitations: z.array(z.string())
		});
		binaryLayoutPayloadSchema = binaryLayoutObjectSchema.omit({
			artifact: true,
			diagnostics: true
		});
		binaryLayoutSchema = binaryLayoutObjectSchema.superRefine((value, context) => {
			const size = BigInt(value.artifact.bytes);
			const check = (offset, length, path) => {
				const start = BigInt(offset);
				const bytes = BigInt(length);
				if (start > size || bytes > size - start) context.addIssue({
					code: "custom",
					path,
					message: "Reported file-backed range lies outside the selected artifact."
				});
			};
			const checkLocation = (where, path) => check(where.offset, where.bytes, path);
			const checkName = (reported, path) => {
				if (reported.location !== null) checkLocation(reported.location, [...path, "location"]);
			};
			const expectedEntryMeaning = value.image_type === "ET_REL" ? "not-applicable" : value.entry_point.reported_value === "0x0" ? "absent" : "linked-virtual-address";
			if (value.entry_point.meaning !== expectedEntryMeaning) context.addIssue({
				code: "custom",
				path: ["entry_point", "meaning"],
				message: "Entry meaning must distinguish zero/unused fields from an actual linked address."
			});
			for (const [index, section] of value.sections.entries()) {
				if ((section.type === "SHT_SYMTAB" || section.type === "SHT_DYNSYM") && value.sections[section.link]?.type !== "SHT_STRTAB") context.addIssue({
					code: "custom",
					path: [
						"sections",
						index,
						"link"
					],
					message: "Symbol tables must link to an existing string-table section."
				});
				if (section.index !== index) context.addIssue({
					code: "custom",
					path: [
						"sections",
						index,
						"index"
					],
					message: "Complete section order must preserve original producer indices."
				});
				checkLocation(section.header_location, [
					"sections",
					index,
					"header_location"
				]);
				checkName(section.name, [
					"sections",
					index,
					"name"
				]);
				if (section.file_backing === "file") check(section.offset, section.size, ["sections", index]);
			}
			for (const [index, segment] of value.segments.entries()) {
				if (segment.index !== index) context.addIssue({
					code: "custom",
					path: [
						"segments",
						index,
						"index"
					],
					message: "Complete segment order must preserve original producer indices."
				});
				checkLocation(segment.header_location, [
					"segments",
					index,
					"header_location"
				]);
				const hasFileBytes = segment.type !== "PT_NULL" && BigInt(segment.file_size) !== 0n;
				if (segment.file_backing !== (hasFileBytes ? "file" : "none")) context.addIssue({
					code: "custom",
					path: [
						"segments",
						index,
						"file_backing"
					],
					message: "File backing must follow the reported segment type and file size."
				});
				if (segment.type === "PT_NULL" !== (segment.permissions === null)) context.addIssue({
					code: "custom",
					path: [
						"segments",
						index,
						"permissions"
					],
					message: "Unused PT_NULL flags have no permission meaning; other segment flags retain their interpretation."
				});
				if (hasFileBytes) check(segment.offset, segment.file_size, ["segments", index]);
			}
			for (const [index, symbol] of value.symbols.entries()) {
				checkLocation(symbol.location, [
					"symbols",
					index,
					"location"
				]);
				checkName(symbol.name, [
					"symbols",
					index,
					"name"
				]);
			}
			for (const [index, relocation] of value.relocations.entries()) checkLocation(relocation.location, [
				"relocations",
				index,
				"location"
			]);
			validateRelocationReferences(value, context);
			validatePackedRelativeTables(value, context, checkLocation);
			for (const facet of ["needed_libraries", "interpreters"]) for (const [index, reported] of value.linkage[facet].entries()) checkName(reported, [
				"linkage",
				facet,
				index
			]);
		});
		validatedImmutableLayouts = new WeakSet();
		safeParseOwnedBinaryLayout = (input) => {
			if (typeof input === "object" && input !== null && validatedImmutableLayouts.has(input)) return {
				success: true,
				data: input
			};
			const parsed = binaryLayoutSchema.safeParse(input);
			if (parsed.success && canBorrowParsedJsonSnapshot(input, parsed.data)) {
				validatedImmutableLayouts.add(input);
				return {
					success: true,
					data: input
				};
			}
			return parsed;
		};
		validateRelocationReferences = (value, context) => {
			const symbols = new Set(value.symbols.map((symbol) => `${symbol.table_index}:${symbol.entry_index}`));
			for (const [index, relocation] of value.relocations.entries()) {
				const owner = value.sections[relocation.section_index];
				const target = relocation.target;
				const targetMatches = value.image_type === "ET_REL" ? target.kind === "section-offset" ? target.section_index !== 0 && target.section_index === owner?.info && value.sections[target.section_index] !== undefined && value.sections[target.section_index]?.type !== "SHT_NULL" && target.offset === relocation.reported_offset : target.kind === "unknown-section" && target.reported_section_index === owner?.info && target.offset === relocation.reported_offset && (target.reported_section_index === 0 ? target.unknown_reason === "undefined-section-reference" : value.sections[target.reported_section_index]?.type === "SHT_NULL" && target.unknown_reason === "inactive-section-header") : target.kind === "linked-virtual-address" && target.address === relocation.reported_offset;
				if (!targetMatches) context.addIssue({
					code: "custom",
					path: [
						"relocations",
						index,
						"target"
					],
					message: "Relocation target must preserve its reported offset and owner reference; SHN_UNDEF and inactive headers remain unknown rather than resolved sections."
				});
				const table = value.sections[relocation.symbol_table_index];
				const tableExists = relocation.symbol_table_index !== 0 && (table?.type === "SHT_SYMTAB" || table?.type === "SHT_DYNSYM");
				const positiveReferenceExists = tableExists && BigInt(table.entry_size) >= (value.architecture.bits === 32 ? 16n : 24n) && BigInt(relocation.symbol_index) < BigInt(table.size) / BigInt(table.entry_size) && symbols.has(`${relocation.symbol_table_index}:${relocation.symbol_index}`);
				if (owner?.type !== "SHT_REL" && owner?.type !== "SHT_RELA" || owner.link !== relocation.symbol_table_index || relocation.symbol_table_index !== 0 && !tableExists || relocation.symbol_index !== 0 && !positiveReferenceExists || relocation.symbol_reference_meaning !== (relocation.symbol_index === 0 ? "zero-symbol-value" : "symbol-table-entry")) context.addIssue({
					code: "custom",
					path: ["relocations", index],
					message: "Relocation must preserve its REL/RELA owner and resolve positive symbol indices through the linked symbol table; index zero uses a zero symbol value."
				});
			}
		};
		validatePackedRelativeTables = (value, context, checkLocation) => {
			for (const [tableIndex, table] of value.packed_relative_relocations.entries()) {
				checkLocation(table.location, [
					"packed_relative_relocations",
					tableIndex,
					"location"
				]);
				const encodedBytes = Buffer.byteLength(table.encoded_bytes_base64, "base64");
				if (BigInt(encodedBytes) !== BigInt(table.location.bytes)) context.addIssue({
					code: "custom",
					path: ["packed_relative_relocations", tableIndex],
					message: "Complete packed table bytes must match its original file range."
				});
				const section = value.sections[table.section_index];
				if (section?.type !== "SHT_RELR" || section.offset !== table.location.offset || section.size !== table.location.bytes) context.addIssue({
					code: "custom",
					path: [
						"packed_relative_relocations",
						tableIndex,
						"section_index"
					],
					message: "Packed relative evidence must retain its original RELR section identity and range."
				});
				for (const [decoded, entry] of table.entries.entries()) if (entry.decoded_index !== decoded) context.addIssue({
					code: "custom",
					path: [
						"packed_relative_relocations",
						tableIndex,
						"entries",
						decoded
					],
					message: "Decoded offsets must preserve upstream iterator order."
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/binaryLayoutView.js
var OPERATION$1, inputError$2, layoutUnknowns, displayName, namedMatches, selectNamed, selectIndexed, pageRows$1, layoutIncompatible, parentFields$2, layoutSummary, projectBinaryLayoutView, selectLayoutItem;
function init_binaryLayoutView() {
	return (init_binaryLayoutView = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_analysisViewCoverage();
		OPERATION$1 = "inspect_analysis_view";
		inputError$2 = (issues) => new AnalysisInputError(OPERATION$1, undefined, issues);
		layoutUnknowns = (layout) => {
			const unknowns = [
				"runtime_load_base is unknown",
				"entry_point.execution_status is unknown",
				"relocation_inventory_completeness is unknown",
				"linkage.convenience_maps_completeness is unknown",
				"linkage.runtime_library_paths are unknown"
			];
			if (layout.mitigations.nx_indicator === null) unknowns.push("mitigations.nx_indicator is unknown");
			if (layout.mitigations.relro === null) unknowns.push("mitigations.relro is unknown");
			return unknowns;
		};
		displayName = (name) => name.display;
		namedMatches = (rows, name) => rows.flatMap((row, index) => row.name.unknown_reason === null && displayName(row.name) === name ? [{
			index,
			row
		}] : []);
		selectNamed = (collection, rows, name) => {
			const matches = namedMatches(rows, name);
			if (matches.length === 1) {
				const selected = matches[0];
				if (selected !== undefined) return ok(selected.row);
			}
			if (matches.length === 0) return err(inputError$2([{
				path: [
					"view",
					"selector",
					"name"
				],
				reason: "invalid_value",
				message: `No ${collection} named ${JSON.stringify(name)}. Collection has ${String(rows.length)} entries; page it to inspect exact indexes and names.`
			}]));
			return err(inputError$2([{
				path: [
					"view",
					"selector",
					"name"
				],
				reason: "invalid_value",
				message: `Multiple ${collection} named ${JSON.stringify(name)}; select one by index.`,
				expected: matches.map(({ index }) => ({ index }))
			}]));
		};
		selectIndexed = (collection, rows, index) => {
			const row = rows[index];
			if (row !== undefined) return ok(row);
			if (rows.length === 0) return err(inputError$2([{
				path: [
					"view",
					"selector",
					"index"
				],
				reason: "invalid_value",
				message: `No retained ${collection} entries can be selected by index.`
			}]));
			return err(inputError$2([{
				path: [
					"view",
					"selector",
					"index"
				],
				reason: "out_of_range",
				message: `${collection} index ${String(index)} is outside 0..${String(rows.length - 1)} (${String(rows.length)} entries).`,
				minimum: 0,
				maximum: rows.length - 1
			}]));
		};
		pageRows$1 = (rows, offset, limit) => rows.slice(offset, offset + limit);
		layoutIncompatible = (detail) => inputError$2([{
			path: ["view"],
			reason: "invalid_value",
			message: detail
		}]);
		parentFields$2 = (parent, layout) => ({
			parent_evidence_id: parent.evidenceId,
			parent_operation: "inspect_binary_layout",
			parent_digest: parent.evidenceId.slice(3),
			artifact: {
				path: layout.artifact.path,
				sha256: layout.artifact.sha256
			},
			limitations: boundedViewMessages([...parent.limitations, ...layout.limitations], parent.evidenceId, "limitations"),
			unknowns: boundedViewMessages(layoutUnknowns(layout), parent.evidenceId, "unknowns")
		});
		layoutSummary = (layout) => ({
			bytes: layout.artifact.bytes,
			format: layout.format,
			architecture: layout.architecture,
			image_type: layout.image_type,
			entry: layout.entry_point,
			counts: {
				sections: layout.sections.length,
				segments: layout.segments.length,
				symbols: layout.symbols.length,
				relocations: layout.relocations.length
			},
			limitation_count: layout.limitations.length
		});
		projectBinaryLayoutView = (parent, layout, view) => {
			const shared = parentFields$2(parent, layout);
			if (view.kind === "native") return err(layoutIncompatible("Native views require analyze_function Evidence."));
			if (view.kind === "inventory") return err(layoutIncompatible("Inventory views require artifact Evidence."));
			if (view.kind === "wasm") return err(layoutIncompatible("WASM views require inspect_wasm_artifact Evidence."));
			if (view.kind === "evm") return err(layoutIncompatible("EVM views require inspect_evm_interface Evidence."));
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				summary: layoutSummary(layout),
				coverage: completeWithinViewCoverage(layout.sections.length + layout.segments.length + layout.symbols.length + layout.relocations.length, layout.sections.length + layout.segments.length + layout.symbols.length + layout.relocations.length),
				...shared
			});
			if (view.kind === "facet") return ok({
				kind: "facet",
				view,
				facet: view.facet === "mitigations" ? layout.mitigations : layout.linkage,
				coverage: completeWithinViewCoverage(1, 1),
				...shared
			});
			if (view.kind === "item") {
				if (view.collection === "modules") return err(layoutIncompatible("modules collection applies to analyze_javascript_application Evidence."));
				const selected = view.collection === "sections" ? selectLayoutItem(view.collection, layout.sections, view.selector) : selectLayoutItem(view.collection, layout.symbols, view.selector);
				if (!selected.ok) return selected;
				return ok({
					kind: "item",
					view,
					item: selected.value,
					coverage: completeWithinViewCoverage(1, view.collection === "sections" ? layout.sections.length : layout.symbols.length),
					...shared
				});
			}
			if (view.kind !== "page") return err(layoutIncompatible("Layout views require summary, facet, item or page selections."));
			if (view.collection === "modules") return err(layoutIncompatible("modules collection applies to analyze_javascript_application Evidence."));
			const rows = view.collection === "sections" ? layout.sections : layout.symbols;
			const items = view.collection === "sections" ? pageRows$1(layout.sections, view.offset, view.limit) : pageRows$1(layout.symbols, view.offset, view.limit);
			return ok({
				kind: "page",
				view,
				items: [...items],
				coverage: pageViewCoverage(view.offset, items.length, rows.length),
				...shared
			});
		};
		selectLayoutItem = (collection, rows, selector) => {
			if ("index" in selector) return selectIndexed(collection, rows, selector.index);
			if ("name" in selector) return selectNamed(collection, rows, selector.name);
			return err(layoutIncompatible("Section and symbol items are selected by index or exact name."));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/javascriptApplicationView.js
/** One owner for the module kinds and path semantics of every module view. */
function* moduleEntries(nodes) {
	for (const node of nodes) {
		if (isModuleNode(node)) {
			const paths = javascriptModulePaths(node);
			yield {
				node,
				path: paths[0] ?? null,
				paths
			};
		}
	}
}
var OPERATION, inputError$1, jsIncompatible, javascriptModulePaths, isModuleNode, modulePage, exportNames, nodeHashes, sourceRanges, moduleItem, moduleReference, javascriptCoverageUnknowns, parentFields$1, selectModule, projectJavaScriptApplicationView;
function init_javascriptApplicationView() {
	return (init_javascriptApplicationView = __esmMin((() => {
		init_analysisErrorCore();
		init_canonicalOrdering();
		init_jsonValue();
		init_result();
		init_javascriptApplicationCoverage();
		init_javascriptFactsView();
		init_analysisViewCoverage();
		OPERATION = "inspect_analysis_view";
		inputError$1 = (issues) => new AnalysisInputError(OPERATION, undefined, issues);
		jsIncompatible = (detail) => inputError$1([{
			path: ["view"],
			reason: "invalid_value",
			message: detail
		}]);
		javascriptModulePaths = (node) => {
			if (node.identity.strategy === "canonical-path") return [node.identity.path];
			if (node.identity.strategy === "source-map-original") return [node.identity.original_source];
			const paths = new Set();
			for (const observation of node.observations) {
				const path = observation.properties.path;
				if (typeof path === "string") {
					paths.add(path);
					continue;
				}
				const location = observation.evidence.location;
				if (location.available && location.value.kind === "artifact-path") paths.add(location.value.path);
				if (location.available && location.value.kind === "source-range") paths.add(location.value.source);
			}
			return [...paths];
		};
		isModuleNode = (node) => node.kind === "javascript-asset" || node.kind === "javascript-module" || node.kind === "source-module";
		modulePage = (nodes, view) => {
			const entries = [];
			let total = 0;
			for (const entry of moduleEntries(nodes)) {
				if (view.where?.kind !== undefined && entry.node.kind !== view.where.kind) continue;
				const selectedPath = view.where?.path;
				if (selectedPath !== undefined && (selectedPath === null ? entry.path !== null : !entry.paths.includes(selectedPath))) continue;
				const selectedEntry = selectedPath !== undefined && selectedPath !== null ? {
					...entry,
					path: selectedPath
				} : entry;
				if (total >= view.offset && entries.length < view.limit) entries.push(selectedEntry);
				total += 1;
			}
			return {
				entries,
				total
			};
		};
		exportNames = (node) => {
			const names = new Set();
			for (const observation of node.observations) {
				const value = observation.properties.export_names ?? observation.properties.exports;
				if (!Array.isArray(value)) continue;
				for (const entry of value) if (typeof entry === "string") names.add(entry);
			}
			return [...names];
		};
		nodeHashes = (node) => {
			const hashes = new Set();
			const { identity } = node;
			if (identity.strategy === "content-digest") hashes.add(identity.sha256);
			if (identity.strategy === "canonical-path") hashes.add(identity.artifact_sha256);
			if (identity.strategy === "source-map-original") {
				hashes.add(identity.source_map_sha256);
				if (identity.source_sha256 !== null) hashes.add(identity.source_sha256);
			}
			for (const observation of node.observations) {
				for (const key of [
					"sha256",
					"container_sha256",
					"entry_sha256",
					"source_sha256"
				]) {
					const value = observation.properties[key];
					if (typeof value === "string" && /^[a-f0-9]{64}$/u.test(value)) hashes.add(value);
				}
			}
			return [...hashes];
		};
		sourceRanges = (node) => node.observations.flatMap((observation) => {
			const location = observation.evidence.location;
			return location.available && location.value.kind === "source-range" ? [location.value] : [];
		});
		moduleItem = (node, path) => ({
			node_id: node.node_id,
			kind: node.kind,
			path,
			identity: node.identity,
			hashes: [...nodeHashes(node)],
			exports: [...exportNames(node)],
			source_ranges: [...sourceRanges(node)],
			observations: node.observations.map((observation) => ({
				observation_id: observation.observation_id,
				label: observation.label,
				properties: observation.properties,
				evidence: {
					...observation.evidence,
					location: observation.evidence.location
				}
			}))
		});
		moduleReference = ({ node, path }) => {
			let ranges = 0;
			const support = new Map();
			for (const { evidence } of node.observations) {
				if (evidence.location.available && evidence.location.value.kind === "source-range") ranges += 1;
				const { authority, state, confidence } = evidence;
				support.set(`${authority}:${state}:${confidence}`, {
					authority,
					state,
					confidence
				});
			}
			return {
				node_id: node.node_id,
				kind: node.kind,
				path,
				identity: node.identity,
				retained_source_range_count: ranges,
				basis: [...support.values()]
			};
		};
		javascriptCoverageUnknowns = (coverage) => {
			const unknowns = [];
			if (coverage.application.status !== "complete") unknowns.push(`graph.coverage.status is ${coverage.application.status}`);
			if (coverage.semantic.status !== "complete") unknowns.push(`semantic_graph.coverage.status is ${coverage.semantic.status}`);
			const applicationUnknowns = coverage.application_unknown_count;
			if (applicationUnknowns > 0) unknowns.push(`${String(applicationUnknowns)} application graph unknowns remain in the parent Evidence.`);
			if (coverage.semantic_unknown_count > 0) unknowns.push(`${String(coverage.semantic_unknown_count)} semantic graph unknowns remain in the parent Evidence.`);
			return unknowns;
		};
		parentFields$1 = (parent, analysis, sourceCoverage) => {
			const limitations = [
				...analysis.limitations,
				...analysis.graph.limitations,
				...analysis.semantic_graph.limitations
			];
			const mergedLimitations = uniqueSorted([...parent.limitations, ...limitations]);
			return {
				limitationCount: mergedLimitations.length,
				fields: {
					parent_evidence_id: parent.evidenceId,
					parent_operation: "analyze_javascript_application",
					parent_digest: parent.evidenceId.slice(3),
					artifact: {
						path: analysis.input_path,
						sha256: analysis.root_artifact_sha256
					},
					limitations: boundedViewMessages(mergedLimitations, parent.evidenceId, "limitations"),
					unknowns: boundedViewMessages(limitations, parent.evidenceId, "unknowns", javascriptCoverageUnknowns(sourceCoverage))
				}
			};
		};
		selectModule = (modules, selector) => {
			if ("node_id" in selector) {
				const matches = modules.filter(({ node }) => node.node_id === selector.node_id);
				if (matches.length === 1) {
					const selected = matches[0];
					if (selected !== undefined) return ok(selected);
				}
				return err(inputError$1([{
					path: [
						"view",
						"selector",
						"node_id"
					],
					reason: "invalid_value",
					message: `No module has node_id ${JSON.stringify(selector.node_id)}. Page the modules collection to inspect available identities.`
				}]));
			}
			if ("path" in selector) {
				const matches = modules.filter((entry) => selector.path === null ? entry.path === null : entry.paths.includes(selector.path));
				if (matches.length === 1) {
					const selected = matches[0];
					if (selected !== undefined) return ok({
						...selected,
						path: selector.path
					});
				}
				if (matches.length === 0) return err(inputError$1([{
					path: [
						"view",
						"selector",
						"path"
					],
					reason: "invalid_value",
					message: `No module has path ${JSON.stringify(selector.path)}. Page the modules collection to inspect exact paths and node_id values.`
				}]));
				return err(inputError$1([{
					path: [
						"view",
						"selector",
						"path"
					],
					reason: "invalid_value",
					message: `Multiple modules have path ${JSON.stringify(selector.path)}; select one by node_id.`,
					expected: matches.map((entry) => ({ node_id: entry.node.node_id }))
				}]));
			}
			return err(jsIncompatible("Module items are selected by exact path or node_id."));
		};
		projectJavaScriptApplicationView = (parent, analysis, view) => {
			if (view.kind !== "summary" && view.kind !== "item" && view.kind !== "page" && view.kind !== "javascript" && view.kind !== "javascript-facts") return err(jsIncompatible("JavaScript application Evidence supports summary, module item/page, typed module references or selected JavaScript facts."));
			const sourceCoverage = javascriptApplicationSourceCoverage(analysis);
			const { fields: shared, limitationCount } = parentFields$1(parent, analysis, sourceCoverage);
			if (view.kind === "javascript-facts") {
				const { rows, total } = projectJavaScriptFacts(analysis.graph.nodes, view);
				return ok({
					...shared,
					kind: "javascript-facts",
					view,
					rows,
					source_coverage: sourceCoverage,
					coverage: pageViewCoverage(view.offset, rows.length, total)
				});
			}
			if (view.kind === "javascript") {
				const { entries, total } = modulePage(analysis.graph.nodes, view);
				const rows = entries.map(moduleReference);
				return ok({
					...shared,
					kind: "javascript",
					view,
					rows,
					source_coverage: sourceCoverage,
					coverage: pageViewCoverage(view.offset, rows.length, total)
				});
			}
			if (view.kind === "summary") {
				const moduleCount = analysis.graph.nodes.reduce((count, node) => count + Number(isModuleNode(node)), 0);
				return ok({
					kind: "summary",
					view,
					summary: {
						input_path: analysis.input_path,
						format: analysis.format,
						root_artifact_sha256: analysis.root_artifact_sha256,
						...analysis.source_selection === undefined ? {} : { source_selection: analysis.source_selection },
						statistics: jsonObjectSchema.parse(analysis.statistics),
						electron: jsonObjectSchema.parse(analysis.summary),
						coverage: jsonObjectSchema.parse({
							static_sources: javascriptStaticSourceCoverageSummary(analysis),
							application: analysis.graph.coverage,
							semantic: {
								...analysis.semantic_graph.coverage,
								families: analysis.semantic_graph.coverage.families.map(({ unknown_ids, ...family }) => ({
									...family,
									unknown_count: unknown_ids.length
								}))
							},
							application_unknowns: sourceCoverage.application_unknown_count,
							semantic_unknowns: sourceCoverage.semantic_unknown_count
						}),
						limitation_count: limitationCount
					},
					coverage: completeWithinViewCoverage(moduleCount, moduleCount),
					...shared
				});
			}
			if (view.kind === "item") {
				if (view.collection !== "modules") return err(jsIncompatible("Section and symbol collections apply to inspect_binary_layout Evidence."));
				const modules = [...moduleEntries(analysis.graph.nodes)];
				const selected = selectModule(modules, view.selector);
				if (!selected.ok) return selected;
				return ok({
					kind: "item",
					view,
					item: moduleItem(selected.value.node, selected.value.path),
					coverage: completeWithinViewCoverage(1, modules.length),
					...shared
				});
			}
			if (view.kind !== "page" || view.collection !== "modules") return err(jsIncompatible("Section and symbol collections apply to inspect_binary_layout Evidence."));
			const { entries, total } = modulePage(analysis.graph.nodes, view);
			const items = entries.map(({ node, path }) => ({
				node_id: node.node_id,
				kind: node.kind,
				path
			}));
			return ok({
				kind: "page",
				view,
				items,
				coverage: pageViewCoverage(view.offset, items.length, total),
				...shared
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisViewDataAdmission.js
var MEMBER_BYTES, CONTAINER_BYTES, textBytes$1, admitAnalysisViewData;
function init_analysisViewDataAdmission() {
	return (init_analysisViewDataAdmission = __esmMin((() => {
		init_analysisErrorCore();
		init_jsonValue();
		init_result();
		MEMBER_BYTES = 256;
		CONTAINER_BYTES = 512;
		textBytes$1 = (length) => 32 + length * 14;
		admitAnalysisViewData = (value, inline, reserve) => {
			const ancestors = new Set();
			const path = inline ? ["source", "evidence"] : ["source"];
			const invalid = () => err(new AnalysisInputError("inspect_analysis_view", undefined, [{
				path: [...path],
				reason: "invalid_value",
				message: "Parent data must contain bounded ordinary JSON data without cycles or accessors."
			}]));
			const visit = (item, depth) => {
				if (isProxy(item) || typeof item === "function") return invalid();
				if (depth > 1e3 + (inline ? 4 : 3) || typeof item === "object" && item !== null && ancestors.has(item)) return invalid();
				const member = reserve?.(MEMBER_BYTES + (inline && typeof item === "string" ? textBytes$1(item.length) : 0) + (typeof item === "object" && item !== null ? CONTAINER_BYTES : 0));
				if (member !== undefined && !member.ok) return member;
				if (typeof item !== "object" || item === null) return ok(undefined);
				ancestors.add(item);
				const child = (key) => {
					path.push(key);
					const descriptor = Object.getOwnPropertyDescriptor(item, key);
					const admitted = descriptor === undefined || !Object.hasOwn(descriptor, "value") ? invalid() : visit(descriptor.value, depth + 1);
					path.pop();
					return admitted;
				};
				if (Array.isArray(item)) {
					if (Object.getPrototypeOf(item) !== Array.prototype || Object.hasOwn(item, Symbol.iterator) || Object.hasOwn(item, "map") || Object.hasOwn(item, "constructor")) return invalid();
					for (let index = 0; index < item.length; index += 1) {
						const admitted = child(index);
						if (!admitted.ok) return admitted;
					}
				} else {
					const prototype = Object.getPrototypeOf(item);
					if (prototype !== Object.prototype && prototype !== null) return invalid();
					for (const key of Object.getOwnPropertyNames(item)) {
						const keyAdmission = inline ? reserve?.(textBytes$1(key.length)) : undefined;
						if (keyAdmission !== undefined && !keyAdmission.ok) return keyAdmission;
						const admitted = child(key);
						if (!admitted.ok) return admitted;
					}
				}
				ancestors.delete(item);
				return ok(undefined);
			};
			return visit(value, 0);
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/webNetworkRouteTemplates.js
var ROUTE_RULES, requestSchema$1, responseSchema, contentSchema$1, MEDIA_TYPE_ESSENCE, GROUP_BYTES, SEGMENT_BYTES, ENTRY_BYTES, RECORD_SCRATCH_BYTES, CAPTURE_CONTAINER_BYTES, SEGMENT_SCRATCH_BYTES, textBytes, mediaTypeEssence, routePartCount, segmentRule, scanRouteTemplate, readRecordedRequestLine, readQueryParameterNames;
function init_webNetworkRouteTemplates() {
	return (init_webNetworkRouteTemplates = __esmMin((() => {
		init_recordedTransportUrl();
		ROUTE_RULES = [
			"numeric",
			"uuid",
			"hex",
			"iso-date"
		];
		requestSchema$1 = z.object({ request: z.object({
			url: z.unknown(),
			method: z.unknown()
		}) });
		responseSchema = z.object({ response: z.object({
			status: z.unknown().optional(),
			content: z.unknown().optional()
		}) });
		contentSchema$1 = z.object({ mimeType: z.unknown().optional() });
		MEDIA_TYPE_ESSENCE = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+\/[A-Za-z0-9!#$%&'*+.^_`|~-]+$/u;
		GROUP_BYTES = 2048;
		SEGMENT_BYTES = 1024;
		ENTRY_BYTES = 128;
		RECORD_SCRATCH_BYTES = 512;
		CAPTURE_CONTAINER_BYTES = 512;
		SEGMENT_SCRATCH_BYTES = 512;
		textBytes = (length) => 32 + length * 14;
		mediaTypeEssence = (reported) => {
			const separator = reported.indexOf(";");
			let start = 0;
			let end = separator < 0 ? reported.length : separator;
			while (start < end && (reported[start] === " " || reported[start] === "	")) start += 1;
			while (end > start && (reported[end - 1] === " " || reported[end - 1] === "	")) end -= 1;
			const essence = reported.slice(start, end);
			return MEDIA_TYPE_ESSENCE.test(essence) ? essence.toLowerCase() : null;
		};
		routePartCount = (template) => {
			let count = 1;
			for (const character of template) if (character === "/") count += 1;
			return count;
		};
		segmentRule = (value) => {
			if (/^[0-9]+$/u.test(value)) return "numeric";
			if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)) return "uuid";
			if (/^[0-9a-f]{32,}$/iu.test(value)) return "hex";
			if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value)) {
				const date = new Date(`${value}T00:00:00.000Z`);
				if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) return "iso-date";
			}
			return null;
		};
		scanRouteTemplate = (path, temporary) => {
			const segments = [];
			const parts = [];
			const rules = [];
			let templateLength = path.length;
			let rulesLength = 0;
			let copied = 0;
			let index = 0;
			let start = 1;
			for (;;) {
				const slash = path.indexOf("/", start);
				const end = slash < 0 ? path.length : slash;
				const value = path.slice(start, end);
				const rule = segmentRule(value);
				if (rule !== null) {
					if (!temporary(SEGMENT_SCRATCH_BYTES)) return null;
					const placeholder = `{${rule}}`;
					const identity = `${index}:${rule};`;
					segments.push({
						segment_index: index,
						rule,
						value
					});
					parts.push(path.slice(copied, start), placeholder);
					rules.push(identity);
					templateLength += placeholder.length - value.length;
					rulesLength += identity.length;
					copied = end;
				}
				if (slash < 0) break;
				start = slash + 1;
				index += 1;
			}
			if (segments.length === 0) return {
				template: path,
				rules: "",
				segments
			};
			if (!temporary(textBytes(templateLength) + textBytes(rulesLength))) return null;
			parts.push(path.slice(copied));
			return {
				template: parts.join(""),
				rules: rules.join(""),
				segments
			};
		};
		readRecordedRequestLine = (reported, includeQuery, temporary) => {
			const excluded = (reason) => ({
				kind: "excluded",
				reason
			});
			const request = requestSchema$1.safeParse(reported);
			if (!request.success) return excluded("request-unavailable");
			const { url, method } = request.data.request;
			if (url === null) return excluded("url-redacted");
			if (typeof url !== "string") return excluded("url-unparseable");
			if (!temporary(512 + textBytes(url.length))) return null;
			const parsed = parseRecordedTransportUrl(url, { includeQuery });
			if (parsed.origin === null) return excluded("url-unparseable");
			if (typeof method !== "string" || method.length === 0) return excluded("method-unavailable");
			if (parsed.path === null) return excluded("url-unparseable");
			const response = responseSchema.safeParse(reported);
			const status = response.success ? response.data.response.status : undefined;
			const content = contentSchema$1.safeParse(response.success ? response.data.response.content : undefined);
			const mime = content.success ? content.data.mimeType : undefined;
			const rawMime = typeof mime === "string" ? mime : "";
			if (!temporary(textBytes(rawMime.length))) return null;
			return {
				kind: "line",
				method,
				origin: parsed.origin,
				path: parsed.path,
				query: parsed.query,
				status: typeof status === "number" && status !== 0 ? status : null,
				rawMime
			};
		};
		readQueryParameterNames = (query, temporary) => {
			if (query === undefined) return undefined;
			let pairs = query.length > 1 ? 1 : 0;
			for (const character of query) if (character === "&") pairs += 1;
			if (!temporary(512 + textBytes(query.length) + pairs * 128 * 4)) return null;
			return new Set(parseUrlQueryParameterNames(query));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/WebNetworkProjectionAccumulator.js
var WebNetworkProjectionAccumulator, admitHarCaptureParent;
function init_WebNetworkProjectionAccumulator() {
	return (init_WebNetworkProjectionAccumulator = __esmMin((() => {
		init_fixedAllowanceRemediation();
		init_analysisErrorCore();
		init_unicodeCodePointOrder();
		init_result();
		init_webNetworkCapture();
		init_analysisViewDataAdmission();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_webNetworkRouteTemplates();
		WebNetworkProjectionAccumulator = class {
			maximumBytes;
			budgetSubject;
			#limitations = new Set();
			#retainedBytes = 0;
			#temporaryBytes = 0;
			/** Per-record scratch reservation handed to the shared record readers. */
			scratch = (bytes) => this.temporary(bytes);
			constructor(maximumBytes, budgetSubject) {
				this.maximumBytes = maximumBytes;
				this.budgetSubject = budgetSubject;
			}
			retain(bytes) {
				if (this.#retainedBytes + this.#temporaryBytes + bytes > this.maximumBytes) return false;
				this.#retainedBytes += bytes;
				return true;
			}
			temporary(bytes) {
				if (this.#retainedBytes + this.#temporaryBytes + bytes > this.maximumBytes) return false;
				this.#temporaryBytes += bytes;
				return true;
			}
			/** Restore the enclosing synchronous parse's scratch after a nested body lease. */
			temporaryCheckpoint() {
				const held = this.#temporaryBytes;
				return () => {
					this.#temporaryBytes = held;
				};
			}
			/** Mark the retained bytes; the returned call releases what was retained since, once none of it is held. */
			retainedCheckpoint() {
				const mark = this.#retainedBytes;
				return () => {
					this.#retainedBytes = Math.min(this.#retainedBytes, mark);
				};
			}
			/** Per-record strings and descriptors never become cumulative scratch. */
			releaseTemporary() {
				this.#temporaryBytes = 0;
			}
			overBudget() {
				return err(new AnalysisResourceConstraintError("inspect_analysis_view", "memory", `${this.budgetSubject} retained state and temporary work exceed the projection representation budget.`, { output_bytes: this.maximumBytes }, fixedAllowanceOptions("The analysis-view projection allowance", "parser")));
			}
			/** Reserve schema output and validation scratch while the borrowed parent stays live. */
			admitCaptureClone(value) {
				return admitAnalysisViewData(value, false, (bytes) => this.retain(bytes) ? ok(undefined) : this.overBudget());
			}
			/** Reserve bytes a view derives from the borrowed parent before it allocates them. */
			admitDerivedBytes(bytes) {
				return this.retain(bytes) ? ok(undefined) : this.overBudget();
			}
			/** Admit the complete portable envelope before cloning or authenticating it. */
			admitInlineEvidence(value) {
				return admitAnalysisViewData(value, true, (bytes) => this.retain(bytes) ? ok(undefined) : this.overBudget());
			}
			addLimitations(limitations) {
				for (const limitation of limitations) {
					if (this.#limitations.has(limitation)) continue;
					if (!this.retain(128 + textBytes(limitation.length))) return this.overBudget();
					this.#limitations.add(limitation);
				}
				return ok(undefined);
			}
			sortedLimitations() {
				return [...this.#limitations].sort(compareUnicodeCodePoints);
			}
		};
		admitHarCaptureParent = (parent, viewKind, accumulator) => {
			const unsupported = (reason) => err(new AnalysisUnsupportedTargetError("inspect_analysis_view", parent.evidenceId, reason));
			if (parent.operation !== "inspect_web_network_capture") return unsupported(`View ${viewKind} is unsupported for parent operation ${parent.operation}; ${viewKind} requires ${viewKind === "api-surface" ? "inspect_web_network_capture" : "inspect_web_network_capture or capture_browser_scenario"}.`);
			const admitted = accumulator.admitCaptureClone(parent.normalizedResult);
			if (!admitted.ok) return admitted;
			const parsed = safeParseOwnedWebNetworkCapture(parent.normalizedResult);
			if (!parsed.success) return err(analysisViewResultInputError(parent.normalizedResult, parsed.error));
			if (parsed.data.format !== "har") return unsupported(`${viewKind} does not support capture format ${parsed.data.format}.`);
			const { artifact } = parsed.data;
			if (viewKind !== "api-surface" && artifact.sha256 !== null && (parent.subject == null || parent.subject.local_path !== artifact.path || parent.subject.digest.sha256 !== artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Capture parent subject must identify the report's exact path and SHA-256."
			}]));
			const declarations = z.object({ sensitive_value_count: z.number().int().nonnegative() }).safeParse(parent.parameters);
			if (!declarations.success || declarations.data.sensitive_value_count > 0) return unsupported("sensitive_values_unretained");
			return ok(parsed.data);
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/WebNetworkApiSurfaceAccumulator.js
var WebNetworkApiSurfaceAccumulator;
function init_WebNetworkApiSurfaceAccumulator() {
	return (init_WebNetworkApiSurfaceAccumulator = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_result();
		init_webNetworkCapture();
		init_analysisViewCoverage();
		init_WebNetworkProjectionAccumulator();
		init_webNetworkRouteTemplates();
		WebNetworkApiSurfaceAccumulator = class extends WebNetworkProjectionAccumulator {
			includeQueryParameterNames;
			#buckets = new Map();
			#groups = [];
			#excluded = [];
			#unavailableResponse = false;
			constructor(maximumBytes = WEB_NETWORK_CAPTURE_LIMITS.outputBytes, includeQueryParameterNames = false) {
				super(maximumBytes, "API-surface");
				this.includeQueryParameterNames = includeQueryParameterNames;
			}
			#exclude(ordinal, reason) {
				if (!this.retain(128 + 512)) return this.overBudget();
				this.#excluded.push({
					ordinal,
					reason
				});
				return ok(undefined);
			}
			add(record) {
				const limitations = this.addLimitations(record.limitations);
				if (!limitations.ok) return limitations;
				try {
					const line = readRecordedRequestLine(record.reported, this.includeQueryParameterNames, this.scratch);
					if (line === null) return this.overBudget();
					if (line.kind === "excluded") return this.#exclude(record.ordinal, line.reason);
					const route = scanRouteTemplate(line.path, this.scratch);
					if (route === null) return this.overBudget();
					const queryNames = readQueryParameterNames(line.query, this.scratch);
					if (queryNames === null) return this.overBudget();
					return this.#append(record.ordinal, line.method, line.origin, route, line.status, mediaTypeEssence(line.rawMime), queryNames);
				} finally {
					this.releaseTemporary();
				}
			}
			#append(ordinal, method, origin, route, status, mime, queryNames) {
				let group = this.#buckets.get(method)?.get(origin)?.get(route.template)?.get(route.rules);
				let bytes = 128;
				if (group === undefined) {
					bytes += GROUP_BYTES + textBytes(method.length) + textBytes(origin.length) + textBytes(route.template.length) + textBytes(route.rules.length);
					for (const segment of route.segments) bytes += SEGMENT_BYTES + 128 + textBytes(segment.value.length);
				} else {
					for (const [index, segment] of route.segments.entries()) {
						if (!group.segments[index].values.has(segment.value)) bytes += 128 + textBytes(segment.value.length);
					}
				}
				if (status !== null && !group?.statuses.has(status)) bytes += 128;
				if (mime !== null && !group?.contentTypes.has(mime)) bytes += 128 + textBytes(mime.length);
				if (queryNames !== undefined) {
					if (group === undefined) bytes += 512;
					for (const name of queryNames) {
						bytes += 128;
						if (!group?.queryNames?.has(name)) bytes += 128 + textBytes(name.length);
					}
				}
				if (!this.retain(bytes)) return this.overBudget();
				if (group === undefined) {
					group = {
						method,
						origin,
						path_template: route.template,
						segments: route.segments.map((segment) => ({
							segment_index: segment.segment_index,
							rule: segment.rule,
							values: new Set([segment.value])
						})),
						ordinals: [],
						statuses: new Set(),
						contentTypes: new Set(),
						...queryNames === undefined ? {} : { queryNames: new Map() }
					};
					const byOrigin = this.#buckets.get(method) ?? new Map();
					this.#buckets.set(method, byOrigin);
					const byTemplate = byOrigin.get(origin) ?? new Map();
					byOrigin.set(origin, byTemplate);
					const byRule = byTemplate.get(route.template) ?? new Map();
					byTemplate.set(route.template, byRule);
					byRule.set(route.rules, group);
					this.#groups.push(group);
				} else {
					for (const [index, segment] of route.segments.entries()) group.segments[index].values.add(segment.value);
				}
				group.ordinals.push(ordinal);
				if (status === null || mime === null) this.#unavailableResponse = true;
				if (status !== null) group.statuses.add(status);
				if (mime !== null) group.contentTypes.add(mime);
				if (queryNames !== undefined && group.queryNames !== undefined) {
					for (const name of queryNames) {
						const ordinals = group.queryNames.get(name);
						if (ordinals === undefined) group.queryNames.set(name, [ordinal]);
						else ordinals.push(ordinal);
					}
				}
				return ok(undefined);
			}
			page(offset, limit) {
				this.#groups.sort((a, b) => compareUnicodeCodePoints(a.origin, b.origin) || compareUnicodeCodePoints(a.path_template, b.path_template) || compareUnicodeCodePoints(a.method, b.method));
				const groups = this.#groups.slice(offset, offset + limit).map((group) => ({
					method: group.method,
					origin: group.origin,
					path_template: group.path_template,
					templated_segments: group.segments.map((segment) => ({
						segment_index: segment.segment_index,
						rule: segment.rule,
						basis: "inferred",
						observed_values: [...segment.values].sort(compareUnicodeCodePoints)
					})),
					record_ordinals: [...group.ordinals],
					statuses: [...group.statuses].sort((a, b) => a - b),
					content_types: [...group.contentTypes].sort(compareUnicodeCodePoints),
					...group.queryNames === undefined ? {} : { query_parameter_names: [...group.queryNames].sort(([a], [b]) => compareUnicodeCodePoints(a, b)).map(([name, record_ordinals]) => ({
						name,
						record_ordinals: [...record_ordinals]
					})) },
					flags: [
						...group.ordinals.length === 1 ? ["single-sample"] : [],
						...group.statuses.size > 1 ? ["mixed-statuses"] : [],
						...group.contentTypes.size > 1 ? ["mixed-content-types"] : []
					]
				}));
				return {
					coverage: pageViewCoverage(offset, groups.length, this.#groups.length),
					groups,
					templated_groups: this.#groups.reduce((count, group) => count + (group.segments.length > 0 ? 1 : 0), 0),
					excluded_records: [...this.#excluded],
					limitations: this.sortedLimitations(),
					unknowns: this.#unavailableResponse ? ["Some retained records have unavailable status or content type values."] : []
				};
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/webNetworkApiSurfaceView.js
var apiSurfaceViewSchema, ruleSchema, groupSchema, apiSurfaceFields, createApiSurfaceAccumulator, projectWebNetworkApiSurfaceView;
function init_webNetworkApiSurfaceView() {
	return (init_webNetworkApiSurfaceView = __esmMin((() => {
		init_analysisErrorCore();
		init_result();
		init_WebNetworkApiSurfaceAccumulator();
		init_WebNetworkProjectionAccumulator();
		init_webNetworkRouteTemplates();
		apiSurfaceViewSchema = z.strictObject({
			kind: z.literal("api-surface"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(50),
			include_query_parameter_names: z.boolean().optional().describe("Include distinct observed query parameter names and their original record ordinals; names do not establish required parameters or a complete API schema.")
		});
		ruleSchema = z.enum(ROUTE_RULES);
		groupSchema = z.strictObject({
			method: z.string(),
			origin: z.string(),
			path_template: z.string(),
			templated_segments: z.array(z.strictObject({
				segment_index: z.int().nonnegative(),
				rule: ruleSchema,
				basis: z.literal("inferred"),
				observed_values: z.array(z.string())
			})),
			record_ordinals: z.array(z.int().nonnegative()),
			statuses: z.array(z.number()),
			content_types: z.array(z.string()),
			query_parameter_names: z.array(z.strictObject({
				name: z.string(),
				record_ordinals: z.array(z.int().nonnegative())
			})).optional(),
			flags: z.array(z.enum([
				"single-sample",
				"mixed-statuses",
				"mixed-content-types"
			]))
		});
		apiSurfaceFields = {
			records: z.strictObject({
				examined: z.int().nonnegative(),
				total: z.int().nonnegative(),
				excluded: z.int().nonnegative()
			}),
			templated_groups: z.int().nonnegative().describe("Groups across every page that carry at least one templated segment."),
			groups: z.array(groupSchema),
			excluded_records: z.array(z.strictObject({
				ordinal: z.int().nonnegative(),
				reason: z.enum([
					"url-redacted",
					"url-unparseable",
					"request-unavailable",
					"method-unavailable"
				])
			}))
		};
		createApiSurfaceAccumulator = (view) => new WebNetworkApiSurfaceAccumulator(undefined, view.kind === "api-surface" && view.include_query_parameter_names === true);
		projectWebNetworkApiSurfaceView = (parent, view, accumulator = createApiSurfaceAccumulator(view)) => {
			if (view.kind !== "api-surface") return err(new AnalysisUnsupportedTargetError("inspect_analysis_view", parent.evidenceId, `View ${view.kind} is unsupported for parent operation ${parent.operation}; api-surface requires inspect_web_network_capture.`));
			const admitted = admitHarCaptureParent(parent, "api-surface", accumulator);
			if (!admitted.ok) return admitted;
			const capture = admitted.value;
			const limitations = accumulator.addLimitations([
				...parent.limitations,
				...capture.limitations,
				"Grouping does not establish handler identity, URL-space schemas or causality.",
				...view.include_query_parameter_names === true ? ["Observed query parameter names do not establish required parameters, value types or a complete API schema."] : [],
				...capture.records.length < capture.total_records ? ["Parent contains an ordinal subset; the surface covers only retained records."] : []
			]);
			if (!limitations.ok) return limitations;
			for (const record of capture.records) {
				const added = accumulator.add(record);
				if (!added.ok) return added;
			}
			const page = accumulator.page(view.offset, view.limit);
			return ok({
				kind: "api-surface",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_web_network_capture",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: capture.artifact.path,
					sha256: capture.artifact.sha256
				},
				records: {
					examined: capture.records.length,
					total: capture.total_records,
					excluded: page.excluded_records.length
				},
				...page
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisViewText.js
var viewError$1, analysisTextPage;
function init_analysisViewText() {
	return (init_analysisViewText = __esmMin((() => {
		init_analysisViewErrors();
		init_result();
		init_analysisViewCoverage();
		viewError$1 = (message) => analysisViewInputError([{
			path: ["view"],
			reason: "invalid_value",
			message
		}]);
		analysisTextPage = (body, offset, limit, label = "Pseudocode") => {
			const start = Math.min(offset, body.length);
			const high = (n) => n >= 55296 && n <= 56319;
			const low = (n) => n >= 56320 && n <= 57343;
			if (start > 0 && start < body.length && high(body.charCodeAt(start - 1)) && low(body.charCodeAt(start))) return err(viewError$1(`${label} offset splits a UTF-16 surrogate pair.`));
			let end = Math.min(start + limit, body.length);
			if (end > start && end < body.length && high(body.charCodeAt(end - 1)) && low(body.charCodeAt(end))) end--;
			if (end === start && start < body.length) return err(viewError$1(`Increase ${label.toLowerCase()} limit to include the next complete Unicode character.`));
			return ok({
				item: {
					text: body.slice(start, end),
					unit: "utf16-code-units"
				},
				coverage: pageViewCoverage(start, end - start, body.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/nativeFunctionView.js
var viewError, parentFields, nativeRows, facetAvailabilityKeys, facetAvailability, unavailableFacetUnknowns, optionalFacets, unrecordedFacetUnknowns, summarizeDossier, summaryView, projectNativeFunctionView;
function init_nativeFunctionView() {
	return (init_nativeFunctionView = __esmMin((() => {
		init_analysisViewErrors();
		init_analysisViewText();
		init_canonicalOrdering();
		init_jsonValue();
		init_result();
		init_analysisViewCoverage();
		viewError = (message) => analysisViewInputError([{
			path: ["view"],
			reason: "invalid_value",
			message
		}]);
		parentFields = (parent, dossier, artifact) => {
			const flow = dossier.native_value_flow;
			const api = dossier.native_api;
			const unknowns = [];
			if (flow === null) unknowns.push("native_value_flow was not recorded");
			else if (!flow.available) unknowns.push("native_value_flow unavailable: " + flow.reason);
			else if (flow.truncated) unknowns.push("native_value_flow is truncated; omitted observations remain unknown");
			if (api === null) unknowns.push("native_api was not recorded");
			else if (!api.available) unknowns.push("native_api unavailable: " + api.reason, ...api.residual_unknowns);
			return {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "analyze_function",
				parent_digest: parent.evidenceId.slice(3),
				procedure_address: dossier.procedure.address,
				artifact,
				limitations: uniqueSorted([
					...parent.limitations,
					...dossier.limitations,
					...flow?.limitations ?? [],
					...api?.available ? api.limitations : []
				]),
				unknowns: uniqueSorted(unknowns)
			};
		};
		nativeRows = (dossier, facet) => {
			const sourceFlow = dossier.native_value_flow;
			const flow = sourceFlow?.available ? sourceFlow : undefined;
			return {
				assembly: dossier.assembly,
				basic_blocks: dossier.basic_blocks,
				comments: dossier.comments,
				callers: dossier.callers,
				callees: dossier.callees,
				incoming_references: dossier.incoming_references,
				outgoing_references: dossier.outgoing_references,
				unresolved_calls: dossier.unresolved_calls,
				referenced_strings: dossier.referenced_strings,
				referenced_names: dossier.referenced_names,
				swift_string_literals: dossier.swift_string_literals,
				swift_string_literal_omissions: dossier.swift_string_literal_omissions,
				value_flow_operations: flow?.operations,
				value_flow_def_use: flow?.def_use,
				value_flow_effects: flow?.effects,
				value_flow_parameters: flow?.parameters,
				value_flow_parameter_uses: flow?.parameter_uses
			}[facet];
		};
		facetAvailabilityKeys = {
			incoming_references: "references",
			outgoing_references: "references",
			referenced_strings: "strings_names",
			referenced_names: "strings_names",
			basic_blocks: "cfg"
		};
		facetAvailability = (dossier, facet) => dossier.facet_availability?.[facetAvailabilityKeys[facet] ?? facet];
		unavailableFacetUnknowns = (dossier) => {
			const availability = dossier.facet_availability;
			if (availability === undefined) return [];
			return Object.entries(availability).flatMap(([facet, status]) => status.available ? [] : [`${facet} unavailable: ${status.reason}`]);
		};
		optionalFacets = [
			"unresolved_calls",
			"swift_string_literals",
			"swift_string_literal_omissions"
		];
		unrecordedFacetUnknowns = (dossier) => optionalFacets.flatMap((facet) => dossier[facet] === undefined ? [`${facet} not recorded`] : []);
		summarizeDossier = (dossier) => {
			const sourceFlow = dossier.native_value_flow;
			const flow = sourceFlow?.available ? sourceFlow : undefined;
			const count = (facet, rows) => facetAvailability(dossier, facet)?.available === false ? null : rows.length;
			const recorded = (rows) => rows === undefined ? null : rows.length;
			return {
				procedure: {
					name: dossier.procedure.name,
					address: dossier.procedure.address
				},
				pseudocode: {
					available: dossier.facet_availability?.pseudocode?.available ?? dossier.pseudocode.length > 0,
					code_units: dossier.pseudocode.length
				},
				value_flow: {
					available: flow !== undefined,
					truncated: flow?.truncated ?? false
				},
				facet_availability: dossier.facet_availability ?? null,
				counts: {
					assembly: count("assembly", dossier.assembly),
					basic_blocks: count("basic_blocks", dossier.basic_blocks),
					comments: count("comments", dossier.comments),
					callers: count("callers", dossier.callers),
					callees: count("callees", dossier.callees),
					incoming_references: count("incoming_references", dossier.incoming_references),
					outgoing_references: count("outgoing_references", dossier.outgoing_references),
					unresolved_calls: recorded(dossier.unresolved_calls),
					referenced_strings: count("referenced_strings", dossier.referenced_strings),
					referenced_names: count("referenced_names", dossier.referenced_names),
					swift_string_literals: recorded(dossier.swift_string_literals),
					swift_string_literal_omissions: recorded(dossier.swift_string_literal_omissions),
					value_flow_operations: flow?.operations.length ?? null,
					value_flow_def_use: flow?.def_use.length ?? null,
					value_flow_effects: flow?.effects.length ?? null,
					value_flow_parameters: flow?.parameters.length ?? null,
					value_flow_parameter_uses: flow?.parameter_uses.length ?? null
				},
				limitation_count: dossier.limitations.length
			};
		};
		summaryView = (view, dossier, common) => ({
			kind: "summary",
			view,
			summary: summarizeDossier(dossier),
			coverage: completeWithinViewCoverage(1, 1),
			...common,
			unknowns: uniqueSorted([
				...common.unknowns,
				...unavailableFacetUnknowns(dossier),
				...unrecordedFacetUnknowns(dossier)
			])
		});
		projectNativeFunctionView = (parent, dossier, view) => {
			if (view.kind !== "native" && view.kind !== "summary") return err(viewError("analyze_function Evidence requires a native or summary view."));
			const artifact = parent.artifact;
			if (!artifact) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Native function Evidence requires an artifact-bound subject."
			}]));
			const common = parentFields(parent, dossier, artifact);
			if (view.kind === "summary") return ok(summaryView(view, dossier, common));
			const availability = facetAvailability(dossier, view.facet);
			if (availability?.available === false) common.unknowns = uniqueSorted([...common.unknowns, availability.reason]);
			const singleton = (item) => ({
				kind: "native",
				view,
				item: jsonValueSchema.parse(item),
				coverage: completeWithinViewCoverage(1, 1),
				...common
			});
			if (availability?.available === false) return ok(singleton(availability));
			const flow = dossier.native_value_flow;
			if (view.facet === "procedure" || view.facet === "native_api" || view.facet === "value_flow_summary") {
				if (view.offset !== 0) return err(viewError("Singleton native facets require offset 0."));
				if (view.facet === "procedure") return ok(singleton(dossier.procedure));
				if (view.facet === "native_api") return ok(singleton(dossier.native_api ?? {
					available: false,
					reason: "not recorded"
				}));
				const status = flow === null ? {
					available: false,
					reason: "not recorded"
				} : !flow.available ? {
					available: false,
					reason: flow.reason
				} : {
					available: true,
					provenance: flow.provenance,
					truncated: flow.truncated,
					omitted_operations_lower_bound: flow.omitted_operations_lower_bound,
					known_omitted_inputs: flow.known_omitted_inputs,
					known_omitted_edges: flow.known_omitted_edges,
					operations: flow.operations.length,
					def_use: flow.def_use.length,
					effects: flow.effects.length,
					parameters: flow.parameters.length,
					parameter_uses: flow.parameter_uses.length
				};
				return ok(singleton(status));
			}
			if (view.facet === "pseudocode") {
				const page = analysisTextPage(dossier.pseudocode, view.offset, view.limit);
				return page.ok ? ok({
					kind: "native",
					view,
					...page.value,
					...common
				}) : page;
			}
			const rows = nativeRows(dossier, view.facet);
			if (rows === undefined) return ok(singleton({
				available: false,
				reason: view.facet.startsWith("value_flow_") && flow?.available === false ? flow.reason : "not recorded"
			}));
			const items = rows.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "native",
				view,
				item: jsonValueSchema.parse(items),
				coverage: pageViewCoverage(view.offset, items.length, rows.length),
				...common
			});
		};
	})))();
}

//#endregion
//#region dist/domain/evm/solidityMetadata.js
var solidityMetadataScalarSchema, solidityMetadataSchema;
function init_solidityMetadata() {
	return (init_solidityMetadata = __esmMin((() => {
		solidityMetadataScalarSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("text"),
				value: z.string().max(65535)
			}),
			z.strictObject({
				kind: z.literal("integer"),
				value: z.string().max(21).regex(/^-?(?:0|[1-9][0-9]*)$/)
			}),
			z.strictObject({
				kind: z.literal("bytes"),
				value: z.string().max(131070).regex(/^(?:[a-f0-9]{2})*$/)
			}),
			z.strictObject({
				kind: z.literal("boolean"),
				value: z.boolean()
			}),
			z.strictObject({ kind: z.literal("null") }),
			z.strictObject({
				kind: z.literal("uninterpreted"),
				container: z.enum(["array", "map"])
			})
		]);
		solidityMetadataSchema = z.strictObject({
			profile: z.literal("terminal-cbor-scalars-v1"),
			status: z.enum([
				"unavailable",
				"decoded",
				"partial",
				"not-decoded"
			]),
			bytecode_offset: z.int().nonnegative().nullable(),
			cbor_bytes: z.int().positive().max(65535).nullable(),
			entries: z.array(z.strictObject({
				key: solidityMetadataScalarSchema,
				value: solidityMetadataScalarSchema
			})).max(32767),
			compiler_version: z.strictObject({
				representation: z.enum(["release-bytes", "prerelease-text"]),
				value: z.string().min(1).max(65535)
			}).nullable(),
			diagnostic: z.string().max(512).nullable()
		}).superRefine((value, context) => {
			const unavailable = value.status === "unavailable";
			if (unavailable ? value.bytecode_offset !== null || value.cbor_bytes !== null : value.bytecode_offset === null || value.cbor_bytes === null) context.addIssue({
				code: "custom",
				message: "Only unavailable metadata omits the candidate range."
			});
			const unexamined = unavailable || value.status === "not-decoded";
			if (unexamined && (value.entries.length !== 0 || value.compiler_version !== null)) context.addIssue({
				code: "custom",
				message: "Unavailable interpretation cannot report decoded entries or compiler identity."
			});
			const uninterpreted = value.entries.some(({ key, value: entryValue }) => key.kind === "uninterpreted" || entryValue.kind === "uninterpreted");
			if (value.status === "decoded" && uninterpreted || value.status === "partial" && !uninterpreted) context.addIssue({
				code: "custom",
				message: "Scalar coverage must preserve uninterpreted containers."
			});
		});
	})))();
}

//#endregion
//#region dist/domain/evm/evmInterface.js
var byteOffset, sha256, DEFAULT_EVM_TIMEOUT_MS, MAX_EVM_TIMEOUT_MS, inspectEvmInterfaceInputSchema, evmInterfaceSchema;
function init_evmInterface() {
	return (init_evmInterface = __esmMin((() => {
		init_localPath();
		init_solidityMetadata();
		byteOffset = z.int().nonnegative();
		sha256 = z.string().regex(/^[a-f0-9]{64}$/);
		DEFAULT_EVM_TIMEOUT_MS = 3e4;
		MAX_EVM_TIMEOUT_MS = 2147483647;
		inspectEvmInterfaceInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute path to caller-selected local bytecode carrier"),
			encoding: z.enum(["raw", "hex"]).describe("Raw bytes or UTF-8 hex with optional 0x prefix and outer ASCII whitespace"),
			timeout_ms: z.number().int().min(1).max(MAX_EVM_TIMEOUT_MS).optional().describe(`Deadline in milliseconds for the owned EVMole worker command (default ${String(DEFAULT_EVM_TIMEOUT_MS)}), not carrier acquisition or final reply reads. An integer from 1 to ${String(MAX_EVM_TIMEOUT_MS)} applies on the next call. Fixed input, reply, diagnostic, address-space, and CPU allowances stay unchanged.`)
		});
		evmInterfaceSchema = z.strictObject({
			artifact: z.strictObject({
				path: z.string().min(1),
				sha256,
				bytes: byteOffset,
				encoding: z.enum(["raw", "hex"])
			}),
			bytecode: z.strictObject({
				sha256,
				bytes: byteOffset,
				hex: z.string().regex(/^(?:[0-9a-f]{2})*$/),
				digest_algorithm: z.literal("sha256"),
				kind: z.literal("unknown"),
				deployment_authenticity: z.literal("unknown"),
				hardfork: z.literal("unknown"),
				metadata: solidityMetadataSchema.nullable().default(null)
			}),
			evidence_kind: z.literal("inferred"),
			functions: z.array(z.strictObject({
				selector: z.string().regex(/^0x[0-9a-f]{8}$/),
				bytecode_offset: byteOffset,
				dispatch: z.enum(["abi", "fallback"]),
				inferred_arguments: z.string().nullable(),
				inferred_state_mutability: z.string().nullable()
			})),
			discovery_completeness: z.literal("unknown"),
			runtime_execution: z.literal("not-performed"),
			diagnostics: z.strictObject({
				stdout: z.string(),
				stderr: z.string(),
				truncated: z.boolean()
			}),
			limitations: z.array(z.string())
		}).superRefine((value, context) => {
			if (value.bytecode.hex.length !== value.bytecode.bytes * 2) context.addIssue({
				code: "custom",
				path: ["bytecode"],
				message: "Selected byte count does not match the bytecode hex representation."
			});
			const metadata = value.bytecode.metadata;
			if (metadata !== null && metadata.status !== "unavailable" && (metadata.bytecode_offset === null || metadata.cbor_bytes === null || metadata.bytecode_offset + metadata.cbor_bytes + 2 !== value.bytecode.bytes || metadata.cbor_bytes !== Number.parseInt(value.bytecode.hex.slice(-4), 16))) context.addIssue({
				code: "custom",
				path: ["bytecode", "metadata"],
				message: "Metadata range must match the terminal length suffix in selected bytecode."
			});
			for (const [index, fn] of value.functions.entries()) if (fn.bytecode_offset >= value.bytecode.bytes) context.addIssue({
				code: "custom",
				path: [
					"functions",
					index,
					"bytecode_offset"
				],
				message: "Inferred body offset lies outside the selected bytecode."
			});
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/evmInterfaceView.js
var evmViewRequestSchema, evmViewItemSchema, evmSummarySchema, projectEvmInterfaceView;
function init_evmInterfaceView() {
	return (init_evmInterfaceView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_evmInterface();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_analysisViewText();
		evmViewRequestSchema = z.strictObject({
			kind: z.literal("evm"),
			facet: z.enum([
				"functions",
				"bytecode_hex",
				"stdout",
				"stderr"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		evmViewItemSchema = z.union([evmInterfaceSchema.shape.functions, z.strictObject({
			text: z.string(),
			unit: z.literal("utf16-code-units")
		})]);
		evmSummarySchema = z.strictObject({
			artifact: evmInterfaceSchema.shape.artifact,
			bytecode: evmInterfaceSchema.shape.bytecode.omit({ hex: true }),
			evidence_kind: evmInterfaceSchema.shape.evidence_kind,
			functions: evmInterfaceSchema.shape.functions,
			discovery_completeness: evmInterfaceSchema.shape.discovery_completeness,
			runtime_execution: evmInterfaceSchema.shape.runtime_execution,
			diagnostics: evmInterfaceSchema.shape.diagnostics.omit({ stdout: true }).extend({ stdout_code_units: z.int().nonnegative() }),
			limitations: evmInterfaceSchema.shape.limitations
		});
		projectEvmInterfaceView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "evm") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "EVM Evidence supports summary and evm views."
			}]));
			const parsed = parseAnalysisViewResult(evmInterfaceSchema, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (parent.subject == null || parent.subject.format !== "file" || parent.subject.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "EVM parent subject must identify the report's exact carrier path and SHA-256."
			}]));
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_evm_interface",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: uniqueSorted([...parent.limitations, ...report.limitations]),
				unknowns: ["Candidates remain inferred; discovery completeness, bytecode kind, hardfork and deployment authenticity are unknown. Runtime execution was not performed."]
			};
			if (view.kind === "summary") {
				const { hex: _hex, ...bytecode } = report.bytecode;
				const { stdout, ...diagnostics } = report.diagnostics;
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						artifact: report.artifact,
						bytecode,
						evidence_kind: report.evidence_kind,
						functions: report.functions,
						discovery_completeness: report.discovery_completeness,
						runtime_execution: report.runtime_execution,
						diagnostics: {
							...diagnostics,
							stdout_code_units: stdout.length
						},
						limitations: report.limitations
					},
					coverage: completeWithinViewCoverage(report.functions.length, report.functions.length)
				});
			}
			if (view.facet === "functions") {
				const item = report.functions.slice(view.offset, view.offset + view.limit);
				return ok({
					kind: "evm",
					view,
					item,
					...shared,
					coverage: pageViewCoverage(view.offset, item.length, report.functions.length)
				});
			}
			const text = view.facet === "bytecode_hex" ? report.bytecode.hex : report.diagnostics[view.facet];
			const page = analysisTextPage(text, view.offset, view.limit, view.facet);
			return page.ok ? ok({
				kind: "evm",
				view,
				...page.value,
				...shared
			}) : page;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/artifactInventoryView.js
var page$2, artifactInventoryViewRequestSchema, artifactInventoryItemsSchema, artifactInventorySummarySchema, inputError, checkedSources, parseSource, parseSourceUncached, sourceFailure, projectArtifactInventoryView, occurrencePage, nodePage, inventoryCounts, occurrenceIndices, nodeIndices, selectFields$1, selectOccurrenceFields;
function init_artifactInventoryView() {
	return (init_artifactInventoryView = __esmMin((() => {
		init_artifactGraph();
		init_artifactInspection();
		init_artifactFormatMetadata();
		init_digests();
		init_immutableJson();
		init_analysisErrorCore();
		init_canonicalOrdering();
		init_result();
		init_artifactInventoryEvidence();
		init_analysisViewCoverage();
		init_analysisViewParent();
		page$2 = {
			kind: z.literal("inventory"),
			offset: z.number().int().nonnegative().default(0),
			limit: z.number().int().positive().default(64)
		};
		artifactInventoryViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...page$2,
				collection: z.literal("occurrences"),
				occurrence_ids: z.array(prefixedDigestSchema("occ")).optional(),
				logical_paths: z.array(z.string()).optional(),
				entry_kinds: z.array(artifactOccurrenceSchema.shape.entry_kind).optional(),
				fields: z.array(artifactOccurrenceSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$2,
				collection: z.literal("nodes"),
				artifact_ids: z.array(prefixedDigestSchema("art")).optional(),
				fields: z.array(artifactNodeSchema.keyof()).optional()
			}),
			z.strictObject({
				...page$2,
				collection: z.enum(["edges", "integrity_contradictions"])
			})
		]);
		artifactInventoryItemsSchema = z.array(z.union([
			artifactNodeSchema.partial().required({ artifact_id: true }).strict(),
			artifactOccurrenceSchema.partial().required({
				occurrence_id: true,
				artifact_id: true,
				parent_occurrence_id: true
			}).strict(),
			artifactEdgeSchema,
			integrityContradictionSchema
		]));
		artifactInventorySummarySchema = z.strictObject({
			source_coverage: artifactInventoryCoverageSchema.exactOptional(),
			available_hash_status_counts: z.strictObject({
				verified: z.number().int().nonnegative(),
				mismatched: z.number().int().nonnegative(),
				unavailable: z.number().int().nonnegative(),
				"not-hashed": z.number().int().nonnegative()
			}).exactOptional(),
			manifest: artifactGraphManifestSchema,
			root_format_metadata: artifactFormatMetadataSchema.exactOptional(),
			available_counts: z.strictObject({
				nodes: z.number().int().nonnegative(),
				occurrences: z.number().int().nonnegative(),
				edges: z.number().int().nonnegative(),
				integrity_contradictions: z.number().int().nonnegative()
			}),
			observed_entry_kind_counts: z.strictObject({
				file: z.number().int().nonnegative(),
				directory: z.number().int().nonnegative(),
				symlink: z.number().int().nonnegative(),
				slice: z.number().int().nonnegative(),
				metadata: z.number().int().nonnegative().exactOptional()
			}),
			source_complete: z.boolean(),
			inventory_evidence_ids: z.array(prefixedDigestSchema("ev")).min(1),
			inspection: z.strictObject({
				coverage: artifactInspectionResultSchema.shape.coverage,
				unexplored_branches: artifactInspectionResultSchema.shape.unexplored_branches
			}).nullable(),
			limitation_count: z.number().int().nonnegative()
		});
		inputError = (field, message) => new AnalysisInputError("inspect_analysis_view", undefined, [{
			path: [field],
			reason: "invalid_value",
			message
		}]);
		checkedSources = new WeakMap();
		parseSource = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && typeof key === "object" && key !== null && isImmutableJsonSnapshot(key);
			const cached = reusable ? checkedSources.get(key) : undefined;
			if (cached !== undefined && cached.operation === parent.operation) {
				try {
					validateArtifactInventorySubject(parent.subject ?? null, cached.source.inventory.manifest);
				} catch (cause) {
					return sourceFailure(parent.normalizedResult, cause);
				}
				return ok(cached.source);
			}
			const parsed = parseSourceUncached(parent);
			if (parsed.ok && reusable) checkedSources.set(key, {
				operation: parent.operation,
				source: parsed.value
			});
			return parsed;
		};
		parseSourceUncached = (parent) => {
			try {
				if (parent.operation === "inventory_artifact") return ok({
					inventory: parseArtifactInventoryResult(parent.normalizedResult, parent.subject ?? null),
					evidenceIds: [],
					inspection: null
				});
				const parsed = parseArtifactInspectionInventoryResult(parent.normalizedResult, parent.subject ?? null);
				return ok({
					inventory: parsed.inventory,
					evidenceIds: parsed.evidenceIds,
					inspection: parsed.inspection
				});
			} catch (cause) {
				return sourceFailure(parent.normalizedResult, cause);
			}
		};
		sourceFailure = (input, cause) => {
			if (cause instanceof z.ZodError) return err(analysisViewResultInputError(input, cause));
			if (!(cause instanceof ArtifactInventoryValidationError)) throw cause;
			return err(inputError("source", cause.message));
		};
		projectArtifactInventoryView = (parent, view) => {
			const operation = parent.operation;
			if (operation !== "inventory_artifact" && operation !== "inspect_artifact") return err(inputError("source", "Inventory views require inventory_artifact or inspect_artifact Evidence."));
			if (view.kind !== "summary" && view.kind !== "inventory") return err(inputError("view", "Artifact Evidence supports summary and inventory views."));
			const parsed = parseSource(parent);
			if (!parsed.ok) return parsed;
			const source = parsed.value;
			const { inventory, inspection } = source;
			const evidenceIds = inspection === null ? [parent.evidenceId] : source.evidenceIds;
			if (source.rootMetadata === undefined) source.rootMetadata = inventory.occurrences.find((row) => row.logical_path === ".")?.format_metadata ?? null;
			const rootMetadata = source.rootMetadata;
			const sourceCoverage = { source_coverage: inventory.coverage };
			const includeHashCounts = view.kind === "inventory" || inventory.manifest.root_format === "godot-pck" || inventory.manifest.root_format === "pyinstaller" || inventory.manifest.root_format === "node-sea";
			const counts = inventoryCounts(source);
			const limitations = uniqueSorted([
				...parent.limitations,
				...inventory.limitations,
				...inspection?.limitations ?? []
			]);
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: operation,
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: parent.artifact?.path ?? "",
					sha256: inventory.manifest.root_sha256
				},
				limitations,
				unknowns: [
					"Inventory does not establish application runtime behavior or complete format-specific analysis.",
					...inventory.coverage.status === "unknown" ? ["Producer traversal coverage is unknown; missing matches do not prove source absence."] : [],
					...counts.hashes.unavailable > 0 || counts.hashes["not-hashed"] > 0 ? ["Content hashes are unknown for some recorded files; missing node IDs do not prove content absence."] : [],
					...inventory.complete ? [] : ["Parent inventory is partial; counts and exhausted pages cover only available records. Missing matches do not establish absence."]
				]
			};
			if (view.kind === "summary") {
				const examined = inventory.nodes.length + inventory.occurrences.length + inventory.edges.length;
				return ok({
					kind: "summary",
					view,
					summary: {
						manifest: inventory.manifest,
						available_counts: {
							nodes: inventory.nodes.length,
							occurrences: inventory.occurrences.length,
							edges: inventory.edges.length,
							integrity_contradictions: inventory.integrityContradictions.length
						},
						observed_entry_kind_counts: {
							file: counts.kinds.file,
							directory: counts.kinds.directory,
							symlink: counts.kinds.symlink,
							slice: counts.kinds.slice,
							...counts.kinds.metadata === 0 ? {} : { metadata: counts.kinds.metadata }
						},
						...includeHashCounts ? { available_hash_status_counts: counts.hashes } : {},
						source_complete: inventory.complete,
						...sourceCoverage,
						inventory_evidence_ids: [...evidenceIds],
						...rootMetadata === null ? {} : { root_format_metadata: rootMetadata },
						inspection: inspection === null ? null : {
							coverage: inspection.coverage,
							unexplored_branches: inspection.unexplored_branches
						},
						limitation_count: limitations.length
					},
					coverage: completeWithinViewCoverage(examined, examined),
					...shared
				});
			}
			const selected = view.collection === "occurrences" ? occurrencePage(source, view) : view.collection === "nodes" ? nodePage(source, view) : {
				items: (view.collection === "edges" ? inventory.edges : inventory.integrityContradictions).slice(view.offset, view.offset + view.limit),
				total: view.collection === "edges" ? inventory.edges.length : inventory.integrityContradictions.length
			};
			return ok({
				kind: "inventory",
				view,
				manifest: inventory.manifest,
				inventory_evidence_ids: [...evidenceIds],
				source_complete: inventory.complete,
				...sourceCoverage,
				items: selected.items,
				coverage: pageViewCoverage(view.offset, selected.items.length, selected.total),
				...shared
			});
		};
		occurrencePage = (source, view) => {
			const indices = occurrenceIndices(source, view);
			const rows = source.inventory.occurrences;
			const total = indices?.length ?? rows.length;
			const items = [];
			for (let at = view.offset; at < Math.min(total, view.offset + view.limit); at++) items.push(selectOccurrenceFields(rows[indices?.[at] ?? at], view.fields));
			return {
				items,
				total
			};
		};
		nodePage = (source, view) => {
			const indices = nodeIndices(source, view.artifact_ids);
			const rows = source.inventory.nodes;
			const total = indices?.length ?? rows.length;
			const items = [];
			for (let at = view.offset; at < Math.min(total, view.offset + view.limit); at++) {
				const row = rows[indices?.[at] ?? at];
				items.push(view.fields === undefined ? row : {
					...selectFields$1(row, view.fields),
					artifact_id: row.artifact_id
				});
			}
			return {
				items,
				total
			};
		};
		inventoryCounts = (source) => {
			if (source.counts !== undefined) return source.counts;
			const kinds = {
				file: 0,
				directory: 0,
				symlink: 0,
				slice: 0,
				metadata: 0
			};
			const hashes = {
				verified: 0,
				mismatched: 0,
				unavailable: 0,
				"not-hashed": 0
			};
			for (const occurrence of source.inventory.occurrences) {
				kinds[occurrence.entry_kind]++;
				if (occurrence.entry_kind === "file" || occurrence.entry_kind === "slice") hashes[occurrence.hash_status]++;
			}
			source.counts = Object.freeze({
				kinds: Object.freeze(kinds),
				hashes: Object.freeze(hashes)
			});
			return source.counts;
		};
		occurrenceIndices = (source, view) => {
			if (view.occurrence_ids === undefined && view.logical_paths === undefined && view.entry_kinds === undefined) return undefined;
			if (view.occurrence_ids?.length === 0 || view.logical_paths?.length === 0 || view.entry_kinds?.length === 0) return [];
			if (source.index === undefined) {
				const byId = new Map();
				const byPath = new Map();
				const byKind = new Map();
				for (const [index, row] of source.inventory.occurrences.entries()) {
					byId.set(row.occurrence_id, index);
					const existing = byPath.get(row.logical_path);
					if (existing === undefined) byPath.set(row.logical_path, [index]);
					else existing.push(index);
					const kind = byKind.get(row.entry_kind);
					if (kind === undefined) byKind.set(row.entry_kind, [index]);
					else kind.push(index);
				}
				source.index = {
					byId,
					byPath,
					byKind
				};
			}
			const lookup = source.index;
			const paths = view.logical_paths === undefined ? undefined : new Set(view.logical_paths);
			const selected = view.occurrence_ids === undefined ? paths === undefined ? [...new Set(view.entry_kinds)].flatMap((kind) => lookup.byKind.get(kind) ?? []) : [...paths].flatMap((path) => lookup.byPath.get(path) ?? []) : [...new Set(view.occurrence_ids)].flatMap((id) => {
				const index = lookup.byId.get(id);
				return index === undefined || paths !== undefined && !paths.has(source.inventory.occurrences[index].logical_path) ? [] : [index];
			});
			const kinds = view.entry_kinds === undefined ? undefined : new Set(view.entry_kinds);
			return selected.filter((index) => kinds === undefined || kinds.has(source.inventory.occurrences[index].entry_kind)).sort((left, right) => left - right);
		};
		nodeIndices = (source, ids) => {
			if (ids === undefined) return undefined;
			if (ids.length === 0) return [];
			const byId = source.nodeIndex ??= new Map(source.inventory.nodes.map((row, index) => [row.artifact_id, index]));
			return [...new Set(ids)].flatMap((id) => {
				const index = byId.get(id);
				return index === undefined ? [] : [index];
			}).sort((left, right) => left - right);
		};
		selectFields$1 = (row, fields) => {
			if (fields === undefined) return row;
			const selected = {};
			for (const field of fields) {
				const value = row[field];
				if (value !== undefined) selected[field] = value;
			}
			return selected;
		};
		selectOccurrenceFields = (row, fields) => fields === undefined ? row : {
			...selectFields$1(row, fields),
			occurrence_id: row.occurrence_id,
			artifact_id: row.artifact_id,
			parent_occurrence_id: row.parent_occurrence_id
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/managedArtifactView.js
var managedViewRequestSchema, managedViewItemSchema, managedSummarySchema, managedViewContextSchema, managedViewIdentityUnknowns, projectManagedArtifactView;
function init_managedArtifactView() {
	return (init_managedArtifactView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_managedArtifact();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		managedViewRequestSchema = z.strictObject({
			kind: z.literal("managed"),
			collection: z.enum([
				"references",
				"resources",
				"attributes"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		managedViewItemSchema = z.union([
			managedArtifactInspectionSchema.shape.references,
			managedArtifactInspectionSchema.shape.resources,
			managedArtifactInspectionSchema.shape.attributes
		]);
		managedSummarySchema = managedArtifactInspectionSchema.omit({
			references: true,
			resources: true,
			attributes: true
		}).extend({
			reported_counts: z.strictObject({
				references: z.int().nonnegative(),
				resources: z.int().nonnegative(),
				attributes: z.int().nonnegative()
			}),
			identity_scope: managedMemberInspectionSchema.shape.identity_scope
		});
		managedViewContextSchema = z.strictObject({
			identity_scope: managedMemberInspectionSchema.shape.identity_scope,
			source_metadata_status: managedArtifactInspectionSchema.shape.metadata.shape.status,
			source_coverage: managedArtifactInspectionSchema.shape.coverage
		});
		managedViewIdentityUnknowns = (parent, mvid) => [
			"Metadata tokens are build-local coordinates bound to the recorded artifact SHA-256 and module MVID; this view does not load or execute the assembly.",
			...parent.subject == null ? ["The parent has no recorded subject; its normalized artifact identity cannot be cross-checked against a subject digest."] : [],
			...mvid === null ? ["The module MVID is unknown; tokens cannot establish a cross-observation module match."] : []
		];
		projectManagedArtifactView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "managed") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Managed artifact inspection supports summary and managed views."
			}]));
			const parsed = parseAnalysisViewResult(managedArtifactInspectionSchema, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const identity_scope = {
				token_identity: "build-local",
				requires_artifact_sha256: report.artifact.sha256,
				requires_mvid: report.module?.mvid ?? null
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_managed_artifact",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: uniqueSorted([...parent.limitations, ...report.limitations]),
				unknowns: ["Collection counts and pages cover producer-returned rows; metadata completeness remains the original metadata status and coverage, not an absence claim about unreturned rows.", ...managedViewIdentityUnknowns(parent, identity_scope.requires_mvid)]
			};
			if (view.kind === "summary") {
				const { references, resources, attributes, ...summary } = report;
				const reported_counts = {
					references: references.length,
					resources: resources.length,
					attributes: attributes.length
				};
				const total = references.length + resources.length + attributes.length;
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						...summary,
						reported_counts,
						identity_scope
					},
					coverage: completeWithinViewCoverage(total, total)
				});
			}
			const collection = report[view.collection];
			const item = collection.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "managed",
				view,
				item,
				...shared,
				identity_scope,
				source_metadata_status: report.metadata.status,
				source_coverage: report.coverage,
				coverage: pageViewCoverage(view.offset, item.length, collection.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/managedMemberView.js
var member$1, managedMembersViewRequestSchema, rowsOf, managedMembersViewPageSchema, nullableCount, managedMemberSummarySchema, managedMembersViewContextSchema, slice, collectionPage, validatedReports, parseMemberReport, summarizeMembers, projectManagedMemberView;
function init_managedMemberView() {
	return (init_managedMemberView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_managedArtifact();
		init_result();
		init_analysisViewCoverage();
		init_managedArtifactView();
		init_analysisViewParent();
		member$1 = managedMemberInspectionSchema.shape;
		managedMembersViewRequestSchema = z.strictObject({
			kind: z.literal("managed-members"),
			collection: z.enum([
				"types",
				"exported_types",
				"fields",
				"methods",
				"member_refs",
				"call_edges",
				"field_accesses",
				"user_strings"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		rowsOf = (collection, rows) => z.strictObject({
			collection: z.literal(collection),
			rows
		});
		managedMembersViewPageSchema = z.discriminatedUnion("collection", [
			rowsOf("types", member$1.types),
			rowsOf("exported_types", member$1.exported_types.unwrap().unwrap()),
			rowsOf("fields", member$1.fields),
			rowsOf("methods", member$1.methods),
			rowsOf("member_refs", member$1.member_refs),
			rowsOf("call_edges", member$1.call_edges),
			rowsOf("field_accesses", member$1.field_accesses),
			rowsOf("user_strings", member$1.user_strings.unwrap().unwrap().shape.literals)
		]);
		nullableCount = z.int().nonnegative().nullable();
		managedMemberSummarySchema = z.strictObject({
			signature_resolution: member$1.signature_resolution,
			nesting_read: member$1.nesting_read,
			artifact: member$1.artifact,
			module: member$1.module,
			assembly: member$1.assembly,
			metadata: member$1.metadata,
			identity_scope: member$1.identity_scope,
			selection: member$1.selection.unwrap(),
			method_rows: member$1.method_rows,
			coverage: member$1.coverage,
			user_strings: z.strictObject({
				state: member$1.user_strings.unwrap().unwrap().shape.state,
				issues: member$1.user_strings.unwrap().unwrap().shape.issues
			}).nullable(),
			limitations: member$1.limitations,
			reported_counts: z.strictObject({
				types: z.int().nonnegative(),
				exported_types: nullableCount,
				fields: z.int().nonnegative(),
				methods: z.int().nonnegative(),
				member_refs: z.int().nonnegative(),
				call_edges: z.int().nonnegative(),
				field_accesses: z.int().nonnegative(),
				user_strings: nullableCount
			})
		});
		managedMembersViewContextSchema = z.strictObject({
			signature_resolution: member$1.signature_resolution,
			nesting_read: member$1.nesting_read,
			identity_scope: member$1.identity_scope,
			selection: member$1.selection.unwrap(),
			method_rows: member$1.method_rows,
			source_metadata_status: member$1.metadata.shape.status,
			source_coverage: member$1.coverage
		});
		slice = (collection, rows, { offset, limit }) => rows == null ? null : {
			page: {
				collection,
				rows: rows.slice(offset, offset + limit)
			},
			total: rows.length
		};
		collectionPage = (report, view) => {
			const { collection } = view;
			switch (collection) {
				case "types": return slice(collection, report.types, view);
				case "exported_types": return slice(collection, report.exported_types, view);
				case "fields": return slice(collection, report.fields, view);
				case "methods": return slice(collection, report.methods, view);
				case "member_refs": return slice(collection, report.member_refs, view);
				case "call_edges": return slice(collection, report.call_edges, view);
				case "field_accesses": return slice(collection, report.field_accesses, view);
				case "user_strings": return slice(collection, report.user_strings?.literals, view);
			}
		};
		validatedReports = new WeakMap();
		parseMemberReport = (parent) => {
			const { normalizedResult } = parent;
			const sealed = parent.sealedResult === true && typeof normalizedResult === "object" && normalizedResult !== null;
			const cached = sealed ? validatedReports.get(normalizedResult)?.deref() : undefined;
			if (cached !== undefined) return ok(cached);
			const parsed = parseAnalysisViewResult(managedMemberInspectionSchema, parent);
			if (parsed.ok && sealed) validatedReports.set(normalizedResult, new WeakRef(parsed.value));
			return parsed;
		};
		summarizeMembers = (report) => {
			const { types, exported_types, fields, methods, member_refs, call_edges, field_accesses, user_strings, ...identity } = report;
			return {
				...identity,
				user_strings: user_strings === null ? null : {
					state: user_strings.state,
					issues: user_strings.issues
				},
				reported_counts: {
					types: types.length,
					exported_types: exported_types?.length ?? null,
					fields: fields.length,
					methods: methods.length,
					member_refs: member_refs.length,
					call_edges: call_edges.length,
					field_accesses: field_accesses.length,
					user_strings: user_strings?.literals.length ?? null
				}
			};
		};
		projectManagedMemberView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "managed-members") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Managed member inspection supports summary and managed-members views."
			}]));
			const parsed = parseMemberReport(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_managed_members",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: uniqueSorted([...parent.limitations, ...report.limitations]),
				unknowns: [
					"Collection counts and pages cover producer-returned rows; member completeness remains the original coverage, not an absence claim about unreturned rows.",
					...report.selection === null ? [] : ["Exported types and member references cover the whole assembly; the other collections cover only the selected declaring types."],
					...managedViewIdentityUnknowns(parent, report.identity_scope.requires_mvid)
				]
			};
			if (view.kind === "summary") {
				const summary = summarizeMembers(report);
				const total = Object.values(summary.reported_counts).reduce((sum, count) => sum + (count ?? 0), 0);
				return ok({
					kind: "summary",
					view,
					...shared,
					summary,
					coverage: completeWithinViewCoverage(total, total)
				});
			}
			const selected = collectionPage(report, view);
			if (selected === null) return err(analysisViewInputError([{
				path: ["view", "collection"],
				reason: "invalid_value",
				message: `The parent Evidence did not examine ${view.collection}; repeat inspect_managed_members with the current runtime to record it.`
			}]));
			const { page, total } = selected;
			return ok({
				kind: "managed-members",
				view,
				page,
				...shared,
				signature_resolution: report.signature_resolution,
				nesting_read: report.nesting_read,
				identity_scope: report.identity_scope,
				selection: report.selection,
				method_rows: report.method_rows,
				source_metadata_status: report.metadata.status,
				source_coverage: view.collection === "user_strings" && report.user_strings !== null ? {
					state: report.user_strings.state,
					issues: report.user_strings.issues
				} : report.coverage,
				coverage: pageViewCoverage(view.offset, page.rows.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/wasmArtifactView.js
var wasmViewRequestSchema, wasmViewItemSchema, wasmSummarySchema, projectWasmArtifactView;
function init_wasmArtifactView() {
	return (init_wasmArtifactView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_result();
		init_analysisViewParent();
		init_wasmArtifact();
		init_analysisViewCoverage();
		init_analysisViewText();
		wasmViewRequestSchema = z.strictObject({
			kind: z.literal("wasm"),
			facet: z.enum([
				"sections",
				"imports",
				"exports",
				"candidates",
				"glue",
				"wat",
				"headers",
				"details",
				"tool_profile"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		wasmViewItemSchema = z.union([
			wasmArtifactSchema.shape.sections,
			wasmArtifactSchema.shape.imports,
			wasmArtifactSchema.shape.candidates,
			wasmArtifactSchema.shape.glue,
			wasmArtifactSchema.shape.tool_profile,
			z.strictObject({
				text: z.string(),
				unit: z.literal("utf16-code-units")
			})
		]);
		wasmSummarySchema = z.strictObject({
			bytes: wasmArtifactSchema.shape.artifact.shape.bytes,
			validation: wasmArtifactSchema.shape.validation,
			debug_name_metadata: wasmArtifactSchema.shape.debug_name_metadata,
			custom_section_warnings: wasmArtifactSchema.shape.custom_section_warnings,
			available_counts: z.strictObject({
				sections: z.int().nonnegative(),
				imports: z.int().nonnegative(),
				exports: z.int().nonnegative(),
				candidates: z.int().nonnegative(),
				glue: z.int().nonnegative()
			}),
			wat: wasmArtifactSchema.shape.wat.omit({ text: true }).extend({ code_units: z.int().nonnegative() }),
			tool_profile: wasmArtifactSchema.shape.tool_profile,
			runtime_execution: wasmArtifactSchema.shape.runtime_execution,
			network_fetch: wasmArtifactSchema.shape.network_fetch,
			limitation_count: z.int().nonnegative()
		});
		projectWasmArtifactView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "wasm") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "WASM Evidence supports summary and wasm views."
			}]));
			const parsed = parseAnalysisViewResult(wasmArtifactSchema, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (!wasmArtifactMatchesSubject(report.artifact, parent.subject == null ? null : {
				path: parent.subject.local_path,
				sha256: parent.subject.digest.sha256,
				format: parent.subject.format
			})) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "WASM parent Evidence subject must identify the report's exact path and SHA-256."
			}]));
			const limitations = uniqueSorted([...parent.limitations, ...report.limitations]);
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_wasm_artifact",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations,
				unknowns: ["Decoded WAT is not original source. Runtime behavior and network acquisition were not performed.", ...report.glue.some((glue) => glue.parse_status !== "complete") ? ["Selected glue parsing is incomplete; unmatched references do not establish absence."] : []]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: {
					bytes: report.artifact.bytes,
					validation: report.validation,
					debug_name_metadata: report.debug_name_metadata,
					custom_section_warnings: report.custom_section_warnings,
					available_counts: {
						sections: report.sections.length,
						imports: report.imports.length,
						exports: report.exports.length,
						candidates: report.candidates.length,
						glue: report.glue.length
					},
					wat: {
						sha256: report.wat.sha256,
						representation: report.wat.representation,
						code_units: report.wat.text.length
					},
					tool_profile: report.tool_profile,
					runtime_execution: report.runtime_execution,
					network_fetch: report.network_fetch,
					limitation_count: limitations.length
				},
				coverage: completeWithinViewCoverage(report.sections.length + report.imports.length + report.exports.length, report.sections.length + report.imports.length + report.exports.length)
			});
			if (view.facet === "tool_profile") {
				if (view.offset !== 0) return err(analysisViewInputError([{
					path: ["view", "offset"],
					reason: "invalid_value",
					message: "Singleton tool_profile requires offset 0."
				}]));
				return ok({
					kind: "wasm",
					view,
					item: report.tool_profile,
					coverage: completeWithinViewCoverage(1, 1),
					...shared
				});
			}
			if (view.facet === "wat" || view.facet === "headers" || view.facet === "details") {
				const text = view.facet === "wat" ? report.wat.text : report[view.facet];
				const page = analysisTextPage(text, view.offset, view.limit, view.facet);
				return page.ok ? ok({
					kind: "wasm",
					view,
					...page.value,
					...shared
				}) : page;
			}
			const rows = report[view.facet];
			const item = rows.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "wasm",
				view,
				item,
				coverage: pageViewCoverage(view.offset, item.length, rows.length),
				...shared
			});
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeInspection.js
var hexAddress, coverage, nativeCommandInvocationSchema, architectureSchema, permissionSchema, sectionSchema, segmentSchema, symbolSchema, importSymbolSchema, dependencySchema, loadCommandSchema, buildMetadataSchema, inspectMachoSchema, inspectSignatureSchema, inspectPlistSchema, listArchitecturesSchema, demangleSwiftSchema;
function init_nativeInspection() {
	return (init_nativeInspection = __esmMin((() => {
		init_bundleResourceRoot();
		init_jsonValue();
		hexAddress = z.string().regex(/^0x[a-fA-F0-9]+$/u);
		coverage = (item) => z.object({
			items: z.array(item),
			total: z.int().min(0).nullable(),
			exhaustive: z.boolean(),
			limitations: z.array(z.string())
		});
		nativeCommandInvocationSchema = z.object({
			tool: z.string().min(1),
			command: z.array(z.string()),
			tool_version: z.string().nullable(),
			version_reason: z.string().nullable(),
			executable_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			exit: z.object({
				code: z.int().nullable(),
				signal: z.string().nullable()
			}),
			stdout_bytes: z.int().min(0),
			stderr_bytes: z.int().min(0)
		});
		architectureSchema = z.object({
			name: z.string(),
			hidden: z.boolean().exactOptional(),
			cpu_type: z.string().nullable(),
			cpu_subtype: z.string().nullable(),
			file_offset: z.int().min(0).nullable().describe("Offset from the start of the input Mach-O container."),
			size: z.int().min(0).nullable(),
			alignment: z.int().min(0).nullable()
		});
		permissionSchema = z.object({
			read: z.boolean().nullable(),
			write: z.boolean().nullable(),
			execute: z.boolean().nullable(),
			raw: z.string().nullable()
		});
		sectionSchema = z.object({
			segment: z.string(),
			name: z.string(),
			address: hexAddress.nullable(),
			size: z.int().min(0).nullable(),
			file_offset: z.int().min(0).nullable().describe("Offset from the start of the selected Mach-O slice."),
			alignment: z.int().min(0).nullable(),
			flags: z.array(z.string())
		});
		segmentSchema = z.object({
			name: z.string(),
			vm_address: hexAddress.nullable(),
			vm_size: z.int().min(0).nullable(),
			file_offset: z.int().min(0).nullable().describe("Offset from the start of the selected Mach-O slice."),
			file_size: z.int().min(0).nullable(),
			maximum_permissions: permissionSchema,
			initial_permissions: permissionSchema,
			sections: coverage(sectionSchema)
		});
		symbolSchema = z.object({
			name: z.string(),
			address: hexAddress.nullable(),
			weak: z.boolean().nullable(),
			reexport: z.boolean().nullable(),
			source: z.string().nullable()
		});
		importSymbolSchema = z.object({
			/** Resolved symbol identity; null when the textual row has multiple parses. */
			name: z.string().nullable(),
			/** Exact import text retained when a chained suffix makes identity ambiguous. */
			raw_name: z.string().nullable().default(null),
			name_status: z.enum(["exact", "ambiguous"]).nullable().default(null),
			/** Addend is unknown when only the ambiguous text expression is available. */
			addend: hexAddress.nullable().default(null),
			address: hexAddress.nullable(),
			weak: z.boolean().nullable(),
			reexport: z.boolean().nullable(),
			source: z.string().nullable()
		});
		dependencySchema = z.object({
			path: z.string(),
			kind: z.string(),
			current_version: z.string().nullable(),
			compatibility_version: z.string().nullable()
		});
		loadCommandSchema = z.object({
			index: z.int().min(0),
			kind: z.string(),
			fields: z.record(z.string(), z.union([
				z.string(),
				z.number(),
				z.null()
			]))
		});
		buildMetadataSchema = z.object({
			platform: z.string().nullable(),
			minimum_os: z.string().nullable(),
			sdk: z.string().nullable(),
			tools: z.array(z.object({
				name: z.string(),
				version: z.string()
			}))
		});
		inspectMachoSchema = z.object({
			format: z.enum(["mach-o", "mach-o-universal"]),
			/** Exact lipo slice selected for inspection and its offset in the input container. */
			selected_architecture: z.object({
				name: z.string().nullable().describe("Exact architecture name selected from lipo output; null when selection is unknown."),
				container_file_offset: z.int().min(0).nullable().describe("Offset of the selected slice from the start of the input Mach-O container; null when unknown.")
			}),
			endian: z.enum(["little", "big"]).nullable(),
			word_size: z.union([z.literal(32), z.literal(64)]).nullable(),
			file_type: z.string().nullable(),
			flags: z.array(z.string()),
			uuid: z.string().nullable(),
			entrypoints: coverage(z.object({ file_offset: z.int().min(0).describe("LC_MAIN entry offset from the start of the selected Mach-O slice.") })),
			architectures: coverage(architectureSchema),
			build_metadata: coverage(buildMetadataSchema),
			load_commands: coverage(loadCommandSchema),
			dependencies: coverage(dependencySchema),
			imports: coverage(importSymbolSchema),
			exports: coverage(symbolSchema),
			segments: coverage(segmentSchema),
			provenance: z.array(nativeCommandInvocationSchema),
			limitations: z.array(z.string())
		});
		inspectSignatureSchema = z.object({
			signed: z.boolean(),
			identifier: z.string().nullable(),
			team_identifier: z.string().nullable(),
			format: z.string().nullable(),
			cdhashes: z.array(z.string()),
			hash_algorithms: z.array(z.string()),
			authorities: z.array(z.string()),
			designated_requirement: z.string().nullable(),
			entitlements: jsonValueSchema.nullable(),
			timestamp: z.string().nullable(),
			hardened_runtime: z.boolean().nullable(),
			provenance: z.array(nativeCommandInvocationSchema),
			limitations: z.array(z.string())
		});
		inspectPlistSchema = z.object({
			format: z.enum([
				"xml",
				"binary",
				"json",
				"unknown"
			]),
			value: jsonValueSchema,
			bundle: z.object({
				identifier: z.string().nullable(),
				executable: z.string().nullable(),
				name: z.string().nullable(),
				version: z.string().nullable(),
				short_version: z.string().nullable()
			}),
			source_path: z.string(),
			resource_root: bundleResourceRootSchema.optional(),
			provenance: z.array(nativeCommandInvocationSchema),
			limitations: z.array(z.string())
		});
		listArchitecturesSchema = z.object({
			architectures: coverage(architectureSchema),
			provenance: z.array(nativeCommandInvocationSchema),
			limitations: z.array(z.string())
		});
		demangleSwiftSchema = z.object({
			symbols: z.array(z.object({
				input: z.string(),
				output: z.string(),
				status: z.enum([
					"demangled",
					"unchanged",
					"invalid"
				])
			})),
			provenance: z.array(nativeCommandInvocationSchema),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/domain/analysisView/machoView.js
var MACHO_COLLECTIONS, machoViewRequestSchema, shape, exactRows, machoViewItemSchema, machoViewContextSchema, collectionCountSchema, machoSummarySchema, parseMachoReport, summarizeMacho, projectMachoView;
function init_machoView() {
	return (init_machoView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_binaryTargetTypes();
		init_nativeInspection();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		MACHO_COLLECTIONS = [
			"entrypoints",
			"architectures",
			"build_metadata",
			"load_commands",
			"dependencies",
			"imports",
			"exports",
			"segments"
		];
		machoViewRequestSchema = z.strictObject({
			kind: z.literal("macho"),
			facet: z.enum([...MACHO_COLLECTIONS, "provenance"]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		({shape} = inspectMachoSchema);
		exactRows = (rows) => z.array(z.strictObject(rows.element.shape));
		machoViewItemSchema = z.union([
			exactRows(shape.entrypoints.shape.items),
			exactRows(shape.architectures.shape.items),
			exactRows(shape.build_metadata.shape.items),
			exactRows(shape.load_commands.shape.items),
			exactRows(shape.dependencies.shape.items),
			exactRows(shape.exports.shape.items),
			exactRows(shape.imports.shape.items),
			exactRows(shape.segments.shape.items),
			exactRows(shape.provenance)
		]);
		machoViewContextSchema = z.strictObject({
			source_total: z.int().nonnegative().nullable(),
			source_exhaustive: z.boolean()
		});
		collectionCountSchema = z.strictObject({
			returned: z.int().nonnegative(),
			total: z.int().nonnegative().nullable(),
			exhaustive: z.boolean()
		});
		machoSummarySchema = z.strictObject({
			format: shape.format,
			selected_architecture: shape.selected_architecture,
			endian: shape.endian,
			word_size: shape.word_size,
			file_type: shape.file_type,
			flags: shape.flags,
			uuid: shape.uuid,
			collections: z.strictObject(Object.fromEntries(MACHO_COLLECTIONS.map((name) => [name, collectionCountSchema]))),
			provenance_count: z.int().nonnegative(),
			limitation_count: z.int().nonnegative()
		});
		parseMachoReport = (parent) => {
			const parsed = parseAnalysisViewResult(inspectMachoSchema, parent);
			if (!parsed.ok) return parsed;
			if (parent.subject != null && !isMachOFormat(parent.subject.format)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Mach-O parent Evidence subject must identify a thin or universal Mach-O."
			}]));
			return ok(parsed.value);
		};
		summarizeMacho = (report, parentLimitations) => {
			const limitations = uniqueSorted([
				...parentLimitations,
				...report.limitations,
				...MACHO_COLLECTIONS.flatMap((name) => report[name].limitations)
			]);
			const collections = Object.fromEntries(MACHO_COLLECTIONS.map((name) => [name, {
				returned: report[name].items.length,
				total: report[name].total,
				exhaustive: report[name].exhaustive
			}]));
			return {
				limitations,
				returned: MACHO_COLLECTIONS.reduce((sum, name) => sum + report[name].items.length, 0),
				summary: {
					format: report.format,
					selected_architecture: report.selected_architecture,
					endian: report.endian,
					word_size: report.word_size,
					file_type: report.file_type,
					flags: report.flags,
					uuid: report.uuid,
					collections,
					provenance_count: report.provenance.length,
					limitation_count: limitations.length
				}
			};
		};
		projectMachoView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "macho") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Mach-O inspection supports summary and macho views."
			}]));
			const parsed = parseMachoReport(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const incomplete = MACHO_COLLECTIONS.filter((name) => !report[name].exhaustive);
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_macho",
				parent_digest: parent.evidenceId.slice(3),
				artifact: parent.subject == null ? {
					path: "",
					sha256: null
				} : {
					path: parent.subject.local_path,
					sha256: parent.subject.digest.sha256
				},
				unknowns: [...incomplete.length === 0 ? [] : [`Native tools did not report exhaustive ${incomplete.join(", ")}; page exhaustion does not establish absence of unreturned rows.`], ...parent.subject == null ? ["The parent has no recorded subject, so the inspected artifact path and SHA-256 are unknown."] : []]
			};
			if (view.kind === "summary") {
				const { summary, limitations, returned } = summarizeMacho(report, parent.limitations);
				return ok({
					kind: "summary",
					view,
					...shared,
					limitations,
					summary,
					coverage: completeWithinViewCoverage(returned, returned)
				});
			}
			const source = view.facet === "provenance" ? {
				items: report.provenance,
				total: report.provenance.length,
				exhaustive: true,
				limitations: []
			} : report[view.facet];
			const item = source.items.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "macho",
				view,
				item,
				...shared,
				limitations: uniqueSorted([
					...parent.limitations,
					...report.limitations,
					...source.limitations
				]),
				source_total: source.total,
				source_exhaustive: source.exhaustive,
				coverage: pageViewCoverage(view.offset, item.length, source.items.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/interfaceBuilderView.js
var page$1, interfaceBuilderViewRequestSchema, interfaceBuilderViewItemsSchema, interfaceBuilderViewContextSchema, countsSchema$1, interfaceBuilderSummarySchema, tally$1, pageRows, selectDocumentRows, readReport, parseInterfaceBuilderReport, summarizeInterfaceBuilder, projectInterfaceBuilderView;
function init_interfaceBuilderView() {
	return (init_interfaceBuilderView = __esmMin((() => {
		init_analysisViewErrors();
		init_canonicalOrdering();
		init_interfaceBuilderGraph();
		init_nativeInvestigationGraph();
		init_result();
		init_analysisViewParent();
		init_selectViewRows();
		init_analysisViewCoverage();
		page$1 = {
			kind: z.literal("interface-builder"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		interfaceBuilderViewRequestSchema = z.discriminatedUnion("collection", [z.strictObject({
			...page$1,
			collection: z.enum(["nodes", "edges"]),
			document: z.string().min(1).optional().describe("Exact documents[].relative_path; selects rows whose evidence names that archive.")
		}), z.strictObject({
			...page$1,
			collection: z.enum(["documents", "coverage"])
		})]);
		interfaceBuilderViewItemsSchema = z.union([
			z.array(interfaceBuilderDocumentSchema),
			z.array(nativeInvestigationNodeSchema),
			z.array(nativeInvestigationEdgeSchema),
			z.array(nativeInvestigationCoverageSchema)
		]);
		interfaceBuilderViewContextSchema = z.strictObject({ source_truncated: z.boolean() });
		countsSchema$1 = z.record(z.string(), z.int().positive());
		interfaceBuilderSummarySchema = z.strictObject({
			target_sha256: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
			provider: nativeInvestigationProviderSchema,
			documents: interfaceBuilderDocumentSchema.array().max(64),
			available_counts: z.strictObject({
				nodes: z.int().nonnegative(),
				edges: z.int().nonnegative(),
				coverage: z.int().nonnegative()
			}),
			node_kinds: countsSchema$1,
			edge_relations: countsSchema$1,
			coverage_statuses: countsSchema$1,
			truncated: z.boolean(),
			limitation_count: z.int().nonnegative()
		});
		tally$1 = (values) => {
			const counts = new Map();
			for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
			return Object.fromEntries([...counts].sort(([left], [right]) => left < right ? -1 : 1));
		};
		pageRows = (rows, view) => ({
			rows: rows.slice(view.offset, view.offset + view.limit),
			total: rows.length
		});
		selectDocumentRows = (rows, view, document) => document === undefined ? pageRows(rows, view) : selectViewRows(rows, view, (row) => row.evidence.some((evidence) => evidence.artifact_path === document), (row) => row);
		readReport = createAnalysisViewResultReader(interfaceBuilderAnalysisSchema);
		parseInterfaceBuilderReport = (parent) => {
			const parsed = readReport(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (report.graph.target_sha256 !== report.target_sha256 || parent.subject != null && parent.subject.digest.sha256 !== report.target_sha256) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Interface Builder parent Evidence subject and graph must identify the report's target SHA-256."
			}]));
			return parsed;
		};
		summarizeInterfaceBuilder = (report, limitationCount) => {
			const { graph } = report;
			const total = report.documents.length + graph.nodes.length + graph.edges.length + graph.coverage.length;
			return {
				summary: interfaceBuilderSummarySchema.parse({
					target_sha256: report.target_sha256,
					provider: graph.provider,
					documents: report.documents,
					available_counts: {
						nodes: graph.nodes.length,
						edges: graph.edges.length,
						coverage: graph.coverage.length
					},
					node_kinds: tally$1(graph.nodes.map((node) => node.kind)),
					edge_relations: tally$1(graph.edges.map((edge) => edge.relation)),
					coverage_statuses: tally$1(graph.coverage.map((row) => row.status)),
					truncated: graph.truncated,
					limitation_count: limitationCount
				}),
				coverage: completeWithinViewCoverage(total, total)
			};
		};
		projectInterfaceBuilderView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "interface-builder") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Interface Builder decoding supports summary and interface-builder views."
			}]));
			const parsed = parseInterfaceBuilderReport(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const { graph } = report;
			const limitations = uniqueSorted([...parent.limitations, ...report.limitations]);
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "decode_interface_builder",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: parent.subject?.local_path ?? report.resource_root?.canonical_path ?? "",
					sha256: report.target_sha256
				},
				...report.resource_root === undefined ? {} : { resource_root: report.resource_root },
				limitations,
				unknowns: ["Rows describe recognized archive objects and connections only; unrecognized classes, fields and runtime-created UI remain unknown.", ...graph.truncated ? ["The decoded graph is incomplete (see coverage and limitations for the cause); page exhaustion does not establish absence of undecoded objects or connections."] : []]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				...summarizeInterfaceBuilder(report, limitations.length)
			});
			const document = view.collection === "nodes" || view.collection === "edges" ? view.document : undefined;
			if (document !== undefined && !report.documents.some((row) => row.relative_path === document)) return err(analysisViewInputError([{
				path: ["view", "document"],
				reason: "invalid_value",
				message: "Select an exact documents[].relative_path from this decoded report."
			}]));
			const selected = view.collection === "documents" ? pageRows(report.documents, view) : view.collection === "coverage" ? pageRows(graph.coverage, view) : view.collection === "nodes" ? selectDocumentRows(graph.nodes, view, document) : selectDocumentRows(graph.edges, view, document);
			return ok({
				kind: "interface-builder",
				view,
				items: selected.rows,
				...shared,
				source_truncated: graph.truncated,
				coverage: pageViewCoverage(view.offset, selected.rows.length, selected.total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/qlogCaptureView.js
var traceSchema, streamSchema, qlogViewContextSchema, qlogSummarySchema, pageRequestShape, traceSelectorShape, streamSelectorShape, qlogViewRequestSchema, traceSummarySchema, streamSummarySchema, qlogViewPageSchema, summarizeQlogCapture, summarizeTrace, summarizeStream, projectQlogCapturePage;
function init_qlogCaptureView() {
	return (init_qlogCaptureView = __esmMin((() => {
		init_qlogCapture();
		init_result();
		init_analysisViewErrors();
		init_analysisViewCoverage();
		traceSchema = qlogCaptureFactsSchema.shape.traces.element;
		streamSchema = traceSchema.shape.streams.element;
		qlogViewContextSchema = qlogCaptureFactsSchema.omit({ traces: true });
		qlogSummarySchema = qlogViewContextSchema.extend({
			trace_count: z.int().nonnegative(),
			retained_stream_count: z.int().nonnegative(),
			loss_declaration_count: z.int().nonnegative(),
			incomplete_fact_record_count: z.int().nonnegative()
		});
		pageRequestShape = {
			kind: z.literal("qlog"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		traceSelectorShape = { trace_index: z.int().nonnegative() };
		streamSelectorShape = {
			...traceSelectorShape,
			stream_id: streamSchema.shape.stream_id,
			direction: streamSchema.shape.direction
		};
		qlogViewRequestSchema = z.discriminatedUnion("facet", [
			z.strictObject({
				...pageRequestShape,
				facet: z.literal("traces")
			}),
			z.strictObject({
				...pageRequestShape,
				...traceSelectorShape,
				facet: z.literal("streams")
			}),
			z.strictObject({
				...pageRequestShape,
				...traceSelectorShape,
				facet: z.literal("loss-declarations")
			}),
			z.strictObject({
				...pageRequestShape,
				...traceSelectorShape,
				facet: z.literal("incomplete-records")
			}),
			z.strictObject({
				...pageRequestShape,
				...streamSelectorShape,
				facet: z.literal("contributions")
			}),
			z.strictObject({
				...pageRequestShape,
				...streamSelectorShape,
				facet: z.literal("ranges")
			}),
			z.strictObject({
				...pageRequestShape,
				...streamSelectorShape,
				facet: z.literal("final-sizes")
			})
		]);
		traceSummarySchema = traceSchema.omit({
			streams: true,
			loss_declarations: true,
			incomplete_fact_records: true
		}).extend({
			stream_count: z.int().nonnegative(),
			loss_declaration_count: z.int().nonnegative(),
			incomplete_fact_record_count: z.int().nonnegative()
		});
		streamSummarySchema = streamSchema.omit({
			contributions: true,
			covered_ranges: true,
			reported_final_sizes: true
		}).extend({
			contribution_count: z.int().nonnegative(),
			covered_range_count: z.int().nonnegative(),
			reported_final_size_count: z.int().nonnegative()
		});
		qlogViewPageSchema = z.discriminatedUnion("facet", [
			z.strictObject({
				facet: z.literal("traces"),
				items: z.array(traceSummarySchema)
			}),
			z.strictObject({
				facet: z.literal("streams"),
				items: z.array(streamSummarySchema)
			}),
			z.strictObject({
				facet: z.literal("loss-declarations"),
				items: traceSchema.shape.loss_declarations
			}),
			z.strictObject({
				facet: z.literal("incomplete-records"),
				items: traceSchema.shape.incomplete_fact_records
			}),
			z.strictObject({
				facet: z.literal("contributions"),
				items: streamSchema.shape.contributions
			}),
			z.strictObject({
				facet: z.literal("ranges"),
				items: streamSchema.shape.covered_ranges
			}),
			z.strictObject({
				facet: z.literal("final-sizes"),
				items: streamSchema.shape.reported_final_sizes
			})
		]);
		summarizeQlogCapture = (qlog) => {
			const { traces, ...context } = qlog;
			return {
				...context,
				trace_count: traces.length,
				retained_stream_count: traces.reduce((sum, trace) => sum + trace.streams.length, 0),
				loss_declaration_count: traces.reduce((sum, trace) => sum + trace.loss_declarations.length, 0),
				incomplete_fact_record_count: traces.reduce((sum, trace) => sum + trace.incomplete_fact_records.length, 0)
			};
		};
		summarizeTrace = ({ streams, loss_declarations, incomplete_fact_records, ...trace }) => ({
			...trace,
			stream_count: streams.length,
			loss_declaration_count: loss_declarations.length,
			incomplete_fact_record_count: incomplete_fact_records.length
		});
		summarizeStream = ({ contributions, covered_ranges, reported_final_sizes, ...stream }) => ({
			...stream,
			contribution_count: contributions.length,
			covered_range_count: covered_ranges.length,
			reported_final_size_count: reported_final_sizes.length
		});
		projectQlogCapturePage = (qlog, view) => {
			const invalid = (field, message) => err(analysisViewInputError([{
				path: ["view", field],
				reason: "invalid_value",
				message
			}]));
			const slice = (items) => items.slice(view.offset, view.offset + view.limit);
			let page;
			let total;
			if (view.facet === "traces") {
				total = qlog.traces.length;
				page = {
					facet: "traces",
					items: slice(qlog.traces).map(summarizeTrace)
				};
			} else {
				const matches = qlog.traces.filter((trace) => trace.trace_index === view.trace_index);
				if (matches.length !== 1) return invalid("trace_index", "Select one unambiguous retained trace index.");
				const trace = matches[0];
				if (view.facet === "streams") {
					total = trace.streams.length;
					page = {
						facet: "streams",
						items: slice(trace.streams).map(summarizeStream)
					};
				} else if (view.facet === "loss-declarations") {
					total = trace.loss_declarations.length;
					page = {
						facet: view.facet,
						items: slice(trace.loss_declarations)
					};
				} else if (view.facet === "incomplete-records") {
					total = trace.incomplete_fact_records.length;
					page = {
						facet: view.facet,
						items: slice(trace.incomplete_fact_records)
					};
				} else {
					const matches = trace.streams.filter((stream) => stream.stream_id === view.stream_id && stream.direction === view.direction);
					if (matches.length !== 1) return invalid("stream_id", "Select one unambiguous retained stream ID and direction within the trace.");
					const stream = matches[0];
					if (view.facet === "contributions") {
						total = stream.contributions.length;
						page = {
							facet: view.facet,
							items: slice(stream.contributions)
						};
					} else if (view.facet === "ranges") {
						total = stream.covered_ranges.length;
						page = {
							facet: view.facet,
							items: slice(stream.covered_ranges)
						};
					} else {
						total = stream.reported_final_sizes.length;
						page = {
							facet: view.facet,
							items: slice(stream.reported_final_sizes)
						};
					}
				}
			}
			const { traces: _traces, ...context } = qlog;
			return ok({
				context,
				page,
				coverage: pageViewCoverage(view.offset, page.items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/webNetworkCaptureView.js
var captureViewRequestSchema, protobufSummarySchema, summarizeProtobuf, previewSchema, captureViewItemsSchema, captureSummarySchema, object, HEADLINE_FIELDS, MITMPROXY_HEADLINE_FIELDS, MITMPROXY_PATH_MAX_LENGTH, integerIn, hasControl, LONE_SURROGATE, hostLike, MITMPROXY_INTEGER_FIELDS, describesText, representationMatches, headlineShape, ancestorsOf, addAncestors, groupByPointer, indexFacets, usableScalar, textualFlowType, mitmproxyHeadline, selectHeadlines, preview, captureParser, parseCaptureParent, projectWebNetworkCaptureView;
function init_webNetworkCaptureView() {
	return (init_webNetworkCaptureView = __esmMin((() => {
		init_protobufCaptureView();
		init_analysisViewErrors();
		init_analysisViewParent();
		init_result();
		init_webNetworkCapture();
		init_analysisViewCoverage();
		init_qlogCaptureView();
		captureViewRequestSchema = z.strictObject({
			kind: z.literal("capture"),
			detail: z.enum(["preview", "complete"]).default("preview"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		protobufSummarySchema = z.strictObject({
			bodies: z.number().int().nonnegative(),
			frames: z.number().int().nonnegative(),
			fields: z.number().int().nonnegative(),
			incomplete_bodies: z.number().int().nonnegative()
		});
		summarizeProtobuf = (records) => {
			const counts = {
				bodies: 0,
				frames: 0,
				fields: 0,
				incomplete_bodies: 0
			};
			for (const record of records) for (const body of record.protobuf ?? []) {
				counts.bodies++;
				counts.frames += body.frames.length;
				counts.fields += body.fields.length;
				counts.incomplete_bodies += Number(body.status !== "complete");
			}
			return counts.bodies === 0 ? undefined : counts;
		};
		previewSchema = webNetworkCaptureRecordSchema.omit({ protobuf: true }).extend({
			binary_fields: z.array(webNetworkCaptureBinaryDescriptorSchema),
			protobuf_summary: protobufSummarySchema.exactOptional()
		});
		captureViewItemsSchema = z.array(z.union([webNetworkCaptureRecordSchema, previewSchema]));
		captureSummarySchema = z.strictObject({
			protobuf_coverage: protobufCaptureCoverageSchema.exactOptional(),
			artifact: webNetworkCaptureArtifactSchema,
			decoder: webNetworkCaptureDecoderSchema,
			format: z.enum(WEB_NETWORK_CAPTURE_FORMATS),
			total_records: z.int().nonnegative(),
			retained_records: z.int().nonnegative(),
			runtime_attribution: z.literal("unknown"),
			protobuf: protobufSummarySchema.exactOptional(),
			qlog: qlogSummarySchema.optional()
		});
		object = (value) => value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
		HEADLINE_FIELDS = [
			"method",
			"url",
			"httpVersion",
			"http_version",
			"status",
			"statusText",
			"reason"
		];
		MITMPROXY_HEADLINE_FIELDS = {
			request: [
				"scheme",
				"host",
				"port",
				"authority",
				"path"
			],
			response: ["status_code"]
		};
		MITMPROXY_PATH_MAX_LENGTH = 2 * 1024;
		integerIn = (value, min, max) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
		hasControl = (value, includeSpace) => {
			for (let index = 0; index < value.length; index += 1) {
				const code = value.charCodeAt(index);
				if (code < 32 || code === 127 || includeSpace && code === 32) return true;
			}
			return false;
		};
		LONE_SURROGATE = /\p{Cs}/u;
		hostLike = (value, maxLength) => typeof value === "string" && value.length <= maxLength && !hasControl(value, true) && !/[@/\\]/u.test(value) && !LONE_SURROGATE.test(value);
		MITMPROXY_INTEGER_FIELDS = new Set(["port", "status_code"]);
		describesText = (descriptor, text) => {
			if (descriptor.representation !== "producer-bytes" || descriptor.state !== "retained") return false;
			const utf8 = Buffer.from(text, "utf8");
			return utf8.toString("utf8") === text && descriptor.bytes === utf8.length && descriptor.content_base64 === utf8.toString("base64") && descriptor.sha256 === createHash("sha256").update(utf8).digest("hex");
		};
		representationMatches = (field, value, sidecars, bytes) => {
			if (MITMPROXY_INTEGER_FIELDS.has(field)) return bytes.length === 0 && typeof value === "number" && sidecars.length === 1 && sidecars[0]?.producer_type === "integer" && sidecars[0].literal === String(value);
			if (sidecars.length !== 0 || bytes.length > 1) return false;
			const [descriptor] = bytes;
			return descriptor === undefined || typeof value === "string" && describesText(descriptor, value);
		};
		headlineShape = (field, value) => {
			switch (field) {
				case "scheme": return typeof value === "string" && /^[A-Za-z][A-Za-z0-9+.-]{0,31}$/u.test(value);
				case "host": return hostLike(value, 255);
				case "authority": return hostLike(value, 262);
				case "port": return integerIn(value, 0, 65535);
				case "status_code": return integerIn(value, 100, 999);
				case "path": return typeof value === "string" && value.length <= MITMPROXY_PATH_MAX_LENGTH && !hasControl(value, false) && !value.includes("@") && !LONE_SURROGATE.test(value) && (value === "*" || value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\"));
				default: return false;
			}
		};
		ancestorsOf = (pointer) => {
			const ancestors = [];
			for (let at = pointer.indexOf("/"); at !== -1; at = pointer.indexOf("/", at + 1)) ancestors.push(pointer.slice(0, at));
			return ancestors;
		};
		addAncestors = (pointer, into) => {
			for (let at = pointer.lastIndexOf("/"); at !== -1; at = at === 0 ? -1 : pointer.lastIndexOf("/", at - 1)) {
				const ancestor = pointer.slice(0, at);
				if (into.has(ancestor)) return;
				into.add(ancestor);
			}
		};
		groupByPointer = (facets) => {
			const groups = new Map();
			for (const facet of facets) {
				const group = groups.get(facet.pointer);
				if (group === undefined) groups.set(facet.pointer, [facet]);
				else group.push(facet);
			}
			return groups;
		};
		indexFacets = (record) => {
			const containers = new Set();
			const withheld = new Set();
			const omittedNames = new Set();
			for (const { pointer } of record.numeric_literals) addAncestors(pointer, containers);
			for (const { pointer, state } of record.binary_fields) {
				addAncestors(pointer, containers);
				if (state === "redacted") withheld.add(pointer);
			}
			for (const redaction of record.redactions) {
				addAncestors(redaction.pointer, containers);
				("scope" in redaction ? omittedNames : withheld).add(redaction.pointer);
			}
			const sidecars = groupByPointer(record.numeric_literals);
			const bytes = groupByPointer(record.binary_fields);
			return {
				sidecars,
				bytes,
				scalars: new Set([...sidecars.keys(), ...bytes.keys()]),
				containers,
				withheld,
				omittedNames
			};
		};
		usableScalar = (index, pointer) => {
			const ancestors = ancestorsOf(pointer);
			return !index.omittedNames.has(pointer) && !index.containers.has(pointer) && !index.withheld.has(pointer) && !ancestors.some((ancestor) => index.withheld.has(ancestor) || index.scalars.has(ancestor));
		};
		textualFlowType = (index) => usableScalar(index, "/type") && !index.scalars.has("/type");
		mitmproxyHeadline = (index, pointer, field, value) => usableScalar(index, pointer) && headlineShape(field, value) && representationMatches(field, value, index.sidecars.get(pointer) ?? [], index.bytes.get(pointer) ?? []);
		selectHeadlines = (fields, key, facets, selectedPointers) => {
			const selected = {};
			const candidates = [...HEADLINE_FIELDS.map((field) => [field, null]), ...(facets === null ? [] : MITMPROXY_HEADLINE_FIELDS[key] ?? []).map((field) => [field, facets])];
			for (const [field, index] of candidates) {
				const value = fields[field];
				if (!Object.hasOwn(fields, field) || value === undefined || index !== null && !mitmproxyHeadline(index, `/${key}/${field}`, field, value)) continue;
				selected[field] = value;
				selectedPointers.add(`/${key}/${field}`);
			}
			return selected;
		};
		preview = (record, format) => {
			const source = object(record.reported);
			const reported = {};
			const selectedPointers = new Set();
			if (source !== null) {
				const index = format === "mitmproxy" && source.type === "http" ? indexFacets(record) : null;
				const mitmproxyFacets = index !== null && textualFlowType(index) ? index : null;
				for (const key of [
					"session_id",
					"name",
					"time",
					"startedDateTime",
					"type"
				]) if (Object.hasOwn(source, key) && source[key] !== undefined) {
					reported[key] = source[key];
					selectedPointers.add(`/${key}`);
				}
				for (const key of ["request", "response"]) {
					const value = source[key];
					if (!Object.hasOwn(source, key) || value === undefined) continue;
					const fields = object(value);
					if (fields === null) {
						reported[key] = value;
						continue;
					}
					reported[key] = selectHeadlines(fields, key, mitmproxyFacets, selectedPointers);
				}
			}
			const { protobuf: _protobuf, ...sourceRecord } = record;
			const protobufSummary = summarizeProtobuf([record]);
			return {
				...sourceRecord,
				...protobufSummary === undefined ? {} : { protobuf_summary: protobufSummary },
				reported: source === null ? record.reported : reported,
				binary_fields: record.binary_fields.map(({ content_base64: _content, ...field }) => field),
				numeric_literals: source === null ? record.numeric_literals : record.numeric_literals.filter(({ pointer }) => selectedPointers.has(pointer))
			};
		};
		captureParser = { safeParse: safeParseOwnedWebNetworkCapture };
		parseCaptureParent = (parent) => {
			const parsed = parseAnalysisViewResult(captureParser, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			if (report.artifact.sha256 !== null && (parent.subject == null || parent.subject.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Capture parent subject must identify the report's exact path and SHA-256."
			}]));
			return ok(report);
		};
		projectWebNetworkCaptureView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "capture" && view.kind !== "protobuf" && view.kind !== "qlog") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Historical captures support summary, capture record pages, qlog fact pages and admitted api-surface, environment-manifest, environment-state or environment-coverage views."
			}]));
			const parsed = parseCaptureParent(parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_web_network_capture",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: [...new Set([
					...parent.limitations,
					...report.limitations,
					"Capture record pages cover the records selected into the parent Evidence, in that selected order; total_records counts the original decoded capture."
				])],
				unknowns: ["Historical records do not establish live runtime attribution or deployment authenticity.", ...report.artifact.sha256 === null ? ["The explicitly excluded artifact digest remains unknown."] : []]
			};
			if (view.kind === "protobuf") return ok({
				...shared,
				...projectProtobufCapturePage(report, view),
				unknowns: [...shared.unknowns, "Decoding covers selected retained bodies only. Exhausting wire fields does not establish schema completeness or business meaning; compressed bodies and unsupported schema facets remain unknown."]
			});
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: {
					artifact: report.artifact,
					decoder: report.decoder,
					format: report.format,
					total_records: report.total_records,
					retained_records: report.records.length,
					runtime_attribution: report.runtime_attribution,
					...report.protobuf_coverage === undefined ? {} : { protobuf_coverage: report.protobuf_coverage },
					...summarizeProtobuf(report.records) === undefined ? {} : { protobuf: summarizeProtobuf(report.records) },
					...report.format === "qlog" ? { qlog: summarizeQlogCapture(report.qlog) } : {}
				},
				coverage: completeWithinViewCoverage(report.records.length, report.records.length)
			});
			if (view.kind === "qlog") {
				if (report.format !== "qlog") return err(analysisViewInputError([{
					path: ["view", "kind"],
					reason: "invalid_value",
					message: "Qlog fact views require retained qlog Evidence."
				}]));
				const projected = projectQlogCapturePage(report.qlog, view);
				return projected.ok ? ok({
					kind: "qlog",
					view,
					...shared,
					...projected.value,
					limitations: [...shared.limitations, "Qlog fact pages retain all-recorded-events-before-selection scope. Exhausting a page does not establish network completeness, body recovery, retransmission or actual loss."]
				}) : projected;
			}
			const records = report.records.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "capture",
				view,
				...shared,
				items: captureViewItemsSchema.parse(view.detail === "complete" ? records : records.map((record) => preview(record, report.format))),
				coverage: pageViewCoverage(view.offset, records.length, report.records.length),
				limitations: [...shared.limitations, ...view.detail === "preview" ? ["Preview selects recorded headline fields and byte descriptors; headers, XML, bodies, message data and other fields remain in complete record pages. Missing preview fields do not establish their absence from the producer record."] : []]
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/recordedResponseBody.js
var contentTextSchema, strictUtf8, base64PrefixChars, decodeRetainedBase64, readRecordedResponseBody, recordedResponseBodyIsEmpty;
function init_recordedResponseBody() {
	return (init_recordedResponseBody = __esmMin((() => {
		contentTextSchema = z.object({ response: z.object({ content: z.object({
			text: z.unknown().optional(),
			encoding: z.unknown().optional()
		}) }) });
		strictUtf8 = () => new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		});
		base64PrefixChars = (limitBytes) => Math.ceil((limitBytes + 4) / 3) * 4;
		decodeRetainedBase64 = (encoded, limitBytes) => {
			const prefixChars = base64PrefixChars(limitBytes);
			const cut = encoded.length > prefixChars;
			const prefix = cut ? encoded.slice(0, prefixChars) : encoded;
			const flags = cut ? { bodyCut: true } : {};
			try {
				const text = strictUtf8().decode(Buffer.from(prefix, "base64"), { stream: cut });
				return {
					bodyText: text,
					...flags
				};
			} catch {
				return {
					bodyText: prefix,
					bodyEncoding: "base64",
					...flags
				};
			}
		};
		readRecordedResponseBody = (record, limitBytes) => {
			const content = contentTextSchema.safeParse(record.reported);
			if (!content.success) return { bodyText: null };
			const { text, encoding } = content.data.response.content;
			if (typeof text !== "string") return { bodyText: null };
			if (encoding === undefined) {
				const hiddenNames = record.redactions.some((redaction) => "scope" in redaction && redaction.pointer === "/response/content");
				return { bodyText: hiddenNames ? null : text };
			}
			if (encoding !== "base64") return { bodyText: null };
			const binary = record.binary_fields.find((field) => field.pointer === "/response/content/text" && field.state === "retained");
			if (binary === undefined || binary.content_base64 === null) return { bodyText: null };
			return decodeRetainedBase64(binary.content_base64, limitBytes);
		};
		recordedResponseBodyIsEmpty = (record) => {
			const body = readRecordedResponseBody(record, 0);
			return body.bodyText === "" && body.bodyEncoding === undefined && body.bodyCut !== true;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentManifestSpelling.js
var FIXED_LENGTH_MINIMUM, SPELLED_LENGTH_LIMIT, characterClasses, shapeOf, spellingSummary, spelledLikeObserved;
function init_environmentManifestSpelling() {
	return (init_environmentManifestSpelling = __esmMin((() => {
		init_unicodeCodePointOrder();
		FIXED_LENGTH_MINIMUM = 8;
		SPELLED_LENGTH_LIMIT = 128;
		characterClasses = (text) => {
			if (text.length > SPELLED_LENGTH_LIMIT) return undefined;
			const classes = new Set();
			for (const character of text) classes.add(character >= "0" && character <= "9" ? "0" : character >= "a" && character <= "z" ? "a" : character >= "A" && character <= "Z" ? "A" : character);
			return [...classes].sort(compareUnicodeCodePoints).join("");
		};
		shapeOf = (length, classes) => compositeKey([length, classes]);
		spellingSummary = (observed) => {
			const shapes = new Set();
			const lengths = new Set();
			const classes = new Set();
			for (const value of observed) {
				lengths.add(value.length);
				const kinds = characterClasses(value);
				if (kinds === undefined) continue;
				shapes.add(shapeOf(value.length, kinds));
				for (const kind of kinds) classes.add(kind);
			}
			const [length] = lengths;
			return {
				shapes,
				family: lengths.size === 1 && length >= FIXED_LENGTH_MINIMUM && length <= SPELLED_LENGTH_LIMIT ? {
					length,
					classes
				} : undefined
			};
		};
		spelledLikeObserved = (value, observed) => {
			const classes = characterClasses(value);
			if (classes === undefined) return false;
			const { family } = observed;
			if (family !== undefined && value.length === family.length && [...classes].every((kind) => family.classes.has(kind))) return true;
			return /\d/u.test(value) && observed.shapes.has(shapeOf(value.length, classes));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentManifestRules.js
var TEMPLATE_RULES, OPAQUE_TOKEN$1, VERSION_TOKEN, STOP_WORDS, SIBLING_VARIANCE_SEGMENT_LIMIT, SEGMENT_LIMITED_RULES, OPT_IN_RULES, param, partKey, withParts, earliest, mergeGroups, rebucket, templateAfterUidLiteral, templateOpaqueTokens, literalAt, identifierLikeSiblings, optInParamAt, mergeLiteralSiblings, mergeSiblings, mergeSiblingVariance, SIBLING_PAIR_MINIMUM, pairCandidate, mergePairBucket, mergeSiblingPairs, nameKey, prefixKey, isShared, sharedPositions, donorFor, sharedShape, mergePrefixVariance, withinSegmentLimit, applyTemplateRules;
function init_environmentManifestRules() {
	return (init_environmentManifestRules = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_environmentManifestSpelling();
		TEMPLATE_RULES = [
			"after-uid-literal",
			"opaque-token",
			"sibling-variance",
			"sibling-pair-variance",
			"prefix-variance"
		];
		OPAQUE_TOKEN$1 = /^(?=.*\d)(?=.*[a-z])[a-z0-9]{12,}$/u;
		VERSION_TOKEN = /^v\d/u;
		STOP_WORDS = new Set([
			"search",
			"settings",
			"errors",
			"list",
			"members",
			"versions",
			"health",
			"merged",
			"usage",
			"checks",
			"dto",
			"markdown"
		]);
		SIBLING_VARIANCE_SEGMENT_LIMIT = 32;
		SEGMENT_LIMITED_RULES = [
			"sibling-variance",
			"sibling-pair-variance",
			"prefix-variance"
		];
		OPT_IN_RULES = new Set(TEMPLATE_RULES);
		param = (rule, values) => ({
			kind: "param",
			rule,
			values: new Set(values)
		});
		partKey = (part) => part.kind === "literal" ? part.value : ["param", part.rule];
		withParts = (group, parts) => ({
			...group,
			parts
		});
		earliest = (groups) => groups.reduce((best, group) => (group.positions[0] ?? Infinity) < (best.positions[0] ?? Infinity) ? group : best);
		mergeGroups = (groups, shape = earliest(groups)) => {
			if (groups.length === 1) return groups[0];
			const primary = earliest(groups);
			return {
				method: primary.method,
				origin: primary.origin,
				api_surface_template: primary.api_surface_template,
				parts: shape.parts.map((part, index) => part.kind === "literal" ? part : {
					...part,
					values: new Set(groups.flatMap((group) => {
						const sibling = group.parts[index];
						if (sibling === undefined) return [];
						return sibling.kind === "param" ? [...sibling.values] : [sibling.value];
					}))
				}),
				positions: groups.flatMap((group) => group.positions).sort((left, right) => left - right),
				statuses: new Set(groups.flatMap((group) => [...group.statuses])),
				contentTypes: new Set(groups.flatMap((group) => [...group.contentTypes])),
				queryNames: new Set(groups.flatMap((group) => [...group.queryNames])),
				bodyShape: primary.bodyShape
			};
		};
		rebucket = (groups, keyOf = partKey, shapeOf = earliest) => {
			const buckets = new Map();
			for (const group of groups) {
				const key = compositeKey([
					group.method,
					group.origin,
					...group.parts.map(keyOf)
				]);
				const bucket = buckets.get(key);
				if (bucket === undefined) buckets.set(key, [group]);
				else bucket.push(group);
			}
			return [...buckets.values()].map((bucket) => mergeGroups(bucket, shapeOf(bucket)));
		};
		templateAfterUidLiteral = (parts) => parts.map((part, index) => {
			const previous = parts[index - 1];
			return part.kind === "literal" && previous?.kind === "literal" && previous.value === "uid" && !STOP_WORDS.has(part.value) ? param("after-uid-literal", [part.value]) : part;
		});
		templateOpaqueTokens = (parts) => parts.map((part) => part.kind === "literal" && OPAQUE_TOKEN$1.test(part.value) && !VERSION_TOKEN.test(part.value) ? param("opaque-token", [part.value]) : part);
		literalAt = (group, position) => {
			const part = group.parts[position];
			return part?.kind === "literal" ? part.value : "";
		};
		identifierLikeSiblings = (literal, position) => {
			const eligible = new Set();
			const previous = literal[0]?.parts[position - 1];
			const plural = previous?.kind === "literal" && previous.value.endsWith("s");
			const hyphenated = [];
			for (const group of literal) {
				const value = literalAt(group, position);
				if (STOP_WORDS.has(value)) continue;
				if (/[\d:]/u.test(value)) eligible.add(group);
				if (plural && value.includes("-")) hyphenated.push(group);
			}
			if (hyphenated.length >= 3) for (const group of hyphenated) eligible.add(group);
			return eligible;
		};
		optInParamAt = (group, position) => {
			const part = group.parts[position];
			return part?.kind === "param" && OPT_IN_RULES.has(part.rule);
		};
		mergeLiteralSiblings = (literal, position) => {
			const eligible = identifierLikeSiblings(literal, position);
			if (eligible.size < 2) return [...literal];
			const groups = [...eligible];
			const first = earliest(groups);
			const shape = withParts(first, first.parts.map((part, index) => index === position ? param("sibling-variance", [literalAt(first, position)]) : part));
			return [mergeGroups(groups.map((group) => group === first ? shape : group), shape), ...literal.filter((group) => !eligible.has(group))];
		};
		mergeSiblings = (bucket, position) => {
			if (bucket.length < 2) return [...bucket];
			const templated = bucket.filter((group) => group.parts[position]?.kind === "param");
			const literal = bucket.filter((group) => group.parts[position]?.kind === "literal");
			const targets = templated.filter((group) => optInParamAt(group, position));
			if (targets.length === 0) return [...templated, ...mergeLiteralSiblings(literal, position)];
			const target = earliest(targets);
			const foldable = new Set(literal.filter((group) => !STOP_WORDS.has(literalAt(group, position))));
			return [
				mergeGroups([target, ...foldable], target),
				...templated.filter((group) => group !== target),
				...literal.filter((group) => !foldable.has(group))
			];
		};
		mergeSiblingVariance = (groups) => {
			let current = [...groups];
			const longest = Math.max(0, ...current.map((group) => group.parts.length));
			for (let position = 2; position < longest; position += 1) {
				const buckets = new Map();
				const output = [];
				for (const group of current) {
					if (position >= group.parts.length) {
						output.push(group);
						continue;
					}
					const key = compositeKey([
						group.method,
						group.origin,
						group.parts.length,
						...group.parts.map((part, index) => index === position ? null : partKey(part))
					]);
					const bucket = buckets.get(key);
					if (bucket === undefined) buckets.set(key, [group]);
					else bucket.push(group);
				}
				for (const bucket of buckets.values()) output.push(...mergeSiblings(bucket, position));
				current = output;
			}
			return current;
		};
		SIBLING_PAIR_MINIMUM = 3;
		pairCandidate = (group, position) => {
			const previous = group.parts[position - 1];
			const first = group.parts[position];
			const second = group.parts[position + 1];
			return previous?.kind === "literal" && previous.value.endsWith("s") && !STOP_WORDS.has(previous.value) && first?.kind === "literal" && second?.kind === "literal" && group.parts[position + 2]?.kind === "literal" && [first.value, second.value].every((value) => !STOP_WORDS.has(value) && !VERSION_TOKEN.test(value));
		};
		mergePairBucket = (bucket, position) => {
			const pairs = new Set(bucket.map((group) => compositeKey([literalAt(group, position), literalAt(group, position + 1)])));
			const firsts = new Set(bucket.map((group) => literalAt(group, position)));
			const seconds = new Set(bucket.map((group) => literalAt(group, position + 1)));
			if (pairs.size < 3 || firsts.size < 2 || seconds.size < 2) return [...bucket];
			const first = earliest(bucket);
			const shape = withParts(first, first.parts.map((part, index) => index === position || index === position + 1 ? {
				...param("sibling-pair-variance", [literalAt(first, index)]),
				pairRole: index === position ? "namespace" : "name"
			} : part));
			return [mergeGroups(bucket.map((group) => group === first ? shape : group), shape)];
		};
		mergeSiblingPairs = (groups) => {
			let current = [...groups];
			const longest = Math.max(0, ...current.map((group) => group.parts.length));
			for (let position = 2; position + 1 < longest; position += 1) {
				const buckets = new Map();
				const output = [];
				for (const group of current) {
					if (!pairCandidate(group, position)) {
						output.push(group);
						continue;
					}
					const key = compositeKey([
						group.method,
						group.origin,
						group.parts.length,
						...group.parts.map((part, index) => index === position || index === position + 1 ? null : partKey(part))
					]);
					const bucket = buckets.get(key);
					if (bucket === undefined) buckets.set(key, [group]);
					else bucket.push(group);
				}
				for (const bucket of buckets.values()) output.push(...mergePairBucket(bucket, position));
				current = output;
			}
			return current;
		};
		nameKey = (part) => part.kind === "literal" ? part.value : [
			"param",
			part.rule === "prefix-variance" ? part.sharedRule : part.rule,
			part.pairRole ?? null
		];
		prefixKey = (group, position) => compositeKey([group.origin, ...group.parts.slice(0, position).map(nameKey)]);
		isShared = (part) => part?.kind === "param" && part.rule !== "prefix-variance" && OPT_IN_RULES.has(part.rule);
		sharedPositions = (groups, position) => {
			const donors = new Map();
			const ordered = [...groups].sort((left, right) => (left.positions[0] ?? 0) - (right.positions[0] ?? 0));
			for (const group of ordered) {
				const part = group.parts[position];
				if (!isShared(part)) continue;
				const key = prefixKey(group, position);
				const byRule = donors.get(key) ?? new Map();
				donors.set(key, byRule);
				const rule = compositeKey([nameKey(part)]);
				const known = byRule.get(rule);
				if (known === undefined) byRule.set(rule, {
					part,
					values: new Set(part.values)
				});
				else for (const value of part.values) known.values.add(value);
			}
			return new Map([...donors].map(([key, byRule]) => [key, [...byRule.values()].map((donor) => ({
				...donor,
				spelling: spellingSummary(donor.values)
			}))]));
		};
		donorFor = (value, donors) => value === "" || STOP_WORDS.has(value) || VERSION_TOKEN.test(value) ? undefined : donors.find((donor) => donor.values.has(value)) ?? donors.find((donor) => spelledLikeObserved(value, donor.spelling));
		sharedShape = (bucket) => {
			const first = earliest(bucket);
			return withParts(first, first.parts.map((part, index) => part.kind === "param" && part.rule === "prefix-variance" ? bucket.map((group) => group.parts[index]).find(isShared) ?? part : part));
		};
		mergePrefixVariance = (groups) => {
			let current = [...groups];
			const longest = Math.max(0, ...current.map((group) => group.parts.length));
			for (let position = 0; position < longest; position += 1) {
				const shared = sharedPositions(current, position);
				if (shared.size === 0) continue;
				current = current.map((group) => {
					const part = group.parts[position];
					const donors = part?.kind === "literal" ? shared.get(prefixKey(group, position)) : undefined;
					const known = part?.kind === "literal" && donors !== undefined ? donorFor(part.value, donors) : undefined;
					if (part?.kind !== "literal" || known === undefined) return group;
					const templated = {
						...known.part,
						rule: "prefix-variance",
						sharedRule: known.part.rule,
						values: new Set([part.value])
					};
					return withParts(group, group.parts.map((other, index) => index === position ? templated : other));
				});
			}
			return rebucket(current, nameKey, sharedShape);
		};
		withinSegmentLimit = (groups, pass) => [...pass(groups.filter((group) => group.parts.length <= 32)), ...groups.filter((group) => group.parts.length > 32)];
		applyTemplateRules = (groups, rules) => {
			let current = [...groups];
			if (rules.has("after-uid-literal")) current = current.map((group) => withParts(group, templateAfterUidLiteral(group.parts)));
			if (rules.has("opaque-token")) current = current.map((group) => withParts(group, templateOpaqueTokens(group.parts)));
			current = rebucket(current);
			if (rules.has("sibling-pair-variance")) current = withinSegmentLimit(current, mergeSiblingPairs);
			if (rules.has("sibling-variance")) current = withinSegmentLimit(current, mergeSiblingVariance);
			if (rules.has("prefix-variance")) current = withinSegmentLimit(current, mergePrefixVariance);
			return current;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentManifestNames.js
var DROPPED_NAME_LITERALS, TOOL_NAME_LIMIT, BASE_RULES, sanitizeToken, singular, paramBaseName, parameterNames, pathTemplate, toolNameRegistry, toolName, compareTools;
function init_environmentManifestNames() {
	return (init_environmentManifestNames = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_environmentManifestRules();
		init_webNetworkRouteTemplates();
		DROPPED_NAME_LITERALS = new Set([
			"api",
			"apis",
			"namespaces",
			"default"
		]);
		TOOL_NAME_LIMIT = 60;
		BASE_RULES = new Set(ROUTE_RULES);
		sanitizeToken = (text) => text.toLowerCase().replaceAll(/[^a-z0-9_]+/gu, "_").replaceAll(/_+/gu, "_").replace(/^_/u, "").replace(/_$/u, "");
		singular = (word) => {
			if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
			if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
			return word;
		};
		paramBaseName = (parts, index) => {
			const part = parts[index];
			if (part?.kind !== "param") return "";
			switch (part.rule === "prefix-variance" ? part.sharedRule : part.rule) {
				case "numeric": return "id";
				case "uuid": return "uuid";
				case "hex": return "hash";
				case "iso-date": return "date";
				case "after-uid-literal":
				case "opaque-token": return "uid";
				case "sibling-variance": {
					const previous = parts[index - 1];
					const stem = previous?.kind === "literal" ? sanitizeToken(singular(previous.value)) : "";
					return stem.length > 0 ? `${stem}_id` : "id";
				}
				case "sibling-pair-variance": {
					const role = part.pairRole ?? "namespace";
					const plural = parts[role === "name" ? index - 2 : index - 1];
					const stem = plural?.kind === "literal" ? sanitizeToken(singular(plural.value)) : "";
					return stem.length > 0 ? `${stem}_${role}` : role;
				}
			}
		};
		parameterNames = (parts) => {
			const used = new Map();
			return parts.flatMap((part, index) => {
				if (part.kind !== "param") return [];
				const base = paramBaseName(parts, index);
				const count = used.get(base) ?? 0;
				used.set(base, count + 1);
				return [count === 0 ? base : `${base}_${String(count + 1)}`];
			});
		};
		pathTemplate = (parts, names) => {
			let next = 0;
			return `/${parts.map((part) => {
				if (part.kind === "literal") return part.value;
				const name = names[next] ?? "";
				next += 1;
				return BASE_RULES.has(part.rule) ? `{${part.rule}}` : `{${name}}`;
			}).join("/")}`;
		};
		toolNameRegistry = () => ({
			used: new Set(),
			nextSuffix: new Map()
		});
		toolName = (method, parts, names, registry) => {
			const literals = parts.flatMap((part, index) => {
				if (part.kind !== "literal") return [];
				const value = part.value;
				if (value.length === 0 || DROPPED_NAME_LITERALS.has(value) || VERSION_TOKEN.test(value) || value === "uid" && parts[index + 1]?.kind === "param") return [];
				return [value.split(".")[0] ?? ""];
			});
			const base = sanitizeToken([
				method.toLowerCase(),
				...literals,
				...names.length > 0 ? ["by", ...names] : []
			].join("_")) || "tool";
			const truncate = (text, limit) => text.slice(0, limit).replace(/_+$/u, "");
			let candidate = truncate(base, TOOL_NAME_LIMIT);
			if (registry.used.has(candidate)) {
				let suffix = 2;
				for (;;) {
					const tail = `_${String(suffix)}`;
					const prefix = truncate(base, TOOL_NAME_LIMIT - tail.length);
					const namespace = compositeKey([prefix, tail.length]);
					const next = registry.nextSuffix.get(namespace) ?? suffix;
					if (next > suffix) {
						suffix = next;
						continue;
					}
					candidate = `${prefix}${tail}`;
					registry.nextSuffix.set(namespace, suffix + 1);
					if (!registry.used.has(candidate)) break;
					suffix += 1;
				}
			}
			registry.used.add(candidate);
			return candidate;
		};
		compareTools = (left, right) => compareUnicodeCodePoints(left.template, right.template) || compareUnicodeCodePoints(left.method, right.method);
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentManifestOrigin.js
var primaryOrigin;
function init_environmentManifestOrigin() {
	return (init_environmentManifestOrigin = __esmMin((() => {
		init_unicodeCodePointOrder();
		primaryOrigin = (origins) => {
			let best = null;
			for (const [origin, stats] of origins) {
				if (best === null || stats.jsonLike > best.jsonLike || stats.jsonLike === best.jsonLike && (stats.records > best.records || stats.records === best.records && compareUnicodeCodePoints(origin, best.origin) < 0)) best = {
					origin,
					...stats
				};
			}
			return best?.origin ?? null;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/EnvironmentManifestAccumulator.js
var responseTextSchema, emptyResponse, answeredEmpty, postDataSchema, JSON_LIKE_TEXT, ASSET_ESSENCES, ASSET_PREFIXES, ASSET_PATH, WRITE_METHODS$1, BODILESS_WRITE_METHODS, KEY_OVERHEAD_CHARS, UNKNOWNS$1, isJson, isJsonLike, isApiPath, isAsset, environmentName, routeParts, hasParam, EnvironmentManifestAccumulator;
function init_EnvironmentManifestAccumulator() {
	return (init_EnvironmentManifestAccumulator = __esmMin((() => {
		init_jsonShape();
		init_result();
		init_unicodeCodePointOrder();
		init_webNetworkCapture();
		init_analysisViewCoverage();
		init_recordedResponseBody();
		init_WebNetworkProjectionAccumulator();
		init_environmentManifestNames();
		init_environmentManifestOrigin();
		init_environmentManifestRules();
		init_webNetworkRouteTemplates();
		responseTextSchema = z.object({ response: z.object({
			status: z.unknown().optional(),
			content: z.object({
				text: z.unknown().optional(),
				size: z.unknown().optional()
			}).nullable().optional()
		}) });
		emptyResponse = (record) => {
			const parsed = responseTextSchema.safeParse(record.reported);
			if (!parsed.success) return false;
			const { status, content } = parsed.data.response;
			return status === 204 || status === 205 || recordedResponseBodyIsEmpty(record) || (content?.text === undefined || content.text === null) && content?.size === 0;
		};
		answeredEmpty = (group) => group.bodiless && [...group.statuses].some((status) => status >= 200 && status < 300);
		postDataSchema = z.object({ request: z.object({ postData: z.object({
			mimeType: z.unknown().optional(),
			text: z.unknown().optional()
		}).nullable().optional() }) });
		JSON_LIKE_TEXT = new Set(["text/plain", "text/markdown"]);
		ASSET_ESSENCES = new Set([
			"text/html",
			"application/xhtml+xml",
			"text/css",
			"text/javascript",
			"application/javascript",
			"application/x-javascript",
			"application/wasm"
		]);
		ASSET_PREFIXES = [
			"image/",
			"font/",
			"audio/",
			"video/"
		];
		ASSET_PATH = /\.(?:m?js|css|map|html?|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf)$/iu;
		WRITE_METHODS$1 = new Set([
			"POST",
			"PUT",
			"PATCH"
		]);
		BODILESS_WRITE_METHODS = new Set([...WRITE_METHODS$1, "DELETE"]);
		KEY_OVERHEAD_CHARS = 32;
		UNKNOWNS$1 = [
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
		];
		isJson = (essence) => essence === "application/json" || essence !== null && essence.startsWith("application/") && essence.endsWith("+json");
		isJsonLike = (essence) => isJson(essence) || essence !== null && JSON_LIKE_TEXT.has(essence);
		isApiPath = (path) => path.startsWith("/api/") || path.startsWith("/apis/");
		isAsset = (group) => [...group.contentTypes].some((essence) => ASSET_ESSENCES.has(essence) || ASSET_PREFIXES.some((prefix) => essence.startsWith(prefix))) || ASSET_PATH.test(group.api_surface_template);
		environmentName = (origin) => new URL(origin).host.toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-").replace(/^-/u, "").replace(/-$/u, "");
		routeParts = (route) => {
			const byIndex = new Map(route.segments.map((segment) => [segment.segment_index, segment]));
			return route.template.slice(1).split("/").map((text, index) => {
				const segment = byIndex.get(index);
				return segment === undefined ? {
					kind: "literal",
					value: text
				} : {
					kind: "param",
					rule: segment.rule,
					values: new Set([segment.value])
				};
			});
		};
		hasParam = (parts) => parts.some((part) => part.kind === "param");
		EnvironmentManifestAccumulator = class extends WebNetworkProjectionAccumulator {
			includeQueryParameterNames;
			#groups = new Map();
			#records = [];
			#origins = new Map();
			#rules;
			#unrepresented = 0;
			#scenarioTransactions = 0;
			#scenarioWithoutBody = 0;
			#scenarioRedactedBodies = 0;
			#unrepresentableBodyKey = false;
			constructor(maximumBytes = WEB_NETWORK_CAPTURE_LIMITS.outputBytes, includeQueryParameterNames = true, rules = [], budgetSubject = "Environment-manifest") {
				super(maximumBytes, budgetSubject);
				this.includeQueryParameterNames = includeQueryParameterNames;
				this.#rules = new Set(rules);
			}
			/** Whether the finished projection publishes body shapes, and so states their limitation. */
			get reportsBodyShapes() {
				return true;
			}
			add(record, scenarioResponseBody) {
				const limitations = this.addLimitations(record.limitations);
				if (!limitations.ok) return limitations;
				try {
					const line = readRecordedRequestLine(record.reported, this.includeQueryParameterNames, this.scratch);
					if (line === null) return this.overBudget();
					if (line.kind === "excluded") {
						this.#unrepresented += 1;
						return ok(undefined);
					}
					if (scenarioResponseBody !== undefined) {
						this.#scenarioTransactions += 1;
						if (scenarioResponseBody === "absent") this.#scenarioWithoutBody += 1;
						if (scenarioResponseBody === "redacted") this.#scenarioRedactedBodies += 1;
					}
					const route = scanRouteTemplate(line.path, this.scratch);
					if (route === null) return this.overBudget();
					const queryNames = readQueryParameterNames(line.query, this.scratch);
					if (queryNames === null) return this.overBudget();
					if (!this.scratch(textBytes(line.method.length + line.origin.length + route.template.length + route.rules.length + KEY_OVERHEAD_CHARS))) return this.overBudget();
					const key = compositeKey([
						line.method,
						line.origin,
						route.template,
						route.rules
					]);
					const group = this.#groups.get(key);
					const bodyShape = group === undefined && WRITE_METHODS$1.has(line.method) ? this.#bodyShape(record.reported) : ok(null);
					if (!bodyShape.ok) return bodyShape;
					return this.#append(record.ordinal, line, route, queryNames, {
						key,
						group
					}, {
						shape: bodyShape.value,
						empty: emptyResponse(record)
					});
				} finally {
					this.releaseTemporary();
				}
			}
			/** Read the top-level key types of the group's first recorded JSON-typed request body; nested values are never walked. */
			#bodyShape(reported) {
				const parsed = postDataSchema.safeParse(reported);
				const body = parsed.success ? parsed.data.request.postData : undefined;
				if (body === undefined || body === null || typeof body.text !== "string" || typeof body.mimeType !== "string") return ok(null);
				if (!this.scratch(textBytes(body.mimeType.length))) return this.overBudget();
				if (!isJson(mediaTypeEssence(body.mimeType))) return ok(null);
				if (!this.scratch(512 + textBytes(body.text.length) * 3)) return this.overBudget();
				const root = parseJsonObject(body.text);
				if (root === null) return ok(null);
				const entries = [];
				for (const [name, value] of Object.entries(root)) {
					if (name === "__proto__") this.#unrepresentableBodyKey = true;
					else entries.push([name, jsonValueType(value)]);
				}
				return ok({
					type: "object",
					properties: Object.fromEntries(entries)
				});
			}
			#append(ordinal, line, route, queryNames, bucket, exchange) {
				const bodyShape = exchange.shape;
				const mime = mediaTypeEssence(line.rawMime);
				let group = bucket.group;
				let bytes = 128 * 2 + textBytes(line.path.length) + textBytes(line.method.length);
				const origin = this.#origins.get(line.origin);
				if (origin === undefined) bytes += 128 * 2 + textBytes(line.origin.length);
				if (group === undefined) {
					bytes += GROUP_BYTES + textBytes(bucket.key.length) + textBytes(line.method.length) + textBytes(line.origin.length) + textBytes(route.template.length) * 2 + textBytes(route.rules.length);
					bytes += 128 * 4 * routePartCount(route.template);
					for (const segment of route.segments) bytes += SEGMENT_BYTES + 128 + textBytes(segment.value.length);
					if (bodyShape !== null) for (const name of Object.keys(bodyShape.properties)) bytes += 128 + textBytes(name.length);
				} else {
					for (const segment of route.segments) {
						const part = group.parts[segment.segment_index];
						if (part?.kind === "param" && !part.values.has(segment.value)) bytes += 128 + textBytes(segment.value.length);
					}
				}
				if (line.status !== null && !group?.statuses.has(line.status)) bytes += 128;
				if (mime !== null && !group?.contentTypes.has(mime)) bytes += 128 + textBytes(mime.length);
				for (const name of queryNames ?? []) if (!group?.queryNames.has(name)) bytes += 128 + textBytes(name.length);
				if (!this.retain(bytes)) return this.overBudget();
				const position = this.#records.length;
				this.#records.push({
					ordinal,
					method: line.method,
					path: line.path,
					status: line.status,
					contentType: mime
				});
				const jsonLike = isJsonLike(mime);
				const stats = origin ?? {
					records: 0,
					jsonLike: 0
				};
				stats.records += 1;
				if (jsonLike) stats.jsonLike += 1;
				this.#origins.set(line.origin, stats);
				if (group === undefined) {
					group = {
						method: line.method,
						origin: line.origin,
						api_surface_template: route.template,
						parts: routeParts(route),
						positions: [],
						statuses: new Set(),
						contentTypes: new Set(),
						queryNames: new Set(),
						bodyShape,
						apiPath: isApiPath(route.template),
						jsonLike: false,
						bodiless: BODILESS_WRITE_METHODS.has(line.method)
					};
					this.#groups.set(bucket.key, group);
				} else {
					for (const segment of route.segments) {
						const part = group.parts[segment.segment_index];
						if (part?.kind === "param") part.values.add(segment.value);
					}
				}
				group.positions.push(position);
				group.jsonLike ||= jsonLike;
				group.bodiless &&= exchange.empty;
				if (line.status !== null) group.statuses.add(line.status);
				if (mime !== null) group.contentTypes.add(mime);
				for (const name of queryNames ?? []) group.queryNames.add(name);
				return ok(undefined);
			}
			#tools(groups) {
				const registry = toolNameRegistry();
				return applyTemplateRules(groups, this.#rules).map((group) => {
					const names = parameterNames(group.parts);
					return {
						group,
						names,
						template: pathTemplate(group.parts, names)
					};
				}).sort((left, right) => compareTools({
					template: left.template,
					method: left.group.method
				}, {
					template: right.template,
					method: right.group.method
				})).map(({ group, names, template }) => {
					let next = 0;
					return {
						name: toolName(group.method, group.parts, names, registry),
						method: group.method,
						path_template: template,
						api_surface_template: group.api_surface_template,
						params: group.parts.flatMap((part, index) => {
							if (part.kind !== "param") return [];
							const name = names[next] ?? "";
							next += 1;
							return [{
								index,
								name,
								rule: part.rule,
								basis: "inferred",
								observed_values: [...part.values].sort(compareUnicodeCodePoints)
							}];
						}),
						query_parameter_names: [...group.queryNames].sort(compareUnicodeCodePoints),
						body_shape: group.bodyShape,
						statuses: [...group.statuses].sort((left, right) => left - right),
						content_types: [...group.contentTypes].sort(compareUnicodeCodePoints),
						record_ordinals: group.positions.map((position) => this.#records[position].ordinal)
					};
				});
			}
			/** One limitation per selected sibling rule when a route is too long for it to compare. */
			#segmentLimitLimitations(toolGroups) {
				if (!toolGroups.some((group) => group.parts.length > 32)) return [];
				return SEGMENT_LIMITED_RULES.filter((rule) => this.#rules.has(rule)).map((rule) => `Routes with more than ${String(32)} segments are not compared by ${rule}; they keep their grouped templates.`);
			}
			/** Project the complete manifest; tools, records and exclusions are sorted deterministically. */
			finish() {
				const primary = primaryOrigin(this.#origins);
				const toolGroups = [];
				const exclusions = new Map();
				for (const group of this.#groups.values()) {
					const reason = group.origin !== primary ? "other-origin" : group.apiPath || group.jsonLike || answeredEmpty(group) ? null : isAsset(group) ? "ui-page-or-asset" : "non-json";
					if (reason === null) {
						toolGroups.push(group);
						continue;
					}
					const exclusion = {
						method: group.method,
						origin: group.origin,
						path_template: group.api_surface_template,
						reason
					};
					const key = compositeKey(Object.values(exclusion));
					exclusions.set(key, {
						...exclusion,
						templated: (exclusions.get(key)?.templated ?? false) || hasParam(group.parts)
					});
				}
				const tools = this.#tools(toolGroups);
				const cited = [...new Set(tools.flatMap((tool) => tool.record_ordinals))];
				const positions = new Map(this.#records.map((record, position) => [record.ordinal, position]));
				const excluded = [...exclusions.values()].sort((left, right) => compareUnicodeCodePoints(left.origin, right.origin) || compareUnicodeCodePoints(left.path_template, right.path_template) || compareUnicodeCodePoints(left.method, right.method) || compareUnicodeCodePoints(left.reason, right.reason));
				const limitations = this.addLimitations([
					...this.reportsBodyShapes && tools.some((tool) => tool.body_shape !== null) ? ["Body shapes list top-level JSON key types from one recorded request each; they do not establish required fields or a complete schema."] : [],
					...this.#unrepresentableBodyKey ? ["A top-level __proto__ key in a recorded JSON body is omitted from body_shape; it cannot be an own property of the published object."] : [],
					...this.#segmentLimitLimitations(toolGroups),
					...this.#scenarioWithoutBody > 0 ? [`${String(this.#scenarioWithoutBody)} of ${String(this.#scenarioTransactions)} scenario transactions with a usable request line retained no response body; tools citing them replay only the recorded status and content type, either of which may be absent.`] : [],
					...this.#scenarioRedactedBodies > 0 ? [`${String(this.#scenarioRedactedBodies)} of ${String(this.#scenarioTransactions)} scenario transactions with a usable request line retained a response body with declared secret values replaced by redaction markers; tools citing them replay the redacted bytes.`] : [],
					...this.#unrepresented > 0 ? [`${String(this.#unrepresented)} retained records without a usable request line are not represented in the manifest.`] : [],
					...primary === null ? ["No retained record had a parseable origin; the manifest names no primary origin."] : []
				]);
				if (!limitations.ok) return limitations;
				return ok({
					origin: primary ?? "",
					name: primary === null ? "" : environmentName(primary),
					tools,
					records: cited.sort((left, right) => positions.get(left) - positions.get(right)).map((ordinal) => {
						const record = this.#records[positions.get(ordinal)];
						return {
							ordinal: record.ordinal,
							method: record.method,
							path: record.path,
							status: record.status,
							content_type: record.contentType
						};
					}),
					excluded: excluded.map(({ templated: _templated, ...exclusion }) => exclusion),
					unknowns: UNKNOWNS$1.map((unknown) => ({ ...unknown })),
					templated_groups: tools.filter((tool) => tool.params.length > 0).length + excluded.filter((exclusion) => exclusion.templated).length,
					coverage: completeWithinViewCoverage(tools.length, tools.length),
					limitations: this.sortedLimitations()
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/browserScenarioTransactions.js
var indexBrowserScenarioTransactions, append;
function init_browserScenarioTransactions() {
	return (init_browserScenarioTransactions = __esmMin((() => {
		indexBrowserScenarioTransactions = (events) => {
			const requestCounts = new Map();
			const responses = new Map();
			const contents = new Map();
			for (const event of events) {
				if (event.kind === "request") requestCounts.set(event.transaction_id, (requestCounts.get(event.transaction_id) ?? 0) + 1);
				else if (event.kind === "response") append(responses, event.transaction_id, event);
				else if (event.kind === "network-content") append(contents, event.source_event_sequence, event);
			}
			return {
				requestCounts,
				responses,
				contents
			};
		};
		append = (map, key, value) => {
			const existing = map.get(key);
			if (existing === undefined) map.set(key, [value]);
			else existing.push(value);
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/scenarioCaptureRecords.js
var onlyContent, headerValue, captured, retainedBody, utf8Text, scenarioContentMediaType, reportedRequest, timingByTransaction, recordTiming, record$1, scenarioCaptureRecords, member, derivedTextBytes, admitScenarioCaptureParent;
function init_scenarioCaptureRecords() {
	return (init_scenarioCaptureRecords = __esmMin((() => {
		init_analysisErrorCore();
		init_browserScenarioCapture();
		init_browserScenarioTransactions();
		init_result();
		init_analysisViewParent();
		init_webNetworkRouteTemplates();
		onlyContent = (index, sequence) => {
			const found = sequence === undefined ? undefined : index.contents.get(sequence);
			return found?.length === 1 ? found[0] : undefined;
		};
		headerValue = (headers, name) => {
			if (headers?.state !== "captured") return undefined;
			const item = headers.items.find((candidate) => candidate.name.toLowerCase() === name);
			return item?.value ?? undefined;
		};
		captured = (content) => content?.body.state === "captured" ? content.body : undefined;
		retainedBody = (content) => {
			const body = captured(content);
			return body?.redacted === true && body.bytes === 0 ? undefined : body;
		};
		utf8Text = (body) => {
			try {
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(Buffer.from(body.content, "base64"));
			} catch {
				return undefined;
			}
		};
		scenarioContentMediaType = (content) => captured(content)?.media_type ?? headerValue(content?.headers, "content-type");
		reportedRequest = (request, content, purpose) => {
			const body = purpose === "manifest" ? captured(content) : undefined;
			const text = body === undefined ? undefined : utf8Text(body);
			const mimeType = scenarioContentMediaType(content);
			return {
				method: request.method,
				bodySize: body !== undefined && !body.redacted ? body.bytes : -1,
				url: request.url.redacted ? null : request.url.url,
				...text === undefined || mimeType === undefined ? {} : { postData: {
					mimeType,
					text
				} }
			};
		};
		timingByTransaction = (events) => {
			const timing = new Map();
			for (const event of events) {
				if (event.kind !== "request-finished" && event.kind !== "request-failed") continue;
				timing.set(event.transaction_id, timing.has(event.transaction_id) ? {} : {
					started_at: event.started_at,
					elapsed_ms: event.elapsed_ms
				});
			}
			return timing;
		};
		recordTiming = (request, timing) => {
			const browser = timing.get(request.transaction_id);
			const started = browser?.started_at ?? request.observed_at;
			return started === undefined ? undefined : {
				startedDateTime: started,
				time: browser?.elapsed_ms ?? 0
			};
		};
		record$1 = (ordinal, observed, index, purpose, timing) => {
			const { item, event: request } = observed;
			const location = {
				kind: "json-pointer",
				pointer: `/events/items/${String(item)}`
			};
			const empty = {
				binary_fields: [],
				numeric_literals: [],
				redactions: [],
				limitations: []
			};
			const responses = index.responses.get(request.transaction_id) ?? [];
			const response = responses.length === 1 ? responses[0] : undefined;
			if (index.requestCounts.get(request.transaction_id) !== 1 || responses.length > 1 || (index.contents.get(request.sequence)?.length ?? 0) > 1 || response !== undefined && (index.contents.get(response.sequence)?.length ?? 0) > 1) return {
				record: {
					ordinal,
					location,
					reported: {},
					...empty
				},
				responseBody: "absent"
			};
			const requestContent = onlyContent(index, request.sequence);
			const responseContent = onlyContent(index, response?.sequence);
			const body = retainedBody(responseContent);
			const mimeType = scenarioContentMediaType(responseContent) ?? "";
			return {
				record: {
					ordinal,
					location,
					reported: {
						...timing,
						request: reportedRequest(request, requestContent, purpose),
						...response === undefined ? {} : { response: {
							status: response.status,
							content: body === undefined ? { mimeType } : {
								mimeType,
								text: body.content,
								encoding: "base64"
							}
						} }
					},
					...empty,
					binary_fields: body === undefined ? [] : [{
						pointer: "/response/content/text",
						representation: "har-base64-content",
						state: "retained",
						bytes: body.bytes,
						sha256: body.sha256,
						content_base64: body.content
					}]
				},
				responseBody: body === undefined ? "absent" : body.redacted ? "redacted" : "retained"
			};
		};
		scenarioCaptureRecords = (capture, purpose) => {
			const index = indexBrowserScenarioTransactions(capture.events.items);
			const timings = timingByTransaction(capture.events.items);
			const records = [];
			const responseBodies = new Map();
			let timed = false;
			for (const [item, event] of capture.events.items.entries()) {
				if (event.kind !== "request") continue;
				const timing = recordTiming(event, timings);
				timed ||= timing !== undefined;
				const projected = record$1(records.length, {
					event,
					item
				}, index, purpose, timing);
				records.push(projected.record);
				if (purpose === "manifest") responseBodies.set(projected.record.ordinal, projected.responseBody);
			}
			return {
				records,
				totalRecords: records.length,
				responseBodies,
				limitations: [
					"Scenario records are the capture's network transactions in request order; each record ordinal is the transaction's zero-based position.",
					...timed ? ["Scenario record start times are the browser's own, from when the request ended, or when the provider observed the request where the browser reported none; durations are the browser's own, or 0 where it reported none."] : [],
					...capture.events.dropped > 0 ? [`The scenario capture omitted ${String(capture.events.dropped)} events; the manifest covers only retained transactions.`] : []
				]
			};
		};
		member = (value, key) => typeof value === "object" && value !== null && Object.hasOwn(value, key) ? value[key] : undefined;
		derivedTextBytes = (value) => {
			const items = member(member(value, "events"), "items");
			let largestBody = 0;
			let requestText = 0;
			let responseBodyEntries = 0;
			for (const event of Array.isArray(items) ? items : []) {
				if (member(event, "kind") === "request") responseBodyEntries += 1;
				const content = member(member(event, "body"), "content");
				if (member(event, "kind") !== "network-content" || typeof content !== "string") continue;
				largestBody = Math.max(largestBody, content.length);
				if (member(event, "phase") === "request") requestText += textBytes(Math.ceil(content.length * 3 / 4));
			}
			return 64 + largestBody * 2 + requestText + responseBodyEntries * 128;
		};
		admitScenarioCaptureParent = (parent, viewKind, accumulator) => {
			const admitted = accumulator.admitCaptureClone(parent.normalizedResult);
			if (!admitted.ok) return admitted;
			const derived = accumulator.admitDerivedBytes(derivedTextBytes(parent.normalizedResult));
			if (!derived.ok) return derived;
			const parsed = retainedBrowserScenarioCaptureSchema.safeParse(parent.normalizedResult);
			if (!parsed.success) return err(analysisViewResultInputError(parent.normalizedResult, parsed.error));
			const content = parsed.data.scenario.network_content;
			if (viewKind === "environment-state" ? !content.response_body : !content.response_body && !content.header_values) return err(new AnalysisUnsupportedTargetError("inspect_analysis_view", parent.evidenceId, viewKind === "environment-state" ? "environment-state needs a capture_browser_scenario capture with capture.network.response_body selected." : "environment-manifest needs a capture_browser_scenario capture with capture.network.response_body or header_values selected."));
			return ok(scenarioCaptureRecords(parsed.data, "manifest"));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentManifestView.js
var templateRulesSchema, environmentManifestViewRequestSchema, manifestRuleSchema, jsonTypeNameSchema, toolSchema, environmentManifestFields, admitCaptureParent, groupCaptureRecords, addCaptureRecords, createEnvironmentManifestAccumulator, projectEnvironmentManifestView;
function init_environmentManifestView() {
	return (init_environmentManifestView = __esmMin((() => {
		init_analysisErrorCore();
		init_canonicalOrdering();
		init_result();
		init_EnvironmentManifestAccumulator();
		init_environmentManifestRules();
		init_WebNetworkProjectionAccumulator();
		init_scenarioCaptureRecords();
		init_webNetworkRouteTemplates();
		templateRulesSchema = z.array(z.enum(TEMPLATE_RULES)).refine((rules) => new Set(rules).size === rules.length, { message: "template_rules must not repeat a rule" }).meta({ uniqueItems: true }).default([]);
		environmentManifestViewRequestSchema = z.strictObject({
			kind: z.literal("environment-manifest"),
			template_rules: templateRulesSchema.describe("Opt-in template rules applied after the four format rules, each listed at most once: after-uid-literal templates the segment following a literal uid, opaque-token templates long mixed alphanumeric segments, sibling-variance merges groups that differ in one identifier-like segment, sibling-pair-variance merges groups that differ in two adjacent literals between a plural literal and another literal when at least three distinct pairs vary in both, prefix-variance templates a literal at a position another tool templates by one of the other opt-in rules after the same preceding segments, at any method or length, when the literal is one of that parameter's observed values, carries a digit and has the length and character classes of one, or has the single length (eight or more characters) every observed value has and only their character classes. Literal sibling folding into existing opt-in parameters also requires sibling-variance. Merged parameters are inferences."),
			include_query_parameter_names: z.boolean().default(true).describe("Include distinct observed query parameter names per tool; names do not establish required parameters or a complete API schema.")
		});
		manifestRuleSchema = z.enum([...ROUTE_RULES, ...TEMPLATE_RULES]);
		jsonTypeNameSchema = z.enum([
			"string",
			"number",
			"boolean",
			"object",
			"array",
			"null"
		]);
		toolSchema = z.strictObject({
			name: z.string(),
			method: z.string(),
			path_template: z.string(),
			api_surface_template: z.string().describe("Four-rule template of the tool's earliest record."),
			params: z.array(z.strictObject({
				index: z.number().int().nonnegative(),
				name: z.string(),
				rule: manifestRuleSchema,
				basis: z.literal("inferred"),
				observed_values: z.array(z.string())
			})),
			query_parameter_names: z.array(z.string()),
			body_shape: z.strictObject({
				type: z.literal("object"),
				properties: z.record(z.string(), jsonTypeNameSchema)
			}).nullable(),
			statuses: z.array(z.number()),
			content_types: z.array(z.string()),
			record_ordinals: z.array(z.number().int().nonnegative())
		});
		environmentManifestFields = {
			origin: z.string().describe("Primary origin: the origin with the most JSON-like records."),
			name: z.string().describe("Kebab-case environment name derived from the primary origin host."),
			tools: z.array(toolSchema),
			records: z.array(z.strictObject({
				ordinal: z.number().int().nonnegative(),
				method: z.string(),
				path: z.string(),
				status: z.number().nullable(),
				content_type: z.string().nullable()
			})).describe("Pointers to the retained parent records cited by tools; no bodies."),
			excluded: z.array(z.strictObject({
				method: z.string(),
				origin: z.string(),
				path_template: z.string(),
				reason: z.enum([
					"other-origin",
					"ui-page-or-asset",
					"non-json"
				])
			})),
			unknowns: z.array(z.strictObject({
				kind: z.enum([
					"authorization-model",
					"response-semantics",
					"state-transition"
				]),
				statement: z.string()
			})),
			templated_groups: z.number().int().nonnegative().describe("Tools and excluded groups that carry at least one templated segment.")
		};
		admitCaptureParent = (parent, viewKind, accumulator) => {
			if (parent.operation === "capture_browser_scenario") {
				const scenario = admitScenarioCaptureParent(parent, viewKind, accumulator);
				return scenario.ok ? ok({
					operation: "capture_browser_scenario",
					records: scenario.value.records,
					total_records: scenario.value.totalRecords,
					scenarioResponseBodies: scenario.value.responseBodies,
					limitations: scenario.value.limitations,
					artifact: {
						path: "",
						sha256: null
					}
				}) : scenario;
			}
			const har = admitHarCaptureParent(parent, viewKind, accumulator);
			return har.ok ? ok({
				operation: "inspect_web_network_capture",
				...har.value
			}) : har;
		};
		groupCaptureRecords = (parent, viewKind, rules, target) => {
			const admitted = admitCaptureParent(parent, viewKind, target.accumulator);
			if (!admitted.ok) return admitted;
			const added = addCaptureRecords(parent, admitted.value, rules, target);
			return added.ok ? admitted : added;
		};
		addCaptureRecords = (parent, capture, rules, target) => {
			const limitations = target.accumulator.addLimitations([
				...parent.limitations,
				...capture.limitations,
				"Tool templates, parameters and names are inferences from recorded request lines; they do not establish handler identity, URL-space schemas or causality.",
				...target.limitations,
				...rules.length > 0 ? [`Opt-in template rules ${uniqueSorted(rules).join(", ")} merge recorded literals by shape; merged parameters may conflate distinct resources.`] : [],
				...capture.records.length < capture.total_records ? [`Parent contains an ordinal subset; the ${target.noun} covers only retained records.`] : []
			]);
			if (!limitations.ok) return limitations;
			for (const record of capture.records) {
				const added = target.accumulator.add(record, capture.scenarioResponseBodies?.get(record.ordinal));
				if (!added.ok) return added;
			}
			return ok(undefined);
		};
		createEnvironmentManifestAccumulator = (view) => view.kind === "environment-manifest" ? new EnvironmentManifestAccumulator(undefined, view.include_query_parameter_names, view.template_rules) : new EnvironmentManifestAccumulator();
		projectEnvironmentManifestView = (parent, view, accumulator = createEnvironmentManifestAccumulator(view)) => {
			if (view.kind !== "environment-manifest") return err(new AnalysisUnsupportedTargetError("inspect_analysis_view", parent.evidenceId, `View ${view.kind} is unsupported for parent operation ${parent.operation}; environment-manifest requires inspect_web_network_capture or capture_browser_scenario.`));
			const grouped = groupCaptureRecords(parent, view.kind, view.template_rules, {
				accumulator,
				noun: "manifest",
				limitations: view.include_query_parameter_names ? ["Observed query parameter names do not establish required parameters, value types or a complete API schema."] : []
			});
			if (!grouped.ok) return grouped;
			const capture = grouped.value;
			const manifest = accumulator.finish();
			if (!manifest.ok) return manifest;
			return ok({
				kind: "environment-manifest",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_operation: capture.operation,
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: capture.artifact.path,
					sha256: capture.artifact.sha256
				},
				...manifest.value
			});
		};
	})))();
}

//#endregion
//#region dist/domain/exactJsonNumber.js
var isExactJsonNumber, parseExactJson;
function init_exactJsonNumber() {
	return (init_exactJsonNumber = __esmMin((() => {
		init_jsonValue();
		init_safeJson();
		isExactJsonNumber = (value, source) => source !== undefined && isSafeNumber(source) && isSafeNumber(String(value)) && !Object.is(value, -0);
		parseExactJson = (text) => {
			const parsed = safeParseJson(text, (_key, value, context) => {
				if (typeof value === "number" && !isExactJsonNumber(value, context?.source)) throw new RangeError("JSON numeric conversion would lose recorded data");
				return value;
			});
			if (!parsed.ok) return undefined;
			const value = jsonValueSchema.safeParse(parsed.value);
			return value.success ? value.data : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteValues.js
var MINUTE_MS$1, zoneMinutes, isClockZone, zoneMinutesForFormat, readIsoClock, readClock, pad$1, isoText, formatClock, respellClock, UUID, isUuid, GENERATED_INTEGER_DIGITS, generatedIntegerDigits, sortedStrings, echoed, likeGeneratedInteger, integerOf, nextSequence, spelledLike, MASKED_DIGITS, maskedCount, outgrownMask, sequenceNumber, fillMask, slugOf, isAlphanumeric, previousCharacter, nextCharacter, joinsBefore, joinsAfter, delimitedOffsets, replaceDelimited, containsDelimited, containsNumber, seededBytes, seededUuid, DIGITS, LOWER, UPPER, tokenAlphabet, seededLike, seededInteger, seededToken;
function init_environmentStateWriteValues() {
	return (init_environmentStateWriteValues = __esmMin((() => {
		init_offsetDateTime();
		init_unicodeCodePointOrder();
		MINUTE_MS$1 = 6e4;
		zoneMinutes = (zone) => {
			if (zone === "" || zone === "Z") return 0;
			if (!/^[+-]\d{2}:?\d{2}$/u.test(zone)) return undefined;
			const digits = zone.slice(1).replace(":", "");
			const hours = Number(digits.slice(0, 2));
			const remainder = Number(digits.slice(2, 4));
			if (hours > 23 || remainder > 59) return undefined;
			const minutes = hours * 60 + remainder;
			return zone.startsWith("-") ? -minutes : minutes;
		};
		isClockZone = (zone) => zoneMinutes(zone) !== undefined;
		zoneMinutesForFormat = (zone) => {
			const minutes = zoneMinutes(zone);
			if (minutes === undefined) throw new TypeError(`Invalid clock zone in a derived format: ${zone}`);
			return minutes;
		};
		readIsoClock = (value) => {
			const reading = readRecordedDateTime(value);
			if (reading === undefined || !reading.spelling.secondsPresent || reading.spelling.fractionDigits > 9) return undefined;
			const { instant, spelling } = reading;
			return {
				ms: instant.epochSecond * 1e3 + Number(`${instant.fraction}000`.slice(0, 3)),
				subMillisecond: Number(instant.fraction.padEnd(9, "0").slice(3)),
				format: {
					kind: "iso",
					separator: spelling.separator,
					fraction: spelling.fractionDigits,
					zone: spelling.zone
				},
				fixedWidth: spelling.fractionDigits > instant.fraction.length
			};
		};
		readClock = (value) => {
			if (typeof value === "string") return readIsoClock(value);
			if (typeof value !== "number" || !Number.isSafeInteger(value)) return undefined;
			if (value >= 1e9 && value < 1e10) return {
				ms: value * 1e3,
				subMillisecond: 0,
				format: {
					kind: "epoch",
					unit: "s"
				},
				fixedWidth: true
			};
			if (value >= 0xe8d4a51000 && value < 0x9184e72a000) return {
				ms: value,
				subMillisecond: 0,
				format: {
					kind: "epoch",
					unit: "ms"
				},
				fixedWidth: true
			};
			return undefined;
		};
		pad$1 = (value, width) => String(value).padStart(width, "0");
		isoText = (at, separator, digits, zone) => {
			const year = at.getUTCFullYear();
			if (!Number.isInteger(year) || year < 0 || year > 9999) return undefined;
			return `${pad$1(year, 4)}-${pad$1(at.getUTCMonth() + 1, 2)}-${pad$1(at.getUTCDate(), 2)}${separator}${pad$1(at.getUTCHours(), 2)}:${pad$1(at.getUTCMinutes(), 2)}:${pad$1(at.getUTCSeconds(), 2)}${digits === "" ? "" : `.${digits}`}${zone}`;
		};
		formatClock = (ms, format) => {
			if (format.kind === "epoch") return format.unit === "s" ? Math.floor(ms / 1e3) : ms;
			const at = new Date(ms + zoneMinutesForFormat(format.zone) * MINUTE_MS$1);
			const digits = `${pad$1(at.getUTCMilliseconds(), 3)}${"0".repeat(9)}`.slice(0, format.fraction);
			return isoText(at, format.separator, format.trimmed === true ? digits.replace(/0+$/u, "") : digits, format.zone);
		};
		respellClock = (value, format) => {
			const clock = readClock(value);
			if (clock === undefined) return value;
			if (format.kind === "epoch") return formatClock(clock.ms, format) ?? value;
			const millis = (clock.ms % 1e3 + 1e3) % 1e3;
			const digits = clock.format.kind === "epoch" ? pad$1(millis, 3).replace(/0+$/u, "") : `${pad$1(millis, 3)}${pad$1(clock.subMillisecond, 6)}`.slice(0, clock.format.fraction);
			const at = new Date(clock.ms - millis + zoneMinutesForFormat(format.zone) * MINUTE_MS$1);
			return isoText(at, format.separator, format.trimmed === true ? digits.replace(/0+$/u, "") : digits.padEnd(format.fraction, "0"), format.zone) ?? value;
		};
		UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
		isUuid = (value) => typeof value === "string" && UUID.test(value);
		GENERATED_INTEGER_DIGITS = 10;
		generatedIntegerDigits = (value) => {
			const digits = typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? String(value) : typeof value === "string" && /^[1-9]\d*$/u.test(value) ? value : undefined;
			return digits !== undefined && digits.length >= GENERATED_INTEGER_DIGITS && digits.length <= 20 ? digits : undefined;
		};
		sortedStrings = (sent) => {
			if (!Array.isArray(sent) || !sent.every((item) => typeof item === "string") || new Set(sent).size < 2) return undefined;
			const sorted = sent.toSorted(compareUnicodeCodePoints);
			return sorted.some((item, index) => item !== sent[index]) ? sorted : undefined;
		};
		echoed = (rule, sent) => rule.sorted === true ? sortedStrings(sent) ?? sent : sent;
		likeGeneratedInteger = (value, exemplar) => {
			const digits = generatedIntegerDigits(value);
			return digits !== undefined && typeof value === typeof exemplar && digits.length === generatedIntegerDigits(exemplar)?.length;
		};
		integerOf = (value) => typeof value === "number" && Number.isSafeInteger(value) ? value : typeof value === "string" && /^\d{1,15}$/u.test(value) ? Number(value) : undefined;
		nextSequence = (held, taken) => taken === undefined ? held ?? 1 : Math.max(held ?? taken + 1, taken + 1);
		spelledLike = (exemplar, value) => maskedCount(exemplar) !== undefined ? fillMask(exemplar, value) : typeof exemplar === "string" ? String(value) : value;
		MASKED_DIGITS = /^\d{2,}(?:-\d{2,})+$/u;
		maskedCount = (value) => {
			if (typeof value !== "string" || !MASKED_DIGITS.test(value)) return undefined;
			const groups = value.split("-");
			if (groups.some((group) => group.length !== groups[0].length)) return undefined;
			const digits = groups.join("");
			return digits.length <= 15 ? Number(digits) : undefined;
		};
		outgrownMask = (value, exemplar) => {
			if (typeof value !== "string" || maskedCount(exemplar) === undefined) return undefined;
			const digits = value.replaceAll("-", "");
			if (!/^\d{1,15}$/u.test(digits)) return undefined;
			const count = Number(digits);
			return fillMask(exemplar, count) === value ? count : undefined;
		};
		sequenceNumber = (value, exemplar) => integerOf(value) ?? maskedCount(value) ?? outgrownMask(value, exemplar);
		fillMask = (mask, value) => {
			const padded = String(value).padStart(mask.replace(/\D/gu, "").length, "0");
			let next = padded.length - 1;
			let out = "";
			for (let at = mask.length - 1; at >= 0; at -= 1) {
				const character = mask[at];
				if (/\d/u.test(character)) {
					out = padded[next] + out;
					next -= 1;
				} else out = character + out;
			}
			return padded.slice(0, next + 1) + out;
		};
		slugOf = (text) => text.normalize("NFKD").replace(/[̀-ͯ]/gu, "").toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "");
		isAlphanumeric = (character) => character !== undefined && /[\p{L}\p{N}]/u.test(character);
		previousCharacter = (text, at) => {
			if (at === 0) return undefined;
			const last = text.charCodeAt(at - 1);
			if (last >= 56320 && last <= 57343 && at > 1) {
				const first = text.charCodeAt(at - 2);
				if (first >= 55296 && first <= 56319) return text.slice(at - 2, at);
			}
			return text[at - 1];
		};
		nextCharacter = (text, at) => {
			const point = text.codePointAt(at);
			return point === undefined ? undefined : String.fromCodePoint(point);
		};
		joinsBefore = (text, at) => isAlphanumeric(previousCharacter(text, at));
		joinsAfter = (text, at) => isAlphanumeric(nextCharacter(text, at));
		delimitedOffsets = (text, token) => {
			const offsets = [];
			if (token.length === 0) return offsets;
			let at = text.indexOf(token);
			while (at >= 0) {
				const delimited = !joinsBefore(text, at) && !joinsAfter(text, at + token.length);
				if (delimited) offsets.push(at);
				at = text.indexOf(token, at + (delimited ? token.length : 1));
			}
			return offsets;
		};
		replaceDelimited = (text, token, replacement) => {
			let result = "";
			let from = 0;
			for (const at of delimitedOffsets(text, token)) {
				result += text.slice(from, at) + replacement;
				from = at + token.length;
			}
			return result + text.slice(from);
		};
		containsDelimited = (value, token) => {
			const pending = [value];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (typeof next === "string") {
					if (delimitedOffsets(next, token).length > 0) return true;
				} else if (typeof next === "object" && next !== null) for (const child of Array.isArray(next) ? next : Object.values(next)) pending.push(child);
			}
			return false;
		};
		containsNumber = (value, digits) => {
			const pending = [value];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (typeof next === "number") {
					if (String(next) === digits) return true;
				} else if (typeof next === "object" && next !== null) for (const child of Array.isArray(next) ? next : Object.values(next)) pending.push(child);
			}
			return false;
		};
		seededBytes = (seed, length) => {
			const bytes = new Uint8Array(length);
			for (let block = 0; block * 32 < length; block += 1) {
				const digest = createHash("sha256").update(`${seed}#${String(block)}`).digest();
				bytes.set(digest.subarray(0, Math.min(32, length - block * 32)), block * 32);
			}
			return bytes;
		};
		seededUuid = (seed, exemplar) => {
			const bytes = seededBytes(seed, 16);
			bytes[6] = bytes[6] & 15 | 64;
			bytes[8] = bytes[8] & 63 | 128;
			const hex = Buffer.from(bytes).toString("hex");
			const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
			return exemplar === exemplar.toUpperCase() && /[A-F]/u.test(exemplar) ? uuid.toUpperCase() : uuid;
		};
		DIGITS = "0123456789";
		LOWER = "abcdefghijklmnopqrstuvwxyz";
		UPPER = LOWER.toUpperCase();
		tokenAlphabet = (exemplar) => {
			if (/^[0-9a-f]+$/u.test(exemplar) && /[0-9]/u.test(exemplar)) return `${DIGITS}abcdef`;
			if (/^[0-9A-F]+$/u.test(exemplar) && /[0-9]/u.test(exemplar)) return `${DIGITS}ABCDEF`;
			const alphabet = (/[0-9]/u.test(exemplar) ? DIGITS : "") + (/[a-z]/u.test(exemplar) ? LOWER : "") + (/[A-Z]/u.test(exemplar) ? UPPER : "");
			return alphabet === "" ? LOWER : alphabet;
		};
		seededLike = (seed, exemplar, uuid = false) => uuid || isUuid(exemplar) ? seededUuid(seed, String(exemplar)) : seededToken(seed, String(exemplar));
		seededInteger = (seed, exemplar) => {
			const length = String(exemplar).length;
			const bytes = seededBytes(seed, length);
			const leading = typeof exemplar === "number" && length >= 16 ? 8 : 9;
			const digits = [...bytes].map((byte, index) => String(index === 0 ? 1 + byte % leading : byte % 10)).join("");
			return typeof exemplar === "number" ? Number(digits) : digits;
		};
		seededToken = (seed, exemplar) => {
			const alphabet = tokenAlphabet(exemplar);
			const bytes = seededBytes(seed, exemplar.length);
			return [...exemplar].map((character, index) => /[0-9A-Za-z]/u.test(character) ? alphabet[bytes[index] % alphabet.length] : character).join("");
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateCounters.js
var isObject$1, counterPath, counterAt, withCounter;
function init_environmentStateCounters() {
	return (init_environmentStateCounters = __esmMin((() => {
		isObject$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		counterPath = (counter) => counter.startsWith("/") ? counter.slice(1).split("/").map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~")) : [counter];
		counterAt = (body, counter) => counterPath(counter).reduce((value, name) => isObject$1(value) && Object.hasOwn(value, name) ? value[name] : undefined, body);
		withCounter = (body, counter, value) => {
			const set = (node, path) => {
				const [name, ...rest] = path;
				if (name === undefined) return value;
				if (!isObject$1(node) || !Object.hasOwn(node, name)) return node;
				return {
					...node,
					[name]: set(node[name], rest)
				};
			};
			return set(body, counterPath(counter));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateRules.js
var requestJson, STATE_BODY_LIMIT_BYTES, isProjectionParameter, projectsFields, selectsSomeFields, listsAll, allLines, WRITE_METHODS, QUERY_SEGMENTS, IDENTITY_NAMES, VERSION_SEGMENT, segmentsOf, isParam, isObject, scalarText, same, decodedSegment, pathSegmentMatches, collectionMatch, selectedCollection, lastSegmentValue, normalizedPath, collectionPathOf, isQueryPost, changesState, isStateWrite, writeSpanCheck, apiBaseLengths, rootOf, stateValueRetentionBytes, deeperThan, hasPrototypeKey, pointerTo, pointerTokens, memberOf, soleElement, at, replaceAt, matchingKeys, locateItem, identifies, IDENTITY_SUFFIX, suffixIdentities, identityCandidates, locateList, listItems, recordedItemCount, formatItemCount, renderStateEntity, shownKeys, isStringArray, inSetOrder, missingRequiredFields, renderStateList;
function init_environmentStateRules() {
	return (init_environmentStateRules = __esmMin((() => {
		init_comparisonSemantics();
		init_unicodeCodePointOrder();
		init_environmentStateWriteValues();
		init_webNetworkRouteTemplates();
		init_environmentStateCounters();
		requestJson = (body) => body.kind === "json" ? body.value : undefined;
		STATE_BODY_LIMIT_BYTES = 256 * 1024;
		isProjectionParameter = (name) => {
			const lower = name.toLowerCase();
			return lower === "fields" || lower.startsWith("fields[") || lower === "select" || lower === "$select";
		};
		projectsFields = (query) => query !== undefined && [...new URLSearchParams(query).keys()].some(isProjectionParameter);
		selectsSomeFields = (query) => query !== undefined && [...new URLSearchParams(query)].some(([name, value]) => isProjectionParameter(name) && value !== "*");
		listsAll = (view, ordinal) => view.membership === "all" || (view.all_record_ordinals?.includes(ordinal) ?? false);
		allLines = (view) => view.membership === "all" ? view.checked_record_ordinals : view.all_record_ordinals ?? [];
		WRITE_METHODS = new Set([
			"POST",
			"PUT",
			"PATCH",
			"DELETE"
		]);
		QUERY_SEGMENTS = new Set([
			"search",
			"query",
			"list",
			"find",
			"fuzzy",
			"lookup",
			"count",
			"aggregate",
			"stats",
			"_search",
			"_count",
			"_msearch"
		]);
		IDENTITY_NAMES = [
			"id",
			"uid",
			"uuid",
			"_id",
			"ID",
			"UID",
			"Id",
			"guid",
			"key",
			"slug",
			"name"
		];
		VERSION_SEGMENT = /^v\d+(?:\.\d+)*$/u;
		segmentsOf = (path) => {
			const segments = path.split("/");
			if (segments[0] === "") segments.shift();
			if (segments.at(-1) === "") segments.pop();
			return segments;
		};
		isParam = (segment) => segment.startsWith("{") && segment.endsWith("}");
		isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
		scalarText = (value) => typeof value === "string" ? value : typeof value === "number" ? String(value) : undefined;
		same = (left, right) => left === undefined || right === undefined ? left === right : canonicalJson(left, "Environment state") === canonicalJson(right, "Environment state");
		decodedSegment = (segment) => {
			try {
				return decodeURIComponent(segment);
			} catch {
				return segment;
			}
		};
		pathSegmentMatches = (segment, value) => segment === value || decodedSegment(segment) === value || decodedSegment(value) === segment;
		collectionMatch = (collection, segments) => {
			const held = segmentsOf(collection);
			if (held.length !== segments.length) return undefined;
			let verbatim = 0;
			for (const [index, { text, supplied }] of segments.entries()) {
				const segment = held[index];
				if (supplied ? !pathSegmentMatches(segment, text) : segment !== text) return undefined;
				if (supplied && segment === text) verbatim += 1;
			}
			return verbatim;
		};
		selectedCollection = (segments, candidates) => {
			let chosen;
			let verbatim = -1;
			for (const collection of candidates) {
				const matched = collectionMatch(collection, segments);
				if (matched !== undefined && matched > verbatim) {
					chosen = collection;
					verbatim = matched;
				}
			}
			return chosen ?? `/${segments.map(({ text, supplied }) => supplied ? encodeURIComponent(text) : text).join("/")}`;
		};
		lastSegmentValue = (path) => decodedSegment(segmentsOf(path).at(-1) ?? "");
		normalizedPath = (path) => `/${segmentsOf(path).join("/")}`;
		collectionPathOf = (record, item) => item ? `/${segmentsOf(record.path).slice(0, -1).join("/")}` : normalizedPath(record.path);
		isQueryPost = (method, path) => method === "POST" && segmentsOf(path).some((segment) => QUERY_SEGMENTS.has(segment.toLowerCase()));
		changesState = (method, path) => WRITE_METHODS.has(method) && !isQueryPost(method, path);
		isStateWrite = (record) => changesState(record.method, record.path) && (record.status === null || record.status >= 200 && record.status < 400);
		writeSpanCheck = (writes) => {
			const reach = [];
			for (const write of writes) reach.push(Math.max(reach.at(-1) ?? Number.NEGATIVE_INFINITY, write.end));
			return (earlier, later) => {
				let low = 0;
				let high = writes.length;
				while (low < high) {
					const middle = low + high >>> 1;
					if (writes[middle].start < later.end) low = middle + 1;
					else high = middle;
				}
				return low > 0 && reach[low - 1] > earlier.start;
			};
		};
		apiBaseLengths = (templates) => {
			const groups = new Map();
			for (const template of templates) {
				const segments = segmentsOf(template);
				const first = segments[0] ?? "";
				const group = groups.get(first);
				if (group === undefined) groups.set(first, [segments]);
				else group.push(segments);
			}
			return new Map([...groups.entries()].map(([first, members]) => {
				const head = members[0] ?? [];
				let length = 0;
				while (length < head.length && !isParam(head[length]) && members.every((segments) => segments[length] === head[length])) length += 1;
				return [first, length];
			}));
		};
		rootOf = (path, bases) => {
			const segments = segmentsOf(path);
			let end = Math.min(bases.get(segments[0] ?? "") ?? 0, segments.length);
			while (end < segments.length && VERSION_SEGMENT.test(segments[end])) end += 1;
			return segments.slice(0, end + 1);
		};
		stateValueRetentionBytes = (value) => {
			if (typeof value === "string") return textBytes(value.length);
			if (Array.isArray(value)) return value.reduce((sum, item) => sum + stateValueRetentionBytes(item), 128);
			if (isObject(value)) return Object.entries(value).reduce((sum, [name, item]) => sum + textBytes(name.length) + stateValueRetentionBytes(item), 128);
			return 128;
		};
		deeperThan = (value, limit) => {
			const pending = [{
				value,
				depth: 0
			}];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (next.depth > limit) return true;
				const children = Array.isArray(next.value) ? next.value : isObject(next.value) ? Object.values(next.value) : [];
				for (const child of children) pending.push({
					value: child,
					depth: next.depth + 1
				});
			}
			return false;
		};
		hasPrototypeKey = (value) => Array.isArray(value) ? value.some(hasPrototypeKey) : isObject(value) && Object.entries(value).some(([name, item]) => name === "__proto__" || hasPrototypeKey(item));
		pointerTo = (name) => `/${name.replaceAll("~", "~0").replaceAll("/", "~1")}`;
		pointerTokens = (pointer) => pointer === "" ? [] : pointer.slice(1).split("/").map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
		memberOf = (body, name) => isObject(body) && Object.hasOwn(body, name) ? body[name] : undefined;
		soleElement = (value) => Array.isArray(value) && value.length === 1 ? value[0] : undefined;
		at = (body, pointer) => {
			const [first, second, ...rest] = pointerTokens(pointer);
			if (first === undefined) return body;
			if (second !== undefined) return second === "0" && rest.length === 0 ? soleElement(memberOf(body, first)) : undefined;
			return Array.isArray(body) ? first === "0" ? soleElement(body) : undefined : memberOf(body, first);
		};
		replaceAt = (body, pointer, value) => {
			const [first, second] = pointerTokens(pointer);
			if (first === undefined) return value;
			if (at(body, pointer) === undefined) return body;
			if (!isObject(body)) return [value];
			const replaced = second === undefined ? value : [value];
			return Object.fromEntries(Object.entries(body).map(([key, item]) => [key, key === first ? replaced : item]));
		};
		matchingKeys = (object, value) => Object.keys(object).filter((key) => scalarText(object[key]) === value);
		locateItem = (body, value) => {
			const located = (object, pointer, named = false) => {
				const keys = isObject(object) ? matchingKeys(object, value).filter((key) => !named || IDENTITY_NAMES.includes(key)) : [];
				return keys.length > 0 ? [{
					pointer,
					keys
				}] : [];
			};
			const members = isObject(body) ? Object.entries(body) : [];
			const tiers = [
				located(body, ""),
				members.flatMap(([name, item]) => located(item, pointerTo(name))),
				located(soleElement(body), "/0", true),
				members.flatMap(([name, item]) => located(soleElement(item), `${pointerTo(name)}/0`, true))
			];
			const chosen = tiers.find((tier) => tier.length > 0);
			return chosen?.length === 1 ? chosen[0] : undefined;
		};
		identifies = (items, name) => {
			const seen = new Set();
			for (const item of items) {
				const value = scalarText(item[name]);
				if (value === undefined || seen.has(value)) return false;
				seen.add(value);
			}
			return true;
		};
		IDENTITY_SUFFIX = /(?:Id|_id)$/u;
		suffixIdentities = (items) => Object.keys(items[0] ?? {}).filter((name) => IDENTITY_SUFFIX.test(name) && !IDENTITY_NAMES.includes(name) && identifies(items, name));
		identityCandidates = (items) => [...IDENTITY_NAMES.filter((name) => identifies(items, name)), ...suffixIdentities(items)];
		locateList = (body, idField) => {
			if (Array.isArray(body)) return body.every(isObject) ? "" : undefined;
			if (!isObject(body) || IDENTITY_NAMES.some((name) => scalarText(body[name]) !== undefined)) return undefined;
			const arrays = Object.entries(body).filter((entry) => Array.isArray(entry[1]) && entry[1].every(isObject));
			const carrying = (test) => arrays.filter(([, items]) => items.length > 0 && test(items));
			const tiers = idField === undefined ? [
				carrying((items) => IDENTITY_NAMES.some((name) => identifies(items, name))),
				carrying((items) => items.length > 1 && suffixIdentities(items).length > 0),
				arrays
			] : [carrying((items) => identifies(items, idField)), arrays];
			const chosen = tiers.find((entries) => entries.length > 0);
			return chosen?.length === 1 ? pointerTo(chosen[0][0]) : undefined;
		};
		listItems = (body, pointer) => {
			const items = at(body, pointer);
			return Array.isArray(items) && items.every(isObject) ? items : undefined;
		};
		recordedItemCount = (value) => typeof value === "number" ? value : typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : undefined;
		formatItemCount = (count, observed) => typeof observed === "string" ? String(count).padStart(observed.length, "0") : count;
		renderStateEntity = (entity, view, volatileFields, observed) => {
			const own = entity.view_fields.find((candidate) => candidate.tool === view.tool)?.fields ?? {};
			const formats = view.clock_formats ?? {};
			const nested = view.nested_fields ?? {};
			const sorted = new Set(view.sorted_arrays);
			return Object.fromEntries(view.fields.flatMap((name) => {
				const source = observed !== undefined && volatileFields.has(name) ? observed : Object.hasOwn(own, name) ? own : entity.fields;
				if (!Object.hasOwn(source, name)) return [];
				const value = source !== entity.fields ? source[name] : Object.hasOwn(formats, name) ? respellClock(source[name], formats[name]) : Object.hasOwn(nested, name) ? shownKeys(source[name], nested[name]) : source[name];
				return [[name, sorted.has(name) ? inSetOrder(value) : value]];
			}));
		};
		shownKeys = (value, keys) => isObject(value) ? Object.fromEntries(keys.flatMap((key) => Object.hasOwn(value, key) ? [[key, value[key]]] : [])) : value;
		isStringArray = (value) => Array.isArray(value) && value.every((item) => typeof item === "string");
		inSetOrder = (value) => isStringArray(value) ? value.toSorted(compareUnicodeCodePoints) : value;
		missingRequiredFields = (entity, view, volatileFields) => {
			const shown = renderStateEntity(entity, view, volatileFields);
			return view.required_fields.filter((name) => !Object.hasOwn(shown, name));
		};
		renderStateList = (view, base, items) => {
			const listed = listItems(base, view.pointer)?.length;
			return view.counters.reduce((body, name) => {
				const observed = counterAt(base, name);
				if (listed === undefined || recordedItemCount(observed) !== listed) return body;
				return withCounter(body, name, formatItemCount(items.length, observed));
			}, replaceAt(base, view.pointer, [...items]));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateMerge.js
var compareObservedEntities, mergeObservedEntity, classifyEntityChanges;
function init_environmentStateMerge() {
	return (init_environmentStateMerge = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		compareObservedEntities = (left, right) => compareUnicodeCodePoints(left.type, right.type) || compareUnicodeCodePoints(left.collection, right.collection) || left.order[0] - right.order[0] || left.order[1] - right.order[1];
		mergeObservedEntity = (entity) => {
			const latest = new Map();
			for (const observation of entity.observations) latest.set(observation.tool, observation);
			const fields = new Map();
			const ranked = [...latest.values()].sort((left, right) => Number(left.item) - Number(right.item) || left.position - right.position);
			for (const observation of ranked) for (const [name, value] of Object.entries(observation.object)) fields.set(name, value);
			return {
				type: entity.type,
				collection: entity.collection,
				id: entity.id,
				fields: Object.fromEntries(fields),
				view_fields: [...latest.values()].map((observation) => ({
					tool: observation.tool,
					fields: Object.fromEntries(Object.entries(observation.object).filter(([name, value]) => !same(fields.get(name), value)))
				})).filter((view) => Object.keys(view.fields).length > 0).sort((left, right) => compareUnicodeCodePoints(left.tool, right.tool)),
				record_ordinals: [...new Set(entity.observations.toSorted((left, right) => left.position - right.position).map((observation) => observation.ordinal))]
			};
		};
		classifyEntityChanges = (entities, lineOf, writeBetween) => {
			const rewritten = new Set();
			const volatile = new Map();
			const spans = [];
			const rewrite = (type, earlier, later) => {
				rewritten.add(type);
				spans.push({
					type,
					earlier: earlier.ordinal,
					later: later.ordinal
				});
			};
			const changed = (before, after) => Object.keys(after.object).filter((name) => Object.hasOwn(before.object, name) && !same(before.object[name], after.object[name]));
			for (const entity of entities) {
				const timeline = [...entity.observations].sort((left, right) => left.position - right.position);
				const lastOfLine = new Map();
				const lastOfField = new Map();
				timeline.forEach((after) => {
					const line = JSON.stringify(lineOf(after));
					const repeat = lastOfLine.get(line);
					if (repeat !== undefined) {
						if (writeBetween(repeat, after)) {
							if (!same(repeat.object, after.object)) rewrite(entity.type, repeat, after);
						} else for (const name of changed(repeat, after)) volatile.set(entity.type, (volatile.get(entity.type) ?? new Set()).add(name));
					}
					const sighting = {
						observation: after,
						line
					};
					for (const name of Object.keys(after.object)) {
						const previous = lastOfField.get(name);
						if (previous !== undefined && previous.line !== line && !same(previous.observation.object[name], after.object[name]) && writeBetween(previous.observation, after)) rewrite(entity.type, previous.observation, after);
						lastOfField.set(name, sighting);
					}
					lastOfLine.set(line, after);
				});
			}
			return {
				rewritten,
				volatile,
				spans
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWords.js
var identifierWords;
function init_environmentStateWords() {
	return (init_environmentStateWords = __esmMin((() => {
		identifierWords = (text) => text.split(/[^A-Za-z0-9]+|(?<=[a-z0-9])(?=[A-Z])/u).filter((word) => word.length > 0).map((word) => word.toLowerCase());
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateOrderParameters.js
var SORT, DIRECTION, ORDER_NAMES, ORDER_STARTS, ORDER_WORDS, DIRECTION_NAMES, DIRECTION_ONLY, wordsOf$1, appliesOrder, namesDirection, directionOf, orderRole;
function init_environmentStateOrderParameters() {
	return (init_environmentStateOrderParameters = __esmMin((() => {
		init_environmentStateWords();
		SORT = new Set([
			"order",
			"orderby",
			"order_by",
			"ordering",
			"sort",
			"sortby",
			"sort_by"
		]);
		DIRECTION = new Set([
			"dir",
			"direction",
			"order",
			"orderdirection",
			"order_direction",
			"sortdir",
			"sort_dir",
			"sortorder",
			"sort_order"
		]);
		ORDER_NAMES = new Set([...SORT, ...DIRECTION].map((name) => name.replaceAll("_", "")));
		ORDER_STARTS = new Set([
			"order",
			"ordering",
			"sort",
			"sorter",
			"sorters",
			"sorts"
		]);
		ORDER_WORDS = new Set([
			"asc",
			"by",
			"column",
			"desc",
			"dir",
			"direction",
			"field",
			"key",
			"mode",
			"order",
			"type"
		]);
		DIRECTION_NAMES = new Set([...DIRECTION].map((name) => name.replaceAll("_", "")));
		DIRECTION_ONLY = new Set([...DIRECTION].filter((name) => !SORT.has(name)).map((name) => name.replaceAll("_", "")));
		wordsOf$1 = (name) => identifierWords(name.replace(/\[[^\]]*\]/gu, ""));
		appliesOrder = (name) => {
			const words = wordsOf$1(name);
			if (words.length === 0) return false;
			return words.length === 1 && words[0] === "reverse" || ORDER_NAMES.has(words.join("")) || ORDER_STARTS.has(words[0]) && words.slice(1).every((word) => ORDER_WORDS.has(word));
		};
		namesDirection = (name) => {
			const words = wordsOf$1(name);
			const last = words.at(-1);
			return name === "_order" || DIRECTION_ONLY.has(words.join("")) || last === "dir" || last === "direction" || words.length === 1 && last === "reverse";
		};
		directionOf = (value) => {
			const lower = value.toLowerCase();
			if (lower === "asc" || lower === "ascending") return "asc";
			if (lower === "desc" || lower === "descending") return "desc";
			return undefined;
		};
		orderRole = (name, value) => {
			if (!appliesOrder(name)) return undefined;
			const directional = namesDirection(name) || DIRECTION_NAMES.has(wordsOf$1(name).join(""));
			if (directional && directionOf(value) !== undefined) return "direction";
			if (!namesDirection(name)) return "sort";
			return name.toLowerCase() === "reverse" && ![
				"",
				"0",
				"false"
			].includes(value.toLowerCase()) ? "none" : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateInitialOrder.js
var RANDOM, defaultOrder, orderByWholeLines;
function init_environmentStateInitialOrder() {
	return (init_environmentStateInitialOrder = __esmMin((() => {
		init_environmentStateOrderParameters();
		RANDOM = new Set([
			"random",
			"rand",
			"shuffle",
			"seed"
		]);
		defaultOrder = (query) => [...new URLSearchParams(query ?? "").keys()].every((name) => !appliesOrder(name) && !RANDOM.has(name.toLowerCase()));
		orderByWholeLines = (entities, queryOf) => {
			const collections = new Map();
			for (const entity of entities) {
				const key = `${entity.type}\u0000${entity.collection}`;
				const members = collections.get(key);
				if (members === undefined) collections.set(key, [entity]);
				else members.push(entity);
			}
			for (const members of collections.values()) {
				const lines = new Map();
				for (const entity of members) for (const observation of entity.observations) {
					if (observation.item) continue;
					const line = lines.get(observation.ordinal);
					if (line === undefined) lines.set(observation.ordinal, {
						position: observation.position,
						listed: 1
					});
					else line.listed += 1;
				}
				let first;
				for (const [ordinal, line] of lines) if (line.listed === members.length && (first === undefined || line.position < first[1]) && defaultOrder(queryOf(ordinal))) first = [ordinal, line.position];
				if (first === undefined) continue;
				for (const entity of members) {
					const sighting = entity.observations.find((observation) => !observation.item && observation.ordinal === first[0]);
					entity.order = [sighting.position, sighting.index];
				}
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateRewrites.js
var rewriteCuts;
function init_environmentStateRewrites() {
	return (init_environmentStateRewrites = __esmMin((() => {
		rewriteCuts = (spans, writes, byOrdinal) => {
			const reach = [];
			for (const write of writes) reach.push(Math.max(reach.at(-1) ?? Number.NEGATIVE_INFINITY, write.end));
			const starts = writes.map((write) => write.start);
			/** The first index whose value passes `test`, which once true stays true. */
			const first = (values, test) => {
				let [low, high] = [0, values.length];
				while (low < high) {
					const middle = low + high >>> 1;
					if (test(values[middle])) high = middle;
					else low = middle + 1;
				}
				return low;
			};
			const cuts = new Map();
			for (const span of spans) {
				const earlier = byOrdinal.get(span.earlier);
				const later = byOrdinal.get(span.later);
				if (earlier === undefined || later === undefined) continue;
				const index = first(reach, (end) => end > earlier.start);
				if (index < first(starts, (start) => start >= later.end)) cuts.set(span.type, Math.min(index, cuts.get(span.type) ?? index));
			}
			return new Map([...cuts].map(([type, index]) => [type, writes[index]]));
		};
	})))();
}

//#endregion
//#region dist/contracts/analysisSearchContract.js
var analysisSearchInput;
function init_analysisSearchContract() {
	return (init_analysisSearchContract = __esmMin((() => {
		analysisSearchInput = {
			pattern: z.string().min(1).describe("The literal text or regex pattern to search for"),
			mode: z.enum(["literal", "regex"]).default("literal"),
			case_sensitive: z.boolean().default(false).describe("Whether to match case; case-insensitive matching uses Unicode simple case folding, one character at a time"),
			document: z.string().optional().describe("The document name")
		};
	})))();
}

//#endregion
//#region dist/domain/analysisSearch.js
var analysisSearchQuerySchema, literalSubstringPredicate, analysisSearchPredicate;
function init_analysisSearch() {
	return (init_analysisSearch = __esmMin((() => {
		init_analysisSearchContract();
		init_analysisErrorCore();
		analysisSearchQuerySchema = z.object(analysisSearchInput);
		literalSubstringPredicate = (pattern, caseSensitive) => {
			if (caseSensitive) return (value) => value.includes(pattern);
			const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
			const regex = new RegExp(escaped, "iu");
			return (value) => regex.test(value);
		};
		analysisSearchPredicate = (query) => {
			if (query.mode === "regex") {
				let regex;
				try {
					regex = new RegExp(query.pattern, query.case_sensitive ? "u" : "iu");
				} catch (cause) {
					throw new AnalysisInputError("search", { cause });
				}
				return (value) => regex.test(value);
			}
			return literalSubstringPredicate(query.pattern, query.case_sensitive);
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateListQuery.js
var LIMIT, OFFSET, SEARCH, IDENTIFYING, MAX_COMBINATIONS, MAX_QUERY_NAMES, plainSearch, textOf$1, holds$1, contains, normalized, sortKey, ascending, integer, PAGING_ROLES, readCall, sorted, evaluateQuery, answerQuery, filterFields, isUrl, searchFields, choicesFor, lineChoices, listsAsRecorded, withoutIdleFilters, explainLine, mergeRoles, namedLike, trustedRoles, learnQuery, queryTotalCount, renderQueryList;
function init_environmentStateListQuery() {
	return (init_environmentStateListQuery = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_analysisSearch();
		init_environmentStateOrderParameters();
		init_environmentStateRules();
		init_environmentStateCounters();
		LIMIT = new Set([
			"count",
			"itemsperpage",
			"limit",
			"page_size",
			"pagesize",
			"per_page",
			"perpage",
			"size",
			"take"
		]);
		OFFSET = new Set([
			"_start",
			"offset",
			"skip",
			"start"
		]);
		SEARCH = new Set([
			"keyword",
			"keywords",
			"q",
			"query",
			"search",
			"search_term",
			"searchterm",
			"term"
		]);
		IDENTIFYING = [
			"id",
			"slug",
			"name"
		];
		MAX_COMBINATIONS = 256;
		MAX_QUERY_NAMES = 12;
		plainSearch = (value) => !/[:#"()[\]{}<>|*?\\]/u.test(value) && !/(?:^|\s)(?:AND|OR|NOT)(?:\s|$)/u.test(value) && !/(?:^|\s)[+-]\S/u.test(value);
		textOf$1 = (value) => typeof value === "boolean" ? String(value) : scalarText(value);
		holds$1 = (field, value) => {
			const names = (item) => isObject(item) && IDENTIFYING.some((key) => textOf$1(item[key]) === value);
			return Array.isArray(field) ? field.some((item) => textOf$1(item) === value || names(item)) : textOf$1(field) === value || names(field);
		};
		contains = (fields, term) => {
			if (term === "") return () => true;
			const matches = literalSubstringPredicate(term, false);
			return (entity) => fields.some((field) => {
				const value = entity.fields[field];
				return typeof value === "string" && matches(value);
			});
		};
		normalized = (name) => name.toLowerCase().replace(/[^a-z0-9]/gu, "");
		sortKey = (value, names) => {
			const field = (spelled) => {
				if (names.includes(spelled)) return spelled;
				const found = names.filter((name) => normalized(name) === normalized(spelled));
				return found.length === 1 ? found[0] : undefined;
			};
			if (names.includes(value)) return {
				field: value,
				descending: false
			};
			if (value.startsWith("-")) {
				const named = field(value.slice(1));
				return named === undefined ? undefined : {
					field: named,
					descending: true
				};
			}
			const whole = field(value);
			if (whole !== undefined) return {
				field: whole,
				descending: false
			};
			const suffixed = /^(.+?)[\s:_-](asc|desc)$/iu.exec(value);
			const named = suffixed === null ? undefined : field(suffixed[1]);
			return named === undefined ? undefined : {
				field: named,
				descending: suffixed[2].toLowerCase() === "desc"
			};
		};
		ascending = (left, right) => {
			const absent = (value) => value === undefined || value === null;
			if (absent(left) || absent(right)) return absent(left) ? absent(right) ? 0 : 1 : -1;
			if (typeof left === "number" && typeof right === "number") return left - right;
			const a = textOf$1(left) ?? JSON.stringify(left);
			const b = textOf$1(right) ?? JSON.stringify(right);
			return compareUnicodeCodePoints(a.toLowerCase(), b.toLowerCase());
		};
		integer = (value) => {
			const number = Number(value);
			return /^-?\d+$/u.test(value) && Number.isSafeInteger(number) ? number : undefined;
		};
		PAGING_ROLES = new Set([
			"sort",
			"direction",
			"limit",
			"offset",
			"page"
		]);
		readCall = (parameters, values) => {
			const call = {
				selections: [],
				offset: 0
			};
			const taken = new Set();
			for (const [name, value] of values) {
				const parameter = Object.hasOwn(parameters, name) ? parameters[name] : undefined;
				const number = integer(value);
				if (parameter === undefined || taken.has(parameter.role)) return undefined;
				if (PAGING_ROLES.has(parameter.role)) taken.add(parameter.role);
				if (parameter.role === "filter") call.selections.push((entity) => holds$1(entity.fields[parameter.field], value));
				else if (parameter.role === "search") {
					if (!plainSearch(value)) return undefined;
					call.selections.push(contains(parameter.fields, value));
				} else if (parameter.role === "sort") call.sort = value;
				else if (parameter.role === "direction") {
					const direction = directionOf(value);
					if (direction === undefined) return undefined;
					call.direction = direction;
				} else if (parameter.role === "inert") {
					if (!parameter.values.includes(value)) return undefined;
				} else if (number === undefined) return undefined;
				else if (parameter.role === "limit") call.limit = number > 0 ? number : undefined;
				else if (parameter.role === "offset" && number >= 0) call.offset = number;
				else if (parameter.role === "page" && number >= parameter.first) call.page = {
					index: number,
					first: parameter.first
				};
				else return undefined;
			}
			return call;
		};
		sorted = (matched, entities, call) => {
			if (call.sort === undefined || matched.length === 0) return {
				entities: [...matched],
				positional: "all"
			};
			const names = [...new Set(entities.flatMap((entity) => Object.keys(entity.fields)))];
			const key = sortKey(call.sort, names);
			if (key === undefined) return undefined;
			const sign = (call.direction === undefined ? key.descending : call.direction === "desc") ? -1 : 1;
			const ordered = matched.map((entity, index) => ({
				entity,
				index
			})).sort((left, right) => sign * ascending(left.entity.fields[key.field], right.entity.fields[key.field]) || left.index - right.index).map(({ entity }) => entity);
			const tied = (left, right) => left !== undefined && right !== undefined && ascending(left.fields[key.field], right.fields[key.field]) === 0;
			return {
				entities: ordered,
				positional: ordered.filter((entity, index) => tied(ordered[index - 1], entity) || tied(entity, ordered[index + 1]))
			};
		};
		evaluateQuery = (parameters, values, entities) => {
			const call = readCall(parameters, values);
			if (call === undefined) return undefined;
			const selection = sorted(entities.filter((entity) => call.selections.every((selects) => selects(entity))), entities, call);
			if (selection === undefined) return undefined;
			const matched = selection.entities;
			let { offset } = call;
			const { limit, page } = call;
			if (page !== undefined && page.index > page.first) {
				if (limit === undefined) return undefined;
				offset += (page.index - page.first) * limit;
			}
			return {
				page: matched.slice(offset, limit === undefined ? undefined : offset + limit),
				total: matched.length,
				positional: selection.positional
			};
		};
		answerQuery = (query, values, entities) => {
			const result = evaluateQuery(query.parameters, values, entities);
			return result === undefined ? undefined : {
				...result,
				whole: result.page.length === result.total && [...values.keys()].every((name) => PAGING_ROLES.has(query.parameters[name].role))
			};
		};
		filterFields = (items, name, value) => items.length === 0 ? [] : Object.keys(items[0]).filter((field) => items.every((item) => holds$1(item[field], value))).sort((left, right) => Number(normalized(right) === normalized(name)) - Number(normalized(left) === normalized(name))).slice(0, 4);
		isUrl = (value) => /^[a-z][a-z0-9+.-]*:\/\//iu.test(value);
		searchFields = (items, term) => {
			if (term === "") return [];
			const matchesTerm = literalSubstringPredicate(term, false);
			const fields = new Set();
			for (const item of items) {
				const matching = Object.keys(item).filter((field) => {
					const value = item[field];
					return typeof value === "string" && matchesTerm(value);
				});
				const plain = matching.filter((field) => !isUrl(item[field]));
				for (const field of plain.length > 0 ? plain : matching) fields.add(field);
			}
			return [...fields].sort(compareUnicodeCodePoints);
		};
		choicesFor = (name, value, items) => {
			const key = name.toLowerCase();
			const choices = [];
			const number = integer(value);
			if ((LIMIT.has(key) || OFFSET.has(key) || key === "page") && (number === undefined || (OFFSET.has(key) || key === "page") && number < 0) || SEARCH.has(key) && !plainSearch(value)) return [];
			const order = orderRole(name, value);
			if (order !== undefined) return order === "none" ? [] : [{ role: order }];
			if (LIMIT.has(key)) choices.push({ role: "limit" });
			else if (OFFSET.has(key)) choices.push({ role: "offset" });
			else if (key === "page") choices.push({
				role: "page",
				first: 1
			}, {
				role: "page",
				first: 0
			});
			else if (SEARCH.has(key)) {
				const fields = searchFields(items, value);
				if (fields.length > 0) choices.push({
					role: "search",
					fields
				});
			}
			if (choices.length === 0 || SEARCH.has(key)) for (const field of filterFields(items, name, value)) choices.push({
				role: "filter",
				field
			});
			choices.push({
				role: "inert",
				values: [value]
			});
			return choices;
		};
		lineChoices = (values, items) => values.size > MAX_QUERY_NAMES ? [] : [...values].map(([name, value]) => [name, choicesFor(name, value, items)]);
		listsAsRecorded = (line, parameters) => {
			const result = evaluateQuery(parameters, line.values, line.entities);
			return result !== undefined && result.page.length === line.listed.length && result.page.every((entity, index) => entity.id === line.listed[index]);
		};
		withoutIdleFilters = (line, chosen) => Object.fromEntries(Object.entries(chosen).map(([name, role]) => {
			const value = line.values.get(name);
			return role.role === "filter" && line.entities.every((entity) => holds$1(entity.fields[role.field], value)) ? [name, {
				role: "inert",
				values: [value]
			}] : [name, role];
		}));
		explainLine = (line) => {
			const options = line.choices;
			let tried = 0;
			const search = (index, chosen) => {
				if (index === options.length) {
					tried += 1;
					return listsAsRecorded(line, chosen) ? withoutIdleFilters(line, chosen) : undefined;
				}
				const [name, choices] = options[index];
				for (const choice of choices) {
					if (tried >= MAX_COMBINATIONS) return undefined;
					const found = search(index + 1, {
						...chosen,
						[name]: choice
					});
					if (found !== undefined) return found;
				}
				return undefined;
			};
			const found = search(0, {});
			if (found === undefined) return undefined;
			for (const [name, role] of Object.entries(found)) {
				if (role.role !== "page") continue;
				for (const candidate of line.choices.find(([key]) => key === name)?.[1] ?? []) {
					if (candidate.role !== "page" || candidate.first === role.first) continue;
					if (tried >= MAX_COMBINATIONS) return undefined;
					tried++;
					if (listsAsRecorded(line, {
						...found,
						[name]: candidate
					})) return undefined;
				}
			}
			return found;
		};
		mergeRoles = (explained) => {
			const roles = new Map();
			for (const parameters of explained) for (const [name, role] of Object.entries(parameters)) roles.set(name, [...roles.get(name) ?? [], role]);
			const merged = [];
			for (const [name, seen] of roles) {
				const active = seen.filter((role) => role.role !== "inert");
				if (active.length === 0) {
					merged.push([name, {
						role: "inert",
						values: [...new Set(seen.flatMap((role) => role.role === "inert" ? role.values : []))].sort(compareUnicodeCodePoints)
					}]);
					continue;
				}
				const [first] = active;
				if (first.role === "search") {
					if (active.every((role) => role.role === "search")) merged.push([name, {
						role: "search",
						fields: [...new Set(active.flatMap((role) => role.role === "search" ? role.fields : []))].sort(compareUnicodeCodePoints)
					}]);
					continue;
				}
				if (active.every((role) => JSON.stringify(role) === JSON.stringify(first))) merged.push([name, first]);
			}
			return Object.fromEntries(merged);
		};
		namedLike = (field, name) => {
			const [left, right] = [normalized(field), normalized(name)];
			return left === right || right === `${left}id` || left === `${right}id`;
		};
		trustedRoles = (parameters, explained) => Object.fromEntries(Object.entries(parameters).filter(([name, role]) => {
			if (role.role !== "filter" || namedLike(role.field, name)) return true;
			const values = new Set(explained.filter((entry) => entry.parameters[name]?.role === "filter").map((entry) => entry.line.values.get(name)));
			return values.size >= 2;
		}));
		learnQuery = (lines) => {
			const explained = lines.flatMap((line) => {
				const parameters = explainLine(line);
				return parameters === undefined ? [] : [{
					line,
					parameters
				}];
			});
			if (explained.length === 0) return undefined;
			const parameters = trustedRoles(mergeRoles(explained.map((entry) => entry.parameters)), explained);
			const record_ordinals = lines.filter((line) => listsAsRecorded(line, parameters)).map((line) => line.ordinal);
			return record_ordinals.length === 0 ? undefined : {
				parameters,
				record_ordinals
			};
		};
		queryTotalCount = (value) => {
			const count = recordedItemCount(value);
			return count !== undefined && Number.isSafeInteger(count) && count >= 0 && (typeof value !== "string" || String(count) === value) ? count : undefined;
		};
		renderQueryList = (view, base, items, total) => view.query.totals.reduce((body, name) => {
			const recorded = counterAt(base, name);
			return queryTotalCount(recorded) === undefined ? body : withCounter(body, name, formatItemCount(total, recorded));
		}, renderStateList(view, base, items));
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateViewSpellings.js
var sameKeys, ClockSpellings;
function init_environmentStateViewSpellings() {
	return (init_environmentStateViewSpellings = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteValues();
		init_webNetworkRouteTemplates();
		sameKeys = (left, shown) => left.length === Object.keys(shown).length && left.every((key) => Object.hasOwn(shown, key));
		ClockSpellings = class {
			retain;
			/** Each category retains one spelling or a permanent mixed marker, never an expanding format history. */
			#fields = new Map();
			/** Per object field, the keys every recording showed in the first one's order, or null once two differ, and whether one showed fewer than stored. */
			#shapes = new Map();
			constructor(retain) {
				this.retain = retain;
				retain(128);
			}
			#shape(field, shown, stored) {
				const keys = Object.keys(shown);
				const projects = isObject(stored) && Object.keys(stored).some((key) => !Object.hasOwn(shown, key));
				const facts = this.#shapes.get(field);
				if (facts === undefined) {
					this.retain(128 * 2 + textBytes(field.length) + keys.reduce((sum, key) => sum + 128 + textBytes(key.length), 0));
					this.#shapes.set(field, {
						keys,
						projects
					});
					return;
				}
				if (facts.keys !== null && !sameKeys(facts.keys, shown)) facts.keys = null;
				facts.projects ||= projects;
			}
			#note(field, category, format) {
				let facts = this.#fields.get(field);
				if (facts === undefined) {
					this.retain(128 + textBytes(field.length));
					facts = {
						matched: undefined,
						other: undefined
					};
					this.#fields.set(field, facts);
				}
				const held = facts[category];
				if (held === undefined) {
					if (format !== null) this.retain(128 + (format.kind === "iso" ? textBytes(format.zone.length) : 0));
					facts[category] = format;
				} else if (held !== null && !same(held, format)) facts[category] = null;
			}
			note(stored, shown) {
				for (const [field, value] of Object.entries(shown)) {
					if (isObject(value)) this.#shape(field, value, stored[field]);
					const now = readClock(value);
					if (now === undefined) continue;
					const was = Object.hasOwn(stored, field) ? readClock(stored[field]) : undefined;
					if (was === undefined || was.ms !== now.ms || was.subMillisecond !== now.subMillisecond) {
						this.#note(field, "other", now.format);
						continue;
					}
					const spelled = same(stored[field], value) ? null : now.format;
					this.#note(field, "matched", spelled);
				}
			}
			/** The fields whose objects every recording showed with the same keys, fewer than one stored. */
			get #nested() {
				const nested = [...this.#shapes].flatMap(([field, { keys, projects }]) => keys !== null && projects ? [[field, keys]] : []);
				return nested.length === 0 ? {} : { nested_fields: Object.fromEntries(nested) };
			}
			/** The view members: the spelling of fields it always spells otherwise, and the keys of objects it shows fewer of. */
			get view() {
				const formats = [];
				for (const [field, { matched, other }] of this.#fields) {
					if (matched === undefined || matched === null || other === null || other !== undefined && !same(other, matched)) continue;
					if (formats.length === 0) this.retain(128 * 2);
					this.retain(128 * 2 + textBytes(field.length));
					formats.push([field, matched]);
				}
				return {
					...formats.length === 0 ? {} : { clock_formats: Object.fromEntries(formats) },
					...this.#nested
				};
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateResponseMembers.js
var MINIMUM_REPEATS, succeeded$4, mintedValues, tally, repeatPairs, mintedOf, perResponseMembers, mintedFor, pointerRoot, envelopeMembers, withoutMembers, mintedEnvelope, declaredMembers;
function init_environmentStateResponseMembers() {
	return (init_environmentStateResponseMembers = __esmMin((() => {
		init_comparisonSemantics();
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_environmentStateWriteValues();
		init_webNetworkRouteTemplates();
		MINIMUM_REPEATS = 2;
		succeeded$4 = (record) => record.status !== null && record.status >= 200 && record.status < 300;
		mintedValues = (body) => {
			if (body === undefined || !isObject(body)) return undefined;
			const values = new Map();
			for (const [name, value] of Object.entries(body)) if (typeof value === "string" && value.length <= 64 && (isUuid(value) || readClock(value) !== undefined)) values.set(name, value);
			return values;
		};
		tally = (counts, key, differ, retain) => {
			let entry = counts.get(key);
			if (entry === undefined) {
				retain(128 * 2 + textBytes(key.length));
				entry = {
					differ: 0,
					same: 0
				};
				counts.set(key, entry);
			}
			if (differ) entry.differ += 1;
			else entry.same += 1;
		};
		repeatPairs = (input) => {
			const previous = new Map();
			const pairs = [];
			for (const record of input.records) {
				if (record.method !== "GET" || !succeeded$4(record)) continue;
				const line = `${record.path}?${record.query ?? ""}`;
				const earlier = previous.get(line);
				input.retain(earlier === undefined ? 128 * 2 + textBytes(line.length) : 0);
				previous.set(line, record);
				if (earlier === undefined || input.writeWithin(earlier, record)) continue;
				input.retain(128 * 3);
				pairs.push([
					line,
					earlier,
					record
				]);
			}
			return pairs;
		};
		mintedOf = (byPath, byName) => {
			const minted = new Map();
			for (const [key, counts] of byPath) {
				const [path, name] = JSON.parse(key);
				const overall = byName.get(name);
				if (counts.same > 0 || counts.differ === 0) continue;
				if (overall.same > 0 || overall.differ < MINIMUM_REPEATS) continue;
				minted.set(path, (minted.get(path) ?? new Set()).add(name));
			}
			return minted;
		};
		perResponseMembers = (input) => {
			const release = input.checkpoint();
			const pairs = repeatPairs(input);
			const parsed = new Map();
			const valuesOf = (line, record) => {
				const kept = parsed.get(line);
				if (kept?.ordinal === record.ordinal) return kept.values;
				const values = input.withBody(record.ordinal, mintedValues);
				for (const [name, value] of values ?? []) input.retain(128 + textBytes(name.length + value.length));
				return values;
			};
			const byPath = new Map();
			const byName = new Map();
			for (const [line, earlier, record] of pairs) {
				const before = valuesOf(line, earlier);
				const after = valuesOf(line, record);
				parsed.set(line, {
					ordinal: record.ordinal,
					values: after
				});
				if (before === undefined || after === undefined) continue;
				const path = normalizedPath(record.path);
				for (const name of new Set([...before.keys(), ...after.keys()])) {
					const was = before.get(name);
					const now = after.get(name);
					const differ = was !== undefined && now !== undefined && was !== now;
					tally(byPath, JSON.stringify([path, name]), differ, input.retain);
					tally(byName, name, differ, input.retain);
				}
			}
			const minted = mintedOf(byPath, byName);
			release();
			for (const [path, names] of minted) input.retain(128 * 2 + textBytes(path.length) + [...names].reduce((bytes, name) => bytes + 128 + textBytes(name.length), 0));
			return minted;
		};
		mintedFor = (minted, records) => {
			let common;
			for (const path of new Set(records.map((record) => normalizedPath(record.path)))) {
				const names = minted.get(path);
				if (names === undefined) return new Set();
				if (common === undefined) common = new Set(names);
				else for (const name of common) if (!names.has(name)) common.delete(name);
				if (common.size === 0) return common;
			}
			return common ?? new Set();
		};
		pointerRoot = (pointer) => pointer.slice(1).split("/")[0].replaceAll("~1", "/").replaceAll("~0", "~");
		envelopeMembers = (body, names, pointer) => {
			if (body === undefined || !isObject(body) || pointer === "") return [];
			const root = pointer === undefined ? undefined : pointerRoot(pointer);
			return Object.keys(body).filter((name) => names.has(name) && name !== root).sort(compareUnicodeCodePoints);
		};
		withoutMembers = (body, names) => {
			if (names === undefined || names.length === 0 || !isObject(body)) return body;
			const copy = { ...body };
			for (const name of names) if (Object.hasOwn(copy, name)) copy[name] = null;
			return copy;
		};
		mintedEnvelope = (body, pointer, names) => {
			const members = envelopeMembers(body, names, pointer);
			return {
				skeleton: canonicalJson(withoutMembers(replaceAt(body, pointer, null), members), "Environment state"),
				members
			};
		};
		declaredMembers = (members, retain) => {
			if (members === undefined || members.length === 0) return {};
			for (const name of members) retain(128 + textBytes(name.length));
			return { per_response_members: [...members] };
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStatePaging.js
var PAGING_PARAMETERS, isPagingParameter, pagesOnly, PAGE_POSITION_PARAMETERS, startsAtBeginning, PAGE_SIZE_PARAMETERS, pageLimit, pageBound;
function init_environmentStatePaging() {
	return (init_environmentStatePaging = __esmMin((() => {
		init_recordedTransportUrl();
		PAGING_PARAMETERS = new Set([
			"limit",
			"offset",
			"page",
			"per_page",
			"perpage",
			"page_size",
			"pagesize",
			"size",
			"start",
			"_start",
			"_end"
		]);
		isPagingParameter = (name) => PAGING_PARAMETERS.has(name.toLowerCase());
		pagesOnly = (query) => query === undefined || [...parseUrlQueryParameterNames(query)].every(isPagingParameter);
		PAGE_POSITION_PARAMETERS = new Set([
			"offset",
			"start",
			"_start",
			"page"
		]);
		startsAtBeginning = (query) => {
			if (!pagesOnly(query)) return false;
			for (const [name, value] of iterateUrlQueryParameters(query ?? "")) {
				const number = Number(value);
				if (!/^\d+$/u.test(value) || !Number.isSafeInteger(number)) return false;
				if (PAGE_POSITION_PARAMETERS.has(name.toLowerCase()) && number !== 0) return false;
			}
			return true;
		};
		PAGE_SIZE_PARAMETERS = new Set([
			"limit",
			"per_page",
			"perpage",
			"page_size",
			"pagesize",
			"size"
		]);
		pageLimit = (query, unboundedZero) => {
			let size = Infinity;
			const range = {
				start: 0,
				end: Infinity
			};
			for (const [name, value] of iterateUrlQueryParameters(query ?? "")) {
				const key = name.toLowerCase();
				if (!/^\d+$/u.test(value)) continue;
				const number = Number(value);
				if (PAGE_SIZE_PARAMETERS.has(key)) {
					if (number > 0 || !unboundedZero) size = Math.min(size, number);
				} else if (key === "_start") range.start = number;
				else if (key === "_end") range.end = number;
			}
			const width = Math.min(size, Math.max(range.end - range.start, 0));
			return Number.isFinite(width) ? width : undefined;
		};
		pageBound = (query, recorded) => pageLimit(query, recorded > 0);
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateListFacts.js
var listFacts, itemTotals, LISTED_NOUNS, isItemTotal, CONTINUATION_NAMES, continues;
function init_environmentStateListFacts() {
	return (init_environmentStateListFacts = __esmMin((() => {
		init_environmentStateWords();
		init_unicodeCodePointOrder();
		init_environmentStatePaging();
		init_environmentStateResponseMembers();
		init_environmentStateRules();
		listFacts = (context, plan, union) => {
			const field = context.idField(plan.type);
			const whole = new Set();
			const counting = new Map();
			const names = mintedFor(context.minted, plan.latest);
			const minted = new Set();
			for (const record of plan.latest) context.withBody(record.ordinal, (body) => {
				const items = body === undefined ? undefined : listItems(body, plan.pointer);
				if (body === undefined || items === undefined) return;
				for (const name of envelopeMembers(body, names, plan.pointer)) minted.add(name);
				items.forEach((item) => union.add(item));
				const parent = plan.pointer === "" || !isObject(body) ? {} : body;
				const counted = itemTotals(parent, plan.pointer).filter(([, value]) => recordedItemCount(value) !== undefined);
				counting.set(record.ordinal, counted.filter(([, value]) => recordedItemCount(value) === items.length).map(([counter]) => counter));
				if (!startsAtBeginning(record.query) || counted.some(([, value]) => recordedItemCount(value) !== items.length) || Object.keys(parent).some((name) => continues(name, parent[name]))) return;
				const ids = items.map((item) => scalarText(item[field]) ?? "");
				const expected = context.inCollection(plan.type, collectionPathOf(record, false)).map((entity) => entity.id);
				if (same(ids, expected)) whole.add(record.ordinal);
			});
			const counters = [...new Set([...counting.values()].flat())].sort(compareUnicodeCodePoints);
			return {
				whole,
				counters,
				minted: [...minted].sort(compareUnicodeCodePoints)
			};
		};
		itemTotals = (parent, listPointer) => {
			const root = pointerTokens(listPointer)[0];
			const totals = [];
			for (const [name, value] of Object.entries(parent)) if (isItemTotal(name)) totals.push([name.startsWith("/") ? pointerTo(name) : name, value]);
			else if (isObject(value) && name !== root) {
				for (const [inner, count] of Object.entries(value)) if (isItemTotal(inner)) totals.push([`${pointerTo(name)}${pointerTo(inner)}`, count]);
			}
			return totals;
		};
		LISTED_NOUNS = new Set([
			"elements",
			"entries",
			"items",
			"results"
		]);
		isItemTotal = (name) => {
			const tokens = identifierWords(name);
			return (tokens.some((token) => token === "total" || token === "count" || token === "totalcount" || token === "itemcount") || tokens.includes("number") && tokens.some((token) => LISTED_NOUNS.has(token))) && !tokens.some((token) => token === "page" || token === "pages" || token === "per");
		};
		CONTINUATION_NAMES = new Set([
			"hasmore",
			"next",
			"nextcursor",
			"nextpage",
			"nextpagetoken",
			"nexttoken"
		]);
		continues = (name, value) => CONTINUATION_NAMES.has(identifierWords(name).join("")) && value !== undefined && value !== null && value !== false && value !== "";
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateGate.js
var replayedReads, FieldUnion, recorded, itemMismatch, checkItemPlan, listQuery, listReproduces, checkListPlan;
function init_environmentStateGate() {
	return (init_environmentStateGate = __esmMin((() => {
		init_environmentStateWords();
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_environmentStateCounters();
		init_environmentStateListQuery();
		init_recordedTransportUrl();
		init_environmentStateViewSpellings();
		init_environmentStateResponseMembers();
		init_environmentStateListFacts();
		init_webNetworkRouteTemplates();
		replayedReads = (plan) => plan.projected === undefined || plan.projected.length === 0 ? {} : {
			projected_record_ordinals: [...plan.projected],
			...plan.projectedKeys === undefined || plan.projectedKeys.length === 0 ? {} : { projected_query_keys: [...plan.projectedKeys] }
		};
		FieldUnion = class {
			fields = [];
			/** Membership beside the ordered list, so a wide object is not scanned per key. */
			#seen = new Set();
			#required;
			add(object) {
				for (const key of Object.keys(object)) if (!this.#seen.has(key)) {
					this.#seen.add(key);
					this.fields.push(key);
				}
				const keys = new Set(Object.keys(object));
				this.#required = this.#required === undefined ? keys : new Set([...this.#required].filter((key) => keys.has(key)));
			}
			get required() {
				return this.fields.filter((key) => this.#required?.has(key) === true);
			}
			/** Retained bytes of the field lists a plan keeps. */
			get bytes() {
				return this.fields.reduce((sum, name) => sum + 128 * 2 + textBytes(name.length) * 2, 128 * 2);
			}
		};
		recorded = (plan, reason) => ({
			tool: plan.tool.name,
			shape: "recorded",
			reason
		});
		itemMismatch = (context, plan, check, record) => {
			const { view, envelope } = check;
			const entity = context.entity(plan.type, collectionPathOf(record, true), lastSegmentValue(record.path));
			return context.withBody(record.ordinal, (body) => {
				const object = body === undefined ? undefined : at(body, plan.pointer);
				if (entity === undefined || body === undefined || !isObject(object)) return "fields-differ";
				const { skeleton, members } = mintedEnvelope(body, plan.pointer, check.minted);
				if (envelope.skeleton === undefined) {
					context.retain(textBytes(skeleton.length));
					envelope.skeleton = skeleton;
					envelope.members = members;
				}
				if (skeleton !== envelope.skeleton) return "envelope-varies";
				check.spellings.note(entity.fields, object);
				const shown = renderStateEntity(entity, view, context.volatileOf(plan.type), object);
				return same(shown, object) ? undefined : "fields-differ";
			});
		};
		checkItemPlan = (context, plan) => {
			const union = new FieldUnion();
			for (const record of plan.latest) context.withBody(record.ordinal, (body) => {
				const object = body === undefined ? undefined : at(body, plan.pointer);
				if (isObject(object)) union.add(object);
			});
			context.retain(union.bytes);
			const view = {
				tool: plan.tool.name,
				fields: union.fields
			};
			const envelope = {};
			const spellings = new ClockSpellings(context.retain);
			const minted = mintedFor(context.minted, plan.latest);
			for (const record of plan.latest) {
				const reason = itemMismatch(context, plan, {
					view,
					envelope,
					spellings,
					minted
				}, record);
				if (reason !== undefined) return recorded(plan, reason);
			}
			return {
				tool: plan.tool.name,
				shape: "item",
				type: plan.type,
				pointer: plan.pointer,
				fields: union.fields,
				required_fields: union.required,
				envelope_ordinal: plan.latest[0].ordinal,
				...declaredMembers(envelope.members, context.retain),
				checked_record_ordinals: plan.latest.map((record) => record.ordinal),
				...replayedReads(plan),
				...spellings.view
			};
		};
		listQuery = (context, plan, whole) => {
			const field = context.idField(plan.type);
			const lines = [];
			const counts = new Map();
			for (const record of plan.latest) {
				const values = whole.has(record.ordinal) ? undefined : singleQueryValues(record.query);
				if (values === undefined || values.size === 0) continue;
				context.withBody(record.ordinal, (body) => {
					const items = body === undefined ? undefined : listItems(body, plan.pointer);
					if (body === undefined || items === undefined) return;
					const choices = lineChoices(values, items);
					context.retain(128 * (items.length + choices.length * 4 + 2));
					lines.push({
						ordinal: record.ordinal,
						values,
						choices,
						listed: items.map((item) => scalarText(item[field]) ?? ""),
						entities: context.inCollection(plan.type, collectionPathOf(record, false))
					});
					const parent = plan.pointer === "" || !isObject(body) ? {} : body;
					counts.set(record.ordinal, itemTotals(parent, plan.pointer).flatMap(([name, value]) => {
						const count = queryTotalCount(value);
						return count === undefined ? [] : [[name, count]];
					}));
				});
			}
			const learned = learnQuery(lines);
			if (learned === undefined) return undefined;
			const totals = new Set();
			const contradicted = new Set();
			const answered = new Set(learned.record_ordinals);
			for (const line of lines) {
				if (!answered.has(line.ordinal)) continue;
				const { total } = evaluateQuery(learned.parameters, line.values, line.entities);
				for (const [name, count] of counts.get(line.ordinal) ?? []) {
					if (identifierWords(counterPath(name).at(-1)).includes("number")) continue;
					if (count === total) totals.add(name);
					else contradicted.add(name);
				}
			}
			return {
				...learned,
				totals: [...totals].filter((name) => !contradicted.has(name)).sort(compareUnicodeCodePoints)
			};
		};
		listReproduces = (context, plan, check, record) => {
			const { view, spellings } = check;
			const field = context.idField(plan.type);
			const collection = collectionPathOf(record, false);
			return context.withBody(record.ordinal, (body) => {
				const items = body === undefined ? undefined : listItems(body, plan.pointer);
				if (body === undefined || items === undefined) return false;
				const observed = new Map(items.map((item) => [scalarText(item[field]) ?? "", item]));
				const computed = view.query?.record_ordinals.includes(record.ordinal) ? evaluateQuery(view.query.parameters, singleQueryValues(record.query) ?? new Map(), context.inCollection(plan.type, collection)) : undefined;
				const members = view.whole.has(record.ordinal) ? context.inCollection(plan.type, collection) : computed?.page ?? items.flatMap((item) => {
					const entity = context.entity(plan.type, collection, scalarText(item[field]) ?? "");
					return entity === undefined ? [] : [entity];
				});
				const rendered = members.map((entity) => {
					const item = observed.get(entity.id);
					if (item !== undefined) spellings?.note(entity.fields, item);
					return renderStateEntity(entity, view, context.volatileOf(plan.type), item);
				});
				const answer = view.query === undefined || computed === undefined && !view.whole.has(record.ordinal) ? renderStateList(view, body, rendered) : renderQueryList({
					...view,
					query: view.query
				}, body, rendered, computed?.total ?? rendered.length);
				return same(answer, body);
			});
		};
		checkListPlan = (context, plan) => {
			const union = new FieldUnion();
			const { whole, counters, minted } = listFacts(context, plan, union);
			context.retain(union.bytes);
			const base = {
				tool: plan.tool.name,
				fields: union.fields,
				pointer: plan.pointer,
				counters,
				whole
			};
			let query = listQuery(context, plan, whole);
			if (query !== undefined) {
				const failing = plan.latest.filter((record) => query.record_ordinals.includes(record.ordinal) && !listReproduces(context, plan, { view: {
					...base,
					query
				} }, record));
				const kept = query.record_ordinals.filter((ordinal) => !failing.some((record) => record.ordinal === ordinal));
				query = kept.length === 0 ? undefined : {
					...query,
					record_ordinals: kept
				};
			}
			const view = {
				...base,
				query
			};
			const all = plan.latest.every((record) => whole.has(record.ordinal));
			const spellings = new ClockSpellings(context.retain);
			if (!plan.latest.every((record) => listReproduces(context, plan, {
				view,
				spellings
			}, record))) return recorded(plan, "list-differs");
			return {
				tool: plan.tool.name,
				shape: "list",
				type: plan.type,
				pointer: plan.pointer,
				fields: union.fields,
				required_fields: union.required,
				membership: all ? "all" : "recorded",
				...all || whole.size === 0 ? {} : { all_record_ordinals: plan.latest.map((record) => record.ordinal).filter((ordinal) => whole.has(ordinal)) },
				counters,
				...query === undefined ? {} : { query },
				...declaredMembers(minted, context.retain),
				checked_record_ordinals: plan.latest.map((record) => record.ordinal),
				...replayedReads(plan),
				...spellings.view
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteCutoffs.js
var node, StateWriteCutoffs;
function init_environmentStateWriteCutoffs() {
	return (init_environmentStateWriteCutoffs = __esmMin((() => {
		init_webNetworkRouteTemplates();
		init_environmentStateRules();
		node = () => ({
			children: new Map(),
			wildcard: undefined,
			exact: undefined,
			first: undefined
		});
		StateWriteCutoffs = class {
			before;
			#root;
			constructor(writes, bases, before, retain) {
				this.before = before;
				retain(128 * 4);
				this.#root = node();
				for (const write of writes) {
					let current = this.#root;
					current.first = this.#earlier(current.first, write);
					for (const segment of rootOf(write.path, bases)) {
						const wildcard = isParam(segment);
						let child = wildcard ? current.wildcard : current.children.get(segment);
						if (child === undefined) {
							retain(128 * 4 + textBytes(segment.length));
							child = node();
							if (wildcard) current.wildcard = child;
							else current.children.set(segment, child);
						}
						current = child;
						current.first = this.#earlier(current.first, write);
					}
					current.exact = this.#earlier(current.exact, write);
				}
			}
			#earlier(left, right) {
				if (right === undefined) return left;
				return left === undefined || this.before(right, left) ? right : left;
			}
			/** Earliest ancestor/descendant match; parameters on either side match any one segment. */
			first(root) {
				const nodes = [this.#root];
				const depths = [0];
				let first;
				while (nodes.length > 0) {
					const current = nodes.pop();
					const depth = depths.pop();
					first = this.#earlier(first, current.exact);
					if (depth === root.length || depth === root.length - 1 && isParam(root[depth])) {
						first = this.#earlier(first, current.first);
						continue;
					}
					const segment = root[depth];
					if (isParam(segment)) {
						for (const child of current.children.values()) {
							nodes.push(child);
							depths.push(depth + 1);
						}
					} else {
						const child = current.children.get(segment);
						if (child !== undefined) {
							nodes.push(child);
							depths.push(depth + 1);
						}
					}
					if (current.wildcard !== undefined) {
						nodes.push(current.wildcard);
						depths.push(depth + 1);
					}
				}
				return first;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteClockFormats.js
var MINUTE_MS, pad, matchesClockFormat, fittedClockFormat, showsFixedWidth, noteFixedWidths, trimmedLike, CLOCK_PATTERNS, clockDigits;
function init_environmentStateWriteClockFormats() {
	return (init_environmentStateWriteClockFormats = __esmMin((() => {
		init_environmentStateWriteValues();
		MINUTE_MS = 6e4;
		pad = (value, width) => String(value).padStart(width, "0");
		matchesClockFormat = (format, reading) => {
			if (reading === undefined) return false;
			const spelled = reading.format;
			if (format.kind === "epoch") return spelled.kind === "epoch" && spelled.unit === format.unit;
			return spelled.kind === "iso" && spelled.separator === format.separator && spelled.zone === format.zone && (format.trimmed === true ? !reading.fixedWidth && spelled.fraction <= format.fraction : spelled.fraction === format.fraction);
		};
		fittedClockFormat = (format, value, exemplar) => {
			const reading = readClock(value);
			if (reading === undefined) return undefined;
			if (matchesClockFormat(format, reading)) return format;
			const spelled = reading.format;
			if (format.kind !== "iso" || spelled.kind !== "iso" || spelled.separator !== format.separator || spelled.zone !== format.zone || reading.fixedWidth) return undefined;
			if (format.trimmed !== true) {
				const learned = readClock(exemplar);
				return learned === undefined || learned.fixedWidth ? undefined : {
					...format,
					fraction: Math.max(format.fraction, spelled.fraction),
					trimmed: true
				};
			}
			return {
				...format,
				fraction: spelled.fraction
			};
		};
		showsFixedWidth = (format, value) => {
			const reading = readClock(value);
			return reading !== undefined && reading.fixedWidth && format.kind === "iso" && reading.format.kind === "iso" && reading.format.separator === format.separator && reading.format.zone === format.zone;
		};
		noteFixedWidths = (seen, fields) => {
			for (const [field, value] of Object.entries(fields)) {
				const reading = readClock(value);
				if (reading?.fixedWidth === true && reading.format.kind === "iso" && !seen.has(field)) seen.set(field, value);
			}
		};
		trimmedLike = (format, trimmed, value) => {
			const reading = readClock(value);
			return format.kind === "iso" && trimmed.kind === "iso" && trimmed.trimmed === true && format.trimmed !== true && format.separator === trimmed.separator && format.zone === trimmed.zone && reading !== undefined && !reading.fixedWidth ? {
				...format,
				fraction: Math.max(format.fraction, trimmed.fraction),
				trimmed: true
			} : format;
		};
		CLOCK_PATTERNS = [
			"YYYYMMDDhhmmss",
			"YYYYMMDD",
			"YYYY-MM-DD",
			"YYYY/MM/DD"
		];
		clockDigits = (value, pattern) => {
			const clock = readClock(value);
			if (clock === undefined) return undefined;
			const zone = clock.format.kind === "iso" ? zoneMinutesForFormat(clock.format.zone) : 0;
			const at = new Date(clock.ms + zone * MINUTE_MS);
			const year = at.getUTCFullYear();
			if (!Number.isInteger(year) || year < 0 || year > 9999) return undefined;
			const [y, m, d] = [
				pad(year, 4),
				pad(at.getUTCMonth() + 1, 2),
				pad(at.getUTCDate(), 2)
			];
			switch (pattern) {
				case "YYYYMMDDhhmmss": return `${y}${m}${d}${pad(at.getUTCHours(), 2)}${pad(at.getUTCMinutes(), 2)}${pad(at.getUTCSeconds(), 2)}`;
				case "YYYYMMDD": return `${y}${m}${d}`;
				case "YYYY-MM-DD": return `${y}-${m}-${d}`;
				case "YYYY/MM/DD": return `${y}/${m}/${d}`;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteRules.js
var siblingTrimmedClocks, alikeRules, keptOrders, classifyWrite, unservedPlan, pathValuesOf, prefixRelated;
function init_environmentStateWriteRules() {
	return (init_environmentStateWriteRules = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteValues();
		init_environmentStateWriteClockFormats();
		siblingTrimmedClocks = (rules, values, ...later) => {
			const trimmed = new Map();
			for (const rule of rules) {
				if (rule.rule !== "clock" || rule.format.kind !== "iso" || rule.format.trimmed !== true) continue;
				const format = rule.format;
				const group = `${format.separator}${format.zone}`;
				const widest = trimmed.get(group);
				if (widest === undefined || format.fraction > widest.fraction) trimmed.set(group, format);
			}
			if (trimmed.size === 0) return [...rules];
			return rules.map((rule) => {
				if (rule.rule !== "clock" || rule.format.kind !== "iso") return rule;
				const peer = trimmed.get(`${rule.format.separator}${rule.format.zone}`);
				if (peer === undefined) return rule;
				const format = later.some((fields) => showsFixedWidth(rule.format, fields[rule.field])) ? rule.format : trimmedLike(rule.format, peer, values?.[rule.field]);
				return format === rule.format ? rule : {
					...rule,
					format
				};
			});
		};
		alikeRules = (held, later, kept = new Set()) => {
			if (held.rule !== "echo" || later.rule !== "echo") return same(held, later) ? held : undefined;
			if (held.sorted === true === (later.sorted === true)) return held;
			if (kept.has(held.field)) return undefined;
			return held.sorted === true ? held : later;
		};
		keptOrders = (body, stored) => Object.keys(body).filter((member) => sortedStrings(body[member]) !== undefined && same(stored[member], body[member]));
		classifyWrite = (tool, types, documents) => {
			const segments = segmentsOf(tool.path_template);
			const path = normalizedPath(tool.path_template);
			const parent = `/${segments.slice(0, -1).join("/")}`;
			const item = segments.length > 0 && isParam(segments.at(-1));
			if (tool.method === "POST" && types.has(path)) return {
				effect: "create",
				target: path
			};
			if (item && types.has(parent)) {
				if (tool.method === "DELETE") return {
					effect: "delete",
					target: parent
				};
				if ([
					"PUT",
					"PATCH",
					"POST"
				].includes(tool.method)) return {
					effect: "update",
					target: parent
				};
			}
			const document = documents.get(path);
			if (document !== undefined && [
				"PUT",
				"PATCH",
				"POST"
			].includes(tool.method)) return {
				effect: "document",
				target: document
			};
			return {
				effect: "none",
				target: null
			};
		};
		unservedPlan = (tool, effect, target, reason) => ({
			tool,
			effect,
			target,
			served: false,
			reason,
			exemplar_ordinal: null,
			observation: null,
			response: null,
			body: null,
			rules: [],
			collection: null,
			insert: null,
			merge: null,
			checked_record_ordinals: [],
			contradicted_by: null
		});
		pathValuesOf = (template, path) => {
			const pattern = segmentsOf(template);
			const concrete = segmentsOf(path);
			if (pattern.length !== concrete.length) return undefined;
			const values = new Map();
			for (const [index, segment] of pattern.entries()) {
				const value = concrete[index];
				if (!isParam(segment)) {
					if (segment !== value) return undefined;
					continue;
				}
				values.set(segment.slice(1, -1), decodedSegment(value));
			}
			return values;
		};
		prefixRelated = (left, right) => {
			const a = segmentsOf(left);
			const b = segmentsOf(right);
			const shared = Math.min(a.length, b.length);
			for (let index = 0; index < shared; index += 1) if (!isParam(a[index]) && !isParam(b[index]) && !pathSegmentMatches(a[index], b[index])) return false;
			return true;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteLinks.js
var MIN_ID_LENGTH, DESCRIPTIVE_NAMES, succeeded$3, identityValues, respondedIds, identitiesIn, listedIds, showsItem, shownIds, keptIds, freshIds, createdIdsOf, readType, creationLimit, linkedCreate, linkedCollection, recordedPathValues, sameLinkedSource, linkedTarget;
function init_environmentStateWriteLinks() {
	return (init_environmentStateWriteLinks = __esmMin((() => {
		init_environmentStateRules();
		init_webNetworkRouteTemplates();
		init_environmentStateWriteRules();
		MIN_ID_LENGTH = 4;
		DESCRIPTIVE_NAMES = new Set([
			"key",
			"slug",
			"name"
		]);
		succeeded$3 = (record) => record.status !== null && record.status >= 200 && record.status < 300;
		identityValues = (object) => isObject(object) ? IDENTITY_NAMES.flatMap((name) => {
			const value = scalarText(object[name]);
			return value === undefined ? [] : [value];
		}) : [];
		respondedIds = (body) => {
			if (body === undefined || body === null) return [];
			const named = (value) => {
				const text = scalarText(value);
				return text !== undefined && text.length >= MIN_ID_LENGTH ? [text] : [];
			};
			if (!isObject(body)) return named(body);
			const members = Object.values(body);
			return [...new Set([
				...identityValues(body),
				...members.length === 1 ? named(members[0]) : [],
				...members.flatMap(identityValues)
			])];
		};
		identitiesIn = (root) => {
			const shown = new Set();
			const pending = root === undefined ? [] : [root];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (Array.isArray(next)) for (const child of next) pending.push(child);
				else if (isObject(next)) {
					for (const id of identityValues(next)) shown.add(id);
					for (const child of Object.values(next)) pending.push(child);
				}
			}
			return shown;
		};
		listedIds = (body) => {
			const pointer = body === undefined ? undefined : locateList(body, undefined);
			const items = body === undefined || pointer === undefined ? undefined : listItems(body, pointer);
			if (items === undefined) return identitiesIn(body);
			const candidates = items.length < 2 ? [] : identityCandidates(items);
			const suffixed = candidates.some((name) => IDENTITY_NAMES.includes(name) && !DESCRIPTIVE_NAMES.has(name)) ? undefined : candidates.find((name) => !IDENTITY_NAMES.includes(name));
			return new Set([...items.flatMap(identityValues), ...suffixed === undefined ? [] : items.flatMap((item) => scalarText(item[suffixed]) ?? [])]);
		};
		showsItem = (body, id) => body !== undefined && body !== null && locateItem(body, id) !== undefined;
		shownIds = (record, item, body) => {
			if (!item) return listedIds(body);
			const id = lastSegmentValue(record.path);
			return showsItem(body, id) ? new Set([id]) : new Set();
		};
		keptIds = (shown, returned, retain) => {
			const kept = new Set();
			for (const id of shown) if (returned.has(id)) {
				retain(128 + textBytes(id.length));
				kept.add(id);
			}
			retain(128);
			return kept;
		};
		freshIds = (ids, shown, post, until) => {
			const before = (read) => read.at < post.at && read.end <= post.start;
			const seen = shown.some(before);
			return ids.filter((id) => {
				const short = id.length < MIN_ID_LENGTH;
				return (!short || seen) && !shown.some((read) => before(read) && read.ids.has(id)) && shown.some((read) => !before(read) && read.at < until && (!short || read.item) && read.ids.has(id));
			});
		};
		createdIdsOf = (writes, idsOf) => writes.flatMap((record) => {
			if (record.method !== "POST" || !succeeded$3(record)) return [];
			const ids = idsOf(record.ordinal);
			return ids.length === 0 ? [] : [{
				record,
				ids
			}];
		});
		readType = (template) => {
			const segments = segmentsOf(template);
			const item = segments.length > 0 && isParam(segments.at(-1));
			return {
				item,
				type: item ? `/${segments.slice(0, -1).join("/")}` : normalizedPath(template)
			};
		};
		creationLimit = (creations, reads, until) => {
			if (creations.length === 0) return undefined;
			const returned = new Set(creations.flatMap((creation) => creation.ids));
			const end = until === undefined ? Infinity : reads.position(until);
			const readers = reads.tools.flatMap((tool) => {
				const read = readType(tool.path_template);
				return tool.method === "GET" && read.type === reads.type ? [{
					tool,
					item: read.item
				}] : [];
			});
			const shown = readers.flatMap(({ tool, item }) => tool.record_ordinals.flatMap((ordinal) => {
				const record = reads.records.get(ordinal);
				if (record === undefined || !succeeded$3(record)) return [];
				const at = reads.position(record);
				if (at >= end) return [];
				const ids = reads.withBody(ordinal, (body) => shownIds(record, item, body));
				return [{
					at,
					end: record.end,
					item,
					ids: keptIds(ids, returned, reads.retain)
				}];
			}));
			for (const creation of [...creations].sort((left, right) => reads.position(left.record) - reads.position(right.record))) {
				const at = reads.position(creation.record);
				if (at >= end) break;
				const post = {
					at,
					start: creation.record.start
				};
				if (freshIds(creation.ids, shown, post, end).length > 0) return creation.record;
			}
			return undefined;
		};
		linkedCreate = (input) => {
			const { tool, records } = input;
			const own = new Set(tool.record_ordinals);
			const first = records.findIndex((record) => own.has(record.ordinal) && succeeded$3(record));
			if (first === -1) return undefined;
			const post = records[first];
			const ids = new Set(input.respondedIds(post.ordinal));
			if (ids.size === 0) return undefined;
			const before = records.slice(0, first).filter((record) => record.end <= post.start);
			for (const record of records.slice(first + 1)) {
				if (!own.has(record.ordinal) && input.isWrite(record)) return undefined;
				const view = input.viewOf(record.ordinal);
				if (record.method !== "GET" || !succeeded$3(record) || view?.shape !== "item" || !ids.has(lastSegmentValue(record.path)) || !input.showsItem(record.ordinal, lastSegmentValue(record.path))) continue;
				const id = lastSegmentValue(record.path);
				const collection = collectionPathOf(record, true);
				const readBefore = before.some((earlier) => {
					const read = input.viewOf(earlier.ordinal);
					return earlier.method === "GET" && succeeded$3(earlier) && lastSegmentValue(earlier.path) === id && (read?.shape === "item" && read.type === view.type || normalizedPath(collectionPathOf(earlier, true)) === normalizedPath(collection)) && input.showsItem(earlier.ordinal, id);
				});
				const held = readBefore || input.entities.some((entity) => entity.type === view.type && entity.id === id) || before.some((earlier) => {
					const read = input.viewOf(earlier.ordinal);
					return earlier.method === "GET" && succeeded$3(earlier) && (read?.shape === "list" && read.type === view.type || normalizedPath(earlier.path) === normalizedPath(collection)) && input.shownIds(earlier.ordinal).has(id);
				});
				const unseen = id.length < MIN_ID_LENGTH && !before.some((earlier) => {
					const read = input.viewOf(earlier.ordinal);
					return earlier.method === "GET" && succeeded$3(earlier) && (read?.shape === "item" || read?.shape === "list") && read.type === view.type;
				});
				return held || unseen ? undefined : {
					type: view.type,
					collection
				};
			}
			return undefined;
		};
		linkedCollection = (plan, template) => plan.effect === "create" && plan.target !== null && plan.collection !== null && plan.target !== normalizedPath(template) ? plan.collection : undefined;
		recordedPathValues = (template, path) => {
			if (pathValuesOf(template, path) === undefined) return undefined;
			const segments = segmentsOf(path);
			return new Map(segmentsOf(template).flatMap((segment, index) => isParam(segment) ? [[index, segments[index]]] : []));
		};
		sameLinkedSource = (template, exemplar, call) => {
			const recorded = exemplar === undefined ? undefined : recordedPathValues(template, exemplar);
			if (recorded === undefined || call === undefined) return false;
			return recorded.size === call.size && [...recorded].every(([index, value]) => {
				const given = call.get(index);
				return given !== undefined && pathSegmentMatches(value, given);
			});
		};
		linkedTarget = (tool, classified, input) => {
			const link = classified.effect === "none" && tool.method === "POST" ? linkedCreate({
				tool,
				records: input.records,
				isWrite: input.isWrite,
				viewOf: input.viewOf,
				entities: input.entities,
				respondedIds: (ordinal) => input.io.withBody(ordinal, respondedIds),
				shownIds: (ordinal) => input.io.withBody(ordinal, listedIds),
				showsItem: (ordinal, id) => input.io.withBody(ordinal, (body) => showsItem(body, id))
			}) : undefined;
			return link === undefined ? classified : {
				effect: "create",
				target: link.type,
				collection: link.collection
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteOrder.js
var ServedOrder;
function init_environmentStateWriteOrder() {
	return (init_environmentStateWriteOrder = __esmMin((() => {
		ServedOrder = class {
			#keys = [];
			#known = new Map();
			/** The keys in state order. */
			get keys() {
				return this.#keys;
			}
			/** Hold the Evidence's entities in their own order. */
			reset(keys) {
				this.#keys = [...keys];
			}
			/** Add a key at `at` of its collection's `members`, beside them as serving places it, or last when the collection is empty. */
			place(key, members, at) {
				const anchor = at < members.length ? this.#keys.indexOf(members[at]) : members.length > 0 ? this.#keys.indexOf(members.at(-1)) + 1 : this.#keys.length;
				this.#keys.splice(anchor, 0, key);
			}
			remove(key) {
				this.#keys = this.#keys.filter((member) => member !== key);
			}
			remember(type, collection) {
				const collections = this.#known.get(type) ?? new Set();
				this.#known.set(type, collections.add(collection));
			}
			/** Every collection of a type the state has held, in the order serving remembers them. */
			known(type) {
				return [...this.#known.get(type) ?? []];
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteGenerated.js
var GENERATED, freshUuid, childPointer, pairUuids, renewedUuids, uuidsIn, renewedRule, unexplainedRenewals, callRenewal, otherFields;
function init_environmentStateWriteGenerated() {
	return (init_environmentStateWriteGenerated = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteValues();
		GENERATED = new Set([
			"identity",
			"sequence",
			"unique"
		]);
		freshUuid = (evidence, field) => {
			const before = evidence.before[field];
			const after = evidence.after[field];
			if (!isUuid(before) || !isUuid(after)) return false;
			const fresh = after.toLowerCase();
			for (const [name, value] of Object.entries(evidence.after)) if (name !== field && uuidsIn(value).has(fresh)) return false;
			return before.toLowerCase() !== fresh && !uuidsIn(evidence.call.body).has(fresh) && !evidence.others.some((other) => uuidsIn(other).has(fresh));
		};
		childPointer = (pointer, key) => `${pointer}${typeof key === "number" ? "/*" : pointerTo(key)}`;
		pairUuids = (before, after) => {
			const paired = {
				renewed: new Map(),
				changedAt: new Set(),
				keptAt: new Set(),
				kept: new Set()
			};
			const pending = [[
				before,
				after,
				""
			]];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				const [was, now, pointer] = next;
				if (isUuid(was) && isUuid(now)) {
					if (was === now) {
						paired.kept.add(was.toLowerCase());
						paired.keptAt.add(pointer);
					} else if (was.toLowerCase() === now.toLowerCase() || (paired.renewed.get(was.toLowerCase()) ?? now.toLowerCase()) !== now.toLowerCase()) return undefined;
					else {
						paired.renewed.set(was.toLowerCase(), now.toLowerCase());
						paired.changedAt.add(pointer);
					}
				} else if (Array.isArray(was) && Array.isArray(now)) {
					if (was.length !== now.length) return undefined;
					for (const [index, item] of was.entries()) pending.push([
						item,
						now[index],
						childPointer(pointer, index)
					]);
				} else if (isObject(was) && isObject(now)) {
					const keys = Object.keys(was);
					if (keys.length !== Object.keys(now).length) return undefined;
					for (const key of keys) {
						if (!Object.hasOwn(now, key)) return undefined;
						pending.push([
							was[key],
							now[key],
							childPointer(pointer, key)
						]);
					}
				} else if (was !== now) return undefined;
			}
			return paired;
		};
		renewedUuids = (before, after) => {
			const paired = pairUuids(before, after);
			if (paired === undefined || paired.renewed.size === 0) return undefined;
			const { renewed, changedAt, keptAt, kept } = paired;
			const old = [...renewed.keys()];
			const fresh = [...renewed.values()];
			const held = new Set([...kept, ...old]);
			return [...changedAt].every((at) => !keptAt.has(at)) && old.every((uuid) => !kept.has(uuid)) && new Set(fresh).size === fresh.length && fresh.every((uuid) => !held.has(uuid)) ? {
				uuids: renewed,
				pointers: [...changedAt].sort()
			} : undefined;
		};
		uuidsIn = (value) => {
			const found = new Set();
			const pending = value === undefined ? [] : [value];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (isUuid(next)) found.add(next.toLowerCase());
				else if (Array.isArray(next) || isObject(next)) for (const child of Object.values(next)) pending.push(child);
			}
			return found;
		};
		renewedRule = (field, change, others) => {
			const renewal = renewedUuids(change.before, change.after);
			const held = uuidsIn(others.map((other) => other[field] ?? null));
			return renewal !== undefined && [...renewal.uuids.values()].every((uuid) => !held.has(uuid.toLowerCase())) ? {
				field,
				rule: "renewed",
				pointers: renewal.pointers
			} : undefined;
		};
		unexplainedRenewals = (rules, evidence) => {
			const { before, after, call, others } = evidence;
			const generated = new Set(rules.filter((rule) => rule.rule === "renewed").map((rule) => rule.field));
			if (generated.size === 0) return [];
			const held = uuidsIn([
				before,
				call.body,
				...others,
				...Object.entries(after).filter(([field]) => !generated.has(field)).map(([, value]) => value)
			]);
			const renewed = new Map();
			const owners = new Map();
			const fields = new Set();
			for (const rule of rules) {
				if (rule.rule !== "renewed") continue;
				const renewal = renewedUuids(before[rule.field], after[rule.field]);
				for (const [was, now] of renewal?.uuids ?? []) {
					if (held.has(now) || (renewed.get(was) ?? now) !== now || (owners.get(now) ?? was) !== was) fields.add(rule.field);
					renewed.set(was, now);
					owners.set(now, was);
				}
			}
			return [...fields];
		};
		callRenewal = (seed) => {
			const order = new Map();
			return (uuid) => {
				const key = uuid.toLowerCase();
				if (!order.has(key)) order.set(key, order.size);
				return seededUuid(`${seed}:${String(order.get(key))}`, uuid);
			};
		};
		otherFields = (entities, named) => entities.filter((entity) => entity.id !== named.id || entity.collection !== named.collection).map((entity) => entity.fields);
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteCopies.js
var COPY_MIN_LENGTH, templateRule, storedMembers, WORD, joins, holdersOf, strandedCopies, REFERENCE_NAME, STEM_MIN_LENGTH, stemOf$1, related, namedBy, referencedMembers, DERIVED_INSTANT_MS, DATE_ONLY, instantOf, instantMembers;
function init_environmentStateWriteCopies() {
	return (init_environmentStateWriteCopies = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteValues();
		COPY_MIN_LENGTH = 8;
		templateRule = (entity, field, sources) => {
			const value = entity[field];
			if (typeof value !== "string") return undefined;
			for (const rule of sources) {
				const token = scalarText(entity[rule.field]);
				const generated = GENERATED.has(rule.rule);
				if (rule.field !== field && token !== undefined && token.length >= (generated ? 1 : 8) && delimitedOffsets(value, token).length > 0) return {
					field,
					rule: "template",
					from: rule.field
				};
			}
			return undefined;
		};
		storedMembers = (rules, entity) => new Set(rules.flatMap((rule) => {
			if (rule.rule === "echo") return [rule.field];
			if (rule.rule === "reference") return [rule.member];
			const tokens = rule.rule === "copy" ? pointerTokens(rule.from) : [];
			return tokens.length === 1 && !Object.hasOwn(entity, tokens[0]) ? tokens : [];
		}));
		WORD = /[\p{L}\p{N}]/u;
		joins = (character) => character !== undefined && WORD.test(character);
		holdersOf = (texts, tokens) => {
			const lengths = [...new Set([...tokens].map((token) => token.length))].sort((left, right) => left - right);
			const holders = new Map();
			for (const [field, text] of texts) for (let at = 0; at < text.length; at += 1) {
				if (joins(text[at - 1])) continue;
				for (const length of lengths) {
					if (at + length > text.length) break;
					if (joins(text[at + length])) continue;
					const token = text.slice(at, at + length);
					if (tokens.has(token)) holders.set(token, (holders.get(token) ?? new Set()).add(field));
				}
			}
			return holders;
		};
		strandedCopies = (rules, entity, texts) => {
			const rebuilt = new Map(rules.flatMap((rule) => rule.rule === "template" ? [[rule.field, rule.from]] : []));
			const sources = rules.flatMap((rule) => {
				const token = scalarText(entity[rule.field]);
				return (rule.rule === "copy" || rule.rule === "echo") && token !== undefined && token.length >= 8 ? [{
					field: rule.field,
					token
				}] : [];
			});
			const holders = holdersOf(new Map(texts.flatMap((field) => {
				const value = entity[field];
				return typeof value === "string" ? [[field, value]] : [];
			})), new Set(sources.map((source) => source.token)));
			return new Set(sources.flatMap(({ field, token }) => [...holders.get(token) ?? []].some((holder) => holder !== field && rebuilt.get(holder) !== field) ? [field] : []));
		};
		REFERENCE_NAME = /(?:[a-z0-9]Id|[a-z0-9]ID|_id|_ID)$/;
		STEM_MIN_LENGTH = 3;
		stemOf$1 = (name) => name.replace(REFERENCE_NAME, (suffix) => suffix.slice(0, -2)).replace(/_$/u, "").toLowerCase().replace(/[^a-z0-9]/gu, "");
		related = (member, field) => {
			const [left, right] = [stemOf$1(member), stemOf$1(field)];
			return Math.min(left.length, right.length) >= STEM_MIN_LENGTH && (left.startsWith(right) || right.startsWith(left));
		};
		namedBy = (member, id, named) => {
			const candidates = named(id);
			const stem = stemOf$1(member);
			const scoped = candidates.filter((entity) => entity.type.toLowerCase().replace(/[^a-z0-9]/gu, "").includes(stem));
			return scoped.length > 0 ? scoped : candidates;
		};
		referencedMembers = (body, entity, texts, named) => {
			const members = new Set();
			for (const [member, sent] of Object.entries(body)) {
				const id = scalarText(sent);
				if (id === undefined || id.length < 8 && !REFERENCE_NAME.test(member)) continue;
				const referenced = namedBy(member, id, named).filter((other) => other.fields !== entity);
				if (referenced.length === 0) continue;
				const repeats = (field) => {
					const value = entity[field];
					return typeof value === "string" && value.length >= 8 && !REFERENCE_NAME.test(field) && referenced.some((other) => Object.entries(other.fields).some(([key, text]) => key !== field && !REFERENCE_NAME.test(key) && text === value));
				};
				if (texts.some((field) => related(member, field) && repeats(field))) members.add(member);
			}
			return members;
		};
		DERIVED_INSTANT_MS = 2 * 864e5;
		DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
		instantOf = (value) => {
			if (typeof value !== "string") return undefined;
			return DATE_ONLY.test(value) ? Date.parse(`${value}T00:00:00Z`) : readClock(value)?.ms;
		};
		instantMembers = (body, entity, constants) => {
			const instants = constants.flatMap((field) => {
				const at = instantOf(entity[field]);
				return at === undefined ? [] : [{
					field,
					at
				}];
			});
			return new Set(Object.entries(body).flatMap(([member, sent]) => {
				const ms = instantOf(sent);
				return ms !== undefined && instants.some(({ field, at }) => Math.abs(at - ms) <= DERIVED_INSTANT_MS && related(member, field)) ? [member] : [];
			}));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteComposed.js
var SOURCES, composedPartText, composedValue, candidatesOf, indexed, matchesAt, segmented, samePart, heldSpellings, createdComposer, composedChange;
function init_environmentStateWriteComposed() {
	return (init_environmentStateWriteComposed = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteCopies();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteValues();
		init_environmentStateWriteClockFormats();
		SOURCES = new Set([
			...GENERATED,
			"echo",
			"copy",
			"path",
			"slug",
			"clock"
		]);
		composedPartText = (part, fields) => {
			if ("text" in part) return part.text;
			const value = fields[part.from];
			if (part.as === "clock") return clockDigits(value, part.pattern);
			if (part.as === "value") return scalarText(value);
			return typeof value === "string" ? slugOf(value) : undefined;
		};
		composedValue = (parts, fields) => {
			let text = "";
			for (const part of parts) {
				const spelled = composedPartText(part, fields);
				if (spelled === undefined) return undefined;
				text += spelled;
			}
			return text;
		};
		candidatesOf = (field, value, shortest) => {
			const candidates = [];
			const text = scalarText(value);
			if (text !== undefined && text.length >= shortest) candidates.push({
				token: text,
				part: {
					from: field,
					as: "value"
				}
			});
			if (typeof value === "string") {
				const slug = slugOf(value);
				if (slug !== value && slug.length >= 8) candidates.push({
					token: slug,
					part: {
						from: field,
						as: "slug"
					}
				});
			}
			if (readClock(value) !== undefined) for (const pattern of CLOCK_PATTERNS) {
				const digits = clockDigits(value, pattern);
				if (digits !== undefined) candidates.push({
					token: digits,
					part: {
						from: field,
						as: "clock",
						pattern
					}
				});
			}
			return candidates;
		};
		indexed = (candidates) => {
			const byToken = new Map();
			for (const candidate of candidates) {
				const same = byToken.get(candidate.token);
				if (same === undefined) byToken.set(candidate.token, [candidate]);
				else same.push(candidate);
			}
			const lengths = [...new Set(candidates.map(({ token }) => token.length))];
			return {
				byToken,
				lengths: lengths.sort((left, right) => right - left)
			};
		};
		matchesAt = (text, at, index) => {
			if (joinsBefore(text, at)) return [];
			for (const length of index.lengths) {
				if (at + length > text.length || joinsAfter(text, at + length)) continue;
				const matches = index.byToken.get(text.slice(at, at + length));
				if (matches !== undefined) return matches;
			}
			return [];
		};
		segmented = (text, index, alike) => {
			const parts = [];
			let literal = "";
			let shown = false;
			for (let at = 0; at < text.length;) {
				const matches = matchesAt(text, at, index);
				const match = matches[0];
				if (match === undefined) {
					literal += text[at];
					at += 1;
					continue;
				}
				if (matches.some((other) => !alike(match.part, other.part))) return undefined;
				if (literal !== "") parts.push({ text: literal });
				literal = "";
				parts.push(match.part);
				shown = true;
				at += match.token.length;
			}
			if (literal !== "") parts.push({ text: literal });
			return shown ? parts : undefined;
		};
		samePart = (left, right) => left.from === right.from && left.as === right.as && (left.as !== "clock" || right.as !== "clock" || left.pattern === right.pattern);
		heldSpellings = (parts, field, held) => {
			let agreeing = 0;
			for (const entity of held) {
				if (!Object.hasOwn(entity, field)) continue;
				const spelled = composedValue(parts, entity);
				if (spelled === undefined) continue;
				if (spelled !== entity[field]) return undefined;
				agreeing += 1;
			}
			return agreeing;
		};
		createdComposer = (entity, rules, held) => {
			const zones = new Map(rules.flatMap((rule) => rule.rule === "clock" ? [[rule.field, rule.format.kind === "iso" ? zoneMinutesForFormat(rule.format.zone) : 0]] : []));
			const alike = (left, right) => samePart(left, right) || left.as === "clock" && right.as === "clock" && left.pattern === right.pattern && zones.has(left.from) && zones.get(left.from) === zones.get(right.from);
			let index;
			return (field) => {
				const text = entity[field];
				if (typeof text !== "string") return undefined;
				index ??= indexed(rules.flatMap((rule) => SOURCES.has(rule.rule) ? candidatesOf(rule.field, entity[rule.field], GENERATED.has(rule.rule) ? 1 : 8) : []));
				const parts = segmented(text, index, alike);
				return parts === undefined || parts.some((part) => "from" in part && part.from === field) || !((heldSpellings(parts, field, held) ?? 0) > 0) ? undefined : {
					field,
					rule: "composed",
					parts
				};
			};
		};
		composedChange = (field, entity) => {
			const { before, after, sent, idField } = entity;
			const text = after[field];
			if (typeof text !== "string" || typeof before[field] !== "string") return undefined;
			const known = Object.keys(after).filter((other) => other !== field && (Object.hasOwn(sent, other) ? same(sent[other], after[other]) : Object.hasOwn(before, other) && same(before[other], after[other])));
			const index = indexed(known.flatMap((other) => candidatesOf(other, after[other], other === idField ? 1 : 8)));
			const parts = segmented(text, index, samePart);
			return parts === undefined || composedValue(parts, before) !== before[field] || heldSpellings(parts, field, entity.others) === undefined ? undefined : {
				field,
				rule: "composed",
				parts
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteReferences.js
var stemOf, projects, referenceRule, referencedValue;
function init_environmentStateWriteReferences() {
	return (init_environmentStateWriteReferences = __esmMin((() => {
		init_result();
		init_environmentStateRules();
		stemOf = (name) => name.replace(/(?:Id|ID|_id|_ID|Ids|_ids)$/u, "").toLowerCase().replace(/[^a-z0-9]/gu, "");
		projects = (object, fields) => Object.entries(object).every(([key, value]) => Object.hasOwn(fields, key) && same(fields[key], value));
		referenceRule = (field, value, body, named) => {
			if (!isObject(value) || Object.keys(value).length < 2) return undefined;
			const matches = new Map();
			for (const [member, sent] of Object.entries(body)) {
				const id = scalarText(sent);
				if (id === undefined || id.length === 0) continue;
				const held = named(id);
				for (const entity of held) if (projects(value, entity.fields) && held.filter((other) => other.type === entity.type).length === 1) matches.set(`${member} ${entity.type}`, {
					member,
					type: entity.type
				});
			}
			const candidates = [...matches.values()];
			const chosen = candidates.length === 1 ? candidates : candidates.filter(({ member }) => stemOf(member) === stemOf(field));
			return chosen.length === 1 ? {
				field,
				rule: "reference",
				member: chosen[0].member,
				type: chosen[0].type,
				fields: Object.keys(value)
			} : undefined;
		};
		referencedValue = (rule, body, referenced) => {
			if (!Object.hasOwn(body, rule.member)) return ok(undefined);
			const id = scalarText(body[rule.member]);
			const held = id === undefined ? [] : referenced?.(rule.type, id) ?? [];
			const [fields] = held;
			if (fields === undefined) return err(`Member ${rule.member} names no entity of ${rule.type} the environment holds, which ${rule.field} repeats.`);
			if (held.length > 1) return err(`Member ${rule.member} names entities of ${rule.type} in ${held.length} collections, so ${rule.field} cannot tell which it repeats.`);
			return ok(Object.fromEntries(rule.fields.flatMap((key) => Object.hasOwn(fields, key) ? [[key, fields[key]]] : [])));
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteAttribution.js
var shownFields, overlapsWrite, interference, runningAt, exercisedBy, touchTarget, covers, remaining, record, WriteEffects, shownWrites, forgetChecked, writtenFieldChecks;
function init_environmentStateWriteAttribution() {
	return (init_environmentStateWriteAttribution = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		shownFields = (view, volatileOf) => {
			if (view.shape !== "item" && view.shape !== "list") return "all";
			const volatile = volatileOf(view.type);
			return new Set(view.fields.filter((field) => !volatile.has(field)));
		};
		overlapsWrite = (until, start) => until > start;
		interference = (history, read) => {
			const keys = [...read.targets, ...read.unheld];
			const after = (since) => history.unmodelledAt.some((index) => index > since);
			const explained = (read.differing ?? []).every((key) => after(Math.max(history.checked.get(key) ?? -1, ...history.pending.get(key)?.at.values() ?? [])));
			return (tool) => explained && keys.some((key) => {
				if (history.touched.get(key)?.has(tool) !== true) return false;
				const at = history.pending.get(key)?.at.get(tool);
				return at !== undefined && after(at);
			});
		};
		runningAt = (pending, key, start) => overlapsWrite(pending.get(key)?.until ?? -Infinity, start);
		exercisedBy = (touched, keys, borrowers) => {
			const exercised = new Set();
			for (const key of keys) for (const name of touched.get(key)?.keys() ?? []) if (!borrowers?.has(name)) exercised.add(name);
			return exercised;
		};
		touchTarget = (touched, pending, target, write) => {
			const held = pending.get(target);
			pending.set(target, {
				until: Math.max(held?.until ?? -Infinity, write.end),
				at: (held?.at ?? new Map()).set(write.tool, write.index)
			});
			const tools = touched.get(target) ?? new Map();
			const before = tools.get(write.tool);
			tools.set(write.tool, write.fields === undefined || before === null ? null : [...new Set([...before ?? [], ...write.fields])]);
			touched.set(target, tools);
		};
		covers = (write, field) => {
			const { fields } = write;
			if (fields === "all" || fields.has(field)) return true;
			return write.pointers && [...fields].some((over) => field.startsWith(`${over}/`));
		};
		remaining = (claim, write) => {
			if (write.whole) return undefined;
			if (claim === null) return null;
			if (write.fields === "all") return undefined;
			const left = claim.filter((field) => !covers(write, field));
			return left.length > 0 ? left : undefined;
		};
		record = (map, key, whole, changed) => {
			const before = map.get(key);
			return map.set(key, whole || before === null ? null : [...new Set([...before ?? [], ...changed])]);
		};
		WriteEffects = class {
			/** Per entity target, the fields each tool changed there. */
			#changed = new Map();
			/** Per collection target, the entities each tool's claim there rests on, with the fields it changed on each. */
			#members = new Map();
			/** Forget a checked target's writes, as the touched targets do: all, or all but those a read showed nothing of. */
			checked(key, unseen) {
				for (const byTool of [this.#changed, this.#members]) if (unseen === undefined) byTool.delete(key);
				else for (const tool of byTool.get(key)?.keys() ?? []) if (!unseen.has(tool)) byTool.get(key).delete(tool);
			}
			/** A read showed the entity absent: no write's effect on it remains, so a write left with no entity drops from the collection. */
			removed(touched, gone) {
				const entity = entityTarget(gone.type, gone.collection, gone.id);
				const collection = collectionTarget(gone.type, gone.collection);
				this.#changed.delete(entity);
				const byTool = this.#members.get(collection);
				if (byTool === undefined) return;
				for (const [tool, entities] of byTool) {
					if (!entities.delete(entity) || entities.size > 0) continue;
					byTool.delete(tool);
					touched.get(collection)?.delete(tool);
				}
			}
			/** The fields a tool's effect on an entity still holds: null for a create's or delete's whole effect, undefined when none remains. */
			changedOn(key, tool) {
				return this.#changed.get(key)?.get(tool);
			}
			/** Whether a read showing `fields` of a target shows anything of a tool's effect there: a create's or delete's always, an update's through a field it changed; unknown claims count as shown. */
			shows(tool, key, fields) {
				const visible = (claim) => fields === "all" || claim === undefined || claim === null || claim.some((field) => fields.has(field));
				const own = this.#changed.get(key);
				if (own !== undefined) return visible(own.get(tool));
				const members = this.#members.get(key)?.get(tool);
				return members === undefined || [...members.values()].some(visible);
			}
			/** A write's effect replaces what earlier writes left of theirs, then joins them. */
			supersede(touched, writer, effect) {
				const [entity, collection] = effect.targets;
				const changed = effect.changed?.fields ?? effect.fields ?? [];
				const whole = effect.fields === undefined;
				this.#overwrite(touched, {
					entity,
					collection,
					writer
				}, {
					whole,
					fields: new Set((effect.overwrites ?? changed).filter((field) => !effect.changed?.accumulated.includes(field))),
					pointers: effect.pointers === true
				});
				this.#changed.set(entity, record(this.#changed.get(entity) ?? new Map(), writer, whole, changed));
				if (collection === undefined) return;
				const byTool = this.#members.get(collection) ?? new Map();
				byTool.set(writer, record(byTool.get(writer) ?? new Map(), entity, whole, changed));
				this.#members.set(collection, byTool);
			}
			/** A recorded outcome is the entity's new baseline: what earlier writes changed on it is gone, its membership is not. */
			observed(touched, targets) {
				const [entity, collection] = targets;
				this.#overwrite(touched, {
					entity,
					collection,
					writer: undefined
				}, {
					whole: false,
					fields: "all",
					pointers: false
				});
			}
			#overwrite(touched, at, write) {
				const own = this.#changed.get(at.entity);
				for (const [tool, claim] of own ?? []) {
					const left = tool === at.writer ? claim : remaining(claim, write);
					if (left !== undefined) {
						own.set(tool, left);
						if (tool !== at.writer) {
							const tools = touched.get(at.entity);
							const sent = tools?.get(tool);
							if (tools !== undefined && sent !== undefined) tools.set(tool, sent !== null && left !== null ? sent.filter((field) => left.includes(field)) : left);
						}
					} else {
						own.delete(tool);
						touched.get(at.entity)?.delete(tool);
					}
				}
				if (at.collection === undefined) return;
				const byTool = this.#members.get(at.collection);
				for (const [tool, entities] of byTool ?? []) {
					const claim = entities.get(at.entity);
					if (tool === at.writer || claim === undefined) continue;
					const left = remaining(claim, write);
					if (left !== undefined) entities.set(at.entity, left);
					else entities.delete(at.entity);
					if (entities.size > 0) continue;
					byTool.delete(tool);
					touched.get(at.collection)?.delete(tool);
				}
			}
		};
		shownWrites = (touched, effects, read) => {
			const confirmed = [];
			const unseen = new Map();
			for (const name of read.exercised) {
				const on = read.keys.filter((key) => touched.get(key)?.has(name));
				const seen = on.filter((key) => effects.shows(name, key, read.fields));
				for (const key of on) if (!seen.includes(key)) unseen.set(key, (unseen.get(key) ?? new Set()).add(name));
				if (seen.length > 0) confirmed.push(name);
			}
			return {
				confirmed,
				unseen
			};
		};
		forgetChecked = (pending, key, unseen) => {
			const writes = pending.touched.get(key);
			if (unseen === undefined || writes === undefined) {
				pending.touched.delete(key);
				pending.effects.checked(key);
				pending.since.delete(key);
				return;
			}
			const at = pending.since.get(key)?.at;
			for (const name of writes.keys()) if (!unseen.has(name)) {
				writes.delete(name);
				at?.delete(name);
			}
			pending.effects.checked(key, unseen);
		};
		writtenFieldChecks = (entity, view, observed, check) => {
			const shown = renderStateEntity(entity, view, check.volatile, observed);
			const outcomes = new Map();
			for (const [tool, fields] of check.writes) {
				const compared = (fields ?? []).filter((field) => !check.volatile.has(field) && (Object.hasOwn(observed, field) || Object.hasOwn(shown, field)));
				if (fields === null || compared.length === 0) continue;
				outcomes.set(tool, compared.every((field) => same(shown[field], observed[field])));
			}
			return outcomes;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateVariants.js
var PAGING, queryValues, shapesOtherwise, shapingNames, lineShapes, EMPTY, VARIANT_WORK_LIMIT, linesByEntity, conflictingLines, noLines, addLine, namesNewParameter, showsOtherMembers, variantLines, isVariant, keyBase, replayKeys, keysAgainst, matchesReplayKey, selectsOtherFields, replayReason, requestLine$1, keyedVariants, withoutVariants, lateReplays, dropObservations;
function init_environmentStateVariants() {
	return (init_environmentStateVariants = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_webNetworkRouteTemplates();
		init_environmentStateRules();
		PAGING = new Set([
			"limit",
			"offset",
			"page",
			"per_page",
			"perpage",
			"page_size",
			"pagesize",
			"size",
			"start",
			"_start",
			"_end",
			"cursor",
			"pagenumber",
			"pageindex",
			"skip",
			"take",
			"top",
			"$top",
			"$skip"
		]);
		queryValues = (query) => {
			const values = new Map();
			for (const [name, value] of new URLSearchParams(query ?? "")) values.set(name, [...values.get(name) ?? [], value]);
			return values;
		};
		shapesOtherwise = (query) => shapingNames(query).some((name) => !isProjectionParameter(name));
		shapingNames = (query) => [...queryValues(query).keys()].filter((name) => !PAGING.has(name.toLowerCase()));
		lineShapes = (entities, retain) => {
			const shapes = new Map();
			retain(128);
			for (const entity of entities) for (const observation of entity.observations) {
				const members = Object.keys(observation.object);
				let shape = shapes.get(observation.ordinal);
				if (shape === undefined) {
					retain(128 * (4 + members.length));
					shape = {
						entities: new Map(),
						carried: new Set(),
						common: undefined
					};
					shapes.set(observation.ordinal, shape);
				}
				const key = JSON.stringify([
					entity.type,
					entity.collection,
					entity.id
				]);
				const signature = JSON.stringify([...members].sort(compareUnicodeCodePoints));
				if (!shape.entities.has(key)) retain(128 + textBytes(key.length + signature.length));
				shape.entities.set(key, signature);
				for (const member of members) if (!shape.carried.has(member)) {
					retain(128);
					shape.carried.add(member);
				}
				shape.common = shape.common === undefined ? new Set(members) : new Set(members.filter((member) => shape.common.has(member)));
			}
			return shapes;
		};
		EMPTY = {
			entities: new Map(),
			carried: new Set(),
			common: undefined
		};
		VARIANT_WORK_LIMIT = 1 << 24;
		linesByEntity = (lines, shape, retain) => {
			const shown = new Map();
			for (const line of lines) for (const [key, members] of shape(line).entities) {
				retain(128);
				const showing = shown.get(key) ?? new Map();
				shown.set(key, showing);
				const group = showing.get(members);
				if (group === undefined) showing.set(members, [line]);
				else group.push(line);
			}
			return shown;
		};
		conflictingLines = (mine, shown) => {
			const conflicting = new Set();
			for (const [key, members] of mine.entities) for (const [others, lines] of shown.get(key)) if (others !== members) for (const line of lines) conflicting.add(line);
			return conflicting;
		};
		noLines = () => ({
			names: new Set(),
			carried: new Set(),
			common: undefined
		});
		addLine = (totals, query, shape) => {
			for (const name of shapingNames(query)) totals.names.add(name);
			for (const member of shape.carried) totals.carried.add(member);
			const { common } = shape;
			if (common !== undefined) totals.common = totals.common === undefined ? new Set(common) : new Set([...totals.common].filter((member) => common.has(member)));
		};
		namesNewParameter = (query, totals) => shapingNames(query).some((name) => !totals.names.has(name));
		showsOtherMembers = (shape, totals) => {
			const { common } = shape;
			return [...shape.carried].some((member) => !totals.carried.has(member)) || common !== undefined && totals.common !== undefined && [...totals.common].some((member) => !common.has(member));
		};
		variantLines = (latest, shapeOf, retain = () => undefined) => {
			if (latest.length < 2) return [];
			const shapes = new Map(latest.map((record) => [record, shapeOf(record) ?? EMPTY]));
			const entities = [...shapes.values()].reduce((sum, line) => sum + line.entities.size, 0);
			if (latest.length * (latest.length + entities) > VARIANT_WORK_LIMIT) return [];
			const shape = (record) => shapes.get(record);
			const shown = linesByEntity(latest, shape, retain);
			const ranks = new Map(latest.map((record) => {
				const names = shapingNames(record.query).length;
				const agreeing = latest.length - 1 - conflictingLines(shape(record), shown).size;
				return [record, [
					names === 0 ? 0 : 1,
					projectsFields(record.query ?? undefined) ? 1 : 0,
					-agreeing,
					names,
					shape(record).carried.size
				]];
			}));
			const ordered = [...latest].sort((left, right) => {
				const [a, b] = [ranks.get(left), ranks.get(right)];
				const differs = a.findIndex((value, index) => value !== b[index]);
				return differs === -1 ? 0 : a[differs] - b[differs];
			});
			const base = {
				...noLines(),
				lines: new Set()
			};
			const variants = [];
			for (const record of ordered) {
				if (base.lines.size > 0 && isVariant(record, base, shape(record), shown)) variants.push(record);
				else {
					base.lines.add(record);
					addLine(base, record.query, shape(record));
				}
			}
			return variants;
		};
		isVariant = (record, base, mine, shown) => [...conflictingLines(mine, shown)].some((line) => base.lines.has(line)) || namesNewParameter(record.query, base) && showsOtherMembers(mine, base);
		keyBase = (base) => {
			const baseValues = base.map(queryValues);
			const values = new Map();
			for (const line of baseValues) for (const [name, given] of line) {
				const seen = values.get(name) ?? new Set();
				values.set(name, seen);
				for (const value of given) seen.add(value);
			}
			const everywhere = [...values.keys()].filter((name) => !PAGING.has(name.toLowerCase()) && baseValues.every((line) => line.has(name)));
			return {
				values,
				everywhere
			};
		};
		replayKeys = (base, replayed, retain = () => undefined) => keysAgainst(keyBase(base), replayed, retain);
		keysAgainst = ({ values: baseValues, everywhere }, replayed, retain) => {
			const keys = new Map();
			const add = (key) => {
				const id = JSON.stringify([
					key.name,
					key.value ?? null,
					key.absent ?? false
				]);
				if (keys.has(id)) return;
				retain(128 * 2 + textBytes(id.length));
				keys.set(id, key);
			};
			for (const query of replayed) {
				const values = queryValues(query);
				for (const [name, given] of values) {
					if (PAGING.has(name.toLowerCase())) continue;
					const seen = baseValues.get(name);
					const unseen = given.filter((value) => seen?.has(value) !== true);
					if (seen === undefined) add({ name });
					else for (const value of unseen) add({
						name,
						value
					});
				}
				for (const name of everywhere) if (!values.has(name)) add({
					name,
					absent: true
				});
			}
			return [...keys.values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name) || compareUnicodeCodePoints(left.value ?? "", right.value ?? "") || Number(left.absent ?? false) - Number(right.absent ?? false));
		};
		matchesReplayKey = (keys, call) => keys.some((key) => key.absent === true ? !call.has(key.name) : key.value === undefined ? call.has(key.name) : call.get(key.name)?.includes(key.value) === true);
		selectsOtherFields = (call, checked, replayed) => {
			const [base, other] = [checked.map(queryValues), replayed.map(queryValues)];
			const gave = (lines, name, value) => lines.some((values) => values.get(name)?.includes(value) === true);
			return [...call].some(([name, values]) => isProjectionParameter(name) && values.some((value) => gave(other, name, value) || value !== "*" && !gave(base, name, value)));
		};
		replayReason = (view, call, queryOf) => {
			if (view.projected_record_ordinals === undefined) return undefined;
			if ([...call.keys()].some(isProjectionParameter) && selectsOtherFields(call, view.checked_record_ordinals.map(queryOf), view.projected_record_ordinals.map(queryOf))) return "projection";
			const matched = (view.projected_query_keys ?? []).filter((key) => (key.absent === true || !isProjectionParameter(key.name)) && matchesReplayKey([key], call));
			if (matched.length === 0) return undefined;
			return matched.some((key) => isProjectionParameter(key.name)) ? "projection" : "variant";
		};
		requestLine$1 = (record) => record.path + (record.query ?? "");
		keyedVariants = (latest, found) => {
			if (found.length === 0) return [];
			const variant = new Set(found);
			const base = keyBase(latest.filter((record) => !variant.has(record)).map((line) => line.query));
			return found.filter((record) => keysAgainst(base, [record.query], () => undefined).length > 0);
		};
		withoutVariants = (plan, facts) => {
			const release = facts.checkpoint();
			const found = variantLines(plan.latest, facts.shapeOf, facts.retain);
			release();
			const variants = keyedVariants(plan.latest, found);
			const lines = new Set(variants.map(requestLine$1));
			const latest = plan.latest.filter((record) => !lines.has(requestLine$1(record)));
			const projected = [...plan.projected ?? [], ...lateReplays(plan.late ?? [], latest, facts.shapeOf)];
			if (variants.length === 0 && projected.length === 0) return undefined;
			const replayed = [...projected, ...variants.map((record) => record.ordinal)].sort((left, right) => facts.position(left) - facts.position(right));
			const dropped = new Set(plan.recordings.filter((record) => lines.has(requestLine$1(record))).map((record) => record.ordinal));
			return {
				plan: {
					...plan,
					recordings: plan.recordings.filter((record) => !dropped.has(record.ordinal)),
					latest,
					projected: replayed,
					projectedKeys: replayKeys(latest.map((record) => record.query), replayed.map(facts.queryOf), facts.retain)
				},
				dropped
			};
		};
		lateReplays = (late, base, shapeOf) => {
			if (late.length === 0) return [];
			const totals = noLines();
			for (const record of base) addLine(totals, record.query, shapeOf(record) ?? EMPTY);
			return late.flatMap(({ record, members, projecting }) => (projecting || shapingNames(record.query).some((name) => !isProjectionParameter(name) && !totals.names.has(name))) && showsOtherMembers({
				carried: members,
				common: members
			}, totals) ? [record.ordinal] : []);
		};
		dropObservations = (entities, dropped) => {
			for (const [key, entity] of entities) {
				const kept = entity.observations.filter((observation) => !dropped.has(observation.ordinal));
				if (kept.length === entity.observations.length) continue;
				if (kept.length === 0) {
					entities.delete(key);
					continue;
				}
				const first = kept.reduce((earliest, observation) => observation.position < earliest.position || observation.position === earliest.position && observation.index < earliest.index ? observation : earliest);
				entities.set(key, {
					...entity,
					order: [first.position, first.index],
					observations: kept
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteObserve.js
var respelledInstant, withRead, entitySlots, newEntityIn, viewFields, shownBefore, projectedRead, succeeded$2, laterObservation, itemObservation, listObservation;
function init_environmentStateWriteObserve() {
	return (init_environmentStateWriteObserve = __esmMin((() => {
		init_environmentStateWriteAttribution();
		init_environmentStateRules();
		init_environmentStateVariants();
		init_environmentStateWriteValues();
		respelledInstant = (left, right) => {
			const [a, b] = [readClock(left), readClock(right)];
			if (a?.format.kind !== "iso" || b?.format.kind !== "iso") return false;
			const [fine, coarse] = a.format.fraction >= b.format.fraction ? [a, b] : [b, a];
			if (coarse.format.kind !== "iso") return false;
			const unit = 10 ** (9 - coarse.format.fraction);
			const fraction = (clock) => (clock.ms % 1e3 + 1e3) % 1e3 * 1e6 + clock.subMillisecond;
			return Math.floor(fine.ms / 1e3) === Math.floor(coarse.ms / 1e3) && Math.floor(fraction(fine) / unit) * unit === fraction(coarse);
		};
		withRead = (response, read, shape) => shape === "item" ? {
			...response,
			...read
		} : {
			...read,
			...response
		};
		entitySlots = (body) => {
			const members = isObject(body) ? Object.entries(body) : [];
			const elements = Array.isArray(body) && body.length === 1 ? [["/0", body[0]]] : [];
			for (const [name, item] of members) if (Array.isArray(item) && item.length === 1) elements.push([`${pointerTo(name)}/0`, item[0]]);
			return [
				[["", body]],
				members.map(([name, item]) => [pointerTo(name), item]),
				elements
			];
		};
		newEntityIn = (ordinal, body, idField, held) => {
			if (body === undefined) return undefined;
			for (const tier of entitySlots(body)) {
				const found = tier.flatMap(([pointer, object]) => {
					const id = isObject(object) ? scalarText(object[idField]) : undefined;
					return isObject(object) && id !== undefined && !held(id) && Object.keys(object).some((key) => key !== idField) ? [{
						ordinal,
						pointer,
						object,
						id
					}] : [];
				});
				if (found.length > 0) return found.length === 1 ? found[0] : undefined;
			}
			return undefined;
		};
		viewFields = (view) => view?.shape === "item" || view?.shape === "list" ? view.fields : undefined;
		shownBefore = (viewOf, entity, ordinal) => {
			const view = viewOf(ordinal);
			const shown = entity.record_ordinals.some((earlier) => viewOf(earlier)?.tool === view?.tool);
			return (shown ? viewFields(view) : undefined) ?? [];
		};
		projectedRead = (view, record, io) => {
			if (view.shape !== "item" && view.shape !== "list") return false;
			if (!succeeded$2(record)) return false;
			if (replayReason(view, queryValues(record.query), io.queryOf) !== undefined) return true;
			if (!projectsFields(record.query)) return false;
			return io.withBody(record.ordinal, (body) => {
				const objects = body === undefined || body === null ? [] : view.shape === "item" ? [at(body, view.pointer)] : listItems(body, view.pointer) ?? [];
				return objects.some((object) => !isObject(object) || view.required_fields.some((field) => !Object.hasOwn(object, field)));
			});
		};
		succeeded$2 = (record) => record.status !== null && record.status >= 200 && record.status < 300;
		laterObservation = (search, target) => {
			for (const record of search.records.slice(search.from + 1)) {
				if (target.isWrite(record)) return undefined;
				if (search.after !== undefined && overlapsWrite(search.after, record.start)) continue;
				const view = search.viewOf(record.ordinal);
				if (!succeeded$2(record) || view?.shape !== "item" && view?.shape !== "list" || view.type !== target.type || projectedRead(view, record, search)) continue;
				if (target.covers !== undefined && !target.covers(view)) continue;
				const found = view.shape === "item" ? itemObservation(search, record, view.pointer, target) : listObservation(search, record, view.pointer, target);
				if (found !== undefined) return found;
			}
			return undefined;
		};
		itemObservation = (search, record, pointer, target) => {
			const pathId = lastSegmentValue(record.path);
			const named = target.sameItem?.(record) ?? (collectionPathOf(record, true) === target.collection && (target.id === undefined ? !target.held(pathId) : pathId === target.id));
			if (!named) return undefined;
			const id = target.id ?? pathId;
			return search.withBody(record.ordinal, (body) => {
				const object = body === undefined ? undefined : entitySlots(body).flat().find(([at]) => at === pointer)?.[1];
				return isObject(object) && scalarText(object[target.idField]) === id ? {
					ordinal: record.ordinal,
					pointer,
					object,
					id
				} : undefined;
			});
		};
		listObservation = (search, record, pointer, target) => {
			if (collectionPathOf(record, false) !== target.collection) return undefined;
			return search.withBody(record.ordinal, (body) => {
				const items = body === undefined ? undefined : listItems(body, pointer);
				const unheld = (items ?? []).map((object, index) => ({
					object,
					index,
					id: scalarText(object[target.idField])
				})).filter((entry) => entry.id !== undefined && !target.held(entry.id) && (target.id === undefined || entry.id === target.id));
				return unheld.length === 1 ? {
					ordinal: record.ordinal,
					pointer: `${pointer}/${String(unheld[0].index)}`,
					object: unheld[0].object,
					id: unheld[0].id
				} : undefined;
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateCheckedLines.js
var queryValuesKey, queryKey, lineOf, queryLines, checkedLines, servedLine, queryMatches, bestLine;
function init_environmentStateCheckedLines() {
	return (init_environmentStateCheckedLines = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_recordedTransportUrl();
		init_environmentStateRules();
		init_environmentStatePaging();
		queryValuesKey = (values) => compositeKey([...values].sort(([left], [right]) => compareUnicodeCodePoints(left, right)));
		queryKey = (query) => {
			const values = singleQueryValues(query ?? undefined);
			return values === undefined ? undefined : queryValuesKey(values);
		};
		lineOf = (record) => ({
			ordinal: record.ordinal,
			segments: segmentsOf(record.path),
			query: record.query
		});
		queryLines = (view, tool, byOrdinal) => {
			if (view.shape !== "list" || view.query === undefined) return undefined;
			const answered = new Set([...view.query.record_ordinals, ...allLines(view)]);
			return {
				roles: new Set(Object.keys(view.query.parameters)),
				lines: tool.record_ordinals.flatMap((ordinal) => {
					const record = byOrdinal.get(ordinal);
					return record === undefined || !answered.has(ordinal) ? [] : [lineOf(record)];
				})
			};
		};
		checkedLines = (input) => {
			const byOrdinal = new Map(input.records.map((record) => [record.ordinal, record]));
			const tools = new Map(input.tools.map((tool) => [tool.name, tool]));
			const byView = new Map();
			for (const view of input.views.values()) {
				const tool = tools.get(view.tool);
				if (view.shape === "recorded" || view.shape === "item" || !tool) continue;
				const checked = new Set(view.checked_record_ordinals);
				const byQuery = new Map();
				const unfiltered = [];
				for (const ordinal of tool.record_ordinals) {
					const record = byOrdinal.get(ordinal);
					const key = record === undefined ? undefined : queryKey(record.query);
					if (!checked.has(ordinal) || key === undefined) continue;
					const line = lineOf(record);
					byQuery.set(key, [...byQuery.get(key) ?? [], line]);
					if (view.shape === "list" && listsAll(view, ordinal) && pagesOnly(record.query)) unfiltered.push(line);
				}
				const params = new Set(segmentsOf(tool.path_template).flatMap((segment, index) => isParam(segment) ? [index] : []));
				const query = queryLines(view, tool, byOrdinal);
				byView.set(view.tool, {
					params,
					byQuery,
					unfiltered,
					...query === undefined ? {} : { query }
				});
			}
			return byView;
		};
		servedLine = (lines, record) => {
			const key = queryKey(record.query);
			if (lines === undefined || key === undefined) return undefined;
			const names = [...parseUrlQueryParameterNames(record.query ?? "")];
			const named = bestLine(lines, lines.byQuery.get(key) ?? [], record);
			if (named !== undefined) return {
				...named,
				named: true
			};
			const unfiltered = names.length === 0 ? bestLine(lines, lines.unfiltered, record) : undefined;
			if (unfiltered !== undefined) return {
				...unfiltered,
				named: false
			};
			if (lines.query === undefined) return undefined;
			const { roles } = lines.query;
			if (!names.every((name) => roles.has(name))) return undefined;
			const line = bestLine(lines, lines.query.lines, record);
			return line === undefined ? undefined : {
				...line,
				named: false,
				queried: names.length > 0
			};
		};
		queryMatches = (read, query) => {
			const matched = new Set();
			for (const [name, value] of iterateUrlQueryParameters(query ?? "", read)) if (read.get(name) === value) matched.add(name);
			return matched.size;
		};
		bestLine = (lines, candidates, record) => {
			const read = segmentsOf(record.path);
			const values = new Map(iterateUrlQueryParameters(record.query ?? ""));
			let best;
			for (const { ordinal, segments, query } of candidates) {
				if (segments.length !== read.length) continue;
				let verbatim = 0;
				const matches = segments.every((segment, index) => {
					if (segment === read[index]) {
						if (lines.params.has(index)) verbatim += 1;
						return true;
					}
					return lines.params.has(index) && read[index] !== undefined && pathSegmentMatches(segment, read[index]);
				});
				if (!matches) continue;
				const matched = queryMatches(values, query);
				if (best === undefined || verbatim > best.verbatim || verbatim === best.verbatim && matched > best.query) best = {
					line: {
						ordinal,
						collection: `/${segments.join("/")}`
					},
					verbatim,
					query: matched
				};
			}
			return best?.line;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteStamps.js
var CLOCK_WINDOW_MS, NESTED_WINDOW_MS, TRUNCATION_MS, OPAQUE_TOKEN, CHANGED_BY, REFERENCE_WORDS, DERIVED_TEXT_MIN, STATE_WORD, isClockNear, isOpaqueToken, envelopeOf, unenveloped, plannedBody, sameQuery, pinnedQuery, sharedBesides, nestedRule, nestedClockRule, createdNestedClock, nestedClockValue, createdToken, freshToken, wordsOf, referentOf, creatorOf, stampRule, pairedStamps, textOf, derivedRule, stampProblem, nestedIdentities, stateOf, pinnedEchoes, restampedFields, storedRestamp;
function init_environmentStateWriteStamps() {
	return (init_environmentStateWriteStamps = __esmMin((() => {
		init_result();
		init_environmentStateRules();
		init_environmentStateWriteObserve();
		init_recordedTransportUrl();
		init_environmentStateCheckedLines();
		init_environmentStateWriteValues();
		CLOCK_WINDOW_MS = 10 * 6e4;
		NESTED_WINDOW_MS = 2e3;
		TRUNCATION_MS = 1e3;
		OPAQUE_TOKEN = /^[A-Za-z0-9_-]{16,64}$/u;
		CHANGED_BY = new Set([
			"modified",
			"updated",
			"edited",
			"changed"
		]);
		REFERENCE_WORDS = new Set([
			"id",
			"ids",
			"name"
		]);
		DERIVED_TEXT_MIN = 8;
		STATE_WORD = /^[a-z][a-z_-]{0,23}$/u;
		isClockNear = (value, startMs) => {
			const clock = readClock(value);
			return clock !== undefined && startMs !== undefined && Math.abs(clock.ms - startMs) <= CLOCK_WINDOW_MS;
		};
		isOpaqueToken = (value, exemplar) => typeof value === "string" && OPAQUE_TOKEN.test(value) && /[0-9]/u.test(value) && /[A-Za-z]/u.test(value) && (exemplar === undefined || typeof exemplar === "string" && exemplar.length === value.length) && !isUuid(value) && readClock(value) === undefined;
		envelopeOf = (body) => {
			if (!isObject(body)) return undefined;
			const members = Object.keys(body);
			const wrapped = members.length === 1 ? body[members[0]] : undefined;
			return Array.isArray(wrapped) && wrapped.length === 1 && isObject(wrapped[0]) ? {
				member: members[0],
				object: wrapped[0]
			} : undefined;
		};
		unenveloped = (body, envelope) => {
			if (envelope === undefined) return body;
			const wrapped = envelopeOf(body);
			return wrapped?.member === envelope ? wrapped.object : undefined;
		};
		plannedBody = (body, plan, knownField) => {
			const wrapped = plan.built ? undefined : envelopeOf(body);
			const envelope = plan.built ? plan.envelope : wrapped !== undefined && !knownField(wrapped.member) ? wrapped.member : undefined;
			const object = unenveloped(body, envelope);
			return object !== undefined && isObject(object) ? {
				object,
				...envelope === undefined ? {} : { envelope }
			} : undefined;
		};
		sameQuery = (left, right) => {
			const key = queryKey(left);
			return key !== undefined && key === queryKey(right);
		};
		pinnedQuery = (recorded, call) => {
			const values = singleQueryValues(recorded ?? undefined);
			const pinned = new Map([...values ?? [], ...call]);
			const spelled = [...values ?? []].map(([name, value]) => `${name}=${value}`).join("&");
			return values !== undefined && queryValuesKey(pinned) === queryValuesKey(values) ? ok(pinned) : err(`takes only the query its recording sent (${spelled === "" ? "none" : spelled}).`);
		};
		sharedBesides = (field, object, members, others) => {
			const held = others.flatMap((other) => {
				const value = other[field];
				return value !== undefined && isObject(value) ? [value] : [];
			});
			return held.length > 0 && held.every((other) => [...new Set([...Object.keys(other), ...Object.keys(object)])].every((key) => members.includes(key) ? readClock(other[key]) !== undefined && !same(other[key], object[key]) : same(other[key], object[key])));
		};
		nestedRule = (field, object, members, others) => {
			const formats = new Set(members.map((key) => JSON.stringify(readClock(object[key])?.format)));
			return members.length > 0 && formats.size === 1 && sharedBesides(field, object, members, others) ? {
				field,
				rule: "nested-clock",
				members: [...members],
				format: readClock(object[members[0]]).format
			} : undefined;
		};
		nestedClockRule = (field, values, evidence) => {
			const { before, after } = values;
			if (before === undefined || !isObject(before) || !isObject(after)) return undefined;
			const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => !same(before[key], after[key]));
			return changed.every((key) => Object.hasOwn(after, key) && isClockNear(after[key], evidence.startMs)) ? nestedRule(field, after, changed, evidence.others) : undefined;
		};
		createdNestedClock = (field, value, evidence) => {
			const { startMs } = evidence;
			if (!isObject(value) || startMs === undefined) return undefined;
			const members = Object.keys(value).filter((key) => readClock(value[key]) !== undefined);
			const stamped = members.every((key) => {
				const ms = readClock(value[key]).ms;
				return ms >= startMs - TRUNCATION_MS && ms <= startMs + NESTED_WINDOW_MS;
			});
			return stamped ? nestedRule(field, value, members, evidence.type) : undefined;
		};
		nestedClockValue = (base, rule, clock) => base !== undefined && isObject(base) ? ok({
			...base,
			...Object.fromEntries(rule.members.map((member) => [member, clock]))
		}) : err(`The entity holds no ${rule.field} object for the write to stamp.`);
		createdToken = (field, entity, type) => {
			const value = entity[field];
			if (!isOpaqueToken(value) || type.length === 0 || !type.every((member) => member[field] !== value && isOpaqueToken(member[field], value))) return undefined;
			if (Object.entries(entity).some(([other, held]) => other !== field && (held === value || typeof held === "object" && held !== null && containsDelimited(held, value)))) return "linked";
			return "independent";
		};
		freshToken = (evidence, field) => {
			const before = evidence.before[field];
			const after = evidence.after[field];
			return isOpaqueToken(after, before) && isOpaqueToken(before) && before !== after && !containsDelimited(evidence.call.body, after) && !Object.entries(evidence.after).some(([name, value]) => name !== field && containsDelimited(value, after)) && !evidence.others.some((other) => containsDelimited(other, after));
		};
		wordsOf = (name) => name.replace(/([a-z0-9])([A-Z])/gu, "$1 $2").toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word.length > 0);
		referentOf = (name) => {
			const words = wordsOf(name);
			while (words.length > 1 && REFERENCE_WORDS.has(words.at(-1))) words.pop();
			return words.join(" ");
		};
		creatorOf = (field) => {
			const words = wordsOf(field);
			const at = words[0] === "last" ? 1 : 0;
			return CHANGED_BY.has(words[at] ?? "") && words[at + 1] === "by" ? ["created", ...words.slice(at + 1)].join(" ") : undefined;
		};
		stampRule = (evidence, field) => {
			const after = evidence.after[field];
			const creator = creatorOf(field);
			if (typeof after !== "string" || after.length === 0 || creator === undefined) return undefined;
			if (Object.keys(evidence.call.body).some((member) => referentOf(member) === referentOf(field))) return undefined;
			return Object.entries(evidence.before).some(([other, value]) => value === after && wordsOf(other).join(" ") === creator) ? {
				field,
				rule: "stamp",
				value: after
			} : undefined;
		};
		pairedStamps = (evidence, rules) => {
			const ruled = new Set(rules.map((rule) => rule.field));
			return rules.flatMap((rule) => rule.rule === "stamp" ? Object.keys(evidence.after).flatMap((sibling) => {
				const value = evidence.after[sibling] ?? null;
				const creator = creatorOf(sibling);
				return !ruled.has(sibling) && value !== null && creator !== undefined && referentOf(sibling) === referentOf(rule.field) && Object.entries(evidence.before).some(([other, held]) => same(held, value) && wordsOf(other).join(" ") === creator) ? [{
					field: sibling,
					rule: "stamp",
					value
				}] : [];
			}) : []);
		};
		textOf = (value) => typeof value === "string" ? value.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ").trim() : undefined;
		derivedRule = (evidence, field) => {
			const after = evidence.after[field];
			if (after === undefined || readClock(after) !== undefined) return undefined;
			const { body } = evidence.call;
			const unstored = Object.keys(body).filter((member) => !Object.hasOwn(evidence.after, member) && !Object.hasOwn(evidence.before, member));
			const text = unstored.length === 1 ? textOf(body[unstored[0]]) : undefined;
			const shown = typeof after === "string" ? after : JSON.stringify(after);
			return text !== undefined && text.length >= DERIVED_TEXT_MIN && shown.includes(text) ? {
				field,
				rule: "derived",
				value: after,
				from: evidence.before[field] ?? null,
				member: unstored[0]
			} : undefined;
		};
		stampProblem = (rules, before, sent) => {
			for (const rule of rules) {
				if (rule.rule === "derived" && Object.hasOwn(sent, rule.member) && !same(before[rule.field] ?? null, rule.from)) return `Member ${rule.member} is accepted only on an entity whose ${rule.field} is as the recorded call found it, since the application derives ${rule.field} from it.`;
				if (rule.rule === "held-clock" && !Object.hasOwn(sent, rule.field)) return `Member ${rule.field} must be sent with the value the entity holds, as the recorded call did.`;
				if (rule.rule === "held-clock" && !same(sent[rule.field], before[rule.field])) return `Member ${rule.field} must repeat the value the entity holds, as the recorded call did.`;
			}
			return undefined;
		};
		nestedIdentities = (entity) => {
			const index = new Map();
			for (const [field, nested] of Object.entries(entity)) {
				if (!isObject(nested)) continue;
				const texts = IDENTITY_NAMES.flatMap((name) => {
					const text = scalarText(nested[name]);
					return text === undefined ? [] : [text];
				});
				if (texts.length === 0) continue;
				const stem = referentOf(field);
				index.set(stem, new Set([...index.get(stem) ?? [], ...texts]));
			}
			return index;
		};
		stateOf = (entity, member, value, type) => {
			if (typeof value !== "string" || !STATE_WORD.test(value)) return false;
			const held = type.flatMap((other) => Object.hasOwn(other, member) ? [JSON.stringify(other[member])] : []);
			if (new Set(held).size === held.length) return false;
			const others = type.filter((other) => Object.hasOwn(other, member) && !same(other[member], value));
			const unset = (held) => (held ?? null) === null;
			return others.length > 0 && Object.keys(entity).some((field) => field !== member && others.every((other) => unset(other[field]) !== unset(entity[field])));
		};
		pinnedEchoes = (entity, body, type) => {
			const nested = nestedIdentities(entity);
			const namesNested = (member, value) => {
				const text = scalarText(value);
				return text !== undefined && nested.get(referentOf(member))?.has(text) === true;
			};
			return new Set(Object.entries(body).flatMap(([member, value]) => namesNested(member, value) || type !== undefined && stateOf(entity, member, value, type) ? [member] : []));
		};
		restampedFields = (search, target, shown, rules) => {
			const nested = rules.flatMap((rule) => rule.rule === "nested-clock" ? [rule] : []);
			if (nested.length === 0) return shown;
			const later = laterObservation(search, target);
			const fields = { ...shown };
			for (const rule of nested) {
				const read = storedRestamp(shown[rule.field], later?.object[rule.field], rule.members);
				if (read !== undefined) fields[rule.field] = read;
			}
			return fields;
		};
		storedRestamp = (own, read, members) => {
			if (own === undefined || read === undefined) return undefined;
			if (!isObject(own) || !isObject(read)) return undefined;
			for (const key of new Set([...Object.keys(own), ...Object.keys(read)])) {
				if (!members.includes(key)) {
					if (!same(own[key], read[key])) return undefined;
					continue;
				}
				const [written, stored] = [readClock(own[key]), readClock(read[key])];
				if (written === undefined || stored === undefined || Math.abs(written.ms - stored.ms) > NESTED_WINDOW_MS) return undefined;
			}
			return read;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteChanges.js
var changeRule, actionRule, inCallSecond, heldClock, CREATION_CLOCK, sameSecondClocks, sentSlugSource, restampedClock, sentRule;
function init_environmentStateWriteChanges() {
	return (init_environmentStateWriteChanges = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteValues();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteComposed();
		init_environmentStateWriteReferences();
		init_environmentStateWriteStamps();
		changeRule = (evidence, field, slugs) => {
			const before = evidence.before[field];
			const after = evidence.after[field];
			if (readClock(after) !== undefined && isClockNear(after, evidence.startMs)) return {
				field,
				rule: "clock",
				format: readClock(after).format
			};
			if (freshUuid(evidence, field)) return {
				field,
				rule: "unique"
			};
			const member = typeof after === "string" ? slugs.get(after) : undefined;
			if (member !== undefined) return {
				field,
				rule: "slug",
				from: member
			};
			if (freshToken(evidence, field)) return {
				field,
				rule: "unique"
			};
			const nested = nestedClockRule(field, {
				before,
				after
			}, evidence);
			if (nested !== undefined) return nested;
			const reference = evidence.named === undefined ? undefined : referenceRule(field, after, evidence.call.body, evidence.named);
			if (reference !== undefined) return reference;
			const renewed = Array.isArray(before) || isObject(before) ? renewedRule(field, {
				before,
				after
			}, evidence.others) : undefined;
			if (renewed !== undefined) return renewed;
			const was = integerOf(before);
			if (was !== undefined && integerOf(after) === was + 1) return {
				field,
				rule: "increment"
			};
			return stampRule(evidence, field) ?? derivedRule(evidence, field) ?? composedChange(field, {
				...evidence,
				sent: evidence.call.body
			}) ?? actionRule(evidence, field);
		};
		actionRule = (evidence, field) => {
			const after = evidence.after[field];
			return evidence.action === true && (after === null || typeof after !== "object") && readClock(after) === undefined ? {
				field,
				rule: "set",
				value: after
			} : undefined;
		};
		inCallSecond = (value, startMs) => {
			const clock = readClock(value);
			return clock !== undefined && startMs !== undefined && clock.ms % 1e3 === 0 && clock.subMillisecond === 0 && Math.abs(clock.ms - startMs) < 1e3;
		};
		heldClock = (evidence, member, sent) => inCallSecond(sent, evidence.startMs) && same(evidence.before[member], sent) && same(evidence.after[member], sent);
		CREATION_CLOCK = /creat(?:ed|ion)/iu;
		sameSecondClocks = (evidence) => Object.keys(evidence.after).filter((field) => !CREATION_CLOCK.test(field) && !Object.hasOwn(evidence.call.body, field) && Object.hasOwn(evidence.before, field) && same(evidence.before[field], evidence.after[field]) && inCallSecond(evidence.after[field], evidence.startMs));
		sentSlugSource = (evidence, member) => {
			const stored = evidence.after[member];
			if (typeof stored !== "string") return undefined;
			return Object.entries(evidence.call.body).find(([other, value]) => other !== member && typeof value === "string" && same(evidence.after[other], value) && slugOf(value) === stored)?.[0];
		};
		restampedClock = (evidence, member, sent) => !CREATION_CLOCK.test(member) && readClock(sent) !== undefined && same(evidence.before[member], sent) && readClock(evidence.after[member]) !== undefined && isClockNear(evidence.after[member], evidence.startMs);
		sentRule = (evidence, member, held) => {
			const sent = evidence.call.body[member];
			if (held.length === 1 && held[0] === member && !CREATION_CLOCK.test(member)) return {
				field: member,
				rule: "held-clock",
				format: readClock(sent).format
			};
			if (same(evidence.after[member], sent)) return {
				field: member,
				rule: "echo"
			};
			if (same(evidence.after[member], sortedStrings(sent))) return {
				field: member,
				rule: "echo",
				sorted: true
			};
			if (restampedClock(evidence, member, sent)) return {
				field: member,
				rule: "clock",
				format: readClock(evidence.after[member]).format
			};
			const from = sentSlugSource(evidence, member);
			if (from !== undefined) return {
				field: member,
				rule: "slug",
				from
			};
			return freshUuid(evidence, member) ? {
				field: member,
				rule: "unique"
			} : {
				field: member,
				rule: "constant",
				value: evidence.after[member]
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteExplain.js
var indexBody, nextInteger, identityRule, requestRule, learnedClockFormat, createdInteger, generatedRule, unreferenced, bodyOf, explainCreate, echoedSlugs, keptReference, explainUpdate, responseShapeOf, compareValues, orderedBy, UUID_V4, randomIdentities, insertCandidates, insertIndex, documentPointerOf;
function init_environmentStateWriteExplain() {
	return (init_environmentStateWriteExplain = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_environmentStateWriteRules();
		init_environmentStateWriteValues();
		init_environmentStateWriteComposed();
		init_environmentStateWriteReferences();
		init_environmentStateWriteClockFormats();
		init_environmentStateWriteCopies();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteStamps();
		init_environmentStateWriteChanges();
		indexBody = (body) => {
			const copies = new Map();
			const pending = [{
				value: body,
				pointer: ""
			}];
			for (let at = 0; at < pending.length; at += 1) {
				const next = pending[at];
				if (typeof next.value === "string") {
					if (next.value.length >= 8 && !copies.has(next.value)) copies.set(next.value, next.pointer);
					continue;
				}
				const children = Array.isArray(next.value) ? next.value.map((item, index) => [String(index), item]) : isObject(next.value) ? Object.entries(next.value) : [];
				for (const [key, item] of children) pending.push({
					value: item,
					pointer: `${next.pointer}${pointerTo(key)}`
				});
			}
			const slugs = new Map();
			for (const [member, sent] of Object.entries(body)) if (typeof sent === "string") {
				const slug = slugOf(sent);
				if (slug !== sent && !slugs.has(slug)) slugs.set(slug, member);
			}
			return {
				copies,
				slugs
			};
		};
		nextInteger = (members, field, exemplar) => {
			let largest;
			for (const member of members) {
				const value = sequenceNumber(member[field], exemplar);
				if (value !== undefined && (largest === undefined || value > largest)) largest = value;
			}
			return largest === undefined ? undefined : largest + 1;
		};
		identityRule = (field, value) => ({
			field,
			rule: "identity",
			generator: integerOf(value) !== undefined ? "sequence" : isUuid(value) ? "uuid" : "token"
		});
		requestRule = (evidence, index, field, value) => {
			const { body, pathValues } = evidence.call;
			if (Object.hasOwn(body, field) && same(body[field], value)) return {
				field,
				rule: "echo"
			};
			if (Object.hasOwn(body, field) && same(sortedStrings(body[field]), value)) return {
				field,
				rule: "echo",
				sorted: true
			};
			if (typeof value === "string" && value.length >= 8) {
				const from = index.copies.get(value);
				if (from !== undefined) return {
					field,
					rule: "copy",
					from
				};
			}
			const text = scalarText(value);
			for (const [name, pathValue] of pathValues) if (text !== undefined && text === pathValue) return {
				field,
				rule: "path",
				from: name
			};
			const slugged = typeof value === "string" && value.length >= 3;
			const member = slugged ? index.slugs.get(value) : undefined;
			return member === undefined ? undefined : {
				field,
				rule: "slug",
				from: member
			};
		};
		learnedClockFormat = (format, field, value, type) => {
			let learned = format;
			for (const member of type) {
				const fitted = fittedClockFormat(learned, member[field], value);
				if (fitted?.kind === "iso" && fitted.trimmed === true) learned = fitted;
			}
			return type.some((member) => showsFixedWidth(format, member[field])) ? format : learned;
		};
		createdInteger = (field, entity, type) => {
			const value = entity[field];
			const digits = generatedIntegerDigits(value);
			if (digits === undefined || readClock(value) !== undefined || type.length === 0) return undefined;
			const held = new Set([digits]);
			const distinct = type.every((member) => {
				const other = generatedIntegerDigits(member[field]);
				if (other === undefined || typeof member[field] !== typeof value || other.length !== digits.length || held.has(other)) return false;
				held.add(other);
				return true;
			});
			if (!distinct) return undefined;
			return Object.entries(entity).some(([other, kept]) => other !== field && (kept === value || containsNumber(kept, digits) || typeof kept === "object" && kept !== null && containsDelimited(kept, digits))) ? "linked" : "independent";
		};
		generatedRule = (evidence, field, value) => {
			if (field === evidence.idField) return identityRule(field, value);
			const clock = readClock(value);
			if (clock !== undefined && isClockNear(value, evidence.startMs)) return {
				field,
				rule: "clock",
				format: learnedClockFormat(clock.format, field, value, evidence.type)
			};
			const integer = sequenceNumber(value);
			if (integer !== undefined) {
				if (nextInteger(evidence.collection, field, value) === integer) return {
					field,
					rule: "sequence",
					scope: "collection"
				};
				if (nextInteger(evidence.type, field, value) === integer) return {
					field,
					rule: "sequence",
					scope: "type"
				};
			}
			if (isUuid(value) && evidence.type.length > 0 && evidence.type.every((member) => member[field] !== value) || createdInteger(field, evidence.entity, evidence.type) === "independent") return {
				field,
				rule: "unique"
			};
			if (createdToken(field, evidence.entity, evidence.type) === "independent") return {
				field,
				rule: "unique"
			};
			return createdNestedClock(field, value, evidence);
		};
		unreferenced = (rules, pinned) => {
			for (const rule of rules) if (rule.rule === "reference") pinned.delete(rule.member);
			return pinned;
		};
		bodyOf = (body, echoed, required) => ({
			accepted: Object.keys(body).filter((member) => echoed.has(member)),
			fixed: Object.entries(body).filter(([member]) => !echoed.has(member)).map(([member, sent]) => ({
				member,
				sent
			})),
			required: [...required],
			identity: null,
			kinds: []
		});
		explainCreate = (evidence) => {
			const ruled = [];
			const unexplained = [];
			const index = indexBody(evidence.call.body);
			for (const [field, value] of Object.entries(evidence.entity)) {
				const rule = requestRule(evidence, index, field, value) ?? generatedRule(evidence, field, value) ?? (evidence.named === undefined ? undefined : referenceRule(field, value, evidence.call.body, evidence.named));
				if (rule === undefined) unexplained.push(field);
				else ruled.push(rule);
			}
			const rules = siblingTrimmedClocks(ruled, evidence.entity, ...evidence.type);
			const echoed = new Set(rules.flatMap((rule) => rule.rule === "echo" ? [scalarText(evidence.entity[rule.field])] : []));
			const sources = [...rules.filter((rule) => GENERATED.has(rule.rule)), ...rules.filter((rule) => rule.rule === "copy" && !echoed.has(scalarText(evidence.entity[rule.field])))];
			const constants = [];
			const composed = createdComposer(evidence.entity, rules, evidence.type);
			for (const field of unexplained) {
				const template = templateRule(evidence.entity, field, sources) ?? composed(field);
				if (template === undefined) constants.push(field);
				else rules.push(template);
			}
			const tokens = [...evidence.call.pathValues.values()].filter((value) => value.length > 0);
			const templates = rules.flatMap((rule) => rule.rule === "template" ? [rule.field] : []);
			const literals = rules.flatMap((rule) => rule.rule === "composed" ? rule.parts.flatMap((part) => "text" in part ? [part.text] : []) : []);
			const texts = [...constants, ...templates];
			const stranded = strandedCopies(rules, evidence.entity, texts);
			const referenced = new Set([...referencedMembers(evidence.call.body, evidence.entity, constants, evidence.named ?? (() => [])), ...instantMembers(evidence.call.body, evidence.entity, constants)]);
			const pinned = unreferenced(rules, pinnedEchoes(evidence.entity, evidence.call.body, evidence.type));
			const stored = storedMembers(rules.filter((rule) => !stranded.has(rule.field)), evidence.entity);
			return {
				rules,
				body: bodyOf(evidence.call.body, new Set([...stored].filter((member) => !referenced.has(member) && !pinned.has(member))), Object.keys(evidence.call.body)),
				tied: [...[...constants, ...templates].map((field) => evidence.entity[field]), ...literals].some((text) => tokens.some((token) => containsDelimited(text, token)))
			};
		};
		echoedSlugs = (body, echoed) => {
			const slugs = new Map();
			for (const member of echoed) {
				const sent = body[member];
				if (typeof sent === "string" && !slugs.has(slugOf(sent))) slugs.set(slugOf(sent), member);
			}
			return slugs;
		};
		keptReference = (evidence, field) => {
			const known = evidence.references?.find((rule) => rule.field === field);
			if (known === undefined || evidence.named === undefined) return undefined;
			const shown = referenceRule(field, evidence.after[field], evidence.call.body, evidence.named);
			return shown?.member === known.member && shown.type === known.type ? known : undefined;
		};
		explainUpdate = (evidence) => {
			const { body } = evidence.call;
			const rules = [];
			const echoed = new Set();
			const unexplained = [];
			const generated = new Set();
			let identity = null;
			const held = Object.keys(body).filter((member) => member !== evidence.idField && heldClock(evidence, member, body[member]));
			for (const [member, sent] of Object.entries(body)) {
				if (member === evidence.idField) {
					if (scalarText(sent) === evidence.id) identity = member;
					else if (!same(evidence.after[member], evidence.before[member])) unexplained.push(member);
					continue;
				}
				if (!Object.hasOwn(evidence.after, member)) continue;
				const rule = sentRule(evidence, member, held);
				rules.push(rule);
				if (rule.rule === "echo") echoed.add(member);
				else if (rule.rule !== "constant") generated.add(member);
			}
			if (evidence.readFields !== undefined) {
				for (const field of Object.keys(evidence.before)) if (evidence.readFields.includes(field) && !Object.hasOwn(evidence.after, field)) unexplained.push(field);
			}
			const slugs = echoedSlugs(body, echoed);
			for (const field of Object.keys(evidence.after)) {
				if (Object.hasOwn(body, field) || !Object.hasOwn(evidence.before, field) && !(evidence.shown ?? []).includes(field)) continue;
				if (same(evidence.before[field], evidence.after[field])) {
					const kept = keptReference(evidence, field);
					if (kept !== undefined) rules.push(kept);
					continue;
				}
				const rule = changeRule(evidence, field, slugs);
				if (rule === undefined) unexplained.push(field);
				else rules.push(rule);
			}
			rules.push(...pairedStamps(evidence, rules));
			for (const rule of rules) if (rule.rule === "reference") echoed.add(rule.member);
			unexplained.push(...unexplainedRenewals(rules, evidence));
			const pinned = unreferenced(rules, pinnedEchoes(evidence.after, body));
			const shaped = bodyOf(Object.fromEntries(Object.entries(body).filter(([member]) => member !== identity)), new Set([...echoed, ...generated].filter((member) => !pinned.has(member))), evidence.method === "PUT" ? Object.keys(body).filter((member) => member !== identity) : []);
			return {
				rules,
				body: {
					...shaped,
					identity
				},
				unexplained,
				unstamped: sameSecondClocks(evidence)
			};
		};
		responseShapeOf = (ordinal, body, empty, entity) => {
			if (empty) return {
				ordinal,
				shape: "empty",
				pointer: null
			};
			if (body === undefined) return {
				ordinal,
				shape: "recorded",
				pointer: null
			};
			const located = locateItem(body, entity.id);
			if (located?.keys.includes(entity.idField) === true) return {
				ordinal,
				shape: "entity",
				pointer: located.pointer
			};
			if (scalarText(body) === entity.id) return {
				ordinal,
				shape: "identity",
				pointer: ""
			};
			if (isObject(body)) {
				const members = Object.entries(body).filter(([, value]) => scalarText(value) === entity.id);
				if (members.length === 1) return {
					ordinal,
					shape: "identity",
					pointer: pointerTo(members[0][0])
				};
			}
			return {
				ordinal,
				shape: "recorded",
				pointer: null
			};
		};
		compareValues = (left, right) => {
			const [a, b] = [integerOf(left), integerOf(right)];
			if (a !== undefined && b !== undefined) return a - b;
			const [c, d] = [readClock(left), readClock(right)];
			if (c !== undefined && d !== undefined) return c.ms - d.ms || c.subMillisecond - d.subMillisecond;
			return typeof left === "string" && typeof right === "string" ? compareUnicodeCodePoints(left, right) : undefined;
		};
		orderedBy = (members, field, direction) => members.every((member, index) => {
			if (index === 0) return true;
			const order = compareValues(members[index - 1][field], member[field]);
			return order !== undefined && (direction === "ascending" ? order < 0 : order > 0);
		});
		UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
		randomIdentities = (members, idField, clocks) => {
			const ids = members.map((member) => scalarText(member[idField]) ?? "");
			if (ids.length > 0 && ids.every((id) => UUID_V4.test(id))) return true;
			if (members.length < 2 || clocks.length === 0) return false;
			const byId = members.toSorted((left, right) => compareValues(left[idField], right[idField]) ?? 0);
			return clocks.every((clock) => byId.some((member, index) => index > 0 && (compareValues(byId[index - 1][clock], member[clock]) ?? 1) > 0));
		};
		insertCandidates = (members, fields, placing = {}) => {
			const sorted = [];
			if (members.length >= 2) {
				for (const field of fields) for (const direction of ["ascending", "descending"]) if (orderedBy(members, field, direction)) sorted.push({
					rule: "sorted",
					field,
					direction
				});
			}
			const byRandom = (rule) => rule.rule === "sorted" && rule.field === placing.random;
			const early = sorted.filter((rule) => !byRandom(rule));
			const { created } = placing;
			const tied = created !== undefined && new Set(early.map((rule) => insertIndex(rule, members, created))).size > 1;
			return [
				...tied ? [] : early,
				{ rule: "last" },
				...tied ? early : [],
				...sorted.filter(byRandom),
				{ rule: "first" }
			];
		};
		insertIndex = (rule, members, fields) => {
			if (rule.rule !== "sorted") return rule.rule === "first" ? 0 : members.length;
			const index = members.findIndex((member) => {
				const order = compareValues(fields[rule.field], member[rule.field]);
				return order !== undefined && (rule.direction === "ascending" ? order < 0 : order > 0);
			});
			return index < 0 ? members.length : index;
		};
		documentPointerOf = (value, body) => {
			const members = Object.keys(body);
			const candidates = [["", value], ...isObject(value) ? Object.entries(value).map(([name, item]) => [pointerTo(name), item]) : []];
			let best;
			for (const [pointer, candidate] of candidates) {
				if (!isObject(candidate)) continue;
				const shared = members.filter((member) => Object.hasOwn(candidate, member)).length;
				if (shared > 0 && (best === undefined || shared > best.shared)) best = {
					pointer,
					shared
				};
			}
			return best?.pointer;
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteChecks.js
var entityTarget, collectionTarget, documentTarget, SimulatedState, isAbsence, succeeded$1, withBodies, showsPlacement, segmentMatch, matchingTarget, itemTarget, bodyTarget, targetFrom, heldCollection, checkItemRead, listCheck, listedTargets, checkQueryList, checkAllList, checkRecordedList, evaluatedQuery, checkListRead, checkDocumentRead;
function init_environmentStateWriteChecks() {
	return (init_environmentStateWriteChecks = __esmMin((() => {
		init_environmentStateWriteOrder();
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_environmentStatePaging();
		init_environmentStateListQuery();
		init_recordedTransportUrl();
		init_environmentStateWriteExplain();
		init_environmentStateResponseMembers();
		entityTarget = (type, collection, id) => `e${compositeKey([
			type,
			collection,
			id
		])}`;
		collectionTarget = (type, collection) => `c${compositeKey([type, collection])}`;
		documentTarget = (tool) => `d${compositeKey([tool])}`;
		SimulatedState = class {
			#entities = new Map();
			#collections = new Map();
			#documents = new Map();
			#removed = [];
			#served = new ServedOrder();
			/** Each held id's targets, of any type. */
			#named = new Map();
			constructor(entities, documents) {
				for (const entity of entities) this.put(entity);
				this.#served.reset(entities.map(({ type, collection, id }) => entityTarget(type, collection, id)));
				for (const document of documents) this.#documents.set(document.tool, document.value);
			}
			entity(type, collection, id) {
				return this.#entities.get(entityTarget(type, collection, id));
			}
			members(type, collection) {
				return (this.#collections.get(collectionTarget(type, collection)) ?? []).map((key) => this.#entities.get(key));
			}
			ofType(type) {
				return this.#served.keys.map((key) => this.#entities.get(key)).filter((entity) => entity.type === type);
			}
			/** The entities of any type held under an id. */
			named(id) {
				return [...this.#named.get(id) ?? []].map((key) => this.#entities.get(key));
			}
			knownCollections(type) {
				return this.#served.known(type);
			}
			/** Replace an entity in place, or add it at `index` of its collection (the end when omitted). */
			put(entity, index) {
				const key = entityTarget(entity.type, entity.collection, entity.id);
				const known = this.#entities.has(key);
				this.#entities.set(key, entity);
				if (known) return;
				this.#named.set(entity.id, (this.#named.get(entity.id) ?? new Set()).add(key));
				const collection = collectionTarget(entity.type, entity.collection);
				const order = this.#collections.get(collection) ?? [];
				const at = index ?? order.length;
				this.#served.place(key, order, at);
				order.splice(at, 0, key);
				this.#collections.set(collection, order);
				this.#served.remember(entity.type, entity.collection);
			}
			remove(entity) {
				const key = entityTarget(entity.type, entity.collection, entity.id);
				this.#entities.delete(key);
				this.#named.get(entity.id)?.delete(key);
				this.#served.remove(key);
				const collection = collectionTarget(entity.type, entity.collection);
				const order = this.#collections.get(collection) ?? [];
				this.#collections.set(collection, order.filter((member) => member !== key));
				const index = this.#removed.findIndex((target) => target.type === entity.type && target.collection === entity.collection && target.id === entity.id);
				if (index >= 0) this.#removed.splice(index, 1);
				this.#removed.push({
					type: entity.type,
					collection: entity.collection,
					id: entity.id
				});
			}
			/** Removed targets of this type the state does not hold again. */
			removedTargets(type) {
				return this.#removed.filter((target) => target.type === type && !this.#entities.has(entityTarget(type, target.collection, target.id)));
			}
			/** Place created entities again as a create under another insert rule would have. */
			reinsert(type, collection, entities, rule) {
				for (const entity of entities) this.remove(entity);
				for (const entity of entities) {
					const order = this.members(type, collection).map((member) => member.fields);
					this.put(entity, insertIndex(rule, order, entity.fields));
				}
			}
			document(tool) {
				return this.#documents.get(tool);
			}
			setDocument(tool, value) {
				this.#documents.set(tool, value);
			}
		};
		isAbsence = (status) => status === 400 || status === 404 || status === 410;
		succeeded$1 = (record) => record.status !== null && record.status >= 200 && record.status < 300;
		withBodies = (withBody, ordinals, use) => {
			const { base, read } = ordinals;
			return base === read ? withBody(read, (body) => use(body, body)) : withBody(base, (served) => withBody(read, (body) => use(served, body)));
		};
		showsPlacement = (view, outcome, inserted, tool) => view.shape === "list" && (outcome.positional === undefined || [...inserted].some(([target, create]) => create === tool && outcome.positional.has(target)));
		segmentMatch = (held, read) => {
			if (held.length !== read.length) return undefined;
			let verbatim = 0;
			for (const [index, segment] of held.entries()) {
				const value = read[index];
				if (segment === value) verbatim += 1;
				else if (!pathSegmentMatches(segment, value)) return undefined;
			}
			return verbatim;
		};
		matchingTarget = (path, collections, held) => {
			for (const id of path.ids) if (held(path.written, id)) return {
				collection: path.written,
				id
			};
			const ranked = [...new Set(collections())].flatMap((collection) => {
				const verbatim = segmentMatch(segmentsOf(collection), path.read);
				return verbatim === undefined ? [] : [{
					collection,
					verbatim
				}];
			}).sort((left, right) => right.verbatim - left.verbatim);
			for (const { collection } of ranked) for (const id of path.ids) if (held(collection, id)) return {
				collection,
				id
			};
			return undefined;
		};
		itemTarget = (state, type, record) => {
			const read = segmentsOf(record.path);
			const raw = read.pop() ?? "";
			return targetFrom(state, type, {
				read,
				ids: [...new Set([decodedSegment(raw), raw])],
				written: `/${read.join("/")}`
			});
		};
		bodyTarget = (state, type, read, id) => targetFrom(state, type, {
			read,
			ids: [id],
			written: `/${read.join("/")}`
		});
		targetFrom = (state, type, path) => {
			const removed = state.removedTargets(type);
			return matchingTarget(path, () => state.ofType(type).map((entity) => entity.collection), (collection, id) => state.entity(type, collection, id) !== undefined) ?? matchingTarget(path, () => removed.map((target) => target.collection), (collection, id) => removed.some((target) => target.collection === collection && target.id === id)) ?? {
				collection: path.written,
				id: path.ids[0]
			};
		};
		heldCollection = (state, type, path) => {
			const read = segmentsOf(path);
			let held;
			let verbatim = -1;
			for (const collection of new Set(state.ofType(type).map((entity) => entity.collection))) {
				const matched = segmentMatch(segmentsOf(collection), read);
				if (matched !== undefined && matched > verbatim) {
					held = collection;
					verbatim = matched;
				}
			}
			return held ?? `/${read.join("/")}`;
		};
		checkItemRead = (state, view, record, check) => {
			const { collection, id } = itemTarget(state, view.type, record);
			const entity = state.entity(view.type, collection, id);
			const targets = [entityTarget(view.type, collection, id)];
			if (isAbsence(record.status) || succeeded$1(record) && check.body === null) return {
				pass: entity === undefined,
				targets,
				unheld: []
			};
			if (!succeeded$1(record) || check.base === undefined) return undefined;
			const object = check.body === undefined ? undefined : at(check.body, view.pointer);
			if (!isObject(object)) return check.body === undefined || entity === undefined ? undefined : {
				pass: false,
				targets,
				unheld: []
			};
			if (entity === undefined) return {
				pass: false,
				targets,
				unheld: targets
			};
			if (missingRequiredFields(entity, view, check.volatile).length > 0) return {
				pass: false,
				targets,
				unheld: []
			};
			const shown = renderStateEntity(entity, view, check.volatile, object);
			return {
				pass: same(replaceAt(check.base, view.pointer, shown), check.body),
				targets,
				unheld: []
			};
		};
		listCheck = (view, check, members, total) => {
			if (members.some((entity) => missingRequiredFields(entity, view, check.volatile).length > 0)) return { pass: false };
			const observed = new Map(check.items.map((item) => [scalarText(item[check.idField]) ?? "", item]));
			const rendered = members.map((entity) => renderStateEntity(entity, view, check.volatile, observed.get(entity.id)));
			const render = (items) => view.query === undefined || total === undefined ? renderStateList(view, check.base, items) : renderQueryList({
				...view,
				query: view.query
			}, check.base, items, total);
			if (same(render(rendered), check.body)) return { pass: true };
			const differs = members.filter((entity, index) => {
				const item = observed.get(entity.id);
				return item !== undefined && !same(rendered[index], item);
			});
			const patched = rendered.map((item, index) => observed.get(members[index].id) ?? item);
			return differs.length > 0 && same(render(patched), check.body) ? {
				pass: false,
				differing: differs.map((entity) => entityTarget(view.type, check.collection, entity.id))
			} : { pass: false };
		};
		listedTargets = (state, view, check) => {
			const targets = [];
			const unheld = [];
			const ids = [...check.baseItems, ...check.items].map((item) => scalarText(item[check.idField]) ?? "");
			for (const id of new Set(ids)) (state.entity(view.type, check.collection, id) === undefined ? unheld : targets).push(entityTarget(view.type, check.collection, id));
			return {
				targets,
				unheld
			};
		};
		checkQueryList = (state, view, check, values) => {
			const { collection } = check;
			const result = answerQuery(view.query, values, state.members(view.type, collection));
			if (result === undefined) return undefined;
			const outcome = listCheck(view, check, result.page, result.total);
			return {
				...outcome,
				...result.positional === "all" && result.total > 1 ? {} : { positional: new Set((result.positional === "all" ? [] : result.positional).map((entity) => entityTarget(view.type, collection, entity.id))) },
				targets: [...new Set([
					...result.whole ? [collectionTarget(view.type, collection)] : [],
					...result.page.map((entity) => entityTarget(view.type, collection, entity.id)),
					...outcome.pass ? [] : listedTargets(state, view, {
						...check,
						baseItems: []
					}).targets
				])],
				unheld: listedTargets(state, view, check).unheld
			};
		};
		checkAllList = (state, view, check) => {
			const { collection } = check;
			const members = state.members(view.type, collection);
			const held = new Set(members.map((entity) => entity.id));
			return {
				...listCheck(view, check, members, members.length),
				targets: [collectionTarget(view.type, collection), ...members.map((entity) => entityTarget(view.type, collection, entity.id))],
				unheld: check.items.map((item) => scalarText(item[check.idField]) ?? "").filter((id) => !held.has(id)).map((id) => entityTarget(view.type, collection, id))
			};
		};
		checkRecordedList = (state, view, check) => {
			const { collection } = check;
			const idOf = (item) => scalarText(item[check.idField]) ?? "";
			const members = check.baseItems.flatMap((item) => {
				const entity = state.entity(view.type, collection, idOf(item));
				return entity === undefined ? [] : [entity];
			});
			return {
				...listCheck(view, check, members, undefined),
				...listedTargets(state, view, check)
			};
		};
		evaluatedQuery = (view, record, line) => (line.named ? view.query?.record_ordinals.includes(line.ordinal) === true : line.queried === true) ? singleQueryValues(record.query) : undefined;
		checkListRead = (state, view, record, check) => {
			if (!succeeded$1(record)) return undefined;
			const { line } = check;
			const query = evaluatedQuery(view, record, line);
			const all = query === undefined && listsAll(view, line.ordinal);
			const { body, base } = check;
			const baseItems = base === undefined ? undefined : listItems(base, view.pointer);
			if (body === undefined || base === undefined || baseItems === undefined) return undefined;
			const size = pageBound(record.query, baseItems.length);
			if (all && size !== undefined && state.members(view.type, check.collection).length > size) return undefined;
			const items = listItems(body, view.pointer);
			const envelope = line.named || items === undefined ? base : body;
			const bodies = {
				...check,
				body,
				base: envelope,
				items: items ?? [],
				baseItems: line.named || query === undefined ? baseItems : []
			};
			const outcome = query !== undefined ? checkQueryList(state, view, bodies, query) : all ? checkAllList(state, view, bodies) : checkRecordedList(state, view, bodies);
			if (outcome === undefined) return undefined;
			return items === undefined ? {
				...outcome,
				pass: false
			} : outcome;
		};
		checkDocumentRead = (state, view, record, body) => {
			if (!succeeded$1(record)) return undefined;
			const value = state.document(view.tool);
			if (body === undefined || value === undefined) return undefined;
			const minted = view.per_response_members;
			return {
				pass: same(withoutMembers(value, minted), withoutMembers(body, minted)),
				targets: [documentTarget(view.tool)],
				unheld: []
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteAdoption.js
var UnseenEntities;
function init_environmentStateWriteAdoption() {
	return (init_environmentStateWriteAdoption = __esmMin((() => {
		init_webNetworkRouteTemplates();
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		UnseenEntities = class {
			facts;
			/** Targets of the entities the copy has held: the initial ones and any a modelled write or an adoption touched. */
			#held;
			/** Timeline indexes of writes no built plan models, and of redirected or unanswered ones. */
			#unplannedAt = [];
			constructor(initial, facts) {
				this.facts = facts;
				this.#held = new Set(initial.map((entity) => entityTarget(entity.type, entity.collection, entity.id)));
			}
			/** Note an entity a modelled write created, changed or removed, which no read takes back. */
			touched(entity) {
				const key = entityTarget(entity.type, entity.collection, entity.id);
				if (this.#held.has(key)) return;
				this.facts.io.retain(128 + textBytes(key.length));
				this.#held.add(key);
			}
			/** Note a write no built plan models, or one redirected or unanswered. */
			unplanned(index) {
				this.facts.io.retain(128);
				this.#unplannedAt.push(index);
			}
			/**
			* Put into the copy the entity a successful item read shows that the copy never held, when an
			* unplanned write ran since the entity or its collection was last checked; the entity taken, if any.
			*/
			adopt(view, read) {
				const { record, index } = read;
				const { state, lastCheck } = this.facts;
				if (!succeeded$1(record) || !this.#unplannedAt.some((write) => write < index)) return undefined;
				const { collection, id } = itemTarget(state, view.type, record);
				const key = entityTarget(view.type, collection, id);
				if (this.#held.has(key) || state.entity(view.type, collection, id)) return undefined;
				const since = Math.max(lastCheck.get(key) ?? -1, lastCheck.get(collectionTarget(view.type, collection)) ?? -1);
				if (!this.#unplannedAt.some((write) => write > since && write < index)) return undefined;
				const object = this.facts.io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
				const idField = this.facts.idField(view.type);
				if (!isObject(object) || idField === undefined || scalarText(object[idField]) !== id) return undefined;
				const entity = {
					type: view.type,
					collection,
					id,
					fields: object,
					view_fields: [],
					record_ordinals: []
				};
				this.facts.io.retain(128 * 4 + textBytes(key.length) + stateValueRetentionBytes(object));
				state.put(entity);
				this.#held.add(key);
				return entity;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteBlame.js
var EMBED_MATCH_MIN_LENGTH, EMBED_SHORT_ID_MATCH_LENGTH, FailedReadBlame, fieldBlame, lackingFields, names, eachObject, embeds, embeddingCreates;
function init_environmentStateWriteBlame() {
	return (init_environmentStateWriteBlame = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteAttribution();
		init_environmentStateWriteChecks();
		init_webNetworkRouteTemplates();
		EMBED_MATCH_MIN_LENGTH = 3;
		EMBED_SHORT_ID_MATCH_LENGTH = 8;
		FailedReadBlame = class {
			#facts;
			#created = [];
			/** When a refused write's recorded outcome last replaced each entity's values. */
			#rebased = new Map();
			constructor(facts) {
				this.#facts = facts;
			}
			/** Note an entity a create inserted. */
			inserted(entity, tool) {
				this.#facts.io.retain(128);
				this.#created.push({
					...entity,
					tool
				});
			}
			/** Note a refused write's recorded outcome replacing an entity's values. */
			rebased(target, index) {
				if (!this.#rebased.has(target)) this.#facts.io.retain(128);
				this.#rebased.set(target, index);
			}
			of(failed) {
				const item = this.#item(failed.view, failed.record);
				const contradicted = new Set(this.#embedding(item, failed.exercised));
				if (failed.exercised.size > 0) {
					const blame = this.#fields(item, failed.exercised);
					for (const name of blame?.contradicted ?? failed.exercised) contradicted.add(name);
					return {
						contradicted,
						confirmed: blame?.confirmed ?? []
					};
				}
				const rebased = item === undefined ? -1 : this.#rebased.get(item.target) ?? -1;
				const create = rebased > failed.since ? this.#facts.inserted.get(item.target) : undefined;
				if (create !== undefined && this.#lacksFields(item)) contradicted.add(create);
				return {
					contradicted,
					confirmed: []
				};
			}
			#item(view, record) {
				if (view.shape !== "item") return undefined;
				const { state, io } = this.#facts;
				const { collection, id } = itemTarget(state, view.type, record);
				const object = io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
				return {
					view,
					target: entityTarget(view.type, collection, id),
					entity: state.entity(view.type, collection, id),
					object: isObject(object) ? object : undefined
				};
			}
			/** Field-attributed blame: whole-entity writers take the difference, each update is checked on the fields its effect holds. */
			#fields(item, exercised) {
				if (item?.entity === undefined || item.object === undefined) return undefined;
				const { touched, pending, effects, records } = this.#facts;
				const partial = new Map();
				const responses = new Map();
				for (const name of exercised) {
					const sent = touched.get(item.target)?.get(name);
					if (sent === undefined || sent === null) continue;
					const changed = effects.changedOn(item.target, name);
					partial.set(name, Array.isArray(changed) ? changed : sent);
					const call = pending.get(item.target)?.at.get(name);
					const response = call === undefined ? undefined : this.#responseObject(records[call], item.entity.id);
					if (response !== undefined) responses.set(name, response);
				}
				return fieldBlame({
					entity: item.entity,
					view: item.view,
					object: item.object,
					volatile: this.#facts.volatileOf(item.view.type)
				}, {
					exercised,
					partial,
					responses
				});
			}
			/** The entity a write's response shows, located by its id. */
			#responseObject(record, id) {
				return this.#facts.io.withBody(record.ordinal, (body) => {
					const located = body === undefined ? undefined : locateItem(body, id);
					const object = located === undefined ? undefined : at(body, located.pointer);
					return isObject(object) ? object : undefined;
				});
			}
			/** The creates, other than those the read exercised, whose entity a failed item read newly embeds in another field. */
			#embedding(item, exercised) {
				if (item?.object === undefined) return [];
				const { state, idField } = this.#facts;
				return embeddingCreates({
					object: item.object,
					entity: item.entity,
					type: item.view.type
				}, this.#created.filter((created) => !exercised.has(created.tool)), (created) => {
					const held = state.entity(created.type, created.collection, created.id);
					const field = idField(created.type);
					return held === undefined || field === undefined ? undefined : {
						fields: held.fields,
						idField: field
					};
				});
			}
			/** Whether the state's entity lacks a field every read of its view shows. */
			#lacksFields(item) {
				return item.entity !== undefined && missingRequiredFields(item.entity, item.view, this.#facts.volatileOf(item.view.type)).length > 0;
			}
		};
		fieldBlame = (read, writes) => {
			const whole = [...writes.exercised].filter((name) => !writes.partial.has(name));
			if (writes.partial.size === 0 || whole.length === 0) return undefined;
			const written = new Set([...writes.partial.values()].flat());
			const shown = renderStateEntity(read.entity, read.view, read.volatile);
			if (Object.keys(read.object).some((field) => Object.hasOwn(shown, field) && !read.volatile.has(field) && !written.has(field) && !same(shown[field], read.object[field]))) return undefined;
			const outcomes = writtenFieldChecks(read.entity, read.view, read.object, {
				volatile: read.volatile,
				writes: writes.partial
			});
			const answered = (name) => {
				const response = writes.responses.get(name);
				const others = new Set([...writes.partial].filter(([other]) => other !== name).flatMap(([, fields]) => fields));
				return response === undefined || Object.keys(response).every((field) => !Object.hasOwn(read.object, field) || read.volatile.has(field) || others.has(field) || same(response[field], read.object[field]));
			};
			const lacking = lackingFields(read, shown, writes);
			const confirmed = [...writes.partial.keys()].filter((name) => outcomes.get(name) === true && answered(name) && !lacking.unruled.has(name));
			const owned = lacking.fields > 0 && !lacking.unowned && [...writes.partial.keys()].every((name) => confirmed.includes(name) || lacking.unruled.has(name));
			return {
				contradicted: [...writes.exercised].filter((name) => !confirmed.includes(name) && !lacking.unruled.has(name) && !(owned && !writes.partial.has(name))),
				confirmed
			};
		};
		lackingFields = (read, shown, writes) => {
			const fields = Object.keys(read.object).filter((field) => !Object.hasOwn(shown, field) && !read.volatile.has(field));
			const unruled = new Set();
			let unowned = false;
			for (const field of fields) {
				const value = read.object[field] ?? null;
				const owners = [...writes.partial.keys()].filter((name) => {
					const response = writes.responses.get(name);
					return value !== null && response !== undefined && same(response[field], value);
				});
				if (owners.length === 0) unowned = true;
				for (const name of owners) if (!writes.partial.get(name).includes(field)) unruled.add(name);
			}
			return {
				fields: fields.length,
				unowned,
				unruled
			};
		};
		names = (item, entity, idField, id) => {
			const length = id.length < EMBED_SHORT_ID_MATCH_LENGTH ? EMBED_SHORT_ID_MATCH_LENGTH : EMBED_MATCH_MIN_LENGTH;
			return scalarText(item[idField]) === id && Object.entries(item).some(([key, member]) => key !== idField && typeof member === "string" && member.length >= length && entity[key] === member);
		};
		eachObject = (value, visit) => {
			const pending = value === undefined ? [] : [value];
			for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
				if (isObject(item)) visit(item);
				const children = Array.isArray(item) ? item : isObject(item) ? Object.values(item) : [];
				for (const child of children) pending.push(child);
			}
		};
		embeds = (value, entity, idField) => {
			const id = scalarText(entity[idField]);
			let found = false;
			if (id !== undefined) eachObject(value, (item) => {
				found ||= names(item, entity, idField, id);
			});
			return found;
		};
		embeddingCreates = (read, created, heldOf) => {
			const byId = new Map();
			const idFields = new Set();
			for (const entity of created) {
				if (entity.type === read.type && entity.id === read.entity?.id) continue;
				const held = heldOf(entity);
				const id = held === undefined ? undefined : scalarText(held.fields[held.idField]);
				if (held === undefined || id === undefined) continue;
				idFields.add(held.idField);
				const key = `${held.idField}\u0000${id}`;
				byId.set(key, [...byId.get(key) ?? [], {
					tool: entity.tool,
					fields: held.fields,
					id
				}]);
			}
			const tools = new Set();
			if (byId.size === 0) return [];
			for (const [field, value] of Object.entries(read.object)) {
				const before = read.entity?.fields[field];
				if (same(before, value)) continue;
				eachObject(value, (item) => {
					for (const idField of idFields) {
						const id = scalarText(item[idField]);
						for (const entity of id === undefined ? [] : byId.get(`${idField}\u0000${id}`) ?? []) if (!tools.has(entity.tool) && names(item, entity.fields, idField, entity.id) && !embeds(before, entity.fields, idField)) tools.add(entity.tool);
					}
				});
			}
			return [...tools];
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteAddress.js
var BULK_DELETE_SEGMENTS, sameSegment, namesCollection, itemAction, collectionType, addressOf, bulkWrite, namedEntities, bulkCollectionOf, actionItemPath, addressedWrite, observationNeeds;
function init_environmentStateWriteAddress() {
	return (init_environmentStateWriteAddress = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		init_environmentStateWriteRules();
		BULK_DELETE_SEGMENTS = new Set([
			"delete",
			"remove",
			"destroy"
		]);
		sameSegment = (left, right) => left.toLowerCase() === right.toLowerCase();
		namesCollection = (segment, types) => [...types].some((type) => {
			const last = segmentsOf(type).at(-1);
			return last !== undefined && sameSegment(last, segment);
		});
		itemAction = (tool, facts) => {
			if (![
				"POST",
				"PUT",
				"PATCH"
			].includes(tool.method)) return undefined;
			const segments = segmentsOf(tool.path_template);
			const [item, segment] = segments.slice(-2);
			if (segments.length < 3 || item === undefined || segment === undefined || !isParam(item) || isParam(segment) || BULK_DELETE_SEGMENTS.has(segment.toLowerCase()) || namesCollection(segment, facts.types)) return undefined;
			const target = normalizedPath(`/${segments.slice(0, -2).join("/")}`);
			const idField = facts.idField(target);
			if (!facts.types.has(target) || idField === undefined || facts.calls.length === 0) return undefined;
			const views = facts.itemViews(target);
			const showsEntity = (record) => {
				const id = pathValuesOf(tool.path_template, record.path)?.get(item.slice(1, -1));
				if (id === undefined || record.status === 201) return false;
				if (facts.emptyResponse(record.ordinal)) return true;
				return facts.withBody(record.ordinal, (body) => {
					if (body === undefined || body === null) return true;
					const located = locateItem(body, id);
					const object = located === undefined ? undefined : at(body, located.pointer);
					return located?.keys.includes(idField) === true && isObject(object) && views.some((view) => (view.pointer === located.pointer || located.pointer === "") && view.required.every((field) => Object.hasOwn(object, field)));
				});
			};
			return facts.calls.every(showsEntity) ? {
				effect: "update",
				target,
				address: {
					by: "action",
					segment
				}
			} : undefined;
		};
		collectionType = (segments, types) => {
			const path = normalizedPath(`/${segments.join("/")}`);
			if (types.has(path)) return path;
			const last = segments.at(-1);
			if (last === undefined || isParam(last)) return undefined;
			const other = last.endsWith("s") ? last.slice(0, -1) : `${last}s`;
			const counterpart = normalizedPath(`/${[...segments.slice(0, -1), other].join("/")}`);
			return other.length > 0 && types.has(counterpart) ? counterpart : undefined;
		};
		addressOf = (body, idField) => {
			const form = (value, member) => {
				if (!Array.isArray(value) || value.length === 0) return undefined;
				const kinds = new Set(value.map((entry) => typeof entry));
				const [kind] = kinds;
				if (kinds.size === 1 && (kind === "string" || kind === "number") && (member === null || /ids?$/i.test(member))) return {
					by: "ids",
					member,
					kind
				};
				return value.every((entry) => isObject(entry) && scalarText(entry[idField]) !== undefined) ? {
					by: "elements",
					member
				} : undefined;
			};
			if (Array.isArray(body)) return form(body, null);
			if (!isObject(body)) return undefined;
			const arrays = Object.entries(body).filter(([, value]) => Array.isArray(value));
			if (arrays.length !== 1) return undefined;
			const [[member, value]] = arrays;
			const found = form(value, member);
			return found?.by === "elements" && Object.keys(body).length > 1 ? undefined : found;
		};
		bulkWrite = (tool, facts) => {
			const segments = segmentsOf(tool.path_template);
			const last = segments.at(-1) ?? "";
			const verb = tool.method === "POST" && BULK_DELETE_SEGMENTS.has(last);
			const effect = tool.method === "DELETE" || verb ? "delete" : ["PUT", "PATCH"].includes(tool.method) ? "update" : undefined;
			if (effect === undefined) return undefined;
			const target = collectionType(verb ? segments.slice(0, -1) : segments, facts.types);
			const idField = target === undefined ? undefined : facts.idField(target);
			if (target === undefined || idField === undefined) return undefined;
			const forms = facts.calls.map((record) => addressOf(requestJson(facts.requestBody(record.ordinal)), idField));
			const [first] = forms;
			if (first === undefined || forms.some((form) => JSON.stringify(form) !== JSON.stringify(first))) return undefined;
			if (effect === "update" && first.by === "ids" && first.member === null) return undefined;
			return {
				effect,
				target,
				address: first
			};
		};
		namedEntities = (address, body, idField) => {
			const found = addressOf(body, idField);
			if (found === undefined || found.by !== address.by || found.member !== address.member || found.by === "ids" && address.by === "ids" && found.kind !== address.kind) return undefined;
			const entries = address.member === null ? body : body[address.member];
			const shared = address.member === null || !isObject(body) ? undefined : Object.fromEntries(Object.entries(body).filter(([member]) => member !== address.member));
			const named = entries.map((entry) => address.by === "ids" ? {
				id: scalarText(entry),
				body: shared
			} : {
				id: scalarText(entry[idField]),
				body: entry
			});
			return new Set(named.map(({ id }) => id)).size === named.length ? named : undefined;
		};
		bulkCollectionOf = (target, segments, spelled) => {
			const typed = segmentsOf(target);
			const collection = segments.slice(0, typed.length);
			const last = typed.at(-1);
			if (!isParam(last)) collection[typed.length - 1] = spelled(last);
			return collection;
		};
		actionItemPath = (path) => `/${segmentsOf(path).slice(0, -1).join("/")}`;
		addressedWrite = (tool, input) => {
			const ordinals = new Set(tool.record_ordinals);
			const views = [...input.views];
			const facts = {
				types: input.types,
				idField: input.idField,
				itemViews: (type) => views.flatMap((view) => view.shape === "item" && view.type === type ? [{
					pointer: view.pointer,
					required: view.required_fields
				}] : []),
				calls: input.records.filter((record) => ordinals.has(record.ordinal) && succeeded$1(record)),
				withBody: input.io.withBody,
				requestBody: input.io.requestBody,
				emptyResponse: input.io.emptyResponse
			};
			return itemAction(tool, facts) ?? bulkWrite(tool, facts);
		};
		observationNeeds = (plan, named, pending) => {
			const { address } = plan;
			const clocks = plan.rules.flatMap((rule) => rule.rule === "clock" ? [rule.field] : []);
			if (address === undefined) return {
				required: clocks,
				borrow: true,
				action: false
			};
			if (address.by !== "action") return {
				required: [...clocks, ...Object.keys(named.body ?? {}).filter((member) => member !== named.idField)],
				borrow: true,
				action: false
			};
			return {
				required: clocks,
				borrow: !pending(entityTarget(named.type, named.collection, named.id)),
				action: true
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteApply.js
var renewUuids, kindOf, ownMember, storedKinds, LISTED_MEMBERS, LISTED_NAME_CHARS, listed, bodyContract, SHOWN_VALUE_CHARS, shownValue, bodyProblem, valueAt, pathValue, recordedGeneratedValue, ruledValue, templated, derive, copiedShapes, createdFields, REGENERATED, regenerated, statedValue, updatedFields, documentBodyProblem, writtenDocument, optionalFields, writtenResponse, writtenBulkResponse, updatedEntity;
function init_environmentStateWriteApply() {
	return (init_environmentStateWriteApply = __esmMin((() => {
		init_result();
		init_environmentStateRules();
		init_environmentStateWriteStamps();
		init_environmentStateWriteComposed();
		init_environmentStateWriteReferences();
		init_environmentStateWriteValues();
		renewUuids = (value, pointers, fresh) => {
			const renewed = new Set(pointers);
			const renew = (item, pointer) => {
				if (isUuid(item)) return renewed.has(pointer) ? fresh(item) : item;
				if (Array.isArray(item)) return item.map((child) => renew(child, `${pointer}/*`));
				return isObject(item) ? Object.fromEntries(Object.entries(item).map(([key, child]) => [key, renew(child, `${pointer}${pointerTo(key)}`)])) : item;
			};
			return renew(value, "");
		};
		kindOf = (value) => value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
		ownMember = (object, member) => Object.hasOwn(object, member) ? object[member] : undefined;
		storedKinds = (members, observed, stored) => members.flatMap((member) => {
			const value = ownMember(stored, member);
			return (ownMember(observed, member) ?? null) === null && value !== undefined && value !== null ? [{
				member,
				kind: kindOf(value)
			}] : [];
		});
		LISTED_MEMBERS = 12;
		LISTED_NAME_CHARS = 120;
		listed = (members) => {
			if (members.length === 0) return "none";
			const shown = members.slice(0, LISTED_MEMBERS).map((member) => JSON.stringify(member.length > LISTED_NAME_CHARS ? `${member.slice(0, LISTED_NAME_CHARS)}…` : member)).join(", ");
			return members.length > LISTED_MEMBERS ? `${shown}, … (${String(members.length)} members; all in the state Evidence)` : shown;
		};
		bodyContract = (body) => `accepted members: ${listed(body.accepted)}; members accepted only with their recorded value: ${listed(body.fixed.map(({ member }) => member))}; required: ${listed(body.required)}`;
		SHOWN_VALUE_CHARS = 120;
		shownValue = (value) => {
			const text = JSON.stringify(value);
			return text.length <= SHOWN_VALUE_CHARS ? text : undefined;
		};
		bodyProblem = (body, call, shapes) => {
			const sent = call.body ?? {};
			const fixed = new Map(body.fixed.map((entry) => [entry.member, entry.sent]));
			const kinds = new Map(body.kinds.map((entry) => [entry.member, entry.kind]));
			for (const [member, value] of Object.entries(sent)) {
				if (member === body.identity) {
					if (scalarText(value) !== shapes.id) return `Member ${member} must repeat the target's identity ${shapes.id ?? ""}.`;
					continue;
				}
				if (fixed.has(member)) {
					if (!same(fixed.get(member), value)) return `Member ${member} is accepted only with the value the capture sent, ${shownValue(fixed.get(member)) ?? "too long to show here"}, because the application stored it differently or other recorded fields go with it (${bodyContract(body)}).`;
					continue;
				}
				if (!body.accepted.includes(member)) return `Member ${member} is not one the capture showed stored (${bodyContract(body)}).`;
				const recorded = ownMember(shapes.entity, member);
				const kind = recorded === undefined || recorded === null ? kinds.get(member) : kindOf(recorded);
				if (kind !== undefined && kind !== kindOf(value)) return `Member ${member} must be a JSON ${kind}, as the capture stored it.`;
			}
			const missing = body.required.filter((member) => !Object.hasOwn(sent, member));
			if (missing.length > 0) return `The call lacks required members ${listed(missing)} (${bodyContract(body)}).`;
			return undefined;
		};
		valueAt = (body, pointer) => {
			let value = body;
			for (const token of pointerTokens(pointer)) {
				if (Array.isArray(value)) value = value[Number(token)];
				else if (isObject(value) && Object.hasOwn(value, token)) value = value[token];
				else return undefined;
			}
			return value;
		};
		pathValue = (observed, text) => typeof observed === "number" && integerOf(text) !== undefined ? Number(text) : text;
		recordedGeneratedValue = (rule, base, value) => {
			if (rule.rule !== "nested-clock") return ok(value);
			const clock = isObject(value) ? value[rule.members[0]] : undefined;
			if (clock === undefined || JSON.stringify(readClock(clock)?.format) !== JSON.stringify(rule.format)) return err(`The recorded ${rule.field} has no clock in the plan's format.`);
			const rebuilt = nestedClockValue(base, rule, clock);
			return rebuilt.ok && same(rebuilt.value, value) ? rebuilt : err(`The recorded ${rule.field} differs from its nested-clock rendering.`);
		};
		ruledValue = (rule, observed, call, generate, referenced) => {
			const body = call.body ?? {};
			switch (rule.rule) {
				case "reference": return referencedValue(rule, body, referenced);
				case "identity":
				case "sequence":
				case "unique":
				case "renewed":
				case "clock":
				case "nested-clock":
				case "held-clock": return generate(rule);
				case "echo": return ok(Object.hasOwn(body, rule.field) ? echoed(rule, body[rule.field]) : undefined);
				case "copy": {
					const value = valueAt(body, rule.from);
					return value === undefined ? err(`The call has no value at ${rule.from} in its body, which ${rule.field} copies.`) : ok(value);
				}
				case "path": {
					const value = call.pathValues.get(rule.from);
					return value === undefined ? err(`The call names no ${rule.from} path value, which ${rule.field} takes.`) : ok(pathValue(observed[rule.field], value));
				}
				default: return ok(undefined);
			}
		};
		templated = (observed, written, rule) => {
			const text = observed[rule.field];
			const token = scalarText(observed[rule.from]);
			const replacement = scalarText(written[rule.from]);
			return typeof text === "string" && token !== undefined && replacement !== undefined ? replaceDelimited(text, token, replacement) : undefined;
		};
		derive = (rules, observed, written, sent) => {
			for (const rule of rules) {
				if (rule.rule === "slug") {
					const from = sent[rule.from];
					if (typeof from === "string") written[rule.field] = slugOf(from);
				} else if (rule.rule === "template") {
					const value = templated(observed, written, rule);
					if (value !== undefined) written[rule.field] = value;
				} else if (rule.rule === "stamp") written[rule.field] = rule.value;
				else if (rule.rule === "derived" && Object.hasOwn(sent, rule.member)) written[rule.field] = rule.value;
			}
			for (const rule of rules) if (rule.rule === "composed") {
				const value = composedValue(rule.parts, written);
				if (value === undefined) {
					const sources = new Set(rule.parts.flatMap((part) => "from" in part ? [part.from] : []));
					return `The write composes ${JSON.stringify(rule.field)} from ${listed([...sources])}, and the entity holds no value one of them can spell.`;
				}
				written[rule.field] = value;
			}
			return undefined;
		};
		copiedShapes = (rules, observed) => Object.fromEntries(rules.flatMap((rule) => {
			if (rule.rule !== "copy" || !Object.hasOwn(observed, rule.field)) return [];
			const tokens = pointerTokens(rule.from);
			return tokens.length === 1 ? [[tokens[0], observed[rule.field]]] : [];
		}));
		createdFields = (plan, observed, call, generate, referenced) => {
			if (plan.body === null) return err("The tool has no modelled body.");
			const problem = bodyProblem(plan.body, call, { entity: {
				...copiedShapes(plan.rules, observed),
				...observed
			} });
			if (problem !== undefined) return err(problem);
			const written = { ...observed };
			const defaults = new Map((plan.body.defaults ?? []).map(({ member, value }) => [member, value]));
			for (const rule of plan.rules) {
				const value = ruledValue(rule, observed, call, generate, referenced);
				if (!value.ok) return value;
				if (value.value !== undefined) written[rule.field] = value.value;
				else if (rule.rule === "echo" && defaults.has(rule.field)) written[rule.field] = defaults.get(rule.field);
				else if (rule.rule === "echo" || rule.rule === "reference") delete written[rule.field];
			}
			const unspelled = derive(plan.rules, observed, written, call.body ?? {});
			return unspelled === undefined ? ok(written) : err(unspelled);
		};
		REGENERATED = new Set([
			"clock",
			"nested-clock",
			"held-clock",
			"unique"
		]);
		regenerated = (rule) => REGENERATED.has(rule.rule);
		statedValue = (rule, sent) => {
			if (rule.rule === "set") return rule.value;
			if (rule.rule !== "echo" && rule.rule !== "constant") return undefined;
			if (!Object.hasOwn(sent, rule.field)) return undefined;
			return rule.rule === "echo" ? echoed(rule, sent[rule.field]) : rule.value;
		};
		updatedFields = (plan, entity, call, generate, referenced) => {
			const { before, observed } = entity;
			if (plan.body === null) return err("The tool has no modelled body.");
			const sent = call.body ?? {};
			const problem = bodyProblem(plan.body, call, {
				entity: {
					...observed,
					...before
				},
				id: call.id
			}) ?? stampProblem(plan.rules, before, sent);
			if (problem !== undefined) return err(problem);
			const members = Object.keys(sent).filter((member) => member !== plan.body?.identity);
			if (members.length === 0 && plan.address?.by !== "action") return err(`The call sends none of the members an update applies (${bodyContract(plan.body)}).`);
			const written = { ...before };
			for (const rule of plan.rules) {
				const stated = statedValue(rule, sent);
				if (stated !== undefined) written[rule.field] = stated;
				else if (rule.rule === "reference" && Object.hasOwn(sent, rule.member)) {
					const value = referencedValue(rule, sent, referenced);
					if (!value.ok) return value;
					if (value.value !== undefined) written[rule.field] = value.value;
				} else if (rule.rule === "increment") {
					const was = integerOf(before[rule.field]);
					if (was !== undefined) written[rule.field] = spelledLike(before[rule.field], was + 1);
				} else if (regenerated(rule) || rule.rule === "renewed" && Object.hasOwn(before, rule.field)) {
					const value = generate(rule);
					if (!value.ok) return value;
					if (value.value !== undefined) written[rule.field] = value.value;
				}
			}
			const unspelled = derive(plan.rules.filter((rule) => rule.rule !== "slug" || Object.hasOwn(sent, rule.from)), observed, written, sent);
			return unspelled === undefined ? ok(written) : err(unspelled);
		};
		documentBodyProblem = (plan, call, documents) => {
			if (plan.body === null) return "The tool has no modelled body.";
			const pointer = plan.observation?.pointer ?? "";
			const members = (value) => {
				const object = value === undefined ? undefined : at(value, pointer);
				return isObject(object) ? object : {};
			};
			return bodyProblem(plan.body, call, { entity: {
				...members(documents.initial),
				...members(documents.current)
			} });
		};
		writtenDocument = (plan, before, call) => {
			const pointer = plan.observation?.pointer ?? "";
			const target = at(before, pointer);
			if (!isObject(target) || call.body === undefined) return err("The call's body does not fit the document.");
			const value = plan.merge === "replace" ? { ...call.body } : {
				...target,
				...call.body
			};
			return ok(replaceAt(before, pointer, value));
		};
		optionalFields = (plan) => {
			if (plan.effect !== "create" || plan.body === null) return [];
			const { required, defaults = [] } = plan.body;
			return plan.rules.flatMap((rule) => rule.rule === "reference" && !required.includes(rule.member) || rule.rule === "echo" && !required.includes(rule.field) && !defaults.some(({ member }) => member === rule.field) ? [rule.field] : []);
		};
		writtenResponse = (response, recorded, written, optional = []) => {
			if (response.shape === "empty") return ok(undefined);
			if (response.shape === "recorded" || recorded === undefined) return ok(recorded);
			const pointer = response.pointer ?? "";
			const shown = at(recorded, pointer);
			if (response.shape === "identity") return ok(replaceAt(recorded, pointer, typeof shown === "number" && integerOf(written.id) !== undefined ? Number(written.id) : written.id));
			if (!isObject(shown) || written.fields === undefined) return err("The recorded response does not carry the entity.");
			const held = (field) => Object.hasOwn(written.fields, field);
			const missing = Object.keys(shown).filter((field) => !held(field) && !optional.includes(field));
			if (missing.length > 0) return err(`The state holds no complete entity for this response: it lacks ${missing.join(", ")}.`);
			const fields = [...Object.keys(shown).filter(held), ...optional.filter((field) => !Object.hasOwn(shown, field) && held(field))];
			return ok(replaceAt(recorded, pointer, Object.fromEntries(fields.map((field) => {
				const value = written.fields[field];
				const clock = written.clocks?.includes(field) === true ? readClock(shown[field]) : undefined;
				return [field, clock === undefined ? value : respellClock(value, clock.format)];
			}))));
		};
		writtenBulkResponse = (response, recorded, written) => {
			if (response.shape === "empty") return ok(undefined);
			if (response.shape === "recorded") return ok(recorded);
			const [template] = Array.isArray(recorded) ? recorded : [];
			if (template === undefined) return err("The recorded response shows no element to render.");
			const elements = [];
			for (const entity of written) {
				const element = writtenResponse({
					...response,
					pointer: ""
				}, template, entity);
				if (!element.ok) return element;
				elements.push(element.value ?? null);
			}
			return ok(elements);
		};
		updatedEntity = (entity, fields) => {
			const changed = new Set(Object.keys(fields).filter((field) => !same(ownMember(entity.fields, field), fields[field])));
			return {
				...entity,
				fields,
				record_ordinals: [],
				view_fields: entity.view_fields.map((view) => ({
					tool: view.tool,
					fields: Object.fromEntries(Object.entries(view.fields).filter(([field]) => !changed.has(field)))
				})).filter((view) => Object.keys(view.fields).length > 0)
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteOmitted.js
var OmittedFields, lackedFields, heldEntities, relaxed;
function init_environmentStateWriteOmitted() {
	return (init_environmentStateWriteOmitted = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		OmittedFields = class {
			retain;
			#omitted = new Map();
			constructor(retain) {
				this.retain = retain;
			}
			/** Check an item or list read with the fields reads showed omitted, this one's included, no longer required, naming this one's in the outcome. */
			check(state, view, record, read, compare) {
				const omitted = lackedFields(state, view, record, read);
				const noted = this.#omitted.get(view.type);
				const loosened = relaxed(view, omitted.length === 0 ? noted : new Set([...noted ?? [], ...omitted]));
				const outcome = compare(loosened);
				return outcome === undefined ? undefined : {
					...outcome,
					omitted
				};
			}
			/** Note the fields a read the gate counts shows left out, so no view of its type requires them. */
			keep(view, outcome) {
				if (view.shape !== "item" && view.shape !== "list") return;
				for (const field of outcome.omitted ?? []) this.#note(view.type, field);
			}
			/** The current required-field facts, shared by observations, checks and final output. */
			view(view) {
				return view.shape === "item" || view.shape === "list" ? relaxed(view, this.#omitted.get(view.type)) : view;
			}
			/** The views with the fields reads showed omitted no longer required. */
			views(views) {
				return views.map((view) => this.view(view));
			}
			#note(type, field) {
				let fields = this.#omitted.get(type);
				if (fields === undefined) {
					fields = new Set();
					this.#omitted.set(type, fields);
				}
				if (!fields.has(field)) {
					this.retain(64 + field.length * 2);
					fields.add(field);
				}
			}
		};
		lackedFields = (state, view, record, read) => {
			if (!succeeded$1(record) || read.body === undefined || projectsFields(record.query)) return [];
			const lacked = new Set();
			for (const entity of heldEntities(state, view, read)) for (const field of view.required_fields) if (!Object.hasOwn(entity, field)) lacked.add(field);
			return [...lacked];
		};
		heldEntities = (state, view, read) => {
			const object = view.shape === "item" ? at(read.body, view.pointer) : null;
			const shown = view.shape === "list" ? listItems(read.body, view.pointer) ?? [] : isObject(object) && read.itemId !== undefined && scalarText(object[read.idField]) === read.itemId ? [object] : [];
			return shown.filter((entity) => {
				const id = scalarText(entity[read.idField]);
				return id !== undefined && state.entity(view.type, read.collection, id) !== undefined;
			});
		};
		relaxed = (view, omitted) => omitted === undefined ? view : {
			...view,
			required_fields: view.required_fields.filter((field) => !omitted.has(field))
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteSorted.js
var inOrder, ordered, listedSorted, shownBy, sortableFields, creationOrderFits, SortedArrays;
function init_environmentStateWriteSorted() {
	return (init_environmentStateWriteSorted = __esmMin((() => {
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		init_webNetworkRouteTemplates();
		inOrder = (values) => values.every((value, index) => index === 0 || compareUnicodeCodePoints(values[index - 1], value) <= 0);
		ordered = (value) => value !== undefined && isStringArray(value) && new Set(value).size >= 2;
		listedSorted = (shown, field) => shown.every((object) => {
			const value = object[field];
			return !ordered(value) || inOrder(value);
		});
		shownBy = (entity, tool, field) => {
			const own = entity.view_fields.find((candidate) => candidate.tool === tool)?.fields;
			return own !== undefined && Object.hasOwn(own, field) ? own[field] : entity.fields[field];
		};
		sortableFields = (view, entities) => view.fields.filter((field) => {
			let distinct = false;
			for (const entity of entities) {
				const value = shownBy(entity, view.tool, field);
				if (value === undefined || value === null) continue;
				if (!isStringArray(value) || !inOrder(value)) return false;
				distinct ||= new Set(value).size >= 2;
			}
			return distinct;
		});
		creationOrderFits = (shown, written, existing) => {
			const firstNew = shown.findIndex((value) => !existing.has(value));
			const fresh = written.filter((value) => !existing.has(value));
			return firstNew < 0 || shown.slice(firstNew).every((value) => !existing.has(value)) && shown.slice(firstNew).every((value, index) => value === fresh[index]);
		};
		SortedArrays = class {
			facts;
			#candidates = new Map();
			#adopted = new Map();
			/** Retired views retain their former sort fields only for checking later values. */
			#retired = new Map();
			/** Values each type's initial entities held, per candidate field. */
			#existing = new Map();
			constructor(views, entities, facts) {
				this.facts = facts;
				for (const view of views) {
					if (view.shape !== "item" && view.shape !== "list") continue;
					const own = entities.filter((entity) => entity.type === view.type);
					const fields = sortableFields(view, own);
					if (fields.length === 0) continue;
					this.#candidates.set(view.tool, {
						type: view.type,
						fields
					});
					for (const field of fields) this.#noteExisting(view.type, field, own);
					facts.io.retain(128 + fields.reduce((bytes, field) => bytes + textBytes(field.length), 0));
				}
			}
			/** The serving projection: recorded after ordering was disproved, otherwise with learned sorts. */
			view(view) {
				if (view.shape !== "item" && view.shape !== "list") return view;
				if (this.#retired.has(view.tool)) return {
					tool: view.tool,
					shape: "recorded",
					reason: view.shape === "item" ? "fields-differ" : "list-differs"
				};
				return this.comparisonView(view);
			}
			/** A retired view still describes where values were observed, but cannot supply serving proof. */
			comparisonView(view) {
				if (view.shape !== "item" && view.shape !== "list") return view;
				const fields = this.#retired.get(view.tool) ?? this.#adopted.get(view.tool);
				return fields === undefined ? view : {
					...view,
					sorted_arrays: fields
				};
			}
			/** The serving projections exported after simulation. */
			views(views) {
				return views.map((view) => this.view(view));
			}
			/**
			* Note what a read the gate counts shows, then retry it if it failed: the outcome with the fewest
			* candidate fields sorted that make it pass, which the type's views then keep; the outcome as it
			* was, without any learned field the read lists unsorted, when none does, the passing check is
			* blocked or the read's order is ambiguous.
			*/
			retry(view, read, check, blocked) {
				if (view.shape !== "item" && view.shape !== "list") return read.outcome;
				const retired = this.#retired.get(view.tool);
				if (retired !== undefined) return read.outcome.pass ? read.outcome : check({
					...view,
					sorted_arrays: retired
				}, (body) => this.#comparisonBody(view, retired, body)) ?? read.outcome;
				if (!this.#candidates.has(view.tool) && !this.#adopted.has(view.tool)) return read.outcome;
				const shown = this.#shown(view, read.record);
				this.#ruleOut(view.tool, shown);
				const adopted = this.#adopted.get(view.tool) ?? [];
				if (this.#unlearn(view.tool, shown)) return check({
					...view,
					sorted_arrays: adopted
				}, (body) => this.#comparisonBody(view, adopted, body)) ?? read.outcome;
				const current = view;
				const failed = read.outcome;
				const candidates = this.#candidates.get(view.tool)?.fields;
				if (failed.pass || candidates === undefined) return failed;
				const passing = (fields) => {
					const outcome = check({
						...current,
						sorted_arrays: [...current.sorted_arrays ?? [], ...fields]
					});
					return outcome?.pass === true && !blocked([...outcome.targets, ...outcome.unheld]) ? outcome : undefined;
				};
				let outcome = passing(candidates);
				if (outcome === undefined) return failed;
				let needed = candidates;
				for (const field of candidates) {
					const fewer = needed.filter((name) => name !== field);
					const retried = fewer.length === 0 ? undefined : passing(fewer);
					if (retried !== undefined) [needed, outcome] = [fewer, retried];
				}
				const targets = new Set(outcome.targets);
				if (!needed.every((field) => this.#telling(view, shown, field, targets))) return failed;
				this.#adopt(view.type, needed);
				return outcome;
			}
			/** Compare a retired view's values as multisets only for its formerly sorted string-array fields. */
			#comparisonBody(view, fields, body) {
				const normalize = (value) => {
					if (!isObject(value)) return value;
					const object = { ...value };
					for (const field of fields) {
						const array = object[field];
						if (array !== undefined && isStringArray(array)) object[field] = array.toSorted(compareUnicodeCodePoints);
					}
					return object;
				};
				const value = at(body, view.pointer);
				if (value === undefined) return body;
				return replaceAt(body, view.pointer, view.shape === "list" && Array.isArray(value) ? value.map(normalize) : normalize(value));
			}
			/** The entity objects a read recorded at the view's pointer. */
			#shown(view, record) {
				return this.facts.io.withBody(record.ordinal, (body) => {
					if (body === undefined || body === null) return [];
					if (view.shape === "list") return (listItems(body, view.pointer) ?? []).filter(isObject);
					const object = at(body, view.pointer);
					return isObject(object) ? [object] : [];
				});
			}
			/** A read listing a candidate field unsorted shows its view does not sort it. */
			#ruleOut(tool, shown) {
				const entry = this.#candidates.get(tool);
				if (entry === undefined) return;
				const left = entry.fields.filter((field) => listedSorted(shown, field));
				if (left.length === 0) this.#candidates.delete(tool);
				else if (left.length < entry.fields.length) this.#candidates.set(tool, {
					...entry,
					fields: left
				});
			}
			/** Contradictory ordering makes the view recorded and invalidates its earlier confirmations. */
			#unlearn(tool, shown) {
				const adopted = this.#adopted.get(tool) ?? [];
				const kept = adopted.filter((field) => listedSorted(shown, field));
				if (kept.length === adopted.length) return false;
				this.#retired.set(tool, adopted);
				this.#adopted.delete(tool);
				this.#candidates.delete(tool);
				return true;
			}
			/** Whether a read shows a written array of an entity it covers in an order neither the written one nor the order the values were first held in. */
			#telling(view, shown, field, targets) {
				const idField = this.facts.idField(view.type) ?? "";
				const existing = this.#existing.get(`${view.type}\u0000${field}`);
				return shown.some((object) => {
					const value = object[field];
					const id = scalarText(object[idField]);
					if (!ordered(value) || id === undefined) return false;
					return this.facts.state.named(id).some((entity) => {
						const written = entity.fields[field];
						return targets.has(entityTarget(entity.type, entity.collection, entity.id)) && written !== undefined && isStringArray(written) && written.length === value.length && written.some((item, index) => item !== value[index]) && !creationOrderFits(value, written, existing);
					});
				});
			}
			/** Sort the fields in every view of the type that could sort them. */
			#adopt(type, fields) {
				for (const [tool, entry] of this.#candidates) {
					if (entry.type !== type) continue;
					const taken = entry.fields.filter((field) => fields.includes(field));
					if (taken.length === 0) continue;
					this.#adopted.set(tool, [...this.#adopted.get(tool) ?? [], ...taken]);
					const left = entry.fields.filter((field) => !taken.includes(field));
					if (left.length === 0) this.#candidates.delete(tool);
					else this.#candidates.set(tool, {
						...entry,
						fields: left
					});
				}
			}
			#noteExisting(type, field, entities) {
				const key = `${type}\u0000${field}`;
				let values = this.#existing.get(key);
				if (values === undefined) this.#existing.set(key, values = new Set());
				const held = entities.flatMap((entity) => [entity.fields[field], ...entity.view_fields.map((view) => view.fields[field])].flatMap((value) => value !== undefined && value !== null && isStringArray(value) ? value : []));
				for (const item of held) if (!values.has(item)) {
					this.facts.io.retain(textBytes(item.length));
					values.add(item);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteCalls.js
var unsentChange, regenerates, keptFields, disagreesWithCall, steadyFields, scalars, observedValue, shownScalars, sameObserved, reconciledUpdateRule, contradictsEarlierCalls, refinedBody, conflictsWithPlan, appliedUpdate, rememberCall;
function init_environmentStateWriteCalls() {
	return (init_environmentStateWriteCalls = __esmMin((() => {
		init_jsonSerialization();
		init_canonicalDigest();
		init_environmentStateRules();
		init_environmentStateWriteApply();
		init_environmentStateWriteComposed();
		init_environmentStateWriteRules();
		init_environmentStateWriteValues();
		unsentChange = (rule) => rule.rule === "increment" || rule.rule === "slug" || rule.rule === "composed" || rule.rule === "stamp" || rule.rule === "derived" || rule.rule === "set";
		regenerates = (rule) => rule.rule === "unique" || rule.rule === "renewed" || rule.rule === "nested-clock";
		keptFields = (before, after) => Object.keys(after).filter((field) => Object.hasOwn(before, field) && same(before[field], after[field]));
		disagreesWithCall = (rules, call) => rules.some((rule) => unsentChange(rule) && Object.hasOwn(call.after, rule.field) && !same(call.written[rule.field], call.after[rule.field]) || regenerates(rule) && call.kept.includes(rule.field));
		steadyFields = (rules, before, after) => rules.flatMap((rule) => rule.rule === "set" && same(before[rule.field], rule.value) && same(after[rule.field], rule.value) ? [rule.field] : []);
		scalars = (object) => new Map(Object.entries(object).filter(([, value]) => value === null || typeof value !== "object"));
		observedValue = (value) => value !== null && typeof value === "object" ? {
			kind: "structured",
			digest: digestCanonicalValue(value)
		} : {
			kind: "scalar",
			value
		};
		shownScalars = (shown) => Object.fromEntries([...shown].flatMap(([field, observed]) => observed.kind === "scalar" ? [[field, observed.value]] : []));
		sameObserved = (left, right) => left.kind === "structured" ? right.kind === "structured" && left.digest === right.digest : right.kind === "scalar" && same(left.value, right.value);
		reconciledUpdateRule = (held, later, kept) => {
			const alike = alikeRules(held, later, kept);
			if (alike !== undefined) return alike;
			for (const [derived, ambiguous] of [[held, later], [later, held]]) {
				if (derived.rule === "slug" && ambiguous.rule === "echo" && ambiguous.sorted !== true) return derived;
				if (derived.rule === "clock" && ambiguous.rule === "held-clock" && same(derived.format, ambiguous.format)) return derived;
			}
			return undefined;
		};
		contradictsEarlierCalls = (draft, rules) => {
			const ruled = new Map(draft.plan.rules.map((rule) => [rule.field, rule]));
			return rules.some((rule) => {
				if (!(unsentChange(rule) || regenerates(rule) || rule.rule === "clock") || ruled.has(rule.field) && !(rule.rule === "slug" && ruled.get(rule.field)?.rule === "echo")) return false;
				const expected = rule.rule === "set" || rule.rule === "stamp" || rule.rule === "derived" ? observedValue(rule.value) : undefined;
				return draft.updates.some(({ shown, sent, kept }) => {
					if (regenerates(rule)) return kept.includes(rule.field);
					const observation = shown.get(rule.field);
					if (observation === undefined) return false;
					if (rule.rule === "increment") return observation.kind === "structured" || integerOf(observation.value) !== undefined;
					if (rule.rule === "set") return !sameObserved(observation, expected);
					if (rule.rule === "clock") return true;
					if (rule.rule === "stamp") return !sameObserved(observation, expected);
					if (rule.rule === "derived") return sent.has(rule.member) && !sameObserved(observation, expected);
					if (rule.rule === "composed") {
						const value = composedValue(rule.parts, shownScalars(shown));
						return value === undefined || !sameObserved(observation, observedValue(value));
					}
					const from = rule.rule === "slug" ? sent.get(rule.from) : undefined;
					return rule.rule === "slug" && (typeof from === "string" ? !sameObserved(observation, observedValue(slugOf(from))) : !kept.includes(rule.field));
				});
			});
		};
		refinedBody = (body, later, values) => {
			const fixed = new Set(body.fixed.map((entry) => entry.member));
			const accepted = later.accepted.filter((member) => !body.accepted.includes(member));
			return {
				...body,
				identity: body.identity ?? later.identity,
				accepted: [...body.accepted, ...accepted],
				fixed: [...body.fixed, ...later.fixed.filter((entry) => !fixed.has(entry.member))],
				kinds: [...body.kinds, ...storedKinds(accepted, values.observed, values.stored)]
			};
		};
		conflictsWithPlan = (plan, explained, kept) => {
			const body = plan.body;
			const fixed = new Map(body.fixed.map((entry) => [entry.member, entry.sent]));
			const rules = new Map(plan.rules.map((rule) => [rule.field, rule]));
			const { identity } = explained.body;
			return explained.body.accepted.some((member) => fixed.has(member)) || explained.body.fixed.some((entry) => body.accepted.includes(entry.member) || entry.member === body.identity || fixed.has(entry.member) && !same(fixed.get(entry.member), entry.sent)) || identity !== null && fixed.has(identity) || explained.rules.some((rule) => {
				const held = rules.get(rule.field);
				return held !== undefined && reconciledUpdateRule(held, rule, kept) === undefined;
			});
		};
		appliedUpdate = (plan, at, before, call) => {
			const { written, body } = call;
			const sent = Object.keys(body).filter((member) => member !== plan.body?.identity);
			const derived = Object.keys(written).filter((field) => !Object.hasOwn(before, field) || !same(written[field], before[field]));
			const changed = {
				fields: [...new Set([...sent, ...derived])],
				accumulated: plan.rules.flatMap((rule) => rule.rule === "increment" ? [rule.field] : [])
			};
			return {
				kind: "applied",
				targets: at.targets,
				entity: at.target,
				fields: sent,
				changed
			};
		};
		rememberCall = (retain, draft, call, sameSecond) => {
			const unstamped = new Set(sameSecond);
			for (const field of unstamped) draft.unstamped.add(field);
			const kept = call.kept.filter((field) => !unstamped.has(field));
			const shown = new Map(Object.entries(call.after).map(([field, value]) => [field, observedValue(value)]));
			for (const field of unstamped) shown.delete(field);
			const facts = {
				shown,
				sent: scalars(call.sent),
				kept
			};
			retain(64 + jsonTextCodeUnits([
				...facts.shown,
				...facts.sent,
				kept
			]) * 2);
			draft.updates.push(facts);
			for (const field of steadyFields(draft.plan.rules, call.before, call.after)) draft.steady.add(field);
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteEffects.js
var clockEvidence, UNKNOWN$1, built, fail, refuse, requestBodyPlan, callOf, referencedIn, startOf, searchFrom, itemReads, updatedObservation, refineUpdate, retainFixed, outcomes, buildUpdate, applyUpdate, updateEntity, fitUpdateClocks, contradictsGeneratedClock, contradictsPlan;
function init_environmentStateWriteEffects() {
	return (init_environmentStateWriteEffects = __esmMin((() => {
		init_jsonSerialization();
		init_environmentStateRules();
		init_environmentStateWriteApply();
		init_environmentStateWriteChecks();
		init_environmentStateWriteExplain();
		init_environmentStateWriteGenerated();
		init_environmentStateWriteCalls();
		init_environmentStateWriteObserve();
		init_environmentStateWriteStamps();
		init_environmentStateWriteValues();
		init_environmentStateWriteClockFormats();
		init_environmentStateWriteAddress();
		init_environmentStateWriteRules();
		clockEvidence = (draft, field) => draft.fixedWidth.get(field) ?? draft.observed?.[field];
		UNKNOWN$1 = { kind: "unknown" };
		built = (draft) => draft.plan.exemplar_ordinal !== null;
		fail = (draft, step, reason) => {
			if (!built(draft) && !step.observeOnly) draft.plan.reason = reason;
		};
		refuse = (draft, step, reason) => {
			if (!step.observeOnly) draft.plan.reason = reason;
		};
		requestBodyPlan = (context, step, draft, observed) => step.pinned ? plannedBody(requestJson(context.io.requestBody(step.record.ordinal)), {
			built: built(draft),
			envelope: draft.plan.body?.envelope
		}, (member) => observed !== undefined && Object.hasOwn(observed, member)) : undefined;
		callOf = (step, body) => ({
			path: step.record.path,
			pathValues: pathValuesOf(step.tool.path_template, step.record.path) ?? new Map(),
			body
		});
		referencedIn = (context) => (type, id) => context.state.ofType(type).flatMap((entity) => entity.id === id ? [entity.fields] : []);
		startOf = (context, step) => context.timed ? step.record.start : undefined;
		searchFrom = (context, step) => ({
			records: context.records,
			from: step.index,
			...context.timed ? { after: step.record.end } : {},
			viewOf: context.viewOf,
			withBody: context.io.withBody,
			queryOf: context.io.queryOf
		});
		itemReads = (context, entity) => ({
			...entity,
			held: () => true,
			isWrite: context.isWrite,
			sameItem: (record) => {
				const found = itemTarget(context.state, entity.type, record);
				return found.collection === entity.collection && found.id === entity.id;
			}
		});
		updatedObservation = (context, step, entity, observing) => {
			const { required, borrow } = observing;
			const own = step.responseObservation === undefined ? context.io.withBody(step.record.ordinal, (body) => {
				const located = body === undefined ? undefined : locateItem(body, entity.id);
				const object = located === undefined ? undefined : at(body, located.pointer);
				return located?.keys.includes(entity.idField) === true && isObject(object) ? {
					ordinal: step.record.ordinal,
					pointer: located.pointer,
					object,
					id: entity.id
				} : undefined;
			}) : step.responseObservation ?? undefined;
			if (own !== undefined && required.every((field) => Object.hasOwn(own.object, field))) return own;
			if (!borrow) return undefined;
			const later = laterObservation(searchFrom(context, step), {
				...itemReads(context, entity),
				covers: (view) => required.every((field) => view.fields.includes(field))
			});
			if (later === undefined) return own;
			const readFields = viewFields(context.viewOf(later.ordinal));
			context.observed(later.ordinal);
			const object = {
				...own?.object,
				...later.object
			};
			for (const field of readFields ?? []) if (!Object.hasOwn(later.object, field)) delete object[field];
			return {
				...later,
				object,
				...readFields === undefined ? {} : { readFields }
			};
		};
		refineUpdate = (context, draft, evidence) => {
			const { plan } = draft;
			const body = refinedBody(plan.body, evidence.explained.body, {
				observed: draft.observed,
				stored: evidence.after.object
			});
			retainFixed(context, body.fixed.slice(plan.body.fixed.length));
			plan.body = body;
			const ruled = new Set(plan.rules.map((rule) => rule.field));
			const later = new Map(evidence.explained.rules.map((rule) => [rule.field, rule]));
			plan.rules = [...plan.rules.map((rule) => {
				const shown = later.get(rule.field);
				return shown === undefined ? rule : reconciledUpdateRule(rule, shown, draft.kept) ?? rule;
			}), ...evidence.explained.rules.filter((rule) => !ruled.has(rule.field))];
		};
		retainFixed = (context, fixed) => {
			if (fixed.length > 0) context.io.retain(64 + jsonTextCodeUnits(fixed) * 2);
		};
		outcomes = (context, entity, shown) => {
			const { type, collection, id } = entity;
			const targets = [entityTarget(type, collection, id), collectionTarget(type, collection)];
			const target = {
				type,
				collection,
				id
			};
			const recorded = () => {
				context.state.put(updatedEntity(entity, {
					...entity.fields,
					...shown
				}));
				return {
					kind: "observed",
					targets,
					entity: target
				};
			};
			return {
				targets,
				target,
				recorded
			};
		};
		buildUpdate = (context, draft, step, evidence) => {
			if (built(draft)) {
				refineUpdate(context, draft, evidence);
				return;
			}
			retainFixed(context, evidence.explained.body.fixed);
			const { ordinal } = step.record;
			const envelope = requestBodyPlan(context, step, draft, evidence.after.object)?.envelope;
			Object.assign(draft.plan, {
				exemplar_ordinal: ordinal,
				observation: {
					ordinal: evidence.after.ordinal,
					pointer: evidence.after.pointer
				},
				response: step.response ?? context.io.withBody(ordinal, (response) => responseShapeOf(ordinal, response, context.io.emptyResponse(ordinal), {
					idField: evidence.idField,
					id: evidence.after.id
				})),
				body: {
					...evidence.explained.body,
					...envelope === undefined ? {} : { envelope }
				},
				rules: evidence.explained.rules
			});
			draft.observed = evidence.after.object;
			for (const entity of context.state.ofType(draft.plan.target)) noteFixedWidths(draft.fixedWidth, entity.fields);
		};
		applyUpdate = (context, draft, step) => {
			const action = draft.plan.address?.by === "action";
			const named = itemTarget(context.state, draft.plan.target, { path: action ? actionItemPath(step.record.path) : step.record.path });
			return updateEntity(context, draft, step, {
				...named,
				request: true
			});
		};
		updateEntity = (context, draft, step, named) => {
			const type = draft.plan.target;
			const idField = context.idField(type);
			const { collection, id } = named;
			const needs = observationNeeds(draft.plan, {
				collection,
				id,
				type,
				idField,
				body: "body" in named ? named.body : undefined
			}, context.pending);
			const entity = context.state.entity(type, collection, id);
			const after = entity === undefined ? undefined : updatedObservation(context, step, {
				type,
				idField,
				collection,
				id
			}, needs);
			if (entity === undefined || after === undefined) {
				fail(draft, step, "no-observation");
				return UNKNOWN$1;
			}
			const { targets, target, recorded } = outcomes(context, entity, after.object);
			const body = "body" in named ? named.body : draft.plan.address?.by === "action" && step.pinned && context.io.requestBody(step.record.ordinal).kind === "absent" ? {} : requestBodyPlan(context, step, draft, after.object)?.object;
			if (step.observeOnly || body === undefined) {
				fail(draft, step, "body-unusable");
				return recorded();
			}
			const unknown = context.unknown(type, collection, id);
			const call = {
				...callOf(step, body),
				body
			};
			const { explained, rules } = fitUpdateClocks(draft, after.object, explainUpdate({
				before: entity.fields,
				after: after.object,
				call,
				method: step.tool.method,
				idField,
				id,
				startMs: startOf(context, step),
				...after.readFields === undefined ? {} : { readFields: after.readFields },
				others: otherFields(context.state.ofType(type), {
					collection,
					id
				}),
				shown: shownBefore(context.viewOf, entity, after.ordinal),
				named: (named) => context.state.named(named),
				action: needs.action,
				references: draft.plan.rules.filter((rule) => rule.rule === "reference")
			}));
			for (const member of keptOrders(call.body, after.object)) draft.kept.add(member);
			if (explained.unexplained.length > 0 && !unknown) {
				refuse(draft, step, "unexplained-change");
				return recorded();
			}
			if (built(draft) && (unknown || contradictsPlan({
				...draft,
				plan: {
					...draft.plan,
					rules
				}
			}, entity.fields, after.object, explained))) {
				if (!unknown) refuse(draft, step, "unexplained-change");
				return recorded();
			}
			draft.plan.rules = rules;
			noteFixedWidths(draft.fixedWidth, after.object);
			buildUpdate(context, draft, step, {
				after,
				explained,
				idField
			});
			const written = updatedFields(draft.plan, {
				before: entity.fields,
				observed: draft.observed
			}, {
				...call,
				id
			}, (rule) => recordedGeneratedValue(rule, entity.fields[rule.field], after.object[rule.field]), referencedIn(context));
			const kept = keptFields(entity.fields, after.object);
			const disagrees = written.ok && disagreesWithCall(draft.plan.rules, {
				written: written.value,
				after: after.object,
				kept
			});
			if (!written.ok || disagrees && !unknown) refuse(draft, step, "unexplained-change");
			if (!written.ok || disagrees || unknown) return recorded();
			rememberCall(context.io.retain, draft, {
				before: entity.fields,
				after: after.object,
				sent: body,
				kept
			}, explained.unstamped);
			const stored = restampedFields(searchFrom(context, step), itemReads(context, {
				type,
				idField,
				collection,
				id
			}), written.value, draft.plan.rules);
			context.io.retain(64 + jsonTextCodeUnits(stored) * 2 + (stored === written.value ? 0 : jsonTextCodeUnits(written.value) * 2));
			context.state.put(updatedEntity(entity, stored));
			return {
				...appliedUpdate(draft.plan, {
					targets,
					target
				}, entity.fields, {
					written: stored,
					body
				}),
				responseFields: written.value
			};
		};
		fitUpdateClocks = (draft, after, explained) => {
			if (!built(draft)) return {
				explained,
				rules: draft.plan.rules
			};
			const rules = draft.plan.rules.map((rule) => {
				const later = explained.rules.find((other) => other.field === rule.field);
				if (rule.rule !== "clock" || later?.rule !== "clock" || JSON.stringify(later.format) === JSON.stringify(rule.format)) return rule;
				const format = fittedClockFormat(rule.format, after[rule.field], clockEvidence(draft, rule.field));
				return format === undefined ? rule : {
					...rule,
					format
				};
			});
			const fitted = siblingTrimmedClocks(rules, draft.observed, after, Object.fromEntries(draft.fixedWidth));
			const planned = new Map(fitted.map((rule) => [rule.field, rule]));
			return {
				explained: {
					...explained,
					rules: explained.rules.map((rule) => {
						const held = planned.get(rule.field);
						return rule.rule === "clock" && held?.rule === "clock" && matchesClockFormat(held.format, readClock(after[rule.field])) ? {
							...rule,
							format: held.format
						} : rule;
					})
				},
				rules: fitted
			};
		};
		contradictsGeneratedClock = (before, after, rules, explained) => rules.some((rule) => {
			if (rule.rule !== "clock" || !Object.hasOwn(after, rule.field) || explained.unstamped.includes(rule.field) || explained.rules.some((candidate) => candidate.field === rule.field && candidate.rule === "held-clock")) return false;
			const previous = readClock(before[rule.field]);
			if (previous === undefined) return false;
			const next = readClock(after[rule.field]);
			return !explained.rules.some((candidate) => candidate.field === rule.field && candidate.rule === "clock") || next === undefined || next.ms <= previous.ms;
		});
		contradictsPlan = (draft, before, after, explained) => contradictsEarlierCalls(draft, explained.rules) || contradictsGeneratedClock(before, after, draft.plan.rules, explained) || conflictsWithPlan(draft.plan, explained, draft.kept);
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteDelete.js
var applyDelete, deleteEntity;
function init_environmentStateWriteDelete() {
	return (init_environmentStateWriteDelete = __esmMin((() => {
		init_environmentStateWriteChecks();
		init_environmentStateWriteEffects();
		init_environmentStateWriteExplain();
		applyDelete = (context, draft, step) => step.pinned ? deleteEntity(context, draft, step, itemTarget(context.state, draft.plan.target, step.record)) : UNKNOWN$1;
		deleteEntity = (context, draft, step, named) => {
			const type = draft.plan.target;
			const { collection, id } = named;
			const entity = context.state.entity(type, collection, id);
			if (entity === undefined) {
				fail(draft, step, "no-observation");
				return UNKNOWN$1;
			}
			const { ordinal } = step.record;
			if (!built(draft) && !step.observeOnly) Object.assign(draft.plan, {
				exemplar_ordinal: ordinal,
				response: step.response ?? context.io.withBody(ordinal, (body) => responseShapeOf(ordinal, body, context.io.emptyResponse(ordinal), {
					idField: context.idField(type),
					id
				}))
			});
			context.state.remove(entity);
			const targets = [entityTarget(type, collection, id), collectionTarget(type, collection)];
			return {
				kind: step.observeOnly ? "observed" : "applied",
				targets,
				entity: {
					type,
					collection,
					id
				}
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteBulk.js
var holds, bulkResponseFits, bulkResponseShape, deleteOptions, deleteBody, pinnedOptions, applyBulk;
function init_environmentStateWriteBulk() {
	return (init_environmentStateWriteBulk = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteAddress();
		init_environmentStateWriteChecks();
		init_environmentStateWriteExplain();
		init_environmentStateWriteApply();
		init_environmentStateWriteDelete();
		init_environmentStateWriteEffects();
		init_environmentStateWriteValues();
		holds = (body, test) => {
			const pending = body === undefined ? [] : [body];
			for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
				if (Array.isArray(next)) for (const child of next) pending.push(child);
				else if (isObject(next)) for (const child of Object.values(next)) pending.push(child);
				else if (test(next)) return true;
			}
			return false;
		};
		bulkResponseFits = (response, body, named) => {
			if (response.shape === "empty") return true;
			const ids = new Set(named.map(({ id }) => id));
			if (response.shape === "recorded") return body !== undefined && !holds(body, (scalar) => ids.has(scalarText(scalar) ?? "") || integerOf(scalar) === named.length);
			if (response.pointer !== "/0" || !Array.isArray(body)) return false;
			return body.length === named.length && named.every(({ id }, index) => {
				const element = body[index];
				if (response.shape === "identity") return scalarText(element) === id;
				const located = element === undefined ? undefined : locateItem(element, id);
				return located?.pointer === "" && isObject(at(element, ""));
			});
		};
		bulkResponseShape = (ordinal, body, empty, named, idField) => {
			if (!empty && Array.isArray(body) && body.length === named.length) {
				let shape;
				for (const [index, target] of named.entries()) {
					const element = responseShapeOf(ordinal, body[index], false, {
						idField,
						id: target.id
					});
					if (element.pointer !== "" || element.shape !== "entity" && element.shape !== "identity" || shape !== undefined && shape !== element.shape) {
						shape = undefined;
						break;
					}
					shape = element.shape;
				}
				if (shape !== undefined) return {
					ordinal,
					shape,
					pointer: "/0"
				};
			}
			return responseShapeOf(ordinal, body, empty, {
				idField,
				id: named[0].id
			});
		};
		deleteOptions = (named, identity) => {
			const [first, ...rest] = named.map(({ body }) => Object.fromEntries(Object.entries(body ?? {}).filter(([member]) => member !== identity)));
			return rest.every((options) => same(options, first)) ? first : undefined;
		};
		deleteBody = (options, identity) => ({
			accepted: [],
			fixed: Object.entries(options).map(([member, sent]) => ({
				member,
				sent
			})),
			required: Object.keys(options),
			identity,
			kinds: []
		});
		pinnedOptions = (body) => Object.fromEntries((body?.fixed ?? []).map(({ member, sent }) => [member, sent]));
		applyBulk = (context, draft, step) => {
			if (!step.pinned) return [UNKNOWN$1];
			const type = draft.plan.target;
			const { address } = draft.plan;
			const body = requestJson(context.io.requestBody(step.record.ordinal));
			const named = address === undefined || address.by === "action" ? undefined : namedEntities(address, body, context.idField(type));
			if (named === undefined) {
				fail(draft, step, "body-unusable");
				return [UNKNOWN$1];
			}
			const deleted = draft.plan.effect === "delete";
			const identity = address?.by === "elements" ? context.idField(type) : null;
			const options = deleted ? deleteOptions(named, identity) : undefined;
			if (deleted && (options === undefined || built(draft) && !same(options, pinnedOptions(draft.plan.body)))) {
				fail(draft, step, "body-unusable");
				return [UNKNOWN$1];
			}
			const collection = bulkCollectionOf(type, segmentsOf(step.record.path), (text) => text);
			const targets = named.map(({ id }) => bodyTarget(context.state, type, collection, id));
			return context.io.withBody(step.record.ordinal, (recorded) => {
				const empty = context.io.emptyResponse(step.record.ordinal);
				const response = bulkResponseShape(step.record.ordinal, recorded, empty, named, context.idField(type));
				const before = targets.map((target) => context.state.entity(type, target.collection, target.id));
				const wasBuilt = built(draft);
				const results = named.map(({ id, body: members }, index) => {
					const target = targets[index];
					const object = response.shape === "entity" && response.pointer === "/0" && Array.isArray(recorded) ? recorded[index] : undefined;
					const call = {
						...step,
						response,
						responseObservation: isObject(object) ? {
							ordinal: step.record.ordinal,
							pointer: `/${index}`,
							id,
							object
						} : null
					};
					return deleted ? deleteEntity(context, draft, call, target) : updateEntity(context, draft, call, {
						...target,
						body: members
					});
				});
				if (!wasBuilt && built(draft) && options !== undefined) {
					draft.plan.body = deleteBody(options, identity);
					retainFixed(context, draft.plan.body.fixed);
				}
				const planned = draft.plan.response;
				if (planned !== null) {
					const written = targets.flatMap((target, index) => {
						const result = results[index];
						const fields = deleted ? before[index]?.fields : result?.kind === "applied" ? result.responseFields : undefined;
						return fields === undefined ? [] : [{
							id: target.id,
							fields
						}];
					});
					const fits = planned.shape === response.shape && planned.pointer === response.pointer && bulkResponseFits(planned, recorded, named);
					const render = (exemplar) => writtenBulkResponse(planned, exemplar, written);
					const rendered = !fits || written.length !== named.length ? undefined : planned.ordinal === step.record.ordinal ? render(recorded) : context.io.withBody(planned.ordinal, render);
					if (!fits || rendered !== undefined && (!rendered.ok || !same(rendered.value, empty ? undefined : recorded))) refuse(draft, step, "body-unusable");
				}
				return results;
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteCreateCalls.js
var agreeing, joinedDefaults, addedReference, shownAlone, mergedField, mergedCreatePlan, mergedBody;
function init_environmentStateWriteCreateCalls() {
	return (init_environmentStateWriteCreateCalls = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteApply();
		init_environmentStateWriteClockFormats();
		init_environmentStateWriteRules();
		agreeing = (held, later, values) => {
			const alike = alikeRules(held, later, values.earlier.kept);
			if (alike !== undefined) return alike;
			if (held.rule !== "clock" || later.rule !== "clock") return undefined;
			const format = fittedClockFormat(held.format, values.later, values.earlier.clockOf(values.field));
			return format === undefined ? undefined : {
				...held,
				format
			};
		};
		joinedDefaults = (held, added) => {
			const joined = new Map(held.map((entry) => [entry.member, entry.value]));
			for (const { member, value } of added) {
				if (joined.has(member) && !same(joined.get(member), value)) return undefined;
				joined.set(member, value);
			}
			return [...joined].map(([member, value]) => ({
				member,
				value
			}));
		};
		addedReference = (field, added, calls) => {
			const { after, later } = calls;
			if (!Object.hasOwn(later.entity, field)) return Object.hasOwn(later.body, added.member) ? undefined : { rule: added };
			const rule = after === undefined ? undefined : agreeing(added, after, {
				field,
				later: later.entity[field],
				earlier: calls.earlier
			});
			return rule === undefined ? undefined : { rule };
		};
		shownAlone = (inExemplar, calls) => {
			const own = inExemplar ? calls.before : calls.after;
			if (own?.rule !== "reference") return undefined;
			const sent = inExemplar ? Object.hasOwn(calls.later.body, own.member) : calls.sentBefore.has(own.member);
			return sent ? undefined : { rule: own };
		};
		mergedField = (field, calls) => {
			const { before, after, exemplar, later } = calls;
			const inExemplar = Object.hasOwn(exemplar, field);
			if (!inExemplar && before?.rule === "reference") return addedReference(field, before, calls);
			if (!inExemplar || !Object.hasOwn(later.entity, field)) return shownAlone(inExemplar, calls);
			if (before !== undefined && after !== undefined) {
				const rule = agreeing(before, after, {
					field,
					later: later.entity[field],
					earlier: calls.earlier
				});
				return rule === undefined ? undefined : { rule };
			}
			if (before !== undefined) return before.rule === "echo" && !Object.hasOwn(later.body, field) ? {
				rule: before,
				default: {
					member: field,
					value: later.entity[field]
				}
			} : undefined;
			if (after !== undefined) return after.rule === "echo" && !calls.required.includes(field) ? {
				rule: after,
				default: {
					member: field,
					value: exemplar[field]
				}
			} : undefined;
			return same(exemplar[field], later.entity[field]) ? {} : undefined;
		};
		mergedCreatePlan = (plan, exemplar, later, earlier = {
			kept: new Set(),
			clockOf: (field) => exemplar[field]
		}) => {
			const held = new Map(plan.rules.map((rule) => [rule.field, rule]));
			const shown = new Map(later.rules.map((rule) => [rule.field, rule]));
			const sentBefore = new Set([
				...plan.body.accepted,
				...plan.body.fixed.map(({ member }) => member),
				...plan.body.required
			]);
			const merged = new Map();
			const defaults = [];
			for (const field of new Set([
				...Object.keys(exemplar),
				...Object.keys(later.entity),
				...held.keys()
			])) {
				const outcome = mergedField(field, {
					before: held.get(field),
					after: shown.get(field),
					exemplar,
					later,
					sentBefore,
					required: plan.body.required,
					earlier
				});
				if (outcome === undefined) return undefined;
				if (outcome.rule !== undefined) merged.set(field, outcome.rule);
				if (outcome.default !== undefined) defaults.push(outcome.default);
			}
			const body = mergedBody(plan.body, later, exemplar);
			const joined = body === undefined ? undefined : joinedDefaults(plan.body.defaults ?? [], defaults);
			if (body === undefined || joined === undefined) return undefined;
			return {
				rules: [...plan.rules.flatMap((rule) => {
					const kept = merged.get(rule.field);
					return kept === undefined ? [] : [kept];
				}), ...[...merged.values()].filter((rule) => !held.has(rule.field))],
				body: joined.length === 0 ? body : {
					...body,
					defaults: joined
				}
			};
		};
		mergedBody = (body, later, exemplar) => {
			const fixed = new Map(body.fixed.map((entry) => [entry.member, entry.sent]));
			const { contract } = later;
			if (contract.accepted.some((member) => fixed.has(member)) || contract.fixed.some((entry) => body.accepted.includes(entry.member) || fixed.has(entry.member) && !same(fixed.get(entry.member), entry.sent)) || contract.envelope !== body.envelope) return undefined;
			const added = contract.accepted.filter((member) => !body.accepted.includes(member));
			return {
				...body,
				accepted: [...body.accepted, ...added],
				fixed: [...body.fixed, ...contract.fixed.filter((entry) => !fixed.has(entry.member))],
				required: body.required.filter((member) => Object.hasOwn(later.body, member)),
				identity: body.identity ?? contract.identity,
				kinds: [...body.kinds, ...storedKinds(added, exemplar, later.entity)]
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteCreate.js
var respondedId, withReadBack, createdObservation, fieldsOf, linkedGenerated, rebuiltFrom, strandedInteger, linkedUnexplained, refineCreate, explainedCall, buildCreate, sequencesOf, followsSequences, agreesLater, contradictsDefault, followsCreateRules, fitClocks, takeSequences, recordedSegments, createCandidates, servedCollection, fromLinkedSource, insertCreated, applyCreate;
function init_environmentStateWriteCreate() {
	return (init_environmentStateWriteCreate = __esmMin((() => {
		init_jsonSerialization();
		init_environmentStateRules();
		init_environmentStateWriteApply();
		init_environmentStateWriteStamps();
		init_environmentStateWriteLinks();
		init_environmentStateWriteChecks();
		init_environmentStateWriteEffects();
		init_environmentStateWriteExplain();
		init_environmentStateWriteObserve();
		init_environmentStateWriteRules();
		init_environmentStateWriteClockFormats();
		init_environmentStateWriteCreateCalls();
		init_environmentStateWriteValues();
		respondedId = (body, idField) => {
			if (body === undefined) return undefined;
			if (!isObject(body)) return scalarText(body);
			if (Object.hasOwn(body, idField)) return scalarText(body[idField]);
			const members = Object.values(body);
			return members.length === 1 ? scalarText(members[0]) : undefined;
		};
		withReadBack = (context, step, target, own) => {
			const later = laterObservation(searchFrom(context, step), {
				type: target.type,
				collection: target.collection,
				idField: target.idField,
				id: own.id,
				held: () => false,
				isWrite: context.isWrite
			});
			if (later === undefined) return own;
			const view = context.viewOf(later.ordinal);
			if (view?.shape === "item" && (view.fields.some((field) => Object.hasOwn(own.object, field) && !Object.hasOwn(later.object, field)) || Object.entries(later.object).some(([field, value]) => Object.hasOwn(own.object, field) && !same(own.object[field], value) && !respelledInstant(own.object[field], value)))) return own;
			const shape = view?.shape === "item" ? "item" : "list";
			const object = withRead(own.object, later.object, shape);
			if (same(object, own.object)) return own;
			if (shape === "item") context.observed(later.ordinal);
			return {
				...own,
				object,
				read: {
					ordinal: later.ordinal,
					pointer: later.pointer,
					shape
				}
			};
		};
		createdObservation = (context, step, target) => {
			const held = (id) => context.state.entity(target.type, target.collection, id) !== undefined;
			const own = context.io.withBody(step.record.ordinal, (body) => newEntityIn(step.record.ordinal, body, target.idField, held));
			if (own !== undefined) return withReadBack(context, step, target, own);
			const { id, ids } = context.io.withBody(step.record.ordinal, (body) => {
				const returned = target.linked ? respondedIds(body) : [];
				const named = respondedId(body, target.idField) ?? (returned.length === 1 ? returned[0] : undefined);
				return {
					id: named,
					ids: returned
				};
			});
			const later = laterObservation(searchFrom(context, step), {
				type: target.type,
				collection: target.collection,
				idField: target.idField,
				...id === undefined ? {} : { id },
				held,
				isWrite: context.isWrite
			});
			if (later === undefined || target.linked && id === undefined && !ids.includes(later.id)) return undefined;
			context.observed(later.ordinal);
			return later;
		};
		fieldsOf = (entities) => entities.map((entity) => entity.fields);
		linkedGenerated = (field, entity, type) => createdToken(field, entity, type) === "linked" || createdInteger(field, entity, type) === "linked";
		rebuiltFrom = (rule, source) => rule?.rule === "template" ? rule.from === source : rule?.rule === "composed" && rule.parts.some((part) => "from" in part && part.from === source);
		strandedInteger = (rules, entity) => rules.some((rule) => {
			const digits = rule.rule === "unique" ? generatedIntegerDigits(entity[rule.field]) : undefined;
			return digits !== undefined && Object.entries(entity).some(([other, kept]) => other !== rule.field && typeof kept === "string" && containsDelimited(kept, digits) && !rebuiltFrom(rules.find((candidate) => candidate.field === other), rule.field));
		});
		linkedUnexplained = (rules, entity, held) => {
			const explained = new Set(rules.map((rule) => rule.field));
			return Object.keys(entity).some((field) => !explained.has(field) && linkedGenerated(field, entity, held)) || strandedInteger(rules, entity);
		};
		refineCreate = (context, draft, step, evidence) => {
			const { explained, held } = explainedCall(context, draft, step, evidence);
			for (const member of keptOrders(evidence.call.body, evidence.observed.object)) draft.kept.add(member);
			if (explained.tied && draft.plan.collection === null || linkedUnexplained(explained.rules, evidence.observed.object, held)) return false;
			const merged = mergedCreatePlan({
				rules: draft.plan.rules,
				body: draft.plan.body
			}, draft.observed, {
				entity: evidence.observed.object,
				body: evidence.call.body,
				rules: explained.rules,
				contract: {
					...explained.body,
					...evidence.envelope === undefined ? {} : { envelope: evidence.envelope }
				}
			}, {
				kept: draft.kept,
				clockOf: (field) => clockEvidence(draft, field)
			});
			if (merged === undefined) return false;
			retainFixed(context, merged.body.fixed.slice(draft.plan.body.fixed.length));
			draft.plan.rules = merged.rules;
			draft.plan.body = merged.body;
			return true;
		};
		explainedCall = (context, draft, step, evidence) => {
			const type = draft.plan.target;
			const members = fieldsOf(context.state.members(type, evidence.collection));
			const held = fieldsOf(context.state.ofType(type));
			const explained = explainCreate({
				entity: evidence.observed.object,
				call: evidence.call,
				idField: context.idField(type),
				startMs: startOf(context, step),
				collection: members,
				type: held,
				named: (id) => context.state.named(id)
			});
			return {
				explained,
				members,
				held
			};
		};
		buildCreate = (context, draft, step, evidence) => {
			const type = draft.plan.target;
			const idField = context.idField(type);
			const { explained, members, held } = explainedCall(context, draft, step, evidence);
			if (linkedUnexplained(explained.rules, evidence.observed.object, held)) {
				refuse(draft, step, "unexplained-change");
				return false;
			}
			const clocks = explained.rules.flatMap((rule) => rule.rule === "clock" ? [rule.field] : []);
			const scalars = Object.keys(members[0] ?? {}).filter((field) => members.every((member) => ["string", "number"].includes(typeof member[field])));
			const generated = explained.rules.some((rule) => rule.rule === "identity" && rule.field === idField && rule.generator !== "sequence");
			draft.candidates = insertCandidates(members, [...new Set([
				idField,
				...clocks,
				...scalars
			])], {
				...generated && randomIdentities(members, idField, clocks) ? { random: idField } : {},
				created: evidence.observed.object
			});
			retainFixed(context, explained.body.fixed);
			for (const member of keptOrders(evidence.call.body, evidence.observed.object)) draft.kept.add(member);
			Object.assign(draft.plan, {
				exemplar_ordinal: step.record.ordinal,
				observation: {
					ordinal: evidence.observed.ordinal,
					pointer: evidence.observed.pointer,
					...evidence.observed.read === undefined ? {} : { read: evidence.observed.read }
				},
				response: context.io.withBody(step.record.ordinal, (body) => responseShapeOf(step.record.ordinal, body, context.io.emptyResponse(step.record.ordinal), {
					idField,
					id: evidence.observed.id
				})),
				body: {
					...explained.body,
					...evidence.envelope === undefined ? {} : { envelope: evidence.envelope }
				},
				rules: explained.rules,
				collection: explained.tied || draft.linked !== undefined ? evidence.collection : null,
				insert: draft.candidates[0]
			});
			draft.observed = evidence.observed.object;
			for (const entity of held) noteFixedWidths(draft.fixedWidth, entity);
			return true;
		};
		sequencesOf = (draft, collection) => draft.plan.rules.flatMap((rule) => rule.rule === "sequence" ? [{
			rule,
			key: rule.scope === "collection" ? `${rule.field} ${collection}` : rule.field
		}] : []);
		followsSequences = (context, draft, created) => sequencesOf(draft, created.collection).every(({ rule, key }) => {
			const scope = [...context.state.ofType(created.type), ...context.startedWith(created.type)].filter((entity) => rule.scope === "type" || entity.collection === created.collection);
			const next = nextSequence(nextInteger(fieldsOf(scope), rule.field, draft.observed?.[rule.field]), draft.sequences.get(key));
			return created.fields[rule.field] === spelledLike(draft.observed?.[rule.field] ?? "", next);
		});
		agreesLater = (context, draft, created, call) => followsCreateRules(context, draft, {
			...created,
			observed: call.observed
		}) && !contradictsDefault(draft.plan.rules, call, created.fields);
		contradictsDefault = (rules, call, written) => rules.some((rule) => rule.rule === "echo" && !Object.hasOwn(call.body, rule.field) && Object.hasOwn(call.observed, rule.field) && !same(call.observed[rule.field], written[rule.field]));
		followsCreateRules = (context, draft, created) => draft.plan.rules.every((rule) => {
			const value = created.fields[rule.field];
			const exemplar = draft.observed?.[rule.field];
			if (rule.rule === "composed" || rule.rule === "reference") return !Object.hasOwn(created.observed, rule.field) || value === created.observed[rule.field] || rule.rule === "reference" && same(value, created.observed[rule.field]);
			if (rule.rule === "clock") return fittedClockFormat(rule.format, value, clockEvidence(draft, rule.field)) !== undefined;
			if (rule.rule === "unique") return (isUuid(exemplar) ? isUuid(value) : generatedIntegerDigits(exemplar) !== undefined ? likeGeneratedInteger(value, exemplar) : isOpaqueToken(value, exemplar)) && !context.state.ofType(created.type).some((held) => held.fields[rule.field] === value);
			return rule.rule !== "identity" || rule.generator !== "uuid" || isUuid(value);
		}) && followsSequences(context, draft, created);
		fitClocks = (draft, fields) => {
			const fitted = draft.plan.rules.map((rule) => {
				if (rule.rule !== "clock") return rule;
				const format = fittedClockFormat(rule.format, fields[rule.field], clockEvidence(draft, rule.field));
				return format === undefined || format === rule.format ? rule : {
					...rule,
					format
				};
			});
			draft.plan.rules = siblingTrimmedClocks(fitted, draft.observed, fields, Object.fromEntries(draft.fixedWidth));
			noteFixedWidths(draft.fixedWidth, fields);
		};
		takeSequences = (draft, created) => {
			for (const { rule, key } of sequencesOf(draft, created.collection)) {
				const value = sequenceNumber(created.fields[rule.field], draft.observed?.[rule.field]);
				if (value !== undefined) draft.sequences.set(key, value);
			}
		};
		recordedSegments = (template, path) => {
			const pattern = segmentsOf(template);
			const concrete = segmentsOf(path);
			if (pattern.length !== concrete.length) return undefined;
			const segments = [];
			for (const [index, part] of pattern.entries()) {
				const value = concrete[index];
				if (!isParam(part)) {
					if (part !== value) return undefined;
					segments.push({
						text: part,
						supplied: false
					});
					continue;
				}
				if (value.length === 0) return undefined;
				segments.push({
					text: value,
					supplied: true
				});
			}
			return segments;
		};
		createCandidates = (context, type) => {
			const candidates = [];
			const seen = new Set();
			const add = (collection) => {
				if (seen.has(collection)) return;
				seen.add(collection);
				candidates.push(collection);
			};
			for (const entity of context.state.ofType(type)) add(entity.collection);
			for (const collection of context.state.knownCollections(type)) add(collection);
			for (const record of context.records) {
				const view = context.viewOf(record.ordinal);
				if (view?.shape === "list" && view.type === type && view.checked_record_ordinals.includes(record.ordinal)) add(collectionPathOf(record, false));
			}
			return candidates;
		};
		servedCollection = (context, step, type) => {
			const segments = recordedSegments(step.tool.path_template, step.record.path);
			return segments === undefined ? undefined : selectedCollection(segments, createCandidates(context, type));
		};
		fromLinkedSource = (context, draft, step) => sameLinkedSource(step.tool.path_template, context.records.find((record) => record.ordinal === draft.plan.exemplar_ordinal)?.path, recordedPathValues(step.tool.path_template, step.record.path));
		insertCreated = (context, draft, entity) => {
			const members = fieldsOf(context.state.members(entity.type, entity.collection));
			context.io.retain(64 + jsonTextCodeUnits(entity.fields) * 2);
			context.state.put(entity, draft.plan.insert === null ? members.length : insertIndex(draft.plan.insert, members, entity.fields));
			return entityTarget(entity.type, entity.collection, entity.id);
		};
		applyCreate = (context, draft, step) => {
			const type = draft.plan.target;
			const idField = context.idField(type);
			const spelled = normalizedPath(step.record.path);
			const collection = draft.linked ?? servedCollection(context, step, type) ?? spelled;
			if (built(draft) && (draft.plan.collection !== null && draft.plan.collection !== collection || draft.linked !== undefined && !fromLinkedSource(context, draft, step))) return UNKNOWN$1;
			const observed = createdObservation(context, step, {
				type,
				collection,
				idField,
				linked: draft.linked !== undefined
			});
			const request = requestBodyPlan(context, step, draft, observed?.object);
			const body = request?.object;
			if (observed === undefined) {
				fail(draft, step, body === undefined ? "body-unusable" : "no-observation");
				return UNKNOWN$1;
			}
			const entity = (fields, id) => ({
				type,
				collection,
				id,
				fields,
				view_fields: [],
				record_ordinals: []
			});
			const recorded = () => {
				const inserted = insertCreated(context, draft, entity(observed.object, observed.id));
				return {
					kind: "observed",
					targets: [inserted, collectionTarget(type, collection)],
					entity: {
						type,
						collection,
						id: observed.id
					}
				};
			};
			if (step.observeOnly || body === undefined) {
				fail(draft, step, "body-unusable");
				return recorded();
			}
			const call = {
				...callOf(step, body),
				body
			};
			const later = built(draft);
			if (later && (draft.plan.rules.some((rule) => rule.rule === "unique" && linkedGenerated(rule.field, observed.object, fieldsOf(context.state.ofType(type)))) || strandedInteger(draft.plan.rules, observed.object))) {
				refuse(draft, step, "unexplained-change");
				return recorded();
			}
			if (!later && !buildCreate(context, draft, step, {
				observed,
				call,
				collection,
				envelope: request?.envelope
			})) return recorded();
			const created = {
				...call,
				pathValues: pathValuesOf(step.tool.path_template, collection) ?? call.pathValues
			};
			const fieldsOfCall = () => createdFields(draft.plan, draft.observed, created, (rule) => recordedGeneratedValue(rule, draft.observed[rule.field], observed.object[rule.field] ?? null), referencedIn(context));
			if (later) refineCreate(context, draft, step, {
				observed,
				call,
				collection,
				envelope: request?.envelope
			});
			const fields = fieldsOfCall();
			const id = fields.ok ? scalarText(fields.value[idField]) : undefined;
			if (!fields.ok || id === undefined || context.state.entity(type, collection, id) !== undefined || later && !agreesLater(context, draft, {
				type,
				collection,
				fields: fields.value
			}, {
				body: call.body,
				observed: observed.object
			})) {
				refuse(draft, step, "unexplained-change");
				return recorded();
			}
			takeSequences(draft, {
				collection,
				fields: fields.value
			});
			fitClocks(draft, fields.value);
			const stored = restampedFields(searchFrom(context, step), itemReads(context, {
				type,
				idField,
				collection,
				id
			}), fields.value, draft.plan.rules);
			const inserted = insertCreated(context, draft, entity(stored, id));
			return {
				kind: "applied",
				targets: [inserted, collectionTarget(type, collection)],
				entity: {
					type,
					collection,
					id
				},
				inserted
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteDocument.js
var namesDocument, writePointer, writtenPointers, buildDocument, applyDocument;
function init_environmentStateWriteDocument() {
	return (init_environmentStateWriteDocument = __esmMin((() => {
		init_jsonSerialization();
		init_environmentStateRules();
		init_environmentStateWriteApply();
		init_environmentStateWriteChecks();
		init_environmentStateWriteEffects();
		init_environmentStateWriteExplain();
		namesDocument = (path, held) => {
			const written = segmentsOf(path);
			const recorded = segmentsOf(held);
			return written.length === recorded.length && recorded.every((segment, index) => pathSegmentMatches(segment, written[index]));
		};
		writePointer = (draft, value, body) => built(draft) ? draft.plan.observation?.pointer : documentPointerOf(value, body);
		writtenPointers = (draft, body, values) => {
			const at$1 = draft.plan.observation?.pointer ?? "";
			if (draft.plan.merge === "merge") return Object.keys(body).map((member) => `${at$1}${pointerTo(member)}`);
			const members = new Set([values.before, values.after].flatMap((value) => {
				const object = at(value, at$1);
				return isObject(object) ? Object.keys(object) : [];
			}));
			if (members.size === 0) return at$1 === "" ? undefined : [at$1];
			return [...members].map((member) => `${at$1}${pointerTo(member)}`);
		};
		buildDocument = (draft, step, evidence) => {
			const { ordinal } = step.record;
			Object.assign(draft.plan, {
				exemplar_ordinal: ordinal,
				observation: {
					ordinal,
					pointer: evidence.pointer
				},
				merge: step.tool.method === "PUT" ? "replace" : "merge",
				body: {
					accepted: Object.keys(evidence.body),
					fixed: [],
					required: [],
					identity: null,
					kinds: []
				}
			});
		};
		applyDocument = (context, draft, step) => {
			const tool = draft.plan.target;
			const initial = context.initialDocument(tool);
			if (initial !== undefined && !namesDocument(step.record.path, initial.path)) return UNKNOWN$1;
			const value = context.state.document(tool);
			const parsed = step.pinned ? requestJson(context.io.requestBody(step.record.ordinal)) : undefined;
			const body = isObject(parsed) ? parsed : undefined;
			const pointer = value === undefined || body === undefined ? undefined : writePointer(draft, value, body);
			if (step.observeOnly || pointer === undefined) {
				fail(draft, step, body === undefined ? "body-unusable" : "no-observation");
				return UNKNOWN$1;
			}
			if (!built(draft)) buildDocument(draft, step, {
				pointer,
				body
			});
			const call = callOf(step, body);
			if (documentBodyProblem(draft.plan, call, {
				initial: initial?.value,
				current: value
			}) !== undefined) {
				refuse(draft, step, "unexplained-change");
				return UNKNOWN$1;
			}
			const written = writtenDocument(draft.plan, value, call);
			if (!written.ok) {
				refuse(draft, step, "no-observation");
				return UNKNOWN$1;
			}
			const { ordinal } = step.record;
			draft.plan.response ??= context.io.withBody(ordinal, (response) => ({
				ordinal,
				shape: context.io.emptyResponse(ordinal) ? "empty" : response !== undefined && same(response, written.value) ? "entity" : "recorded",
				pointer: null
			}));
			context.io.retain(64 + jsonTextCodeUnits(written.value) * 2);
			context.state.setDocument(tool, written.value);
			const fields = writtenPointers(draft, body, {
				before: value,
				after: written.value
			});
			const replaced = draft.plan.merge === "merge" ? undefined : pointer;
			return {
				kind: "applied",
				targets: [documentTarget(tool)],
				...fields === undefined ? {} : {
					fields,
					pointers: true
				},
				...fields === undefined || replaced === undefined ? {} : { overwrites: [replaced] }
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteTaint.js
var WriteTaint;
function init_environmentStateWriteTaint() {
	return (init_environmentStateWriteTaint = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		init_environmentStateWriteRules();
		WriteTaint = class {
			types;
			documents;
			state;
			#prefixes = [];
			#targets = new Set();
			#entities = new Set();
			/** Collections whose entities are all unknown, with the ones a read has shown since. */
			#collections = new Map();
			constructor(types, documents, state) {
				this.types = types;
				this.documents = documents;
				this.state = state;
			}
			/** Record an unmodelled write's path against every related type and document, naming entities and collections as modelled writes do. */
			write(path) {
				const segments = segmentsOf(path);
				for (const type of this.types) {
					if (!prefixRelated(type, path)) continue;
					const depth = segmentsOf(type).length;
					const written = `/${segments.slice(0, depth).join("/")}`;
					const collection = () => collectionTarget(type, heldCollection(this.state, type, written));
					if (segments.length > depth) {
						const item = itemTarget(this.state, type, { path: `${written}/${segments[depth]}` });
						if (this.state.entity(type, item.collection, item.id) !== undefined) this.#entities.add(entityTarget(type, item.collection, item.id));
						else this.#collections.set(collection(), new Set());
					} else if (segments.length === depth) this.#targets.add(collection());
					else this.#prefixes.push(normalizedPath(path));
				}
				for (const [tool, documentPath] of this.documents) if (prefixRelated(documentPath, path)) this.#targets.add(documentTarget(tool));
			}
			/** Stop checking a target whose check failed. */
			fail(target) {
				this.#targets.add(target);
			}
			tainted(target) {
				return this.#targets.has(target);
			}
			/** Whether an unmodelled write above a collection path left everything under it unknown, each collection segment matching the write's verbatim or either once percent-decoded. */
			under(collection) {
				const concrete = segmentsOf(collection);
				return this.#prefixes.some((prefix) => segmentsOf(prefix).every((segment, index) => isParam(segment) || pathSegmentMatches(concrete[index] ?? "", segment)));
			}
			unknown(type, collection, id) {
				const target = entityTarget(type, collection, id);
				const seen = this.#collections.get(collectionTarget(type, collection));
				return this.#entities.has(target) || seen !== undefined && !seen.has(target);
			}
			/** Whether a list read of a collection lists, or holds, an entity left unknown. */
			blocksList(type, collection, ids) {
				return this.#collections.has(collectionTarget(type, collection)) || ids.some((id) => this.#entities.has(entityTarget(type, collection, id)));
			}
			/** The state saw the entity again, or a modelled write replaced it. */
			known(type, collection, id) {
				const target = entityTarget(type, collection, id);
				this.#entities.delete(target);
				this.#collections.get(collectionTarget(type, collection))?.add(target);
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWriteVerdict.js
var renders, steady, unstamped, writeVerdict;
function init_environmentStateWriteVerdict() {
	return (init_environmentStateWriteVerdict = __esmMin((() => {
		init_environmentStateRules();
		renders = (plan, input) => {
			const { response } = plan;
			if (plan.effect !== "update" && plan.effect !== "delete" || response?.shape !== "entity") return true;
			const shown = input.io.withBody(response.ordinal, (body) => {
				const object = body === undefined ? undefined : at(body, response.pointer ?? "");
				return isObject(object) ? Object.keys(object) : undefined;
			});
			const written = new Set(plan.effect === "update" ? plan.rules.flatMap((rule) => rule.rule === "increment" ? [] : [rule.field]) : []);
			return shown === undefined || input.entities.some((entity) => entity.type === plan.target && shown.every((field) => Object.hasOwn(entity.fields, field) || written.has(field)));
		};
		steady = (plan, draft) => {
			if (plan.address?.by !== "action") return true;
			const set = plan.rules.flatMap((rule) => rule.rule === "set" ? [rule.field] : []);
			return set.length > 0 && set.every((field) => draft.steady.has(field));
		};
		unstamped = (plan, draft) => [...draft.unstamped].some((field) => !plan.rules.some((rule) => rule.field === field));
		writeVerdict = (draft, input) => {
			const plan = draft.plan;
			if (plan.reason === null) {
				if (draft.calls === 0) plan.reason = "no-call";
				else if (draft.contradictedBy !== undefined) {
					plan.reason = "contradicted";
					plan.contradicted_by = draft.contradictedBy;
				} else if (draft.sideEffect) plan.reason = "side-effect";
				else if (draft.confirmed.length === 0 || !steady(plan, draft) || unstamped(plan, draft)) plan.reason = "unconfirmed";
				else if (!renders(plan, input)) plan.reason = "incomplete-entities";
			}
			plan.served = plan.reason === null;
			plan.checked_record_ordinals = [...new Set(draft.confirmed)];
			return { ...plan };
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/EnvironmentStateWriteSimulation.js
var APPLY, EnvironmentStateWriteSimulation;
function init_EnvironmentStateWriteSimulation() {
	return (init_EnvironmentStateWriteSimulation = __esmMin((() => {
		init_environmentStateRules();
		init_environmentStateWriteAdoption();
		init_environmentStateWriteBlame();
		init_environmentStateWriteAddress();
		init_environmentStateResponseMembers();
		init_environmentStateWriteLinks();
		init_environmentStateWriteApply();
		init_environmentStateWriteObserve();
		init_environmentStateWriteOmitted();
		init_environmentStateWriteSorted();
		init_environmentStateWriteStamps();
		init_environmentStateWriteChecks();
		init_environmentStateCheckedLines();
		init_environmentStateWriteAttribution();
		init_environmentStateWriteBulk();
		init_environmentStateWriteCreate();
		init_environmentStateWriteDocument();
		init_environmentStateWriteDelete();
		init_environmentStateWriteEffects();
		init_environmentStateWriteRules();
		init_environmentStateWriteTaint();
		init_environmentStateWriteVerdict();
		APPLY = {
			create: applyCreate,
			update: applyUpdate,
			delete: applyDelete,
			document: applyDocument
		};
		EnvironmentStateWriteSimulation = class {
			#input;
			#state;
			#drafts = new Map();
			#toolOf = new Map();
			#types = new Map();
			/** Each list or document view's checked request lines, with the recording a call of the line is answered on. */
			#checkedLines;
			/** Reads a write's effect was learned from, with the tools that borrowed each. */
			#observations = new Map();
			#taint;
			#touched = new Map();
			#effects = new WriteEffects();
			/** Fields reads show the application leaves out, which serving then does not require. */
			omitted = new OmittedFields((bytes) => this.#input.io.retain(bytes));
			/** Array fields reads showed a view lists sorted. */
			#sorted;
			#lastCheck = new Map();
			/** When the latest modelled write to each target since its last check ended. */
			#touchedSince = new Map();
			/** Timeline indexes of writes the gate does not model. */
			#unmodelledAt = [];
			#history = {
				touched: this.#touched,
				pending: this.#touchedSince,
				checked: this.#lastCheck,
				unmodelledAt: this.#unmodelledAt
			};
			#log = [];
			/** Entities a create inserted, by target, with the create's tool. */
			#inserted = new Map();
			/** Creates whose insert rule a passing list check relied on, so it is no longer changed. */
			#placed = new Set();
			/** Entities writes no plan models made, taken when an item read first shows them. */
			#unseen;
			#blame;
			constructor(input) {
				this.#input = input;
				this.#state = new SimulatedState(input.entities, input.documents);
				this.#unseen = new UnseenEntities(input.entities, {
					state: this.#state,
					io: input.io,
					lastCheck: this.#lastCheck,
					idField: (type) => this.#types.get(type)?.id_field
				});
				this.#blame = new FailedReadBlame({
					state: this.#state,
					io: input.io,
					records: input.records,
					touched: this.#touched,
					pending: this.#touchedSince,
					effects: this.#effects,
					inserted: this.#inserted,
					idField: (type) => this.#types.get(type)?.id_field,
					volatileOf: input.volatileOf
				});
				for (const type of input.types) this.#types.set(type.collection_template, type);
				for (const tool of input.tools) for (const ordinal of tool.record_ordinals) this.#toolOf.set(ordinal, tool);
				this.#checkedLines = checkedLines(input);
				this.#sorted = new SortedArrays(input.views.values(), input.entities, {
					state: this.#state,
					io: input.io,
					idField: (type) => this.#types.get(type)?.id_field
				});
				this.#taint = new WriteTaint([...this.#types.keys()], new Map(input.documents.map((document) => [document.tool, document.path])), this.#state);
			}
			/** Every state-changing tool's plan, in manifest order, with its verdict. */
			run() {
				const documents = new Map();
				for (const tool of this.#input.tools) if (this.#input.views.get(tool.name)?.shape === "document") documents.set(normalizedPath(tool.path_template), tool.name);
				const types = new Set(this.#types.keys());
				for (const tool of this.#input.tools) {
					if (!changesState(tool.method, tool.path_template) || this.#input.readOnly.has(tool.name)) continue;
					const link = linkedTarget(tool, classifyWrite(tool, types, documents), {
						...this.#input,
						isWrite: (record) => this.#isWrite(record),
						viewOf: (ordinal) => this.#input.views.get(this.#toolOf.get(ordinal)?.name ?? "")
					});
					const addressed = link.effect === "none" ? addressedWrite(tool, {
						...this.#input,
						types,
						idField: (type) => this.#types.get(type)?.id_field,
						views: this.#input.views.values()
					}) : undefined;
					const { effect, target } = addressed ?? link;
					this.#input.io.retain(512);
					this.#drafts.set(tool.name, {
						plan: {
							...unservedPlan(tool.name, effect, target, "no-state-target"),
							reason: effect === "none" ? "no-state-target" : null,
							...addressed === undefined ? {} : { address: addressed.address }
						},
						observed: undefined,
						candidates: [],
						confirmed: [],
						contradictedBy: undefined,
						sideEffect: false,
						calls: 0,
						updates: [],
						sequences: new Map(),
						steady: new Set(),
						unstamped: new Set(),
						kept: new Set(),
						fixedWidth: new Map(),
						linked: link.collection
					});
				}
				this.#input.records.forEach((record, index) => this.#step(record, index));
				const views = new Map(this.views([...this.#input.views.values()]).map((view) => [view.tool, view]));
				return [...this.#drafts.values()].map((draft) => {
					let kept = 0;
					for (const ordinal of draft.confirmed) {
						const tool = this.#toolOf.get(ordinal)?.name;
						if (tool !== undefined && views.get(tool)?.shape !== "recorded") draft.confirmed[kept++] = ordinal;
					}
					draft.confirmed.length = kept;
					return writeVerdict(draft, this.#input);
				});
			}
			#step(record, index) {
				const tool = this.#toolOf.get(record.ordinal);
				if (this.#isWrite(record) && !succeeded$1(record)) {
					this.#unmodelled(record.path, index);
					this.#unseen.unplanned(index);
				} else if (this.#isWrite(record)) this.#write(record, index, tool);
				else if (tool?.method === "GET") this.#read(record, index, tool);
			}
			/** Whether a record may change state: a state write whose tool the capture does not show reading only. */
			#isWrite(record) {
				return isStateWrite(record) && !this.#input.readOnly.has(this.#toolOf.get(record.ordinal)?.name ?? "");
			}
			#context(writer, request) {
				return {
					isWrite: (record) => this.#isWrite(record),
					state: this.#state,
					io: request === undefined ? this.#input.io : {
						...this.#input.io,
						requestBody: (ordinal) => ordinal === request.ordinal ? request.body : this.#input.io.requestBody(ordinal)
					},
					records: this.#input.records,
					timed: this.#input.timed,
					viewOf: (ordinal) => {
						const view = this.#input.views.get(this.#toolOf.get(ordinal)?.name ?? "");
						return view === undefined ? undefined : this.#viewOf(view);
					},
					idField: (type) => this.#types.get(type).id_field,
					observed: (ordinal) => this.#observations.set(ordinal, (this.#observations.get(ordinal) ?? new Set()).add(writer)),
					unknown: (type, collection, id) => this.#taint.unknown(type, collection, id),
					initialDocument: (tool) => this.#input.documents.find((document) => document.tool === tool),
					startedWith: (type) => this.#input.entities.filter((entity) => entity.type === type),
					pending: (target) => [...this.#touched.get(target)?.keys() ?? []].some((name) => name !== writer)
				};
			}
			#write(record, index, tool) {
				const draft = tool === undefined ? undefined : this.#drafts.get(tool.name);
				const effect = draft?.plan.effect;
				if (draft === undefined || tool === undefined || effect === undefined || effect === "none") {
					this.#unmodelled(record.path, index);
					this.#unseen.unplanned(index);
					return;
				}
				const observeOnly = draft.plan.reason !== null;
				if (!observeOnly) draft.calls += 1;
				const pinned = !built(draft) || sameQuery(this.#input.io.queryOf(draft.plan.exemplar_ordinal ?? -1), record.query);
				const step = {
					record,
					index,
					tool,
					observeOnly,
					pinned
				};
				const { address } = draft.plan;
				const bulk = address !== undefined && address.by !== "action";
				const apply = (body) => {
					const context = this.#context(tool.name, body === undefined ? undefined : {
						ordinal: record.ordinal,
						body
					});
					const results = bulk ? applyBulk(context, draft, step) : [APPLY[effect](context, draft, step)];
					if (results.some((result) => result.kind === "unknown") && (!built(draft) || draft.linked !== undefined)) this.#unseen.unplanned(index);
					for (const result of results) this.#settle(result, {
						index,
						tool: tool.name,
						path: record.path,
						end: record.end
					});
				};
				if (pinned && (effect !== "delete" || bulk)) this.#input.io.withRequestBody(record.ordinal, apply);
				else apply();
			}
			/** Attribute an applied effect to its tool; a recorded outcome is the state's new baseline; an unknown one taints. */
			#settle(result, write) {
				if (result.kind === "unknown") {
					this.#unmodelled(write.path, write.index);
					return;
				}
				if (result.entity !== undefined) {
					this.#unseen.touched(result.entity);
					const { type, collection, id } = result.entity;
					this.#taint.known(type, collection, id);
				}
				if (result.kind === "observed") {
					this.#effects.observed(this.#touched, result.targets);
					this.#blame.rebased(result.targets[0], write.index);
					this.#touched.delete(result.targets[0]);
					return;
				}
				this.#effects.supersede(this.#touched, write.tool, result);
				for (const target of result.targets) touchTarget(this.#touched, this.#touchedSince, target, {
					...write,
					fields: result.fields
				});
				this.#log.push(write);
				if (result.inserted === undefined) return;
				this.#inserted.set(result.inserted, write.tool);
				if (result.entity !== undefined) this.#blame.inserted(result.entity, write.tool);
			}
			/**
			* An item read of an entity an unmodelled write may have changed shows it again: the writes that
			* changed it are checked on their own fields, and the state takes what the read recorded.
			*/
			#resync(view, record, entity) {
				const target = entityTarget(entity.type, entity.collection, entity.id);
				const writes = this.#touched.get(target) ?? new Map();
				this.#taint.known(entity.type, entity.collection, entity.id);
				this.#touched.delete(target);
				if (isAbsence(record.status)) {
					this.#removeEntity(entity);
					return;
				}
				const object = this.#checkFields(view, record, entity, writes);
				if (object !== undefined) this.#state.put(updatedEntity(entity, {
					...entity.fields,
					...object
				}));
			}
			/** Whether an item read shows an entity an unmodelled write made, or one left unknown, again rather than checks it. */
			#resynced(view, record, index) {
				if (view.shape !== "item") return false;
				const adopted = this.#unseen.adopt(view, {
					record,
					index
				});
				if (adopted !== undefined) {
					this.#taint.known(adopted.type, adopted.collection, adopted.id);
					return true;
				}
				const { collection, id } = itemTarget(this.#state, view.type, record);
				if (!this.#taint.unknown(view.type, collection, id)) return false;
				const target = entityTarget(view.type, collection, id);
				if (runningAt(this.#touchedSince, target, record.start)) return true;
				if (!succeeded$1(record) && !isAbsence(record.status)) return true;
				const entity = this.#state.entity(view.type, collection, id);
				if (entity === undefined) {
					if (isAbsence(record.status)) return false;
					this.#taint.known(view.type, collection, id);
					return true;
				}
				this.#resync(view, record, entity);
				return true;
			}
			#check(view, record, comparisonBody) {
				if (view.shape === "recorded") return undefined;
				const line = this.#line(view, record);
				if (view.shape !== "item" && line === undefined) return undefined;
				if (view.shape === "document") return this.#input.io.withBody(record.ordinal, (body) => checkDocumentRead(this.#state, view, record, body));
				const item = view.shape === "item";
				const target = item ? itemTarget(this.#state, view.type, record) : undefined;
				const collection = target === undefined ? line.collection : target.collection;
				if (this.#taint.under(collection)) return undefined;
				if (!item) {
					const ids = this.#state.members(view.type, collection).map((entity) => entity.id);
					if (this.#taint.tainted(collectionTarget(view.type, collection)) || this.#taint.blocksList(view.type, collection, ids)) return undefined;
				}
				const base = item ? view.envelope_ordinal : line.ordinal;
				const ordinals = {
					base,
					read: record.ordinal
				};
				const minted = view.per_response_members;
				return withBodies(this.#input.io.withBody, ordinals, (served, body) => {
					const check = {
						body: body === undefined ? body : withoutMembers(comparisonBody === undefined ? body : comparisonBody(body), minted),
						base: served === undefined ? served : withoutMembers(served, minted),
						idField: this.#types.get(view.type)?.id_field ?? "",
						volatile: this.#input.volatileOf(view.type),
						collection,
						...target === undefined ? {} : { itemId: target.id }
					};
					return this.omitted.check(this.#state, view, record, check, (loosened) => loosened.shape === "item" ? checkItemRead(this.#state, loosened, record, check) : checkListRead(this.#state, loosened, record, {
						...check,
						line
					}));
				});
			}
			/** The checked line serving answers a list or document read's call from, as replay chooses it. */
			#line(view, record) {
				return servedLine(this.#checkedLines.get(view.tool), record);
			}
			/** The view as the gate currently knows it: without the fields reads showed omitted, with the arrays they showed sorted. */
			#viewOf(view) {
				return this.#sorted.view(this.omitted.view(view));
			}
			/** The views as reads showed them. */
			views(views) {
				return this.#sorted.views(this.omitted.views(views));
			}
			#read(record, index, tool) {
				const original = this.#input.views.get(tool.name);
				if (original === undefined) return;
				let view = this.#sorted.comparisonView(this.omitted.view(original));
				if (projectedRead(view, record, this.#input.io)) return;
				const borrowers = this.#observations.get(record.ordinal);
				if (this.#viewOf(original).shape !== "recorded" && !borrowers && this.#resynced(view, record, index)) return;
				let outcome = this.#check(view, record);
				if (outcome === undefined) return;
				let keys = [...outcome.targets, ...outcome.unheld];
				const blocked = (targets) => targets.some((key) => this.#taint.tainted(key) || runningAt(this.#touchedSince, key, record.start));
				if (blocked(keys)) return;
				outcome = this.#sorted.retry(view, {
					record,
					outcome
				}, (candidate, comparisonBody) => this.#check(candidate, record, comparisonBody), blocked);
				view = this.#viewOf(original);
				keys = [...outcome.targets, ...outcome.unheld];
				if (blocked(keys)) return;
				let exercised = exercisedBy(this.#touched, keys, borrowers);
				if (view.shape === "recorded") {
					if (!outcome.pass) this.#contradictOthers(exercised, record, interference(this.#history, outcome));
					return;
				}
				if (borrowers !== undefined) {
					this.omitted.keep(view, outcome);
					if (!outcome.pass) this.#contradictOthers(exercised, record, interference(this.#history, outcome));
					return;
				}
				if (!outcome.pass && view.shape === "list") {
					const retried = this.#retryInsert(view, record, exercised);
					if (retried !== undefined) {
						outcome = retried;
						keys = [...outcome.targets, ...outcome.unheld];
						if (blocked(keys)) return;
						exercised = exercisedBy(this.#touched, keys, borrowers);
					}
				}
				this.omitted.keep(view, outcome);
				const interferes = interference(this.#history, outcome);
				const unseen = outcome.pass ? this.#confirm(view, record, outcome, exercised) : undefined;
				if (!outcome.pass) {
					const interfered = new Set([...exercised].filter(interferes));
					if (interfered.size === 0) this.#mismatch({
						record,
						index,
						keys,
						exercised,
						view
					});
					else {
						this.#contradictOthers(exercised, record, interferes);
						if (view.shape === "item") this.#checkMembers(view, record, interfered);
						else for (const key of keys) this.#taint.fail(key);
					}
					if (view.shape === "item") this.#adopt(view, record);
				}
				const pending = {
					touched: this.#touched,
					since: this.#touchedSince,
					effects: this.#effects
				};
				for (const key of keys) {
					this.#lastCheck.set(key, index);
					forgetChecked(pending, key, unseen?.get(key));
				}
			}
			/** A failed read contradicts the writes it exercised that no unmodelled write came after, as a read a write's effect was learned from still does the others. */
			#contradictOthers(exercised, record, interferes) {
				for (const name of exercised) if (!interferes(name)) this.#drafts.get(name).contradictedBy ??= record.ordinal;
			}
			/** A passing read confirms the writes it exercised that it shows something of, and names, per target, those it shows nothing of. */
			#confirm(view, record, outcome, exercised) {
				const shown = shownWrites(this.#touched, this.#effects, {
					keys: [...outcome.targets, ...outcome.unheld],
					exercised,
					fields: shownFields(view, this.#input.volatileOf)
				});
				for (const name of shown.confirmed) {
					this.#drafts.get(name).confirmed.push(record.ordinal);
					if (showsPlacement(view, outcome, this.#inserted, name)) this.#placed.add(name);
				}
				return shown.unseen;
			}
			#unmodelled(path, index) {
				this.#taint.write(path);
				this.#unmodelledAt.push(index);
			}
			/** Check the writes to an item read's entity on the members they sent, as a resynchronising read does. */
			#checkMembers(view, record, only) {
				const { collection, id } = itemTarget(this.#state, view.type, record);
				const entity = this.#state.entity(view.type, collection, id);
				if (entity === undefined) return;
				const target = entityTarget(entity.type, entity.collection, entity.id);
				const writes = [...this.#touched.get(target) ?? []];
				const checked = new Map(writes.filter(([name]) => only.has(name)));
				this.#checkFields(view, record, entity, checked);
			}
			/** Check the writes to an entity on the fields each wrote against an item read; the read's object, when it shows one. */
			#checkFields(view, record, entity, writes = new Map()) {
				const object = this.#input.io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
				if (!isObject(object)) return undefined;
				for (const [name, pass] of writtenFieldChecks(entity, view, object, {
					volatile: this.#input.volatileOf(view.type),
					writes
				})) {
					const draft = this.#drafts.get(name);
					if (pass) draft.confirmed.push(record.ordinal);
					else draft.contradictedBy ??= record.ordinal;
				}
				return object;
			}
			/** After a failed item check the state takes what the read recorded, so later checks start from it. */
			#adopt(view, record) {
				const { collection, id } = itemTarget(this.#state, view.type, record);
				const entity = this.#state.entity(view.type, collection, id);
				if (entity === undefined) {
					this.#taint.fail(entityTarget(view.type, collection, id));
					return;
				}
				const object = this.#input.io.withBody(record.ordinal, (body) => body === undefined || body === null ? undefined : at(body, view.pointer));
				if (isObject(object)) this.#state.put(updatedEntity(entity, {
					...entity.fields,
					...object
				}));
				else this.#removeEntity(entity);
			}
			/** A read showed the entity gone: the state drops it, and no write keeps a claim on its collection through it. */
			#removeEntity(entity) {
				this.#state.remove(entity);
				this.#effects.removed(this.#touched, entity);
			}
			/** Contradict the writes a failed check exercised, or, when none, the related writes since its targets were last checked; a failed list stops being checked. */
			#mismatch(failed) {
				const ordinal = failed.record.ordinal;
				const since = Math.min(...failed.keys.map((key) => this.#lastCheck.get(key) ?? -1));
				const blame = this.#blame.of({
					...failed,
					since
				});
				for (const name of blame.confirmed) this.#drafts.get(name).confirmed.push(ordinal);
				for (const name of blame.contradicted) this.#drafts.get(name).contradictedBy ??= ordinal;
				if (failed.exercised.size === 0) {
					for (const write of this.#log) if (write.index > since && prefixRelated(write.path, failed.record.path)) this.#drafts.get(write.tool).sideEffect = true;
				}
				if (failed.view.shape !== "item") for (const key of failed.keys) this.#taint.fail(key);
			}
			/** The successful check under another create insertion candidate, including its possibly different query-page coverage. */
			#retryInsert(view, record, exercised) {
				const line = this.#line(view, record);
				if (line === undefined || !listsAll(view, line.ordinal)) return undefined;
				const members = this.#state.members(view.type, line.collection);
				const key = (entity) => entityTarget(entity.type, entity.collection, entity.id);
				const inserted = members.filter((entity) => this.#inserted.has(key(entity)));
				const creates = new Set(inserted.map((entity) => this.#inserted.get(key(entity))));
				if (creates.size !== 1) return undefined;
				const [name] = creates;
				const draft = this.#drafts.get(name);
				if (!exercised.has(name) || this.#placed.has(name)) return undefined;
				for (const candidate of draft.candidates.slice(1)) {
					this.#state.reinsert(view.type, line.collection, inserted, candidate);
					const outcome = this.#check(view, record);
					if (outcome?.pass === true) {
						draft.plan.insert = candidate;
						return outcome;
					}
				}
				return undefined;
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateWrites.js
var LATEST_END_MS, clockStart, extractWrites;
function init_environmentStateWrites() {
	return (init_environmentStateWrites = __esmMin((() => {
		init_EnvironmentStateWriteSimulation();
		LATEST_END_MS = 864e13 - 1e3;
		clockStart = (records, timed) => {
			if (!timed) return null;
			const end = records.reduce((latest, record) => Math.abs(record.end) <= LATEST_END_MS ? Math.max(latest, record.end) : latest, Number.NEGATIVE_INFINITY);
			return Number.isFinite(end) ? new Date(Math.ceil(end / 1e3) * 1e3).toISOString() : null;
		};
		extractWrites = (state, input) => {
			const simulation = new EnvironmentStateWriteSimulation({
				...input,
				views: new Map(state.views.map((view) => [view.tool, view])),
				types: state.types,
				entities: state.entities,
				documents: state.documents
			});
			const writes = simulation.run();
			const views = simulation.views(state.views);
			const backed = new Set();
			const backedTypes = new Set();
			for (const view of views) if (view.shape === "item" || view.shape === "list") {
				backed.add(view.tool);
				backedTypes.add(view.type);
			}
			return {
				writes,
				write_clock: clockStart(input.records, input.timed),
				views,
				types: state.types.filter((type) => backedTypes.has(type.collection_template)),
				entities: state.entities.filter((entity) => backedTypes.has(entity.type)).map((entity) => ({
					...entity,
					view_fields: entity.view_fields.filter((view) => backed.has(view.tool))
				}))
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateQueryCalls.js
var words, QUERY_WORDS, NEUTRAL_WORDS, SESSION_SEGMENTS, READ_OPERATION_WORDS, WRITE_OPERATION_WORDS, OPERATION_CONTAINERS, OPERATION_PARAMETERS, responseDigests, succeeded, unresolved, isOperation, realOperations, operationsOf, readsOnly, readOnlyTools, lastFinishedBefore, repeatsRead, lastReads, ReadsByEnd, namesReadOperations, namesLookup, lastMeaningfulWord, changesReadsAcross, changesInStretch, ABSENT, UNKNOWN, stateWritesOf;
function init_environmentStateQueryCalls() {
	return (init_environmentStateQueryCalls = __esmMin((() => {
		init_canonicalDigest();
		init_environmentStateWords();
		init_environmentStateRules();
		init_environmentStateWriteChecks();
		init_environmentStateWriteRules();
		init_webNetworkRouteTemplates();
		words = identifierWords;
		QUERY_WORDS = new Set([
			...[...QUERY_SEGMENTS].flatMap(words),
			"ids",
			"selection",
			"discover"
		]);
		NEUTRAL_WORDS = new Set([
			"data",
			"info",
			"results"
		]);
		SESSION_SEGMENTS = new Set([
			"auth-refresh",
			"auth-with-password",
			"login",
			"logout",
			"refresh",
			"token"
		]);
		READ_OPERATION_WORDS = new Set([
			"list",
			"get",
			"count",
			"aggregate",
			"info",
			"search",
			"find",
			"read",
			"query",
			"schema",
			"describe",
			"fetch",
			"lookup"
		]);
		WRITE_OPERATION_WORDS = new Set([
			"create",
			"insert",
			"update",
			"modify",
			"replace",
			"delete",
			"remove",
			"upsert",
			"add",
			"set",
			"save",
			"patch",
			"put",
			"post",
			"write",
			"move",
			"copy",
			"duplicate",
			"import",
			"run",
			"execute",
			"trigger",
			"send",
			"reset",
			"clear",
			"archive",
			"restore"
		]);
		OPERATION_CONTAINERS = new Set([
			"batch",
			"bulk",
			"multi"
		]);
		OPERATION_PARAMETERS = [
			"operation",
			"op",
			"action"
		];
		responseDigests = (io) => {
			const digests = new Map();
			return (ordinal) => {
				if (digests.has(ordinal)) return digests.get(ordinal);
				const digest = io.withBody(ordinal, (body) => body === undefined ? undefined : digestCanonicalValue(body, "Environment state"));
				io.retain(128 + textBytes(digest?.length ?? 0));
				digests.set(ordinal, digest);
				return digest;
			};
		};
		succeeded = (record) => record.status !== null && record.status >= 200 && record.status < 300;
		unresolved = (record) => isStateWrite(record) && !succeeded(record);
		isOperation = (name) => typeof name === "string" && !OPERATION_CONTAINERS.has(name.toLowerCase());
		realOperations = (names) => names.filter(isOperation);
		operationsOf = (record, body) => {
			const listed = isObject(body) ? body.operations : undefined;
			const entries = Array.isArray(listed) ? listed.map((entry) => isObject(entry) ? entry.operation : undefined) : [];
			if (listed !== undefined && !Array.isArray(listed) || !entries.every(isOperation)) return undefined;
			const named = isObject(body) ? realOperations([body.operation, ...entries]) : [];
			if (named.length > 0) return named;
			const query = new URLSearchParams(record.query ?? "");
			return realOperations(OPERATION_PARAMETERS.flatMap((name) => query.getAll(name)));
		};
		readsOnly = (operation) => {
			const named = words(operation);
			return named.some((word) => READ_OPERATION_WORDS.has(word)) && !named.some((word) => WRITE_OPERATION_WORDS.has(word));
		};
		readOnlyTools = (tools, records, io) => {
			const position = new Map(records.map((record, index) => [record.ordinal, index]));
			const response = responseDigests(io);
			/** The timeline indexes of the nearest state writes either side of an index, the skipped calls aside: -1 and the length when none, found in one pass each way. */
			const nearestWrites = (skip) => {
				const writes = records.map((record) => !skip.has(record.ordinal) && isStateWrite(record));
				const before = [];
				const after = Array.from({ length: records.length });
				for (let index = 0, last = -1; index < records.length; index += 1) {
					before.push(last);
					if (writes[index]) last = index;
				}
				for (let index = records.length - 1, next = records.length; index >= 0; index -= 1) {
					after[index] = next;
					if (writes[index]) next = index;
				}
				return {
					writes: (at) => ({
						before: before[at],
						after: after[at]
					}),
					isWrite: (index) => writes[index]
				};
			};
			const candidates = new Map();
			for (const tool of tools) {
				if (tool.method !== "POST" || !changesState(tool.method, tool.path_template)) continue;
				const calls = tool.record_ordinals.map((ordinal) => records[position.get(ordinal) ?? -1]).filter((record) => record !== undefined);
				if (!calls.some(succeeded) || calls.some(unresolved)) continue;
				const timeline = {
					position,
					...nearestWrites(new Set(tool.record_ordinals)),
					response
				};
				if (repeatsRead(calls, records, timeline) || namesReadOperations(calls, io) || namesLookup(tool.path_template)) candidates.set(tool.name, calls);
			}
			for (let vetoed = true; vetoed;) {
				const timeline = {
					position,
					...nearestWrites(new Set([...candidates.values()].flat().map((call) => call.ordinal))),
					response
				};
				vetoed = false;
				for (const [name, calls] of candidates) if (changesReadsAcross(calls, records, timeline)) {
					candidates.delete(name);
					vetoed = true;
				}
			}
			return new Set(candidates.keys());
		};
		lastFinishedBefore = (reads, call) => {
			let latest;
			for (const read of reads) if (read.end <= call.start && (latest === undefined || read.end >= latest.end)) latest = read;
			return latest;
		};
		repeatsRead = (calls, records, { position, isWrite, response }) => {
			const answering = calls.filter(succeeded);
			const reads = lastReads(answering, records, position, isWrite);
			return answering.every((call) => {
				const read = reads.get(call.ordinal);
				if (read === undefined) return false;
				const answered = response(call.ordinal);
				return answered !== undefined && answered === response(read.ordinal);
			});
		};
		lastReads = (calls, records, position, isWrite) => {
			const paths = new Set(calls.map((call) => call.path));
			const callAt = new Map(calls.map((call) => [position.get(call.ordinal), call]));
			const lastCall = calls.reduce((latest, call) => Math.max(latest, position.get(call.ordinal)), -1);
			const waiting = new Map();
			const latest = new Map();
			const found = new Map();
			for (let index = 0; index <= lastCall; index += 1) {
				const record = records[index];
				const call = callAt.get(index);
				if (call !== undefined) {
					const ready = waiting.get(call.path);
					for (let read = ready?.popEndedBy(call.start); read !== undefined; read = ready?.popEndedBy(call.start)) latest.set(call.path, read);
					const read = latest.get(call.path);
					if (read !== undefined) found.set(call.ordinal, read);
				} else if (isWrite(index)) {
					waiting.clear();
					latest.clear();
				} else if (record.method === "GET" && succeeded(record) && paths.has(record.path)) {
					const heap = waiting.get(record.path) ?? new ReadsByEnd(position);
					heap.push(record);
					waiting.set(record.path, heap);
				}
			}
			return found;
		};
		ReadsByEnd = class {
			position;
			#reads = [];
			constructor(position) {
				this.position = position;
			}
			#before(left, right) {
				return left.end < right.end || left.end === right.end && this.position.get(left.ordinal) < this.position.get(right.ordinal);
			}
			push(read) {
				const reads = this.#reads;
				reads.push(read);
				for (let at = reads.length - 1; at > 0;) {
					const parent = at - 1 >>> 1;
					if (!this.#before(reads[at], reads[parent])) break;
					[reads[at], reads[parent]] = [reads[parent], reads[at]];
					at = parent;
				}
			}
			/** The read that finished first, when it finished by `time`. */
			popEndedBy(time) {
				const reads = this.#reads;
				const first = reads[0];
				if (first === undefined || first.end > time) return undefined;
				const last = reads.pop();
				if (reads.length > 0) {
					reads[0] = last;
					for (let at = 0;;) {
						const [left, right] = [at * 2 + 1, at * 2 + 2];
						let next = at;
						if (left < reads.length && this.#before(reads[left], reads[next])) next = left;
						if (right < reads.length && this.#before(reads[right], reads[next])) next = right;
						if (next === at) break;
						[reads[at], reads[next]] = [reads[next], reads[at]];
						at = next;
					}
				}
				return first;
			}
		};
		namesReadOperations = (calls, io) => calls.every((call) => {
			const operations = operationsOf(call, io.request(call.ordinal));
			return operations !== undefined && operations.length > 0 && operations.every(readsOnly);
		});
		namesLookup = (template) => {
			const last = segmentsOf(template).findLast((segment) => !isParam(segment));
			if (last === undefined) return false;
			return SESSION_SEGMENTS.has(last.toLowerCase()) || QUERY_WORDS.has(lastMeaningfulWord(last) ?? "") && !words(last).some((word) => WRITE_OPERATION_WORDS.has(word));
		};
		lastMeaningfulWord = (segment) => words(segment).findLast((word) => !NEUTRAL_WORDS.has(word));
		changesReadsAcross = (calls, records, { position, writes, response }) => {
			const stretches = new Map();
			for (const call of calls.filter(succeeded)) {
				const { before, after } = writes(position.get(call.ordinal));
				const key = JSON.stringify([
					before,
					after,
					call.path
				]);
				const stretch = stretches.get(key);
				if (stretch === undefined) stretches.set(key, {
					from: before,
					to: after,
					path: call.path,
					calls: [call]
				});
				else stretch.calls.push(call);
			}
			for (const stretch of stretches.values()) if (changesInStretch(stretch, records, {
				position,
				response
			})) return true;
			return false;
		};
		changesInStretch = (stretch, records, { position, response }) => {
			const shown = (record) => succeeded(record) ? response(record.ordinal) ?? UNKNOWN : ABSENT;
			const lines = new Map();
			for (let index = stretch.from + 1; index < stretch.to; index += 1) {
				const record = records[index];
				if (record.method !== "GET" || !(succeeded(record) || isAbsence(record.status)) || !prefixRelated(stretch.path, record.path)) continue;
				const line = `${record.path}${record.query ?? ""}`;
				const reads = lines.get(line);
				if (reads === undefined) lines.set(line, [record]);
				else reads.push(record);
			}
			const changing = [...lines.values()].filter((reads) => {
				const first = shown(reads[0]);
				return reads.some((read) => shown(read) !== first);
			});
			return stretch.calls.some((call) => {
				const at = position.get(call.ordinal);
				return changing.some((reads) => {
					const earlier = lastFinishedBefore(reads.filter((read) => position.get(read.ordinal) < at), call);
					const later = reads.find((read) => position.get(read.ordinal) > at && read.start >= call.end);
					if (earlier === undefined || later === undefined) return false;
					const [was, now] = [shown(earlier), shown(later)];
					if (was === ABSENT !== (now === ABSENT)) return true;
					return was !== UNKNOWN && now !== UNKNOWN && was !== now;
				});
			});
		};
		ABSENT = Symbol("absent");
		UNKNOWN = Symbol("unknown");
		stateWritesOf = (tools, records, io) => {
			const readOnly = readOnlyTools(tools, records, io);
			const reads = new Set(tools.filter((tool) => readOnly.has(tool.name)).flatMap((tool) => tool.record_ordinals));
			return {
				readOnly,
				writes: records.filter((record) => isStateWrite(record) && !reads.has(record.ordinal))
			};
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/EnvironmentStateExtraction.js
var StateBudgetExhausted, entityKey, requestLine, memberNames, EnvironmentStateExtraction;
function init_EnvironmentStateExtraction() {
	return (init_EnvironmentStateExtraction = __esmMin((() => {
		init_jsonSerialization();
		init_unicodeCodePointOrder();
		init_environmentStateRules();
		init_webNetworkRouteTemplates();
		init_environmentStateMerge();
		init_environmentStateInitialOrder();
		init_environmentStateRewrites();
		init_environmentStateGate();
		init_environmentStateWriteCutoffs();
		init_environmentStateWriteLinks();
		init_environmentStateWrites();
		init_environmentStateVariants();
		init_environmentStateQueryCalls();
		init_environmentStateResponseMembers();
		StateBudgetExhausted = class extends Error {};
		entityKey = (type, collection, id) => compositeKey([
			type,
			collection,
			id
		]);
		requestLine = (record) => record.path + (record.query ?? "");
		memberNames = (body, pointer) => {
			const object = at(body, pointer);
			return isObject(object) ? Object.keys(object) : [];
		};
		EnvironmentStateExtraction = class {
			#tools;
			#records;
			#timeline;
			#budget;
			#position;
			#byOrdinal;
			/** POST tools whose calls the capture shows read state rather than change it. */
			#readOnly = new Set();
			#writes = [];
			#writeWithin = writeSpanCheck([]);
			#bases;
			#writeCutoffs;
			#initLimits = new Map();
			/** Successful POSTs with the ids their responses named, read once before planning. */
			#created;
			#identity = new Map();
			#views = new Map();
			#plans = [];
			#entities = new Map();
			#volatile = new Map();
			/** Types with a value that changed across a recorded write, which may be that write's effect. */
			#rewritten = new Set();
			/** The recordings either side of each such change, and per type the write its initial reads end at. */
			#spans = [];
			#cuts = new Map();
			#minted;
			#merged = new Map();
			/** Merged entities by type and collection, built once on first use after merging. */
			#collections;
			constructor(input) {
				this.#tools = input.tools;
				this.#records = input.records;
				this.#timeline = input.timeline;
				this.#budget = input.budget;
				this.#position = new Map(input.records.map((record, index) => [record.ordinal, index]));
				this.#byOrdinal = new Map(input.records.map((record) => [record.ordinal, record]));
				this.#bases = apiBaseLengths(input.tools.map((tool) => tool.path_template));
			}
			/** The timeline's state writes, less the calls of tools that only read. */
			#findWrites() {
				const release = this.#budget.checkpoint();
				({readOnly: this.#readOnly, writes: this.#writes} = stateWritesOf(this.#tools, this.#records, {
					withBody: (ordinal, use) => this.#withBody(ordinal, use),
					request: (ordinal) => this.#requestBody(ordinal),
					retain: (bytes) => this.#retain(bytes)
				}));
				release();
				this.#writeWithin = writeSpanCheck(this.#writes);
			}
			/** The extracted state, or null when the representation budget is exhausted. */
			run() {
				try {
					this.#findWrites();
					if (this.#writes.length > 0) {
						this.#writeCutoffs = new StateWriteCutoffs(this.#writes, this.#bases, (left, right) => this.#position.get(left.ordinal) < this.#position.get(right.ordinal), (bytes) => this.#retain(bytes));
						this.#creations();
					}
					const release = this.#budget.checkpoint();
					let candidates = this.#plan();
					if (this.#cutRewrites()) {
						release();
						candidates = this.#plan();
					}
					const gate = this.#gateContext();
					for (const plan of this.#plans) if (this.#rewritten.has(plan.type)) this.#recorded(plan.tool, "fields-differ");
					else this.#views.set(plan.tool.name, plan.item ? checkItemPlan(gate, plan) : checkListPlan(gate, plan));
					return this.#withWrites(this.#result(this.#documents(candidates)));
				} catch (cause) {
					if (cause instanceof StateBudgetExhausted) return null;
					throw cause;
				}
			}
			/** Plan and observe every candidate, then merge the observed entities. */
			#plan() {
				const candidates = this.#candidates();
				for (const candidate of candidates.filter((entry) => entry.item)) this.#planItem(candidate);
				for (const candidate of candidates.filter((entry) => !entry.item)) this.#planList(candidate);
				for (const plan of this.#plans) this.#observePlan(plan);
				this.#dropVariants();
				orderByWholeLines(this.#entities.values(), (ordinal) => this.#byOrdinal.get(ordinal)?.query);
				this.#classifyChanges();
				this.#merge();
				return candidates;
			}
			/** Leave each plan's representation variants to replay: out of its lines, the observed entities and the membership changes. */
			#dropVariants() {
				const shapes = lineShapes(this.#entities.values(), (bytes) => this.#retain(bytes));
				const dropped = new Set();
				for (const [index, plan] of this.#plans.entries()) {
					const split = withoutVariants(plan, {
						shapeOf: (record) => shapes.get(record.ordinal),
						queryOf: (ordinal) => this.#byOrdinal.get(ordinal)?.query,
						position: (ordinal) => this.#position.get(ordinal),
						retain: (bytes) => this.#retain(bytes),
						checkpoint: () => this.#budget.checkpoint()
					});
					if (split === undefined) continue;
					this.#retain(128 * (split.dropped.size + 2));
					this.#plans[index] = split.plan;
					dropObservations(this.#entities, split.dropped);
					for (const ordinal of split.dropped) dropped.add(ordinal);
				}
				this.#spans = this.#spans.filter((span) => !dropped.has(span.later));
			}
			/** End each rewritten type's initial reads at the earliest write its reads disagree across, and clear the plans to make them again. */
			#cutRewrites() {
				this.#cuts = rewriteCuts(this.#spans.filter((span) => this.#rewritten.has(span.type)), this.#writes, this.#byOrdinal);
				if (this.#cuts.size === 0) return false;
				for (const map of [
					this.#initLimits,
					this.#identity,
					this.#views
				]) map.clear();
				for (const map of [
					this.#entities,
					this.#volatile,
					this.#merged
				]) map.clear();
				this.#rewritten.clear();
				this.#plans.length = 0;
				this.#spans = [];
				this.#collections = undefined;
				return true;
			}
			/** The write plans the capture's own timeline confirms against the extracted state. */
			#withWrites(state) {
				return {
					...state,
					...extractWrites(state, {
						tools: this.#tools,
						records: this.#records,
						readOnly: this.#readOnly,
						timed: this.#timeline === "recorded-start-time",
						volatileOf: (type) => this.#volatileOf(type),
						io: {
							withBody: (ordinal, use) => this.#withBody(ordinal, use),
							requestBody: (ordinal) => this.#parsedRequestBody(ordinal),
							withRequestBody: (ordinal, use) => this.#withRequestBody(ordinal, use),
							emptyResponse: (ordinal) => this.#budget.emptyResponse(ordinal),
							retain: (bytes) => this.#retain(bytes),
							queryOf: (ordinal) => this.#byOrdinal.get(ordinal)?.query
						}
					})
				};
			}
			#withRequestBody(ordinal, use) {
				const value = this.#budget.withRequestBody(ordinal, use);
				if (value === null) throw new StateBudgetExhausted();
				return value;
			}
			#parsedRequestBody(ordinal) {
				return this.#withRequestBody(ordinal, (body) => body);
			}
			#requestBody(ordinal) {
				return requestJson(this.#parsedRequestBody(ordinal));
			}
			#retain(bytes) {
				if (!this.#budget.retain(bytes)) throw new StateBudgetExhausted();
			}
			/** Parse one body and hand it to `use` before its temporary work is dropped; unusable bodies arrive undefined. */
			#withBody(ordinal, use) {
				try {
					const parsed = this.#budget.body(ordinal);
					if (parsed === null) throw new StateBudgetExhausted();
					return use(parsed.kind === "json" ? parsed.value : undefined);
				} finally {
					this.#budget.release();
				}
			}
			#recorded(tool, reason) {
				this.#views.set(tool.name, {
					tool: tool.name,
					shape: "recorded",
					reason
				});
			}
			/** GET tools may render from state; query POSTs stay recorded. */
			#candidates() {
				const candidates = [];
				for (const tool of this.#tools) {
					if (isQueryPost(tool.method, tool.path_template) || this.#readOnly.has(tool.name)) this.#recorded(tool, "query-body");
					if (tool.method !== "GET") continue;
					candidates.push({
						tool,
						...readType(tool.path_template)
					});
				}
				return candidates;
			}
			/** The first write whose root relates to the template's, or that made one of its entities, bounds its init recordings. */
			#initLimit(template) {
				if (this.#writeCutoffs === undefined) return undefined;
				if (this.#initLimits.has(template)) return this.#initLimits.get(template);
				const first = this.#writeCutoffs.first(rootOf(template, this.#bases));
				const bound = creationLimit(this.#creations(), {
					type: template,
					tools: this.#tools,
					records: this.#byOrdinal,
					position: (record) => this.#position.get(record.ordinal),
					withBody: (ordinal, use) => this.#withBody(ordinal, use),
					retain: (bytes) => this.#retain(bytes)
				}, first) ?? first;
				const cut = this.#cuts.get(template);
				const limit = cut !== undefined && (bound === undefined || this.#position.get(cut.ordinal) < this.#position.get(bound.ordinal)) ? cut : bound;
				this.#retain(128 + textBytes(template.length));
				this.#initLimits.set(template, limit);
				return limit;
			}
			#creations() {
				this.#created ??= createdIdsOf(this.#writes, (ordinal) => {
					const ids = this.#withBody(ordinal, respondedIds);
					this.#retain(128 + textBytes(ids.join("").length));
					return ids;
				});
				return this.#created;
			}
			/** Initial-state admission is shared with later projection-evidence selection. */
			#beforeInitLimit(record, limit) {
				return limit === undefined || this.#position.get(record.ordinal) < this.#position.get(limit.ordinal) && (this.#timeline === "record-order" || record.end <= limit.start);
			}
			/** Successful recordings that finished before the first related write began. */
			#initRecordings(tool, template) {
				const limit = this.#initLimit(template);
				return tool.record_ordinals.map((ordinal) => this.#byOrdinal.get(ordinal)).filter((record) => record !== undefined && record.status !== null && record.status >= 200 && record.status < 300 && this.#beforeInitLimit(record, limit)).sort((left, right) => this.#position.get(left.ordinal) - this.#position.get(right.ordinal));
			}
			#latestPerLine(recordings) {
				const latest = new Map();
				for (const record of recordings) {
					latest.delete(requestLine(record));
					latest.set(requestLine(record), record);
				}
				return [...latest.values()];
			}
			/** A candidate's initial recordings, or undefined after recording that it has none. */
			#initRecordingsOf(candidate) {
				const recordings = this.#initRecordings(candidate.tool, candidate.type);
				if (recordings.length > 0) return recordings;
				this.#recorded(candidate.tool, "no-init-recording");
				return undefined;
			}
			#addPlan(candidate, pointer, recordings, replayed = {}) {
				this.#plans.push({
					...candidate,
					pointer,
					recordings,
					latest: this.#latestPerLine(recordings),
					projected: replayed.projected ?? [],
					late: replayed.late ?? []
				});
			}
			/**
			* Later identity-free projections are evidence of replay, never initial entities; later lines that
			* show the identity and name a shaping or projection parameter are kept, with their members, for
			* the variant pass to decide against the lines left. Read only those query bodies.
			*/
			#addLateProjections(tool, type, projected) {
				const limit = this.#initLimit(type);
				const late = [];
				if (limit === undefined) return late;
				for (const ordinal of tool.record_ordinals) {
					const record = this.#byOrdinal.get(ordinal);
					if (record === undefined || record.status === null || record.status < 200 || record.status >= 300 || this.#beforeInitLimit(record, limit)) continue;
					const projecting = projectsFields(record.query);
					const selecting = selectsSomeFields(record.query);
					const shaping = shapesOtherwise(record.query);
					if (!projecting && !shaping) continue;
					const line = this.#withBody(ordinal, (body) => {
						if (body === undefined) return undefined;
						const located = locateItem(body, lastSegmentValue(record.path));
						if (located === undefined) return projecting ? null : undefined;
						if (!selecting && !shaping) return undefined;
						const names = memberNames(body, located.pointer);
						this.#retain(128 * (2 + names.length) + names.reduce((bytes, name) => bytes + textBytes(name.length), 0));
						return {
							record,
							members: new Set(names),
							projecting: selecting
						};
					});
					if (line === null) {
						this.#retain(128);
						projected.push(ordinal);
					} else if (line !== undefined) late.push(line);
				}
				return late;
			}
			/** Item tools prove a type's identity field by the path value their bodies repeat. */
			#planItem(candidate) {
				const { tool, type } = candidate;
				const recordings = this.#initRecordingsOf(candidate);
				if (recordings === undefined) return;
				let pointer;
				let keys;
				const kept = [];
				const projected = [];
				for (const record of recordings) {
					const located = this.#withBody(record.ordinal, (body) => body === undefined ? null : locateItem(body, lastSegmentValue(record.path)));
					if (located === null) {
						this.#recorded(tool, "body-unusable");
						return;
					}
					if (located === undefined && projectsFields(record.query)) {
						this.#retain(128);
						projected.push(record.ordinal);
						continue;
					}
					kept.push(record);
					if (located === undefined || (pointer ?? located.pointer) !== located.pointer) {
						this.#recorded(tool, "no-identity");
						return;
					}
					pointer = located.pointer;
					if (keys === undefined) keys = located.keys;
					else {
						const matching = new Set(located.keys);
						keys = keys.filter((key) => matching.has(key));
					}
				}
				const field = IDENTITY_NAMES.find((name) => keys?.includes(name) === true) ?? keys?.[0];
				const known = this.#identity.get(type);
				if (field === undefined || pointer === undefined || known !== undefined && known.field !== field) {
					this.#recorded(tool, "no-identity");
					return;
				}
				this.#identity.set(type, {
					field,
					basis: "path-parameter"
				});
				const late = this.#addLateProjections(tool, type, projected);
				projected.sort((left, right) => this.#position.get(left) - this.#position.get(right));
				this.#addPlan(candidate, pointer, kept, {
					projected,
					late
				});
			}
			/**
			* List tools use the proved field, else the first identity candidate every non-empty recording's
			* items share; a suffix-named field must also show distinct values across two items of one
			* recording. Reads without a list or identity are left to documents.
			*/
			#planList(candidate) {
				const { tool, type } = candidate;
				const initial = this.#initRecordingsOf(candidate);
				if (initial === undefined) return;
				const whole = initial.filter((record) => !selectsSomeFields(record.query));
				const recordings = whole.length > 0 ? whole : initial;
				const proved = this.#identity.get(type)?.field;
				const fieldsOf = (items) => proved === undefined ? identityCandidates(items) : identifies(items, proved) ? [proved] : [];
				let pointer;
				let names;
				const shown = new Set();
				for (const record of recordings) {
					const found = this.#withBody(record.ordinal, (body) => {
						if (body === undefined) return null;
						const located = locateList(body, proved);
						if (pointer !== undefined && located !== pointer) return undefined;
						const items = located === undefined ? undefined : listItems(body, located);
						if (items === undefined) return undefined;
						pointer = located;
						return items.length === 0 ? true : {
							fields: fieldsOf(items),
							several: items.length > 1
						};
					});
					if (found === undefined) return;
					if (found === null) {
						this.#recorded(tool, "body-unusable");
						return;
					}
					if (found === true) continue;
					if (names === undefined) names = found.fields;
					else {
						const matching = new Set(found.fields);
						names = names.filter((name) => matching.has(name));
					}
					if (found.several) for (const name of found.fields) shown.add(name);
				}
				const field = (names ?? (proved === undefined ? [] : [proved])).find((name) => name === proved || IDENTITY_NAMES.includes(name) || shown.has(name));
				if (field === undefined || pointer === undefined) return;
				if (!this.#identity.has(type)) this.#identity.set(type, {
					field,
					basis: "field-name"
				});
				this.#retain(128 * (initial.length - recordings.length));
				this.#addPlan(candidate, pointer, recordings, { projected: initial.filter((record) => !recordings.includes(record)).map((record) => record.ordinal) });
			}
			#observePlan(plan) {
				const memberships = !plan.item && this.#writeWithin(plan.recordings[0], plan.recordings.at(-1)) ? new Map() : undefined;
				for (const record of plan.recordings) this.#withBody(record.ordinal, (body) => {
					const located = body === undefined ? undefined : at(body, plan.pointer);
					const objects = plan.item ? isObject(located) ? [located] : [] : body === undefined ? [] : listItems(body, plan.pointer) ?? [];
					if (memberships !== undefined) this.#observeMembership(plan, record, objects, memberships);
					objects.forEach((object, index) => this.#observe(plan, record, object, index));
				});
			}
			/** Compare one request line's membership before discarding older recordings; reuse its bounded set. */
			#observeMembership(plan, record, objects, memberships) {
				const line = requestLine(record);
				let previous = memberships.get(line);
				const earlier = previous?.record;
				if (previous === undefined) {
					this.#retain(128 * 2 + textBytes(line.length));
					previous = {
						record,
						ids: new Set(),
						capacity: 0
					};
					memberships.set(line, previous);
				}
				if (objects.length > previous.capacity) {
					this.#retain((objects.length - previous.capacity) * 128 * 4);
					previous.capacity = objects.length;
				}
				const field = this.#identity.get(plan.type).field;
				let changed = previous.ids.size !== objects.length;
				for (const object of objects) if (!previous.ids.delete(scalarText(object[field]))) changed = true;
				if (previous.ids.size > 0) changed = true;
				if (earlier !== undefined && changed && this.#writeWithin(earlier, record)) {
					this.#retain(128 * 4);
					this.#spans.push({
						type: plan.type,
						earlier: earlier.ordinal,
						later: record.ordinal
					});
				}
				previous.ids.clear();
				for (const object of objects) previous.ids.add(scalarText(object[field]));
				previous.record = record;
			}
			/** Record one observed entity object; a value that changes between one tool's own observations is volatile. */
			#observe(plan, record, object, index) {
				const field = this.#identity.get(plan.type).field;
				const id = scalarText(object[field]);
				if (id === undefined) return;
				const collection = collectionPathOf(record, plan.item);
				const key = entityKey(plan.type, collection, id);
				const position = this.#position.get(record.ordinal);
				let entity = this.#entities.get(key);
				if (entity === undefined) {
					this.#retain(128 * 4 + textBytes(key.length));
					entity = {
						type: plan.type,
						collection,
						id,
						order: [position, index],
						observations: []
					};
					this.#entities.set(key, entity);
				} else {
					const [first, at] = entity.order;
					if (position < first || position === first && index < at) entity.order = [position, index];
				}
				this.#retain(128 + stateValueRetentionBytes(object));
				entity.observations.push({
					position,
					index,
					ordinal: record.ordinal,
					tool: plan.tool.name,
					item: plan.item,
					object
				});
			}
			/** A change across any recorded write, in values or in a kept line's membership, rewrites the type; one between repeats of a line with no write is volatile. */
			#classifyChanges() {
				const recordOf = (observation) => this.#byOrdinal.get(observation.ordinal);
				const changes = classifyEntityChanges(this.#entities.values(), (observation) => [observation.tool, requestLine(recordOf(observation))], (earlier, later) => this.#writeWithin(recordOf(earlier), recordOf(later)));
				this.#retain(128 * 4 * changes.spans.length);
				for (const span of changes.spans) this.#spans.push(span);
				for (const { type } of this.#spans) this.#rewritten.add(type);
				for (const [type, names] of changes.volatile) this.#volatile.set(type, names);
			}
			#merge() {
				for (const entity of [...this.#entities.values()].sort(compareObservedEntities)) this.#merged.set(entityKey(entity.type, entity.collection, entity.id), mergeObservedEntity(entity));
			}
			#gateContext() {
				this.#minted ??= perResponseMembers({
					records: this.#records,
					withBody: (ordinal, use) => this.#withBody(ordinal, use),
					writeWithin: this.#writeWithin,
					retain: (bytes) => this.#retain(bytes),
					checkpoint: () => this.#budget.checkpoint()
				});
				return {
					minted: this.#minted,
					withBody: (ordinal, use) => this.#withBody(ordinal, use),
					retain: (bytes) => this.#retain(bytes),
					entity: (type, collection, id) => this.#merged.get(entityKey(type, collection, id)),
					inCollection: (type, collection) => this.#inCollection(type, collection),
					volatileOf: (type) => this.#volatileOf(type),
					idField: (type) => this.#identity.get(type).field
				};
			}
			#volatileOf(type) {
				return this.#volatile.get(type) ?? new Set();
			}
			#inCollection(type, collection) {
				if (this.#collections === undefined) {
					this.#retain(128 * (this.#merged.size + 1));
					this.#collections = new Map();
					for (const entity of this.#merged.values()) {
						const key = JSON.stringify([entity.type, entity.collection]);
						const members = this.#collections.get(key);
						if (members === undefined) this.#collections.set(key, [entity]);
						else members.push(entity);
					}
				}
				return this.#collections.get(JSON.stringify([type, collection])) ?? [];
			}
			/** A list tool without a plan or recorded reason holds one document value: its latest init recording, under one request line. */
			#documents(candidates) {
				const documents = [];
				for (const { tool, item } of candidates) {
					if (item || this.#views.has(tool.name)) continue;
					const recordings = this.#initRecordings(tool, tool.path_template);
					const latest = this.#latestPerLine(recordings);
					if (latest.length !== 1) {
						const paths = new Set(latest.map((record) => record.path));
						this.#recorded(tool, latest.length === 0 ? "no-init-recording" : paths.size > 1 ? "path-varies" : "query-varies");
						continue;
					}
					const record = latest[0];
					if (recordings.some((after, index) => index > 0 && this.#writeWithin(recordings[index - 1], after) && this.#withBody(recordings[index - 1].ordinal, (before) => this.#withBody(after.ordinal, (body) => !same(before, body))))) {
						this.#recorded(tool, "fields-differ");
						continue;
					}
					const value = this.#withBody(record.ordinal, (body) => body);
					if (value === undefined) {
						this.#recorded(tool, "body-unusable");
						continue;
					}
					if (jsonByteLength(value) > 262144) {
						this.#recorded(tool, "rendered-oversize");
						continue;
					}
					this.#retain(128 + stateValueRetentionBytes(value) + textBytes(record.path.length));
					documents.push({
						tool: tool.name,
						path: record.path,
						value,
						record_ordinal: record.ordinal
					});
					const minted = mintedFor(this.#minted ?? new Map(), [record]);
					this.#views.set(tool.name, {
						tool: tool.name,
						shape: "document",
						checked_record_ordinals: [record.ordinal],
						...declaredMembers(envelopeMembers(value, minted), (bytes) => this.#retain(bytes))
					});
				}
				return documents.sort((left, right) => compareUnicodeCodePoints(left.tool, right.tool));
			}
			/** Types and entities that at least one state-backed view renders; view values only for those views. */
			#result(documents) {
				const backed = new Set();
				const backedTypes = new Set();
				for (const view of this.#views.values()) if (view.shape === "item" || view.shape === "list") {
					this.#retain(128);
					backed.add(view.tool);
					if (!backedTypes.has(view.type)) {
						this.#retain(128);
						backedTypes.add(view.type);
					}
				}
				const types = [...this.#identity.entries()].filter(([type]) => backedTypes.has(type)).map(([type, { field, basis }]) => ({
					collection_template: type,
					id_field: field,
					id_basis: basis,
					init_before_ordinal: this.#initLimit(type)?.ordinal ?? null,
					volatile_fields: [...this.#volatileOf(type)].sort(compareUnicodeCodePoints)
				})).sort((left, right) => compareUnicodeCodePoints(left.collection_template, right.collection_template));
				const typed = new Set(types.map((type) => type.collection_template));
				return {
					types,
					entities: [...this.#merged.values()].filter((entity) => typed.has(entity.type)).map((entity) => ({
						...entity,
						view_fields: entity.view_fields.filter((view) => backed.has(view.tool))
					})),
					documents,
					views: this.#tools.flatMap((tool) => {
						const view = this.#views.get(tool.name);
						return view === undefined ? [] : [view];
					})
				};
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/EnvironmentStateAccumulator.js
var STATE_NESTING_DEPTH, stateBodyJson, timingSchema, redactedWriteSchema, contentSchema, requestSchema, requestContentSchema, UNKNOWNS, EnvironmentStateAccumulator;
function init_EnvironmentStateAccumulator() {
	return (init_EnvironmentStateAccumulator = __esmMin((() => {
		init_exactJsonNumber();
		init_jsonValue();
		init_offsetDateTime();
		init_result();
		init_webNetworkCapture();
		init_EnvironmentManifestAccumulator();
		init_EnvironmentStateExtraction();
		init_environmentStateRules();
		init_recordedResponseBody();
		init_webNetworkRouteTemplates();
		STATE_NESTING_DEPTH = 16;
		stateBodyJson = (contentType, body) => {
			if (contentType === null || !isJsonLike(mediaTypeEssence(contentType)) || body.bodyText === null || body.bodyEncoding === "base64" || body.bodyCut === true || Buffer.byteLength(body.bodyText, "utf8") > 262144) return undefined;
			const value = parseExactJson(body.bodyText);
			return value === undefined || hasPrototypeKey(value) || deeperThan(value, 1e3 - STATE_NESTING_DEPTH) ? undefined : value;
		};
		timingSchema = z.object({
			startedDateTime: z.string(),
			time: z.number().nonnegative()
		});
		redactedWriteSchema = z.object({
			request: z.object({ method: z.string() }),
			response: z.object({ status: z.number() }).optional()
		});
		contentSchema = z.object({ response: z.object({ content: z.object({ text: z.string() }) }) });
		requestSchema = z.object({ request: z.object({
			postData: z.unknown().optional(),
			bodySize: z.number().optional()
		}) });
		requestContentSchema = z.object({
			mimeType: z.string(),
			text: z.string(),
			params: z.array(z.unknown()).optional()
		});
		UNKNOWNS = [
			{
				kind: "authorization-model",
				statement: "Authorization headers and cookies are structurally excluded from captures; the state states no authorization model."
			},
			{
				kind: "response-semantics",
				statement: "Views reproduce their recorded responses from the state; they do not establish how the application computes responses, derived values or values copied outside entity objects."
			},
			{
				kind: "state-transition",
				statement: "The state is one snapshot from before the first related recorded write; write effects are modelled only from the calls the capture recorded, and served only where its later reads confirmed them."
			}
		];
		EnvironmentStateAccumulator = class extends EnvironmentManifestAccumulator {
			#entries = new Map();
			#bodyReleases = [];
			constructor(maximumBytes = WEB_NETWORK_CAPTURE_LIMITS.outputBytes, rules = []) {
				super(maximumBytes, true, rules, "Environment-state");
			}
			/** The state publishes no body shapes. */
			get reportsBodyShapes() {
				return false;
			}
			add(record, scenarioResponseBody) {
				const grouped = super.add(record, scenarioResponseBody);
				if (!grouped.ok) return grouped;
				try {
					const line = readRecordedRequestLine(record.reported, true, this.scratch);
					if (line === null) return this.overBudget();
					const timing = timingSchema.safeParse(record.reported);
					if (timing.success && !this.scratch(512 + textBytes(timing.data.startedDateTime.length + 6) * 3)) return this.overBudget();
					const startInstant = timing.success ? readRecordedDateTime(timing.data.startedDateTime)?.instant : undefined;
					const start = startInstant === undefined ? record.ordinal : startInstant.epochSecond * 1e3 + Number(startInstant.fraction.slice(0, 3).padEnd(3, "0"));
					const instantBytes = timing.success && startInstant !== undefined ? 128 + textBytes(timing.data.startedDateTime.length + 6) : 0;
					if (line.kind === "excluded") return line.reason === "url-redacted" ? this.#redactedWrite(record, timing.success && startInstant !== undefined ? {
						start,
						end: start + timing.data.time,
						startInstant,
						instantBytes
					} : undefined) : ok(undefined);
					if (!this.retain(128 * 8 + instantBytes + textBytes(line.method.length + line.origin.length + line.path.length + (line.query?.length ?? 0) + line.rawMime.length))) return this.overBudget();
					this.#entries.set(record.ordinal, {
						facts: {
							ordinal: record.ordinal,
							method: line.method,
							path: line.path,
							query: line.query === "" ? undefined : line.query,
							status: line.status,
							start,
							end: timing.success && startInstant !== undefined ? start + timing.data.time : record.ordinal
						},
						origin: line.origin,
						contentType: line.rawMime,
						startInstant,
						record
					});
					return ok(undefined);
				} finally {
					this.releaseTemporary();
				}
			}
			/** Keep a successful write whose URL was redacted, with an empty path whose root relates to every type. */
			#redactedWrite(record, timing) {
				const parsed = redactedWriteSchema.safeParse(record.reported);
				if (!parsed.success) return ok(undefined);
				const status = parsed.data.response?.status ?? 0;
				const facts = {
					ordinal: record.ordinal,
					method: parsed.data.request.method,
					path: "",
					query: undefined,
					status: status > 0 ? status : null,
					start: timing?.start ?? record.ordinal,
					end: timing?.end ?? record.ordinal
				};
				if (!isStateWrite(facts)) return ok(undefined);
				if (!this.retain(128 * 8 + textBytes(facts.method.length) + (timing?.instantBytes ?? 0))) return this.overBudget();
				this.#entries.set(record.ordinal, {
					facts,
					origin: null,
					contentType: "",
					startInstant: timing?.startInstant,
					record
				});
				return ok(undefined);
			}
			/** Parse one retained response body as state JSON, charging its decoding and tree as temporary work. */
			#body(ordinal) {
				this.#bodyReleases.push(this.temporaryCheckpoint());
				const entry = this.#entries.get(ordinal);
				if (entry === undefined || !isJsonLike(mediaTypeEssence(entry.contentType))) return { kind: "unusable" };
				const content = contentSchema.safeParse(entry.record.reported);
				if (!content.success) return { kind: "unusable" };
				const length = content.data.response.content.text.length;
				if (length > base64PrefixChars(262144)) return { kind: "unusable" };
				if (!this.temporary(512 + textBytes(length) * 4)) return null;
				const value = stateBodyJson(entry.contentType, readRecordedResponseBody(entry.record, STATE_BODY_LIMIT_BYTES));
				return value === undefined ? { kind: "unusable" } : {
					kind: "json",
					value
				};
			}
			/** Parse one recorded request body as state JSON, as response bodies are admitted. */
			#withRequestBody(ordinal, use) {
				const entry = this.#entries.get(ordinal);
				const request = requestSchema.safeParse(entry?.record.reported);
				if (entry === undefined || !request.success) return use({ kind: "unusable" });
				const { postData, bodySize } = request.data.request;
				if (postData === undefined) return use({ kind: bodySize === 0 ? "absent" : "unusable" });
				const parsed = requestContentSchema.safeParse(postData);
				if (!parsed.success) return use({ kind: "unusable" });
				const { mimeType, text, params } = parsed.data;
				if (bodySize === 0 && text === "" && (params?.length ?? 0) === 0) return use({ kind: "absent" });
				if (!isJsonLike(mediaTypeEssence(mimeType)) || Buffer.byteLength(text, "utf8") > 262144) return use({ kind: "unusable" });
				const release = this.temporaryCheckpoint();
				try {
					if (!this.temporary(512 + textBytes(text.length) * 4)) return null;
					const value = stateBodyJson(mimeType, { bodyText: text });
					return use(value === undefined ? { kind: "unusable" } : {
						kind: "json",
						value
					});
				} finally {
					release();
				}
			}
			/** Whether a record's response carried no body: a 204, or known decoded empty content. */
			#emptyResponse(ordinal) {
				const entry = this.#entries.get(ordinal);
				if (entry === undefined) return false;
				if (entry.facts.status === 204) return true;
				return recordedResponseBodyIsEmpty(entry.record);
			}
			/** Project the init state of the manifest's primary origin; records keep timeline order. */
			finishState() {
				const manifest = this.finish();
				if (!manifest.ok) return manifest;
				const entries = [...this.#entries.values()].filter((entry) => entry.origin === manifest.value.origin || entry.origin === null);
				const redactedWrites = entries.filter((entry) => entry.origin === null).length;
				const timeline = entries.length > 0 && entries.every((entry) => entry.startInstant !== undefined) ? "recorded-start-time" : "record-order";
				const records = entries.sort((left, right) => timeline === "record-order" ? left.facts.ordinal - right.facts.ordinal : compareOffsetDateTimeInstants(left.startInstant, right.startInstant) || left.facts.ordinal - right.facts.ordinal).map((entry) => entry.facts).map((facts) => timeline === "record-order" ? {
					...facts,
					start: facts.ordinal,
					end: facts.ordinal
				} : facts);
				const state = new EnvironmentStateExtraction({
					tools: manifest.value.tools,
					records,
					timeline,
					budget: {
						body: (ordinal) => this.#body(ordinal),
						withRequestBody: (ordinal, use) => this.#withRequestBody(ordinal, use),
						emptyResponse: (ordinal) => this.#emptyResponse(ordinal),
						retain: (bytes) => this.retain(bytes),
						checkpoint: () => this.retainedCheckpoint(),
						release: () => this.#bodyReleases.pop()?.()
					}
				}).run();
				if (state === null) return this.overBudget();
				const limitations = this.addLimitations([
					...redactedWrites > 0 ? [`${String(redactedWrites)} of the recorded writes had a redacted URL; each ends the initial state of every type, since its target is unknown.`] : [],
					...timeline === "record-order" ? ["Some records carry no start time, so the state's timeline is record order and overlapping requests are not detected."] : [],
					...state.views.some((view) => view.shape === "recorded") ? ["Tools whose recordings do not reproduce from the extracted state are listed as recorded views with the reason; they replay their recordings."] : []
				]);
				if (!limitations.ok) return limitations;
				return ok({
					origin: manifest.value.origin,
					name: manifest.value.name,
					timeline,
					...state,
					unknowns: UNKNOWNS.map((unknown) => ({ ...unknown })),
					coverage: manifest.value.coverage,
					limitations: this.sortedLimitations()
				});
			}
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentStateView.js
var environmentStateViewRequestSchema, jsonObjectFieldsSchema, queryParameterSchema, listQuerySchema, checkedSchema, clockFormatSchema, perResponseSchema, entityViewFields, replayedReadFields, viewSchema, ordinalSchema$1, ruled, fieldRuleSchema, insertRuleSchema, writePlanSchema, environmentStateFields, createEnvironmentStateAccumulator, projectEnvironmentStateView;
function init_environmentStateView() {
	return (init_environmentStateView = __esmMin((() => {
		init_jsonValue();
		init_result();
		init_EnvironmentStateAccumulator();
		init_environmentStateWriteValues();
		init_environmentStateWriteClockFormats();
		init_environmentManifestView();
		environmentStateViewRequestSchema = z.strictObject({
			kind: z.literal("environment-state"),
			template_rules: templateRulesSchema.describe("Opt-in template rules as for environment-manifest, each listed at most once. Use the rules of the manifest the state accompanies so tool names match.")
		});
		jsonObjectFieldsSchema = z.record(z.string(), jsonValueSchema);
		queryParameterSchema = z.discriminatedUnion("role", [
			z.strictObject({
				role: z.literal("filter"),
				field: z.string().describe("Entities whose field equals the value as text, or whose array field holds it directly or as an object's id, slug or name.")
			}),
			z.strictObject({
				role: z.literal("search"),
				fields: z.array(z.string()).describe("Entities with a string field containing a plain substring value, ignoring case using Unicode simple case folding; an empty value matches every entity. Syntax-like operators replay instead.")
			}),
			z.strictObject({ role: z.literal("sort") }).describe("Orders by the field the value names (`name`, `-name`, `name:desc`, `name-ASC`): numbers by value, text ignoring case, null last ascending."),
			z.strictObject({ role: z.literal("direction") }).describe("asc or desc for the sort parameter."),
			z.strictObject({ role: z.literal("limit") }).describe("Page size; zero or a negative value lists every match."),
			z.strictObject({ role: z.literal("offset") }).describe("Matches skipped before the page."),
			z.strictObject({
				role: z.literal("page"),
				first: z.number().int().describe("The first page, 0 or 1, when recordings distinguish the convention.")
			}),
			z.strictObject({
				role: z.literal("inert"),
				values: z.array(z.string()).describe("Recorded values that change nothing the view lists; other values are not computed.")
			})
		]);
		listQuerySchema = z.strictObject({
			parameters: z.record(z.string(), queryParameterSchema).describe("What each query parameter does. A call whose every parameter has a role is answered by evaluating them over the state."),
			record_ordinals: z.array(z.number().int().nonnegative()).describe("Checked lines the query reproduces, answered by evaluating it."),
			totals: z.array(z.string()).describe("Observed envelope members with reproducible counts of every match before paging, named as counters are; absent or unknown representations stay recorded.")
		});
		checkedSchema = z.array(z.number().int().nonnegative()).describe("Latest init record per request line that the view reproduced from the state.");
		clockFormatSchema = z.discriminatedUnion("kind", [z.strictObject({
			kind: z.literal("iso"),
			separator: z.enum(["T", " "]),
			fraction: z.number().int().nonnegative().max(9),
			zone: z.string().refine(isClockZone),
			trimmed: z.literal(true).exactOptional()
		}), z.strictObject({
			kind: z.literal("epoch"),
			unit: z.enum(["s", "ms"])
		})]);
		perResponseSchema = z.array(z.string()).optional().describe("Top-level members minted per response, such as a request id: a UUID or clock that differed on every repeat of every concrete path the view answers with no write between. Checks leave them out; serving keeps the recorded value, so a served response repeats it.");
		entityViewFields = {
			tool: z.string(),
			type: z.string(),
			pointer: z.string().describe("JSON pointer to the entity object or array within the response: the root or one member, or for an item the element of a one-element array there (/0 or /<member>/0)."),
			fields: z.array(z.string()).describe("Ordered fields the view shows of each entity."),
			required_fields: z.array(z.string()),
			checked_record_ordinals: checkedSchema,
			per_response_members: perResponseSchema,
			clock_formats: z.record(z.string(), clockFormatSchema).optional().describe("How the view spells clock fields it always spells otherwise than the entities' stored values; a stored value the view never recorded is spelled this way."),
			nested_fields: z.record(z.string(), z.array(z.string())).optional().describe("The keys the view shows of object fields it always shows with fewer keys than an entity stores, such as a parent listed without its own nested type; a stored object the view never recorded shows those keys."),
			sorted_arrays: z.array(z.string()).optional().describe("Fields whose string arrays the view lists in code-point order, whatever order they were written in; learned from a read that shows a written array sorted.")
		};
		replayedReadFields = {
			projected_record_ordinals: z.array(z.number().int().nonnegative()).optional().describe("Recorded reads left to replay: they asked for some fields only (`fields`, `select`), or show the entities in another representation than the checked lines (an augmenting or reducing query). Replayed calls do not show served writes."),
			projected_query_keys: z.array(z.strictObject({
				name: z.string(),
				value: z.string().optional(),
				absent: z.literal(true).optional()
			})).optional().describe("Query keys that pick calls of the replayed reads out: a parameter only they name, a value only they give a parameter, or (absent) a parameter every checked line names and they leave out. A call matching any key replays; a projection parameter's value is tested on its own: a call replays unless every value it gives is `*` or one a checked line gave, and no replayed read gave it.")
		};
		viewSchema = z.discriminatedUnion("shape", [
			z.strictObject({
				...entityViewFields,
				shape: z.literal("item"),
				envelope_ordinal: z.number().int().nonnegative().describe("Record whose response, with the entity object replaced, every item response shares."),
				...replayedReadFields
			}),
			z.strictObject({
				...entityViewFields,
				shape: z.literal("list"),
				membership: z.enum(["all", "recorded"]).describe("all: every entity of the collection in state order; recorded: the entities each recorded response listed, except on the lines all_record_ordinals names."),
				all_record_ordinals: z.array(z.number().int().nonnegative()).optional().describe("With recorded membership, the checked lines that each listed every entity of their collection in state order, with only paging parameters starting at zero; a call answered on one lists the whole collection. Absent when none does."),
				counters: z.array(z.string()).describe("Envelope members that count the listed entities: a top-level member's name, or a JSON pointer to one in a top-level object beside the list (`/pageInfo/totalRows`); a top-level name starting with `/` is written as its pointer (`/~1total`)."),
				query: listQuerySchema.optional().describe("How the view's other checked lines select and order entities, when filters, a search, a sort or paging explain them; absent when none does."),
				...replayedReadFields
			}),
			z.strictObject({
				tool: z.string(),
				shape: z.literal("document"),
				checked_record_ordinals: checkedSchema,
				per_response_members: perResponseSchema
			}),
			z.strictObject({
				tool: z.string(),
				shape: z.literal("recorded"),
				reason: z.enum([
					"query-body",
					"no-init-recording",
					"body-unusable",
					"no-identity",
					"path-varies",
					"query-varies",
					"fields-differ",
					"envelope-varies",
					"list-differs",
					"rendered-oversize"
				])
			})
		]);
		ordinalSchema$1 = z.number().int().nonnegative();
		ruled = { field: z.string() };
		fieldRuleSchema = z.discriminatedUnion("rule", [
			z.strictObject({
				...ruled,
				rule: z.literal("identity"),
				generator: z.enum([
					"sequence",
					"uuid",
					"token"
				])
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("sequence"),
				scope: z.enum(["collection", "type"])
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("unique")
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("renewed"),
				pointers: z.array(z.string()).min(1)
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("clock"),
				format: clockFormatSchema
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("nested-clock"),
				members: z.array(z.string()).min(1),
				format: clockFormatSchema
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("held-clock"),
				format: clockFormatSchema
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("echo"),
				sorted: z.literal(true).exactOptional()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("copy"),
				from: z.string()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("path"),
				from: z.string()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("slug"),
				from: z.string()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("template"),
				from: z.string()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("composed"),
				parts: z.array(z.union([
					z.strictObject({ text: z.string().min(1) }),
					z.strictObject({
						from: z.string(),
						as: z.enum(["value", "slug"])
					}),
					z.strictObject({
						from: z.string(),
						as: z.literal("clock"),
						pattern: z.enum(CLOCK_PATTERNS)
					})
				])).min(1)
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("reference"),
				member: z.string(),
				type: z.string(),
				fields: z.array(z.string()).min(1)
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("increment")
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("constant"),
				value: jsonValueSchema
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("stamp"),
				value: jsonValueSchema
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("derived"),
				value: jsonValueSchema,
				from: jsonValueSchema,
				member: z.string()
			}),
			z.strictObject({
				...ruled,
				rule: z.literal("set"),
				value: jsonValueSchema
			})
		]);
		insertRuleSchema = z.union([z.strictObject({ rule: z.enum(["first", "last"]) }), z.strictObject({
			rule: z.literal("sorted"),
			field: z.string(),
			direction: z.enum(["ascending", "descending"])
		})]);
		writePlanSchema = z.strictObject({
			tool: z.string(),
			effect: z.enum([
				"create",
				"update",
				"delete",
				"document",
				"none"
			]),
			target: z.string().nullable().describe("The entity type an entity effect writes, or the document view a document write changes."),
			served: z.boolean(),
			reason: z.enum([
				"no-state-target",
				"no-call",
				"body-unusable",
				"no-observation",
				"unexplained-change",
				"contradicted",
				"side-effect",
				"unconfirmed",
				"incomplete-entities"
			]).nullable(),
			exemplar_ordinal: ordinalSchema$1.nullable().describe("The first successful recorded call the plan was built from."),
			observation: z.strictObject({
				ordinal: ordinalSchema$1,
				pointer: z.string(),
				read: z.strictObject({
					ordinal: ordinalSchema$1,
					pointer: z.string(),
					shape: z.enum(["item", "list"])
				}).exactOptional().describe("A create's later read of the entity: an item read lends fields the response lacks and its clock spellings, a list read only adds fields the response lacks.")
			}).nullable().describe("The record whose response showed the written entity or document, and a JSON pointer to it."),
			response: z.strictObject({
				ordinal: ordinalSchema$1,
				shape: z.enum([
					"entity",
					"identity",
					"empty",
					"recorded"
				]),
				pointer: z.string().nullable()
			}).nullable(),
			body: z.strictObject({
				accepted: z.array(z.string()),
				fixed: z.array(z.strictObject({
					member: z.string(),
					sent: jsonValueSchema
				})),
				required: z.array(z.string()),
				identity: z.string().nullable(),
				kinds: z.array(z.strictObject({
					member: z.string(),
					kind: z.enum([
						"array",
						"boolean",
						"number",
						"object",
						"string"
					])
				})),
				envelope: z.string().optional(),
				defaults: z.array(z.strictObject({
					member: z.string(),
					value: jsonValueSchema
				})).optional()
			}).nullable().describe("Body members the application stored as sent (accepted), members accepted only with their recorded value (fixed), members every call sends (required), the JSON type a later call stored an accepted member as when the observation does not show it (kinds), the member a call wraps its object in as a one-element array (envelope), and the value a create stores for an accepted member a call leaves out, as a call that left it out showed (defaults)."),
			rules: z.array(fieldRuleSchema).describe("How written fields get their values; unlisted fields of a created entity keep the observed value."),
			collection: z.string().nullable().describe("For a create whose recorded values are tied to its collection, the only collection it writes to."),
			insert: insertRuleSchema.nullable(),
			merge: z.enum(["merge", "replace"]).nullable(),
			checked_record_ordinals: z.array(ordinalSchema$1).describe("Later reads that reproduced from the state after this write."),
			contradicted_by: ordinalSchema$1.nullable(),
			address: z.discriminatedUnion("by", [
				z.strictObject({
					by: z.literal("action"),
					segment: z.string()
				}),
				z.strictObject({
					by: z.literal("ids"),
					member: z.string().nullable(),
					kind: z.enum(["number", "string"])
				}),
				z.strictObject({
					by: z.literal("elements"),
					member: z.string().nullable()
				})
			]).optional().describe("How a call names its entities when its path does not end in one: the action segment after the item's id, or the body's ids as an array of one JSON `kind` or as objects carrying the id field, at the root or under `member`.")
		});
		environmentStateFields = {
			origin: z.string().describe("Primary origin, as the environment manifest selects it."),
			name: z.string(),
			timeline: z.enum(["recorded-start-time", "record-order"]).describe("Records are ordered by recorded start time, or by record order when any start time is missing."),
			types: z.array(z.strictObject({
				collection_template: z.string(),
				id_field: z.string(),
				id_basis: z.enum(["path-parameter", "field-name"]).describe("path-parameter: item responses repeat the requested path value in this field; field-name: inferred from listed items as the first identity name, else the first field ending in Id or _id shown distinct across at least two items, that every listed item carries distinctly."),
				init_before_ordinal: z.number().int().nonnegative().nullable().describe("First recorded write whose path root relates to the type; state comes from records that finished before it."),
				volatile_fields: z.array(z.string()).describe("Fields whose recorded values changed with no recorded write between; the state keeps the latest.")
			})),
			entities: z.array(z.strictObject({
				type: z.string(),
				collection: z.string(),
				id: z.string(),
				fields: jsonObjectFieldsSchema,
				view_fields: z.array(z.strictObject({
					tool: z.string(),
					fields: jsonObjectFieldsSchema
				})),
				record_ordinals: z.array(z.number().int().nonnegative())
			})).describe("Entities in collection order: type, collection, then first sighting."),
			documents: z.array(z.strictObject({
				tool: z.string(),
				path: z.string(),
				value: jsonValueSchema,
				record_ordinal: z.number().int().nonnegative()
			})),
			views: z.array(viewSchema),
			writes: z.array(writePlanSchema).describe("One plan per tool whose method may change state: its modelled effect, and whether the capture's later reads confirmed it (served)."),
			write_clock: z.string().nullable().describe("The instant a served clock starts from: the end of the capture's last timed record."),
			unknowns: z.array(z.strictObject({
				kind: z.enum([
					"authorization-model",
					"response-semantics",
					"state-transition"
				]),
				statement: z.string()
			}))
		};
		createEnvironmentStateAccumulator = (view) => new EnvironmentStateAccumulator(undefined, view.template_rules);
		projectEnvironmentStateView = (parent, view, accumulator = createEnvironmentStateAccumulator(view)) => {
			const grouped = groupCaptureRecords(parent, view.kind, view.template_rules, {
				accumulator,
				noun: "state",
				limitations: ["Entity types, identity fields, list membership and counters are inferences from recorded response bodies; the state does not establish server-side schemas, derived values or values copied outside entity objects."]
			});
			if (!grouped.ok) return grouped;
			const state = accumulator.finishState();
			if (!state.ok) return state;
			return ok({
				kind: "environment-state",
				view,
				parent_evidence_id: parent.evidenceId,
				parent_operation: grouped.value.operation,
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: grouped.value.artifact.path,
					sha256: grouped.value.artifact.sha256
				},
				...state.value
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/environmentCoverageView.js
var environmentCoverageViewRequestSchema, WITHHELD_WRITE_HINTS, writeReasons, effectSchema, ordinalSchema, environmentCoverageSchema, environmentCoverageFields, summarizeEnvironmentCoverage, projectEnvironmentCoverageView;
function init_environmentCoverageView() {
	return (init_environmentCoverageView = __esmMin((() => {
		init_result();
		init_environmentManifestView();
		init_environmentStateView();
		environmentCoverageViewRequestSchema = z.strictObject({
			kind: z.literal("environment-coverage"),
			template_rules: templateRulesSchema.describe("Opt-in template rules as for environment-manifest, each listed at most once. Use the rules of the manifest the environment serves so tool names match.")
		});
		WITHHELD_WRITE_HINTS = {
			"no-state-target": "The write's path names no collection or item the capture reads. Read the collection or item it changes.",
			"no-call": "No recorded call of this tool was modelled, for example because every call failed. Record a successful call.",
			"body-unusable": "The retained request or response cannot be modelled. Record a successful call with a complete supported request and reproducible response.",
			"no-observation": "Nothing showed the entity or document this write changed. Read a created entity back by id right after the write; for an update or delete the state must already hold the entity, so read it before the write or record the create that made it.",
			"unexplained-change": "The write changed fields it did not send, in a way no rule explains. A second, different call of the same tool can show the pattern.",
			contradicted: "A later read disagreed with the modelled effect. Check the read at contradicted_by.",
			"side-effect": "The write changed something besides its own entity, which the environment does not model.",
			unconfirmed: "No later read showed the effect. Read the entity and its list after the write.",
			"incomplete-entities": "The write is confirmed, but the views that show its entity cannot render it in full. Read the written entity through every view that lists it."
		};
		writeReasons = Object.keys(WITHHELD_WRITE_HINTS);
		effectSchema = z.enum([
			"create",
			"update",
			"delete",
			"document",
			"none"
		]);
		ordinalSchema = z.number().int().nonnegative();
		environmentCoverageSchema = z.strictObject({
			reads: z.strictObject({
				state: z.number().int().nonnegative().describe("Read tools answered from the state."),
				recorded: z.number().int().nonnegative().describe("Read tools that replay their recordings."),
				recorded_reasons: z.record(z.string(), z.number().int().positive()).describe("Replayed read tools per reason, as the environment-state view names the reasons.")
			}),
			writes: z.strictObject({
				served: z.array(z.strictObject({
					tool: z.string(),
					effect: effectSchema
				})),
				withheld: z.array(z.strictObject({
					tool: z.string(),
					effect: effectSchema,
					reason: z.enum(writeReasons),
					hint: z.string().describe("What to record next; advice that never changes what is served."),
					exemplar_ordinal: ordinalSchema.nullable().describe("The first successful recorded call the plan was built from."),
					contradicted_by: ordinalSchema.nullable().describe("The read that disagreed with the modelled effect.")
				}))
			})
		});
		environmentCoverageFields = {
			origin: environmentStateFields.origin,
			name: environmentStateFields.name,
			...environmentCoverageSchema.shape,
			unknowns: environmentStateFields.unknowns
		};
		summarizeEnvironmentCoverage = (state) => {
			let answered = 0;
			let recorded = 0;
			const reasons = {};
			for (const view of state.views) if (view.shape === "recorded") {
				recorded++;
				reasons[view.reason] = (reasons[view.reason] ?? 0) + 1;
			} else answered++;
			const served = [];
			const withheld = [];
			for (const plan of state.writes) if (plan.served || plan.reason === null) served.push({
				tool: plan.tool,
				effect: plan.effect
			});
			else withheld.push({
				tool: plan.tool,
				effect: plan.effect,
				reason: plan.reason,
				hint: WITHHELD_WRITE_HINTS[plan.reason],
				exemplar_ordinal: plan.exemplar_ordinal,
				contradicted_by: plan.contradicted_by
			});
			return {
				reads: {
					state: answered,
					recorded,
					recorded_reasons: Object.fromEntries(Object.entries(reasons).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0))
				},
				writes: {
					served,
					withheld
				}
			};
		};
		projectEnvironmentCoverageView = (parent, view, accumulator = createEnvironmentStateAccumulator(view)) => {
			const projected = projectEnvironmentStateView(parent, {
				kind: "environment-state",
				template_rules: view.template_rules
			}, accumulator);
			if (!projected.ok) return projected;
			const state = projected.value;
			return ok({
				kind: "environment-coverage",
				view,
				parent_evidence_id: state.parent_evidence_id,
				parent_operation: state.parent_operation,
				parent_digest: state.parent_digest,
				artifact: state.artifact,
				coverage: state.coverage,
				limitations: [
					...state.limitations,
					"Coverage summarizes the environment-state view an environment derives at startup; it does not run the environment. An environment whose served catalog exceeds the discovery budget, or whose state exceeds what data/add loads, serves replay instead, which this view does not check. Hints are advice about what to record next.",
					...state.timeline === "record-order" ? ["Not every record carries a start time, so the state learns no clock: a write whose response changes a timestamp the server sets, such as a modification time, is withheld as unexplained-change however often it is recorded."] : []
				],
				unknowns: state.unknowns,
				origin: state.origin,
				name: state.name,
				...summarizeEnvironmentCoverage(state)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/pcap/pcapAnalysis.js
var pcapCaptureHostSupported, PCAP_CAPTURE_UNSUPPORTED_HOST_REASON, pcapInputSchemas, pcapRequestSchema, client, legacyClientIdentity, endpoint, dnsQuery, protocolCount, pcapResultSchemas, pcapEvidenceSchemas;
function init_pcapAnalysis() {
	return (init_pcapAnalysis = __esmMin((() => {
		init_localPath();
		init_digests();
		pcapCaptureHostSupported = (platform) => platform === "linux" || platform === "win32";
		PCAP_CAPTURE_UNSUPPORTED_HOST_REASON = "Packet summaries require an enforceable native memory bound: Linux with util-linux prlimit, or Windows with owned Job Objects. This host's capture boundary remains unsupported.";
		pcapInputSchemas = {
			inspect_pcap_client: z.strictObject({}),
			inspect_pcap_capture: z.strictObject({ path: localPathStringSchema.describe("Local pcap or pcapng capture file to inspect") })
		};
		pcapRequestSchema = z.discriminatedUnion("operation", [z.strictObject({
			operation: z.literal("inspect_pcap_client"),
			input: pcapInputSchemas.inspect_pcap_client
		}), z.strictObject({
			operation: z.literal("inspect_pcap_capture"),
			input: pcapInputSchemas.inspect_pcap_capture
		})]);
		client = z.strictObject({
			tshark_command: z.string().min(1),
			tshark_source: z.enum(["environment", "path"]),
			tshark_version: z.string().min(1).nullable(),
			tshark_resolved_path: localPathStringSchema.nullable(),
			tshark_sha256: digestSchema.nullable(),
			tshark_identity_status: z.enum(["verified", "unresolved"]),
			capinfos_command: z.string().min(1),
			capinfos_source: z.enum(["environment", "path"]),
			capinfos_version: z.string().min(1).nullable(),
			capinfos_resolved_path: localPathStringSchema.nullable(),
			capinfos_sha256: digestSchema.nullable(),
			capinfos_identity_status: z.enum(["verified", "unresolved"])
		});
		legacyClientIdentity = client.extend({
			tshark_resolved_path: localPathStringSchema.nullable().default(null),
			tshark_sha256: digestSchema.nullable().default(null),
			tshark_identity_status: z.enum(["verified", "unresolved"]).default("unresolved"),
			capinfos_resolved_path: localPathStringSchema.nullable().default(null),
			capinfos_sha256: digestSchema.nullable().default(null),
			capinfos_identity_status: z.enum(["verified", "unresolved"]).default("unresolved")
		});
		endpoint = z.strictObject({
			address: z.string().min(1),
			port: z.int().positive().nullable(),
			packet_count: z.int().positive()
		});
		dnsQuery = z.strictObject({
			query: z.string().min(1),
			response_addresses: z.array(z.string().min(1)),
			response_address_count: z.int().nonnegative()
		});
		protocolCount = z.strictObject({
			protocol: z.string().min(1),
			packet_count: z.int().positive()
		});
		pcapResultSchemas = {
			inspect_pcap_client: z.strictObject({ client }),
			inspect_pcap_capture: z.strictObject({
				client,
				target: z.strictObject({
					path: localPathStringSchema,
					bytes: z.int().nonnegative(),
					sha256: digestSchema
				}),
				/** File format as capinfos reports it (pcap vs pcapng). */
				file_type: z.string().min(1).nullable(),
				encapsulation: z.string().min(1).nullable(),
				packet_count: z.int().nonnegative().nullable(),
				capture_start: z.string().nullable(),
				capture_end: z.string().nullable(),
				capture_duration_seconds: z.number().nonnegative().nullable(),
				snapshot_length: z.int().positive().nullable(),
				/** Distinct endpoints with packet counts, bounded. */
				endpoints: z.array(endpoint),
				endpoint_count: z.int().nonnegative(),
				/** DNS queries with resolved addresses, bounded. */
				dns_queries: z.array(dnsQuery),
				dns_query_count: z.int().nonnegative(),
				/** TLS Server Name Indication values observed in handshakes. */
				tls_sni_values: z.array(z.string().min(1)),
				tls_sni_count: z.int().nonnegative(),
				/** Protocol distribution (frame.protocols column counts). */
				protocol_distribution: z.array(protocolCount),
				protocol_count: z.int().nonnegative(),
				/** HTTP request URIs seen on plain-text ports, bounded. */
				http_request_uris: z.array(z.string().min(1)),
				http_request_uri_count: z.int().nonnegative(),
				http_uri_redaction_count: z.int().nonnegative(),
				unattributed_dns_addresses: z.array(z.string().min(1)),
				unattributed_dns_address_count: z.int().nonnegative(),
				unattributed_dns_packet_count: z.int().nonnegative(),
				coverage: z.enum(["complete", "partial"]),
				diagnostics: z.strictObject({
					capinfos_stderr: z.string(),
					tshark_stderr: z.string()
				}).optional()
			})
		};
		pcapEvidenceSchemas = { inspect_pcap_capture: pcapResultSchemas.inspect_pcap_capture.extend({ client: legacyClientIdentity }) };
	})))();
}

//#endregion
//#region dist/domain/analysisView/pcapCaptureView.js
var captureSchema, fields, pageShape, pcapViewRequestSchema, pcapViewPageSchema, pcapSummarySchema, parseParent, summarize, selectRows, projectPcapCaptureView;
function init_pcapCaptureView() {
	return (init_pcapCaptureView = __esmMin((() => {
		init_analysisViewErrors();
		init_pcapAnalysis();
		init_analysisViewParent();
		init_result();
		init_analysisViewCoverage();
		init_analysisViewText();
		captureSchema = pcapEvidenceSchemas.inspect_pcap_capture;
		fields = captureSchema.shape;
		pageShape = {
			kind: z.literal("pcap"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		};
		pcapViewRequestSchema = z.discriminatedUnion("facet", [
			z.strictObject({
				...pageShape,
				facet: z.enum([
					"endpoints",
					"dns-queries",
					"tls-sni",
					"protocols",
					"http-uris",
					"unattributed-addresses"
				])
			}),
			z.strictObject({
				...pageShape,
				facet: z.literal("dns-addresses"),
				query: z.string().min(1)
			}),
			z.strictObject({
				...pageShape,
				facet: z.literal("diagnostics"),
				stream: z.enum(["tshark", "capinfos"])
			})
		]);
		pcapViewPageSchema = z.discriminatedUnion("facet", [
			z.strictObject({
				facet: z.literal("endpoints"),
				items: fields.endpoints
			}),
			z.strictObject({
				facet: z.literal("dns-queries"),
				items: z.array(fields.dns_queries.element.omit({ response_addresses: true }).extend({ retained_response_address_count: z.int().nonnegative() }))
			}),
			z.strictObject({
				facet: z.literal("tls-sni"),
				items: fields.tls_sni_values
			}),
			z.strictObject({
				facet: z.literal("protocols"),
				items: fields.protocol_distribution
			}),
			z.strictObject({
				facet: z.literal("http-uris"),
				items: fields.http_request_uris
			}),
			z.strictObject({
				facet: z.literal("unattributed-addresses"),
				items: fields.unattributed_dns_addresses
			}),
			z.strictObject({
				facet: z.literal("dns-addresses"),
				items: fields.unattributed_dns_addresses
			}),
			z.strictObject({
				facet: z.literal("diagnostics"),
				text: z.string(),
				status: z.enum(["retained", "unknown"])
			})
		]);
		pcapSummarySchema = captureSchema.omit({
			endpoints: true,
			dns_queries: true,
			tls_sni_values: true,
			protocol_distribution: true,
			http_request_uris: true,
			unattributed_dns_addresses: true,
			diagnostics: true
		}).extend({
			retained_counts: z.strictObject({
				endpoints: z.int().nonnegative(),
				dns_queries: z.int().nonnegative(),
				tls_sni_values: z.int().nonnegative(),
				protocol_distribution: z.int().nonnegative(),
				http_request_uris: z.int().nonnegative(),
				unattributed_dns_addresses: z.int().nonnegative()
			}),
			diagnostics_code_units: z.strictObject({
				tshark: z.int().nonnegative(),
				capinfos: z.int().nonnegative()
			}).nullable()
		});
		parseParent = (parent) => {
			const parsed = parseAnalysisViewResult(captureSchema, parent);
			if (!parsed.ok) return parsed;
			if (parent.subject?.local_path !== parsed.value.target.path || parent.subject.digest.sha256 !== parsed.value.target.sha256) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Packet parent subject must identify the report's exact path and SHA-256."
			}]));
			return ok(parsed.value);
		};
		summarize = ({ endpoints, dns_queries, tls_sni_values, protocol_distribution, http_request_uris, unattributed_dns_addresses, diagnostics, ...metadata }) => ({
			...metadata,
			retained_counts: {
				endpoints: endpoints.length,
				dns_queries: dns_queries.length,
				tls_sni_values: tls_sni_values.length,
				protocol_distribution: protocol_distribution.length,
				http_request_uris: http_request_uris.length,
				unattributed_dns_addresses: unattributed_dns_addresses.length
			},
			diagnostics_code_units: diagnostics === undefined ? null : {
				tshark: diagnostics.tshark_stderr.length,
				capinfos: diagnostics.capinfos_stderr.length
			}
		});
		selectRows = (capture, view) => {
			const slice = (items) => items.slice(view.offset, view.offset + view.limit);
			switch (view.facet) {
				case "endpoints": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.endpoints)
					},
					total: capture.endpoints.length
				});
				case "dns-queries": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.dns_queries).map(({ response_addresses, ...query }) => ({
							...query,
							retained_response_address_count: response_addresses.length
						}))
					},
					total: capture.dns_queries.length
				});
				case "tls-sni": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.tls_sni_values)
					},
					total: capture.tls_sni_values.length
				});
				case "protocols": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.protocol_distribution)
					},
					total: capture.protocol_distribution.length
				});
				case "http-uris": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.http_request_uris)
					},
					total: capture.http_request_uris.length
				});
				case "unattributed-addresses": return ok({
					page: {
						facet: view.facet,
						items: slice(capture.unattributed_dns_addresses)
					},
					total: capture.unattributed_dns_addresses.length
				});
				case "dns-addresses": {
					const matches = capture.dns_queries.filter((query) => query.query === view.query);
					if (matches.length !== 1) return err(analysisViewInputError([{
						path: ["view", "query"],
						reason: "invalid_value",
						message: "Select one unambiguous exact retained DNS question."
					}]));
					return ok({
						page: {
							facet: view.facet,
							items: slice(matches[0].response_addresses)
						},
						total: matches[0].response_addresses.length
					});
				}
			}
		};
		projectPcapCaptureView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "pcap") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Packet summary parents support summary and pcap fact pages."
			}]));
			const parsed = parseParent(parent);
			if (!parsed.ok) return parsed;
			const capture = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_pcap_capture",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: capture.target.path,
					sha256: capture.target.sha256
				},
				limitations: [...parent.limitations, "Page totals count retained rows or UTF-16 diagnostic code units. Exhaustion does not prove whole-network completeness; source coverage and examined counts remain separate."],
				unknowns: ["Saved packet observations do not establish process identity, causality, encrypted payload contents or traffic missing from the recording."]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: summarize(capture),
				coverage: completeWithinViewCoverage(1, 1)
			});
			if (view.facet === "diagnostics") {
				const value = view.stream === "tshark" ? capture.diagnostics?.tshark_stderr : capture.diagnostics?.capinfos_stderr;
				const text = analysisTextPage(value ?? "", view.offset, view.limit, "Diagnostics");
				if (!text.ok) return text;
				return ok({
					kind: "pcap",
					view,
					...shared,
					source_coverage: capture.coverage,
					page: {
						facet: "diagnostics",
						text: text.value.item.text,
						status: value === undefined ? "unknown" : "retained"
					},
					coverage: text.value.coverage,
					unknowns: value === undefined ? [...shared.unknowns, "The parent did not retain diagnostics; an empty text page does not establish their absence."] : shared.unknowns
				});
			}
			const selected = selectRows(capture, view);
			return selected.ok ? ok({
				kind: "pcap",
				view,
				...shared,
				source_coverage: capture.coverage,
				page: selected.value.page,
				coverage: pageViewCoverage(view.offset, selected.value.page.items.length, selected.value.total)
			}) : selected;
		};
	})))();
}

//#endregion
//#region dist/domain/android/androidAnalysis.js
var target, classTarget, androidInputSchemas, androidPackageInspectionInputSchema, androidRequestSchema, textCoverage, manifestComponent, manifestComponents, dexDescriptorSchema, integral, LONG_MIN, LONG_MAX, floating, dexStaticValueSchema, method, engine, common, androidResultSchemas;
function init_androidAnalysis() {
	return (init_androidAnalysis = __esmMin((() => {
		init_localPath();
		target = { path: localPathStringSchema.describe("Local APK path; the target is never executed") };
		classTarget = {
			...target,
			class_name: z.string().min(1).describe("Exact fully qualified class name")
		};
		androidInputSchemas = {
			inspect_android_package: z.strictObject(target),
			search_android_classes: z.strictObject({
				...target,
				query: z.string().describe("Case-sensitive class-name substring; empty lists all classes")
			}),
			inspect_android_class: z.strictObject(classTarget),
			inspect_android_method: z.strictObject({
				...classTarget,
				method_name: z.string().min(1),
				overload_index: z.int().nonnegative().optional().describe("Explicit index among same-name methods; required when ambiguous")
			}),
			trace_android_references: z.strictObject({
				...classTarget,
				method_name: z.string().min(1).optional().describe("Omit for class references; select ambiguous methods with overload_index"),
				overload_index: z.int().nonnegative().optional().describe("Index among same-name methods from inspect_android_class; requires method_name")
			})
		};
		androidPackageInspectionInputSchema = androidInputSchemas.inspect_android_package.extend({ detail: z.enum(["complete", "summary"]).optional() });
		androidRequestSchema = z.discriminatedUnion("operation", [
			z.strictObject({
				operation: z.literal("inspect_android_package"),
				input: androidInputSchemas.inspect_android_package
			}),
			z.strictObject({
				operation: z.literal("search_android_classes"),
				input: androidInputSchemas.search_android_classes
			}),
			z.strictObject({
				operation: z.literal("inspect_android_class"),
				input: androidInputSchemas.inspect_android_class
			}),
			z.strictObject({
				operation: z.literal("inspect_android_method"),
				input: androidInputSchemas.inspect_android_method
			}),
			z.strictObject({
				operation: z.literal("trace_android_references"),
				input: androidInputSchemas.trace_android_references
			})
		]);
		textCoverage = z.strictObject({
			status: z.enum(["complete", "partial"]),
			text: z.string(),
			reported_total_bytes: z.int().nonnegative().nullable()
		});
		manifestComponent = z.strictObject({
			kind: z.enum([
				"activity",
				"activity-alias",
				"service",
				"receiver",
				"provider"
			]),
			declared_name: z.string(),
			name: z.string(),
			exported: z.boolean().nullable(),
			exported_default: z.boolean().nullable(),
			permission: z.string().nullable(),
			permission_source: z.enum([
				"component",
				"application",
				"none",
				"unknown"
			]),
			intent_filter_count: z.number().int().nonnegative(),
			actions: z.array(z.string()),
			categories: z.array(z.string()),
			foreground_service_type: z.string().nullable(),
			authorities: z.array(z.string()).nullable(),
			target_activity: z.string().nullable()
		});
		manifestComponents = z.strictObject({
			status: z.enum([
				"complete",
				"partial",
				"unavailable"
			]),
			items: z.array(manifestComponent),
			limitations: z.array(z.string())
		});
		dexDescriptorSchema = z.string().regex(/^\((?:\[*(?:[ZBSCIJFD]|L[^;\x28\x29]+;))*\)(?:V|\[*(?:[ZBSCIJFD]|L[^;\x28\x29]+;))$/u);
		integral = (type, min, max) => z.strictObject({
			type: z.literal(type),
			value: z.int().min(min).max(max)
		});
		LONG_MIN = -(2n ** 63n);
		LONG_MAX = 2n ** 63n - 1n;
		floating = (type, round) => z.strictObject({
			type: z.literal(type),
			value: z.string().regex(/^(?:NaN|-?Infinity|-?\d+\.\d+(?:E-?\d+)?)$/u).refine((text) => {
				if (/^(?:NaN|-?Infinity)$/u.test(text)) return true;
				const rounded = round(Number(text));
				return Number.isFinite(rounded) && (rounded !== 0 || /^-?0\.0+(?:E-?\d+)?$/u.test(text));
			})
		});
		dexStaticValueSchema = z.discriminatedUnion("type", [
			z.strictObject({
				type: z.literal("boolean"),
				value: z.boolean()
			}),
			integral("byte", -128, 127),
			integral("short", -32768, 32767),
			integral("char", 0, 65535),
			integral("int", -2147483648, 2147483647),
			z.strictObject({
				type: z.literal("long"),
				value: z.string().regex(/^(?:0|-?[1-9]\d*)$/u).refine((text) => BigInt(text) >= LONG_MIN && BigInt(text) <= LONG_MAX)
			}),
			floating("float", Math.fround),
			floating("double", (value) => value),
			z.strictObject({
				type: z.literal("string"),
				value: z.string()
			})
		]);
		method = z.strictObject({
			name: z.string(),
			reported_signature: z.string(),
			overload_index: z.int().nonnegative(),
			is_constructor: z.boolean(),
			dex_descriptor: dexDescriptorSchema
		});
		engine = z.strictObject({
			name: z.string().min(1),
			version: z.string().nullable(),
			artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			source_revision: z.string().nullable(),
			worker_count: z.int().positive(),
			heap_limit_mib: z.int().positive().nullable()
		});
		common = { engine };
		androidResultSchemas = {
			inspect_android_package: z.strictObject({
				...common,
				package_name: z.string().nullable(),
				version_name: z.string().nullable(),
				version_code: z.string().nullable(),
				min_sdk: z.string().nullable(),
				target_sdk: z.string().nullable(),
				permissions: z.array(z.string()),
				manifest: textCoverage,
				components: manifestComponents.default(() => ({
					status: "unavailable",
					items: [],
					limitations: ["This Evidence predates the manifest component projection; run inspect_android_package again to obtain it."]
				})),
				class_count: z.int().nonnegative(),
				resource_count: z.int().nonnegative(),
				signature_verification: z.literal("not_performed")
			}),
			search_android_classes: z.strictObject({
				...common,
				query: z.string(),
				total_classes: z.int().nonnegative(),
				matches: z.array(z.string()),
				duplicate_names: z.array(z.strictObject({
					name: z.string(),
					occurrences: z.int().min(2)
				})),
				coverage: z.literal("complete")
			}),
			inspect_android_class: z.strictObject({
				...common,
				class_name: z.string(),
				methods: z.array(method),
				fields: z.array(z.strictObject({
					name: z.string(),
					reported_type: z.string(),
					/** Null unless a static final field encodes a supported non-null value; initializers are not applied. */
					dex_static_value: dexStaticValueSchema.nullable()
				})),
				inner_classes: z.array(z.string())
			}),
			inspect_android_method: z.strictObject({
				...common,
				class_name: z.string(),
				method,
				overload_count: z.int().positive(),
				representation: z.enum(["java", "smali"]),
				body_status: z.enum(["available", "not_available"]),
				fell_back: z.boolean(),
				markers: z.array(z.string()),
				source: textCoverage
			}),
			trace_android_references: z.strictObject({
				...common,
				class_name: z.string(),
				method_name: z.string().nullable(),
				overload_index: z.int().nonnegative().nullable(),
				reported_signature: z.string().nullable(),
				dex_descriptor: dexDescriptorSchema.nullable(),
				total: z.int().nonnegative(),
				references: z.array(z.strictObject({
					kind: z.string(),
					name: z.string(),
					reported_full_name: z.string(),
					containing_class: z.string(),
					top_class: z.string(),
					source_line: z.null(),
					dex_offset: z.null(),
					/** false means transport-bounded instruction evidence; null is unknown. */
					direct_invokes_exhaustive: z.boolean().nullable(),
					/** Raw direct invoke instructions inside this using node, when available. */
					direct_invokes: z.array(z.strictObject({
						dex_entry: z.string().min(1),
						source_raw_method_id: z.string().min(1),
						dex_code_unit_offset: z.int().nonnegative(),
						dex_method_index: z.int().nonnegative(),
						opcode: z.string().regex(/^INVOKE_/u)
					})).nullable()
				})),
				coverage: z.literal("complete"),
				reference_unit: z.literal("using_node")
			})
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/androidPackageView.js
var packageSchema, androidPackageSummarySchema, androidViewRequestSchema, androidManifestViewItemSchema, projectAndroidPackageView;
function init_androidPackageView() {
	return (init_androidPackageView = __esmMin((() => {
		init_analysisViewErrors();
		init_androidAnalysis();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		init_analysisViewText();
		packageSchema = androidResultSchemas.inspect_android_package;
		androidPackageSummarySchema = packageSchema.extend({ manifest: packageSchema.shape.manifest.omit({ text: true }).extend({
			text_code_units: z.int().nonnegative(),
			text_included: z.literal(false)
		}) });
		androidViewRequestSchema = z.strictObject({
			kind: z.literal("android"),
			facet: z.literal("manifest"),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive()
		});
		androidManifestViewItemSchema = z.strictObject({
			text: z.string(),
			unit: z.literal("utf16-code-units"),
			source_status: packageSchema.shape.manifest.shape.status,
			reported_total_bytes: packageSchema.shape.manifest.shape.reported_total_bytes
		});
		projectAndroidPackageView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "android") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Android package Evidence supports summary and manifest views."
			}]));
			const parsed = parseAnalysisViewResult(packageSchema, parent);
			if (!parsed.ok) return parsed;
			if (parent.subject == null) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "Android package views require the recorded APK subject identity."
			}]));
			const report = parsed.value;
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_android_package",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: parent.subject.local_path,
					sha256: parent.subject.digest.sha256
				},
				limitations: [...parent.limitations],
				unknowns: ["APK signatures were not verified; package declarations do not establish authenticity or runtime behavior.", ...report.manifest.status === "partial" ? ["The decoded manifest is partial; exhausting retained text does not establish complete manifest coverage."] : []]
			};
			if (view.kind === "summary") {
				const { text, ...manifest } = report.manifest;
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						...report,
						manifest: {
							...manifest,
							text_code_units: text.length,
							text_included: false
						}
					},
					coverage: completeWithinViewCoverage(1, 1)
				});
			}
			const page = analysisTextPage(report.manifest.text, view.offset, view.limit, "Manifest");
			if (!page.ok) return page;
			return ok({
				kind: "android",
				view,
				...shared,
				item: {
					...page.value.item,
					source_status: report.manifest.status,
					reported_total_bytes: report.manifest.reported_total_bytes
				},
				coverage: page.value.coverage
			});
		};
	})))();
}

//#endregion
//#region dist/domain/flutter/flutterBuildAnalysis.js
var MAX_FLUTTER_LIBRARY_PATH_BYTES, MAX_FLUTTER_BUILD_ID_BYTES, gnuBuildIdSchema, ABI_SELECTOR_MAX_CHARACTERS, ABI_SELECTOR_MESSAGE, abiSelectorSchema, flutterInputSchemas, dartAotInspectionInputSchema, flutterRequestSchema, flutterResultSchemas;
function init_flutterBuildAnalysis() {
	return (init_flutterBuildAnalysis = __esmMin((() => {
		init_localPath();
		init_digests();
		MAX_FLUTTER_LIBRARY_PATH_BYTES = 1024;
		MAX_FLUTTER_BUILD_ID_BYTES = 64;
		gnuBuildIdSchema = z.string().min(2).max(64 * 2).regex(/^(?:[0-9a-f]{2})+$/u);
		ABI_SELECTOR_MAX_CHARACTERS = MAX_FLUTTER_LIBRARY_PATH_BYTES - "lib/".length - "/libapp.so".length;
		ABI_SELECTOR_MESSAGE = `ABI must be the exact lib/ directory label: 1–${String(ABI_SELECTOR_MAX_CHARACTERS)} Unicode characters without '/'.`;
		abiSelectorSchema = z.string().min(1, ABI_SELECTOR_MESSAGE).refine((label) => {
			const characters = label[Symbol.iterator]();
			for (let count = 0; count <= ABI_SELECTOR_MAX_CHARACTERS; count += 1) if (characters.next().done) return true;
			return false;
		}, {
			message: ABI_SELECTOR_MESSAGE,
			abort: true
		}).regex(/^[^\x2f]*$/u, ABI_SELECTOR_MESSAGE).meta({ maxLength: ABI_SELECTOR_MAX_CHARACTERS });
		flutterInputSchemas = {
			identify_flutter_build: z.strictObject({ path: localPathStringSchema.describe("Local APK file to inspect") }),
			inspect_dart_aot: z.strictObject({
				path: localPathStringSchema.describe("Local APK file carrying a Flutter AOT payload"),
				abi: abiSelectorSchema.optional().describe("Exact lib/ directory label reported by identify_flutter_build; defaults to arm64-v8a, x86_64, x86, armeabi-v7a, then remaining ABIs alphabetically")
			})
		};
		dartAotInspectionInputSchema = flutterInputSchemas.inspect_dart_aot.extend({ detail: z.enum(["complete", "summary"]).optional() });
		flutterRequestSchema = z.discriminatedUnion("operation", [z.strictObject({
			operation: z.literal("identify_flutter_build"),
			input: flutterInputSchemas.identify_flutter_build
		}), z.strictObject({
			operation: z.literal("inspect_dart_aot"),
			input: flutterInputSchemas.inspect_dart_aot
		})]);
		flutterResultSchemas = {
			identify_flutter_build: z.strictObject({
				target: z.strictObject({
					path: localPathStringSchema,
					bytes: z.int().nonnegative(),
					sha256: digestSchema
				}),
				flutter_detected: z.boolean(),
				abis: z.array(z.strictObject({
					abi: z.string().min(1),
					libapp: z.strictObject({
						present: z.boolean(),
						bytes: z.int().nonnegative().nullable(),
						sha256: digestSchema.nullable(),
						/** Supported ELF header with table extents inside the library; table contents are not validated. */
						elf_header_valid: z.boolean().nullable(),
						/** Number of Dart snapshot sections found (vm + isolate). */
						snapshot_hash_sources: z.int().nonnegative(),
						/** Distinct hashes found; more than one means the sections disagree. */
						snapshot_hash_candidates: z.array(z.string().regex(/^[0-9a-f]{32}$/u)),
						/** The single hash when every snapshot section agrees. */
						snapshot_hash: z.string().regex(/^[0-9a-f]{32}$/u).nullable()
					}),
					libflutter: z.strictObject({
						present: z.boolean(),
						bytes: z.int().nonnegative().nullable(),
						sha256: digestSchema.nullable(),
						build_id: gnuBuildIdSchema.nullable().describe("The single GNU build ID when ELF note coverage is complete and unambiguous"),
						build_id_candidates: z.array(gnuBuildIdSchema).max(64).describe("Distinct GNU build IDs observed in ELF-owned note ranges; conflicting IDs remain explicit"),
						dart_version: z.string().nullable().describe("Labeled 'Dart VM version' string, when a build carries one"),
						toolchain_lines: z.array(z.string().min(1)),
						/** Dart labels omitted by grammar or single-version projection bounds. */
						dart_version_capped: z.boolean(),
						/** Toolchain labels omitted by grammar or projection bounds. */
						toolchain_capped: z.boolean()
					})
				})),
				coverage: z.enum(["complete", "partial"])
			}),
			inspect_dart_aot: z.strictObject({
				target: z.strictObject({
					path: localPathStringSchema,
					bytes: z.int().nonnegative(),
					sha256: digestSchema
				}),
				abi: z.string().min(1),
				libapp: z.strictObject({
					coverage: z.enum(["complete", "partial"]).describe("Coverage of ELF symbols, independent data headers, AOT kind, extents and agreeing hashes"),
					bytes: z.int().nonnegative(),
					sha256: digestSchema,
					snapshot_hash: z.string().regex(/^[0-9a-f]{32}$/u).nullable(),
					/** Distinct hashes found; more than one means the sections disagree. */
					snapshot_hash_candidates: z.array(z.string().regex(/^[0-9a-f]{32}$/u)),
					/** Distinct exported data headers with a valid hash at the header's fixed offset. */
					snapshot_hash_sources: z.int().nonnegative(),
					/** Snapshot symbols read from the dynamic symbol table. */
					sections: z.array(z.strictObject({
						name: z.string().min(1),
						offset: z.int().nonnegative(),
						size: z.int().nonnegative(),
						magic_valid: z.boolean(),
						kind: z.int().nonnegative().nullable(),
						/** Raw declared snapshot length, excluding the four magic bytes. */
						header_length: z.int().nonnegative().nullable()
					}))
				}),
				string_pool: z.strictObject({
					coverage: z.enum(["complete", "partial"]).describe("Coverage of the bounded printable-run projection; independent of snapshot header validity"),
					/** Distinct package: source URIs, sorted, bounded. */
					package_uris: z.array(z.string().min(1)),
					package_uri_count_at_least: z.int().nonnegative(),
					/** Distinct dart: SDK URIs, sorted, bounded. */
					dart_uris: z.array(z.string().min(1)),
					dart_uri_count_at_least: z.int().nonnegative(),
					/** Identifier-like tokens, bounded; includes incidental matches. */
					class_like_tokens: z.array(z.string().min(1)),
					class_like_token_count_at_least: z.int().nonnegative(),
					printable_run_count: z.int().nonnegative()
				}),
				coverage: z.enum(["complete", "partial"])
			})
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/dartAotView.js
var aotSchema, dartAotSummarySchema, dartAotViewRequestSchema, dartAotViewContextSchema, projectDartAotView;
function init_dartAotView() {
	return (init_dartAotView = __esmMin((() => {
		init_analysisViewErrors();
		init_flutterBuildAnalysis();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		aotSchema = flutterResultSchemas.inspect_dart_aot;
		dartAotSummarySchema = aotSchema.extend({ string_pool: aotSchema.shape.string_pool.omit({
			package_uris: true,
			dart_uris: true,
			class_like_tokens: true
		}).extend({ returned_counts: z.strictObject({
			package_uris: z.int().nonnegative(),
			dart_uris: z.int().nonnegative(),
			class_like_tokens: z.int().nonnegative()
		}) }) });
		dartAotViewRequestSchema = z.strictObject({
			kind: z.literal("dart-aot"),
			collection: z.enum([
				"package_uris",
				"dart_uris",
				"class_like_tokens"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		dartAotViewContextSchema = z.strictObject({
			abi: aotSchema.shape.abi,
			libapp: aotSchema.shape.libapp,
			source_coverage: aotSchema.shape.coverage,
			string_pool: dartAotSummarySchema.shape.string_pool
		});
		projectDartAotView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "dart-aot") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "Dart AOT Evidence supports summary and string-pool pages."
			}]));
			const parsed = parseAnalysisViewResult(aotSchema, parent);
			if (!parsed.ok) return parsed;
			const report = parsed.value;
			const { package_uris, dart_uris, class_like_tokens, ...pool } = report.string_pool;
			const string_pool = {
				...pool,
				returned_counts: {
					package_uris: package_uris.length,
					dart_uris: dart_uris.length,
					class_like_tokens: class_like_tokens.length
				}
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_dart_aot",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.target.path,
					sha256: report.target.sha256
				},
				limitations: [...parent.limitations],
				unknowns: [
					"String-pool entries are byte-pattern observations, not recovered typed classes or functions.",
					"Counts ending in _at_least remain lower bounds; exhausting returned strings does not establish a complete snapshot inventory.",
					...parent.subject == null ? ["The parent has no recorded subject; its normalized target identity cannot be cross-checked against a subject digest."] : []
				]
			};
			if (view.kind === "summary") return ok({
				kind: "summary",
				view,
				...shared,
				summary: {
					...report,
					string_pool
				},
				coverage: completeWithinViewCoverage(1, 1)
			});
			const collection = report.string_pool[view.collection];
			const items = collection.slice(view.offset, view.offset + view.limit);
			return ok({
				kind: "dart-aot",
				view,
				...shared,
				items,
				abi: report.abi,
				libapp: report.libapp,
				source_coverage: report.coverage,
				string_pool,
				coverage: pageViewCoverage(view.offset, items.length, collection.length)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/il2cpp/il2cppMetadata.js
var IL2CPP_METADATA_MAGIC, IL2CPP_METADATA_SECTION_NAMES, IL2CPP_METADATA_V27_SECTION_NAMES, IL2CPP_METADATA_V24_SECTION_NAMES, IL2CPP_METADATA_VERSIONS, il2cppMetadataSectionNames, count, optionalIndex, indexWidth, inspectIl2cppMetadataInputSchema, il2cppMetadataSectionSchema, il2cppMetadataImageSchema, il2cppMetadataTypeSchema, il2cppMetadataMethodSchema, il2cppMetadataMemberSchema, il2cppMetadataParameterSchema, il2cppMetadataStringLiteralSchema, addressPattern, il2cppAddressSchema, IL2CPP_METHOD_ADDRESS_STATES, il2cppMethodAddressSchema, il2cppTypeReferenceSchema, il2cppCodeGenModuleSchema, il2cppGenericMethodIssueSchema, il2cppGenericMethodLinkSchema, il2cppGenericMethodInstanceSchema, il2cppBinaryLinkSchema, il2cppMetadataObjectSchema, il2cppMetadataMemberCollections, il2cppMetadataBinaryCollections, il2cppMetadataParentObjectSchema, codeRowContradicts, validateMetadataFacts, il2cppMetadataSchema, il2cppMetadataParentSchema;
function init_il2cppMetadata() {
	return (init_il2cppMetadata = __esmMin((() => {
		init_digests();
		init_localPath();
		init_stringPatterns();
		IL2CPP_METADATA_MAGIC = 4205910959;
		IL2CPP_METADATA_SECTION_NAMES = [
			"stringLiterals",
			"stringLiteralData",
			"strings",
			"events",
			"properties",
			"methods",
			"parameterDefaultValues",
			"fieldDefaultValues",
			"fieldAndParameterDefaultValueData",
			"fieldMarshaledSizes",
			"parameters",
			"fields",
			"genericParameters",
			"genericParameterConstraints",
			"genericContainers",
			"nestedTypes",
			"interfaces",
			"vtableMethods",
			"interfaceOffsets",
			"typeDefinitions",
			"images",
			"assemblies",
			"fieldRefs",
			"referencedAssemblies",
			"attributeData",
			"attributeDataRanges",
			"unresolvedIndirectCallParameterTypes",
			"unresolvedIndirectCallParameterRanges",
			"windowsRuntimeTypeNames",
			"windowsRuntimeStrings",
			"exportedTypeDefinitions"
		];
		IL2CPP_METADATA_V27_SECTION_NAMES = [
			...IL2CPP_METADATA_SECTION_NAMES.slice(0, 24),
			"attributesInfo",
			"attributeTypes",
			"unresolvedVirtualCallParameterTypes",
			"unresolvedVirtualCallParameterRanges",
			...IL2CPP_METADATA_SECTION_NAMES.slice(28)
		];
		IL2CPP_METADATA_V24_SECTION_NAMES = [
			...IL2CPP_METADATA_SECTION_NAMES.slice(0, 22),
			"metadataUsageLists",
			"metadataUsagePairs",
			"fieldRefs",
			"referencedAssemblies",
			"attributesInfo",
			"attributeTypes",
			"unresolvedVirtualCallParameterTypes",
			"unresolvedVirtualCallParameterRanges",
			"windowsRuntimeTypeNames",
			"exportedTypeDefinitions"
		];
		IL2CPP_METADATA_VERSIONS = [
			24,
			27,
			29,
			31,
			39
		];
		il2cppMetadataSectionNames = (version) => version === 24 ? IL2CPP_METADATA_V24_SECTION_NAMES : version === 27 ? IL2CPP_METADATA_V27_SECTION_NAMES : IL2CPP_METADATA_SECTION_NAMES;
		count = z.number().int().nonnegative();
		optionalIndex = z.number().int().min(-1);
		indexWidth = z.union([
			z.literal(1),
			z.literal(2),
			z.literal(4)
		]);
		inspectIl2cppMetadataInputSchema = z.strictObject({
			path: absoluteLocalPathStringSchema.describe("Absolute filesystem path to a Unity IL2CPP global-metadata.dat file"),
			detail: z.enum(["complete", "summary"]).default("summary").describe("summary (default) retains complete Evidence and returns identity and collection counts; complete returns every image, type, method, member, parameter and string-literal row inline"),
			binary_path: absoluteLocalPathStringSchema.optional().describe("Absolute path to the caller-selected matching 64-bit IL2CPP binary (Mach-O GameAssembly.dylib, PE GameAssembly.dll or ELF libil2cpp.so); static reading, never executed"),
			binary_architecture: z.enum(["arm64", "amd64"]).optional().describe("Slice to read from a universal Mach-O binary_path; required for universal binaries and rejected otherwise"),
			generic_instances: z.boolean().optional().describe("Also link generic method instances (genericMethodTable rows) to code addresses with Il2CppDumper-style Type<Args>$$Method<Args> names; needs binary_path")
		});
		il2cppMetadataSectionSchema = z.strictObject({
			name: z.enum([
				...IL2CPP_METADATA_SECTION_NAMES,
				"attributesInfo",
				"attributeTypes",
				"unresolvedVirtualCallParameterTypes",
				"unresolvedVirtualCallParameterRanges",
				"metadataUsageLists",
				"metadataUsagePairs"
			]),
			offset: count,
			size: count,
			/** Header-recorded entry count; versions 29 and 31 record none. */
			count: count.nullable()
		});
		il2cppMetadataImageSchema = z.strictObject({
			name: z.string(),
			type_start: optionalIndex,
			type_count: count
		});
		il2cppMetadataTypeSchema = z.strictObject({
			name: z.string(),
			namespace: z.string(),
			method_start: optionalIndex,
			method_count: count,
			nested_type_start: optionalIndex,
			nested_type_count: count,
			/** Enclosing type derived from the nestedTypes section. */
			declaring_type: optionalIndex.describe("Enclosing TypeDefinitionIndex derived from nestedTypes; -1 means no enclosing metadata type was recorded")
		});
		il2cppMetadataMethodSchema = z.strictObject({
			name: z.string(),
			declaring_type: optionalIndex.describe("Declared TypeDefinitionIndex from this MethodDefinition; -1 is an absent reference")
		});
		il2cppMetadataMemberSchema = z.strictObject({
			name: z.string(),
			/** -1 when no type range claims the row. */
			declaring_type: optionalIndex
		});
		il2cppMetadataParameterSchema = z.strictObject({
			name: z.string(),
			/** -1 when no method range claims the row. */
			method: optionalIndex
		});
		il2cppMetadataStringLiteralSchema = z.strictObject({
			value: z.string().nullable(),
			value_base64: canonicalBase64Schema.nullable()
		});
		addressPattern = /^0x[0-9a-f]{1,16}$/u;
		il2cppAddressSchema = z.string().regex(addressPattern);
		IL2CPP_METHOD_ADDRESS_STATES = [
			"code",
			"no-body",
			"unknown"
		];
		il2cppMethodAddressSchema = z.strictObject({
			state: z.enum(IL2CPP_METHOD_ADDRESS_STATES),
			/** Null unless state is code. */
			address: il2cppAddressSchema.nullable(),
			rva: il2cppAddressSchema.nullable()
		});
		il2cppTypeReferenceSchema = z.strictObject({
			type: optionalIndex,
			/** Null for type index -1, unresolved native type-table slots, and version 27. */
			name: z.string().nullable()
		});
		il2cppCodeGenModuleSchema = z.strictObject({
			image: count,
			address: il2cppAddressSchema,
			method_pointer_count: count
		});
		il2cppGenericMethodIssueSchema = z.strictObject({
			/** genericMethodTable index of the row this issue leaves unknown. */
			row: count,
			/** Address of the contradicting record: the row, its method spec or its pointer slot. */
			address: il2cppAddressSchema,
			message: z.string()
		});
		il2cppGenericMethodLinkSchema = z.strictObject({
			/**
			* CodeRegistration's genericMethodPointersCount, followed by the array
			* pointer; null with the count and stride when the table is empty, because
			* no row then selects one CodeRegistration layout.
			*/
			generic_method_pointers_field: il2cppAddressSchema.nullable(),
			generic_method_pointers_count: count.nullable(),
			/** MetadataRegistration's genericMethodTable array. */
			generic_method_table: il2cppAddressSchema,
			generic_method_table_count: count,
			/** 16 when rows carry an adjustor thunk index (27.1 and later), else 12. */
			generic_method_table_stride: z.union([z.literal(12), z.literal(16)]).nullable(),
			method_specs_count: count,
			generic_insts_count: count,
			issues: z.array(il2cppGenericMethodIssueSchema)
		});
		il2cppGenericMethodInstanceSchema = il2cppMethodAddressSchema.extend({
			/** Il2CppMethodSpec index. */
			method_spec: count,
			/** Recorded definition index, including invalid values; null when unreadable. */
			method: z.number().int().nullable(),
			/** Il2CppDumper-style name; null only on an unknown row whose method spec an issue names. */
			name: z.string().nullable()
		});
		il2cppBinaryLinkSchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				sha256: digestSchema,
				bytes: count
			}),
			format: z.enum([
				"elf",
				"macho",
				"pe"
			]),
			architecture: z.string(),
			image_base: il2cppAddressSchema,
			/**
			* CodeRegistration's codeGenModulesCount field, followed by the module array
			* pointer; null when no static pair was resolved and executable byte-pattern
			* candidates identified the array without verified instruction boundaries.
			*/
			code_gen_modules_field: il2cppAddressSchema.nullable(),
			/** The code-generation module pointer array. */
			code_gen_modules_array: il2cppAddressSchema,
			code_gen_modules: z.array(il2cppCodeGenModuleSchema),
			/**
			* MetadataRegistration's typesCount field, followed by the types pointer;
			* null when no static registration had the counts and executable byte-pattern
			* candidates identified the type table, whose run length is then types_count.
			*/
			types_field: il2cppAddressSchema.nullable(),
			types_count: count,
			/** Null unless generic_instances was requested. */
			generic_methods: il2cppGenericMethodLinkSchema.nullable()
		});
		il2cppMetadataObjectSchema = z.strictObject({
			artifact: z.strictObject({
				path: localPathStringSchema,
				sha256: digestSchema,
				bytes: count
			}),
			magic: z.literal(IL2CPP_METADATA_MAGIC),
			metadata_version: z.union(IL2CPP_METADATA_VERSIONS.map((version) => z.literal(version))),
			index_widths: z.strictObject({
				type_definition: indexWidth,
				generic_container: indexWidth,
				parameter: indexWidth,
				type: indexWidth,
				type_width_source: z.enum([
					"interface-offsets-record",
					"type-definition-record",
					"fixed-width-version"
				])
			}),
			sections: z.array(il2cppMetadataSectionSchema),
			images: z.array(il2cppMetadataImageSchema),
			types: z.array(il2cppMetadataTypeSchema),
			methods: z.array(il2cppMetadataMethodSchema),
			fields: z.array(il2cppMetadataMemberSchema),
			properties: z.array(il2cppMetadataMemberSchema),
			events: z.array(il2cppMetadataMemberSchema),
			parameters: z.array(il2cppMetadataParameterSchema),
			string_literals: z.array(il2cppMetadataStringLiteralSchema),
			/** Null unless binary_path was selected. */
			binary: il2cppBinaryLinkSchema.nullable(),
			/** One row per method index when binary is linked, otherwise empty. */
			method_addresses: z.array(il2cppMethodAddressSchema),
			/** Per method, field and parameter index when binary is linked, otherwise empty. */
			return_types: z.array(il2cppTypeReferenceSchema),
			field_types: z.array(il2cppTypeReferenceSchema),
			parameter_types: z.array(il2cppTypeReferenceSchema),
			/** Null unless generic_instances was requested; one row per genericMethodTable entry. */
			generic_method_instances: z.array(il2cppGenericMethodInstanceSchema).nullable(),
			limitations: z.array(z.string())
		});
		il2cppMetadataMemberCollections = [
			"fields",
			"properties",
			"events",
			"parameters",
			"string_literals"
		];
		il2cppMetadataBinaryCollections = [
			"method_addresses",
			"return_types",
			"field_types",
			"parameter_types"
		];
		il2cppMetadataParentObjectSchema = il2cppMetadataObjectSchema.partial({
			fields: true,
			properties: true,
			events: true,
			parameters: true,
			string_literals: true,
			binary: true,
			method_addresses: true,
			return_types: true,
			field_types: true,
			parameter_types: true,
			generic_method_instances: true
		}).extend({ binary: il2cppBinaryLinkSchema.partial({ generic_methods: true }).nullable().optional() });
		codeRowContradicts = (row, imageBase) => row.state === "code" ? row.address === null || row.rva === null || imageBase === undefined || addressPattern.test(row.address) && addressPattern.test(row.rva) && addressPattern.test(imageBase) && BigInt(row.address) !== BigInt(imageBase) + BigInt(row.rva) : row.address !== null || row.rva !== null;
		validateMetadataFacts = (report, context) => {
			const names = il2cppMetadataSectionNames(report.metadata_version);
			if (report.sections.length !== names.length) context.addIssue({
				code: "custom",
				path: ["sections"],
				message: `Version ${report.metadata_version} headers have ${names.length} sections.`
			});
			report.sections.forEach((section, index) => {
				if (section.name !== names[index]) context.addIssue({
					code: "custom",
					path: [
						"sections",
						index,
						"name"
					],
					message: "Sections must follow header order."
				});
				if (section.offset + section.size > report.artifact.bytes) context.addIssue({
					code: "custom",
					path: ["sections", index],
					message: "Section range is outside the selected artifact."
				});
			});
			if (report.binary != null) for (const collection of [
				"return_types",
				"field_types",
				"parameter_types"
			]) report[collection]?.forEach((row, index) => {
				if (row.type >= report.binary.types_count || row.type === -1 && row.name !== null) context.addIssue({
					code: "custom",
					path: [collection, index],
					message: "Type reference is outside the linked type table or names an unavailable type."
				});
			});
			report.method_addresses?.forEach((row, index) => {
				if (codeRowContradicts(row, report.binary?.image_base)) context.addIssue({
					code: "custom",
					path: ["method_addresses", index],
					message: "Only a code row carries an address and RVA; both are then present."
				});
			});
			for (const collection of [
				"fields",
				"properties",
				"events"
			]) report[collection]?.forEach((row, index) => {
				if (row.declaring_type >= report.types.length) context.addIssue({
					code: "custom",
					path: [
						collection,
						index,
						"declaring_type"
					],
					message: "Member owner is outside the retained type definitions."
				});
			});
			report.parameters?.forEach((row, index) => {
				if (row.method >= report.methods.length) context.addIssue({
					code: "custom",
					path: [
						"parameters",
						index,
						"method"
					],
					message: "Parameter owner is outside the retained method definitions."
				});
			});
			const linkedRows = {
				method_addresses: report.methods,
				return_types: report.methods,
				field_types: report.fields,
				parameter_types: report.parameters
			};
			for (const collection of il2cppMetadataBinaryCollections) {
				const rows = report[collection];
				if (report.binary === undefined !== (rows === undefined)) {
					context.addIssue({
						code: "custom",
						path: [collection],
						message: `${collection} is retained exactly when the binary link field is.`
					});
					continue;
				}
				const owners = linkedRows[collection];
				if (rows === undefined) continue;
				const expected = report.binary === null ? 0 : owners?.length;
				if (expected === undefined || rows.length !== expected) context.addIssue({
					code: "custom",
					path: [collection],
					message: `A linked binary needs one ${collection} row per metadata row; none without one.`
				});
			}
			if (report.generic_method_instances !== undefined) {
				const generic = report.binary?.generic_methods ?? null;
				if (generic === null !== (report.generic_method_instances === null) || generic !== null && report.generic_method_instances.length !== generic.generic_method_table_count) context.addIssue({
					code: "custom",
					path: ["generic_method_instances"],
					message: "Generic method instances need one row per genericMethodTable entry and its registration facts; neither without the other."
				});
				if (generic !== null && [
					generic.generic_method_pointers_field,
					generic.generic_method_pointers_count,
					generic.generic_method_table_stride
				].some((value) => value === null !== (generic.generic_method_table_count === 0))) context.addIssue({
					code: "custom",
					path: ["binary", "generic_methods"],
					message: "Only an empty genericMethodTable leaves the pointer field, pointer count and stride unselected; a nonempty one selects all three."
				});
			} else if (report.binary?.generic_methods != null) context.addIssue({
				code: "custom",
				path: ["generic_method_instances"],
				message: "Generic registration facts need their instance rows."
			});
			const issued = new Set(report.binary?.generic_methods?.issues.map((issue) => issue.row));
			const unmatched = new Set(issued);
			report.generic_method_instances?.forEach((row, index) => {
				unmatched.delete(index);
				if (codeRowContradicts(row, report.binary?.image_base)) context.addIssue({
					code: "custom",
					path: ["generic_method_instances", index],
					message: "Only a code row carries an address and RVA; both are then present."
				});
				if (row.state === "unknown" !== issued.has(index) || row.name === null && row.state !== "unknown") context.addIssue({
					code: "custom",
					path: [
						"generic_method_instances",
						index,
						"state"
					],
					message: "A row is unknown exactly when an issue names it, and only then may its name be null."
				});
				if (row.name !== null && (row.method === null || row.method < 0 || row.method >= report.methods.length)) context.addIssue({
					code: "custom",
					path: [
						"generic_method_instances",
						index,
						"method"
					],
					message: "A named generic instance needs a definition inside the retained methods."
				});
			});
			if (unmatched.size > 0) context.addIssue({
				code: "custom",
				path: [
					"binary",
					"generic_methods",
					"issues"
				],
				message: "Every generic method issue names an existing instance row."
			});
			report.string_literals?.forEach((row, index) => {
				if (row.value === null === (row.value_base64 === null)) context.addIssue({
					code: "custom",
					path: ["string_literals", index],
					message: "A literal must retain exactly one UTF-8 or byte-exact base64 representation."
				});
			});
		};
		il2cppMetadataSchema = il2cppMetadataObjectSchema.superRefine(validateMetadataFacts);
		il2cppMetadataParentSchema = il2cppMetadataParentObjectSchema.superRefine(validateMetadataFacts);
	})))();
}

//#endregion
//#region dist/domain/analysisView/il2cppMetadataView.js
/** Direct batch lookup visits selected indices only; metadata order is stable. */
function* rowIndices(length, indices) {
	if (indices === undefined) {
		for (let index = 0; index < length; index++) yield index;
	} else {
		for (const index of [...new Set(indices)].sort((a, b) => a - b)) if (index < length) yield index;
	}
}
var countsSchema, il2cppMetadataSummarySchema, indexSchema, sectionRowSchema, imageRowSchema, typeRowSchema, methodRowSchema, memberRowSchema, parameterRowSchema, stringLiteralRowSchema, methodAddressRowSchema, typeReferenceRowSchema, genericInstanceRowSchema, codeGenModuleRowSchema, genericIssueRowSchema, indexPage, page, declaringTypes, il2cppMetadataViewRequestSchema, il2cppMetadataViewItemsSchema, il2cppMetadataViewContextSchema, checkedReports, parseMetadataReport, selectFields, selection, projectIl2cppMetadataView;
function init_il2cppMetadataView() {
	return (init_il2cppMetadataView = __esmMin((() => {
		init_analysisViewErrors();
		init_immutableJson();
		init_il2cppMetadata();
		init_result();
		init_analysisViewParent();
		init_analysisViewCoverage();
		countsSchema = z.strictObject({
			sections: z.number().int().nonnegative(),
			images: z.number().int().nonnegative(),
			types: z.number().int().nonnegative(),
			methods: z.number().int().nonnegative(),
			nested_types: z.number().int().nonnegative(),
			fields: z.number().int().nonnegative().nullable(),
			properties: z.number().int().nonnegative().nullable(),
			events: z.number().int().nonnegative().nullable(),
			parameters: z.number().int().nonnegative().nullable(),
			string_literals: z.number().int().nonnegative().nullable(),
			code_gen_modules: z.number().int().nonnegative().nullable(),
			method_addresses: z.number().int().nonnegative().nullable(),
			/** method_addresses rows per state; null when native observations were not collected. */
			method_address_states: z.strictObject({
				code: z.number().int().nonnegative(),
				no_body: z.number().int().nonnegative(),
				unknown: z.number().int().nonnegative()
			}).nullable(),
			return_types: z.number().int().nonnegative().nullable(),
			field_types: z.number().int().nonnegative().nullable(),
			parameter_types: z.number().int().nonnegative().nullable(),
			/** Null unless generic_instances was requested, or before it was collected. */
			generic_method_instances: z.number().int().nonnegative().nullable(),
			/** generic_method_instances rows per state; null as above. */
			generic_method_instance_states: z.strictObject({
				code: z.number().int().nonnegative(),
				no_body: z.number().int().nonnegative(),
				unknown: z.number().int().nonnegative()
			}).nullable(),
			/** generic_methods.issues rows; null as above. */
			generic_method_issues: z.number().int().nonnegative().nullable()
		});
		il2cppMetadataSummarySchema = il2cppMetadataObjectSchema.omit({
			sections: true,
			images: true,
			types: true,
			methods: true,
			fields: true,
			properties: true,
			events: true,
			parameters: true,
			string_literals: true,
			method_addresses: true,
			return_types: true,
			field_types: true,
			parameter_types: true,
			generic_method_instances: true,
			binary: true
		}).extend({
			binary: il2cppBinaryLinkSchema.omit({ code_gen_modules: true }).extend({ generic_methods: il2cppGenericMethodLinkSchema.omit({ issues: true }).nullable() }).partial({ generic_methods: true }).nullable().optional(),
			counts: countsSchema
		});
		indexSchema = z.number().int().nonnegative();
		sectionRowSchema = il2cppMetadataSectionSchema.extend({ index: indexSchema });
		imageRowSchema = il2cppMetadataImageSchema.extend({ index: indexSchema });
		typeRowSchema = il2cppMetadataTypeSchema.extend({ index: indexSchema });
		methodRowSchema = il2cppMetadataMethodSchema.extend({ index: indexSchema });
		memberRowSchema = il2cppMetadataMemberSchema.extend({ index: indexSchema });
		parameterRowSchema = il2cppMetadataParameterSchema.extend({ index: indexSchema });
		stringLiteralRowSchema = il2cppMetadataStringLiteralSchema.extend({ index: indexSchema });
		methodAddressRowSchema = il2cppMethodAddressSchema.extend({ index: indexSchema });
		typeReferenceRowSchema = il2cppTypeReferenceSchema.extend({ index: indexSchema });
		genericInstanceRowSchema = il2cppGenericMethodInstanceSchema.extend({ index: indexSchema });
		codeGenModuleRowSchema = il2cppCodeGenModuleSchema.extend({ index: indexSchema });
		genericIssueRowSchema = il2cppGenericMethodIssueSchema.extend({ index: indexSchema });
		indexPage = {
			kind: z.literal("il2cpp-metadata"),
			indices: z.array(indexSchema).optional(),
			offset: indexSchema.default(0),
			limit: z.number().int().positive().default(64)
		};
		page = {
			...indexPage,
			names: z.array(z.string()).optional()
		};
		declaringTypes = z.array(z.number().int().min(-1)).optional();
		il2cppMetadataViewRequestSchema = z.discriminatedUnion("collection", [
			z.strictObject({
				...page,
				collection: z.literal("sections"),
				fields: z.array(sectionRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...page,
				collection: z.literal("images"),
				fields: z.array(imageRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...page,
				collection: z.literal("types"),
				image_indices: z.array(indexSchema).optional(),
				namespaces: z.array(z.string()).optional(),
				declaring_types: declaringTypes,
				fields: z.array(typeRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...page,
				collection: z.literal("methods"),
				declaring_types: declaringTypes,
				fields: z.array(methodRowSchema.keyof()).optional()
			}),
			...[
				"fields",
				"properties",
				"events"
			].map((collection) => z.strictObject({
				...page,
				collection: z.literal(collection),
				declaring_types: declaringTypes,
				fields: z.array(memberRowSchema.keyof()).optional()
			})),
			z.strictObject({
				...page,
				collection: z.literal("parameters"),
				method_indices: z.array(indexSchema).optional(),
				fields: z.array(parameterRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...indexPage,
				collection: z.literal("string_literals"),
				fields: z.array(stringLiteralRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...indexPage,
				collection: z.literal("method_addresses"),
				addresses: z.array(z.string().regex(/^0x[0-9a-fA-F]{1,16}$/u)).optional(),
				states: z.array(il2cppMethodAddressSchema.shape.state).optional(),
				fields: z.array(methodAddressRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...page,
				collection: z.literal("generic_method_instances"),
				/** Metadata method indices of the generic definitions. */
				method_indices: z.array(indexSchema).optional(),
				addresses: z.array(z.string().regex(/^0x[0-9a-fA-F]{1,16}$/u)).optional(),
				states: z.array(il2cppGenericMethodInstanceSchema.shape.state).optional(),
				fields: z.array(genericInstanceRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...indexPage,
				collection: z.literal("generic_method_issues"),
				/** genericMethodTable rows the issues leave unknown. */
				rows: z.array(indexSchema).optional(),
				fields: z.array(genericIssueRowSchema.keyof()).optional()
			}),
			z.strictObject({
				...indexPage,
				collection: z.literal("code_gen_modules"),
				image_indices: z.array(indexSchema).optional(),
				fields: z.array(codeGenModuleRowSchema.keyof()).optional()
			}),
			...["return_types", "field_types"].map((collection) => z.strictObject({
				...page,
				collection: z.literal(collection),
				fields: z.array(typeReferenceRowSchema.keyof()).optional()
			})),
			z.strictObject({
				...page,
				collection: z.literal("parameter_types"),
				method_indices: z.array(indexSchema).optional(),
				fields: z.array(typeReferenceRowSchema.keyof()).optional()
			})
		]);
		il2cppMetadataViewItemsSchema = z.union([
			z.array(sectionRowSchema.partial().required({ index: true })),
			z.array(imageRowSchema.partial().required({ index: true })),
			z.array(typeRowSchema.partial().required({ index: true })),
			z.array(methodRowSchema.partial().required({ index: true })),
			z.array(memberRowSchema.partial().required({ index: true })),
			z.array(parameterRowSchema.partial().required({ index: true })),
			z.array(stringLiteralRowSchema.partial().required({ index: true })),
			z.array(methodAddressRowSchema.partial().required({ index: true })),
			z.array(typeReferenceRowSchema.partial().required({ index: true })),
			z.array(codeGenModuleRowSchema.partial().required({ index: true })),
			z.array(genericInstanceRowSchema.partial().required({ index: true })),
			z.array(genericIssueRowSchema.partial().required({ index: true }))
		]);
		il2cppMetadataViewContextSchema = z.strictObject({
			metadata_version: il2cppMetadataObjectSchema.shape.metadata_version,
			counts: countsSchema,
			binary_source: il2cppBinaryLinkSchema.pick({
				artifact: true,
				format: true,
				architecture: true,
				image_base: true
			}).optional()
		});
		checkedReports = new WeakMap();
		parseMetadataReport = (parent) => {
			const key = parent.normalizedResult;
			const reusable = parent.sealedResult === true && typeof key === "object" && key !== null && isImmutableJsonSnapshot(key);
			const cached = reusable ? checkedReports.get(key) : undefined;
			if (cached !== undefined) return ok(cached);
			const parsed = parseAnalysisViewResult(il2cppMetadataParentSchema, parent);
			if (!parsed.ok) return parsed;
			const report = reusable ? key : parsed.value;
			const checked = {
				report,
				counts: {
					sections: report.sections.length,
					images: report.images.length,
					types: report.types.length,
					methods: report.methods.length,
					nested_types: report.types.reduce((count, type) => count + Number(type.declaring_type !== -1), 0),
					fields: report.fields?.length ?? null,
					properties: report.properties?.length ?? null,
					events: report.events?.length ?? null,
					parameters: report.parameters?.length ?? null,
					string_literals: report.string_literals?.length ?? null,
					code_gen_modules: report.binary?.code_gen_modules.length ?? null,
					method_addresses: report.binary == null ? null : report.method_addresses?.length ?? null,
					method_address_states: (report.binary == null ? undefined : report.method_addresses)?.reduce((states, row) => {
						if (row.state === "code") states.code++;
						else if (row.state === "no-body") states.no_body++;
						else states.unknown++;
						return states;
					}, {
						code: 0,
						no_body: 0,
						unknown: 0
					}) ?? null,
					return_types: report.binary == null ? null : report.return_types?.length ?? null,
					field_types: report.binary == null ? null : report.field_types?.length ?? null,
					parameter_types: report.binary == null ? null : report.parameter_types?.length ?? null,
					generic_method_instances: report.generic_method_instances?.length ?? null,
					generic_method_instance_states: report.generic_method_instances?.reduce((states, row) => {
						if (row.state === "code") states.code++;
						else if (row.state === "no-body") states.no_body++;
						else states.unknown++;
						return states;
					}, {
						code: 0,
						no_body: 0,
						unknown: 0
					}) ?? null,
					generic_method_issues: report.binary?.generic_methods?.issues.length ?? null
				}
			};
			if (reusable) checkedReports.set(key, checked);
			return ok(checked);
		};
		selectFields = (row, index, fields) => {
			const item = { index };
			const values = row;
			for (const key of Object.keys(values)) {
				const value = values[key];
				if (value !== undefined && (fields === undefined || fields.has(key))) item[key] = value;
			}
			return item;
		};
		selection = (view, report) => {
			const names = !("names" in view) || view.names === undefined ? undefined : new Set(view.names);
			const owners = !("declaring_types" in view) || view.declaring_types === undefined ? undefined : new Set(view.declaring_types);
			const addresses = (view.collection === "method_addresses" || view.collection === "generic_method_instances") && view.addresses !== undefined ? new Set(view.addresses.map((value) => BigInt(value).toString(16))) : undefined;
			const states = (view.collection === "method_addresses" || view.collection === "generic_method_instances") && view.states !== undefined ? new Set(view.states) : undefined;
			const methods = (view.collection === "parameters" || view.collection === "parameter_types" || view.collection === "generic_method_instances") && view.method_indices !== undefined ? new Set(view.method_indices) : undefined;
			const parameterOwner = (row, index) => "method" in row ? row.method : view.collection === "parameter_types" ? report.parameters?.[index]?.method : undefined;
			const namespaces = view.collection !== "types" || view.namespaces === undefined ? undefined : new Set(view.namespaces);
			const imageIndices = view.collection === "types" ? view.image_indices : undefined;
			const ranges = [];
			if (imageIndices !== undefined) {
				const selected = [...new Set(imageIndices)].flatMap((index) => {
					const image = report.images[index];
					return image === undefined || image.type_count === 0 ? [] : [{
						start: image.type_start,
						end: image.type_start + image.type_count
					}];
				}).sort((a, b) => a.start - b.start);
				for (const range of selected) {
					const last = ranges.at(-1);
					if (last !== undefined && range.start <= last.end) last.end = Math.max(last.end, range.end);
					else ranges.push(range);
				}
			}
			const issueRows = view.collection === "generic_method_issues" && view.rows !== undefined ? new Set(view.rows) : undefined;
			const moduleImages = view.collection === "code_gen_modules" && view.image_indices !== undefined ? new Set(view.image_indices) : undefined;
			if ([
				moduleImages,
				issueRows,
				addresses,
				states,
				names,
				owners,
				namespaces,
				methods,
				imageIndices
			].every((filter) => filter === undefined)) return undefined;
			return (row, index) => {
				if (moduleImages !== undefined && (!("image" in row) || !moduleImages.has(row.image))) return false;
				if (issueRows !== undefined && (!("row" in row) || !issueRows.has(row.row))) return false;
				if (addresses !== undefined && (!("address" in row) || row.address === null || !addresses.has(BigInt(row.address).toString(16)))) return false;
				if (states !== undefined && (!("state" in row) || !states.has(row.state))) return false;
				if (names !== undefined && (!("name" in row) || row.name === null || !names.has(row.name))) return false;
				if (owners !== undefined && (!("declaring_type" in row) || !owners.has(row.declaring_type))) return false;
				if (namespaces !== undefined && (!("namespace" in row) || !namespaces.has(row.namespace))) return false;
				if (methods !== undefined) {
					const method = parameterOwner(row, index);
					if (method === null || method === undefined || !methods.has(method)) return false;
				}
				if (imageIndices === undefined) return true;
				let lower = 0;
				let upper = ranges.length;
				while (lower < upper) {
					const middle = lower + Math.floor((upper - lower) / 2);
					if (ranges[middle].start <= index) lower = middle + 1;
					else upper = middle;
				}
				const range = ranges[lower - 1];
				return range !== undefined && index < range.end;
			};
		};
		projectIl2cppMetadataView = (parent, view) => {
			if (view.kind !== "summary" && view.kind !== "il2cpp-metadata") return err(analysisViewInputError([{
				path: ["view"],
				reason: "invalid_value",
				message: "IL2CPP metadata Evidence supports summary and selected sections, images, types, methods, member, parameter, string literal, method address, type reference, generic method instance and generic method issue pages."
			}]));
			const parsed = parseMetadataReport(parent);
			if (!parsed.ok) return parsed;
			const { report, counts } = parsed.value;
			if (parent.subject != null && (parent.subject.format !== "file" || parent.subject.local_path !== report.artifact.path || parent.subject.digest.sha256 !== report.artifact.sha256)) return err(analysisViewInputError([{
				path: ["source", "subject"],
				reason: "invalid_value",
				message: "IL2CPP metadata artifact identity does not match its parent subject."
			}]));
			const { sections, images, types, methods, fields, properties, events, parameters, string_literals, method_addresses, return_types, field_types, parameter_types, generic_method_instances, ...identity } = report;
			const allRows = {
				code_gen_modules: report.binary?.code_gen_modules,
				generic_method_issues: report.binary?.generic_methods === null ? null : report.binary?.generic_methods?.issues,
				sections,
				images,
				types,
				methods,
				fields,
				properties,
				events,
				parameters,
				string_literals,
				method_addresses,
				return_types,
				field_types,
				parameter_types,
				generic_method_instances
			};
			const shared = {
				parent_evidence_id: parent.evidenceId,
				parent_operation: "inspect_il2cpp_metadata",
				parent_digest: parent.evidenceId.slice(3),
				artifact: {
					path: report.artifact.path,
					sha256: report.artifact.sha256
				},
				limitations: [...parent.limitations],
				unknowns: [
					...report.binary != null && report.binary.code_gen_modules_field === null ? ["Module-array association is inferred from executable byte patterns; instruction boundaries and runtime use remain unverified."] : [],
					...report.binary != null && report.binary.types_field === null ? ["Type-table association and types_count are inferred from executable byte patterns and Il2CppType-shaped records; instruction boundaries and runtime use remain unverified."] : [],
					...[...il2cppMetadataMemberCollections, ...il2cppMetadataBinaryCollections].filter((name) => report[name] === undefined).map((name) => `Retained Evidence did not collect ${name}; its count is unknown. Reinspect the metadata to acquire these facts.`),
					...report.binary != null && report.generic_method_instances === undefined ? ["Retained Evidence did not collect generic_method_instances; its count is unknown. Reinspect with generic_instances to acquire these facts."] : report.generic_method_instances === null ? ["Generic method instances were not requested; their count is unknown."] : [],
					report.binary == null ? "Names come from unencrypted metadata only; native code addresses and runtime registration remain unknown." : report.binary.generic_methods == null ? "Addresses come from static binary tables; runtime behavior and generic instance code remain unknown." : "Addresses come from static binary tables; runtime behavior and generic instances outside genericMethodTable remain unknown.",
					...parent.subject == null ? ["The parent has no recorded subject; its normalized artifact identity cannot be cross-checked against a subject digest."] : []
				]
			};
			if (view.kind === "summary") {
				const binary = report.binary == null ? report.binary : (({ code_gen_modules: _modules, generic_methods, ...facts }) => ({
					...facts,
					...generic_methods === undefined ? {} : { generic_methods: generic_methods === null ? null : (({ issues: _issues, ...registration }) => registration)(generic_methods) }
				}))(report.binary);
				return ok({
					kind: "summary",
					view,
					...shared,
					summary: {
						...identity,
						...binary === undefined ? {} : { binary },
						counts
					},
					coverage: completeWithinViewCoverage(1, 1)
				});
			}
			const nativeUnavailable = report.binary == null && [
				"method_addresses",
				"return_types",
				"field_types",
				"parameter_types"
			].includes(view.collection);
			const rows = nativeUnavailable ? undefined : allRows[view.collection];
			if (rows === null) return err(analysisViewInputError([{
				path: ["view", "collection"],
				reason: "invalid_value",
				message: "Generic method instances were not requested for this Evidence, so they are unknown; inspect again with generic_instances and binary_path."
			}]));
			if (rows === undefined) return err(analysisViewInputError([{
				path: ["view", "collection"],
				reason: "invalid_value",
				message: `Retained Evidence did not collect ${view.collection}; inspect the metadata again to acquire these facts.`
			}]));
			if (view.collection === "parameter_types" && view.method_indices !== undefined && report.parameters === undefined) return err(analysisViewInputError([{
				path: ["view", "method_indices"],
				reason: "invalid_value",
				message: "Retained Evidence did not collect parameters, so parameter owners are unknown; inspect the metadata again to select parameter types by method."
			}]));
			const matches = selection(view, report);
			const selectedFields = view.fields === undefined ? undefined : new Set(view.fields);
			const items = [];
			let total = 0;
			if (matches === undefined && view.indices === undefined) {
				total = rows.length;
				const end = Math.min(rows.length, view.offset + view.limit);
				for (let index = Math.min(view.offset, rows.length); index < end; index++) items.push(selectFields(rows[index], index, selectedFields));
			} else {
				for (const index of rowIndices(rows.length, view.indices)) {
					const row = rows[index];
					if (matches !== undefined && !matches(row, index)) continue;
					if (total >= view.offset && items.length < view.limit) items.push(selectFields(row, index, selectedFields));
					total++;
				}
			}
			return ok({
				kind: "il2cpp-metadata",
				view,
				...shared,
				items,
				metadata_version: report.metadata_version,
				...report.binary == null ? {} : { binary_source: {
					artifact: report.binary.artifact,
					format: report.binary.format,
					architecture: report.binary.architecture,
					image_base: report.binary.image_base
				} },
				counts,
				coverage: pageViewCoverage(view.offset, items.length, total)
			});
		};
	})))();
}

//#endregion
//#region dist/domain/analysisView/analysisView.js
var summaryViewSchema, facetViewSchema, indexSelectorSchema, nameSelectorSchema, pathSelectorSchema, nodeIdSelectorSchema, moduleItemViewSchema, sectionOrSymbolItemViewSchema, itemViewSchema, pageViewSchema, nativeViewSchema, analysisViewRequestSchema, inlineEvidenceInputSchema, analysisViewSourceSchema, inspectAnalysisViewInputSchema, coverageSchema, artifactSchema, layoutSummarySchema, javascriptSummarySchema, viewResultBase, summaryViewResultBase, byteEntropySummaryViewResultSchema, nativeExportsSummaryViewResultSchema, devicetreeSummaryViewResultSchema, erlangBeamSummaryViewResultSchema, erlangBeamTableViewResultSchema, pythonPycSummaryViewResultSchema, pythonPycCodeObjectsViewResultSchema, gdbCommandSummaryViewResultSchema, objdumpSummaryViewResultSchema, fridaSessionStatusSummaryViewResultSchema, goBinarySummaryViewResultSchema, rustBinarySummaryViewResultSchema, rustBinaryPageViewResultSchema, binaryLayoutSummaryViewResultSchema, javascriptApplicationSummaryViewResultSchema, javascriptModuleReferencesViewResultSchema, javascriptFactsViewResultSchema, artifactInventorySummaryViewResultSchema, desktopApplicationSummaryViewResultSchema, wasmArtifactSummaryViewResultSchema, machoSummaryViewResultSchema, interfaceBuilderSummaryViewResultSchema, evmInterfaceSummaryViewResultSchema, managedArtifactSummaryViewResultSchema, managedMemberSummaryViewResultSchema, webNetworkCaptureSummaryViewResultSchema, androidPackageSummaryViewResultSchema, pcapCaptureSummaryViewResultSchema, dartAotSummaryViewResultSchema, javaScriptRoutesViewResultSchema, gpuCodeObjectsSummaryViewResultSchema, gpuCodeObjectsPageViewResultSchema, apkSignatureSummaryViewResultSchema, apkSignaturePageViewResultSchema, modelArtifactSummaryViewResultSchema, modelArtifactPageViewResultSchema, il2cppMetadataSummaryViewResultSchema, nativeInventorySummaryViewResultSchema, nativeFunctionMatchingSummaryViewResultSchema, declaredFacetCountSchema, recordedFacetCountSchema, valueFlowFacetCountSchema, nativeFunctionSummarySchema, nativeFunctionSummaryViewResultSchema, sourceToBundleSummaryViewResultSchema, sourceToBundlePageViewResultSchema, analysisViewResultSchema, sealAnalysisView, parentDigest, parseJavaScriptParent, unsupportedParent, parentArtifactPath, retainedViewProjectors, prepareAnalysisViewProjection, isGroupingView, projectGroupingView, projectAnalysisView;
function init_analysisView() {
	return (init_analysisView = __esmMin((() => {
		init_devicetreeView();
		init_apkSignatureQuery();
		init_apkSignatureView();
		init_byteEntropy();
		init_erlangBeamView();
		init_pythonPycView();
		init_nativeExportsView();
		init_byteEntropyView();
		init_analysisViewParent();
		init_javascriptRoutesView();
		init_javascriptRouteInventory();
		init_sourceToBundleView();
		init_gpuCodeObjectsView();
		init_gpuCodeObjects();
		init_modelArtifactQuery();
		init_modelArtifactView();
		init_commandObservationView();
		init_fridaSessionStatusView();
		init_commandObservation();
		init_rustBinaryQuery();
		init_goBinaryView();
		init_rustBinaryView();
		init_nativeFunctionMatchingView();
		init_protobufCaptureView();
		init_nativeInventoryView();
		init_nativeInventory();
		init_localPath();
		init_desktopApplicationView();
		init_desktopApplication();
		init_javascriptModuleReferences();
		init_javascriptApplicationCoverage();
		init_javascriptFactsView();
		init_javascriptSourceSelection();
		init_analysisErrorCore();
		init_analysisViewErrors();
		init_canonicalDigest();
		init_digests();
		init_evidence();
		init_jsonValue();
		init_result();
		init_binaryLayout();
		init_bundleResourceRoot();
		init_hopperValues();
		init_artifactGraph();
		init_artifactInspection();
		init_javascriptApplicationAnalysis();
		init_binaryLayoutView();
		init_javascriptApplicationView();
		init_webNetworkApiSurfaceView();
		init_nativeFunctionView();
		init_evmInterfaceView();
		init_artifactInventoryView();
		init_managedArtifactView();
		init_managedMemberView();
		init_wasmArtifactView();
		init_machoView();
		init_interfaceBuilderView();
		init_webNetworkCaptureView();
		init_analysisViewDataAdmission();
		init_environmentManifestView();
		init_environmentStateView();
		init_environmentCoverageView();
		init_pcapCaptureView();
		init_qlogCaptureView();
		init_androidPackageView();
		init_dartAotView();
		init_il2cppMetadataView();
		summaryViewSchema = z.strictObject({ kind: z.literal("summary") });
		facetViewSchema = z.strictObject({
			kind: z.literal("facet"),
			facet: z.enum(["mitigations", "linkage"])
		});
		indexSelectorSchema = z.strictObject({ index: z.int().nonnegative() });
		nameSelectorSchema = z.strictObject({ name: z.string() });
		pathSelectorSchema = z.strictObject({ path: z.string().describe("Exact observed module path or original source-map reference from a module page; an empty reference is valid.") });
		nodeIdSelectorSchema = z.strictObject({ node_id: prefixedDigestSchema("jag_node") });
		moduleItemViewSchema = z.strictObject({
			kind: z.literal("item"),
			collection: z.literal("modules"),
			selector: z.union([pathSelectorSchema, nodeIdSelectorSchema])
		});
		sectionOrSymbolItemViewSchema = z.strictObject({
			kind: z.literal("item"),
			collection: z.enum(["sections", "symbols"]),
			selector: z.union([indexSelectorSchema, nameSelectorSchema])
		});
		itemViewSchema = z.discriminatedUnion("collection", [moduleItemViewSchema, sectionOrSymbolItemViewSchema]);
		pageViewSchema = z.strictObject({
			kind: z.literal("page"),
			collection: z.enum([
				"sections",
				"symbols",
				"modules"
			]),
			offset: z.int().nonnegative(),
			limit: z.int().positive()
		});
		nativeViewSchema = z.strictObject({
			kind: z.literal("native"),
			facet: z.enum([
				"procedure",
				"pseudocode",
				"assembly",
				"basic_blocks",
				"comments",
				"callers",
				"callees",
				"incoming_references",
				"outgoing_references",
				"unresolved_calls",
				"referenced_strings",
				"referenced_names",
				"swift_string_literals",
				"swift_string_literal_omissions",
				"native_api",
				"value_flow_summary",
				"value_flow_operations",
				"value_flow_def_use",
				"value_flow_effects",
				"value_flow_parameters",
				"value_flow_parameter_uses"
			]),
			offset: z.int().nonnegative().default(0),
			limit: z.int().positive().default(64)
		});
		analysisViewRequestSchema = z.discriminatedUnion("kind", [
			devicetreeViewRequestSchema,
			erlangBeamViewRequestSchema,
			pythonPycViewRequestSchema,
			nativeExportsViewRequestSchema,
			javaScriptRoutesViewRequestSchema,
			nativeFunctionMatchingViewRequestSchema,
			sourceToBundleViewRequestSchema,
			summaryViewSchema,
			goBinaryViewRequestSchema,
			rustBinaryViewRequestSchema,
			desktopViewRequestSchema,
			facetViewSchema,
			itemViewSchema,
			pageViewSchema,
			javascriptModuleReferencesRequestSchema,
			javascriptFactsViewRequestSchema,
			nativeViewSchema,
			nativeInventoryViewRequestSchema,
			artifactInventoryViewRequestSchema,
			wasmViewRequestSchema,
			machoViewRequestSchema,
			interfaceBuilderViewRequestSchema,
			evmViewRequestSchema,
			managedViewRequestSchema,
			managedMembersViewRequestSchema,
			androidViewRequestSchema,
			apiSurfaceViewSchema,
			environmentManifestViewRequestSchema,
			environmentStateViewRequestSchema,
			environmentCoverageViewRequestSchema,
			captureViewRequestSchema,
			protobufViewRequestSchema,
			qlogViewRequestSchema,
			pcapViewRequestSchema,
			dartAotViewRequestSchema,
			il2cppMetadataViewRequestSchema,
			apkSignatureViewRequestSchema,
			modelArtifactViewRequestSchema,
			gpuCodeObjectsViewRequestSchema
		]);
		inlineEvidenceInputSchema = z.unknown().nonoptional();
		inlineEvidenceInputSchema._zod.processJSONSchema = evidenceSchema._zod.processJSONSchema;
		analysisViewSourceSchema = z.discriminatedUnion("kind", [
			z.strictObject({
				kind: z.literal("retained-evidence"),
				evidence_id: prefixedDigestSchema("ev")
			}),
			z.strictObject({
				kind: z.literal("inline"),
				evidence: inlineEvidenceInputSchema
			}),
			z.strictObject({
				kind: z.literal("evidence-file"),
				path: absoluteLocalPathStringSchema.describe("Absolute local path of one completed Evidence JSON file, or of an Evidence bundle written by --evidence_output or export_evidence_bundle. REA reads and authenticates it, then projects it like retained Evidence, so large captures are not charged as inline input."),
				evidence_id: prefixedDigestSchema("ev").exactOptional().describe("The record to project when the file is an Evidence bundle, such as a summary's normalized_result.parent_evidence_id. A bundle holding exactly one record needs no selection.")
			})
		]);
		inspectAnalysisViewInputSchema = z.strictObject({
			source: analysisViewSourceSchema,
			view: analysisViewRequestSchema
		});
		coverageSchema = z.strictObject({
			status: z.enum([
				"complete-within-view",
				"page",
				"empty"
			]),
			examined: z.int().nonnegative(),
			total: z.int().nonnegative(),
			next_offset: z.int().nonnegative().nullable(),
			exhausted: z.boolean()
		});
		artifactSchema = z.strictObject({
			path: z.string().describe("Selected artifact path, or the canonical resource root when resource-only Evidence has no executable subject."),
			sha256: digestSchema.nullable()
		});
		layoutSummarySchema = z.strictObject({
			bytes: binaryLayoutSchema.shape.artifact.shape.bytes,
			format: binaryLayoutSchema.shape.format,
			architecture: binaryLayoutSchema.shape.architecture,
			image_type: binaryLayoutSchema.shape.image_type,
			entry: z.strictObject({
				reported_value: z.string().min(1),
				meaning: z.enum([
					"linked-virtual-address",
					"not-applicable",
					"absent"
				]),
				execution_status: z.literal("unknown")
			}),
			counts: z.strictObject({
				sections: z.int().nonnegative(),
				segments: z.int().nonnegative(),
				symbols: z.int().nonnegative(),
				relocations: z.int().nonnegative()
			}),
			limitation_count: z.int().nonnegative()
		});
		javascriptSummarySchema = z.strictObject({
			input_path: z.string().min(1),
			format: z.enum(["asar", "directory"]),
			root_artifact_sha256: digestSchema,
			source_selection: javaScriptSourceSelectionSchema.exactOptional(),
			statistics: jsonObjectSchema,
			electron: jsonObjectSchema,
			coverage: jsonObjectSchema,
			limitation_count: z.int().nonnegative()
		});
		viewResultBase = {
			parent_evidence_id: prefixedDigestSchema("ev"),
			parent_operation: z.enum([
				"inspect_python_pyc",
				"inspect_erlang_beam",
				"inspect_devicetree",
				"inspect_byte_entropy",
				"inspect_native_exports",
				"inspect_binary_layout",
				"inspect_go_binary",
				"gdb_console",
				"frida_session_status",
				"inspect_with_objdump",
				"inspect_desktop_application",
				"analyze_javascript_application",
				"analyze_web_bundle",
				"analyze_function",
				"inspect_artifact",
				"inventory_artifact",
				"inspect_wasm_artifact",
				"inspect_macho",
				"decode_interface_builder",
				"inspect_evm_interface",
				"inspect_managed_artifact",
				"inspect_managed_members",
				"inspect_web_network_capture",
				"inspect_android_package",
				"inspect_pcap_capture",
				"inspect_dart_aot",
				"inspect_il2cpp_metadata",
				"inspect_model_artifact",
				"inspect_gpu_code_objects",
				...NATIVE_INVENTORY_OPERATIONS,
				"match_native_functions"
			]),
			parent_digest: digestSchema,
			view_digest: digestSchema,
			artifact: artifactSchema,
			coverage: coverageSchema,
			limitations: z.array(z.string()),
			unknowns: z.array(z.string())
		};
		summaryViewResultBase = {
			kind: z.literal("summary"),
			view: summaryViewSchema,
			...viewResultBase
		};
		byteEntropySummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			summary: byteEntropySummarySchema,
			parent_operation: z.literal("inspect_byte_entropy")
		});
		nativeExportsSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_native_exports"),
			summary: nativeExportsSummarySchema
		});
		devicetreeSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_devicetree"),
			summary: devicetreeSummarySchema
		});
		erlangBeamSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_erlang_beam"),
			summary: erlangBeamSummarySchema
		});
		erlangBeamTableViewResultSchema = z.strictObject({
			...viewResultBase,
			kind: z.literal("beam"),
			parent_operation: z.literal("inspect_erlang_beam"),
			view: erlangBeamViewRequestSchema,
			beam: erlangBeamSummarySchema,
			page: erlangBeamViewPageSchema
		});
		pythonPycSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_python_pyc"),
			summary: pythonPycSummarySchema
		});
		pythonPycCodeObjectsViewResultSchema = z.strictObject({
			...viewResultBase,
			kind: z.literal("python-pyc"),
			parent_operation: z.literal("inspect_python_pyc"),
			view: pythonPycViewRequestSchema,
			pyc: pythonPycSummarySchema,
			items: pythonPycViewItemsSchema
		});
		gdbCommandSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...commandSummaryContext,
			parent_operation: z.literal("gdb_console"),
			artifact: artifactSchema.nullable(),
			summary: gdbCommandSummarySchema
		});
		objdumpSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...commandSummaryContext,
			parent_operation: z.literal("inspect_with_objdump"),
			artifact: artifactSchema.nullable(),
			summary: commandObservationSchema
		});
		fridaSessionStatusSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...fridaSessionStatusViewContext,
			parent_operation: z.literal("frida_session_status"),
			artifact: artifactSchema.nullable(),
			summary: fridaSessionStatusSummarySchema
		});
		goBinarySummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...goBinaryViewContextSchema.shape,
			parent_operation: z.literal("inspect_go_binary"),
			summary: goBinarySummarySchema
		});
		rustBinarySummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...rustBinaryViewContextSchema.shape,
			parent_operation: z.literal("inspect_rust_binary"),
			summary: rustBinarySummarySchema
		});
		rustBinaryPageViewResultSchema = z.strictObject({
			...viewResultBase,
			...rustBinaryViewContextSchema.shape,
			kind: z.literal("rust"),
			parent_operation: z.literal("inspect_rust_binary"),
			view: rustBinaryViewRequestSchema,
			rust: rustBinarySummarySchema,
			page: rustBinaryViewPageSchema
		});
		binaryLayoutSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			summary: layoutSummarySchema,
			parent_operation: z.literal("inspect_binary_layout")
		});
		javascriptApplicationSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			summary: javascriptSummarySchema,
			parent_operation: z.literal("analyze_javascript_application")
		});
		javascriptModuleReferencesViewResultSchema = z.strictObject({
			...viewResultBase,
			kind: z.literal("javascript"),
			view: javascriptModuleReferencesRequestSchema,
			parent_operation: z.literal("analyze_javascript_application"),
			rows: z.array(javascriptModuleReferenceSchema),
			source_coverage: javascriptApplicationSourceCoverageSchema
		});
		javascriptFactsViewResultSchema = z.strictObject({
			...viewResultBase,
			kind: z.literal("javascript-facts"),
			view: javascriptFactsViewRequestSchema,
			parent_operation: z.literal("analyze_javascript_application"),
			rows: z.array(javascriptFactRowSchema),
			source_coverage: javascriptApplicationSourceCoverageSchema
		});
		artifactInventorySummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.enum(["inspect_artifact", "inventory_artifact"]),
			summary: artifactInventorySummarySchema
		});
		desktopApplicationSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_desktop_application"),
			summary: desktopSummarySchema
		});
		wasmArtifactSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_wasm_artifact"),
			summary: wasmSummarySchema
		});
		machoSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_macho"),
			summary: machoSummarySchema
		});
		interfaceBuilderSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("decode_interface_builder"),
			resource_root: bundleResourceRootSchema.optional(),
			summary: interfaceBuilderSummarySchema
		});
		evmInterfaceSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_evm_interface"),
			summary: evmSummarySchema
		});
		managedArtifactSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_managed_artifact"),
			summary: managedSummarySchema
		});
		managedMemberSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_managed_members"),
			summary: managedMemberSummarySchema
		});
		webNetworkCaptureSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_web_network_capture"),
			summary: captureSummarySchema
		});
		androidPackageSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_android_package"),
			summary: androidPackageSummarySchema
		});
		pcapCaptureSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_pcap_capture"),
			summary: pcapSummarySchema
		});
		dartAotSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_dart_aot"),
			summary: dartAotSummarySchema
		});
		javaScriptRoutesViewResultSchema = z.strictObject({
			...viewResultBase,
			artifact: artifactSchema.nullable(),
			kind: z.literal("javascript-routes"),
			parent_operation: z.enum(["analyze_javascript_application", "analyze_web_bundle"]),
			view: javaScriptRoutesViewRequestSchema,
			inventory_id: javaScriptRouteInventorySchema.shape.inventory_id,
			source_manifest_sha256: digestSchema,
			source_coverage: javaScriptRouteInventorySchema.shape.coverage,
			inventory_capacity: javaScriptRouteInventorySchema.shape.capacity,
			capture_url: z.string().nullable(),
			items: javaScriptRoutesViewItemsSchema,
			sources: z.array(javaScriptRoutesSourceReferenceSchema),
			summary: javaScriptRoutesViewSummarySchema.nullable(),
			byte_limited: z.boolean()
		});
		gpuCodeObjectsSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_gpu_code_objects"),
			summary: gpuCodeObjectsSummarySchema
		});
		gpuCodeObjectsPageViewResultSchema = z.strictObject({
			kind: z.literal("gpu-code-objects"),
			view: gpuCodeObjectsViewRequestSchema,
			items: gpuCodeObjectsItemsSchema,
			ptx: gpuCodeObjectsPtxPageSchema.nullable(),
			source_coverage: gpuCodeObjectsObjectSchema.shape.coverage,
			...viewResultBase,
			parent_operation: z.literal("inspect_gpu_code_objects")
		});
		apkSignatureSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_apk_signature"),
			summary: apkSignatureSummarySchema
		});
		apkSignaturePageViewResultSchema = z.strictObject({
			...viewResultBase,
			kind: z.literal("apk-signature"),
			parent_operation: z.literal("inspect_apk_signature"),
			view: apkSignatureViewRequestSchema,
			items: apkSignatureViewItemsSchema,
			source_coverage: apkSignatureSourceCoverageSchema
		});
		modelArtifactSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_model_artifact"),
			summary: modelArtifactSummarySchema
		});
		modelArtifactPageViewResultSchema = z.strictObject({
			kind: z.literal("model-artifact"),
			view: modelArtifactViewRequestSchema,
			items: modelArtifactViewItemsSchema,
			...viewResultBase,
			...modelArtifactViewContextSchema.shape,
			parent_operation: z.literal("inspect_model_artifact")
		});
		il2cppMetadataSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("inspect_il2cpp_metadata"),
			summary: il2cppMetadataSummarySchema
		});
		nativeInventorySummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			...nativeInventoryViewContext,
			parent_operation: nativeInventoryOperationSchema,
			artifact: artifactSchema.nullable(),
			summary: nativeInventorySummarySchema
		});
		nativeFunctionMatchingSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			artifact: z.null(),
			parent_operation: z.literal("match_native_functions"),
			summary: nativeFunctionMatchingViewContextSchema
		});
		declaredFacetCountSchema = z.number().int().nonnegative().nullable().describe("Observed rows; null when facet_availability declares the facet unavailable, so no rows is not evidence of none.");
		recordedFacetCountSchema = z.number().int().nonnegative().nullable().describe("Observed rows; null when the dossier did not record the facet (the native facet view reports it not recorded), so no rows is not evidence of none.");
		valueFlowFacetCountSchema = z.number().int().nonnegative().nullable().describe("Observed rows; null when value_flow.available is false because native_value_flow was not recorded or the provider declared it unavailable (unknowns names which), so no rows is not evidence of none.");
		nativeFunctionSummarySchema = z.strictObject({
			procedure: z.strictObject({
				name: z.string(),
				address: z.string()
			}),
			pseudocode: z.strictObject({
				available: z.boolean().describe("Provider facet_availability for pseudocode when declared; otherwise whether decompiled text is present. The flag is authoritative over raw length."),
				code_units: z.number().int().nonnegative().describe("Pseudocode length in UTF-16 code units, the unit inspect_analysis_view pages pseudocode by.")
			}),
			value_flow: z.strictObject({
				available: z.boolean(),
				truncated: z.boolean().describe("True only when value-flow is available and the provider truncated it; false when value-flow is unavailable (see available).")
			}),
			facet_availability: functionFacetAvailabilitySchema.nullable().describe("The provider's declared availability per facet, or null when it declared none. Unavailable facets name their reason here and in unknowns."),
			counts: z.strictObject({
				assembly: declaredFacetCountSchema,
				basic_blocks: declaredFacetCountSchema,
				comments: declaredFacetCountSchema,
				callers: declaredFacetCountSchema,
				callees: declaredFacetCountSchema,
				incoming_references: declaredFacetCountSchema,
				outgoing_references: declaredFacetCountSchema,
				unresolved_calls: recordedFacetCountSchema,
				referenced_strings: declaredFacetCountSchema,
				referenced_names: declaredFacetCountSchema,
				swift_string_literals: recordedFacetCountSchema,
				swift_string_literal_omissions: recordedFacetCountSchema,
				value_flow_operations: valueFlowFacetCountSchema,
				value_flow_def_use: valueFlowFacetCountSchema,
				value_flow_effects: valueFlowFacetCountSchema,
				value_flow_parameters: valueFlowFacetCountSchema,
				value_flow_parameter_uses: valueFlowFacetCountSchema
			}),
			limitation_count: z.number().int().nonnegative()
		});
		nativeFunctionSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			parent_operation: z.literal("analyze_function"),
			procedure_address: z.string().nullable(),
			summary: nativeFunctionSummarySchema
		});
		sourceToBundleSummaryViewResultSchema = z.strictObject({
			...summaryViewResultBase,
			artifact: z.null(),
			parent_operation: z.literal("compare_source_to_bundle"),
			summary: sourceToBundleViewContextSchema
		});
		sourceToBundlePageViewResultSchema = z.strictObject({
			...viewResultBase,
			...sourceToBundleViewContextSchema.shape,
			kind: z.literal("source-to-bundle"),
			artifact: z.null(),
			parent_operation: z.literal("compare_source_to_bundle"),
			view: sourceToBundleViewRequestSchema,
			items: sourceToBundleViewItemsSchema
		});
		analysisViewResultSchema = z.discriminatedUnion("kind", [
			javaScriptRoutesViewResultSchema,
			sourceToBundlePageViewResultSchema,
			z.strictObject({
				...viewResultBase,
				...nativeFunctionMatchingViewContextSchema.shape,
				kind: z.literal("function-matches"),
				artifact: z.null(),
				view: nativeFunctionMatchingViewRequestSchema,
				items: nativeFunctionMatchingViewItemsSchema,
				parent_operation: z.literal("match_native_functions")
			}),
			z.strictObject({
				...viewResultBase,
				...apiSurfaceFields,
				kind: z.literal("api-surface"),
				parent_operation: z.literal("inspect_web_network_capture"),
				view: apiSurfaceViewSchema,
				artifact: z.strictObject({
					path: z.string(),
					sha256: digestSchema.nullable()
				})
			}),
			z.strictObject({
				...viewResultBase,
				...environmentManifestFields,
				kind: z.literal("environment-manifest"),
				parent_operation: z.enum(["inspect_web_network_capture", "capture_browser_scenario"]),
				view: environmentManifestViewRequestSchema
			}),
			z.strictObject({
				...viewResultBase,
				...environmentStateFields,
				kind: z.literal("environment-state"),
				parent_operation: z.enum(["inspect_web_network_capture", "capture_browser_scenario"]),
				view: environmentStateViewRequestSchema
			}),
			z.strictObject({
				...viewResultBase,
				...environmentCoverageFields,
				kind: z.literal("environment-coverage"),
				parent_operation: z.enum(["inspect_web_network_capture", "capture_browser_scenario"]),
				view: environmentCoverageViewRequestSchema
			}),
			z.discriminatedUnion("parent_operation", [
				erlangBeamSummaryViewResultSchema,
				devicetreeSummaryViewResultSchema,
				pythonPycSummaryViewResultSchema,
				nativeExportsSummaryViewResultSchema,
				byteEntropySummaryViewResultSchema,
				gdbCommandSummaryViewResultSchema,
				objdumpSummaryViewResultSchema,
				fridaSessionStatusSummaryViewResultSchema,
				goBinarySummaryViewResultSchema,
				rustBinarySummaryViewResultSchema,
				binaryLayoutSummaryViewResultSchema,
				desktopApplicationSummaryViewResultSchema,
				javascriptApplicationSummaryViewResultSchema,
				artifactInventorySummaryViewResultSchema,
				wasmArtifactSummaryViewResultSchema,
				machoSummaryViewResultSchema,
				interfaceBuilderSummaryViewResultSchema,
				evmInterfaceSummaryViewResultSchema,
				managedArtifactSummaryViewResultSchema,
				managedMemberSummaryViewResultSchema,
				webNetworkCaptureSummaryViewResultSchema,
				androidPackageSummaryViewResultSchema,
				pcapCaptureSummaryViewResultSchema,
				dartAotSummaryViewResultSchema,
				il2cppMetadataSummaryViewResultSchema,
				apkSignatureSummaryViewResultSchema,
				modelArtifactSummaryViewResultSchema,
				gpuCodeObjectsSummaryViewResultSchema,
				nativeInventorySummaryViewResultSchema,
				nativeFunctionMatchingSummaryViewResultSchema,
				nativeFunctionSummaryViewResultSchema,
				sourceToBundleSummaryViewResultSchema
			]),
			z.strictObject({
				...viewResultBase,
				kind: z.literal("devicetree"),
				parent_operation: z.literal("inspect_devicetree"),
				view: devicetreeViewRequestSchema,
				devicetree: devicetreePageContextSchema,
				items: devicetreeViewItemsSchema
			}),
			erlangBeamTableViewResultSchema,
			pythonPycCodeObjectsViewResultSchema,
			z.strictObject({
				...viewResultBase,
				kind: z.literal("native-exports"),
				parent_operation: z.literal("inspect_native_exports"),
				view: nativeExportsViewRequestSchema,
				exports: nativeExportsSummarySchema,
				items: nativeExportsViewItemsSchema
			}),
			z.strictObject({
				...viewResultBase,
				...nativeInventoryViewContext,
				kind: z.literal("native-inventory"),
				parent_operation: nativeInventoryOperationSchema,
				artifact: artifactSchema.nullable(),
				view: nativeInventoryViewRequestSchema,
				rows: z.array(nativeInventoryViewRowSchema)
			}),
			z.strictObject({
				kind: z.literal("protobuf"),
				view: protobufViewRequestSchema,
				items: protobufViewItemsSchema,
				...viewResultBase,
				...protobufViewContextSchema.shape,
				parent_operation: z.literal("inspect_web_network_capture")
			}),
			z.strictObject({
				kind: z.literal("capture"),
				view: captureViewRequestSchema,
				items: captureViewItemsSchema,
				...viewResultBase,
				parent_operation: z.literal("inspect_web_network_capture")
			}),
			z.strictObject({
				kind: z.literal("qlog"),
				view: qlogViewRequestSchema,
				page: qlogViewPageSchema,
				context: qlogViewContextSchema,
				...viewResultBase,
				parent_operation: z.literal("inspect_web_network_capture")
			}),
			z.strictObject({
				kind: z.literal("pcap"),
				view: pcapViewRequestSchema,
				page: pcapViewPageSchema,
				source_coverage: z.enum(["complete", "partial"]),
				...viewResultBase,
				parent_operation: z.literal("inspect_pcap_capture")
			}),
			z.strictObject({
				kind: z.literal("facet"),
				view: facetViewSchema,
				facet: jsonValueSchema,
				...viewResultBase
			}),
			z.strictObject({
				...viewResultBase,
				...goBinaryViewContextSchema.shape,
				kind: z.literal("go"),
				parent_operation: z.literal("inspect_go_binary"),
				view: goBinaryViewRequestSchema,
				page: goBinaryViewPageSchema
			}),
			rustBinaryPageViewResultSchema,
			z.strictObject({
				kind: z.literal("item"),
				view: itemViewSchema,
				item: jsonValueSchema,
				...viewResultBase
			}),
			z.strictObject({
				kind: z.literal("page"),
				view: pageViewSchema,
				items: z.array(jsonValueSchema),
				...viewResultBase
			}),
			javascriptModuleReferencesViewResultSchema,
			javascriptFactsViewResultSchema,
			z.strictObject({
				kind: z.literal("native"),
				view: nativeViewSchema,
				procedure_address: z.string().nullable(),
				item: jsonValueSchema,
				...viewResultBase
			}),
			z.strictObject({
				kind: z.literal("wasm"),
				view: wasmViewRequestSchema,
				item: wasmViewItemSchema,
				...viewResultBase
			}),
			z.strictObject({
				kind: z.literal("desktop-application"),
				view: desktopViewRequestSchema,
				items: desktopViewItemsSchema,
				...viewResultBase,
				source_coverage: desktopCoverageSchema,
				parent_operation: z.literal("inspect_desktop_application")
			}),
			z.strictObject({
				kind: z.literal("macho"),
				view: machoViewRequestSchema,
				item: machoViewItemSchema,
				...viewResultBase,
				...machoViewContextSchema.shape,
				parent_operation: z.literal("inspect_macho")
			}),
			z.strictObject({
				kind: z.literal("interface-builder"),
				view: interfaceBuilderViewRequestSchema,
				items: interfaceBuilderViewItemsSchema,
				...viewResultBase,
				resource_root: bundleResourceRootSchema.optional(),
				...interfaceBuilderViewContextSchema.shape,
				parent_operation: z.literal("decode_interface_builder")
			}),
			z.strictObject({
				kind: z.literal("evm"),
				view: evmViewRequestSchema,
				item: evmViewItemSchema,
				...viewResultBase,
				parent_operation: z.literal("inspect_evm_interface")
			}),
			z.strictObject({
				kind: z.literal("managed"),
				view: managedViewRequestSchema,
				item: managedViewItemSchema,
				...viewResultBase,
				...managedViewContextSchema.shape,
				parent_operation: z.literal("inspect_managed_artifact")
			}),
			z.strictObject({
				kind: z.literal("managed-members"),
				view: managedMembersViewRequestSchema,
				page: managedMembersViewPageSchema,
				...viewResultBase,
				...managedMembersViewContextSchema.shape,
				parent_operation: z.literal("inspect_managed_members")
			}),
			z.strictObject({
				kind: z.literal("android"),
				view: androidViewRequestSchema,
				item: androidManifestViewItemSchema,
				...viewResultBase,
				parent_operation: z.literal("inspect_android_package")
			}),
			z.strictObject({
				kind: z.literal("dart-aot"),
				view: dartAotViewRequestSchema,
				items: z.array(z.string()),
				...viewResultBase,
				...dartAotViewContextSchema.shape,
				parent_operation: z.literal("inspect_dart_aot")
			}),
			apkSignaturePageViewResultSchema,
			modelArtifactPageViewResultSchema,
			gpuCodeObjectsPageViewResultSchema,
			z.strictObject({
				kind: z.literal("il2cpp-metadata"),
				view: il2cppMetadataViewRequestSchema,
				items: il2cppMetadataViewItemsSchema,
				...viewResultBase,
				...il2cppMetadataViewContextSchema.shape,
				parent_operation: z.literal("inspect_il2cpp_metadata")
			}),
			z.strictObject({
				kind: z.literal("inventory"),
				view: artifactInventoryViewRequestSchema,
				source_coverage: artifactInventoryCoverageSchema.exactOptional(),
				manifest: artifactGraphManifestSchema,
				inventory_evidence_ids: z.array(prefixedDigestSchema("ev")).min(1),
				source_complete: z.boolean(),
				items: artifactInventoryItemsSchema,
				...viewResultBase
			})
		]);
		sealAnalysisView = (projection) => analysisViewResultSchema.parse({
			...projection,
			view_digest: digestCanonicalValue(projection, "Analysis view")
		});
		parentDigest = (evidenceId) => evidenceId.slice(3);
		parseJavaScriptParent = (input) => {
			try {
				const steps = parseOwnedJavaScriptApplicationAnalysisSteps(input);
				let step = steps.next();
				while (!step.done) step = steps.next();
				return ok(step.value);
			} catch (cause) {
				if (!(cause instanceof z.ZodError)) throw cause;
				return err(analysisViewResultInputError(input, cause));
			}
		};
		unsupportedParent = (parent) => new AnalysisUnsupportedTargetError(INSPECT_ANALYSIS_VIEW_OPERATION, parentArtifactPath(parent), parent.operation === "capture_browser_scenario" ? `Parent Evidence operation "capture_browser_scenario" supports only the environment-manifest, environment-state and environment-coverage views.` : `Parent Evidence operation ${JSON.stringify(parent.operation)} does not support analysis views. Use completed Evidence from a supported parent operation with a compatible view. For a summary receipt, use its normalized_result.parent_evidence_id rather than the receipt's own evidence_id.`);
		parentArtifactPath = (parent) => {
			if (typeof parent.normalizedResult === "object" && parent.normalizedResult !== null && "artifact" in parent.normalizedResult && typeof parent.normalizedResult.artifact === "object" && parent.normalizedResult.artifact !== null && "path" in parent.normalizedResult.artifact && typeof parent.normalizedResult.artifact.path === "string") return parent.normalizedResult.artifact.path;
			if (typeof parent.normalizedResult === "object" && parent.normalizedResult !== null && "input_path" in parent.normalizedResult && typeof parent.normalizedResult.input_path === "string") return parent.normalizedResult.input_path;
			return parent.evidenceId;
		};
		retainedViewProjectors = new Map([
			["inspect_erlang_beam", projectErlangBeamView],
			["inspect_devicetree", projectDevicetreeView],
			["inspect_native_exports", projectNativeExportsView],
			["inspect_python_pyc", projectPythonPycView],
			["frida_session_status", projectFridaSessionStatusView],
			["gdb_console", projectCommandObservationView],
			["inspect_with_objdump", projectCommandObservationView],
			["inspect_go_binary", projectGoBinaryView],
			["inspect_rust_binary", projectRustBinaryView],
			...NATIVE_INVENTORY_OPERATIONS.map((operation) => [operation, projectNativeInventoryView]),
			["inspect_desktop_application", projectDesktopApplicationView],
			["inspect_wasm_artifact", projectWasmArtifactView],
			["inspect_macho", projectMachoView],
			["decode_interface_builder", projectInterfaceBuilderView],
			["inspect_evm_interface", projectEvmInterfaceView],
			["inspect_managed_artifact", projectManagedArtifactView],
			["inspect_managed_members", projectManagedMemberView],
			["inspect_android_package", projectAndroidPackageView],
			["inspect_dart_aot", projectDartAotView],
			["inspect_il2cpp_metadata", projectIl2cppMetadataView],
			["inspect_apk_signature", projectApkSignatureView],
			["inspect_model_artifact", projectModelArtifactView],
			["inspect_gpu_code_objects", projectGpuCodeObjectsView],
			["match_native_functions", projectNativeFunctionMatchingView],
			["compare_source_to_bundle", projectSourceToBundleView],
			["inspect_artifact", projectArtifactInventoryView],
			["inventory_artifact", projectArtifactInventoryView]
		]);
		prepareAnalysisViewProjection = (view) => {
			const accumulators = {
				apiSurface: view.kind === "api-surface" ? createApiSurfaceAccumulator(view) : undefined,
				manifest: view.kind === "environment-manifest" ? createEnvironmentManifestAccumulator(view) : undefined,
				state: view.kind === "environment-state" || view.kind === "environment-coverage" ? createEnvironmentStateAccumulator(view) : undefined
			};
			const accumulator = accumulators.apiSurface ?? accumulators.manifest ?? accumulators.state;
			return {
				admitInlineEvidence: (value) => accumulator === undefined ? admitAnalysisViewData(value, true) : accumulator.admitInlineEvidence(value),
				project: (parent) => projectAnalysisView(parent, view, accumulators)
			};
		};
		isGroupingView = (view) => view.kind === "api-surface" || view.kind === "environment-manifest" || view.kind === "environment-state" || view.kind === "environment-coverage";
		projectGroupingView = (parent, view, accumulators) => {
			if (view.kind === "api-surface") return projectWebNetworkApiSurfaceView(parent, view, accumulators.apiSurface);
			if (view.kind === "environment-manifest") return projectEnvironmentManifestView(parent, view, accumulators.manifest);
			if (view.kind === "environment-coverage") return projectEnvironmentCoverageView(parent, view, accumulators.state);
			return projectEnvironmentStateView(parent, view, accumulators.state);
		};
		projectAnalysisView = (parent, view, accumulators = {}) => {
			const digest = parentDigest(parent.evidenceId);
			if (!digestSchema.safeParse(digest).success) return err(analysisViewInputError([{
				path: ["source"],
				reason: "invalid_format",
				message: "Parent Evidence ID is not a digest-backed identifier."
			}]));
			if (view.kind === "javascript-routes") {
				const projected = projectJavaScriptRoutesView(parent, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (isGroupingView(view)) {
				const grouped = projectGroupingView(parent, view, accumulators);
				return grouped.ok ? ok(sealAnalysisView(grouped.value)) : grouped;
			}
			if (parent.operation === "inspect_web_network_capture") {
				const projected = projectWebNetworkCaptureView(parent, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (parent.operation === "inspect_pcap_capture") {
				const projected = projectPcapCaptureView(parent, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (parent.operation === "inspect_byte_entropy") {
				const report = parseAnalysisViewResult(byteEntropySchema, parent);
				if (!report.ok) return report;
				const projected = projectByteEntropyView(parent, report.value, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (parent.operation === "inspect_binary_layout") {
				const layout = parseAnalysisViewResult({ safeParse: safeParseOwnedBinaryLayout }, parent);
				if (!layout.ok) return layout;
				const projected = projectBinaryLayoutView(parent, layout.value, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (parent.operation === "analyze_javascript_application") {
				const analysis = parseJavaScriptParent(parent.normalizedResult);
				if (!analysis.ok) return analysis;
				const projected = projectJavaScriptApplicationView(parent, analysis.value, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			if (parent.operation === "analyze_function") {
				const native = parseAnalysisViewResult(functionDossierSchema, parent);
				if (!native.ok) return native;
				const projected = projectNativeFunctionView(parent, native.value, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			const project = retainedViewProjectors.get(parent.operation);
			if (project !== undefined) {
				const projected = project(parent, view);
				return projected.ok ? ok(sealAnalysisView(projected.value)) : projected;
			}
			return err(unsupportedParent(parent));
		};
	})))();
}

//#endregion
export { APK_SIGNATURE_LIMITATIONS, DEFAULT_EVM_TIMEOUT_MS, IL2CPP_METADATA_MAGIC, IL2CPP_METADATA_VERSIONS, INSPECT_ANALYSIS_VIEW_OPERATION, MAX_DEVICETREE_FILE_BYTES, MAX_EVM_TIMEOUT_MS, MAX_FLUTTER_LIBRARY_PATH_BYTES, MAX_INSPECT_ERLANG_BEAM_ATOMS, MAX_INSPECT_ERLANG_BEAM_FILE_BYTES, MAX_INSPECT_ERLANG_BEAM_TABLE_ROWS, MAX_INSPECT_NATIVE_EXPORTS_FILE_BYTES, MAX_NATIVE_EXPORT_ROWS, PCAP_CAPTURE_UNSUPPORTED_HOST_REASON, PYTHON_PYC_LIMIT_MAXIMA, RUST_AUDITABLE_FORMAT_VERSIONS, TEMPLATE_RULES, allLines, analysisSearchInput, analysisSearchPredicate, analysisSearchQuerySchema, analysisViewResultSchema, androidInputSchemas, androidPackageInspectionInputSchema, androidPackageSummaryViewResultSchema, androidRequestSchema, androidResultSchemas, apkSignatureMatchesSubject, apkSignaturePageViewResultSchema, apkSignatureResultSchema, apkSignatureSummaryViewResultSchema, apkSignatureUninterpretedBytes, artifactInventorySummaryViewResultSchema, binaryLayoutPayloadSchema, binaryLayoutSchema, binaryLayoutSummaryViewResultSchema, binaryMetadataArchitecture, bodyProblem, bulkCollectionOf, byteEntropySchema, byteEntropySummaryViewResultSchema, callRenewal, changesState, collectionMatch, collectionPathOf, commandEvidenceDetailSchema, commandObservationSchema, composedPartText, composedValue, computeBlockEntropy, createdFields, cyclicDependencyIndices, dartAotInspectionInputSchema, dartAotSummaryViewResultSchema, decodeRetainedBase64, decodedSegment, demangleSwiftSchema, deriveApkPosture, desktopApplicationSchema, desktopApplicationSummaryViewResultSchema, devicetreeSchema, devicetreeSummaryViewResultSchema, dexDescriptorSchema, dexStaticValueSchema, documentBodyProblem, entropyFromCounts, environmentCoverageSchema, erlangBeamCompleteDeliveryShape, erlangBeamDeliverySchema, erlangBeamSchema, erlangBeamSummaryDeliveryShape, erlangBeamSummaryViewResultSchema, erlangBeamTableViewResultSchema, evaluateQuery, evmInterfaceSchema, evmInterfaceSummaryViewResultSchema, flutterInputSchemas, flutterRequestSchema, flutterResultSchemas, formatClock, fridaSessionObservationSchema, fridaSessionStatusInputSchema, fridaSessionStatusSchema, fridaSessionStatusSummaryViewResultSchema, gdbCommandResultSchema, gdbCommandSummaryViewResultSchema, generatedIntegerDigits, goBinarySchema, goBinarySummaryViewResultSchema, gpuCodeObjectsPageViewResultSchema, gpuCodeObjectsPartialSchema, gpuCodeObjectsSchema, gpuCodeObjectsSummaryViewResultSchema, il2cppMetadataSchema, il2cppMetadataSectionNames, il2cppMetadataSummaryViewResultSchema, indexBrowserScenarioTransactions, init_EnvironmentManifestAccumulator, init_EnvironmentStateAccumulator, init_analysisSearch, init_analysisSearchContract, init_analysisView, init_analysisViewErrors, init_androidAnalysis, init_apkSignatureQuery, init_apkSignatureReport, init_beam, init_binaryLayout, init_binaryMetadataArchitecture, init_browserScenarioTransactions, init_byteEntropy, init_commandObservation, init_desktopApplication, init_devicetree, init_environmentCoverageView, init_environmentManifestOrigin, init_environmentManifestRules, init_environmentStateListQuery, init_environmentStatePaging, init_environmentStateRules, init_environmentStateVariants, init_environmentStateWriteAddress, init_environmentStateWriteApply, init_environmentStateWriteChecks, init_environmentStateWriteClockFormats, init_environmentStateWriteComposed, init_environmentStateWriteExplain, init_environmentStateWriteGenerated, init_environmentStateWriteLinks, init_environmentStateWriteObserve, init_environmentStateWriteRules, init_environmentStateWriteStamps, init_environmentStateWriteValues, init_erlangBeamView, init_evmInterface, init_exactJsonNumber, init_flutterBuildAnalysis, init_fridaSessionStatus, init_functionMatching, init_goBinary, init_gpuCodeObjects, init_il2cppMetadata, init_javascriptRoutesView, init_modelArtifact, init_modelArtifactQuery, init_nativeExports, init_nativeInspection, init_pcapAnalysis, init_publicInput, init_pythonPyc, init_pythonPycView, init_recordedResponseBody, init_rustBinary, init_rustBinaryQuery, init_scenarioCaptureRecords, init_solidityMetadata, init_sourceToBundleView, init_webNetworkRouteTemplates, insertIndex, inspectAnalysisViewInputSchema, inspectApkSignatureInputSchema, inspectBinaryLayoutInputSchema, inspectByteEntropyInputSchema, inspectDesktopApplicationInputSchema, inspectDevicetreeInputSchema, inspectErlangBeamInputSchema, inspectEvmInterfaceInputSchema, inspectGoBinaryInputSchema, inspectGpuCodeObjectsInputSchema, inspectIl2cppMetadataInputSchema, inspectMachoSchema, inspectModelArtifactInputSchema, inspectNativeExportsInputSchema, inspectPlistSchema, inspectPythonPycInputSchema, inspectRustBinaryRequestSchema, inspectSignatureSchema, interfaceBuilderSummaryViewResultSchema, isAbsence, isExactJsonNumber, isJsonLike, isObject, isPagingParameter, isParam, isQueryPost, isUuid, javaScriptRoutesCompleteDeliveryShape, javaScriptRoutesDeliverySchema, javaScriptRoutesSummaryDeliveryShape, javaScriptRoutesViewResultSchema, javascriptApplicationSummaryViewResultSchema, likeGeneratedInteger, linkedCollection, listArchitecturesSchema, listItems, listsAll, literalSubstringPredicate, locateList, machoSummaryViewResultSchema, managedArtifactSummaryViewResultSchema, managedMemberSummaryViewResultSchema, matchesClockFormat, mediaTypeEssence, mergeEntropyRuns, missingRequiredFields, modelArtifactPageViewResultSchema, modelArtifactPartialSchema, modelArtifactSchema, modelArtifactSummaryViewResultSchema, namedEntities, nativeExportsSchema, nativeExportsSummaryViewResultSchema, nativeFunctionMatchingSchema, nativeFunctionMatchingSummaryViewResultSchema, nativeFunctionSummaryViewResultSchema, nativeInventorySummaryViewResultSchema, nestedClockValue, nextInteger, nextSequence, normalizedPath, objdumpSummaryViewResultSchema, optionalFields, pageBound, pagesOnly, parseExactJson, pathSegmentMatches, pathValuesOf, pcapCaptureHostSupported, pcapCaptureSummaryViewResultSchema, pcapInputSchemas, pcapRequestSchema, pcapResultSchemas, pinnedQuery, pointerTokens, prepareAnalysisViewProjection, primaryOrigin, publicInputStrictObject, pythonPycCodeObjectsViewResultSchema, pythonPycCompleteDeliveryShape, pythonPycDeliverySchema, pythonPycMagicEntry, pythonPycSchema, pythonPycSummaryDeliveryShape, pythonPycSummaryViewResultSchema, readClock, readRecordedRequestLine, readRecordedResponseBody, renderQueryList, renderStateEntity, renderStateList, renewUuids, replaceAt, replayReason, rustBinaryPageViewResultSchema, rustBinarySchema, rustBinarySummaryViewResultSchema, same, sameLinkedSource, scalarText, scenarioCaptureRecords, scenarioContentMediaType, seededInteger, seededLike, segmentRule, segmentsOf, selectedCollection, shownValue, solidityMetadataSchema, sourceToBundlePageViewResultSchema, sourceToBundleSummaryViewResultSchema, sourceToBundleViewRequestSchema, spelledLike, stateBodyJson, summarizeEnvironmentCoverage, unenveloped, updatedEntity, updatedFields, valueAt, wasmArtifactSummaryViewResultSchema, webNetworkCaptureSummaryViewResultSchema, webRoutesDeliverySchema, webRoutesSummaryDeliveryShape, withRead, writtenBulkResponse, writtenDocument, writtenResponse };