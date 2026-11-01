import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { browserAllowedOriginsSchema, browserCompletenessSchema, browserObservationEndpointSchema, browserVersionSchema, digestSchema, emptyArraySchema, init_browserCompleteness, init_browserDeadline, init_browserObservation, init_browserObservationSchemas, init_digests, init_emptyArraySchema, sanitizedBrowserUrlSchema, webRuntimeCommandTimeoutSchema } from "./javascriptFeatureTraceSchemas-machBq68.js";
import { z } from "zod";
import { createHash } from "node:crypto";

//#region dist/domain/browserNetworkEvidence.js
var PLAYWRIGHT_RESPONSE_BODY_PROVENANCE_LIMITATION, browserNetworkContentSelectionValuesSchema, browserNetworkContentSelectionSchema, unavailableBrowserNetworkBodySchema, browserNetworkBodySchema, browserNetworkHeadersSchema;
function init_browserNetworkEvidence() {
	return (init_browserNetworkEvidence = __esmMin((() => {
		PLAYWRIGHT_RESPONSE_BODY_PROVENANCE_LIMITATION = "Captured response-body bytes are the result of Playwright's Response.body() API. Playwright may satisfy that API with a credentialed follow-up load of the request URL when CDP has no body, so transaction and event links do not verify that retained bytes came from the original network transaction.";
		browserNetworkContentSelectionValuesSchema = z.strictObject({
			request_body: z.boolean(),
			response_body: z.boolean(),
			header_values: z.boolean()
		});
		browserNetworkContentSelectionSchema = browserNetworkContentSelectionValuesSchema.extend({
			request_body: z.boolean().default(false),
			response_body: z.boolean().default(false),
			header_values: z.boolean().default(false)
		}).default({
			request_body: false,
			response_body: false,
			header_values: false
		});
		unavailableBrowserNetworkBodySchema = z.discriminatedUnion("reason", [
			z.strictObject({
				state: z.literal("unavailable"),
				reason: z.enum([
					"request-failed",
					"response-unfinished",
					"body-read-failed",
					"body-read-timeout",
					"cancelled",
					"capture-ended"
				]),
				message: z.string().min(1)
			}),
			z.strictObject({
				state: z.literal("unavailable"),
				reason: z.literal("body-size-limit"),
				message: z.string().min(1),
				limit_bytes: z.int().positive().safe(),
				observed_bytes: z.int().positive().safe()
			}),
			z.strictObject({
				state: z.literal("unavailable"),
				reason: z.literal("body-allocation-limit"),
				message: z.string().min(1),
				limit_allocation_bytes: z.int().positive().safe(),
				observed_allocation_bytes: z.int().positive().safe()
			})
		]);
		browserNetworkBodySchema = z.union([
			z.strictObject({ state: z.literal("not_requested") }),
			z.strictObject({ state: z.literal("not_exposed") }),
			unavailableBrowserNetworkBodySchema,
			z.strictObject({
				state: z.literal("captured"),
				representation: z.enum([
					"browser-exposed-request-bytes",
					"playwright-response-body-bytes",
					"browser-decoded-response-bytes"
				]),
				encoding: z.literal("base64"),
				content: z.string(),
				bytes: z.int().min(0),
				sha256: z.string().regex(/^[a-f0-9]{64}$/u),
				media_type: z.string().nullable(),
				redacted: z.boolean()
			}).superRefine((artifact, context) => {
				const bytes = Buffer.from(artifact.content, "base64");
				if (bytes.toString("base64") !== artifact.content) context.addIssue({
					code: "custom",
					path: ["content"],
					message: "Network body must use canonical base64"
				});
				if (bytes.length !== artifact.bytes) context.addIssue({
					code: "custom",
					path: ["bytes"],
					message: "Network body byte count disagrees with retained bytes"
				});
				if (createHash("sha256").update(bytes).digest("hex") !== artifact.sha256) context.addIssue({
					code: "custom",
					path: ["sha256"],
					message: "Network body digest disagrees with retained bytes"
				});
			})
		]);
		browserNetworkHeadersSchema = z.union([
			z.strictObject({ state: z.literal("not_requested") }),
			z.strictObject({
				state: z.literal("unavailable"),
				message: z.string().min(1)
			}),
			z.strictObject({
				state: z.literal("captured"),
				items: z.array(z.strictObject({
					name: z.string().min(1),
					value: z.string().nullable(),
					redacted: z.boolean()
				}))
			})
		]);
	})))();
}

