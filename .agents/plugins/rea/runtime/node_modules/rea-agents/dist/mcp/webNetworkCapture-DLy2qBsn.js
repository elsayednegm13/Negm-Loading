import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { n as init_localPath, t as absoluteLocalPathStringSchema } from "./localPath-BCKW5wEI.js";
import { c as canBorrowParsedJsonSnapshot, i as jsonValueSchema, n as init_jsonValue, p as init_immutableJson } from "./jsonValue-CvnZ7JX6.js";
import { a as browserDeadlineIncrease, d as init_browserDeadline, f as noRuntimeOverrideSentence, m as selectedBrowserDeadlineMs, o as browserDeadlineRetry, p as optionalBrowserDeadlineMs } from "./browserDeadline-YXJtM4nx.js";
import { z } from "zod";

//#region dist/domain/protobufWire.js
var protobufOptionsSchema, index, issueSchema, protobufFieldSchema, protobufFrameSchema, protobufDecodingObjectSchema, protobufDecodingSchema;
function init_protobufWire() {
	return (init_protobufWire = __esmMin((() => {
		init_localPath();
		protobufOptionsSchema = z.strictObject({
			framing: z.enum([
				"auto",
				"raw",
				"grpc",
				"grpc-web",
				"grpc-web-text"
			]).default("auto"),
			body_pointers: z.array(z.string()).optional(),
			schema: z.strictObject({
				descriptor_set_path: absoluteLocalPathStringSchema,
				message_type: z.string().min(1)
			}).optional()
		});
		index = z.number().int().nonnegative();
		issueSchema = z.strictObject({
			offset: index,
			reason: z.string()
		});
		protobufFieldSchema = z.strictObject({
			index,
			frame_index: index,
			field_id: z.string(),
			parent_field_id: z.string().nullable(),
			parent_index: index.nullable(),
			number: z.number().int().positive().max(536870911),
			wire_type: z.enum([
				"varint",
				"i64",
				"len",
				"i32",
				"group"
			]),
			offset: index,
			bytes: index,
			payload_offset: index,
			payload_bytes: index,
			value: z.string().exactOptional(),
			text: z.string().exactOptional(),
			interpretations: z.array(z.enum([
				"utf8-string",
				"nested-message",
				"packed-varint",
				"packed-fixed32",
				"packed-fixed64",
				"bytes"
			])).exactOptional(),
			schema_name: z.string().exactOptional(),
			schema_type: z.string().exactOptional(),
			schema_value: z.string().exactOptional(),
			schema_enum_values: z.array(z.strictObject({
				number: z.string(),
				names: z.array(z.string())
			})).exactOptional(),
			schema_status: z.enum([
				"decoded",
				"unknown-field",
				"wire-type-mismatch",
				"invalid-message",
				"unsupported"
			]).exactOptional(),
			schema_error: issueSchema.exactOptional()
		});
		protobufFrameSchema = z.strictObject({
			index,
			kind: z.enum(["data", "trailer"]),
			offset: index,
			payload_offset: index,
			bytes: index,
			compressed: z.boolean(),
			status: z.enum([
				"complete",
				"partial",
				"unknown"
			]),
			examined_bytes: index,
			error: issueSchema.exactOptional(),
			trailers: z.array(z.strictObject({
				name: z.string(),
				value: z.string()
			})).exactOptional()
		});
		protobufDecodingObjectSchema = z.strictObject({
			pointer: z.string(),
			content_type: z.string().nullable(),
			decoder: z.literal("rea-protobuf-wire-v1"),
			body_sha256: z.string().regex(/^[0-9a-f]{64}$/),
			framing: z.enum([
				"raw",
				"grpc",
				"grpc-web",
				"grpc-web-text"
			]),
			offset_basis: z.enum(["retained-body", "base64-decoded-body"]),
			decoded_bytes: index,
			status: z.enum([
				"complete",
				"partial",
				"unknown"
			]),
			examined_bytes: index,
			frames: z.array(protobufFrameSchema),
			fields: z.array(protobufFieldSchema),
			error: issueSchema.exactOptional(),
			limitations: z.array(z.string()),
			schema: z.strictObject({
				decoder: z.literal("protobuf-es-2.16.0"),
				descriptor_set_path: z.string(),
				descriptor_set_sha256: z.string().regex(/^[0-9a-f]{64}$/),
				descriptor_set_bytes: index,
				message_type: z.string()
			}).exactOptional()
		});
		protobufDecodingSchema = protobufDecodingObjectSchema.superRefine((body, context) => {
			const issue = (path, message) => context.addIssue({
				code: "custom",
				path,
				message
			});
			if (body.examined_bytes > body.decoded_bytes) issue(["examined_bytes"], "Examined bytes exceed the decoded body");
			if (body.status === "complete" && (body.error !== undefined || body.frames.some((frame) => frame.status !== "complete"))) issue(["status"], "Complete body contradicts frame coverage");
			let expectedOffset = 0;
			for (const [index, frame] of body.frames.entries()) {
				if (frame.offset !== expectedOffset || frame.payload_offset !== frame.offset + (body.framing === "raw" ? 0 : 5)) issue([
					"frames",
					index,
					"offset"
				], "Frames must preserve contiguous protocol ranges");
				expectedOffset = frame.payload_offset + frame.bytes;
				if (frame.index !== index || frame.payload_offset < frame.offset || frame.payload_offset + frame.bytes > body.decoded_bytes || frame.examined_bytes > frame.bytes) issue(["frames", index], "Frame identity or range contradicts the body");
				if (frame.status === "complete" && (frame.error !== undefined || frame.examined_bytes !== frame.bytes || frame.compressed)) issue([
					"frames",
					index,
					"status"
				], "Complete frame contradicts decoding coverage");
				if (body.framing === "grpc" && frame.kind === "trailer") issue([
					"frames",
					index,
					"kind"
				], "Native gRPC has no in-body trailer frame");
			}
			if (body.status === "complete" && (body.examined_bytes !== body.decoded_bytes || expectedOffset !== body.decoded_bytes)) issue(["status"], "Complete decoding must cover the whole decoded body");
			const ids = new Set();
			for (const [index, field] of body.fields.entries()) {
				const frame = body.frames[field.frame_index];
				if (field.index !== index || field.field_id !== `offset:${field.offset}` || ids.has(field.field_id)) issue(["fields", index], "Field occurrence identity is inconsistent");
				ids.add(field.field_id);
				if (frame === undefined || frame.kind !== "data" || field.offset < frame.payload_offset || field.offset + field.bytes > frame.payload_offset + frame.bytes || field.payload_offset < field.offset || field.payload_offset + field.payload_bytes > field.offset + field.bytes) issue(["fields", index], "Field range contradicts its frame");
				const parent = field.parent_index === null ? undefined : body.fields[field.parent_index];
				if (field.parent_index === null ? field.parent_field_id !== null : parent === undefined || parent.index >= index || parent.field_id !== field.parent_field_id || parent.frame_index !== field.frame_index || field.offset < parent.payload_offset || field.offset + field.bytes > parent.payload_offset + parent.payload_bytes) issue([
					"fields",
					index,
					"parent_field_id"
				], "Field parent contradicts its source range");
			}
		});
	})))();
}

