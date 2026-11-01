import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { init_jsonValue, jsonValueSchema } from "./jsonLines-Gf10X4s1.js";
import { z } from "zod";

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
export { analysisCliErrorEnvelopeSchema, analysisErrorProjectionSchema, init_errorSchemas };