//#endregion
//#region dist/domain/browserScenarioCaptureLimits.js
var positiveSafeInteger, DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS, browserScenarioCaptureLimitsValuesSchema, browserScenarioCaptureLimitsSchema;
function init_browserScenarioCaptureLimits() {
	return (init_browserScenarioCaptureLimits = __esmMin((() => {
		positiveSafeInteger = z.int().safe().positive();
		DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS = {
			max_events: 1e4,
			max_event_allocation_bytes: 4 * 1024 * 1024,
			max_total_event_allocation_bytes: 16 * 1024 * 1024,
			max_network_transactions: 1024,
			max_network_body_bytes: 64 * 1024,
			max_network_body_allocation_bytes: 1024 * 1024,
			max_network_header_allocation_bytes: 1024 * 1024,
			max_network_metadata_allocation_bytes: 1024 * 1024
		};
		browserScenarioCaptureLimitsValuesSchema = z.strictObject({
			max_events: positiveSafeInteger,
			max_event_allocation_bytes: positiveSafeInteger,
			max_total_event_allocation_bytes: positiveSafeInteger,
			max_network_transactions: positiveSafeInteger,
			max_network_body_bytes: positiveSafeInteger,
			max_network_body_allocation_bytes: positiveSafeInteger,
			max_network_header_allocation_bytes: positiveSafeInteger,
			max_network_metadata_allocation_bytes: positiveSafeInteger
		});
		browserScenarioCaptureLimitsSchema = browserScenarioCaptureLimitsValuesSchema.extend({
			max_events: browserScenarioCaptureLimitsValuesSchema.shape.max_events.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_events),
			max_event_allocation_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_event_allocation_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_event_allocation_bytes),
			max_total_event_allocation_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_total_event_allocation_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_total_event_allocation_bytes),
			max_network_transactions: browserScenarioCaptureLimitsValuesSchema.shape.max_network_transactions.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_network_transactions),
			max_network_body_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_network_body_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_network_body_bytes),
			max_network_body_allocation_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_network_body_allocation_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_network_body_allocation_bytes),
			max_network_header_allocation_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_network_header_allocation_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_network_header_allocation_bytes),
			max_network_metadata_allocation_bytes: browserScenarioCaptureLimitsValuesSchema.shape.max_network_metadata_allocation_bytes.default(DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS.max_network_metadata_allocation_bytes)
		});
	})))();
}