//#endregion
//#region dist/domain/qlogCapture.js
var decimal, unsignedFact, traceLocation, qlogCaptureFactsSchema;
function init_qlogCapture() {
	return (init_qlogCapture = __esmMin((() => {
		decimal = z.string().regex(/^(0|[1-9][0-9]*)$/u);
		unsignedFact = z.discriminatedUnion("state", [z.strictObject({
			state: z.literal("reported"),
			value: decimal
		}), z.strictObject({
			state: z.literal("unknown"),
			reason: z.literal("omitted-null-or-redacted")
		})]);
		traceLocation = z.discriminatedUnion("kind", [z.strictObject({
			kind: z.literal("json-pointer"),
			pointer: z.string()
		}), z.strictObject({
			kind: z.literal("unknown"),
			reason: z.literal("explicit-sensitive-value")
		})]);
		qlogCaptureFactsSchema = z.strictObject({
			profile: z.literal("aioquic-1.5.0-json-0.3"),
			scope: z.literal("all-recorded-events-before-selection"),
			body_bytes: z.literal("not-reported"),
			clock: z.strictObject({
				unit: z.literal("milliseconds"),
				domain: z.literal("unix-epoch"),
				basis: z.literal("selected-aioquic-profile-not-producer-authentication")
			}),
			traces: z.array(z.strictObject({
				trace_index: z.int().nonnegative(),
				location: traceLocation,
				event_count: z.int().nonnegative(),
				odcid: z.string().nullable(),
				vantage_point: z.enum(["client", "server"]).nullable(),
				incomplete_fact_records: z.array(z.int().nonnegative()),
				loss_declarations: z.array(z.strictObject({
					record_ordinal: z.int().nonnegative(),
					confidence: z.literal("observed"),
					packet_number: unsignedFact,
					packet_type: z.string().nullable(),
					packet_number_space: z.enum([
						"initial",
						"handshake",
						"application"
					]).nullable()
				})),
				streams: z.array(z.strictObject({
					stream_id: decimal,
					direction: z.enum(["sent", "received"]),
					confidence: z.literal("derived"),
					scope: z.literal("observed-stream-frame-ranges"),
					contributions: z.array(z.strictObject({
						record_ordinal: z.int().nonnegative(),
						frame_index: z.int().nonnegative(),
						offset: decimal,
						length: decimal,
						fin: z.boolean().nullable()
					})),
					covered_ranges: z.array(z.strictObject({
						start: decimal,
						end: decimal
					})),
					unique_bytes: decimal,
					frame_length_sum: decimal,
					repeated_bytes: decimal,
					reported_final_sizes: z.array(decimal)
				}))
			}))
		});
	})))();
}

