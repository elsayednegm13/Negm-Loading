import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_result, r as ok, t as err } from "./result-Dbqc_peo.js";
import { f as init_analysisErrorCore, s as AnalysisOutputError } from "./analysisErrorCore-Cl6H9zyu.js";
import { b as init_fixedTupleSchema, y as fixedTupleSchema } from "./evidence-CctoaA7x.js";
import { z } from "zod";

//#region dist/domain/native/nativeSymbol.js
var nativeSymbolMetadataSchema, nativeSymbolOrigin, hasStableNativeSymbol;
function init_nativeSymbol() {
	return (init_nativeSymbol = __esmMin((() => {
		nativeSymbolMetadataSchema = z.object({
			primary: z.boolean(),
			dynamic: z.boolean(),
			external: z.boolean(),
			type: z.string(),
			source: z.enum([
				"default",
				"analysis",
				"ai",
				"imported",
				"user_defined"
			])
		});
		nativeSymbolOrigin = (symbol) => symbol == null ? "unknown" : symbol.dynamic || symbol.source === "default" ? "generated" : "named";
		hasStableNativeSymbol = (name, symbol) => name.length > 0 && nativeSymbolOrigin(symbol) === "named";
	})))();
}

//#endregion
//#region dist/domain/native/addressCoordinate.js
var addressCoordinate;
function init_addressCoordinate() {
	return (init_addressCoordinate = __esmMin((() => {
		addressCoordinate = (value) => {
			const separator = value.lastIndexOf(":0x");
			if (separator === 0) return null;
			const space = separator < 0 ? null : value.slice(0, separator);
			const offset = separator < 0 ? value : value.slice(separator + 1);
			if (!/^0x[0-9a-f]+$/u.test(offset)) return null;
			return {
				space,
				offset: BigInt(offset)
			};
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeApiBoundary.js
var inferenceConfidenceSchema, inferenceEvidenceSchema, inferredBoundaryTypeFacts, inferredReturnTypeSchema, inferredParameterTypeSchema, jumpTableDataSourceSchema, jumpTableMappingSchema, jumpTableDefaultTargetSchema, inferredJumpTableSchema, availableNativeApiBoundarySchema, unavailableNativeApiBoundarySchema, nativeApiBoundarySchema, nativeApiInspectionSubstepSchema, nativeApiInspectionResultSchema;
function init_nativeApiBoundary() {
	return (init_nativeApiBoundary = __esmMin((() => {
		inferenceConfidenceSchema = z.enum([
			"low",
			"medium",
			"high"
		]);
		inferenceEvidenceSchema = z.object({
			kind: z.enum([
				"signature-source",
				"decompiler-type",
				"type-lock",
				"calling-convention",
				"jump-table"
			]),
			source: z.string().min(1),
			detail: z.string().min(1)
		}).strict();
		inferredBoundaryTypeFacts = {
			ordinal: z.int().min(0).nullable(),
			name: z.string().min(1).nullable(),
			data_type: z.string().min(1),
			size_bytes: z.int().min(0).nullable(),
			storage: z.string().min(1).nullable(),
			confidence: inferenceConfidenceSchema,
			evidence: z.array(inferenceEvidenceSchema).min(1),
			decompiler_artifacts: z.array(z.enum([
				"recovered-signature",
				"register-or-stack-storage",
				"compiler-generated-variable"
			]))
		};
		inferredReturnTypeSchema = z.strictObject({
			...inferredBoundaryTypeFacts,
			role: z.literal("return"),
			ordinal: z.null(),
			name: z.null()
		});
		inferredParameterTypeSchema = z.strictObject({
			...inferredBoundaryTypeFacts,
			role: z.literal("parameter"),
			ordinal: z.int().min(0)
		});
		jumpTableDataSourceSchema = z.object({
			address: z.string().min(1),
			provenance: z.enum([
				"ghidra-decompiler-load-table",
				"ghidra-dispatch-block-data-reference",
				"ghidra-aarch64-byte-table",
				"ghidra-aarch64-halfword-table"
			]),
			entry_size_bytes: z.int().min(1).nullable(),
			entry_count: z.int().min(0).nullable(),
			confidence: inferenceConfidenceSchema,
			evidence: z.array(inferenceEvidenceSchema).min(1)
		}).strict();
		jumpTableMappingSchema = z.object({
			case_value: z.int().nullable(),
			target_address: z.string().min(1),
			confidence: inferenceConfidenceSchema,
			evidence: z.array(inferenceEvidenceSchema).min(1)
		}).strict();
		jumpTableDefaultTargetSchema = z.strictObject({
			target_address: z.string().min(1),
			confidence: inferenceConfidenceSchema,
			evidence: z.array(inferenceEvidenceSchema).min(1)
		});
		inferredJumpTableSchema = z.object({
			dispatch_address: z.string().min(1),
			data_sources: z.array(jumpTableDataSourceSchema),
			mappings: z.array(jumpTableMappingSchema),
			default_targets: z.array(jumpTableDefaultTargetSchema),
			limitations: z.array(z.string())
		}).strict();
		availableNativeApiBoundarySchema = z.object({
			available: z.literal(true),
			provenance: z.string().min(1),
			signature_source: z.string().min(1),
			calling_convention: z.string().min(1),
			return_type: inferredReturnTypeSchema,
			parameters: z.array(inferredParameterTypeSchema),
			jump_tables: z.array(inferredJumpTableSchema),
			pseudocode: z.object({
				classification: z.literal("decompiler-generated-non-source"),
				compilable: z.literal(false)
			}).strict(),
			decompiler_artifacts: z.array(z.enum([
				"recovered-signature",
				"register-and-stack-variables",
				"compiler-generated-control-flow",
				"pointer-arithmetic",
				"pseudocode"
			])),
			limitations: z.array(z.string())
		}).strict();
		unavailableNativeApiBoundarySchema = z.object({
			available: z.literal(false),
			reason: z.string().min(1),
			residual_unknowns: z.array(z.string().min(1)).min(1)
		}).strict();
		nativeApiBoundarySchema = z.discriminatedUnion("available", [unavailableNativeApiBoundarySchema, availableNativeApiBoundarySchema]);
		nativeApiInspectionSubstepSchema = z.object({
			operation: z.enum([
				"analyze_function",
				"project_native_api_boundary",
				"preserve_residual_unknowns"
			]),
			status: z.enum(["completed", "unsupported"]),
			observations: z.array(z.string().min(1))
		}).strict();
		nativeApiInspectionResultSchema = z.object({
			procedure: z.object({
				address: z.string().min(1),
				name: z.string().min(1)
			}).strict(),
			boundary: nativeApiBoundarySchema,
			substeps: z.array(nativeApiInspectionSubstepSchema).length(3),
			unsupported_branches: z.array(z.string().min(1)),
			residual_unknowns: z.array(z.string().min(1))
		}).strict();
	})))();
}

//#endregion
//#region dist/domain/native/nativeValueFlow.js
var nativeVarnodeSchema, nativePcodeOperationSchema, nativePcodeDefUseSchema, nativePcodeEffectSchema, nativeValueFlowSchema;
function init_nativeValueFlow() {
	return (init_nativeValueFlow = __esmMin((() => {
		nativeVarnodeSchema = z.strictObject({
			kind: z.enum([
				"constant",
				"address",
				"register",
				"unique",
				"other"
			]),
			size_bytes: z.int().nonnegative(),
			location: z.string().nullable(),
			constant_hex: z.string().regex(/^[0-9a-f]+$/u).nullable()
		});
		nativePcodeOperationSchema = z.strictObject({
			id: z.string().min(1),
			address: z.string().min(1),
			sequence: z.int().nonnegative(),
			opcode: z.string().min(1),
			is_dead: z.boolean(),
			block_membership: z.enum([
				"member",
				"detached",
				"unavailable"
			]),
			inputs: z.array(nativeVarnodeSchema),
			output: nativeVarnodeSchema.nullable()
		});
		nativePcodeDefUseSchema = z.strictObject({
			definition: z.string().min(1),
			use: z.string().min(1),
			input_index: z.int().nonnegative()
		});
		nativePcodeEffectSchema = z.strictObject({
			operation: z.string().min(1),
			kind: z.enum([
				"memory_read",
				"memory_write",
				"conditional_branch",
				"indirect_branch",
				"direct_call",
				"indirect_call"
			]),
			operand_input: z.int().nonnegative().nullable(),
			value_input: z.int().nonnegative().nullable()
		});
		nativeValueFlowSchema = z.discriminatedUnion("available", [z.strictObject({
			available: z.literal(true),
			provenance: z.literal("ghidra-high-pcode"),
			operations: z.array(nativePcodeOperationSchema),
			def_use: z.array(nativePcodeDefUseSchema),
			effects: z.array(nativePcodeEffectSchema),
			parameters: z.array(z.strictObject({
				ordinal: z.int().nonnegative(),
				name: z.string(),
				data_type: z.string()
			})),
			parameter_uses: z.array(z.strictObject({
				ordinal: z.int().nonnegative(),
				use: z.string(),
				input_index: z.int().nonnegative()
			})),
			truncated: z.boolean(),
			omitted_operations_lower_bound: z.int().nonnegative(),
			known_omitted_inputs: z.int().nonnegative(),
			known_omitted_edges: z.int().nonnegative(),
			limitations: z.array(z.string().min(1))
		}), z.strictObject({
			available: z.literal(false),
			reason: z.string().min(1),
			limitations: z.array(z.string().min(1))
		})]);
	})))();
}

//#endregion
//#region dist/domain/native/nativeCallReference.js
var nativeCallClassificationSchema, nativeCallReferenceSchema;
function init_nativeCallReference() {
	return (init_nativeCallReference = __esmMin((() => {
		nativeCallClassificationSchema = z.strictObject({
			classification: z.enum([
				"none",
				"unknown",
				"direct",
				"objective_c"
			]),
			provider_type: z.number().int(),
			provenance: z.string().min(1)
		});
		nativeCallReferenceSchema = nativeCallClassificationSchema.extend({
			source_address: z.string(),
			target_address: z.string()
		});
	})))();
}

//#endregion
//#region dist/domain/hopperValues.js
var addressDistance, segmentSchema, unavailableAnalysisFactSchema, analysisStringSchema, analysisBookmarkSchema, functionBodySchema, functionBodyEntryAgrees, procedureClassificationSchema, procedureIdentitySchema, containingProcedureResolutionSchema, parseContainingProcedureResolution, localVariableSchema, functionInstructionWindowSchema, availableReferenceKindSchema, referenceKindSchema, unresolvedCallSchema, swiftStringLiteralFields, swiftStringLiteralSchema, swiftStringLiteralOmissionFields, swiftStringLiteralOmissionSchema, referenceEdgeSchema, facetAvailabilitySchema, functionFacetAvailabilitySchema, functionDossierSchema, parseFunctionDossier, parseRelatedAddresses, parseSegments, parseSegmentImageBase, projectBinaryOverview, parseDocuments, parseListCount, unwrapProperty, invalid;
function init_hopperValues() {
	return (init_hopperValues = __esmMin((() => {
		init_nativeSymbol();
		init_fixedTupleSchema();
		init_addressCoordinate();
		init_result();
		init_nativeApiBoundary();
		init_nativeValueFlow();
		init_nativeCallReference();
		init_analysisErrorCore();
		addressDistance = (start, end) => {
			const left = addressCoordinate(start);
			const right = addressCoordinate(end);
			if (left === null || right === null || left.space !== right.space) return null;
			const distance = right.offset - left.offset;
			if (distance < 0n || distance > BigInt(Number.MAX_SAFE_INTEGER)) return null;
			return Number(distance);
		};
		segmentSchema = z.object({
			name: z.string(),
			start: z.string(),
			end: z.string(),
			readable: z.boolean().nullable(),
			writable: z.boolean().nullable(),
			executable: z.boolean().nullable(),
			image_base: z.string().min(1).exactOptional(),
			address_space: z.string().min(1).exactOptional()
		});
		unavailableAnalysisFactSchema = z.object({
			available: z.literal(false),
			reason: z.string()
		}).strict();
		analysisStringSchema = z.object({
			address: z.string(),
			value: z.string(),
			provider_value: z.string().exactOptional().describe("Original provider display text, which may shorten the typed object."),
			decoding: unavailableAnalysisFactSchema.exactOptional().describe("When present, value retains native display text because typed bytes could not be decoded."),
			string: z.object({
				encoding: z.string().min(1),
				encoding_status: z.enum(["observed", "inferred"]).exactOptional().describe("Whether the provider declares the encoding or REA infers it from the typed bytes and native display. This does not establish the original source's intended encoding."),
				termination: z.enum(["missing", "present_or_not_required"]),
				byte_length: z.int().min(0)
			}).exactOptional()
		});
		analysisBookmarkSchema = z.strictObject({
			address: z.string(),
			name: z.string().nullable()
		});
		functionBodySchema = z.discriminatedUnion("available", [unavailableAnalysisFactSchema, z.strictObject({
			available: z.literal(true),
			provenance: z.string().min(1),
			ranges: z.array(z.strictObject({
				start: z.string(),
				end: z.string().describe("Inclusive last address of this observed body range.")
			})),
			total_bytes: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			span_bytes: z.int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
			non_contiguous: z.boolean(),
			contains_entry: z.boolean()
		}).superRefine((body, context) => {
			let total = 0n;
			const bounds = new Map();
			const closedSpaces = new Set();
			let previousSpace;
			for (const range of body.ranges) {
				const start = addressCoordinate(range.start);
				const end = addressCoordinate(range.end);
				if (start === null || end === null || start.space !== end.space || end.offset < start.offset) {
					context.addIssue({
						code: "custom",
						message: "Function body range has invalid inclusive endpoints"
					});
					return;
				}
				if (previousSpace !== undefined && previousSpace !== start.space) closedSpaces.add(previousSpace);
				const previous = bounds.get(start.space);
				if (closedSpaces.has(start.space) || previous !== undefined && start.offset <= previous.end + 1n) {
					context.addIssue({
						code: "custom",
						message: "Function body ranges must be ordered, disjoint and maximal within each address space"
					});
					return;
				}
				bounds.set(start.space, {
					start: previous?.start ?? start.offset,
					end: end.offset
				});
				previousSpace = start.space;
				total += end.offset - start.offset + 1n;
			}
			const onlyBounds = bounds.size === 1 ? [...bounds.values()][0] : undefined;
			const span = bounds.size === 0 ? 0n : onlyBounds === undefined ? null : onlyBounds.end - onlyBounds.start + 1n;
			const reportedSpan = body.span_bytes === null ? null : BigInt(body.span_bytes);
			if (total !== BigInt(body.total_bytes) || span !== reportedSpan || body.non_contiguous !== body.ranges.length > 1) context.addIssue({
				code: "custom",
				message: "Function body counts, enclosing span or contiguity disagree with inclusive ranges"
			});
		})]);
		functionBodyEntryAgrees = (body, address) => {
			if (!body.available) return true;
			const entry = addressCoordinate(address);
			if (entry === null) return false;
			const contains = body.ranges.some((range) => {
				const start = addressCoordinate(range.start);
				const end = addressCoordinate(range.end);
				return start !== null && end !== null && start.space === entry.space && entry.offset >= start.offset && entry.offset <= end.offset;
			});
			return contains === body.contains_entry;
		};
		procedureClassificationSchema = z.object({
			external: z.boolean(),
			thunk: z.boolean(),
			thunk_target: z.string().nullable(),
			provenance: z.string().min(1)
		}).strict();
		procedureIdentitySchema = z.object({
			address: z.string(),
			name: z.string(),
			symbol: nativeSymbolMetadataSchema.nullable().exactOptional(),
			classification: procedureClassificationSchema.nullable(),
			body: functionBodySchema
		}).strict().superRefine((identity, context) => {
			if (!functionBodyEntryAgrees(identity.body, identity.address)) context.addIssue({
				code: "custom",
				message: "Function body entry membership disagrees with procedure identity"
			});
		});
		containingProcedureResolutionSchema = z.discriminatedUnion("found", [z.object({
			query_address: z.string(),
			found: z.literal(true),
			procedure: procedureIdentitySchema
		}), z.object({
			query_address: z.string(),
			found: z.literal(false),
			procedure: z.null(),
			reason: z.enum(["outside_segments", "not_in_procedure"])
		})]);
		parseContainingProcedureResolution = (value) => {
			const parsed = containingProcedureResolutionSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new AnalysisOutputError("resolve_containing_procedure", "expected a containing-procedure resolution", { cause: parsed.error }));
		};
		localVariableSchema = z.object({
			description: z.string(),
			provenance: z.string().min(1),
			name: z.string().nullable().exactOptional(),
			stack_displacement: z.string().regex(/^-?\d+$/u).nullable().exactOptional().describe("Observed signed stack byte displacement, encoded as decimal to preserve precision.")
		}).strict();
		functionInstructionWindowSchema = z.object({
			procedure: procedureIdentitySchema,
			instructions: z.array(z.string()),
			limitations: z.array(z.string())
		}).strict();
		availableReferenceKindSchema = z.object({
			available: z.literal(true),
			provenance: z.string().min(1),
			type: z.string(),
			flow: z.boolean(),
			call: z.boolean(),
			jump: z.boolean(),
			data: z.boolean(),
			read: z.boolean(),
			write: z.boolean(),
			indirect: z.boolean(),
			computed: z.boolean(),
			conditional: z.boolean(),
			terminal: z.boolean(),
			primary: z.boolean(),
			operand_index: z.int(),
			external: z.boolean()
		}).strict();
		referenceKindSchema = z.discriminatedUnion("available", [unavailableAnalysisFactSchema, availableReferenceKindSchema]);
		unresolvedCallSchema = z.strictObject({
			address: z.string(),
			reason: z.string()
		});
		swiftStringLiteralFields = {
			source_address: z.string().describe("Instruction that consumes both words: a call, tail call, return, or paired store."),
			value: z.string().describe("Decoded UTF-8 text, including the canonical empty string."),
			registers: fixedTupleSchema([z.string(), z.string()]),
			words: fixedTupleSchema([z.string(), z.string()]).describe("Observed constant register values, in register order.")
		};
		swiftStringLiteralSchema = z.discriminatedUnion("representation", [z.strictObject({
			...swiftStringLiteralFields,
			representation: z.literal("small").describe("The UTF-8 bytes are inside the two words."),
			address: z.null().describe("A small literal has no storage of its own.")
		}), z.strictObject({
			...swiftStringLiteralFields,
			representation: z.literal("large").describe("An immortal literal whose words hold its count and a pointer to its bytes."),
			address: z.string().describe("Address of a large literal's bytes.")
		})]);
		swiftStringLiteralOmissionFields = {
			source_address: swiftStringLiteralFields.source_address,
			byte_length: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
			reason: z.enum(["capacity", "unresolved_jump"]).describe("Why this candidate is omitted: capacity stopped decoding, or an unresolved jump left its use unknown."),
			registers: swiftStringLiteralFields.registers,
			words: swiftStringLiteralFields.words
		};
		swiftStringLiteralOmissionSchema = z.discriminatedUnion("representation", [z.strictObject({
			...swiftStringLiteralOmissionFields,
			representation: z.literal("small"),
			address: z.null()
		}), z.strictObject({
			...swiftStringLiteralOmissionFields,
			representation: z.literal("large"),
			address: z.string().describe("Address of the literal's bytes.")
		})]);
		referenceEdgeSchema = z.object({
			source_address: z.string(),
			target_address: z.string(),
			source_procedure: procedureIdentitySchema.nullable(),
			target_procedure: procedureIdentitySchema.nullable(),
			kind: referenceKindSchema,
			call: nativeCallClassificationSchema.exactOptional()
		}).strict();
		facetAvailabilitySchema = z.discriminatedUnion("available", [z.object({ available: z.literal(true) }).strict(), z.object({
			available: z.literal(false),
			reason: z.string().min(1)
		}).strict()]);
		functionFacetAvailabilitySchema = z.object({
			pseudocode: facetAvailabilitySchema.exactOptional(),
			assembly: facetAvailabilitySchema.exactOptional(),
			comments: facetAvailabilitySchema.exactOptional(),
			callers: facetAvailabilitySchema.exactOptional(),
			callees: facetAvailabilitySchema.exactOptional(),
			references: facetAvailabilitySchema.exactOptional(),
			strings_names: facetAvailabilitySchema.exactOptional(),
			cfg: facetAvailabilitySchema.exactOptional()
		}).strict();
		functionDossierSchema = z.object({
			procedure: procedureIdentitySchema.safeExtend({
				signature: z.string().nullable(),
				locals: z.array(localVariableSchema)
			}),
			pseudocode: z.string(),
			assembly: z.array(z.string()),
			comments: z.array(z.object({
				address: z.string(),
				kind: z.enum(["comment", "inline"]),
				text: z.string()
			}).strict()),
			callers: z.array(procedureIdentitySchema),
			callees: z.array(procedureIdentitySchema),
			incoming_references: z.array(referenceEdgeSchema),
			outgoing_references: z.array(referenceEdgeSchema),
			unresolved_calls: z.array(unresolvedCallSchema).exactOptional(),
			referenced_strings: z.array(analysisStringSchema.extend({ source_address: z.string() })),
			referenced_names: z.array(z.object({
				address: z.string(),
				value: z.string(),
				source_address: z.string()
			}).strict()),
			swift_string_literals: z.array(swiftStringLiteralSchema).exactOptional().describe("Swift String literals decoded from constant register values. Absent when the provider does not decode them for this target."),
			swift_string_literal_omissions: z.array(swiftStringLiteralOmissionSchema).exactOptional().describe("Literal candidates omitted for capacity or unresolved control flow. Present exactly when swift_string_literals is present; empty when all examined use sites were classified."),
			basic_blocks: z.array(z.object({
				start: z.string(),
				end: z.string(),
				successors: z.array(z.string())
			}).strict()),
			native_api: nativeApiBoundarySchema.nullable(),
			native_value_flow: nativeValueFlowSchema.nullable(),
			facet_availability: functionFacetAvailabilitySchema.exactOptional(),
			limitations: z.array(z.string())
		}).strict();
		parseFunctionDossier = (value) => {
			const parsed = functionDossierSchema.safeParse(value);
			return parsed.success ? ok(parsed.data) : err(new AnalysisOutputError("analyze_function", "provider output did not match the dossier contract", { cause: parsed.error }));
		};
		parseRelatedAddresses = (value, relation, operation = relation === "callees" ? "procedure_callees" : "procedure_callers") => {
			const parsed = z.array(z.string()).safeParse(unwrapProperty(value, relation));
			return parsed.success ? ok(parsed.data) : invalid(operation, `${relation} list`, parsed.error);
		};
		parseSegments = (value, operation = "list_segments") => {
			const parsed = z.array(segmentSchema).safeParse(unwrapProperty(value, "segments"));
			return parsed.success ? ok(parsed.data) : invalid(operation, "segment list", parsed.error);
		};
		parseSegmentImageBase = (segments) => {
			const base = segments[0]?.image_base;
			return base !== undefined && segments.every((segment) => segment.image_base === base) ? base : undefined;
		};
		projectBinaryOverview = (input) => {
			const { document, procedure_count, string_count, segments } = input;
			const imageBase = segments === undefined ? undefined : parseSegmentImageBase(segments);
			return {
				document,
				...imageBase === undefined ? {} : { image_base: imageBase },
				...segments === undefined ? {} : {
					segments: segments.map(({ name, start, end, image_base, address_space }) => ({
						name,
						start,
						end,
						length: addressDistance(start, end),
						...image_base === undefined ? {} : { image_base },
						...address_space === undefined ? {} : { address_space }
					})),
					segment_count: segments.length
				},
				procedure_count,
				string_count
			};
		};
		parseDocuments = (value, operation = "list_documents") => {
			const parsed = z.array(z.string()).safeParse(unwrapProperty(value, "documents"));
			return parsed.success ? ok(parsed.data) : invalid(operation, "document list", parsed.error);
		};
		parseListCount = (value, property, operation = property === "procedures" ? "list_procedures" : "list_strings") => {
			const unwrapped = unwrapProperty(value, property);
			const list = z.array(z.unknown()).safeParse(unwrapped);
			if (list.success) return ok(list.data.length);
			const map = z.record(z.string(), z.unknown()).safeParse(unwrapped);
			return map.success ? ok(Object.keys(map.data).length) : invalid(operation, `${property} list`, map.error);
		};
		unwrapProperty = (value, property) => {
			if (typeof value === "object" && value !== null && !Array.isArray(value) && property in value) {
				return value[property] ?? null;
			}
			return value;
		};
		invalid = (operation, expected, cause) => err(new AnalysisOutputError(operation, `Provider returned an invalid ${expected}`, { cause }));
	})))();
}

//#endregion
export { init_nativeApiBoundary as A, unresolvedCallSchema as C, init_nativeValueFlow as D, nativeCallReferenceSchema as E, hasStableNativeSymbol as F, init_nativeSymbol as I, nativeSymbolMetadataSchema as L, nativeApiInspectionResultSchema as M, addressCoordinate as N, nativePcodeOperationSchema as O, init_addressCoordinate as P, nativeSymbolOrigin as R, referenceKindSchema as S, nativeCallClassificationSchema as T, parseSegments as _, functionBodyEntryAgrees as a, projectBinaryOverview as b, functionFacetAvailabilitySchema as c, localVariableSchema as d, parseContainingProcedureResolution as f, parseRelatedAddresses as g, parseListCount as h, containingProcedureResolutionSchema as i, nativeApiBoundarySchema as j, nativeValueFlowSchema as k, functionInstructionWindowSchema as l, parseFunctionDossier as m, analysisStringSchema as n, functionBodySchema as o, parseDocuments as p, availableReferenceKindSchema as r, functionDossierSchema as s, analysisBookmarkSchema as t, init_hopperValues as u, procedureClassificationSchema as v, init_nativeCallReference as w, referenceEdgeSchema as x, procedureIdentitySchema as y };