//#endregion
//#region dist/domain/webScreenshot.js
var webScreenshotArtifactSchema, captureWebScreenshotInputSchema, webScreenshotSchema, compareWebScreenshotsInputSchema, webScreenshotDiffContextShape, webScreenshotDiffSchema, createWebScreenshotArtifact, decodeCanonicalBase64;
function init_webScreenshot() {
	return (init_webScreenshot = __esmMin((() => {
		init_browserDeadline();
		init_browserCompleteness();
		init_browserObservation();
		init_browserObservationSchemas();
		webScreenshotArtifactSchema = z.object({
			sha256: z.string().regex(/^[a-f0-9]{64}$/u),
			bytes: z.int().min(1),
			media_type: z.literal("image/png"),
			data_base64: z.string()
		}).superRefine((artifact, context) => {
			const bytes = decodeCanonicalBase64(artifact.data_base64);
			if (bytes === undefined) {
				context.addIssue({
					code: "custom",
					message: "Invalid canonical base64"
				});
				return;
			}
			const sha256 = createHash("sha256").update(bytes).digest("hex");
			if (bytes.byteLength !== artifact.bytes || sha256 !== artifact.sha256) context.addIssue({
				code: "custom",
				message: "Screenshot artifact digest or size mismatch"
			});
		});
		captureWebScreenshotInputSchema = z.strictObject({
			cdp_endpoint: browserObservationEndpointSchema,
			allowed_origins: browserAllowedOriginsSchema,
			target_id: z.string().trim().min(1),
			command_timeout_ms: webRuntimeCommandTimeoutSchema
		});
		webScreenshotSchema = z.object({
			browser: browserVersionSchema,
			target: z.object({
				target_id: z.string(),
				url: z.string(),
				origin: z.string()
			}),
			captured_at: z.iso.datetime(),
			viewport: z.object({
				width: z.int().min(1),
				height: z.int().min(1)
			}),
			artifact: webScreenshotArtifactSchema,
			completeness: browserCompletenessSchema,
			limitations: z.array(z.string())
		});
		compareWebScreenshotsInputSchema = z.strictObject({
			before: webScreenshotArtifactSchema,
			after: webScreenshotArtifactSchema,
			channel_threshold: z.int().min(0).max(255).default(0)
		});
		webScreenshotDiffContextShape = {
			before: z.object({
				width: z.int().min(1),
				height: z.int().min(1)
			}),
			after: z.object({
				width: z.int().min(1),
				height: z.int().min(1)
			}),
			channel_threshold: z.int().min(0).max(255),
			limitations: z.array(z.string())
		};
		webScreenshotDiffSchema = z.discriminatedUnion("status", [
			z.object({
				...webScreenshotDiffContextShape,
				status: z.literal("identical"),
				compared_pixels: z.int().positive(),
				changed_pixels: z.literal(0),
				changed_ratio: z.literal(0),
				maximum_channel_delta: z.int().min(0).max(255),
				mean_absolute_channel_delta: z.number().min(0).max(255)
			}),
			z.object({
				...webScreenshotDiffContextShape,
				status: z.literal("different"),
				compared_pixels: z.int().positive(),
				changed_pixels: z.int().positive(),
				changed_ratio: z.number().positive().max(1),
				maximum_channel_delta: z.int().positive().max(255),
				mean_absolute_channel_delta: z.number().positive().max(255)
			}),
			z.object({
				...webScreenshotDiffContextShape,
				status: z.literal("dimension_mismatch"),
				compared_pixels: z.literal(0),
				changed_pixels: z.null(),
				changed_ratio: z.null(),
				maximum_channel_delta: z.null(),
				mean_absolute_channel_delta: z.null()
			})
		]).superRefine((diff, context) => {
			const sameDimensions = diff.before.width === diff.after.width && diff.before.height === diff.after.height;
			if (sameDimensions !== (diff.status !== "dimension_mismatch")) context.addIssue({
				code: "custom",
				path: ["status"],
				message: "Screenshot comparison status must match viewport dimensions"
			});
			if (diff.status !== "dimension_mismatch" && diff.compared_pixels !== diff.before.width * diff.before.height) context.addIssue({
				code: "custom",
				path: ["compared_pixels"],
				message: "Compared pixel count must match the shared dimensions"
			});
		});
		createWebScreenshotArtifact = (bytes) => {
			const sha256 = createHash("sha256").update(bytes).digest("hex");
			return webScreenshotArtifactSchema.parse({
				sha256,
				bytes: bytes.byteLength,
				media_type: "image/png",
				data_base64: bytes.toString("base64")
			});
		};
		decodeCanonicalBase64 = (value) => {
			if (value.length === 0 || value.length % 4 !== 0) return undefined;
			const decoded = Buffer.from(value, "base64");
			return decoded.toString("base64") === value ? decoded : undefined;
		};
	})))();
}