//#endregion
//#region dist/domain/webNetworkCapture.js
var WEB_NETWORK_CAPTURE_LIMITS, DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS, selectedWebNetworkCaptureTimeoutMs, webNetworkCaptureTimeoutRecovery, WEB_NETWORK_CAPTURE_FORMATS, inspectWebNetworkCaptureInputSchema, captureSensitiveValues, pointerSchema, redactionSchema, binaryBase, retainedBinaryDescriptorSchema, redactedBinaryDescriptorSchema, webNetworkCaptureBinaryDescriptorSchema, binarySchema, numberSchema, webNetworkCaptureRecordSchema, webNetworkCaptureDecoderSchema, protobufCaptureCoverageSchema, payloadShape, refineCoverage, webNetworkCapturePayloadSchema, webNetworkCaptureArtifactSchema, artifactShape, webNetworkCaptureSchema, validatedImmutableCaptures, safeParseOwnedWebNetworkCapture;
function init_webNetworkCapture() {
	return (init_webNetworkCapture = __esmMin((() => {
		init_browserDeadline();
		init_jsonValue();
		init_localPath();
		init_protobufWire();
		init_qlogCapture();
		init_immutableJson();
		WEB_NETWORK_CAPTURE_LIMITS = {
			inputBytes: 32 * 1024 * 1024,
			outputBytes: 96 * 1024 * 1024,
			timeoutMs: 3e4,
			depth: 64
		};
		DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS = WEB_NETWORK_CAPTURE_LIMITS.timeoutMs;
		selectedWebNetworkCaptureTimeoutMs = (selected) => selectedBrowserDeadlineMs(selected, DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS);
		webNetworkCaptureTimeoutRecovery = (timeoutMs) => ({
			userMessage: `inspect_web_network_capture reached its ${String(timeoutMs)} ms capture deadline (deadlineExpired) for capture_timeout_ms. No partial capture is returned. This is not the MCP client deadline.`,
			remediationAction: `${browserDeadlineIncrease("capture_timeout_ms", timeoutMs, DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS, "--capture-timeout-ms")} ${browserDeadlineRetry} ${noRuntimeOverrideSentence(`The ${String(WEB_NETWORK_CAPTURE_LIMITS.inputBytes)}-byte input budget, ${String(WEB_NETWORK_CAPTURE_LIMITS.outputBytes)}-byte reply budget, and ${String(WEB_NETWORK_CAPTURE_LIMITS.depth)}-level nesting cap stay fixed.`, "capture_timeout_ms")}`
		});
		WEB_NETWORK_CAPTURE_FORMATS = [
			"har",
			"mitmproxy",
			"saz",
			"qlog"
		];
		inspectWebNetworkCaptureInputSchema = z.strictObject({
			capture_path: absoluteLocalPathStringSchema.describe("Absolute local HAR, mitmproxy, Fiddler SAZ or aioquic qlog capture path."),
			format: z.enum(WEB_NETWORK_CAPTURE_FORMATS),
			record_ordinals: z.array(z.int().nonnegative()).min(1).optional().describe("Zero-based producer record ordinals, in caller-selected order. Omit to inspect every record."),
			protobuf: protobufOptionsSchema.optional(),
			sensitive_values: z.array(z.string().min(1)).default([]).describe("Literal text excluded from capture payloads, byte/numeric projections, producer coordinates, artifact paths/digests and diagnostic text. Declaration strings are never persisted in Evidence parameters. Canonical contract keys, enums and provider identities remain intact."),
			capture_timeout_ms: optionalBrowserDeadlineMs(`Capture wall-clock deadline in milliseconds (default ${String(DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS)}), from decoder start through process exit. Omitted means ${String(DEFAULT_WEB_NETWORK_CAPTURE_TIMEOUT_MS)} and applies on the next capture. deadlineExpired returns no partial capture. Does not raise the fixed ${String(WEB_NETWORK_CAPTURE_LIMITS.inputBytes)}-byte input budget, ${String(WEB_NETWORK_CAPTURE_LIMITS.outputBytes)}-byte reply budget, or ${String(WEB_NETWORK_CAPTURE_LIMITS.depth)}-level nesting cap. Those have no runtime override.`)
		});
		captureSensitiveValues = (rawInput) => {
			const parsed = inspectWebNetworkCaptureInputSchema.shape.sensitive_values.safeParse(typeof rawInput === "object" && rawInput !== null && "sensitive_values" in rawInput ? rawInput.sensitive_values : undefined);
			return parsed.success ? parsed.data : [];
		};
		pointerSchema = z.string().describe("RFC 6901 pointer in the producer's reported object.");
		redactionSchema = z.union([z.strictObject({
			pointer: pointerSchema,
			reason: z.enum(["transport-credential", "explicit-sensitive-value"])
		}), z.strictObject({
			pointer: pointerSchema,
			reason: z.literal("explicit-sensitive-value"),
			scope: z.literal("property-name").describe("An omitted property name; pointer identifies its actual parent, not an invented child coordinate.")
		})]);
		binaryBase = {
			pointer: pointerSchema,
			representation: z.enum(["producer-bytes", "har-base64-content"])
		};
		retainedBinaryDescriptorSchema = z.strictObject({
			...binaryBase,
			state: z.literal("retained"),
			bytes: z.int().nonnegative(),
			sha256: z.string().regex(/^[0-9a-f]{64}$/)
		});
		redactedBinaryDescriptorSchema = z.strictObject({
			...binaryBase,
			state: z.literal("redacted"),
			bytes: z.null(),
			sha256: z.null()
		});
		webNetworkCaptureBinaryDescriptorSchema = z.discriminatedUnion("state", [retainedBinaryDescriptorSchema, redactedBinaryDescriptorSchema]);
		binarySchema = z.discriminatedUnion("state", [retainedBinaryDescriptorSchema.extend({ content_base64: z.string() }), redactedBinaryDescriptorSchema.extend({ content_base64: z.null() })]);
		numberSchema = z.strictObject({
			pointer: pointerSchema,
			producer_type: z.enum([
				"json-number",
				"integer",
				"float"
			]),
			literal: z.string()
		});
		webNetworkCaptureRecordSchema = z.strictObject({
			ordinal: z.int().nonnegative(),
			location: z.discriminatedUnion("kind", [
				z.strictObject({
					kind: z.literal("unknown"),
					reason: z.literal("explicit-sensitive-value")
				}),
				z.strictObject({
					kind: z.literal("json-pointer"),
					pointer: pointerSchema
				}),
				z.strictObject({
					kind: z.literal("archive-members"),
					members: z.array(z.string()).min(1)
				}),
				z.strictObject({
					kind: z.literal("byte-range"),
					offset: z.int().nonnegative(),
					bytes: z.int().positive()
				})
			]),
			reported: jsonValueSchema,
			binary_fields: z.array(binarySchema),
			numeric_literals: z.array(numberSchema),
			redactions: z.array(redactionSchema),
			limitations: z.array(z.string()),
			protobuf: z.array(protobufDecodingSchema).exactOptional().describe("Flat decoding facts for explicitly selected records. Field indices are local to a body; offset_basis states whether ranges refer to retained or base64-decoded bytes. Interpretations without a caller-supplied schema are candidates.")
		});
		webNetworkCaptureDecoderSchema = z.strictObject({
			id: z.string().min(1),
			name: z.string().min(1),
			version: z.string().min(1)
		});
		protobufCaptureCoverageSchema = z.strictObject({
			status: z.enum(["complete", "partial"]),
			selected_records: z.number().int().nonnegative(),
			inspected_records: z.number().int().nonnegative()
		}).superRefine((coverage, context) => {
			if (coverage.inspected_records > coverage.selected_records || coverage.status === "complete" && coverage.inspected_records !== coverage.selected_records) context.addIssue({
				code: "custom",
				path: ["status"],
				message: "Protobuf coverage contradicts its inspected selection."
			});
		});
		payloadShape = {
			protobuf_coverage: protobufCaptureCoverageSchema.exactOptional(),
			decoder: webNetworkCaptureDecoderSchema,
			container: z.strictObject({
				reported: jsonValueSchema,
				numeric_literals: z.array(numberSchema),
				redactions: z.array(redactionSchema),
				records_pointer: pointerSchema.nullable()
			}),
			total_records: z.int().nonnegative(),
			records: z.array(webNetworkCaptureRecordSchema)
		};
		refineCoverage = (capture, context) => {
			const seen = new Set();
			for (const [index, record] of capture.records.entries()) {
				if (record.ordinal >= capture.total_records || seen.has(record.ordinal)) {
					context.addIssue({
						code: "custom",
						path: [
							"records",
							index,
							"ordinal"
						],
						message: "Retained ordinals must be unique and within the declared capture total."
					});
					return;
				}
				seen.add(record.ordinal);
			}
		};
		webNetworkCapturePayloadSchema = z.union([z.strictObject({
			...payloadShape,
			qlog: qlogCaptureFactsSchema
		}), z.strictObject(payloadShape)]).superRefine(refineCoverage);
		webNetworkCaptureArtifactSchema = z.strictObject({
			path: z.string().describe("Selected artifact path; empty when explicitly excluded from Evidence."),
			sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().describe("Observed SHA-256; null only when explicitly excluded."),
			bytes: z.int().nonnegative()
		});
		artifactShape = {
			artifact: webNetworkCaptureArtifactSchema,
			runtime_attribution: z.literal("unknown"),
			limitations: z.array(z.string())
		};
		webNetworkCaptureSchema = z.discriminatedUnion("format", [z.strictObject({
			...payloadShape,
			...artifactShape,
			format: z.enum([
				"har",
				"mitmproxy",
				"saz"
			])
		}), z.strictObject({
			...payloadShape,
			...artifactShape,
			format: z.literal("qlog"),
			qlog: qlogCaptureFactsSchema
		})]).superRefine(refineCoverage);
		validatedImmutableCaptures = new WeakSet();
		safeParseOwnedWebNetworkCapture = (input) => {
			if (typeof input === "object" && input !== null && validatedImmutableCaptures.has(input)) return {
				success: true,
				data: input
			};
			const parsed = webNetworkCaptureSchema.safeParse(input);
			if (parsed.success && canBorrowParsedJsonSnapshot(input, parsed.data)) {
				validatedImmutableCaptures.add(input);
				return {
					success: true,
					data: input
				};
			}
			return parsed;
		};
	})))();
}

//#endregion
export { protobufFrameSchema as S, qlogCaptureFactsSchema as _, inspectWebNetworkCaptureInputSchema as a, protobufDecodingSchema as b, selectedWebNetworkCaptureTimeoutMs as c, webNetworkCaptureDecoderSchema as d, webNetworkCapturePayloadSchema as f, init_qlogCapture as g, webNetworkCaptureTimeoutRecovery as h, init_webNetworkCapture as i, webNetworkCaptureArtifactSchema as l, webNetworkCaptureSchema as m, WEB_NETWORK_CAPTURE_LIMITS as n, protobufCaptureCoverageSchema as o, webNetworkCaptureRecordSchema as p, captureSensitiveValues as r, safeParseOwnedWebNetworkCapture as s, WEB_NETWORK_CAPTURE_FORMATS as t, webNetworkCaptureBinaryDescriptorSchema as u, init_protobufWire as v, protobufFieldSchema as x, protobufDecodingObjectSchema as y };