//#endregion
//#region dist/domain/browserScenarioCaptureValues.js
var textArtifactSchema, captureStateSchema, historySchema, hashedStorageValueShape, redactedStorageValueShape, storageValueFingerprintSchema, storageValueSchema, cookieShape, BROWSER_STORAGE_FINGERPRINT_VERSION, storageSnapshotSchema, browserStepArtifactsSchema, browserScenarioEventFamilySchema, eventBase, eventUrl, browserStartSchema, elapsedMsSchema, networkEventShape, webSocketFrameShape, browserScenarioEventSchema, completenessSectionSchema, browserScenarioEventKindSchema, browserScenarioEventBudgetReasonSchema, browserScenarioEventOmissionsSchema, browserScenarioCompletenessSchema, classifyBrowserScenarioCompleteness, browserScenarioStepShape, browserScenarioStepSchema;
function init_browserScenarioCaptureValues() {
	return (init_browserScenarioCaptureValues = __esmMin((() => {
		init_emptyArraySchema();
		init_browserNetworkEvidence();
		init_browserObservation();
		init_webScreenshot();
		init_digests();
		textArtifactSchema = z.strictObject({
			sha256: digestSchema,
			bytes: z.int().min(0),
			text: z.string()
		}).superRefine((artifact, context) => {
			const bytes = Buffer.from(artifact.text);
			const sha256 = createHash("sha256").update(bytes).digest("hex");
			if (bytes.byteLength !== artifact.bytes || sha256 !== artifact.sha256) context.addIssue({
				code: "custom",
				message: "Text artifact digest or size mismatch"
			});
		});
		captureStateSchema = (value) => z.discriminatedUnion("state", [
			z.strictObject({
				state: z.literal("captured"),
				value
			}),
			z.strictObject({ state: z.literal("not_requested") }),
			z.strictObject({
				state: z.literal("missing"),
				reason: z.string().min(1)
			}),
			z.strictObject({
				state: z.literal("truncated"),
				observed: z.int().min(0),
				retained: z.int().min(0),
				reason: z.string().min(1)
			})
		]);
		historySchema = z.strictObject({
			length: z.int().min(0),
			current_url: sanitizedBrowserUrlSchema,
			navigation_entries: z.array(z.strictObject({
				type: z.enum([
					"navigate",
					"reload",
					"back_forward",
					"prerender",
					"unknown"
				]),
				name: sanitizedBrowserUrlSchema
			}))
		});
		hashedStorageValueShape = {
			value_state: z.literal("hashed"),
			value_sha256: digestSchema
		};
		redactedStorageValueShape = {
			value_state: z.literal("redacted-secret"),
			value_sha256: z.null()
		};
		storageValueFingerprintSchema = z.discriminatedUnion("value_state", [z.strictObject(hashedStorageValueShape), z.strictObject(redactedStorageValueShape)]);
		storageValueSchema = z.discriminatedUnion("value_state", [z.strictObject({
			name: z.string(),
			...hashedStorageValueShape
		}), z.strictObject({
			name: z.string(),
			...redactedStorageValueShape
		})]);
		cookieShape = {
			name: z.string(),
			domain: z.string(),
			path: z.string(),
			secure: z.boolean(),
			http_only: z.boolean(),
			same_site: z.enum([
				"Strict",
				"Lax",
				"None"
			])
		};
		BROWSER_STORAGE_FINGERPRINT_VERSION = 2;
		storageSnapshotSchema = z.strictObject({
			fingerprint_version: z.literal(2).optional(),
			cookies: z.array(z.discriminatedUnion("value_state", [z.strictObject({
				...cookieShape,
				...hashedStorageValueShape
			}), z.strictObject({
				...cookieShape,
				...redactedStorageValueShape
			})])),
			local_storage: z.array(storageValueSchema),
			session_storage: z.array(storageValueSchema)
		});
		browserStepArtifactsSchema = z.strictObject({
			screenshot: captureStateSchema(webScreenshotArtifactSchema),
			dom: captureStateSchema(textArtifactSchema),
			accessibility: captureStateSchema(textArtifactSchema),
			url: captureStateSchema(sanitizedBrowserUrlSchema),
			history: captureStateSchema(historySchema),
			storage: captureStateSchema(storageSnapshotSchema)
		});
		browserScenarioEventFamilySchema = z.enum([
			"console",
			"page-errors",
			"network",
			"websockets",
			"frames",
			"workers",
			"popups",
			"downloads"
		]);
		eventBase = {
			sequence: z.int().min(1),
			step_index: z.int().min(0)
		};
		eventUrl = sanitizedBrowserUrlSchema.nullable();
		browserStartSchema = z.iso.datetime().optional().describe("Wall-clock time the browser started the request, as it reported at completion; absent when it reported none.");
		elapsedMsSchema = z.number().nonnegative().optional().describe("Milliseconds from the request start to the end of its response, as the browser timed it; absent when it reported none.");
		networkEventShape = {
			...eventBase,
			transaction_id: z.string().min(1),
			redirected_from_transaction_id: z.string().min(1).nullable(),
			/** Distinguishes a captured root from an unobserved predecessor for null links. */
			redirected_from_transaction_state: z.enum(["root", "unknown"]).optional(),
			method: z.string().min(1),
			url: sanitizedBrowserUrlSchema,
			resource_type: z.string().min(1),
			header_names: z.array(z.string())
		};
		webSocketFrameShape = {
			...eventBase,
			kind: z.enum(["websocket-frame-sent", "websocket-frame-received"]),
			url: sanitizedBrowserUrlSchema,
			payload_bytes: z.int().min(0),
			truncated: z.boolean()
		};
		browserScenarioEventSchema = z.union([
			z.strictObject({
				...eventBase,
				kind: z.literal("console"),
				level: z.string().min(1),
				text: z.string(),
				url: eventUrl
			}),
			z.strictObject({
				...eventBase,
				kind: z.literal("page-error"),
				message: z.string(),
				stack: z.string().nullable()
			}),
			z.strictObject({
				...networkEventShape,
				kind: z.literal("request"),
				status: z.null(),
				failure: z.null(),
				observed_at: z.iso.datetime().optional().describe("Wall-clock time the provider observed the request start; absent in captures made before it was recorded.")
			}),
			z.strictObject({
				...networkEventShape,
				kind: z.literal("response"),
				status: z.int().min(100).max(599),
				failure: z.null()
			}),
			z.strictObject({
				...networkEventShape,
				kind: z.literal("request-failed"),
				status: z.null(),
				failure: z.string().min(1),
				started_at: browserStartSchema,
				elapsed_ms: elapsedMsSchema
			}),
			z.strictObject({
				...networkEventShape,
				kind: z.literal("request-finished"),
				status: z.null(),
				failure: z.null(),
				started_at: browserStartSchema,
				elapsed_ms: elapsedMsSchema
			}),
			z.strictObject({
				...networkEventShape,
				kind: z.literal("request-unfinished"),
				status: z.null(),
				failure: z.null(),
				reason: z.enum(["capture-ended", "cancelled"])
			}),
			z.strictObject({
				...eventBase,
				kind: z.literal("network-content"),
				transaction_id: z.string().min(1),
				source_event_sequence: z.int().min(1),
				phase: z.enum(["request", "response"]),
				headers: browserNetworkHeadersSchema,
				body: browserNetworkBodySchema
			}),
			z.strictObject({
				...eventBase,
				kind: z.enum(["websocket-opened", "websocket-closed"]),
				url: sanitizedBrowserUrlSchema
			}),
			z.strictObject({
				...webSocketFrameShape,
				payload_type: z.literal("text"),
				payload_text: z.string()
			}),
			z.strictObject({
				...webSocketFrameShape,
				payload_type: z.literal("binary"),
				payload_text: z.null()
			}),
			z.strictObject({
				...eventBase,
				kind: z.enum([
					"frame-attached",
					"frame-detached",
					"frame-navigated",
					"worker-created",
					"worker-closed",
					"popup-opened",
					"popup-closed"
				]),
				url: eventUrl,
				name: z.string().nullable()
			}),
			z.strictObject({
				...eventBase,
				kind: z.literal("download-cancelled"),
				suggested_filename: z.string(),
				url: sanitizedBrowserUrlSchema
			})
		]).superRefine((event, context) => {
			if ("redirected_from_transaction_id" in event && event.redirected_from_transaction_id !== null && event.redirected_from_transaction_state !== undefined) context.addIssue({
				code: "custom",
				message: "Redirect state is valid only when the predecessor transaction ID is null",
				path: ["redirected_from_transaction_state"]
			});
		});
		completenessSectionSchema = z.enum([
			"action",
			"screenshot",
			"dom",
			"accessibility",
			"url",
			"history",
			"storage",
			"events",
			"frames",
			"workers",
			"popups",
			"websockets"
		]);
		browserScenarioEventKindSchema = z.enum([
			"console",
			"page-error",
			"request",
			"response",
			"request-failed",
			"request-finished",
			"request-unfinished",
			"network-content",
			"websocket-opened",
			"websocket-closed",
			"websocket-frame-sent",
			"websocket-frame-received",
			"frame-attached",
			"frame-detached",
			"frame-navigated",
			"worker-created",
			"worker-closed",
			"popup-opened",
			"popup-closed",
			"download-cancelled"
		]);
		browserScenarioEventBudgetReasonSchema = z.enum([
			"max-events",
			"max-event-allocation-bytes",
			"max-total-event-allocation-bytes",
			"max-network-transactions",
			"max-network-metadata-allocation-bytes",
			"max-listener-owners"
		]);
		browserScenarioEventOmissionsSchema = z.strictObject({
			by_kind: z.array(z.strictObject({
				kind: browserScenarioEventKindSchema,
				count: z.int().positive(),
				reasons: z.array(browserScenarioEventBudgetReasonSchema).min(1)
			})),
			network_transactions: z.array(z.strictObject({
				transaction_id: z.string().min(1),
				omitted_kinds: z.array(browserScenarioEventKindSchema).min(1),
				reasons: z.array(browserScenarioEventBudgetReasonSchema).min(1)
			})),
			network_transaction_range: z.strictObject({
				first_transaction_id: z.string().min(1),
				last_transaction_id: z.string().min(1),
				count: z.int().positive(),
				reason: z.literal("max-network-transactions")
			}).nullable()
		});
		browserScenarioCompletenessSchema = z.discriminatedUnion("status", [
			z.strictObject({
				status: z.literal("complete"),
				equality_eligible: z.literal(true),
				missing_sections: emptyArraySchema,
				truncated_sections: emptyArraySchema
			}),
			z.strictObject({
				status: z.literal("incomplete"),
				equality_eligible: z.literal(false),
				missing_sections: z.array(completenessSectionSchema).min(1),
				truncated_sections: emptyArraySchema
			}),
			z.strictObject({
				status: z.literal("truncated"),
				equality_eligible: z.literal(false),
				missing_sections: z.array(completenessSectionSchema),
				truncated_sections: z.array(completenessSectionSchema).min(1)
			})
		]);
		classifyBrowserScenarioCompleteness = (missing, truncated) => {
			const missingSections = [...new Set(missing)].sort();
			const truncatedSections = [...new Set(truncated)].sort();
			if (truncatedSections.length > 0) return browserScenarioCompletenessSchema.parse({
				status: "truncated",
				equality_eligible: false,
				missing_sections: missingSections,
				truncated_sections: truncatedSections
			});
			if (missingSections.length > 0) return browserScenarioCompletenessSchema.parse({
				status: "incomplete",
				equality_eligible: false,
				missing_sections: missingSections,
				truncated_sections: []
			});
			return {
				status: "complete",
				equality_eligible: true,
				missing_sections: [],
				truncated_sections: []
			};
		};
		browserScenarioStepShape = {
			step_index: z.int().min(0),
			step_id: z.string().min(1),
			action: z.string().min(1),
			elapsed_ms: z.int().min(0),
			before_url: sanitizedBrowserUrlSchema,
			after_url: sanitizedBrowserUrlSchema,
			event_sequence_start: z.int().min(1),
			event_sequence_end: z.int().min(0),
			artifacts: browserStepArtifactsSchema,
			completeness: browserScenarioCompletenessSchema
		};
		browserScenarioStepSchema = z.union([z.strictObject({
			...browserScenarioStepShape,
			status: z.literal("completed"),
			error: z.null()
		}), z.strictObject({
			...browserScenarioStepShape,
			status: z.enum(["failed", "cancelled"]),
			error: z.string()
		})]);
	})))();
}

//#endregion
//#region dist/domain/browserScenarioCapture.js
var retainedBrowserScenarioCaptureSchema, browserScenarioCaptureSchema;
function init_browserScenarioCapture() {
	return (init_browserScenarioCapture = __esmMin((() => {
		init_browserNetworkEvidence();
		init_browserScenarioCaptureLimits();
		init_browserScenarioCaptureValues();
		retainedBrowserScenarioCaptureSchema = z.strictObject({
			browser: z.strictObject({
				mode: z.enum(["launch", "connect"]),
				process_ownership: z.enum(["provider-owned", "external"]),
				cleanup: z.enum(["terminated-owned-process", "disconnected-external"]),
				product: z.string().min(1),
				version: z.string().min(1)
			}),
			scenario: z.strictObject({
				start_origin: z.string().min(1),
				action_count: z.int().min(1),
				secret_references: z.array(z.string().min(1)),
				network_content: browserNetworkContentSelectionValuesSchema,
				event_families: z.array(browserScenarioEventFamilySchema).optional(),
				limits: browserScenarioCaptureLimitsValuesSchema
			}),
			duration_ms: z.int().min(0),
			steps: z.array(browserScenarioStepSchema).min(1),
			events: z.strictObject({
				retained: z.int().min(0),
				dropped: z.int().min(0),
				items: z.array(browserScenarioEventSchema),
				omissions: browserScenarioEventOmissionsSchema
			}),
			completeness: browserScenarioCompletenessSchema,
			limitations: z.array(z.string().min(1))
		}).superRefine((capture, context) => {
			const bySequence = new Map(capture.events.items.map((event) => [event.sequence, event]));
			if (bySequence.size !== capture.events.items.length) context.addIssue({
				code: "custom",
				path: ["events", "items"],
				message: "Event sequence numbers must be unique"
			});
			for (const [index, event] of capture.events.items.entries()) {
				if (event.kind !== "network-content") continue;
				const source = bySequence.get(event.source_event_sequence);
				if (source?.kind !== event.phase || source.transaction_id !== event.transaction_id || source.sequence >= event.sequence) context.addIssue({
					code: "custom",
					path: [
						"events",
						"items",
						index,
						"source_event_sequence"
					],
					message: "Network content must reference an earlier matching transaction phase"
				});
			}
			if (capture.events.retained !== capture.events.items.length) context.addIssue({
				code: "custom",
				path: ["events", "retained"],
				message: "Retained event count must equal items length"
			});
			if (capture.events.omissions.by_kind.reduce((count, omission) => count + omission.count, 0) !== capture.events.dropped) context.addIssue({
				code: "custom",
				path: [
					"events",
					"omissions",
					"by_kind"
				],
				message: "Per-kind omission counts must equal the dropped event count"
			});
			if (capture.steps.length !== capture.scenario.action_count + 1) context.addIssue({
				code: "custom",
				path: ["steps"],
				message: "Capture must include initial state and one entry per action"
			});
			const expectedIndices = capture.steps.map((_, index) => index);
			if (capture.steps.some(({ step_index: index }, offset) => index !== expectedIndices[offset])) context.addIssue({
				code: "custom",
				path: ["steps"],
				message: "Step indices must be contiguous from zero"
			});
			if (capture.events.items.some(({ step_index: index }) => index >= capture.steps.length)) context.addIssue({
				code: "custom",
				path: ["events", "items"],
				message: "Event references an unknown step index"
			});
		});
		browserScenarioCaptureSchema = retainedBrowserScenarioCaptureSchema.safeExtend({ scenario: retainedBrowserScenarioCaptureSchema.shape.scenario.extend({ event_families: z.array(browserScenarioEventFamilySchema) }) });
	})))();
}

//#endregion
export { DEFAULT_BROWSER_SCENARIO_CAPTURE_LIMITS, PLAYWRIGHT_RESPONSE_BODY_PROVENANCE_LIMITATION, browserNetworkContentSelectionSchema, browserScenarioCaptureLimitsSchema, browserScenarioCaptureSchema, browserScenarioCompletenessSchema, browserScenarioEventFamilySchema, browserScenarioEventSchema, browserScenarioStepSchema, browserStepArtifactsSchema, captureWebScreenshotInputSchema, classifyBrowserScenarioCompleteness, compareWebScreenshotsInputSchema, createWebScreenshotArtifact, decodeCanonicalBase64, init_browserNetworkEvidence, init_browserScenarioCapture, init_browserScenarioCaptureLimits, init_browserScenarioCaptureValues, init_webScreenshot, retainedBrowserScenarioCaptureSchema, webScreenshotDiffSchema, webScreenshotSchema };